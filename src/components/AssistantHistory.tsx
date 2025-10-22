import React, { useState } from 'react';
import { useAssistants } from '@/hooks';
import { AudioPlayer } from './AudioPlayer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination } from './Pagination';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PAGE_SIZE } from '@/config/pagination';

export const AssistantHistory: React.FC = () => {
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { assistants, totalCount, isLoading, error } = useAssistants({
    method: methodFilter === 'all' ? undefined : methodFilter,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // Réinitialiser la page à 1 quand le filtre change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [methodFilter]);

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'audio_user_request': 'Demande vocale',
      'user_request': 'Demande texte',
      'message': 'Analyse de message',
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-foreground">Chargement de l'historique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Erreur lors du chargement de l'historique</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et filtre */}
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Historique de l'assistant ({totalCount})
        </CardTitle>
        
        <Select
          value={methodFilter}
          onValueChange={setMethodFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les méthodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les méthodes</SelectItem>
            <SelectItem value="audio_user_request">Demande vocale</SelectItem>
            <SelectItem value="user_request">Demande texte</SelectItem>
            <SelectItem value="message">Analyse de message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Résultats */}
      {assistants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-foreground/70">
            Aucun appel trouvé avec le filtre actuel
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assistants.map((assistant) => (
            <Card key={assistant.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* En-tête */}
                    <div className="flex items-center gap-3">
                      <Badge variant={assistant.error ? "destructive" : "default"}>
                        {getMethodLabel(assistant.method)}
                      </Badge>
                      <span className="text-sm text-foreground">
                        {format(new Date(assistant.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                      {assistant.error && (
                        <Badge variant="destructive">Erreur</Badge>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="space-y-2">
                      {assistant.input?.user_request && (
                        <div>
                          <span className="text-sm font-medium text-foreground">Demande :</span>
                          <p className="text-sm text-foreground mt-1">{assistant.input.user_request}</p>
                        </div>
                      )}
                      
                      {assistant.input?.message_id && (
                        <div>
                          <span className="text-sm font-medium text-foreground">Message ID :</span>
                          <p className="text-sm text-foreground mt-1">{assistant.input.message_id}</p>
                        </div>
                      )}

                      {assistant.output?.message && (
                        <div>
                          <span className="text-sm font-medium text-foreground">Réponse :</span>
                          <p className="text-sm text-foreground mt-1">{assistant.output.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Boutons audio */}
                    <div className="flex gap-4 pt-2">
                      <AudioPlayer
                        audioUrl={assistant.audio_input}
                        label="Audio d'entrée"
                      />
                      <AudioPlayer
                        audioUrl={assistant.audio_output}
                        label="Audio de sortie"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / PAGE_SIZE)}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
