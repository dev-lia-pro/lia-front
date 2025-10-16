import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage, useCreateConversation } from '@/hooks';
import { useChatStore } from '@/stores/chatStore';
import { useToast } from '@/hooks/use-toast';
import type { Conversation } from '@/hooks/useConversations';

interface ChatInputProps {
  conversationId: number | null;
}

export const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { setActiveConversation } = useChatStore();

  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(conversationId || 0);

  const isDisabled = !message.trim() || isSending || isCreating;

  const handleSend = () => {
    if (isDisabled) return;

    const trimmedMessage = message.trim();

    // Si pas de conversation, créer une nouvelle conversation d'abord
    if (!conversationId) {
      createConversation(undefined, {
        onSuccess: (newConversation: Conversation) => {
          // Définir la nouvelle conversation comme active
          setActiveConversation(newConversation.id);

          // Envoyer le message dans la nouvelle conversation
          const sendMessageMutation = useSendMessage(newConversation.id);
          sendMessageMutation.mutate(trimmedMessage, {
            onSuccess: () => {
              setMessage('');
              textareaRef.current?.focus();
            },
            onError: (error: any) => {
              toast({
                title: 'Erreur',
                description: error?.message || "Impossible d'envoyer le message",
                variant: 'destructive',
              });
            },
          });
        },
        onError: (error: any) => {
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
          textareaRef.current?.focus();
        },
        onError: (error: any) => {
          toast({
            title: 'Erreur',
            description: error?.message || "Impossible d'envoyer le message",
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          disabled={isSending || isCreating}
        />
        <Button
          onClick={handleSend}
          disabled={isDisabled}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
