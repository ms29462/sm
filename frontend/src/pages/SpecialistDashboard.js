import { Routes, Route, Navigate } from 'react-router-dom';
import NewsFeed from '@/components/shared/NewsFeed';
import UnifiedChats from '@/components/chat/UnifiedChats';
import SpecialistLayout from '@/components/specialist/SpecialistLayout';
import SpecialistHome from '@/components/specialist/SpecialistHome';
import SpecialistProfile from '@/components/specialist/SpecialistProfile';
import SpecialistClients from '@/components/specialist/SpecialistClients';
import SpecialistSubscribe from '@/components/specialist/SpecialistSubscribe';
import SpecialistSubscriptionGate from '@/components/specialist/SpecialistSubscriptionGate';

const SpecialistDashboard = () => {
  return (
    <SpecialistLayout>
      <Routes>
        <Route path="dashboard" element={<SpecialistHome />} />
        <Route path="profile" element={<SpecialistProfile />} />
        <Route path="subscribe" element={<SpecialistSubscribe />} />
        <Route path="clients" element={<SpecialistSubscriptionGate><SpecialistClients /></SpecialistSubscriptionGate>} />
        <Route path="*" element={<Navigate to="/specialist/dashboard" replace />} />
        <Route path="news" element={<NewsFeed />} />
        <Route path="chats" element={<SpecialistSubscriptionGate><UnifiedChats /></SpecialistSubscriptionGate>} />
      </Routes>
    </SpecialistLayout>
  );
};

export default SpecialistDashboard;
