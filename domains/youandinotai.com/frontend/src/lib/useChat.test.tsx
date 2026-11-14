import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from './useChat';
import ChatWindow from '../components/ChatWindow';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (this.onopen) this.onopen();
    });
  }
}

describe('useChat plain message protocol', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    localStorage.setItem('access_token', 'test-token');
    Object.defineProperty(globalThis, 'WebSocket', {
      value: MockWebSocket,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(globalThis, 'WebSocket', {
      value: originalWebSocket,
      configurable: true,
      writable: true,
    });
  });

  it('sends typed text unchanged inside the plain form over WebSocket', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    const { result } = renderHook(() => useChat('match-123'));

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
      expect(result.current.connected).toBe(true);
    });

    const typedText = 'Hey! Coffee at 3pm tomorrow?';
    await act(async () => {
      await result.current.sendMessage(typedText);
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.send).toHaveBeenCalledTimes(1);
    const frame = JSON.parse(ws.send.mock.calls[0][0] as string) as {
      type: string;
      content: string;
    };
    expect(frame.type).toBe('message');
    expect(frame.content).toBe(
      JSON.stringify({ type: 'plain', content: typedText })
    );
    expect(JSON.parse(frame.content)).toEqual({
      type: 'plain',
      content: typedText,
    });
  });

  it('sends typed text unchanged inside the plain form over REST fallback when offline', async () => {
    localStorage.removeItem('access_token');
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({});

    const { result } = renderHook(() => useChat('match-456'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/messages/match-456');
    });

    const typedText = 'Checking in from REST fallback';
    await act(async () => {
      await result.current.sendMessage(typedText);
    });

    expect(api.post).toHaveBeenCalledWith('/messages/match-456', {
      content: JSON.stringify({ type: 'plain', content: typedText }),
    });
  });

  it('shows received plain messages unchanged from history and WebSocket', async () => {
    const historyPlain = 'Hello from history — unchanged!';
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'msg-1',
        sender_id: 'user-b',
        content: JSON.stringify({ type: 'plain', content: historyPlain }),
        created_at: '2026-11-13T17:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useChat('match-789'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    expect(result.current.messages[0].content).toBe(historyPlain);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const livePlain = 'Live WebSocket reply — also unchanged!';
    act(() => {
      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify({
          type: 'message',
          id: 'msg-2',
          sender_id: 'user-b',
          content: JSON.stringify({ type: 'plain', content: livePlain }),
          created_at: '2026-11-13T17:01:00Z',
        }),
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe(livePlain);
  });

  it('shows "This message could not be shown" for old encrypted messages and never "[failed to decrypt]"', async () => {
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'old-enc-1',
        sender_id: 'user-b',
        content: JSON.stringify({
          type: 'encrypted',
          iv: 'AAAA',
          data: 'BBBB',
        }),
        created_at: '2026-11-12T12:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useChat('match-old'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    expect(result.current.messages[0].content).toBe(
      'This message could not be shown'
    );
    expect(result.current.messages[0].content).not.toContain(
      '[failed to decrypt]'
    );
  });

  it('renders received plain messages in ChatWindow without any end-to-end encrypted claims', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'msg-window-1',
        sender_id: 'user-b',
        content: JSON.stringify({
          type: 'plain',
          content: 'Great to match with you!',
        }),
        created_at: '2026-11-13T17:02:00Z',
      },
    ]);

    const { getByText, container } = render(
      <ChatWindow
        matchId="match-ui"
        currentUserId="user-a"
        matchedUser={{
          display_name: 'Taylor',
          photos: [],
          verified: true,
        }}
      />
    );

    await waitFor(() => {
      expect(getByText('Great to match with you!')).toBeDefined();
    });

    expect(container.textContent).not.toMatch(/end-to-end encrypted/i);
  });
});
