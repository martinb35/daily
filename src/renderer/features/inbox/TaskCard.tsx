import React from 'react';
import type { Task } from '@shared/types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onDo: (task: Task) => void;
  onDelegate: (task: Task) => void;
  onDefer: (task: Task) => void;
}

export function TaskCard({ task, onDo, onDelegate, onDefer }: TaskCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{task.title}</h3>
        <span className={styles.status}>{task.status}</span>
      </div>
      {task.description && <p className={styles.description}>{task.description}</p>}
      {task.status === 'inbox' && (
        <div className={styles.actions}>
          <button className={styles.btnDo} onClick={() => onDo(task)}>
            Do
          </button>
          <button className={styles.btnDelegate} onClick={() => onDelegate(task)}>
            Delegate
          </button>
          <button className={styles.btnDefer} onClick={() => onDefer(task)}>
            Defer
          </button>
        </div>
      )}
    </div>
  );
}
