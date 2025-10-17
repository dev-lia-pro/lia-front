import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chatStore';

interface FloatingChatButtonProps {
  className?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ className = '' }) => {
  const { toggleChat } = useChatStore();

  // Détection mobile pour adapter le positionnement
  const isMobileDevice = window.innerWidth < 768;

  // Positionnement en bas à droite (là où était le micro)
  const positionClass = isMobileDevice
    ? "fixed bottom-24 right-4 z-30"
    : "fixed bottom-20 right-6 z-30";

  // Taille adaptée
  const sizeClass = isMobileDevice
    ? "w-12 h-12"
    : "w-14 h-14";

  return (
    <div className={positionClass}>
      <Button
        className={`${className} ${sizeClass} relative rounded-full p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200`}
        onClick={toggleChat}
        title="Ouvrir le chat assistant"
      >
        <MessageCircle className={`${isMobileDevice ? 'w-5 h-5' : 'w-6 h-6'}`} />
      </Button>
    </div>
  );
};
