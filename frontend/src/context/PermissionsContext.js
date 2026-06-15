import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

const PermissionsContext = createContext({});

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getMyPermissions()
        .then(res => {
          setPermissions(res.data.permissions || {});
          setStatus(res.data.status);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setPermissions({});
      setStatus(null);
      setLoading(false);
    }
  }, [user]);

  const can = (permission) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (permissions.all) return true;
    return permissions[permission] === true;
  };

  const isPremium = () => status === "premium";
  const isApproved = () => ["approved", "active", "premium"].includes(status);
  const isPending = () => ["pending", "invited"].includes(status);

  return (
    <PermissionsContext.Provider value={{ permissions, status, loading, can, isPremium, isApproved, isPending }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);