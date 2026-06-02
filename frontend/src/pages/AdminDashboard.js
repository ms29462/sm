import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/components/admin/AdminHome';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminClubs from '@/components/admin/AdminClubs';
import AdminFederations from '@/components/admin/AdminFederations';
import AdminColleges from '@/components/admin/AdminColleges';
import AdminVerification from '@/components/admin/AdminVerification';
import AdminNews from '@/components/admin/AdminNews';
import AdminAgents from '@/components/admin/AdminAgents';
import AdminSpecialists from '@/components/admin/AdminSpecialists';
import AdminOpportunities from '@/components/admin/AdminOpportunities';
import AdminChatManagement from '@/components/admin/AdminChatManagement';
import AdminChatViewer from '@/components/admin/AdminChatViewer';
import AdminVideoManagement from '@/components/admin/AdminVideoManagement';
import AdminChatRequests from '@/components/admin/AdminChatRequests';
import AdminBenchmark from '@/components/admin/AdminBenchmark';
import AdminMasterclass from '@/components/admin/AdminMasterclass';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="clubs" element={<AdminClubs />} />
        <Route path="federations" element={<AdminFederations />} />
        <Route path="agents" element={<AdminAgents />} />
                <Route path="colleges" element={<AdminColleges />} />
                <Route path="verification" element={<AdminVerification />} />
                <Route path="news" element={<AdminNews />} />
        <Route path="specialists" element={<AdminSpecialists />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="masterclass" element={<AdminMasterclass />} />
        <Route path="chat-requests" element={<AdminChatRequests />} />
        <Route path="chats" element={<AdminChatManagement />} />
        <Route path="chat/:roomId" element={<AdminChatViewer />} />
        <Route path="videos" element={<AdminVideoManagement />} />
        <Route path="benchmark" element={<AdminBenchmark />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;