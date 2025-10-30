import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // Vérifier aussi le localStorage pour éviter les problèmes de timing
  const hasToken = localStorage.getItem('access_token');

  if (isAuthenticated || hasToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;



