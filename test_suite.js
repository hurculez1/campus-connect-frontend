/**
 * Campus Connect Uganda — Automated Test Suite
 * Tests: Routes, Components, CSS tokens, API setup
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const INFO = '\x1b[34mℹ️\x1b[0m';
let passed = 0, failed = 0;

function check(label, condition, detail = '') {
    if (condition) {
        console.log(`  ${PASS} ${label}${detail ? ' — ' + detail : ''}`);
        passed++;
    } else {
        console.log(`  ${FAIL} ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

function readFile(rel) {
    try { return fs.readFileSync(path.join(SRC, rel), 'utf8'); }
    catch { return null; }
}

function fileExists(rel) {
    return fs.existsSync(path.join(SRC, rel));
}

console.log('\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[1m  Campus Connect Uganda — Test Suite\x1b[0m');
console.log('\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

// ─── 1. File Existence ──────────────────────────────────────
console.log('\x1b[1m📁 1. File Existence\x1b[0m');
const requiredFiles = [
    'pages/Home.js',
    'pages/Login.js',
    'pages/Register.js',
    'pages/Discover.js',
    'pages/Chat.js',
    'pages/Matches.js',
    'pages/Subscription.js',
    'pages/Verification.js',
    'pages/admin/Dashboard.js',
    'pages/Profile.js',
    'pages/Settings.js',
    'components/Layout.js',
    'components/Navigation.js',
    'stores/authStore.js',
    'utils/api.js',
    'App.js',
    'index.js',
    'index.css',
];
requiredFiles.forEach(f => check(f, fileExists(f)));

// ─── 2. Component Exports ────────────────────────────────────
console.log('\n\x1b[1m🔧 2. Component Exports\x1b[0m');
const exportChecks = {
    'pages/Home.js': 'export default Home',
    'pages/Login.js': 'export default Login',
    'pages/Register.js': 'export default Register',
    'pages/Discover.js': 'export default Discover',
    'pages/Chat.js': 'export default Chat',
    'pages/Matches.js': 'export default Matches',
    'pages/Subscription.js': 'export default Subscription',
    'pages/Verification.js': 'export default Verification',
    'pages/admin/Dashboard.js': 'export default',
    'components/Layout.js': 'export default Layout',
    'components/Navigation.js': 'export default Navigation',
};
Object.entries(exportChecks).forEach(([file, needle]) => {
    const content = readFile(file);
    check(`${file} exports`, content && content.includes(needle));
});

// ─── 3. App Router Routes ────────────────────────────────────
console.log('\n\x1b[1m🗺️  3. Router Routes (App.js)\x1b[0m');
const appJs = readFile('App.js');
const routes = ['path="/"', 'path="/login"', 'path="/register"', 'path="/discover"',
    'path="/matches"', 'path="/chat/:matchId"', 'path="/profile"',
    'path="/settings"', 'path="/subscription"', 'path="/verification"', 'path="/admin/*"'];
routes.forEach(r => check(r, appJs && appJs.includes(r)));

// ─── 4. Design System CSS Classes ───────────────────────────
console.log('\n\x1b[1m🎨 4. CSS Design Tokens (index.css)\x1b[0m');
const css = readFile('index.css');
const cssClasses = ['.glass-card', '.btn-brand', '.btn-glass', '.btn-ghost', '.input',
    '.swipe-card', '.nav-link', '.badge', '.badge-verified', '.badge-premium',
    '.badge-vip', '.text-gradient', '.shimmer', '.glow-orb', '.msg-bubble-me',
    '.msg-bubble-them', '.typing-dot', '.admin-nav-link', '.plan-card'];
cssClasses.forEach(cls => check(cls, css && css.includes(cls)));

// ─── 5. Tailwind Config Tokens ──────────────────────────────
console.log('\n\x1b[1m🎨 5. Tailwind Config Tokens\x1b[0m');
const twConfig = fs.readFileSync(path.join(__dirname, 'tailwind.config.js'), 'utf8');
const tokens = ['brand:', 'gold:', 'dark:', 'royale:', 'eco:', 'bg-hero', 'brand-gradient',
    'premium-gradient', 'shadow-brand', 'shadow-glass', 'heartbeat', 'float', 'shimmer'];
tokens.forEach(t => check(t, twConfig.includes(t)));

// ─── 6. Key Feature Checks ──────────────────────────────────
console.log('\n\x1b[1m✨ 6. Feature Implementation Checks\x1b[0m');

// Home page
const home = readFile('pages/Home.js');
check('Home: animated hero section', home && home.includes('motion.div'));
check('Home: university rotation', home && home.includes('heroProfiles'));
check('Home: pricing plans', home && home.includes('plans'));
check('Home: testimonials', home && home.includes('testimonials'));
check('Home: stats section', home && (home.includes('50K') || home.includes('campusers')));
check('Home: CTA buttons', home && home.includes('btn-brand'));
check('Home: footer', home && home.includes('footer'));

// Login page
const login = readFile('pages/Login.js');
check('Login: glassmorphism card', login && login.includes('glass'));
check('Login: password toggle', login && login.includes('showPassword'));
check('Login: Google auth button', login && login.includes('Google'));
check('Login: form validation', login && login.includes('required'));

// Register page
const register = readFile('pages/Register.js');
check('Register: multi-step form', register && register.includes('step'));
check('Register: password strength', register && register.includes('strength'));
check('Register: interests picker', register && (register.includes('interests') || register.includes('interest')));
check('Register: university dropdown', register && register.includes('university'));

// Discover page
const discover = readFile('pages/Discover.js');
check('Discover: SwipeCard (custom drag)', discover && (discover.includes('SwipeCard') || discover.includes('useMotionValue')));
check('Discover: match celebration', discover && discover.includes('matchCelebration'));
check('Discover: swipe buttons', discover && discover.includes('swipe-btn'));
check('Discover: like/pass handlers', discover && discover.includes('handleLike'));

// Chat page
const chat = readFile('pages/Chat.js');
check('Chat: socket.io', chat && chat.includes('socket'));
check('Chat: message bubbles', chat && chat.includes('msg-bubble'));
check('Chat: emoji picker', chat && (chat.includes('emoji') || chat.includes('Emoji')));
check('Chat: typing indicator', chat && chat.includes('typing'));

// Matches page
const matches = readFile('pages/Matches.js');
check('Matches: tab navigation', matches && matches.includes('tab'));
check('Matches: premium blur teaser', matches && (matches.includes('blur') || matches.includes('premium')));
check('Matches: unread counter', matches && (matches.includes('unread') || matches.includes('Unread')));

// Admin dashboard
const admin = readFile('pages/admin/Dashboard.js');
check('Admin: sidebar navigation', admin && admin.includes('sidebar'));
check('Admin: stats cards', admin && (admin.includes('stat') || admin.includes('Stat')));
check('Admin: user management table', admin && admin.includes('table'));
check('Admin: verification panel', admin && admin.includes('verification'));

// Subscription page
const sub = readFile('pages/Subscription.js');
check('Subscription: 3 plan cards', sub && sub.includes('VIP') && sub.includes('Premium') && sub.includes('Free'));
check('Subscription: MTN money', sub && sub.includes('MTN'));
check('Subscription: Airtel money', sub && sub.includes('Airtel'));
check('Subscription: payment modal', sub && (sub.includes('modal') || sub.includes('Modal')));

// ─── 7. Auth Store ──────────────────────────────────────────
console.log('\n\x1b[1m🔐 7. Auth Store (Zustand)\x1b[0m');
const auth = readFile('stores/authStore.js');
check('Auth: login action', auth && auth.includes('login:'));
check('Auth: register action', auth && auth.includes('register:'));
check('Auth: logout action', auth && auth.includes('logout:'));
check('Auth: persist middleware', auth && auth.includes('persist'));
check('Auth: token management', auth && auth.includes('localStorage'));

// ─── 8. API Utility ─────────────────────────────────────────
console.log('\n\x1b[1m🌐 8. API Utility\x1b[0m');
const api = readFile('utils/api.js');
check('API: axios instance', api && api.includes('axios'));
check('API: env URL', api && api.includes('REACT_APP_API_URL'));
check('API: auth header interceptor', api && api.includes('interceptors'));

// ─── Summary ─────────────────────────────────────────────────
const total = passed + failed;
const pct = Math.round((passed / total) * 100);
console.log('\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log(`\x1b[1m  Results: ${passed}/${total} tests passed (${pct}%)\x1b[0m`);
if (failed === 0) {
    console.log(`  \x1b[32m✅ All tests passed! 🎉\x1b[0m`);
} else {
    console.log(`  \x1b[31m❌ ${failed} tests failed\x1b[0m`);
}
console.log('\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
process.exit(failed > 0 ? 1 : 0);
