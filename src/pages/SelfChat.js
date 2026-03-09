import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { format, isToday, isYesterday } from 'date-fns';
import ImageModal from '../components/ImageModal';

const EMOJIS = ['❤️', '😊', '🔥', '😂', '🎉', '💯', '😍', '🙏', '✨', '🎓', '🇺🇬', '😎', '🥰', '🤗', '🎵', '🏆', '👍', '👎', '💕', '💔', '🥳', '🤔', '😢', '😮', '💪', '🎯', '🌟', '💫', '🎊', '🎁', '🌈', '☀️', '🌙', '⚡', '🎭', '🎨', '📸', '🎬', '🎮', '🍕', '🍔', '🍟', '☕', '🍺', '🍷', '🎸', '🎤', '🎧', '📚', '💼', '🏫', '🏠', '🚗', '✈️'];

const SelfChat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      content: message,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      is_read: true,
      message_type: 'text'
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show the image in the chat (would need backend for real upload)
      const imageUrl = URL.createObjectURL(file);
      const newMessage = {
        id: Date.now(),
        content: '[Image]',
        created_at: new Date().toISOString(),
        sender_id: user.id,
        is_read: true,
        message_type: 'image',
        imageUrl: imageUrl
      };
      setMessages([...messages, newMessage]);
    }
  };

  const formatMsgTime = (ts) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
    return format(d, 'MMM d, h:mm a');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-950">

      {/* Header - WhatsApp style */}
      <div className="flex items-center gap-3 px-3 py-2 flex-shrink-0"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={() => navigate('/matches')}
          className="text-gray-300 hover:text-white transition-colors p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-yellow-500/50">
          {user?.profile_photo_url || user?.profilePhotoUrl ? (
            <img src={user.profile_photo_url || user.profilePhotoUrl} alt="Me" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              👤
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserInfo(true)}>
          <h2 className="font-bold text-white">My Notes</h2>
          <p className="text-xs text-yellow-400">💭 Personal space</p>
        </div>
      </div>

      {/* Messages - WhatsApp style background */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-white font-bold text-lg mb-2">Your Personal Space</h3>
            <p className="text-gray-400 text-sm">Write notes to yourself, ideas, or anything on your mind!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-end mb-1">
            <div className="flex flex-col items-end max-w-[80%]">
              {msg.message_type === 'image' && msg.imageUrl ? (
                <div 
                  className="rounded-2xl overflow-hidden cursor-zoom-in max-w-[250px]"
                  onClick={() => setFullscreenImage(msg.imageUrl)}
                >
                  <img src={msg.imageUrl} alt="Shared" className="w-full h-auto" />
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl text-sm font-medium"
                  style={{ background: '#056162', color: 'white', borderTopRightRadius: '4px' }}>
                  {msg.content}
                </div>
              )}
              <span className="text-[10px] text-gray-500 mt-1">{formatMsgTime(msg.created_at)}</span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker - WhatsApp style */}
      {showEmojis && (
        <div className="flex-shrink-0 px-4 py-3" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
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
        </div>
      )}

      {/* Input - WhatsApp style */}
      <div className="flex-shrink-0 px-3 py-2"
        style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <form onSubmit={handleSend} className="flex items-end gap-2">
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showEmojis ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            😊
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a note..."
              rows={1}
              className="w-full px-4 py-2 rounded-2xl resize-none font-medium text-white placeholder:text-gray-500 text-sm bg-gray-700 border border-gray-600 focus:outline-none focus:border-gray-500"
              style={{ maxHeight: 120 }}
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#00a884' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      <ImageModal 
        src={fullscreenImage} 
        isOpen={!!fullscreenImage} 
        onClose={() => setFullscreenImage(null)} 
      />

      {/* User Info Modal */}
      {showUserInfo && (
        <div className="fixed inset-0 z-[60] bg-dark-950 flex items-center justify-center" onClick={() => setShowUserInfo(false)}>
          <div className="w-full h-full max-w-2xl bg-dark-900 overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Profile Header */}
            <div className="relative h-[50vh]">
              <img 
                src={user?.profile_photo_url || user?.profilePhotoUrl || 'https://ui-avatars.com/api/?name=Me&background=random'} 
                alt="" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setFullscreenImage(user?.profile_photo_url || user?.profilePhotoUrl)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
              <button onClick={() => setShowUserInfo(false)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white text-xl">
                ←
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-3xl font-black text-white">{user?.first_name || 'Me'} {user?.last_name || ''}</h2>
                <p className="text-yellow-400 text-sm font-bold mt-1">{user?.university || 'My University'}</p>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-widest mb-1">Course</p>
                  <p className="text-white font-bold">{user?.course || 'Not specified'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-widest mb-1">Year</p>
                  <p className="text-white font-bold">{user?.year_of_study || 'N/A'}</p>
                </div>
              </div>

              {user?.bio && (
                <div>
                  <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-widest mb-3">About</h3>
                  <p className="text-dark-200 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                    {user.bio}
                  </p>
                </div>
              )}

              {user?.interests && (
                <div>
                  <h3 className="text-dark-400 text-[10px] font-black uppercase tracking-widest mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(user.interests) ? user.interests : []).map(tag => (
                      <span key={tag} className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { setShowUserInfo(false); }} className="w-full py-4 bg-yellow-500 rounded-2xl font-black text-white flex items-center justify-center gap-2">
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfChat;
