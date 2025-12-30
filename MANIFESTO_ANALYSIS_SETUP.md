# Manifesto Analysis Service Setup

This service uses OpenAI's GPT-4o to analyze political manifestos and extract structured information, then matches them with relevant initiatives.

## Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Server Running**: Ensure the backend server is running on port 3001 (or configure `VITE_API_URL`)

## Environment Variables

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_API_URL=http://localhost:3001  # Optional, defaults to localhost:3001
```

## API Endpoints

### 1. Analyze Manifesto

**POST** `/api/political/analyze-manifesto`

Analyzes a manifesto file or text and extracts structured information.

**Request:**
- **File Upload** (multipart/form-data):
  - `manifesto`: PDF, DOCX, or TXT file (max 10MB)
  - `position`: Political position (`governor`, `mp`, `senator`, `mca`)
  - `county`: County name (optional)
  - `constituency`: Constituency name (optional)

- **Text Input** (multipart/form-data):
  - `manifesto_text`: Plain text manifesto content
  - `position`: Political position
  - `county`: County name (optional)
  - `constituency`: Constituency name (optional)

**Response:**
```json
{
  "summary": "A 2-3 sentence summary of the main vision",
  "main_themes": ["theme1", "theme2"],
  "focus_areas": [
    {
      "category": "education",
      "priority": 5,
      "commitments": ["Build 10 new schools", "Improve teacher training"],
      "keywords": ["schools", "education", "students"]
    }
  ],
  "specific_targets": [
    {
      "description": "Build 10 new schools",
      "quantity": 10,
      "category": "education",
      "location": "Nairobi County"
    }
  ],
  "geographic_focus": ["Nairobi", "Westlands", "Kasarani"]
}
```

### 2. Get Matched Initiatives

**POST** `/api/political/matched-initiatives`

Matches a manifesto analysis with relevant initiatives in the jurisdiction.

**Request:**
```json
{
  "manifestoAnalysis": {
    "summary": "...",
    "focus_areas": [...],
    "specific_targets": [...],
    "geographic_focus": [...]
  },
  "jurisdiction": {
    "county": "Nairobi",
    "constituency": "Westlands" // optional
  }
}
```

**Response:**
```json
[
  {
    "initiative": {
      "id": "...",
      "title": "...",
      "category": "education",
      ...
    },
    "matchScore": 85,
    "matchReasons": [
      "Aligns with education focus (Priority: 5/5)",
      "Matches keywords: schools, education",
      "Currently seeking funding"
    ]
  }
]
```

## Usage in Frontend

```typescript
import { analyzeManifesto, getMatchedInitiatives } from './services/manifestoAnalysisService';

// Analyze a file
const file = event.target.files[0];
const analysis = await analyzeManifesto(file, {
  position: 'governor',
  county: 'Nairobi'
});

// Or analyze text
const analysis = await analyzeManifesto(manifestoText, {
  position: 'mp',
  county: 'Nairobi',
  constituency: 'Westlands'
});

// Get matched initiatives
const matches = await getMatchedInitiatives(analysis, {
  county: 'Nairobi',
  constituency: 'Westlands'
});
```

## Integration with Political Figure Registration

The manifesto analysis should be integrated into the `PoliticalFigureRegistration` component:

1. After user uploads manifesto or pastes text
2. Call `analyzeManifesto` API
3. Store the analysis in the political figure's `manifesto` field
4. Optionally call `getMatchedInitiatives` to show relevant projects

## Supported File Types

- **PDF**: `.pdf` files
- **Word Documents**: `.docx` and `.doc` files
- **Plain Text**: `.txt` files or direct text input

## Error Handling

The service handles:
- Invalid file types
- Empty manifesto text
- OpenAI API errors
- Database connection errors
- Missing jurisdiction information

## Cost Considerations

- Uses GPT-4o model (more expensive but higher quality)
- Each analysis costs approximately $0.01-0.05 depending on manifesto length
- Consider caching analysis results to avoid re-analyzing the same manifesto

## Testing

Test the service using curl:

```bash
# Analyze text
curl -X POST http://localhost:3001/api/political/analyze-manifesto \
  -F "manifesto_text=Build 10 schools in Nairobi County" \
  -F "position=governor" \
  -F "county=Nairobi"

# Analyze file
curl -X POST http://localhost:3001/api/political/analyze-manifesto \
  -F "manifesto=@manifesto.pdf" \
  -F "position=mp" \
  -F "county=Nairobi" \
  -F "constituency=Westlands"
```

