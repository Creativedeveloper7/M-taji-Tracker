# Political Figure Registration System

## Overview

The political figure registration system allows Governors, MPs, Senators, and MCAs to create profiles and upload their manifestos for automatic matching with relevant initiatives.

## Files Created

### 1. Type Definitions
**`src/types/politicalFigure.ts`**
- `PoliticalPosition` type: 'governor' | 'mp' | 'senator' | 'mca'
- `PoliticalFigure` interface: Complete profile structure
- `ManifestoAnalysis` interface: AI analysis results

### 2. Location Data
**`src/data/kenya-locations.ts`**
- `KENYA_COUNTIES`: Array of all 47 counties with codes
- `constituenciesByCounty`: Mapping of counties to constituencies
- `getConstituenciesByCounty()`: Helper function

### 3. Registration Component
**`src/components/PoliticalFigureRegistration.tsx`**
- Multi-step form (4 steps)
- Progress indicator
- File upload and text input for manifestos
- Automatic term end date calculation

## Usage

### Basic Example

```typescript
import { PoliticalFigureRegistration } from '../components/PoliticalFigureRegistration';
import { PoliticalFigure } from '../types/politicalFigure';

function PoliticalRegistrationPage() {
  const handleComplete = (profile: Partial<PoliticalFigure>) => {
    console.log('Profile data:', profile);
    // Save to database, process manifesto, etc.
  };

  return (
    <PoliticalFigureRegistration 
      onComplete={handleComplete}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## Registration Flow

### Step 1: Basic Information
- Full Name
- Position (Governor, MP, Senator, MCA)

### Step 2: Jurisdiction
- County (required for all)
- Constituency (required for MP, Senator, MCA)
- Ward (required for MCA only)

### Step 3: Term Information
- Term Start Date
- Term End Date (auto-calculated: +5 years)

### Step 4: Manifesto Upload
- File upload (PDF, DOC, DOCX, TXT)
- OR paste text directly
- AI will analyze for matching initiatives

## Data Structure

### PoliticalFigure Interface

```typescript
{
  id: string;
  user_id: string;
  name: string;
  position: 'governor' | 'mp' | 'senator' | 'mca';
  county?: string;
  constituency?: string;
  ward?: string;
  term_start: string; // ISO date
  term_end: string; // ISO date
  term_years: number; // 5
  manifesto: {
    document_url?: string;
    text: string;
    uploaded_at: string;
    focus_areas: Array<{
      category: string;
      priority: number;
      commitments: string[];
      keywords: string[];
    }>;
    targets: Array<{
      description: string;
      quantity?: number;
      category: string;
      location?: string;
    }>;
  };
  commissioned_projects: string[]; // Initiative IDs
  total_investment: number;
  projects_by_category: {
    agriculture: number;
    water: number;
    health: number;
    education: number;
    infrastructure: number;
    economic: number;
  };
  status: 'active' | 'inactive' | 'seeking_reelection';
}
```

## Next Steps

1. **Database Schema**: Create `political_figures` table in Supabase
2. **Manifesto Processing**: Implement AI analysis service
3. **Matching Algorithm**: Match initiatives to political figures based on:
   - Geographic jurisdiction
   - Manifesto focus areas
   - Category alignment
4. **Profile Dashboard**: Display political figure's commissioned projects
5. **Analytics**: Track investment and project distribution

## Integration Points

- **Initiative Matching**: Match initiatives to political figures in their jurisdiction
- **Satellite Monitoring**: Track projects commissioned by political figures
- **Progress Tracking**: Show how manifesto commitments align with actual projects
- **Public Accountability**: Display political figure's track record

## Example: Adding to Navigation

```typescript
// In Header.tsx or Navigation component
<Link to="/political-figures/register">
  Register as Political Figure
</Link>
```

## Example: Creating a Page

```typescript
// src/pages/PoliticalFigureRegister.tsx
import { PoliticalFigureRegistration } from '../components/PoliticalFigureRegistration';
import { createPoliticalFigure } from '../services/politicalFigures';

export default function PoliticalFigureRegister() {
  const handleComplete = async (profile: Partial<PoliticalFigure>) => {
    try {
      await createPoliticalFigure(profile);
      // Redirect or show success
    } catch (error) {
      console.error('Failed to register:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PoliticalFigureRegistration onComplete={handleComplete} />
    </div>
  );
}
```

