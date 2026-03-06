import React from 'react';
import { useEffect } from 'react';
import { useInboxStore } from './inboxStore';
import { TaskCard } from './TaskCard';
import { QuickAdd } from './QuickAdd';
import { useIpc } from '../../hooks/useIpc';
import type { Task, TeamMember } from '@shared/types';
import styles from './InboxView.module.css';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function InboxView() {
  const { tasks, setTasks, addTask, updateTask, removeTask, setLoading, loading } = useInboxStore();
  const { invoke } = useIpc();

  useEffect(() => {
    setLoading(true);
    invoke<Task[]>('tasks:list')
      .then(setTasks)
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
      createdAt: now,
      updatedAt: now,
    };
    addTask(task);
    await invoke('tasks:create', task);
  };

  const handleDo = async (task: Task) => {
    const updated: Task = { ...task, status: 'scheduled', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
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
  };

  const handleDefer = async (task: Task, days: number) => {
    const updated: Task = {
      ...task,
      deferUntil: new Date(Date.now() + days * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleUndefer = async (task: Task) => {
    const updated: Task = {
      ...task,
      deferUntil: null,
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleDone = async (task: Task) => {
    const updated: Task = { ...task, status: 'done', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleMoveToInbox = async (task: Task) => {
    const updated: Task = { ...task, status: 'inbox', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleDelete = async (task: Task) => {
    removeTask(task.id);
    await invoke('tasks:delete', task.id);
  };

  const now = new Date().toISOString();
  const inboxTasks = tasks.filter(
    (t) => t.status === 'inbox' && (!t.deferUntil || t.deferUntil <= now),
  );
  const snoozedTasks = tasks.filter(
    (t) => t.status === 'inbox' && t.deferUntil && t.deferUntil > now,
  );
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');
  const delegatedTasks = tasks.filter((t) => t.status === 'delegated');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.inbox}>
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
            />
          ))}
          {snoozedTasks.length > 0 && (
            <div className={styles.snoozed}>
              <h4 className={styles.snoozedHeader}>
                💤 Snoozed <span className={styles.count}>{snoozedTasks.length}</span>
              </h4>
              {snoozedTasks.map((task) => (
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
            <TaskCard key={task.id} task={task} onDone={handleDone} onDelete={handleDelete} onMoveToInbox={handleMoveToInbox} />
          ))}
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            📤 Delegated <span className={styles.count}>{delegatedTasks.length}</span>
          </h3>
          {delegatedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDone={handleDone} onDelete={handleDelete} compact />
          ))}
        </div>
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            ✅ Done <span className={styles.count}>{doneTasks.length}</span>
          </h3>
          {doneTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleDelete} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
