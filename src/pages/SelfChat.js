import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const SelfChat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      content: message,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      is_read: true
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
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
          <p className="text-xs text-yellow-400">💭 Chat with yourself</p>
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
            <div className="bg-yellow-500/20 border border-yellow-500/30 px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
              <p className="text-white text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(15,13,12,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a note to yourself..."
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
    </div>
  );
};

export default SelfChat;
