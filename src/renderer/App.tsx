import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { InboxView } from './features/inbox/InboxView';
import { TeamView } from './features/team/TeamView';
import { CalendarView } from './features/calendar/CalendarView';
import { ReviewView } from './features/review/ReviewView';
import { EndOfDayView } from './features/endofday/EndOfDayView';
import { StartOfDayView } from './features/startofday/StartOfDayView';

export function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxView />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/review" element={<ReviewView />} />
          <Route path="/startofday" element={<StartOfDayView />} />
          <Route path="/endofday" element={<EndOfDayView />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
