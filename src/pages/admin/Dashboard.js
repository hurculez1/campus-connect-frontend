import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const tierBadge = (tier) => {
  if (tier === 'vip') return <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">👑 VIP</span>;
  if (tier === 'premium') return <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ Premium</span>;
  return <span style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">🆓 Free</span>;
};

const statusBadge = (user) => {
  if (user.is_super_admin) return <span style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">👑 Super Admin</span>;
  if (user.is_admin) return <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">🛡 Admin</span>;
  if (user.is_banned) return <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">🚫 Banned</span>;
  if (user.verification_status === 'verified') return <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">✓ Verified</span>;
  return <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }} className="text-xs font-bold px-2.5 py-0.5 rounded-full">⏳ Pending</span>;
};

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/content', label: 'Content', icon: '📝' },
    { path: '/admin/verifications', label: 'Verifications', icon: '✅' },
    { path: '/admin/reports', label: 'Reports', icon: '⚠️' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/activity', label: 'Activity Log', icon: '🕐' },
    { path: '/admin/system', label: 'System', icon: '⚙️' },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300"
      style={{ width: collapsed ? 72 : 260, background: 'rgba(10, 9, 8, 0.98)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-sm leading-tight">CampusConnect</div>
            <div style={{ background: 'linear-gradient(135deg,#f43f5e,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="text-[10px] font-black uppercase tracking-widest">Admin Panel</div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} className="text-dark-500 hover:text-white transition-colors ml-auto text-xs">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-xs">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px]" style={{ color: '#f43f5e' }}>{user?.isSuperAdmin ? '👑 Super Admin' : '🛡 Admin'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.exact ? location.pathname === '/admin' || location.pathname === '/admin/' : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
              style={isActive ? { background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' } : { color: '#6b7280' }}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-dark-400 hover:text-white hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <span>🌐</span>{!collapsed && <span>View Site</span>}
        </Link>
        <button onClick={() => { logout(); navigate('/'); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <span>🚪</span>{!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ title, value, sub, icon, color, index }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
    className="rounded-2xl p-5 relative overflow-hidden"
    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25` }}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-8 translate-x-8" style={{ background: color }} />
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: `${color}20` }}>{icon}</div>
    <div className="text-2xl font-black text-white mb-0.5">{value ?? '—'}</div>
    <div className="text-sm text-dark-400 font-medium">{title}</div>
    {sub && <div className="text-xs text-dark-600 mt-0.5">{sub}</div>}
  </motion.div>
);

/* ─── Dashboard Home ─────────────────────────────────────────────────────── */
const DashboardHome = () => {
  const { data: stats, isLoading } = useQuery('adminStats',
    () => api.get('/admin/dashboard').then(r => r.data),
    { refetchInterval: 30000 }
  );

  const cards = [
    { title: 'Total Users', value: Number(stats?.users?.total_users || 0).toLocaleString(), sub: `+${stats?.users?.new_today || 0} today`, icon: '👥', color: '#3b82f6', index: 0 },
    { title: 'Active (24h)', value: Number(stats?.users?.active_24h || 0).toLocaleString(), sub: 'recently active', icon: '🟢', color: '#22c55e', index: 1 },
    { title: 'Paid Users', value: (Number(stats?.users?.premium_users || 0) + Number(stats?.users?.vip_users || 0)).toLocaleString(), sub: `${stats?.users?.vip_users || 0} VIP · ${stats?.users?.premium_users || 0} Premium`, icon: '⭐', color: '#f59e0b', index: 2 },
    { title: 'Banned Users', value: Number(stats?.users?.banned_users || 0).toLocaleString(), sub: 'accounts suspended', icon: '🚫', color: '#ef4444', index: 3 },
    { title: 'Total Matches', value: Number(stats?.matches?.total_matches || 0).toLocaleString(), sub: `+${stats?.matches?.matches_today || 0} today`, icon: '❤️', color: '#ec4899', index: 4 },
    { title: 'Total Posts', value: Number(stats?.pulse?.total_posts || 0).toLocaleString(), sub: `+${stats?.pulse?.posts_today || 0} today`, icon: '✍️', color: '#8b5cf6', index: 5 },
    { title: 'Pending Verifications', value: stats?.pendingVerifications ?? 0, sub: 'awaiting review', icon: '⏳', color: '#f59e0b', index: 6 },
    { title: 'Total Revenue', value: stats?.revenue?.total_revenue ? `$${Number(stats.revenue.total_revenue).toFixed(2)}` : '$0.00', sub: `$${Number(stats?.revenue?.revenue_today || 0).toFixed(2)} today`, icon: '💰', color: '#22c55e', index: 7 },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Campus Connect Uganda · Real-time overview</p>
        </div>
        <div className="text-xs text-dark-600 bg-white/5 px-3 py-1.5 rounded-full">
          🕒 Auto-refreshes every 30s
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => <StatCard key={c.title} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">✅ Pending Verifications</h3>
            <Link to="/admin/verifications" className="text-brand-400 text-xs hover:text-brand-300">View all →</Link>
          </div>
          <div className="text-5xl font-black text-white mb-1">{stats?.pendingVerifications ?? 0}</div>
          <p className="text-dark-400 text-sm mb-4">student IDs awaiting review</p>
          <Link to="/admin/verifications" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#f59e0b)' }}>
            Review Now →
          </Link>
        </div>

        {/* Recent Reports */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">⚠️ Recent Reports</h3>
            <Link to="/admin/reports" className="text-brand-400 text-xs hover:text-brand-300">View all →</Link>
          </div>
          {stats?.recentReports?.length ? (
            <div className="space-y-3">
              {stats.recentReports.slice(0, 4).map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                      {r.report_type || 'report'}
                    </span>
                    <span className="text-dark-400">{r.reporter_name}</span>
                  </div>
                  <span className="text-dark-600 text-xs">{format(new Date(r.created_at), 'MMM d')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">🏆</span>
              <p className="text-dark-400 text-sm">No pending reports!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Users Management ───────────────────────────────────────────────────── */
const Users = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading } = useQuery(['adminUsers', search, statusFilter, tierFilter],
    () => api.get('/admin/users', { params: { search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined, tier: tierFilter !== 'all' ? tierFilter : undefined } }).then(r => r.data)
  );

  const banM = useMutation(
    ({ id, reason }) => api.post(`/admin/users/${id}/ban`, { reason }),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); toast.success('User banned'); } }
  );
  const unbanM = useMutation(
    (id) => api.post(`/admin/users/${id}/unban`),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); toast.success('User unbanned'); } }
  );
  const promoteM = useMutation(
    ({ id, superAdmin }) => api.post(`/admin/users/${id}/promote`, { superAdmin }),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); toast.success('Admin privileges granted!'); } }
  );
  const demoteM = useMutation(
    (id) => api.post(`/admin/users/${id}/demote`),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); toast.success('Admin privileges removed'); } }
  );
  const tierM = useMutation(
    ({ id, tier }) => api.put(`/admin/users/${id}/subscription`, { tier }),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); toast.success('Subscription updated'); } }
  );
  const deleteM = useMutation(
    (id) => api.delete(`/admin/users/${id}`),
    { onSuccess: () => { qc.invalidateQueries('adminUsers'); setSelectedUser(null); toast.success('User deleted'); } }
  );

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Users <span className="text-dark-500 text-lg">({data?.pagination?.total || 0})</span></h1>
          <p className="text-dark-400 text-sm">Full user management — ban, promote, change plans</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="text" placeholder="🔍 Search name, email, uni..." value={search}
            onChange={e => setSearch(e.target.value)} className="input text-sm py-2 px-4 w-56" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input text-sm py-2 px-3">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="input text-sm py-2 px-3">
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {isLoading ? (
          <div className="p-12 text-center text-dark-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['User', 'University', 'Status', 'Plan', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          {u.profile_photo_url ? <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center text-sm bg-white/5">👤</div>}
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold">{u.first_name} {u.last_name}</div>
                          <div className="text-dark-500 text-xs">{u.email}</div>
                          <div className="text-dark-600 text-xs">{u.match_count || 0} matches</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-dark-300 max-w-[140px] truncate">{u.university || '—'}</td>
                    <td className="px-5 py-3.5">{statusBadge(u)}</td>
                    <td className="px-5 py-3.5">{tierBadge(u.subscription_tier)}</td>
                    <td className="px-5 py-3.5 text-xs text-dark-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => setSelectedUser(u)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all text-white/70 hover:text-white hover:bg-white/10">
                          Manage
                        </button>
                        {!u.is_super_admin && (
                          u.is_banned
                            ? <button onClick={() => unbanM.mutate(u.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-green-400 hover:bg-green-500/10 transition-all">Unban</button>
                            : <button onClick={() => { const r = prompt(`Ban reason for ${u.first_name}?`); if (r) banM.mutate({ id: u.id, reason: r }); }} className="text-xs px-3 py-1.5 rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-all">Ban</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-dark-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User detail modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md rounded-3xl p-6 space-y-5" onClick={e => e.stopPropagation()}
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
                  {selectedUser.profile_photo_url ? <img src={selectedUser.profile_photo_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-xl bg-white/5">👤</div>}
                </div>
                <div>
                  <div className="text-white font-black">{selectedUser.first_name} {selectedUser.last_name}</div>
                  <div className="text-dark-400 text-sm">{selectedUser.email}</div>
                  <div className="flex gap-2 mt-1">{statusBadge(selectedUser)} {tierBadge(selectedUser.subscription_tier)}</div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="ml-auto text-dark-500 hover:text-white text-xl">✕</button>
              </div>

              {/* Subscription change */}
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Change Subscription</label>
                <div className="grid grid-cols-3 gap-2">
                  {['free', 'premium', 'vip'].map(t => (
                    <button key={t} onClick={() => tierM.mutate({ id: selectedUser.id, tier: t })}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${selectedUser.subscription_tier === t ? 'border-brand-500 text-brand-400 bg-brand-500/10' : 'border-white/10 text-dark-400 hover:border-white/20'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin promotion */}
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Admin Privileges</label>
                <div className="grid grid-cols-2 gap-2">
                  {!selectedUser.is_admin && !selectedUser.is_super_admin ? (
                    <>
                      <button onClick={() => promoteM.mutate({ id: selectedUser.id, superAdmin: false })}
                        className="py-2 rounded-xl text-xs font-bold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all">🛡 Make Admin</button>
                      <button onClick={() => promoteM.mutate({ id: selectedUser.id, superAdmin: true })}
                        className="py-2 rounded-xl text-xs font-bold border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 transition-all">👑 Super Admin</button>
                    </>
                  ) : (
                    <button onClick={() => demoteM.mutate(selectedUser.id)}
                      className="py-2 rounded-xl text-xs font-bold col-span-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">Remove Admin Privileges</button>
                  )}
                </div>
              </div>

              {/* Danger zone */}
              <div className="pt-2" style={{ borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                <button onClick={() => { if (window.confirm(`Permanently delete ${selectedUser.first_name}? This cannot be undone.`)) deleteM.mutate(selectedUser.id); }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20">
                  🗑 Delete Account Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Content Moderation ─────────────────────────────────────────────────── */
const Content = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery('adminPulse', () => api.get('/admin/pulse').then(r => r.data));
  const deleteM = useMutation(
    (id) => api.delete(`/admin/pulse/${id}`),
    { onSuccess: () => { qc.invalidateQueries('adminPulse'); toast.success('Post removed'); } }
  );

  const posts = data?.posts || [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Content Moderation</h1>
        <p className="text-dark-400 text-sm">Review and remove Pulse posts</p>
      </div>
      {isLoading ? <div className="text-center py-12 text-dark-400">Loading...</div> :
        posts.length === 0 ? <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-5xl mb-3">✍️</div>
          <p className="text-dark-400">No posts yet</p>
        </div> :
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {post.profile_photo_url && <img src={post.profile_photo_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-bold">{post.first_name} {post.last_name}</span>
                  <span className="text-dark-600 text-xs">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
                <p className="text-dark-300 text-sm leading-relaxed">{post.content}</p>
                {post.media_url && <img src={post.media_url} alt="" className="mt-2 rounded-xl max-h-40 object-cover" />}
              </div>
              <button onClick={() => { if (window.confirm('Remove this post?')) deleteM.mutate(post.id); }}
                className="flex-shrink-0 text-xs text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all border border-red-500/20">
                Remove
              </button>
            </div>
          ))}
        </div>
      }
    </div>
  );
};

/* ─── Verifications ──────────────────────────────────────────────────────── */
const Verifications = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery('adminVerifications', () => api.get('/admin/verifications').then(r => r.data.verifications));
  const reviewM = useMutation(
    ({ id, status, notes }) => api.post(`/admin/verifications/${id}/review`, { status, notes }),
    { onSuccess: (_, vars) => { qc.invalidateQueries('adminVerifications'); toast.success(`Verification ${vars.status}`); } }
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Pending Verifications</h1>
        <p className="text-dark-400 text-sm">Review student ID submissions</p>
      </div>
      {isLoading ? <div className="text-center py-12 text-dark-400">Loading...</div> :
        !data?.length ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold">All caught up!</p>
            <p className="text-dark-400 text-sm">No pending verifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(v => (
              <div key={v.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {v.profile_photo_url && <img src={v.profile_photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />}
                    <div>
                      <div className="text-white font-bold">{v.first_name} {v.last_name}</div>
                      <div className="text-dark-400 text-sm">{v.university_name}</div>
                      <div className="text-dark-600 text-xs">{v.student_email}</div>
                      <div className="text-dark-600 text-xs">{formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {v.student_id_image_url && <a href={v.student_id_image_url} target="_blank" rel="noreferrer" className="text-xs px-4 py-2 rounded-xl font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all">👁 View ID</a>}
                    <button onClick={() => reviewM.mutate({ id: v.id, status: 'verified', notes: 'Approved by admin' })}
                      className="text-xs px-4 py-2 rounded-xl font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">✓ Approve</button>
                    <button onClick={() => reviewM.mutate({ id: v.id, status: 'rejected', notes: prompt('Rejection reason:') || 'Rejected' })}
                      className="text-xs px-4 py-2 rounded-xl font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">✕ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

/* ─── Reports ────────────────────────────────────────────────────────────── */
const Reports = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery('adminReports', () => api.get('/admin/reports').then(r => r.data.reports));
  const resolveM = useMutation(
    ({ id, resolution, action }) => api.post(`/admin/reports/${id}/resolve`, { resolution, action }),
    { onSuccess: () => { qc.invalidateQueries('adminReports'); toast.success('Report resolved'); } }
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">User Reports</h1>
        <p className="text-dark-400 text-sm">Review reported content and take action</p>
      </div>
      {isLoading ? <div className="text-center py-12 text-dark-400">Loading...</div> :
        !data?.length ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-white font-bold">All clear!</p>
            <p className="text-dark-400 text-sm">No pending reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(r => (
              <div key={r.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {r.report_type?.replace('_', ' ') || 'Report'}
                      </span>
                      <span className="text-dark-600 text-xs">{format(new Date(r.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <p className="text-sm text-dark-300">
                      <span className="text-dark-500">Reporter:</span> <span className="text-white font-medium">{r.reporter_name}</span>
                      {' · '}
                      <span className="text-dark-500">Reported:</span> <span className="text-white font-medium">{r.reported_name}</span>
                    </p>
                    {r.description && <p className="text-dark-400 text-sm mt-1">{r.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resolveM.mutate({ id: r.id, resolution: 'Reviewed and dismissed', action: 'dismiss' })}
                      className="text-xs px-4 py-2 rounded-xl font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">✓ Dismiss</button>
                    <button onClick={() => resolveM.mutate({ id: r.id, resolution: 'User banned for violation', action: 'ban' })}
                      className="text-xs px-4 py-2 rounded-xl font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">🚫 Ban User</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

/* ─── Analytics ──────────────────────────────────────────────────────────── */
const Analytics = () => {
  const { data, isLoading } = useQuery('adminAnalytics', () => api.get('/admin/analytics').then(r => r.data));
  const topUnis = data?.topUniversities || [];
  const signupMax = Math.max(...(data?.signupTrend || []).map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-dark-400 text-sm">30-day platform performance metrics</p>
      </div>
      {isLoading ? <div className="text-center py-12 text-dark-400">Loading...</div> : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Signups chart */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-white font-bold mb-4">New Signups — Last 30 Days</h3>
            {data?.signupTrend?.length ? (
              <div className="flex items-end gap-1 h-32">
                {data.signupTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.count}
                    </div>
                    <div className="w-full rounded-t transition-all" style={{ height: `${(d.count / signupMax) * 100}%`, minHeight: 2, background: 'linear-gradient(180deg, #f43f5e, #f59e0b)' }} />
                  </div>
                ))}
              </div>
            ) : <p className="text-dark-500 text-sm">No data yet</p>}
          </div>

          {/* Top Universities */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-white font-bold mb-4">Top Universities</h3>
            <div className="space-y-3">
              {topUnis.slice(0, 8).map((u, i) => {
                const pct = Math.round((u.count / (topUnis[0]?.count || 1)) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-dark-500 w-5">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white font-medium truncate max-w-[180px]">{u.university}</span>
                        <span className="text-dark-400">{u.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f43f5e, #f59e0b)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {topUnis.length === 0 && <p className="text-dark-500 text-sm">No university data yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Activity Log ───────────────────────────────────────────────────────── */
const ActivityLog = () => {
  const { data, isLoading } = useQuery('adminActivity', () => api.get('/admin/activity-log').then(r => r.data));
  const logs = data?.logs || [];
  const actionColors = { ban_user: '#ef4444', unban_user: '#22c55e', promote_admin: '#8b5cf6', demote_admin: '#f59e0b' };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Activity Log</h1>
        <p className="text-dark-400 text-sm">All admin actions — last 100 entries</p>
      </div>
      {isLoading ? <div className="text-center py-12 text-dark-400">Loading...</div> :
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {logs.length === 0 ? (
            <div className="p-12 text-center text-dark-400">No activity yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {logs.map((log, i) => (
                <div key={log.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: actionColors[log.action] || '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-medium">{log.action?.replace(/_/g, ' ')}</span>
                    {log.admin_name && <span className="text-dark-500 text-xs ml-2">by {log.admin_name}</span>}
                  </div>
                  <span className="text-dark-600 text-xs flex-shrink-0">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    </div>
  );
};

/* ─── System Info ────────────────────────────────────────────────────────── */
const System = () => {
  const { data, isLoading } = useQuery('adminSystem', () => api.get('/admin/system').then(r => r.data));
  const qc = useQueryClient();
  const [ann, setAnn] = useState({ title: '', message: '', targetTier: 'all' });
  const annM = useMutation(
    (payload) => api.post('/admin/announce', payload),
    { onSuccess: () => { toast.success('Announcement sent!'); setAnn({ title: '', message: '', targetTier: 'all' }); } }
  );
  const fmtUptime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h}h ${m}m`; };
  const fmtBytes = (b) => b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">System</h1>
        <p className="text-dark-400 text-sm">Server health and announcements</p>
      </div>

      {/* System info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Node Version', value: data?.nodeVersion || '—', icon: '🟢' },
          { label: 'Server Uptime', value: data ? fmtUptime(data.uptime) : '—', icon: '⏱' },
          { label: 'Memory Used', value: data ? fmtBytes(data.memoryUsage?.heapUsed) : '—', icon: '💾' },
          { label: 'DB Size', value: data ? fmtBytes(Number(data.dbSize)) : '—', icon: '🗄️' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-white font-bold text-lg">{s.value}</div>
            <div className="text-dark-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Announcement */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-white font-bold mb-4">📢 Send Announcement</h3>
        <div className="space-y-3">
          <input type="text" placeholder="Announcement title..." value={ann.title} onChange={e => setAnn(a => ({ ...a, title: e.target.value }))} className="input w-full text-sm py-2.5" />
          <textarea placeholder="Message content..." value={ann.message} onChange={e => setAnn(a => ({ ...a, message: e.target.value }))} className="input w-full text-sm py-2.5 h-24 resize-none" />
          <div className="flex items-center gap-3">
            <select value={ann.targetTier} onChange={e => setAnn(a => ({ ...a, targetTier: e.target.value }))} className="input text-sm py-2 px-3">
              <option value="all">All Users</option>
              <option value="free">Free only</option>
              <option value="premium">Premium only</option>
              <option value="vip">VIP only</option>
            </select>
            <button onClick={() => annM.mutate(ann)} disabled={!ann.title || !ann.message || annM.isLoading}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#f59e0b)' }}>
              {annM.isLoading ? 'Sending...' : 'Send →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Admin Shell ────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen flex" style={{ background: '#0a0908', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 overflow-y-auto p-8" style={{ marginLeft: collapsed ? 72 : 260, transition: 'margin 0.3s' }}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/users" element={<Users />} />
          <Route path="/content" element={<Content />} />
          <Route path="/verifications" element={<Verifications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/system" element={<System />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;