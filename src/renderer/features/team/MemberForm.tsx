import React, { useState } from 'react';
import type { TeamMember } from '@shared/types';
import styles from './MemberForm.module.css';

interface MemberFormProps {
  initial?: TeamMember;
  onSave: (member: TeamMember) => void;
  onCancel: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function MemberForm({ initial, onSave, onCancel }: MemberFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [areas, setAreas] = useState(initial?.areas.join(', ') ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      role: role.trim(),
      areas: areas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      notes: notes.trim(),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Name *</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoFocus
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Role</label>
        <input
          className={styles.input}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Software Engineer II"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Areas of ownership</label>
        <input
          className={styles.input}
          value={areas}
          onChange={(e) => setAreas(e.target.value)}
          placeholder="e.g. Auth, Payments, API (comma-separated)"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Notes</label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember..."
          rows={2}
        />
      </div>
      <div className={styles.actions}>
        <button className={styles.btnSave} type="submit">
          {initial ? 'Save' : 'Add Member'}
        </button>
        <button className={styles.btnCancel} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
