import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/inbox', label: '📥 Inbox' },
  { to: '/startofday', label: '☀️ Start My Day' },
  { to: '/team', label: '👥 Team' },
  { to: '/calendar', label: '📅 Calendar' },
  { to: '/review', label: '📊 Review' },
  { to: '/endofday', label: '🌙 End My Day' },
];

export function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <h1 className={styles.logo}>Daily</h1>
      <ul className={styles.nav}>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
