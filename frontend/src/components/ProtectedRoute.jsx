import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ role, children }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />; // Not logged in
  if (user.role !== role) return <Navigate to="/login" />; // Wrong role

  return children;
};

export default ProtectedRoute;
