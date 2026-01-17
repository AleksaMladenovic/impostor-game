import { JSX, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {  } from "firebase/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user , loggedUser } = useAuth();

  
  if (!user || !loggedUser()) {
    return <Navigate to="/login" replace />;
  }

  // Provera da li je email verifikovan direktno iz Firebase user objekta
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default ProtectedRoute;
