const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/login');
});

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

let cacheData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3 * 60 * 1000;
async function fetchDb() {
    const now = Date.now();
    if (cacheData && (now - lastFetchTime < CACHE_DURATION)) {
        return cacheData;
    }
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getData&t=${Date.now()}`);
        const data = await res.json();
        cacheData = data;
        lastFetchTime = now;
        return cacheData;
    } catch (e) {
        console.error("Gagal mengambil data:", e);
        return cacheData || { users: [], notes: [], kas: [], transactions: [], announcements: [], events: [], summative: [] };
    }
}

// Fungsi format tanggal ke format Indonesia yang rapi
const formatDateID = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

// Fungsi login kilat menggunakan GET agar sesuai dengan Apps Script doGet
async function verifyLogin(first_name, password) {
    try {
        const params = new URLSearchParams({
            action: 'verifyLogin',
            first_name: first_name,
            password: password
        });
        const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
        return await res.json();
    } catch (e) {
        console.error("Gagal verifikasi login:", e);
        return null;
    }
}

const sessions = {};

function checkAuth(req, res, next) {
    const sessionId = req.headers.cookie?.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];
    if (sessionId && sessions[sessionId]) {
        req.user = sessions[sessionId];
        next();
    } else {
        res.redirect('/login');
    }
}

const nationalHolidays = {
    "2026-01-01": "Tahun Baru Masehi",
    "2026-01-16": "Isra Mikraj Nabi Muhammad SAW",
    "2026-02-17": "Tahun Baru Imlek",
    "2026-03-19": "Hari Suci Nyepi",
    "2026-03-20": "Hari Raya Idul Fitri",
    "2026-03-21": "Hari Raya Idul Fitri",
    "2026-04-03": "Wafat Yesus Kristus",
    "2026-04-05": "Kebangkitan Yesus Kristus (Paskah)",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Yesus Kristus",
    "2026-05-27": "Hari Raya Idul Adha",
    "2026-05-31": "Hari Raya Waisak",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-06-16": "Tahun Baru Islam",
    "2026-08-17": "Hari Kemerdekaan RI",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-25": "Hari Raya Natal",
    "2027-01-01": "Tahun Baru Masehi",
    "2027-01-05": "Isra Mikraj Nabi Muhammad SAW",
    "2027-02-06": "Tahun Baru Imlek",
    "2027-03-08": "Hari Suci Nyepi",
    "2027-03-10": "Hari Raya Idul Fitri",
    "2027-03-11": "Hari Raya Idul Fitri",
    "2027-03-26": "Wafat Yesus Kristus",
    "2027-03-28": "Paskah",
    "2027-05-01": "Hari Buruh Internasional",
    "2027-05-06": "Kenaikan Yesus Kristus",
    "2027-05-16": "Hari Raya Idul Adha",
    "2027-05-20": "Hari Raya Waisak",
    "2027-06-01": "Hari Lahir Pancasila",
    "2027-06-06": "Tahun Baru Islam",
    "2027-08-17": "Hari Kemerdekaan RI",
    "2027-09-04": "Maulid Nabi Muhammad SAW",
    "2027-12-25": "Hari Raya Natal"
};

const layout = (title, content) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Quicksand', 'sans-serif'],
                    },
                    colors: {
                        deepgreen: '#215F47',
                        sagegreen: '#4B8A6C',
                        tangerine: '#FA8128',
                        merigold: '#FCAE1E',
                        cider: '#B56727',
                        cantaloupe: '#FDA172',
                        sandstone: '#D67229',
                        cream: '#F7F4ED',
                        earthtext: '#2C3B32',
                        cardbg: '#FFFFFF',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Quicksand', sans-serif; }
        #loading-overlay { transition: opacity 0.3s ease; }
    </style>
</head>
<body class="bg-gradient-to-br from-[#1E563F] via-[#4B8A6C] to-[#243D31] text-earthtext min-h-screen flex flex-col selection:bg-tangerine selection:text-white">
    <div id="loading-overlay" class="fixed inset-0 bg-[#215F47]/90 backdrop-blur-md flex flex-col items-center justify-center z-[9999]" style="display: none;">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
        <p class="mt-4 text-white font-bold text-lg animate-pulse">Memuat halaman...</p>
    </div>

    <nav class="bg-deepgreen/85 backdrop-blur-xl sticky top-0 z-50 border-b border-white/20 shadow-lg">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center text-white">
            <a href="/dashboard" class="font-bold text-base sm:text-lg flex items-center space-x-2.5 hover:text-cantaloupe transition">
                <span>Portal Walimurid Kelas 2A</span>
            </a>
            <a href="/logout" class="bg-red-500/30 hover:bg-red-500 text-red-100 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm border border-red-500/40 backdrop-blur-md">Keluar</a>
        </div>
    </nav>

    <main class="max-w-4xl mx-auto p-4 sm:p-6 flex-grow w-full">
        <div class="bg-white/85 backdrop-blur-2xl text-earthtext rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/60 min-h-[75vh] flex flex-col justify-between">
            <div>
                ${content}
            </div>
            <footer class="text-center pt-8 mt-12 text-xs text-earthtext/60 border-t border-deepgreen/10 font-semibold">
                Portal Walimurid Kelas 2A &copy; 2026 Dhiya
            </footer>
        </div>
    </main>
    
    <script>
        window.addEventListener('load', function() {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 300);
            }
        });

        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin) && !link.getAttribute('target')) {
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    overlay.style.opacity = '1';
                }
            }
        });

        document.addEventListener('submit', function(e) {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
            }
        });
    </script>
</body>
</html>
`;

app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Portal Walimurid Kelas 2A</title>
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['Quicksand', 'sans-serif'],
                        },
                        colors: {
                            deepgreen: '#215F47',
                            sagegreen: '#4B8A6C',
                            tangerine: '#FA8128',
                            merigold: '#FCAE1E',
                            cider: '#B56727',
                            cantaloupe: '#FDA172',
                            sandstone: '#D67229',
                            cream: '#F7F4ED',
                            earthtext: '#2C3B32',
                            cardbg: '#FFFFFF',
                        }
                    }
                }
            }
        </script>
    </head>
    <body class="bg-gradient-to-br from-[#1E563F] via-[#4B8A6C] to-[#243D31] flex items-center justify-center min-h-screen px-4 font-sans">
        <div id="login-loading" class="fixed inset-0 bg-[#215F47]/90 backdrop-blur-md flex flex-col items-center justify-center z-[9999]" style="display: none;">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
            <p class="mt-4 text-white font-bold text-lg animate-pulse">Memuat halaman...</p>
        </div>

        <div class="bg-white/85 backdrop-blur-2xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/60 text-earthtext">
            <div class="text-center mb-6">
                <h1 class="text-xl sm:text-2xl font-bold text-deepgreen">Portal Walimurid Kelas 2A</h1>
                <p class="text-xs sm:text-sm text-earthtext/70 mt-1">Assalamualaikum, selamat datang Ayah Bunda. Mohon masukkan Username dan Password</p>
            </div>
            <form action="/login" method="POST" class="space-y-4" onsubmit="document.getElementById('login-loading').style.display='flex';">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/80 mb-1">Username</label>
                    <input type="text" name="first_name" required class="w-full px-4 py-3 border border-deepgreen/25 rounded-2xl focus:ring-2 focus:ring-deepgreen outline-none text-base bg-white/90 transition shadow-sm font-semibold text-earthtext" placeholder="Nama depan siswa">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/80 mb-1">Password</label>
                    <input type="password" name="password" required class="w-full px-4 py-3 border border-deepgreen/25 rounded-2xl focus:ring-2 focus:ring-deepgreen outline-none text-base bg-white/90 transition shadow-sm font-semibold text-earthtext" placeholder="Password akun">
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-deepgreen to-sagegreen hover:opacity-95 text-white py-3.5 rounded-2xl font-bold shadow-md transition text-base tracking-wide">Masuk</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/login', async (req, res) => {
    const { first_name, password } = req.body;
    try {
        const user = await verifyLogin(first_name, password);
        if (user && user.id) {
            const sessionId = Math.random().toString(36).substring(2);
            const isAdmin = String(user.first_name || '').trim().toLowerCase() === 'admin';
            sessions[sessionId] = { ...user, isAdmin };
            res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/`);
            
            if (isAdmin) {
                res.redirect('/admin/manage');
            } else {
                res.redirect('/dashboard');
            }
        } else {
            res.send(`<script>alert('Username atau Password salah!'); window.location.href='/login';</script>`);
        }
    } catch (err) { res.status(500).send("Error connecting to database"); }
});

app.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.redirect('/login');
});

app.get('/dashboard', checkAuth, (req, res) => {
    const content = `
    <div class="mb-6 bg-gradient-to-r from-deepgreen to-sagegreen text-white p-6 sm:p-8 rounded-[2rem] shadow-lg flex justify-between items-center border border-white/20 backdrop-blur-md">
        <div>
            <span class="text-[10px] uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full font-bold text-white">Dashboard Wali Murid</span>
            <h2 class="text-2xl sm:text-3xl font-bold mt-2 text-white">Assalamualaikum, Ayah & Bunda ${String(req.user.first_name)}</h2>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <a href="/calendar" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-sagegreen/20 text-deepgreen p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">🗓️</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Kalendar Akademik</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Agenda kelas & jadwal pribadi siswa.</p>
            </div>
        </a>
        <a href="/kas" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-sagegreen/20 text-deepgreen p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">💰</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Iuran Kas Siswa</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Pembayaran kas pribadi setiap siswa.</p>
            </div>
        </a>
        <a href="/finances" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-amber-100 text-amber-800 p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">📊</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-amber-700 transition">Laporan Keuangan</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Rincian income & expense kelas 2A.</p>
            </div>
        </a>
        <a href="/announcements" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-sky-100 text-sky-800 p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">🔔</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-sky-700 transition">Pengumuman</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Informasi resmi dari sekolah.</p>
            </div>
        </a>
        <a href="/summative" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-sagegreen/20 text-deepgreen p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">📘</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Materi Sumatif</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Kisi-kisi dan materi bulanan lengkap.</p>
            </div>
        </a>
        <a href="/change-password" class="bg-white/60 hover:bg-white/90 hover:border-tangerine/50 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition duration-300 border border-deepgreen/15 flex items-center space-x-4 group backdrop-blur-md">
            <div class="bg-sagegreen/20 text-deepgreen p-4 rounded-2xl text-2xl group-hover:scale-105 transition shadow-sm">🔒</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Ganti Password</h3>
                <p class="text-xs sm:text-sm text-earthtext/70">Ubah kata sandi akun Anda.</p>
            </div>
        </a>
    </div>`;
    res.send(layout('Dashboard', content));
});

// --- HALAMAN MATERI SUMATIF ---
app.get('/summative', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const period = req.query.period || 'month';
        const selectedMonth = req.query.month || 'Agustus 2026';
        const summativeData = db.summative || [];

        const sem1 = ["Agustus 2026", "September 2026", "Oktober 2026", "November 2026", "Ujian Semester"];
        const sem2 = ["Januari 2027", "Februari 2027", "Maret 2027", "April 2027", "Mei 2027", "Juni 2027", "Ujian Kenaikan Kelas"];
        const allMonthsList = [...sem1, ...sem2];

        let targetMonths = [];
        if (period === 'sem1') targetMonths = sem1;
        else if (period === 'sem2') targetMonths = sem2;
        else if (period === 'all') targetMonths = allMonthsList;
        else targetMonths = [selectedMonth];

        let subjects = [
            "Matematika", "Bahasa Inggris", "Seni", 
            "Bahasa Jawa", "Bahasa Indonesia", "Pancasila", "PAI"
        ];
        
        const arabicAllowed = ["Oktober", "November", "Ujian Semester", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Ujian Kenaikan Kelas"];
        let showArabic = (period !== 'month') ? true : arabicAllowed.some(m => selectedMonth.includes(m));
        if (showArabic) subjects.push("Bahasa Arab");

        const getSubjectBgColor = (subj) => {
            const s = String(subj || '').trim().toLowerCase();
            if (s === 'matematika') return 'bg-[#EAF2F8]'; // Soft distinct blue pastel for Matematika
            if (s === 'bahasa inggris') return 'bg-[#F3F8F5]';
            if (s === 'seni') return 'bg-[#FEF9E7]';
            if (s === 'bahasa jawa') return 'bg-[#FDF2F2]';
            if (s === 'bahasa indonesia') return 'bg-[#FDF3E7]';
            if (s === 'pancasila') return 'bg-[#F5F3FF]';
            if (s === 'pai') return 'bg-[#ECFDF5]';
            return 'bg-[#FFFBEB]'; // Bahasa Arab / default
        };

        let periodSelect = `
        <div class="mb-4">
            <select onchange="window.location.href='?period=' + this.value" class="w-full sm:w-auto p-3.5 border border-deepgreen/20 rounded-2xl text-sm font-bold bg-white text-earthtext outline-none focus:ring-2 focus:ring-tangerine shadow-sm">
                <option value="month" ${period === 'month' ? 'selected' : ''}>🔍 Filter: Pilih Bulan Tertentu</option>
                <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>📚 Tampilkan Semester 1 (Agustus - Ujian Smt)</option>
                <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>📚 Tampilkan Semester 2 (Januari - UKK)</option>
                <option value="all" ${period === 'all' ? 'selected' : ''}>📂 Tampilkan Semua Periode (Semua Bulan)</option>
            </select>
        </div>`;

        let monthTabs = '';
        if (period === 'month') {
            allMonthsList.forEach(m => {
                const isActive = m === selectedMonth;
                monthTabs += `<a href="/summative?period=month&month=${encodeURIComponent(m)}" class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap shadow-sm ${isActive ? 'bg-deepgreen text-white shadow' : 'bg-white/80 text-earthtext border border-deepgreen/15 hover:bg-cream'}">${m}</a>`;
            });
            monthTabs = `<div class="flex overflow-x-auto gap-2 pb-3 mb-4">${monthTabs}</div>`;
        }

        let subjectCards = '';
        
        subjects.forEach((subj) => {
            const materials = summativeData.filter(s => {
                const dbMonth = String(s.month || '').trim().toLowerCase();
                const isMonthMatch = targetMonths.some(tm => {
                    const selMonth = tm.trim().toLowerCase();
                    return (dbMonth === selMonth) || selMonth.includes(dbMonth);
                });
                const isSubjMatch = String(s.subject || '').trim().toLowerCase() === subj.toLowerCase();
                return isMonthMatch && isSubjMatch;
            });

            let materialItems = '';
            if (materials.length > 0) {
                materials.forEach(mat => {
                    let rawUrl = String(mat.link || '').trim();
                    let fileId = '';
                    if (rawUrl.includes('/file/d/')) {
                        fileId = rawUrl.split('/file/d/')[1].split('/')[0];
                    } else if (rawUrl.includes('id=')) {
                        fileId = new URLSearchParams(rawUrl.split('?')[1]).get('id');
                    }
                    const downloadUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl;

                    let monthBadge = period !== 'month' ? `<span class="text-[10px] bg-sagegreen/20 text-deepgreen px-2.5 py-0.5 rounded-full mt-1 inline-block font-bold">${mat.month || '-'}</span>` : '';

                    materialItems += `
                    <div class="p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-deepgreen/15 mb-2.5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <span class="font-bold text-sm text-earthtext block">📄 ${mat.title}</span>
                            ${monthBadge}
                        </div>
                        <div class="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <a href="${downloadUrl}" target="_blank" class="flex-1 sm:flex-none text-center bg-deepgreen text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-tangerine transition shadow-sm">Download</a>
                        </div>
                    </div>`;
                });
            } else {
                materialItems = `<p class="text-xs text-earthtext/50 italic p-3">Materi belum diunggah untuk periode ini.</p>`;
            }

            const cardBgColor = getSubjectBgColor(subj);

            subjectCards += `
            <div class="${cardBgColor} p-6 rounded-[2rem] shadow-sm border border-deepgreen/15 flex flex-col backdrop-blur-md">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="bg-sagegreen/20 text-deepgreen p-3 rounded-2xl text-xl shadow-sm">📖</div>
                    <h3 class="font-bold text-base text-earthtext">${subj}</h3>
                </div>
                <div class="space-y-2 mt-1 max-h-80 overflow-y-auto pr-1">${materialItems}</div>
            </div>`;
        });

        const content = `
        <div class="mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-earthtext">Materi & Kisi-kisi Sumatif</h2>
            <p class="text-xs sm:text-sm text-earthtext/70">Pilih periode atau bulan spesifik untuk melihat dan mendownload materi.</p>
        </div>

        ${periodSelect}
        ${monthTabs}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            ${subjectCards}
        </div>

        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a></div>`;

        res.send(layout('Materi Sumatif', content));
    } catch (e) {
        console.error("Summative Error:", e);
        res.status(500).send("Error loading summative materials");
    }
});

