import { Routes, Route } from 'react-router-dom';
import TrialInvitations from '@/pages/TrialInvitations';
import OpportunityDetail from '@/pages/OpportunityDetail';
import PlayerLayout from '@/components/player/PlayerLayout';
import PlayerHome from '@/components/player/PlayerHome';
import PlayerProfile from '@/components/player/PlayerProfile';
import PlayerOpportunities from '@/components/player/PlayerOpportunities';
import PlayerApplications from '@/components/player/PlayerApplications';
import ChatList from '@/components/chat/ChatList';
import VideoList from '@/components/video/VideoList';
import ChatRequests from '@/components/player/ChatRequests';
import MatchScores from '@/components/player/MatchScores';
import KatoPage from '@/components/player/KatoPage';
import MasterclassHome from '@/components/masterclass/MasterclassHome';
import MasterclassDetail from '@/components/masterclass/MasterclassDetail';
import MasterclassCategory from '@/components/masterclass/MasterclassCategory';
import MasterclassBookmarks from '@/components/masterclass/MasterclassBookmarks';

const PlayerDashboard = () => {
  return (
    <PlayerLayout>
      <Routes>
        <Route path="dashboard" element={<PlayerHome />} />
        <Route path="profile" element={<PlayerProfile />} />
        <Route path="opportunities" element={<PlayerOpportunities />} />
        <Route path="kato" element={<KatoPage />} />
        <Route path="match-scores" element={<MatchScores />} />
        <Route path="masterclass" element={<MasterclassHome />} />
        <Route path="masterclass/bookmarks" element={<MasterclassBookmarks />} />
        <Route path="masterclass/category/:category" element={<MasterclassCategory />} />
        <Route path="masterclass/:masterclassId" element={<MasterclassDetail />} />
        <Route path="applications" element={<PlayerApplications />} />
        <Route path="chat-requests" element={<ChatRequests />} />
        <Route path="chats" element={<ChatList />} />
        <Route path="videos" element={<VideoList />} />
        <Route path="opportunity/:opportunityId" element={<OpportunityDetail />} />
        <Route path="trials" element={<TrialInvitations />} />
        <Route path="*" element={<PlayerHome />} />
      </Routes>
    </PlayerLayout>
  );
};

export default PlayerDashboard;
