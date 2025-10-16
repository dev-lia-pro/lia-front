import React, { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConversations, useCreateConversation, useDeleteConversation } from '@/hooks';
import { useChatStore } from '@/stores/chatStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Conversation } from '@/hooks/useConversations';

export const ConversationList: React.FC = () => {
  const { conversations, isLoading, isFetching } = useConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

  const handleNewConversation = () => {
    createConversation(undefined, {
      onSuccess: (data: Conversation) => {
        setActiveConversation(data.id);
      },
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete, {
        onSuccess: () => {
          if (activeConversationId === conversationToDelete) {
            setActiveConversation(null);
          }
          setConversationToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-foreground/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden">
        {/* Header */}
        <div className="px-3 py-4 border-b border-border flex-shrink-0">
          <Button
            onClick={handleNewConversation}
            disabled={isCreating}
            className="w-full"
            size="sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </>
            )}
          </Button>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Barre de progression pour le rafraîchissement */}
          {isFetching && !isLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent overflow-hidden z-10">
              <div
                className="h-full bg-primary"
                style={{
                  animation: 'slideRight 1.5s ease-in-out infinite',
                  width: '40%',
                }}
              />
              <style>{`
                @keyframes slideRight {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(250%);
                  }
                }
              `}</style>
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-foreground/70 text-sm">
              Aucune conversation.
              <br />
              Créez-en une pour commencer !
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3">
              {conversations.map((conversation) => {
                const isMobile = window.innerWidth < 768;

                return (
                  <div
                    key={conversation.id}
                    className={`
                      group px-3 py-2.5 cursor-pointer transition-all duration-200 rounded-lg
                      ${activeConversationId === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-500'
                        : 'bg-card hover:bg-accent border border-transparent'
                      }
                      ${isDeleting ? 'opacity-50' : ''}
                    `}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {conversation.title || 'Sans titre'}
                        </div>
                        {conversation.last_message && (
                          <div className="text-xs text-foreground/60 truncate mt-1">
                            {conversation.last_message.content}
                          </div>
                        )}
                        <div className="text-xs text-foreground/50 mt-1">
                          {format(new Date(conversation.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 w-6 p-0 transition-opacity hover:bg-destructive/10 ${
                            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={(e) => handleDeleteClick(e, conversation.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={conversationToDelete !== null} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
