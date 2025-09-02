import { useState, useRef, useCallback, useEffect } from 'react';
import { Task } from '@/hooks/useTasks';
import { DragData, UseDragAndDropProps, DropIndicator, DragHandlers } from './types';
import { DRAG_CONFIG, DRAG_STYLES } from './constants';
import { 
  findTaskIndex, 
  findDropPosition, 
  shouldShowDropIndicator,
  createDragImage,
  applyDragStyles
} from './utils';
import { useAutoScroll } from './useAutoScroll';
import { useTouchHandlers } from './useTouchHandlers';
import { useTouchPolyfill } from './useTouchPolyfill';

export const useDragAndDrop = ({ 
  onDrop, 
  onDropVertical, 
  longPressDelay = DRAG_CONFIG.LONG_PRESS_DELAY 
}: UseDragAndDropProps) => {
  // Wrapper for compatibility - internally we only use onDropVertical
  const handleDropAction = useCallback(async (data: DragData, targetPosition: number, targetStatus: Task['status']) => {
    await onDropVertical(data, targetPosition, targetStatus);
  }, [onDropVertical]);
  const [draggedItem, setDraggedItem] = useState<DragData | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<DropIndicator | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const draggedElementRef = useRef<HTMLElement | null>(null);
  const originalIndexRef = useRef<number>(-1);

  const { handleAutoScroll, stopAutoScroll } = useAutoScroll();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  // Mouse event handlers
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, task: Task) => {
    const data: DragData = {
      id: task.id,
      status: task.status,
      priority: task.priority,
      position: task.position
    };
    setDraggedItem(data);
    setIsDragActive(true);
    
    draggedElementRef.current = e.currentTarget as HTMLElement;
    // Store the original position within the status column
    const taskElement = e.currentTarget as HTMLElement;
    const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${task.status}"]`));
    originalIndexRef.current = columnTasks.indexOf(taskElement);
    
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = createDragImage(e.currentTarget as HTMLElement, e.currentTarget.offsetWidth / 2);
    e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  }, [dragOverStatus]);

  const handleDragOverVertical = useCallback((e: React.DragEvent<HTMLDivElement>, index: number, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're dragging over the dragged element itself by comparing task IDs
    const currentTarget = e.currentTarget as HTMLElement;
    const targetTaskId = currentTarget.getAttribute('data-task-id');
    const isDraggingOverSelf = draggedItem && targetTaskId && parseInt(targetTaskId) === draggedItem.id;
    
    if (isDraggingOverSelf) {
      // Don't show drop indicator when hovering over the dragged element itself
      setDropIndicatorIndex(null);
      return;
    }
    
    const targetIndex = findDropPosition(e.clientY, column);
    
    if (draggedItem) {
      const targetStatus = column as Task['status'];
      
      if (!shouldShowDropIndicator(draggedItem.status, targetStatus, originalIndexRef.current, targetIndex)) {
        setDropIndicatorIndex(null);
        return;
      }
    }
    
    if (!dropIndicatorIndex || dropIndicatorIndex.column !== column || dropIndicatorIndex.index !== targetIndex) {
      setDropIndicatorIndex({ column, index: targetIndex });
    }
  }, [draggedItem, dropIndicatorIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverStatus(null);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Prevent default to avoid unintended drop
    e.preventDefault();
    
    // Check if a valid drop occurred by checking if dropEffect is 'none'
    // If no valid drop target was found, just clean up without triggering any action
    const validDrop = e.dataTransfer.dropEffect !== 'none';
    
    if (draggedElementRef.current) {
      applyDragStyles(draggedElementRef.current, DRAG_STYLES.NORMAL);
      setTimeout(() => {
        if (draggedElementRef.current) {
          draggedElementRef.current.style.transition = '';
          draggedElementRef.current = null;
        }
      }, DRAG_CONFIG.TRANSITION_DURATION);
    }
    
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
    originalIndexRef.current = -1;
  }, []);

  // Unified drop handler that calculates the correct target position
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetStatus: Task['status'], targetPosition?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get drag data
    let data: DragData;
    const payload = e.dataTransfer.getData('application/json');
    
    if (payload) {
      data = JSON.parse(payload) as DragData;
    } else if (draggedItem) {
      data = draggedItem;
    } else {
      return;
    }
    
    // Determine target position
    let finalPosition: number;
    
    if (targetPosition !== undefined) {
      // Explicit position provided
      finalPosition = targetPosition;
    } else if (dropIndicatorIndex && dropIndicatorIndex.column === targetStatus) {
      // Use drop indicator position
      finalPosition = dropIndicatorIndex.index;
    } else {
      // No drop indicator was shown - check if column is empty
      const columnTasks = document.querySelectorAll(`[data-task-column="${targetStatus}"]`);
      if (columnTasks.length === 0) {
        // Column is empty, allow drop at position 0
        finalPosition = 0;
      } else {
        // Column is not empty and no separator was shown - cancel the drop
        setDropIndicatorIndex(null);
        setDragOverStatus(null);
        setDraggedItem(null);
        setIsDragActive(false);
        originalIndexRef.current = -1;
        return;
      }
    }
    
    // Adjust position if moving within same column
    if (data.status === targetStatus && originalIndexRef.current >= 0) {
      // Moving within same column - adjust for removal
      if (finalPosition > originalIndexRef.current) {
        finalPosition = Math.max(0, finalPosition - 1);
      }
      
      // Check if actually moving
      if (finalPosition === originalIndexRef.current) {
        // No movement needed
        setDropIndicatorIndex(null);
        setDragOverStatus(null);
        setDraggedItem(null);
        setIsDragActive(false);
        originalIndexRef.current = -1;
        return;
      }
    }
    
    // Clean up drag state
    setDropIndicatorIndex(null);
    setDragOverStatus(null);
    setDraggedItem(null);
    setIsDragActive(false);
    originalIndexRef.current = -1;
    
    // Execute the drop
    await handleDropAction(data, finalPosition, targetStatus);
  }, [draggedItem, dropIndicatorIndex, handleDropAction]);

  // Touch handlers  
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  } = useTouchHandlers({
    setDraggedItem,
    setDragOverStatus,
    setDropIndicatorIndex,
    setIsDragActive,
    onDrop: async (data: DragData, status: Task['status']) => {
      await handleDropAction(data, 0, status);
    },
    onDropVertical: handleDropAction,
    handleAutoScroll,
    stopAutoScroll,
    draggedItem,
    dropIndicatorIndex,
    longPressDelay
  });

  const handlers: DragHandlers = {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragOverVertical: handleDragOverVertical,
    onDragLeave: handleDragLeave,
    onDragEnd: handleDragEnd,
    onDrop: handleDrop,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };

  return {
    draggedItemId: draggedItem?.id || null,
    dragOverStatus,
    dropIndicatorIndex,
    handlers
  };
};

// Re-export types
export type { DragData, UseDragAndDropProps, DropIndicator, DragHandlers } from './types';