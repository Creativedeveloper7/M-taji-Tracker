import OpenAI from 'openai';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');
dotenv.config({ path: join(projectRoot, '.env') });
dotenv.config({ path: join(__dirname, '../.env') });

// pdf-parse is a CommonJS module, use createRequire for ESM compatibility
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Initialize OpenAI client lazily to ensure env vars are loaded
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

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

class ManifestoAnalysisService {
  /**
   * Extract text from uploaded file
   */
  async extractText(file: Buffer, fileType: string): Promise<string> {
    try {
      if (fileType === 'application/pdf') {
        const data = await pdfParse(file);
        return data.text;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 fileType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer: file });
        return result.value;
      } else if (fileType === 'text/plain') {
        return file.toString('utf-8');
      }
      throw new Error(`Unsupported file type: ${fileType}`);
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze manifesto using AI
   */
  async analyzeManifesto(manifestoText: string, jurisdiction: {
    county?: string;
    constituency?: string;
    position: string;
  }): Promise<ManifestoAnalysis> {
    // This will throw if OPENAI_API_KEY is not set
    getOpenAIClient();

    // Truncate text to fit within token limits (approximately 12,000 characters)
    const truncatedText = manifestoText.length > 12000 
      ? manifestoText.substring(0, 12000) + '...'
      : manifestoText;

    const locationStr = jurisdiction.county 
      ? `${jurisdiction.county} County`
      : jurisdiction.constituency 
      ? `${jurisdiction.constituency} Constituency`
      : 'Kenya';

    const prompt = `You are analyzing a political manifesto for a ${jurisdiction.position} in ${locationStr}, Kenya.

Manifesto Text:
"""
${truncatedText}
"""

Analyze this manifesto and extract the following information in JSON format:

{
  "summary": "A 2-3 sentence summary of the main vision",
  "main_themes": ["theme1", "theme2", ...],
  "focus_areas": [
    {
      "category": "agriculture" | "water" | "health" | "education" | "infrastructure" | "economic",
      "priority": 1-5 (5 being highest priority based on emphasis),
      "commitments": ["specific promise 1", "specific promise 2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "specific_targets": [
    {
      "description": "Build 10 new schools",
      "quantity": 10,
      "category": "education",
      "location": "specific area if mentioned"
    }
  ],
  "geographic_focus": ["area1", "area2"] (specific regions/wards/areas mentioned)
}

Focus on:
- Physical, trackable projects (construction, infrastructure, facilities)
- Quantifiable commitments (numbers, timelines)
- Geographic specificity
- Categories: agriculture, water, health, education, infrastructure, economic

Return ONLY valid JSON, no additional text.`;

    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing political manifestos and extracting structured information. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content) as ManifestoAnalysis;
      
      // Validate and ensure required fields
      if (!analysis.summary) analysis.summary = 'No summary available';
      if (!analysis.main_themes) analysis.main_themes = [];
      if (!analysis.focus_areas) analysis.focus_areas = [];
      if (!analysis.specific_targets) analysis.specific_targets = [];
      if (!analysis.geographic_focus) analysis.geographic_focus = [];

      return analysis;

    } catch (error) {
      console.error('Manifesto analysis error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing');
      }
      throw new Error(`Failed to analyze manifesto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Match manifesto with initiatives
   */
  async matchInitiatives(
    manifestoAnalysis: ManifestoAnalysis,
    initiatives: any[],
    jurisdiction: { county?: string; constituency?: string }
  ): Promise<Array<{
    initiative: any;
    matchScore: number;
    matchReasons: string[];
  }>> {
    const matches: Array<{
      initiative: any;
      matchScore: number;
      matchReasons: string[];
    }> = [];

    for (const initiative of initiatives) {
      let score = 0;
      const reasons: string[] = [];

      // Filter by jurisdiction first
      const initiativeLocation = initiative.location || {};
      
      if (jurisdiction.county && initiativeLocation.county !== jurisdiction.county) {
        continue; // Skip initiatives outside jurisdiction
      }
      if (jurisdiction.constituency && initiativeLocation.constituency !== jurisdiction.constituency) {
        continue;
      }

      // Check category match
      const focusArea = manifestoAnalysis.focus_areas.find(
        fa => fa.category === initiative.category
      );
      
      if (focusArea) {
        score += focusArea.priority * 20; // Up to 100 points
        reasons.push(`Aligns with ${initiative.category} focus (Priority: ${focusArea.priority}/5)`);
        
        // Check keyword matches
        const initiativeText = `${initiative.title || ''} ${initiative.description || ''}`.toLowerCase();
        const keywordMatches = focusArea.keywords.filter(
          keyword => initiativeText.includes(keyword.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 5;
          reasons.push(`Matches keywords: ${keywordMatches.join(', ')}`);
        }
      }

      // Check specific targets match
      for (const target of manifestoAnalysis.specific_targets) {
        if (target.category === initiative.category) {
          score += 15;
          reasons.push(`Matches specific target: ${target.description}`);
        }
      }

      // Check geographic focus
      const specificArea = initiativeLocation.specific_area || '';
      if (manifestoAnalysis.geographic_focus.some(area => 
        specificArea.toLowerCase().includes(area.toLowerCase())
      )) {
        score += 10;
        reasons.push('Matches geographic focus area');
      }

      // Boost for active fundraising
      if (initiative.status === 'active' && 
          initiative.raised_amount < initiative.target_amount) {
        score += 10;
        reasons.push('Currently seeking funding');
      }

      // Only include if there's a meaningful match
      if (score >= 30) {
        matches.push({
          initiative,
          matchScore: Math.min(score, 100), // Cap at 100
          matchReasons: reasons
        });
      }
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const manifestoAnalysisService = new ManifestoAnalysisService();

