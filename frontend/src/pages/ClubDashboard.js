import { Routes, Route } from "react-router-dom";
import NewsFeed from '@/components/shared/NewsFeed';
import { useAuth } from "@/context/AuthContext";
import ClubLayout from "@/components/club/ClubLayout";
import ClubHome from "@/components/club/ClubHome";
import ClubProfile from "@/components/club/ClubProfile";
import CollegeProfile from "@/components/college/CollegeProfile";
import ClubOpportunities from "@/components/club/ClubOpportunities";
import ClubOpportunityAnalytics from "@/components/club/ClubOpportunityAnalytics";
import ClubPlayers from "@/components/club/ClubPlayers";
import ClubApplications from "@/components/club/ClubApplications";
import ClubFavorites from "@/components/club/ClubFavorites";
import PlayerDetailView from "@/components/club/PlayerDetailView";
import UnifiedChats from "@/components/chat/UnifiedChats";
import VideoList from "@/components/video/VideoList";
import ScoutingHub from "@/components/club/ScoutingHub";
import RecruitmentPipeline from "@/components/club/RecruitmentPipeline";
import TrackingOverview from "@/components/club/TrackingOverview";
import ClubSubscribe from "@/components/club/ClubSubscribe";
import ClubSubscriptionGate from "@/components/club/ClubSubscriptionGate";
import CollegeSubscribe from "@/components/college/CollegeSubscribe";
import CollegeSubscriptionGate from "@/components/college/CollegeSubscriptionGate";

const ClubDashboard = () => {
  const { user } = useAuth();
  const isCollege = user?.role === "college";
  const isAnalyst = user?.role === "analyst";

  const isClub = user?.role === "club";
  const isCollegeRole = user?.role === "college";
  const Gate = ({ children }) => {
    if (isClub) return <ClubSubscriptionGate>{children}</ClubSubscriptionGate>;
    if (isCollegeRole) return <CollegeSubscriptionGate>{children}</CollegeSubscriptionGate>;
    return children;
  };

  return (
    <ClubLayout isCollege={isCollege}>
      <Routes>
        <Route path="dashboard" element={<ClubHome />} />
        <Route path="profile" element={isCollege ? <CollegeProfile /> : <ClubProfile />} />
        <Route path="subscribe" element={isCollege ? <CollegeSubscribe /> : <ClubSubscribe />} />
        <Route path="opportunities" element={<Gate><ClubOpportunities /></Gate>} />
        <Route path="opportunities/analytics" element={<Gate><ClubOpportunityAnalytics /></Gate>} />
        <Route path="players" element={<Gate><ClubPlayers /></Gate>} />
        <Route path="player/:playerId" element={<Gate><PlayerDetailView /></Gate>} />
        <Route path="applications" element={<Gate><ClubApplications /></Gate>} />
        <Route path="favorites" element={<Gate><ClubFavorites /></Gate>} />
        <Route path="chats" element={<Gate><UnifiedChats /></Gate>} />
        <Route path="videos" element={<VideoList />} />
        <Route path="scouting" element={<Gate><ScoutingHub /></Gate>} />
        <Route path="pipeline" element={<Gate><RecruitmentPipeline /></Gate>} />
        <Route path="scouting/:playerId" element={<Gate><TrackingOverview /></Gate>} />
        <Route path="*" element={<ClubHome />
        } />
        <Route path="news" element={<NewsFeed />} />
      </Routes>
    </ClubLayout>
  );
};

export default ClubDashboard;