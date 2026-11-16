import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shield, User, Phone, Mail, Building, Calendar, Globe, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-10 text-sm text-white outline-none";
const labelClass = "text-xs text-muted-foreground uppercase tracking-wide block mb-1";

const AgentRepresentation = () => {
  const { t } = useTranslation();

  const REPRESENTATION_STATUSES = [
    { value: "not_represented", label: t('agent_rep.not_represented') },
    { value: "represented", label: t('agent_rep.represented') },
    { value: "previously_represented", label: t('agent_rep.previously_represented') },
    { value: "prefer_not_to_say", label: t('agent_rep.prefer_not_to_say') },
  ];

  const MANDATE_STATUSES = [
    { value: "no_mandate", label: t('agent_rep.no_mandate') },
    { value: "active", label: t('agent_rep.active_mandate') },
    { value: "expiring_soon", label: t('agent_rep.expiring_soon') },
    { value: "exclusive", label: t('agent_rep.exclusive') },
    { value: "non_exclusive", label: t('agent_rep.non_exclusive') },
    { value: "unknown", label: t('agent_rep.unknown') },
  ];

  const [data, setData] = useState({
    representation_status: "",
    agent_name: "",
    agency_name: "",
    agent_email: "",
    agent_phone: "",
    mandate_status: "",
    mandate_expiration: "",
    markets_covered: "",
    allow_contact: false,
    allow_contact_sharing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getMyAgentRepresentation();
      if (res.data) setData(prev => ({ ...prev, ...res.data }));
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMyAgentRepresentation(data);
      toast.success(t('agent_rep_extra.save_success'));
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const isRepresented = data.representation_status === "represented";

  if (loading) return <div className="text-center py-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-heading font-bold uppercase">{t('agent_rep.title')}</h2>
      </div>

      {/* Representation Status */}
      <div className="bg-card border border-border/50 rounded-sm p-6">
        <h3 className="font-heading font-bold uppercase text-sm mb-4">{t('agent_rep.representation_status')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPRESENTATION_STATUSES.map(s => (
            <button key={s.value} onClick={() => setData(d => ({ ...d, representation_status: s.value }))}
              className={`p-3 text-left rounded-sm border text-sm transition-colors ${
                data.representation_status === s.value
                  ? "border-primary bg-primary/10 text-white"
                  : "border-white/10 text-muted-foreground hover:border-white/30"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Details - only if represented */}
      {isRepresented && (
        <div className="bg-card border border-border/50 rounded-sm p-6 space-y-4">
          <h3 className="font-heading font-bold uppercase text-sm">{t('agent_rep.agent_details')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('agent_rep.agent_name')}</label>
              <input value={data.agent_name} onChange={e => setData(d => ({...d, agent_name: e.target.value}))}
                placeholder="John Smith" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('agent_rep.agency_name')}</label>
              <input value={data.agency_name} onChange={e => setData(d => ({...d, agency_name: e.target.value}))}
                placeholder="Elite Sports Agency" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('agent_rep.agent_email')}</label>
              <input value={data.agent_email} onChange={e => setData(d => ({...d, agent_email: e.target.value}))}
                placeholder="agent@agency.com" type="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('agent_rep.agent_phone')}</label>
              <input value={data.agent_phone} onChange={e => setData(d => ({...d, agent_phone: e.target.value}))}
                placeholder="+1 234 567 8900" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('agent_rep.markets_covered')}</label>
              <input value={data.markets_covered} onChange={e => setData(d => ({...d, markets_covered: e.target.value}))}
                placeholder="Europe, North America..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('agent_rep.mandate_expiration')}</label>
              <input value={data.mandate_expiration} onChange={e => setData(d => ({...d, mandate_expiration: e.target.value}))}
                type="date" className={inputClass} />
            </div>
          </div>

          {/* Mandate Status */}
          <div>
            <label className={labelClass}>{t('agent_rep.mandate_status')}</label>
            <select value={data.mandate_status} onChange={e => setData(d => ({...d, mandate_status: e.target.value}))}
              className={inputClass + " cursor-pointer"}>
              <option value="">{t('agent_rep_extra.mandate_placeholder')}</option>
              {MANDATE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Privacy Settings */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h4 className="text-sm font-bold uppercase text-muted-foreground">{t('agent_rep.privacy_settings')}</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.allow_contact} onChange={e => setData(d => ({...d, allow_contact: e.target.checked}))}
                className="accent-primary w-4 h-4" />
              <div>
                <p className="text-sm">{t('agent_rep.allow_contact')}</p>
                <p className="text-xs text-muted-foreground">{t('agent_rep_extra.allow_contact_desc')}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.allow_contact_sharing} onChange={e => setData(d => ({...d, allow_contact_sharing: e.target.checked}))}
                className="accent-primary w-4 h-4" />
              <div>
                <p className="text-sm">{t('agent_rep_extra.allow_sharing_label')}</p>
                <p className="text-xs text-muted-foreground">{t('agent_rep_extra.allow_sharing_desc')}</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Privacy notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
        <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-400">{t('agent_rep_extra.privacy_note')}</p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-black font-bold rounded-sm">
        {saving ? t('agent_rep_extra.saving') : t('agent_rep.save_btn')}
      </Button>
    </div>
  );
};

export default AgentRepresentation;