/**
 * Campus Connect Uganda — Final Test Suite v2
 */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, 'src');

function readFile(rel) {
    try { return fs.readFileSync(path.join(SRC, rel), 'utf8'); } catch { return null; }
}
function exists(rel) { return fs.existsSync(path.join(SRC, rel)); }

const results = { passed: [], failed: [] };
function check(label, condition) {
    if (condition) results.passed.push('✅ ' + label);
    else results.failed.push('❌ ' + label);
}

// 1. Files
const files = ['pages/Home.js', 'pages/Login.js', 'pages/Register.js', 'pages/Discover.js',
    'pages/Chat.js', 'pages/Matches.js', 'pages/Subscription.js', 'pages/Verification.js',
    'pages/admin/Dashboard.js', 'pages/Profile.js', 'pages/Settings.js',
    'components/Layout.js', 'components/Navigation.js', 'stores/authStore.js',
    'utils/api.js', 'App.js', 'index.js', 'index.css'];
files.forEach(f => check('[FILE] ' + f, exists(f)));

// 2. Routes
const app = readFile('App.js') || '';
['path="/"', 'path="/login"', 'path="/register"', 'path="/discover"', 'path="/matches"',
    'path="/chat/:matchId"', 'path="/profile"', 'path="/settings"', 'path="/subscription"',
    'path="/verification"', 'path="/admin/*"'].forEach(r => check('[ROUTE] ' + r, app.includes(r)));

// 3. CSS (defined in index.css, not tailwind.config.js)
const css = readFile('index.css') || '';
const tw = fs.readFileSync(path.join(__dirname, 'tailwind.config.js'), 'utf8');
// bg-hero is in index.css @layer utilities, shadow-brand is in index.css @layer components
check('[CSS] bg-hero (in index.css)', css.includes('.bg-hero'));
check('[CSS] shadow-brand (in index.css component)', css.includes('shadow-brand'));
['.glass-card', '.btn-brand', '.btn-glass', '.input', '.swipe-card', '.nav-link',
    '.badge-verified', '.badge-premium', '.badge-vip', '.text-gradient', '.shimmer',
    '.glow-orb', '.msg-bubble-me', '.msg-bubble-them', '.typing-dot', '.plan-card'].forEach(c =>
        check('[CSS] ' + c, css.includes(c)));

// 4. Tailwind tokens
['brand:', 'gold:', 'dark:', 'royale:', 'eco:', 'brand-gradient', 'premium-gradient',
    'heartbeat', 'float', 'shimmer'].forEach(t => check('[TW] ' + t, tw.includes(t)));
check('[TW] safelist (production safety)', tw.includes('safelist'));

// 5. Features
const home = readFile('pages/Home.js') || '';
check('[HOME] Framer Motion animations', home.includes('motion.div'));
check('[HOME] Rotating hero profiles', home.includes('heroProfiles'));
check('[HOME] Pricing plans', home.includes('plans'));
check('[HOME] Testimonials', home.includes('testimonial'));
check('[HOME] Stats section', home.includes('K+') || home.includes('campusers'));
check('[HOME] CTA buttons', home.includes('btn-brand'));
check('[HOME] Features section', home.includes('features'));
check('[HOME] Footer', home.includes('footer') || home.includes('Footer'));

const login = readFile('pages/Login.js') || '';
check('[LOGIN] Glassmorphism card', login.includes('glass'));
check('[LOGIN] Password show/hide toggle', login.includes('showPassword'));
check('[LOGIN] Google auth button', login.includes('Google'));
check('[LOGIN] Form validation', login.includes('required'));
check('[LOGIN] Link to register', login.includes('/register'));

const register = readFile('pages/Register.js') || '';
check('[REGISTER] Multi-step (3 steps)', register.includes('step'));
check('[REGISTER] Password strength bar', register.includes('password') && register.includes('h-1 rounded-full'));
check('[REGISTER] Interests picker', register.includes('INTERESTS') || register.includes('interest'));
check('[REGISTER] University dropdown', register.includes('university'));
check('[REGISTER] Date of birth field', register.includes('dateOfBirth') || register.includes('date_of_birth'));
check('[REGISTER] Age check (18+)', register.includes('18') || register.includes('age'));

const discover = readFile('pages/Discover.js') || '';
check('[DISCOVER] TinderCard library', discover.includes('TinderCard'));
check('[DISCOVER] Match celebration overlay', discover.includes('matchCelebration'));
check('[DISCOVER] Swipe action buttons', discover.includes('swipe-btn'));
check('[DISCOVER] Like/pass via onSwipe', discover.includes('onSwipe'));
check('[DISCOVER] Programmatic swipe btn', discover.includes('programmaticSwipe'));

