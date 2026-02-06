import { useState, useEffect } from 'react';
import {
  getAllJobApplications,
  getAllAmbassadorApplications,
  getAllProposals,
  getAllContentCreatorApplications,
  JobApplication,
  AmbassadorApplication,
  Proposal,
  ContentCreatorApplication,
  updateJobApplicationStatus,
  updateAmbassadorApplicationStatus,
  updateProposalStatus,
  updateContentCreatorApplicationStatus,
} from '../../services/opportunitiesService';
import { fetchInitiatives } from '../../services/initiatives';

type OpportunityTab = 'jobs' | 'ambassadors' | 'proposals' | 'content-creators';

export default function OpportunitiesManagement() {
  const [activeTab, setActiveTab] = useState<OpportunityTab>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Data states
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [ambassadorApplications, setAmbassadorApplications] = useState<AmbassadorApplication[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contentCreatorApplications, setContentCreatorApplications] = useState<ContentCreatorApplication[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeMap, setInitiativeMap] = useState<Map<string, string>>(new Map());

  // Fetch initiatives for mapping
  useEffect(() => {
    const loadInitiatives = async () => {
      try {
        const initiatives = await fetchInitiatives();
        const map = new Map(initiatives.map(i => [i.id, i.title]));
        setInitiativeMap(map);
      } catch (err) {
        console.error('Error loading initiatives:', err);
      }
    };
    loadInitiatives();
  }, []);

  // Fetch applications based on active tab
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (activeTab) {
          case 'jobs':
            const jobs = await getAllJobApplications();
            setJobApplications(jobs);
            break;
          case 'ambassadors':
            const ambassadors = await getAllAmbassadorApplications();
            setAmbassadorApplications(ambassadors);
            break;
          case 'proposals':
            const props = await getAllProposals();
            setProposals(props);
            break;
          case 'content-creators':
            const creators = await getAllContentCreatorApplications();
            setContentCreatorApplications(creators);
            break;
        }
      } catch (err: any) {
        console.error('Error loading applications:', err);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [activeTab]);

  // Filter applications
  const getFilteredApplications = () => {
    let apps: any[] = [];
    
    switch (activeTab) {
      case 'jobs':
        apps = jobApplications;
        break;
      case 'ambassadors':
        apps = ambassadorApplications;
        break;
      case 'proposals':
        apps = proposals;
        break;
      case 'content-creators':
        apps = contentCreatorApplications;
        break;
    }

    return apps.filter((app: any) => {
      const name = app.full_name || app.name || '';
      const email = app.email || '';
      const matchesSearch = !searchQuery || 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredApplications = getFilteredApplications();

  // Status update handlers
  const handleStatusUpdate = async (
    id: string,
    newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  ) => {
    try {
      switch (activeTab) {
        case 'jobs':
          await updateJobApplicationStatus(id, newStatus);
          setJobApplications(prev => prev.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
          ));
          break;
        case 'ambassadors':
          await updateAmbassadorApplicationStatus(id, newStatus);
          setAmbassadorApplications(prev => prev.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
          ));
          break;
        case 'proposals':
          await updateProposalStatus(id, newStatus);
          setProposals(prev => prev.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
          ));
          break;
        case 'content-creators':
          await updateContentCreatorApplicationStatus(id, newStatus);
          setContentCreatorApplications(prev => prev.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
          ));
          break;
      }
    } catch (err: any) {
      console.error('Error updating application status:', err);
      alert('Failed to update status: ' + (err.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-amber-500/20 text-amber-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getTotalCount = () => {
    switch (activeTab) {
      case 'jobs':
        return jobApplications.length;
      case 'ambassadors':
        return ambassadorApplications.length;
      case 'proposals':
        return proposals.length;
      case 'content-creators':
        return contentCreatorApplications.length;
      default:
        return 0;
    }
  };

  const getPendingCount = () => {
    switch (activeTab) {
      case 'jobs':
        return jobApplications.filter(app => app.status === 'pending').length;
      case 'ambassadors':
        return ambassadorApplications.filter(app => app.status === 'pending').length;
      case 'proposals':
        return proposals.filter(app => app.status === 'pending').length;
      case 'content-creators':
        return contentCreatorApplications.filter(app => app.status === 'pending').length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-gray-800 dark:text-gray-300 mb-2">
            Total {activeTab === 'jobs' ? 'Job Applications' : 
                   activeTab === 'ambassadors' ? 'Ambassador Applications' :
                   activeTab === 'proposals' ? 'Proposals' : 'Content Creator Applications'}
          </div>
          <div className="text-3xl font-bold text-mtaji-primary">{getTotalCount()}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-gray-800 dark:text-gray-300 mb-2">Pending Review</div>
          <div className="text-3xl font-bold text-yellow-400">{getPendingCount()}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-gray-800 dark:text-gray-300 mb-2">Accepted</div>
          <div className="text-3xl font-bold text-amber-500">
            {filteredApplications.filter((app: any) => app.status === 'accepted').length}
        </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex gap-2 border-b border-white/10 pb-2">
          {(['jobs', 'ambassadors', 'proposals', 'content-creators'] as OpportunityTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-mtaji-primary text-black'
                  : 'bg-white/5 text-gray-800 dark:text-gray-300 hover:bg-white/10'
              }`}
            >
              {tab === 'jobs' ? '💼 Job Applications' :
               tab === 'ambassadors' ? '🤝 Ambassador Applications' :
               tab === 'proposals' ? '📝 Proposals' : '🎨 Content Creators'}
            </button>
          ))}
        </div>
        </div>

        {/* Filters */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          </div>
        </div>

        {/* Applications List */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {activeTab === 'jobs' ? 'Job Applications' :
           activeTab === 'ambassadors' ? 'Ambassador Applications' :
           activeTab === 'proposals' ? 'Proposals' : 'Content Creator Applications'}
        </h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
            <p className="text-gray-800 dark:text-gray-300">Loading applications...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-2">Error loading applications</p>
            <p className="text-gray-800 dark:text-gray-300 text-sm">{error}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-800 dark:text-gray-300 text-lg">No applications found</p>
            {getTotalCount() === 0 && (
            <p className="text-gray-800 dark:text-gray-300 text-sm mt-2">
                No {activeTab === 'jobs' ? 'job' :
                    activeTab === 'ambassadors' ? 'ambassador' :
                    activeTab === 'proposals' ? 'proposal' : 'content creator'} applications have been submitted yet.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app: any) => (
              <div
                key={app.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{app.full_name || app.name}</h4>
                      <span className="text-sm text-gray-800 dark:text-gray-300">{app.email}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    {initiativeMap.get(app.initiative_id) && (
                      <p className="text-sm text-mtaji-primary mb-2">
                        📋 {initiativeMap.get(app.initiative_id)}
                      </p>
                    )}
                    {app.job_title && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">
                        💼 Job: {app.job_title}
                      </p>
                    )}
                    {app.phone && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">📞 {app.phone}</p>
                    )}
                    {app.subject && (
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">Subject: {app.subject}</p>
                    )}
                    {app.reach && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">Reach: {app.reach}</p>
                    )}
                    {app.content_type && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">Content Type: {app.content_type}</p>
                    )}
                    {app.portfolio && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">
                        Portfolio: <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-mtaji-primary hover:underline">{app.portfolio}</a>
                      </p>
                    )}
                    {app.links && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">
                        Links: <a href={app.links} target="_blank" rel="noopener noreferrer" className="text-mtaji-primary hover:underline">{app.links}</a>
                      </p>
                    )}
                    {app.created_at && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">
                        📅 Applied: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    )}
                    {(app.motivation || app.details) && (
                      <p className="text-sm text-gray-800 dark:text-gray-300 mt-2 italic line-clamp-3">
                        {app.motivation || app.details}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'accepted')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'reviewed')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'reviewed' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'accepted')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
