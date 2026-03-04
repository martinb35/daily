import React from 'react';
import { useEffect } from 'react';
import { useTeamStore } from './teamStore';
import { MemberCard } from './MemberCard';
import { useIpc } from '../../hooks/useIpc';
import type { TeamMember } from '@shared/types';
import styles from './TeamView.module.css';

export function TeamView() {
  const { members, setMembers, setLoading, loading } = useTeamStore();
  const { invoke } = useIpc();

  useEffect(() => {
    setLoading(true);
    invoke<TeamMember[]>('team:list')
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.team}>
      <h2 className={styles.heading}>Team ({members.length})</h2>
      <div className={styles.grid}>
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
      {members.length === 0 && (
        <p className={styles.empty}>No team members added yet.</p>
      )}
    </div>
  );
}
