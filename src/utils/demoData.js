// ─── Demo Mode Mock Data ────────────────────────────────────────────────────
// Used when no backend is running, so the full app experience is visible

export const DEMO_USER = {
    id: 'demo-001',
    firstName: 'Aisha',
    lastName: 'Nakato',
    email: 'aisha.nakato@student.mak.ac.ug',
    university: 'Makerere University',
    course: 'Medicine',
    yearOfStudy: 3,
    gender: 'female',
    bio: 'Med student by day, foodie by night 🍛 Love hiking Rwenzori, salsa dancing & deep convos. Looking for someone who matches my energy ✨',
    interests: ['📚 Academics', '🍳 Cooking', '✈️ Travel', '🎵 Music', '🏋️ Fitness', '🌍 Volunteering'],
    subscriptionTier: 'premium',
    verificationStatus: 'verified',
    isAdmin: false,
    profilePhoto: null,
    swipesRemaining: 42,
    swipesLimit: 50,
};

export const DEMO_PROFILES = [
    {
        id: 'p1', first_name: 'David', last_name: 'Kato', age: 23,
        university: 'Kyambogo University', course: 'Electrical Engineering', year_of_study: 4,
        gender: 'male', bio: 'Engineer in the making 🔧 Chess club president, loves afrobeats & campus debates. Searching for my player 2 🎮',
        interests: JSON.stringify(['💻 Tech', '🎮 Gaming', '🎵 Music', '⚽ Sports']),
        verification_status: 'verified', subscription_tier: 'free',
        photos: [], profile_photo_url: null,
        date_of_birth: '2001-03-15',
        color: 'from-violet-500 to-blue-500', emoji: '👨🏿‍💻',
    },
    {
        id: 'p2', first_name: 'Grace', last_name: 'Atim', age: 21,
        university: 'Uganda Christian University', course: 'Law', year_of_study: 2,
        gender: 'female', bio: 'Future barrister ⚖️ Moot court enthusiast. I argue for fun (and for justice). Let\'s debate over rolex 🌯',
        interests: JSON.stringify(['🎤 Debate', '📖 Reading', '🌍 Volunteering', '🎭 Drama']),
        verification_status: 'verified', subscription_tier: 'premium',
        photos: [], profile_photo_url: null,
        date_of_birth: '2002-07-22',
        color: 'from-amber-500 to-rose-500', emoji: '👩🏾‍⚖️',
    },
    {
        id: 'p3', first_name: 'Amos', last_name: 'Mugisha', age: 24,
        university: 'Mbarara University of Science & Technology', course: 'Business Administration', year_of_study: 4,
        gender: 'male', bio: 'MUST student & side-hustle king 👑 Into entrepreneurship, photography, and finding the best katogo in town 📸',
        interests: JSON.stringify(['📷 Photography', '🎨 Art', '✈️ Travel', '🍳 Cooking']),
        verification_status: 'pending', subscription_tier: 'vip',
        photos: [], profile_photo_url: null,
        date_of_birth: '2000-11-05',
        color: 'from-emerald-500 to-teal-500', emoji: '👨🏾‍💼',
    },
    {
        id: 'p4', first_name: 'Sandra', last_name: 'Nambooze', age: 22,
        university: 'Makerere University', course: 'Computer Science', year_of_study: 3,
        gender: 'female', bio: 'CS student turned startup founder 🚀 Building an agritech app for Uganda. Lover of nature walks & Luganda poetry 🌿',
        interests: JSON.stringify(['💻 Tech', '🌿 Nature', '📚 Academics', '🧘 Wellness']),
        verification_status: 'verified', subscription_tier: 'premium',
        photos: [], profile_photo_url: null,
        date_of_birth: '2001-09-18',
        color: 'from-rose-500 to-pink-500', emoji: '👩🏾‍💻',
    },
    {
        id: 'p5', first_name: 'Brian', last_name: 'Okello', age: 25,
        university: 'Gulu University', course: 'Public Health', year_of_study: 5,
        gender: 'male', bio: 'Northern Uganda pride 🦁 Public health warrior. Passionate about community health, traditional dances & Arsenal FC ⚽',
        interests: JSON.stringify(['⚽ Sports', '🌍 Volunteering', '🎵 Music', '📖 Reading']),
        verification_status: 'verified', subscription_tier: 'free',
        photos: [], profile_photo_url: null,
        date_of_birth: '1999-04-30',
        color: 'from-blue-500 to-cyan-500', emoji: '👨🏿‍⚕️',
    },
];

export const DEMO_MATCHES = [
    {
        id: 'm1',
        other_user: {
            id: 'p1', first_name: 'David', last_name: 'Kato',
            university: 'Kyambogo University',
            gender: 'male', profile_photo_url: null, verification_status: 'verified',
        },
        last_message: 'Haha that\'s so true! When are you free this week? 😄',
        last_message_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        unread_count: 2,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'm2',
        other_user: {
            id: 'p3', first_name: 'Amos', last_name: 'Mugisha',
            university: 'MUST', gender: 'male', profile_photo_url: null, verification_status: 'pending',
        },
        last_message: null,
        last_message_time: null,
        unread_count: 0,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'm3',
        other_user: {
            id: 'p5', first_name: 'Brian', last_name: 'Okello',
            university: 'Gulu University', gender: 'male', profile_photo_url: null, verification_status: 'verified',
        },
        last_message: 'I know this amazing rolex spot near the gate 👌',
        last_message_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        unread_count: 0,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const DEMO_MESSAGES = [
    { id: 'msg1', sender_id: 'p1', content: 'Hey Aisha! I saw you\'re also in medicine 🤩', created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg2', sender_id: 'demo-001', content: 'Haha no I\'m the one in medicine, you\'re in Engineering silly! 😂', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg3', sender_id: 'p1', content: 'Right right! Still, campus connect is wild — what are the chances we\'d match 💀', created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg4', sender_id: 'demo-001', content: 'The algorithm knows best 😌✨ So what year are you?', created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg5', sender_id: 'p1', content: 'Final year! Counting down the days. You?', created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg6', sender_id: 'demo-001', content: 'Year 3! Two more years of suffering 😭 but I love it honestly', created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg7', sender_id: 'p1', content: 'Lol medicine is no joke. Respect 🫡 Are you going to the Makerere cultural night this Friday?', created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), is_read: true },
    { id: 'msg8', sender_id: 'demo-001', content: 'YES!! I was literally just about to ask if you\'d be there 😭❤️', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), is_read: false },
    { id: 'msg9', sender_id: 'p1', content: 'Haha that\'s so true! When are you free this week? 😄', created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), is_read: false },
];

export const isDemoMode = () => {
    try {
        const stored = localStorage.getItem('auth-storage');
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return parsed?.state?.user?.id === 'demo-001';
    } catch { return false; }
};
