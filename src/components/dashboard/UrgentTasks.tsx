import React from 'react';
import { AlertTriangle } from 'lucide-react';

const urgentTasks = [
  { id: 1, title: 'Finaliser contrat' },
  { id: 2, title: 'Appel client' },
  { id: 3, title: 'Signer devis' }
];

export const UrgentTasks = () => {
  const handleTaskClick = (task: typeof urgentTasks[0]) => {
    // Mock behavior - show detailed view
    console.log('Opening task:', task.title);
  };

  return (
    <section className="animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Tâches urgentes
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {urgentTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="flex-shrink-0 w-40 p-4 bg-navy-card border border-gold rounded-xl shadow-soft hover:shadow-glow transition-smooth animate-press"
          >
            <h4 className="text-sm font-medium text-foreground mb-3 line-clamp-2">
              {task.title}
            </h4>
            <AlertTriangle className="w-4 h-4 text-gold mx-auto" />
          </button>
        ))}
      </div>
    </section>
  );
};