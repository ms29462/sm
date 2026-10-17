import { Routes, Route } from "react-router-dom";
import NewsFeed from '@/components/shared/NewsFeed';
import CollegeAgencyLayout from "@/components/college_agency/CollegeAgencyLayout";
import CollegeAgencyProfile from "@/components/college_agency/CollegeAgencyProfile";
import CollegeAgencyOpportunities from "@/components/college_agency/CollegeAgencyOpportunities";
import CollegeAgencySubscribe from "@/components/college_agency/CollegeAgencySubscribe";
import CollegeAgencySubscriptionGate from "@/components/college_agency/CollegeAgencySubscriptionGate";
import ClubHome from "@/components/club/ClubHome";
import ClubPlayers from "@/components/club/ClubPlayers";
import ClubApplications from "@/components/club/ClubApplications";
import ClubFavorites from "@/components/club/ClubFavorites";
import PlayerDetailView from "@/components/club/PlayerDetailView";
import UnifiedChats from "@/components/chat/UnifiedChats";
import ScoutingHub from "@/components/club/ScoutingHub";
import RecruitmentPipeline from "@/components/club/RecruitmentPipeline";
import TrackingOverview from "@/components/club/TrackingOverview";
import ClubOpportunityAnalytics from "@/components/club/ClubOpportunityAnalytics";

const CollegeAgencyDashboard = () => (
  <CollegeAgencyLayout>
    <Routes>
      <Route path="dashboard" element={<ClubHome />} />
      <Route path="profile" element={<CollegeAgencyProfile />} />
      <Route path="subscribe" element={<CollegeAgencySubscribe />} />
      <Route path="news" element={<NewsFeed />} />
      <Route path="opportunities" element={<CollegeAgencySubscriptionGate><CollegeAgencyOpportunities /></CollegeAgencySubscriptionGate>} />
      <Route path="opportunities/analytics" element={<CollegeAgencySubscriptionGate><ClubOpportunityAnalytics /></CollegeAgencySubscriptionGate>} />
      <Route path="players" element={<CollegeAgencySubscriptionGate><ClubPlayers /></CollegeAgencySubscriptionGate>} />
      <Route path="player/:playerId" element={<CollegeAgencySubscriptionGate><PlayerDetailView /></CollegeAgencySubscriptionGate>} />
      <Route path="applications" element={<CollegeAgencySubscriptionGate><ClubApplications /></CollegeAgencySubscriptionGate>} />
      <Route path="favorites" element={<CollegeAgencySubscriptionGate><ClubFavorites /></CollegeAgencySubscriptionGate>} />
      <Route path="chats" element={<CollegeAgencySubscriptionGate><UnifiedChats /></CollegeAgencySubscriptionGate>} />
      <Route path="scouting" element={<CollegeAgencySubscriptionGate><ScoutingHub /></CollegeAgencySubscriptionGate>} />
      <Route path="pipeline" element={<CollegeAgencySubscriptionGate><RecruitmentPipeline /></CollegeAgencySubscriptionGate>} />
      <Route path="scouting/:playerId" element={<CollegeAgencySubscriptionGate><TrackingOverview /></CollegeAgencySubscriptionGate>} />
      <Route path="*" element={<ClubHome />} />
    </Routes>
  </CollegeAgencyLayout>
);

export default CollegeAgencyDashboard;
