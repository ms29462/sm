import { Routes, Route, Navigate } from 'react-router-dom';
import NewsFeed from '@/components/shared/NewsFeed';
import SpecialistLayout from '@/components/specialist/SpecialistLayout';
import SpecialistHome from '@/components/specialist/SpecialistHome';
import SpecialistProfile from '@/components/specialist/SpecialistProfile';
import SpecialistPlayers from '@/components/specialist/SpecialistPlayers';
import SpecialistPlayerDetail from '@/components/specialist/SpecialistPlayerDetail';
import SpecialistClients from '@/components/specialist/SpecialistClients';

const SpecialistDashboard = () => {
  return (
    <SpecialistLayout>
      <Routes>
        <Route path="dashboard" element={<SpecialistHome />} />
        <Route path="profile" element={<SpecialistProfile />} />
        <Route path="players" element={<SpecialistPlayers />} />
        <Route path="player/:playerId" element={<SpecialistPlayerDetail />} />
        <Route path="clients" element={<SpecialistClients />} />
        <Route path="*" element={<Navigate to="/specialist/dashboard" replace />} />
        <Route path="news" element={<NewsFeed />} />
      </Routes>
    </SpecialistLayout>
  );
};

export default SpecialistDashboard;
