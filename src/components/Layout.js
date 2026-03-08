import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Navigation from './Navigation';

const Layout = () => {
  const { user, mode, toggleMode } = useAuthStore();
  const isDating = mode === 'dating';

  // Always force dark mode
  React.useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out ${isDating ? 'bg-mesh-dating mode-dating' : 'bg-mesh-study mode-study'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Mode Switcher */}
            <div className="flex items-center gap-6">
              <Link to="/discover" className="flex items-center gap-2.5 group">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png`}
                  alt="Campus Connect Logo"
                  className={`w-16 h-16 object-contain transition-all duration-700 hover:scale-110 active:scale-95 ${isDating ? 'drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]' : 'drop-shadow-[0_0_15px_rgba(99,102,241,0.7)] filter hue-rotate-[180deg]'}`}
                  style={{ mixBlendMode: 'screen' }}
                />
                <span className="hidden lg:block text-white font-black text-xl tracking-tight">
                  Campus<span className={isDating ? 'text-brand-400' : 'text-indigo-400'}>Connect</span>
                </span>
              </Link>


              {/* World Class Mode Switcher 🛠️ */}
              <div className="hidden lg:flex items-center ml-2">
                <button
                  onClick={toggleMode}
                  className="mode-switch-track cursor-pointer group"
                  aria-label="Toggle Study/Dating Mode"
                >
                  <div className="mode-switch-thumb" />
                  <span className={`mode-btn ${isDating ? 'text-white' : 'text-dark-500'}`}>Dating</span>
                  <span className={`mode-btn ${!isDating ? 'text-white' : 'text-dark-500'}`}>Study</span>
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
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

              {/* User avatar */}
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="hidden sm:block text-right">
                  <p className="text-white text-sm font-bold leading-tight">{user?.firstName}</p>
                  <div className="flex items-center justify-end gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDating ? 'bg-brand-400' : 'bg-indigo-400'} animate-pulse`} />
                    <p className="text-dark-400 text-[10px] font-black uppercase tracking-tighter">{user?.subscriptionTier || 'free'}</p>
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
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-dark-950 flex items-center justify-center ${isDating ? 'bg-brand-500' : 'bg-indigo-500'
                      }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Layout;