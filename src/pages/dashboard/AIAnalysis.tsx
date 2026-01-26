import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AIAnalysis() {
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Mock data - replace with actual AI analysis results
  const analysisData = {
    completionPercentage: 0,
    milestones: [],
    predictedCompletion: null,
    riskIndicators: [],
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">AI Detected Completion</div>
          <div className="text-4xl font-bold text-mtaji-primary mb-2">
            {analysisData.completionPercentage}%
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-mtaji-primary h-3 rounded-full transition-all"
              style={{ width: `${analysisData.completionPercentage}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Predicted Completion</div>
          <div className="text-2xl font-bold text-mtaji-primary">
            {analysisData.predictedCompletion 
              ? new Date(analysisData.predictedCompletion).toLocaleDateString()
              : 'Calculating...'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Risk Level</div>
          <div className="text-2xl font-bold text-green-400">Low</div>
          <div className="text-xs text-mtaji-light-gray mt-1">No anomalies detected</div>
        </motion.div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Progress Over Time</h3>
          <div className="h-64 flex items-center justify-center text-mtaji-light-gray">
            Chart visualization (Integration needed)
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Milestone Completion</h3>
          <div className="space-y-3">
            {analysisData.milestones.length === 0 ? (
              <p className="text-mtaji-light-gray text-center py-4">No milestones tracked yet</p>
            ) : (
              analysisData.milestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-center justify-between">
                  <span className="text-mtaji-light-gray">{milestone.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-mtaji-primary h-2 rounded-full"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-mtaji-primary w-12 text-right">
                      {milestone.progress}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Automated Reports */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Automated Progress Reports</h3>
          <button className="px-4 py-2 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg text-sm font-semibold transition-colors">
            Generate Report
          </button>
        </div>
        <div className="text-mtaji-light-gray">
          AI-generated reports will appear here after analysis
        </div>
      </div>
    </div>
  );
}
