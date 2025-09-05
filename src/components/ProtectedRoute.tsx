import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { VoiceInput } from './VoiceInput';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  // Détection desktop basée sur la largeur d'écran (sur mobile le micro est dans la top bar)
  const isDesktop = window.innerWidth >= 768; // Breakpoint sm de Tailwind

  const handleVoiceResult = (text: string) => {
    console.log('Résultat vocal:', text);
    // Traitement du résultat vocal
  };

  if (!isAuthenticated) {
    return <Navigate to="/auth/step1" replace />;
  }

  return (
    <>
      {children}
      {/* Assistant vocal flottant uniquement sur desktop */}
      {/* Sur mobile, il est intégré dans le DashboardHeader */}
      {isDesktop && <VoiceInput onResult={handleVoiceResult} />}
    </>
  );
};



