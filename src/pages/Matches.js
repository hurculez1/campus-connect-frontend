import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';
import { ProfileSheet, HeartBurst } from './Discover';
import toast from 'react-hot-toast';

// Always show real date/time — never relative "in about X hours"
// Removed timestamp utility as per user request
const formatMessageTime = () => '';

const Matches = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  
  const { user, mode } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isDating = mode === 'dating';

  // Fetch already liked IDs
  useQuery(
    ['likedUserIds'],
    () => api.get('/matches/liked-ids').then(r => r.data.ids || []),
    {
      onSuccess: (ids) => setLikedIds(new Set(ids)),
      staleTime: 60000
    }
  );

  // Polling fallback (faster for near-real-time)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries('matches');
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('likes');
    }, 5000); 
    return () => clearInterval(interval);
  }, [queryClient]);

  // Handle Swipe (Like/Pass)
  const swipeMutation = useMutation(
    (payload) => api.post('/matches/swipe', payload),
    {
      onSuccess: (res, vars) => {
        if (res.data.isMatch) {
          toast.success("It's a Match! ✨");
          queryClient.invalidateQueries('matches');
        }
        if (vars.direction === 'like') {
          setLikedIds(prev => new Set([...prev, vars.targetUserId]));
        }
        queryClient.invalidateQueries('likes');
      }
    }
  );

  const handleLike = (profile) => {
    if (likedIds.has(profile.id)) return;
    swipeMutation.mutate({ targetUserId: profile.id, direction: 'like' });
  };

  const handleChat = async (profile) => {
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
  };

  // Real-time socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://backend-iota-azure-90.vercel.app';

    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socket.on('new_message', () => { queryClient.invalidateQueries('matches'); queryClient.invalidateQueries('notifications'); });
    socket.on('new_connection_message', () => { queryClient.invalidateQueries('connections'); queryClient.invalidateQueries('notifications'); });
    socket.on('new_match', () => { queryClient.invalidateQueries('matches'); queryClient.invalidateQueries('notifications'); });
    socket.on('new_like', () => { queryClient.invalidateQueries('likes'); queryClient.invalidateQueries('notifications'); });
    socket.on('match_request', () => { queryClient.invalidateQueries('match-requests'); queryClient.invalidateQueries('notifications'); });
    socket.on('match_accepted', () => { queryClient.invalidateQueries('matches'); queryClient.invalidateQueries('match-requests'); queryClient.invalidateQueries('notifications'); });

    return () => socket.disconnect();
  }, [queryClient]);

  const { data: matchesData, isLoading: matchesLoading } = useQuery(
    'matches',
    () => api.get('/matches').then(res => res.data),
    { staleTime: 0, retry: false }
  );

  const { data: connectionsData, isLoading: connectionsLoading } = useQuery(
    'connections',
    () => api.get('/chat/connections').then(res => res.data),
    { staleTime: 0, retry: false }
  );

  const { data: likesData, isLoading: likesLoading } = useQuery(
    'likes',
    () => api.get('/matches/likes').then(res => res.data),
    { staleTime: 0, retry: false }
  );

  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery(
    'match-requests',
    () => api.get('/matches/requests').then(res => res.data),
    { staleTime: 10000, retry: false }
  );

  const acceptMatchMutation = useMutation(
    (requestId) => api.post('/matches/accept', { requestId }),
    {
      onSuccess: (data) => {
        refetchRequests();
        queryClient.invalidateQueries('matches');
        if (data.data.matchId) navigate(`/chat/${data.data.matchId}`);
      }
    }
  );

  const rejectMatchMutation = useMutation(
    (requestId) => api.post('/matches/reject', { requestId }),
    { onSuccess: () => refetchRequests() }
  );

  const allMatches = matchesData?.matches || [];
  const allConnections = connectionsData?.connections || [];
  const likes = likesData?.users || [];
  const newLikesCount = likesData?.newCount || likesData?.count || 0;
  const isLikesBlurred = likesData?.blurred === true;
  const pendingRequests = requestsData?.received || [];

  const chats = allMatches;
  const newMatches = allMatches; // Show all matches as per user request

  // Mark likes as seen when visiting the tab
  useEffect(() => {
    if (activeTab === 'likes' && newLikesCount > 0) {
      api.post('/matches/seen-likes')
        .then(() => queryClient.invalidateQueries('notifications'))
        .catch(err => console.error('Failed to mark likes as seen', err));
    }
  }, [activeTab, newLikesCount, queryClient]);

  const unreadCount = allMatches.reduce((acc, m) => acc + (m.unread_count || 0), 0) +
    allConnections.reduce((acc, c) => acc + (c.unread_count || 0), 0) +
    pendingRequests.length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 pb-20">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
          Your Connections
          {unreadCount > 0 && (
            <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}>
              {unreadCount} NEW
            </span>
          )}
        </h1>
        <p className="text-dark-400 text-xs font-medium mt-1 uppercase tracking-widest">People you've connected with on campus</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-white/5 border border-white/5">
        {[
          { id: 'chats', label: 'Chats', icon: '💬', count: chats.length + allConnections.length + pendingRequests.length, unread: unreadCount },
          { id: 'matches', label: 'Matches', icon: '❤️', count: newMatches.length, unread: newMatches.length },
          { id: 'likes', label: 'Liked You', icon: '⭐', count: newLikesCount, unread: newLikesCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${activeTab === tab.id
              ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-lg shadow-brand-500/20 scale-[1.02]'
              : 'text-dark-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="inline">{tab.label}</span>
            {tab.unread > 0 && (
              <span className="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white shadow-lg shadow-brand-500/40 ring-2 ring-dark-950">
                {tab.unread > 9 ? '9+' : tab.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'chats' && (
          <div className="space-y-6">
            {/* New Matches Row (Horizontal) */}
            {newMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-dark-500 uppercase tracking-widest px-1">New Connections</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                  {newMatches.map(match => (
                    <div key={match.match_id} className="flex-shrink-0 flex flex-col items-center gap-2 group">
                      <motion.div
                        onTap={() => setSelectedProfile(match)}
                        className={`w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-500/30 group-hover:border-brand-500 transition-all shadow-lg active:scale-95 cursor-zoom-in`}
                      >
                        <img src={match.profile_photo_url || `https://ui-avatars.com/api/?name=${match.first_name}&background=random`} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                      <Link to={`/chat/${match.match_id}`} className="text-[10px] font-bold text-white tracking-tight">{match.first_name}</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Match Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-brand-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <span>⏳</span> Pending Requests
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          onClick={() => setSelectedProfile(req)}
                          className="w-12 h-12 rounded-xl overflow-hidden cursor-zoom-in ring-2 ring-brand-500/30"
                        >
                          <img src={req.profile_photo_url || `https://ui-avatars.com/api/?name=${req.first_name}&background=random`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm tracking-tight">{req.first_name}</p>
                          <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest">{req.university}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptMatchMutation.mutate(req.id)}
                          disabled={acceptMatchMutation.isLoading}
                          className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                        >
                          {acceptMatchMutation.isLoading ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => rejectMatchMutation.mutate(req.id)}
                          disabled={rejectMatchMutation.isLoading}
                          className="flex-1 py-2.5 rounded-xl bg-white/5 text-dark-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-dark-500 uppercase tracking-widest px-1 mb-3">Recent Messages</h3>
              {matchesLoading || connectionsLoading ? (
                <LoadingStack />
              ) : chats.length === 0 && allConnections.length === 0 && pendingRequests.length === 0 ? (
                <EmptyState
                  icon="💌"
                  title="No messages yet"
                  desc="Start a conversation! Your matches and connections will appear here once you say hello."
                  cta="Start Discovering"
                  ctaLink="/discover"
                />
              ) : (
                <>
                  {chats.map((match, i) => (
                    <MatchCard key={match.match_id} match={match} index={i} onPhotoTap={() => setSelectedProfile(match)} />
                  ))}
                  {allConnections.map((conn, i) => (
                    <ConnectionCard key={conn.id} connection={conn} index={i} onPhotoTap={() => setSelectedProfile(conn)} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 gap-1">
            {matchesLoading ? (
              <LoadingStack />
            ) : newMatches.length === 0 ? (
              <EmptyState
                icon="❤️"
                title="No new matches"
                desc="Keep exploring the campus to find your next connection!"
                cta="Start Discovering"
                ctaLink="/discover"
              />
            ) : (
              newMatches.map((match, i) => (
                <MatchCard key={match.match_id} match={match} index={i} onPhotoTap={() => setSelectedProfile(match)} />
              ))
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div>
            {likesLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin border-brand-500" />
              </div>
            ) : likes.length === 0 ? (
              <EmptyState
                icon="🌟"
                title="No likes yet"
                desc={user?.subscriptionTier === 'free' ? "Be the first to make a move! Upgrade to Premium to see who liked you." : "Be the first to make a move! Go to Discover to find matches!"}
                cta={user?.subscriptionTier === 'free' ? "Upgrade to Premium" : "Discover"}
                ctaLink={user?.subscriptionTier === 'free' ? "/subscription" : "/discover"}
              />
            ) : (
              <div className="space-y-4">
                {/* Teaser for free users */}
                {isLikesBlurred && (
                  <div className="glass-card-premium p-6 mb-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left border-brand-500/20">
                    <div className="w-16 h-16 rounded-3xl bg-brand-500/10 flex items-center justify-center text-3xl shadow-inner">✨</div>
                    <div className="flex-1">
                      <p className="text-white font-black text-lg tracking-tight">{likesData.count} people liked you!</p>
                      <p className="text-dark-400 text-sm font-medium">Upgrade to Premium to reveal their profiles and match instantly.</p>
                    </div>
                    <Link to="/subscription" className="btn-premium-v2 py-3 px-8 text-xs">Unlock Now</Link>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {likes.map((like, i) => (
                    <motion.div
                      key={like.id || i}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => !isLikesBlurred && setSelectedProfile(like)}
                      className={`glass-card-premium overflow-hidden aspect-[3/4] relative group cursor-pointer ${isLikesBlurred ? 'cursor-default' : ''}`}
                    >
                      <div className="w-full h-full">
                        <img
                          src={like.profile_photo_url || `https://ui-avatars.com/api/?name=${like.first_name}&background=random`}
                          alt=""
                          className={`w-full h-full object-cover transition-all duration-700 ${isLikesBlurred ? 'blur-2xl scale-125' : 'group-hover:scale-110'}`}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-white font-black text-sm tracking-tight">{isLikesBlurred ? 'Someone' : like.first_name}</p>
                        <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest truncate">{like.university}</p>
                      </div>
                      {isLikesBlurred && (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">❓</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProfile && (
          <ProfileSheet
            profile={selectedProfile}
            isDating={isDating}
            isLiked={likedIds.has(selectedProfile.id)}
            onLike={(p) => handleLike(p)}
            onClose={() => setSelectedProfile(null)}
            onChat={async (p) => { await handleChat(p); setSelectedProfile(null); }}
          />
        )}
      </AnimatePresence>

      <ImageModal
        src={fullscreenImage}
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  );
};

const LoadingStack = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card p-5 flex items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/5 rounded-full w-1/3" />
          <div className="h-3 bg-white/5 rounded-full w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

const MatchCard = ({ match, index, onPhotoTap }) => {
  const unread = match.unread_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/chat/${match.match_id}`}
        className={`flex items-center gap-4 p-4 group transition-all duration-300 border-b border-white/5 ${unread > 0 ? 'bg-brand-500/5' : 'hover:bg-white/5'}`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPhotoTap(match);
            }}
            className={`w-14 h-14 rounded-2xl overflow-hidden shadow-xl transition-shadow cursor-zoom-in ${unread > 0 ? 'ring-2 ring-brand-500/50' : ''}`}
          >
            {match.profile_photo_url ? (
              <img src={match.profile_photo_url} alt={match.first_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #2a2420, #171514)' }}>
                👤
              </div>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-950 flex items-center justify-center ${match.last_active && (new Date() - new Date(match.last_active)) < 300000 ? 'bg-green-500' : 'bg-dark-600'
            }`}>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`font-bold text-base tracking-tight truncate ${unread > 0 ? 'text-white' : 'text-dark-200'}`}>
              {match.first_name} {match.last_name}
            </h4>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate font-medium ${unread > 0 ? 'text-white font-bold' : 'text-dark-400'}`}>
              {match.last_message || '✨ New match!'}
            </p>
            {unread > 0 && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ConnectionCard = ({ connection, index, onPhotoTap }) => {
  const unread = connection.unread_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/connection/${connection.id}`}
        className={`flex items-center gap-4 p-4 group transition-all duration-300 border-b border-white/5 ${unread > 0 ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPhotoTap(connection);
            }}
            className={`w-14 h-14 rounded-2xl overflow-hidden shadow-xl transition-shadow cursor-zoom-in ${unread > 0 ? 'ring-2 ring-indigo-500/50' : ''}`}
          >
            {connection.profile_photo_url ? (
              <img src={connection.profile_photo_url} alt={connection.first_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #2a2420, #171514)' }}>
                👤
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-950 bg-indigo-500 flex items-center justify-center">
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`font-bold text-base tracking-tight truncate ${unread > 0 ? 'text-white' : 'text-dark-200'}`}>
              {connection.first_name} {connection.last_name || ''}
            </h4>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate font-medium ${unread > 0 ? 'text-white font-bold' : 'text-dark-400'}`}>
              {connection.last_message || '💬 Start chatting!'}
            </p>
            {unread > 0 && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const EmptyState = ({ icon, title, desc, cta, ctaLink, onClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center glass-card-premium bg-white/[0.02]"
  >
    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl mb-6 shadow-inner">{icon}</div>
    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{title}</h3>
    <p className="text-dark-500 text-sm font-medium mb-8 max-w-[240px] leading-relaxed">{desc}</p>
    {ctaLink ? (
      <Link to={ctaLink} className="btn-premium-v2 py-3 px-10 text-xs">
        {cta}
      </Link>
    ) : (
      <button onClick={onClick} className="btn-premium-v2 py-3 px-10 text-xs text-white">
        {cta}
      </button>
    )}
  </motion.div>
);

export default Matches;
