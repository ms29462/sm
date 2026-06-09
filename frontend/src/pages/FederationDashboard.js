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


const FederationDashboard = () => {
  return (
    <FederationLayout>
      <Routes>
        <Route path="dashboard" element={<FederationHome />} />
        <Route path="profile" element={<FederationProfile />} />
        <Route path="players" element={<ClubPlayers />} />
        <Route path="player/:playerId" element={<PlayerDetailView />} />
        <Route path="recommended" element={<FederationRecommended />} />
        <Route path="scouting" element={<ScoutingHub />} />
        <Route path="scouting/:playerId" element={<TrackingOverview />} />
        <Route path="scouting-old" element={<FederationScouting />} />
        <Route path="teams" element={<FederationTeams />} />
        <Route path="*" element={<FederationHome />} />
        <Route path="news" element={<NewsFeed />} />
      </Routes>
    </FederationLayout>
  );
};

export default FederationDashboard;

