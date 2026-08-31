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

// Fungsi format tanggal ke format Indonesia yang rapi (misal: 27 Agustus 2026)
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

const iconSvg = (name) => {
    const icons = {
        calendar: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="7" y="10" width="34" height="31" rx="9" fill="#E5F3E9" stroke="#4B8F70" stroke-width="2.5"/>
                <path d="M7 18h34" stroke="#4B8F70" stroke-width="2.5"/>
                <path d="M15 6v8M33 6v8" stroke="#F5A34A" stroke-width="3" stroke-linecap="round"/>
                <circle cx="16" cy="25" r="2.6" fill="#F5A34A"/>
                <circle cx="24" cy="25" r="2.6" fill="#8FC8A8"/>
                <circle cx="32" cy="25" r="2.6" fill="#9ED5EA"/>
                <circle cx="16" cy="33" r="2.6" fill="#8FC8A8"/>
                <circle cx="24" cy="33" r="2.6" fill="#F5A34A"/>
            </svg>`,
        wallet: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="6" y="12" width="35" height="27" rx="8" fill="#FFF1DD" stroke="#F5A34A" stroke-width="2.5"/>
                <path d="M10 17h23c6 0 8 3 8 8v1H28c-4 0-6 2-6 5s2 5 6 5h13" fill="#FFE3C0"/>
                <path d="M28 23h13v14H28c-4 0-6-2-6-7s2-7 6-7Z" fill="#F5A34A"/>
                <circle cx="31" cy="30" r="2" fill="#FFFDF5"/>
                <path d="M10 12c0-3 2-5 5-5h8" stroke="#4B8F70" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`,
        chart: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="7" y="7" width="34" height="34" rx="10" fill="#FFF7D9" stroke="#F5A34A" stroke-width="2.5"/>
                <path d="M13 34V27" stroke="#4B8F70" stroke-width="4" stroke-linecap="round"/>
                <path d="M21 34V21" stroke="#8FC8A8" stroke-width="4" stroke-linecap="round"/>
                <path d="M29 34V25" stroke="#F5A34A" stroke-width="4" stroke-linecap="round"/>
                <path d="M13 16l7-4 8 3 7-6" stroke="#4B8F70" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="35" cy="9" r="3" fill="#F5A34A"/>
            </svg>`,
        bell: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M14 34h20l-3-5V21c0-5-3-9-7-10v-1h-2v1c-4 1-7 5-7 10v8l-1 5Z" fill="#E4F4E8" stroke="#4B8F70" stroke-width="2.5" stroke-linejoin="round"/>
                <path d="M20 38c1 2 3 3 4 3s3-1 4-3" stroke="#F5A34A" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="33" cy="12" r="6" fill="#F5A34A"/>
                <path d="M31 12l1.5 1.5L35 11" stroke="#FFFDF5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
        book: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M8 11c6-3 12-2 17 2v25c-5-4-11-5-17-2V11Z" fill="#DFF0F8" stroke="#4B8F70" stroke-width="2.5" stroke-linejoin="round"/>
                <path d="M40 11c-6-3-12-2-17 2v25c5-4 11-5 17-2V11Z" fill="#FFF0DA" stroke="#F5A34A" stroke-width="2.5" stroke-linejoin="round"/>
                <path d="M13 17c3-1 6-1 9 1M13 22c3-1 6-1 9 1M35 17c-3-1-6-1-9 1M35 22c-3-1-6-1-9 1" stroke="#7FB794" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="24" cy="10" r="3" fill="#F5A34A"/>
            </svg>`,
        lock: `
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="9" y="20" width="30" height="22" rx="8" fill="#E6F4EA" stroke="#4B8F70" stroke-width="2.5"/>
                <path d="M15 20v-5c0-6 4-10 9-10s9 4 9 10v5" stroke="#F5A34A" stroke-width="3" stroke-linecap="round"/>
                <circle cx="24" cy="30" r="3" fill="#F5A34A"/>
                <path d="M24 33v4" stroke="#F5A34A" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`
    };
    return icons[name] || icons.book;
};

