// Client-side service for manifesto analysis
// Calls the backend API endpoint

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ManifestoAnalysis {
  summary: string;
  main_themes: string[];
  focus_areas: Array<{
    category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic';
    priority: number;
    commitments: string[];
    keywords: string[];
  }>;
  specific_targets: Array<{
    description: string;
    quantity?: number;
    category: string;
    location?: string;
  }>;
  geographic_focus: string[];
}

export interface MatchedInitiative {
  initiative: any;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Analyze manifesto text or file
 */
export async function analyzeManifesto(
  manifesto: string | File,
  jurisdiction: {
    position: string;
    county?: string;
    constituency?: string;
  }
): Promise<ManifestoAnalysis> {
  const formData = new FormData();

  if (manifesto instanceof File) {
    formData.append('manifesto', manifesto);
  } else {
    formData.append('manifesto_text', manifesto);
  }

  formData.append('position', jurisdiction.position);
  if (jurisdiction.county) {
    formData.append('county', jurisdiction.county);
  }
  if (jurisdiction.constituency) {
    formData.append('constituency', jurisdiction.constituency);
  }

  try {
    console.log('📡 Calling manifesto analysis API:', `${API_BASE_URL}/api/political/analyze-manifesto`);
    
    const response = await fetch(`${API_BASE_URL}/api/political/analyze-manifesto`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = 'Failed to analyze manifesto';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      
      // Provide helpful error messages based on status code
      // Status 0 means connection failed (server not running)
      if (response.status === 0) {
        errorMessage = 'Server is not responding. Please ensure the backend server is running on port 3001.';
      } else if (response.status === 404) {
        errorMessage = 'API endpoint not found. Please check server configuration.';
      } else if (response.status === 400) {
        errorMessage = errorMessage || 'Invalid request. Please check your input.';
      }
      // For 500 errors, use the error message from the server (already extracted above)
      // Don't override it with a generic "server not responding" message
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to server at ${API_BASE_URL}. ` +
        `Please ensure the backend server is running: npm run server:dev`
      );
    }
    throw error;
  }
}

/**
 * Get matched initiatives for a manifesto analysis
 */
export async function getMatchedInitiatives(
  manifestoAnalysis: ManifestoAnalysis,
  jurisdiction: {
    county?: string;
    constituency?: string;
  }
): Promise<MatchedInitiative[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/political/matched-initiatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        manifestoAnalysis,
        jurisdiction
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to match initiatives';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to server at ${API_BASE_URL}. ` +
        `Please ensure the backend server is running: npm run server:dev`
      );
    }
    throw error;
  }
}

