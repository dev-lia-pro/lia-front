import React, { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage, useSendAudioMessage, useCreateConversation } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useChatStore } from '@/stores/chatStore';
import { useToast } from '@/hooks/use-toast';
import type { Conversation } from '@/hooks/useConversations';
import axios from '@/api/axios';

interface ChatInputProps {
  conversationId: number | null;
}

export const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { setActiveConversation, setWaitingForResponse } = useChatStore();
  const queryClient = useQueryClient();

  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(conversationId || 0);
  const { mutate: sendAudioMessage, isPending: isSendingAudio } = useSendAudioMessage(conversationId || 0);

  // Handler pour envoyer un message audio (défini avant useAudioRecording)
  const handleSendAudio = useCallback(async (audioBlob: Blob) => {
    // Lire conversationId depuis le store au moment de l'envoi (pas depuis la closure)
    const { activeConversationId } = useChatStore.getState();
    console.log('[ChatInput] handleSendAudio called with activeConversationId:', activeConversationId);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setWaitingForResponse(true);

    // Si pas de conversation, créer une nouvelle conversation d'abord
    if (!activeConversationId) {
      console.log('[ChatInput] No conversation, creating new one...');
      createConversation(undefined, {
        onSuccess: async (newConversation: Conversation) => {
          // Définir la nouvelle conversation comme active
          setActiveConversation(newConversation.id);
          console.log('[ChatInput] New conversation created:', newConversation.id);

          // Envoyer le message audio via le hook avec le nouveau conversationId
          // On doit créer une nouvelle instance du hook avec le bon ID
          try {
            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'recording.webm');
            formData.append('timezone', timezone);

            const response = await axios.post(
              `/conversations/${newConversation.id}/send_audio_message/`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );

            // Auto-play audio response
            if (response.data.assistant_message?.audio_url) {
              const audio = new Audio(response.data.assistant_message.audio_url);
              audio.play().catch(error => {
                console.error('Erreur lors de la lecture audio:', error);
              });
            }

            // Invalider les queries pour rafraîchir l'UI
            queryClient.invalidateQueries({ queryKey: ['conversation', newConversation.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            setWaitingForResponse(false);
          } catch (error: any) {
            setWaitingForResponse(false);
            toast({
              title: 'Erreur',
              description: error?.message || "Impossible d'envoyer le message audio",
              variant: 'destructive',
            });
          }
        },
        onError: (error: any) => {
          setWaitingForResponse(false);
          toast({
            title: 'Erreur',
            description: error?.message || 'Impossible de créer la conversation',
            variant: 'destructive',
          });
        },
      });
    } else {
      // Envoyer le message audio dans la conversation existante
      console.log('[ChatInput] Using existing conversation:', activeConversationId);

      // Utiliser axios directement car le hook est créé avec l'ancien conversationId
      try {
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm');
        formData.append('timezone', timezone);

        const response = await axios.post(
          `/conversations/${activeConversationId}/send_audio_message/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Auto-play audio response
        if (response.data.assistant_message?.audio_url) {
          const audio = new Audio(response.data.assistant_message.audio_url);
          audio.play().catch(error => {
            console.error('Erreur lors de la lecture audio:', error);
          });
        }

        // Invalider les queries pour rafraîchir l'UI
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        setWaitingForResponse(false);
      } catch (error: any) {
        setWaitingForResponse(false);
        toast({
          title: 'Erreur',
          description: error?.message || "Impossible d'envoyer le message audio",
          variant: 'destructive',
        });
      }
    }
  }, [toast, setWaitingForResponse, createConversation, setActiveConversation, queryClient]);

  // Audio recording hook
  const {
    isRecording,
    isLoading: isAudioProcessing,
    audioLevel,
    isDesktop,
    startRecording,
    stopRecording,
  } = useAudioRecording(handleSendAudio);

  const isDisabled = !message.trim() || isSending || isCreating || isProcessing || isSendingAudio;

  const handleSendText = async () => {
    if (isDisabled) return;

    const trimmedMessage = message.trim();
    setIsProcessing(true);
    setWaitingForResponse(true);

    try {
      // Si pas de conversation, créer une nouvelle conversation d'abord
      if (!conversationId) {
        createConversation(undefined, {
          onSuccess: async (newConversation: Conversation) => {
            // Définir la nouvelle conversation comme active
            setActiveConversation(newConversation.id);

            // Envoyer le message via API directement
            try {
              await axios.post(`/conversations/${newConversation.id}/send_message/`, {
                message: trimmedMessage
              });

              setMessage('');
              setIsProcessing(false);
              setWaitingForResponse(false);
              textareaRef.current?.focus();
            } catch (error: any) {
              setIsProcessing(false);
              setWaitingForResponse(false);
              toast({
                title: 'Erreur',
                description: error?.message || "Impossible d'envoyer le message",
                variant: 'destructive',
              });
            }
          },
          onError: (error: any) => {
            setIsProcessing(false);
            setWaitingForResponse(false);
            toast({
              title: 'Erreur',
              description: error?.message || 'Impossible de créer la conversation',
              variant: 'destructive',
            });
          },
        });
      } else {
        // Envoyer le message dans la conversation existante
        sendMessage(trimmedMessage, {
          onSuccess: () => {
            setMessage('');
            setIsProcessing(false);
            setWaitingForResponse(false);
            textareaRef.current?.focus();
          },
          onError: (error: any) => {
            setIsProcessing(false);
            setWaitingForResponse(false);
            toast({
              title: 'Erreur',
              description: error?.message || "Impossible d'envoyer le message",
              variant: 'destructive',
            });
          },
        });
      }
    } catch (error: any) {
      setIsProcessing(false);
      setWaitingForResponse(false);
      toast({
        title: 'Erreur',
        description: error?.message || "Une erreur est survenue",
        variant: 'destructive',
      });
    }
  };

  // Desktop: clic pour start/stop
  const handleDesktopMicClick = () => {
    if (isAudioProcessing || isProcessing || isSendingAudio) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Mobile: push to talk
  const handleMobileMicStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isAudioProcessing || isRecording || isProcessing || isSendingAudio) return;

    startRecording();
  };

  const handleMobileMicEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();

    if (isRecording) {
      stopRecording();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
          className="flex-1 min-h-[60px] max-h-[200px] resize-none"
          disabled={isSending || isCreating || isProcessing}
        />

        {/* Bouton Micro */}
        <Button
          onClick={isDesktop ? handleDesktopMicClick : undefined}
          onTouchStart={!isDesktop ? handleMobileMicStart : undefined}
          onTouchEnd={!isDesktop ? handleMobileMicEnd : undefined}
          onTouchCancel={!isDesktop ? handleMobileMicEnd : undefined}
          disabled={isAudioProcessing || isProcessing || isSendingAudio}
          size="icon"
          variant={isRecording ? 'destructive' : 'outline'}
          className={`h-[60px] w-[60px] shrink-0 relative ${
            isRecording ? 'animate-pulse' : ''
          }`}
          title={
            isDesktop
              ? (isRecording ? 'Cliquez pour arrêter' : 'Enregistrer un message vocal')
              : 'Maintenez pour enregistrer'
          }
        >
          {(isAudioProcessing || isSendingAudio) ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <Mic className="w-5 h-5" />
          )}

          {/* Visual feedback for audio level */}
          {isRecording && audioLevel > 0 && (
            <div
              className="absolute inset-0 bg-red-500/30 rounded-md"
              style={{
                opacity: audioLevel,
              }}
            />
          )}
        </Button>

        {/* Bouton Envoi */}
        <Button
          onClick={handleSendText}
          disabled={isDisabled}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
        >
          {(isSending || isCreating || isProcessing) ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
