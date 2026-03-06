import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Verification from './pages/Verification';
import Pulse from './pages/Pulse';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/discover" /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/discover" /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/discover" /> : <ForgotPassword />}
      />

      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route
          path="/discover"
          element={isAuthenticated ? <Discover /> : <Navigate to="/login" />}
        />
        <Route
          path="/matches"
          element={isAuthenticated ? <Matches /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/:matchId"
          element={isAuthenticated ? <Chat /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/subscription"
          element={isAuthenticated ? <Subscription /> : <Navigate to="/login" />}
        />
        <Route
          path="/verification"
          element={isAuthenticated ? <Verification /> : <Navigate to="/login" />}
        />
        <Route
          path="/pulse"
          element={isAuthenticated ? <Pulse /> : <Navigate to="/login" />}
        />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={(user?.isAdmin || user?.isSuperAdmin) ? <AdminDashboard /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;