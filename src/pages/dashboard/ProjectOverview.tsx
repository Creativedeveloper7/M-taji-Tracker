import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserInitiatives } from '../../services/initiatives';
import { Initiative as DatabaseInitiative } from '../../types';
import { supabase } from '../../lib/supabase';

interface ProjectOverviewProps {
  onNavigateToCreate?: () => void;
}

interface DisplayInitiative {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  originalStatus: string; // Store original database status for filtering
  category: string;
  location: string;
  progress: number;
  thumbnailUrl?: string;
  lastUpdated: string;
  volunteers: number;
}

export default function ProjectOverview({ onNavigateToCreate }: ProjectOverviewProps = {}) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [initiatives, setInitiatives] = useState<DisplayInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [initiativeToDelete, setInitiativeToDelete] = useState<DisplayInitiative | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch user's initiatives from database
  useEffect(() => {
    const loadInitiatives = async () => {
      if (!userProfile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get changemaker_id for the current user
        const { data: changemaker, error: changemakerError } = await supabase
          .from('changemakers')
          .select('id')
          .eq('user_id', userProfile.user_id)
          .maybeSingle();

        if (changemakerError) {
          console.error('Error fetching changemaker:', changemakerError);
          setError('Could not load your profile. Please refresh the page.');
          setLoading(false);
          return;
        }

        if (!changemaker) {
          console.log('No changemaker found for user');
          setInitiatives([]);
          setLoading(false);
          return;
        }

        // Fetch initiatives for this changemaker
        const dbInitiatives = await fetchUserInitiatives(changemaker.id);

        // Convert database initiatives to display format
        const displayInitiatives: DisplayInitiative[] = dbInitiatives.map((init: DatabaseInitiative) => {
          // Map database status to display status
          // Database: 'draft' | 'published' | 'active' | 'completed' | 'stalled'
          // Display: 'active' | 'completed' | 'paused'
          const dbStatus = init.status;
          let displayStatus: 'active' | 'completed' | 'paused' = 'active';
          
          if (dbStatus === 'completed') {
            displayStatus = 'completed';
          } else if (dbStatus === 'stalled' || dbStatus === 'draft') {
            displayStatus = 'paused';
          } else if (dbStatus === 'active' || dbStatus === 'published') {
            displayStatus = 'active';
          }

          // Calculate progress from milestones
          let progress = 0;
          if (init.milestones && init.milestones.length > 0) {
            const completed = init.milestones.filter(m => m.status === 'completed').length;
            progress = Math.round((completed / init.milestones.length) * 100);
          }

          // Get location string
          const locationStr = init.location?.specific_area || 
                             init.location?.county || 
                             `${init.location?.coordinates?.lat?.toFixed(4)}, ${init.location?.coordinates?.lng?.toFixed(4)}` ||
                             'Location not specified';

          // Get thumbnail from reference images
          const thumbnailUrl = init.reference_images && init.reference_images.length > 0 
            ? init.reference_images[0] 
            : undefined;

          return {
            id: init.id,
            name: init.title,
            description: init.short_description || init.description || '',
            status: displayStatus,
            originalStatus: dbStatus, // Keep original database status for filtering
            category: init.category,
            location: locationStr,
            progress: progress,
            thumbnailUrl: thumbnailUrl,
            lastUpdated: init.updated_at || init.created_at,
            volunteers: 0, // TODO: Add volunteer count when volunteer system is implemented
          };
        });

        setInitiatives(displayInitiatives);
      } catch (err: any) {
        console.error('Error loading initiatives:', err);
        setError('Failed to load initiatives. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitiatives();
  }, [userProfile, refreshKey]);

  // Refresh function to be called after creating new initiatives
  const refreshInitiatives = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Open delete confirmation modal
  const openDeleteModal = (initiative: DisplayInitiative) => {
    setInitiativeToDelete(initiative);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setInitiativeToDelete(null);
    setDeleteError(null);
  };

  // Delete initiative
  const handleDeleteInitiative = async () => {
    if (!initiativeToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Delete related data first (milestones, job applications, etc.)
      // Milestones
      const { error: milestonesError } = await supabase
        .from('milestones')
        .delete()
        .eq('initiative_id', initiativeToDelete.id);
      
      if (milestonesError) {
        console.warn('Error deleting milestones:', milestonesError);
      }

      // Job opportunities
      const { error: jobsError } = await supabase
        .from('job_opportunities')
        .delete()
        .eq('initiative_id', initiativeToDelete.id);
      
      if (jobsError) {
        console.warn('Error deleting job opportunities:', jobsError);
      }

      // Volunteer applications
      const { error: volunteersError } = await supabase
        .from('volunteer_applications')
        .delete()
        .eq('initiative_id', initiativeToDelete.id);
      
      if (volunteersError) {
        console.warn('Error deleting volunteer applications:', volunteersError);
      }

      // Blog links (set to null, don't delete blogs)
      const { error: blogsError } = await supabase
        .from('blogs')
        .update({ initiative_id: null, initiative_name: null })
        .eq('initiative_id', initiativeToDelete.id);
      
      if (blogsError) {
        console.warn('Error unlinking blogs:', blogsError);
      }

      // Finally, delete the initiative
      const { error: deleteError } = await supabase
        .from('initiatives')
        .delete()
        .eq('id', initiativeToDelete.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setInitiatives(prev => prev.filter(i => i.id !== initiativeToDelete.id));
      closeDeleteModal();
      
    } catch (err: any) {
      console.error('Error deleting initiative:', err);
      setDeleteError(err.message || 'Failed to delete initiative. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Expose refresh function to parent if needed
  useEffect(() => {
    // Listen for custom event to refresh
    const handleRefresh = () => refreshInitiatives();
    window.addEventListener('initiatives-refresh', handleRefresh);
    return () => window.removeEventListener('initiatives-refresh', handleRefresh);
  }, []);

  const filteredInitiatives = initiatives.filter(initiative => {
    // Filter by status (using originalStatus for database statuses)
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        // Show active and published
        if (!['active', 'published'].includes(initiative.originalStatus)) return false;
      } else if (filterStatus === 'completed') {
        if (initiative.originalStatus !== 'completed') return false;
      } else if (filterStatus === 'paused') {
        // Show stalled and draft
        if (!['stalled', 'draft'].includes(initiative.originalStatus)) return false;
      } else {
        // Direct match for draft, published, stalled
        if (initiative.originalStatus !== filterStatus) return false;
      }
    }
    
    // Filter by category
    if (filterCategory !== 'all' && initiative.category !== filterCategory) return false;
    
    // Filter by search query
    if (searchQuery && !initiative.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const totalProjects = initiatives.length;
  const activeProjects = initiatives.filter(p => p.status === 'active').length;
  const totalVolunteers = initiatives.reduce((sum, p) => sum + p.volunteers, 0);
  const completionRate = totalProjects > 0 
    ? (initiatives.filter(p => p.status === 'completed').length / totalProjects) * 100 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-black mb-2">Project Overview</h2>
            <p className="text-mtaji-light-gray">Manage and track all your initiatives</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
            <p className="text-mtaji-light-gray">Loading your initiatives...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-black mb-2">Project Overview</h2>
            <p className="text-mtaji-light-gray">Manage and track all your initiatives</p>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-2">Error</p>
          <p className="text-mtaji-light-gray">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-black mb-2">Project Overview</h2>
          <p className="text-mtaji-light-gray">Manage and track all your initiatives</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshInitiatives}
            disabled={loading}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Refresh initiatives"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {onNavigateToCreate && (
            <button
              onClick={onNavigateToCreate}
              className="px-6 py-3 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              <span>Create Initiative</span>
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Total Projects</div>
          <div className="text-3xl font-bold text-mtaji-primary">{totalProjects}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Active Projects</div>
          <div className="text-3xl font-bold text-green-400">{activeProjects}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Active Volunteers</div>
          <div className="text-3xl font-bold text-mtaji-primary">{totalVolunteers}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <div className="text-sm text-mtaji-light-gray mb-2">Completion Rate</div>
          <div className="text-3xl font-bold text-mtaji-primary">{completionRate.toFixed(1)}%</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">Search Projects</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="stalled">Stalled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm text-mtaji-light-gray mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="all">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="water">Water & Sanitation</option>
              <option value="agriculture">Agriculture</option>
              <option value="economic">Economic Development</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInitiatives.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-mtaji-light-gray text-lg">No projects found</p>
            <p className="text-mtaji-medium-gray text-sm mt-2">
              {initiatives.length === 0 
                ? 'Create your first project to get started'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredInitiatives.map((initiative, index) => (
            <motion.div
              key={initiative.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden hover:border-mtaji-primary/50 transition-colors"
            >
              {/* Thumbnail */}
              {initiative.thumbnailUrl ? (
                <div className="h-48 bg-gray-800 relative">
                  <img
                    src={initiative.thumbnailUrl}
                    alt={initiative.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-mtaji-purple to-mtaji-navy flex items-center justify-center">
                  <span className="text-4xl">🛰️</span>
                </div>
              )}

              <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    initiative.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    initiative.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {initiative.originalStatus === 'published' ? 'Published' :
                     initiative.originalStatus === 'draft' ? 'Draft' :
                     initiative.originalStatus === 'stalled' ? 'Stalled' :
                     initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
                  </span>
                  <span className="text-xs text-mtaji-light-gray capitalize">{initiative.category}</span>
                </div>

                {/* Project Name */}
                <h3 className="text-xl font-bold mb-2">{initiative.name}</h3>
                
                {/* Description */}
                <p className="text-sm text-mtaji-light-gray mb-4 line-clamp-2">
                  {initiative.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-mtaji-light-gray">Progress</span>
                    <span className="text-mtaji-primary font-semibold">{initiative.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-mtaji-primary h-2 rounded-full transition-all"
                      style={{ width: `${initiative.progress}%` }}
                    />
                  </div>
                </div>

                {/* Location & Volunteers */}
                <div className="flex items-center justify-between text-xs text-mtaji-light-gray mb-4">
                  <span className="flex items-center gap-1">
                    📍 {initiative.location}
                  </span>
                  <span className="flex items-center gap-1">
                    👥 {initiative.volunteers} volunteers
                  </span>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-mtaji-medium-gray mb-4">
                  Last updated: {new Date(initiative.lastUpdated).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <a 
                    href={`/initiatives/${initiative.id}`}
                    className="flex-1 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg px-4 py-2 text-sm font-semibold transition-colors text-center"
                  >
                    View
                  </a>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors">
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(initiative)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    title="Delete initiative"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && initiativeToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 transition-opacity"
              onClick={closeDeleteModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-gray-900 border border-white/20 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all w-full max-w-md mx-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Delete Initiative</h3>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-mtaji-light-gray mb-4">
                  Are you sure you want to delete <strong className="text-white">"{initiativeToDelete.name}"</strong>?
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm font-medium mb-2">⚠️ This action cannot be undone</p>
                  <p className="text-red-300/70 text-sm">
                    Deleting this initiative will also remove:
                  </p>
                  <ul className="text-red-300/70 text-sm mt-2 space-y-1 ml-4">
                    <li>• All milestones and progress data</li>
                    <li>• All job opportunities</li>
                    <li>• All volunteer applications</li>
                    <li>• Satellite monitoring history</li>
                  </ul>
                </div>

                {deleteError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">{deleteError}</p>
                  </div>
                )}

                {/* Confirmation input */}
                <p className="text-mtaji-light-gray text-sm mb-2">
                  Type <strong className="text-white">DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  id="delete-confirm-input"
                  placeholder="Type DELETE"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-medium-gray focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                    if (input?.value === 'DELETE') {
                      handleDeleteInitiative();
                    } else {
                      setDeleteError('Please type DELETE to confirm');
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Initiative
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
