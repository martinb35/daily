import { describe, it, expect } from 'vitest';
import { calculatePoints } from './scoring';
import type { Task } from '@shared/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-1',
    title: 'Test task',
    description: '',
    status: 'inbox',
    assigneeId: null,
    dueDate: null,
    deferUntil: null,
    points: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('calculatePoints', () => {
  it('awards base 10 points for a simple task', () => {
    // Created just now = quick turnaround (+3)
    const task = makeTask();
    expect(calculatePoints(task)).toBe(13);
  });

  it('awards +5 for tasks with a due date', () => {
    const task = makeTask({ dueDate: '2026-03-15' });
    expect(calculatePoints(task)).toBe(18); // 10 base + 5 due + 3 quick
  });

  it('awards +5 for delegated tasks', () => {
    const task = makeTask({ assigneeId: 'member-1' });
    expect(calculatePoints(task)).toBe(18); // 10 base + 5 delegated + 3 quick
  });

  it('awards +3 for deferred tasks (follow-through)', () => {
    const task = makeTask({ deferUntil: '2026-03-08T00:00:00Z' });
    expect(calculatePoints(task)).toBe(16); // 10 base + 3 deferred + 3 quick
  });

  it('awards +2 for detailed descriptions (> 100 chars)', () => {
    const task = makeTask({ description: 'x'.repeat(101) });
    expect(calculatePoints(task)).toBe(15); // 10 base + 2 detailed + 3 quick
  });

  it('awards +5 for long-running tasks (> 3 days old)', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString();
    const task = makeTask({ createdAt: fourDaysAgo });
    expect(calculatePoints(task)).toBe(15); // 10 base + 5 long-running
  });

  it('stacks all bonuses for max points', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString();
    const task = makeTask({
      dueDate: '2026-03-15',
      assigneeId: 'member-1',
      deferUntil: '2026-03-08T00:00:00Z',
      description: 'x'.repeat(101),
      createdAt: fourDaysAgo,
    });
    // 10 base + 5 due + 5 delegated + 3 deferred + 2 detailed + 5 long-running = 30
    expect(calculatePoints(task)).toBe(30);
  });
});
