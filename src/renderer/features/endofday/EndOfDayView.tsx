import React, { useEffect, useState } from 'react';
import { useIpc } from '../../hooks/useIpc';
import { useSound } from '../../hooks/useSound';
import { generatePrompt } from './generatePrompt';
import type { Task, TimeBlock, TeamMember } from '@shared/types';
import styles from './EndOfDayView.module.css';

export function EndOfDayView() {
  const { invoke } = useIpc();
  const playSound = useSound();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeblocks, setTimeblocks] = useState<TimeBlock[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [dataPath, setDataPath] = useState('');
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showEditor, setShowEditor] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayBlocks = timeblocks.filter((b) => b.start.startsWith(todayStr));
  const activeTasks = tasks.filter(
    (t) => t.status === 'inbox' || t.status === 'delegated' || t.status === 'scheduled',
  );

  useEffect(() => {
    Promise.all([
      invoke<Task[]>('tasks:list'),
      invoke<TimeBlock[]>('timeblocks:list'),
      invoke<TeamMember[]>('team:list'),
      invoke<string>('app:getDataPath'),
    ])
      .then(([t, tb, tm, dp]) => {
        setTasks(t);
        setTimeblocks(tb);
        setTeam(tm);
        setDataPath(dp);
      })
      .finally(() => setLoading(false));
  }, []);

  const getPrompt = () => generatePrompt({ today: todayStr, dataPath, tasks, timeblocks, team });

  const handleGenerate = async () => {
    try {
      const prompt = showEditor && editedPrompt ? editedPrompt : getPrompt();
      await navigator.clipboard.writeText(prompt);
      setStatus('copied');
      playSound('copy');
    } catch {
      setStatus('error');
    }
  };

  const handleToggleEditor = () => {
    if (!showEditor) {
      setEditedPrompt(getPrompt());
    }
    setShowEditor(!showEditor);
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🌙 End My Day</h2>
      <p className={styles.subtitle}>
        Generate a prompt for Copilot CLI to wrap up your day — action items,
        unanswered emails, attendance check, and tomorrow's prep.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{todayBlocks.length}</div>
          <div className={styles.statLabel}>Meetings Today</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{activeTasks.length}</div>
          <div className={styles.statLabel}>Active Tasks</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{team.length}</div>
          <div className={styles.statLabel}>Team Members</div>
        </div>
      </div>

      <ul className={styles.checklist}>
        <li className={styles.checkItem}>
          <span className={styles.checkIcon}>📋</span>
          <div className={styles.checkLabel}>
            <strong>Action Items</strong>
            <span>Surface follow-ups from today's meetings</span>
          </div>
        </li>
        <li className={styles.checkItem}>
          <span className={styles.checkIcon}>📧</span>
          <div className={styles.checkLabel}>
            <strong>Unanswered Emails</strong>
            <span>Find emails that still need a response</span>
          </div>
        </li>
        <li className={styles.checkItem}>
          <span className={styles.checkIcon}>✅</span>
          <div className={styles.checkLabel}>
            <strong>Attendance Check</strong>
            <span>Verify and update today's meeting attendance</span>
          </div>
        </li>
        <li className={styles.checkItem}>
          <span className={styles.checkIcon}>📅</span>
          <div className={styles.checkLabel}>
            <strong>Tomorrow's Prep</strong>
            <span>Suggest prep tasks for upcoming meetings</span>
          </div>
        </li>
      </ul>

      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={loading}
      >
        Copy Prompt to Clipboard
      </button>

      <button className={styles.editToggle} onClick={handleToggleEditor}>
        {showEditor ? 'Hide prompt' : '✎ View / edit prompt'}
      </button>

      {showEditor && (
        <textarea
          className={styles.promptEditor}
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          spellCheck={false}
        />
      )}

      {status === 'copied' && (
        <div className={`${styles.status} ${styles.success}`}>
          ✓ Prompt copied! Paste it into Copilot CLI to run your end-of-day workflow.
        </div>
      )}
      {status === 'error' && (
        <div className={`${styles.status} ${styles.error}`}>
          Failed to copy. Check clipboard permissions.
        </div>
      )}
    </div>
  );
}
