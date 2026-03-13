import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/components/admin/AdminHome';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminClubs from '@/components/admin/AdminClubs';
import AdminOpportunities from '@/components/admin/AdminOpportunities';
import AdminChatManagement from '@/components/admin/AdminChatManagement';
import AdminChatViewer from '@/components/admin/AdminChatViewer';
import AdminVideoManagement from '@/components/admin/AdminVideoManagement';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="clubs" element={<AdminClubs />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="chats" element={<AdminChatManagement />} />
        <Route path="chat/:roomId" element={<AdminChatViewer />} />
        <Route path="videos" element={<AdminVideoManagement />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;