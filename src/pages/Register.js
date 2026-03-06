import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useGoogleLogin } from '@react-oauth/google';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';

const STEPS = [
  { id: 1, label: 'Account', icon: '🔑' },
  { id: 2, label: 'Profile', icon: '👤' },
  { id: 3, label: 'Campus', icon: '🎓' },
];

const INTERESTS = [
  '📚 Academics', '🎵 Music', '⚽ Sports', '🎭 Drama', '🌿 Nature',
  '🍳 Cooking', '✈️ Travel', '🎨 Art', '💻 Tech', '📖 Reading',
  '🏋️ Fitness', '🎮 Gaming', '🌍 Volunteering', '📷 Photography',
  '🎤 Debate', '🧘 Wellness', '🎬 Movies', '🌱 Eco-Living',
];

// ─── Drum-Roll Date Picker ───────────────────────────────────────────────────
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
        {/* Selection highlight */}
        <div className="absolute left-0 right-0 pointer-events-none z-10 rounded-xl"
          style={{ top: ITEM_H, height: ITEM_H, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)' }} />
        {/* Top/bottom fade */}
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
          {/* Padding items */}
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

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin, error, clearError, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await googleLogin(tokenResponse.access_token);
      if (!result?.success) {
        toast.error('Google sign-up failed. Please try again.');
        return;
      }
      if (result.requireMoreData) {
        // New user needs more info — redirect to login page which has the modal
        toast('Please complete your profile to finish signing up!', { icon: '📋' });
        navigate('/login');
        return;
      }
      toast.success('Welcome to CampusConnect! 🎉');
      navigate('/discover');
    },
    onError: () => toast.error('Google sign-up cancelled or failed.'),
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    pronouns: '',
    bio: '',
    university: '',
    course: '',
    yearOfStudy: '',
    studentEmail: '',
  });
  const [stepError, setStepError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: universities } = useQuery('universities',
    () => api.get('/universities').then(res => res.data.universities),
    { retry: false, onError: () => { } }
  );

  const update = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    setStepError('');
  };

  const toggleInterest = (i) => {
    setSelectedInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.email.includes('@')) return 'Please enter a valid email.';
      if (formData.password.length < 8) return 'Password must be at least 8 characters.';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) return 'Please enter your full name.';
      if (!formData.dateOfBirth) return 'Date of birth is required.';
      if (!formData.gender) return 'Please select your gender.';
      const age = Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) return 'You must be 18 or older to join.';
    }
    if (step === 3) {
      if (!formData.university) return 'Please type or select your university or institute.';
    }
    return null;
  };

  const handleNext = () => {
    clearError();
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const err = validateStep();
    if (err) { setStepError(err); return; }

    const success = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      pronouns: formData.pronouns,
      bio: formData.bio,
      interests: selectedInterests,
      university: formData.university,
      course: formData.course,
      yearOfStudy: formData.yearOfStudy,
      studentEmail: formData.studentEmail,
    });

    if (success) navigate('/verification');
  };

  const currentErr = stepError || error;

  return (
    <div className="min-h-screen bg-mesh-dating flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-lg relative z-10">
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
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-white font-black text-3xl tracking-tighter leading-none">Campus<span className="text-brand-400">Connect</span></h1>
              <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Uganda</p>
            </div>
          </Link>
        </motion.div>

        {/* Step indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            {STEPS.map(({ id, label, icon }, i) => (
              <React.Fragment key={id}>
                <div className={`relative flex flex-col items-center gap-2 group`}>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${step >= id
                        ? 'text-white shadow-xl shadow-brand-500/20'
                        : 'text-dark-500 bg-white/5 border border-white/10'
                      }`}
                    style={step >= id ? { background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' } : {}}
                  >
                    {icon}
                    {step > id && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] border-2 border-dark-950"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${step >= id ? 'text-white' : 'text-dark-600'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mb-6 w-12 lg:w-16 h-px bg-white/10 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-brand-500"
                      initial={{ left: '-100%' }}
                      animate={{ left: step > id ? '0%' : '-100%' }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-premium p-10 lg:p-12 mb-10"
        >
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'Your campus details'}
            </h1>
            <p className="text-dark-400 font-medium">
              Step {step} of {STEPS.length} · {Math.round((step / STEPS.length) * 100)}% complete
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Email address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">✉️</span>
                    <input type="email" value={formData.email}
                      onChange={e => update('email', e.target.value)}
                      className="input pl-10" placeholder="you@example.com" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">🔒</span>
                    <input type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={e => update('password', e.target.value)}
                      className="input pl-10 pr-12" placeholder="Min. 8 characters" required />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {/* Password strength indicator */}
                    {['', '', '', ''].map((_, i) => {
                      const strength = Math.min(4, Math.floor(formData.password.length / 3));
                      return (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: i < strength
                              ? i < 2 ? '#ef4444' : i < 3 ? '#f59e0b' : '#22c55e'
                              : 'rgba(255,255,255,0.1)'
                          }} />
                      );
                    })}
                  </div>
                  {formData.password && (
                    <p className="text-xs mt-1" style={{
                      color: formData.password.length < 6 ? '#ef4444' : formData.password.length < 10 ? '#f59e0b' : '#22c55e'
                    }}>
                      {formData.password.length < 6 ? '⚠️ Weak password' : formData.password.length < 10 ? '🔶 Moderate strength' : '✅ Strong password'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Confirm password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">🔐</span>
                    <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      className={`input pl-10 pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'input-error' : ''}`}
                      placeholder="Repeat your password" required />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white focus:outline-none"
                    >
                      {showConfirmPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>

                {currentErr && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg text-sm text-red-300 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span>⚠️</span> {currentErr}
                  </motion.div>
                )}

                {currentErr && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl text-sm font-medium text-red-200 flex items-start gap-2 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span className="text-base mt-0.5">⚠️</span> {currentErr}
                  </motion.div>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-premium-v2 w-full py-5 text-lg group shadow-brand-500/20"
                >
                  <span>Continue</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* Divider + Google */}
                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-dark-500 text-xs">OR</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleGoogleSignup()}
                  whileHover={{ scale: 1.015, y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
                  whileTap={{ scale: 0.97 }}
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
                  {/* Google G icon */}
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
                    <div className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: '#3c4043' }}>Sign up with Google</div>
                    <div className="text-[11px] font-medium" style={{ color: '#80868b' }}>Create account via Google</div>
                  </div>
                  {/* Arrow */}
                  <svg className="w-4 h-4 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="#3c4043" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                  </svg>
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2: Profile ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">First name</label>
                    <input type="text" value={formData.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      className="input" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Last name</label>
                    <input type="text" value={formData.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      className="input" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Date of birth</label>
                  <DateRoller
                    value={formData.dateOfBirth}
                    onChange={val => update('dateOfBirth', val)}
                  />
                  <p className="text-dark-500 text-xs mt-2">You must be 18 or older 🔞</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Gender</label>
                    <select value={formData.gender} onChange={e => update('gender', e.target.value)}
                      className="input" required>
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Pronouns <span className="text-dark-500">(opt.)</span></label>
                    <select value={formData.pronouns} onChange={e => update('pronouns', e.target.value)} className="input">
                      <option value="">Select...</option>
                      <option value="he/him">He / Him</option>
                      <option value="she/her">She / Her</option>
                      <option value="they/them">They / Them</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">
                    Bio <span className="text-dark-500 font-normal">({formData.bio.length}/500)</span>
                  </label>
                  <textarea value={formData.bio}
                    onChange={e => update('bio', e.target.value.slice(0, 500))}
                    className="input resize-none" rows={3}
                    placeholder="Tell people what makes you unique — your hobbies, dreams, favourite Ugandan food... 🍽️" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-3">
                    Interests <span className="text-dark-500 font-normal">(pick up to 8)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => {
                      const active = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => selectedInterests.length < 8 || active ? toggleInterest(interest) : null}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${active
                            ? 'text-white scale-105'
                            : 'text-dark-300 hover:text-white'
                            }`}
                          style={active
                            ? { background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }
                            : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }
                          }
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentErr && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg text-sm text-red-300 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span>⚠️</span> {currentErr}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-glass flex-1">← Back</button>
                  <button type="button" onClick={handleNext} className="btn-brand flex-1">Continue →</button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Campus ── */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">University / Institute</label>
                  <input
                    type="text"
                    list="uni-list"
                    value={formData.university}
                    onChange={e => update('university', e.target.value)}
                    className="input"
                    placeholder="Type or select from list..."
                    required
                  />
                  <datalist id="uni-list">
                    {universities?.map(u => (
                      <option key={u.id} value={u.name} />
                    ))}
                    {!universities && [
                      'Makerere University', 'Kyambogo University', 'Uganda Christian University',
                      'Mbarara University of Science and Technology', 'Ndejje University',
                      'Kampala International University', 'Busitema University',
                      'Gulu University', 'Muni University', 'Victoria University',
                    ].map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Course / Programme</label>
                    <input type="text" value={formData.course}
                      onChange={e => update('course', e.target.value)}
                      className="input" placeholder="e.g. Medicine, Law..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Year of Study</label>
                    <select value={formData.yearOfStudy} onChange={e => update('yearOfStudy', e.target.value)} className="input">
                      <option value="">Select year...</option>
                      {[1, 2, 3, 4, 5, 6].map(y => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                      <option value="postgrad">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">
                    Student email <span className="text-dark-500 font-normal">(optional — speeds up verification)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">🎓</span>
                    <input type="email" value={formData.studentEmail}
                      onChange={e => update('studentEmail', e.target.value)}
                      className="input pl-10" placeholder="s123456@student.mak.ac.ug" />
                  </div>
                </div>

                {/* Terms */}
                <div className="p-4 rounded-xl text-sm text-dark-300 mb-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p>By creating an account you agree to our{' '}
                    <a href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</a>.
                    Compliant with Uganda Data Protection & Privacy Act 2019. 🇺🇬
                  </p>
                </div>

                {currentErr && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 mb-2 rounded-xl text-sm font-medium text-red-200 flex items-start gap-2 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span className="text-base mt-0.5">⚠️</span> {currentErr}
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="glass-card-premium flex-1 py-5 font-bold hover:bg-white/10 transition-colors">← Back</button>
                  <button type="submit" disabled={isLoading} className="btn-premium-v2 flex-[2] py-5 text-lg group shadow-brand-500/20">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-dark-400 text-sm"
        >
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Sign in →
          </Link>
        </motion.p>
      </div>
    </div>
  );
};

export default Register;