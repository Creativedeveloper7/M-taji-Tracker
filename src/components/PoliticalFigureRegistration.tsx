import React, { useState } from 'react';
import { KENYA_COUNTIES, getConstituenciesByCounty } from '../data/kenya-locations';
import { PoliticalFigure, PoliticalPosition } from '../types/politicalFigure';
import { analyzeManifesto, getMatchedInitiatives, ManifestoAnalysis, MatchedInitiative } from '../services/manifestoAnalysisService';

interface Props {
  onComplete: (profile: Partial<PoliticalFigure>) => void;
  onCancel?: () => void;
}

export const PoliticalFigureRegistration: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    position: 'mp' as PoliticalPosition,
    county: '',
    constituency: '',
    ward: '',
    term_start: '',
    term_end: '',
    manifesto_file: null as File | null,
    manifesto_text: ''
  });

  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ManifestoAnalysis | null>(null);
  const [matchedInitiatives, setMatchedInitiatives] = useState<MatchedInitiative[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleCountyChange = (county: string) => {
    setFormData({ ...formData, county, constituency: '', ward: '' });
    setConstituencies(getConstituenciesByCounty(county));
  };

  const termYears = formData.position === 'governor' ? 5 : 5; // Both 5 years in Kenya

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, manifesto_file: file });
    // Reset analysis when file changes
    setAnalysis(null);
    setMatchedInitiatives([]);
    setShowAnalysis(false);
    setAnalysisError(null);
  };

  const handleAnalyzeManifesto = async () => {
    if (!formData.manifesto_file && !formData.manifesto_text.trim()) {
      setAnalysisError('Please upload a file or paste manifesto text first');
      return;
    }

    if (!formData.county) {
      setAnalysisError('Please select a county first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setMatchedInitiatives([]);

    try {
      // Analyze manifesto
      const manifestoInput = formData.manifesto_file || formData.manifesto_text;
      const analysisResult = await analyzeManifesto(manifestoInput, {
        position: formData.position,
        county: formData.county,
        constituency: formData.constituency || undefined
      });

      setAnalysis(analysisResult);
      setShowAnalysis(true);

      // Get matched initiatives
      try {
        const matches = await getMatchedInitiatives(analysisResult, {
          county: formData.county,
          constituency: formData.constituency || undefined
        });
        setMatchedInitiatives(matches);
      } catch (matchError) {
        console.warn('Failed to get matched initiatives:', matchError);
        // Don't fail the whole process if matching fails
      }
    } catch (error: any) {
      console.error('Manifesto analysis error:', error);
      const errorMessage = error.message || 'Failed to analyze manifesto. Please try again.';
      
      // Only show "server not running" message for actual connection failures
      // Not for 500 errors (which mean server is running but has an internal error)
      if (errorMessage.includes('Cannot connect to server') || 
          (errorMessage.includes('fetch') && errorMessage.includes('connect'))) {
        setAnalysisError(
          `❌ Cannot connect to backend server.\n\n` +
          `The backend server is not running. To fix this:\n\n` +
          `1. Open a new terminal window\n` +
          `2. Run: npm run server:dev\n` +
          `3. Wait for "Server running on port 3001"\n` +
          `4. Try analyzing again\n\n` +
          `Make sure both frontend (npm run dev) and backend (npm run server:dev) are running.`
        );
      } else {
        // Show the actual error message from the server (which may include helpful details)
        setAnalysisError(errorMessage);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    // Create profile object with analysis if available
    const profile: Partial<PoliticalFigure> = {
      name: formData.name,
      position: formData.position,
      county: formData.county,
      constituency: formData.constituency || undefined,
      ward: formData.ward || undefined,
      term_start: formData.term_start,
      term_end: formData.term_end,
      term_years: termYears,
      manifesto: {
        text: formData.manifesto_text,
        uploaded_at: new Date().toISOString(),
        parsed_at: analysis ? new Date().toISOString() : undefined,
        focus_areas: analysis?.focus_areas?.map(area => ({
          category: area.category as 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic',
          priority: area.priority,
          commitments: area.commitments || [],
          keywords: area.keywords || []
        })) || [],
        targets: analysis?.specific_targets?.map(target => ({
          description: target.description,
          quantity: target.quantity,
          category: target.category,
          location: target.location
        })) || []
      },
      commissioned_projects: [],
      total_investment: 0,
      projects_by_category: {
        agriculture: 0,
        water: 0,
        health: 0,
        education: 0,
        infrastructure: 0,
        economic: 0
      },
      status: 'active'
    };

    onComplete(profile);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                  s <= step
                    ? 'bg-mtaji-accent text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-mtaji-accent rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
                placeholder="e.g., Hon. Jane Wanjiru"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.position}
                onChange={e => {
                  const newPosition = e.target.value as PoliticalPosition;
                  setFormData({ 
                    ...formData, 
                    position: newPosition,
                    constituency: newPosition === 'governor' ? '' : formData.constituency,
                    ward: newPosition !== 'mca' ? '' : formData.ward
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
              >
                <option value="governor">Governor</option>
                <option value="mp">Member of Parliament (MP)</option>
                <option value="senator">Senator</option>
                <option value="mca">Member of County Assembly (MCA)</option>
              </select>
            </div>

            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.position}
                className="flex-1 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Jurisdiction
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Jurisdiction */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">
              Your Jurisdiction
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.county}
                onChange={e => handleCountyChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
              >
                <option value="">Select County</option>
                {KENYA_COUNTIES.map(county => (
                  <option key={county.code} value={county.name}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>

            {(formData.position === 'mp' || formData.position === 'mca' || formData.position === 'senator') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Constituency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.constituency}
                  onChange={e => setFormData({ ...formData, constituency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
                  disabled={!formData.county}
                >
                  <option value="">Select Constituency</option>
                  {constituencies.map(constituency => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.position === 'mca' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ward <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={e => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
                  placeholder="Enter ward name"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  !formData.county || 
                  ((formData.position === 'mp' || formData.position === 'mca' || formData.position === 'senator') && !formData.constituency) ||
                  (formData.position === 'mca' && !formData.ward)
                }
                className="flex-1 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Term Details
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Term Information */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">
              Term Information
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📅 Your term duration: <strong>{termYears} years</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.term_start}
                  onChange={e => {
                    const startDate = new Date(e.target.value);
                    const endDate = new Date(startDate);
                    endDate.setFullYear(startDate.getFullYear() + termYears);
                    
                    setFormData({
                      ...formData,
                      term_start: e.target.value,
                      term_end: endDate.toISOString().split('T')[0]
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term End Date
                </label>
                <input
                  type="date"
                  value={formData.term_end}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.term_start}
                className="flex-1 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Upload Manifesto
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Manifesto Upload */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">
              Upload Your Manifesto
            </h2>

            <p className="text-gray-600">
              Our AI will analyze your manifesto to automatically match you with relevant 
              initiatives in your jurisdiction.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-mtaji-accent transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="manifesto-upload"
              />
              <label
                htmlFor="manifesto-upload"
                className="cursor-pointer"
              >
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {formData.manifesto_file ? formData.manifesto_file.name : 'Click to upload manifesto'}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, or TXT (Max 10MB)
                </p>
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Manifesto Text
              </label>
              <textarea
                value={formData.manifesto_text}
                onChange={e => {
                  setFormData({ ...formData, manifesto_text: e.target.value });
                  // Reset analysis when text changes
                  if (analysis) {
                    setAnalysis(null);
                    setMatchedInitiatives([]);
                    setShowAnalysis(false);
                    setAnalysisError(null);
                  }
                }}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtaji-accent focus:border-transparent"
                placeholder="Paste your manifesto text here..."
              />
            </div>

            {/* Analyze Button */}
            {(formData.manifesto_file || formData.manifesto_text.trim()) && (
              <div>
                <button
                  onClick={handleAnalyzeManifesto}
                  disabled={analyzing || !formData.county}
                  className="w-full py-3 bg-mtaji-primary text-white rounded-lg font-semibold hover:bg-mtaji-accent transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Analyzing Manifesto...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Analyze Manifesto with AI</span>
                    </>
                  )}
                </button>
                {!formData.county && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Please select a county first to enable analysis
                  </p>
                )}
              </div>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{analysisError}</p>
              </div>
            )}

            {/* Analysis Results */}
            {showAnalysis && analysis && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400">
                    ✓ Manifesto Analysis Complete
                  </h3>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Summary */}
                {analysis.summary && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600">{analysis.summary}</p>
                  </div>
                )}

                {/* Main Themes */}
                {analysis.main_themes && analysis.main_themes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Main Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.main_themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm rounded-full"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Focus Areas */}
                {analysis.focus_areas && analysis.focus_areas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Focus Areas</h4>
                    <div className="space-y-2">
                      {analysis.focus_areas
                        .sort((a, b) => b.priority - a.priority)
                        .map((area, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700 capitalize">{area.category}</span>
                              <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded">
                                Priority {area.priority}/5
                              </span>
                            </div>
                            {area.commitments && area.commitments.length > 0 && (
                              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                {area.commitments.slice(0, 3).map((commitment, cIdx) => (
                                  <li key={cIdx}>• {commitment}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Matched Initiatives */}
                {matchedInitiatives.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Matched Initiatives ({matchedInitiatives.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {matchedInitiatives.slice(0, 5).map((match, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-700">{match.initiative.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Match Score: {match.matchScore}%
                              </p>
                            </div>
                          </div>
                          {match.matchReasons.length > 0 && (
                            <ul className="text-xs text-gray-600 mt-2 space-y-1">
                              {match.matchReasons.slice(0, 2).map((reason, rIdx) => (
                                <li key={rIdx}>• {reason}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedInitiatives.length === 0 && (
                  <p className="text-sm text-gray-600">
                    No matching initiatives found in your jurisdiction yet.
                  </p>
                )}
              </div>
            )}

            {/* Analysis Status Indicator */}
            {analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <strong>Analysis complete!</strong> Your manifesto has been analyzed and will be included in your profile.
                    {matchedInitiatives.length > 0 && (
                      <span className="ml-1">Found {matchedInitiatives.length} matching initiative(s).</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {!analysis && (formData.manifesto_file || formData.manifesto_text.trim()) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Click "Analyze Manifesto with AI" to extract key information and find matching initiatives.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={(!formData.manifesto_file && !formData.manifesto_text) || analyzing}
                className="flex-1 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

