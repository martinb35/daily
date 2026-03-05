import React from 'react';
import type { TeamMember } from '@shared/types';
import styles from './MemberCard.module.css';

interface MemberCardProps {
  member: TeamMember;
  delegatedCount?: number;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
}

export function MemberCard({ member, delegatedCount = 0, onEdit, onDelete }: MemberCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{member.name}</h3>
        <div className={styles.headerActions}>
          <button className={styles.btnEdit} onClick={() => onEdit(member)} title="Edit">
            ✏️
          </button>
          <button className={styles.btnDelete} onClick={() => onDelete(member.id)} title="Remove">
            ✕
          </button>
        </div>
      </div>
      <p className={styles.role}>{member.role}</p>
      {delegatedCount > 0 && (
        <p className={styles.delegated}>{delegatedCount} delegated task(s)</p>
      )}
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
