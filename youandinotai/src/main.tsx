/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './App';
import { Login } from './app/pages/Login';
import { Register } from './app/pages/Register';
import { AuthGuard } from './app/AuthGuard';
import { AppShell } from './app/AppShell';
import { Discover } from './app/pages/Discover';
import { Matches } from './app/pages/Matches';
import { Inbox } from './app/pages/Inbox';
import { ProfileSetup } from './app/pages/ProfileSetup';
import { Chat } from './app/pages/Chat';
import { Boards } from './app/pages/Boards';
import { Events } from './app/pages/Events';
import { Volunteering } from './app/pages/Volunteering';
import { Support } from './app/pages/Support';
import DataPrivacyDashboard from './components/DataPrivacyDashboard';
import CharityTab from './components/CharityTab';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated app routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Discover />} />
            <Route path="/app/matches" element={<Matches />} />
            <Route path="/app/inbox" element={<Inbox />} />
            <Route path="/app/profile" element={<ProfileSetup />} />
            <Route path="/app/chat/:matchId" element={<Chat />} />
            <Route path="/app/boards" element={<Boards />} />
            <Route path="/app/events" element={<Events />} />
            <Route path="/app/volunteer" element={<Volunteering />} />
            <Route path="/app/support" element={<Support />} />
            <Route path="/app/privacy" element={<DataPrivacyDashboard />} />
            <Route path="/app/charity" element={<CharityTab />} />
            <Route path="/app/verify" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      <CookieConsentBanner />
    </BrowserRouter>
  </StrictMode>,
);
