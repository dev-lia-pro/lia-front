import React, { useEffect, useRef, useState } from 'react';
import { Mic, Play, Pause } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks';
import { useChatStore } from '@/stores/chatStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatLoadingAnimation } from './ChatLoadingAnimation';
import type { ConversationMessage } from '@/hooks/useConversations';

interface ChatMessagesProps {
  conversationId: number | null;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ conversationId }) => {
  const { conversation, isLoading } = useConversation(conversationId);
  const { isWaitingForResponse, setWaitingForResponse } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousMessageCountRef = useRef<number>(0);

  console.log('[ChatMessages] Render - conversationId:', conversationId, 'isWaitingForResponse:', isWaitingForResponse);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  // Detect when assistant response arrives and turn off loading state
  useEffect(() => {
    const messages = conversation?.messages || [];
    const currentMessageCount = messages.length;
    
    // If we're waiting for response and new messages arrived
    if (isWaitingForResponse && currentMessageCount > previousMessageCountRef.current) {
      // Check if the last message is from assistant
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.message_type === 'assistant_response') {
        console.log('[ChatMessages] Assistant response detected, turning off loading state');
        setWaitingForResponse(false);
      }
    }
    
    // Update the previous count
    previousMessageCountRef.current = currentMessageCount;
  }, [conversation?.messages, isWaitingForResponse, setWaitingForResponse]);

  const handlePlayAudio = (messageId: number, audioUrl: string) => {
    // Si déjà en lecture, mettre en pause
    if (playingAudioId === messageId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    // Arrêter l'audio en cours
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Lire le nouvel audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudioId(messageId);

    audio.play();

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
      console.error('Erreur lors de la lecture audio');
    };
  };

  useEffect(() => {
    // Nettoyer l'audio au démontage
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
      {messages.length === 0 && !isWaitingForResponse ? (
        <div className="flex items-center justify-center h-full text-foreground/70 text-sm">
          Aucun message. Commencez la conversation !
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message: ConversationMessage) => {
            const isUser = message.message_type === 'user_request';
            const isAudio = message.is_audio || false;
            const audioUrl = message.audio_url;

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
                  {/* Audio indicator and play button */}
                  {isAudio && audioUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-4 h-4" />
                      <span className="text-xs font-medium">Message vocal</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handlePlayAudio(message.id, audioUrl)}
                      >
                        {playingAudioId === message.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Message text content / transcription */}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* Timestamp */}
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

          {/* Show loading animation when waiting for response */}
          {isWaitingForResponse && <ChatLoadingAnimation />}
        </div>
      )}
    </ScrollArea>
  );
};
