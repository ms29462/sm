import { Routes, Route, Navigate } from 'react-router-dom';
import SpecialistLayout from '@/components/specialist/SpecialistLayout';
import SpecialistHome from '@/components/specialist/SpecialistHome';
import SpecialistProfile from '@/components/specialist/SpecialistProfile';
import SpecialistPlayers from '@/components/specialist/SpecialistPlayers';
import SpecialistClients from '@/components/specialist/SpecialistClients';

const SpecialistDashboard = () => {
  return (
    <SpecialistLayout>
      <Routes>
        <Route path="dashboard" element={<SpecialistHome />} />
        <Route path="profile" element={<SpecialistProfile />} />
        <Route path="players" element={<SpecialistPlayers />} />
        <Route path="clients" element={<SpecialistClients />} />
        <Route path="*" element={<Navigate to="/specialist/dashboard" replace />} />
      </Routes>
    </SpecialistLayout>
  );
};

export default SpecialistDashboard;
