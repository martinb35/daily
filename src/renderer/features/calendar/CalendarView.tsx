import React from 'react';
import { useEffect } from 'react';
import { useCalendarStore } from './calendarStore';
import { TimeBlockCard } from './TimeBlockCard';
import { useIpc } from '../../hooks/useIpc';
import type { TimeBlock } from '@shared/types';
import styles from './CalendarView.module.css';

export function CalendarView() {
  const { timeblocks, setTimeblocks, selectedDate, setLoading, loading } = useCalendarStore();
  const { invoke } = useIpc();

  useEffect(() => {
    setLoading(true);
    invoke<TimeBlock[]>('timeblocks:list')
      .then(setTimeblocks)
      .finally(() => setLoading(false));
  }, []);

  const todayBlocks = timeblocks.filter((b) => b.start.startsWith(selectedDate));

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.calendar}>
      <h2 className={styles.heading}>Calendar – {selectedDate}</h2>
      {todayBlocks.length === 0 ? (
        <p className={styles.empty}>No time blocks scheduled for today.</p>
      ) : (
        todayBlocks.map((block) => <TimeBlockCard key={block.id} block={block} />)
      )}
    </div>
  );
}
