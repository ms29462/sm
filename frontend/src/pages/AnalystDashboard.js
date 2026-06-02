import { Routes, Route, Navigate } from 'react-router-dom';
import AnalystLayout from '@/components/analyst/AnalystLayout';
import AnalystHome from '@/components/analyst/AnalystHome';
import AnalystProfile from '@/components/analyst/AnalystProfile';
import AnalystPlayers from '@/components/analyst/AnalystPlayers';
import AnalystPlayerDetail from '@/components/analyst/AnalystPlayerDetail';
import NewsFeed from '@/components/shared/NewsFeed';
import ScoutingHub from '@/components/club/ScoutingHub';
import RecruitmentPipeline from '@/components/club/RecruitmentPipeline';
import TrialInvitations from '@/pages/TrialInvitations';

const AnalystDashboard = () => {
  return (
    <AnalystLayout>
      <Routes>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<AnalystHome />} />
        <Route path="profile" element={<AnalystProfile />} />
        <Route path="players" element={<AnalystPlayers />} />
        <Route path="player/:playerId" element={<AnalystPlayerDetail />} />
        <Route path="scouting" element={<ScoutingHub />} />
        <Route path="pipeline" element={<RecruitmentPipeline />} />
        <Route path="trials" element={<TrialInvitations />} />
        <Route path="news" element={<NewsFeed />} />
      </Routes>
    </AnalystLayout>
  );
};

export default AnalystDashboard;
