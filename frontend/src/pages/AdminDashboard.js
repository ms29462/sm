import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/components/admin/AdminHome';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminClubs from '@/components/admin/AdminClubs';
import AdminFederations from '@/components/admin/AdminFederations';
import AdminColleges from '@/components/admin/AdminColleges';
import AdminVerification from '@/components/admin/AdminVerification';
import AdminAnalysts from '@/components/admin/AdminAnalysts';
import AdminNews from '@/components/admin/AdminNews';
import AdminDuplicates from '@/components/admin/AdminDuplicates';
import AdminAgents from '@/components/admin/AdminAgents';
import AdminSpecialists from '@/components/admin/AdminSpecialists';
import AdminOpportunities from '@/components/admin/AdminOpportunities';
import AdminCredits from '@/components/admin/AdminCredits';
import AdminChatManagement from '@/components/admin/AdminChatManagement';
import AdminChatViewer from '@/components/admin/AdminChatViewer';
import AdminVideoManagement from '@/components/admin/AdminVideoManagement';
import AdminChatRequests from '@/components/admin/AdminChatRequests';
import AdminBenchmark from '@/components/admin/AdminBenchmark';
import AdminMasterclass from '@/components/admin/AdminMasterclass';
import AdminClubApplications from '@/components/admin/AdminClubApplications';
import AdminAnalystManagement from '@/components/admin/AdminAnalystManagement';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';
import AdminReports from '@/components/admin/AdminReports';
import AdminDeletionRequests from '@/components/admin/AdminDeletionRequests';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="clubs" element={<AdminClubs />} />
        <Route path="club-applications" element={<AdminClubApplications />} />
        <Route path="analyst-management" element={<AdminAnalystManagement />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="deletion-requests" element={<AdminDeletionRequests />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="credits" element={<AdminCredits />} />
        <Route path="federations" element={<AdminFederations />} />
        <Route path="agents" element={<AdminAgents />} />
                <Route path="colleges" element={<AdminColleges />} />
                <Route path="verification" element={<AdminVerification />} />
                <Route path="analysts" element={<AdminAnalysts />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="duplicates" element={<AdminDuplicates />} />
                <Route path="duplicates" element={<AdminDuplicates />} />
        <Route path="specialists" element={<AdminSpecialists />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="credits" element={<AdminCredits />} />
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