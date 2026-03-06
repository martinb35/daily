import React, { useEffect, useState } from 'react';
import { useCalendarStore } from './calendarStore';
import { BlockForm } from './BlockForm';
import { useIpc } from '../../hooks/useIpc';
import type { TimeBlock, Task } from '@shared/types';
import styles from './CalendarView.module.css';

const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function formatHour(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display} ${suffix}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function getMonday(date: string): string {
  const d = new Date(date + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateShort(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

type ViewMode = 'day' | 'week';

export function CalendarView() {
  const {
    timeblocks, setTimeblocks, addTimeblock, updateTimeblock, removeTimeblock,
    selectedDate, setSelectedDate, setLoading, loading,
  } = useCalendarStore();
  const { invoke } = useIpc();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creatingAt, setCreatingAt] = useState<{ date: string; hour: number } | null>(null);
  const [editing, setEditing] = useState<TimeBlock | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([invoke<TimeBlock[]>('timeblocks:list'), invoke<Task[]>('tasks:list')])
      .then(([blocks, taskData]) => {
        setTimeblocks(blocks);
        setTasks(taskData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (block: TimeBlock) => {
    addTimeblock(block);
    await invoke('timeblocks:create', block);
    setCreatingAt(null);
  };

  const handleUpdate = async (block: TimeBlock) => {
    updateTimeblock(block);
    await invoke('timeblocks:update', block);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    removeTimeblock(id);
    await invoke('timeblocks:delete', id);
    setEditing(null);
  };

  const goToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);
  const goPrev = () => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7));
  const goNext = () => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7));

  const getBlocksForDate = (date: string) =>
    timeblocks.filter((b) => b.start.startsWith(date));

  const now = new Date();

  const getBlockStyle= (block: TimeBlock) => {
    const startH = parseInt(block.start.slice(11, 13));
    const startM = parseInt(block.start.slice(14, 16));
    const endH = parseInt(block.end.slice(11, 13));
    const endM = parseInt(block.end.slice(14, 16));
    const top = ((startH - START_HOUR) * 60 + startM) * (60 / 60);
    const height = ((endH - startH) * 60 + (endM - startM)) * (60 / 60);
    const isPast = new Date(block.end) < now;
    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`,
      background: block.color,
      opacity: isPast ? 0.4 : 1,
    };
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const weekStart = getMonday(selectedDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={goPrev}>◀</button>
          <button className={styles.todayBtn} onClick={goToday}>Today</button>
          <button className={styles.navBtn} onClick={goNext}>▶</button>
          <span className={styles.dateLabel}>
            {viewMode === 'day'
              ? formatDate(selectedDate)
              : `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 4))}`}
          </span>
        </div>
        <div className={styles.rightControls}>
          <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          </div>
        </div>
      </div>

      {(creatingAt || editing) && (
        <BlockForm
          date={editing ? editing.start.slice(0, 10) : creatingAt!.date}
          startHour={editing ? parseInt(editing.start.slice(11, 13)) : creatingAt!.hour}
          tasks={tasks}
          initial={editing ?? undefined}
          onSave={editing ? handleUpdate : handleCreate}
          onDelete={editing ? handleDelete : undefined}
          onCancel={() => { setCreatingAt(null); setEditing(null); }}
        />
      )}

      {viewMode === 'day' ? (
        <div className={styles.dayView}>
          <div className={styles.timeGutter}>
            {HOURS.map((h) => (
              <div key={h} className={styles.hourLabel}>{formatHour(h)}</div>
            ))}
          </div>
          <div className={styles.dayColumn}>
            {HOURS.map((h) => (
              <div
                key={h}
                className={styles.hourSlot}
                onClick={() => { setEditing(null); setCreatingAt({ date: selectedDate, hour: h }); }}
              />
            ))}
            {getBlocksForDate(selectedDate).map((block) => (
              <div
                key={block.id}
                className={styles.block}
                style={getBlockStyle(block)}
                onClick={(e) => { e.stopPropagation(); setCreatingAt(null); setEditing(block); }}
              >
                <span className={styles.blockTitle}>{block.title}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.weekView}>
          <div className={styles.timeGutter}>
            <div className={styles.weekHeaderSpacer} />
            {HOURS.map((h) => (
              <div key={h} className={styles.hourLabel}>{formatHour(h)}</div>
            ))}
          </div>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDayCol}>
              <div
                className={`${styles.weekDayHeader} ${day === selectedDate ? styles.weekDayActive : ''}`}
                onClick={() => { setSelectedDate(day); setViewMode('day'); }}
              >
                {formatDateShort(day)}
              </div>
              <div className={styles.weekDaySlots}>
                {HOURS.map((h) => (
                  <div key={h} className={styles.hourSlotWeek} />
                ))}
                {getBlocksForDate(day).map((block) => (
                  <div
                    key={block.id}
                    className={styles.blockWeek}
                    style={getBlockStyle(block)}
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setViewMode('day'); setEditing(block); }}
                  >
                    <span className={styles.blockTitleWeek}>{block.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
