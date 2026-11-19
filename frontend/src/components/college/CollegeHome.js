import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, GraduationCap, AlertCircle, CheckCircle, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CollegeHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        <div className="text-primary text-xl font-heading">{t("college_home.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">{t("college_home.dashboard")}</h1>
        <p className="text-muted-foreground">{t("college_home.welcome", { name: profile?.name })}</p>
      </div>

      {!profile?.approved && (
        <div className="bg-card border border-yellow-500/50 p-6 rounded-sm mb-8 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-heading font-bold text-lg mb-2">{t("college_home.approval_pending")}</h3>
            <p className="text-muted-foreground">{t("college_home.approval_body")}</p>
            <Button onClick={() => navigate("/college/profile")} className="mt-4 bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 px-6">
              {t("college_home.complete_profile")}
            </Button>
          </div>
        </div>
      )}

      {profile?.approved && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-sm mb-8 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-500 text-sm font-medium">{t("college_home.approved_msg")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate("/college/players")}
          className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
        >
          <Users className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-xl font-heading font-bold uppercase mb-2">{t("college_home.search_players")}</h3>
          <p className="text-muted-foreground text-sm">{t("college_home.search_players_desc")}</p>
        </div>
        <div
          onClick={() => navigate("/college/profile")}
          className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
        >
          <GraduationCap className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-xl font-heading font-bold uppercase mb-2">{t("college_home.college_profile")}</h3>
          <p className="text-muted-foreground text-sm">{t("college_home.college_profile_desc")}</p>
        </div>
        <div
          onClick={() => navigate("/college/opportunities")}
          className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
        >
          <Briefcase className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-xl font-heading font-bold uppercase mb-2">{t("college_home.opportunities")}</h3>
          <p className="text-muted-foreground text-sm">{t("college_home.opportunities_desc")}</p>
        </div>
      </div>
    </div>
  );
};

export default CollegeHome;
