import React from 'react';
import { ModalActions } from './ModalActions';

export const ModalActionsDemo = () => {
  const handleCancel = () => {
    console.log('Annuler cliqué');
  };

  const handleSubmit = () => {
    console.log('Soumettre cliqué');
  };

  return (
    <div className="space-y-6 p-6 bg-navy-card rounded-lg">
      <h3 className="text-lg font-semibold text-foreground">Démonstration des boutons harmonisés</h3>
      
      {/* Boutons normaux */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Boutons normaux</h4>
        <ModalActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="Créer"
          isLoading={false}
          isSubmitDisabled={false}
          isEditMode={false}
        />
      </div>

      {/* Boutons désactivés */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Boutons désactivés</h4>
        <ModalActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="Créer"
          isLoading={false}
          isSubmitDisabled={true}
          isEditMode={false}
        />
      </div>

      {/* Boutons en cours de chargement */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Boutons en cours de chargement</h4>
        <ModalActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="Créer"
          isLoading={true}
          isSubmitDisabled={false}
          isEditMode={false}
        />
      </div>

      {/* Boutons en mode édition */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Boutons en mode édition</h4>
        <ModalActions
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          submitText="Modifier"
          isLoading={false}
          isSubmitDisabled={false}
          isEditMode={true}
        />
      </div>
    </div>
  );
};
