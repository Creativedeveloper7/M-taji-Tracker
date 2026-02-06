import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import ProjectOverview from './dashboard/ProjectOverview';
import SatelliteTracker from './dashboard/SatelliteTracker';
import AIAnalysis from './dashboard/AIAnalysis';
import VolunteerManagement from './dashboard/VolunteerManagement';
import OpportunitiesManagement from './dashboard/OpportunitiesManagement';
import ProjectRendering from './dashboard/ProjectRendering';
import Notifications from './dashboard/Notifications';
import CreateInitiative from './dashboard/CreateInitiative';
import Settings from './dashboard/Settings';
import BlogManagement from './dashboard/BlogManagement';

type DashboardSection = 
  | 'overview' 
  | 'create-initiative'
  | 'satellite' 
  | 'ai-analysis' 
  | 'volunteers'
  | 'opportunities'
  | 'rendering' 
  | 'blog-management'
  | 'notifications'
  | 'settings';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Handle URL query parameter for section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') as DashboardSection;
    if (section && ['overview', 'create-initiative', 'satellite', 'ai-analysis', 'volunteers', 'opportunities', 'rendering', 'blog-management', 'notifications', 'settings'].includes(section)) {
      setActiveSection(section);
    }
  }, []);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="text-gray-800 dark:text-secondary font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirect happens
  if (!user) {
    return (
      <div className="min-h-screen bg-primary text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="text-secondary">Redirecting to login...</p>
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
        return 'text-amber-500';
      case 'under_review':
        return 'text-accent-primary';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-800 dark:text-secondary';
    }
  };

  const dashboardSections = [
    { id: 'overview' as DashboardSection, label: 'Project Overview', icon: '📊' },
    { id: 'create-initiative' as DashboardSection, label: 'Create Initiative', icon: '➕' },
    { id: 'satellite' as DashboardSection, label: 'Satellite Tracker', icon: '🛰️' },
    { id: 'ai-analysis' as DashboardSection, label: 'AI Analysis', icon: '🤖' },
    { id: 'volunteers' as DashboardSection, label: 'Volunteers', icon: '👥' },
    { id: 'opportunities' as DashboardSection, label: 'Opportunities', icon: '💼' },
    { id: 'rendering' as DashboardSection, label: 'Rendering Tool', icon: '🎨' },
    { id: 'blog-management' as DashboardSection, label: 'Blog Posts', icon: '✍️' },
    { id: 'notifications' as DashboardSection, label: 'Notifications', icon: '🔔' },
    { id: 'settings' as DashboardSection, label: 'Settings', icon: '⚙️' },
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
      case 'opportunities':
        return <OpportunitiesManagement />;
      case 'rendering':
        return <ProjectRendering />;
      case 'blog-management':
        return <BlogManagement />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      default:
        return <ProjectOverview onNavigateToCreate={() => setActiveSection('create-initiative')} />;
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary pt-16">
      <Header onCreateInitiative={() => {}} />
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation - hidden on mobile */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-secondary border-r border-subtle min-h-[calc(100vh-4rem)] p-4">
          {/* User Info */}
          <div className="mb-6 pb-6 border-b border-divider">
            <h2 className="text-xl font-heading font-black mb-2 text-primary">Dashboard</h2>
            {userProfile && (
              <p className="text-sm text-gray-800 dark:text-secondary font-medium">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-semibold ${
                  activeSection === section.id
                    ? 'text-primary'
                    : 'text-gray-800 dark:text-secondary hover:bg-overlay hover:text-primary dark:hover:text-primary'
                }`}
                style={activeSection === section.id ? { backgroundColor: 'var(--accent-primary)', color: '#121212' } : {}}
              >
                <span className="text-xl">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Account Status (Bottom) */}
          {userProfile && (
            <div className="mt-8 pt-6 border-t border-divider">
              <div className="text-xs font-semibold text-gray-700 dark:text-muted mb-2 uppercase tracking-wide">Account Status</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 dark:text-secondary font-medium">Verification:</span>
                  <span className={`font-semibold capitalize ${getVerificationStatusColor(userProfile.verification_status)}`}>
                    {userProfile.verification_status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 dark:text-secondary font-medium">Email:</span>
                  <span className={user?.email_confirmed_at ? 'text-amber-500' : 'text-accent-primary'}>
                    {user?.email_confirmed_at ? '✓' : '⏳'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">
          {/* Mobile section switcher - horizontal scroll tabs */}
          <div className="lg:hidden mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto border-b border-subtle pb-3">
            <div className="flex gap-2 min-w-max">
              {dashboardSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === section.id
                      ? 'text-primary'
                      : 'text-gray-800 dark:text-secondary hover:bg-overlay hover:text-primary dark:hover:text-primary'
                  }`}
                  style={activeSection === section.id ? { backgroundColor: 'var(--accent-primary)', color: '#121212' } : {}}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>
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
