import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const Matches = () => {
  const [activeTab, setActiveTab] = useState('chats');

  const { data: matchesData, isLoading: matchesLoading } = useQuery(
    'matches',
    () => api.get('/matches').then(res => res.data),
    { staleTime: 30000, retry: false }
  );

  const { data: likesData, isLoading: likesLoading } = useQuery(
    'likes',
    () => api.get('/matches/likes').then(res => res.data),
    { staleTime: 30000, retry: false }
  );

  const allMatches = matchesData?.matches || [];
  const likes = likesData?.users || []; // Backend returns 'users' for likes
  
  const chats = allMatches.filter(m => m.last_message);
  const newMatches = allMatches.filter(m => !m.last_message);
  
  const unreadCount = allMatches.reduce((acc, m) => acc + (m.unread_count || 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
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
          { id: 'chats', label: 'Chats', icon: '💬', count: chats.length },
          { id: 'matches', label: 'Matches', icon: '❤️', count: newMatches.length },
          { id: 'likes', label: 'Liked You', icon: '⭐', count: likesData?.count || 0 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
               activeTab === tab.id 
               ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' 
               : 'text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">{tab.icon}</span> 
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-black ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-dark-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'chats' && (
          <div className="space-y-3">
            {matchesLoading ? <LoadingStack /> : chats.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No conversations yet"
                desc="Start a conversation with one of your matches to see them here!"
                cta="Go to Matches"
                onClick={() => setActiveTab('matches')}
              />
            ) : (
              chats.map((match, i) => (
                <MatchCard key={match.match_id} match={match} index={i} />
              ))
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matchesLoading ? <LoadingStack /> : newMatches.length === 0 ? (
              <EmptyState
                icon="❤️"
                title="No new matches"
                desc="Keep exploring the campus to find your next connection!"
                cta="Start Discovering"
                ctaLink="/discover"
              />
            ) : (
              newMatches.map((match, i) => (
                <MatchCard key={match.match_id} match={match} index={i} />
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
                desc="Be the first to make a move! Upgrade to Premium to see who liked you."
                cta="Upgrade to Premium"
                ctaLink="/subscription"
              />
            ) : (
              <div className="space-y-4">
                {/* Teaser for free users */}
                {likesData?.blurred && (
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card-premium overflow-hidden aspect-[3/4] relative group"
                    >
                      <div className="w-full h-full">
                        <img 
                          src={like.profile_photo_url || `https://ui-avatars.com/api/?name=${like.first_name}&background=random`} 
                          alt="" 
                          className={`w-full h-full object-cover transition-all duration-700 ${likesData?.blurred ? 'blur-2xl scale-125' : 'group-hover:scale-110'}`} 
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                         <p className="text-white font-black text-sm tracking-tight">{likesData?.blurred ? 'Someone' : like.first_name}</p>
                         <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest">{like.university}</p>
                      </div>
                      {likesData?.blurred && (
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

const MatchCard = ({ match, index }) => {
  const unread = match.unread_count || 0;
  const timeAgo = match.last_message_at
    ? formatDistanceToNow(new Date(match.last_message_at), { addSuffix: true })
    : formatDistanceToNow(new Date(match.matched_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/chat/${match.match_id}`}
        className="glass-card-premium flex items-center gap-4 p-4 group transition-all duration-300 hover:translate-x-2 border-white/5 hover:border-brand-500/30"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-brand-500/10 transition-shadow">
            {match.profile_photo_url ? (
              <img src={match.profile_photo_url} alt={match.first_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #2a2420, #171514)' }}>
                👤
              </div>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-950 flex items-center justify-center ${
            match.last_active && (new Date() - new Date(match.last_active)) < 300000 ? 'bg-green-500' : 'bg-dark-600'
          }`}>
             {match.last_active && (new Date() - new Date(match.last_active)) < 300000 && (
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
             )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white font-black text-base tracking-tight truncate group-hover:text-brand-400 transition-colors">
              {match.first_name} {match.last_name}
            </h4>
            <span className="text-dark-500 text-[10px] font-black uppercase tracking-widest">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-dark-400 text-[10px] font-black uppercase tracking-widest truncate">{match.university}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <p className={`text-sm truncate font-medium ${unread > 0 ? 'text-white' : 'text-dark-400'}`}>
              {match.last_message || '✨ Say hi to your new match!'}
            </p>
            {unread > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-brand-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-brand-500/30">
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