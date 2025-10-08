import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  X, User, Paperclip, Calendar, Tag, Mail, Phone, MessageSquare,
  AlertCircle, Clock, CheckCircle, Flag, Info, Edit,
  Download, Eye, Cloud, CloudOff, ChevronDown, ChevronUp,
  Building, Briefcase, ExternalLink, Code, Copy, Check
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getIconByValue } from '@/config/icons';
import { formatFileSize, formatMessageDate, getFileIcon, getActionBadgeColor, getChannelIcon } from '@/utils/format';
import type { Message } from '@/hooks/useMessages';
import type { Project } from '@/hooks/useProjects';

interface MessageDetailsDialogProps {
  message: Message | null;
  projects: Project[];
  onClose: () => void;
  onSaveInDrive: (attachmentId: number, messageId: number, isCurrentlyInDrive: boolean) => Promise<void>;
  attachmentStates: Record<number, boolean>;
  onContactClick: (contactId: number) => void;
  onAssignProject: (messageId: number, projectId: number | '') => Promise<void>;
}

interface ContactInfo {
  id: number;
  display_name: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string | null;
}

const ActionIcon: React.FC<{ action: string }> = ({ action }) => {
  switch (action) {
    case 'URGENT':
      return <AlertCircle className="w-3.5 h-3.5" />;
    case 'REPLY':
      return <Mail className="w-3.5 h-3.5" />;
    case 'SIGN':
      return <Edit className="w-3.5 h-3.5" />;
    case 'PLAN':
      return <Clock className="w-3.5 h-3.5" />;
    case 'INFO':
      return <Info className="w-3.5 h-3.5" />;
    default:
      return <CheckCircle className="w-3.5 h-3.5" />;
  }
};

const ChannelIcon: React.FC<{ channel: string }> = ({ channel }) => {
  switch (channel) {
    case 'EMAIL':
      return <Mail className="w-3.5 h-3.5" />;
    case 'SMS':
      return <Phone className="w-3.5 h-3.5" />;
    case 'WHATSAPP':
      return <MessageSquare className="w-3.5 h-3.5" />;
    default:
      return <Mail className="w-3.5 h-3.5" />;
  }
};

