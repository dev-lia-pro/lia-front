import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TasksGridSkeletonProps {
  totalCount: number;
}

export const TasksGridSkeleton: React.FC<TasksGridSkeletonProps> = ({ totalCount }) => {
  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">Tâches ({totalCount})</h3>
        <Button size="sm" className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["À faire", "En cours", "Terminé"].map((title, index) => (
          <div key={index} className="p-4 bg-card/30 rounded-xl border border-border">
            <div className="h-5 w-24 bg-border rounded mb-4 animate-pulse" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-card rounded-xl border border-border animate-pulse mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-16 h-3 bg-border rounded" />
                  <div className="w-12 h-3 bg-border rounded" />
                </div>
                <div className="w-full h-4 bg-border rounded mb-2" />
                <div className="w-3/4 h-3 bg-border rounded mb-3" />
                <div className="w-20 h-3 bg-border rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};