app.get('/calendar', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const currentDate = new Date();
        const year = req.query.year || currentDate.getFullYear();
        const month = req.query.month || String(currentDate.getMonth() + 1).padStart(2, '0');
        
        const firstDayIndex = new Date(year, month - 1, 1).getDay();
        const totalDays = new Date(year, month, 0).getDate();

        const userNotes = db.notes ? db.notes.filter(n => String(n.user_id) === String(req.user.id) && String(n.note_date).startsWith(`${year}-${month}`)) : [];
        const notesMap = {};
        userNotes.forEach(n => { notesMap[n.note_date] = n.content; });

        const globalEvents = db.events ? db.events
            .filter(e => e && e.date)
            .map(e => {
                let d = new Date(e.date);
                d.setHours(d.getHours() + 7); 
                return {
                    ...e,
                    date: d.toISOString().split('T')[0]
                };
            })
            .filter(e => String(e.date).startsWith(`${year}-${month}`)) : [];
        
        const eventsMap = {};
        globalEvents.forEach(e => { eventsMap[e.date] = e; });
        
        let calendarCells = '';
        for (let i = 0; i < firstDayIndex; i++) {
            calendarCells += `<div class="bg-white/20 min-h-[150px] rounded-3xl border border-dashed border-deepgreen/20"></div>`;
        }

        for (let d = 1; d <= totalDays; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayStr}`;
            const existingNote = notesMap[dateKey] || '';
            const globalEvent = eventsMap[dateKey];
            const holidayName = nationalHolidays[dateKey];
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            const isSunday = (dayOfWeek === 0);
            const isToday = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}` === dateKey;

            const hasAgenda = (existingNote.trim() !== '' || globalEvent);
            const cellBgClass = hasAgenda ? 'bg-amber-50/90 border-amber-200' : (isToday ? 'bg-white border-tangerine ring-2 ring-tangerine/20 shadow-md' : 'bg-white/90 border-deepgreen/15');

            let eventHtml = '';
            if (globalEvent) {
                eventHtml += `
                <div class="mb-1 p-2 bg-amber-100 border border-amber-200 rounded-2xl shadow-sm">
                    <span class="text-[10px] font-bold text-amber-900 uppercase block tracking-wider">📌 ${globalEvent.title}</span>
                    <p class="text-[11px] text-amber-950 mt-0.5 leading-tight">${globalEvent.description}</p>
                </div>`;
            }
            if (holidayName) {
                eventHtml += `
                <div class="mb-1 p-2 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                    <span class="text-[10px] font-bold text-red-700 uppercase block tracking-wider">🔴 Libur Nasional</span>
                    <p class="text-[11px] text-red-800 mt-0.5 leading-tight">${holidayName}</p>
                </div>`;
            }

            calendarCells += `
            <div class="${cellBgClass} p-3.5 rounded-[2rem] border shadow-sm flex flex-col justify-between min-h-[170px] transition">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-sm ${isToday ? 'bg-tangerine text-white w-7 h-7 rounded-full flex items-center justify-center' : (isSunday || holidayName ? 'text-red-600 font-extrabold' : 'text-earthtext')}">${d}</span>
                    </div>
                    ${eventHtml}
                </div>
                <div class="mt-2">
                    <textarea name="notes[${dateKey}]" rows="2" class="w-full text-xs p-2.5 border border-deepgreen/25 rounded-2xl resize-none focus:ring-2 focus:ring-tangerine outline-none bg-white transition" placeholder="Catatan pribadi...">${existingNote}</textarea>
                </div>
            </div>`;
        }

        const monthsList = [
            {v: '01', n: 'January'}, {v: '02', n: 'February'}, {v: '03', n: 'March'}, 
            {v: '04', n: 'April'}, {v: '05', n: 'May'}, {v: '06', n: 'June'}, 
            {v: '07', n: 'July'}, {v: '08', n: 'August'}, {v: '09', n: 'September'}, 
            {v: '10', n: 'October'}, {v: '11', n: 'November'}, {v: '12', n: 'December'}
        ];

        let monthOptions = monthsList.map(mObj => `<option value="${mObj.v}" ${mObj.v === month ? 'selected' : ''}>${mObj.n}</option>`).join('');

        const content = `
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-deepgreen text-white p-6 rounded-[2rem] shadow-sm border border-deepgreen/30">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white">Kalendar Akademik 2026/2027</h2>
                <p class="text-xs sm:text-sm text-white/90">Agenda kelas, libur nasional, dan catatan jadwal pribadi siswa.</p>
            </div>
            <form method="GET" class="flex flex-wrap items-center gap-2 sm:space-x-3 w-full md:w-auto">
                <select name="month" onchange="this.form.submit()" class="border border-white/30 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-white cursor-pointer text-earthtext">${monthOptions}</select>
                <input type="number" name="year" value="${year}" onchange="this.form.submit()" class="border border-white/30 px-3 py-2.5 rounded-2xl text-sm font-bold w-28 bg-white outline-none focus:ring-2 focus:ring-white text-earthtext">
            </form>
        </div>

        <form action="/calendar/save" method="POST">
            <input type="hidden" name="year" value="${year}">
            <input type="hidden" name="month" value="${month}">
            
            <div class="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-sm border border-deepgreen/15 p-4 sm:p-6 overflow-x-auto">
                <div class="min-w-[1000px]">
                    <div class="grid grid-cols-7 gap-3 mb-3 text-center font-bold text-xs text-deepgreen uppercase tracking-wider">
                        <div class="text-red-600 font-bold">Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div class="text-red-600 font-bold">Sat</div>
                    </div>
                    <div class="grid grid-cols-7 gap-3">
                        ${calendarCells}
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button type="submit" class="w-full sm:w-auto bg-deepgreen hover:bg-sagegreen text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition">💾 Simpan jadwal pribadi siswa</button>
            </div>
        </form>

        <div class="mt-6">
            <a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a>
        </div>`;

        res.send(layout('Kalendar Akademik', content));
    } catch (e) { res.status(500).send("Error loading calendar"); }
});

