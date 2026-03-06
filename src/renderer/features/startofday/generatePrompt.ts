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

  return `# Start My Day — Daily App Workflow

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

Run the following start-of-day workflow using WorkIQ (Microsoft 365 Copilot) and update my Daily app data files directly.

### 1. Meeting Review
Query WorkIQ for all my meetings today with their acceptance status.
- List each meeting with time, attendees, and whether I've accepted/tentative/declined
- For meetings I haven't responded to, suggest accept or decline with a brief reason
- Ask me to confirm your suggestions before updating
- Add any confirmed meetings missing from \`timeblocks.json\`
- Colors: \`#2ECC71\` for 1:1s, \`#4A90D9\` for team meetings, \`#E67E22\` for external, \`#9B59B6\` for focus time

### 2. Teams & Email Check
Query WorkIQ for Teams messages and emails I received since yesterday that need a response. For each:
- Create a new task in \`tasks.json\` with status \`"inbox"\`
- For emails: Title format "Reply to: {subject}", include sender and context in description
- For Teams messages: Title format "Respond to: {sender} re: {topic}", include channel/chat context
- Skip messages that are purely informational and don't need a reply

### 3. Task Scheduling
Look at my current active tasks (listed above) and today's calendar. For tasks without a scheduled time block:
- Identify free slots in my calendar today
- Suggest time blocks for working on tasks, prioritizing by due date and importance
- Create the suggested time blocks in \`timeblocks.json\` with linked \`taskIds\`
- Use color \`#9B59B6\` for focus/task blocks
- Ask me to confirm before writing

### 4. Wellness Breaks
After scheduling tasks, look at the remaining gaps in my day and suggest breaks:
- A short walk (15–20 min) ideally mid-morning or after lunch
- Stretch breaks (5–10 min) roughly every 90 minutes of desk time
- At least one proper break away from the screen
- Add these as time blocks in \`timeblocks.json\` with color \`#1ABC9C\`
- Title format: "🚶 Walk", "🧘 Stretch", etc.
- Ask me to confirm before writing

## Data Format Reference

**Task:**
\`\`\`json
{
  "id": "string (kebab-case, e.g. reply-subject-date)",
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
  "id": "string (e.g. mtg-name-date or focus-task-date)",
  "title": "string",
  "start": "ISO 8601 datetime with timezone",
  "end": "ISO 8601 datetime with timezone",
  "taskIds": [],
  "color": "#hex"
}
\`\`\`
`;
}
