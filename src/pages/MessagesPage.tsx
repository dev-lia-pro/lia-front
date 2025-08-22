import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useMessages, type Message, type Channel } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import axios from '@/api/axios';
import { getIconByValue } from '@/config/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MessagesPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('boite');
  const [channelFilter, setChannelFilter] = React.useState<Channel | undefined>(undefined);
  const [searchTag, setSearchTag] = React.useState<string>('');
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const { selected } = useProjectStore();
  const { messages, isLoading, isFetching, totalCount, refetch } = useMessages({ channel: channelFilter, tag: searchTag || undefined, project: selected.id ?? undefined });
  const { projects } = useProjects();

  const handleAssignProject = async (messageId: number, projectId: number | '') => {
    try {
      await axios.patch(`/messages/${messageId}/`, { project: projectId || null });
      refetch();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* En-tête et filtres */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Boîte de réception</h3>
            <div className="flex items-center gap-2">
              <select
                className="bg-navy-card border border-border rounded px-2 py-1 text-sm"
                value={channelFilter ?? ''}
                onChange={(e) => setChannelFilter((e.target.value || undefined) as Channel | undefined)}
              >
                <option value="">Tous</option>
                <option value="EMAIL">Emails</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <input
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Filtrer par tag"
                className="bg-navy-card border border-border rounded px-2 py-1 text-sm"
              />
              <button onClick={() => refetch()} className="border border-border bg-navy-card hover:bg-navy-muted px-3 py-1 rounded text-sm text-foreground/80">Rafraîchir</button>
            </div>
          </div>

          {/* Liste des messages */}
          {isLoading || isFetching ? (
            <div className="text-foreground/70">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-card border border-border flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground/70 mb-2">Aucun message pour le moment</p>
              <p className="text-sm text-foreground/50">Vos messages apparaîtront ici</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-navy-card border border-border rounded p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                        <span className="px-2 py-0.5 rounded bg-muted/10 border border-border">{msg.channel}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1 hover:bg-muted/20 text-xs"
                              aria-label="Changer le projet"
                              title="Changer le projet"
                            >
                              {msg.project ? (
                                <>
                                  <span>{getIconByValue((projects.find(p => p.id === msg.project)?.icon) || '')}</span>
                                  <span className="truncate max-w-[160px]">
                                    {projects.find(p => p.id === msg.project)?.title || `Projet #${msg.project}`}
                                  </span>
                                </>
                              ) : (
                                <span className="text-foreground/60">Aucun projet</span>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-navy-card border-border text-foreground">
                            <DropdownMenuItem onClick={() => handleAssignProject(msg.id, '')} className="cursor-pointer hover:bg-navy-muted">
                              Aucun projet
                            </DropdownMenuItem>
                            {projects.map((p) => (
                              <DropdownMenuItem key={p.id} onClick={() => handleAssignProject(msg.id, p.id)} className="cursor-pointer hover:bg-navy-muted">
                                <span className="mr-2">{getIconByValue(p.icon)}</span>
                                <span>{p.title || `Projet #${p.id}`}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {msg.tags?.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-muted/10 border border-border">#{t}</span>
                        ))}
                        <span className="ml-auto">{new Date(msg.received_at).toLocaleString()}</span>
                      </div>

                      {msg.channel === 'SMS' ? (
                        <div className="text-sm">
                          <div className="text-foreground/70 truncate">{msg.sender}</div>
                          <div className="truncate">{msg.body_text || '(SMS)'}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
                          className="text-left w-full"
                        >
                          <div className="font-medium truncate">{msg.subject || '(Sans objet)'}</div>
                          <div className="text-sm text-foreground/70 truncate">{msg.sender}</div>
                        </button>
                      )}

                      {/* Pièces jointes */}
                      {msg.attachments_count > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="text-foreground/60">Pièces jointes: {msg.attachments_count}</span>
                          {msg.attachments?.map((att) => (
                            att.url ? (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded border border-border hover:bg-muted/10"
                                title={`Ouvrir ${att.filename}`}
                              >
                                {att.filename}
                              </a>
                            ) : (
                              <span
                                key={att.id}
                                className="px-2 py-0.5 rounded border border-border text-foreground/50"
                                title={`${att.filename} (URL indisponible)`}
                              >
                                {att.filename}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                      
                    </div>
                  </div>

                  {/* Panneau de détail pour EMAIL/WHATSAPP */}
                  {selectedMessage?.id === msg.id && msg.channel !== 'SMS' && (
                    <div className="mt-3 border-t border-border pt-3">
                      {msg.body_html ? (
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.body_html }} />
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-foreground/80">{msg.body_text}</pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MessagesPage;
