import { useState, useRef, useEffect, useCallback, TouchEvent, DragEvent } from 'react';
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
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTouchXRef = useRef<number>(0);
  const currentTouchYRef = useRef<number>(0);

  // Auto-scroll function for mobile drag - horizontal and vertical
  const handleAutoScroll = useCallback((clientX: number, clientY: number) => {
    // Store current touch position
    currentTouchXRef.current = clientX;
    currentTouchYRef.current = clientY;
    
    // Configuration
    const scrollZoneSize = 60;
    const baseScrollSpeed = 5;
    const scrollZoneSizeVertical = 50; // Reduced from 80 to 50 - only trigger near edges
    const baseVerticalScrollSpeed = 6; // Reduced from 8 to 6 for better control
    
    // Clear existing interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // Setup scroll interval
    autoScrollIntervalRef.current = setInterval(() => {
      const currentX = currentTouchXRef.current;
      const currentY = currentTouchYRef.current;
      let scrollingHorizontally = false;
      let scrollingVertically = false;
      
      // Mobile only for horizontal scroll
      const isMobile = window.innerWidth < 768;
      
      // Find the element at current position
      const elementAtPoint = document.elementFromPoint(currentX, currentY);
      
      // Horizontal scrolling (mobile only)
      if (isMobile && elementAtPoint) {
        // Find the horizontal scrollable container (urgent tasks or main grid)
        const urgentSection = elementAtPoint.closest('section')?.querySelector('.overflow-x-auto');
        const isInUrgentSection = urgentSection && urgentSection.contains(elementAtPoint);
        
        let horizontalScrollContainer = null;
        if (isInUrgentSection) {
          horizontalScrollContainer = urgentSection;
        } else {
          // We're in the main grid - find the TasksGrid container
          const gridSection = document.querySelector('section:last-of-type');
          if (gridSection) {
            horizontalScrollContainer = gridSection.querySelector('.flex.overflow-x-auto') || 
                                       gridSection.querySelector('[class*="overflow-x-auto"]');
          }
        }
        
        if (horizontalScrollContainer) {
          const rect = horizontalScrollContainer.getBoundingClientRect();
          const nearLeftEdge = currentX - rect.left < scrollZoneSize;
          const nearRightEdge = rect.right - currentX < scrollZoneSize;
          
          // Disable snap scrolling during drag
          if (!horizontalScrollContainer.classList.contains('drag-scrolling')) {
            horizontalScrollContainer.classList.add('drag-scrolling');
            horizontalScrollContainer.style.scrollSnapType = 'none';
          }
          
          if (nearLeftEdge && horizontalScrollContainer.scrollLeft > 0) {
            const distanceFromEdge = Math.max(1, currentX - rect.left);
            const speedMultiplier = Math.max(0.5, (scrollZoneSize - distanceFromEdge) / scrollZoneSize);
            const scrollSpeed = baseScrollSpeed * speedMultiplier;
            horizontalScrollContainer.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
            scrollingHorizontally = true;
          } else if (nearRightEdge && horizontalScrollContainer.scrollLeft < horizontalScrollContainer.scrollWidth - horizontalScrollContainer.clientWidth) {
            const distanceFromEdge = Math.max(1, rect.right - currentX);
            const speedMultiplier = Math.max(0.5, (scrollZoneSize - distanceFromEdge) / scrollZoneSize);
            const scrollSpeed = baseScrollSpeed * speedMultiplier;
            horizontalScrollContainer.scrollBy({ left: scrollSpeed, behavior: 'auto' });
            scrollingHorizontally = true;
          }
        }
      }
      
      // Vertical scrolling - Only when VERY close to viewport edges
      // This prevents scrolling when just moving the task down within visible area
      const verticalScrollContainer = document.querySelector('.flex-1.overflow-y-auto');
      
      if (verticalScrollContainer) {
        const viewportHeight = window.innerHeight;
        const headerHeight = 60; // Approximate header height
        
        // Only trigger when REALLY close to edges (not just moving down)
        const nearTopEdge = currentY < scrollZoneSizeVertical + headerHeight;
        const nearBottomEdge = currentY > viewportHeight - scrollZoneSizeVertical;
        
        // Check if we can actually scroll in that direction
        const canScrollUp = verticalScrollContainer.scrollTop > 0;
        const canScrollDown = verticalScrollContainer.scrollTop < verticalScrollContainer.scrollHeight - verticalScrollContainer.clientHeight;
        
        if (nearTopEdge && canScrollUp) {
          const distanceFromEdge = Math.max(1, currentY - headerHeight);
          // Use a more aggressive curve - slower at first, faster when very close
          const speedMultiplier = Math.pow(Math.max(0, (scrollZoneSizeVertical - distanceFromEdge) / scrollZoneSizeVertical), 1.5);
          const scrollSpeed = baseVerticalScrollSpeed * speedMultiplier;
          if (scrollSpeed > 0.5) { // Only scroll if speed is meaningful
            verticalScrollContainer.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
            scrollingVertically = true;
          }
        } else if (nearBottomEdge && canScrollDown) {
          const distanceFromEdge = Math.max(1, viewportHeight - currentY);
          // Use a more aggressive curve - slower at first, faster when very close
          const speedMultiplier = Math.pow(Math.max(0, (scrollZoneSizeVertical - distanceFromEdge) / scrollZoneSizeVertical), 1.5);
          const scrollSpeed = baseVerticalScrollSpeed * speedMultiplier;
          if (scrollSpeed > 0.5) { // Only scroll if speed is meaningful
            verticalScrollContainer.scrollBy({ top: scrollSpeed, behavior: 'auto' });
            scrollingVertically = true;
          }
        }
      }
      
      const isScrolling = scrollingHorizontally || scrollingVertically;
      
      // Stop interval if not scrolling
      if (!isScrolling && autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }, 16); // ~60fps
  }, []);
  
  // Function to re-enable snap scrolling
  const enableSnapScrolling = useCallback(() => {
    // Find all containers with drag-scrolling class
    const scrollContainers = document.querySelectorAll('.drag-scrolling');
    scrollContainers.forEach(scrollContainer => {
      scrollContainer.classList.remove('drag-scrolling');
      (scrollContainer as HTMLElement).style.scrollSnapType = '';
      
      // Smooth transition back to nearest snap point after a short delay
      setTimeout(() => {
        (scrollContainer as HTMLElement).style.scrollBehavior = 'smooth';
        // Force snap to nearest column
        const scrollLeft = scrollContainer.scrollLeft;
        const columnWidth = 248; // 240px width + 8px gap
        const nearestColumn = Math.round(scrollLeft / columnWidth);
        scrollContainer.scrollTo({ left: nearestColumn * columnWidth, behavior: 'smooth' });
        // Reset scroll behavior
        setTimeout(() => {
          (scrollContainer as HTMLElement).style.scrollBehavior = '';
        }, 300);
      }, 100);
    });
  }, []);

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
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
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
      clone.style.opacity = '0.85';
      clone.style.transform = `translate(${currentTouch.clientX - newOffset.x}px, ${currentTouch.clientY - newOffset.y}px) scale(1.02) rotate(2deg)`;
      clone.style.transition = 'none';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = `${newRect.width}px`;
      clone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      clone.style.willChange = 'transform';
      clone.style.userSelect = 'none';
      clone.style.webkitUserSelect = 'none';
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
      
      // Prevent native scrolling on mobile during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
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
    
    // Update clone position with transform for better performance
    cloneRef.current.style.transform = `translate(${touch.clientX - touchOffset.x}px, ${touch.clientY - touchOffset.y}px) scale(1.02) rotate(2deg)`;
    
    // Handle auto-scroll on mobile
    handleAutoScroll(touch.clientX, touch.clientY);

    // Find element under touch point - temporarily hide the clone to get accurate element
    if (cloneRef.current) {
      cloneRef.current.style.pointerEvents = 'none';
      cloneRef.current.style.visibility = 'hidden';
    }
    
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Re-show the clone
    if (cloneRef.current) {
      cloneRef.current.style.visibility = 'visible';
    }
    
    if (!elementBelow) return;

    // Check if over a drop zone (column)
    const dropZone = elementBelow.closest('[data-drop-zone]');
    if (dropZone) {
      const status = dropZone.getAttribute('data-drop-zone') as Task['status'];
      if (dragOverStatus !== status) {
        setDragOverStatus(status);
        // Provide haptic feedback on zone change
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
    } else {
      // Not over any drop zone
      if (dragOverStatus !== null) {
        setDragOverStatus(null);
      }
    }

    // Check if over a task card for vertical positioning
    const taskCard = elementBelow.closest('[data-task-index]');
    if (taskCard && dropZone) {
      const index = parseInt(taskCard.getAttribute('data-task-index') || '0', 10);
      const column = taskCard.getAttribute('data-task-column') || '';
      const rect = taskCard.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const height = rect.height;
      
      const visualIndex = y < height / 2 ? index : index + 1;
      
      // Only update if changed
      if (!dropIndicatorIndex || dropIndicatorIndex.column !== column || dropIndicatorIndex.index !== visualIndex) {
        setDropIndicatorIndex({ column, index: visualIndex });
      }
    } else if (!taskCard && dropIndicatorIndex) {
      // Clear indicator if not over a task
      setDropIndicatorIndex(null);
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
    
    // Re-enable native scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
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
    
    // Stop auto-scroll and re-enable snap
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    enableSnapScrolling();

    // Find drop target - temporarily hide the clone to get accurate element
    if (cloneRef.current) {
      cloneRef.current.style.visibility = 'hidden';
    }
    
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
      
      // Provide haptic feedback on successful drop
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      
      if (dropIndicatorIndex && dropIndicatorIndex.column) {
        // Vertical drop with specific position
        await onDropVertical(draggedItem, dropIndicatorIndex.index, targetStatus);
      } else {
        // Simple status change drop - put at top
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
    
    // Re-enable native scrolling
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    
    // Stop auto-scroll and re-enable snap
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    enableSnapScrolling();
    
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