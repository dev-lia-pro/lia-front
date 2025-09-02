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
  longPressDelay?: number; // Customizable delay, default 500ms
}

export const useDragAndDrop = ({ onDrop, onDropVertical, longPressDelay = 500 }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DragData | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<{ column: string; index: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragActive, setIsDragActive] = useState(false); // Track if drag is actually active
  const [isLongPressing, setIsLongPressing] = useState(false); // Visual feedback state
  
  const draggedElementRef = useRef<HTMLElement | null>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragDataRef = useRef<DragData | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
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
    // Don't prevent default - allow scroll to start
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Store initial touch position to detect movement
    initialTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Calculate offset from touch point to element top-left
    const offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    setTouchOffset(offset);

    // Store drag data for later use
    const data: DragData = {
      id: task.id,
      status: task.status,
      priority: task.priority,
      position: task.position
    };
    pendingDragDataRef.current = data;
    draggedElementRef.current = element;

    // Start feedback timer (visual indication after 300ms)
    feedbackTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      // Add subtle visual feedback
      if (draggedElementRef.current) {
        draggedElementRef.current.style.transform = 'scale(0.98)';
        draggedElementRef.current.style.transition = 'transform 0.2s ease';
      }
    }, 300);

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      // Get current touch position (may have moved slightly)
      const currentTouch = e.touches[0];
      if (!currentTouch) return;
      
      // Activate drag after delay
      setIsDragActive(true);
      setDraggedItem(data);
      setIsLongPressing(false);
      
      // Recalculate position in case of slight movement
      const newRect = element.getBoundingClientRect();
      const newOffset = {
        x: currentTouch.clientX - newRect.left,
        y: currentTouch.clientY - newRect.top
      };
      setTouchOffset(newOffset);
      
      // Create a clone for visual feedback
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.zIndex = '9999';
      clone.style.pointerEvents = 'none';
      clone.style.opacity = '0.8';
      clone.style.transform = 'scale(1.05)';
      clone.style.transition = 'none';
      clone.style.left = `${currentTouch.clientX - newOffset.x}px`;
      clone.style.top = `${currentTouch.clientY - newOffset.y}px`;
      clone.style.width = `${newRect.width}px`;
      document.body.appendChild(clone);
      cloneRef.current = clone;

      // Hide original element
      element.style.opacity = '0.3';
      element.style.transform = '';
      element.style.transition = '';
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, longPressDelay);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    
    // If drag is not active yet, check for movement threshold
    if (!isDragActive) {
      if (initialTouchRef.current) {
        const deltaX = Math.abs(touch.clientX - initialTouchRef.current.x);
        const deltaY = Math.abs(touch.clientY - initialTouchRef.current.y);
        const moveThreshold = 10; // pixels
        
        // If moved too much, cancel the long press
        if (deltaX > moveThreshold || deltaY > moveThreshold) {
          // Cancel timers
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          if (feedbackTimerRef.current) {
            clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = null;
          }
          
          // Reset visual feedback
          if (draggedElementRef.current) {
            draggedElementRef.current.style.transform = '';
            draggedElementRef.current.style.transition = '';
          }
          
          setIsLongPressing(false);
          initialTouchRef.current = null;
          pendingDragDataRef.current = null;
          draggedElementRef.current = null;
        }
      }
      return; // Don't prevent default scrolling if drag not active
    }
    
    // Drag is active, proceed with drag logic
    if (!draggedItem || !cloneRef.current) return;
    
    e.preventDefault(); // Prevent scrolling only while actually dragging
    
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
    // Cancel timers
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    
    // Reset visual feedback
    if (draggedElementRef.current) {
      draggedElementRef.current.style.opacity = '';
      draggedElementRef.current.style.transform = '';
      draggedElementRef.current.style.transition = '';
      draggedElementRef.current = null;
    }
    
    // If drag wasn't activated, just cleanup and return
    if (!isDragActive) {
      setIsLongPressing(false);
      initialTouchRef.current = null;
      pendingDragDataRef.current = null;
      return;
    }
    
    // Drag was active, proceed with drop logic
    if (!draggedItem) {
      setIsDragActive(false);
      return;
    }

    const touch = e.changedTouches[0];
    
    // Clean up clone
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }

    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) {
      setDraggedItem(null);
      setDragOverStatus(null);
      setDropIndicatorIndex(null);
      setIsDragActive(false);
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

    // Reset all state
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
    setIsLongPressing(false);
    initialTouchRef.current = null;
    pendingDragDataRef.current = null;
  };

  // Handle touch cancel (e.g., when scrolling starts or call comes in)
  const handleTouchCancel = () => {
    // Clean up everything
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    
    if (draggedElementRef.current) {
      draggedElementRef.current.style.opacity = '';
      draggedElementRef.current.style.transform = '';
      draggedElementRef.current.style.transition = '';
      draggedElementRef.current = null;
    }
    
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
    setIsLongPressing(false);
    initialTouchRef.current = null;
    pendingDragDataRef.current = null;
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
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    }
  };
};