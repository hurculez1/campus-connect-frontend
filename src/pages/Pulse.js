import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { ProfileSheet } from './Discover';

// ─── Post Card ──────────────────────────────────────────────────────────────
const PostCard = ({ post, mode, onLike, onVibeCheck, onProfileClick }) => {
  const isDating = mode === 'dating';
  const isAnonymous = post.is_anonymous;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card-premium p-4 mb-4 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl border-l-[3px] ${
        isAnonymous ? 'border-indigo-500 bg-indigo-500/[0.03]' : 'border-brand-500 bg-white/[0.02]'
      }`}
    >
      {/* Header - Compact Icon Only */}
      <div className="flex items-center justify-between mb-3">
        <div 
          onClick={() => !isAnonymous && onProfileClick(post.user_id)}
          className={`w-9 h-9 rounded-xl overflow-hidden shadow-lg border-2 cursor-pointer transition-transform active:scale-90 ${
            isAnonymous ? 'border-indigo-500/40 bg-indigo-900/20' : isDating ? 'border-brand-500/40 bg-brand-500/10' : 'border-indigo-500/40 bg-indigo-500/10'
          }`}
        >
          {isAnonymous ? (
            <div className="w-full h-full flex items-center justify-center text-lg">👻</div>
          ) : (
            <img 
              src={post.profile_photo_url || `https://ui-avatars.com/api/?name=${post.first_name}&background=random`} 
              alt="" 
              className="w-full h-full object-cover" 
            />
          )}
        </div>

        {post.type === 'confession' && (
          <div className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm">
            Confession
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative mb-4">
        <p className="text-dark-50 text-[14px] leading-relaxed font-medium tracking-tight opacity-95">
          {post.content}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-6">
          {/* Fire / Like */}
          <button onClick={() => onLike(post.id)} className="flex items-center gap-2 group/btn">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/5 group-hover/btn:bg-brand-500/20 active:scale-90">
              <span className="text-sm">🔥</span>
            </div>
            <span className="text-dark-400 text-[10px] font-black tracking-widest">{post.likes_count || 0}</span>
          </button>

          {/* Vibe Check */}
          {!isAnonymous && post.user_id && (
            <button onClick={() => onVibeCheck(post.user_id)} className="flex items-center gap-2 group/btn">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/5 group-hover/btn:bg-indigo-500/20 active:scale-90">
                <span className="text-sm">💬</span>
              </div>
              <span className="text-dark-400 text-[10px] font-black uppercase tracking-widest">Vibe Check</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Pulse Page ──────────────────────────────────────────────────────────────
const Pulse = () => {
  const { mode, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Trending');
  const [filter, setFilter] = useState('All Campuses');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', campus: '', isAnonymous: false });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLiking, setIsLiking] = useState(new Set());

  const isDating = mode === 'dating';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mark pulse as seen when entering the page
  useEffect(() => {
    api.post('/users/pulse-seen')
      .then(() => queryClient.invalidateQueries('notifications'))
      .catch(err => console.error('Failed to mark pulse as seen', err));
  }, [queryClient]);

  const { data: dynamicCampuses } = useQuery(
    'pulse-campuses',
    async () => {
      const res = await api.get('/pulse/campuses');
      return res.data.campuses || [];
    }
  );
  const formatMsgTime = () => '';
  const campuses = ['All Campuses', ...(dynamicCampuses || ['Makerere', 'MUBS', 'Kyambogo', 'UCU', 'MUST', 'KIU'])];

  const { data, isLoading, refetch } = useQuery(
    ['pulse', filter, activeTab],
    async () => {
      const res = await api.get(`/pulse?campus=${filter}&tab=${activeTab}`);
      return res.data.posts;
    }
  );

  const createMutation = useMutation(
    async (postData) => api.post('/pulse', postData),
    {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPost({ content: '', campus: user?.university || '', isAnonymous: false });
        refetch();
        toast.success('✨ Vibe shared successfully!');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to post. Try again.');
      }
    }
  );

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...newPost,
      campus: newPost.campus || user?.university || 'Makerere'
    });
  };

  const likeMutation = useMutation(
    async (postId) => api.post(`/pulse/${postId}/like`),
    {
      onSuccess: () => refetch(),
      onError: () => toast.error('Could not like post right now.')
    }
  );

  const handleLike = (postId) => likeMutation.mutate(postId);

  // VibeCheck — navigate directly into a chat with this user
  const handleVibeCheck = async (userId) => {
    if (!userId) { navigate('/matches'); return; }
    // Self vibe check → notes chat
    if (userId === user?.id) { navigate('/chat/self'); return; }
    try {
      const res = await api.post('/chat/connection/start', { targetUserId: userId });
      if (res.data.matchId) {
        navigate(`/chat/${res.data.matchId}`);
      } else if (res.data.connectionId) {
        navigate(`/connection/${res.data.connectionId}`);
      } else {
        navigate('/matches');
      }
    } catch (err) {
      console.error('Vibe check failed:', err);
      toast.error('Could not start chat. Try again.');
    }
  };

  // Handle Profile click - fetch full details
  const handleProfileClick = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/profile`);
      setSelectedProfile(res.data.user);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('Could not load profile');
    }
  };

  const handleProfileLike = async (profile) => {
    try {
      const targetUserId = profile.id || profile.userId;
      await api.post('/matches/swipe', { targetUserId, direction: 'like' });
      setIsLiking(prev => new Set([...prev, targetUserId]));
      toast.success('Nice! Liked profile.');
    } catch (err) {
      toast.error('Could not like profile.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Tabs & Filters Header */}
      <div className="sticky top-[64px] z-40 bg-dark-950/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-6 border-b border-white/5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {['Trending', 'New', 'Confessions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-black uppercase tracking-[0.35em] transition-all relative py-3 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-dark-500 hover:text-dark-300'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="pulse-tab"
                      className={`absolute bottom-0 inset-x-0 h-[3px] rounded-full shadow-[0_-4px_12px_rgba(244,63,94,0.4)] ${isDating ? 'bg-brand-500' : 'bg-indigo-500'}`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Floating Create Button */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className={`fixed bottom-32 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl shadow-[0_8px_30px_rgba(244,63,94,0.6)] z-[110] transition-all hover:scale-110 active:scale-90 ${isDating ? 'bg-brand-500' : 'bg-indigo-500'}`}
            >
              ✍️
            </button>
          </div>

          {/* Campus Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {campuses.map(campus => (
              <button
                key={campus}
                onClick={() => setFilter(campus)}
                className={`py-1.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  filter === campus
                    ? (isDating ? 'bg-brand-500 border-brand-400 text-white' : 'bg-indigo-500 border-indigo-400 text-white')
                    : 'bg-white/5 border-white/5 text-dark-400 hover:bg-white/10'
                }`}
              >
                {campus}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-12 h-12 border-4 rounded-full border-t-transparent animate-spin ${isDating ? 'border-brand-500' : 'border-indigo-500'}`} />
            <p className="mt-4 text-dark-500 text-xs font-black uppercase tracking-widest animate-pulse">Scanning the campus...</p>
          </div>
        ) : (
          <AnimatePresence>
            {data?.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                mode={mode} 
                onLike={handleLike} 
                onVibeCheck={handleVibeCheck}
                onProfileClick={handleProfileClick}
              />
            ))}
          </AnimatePresence>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6 grayscale opacity-30">🔇</div>
            <h3 className="text-white font-black text-xl mb-2 tracking-tighter">Quiet on Campus</h3>
            <p className="text-dark-500 text-sm font-medium">Be the first to break the silence at {filter}!</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-3xl"
            >
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tighter">
                <span className="text-3xl">✍️</span> Share a Vibe
              </h2>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <textarea
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's happening on your campus?"
                  className="w-full h-40 bg-white/5 border border-white/5 rounded-3xl p-6 text-white text-lg placeholder:text-dark-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <select
                      value={newPost.campus || user?.university}
                      onChange={(e) => setNewPost({ ...newPost, campus: e.target.value })}
                      className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-dark-300 focus:outline-none"
                    >
                      {campuses.filter(c => c !== 'All Campuses').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setNewPost({ ...newPost, isAnonymous: !newPost.isAnonymous })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        newPost.isAnonymous ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-dark-500'
                      }`}
                    >
                      👻 Anonymous
                    </button>
                  </div>

                  <button
                    disabled={createMutation.isLoading || !newPost.content.trim()}
                    type="submit"
                    className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isDating ? 'btn-premium-v2' : 'btn-study'} disabled:opacity-50`}
                  >
                    {createMutation.isLoading ? 'Posting...' : 'Post Pulse'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfile && (
          <ProfileSheet
            profile={selectedProfile}
            isDating={isDating}
            isLiked={isLiking.has(selectedProfile.id)}
            onLike={handleProfileLike}
            onClose={() => setSelectedProfile(null)}
            onChat={async () => {
              setSelectedProfile(null);
              await handleVibeCheck(selectedProfile.id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pulse;
