import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';

// ─── Post Card ──────────────────────────────────────────────────────────────
const PostCard = ({ post, mode, onLike }) => {
    const isDating = mode === 'dating';
    const isAnonymous = post.is_anonymous;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card-premium p-8 mb-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl ${isAnonymous ? 'border-indigo-500/30 shadow-indigo-500/10' : 'border-white/5 shadow-white/5'
                }`}
        >
            {/* Ghost background for anonymous posts */}
            {isAnonymous && (
                <div className="absolute -top-10 -right-10 text-9xl opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                    👻
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-2xl border-2 transition-transform duration-500 group-hover:scale-110 ${isAnonymous ? 'border-indigo-500/50 bg-indigo-900/30' : isDating ? 'border-brand-500/50 bg-brand-500/20' : 'border-indigo-500/50 bg-indigo-500/20'
                        }`}>
                        {isAnonymous ? (
                            <div className="w-full h-full flex items-center justify-center text-2xl drop-shadow-lg">👻</div>
                        ) : (
                            <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || post.first_name}&background=random`} alt={post.authorName} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-white font-black text-base tracking-tight leading-none mb-1.5 flex items-center gap-2">
                            {isAnonymous ? 'Ghost User' : post.first_name || 'Campus Student'}
                            {!isAnonymous && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                        </h4>
                        <div className="flex items-center gap-2.5">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isAnonymous ? 'text-indigo-400' : 'text-dark-400'}`}>{post.campus}</span>
                            <span className="w-1 h-1 rounded-full bg-dark-700" />
                            <span className="text-dark-500 text-[10px] font-black uppercase tracking-tighter opacity-60">
                                {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                {post.type === 'confession' && (
                    <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                        Confession
                    </div>
                )}
            </div>

            {/* Content */}
            <p className="text-dark-100 text-[17px] leading-relaxed mb-8 font-medium tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
                {post.content}
            </p>

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => onLike(post.id)} className="flex items-center gap-2 group/btn">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover/btn:bg-brand-500/20 group-hover/btn:scale-110 active:scale-95`}>
                            <span className="text-sm group-hover/btn:scale-125 transition-transform">🔥</span>
                        </div>
                        <span className="text-dark-400 text-xs font-black uppercase tracking-widest group-hover/btn:text-white transition-colors">{post.likes_count || 0}</span>
                    </button>

                    <button className="flex items-center gap-2 group/btn">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover/btn:bg-blue-500/20 group-hover/btn:scale-110 active:scale-95`}>
                            <span className="text-sm group-hover/btn:scale-125 transition-transform">💬</span>
                        </div>
                        <span className="text-dark-400 text-xs font-black uppercase tracking-widest group-hover/btn:text-white transition-colors">{post.comments_count || 0}</span>
                    </button>
                </div>

                <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all active:scale-90">
                    <span className="text-dark-400 text-sm">📤</span>
                </button>
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

    const isDating = mode === 'dating';
    const { data: dynamicCampuses, isLoading: loadingCampuses } = useQuery(
        'pulse-campuses',
        async () => {
            const res = await api.get('/pulse/campuses');
            return res.data.campuses || [];
        }
    );
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
                import('react-hot-toast').then(module => module.toast.success('✨ Vibe shared successfully!'));
            },
            onError: (err) => {
                console.error(err);
                import('react-hot-toast').then(module => module.toast.error(err.response?.data?.message || 'Failed to post. Try again.'));
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
            onError: () => import('react-hot-toast').then(module => module.toast.error('Could not like post right now.'))
        }
    );

    const handleLike = (postId) => {
        likeMutation.mutate(postId);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
            {/* Search & Tabs Header */}
            <div className="sticky top-[64px] z-40 bg-dark-950/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-6 border-b border-white/5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                            {['Trending', 'New', 'Confessions'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[11px] font-black uppercase tracking-[0.35em] transition-all relative py-3 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-dark-500 hover:text-dark-300'
                                        }`}
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

                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isDating ? 'bg-brand-500 shadow-brand-500/20' : 'bg-indigo-500 shadow-indigo-500/20'} hover:scale-110 active:scale-95`}
                        >
                            <span className="text-xl text-white">✨</span>
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {campuses.map(campus => (
                            <button
                                key={campus}
                                onClick={() => setFilter(campus)}
                                className={`py-1.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === campus
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
                            <PostCard key={post.id} post={post} mode={mode} onLike={handleLike} />
                        ))}
                    </AnimatePresence>
                )}

                {/* Empty State */}
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
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newPost.isAnonymous
                                                ? 'bg-indigo-500 border-indigo-400 text-white'
                                                : 'bg-white/5 border-white/5 text-dark-500'}`}
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

            {/* Floating Create Button for mobile */}
            <button
                onClick={() => setIsCreateOpen(true)}
                className={`fixed bottom-32 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl shadow-[0_8px_30px_rgba(244,63,94,0.6)] z-[110] transition-all hover:scale-110 active:scale-90 ${isDating ? 'bg-brand-500' : 'bg-indigo-500'}`}
            >
                ✍️
            </button>
        </div>
    );
};

export default Pulse;
