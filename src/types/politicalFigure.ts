export type PoliticalPosition = 'governor' | 'mp' | 'senator' | 'mca'; // MCA = Member of County Assembly

export interface PoliticalFigure {
  id: string;
  user_id: string; // Links to main user account
  name: string;
  position: PoliticalPosition;
  
  // Geographic jurisdiction
  county?: string; // For governors
  constituency?: string; // For MPs
  ward?: string; // For MCAs
  
  // Term information
  term_start: string; // ISO date
  term_end: string; // ISO date
  term_years: number; // 5 or 7 years
  
  // Manifesto
  manifesto: {
    document_url?: string; // PDF/DOC link
    text: string; // Full text
    uploaded_at: string;
    parsed_at?: string;
    
    // AI-extracted information
    focus_areas: Array<{
      category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic';
      priority: number; // 1-5, 5 being highest
      commitments: string[]; // Specific promises
      keywords: string[];
    }>;
    
    // Specific targets mentioned
    targets: Array<{
      description: string; // e.g., "Build 10 schools"
      quantity?: number;
      category: string;
      location?: string; // Specific area mentioned
    }>;
  };
  
  // Commissioned projects tracking
  commissioned_projects: string[]; // Initiative IDs
  total_investment: number; // Total KES donated/invested
  
  // Activity
  projects_by_category: {
    agriculture: number;
    water: number;
    health: number;
    education: number;
    infrastructure: number;
    economic: number;
  };
  
  // Status
  status: 'active' | 'inactive' | 'seeking_reelection';
  created_at: string;
  updated_at: string;
}

export interface ManifestoAnalysis {
  summary: string; // AI-generated summary
  main_themes: string[];
  focus_areas: Array<{
    category: string;
    priority: number;
    commitments: string[];
  }>;
  specific_targets: Array<{
    description: string;
    quantity?: number;
    category: string;
  }>;
  geographic_focus: string[]; // Areas mentioned
  keywords: string[];
}

