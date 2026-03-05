import React, { useEffect, useState } from 'react';
import { useTeamStore } from './teamStore';
import { MemberCard } from './MemberCard';
import { MemberForm } from './MemberForm';
import { useIpc } from '../../hooks/useIpc';
import type { TeamMember, Task } from '@shared/types';
import styles from './TeamView.module.css';

export function TeamView() {
  const { members, setMembers, addMember, updateMember, removeMember, setLoading, loading } =
    useTeamStore();
  const { invoke } = useIpc();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [delegatedCounts, setDelegatedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([invoke<TeamMember[]>('team:list'), invoke<Task[]>('tasks:list')])
      .then(([teamData, tasks]) => {
        setMembers(teamData);
        const counts: Record<string, number> = {};
        tasks.forEach((t) => {
          if (t.status === 'delegated' && t.assigneeId) {
            counts[t.assigneeId] = (counts[t.assigneeId] || 0) + 1;
          }
        });
        setDelegatedCounts(counts);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (member: TeamMember) => {
    addMember(member);
    await invoke('team:create', member);
    setShowForm(false);
  };

  const handleEdit = async (member: TeamMember) => {
    updateMember(member);
    await invoke('team:update', member);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    removeMember(id);
    await invoke('team:delete', id);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.team}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Team ({members.length})</h2>
        {!showForm && !editing && (
          <button className={styles.btnAdd} onClick={() => setShowForm(true)}>
            + Add Member
          </button>
        )}
      </div>

      {showForm && (
        <MemberForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {editing && (
        <MemberForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />
      )}

      <div className={styles.grid}>
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            delegatedCount={delegatedCounts[member.id] || 0}
            onEdit={(m) => {
              setShowForm(false);
              setEditing(m);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {members.length === 0 && !showForm && (
        <p className={styles.empty}>No team members added yet.</p>
      )}
    </div>
  );
}
