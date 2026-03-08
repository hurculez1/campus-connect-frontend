import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../stores/authStore';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Get started',
    price: null,
    priceUGX: null,
    iconBg: 'rgba(255,255,255,0.08)',
    icon: '🆓',
    perks: [
      { text: '50 swipes per day', ok: true },
      { text: '5 matches per day', ok: true },
      { text: 'Core messaging', ok: true },
      { text: 'Basic filters', ok: true },
      { text: '2 unique features', ok: true },
      { text: 'Ad-free', ok: false },
      { text: 'See who liked you', ok: false },
      { text: 'Unlimited swipes', ok: false },
    ],
    cta: 'Downgrade to Free',
    ctaDisabled: false,
    tier: 'free',
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Most popular',
    price: '$4.99',
    priceUGX: 'UGX 18,000',
    per: '/month',
    iconBg: 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(245,158,11,0.2))',
    border: '1px solid rgba(244,63,94,0.4)',
    icon: '⭐',
    featured: true,
    perks: [
      { text: 'Unlimited swipes & matches', ok: true },
      { text: 'Ad-free experience', ok: true },
      { text: 'Advanced filters', ok: true },
      { text: 'See who liked you', ok: true },
      { text: '1 Super Like per day', ok: true },
      { text: 'All 6 unique features', ok: true },
      { text: 'Priority support', ok: true },
    ],
    cta: 'Upgrade to Premium',
    tier: 'premium',
  },
  {
    id: 'vip',
    name: 'VIP',
    subtitle: 'Ultimate experience',
    price: '$9.99',
    priceUGX: 'UGX 36,000',
    per: '/month',
    iconBg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(220,38,38,0.15))',
    border: '1px solid rgba(245,158,11,0.35)',
    icon: '👑',
    perks: [
      { text: 'Everything in Premium', ok: true },
      { text: 'Priority matching algorithm', ok: true },
      { text: '5 Super Likes per day', ok: true },
      { text: 'AI date coaching', ok: true },
      { text: 'Custom profile themes', ok: true },
      { text: 'Exclusive campus events', ok: true },
      { text: 'Virtual gifts', ok: true },
      { text: 'VIP badge on profile', ok: true },
    ],
    cta: 'Become VIP',
    tier: 'vip',
  },
];

const BOOSTS = [
  { name: 'Profile Boost', desc: '3x more visibility for 30 mins', price: 'UGX 3,000 / $0.80', icon: '⚡' },
  { name: 'Super Like Pack', desc: '5 extra Super Likes', price: 'UGX 5,000 / $1.30', icon: '⭐' },
  { name: 'Virtual Matooke 🍌', desc: 'Send a charming virtual gift', price: 'UGX 2,000 / $0.55', icon: '🎁' },
];

