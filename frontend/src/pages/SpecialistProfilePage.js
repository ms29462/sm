import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, MapPin, Star, Globe, ArrowLeft, Briefcase, Clock, Languages } from 'lucide-react';

const SpecialistProfilePage = () => {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecialist();
  }, [specialistId]);

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
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-card border border-border/50 rounded-sm p-6 mb-4">
        <div className="flex items-start gap-5">
          {specialist.profile_picture ? (
            <img src={specialist.profile_picture} alt={specialist.name} className="w-24 h-24 rounded-sm object-cover flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-heading font-bold uppercase mb-1">{specialist.name}</h1>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-sm">
              {specialist.specialist_type}
            </span>
            {specialist.country && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <MapPin className="w-4 h-4" />
                {specialist.city ? `${specialist.city}, ` : ''}{specialist.country}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {specialist.bio && (
        <div className="bg-card border border-border/50 rounded-sm p-6 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">About</h2>
          <p className="text-sm leading-relaxed">{specialist.bio}</p>
        </div>
      )}

      {/* Details */}
      <div className="bg-card border border-border/50 rounded-sm p-6 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {specialist.years_experience && (
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Experience</p>
                <p className="text-sm font-medium">{specialist.years_experience} years</p>
              </div>
            </div>
          )}
          {specialist.hourly_rate && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Rate</p>
                <p className="text-sm font-medium">{specialist.hourly_rate}</p>
              </div>
            </div>
          )}
          {specialist.availability && (
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Availability</p>
                <p className="text-sm font-medium">{specialist.availability}</p>
              </div>
            </div>
          )}
          {specialist.languages?.length > 0 && (
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Languages</p>
                <p className="text-sm font-medium">{specialist.languages.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      {specialist.services_offered?.length > 0 && (
        <div className="bg-card border border-border/50 rounded-sm p-6 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Services</h2>
          <div className="flex flex-wrap gap-2">
            {specialist.services_offered.map((s, i) => (
              <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {specialist.certifications?.length > 0 && (
        <div className="bg-card border border-border/50 rounded-sm p-6 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Certifications</h2>
          <div className="flex flex-wrap gap-2">
            {specialist.certifications.map((c, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-sm">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Website */}
      {specialist.website && (
        <div className="bg-card border border-border/50 rounded-sm p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Links</h2>
          <a href={specialist.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Globe className="w-4 h-4" /> {specialist.website}
          </a>
        </div>
      )}
    </div>
  );
};

export default SpecialistProfilePage;
