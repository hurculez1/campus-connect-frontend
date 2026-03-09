import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';
import { DEMO_MESSAGES, DEMO_MATCHES, isDemoMode } from '../utils/demoData';
import toast from 'react-hot-toast';

const ICEBREAKERS = [
  '☕ Coffee or tea while studying?',
  "🌅 Are you a morning person or night owl?",
  '🍛 What is your favourite Ugandan dish?',
  "🎵 What's your study playlist like?",
  '🎓 Best thing about your university?',
  '🌍 Dream travel destination?',
  '📚 Favourite book you have ever read?',
  '😄 Rolex or Kikomando on a budget date?',
];

const EMOJIS = ['❤️', '😊', '🔥', '😂', '🎉', '💯', '😍', '🙏', '✨', '🎓', '🇺🇬', '😎', '🥰', '🤗', '🎵', '🏆', '👍', '👎', '💕', '💔', '🥳', '🤔', '😢', '😮', '💪', '🎯', '🌟', '💫', '🎊', '🎁', '🌈', '☀️', '🌙', '⚡', '🎭', '🎨', '📸', '🎬', '🎮', '🍕', '🍔', '🍟', '☕', '🍺', '🍷', '🎸', '🎤', '🎧', '📚', '💼', '🏫', '🏠', '🚗', '✈️'];

const formatMsgTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
  return format(d, 'MMM d, h:mm a');
};

