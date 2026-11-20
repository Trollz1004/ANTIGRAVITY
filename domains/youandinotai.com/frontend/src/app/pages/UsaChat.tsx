import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Flag, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface UsaPost {
  id: string;
  board_slug: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  like_count?: number;
  created_at: string;
}

const POLL_INTERVAL_MS = 10_000;
const USA_POSTS_PATH = '/boards/usa/posts?order=desc&limit=100';

function sortOldestToNewest(items: UsaPost[]): UsaPost[] {
  return [...items].reverse().sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
    return timeA - timeB;
  });
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const timePart = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (isSameLocalDay(date, now)) {
    return timePart;
  }
  const includeYear = date.getFullYear() !== now.getFullYear();
  const datePart = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
  return `${datePart}, ${timePart}`;
}

function isForbiddenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { status?: number; message?: string };
  if (candidate.status === 403) return true;
  if (typeof candidate.message === 'string') {
    const lower = candidate.message.toLowerCase();
    return lower.includes('403') || lower.includes('verification');
  }
  return false;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return reduced;
}

export function UsaChat() {
  const user = useAuth(state => state.user);
  const [posts, setPosts] = useState<UsaPost[]>([]);
  const [ownAuthorIds, setOwnAuthorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnverified, setIsUnverified] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const currentUserId = user?.user_id || user?.id || null;

  const scrollToLastLine = useCallback(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
    const articles = listEl.querySelectorAll('article');
    const lastArticle = articles[articles.length - 1];
    if (lastArticle && typeof lastArticle.scrollIntoView === 'function') {
      lastArticle.scrollIntoView({ block: 'nearest' });
    }
    listEl.scrollTop = listEl.scrollHeight;
  }, []);

  useEffect(() => {
    if (scrollTick > 0) {
      scrollToLastLine();
    }
  }, [posts, scrollTick, scrollToLastLine]);

  const loadPosts = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    try {
      const data = await api.get<UsaPost[]>(USA_POSTS_PATH);
      if (Array.isArray(data)) {
        setPosts(sortOldestToNewest(data));
      }
      if (!isBackground) {
        setScrollTick(prev => prev + 1);
      }
      setIsUnverified(false);
      setErrorMessage(null);
    } catch (err: unknown) {
      if (isForbiddenError(err)) {
        setIsUnverified(true);
        setPosts([]);
      } else if (!isBackground) {
        setErrorMessage(
          err instanceof Error && err.message
            ? err.message
            : 'Could not load the USA group chat.'
        );
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPosts(false);
  }, [loadPosts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadPosts(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadPosts]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setErrorMessage(null);
    try {
      const created = await api.post<UsaPost | undefined>('/boards/usa/posts', {
        title: trimmed.slice(0, 60),
        body: trimmed,
      });
      setText('');
      if (created && typeof created === 'object' && 'id' in created) {
        if (created.author_id) {
          setOwnAuthorIds(prev =>
            prev.includes(created.author_id)
              ? prev
              : [...prev, created.author_id]
          );
        }
        setPosts(prev =>
          sortOldestToNewest([
            ...prev.filter(item => item.id !== created.id),
            created,
          ])
        );
      }
      setScrollTick(prev => prev + 1);
      await loadPosts(true);
      setScrollTick(prev => prev + 1);
    } catch (err: unknown) {
      if (isForbiddenError(err)) {
        setIsUnverified(true);
      } else {
        setErrorMessage(
          err instanceof Error && err.message
            ? err.message
            : 'Could not send message.'
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (post: UsaPost) => {
    setErrorMessage(null);
    try {
      await api.post(`/boards/posts/${post.id}/report`, {
        reason: 'Unsafe or inappropriate content',
        details: `Board=${post.board_slug || 'usa'}; post=${post.id}; author=${post.author_id}`,
      });
      setNotice('Board post queued for moderation review.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : 'Could not report post.'
      );
    }
  };

  if (isUnverified) {
    return (
      <div
        data-motion={reducedMotion ? 'reduced' : 'full'}
        className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden p-6"
      >
        <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-stone-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="z-10 bg-white/5 border border-white/10 backdrop-blur-xl max-w-md w-full rounded-[2.5rem] p-8 text-center shadow-2xl">
          <ShieldCheck size={36} className="mx-auto mb-4 text-amber-400" />
          <p className="text-white/80 text-base mb-6 leading-relaxed">
            Finish your $1 human check to read and write in the USA group chat.
          </p>
          <Link
            to="/app/verify"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-stone-600 px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:brightness-110 motion-reduce:transition-none"
          >
            Finish your $1 human check
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      data-motion={reducedMotion ? 'reduced' : 'full'}
      className="bg-[#050505] text-white relative flex flex-col overflow-hidden h-[calc(100vh-8.75rem)] -mb-28 p-3 md:mb-0 md:h-auto md:min-h-screen md:overflow-x-hidden md:p-10"
    >
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-stone-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-1 min-h-0 flex-col w-full max-w-4xl mx-auto">
        <header className="mb-3 md:mb-6 shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1 md:mb-2">
            USA Group Chat
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-1 md:mb-2">
            usa group chat.
          </h1>
          <div className="text-white/60 text-xs md:text-base leading-snug md:leading-relaxed">
            One room for verified members across the country, oldest at the top
            and newest at the bottom.
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="shrink-0 mb-3 md:mb-4 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5 md:px-5 md:py-3 text-sm font-bold text-emerald-200 backdrop-blur-md"
          >
            {notice}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="shrink-0 mb-3 md:mb-4 rounded-2xl border border-rose-500/50 bg-rose-500/10 px-4 py-2.5 md:px-5 md:py-3 text-sm font-bold text-rose-200 backdrop-blur-md"
          >
            {errorMessage}
          </div>
        )}

        <section className="bg-white/5 border border-white/10 backdrop-blur-2xl w-full rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl flex flex-1 min-h-0 md:flex-initial flex-col gap-3 md:gap-6">
          <div
            ref={listRef}
            data-testid="usa-chat-list"
            className="flex flex-1 min-h-0 flex-col gap-3 md:flex-initial md:max-h-[60vh] overflow-y-auto pr-1"
          >
            {loading && posts.length === 0 ? (
              <div className="py-12 text-center text-sm font-bold uppercase tracking-widest text-stone-400">
                Loading conversation
              </div>
            ) : posts.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle
                  size={32}
                  className="mx-auto mb-3 text-stone-400"
                />
                <p className="text-white/70 text-base font-medium">
                  No one has written yet. Say hello.
                </p>
              </div>
            ) : (
              posts.map(post => {
                const isOwnLine =
                  (Boolean(currentUserId) &&
                    post.author_id === currentUserId) ||
                  ownAuthorIds.includes(post.author_id);
                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="font-bold text-amber-300">
                          {post.author_name}
                        </span>
                        <time
                          dateTime={post.created_at}
                          className="text-white/50 font-medium"
                        >
                          {formatTime(post.created_at)}
                        </time>
                      </div>
                      {!isOwnLine && (
                        <button
                          type="button"
                          onClick={() => void handleReport(post)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white motion-reduce:transition-none"
                        >
                          <Flag size={12} className="text-amber-400" />
                          Report
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-white/90 whitespace-pre-wrap break-words leading-relaxed">
                      {post.body || post.title}
                    </p>
                  </article>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="shrink-0 flex flex-row items-center gap-2 sm:gap-3 border-t border-white/10 pt-3 md:pt-4"
          >
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write to the USA group chat..."
              aria-label="Write to the USA group chat"
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/50 px-3.5 py-2.5 md:px-4 md:py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-stone-600 px-4 py-2.5 md:px-6 md:py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_24px_rgba(217,70,239,0.3)] disabled:opacity-40 ${
                reducedMotion
                  ? 'transition-none'
                  : 'transition-all hover:brightness-110'
              }`}
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default UsaChat;
