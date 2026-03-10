import React, { useState, useEffect } from 'react';
import type { Task, TeamMember } from '@shared/types';
import { useIpc } from '../../hooks/useIpc';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onDo?: (task: Task) => void;
  onDelegate?: (task: Task, assigneeId: string) => void;
  onDefer?: (task: Task, days: number) => void;
  onDone?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMoveToInbox?: (task: Task) => void;
  onUpdate?: (task: Task) => void;
  compact?: boolean;
}

const DEFER_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

export function TaskCard({ task, onDo, onDelegate, onDefer, onDone, onDelete, onMoveToInbox, onUpdate, compact }: TaskCardProps) {
  const [showDelegateMenu, setShowDelegateMenu] = useState(false);
  const [showDeferMenu, setShowDeferMenu] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const { invoke } = useIpc();

  // Keep edit fields in sync when task prop changes (avoid stale state)
  useEffect(() => {
    if (!editing) {
      setEditTitle(task.title);
      setEditDescription(task.description);
    }
  }, [task.id, task.title, task.description, editing]);

  useEffect(() => {
    if (teamMembers.length === 0) {
      invoke<TeamMember[]>('team:list').then(setTeamMembers);
    }
  }, []);

  const handleDelegate = (memberId: string) => {
    onDelegate?.(task, memberId);
    setShowDelegateMenu(false);
  };

  const handleSaveEdit = () => {
    if (onUpdate && (editTitle !== task.title || editDescription !== task.description)) {
      onUpdate({ ...task, title: editTitle.trim(), description: editDescription.trim() });
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancelEdit();
  };

  const assigneeName = task.assigneeId
    ? teamMembers.find((m) => m.id === task.assigneeId)?.name ?? task.assigneeId
    : null;

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      {onDelete && (
        <button className={styles.btnDelete} onClick={() => onDelete(task)} title="Delete task">
          ✕
        </button>
      )}
      {editing ? (
        <div className={styles.editForm} onKeyDown={handleKeyDown}>
          <input
            className={styles.editTitle}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className={styles.editDescription}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
          />
          <div className={styles.editActions}>
            <button className={styles.btnSave} onClick={handleSaveEdit}>Save</button>
            <button className={styles.btnCancelEdit} onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {onUpdate && task.status !== 'done' ? (
            <h4
              className={`${styles.title} ${styles.editable}`}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
            >
              {task.title}
            </h4>
          ) : (
            <h4 className={styles.title}>{task.title}</h4>
          )}
          {!compact && task.description && <p className={styles.description}>{task.description}</p>}
          {!compact && !task.description && onUpdate && task.status !== 'done' && (
            <p
              className={styles.addDescription}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
            >
              + Add details
            </p>
          )}
        </>
      )}
      {assigneeName && <p className={styles.assignee}>→ {assigneeName}</p>}
      {task.deferUntil && (
        <p className={styles.deferDate}>
          💤 Until {new Date(task.deferUntil).toLocaleDateString()}
        </p>
      )}
      {task.status === 'done' && task.points != null && (
        <span className={styles.pointsBadge}>+{task.points} pts</span>
      )}

      {!compact && (
      <div className={styles.actions}>
        {task.status === 'inbox' && (
          <>
            {onDo && (
              <button className={styles.btnDo} onClick={() => onDo(task)}>
                Do
              </button>
            )}
            {onDelegate && (
              <div className={styles.delegateWrap}>
                <button
                  className={styles.btnDelegate}
                  onClick={() => setShowDelegateMenu(!showDelegateMenu)}
                >
                  Delegate
                </button>
                {showDelegateMenu && (
                  <ul className={styles.dropdown}>
                    {teamMembers.length === 0 && (
                      <li className={styles.dropdownEmpty}>No team members yet</li>
                    )}
                    {teamMembers.map((m) => (
                      <li key={m.id}>
                        <button
                          className={styles.dropdownItem}
                          onClick={() => handleDelegate(m.id)}
                        >
                          {m.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {onDefer && (
              <div className={styles.delegateWrap}>
                <button
                  className={styles.btnDefer}
                  onClick={() => setShowDeferMenu(!showDeferMenu)}
                >
                  Defer
                </button>
                {showDeferMenu && (
                  <ul className={styles.dropdown}>
                    {DEFER_OPTIONS.map((opt) => (
                      <li key={opt.days}>
                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            onDefer(task, opt.days);
                            setShowDeferMenu(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
        {task.status === 'scheduled' && onMoveToInbox && (
          <button className={styles.btnDefer} onClick={() => onMoveToInbox(task)}>
            ← Inbox
          </button>
        )}
        {task.status !== 'done' && onDone && (
          <button className={styles.btnDone} onClick={() => onDone(task)}>
            ✓
          </button>
        )}
      </div>
      )}

      {compact && onMoveToInbox && (
        <div className={styles.actions}>
          <button className={styles.btnDefer} onClick={() => onMoveToInbox(task)}>
            ← Inbox
          </button>
        </div>
      )}
    </div>
  );
}
