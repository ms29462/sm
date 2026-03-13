import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PlayerDashboard from '@/pages/PlayerDashboard';
import ClubDashboard from '@/pages/ClubDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ChatRoom from '@/components/chat/ChatRoom';
import VideoCall from '@/components/video/VideoCall';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="App min-h-screen">
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
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;