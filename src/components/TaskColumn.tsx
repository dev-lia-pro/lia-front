import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import { Task } from '@/hooks/useTasks';
import { DragHandlers } from '@/hooks/useDragAndDrop';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  draggedItemId: number | null;
  dragOverStatus: Task['status'] | null;
  dropIndicatorIndex: { column: string; index: number } | null;
  onCreateClick: (status: Task['status']) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onTaskMarkDone?: (task: Task) => void;
  onAssignProject: (taskId: number, projectId: number | '') => void;
  handlers: DragHandlers;
  disableUrgentBackground?: boolean;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  status,
  tasks,
  draggedItemId,
  dragOverStatus,
  dropIndicatorIndex,
  onCreateClick,
  onTaskEdit,
  onTaskDelete,
  onTaskClick,
  onTaskMarkDone,
  onAssignProject,
  handlers,
  disableUrgentBackground = false
}) => {
  const isMobile = useIsMobile();
  const isHighlighted = dragOverStatus === status && tasks.length === 0;
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    handlers.onDragOver(e, status);
    
    if (tasks.length > 0) {
      const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${status}"]`));
      for (let i = 0; i < columnTasks.length; i++) {
        const taskElement = columnTasks[i] as HTMLElement;
        const rect = taskElement.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        if (e.clientY < midPoint) {
          handlers.onDragOverVertical(e, i, status);
          return;
        }
      }
      handlers.onDragOverVertical(e, columnTasks.length, status);
    }
  };

  return (
    <div
      className={`${isMobile ? 'w-[240px] flex-shrink-0 snap-center' : ''} p-3 bg-card/30 rounded-xl border ${
        isHighlighted ? 'border-primary' : 'border-border'
      } transition-smooth`}
      data-drop-zone={status}
      onDragOver={handleDragOver}
      onDragLeave={handlers.onDragLeave}
      onDrop={(e) => {
        // Always use the drop indicator position if available
        // This ensures the task is inserted where the yellow separator was shown
        handlers.onDrop(e, status);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-semibold">{title} ({tasks.length})</h4>
        <Button 
          size="icon" 
          onClick={() => onCreateClick(status)} 
          className="border border-primary bg-primary hover:bg-primary/90 text-primary-foreground w-9 h-9"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex flex-col min-h-[60px]">
        {tasks.length === 0 ? (
          <div className="p-6 sm:p-8 text-foreground/60 bg-card/50 rounded-xl border-2 border-dashed border-border/50 text-center flex flex-col items-center">
            <div className="mb-2 text-sm sm:text-xs font-medium">Aucune tâche</div>
            <div className="text-xs sm:text-[11px] text-foreground/40 mt-1">Glissez-en une ici</div>
          </div>
        ) : (
          <>
            {tasks.map((task, index) => {
              const isDragging = draggedItemId === task.id;
              const showDropZone = dropIndicatorIndex?.column === status && dropIndicatorIndex.index === index;
              
              return (
                <React.Fragment key={task.id}>
                  {showDropZone && !isDragging && (
                    <div className="relative h-4 mb-2">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" />
                    </div>
                  )}
                  <div 
                    draggable={!('ontouchstart' in window)}
                    data-task-id={task.id}
                    data-task-index={index}
                    data-task-column={status}
                    onDragStart={(e) => handlers.onDragStart(e, task)}
                    onDragOver={(e) => handlers.onDragOverVertical(e, index, status)}
                    onDragEnd={(e) => handlers.onDragEnd(e)}
                    onTouchStart={(e) => {
                      console.log('[TaskColumn] onTouchStart fired for task:', task.id);
                      handlers.onTouchStart(e, task);
                    }}
                    onTouchMove={(e) => {
                      console.log('[TaskColumn] onTouchMove fired');
                      handlers.onTouchMove(e);
                    }}
                    onTouchEnd={(e) => {
                      console.log('[TaskColumn] onTouchEnd fired');
                      handlers.onTouchEnd(e);
                    }}
                    onTouchCancel={(e) => {
                      console.log('[TaskColumn] onTouchCancel fired');
                      handlers.onTouchCancel(e);
                    }}
                    className={`${index < tasks.length - 1 ? 'mb-2' : ''} ${isDragging ? 'dragging-source' : ''}`}
                    style={{
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      onClick={onTaskClick}
                      onMarkDone={status !== 'DONE' ? onTaskMarkDone : undefined}
                      onAssignProject={onAssignProject}
                      disableUrgentBackground={disableUrgentBackground}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            {dropIndicatorIndex?.column === status && dropIndicatorIndex.index === tasks.length && (
              <div className="relative h-4 mt-2">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};