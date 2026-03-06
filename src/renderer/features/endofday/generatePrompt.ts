import type { Task, TimeBlock, TeamMember } from '@shared/types';

interface PromptContext {
  today: string;
  dataPath: string;
  tasks: Task[];
  timeblocks: TimeBlock[];
  team: TeamMember[];
}

function todayBlocks(timeblocks: TimeBlock[], today: string): TimeBlock[] {
  return timeblocks.filter((b) => b.start.startsWith(today));
}

function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'inbox' || t.status === 'delegated' || t.status === 'scheduled');
}

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function generatePrompt(ctx: PromptContext): string {
  const blocks = todayBlocks(ctx.timeblocks, ctx.today);
  const active = activeTasks(ctx.tasks);

  return `# End My Day — Daily App Workflow

**Date:** ${ctx.today}
**Data directory:** ${ctx.dataPath}

## Current State

### Active Tasks (${active.length})
${active.length > 0 ? formatJson(active) : 'No active tasks.'}

### Today's Time Blocks (${blocks.length})
${blocks.length > 0 ? formatJson(blocks) : 'No time blocks for today.'}

### Team Members (${ctx.team.length})
${ctx.team.length > 0 ? formatJson(ctx.team) : 'No team members configured.'}

## Workflow Instructions

Run the following end-of-day workflow using WorkIQ (Microsoft 365 Copilot) and update my Daily app data files directly.

### 1. Action Items from Today's Meetings
Query WorkIQ for action items and follow-ups from today's meetings. For each action item:
- Create a new task in \`tasks.json\` with status \`"inbox"\`
- Include the meeting name in the task description
- Set a reasonable due date if one was mentioned

### 2. Unanswered Emails
Query WorkIQ for important emails I received today that still need a response. For each:
- Create a new task in \`tasks.json\` with status \`"inbox"\`
- Title format: "Reply to: {subject}"
- Include sender and brief context in the description

### 3. Meeting Attendance Check
Query WorkIQ for all my meetings today with attendance status. Compare against today's time blocks above.
- Add any attended meetings missing from \`timeblocks.json\`
- For meetings with an in-person option where I didn't join Teams, ask me if I attended
- Don't add meetings that were online-only and I didn't join
- Colors: \`#2ECC71\` for 1:1s, \`#4A90D9\` for team meetings, \`#E67E22\` for external, \`#9B59B6\` for focus time

### 4. Tomorrow's Prep
Query WorkIQ for my calendar tomorrow. For any meeting that would benefit from preparation:
- Create a task in \`tasks.json\` with status \`"inbox"\`
- Title format: "Prep: {meeting name}"
- Include meeting time, attendees, and suggested prep in the description
- Set \`dueDate\` to tomorrow's date

## Data Format Reference

**Task:**
\`\`\`json
{
  "id": "string (kebab-case, e.g. action-meeting-name-date)",
  "title": "string",
  "description": "string",
  "status": "inbox",
  "assigneeId": null,
  "dueDate": "ISO 8601 date string or null",
  "deferUntil": null,
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
\`\`\`

**TimeBlock:**
\`\`\`json
{
  "id": "string (e.g. mtg-name-date)",
  "title": "string",
  "start": "ISO 8601 datetime with timezone",
  "end": "ISO 8601 datetime with timezone",
  "taskIds": [],
  "color": "#hex"
}
\`\`\`
`;
}
