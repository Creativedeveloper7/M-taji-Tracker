// Sentinel Hub based satellite imagery service
// Fetches true-color satellite images for a given lat/lng and date,
// uploads them to Supabase Storage, and returns a public URL + metadata.

import fetch from 'node-fetch';
import { supabaseAdmin } from '../lib/database';

export interface SentinelBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SentinelImageResult {
  imageUrl: string;
  acquisitionDate: string;
  bounds: SentinelBounds;
}

const SENTINEL_CLIENT_ID = process.env.SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;

if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) {
  console.warn(
    '⚠️ SENTINEL_CLIENT_ID or SENTINEL_CLIENT_SECRET is not set. ' +
      'Satellite imagery from Sentinel Hub will not work until these are configured in .env.'
  );
}

// Simple in-memory token cache for the Node process
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getSentinelAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) {
    throw new Error('Sentinel Hub credentials are not configured.');
  }

  const resp = await fetch('https://services.sentinel-hub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SENTINEL_CLIENT_ID,
      client_secret: SENTINEL_CLIENT_SECRET,
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to get Sentinel access token: ${resp.status} ${text}`);
  }

  const json: any = await resp.json();
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: now + (json.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
}

// Compute a bounding box around a point using a radius in meters
function computeBounds(lat: number, lng: number, radiusMeters: number): SentinelBounds {
  const latOffset = radiusMeters / 111_320; // ~meters per degree latitude
  const lngOffset = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
}

/**
 * Fetch a true-color Sentinel-2 image for a given location and date,
 * upload it to Supabase Storage, and return the public URL and metadata.
 *
 * NOTE: This uses Sentinel Hub Process API with Sentinel-2 L2A.
 * You must have a Sentinel Hub account and a Processing API subscription.
 */
export async function fetchSatelliteImageByDate(
  lat: number,
  lng: number,
  radiusMeters: number,
  date: string,
  initiativeId?: string,
  windowDays: number = 7
): Promise<SentinelImageResult> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const accessToken = await getSentinelAccessToken();
  const bounds = computeBounds(lat, lng, radiusMeters);

  // Sentinel Hub Process API endpoint
  const url = 'https://services.sentinel-hub.com/api/v1/process';

  // Use a window around the requested date to increase chance of getting data
  const targetDate = date || new Date().toISOString().split('T')[0];
  const center = new Date(targetDate);
  const fromDate = new Date(center);
  fromDate.setDate(fromDate.getDate() - windowDays);
  const toDate = new Date(center);
  toDate.setDate(toDate.getDate() + windowDays);

  const fromTime = `${fromDate.toISOString().split('T')[0]}T00:00:00Z`;
  const toTime = `${toDate.toISOString().split('T')[0]}T23:59:59Z`;

  // Evalscript for true-color RGB output (PNG)
  const evalscript = `
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B03", "B02"],
      units: "REFLECTANCE"
    }],
    output: {
      bands: 3,
      sampleType: "UINT8"
    }
  }
}

function evaluatePixel(sample) {
  return [
    sample.B04 * 255,
    sample.B03 * 255,
    sample.B02 * 255
  ];
}
`.trim();

  const requestBody = {
    input: {
      bounds: {
        bbox: [bounds.west, bounds.south, bounds.east, bounds.north],
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: fromTime,
              to: toTime,
            },
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    output: {
      width: 1024,
      height: 1024,
      responses: [
        {
          identifier: 'default',
          format: {
            type: 'image/png',
          },
        },
      ],
    },
    evalscript,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sentinel Process API error: ${resp.status} ${text}`);
  }

  const buffer = await resp.arrayBuffer();

  // Upload to Supabase Storage (reuse initiative-images bucket)
  const bucket = 'initiative-images';
  const today = new Date().toISOString().slice(0, 10);
  const baseName = initiativeId || 'satellite';
  const filePath = `satellite/${baseName}/${date}-${Date.now()}.png`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, Buffer.from(buffer), {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload satellite image to storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  const imageUrl = publicUrlData.publicUrl;

  return {
    imageUrl,
    acquisitionDate: targetDate,
    bounds,
  };
}

