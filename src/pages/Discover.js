import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// ─── Heart Burst Animation ──────────────────────────────────────────────────
export const HeartBurst = ({ onDone }) => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }}
      onAnimationComplete={onDone}
    >
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute text-2xl"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.4, 0],
            x: Math.cos((i / 8) * 2 * Math.PI) * 60,
            y: Math.sin((i / 8) * 2 * Math.PI) * 60,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >❤️</motion.div>
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 2, 1.5] }} transition={{ duration: 0.4 }} className="text-5xl">❤️</motion.div>
    </motion.div>
  );
};

// ─── Professional Profile Detail Sheet ──────────────────────────────────────────
export const ProfileSheet = ({ profile, isDating, isLiked, onLike, onClose, onChat }) => {
  const [sending, setSending] = useState(false);
  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 3600e3))
    : null;

  let interests = [];
  try { interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : (profile.interests || []); }
  catch { interests = []; }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-2xl flex items-end justify-center sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 350 }}
        className="w-full max-w-4xl bg-dark-950/90 border-t border-white/10 sm:border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col sm:flex-row h-[90vh] sm:h-[75vh] shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Photo (Desktop) / Top Area (Mobile) */}
        <div className="relative w-full sm:w-[45%] h-96 sm:h-full flex-shrink-0 group">
          <img 
            src={profile.profile_photo_url || `https://ui-avatars.com/api/?name=${profile.first_name}&background=1a1a2e&color=fff`}
            alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
          
          <button onClick={onClose}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-base transition-all active:scale-90 hover:bg-black/60 z-20">
            ✕
          </button>

          <div className="absolute bottom-6 left-8 right-8 z-10">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
                {profile.first_name}
              </h2>
              {profile.verification_status === 'verified' && <span className="text-blue-400 text-xl">✅</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {age && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-white`}>
                  🎂 {age} Years
                </span>
              )}
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md ${isDating ? 'text-rose-400' : 'text-indigo-400'}`}>
                📍 {profile.university || 'University'}
              </span>
              {profile.subscription_tier === 'vip' && (
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-dark-950 shadow-lg shadow-amber-500/20">
                  VIP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable Details */}
        <div className="flex-1 flex flex-col min-h-0 bg-dark-950/40">
           <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05] shadow-inner">
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Academic Progress</p>
                <p className="text-white text-xs font-bold">{profile.year_of_study ? `Year ${profile.year_of_study}` : 'N/A Student'}</p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05] shadow-inner">
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Study Field</p>
                <p className="text-white text-xs font-bold truncate">{profile.course || 'Global Scholar'}</p>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-3">
              <h3 className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] px-1">The Vibe</h3>
              <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/[0.03] shadow-inner">
                <p className="text-white/90 text-base leading-relaxed font-bold italic tracking-tight">
                  "{profile.bio || "Searching for the right words to describe my campus energy..."}"
                </p>
              </div>
            </div>

            {/* Interests Section */}
            {interests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] px-1">DNA & Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map(tag => (
                    <span key={tag} className="py-2 px-4 rounded-xl bg-white/5 border border-white/5 text-white/80 text-[10px] font-black hover:bg-white/10 transition-all">
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Bar spacer */}
            <div className="h-24 sm:h-8" />
          </div>

          {/* Action Bar - Fixed at bottom of the info panel */}
          <div className="p-6 border-t border-white/5 bg-dark-900/80 backdrop-blur-xl flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLike(profile)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-xl ${
                isLiked 
                  ? 'bg-green-500 text-white shadow-green-500/10 border border-green-400' 
                  : 'bg-white/5 text-white border border-white/10 hover:bg-rose-500/20'
              }`}
            >
              {isLiked ? '❤️' : '🤍'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => { 
                if (sending) return;
                setSending(true); 
                const targetId = profile.id || profile.userId;
                if (!targetId) { toast.error('User ID missing'); setSending(false); return; }
                await onChat(profile); 
                setSending(false); 
              }}
              disabled={sending}
              className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 ${
                isDating 
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' 
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
              } disabled:opacity-60 border border-white/10`}
            >
              <span className="text-lg">{sending ? '⏳' : '💬'}</span>
              <span>{sending ? 'Loading...' : 'Start Chat'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Single Full-Screen Card ──────────────────────────────────────────────────
const DiscoverCard = ({ profile, isDating, isLiked, onLike, onChat, onTap }) => {
  const [imgError, setImgError] = useState(false);
  const [burst, setBurst] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 3600e3))
    : null;

  let interests = [];
  try { interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : (profile.interests || []); }
  catch { interests = []; }

  const handleLike = (e) => {
    e.stopPropagation();
    if (!isLiked) setBurst(true);
    onLike(profile);
  };

  const handleChat = async (e) => {
    e.stopPropagation();
    if (chatLoading) return;
    setChatLoading(true);
    await onChat(profile);
    setChatLoading(false);
  };

  const photoSrc = (!imgError && profile.profile_photo_url)
    ? profile.profile_photo_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name)}&size=600&background=1e1b2e&color=ffffff&bold=true`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-dark-950" onClick={() => onTap(profile)}>
      {/* Full-bleed photo */}
      <img src={photoSrc} onError={() => setImgError(true)} alt={profile.first_name}
        className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Rich gradient — bottom-heavy for info readability */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] z-[5]" 
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.4) 45%, transparent 100%)' }} />

      {/* Heart burst on like */}
      {burst && <HeartBurst onDone={() => setBurst(false)} />}

      {/* Top badges */}
      <div className="absolute top-4 left-4 flex gap-1.5 z-10">
        {profile.verification_status === 'verified' && (
          <span className="text-[9px] font-black bg-blue-500/90 text-white px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-lg shadow-blue-500/20">VALIFIED</span>
        )}
        {profile.subscription_tier === 'vip' && (
          <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-dark-950 px-2.5 py-1 rounded-md shadow-lg shadow-amber-500/20 uppercase tracking-widest">VIP</span>
        )}
      </div>

      {/* Right-side action column (TikTok-style) */}
      <div
        className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-20"
        onClick={e => e.stopPropagation()}
      >
        {/* Like */}
        <motion.button whileTap={{ scale: 0.82 }} onClick={handleLike}
          className="flex flex-col items-center gap-1.5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] border transition-all duration-300 ${
            isLiked
              ? 'bg-green-500 border-green-400 shadow-green-500/40'
              : 'bg-black/40 border-white/20 backdrop-blur-xl hover:bg-rose-500/20'
          }`}>
            <span className="text-2xl">{isLiked ? '❤️' : '🤍'}</span>
          </div>
          <span className="text-white text-[9px] font-black uppercase tracking-widest drop-shadow-lg">Like</span>
        </motion.button>

        {/* Chat */}
        <motion.button whileTap={{ scale: 0.82 }} onClick={handleChat} disabled={chatLoading}
          className="flex flex-col items-center gap-1.5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] border backdrop-blur-xl transition-all duration-300 ${
            isDating ? 'bg-black/40 border-white/20 hover:bg-rose-500/40' : 'bg-black/40 border-white/20 hover:bg-indigo-500/40'
          } disabled:opacity-50`}>
            <span className="text-2xl">{chatLoading ? '⏳' : '💬'}</span>
          </div>
          <span className="text-white text-[9px] font-black uppercase tracking-widest drop-shadow-lg">Chat</span>
        </motion.button>

        {/* Info (opens profile sheet) */}
        <motion.button whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); onTap(profile); }}
          className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 rounded-full bg-black/40 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white text-[9px] font-black uppercase tracking-widest drop-shadow-lg">Details</span>
        </motion.button>
      </div>

      {/* Bottom info strip */}
      <div className="absolute bottom-4 inset-x-0 px-6 pb-14 z-10">
        {/* Name row */}
        <div className="flex items-end justify-between mb-3">
          <div className="flex-1 min-w-0 pr-20">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-white font-black text-3xl tracking-tighter drop-shadow-2xl">
                {profile.first_name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {age && (
                <span className="text-[9px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                  🎂 {age} YEARS
                </span>
              )}
              <p className={`text-[11px] font-black uppercase tracking-[0.25em] drop-shadow-lg ${isDating ? 'text-rose-400' : 'text-indigo-400'}`}>
                📍 {profile.university || 'University'}
              </p>
            </div>
          </div>
        </div>

        {/* Course + year chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.course && (
            <span className="py-1.5 px-3 rounded-2xl bg-white/10 border border-white/10 text-white text-[11px] font-black backdrop-blur-md shadow-lg">
              🎓 {profile.course}
            </span>
          )}
          {profile.year_of_study && (
            <span className="py-1.5 px-3 rounded-2xl bg-white/10 border border-white/10 text-white/80 text-[11px] font-black backdrop-blur-md shadow-lg">
              Year {profile.year_of_study}
            </span>
          )}
        </div>

        {/* Bio snippet */}
        {profile.bio && (
          <p className="text-white/80 text-base leading-snug line-clamp-2 pr-20 drop-shadow-md font-bold italic">
            "{profile.bio}"
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Empty / Loading state ────────────────────────────────────────────────────
const DiscoverEmpty = ({ isDating, refetch }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 px-8 bg-[#0a0a0f] text-center">
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      }} 
      transition={{ repeat: Infinity, duration: 4 }} 
      className="text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
    >
      🕵️‍♂️
    </motion.div>
    <div className="max-w-xs">
      <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Finding New Faces</h2>
      <p className="text-white/40 text-base font-medium leading-relaxed">We're scanning the campus for you. No one new right now, but we'll recycle everyone in a second!</p>
    </div>
    <button onClick={refetch}
      className={`group relative px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest active:scale-95 transition-all overflow-hidden ${
        isDating ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-500 shadow-indigo-500/20'
      } shadow-2xl text-white`}>
      <span className="relative z-10 flex items-center gap-3">
        <span className="text-xl">🔄</span> Refresh Campus
      </span>
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
    </button>
  </div>
);

// ─── Main Discover Page ────────────────────────────────────────────────────────
const Discover = () => {
  const navigate = useNavigate();
  const { mode } = useAuthStore();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef(null);

  const [matchAlert, setMatchAlert] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const isDating = mode === 'dating';

  // Fetch already liked IDs
  const { data: likedUserIds = [] } = useQuery(
    ['likedUserIds'],
    () => api.get('/matches/liked-ids').then(r => r.data.ids || []),
    { staleTime: Infinity } // Keep until invalidated
  );

  const likedIds = new Set(likedUserIds);

  // Handle keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedProfile) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      const cardHeight = container.clientHeight;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        container.scrollBy({ top: cardHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        container.scrollBy({ top: -cardHeight, behavior: 'smooth' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfile]);

  const { data, isLoading, refetch } = useQuery(
    ['potentialMatches', mode],
    () => api.get(`/users/discover?mode=${mode}&limit=50`).then(r => r.data),
    { staleTime: 60000, retry: false }
  );

  const hardRefresh = () => {
    queryClient.removeQueries(['potentialMatches', mode]);
    queryClient.invalidateQueries(['likedUserIds']);
    refetch();
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const swipeMutation = useMutation(
    (payload) => api.post('/matches/swipe', payload),
    {
      onSuccess: (res, vars) => {
        if (res.data.isMatch && res.data.matchedUser) {
          queryClient.invalidateQueries('matches');
          setMatchAlert({ ...res.data.matchedUser, _ts: Date.now() });
          setTimeout(() => setMatchAlert(null), 7000);
        }
        // Invalidate liked IDs so it persists
        queryClient.invalidateQueries(['likedUserIds']);
      },
      onError: () => {},
    }
  );


  const handleLike = useCallback((profile) => {
    if (likedIds.has(profile.id)) return;
    swipeMutation.mutate({ targetUserId: profile.id, direction: 'like' });
  }, [likedIds, swipeMutation]);

  const handleChat = useCallback(async (profile) => {
    try {
      const targetUserId = profile.id || profile.userId;
      if (!targetUserId) {
        toast.error('User information incomplete');
        return;
      }
      const res = await api.post('/chat/connection/start', { targetUserId });
      if (res.data.matchId) navigate(`/chat/${res.data.matchId}`);
      else if (res.data.connectionId) navigate(`/connection/${res.data.connectionId}`);
      else toast.error('Could not open chat');
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Could not open chat. Try again.');
    }
  }, [navigate]);

  const matches = data?.matches || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full bg-[#0a0a0f]">
        <div className="relative">
          <div className="w-16 h-16 rounded-[2rem] animate-spin"
            style={{ 
              border: '4px solid rgba(255,255,255,0.05)', 
              borderTopColor: isDating ? '#f43f5e' : '#6366f1',
              boxShadow: isDating ? '0 0 40px rgba(244,63,94,0.1)' : '0 0 40px rgba(99,102,241,0.1)'
            }} 
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📡</div>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Scanning Campus</p>
          <p className="text-white/20 text-[8px] font-bold mt-2">Connecting to local vibes...</p>
        </div>
      </div>
    );
  }

  // Exact height calculation for the TikTok scroll area
  // We subtract Header (approx 64px) and Nav (approx 84px)
  // Using a more robust calc and ensuring cards don't overlap nav.
  const availableHeight = 'calc(100dvh - 64px - 80px)';

  return (
    <>
      {/* Match Banner */}
      <AnimatePresence>
        {matchAlert && (
          <motion.div
            key={matchAlert._ts}
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className={`fixed top-0 inset-x-0 z-[400] safe-area-top shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}
          >
            <div className={`mx-4 mt-4 rounded-[2rem] p-4 flex items-center gap-4 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl`}>
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30">
                <img src={`https://ui-avatars.com/api/?name=${matchAlert.firstName}&background=random`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm tracking-tight italic">It's a Match! ✨</p>
                <p className="text-white/70 text-[11px] font-bold">You & {matchAlert.firstName} vibe!</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setMatchAlert(null);
                    if (matchAlert.matchId) { navigate(`/chat/${matchAlert.matchId}`); return; }
                    hardRefresh();
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 ${
                    isDating ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-500 shadow-indigo-500/20'
                  }`}
                >Chat →</button>
                <button onClick={() => setMatchAlert(null)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center">✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TikTok-style vertical scroll container */}
      {matches.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <DiscoverEmpty isDating={isDating} refetch={hardRefresh} />
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="w-full overflow-y-auto no-scrollbar"
          style={{
            height: availableHeight,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {matches.map((profile) => (
            <div
              key={profile.id}
              style={{ 
                scrollSnapAlign: 'start', 
                scrollSnapStop: 'always',
                height: availableHeight, 
                width: '100%',
                flexShrink: 0 
              }}
            >
              <DiscoverCard
                profile={profile}
                isDating={isDating}
                isLiked={likedIds.has(profile.id)}
                onLike={handleLike}
                onChat={handleChat}
                onTap={setSelectedProfile}
              />
            </div>
          ))}
        </div>
      )}

      {/* Profile detail sheet */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileSheet
            profile={selectedProfile}
            isDating={isDating}
            isLiked={likedIds.has(selectedProfile.id)}
            onLike={(p) => handleLike(p)}
            onClose={() => setSelectedProfile(null)}
            onChat={async (p) => { await handleChat(p); }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Discover;
