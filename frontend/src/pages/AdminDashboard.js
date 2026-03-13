import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/components/admin/AdminHome';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminClubs from '@/components/admin/AdminClubs';
import AdminOpportunities from '@/components/admin/AdminOpportunities';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="clubs" element={<AdminClubs />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;