import { useEffect, useState } from 'react';
import { Users, MessageSquare, Plus, ArrowLeft, Send, Heart } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

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

  useEffect(() => {
    api.get<BoardInfo[]>('/boards').then(setBoards).finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-purple-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading boards...</p>
        </div>
      </div>
    );
  }

  // Comment view
  if (activePost) {
    return (
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <button onClick={() => setActivePost(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 group transition-colors">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> Back to posts
        </button>

        {/* Original post — glass card */}
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{activePost.title}</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{activePost.body}</p>
          <div className="flex items-center gap-3 mt-5 text-xs text-gray-500">
            <span className="glass rounded-full px-3 py-1 font-medium">{activePost.author_name}</span>
            <span>{new Date(activePost.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Comments */}
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-pink-400" />
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
            className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300"
          />
          <button onClick={submitComment} className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Posts view
  if (activeBoard) {
    const boardInfo = boards.find((b) => b.slug === activeBoard);
    const gradient = BOARD_COLORS[activeBoard] || 'from-gray-500 to-gray-600';
    return (
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <button onClick={() => setActiveBoard(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 group transition-colors">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> All Boards
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Users size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{boardInfo?.name}</h1>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
              className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300 resize-none"
            />
            <button onClick={submitPost} className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-200">
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-black text-white mb-1 tracking-tight">Social Boards</h1>
        <p className="text-gray-500 text-sm mb-6">Connect, share stories, and uplift each other</p>
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
