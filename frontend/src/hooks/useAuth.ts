import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const useAuth = (requireAuth = true) => {
  const { user, token, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated && !token) {
      navigate('/login');
    }
  }, [isLoading, requireAuth, isAuthenticated, token, navigate]);

  return { user, isAuthenticated, isLoading };
};
