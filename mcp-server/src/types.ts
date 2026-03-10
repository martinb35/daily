// Types for Daily app data — source of truth is src/shared/types.ts
// Keep in sync when modifying the Electron app's type definitions.

export type TaskStatus = 'inbox' | 'delegated' | 'scheduled' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  deferUntil: string | null;
  points?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  areas: string[];
  notes: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  taskIds: string[];
  color: string;
}

export interface ReviewSnapshot {
  id: string;
  weekOf: string;
  completedTaskIds: string[];
  delegatedTaskIds: string[];
  deferredTaskIds: string[];
  totalPoints?: number;
  notes: string;
  createdAt: string;
}

export interface WeeklyScore {
  id: string;
  weekOf: string;
  totalPoints: number;
  tasksCompleted: number;
  updatedAt: string;
}
