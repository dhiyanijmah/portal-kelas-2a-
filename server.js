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
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchDb() {
    const now = Date.now();
    if (cacheData && (now - lastFetchTime < CACHE_DURATION)) {
        return cacheData;
    }
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getData`);
        const data = await res.json();
        cacheData = data;
        lastFetchTime = now;
        return cacheData;
    } catch (e) {
        console.error("Gagal mengambil data:", e);
        return cacheData || { users: [], notes: [], kas: [], transactions: [], announcements: [], events: [] };
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
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23e57373%22><path d=%22M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z%22/></svg>">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        #loading-overlay { transition: opacity 0.3s ease; }
    </style>
</head>
<body class="bg-[#f0f4f1] text-[#1e293b] min-h-screen flex flex-col font-sans">
    <div id="loading-overlay" class="fixed inset-0 bg-[#f0f4f1] flex flex-col items-center justify-center z-[9999]" style="display: none;">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2f6636]"></div>
        <p class="mt-4 text-[#2f6636] font-bold text-lg animate-pulse">Mohon tunggu sebentar...</p>
    </div>

    <nav class="bg-[#2f6636] text-white shadow-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <a href="/dashboard" class="font-bold text-base sm:text-xl flex items-center space-x-2"><span>🌿</span><span>Portal Walimurid Kelas 2A</span></a>
            <a href="/logout" class="bg-[#244f2b] hover:bg-[#1b3d21] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-sm">Keluar</a>
        </div>
    </nav>
    <main class="max-w-6xl mx-auto p-4 sm:p-6 flex-grow w-full">
        ${content}
    </main>
    <footer class="text-center py-6 text-xs text-[#4b5563] border-t border-[#e2e8f0] bg-[#e6ede8]">Portal Walimurid Kelas 2A &copy; 2026 Dhiya</footer>
    
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23e57373%22><path d=%22M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z%22/></svg>">
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#f0f4f1] flex items-center justify-center min-h-screen px-4">
        <div id="login-loading" class="fixed inset-0 bg-[#f0f4f1] flex flex-col items-center justify-center z-[9999]" style="display: none;">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2f6636]"></div>
            <p class="mt-4 text-[#2f6636] font-bold text-lg animate-pulse">Mohon tunggu sebentar...</p>
        </div>

        <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#cbd5e1]">
            <div class="text-center mb-6">
                <h1 class="text-xl sm:text-2xl font-bold text-[#2f6636] mt-2">Portal Walimurid Kelas 2A</h1>
                <p class="text-xs sm:text-sm text-[#4b5563] mt-1">Assalamualaikum, selamat datang Ayah Bunda. Mohon untuk mengisikan Username dan Password</p>
            </div>
            <form action="/login" method="POST" class="space-y-4" onsubmit="document.getElementById('login-loading').style.display='flex';">
                <div>
                    <label class="block text-sm font-semibold text-[#1e293b] mb-1">Username</label>
                    <input type="text" name="first_name" required class="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl focus:ring-2 focus:ring-[#2f6636] outline-none text-base transition" placeholder="Input nama depan siswa">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-[#1e293b] mb-1">Password</label>
                    <input type="password" name="password" required class="w-full px-4 py-3 border border-[#cbd5e1] rounded-xl focus:ring-2 focus:ring-[#2f6636] outline-none text-base transition" placeholder="Input password">
                </div>
                <button type="submit" class="w-full bg-[#2f6636] text-white py-3 rounded-xl font-bold hover:bg-[#244f2b] shadow-md transition text-base">Masuk</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/login', async (req, res) => {
    const { first_name, password } = req.body;
    try {
        const db = await fetchDb();
        const user = db.users.find(u => 
            String(u.first_name).toLowerCase() === String(first_name).trim().toLowerCase() &&
            String(u.password).trim() === String(password).trim()
        );
        if (user) {
            const sessionId = Math.random().toString(36).substring(2);
            sessions[sessionId] = user;
            res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/`);
            res.redirect('/dashboard');
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
    <div class="mb-8 bg-gradient-to-r from-[#2f6636] to-[#40824b] text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
            <h2 class="text-2xl sm:text-3xl font-bold">Assalamualaikum, Ayah/Bunda ${String(req.user.first_name)}</h2>
        </div>
        <div class="text-4xl hidden sm:block">🌿</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/calendar" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">📅</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Kalendar Akademik</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Agenda kelas dan catatan jadwal pribadi siswa.</p>
            </div>
        </a>
        <a href="/kas" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">💵</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Iuran Kas Siswa</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Pembayaran kas pribadi setiap siswa.</p>
            </div>
        </a>
        <a href="/finances" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#fef3c7] text-[#d97706] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#d97706] group-hover:text-white transition">📊</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#d97706] transition">Laporan Keuangan</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Laporan income & expense kelas 2A 2026/2027.</p>
            </div>
        </a>
        <a href="/announcements" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e0f2fe] text-[#0284c7] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#0284c7] group-hover:text-white transition">📢</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#0284c7] transition">Pengumuman</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Pengumuman dari pihak sekolah.</p>
            </div>
        </a>
        <a href="/change-password" class="bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-[#cbd5e1] flex items-center space-x-4 sm:space-x-5 group">
            <div class="bg-[#e8f5e9] text-[#2f6636] p-3 sm:p-4 rounded-xl text-2xl sm:text-3xl group-hover:bg-[#2f6636] group-hover:text-white transition">🔑</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-[#1e293b] group-hover:text-[#2f6636] transition">Ganti Password</h3>
                <p class="text-xs sm:text-sm text-[#4b5563]">Ubah kata sandi akun Anda.</p>
            </div>
        </a>
    </div>`;
    res.send(layout('Dashboard', content));
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

        const globalEvents = db.events ? db.events.filter(e => String(e.date).startsWith(`${year}-${month}`)) : [];
        const eventsMap = {};
        globalEvents.forEach(e => { eventsMap[e.date] = e; });

        let calendarCells = '';
        for (let i = 0; i < firstDayIndex; i++) {
            calendarCells += `<div class="bg-[#f8fafc] min-h-[150px] rounded-2xl border border-dashed border-[#cbd5e1]"></div>`;
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
            const cellBgClass = hasAgenda ? 'bg-[#e8f5e9] border-[#a3e635]' : (isToday ? 'bg-white border-[#2f6636] ring-2 ring-[#a3e635]/30 shadow-md' : 'bg-white border-[#cbd5e1]');

            let eventHtml = '';
            if (globalEvent) {
                eventHtml += `
                <div class="mb-1 p-1.5 bg-[#dcfce7] border border-[#bbf7d0] rounded-xl shadow-sm">
                    <span class="text-[10px] font-bold text-[#166534] uppercase block tracking-wider">📌 ${globalEvent.title}</span>
                    <p class="text-[11px] text-[#14532d] mt-0.5 leading-tight">${globalEvent.description}</p>
                </div>`;
            }
            if (holidayName) {
                eventHtml += `
                <div class="mb-1 p-1.5 bg-[#fee2e2] border border-[#fecaca] rounded-xl shadow-sm">
                    <span class="text-[10px] font-bold text-[#991b1b] uppercase block tracking-wider">🔴 Libur Nasional</span>
                    <p class="text-[11px] text-[#7f1d1d] mt-0.5 leading-tight">${holidayName}</p>
                </div>`;
            }

            calendarCells += `
            <div class="${cellBgClass} p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[170px] transition">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-sm ${isToday ? 'bg-[#2f6636] text-white w-7 h-7 rounded-full flex items-center justify-center' : (isSunday || holidayName ? 'text-red-600 font-extrabold' : 'text-[#1e293b]')}">${d}</span>
                    </div>
                    ${eventHtml}
                </div>
                <div class="mt-2">
                    <textarea name="notes[${dateKey}]" rows="2" class="w-full text-xs p-2 border border-[#cbd5e1] rounded-xl resize-none focus:ring-2 focus:ring-[#2f6636] outline-none bg-white/80 focus:bg-white transition" placeholder="Catatan pribadi...">${existingNote}</textarea>
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
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#cbd5e1]">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Kalendar Akademik Tahun Ajaran 2026/2027</h2>
                <p class="text-xs sm:text-sm text-[#4b5563]">Agenda kelas, libur nasional, dan catatan jadwal pribadi siswa.</p>
            </div>
            <form method="GET" class="flex flex-wrap items-center gap-2 sm:space-x-3 w-full md:w-auto">
                <select name="month" onchange="this.form.submit()" class="border border-[#cbd5e1] px-4 py-2 rounded-xl text-sm font-medium bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636] cursor-pointer">${monthOptions}</select>
                <input type="number" name="year" value="${year}" onchange="this.form.submit()" class="border border-[#cbd5e1] px-3 py-2 rounded-xl text-sm font-medium w-28 bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636]">
            </form>
        </div>

        <form action="/calendar/save" method="POST">
            <input type="hidden" name="year" value="${year}">
            <input type="hidden" name="month" value="${month}">
            
            <div class="bg-white rounded-2xl shadow-sm border border-[#cbd5e1] p-4 sm:p-6 overflow-x-auto">
                <div class="min-w-[1000px]">
                    <div class="grid grid-cols-7 gap-3 mb-3 text-center font-black text-xs text-[#2f6636] uppercase tracking-wider">
                        <div class="text-red-600 font-bold">Sun</div>
                        <div class="font-bold">Mon</div>
                        <div class="font-bold">Tue</div>
                        <div class="font-bold">Wed</div>
                        <div class="font-bold">Thu</div>
                        <div class="font-bold">Fri</div>
                        <div class="text-red-600 font-bold">Sat</div>
                    </div>
                    <div class="grid grid-cols-7 gap-3">
                        ${calendarCells}
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button type="submit" class="w-full sm:w-auto bg-[#2f6636] hover:bg-[#244f2b] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition">💾 Simpan jadwal pribadi siswa</button>
            </div>
        </form>

        <div class="mt-6">
            <a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold">&larr; Kembali ke Beranda</a>
        </div>`;

        res.send(layout('Kalendar Akademik', content));
    } catch (e) { res.status(500).send("Error loading calendar"); }
});

app.post('/calendar/save', checkAuth, async (req, res) => {
    const { year, month, notes } = req.body;
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'saveAllNotes', 
                user_id: req.user.id, 
                year: year, 
                month: month, 
                notes: notes || {} 
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        cacheData = null;
        res.redirect(`/calendar?year=${year}&month=${month}`);
    } catch (e) { res.status(500).send("Error saving notes"); }
});

app.get('/kas', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const monthFilter = req.query.monthFilter || 'all';
        const userKas = db.kas.filter(k => String(k.user_id) === String(req.user.id));
        
        // Filter bulan (Contoh logic simpel)
        const filteredKas = monthFilter === 'all' ? userKas : userKas.filter(k => k.month === monthFilter);

        const content = `
        <!-- Bagian Filter Bulan -->
        <select onchange="window.location.href='?monthFilter=' + this.value">
            <option value="all">Semua Bulan</option>
            <option value="Juli">Juli</option>
            ...
        </select>

        <!-- Tabel Kas Bunda -->
        <!-- Kalkulator -->
        <div class="mt-4">
            <p>Centang item di bawah untuk menghitung total pembayaran yang ingin dibayarkan:</p>
            <label><input type="checkbox" onclick="selectAll(this)"> Pilih Semua</label>
            <!-- ... checkbox item ... -->
        </div>

        <!-- Info Pembayaran -->
        <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p>Pembayaran dapat dilakukan ke Mba Nisa (Mama Musa), selaku Bendahara Komite:</p>
            <p><strong>BCA:</strong> 0971149581<br><strong>BNI:</strong> 286855891<br>a.n. Nisa Syakrina</p>
            <p class="mt-2">Setelah transfer, wajib melakukan konfirmasi pembayaran melalui:<br><strong>Mba Nisa:</strong> +62 858-0032-7444</p>
        </div>

        <script>
            function selectAll(source) {
                document.querySelectorAll('.calc-item').forEach(c => c.checked = source.checked);
                calcTotal();
            }
        </script>
        `;
        res.send(layout('Iuran Kas', content));
    } catch(e) { res.status(500).send("Error"); }
});

app.get('/finances', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const usersMap = db.users.reduce((acc, u) => ({ ...acc, [String(u.id)]: u.first_name }), {});
        
        // Parameter Filter
        const search = (req.query.search || '').toLowerCase();
        const typeFilter = req.query.type || 'all'; // 'all', 'income', 'expense'
        const startDate = req.query.start_date || '';
        const endDate = req.query.end_date || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        // Gabungkan Data
        let allTransactions = [
            ...db.kas.filter(k => String(k.status || '').toLowerCase() === "lunas").map(k => ({
                date: k.date || "-", // Pastikan di spreadsheet ada kolom date, kalau kosong kasih placeholder
                desc: `${k.month === "Kaos" ? "Iuran Kaos" : "Iuran Kas"} - ${usersMap[String(k.user_id)] || 'ID ' + k.user_id}`,
                type: 'income',
                amount: Number(k.amount || 0),
                category: k.month === "Kaos" ? "Kaos" : "Kas"
            })),
            ...db.transactions.map(tx => ({
                date: tx.date || "-",
                desc: tx.description || tx.desc || "-",
                type: String(tx.type || '').trim().toLowerCase() === 'income' ? 'income' : 'expense',
                amount: Number(tx.amount || 0),
                category: tx.category || "Lainnya"
            }))
        ];

        // Filter Logika
        if (search) allTransactions = allTransactions.filter(t => t.desc.toLowerCase().includes(search));
        if (typeFilter !== 'all') allTransactions = allTransactions.filter(t => t.type === typeFilter);
        if (startDate && endDate) allTransactions = allTransactions.filter(t => t.date >= startDate && t.date <= endDate);

        // Sorting & Paginasi
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const totalPages = Math.ceil(allTransactions.length / limit) || 1;
        const paginatedTxs = allTransactions.slice((page - 1) * limit, page * limit);

        // Hitung Total
        const totalPendapatanKas = allTransactions.filter(t => t.category === "Kas" && t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalPendapatanKaos = allTransactions.filter(t => t.category === "Kaos" && t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalLainnya = allTransactions.filter(t => t.category !== "Kas" && t.category !== "Kaos" && t.type === 'income').reduce((s, t) => s + t.amount, 0);

        // (Lanjutkan dengan HTML rows, sama seperti pola sebelumnya, pastikan paginasi mencakup First & Last)
        // ... (Kode HTML tabel dan paginasi seperti contoh sebelumnya, pastikan pakai page=${totalPages} untuk link Last)
    } catch(e) { res.status(500).send("Error"); }
});

app.get('/announcements', checkAuth, async (req, res) => {
    try {
        const db = await fetchDb();
        const search = (req.query.search || '').toLowerCase();
        const filter = req.query.filter || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        let data = db.announcements.sort((a, b) => new Date(b.date) - new Date(a.date));

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
                    imageHtml = `<div class="mt-4"><img src="${embedUrl}" alt="Lampiran Pengumuman" class="rounded-xl max-h-80 w-auto object-cover border border-[#cbd5e1]" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-[#bbf7d0] transition"><span>📁</span><span>Buka di Google Drive</span></a>
                        <a href="${downloadUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#2f6636] hover:bg-[#244f2b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                } else {
                    imageHtml = `<div class="mt-4"><img src="${rawUrl}" alt="Lampiran Pengumuman" class="rounded-xl max-h-80 w-auto object-cover border border-[#cbd5e1]" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-[#bbf7d0] transition"><span>🔗</span><span>Buka Link</span></a>
                        <a href="${rawUrl}" download target="_blank" class="inline-flex items-center space-x-2 bg-[#2f6636] hover:bg-[#244f2b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                }
            }

            const contentText = String(a.content || '').replace(/\\n/g, '\n');
            cards += `
            <div class="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#2f6636] border border-[#cbd5e1] mb-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 class="font-bold text-lg text-[#1e293b] flex items-center space-x-2"><span>📢</span><span>${a.title}</span></h3>
                    <span class="text-xs font-semibold bg-[#f1f5f9] text-[#4b5563] px-3 py-1 rounded-full border border-[#cbd5e1]">${a.date}</span>
                </div>
                <p class="text-[#1e293b] text-sm leading-relaxed whitespace-pre-wrap break-words">${contentText}</p>
                ${imageHtml}
                ${actionButtonsHtml}
            </div>`;
        });

        const content = `
        <div class="mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-[#1e293b]">Pengumuman Sekolah</h2>
            <p class="text-xs sm:text-sm text-[#4b5563]">Informasi dan pengumuman resmi dari pihak sekolah untuk walimurid kelas 2A.</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-[#cbd5e1] mb-6">
            <form method="GET" class="flex flex-wrap gap-3 items-center">
                <input type="text" name="search" value="${search}" placeholder="Cari judul/isi pengumuman..." class="border border-[#cbd5e1] px-4 py-2 rounded-xl text-sm font-medium bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636] flex-grow">
                <select name="filter" class="border border-[#cbd5e1] px-4 py-2 rounded-xl text-sm font-medium bg-[#f8fafc] outline-none focus:ring-2 focus:ring-[#2f6636]">
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>Semua Waktu</option>
                    <option value="weekly" ${filter === 'weekly' ? 'selected' : ''}>Minggu Ini</option>
                </select>
                <button type="submit" class="bg-[#2f6636] text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-[#244f2b] transition">Cari</button>
            </form>
        </div>
        <div class="space-y-4">${cards || '<div class="bg-white p-8 rounded-2xl text-center text-gray-500 border border-[#cbd5e1]">Tidak ada pengumuman yang ditemukan.</div>'}</div>
        <div class="mt-6 flex justify-center items-center gap-2">
            ${page > 1 ? `<a href="?page=${page-1}&search=${search}&filter=${filter}" class="px-4 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm font-bold text-[#2f6636] hover:bg-[#f8fafc]">Prev</a>` : ''}
            <span class="px-4 py-2 text-sm font-bold text-[#4b5563]">Halaman ${page} dari ${totalPages}</span>
            ${page < totalPages ? `<a href="?page=${page+1}&search=${search}&filter=${filter}" class="px-4 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm font-bold text-[#2f6636] hover:bg-[#f8fafc]">Next</a>` : ''}
        </div>
        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-[#2f6636] hover:text-[#1e293b] text-sm font-semibold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Pengumuman', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/change-password', checkAuth, (req, res) => {
    const context = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-[#cbd5e1]">
        <h2 class="text-xl font-bold text-[#1e293b] mb-6">Ganti Password</h2>
        <form action="/change-password" method="POST" class="space-y-4">
            <div>
                <label class="block text-sm font-semibold text-[#1e293b]">Password Lama</label>
                <input type="password" name="oldPassword" required class="w-full px-4 py-2 border border-[#cbd5e1] rounded-xl outline-none focus:ring-2 focus:ring-[#2f6636]">
            </div>
            <div>
                <label class="block text-sm font-semibold text-[#1e293b]">Password Baru</label>
                <input type="password" name="newPassword" required class="w-full px-4 py-2 border border-[#cbd5e1] rounded-xl outline-none focus:ring-2 focus:ring-[#2f6636]">
            </div>
            <button type="submit" class="w-full bg-[#2f6636] text-white py-3 rounded-xl font-bold hover:bg-[#244f2b]">Simpan Password Baru</button>
        </form>
        <div class="mt-6"><a href="/dashboard" class="text-[#2f6636] font-semibold">&larr; Kembali ke Beranda</a></div>
    </div>`;
    res.send(layout('Ganti Password', context));
});

app.post('/change-password', checkAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (String(req.user.password).trim() !== String(oldPassword).trim()) {
        return res.send(`<script>alert('Password lama salah!'); window.location.href='/change-password';</script>`);
    }
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updatePassword', user_id: req.user.id, newPassword: newPassword }),
            headers: { 'Content-Type': 'application/json' }
        });
        cacheData = null; 
        res.send(`<script>alert('Password berhasil diubah, silakan login kembali.'); window.location.href='/logout';</script>`);
    } catch (e) { res.status(500).send("Error updating password"); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));