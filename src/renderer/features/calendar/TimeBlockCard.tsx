import React from 'react';
import type { TimeBlock as TimeBlockType } from '@shared/types';
import styles from './TimeBlockCard.module.css';

interface TimeBlockCardProps {
  block: TimeBlockType;
}

export function TimeBlockCard({ block }: TimeBlockCardProps) {
  const startTime = new Date(block.start).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = new Date(block.end).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={styles.block} style={{ borderLeftColor: block.color }}>
      <div className={styles.time}>
        {startTime} – {endTime}
      </div>
      <h4 className={styles.title}>{block.title}</h4>
      {block.taskIds.length > 0 && (
        <p className={styles.linked}>{block.taskIds.length} linked task(s)</p>
      )}
    </div>
  );
}
