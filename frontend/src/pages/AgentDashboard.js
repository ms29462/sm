import { Routes, Route, Navigate } from 'react-router-dom';
import NewsFeed from '@/components/shared/NewsFeed';
import AgentLayout from '@/components/agent/AgentLayout';
import AgentHome from '@/components/agent/AgentHome';
import AgentProfile from '@/components/agent/AgentProfile';
import AgentPlayers from '@/components/agent/AgentPlayers';
import AgentPlayerDetail from '@/components/agent/AgentPlayerDetail';
import AgentWatchlist from '@/components/agent/AgentWatchlist';
import AgentOpportunities from '@/components/agent/AgentOpportunities';
import AgentSubscribe from '@/components/agent/AgentSubscribe';
import AgentSubscriptionGate from '@/components/agent/AgentSubscriptionGate';

const AgentDashboard = () => {
  return (
    <AgentLayout>
      <Routes>
        <Route path="dashboard" element={<AgentHome />} />
        <Route path="profile" element={<AgentProfile />} />
        <Route path="subscribe" element={<AgentSubscribe />} />
        <Route path="players" element={<AgentSubscriptionGate><AgentPlayers /></AgentSubscriptionGate>} />
        <Route path="player/:playerId" element={<AgentSubscriptionGate><AgentPlayerDetail /></AgentSubscriptionGate>} />
        <Route path="watchlist" element={<AgentSubscriptionGate><AgentWatchlist /></AgentSubscriptionGate>} />
        <Route path="opportunities" element={<AgentSubscriptionGate><AgentOpportunities /></AgentSubscriptionGate>} />
        <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="news" element={<NewsFeed />} />
      </Routes>
    </AgentLayout>
  );
};

export default AgentDashboard;
