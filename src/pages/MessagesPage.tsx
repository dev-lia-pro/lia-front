import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useMessages, type Message, type Channel } from '@/hooks/useMessages';
import { useMessageThreads, useThreadMessages } from '@/hooks/useMessageThreads';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import { useSearchParams } from 'react-router-dom';
import { useUrlState } from '@/hooks/useUrlState';
import axios from '@/api/axios';
import { API_BASE_URL } from '@/config/env';
import { getIconByValue } from '@/config/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cloud, CloudOff, User, Loader2, List, Layers, EyeOff, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContactDetailsModal } from '@/components/ContactDetailsModal';
import { MessageDetailsDialog } from '@/components/MessageDetailsDialog';
import { MessageThreadItem } from '@/components/MessageThreadItem';
import { useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/config/pagination';

type ViewMode = 'list' | 'threads';

const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('boite');

  // URL-synced state
  const [viewMode, setViewMode] = useUrlState<ViewMode>({ paramName: 'view', defaultValue: 'threads', omitDefault: false });
  const [channelFilter, setChannelFilter] = useUrlState<string>({ paramName: 'channel', defaultValue: 'ALL' });
  const [searchTag, setSearchTag] = useUrlState<string>({ paramName: 'tag', defaultValue: '', debounce: 500 });
  const [searchKeyword, setSearchKeyword] = useUrlState<string>({ paramName: 'search', defaultValue: '', debounce: 500 });
  const [showHidden, setShowHidden] = useUrlState<boolean>({ paramName: 'show_hidden', defaultValue: false });
  const [currentPage, setCurrentPage] = useUrlState<number>({ paramName: 'page', defaultValue: 1 });

  // Convert channelFilter string back to Channel type or undefined for API
  const apiChannelFilter: Channel | undefined = channelFilter === 'ALL' ? undefined : (channelFilter as Channel);
  const [selectedMessageDialog, setSelectedMessageDialog] = React.useState<Message | null>(null);
  const [hoveredAttachment, setHoveredAttachment] = React.useState<number | null>(null);
  const [attachmentStates, setAttachmentStates] = React.useState<Record<number, boolean>>({});
  const [downloadingAttachments, setDownloadingAttachments] = React.useState<Set<number>>(new Set());
  const [savingAttachments, setSavingAttachments] = React.useState<Set<number>>(new Set());
  const [updatingProjectForMessage, setUpdatingProjectForMessage] = React.useState<Set<number>>(new Set());
  const [selectedContactId, setSelectedContactId] = React.useState<number | null>(null);
  const initializedRef = React.useRef(false);
  const { selected } = useProjectStore();

  // Filter by IDs from notification
  const idsParam = searchParams.get('ids');
  const [filteredIds, setFilteredIds] = React.useState<string | undefined>(idsParam || undefined);

  // Thread state for dialog
  const [currentThreadId, setCurrentThreadId] = React.useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  // Hook pour la vue liste (classique) - seulement si en mode 'list'
  const { messages, isLoading: isLoadingMessages, isFetching, totalCount, refetch } = useMessages({
    channel: apiChannelFilter,
    tag: searchTag || undefined,
    project: selected.id ?? undefined,
    search: searchKeyword || undefined,
    ids: filteredIds,
    showHidden: showHidden,
    page: currentPage,
    pageSize: PAGE_SIZE,
  }, { enabled: viewMode === 'list' });

  // Hook pour la vue conversations - seulement si en mode 'threads'
  const { threads, isLoading: isLoadingThreads, totalCount: totalCountThreads, refetch: refetchThreads } = useMessageThreads({
    channel: apiChannelFilter,
    tag: searchTag || undefined,
    project: selected.id ?? undefined,
    ids: filteredIds,
    showHidden: showHidden,
    page: currentPage,
    pageSize: PAGE_SIZE,
  }, { enabled: viewMode === 'threads' });

  // Hook pour charger les messages d'un thread quand la dialog est ouverte
  // On utilise le même état showHidden que pour la liste globale
  const { messages: threadMessages, isLoading: isLoadingThreadMessages } = useThreadMessages(currentThreadId, showHidden);

  // Trouver l'index du message sélectionné dans le thread une fois chargé
  React.useEffect(() => {
    if (threadMessages.length > 0 && selectedMessageDialog) {
      const index = threadMessages.findIndex(m => m.id === selectedMessageDialog.id);
      if (index !== -1 && index !== currentMessageIndex) {
        setCurrentMessageIndex(index);
      }
    }
  }, [threadMessages, selectedMessageDialog]);

  const { projects } = useProjects();
  const { toast } = useToast();

  const isLoading = viewMode === 'list' ? isLoadingMessages : isLoadingThreads;

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
    // Réinitialiser la page à 1 quand les filtres changent
    setCurrentPage(1);
  }, [apiChannelFilter, searchTag, selected.id, searchKeyword]);

  // Réinitialiser la page quand on change de mode d'affichage
  React.useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  // Gérer les query params (ids pour filtrer, message pour ouvrir un message spécifique)
  React.useEffect(() => {
    const idsParam = searchParams.get('ids');
    const messageId = searchParams.get('message');

    if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.trim());

      if (ids.length === 1) {
        // Un seul message : ouvrir directement la dialog
        if (messages.length > 0) {
          const message = messages.find(m => m.id === parseInt(ids[0]));
          if (message) {
            setSelectedMessageDialog(message);
            // Charger le thread si disponible
            if (message.thread_id) {
              setCurrentThreadId(message.thread_id);
              setCurrentMessageIndex(0);
            } else {
              setCurrentThreadId(null);
              setCurrentMessageIndex(0);
            }
            // Nettoyer le query param après ouverture
            setSearchParams({});
          }
        }
      } else {
        // Plusieurs messages : filtrer par IDs depuis une notification groupée
        setFilteredIds(idsParam);
      }
    } else if (messageId && messages.length > 0) {
      // Ouvrir un message spécifique
      const message = messages.find(m => m.id === parseInt(messageId));
      if (message) {
        setSelectedMessageDialog(message);
        // Nettoyer le query param après ouverture
        setSearchParams({});
      }
    }
  }, [messages, searchParams, setSearchParams]);

  const queryClient = useQueryClient();

  // Handler pour ouvrir un thread
  const handleThreadClick = (thread: any) => {
    // Définir le thread actuel pour charger les messages
    setCurrentThreadId(thread.thread_id);
    // Ouvrir la dialog avec le dernier message
    setSelectedMessageDialog(thread.last_message);
    // Réinitialiser l'index à 0 (premier message sera chargé)
    setCurrentMessageIndex(0);
  };

  // Handler pour naviguer entre les messages d'un thread
  const handleNavigateMessage = (index: number) => {
    if (threadMessages && threadMessages[index]) {
      setCurrentMessageIndex(index);
      setSelectedMessageDialog(threadMessages[index]);
    }
  };

  // Handler pour fermer la dialog
  const handleCloseDialog = () => {
    setSelectedMessageDialog(null);
    setCurrentThreadId(null);
    setCurrentMessageIndex(0);
  };

  const handleAssignProject = async (messageId: number, projectId: number | '') => {
    const newProjectId = projectId === '' ? null : projectId;

    // Add message to updating state
    setUpdatingProjectForMessage(prev => new Set(prev).add(messageId));

    // Build the exact filter object used by useMessages
    const messageFilters = {
      channel: apiChannelFilter,
      tag: searchTag || undefined,
      project: selected.id ?? undefined,
      search: searchKeyword || undefined,
      ids: filteredIds,
      showHidden: showHidden,
      page: currentPage,
      pageSize: PAGE_SIZE,
    };

    // Update local state immediately for instant feedback - Messages cache
    queryClient.setQueryData(['messages', messageFilters], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        results: oldData.results.map((msg: Message) =>
          msg.id === messageId ? { ...msg, project: newProjectId } : msg
        )
      };
    });

    // Update threads cache
    queryClient.setQueryData(['message-threads', { channel: apiChannelFilter, tag: searchTag || undefined, project: selected.id ?? undefined, ids: filteredIds, showHidden: showHidden, page: currentPage, pageSize: PAGE_SIZE }], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        results: oldData.results.map((thread: any) =>
          thread.last_message.id === messageId
            ? { ...thread, last_message: { ...thread.last_message, project: newProjectId } }
            : thread
        )
      };
    });

    // Also update selectedMessageDialog if it's the same message
    if (selectedMessageDialog?.id === messageId) {
      setSelectedMessageDialog(prev => prev ? { ...prev, project: newProjectId } : null);
    }

    try {
      await axios.patch(`/messages/${messageId}/`, { project: newProjectId });
    } catch (e) {
      // Revert on error
      refetch();
      refetchThreads();
      toast({
        title: "Erreur",
        description: "Impossible de modifier le projet",
        variant: "destructive",
      });
    } finally {
      // Remove message from updating state
      setUpdatingProjectForMessage(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const handleDownloadAttachment = async (messageId: number, attachmentId: number, filename: string) => {
    console.log('handleDownloadAttachment called:', { messageId, attachmentId, filename });

    // Ajouter l'attachment à l'état de téléchargement
    setDownloadingAttachments(prev => new Set(prev).add(attachmentId));

    try {
      // Construire l'URL relative pour le téléchargement (avec slash final requis par Django)
      const url = `/messages/${messageId}/attachments/${attachmentId}/download/`;
      console.log('Downloading from URL:', url);

      // Télécharger le fichier avec axios (inclut l'authentification automatiquement)
      const response = await axios.get(url, {
        responseType: 'blob', // Important pour télécharger les fichiers binaires
      });
      console.log('Download response received:', response.status);

      // Créer un blob URL à partir de la réponse
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);

      // Créer un élément anchor pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer l'URL blob
      window.URL.revokeObjectURL(blobUrl);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    } finally {
      // Retirer l'attachment de l'état de téléchargement
      setDownloadingAttachments(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  const handleToggleHidden = async (messageId: number, currentHidden: boolean) => {
    const newHidden = !currentHidden;

    try {
      // Chercher le message dans la liste des messages ou dans les threads
      const message = messages.find(m => m.id === messageId)
        || threads.find(t => t.last_message.id === messageId)?.last_message
        || selectedMessageDialog;

      if (message?.thread_id) {
        // Masquer/afficher tout le thread
        await axios.post(`/messages/${messageId}/hide-thread/`, { hidden: newHidden });
        toast({
          title: newHidden ? "Conversation masquée" : "Conversation affichée",
          description: newHidden ? "Tous les messages de cette conversation ont été masqués" : "Tous les messages de cette conversation sont maintenant visibles",
        });
      } else {
        // Message unique sans thread
        await axios.patch(`/messages/${messageId}/`, { hidden: newHidden });
        toast({
          title: newHidden ? "Message masqué" : "Message affiché",
          description: newHidden ? "Le message a été masqué" : "Le message est maintenant visible",
        });
      }

      // Mettre à jour l'état local du message dans la dialog pour que l'icône change
      if (selectedMessageDialog) {
        setSelectedMessageDialog(prev => prev ? { ...prev, hidden: newHidden } : null);
      }

      // Si on masque ET qu'on n'est PAS en mode "Afficher masqués", fermer la dialog
      if (newHidden && !showHidden && selectedMessageDialog?.id === messageId) {
        handleCloseDialog();
      }

      // Rafraîchir les listes
      await refetch();
      await refetchThreads();
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le message",
        variant: "destructive",
      });
    }
  };

  const handleSaveInDrive = async (attachmentId: number, messageId: number, isCurrentlyInDrive: boolean) => {
    // Ajouter l'attachment à l'état de sauvegarde
    setSavingAttachments(prev => new Set(prev).add(attachmentId));

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
    } finally {
      // Retirer l'attachment de l'état de sauvegarde
      setSavingAttachments(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6">
          {/* En-tête et filtres */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Boîte de réception</h3>
              <div className="flex gap-2">
                {/* Toggle vue liste/conversations */}
                <div className="flex border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground/80 hover:bg-muted'
                    }`}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Liste</span>
                  </button>
                  <button
                    onClick={() => setViewMode('threads')}
                    className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
                      viewMode === 'threads'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground/80 hover:bg-muted'
                    }`}
                    title="Vue conversations"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Conversations</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="border border-border bg-card hover:bg-muted px-3 py-1 rounded text-sm flex items-center gap-1 text-foreground/80 transition-colors"
                  title={showHidden ? "Masquer les messages masqués" : "Afficher les messages masqués"}
                >
                  {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">Masqués</span>
                </button>
                <button
                  onClick={() => viewMode === 'list' ? refetch() : refetchThreads()}
                  className="border border-border bg-card hover:bg-muted px-3 py-1 rounded text-sm text-foreground/80"
                >
                  Rafraîchir
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Rechercher..."
                className="bg-card border border-border rounded px-3 py-1.5 text-sm w-full"
              />
              <Select
                value={channelFilter}
                onValueChange={(value) => setChannelFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les canaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les canaux</SelectItem>
                  <SelectItem value="EMAIL">Emails</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <input
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Filtrer par tag"
                className="bg-card border border-border rounded px-3 py-1.5 text-sm w-full sm:col-span-2 lg:col-span-1"
              />
            </div>

            {/* Indicateur de filtre actif */}
            {filteredIds && (
              <div className="bg-muted/50 border border-border rounded p-3 flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Vue filtrée
                    </p>
                    <p className="text-xs text-foreground/70">
                      {(() => {
                        const count = filteredIds.split(',').length;
                        return count === 1
                          ? '1 message sélectionné depuis une notification'
                          : `${count} messages sélectionnés depuis une notification`;
                      })()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilteredIds(undefined);
                    setSearchParams({});
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium transition-colors hover:opacity-90"
                >
                  Afficher tous les messages
                </button>
              </div>
            )}
          </div>

          {/* Liste des messages ou conversations */}
          {isLoading ? (
            <div className="text-foreground/70">Chargement…</div>
          ) : viewMode === 'threads' && threads.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
                <Layers className="w-8 h-8 text-foreground/50" />
              </div>
              <p className="text-foreground/70 mb-2">Aucune conversation pour le moment</p>
              <p className="text-sm text-foreground/50">Vos conversations apparaîtront ici</p>
            </div>
          ) : viewMode === 'list' && messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground/70 mb-2">Aucun message pour le moment</p>
              <p className="text-sm text-foreground/50">Vos messages apparaîtront ici</p>
            </div>
          ) : viewMode === 'threads' ? (
            <>
              {/* Vue conversations */}
              <div className="grid grid-cols-1 gap-3">
                {threads.map((thread) => (
                  <MessageThreadItem
                    key={thread.thread_id}
                    thread={thread}
                    onThreadClick={handleThreadClick}
                    onContactClick={setSelectedContactId}
                    onAssignProject={handleAssignProject}
                    onToggleHidden={handleToggleHidden}
                    projects={projects}
                    updatingProject={updatingProjectForMessage.has(thread.last_message.id)}
                  />
                ))}
              </div>

              {/* Pagination pour les threads */}
              {totalCountThreads > PAGE_SIZE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCountThreads / PAGE_SIZE)}
                  totalCount={totalCountThreads}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <>
              {/* Vue liste classique */}
              <div className="grid grid-cols-1 gap-3">
                {messages.map((msg) => (
                <div key={msg.id} className="bg-card border border-border rounded p-3">
                  <div
                    onClick={() => {
                      setSelectedMessageDialog(msg);
                      // Charger le thread si disponible
                      if (msg.thread_id) {
                        setCurrentThreadId(msg.thread_id);
                        setCurrentMessageIndex(0); // Réinitialiser l'index
                      } else {
                        setCurrentThreadId(null);
                        setCurrentMessageIndex(0);
                      }
                    }}
                    className="w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                        <span className="px-2 py-0.5 rounded bg-muted/10 border border-border">{msg.channel}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              disabled={updatingProjectForMessage.has(msg.id)}
                              className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1 hover:bg-muted/20 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Changer le projet"
                              title="Changer le projet"
                            >
                              {updatingProjectForMessage.has(msg.id) ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Mise à jour...</span>
                                </>
                              ) : msg.project ? (
                                <>
                                  {(() => {
                                    const IconComponent = getIconByValue((projects.find(p => p.id === msg.project)?.icon) || '');
                                    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                                  })()}
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAssignProject(msg.id, ''); }} className="cursor-pointer hover:bg-muted">
                              Aucun projet
                            </DropdownMenuItem>
                            {projects.map((p) => {
                              const IconComponent = getIconByValue(p.icon);
                              return (
                                <DropdownMenuItem key={p.id} onClick={(e) => { e.stopPropagation(); handleAssignProject(msg.id, p.id); }} className="cursor-pointer hover:bg-muted">
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
                            handleToggleHidden(msg.id, msg.hidden || false);
                          }}
                          className="p-1 rounded hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
                          title={msg.hidden ? "Afficher ce message" : "Masquer ce message"}
                        >
                          {msg.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {Array.isArray(msg.tags) && msg.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-muted/10 border border-border">#{t}</span>
                        ))}
                        <span className="ml-auto">{new Date(msg.received_at).toLocaleString()}</span>
                      </div>

                      {msg.channel === 'SMS' ? (
                        <div className="text-sm">
                          <div className="text-foreground/70 flex items-start gap-1">
                            <span className="text-xs text-foreground/50 shrink-0">De:</span>
                            {msg.sender_contact ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContactId(msg.sender_contact!.id);
                                }}
                                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer truncate"
                              >
                                <User className="w-3 h-3" />
                                <span className="font-medium">{msg.sender_contact.display_name}</span>
                                <span className="text-xs">({msg.sender})</span>
                              </span>
                            ) : (
                              <span className="truncate">{msg.sender}</span>
                            )}
                          </div>
                          <div className="truncate mt-1">{msg.body_text || '(SMS)'}</div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium truncate">{msg.subject || '(Sans objet)'}</div>
                          <div className="text-sm text-foreground/70 flex items-start gap-1 mt-1">
                            <span className="text-xs text-foreground/50 shrink-0">De:</span>
                            {msg.sender_contact ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContactId(msg.sender_contact!.id);
                                }}
                                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer truncate"
                              >
                                <User className="w-3 h-3" />
                                <span className="font-medium">{msg.sender_contact.display_name}</span>
                                <span className="text-xs ml-1">({msg.sender})</span>
                              </span>
                            ) : (
                              <span className="truncate">{msg.sender}</span>
                            )}
                          </div>
                          {(msg.recipient_contacts && msg.recipient_contacts.length > 0) || msg.recipients.length > 0 ? (
                            <div className="text-sm text-foreground/70 mt-1 flex items-start gap-1">
                              <span className="text-xs text-foreground/50 shrink-0">À:</span>
                              <span className="truncate">
                                {msg.recipient_contacts && msg.recipient_contacts.length > 0 ? (
                                  <>
                                    {msg.recipient_contacts.map(c => c.display_name).join(', ')}
                                    {msg.recipients.length > msg.recipient_contacts.length &&
                                      ` +${msg.recipients.length - msg.recipient_contacts.length} autre(s)`
                                    }
                                  </>
                                ) : (
                                  msg.recipients.join(', ')
                                )}
                              </span>
                            </div>
                          ) : null}
                          {/* Aperçu du contenu */}
                          <div className="text-sm text-foreground/50 truncate mt-1">
                            {msg.body_text || '(Message vide)'}
                          </div>
                        </>
                      )}

                      {/* Pièces jointes */}
                      {msg.attachments_count > 0 && (
                        <div className="mt-2 text-xs" onClick={(e) => e.stopPropagation()}>
                          <div className="text-foreground/60 mb-2">Pièces jointes: {msg.attachments_count}</div>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(msg.attachments) && msg.attachments.map((att) => {
                              const isInDrive = attachmentStates[att.id] ?? att.google_drive_backup ?? false;
                              const isSaving = savingAttachments.has(att.id);
                              return (
                                <div key={att.id} className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveInDrive(att.id, msg.id, !!isInDrive);
                                    }}
                                    onMouseEnter={() => setHoveredAttachment(att.id)}
                                    onMouseLeave={() => setHoveredAttachment(null)}
                                    disabled={isSaving}
                                    className={`p-1 rounded hover:bg-muted/20 transition-colors ${
                                      isInDrive ? 'text-blue-400' : 'text-gray-400'
                                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={isSaving ? 'Sauvegarde en cours...' : (isInDrive ? 'Supprimer de Google Drive' : 'Sauvegarder dans Google Drive')}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      (() => {
                                        if (isInDrive) {
                                          // Fichier stocké : afficher Cloud, au hover afficher CloudOff
                                          return hoveredAttachment === att.id ? <CloudOff className="w-3 h-3" /> : <Cloud className="w-3 h-3" />;
                                        } else {
                                          // Fichier non stocké : afficher CloudOff, au hover afficher Cloud
                                          return hoveredAttachment === att.id ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />;
                                        }
                                      })()
                                    )}
                                  </button>
                                  {att.url ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Button clicked for attachment:', att.id, att.filename);
                                        handleDownloadAttachment(msg.id, att.id, att.filename);
                                      }}
                                      className="px-2 py-0.5 rounded border border-border hover:bg-muted/10 cursor-pointer inline-flex items-center gap-1"
                                      title={`Télécharger ${att.filename}`}
                                      disabled={downloadingAttachments.has(att.id)}
                                    >
                                      {downloadingAttachments.has(att.id) && (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      )}
                                      {att.filename}
                                    </button>
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
                </div>

                </div>
              ))}
              </div>

              {/* Pagination pour la vue liste */}
              {totalCount > PAGE_SIZE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      <MessageDetailsDialog
        message={selectedMessageDialog}
        projects={projects}
        onClose={handleCloseDialog}
        onSaveInDrive={handleSaveInDrive}
        attachmentStates={attachmentStates}
        savingAttachments={savingAttachments}
        onContactClick={setSelectedContactId}
        onAssignProject={handleAssignProject}
        onToggleHidden={handleToggleHidden}
        updatingProject={selectedMessageDialog ? updatingProjectForMessage.has(selectedMessageDialog.id) : false}
        threadId={currentThreadId}
        threadMessageCount={currentThreadId ? (threadMessages.length || threads.find(t => t.thread_id === currentThreadId)?.message_count || 1) : 1}
        threadMessages={threadMessages}
        isLoadingThreadMessages={isLoadingThreadMessages}
        currentMessageIndex={currentMessageIndex}
        onNavigateMessage={handleNavigateMessage}
      />

      <ContactDetailsModal
        contactId={selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MessagesPage;
