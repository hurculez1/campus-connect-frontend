import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

// ─── Hero Profile Cards (rotating) ───────────────────────────────────────────
const heroProfilesDating = [
  { name: 'Aisha', age: 22, uni: 'Makerere University', course: 'Medicine', emoji: '👩🏾‍⚕️', color: 'from-rose-500 to-amber-500' },
  { name: 'David', age: 23, uni: 'Kyambogo University', course: 'Engineering', emoji: '👨🏿‍💻', color: 'from-violet-500 to-pink-500' },
  { name: 'Grace', age: 21, uni: 'UCU', course: 'Law', emoji: '👩🏾‍⚖️', color: 'from-amber-500 to-rose-500' },
];

const heroProfilesStudy = [
  { name: 'Amos', age: 24, uni: 'MUST', course: 'Business', emoji: '👨🏾‍💼', color: 'from-blue-500 to-indigo-500' },
  { name: 'Sarah', age: 20, uni: 'MUBS', course: 'Accounting', emoji: '👩🏾‍💻', color: 'from-indigo-600 to-purple-500' },
  { name: 'Brian', age: 22, uni: 'Makerere', course: 'CS', emoji: '👨🏾‍🎓', color: 'from-purple-500 to-blue-500' },
];

const universities = [
  'Makerere University', 'Kyambogo University', 'Uganda Christian University',
  'Mbarara University', 'Ndejje University', 'KIU', 'Busitema University',
  'Gulu University', 'Muni University', 'Victoria University',
];

const features = [
  {
    icon: '🎓',
    title: 'University Verified',
    sub: 'Only real students',
    desc: 'Every profile is verified through your student email or ID. No catfish, no fakes — only genuine campus connections.',
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    icon: '🔒',
    title: 'Safe & Secure',
    sub: 'Your privacy first',
    desc: 'Military-grade encryption on all messages. What happens in chat stays in chat — fully compliant with Uganda\'s Data Protection Act.',
    color: 'from-green-500/10 to-green-600/5',
    border: 'border-green-500/20',
  },
  {
    icon: '✨',
    title: 'Study Buddy Mode',
    sub: 'Not just dating',
    desc: 'Switch to Study Mode to find partners for courseworks, group discussions, and exam prep at your library.',
    color: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
  }
];

