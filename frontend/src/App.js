import '@/App.css';
import ErrorBoundary from '@/components/ErrorBoundary';
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
import CollegeDashboard from '@/pages/CollegeDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import CGU from '@/pages/CGU';
import MentionsLegales from '@/pages/MentionsLegales';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import ChatRoom from '@/components/chat/ChatRoom';
import VideoCall from '@/components/video/VideoCall';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PWAProvider } from '@/context/PWAContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PWAInstallBanner, { OfflineBanner } from '@/components/mobile/PWAInstallBanner';

function App() {
  return (
    <ErrorBoundary>
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
                    <ProtectedRoute roles={["club", "college"]}>
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
                  path="/college/*"
                  element={
                    <ProtectedRoute role="college">
                      <ClubDashboard />
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
                <Route path="/cgu" element={<CGU />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              <PWAInstallBanner />
            </BrowserRouter>
            <Toaster position="top-right" richColors />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </PWAProvider>
    </ErrorBoundary>
  );
}

export default App;