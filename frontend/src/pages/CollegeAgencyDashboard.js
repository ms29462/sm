import { Routes, Route } from "react-router-dom";
import NewsFeed from '@/components/shared/NewsFeed';
import CollegeAgencyLayout from "@/components/college_agency/CollegeAgencyLayout";
import CollegeAgencyProfile from "@/components/college_agency/CollegeAgencyProfile";
import CollegeAgencyOpportunities from "@/components/college_agency/CollegeAgencyOpportunities";
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
      <Route path="opportunities" element={<CollegeAgencyOpportunities />} />
      <Route path="opportunities/analytics" element={<ClubOpportunityAnalytics />} />
      <Route path="players" element={<ClubPlayers />} />
      <Route path="player/:playerId" element={<PlayerDetailView />} />
      <Route path="applications" element={<ClubApplications />} />
      <Route path="favorites" element={<ClubFavorites />} />
      <Route path="chats" element={<UnifiedChats />} />
      <Route path="scouting" element={<ScoutingHub />} />
      <Route path="pipeline" element={<RecruitmentPipeline />} />
      <Route path="scouting/:playerId" element={<TrackingOverview />} />
      <Route path="news" element={<NewsFeed />} />
      <Route path="*" element={<ClubHome />} />
    </Routes>
  </CollegeAgencyLayout>
);

export default CollegeAgencyDashboard;
