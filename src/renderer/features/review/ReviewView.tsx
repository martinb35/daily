import React, { useEffect, useState } from 'react';
import { useReviewStore } from './reviewStore';
import { useIpc } from '../../hooks/useIpc';
import type { ReviewSnapshot, Task, TeamMember, WeeklyScore } from '@shared/types';
import styles from './ReviewView.module.css';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function formatWeek(weekOf: string): string {
  const d = new Date(weekOf + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ReviewView() {
  const { reviews, setReviews, addReview, setLoading, loading } = useReviewStore();
  const { invoke } = useIpc();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [notes, setNotes] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scores, setScores] = useState<WeeklyScore[]>([]);

  const thisWeek = getMonday(new Date());
  const hasReviewThisWeek = reviews.some((r) => r.weekOf === thisWeek);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      invoke<ReviewSnapshot[]>('reviews:list'),
      invoke<Task[]>('tasks:list'),
      invoke<TeamMember[]>('team:list'),
      invoke<WeeklyScore[]>('scores:list'),
    ])
      .then(([reviewData, taskData, teamData, scoreData]) => {
        setReviews(reviewData);
        setTasks(taskData);
        setTeam(teamData);
        setScores(scoreData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter done tasks to current week only (Mon–Sun)
  const weekStart = new Date();
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);
  const doneTasks = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updatedAt) >= weekStart,
  );
  const delegatedTasks = tasks.filter((t) => t.status === 'delegated');
  const deferredTasks = tasks.filter((t) => t.deferUntil !== null && t.status === 'inbox');
  const inboxTasks = tasks.filter((t) => t.status === 'inbox' && !t.deferUntil);
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');

  const getAssigneeName = (id: string | null) =>
    id ? team.find((m) => m.id === id)?.name ?? 'Unknown' : null;

  const handleCreateReview = async () => {
    const totalPointsFromTasks = doneTasks.reduce(
      (sum, task) => sum + (task.points ?? 0),
      0,
    );
    const review: ReviewSnapshot = {
      id: generateId(),
      weekOf: thisWeek,
      completedTaskIds: doneTasks.map((t) => t.id),
      delegatedTaskIds: delegatedTasks.map((t) => t.id),
      deferredTaskIds: deferredTasks.map((t) => t.id),
      totalPoints: totalPointsFromTasks,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    addReview(review);
    await invoke('reviews:create', review);
    setNotes('');
    setShowCreate(false);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.review}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Weekly Review</h2>
        {!hasReviewThisWeek && !showCreate && (
          <button className={styles.btnStart} onClick={() => setShowCreate(true)}>
            Start This Week's Review
          </button>
        )}
      </div>

      {showCreate && (
        <div className={styles.createPanel}>
          <h3 className={styles.panelTitle}>Week of {formatWeek(thisWeek)}</h3>

          <div className={styles.summary}>
            <div className={`${styles.summaryCard} ${styles.pointsCard}`}>
              <div className={styles.summaryNumber}>
                {scores.find((s) => s.weekOf === thisWeek)?.totalPoints ?? 0}
              </div>
              <div className={styles.summaryLabel}>⭐ Points</div>
              <div className={styles.highScoreNote}>
                Best: {scores.reduce((max, s) => Math.max(max, s.totalPoints), 0)} pts
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryNumber}>{doneTasks.length}</div>
              <div className={styles.summaryLabel}>✅ Completed</div>
              <ul className={styles.taskList}>
                {doneTasks.map((t) => (
                  <li key={t.id} className={styles.taskItem}>{t.title}</li>
                ))}
              </ul>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryNumber}>{delegatedTasks.length}</div>
              <div className={styles.summaryLabel}>📤 Delegated</div>
              <ul className={styles.taskList}>
                {delegatedTasks.map((t) => (
                  <li key={t.id} className={styles.taskItem}>
                    {t.title} → {getAssigneeName(t.assigneeId)}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryNumber}>{deferredTasks.length}</div>
              <div className={styles.summaryLabel}>⏳ Deferred</div>
              <ul className={styles.taskList}>
                {deferredTasks.map((t) => (
                  <li key={t.id} className={styles.taskItem}>{t.title}</li>
                ))}
              </ul>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryNumber}>{inboxTasks.length + scheduledTasks.length}</div>
              <div className={styles.summaryLabel}>📋 Open</div>
              <ul className={styles.taskList}>
                {[...inboxTasks, ...scheduledTasks].map((t) => (
                  <li key={t.id} className={styles.taskItem}>
                    {t.title} <span className={styles.statusBadge}>{t.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.notesField}>
            <label className={styles.notesLabel}>Reflection notes</label>
            <textarea
              className={styles.notesInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? What could improve? What do I need to focus on next week?"
              rows={4}
            />
          </div>

          <div className={styles.createActions}>
            <button className={styles.btnSave} onClick={handleCreateReview}>
              Save Review
            </button>
            <button className={styles.btnCancel} onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>Past Reviews</h3>
          {[...reviews].reverse().map((r) => (
            <div key={r.id} className={styles.historyItem}>
              <div
                className={styles.historyHeader}
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <span className={styles.historyWeek}>Week of {formatWeek(r.weekOf)}</span>
                <span className={styles.historyStats}>
                  ⭐ {r.totalPoints ?? 0} pts · ✅ {r.completedTaskIds.length} · 📤 {r.delegatedTaskIds.length} · ⏳{' '}
                  {r.deferredTaskIds.length}
                </span>
                <span className={styles.expandIcon}>{expandedId === r.id ? '▾' : '▸'}</span>
              </div>
              {expandedId === r.id && (
                <div className={styles.historyBody}>
                  {r.notes && <p className={styles.historyNotes}>{r.notes}</p>}
                  <div className={styles.historyDetail}>
                    <div>
                      <strong>Completed ({r.completedTaskIds.length})</strong>
                      <ul className={styles.taskList}>
                        {r.completedTaskIds.map((id) => {
                          const t = tasks.find((task) => task.id === id);
                          return <li key={id} className={styles.taskItem}>{t?.title ?? id}</li>;
                        })}
                      </ul>
                    </div>
                    <div>
                      <strong>Delegated ({r.delegatedTaskIds.length})</strong>
                      <ul className={styles.taskList}>
                        {r.delegatedTaskIds.map((id) => {
                          const t = tasks.find((task) => task.id === id);
                          return <li key={id} className={styles.taskItem}>{t?.title ?? id}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !showCreate && (
        <p className={styles.empty}>No reviews yet. Start your first weekly review!</p>
      )}
    </div>
  );
}
