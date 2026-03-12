#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, getDataDir } from './storage.js';
import type { Task, TeamMember, TimeBlock, ReviewSnapshot, WeeklyScore, Workstream, ProgressUpdate } from './types.js';

// --- Server setup ---

const server = new McpServer({
  name: 'daily-data',
  version: '1.0.0',
});

// --- Helper ---

function jsonResult(data: unknown): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

// =============================================================================
// TASKS
// =============================================================================

server.registerTool('tasks_list', {
  title: 'List Tasks',
  description: 'List all tasks, optionally filtered by status',
  inputSchema: {
    status: z.enum(['inbox', 'delegated', 'scheduled', 'done']).optional()
      .describe('Filter by task status'),
  },
}, async ({ status }) => {
  let tasks = readJsonFile<Task>('tasks.json');
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  return jsonResult(tasks);
});

server.registerTool('tasks_get', {
  title: 'Get Task',
  description: 'Get a single task by ID',
  inputSchema: {
    id: z.string().describe('Task ID'),
  },
}, async ({ id }) => {
  const tasks = readJsonFile<Task>('tasks.json');
  const task = tasks.find(t => t.id === id);
  if (!task) return jsonResult({ error: `Task not found: ${id}` });
  return jsonResult(task);
});

server.registerTool('tasks_create', {
  title: 'Create Task',
  description: 'Create a new task in the inbox',
  inputSchema: {
    id: z.string().describe('Unique task ID string'),
    title: z.string().describe('Task title'),
    description: z.string().optional().default('').describe('Task description'),
    status: z.enum(['inbox', 'delegated', 'scheduled', 'done']).optional().default('inbox')
      .describe('Task status'),
    assigneeId: z.string().nullable().optional().default(null)
      .describe('Team member ID if delegated'),
    dueDate: z.string().nullable().optional().default(null)
      .describe('Due date (ISO 8601)'),
    deferUntil: z.string().nullable().optional().default(null)
      .describe('Defer until date (ISO 8601)'),
  },
}, async (args) => {
  const tasks = readJsonFile<Task>('tasks.json');
  const now = new Date().toISOString();
  const task: Task = {
    id: args.id,
    title: args.title,
    description: args.description ?? '',
    status: args.status ?? 'inbox',
    assigneeId: args.assigneeId ?? null,
    dueDate: args.dueDate ?? null,
    deferUntil: args.deferUntil ?? null,
    points: null,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(task);
  writeJsonFile('tasks.json', tasks);
  return jsonResult(task);
});

server.registerTool('tasks_update', {
  title: 'Update Task',
  description: 'Update an existing task by ID. Only provided fields are changed.',
  inputSchema: {
    id: z.string().describe('Task ID to update'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    status: z.enum(['inbox', 'delegated', 'scheduled', 'done']).optional()
      .describe('New status'),
    assigneeId: z.string().nullable().optional().describe('New assignee ID'),
    dueDate: z.string().nullable().optional().describe('New due date'),
    deferUntil: z.string().nullable().optional().describe('New defer-until date'),
    points: z.number().nullable().optional().describe('Productivity points (auto-calculated on completion)'),
  },
}, async (args) => {
  const tasks = readJsonFile<Task>('tasks.json');
  const index = tasks.findIndex(t => t.id === args.id);
  if (index === -1) return jsonResult({ error: `Task not found: ${args.id}` });
  const task = tasks[index];
  if (args.title !== undefined) task.title = args.title;
  if (args.description !== undefined) task.description = args.description;
  if (args.status !== undefined) task.status = args.status;
  if (args.assigneeId !== undefined) task.assigneeId = args.assigneeId;
  if (args.dueDate !== undefined) task.dueDate = args.dueDate;
  if (args.deferUntil !== undefined) task.deferUntil = args.deferUntil;
  if (args.points !== undefined) task.points = args.points;
  task.updatedAt = new Date().toISOString();
  tasks[index] = task;
  writeJsonFile('tasks.json', tasks);
  return jsonResult(task);
});

server.registerTool('tasks_delete', {
  title: 'Delete Task',
  description: 'Delete a task by ID',
  inputSchema: {
    id: z.string().describe('Task ID to delete'),
  },
}, async ({ id }) => {
  const tasks = readJsonFile<Task>('tasks.json');
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return jsonResult({ error: `Task not found: ${id}` });
  writeJsonFile('tasks.json', filtered);
  return jsonResult({ deleted: id });
});

// =============================================================================
// TIMEBLOCKS
// =============================================================================

server.registerTool('timeblocks_list', {
  title: 'List Time Blocks',
  description: 'List all time blocks, optionally filtered by date (YYYY-MM-DD)',
  inputSchema: {
    date: z.string().optional().describe('Filter by date (YYYY-MM-DD)'),
  },
}, async ({ date }) => {
  let blocks = readJsonFile<TimeBlock>('timeblocks.json');
  if (date) {
    blocks = blocks.filter(b => b.start.startsWith(date));
  }
  return jsonResult(blocks);
});

server.registerTool('timeblocks_get', {
  title: 'Get Time Block',
  description: 'Get a single time block by ID',
  inputSchema: {
    id: z.string().describe('Time block ID'),
  },
}, async ({ id }) => {
  const blocks = readJsonFile<TimeBlock>('timeblocks.json');
  const block = blocks.find(b => b.id === id);
  if (!block) return jsonResult({ error: `Time block not found: ${id}` });
  return jsonResult(block);
});

server.registerTool('timeblocks_create', {
  title: 'Create Time Block',
  description: 'Create a new time block',
  inputSchema: {
    id: z.string().describe('Unique time block ID'),
    title: z.string().describe('Block title'),
    start: z.string().describe('Start time (ISO 8601 with timezone)'),
    end: z.string().describe('End time (ISO 8601 with timezone)'),
    taskIds: z.array(z.string()).optional().default([]).describe('Linked task IDs'),
    color: z.string().optional().default('#9B59B6').describe('Color hex code'),
  },
}, async (args) => {
  const blocks = readJsonFile<TimeBlock>('timeblocks.json');
  const block: TimeBlock = {
    id: args.id,
    title: args.title,
    start: args.start,
    end: args.end,
    taskIds: args.taskIds ?? [],
    color: args.color ?? '#9B59B6',
  };
  blocks.push(block);
  writeJsonFile('timeblocks.json', blocks);
  return jsonResult(block);
});

server.registerTool('timeblocks_update', {
  title: 'Update Time Block',
  description: 'Update an existing time block by ID',
  inputSchema: {
    id: z.string().describe('Time block ID to update'),
    title: z.string().optional().describe('New title'),
    start: z.string().optional().describe('New start time'),
    end: z.string().optional().describe('New end time'),
    taskIds: z.array(z.string()).optional().describe('New linked task IDs'),
    color: z.string().optional().describe('New color'),
  },
}, async (args) => {
  const blocks = readJsonFile<TimeBlock>('timeblocks.json');
  const index = blocks.findIndex(b => b.id === args.id);
  if (index === -1) return jsonResult({ error: `Time block not found: ${args.id}` });
  const block = blocks[index];
  if (args.title !== undefined) block.title = args.title;
  if (args.start !== undefined) block.start = args.start;
  if (args.end !== undefined) block.end = args.end;
  if (args.taskIds !== undefined) block.taskIds = args.taskIds;
  if (args.color !== undefined) block.color = args.color;
  blocks[index] = block;
  writeJsonFile('timeblocks.json', blocks);
  return jsonResult(block);
});

server.registerTool('timeblocks_delete', {
  title: 'Delete Time Block',
  description: 'Delete a time block by ID',
  inputSchema: {
    id: z.string().describe('Time block ID to delete'),
  },
}, async ({ id }) => {
  const blocks = readJsonFile<TimeBlock>('timeblocks.json');
  const filtered = blocks.filter(b => b.id !== id);
  if (filtered.length === blocks.length) return jsonResult({ error: `Time block not found: ${id}` });
  writeJsonFile('timeblocks.json', filtered);
  return jsonResult({ deleted: id });
});

// =============================================================================
// TEAM
// =============================================================================

server.registerTool('team_list', {
  title: 'List Team Members',
  description: 'List all team members',
  inputSchema: {},
}, async () => {
  return jsonResult(readJsonFile<TeamMember>('team.json'));
});

server.registerTool('team_get', {
  title: 'Get Team Member',
  description: 'Get a team member by ID',
  inputSchema: {
    id: z.string().describe('Team member ID'),
  },
}, async ({ id }) => {
  const members = readJsonFile<TeamMember>('team.json');
  const member = members.find(m => m.id === id);
  if (!member) return jsonResult({ error: `Team member not found: ${id}` });
  return jsonResult(member);
});

server.registerTool('team_create', {
  title: 'Create Team Member',
  description: 'Add a new team member',
  inputSchema: {
    id: z.string().describe('Unique team member ID'),
    name: z.string().describe('Name'),
    role: z.string().describe('Role'),
    areas: z.array(z.string()).optional().default([]).describe('Areas of ownership'),
    notes: z.string().optional().default('').describe('Notes'),
  },
}, async (args) => {
  const members = readJsonFile<TeamMember>('team.json');
  const member: TeamMember = {
    id: args.id,
    name: args.name,
    role: args.role,
    areas: args.areas ?? [],
    notes: args.notes ?? '',
  };
  members.push(member);
  writeJsonFile('team.json', members);
  return jsonResult(member);
});

server.registerTool('team_update', {
  title: 'Update Team Member',
  description: 'Update a team member by ID',
  inputSchema: {
    id: z.string().describe('Team member ID to update'),
    name: z.string().optional().describe('New name'),
    role: z.string().optional().describe('New role'),
    areas: z.array(z.string()).optional().describe('New areas'),
    notes: z.string().optional().describe('New notes'),
  },
}, async (args) => {
  const members = readJsonFile<TeamMember>('team.json');
  const index = members.findIndex(m => m.id === args.id);
  if (index === -1) return jsonResult({ error: `Team member not found: ${args.id}` });
  const member = members[index];
  if (args.name !== undefined) member.name = args.name;
  if (args.role !== undefined) member.role = args.role;
  if (args.areas !== undefined) member.areas = args.areas;
  if (args.notes !== undefined) member.notes = args.notes;
  members[index] = member;
  writeJsonFile('team.json', members);
  return jsonResult(member);
});

server.registerTool('team_delete', {
  title: 'Delete Team Member',
  description: 'Remove a team member by ID',
  inputSchema: {
    id: z.string().describe('Team member ID to delete'),
  },
}, async ({ id }) => {
  const members = readJsonFile<TeamMember>('team.json');
  const filtered = members.filter(m => m.id !== id);
  if (filtered.length === members.length) return jsonResult({ error: `Team member not found: ${id}` });
  writeJsonFile('team.json', filtered);
  return jsonResult({ deleted: id });
});

// =============================================================================
// REVIEWS
// =============================================================================

server.registerTool('reviews_list', {
  title: 'List Reviews',
  description: 'List all weekly review snapshots',
  inputSchema: {},
}, async () => {
  return jsonResult(readJsonFile<ReviewSnapshot>('reviews.json'));
});

server.registerTool('reviews_get', {
  title: 'Get Review',
  description: 'Get a weekly review by ID',
  inputSchema: {
    id: z.string().describe('Review ID'),
  },
}, async ({ id }) => {
  const reviews = readJsonFile<ReviewSnapshot>('reviews.json');
  const review = reviews.find(r => r.id === id);
  if (!review) return jsonResult({ error: `Review not found: ${id}` });
  return jsonResult(review);
});

server.registerTool('reviews_create', {
  title: 'Create Review',
  description: 'Create a new weekly review snapshot',
  inputSchema: {
    id: z.string().describe('Unique review ID'),
    weekOf: z.string().describe('Monday of the week (ISO 8601 date)'),
    completedTaskIds: z.array(z.string()).optional().default([]),
    delegatedTaskIds: z.array(z.string()).optional().default([]),
    deferredTaskIds: z.array(z.string()).optional().default([]),
    totalPoints: z.number().optional().default(0),
    notes: z.string().optional().default(''),
  },
}, async (args) => {
  const reviews = readJsonFile<ReviewSnapshot>('reviews.json');
  const review: ReviewSnapshot = {
    id: args.id,
    weekOf: args.weekOf,
    completedTaskIds: args.completedTaskIds ?? [],
    delegatedTaskIds: args.delegatedTaskIds ?? [],
    deferredTaskIds: args.deferredTaskIds ?? [],
    totalPoints: args.totalPoints ?? 0,
    notes: args.notes ?? '',
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  writeJsonFile('reviews.json', reviews);
  return jsonResult(review);
});

server.registerTool('reviews_update', {
  title: 'Update Review',
  description: 'Update a weekly review snapshot by ID',
  inputSchema: {
    id: z.string().describe('Review ID to update'),
    weekOf: z.string().optional().describe('New week-of date'),
    completedTaskIds: z.array(z.string()).optional(),
    delegatedTaskIds: z.array(z.string()).optional(),
    deferredTaskIds: z.array(z.string()).optional(),
    notes: z.string().optional().describe('New notes'),
  },
}, async (args) => {
  const reviews = readJsonFile<ReviewSnapshot>('reviews.json');
  const index = reviews.findIndex(r => r.id === args.id);
  if (index === -1) return jsonResult({ error: `Review not found: ${args.id}` });
  const review = reviews[index];
  if (args.weekOf !== undefined) review.weekOf = args.weekOf;
  if (args.completedTaskIds !== undefined) review.completedTaskIds = args.completedTaskIds;
  if (args.delegatedTaskIds !== undefined) review.delegatedTaskIds = args.delegatedTaskIds;
  if (args.deferredTaskIds !== undefined) review.deferredTaskIds = args.deferredTaskIds;
  if (args.notes !== undefined) review.notes = args.notes;
  reviews[index] = review;
  writeJsonFile('reviews.json', reviews);
  return jsonResult(review);
});

server.registerTool('reviews_delete', {
  title: 'Delete Review',
  description: 'Delete a weekly review snapshot by ID',
  inputSchema: {
    id: z.string().describe('Review ID to delete'),
  },
}, async ({ id }) => {
  const reviews = readJsonFile<ReviewSnapshot>('reviews.json');
  const filtered = reviews.filter(r => r.id !== id);
  if (filtered.length === reviews.length) return jsonResult({ error: `Review not found: ${id}` });
  writeJsonFile('reviews.json', filtered);
  return jsonResult({ deleted: id });
});

// =============================================================================
// SCORES (Weekly Productivity Points)
// =============================================================================

server.registerTool('scores_list', {
  title: 'List Weekly Scores',
  description: 'List all weekly productivity scores',
  inputSchema: {},
}, async () => {
  return jsonResult(readJsonFile<WeeklyScore>('scores.json'));
});

server.registerTool('scores_get', {
  title: 'Get Weekly Score',
  description: 'Get a weekly score by ID',
  inputSchema: {
    id: z.string().describe('Score ID'),
  },
}, async ({ id }) => {
  const scores = readJsonFile<WeeklyScore>('scores.json');
  const score = scores.find(s => s.id === id);
  return jsonResult(score ?? { error: `Score not found: ${id}` });
});

server.registerTool('scores_create', {
  title: 'Create Weekly Score',
  description: 'Create a new weekly score entry',
  inputSchema: {
    id: z.string().describe('Unique score ID'),
    weekOf: z.string().describe('Monday of the week (ISO 8601 date)'),
    totalPoints: z.number().default(0),
    tasksCompleted: z.number().default(0),
  },
}, async (args) => {
  const scores = readJsonFile<WeeklyScore>('scores.json');
  const score: WeeklyScore = {
    ...args,
    updatedAt: new Date().toISOString(),
  };
  scores.push(score);
  writeJsonFile('scores.json', scores);
  return jsonResult(score);
});

server.registerTool('scores_update', {
  title: 'Update Weekly Score',
  description: 'Update a weekly score by ID',
  inputSchema: {
    id: z.string().describe('Score ID to update'),
    totalPoints: z.number().optional(),
    tasksCompleted: z.number().optional(),
  },
}, async (args) => {
  const scores = readJsonFile<WeeklyScore>('scores.json');
  const index = scores.findIndex(s => s.id === args.id);
  if (index === -1) return jsonResult({ error: `Score not found: ${args.id}` });
  const score = scores[index];
  if (args.totalPoints !== undefined) score.totalPoints = args.totalPoints;
  if (args.tasksCompleted !== undefined) score.tasksCompleted = args.tasksCompleted;
  score.updatedAt = new Date().toISOString();
  scores[index] = score;
  writeJsonFile('scores.json', scores);
  return jsonResult(score);
});

server.registerTool('scores_delete', {
  title: 'Delete Weekly Score',
  description: 'Delete a weekly score by ID',
  inputSchema: {
    id: z.string().describe('Score ID to delete'),
  },
}, async ({ id }) => {
  const scores = readJsonFile<WeeklyScore>('scores.json');
  const filtered = scores.filter(s => s.id !== id);
  if (filtered.length === scores.length) return jsonResult({ error: `Score not found: ${id}` });
  writeJsonFile('scores.json', filtered);
  return jsonResult({ deleted: id });
});

// =============================================================================
// CALENDAR SYNC
// =============================================================================

server.registerTool('calendar_sync', {
  title: 'Sync Calendar to Time Blocks',
  description:
    'Sync calendar events to timeblocks for a given date. Deduplicates against existing timeblocks by title match or start-time match. ' +
    'Color mapping by type: one_on_one=#2ECC71, team=#4A90D9, external=#E67E22, focus=#9B59B6, wellness=#1ABC9C, other=#95A5A6. ' +
    'Returns summary of added and skipped events.',
  inputSchema: {
    date: z.string().describe('Date to sync (YYYY-MM-DD)'),
    events: z
      .array(
        z.object({
          title: z.string().describe('Event title'),
          start: z
            .string()
            .describe('Start time (ISO 8601 with timezone, e.g. 2026-03-12T09:00:00-07:00)'),
          end: z
            .string()
            .describe('End time (ISO 8601 with timezone, e.g. 2026-03-12T10:00:00-07:00)'),
          type: z
            .enum(['one_on_one', 'team', 'external', 'focus', 'wellness', 'other'])
            .optional()
            .default('other')
            .describe(
              'Event type for color coding. one_on_one=1:1 meetings, team=team/group meetings, external=meetings with external attendees, focus=focus/deep work, wellness=breaks/walks/personal, other=default',
            ),
        }),
      )
      .describe('Calendar events to sync as timeblocks'),
  },
}, async ({ date, events }) => {
  const allBlocks = readJsonFile<TimeBlock>('timeblocks.json');
  const existingForDate = allBlocks.filter((b) => b.start.startsWith(date));
  const existingIds = new Set(allBlocks.map((b) => b.id));

  const colorMap: Record<string, string> = {
    one_on_one: '#2ECC71',
    team: '#4A90D9',
    external: '#E67E22',
    focus: '#9B59B6',
    wellness: '#1ABC9C',
    other: '#95A5A6',
  };

  const added: TimeBlock[] = [];
  const skipped: { title: string; reason: string }[] = [];

  for (const event of events) {
    const titleLower = event.title.toLowerCase();

    const duplicate = existingForDate.find((b) => {
      const bLower = b.title.toLowerCase();
      return bLower.includes(titleLower) || titleLower.includes(bLower);
    });

    if (duplicate) {
      skipped.push({ title: event.title, reason: `matches existing: "${duplicate.title}"` });
      continue;
    }

    // Generate a unique kebab-case ID
    let baseId =
      'mtg-' +
      event.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 30) +
      '-' +
      date;
    let id = baseId;
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }

    const block: TimeBlock = {
      id,
      title: event.title,
      start: event.start,
      end: event.end,
      taskIds: [],
      color: colorMap[event.type ?? 'other'],
    };

    allBlocks.push(block);
    existingIds.add(id);
    added.push(block);
  }

  if (added.length > 0) {
    writeJsonFile('timeblocks.json', allBlocks);
  }

  return jsonResult({
    date,
    summary: `${added.length} added, ${skipped.length} skipped (${existingForDate.length} pre-existing)`,
    added,
    skipped,
  });
});

// =============================================================================
// UTILITY
// =============================================================================

server.registerTool('data_path', {
  title: 'Get Data Path',
  description: 'Get the path to the Daily app data directory',
  inputSchema: {},
}, async () => {
  return jsonResult({ dataDir: getDataDir() });
});

// =============================================================================
// WORKSTREAMS (Status Deck)
// =============================================================================

// Parse YYMM target date and check if it's in the past
function isOverdue(targetCompletionDate: string): boolean {
  if (!targetCompletionDate || targetCompletionDate.length !== 4) return false;
  const yy = parseInt(targetCompletionDate.slice(0, 2), 10);
  const mm = parseInt(targetCompletionDate.slice(2, 4), 10);
  if (isNaN(yy) || isNaN(mm)) return false;
  const targetYear = 2000 + yy;
  // Overdue if we're past the end of the target month
  const deadline = new Date(targetYear, mm, 1); // 1st of next month
  return new Date() >= deadline;
}

server.registerTool('workstreams_list', {
  title: 'List Workstreams',
  description: 'List all workstreams, optionally filtered by status',
  inputSchema: {
    status: z.enum(['On Track', 'OFF TRACK', 'At risk']).optional()
      .describe('Filter by workstream status'),
  },
}, async ({ status }) => {
  let workstreams = readJsonFile<Workstream>('workstreams.json');
  if (status) {
    workstreams = workstreams.filter(w => w.status === status);
  }
  workstreams.sort((a, b) => a.page !== b.page ? a.page - b.page : a.sortOrder - b.sortOrder);
  const result = workstreams.map(w => ({
    ...w,
    overdue: isOverdue(w.targetCompletionDate),
  }));
  return jsonResult(result);
});

server.registerTool('workstreams_get', {
  title: 'Get Workstream',
  description: 'Get a single workstream by ID',
  inputSchema: {
    id: z.string().describe('Workstream ID'),
  },
}, async ({ id }) => {
  const workstreams = readJsonFile<Workstream>('workstreams.json');
  const ws = workstreams.find(w => w.id === id);
  if (!ws) return jsonResult({ error: `Workstream not found: ${id}` });
  return jsonResult(ws);
});

server.registerTool('workstreams_create', {
  title: 'Create Workstream',
  description: 'Create a new workstream for the status deck',
  inputSchema: {
    id: z.string().describe('Unique workstream ID (kebab-case)'),
    title: z.string().describe('Workstream title'),
    priority: z.number().optional().default(0).describe('Priority (0 or 1)'),
    productInitiative: z.string().optional().default('').describe('Product initiative (e.g. Singularity, Windows, All)'),
    impact: z.string().optional().default('').describe('Impact description'),
    devMonthsTotal: z.number().optional().default(0).describe('Total dev months'),
    devMonthsRemain: z.number().optional().default(0).describe('Remaining dev months'),
    release: z.string().optional().default('').describe('Release name'),
    status: z.enum(['On Track', 'OFF TRACK', 'At risk']).optional().default('On Track')
      .describe('Workstream status'),
    targetCompletionDate: z.string().optional().default('').describe('Target completion (YYMM format)'),
    owners: z.array(z.string()).optional().default([]).describe('Team member IDs who own this workstream'),
    adoWorkItemId: z.number().nullable().optional().default(null).describe('ADO parent Scenario/Deliverable work item ID'),
    adoProject: z.string().optional().default('').describe('ADO project name (e.g. "OS")'),
    page: z.number().optional().default(1).describe('Deck page number'),
    sortOrder: z.number().optional().default(0).describe('Sort order within page'),
  },
}, async (args) => {
  const workstreams = readJsonFile<Workstream>('workstreams.json');
  const now = new Date().toISOString();
  const ws: Workstream = {
    id: args.id,
    title: args.title,
    priority: args.priority ?? 0,
    productInitiative: args.productInitiative ?? '',
    impact: args.impact ?? '',
    devMonthsTotal: args.devMonthsTotal ?? 0,
    devMonthsRemain: args.devMonthsRemain ?? 0,
    release: args.release ?? '',
    status: args.status ?? 'On Track',
    targetCompletionDate: args.targetCompletionDate ?? '',
    owners: args.owners ?? [],
    adoWorkItemId: args.adoWorkItemId ?? null,
    adoProject: args.adoProject ?? '',
    progressUpdates: [],
    page: args.page ?? 1,
    sortOrder: args.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  workstreams.push(ws);
  writeJsonFile('workstreams.json', workstreams);
  return jsonResult(ws);
});

server.registerTool('workstreams_update', {
  title: 'Update Workstream',
  description: 'Update an existing workstream by ID. Only provided fields are changed.',
  inputSchema: {
    id: z.string().describe('Workstream ID to update'),
    title: z.string().optional().describe('New title'),
    priority: z.number().optional().describe('New priority'),
    productInitiative: z.string().optional().describe('New product initiative'),
    impact: z.string().optional().describe('New impact'),
    devMonthsTotal: z.number().optional().describe('New total dev months'),
    devMonthsRemain: z.number().optional().describe('New remaining dev months'),
    release: z.string().optional().describe('New release'),
    status: z.enum(['On Track', 'OFF TRACK', 'At risk']).optional().describe('New status'),
    targetCompletionDate: z.string().optional().describe('New target completion date'),
    owners: z.array(z.string()).optional().describe('New owner IDs'),
    adoWorkItemId: z.number().nullable().optional().describe('ADO parent Scenario/Deliverable work item ID'),
    adoProject: z.string().optional().describe('ADO project name (e.g. "OS")'),
    page: z.number().optional().describe('New page number'),
    sortOrder: z.number().optional().describe('New sort order'),
  },
}, async (args) => {
  const workstreams = readJsonFile<Workstream>('workstreams.json');
  const index = workstreams.findIndex(w => w.id === args.id);
  if (index === -1) return jsonResult({ error: `Workstream not found: ${args.id}` });
  const ws = workstreams[index];
  if (args.title !== undefined) ws.title = args.title;
  if (args.priority !== undefined) ws.priority = args.priority;
  if (args.productInitiative !== undefined) ws.productInitiative = args.productInitiative;
  if (args.impact !== undefined) ws.impact = args.impact;
  if (args.devMonthsTotal !== undefined) ws.devMonthsTotal = args.devMonthsTotal;
  if (args.devMonthsRemain !== undefined) ws.devMonthsRemain = args.devMonthsRemain;
  if (args.release !== undefined) ws.release = args.release;
  if (args.status !== undefined) ws.status = args.status;
  if (args.targetCompletionDate !== undefined) ws.targetCompletionDate = args.targetCompletionDate;
  if (args.owners !== undefined) ws.owners = args.owners;
  if (args.adoWorkItemId !== undefined) ws.adoWorkItemId = args.adoWorkItemId;
  if (args.adoProject !== undefined) ws.adoProject = args.adoProject;
  if (args.page !== undefined) ws.page = args.page;
  if (args.sortOrder !== undefined) ws.sortOrder = args.sortOrder;
  ws.updatedAt = new Date().toISOString();
  workstreams[index] = ws;
  writeJsonFile('workstreams.json', workstreams);
  return jsonResult(ws);
});

server.registerTool('workstreams_delete', {
  title: 'Delete Workstream',
  description: 'Delete a workstream by ID',
  inputSchema: {
    id: z.string().describe('Workstream ID to delete'),
  },
}, async ({ id }) => {
  const workstreams = readJsonFile<Workstream>('workstreams.json');
  const filtered = workstreams.filter(w => w.id !== id);
  if (filtered.length === workstreams.length) return jsonResult({ error: `Workstream not found: ${id}` });
  writeJsonFile('workstreams.json', filtered);
  return jsonResult({ deleted: id });
});

server.registerTool('workstreams_add_update', {
  title: 'Add Workstream Update',
  description: 'Append a progress update entry to a workstream',
  inputSchema: {
    id: z.string().describe('Workstream ID'),
    date: z.string().describe('Update date (ISO 8601 date, e.g. 2026-03-12)'),
    text: z.string().describe('Progress update text (use tags like [finished], [ongoing], [Blocked])'),
    source: z.enum(['manual', 'workiq']).optional().default('manual')
      .describe('Source of the update'),
  },
}, async (args) => {
  const workstreams = readJsonFile<Workstream>('workstreams.json');
  const index = workstreams.findIndex(w => w.id === args.id);
  if (index === -1) return jsonResult({ error: `Workstream not found: ${args.id}` });
  const update: ProgressUpdate = {
    date: args.date,
    text: args.text,
    source: args.source ?? 'manual',
  };
  workstreams[index].progressUpdates.push(update);
  workstreams[index].updatedAt = new Date().toISOString();
  writeJsonFile('workstreams.json', workstreams);
  return jsonResult(workstreams[index]);
});

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
