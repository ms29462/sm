import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ClubLayout from "@/components/club/ClubLayout";
import ClubHome from "@/components/club/ClubHome";
import ClubProfile from "@/components/club/ClubProfile";
import CollegeProfile from "@/components/college/CollegeProfile";
import ClubOpportunities from "@/components/club/ClubOpportunities";
import ClubPlayers from "@/components/club/ClubPlayers";
import ClubApplications from "@/components/club/ClubApplications";
import ClubFavorites from "@/components/club/ClubFavorites";
import PlayerDetailView from "@/components/club/PlayerDetailView";
import ChatList from "@/components/chat/ChatList";
import VideoList from "@/components/video/VideoList";

const ClubDashboard = () => {
  const { user } = useAuth();
  const isCollege = user?.role === "college";

  return (
    <ClubLayout isCollege={isCollege}>
      <Routes>
        <Route path="dashboard" element={<ClubHome />} />
        <Route path="profile" element={isCollege ? <CollegeProfile /> : <ClubProfile />} />
        <Route path="opportunities" element={<ClubOpportunities />} />
        <Route path="players" element={<ClubPlayers />} />
        <Route path="player/:playerId" element={<PlayerDetailView />} />
        <Route path="applications" element={<ClubApplications />} />
        <Route path="favorites" element={<ClubFavorites />} />
        <Route path="chats" element={<ChatList />} />
        <Route path="videos" element={<VideoList />} />
        <Route path="*" element={<ClubHome />} />
      </Routes>
    </ClubLayout>
  );
};

export default ClubDashboard;