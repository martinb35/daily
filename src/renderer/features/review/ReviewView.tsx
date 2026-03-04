import React from 'react';
import { useEffect } from 'react';
import { useReviewStore } from './reviewStore';
import { useIpc } from '../../hooks/useIpc';
import type { ReviewSnapshot } from '@shared/types';
import styles from './ReviewView.module.css';

export function ReviewView() {
  const { reviews, setReviews, setLoading, loading } = useReviewStore();
  const { invoke } = useIpc();

  useEffect(() => {
    setLoading(true);
    invoke<ReviewSnapshot[]>('reviews:list')
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.review}>
      <h2 className={styles.heading}>Weekly Review</h2>
      {reviews.length === 0 ? (
        <p className={styles.empty}>No reviews yet. Complete your first weekly review!</p>
      ) : (
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li key={r.id} className={styles.item}>
              <span className={styles.week}>Week of {r.weekOf}</span>
              <span className={styles.stats}>
                ✅ {r.completedTaskIds.length} done · 📤 {r.delegatedTaskIds.length} delegated · ⏳{' '}
                {r.deferredTaskIds.length} deferred
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
