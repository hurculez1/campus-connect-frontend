import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      // Assuming a generic forgot-password endpoint for now
      // Even if backend doesn't exist yet, we can simulate the UI state
      // await api.post('/auth/forgot-password', { email });
      
      // Simulate network request for premium feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('success');
      setMessage('If an account exists with this email, a reset link has been sent.');
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    }
  };

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
              />
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-10 lg:p-12 mb-6"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Recover access</h1>
            <p className="text-dark-400 font-medium">We'll send you a password reset link to your email.</p>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl border flex flex-col items-center text-center gap-4"
              style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-2xl">
                ✓
              </div>
              <p className="text-green-300 font-medium">{message}</p>
              <p className="text-dark-400 text-sm mt-2">Don't forget to check your spam folder just in case.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl text-sm text-red-300 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <span className="text-lg">⚠️</span> {message}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2">Registered email address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-12"
                    placeholder="you@university.ac.ug"
                    required
                    autoComplete="email"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="btn-premium-v2 w-full py-5 text-lg flex items-center justify-center gap-3 shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <span className="opacity-60">→</span>
                  </>
                )}
              </button>
            </form>
          )}

        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="text-center"
        >
          <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-dark-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
            <span>←</span> Back to Sign in
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
