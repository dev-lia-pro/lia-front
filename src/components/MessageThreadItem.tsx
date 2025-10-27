import React from 'react';
import { User, MessageCircle, EyeOff, Eye, Loader2 } from 'lucide-react';
import type { MessageThread } from '@/hooks/useMessageThreads';
import type { Message } from '@/hooks/useMessages';
import { getIconByValue } from '@/config/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MessageThreadItemProps {
  thread: MessageThread;
  onThreadClick: (thread: MessageThread) => void;
  onContactClick: (contactId: number) => void;
  onAssignProject: (messageId: number, projectId: number | '') => void;
  onToggleHidden: (messageId: number, currentHidden: boolean) => void;
  projects: Array<{ id: number; title: string; icon: string }>;
  updatingProject?: boolean;
}

export const MessageThreadItem: React.FC<MessageThreadItemProps> = ({
  thread,
  onThreadClick,
  onContactClick,
  onAssignProject,
  onToggleHidden,
  projects,
  updatingProject = false,
}) => {
  const lastMessage = thread.last_message;

  return (
    <div className="bg-card border border-border rounded">
      {/* Thread header */}
      <div className="p-3">
        <div
          onClick={() => onThreadClick(thread)}
          className="w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-start gap-3">
            {thread.message_count > 1 && (
              <div className="pt-1">
                <MessageCircle className="w-4 h-4 text-primary/60" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Métadonnées du thread */}
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <span className="px-2 py-0.5 rounded bg-muted/10 border border-border">
                  {thread.channel}
                </span>
                {thread.message_count > 1 && (
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 flex items-center gap-1">
                    {thread.message_count} message{thread.message_count > 1 ? 's' : ''} {(thread.hidden_count ?? 0) > 0 ? 'masqués' : ''}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      disabled={updatingProject}
                      className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1 hover:bg-muted/20 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Changer le projet"
                      title="Changer le projet"
                    >
                      {updatingProject ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mise à jour...</span>
                        </>
                      ) : lastMessage.project ? (
                        <>
                          {(() => {
                            const IconComponent = getIconByValue((projects.find(p => p.id === lastMessage.project)?.icon) || '');
                            return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                          })()}
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
                    {projects.map((p) => {
                      const IconComponent = getIconByValue(p.icon);
                      return (
                        <DropdownMenuItem key={p.id} onClick={(e) => { e.stopPropagation(); onAssignProject(lastMessage.id, p.id); }} className="cursor-pointer hover:bg-muted">
                          <span className="mr-2">{IconComponent ? <IconComponent className="w-4 h-4" /> : null}</span>
                          <span>{p.title || `Projet #${p.id}`}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Bouton toggle masquer/afficher */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHidden(lastMessage.id, lastMessage.hidden || false);
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
                  title={lastMessage.hidden ? "Afficher cette conversation" : "Masquer cette conversation"}
                >
                  {lastMessage.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                <>
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
                  {(lastMessage.recipient_contacts && lastMessage.recipient_contacts.length > 0) || lastMessage.recipients.length > 0 ? (
                    <div className="text-sm text-foreground/70 mt-1 flex items-start gap-1">
                      <span className="text-xs text-foreground/50 shrink-0">À:</span>
                      <span className="truncate">
                        {lastMessage.recipient_contacts && lastMessage.recipient_contacts.length > 0 ? (
                          <>
                            {lastMessage.recipient_contacts.map(c => c.display_name).join(', ')}
                            {lastMessage.recipients.length > lastMessage.recipient_contacts.length &&
                              ` +${lastMessage.recipients.length - lastMessage.recipient_contacts.length} autre(s)`
                            }
                          </>
                        ) : (
                          lastMessage.recipients.join(', ')
                        )}
                      </span>
                    </div>
                  ) : null}
                </>
              )}

              {/* Aperçu du contenu */}
              <div className="text-sm text-foreground/50 truncate mt-1">
                {lastMessage.body_text || '(Message vide)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
