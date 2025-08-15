import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import React from "react";
import ProtectedRoute from "./ProtectedRoute";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { role } = useAuth();

  // The ProtectedRoute will handle the loading and user-not-logged-in cases.
  // We just need to add the role check here.
  // Note: The `loading` state is handled by ProtectedRoute, so by the time this
  // check runs, the role should be loaded if the user is logged in.

  if (role && role !== 'admin') {
    // If the user is logged in but is not an admin, redirect to home.
    return <Navigate to="/" replace />;
  }

  // If the user is an admin, render the children.
  // If still loading or not logged in, ProtectedRoute will handle it.
  return <>{children}</>;
};

// We wrap the AdminRoute's children with ProtectedRoute to ensure that
// the user is logged in before we even check their role.
const ProtectedAdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <ProtectedRoute>
      <AdminRoute>{children}</AdminRoute>
    </ProtectedRoute>
  );
};

export default ProtectedAdminRoute;
