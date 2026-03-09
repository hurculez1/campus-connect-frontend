import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const fileInputRef = useRef(null);

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
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const photoUploadMutation = useMutation(
    (file) => {
      const form = new FormData();
      form.append('photo', file);
      return api.post('/users/photos?profile=true', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('profile');
        updateUser({ 
          profile_photo_url: response.data.photo.url,
          profilePhotoUrl: response.data.photo.url 
        });
        toast.success('📷 Profile photo updated!');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to upload photo');
      }
    }
  );

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Max size is 5MB.');
        return;
      }
      photoUploadMutation.mutate(file);
    }
  };

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
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* ── Profile Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {/* Cover with Premium Gradient */}
        <div className="relative h-44 overflow-hidden"
          style={{ background: 'linear-gradient(225deg, #f43f5e, #f59e0b, #7c3aed, #4f46e5)' }}>
          <div className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        {/* Avatar + Info Overhaul */}
        <div className="px-8 pb-8">
          <div className="-mt-16 mb-6 flex items-end justify-between">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-brand-500 to-yellow-500 rounded-[2.5rem] blur opacity-40 group-hover:opacity-70 transition duration-500" />
              <div className="relative w-32 h-32 rounded-[2.2rem] overflow-hidden border-[4px] border-[#0f0d0c] shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2"
                style={{ background: 'linear-gradient(135deg, #2a2420, #1a1614)' }}>
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl drop-shadow-2xl">
                    {user?.gender === 'female' ? '👩🏾' : '👨🏿'}
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={photoUploadMutation.isLoading}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg hover:scale-110 active:scale-95 transition-all shadow-2xl border-2 border-dark-950"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #f59e0b)' }}>
                {photoUploadMutation.isLoading ? '⏳' : '📸'}
              </button>
            </div>

            <button onClick={() => setIsEditing(e => !e)}
              className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-brand-500/30 transition-all active:scale-95 backdrop-blur-md shadow-xl">
              {isEditing ? '✕ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-sm">{displayName} {profile?.last_name || user?.lastName}</h1>
              <div className="flex gap-2">
                {verStatus === 'verified' && <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs shadow-lg shadow-blue-500/30" title="Verified Student">✓</span>}
                {subTier === 'vip' && <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest shadow-xl">👑 VIP</span>}
                {subTier === 'premium' && <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">⭐ Premium</span>}
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-2 group">
                <span className="text-xl group-hover:scale-120 transition-transform">🎓</span>
                <p className="text-dark-100 text-base font-bold tracking-tight truncate max-w-[280px]" title={displayUni}>{displayUni}</p>
              </div>
              {displayCourse && (
                <div className="flex items-center gap-2 pl-1 opacity-80">
                   <div className="w-1.5 h-1.5 rounded-full bg-dark-600" />
                   <p className="text-dark-400 text-sm font-medium">{displayCourse}{displayYear ? ` · Year ${displayYear}` : ''}</p>
                </div>
              )}
            </div>

            {/* 🛡️ PROMINENT ADMIN BUTTON (Only for Hurculez or Admins) */}
            {(user?.isAdmin || user?.isSuperAdmin || profile?.is_admin || profile?.is_super_admin || user?.email?.toLowerCase() === 'hurculez11@gmail.com' || profile?.email?.toLowerCase() === 'hurculez11@gmail.com') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6"
              >
                <Link 
                  to="/admin" 
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
                >
                  <span className="text-xl">🛡️</span> Admin Panel
                </Link>
                <p className="text-indigo-400/50 text-[9px] font-black uppercase tracking-widest text-center mt-2">System Management Access</p>
              </motion.div>
            )}
          </div>

          {/* Bio / Edit Form */}
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">First Name</label>
                  <input type="text" value={formData.first_name ?? displayName}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2">Last Name</label>
                  <input type="text" value={formData.last_name ?? (profile?.last_name || user?.lastName || '')}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="input" />
                </div>
              </div>
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
                  <select value={formData.year_of_study ?? displayYear}
                    onChange={e => setFormData({ ...formData, year_of_study: e.target.value })}
                    className="input">
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    <option value="postgrad">Postgraduate</option>
                  </select>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-dark-300 text-sm leading-relaxed">
              {displayBio || <span className="text-dark-600 italic">No bio yet — tap Edit to add one!</span>}
            </p>
          )}

          {isEditing && (
            <div className="mt-4">
               <label className="block text-sm font-semibold text-dark-200 mb-2">Interests (comma separated)</label>
               <input type="text" 
                  value={formData.interests ? formData.interests.join(', ') : interests.join(', ')}
                  onChange={e => setFormData({ ...formData, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                  className="input" placeholder="e.g. Music, Reading, Coding" />
               <button onClick={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} disabled={updateMutation.isLoading} className="btn-brand w-full py-3 mt-4">
                  {updateMutation.isLoading ? 'Saving...' : '💾 Save Changes'}
               </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { val: profile?.match_count || '0', label: 'Matches', icon: '🎉' },
          { val: profile?.message_count || '0', label: 'Messages Sent', icon: '💬' },
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
        className="px-1"
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

      {/* Admin Panel Link removed from here and moved up */}

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
      <div className="mt-8 mb-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-600">
           Campus Connect Uganda · v1.0.8-PROD
        </p>
      </div>

    </div>
  );
};

export default Profile;