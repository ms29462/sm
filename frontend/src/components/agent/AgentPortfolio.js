import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users, User, Plus, X, Trash2, Eye, Calendar, FileText,
  CheckCircle, XCircle, Clock, MapPin, ChevronDown, ChevronUp, Save
} from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-green-500/10 text-green-400 border-green-500/30',
  inactive: 'bg-white/5 text-muted-foreground border-white/10',
};

const APP_STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  accepted: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  shortlisted: 'bg-blue-500/10 text-blue-400',
  withdrawn: 'bg-white/5 text-muted-foreground',
};

const AgentPortfolio = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [playerApplications, setPlayerApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  // Add modal state
  const [addPlayerId, setAddPlayerId] = useState('');
  const [addSignedDate, setAddSignedDate] = useState('');
  const [addContractEnd, setAddContractEnd] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editingEntry, setEditingEntry] = useState(null); // entry id
  const [editNotes, setEditNotes] = useState('');
  const [editContractEnd, setEditContractEnd] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPortfolio(); }, []);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await api.getAgentPortfolio();
      setPortfolio(res.data || []);
    } catch {
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addPlayerId.trim()) { toast.error('Player ID is required'); return; }
    setAdding(true);
    try {
      await api.addPortfolioPlayer({
        player_id: addPlayerId.trim(),
        signed_date: addSignedDate || null,
        contract_end_date: addContractEnd || null,
        notes: addNotes || null,
        status: 'active',
      });
      toast.success('Player added to portfolio');
      setShowAddModal(false);
      setAddPlayerId(''); setAddSignedDate(''); setAddContractEnd(''); setAddNotes('');
      loadPortfolio();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add player');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (entryId, name) => {
    if (!window.confirm(`Remove ${name} from portfolio?`)) return;
    try {
      await api.deletePortfolioEntry(entryId);
      toast.success('Player removed from portfolio');
      setPortfolio(prev => prev.filter(e => e.id !== entryId));
      if (selectedEntry?.id === entryId) setSelectedEntry(null);
    } catch {
      toast.error('Failed to remove player');
    }
  };

  const openEditInline = (entry) => {
    setEditingEntry(entry.id);
    setEditNotes(entry.notes || '');
    setEditContractEnd(entry.contract_end_date || '');
    setEditStatus(entry.status || 'active');
  };

  const handleSaveEdit = async (entry) => {
    setSaving(true);
    try {
      await api.updatePortfolioEntry(entry.id, {
        notes: editNotes || null,
        contract_end_date: editContractEnd || null,
        status: editStatus,
      });
      toast.success('Updated');
      setEditingEntry(null);
      loadPortfolio();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openPlayerModal = async (entry) => {
    setSelectedEntry(entry);
    setPlayerApplications([]);
    setAppsLoading(true);
    try {
      const res = await api.getPortfolioPlayerApplications(entry.player_id);
      setPlayerApplications(res.data || []);
    } catch {
      setPlayerApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const activeCount = portfolio.filter(e => e.status === 'active').length;

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">My Portfolio</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {activeCount} active · {portfolio.length} total
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-black font-bold uppercase text-sm px-4 py-2.5 rounded-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Player
        </button>
      </div>

      {/* Portfolio list */}
      {portfolio.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No players in your portfolio yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-black font-bold uppercase text-sm px-4 py-2.5 rounded-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Player
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolio.map(entry => {
            const p = entry.player || {};
            const isEditing = editingEntry === entry.id;
            return (
              <div key={entry.id} className="bg-card border border-border/50 rounded-sm overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {p.profile_picture ? (
                      <img src={p.profile_picture} alt={p.name} className="w-12 h-12 rounded-sm object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold uppercase truncate">{p.name || entry.player_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-sm border ${STATUS_COLORS[entry.status] || STATUS_COLORS.inactive}`}>
                          {entry.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {p.position && <span className="text-xs text-primary">{p.position}</span>}
                        {p.nationality && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />{p.nationality}
                          </span>
                        )}
                        {p.current_club && <span className="text-xs text-muted-foreground">{p.current_club}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {entry.signed_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> Signed: {entry.signed_date}
                          </span>
                        )}
                        {entry.contract_end_date && !isEditing && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Ends: {entry.contract_end_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openPlayerModal(entry)}
                      className="flex items-center gap-1.5 text-xs border border-white/20 px-3 py-1.5 rounded-sm hover:bg-white/5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button
                      onClick={() => navigate(`/agent/player/${entry.player_id}`)}
                      className="flex items-center gap-1.5 text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button
                      onClick={() => isEditing ? setEditingEntry(null) : openEditInline(entry)}
                      className="flex items-center gap-1.5 text-xs border border-white/20 px-3 py-1.5 rounded-sm hover:bg-white/5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, p.name || entry.player_name)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div className="border-t border-border/50 p-4 bg-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1 block text-muted-foreground">Contract End Date</label>
                        <input
                          type="date"
                          value={editContractEnd}
                          onChange={e => setEditContractEnd(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1 block text-muted-foreground">Status</label>
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <button
                          onClick={() => handleSaveEdit(entry)}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide mb-1 block text-muted-foreground">Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="Private notes about this player..."
                        className="w-full bg-black/30 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Notes preview (when not editing) */}
                {!isEditing && entry.notes && (
                  <div className="border-t border-border/50 px-4 py-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold uppercase">Add Player to Portfolio</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Enter the player's User ID. You can find it in their profile URL or via the Search Players page.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block">Player ID *</label>
                <input
                  value={addPlayerId}
                  onChange={e => setAddPlayerId(e.target.value)}
                  placeholder="e.g. abc123..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block">Signed Date</label>
                <input
                  type="date"
                  value={addSignedDate}
                  onChange={e => setAddSignedDate(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block">Contract End Date</label>
                <input
                  type="date"
                  value={addContractEnd}
                  onChange={e => setAddContractEnd(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block">Notes</label>
                <textarea
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  rows={3}
                  placeholder="Private notes..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 border border-white/20 rounded-sm py-2.5 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {adding ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                {selectedEntry.player?.profile_picture ? (
                  <img src={selectedEntry.player.profile_picture} alt={selectedEntry.player.name}
                    className="w-10 h-10 rounded-sm object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold uppercase">{selectedEntry.player?.name || selectedEntry.player_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedEntry.player?.position} · {selectedEntry.player?.nationality}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/agent/player/${selectedEntry.player_id}`)}
                  className="text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
                >
                  Full Profile
                </button>
                <button onClick={() => setSelectedEntry(null)} className="text-muted-foreground hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Contract info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Signed Date</p>
                  <p className="text-sm font-medium">{selectedEntry.signed_date || '—'}</p>
                </div>
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Contract End</p>
                  <p className="text-sm font-medium">{selectedEntry.contract_end_date || '—'}</p>
                </div>
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-sm border ${STATUS_COLORS[selectedEntry.status] || STATUS_COLORS.inactive}`}>
                    {selectedEntry.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Club</p>
                  <p className="text-sm font-medium">{selectedEntry.player?.current_club || '—'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedEntry.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{selectedEntry.notes}</p>
                </div>
              )}

              {/* Applications */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Applications</p>
                {appsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : playerApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications found.</p>
                ) : (
                  <div className="space-y-2">
                    {playerApplications.map((app, i) => (
                      <div key={i} className="bg-black/20 rounded-sm p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {app.opportunity?.title || 'Opportunity'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.opportunity?.club_name} {app.opportunity?.location ? `· ${app.opportunity.location}` : ''}
                          </p>
                          {app.created_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Applied: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-sm flex-shrink-0 ${APP_STATUS_COLORS[app.status] || 'bg-white/5 text-muted-foreground'}`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPortfolio;
