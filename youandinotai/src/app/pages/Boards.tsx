import { useEffect, useState } from 'react';
import { Users, MessageSquare, Plus, ArrowLeft, Send } from 'lucide-react';
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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading boards...</div></div>;
  }

  // Comment view
  if (activePost) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <button onClick={() => setActivePost(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft size={18} /> Back to posts
        </button>
        <div className="bg-gray-800 rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">{activePost.title}</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{activePost.body}</p>
          <div className="flex gap-3 mt-4 text-xs text-gray-500">
            <span>{activePost.author_name}</span>
            <span>{new Date(activePost.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <h3 className="text-white font-bold mb-4">Comments ({comments.length})</h3>
        <div className="space-y-3 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
              <p className="text-gray-200 text-sm">{c.body}</p>
              <div className="text-xs text-gray-500 mt-2">{c.author_name} · {new Date(c.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
          />
          <button onClick={submitComment} className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Posts view
  if (activeBoard) {
    const boardInfo = boards.find((b) => b.slug === activeBoard);
    return (
      <div className="min-h-screen p-4 md:p-8">
        <button onClick={() => setActiveBoard(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft size={18} /> All Boards
        </button>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">{boardInfo?.name}</h1>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-full text-white text-sm font-bold"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        {showNewPost && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-white/10 mb-6 space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Post title"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
            />
            <button onClick={submitPost} className="px-6 py-2 bg-pink-500 rounded-full text-white text-sm font-bold">
              Post
            </button>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No posts yet. Be the first!</div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => loadComments(post)}
                className="w-full text-left bg-gray-800/50 rounded-2xl p-5 border border-white/5 hover:border-pink-500/20 transition-colors"
              >
                <h3 className="text-white font-bold">{post.title}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{post.body}</p>
                <div className="flex gap-3 mt-3 text-xs text-gray-500">
                  <span>{post.author_name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> Comments</span>
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
      <h1 className="text-2xl font-black text-white mb-6">Social Boards</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map((board) => (
          <button
            key={board.slug}
            onClick={() => loadPosts(board.slug)}
            className="text-left bg-gray-800/50 rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-purple-400" />
              <h3 className="text-white font-bold">{board.name}</h3>
            </div>
            <p className="text-gray-400 text-sm">{board.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
