// Shared types for satellite services

export interface SatelliteSnapshot {
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

export interface SnapshotRequest {
  lat: number;
  lng: number;
  radiusMeters?: number;
  date?: string;
}

export interface HistoricalRequest {
  lat: number;
  lng: number;
  radiusMeters?: number;
  startDate: string;
  endDate: string;
  intervalDays?: number;
}


