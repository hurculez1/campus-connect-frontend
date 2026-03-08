import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';

// ─── SwipeCard — custom drag-based swipe ────────
const SwipeCard = ({ onSwipe, mode, children }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-28, 0, 28]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);

  const isDating = mode === 'dating';

  const handleDragEnd = useCallback((_, info) => {
    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 500;

    if (offset.x > swipeThreshold || (velocity.x > velocityThreshold && offset.x > 20)) {
      onSwipe('right');
    } else if (offset.x < -swipeThreshold || (velocity.x < -velocityThreshold && offset.x < -20)) {
      onSwipe('left');
    }
  }, [onSwipe]);

  return (
    <motion.div
      style={{ x, y: 0, rotate, position: 'absolute', inset: 0, zIndex: 20, cursor: 'grab' }}
      drag="x" // Horizontal drag only
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <motion.div 
        style={{ opacity: likeOpacity }} 
        className="absolute top-4 right-4 z-50 py-1 px-4 border-2 border-green-500 text-green-500 font-black text-2xl rounded-lg rotate-12 bg-black/40 backdrop-blur-md pointer-events-none"
      >
        {isDating ? 'LIKE ❤️' : 'STUDY 📚'}
      </motion.div>
      <motion.div 
        style={{ opacity: nopeOpacity }} 
        className="absolute top-4 left-4 z-50 py-1 px-4 border-2 border-red-500 text-red-500 font-black text-2xl rounded-lg -rotate-12 bg-black/40 backdrop-blur-md pointer-events-none"
      >
        NOPE
      </motion.div>
      {children}
    </motion.div>
  );
};

