import { useState, useRef, useEffect, TouchEvent, DragEvent } from 'react';
import { Task } from '@/hooks/useTasks';

interface DragData {
  id: number;
  status: Task['status'];
  priority?: Task['priority'];
  position?: number;
}

interface UseDragAndDropProps {
  onDrop: (data: DragData, targetStatus: Task['status']) => Promise<void>;
  onDropVertical: (data: DragData, targetIndex: number, targetStatus: Task['status']) => Promise<void>;
}

export const useDragAndDrop = ({ onDrop, onDropVertical }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DragData | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<{ column: string; index: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedElementRef = useRef<HTMLElement | null>(null);
  const cloneRef = useRef<HTMLElement | null>(null);

  // Clean up clone on unmount or when drag ends
  useEffect(() => {
    return () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
    };
  }, []);

  // Mouse events handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, task: Task) => {
    const data: DragData = {
      id: task.id,
      status: task.status,
      priority: task.priority,
      position: task.position
    };
    setDraggedItem(data);
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  };

  const handleDragOverVertical = (e: DragEvent<HTMLDivElement>, index: number, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    const visualIndex = y < height / 2 ? index : index + 1;
    setDropIndicatorIndex({ column, index: visualIndex });
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropIndicatorIndex(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    
    const payload = e.dataTransfer.getData('application/json');
    if (!payload) return;
    
    const data = JSON.parse(payload) as DragData;
    await onDrop(data, targetStatus);
  };

  const handleDropVertical = async (e: DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dropIndicatorIndex) return;
    
    setDropIndicatorIndex(null);
    setDragOverStatus(null);
    
    const payload = e.dataTransfer.getData('application/json');
    if (!payload) return;
    
    const data = JSON.parse(payload) as DragData;
    await onDropVertical(data, dropIndicatorIndex.index, targetStatus);
  };

  // Touch events handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>, task: Task) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Calculate offset from touch point to element top-left
    setTouchOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });

    // Store drag data
    const data: DragData = {
      id: task.id,
      status: task.status,
      priority: task.priority,
      position: task.position
    };
    setDraggedItem(data);
    draggedElementRef.current = element;

    // Create a clone for visual feedback
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.8';
    clone.style.transform = 'scale(1.05)';
    clone.style.transition = 'none';
    clone.style.left = `${touch.clientX - touchOffset.x}px`;
    clone.style.top = `${touch.clientY - touchOffset.y}px`;
    clone.style.width = `${rect.width}px`;
    document.body.appendChild(clone);
    cloneRef.current = clone;

    // Hide original element
    element.style.opacity = '0.3';
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedItem || !cloneRef.current) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    
    // Update clone position
    cloneRef.current.style.left = `${touch.clientX - touchOffset.x}px`;
    cloneRef.current.style.top = `${touch.clientY - touchOffset.y}px`;

    // Find element under touch point
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) return;

    // Check if over a drop zone (column)
    const dropZone = elementBelow.closest('[data-drop-zone]');
    if (dropZone) {
      const status = dropZone.getAttribute('data-drop-zone') as Task['status'];
      if (dragOverStatus !== status) {
        setDragOverStatus(status);
      }
    }

    // Check if over a task card for vertical positioning
    const taskCard = elementBelow.closest('[data-task-index]');
    if (taskCard) {
      const index = parseInt(taskCard.getAttribute('data-task-index') || '0', 10);
      const column = taskCard.getAttribute('data-task-column') || '';
      const rect = taskCard.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const height = rect.height;
      
      const visualIndex = y < height / 2 ? index : index + 1;
      setDropIndicatorIndex({ column, index: visualIndex });
    }
  };

  const handleTouchEnd = async (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedItem) return;

    const touch = e.changedTouches[0];
    
    // Clean up clone
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }

    // Restore original element
    if (draggedElementRef.current) {
      draggedElementRef.current.style.opacity = '';
      draggedElementRef.current = null;
    }

    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) {
      setDraggedItem(null);
      setDragOverStatus(null);
      setDropIndicatorIndex(null);
      return;
    }

    const dropZone = elementBelow.closest('[data-drop-zone]');
    if (dropZone) {
      const targetStatus = dropZone.getAttribute('data-drop-zone') as Task['status'];
      
      if (dropIndicatorIndex) {
        // Vertical drop with specific position
        await onDropVertical(draggedItem, dropIndicatorIndex.index, targetStatus);
      } else {
        // Simple status change drop
        await onDrop(draggedItem, targetStatus);
      }
    }

    // Reset state
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
  };

  return {
    draggedItemId: draggedItem?.id || null,
    dragOverStatus,
    dropIndicatorIndex,
    handlers: {
      // Mouse events
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragOverVertical: handleDragOverVertical,
      onDragLeave: handleDragLeave,
      onDragEnd: handleDragEnd,
      onDrop: handleDrop,
      onDropVertical: handleDropVertical,
      // Touch events
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};