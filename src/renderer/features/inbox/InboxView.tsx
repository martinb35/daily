import React from 'react';
import { useEffect } from 'react';
import { useInboxStore } from './inboxStore';
import { TaskCard } from './TaskCard';
import { useIpc } from '../../hooks/useIpc';
import type { Task } from '@shared/types';
import styles from './InboxView.module.css';

export function InboxView() {
  const { tasks, setTasks, updateTask, setLoading, loading } = useInboxStore();
  const { invoke } = useIpc();

  useEffect(() => {
    setLoading(true);
    invoke<Task[]>('tasks:list')
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const handleDo = async (task: Task) => {
    const updated: Task = { ...task, status: 'scheduled', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleDelegate = async (task: Task) => {
    const updated: Task = { ...task, status: 'delegated', updatedAt: new Date().toISOString() };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const handleDefer = async (task: Task) => {
    const updated: Task = {
      ...task,
      deferUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await invoke('tasks:update', updated);
    updateTask(updated);
  };

  const inboxTasks = tasks.filter((t) => t.status === 'inbox');

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.inbox}>
      <h2 className={styles.heading}>Inbox ({inboxTasks.length})</h2>
      {inboxTasks.length === 0 ? (
        <p className={styles.empty}>All clear! No tasks to triage.</p>
      ) : (
        inboxTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDo={handleDo}
            onDelegate={handleDelegate}
            onDefer={handleDefer}
          />
        ))
      )}
    </div>
  );
}
