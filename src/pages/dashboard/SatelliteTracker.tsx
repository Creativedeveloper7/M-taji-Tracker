import { useState } from 'react';

interface SatelliteImage {
  id: string;
  date: string;
  url: string;
  type: 'baseline' | 'periodic' | 'custom';
  changesDetected?: number;
}

export default function SatelliteTracker() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'timelapse'>('slider');
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Mock data - replace with actual satellite API integration
  const satelliteImages: SatelliteImage[] = [];
  const projects: Array<{ id: string; name: string }> = [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Project Selector */}
          <div>
            <label className="block text-sm text-gray-800 dark:text-gray-400 mb-2">Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-sm text-gray-800 dark:text-gray-400 mb-2">View Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            />
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm text-gray-800 dark:text-gray-400 mb-2">View Mode</label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as any)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="slider">Slider Comparison</option>
              <option value="side-by-side">Side by Side</option>
              <option value="timelapse">Time-lapse</option>
            </select>
          </div>

          {/* Overlay Toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOverlays}
                onChange={(e) => setShowOverlays(e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/20 text-mtaji-primary focus:ring-mtaji-primary"
              />
              <span className="text-sm text-gray-800 dark:text-gray-400">Show Overlays</span>
            </label>
          </div>
        </div>
      </div>

      {/* Satellite Image Display */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Satellite Imagery</h2>
        
        {satelliteImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛰️</div>
            <p className="text-gray-800 dark:text-gray-400 text-lg mb-2">No satellite imagery available</p>
            <p className="text-mtaji-medium-gray text-sm">
              Satellite imagery will be captured automatically when projects are registered
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Comparison View */}
            {comparisonMode === 'slider' && (
              <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-800 dark:text-gray-400">
                  Slider Comparison View (Implementation needed)
                </div>
              </div>
            )}

            {comparisonMode === 'side-by-side' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center text-gray-800 dark:text-gray-400">
                  Before
                </div>
                <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center text-gray-800 dark:text-gray-400">
                  After
                </div>
              </div>
            )}

            {comparisonMode === 'timelapse' && (
              <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center text-gray-800 dark:text-gray-400">
                Time-lapse Animation (Implementation needed)
              </div>
            )}

            {/* AI Change Detection */}
            <div className="mt-6 p-4 bg-mtaji-primary/10 border border-mtaji-primary/20 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                🤖 AI-Powered Change Detection
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-800 dark:text-gray-400">Construction Progress</div>
                  <div className="text-xl font-bold text-amber-500">+15%</div>
                </div>
                <div>
                  <div className="text-gray-800 dark:text-gray-400">Vegetation Changes</div>
                  <div className="text-xl font-bold text-yellow-400">+8%</div>
                </div>
                <div>
                  <div className="text-gray-800 dark:text-gray-400">Infrastructure</div>
                  <div className="text-xl font-bold text-blue-400">+22%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Timeline */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Image Timeline</h3>
        <div className="space-y-2">
          {satelliteImages.length === 0 ? (
            <p className="text-gray-800 dark:text-gray-400 text-center py-4">No images captured yet</p>
          ) : (
            satelliteImages.map((image) => (
              <div
                key={image.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded"></div>
                  <div>
                    <div className="font-semibold">{new Date(image.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-800 dark:text-gray-400 capitalize">{image.type}</div>
                  </div>
                </div>
                {image.changesDetected !== undefined && (
                  <div className="text-sm text-mtaji-primary">
                    {image.changesDetected} changes detected
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
