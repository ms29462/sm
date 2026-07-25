import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, MapPin, Star, Globe, ArrowLeft, Briefcase, Clock, Languages, Award } from 'lucide-react';

const SpecialistProfilePage = () => {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSpecialist(); }, [specialistId]);

  const loadSpecialist = async () => {
    try {
      const res = await api.getSpecialistById(specialistId);
      setSpecialist(res.data);
    } catch (e) {
      toast.error('Failed to load specialist profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  if (!specialist) return (
    <div className="p-8 text-center text-muted-foreground">Specialist not found.</div>
  );

  return (
    <div className="p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero Header */}
      <div className="bg-card border border-border/50 rounded-sm p-6 md:p-8 mb-4">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {specialist.profile_picture ? (
            <img src={specialist.profile_picture} alt={specialist.name}
              className="w-32 h-32 rounded-sm object-cover flex-shrink-0 border border-border/50" />
          ) : (
            <div className="w-32 h-32 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{specialist.name}</h1>
            <span className="inline-block text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-sm mb-3">
              {specialist.specialist_type}
            </span>
            {specialist.country && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                {specialist.city ? `${specialist.city}, ` : ''}{specialist.country}
              </div>
            )}
            {/* Quick stats row */}
            <div className="flex flex-wrap gap-4">
              {specialist.years_experience && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{specialist.years_experience} years experience</span>
                </div>
              )}
              {specialist.availability && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{specialist.availability}</span>
                </div>
              )}
              {specialist.hourly_rate && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{specialist.hourly_rate}/hr</span>
                </div>
              )}
              {specialist.languages?.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{specialist.languages.join(', ')}</span>
                </div>
              )}
              {specialist.current_club && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Works with: {specialist.current_club}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bio */}
        {specialist.bio && (
          <div className="bg-card border border-border/50 rounded-sm p-6 md:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">About</h2>
            <p className="text-sm leading-relaxed">{specialist.bio}</p>
          </div>
        )}

        {/* Services */}
        {specialist.services_offered?.length > 0 && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Services</h2>
            <div className="flex flex-wrap gap-2">
              {specialist.services_offered.map((s, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {specialist.certifications?.length > 0 && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Certifications</h2>
            <div className="flex flex-wrap gap-2">
              {specialist.certifications.map((c, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-sm">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Website / LinkedIn */}
        {(specialist.website || specialist.linkedin || specialist.instagram || specialist.facebook) && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Links</h2>
            <div className="space-y-2">
              {specialist.website && (
                <a href={specialist.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> {specialist.website}
                </a>
              )}
              {specialist.linkedin && (
                <a href={specialist.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Award className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {specialist.instagram && (
                <a href={specialist.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> Instagram
                </a>
              )}
              {specialist.facebook && (
                <a href={specialist.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialistProfilePage;
