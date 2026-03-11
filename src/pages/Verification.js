import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Verification = () => {
  const queryClient = useQueryClient();
  const [studentEmail, setStudentEmail] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const { data: profile } = useQuery('profile',
    () => api.get('/users/profile').then(res => res.data.user)
  );

  const emailMutation = useMutation(
    (email) => api.post('/universities/verify-email', { studentEmail: email }),
    {
      onSuccess: () => {
        setVerificationSent(true);
        toast.success('📧 Verification email sent! Check your inbox.');
      },
      onError: () => toast.error('Failed to send email. Please try again.'),
    }
  );

  const idUploadMutation = useMutation(
    (file) => {
      const formData = new FormData();
      formData.append('studentId', file);
      return api.post('/universities/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    {
      onSuccess: (res) => {
        if (res.data.verified) {
          toast.success('🎉 Automatically verified!');
          queryClient.invalidateQueries('profile');
        } else {
          toast.success('📋 Student ID submitted for review (1–2 hours)');
        }
      },
      onError: () => toast.error('Upload failed. Please try again.'),
    }
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setUploadedFile(files[0]);
        idUploadMutation.mutate(files[0]);
      }
    },
  });

  const isVerified = profile?.verification_status === 'verified';
  const isPending = profile?.verification_status === 'pending';

  if (isVerified) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
            style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>
            ✅
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">You're Verified! 🎓</h2>
          <p className="text-dark-400 mb-6">
            Your student status has been confirmed. You now have a blue tick on your profile!
          </p>
          <div className="badge-verified text-sm px-4 py-2 mx-auto inline-flex mb-8">
            ✓ Verified Student
          </div>
          <br />
          <Link to="/discover" className="btn-brand px-8 py-3">
            Start Swiping →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          ✅ Verify Your Identity
        </h1>
        <p className="text-dark-400">
          Get your blue tick and unlock full access. Verification protects everyone on campus.
        </p>
      </div>

      {/* Pending notice */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6 flex items-center gap-3"
          style={{ border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-white font-semibold text-sm">Review in progress</p>
            <p className="text-dark-400 text-xs">Our team is reviewing your submission (usually 1–2 hours)</p>
          </div>
        </motion.div>
      )}

      {/* Method 1: Email */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-4"
        style={{ border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(59,130,246,0.15)' }}>
            ✉️
          </div>
          <div>
            <h3 className="text-white font-bold">Student Email Verification</h3>
            <p className="text-dark-500 text-xs">⚡ Fastest — instant verification</p>
          </div>
          <span className="badge-success ml-auto text-xs">Recommended</span>
        </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl text-sm flex items-start gap-3"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <span className="text-xl">📧</span>
              <div>
                <p className="text-green-400 font-semibold">Check your inbox!</p>
                <p className="text-dark-400 mt-1">A verification link was sent to <strong className="text-white">{studentEmail}</strong></p>
                <button onClick={() => setVerificationSent(false)}
                  className="text-brand-400 text-xs mt-2 hover:underline">
                  Resend email
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => { e.preventDefault(); emailMutation.mutate(studentEmail); }}
            >
              <div className="relative mb-3">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400">🎓</span>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="s123456@student.mak.ac.ug"
                  className="input pl-10"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={emailMutation.isLoading}
                className="btn-brand w-full py-3 text-sm"
              >
                {emailMutation.isLoading ? '⏳ Sending...' : '📧 Send Verification Email'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-dark-600 text-xs font-medium uppercase">or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Method 2: ID Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
        style={{ border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(139,92,246,0.15)' }}>
            🪪
          </div>
          <div>
            <h3 className="text-white font-bold">Student ID Card</h3>
            <p className="text-dark-500 text-xs">🤖 AI-assisted review (1–2 hours)</p>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
              ? 'border-brand-500 bg-brand-500/10'
              : uploadedFile
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5'
            }`}
        >
          <input {...getInputProps()} />
          {idUploadMutation.isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-spin"
                style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
              <p className="text-dark-300 text-sm">Uploading & analyzing...</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">✅</div>
              <p className="text-green-400 font-semibold text-sm">{uploadedFile.name}</p>
              <p className="text-dark-500 text-xs">Submitted for review</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl mb-1">📷</div>
              <p className="text-dark-200 font-semibold text-sm">
                {isDragActive ? 'Drop your ID here!' : 'Drag & drop your student ID'}
              </p>
              <p className="text-dark-500 text-xs">or click to browse · JPG, PNG, PDF</p>
            </div>
          )}
        </div>

        <p className="text-dark-600 text-xs mt-3 text-center">
          🔒 Your ID is processed securely and never shared or stored long-term
        </p>
      </motion.div>

      {/* FAQ */}
      <div className="mt-8 space-y-3">
        {[
          { q: 'Why do I need to verify?', a: 'Verification ensures only real campus students can join, making the community safer for everyone.' },
          { q: 'How long does ID review take?', a: 'AI auto-verification is instant. Manual review by our team takes 1–2 hours during business hours.' },
          { q: 'Is my ID safe?', a: 'Your ID is encrypted and only used for verification. It is deleted after review per GDPR and Uganda Data Protection Act 2019.' },
        ].map(({ q, a }, i) => (
          <details key={i} className="glass-card p-4 cursor-pointer group">
            <summary className="text-white font-semibold text-sm list-none flex items-center justify-between">
              {q}
              <span className="text-dark-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-dark-400 text-sm mt-3 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default Verification;
