import React from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import type { MessageThread } from '@/hooks/useMessageThreads';
import type { Message } from '@/hooks/useMessages';
import { getIconByValue } from '@/config/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MessageThreadItemProps {
  thread: MessageThread;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMessageClick: (message: Message) => void;
  onContactClick: (contactId: number) => void;
  onAssignProject: (messageId: number, projectId: number | '') => void;
  projects: Array<{ id: number; title: string; icon: string }>;
  threadMessages?: Message[];
  isLoadingMessages?: boolean;
}

export const MessageThreadItem: React.FC<MessageThreadItemProps> = ({
  thread,
  isExpanded,
  onToggleExpand,
  onMessageClick,
  onContactClick,
  onAssignProject,
  projects,
  threadMessages,
  isLoadingMessages,
}) => {
  const lastMessage = thread.last_message;

  return (
    <div className="bg-card border border-border rounded">
      {/* Thread header - toujours visible */}
      <div className="p-3">
        <button
          onClick={onToggleExpand}
          className="w-full text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-start gap-3">
            <div className="pt-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-foreground/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-foreground/60" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Métadonnées du thread */}
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <span className="px-2 py-0.5 rounded bg-muted/10 border border-border">
                  {thread.channel}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {thread.message_count} message{thread.message_count > 1 ? 's' : ''}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1 hover:bg-muted/20 text-xs"
                      aria-label="Changer le projet"
                      title="Changer le projet"
                    >
                      {lastMessage.project ? (
                        <>
                          <span>{getIconByValue((projects.find(p => p.id === lastMessage.project)?.icon) || '')}</span>
                          <span className="truncate max-w-[160px]">
                            {projects.find(p => p.id === lastMessage.project)?.title || `Projet #${lastMessage.project}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-foreground/60">Aucun projet</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-card border-border text-foreground">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssignProject(lastMessage.id, ''); }} className="cursor-pointer hover:bg-muted">
                      Aucun projet
                    </DropdownMenuItem>
                    {projects.map((p) => (
                      <DropdownMenuItem key={p.id} onClick={(e) => { e.stopPropagation(); onAssignProject(lastMessage.id, p.id); }} className="cursor-pointer hover:bg-muted">
                        <span className="mr-2">{getIconByValue(p.icon)}</span>
                        <span>{p.title || `Projet #${p.id}`}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="ml-auto">
                  {new Date(thread.last_message_date).toLocaleString()}
                </span>
              </div>

              {/* Sujet du thread */}
              <div className="font-medium truncate mb-1">
                {thread.thread_subject || '(Sans objet)'}
              </div>

              {/* Aperçu du dernier message */}
              {lastMessage.channel === 'SMS' ? (
                <div className="text-sm text-foreground/70 flex items-start gap-1">
                  <span className="text-xs text-foreground/50 shrink-0">De:</span>
                  {lastMessage.sender_contact ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onContactClick(lastMessage.sender_contact!.id);
                      }}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer truncate"
                    >
                      <User className="w-3 h-3" />
                      <span className="font-medium">{lastMessage.sender_contact.display_name}</span>
                      <span className="text-xs">({lastMessage.sender})</span>
                    </span>
                  ) : (
                    <span className="truncate">{lastMessage.sender}</span>
                  )}
                </div>
              ) : (
                <div className="text-sm text-foreground/70 flex items-start gap-1">
                  <span className="text-xs text-foreground/50 shrink-0">De:</span>
                  {lastMessage.sender_contact ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onContactClick(lastMessage.sender_contact!.id);
                      }}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer truncate"
                    >
                      <User className="w-3 h-3" />
                      <span className="font-medium">{lastMessage.sender_contact.display_name}</span>
                      <span className="text-xs ml-1">({lastMessage.sender})</span>
                    </span>
                  ) : (
                    <span className="truncate">{lastMessage.sender}</span>
                  )}
                </div>
              )}

              {/* Aperçu du contenu */}
              <div className="text-sm text-foreground/50 truncate mt-1">
                {lastMessage.body_text || '(Message vide)'}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Messages du thread (quand expansé) */}
      {isExpanded && (
        <div className="border-t border-border px-3 pb-3">
          {isLoadingMessages ? (
            <div className="py-4 text-center text-sm text-foreground/60">
              Chargement des messages...
            </div>
          ) : threadMessages && threadMessages.length > 0 ? (
            <div className="space-y-2 mt-3">
              {threadMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="bg-muted/5 border border-border/50 rounded p-2 hover:bg-muted/10 transition-colors cursor-pointer"
                  onClick={() => onMessageClick(msg)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-foreground/60">
                      {msg.sender_contact?.display_name || msg.sender}
                    </div>
                    <div className="text-xs text-foreground/50">
                      {new Date(msg.received_at).toLocaleString()}
                    </div>
                  </div>
                  {msg.subject && msg.channel === 'EMAIL' && (
                    <div className="text-sm font-medium truncate mb-1">
                      {msg.subject}
                    </div>
                  )}
                  <div className="text-sm text-foreground/70 line-clamp-2">
                    {msg.body_text || '(Message vide)'}
                  </div>
                  {msg.attachments_count > 0 && (
                    <div className="text-xs text-foreground/50 mt-1">
                      📎 {msg.attachments_count} pièce{msg.attachments_count > 1 ? 's' : ''} jointe{msg.attachments_count > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-foreground/60">
              Aucun message dans ce thread
            </div>
          )}
        </div>
      )}
    </div>
  );
};
