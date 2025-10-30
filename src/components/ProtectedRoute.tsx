import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { FloatingChatButton } from './FloatingChatButton';
import { ChatDrawer } from './ChatDrawer';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // Vérifier aussi le localStorage directement pour éviter les problèmes de timing
  const hasToken = localStorage.getItem('access_token');

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/auth/step1" replace />;
  }

  return (
    <>
      {children}
      {/* Bouton Chat flottant en bas à droite */}
      <FloatingChatButton />
      {/* Drawer de chat */}
      <ChatDrawer />
    </>
  );
};



