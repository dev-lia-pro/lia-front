import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useMessages, type Message, type Channel } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import { useDebounce } from '@/hooks/useDebounce';
import axios from '@/api/axios';
import { getIconByValue } from '@/config/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Cloud, CloudOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MessagesPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('boite');
  const [channelFilter, setChannelFilter] = React.useState<Channel | undefined>(undefined);
  const [searchTag, setSearchTag] = React.useState<string>('');
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const [hoveredAttachment, setHoveredAttachment] = React.useState<number | null>(null);
  const [attachmentStates, setAttachmentStates] = React.useState<Record<number, boolean>>({});
  const initializedRef = React.useRef(false);
  const { selected } = useProjectStore();
  const { messages, isLoading, isFetching, totalCount, refetch } = useMessages({ 
    channel: channelFilter, 
    tag: searchTag || undefined, 
    project: selected.id ?? undefined,
    search: debouncedSearchKeyword || undefined
  });
  const { projects } = useProjects();
  const { toast } = useToast();

  // Initialiser l'état des attachments seulement une fois au chargement initial
  React.useEffect(() => {
    if (!initializedRef.current && messages.length > 0) {
      const newAttachmentStates: Record<number, boolean> = {};
      messages.forEach(msg => {
        if (Array.isArray(msg.attachments)) {
          msg.attachments.forEach(att => {
            newAttachmentStates[att.id] = att.google_drive_backup || false;
          });
        }
      });
      setAttachmentStates(newAttachmentStates);
      initializedRef.current = true;
    }
  }, [messages]);

  // Réinitialiser quand les filtres changent
  React.useEffect(() => {
    initializedRef.current = false;
    setAttachmentStates({});
  }, [channelFilter, searchTag, selected.id]);

  const handleAssignProject = async (messageId: number, projectId: number | '') => {
    try {
      await axios.patch(`/messages/${messageId}/`, { project: projectId || null });
      refetch();
    } catch (e) {
      // ignore
    }
  };

  const handleSaveInDrive = async (attachmentId: number, messageId: number, isCurrentlyInDrive: boolean) => {
    // Mettre à jour l'état local immédiatement pour un feedback visuel instantané
    setAttachmentStates(prev => ({
      ...prev,
      [attachmentId]: !isCurrentlyInDrive
    }));

    try {
      const response = await axios.post(`/messages/${messageId}/attachments/${attachmentId}/save_in_drive/`, {
        google_drive_backup: !isCurrentlyInDrive
      });
      
      if (response.data.success) {
        toast({
          title: isCurrentlyInDrive ? "Fichier supprimé de Google Drive" : "Fichier stocké dans Google Drive",
          description: response.data.message,
        });
        // Rafraîchir la liste des messages pour synchroniser avec le backend
        refetch();
      } else {
        // En cas d'échec, remettre l'état précédent
        setAttachmentStates(prev => ({
          ...prev,
          [attachmentId]: isCurrentlyInDrive
        }));
      }
    } catch (error: any) {
      // En cas d'erreur, remettre l'état précédent
      setAttachmentStates(prev => ({
        ...prev,
        [attachmentId]: isCurrentlyInDrive
      }));
      
      const errorMessage = error.response?.data?.error || "Une erreur est survenue";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* En-tête et filtres */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Boîte de réception</h3>
              <button onClick={() => refetch()} className="border border-border bg-card hover:bg-muted px-3 py-1 rounded text-sm text-foreground/80">Rafraîchir</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Rechercher par mot-clé..."
                className="bg-card border border-border rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
              />
              <select
                className="bg-card border border-border rounded px-2 py-1.5 text-sm"
                value={channelFilter ?? ''}
                onChange={(e) => setChannelFilter((e.target.value || undefined) as Channel | undefined)}
              >
                <option value="">Tous les canaux</option>
                <option value="EMAIL">Emails</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <input
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Filtrer par tag"
                className="bg-card border border-border rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Liste des messages */}
          {isLoading || isFetching ? (
            <div className="text-foreground/70">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground/70 mb-2">Aucun message pour le moment</p>
              <p className="text-sm text-foreground/50">Vos messages apparaîtront ici</p>
            </div>
          ) : messages.length === 0 && debouncedSearchKeyword ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-foreground/70 mb-2">Aucun message trouvé</p>
              <p className="text-sm text-foreground/50">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-card border border-border rounded p-3">
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
                          <DropdownMenuContent align="start" className="bg-card border-border text-foreground">
                            <DropdownMenuItem onClick={() => handleAssignProject(msg.id, '')} className="cursor-pointer hover:bg-muted">
                              Aucun projet
                            </DropdownMenuItem>
                            {projects.map((p) => (
                              <DropdownMenuItem key={p.id} onClick={() => handleAssignProject(msg.id, p.id)} className="cursor-pointer hover:bg-muted">
                                <span className="mr-2">{getIconByValue(p.icon)}</span>
                                <span>{p.title || `Projet #${p.id}`}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {Array.isArray(msg.tags) && msg.tags.map((t) => (
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
                        <div className="mt-2 text-xs">
                          <div className="text-foreground/60 mb-2">Pièces jointes: {msg.attachments_count}</div>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(msg.attachments) && msg.attachments.map((att) => {
                              const isInDrive = attachmentStates[att.id] ?? att.google_drive_backup ?? false;
                              return (
                                <div key={att.id} className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleSaveInDrive(att.id, msg.id, !!isInDrive)}
                                    onMouseEnter={() => setHoveredAttachment(att.id)}
                                    onMouseLeave={() => setHoveredAttachment(null)}
                                    className={`p-1 rounded hover:bg-muted/20 transition-colors ${
                                      isInDrive ? 'text-blue-400' : 'text-gray-400'
                                    }`}
                                    title={isInDrive ? 'Supprimer de Google Drive' : 'Sauvegarder dans Google Drive'}
                                  >
                                    {(() => {
                                      if (isInDrive) {
                                        // Fichier stocké : afficher Cloud, au hover afficher CloudOff
                                        return hoveredAttachment === att.id ? <CloudOff className="w-3 h-3" /> : <Cloud className="w-3 h-3" />;
                                      } else {
                                        // Fichier non stocké : afficher CloudOff, au hover afficher Cloud
                                        return hoveredAttachment === att.id ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />;
                                      }
                                    })()}
                                  </button>
                                  {att.url ? (
                                    <a
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
                                      className="px-2 py-0.5 rounded border border-border text-foreground/50"
                                      title={`${att.filename} (URL indisponible)`}
                                    >
                                      {att.filename}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
