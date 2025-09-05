import { Task } from '@/hooks/useTasks';

export interface DragData {
  id: number;
  status: Task['status'];
  priority?: Task['priority'];
  position?: number;
}

export interface UseDragAndDropProps {
  onDrop: (data: DragData, targetStatus: Task['status']) => Promise<void>;
  onDropVertical: (data: DragData, targetIndex: number, targetStatus: Task['status']) => Promise<void>;
  longPressDelay?: number;
}

export interface DropIndicator {
  column: string;
  index: number;
}

export interface TouchOffset {
  x: number;
  y: number;
}

export interface TouchPosition {
  x: number;
  y: number;
}

export interface DragHandlers {
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => void;
  onDragOverVertical: (e: React.DragEvent<HTMLDivElement>, index: number, column: string) => void;
  onDragLeave: () => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetStatus: Task['status'], targetPosition?: number) => Promise<void>;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, task: Task) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => Promise<void>;
  onTouchCancel: (e?: React.TouchEvent<HTMLDivElement>) => void;
}