// ─── Component ────────────────────────────────────────────────────────────────
const Home = () => {
  const { mode, toggleMode, isAuthenticated } = useAuthStore();
  const [cardIndex, setCardIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDating = mode === 'dating';
  const profiles = isDating ? heroProfilesDating : heroProfilesStudy;

  useEffect(() => {
    const t = setInterval(() => setCardIndex(i => (i + 1) % profiles.length), 3500);
    return () => clearInterval(t);
  }, [profiles.length]);

  const profile = profiles[cardIndex] || profiles[0];

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isDating ? 'bg-mesh-dating' : 'bg-mesh-study'}`}>

      {/* ── NAV ─────────────────────────────────── */}
      <nav className="fixed w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Campus Connect logo" className={`w-9 h-9 object-contain transition-all duration-500 ${!isDating && 'filter hue-rotate-[180deg]'}`} />
              <span className="font-black text-white text-xl tracking-tighter">Campus<span className={isDating ? 'text-brand-400' : 'text-indigo-400'}>Connect</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/pulse" className="text-sm font-bold text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                <span className="text-lg">⚡</span> Pulse
              </Link>
              <button onClick={toggleMode} className="mode-switch-track cursor-pointer group scale-90">
                <div className={`mode-switch-thumb ${isDating ? 'translate-x-0' : 'translate-x-[calc(100%+0px)]'}`}
                  style={{ background: isDating ? 'linear-gradient(135deg, #f43f5e, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
                <span className={`mode-btn ${isDating ? 'text-white' : 'text-dark-500'}`}>Dating</span>
                <span className={`mode-btn ${!isDating ? 'text-white' : 'text-dark-500'}`}>Study</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                {isAuthenticated ? (
                  <Link to="/discover" className={isDating ? 'btn-premium-v2 py-2 text-sm' : 'btn-study py-2 text-sm'}>Go to App</Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-bold text-dark-300 hover:text-white transition-colors">Log In</Link>
                    <Link to="/register" className={isDating ? 'btn-premium-v2 py-2 text-sm' : 'btn-study py-2 text-sm'}>Join Now</Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-white text-2xl"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-950/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                <Link to="/pulse" className="flex items-center gap-4 text-xl font-black text-white" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">⚡</span>
                  Pulse Feed
                </Link>
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5">
                  <span className="text-sm font-bold text-dark-300">Switch Mode</span>
                  <button onClick={toggleMode} className="mode-switch-track group scale-90">
                    <div className={`mode-switch-thumb ${isDating ? 'translate-x-0' : 'translate-x-[calc(100%+0px)]'}`}
                      style={{ background: isDating ? 'linear-gradient(135deg, #f43f5e, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
                  </button>
                </div>
                <div className="pt-6 border-t border-white/5 space-y-4">
                  {isAuthenticated ? (
                    <Link to="/discover" className="btn-brand w-full py-4 text-center block" onClick={() => setIsMobileMenuOpen(false)}>Go to App</Link>
                  ) : (
                    <>
                      <Link to="/login" className="btn-glass w-full py-4 text-center block" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                      <Link to="/register" className="btn-brand w-full py-4 text-center block" onClick={() => setIsMobileMenuOpen(false)}>Join Now</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-28 lg:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] mb-10 border shadow-lg ${isDating ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 shadow-brand-500/10' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10'}`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDating ? 'bg-brand-500' : 'bg-indigo-500'}`} />
                {isDating ? "Uganda's #1 Campus Dating App" : "The Ultimate Study Buddy Network"}
              </motion.div>

              <h1 className="text-6xl lg:text-[100px] font-black text-white leading-[0.9] mb-10 tracking-[-0.05em]">
                {isDating ? (
                  <>Connect <span className="text-gradient inline-block">Hearts</span><br />on Campus</>
                ) : (
                  <>Excellence <span className="text-study-gradient inline-block" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Together</span><br />on Campus</>
                )}
              </h1>

              <p className="text-dark-200 text-xl lg:text-2xl leading-relaxed mb-12 max-w-xl font-medium opacity-80">
                {isDating
                  ? "Experience a safer, smarter way to find your perfect match at Uganda's top universities. Verified profiles only."
                  : "Join the elite network of students from Makerere, Kyambogo & more. Collaborate, share, and achieve together."}
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/register" className={`${isDating ? 'btn-premium-v2' : 'btn-study'} text-lg px-12 py-5 flex items-center justify-center gap-3 group`}>
                  <span>{isDating ? 'Start Swiping' : 'Find a Partner'}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <button
                  onClick={toggleMode}
                  className="glass-card-premium px-12 py-5 text-lg font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <span className="opacity-60">{isDating ? '📚' : '❤️'}</span>
                  {isDating ? 'Switch to Study' : 'Switch to Dating'}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 pt-10 border-t border-white/5 flex flex-wrap gap-8 items-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-dark-950 bg-dark-800 flex items-center justify-center text-xs">👤</div>
                  ))}
                </div>
                <div>
                  <div className="text-white font-black text-lg">15,000+ Students</div>
                  <div className="text-dark-400 text-sm font-bold uppercase tracking-widest">Active across Uganda</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Premium Mockup */}
            <div className="flex justify-center relative">
              <div className="relative w-72 lg:w-80 animate-pulse-slow">
                <div className="rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10"
                  style={{ background: 'linear-gradient(145deg, #1a1614, #0d0b0a)' }}>
                  <div className="rounded-[3rem] overflow-hidden bg-dark-950 relative" style={{ minHeight: 560 }}>

                    {/* Interior App Header */}
                    <div className="p-6 pb-2 flex justify-between items-center">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">🏫</div>
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">💬</div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${mode}-${cardIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6 pt-2"
                      >
                        <div className={`w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${profile.color} flex flex-col items-center justify-center relative shadow-2xl`}>
                          <div className="text-8xl mb-4 drop-shadow-lg">{profile.emoji}</div>

                          <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="text-white font-black text-2xl mb-1">{profile.name}, {profile.age}</div>
                            <div className="text-white/70 text-xs font-bold uppercase tracking-widest">{profile.course}</div>
                            <div className="text-white/50 text-[10px] mt-1 italic">📍 {profile.uni}</div>
                          </div>

                          <div className="absolute top-4 right-4 py-1 px-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] text-white font-black uppercase tracking-wider">
                            {isDating ? '🔥 HOT' : '🧠 SMART'}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* App Navigation Placeholder */}
                    <div className="absolute bottom-6 inset-x-0 flex justify-center gap-6">
                      <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl shadow-lg border-white/10">✖️</div>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-500 scale-110 ${isDating ? 'bg-brand-500 shadow-brand-lg' : 'bg-indigo-500 shadow-indigo-500/50'}`}>
                        {isDating ? '❤️' : '📖'}
                      </div>
                      <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl shadow-lg border-white/10">⭐</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 lowercase">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDating ? 'text-brand-400' : 'text-indigo-400'}`}>The Platform</span>
            <h2 className="text-4xl lg:text-6xl font-black text-white mt-4 tracking-tighter">Everything a student <span className="italic opacity-50">really</span> needs.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -15 }}
                className="glass-card-premium p-12 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl">
                  {f.icon}
                </div>
                <h3 className="text-white font-black text-2xl mb-4 tracking-[-0.02em]">{f.title}</h3>
                <p className="text-dark-300 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className={`w-24 h-24 mx-auto mb-10 rounded-3xl flex items-center justify-center text-4xl shadow-2xl animate-bounce ${isDating ? 'bg-brand-500 text-white' : 'bg-indigo-500 text-white'}`}>
            {isDating ? '❤️' : '🎓'}
          </div>
          <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tighter">Ready for your <span className="opacity-50 italic">next</span> match?</h2>
          <Link to="/register" className={isDating ? 'btn-premium-v2 text-xl px-12 py-5' : 'btn-study text-xl px-12 py-5'}>
            {isDating ? 'Create My Dating Profile' : 'Find My Study Partners'}
          </Link>
          <p className="text-dark-500 mt-8 text-xs font-black uppercase tracking-widest">100% Free for Ugandan Higher Education Students</p>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center lowercase">
        <p className="text-dark-500 text-xs font-black tracking-widest uppercase mb-4">Campus Connect Uganda © 2026</p>
        <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-dark-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Safety</a>
        </div>
      </footer>

    </div>
  );
};

export default Home;