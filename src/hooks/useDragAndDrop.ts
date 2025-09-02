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
    setIsDragActive(true);
    
    // Store element reference for visual feedback
    draggedElementRef.current = e.currentTarget as HTMLElement;
    
    // Set data transfer
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a drag image that follows the cursor
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.width = e.currentTarget.offsetWidth + 'px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: Task['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  };

  const handleDragOverVertical = (e: DragEvent<HTMLDivElement>, index: number, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find drop position based on absolute position in column, same as mobile
    const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${column}"]`));
    
    let targetIndex = columnTasks.length; // Default to end
    
    // Find position based on Y coordinate
    for (let i = 0; i < columnTasks.length; i++) {
      const taskElement = columnTasks[i] as HTMLElement;
      const rect = taskElement.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      
      if (e.clientY < midPoint) {
        targetIndex = i;
        break;
      }
    }
    
    // Only update if actually changed
    if (!dropIndicatorIndex || dropIndicatorIndex.column !== column || dropIndicatorIndex.index !== targetIndex) {
      setDropIndicatorIndex({ column, index: targetIndex });
    }
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    // Reset visual feedback on dragged element
    if (draggedElementRef.current) {
      draggedElementRef.current.style.transition = 'all 0.2s ease-in-out';
      draggedElementRef.current.style.opacity = '1';
      draggedElementRef.current.style.transform = 'scale(1)';
      draggedElementRef.current.style.filter = 'none';
      // Clean up after transition
      setTimeout(() => {
        if (draggedElementRef.current) {
          draggedElementRef.current.style.transition = '';
          draggedElementRef.current = null;
        }
      }, 200);
    }
    
    setDraggedItem(null);
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setIsDragActive(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use draggedItem state if dataTransfer is empty (common in some browsers)
    let data: DragData;
    const payload = e.dataTransfer.getData('application/json');
    
    if (payload) {
      data = JSON.parse(payload) as DragData;
    } else if (draggedItem) {
      data = draggedItem;
    } else {
      return;
    }
    
    setDragOverStatus(null);
    setDropIndicatorIndex(null);
    setDraggedItem(null);
    setIsDragActive(false);
    
    await onDrop(data, targetStatus);
  };

  const handleDropVertical = async (e: DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the current drop position from the drag over calculation
    const currentDropIndex = dropIndicatorIndex?.index;
    
    // Use draggedItem state if dataTransfer is empty (common in some browsers)
    let data: DragData;
    const payload = e.dataTransfer.getData('application/json');
    
    if (payload) {
      data = JSON.parse(payload) as DragData;
    } else if (draggedItem) {
      data = draggedItem;
    } else {
      return;
    }
    
    setDropIndicatorIndex(null);
    setDragOverStatus(null);
    setDraggedItem(null);
    setIsDragActive(false);
    
    // Use the calculated index or default to 0
    const targetIndex = currentDropIndex ?? 0;
    await onDropVertical(data, targetIndex, targetStatus);
  };

  // Touch events handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>, task: Task) => {
    // Check if the touch started on an interactive element that shouldn't trigger drag
    const target = e.target as HTMLElement;
    const touchedElement = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    
    // Don't start drag if touching an element marked as no-drag or its children
    if (touchedElement?.closest('[data-no-drag="true"]')) {
      // Clean up any existing timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      initialTouchRef.current = null;
      pendingDragDataRef.current = null;
      draggedElementRef.current = null;
      return;
    }
    
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

      // Make original element semi-transparent during drag
      element.style.opacity = '0.3';
      element.style.transform = 'scale(0.98)';
      element.style.filter = 'blur(2px)';
      element.style.transition = 'all 0.2s ease-in-out';
      
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

    // Find drop position based on absolute position in column
    if (dropZone) {
      const status = dropZone.getAttribute('data-drop-zone') as Task['status'];
      const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${status === 'TODO' ? 'TODO' : status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'DONE'}"]`));
      
      let targetIndex = columnTasks.length; // Default to end
      
      // Find position based on Y coordinate
      for (let i = 0; i < columnTasks.length; i++) {
        const taskElement = columnTasks[i] as HTMLElement;
        const rect = taskElement.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        
        if (touch.clientY < midPoint) {
          targetIndex = i;
          break;
        }
      }
      
      const column = status === 'TODO' ? 'TODO' : status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'DONE';
      
      // Only update if actually changed
      if (!dropIndicatorIndex || dropIndicatorIndex.column !== column || dropIndicatorIndex.index !== targetIndex) {
        setDropIndicatorIndex({ column, index: targetIndex });
      }
    } else if (dropIndicatorIndex) {
      // Clear indicator if not over any drop zone
      setDropIndicatorIndex(null);
    }
  };

  const handleTouchEnd = async (e: TouchEvent<HTMLDivElement>) => {
    // Re-enable native drag after touch ends
    e.currentTarget.setAttribute('draggable', 'true');
    
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
    
    // Reset visual feedback with smooth transition
    if (draggedElementRef.current) {
      draggedElementRef.current.style.transition = 'all 0.2s ease-in-out';
      draggedElementRef.current.style.opacity = '1';
      draggedElementRef.current.style.transform = 'scale(1)';
      draggedElementRef.current.style.filter = 'none';
      // Clean up after transition
      setTimeout(() => {
        if (draggedElementRef.current) {
          draggedElementRef.current.style.transition = '';
          draggedElementRef.current = null;
        }
      }, 200);
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
  const handleTouchCancel = (e?: TouchEvent<HTMLDivElement>) => {
    // Re-enable native drag after touch cancels
    if (e?.currentTarget) {
      e.currentTarget.setAttribute('draggable', 'true');
    }
    
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
      draggedElementRef.current.style.transition = 'all 0.2s ease-in-out';
      draggedElementRef.current.style.opacity = '1';
      draggedElementRef.current.style.transform = 'scale(1)';
      draggedElementRef.current.style.filter = 'none';
      // Clean up after transition
      setTimeout(() => {
        if (draggedElementRef.current) {
          draggedElementRef.current.style.transition = '';
          draggedElementRef.current = null;
        }
      }, 200);
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