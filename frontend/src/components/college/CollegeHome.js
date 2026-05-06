import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, GraduationCap, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CollegeHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getCollegeProfile();
      setProfile(response.data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">DASHBOARD</h1>
        <p className="text-muted-foreground">Welcome, {profile?.name}</p>
      </div>

      {!profile?.approved && (
        <div className="bg-card border border-yellow-500/50 p-6 rounded-sm mb-8 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-heading font-bold text-lg mb-2">APPROVAL PENDING</h3>
            <p className="text-muted-foreground">Your college profile is awaiting admin approval.</p>
            <Button onClick={() => navigate("/college/profile")} className="mt-4 bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 px-6">
              COMPLETE PROFILE
            </Button>
          </div>
        </div>
      )}

      {profile?.approved && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-sm mb-8 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-500 text-sm font-medium">Your college account is approved</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate("/college/players")}
          className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
        >
          <Users className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-xl font-heading font-bold uppercase mb-2">Search Players</h3>
          <p className="text-muted-foreground text-sm">Find players that match your program needs</p>
        </div>
        <div
          onClick={() => navigate("/college/profile")}
          className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
        >
          <GraduationCap className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-xl font-heading font-bold uppercase mb-2">College Profile</h3>
          <p className="text-muted-foreground text-sm">Manage your college program information</p>
        </div>
      </div>
    </div>
  );
};

export default CollegeHome;
