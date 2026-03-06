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
  notes: string;
  createdAt: string;
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
  | 'app:getDataPath';
