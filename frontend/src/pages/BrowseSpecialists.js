import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, MapPin, Briefcase, Star, MessageCircle, Globe } from 'lucide-react';
import RequestChatDialog from '@/components/club/RequestChatDialog';

const BrowseSpecialists = () => {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSpec, setProfileSpec] = useState(null);

  useEffect(() => { loadSpecialists(); }, []);

  const loadSpecialists = async () => {
    try {
      const res = await api.getSpecialists();
      setSpecialists(res.data || []);
    } catch (e) {
      toast.error('Failed to load specialists');
    } finally {
      setLoading(false);
    }
  };

  const TYPES = [...new Set(specialists.map(s => s.specialist_type).filter(Boolean))];

  const filtered = specialists.filter(s => {
    if (filter && s.specialist_type !== filter) return false;
    return true;
  });

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Browse Specialists</h1>
        <p className="text-muted-foreground text-sm">Connect with professionals who can help your career</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${!filter ? 'bg-primary text-black border-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
          All
        </button>
        {TYPES.map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${filter === type ? 'bg-primary text-black border-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No specialists found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(spec => (
            <div key={spec.user_id} className="bg-card border border-border/50 rounded-sm p-5 hover:border-primary/50 transition-colors flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                {spec.profile_picture ? (
                  <img src={spec.profile_picture} alt={spec.name} className="w-14 h-14 rounded-sm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold uppercase truncate">{spec.name}</h3>
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
                    {spec.specialist_type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 flex-1">
                {spec.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{spec.city ? `${spec.city}, ` : ''}{spec.country}</span>
                  </div>
                )}
                {spec.years_experience && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-3 h-3 flex-shrink-0" />
                    <span>{spec.years_experience} years experience</span>
                  </div>
                )}
                {spec.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <a href={spec.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{spec.website}</a>
                  </div>
                )}
              </div>

              {/* Services */}
              {spec.services_offered?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {spec.services_offered.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">{s}</span>
                    ))}
                    {spec.services_offered.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{spec.services_offered.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{spec.bio || ""}</p>

              {/* CTA */}
              <button
                onClick={() => { setProfileSpec(spec); setProfileOpen(true); }}
                className="w-full border border-white/20 text-white font-bold uppercase text-xs py-2.5 rounded-sm hover:bg-white/5 transition-colors"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {profileOpen && profileSpec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setProfileOpen(false)}>
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              {profileSpec.profile_picture ? (
                <img src={profileSpec.profile_picture} alt={profileSpec.name} className="w-20 h-20 rounded-sm object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="font-heading font-bold uppercase text-xl">{profileSpec.name}</h2>
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">{profileSpec.specialist_type}</span>
                {profileSpec.country && <p className="text-sm text-muted-foreground mt-1">{profileSpec.city ? `${profileSpec.city}, ` : ''}{profileSpec.country}</p>}
              </div>
            </div>
            {profileSpec.bio && <p className="text-sm text-muted-foreground mb-4">{profileSpec.bio}</p>}
            {profileSpec.services_offered?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {profileSpec.services_offered.map((s, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profileSpec.years_experience && <p className="text-sm text-muted-foreground mb-2">Experience: {profileSpec.years_experience} years</p>}
            {profileSpec.languages?.length > 0 && <p className="text-sm text-muted-foreground mb-2">Languages: {profileSpec.languages.join(', ')}</p>}
            {profileSpec.website && <a href={profileSpec.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mb-4">{profileSpec.website}</a>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setProfileOpen(false)} className="flex-1 border border-white/20 rounded-sm py-2 text-sm hover:bg-white/5">Close</button>

            </div>
          </div>
        </div>
      )}

      {selectedSpecialist && (
        <RequestChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          playerId={selectedSpecialist.user_id}
          playerName={selectedSpecialist.name}
          onSent={() => toast.success('Chat request sent!')}
        />
      )}
    </div>
  );
};

export default BrowseSpecialists;
