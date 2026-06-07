import { useState, useEffect } from 'react';
import { Save, Award } from 'lucide-react';
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
        toast.error('Failed to load profile');
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
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
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
        <h1 className="text-xl lg:text-2xl font-heading font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your professional information</p>
      </div>

      {/* Status Card */}
      <Card className={profile?.approved ? 'border-emerald-500/30' : 'border-amber-500/30'}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${profile?.approved ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              <Award className={`w-5 h-5 lg:w-6 lg:h-6 ${profile?.approved ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <p className="font-medium text-sm lg:text-base">
                {profile?.approved ? 'Account Approved' : 'Pending Approval'}
              </p>
              {profile?.verified && (
                <p className="text-sm text-primary">Verified Analyst</p>
              )}
              <p className="text-xs lg:text-sm text-muted-foreground">
                {profile?.evaluations_count || 0} evaluations completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="organization" className="text-sm">Organization / Club</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="e.g., FC Barcelona, FA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm">Country</Label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1.5 w-full bg-zinc-800/50 border border-zinc-700 rounded-md h-10 px-3 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="">Select country...</option>
                  <option>Afghanistan</option><option>Albania</option><option>Algeria</option><option>Angola</option><option>Argentina</option>
                  <option>Australia</option><option>Austria</option><option>Belgium</option><option>Bolivia</option><option>Brazil</option>
                  <option>Cameroon</option><option>Canada</option><option>Chile</option><option>China</option><option>Colombia</option>
                  <option>Congo</option><option>Costa Rica</option><option>Croatia</option><option>Czech Republic</option><option>Denmark</option>
                  <option>DR Congo</option><option>Ecuador</option><option>Egypt</option><option>England</option><option>Ethiopia</option>
                  <option>Finland</option><option>France</option><option>Germany</option><option>Ghana</option><option>Greece</option>
                  <option>Guinea</option><option>Honduras</option><option>Hungary</option><option>India</option><option>Indonesia</option>
                  <option>Iran</option><option>Ireland</option><option>Israel</option><option>Italy</option><option>Ivory Coast</option>
                  <option>Jamaica</option><option>Japan</option><option>Jordan</option><option>Kenya</option><option>Mali</option>
                  <option>Mexico</option><option>Morocco</option><option>Netherlands</option><option>New Zealand</option><option>Nigeria</option>
                  <option>Norway</option><option>Panama</option><option>Paraguay</option><option>Peru</option><option>Poland</option>
                  <option>Portugal</option><option>Romania</option><option>Russia</option><option>Saudi Arabia</option><option>Scotland</option>
                  <option>Senegal</option><option>Serbia</option><option>South Africa</option><option>South Korea</option><option>Spain</option>
                  <option>Sweden</option><option>Switzerland</option><option>Tunisia</option><option>Turkey</option><option>Uganda</option>
                  <option>Ukraine</option><option>United Kingdom</option><option>United States</option><option>Uruguay</option>
                  <option>Venezuela</option><option>Wales</option><option>Zambia</option><option>Zimbabwe</option>
                </select>
              </div>
              <div>
                <Label htmlFor="years_experience" className="text-sm">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization" className="text-sm">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                placeholder="e.g., Youth Scouting, Tactical Analysis, Performance"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[80px] lg:min-h-[100px]"
                placeholder="Describe your experience and expertise..."
              />
            </div>

            {/* Certifications */}
            <div>
              <Label className="text-sm">Certifications & Licenses</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700"
                  placeholder="e.g., UEFA Pro License"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" variant="outline" onClick={addCertification} className="shrink-0">
                  Add
                </Button>
              </div>
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs lg:text-sm"
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AnalystProfile;
