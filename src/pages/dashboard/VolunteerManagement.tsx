import React, { useState, useEffect } from 'react';
import { getAllVolunteerApplications, VolunteerApplication, updateVolunteerApplicationStatus } from '../../services/volunteerService';
import { fetchInitiatives } from '../../services/initiatives';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  availability: string;
  hoursContributed: number;
  tasksCompleted: number;
  certifications: string[];
  badges: string[];
  status: string;
  initiativeTitle?: string;
  motivation?: string;
  created_at?: string;
}

export default function VolunteerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch volunteers from database
  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const applications = await getAllVolunteerApplications({
          status: filterStatus !== 'all' ? filterStatus : undefined
        });
        
        // Fetch initiative titles for each application
        const initiatives = await fetchInitiatives();
        const initiativeMap = new Map(initiatives.map(i => [i.id, i.title]));
        
        // Transform applications to Volunteer format
        const transformedVolunteers: Volunteer[] = applications.map((app: VolunteerApplication) => ({
          id: app.id || '',
          name: app.full_name,
          email: app.email,
          phone: app.phone || undefined,
          skills: app.skills || [],
          availability: app.availability_days?.join(', ') || 'Not specified',
          hoursContributed: app.hours_contributed || 0,
          tasksCompleted: app.tasks_completed || 0,
          certifications: [],
          badges: [],
          status: app.status || 'pending',
          initiativeTitle: initiativeMap.get(app.initiative_id),
          motivation: app.motivation,
          created_at: app.created_at
        }));
        
        setVolunteers(transformedVolunteers);
      } catch (err: any) {
        console.error('Error loading volunteers:', err);
        setError(err.message || 'Failed to load volunteers');
      } finally {
        setLoading(false);
      }
    };
    
    loadVolunteers();
  }, [filterStatus]);

  const filteredVolunteers = volunteers.filter((volunteer: Volunteer) => {
    if (searchQuery && !volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !volunteer.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterSkill !== 'all' && !volunteer.skills.some((s: string) => s.toLowerCase().includes(filterSkill.toLowerCase()))) return false;
    return true;
  });

  const totalHours = volunteers.reduce((sum: number, v: Volunteer) => sum + v.hoursContributed, 0);
  const totalTasks = volunteers.reduce((sum: number, v: Volunteer) => sum + v.tasksCompleted, 0);

  const handleStatusUpdate = async (volunteerId: string, newStatus: 'approved' | 'rejected' | 'active' | 'completed') => {
    try {
      await updateVolunteerApplicationStatus(volunteerId, newStatus);
      // Reload volunteers
      const applications = await getAllVolunteerApplications({
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      const initiatives = await fetchInitiatives();
      const initiativeMap = new Map(initiatives.map(i => [i.id, i.title]));
      
      const transformedVolunteers: Volunteer[] = applications.map((app: VolunteerApplication) => ({
        id: app.id || '',
        name: app.full_name,
        email: app.email,
        phone: app.phone || undefined,
        skills: app.skills || [],
        availability: app.availability_days?.join(', ') || 'Not specified',
        hoursContributed: app.hours_contributed || 0,
        tasksCompleted: app.tasks_completed || 0,
        certifications: [],
        badges: [],
        status: app.status || 'pending',
        initiativeTitle: initiativeMap.get(app.initiative_id),
        motivation: app.motivation,
        created_at: app.created_at
      }));
      
      setVolunteers(transformedVolunteers);
    } catch (err: any) {
      console.error('Error updating volunteer status:', err);
      alert('Failed to update volunteer status: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-mtaji-light-gray mb-2">Total Volunteers</div>
          <div className="text-3xl font-bold text-mtaji-primary">{volunteers.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-mtaji-light-gray mb-2">Total Hours</div>
          <div className="text-3xl font-bold text-mtaji-primary">{totalHours}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-mtaji-light-gray mb-2">Tasks Completed</div>
          <div className="text-3xl font-bold text-mtaji-primary">{totalTasks}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-sm text-mtaji-light-gray mb-2">Active This Month</div>
          <div className="text-3xl font-bold text-green-400">
            {volunteers.filter(v => v.hoursContributed > 0).length}
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search volunteers..."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
            />
          </div>
          <div>
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="all">All Skills</option>
              <option value="construction">Construction</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="administration">Administration</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Volunteer List */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Volunteer Database</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
            <p className="text-mtaji-light-gray">Loading volunteers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-2">Error loading volunteers</p>
            <p className="text-mtaji-light-gray text-sm">{error}</p>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-mtaji-light-gray text-lg">No volunteers found</p>
            {volunteers.length === 0 && (
              <p className="text-mtaji-light-gray text-sm mt-2">No volunteer applications have been submitted yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVolunteers.map((volunteer: Volunteer) => (
              <div
                key={volunteer.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold">{volunteer.name}</h4>
                      <span className="text-sm text-mtaji-light-gray">{volunteer.email}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        volunteer.status === 'approved' || volunteer.status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : volunteer.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : volunteer.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {volunteer.status}
                      </span>
                    </div>
                    {volunteer.initiativeTitle && (
                      <p className="text-sm text-mtaji-primary mb-2">📋 {volunteer.initiativeTitle}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-mtaji-light-gray mb-2">
                      {volunteer.phone && <span>📞 {volunteer.phone}</span>}
                      <span>⏱️ {volunteer.hoursContributed} hours</span>
                      <span>✅ {volunteer.tasksCompleted} tasks</span>
                      {volunteer.created_at && (
                        <span>📅 Applied: {new Date(volunteer.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {volunteer.availability && (
                      <p className="text-sm text-mtaji-light-gray mb-2">Available: {volunteer.availability}</p>
                    )}
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {volunteer.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-mtaji-primary/20 text-mtaji-primary rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {volunteer.motivation && (
                      <p className="text-sm text-mtaji-light-gray mt-2 italic line-clamp-2">{volunteer.motivation}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {volunteer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(volunteer.id, 'approved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(volunteer.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {volunteer.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(volunteer.id, 'active')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                      >
                        Activate
                      </button>
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

      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Volunteer Leaderboard</h3>
        <div className="text-center py-8 text-mtaji-light-gray">
          Leaderboard will display top volunteers by hours contributed
        </div>
      </div>
    </div>
  );
}