const ContactDisplay: React.FC<{
  contact?: ContactInfo | null;
  email?: string;
  onClick?: (id: number) => void;
}> = ({ contact, email, onClick }) => {
  if (!contact) {
    return <span className="text-foreground">{email || 'Inconnu'}</span>;
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  const displayEmail = email && email !== contact.display_name ? ` <${email}>` : '';

  return (
    <button
      onClick={() => onClick?.(contact.id)}
      className="inline-flex items-start gap-2 hover:text-primary transition-colors group text-left"
    >
      <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
      <div>
        <span className="font-medium">
          {fullName || contact.display_name}
          <span className="text-muted-foreground font-normal">{displayEmail}</span>
        </span>
        {(contact.company || contact.job_title) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            {contact.job_title && (
              <>
                <Briefcase className="w-3 h-3" />
                <span>{contact.job_title}</span>
              </>
            )}
            {contact.company && contact.job_title && <span>•</span>}
            {contact.company && (
              <>
                <Building className="w-3 h-3" />
                <span>{contact.company}</span>
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export const MessageDetailsDialog: React.FC<MessageDetailsDialogProps> = ({
  message,
  projects,
  onClose,
  onSaveInDrive,
  attachmentStates,
  onContactClick,
  onAssignProject
}) => {
  const [hoveredAttachment, setHoveredAttachment] = React.useState<number | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  if (!message) return null;

  const project = projects.find(p => p.id === message.project);
  const actionLabel = {
    'URGENT': 'Urgent',
    'REPLY': 'À répondre',
    'SIGN': 'À signer',
    'PLAN': 'À planifier',
    'INFO': 'Pour information',
    'NONE': ''
  }[message.action_expected] || '';

  // Extraire CC et BCC des headers si disponibles
  const ccRecipients = message.raw_headers?.['Cc'] || '';
  const bccRecipients = message.raw_headers?.['Bcc'] || '';

  return (
    <Dialog open={!!message} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[95vh] sm:h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold mb-2">
                {message.subject || '(Sans objet)'}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {message.action_expected !== 'NONE' && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(message.action_expected)}`}>
                    <ActionIcon action={message.action_expected} />
                    {actionLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground border border-border">
                  <ChannelIcon channel={message.channel} />
                  {message.channel}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground border border-border hover:bg-muted/20 transition-colors"
                    >
                      {project ? (
                        <>
                          {(() => {
                            const IconComponent = getIconByValue(project.icon || '');
                            return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                          })()}
                          <span>{project.title}</span>
                        </>
                      ) : (
                        <span>Aucun projet</span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-card border-border text-foreground">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssignProject(message.id, ''); }} className="cursor-pointer hover:bg-muted">
                      Aucun projet
                    </DropdownMenuItem>
                    {projects.map((p) => {
                      const IconComponent = getIconByValue(p.icon);
                      return (
                        <DropdownMenuItem key={p.id} onClick={(e) => { e.stopPropagation(); onAssignProject(message.id, p.id); }} className="cursor-pointer hover:bg-muted">
                          <span className="mr-2">{IconComponent ? <IconComponent className="w-4 h-4" /> : null}</span>
                          <span>{p.title || `Projet #${p.id}`}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {Array.isArray(message.tags) && message.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground border border-border">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <DialogClose className="rounded-sm opacity-70 hover:opacity-100 transition-opacity shrink-0">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Section des correspondants */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-muted/5 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2 sm:gap-y-2 sm:gap-x-4 text-sm">
              <span className="text-muted-foreground font-medium sm:text-right">De :</span>
              <div>
                <ContactDisplay
                  contact={message.sender_contact as ContactInfo | undefined}
                  email={message.sender}
                  onClick={onContactClick}
                />
              </div>

              {message.recipient_contacts && message.recipient_contacts.length > 0 && (
                <>
                  <span className="text-muted-foreground font-medium sm:text-right">À :</span>
                  <div className="space-y-1">
                    {(message.recipient_contacts as ContactInfo[]).slice(0, 3).map(contact => (
                      <div key={contact.id}>
                        <ContactDisplay
                          contact={contact}
                          email={message.recipients.find(r => r.includes(contact.display_name))}
                          onClick={onContactClick}
                        />
                      </div>
                    ))}
                    {message.recipient_contacts.length > 3 && (
                      <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        + {message.recipient_contacts.length - 3} autres destinataires...
                      </button>
                    )}
                    {message.recipients.length > message.recipient_contacts.length && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.recipients
                          .filter(r => !message.recipient_contacts?.some(c => r.includes(c.display_name)))
                          .map(email => (
                            <div key={email}>{email}</div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </>
              )}

              {ccRecipients && (
                <>
                  <span className="text-muted-foreground font-medium sm:text-right">Cc :</span>
                  <div className="text-muted-foreground">{ccRecipients}</div>
                </>
              )}

              <span className="text-muted-foreground font-medium sm:text-right">Date :</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatMessageDate(message.received_at)}</span>
              </div>
            </div>
          </div>

          {/* Corps du message */}
          <div className="px-3 sm:px-6 py-4 sm:py-6 min-h-[200px]">
            {message.channel === 'SMS' || message.channel === 'WHATSAPP' ? (
              <div className="bg-muted/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {message.channel === 'SMS' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{message.sender_contact?.display_name || message.sender}</p>
                    <p className="whitespace-pre-wrap">{message.body_text || '(Message vide)'}</p>
                  </div>
                </div>
              </div>
            ) : message.body_html ? (
              <div className="overflow-x-auto">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_table]:text-xs [&_pre]:overflow-x-auto [&_pre]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: message.body_html }}
                />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.body_text || '(Aucun contenu)'}
              </pre>
            )}
          </div>

          {/* Pièces jointes */}
          {message.attachments_count > 0 && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/5">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4" />
                <h3 className="font-medium">
                  Pièces jointes ({message.attachments_count})
                </h3>
              </div>
              <div className="space-y-2">
                {Array.isArray(message.attachments) && message.attachments.map((att) => {
                  const isInDrive = attachmentStates[att.id] ?? att.google_drive_backup ?? false;
                  const FileIcon = getFileIcon(att.content_type, att.filename);

                  return (
                    <div key={att.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border hover:bg-muted/10 transition-colors">
                      <FileIcon className="w-5 h-5 text-muted-foreground shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{att.filename}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(att.size_bytes)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {att.content_type?.includes('image') && att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Aperçu"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => onSaveInDrive(att.id, message.id, !!isInDrive)}
                          onMouseEnter={() => setHoveredAttachment(att.id)}
                          onMouseLeave={() => setHoveredAttachment(null)}
                          className={`p-1.5 rounded hover:bg-muted transition-colors ${
                            isInDrive ? 'text-blue-500' : 'text-muted-foreground'
                          }`}
                          title={isInDrive ? 'Supprimer de Google Drive' : 'Sauvegarder dans Google Drive'}
                        >
                          {(() => {
                            if (isInDrive) {
                              return hoveredAttachment === att.id ? <CloudOff className="w-4 h-4" /> : <Cloud className="w-4 h-4" />;
                            } else {
                              return hoveredAttachment === att.id ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />;
                            }
                          })()}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Détails techniques (accordéon) */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-t border-border">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>Détails techniques</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">ID externe :</span>
                    <div className="flex items-center gap-1 max-w-[200px] sm:max-w-[300px]">
                      <span className="font-mono truncate" title={message.external_id}>
                        {message.external_id}
                      </span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(message.external_id || '');
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors shrink-0"
                        title="Copier l'ID"
                      >
                        {copiedId ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  {message.ingestion_source && (
                    <div>
                      <span className="text-muted-foreground">Source :</span>
                      <span className="ml-2">{message.ingestion_source}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Synchronisé le :</span>
                    <span className="ml-2">{formatMessageDate(message.created_at)}</span>
                  </div>
                  {message.processed && (
                    <div>
                      <span className="text-muted-foreground">Traité :</span>
                      <span className="ml-2 text-green-500">✓ Oui</span>
                      {message.processed_at && (
                        <span className="ml-1 text-muted-foreground">
                          ({formatMessageDate(message.processed_at)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {message.raw_headers && Object.keys(message.raw_headers).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                      Headers bruts ({Object.keys(message.raw_headers).length} entrées)
                    </summary>
                    <pre className="mt-2 p-2 bg-muted/10 rounded text-xs font-mono overflow-x-auto">
                      {JSON.stringify(message.raw_headers, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};