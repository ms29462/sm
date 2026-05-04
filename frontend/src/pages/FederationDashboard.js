import { Routes, Route } from 'react-router-dom';
import FederationLayout from '@/components/federation/FederationLayout';
import FederationHome from '@/components/federation/FederationHome';
import FederationProfile from '@/components/federation/FederationProfile';
import FederationPlayers from '@/components/federation/FederationPlayers';
import FederationRecommended from '@/components/federation/FederationRecommended';
import FederationScouting from '@/components/federation/FederationScouting';
import FederationTeams from '@/components/federation/FederationTeams';
import FederationPlayerDetailView from '@/components/federation/FederationPlayerDetailView';


const FederationDashboard = () => {
  return (
    <FederationLayout>
      <Routes>
        <Route path="dashboard" element={<FederationHome />} />
        <Route path="profile" element={<FederationProfile />} />
        <Route path="players" element={<FederationPlayers />} />
        <Route path="player/:playerId" element={<FederationPlayerDetailView />} />
        <Route path="recommended" element={<FederationRecommended />} />
        <Route path="scouting" element={<FederationScouting />} />
        <Route path="teams" element={<FederationTeams />} />
        <Route path="*" element={<FederationHome />} />
      </Routes>
    </FederationLayout>
  );
};

export default FederationDashboard;

