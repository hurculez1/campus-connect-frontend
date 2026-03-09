import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';
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
    if (!msg?.created_at && !msg?.createdAt) return;
    const d = new Date(msg.created_at || msg.createdAt);
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
  const fileInputRef = useRef(null);
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
      onMutate: (content) => {
        const newMessage = {
          id: 'temp-' + Date.now(),
          content,
          sender_id: user?.id,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
          if (!old || !old.messages) return { messages: [newMessage] };
          return { ...old, messages: [...old.messages, newMessage] };
        });
        return { newMessage };
      },
      onSuccess: (data, variables, context) => {
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
          if (!old || !old.messages) return old;
          const realId = data.data?.messageId || data.data?.message?.id;
          const exists = old.messages.some((m) => String(m.id) === String(realId));
          if (exists) {
            // Socket already added the real message, remove temp
            return { ...old, messages: old.messages.filter(m => m.id !== context?.newMessage?.id) };
          } else {
            // Socket hasn't arrived
            return {
              ...old,
              messages: old.messages.map(m => m.id === context?.newMessage?.id ? { ...m, id: realId, created_at: new Date().toISOString() } : m)
            };
          }
        });
        setMessage('');
        setShowEmojis(false);
        setShowIcebreakers(false);
      },
      onError: (err, variables, context) => {
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
          if (!old || !old.messages) return old;
          return { ...old, messages: old.messages.filter(m => m.id !== context?.newMessage?.id) };
        });
        toast.error('Failed to send message');
      }
    }
  );

  const sendImageMutation = useMutation(
    (formData) => api.post(`/chat/connection/${connectionId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onMutate: (formData) => {
        const file = formData.get('image');
        if (file) {
          const tempUrl = URL.createObjectURL(file);
          const tempMsg = {
            id: 'img-temp-' + Date.now(),
            content: '',
            message_type: 'image',
            image_url: tempUrl,
            sender_id: user?.id,
            created_at: new Date().toISOString(),
            is_read: false,
          };
          queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
            if (!old || !old.messages) return { messages: [tempMsg] };
            return { ...old, messages: [...old.messages, tempMsg] };
          });
          return { tempId: tempMsg.id, tempUrl };
        }
      },
      onSuccess: (data, vars, context) => {
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
          if (!old || !old.messages) return old;
          return { ...old, messages: old.messages.map(m =>
            m.id === context?.tempId
              ? { ...m, ...data.data?.message, image_url: data.data?.message?.image_url || context.tempUrl }
              : m
          )};
        });
      },
      onError: (err, vars, context) => {
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
          if (!old || !old.messages) return old;
          return { ...old, messages: old.messages.filter(m => m.id !== context?.tempId) };
        });
        toast.error('Image upload failed');
      }
    }
  );

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image too large (max 10MB)'); return; }
    const formData = new FormData();
    formData.append('image', file);
    sendImageMutation.mutate(formData);
    e.target.value = '';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    
    newSocket.on('connect', () => {
      newSocket.emit('join_connection', connectionId);
    });
    
    newSocket.on('new_connection_message', (data) => {
        if (String(data.connectionId) === String(connectionId)) {
            queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
                const msg = data.message;
                if (!old) return { messages: [msg] };
                if (!old.messages) return { ...old, messages: [msg] };
                if (old.messages.some(m => String(m.id) === String(msg.id))) return old;
                
                const deduplicated = old.messages.filter(m => !(m.id.toString().startsWith('temp-') && m.content === msg.content));
                return { ...old, messages: [...deduplicated, msg] };
            });
            // Mark as read immediately
            if (data.message.sender_id !== user?.id) {
                newSocket.emit('message_read_connection', { connectionId, messageId: data.message.id });
                api.post(`/chat/connection/${connectionId}/read`).catch(() => {});
            }
        }
    });

    newSocket.on('message_read_connection', ({ messageId }) => {
        queryClient.setQueryData(['connectionMessages', connectionId], (old) => {
            if (!old || !old.messages) return old;
            return {
                ...old,
                messages: old.messages.map(m => String(m.id) === String(messageId) ? { ...m, is_read: 1 } : m)
            };
        });
    });

    newSocket.on('typing', ({ userId, isTyping }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
    });

    setSocket(newSocket);
    return () => {
      newSocket.emit('leave_connection', connectionId);
      newSocket.disconnect();
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
    socket?.emit('typing', { connectionId, isTyping: false });
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { connectionId, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing', { connectionId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (e) => {
    setMessage(prev => prev + e);
    inputRef.current?.focus();
  };

  const grouped = groupMessagesByDate(chatData?.messages || []);
  const otherUser = connectionInfo?.otherUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141a]">
        <div className="w-10 h-10 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0b141a' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 flex-shrink-0"
        style={{ background: '#202c33', borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={() => navigate('/matches')} className="text-gray-300 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2} /></svg>
        </button>

        <div className="relative flex-shrink-0 shadow-xl">
          <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer bg-dark-800"
            onClick={() => setShowUserInfo(true)}>
            {otherUser?.profile_photo_url ? (
               <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserInfo(true)}>
          <h2 className="font-bold text-white text-base truncate leading-tight">{otherUser?.first_name || 'Chatting...'}</h2>
          <p className={`text-[11px] font-medium tracking-tight ${otherTyping ? 'text-green-400' : 'text-gray-400'}`}>
            {otherTyping ? 'typing...' : (otherUser?.university || 'Connecting...')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative"
        style={{ 
          background: '#0b141a',
          backgroundImage: 'radial-gradient(#202c33 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px'
        }}>

        {grouped.map((item, i) => {
          if (item.type === 'date') return (
            <div key={i} className="flex items-center gap-3 py-4">
               <div className="flex-1 h-px bg-white/5" /><span className="text-[10px] text-gray-500 bg-[#202c33] px-3 py-1 rounded-lg uppercase font-black tracking-widest">{item.label}</span><div className="flex-1 h-px bg-white/5" />
            </div>
          );

          const msg = item.data;
          const isMe = msg.sender_id === user?.id;

          return (
            <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div 
                  className={`px-3 py-1.5 rounded-xl text-[14px] relative ${isMe ? 'text-white' : 'text-gray-100'} shadow-md`}
                  style={{ background: isMe ? '#2a3942' : '#202c33', borderTopRightRadius: isMe ? 0 : 12, borderTopLeftRadius: isMe ? 12 : 0 }}
                >
                   {msg.message_type === 'image' || msg.image_url ? (
                    <img src={msg.image_url || msg.imageUrl} alt="" className="max-w-full rounded-lg cursor-zoom-in" onClick={() => setFullscreenImage(msg.image_url || msg.imageUrl)} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words leading-relaxed font-medium">{msg.content}</span>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-gray-400 font-bold">{formatMsgTime(msg.created_at || msg.createdAt)}</span>
                    {isMe && <span className={`text-[10px] ${msg.is_read ? 'text-blue-400' : 'text-gray-500'}`}>{msg.is_read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="px-2 py-3 pb-6 flex items-end gap-2 bg-[#111b21] border-t border-white/5">
        <div className="flex-1 flex items-end gap-2 bg-[#2a3942] rounded-[24px] px-3 py-1.5 min-h-[48px] shadow-inner">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 text-xl hover:scale-110 transition-transform">😊</button>
          <textarea ref={inputRef} value={message} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Send a message..." rows={1} className="flex-1 bg-transparent border-none text-white focus:ring-0 py-2 resize-none max-h-32 text-sm font-medium" />
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          {/* Bold prominent image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendImageMutation.isLoading}
            className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 transition-all text-indigo-400 font-black text-xl border border-indigo-600/30"
            title="Share Image"
          >📷</button>
          <button type="button" onClick={() => setShowIcebreakers(!showIcebreakers)} className="p-1 text-xl hover:scale-110 transition-transform">🧊</button>
        </div>
        <button onClick={handleSend} disabled={!message.trim()} className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-lg active:scale-90 transition-transform disabled:opacity-50">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </div>

       {/* Detailed Profile View */}
       <AnimatePresence>
        {showUserInfo && otherUser && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-dark-950 flex flex-col overflow-y-auto"
          >
             <div className="relative h-[55vh] flex-shrink-0 group overflow-hidden">
                <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
                <button onClick={() => setShowUserInfo(false)} className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xl shadow-2xl hover:bg-black/70 transition-all">✕</button>
                <div className="absolute bottom-8 left-8 right-8">
                   <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl">{otherUser.first_name}</h2>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-green-500 font-black uppercase tracking-widest text-xs">{otherUser.university}</p>
                   </div>
                </div>
             </div>
             <div className="p-8 space-y-8">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3 opacity-60">Status Message</p>
                   <p className="text-white text-base leading-relaxed font-medium italic">"{otherUser.bio || 'Living the student life!'}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
                      <p className="text-[9px] text-gray-500 font-black uppercase mb-2 tracking-tighter">Academic Field</p>
                      <p className="text-white font-black text-sm">{otherUser.course || 'Curious Student'}</p>
                   </div>
                   <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
                      <p className="text-[9px] text-gray-500 font-black uppercase mb-2 tracking-tighter">Campus Base</p>
                      <p className="text-white font-black text-sm">{otherUser.university?.split(' ')[0] || 'Uganda'}</p>
                   </div>
                </div>
                <button onClick={() => setShowUserInfo(false)} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[2rem] font-black text-white shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest">Return to Conversation</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showEmojis && (
           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 py-4 overflow-y-auto max-h-40 bg-[#111b21] border-t border-white/5">
              <div className="flex flex-wrap gap-4 justify-center">
                 {EMOJIS.map((e, i) => (
                   <button key={i} onClick={() => { setMessage(p => p + e); setShowEmojis(false); }} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                 ))}
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <ImageModal src={fullscreenImage} isOpen={!!fullscreenImage} onClose={() => setFullscreenImage(null)} />
    </div>
  );
};

export default ConnectionChat;
