import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { NATIONALITIES, LEVELS, LEAGUES } from '@/lib/constants';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'Winger', 'Striker'];
const FEET = ['Left', 'Right', 'Both'];
const GENDERS = ['Male', 'Female'];

const EMPTY_FORM = {
  name: '', position: '', secondary_position: '', nationality: '', nationality_2: '',
  age: '', height: '', weight: '', preferred_foot: '', current_club: '',
  playing_level: '', league: '', highlight_video: '', profile_picture: '',
  gender: '', games: '', goals: '', assists: '',
  season_games: '', season_goals: '', season_assists: '', description: '',
  full_game_videos: [''],
};

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-bold uppercase tracking-wide mb-1 block">{label}</Label>
    {children}
  </div>
);

const inp = "bg-black/20 border-white/10 focus:border-primary rounded-sm h-10 text-sm";
const sel = "w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary";

const AcademyPlayers = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const res = await api.getAcademyPlayers();
      setPlayers(res.data || []);
    } catch { toast.error('Failed to load players'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name || '', position: p.position || '', secondary_position: p.secondary_position || '',
      nationality: p.nationality || '', nationality_2: p.nationality_2 || '',
      age: p.age || '', height: p.height || '', weight: p.weight || '',
      preferred_foot: p.preferred_foot || '', current_club: p.current_club || '',
      playing_level: p.playing_level || '', league: p.league || '',
      highlight_video: p.highlight_video || '', profile_picture: p.profile_picture || '',
      gender: p.gender || '', games: p.games || '', goals: p.goals || '', assists: p.assists || '',
      season_games: p.season_games || '', season_goals: p.season_goals || '', season_assists: p.season_assists || '',
      description: p.description || '',
      full_game_videos: (p.full_game_videos && p.full_game_videos.length > 0) ? p.full_game_videos : [''],
    });
    setEditingId(p.user_id);
    setShowModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => set('profile_picture', reader.result);
    reader.readAsDataURL(file);
  };

  const setVideoLink = (i, v) => {
    const videos = [...form.full_game_videos];
    videos[i] = v;
    set('full_game_videos', videos);
  };

  const addVideoLink = () => set('full_game_videos', [...form.full_game_videos, '']);
  const removeVideoLink = (i) => set('full_game_videos', form.full_game_videos.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.name) { toast.error('Player name is required'); return; }
    if (!form.highlight_video || !form.highlight_video.trim()) {
      toast.error('Highlight video is required');
      return;
    }
    setSaving(true);
    try {
      const filteredVideos = form.full_game_videos.filter(v => v.trim());
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
        height: form.height ? parseInt(form.height) : undefined,
        weight: form.weight ? parseInt(form.weight) : undefined,
        games: form.games ? parseInt(form.games) : undefined,
        goals: form.goals ? parseInt(form.goals) : undefined,
        assists: form.assists ? parseInt(form.assists) : undefined,
        season_games: form.season_games ? parseInt(form.season_games) : undefined,
        season_goals: form.season_goals ? parseInt(form.season_goals) : undefined,
        season_assists: form.season_assists ? parseInt(form.season_assists) : undefined,
        full_game_videos: filteredVideos.length > 0 ? filteredVideos : undefined,
      };
      if (editingId) {
        await api.updateAcademyPlayer(editingId, payload);
        toast.success('Player updated!');
      } else {
        await api.createAcademyPlayer(payload);
        toast.success('Player added!');
      }
      setShowModal(false);
      loadPlayers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save player');
    } finally { setSaving(false); }
  };

  const handleDelete = async (playerId, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.deleteAcademyPlayer(playerId);
      toast.success('Player deleted');
      setPlayers(prev => prev.filter(p => p.user_id !== playerId));
    } catch { toast.error('Failed to delete player'); }
  };

  const filtered = players.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.position?.toLowerCase().includes(search.toLowerCase()) ||
    p.nationality?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">MY PLAYERS</h1>
          <p className="text-muted-foreground">Manage your academy's player roster</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-black font-bold uppercase text-xs rounded-sm h-10 px-4 hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Player
        </Button>
      </div>

      <div className="mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, position, nationality..."
          className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{players.length === 0 ? "No players added yet" : "No players match your search"}</p>
          {players.length === 0 && (
            <Button onClick={openAdd} className="bg-primary text-black font-bold uppercase text-sm rounded-sm h-10 px-6">
              Add First Player
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.user_id} className="bg-card border border-border/50 p-4 rounded-sm hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                {p.profile_picture ? (
                  <img src={p.profile_picture} alt={p.name} className="w-14 h-14 rounded-sm object-cover border border-border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center border border-border flex-shrink-0">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/academy/player/${p.user_id}`)}>
                  <p className="font-heading font-bold uppercase text-base truncate hover:text-primary transition-colors">{p.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {p.position && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">{p.position}</span>}
                    {p.age && <span className="text-xs text-muted-foreground">{p.age}y</span>}
                    {p.nationality && <span className="text-xs text-muted-foreground">{p.nationality}</span>}
                    {p.playing_level && <span className="text-xs text-muted-foreground">{p.playing_level}</span>}
                    {p.height && <span className="text-xs text-muted-foreground">{p.height}cm</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="text-muted-foreground hover:text-white w-8 h-8">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.user_id, p.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10 w-8 h-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="bg-card border border-border/50 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-heading font-bold uppercase">{editingId ? 'Edit Player' : 'Add Player'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Photo */}
              <div className="flex items-center gap-4">
                {form.profile_picture ? (
                  <img src={form.profile_picture} alt="" className="w-16 h-16 rounded-sm object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border border-border">
                    <Users className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <label className="bg-muted hover:bg-muted/80 px-4 h-10 rounded-sm flex items-center cursor-pointer text-sm">
                  <Upload className="w-4 h-4 mr-2" /> Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <Input value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="Player's full name" />
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Position">
                  <select value={form.position} onChange={e => set('position', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Secondary Position">
                  <select value={form.secondary_position} onChange={e => set('secondary_position', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Nationality">
                  <select value={form.nationality} onChange={e => set('nationality', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Nationality 2">
                  <select value={form.nationality_2} onChange={e => set('nationality_2', e.target.value)} className={sel}>
                    <option value="">Select (optional)</option>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Age">
                  <Input type="number" value={form.age} onChange={e => set('age', e.target.value)} className={inp} placeholder="e.g., 18" />
                </Field>
                <Field label="Preferred Foot">
                  <select value={form.preferred_foot} onChange={e => set('preferred_foot', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {FEET.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Height (cm)">
                  <Input type="number" value={form.height} onChange={e => set('height', e.target.value)} className={inp} placeholder="e.g., 178" />
                </Field>
                <Field label="Weight (kg)">
                  <Input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} className={inp} placeholder="e.g., 75" />
                </Field>
                <Field label="Current Club">
                  <Input value={form.current_club} onChange={e => set('current_club', e.target.value)} className={inp} placeholder="e.g., AS Monaco" />
                </Field>
                <Field label="Playing Level">
                  <select value={form.playing_level} onChange={e => set('playing_level', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="League">
                  <select value={form.league} onChange={e => set('league', e.target.value)} className={sel}>
                    <option value="">Select</option>
                    {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
              </div>

              {/* Highlight Video — required */}
              <Field label="Highlight Video (YouTube/Vimeo) *">
                <Input
                  value={form.highlight_video}
                  onChange={e => set('highlight_video', e.target.value)}
                  className={inp}
                  placeholder="https://youtube.com/..."
                />
              </Field>

              {/* Full Match Videos */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide mb-1 block">
                  Full Match Videos <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Add links to full match recordings</p>
                {form.full_game_videos.map((v, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      value={v}
                      onChange={e => setVideoLink(i, e.target.value)}
                      placeholder={`Full match ${i + 1} (YouTube/Vimeo)...`}
                      className={inp + ' flex-1'}
                    />
                    {form.full_game_videos.length > 1 && (
                      <button
                        onClick={() => removeVideoLink(i)}
                        className="px-3 text-red-400 border border-red-500/20 rounded-sm hover:bg-red-500/10"
                      >×</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addVideoLink}
                  className="text-xs text-primary border border-primary/20 rounded-sm px-3 py-1.5 hover:bg-primary/10 transition-colors"
                >
                  + Add another match
                </button>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Career Stats</p>
                <div className="grid grid-cols-3 gap-3">
                  {[['games','Games'],['goals','Goals'],['assists','Assists']].map(([k,l]) => (
                    <Field key={k} label={l}>
                      <Input type="number" value={form[k]} onChange={e => set(k, e.target.value)} className={inp} placeholder="0" />
                    </Field>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">This Season</p>
                <div className="grid grid-cols-3 gap-3">
                  {[['season_games','Games'],['season_goals','Goals'],['season_assists','Assists']].map(([k,l]) => (
                    <Field key={k} label={l}>
                      <Input type="number" value={form[k]} onChange={e => set(k, e.target.value)} className={inp} placeholder="0" />
                    </Field>
                  ))}
                </div>
              </div>

              <Field label="Notes / Description">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm p-3 text-sm text-white outline-none focus:border-primary min-h-[80px]"
                  placeholder="Additional notes about this player..." />
              </Field>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-sm h-11 border-white/20">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-black font-bold rounded-sm h-11 hover:bg-primary/90">
                {saving ? 'Saving...' : editingId ? 'Update Player' : 'Add Player'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyPlayers;
