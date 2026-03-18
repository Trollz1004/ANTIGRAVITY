/**
 * SocialBoards — location-scoped community boards.
 * Wires to existing boards.py endpoints:
 *   GET  /api/v1/boards
 *   GET  /api/v1/boards/{slug}/posts
 *   POST /api/v1/boards/{slug}/posts
 *   GET  /api/v1/boards/{slug}/posts/{post_id}/comments
 *   POST /api/v1/boards/{slug}/posts/{post_id}/comments
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface Board { slug: string; name: string; description: string; post_count: number; }
interface Post {
  id: string; board_slug: string; author_id: string; author_name: string;
  title: string; body: string; like_count: number; created_at: string;
}
interface Comment {
  id: string; post_id: string; author_id: string; author_name: string;
  body: string; created_at: string;
}

export default function SocialBoards({ currentUserId }: { currentUserId: string }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load boards ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get<Board[]>('/boards')
      .then((data) => { setBoards(data); if (data[0]) setActiveSlug(data[0].slug); })
      .catch(() => setError('Could not load boards.'))
      .finally(() => setLoadingBoards(false));
  }, []);

  // ── Load posts when board changes ──────────────────────────────────────────
  useEffect(() => {
    if (!activeSlug) return;
    setLoadingPosts(true);
    setPosts([]);
    api.get<Post[]>(`/boards/${activeSlug}/posts`)
      .then(setPosts)
      .catch(() => setError('Could not load posts.'))
      .finally(() => setLoadingPosts(false));
  }, [activeSlug]);

  // ── Load comments for a post ───────────────────────────────────────────────
  const loadComments = useCallback(async (slug: string, postId: string) => {
    if (comments[postId]) return;
    const data = await api.get<Comment[]>(`/boards/${slug}/posts/${postId}/comments`);
    setComments((prev) => ({ ...prev, [postId]: data }));
  }, [comments]);

  const togglePost = (slug: string, postId: string) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    loadComments(slug, postId);
  };

  // ── Submit new post ────────────────────────────────────────────────────────
  const submitPost = async () => {
    if (!activeSlug || !newPostTitle.trim() || !newPostBody.trim()) return;
    try {
      const post = await api.post<Post>(`/boards/${activeSlug}/posts`, {
        title: newPostTitle.trim(),
        body: newPostBody.trim(),
      });
      setPosts((prev) => [post, ...prev]);
      setNewPostTitle(''); setNewPostBody(''); setComposing(false);
    } catch { setError('Failed to post. Try again.'); }
  };

  // ── Submit comment ─────────────────────────────────────────────────────────
  const submitComment = async (slug: string, postId: string) => {
    const body = (newComment[postId] || '').trim();
    if (!body) return;
    try {
      const comment = await api.post<Comment>(`/boards/${slug}/posts/${postId}/comments`, { body });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
    } catch { setError('Failed to post comment.'); }
  };

  if (loadingBoards) return <div className="text-center py-12 text-gray-400">Loading boards…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">Community Boards</h2>
        <button
          onClick={() => setComposing((v) => !v)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
        >
          {composing ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-2 text-sm">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Board tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {boards.map((b) => (
          <button
            key={b.slug}
            onClick={() => setActiveSlug(b.slug)}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
              activeSlug === b.slug
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Compose new post */}
      {composing && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <input
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Post title…"
            maxLength={200}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            value={newPostBody}
            onChange={(e) => setNewPostBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={5000}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposing(false)} className="text-gray-400 text-sm hover:text-white">Cancel</button>
            <button
              onClick={submitPost}
              disabled={!newPostTitle.trim() || !newPostBody.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded-lg"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {loadingPosts ? (
        <div className="text-center text-gray-400 py-8">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No posts yet. Be the first!</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => togglePost(post.board_slug, post.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{post.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-gray-600 text-sm shrink-0">
                    {expandedPost === post.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {expandedPost === post.id && (
                <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.body}</p>
                  <div className="text-xs text-gray-500">♡ {post.like_count} likes</div>

                  {/* Comments */}
                  <div className="space-y-2">
                    {(comments[post.id] || []).map((c) => (
                      <div key={c.id} className="bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-xs font-medium text-purple-400">{c.author_name}</span>
                        <p className="text-sm text-gray-300 mt-0.5">{c.body}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      value={newComment[post.id] || ''}
                      onChange={(e) =>
                        setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="Add a comment…"
                      maxLength={1000}
                      className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitComment(post.board_slug, post.id);
                      }}
                    />
                    <button
                      onClick={() => submitComment(post.board_slug, post.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-3 py-1.5 rounded-lg"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
