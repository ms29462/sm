import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

const FIELD_LABELS = {
  date_of_birth: "Date of Birth",
  nationality: "Nationality",
  profile_picture: "Profile Photo",
  position: "Primary Position",
  preferred_foot: "Preferred Foot",
  playing_level: "Competition Level",
  height: "Height",
  weight: "Weight",
  current_club: "Current Club",
  current_country: "Current Country",
  residence_country: "Country of Residence",
  highlight_video: "Highlight Video",
  contract_status: "Contract Status",
  looking_for: "Looking For",
  bio: "Bio",
};

const ProfileCompletionBanner = () => {
  const [completion, setCompletion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProfileCompletion().then(r => setCompletion(r.data)).catch(() => {});
  }, []);

  if (!completion || completion.completion_score >= 100) return null;
  if (completion.status === "active" && completion.completion_score >= 75) return null;

  const score = completion.completion_score;
  const missing = completion.missing_fields?.slice(0, 3) || [];

  const color = score >= 75 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5" :
                score >= 50 ? "text-orange-400 border-orange-500/30 bg-orange-500/5" :
                "text-red-400 border-red-500/30 bg-red-500/5";

  const barColor = score >= 75 ? "bg-yellow-400" : score >= 50 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className={`border rounded-sm p-4 mb-6 ${color}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm uppercase tracking-wide">
              Profile {score}% Complete
              {!completion.is_visible && <span className="ml-2 text-xs font-normal normal-case">— Not visible to organizations</span>}
            </p>
            <p className="text-xs mt-1 opacity-80">
              Complete your profile to increase your visibility with clubs, federations and universities.
            </p>
            {missing.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {missing.map(f => (
                  <span key={f} className="text-[10px] border border-current/30 rounded-sm px-1.5 py-0.5 opacity-80">
                    {FIELD_LABELS[f] || f}
                  </span>
                ))}
                {completion.missing_fields?.length > 3 && (
                  <span className="text-[10px] opacity-60">+{completion.missing_fields.length - 3} more</span>
                )}
              </div>
            )}
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden w-full max-w-xs">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{width: `${score}%`}} />
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/player/profile')}
          className="flex items-center gap-1 text-xs font-bold uppercase border border-current rounded-sm px-3 py-2 hover:bg-white/10 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Complete Profile <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;