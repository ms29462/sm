import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PlayerDashboard from '@/pages/PlayerDashboard';
import ClubDashboard from '@/pages/ClubDashboard';
import FederationDashboard from '@/pages/FederationDashboard';
import AgentDashboard from '@/pages/AgentDashboard';
import SpecialistDashboard from '@/pages/SpecialistDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ChatRoom from '@/components/chat/ChatRoom';
import VideoCall from '@/components/video/VideoCall';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PWAProvider } from '@/context/PWAContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PWAInstallBanner, { OfflineBanner } from '@/components/mobile/PWAInstallBanner';
import FloatingChatbot from '@/components/shared/FloatingChatbot';

// Wrapper component to conditionally render chatbot
const ChatbotWrapper = () => {
  const { user } = useAuth();
  // Only show chatbot for logged-in users
  if (!user) return null;
  return <FloatingChatbot />;
};

function App() {
  return (
    <PWAProvider>
      <AuthProvider>
        <NotificationProvider>
          <div className="App min-h-screen">
            <OfflineBanner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<Login admin={true} />} />
                <Route
                  path="/player/*"
                  element={
                    <ProtectedRoute role="player">
                      <PlayerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/club/*"
                  element={
                    <ProtectedRoute role="club">
                      <ClubDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/federation/*"
                  element={
                    <ProtectedRoute role="federation">
                      <FederationDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/agent/*"
                  element={
                    <ProtectedRoute role="agent">
                      <AgentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/*"
                  element={
                    <ProtectedRoute role="specialist">
                      <SpecialistDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:roomId"
                  element={
                    <ProtectedRoute>
                      <ChatRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video/:sessionId"
                  element={
                    <ProtectedRoute>
                      <VideoCall />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              <PWAInstallBanner />
              <ChatbotWrapper />
            </BrowserRouter>
            <Toaster position="top-right" richColors />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </PWAProvider>
  );
}

export default App;