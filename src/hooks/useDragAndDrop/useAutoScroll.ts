import { useCallback, useRef } from 'react';
import { SCROLL_CONFIG, DRAG_CONFIG } from './constants';
import { isMobile, calculateScrollSpeed, disableSnapScrolling } from './utils';

export const useAutoScroll = () => {
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTouchXRef = useRef<number>(0);
  const currentTouchYRef = useRef<number>(0);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const handleAutoScroll = useCallback((clientX: number, clientY: number) => {
    currentTouchXRef.current = clientX;
    currentTouchYRef.current = clientY;
    
    stopAutoScroll();
    
    autoScrollIntervalRef.current = setInterval(() => {
      const currentX = currentTouchXRef.current;
      const currentY = currentTouchYRef.current;
      
      if (currentX === null || currentX === undefined || currentY === null || currentY === undefined) {
        return;
      }
      
      // Horizontal scrolling (mobile only)
      if (isMobile()) {
        const horizontalScrollContainer = document.querySelector('.overflow-x-auto') as HTMLElement;
        
        if (horizontalScrollContainer) {
          const { ZONE_SIZE, BASE_SPEED } = SCROLL_CONFIG.HORIZONTAL;
          const viewportLeft = 0;
          const viewportRight = window.innerWidth;
          const nearLeftEdge = currentX < viewportLeft + ZONE_SIZE;
          const nearRightEdge = currentX > viewportRight - ZONE_SIZE;
          
          disableSnapScrolling(horizontalScrollContainer);
          
          if (nearLeftEdge && horizontalScrollContainer.scrollLeft > 0) {
            const distanceFromEdge = Math.max(1, currentX);
            const scrollSpeed = calculateScrollSpeed(distanceFromEdge, ZONE_SIZE, BASE_SPEED);
            horizontalScrollContainer.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
          } else if (nearRightEdge && horizontalScrollContainer.scrollLeft < horizontalScrollContainer.scrollWidth - horizontalScrollContainer.clientWidth) {
            const distanceFromEdge = Math.max(1, viewportRight - currentX);
            const scrollSpeed = calculateScrollSpeed(distanceFromEdge, ZONE_SIZE, BASE_SPEED);
            horizontalScrollContainer.scrollBy({ left: scrollSpeed, behavior: 'auto' });
          }
        }
      }
      
      // Vertical scrolling
      const viewportHeight = window.innerHeight;
      const { ZONE_SIZE_TOP, ZONE_SIZE_BOTTOM, BASE_SPEED, SPEED_MULTIPLIER, MIN_SPEED } = SCROLL_CONFIG.VERTICAL;
      
      const nearTopEdge = currentY < ZONE_SIZE_TOP;
      const nearBottomEdge = currentY > viewportHeight - ZONE_SIZE_BOTTOM;
      
      const canScrollUp = window.scrollY > 0;
      const canScrollDown = window.scrollY < document.documentElement.scrollHeight - window.innerHeight;
      
      if (nearTopEdge && canScrollUp) {
        const distanceFromEdge = Math.max(1, currentY);
        const speedMultiplier = Math.pow(Math.max(0, (ZONE_SIZE_TOP - distanceFromEdge) / ZONE_SIZE_TOP), 1.2);
        const scrollSpeed = BASE_SPEED * speedMultiplier * SPEED_MULTIPLIER;
        
        if (scrollSpeed > MIN_SPEED) {
          window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
        }
      } else if (nearBottomEdge && canScrollDown) {
        const distanceFromEdge = Math.max(1, viewportHeight - currentY);
        const speedMultiplier = Math.pow(Math.max(0, (ZONE_SIZE_BOTTOM - distanceFromEdge) / ZONE_SIZE_BOTTOM), 1.2);
        const scrollSpeed = BASE_SPEED * speedMultiplier * SPEED_MULTIPLIER;
        
        if (scrollSpeed > MIN_SPEED) {
          window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
        }
      }
    }, DRAG_CONFIG.AUTO_SCROLL_INTERVAL);
  }, [stopAutoScroll]);

  return {
    handleAutoScroll,
    stopAutoScroll
  };
};