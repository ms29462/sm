import { Routes, Route } from 'react-router-dom';
import NewsFeed from '@/components/shared/NewsFeed';
import AcademyLayout from '@/components/academy/AcademyLayout';
import AcademyHome from '@/components/academy/AcademyHome';
import AcademyProfile from '@/components/academy/AcademyProfile';
import AcademyPlayers from '@/components/academy/AcademyPlayers';
import AcademyApplications from '@/components/academy/AcademyApplications';
import AcademyOpportunities from '@/components/academy/AcademyOpportunities';
import PlayerDetailView from '@/components/club/PlayerDetailView';
import UnifiedChats from '@/components/chat/UnifiedChats';
import ChatRoom from '@/components/chat/ChatRoom';
import ScoutingHub from '@/components/club/ScoutingHub';

const AcademyDashboard = () => {
  return (
    <AcademyLayout>
      <Routes>
        <Route path="dashboard" element={<AcademyHome />} />
        <Route path="news" element={<NewsFeed />} />
        <Route path="profile" element={<AcademyProfile />} />
        <Route path="players" element={<AcademyPlayers />} />
        <Route path="player/:playerId" element={<PlayerDetailView />} />
        <Route path="opportunities" element={<AcademyOpportunities />} />
        <Route path="applications" element={<AcademyApplications />} />
        <Route path="chats" element={<UnifiedChats />} />
        <Route path="chat/:roomId" element={<ChatRoom />} />
        <Route path="scouting" element={<ScoutingHub />} />
        <Route path="*" element={<AcademyHome />} />
      </Routes>
    </AcademyLayout>
  );
};

export default AcademyDashboard;
