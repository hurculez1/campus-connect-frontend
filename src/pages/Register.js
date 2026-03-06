import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from 'react-query';
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

const Register = () => {
  const navigate = useNavigate();
  const { register, error, clearError, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
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
      if (!formData.university) return 'Please select your university.';
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

          {/* Error */}
          {currentErr && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-4 rounded-xl text-sm text-red-300 flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="text-lg">⚠️</span> {currentErr}
            </motion.div>
          )}

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
                    <input type="password" value={formData.password}
                      onChange={e => update('password', e.target.value)}
                      className="input pl-10" placeholder="Min. 8 characters" required />
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
                    <input type="password" value={formData.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      className={`input pl-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'input-error' : ''}`}
                      placeholder="Repeat your password" required />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>

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

                <button type="button" className="btn-glass w-full py-3 text-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </button>
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
                      className="input" placeholder="Aisha" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Last name</label>
                    <input type="text" value={formData.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      className="input" placeholder="Nakato" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Date of birth</label>
                  <input type="date" value={formData.dateOfBirth}
                    onChange={e => update('dateOfBirth', e.target.value)}
                    className="input" required />
                  <p className="text-dark-500 text-xs mt-1">You must be 18 or older 🔞</p>
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
                  <label className="block text-sm font-semibold text-dark-200 mb-2">University</label>
                  <select value={formData.university} onChange={e => update('university', e.target.value)}
                    className="input" required>
                    <option value="">Select your university...</option>
                    {universities?.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                    {/* Fallback list */}
                    {!universities && [
                      'Makerere University', 'Kyambogo University', 'Uganda Christian University',
                      'Mbarara University of Science and Technology', 'Ndejje University',
                      'Kampala International University', 'Busitema University',
                      'Gulu University', 'Muni University', 'Victoria University',
                    ].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
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
                <div className="p-4 rounded-xl text-sm text-dark-300"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p>By creating an account you agree to our{' '}
                    <a href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</a>.
                    Compliant with Uganda Data Protection & Privacy Act 2019. 🇺🇬
                  </p>
                </div>

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