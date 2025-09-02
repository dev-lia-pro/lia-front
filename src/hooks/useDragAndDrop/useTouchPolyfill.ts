import { useEffect, useRef } from 'react';
import { Task } from '@/hooks/useTasks';

interface TouchPolyfillProps {
  onTouchStart: (element: HTMLElement, task: Task) => void;
  onTouchMove: (touch: Touch) => void;
  onTouchEnd: (touch: Touch) => void;
  enabled: boolean;
}

export const useTouchPolyfill = ({ 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd,
  enabled 
}: TouchPolyfillProps) => {
  const activeElementRef = useRef<HTMLElement | null>(null);
  const taskDataRef = useRef<Task | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('[TouchPolyfill] Installing touch event listeners');

    const handleDocumentTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const taskElement = target.closest('[data-task-id]') as HTMLElement;
      
      if (!taskElement) return;
      
      console.log('[TouchPolyfill] Touch start on task element');
      
      // Get task data from element attributes
      const taskId = parseInt(taskElement.getAttribute('data-task-id') || '0');
      const taskColumn = taskElement.getAttribute('data-task-column') || 'TODO';
      const taskIndex = parseInt(taskElement.getAttribute('data-task-index') || '0');
      
      // Create minimal task object
      const task: Task = {
        id: taskId,
        status: taskColumn as Task['status'],
        position: taskIndex,
        title: '',
        priority: 'MEDIUM',
        user: 0,
        created_at: '',
        updated_at: ''
      };
      
      activeElementRef.current = taskElement;
      taskDataRef.current = task;
      
      // Prevent default to stop scrolling
      e.preventDefault();
      
      onTouchStart(taskElement, task);
    };

    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (!activeElementRef.current) return;
      
      console.log('[TouchPolyfill] Touch move');
      e.preventDefault();
      
      if (e.touches.length > 0) {
        onTouchMove(e.touches[0]);
      }
    };

    const handleDocumentTouchEnd = (e: TouchEvent) => {
      if (!activeElementRef.current) return;
      
      console.log('[TouchPolyfill] Touch end');
      
      if (e.changedTouches.length > 0) {
        onTouchEnd(e.changedTouches[0]);
      }
      
      activeElementRef.current = null;
      taskDataRef.current = null;
    };

    // Add listeners with passive: false to allow preventDefault
    const options = { passive: false, capture: true };
    
    document.addEventListener('touchstart', handleDocumentTouchStart, options);
    document.addEventListener('touchmove', handleDocumentTouchMove, options);
    document.addEventListener('touchend', handleDocumentTouchEnd, options);
    document.addEventListener('touchcancel', handleDocumentTouchEnd, options);

    return () => {
      console.log('[TouchPolyfill] Removing touch event listeners');
      document.removeEventListener('touchstart', handleDocumentTouchStart, options);
      document.removeEventListener('touchmove', handleDocumentTouchMove, options);
      document.removeEventListener('touchend', handleDocumentTouchEnd, options);
      document.removeEventListener('touchcancel', handleDocumentTouchEnd, options);
    };
  }, [enabled, onTouchStart, onTouchMove, onTouchEnd]);
};