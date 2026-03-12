// === Task ===

export type TaskStatus = 'inbox' | 'delegated' | 'scheduled' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null; // null = self, otherwise TeamMember.id
  dueDate: string | null; // ISO 8601
  deferUntil: string | null; // ISO 8601 — when deferred, returns to inbox on this date
  points?: number | null; // auto-calculated when task is completed
  createdAt: string;
  updatedAt: string;
}

// === Team ===

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  areas: string[]; // areas of ownership
  notes: string;
}

// === Time Blocks ===

export interface TimeBlock {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  taskIds: string[]; // linked tasks
  color: string;
}

// === Weekly Review ===

export interface ReviewSnapshot {
  id: string;
  weekOf: string; // ISO 8601 date (Monday of the week)
  completedTaskIds: string[];
  delegatedTaskIds: string[];
  deferredTaskIds: string[];
  totalPoints?: number; // sum of points from completed tasks this week
  notes: string;
  createdAt: string;
}

// === Weekly Score ===

export interface WeeklyScore {
  id: string;
  weekOf: string; // ISO 8601 date (Monday of the week)
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

// === IPC Channels ===

export type IpcChannels =
  | 'tasks:list'
  | 'tasks:get'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
  | 'team:list'
  | 'team:get'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  | 'timeblocks:list'
  | 'timeblocks:create'
  | 'timeblocks:update'
  | 'timeblocks:delete'
  | 'reviews:list'
  | 'reviews:create'
  | 'reviews:get'
  | 'scores:list'
  | 'scores:get'
  | 'scores:create'
  | 'scores:update'
  | 'scores:delete'
  | 'app:getDataPath';
