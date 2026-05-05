import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Flag, Upload, CheckCircle, Globe, Calendar, MapPin } from "lucide-react";
import { NATIONALITIES } from "@/lib/constants";

const FederationProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", country: "", city: "", logo: "",
    description: "", website: "", founded_year: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getFederationProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || "",
        country: response.data.country || "",
        city: response.data.city || "",
        logo: response.data.logo || "",
        description: response.data.description || "",
        website: response.data.website || "",
        founded_year: response.data.founded_year || ""
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateFederationProfile(formData);
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
          <h1 className="text-3xl font-heading font-bold uppercase">FEDERATION PROFILE</h1>
          {profile?.verified && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm text-xs uppercase tracking-wide">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground">Manage your federation information</p>
        {!profile?.approved && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm">
            <p className="text-yellow-500 text-sm">Your federation is pending admin approval.</p>
          </div>
        )}
        {profile?.approved && !profile?.verified && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm">
            <p className="text-blue-400 text-sm">Your federation is approved. Contact admin to get verified status.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <Flag className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">Federation Details</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                Federation Name *
              </Label>
              <Input
                id="name"
                data-testid="federation-name-input"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                placeholder="e.g., Cameroon Football Federation"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="country" className="text-sm font-medium uppercase tracking-wide">
                  Country *
                </Label>
                <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                  <SelectTrigger
                    id="country"
                    data-testid="country-select"
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((nat) => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Players with this nationality will be recommended to you
                </p>
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-medium uppercase tracking-wide">
                  City
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9"
                    placeholder="e.g., Yaounde"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="website" className="text-sm font-medium uppercase tracking-wide">
                  Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9"
                    placeholder="https://www.federation.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="founded_year" className="text-sm font-medium uppercase tracking-wide">
                  Founded Year
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                  <Input
                    id="founded_year"
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => handleChange("founded_year", parseInt(e.target.value))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9"
                    placeholder="e.g., 1959"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="logo" className="text-sm font-medium uppercase tracking-wide">
                Federation Logo
              </Label>
              <div className="mt-2 flex items-center space-x-4">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt="Federation logo"
                    className="w-20 h-20 rounded-sm object-cover border border-border"
                  />
                )}
                <label className="bg-muted hover:bg-muted/80 px-4 h-12 rounded-sm flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                id="description"
                data-testid="description-input"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[100px]"
                placeholder="Brief description of your federation..."
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          data-testid="save-profile-btn"
          disabled={saving}
          className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
        >
          {saving ? "SAVING..." : "SAVE PROFILE"}
        </Button>
      </form>
    </div>
  );
};

export default FederationProfile;
