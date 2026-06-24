// src/components/common/ProtectedLink.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * A NavLink that blocks navigation for unauthenticated users,
 * shows a toast, then redirects to /signup after a short delay.
 */
const ProtectedLink = ({
  to,
  children,
  className = '',
  requireAuth = true,
  toastMessage = '⚠️ Please login to access this page',
  redirectTo = '/signup',
  delayMs = 800,
  onClick,
  ...rest
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (requireAuth && !user) {
      e.preventDefault();
      toast.warn(toastMessage, { position: 'top-center' });
      setTimeout(() => navigate(redirectTo), delayMs);
      return;
    }
    onClick?.(e);
  };

  return (
    <NavLink to={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </NavLink>
  );
};

export default ProtectedLink;
