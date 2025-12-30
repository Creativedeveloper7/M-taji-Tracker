// Real Google Earth Engine satellite service
// This will be implemented once GEE credentials are approved

import { SatelliteSnapshot } from './types';

export class SatelliteService {
  async captureSnapshot(
    lat: number,
    lng: number,
    radiusMeters: number = 500,
    date?: string
  ): Promise<SatelliteSnapshot> {
    // TODO: Implement Google Earth Engine integration
    // This will use the GEE API to capture actual satellite imagery
    
    throw new Error('Google Earth Engine service not yet implemented. Use mock service for now.');
  }

  async getHistoricalSnapshots(
    lat: number,
    lng: number,
    radiusMeters: number = 500,
    startDate: string,
    endDate: string,
    intervalDays: number = 30
  ): Promise<SatelliteSnapshot[]> {
    // TODO: Implement historical snapshot retrieval from GEE
    
    throw new Error('Google Earth Engine service not yet implemented. Use mock service for now.');
  }
}

export const satelliteService = new SatelliteService();

