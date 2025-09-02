import { Task } from '@/hooks/useTasks';
import { MOBILE_CONFIG, SCROLL_CONFIG } from './constants';

export const isMobile = () => window.innerWidth < MOBILE_CONFIG.BREAKPOINT;

export const findTaskIndex = (element: HTMLElement, status: Task['status']): number => {
  const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${status}"]`));
  for (let i = 0; i < columnTasks.length; i++) {
    if (columnTasks[i] === element) {
      return i;
    }
  }
  return -1;
};

export const findDropPosition = (clientY: number, column: string): number => {
  const columnTasks = Array.from(document.querySelectorAll(`[data-task-column="${column}"]`));
  
  for (let i = 0; i < columnTasks.length; i++) {
    const taskElement = columnTasks[i] as HTMLElement;
    const rect = taskElement.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    
    if (clientY < midPoint) {
      return i;
    }
  }
  
  return columnTasks.length;
};

export const shouldShowDropIndicator = (
  draggedItemStatus: Task['status'] | undefined,
  targetStatus: string,
  draggedItemIndex: number,
  targetIndex: number
): boolean => {
  if (!draggedItemStatus || draggedItemStatus !== targetStatus) {
    return true;
  }
  
  return draggedItemIndex < 0 || (targetIndex !== draggedItemIndex && targetIndex !== draggedItemIndex + 1);
};

export const calculateScrollSpeed = (distance: number, zoneSize: number, baseSpeed: number): number => {
  const speedMultiplier = Math.max(0.5, (zoneSize - distance) / zoneSize);
  return baseSpeed * speedMultiplier;
};

export const enableSnapScrolling = (): void => {
  const scrollContainers = document.querySelectorAll('.drag-scrolling');
  scrollContainers.forEach(scrollContainer => {
    scrollContainer.classList.remove('drag-scrolling');
    (scrollContainer as HTMLElement).style.scrollSnapType = '';
    
    setTimeout(() => {
      (scrollContainer as HTMLElement).style.scrollBehavior = 'smooth';
      const scrollLeft = scrollContainer.scrollLeft;
      const nearestColumn = Math.round(scrollLeft / MOBILE_CONFIG.COLUMN_WIDTH);
      scrollContainer.scrollTo({ left: nearestColumn * MOBILE_CONFIG.COLUMN_WIDTH, behavior: 'smooth' });
      
      setTimeout(() => {
        (scrollContainer as HTMLElement).style.scrollBehavior = '';
      }, MOBILE_CONFIG.SNAP_RESET_DELAY);
    }, MOBILE_CONFIG.SNAP_TRANSITION_DELAY);
  });
};

export const disableSnapScrolling = (container: HTMLElement): void => {
  if (!container.classList.contains('drag-scrolling')) {
    container.classList.add('drag-scrolling');
    container.style.scrollSnapType = 'none';
  }
};

export const vibrate = (duration: number): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

export const createDragImage = (element: HTMLElement, offsetX: number): HTMLElement => {
  const dragImage = element.cloneNode(true) as HTMLElement;
  dragImage.style.position = 'absolute';
  dragImage.style.top = '-1000px';
  dragImage.style.width = element.offsetWidth + 'px';
  document.body.appendChild(dragImage);
  return dragImage;
};

export const applyDragStyles = (element: HTMLElement | null, styles: Record<string, any>): void => {
  if (!element) return;
  Object.assign(element.style, styles);
};