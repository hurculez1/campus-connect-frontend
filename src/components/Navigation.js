import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  {
    path: '/discover',
    label: 'Discover',
    emoji: '🔍',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: '/matches',
    label: 'Inbox',
    emoji: '💬',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    path: '/pulse',
    label: 'Pulse',
    emoji: '📡',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    path: '/subscription',
    label: 'Premium',
    emoji: '⭐',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    emoji: '👤',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const Navigation = () => {
  const location = useLocation();

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[200] w-full"
      >
        {/* Fading gradient to obscure scrolling content right above the bar */}
        <div className="h-12 w-full bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent pointer-events-none" />
        
        <div 
          className="glass-card-premium h-20 rounded-t-[2.5rem] rounded-b-none flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 relative overflow-hidden backdrop-blur-3xl"
          style={{
            background: 'rgba(20, 18, 17, 0.95)',
            WebkitBackdropFilter: 'blur(24px)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1.5 relative group"
            >
              <div className={`relative transition-all duration-500 mb-1 ${isActive ? 'scale-110' : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white/10 shadow-lg' : ''}`}>
                  <span className="text-2xl drop-shadow-md">{item.emoji}</span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-dark-950 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}
                  />
                )}
              </div>

              <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors duration-300 ${isActive ? 'text-white' : 'text-dark-400 group-hover:text-dark-200'}`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-x-1 inset-y-2 rounded-2xl -z-10 blur-xl opacity-20"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}
                />
              )}
            </Link>
          );
        })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;