const layout = (title, content) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#F9D76E">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Quicksand', 'sans-serif'],
                        display: ['Fredoka', 'Quicksand', 'sans-serif'],
                    },
                    colors: {
                        deepgreen: '#4B8F70',
                        sagegreen: '#8FC8A8',
                        tangerine: '#F5A34A',
                        merigold: '#F8D66D',
                        cider: '#C7794C',
                        cantaloupe: '#F8B98A',
                        sandstone: '#E1B36C',
                        cream: '#FFF9EF',
                        earthtext: '#29463A',
                        cardbg: '#FFFFFF',
                        mintsoft: '#E8F5EC',
                        skysoft: '#E7F5FA',
                        peachsoft: '#FFF0E5',
                        yellowsoft: '#FFF8D8',
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --portal-green: #4B8F70;
            --portal-green-dark: #356C54;
            --portal-mint: #E8F5EC;
            --portal-cream: #FFF9EF;
            --portal-yellow: #F8D66D;
            --portal-orange: #F5A34A;
            --portal-blue: #BFE4F2;
            --portal-peach: #F8B98A;
            --portal-text: #29463A;
            --portal-border: rgba(75, 143, 112, .14);
        }

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'Quicksand', sans-serif;
            color: var(--portal-text);
            min-height: 100vh;
            background:
                radial-gradient(circle at 8% 8%, rgba(248, 214, 109, .35) 0 9%, transparent 27%),
                radial-gradient(circle at 92% 7%, rgba(191, 228, 242, .45) 0 10%, transparent 30%),
                radial-gradient(circle at 90% 90%, rgba(248, 185, 138, .22) 0 8%, transparent 26%),
                linear-gradient(180deg, #FBF8EE 0%, #EFF8F1 58%, #FDF6EA 100%);
            background-attachment: fixed;
        }

        body::before,
        body::after {
            content: '';
            position: fixed;
            pointer-events: none;
            z-index: 0;
            border-radius: 999px;
            opacity: .75;
        }

        body::before {
            width: 120px;
            height: 120px;
            left: -40px;
            top: 22%;
            background: #FFF0B7;
            box-shadow: 40px 40px 0 #D9F1DE;
        }

        body::after {
            width: 150px;
            height: 150px;
            right: -55px;
            bottom: 14%;
            background: #DFF4FA;
            box-shadow: -38px -32px 0 #F8E4D5;
        }

        .portal-font-display { font-family: 'Fredoka', 'Quicksand', sans-serif; font-weight: 600; }

        h1, h2, h3, h4, h5, h6 { font-family: 'Fredoka', 'Quicksand', sans-serif !important; font-weight: 600 !important; }
        p, li, td, th, label, button, input, select, textarea { font-family: 'Quicksand', sans-serif; }

        .portal-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(255, 253, 247, .93);
            border-bottom: 1px solid rgba(75, 143, 112, .10);
            box-shadow: 0 8px 24px rgba(51, 91, 71, .07);
            backdrop-filter: blur(14px);
        }

        .portal-nav-inner {
            max-width: 1100px;
            margin: 0 auto;
            min-height: 74px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .portal-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            color: var(--portal-green-dark) !important;
            text-decoration: none;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 1.12rem;
            font-weight: 700;
            letter-spacing: .02em;
        }

        .portal-brand-badge {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: linear-gradient(145deg, #FFE57D, #FFD15C);
            border: 2px solid rgba(255,255,255,.95);
            box-shadow: 0 7px 18px rgba(197, 145, 48, .20);
            color: #7A5A1A;
        }

        .portal-logout {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px !important;
            min-width: 82px;
            border-radius: 16px !important;
            background: #FFF0EA !important;
            color: #C75A55 !important;
            border: 1px solid #FFD6CF !important;
            box-shadow: 0 6px 14px rgba(207, 99, 87, .08) !important;
        }

        .portal-main {
            position: relative;
            z-index: 1;
            width: min(1100px, calc(100% - 24px));
            margin: 0 auto;
            padding: 22px 0 34px;
        }

        .portal-shell {
            position: relative;
            overflow: hidden;
            background: rgba(255, 253, 247, .82);
            border: 1px solid rgba(255,255,255,.92);
            border-radius: 34px;
            box-shadow: 0 22px 60px rgba(62, 102, 81, .10);
            padding: clamp(18px, 3vw, 30px);
            min-height: 75vh;
        }

        .portal-shell::after {
            content: '';
            position: absolute;
            width: 230px;
            height: 230px;
            right: -80px;
            top: -90px;
            border-radius: 50%;
            background: rgba(255, 224, 130, .28);
            pointer-events: none;
        }

        .portal-footer {
            position: relative;
            z-index: 2;
            text-align: center;
            padding-top: 24px;
            margin-top: 28px;
            border-top: 1px dashed rgba(75,143,112,.18);
            color: rgba(41,70,58,.60);
            font-size: 12px;
            font-weight: 700;
        }

        .portal-page-title {
            position: relative;
            z-index: 2;
        }

        /* Global restyle for existing page components: structure and behavior stay unchanged. */
        [class*="rounded-[2rem]"],
        [class*="rounded-2xl"] {
            border-radius: 22px !important;
        }

        [class*="shadow-2xl"] { box-shadow: 0 20px 44px rgba(54, 91, 72, .10) !important; }
        [class*="shadow-lg"] { box-shadow: 0 12px 26px rgba(54, 91, 72, .09) !important; }
        [class*="shadow-md"], [class*="shadow-sm"] { box-shadow: 0 7px 18px rgba(54, 91, 72, .065) !important; }

        input, select, textarea {
            border-color: rgba(75,143,112,.16) !important;
            background: rgba(255,255,255,.88) !important;
            color: var(--portal-text) !important;
            box-shadow: 0 4px 12px rgba(75,143,112,.035);
        }

        input:focus, select:focus, textarea:focus {
            border-color: rgba(75,143,112,.44) !important;
            box-shadow: 0 0 0 4px rgba(143,200,168,.18) !important;
        }

        [class*="bg-white/50"], [class*="bg-white/55"], [class*="bg-white/60"], [class*="bg-white/70"] {
            background: rgba(255,255,255,.80) !important;
            border-color: rgba(75,143,112,.11) !important;
        }

        [class*="bg-deepgreen"] { background: var(--portal-green) !important; }
        [class*="from-deepgreen"] { --tw-gradient-from: #4B8F70 var(--tw-gradient-from-position) !important; }
        [class*="to-sagegreen"] { --tw-gradient-to: #8FC8A8 var(--tw-gradient-to-position) !important; }
        [class*="text-deepgreen"] { color: var(--portal-green-dark) !important; }
        [class*="text-earthtext"] { color: var(--portal-text) !important; }

        a, button { -webkit-tap-highlight-color: transparent; }
        button, a[class*="bg-deepgreen"] { transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease; }
        button:hover, a[class*="bg-deepgreen"]:hover { transform: translateY(-1px); }


        /* =====================================================
           CUTE TYPOGRAPHY + PAGE HEADERS
        ===================================================== */
        .portal-font-display,
        .portal-page-title,
        .page-title,
        h1.page-title,
        h2.page-title {
            font-family: 'Fredoka', 'Quicksand', sans-serif !important;
            font-weight: 600 !important;
            letter-spacing: .01em;
        }

        .page-header {
            margin-bottom: 26px !important;
            padding: 6px 4px 0;
        }

        .page-header .page-title {
            margin: 0 !important;
            font-size: clamp(28px, 4vw, 40px) !important;
            line-height: 1.08 !important;
            color: var(--portal-green-dark) !important;
            padding-bottom: 4px;
        }

        .page-header .page-title::after {
            content: '';
            display: block;
            width: 52px;
            height: 6px;
            margin-top: 10px;
            border-radius: 999px;
            background: linear-gradient(90deg, #F5A34A, #F8D66D);
        }

        .page-header + * {
            margin-top: 0 !important;
        }

        /* =====================================================
           ILLUSTRATED ICONS
        ===================================================== */
        .portal-icon-art {
            width: 56px;
            height: 56px;
            min-width: 56px;
            display: grid;
            place-items: center;
            border-radius: 19px;
            background: linear-gradient(145deg, #FFFFFF 0%, #E8F5EC 100%);
            border: 1px solid rgba(75,143,112,.12);
            box-shadow: 0 9px 18px rgba(54,91,72,.09), inset 0 1px 0 rgba(255,255,255,.95);
            transition: transform .2s ease;
        }

        .portal-icon-art svg {
            width: 34px;
            height: 34px;
            filter: drop-shadow(0 2px 1px rgba(43,90,64,.10));
        }

        a.portal-card:hover .portal-icon-art {
            transform: translateY(-2px) rotate(-2deg) scale(1.03);
        }

        .portal-icon-art.orange {
            background: linear-gradient(145deg, #FFF9ED, #FFF0DD);
        }
        .portal-icon-art.blue {
            background: linear-gradient(145deg, #F6FCFF, #E5F4FA);
        }
        .portal-icon-art.yellow {
            background: linear-gradient(145deg, #FFFDF2, #FFF5C9);
        }

        /* =====================================================
           LOADING: MOVING OVAL 0 -> 100, NO ILLUSTRATION
        ===================================================== */
        .portal-loading-card {
            width: min(370px, calc(100vw - 30px));
            padding: 30px 24px 24px;
        }

        .portal-loading-title {
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-weight: 600;
            font-size: 26px;
            color: var(--portal-green-dark);
            margin-bottom: 18px;
        }

        .portal-loading-bar {
            margin-top: 0 !important;
            height: 58px !important;
            border-radius: 999px !important;
            background: #ECEBF5 !important;
            padding: 5px !important;
            overflow: hidden !important;
            position: relative !important;
            border: 1px solid rgba(255,255,255,.92);
            box-shadow: inset 0 2px 6px rgba(63,73,67,.05);
        }

        .portal-loading-bar-fill {
            width: 0%;
            min-width: 0;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #FFD55C 0%, #FFB842 50%, #F5A34A 100%);
            color: #A96422;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 18px;
            font-weight: 600;
            white-space: nowrap;
            transition: width .08s linear;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 12px rgba(245,163,74,.16);
        }

        .portal-loading-card::before,
        .portal-loading-card::after {
            opacity: .8;
        }

        /* =====================================================
           MOBILE: ALL PAGE SAFETY
        ===================================================== */
        .portal-shell,
        .portal-card,
        form,
        section,
        article,
        .grid,
        .flex {
            min-width: 0;
        }

        .portal-main {
            overflow-x: clip;
        }

        img, svg {
            max-width: 100%;
        }

        textarea[placeholder="Catatan pribadi..."] {
            font-size: 12px !important;
            line-height: 1.45 !important;
        }

        .portal-shell {
            overflow: hidden;
        }

        @media (max-width: 640px) {
            textarea[placeholder="Catatan pribadi..."] {
                font-size: 11px !important;
            }

            .portal-shell {
                overflow: hidden;
            }

            .portal-card {
                width: 100%;
                max-width: 100%;
            }

            .portal-main {
                overflow-x: hidden !important;
            }

            .portal-shell .flex-wrap {
                max-width: 100%;
            }
        }

        @media (max-width: 640px) {
            .page-header {
                margin-bottom: 18px !important;
                padding-top: 2px;
            }

            .page-header .page-title {
                font-size: 29px !important;
            }

            .portal-card {
                padding: 15px !important;
            }

            .portal-icon-art {
                width: 51px;
                height: 51px;
                min-width: 51px;
                border-radius: 17px;
            }

            .portal-icon-art svg {
                width: 31px;
                height: 31px;
            }

            .portal-loading-card {
                padding: 27px 18px 22px;
                border-radius: 28px;
            }

            .portal-loading-title {
                font-size: 24px;
            }

            .portal-loading-bar {
                height: 54px !important;
            }

            .portal-loading-bar-fill {
                font-size: 16px;
            }

            table {
                min-width: 680px;
            }

            .overflow-x-auto {
                max-width: 100%;
                overflow-x: auto !important;
            }

            input, select, textarea, button {
                font-size: 14px !important;
            }

            button,
            a[class*="bg-"] {
                min-height: 44px;
            }
        }

        /* =====================================================
           REFERENCE-BASED VISUALS + RESPONSIVE SAFETY
        ===================================================== */
        .portal-shell img,
        .portal-card img,
        .portal-main img {
            max-width: 100%;
            height: auto;
        }

        .portal-main {
            overflow-x: hidden;
        }

        .portal-panel,
        .portal-shell,
        .portal-card,
        form,
        section,
        article {
            min-width: 0;
        }

        .overflow-x-auto,
        [style*="overflow-x: auto"] {
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
        }

        table {
            max-width: 100%;
        }

        @media (max-width: 640px) {
            body { font-size: 14px; }
            .portal-nav-inner { gap: 8px; }
            .portal-main { padding: 10px 0 24px; }
            .portal-shell { padding: 13px; border-radius: 24px; }
            .portal-footer { font-size: 11px; padding-top: 18px; margin-top: 18px; }
            .portal-brand-badge { width: 36px; height: 36px; }
            .portal-logout { min-width: 72px; padding: 8px 12px !important; }
            input, select, textarea { max-width: 100%; }
            button { max-width: 100%; }
            .grid { min-width: 0; }
            .flex { min-width: 0; }
        }

        .portal-icon-badge {
            width: 54px;
            height: 54px;
            min-width: 54px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            background: linear-gradient(145deg, #E9F6EC, #D8EFE0);
            color: var(--portal-green-dark);
            font-size: 24px;
            border: 1px solid rgba(75,143,112,.10);
        }

        .portal-card {
            background: rgba(255,255,255,.88) !important;
            border: 1px solid rgba(75,143,112,.10) !important;
            border-radius: 24px !important;
            box-shadow: 0 12px 28px rgba(54, 91, 72, .07) !important;
        }

        .portal-card:hover {
            border-color: rgba(75,143,112,.22) !important;
            box-shadow: 0 18px 34px rgba(54, 91, 72, .10) !important;
        }

        .portal-doodle {
            position: absolute;
            right: 26px;
            top: 20px;
            width: 110px;
            height: 82px;
            pointer-events: none;
            opacity: .9;
        }

        #loading-overlay {
            transition: opacity .28s ease;
            background:
                radial-gradient(circle at 15% 10%, rgba(255,236,161,.95), transparent 34%),
                radial-gradient(circle at 88% 88%, rgba(216,245,227,.95), transparent 36%),
                linear-gradient(160deg, #FFF9E7 0%, #ECF8F0 100%) !important;
            backdrop-filter: blur(8px) !important;
        }

        .portal-loading-card {
            width: min(340px, calc(100vw - 34px));
            padding: 26px 22px 24px;
            border-radius: 34px;
            background: rgba(255,255,255,.94);
            border: 1px solid rgba(255,255,255,.98);
            box-shadow: 0 28px 65px rgba(67,96,78,.14);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .portal-loading-card::before,
        .portal-loading-card::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
        }
        .portal-loading-card::before { width: 120px; height: 120px; left: -45px; top: -55px; background: #FFF2C2; }
        .portal-loading-card::after { width: 110px; height: 110px; right: -44px; bottom: -42px; background: #DFF3E4; }

        /* =====================================================
           CLEAN LOADING: 0 -> 100% LEFT TO RIGHT
           No illustration/image.
        ===================================================== */
        .portal-loading-card {
            width: min(380px, calc(100vw - 30px));
            padding: 30px 24px 24px;
            border-radius: 32px;
        }

        .portal-loading-card::before,
        .portal-loading-card::after {
            opacity: .65;
        }

        .portal-loading-title {
            margin: 0 0 18px;
            text-align: center;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 27px;
            line-height: 1.1;
            font-weight: 600;
            color: var(--portal-green-dark);
        }

        .portal-loading-bar {
            width: 100%;
            height: 58px !important;
            padding: 5px !important;
            margin: 0 !important;
            border-radius: 999px !important;
            overflow: hidden !important;
            background: #E9EAF3 !important;
            border: 1px solid rgba(255,255,255,.95);
            box-shadow: inset 0 2px 6px rgba(64,77,69,.06);
        }

        .portal-loading-bar-fill {
            width: 0%;
            min-width: 0;
            height: 100%;
            padding: 0 14px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            overflow: hidden;
            transition: width .08s linear;
            background: linear-gradient(90deg, #FFD45C 0%, #FFBA43 58%, #F5A34A 100%);
            color: #A76120;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 17px;
            font-weight: 600;
            letter-spacing: .01em;
            box-shadow: 0 5px 12px rgba(245,163,74,.17);
        }

        .portal-loading-dots {
            margin-top: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
        }

        .portal-loading-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: portalDot 1.15s ease-in-out infinite;
            background: #F5A34A;
        }

        .portal-loading-dot:nth-child(2) {
            animation-delay: .15s;
            background: #8FC8A8;
        }

        .portal-loading-dot:nth-child(3) {
            animation-delay: .30s;
            background: #9ED5EA;
        }

        @keyframes portalDot {
            0%, 100% { transform: translateY(0); opacity: .45; }
            50% { transform: translateY(-4px); opacity: 1; }
        }

        /* =====================================================
           CUTE LOGIN SCENE — pure SVG/CSS, no broken bitmap
        ===================================================== */
        .login-illustration {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 345px;
            pointer-events: none;
        }

        .login-scene-svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        .login-scene-boy,
        .login-scene-girl {
            transform-box: fill-box;
            transform-origin: center bottom;
            animation: loginSceneFloat 3.2s ease-in-out infinite;
        }

        .login-scene-girl { animation-delay: .25s; }

        @keyframes loginSceneFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .login-scene-star {
            transform-box: fill-box;
            transform-origin: center;
            animation: loginSceneSpark 2.2s ease-in-out infinite;
        }

        @keyframes loginSceneSpark {
            0%, 100% { opacity: .55; transform: scale(.92); }
            50% { opacity: 1; transform: scale(1.08); }
        }

        @media (max-width: 640px) {
            .portal-nav-inner { min-height: 66px; padding: 10px 14px; }
            .portal-main { width: min(100% - 14px, 1100px); padding-top: 10px; }
            .portal-shell { border-radius: 26px; padding: 14px; }
            .portal-brand { font-size: 1rem; }
            .portal-brand-badge { width: 38px; height: 38px; border-radius: 14px; }
        }
    
        /* =====================================================
           FINAL MOBILE-FIRST POLISH
        ===================================================== */
        .page-header {
            margin-top: 18px !important;
            margin-bottom: 26px !important;
            padding: 8px 6px 0 !important;
        }

        .page-header .page-title {
            font-family: 'Fredoka', 'Quicksand', sans-serif !important;
            font-size: clamp(32px, 5vw, 44px) !important;
            line-height: 1.08 !important;
            font-weight: 600 !important;
            letter-spacing: .01em !important;
        }

        .portal-loading-card {
            width: min(360px, calc(100vw - 30px));
            padding: 28px 22px 24px;
        }

        .portal-loading-title {
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 27px;
            font-weight: 600;
            color: var(--portal-green-dark);
            margin-bottom: 18px;
        }

        .portal-loading-bar {
            width: 100%;
            height: 58px !important;
            border-radius: 999px !important;
            background: #ECEBF5 !important;
            padding: 5px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255,255,255,.95);
            box-shadow: inset 0 2px 6px rgba(63,73,67,.05);
        }

        .portal-loading-bar-fill {
            height: 100%;
            width: 0%;
            min-width: 0;
            border-radius: 999px;
            background: linear-gradient(90deg, #FFD55C 0%, #FFB842 52%, #F5A34A 100%);
            color: #A96422;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 18px;
            font-weight: 600;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: width .06s linear;
            box-shadow: 0 5px 12px rgba(245,163,74,.16);
        }

        .portal-loading-dots {
            margin-top: 14px;
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .portal-loading-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: portalDot 1.05s ease-in-out infinite;
        }

        .portal-loading-dot:nth-child(1) { background: #F5A34A; }
        .portal-loading-dot:nth-child(2) { background: #8FC8A8; animation-delay: .14s; }
        .portal-loading-dot:nth-child(3) { background: #9ED5EA; animation-delay: .28s; }

        @keyframes portalDot {
            0%, 100% { transform: translateY(0); opacity: .45; }
            50% { transform: translateY(-5px); opacity: 1; }
        }

        /* Mobile-first page sizing */
        body { overflow-x: hidden; }
        .portal-main, .portal-shell, .portal-card, form, section, article, .grid, .flex { min-width: 0; }
        .portal-shell { overflow-x: hidden; }
        img, svg, canvas { max-width: 100%; height: auto; }
        .overflow-x-auto { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .overflow-x-auto table { min-width: 640px; }
        button, a { touch-action: manipulation; }

        @media (max-width: 760px) {
            .portal-main { width: calc(100% - 10px); padding: 8px 0 24px; }
            .portal-shell { border-radius: 24px; padding: 14px 12px 22px; }
            .portal-nav-inner { width: calc(100% - 10px); min-height: 62px; padding: 9px 5px; }
            .portal-brand { font-size: 18px; }
            .portal-brand-badge { width: 37px; height: 37px; border-radius: 13px; }
            .portal-logout { min-width: 72px; padding: 8px 12px !important; font-size: 11px !important; }
            .page-header { margin-top: 12px !important; margin-bottom: 20px !important; padding: 6px 4px 0 !important; }
            .page-header .page-title { font-size: 31px !important; }
            .page-header .page-title::after { width: 44px; height: 5px; margin-top: 8px; }
            .portal-card { border-radius: 20px !important; }
            input, select, textarea { font-size: 16px !important; }
            button { min-height: 44px; }
        }

        @media (max-width: 480px) {
            .portal-main { width: calc(100% - 6px); }
            .portal-shell { padding: 12px 10px 20px; border-radius: 22px; }
            .page-header .page-title { font-size: 29px !important; }
            .portal-loading-card { width: calc(100vw - 28px); }
            .portal-loading-title { font-size: 24px; }
            .portal-loading-bar { height: 52px !important; }
            .portal-loading-bar-fill { font-size: 16px; }
        }

        /* =====================================================
           V4 MOBILE-FIRST POLISH
        ===================================================== */
        .page-header {
            margin-top: 22px !important;
            margin-bottom: 22px !important;
            padding: 12px 10px 0 !important;
        }
        .page-header .page-title,
        h2.page-title {
            font-family: 'Fredoka', 'Quicksand', sans-serif !important;
            font-size: 30px !important;
            line-height: 1.12 !important;
            font-weight: 600 !important;
            letter-spacing: .005em !important;
            margin: 0 !important;
        }
        .page-header .page-title::after {
            width: 46px;
            height: 5px;
            margin-top: 9px;
        }
        .portal-shell {
            padding-top: clamp(16px, 2.5vw, 26px) !important;
        }
        .portal-loading-card {
            position: relative;
            margin-top: 0 !important;
        }
        #loading-overlay {
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
        }
        #login-loading {
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
        }
        .login-visual {
            min-height: 0 !important;
            justify-content: flex-start !important;
        }
        .login-copy {
            margin-top: 42px !important;
        }
        .login-copy h2 {
            font-size: clamp(36px, 5.3vw, 58px) !important;
            line-height: 1.02 !important;
        }
        .login-info-copy {
            max-width: 100% !important;
            margin-top: 13px !important;
        }
        .login-card {
            min-width: 0 !important;
        }
        .portal-main, .portal-shell, .portal-card, form, section, article {
            min-width: 0 !important;
        }
        .overflow-x-auto {
            width: 100%;
            max-width: 100%;
            overflow-x: auto !important;
        }
        @media (max-width: 640px) {
            .page-header {
                margin-top: 12px !important;
                margin-bottom: 18px !important;
                padding: 10px 8px 0 !important;
            }
            .page-header .page-title,
            h2.page-title {
                font-size: 27px !important;
            }
            .portal-shell {
                padding: 13px 12px 20px !important;
                border-radius: 24px;
            }
            .login-visual {
                padding: 22px 18px 20px !important;
                min-height: 225px !important;
            }
            .login-brand {
                font-size: 18px !important;
            }
            .login-copy {
                margin-top: 27px !important;
                max-width: 100% !important;
            }
            .login-copy h2 {
                font-size: 34px !important;
                line-height: 1.04 !important;
            }
            .login-info-copy {
                font-size: 12px !important;
                line-height: 1.5 !important;
                margin-top: 9px !important;
            }
            .login-card {
                padding: 23px 17px 26px !important;
                border-radius: 24px !important;
            }
            .login-card h1 {
                font-size: 29px !important;
            }
            .login-subtitle {
                margin: 8px 0 20px !important;
            }
            .login-input {
                min-height: 52px !important;
                font-size: 16px !important;
            }
            .login-btn {
                min-height: 52px !important;
            }
            table {
                min-width: 640px !important;
            }
            .grid {
                min-width: 0 !important;
            }
        }
        @media (max-width: 390px) {
            .page-header .page-title,
            h2.page-title {
                font-size: 25px !important;
            }
            .login-visual {
                min-height: 210px !important;
            }
            .login-copy h2 {
                font-size: 30px !important;
            }
            .login-card h1 {
                font-size: 27px !important;
            }
        }
</style>
</head>
<body class="text-earthtext min-h-screen flex flex-col selection:bg-merigold selection:text-earthtext">
    <div id="loading-overlay" class="fixed inset-0 flex items-center justify-center z-[9999]" style="display:none; opacity:0;">
        <div class="portal-loading-card">
            <div class="portal-loading-title">Loading..</div>
            <div class="portal-loading-bar" aria-label="Loading progress">
                <div id="portal-loading-progress" class="portal-loading-bar-fill" style="width:0%;"></div>
                <div id="portal-loading-percent" class="portal-loading-percent">0%</div>
                <div id="portal-loading-heart" class="portal-loading-heart" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20.4S3.5 15.1 3.5 9.2C3.5 5.8 6 3.5 9.1 3.5c1.4 0 2.4.6 2.9 1.7.5-1.1 1.5-1.7 2.9-1.7 3.1 0 5.6 2.3 5.6 5.7 0 5.9-8.5 11.2-8.5 11.2Z"/>
                    </svg>
                </div>
            </div>
            <div class="portal-loading-dots" aria-hidden="true">
                <span class="portal-loading-dot"></span>
                <span class="portal-loading-dot"></span>
                <span class="portal-loading-dot"></span>
            </div>
        </div>
    </div>

    <nav class="portal-nav">
        <div class="portal-nav-inner">
            <a href="/dashboard" class="portal-brand">
                <span class="portal-brand-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M4 11.2 12 5l8 6.2v7.1c0 .94-.76 1.7-1.7 1.7H5.7c-.94 0-1.7-.76-1.7-1.7v-7.1Z" fill="#4B8F70"/>
                        <path d="M9.5 20v-5.5h5V20" stroke="#FFFDF6" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                </span>
                <span>PORTAL 2A</span>
            </a>
            <a href="/logout" class="portal-logout text-xs font-bold transition">Logout</a>
        </div>
    </nav>

    <main class="portal-main flex-grow">
        <div class="portal-shell">
            <div class="relative z-[2]">
                ${content}
            </div>
            <footer class="portal-footer">PORTAL 2A &copy; 2026 Dhiya</footer>
        </div>
    </main>

    <script>
        let portalLoadingFrame = null;
        let portalLoadingHideTimer = null;
        let portalLoadingStart = 0;
        let portalLoadingVisible = false;

        function setPortalProgress(pct) {
            const bar = document.getElementById('portal-loading-progress');
            const percent = document.getElementById('portal-loading-percent');
            const heart = document.getElementById('portal-loading-heart');
            if (!bar || !percent || !heart) return;

            pct = Math.max(0, Math.min(100, Math.round(pct)));
            bar.style.width = pct + '%';
            percent.textContent = pct + '%';

            // Heart follows the leading edge of the filled area, from left to right.
            const track = heart.parentElement;
            const trackWidth = track ? track.clientWidth : 0;
            const heartHalf = 18;
            const x = (trackWidth - heartHalf * 2) * (pct / 100);
            heart.style.left = x + 'px';
        }

        function startPortalLoading() {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;

            cancelAnimationFrame(portalLoadingFrame);
            clearTimeout(portalLoadingHideTimer);
            portalLoadingStart = performance.now();
            portalLoadingVisible = true;
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            setPortalProgress(0);

            // Move quickly to 90%, then hold there until the destination page
            // really finishes loading. This prevents the animation from
            // finishing while the next page is still opening.
            const duration = 320;
            const maxBeforeLoad = 90;

            function tick(now) {
                if (!portalLoadingVisible) return;
                const elapsed = now - portalLoadingStart;
                const pct = Math.min(maxBeforeLoad, (elapsed / duration) * maxBeforeLoad);
                setPortalProgress(pct);
                if (pct < maxBeforeLoad) {
                    portalLoadingFrame = requestAnimationFrame(tick);
                }
            }

            portalLoadingFrame = requestAnimationFrame(tick);
        }

        function finishPortalLoading() {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;

            cancelAnimationFrame(portalLoadingFrame);
            clearTimeout(portalLoadingHideTimer);
            setPortalProgress(100);

            portalLoadingVisible = false;
            overlay.style.opacity = '0';

            setTimeout(() => {
                overlay.style.display = 'none';
                setPortalProgress(0);
            }, 120);
        }

        window.addEventListener('load', finishPortalLoading);

        window.addEventListener('pageshow', function() {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                portalLoadingVisible = false;
                cancelAnimationFrame(portalLoadingFrame);
                clearTimeout(portalLoadingHideTimer);
                overlay.style.opacity = '0';
                overlay.style.display = 'none';
                setPortalProgress(0);
            }
        });

        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (
                link &&
                link.href &&
                link.href.startsWith(window.location.origin) &&
                !link.getAttribute('target') &&
                !link.href.includes('#') &&
                link.origin === window.location.origin
            ) {
                startPortalLoading();
            }
        });

        document.addEventListener('submit', function(e) {
            if (e.defaultPrevented) return;
            startPortalLoading();
        });

        window.addEventListener('resize', function() {
            if (portalLoadingVisible) {
                const percent = document.getElementById('portal-loading-percent');
                if (percent) {
                    const pct = parseInt(percent.textContent, 10) || 0;
                    setPortalProgress(pct);
                }
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#4B8F70">
    <title>PORTAL 2A</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --green: #4B8F70;
            --green-dark: #315F4A;
            --cream: #FFF9EF;
            --yellow: #F8D66D;
            --orange: #F5A34A;
            --text: #29463A;
        }
        * { box-sizing: border-box; }
        html, body { min-height: 100%; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Quicksand', sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at 7% 7%, rgba(248,214,109,.38) 0 9%, transparent 26%),
                radial-gradient(circle at 94% 10%, rgba(191,228,242,.42) 0 10%, transparent 29%),
                linear-gradient(160deg, #FFFDF8 0%, #EEF8F0 100%);
            display: grid;
            place-items: center;
            padding: 16px;
            overflow-x: hidden;
        }
        body::before, body::after {
            content: '';
            position: fixed;
            pointer-events: none;
            border-radius: 50%;
            z-index: 0;
        }
        body::before { width: 190px; height: 190px; left: -95px; top: 16%; background:#FFF2BC; box-shadow: 65px 70px 0 #DFF3E5; }
        body::after { width: 170px; height: 170px; right: -80px; bottom: 8%; background:#FFE6D6; box-shadow:-55px -66px 0 #DDF2FA; }

        .login-wrap {
            position: relative;
            z-index: 1;
            width: min(860px, 100%);
            display: grid;
            grid-template-columns: .95fr 1.05fr;
            gap: 16px;
        }

        .login-visual,
        .login-card {
            border-radius: 34px;
            border: 1px solid rgba(255,255,255,.96);
            box-shadow: 0 24px 60px rgba(55,91,72,.11);
        }

        .login-visual {
            min-height: 590px;
            padding: 38px;
            background:
                radial-gradient(circle at 82% 18%, rgba(255,255,255,.85) 0 7%, transparent 7.5%),
                radial-gradient(circle at 20% 72%, rgba(255,218,106,.22) 0 9%, transparent 9.5%),
                linear-gradient(160deg, #EAF8EE, #FFF8E6);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-start;
        }

        .login-visual::before {
            content: '';
            position: absolute;
            width: 260px;
            height: 260px;
            border-radius: 50%;
            left: -100px;
            bottom: -115px;
            background: rgba(255,255,255,.55);
        }
        .login-visual::after {
            content: '';
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            right: 50px;
            top: 82px;
            background: var(--orange);
            box-shadow: -36px 54px 0 #9ED5EA, -66px 8px 0 #F8D66D;
        }

        .login-brand {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 11px;
            font-family: 'Fredoka', sans-serif;
            font-weight: 600;
            font-size: 24px;
            color: var(--green-dark);
        }
        .login-brand-mark {
            width: 44px;
            height: 44px;
            border-radius: 15px;
            display: grid;
            place-items: center;
            background: linear-gradient(145deg,#FFE680,#FFD15A);
            color: #6E541B;
            box-shadow: 0 9px 18px rgba(197,150,48,.16);
        }
        .login-copy {
            position: relative;
            z-index: 2;
            margin-top: 76px;
        }
        .login-copy h2 {
            margin: 0;
            font-family: 'Fredoka', sans-serif;
            font-size: clamp(40px, 5.5vw, 64px);
            line-height: .98;
            font-weight: 600;
            color: var(--green-dark);
        }
        .login-copy p {
            margin: 17px 0 0;
            max-width: 320px;
            font-size: 15px;
            line-height: 1.7;
            font-weight: 600;
            color: rgba(41,70,58,.70);
        }
        .login-mini-note {
            position: absolute;
            z-index: 2;
            left: 38px;
            bottom: 34px;
            font-size: 12px;
            font-weight: 700;
            color: rgba(41,70,58,.58);
        }

        .login-card {
            min-height: 590px;
            padding: 42px;
            background: rgba(255,255,255,.96);
            display: flex;
            align-items: center;
        }
        .login-inner { width: 100%; max-width: 390px; margin: 0 auto; }
        .login-card h1 {
            margin: 0;
            font-family: 'Fredoka', sans-serif;
            font-size: 36px;
            line-height: 1;
            font-weight: 600;
            color: var(--green-dark);
        }
        .login-subtitle {
            margin: 9px 0 28px;
            font-size: 13px;
            line-height: 1.6;
            font-weight: 600;
            color: rgba(41,70,58,.68);
        }
        .login-form { display:grid; gap:16px; }
        .login-label { display:block; margin-bottom:7px; font-size:12px; font-weight:700; color:rgba(41,70,58,.78); }
        .login-input-wrap { position:relative; }
        .login-input {
            width:100%;
            min-height:52px;
            border:1px solid rgba(75,143,112,.16);
            background:#FFFEFB;
            color:var(--text);
            padding:13px 15px 13px 46px;
            border-radius:17px;
            outline:none;
            font:600 15px 'Quicksand', sans-serif;
            box-shadow:0 6px 15px rgba(74,103,84,.035);
        }
        .login-input:focus { border-color:rgba(75,143,112,.48); box-shadow:0 0 0 4px rgba(143,200,168,.17); }
        .login-input-icon { position:absolute; left:15px; top:50%; transform:translateY(-50%); width:18px; height:18px; color:#5A9A79; pointer-events:none; }
        .login-btn {
            width:100%;
            min-height:54px;
            border:0;
            border-radius:18px;
            cursor:pointer;
            background:linear-gradient(90deg,#55A77C,#75BA92);
            color:#fff;
            font:600 17px 'Fredoka', sans-serif;
            box-shadow:0 14px 24px rgba(74,151,105,.19);
        }

        #login-loading { position:fixed; inset:0; z-index:9999; display:none; place-items:center; background:linear-gradient(160deg,rgba(255,248,221,.97),rgba(233,247,238,.97)); backdrop-filter:blur(10px); }
        .login-loading-card { width:min(350px,calc(100vw - 28px)); padding:28px 22px 24px; border-radius:30px; background:#fff; box-shadow:0 25px 60px rgba(50,80,65,.14); text-align:center; }
        .login-loading-title { font:600 26px 'Fredoka',sans-serif; color:var(--green-dark); margin-bottom:16px; }
        .login-loading-bar { width:100%; height:56px; padding:5px; background:#ECEBF5; border-radius:999px; overflow:hidden; }
        .login-loading-fill { height:100%; width:0; border-radius:999px; background:linear-gradient(90deg,#FFD55C,#FFB842,#F5A34A); color:#A96422; display:flex; align-items:center; justify-content:center; font:600 17px 'Fredoka',sans-serif; transition:width .06s linear; }
        .login-loading-dots { display:flex; justify-content:center; gap:8px; margin-top:12px; }
        .login-loading-dots span { width:8px; height:8px; border-radius:50%; animation:loginDot 1.05s ease-in-out infinite; }
        .login-loading-dots span:nth-child(1){background:#F5A34A}.login-loading-dots span:nth-child(2){background:#8FC8A8;animation-delay:.14s}.login-loading-dots span:nth-child(3){background:#9ED5EA;animation-delay:.28s}
        @keyframes loginDot{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-5px);opacity:1}}

        @media(max-width:760px){
            body { padding:10px; }
            .login-wrap { width:100%; max-width:520px; grid-template-columns:1fr; gap:12px; }
            .login-visual { min-height:250px; padding:24px 22px; border-radius:26px; }
            .login-brand { font-size:19px; }
            .login-brand-mark { width:38px; height:38px; border-radius:13px; }
            .login-copy { margin-top:34px; }
            .login-copy h2 { font-size:38px; }
            .login-copy p { font-size:13px; max-width:260px; margin-top:11px; }
            .login-mini-note { left:22px; bottom:20px; font-size:10px; }
            .login-card { min-height:unset; padding:25px 19px 28px; border-radius:26px; }
            .login-card h1 { font-size:30px; }
            .login-subtitle { margin-bottom:22px; }
            .login-input { font-size:16px; min-height:52px; }
        }
        @media(max-width:390px){
            .login-visual { min-height:225px; }
            .login-copy h2 { font-size:33px; }
            .login-copy p { font-size:12px; }
            .login-card { padding:21px 15px 24px; }
        }
    
        /* No decorative half-circle in the top-right corner */
        .portal-shell::after {
            display: none !important;
        }

        /* V5 loading heart tracker */
        #loading-overlay {
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
        }
        .portal-loading-card {
            margin: 0 !important;
            width: min(360px, calc(100vw - 28px));
            padding: 24px 22px 20px !important;
        }
        .portal-loading-bar {
            position: relative !important;
            isolation: isolate;
        }
        .portal-loading-bar-fill {
            position: absolute !important;
            left: 5px;
            top: 5px;
            bottom: 5px;
            width: 0;
            min-width: 0 !important;
            z-index: 1;
            background: linear-gradient(90deg, #6EAAD8 0%, #6AA2D0 100%) !important;
            box-shadow: none !important;
            transition: width .06s linear !important;
        }
        .portal-loading-percent {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3D566B;
            font-family: 'Fredoka', 'Quicksand', sans-serif;
            font-size: 17px;
            font-weight: 600;
            pointer-events: none;
        }
        .portal-loading-heart {
            position: absolute;
            left: 0;
            top: 50%;
            width: 36px;
            height: 36px;
            transform: translateY(-50%);
            z-index: 4;
            display: grid;
            place-items: center;
            transition: left .06s linear;
            filter: drop-shadow(0 4px 6px rgba(217,58,93,.18));
        }
        .portal-loading-heart svg {
            width: 36px;
            height: 36px;
            display: block;
            fill: #D92F5A;
            stroke: #C62B52;
            stroke-width: .55;
        }
        .portal-loading-dots {
            margin-top: 10px !important;
        }

        /* Login information: clean two-line hierarchy */
        .login-info-copy {
            max-width: 310px !important;
            line-height: 1.45 !important;
        }
        .login-info-copy br {
            display: block;
        }

        /* Download buttons on Summative: centered label */
        .summative-download-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            min-width: 112px !important;
            width: max-content !important;
            flex: 0 0 auto !important;
            white-space: nowrap !important;
            font-size: 13px !important;
            line-height: 1 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
        }


        .summative-download-btn { position: relative; }
        .summative-download-btn-parent {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
        }
        @media (max-width: 640px) {
            .summative-download-btn-parent {
                width: 100% !important;
                justify-content: center !important;
            }
        }

        /* Phone-first polish */
        @media (max-width: 640px) {
            #loading-overlay {
                padding: 14px !important;
            }
            .portal-loading-card {
                width: min(350px, calc(100vw - 24px));
                padding: 22px 16px 18px !important;
                border-radius: 26px !important;
            }
            .portal-loading-bar {
                height: 52px !important;
            }
            .portal-loading-heart {
                width: 32px;
                height: 32px;
            }
            .portal-loading-heart svg {
                width: 32px;
                height: 32px;
            }
            .portal-loading-percent {
                font-size: 16px;
            }
            .login-wrap {
                width: 100% !important;
                gap: 10px !important;
            }
            .login-visual,
            .login-card {
                width: 100% !important;
            }
            .login-info-copy {
                max-width: 250px !important;
            }
            .summative-download-btn {
                width: max-content !important;
                min-width: 112px !important;
                flex: 0 0 auto !important;
                font-size: 13px !important;
            }
        }
</style>
</head>
<body>
    <div id="login-loading">
        <div class="login-loading-card">
            <div class="login-loading-title">Loading..</div>
            <div class="login-loading-bar">
                <div id="login-loading-fill" class="login-loading-fill">0%</div>
            </div>
            <div class="login-loading-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
    </div>

    <div class="login-wrap">
        <section class="login-visual">
            <div>
                <div class="login-brand">
                    <div class="login-brand-mark" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M4 11.2 12 5l8 6.2v7.1c0 .94-.76 1.7-1.7 1.7H5.7c-.94 0-1.7-.76-1.7-1.7v-7.1Z" fill="#4B8F70"/>
                            <path d="M9.5 20v-5.5h5V20" stroke="#FFFDF6" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <span>PORTAL 2A</span>
                </div>
                <div class="login-copy">
                    <h2>Portal<br>Walimurid<br>Kelas 2A</h2>
                    <p class="login-info-copy">Ruang informasi kelas 2A<br>untuk Ayah dan Bunda</p>
                </div>
            </div>
        </section>

        <section class="login-card">
            <div class="login-inner">
                <h1>Assalamualaikum 👋</h1>
                <p class="login-subtitle">Selamat datang Ayah Bunda.<br>Mohon masukkan Username dan Password</p>

                <form action="/login" method="POST" class="login-form" onsubmit="startLoginLoading();">
                    <div>
                        <label class="login-label">Username</label>
                        <div class="login-input-wrap">
                            <svg class="login-input-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19c.8-3.1 2.9-4.7 6.5-4.7s5.7 1.6 6.5 4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                            <input type="text" name="first_name" required class="login-input" placeholder="Nama Siswa" autocomplete="username">
                        </div>
                    </div>
                    <div>
                        <label class="login-label">Password</label>
                        <div class="login-input-wrap">
                            <svg class="login-input-icon" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                            <input type="password" name="password" required class="login-input" placeholder="Password Akun" autocomplete="current-password">
                        </div>
                    </div>
                    <button type="submit" class="login-btn">Masuk <span aria-hidden="true">›</span></button>
                </form>
            </div>
        </section>
    </div>

    <script>
        let loginLoadingFrame = null;
        window.addEventListener('pageshow', function() {
            const overlay = document.getElementById('login-loading');
            if (overlay) overlay.style.display = 'none';
        });
        function startLoginLoading() {
            const overlay = document.getElementById('login-loading');
            const fill = document.getElementById('login-loading-fill');
            if (!overlay || !fill) return;

            cancelAnimationFrame(loginLoadingFrame);
            overlay.style.display = 'grid';
            fill.style.width = '0%';
            fill.textContent = '0%';

            const start = performance.now();
            const duration = 300;
            const maxPct = 90;

            function tick(now) {
                const pct = Math.min(maxPct, Math.round(((now - start) / duration) * maxPct));
                fill.style.width = pct + '%';
                fill.textContent = pct + '%';
                if (pct < maxPct) loginLoadingFrame = requestAnimationFrame(tick);
            }

            loginLoadingFrame = requestAnimationFrame(tick);
        }
    </script>
</body>
</html>`);
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
    <div class="mb-7 relative overflow-hidden bg-gradient-to-r from-[#E7F5EA] to-[#FFF7DD] text-earthtext p-6 sm:p-8 rounded-[28px] shadow-lg border border-white/90">
        <div>
            <span class="text-[10px] uppercase tracking-widest bg-white/75 px-3 py-1 rounded-full font-bold text-deepgreen border border-white">Dashboard Wali Murid</span>
            <h2 class="portal-font-display text-2xl sm:text-3xl font-bold mt-2 text-deepgreen">Assalamualaikum,<br>Ayah &amp; Bunda ${String(req.user.first_name)}</h2><div class="mt-3 flex gap-2" aria-hidden="true"><span class="w-2.5 h-2.5 rounded-full bg-[#F5A34A]"></span><span class="w-2.5 h-2.5 rounded-full bg-[#8FC8A8]"></span><span class="w-2.5 h-2.5 rounded-full bg-[#BFE4F2]"></span></div>
        </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <a href="/calendar" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art">${iconSvg('calendar')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Kalendar Akademik</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Agenda kelas & jadwal pribadi siswa.</p>
            </div>
        </a>
        <a href="/kas" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art orange">${iconSvg('wallet')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Iuran Kas Siswa</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Pembayaran kas pribadi setiap siswa.</p>
            </div>
        </a>
        <a href="/finances" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art yellow">${iconSvg('chart')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-amber-900 transition">Laporan Keuangan</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Rincian income & expense kelas 2A.</p>
            </div>
        </a>
        <a href="/announcements" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art blue">${iconSvg('bell')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-sky-900 transition">Pengumuman</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Informasi resmi dari sekolah.</p>
            </div>
        </a>
        <a href="/summative" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art blue">${iconSvg('book')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Materi Sumatif</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Kisi-kisi dan materi bulanan lengkap.</p>
            </div>
        </a>
        <a href="/change-password" class="portal-card p-5 sm:p-6 flex items-center space-x-4 group transition duration-300">
            <div class="portal-icon-art">${iconSvg('lock')}</div>
            <div>
                <h3 class="font-bold text-base sm:text-lg text-earthtext group-hover:text-deepgreen transition">Ganti Password</h3>
                <p class="text-xs sm:text-sm text-earthtext/80">Ubah kata sandi akun Anda.</p>
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
            if (s === 'matematika') return 'bg-purple-100/75 backdrop-blur-md border border-white/70'; // Ungu muda
            if (s === 'bahasa inggris') return 'bg-blue-100/75 backdrop-blur-md border border-white/70'; // Biru muda
            if (s === 'seni') return 'bg-amber-100/75 backdrop-blur-md border border-white/70'; // Kuning muda
            if (s === 'bahasa jawa') return 'bg-[#EEDFCC]/75 backdrop-blur-md border border-white/70'; // Cokelat muda
            if (s === 'bahasa indonesia') return 'bg-rose-100/75 backdrop-blur-md border border-white/70'; // Merah muda
            if (s === 'pancasila') return 'bg-yellow-100/75 backdrop-blur-md border border-white/70'; // Emas muda
            if (s === 'pai') return 'bg-emerald-100/75 backdrop-blur-md border border-white/70'; // Hijau muda
            return 'bg-white/50 backdrop-blur-md border border-white/70';
        };

        let periodSelect = `
        <div class="mb-4">
            <select onchange="window.location.href='?period=' + this.value" class="w-full sm:w-auto p-3.5 border border-white/70 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md text-earthtext outline-none focus:ring-2 focus:ring-tangerine shadow-md">
                <option value="month" ${period === 'month' ? 'selected' : ''}>Filter: Pilih Bulan Tertentu</option>
                <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>Tampilkan Semester 1 (Agustus - Ujian Smt)</option>
                <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>Tampilkan Semester 2 (Januari - UKK)</option>
                <option value="all" ${period === 'all' ? 'selected' : ''}>Tampilkan Semua Periode (Semua Bulan)</option>
            </select>
        </div>`;

        let monthTabs = '';
        if (period === 'month') {
            allMonthsList.forEach(m => {
                const isActive = m === selectedMonth;
                monthTabs += `<a href="/summative?period=month&month=${encodeURIComponent(m)}" class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap shadow-sm ${isActive ? 'bg-deepgreen text-white shadow' : 'bg-white/50 text-earthtext border border-white/70 hover:bg-white/80 backdrop-blur-sm'}">${m}</a>`;
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

                    let monthBadge = period !== 'month' ? `<span class="text-[10px] bg-sagegreen/20 text-deepgreen px-2.5 py-0.5 rounded-full mt-1 inline-block font-bold whitespace-nowrap">${mat.month || '-'}</span>` : '';

                    materialItems += `
                    <div class="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 mb-2.5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <span class="font-bold text-sm text-earthtext block">📄 ${mat.title}</span>
                            ${monthBadge}
                        </div>
                        <div class="summative-download-btn-parent flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <a href="${downloadUrl}" target="_blank" class="summative-download-btn flex-1 sm:flex-none text-center bg-deepgreen text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-tangerine transition shadow-sm">Download</a>
                        </div>
                    </div>`;
                });
            } else {
                materialItems = `<p class="text-xs text-earthtext/60 italic p-3">Materi belum diunggah untuk periode ini.</p>`;
            }

            const cardBgColor = getSubjectBgColor(subj);

            subjectCards += `
            <div class="${cardBgColor} p-6 rounded-[2rem] shadow-sm border border-white/70 flex flex-col backdrop-blur-md">
                <div class="mb-4">
                    <h3 class="font-bold text-lg text-earthtext">${subj}</h3>
                </div>
                <div class="space-y-2 mt-1 max-h-80 overflow-y-auto pr-1">${materialItems}</div>
            </div>`;
        });

        const content = `
        <div class="page-header">
            <h2 class="page-title">Materi & Kisi-kisi Sumatif</h2>
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
            calendarCells += `<div class="bg-white/10 min-h-[170px] rounded-[2rem] border border-dashed border-white/25"></div>`;
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
            const cellBgClass = hasAgenda ? 'bg-amber-100/90 border-amber-300 backdrop-blur-md shadow-sm' : (isToday ? 'bg-white/90 border-tangerine ring-2 ring-tangerine/20 shadow-md backdrop-blur-md' : 'bg-white/50 border-white/70 backdrop-blur-md');

            let eventHtml = '';
            if (globalEvent) {
                eventHtml += `
                <div class="mb-1 p-2 bg-amber-200/90 border border-amber-300 rounded-2xl shadow-sm">
                    <span class="text-[10px] font-bold text-amber-900 uppercase block tracking-wider">📌 ${globalEvent.title}</span>
                    <p class="text-[11px] text-amber-950 mt-0.5 leading-tight">${globalEvent.description}</p>
                </div>`;
            }
            if (holidayName) {
                eventHtml += `
                <div class="mb-1 p-2 bg-red-100/90 border border-red-200 rounded-2xl shadow-sm">
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
                    <textarea name="notes[${dateKey}]" rows="2" class="w-full text-xs p-2.5 border border-white/70 rounded-2xl resize-none focus:ring-2 focus:ring-tangerine outline-none bg-white/70 backdrop-blur-sm transition text-earthtext font-medium" placeholder="Catatan pribadi...">${existingNote}</textarea>
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
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-deepgreen/90 backdrop-blur-md text-white p-6 rounded-[2rem] shadow-sm border border-white/30">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white">Kalendar Akademik 2026/2027</h2>
            </div>
            <form method="GET" class="flex flex-wrap items-center gap-2 sm:space-x-3 w-full md:w-auto">
                <select name="month" onchange="this.form.submit()" class="border border-white/40 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/90 backdrop-blur-sm outline-none focus:ring-2 focus:ring-white cursor-pointer text-earthtext shadow-md">${monthOptions}</select>
                <input type="number" name="year" value="${year}" onchange="this.form.submit()" class="border border-white/40 px-3 py-2.5 rounded-2xl text-sm font-bold w-28 bg-white/90 backdrop-blur-sm outline-none focus:ring-2 focus:ring-white text-earthtext shadow-md">
            </form>
        </div>

        <form action="/calendar/save" method="POST">
            <input type="hidden" name="year" value="${year}">
            <input type="hidden" name="month" value="${month}">
            
            <div class="bg-white/50 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/70 p-4 sm:p-6 overflow-x-auto">
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

        let kasCardsHtml = '';
        let checkboxes = '';
        
        const kaosFound = userKas.find(k => String(k.month || '').trim().toLowerCase().includes('kaos'));
        const kaosAmount = getRowAmount(kaosFound, true);
        const isKaosPaid = isPaid(kaosFound?.status);
        
        if (period !== 'sem2') {
            const cardBg = isKaosPaid ? 'bg-amber-100/80 border-amber-200' : 'bg-red-100/80 border-red-200';
            kasCardsHtml += `
            <div class="flex items-center justify-between p-4 ${cardBg} rounded-2xl border shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_2px_3px_rgba(255,255,255,0.9)] transition">
                <div>
                    <span class="font-bold text-sm text-earthtext whitespace-nowrap block">Iuran Kaos</span>
                    <span class="text-xs text-earthtext/80 whitespace-nowrap">Rp ${kaosAmount.toLocaleString()}</span>
                </div>
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${isKaosPaid ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}">${isKaosPaid ? 'Lunas' : 'Belum Bayar'}</span>
                </div>
            </div>`;

            if (!isKaosPaid) {
                checkboxes += `
                <label class="flex items-center justify-between gap-3 p-3.5 bg-white/60 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-white/90 border border-white/75 transition shadow-sm">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="w-4 h-4 calc-item accent-[#215F47]" data-price="${kaosAmount}" onchange="calcTotal()">
                        <span class="text-sm font-bold text-earthtext whitespace-nowrap">Iuran Kaos</span>
                    </div>
                    <span class="text-xs font-bold text-earthtext/70 whitespace-nowrap">Rp ${kaosAmount.toLocaleString()}</span>
                </label>`;
            }
        }

        targetMonths.forEach((m) => {
            const found = userKas.find(k => String(k.month || '').trim().toLowerCase() === m.split(' ')[0].toLowerCase());
            const paid = isPaid(found?.status);
            const rowAmount = getRowAmount(found, false);
            const cardBg = paid ? 'bg-amber-100/80 border-amber-200' : 'bg-red-100/80 border-red-200';
            
            kasCardsHtml += `
            <div class="flex items-center justify-between p-4 ${cardBg} rounded-2xl border shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_2px_3px_rgba(255,255,255,0.9)] transition">
                <div>
                    <span class="font-bold text-sm text-earthtext whitespace-nowrap block">${m}</span>
                    <span class="text-xs text-earthtext/80 whitespace-nowrap">Rp ${rowAmount.toLocaleString()}</span>
                </div>
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${paid ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}">${paid ? 'Lunas' : 'Belum Bayar'}</span>
                </div>
            </div>`;
            
            if (!paid) {
                checkboxes += `
                <label class="flex items-center justify-between gap-3 p-3.5 bg-white/60 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-white/90 border border-white/75 transition shadow-sm">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" class="w-4 h-4 calc-item accent-[#215F47]" data-price="${rowAmount}" onchange="calcTotal()">
                        <span class="text-sm font-bold text-earthtext whitespace-nowrap">${m}</span>
                    </div>
                    <span class="text-xs font-bold text-earthtext/70 whitespace-nowrap">Rp ${rowAmount.toLocaleString()}</span>
                </label>`;
            }
        });

        const content = `
        <div class="mb-6 bg-white/50 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white/70">
            <h2 class="text-2xl font-bold mb-4 text-earthtext">Iuran Kas Siswa</h2>
            <select onchange="window.location.href='?period=' + this.value" class="w-full p-3.5 border border-white/70 rounded-2xl mb-6 bg-white/70 backdrop-blur-md text-earthtext font-bold text-sm outline-none focus:ring-2 focus:ring-tangerine shadow-md">
                <option value="sem1" ${period === 'sem1' ? 'selected' : ''}>Semester 1 (Juli - Desember 2026)</option>
                <option value="sem2" ${period === 'sem2' ? 'selected' : ''}>Semester 2 (Januari - Juni 2027)</option>
                <option value="all" ${period === 'all' ? 'selected' : ''}>Semua Periode</option>
            </select>
            
            <div class="grid lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-3 bg-white/50 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/70 p-4 max-h-[500px] overflow-y-auto">
                    ${kasCardsHtml}
                </div>
                
                <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold mb-3 text-earthtext">🧮 Kalkulator Pembayaran</h3>
                        <p class="text-xs mb-4 text-earthtext/80">Centang item di bawah untuk menghitung total pembayaran:</p>
                        
                        <label class="flex items-center gap-3 p-3.5 bg-white/70 backdrop-blur-sm border border-white/75 rounded-2xl mb-3 cursor-pointer font-bold text-deepgreen shadow-sm">
                            <input type="checkbox" id="selectAll" class="w-4 h-4 accent-[#215F47]" onchange="selectAll(this)"> Pilih Semua
                        </label>
                        
                        <div class="space-y-2.5 max-h-[300px] overflow-y-auto mb-4 pr-1">${checkboxes}</div>
                    </div>

                    <div>
                        <div class="mt-4 p-4 bg-white/70 backdrop-blur-md rounded-2xl text-xs sm:text-sm border border-white/75 text-earthtext shadow-sm">
                            <p class="mb-2 font-bold text-deepgreen">Info Pembayaran:</p>
                            <p>BCA: 0971149581</p>
                            <p>BNI: 286855891</p>
                            <p>a.n. Nisa Syakrina</p>
                            <a href="https://wa.me/6285800327444" target="_blank" class="inline-flex items-center justify-center w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm mt-3">Konfirmasi Transfer</a>
                        </div>
                        
                        <div class="mt-4 pt-3 border-t border-white/30 font-bold text-earthtext text-sm text-center">Total Pembayaran: Rp <span id="totalDisplay">0</span></div>
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
                        label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    } else {
                        label.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
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
                ? '<span class="text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Pemasukan</span>' 
                : '<span class="text-red-800 bg-red-100/90 border border-red-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Pengeluaran</span>';
            
            rows += `
            <tr class="border-b border-white/20 hover:bg-white/20 transition align-top">
                <td class="py-3.5 px-3 sm:px-6 text-xs text-earthtext/85 text-center whitespace-nowrap w-[120px] font-semibold">${tx.date}</td>
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

        let pageOptions = '';
        for (let i = 1; i <= totalPages; i++) {
            pageOptions += `<option value="?page=${i}&search=${encodeURIComponent(search)}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" ${i === page ? 'selected' : ''}>Halaman ${i}</option>`;
        }

        const content = `
        <div class="page-header"><h2 class="page-title">Laporan Keuangan</h2></div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-amber-50/70 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-amber-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/70">Total Kas</span><h3 class="text-xl font-bold text-amber-900 mt-1">Rp ${totalKas.toLocaleString()}</h3></div>
            <div class="bg-orange-50/70 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-orange-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/70">Total Kaos</span><h3 class="text-xl font-bold text-orange-900 mt-1">Rp ${totalKaos.toLocaleString()}</h3></div>
            <div class="bg-amber-100/65 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-amber-300"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/70">Pendapatan Lain</span><h3 class="text-xl font-bold text-amber-950 mt-1">Rp ${totalLainnya.toLocaleString()}</h3></div>
            <div class="bg-red-50/70 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-red-200"><span class="text-xs font-bold uppercase tracking-wider text-earthtext/70">Pengeluaran</span><h3 class="text-xl font-bold text-red-800 mt-1">Rp ${totalExpense.toLocaleString()}</h3></div>
        </div>

        <div class="bg-gradient-to-r from-deepgreen via-[#3A7A61] to-sagegreen backdrop-blur-md text-white p-6 rounded-[2rem] shadow-md border border-white/30 mb-6">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-white/90">Saldo Akhir Kas Kelas</span>
                <h3 class="text-2xl sm:text-3xl font-bold text-white mt-1">Rp ${balance.toLocaleString()}</h3>
            </div>
        </div>

        <div class="bg-white/50 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] shadow-md border border-white/70 mb-6">
            <form method="GET" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                    <label class="block text-xs font-bold text-earthtext/80 uppercase mb-1">Cari Nama / Keterangan</label>
                    <input type="text" name="search" value="${search}" placeholder="Cari nama siswa, kaos, dll..." class="w-full border border-white/70 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/80 uppercase mb-1">Bulan Kas</label>
                    <select name="monthFilter" class="w-full border border-white/70 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                        ${monthOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/80 uppercase mb-1">Jenis</label>
                    <select name="type" class="w-full border border-white/70 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                        <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>Semua</option>
                        <option value="income" ${typeFilter === 'income' ? 'selected' : ''}>Pemasukan</option>
                        <option value="expense" ${typeFilter === 'expense' ? 'selected' : ''}>Pengeluaran</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/80 uppercase mb-1">Dari Tanggal</label>
                    <input type="date" name="start_date" value="${startDate}" class="w-full border border-white/70 px-3 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-earthtext/80 uppercase mb-1">Sampai Tanggal</label>
                    <input type="date" name="end_date" value="${endDate}" class="w-full border border-white/70 px-3 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                </div>
                <div class="flex gap-2 w-full">
                    <button type="submit" class="flex-1 bg-deepgreen hover:bg-sagegreen text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition">Filter</button>
                    <a href="/finances" class="flex-1 bg-white/50 hover:bg-white/80 text-deepgreen px-4 py-2.5 rounded-2xl text-sm font-bold transition flex items-center justify-center border border-white/70 shadow-sm">Reset</a>
                </div>
            </form>
        </div>

        <div class="bg-white/50 backdrop-blur-md rounded-[2rem] shadow-sm border border-white/70 overflow-x-auto mb-6">
            <table class="w-full min-w-[600px]">
                <thead>
                    <tr class="bg-deepgreen text-white text-xs uppercase tracking-wider font-bold">
                        <th class="py-3.5 px-3 sm:px-6 text-center w-[120px]">Tanggal</th>
                        <th class="py-3 px-3 sm:px-6 text-left">Keterangan</th>
                        <th class="py-3 px-3 sm:px-6 text-center w-[100px]">Tipe</th>
                        <th class="py-3 px-3 sm:px-6 text-left w-[160px] sm:w-[200px]">Jumlah</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="4" class="text-center py-8 text-earthtext/60 text-sm font-bold">Tidak ada data keuangan yang ditemukan.</td></tr>`}</tbody>
            </table>
        </div>

        <div class="flex justify-center items-center gap-3 mb-6 flex-wrap">
            <a href="?page=1&search=${encodeURIComponent(search)}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-3 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">First</a>
            ${page > 1 ? `<a href="?page=${page-1}&search=${encodeURIComponent(search)}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-4 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">Prev</a>` : ''}
            
            <select onchange="window.location.href=this.value" class="px-4 py-2 bg-white/80 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen outline-none shadow-sm cursor-pointer">
                ${pageOptions}
            </select>

            ${page < totalPages ? `<a href="?page=${page+1}&search=${encodeURIComponent(search)}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-4 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">Next</a>` : ''}
            <a href="?page=${totalPages}&search=${encodeURIComponent(search)}&type=${typeFilter}&monthFilter=${monthFilter}&start_date=${startDate}&end_date=${endDate}" class="px-3 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">Last</a>
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
                    imageHtml = `<div class="mt-4"><img src="${embedUrl}" alt="Lampiran Pengumuman" loading="lazy" class="rounded-2xl max-h-80 w-auto object-cover border border-white/70" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${downloadUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-deepgreen hover:bg-tangerine text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                } else {
                    imageHtml = `<div class="mt-4"><img src="${rawUrl}" alt="Lampiran Pengumuman" loading="lazy" class="rounded-2xl max-h-80 w-auto object-cover border border-white/70" onerror="this.parentElement.style.display='none'"></div>`;
                    actionButtonsHtml = `
                    <div class="mt-3 flex flex-wrap gap-2">
                        <a href="${rawUrl}" download target="_blank" class="inline-flex items-center space-x-2 bg-deepgreen hover:bg-tangerine text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition"><span>📥</span><span>Download Lampiran</span></a>
                    </div>`;
                }
            }

            const contentText = String(a.content || '').replace(/\\n/g, '\n');
            const formattedDate = formatDateID(a.date);

            cards += `
            <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70 mb-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 class="font-bold text-lg text-earthtext">${a.title}</h3>
                    <span class="text-[10px] font-bold bg-white/70 backdrop-blur-sm text-earthtext/80 px-2.5 py-0.5 rounded-full border border-white/75 flex items-center space-x-1 shadow-sm whitespace-nowrap">
                        <span>🗓️</span><span>${formattedDate}</span>
                    </span>
                </div>
                <p class="text-earthtext/85 text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">${contentText}</p>
                ${imageHtml}
                ${actionButtonsHtml}
            </div>`;
        });

        let pageOptions = '';
        for (let i = 1; i <= totalPages; i++) {
            pageOptions += `<option value="?page=${i}&search=${encodeURIComponent(search)}&filter=${filter}" ${i === page ? 'selected' : ''}>Halaman ${i}</option>`;
        }

        const content = `
        <div class="page-header">
            <h2 class="page-title">Pengumuman Sekolah</h2>
        </div>
        <div class="bg-white/50 backdrop-blur-md p-4 rounded-[2rem] shadow-md border border-white/70 mb-6">
            <form method="GET" class="flex flex-wrap gap-3 items-center">
                <input type="text" name="search" value="${search}" placeholder="Cari judul/isi pengumuman..." class="border border-white/70 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine flex-grow text-earthtext shadow-sm">
                <select name="filter" class="border border-white/70 px-4 py-2.5 rounded-2xl text-sm font-bold bg-white/70 backdrop-blur-md outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>Semua Waktu</option>
                    <option value="weekly" ${filter === 'weekly' ? 'selected' : ''}>Minggu Ini</option>
                </select>
                <button type="submit" class="bg-deepgreen text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-sagegreen transition shadow-sm">Cari</button>
            </form>
        </div>
        <div class="space-y-4">${cards || '<div class="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] text-center text-earthtext/60 border border-white/70 font-bold">Tidak ada pengumuman yang ditemukan.</div>'}</div>
        
        <div class="mt-6 flex justify-center items-center gap-3">
            ${page > 1 ? `<a href="?page=${page-1}&search=${encodeURIComponent(search)}&filter=${filter}" class="px-4 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">Prev</a>` : ''}
            <select onchange="window.location.href=this.value" class="px-4 py-2 bg-white/80 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen outline-none shadow-sm cursor-pointer">
                ${pageOptions}
            </select>
            ${page < totalPages ? `<a href="?page=${page+1}&search=${encodeURIComponent(search)}&filter=${filter}" class="px-4 py-2 bg-white/60 border border-white/75 rounded-2xl text-sm font-bold text-deepgreen hover:bg-white/90 backdrop-blur-sm shadow-sm">Next</a>` : ''}
        </div>

        <div class="mt-6"><a href="/dashboard" class="inline-flex items-center text-deepgreen hover:text-tangerine text-sm font-bold">&larr; Kembali ke Beranda</a></div>`;
        res.send(layout('Pengumuman', content));
    } catch (e) { res.status(500).send("Error"); }
});

app.get('/change-password', checkAuth, (req, res) => {
    const context = `
    <div class="max-w-md mx-auto bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/70">
        <h2 class="text-xl font-bold text-earthtext mb-6">Ganti Password</h2>
        <form action="/change-password" method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/80 mb-1">Password Lama</label>
                <input type="password" name="oldPassword" required class="w-full px-4 py-2.5 border border-white/70 rounded-2xl outline-none focus:ring-2 focus:ring-tangerine bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-earthtext/80 mb-1">Password Baru</label>
                <input type="password" name="newPassword" required class="w-full px-4 py-2.5 border border-white/70 rounded-2xl outline-none focus:ring-2 focus:ring-tangerine bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
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
            <label class="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm border border-white/75 rounded-2xl cursor-pointer hover:bg-white/90 transition shadow-sm">
                <input type="checkbox" name="months" value="${m}" ${isPaid ? 'checked' : ''} class="w-4 h-4 accent-[#215F47]">
                <span class="text-sm font-bold text-earthtext">${labelName}</span>
            </label>`;
        });

        let studentOptions = db.users.map(u => `<option value="${u.id}" ${String(u.id) === String(targetUserId) ? 'selected' : ''}>${u.first_name}</option>`).join('');

        const content = `
        <div class="max-w-6xl mx-auto space-y-8 pb-12">
            <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-deepgreen">PORTAL 2A</h2>
                    <p class="text-xs sm:text-sm text-earthtext/80">Kelola data kas, transaksi keuangan, agenda kalender, materi sumatif, dan backup database.</p>
                </div>
                <a href="/logout" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition shadow-sm whitespace-nowrap">Logout</a>
            </div>

            <!-- 1. BULK UPDATE STATUS KAS & KAOS -->
            <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70">
                <h3 class="font-bold text-lg text-earthtext mb-2">💵 Kelola Status Pembayaran Kas & Kaos Siswa (Bulk Update)</h3>
                <p class="text-xs text-earthtext/70 mb-4">Pilih siswa, lalu centang bulan/item yang sudah lunas dan klik Simpan.</p>
                
                <form action="/admin/update-kas-bulk" method="POST" class="space-y-4">
                    <input type="hidden" name="user_id" value="${targetUserId}">
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Pilih Nama Siswa:</label>
                        <select onchange="window.location.href='/admin/manage?student_id=' + this.value" class="border border-white/70 p-3 rounded-2xl w-full sm:w-72 bg-white/70 backdrop-blur-md font-bold text-sm outline-none focus:ring-2 focus:ring-tangerine text-earthtext shadow-sm">${studentOptions}</select>
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
            <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70">
                <h3 class="font-bold text-lg text-earthtext mb-4">📊 Tambah Transaksi Keuangan (Pemasukan / Pengeluaran)</h3>
                <form action="/admin/add-transaction" method="POST" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Tanggal</label>
                        <input type="date" name="date" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Tipe</label>
                        <select name="type" class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                            <option value="income">Pemasukan</option>
                            <option value="expense">Pengeluaran</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Keterangan</label>
                        <input type="text" name="desc" placeholder="Contoh: Beli alat kelas" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Jumlah (Rp)</label>
                        <input type="number" name="amount" placeholder="50000" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                    </div>
                    <div class="w-full">
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 px-4 rounded-2xl font-bold text-sm h-[42px] shadow-sm">Simpan Transaksi</button>
                    </div>
                </form>
            </div>

            <!-- 3. TAMBAH MATERI SUMATIF -->
            <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70">
                <h3 class="font-bold text-lg text-earthtext mb-3">📚 Unggah Materi Sumatif</h3>
                <form action="/admin/add-summative" method="POST" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Pilih Bulan / Ujian</label>
                            <select name="month" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
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
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Mata Pelajaran</label>
                            <select name="subject" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
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
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Judul Materi / Bab</label>
                        <input type="text" name="title" placeholder="Contoh: Bab 1 Penjumlahan & Pengurangan" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Link Google Drive File</label>
                        <input type="url" name="link" placeholder="https://drive.google.com/file/d/..." required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                    </div>
                    <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-3 rounded-2xl font-bold text-sm shadow-sm transition">Simpan Materi Sumatif</button>
                </form>
            </div>

            <!-- 4. TAMBAH KALENDER & PENGUMUMAN -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70">
                    <h3 class="font-bold text-lg text-earthtext mb-3">📅 Tambah Agenda Kalender Kelas</h3>
                    <form action="/admin/add-event" method="POST" class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Tanggal</label>
                            <input type="date" name="date" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Judul Agenda</label>
                            <input type="text" name="title" placeholder="Contoh: Ujian Tengah Semester" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase mb-1 text-earthtext/80">Keterangan</label>
                            <input type="text" name="description" placeholder="Keterangan singkat kegiatan" required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                        </div>
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 rounded-2xl font-bold text-sm shadow-sm">Simpan Kalender</button>
                    </form>
                </div>

                <div class="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/70">
                    <h3 class="font-bold text-lg text-earthtext mb-3">📢 Buat Pengumuman Sekolah</h3>
                    <form action="/admin/add-announcement" method="POST" class="space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input type="date" name="date" required class="border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                            <input type="text" name="title" placeholder="Judul Pengumuman" required class="border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                        </div>
                        <textarea name="content" rows="2" placeholder="Isi pengumuman..." required class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md resize-none text-earthtext font-bold shadow-sm"></textarea>
                        <input type="url" name="lampiran" placeholder="Link Google Drive (Opsional)" class="w-full border border-white/70 p-2.5 rounded-2xl text-sm bg-white/70 backdrop-blur-md text-earthtext font-bold shadow-sm">
                        <button type="submit" class="w-full bg-deepgreen hover:bg-sagegreen text-white py-2.5 rounded-2xl font-bold text-sm shadow-sm">Publikasikan</button>
                    </form>
                </div>
            </div>

            <!-- 5. BACKUP DATABASE (JSON) -->
            <div class="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 class="font-bold text-lg text-blue-900">💾 Cadangan Database (Backup)</h3>
                    <p class="text-xs text-blue-800 font-medium">Unduh file database (.json) saat ini ke komputer sebagai cadangan.</p>
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