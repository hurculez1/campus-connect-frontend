import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { format, isToday, isYesterday } from 'date-fns';
import ImageModal from '../components/ImageModal';

const EMOJIS = ['❤️', '😊', '🔥', '😂', '🎉', '💯', '😍', '🙏', '✨', '🎓', '🇺🇬', '😎', '🥰', '🤗', '🎵', '🏆'];

const SelfChat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
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

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(15,13,12,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/matches')}
          className="text-dark-400 hover:text-white transition-colors p-1">
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

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white">My Notes</h2>
          <p className="text-xs text-yellow-400">💭 Personal space</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ background: 'rgba(15,13,12,0.6)' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-white font-bold text-lg mb-2">Your Personal Space</h3>
            <p className="text-dark-400 text-sm">Write notes to yourself, ideas, or anything on your mind!</p>
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
                <div className="bg-yellow-500/20 border border-yellow-500/30 px-4 py-2.5 rounded-2xl rounded-br-md">
                  <p className="text-white text-sm">{msg.content}</p>
                </div>
              )}
              <span className="text-[10px] text-dark-500 mt-1">{formatMsgTime(msg.created_at)}</span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="flex-shrink-0 px-4 py-3 bg-dark-900 border-t border-white/10">
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

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(15,13,12,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
          >
            📷
          </button>

          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showEmojis ? 'bg-yellow-500 text-white' : 'bg-white/10 text-dark-400 hover:text-white'}`}
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
              className="w-full px-4 py-2.5 rounded-2xl resize-none font-medium text-dark-50 placeholder:text-dark-500 text-sm bg-white/10 border border-white/10 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500 text-white font-bold disabled:opacity-30"
          >
            ➤
          </button>
        </form>
      </div>

      <ImageModal 
        src={fullscreenImage} 
        isOpen={!!fullscreenImage} 
        onClose={() => setFullscreenImage(null)} 
      />
    </div>
  );
};

export default SelfChat;
