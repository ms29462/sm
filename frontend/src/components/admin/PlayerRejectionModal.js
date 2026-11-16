import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REASONS = [
  { code: 'incomplete_profile',  label: 'Profile information is incomplete' },
  { code: 'missing_video',       label: 'No highlight video provided' },
  { code: 'invalid_video',       label: 'Highlight video link is invalid or not accessible' },
  { code: 'not_football',        label: 'Profile does not appear to be football-related' },
  { code: 'fake_profile',        label: 'Profile contains incorrect or unverifiable information' },
  { code: 'duplicate_account',   label: 'Duplicate account detected' },
  { code: 'quality_too_low',     label: 'Video quality is insufficient to review the profile' },
  { code: 'criteria_not_met',    label: 'Profile does not meet our current platform criteria' },
  { code: 'age_underage',        label: 'Player does not meet the minimum age requirement' },
  { code: 'spam_bot',            label: 'Profile has been flagged as spam' },
];

const PlayerRejectionModal = ({ userId, playerName, onConfirmed, onCancel }) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (code) =>
    setSelectedReasons(prev =>
      prev.includes(code) ? prev.filter(r => r !== code) : [...prev, code]
    );

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      toast.error('Please select at least one reason');
      return;
    }
    setSubmitting(true);
    try {
      await api.rejectPlayer(userId, {
        reasons: selectedReasons,
        message: message.trim() || null,
      });
      toast.success('Player rejected and notified by email');
      onConfirmed();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to reject player');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-heading font-bold uppercase">Reject Registration</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{playerName}</p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Reasons <span className="text-red-400">*</span>
            </p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.code} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(r.code)}
                    onChange={() => toggle(r.code)}
                    className="mt-0.5 accent-primary cursor-pointer"
                  />
                  <span className={`text-sm transition-colors ${selectedReasons.includes(r.code) ? 'text-white' : 'text-muted-foreground group-hover:text-white/80'}`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Additional note <span className="text-muted-foreground/50">(optional)</span>
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a personal note to the player (included in the email)..."
              className="w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 py-2 text-sm text-white outline-none transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground/50 text-right mt-1">{message.length}/500</p>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-3">
            <p className="text-xs text-red-400">
              The player will receive an email explaining why their registration was not approved.
              This action marks their account as rejected.
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onCancel} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedReasons.length === 0}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? 'Rejecting...' : 'Reject & Notify'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerRejectionModal;
