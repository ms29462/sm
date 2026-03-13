import { Routes, Route } from 'react-router-dom';
import PlayerLayout from '@/components/player/PlayerLayout';
import PlayerHome from '@/components/player/PlayerHome';
import PlayerProfile from '@/components/player/PlayerProfile';
import PlayerOpportunities from '@/components/player/PlayerOpportunities';
import PlayerApplications from '@/components/player/PlayerApplications';

const PlayerDashboard = () => {
  return (
    <PlayerLayout>
      <Routes>
        <Route path="dashboard" element={<PlayerHome />} />
        <Route path="profile" element={<PlayerProfile />} />
        <Route path="opportunities" element={<PlayerOpportunities />} />
        <Route path="applications" element={<PlayerApplications />} />
        <Route path="*" element={<PlayerHome />} />
      </Routes>
    </PlayerLayout>
  );
};

export default PlayerDashboard;