// ─── Profile Detail Modal ──────────────────────────────────────────────────
const ProfileDetailModal = ({ user, mode, onClose, onConnect, onAction }) => {
  const isDating = mode === 'dating';
  const age = user.date_of_birth
    ? Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-dark-950 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="w-full h-full max-w-2xl bg-dark-900 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Photo Header */}
        <div className="relative h-[45vh] flex-shrink-0">
          <img 
            src={user.profile_photo_url} 
            alt={user.first_name} 
            className="w-full h-full object-cover cursor-zoom-in" 
            onClick={() => onAction?.('fullscreen', user.profile_photo_url)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent pointer-events-none" />
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/70 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">{user.first_name}, {age}</h2>
              <p className={`font-black text-[10px] uppercase tracking-widest ${isDating ? 'text-brand-400' : 'text-indigo-400'}`}>
                📍 {user.university}
              </p>
            </div>
            {user.verification_status === 'verified' && (
              <div className="badge-verified">✓ Verified</div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Academic Vibe</h3>
              <div className="flex gap-4">
                <div className="bg-white/5 rounded-2xl p-4 flex-1 border border-white/5">
                  <p className="text-dark-500 text-[9px] font-black uppercase tracking-widest mb-1">Course</p>
                  <p className="text-white text-sm font-bold truncate">{user.course || 'Deciding...'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex-1 border border-white/5">
                  <p className="text-dark-500 text-[9px] font-black uppercase tracking-widest mb-1">Year</p>
                  <p className="text-white text-sm font-bold">{user.year_of_study || 'N/A'}</p>
                </div>
              </div>
            </div>

            {user.bio && (
              <div>
                <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">About Me</h3>
                <p className="text-dark-200 text-sm leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5">
                  {user.bio}
                </p>
              </div>
            )}

            {user.interests && user.interests.length > 0 && (
              <div>
                <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(user.interests) ? user.interests : []).map(tag => (
                    <span key={tag} className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 via-dark-900 to-transparent">
          <div className="flex gap-3">
            <button 
              onClick={() => { 
                onConnect(user.id); 
                onClose(); 
              }}
              className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 ${isDating ? 'bg-brand-500 shadow-brand-500/30' : 'bg-indigo-500 shadow-indigo-500/30'}`}
            >
              ❤️ Match Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Match Celebration Overlay ─────────────────────────────────────────────
const MatchCelebration = ({ match, mode, onClose, onMessage }) => {
  const isDating = mode === 'dating';

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="match-pop"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className={`text-center px-10 py-16 relative glass-card-premium max-w-sm mx-4 ${isDating ? 'border-brand-500/40' : 'border-indigo-500/40'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 25 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 1 }}
                  animate={{ y: 600, opacity: 0, rotate: Math.random() * 720 }}
                  transition={{ duration: 2.5 + Math.random(), delay: Math.random() * 0.5 }}
                  className="absolute w-2 h-4 rounded-full top-0 left-1/2"
                  style={{
                    background: isDating
                      ? ['#f43f5e', '#f59e0b', '#fb7185'][Math.floor(Math.random() * 3)]
                      : ['#6366f1', '#a855f7', '#818cf8'][Math.floor(Math.random() * 3)],
                  }}
                />
              ))}
            </div>

            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-9xl mb-6 drop-shadow-2xl"
            >
              {isDating ? '❤️' : '⚡'}
            </motion.div>

            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">
              {isDating ? "It's a Match!" : "Study Buddy Found!"}
            </h2>
            <p className="text-dark-300 text-lg mb-10 font-medium">
              {isDating
                ? <>You and <span className="text-brand-400 font-black">{match?.firstName}</span> liked each other!</>
                : <>You and <span className="text-indigo-400 font-black">{match?.firstName}</span> share the same vibe!</>}
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={onMessage} className={isDating ? 'btn-premium-v2 w-full py-4 uppercase font-black text-sm tracking-widest' : 'btn-study w-full py-4 uppercase font-black text-sm tracking-widest'}>
                💬 Send Message
              </button>
              <button onClick={onClose} className="text-dark-400 text-xs font-black uppercase tracking-widest mt-2 hover:text-white transition-colors">
                Keep Exploring
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Profile Card ───────────────────────────────────────────────────────────
const ProfileCard = ({ profile, mode, onTap }) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const isDating = mode === 'dating';

  const age = profile.date_of_birth
    ? Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  let parsedInterests = [];
  try {
    parsedInterests = profile.interests ? (typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests) : [];
  } catch (e) {
    parsedInterests = [];
  }
  const interests = Array.isArray(parsedInterests) ? parsedInterests : [];
  let parsedPhotos = [];
  try {
    const rawPhotos = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos;
    parsedPhotos = Array.isArray(rawPhotos) ? rawPhotos : [];
  } catch (e) {
    parsedPhotos = [];
  }
  const photos = [profile.profile_photo_url, ...parsedPhotos].filter(Boolean);
  const navigate = useNavigate();

  const handleGoToChat = async (e) => {
    e.stopPropagation();
    try {
      // Create actual match
      const res = await api.post('/matches/direct', { targetUserId: profile.id });
      if (res.data.matchId) {
        navigate(`/chat/${res.data.matchId}`);
      } else {
        navigate('/matches');
      }
    } catch (err) {
      console.error('Chat start failed from Discover:', err);
      navigate('/matches');
    }
  };

  return (
    <div 
      onClick={onTap}
      className={`swipe-card border-white/5 shadow-2xl overflow-hidden rounded-[2rem] bg-dark-900 group w-full h-full cursor-pointer active:scale-[0.98] transition-transform`}
    >
      <div className="relative h-full w-full">
        {/* Photo tap zones */}
        {photos.length > 1 && (
          <div className="absolute inset-x-0 top-0 bottom-20 z-20 flex">
            <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.max(0, i - 1)); }} className="flex-1 cursor-w-resize" />
            <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.min(photos.length - 1, i + 1)); }} className="flex-1 cursor-e-resize" />
          </div>
        )}

        {/* Photo with dynamic border shadow */}
        <AnimatePresence mode="wait">
          <motion.div key={photoIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 transition-all duration-700">
            {photos[photoIdx] ? (
              <img src={photos[photoIdx]} alt={profile.first_name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105" draggable={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl"
                style={{ background: isDating ? 'linear-gradient(135deg, #1a1614, #f43f5e10)' : 'linear-gradient(135deg, #0d0b0a, #6366f110)' }}>
                {profile.gender === 'female' ? '👨🏾' : '👩🏾'}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
            {photos.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full bg-white/20 overflow-hidden`}>
                <div className={`h-full transition-all duration-300 ${i === photoIdx ? 'w-full bg-white' : 'w-0'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent pointer-events-none" />

        {/* Dynamic Badges */}
        <div className="absolute top-6 right-5 z-30 flex flex-col gap-1.5 scale-90 origin-right">
          {profile.verification_status === 'verified' && (
            <div className="badge-verified shadow-lg">✓ Verified</div>
          )}
          {profile.subscription_tier === 'vip' && (
            <div className="badge-vip shadow-lg">👑 VIP</div>
          )}
          {!isDating && (
            <div className="py-1 px-3 rounded-full bg-indigo-500/90 text-white font-black text-[9px] uppercase tracking-widest shadow-lg backdrop-blur-md">📚 STUDY BUDDY</div>
          )}
        </div>

        {/* Info Section */}
        <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8 z-10 transition-transform duration-500 group-hover:translate-y-[-5px]">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-white font-black text-3xl tracking-tighter">{profile.first_name}</h3>
          </div>

          <div className={`flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em] mb-3 ${isDating ? 'text-brand-400' : 'text-indigo-400'}`}>
            <span className="text-xs">📍</span> {profile.university}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {age && (
              <span className="py-1 px-2.5 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-[9px] uppercase tracking-widest">
                🎂 Age {age}
              </span>
            )}
            {profile.course && (
              <span className="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-[9px] font-black uppercase tracking-widest">
                🎓 {profile.course.length > 20 ? profile.course.slice(0, 20) + '...' : profile.course}
              </span>
            )}
            {isDating && profile.year_of_study && (
              <span className="py-1 px-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[9px] font-black uppercase tracking-widest">
                📅 Year {profile.year_of_study}
              </span>
            )}
          </div>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1 opacity-0 lg:group-hover:opacity-100 transition-all duration-500 transform translate-y-4 lg:group-hover:translate-y-0 hidden sm:flex">
              {interests.slice(0, 4).map((tag, i) => (
                <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-white/50 border border-white/5 px-2 py-1 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Floating Chat Button to Inbox */}
        <button 
          onClick={handleGoToChat}
          onPointerDown={(e) => e.stopPropagation()} 
          className={`absolute bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 border ${isDating ? 'bg-brand-500 shadow-brand-500/30 border-brand-400' : 'bg-indigo-500 shadow-indigo-500/30 border-indigo-400'}`}
          aria-label="Go to Inbox"
        >
          <span className="text-lg">💬</span>
        </button>
      </div>
    </div>
  );
};

// ─── Discover Page ──────────────────────────────────────────────────────────
const Discover = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mode } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchCelebration, setMatchCelebration] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [lastDirection, setLastDirection] = useState(null);
  const [history, setHistory] = useState([]); // Track swipe history

  const isDating = mode === 'dating';

  const { data: potentialMatches, isLoading, refetch } = useQuery(
    ['potentialMatches', mode],
    () => api.get(`/users/discover?mode=${mode}`).then(res => res.data),
    { staleTime: 60000, retry: false }
  );

  const swipeMutation = useMutation(
    (data) => api.post('/matches/swipe', data),
    {
      onSuccess: (res, variables) => {
        if (res.data.isMatch && res.data.matchedUser) {
          setMatchCelebration(res.data.matchedUser);
        }
      },
    }
  );

  const directMatchMutation = useMutation(
    (targetUserId) => api.post('/matches/direct', { targetUserId }),
    {
      onSuccess: (res) => {
        if (res.data.matchId) {
          // Show match celebration
          const profile = matches[currentIndex];
          if (profile) {
            setMatchCelebration({ id: profile.id, firstName: profile.first_name });
          }
        }
      },
    }
  );

  const matches = potentialMatches?.matches || [];
  const swipeLimit = potentialMatches?.swipeLimit;
  const currentMatch = matches[currentIndex];

  const handleDirectMatch = async (userId) => {
    if (!userId) return;
    try {
      // Create actual match
      const res = await api.post('/matches/direct', { targetUserId: userId });
      if (res.data.matchId) {
        navigate(`/chat/${res.data.matchId}`);
      } else {
        navigate('/matches');
      }
    } catch (err) {
      console.error('Direct match failed:', err);
      navigate('/matches');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0 && history.length > 0) {
      setCurrentIndex(prev => prev - 1);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const onSwipe = useCallback((direction, profile) => {
    const swipeMap = { right: 'like', left: 'pass', up: 'super_like' };
    const dir = swipeMap[direction] || direction;
    setLastDirection(direction);
    
    // Add to history BEFORE incrementing index
    setHistory(prev => [...prev, { profile, direction }]);
    
    swipeMutation.mutate({ targetUserId: profile.id, direction: dir, profile: profile });
    setCurrentIndex(prev => prev + 1);
  }, [swipeMutation]);

  const programmaticSwipe = (dir) => {
    if (!currentMatch) return;
    onSwipe(dir, currentMatch);
  };

  // Keyboard Listeners
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (matchCelebration) return;
      if (e.key === 'ArrowLeft') programmaticSwipe('left');
      if (e.key === 'ArrowRight') programmaticSwipe('right');
      if (e.key === 'ArrowUp') programmaticSwipe('up');
      if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMatch, matchCelebration, history]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[480px] gap-6">
        <div className={`w-14 h-14 rounded-2xl animate-spin shadow-2xl ${isDating ? 'shadow-brand-500/20' : 'shadow-indigo-500/20'}`}
          style={{ border: '3px solid rgba(255,255,255,0.05)', borderTopColor: isDating ? '#f43f5e' : '#6366f1' }} />
        <p className="text-dark-400 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Campus...</p>
      </div>
    );
  }

  if (swipeLimit?.remaining === 0) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center h-[500px] text-center px-10 glass-card-premium border-white/5 shadow-2xl">
        <div className={`w-20 h-20 rounded-[1.5rem] mb-6 flex items-center justify-center text-3xl shadow-2xl ${isDating ? 'bg-brand-500 shadow-brand-500/30' : 'bg-indigo-500 shadow-indigo-500/30'}`}>⏰</div>
        <h2 className="text-2xl font-black text-white mb-3 tracking-tighter">Swipe Limit Reached</h2>
        <p className="text-dark-400 mb-8 text-xs font-medium leading-relaxed">You've found some great people today! Come back tomorrow or upgrade for unlimited discovery.</p>
        <button onClick={() => navigate('/subscription')} className={isDating ? 'btn-premium-v2 w-full py-4 text-xs' : 'btn-study w-full py-4 text-xs'}>✨ Unlock Unlimited</button>
      </div>
    );
  }

  if (currentIndex >= matches.length && matches.length > 0) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center h-[500px] text-center px-10 glass-card-premium border-white/5 shadow-2xl">
        <div className="text-6xl mb-6 animate-bounce">🌟</div>
        <h2 className="text-2xl font-black text-white mb-3 tracking-tighter">All Caught Up!</h2>
        <p className="text-dark-400 mb-8 text-xs font-medium leading-relaxed">You've seen all the students in your area for now.</p>
        <div className="flex flex-col w-full gap-3">
          <button onClick={() => { setCurrentIndex(0); setHistory([]); refetch(); }} className={isDating ? 'btn-premium-v2 py-4 text-xs' : 'btn-study py-4 text-xs'}>🔄 Scan Again</button>
          <button onClick={handleBack} className="text-dark-400 text-[10px] font-black uppercase tracking-widest mt-1 hover:text-white transition-colors">Go Back to Last Profile</button>
          <button onClick={() => navigate('/matches')} className="text-dark-400 text-[10px] font-black uppercase tracking-widest mt-3 hover:text-white transition-colors">💬 Your Matches</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetailModal 
            user={selectedProfile} 
            mode={mode} 
            onClose={() => setSelectedProfile(null)} 
            onConnect={handleDirectMatch}
          />
        )}
      </AnimatePresence>

      <MatchCelebration 
        match={matchCelebration} 
        mode={mode} 
        onClose={() => setMatchCelebration(null)} 
        onMessage={() => { 
          setMatchCelebration(null); 
          navigate('/matches'); 
        }} 
      />

      <div className="max-w-md lg:max-w-2xl mx-auto px-4 relative flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)]">
        {/* Progress bar */}
        {swipeLimit && (
          <div className="mb-4 flex items-center gap-4 group flex-shrink-0">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/5 shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(swipeLimit.remaining / swipeLimit.limit) * 100}%` }}
                className={`h-full rounded-full transition-all duration-700 ${isDating ? 'bg-gradient-to-r from-brand-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-gradient-to-r from-indigo-600 to-violet-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'}`} />
            </div>
            <span className="text-dark-400 text-[9px] font-black uppercase tracking-widest whitespace-nowrap group-hover:text-white transition-colors">
              {swipeLimit.remaining} LEFT
            </span>
          </div>
        )}

        {/* Swipe Stack */}
        <div className="relative perspective-lg w-full flex-1 min-h-0 max-h-[520px] lg:max-h-[600px]">
          {currentIndex < matches.length && (
            <>
              {/* Tap-to-swipe Arrows - visible on all screens */}
              <button 
                onClick={(e) => { e.stopPropagation(); programmaticSwipe('left'); }}
                className="absolute left-0 sm:left-2 lg:left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-2xl text-white shadow-2xl backdrop-blur-xl hover:bg-red-500 transition-all active:scale-75 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">✕</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); programmaticSwipe('right'); }}
                className="absolute right-0 sm:right-2 lg:right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-2xl text-white shadow-2xl backdrop-blur-xl hover:bg-green-500 transition-all active:scale-75 group"
              >
                <span className="group-hover:translate-x-1 transition-transform">❤️</span>
              </button>

              {/* Back Button */}
              {history.length > 0 && (
                <div className="absolute top-[-40px] right-0 z-50">
                  <button 
                    onClick={handleBack}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base text-dark-400 hover:bg-white hover:text-black transition-all group active:scale-75"
                    title="Swipe Back"
                  >
                    <span className="group-hover:rotate-[-45deg] transition-transform">↺</span>
                  </button>
                </div>
              )}
            </>
          )}

          {matches.slice(currentIndex, currentIndex + 3).map((match, stackIdx) => {
            const isTop = stackIdx === 0;
            return (
              <motion.div key={match.id} layout initial={false}
                style={{ zIndex: isTop ? 20 : 10 - stackIdx, pointerEvents: isTop ? 'auto' : 'none', position: 'absolute', inset: 0 }}
                animate={{ scale: 1 - stackIdx * 0.05, y: stackIdx * 12, opacity: 1 - stackIdx * 0.3 }}
                transition={{ duration: 0.4, ease: 'backOut' }}
              >
                {isTop ? (
                  <SwipeCard mode={mode} onSwipe={(dir) => onSwipe(dir, match)}>
                    <ProfileCard profile={match} mode={mode} onTap={() => setSelectedProfile(match)} />
                  </SwipeCard>
                ) : (
                  <ProfileCard profile={match} mode={mode} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Primary Action Control */}
        <div className="flex items-center justify-center mt-5 mb-2 group-shrink-0 z-50 relative pointer-events-auto">
          <button onClick={() => {
            const profile = matches[currentIndex];
            if (profile?.id) {
              // Create direct match
              directMatchMutation.mutate(profile.id);
              // Move to next card
              setTimeout(() => {
                setLastDirection('right');
                setHistory(prev => [...prev, { profile, direction: 'right' }]);
                setCurrentIndex(prev => prev + 1);
              }, 500);
            }
          }}
            className={`w-full max-w-[260px] py-4 flex items-center justify-center gap-3 text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-widest rounded-2xl ${isDating ? 'bg-gradient-to-r from-brand-500 to-rose-500 border-2 border-brand-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-indigo-400'} text-white`}>
            <span className="text-lg">❤️</span> Match Now
          </button>
        </div>

        {/* Swipe Hint */}
        <div className="flex items-center justify-center gap-8 py-2 text-dark-500 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">✕</span>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">❤️</span>
            <span>Like</span>
          </div>
        </div>

        {/* Direction feedback overlay */}
        <AnimatePresence>
          {lastDirection && (
            <motion.div key={lastDirection} initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 2 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
              className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl z-50 pointer-events-none drop-shadow-2xl`}>
              {lastDirection === 'right' ? (isDating ? '❤️' : '📚') : '👋'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Discover;