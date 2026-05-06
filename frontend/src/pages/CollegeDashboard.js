import { Routes, Route, Navigate } from "react-router-dom";
import CollegeLayout from "@/components/college/CollegeLayout";
import CollegeHome from "@/components/college/CollegeHome";
import CollegeProfile from "@/components/college/CollegeProfile";
import CollegePlayers from "@/components/college/CollegePlayers";

const CollegeDashboard = () => {
  return (
    <CollegeLayout>
      <Routes>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<CollegeHome />} />
        <Route path="profile" element={<CollegeProfile />} />
        <Route path="players" element={<CollegePlayers />} />
      </Routes>
    </CollegeLayout>
  );
};

export default CollegeDashboard;
