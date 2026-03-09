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

  const { data: messages, isLoading } = useQuery(
    ['messages', matchId],
    () => api.get(`/chat/${matchId}/messages`).then(res => res.data.messages),
    { staleTime: 10000, retry: false }
  );

  const sendMessageMutation = useMutation(
    (content) => api.post(`/chat/${matchId}/messages`, { content }),
    {
      onMutate: (content) => {
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
        queryClient.setQueryData(['messages', matchId], (old) => {
          if (!old) return old;
          const realId = data.data?.messageId || data.data?.message?.id;
          const exists = old.some((m) => String(m.id) === String(realId));
          if (exists) {
            // Socket already added the real message, just remove the temp one
            return old.filter(m => m.id !== context.newMessage?.id);
          } else {
            // Socket hasn't arrived yet, replace temp with real ID
            return old.map(m => m.id === context.newMessage?.id 
               ? { ...m, id: realId, created_at: new Date().toISOString() } 
               : m);
          }
        });
        setMessage('');
        setShowEmojis(false);
        setShowIcebreakers(false);
      },
      onError: (err, variables, context) => {
        // Rollback optimistic update
        queryClient.setQueryData(['messages', matchId], (old) => 
           old ? old.filter(m => m.id !== context?.newMessage?.id) : old
        );
        toast.error('Failed to send message');
      }
    }
  );

  const sendImageMutation = useMutation(
    (formData) => api.post(`/chat/${matchId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onMutate: (formData) => {
        // Optimistic: show image preview immediately
        const file = formData.get('image');
        if (file) {
          const tempUrl = URL.createObjectURL(file);
          // The following block of code was incorrectly placed here.
          // It seems to be related to updating user data in the auth store,
          // which should happen during authentication, not image upload.
          // Removing it to maintain correct functionality.
          // const token = {
          //   token: res.data.token,
          //   user: {
          //     id: res.data.user.id,
          //     email: res.data.user.email,
          //     firstName: res.data.user.firstName,
          //     lastName: res.data.user.lastName,
          //     profile_photo_url: res.data.user.profile_photo_url || res.data.user.profilePhotoUrl,
          //     isAdmin: res.data.user.isAdmin,
          //     isSuperAdmin: res.data.user.isSuperAdmin,
          //     subscriptionTier: res.data.user.subscriptionTier
          //   }
          // };
          const tempMsg = {
            id: 'img-temp-' + Date.now(),
            content: '',
            message_type: 'image',
            media_url: tempUrl,
            sender_id: user?.id,
            created_at: new Date().toISOString(),
            is_read: false,
          };
          queryClient.setQueryData(['messages', matchId], (old) => {
            if (!old) return [tempMsg];
            return [...old, tempMsg];
          });
          return { tempId: tempMsg.id, tempUrl };
        }
      },
      onSuccess: (data, vars, context) => {
        queryClient.setQueryData(['messages', matchId], (old) => {
          if (!old) return old;
          return old.map(m => m.id === context?.tempId
            ? { ...m, ...data.data?.message, media_url: data.data?.message?.media_url || context.tempUrl }
            : m
          );
        });
      },
      onError: (err, vars, context) => {
        // Remove temp on error
        queryClient.setQueryData(['messages', matchId], (old) =>
          old ? old.filter(m => m.id !== context?.tempId) : old
        );
        toast.error('Image upload failed');
      }
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : window.location.origin;
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    
    newSocket.on('connect', () => {
      newSocket.emit('join_match', matchId);
    });
    
    newSocket.on('new_message', (data) => {
        if (String(data.matchId) === String(matchId)) {
            queryClient.setQueryData(['messages', matchId], (old) => {
                const msg = data.message;
                if (!old) return [msg];
                if (old.some(m => String(m.id) === String(msg.id))) return old;
                return [...old.filter(m => !(m.id.toString().startsWith('temp-') && m.content === msg.content)), msg];
            });
            // Mark as read immediately if it's from someone else
            if (data.message.sender_id !== user?.id) {
                newSocket.emit('message_read', { matchId, messageId: data.message.id });
                // Also mark older messages
                api.post(`/chat/${matchId}/read`).catch(() => {});
            }
        }
    });

    newSocket.on('message_read', ({ messageId }) => {
        queryClient.setQueryData(['messages', matchId], (old) => {
            if (!old) return old;
            return old.map(m => String(m.id) === String(messageId) ? { ...m, is_read: 1 } : m);
        });
    });

    newSocket.on('new_match', () => {
        queryClient.invalidateQueries('matches');
        toast.success("It's a Match! 🎉", { icon: '❤️' });
    });
    
    newSocket.on('typing', ({ userId, isTyping }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
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

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await api.get('/matches');
        const m = res.data.matches?.find(m => String(m.match_id || m.id) === String(matchId));
        if (m) setMatchInfo(m);
      } catch (err) { console.error(err); }
    };
    fetchMatch();
  }, [matchId]);

  const handleSend = (e) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
    socket?.emit('typing', { matchId, isTyping: false });
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { matchId, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { matchId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image too large (max 10MB)'); return; }
    const formData = new FormData();
    formData.append('image', file);
    sendImageMutation.mutate(formData);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const addEmoji = (e) => {
    setMessage(prev => prev + e);
    inputRef.current?.focus();
  };

  const grouped = groupMessagesByDate(messages);
  const otherUser = matchInfo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141a]">
        <div className="w-10 h-10 border-4 border-t-transparent border-green-500 rounded-full animate-spin" />
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

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer bg-dark-800"
            onClick={() => setFullscreenImage(otherUser?.profile_photo_url)}>
            {otherUser?.profile_photo_url ? (
               <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserInfo(true)}>
          <h2 className="font-bold text-white text-base truncate">{otherUser?.first_name || 'Chat'}</h2>
          <p className={`text-[11px] ${otherTyping ? 'text-green-400' : 'text-gray-400'}`}>
            {otherTyping ? 'typing...' : (otherUser?.university || 'Online')}
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
               <div className="flex-1 h-px bg-white/5" /><span className="text-[10px] text-gray-500 bg-[#202c33] px-3 py-1 rounded-lg uppercase">{item.label}</span><div className="flex-1 h-px bg-white/5" />
            </div>
          );

          const msg = item.data;
          const isMe = msg.sender_id === user?.id;

          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div 
                  className={`px-3 py-1.5 rounded-xl text-[14px] relative ${isMe ? 'text-white' : 'text-gray-100'}`}
                  style={{ background: isMe ? '#005c4b' : '#202c33', borderTopRightRadius: isMe ? 0 : 12, borderTopLeftRadius: isMe ? 12 : 0 }}
                >
                  {msg.message_type === 'image' || msg.media_url ? (
                    <img src={msg.media_url || msg.imageUrl} alt="" className="max-w-full rounded-lg cursor-zoom-in" onClick={() => setFullscreenImage(msg.media_url || msg.imageUrl)} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-gray-400">{formatMsgTime(msg.created_at || msg.createdAt)}</span>
                    {isMe && (
                      <span className={`text-[10px] ${msg.is_read ? 'text-blue-400' : 'text-gray-500'}`}>
                        {msg.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Quick Toolbars */}
      <AnimatePresence>
        {showIcebreakers && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-3 py-3 overflow-hidden bg-[#111b21] border-t border-white/5">
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {ICEBREAKERS.map((p, i) => (
                  <button key={i} onClick={() => { setMessage(p); setShowIcebreakers(false); }} className="flex-shrink-0 text-[10px] font-bold text-gray-300 bg-[#202c33] px-4 py-2 rounded-xl border border-white/5">{p}</button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showEmojis && (
           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 py-4 overflow-y-auto max-h-40 bg-[#111b21] border-t border-white/5">
              <div className="flex flex-wrap gap-4 justify-center">
                 {EMOJIS.map((e, i) => (
                   <button key={i} onClick={() => { setMessage(p => p + e); setShowEmojis(false); }} className="text-2xl hover:scale-125">{e}</button>
                 ))}
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-2 py-3 pb-6 flex items-end gap-2 bg-[#111b21]">
        <div className="flex-1 flex items-end gap-2 bg-[#2a3942] rounded-[24px] px-3 py-1.5 min-h-[48px]">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 text-xl">😊</button>
          <textarea ref={inputRef} value={message} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Message" rows={1} className="flex-1 bg-transparent border-none text-white focus:ring-0 py-2 resize-none max-h-32" />
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          {/* Bold prominent image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendImageMutation.isLoading}
            className="p-1.5 rounded-xl bg-green-600/20 hover:bg-green-600/40 transition-all text-green-400 font-black text-xl border border-green-600/30"
            title="Share Image"
          >📷</button>
          <button type="button" onClick={() => setShowIcebreakers(!showIcebreakers)} className="p-1 text-xl">🧊</button>
        </div>
        <button onClick={handleSend} disabled={!message.trim()} className="w-12 h-12 rounded-full flex items-center justify-center bg-green-600 text-white shadow-lg disabled:opacity-50">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </div>

      {/* Profile Detail Slide-over */}
      <AnimatePresence>
        {showUserInfo && otherUser && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-dark-950 flex flex-col overflow-y-auto"
          >
             <div className="relative h-[50vh] flex-shrink-0">
                <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
                <button onClick={() => setShowUserInfo(false)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white text-xl">✕</button>
                <div className="absolute bottom-6 left-6">
                   <h2 className="text-3xl font-black text-white">{otherUser.first_name}</h2>
                   <p className="text-green-500 font-bold">{otherUser.university}</p>
                </div>
             </div>
             <div className="p-6 space-y-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Bio</p>
                   <p className="text-white text-sm leading-relaxed">{otherUser.bio || 'No bio yet'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Course</p>
                      <p className="text-white font-bold text-sm">{otherUser.course || 'Not specified'}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-1">University</p>
                      <p className="text-white font-bold text-sm">{otherUser.university || 'N/A'}</p>
                   </div>
                </div>
                <button onClick={() => setShowUserInfo(false)} className="w-full py-4 bg-green-600 rounded-2xl font-black text-white active:scale-95 transition-transform">Back to Vibe</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageModal src={fullscreenImage} isOpen={!!fullscreenImage} onClose={() => setFullscreenImage(null)} />
    </div>
  );
};

export default Chat;