import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { VoiceInput } from './VoiceInput';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  const handleVoiceResult = (text: string) => {
    console.log('Résultat vocal:', text);
    // Ici vous pouvez traiter le résultat vocal
  };

  if (!isAuthenticated) {
    return <Navigate to="/auth/step1" replace />;
  }

  return (
    <>
      {children}
      {/* Assistant vocal visible sur toutes les pages protégées */}
      <VoiceInput onResult={handleVoiceResult} />
    </>
  );
};



