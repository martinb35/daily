import React from 'react';
import type { WeeklyScore } from '@shared/types';
import styles from './PointsWidget.module.css';

interface PointsWidgetProps {
  currentScore: WeeklyScore | null;
  highScore: number;
  weekPoints: number;
  weekTaskCount: number;
}

export function PointsWidget({ currentScore, highScore, weekPoints, weekTaskCount }: PointsWidgetProps) {
  const points = weekPoints;
  const tasks = weekTaskCount;
  const isNewRecord = points > 0 && points >= highScore;
  const progress = highScore > 0 ? Math.min((points / highScore) * 100, 100) : 0;

  return (
    <div className={styles.widget}>
      <div className={styles.score}>
        <span className={styles.trophy}>{isNewRecord ? '🏆' : '⭐'}</span>
        <span className={styles.points}>{points}</span>
        <span className={styles.label}>pts this week</span>
        <span className={styles.separator}>·</span>
        <span className={styles.tasks}>{tasks} task{tasks !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.highScore}>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${isNewRecord ? styles.record : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.highLabel}>
          {isNewRecord ? '🔥 New record!' : `Best: ${highScore} pts`}
        </span>
      </div>
    </div>
  );
}