app.post('/calendar/save', checkAuth, async (req, res) => {
    const { year, month, notes } = req.body;
    try {
        const params = new URLSearchParams({
            action: 'saveAllNotes',
            user_id: req.user.id,
            year: year,
            month: month,
            notes: JSON.stringify(notes || {})
        });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null;
        res.redirect(`/calendar?year=${year}&month=${month}`);
    } catch (e) { res.status(500).send("Error saving notes"); }
});

app.get('/kas', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const userKas = db.kas.filter(k => String(k.user_id) === String(req.user.id));
        const period = req.query.period || 'sem1';

        const sem1Months = ["Juli 2026", "Agustus 2026", "September 2026", "Oktober 2026", "November 2026", "Desember 2026"];
        const sem2Months = ["Januari 2027", "Februari 2027", "Maret 2027", "April 2027", "Mei 2027", "Juni 2027"];
        let targetMonths = (period === 'sem2') ? sem2Months : (period === 'all' ? [...sem1Months, ...sem2Months] : sem1Months);

        const isPaid = (status) => String(status || '').trim().toLowerCase() === 'lunas';

        const getRowAmount = (k, isKaos = false) => {
            if (k?.amount !== undefined && k?.amount !== null && k?.amount !== "") {
                let amt = Number(k.amount);
                if (!isNaN(amt)) return amt;
            }
            return isKaos ? 68000 : 25000;
        };

        let rows = '', checkboxes = '';
        
        const kaosFound = userKas.find(k => String(k.month || '').trim().toLowerCase().includes('kaos'));
        const kaosAmount = getRowAmount(kaosFound, true);
        const isKaosPaid = isPaid(kaosFound?.status);
        
        if (period !== 'sem2') {
            rows += `
            <tr class="border-b border-deepgreen/10 hover:bg-white/40">
                <td class="py-4 px-4 font-bold text-earthtext">Iuran Kaos</td>
                <td class="py-4 px-3 text-sm text-earthtext/70">Rp ${kaosAmount.toLocaleString()}</td>
                <td class="py-4 px-3 text-center"><span class="px-3 py-1 rounded-full text-xs font-bold ${isKaosPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${isKaosPaid ? 'Lunas' : 'Belum Bayar'}</span></td>
            </tr>`;
            if (!isKaosPaid) {
                checkboxes += `
                <label class="flex items-center gap-3 p-3 bg-white rounded-2xl cursor-pointer hover:bg-cream/80 border border-deepgreen/15 transition shadow-sm">
                    <input type="checkbox" class="w-4 h-4 calc-item accent-[#FDA172]" data-price="${kaosAmount}" onchange="calcTotal()">
                    <span class="text-sm font-bold text-earthtext">Iuran Kaos</span>
                </label>`;
            }
        }

        targetMonths.forEach((m) => {
            const found = userKas.find(k => String(k.month || '').trim().toLowerCase() === m.split(' ')[0].toLowerCase());
            const paid = isPaid(found?.status);
            const rowAmount = getRowAmount(found, false);
            
            rows += `
            <tr class="border-b border-deepgreen/10 hover:bg-white/40">
                <td class="py-4 px-4 font-bold text-earthtext">${m}</td>
                <td class="py-4 px-3 text-sm text-earthtext/70">Rp ${rowAmount.toLocaleString()}</td>
                <td class="py-4 px-3 text-center"><span class="px-3 py-1 rounded-full text-xs font-bold ${paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${paid ? 'Lunas' : 'Belum Bayar'}</span></td>
            </tr>`;
            
            if (!paid) {
                checkboxes += `
                <label class="flex items-center gap-3 p-3 bg-white rounded-2xl cursor-pointer hover:bg-cream/80 border border-deepgreen/15 transition shadow-sm">
                    <input type="checkbox" class="w-4 h-4 calc-item accent-[#FDA172]" data-price="${rowAmount}" onchange="calcTotal()">
                    <span class="text-sm font-bold text-earthtext">${m}</span>
                </label>`;
            }
        });

        const content = `
        <div class="mb-6 bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-sm border border-deepgreen/15">
            <h2 class="text-2xl font-bold mb-4 text-earthtext">Iuran Kas Siswa</h2>
            <select onchange="window.location.href='?period=' + this.value" class="w-full p-3.5 border border-deepgreen/25 rounded-2xl mb-6 bg-white text-earthtext font-bold text-sm outline-none focus:ring-2 focus:ring-tangerine">
                <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>Semester 1 (Juli - Desember 2026)</option>
                <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>Semester 2 (Januari - Juni 2027)</option>
                <option value="all" ${period === 'all' ? 'selected' : ''}>Semua Periode</option>
            </select>
            
            <div class="grid lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 overflow-x-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-deepgreen/15">
                    <table class="w-full text-left">${rows}</table>
                </div>
                
                <div class="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/15 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold mb-3 text-earthtext">🧮 Kalkulator Pembayaran</h3>
                        <p class="text-xs mb-4 text-earthtext/70">Centang item di bawah untuk menghitung total pembayaran:</p>
                        
                        <label class="flex items-center gap-3 p-3 bg-white border border-deepgreen/15 rounded-2xl mb-3 cursor-pointer font-bold text-deepgreen shadow-sm">
                            <input type="checkbox" id="selectAll" class="w-4 h-4 accent-[#FDA172]" onchange="selectAll(this)"> Pilih Semua
                        </label>
                        
                        <div class="space-y-2.5 max-h-[300px] overflow-y-auto mb-4 pr-1">${checkboxes}</div>
                    </div>

                    <div>
                        <div class="mt-4 p-4 bg-white/90 rounded-2xl text-xs sm:text-sm border border-deepgreen/15 text-earthtext shadow-sm">
                            <p class="mb-2 font-bold text-deepgreen">Info Pembayaran:</p>
                            <p>BCA: 0971149581</p>
                            <p>BNI: 286855891</p>
                            <p>a.n. Nisa Syakrina</p>
                            <a href="https://wa.me/6285800327444" target="_blank" class="inline-flex items-center justify-center w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm mt-3">Konfirmasi Transfer</a>
                        </div>
                        
                        <div class="mt-4 pt-3 border-t border-deepgreen/15 font-bold text-earthtext text-sm text-center">Total Pembayaran: Rp <span id="totalDisplay">0</span></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function calcTotal() {
                let total = 0;
                document.querySelectorAll('.calc-item').forEach(c => {
                    const label = c.closest('label');
                    if (c.checked) {
                        total += parseInt(c.dataset.price);
                        label.style.backgroundColor = '#ffffff';
                    } else {
                        label.style.backgroundColor = '#ffffff';
                    }
                });
                document.getElementById('totalDisplay').innerText = total.toLocaleString();
            }
            function selectAll(source) {
                document.querySelectorAll('.calc-item').forEach(c => c.checked = source.checked);
                calcTotal();
            }
        </script>

        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a></div>`;
        
        res.send(layout('Iuran Kas', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/finances', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const usersMap = {};
        if (db.users) {
            db.users.forEach(u => { usersMap[String(u.id)] = u.first_name; });
        }
        
        const txData = (db.transactions || []).filter(tx => 
            (tx.description || tx.desc) && 
            String(tx.description || tx.desc).trim() !== "" && 
            String(tx.description || tx.desc).trim() !== "-"
        );

        const search = (req.query.search || '').toLowerCase();
        const typeFilter = req.query.type || 'all';
        const monthFilter = req.query.monthFilter || 'all';
        const startDate = req.query.start_date || '';
        const endDate = req.query.end_date || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const kasData = db.kas || [];

        let totalKas = 0, totalKaos = 0, totalLainnya = 0, totalExpense = 0;

        kasData.forEach(item => {
            if (String(item.status || '').trim().toLowerCase() === "lunas") {
                const amt = Number(item.amount || 0);
                if (String(item.month || '').trim().toLowerCase() === "kaos") {
                    totalKaos += amt;
                } else {
                    totalKas += amt;
                }
            }
        });

        txData.forEach(tx => {
            const amt = Number(tx.amount || 0);
            if (String(tx.type || '').trim().toLowerCase() === 'income') {
                totalLainnya += amt;
            } else {
                totalExpense += amt;
            }
        });

        let allTransactions = [];

        kasData.forEach(k => {
            if (String(k.status || '').trim().toLowerCase() === "lunas") {
                const name = usersMap[String(k.user_id)] || ('ID ' + k.user_id);
                const isKaos = String(k.month || '').trim().toLowerCase() === "kaos";
                allTransactions.push({
                    rawDate: k.date || "",
                    date: formatDateID(k.date),
                    desc: `${isKaos ? "Iuran Kaos" : "Iuran Kas (" + k.month + ")"} - ${name}`,
                    type: 'income',
                    amount: Number(k.amount || 0),
                    category: isKaos ? "Kaos" : "Kas",
                    month: k.month
                });
            }
        });

        txData.forEach(tx => {
            const isInc = String(tx.type || '').trim().toLowerCase() === 'income';
            allTransactions.push({
                rawDate: tx.date || "",
                date: formatDateID(tx.date),
                desc: tx.description || tx.desc || "-",
                type: isInc ? 'income' : 'expense',
                amount: Number(tx.amount || 0),
                category: tx.category || "Lainnya",
                month: ""
            });
        });

        if (search) {
            allTransactions = allTransactions.filter(t => t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search));
        }
        if (typeFilter !== 'all') {
            allTransactions = allTransactions.filter(t => t.type === typeFilter);
        }
        if (monthFilter !== 'all') {
            allTransactions = allTransactions.filter(t => t.category === "Kas" && String(t.month).trim().toLowerCase() === monthFilter.toLowerCase());
        }
        if (startDate && endDate) {
            allTransactions = allTransactions.filter(t => {
                if (!t.rawDate || t.rawDate === "-") return false;
                return t.rawDate >= startDate && t.rawDate <= endDate;
            });
        }

        allTransactions.sort((a, b) => {
            if (!a.rawDate || !b.rawDate) return 0;
            return new Date(b.rawDate) - new Date(a.rawDate);
        });

        const totalPages = Math.ceil(allTransactions.length / limit) || 1;
        const paginatedTxs = allTransactions.slice((page - 1) * limit, page * limit);

        let rows = '';
        paginatedTxs.forEach(tx => {
            const isIncome = tx.type === 'income';
            const badge = isIncome 
                ? '<span class="text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Pemasukan</span>' 
                : '<span class="text-red-800 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Pengeluaran</span>';
            
            rows += `
            <tr class="border-b border-deepgreen/10 hover:bg-white/40 transition align-top">
                <td class="py-3.5 px-3 sm:px-6 text-xs text-earthtext/70 text-center whitespace-nowrap w-[120px] font-semibold">${tx.date}</td>
                <td class="py-3.5 px-3 sm:px-6 font-bold text-earthtext text-xs sm:text-sm text-left break-words max-w-[180px] sm:max-w-md">${tx.desc}</td>
                <td class="py-3.5 px-3 sm:px-6 text-center whitespace-nowrap w-[100px]">${badge}</td>
                <td class="py-3.5 px-3 sm:px-6 font-bold text-earthtext text-xs sm:text-sm text-left whitespace-nowrap w-[160px] sm:w-[200px]">Rp ${tx.amount.toLocaleString()}</td>
            </tr>`;
        });

        const grandTotalIncome = totalKas + totalKaos + totalLainnya;
        const balance = grandTotalIncome - totalExpense;

        const monthsList = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"];
        let monthOptions = `<option value="all">Semua Bulan Kas</option>`;
        monthsList.forEach(m => {
            monthOptions += `<option value="${m}" ${monthFilter === m ? 'selected' : ''}>Cek Kas Bulan: ${m}</option>`;
        });

        const content = `
        <div class="mb-6"><h2 class="text-xl sm:text-2xl font-bold text-earthtext">Laporan Keuangan</h2><p class="text-xs sm:text-sm text-earthtext/70">Rincian pemasukan kas, kaos, transaksi lainnya, dan pengeluaran kelas 2A.</p></div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-amber-50/90 backdrop-blur-sm p-5 rounded-[2rem] shadow-sm border border-amber-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/60">Total Kas</span><h3 class="text-xl font-bold text-amber-900 mt-1">Rp ${totalKas.toLocaleString()}</h3></div>
            <div class="bg-orange-50/90 backdrop-blur-sm p-5 rounded-[2rem] shadow-sm border border-orange-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/60">Total Kaos</span><h3 class="text-xl font-bold text-orange-900 mt-1">Rp ${totalKaos.toLocaleString()}</h3></div>
            <div class="bg-amber-100/70 backdrop-blur-sm p-5 rounded-[2rem] shadow-sm border border-amber-300"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/60">Pendapatan Lain</span><h3 class="text-xl font-bold text-amber-950 mt-1">Rp ${totalLainnya.toLocaleString()}</h3></div>
            <div class="bg-red-50/90 backdrop-blur-sm p-5 rounded-[2rem] shadow-sm border border-red-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/60">Pengeluaran</span><h3 class="text-xl font-bold text-red-800 mt-1">Rp ${totalExpense.toLocaleString()}</h3></div>
        </div>

        <div class="bg-tangerine text-white p-6 rounded-[2rem] shadow-sm border border-tangerine/30 mb-6 backdrop-blur-md">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-white/90">Saldo Akhir Kas Kelas (Total Masuk - Pengeluaran)</span>
                <h3 class="text-2xl sm:text-3xl font-bold text-white mt-1">Rp ${balance.toLocaleString()}</h3>
            </div>
        </div>

        <div class="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] shadow-sm border border-deepgreen/15 mb-6">
            <form method="GET" class="flex flex-wrap items-end gap-4">
                <div class="flex-grow min-w-[200px]">
                    <label class="block text-xs font-bold text-earthtext/70 uppercase mb-1">Cari Nama / Keterangan</label>
                    <input type="text" name="search" value="${search}" placeholder="Cari nama siswa, kaos, dll..." class="w-full border border-deepgreen/25 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/70 uppercase mb-1">Bulan Kas</label>
                    <select name="monthFilter" class="border border-deepgreen/25 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                        ${monthOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/70 uppercase mb-1">Jenis</label>
                    <select name="type" class="border border-deepgreen/25 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                        <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>Semua</option>
                        <option value="income" ${typeFilter === 'income' ? 'selected' : ''}>Pemasukan</option>
                        <option value="expense" ${typeFilter === 'expense' ? 'selected' : ''}>Pengeluaran</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/70 uppercase mb-1">Dari Tanggal</label>
                    <input type="date" name="start_date" value="${startDate}" class="border border-deepgreen/25 px-3 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/70 uppercase mb-1">Sampai Tanggal</label>
                    <input type="date" name="end_date" value="${endDate}" class="border border-deepgreen/25 px-3 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="bg-deepgreen hover:bg-sagegreen text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition">Filter</button>
                    <a href="/finances" class="bg-deepgreen/10 hover:bg-deepgreen/20 text-deepgreen px-4 py-2.5 rounded-2xl text-sm font-bold transition flex items-center justify-center">Reset</a>
                </div>
            </form>
        </div>

        <div class="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-sm border border-deepgreen/15 overflow-x-auto mb-6">
            <table class="w-full min-w-[600px]">
                <thead>
                    <tr class="bg-deepgreen text-white text-xs uppercase tracking-wider font-bold">
                        <th class="py-3.5 px-3 sm:px-6 text-center w-[120px]">Tanggal</th>
                        <th class="py-3 px-3 sm:px-6 text-left">Keterangan</th>
                        <th class="py-3 px-3 sm:px-6 text-center w-[100px]">Tipe</th>
                        <th class="py-3 px-3 sm:px-6 text-left w-[160px] sm:w-[200px]">Jumlah</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="4" class="text-center py-8 text-earthtext/50 text-sm font-bold">Tidak ada data keuangan yang ditemukan.</td></tr>`}</tbody>
            </table>
        </div>

        <div class="flex justify-center items-center gap-2 mb-6 flex-wrap">
            <a href="?page=1&search=${search}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-3 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">First</a>
            ${page > 1 ? `<a href="?page=${page-1}&search=${search}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-4 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">Prev</a>` : ''}
            <span class="px-4 py-2 text-sm font-bold text-earthtext/70">Halaman ${page} dari ${totalPages}</span>
            ${page < totalPages ? `<a href="?page=${page+1}&search=${search}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-4 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">Next</a>` : ''}
            <a href="?page=${totalPages}&search=${search}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-3 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">Last (${totalPages})</a>
        </div>

        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a></div>`;
        
        res.send(layout('Laporan Keuangan', content));
    } catch (e) { 
        console.error("Finance Error:", e);
        res.status(500).send("Error loading financial report"); 
    }
});

app.get('/announcements', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const search = (req.query.search || '').toLowerCase();
        const filter = req.query.filter || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        let data = (db.announcements || []).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (search) {
            data = data.filter(a => 
                String(a.title).toLowerCase().includes(search) || 
                String(a.content).toLowerCase().includes(search)
            );
        }
        
        if (filter === 'weekly') {
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            data = data.filter(a => new Date(a.date) >= weekAgo);
        }

        const totalPages = Math.ceil(data.length / limit) || 1;
        const paginated = data.slice((page - 1) * limit, page * limit);

        let cards = '';
        paginated.forEach(a => {
            let imageHtml = '';
            let actionButtonsHtml = '';
            const rawUrl = (a.lampiran || a.image || a.file || '').trim();
            
            if (rawUrl !== '') {
                let fileId = '';
                if (rawUrl.includes('/file/d/')) {
                    const parts = rawUrl.split('/file/d/');
                    if (parts[1]) fileId = parts[1].split('/')[0];
                } else if (rawUrl.includes('id=')) {
                    const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
                    fileId = urlParams.get('id');
                }

                if (fileId) {
                    const embedUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    imageHtml = `<div class="mt-4"><img src="${embedUrl}" alt="Lampiran Pengumuman" loading="lazy" class="rounded-2xl max-h-80 w-auto object-cover border border-deepgreen/15" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${downloadUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-deepgreen hover:bg-tangerine text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                } else {
                    imageHtml = `<div class="mt-4"><img src="${rawUrl}" alt="Lampiran Pengumuman" loading="lazy" class="rounded-2xl max-h-80 w-auto object-cover border border-deepgreen/15" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" download target="_blank" class="inline-flex items-center space-x-2 bg-deepgreen hover:bg-tangerine text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                }
            }

            const contentText = String(a.content || '').replace(/\\n/g, '\n');
            cards += `
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/15 mb-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 class="font-bold text-lg text-earthtext flex items-center space-x-2"><span>📢</span><span>${a.title}</span></h3>
                    <span class="text-xs font-bold bg-cream text-earthtext px-3 py-1 rounded-full border border-deepgreen/15">${formatDateID(a.date)}</span>
                </div>
                <p class="text-earthtext/80 text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">${contentText}</p>
                ${imageHtml}
                ${actionButtonsHtml}
            </div>`;
        });

        const content = `
        <div class="mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-earthtext">Pengumuman Sekolah</h2>
            <p class="text-xs sm:text-sm text-earthtext/70">Informasi dan pengumuman resmi dari pihak sekolah untuk walimurid kelas 2A.</p>
        </div>
        <div class="bg-white/90 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-deepgreen/15 mb-6">
            <form method="GET" class="flex flex-wrap gap-3 items-center">
                <input type="text" name="search" value="${search}" placeholder="Cari judul/isi pengumuman..." class="border border-deepgreen/25 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine flex-grow text-earthtext">
                <select name="filter" class="border border-deepgreen/25 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-tangerine text-earthtext">
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>Semua Waktu</option>
                    <option value="weekly" ${filter === 'weekly' ? 'selected' : ''}>Minggu Ini</option>
                </select>
                <button type="submit" class="bg-deepgreen text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-sagegreen transition">Cari</button>
            </form>
        </div>
        <div class="space-y-4">${cards || '<div class="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] text-center text-earthtext/50 border border-deepgreen/15 font-bold">Tidak ada pengumuman yang ditemukan.</div>'}</div>
        <div class="mt-6 flex justify-center items-center gap-2">
            ${page > 1 ? `<a href="?page=${page-1}&search=${search}&filter=${filter}" class="px-4 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">Prev</a>` : ''}
            <span class="px-4 py-2 text-sm font-bold text-earthtext/70">Halaman ${page} dari ${totalPages}</span>
            ${page < totalPages ? `<a href="?page=${page+1}&search=${search}&filter=${filter}" class="px-4 py-2 bg-white/90 border border-deepgreen/20 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white">Next</a>` : ''}
        </div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Pengumuman', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/change-password', checkAuth, (req, res) => {
    const context = `
    <div class="max-w-md mx-auto bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-deepgreen/15">
        <h2 class="text-xl font-bold text-earthtext mb-6">Ganti Password</h2>
        <form action="/change-password" method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/70 mb-1">Password Lama</label>
                <input type="password" name="oldPassword" required class="w-full px-4 py-2.5 border border-deepgreen/25 rounded-2xl outline-none focus:ring-2 focus:ring-tangerine bg-white text-earthtext font-bold">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/70 mb-1">Password Baru</label>
                <input type="password" name="newPassword" required class="w-full px-4 py-2.5 border border-deepgreen/25 rounded-2xl outline-none focus:ring-2 focus:ring-tangerine bg-white text-earthtext font-bold">
            </div>
            <button type="submit" class="w-full bg-deepgreen text-white py-3 rounded-2xl font-bold hover:bg-sagegreen transition shadow-md">Simpan Password Baru</button>
        </form>
        <div class="mt-6"><a href="/dashboard" class="text-deepgreen font-bold hover:text-tangerine">&larr; Kembali ke Beranda</a></div>
    </div>`;
    res.send(layout('Ganti Password', context));
});

app.post('/change-password', checkAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (String(req.user.password).trim() !== String(oldPassword).trim()) {
        return res.send(`<script>alert('Password lama salah!'); window.location.href='/change-password';</script>`);
    }
    try {
        const params = new URLSearchParams({
            action: 'updatePassword',
            user_id: req.user.id,
            newPassword: newPassword
        });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null; 
        res.send(`<script>alert('Password berhasil diubah, silakan login kembali.'); window.location.href='/logout';</script>`);
    } catch (e) { res.status(500).send("Error updating password"); }
});

