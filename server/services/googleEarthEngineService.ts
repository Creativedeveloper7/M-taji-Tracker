// Google Earth Engine satellite imagery service
// PRODUCTION VERSION – NO getThumbURL, NO artificial sharpening

import ee from '@google/earthengine';
import { SatelliteSnapshot } from './types';

// ================================
// ENV CONFIG
// ================================
const GEE_PROJECT_ID = process.env.GEE_PROJECT_ID;
const GEE_SERVICE_ACCOUNT_KEY = process.env.GEE_SERVICE_ACCOUNT_KEY;

let eeInitialized = false;
let eeInitError: string | null = null;

// ================================
// TYPES
// ================================
export interface GEEBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GEEMapResult {
  tileUrl: string;
  acquisitionDate: string;
  bounds: GEEBounds;
  cloudCoverage?: number;
}

// ================================
// INIT
// ================================
async function initializeEE(): Promise<void> {
  if (eeInitialized) return;

  if (!GEE_PROJECT_ID || !GEE_SERVICE_ACCOUNT_KEY) {
    eeInitError = 'GEE_PROJECT_ID or GEE_SERVICE_ACCOUNT_KEY missing';
    throw new Error(eeInitError);
  }

  return new Promise((resolve, reject) => {
    try {
      const credentials = JSON.parse(GEE_SERVICE_ACCOUNT_KEY);

      ee.data.authenticateViaPrivateKey(
        {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        () => {
          ee.initialize(
            null,
            null,
            () => {
              eeInitialized = true;
              console.log('✅ Google Earth Engine initialized');
              resolve();
            },
            err => {
              eeInitError = err.message;
              reject(err);
            }
          );
        },
        err => {
          eeInitError = err.message;
          reject(err);
        }
      );
    } catch (err: any) {
      eeInitError = err.message;
      reject(err);
    }
  });
}

// ================================
// BOUNDS
// ================================
function computeBounds(
  lat: number,
  lng: number,
  radiusMeters: number
): GEEBounds {
  // Use a smaller minimum radius so the initiative
  // occupies more of the frame (visually sharper)
  const radius = Math.max(radiusMeters, 300);
  const latOffset = radius / 111_320;
  const lngOffset = radius / (111_320 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
}

// ================================
// SENTINEL-2 TILES (MAIN FIX)
// ================================
export async function fetchGEEMapTiles(
  lat: number,
  lng: number,
  radiusMeters: number,
  targetDate: string,
  windowDays = 30
): Promise<GEEMapResult> {
  await initializeEE();

  const bounds = computeBounds(lat, lng, radiusMeters);
  const region = ee.Geometry.Rectangle([
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  ]);

  const center = ee.Date(targetDate);
  const start = center.advance(-windowDays, 'day');
  const end = center.advance(windowDays, 'day');

  const collection = ee
    .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(region)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .sort('CLOUDY_PIXEL_PERCENTAGE');

  const image = ee.Image(collection.first());

  const visualized = image.visualize({
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 2800,
    gamma: 1.2,
  });

  const map = visualized.getMap({
    scale: 10, // 🔑 TRUE Sentinel-2 resolution
    maxPixels: 1e13,
  });

  return {
    tileUrl: `https://earthengine.googleapis.com/map/${map.mapid}/{z}/{x}/{y}?token=${map.token}`,
    acquisitionDate: targetDate,
    bounds,
  };
}

// ================================
// LANDSAT FALLBACK (30m)
// ================================
export async function fetchGEELandsatTiles(
  lat: number,
  lng: number,
  radiusMeters: number,
  targetDate: string,
  windowDays = 30
): Promise<GEEMapResult> {
  await initializeEE();

  const bounds = computeBounds(lat, lng, radiusMeters);
  const region = ee.Geometry.Rectangle([
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  ]);

  const center = ee.Date(targetDate);
  const start = center.advance(-windowDays, 'day');
  const end = center.advance(windowDays, 'day');

  const collection = ee
    .ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(region)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUD_COVER', 20))
    .sort('CLOUD_COVER');

  const image = ee.Image(collection.first());

  const visualized = image.visualize({
    bands: ['SR_B4', 'SR_B3', 'SR_B2'],
    min: 7000,
    max: 18000,
    gamma: 1.3,
  });

  const map = visualized.getMap({
    scale: 30,
    maxPixels: 1e13,
  });

  return {
    tileUrl: `https://earthengine.googleapis.com/map/${map.mapid}/{z}/{x}/{y}?token=${map.token}`,
    acquisitionDate: targetDate,
    bounds,
  };
}

// ================================
// SNAPSHOT WRAPPER (USED BY ROUTES)
// ================================
export async function captureGEESnapshot(
  lat: number,
  lng: number,
  radiusMeters = 500,
  date?: string
): Promise<SatelliteSnapshot> {
  const targetDate = date || new Date().toISOString().slice(0, 10);

  try {
    const result = await fetchGEEMapTiles(
      lat,
      lng,
      radiusMeters,
      targetDate
    );

    return {
      date: result.acquisitionDate,
      imageUrl: result.tileUrl, // 🔑 TILE URL
      bounds: result.bounds,
      cloudCoverage: 0,
    };
  } catch (err) {
    const fallback = await fetchGEELandsatTiles(
      lat,
      lng,
      radiusMeters,
      targetDate
    );

    return {
      date: fallback.acquisitionDate,
      imageUrl: fallback.tileUrl,
      bounds: fallback.bounds,
      cloudCoverage: 0,
    };
  }
}

// ================================
// HISTORICAL
// ================================
export async function getGEEHistoricalSnapshots(
  lat: number,
  lng: number,
  radiusMeters: number,
  startDate: string,
  endDate: string,
  intervalDays = 30
): Promise<SatelliteSnapshot[]> {
  const snapshots: SatelliteSnapshot[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);

    try {
      const snap = await captureGEESnapshot(
        lat,
        lng,
        radiusMeters,
        dateStr
      );
      snapshots.push(snap);
    } catch {
      // skip
    }

    cursor.setDate(cursor.getDate() + intervalDays);
  }

  return snapshots;
}

// ================================
// STATUS
// ================================
export async function checkGEEStatus() {
  if (!GEE_PROJECT_ID || !GEE_SERVICE_ACCOUNT_KEY) {
    return {
      configured: false,
      authenticated: false,
      error: 'Missing GEE configuration',
    };
  }

  try {
    await initializeEE();
    return {
      configured: true,
      authenticated: true,
    };
  } catch (err: any) {
    return {
      configured: true,
      authenticated: false,
      error: err.message,
    };
  }
}
