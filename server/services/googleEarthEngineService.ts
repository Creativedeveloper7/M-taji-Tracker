// Google Earth Engine satellite imagery service
// Uses the official @google/earthengine SDK for proper expression serialization

import fetch from 'node-fetch';
import ee from '@google/earthengine';
import { supabaseAdmin } from '../lib/database';
import { SatelliteSnapshot } from './types';

// GEE Configuration
const GEE_PROJECT_ID = process.env.GEE_PROJECT_ID;
const GEE_SERVICE_ACCOUNT_KEY = process.env.GEE_SERVICE_ACCOUNT_KEY;

// Check configuration
if (!GEE_PROJECT_ID) {
  console.warn(
    '⚠️ GEE_PROJECT_ID is not set. Google Earth Engine service will not work until configured in .env.'
  );
}

// Initialization state
let eeInitialized = false;
let eeInitError: string | null = null;

export interface GEEBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GEEImageResult {
  imageUrl: string;
  acquisitionDate: string;
  bounds: GEEBounds;
  cloudCoverage?: number;
}

/**
 * Initialize Earth Engine with service account credentials
 */
async function initializeEE(): Promise<void> {
  if (eeInitialized) return;
  
  if (!GEE_SERVICE_ACCOUNT_KEY || !GEE_PROJECT_ID) {
    eeInitError = 'GEE_SERVICE_ACCOUNT_KEY or GEE_PROJECT_ID not configured';
    throw new Error(eeInitError);
  }

  return new Promise((resolve, reject) => {
    try {
      let credentials;
      
      // Parse credentials from JSON string or file path
      if (GEE_SERVICE_ACCOUNT_KEY.startsWith('{')) {
        credentials = JSON.parse(GEE_SERVICE_ACCOUNT_KEY);
      } else {
        // It's a file path
        const fs = require('fs');
        const keyContent = fs.readFileSync(GEE_SERVICE_ACCOUNT_KEY, 'utf-8');
        credentials = JSON.parse(keyContent);
      }

      // Create private key for EE authentication
      const privateKey = {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      };

      // Initialize Earth Engine
      ee.data.authenticateViaPrivateKey(
        privateKey,
        () => {
          ee.initialize(
            null,
            null,
            () => {
              console.log('✅ Google Earth Engine initialized successfully');
              eeInitialized = true;
              resolve();
            },
            (error: Error) => {
              eeInitError = `EE initialization failed: ${error.message}`;
              console.error('❌', eeInitError);
              reject(new Error(eeInitError));
            }
          );
        },
        (error: Error) => {
          eeInitError = `EE authentication failed: ${error.message}`;
          console.error('❌', eeInitError);
          reject(new Error(eeInitError));
        }
      );
    } catch (error: any) {
      eeInitError = `Failed to parse credentials: ${error.message}`;
      console.error('❌', eeInitError);
      reject(new Error(eeInitError));
    }
  });
}

/**
 * Compute bounding box around a point
 * Optimized for clear satellite imagery
 */
