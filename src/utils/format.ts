import { FileText, FileImage, FileSpreadsheet, FileArchive, File, Film, Music, Code, FileJson } from 'lucide-react';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return date.toLocaleDateString('fr-FR', options)
    .replace(',', ' à')
    .replace(/^\w/, c => c.toUpperCase());
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}

export function getFileIcon(contentType?: string, filename?: string) {
  if (!contentType && filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'doc':
      case 'docx':
        contentType = 'application/msword';
        break;
      case 'xls':
      case 'xlsx':
        contentType = 'application/vnd.ms-excel';
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        contentType = 'image/';
        break;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        contentType = 'application/zip';
        break;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        contentType = 'video/';
        break;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
        contentType = 'audio/';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'c':
      case 'cpp':
      case 'html':
      case 'css':
        contentType = 'text/plain';
        break;
    }
  }

  if (!contentType) return File;

  if (contentType.includes('pdf')) return FileText;
  if (contentType.includes('image')) return FileImage;
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return FileSpreadsheet;
  if (contentType.includes('word') || contentType.includes('document')) return FileText;
  if (contentType.includes('zip') || contentType.includes('archive') || contentType.includes('compressed')) return FileArchive;
  if (contentType.includes('video')) return Film;
  if (contentType.includes('audio')) return Music;
  if (contentType.includes('json')) return FileJson;
  if (contentType.includes('text/plain') || contentType.includes('javascript') || contentType.includes('typescript')) return Code;

  return File;
}

export function getActionBadgeColor(action: string): string {
  switch (action) {
    case 'URGENT':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'REPLY':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'SIGN':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'PLAN':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'INFO':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    default:
      return 'bg-muted/10 text-muted-foreground border-border';
  }
}

export function getChannelIcon(channel: string): string {
  switch (channel) {
    case 'EMAIL':
      return '✉️';
    case 'SMS':
      return '💬';
    case 'WHATSAPP':
      return '📱';
    default:
      return '📨';
  }
}