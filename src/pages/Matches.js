import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const Matches = () => {
  const [activeTab, setActiveTab] = useState('matches');

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

  const matches = matchesData?.matches || [];
  const likes = likesData?.likes || [];
  const newMatchCount = matches.filter(m => !m.last_message).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Your Connections
          {newMatchCount > 0 && (
            <span className="text-sm font-bold text-white px-2.5 py-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}>
              {newMatchCount} new
            </span>
          )}
        </h1>
        <p className="text-dark-400 text-sm mt-1">People you've connected with on campus</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[
          { id: 'matches', label: 'Matches', count: matches.length },
          { id: 'likes', label: 'Liked You', count: likes.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2`}
            style={activeTab === tab.id
              ? { background: 'linear-gradient(135deg, #f43f5e, #f59e0b)', color: 'white' }
              : { color: '#a49582' }
            }
          >
            {tab.id === 'matches' ? '❤️' : '⭐'} {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-dark-300'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matchesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded shimmer w-1/3" />
                  <div className="h-3 rounded shimmer w-2/3" />
                </div>
              </div>
            ))
          ) : matches.length === 0 ? (
            <EmptyState
              icon="💔"
              title="No matches yet"
              desc="Keep swiping! Your perfect campus connection is out there."
              cta="Start Discovering"
              ctaLink="/discover"
            />
          ) : (
            matches.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))
          )}
        </div>
      )}

      {activeTab === 'likes' && (
        <div>
          {likesLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full animate-spin"
                style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
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
            <div>
              {/* Teaser for free users */}
              <div className="glass-card p-4 mb-4 flex items-center gap-3"
                style={{ border: '1px solid rgba(244,63,94,0.3)' }}>
                <span className="text-2xl">✨</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{likes.length} people liked you!</p>
                  <p className="text-dark-400 text-xs">Upgrade to Premium to see who they are</p>
                </div>
                <Link to="/subscription" className="btn-brand text-xs px-4 py-2">Unlock</Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {likes.map((like, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card overflow-hidden aspect-square relative"
                  >
                    <div className="w-full h-full"
                      style={{ filter: 'blur(12px)', background: 'linear-gradient(135deg, #f43f5e40, #f59e0b40)' }}>
                      {like.profile_photo_url && (
                        <img src={like.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl">❓</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, index }) => {
  const other = match.other_user;
  const unread = match.unread_count || 0;
  const timeAgo = match.last_message_time
    ? formatDistanceToNow(new Date(match.last_message_time), { addSuffix: true })
    : 'Just matched';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/chat/${match.id}`}
        className="glass-card flex items-center gap-4 p-4 group hover:border-brand-500/30 transition-all duration-200 block"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden"
            style={{ border: '2px solid rgba(244,63,94,0.3)' }}>
            {other?.profile_photo_url ? (
              <img src={other.profile_photo_url} alt={other.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #2a2420, #1a1614)' }}>
                {other?.gender === 'female' ? '👩🏾' : '👨🏿'}
              </div>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500"
            style={{ border: '2px solid #0f0d0c' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold truncate">{other?.first_name} {other?.last_name}</span>
              {other?.verification_status === 'verified' && (
                <span className="text-blue-400 text-xs">✓</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-dark-500 text-xs">{timeAgo}</span>
              {unread > 0 && (
                <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}>
                  {unread}
                </span>
              )}
            </div>
          </div>
          <p className="text-dark-400 text-xs truncate">{other?.university}</p>
          {match.last_message && (
            <p className={`text-sm truncate mt-1 ${unread ? 'text-white font-medium' : 'text-dark-500'}`}>
              {match.last_message}
            </p>
          )}
          {!match.last_message && (
            <p className="text-brand-400 text-xs mt-1 font-medium">✨ New match — say hello!</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const EmptyState = ({ icon, title, desc, cta, ctaLink }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20"
  >
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-dark-400 mb-8 max-w-xs mx-auto">{desc}</p>
    <Link to={ctaLink} className="btn-brand px-8 py-3">
      {cta}
    </Link>
  </motion.div>
);

export default Matches;