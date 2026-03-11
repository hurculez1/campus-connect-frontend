import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UNIVERSITIES = [
  'Makerere University', 'Kyambogo University', 'Makerere University Business School',
  'Uganda Christian University', 'Uganda Martyrs University', 'Gulu University',
  'Busitema University', 'Mbarara University of Science and Technology',
  'Ndejje University', 'Cavendish University Uganda', 'Other',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => String(currentYear - 18 - i));

const Drum = ({ items, selected, onSelect, label }) => {
  const ref = React.useRef(null);
  const ITEM_H = 44;
  const idx = items.indexOf(selected);

  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line

  const handleScroll = () => {
    if (!ref.current) return;
    const i = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    if (items[clamped] !== selected) onSelect(items[clamped]);
  };

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-dark-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</span>
      <div className="relative w-full" style={{ height: ITEM_H * 3 }}>
        <div className="absolute left-0 right-0 pointer-events-none z-10 rounded-xl"
          style={{ top: ITEM_H, height: ITEM_H, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)' }} />
        <div className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(15,13,12,1), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(15,13,12,1), transparent)' }} />
        <div
          ref={ref}
          onScroll={handleScroll}
          className="overflow-y-scroll h-full"
          style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div style={{ height: ITEM_H }} />
          {items.map(item => (
            <div key={item}
              onClick={() => {
                const i = items.indexOf(item);
                ref.current.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
                onSelect(item);
              }}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
              className={`flex items-center justify-center text-base font-bold cursor-pointer transition-colors select-none
                ${item === selected ? 'text-white' : 'text-dark-600'}`}
            >
              {item}
            </div>
          ))}
          <div style={{ height: ITEM_H }} />
        </div>
      </div>
    </div>
  );
};

const DateRoller = ({ value, onChange }) => {
  const parts = value ? value.split('-') : [];
  const [year, setYear] = React.useState(parts[0] || YEARS[0]);
  const [month, setMonth] = React.useState(parts[1] ? MONTHS[parseInt(parts[1]) - 1] : MONTHS[0]);
  const [day, setDay] = React.useState(parts[2] || DAYS[0]);

  React.useEffect(() => {
    const m = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
    onChange(`${year}-${m}-${day}`);
  }, [day, month, year]); // eslint-disable-line

  return (
    <div className="flex gap-2 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Drum items={DAYS} selected={day} onSelect={setDay} label="Day" />
      <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <Drum items={MONTHS} selected={month} onSelect={setMonth} label="Month" />
      <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <Drum items={YEARS} selected={year} onSelect={setYear} label="Year" />
    </div>
  );
};

/* ───────────────────────── Extra-Info Modal ───────────────────────── */
const GoogleExtraInfoModal = ({ pendingData, onComplete, onClose }) => {
  const [form, setForm] = useState({ 
    university: '', 
    dateOfBirth: '', 
    gender: '',
    email: pendingData.email || ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  const { googleLogin, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Max size is 5MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Complete Google Signup
    const result = await googleLogin(pendingData.token, {
      university: form.university,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      customEmail: form.email !== pendingData.email ? form.email : undefined
    });

    if (result.success) {
      // 2. If photo selected, upload it now that we are logged in
      if (photo) {
        try {
          const formData = new FormData();
          formData.append('photo', photo);
          const uploadRes = await api.post('/users/photos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Update local store with the new photo URL
          updateUser({ profile_photo_url: uploadRes.data.photo.url });
        } catch (err) {
          console.error('Photo upload failed:', err);
          toast.error('Account created, but photo upload failed. You can set it later in Profile.');
        }
      }

      setLoading(false);
      toast.success(`🎉 Welcome aboard, ${pendingData.name}!`);
      navigate('/discover');
    } else {
      setLoading(false);
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
        {/* Avatar Area */}
        <div className="text-center mb-6">
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-amber-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-xl bg-dark-800">
              <img 
                src={photoPreview || pendingData.picture} 
                alt={pendingData.name}
                className="w-full h-full object-cover"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
              >
                CHANGE PHOTO
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
          </div>
          <h2 className="text-white font-black text-2xl tracking-tight mt-4">Almost there, {pendingData.name}! 👋</h2>
          <p className="text-dark-400 text-sm mt-1">We need a few more details to complete your profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">✉️ Profile Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input w-full"
              placeholder="Your email address"
            />
            <p className="text-dark-600 text-[10px] mt-1.5 px-1">This email will be used for your account profile.</p>
          </div>
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

          {/* Date of Birth - Scrolling Wheel */}
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">🎂 Date of Birth</label>
            <DateRoller
              value={form.dateOfBirth}
              onChange={val => setForm({ ...form, dateOfBirth: val })}
            />
            <p className="text-dark-600 text-[10px] mt-2">You must be 18+ to use CampusConnect 🔞</p>
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
                className="w-32 h-32 object-contain relative transition-transform duration-700 group-hover:scale-110"
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
