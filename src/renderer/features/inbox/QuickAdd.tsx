import React, { useState } from 'react';
import styles from './QuickAdd.module.css';

interface QuickAddProps {
  onAdd: (title: string) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Add a task... (press Enter)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <button className={styles.btn} type="submit">
        Add
      </button>
    </form>
  );
}
