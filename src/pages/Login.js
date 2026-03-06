import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const UNIVERSITIES = [
  'Makerere University', 'Kyambogo University', 'Makerere University Business School',
  'Uganda Christian University', 'Uganda Martyrs University', 'Gulu University',
  'Busitema University', 'Mbarara University of Science and Technology',
  'Ndejje University', 'Cavendish University Uganda', 'Other',
];

/* ───────────────────────── Extra-Info Modal ───────────────────────── */
const GoogleExtraInfoModal = ({ pendingData, onComplete, onClose }) => {
  const [form, setForm] = useState({ university: '', dateOfBirth: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const { googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await googleLogin(pendingData.token, {
      university: form.university,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
    });
    setLoading(false);
    if (result.success) {
      toast.success(`🎉 Welcome aboard, ${pendingData.name}!`);
      navigate('/discover');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="w-full max-w-md bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Avatar from Google */}
        <div className="text-center mb-6">
          {pendingData.picture && (
            <img src={pendingData.picture} alt={pendingData.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-brand-500/50"
            />
          )}
          <h2 className="text-white font-black text-2xl tracking-tight">Almost there, {pendingData.name}! 👋</h2>
          <p className="text-dark-400 text-sm mt-1">We need a few more details to complete your profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University */}
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">🎓 University</label>
            <select
              required
              value={form.university}
              onChange={e => setForm({ ...form, university: e.target.value })}
              className="input w-full"
            >
              <option value="">Select your university</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">🎂 Date of Birth</label>
            <input
              type="date"
              required
              value={form.dateOfBirth}
              onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              className="input w-full"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
            <p className="text-dark-600 text-xs mt-1">You must be 18+ to use CampusConnect</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">🪪 Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {['male', 'female', 'other'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`py-3 rounded-xl text-sm font-bold capitalize transition-all border ${
                    form.gender === g
                      ? 'bg-brand-500 border-brand-400 text-white'
                      : 'bg-white/5 border-white/10 text-dark-400 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.university || !form.dateOfBirth || !form.gender}
            className="btn-brand w-full py-4 rounded-2xl font-black text-lg mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating your account...' : 'Complete Sign Up →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

/* ───────────────────────── Main Login Page ───────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const { login, demoLogin, googleLogin, error, clearError, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [googlePending, setGooglePending] = useState(null); // holds pendingData + token

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const success = await login(formData.email, formData.password);
    if (success) navigate('/discover');
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await googleLogin(tokenResponse.access_token);
      if (!result.success) {
        toast.error('Google sign-in failed. Please try again.');
        return;
      }
      if (result.requireMoreData) {
        // New user — need more info before creating account
        setGooglePending({ ...result.pendingData, token: tokenResponse.access_token });
        return;
      }
      toast.success('🎉 Welcome back!');
      navigate('/discover');
    },
    onError: () => toast.error('Google sign-in cancelled or failed.'),
  });

  return (
    <div className="min-h-screen bg-mesh-dating flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-amber-500/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <Link to="/" className="inline-flex flex-col items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={`${process.env.PUBLIC_URL}/logo.png`}
                alt="Campus Connect logo"
                className="w-20 h-20 object-contain relative transition-transform duration-700 group-hover:scale-110"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-white font-black text-3xl tracking-tighter leading-none">Campus<span className="text-brand-400">Connect</span></h1>
              <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Uganda</p>
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-premium p-10 lg:p-12"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="text-dark-400 font-medium">Continue your campus journey</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-4 rounded-xl text-sm text-red-300 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="text-lg">⚠️</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">✉️</span>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="you@university.ac.ug"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-10 pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors text-lg"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-dark-400">Remember me</span>
              </label>
              <Link to="/forgot-password"
                className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-premium-v2 w-full py-5 text-lg flex items-center justify-center gap-3 shadow-brand-500/20"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="opacity-60">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-dark-500 text-xs font-medium">OR CONTINUE WITH</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google Login — real OAuth, premium styled */}
          <motion.button
            whileHover={{ scale: 1.015, y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold transition-all duration-200 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1.5px solid rgba(0,0,0,0.10)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
              color: '#3c4043',
            }}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)' }}
            />
            {/* Google G icon with shadow */}
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            {/* Text */}
            <div className="flex-1 text-left">
              <div className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: '#3c4043' }}>Continue with Google</div>
              <div className="text-[11px] font-medium" style={{ color: '#80868b' }}>Sign in securely via Google</div>
            </div>
            {/* Arrow */}
            <svg className="w-4 h-4 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="#3c4043" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </motion.button>

          {/* Demo Mode */}
          <div className="relative flex items-center gap-4 mt-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-dark-600 text-xs">OR</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => { demoLogin(); navigate('/discover'); }}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 mt-2"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(245,158,11,0.15))',
              border: '2px dashed rgba(244,63,94,0.5)',
              color: '#fb7185',
            }}
          >
            <span className="text-xl">🚀</span>
            <div className="text-left">
              <div>Try Demo — No Account Needed</div>
              <div className="text-xs font-normal opacity-70">Explore the full app instantly</div>
            </div>
            <span className="text-xl">→</span>
          </motion.button>
        </motion.div>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-dark-400"
        >
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Join Campus Connect →
          </Link>
        </motion.p>

        {/* Safety notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-dark-600 text-xs"
        >
          🔒 End-to-end encrypted · GDPR compliant · 18+ only
        </motion.p>
      </div>

      {/* Extra-info modal for brand-new Google users */}
      <AnimatePresence>
        {googlePending && (
          <GoogleExtraInfoModal
            pendingData={googlePending}
            onClose={() => setGooglePending(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;