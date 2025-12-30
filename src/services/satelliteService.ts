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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Calculate bounds based on radius (rough approximation)
    const latOffset = (radiusMeters / 111000); // 1 degree ≈ 111km
    const lngOffset = radiusMeters / (111000 * Math.cos(lat * Math.PI / 180));

    // Use Mapbox satellite imagery as placeholder
    const zoom = 17;
    const size = '512x512';
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.your-token-here';
    
    return {
      date: targetDate,
      imageUrl: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${zoom}/${size}@2x?access_token=${mapboxToken}`,
      cloudCoverage: Math.random() * 15, // Random 0-15%
      bounds: {
        north: lat + latOffset,
        south: lat - latOffset,
        east: lng + lngOffset,
        west: lng - lngOffset
      }
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

    return snapshots;
  }
}

export const satelliteService = new ClientSatelliteService();
export type { SatelliteSnapshot };


