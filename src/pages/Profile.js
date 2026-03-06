import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';

const Profile = () => {
  const { user, updateUser, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: profile, isLoading } = useQuery(
    'profile',
    () => api.get('/users/profile').then(res => res.data.user),
    { retry: false }
  );

  const updateMutation = useMutation(
    (data) => api.put('/users/profile', data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('profile');
        updateUser(response.data);
        setIsEditing(false);
        toast.success('✅ Profile updated!');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-14 h-14 rounded-full animate-spin"
          style={{ border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e' }} />
      </div>
    );
  }

  const interests = (() => {
    try { return JSON.parse(profile?.interests || '[]'); } catch { return []; }
  })();

  const displayName = profile?.first_name || user?.firstName || 'You';
  const displayUni = profile?.university || user?.university || '';
  const displayCourse = profile?.course || user?.course || '';
  const displayYear = profile?.year_of_study || user?.yearOfStudy || '';
  const displayBio = profile?.bio || user?.bio || '';
  const subTier = profile?.subscription_tier || user?.subscriptionTier || 'free';
  const verStatus = profile?.verification_status || user?.verificationStatus || 'pending';

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Profile Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {/* Cover */}
        <div className="relative h-36 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b, #7c3aed)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 60%)' }} />
          {/* Subscription badge top-right */}
          <div className="absolute top-4 right-4">
            {subTier === 'vip' && <span className="badge-vip">👑 VIP</span>}
            {subTier === 'premium' && <span className="badge-premium">⭐ Premium</span>}
            {subTier === 'free' && <span className="badge-free">Free</span>}
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ border: '3px solid rgba(244,63,94,0.6)', background: 'linear-gradient(135deg, #f43f5e20, #f59e0b20)' }}>
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {user?.gender === 'female' ? '👩🏾' : '👨🏿'}
                  </div>
                )}
              </div>
              <button
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}
                title="Change photo"
              >
                📷
              </button>
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{displayName} {profile?.last_name || user?.lastName}</h1>
                {verStatus === 'verified' && (
                  <span className="text-blue-400 text-sm" title="Verified Student">✓</span>
                )}
              </div>
              <p className="text-dark-400 text-sm">🎓 {displayUni}</p>
              {displayCourse && (
                <p className="text-dark-500 text-xs mt-0.5">{displayCourse}{displayYear ? ` · Year ${displayYear}` : ''}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(e => !e)}
              className="btn-glass text-sm px-4 py-2 self-end"
            >
              {isEditing ? '✕ Cancel' : '✏️ Edit'}
            </button>
          </div>

          {/* Bio / Edit Form */}
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2">Bio</label>
                <textarea
                  value={formData.bio ?? displayBio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="input resize-none" rows={3} maxLength={500}
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Course</label>
                  <input type="text" value={formData.course ?? displayCourse}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                    className="input" placeholder="e.g. Medicine" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Year of Study</label>
                  <select value={formData.yearOfStudy ?? displayYear}
                    onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="input">
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    <option value="postgrad">Postgraduate</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={updateMutation.isLoading} className="btn-brand w-full py-3">
                {updateMutation.isLoading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          ) : (
            <p className="text-dark-300 text-sm leading-relaxed">
              {displayBio || <span className="text-dark-600 italic">No bio yet — tap Edit to add one!</span>}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { val: '127', label: 'Profile views', icon: '👀' },
          { val: '34', label: 'Likes given', icon: '❤️' },
          { val: '3', label: 'Matches', icon: '🎉' },
        ].map(({ val, label, icon }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-black text-white">{val}</div>
            <div className="text-dark-500 text-xs">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Interests ── */}
      {interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-5"
        >
          <h2 className="text-white font-bold mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(244,63,94,0.3)' }}>
                {interest}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Verification Status ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h2 className="text-white font-bold mb-3">Verification</h2>
        {verStatus === 'verified' ? (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-blue-300 font-semibold">Verified Student</p>
              <p className="text-dark-400 text-sm">Your blue tick is showing on your profile</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏳</span>
              <div>
                <p className="text-gold-400 font-semibold">Pending Verification</p>
                <p className="text-dark-400 text-sm">Get your blue tick to unlock more matches</p>
              </div>
            </div>
            <a href="/verification" className="btn-brand text-xs px-4 py-2">Verify</a>
          </div>
        )}
      </motion.div>

      {/* ── Subscription ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-5"
        style={subTier === 'premium' ? { border: '1px solid rgba(244,63,94,0.4)' } : subTier === 'vip' ? { border: '1px solid rgba(245,158,11,0.4)' } : {}}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">Subscription</h2>
            <p className="text-dark-400 text-sm capitalize">
              {subTier === 'free' ? 'Free Plan · 50 swipes/day' :
                subTier === 'premium' ? '⭐ Premium · Unlimited swipes' :
                  '👑 VIP · All features unlocked'}
            </p>
          </div>
          {subTier === 'free' && (
            <a href="/subscription" className="btn-brand text-sm px-4 py-2">Upgrade ✨</a>
          )}
          {subTier !== 'free' && (
            <span className={subTier === 'vip' ? 'badge-vip' : 'badge-premium'}>
              {subTier === 'vip' ? '👑 VIP' : '⭐ Premium'}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Settings & Logout ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card divide-y"
        style={{ '--tw-divide-opacity': 1 }}
      >
        {[
          { icon: '⚙️', label: 'Account Settings', href: '/settings' },
          { icon: '🔒', label: 'Privacy Settings', href: '/settings' },
          { icon: '🎓', label: 'University Verification', href: '/verification' },
          { icon: '💳', label: 'Subscription & Billing', href: '/subscription' },
        ].map(({ icon, label, href }) => (
          <a key={label} href={href}
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-dark-200 font-medium text-sm flex-1">{label}</span>
            <span className="text-dark-600">›</span>
          </a>
        ))}
        <button
          onClick={() => { logout(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/10 transition-colors text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="text-red-400 font-medium text-sm">Sign Out</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Profile;