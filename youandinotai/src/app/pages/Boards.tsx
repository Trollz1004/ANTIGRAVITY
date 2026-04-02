import { useEffect, useState } from 'react';
import { Users, MessageSquare, Plus, ArrowLeft, Send, Flag, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { isSafetyToolsAvailable } from '../../lib/safety';
import { SafetyDrawer } from '../components/SafetyDrawer';

interface BoardInfo {
  slug: string;
  name: string;
  description: string;
}

interface PostData {
  id: string;
  board_slug: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  like_count: number;
  created_at: string;
}

interface CommentData {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const BOARD_COLORS: Record<string, string> = {
  'general': 'from-blue-500 to-cyan-500',
  'dating-tips': 'from-pink-500 to-rose-500',
  'success-stories': 'from-emerald-500 to-teal-500',
  'events': 'from-orange-500 to-amber-500',
  'volunteering': 'from-purple-500 to-violet-500',
};

export function Boards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardInfo[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [activePost, setActivePost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [boardNotice, setBoardNotice] = useState<string | null>(null);
  const [safetyAvailable, setSafetyAvailable] = useState(false);

  useEffect(() => {
    api.get<BoardInfo[]>('/boards').then(setBoards).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void isSafetyToolsAvailable().then(setSafetyAvailable);
  }, []);

  const loadPosts = async (slug: string) => {
    setActiveBoard(slug);
    setActivePost(null);
    const data = await api.get<PostData[]>(`/boards/${slug}/posts`);
    setPosts(data);
  };

  const loadComments = async (post: PostData) => {
    setActivePost(post);
    const data = await api.get<CommentData[]>(`/boards/${post.board_slug}/posts/${post.id}/comments`);
    setComments(data);
  };

  const submitPost = async () => {
    if (!activeBoard || !newTitle.trim() || !newBody.trim()) return;
    await api.post(`/boards/${activeBoard}/posts`, { title: newTitle, body: newBody });
    setNewTitle('');
    setNewBody('');
    setShowNewPost(false);
    loadPosts(activeBoard);
  };

  const submitComment = async () => {
    if (!activePost || !newComment.trim()) return;
    await api.post(`/boards/${activePost.board_slug}/posts/${activePost.id}/comments`, { body: newComment });
    setNewComment('');
    loadComments(activePost);
  };

  const reportActivePost = async () => {
    if (!activePost) return;
    const reason = window.prompt('Brief reason for reporting this post', 'Unsafe or inappropriate content');
    if (!reason || !reason.trim()) return;

    await api.post(`/boards/posts/${activePost.id}/report`, {
      reason: reason.trim(),
      details: `Board=${activePost.board_slug}; post=${activePost.id}; author=${activePost.author_id}`,
    });
    setBoardNotice('Board post queued for moderation review.');
  };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1rem] border-4 border-[#111111] bg-[#111111] text-white">
            <Users size={24} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">Loading boards</p>
        </div>
      </div>
    );
  }

  // Comment view
  if (activePost) {
    return (
      <div className="app-page animate-fade-in">
        <button onClick={() => setActivePost(null)} className="app-back-link mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> Back to posts
        </button>

        {boardNotice && (
          <div className="mb-4 rounded-[1.2rem] border-4 border-[#111111] bg-[#eef8ed] px-4 py-3 text-sm font-bold text-[#244f1f]">
            {boardNotice}
          </div>
        )}

        {/* Original post — glass card */}
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="glass rounded-full px-3 py-1 font-medium">{activePost.author_name}</span>
              <span>{new Date(activePost.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {safetyAvailable && (
              <button
                type="button"
                onClick={reportActivePost}
                className="flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
              >
                <Flag size={14} className="text-[#ff4f00]" />
                Report post
              </button>
              )}
              {safetyAvailable && (
              <button
                type="button"
                onClick={() => setSafetyOpen(true)}
                className="flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-[#fff4ef] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
              >
                <Shield size={14} className="text-[#ff4f00]" />
                Safety
              </button>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{activePost.title}</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{activePost.body}</p>
        </div>

        {/* Comments */}
        <h3 className="text-[#111111] font-black uppercase tracking-[0.14em] mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-[#ff4f00]" />
          Comments ({comments.length})
        </h3>
        <div className="space-y-3 mb-6 stagger-children">
          {comments.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-4 hover:bg-white/[0.03] transition-colors">
              <p className="text-gray-200 text-sm leading-relaxed">{c.body}</p>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <span className="font-medium text-gray-400">{c.author_name}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No comments yet. Be the first!</p>
          )}
        </div>

        {/* Comment input */}
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            placeholder="Write a comment..."
            className="app-input input-glow flex-1"
          />
          <button onClick={submitComment} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:-translate-y-0.5">
            <Send size={18} className="text-[#ff4f00]" />
          </button>
        </div>

        {safetyAvailable && (
          <SafetyDrawer
            open={safetyOpen}
            targetUserId={activePost.author_id}
            targetName={activePost.author_name}
            source="board"
            onClose={() => setSafetyOpen(false)}
            onBlocked={() => {
              setBoardNotice(`${activePost.author_name} was blocked and removed from your board lane.`);
              setSafetyOpen(false);
              setActivePost(null);
              if (activeBoard) {
                void loadPosts(activeBoard);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Posts view
  if (activeBoard) {
    const boardInfo = boards.find((b) => b.slug === activeBoard);
    const gradient = BOARD_COLORS[activeBoard] || 'from-gray-500 to-gray-600';
    return (
      <div className="app-page animate-fade-in">
        <button onClick={() => setActiveBoard(null)} className="app-back-link mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> All Boards
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Users size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-[-0.06em] text-[#111111]">{boardInfo?.name}</h1>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="app-button-accent px-5 py-3 text-sm"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        {showNewPost && (
          <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 space-y-4 animate-scale-in">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Post title"
              className="app-input input-glow"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="app-textarea input-glow"
            />
            <button onClick={submitPost} className="app-button-dark px-6 py-3 text-sm">
              Post
            </button>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-16 animate-fade-in">
            <MessageSquare size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="font-medium">No posts yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => loadComments(post)}
                className="w-full text-left glass rounded-2xl p-5 hover:bg-white/[0.04] hover:border-pink-500/10 transition-all duration-200 group"
              >
                <h3 className="text-white font-bold group-hover:text-pink-300 transition-colors">{post.title}</h3>
                <p className="text-gray-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.body}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-400">{post.author_name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 ml-auto">
                    <MessageSquare size={12} className="text-gray-600" /> Comments
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Board list
  return (
    <div className="app-page">
      <div className="animate-fade-in">
        <div className="app-kicker mb-3">Boards</div>
        <h1 className="app-title mb-3">social boards.</h1>
        <p className="app-subtitle mb-6">Connect, share updates, and keep the app social without losing the main dating flow.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {boards.map((board) => {
          const gradient = BOARD_COLORS[board.slug] || 'from-gray-500 to-gray-600';
          return (
            <button
              key={board.slug}
              onClick={() => loadPosts(board.slug)}
              className="text-left glass rounded-3xl p-6 glass-highlight hover:bg-white/[0.04] hover:scale-[1.01] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Users size={20} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-lg group-hover:text-pink-300 transition-colors">{board.name}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{board.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
