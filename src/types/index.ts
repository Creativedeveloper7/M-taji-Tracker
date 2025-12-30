export interface Initiative {
  id: string;
  changemaker_id: string;
  title: string;
  short_description?: string;
  description: string;
  category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic';
  target_amount: number;
  raised_amount: number;
  location: {
    county: string;
    constituency: string;
    specific_area: string;
    coordinates: { lat: number; lng: number };
    geofence?: Array<{ lat: number; lng: number }>; // Polygon for project boundary
  };
  project_duration: string; // e.g., "6 months"
  expected_completion: string; // ISO date
  milestones: Array<{
    id: string;
    title: string;
    target_date: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  reference_images: string[]; // URLs
  status: 'draft' | 'published' | 'active' | 'completed' | 'stalled';
  created_at: string;
  updated_at: string;
  payment_details: {
    method: 'mpesa' | 'bank';
    mpesa_number?: string;
    bank_account?: string;
    bank_name?: string;
    bank_branch?: string;
  };
  satellite_snapshots?: Array<{
    date: string;
    imageUrl: string;
    cloudCoverage: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    captured_at: string;
    ai_analysis?: {
      status: 'baseline' | 'progress' | 'stalled' | 'completed';
      changePercentage?: number;
      notes: string;
    };
  }>;
}

// Legacy interface for backward compatibility with existing data
export interface LegacyInitiative {
  id: string;
  title: string;
  category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic';
  location: { lat: number; lng: number };
  county: string;
  targetAmount: number;
  raisedAmount: number;
  status: 'active' | 'completed' | 'stalled';
  description?: string;
}

// Export political figure types
export * from './politicalFigure';

