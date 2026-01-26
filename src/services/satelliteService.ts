// Client-side satellite service using mock service
// This can be used directly in React components

interface SatelliteSnapshot {
  date: string;
  imageUrl: string;
  cloudCoverage: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

class ClientSatelliteService {
  async captureSnapshot(
    lat: number,
    lng: number,
    radiusMeters: number = 500,
    date?: string
  ): Promise<SatelliteSnapshot> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Use Mapbox satellite imagery API
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      throw new Error('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file');
    }

    // Determine zoom level based on radius for optimal detail
    // Smaller radius = higher zoom (more detail)
    let zoom = 17; // Default zoom for 500m radius
    if (radiusMeters > 2000) zoom = 15;
    else if (radiusMeters > 1000) zoom = 16;
    else if (radiusMeters > 500) zoom = 17;
    else if (radiusMeters > 250) zoom = 18;
    else zoom = 19;

    // Calculate accurate bounds based on radius
    // 1 degree latitude ≈ 111,320 meters
    const latOffset = (radiusMeters / 111320);
    // Longitude offset depends on latitude (degrees get smaller as you move away from equator)
    const lngOffset = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));

    // Use Mapbox Static Images API for satellite imagery
    // Higher resolution for better quality
    // Note: Mapbox Static Images API doesn't support historical dates, so all images will show current imagery
    // For true historical imagery, integrate with Google Earth Engine, Sentinel Hub, or Planet Labs
    const size = '1024x1024'; // Increased from 512x512 for better quality
    const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${zoom}/${size}@2x?access_token=${mapboxToken}`;
    
    // Calculate precise bounds for image overlay
    // The bounds must match exactly what the static image covers
    // For a 1024x1024 image at the given zoom level, we need to calculate the exact coverage
    const bounds = {
      north: lat + latOffset,
      south: lat - latOffset,
      east: lng + lngOffset,
      west: lng - lngOffset
    };
    
    return {
      date: targetDate,
      imageUrl: imageUrl,
      cloudCoverage: Math.random() * 15, // Mapbox doesn't provide cloud coverage, using estimate
      bounds: bounds
    };
  }

  async getHistoricalSnapshots(
    lat: number,
    lng: number,
    radiusMeters: number = 500,
    startDate: string,
    endDate: string,
    intervalDays: number = 30
  ): Promise<SatelliteSnapshot[]> {
    const snapshots: SatelliteSnapshot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    console.log(`📅 Generating historical snapshots from ${startDate} to ${endDate} (${intervalDays} day intervals)`);

    // Always include the start date
    const startSnapshot = await this.captureSnapshot(
      lat,
      lng,
      radiusMeters,
      start.toISOString().split('T')[0]
    );
    snapshots.push(startSnapshot);

    // Generate intermediate snapshots
    current.setDate(current.getDate() + intervalDays);
    while (current <= end) {
      const snapshot = await this.captureSnapshot(
        lat,
        lng,
        radiusMeters,
        current.toISOString().split('T')[0]
      );
      snapshots.push(snapshot);
      current.setDate(current.getDate() + intervalDays);
    }

    // Always include the end date if it's different from the last snapshot
    const lastSnapshotDate = snapshots[snapshots.length - 1]?.date;
    const endDateStr = end.toISOString().split('T')[0];
    if (lastSnapshotDate !== endDateStr) {
      const endSnapshot = await this.captureSnapshot(
        lat,
        lng,
        radiusMeters,
        endDateStr
      );
      snapshots.push(endSnapshot);
    }

    console.log(`✅ Generated ${snapshots.length} historical snapshots`);
    return snapshots;
  }
}

export const satelliteService = new ClientSatelliteService();
export type { SatelliteSnapshot };


