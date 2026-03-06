import React, { useState, useEffect } from 'react';
import type { Task, TeamMember } from '@shared/types';
import { useIpc } from '../../hooks/useIpc';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onDo?: (task: Task) => void;
  onDelegate?: (task: Task, assigneeId: string) => void;
  onDefer?: (task: Task) => void;
  onDone?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onDo, onDelegate, onDefer, onDone, onDelete, compact }: TaskCardProps) {
  const [showDelegateMenu, setShowDelegateMenu] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { invoke } = useIpc();

  useEffect(() => {
    if (showDelegateMenu && teamMembers.length === 0) {
      invoke<TeamMember[]>('team:list').then(setTeamMembers);
    }
  }, [showDelegateMenu]);

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
              <button className={styles.btnDefer} onClick={() => onDefer(task)}>
                Defer
              </button>
            )}
          </>
        )}
        {task.status !== 'done' && onDone && (
          <button className={styles.btnDone} onClick={() => onDone(task)}>
            ✓
          </button>
        )}
      </div>
      )}
    </div>
  );
}