// --- DASHBOARD UTAMA ADMIN TERPUSAT (/admin/manage) ---
app.get('/admin/manage', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') {
        return res.send('<script>alert("Hanya Admin yang dapat mengakses halaman ini!"); window.location.href="/dashboard";</script>');
    }

    try {
        cacheData = null; 
        const db = await fetchDb();
        const dbJson = JSON.stringify(db, null, 2);

        const targetUserId = req.query.student_id || (db.users[0] ? db.users[0].id : '');
        const userKas = db.kas.filter(k => String(k.user_id) === String(targetUserId));

        const sem1Months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const sem2Months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
        const allMonths = ["Kaos", ...sem1Months, ...sem2Months];

        let checkboxesHtml = '';
        allMonths.forEach(m => {
            const found = userKas.find(k => String(k.month || '').trim().toLowerCase() === m.toLowerCase());
            const isPaid = String(found?.status || '').trim().toLowerCase() === 'lunas';
            
            let defaultAmt = (m.toLowerCase() === 'kaos') ? 68000 : 25000;
            let amt = (found && found.amount !== undefined && found.amount !== "") ? Number(found.amount) : defaultAmt;
            if (isNaN(amt)) amt = defaultAmt;

            const labelName = m === 'Kaos' ? `Iuran Kaos (Rp ${amt.toLocaleString()})` : `${m} (Rp ${amt.toLocaleString()})`;
            
            checkboxesHtml += `
            <label class="flex items-center space-x-3 p-3 bg-white/90 backdrop-blur-sm border border-deepgreen/15 rounded-2xl cursor-pointer hover:bg-white transition shadow-sm">
                <input type="checkbox" name="months" value="${m}" ${isPaid ? 'checked' : ''} class="w-4 h-4 accent-[#FDA172]">
                <span class="text-sm font-bold text-earthtext">${labelName}</span>
            </label>`;
        });

        let studentOptions = db.users.map(u => `<option value="${u.id}" ${String(u.id) === String(targetUserId) ? 'selected' : ''}>${u.first_name}</option>`).join('');

        const content = `
        <div class="max-w-6xl mx-auto space-y-8 pb-12">
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-deepgreen">Panel Utama Admin Kelas 2A</h2>
                    <p class="text-xs sm:text-sm text-earthtext/70">Kelola data kas, transaksi keuangan, agenda kalender, materi sumatif, dan backup database.</p>
                </div>
                <a href="/logout" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition shadow-sm whitespace-nowrap">Logout</a>
            </div>

            <!-- 1. BULK UPDATE STATUS KAS & KAOS -->
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20">
                <h3 class="font-bold text-lg text-earthtext mb-2">💵 Kelola Status Pembayaran Kas & Kaos Siswa (Bulk Update)</h3>
                <p class="text-xs text-earthtext/60 mb-4">Pilih siswa, lalu centang bulan/item yang sudah lunas dan klik Simpan.</p>
                
                <form action="/admin/update-kas-bulk" method="POST" class="space-y-4">
                    <input type="hidden" name="user_id" value="${targetUserId}">
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Pilih Nama Siswa:</label>
                        <select onchange="window.location.href='/admin/manage?student_id=' + this.value" class="border border-deepgreen/25 p-3 rounded-2xl w-full sm:w-72 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-tangerine text-earthtext">${studentOptions}</select>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        ${checkboxesHtml}
                    </div>

                    <div>
                        <button type="submit" class="bg-deepgreen hover:bg-sagegreen text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition">💾 Simpan Perubahan Kas (Bulk)</button>
                    </div>
                </form>
            </div>

            <!-- 2. TAMBAH TRANSAKSI -->
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20">
                <h3 class="font-bold text-lg text-earthtext mb-4">📊 Tambah Transaksi Keuangan (Pemasukan / Pengeluaran)</h3>
                <form action="/admin/add-transaction" method="POST" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Tanggal</label>
                        <input type="date" name="date" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Tipe</label>
                        <select name="type" class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                            <option value="income">Pemasukan</option>
                            <option value="expense">Pengeluaran</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Keterangan</label>
                        <input type="text" name="desc" placeholder="Contoh: Beli alat kelas" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Jumlah (Rp)</label>
                        <input type="number" name="amount" placeholder="50000" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                    </div>
                    <div class="w-full">
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 px-4 rounded-2xl font-bold text-sm h-[42px] shadow-sm">Simpan Transaksi</button>
                    </div>
                </form>
            </div>

            <!-- 3. TAMBAH MATERI SUMATIF -->
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20">
                <h3 class="font-bold text-lg text-earthtext mb-3">📚 Unggah Materi Sumatif</h3>
                <form action="/admin/add-summative" method="POST" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Pilih Bulan / Ujian</label>
                            <select name="month" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                                <option value="Juni 2026">Juni 2026</option>
                                <option value="Juli 2026">Juli 2026</option>
                                <option value="Agustus 2026">Agustus 2026</option>
                                <option value="September 2026">September 2026</option>
                                <option value="Oktober 2026">Oktober 2026</option>
                                <option value="November 2026">November 2026</option>
                                <option value="Ujian Semester">Ujian Semester (Desember)</option>
                                <option value="Januari 2027">Januari 2027</option>
                                <option value="Februari 2027">Februari 2027</option>
                                <option value="Maret 2027">Maret 2027</option>
                                <option value="April 2027">April 2027</option>
                                <option value="Mei 2027">Mei 2027</option>
                                <option value="Juni 2027">Juni 2027</option>
                                <option value="Ujian Kenaikan Kelas">Ujian Kenaikan Kelas (Juli 2027)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Mata Pelajaran</label>
                            <select name="subject" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                                <option value="Matematika">Matematika</option>
                                <option value="Bahasa Inggris">Bahasa Inggris</option>
                                <option value="Seni">Seni</option>
                                <option value="Bahasa Jawa">Bahasa Jawa</option>
                                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                <option value="Pancasila">Pancasila</option>
                                <option value="PAI">PAI</option>
                                <option value="Bahasa Arab">Bahasa Arab</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Judul Materi / Bab</label>
                        <input type="text" name="title" placeholder="Contoh: Bab 1 Penjumlahan & Pengurangan" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Link Google Drive File</label>
                        <input type="url" name="link" placeholder="https://drive.google.com/file/d/..." required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                    </div>
                    <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-3 rounded-2xl font-bold text-sm shadow-sm transition">Simpan Materi Sumatif</button>
                </form>
            </div>

            <!-- 4. TAMBAH KALENDER & PENGUMUMAN -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20">
                    <h3 class="font-bold text-lg text-earthtext mb-3">📅 Tambah Agenda Kalender Kelas</h3>
                    <form action="/admin/add-event" method="POST" class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Tanggal</label>
                            <input type="date" name="date" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Judul Agenda</label>
                            <input type="text" name="title" placeholder="Contoh: Ujian Tengah Semester" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/70">Keterangan</label>
                            <input type="text" name="description" placeholder="Keterangan singkat kegiatan" required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                        </div>
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 rounded-2xl font-bold text-sm shadow-sm">Simpan Kalender</button>
                    </form>
                </div>

                <div class="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-deepgreen/20">
                    <h3 class="font-bold text-lg text-earthtext mb-3">📢 Buat Pengumuman Sekolah</h3>
                    <form action="/admin/add-announcement" method="POST" class="space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input type="date" name="date" required class="border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                            <input type="text" name="title" placeholder="Judul Pengumuman" required class="border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                        </div>
                        <textarea name="content" rows="2" placeholder="Isi pengumuman..." required class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white resize-none text-earthtext font-bold"></textarea>
                        <input type="url" name="lampiran" placeholder="Link Google Drive (Opsional)" class="w-full border border-deepgreen/25 p-2.5 rounded-2xl text-sm bg-white text-earthtext font-bold">
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 rounded-2xl font-bold text-sm shadow-sm">Publikasikan</button>
                    </form>
                </div>
            </div>

            <!-- 5. BACKUP DATABASE (JSON) -->
            <div class="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 class="font-bold text-lg text-blue-900">💾 Cadangan Database (Backup)</h3>
                    <p class="text-xs text-blue-700 font-medium">Unduh file database (.json) saat ini ke komputer sebagai cadangan.</p>
                </div>
                <a id="downloadBtn" href="#" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition whitespace-nowrap">Download JSON</a>
            </div>
        </div>

        <script>
            const data = ${dbJson};
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            document.getElementById('downloadBtn').href = url;
            document.getElementById('downloadBtn').download = 'backup_portal_kelas_' + new Date().toISOString().split('T')[0] + '.json';
        </script>`;
        
        res.send(layout('Panel Utama Admin', content));
    } catch (e) {
        console.error("Admin Manage Error:", e);
        res.status(500).send("Error loading admin page");
    }
});

