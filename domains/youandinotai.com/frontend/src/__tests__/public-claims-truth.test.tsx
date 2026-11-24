import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppShell } from '../app/AppShell';

/**
 * Three claims the date app does not deliver today (claims check, 2026-11-23):
 *   1. local venue suggestions (no code at all)
 *   2. nearby or GPS-based meetup discovery (no coordinates in the backend)
 *   3. an account data export the member can download (no way to fetch the file)
 * What exists: members create events and RSVP; a member can request a copy of
 * their account data and the founder sends it on request.
 */

const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const read = (...parts: string[]) =>
  readFileSync(path.join(FRONTEND_ROOT, ...parts), 'utf8');

const PUBLIC_FILES = [
  'index.html',
  'metadata.json',
  'public/llms.txt',
  'public/for-ai',
  'public/AGENTS.md',
  'public/.well-known/agent-card.json',
];

describe('public pages claim only what the date app does today', () => {
  it('App.tsx never says venue suggestion or nearby meetups', () => {
    const appTsx = read('src', 'App.tsx');
    expect(appTsx).not.toMatch(/venue\s+suggestions?/i);
    expect(appTsx).not.toMatch(/nearby\s+meetups?/i);
  });

  it.each(PUBLIC_FILES)(
    '%s makes no venue, nearby, local meetup, or meetup discovery claim',
    file => {
      const text = read(...file.split('/'));
      expect(text).not.toMatch(/venue\s+(suggestion|planning)s?/i);
      expect(text).not.toMatch(/local\s+meetups?/i);
      expect(text).not.toMatch(/nearby|near\s+you|meetup\s+discovery/i);
      expect(text).not.toMatch(/dating,\s*meetups/i);
    }
  );

  it('App.tsx does not promise a downloadable export and says the founder sends the copy on request', () => {
    const appTsx = read('src', 'App.tsx');
    expect(appTsx).not.toMatch(/download\s+your\s+account\s+archive/i);
    expect(appTsx).not.toMatch(/full\s+data\s+export/i);
    expect(appTsx).not.toMatch(/self-service\s+export/i);
    expect(appTsx).not.toMatch(/privacy\s+exports?/i);
    expect(appTsx).toMatch(/founder\s+sends/i);
  });

  it('the Privacy Center does not label the request as a download', () => {
    const dashboard = read('src', 'components', 'DataPrivacyDashboard.tsx');
    expect(dashboard).not.toMatch(/Download\s+My\s+Data/);
  });

  it('the Events page offers create and RSVP only, with no nearby or distance control', () => {
    const events = read('src', 'app', 'pages', 'Events.tsx');
    expect(events).not.toMatch(/Find\s+Nearby|Hide\s+Nearby|MeetupsDiscovery/);
  });

  it('the events board is not described as local', () => {
    const boards = read('..', 'backend', 'app', 'routers', 'boards.py');
    expect(boards).not.toMatch(/Find\s+local\s+events/i);
  });
});

describe('the Discover page shows no nearby or location feature', () => {
  // The events API has no coordinates (see the Events test above), so a
  // "Nearby Meetups" block with an "Enable Location" button promises a
  // filter that does not exist. The component file stays; Discover does not
  // render it.
  it('Discover.tsx does not render MeetupsDiscovery, Nearby Meetups or Enable Location', () => {
    const discover = read('src', 'app', 'pages', 'Discover.tsx');
    expect(discover).not.toMatch(/MeetupsDiscovery/);
    expect(discover).not.toMatch(/Nearby\s+Meetups?/i);
    expect(discover).not.toMatch(/Enable\s+Location/i);
    expect(discover).not.toMatch(/safe\s+meetups/i);
  });

  it('the MeetupsDiscovery component file is kept', () => {
    expect(() =>
      read('src', 'components', 'MeetupsDiscovery.tsx')
    ).not.toThrow();
  });
});

describe('public AI files claim video only while video calls exist in code', () => {
  // Video calls exist today: the match list and the chat page link to
  // /app/video/:matchId, VideoChat.tsx runs a WebRTC peer connection, and the
  // backend signals it on /ws/video/{call_id}. If any of that goes, the
  // "Mutual Video & Chat" line in the public AI files must go with it.
  const VIDEO_CLAIM_FILES = [
    'public/llms.txt',
    'public/for-ai',
    'public/.well-known/agent-card.json',
  ];

  it.each(VIDEO_CLAIM_FILES)(
    '%s only says "Mutual Video" while the video call code is in place',
    file => {
      const claimsVideo = /mutual\s+video/i.test(read(...file.split('/')));
      if (!claimsVideo) return;
      expect(read('src', 'main.tsx')).toMatch(/path="\/app\/video\/:matchId"/);
      expect(read('src', 'app', 'pages', 'Matches.tsx')).toMatch(
        /\/app\/video\/\$\{match\.match_id\}/
      );
      expect(read('src', 'app', 'pages', 'Chat.tsx')).toMatch(
        /\/app\/video\/\$\{matchId\}/
      );
      expect(read('src', 'components', 'VideoChat.tsx')).toMatch(
        /new RTCPeerConnection/
      );
      expect(read('..', 'backend', 'app', 'routers', 'video.py')).toMatch(
        /@router\.websocket\("\/ws\/video\/\{call_id\}"\)/
      );
    }
  );
});

describe('/app/events is reachable from the app navigation', () => {
  it('links to /app/events from the desktop rail and the mobile top bar', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell />
      </MemoryRouter>
    );
    const links = screen
      .getAllByRole('link')
      .filter(a => a.getAttribute('href') === '/app/events');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
