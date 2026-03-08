import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Navigation from './Navigation';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user, mode, toggleMode } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const isDating = mode === 'dating';
  
  // Hide navigation on chat routes
  const isChatRoute = location.pathname.startsWith('/chat/') || location.pathname.startsWith('/connection/');

  // Always force dark mode
  React.useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out ${isDating ? 'bg-mesh-dating mode-dating' : 'bg-mesh-study mode-study'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Sidebar Toggle & Logo */}
            <div className="flex items-center gap-1 sm:gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 sm:p-2 -ml-1 rounded-lg sm:rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all active:scale-90"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/discover" className="flex items-center gap-1.5 sm:gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="Campus Connect Logo"
                  className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 object-contain transition-all duration-700 hover:scale-110 active:scale-95 ${isDating ? 'drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]' : 'drop-shadow-[0_0_10px_rgba(99,102,241,0.7)]'}`}
                />
                <span className="hidden md:block text-white font-black text-xs lg:text-xl tracking-tight">
                  Campus<span className={isDating ? 'text-brand-400' : 'text-indigo-400'}>Connect</span>
                </span>
              </Link>


              {/* Mode Switcher - always visible */}
              <div className="flex items-center ml-1">
                <button
                  onClick={toggleMode}
                  className="mode-switch-track cursor-pointer group"
                  aria-label="Toggle Study/Dating Mode"
                >
                  <div className="mode-switch-thumb" />
                  <span className={`mode-btn text-[7px] sm:text-[10px] ${isDating ? 'text-white' : 'text-dark-500'}`}>Dating</span>
                  <span className={`mode-btn text-[7px] sm:text-[10px] ${!isDating ? 'text-white' : 'text-dark-500'}`}>Study</span>
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-4">
              {/* Upgrade badge for free users */}
              {user?.subscriptionTier === 'free' && (
                <Link
                  to="/subscription"
                  className={`hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${isDating
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 hover:bg-brand-500/20'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                    }`}
                >
                  ✨ Go Pro
                </Link>
              )}

              {/* User info */}
              <Link to="/profile" className="flex items-center gap-1.5 sm:gap-3 group">
                <div className="text-right">
                  <p className="text-white text-[10px] sm:text-sm font-bold leading-tight">{user?.firstName}</p>
                  <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                    <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isDating ? 'bg-brand-400' : 'bg-indigo-400'} animate-pulse`} />
                    <p className="text-dark-400 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter">{user?.subscriptionTier || 'free'}</p>
                  </div>
                </div>
                <div className="relative group/avatar">
                  <div className={`absolute -inset-1 blur-lg opacity-40 group-hover:opacity-100 transition-opacity duration-700 ${isDating ? 'bg-brand-500' : 'bg-indigo-500'}`} />
                  <div
                    className={`w-12 h-12 rounded-2xl overflow-hidden relative transition-all duration-500 border-2 ${isDating ? 'border-brand-500/50 shadow-brand-500/20' : 'border-indigo-500/50 shadow-indigo-500/20'
                      }`}
                  >
                    {user?.profile_photo_url || user?.profilePhotoUrl || user?.profilePhoto ? (
                      <img
                        src={user.profile_photo_url || user.profilePhotoUrl || user.profilePhoto}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xl"
                        style={{ background: isDating ? 'linear-gradient(135deg, #f43f5e20, #f59e0b20)' : 'linear-gradient(135deg, #6366f120, #a855f720)' }}
                      >
                        {user?.gender === 'female' ? '👩🏾' : '👨🏿'}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isChatRoute ? 'pb-0' : 'pb-32'}`}>
        <Outlet />
      </main>

      {/* Mobile Navigation - hidden on chat pages */}
      {!isChatRoute && <Navigation />}

      {/* Sidebar Overlay */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
};

export default Layout;