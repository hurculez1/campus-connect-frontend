import axios from 'axios';
import toast from 'react-hot-toast';

// Default backend URL — always use the permanent Vercel alias, NOT a deployment-specific URL
const DEFAULT_BACKEND = 'https://backend-iota-azure-90.vercel.app';

const getApiUrl = () => {
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) return `${import.meta.env.VITE_API_URL}/api`;

  // Check localStorage (set by app)
  const stored = localStorage.getItem('apiBase');
  if (stored) return `${stored}/api`;

  // Default to known backend
  return `${DEFAULT_BACKEND}/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 60000, // Increased to 60s to handle Cloudinary uploads and slow connections
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach token ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Friendly error messages map ─────────────────────────────────────────────
const friendlyMessage = (error) => {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))
    return '⏱ The server took too long to respond. Please try again.';
  if (error.message === 'Network Error')
    return null; // Suppress generic network errors as they often fire falsely on Vercel unmounts

  // Suppress any "too many" / rate-limit / duplicate entry messages globally
  const serverMsg0 = error.response?.data?.message || error.response?.data?.error || '';
  if (/too many|rate.?limit|please wait|duplicate|ER_DUP/i.test(serverMsg0)) return null;

  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;

  switch (status) {
    case 400: return serverMsg || '⚠️ Some information you entered is invalid. Please check and try again.';
    case 401: return null; // Handled silently by component
    case 403: return '🚫 You don\'t have permission to do that.';
    case 404: return serverMsg || '🔍 We couldn\'t find what you were looking for.';
    case 409: return serverMsg || '⚠️ This account already exists. Try logging in instead.';
    case 422: return serverMsg || '⚠️ Please fill in all required fields correctly.';
    case 429: return null; // Suppress too many attempts toast as requested by user
    case 500: return null; // Suppress server errors — users don't need to know
    case 502:
    case 503:
    case 504: return '🔄 The server is temporarily unavailable. Please try again shortly.';
    default: return serverMsg || '❌ Something went wrong. Please try again.';
  }
};

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 — just silently reject, let the component decide what to do
    if (status === 401) {
      return Promise.reject(error);
    }

    // Don't toast for expected auth-flow 4xx from login/register — those are handled in the component
    const isAuthCall = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/google');
    if (isAuthCall && status >= 400 && status < 500) {
      return Promise.reject(error);
    }

    // Silently swallow duplicate swipe entries — users don't need to see this
    const isSwipeCall = error.config?.url?.includes('/matches/swipe');
    if (isSwipeCall && (status === 409 || status === 422)) {
      return Promise.reject(error);
    }

    // Show global toast for everything else if we have a valid message
    const msg = friendlyMessage(error);
    if (msg) toast.error(msg, { id: `api-error-${status || 'net'}`, duration: 5000 });

    return Promise.reject(error);
  }
);

export default api;
