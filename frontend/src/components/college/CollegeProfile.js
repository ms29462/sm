import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, Camera, Globe, MapPin, CheckCircle } from "lucide-react";

const DIVISIONS = [
  // USA
  "NCAA Division I",
  "NCAA Division II",
  "NCAA Division III",
  "NAIA",
  "NJCAA",
  "USCAA",
  // Canada
  "U SPORTS",
  "CCAA",
  // UK
  "BUCS Premier",
  "BUCS Championship",
  "BUCS Trophy",
  // Europe
  "EUSA",
  "French University Sports (FFSU)",
  "German University Sports (adh)",
  // Other
  "University Sport Australia",
  "Other"
];

const CollegeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", country: "", city: "", state: "",
    conference: "", division: "", logo: "",
    website: "", description: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getCollegeProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || "",
        country: response.data.country || "",
        city: response.data.city || "",
        state: response.data.state || "",
        conference: response.data.conference || "",
        division: response.data.division || "",
        logo: response.data.logo || "",
        website: response.data.website || "",
        description: response.data.description || ""
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange("logo", reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCollegeProfile(formData);
      toast.success("Profile updated successfully!");
      loadProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-heading font-bold uppercase">COLLEGE PROFILE</h1>
          {profile?.verified && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm text-xs uppercase tracking-wide">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground">Manage your college program information</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">

          {/* Logo */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {formData.logo ? (
                <img src={formData.logo} alt="College Logo" className="w-24 h-24 rounded-sm object-cover border-2 border-primary" />
              ) : (
                <div className="w-24 h-24 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <GraduationCap className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label htmlFor="logo" className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-sm cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4" />
                <input id="logo" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm ${profile?.approved ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"}`}>
                {profile?.approved ? "APPROVED" : "PENDING APPROVAL"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">College / University Name</Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Division</Label>
              <select value={formData.division} onChange={(e) => handleChange("division", e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer">
                <option value="">Select division...</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Conference</Label>
              <Input value={formData.conference} onChange={(e) => handleChange("conference", e.target.value)} placeholder="e.g., ACC, Big Ten, Pac-12" className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">State</Label>
              <Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="e.g., California" className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                <Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                <Input value={formData.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://athletics.university.edu" className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium uppercase tracking-wide">Description</Label>
              <Textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Tell players about your program..." className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[100px]" />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-8">
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeProfile;
