import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/verifications', label: 'Verifications', icon: '✅' },
    { path: '/admin/reports', label: 'Reports', icon: '⚠️' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? 72 : 240,
        background: 'rgba(15, 13, 12, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img src="/logo.png" alt="Campus Connect logo" className="w-9 h-9 object-contain flex-shrink-0" />
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">Campus Connect</div>
            <div className="text-dark-500 text-[10px] font-semibold uppercase tracking-wider">Admin Panel</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-dark-500 hover:text-white transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-link ${isActive ? 'admin-nav-link-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to="/"
          className={`admin-nav-link mb-1 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'View App' : undefined}
        >
          <span>🌐</span>
          {!collapsed && <span>View App</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`admin-nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, icon, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="stat-card"
    style={{ border: `1px solid ${color}30` }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: `${color}20` }}>
        {icon}
      </div>
      {change && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'
          }`}
          style={{ background: change.startsWith('+') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {change}
        </span>
      )}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-dark-400 text-sm">{title}</div>
  </motion.div>
);

// ─── Dashboard Overview ───────────────────────────────────────────────────────
const DashboardHome = () => {
  const { data: stats } = useQuery('adminStats',
    () => api.get('/admin/dashboard').then(res => res.data),
    { refetchInterval: 30000 }
  );

  const statCards = [
    { title: 'Total Users', value: stats?.users?.total_users?.toLocaleString() || '0', change: '+12%', icon: '👥', color: '#3b82f6' },
    { title: 'New Today', value: stats?.users?.new_today || '0', change: '+5', icon: '🆕', color: '#22c55e' },
    { title: 'Active (24h)', value: stats?.users?.active_24h || '0', icon: '🟢', color: '#f43f5e' },
    { title: 'Premium Users', value: (stats?.users?.premium_users || 0) + (stats?.users?.vip_users || 0), icon: '⭐', color: '#f59e0b' },
    { title: 'Total Matches', value: stats?.matches?.total_matches?.toLocaleString() || '0', icon: '❤️', color: '#ec4899' },
    { title: 'Messages Sent', value: stats?.messages?.total || '0', icon: '💬', color: '#8b5cf6' },
    { title: 'Pending Reviews', value: stats?.pendingVerifications || '0', icon: '⏳', color: '#f59e0b' },
    { title: 'Revenue (UGX)', value: stats?.revenue?.total_revenue ? `${(stats.revenue.total_revenue / 1000).toFixed(0)}K` : '0', icon: '💰', color: '#22c55e' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
        <p className="text-dark-400 text-sm">Campus Connect Uganda · Admin Panel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => <StatCard key={i} {...card} index={i} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold flex items-center gap-2">
              ✅ Pending Verifications
            </h3>
            <Link to="/admin/verifications" className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="text-5xl font-black text-white mb-2">{stats?.pendingVerifications || 0}</div>
          <p className="text-dark-400 text-sm">student IDs awaiting review</p>
          <Link to="/admin/verifications" className="btn-brand mt-4 text-sm px-5 py-2 inline-flex">
            Review Now
          </Link>
        </div>

        {/* Recent Reports */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold flex items-center gap-2">
              ⚠️ Recent Reports
            </h3>
            <Link to="/admin/reports" className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          {stats?.recentReports?.length ? (
            <div className="space-y-3">
              {stats.recentReports.slice(0, 4).map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between text-sm py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className="badge-danger">{r.report_type}</span>
                    <span className="text-dark-400">{r.reporter_name}</span>
                  </div>
                  <span className="text-dark-600 text-xs">
                    {format(new Date(r.created_at), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">🏆</span>
              <p className="text-dark-400 text-sm">No pending reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Users Table ──────────────────────────────────────────────────────────────
const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: usersData, isLoading } = useQuery('adminUsers',
    () => api.get('/admin/users').then(res => res.data)
  );

  const banMutation = useMutation(
    (userId) => api.post(`/admin/users/${userId}/ban`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('User banned successfully');
      },
    }
  );

  const users = usersData?.users || [];
  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.first_name} ${u.last_name} ${u.email} ${u.university}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.verification_status === filter || (filter === 'banned' && u.is_banned);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users ({users.length})</h1>
          <p className="text-dark-400 text-sm">Manage registered students</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input text-sm py-2 px-4 w-48"
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input text-sm py-2 px-3 w-36">
            <option value="all">All Users</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['User', 'University', 'Status', 'Tier', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr key={user.id}
                    className="group hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm"
                              style={{ background: 'rgba(255,255,255,0.1)' }}>
                              👤
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-dark-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-dark-300 max-w-[140px] truncate">{user.university}</td>
                    <td className="px-5 py-4">
                      <span className={user.is_banned ? 'badge-danger' :
                        user.verification_status === 'verified' ? 'badge-success' : 'badge-warning'}>
                        {user.is_banned ? '🚫 Banned' :
                          user.verification_status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={
                        user.subscription_tier === 'vip' ? 'badge-vip' :
                          user.subscription_tier === 'premium' ? 'badge-premium' : 'badge-free'
                      }>
                        {user.subscription_tier === 'vip' ? '👑 VIP' :
                          user.subscription_tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-dark-400">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {!user.is_banned ? (
                          <button
                            onClick={() => { if (window.confirm(`Ban ${user.first_name}?`)) banMutation.mutate(user.id); }}
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            Ban
                          </button>
                        ) : (
                          <span className="text-xs text-dark-500">Banned</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-dark-500">
                      No users found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Verifications ────────────────────────────────────────────────────────────
const Verifications = () => {
  const queryClient = useQueryClient();
  const { data: verifications, isLoading } = useQuery('adminVerifications',
    () => api.get('/admin/verifications').then(res => res.data.verifications)
  );

  const reviewMutation = useMutation(
    ({ id, action }) => api.post(`/admin/verifications/${id}/review`, { action }),
    {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries('adminVerifications');
        toast.success(`Verification ${vars.action}d`);
      },
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pending Verifications</h1>
        <p className="text-dark-400 text-sm">Review student ID submissions</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-dark-400">Loading...</div>
      ) : verifications?.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-white font-bold text-lg mb-2">All caught up!</h3>
          <p className="text-dark-400">No pending verifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications?.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <img
                    src={v.profile_photo_url || ''}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover"
                    style={{ border: '2px solid rgba(255,255,255,0.1)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h4 className="text-white font-bold text-base">{v.first_name} {v.last_name}</h4>
                    <p className="text-dark-400 text-sm">{v.university_name}</p>
                    <p className="text-dark-500 text-xs">{v.student_email}</p>
                    <div className="flex gap-2 mt-1.5">
                      {v.ai_score && (
                        <span className={`badge ${v.ai_score > 0.7 ? 'badge-success' : v.ai_score > 0.4 ? 'badge-warning' : 'badge-danger'}`}>
                          🤖 AI: {Math.round(v.ai_score * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {v.document_url && (
                    <a href={v.document_url} target="_blank" rel="noopener noreferrer"
                      className="btn-glass text-xs px-4 py-2">
                      👁️ View ID
                    </a>
                  )}
                  <button
                    onClick={() => reviewMutation.mutate({ id: v.id, action: 'approve' })}
                    disabled={reviewMutation.isLoading}
                    className="text-sm font-bold text-green-400 px-4 py-2 rounded-xl transition-all hover:bg-green-500/20"
                    style={{ border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: v.id, action: 'reject' })}
                    disabled={reviewMutation.isLoading}
                    className="text-sm font-bold text-red-400 px-4 py-2 rounded-xl transition-all hover:bg-red-500/20"
                    style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Reports ──────────────────────────────────────────────────────────────────
const Reports = () => {
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useQuery('adminReports',
    () => api.get('/admin/reports').then(res => res.data.reports)
  );

  const resolveMutation = useMutation(
    ({ id, action }) => api.post(`/admin/reports/${id}/resolve`, { action }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminReports');
        toast.success('Report resolved');
      },
    }
  );

  const reportTypeColors = {
    harassment: 'badge-danger',
    spam: 'badge-warning',
    fake_profile: 'badge-warning',
    inappropriate: 'badge-danger',
    other: 'badge-free',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Reports</h1>
        <p className="text-dark-400 text-sm">Review and action reported content</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-dark-400">Loading...</div>
      ) : reports?.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-white font-bold text-lg mb-2">All clear!</h3>
          <p className="text-dark-400">No pending reports to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports?.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={reportTypeColors[r.report_type] || 'badge-free'}>
                      {r.report_type?.replace('_', ' ') || 'Report'}
                    </span>
                    <span className="text-dark-500 text-xs">
                      {format(new Date(r.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="text-sm text-dark-200 space-y-1">
                    <p><span className="text-dark-400">Reporter:</span> <span className="text-white font-medium">{r.reporter_name}</span></p>
                    <p><span className="text-dark-400">Reported:</span> <span className="text-white font-medium">{r.reported_name}</span></p>
                    {r.description && <p className="text-dark-300 mt-2 leading-relaxed">{r.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => resolveMutation.mutate({ id: r.id, action: 'resolve' })}
                    className="text-sm text-green-400 px-4 py-2 rounded-xl font-medium transition-all hover:bg-green-500/20"
                    style={{ border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    ✓ Resolve
                  </button>
                  <button
                    onClick={() => resolveMutation.mutate({ id: r.id, action: 'ban' })}
                    className="text-sm text-red-400 px-4 py-2 rounded-xl font-medium transition-all hover:bg-red-500/20"
                    style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    🚫 Ban User
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Analytics (stub) ──────────────────────────────────────────────────────────
const Analytics = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      <p className="text-dark-400 text-sm">Platform performance metrics</p>
    </div>
    <div className="glass-card p-12 text-center"
      style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
      <div className="text-5xl mb-4">📈</div>
      <h3 className="text-white font-bold text-lg mb-2">Analytics Dashboard</h3>
      <p className="text-dark-400 max-w-sm mx-auto">
        Full analytics with charts, user growth trends, match rates, and revenue insights
        coming in Phase 2.
      </p>
      <span className="badge-warning mt-4 inline-flex">🚧 Coming Soon</span>
    </div>
  </div>
);

// ─── Admin Dashboard Shell ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [sidebarWidth] = useState(240);

  return (
    <div className="min-h-screen bg-app flex">
      <Sidebar />

      {/* Main content */}
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: 240, minHeight: '100vh' }}
      >
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/users" element={<Users />} />
          <Route path="/verifications" element={<Verifications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;