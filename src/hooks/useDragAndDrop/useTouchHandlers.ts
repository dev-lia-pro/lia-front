import { useState, useRef, useCallback } from 'react';
import { Task } from '@/hooks/useTasks';
import { DragData, TouchOffset, TouchPosition } from './types';
import { DRAG_CONFIG, DRAG_STYLES } from './constants';
import { 
  findTaskIndex, 
  findDropPosition, 
  shouldShowDropIndicator,
  vibrate,
  applyDragStyles,
  enableSnapScrolling
} from './utils';

interface UseTouchHandlersProps {
  setDraggedItem: (item: DragData | null) => void;
  setDragOverStatus: (status: Task['status'] | null) => void;
  setDropIndicatorIndex: (index: { column: string; index: number } | null) => void;
  setIsDragActive: (active: boolean) => void;
  onDrop: (data: DragData, targetStatus: Task['status']) => Promise<void>;
  onDropVertical: (data: DragData, targetIndex: number, targetStatus: Task['status']) => Promise<void>;
  handleAutoScroll: (clientX: number, clientY: number) => void;
  stopAutoScroll: () => void;
  draggedItem: DragData | null;
  dropIndicatorIndex: { column: string; index: number } | null;
  longPressDelay?: number;
}

export const useTouchHandlers = ({
  setDraggedItem,
  setDragOverStatus,
  setDropIndicatorIndex,
  setIsDragActive,
  onDrop,
  onDropVertical,
  handleAutoScroll,
  stopAutoScroll,
  draggedItem,
  dropIndicatorIndex,
  longPressDelay = DRAG_CONFIG.LONG_PRESS_DELAY
}: UseTouchHandlersProps) => {
  const [touchOffset, setTouchOffset] = useState<TouchOffset>({ x: 0, y: 0 });
  
  const draggedElementRef = useRef<HTMLElement | null>(null);
  const originalIndexRef = useRef<number>(-1);
  const cloneRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTouchRef = useRef<TouchPosition | null>(null);
  const hasMoved = useRef<boolean>(false);

  const cleanupTouch = useCallback(() => {
    // Clear timers
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Remove clone
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    
    // Stop auto scroll
    stopAutoScroll();
    enableSnapScrolling();
    
    // Remove drag active class from body
    document.body.classList.remove('drag-active');
    
    // Reset dragged element styles
    if (draggedElementRef.current) {
      draggedElementRef.current.classList.remove('dragging-source');
      draggedElementRef.current.style.opacity = '';
      draggedElementRef.current.style.filter = '';
      draggedElementRef.current.style.transform = '';
      draggedElementRef.current.style.transition = '';
      draggedElementRef.current = null;
    }
    
    // Reset refs
    initialTouchRef.current = null;
    originalIndexRef.current = -1;
    hasMoved.current = false;
  }, [stopAutoScroll]);

  const createClone = useCallback((element: HTMLElement, touch: Touch, offset: TouchOffset) => {
    const rect = element.getBoundingClientRect();
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove IDs to avoid duplicates
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    
    // Apply clone styles
    Object.assign(clone.style, {
      ...DRAG_STYLES.CLONE,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: `translate(${touch.clientX - offset.x}px, ${touch.clientY - offset.y}px) scale(1.05)`
    });
    
    clone.classList.add('drag-clone');
    document.body.appendChild(clone);
    return clone;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, task: Task) => {
    console.log('[handleTouchStart] Called for task:', task.id);
    e.persist();
    
    // Prevent default to avoid scrolling
    e.preventDefault();
    
    // Check if dragging is disabled on this element
    const touchedElement = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    if (touchedElement?.closest('[data-no-drag="true"]')) {
      console.log('[handleTouchStart] Drag disabled on element');
      return;
    }
    
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Store initial touch position
    initialTouchRef.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;
    
    // Calculate offset
    const offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    setTouchOffset(offset);
    
    // Store element reference
    draggedElementRef.current = element;
    
    // Find original index
    originalIndexRef.current = findTaskIndex(element, task.status);
    
    // Prepare drag data
    const data: DragData = {
      id: task.id,
      status: task.status,
      priority: task.priority,
      position: task.position
    };
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      console.log('[Touch] Long press triggered');
      if (!draggedElementRef.current || !initialTouchRef.current) {
        console.log('[Touch] Missing element or touch ref');
        return;
      }
      
      // Activate drag
      setIsDragActive(true);
      setDraggedItem(data);
      document.body.classList.add('drag-active');
      console.log('[Touch] Drag activated for task:', data.id);
      
      // Recalculate offset for accuracy
      const rect = draggedElementRef.current.getBoundingClientRect();
      const currentOffset = {
        x: initialTouchRef.current.x - rect.left,
        y: initialTouchRef.current.y - rect.top
      };
      setTouchOffset(currentOffset); // Update the state offset too
      console.log('[Touch] Offset:', currentOffset);
      
      // Create clone
      const fakeTouch = { 
        clientX: initialTouchRef.current.x, 
        clientY: initialTouchRef.current.y 
      } as Touch;
      cloneRef.current = createClone(draggedElementRef.current, fakeTouch, currentOffset);
      console.log('[Touch] Clone created');
      
      // Apply blur to original element - use a class instead of inline styles
      if (draggedElementRef.current) {
        draggedElementRef.current.classList.add('dragging-source');
        // Also set inline styles as backup
        draggedElementRef.current.style.cssText += 'opacity: 0.4 !important; filter: blur(1px) !important; transform: scale(0.98) !important;';
        console.log('[Touch] Blur styles applied');
      }
      
      // Haptic feedback
      vibrate(DRAG_CONFIG.VIBRATION_DURATION.START);
    }, longPressDelay);
    
  }, [createClone, longPressDelay, setDraggedItem, setIsDragActive]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    
    // Check if dragging is active
    if (!draggedItem) {
      // Not dragging yet - check if moved too much (cancel long press)
      if (initialTouchRef.current) {
        const deltaX = Math.abs(touch.clientX - initialTouchRef.current.x);
        const deltaY = Math.abs(touch.clientY - initialTouchRef.current.y);
        
        if (deltaX > DRAG_CONFIG.MOVE_THRESHOLD || deltaY > DRAG_CONFIG.MOVE_THRESHOLD) {
          // Moved too much - cancel long press
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          cleanupTouch();
        }
      }
      return;
    }
    
    // We are dragging
    e.preventDefault();
    hasMoved.current = true;
    
    // Update clone position
    if (cloneRef.current) {
      cloneRef.current.style.transform = 
        `translate(${touch.clientX - touchOffset.x}px, ${touch.clientY - touchOffset.y}px) scale(1.05)`;
    }
    
    // Handle auto scroll
    console.log('[TouchMove] Calling handleAutoScroll with:', touch.clientX, touch.clientY);
    handleAutoScroll(touch.clientX, touch.clientY);
    
    // Find element below
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) return;
    
    // Check if over a drop zone
    const dropZone = elementBelow.closest('[data-drop-zone]');
    if (dropZone) {
      const status = dropZone.getAttribute('data-drop-zone') as Task['status'];
      setDragOverStatus(status);
      
      // Calculate drop position
      const targetIndex = findDropPosition(touch.clientY, status);
      
      // Update drop indicator
      if (shouldShowDropIndicator(draggedItem.status, status, originalIndexRef.current, targetIndex)) {
        setDropIndicatorIndex({ column: status, index: targetIndex });
      } else {
        setDropIndicatorIndex(null);
      }
    } else {
      setDragOverStatus(null);
      setDropIndicatorIndex(null);
    }
    
  }, [draggedItem, touchOffset, handleAutoScroll, setDragOverStatus, setDropIndicatorIndex, cleanupTouch]);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent<HTMLDivElement>) => {
    console.log('[TouchEnd] Called, draggedItem:', draggedItem);
    
    // Clear long press timer if still running
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Check if we were dragging
    if (!draggedItem) {
      console.log('[TouchEnd] No dragged item, cleaning up');
      cleanupTouch();
      return;
    }
    
    // Get final touch position
    if (!e.changedTouches || e.changedTouches.length === 0) {
      console.log('[TouchEnd] No touches found');
      cleanupTouch();
      return;
    }
    
    const touch = e.changedTouches[0];
    console.log('[TouchEnd] Touch position:', touch.clientX, touch.clientY);
    
    // Hide clone temporarily to get element below
    if (cloneRef.current) {
      cloneRef.current.style.display = 'none';
    }
    
    // Find element at drop position
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    console.log('[TouchEnd] Element below:', elementBelow);
    
    // Show clone again
    if (cloneRef.current) {
      cloneRef.current.style.display = '';
    }
    
    if (!elementBelow) {
      console.log('[TouchEnd] No element below');
      cleanupTouch();
      return;
    }
    
    // Check if dropped in a valid zone
    const dropZone = elementBelow.closest('[data-drop-zone]');
    console.log('[TouchEnd] Drop zone:', dropZone);
    
    if (dropZone) {
      const targetStatus = dropZone.getAttribute('data-drop-zone') as Task['status'];
      console.log('[TouchEnd] Target status:', targetStatus);
      
      // Haptic feedback
      vibrate(DRAG_CONFIG.VIBRATION_DURATION.DROP);
      
      // Calculate target position
      let targetPosition: number;
      
      // Always use drop indicator if available for the current column
      if (dropIndicatorIndex && dropIndicatorIndex.column === targetStatus) {
        // Use drop indicator position
        targetPosition = dropIndicatorIndex.index;
        console.log('[TouchEnd] Using drop indicator position:', targetPosition);
      } else {
        // No drop indicator was shown - check if column is empty
        const columnTasks = document.querySelectorAll(`[data-task-column="${targetStatus}"]`);
        if (columnTasks.length === 0) {
          // Column is empty, allow drop at position 0
          targetPosition = 0;
          console.log('[TouchEnd] Column is empty, dropping at position 0');
        } else {
          // Column is not empty and no separator was shown - cancel the drop
          console.log('[TouchEnd] No drop indicator and column not empty, cancelling drop');
          setDraggedItem(null);
          setDragOverStatus(null);
          setDropIndicatorIndex(null);
          setIsDragActive(false);
          cleanupTouch();
          return;
        }
      }
      
      // Adjust for same column movement
      if (draggedItem.status === targetStatus && originalIndexRef.current >= 0) {
        console.log('[TouchEnd] Same column move, original:', originalIndexRef.current, 'target:', targetPosition);
        if (targetPosition > originalIndexRef.current) {
          targetPosition = Math.max(0, targetPosition - 1);
          console.log('[TouchEnd] Adjusted target position:', targetPosition);
        }
        
        // Check if actually moving
        if (targetPosition === originalIndexRef.current) {
          console.log('[TouchEnd] No actual movement');
          cleanupTouch();
          return;
        }
      }
      
      console.log('[TouchEnd] Executing drop - position:', targetPosition, 'status:', targetStatus);
      // Execute drop
      await onDropVertical(draggedItem, targetPosition, targetStatus);
      console.log('[TouchEnd] Drop executed');
    } else {
      console.log('[TouchEnd] No valid drop zone');
    }
    
    // Clean up
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
    cleanupTouch();
    
  }, [draggedItem, dropIndicatorIndex, onDropVertical, setDraggedItem, setDragOverStatus, setDropIndicatorIndex, setIsDragActive, cleanupTouch]);

  const handleTouchCancel = useCallback(() => {
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
    cleanupTouch();
  }, [setDraggedItem, setDragOverStatus, setDropIndicatorIndex, setIsDragActive, cleanupTouch]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    cleanupTouch
  };
};