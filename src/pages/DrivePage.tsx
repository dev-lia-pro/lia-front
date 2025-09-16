import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import type { NavigationTab } from '@/types/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/stores/projectStore';
import axios from '@/api/axios';
import { getIconByValue } from '@/config/icons';
import { Cloud, CloudOff, Download, Search, FolderOpen, HardDrive, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | ''>('');
  const [driveFilter, setDriveFilter] = useState<'all' | 'in_drive' | 'not_in_drive'>('all');
  const [hoveredAttachment, setHoveredAttachment] = useState<number | null>(null);
  const [attachmentStates, setAttachmentStates] = useState<Record<number, boolean>>({});
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
      
      const response = await axios.get(`/attachments/?${params.toString()}`);
      const fetchedAttachments = response.data.results || response.data || [];
      setAttachments(fetchedAttachments);
      
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
  }, [searchTerm, projectFilter, driveFilter, selected.id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOpenFile = (attachment: Attachment) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
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



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-6">
          {/* En-tête */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Google Drive</h1>
            <p className="text-foreground/70">Gérez vos fichiers stockés dans Google Drive</p>
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
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Dans Google Drive</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {attachments.filter(a => a.google_drive_backup).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Cloud className="w-6 h-6 text-blue-400" />
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
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <HardDrive className="w-6 h-6 text-green-400" />
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* En-tête du fichier */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted/10 border border-border">
                          {attachment.message.channel}
                        </span>
                        {attachment.project && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted/10 border border-border flex items-center gap-1">
                            <span>{getIconByValue(attachment.project.icon)}</span>
                            <span className="truncate max-w-[120px]">
                              {attachment.project.title}
                            </span>
                          </span>
                        )}
                        <span className="text-xs text-foreground/50 ml-auto">
                          {new Date(attachment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {/* Nom du fichier et informations */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => handleOpenFile(attachment)}
                          className="text-left flex-1 min-w-0"
                        >
                          <div className="font-medium truncate text-foreground hover:text-blue-400 transition-colors">
                            {attachment.filename}
                          </div>
                        </button>
                        
                        {/* Statut Google Drive */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveInDrive(attachment.id, attachment.message.id, attachmentStates[attachment.id] ?? false)}
                            onMouseEnter={() => setHoveredAttachment(attachment.id)}
                            onMouseLeave={() => setHoveredAttachment(null)}
                            className={`p-1 rounded hover:bg-muted/20 transition-colors ${
                              (attachmentStates[attachment.id] ?? false) ? 'text-blue-400' : 'text-gray-400'
                            }`}
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

                      {/* Métadonnées */}
                      <div className="flex items-center gap-4 text-xs text-foreground/60">
                        <span>{formatFileSize(attachment.size_bytes)}</span>
                        {attachment.content_type && (
                          <span>{attachment.content_type}</span>
                        )}
                        <span>De: {attachment.message.sender}</span>
                        {attachment.message.subject && (
                          <span className="truncate max-w-[200px]">
                            Objet: {attachment.message.subject}
                          </span>
                        )}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenFile(attachment)}
                        className="p-2 rounded hover:bg-muted/20 transition-colors"
                        title="Ouvrir le fichier"
                      >
                        <Download className="w-4 h-4 text-foreground/70" />
                      </button>
                    </div>
                  </div>
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

export default DrivePage;
