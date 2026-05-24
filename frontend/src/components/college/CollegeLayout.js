import { useState } from 'react';
﻿import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Trophy, Users, Home, UserCircle, LogOut, GraduationCap } from "lucide-react";

const CollegeLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <>
    <div className="min-h-screen flex flex-col md:flex-row">
      <MobileHeader title="SOCCERMATCH" />
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
              <p className="text-xs text-muted-foreground uppercase flex items-center">
                <GraduationCap className="w-3 h-3 mr-1" />
                College Portal
              </p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/college/dashboard">
            <Button variant={isActive("/college/dashboard") ? "secondary" : "ghost"} className="w-full justify-start">
              <Home className="w-4 h-4 mr-3" />Dashboard
            </Button>
          </Link>
          <Link to="/college/profile">
            <Button variant={isActive("/college/profile") ? "secondary" : "ghost"} className="w-full justify-start">
              <UserCircle className="w-4 h-4 mr-3" />My Profile
            </Button>
          </Link>
          <Link to="/college/players">
            <Button variant={isActive("/college/players") ? "secondary" : "ghost"} className="w-full justify-start">
              <Users className="w-4 h-4 mr-3" />Search Players
            </Button>
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={confirmLogout}>
            <LogOut className="w-4 h-4 mr-3" />Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">{children}</main>
      <MobileBottomNav role="college" />
    </div>
  );
};

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        confirmVariant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
};

export default CollegeLayout;