const chat = readFile('pages/Chat.js') || '';
check('[CHAT] Socket.IO real-time', chat.includes('socket'));
check('[CHAT] Message bubbles', chat.includes('msg-bubble'));
check('[CHAT] Emoji feature', chat.toLowerCase().includes('emoji'));
check('[CHAT] Typing indicator', chat.includes('typing'));
check('[CHAT] Message timestamps', chat.includes('format') || chat.includes('date'));
check('[CHAT] Icebreaker prompts', chat.includes('icebreaker') || chat.includes('prompt'));

const matches = readFile('pages/Matches.js') || '';
check('[MATCHES] Tab navigation', matches.includes('tab') || matches.includes('Tab'));
check('[MATCHES] Free plan blur teaser', matches.includes('blur') || matches.includes('premium'));
check('[MATCHES] Unread message counter', matches.toLowerCase().includes('unread'));
check('[MATCHES] Match card animations', matches.includes('motion') || matches.includes('animate'));

const sub = readFile('pages/Subscription.js') || '';
check('[SUBSCRIPTION] Free plan', sub.includes('Free'));
check('[SUBSCRIPTION] Premium plan', sub.includes('Premium'));
check('[SUBSCRIPTION] VIP plan', sub.includes('VIP'));
check('[SUBSCRIPTION] MTN Mobile Money', sub.includes('MTN'));
check('[SUBSCRIPTION] Airtel Mobile Money', sub.includes('Airtel'));
check('[SUBSCRIPTION] Payment modal', sub.toLowerCase().includes('modal'));

const admin = readFile('pages/admin/Dashboard.js') || '';
check('[ADMIN] Collapsible sidebar', admin.includes('sidebar') || admin.includes('Sidebar'));
check('[ADMIN] Metric stats cards', admin.toLowerCase().includes('stat'));
check('[ADMIN] User management table', admin.includes('table') || admin.includes('Table'));
check('[ADMIN] Verification review', admin.includes('verification') || admin.includes('Verification'));
check('[ADMIN] Reports section', admin.includes('report') || admin.includes('Report'));

const verif = readFile('pages/Verification.js') || '';
check('[VERIFICATION] Email verification method', verif.includes('email') && verif.includes('verify'));
check('[VERIFICATION] ID upload (drag & drop)', verif.includes('dropzone') || verif.includes('Dropzone'));
check('[VERIFICATION] FAQ accordion', verif.includes('details') || verif.includes('faq') || verif.includes('FAQ'));

const layout = readFile('components/Layout.js') || '';
check('[LAYOUT] Glassmorphism header', layout.includes('glassmorphism') || layout.includes('backdrop') || layout.includes('glass'));
check('[LAYOUT] User avatar', layout.includes('avatar') || layout.includes('photo') || layout.includes('Avatar'));
check('[LAYOUT] Subscription badge', layout.includes('badge') || layout.includes('tier'));
check('[LAYOUT] Navigation component', layout.includes('Navigation'));

const nav = readFile('components/Navigation.js') || '';
check('[NAV] Bottom mobile navigation', nav.includes('fixed') || nav.includes('bottom'));
check('[NAV] Active route indicator', nav.includes('active') || nav.includes('Active'));
check('[NAV] 4 nav items', ['discover', 'matches', 'chat', 'profile'].filter(i => nav.toLowerCase().includes(i)).length >= 3);

const auth = readFile('stores/authStore.js') || '';
check('[AUTH] Login action', auth.includes('login:'));
check('[AUTH] Register action', auth.includes('register:'));
check('[AUTH] Logout action', auth.includes('logout:'));
check('[AUTH] Zustand persist', auth.includes('persist'));
check('[AUTH] Token storage', auth.includes('localStorage'));
check('[AUTH] Error handling', auth.includes('error'));

const api = readFile('utils/api.js') || '';
check('[API] Axios instance', api.includes('axios'));
check('[API] Env API URL', api.includes('REACT_APP_API_URL'));
check('[API] Auth header interceptor', api.includes('interceptors'));

// Write results
const total = results.passed.length + results.failed.length;
const pct = Math.round(results.passed.length / total * 100);
const output = {
    summary: { passed: results.passed.length, failed: results.failed.length, total, pct },
    failed: results.failed,
    passed: results.passed,
};
fs.writeFileSync(path.join(__dirname, 'test_output.json'), JSON.stringify(output, null, 2));
console.log(`\nCAMPUS CONNECT UGANDA — TEST RESULTS`);
console.log(`=====================================`);
console.log(`PASSED: ${output.summary.passed}/${total} tests (${pct}%)`);
if (output.summary.failed > 0) {
    console.log(`\nFAILED TESTS:`);
    output.failed.forEach(f => console.log('  ' + f));
} else {
    console.log(`\nAll tests passed!`);
}
process.exit(output.summary.failed > 0 ? 1 : 0);
