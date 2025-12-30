import express from 'express';
import multer from 'multer';
import { manifestoAnalysisService } from '../services/manifestoAnalysisService';
import { supabaseAdmin } from '../lib/database';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to handle both file uploads and text input
const handleManifestoUpload = upload.single('manifesto');

// Analyze manifesto
router.post('/analyze-manifesto', (req, res, next) => {
  // Use multer middleware, but don't fail if no file is provided
  handleManifestoUpload(req, res, (err) => {
    // Ignore multer errors if no file is provided (we'll check for text instead)
    if (err) {
      console.log('Multer error (may be expected):', err.code, err.message);
      if (err.code !== 'LIMIT_UNEXPECTED_FILE' && err.code !== 'LIMIT_FILE_SIZE') {
        return next(err);
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('📥 Received manifesto analysis request');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    console.log('Text provided:', req.body.manifesto_text ? `${req.body.manifesto_text.length} characters` : 'No text');
    console.log('Position:', req.body.position);
    console.log('County:', req.body.county);
    console.log('Constituency:', req.body.constituency);

    let manifestoText = '';

    if (req.file) {
      console.log('Extracting text from file...');
      manifestoText = await manifestoAnalysisService.extractText(
        req.file.buffer,
        req.file.mimetype
      );
      console.log(`Extracted ${manifestoText.length} characters from file`);
    } else if (req.body.manifesto_text) {
      manifestoText = req.body.manifesto_text;
      console.log(`Using provided text (${manifestoText.length} characters)`);
    } else {
      return res.status(400).json({ error: 'No manifesto provided. Please upload a file or provide manifesto_text.' });
    }

    if (!manifestoText || manifestoText.trim().length === 0) {
      return res.status(400).json({ error: 'Manifesto text is empty. Please provide valid content.' });
    }

    console.log('🤖 Starting AI analysis...');
    const analysis = await manifestoAnalysisService.analyzeManifesto(
      manifestoText,
      {
        position: req.body.position,
        county: req.body.county,
        constituency: req.body.constituency
      }
    );
    console.log('✅ Analysis complete:', {
      summary: analysis.summary?.substring(0, 50) + '...',
      themes: analysis.main_themes?.length || 0,
      focusAreas: analysis.focus_areas?.length || 0,
      targets: analysis.specific_targets?.length || 0
    });

    res.json(analysis);
  } catch (error: any) {
    console.error('Manifesto analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze manifesto',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// Get matched initiatives
router.post('/matched-initiatives', async (req, res) => {
  try {
    const { manifestoAnalysis, jurisdiction } = req.body;
    
    if (!manifestoAnalysis) {
      return res.status(400).json({ error: 'manifestoAnalysis is required' });
    }
    
    if (!jurisdiction) {
      return res.status(400).json({ error: 'jurisdiction is required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Build query based on jurisdiction
    let query = supabaseAdmin
      .from('initiatives')
      .select('*')
      .in('status', ['active', 'published']);

    // Filter by county if provided
    if (jurisdiction.county) {
      query = query.eq('location->>county', jurisdiction.county);
    }

    // Filter by constituency if provided
    if (jurisdiction.constituency) {
      query = query.eq('location->>constituency', jurisdiction.constituency);
    }

    const { data: initiatives, error } = await query;

    if (error) {
      console.error('Error fetching initiatives:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch initiatives',
        message: error.message
      });
    }

    if (!initiatives || initiatives.length === 0) {
      return res.json([]);
    }

    const matches = await manifestoAnalysisService.matchInitiatives(
      manifestoAnalysis,
      initiatives,
      jurisdiction
    );

    res.json(matches);
  } catch (error: any) {
    console.error('Initiative matching error:', error);
    res.status(500).json({ 
      error: 'Failed to match initiatives',
      message: error.message || 'Unknown error occurred'
    });
  }
});

export default router;

