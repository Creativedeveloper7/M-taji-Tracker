import { useState } from 'react';

export default function ProjectRendering() {
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const [proposalDocument, setProposalDocument] = useState<File | null>(null);
  const [renderingMode, setRenderingMode] = useState<'2d' | '3d'>('2d');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentImage(e.target.files[0]);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProposalDocument(e.target.files[0]);
    }
  };

  const handleGenerateRendering = async () => {
    if (!currentImage || !proposalDocument) {
      alert('Please upload both current state image and proposal document');
      return;
    }

    setIsProcessing(true);
    // TODO: Implement AI rendering logic
    setTimeout(() => {
      setIsProcessing(false);
      alert('Rendering feature will be implemented with AI integration');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-6">Project Rendering & Simulation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State Upload */}
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">
              Upload Current State Image
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              {currentImage ? (
                <div className="space-y-2">
                  <img
                    src={URL.createObjectURL(currentImage)}
                    alt="Current state"
                    className="max-h-48 mx-auto rounded"
                  />
                  <p className="text-sm text-mtaji-light-gray">{currentImage.name}</p>
                  <button
                    onClick={() => setCurrentImage(null)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📷</div>
                  <label className="cursor-pointer">
                    <span className="text-mtaji-primary hover:underline">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-mtaji-light-gray mt-2">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Proposal Document Upload */}
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">
              Upload Proposal Document (PDF/Images)
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              {proposalDocument ? (
                <div className="space-y-2">
                  <div className="text-4xl">📄</div>
                  <p className="text-sm text-mtaji-light-gray">{proposalDocument.name}</p>
                  <button
                    onClick={() => setProposalDocument(null)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <label className="cursor-pointer">
                    <span className="text-mtaji-primary hover:underline">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-mtaji-light-gray mt-2">
                    PDF or images with project plans
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rendering Options */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">Rendering Mode</label>
            <select
              value={renderingMode}
              onChange={(e) => setRenderingMode(e.target.value as '2d' | '3d')}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="2d">2D Comparison</option>
              <option value="3d">3D Rendering</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateRendering}
              disabled={!currentImage || !proposalDocument || isProcessing}
              className="w-full bg-mtaji-primary hover:bg-mtaji-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-2 font-semibold transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Generate Rendering'}
            </button>
          </div>
        </div>
      </div>

      {/* Rendering Results */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Rendering Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div>
            <h4 className="text-sm text-mtaji-light-gray mb-2">Before (Current State)</h4>
            <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center text-mtaji-light-gray">
              {currentImage ? (
                <img
                  src={URL.createObjectURL(currentImage)}
                  alt="Before"
                  className="max-h-full max-w-full rounded"
                />
              ) : (
                'Upload image to see preview'
              )}
            </div>
          </div>

          {/* After */}
          <div>
            <h4 className="text-sm text-mtaji-light-gray mb-2">After (AI Projection)</h4>
            <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center text-mtaji-light-gray">
              AI-generated projection will appear here
            </div>
          </div>
        </div>

        {/* Comparison Slider */}
        <div className="mt-6">
          <h4 className="text-sm text-mtaji-light-gray mb-2">Interactive Comparison</h4>
          <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center text-mtaji-light-gray">
            Slider comparison view (Implementation needed)
          </div>
        </div>

        {/* Download Options */}
        <div className="mt-6 flex gap-4">
          <button className="px-6 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors">
            Download Before
          </button>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors">
            Download After
          </button>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors">
            Download Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
