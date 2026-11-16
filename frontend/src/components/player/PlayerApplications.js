import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import useSocket from '@/hooks/useSocket';
import { useTranslation } from 'react-i18next';

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


const PlayerApplications = () => {
  const { t } = useTranslation();
  const { socket, on, off } = useSocket();

  const STATUS_LABELS = {
    submitted: t('applications.status_submitted'),
    under_review: t('applications.status_under_review'),
    interested: t('applications.status_interested'),
    rejected: t('applications.status_rejected'),
    under_evaluation: t('applications.status_under_evaluation'),
    video_analysis: t('applications.status_video_analysis'),
    interview_scheduled: t('applications.status_interview_scheduled'),
    trial_scheduled: t('applications.status_trial_scheduled'),
    contract_discussion: t('applications.status_contract_discussion'),
    offer_received: t('applications.status_offer_received'),
    signed: t('applications.status_signed'),
  };

  const REASON_LABELS = {
    position_not_needed: t('applications.reason_position_not_needed'),
    squad_complete: t('applications.reason_squad_complete'),
    age_mismatch: t('applications.reason_age_mismatch'),
    level_mismatch: t('applications.reason_level_mismatch'),
    physical_mismatch: t('applications.reason_physical_mismatch'),
    foot_mismatch: t('applications.reason_foot_mismatch'),
    eligibility: t('applications.reason_eligibility'),
    insufficient_video: t('applications.reason_insufficient_video'),
    incomplete_profile: t('applications.reason_incomplete_profile'),
    availability_location: t('applications.reason_availability_location'),
    opportunity_closed: t('applications.reason_opportunity_closed'),
  };

  const TIP_LABELS = {
    add_video: t('applications.tip_add_video'),
    complete_profile: t('applications.tip_complete_profile'),
    keep_updated: t('applications.tip_keep_updated'),
    apply_others: t('applications.tip_apply_others'),
  };
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
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t('applications.title')}</h1>
        <p className="text-muted-foreground">{t('applications.subtitle')}</p>
      </div>

      {/* Filters */}
      {applications.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">{t('applications.all_positions')}</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">{t('applications.all_leagues')}</option>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">{t('applications.all_countries')}</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
            <option value="">{t('applications.all_statuses')}</option>
            <option value="submitted">{t('applications.submitted')}</option>
            <option value="under_review">{t('applications.under_review')}</option>
            <option value="interested">{t('applications.status_interested')}</option>
            <option value="rejected">{t('applications.rejected')}</option>
          </select>
          {(filterPosition || filterLeague || filterStatus) && (
            <button onClick={() => { setFilterPosition(''); setFilterLeague(''); setFilterStatus(''); }}
              className="text-xs text-muted-foreground hover:text-white border border-white/10 rounded-sm px-3 py-1.5">
              {t('applications.clear')}
            </button>
          )}
        </div>
      )}

      {applications.length === 0 ? (
        <div data-testid="no-applications" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('applications.no_applications')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              data-testid={`application-card-${app.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-heading font-bold uppercase mb-0.5 truncate">
                      {app.opportunity.country || app.opportunity.club_country || "International"}
                    </h3>
                    <p className="text-sm font-medium text-primary">{app.opportunity.position}</p>
                    <p className="text-xs text-muted-foreground">{app.opportunity.league_level}</p>
                  {(app.opportunity.status === "closed" || app.opportunity.status === "filled") && (
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-sm border mt-1 ${
                      app.opportunity.status === "filled"
                        ? "text-blue-400 border-blue-400/30 bg-blue-400/10"
                        : "text-gray-400 border-gray-500/30 bg-gray-500/10"
                    }`}>
                      {app.opportunity.status === "filled" ? "🔒 Position Filled" : "⛔ Opportunity Closed"}
                    </span>
                  )}
                  {app.opportunity.club_id !== "anonymous" && app.opportunity.club_name && (
                    <p className="text-xs text-primary mt-0.5">{app.opportunity.club_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('applications.applied_label')} {app.created_at?.slice(0,10)}
                    {app.opportunity.deadline && <span className="block">{t('applications.deadline_label')} {app.opportunity.deadline}</span>}
                  </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
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
                {app.updated_at && app.status !== "pending" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('applications.decision')} {new Date(app.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              {app.status === "rejected" && app.feedback && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-4 mb-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400">{t('applications.feedback_title')}</p>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('applications.reasons_label')}</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {(app.feedback.reasons || []).filter(r => r !== "other").map(r => (
                        <li key={r} className="text-sm text-white/80">{REASON_LABELS[r] || r}</li>
                      ))}
                      {app.feedback.reasons?.includes("other") && app.feedback.other_text && (
                        <li className="text-sm text-white/80">{app.feedback.other_text}</li>
                      )}
                    </ul>
                  </div>
                  {app.feedback.tips?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('applications.suggestions_label')}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {app.feedback.tips.map(tip => (
                          <li key={tip} className="text-sm text-white/80">{TIP_LABELS[tip] || tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {app.feedback.message && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('applications.message_label')}</p>
                      <p className="text-sm text-white/80 italic">"{app.feedback.message}"</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/60 italic pt-1 border-t border-white/5">
                    {t('applications.disclaimer')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {app.opportunity.salary_range && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{t('applications.salary_range')}</span>
                    <span className="font-medium font-mono">{app.opportunity.salary_range}</span>
                  </div>
                )}
                {app.opportunity.contract_duration && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{t('applications.contract_duration')}</span>
                    <span className="font-medium">{app.opportunity.contract_duration}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-1">{t('applications.applied_on')}</span>
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
