import React, { useState } from 'react';
import { useEffect } from 'react';
import { useInboxStore } from './inboxStore';
import { TaskCard } from './TaskCard';
import { QuickAdd } from './QuickAdd';
import { PointsWidget } from './PointsWidget';
import { calculatePoints } from './scoring';
import { useIpc } from '../../hooks/useIpc';
import type { Task, TeamMember, WeeklyScore } from '@shared/types';
import { useSound } from '../../hooks/useSound';
import styles from './InboxView.module.css';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function InboxView() {
  const { tasks, setTasks, addTask, updateTask, removeTask, setLoading, loading } = useInboxStore();
  const { invoke } = useIpc();
  const playSound = useSound();
  const [snoozedOpen, setSnoozedOpen] = useState(false);
  const [scores, setScores] = useState<WeeklyScore[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      invoke<Task[]>('tasks:list'),
      invoke<WeeklyScore[]>('scores:list'),
    ])
      .then(([taskData, scoreData]) => {
        setTasks(taskData);
        setScores(scoreData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleQuickAdd = async (title: string) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      title,
      description: '',
      status: 'inbox',
      assigneeId: null,
      dueDate: null,
      deferUntil: null,
      points: null,
      createdAt: now,
      updatedAt: now,
    };
    addTask(task);
    playSound('add');
    await invoke('tasks:create', task);
  };

  const handleDo = async (task: Task) => {
    const updated: Task = { ...task, status: 'scheduled', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('triage');
  };

  const handleDelegate = async (task: Task, assigneeId: string) => {
    const updated: Task = {
      ...task,
      status: 'delegated',
      assigneeId,
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('triage');
  };

  const handleDefer = async (task: Task, days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    target.setHours(7, 0, 0, 0); // 7 AM local (PST/PDT)
    const updated: Task = {
      ...task,
      deferUntil: target.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('defer');
  };

  const handleUndefer = async (task: Task) => {
    const updated: Task = {
      ...task,
      deferUntil: null,
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('moveBack');
  };

  const handleDone = async (task: Task) => {
    const pts = calculatePoints(task);
    const updated: Task = { ...task, status: 'done', points: pts, updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('complete');

    // Update weekly score using functional state update to avoid stale closures
    const monday = getMonday(new Date());
    let scoreToPersist: WeeklyScore | null = null;
    let isUpdate = false;

    setScores((prev) => {
      const existing = prev.find((s) => s.weekOf === monday);
      if (existing) {
        const updatedScore: WeeklyScore = {
          ...existing,
          totalPoints: existing.totalPoints + pts,
          tasksCompleted: existing.tasksCompleted + 1,
          updatedAt: new Date().toISOString(),
        };
        scoreToPersist = updatedScore;
        isUpdate = true;
        return prev.map((s) => (s.id === existing.id ? updatedScore : s));
      } else {
        const newScore: WeeklyScore = {
          id: generateId(),
          weekOf: monday,
          totalPoints: pts,
          tasksCompleted: 1,
          updatedAt: new Date().toISOString(),
        };
        scoreToPersist = newScore;
        isUpdate = false;
        return [...prev, newScore];
      }
    });

    if (scoreToPersist) {
      await invoke(isUpdate ? 'scores:update' : 'scores:create', scoreToPersist);
    }
  };

  const handleMoveToInbox = async (task: Task) => {
    const updated: Task = { ...task, status: 'inbox', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
    playSound('moveBack');
  };

  const handleDelete = async (task: Task) => {
    removeTask(task.id);
    playSound('delete');
    await invoke('tasks:delete', task.id);
  };

  const handleUpdate = async (task: Task) => {
    const updated: Task = { ...task, updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const now = new Date();
  const nowIso = now.toISOString();
  const inboxTasks = tasks.filter(
    (t) => t.status === 'inbox' && (!t.deferUntil || t.deferUntil <= nowIso),
  );
  const snoozedTasks = tasks.filter(
    (t) => t.status === 'inbox' && t.deferUntil && t.deferUntil > nowIso,
  );
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');
  const delegatedTasks = tasks.filter((t) => t.status === 'delegated');

  // Done column only shows tasks completed in the current week (Mon–Sun)
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);
  const doneTasks = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updatedAt) >= weekStart,
  );

  // Points tracking — derive from actual done tasks for accuracy
  const thisMonday = getMonday(now);
  const currentScore = scores.find((s) => s.weekOf === thisMonday) ?? null;
  const weekPoints = doneTasks.reduce((sum, t) => sum + (t.points ?? 0), 0);
  const weekTaskCount = doneTasks.length;
  const highScore = Math.max(
    scores.reduce((max, s) => Math.max(max, s.totalPoints), 0),
    weekPoints,
  );

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.inbox}>
      <PointsWidget currentScore={currentScore} highScore={highScore} weekPoints={weekPoints} weekTaskCount={weekTaskCount} />
      <QuickAdd onAdd={handleQuickAdd} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            📥 Inbox <span className={styles.count}>{inboxTasks.length}</span>
          </h3>
          {inboxTasks.length === 0 && <p className={styles.empty}>All clear!</p>}
          {inboxTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDo={handleDo}
              onDelegate={handleDelegate}
              onDefer={handleDefer}
              onDone={handleDone}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
          {snoozedTasks.length > 0 && (
            <div className={styles.snoozed}>
              <h4
                className={styles.snoozedHeader}
                onClick={() => setSnoozedOpen(!snoozedOpen)}
              >
                <span className={styles.toggle}>{snoozedOpen ? '▾' : '▸'}</span>
                💤 Snoozed <span className={styles.count}>{snoozedTasks.length}</span>
              </h4>
              {snoozedOpen && snoozedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMoveToInbox={handleUndefer}
                  onDelete={handleDelete}
                  compact
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            🎯 Do <span className={styles.count}>{scheduledTasks.length}</span>
          </h3>
          {scheduledTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDone={handleDone} onDelete={handleDelete} onMoveToInbox={handleMoveToInbox} onUpdate={handleUpdate} />
          ))}
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            📤 Delegated <span className={styles.count}>{delegatedTasks.length}</span>
          </h3>
          {delegatedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDone={handleDone} onDelete={handleDelete} onUpdate={handleUpdate} compact />
          ))}
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            ✅ Done <span className={styles.count}>{doneTasks.length}</span>
            {weekPoints > 0 && (
              <span className={styles.donePoints}>+{weekPoints} pts</span>
            )}
          </h3>
          {doneTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleDelete} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
