import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import { useUrlState } from '@/hooks/useUrlState';
import axios from '@/api/axios';
import { API_BASE_URL } from '@/config/env';
import { getIconByValue } from '@/config/icons';
import { Cloud, CloudOff, Download, Search, FolderOpen, HardDrive, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/config/pagination';
import { MessageDetailsDialog } from '@/components/MessageDetailsDialog';
import type { Message } from '@/hooks/useMessages';

interface Attachment {
  id: number;
  filename: string;
  content_type?: string;
  size_bytes: number;
  created_at: string;
  google_drive_backup: boolean;
  google_drive_file_id?: string | null;
  url?: string | null;
  message: {
    id: number;
    subject: string;
    sender: string;
    channel: string;
    received_at: string;
    tags: string[];
  };
  project?: {
    id: number;
    title: string;
    icon: string;
  } | null;
}

const DrivePage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('drive');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // URL-synced state
  const [searchTerm, setSearchTerm] = useUrlState<string>({ paramName: 'search', defaultValue: '', debounce: 500 });
  const [driveFilter, setDriveFilter] = useUrlState<'all' | 'in_drive' | 'not_in_drive'>({ paramName: 'drive_filter', defaultValue: 'all' });
  const [currentPage, setCurrentPage] = useUrlState<number>({ paramName: 'page', defaultValue: 1 });

  const [projectFilter, setProjectFilter] = useState<number | ''>('');
  const [hoveredAttachment, setHoveredAttachment] = useState<number | null>(null);
  const [attachmentStates, setAttachmentStates] = useState<Record<number, boolean>>({});
  const [selectedMessageDialog, setSelectedMessageDialog] = useState<Message | null>(null);
  const { selected } = useProjectStore();
  const { projects } = useProjects();
  const { toast } = useToast();

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Toujours filtrer par le projet courant
      if (selected.id) {
        params.append('project', selected.id.toString());
      }

      if (projectFilter) {
        params.append('project', projectFilter.toString());
      }

      if (driveFilter === 'in_drive') {
        params.append('in_drive', 'true');
      } else if (driveFilter === 'not_in_drive') {
        params.append('in_drive', 'false');
      }

      // Ajouter la pagination
      params.append('page', currentPage.toString());
      params.append('page_size', PAGE_SIZE.toString());

      const response = await axios.get(`/attachments/?${params.toString()}`);
      const fetchedAttachments = response.data.results || response.data || [];
      setAttachments(fetchedAttachments);
      setTotalCount(response.data.count || 0);

      // Initialiser l'état des attachments
      const newAttachmentStates: Record<number, boolean> = {};
      fetchedAttachments.forEach((att: Attachment) => {
        newAttachmentStates[att.id] = att.google_drive_backup || false;
      });
      setAttachmentStates(newAttachmentStates);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces jointes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les pièces jointes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [searchTerm, projectFilter, driveFilter, selected.id, currentPage]);

  // Réinitialiser la page à 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, projectFilter, driveFilter, selected.id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const decodeHtmlEntities = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  const handleOpenFile = async (attachment: Attachment) => {
    if (attachment.url) {
      try {
        // Construire l'URL relative pour le téléchargement (avec slash final requis par Django)
        const url = `/messages/${attachment.message.id}/attachments/${attachment.id}/download/`;

        // Télécharger le fichier avec axios (inclut l'authentification automatiquement)
        const response = await axios.get(url, {
          responseType: 'blob', // Important pour télécharger les fichiers binaires
        });

        // Créer un blob URL à partir de la réponse
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const blobUrl = window.URL.createObjectURL(blob);

        // Ouvrir dans un nouvel onglet
        window.open(blobUrl, '_blank');

        // Nettoyer l'URL blob après un délai
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors de l\'ouverture du fichier:', error);
        toast({
          title: "Erreur d'ouverture",
          description: "Impossible d'ouvrir le fichier",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Fichier indisponible",
        description: "Ce fichier n'est pas accessible",
        variant: "destructive",
      });
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
        // Rafraîchir la liste des attachments pour synchroniser avec le backend
        fetchAttachments();
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

  const handleOpenMessageDialog = async (messageId: number) => {
    try {
      const response = await axios.get(`/messages/${messageId}/`);
      setSelectedMessageDialog(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le message",
        variant: "destructive",
      });
    }
  };

  const handleAssignProject = async (messageId: number, projectId: number | '') => {
    const newProjectId = projectId === '' ? null : projectId;

    if (selectedMessageDialog?.id === messageId) {
      setSelectedMessageDialog(prev => prev ? { ...prev, project: newProjectId } : null);
    }

    try {
      await axios.patch(`/messages/${messageId}/`, { project: newProjectId });
      fetchAttachments();
    } catch (e) {
      fetchAttachments();
      toast({
        title: "Erreur",
        description: "Impossible de modifier le projet",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6">
          {/* En-tête */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Google Drive</h3>
          </div>

          {/* Filtres */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom de fichier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground placeholder-foreground/50"
                  />
                </div>
              </div>

              {/* Filtre par statut Drive */}
              <div className="min-w-[200px]">
                <Select
                  value={driveFilter}
                  onValueChange={(value) => setDriveFilter(value as 'all' | 'in_drive' | 'not_in_drive')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tous les fichiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les fichiers</SelectItem>
                    <SelectItem value="in_drive">Dans Google Drive</SelectItem>
                    <SelectItem value="not_in_drive">Pas dans Google Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Total fichiers</p>
                  <p className="text-2xl font-bold text-foreground">{attachments.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <FolderOpen className="w-6 h-6 text-foreground/70" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Dans Google Drive</p>
                  <p className="text-2xl font-bold text-foreground">
                    {attachments.filter(a => a.google_drive_backup).length}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Cloud className="w-6 h-6 text-foreground/70" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Taille dans Drive</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatFileSize(attachments.filter(a => a.google_drive_backup).reduce((sum, a) => sum + a.size_bytes, 0))}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <HardDrive className="w-6 h-6 text-foreground/70" />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des fichiers */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
              <p className="text-foreground/70">Chargement des fichiers...</p>
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
                <Cloud className="w-8 h-8 text-foreground/50" />
              </div>
              <p className="text-foreground/70 mb-2">Aucun fichier trouvé</p>
              <p className="text-sm text-foreground/50">
                {searchTerm || projectFilter || driveFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Vos pièces jointes apparaîtront ici'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="bg-card border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                >
                  <button
                    onClick={() => handleOpenMessageDialog(attachment.message.id)}
                    className="w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* En-tête du fichier */}
                        <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                          <span className="px-2 py-0.5 rounded bg-muted/10 border border-border">
                            {attachment.message.channel}
                          </span>
                          {attachment.project && (() => {
                            const IconComponent = getIconByValue(attachment.project.icon);
                            return (
                              <span className="px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1">
                                {IconComponent && <IconComponent className="w-4 h-4" />}
                                <span className="truncate max-w-[120px]">
                                  {attachment.project.title}
                                </span>
                              </span>
                            );
                          })()}
                          <span className="ml-auto">{new Date(attachment.created_at).toLocaleString()}</span>
                        </div>

                        {/* Nom du fichier */}
                        <div className="font-medium truncate text-foreground mb-2">
                          {decodeHtmlEntities(attachment.filename)}
                        </div>

                        {/* Métadonnées avec actions */}
                        <div className="flex items-center gap-3 text-sm text-foreground/60" onClick={(e) => e.stopPropagation()}>
                          <span>{formatFileSize(attachment.size_bytes)}</span>
                          {attachment.content_type && (
                            <span>{attachment.content_type}</span>
                          )}
                          <div className="flex gap-1 ml-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(attachment);
                              }}
                              className="p-2 rounded hover:bg-muted/20 transition-colors"
                              title="Ouvrir le fichier"
                            >
                              <Download className="w-4 h-4 text-foreground/70" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveInDrive(attachment.id, attachment.message.id, attachmentStates[attachment.id] ?? false);
                              }}
                              onMouseEnter={() => setHoveredAttachment(attachment.id)}
                              onMouseLeave={() => setHoveredAttachment(null)}
                              className="p-2 rounded hover:bg-muted/20 transition-colors"
                              title={(attachmentStates[attachment.id] ?? false) ? 'Supprimer de Google Drive' : 'Sauvegarder dans Google Drive'}
                            >
                              {(() => {
                                const isInDrive = attachmentStates[attachment.id] ?? false;
                                if (isInDrive) {
                                  // Fichier stocké : afficher Cloud, au hover afficher CloudOff
                                  return hoveredAttachment === attachment.id ? <CloudOff className="w-4 h-4" /> : <Cloud className="w-4 h-4" />;
                                } else {
                                  // Fichier non stocké : afficher CloudOff, au hover afficher Cloud
                                  return hoveredAttachment === attachment.id ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />;
                                }
                              })()}
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        {attachment.message.tags && attachment.message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {attachment.message.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted/10 border border-border">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalCount > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      <MessageDetailsDialog
        message={selectedMessageDialog}
        projects={projects}
        onClose={() => setSelectedMessageDialog(null)}
        onSaveInDrive={handleSaveInDrive}
        attachmentStates={attachmentStates}
        onContactClick={() => {}}
        onAssignProject={handleAssignProject}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default DrivePage;