function computeBounds(lat: number, lng: number, radiusMeters: number): GEEBounds {
  // Use 800m radius - small enough for detail, large enough for context
  // At 10m Sentinel-2 resolution with 1200px output = ~6.7m effective resolution
  const effectiveRadius = Math.max(radiusMeters, 800);
  
  const latOffset = effectiveRadius / 111_320;
  const lngOffset = effectiveRadius / (111_320 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
}

/**
 * Fetch satellite image using Earth Engine SDK
 * This method uses getThumbURL which is simpler and doesn't require REST API serialization
 */
export async function fetchGEEImage(
  lat: number,
  lng: number,
  radiusMeters: number,
  targetDate: string,
  initiativeId?: string,
  windowDays: number = 30
): Promise<GEEImageResult> {
  await initializeEE();

  const bounds = computeBounds(lat, lng, radiusMeters);
  
  // Calculate date window
  const center = new Date(targetDate);
  const fromDate = new Date(center);
  fromDate.setDate(fromDate.getDate() - windowDays);
  const toDate = new Date(center);
  toDate.setDate(toDate.getDate() + windowDays);

  const startDateStr = fromDate.toISOString().split('T')[0];
  const endDateStr = toDate.toISOString().split('T')[0];

  console.log(`🛰️ Fetching GEE image for ${targetDate} (window: ${startDateStr} to ${endDateStr})`);

  return new Promise((resolve, reject) => {
    try {
      // Create region geometry
      const region = ee.Geometry.Rectangle([
        bounds.west, bounds.south, bounds.east, bounds.north
      ]);

      // Get Sentinel-2 collection, filtered and composited
      const collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(region)
        .filterDate(startDateStr, endDateStr)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Stricter cloud filter
        .select(['B4', 'B3', 'B2']); // RGB bands

      // Create median composite and apply sharpening
      let image = collection.median().clip(region);
      
      // Apply unsharp mask for sharpening (enhances edges)
      const gaussian = image.convolve(ee.Kernel.gaussian({
        radius: 1,
        sigma: 0.5,
        units: 'pixels',
        normalize: true,
      }));
      
      // Sharpen: original + (original - blurred) * amount
      const sharpened = image.add(image.subtract(gaussian).multiply(0.5));
      image = sharpened;

      // Visualization parameters - high resolution output
      const visParams = {
        bands: ['B4', 'B3', 'B2'],
        min: 0,
        max: 2800, // Slightly lower max for better contrast
        gamma: 1.3,
        dimensions: 1200, // High resolution output
        region: region,
        format: 'png',
      };

      // Get thumbnail URL
      image.getThumbURL(visParams, async (thumbUrl: string, error: Error) => {
        if (error) {
          console.error('❌ Error getting thumbnail URL:', error);
          reject(error);
          return;
        }

        if (!thumbUrl) {
          reject(new Error('No thumbnail URL returned from Earth Engine'));
          return;
        }

        console.log(`📸 Got GEE thumbnail URL: ${thumbUrl.substring(0, 80)}...`);

        try {
          // Download the image
          const response = await fetch(thumbUrl);
          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
          }

          const imageBuffer = await response.arrayBuffer();

          // Upload to Supabase Storage
          if (!supabaseAdmin) {
            throw new Error('Supabase admin client not initialized');
          }

          const bucket = 'initiative-images';
          const baseName = initiativeId || 'satellite';
          const filePath = `satellite/${baseName}/${targetDate}-gee-${Date.now()}.png`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, Buffer.from(imageBuffer), {
              contentType: 'image/png',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Failed to upload to storage: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          const imageUrl = publicUrlData.publicUrl;

          console.log(`✅ GEE image saved: ${imageUrl}`);

          resolve({
            imageUrl,
            acquisitionDate: targetDate,
            bounds,
            cloudCoverage: 0,
          });
        } catch (downloadError: any) {
          console.error('❌ Error downloading/uploading image:', downloadError);
          reject(downloadError);
        }
      });
    } catch (error: any) {
      console.error('❌ Error creating GEE computation:', error);
      reject(error);
    }
  });
}

/**
 * Alternative: Use Landsat 8/9 for areas without Sentinel-2 coverage
 */
export async function fetchGEELandsatImage(
  lat: number,
  lng: number,
  radiusMeters: number,
  targetDate: string,
  initiativeId?: string,
  windowDays: number = 30
): Promise<GEEImageResult> {
  await initializeEE();

  const bounds = computeBounds(lat, lng, radiusMeters);
  
  const center = new Date(targetDate);
  const fromDate = new Date(center);
  fromDate.setDate(fromDate.getDate() - windowDays);
  const toDate = new Date(center);
  toDate.setDate(toDate.getDate() + windowDays);

  const startDateStr = fromDate.toISOString().split('T')[0];
  const endDateStr = toDate.toISOString().split('T')[0];

  console.log(`🛰️ Fetching GEE Landsat image for ${targetDate}`);

  return new Promise((resolve, reject) => {
    try {
      const region = ee.Geometry.Rectangle([
        bounds.west, bounds.south, bounds.east, bounds.north
      ]);

      // Use Landsat 8/9 Collection 2
      const collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
        .filterBounds(region)
        .filterDate(startDateStr, endDateStr)
        .filter(ee.Filter.lt('CLOUD_COVER', 20))
        .select(['SR_B4', 'SR_B3', 'SR_B2']); // RGB bands

      let image = collection.median().clip(region);
      
      // Apply sharpening
      const gaussian = image.convolve(ee.Kernel.gaussian({
        radius: 1,
        sigma: 0.5,
        units: 'pixels',
        normalize: true,
      }));
      image = image.add(image.subtract(gaussian).multiply(0.5));

      const visParams = {
        bands: ['SR_B4', 'SR_B3', 'SR_B2'],
        min: 7000,
        max: 18000,
        gamma: 1.3,
        dimensions: 1200,
        region: region,
        format: 'png',
      };

      image.getThumbURL(visParams, async (thumbUrl: string, error: Error) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const response = await fetch(thumbUrl);
          const imageBuffer = await response.arrayBuffer();

          if (!supabaseAdmin) {
            throw new Error('Supabase admin client not initialized');
          }

          const bucket = 'initiative-images';
          const baseName = initiativeId || 'satellite';
          const filePath = `satellite/${baseName}/${targetDate}-landsat-${Date.now()}.png`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, Buffer.from(imageBuffer), {
              contentType: 'image/png',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

          resolve({
            imageUrl: publicUrlData.publicUrl,
            acquisitionDate: targetDate,
            bounds,
            cloudCoverage: 0,
          });
        } catch (downloadError: any) {
          reject(downloadError);
        }
      });
    } catch (error: any) {
      reject(error);
    }
  });
}

