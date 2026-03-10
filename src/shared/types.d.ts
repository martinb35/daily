export type TaskStatus = 'inbox' | 'delegated' | 'scheduled' | 'done';
export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId: string | null;
    dueDate: string | null;
    deferUntil: string | null;
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
    notes: string;
    createdAt: string;
}
export type IpcChannels = 'tasks:list' | 'tasks:get' | 'tasks:create' | 'tasks:update' | 'tasks:delete' | 'team:list' | 'team:get' | 'team:create' | 'team:update' | 'team:delete' | 'timeblocks:list' | 'timeblocks:create' | 'timeblocks:update' | 'timeblocks:delete' | 'reviews:list' | 'reviews:create' | 'reviews:get' | 'app:getDataPath';