const groupMessagesByDate = (msgs) => {
  if (!msgs?.length) return [];
  const groups = [];
  let lastDate = null;
  msgs.forEach(msg => {
    if (!msg?.created_at) return;
    const d = new Date(msg.created_at);
    const dateStr = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
    if (dateStr !== lastDate) {
      groups.push({ type: 'date', label: dateStr });
      lastDate = dateStr;
    }
    groups.push({ type: 'msg', data: msg });
  });
  return groups;
};

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const typingTimeoutRef = useRef(null);
  const sendImageMutation = useMutation(
    (formData) => api.post(`/chat/${matchId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => queryClient.invalidateQueries(['messages', matchId]),
    }
  );

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      sendImageMutation.mutate(formData);
    }
    e.target.value = '';
  };

  const { data: messages, isLoading } = useQuery(
    ['messages', matchId],
    () => isDemoMode()
      ? Promise.resolve(DEMO_MESSAGES)
      : api.get(`/chat/${matchId}/messages`).then(res => res.data.messages),
    { staleTime: 10000, retry: false }
  );

  useEffect(() => {
    if (isDemoMode()) {
      const demoMatch = DEMO_MATCHES.find(m => m.id === matchId) || DEMO_MATCHES[0];
      if (demoMatch) setMatchInfo(demoMatch);
      return;
    }

    const fetchMatch = async () => {
      try {
        const res = await api.get('/matches');
        const m = res.data.matches?.find(m => String(m.id) === String(matchId));
        if (m) {
          setMatchInfo(m);
        } else {
          // Fallback: Fetch single match info directly
          const singleRes = await api.get(`/matches/${matchId}`);
          if (singleRes.data.match) {
            setMatchInfo(singleRes.data.match);
          }
        }
      } catch (err) {
        console.error('Failed to load match info:', err);
      }
    };

    fetchMatch();
  }, [matchId]);

  const sendMessageMutation = useMutation(
    (content) => api.post(`/chat/${matchId}/messages`, { content }),
    {
      onMutate: (content) => {
        // Optimistically add message to UI
        const newMessage = {
          id: 'temp-' + Date.now(),
          content,
          sender_id: user?.id,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        queryClient.setQueryData(['messages', matchId], (old) => {
          if (!old) return [newMessage];
          return [...old, newMessage];
        });
        return { newMessage };
      },
      onSuccess: (data, variables, context) => {
        // Update with real message from server
        queryClient.setQueryData(['messages', matchId], (old) => {
          if (!old) return [data.message];
          return old.map(m => m.id === context.newMessage?.id ? data.message : m);
        });
        setMessage('');
        setShowEmojis(false);
        setShowIcebreakers(false);
      },
      onError: (error, variables, context) => {
        // Remove optimistic message on error
        queryClient.setQueryData(['messages', matchId], (old) => {
          if (!old) return [];
          return old.filter(m => !m.id?.startsWith('temp-'));
        });
        toast.error('Failed to send message');
      }
    }
  );

  useEffect(() => {
    if (isDemoMode()) return;
    
    const token = localStorage.getItem('token');
    // Get the current API base URL and convert to socket URL
    let socketUrl = window.location.origin;
    if (api.defaults.baseURL) {
      // Remove /api from the end to get the base URL
      socketUrl = api.defaults.baseURL.replace('/api', '');
    }
    
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join_match', matchId);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    newSocket.on('new_message', (data) => {
      console.log('Real-time message received:', data);
      // Directly add the new message to the cache instead of refetching
      queryClient.setQueryData(['messages', matchId], (old) => {
        if (!old) return [data.message];
        // Avoid duplicates
        if (old.some(m => m.id === data.message.id)) return old;
        return [...old, data.message];
      });
    });
    
    newSocket.on('typing', ({ userId, typing }) => {
      if (userId !== user?.id) setOtherTyping(typing);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.emit('leave_match', matchId);
      newSocket.disconnect();
    };
  }, [matchId, queryClient, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
    socket?.emit('typing', { matchId, typing: false });
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { matchId, typing: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { matchId, typing: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendIcebreaker = (prompt) => {
    setMessage(prompt);
    setShowIcebreakers(false);
    inputRef.current?.focus();
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const grouped = groupMessagesByDate(messages);
  const otherUser = matchInfo; // Backend returns flat fields now

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[520px]">
        <div className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* ─ Header ─ WhatsApp style */}
      <div className="flex items-center gap-2 px-2 py-2 flex-shrink-0"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={() => navigate('/matches')}
          className="text-gray-300 hover:text-white transition-colors p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
            style={{ border: '2px solid rgba(244,63,94,0.4)' }}
            onClick={() => setFullscreenImage(otherUser?.profile_photo_url)}>
            {otherUser?.profile_photo_url ? (
              <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #f43f5e20, #f59e0b20)' }}>
                {otherUser?.gender === 'female' ? '👩🏾' : '👨🏿'}
              </div>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-950 bg-green-500" />
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserInfo(true)}>
          <h2 className="font-bold text-white text-base">
            {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Chat'}
          </h2>
          <p className="text-xs text-green-400">
            {otherTyping ? 'typing...' : (otherUser?.university || 'Online')}
            {otherUser?.verification_status === 'verified' && ' · ✓'}
          </p>
        </div>
      </div>

      {/* ─ Messages ─ WhatsApp style */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)' }}>

        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-white font-bold text-lg mb-2">You matched! Say hello</h3>
            <p className="text-gray-400 text-sm mb-6">Break the ice with a message or try one of our prompts</p>
            <button onClick={() => setShowIcebreakers(true)}
              className="px-6 py-3 text-sm rounded-full font-medium"
              style={{ background: '#00a884', color: 'white' }}>
              🧊 Send an Icebreaker
            </button>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: '#2a2a2a' }} />
                <span className="text-gray-500 text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#1a1a1a' }}>{item.label}</span>
                <div className="flex-1 h-px" style={{ background: '#2a2a2a' }} />
              </div>
            );
          }

          const msg = item.data;
          const isMe = msg.sender_id === user?.id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
            >
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium max-w-full ${
                    isMe 
                      ? 'text-white rounded-br-md' 
                      : 'text-white rounded-bl-md'
                  }`}
                  style={isMe 
                    ? { background: '#056162', borderTopRightRadius: '4px' }
                    : { background: '#2a2a2a', borderTopLeftRadius: '4px' }
                  }
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span>{formatMsgTime(msg.created_at)}</span>
                  {isMe && (
                    <span className={msg.is_read ? 'text-green-400' : 'text-gray-500'}>
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {otherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex justify-start mb-2"
            >
              <div className="msg-bubble-them py-3">
                <div className="flex items-center gap-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ─ Icebreakers ─ WhatsApp style */}
      <AnimatePresence>
        {showIcebreakers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-3 py-2 overflow-hidden"
            style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {ICEBREAKERS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendIcebreaker(prompt)}
                  className="flex-shrink-0 text-xs text-gray-300 px-3 py-2 rounded-xl hover:text-white transition-all"
                  style={{ background: '#2a2a2a', border: '1px solid #3a3a3a' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─ Emoji picker ─ WhatsApp style */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 py-3"
            style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}
          >
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─ Input Area ─ WhatsApp style */}
      <div className="flex-shrink-0 px-3 py-2"
        style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Toolbar buttons */}
          <div className="flex gap-1 mb-0.5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
              style={{ background: 'transparent' }}
              title="Send Photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setShowIcebreakers(s => !s); setShowEmojis(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                showIcebreakers ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              style={showIcebreakers ? { background: '#056162' } : { background: 'transparent' }}
              title="Icebreakers"
            >
              🧊
            </button>
            <button
              type="button"
              onClick={() => { setShowEmojis(s => !s); setShowIcebreakers(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                showEmojis ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              style={showEmojis ? { background: '#056162' } : { background: 'transparent' }}
              title="Emojis"
            >
              😊
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 rounded-2xl resize-none font-medium text-white placeholder:text-gray-500 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                maxHeight: 120,
              }}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                       transition-all duration-200 hover:scale-105 active:scale-95
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: message.trim() ? '#00a884' : '#2a2a2a' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
      
      {/* User Info Modal */}
      {showUserInfo && otherUser && (
        <div className="fixed inset-0 z-[60] bg-dark-950 flex items-center justify-center" onClick={() => setShowUserInfo(false)}>
          <div className="w-full h-full max-w-2xl bg-dark-900 overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Profile Header */}
            <div className="relative h-[50vh]">
              <img 
                src={otherUser.profile_photo_url} 
                alt="" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setFullscreenImage(otherUser.profile_photo_url)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
              <button onClick={() => setShowUserInfo(false)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white text-xl">
                ←
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-3xl font-black text-white">{otherUser.first_name} {otherUser.last_name}</h2>
                <p className="text-brand-400 text-sm font-bold mt-1">{otherUser.university}</p>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="p-6 space-y-6">
              {otherUser.verification_status === 'verified' && (
                <div className="badge-verified">✓ Verified Student</div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-widest mb-1">Course</p>
                  <p className="text-white font-bold">{otherUser.course || 'Not specified'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-widest mb-1">Year</p>
                  <p className="text-white font-bold">{otherUser.year_of_study || 'N/A'}</p>
                </div>
              </div>

              {otherUser.bio && (
                <div>
                  <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-widest mb-3">About</h3>
                  <p className="text-dark-200 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                    {otherUser.bio}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-widest mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(otherUser.interests) ? otherUser.interests : []).map(tag => (
                    <span key={tag} className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => { setShowUserInfo(false); }} className="w-full py-4 bg-brand-500 rounded-2xl font-black text-white flex items-center justify-center gap-2">
                💬 Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageModal 
        src={fullscreenImage} 
        isOpen={!!fullscreenImage} 
        onClose={() => setFullscreenImage(null)} 
      />
    </div>
  );
};

export default Chat;