/**
 * Capture a single snapshot using Google Earth Engine
 * Tries Sentinel-2 first, falls back to Landsat
 */
export async function captureGEESnapshot(
  lat: number,
  lng: number,
  radiusMeters: number = 500,
  date?: string,
  initiativeId?: string
): Promise<SatelliteSnapshot> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    // Try Sentinel-2 first (higher resolution)
    const result = await fetchGEEImage(lat, lng, radiusMeters, targetDate, initiativeId);
    return {
      date: result.acquisitionDate,
      imageUrl: result.imageUrl,
      cloudCoverage: result.cloudCoverage || 0,
      bounds: result.bounds,
    };
  } catch (sentinelError: any) {
    console.warn(`⚠️ Sentinel-2 failed, trying Landsat: ${sentinelError.message}`);
    
    // Fall back to Landsat
    const result = await fetchGEELandsatImage(lat, lng, radiusMeters, targetDate, initiativeId);
    return {
      date: result.acquisitionDate,
      imageUrl: result.imageUrl,
      cloudCoverage: result.cloudCoverage || 0,
      bounds: result.bounds,
    };
  }
}

/**
 * Get historical snapshots using Google Earth Engine
 */
export async function getGEEHistoricalSnapshots(
  lat: number,
  lng: number,
  radiusMeters: number = 500,
  startDate: string,
  endDate: string,
  intervalDays: number = 30,
  initiativeId?: string
): Promise<SatelliteSnapshot[]> {
  const snapshots: SatelliteSnapshot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cursor = new Date(start);

  console.log(`🛰️ Fetching GEE historical snapshots from ${startDate} to ${endDate}`);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().split('T')[0];
    
    try {
      const snapshot = await captureGEESnapshot(lat, lng, radiusMeters, dateStr, initiativeId);
      snapshots.push(snapshot);
      console.log(`✅ Got GEE snapshot for ${dateStr}`);
    } catch (error: any) {
      console.error(`⚠️ Failed to get GEE snapshot for ${dateStr}:`, error.message);
      // Continue with next date
    }
    
    cursor.setDate(cursor.getDate() + intervalDays);
  }

  console.log(`📊 Fetched ${snapshots.length} GEE historical snapshots`);
  return snapshots;
}

/**
 * Check if GEE service is configured and working
 */
export async function checkGEEStatus(): Promise<{
  configured: boolean;
  authenticated: boolean;
  error?: string;
}> {
  if (!GEE_PROJECT_ID || !GEE_SERVICE_ACCOUNT_KEY) {
    return {
      configured: false,
      authenticated: false,
      error: 'GEE_PROJECT_ID or GEE_SERVICE_ACCOUNT_KEY not set',
    };
  }

  try {
    await initializeEE();
    return {
      configured: true,
      authenticated: eeInitialized,
    };
  } catch (error: any) {
    return {
      configured: true,
      authenticated: false,
      error: error.message,
    };
  }
}
