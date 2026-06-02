import { useState, useEffect } from 'react';
import { Save, Award, Building, MapPin, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AnalystProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    bio: '',
    country: '',
    specialization: '',
    years_experience: '',
    certifications: []
  });
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getAnalystProfile();
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          organization: response.data.organization || '',
          bio: response.data.bio || '',
          country: response.data.country || '',
          specialization: response.data.specialization || '',
          years_experience: response.data.years_experience || '',
          certifications: response.data.certifications || []
        });
      } catch (error) {
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null
      };
      const response = await api.updateAnalystProfile(updateData);
      setProfile(response.data);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()]
      });
      setNewCertification('');
    }
  };

  const removeCertification = (cert) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations professionnelles</p>
      </div>

      {/* Status Card */}
      <Card className={profile?.approved ? 'border-emerald-500/30' : 'border-amber-500/30'}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${profile?.approved ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              <Award className={`w-6 h-6 ${profile?.approved ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <p className="font-medium">
                {profile?.approved ? 'Compte Approuvé' : 'En Attente d\'Approbation'}
              </p>
              {profile?.verified && (
                <p className="text-sm text-primary">Analyste Vérifié</p>
              )}
              <p className="text-sm text-muted-foreground">
                {profile?.evaluations_count || 0} évaluations réalisées
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom Complet</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organisation / Club</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Ex: FC Barcelona, FFF"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Ex: France"
                />
              </div>
              <div>
                <Label htmlFor="years_experience">Années d'expérience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">Spécialisation</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                placeholder="Ex: Scouting Jeunes, Analyse Tactique, Performance"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[100px]"
                placeholder="Décrivez votre parcours et votre expertise..."
              />
            </div>

            {/* Certifications */}
            <div>
              <Label>Certifications & Diplômes</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700"
                  placeholder="Ex: UEFA Pro License"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" variant="outline" onClick={addCertification}>
                  Ajouter
                </Button>
              </div>
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      <Award className="w-3 h-3" />
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(cert)}
                        className="ml-1 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-primary text-black hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AnalystProfile;
