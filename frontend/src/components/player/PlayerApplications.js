import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import useSocket from '@/hooks/useSocket';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  under_review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  interested: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  // Pipeline stages
  under_evaluation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  interview_scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  trial_scheduled: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  offer_received: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  signed: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const STATUS_LABELS = {
  submitted: 'Application Submitted',
  under_review: 'Under Review',
  interested: 'Selected for Evaluation',
  rejected: 'Not Selected',
  under_evaluation: 'Under Evaluation',
  video_analysis: 'Video Analysis',
  interview_scheduled: 'Interview Scheduled',
  trial_scheduled: 'Trial Scheduled',
  contract_discussion: 'Contract Discussion',
  offer_received: 'Offer Received',
  signed: 'Signed',
};

const PlayerApplications = () => {
  const { socket, on, off } = useSocket();
  const [applications, setApplications] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [filterPosition, setFilterPosition] = useState('');
  const [filterLeague, setFilterLeague] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (data) => {
      if (data.type === "application_update") {
        loadApplications();
        toast.info("Your application status has been updated");
      }
    };
    on("notification", handleNotification);
    return () => off("notification", handleNotification);
  }, [socket, on, off]);

  const loadApplications = async () => {
    try {
      const [appsResponse, scoresResponse] = await Promise.all([
        api.getMyApplications(),
        api.getPlayerMatchScores().catch(() => ({ data: { scores: [] } }))
      ]);
      setApplications(appsResponse.data);
      // Build scores map by opportunity_id
      const scoresMap = {};
      (scoresResponse.data.scores || []).forEach(s => {
        scoresMap[s.opportunity_id] = s.fit_score;
      });
      setMatchScores(scoresMap);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterPosition && app.opportunity?.position !== filterPosition) return false;
    if (filterLeague && app.opportunity?.league_level !== filterLeague) return false;
    if (filterStatus && app.status !== filterStatus) return false;
    if (filterCountry && (app.opportunity?.country || app.opportunity?.club_country) !== filterCountry) return false;
    return true;
  });

  // Get unique values for filters
  const positions = [...new Set(applications.map(a => a.opportunity?.position).filter(Boolean))];
  const countries = [...new Set(applications.map(a => a.opportunity?.country || a.opportunity?.club_country).filter(Boolean))];
  const leagues = [...new Set(applications.map(a => a.opportunity?.league_level).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">MY APPLICATIONS</h1>
        <p className="text-muted-foreground">Track your application status</p>
      </div>

      {/* Filters */}
      {applications.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">All Leagues</option>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="interested">Selected for Evaluation</option>
            <option value="rejected">Not Selected</option>
          </select>
          {(filterPosition || filterLeague || filterStatus) && (
            <button onClick={() => { setFilterPosition(''); setFilterLeague(''); setFilterStatus(''); }}
              className="text-xs text-muted-foreground hover:text-white border border-white/10 rounded-sm px-3 py-1.5">
              Clear
            </button>
          )}
        </div>
      )}

      {applications.length === 0 ? (
        <div data-testid="no-applications" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You haven't applied to any opportunities yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              data-testid={`application-card-${app.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-heading font-bold uppercase mb-1 truncate">
                    {app.opportunity.country || app.opportunity.club_country || "International"} — {app.opportunity.position}
                  </h3>
                  <p className="text-sm text-muted-foreground">{app.opportunity.league_level}</p>
                  {app.opportunity.club_id !== "anonymous" && app.opportunity.club_name && (
                    <p className="text-xs text-primary mt-0.5">{app.opportunity.club_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applied: {app.created_at?.slice(0,10)}
                    {app.opportunity.deadline && ` · Deadline: ${app.opportunity.deadline}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(matchScores[app.opportunity_id] != null) && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Fit</p>
                      <p className={`text-lg font-bold font-heading ${
                        matchScores[app.opportunity_id] >= 70 ? "text-green-400" :
                        matchScores[app.opportunity_id] >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}>{matchScores[app.opportunity_id]}%</p>
                    </div>
                  )}
                  <span
                    data-testid={`status-${app.id}`}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${STATUS_COLORS[app.status]}`}
                  >
  {app.player_status_label || app.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {app.opportunity.salary_range && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Salary Range</span>
                    <span className="font-medium font-mono">{app.opportunity.salary_range}</span>
                  </div>
                )}
                {app.opportunity.contract_duration && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Contract Duration</span>
                    <span className="font-medium">{app.opportunity.contract_duration}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-1">Applied On</span>
                  <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerApplications;
