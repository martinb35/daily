import React, { useState } from 'react';
import type { TimeBlock, Task } from '@shared/types';
import styles from './BlockForm.module.css';

interface BlockFormProps {
  date: string;
  startHour: number;
  tasks: Task[];
  initial?: TimeBlock;
  onSave: (block: TimeBlock) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e94560'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function BlockForm({ date, startHour, tasks, initial, onSave, onDelete, onCancel }: BlockFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [startTime, setStartTime] = useState(
    initial ? initial.start.slice(11, 16) : `${pad(startHour)}:00`,
  );
  const [endTime, setEndTime] = useState(
    initial ? initial.end.slice(11, 16) : `${pad(startHour + 1)}:00`,
  );
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(initial?.taskIds ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? generateId(),
      title: title.trim(),
      start: `${date}T${startTime}:00`,
      end: `${date}T${endTime}:00`,
      taskIds: linkedTaskIds,
      color,
    });
  };

  const toggleTask = (taskId: string) => {
    setLinkedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled' || t.status === 'inbox');

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What are you working on?"
        autoFocus
      />
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Start</label>
          <input
            className={styles.timeInput}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>End</label>
          <input
            className={styles.timeInput}
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Color</label>
        <div className={styles.colors}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.colorDot} ${c === color ? styles.colorSelected : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      {scheduledTasks.length > 0 && (
        <div className={styles.field}>
          <label className={styles.label}>Link tasks</label>
          <div className={styles.taskList}>
            {scheduledTasks.map((t) => (
              <label key={t.id} className={styles.taskOption}>
                <input
                  type="checkbox"
                  checked={linkedTaskIds.includes(t.id)}
                  onChange={() => toggleTask(t.id)}
                />
                {t.title}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className={styles.actions}>
        <button className={styles.btnSave} type="submit">
          {initial ? 'Save' : 'Create Block'}
        </button>
        {initial && onDelete && (
          <button
            className={styles.btnDelete}
            type="button"
            onClick={() => onDelete(initial.id)}
          >
            Delete
          </button>
        )}
        <button className={styles.btnCancel} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
