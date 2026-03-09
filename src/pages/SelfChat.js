import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import api from '../utils/api';
import ImageModal from '../components/ImageModal';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const EMOJIS = ['❤️', '😊', '🔥', '😂', '🎉', '💯', '😍', '🙏', '✨', '🎓', '🇺🇬', '😎', '🥰', '🤗', '🎵', '🏆', '👍', '👎', '💕', '💔', '🥳', '🤔', '😢', '😮', '💪', '🎯', '🌟', '💫', '🎊', '🎁', '🌈', '☀️', '🌙', '⚡', '🎭', '🎨', '📸', '🎬', '🎮', '🍕', '🍔', '🍟', '☕', '🍺', '🍷', '🎸', '🎤', '🎧', '📚', '💼', '🏫', '🏠', '🚗', '✈️'];

const formatMsgTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
  return format(d, 'MMM d, h:mm a');
};

const SelfChat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: messages, isLoading } = useQuery(
    'selfMessages',
    () => api.get('/chat/self').then(res => res.data.messages),
    { staleTime: 30000 }
  );

  const sendMutation = useMutation(
    (content) => api.post('/chat/self', { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('selfMessages');
        setMessage('');
        setShowEmojis(false);
      }
    }
  );

  const imageMutation = useMutation(
    (formData) => api.post('/chat/self/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => queryClient.invalidateQueries('selfMessages'),
    }
  );

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      imageMutation.mutate(formData);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141a]">
        <div className="w-10 h-10 border-4 border-t-transparent border-yellow-500 rounded-full animate-spin" />
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

        <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-800 ring-2 ring-yellow-500/30">
          <img src={user?.profile_photo_url || `https://ui-avatars.com/api/?name=Me`} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-base">My Notes</h2>
          <p className="text-[11px] text-yellow-400">Personal space · Cloud synced</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative"
        style={{ 
          background: '#0b141a',
          backgroundImage: 'radial-gradient(#202c33 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px'
        }}>

        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 relative z-10">
            <div className="w-20 h-20 rounded-full bg-[#202c33] flex items-center justify-center text-4xl mb-6">💭</div>
            <h3 className="text-white font-bold text-xl mb-2">My Vault</h3>
            <p className="text-gray-400 text-sm max-w-[200px]">Write notes, save links, or upload evidence to yourself!</p>
          </div>
        )}

        {messages?.map((msg) => (
          <div key={msg.id} className="flex justify-end mb-1">
            <div className="flex flex-col items-end max-w-[85%]">
              <div 
                className={`px-3 py-1.5 rounded-xl text-[14px] relative text-white`}
                style={{ background: '#005c4b', borderTopRightRadius: 0 }}
              >
                {msg.message_type === 'image' || msg.media_url ? (
                   <img src={msg.media_url || msg.imageUrl} alt="" className="max-w-full rounded-lg cursor-zoom-in" onClick={() => setFullscreenImage(msg.media_url || msg.imageUrl)} />
                ) : (
                   <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[9px] text-gray-400">{formatMsgTime(msg.created_at)}</span>
                  <span className="text-[10px] text-blue-400">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="px-2 py-3 pb-6 flex items-end gap-2 bg-[#111b21]">
        <div className="flex-1 flex items-end gap-2 bg-[#2a3942] rounded-[24px] px-3 py-1.5 min-h-[48px]">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 text-xl">😊</button>
          <textarea ref={inputRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Write a note..." rows={1} className="flex-1 bg-transparent border-none text-white focus:ring-0 py-2 resize-none max-h-32" />
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 text-gray-400 rotate-45">📎</button>
        </div>
        <button onClick={handleSend} disabled={!message.trim()} className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-600 text-white shadow-lg">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </div>

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

      <ImageModal src={fullscreenImage} isOpen={!!fullscreenImage} onClose={() => setFullscreenImage(null)} />
    </div>
  );
};

export default SelfChat;