app.post('/admin/update-kas-bulk', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') return res.status(403).send("Unauthorized");
    try {
        let monthsInput = req.body.months || [];
        if (!Array.isArray(monthsInput)) {
            monthsInput = [monthsInput];
        }

        const params = new URLSearchParams({
            action: 'updateKasBulk',
            user_id: req.body.user_id,
            months: monthsInput.join(',')
        });
        
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null; 
        res.redirect(`/admin/manage?student_id=${req.body.user_id}`);
    } catch (e) { res.status(500).send("Gagal mengupdate kas"); }
});

app.post('/admin/add-transaction', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') return res.status(403).send("Unauthorized");
    try {
        const params = new URLSearchParams({ action: 'addTransaction', ...req.body });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null;
        res.redirect('/admin/manage');
    } catch (e) { res.status(500).send("Gagal menambah transaksi"); }
});

app.post('/admin/add-event', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') return res.status(403).send("Unauthorized");
    try {
        const params = new URLSearchParams({ action: 'addEvent', ...req.body });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null;
        res.redirect('/admin/manage');
    } catch (e) { res.status(500).send("Gagal menyimpan agenda"); }
});

app.post('/admin/add-announcement', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') return res.status(403).send("Unauthorized");
    try {
        const params = new URLSearchParams({ action: 'addAnnouncement', ...req.body });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null;
        res.redirect('/admin/manage');
    } catch (e) { res.status(500).send("Gagal mempublikasikan pengumuman"); }
});

app.post('/admin/add-summative', checkAuth, async (req, res) => {
    if (!req.user.isAdmin && String(req.user.first_name || '').trim().toLowerCase() !== 'admin') return res.status(403).send("Unauthorized");
    try {
        const params = new URLSearchParams({ action: 'addSummative', ...req.body });
        await fetch(`${SCRIPT_URL}?${params.toString()}`);
        cacheData = null;
        res.redirect('/admin/manage');
    } catch (e) { res.status(500).send("Gagal menambah materi sumatif"); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));