import { Routes, Route } from 'react-router-dom';
import NewsFeed from '@/components/shared/NewsFeed';
import FederationLayout from '@/components/federation/FederationLayout';
import FederationHome from '@/components/federation/FederationHome';
import FederationProfile from '@/components/federation/FederationProfile';
import ClubPlayers from '@/components/club/ClubPlayers';
import FederationRecommended from '@/components/federation/FederationRecommended';
import FederationScouting from '@/components/federation/FederationScouting';
import ScoutingHub from '@/components/club/ScoutingHub';
import TrackingOverview from '@/components/club/TrackingOverview';
import FederationTeams from '@/components/federation/FederationTeams';
import PlayerDetailView from '@/components/club/PlayerDetailView';
import ClubFavorites from '@/components/club/ClubFavorites';
import ClubOpportunities from '@/components/club/ClubOpportunities';
import ClubApplications from '@/components/club/ClubApplications';
import RecruitmentPipeline from '@/components/club/RecruitmentPipeline';
import UnifiedChats from '@/components/chat/UnifiedChats';
import ChatRoom from '@/components/chat/ChatRoom';
import FederationAccessGate from '@/components/federation/FederationAccessGate';


const FederationDashboard = () => {
  return (
    <FederationLayout>
      <Routes>
        <Route path="dashboard" element={<FederationHome />} />
        <Route path="profile" element={<FederationProfile />} />
        <Route path="players" element={<FederationAccessGate><ClubPlayers /></FederationAccessGate>} />
        <Route path="player/:playerId" element={<FederationAccessGate><PlayerDetailView /></FederationAccessGate>} />
        <Route path="recommended" element={<FederationAccessGate><FederationRecommended /></FederationAccessGate>} />
        <Route path="scouting" element={<FederationAccessGate><ScoutingHub /></FederationAccessGate>} />
        <Route path="scouting/:playerId" element={<FederationAccessGate><TrackingOverview /></FederationAccessGate>} />
        <Route path="scouting-old" element={<FederationAccessGate><FederationScouting /></FederationAccessGate>} />
        <Route path="teams" element={<FederationAccessGate><FederationTeams /></FederationAccessGate>} />
        <Route path="*" element={<FederationHome />} />
        <Route path="news" element={<NewsFeed />} />
        <Route path="favorites" element={<FederationAccessGate><ClubFavorites /></FederationAccessGate>} />
        <Route path="opportunities" element={<FederationAccessGate><ClubOpportunities /></FederationAccessGate>} />
        <Route path="applications" element={<FederationAccessGate><ClubApplications /></FederationAccessGate>} />
        <Route path="pipeline" element={<FederationAccessGate><RecruitmentPipeline /></FederationAccessGate>} />
        <Route path="chats" element={<FederationAccessGate><UnifiedChats /></FederationAccessGate>} />
        <Route path="chat/:roomId" element={<FederationAccessGate><ChatRoom /></FederationAccessGate>} />
      </Routes>
    </FederationLayout>
  );
};

export default FederationDashboard;

