import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import ProjectOverview from './dashboard/ProjectOverview';
import SatelliteTracker from './dashboard/SatelliteTracker';
import AIAnalysis from './dashboard/AIAnalysis';
import VolunteerManagement from './dashboard/VolunteerManagement';
import ProjectRendering from './dashboard/ProjectRendering';
import Notifications from './dashboard/Notifications';
import CreateInitiative from './dashboard/CreateInitiative';

type DashboardSection = 
  | 'overview' 
  | 'create-initiative'
  | 'satellite' 
  | 'ai-analysis' 
  | 'volunteers' 
  | 'rendering' 
  | 'notifications';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Handle URL query parameter for section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') as DashboardSection;
    if (section && ['overview', 'create-initiative', 'satellite', 'ai-analysis', 'volunteers', 'rendering', 'notifications'].includes(section)) {
      setActiveSection(section);
    }
  }, []);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Handle URL query parameter for section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') as DashboardSection;
    if (section && ['overview', 'create-initiative', 'satellite', 'ai-analysis', 'volunteers', 'rendering', 'notifications'].includes(section)) {
      setActiveSection(section);
    }
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
          <p className="text-mtaji-light-gray">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirect happens
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
          <p className="text-mtaji-light-gray">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const getUserTypeDisplay = (type?: string) => {
    switch (type) {
      case 'organization':
        return 'Social Organization';
      case 'government':
        return 'Government Entity';
      case 'political_figure':
        return 'Political Figure';
      default:
        return 'User';
    }
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-400';
      case 'under_review':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-mtaji-light-gray';
    }
  };

  const dashboardSections = [
    { id: 'overview' as DashboardSection, label: 'Project Overview', icon: '📊' },
    { id: 'create-initiative' as DashboardSection, label: 'Create Initiative', icon: '➕' },
    { id: 'satellite' as DashboardSection, label: 'Satellite Tracker', icon: '🛰️' },
    { id: 'ai-analysis' as DashboardSection, label: 'AI Analysis', icon: '🤖' },
    { id: 'volunteers' as DashboardSection, label: 'Volunteers', icon: '👥' },
    { id: 'rendering' as DashboardSection, label: 'Rendering Tool', icon: '🎨' },
    { id: 'notifications' as DashboardSection, label: 'Notifications', icon: '🔔' },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <ProjectOverview onNavigateToCreate={() => setActiveSection('create-initiative')} />;
      case 'create-initiative':
        return <CreateInitiative />;
      case 'satellite':
        return <SatelliteTracker />;
      case 'ai-analysis':
        return <AIAnalysis />;
      case 'volunteers':
        return <VolunteerManagement />;
      case 'rendering':
        return <ProjectRendering />;
      case 'notifications':
        return <Notifications />;
      default:
        return <ProjectOverview onNavigateToCreate={() => setActiveSection('create-initiative')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white">
      <Header onCreateInitiative={() => {}} />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 min-h-[calc(100vh-80px)] p-4">
          {/* User Info */}
          <div className="mb-6 pb-6 border-b border-white/10">
            <h2 className="text-xl font-heading font-black mb-2">Dashboard</h2>
            {userProfile && (
              <p className="text-sm text-mtaji-light-gray">
                {getUserTypeDisplay(userProfile.user_type)}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {dashboardSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-mtaji-primary text-white'
                    : 'text-mtaji-light-gray hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{section.icon}</span>
                <span className="font-semibold">{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Account Status (Bottom) */}
          {userProfile && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-mtaji-medium-gray mb-2">Account Status</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-mtaji-light-gray">Verification:</span>
                  <span className={`font-semibold capitalize ${getVerificationStatusColor(userProfile.verification_status)}`}>
                    {userProfile.verification_status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-mtaji-light-gray">Email:</span>
                  <span className={user?.email_confirmed_at ? 'text-green-400' : 'text-yellow-400'}>
                    {user?.email_confirmed_at ? '✓' : '⏳'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {renderActiveSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
