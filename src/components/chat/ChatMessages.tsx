import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation } from '@/hooks';
import { useChatStore } from '@/stores/chatStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ConversationMessage } from '@/hooks/useConversations';

interface ChatMessagesProps {
  conversationId: number | null;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ conversationId }) => {
  const { conversation, isLoading } = useConversation(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-foreground/70">
        <div className="text-center">
          <div className="text-lg mb-2">👋 Bienvenue !</div>
          <div className="text-sm">
            Sélectionnez une conversation ou créez-en une nouvelle pour commencer.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-foreground/70">Chargement des messages...</div>
      </div>
    );
  }

  const messages = conversation?.messages || [];

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-foreground/70 text-sm">
          Aucun message. Commencez la conversation !
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message: ConversationMessage) => {
            const isUser = message.message_type === 'user_request';

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg p-3 shadow-sm
                    ${isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-card text-foreground border border-border'
                    }
                  `}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`
                      text-xs mt-1
                      ${isUser ? 'text-blue-100' : 'text-foreground/50'}
                    `}
                  >
                    {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
};
