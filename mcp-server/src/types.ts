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

// === Workstreams (Status Deck) ===

export type WorkstreamStatus = 'On Track' | 'OFF TRACK' | 'At risk';

export interface ProgressUpdate {
  date: string; // ISO 8601 date
  text: string;
  source: 'manual' | 'workiq';
}

export interface Workstream {
  id: string;
  title: string;
  priority: number; // 0 or 1
  productInitiative: string; // e.g. "Singularity", "Windows", "All"
  impact: string;
  devMonthsTotal: number;
  devMonthsRemain: number;
  release: string;
  status: WorkstreamStatus;
  targetCompletionDate: string; // YYMM format e.g. "2604"
  owners: string[]; // TeamMember IDs
  adoWorkItemId: number | null; // ADO parent Scenario/Deliverable ID
  adoProject: string; // ADO project name (e.g. "OS")
  progressUpdates: ProgressUpdate[];
  page: number; // deck page number
  sortOrder: number; // ordering within page
  createdAt: string;
  updatedAt: string;
}
