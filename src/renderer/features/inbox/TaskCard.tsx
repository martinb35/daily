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
  compact?: boolean;
}

const DEFER_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

export function TaskCard({ task, onDo, onDelegate, onDefer, onDone, onDelete, onMoveToInbox, compact }: TaskCardProps) {
  const [showDelegateMenu, setShowDelegateMenu] = useState(false);
  const [showDeferMenu, setShowDeferMenu] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { invoke } = useIpc();

  useEffect(() => {
    if (teamMembers.length === 0) {
      invoke<TeamMember[]>('team:list').then(setTeamMembers);
    }
  }, []);

  const handleDelegate = (memberId: string) => {
    onDelegate?.(task, memberId);
    setShowDelegateMenu(false);
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
      <h4 className={styles.title}>{task.title}</h4>
      {!compact && task.description && <p className={styles.description}>{task.description}</p>}
      {assigneeName && <p className={styles.assignee}>→ {assigneeName}</p>}
      {task.deferUntil && (
        <p className={styles.deferDate}>
          💤 Until {new Date(task.deferUntil).toLocaleDateString()}
        </p>
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
