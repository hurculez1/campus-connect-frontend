import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';

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

const EMOJIS = ['❤️', '😊', '🔥', '😂', '🎉', '💯', '😍', '🙏', '✨', '🎓', '🇺🇬', '😎', '🥰', '🤗', '🎵', '🏆'];

const formatMsgTime = (ts) => {
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

const ConnectionChat = () => {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const typingTimeoutRef = useRef(null);

  const { data: chatData, isLoading } = useQuery(
    ['connectionMessages', connectionId],
    () => api.get(`/chat/connection/${connectionId}/messages`).then(res => res.data),
    { staleTime: 10000, retry: false }
  );

  useEffect(() => {
    if (chatData?.connection) {
      setConnectionInfo(chatData.connection);
    }
  }, [chatData]);

  const sendMessageMutation = useMutation(
    (content) => api.post(`/chat/connection/${connectionId}/messages`, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['connectionMessages', connectionId]);
        setMessage('');
        setShowEmojis(false);
        setShowIcebreakers(false);
      },
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 5,
    });
    newSocket.on('connect', () => {
      newSocket.emit('join_connection', connectionId);
    });
    newSocket.on('new_connection_message', () => {
      queryClient.invalidateQueries(['connectionMessages', connectionId]);
    });
    newSocket.on('typing', ({ userId, typing }) => {
      if (userId !== user?.id) setOtherTyping(typing);
    });
    setSocket(newSocket);
    return () => {
      newSocket.emit('leave_connection', connectionId);
      newSocket.close();
    };
  }, [connectionId, queryClient, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages, otherTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
    socket?.emit('typing', { connectionId, typing: false });
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { connectionId, typing: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing', { connectionId, typing: false });
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

  const grouped = groupMessagesByDate(chatData?.messages || []);
  const otherUser = connectionInfo?.otherUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[520px]">
        <div className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-950">

      {/* ─ Header ─ */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(15,13,12,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/discover')}
          className="text-dark-400 hover:text-white transition-colors p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
            style={{ border: '2px solid rgba(99,102,241,0.4)' }}
            onClick={() => setFullscreenImage(otherUser?.profile_photo_url)}>
            {otherUser?.profile_photo_url ? (
              <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #6366f120, #a855f720)' }}>
                {otherUser?.gender === 'female' ? '👩🏾' : '👨🏿'}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-950 bg-green-500" />
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserInfo(true)}>
          <h2 className="font-bold text-white truncate">
            {otherUser ? `${otherUser.first_name} ${otherUser.last_name || ''}` : 'Chat'}
          </h2>
          <p className="text-xs text-dark-400 truncate">
            {otherUser?.university || 'Online'}
            {otherUser?.verification_status === 'verified' && ' · ✓ Verified'}
          </p>
        </div>
      </div>

      {/* ─ Messages ─ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: 'rgba(15,13,12,0.6)' }}>

        {(!chatData?.messages || chatData.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-white font-bold text-lg mb-2">Start a conversation!</h3>
            <p className="text-dark-400 text-sm mb-6">Break the ice with a message or try one of our prompts</p>
            <button onClick={() => setShowIcebreakers(true)}
              className="btn-brand px-6 py-3 text-sm">
              🧊 Send an Icebreaker
            </button>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-dark-600 text-xs font-medium">{item.label}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
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
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${
                    isMe 
                      ? 'bg-brand-500 text-white rounded-br-md' 
                      : 'bg-white/10 text-white rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-dark-500' : 'text-dark-500'}`}>
                  <span>{formatMsgTime(msg.created_at)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

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

      {/* ─ Icebreakers ─ */}
      <AnimatePresence>
        {showIcebreakers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 py-3 overflow-hidden"
            style={{ background: 'rgba(15,13,12,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {ICEBREAKERS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendIcebreaker(prompt)}
                  className="flex-shrink-0 text-xs text-dark-200 px-3 py-2 rounded-xl hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─ Emoji picker ─ */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 py-3"
            style={{ background: 'rgba(15,13,12,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
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

      {/* ─ Input Area ─ */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(15,13,12,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex gap-1 mb-0.5">
            <button
              type="button"
              onClick={() => { setShowIcebreakers(s => !s); setShowEmojis(false); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all
                ${showIcebreakers ? 'text-brand-400' : 'text-dark-400 hover:text-white'}`}
              style={showIcebreakers ? { background: 'rgba(244,63,94,0.15)' } : { background: 'rgba(255,255,255,0.06)' }}
              title="Icebreakers"
            >
              🧊
            </button>
            <button
              type="button"
              onClick={() => { setShowEmojis(s => !s); setShowIcebreakers(false); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all
                ${showEmojis ? 'text-brand-400' : 'text-dark-400 hover:text-white'}`}
              style={showEmojis ? { background: 'rgba(244,63,94,0.15)' } : { background: 'rgba(255,255,255,0.06)' }}
              title="Emojis"
            >
              😊
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 rounded-2xl resize-none font-medium text-dark-50 placeholder:text-dark-500 text-sm
                         focus:outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: 120,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                       transition-all duration-200 hover:scale-110 active:scale-90
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)', boxShadow: '0 4px 20px rgba(244,63,94,0.4)' }}
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
                <p className="text-indigo-400 text-sm font-bold mt-1">{otherUser.university}</p>
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

              <button onClick={() => { setShowUserInfo(false); }} className="w-full py-4 bg-indigo-500 rounded-2xl font-black text-white flex items-center justify-center gap-2">
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

export default ConnectionChat;
