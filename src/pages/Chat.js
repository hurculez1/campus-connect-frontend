import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import { DEMO_MESSAGES, DEMO_MATCHES, isDemoMode } from '../utils/demoData';

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

const Chat = () => {
  const { matchId } = useParams();
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
  const [matchInfo, setMatchInfo] = useState(null);
  const typingTimeoutRef = useRef(null);

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
    api.get('/matches').then(res => {
      const m = res.data.matches?.find(m => String(m.id) === String(matchId));
      if (m) setMatchInfo(m);
    }).catch(() => { });
  }, [matchId]);

  const sendMessageMutation = useMutation(
    (content) => api.post(`/chat/${matchId}/messages`, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', matchId]);
        setMessage('');
        setShowEmojis(false);
        setShowIcebreakers(false);
      },
    }
  );

  useEffect(() => {
    if (isDemoMode()) return; // no socket in demo mode
    const token = localStorage.getItem('token');
    const newSocket = io('https://api.quickercarts.com', {
      auth: { token },
      reconnectionAttempts: 5,
    });
    newSocket.on('connect', () => newSocket.emit('join_match', matchId));
    newSocket.on('new_message', () => queryClient.invalidateQueries(['messages', matchId]));
    newSocket.on('typing', ({ userId, typing }) => {
      if (userId !== user?.id) setOtherTyping(typing);
    });
    setSocket(newSocket);
    return () => {
      newSocket.emit('leave_match', matchId);
      newSocket.close();
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
  const otherUser = matchInfo?.other_user;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[520px]">
        <div className="w-10 h-10 rounded-full animate-spin"
          style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>

      {/* ─ Header ─ */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(15,13,12,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/matches')}
          className="text-dark-400 hover:text-white transition-colors p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden"
            style={{ border: '2px solid rgba(244,63,94,0.4)' }}>
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

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">
            {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Chat'}
          </h2>
          <p className="text-xs text-dark-400 truncate">
            {otherUser?.university || 'Online'}
            {otherUser?.verification_status === 'verified' && ' · ✓ Verified'}
          </p>
        </div>

        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:text-white hover:bg-white/10 transition-all text-base">
            📞
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-dark-400 hover:text-white hover:bg-white/10 transition-all text-base">
            ⚙️
          </button>
        </div>
      </div>

      {/* ─ Messages ─ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: 'rgba(15,13,12,0.6)' }}>

        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-white font-bold text-lg mb-2">You matched! Say hello</h3>
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
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div className={isMe ? 'msg-bubble-me' : 'msg-bubble-them'}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-dark-600' : 'text-dark-600'}`}>
                  <span>{formatMsgTime(msg.created_at)}</span>
                  {isMe && (
                    <span className={msg.is_read ? 'text-brand-400' : 'text-dark-600'}>
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
          {/* Toolbar buttons */}
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

          {/* Text input */}
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

          {/* Send button */}
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
    </div>
  );
};

export default Chat;