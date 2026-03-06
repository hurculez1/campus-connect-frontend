import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NetworkMonitor
 * - Shows a persistent banner when the user goes offline
 * - Shows a toast when connection is restored
 * - Detects slow/unstable connection via periodic ping
 */
const NetworkMonitor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUnstable, setIsUnstable] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const pingRef = useRef(null);
  const slowCount = useRef(0);

  const pingServer = async () => {
    if (!navigator.onLine) return;
    const start = Date.now();
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const ms = Date.now() - start;
      if (ms > 3000) {
        slowCount.current += 1;
        if (slowCount.current >= 2) setIsUnstable(true);
      } else {
        slowCount.current = 0;
        setIsUnstable(false);
      }
    } catch {
      // timeout or fetch error — count as unstable
      slowCount.current += 1;
      if (slowCount.current >= 2) setIsUnstable(true);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsUnstable(false);
      slowCount.current = 0;
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsUnstable(false);
      clearInterval(pingRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ping every 30 seconds to detect instability
    pingRef.current = setInterval(pingServer, 30000);
    pingServer(); // initial ping

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Offline Banner ── */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 py-3 px-4"
            style={{
              background: 'linear-gradient(135deg, #1a0a0a, #2d0f0f)',
              borderBottom: '1px solid rgba(239,68,68,0.4)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span className="text-xl animate-pulse">📡</span>
            <div className="text-center">
              <p className="text-white font-bold text-sm">You're offline</p>
              <p className="text-red-300 text-xs">Check your internet connection to continue using CampusConnect</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reconnected Banner (brief) ── */}
      <AnimatePresence>
        {justReconnected && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 py-3 px-4"
            style={{
              background: 'linear-gradient(135deg, #0a1a0a, #0f2d0f)',
              borderBottom: '1px solid rgba(34,197,94,0.4)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span className="text-xl">✅</span>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Back online!</p>
              <p className="text-green-300 text-xs">Your connection has been restored</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unstable Connection Toast (small, bottom) ── */}
      <AnimatePresence>
        {isOnline && isUnstable && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{
              background: 'rgba(26,20,8,0.95)',
              border: '1px solid rgba(245,158,11,0.4)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="text-base animate-pulse">⚠️</span>
            <div>
              <p className="text-amber-300 font-semibold text-xs">Unstable connection</p>
              <p className="text-amber-500/70 text-[10px]">Some features may be slow</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NetworkMonitor;
