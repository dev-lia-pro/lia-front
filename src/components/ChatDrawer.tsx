import React, { useEffect, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chatStore';
import { ConversationList } from './chat/ConversationList';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';

export const ChatDrawer: React.FC = () => {
  const { isOpen, closeChat, activeConversationId, setActiveConversation } = useChatStore();
  const [showMobileList, setShowMobileList] = useState(true);

  const isMobile = window.innerWidth < 768;

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeChat]);

  // Sur mobile, quand on sélectionne une conversation, afficher les messages
  useEffect(() => {
    if (isMobile && activeConversationId) {
      setShowMobileList(false);
    }
  }, [activeConversationId, isMobile]);

  // Retour à la liste sur mobile
  const handleBackToList = () => {
    setShowMobileList(true);
    setActiveConversation(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeChat}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[900px] lg:w-[1000px] bg-background shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            {/* Bouton retour (mobile uniquement, quand messages affichés) */}
            {isMobile && !showMobileList && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {isMobile && !showMobileList ? 'Conversation' : 'Chat Assistant'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeChat}
            className="h-8 w-8"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar gauche - Liste des conversations (desktop uniquement) */}
          <div className="hidden md:block md:w-72 lg:w-80 border-r border-border flex-shrink-0 overflow-hidden">
            <ConversationList />
          </div>

          {/* Mobile: Affichage conditionnel liste/messages */}
          {isMobile ? (
            showMobileList ? (
              <div className="flex-1 overflow-hidden">
                <ConversationList />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <ChatMessages conversationId={activeConversationId} />
                <ChatInput conversationId={activeConversationId} />
              </div>
            )
          ) : (
            /* Desktop: Zone principale - Messages et input */
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <ChatMessages conversationId={activeConversationId} />
              <ChatInput conversationId={activeConversationId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