const Subscription = () => {
  const { user, updateUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileNumber, setMobileNumber] = useState('');
  const currentTier = user?.subscriptionTier || 'free';

  const subscribeMutation = useMutation(
    (data) => api.post('/payments/subscribe', data),
    {
      onSuccess: (res) => {
        updateUser({ subscriptionTier: res.data.tier });
        toast.success(`🎉 Welcome to ${res.data.tier}! Enjoy your upgrade!`);
        setSelectedPlan(null);
      },
      onError: () => {
        toast.error('Payment failed. Please try again.');
      },
    }
  );

  const handleSubscribe = (plan) => {
    if (plan.id === currentTier) return;
    setSelectedPlan(plan);
  };

  const confirmPayment = () => {
    subscribeMutation.mutate({
      plan: selectedPlan.id,
      paymentMethod,
      mobileNumber: paymentMethod !== 'card' ? mobileNumber : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade Your Experience</h1>
          <p className="text-dark-400">
            Current plan: <span className={`font-bold ${currentTier === 'vip' ? 'text-gradient-vip' :
                currentTier === 'premium' ? 'text-gradient-premium' : 'text-white'
              }`}>{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
          </p>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative glass-card p-6 flex flex-col"
              style={plan.border ? { border: plan.border } : {}}
            >

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-success text-xs px-4 py-1.5">✓ Your Plan</span>
                </div>
              )}

              <div className="text-center mb-5 pt-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
                  style={{ background: plan.iconBg }}>
                  {plan.icon}
                </div>
                <div className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  {plan.subtitle}
                </div>
                <h2 className={`text-xl font-bold ${plan.id === 'vip' ? 'text-gradient-vip' :
                    plan.id === 'premium' ? 'text-gradient' : 'text-white'
                  }`}>
                  {plan.name}
                </h2>
                {plan.price ? (
                  <div className="mt-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black text-white">{plan.price}</span>
                      <span className="text-dark-400 text-sm">{plan.per}</span>
                    </div>
                    <p className="text-dark-500 text-xs">{plan.priceUGX}{plan.per}</p>
                  </div>
                ) : (
                  <div className="text-3xl font-black text-white mt-2">Free</div>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.perks.map((perk, j) => (
                  <li key={j} className={`flex items-start gap-2 text-sm ${perk.ok ? 'text-dark-200' : 'text-dark-600 line-through'}`}>
                    <span className={`flex-shrink-0 mt-0.5 ${perk.ok ? 'text-brand-400' : 'text-dark-700'}`}>
                      {perk.ok ? '✓' : '✕'}
                    </span>
                    {perk.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || plan.ctaDisabled}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200
                  ${isCurrent
                    ? 'text-dark-400 cursor-default'
                    : plan.id === 'vip'
                      ? 'btn-vip'
                      : plan.id === 'premium'
                        ? 'btn-brand'
                        : 'btn-glass'
                  }`}
                style={isCurrent ? { background: 'rgba(255,255,255,0.05)' } : {}}
              >
                {isCurrent ? '✓ Current Plan' : plan.cta}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* In-App Purchases */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span>🛒</span> In-App Purchases
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {BOOSTS.map((boost, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="glass-card p-5 flex flex-col gap-3"
            >
              <div className="text-3xl">{boost.icon}</div>
              <div>
                <h3 className="text-white font-bold text-sm">{boost.name}</h3>
                <p className="text-dark-400 text-xs">{boost.desc}</p>
              </div>
              <div className="mt-auto">
                <p className="text-brand-400 font-bold text-sm mb-3">{boost.price}</p>
                <button className="btn-glass w-full text-xs py-2">Purchase</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedPlan(null)}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Complete Payment</h3>
              <button onClick={() => setSelectedPlan(null)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Plan summary */}
            <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{selectedPlan.name} Plan</p>
                  <p className="text-dark-400 text-sm">{selectedPlan.priceUGX}/month</p>
                </div>
                <div className="text-right">
                  <p className="text-brand-400 font-black text-xl">{selectedPlan.price}</p>
                  <p className="text-dark-500 text-xs">per month</p>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-3 mb-5">
              <p className="text-dark-300 text-sm font-semibold">Payment Method</p>
              {[
                { id: 'card', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, Stripe' },
                { id: 'mtn', label: 'MTN Mobile Money', icon: '📱', desc: 'MTN MoMo Uganda' },
                { id: 'airtel', label: 'Airtel Money', icon: '📲', desc: 'Airtel Uganda' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${paymentMethod === m.id ? 'border-brand-500/40' : 'border-white/05'
                    }`}
                  style={paymentMethod === m.id
                    ? { background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{m.label}</p>
                    <p className="text-dark-400 text-xs">{m.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? 'border-brand-500' : 'border-dark-500'
                    }`}>
                    {paymentMethod === m.id && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile number for MoMo */}
            {(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-dark-200 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="input"
                  placeholder="07X XXX XXXX"
                />
                <p className="text-dark-500 text-xs mt-1">You will receive a payment prompt on your phone</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-3 rounded-xl mb-5 text-xs text-dark-400 flex items-center gap-2"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="text-green-400">🔒</span>
                Secure payment powered by Stripe. Your card details are never stored.
              </div>
            )}

            <button
              onClick={confirmPayment}
              disabled={subscribeMutation.isLoading || ((paymentMethod === 'mtn' || paymentMethod === 'airtel') && !mobileNumber)}
              className="btn-brand w-full py-4 text-base"
            >
              {subscribeMutation.isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay ${selectedPlan.price}/month →`
              )}
            </button>

            <p className="text-dark-600 text-xs text-center mt-3">
              Cancel anytime · No hidden fees · GDPR compliant
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Subscription;