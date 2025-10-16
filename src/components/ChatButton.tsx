import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chatStore';

interface ChatButtonProps {
  className?: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ className = '' }) => {
  const { toggleChat } = useChatStore();

  // Détection mobile pour adapter le positionnement
  const isMobileDevice = window.innerWidth < 768;

  // Positionnement adapté pour mobile (à gauche du bouton audio)
  // Mobile: micro à right-4 (16px), chat à right-4 + w-12 (48px) + gap (8px) = 72px
  const positionClass = isMobileDevice
    ? "fixed bottom-24 right-[4.5rem] z-30"
    : "fixed bottom-20 right-24 z-30";

  // Taille adaptée pour mobile (même que le micro)
  const sizeClass = isMobileDevice
    ? "w-12 h-12"
    : "w-14 h-14";

  return (
    <div className={positionClass}>
      <Button
        className={`${className} ${sizeClass} relative rounded-full p-0 bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200`}
        onClick={toggleChat}
        title="Ouvrir le chat"
      >
        <MessageCircle className={`${isMobileDevice ? 'w-5 h-5' : 'w-6 h-6'}`} />
      </Button>
    </div>
  );
};
