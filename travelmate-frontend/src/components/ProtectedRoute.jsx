// File: src/components/ProtectedRoute.jsx
import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const warned = useRef(false); // prevent repeated toasts

  useEffect(() => {
    if (!user && !warned.current) {
      toast.warn("⚠️ Please login to access this page");
      warned.current = true;
    }
  }, [user]);

  return user ? children : <Navigate to="/signup" />;
};

export default ProtectedRoute;
