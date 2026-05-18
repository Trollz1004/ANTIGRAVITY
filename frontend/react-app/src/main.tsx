/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage, { PublicSupportPage } from './App';
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
import { LoveBotPage } from './app/pages/LoveBotPage';
import { Verify } from './app/pages/Verify';
import { CheckoutLaunch } from './app/pages/CheckoutLaunch';
import DataPrivacyDashboard from './components/DataPrivacyDashboard';

import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Lazy-loaded heavy components — loaded on demand to reduce initial bundle
const CharityTab = lazy(() => import('./components/CharityTab'));
const ChatWindow = lazy(() => import('./components/ChatWindow'));
const VideoChat = lazy(() => import('./components/VideoChat'));

function PageErrorFallback({
  errorId,
  resetError,
}: {
  errorId: string;
  resetError: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12">
      <div className="glass-strong glass-highlight max-w-lg rounded-[2rem] p-8 text-center animate-scale-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-4 border-[#111111] bg-[#111111] text-white shadow-[8px_8px_0_0_#ff4f00]">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="app-kicker mb-3">Page Error</div>
        <h2 className="app-title mb-3">this page crashed.</h2>
        <p className="app-subtitle mx-auto max-w-sm">
          Something went wrong loading this page. You can try again or go back
          home.
        </p>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a8478]">
          Error ID: {errorId.slice(0, 8)}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={resetError}
            className="app-button-accent px-6 py-3 text-sm"
          >
            🔄 Try Again
          </button>
          <a
            href="/app"
            className="app-button-dark px-6 py-3 text-sm no-underline"
          >
            🏠 Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary boundaryName="root">
      <BrowserRouter>
        <ErrorBoundary boundaryName="router">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/support" element={<PublicSupportPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated app routes */}
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route
                  path="/app"
                  element={
                    <ErrorBoundary
                      boundaryName="page:discover"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Discover />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/lovebot"
                  element={
                    <ErrorBoundary
                      boundaryName="page:lovebot"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <LoveBotPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/matches"
                  element={
                    <ErrorBoundary
                      boundaryName="page:matches"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Matches />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/inbox"
                  element={
                    <ErrorBoundary
                      boundaryName="page:inbox"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Inbox />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/profile"
                  element={
                    <ErrorBoundary
                      boundaryName="page:profile"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <ProfileSetup />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/chat/:matchId"
                  element={
                    <ErrorBoundary
                      boundaryName="page:chat"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Chat />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/boards"
                  element={
                    <ErrorBoundary
                      boundaryName="page:boards"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Boards />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/events"
                  element={
                    <ErrorBoundary
                      boundaryName="page:events"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Events />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/volunteer"
                  element={
                    <ErrorBoundary
                      boundaryName="page:volunteer"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Volunteering />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/support"
                  element={
                    <ErrorBoundary
                      boundaryName="page:support"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Support />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/privacy"
                  element={
                    <ErrorBoundary
                      boundaryName="page:privacy"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <DataPrivacyDashboard />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/impact"
                  element={
                    <ErrorBoundary
                      boundaryName="page:impact"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Suspense
                        fallback={
                          <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
                            <div className="app-subtitle">
                              Loading impact dashboard…
                            </div>
                          </div>
                        }
                      >
                        <CharityTab />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/charity"
                  element={<Navigate to="/app/impact" replace />}
                />
                <Route
                  path="/app/verify"
                  element={
                    <ErrorBoundary
                      boundaryName="page:verify"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <Verify />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/app/checkout/:tier"
                  element={
                    <ErrorBoundary
                      boundaryName="page:checkout"
                      fallback={(errorId, reset) => (
                        <PageErrorFallback
                          errorId={errorId}
                          resetError={reset}
                        />
                      )}
                    >
                      <CheckoutLaunch />
                    </ErrorBoundary>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </ErrorBoundary>
        <CookieConsentBanner />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
