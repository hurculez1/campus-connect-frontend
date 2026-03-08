import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: 'Account Settings', path: '/settings', icon: '⚙️' },
    { label: 'Privacy & Safety', path: '/privacy', icon: '🛡️' },
    { label: 'Help & Support', path: '/help', icon: '❓' },
    { label: 'University Verification', path: '/verification', icon: '🎓' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />

          {/* Sidebar Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-dark-950 border-r border-white/5 z-[1001] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-brand-500/10 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-brand-500/20">
                  <img 
                    src={user?.profilePhotoUrl || user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}&background=random`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-tight capitalize">{user?.firstName}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${user?.subscriptionTier === 'vip' ? 'text-gold-400' : 'text-brand-400'}`}>
                    {user?.subscriptionTier || 'Free Plan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-4 overflow-y-auto no-scrollbar">
              <div className="px-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-dark-200 font-bold text-sm tracking-tight group-hover:text-white">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
