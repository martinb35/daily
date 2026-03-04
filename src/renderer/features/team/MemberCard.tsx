import React from 'react';
import type { TeamMember } from '@shared/types';
import styles from './MemberCard.module.css';

interface MemberCardProps {
  member: TeamMember;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{member.name}</h3>
      <p className={styles.role}>{member.role}</p>
      {member.areas.length > 0 && (
        <div className={styles.areas}>
          {member.areas.map((area) => (
            <span key={area} className={styles.tag}>
              {area}
            </span>
          ))}
        </div>
      )}
      {member.notes && <p className={styles.notes}>{member.notes}</p>}
    </div>
  );
}
