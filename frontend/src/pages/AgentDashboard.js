import { Routes, Route, Navigate } from 'react-router-dom';
import AgentLayout from '@/components/agent/AgentLayout';
import AgentHome from '@/components/agent/AgentHome';
import AgentProfile from '@/components/agent/AgentProfile';
import AgentPlayers from '@/components/agent/AgentPlayers';
import AgentPlayerDetail from '@/components/agent/AgentPlayerDetail';
import AgentWatchlist from '@/components/agent/AgentWatchlist';
import AgentOpportunities from '@/components/agent/AgentOpportunities';

const AgentDashboard = () => {
  return (
    <AgentLayout>
      <Routes>
        <Route path="dashboard" element={<AgentHome />} />
        <Route path="profile" element={<AgentProfile />} />
        <Route path="players" element={<AgentPlayers />} />
        <Route path="player/:playerId" element={<AgentPlayerDetail />} />
        <Route path="watchlist" element={<AgentWatchlist />} />
        <Route path="opportunities" element={<AgentOpportunities />} />
        <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
      </Routes>
    </AgentLayout>
  );
};

export default AgentDashboard;
