import type { Task } from '@shared/types';

/**
 * Auto-calculate points for a completed task based on perceived impact and effort.
 *
 * Scoring breakdown:
 *   Base:           10 pts  — every completed task earns a baseline
 *   Had due date:   +5 pts  — time-sensitive work shows urgency
 *   Was delegated:  +5 pts  — managing others takes coordination effort
 *   Was deferred:   +3 pts  — came back to it (follow-through)
 *   Detailed desc:  +2 pts  — substantive work (description > 100 chars)
 *   Quick (< 1 day):+3 pts  — responsive execution
 *   Long (> 3 days): +5 pts — sustained effort over time
 *
 * Max possible: 30 pts (base + due + delegated + deferred + detailed + long-running)
 */
export function calculatePoints(task: Task): number {
  let points = 10;

  if (task.dueDate) points += 5;
  if (task.assigneeId) points += 5;
  if (task.deferUntil) points += 3;
  if (task.description.length > 100) points += 2;

  const ageMs = Date.now() - new Date(task.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < 1) {
    points += 3; // quick turnaround
  } else if (ageDays > 3) {
    points += 5; // sustained effort
  }

  return points;
}
