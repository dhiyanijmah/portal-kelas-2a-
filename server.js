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
        const res = await fetch(
            `${SCRIPT_URL}?action=getData&t=${Date.now()}`
        );

        const data = await res.json();

        cacheData = data;
        lastFetchTime = now;

        return cacheData;

    } catch (e) {

        console.error("Gagal mengambil data:", e);

        return cacheData || {
            users: [],
            notes: [],
            kas: [],
            transactions: [],
            announcements: [],
            events: [],
            summative: []
        };
    }
}


// ---------------------------------------------------------
// FORMAT DATE
// ---------------------------------------------------------

const formatDateID = (dateStr) => {

    if (!dateStr || dateStr === "-") {
        return "-";
    }

    try {

        const d = new Date(dateStr);

        if (isNaN(d.getTime())) {
            return dateStr;
        }

        return d.toLocaleDateString(
            'id-ID',
            {
                timeZone: 'Asia/Jakarta',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

    } catch (e) {

        return dateStr;

    }
};


// ---------------------------------------------------------
// LOGIN VERIFICATION
// ---------------------------------------------------------

async function verifyLogin(first_name, password) {

    try {

        const params = new URLSearchParams({
            action: 'verifyLogin',
            first_name: first_name,
            password: password
        });

        const res = await fetch(
            `${SCRIPT_URL}?${params.toString()}`
        );

        return await res.json();

    } catch (e) {

        console.error(
            "Gagal verifikasi login:",
            e
        );

        return null;
    }
}


// ---------------------------------------------------------
// SESSION
// ---------------------------------------------------------

const sessions = {};

function checkAuth(req, res, next) {

    const sessionId =
        req.headers.cookie
            ?.split('; ')
            .find(
                row => row.startsWith('sessionId=')
            )
            ?.split('=')[1];

    if (
        sessionId &&
        sessions[sessionId]
    ) {

        req.user = sessions[sessionId];

        next();

    } else {

        res.redirect('/login');

    }
}


// ---------------------------------------------------------
// NATIONAL HOLIDAYS
// ---------------------------------------------------------

const nationalHolidays = {

    "2026-01-01":
        "Tahun Baru Masehi",

    "2026-01-16":
        "Isra Mikraj Nabi Muhammad SAW",

    "2026-02-17":
        "Tahun Baru Imlek",

    "2026-03-19":
        "Hari Suci Nyepi",

    "2026-03-20":
        "Hari Raya Idul Fitri",

    "2026-03-21":
        "Hari Raya Idul Fitri",

    "2026-04-03":
        "Wafat Yesus Kristus",

    "2026-04-05":
        "Kebangkitan Yesus Kristus (Paskah)",

    "2026-05-01":
        "Hari Buruh Internasional",

    "2026-05-14":
        "Kenaikan Yesus Kristus",

    "2026-05-27":
        "Hari Raya Idul Adha",

    "2026-05-31":
        "Hari Raya Waisak",

    "2026-06-01":
        "Hari Lahir Pancasila",

    "2026-06-16":
        "Tahun Baru Islam",

    "2026-08-17":
        "Hari Kemerdekaan RI",

    "2026-08-25":
        "Maulid Nabi Muhammad SAW",

    "2026-12-25":
        "Hari Raya Natal",

    "2027-01-01":
        "Tahun Baru Masehi",

    "2027-01-05":
        "Isra Mikraj Nabi Muhammad SAW",

    "2027-02-06":
        "Tahun Baru Imlek",

    "2027-03-08":
        "Hari Suci Nyepi",

    "2027-03-10":
        "Hari Raya Idul Fitri",

    "2027-03-11":
        "Hari Raya Idul Fitri",

    "2027-03-26":
        "Wafat Yesus Kristus",

    "2027-03-28":
        "Paskah",

    "2027-05-01":
        "Hari Buruh Internasional",

    "2027-05-06":
        "Kenaikan Yesus Kristus",

    "2027-05-16":
        "Hari Raya Idul Adha",

    "2027-05-20":
        "Hari Raya Waisak",

    "2027-06-01":
        "Hari Lahir Pancasila",

    "2027-06-06":
        "Tahun Baru Islam",

    "2027-08-17":
        "Hari Kemerdekaan RI",

    "2027-09-04":
        "Maulid Nabi Muhammad SAW",

    "2027-12-25":
        "Hari Raya Natal"
};


// =========================================================
// PORTAL 2A ILLUSTRATION
// =========================================================

const portalArt = `
<svg
    class="portal-art"
    viewBox="0 0 320 240"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
>

<defs>

    <linearGradient
        id="portalGreen"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
    >

        <stop
            offset="0%"
            stop-color="#62B98A"
        />

        <stop
            offset="100%"
            stop-color="#237650"
        />

    </linearGradient>


    <linearGradient
        id="portalOrange"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
    >

        <stop
            offset="0%"
            stop-color="#FFBE45"
        />

        <stop
            offset="100%"
            stop-color="#F57B20"
        />

    </linearGradient>


    <filter
        id="portalShadow"
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
    >

        <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="7"
            flood-color="#1F6248"
            flood-opacity=".16"
        />

    </filter>

</defs>


<!-- ground -->

<ellipse
    cx="160"
    cy="216"
    rx="112"
    ry="13"
    fill="#1F6248"
    opacity=".10"
/>


<!-- MOSQUE -->

<g filter="url(#portalShadow)">

    <!-- building -->

    <rect
        x="72"
        y="94"
        width="176"
        height="101"
        rx="25"
        fill="#FFFDF5"
    />


    <!-- main dome -->

    <path
        d="
        M93 121
        C98 79 128 57 160 57
        C192 57 222 79 227 121
        Z
        "
        fill="url(#portalGreen)"
    />


    <!-- dome top -->

    <path
        d="
        M151 59
        C153 46 157 37 160 32
        C163 37 167 46 169 59
        Z
        "
        fill="url(#portalOrange)"
    />


    <circle
        cx="160"
        cy="29"
        r="4"
        fill="#FFB52D"
    />


    <!-- side domes -->

    <path
        d="
        M67 129
        C68 99 91 86 110 86
        C129 86 141 101 142 129
        Z
        "
        fill="#73B991"
    />


    <path
        d="
        M178 129
        C179 101 191 86 210 86
        C229 86 252 99 253 129
        Z
        "
        fill="#73B991"
    />


    <!-- central door -->

    <path
        d="
        M142 195
        V150
        C142 132 178 132 178 150
        V195
        Z
        "
        fill="#237650"
    />


    <!-- left windows -->

    <rect
        x="93"
        y="151"
        width="25"
        height="29"
        rx="13"
        fill="#E6F4EC"
    />


    <!-- right windows -->

    <rect
        x="202"
        y="151"
        width="25"
        height="29"
        rx="13"
        fill="#E6F4EC"
    />


    <!-- minarets -->

    <rect
        x="48"
        y="103"
        width="12"
        height="92"
        rx="5"
        fill="#FFC766"
    />

    <path
        d="
        M42 104
        L54 78
        L66 104
        Z
        "
        fill="url(#portalOrange)"
    />


    <rect
        x="260"
        y="103"
        width="12"
        height="92"
        rx="5"
        fill="#FFC766"
    />

    <path
        d="
        M254 104
        L266 78
        L278 104
        Z
        "
        fill="url(#portalOrange)"
    />

</g>


<!-- BOY -->

<g
    class="portal-float"
    filter="url(#portalShadow)"
>

    <!-- body -->

    <path
        d="
        M61 194
        V155
        C61 137 76 124 94 124
        H111
        C130 124 145 137 145 155
        V194
        Z
        "
        fill="#3C9C70"
    />


    <!-- shirt -->

    <path
        d="
        M76 160
        C84 154 95 151 103 151
        C113 151 123 154 130 160
        V194
        H76
        Z
        "
        fill="#FFFDF5"
    />


    <!-- head -->

    <circle
        cx="103"
        cy="106"
        r="31"
        fill="#F2C8AA"
    />


    <!-- cap -->

    <path
        d="
        M73 105
        C75 84 85 71 103 71
        C121 71 132 84 134 105
        C125 98 115 95 103 95
        C91 95 82 98 73 105
        Z
        "
        fill="#FFFDF5"
    />


    <path
        d="
        M77 83
        C82 68 92 60 104 60
        C116 60 126 68 131 83
        C114 78 94 78 77 83
        Z
        "
        fill="#23372D"
    />


    <!-- book -->

    <rect
        x="111"
        y="153"
        width="30"
        height="39"
        rx="5"
        fill="#FF8A23"
        transform="rotate(-8 111 153)"
    />

    <path
        d="
        M126 154
        V190
        "
        stroke="#FFF0D8"
        stroke-width="2"
    />

</g>


<!-- GIRL -->

<g
    class="portal-float-delay"
    filter="url(#portalShadow)"
>

    <!-- dress -->

    <path
        d="
        M171 194
        V156
        C171 137 185 124 204 124
        H220
        C239 124 253 137 253 156
        V194
        Z
        "
        fill="#FF8A23"
    />


    <!-- inner shirt -->

    <path
        d="
        M185 160
        C192 154 202 151 211 151
        C221 151 231 154 239 160
        V194
        H185
        Z
        "
        fill="#FFFDF5"
    />


    <!-- hijab -->

    <path
        d="
        M171 108
        C171 84 187 66 208 66
        C230 66 246 84 246 108
        C246 138 234 151 208 151
        C183 151 171 138 171 108
        Z
        "
        fill="#3C9C70"
    />


    <!-- face -->

    <circle
        cx="208"
        cy="108"
        r="27"
        fill="#C9906D"
    />


    <!-- hijab opening -->

    <path
        d="
        M182 104
        C187 94 197 88 208 88
        C220 88 230 94 235 104
        V125
        C229 136 219 141 208 141
        C197 141 188 136 182 125
        Z
        "
        fill="#FFFDF5"
    />


    <!-- book -->

    <rect
        x="179"
        y="153"
        width="30"
        height="39"
        rx="5"
        fill="#FFD34E"
        transform="rotate(8 179 153)"
    />

    <path
        d="
        M194 154
        V190
        "
        stroke="#FFF8DB"
        stroke-width="2"
    />

</g>


<!-- stars -->

<g fill="#FFB52D">

    <path
        d="
        M47 62
        L51 72
        L62 76
        L51 80
        L47 91
        L43 80
        L32 76
        L43 72
        Z
        "
    />

    <path
        d="
        M273 58
        L276 66
        L285 69
        L276 72
        L273 81
        L270 72
        L261 69
        L270 66
        Z
        "
    />

</g>

</svg>
`;


// =========================================================
// COMMON LAYOUT
// =========================================================

const layout = (title, content) => `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, viewport-fit=cover"
>

<title>
    ${title} - PORTAL 2A
</title>


<link
    rel="preconnect"
    href="https://fonts.googleapis.com"
>

<link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
>


<link
    href="
    https://fonts.googleapis.com/css2?
    family=Baloo+2:wght@500;600;700;800&
    family=Nunito:wght@500;600;700;800;900&
    display=swap
    "
    rel="stylesheet"
>


<script src="https://cdn.tailwindcss.com"></script>


<script>

tailwind.config = {

    theme: {

        extend: {

            fontFamily: {

                sans: [
                    'Nunito',
                    'sans-serif'
                ],

                display: [
                    'Baloo 2',
                    'cursive'
                ]

            },

            colors: {

                deepgreen: '#217553',

                sagegreen: '#58B47F',

                tangerine: '#F57B20',

                merigold: '#FFB52D',

                cider: '#D96C1D',

                cantaloupe: '#FFCA73',

                sandstone: '#E68A46',

                cream: '#FFFDF4',

                earthtext: '#224438',

                cardbg: '#FFFFFF'

            }

        }

    }

};

</script>


<style>

:root {

    --green:
        #217553;

    --green-light:
        #58B47F;

    --orange:
        #F57B20;

    --orange-light:
        #FFB52D;

    --cream:
        #FFFDF4;

    --text:
        #224438;

}


* {

    box-sizing:
        border-box;

}


html {

    scroll-behavior:
        smooth;

}


body {

    margin:
        0;

    min-height:
        100vh;

    font-family:
        'Nunito',
        sans-serif;

    color:
        var(--text);

    background:

        radial-gradient(
            circle at 5% 5%,
            rgba(255,181,45,.28),
            transparent 26%
        ),

        radial-gradient(
            circle at 95% 20%,
            rgba(88,180,127,.20),
            transparent 28%
        ),

        linear-gradient(
            145deg,
            #F8F6EA,
            #EEF7EF 48%,
            #FFF5E8
        );

}


h1,
h2,
h3,
h4,
h5,
h6 {

    font-family:
        'Baloo 2',
        cursive !important;

}


button,
input,
textarea,
select {

    font-family:
        'Nunito',
        sans-serif;

}


input,
select,
textarea {

    background:
        rgba(255,255,255,.96)
        !important;

    color:
        var(--text)
        !important;

    border-color:
        #E6DECE
        !important;

    border-radius:
        16px
        !important;

}


input:focus,
select:focus,
textarea:focus {

    outline:
        none
        !important;

    border-color:
        #8CC4A5
        !important;

    box-shadow:
        0 0 0 4px
        rgba(88,180,127,.13)
        !important;

}


/* =====================================================
   NAV
===================================================== */

.portal-nav {

    position:
        sticky;

    top:
        0;

    z-index:
        500;

    background:
        rgba(255,253,244,.93);

    backdrop-filter:
        blur(18px);

    border-bottom:
        1px solid
        rgba(33,117,83,.10);

    box-shadow:
        0 7px 28px
        rgba(41,77,62,.07);

}


.portal-nav-inner {

    width:
        min(1120px, calc(100% - 24px));

    min-height:
        70px;

    margin:
        auto;

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    gap:
        12px;

}


.portal-brand {

    display:
        flex;

    align-items:
        center;

    gap:
        10px;

    color:
        var(--green);

    text-decoration:
        none;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        23px;

    font-weight:
        800;

}


.portal-brand-mark {

    width:
        42px;

    height:
        42px;

    display:
        grid;

    place-items:
        center;

    border-radius:
        15px;

    color:
        white;

    font-size:
        13px;

    background:
        linear-gradient(
            145deg,
            #FFBB43,
            #F57B20
        );

    box-shadow:
        0 8px 18px
        rgba(245,123,32,.20);

}


.portal-logout {

    background:
        #FFE4E0
        !important;

    color:
        #D64E41
        !important;

    border-radius:
        999px
        !important;

    padding:
        9px 16px
        !important;

    font-weight:
        900
        !important;

    text-decoration:
        none;

}


/* =====================================================
   MAIN
===================================================== */

.portal-main {

    width:
        min(1120px, calc(100% - 24px));

    margin:
        18px auto 28px;

}


.portal-panel {

    background:
        rgba(255,253,244,.88);

    border:
        1px solid
        rgba(255,255,255,.96);

    border-radius:
        28px;

    padding:
        24px;

    box-shadow:
        0 18px 55px
        rgba(54,87,70,.10);

}


.portal-card {

    background:
        rgba(255,255,255,.92);

    border:
        1px solid
        rgba(33,117,83,.08);

    border-radius:
        24px;

    box-shadow:
        0 10px 28px
        rgba(36,73,56,.08);

    transition:
        transform .2s ease,
        box-shadow .2s ease;

}


.portal-card:hover {

    transform:
        translateY(-2px);

    box-shadow:
        0 14px 34px
        rgba(36,73,56,.12);

}


.portal-icon {

    width:
        58px;

    height:
        58px;

    min-width:
        58px;

    display:
        grid;

    place-items:
        center;

    border-radius:
        20px;

    background:
        linear-gradient(
            145deg,
            #FFF8E9,
            #E9F6ED
        );

    box-shadow:
        inset 0 1px white,
        0 8px 18px
        rgba(34,68,54,.11);

    font-size:
        28px;

}


/* =====================================================
   ILLUSTRATION
===================================================== */

.portal-art {

    width:
        100%;

    height:
        auto;

    display:
        block;

}


.portal-float {

    animation:
        portalFloat
        3s
        ease-in-out
        infinite;

    transform-origin:
        center;

}


.portal-float-delay {

    animation:
        portalFloat
        3.3s
        ease-in-out
        .25s
        infinite;

    transform-origin:
        center;

}


@keyframes portalFloat {

    0%,
    100% {

        transform:
            translateY(0);

    }

    50% {

        transform:
            translateY(-6px);

    }

}


/* =====================================================
   LOADING
===================================================== */

.loading-overlay {

    position:
        fixed;

    inset:
        0;

    z-index:
        99999;

    display:
        none;

    align-items:
        center;

    justify-content:
        center;

    padding:
        20px;

    background:
        rgba(255,253,244,.97);

    backdrop-filter:
        blur(10px);

}


.loading-card {

    width:
        min(350px, 92vw);

    padding:
        23px;

    background:
        white;

    border:
        1px solid
        #F0E5D3;

    border-radius:
        30px;

    box-shadow:
        0 22px 60px
        rgba(39,78,61,.14);

    text-align:
        center;

}


.loading-art {

    max-height:
        220px;

    overflow:
        hidden;

}


.loading-title {

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        28px;

    font-weight:
        800;

    color:
        var(--green);

}


.loading-pill {

    height:
        47px;

    margin:
        6px auto 0;

    max-width:
        235px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        999px;

    background:
        linear-gradient(
            90deg,
            #FFD34E,
            #FF8A23
        );

    color:
        white;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        20px;

    font-weight:
        800;

}


.loading-dots {

    display:
        flex;

    justify-content:
        center;

    gap:
        8px;

    margin-top:
        12px;

}


.loading-dots span {

    width:
        10px;

    height:
        10px;

    border-radius:
        50%;

    animation:
        loadingDot
        1.05s
        ease-in-out
        infinite;

}


.loading-dots span:nth-child(1) {

    background:
        #F57B20;

}


.loading-dots span:nth-child(2) {

    background:
        #FFB52D;

    animation-delay:
        .14s;

}


.loading-dots span:nth-child(3) {

    background:
        #58B47F;

    animation-delay:
        .28s;

}


@keyframes loadingDot {

    0%,
    60%,
    100% {

        transform:
            translateY(0);

        opacity:
            .45;

    }

    30% {

        transform:
            translateY(-7px);

        opacity:
            1;

    }

}


/* =====================================================
   MOBILE NAVIGATION
===================================================== */

.mobile-nav {

    display:
        none;

}


@media(max-width:760px) {

    .portal-main {

        width:
            calc(100% - 12px);

        padding:
            10px 0 85px;

    }


    .portal-panel {

        padding:
            14px;

        border-radius:
            22px;

    }


    .portal-card {

        border-radius:
            20px;

    }


    .portal-nav-inner {

        width:
            calc(100% - 16px);

        min-height:
            62px;

    }


    .portal-brand {

        font-size:
            19px;

    }


    .portal-brand-mark {

        width:
            38px;

        height:
            38px;

    }


    .portal-brand span:last-child {

        display:
            none;

    }


    .portal-logout {

        padding:
            8px 14px
            !important;

        font-size:
            11px
            !important;

    }


    .mobile-nav {

        display:
            grid;

        grid-template-columns:
            repeat(4, 1fr);

        gap:
            7px;

        position:
            fixed;

        left:
            9px;

        right:
            9px;

        bottom:
            9px;

        z-index:
            1000;

        background:
            rgba(255,253,244,.97);

        backdrop-filter:
            blur(16px);

        border:
            1px solid
            #E8DFD0;

        border-radius:
            21px;

        padding:
            8px;

        box-shadow:
            0 14px 38px
            rgba(39,78,61,.13);

    }


    .mobile-nav a {

        display:
            flex;

        flex-direction:
            column;

        align-items:
            center;

        justify-content:
            center;

        gap:
            2px;

        min-height:
            52px;

        border-radius:
            15px;

        color:
            #829087;

        text-decoration:
            none;

        font-size:
            10px;

        font-weight:
            800;

    }


    .mobile-nav a.active {

        background:
            #E5F4EA;

        color:
            #217553;

    }


    .mobile-nav span:first-child {

        font-size:
            20px;

        line-height:
            1;

    }


    table {

        font-size:
            12px;

    }


    .overflow-x-auto {

        -webkit-overflow-scrolling:
            touch;

    }

}


@media(max-width:430px) {

    .portal-main {

        width:
            calc(100% - 8px);

    }


    .portal-panel {

        padding:
            11px;

    }


    .portal-icon {

        width:
            53px;

        min-width:
            53px;

        height:
            53px;

        font-size:
            25px;

    }

}

</style>

</head>


<body>


<!-- LOADING -->

<div
    id="loading-overlay"
    class="loading-overlay"
>

    <div class="loading-card">

        <div class="loading-art">

            ${portalArt}

        </div>


        <div class="loading-title">
            PORTAL 2A
        </div>


        <div class="loading-pill">
            Memuat...
        </div>


        <div class="loading-dots">

            <span></span>
            <span></span>
            <span></span>

        </div>

    </div>

</div>


<!-- NAV -->

<nav class="portal-nav">

    <div class="portal-nav-inner">

        <a
            href="/dashboard"
            class="portal-brand"
        >

            <span class="portal-brand-mark">
                2A
            </span>

            <span>
                PORTAL 2A
            </span>

        </a>


        <a
            href="/logout"
            class="portal-logout"
        >
            Logout
        </a>

    </div>

</nav>


<!-- MAIN -->

<main class="portal-main">

    <div class="portal-panel">

        ${content}

    </div>

</main>


<!-- MOBILE NAV -->

<div class="mobile-nav">

    <a href="/dashboard">

        <span>🏠</span>
        <span>Home</span>

    </a>


    <a href="/summative">

        <span>📚</span>
        <span>Materi</span>

    </a>


    <a href="/kas">

        <span>💰</span>
        <span>Kas</span>

    </a>


    <a href="/calendar">

        <span>📅</span>
        <span>Agenda</span>

    </a>

</div>


<script>

function showLoading() {

    const overlay =
        document.getElementById(
            'loading-overlay'
        );

    if (!overlay) return;

    overlay.style.display =
        'flex';

}


function hideLoading() {

    const overlay =
        document.getElementById(
            'loading-overlay'
        );

    if (!overlay) return;

    overlay.style.display =
        'none';

}


window.addEventListener(
    'load',
    function () {

        hideLoading();

    }
);


document.addEventListener(
    'click',
    function (e) {

        const link =
            e.target.closest('a');

        if (
            link &&
            link.href &&
            link.href.startsWith(
                window.location.origin
            ) &&
            !link.getAttribute('target') &&
            !link.href.includes('#')
        ) {

            showLoading();

        }

    }
);


document.addEventListener(
    'submit',
    function () {

        showLoading();

    }
);

</script>

</body>

</html>

`;


// =========================================================
// LOGIN
// =========================================================

app.get('/login', (req, res) => {

    res.send(`

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="
        width=device-width,
        initial-scale=1.0,
        maximum-scale=1.0,
        viewport-fit=cover
    "
>


<title>
    Login - PORTAL 2A
</title>


<link
    rel="preconnect"
    href="https://fonts.googleapis.com"
>


<link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
>


<link
    href="
    https://fonts.googleapis.com/css2?
    family=Baloo+2:wght@500;600;700;800&
    family=Nunito:wght@500;600;700;800;900&
    display=swap
    "
    rel="stylesheet"
>


<style>

:root {

    --green:
        #217553;

    --green-light:
        #58B47F;

    --orange:
        #F57B20;

    --yellow:
        #FFD34E;

    --cream:
        #FFFDF4;

}


* {

    box-sizing:
        border-box;

}


body {

    margin:
        0;

    min-height:
        100vh;

    font-family:
        'Nunito',
        sans-serif;

    background:

        radial-gradient(
            circle at 5% 4%,
            rgba(255,211,78,.32),
            transparent 27%
        ),

        radial-gradient(
            circle at 95% 10%,
            rgba(88,180,127,.20),
            transparent 30%
        ),

        linear-gradient(
            145deg,
            #F8F6EA,
            #EDF7EE 48%,
            #FFF5E8
        );

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    padding:
        16px;

}


.login-wrapper {

    width:
        min(970px,100%);

}


.login-card {

    overflow:
        hidden;

    display:
        grid;

    grid-template-columns:
        1fr 1fr;

    background:
        rgba(255,255,255,.94);

    border:
        1px solid
        rgba(255,255,255,.98);

    border-radius:
        34px;

    box-shadow:
        0 25px 70px
        rgba(39,78,61,.14);

}


.login-visual {

    position:
        relative;

    min-height:
        650px;

    overflow:
        hidden;

    padding:
        32px;

    background:

        radial-gradient(
            circle at 15% 10%,
            rgba(255,211,78,.34),
            transparent 23%
        ),

        radial-gradient(
            circle at 87% 21%,
            rgba(88,180,127,.20),
            transparent 25%
        ),

        linear-gradient(
            155deg,
            #F7FCF8,
            #E4F5EA
        );

    display:
        flex;

    flex-direction:
        column;

    align-items:
        center;

    justify-content:
        center;

}


.login-brand {

    text-align:
        center;

    position:
        relative;

    z-index:
        2;

}


.login-brand h1 {

    margin:
        0;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        clamp(42px,6vw,66px);

    line-height:
        .84;

    font-weight:
        800;

    color:
        var(--green);

}


.login-brand h1 span {

    color:
        var(--orange);

}


.login-tag {

    display:
        inline-flex;

    margin-top:
        15px;

    padding:
        8px 14px;

    background:
        linear-gradient(
            135deg,
            #FFD34E,
            #FFAC32
        );

    border-radius:
        999px;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        13px;

    font-weight:
        800;

    color:
        #704609;

}


.login-art {

    width:
        min(370px,100%);

    margin-top:
        15px;

}


.login-form {

    padding:
        48px 43px;

    display:
        flex;

    align-items:
        center;

}


.login-inner {

    width:
        100%;

    max-width:
        390px;

    margin:
        auto;

}


.login-inner h2 {

    margin:
        0;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        32px;

    font-weight:
        800;

    color:
        #24362D;

}


.login-description {

    margin:
        3px 0 25px;

    color:
        #708078;

    font-size:
        13px;

    line-height:
        1.7;

}


.login-field {

    margin-bottom:
        16px;

}


.login-label {

    display:
        block;

    margin-bottom:
        7px;

    font-size:
        13px;

    font-weight:
        900;

    color:
        #405047;

}


.login-input {

    width:
        100%;

    height:
        54px;

    padding:
        0 16px;

    border:
        1px solid
        #E3E8E3;

    border-radius:
        17px;

    background:
        #FBFCFA;

    outline:
        none;

    color:
        #24362D;

    font-size:
        14px;

    font-weight:
        700;

}


.login-input::placeholder {

    color:
        #9BA7A0;

}


.login-input:focus {

    border-color:
        #79B994;

    box-shadow:
        0 0 0 4px
        rgba(62,155,110,.10);

}


.login-button {

    width:
        100%;

    height:
        55px;

    border:
        0;

    border-radius:
        18px;

    background:
        linear-gradient(
            135deg,
            #FF9D31,
            #F57B20
        );

    color:
        white;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        20px;

    font-weight:
        800;

    cursor:
        pointer;

    box-shadow:
        0 10px 23px
        rgba(245,123,32,.22);

}


#login-loading {

    position:
        fixed;

    inset:
        0;

    z-index:
        99999;

    display:
        none;

    align-items:
        center;

    justify-content:
        center;

    padding:
        18px;

    background:
        rgba(255,253,244,.97);

    backdrop-filter:
        blur(10px);

}


.login-loading-card {

    width:
        min(350px,92vw);

    background:
        white;

    border-radius:
        30px;

    padding:
        22px;

    box-shadow:
        0 24px 60px
        rgba(39,78,61,.15);

    text-align:
        center;

}


.login-loading-card h3 {

    margin:
        0;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        27px;

    color:
        var(--green);

}


.login-loading-pill {

    height:
        47px;

    margin-top:
        10px;

    border-radius:
        999px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    background:
        linear-gradient(
            90deg,
            #FFD34E,
            #FF8A23
        );

    color:
        white;

    font-family:
        'Baloo 2',
        cursive;

    font-size:
        19px;

    font-weight:
        800;

}


.login-loading-dots {

    display:
        flex;

    justify-content:
        center;

    gap:
        8px;

    margin-top:
        13px;

}


.login-loading-dots span {

    width:
        9px;

    height:
        9px;

    border-radius:
        50%;

    animation:
        loginDot
        1s
        infinite;

}


.login-loading-dots span:nth-child(1) {

    background:
        #F57B20;

}


.login-loading-dots span:nth-child(2) {

    background:
        #FFD34E;

    animation-delay:
        .15s;

}


.login-loading-dots span:nth-child(3) {

    background:
        #58B47F;

    animation-delay:
        .3s;

}


@keyframes loginDot {

    0%,
    70%,
    100% {

        transform:
            translateY(0);

        opacity:
            .45;

    }

    35% {

        transform:
            translateY(-6px);

        opacity:
            1;

    }

}


@media(max-width:760px) {

    body {

        padding:
            9px;

    }


    .login-card {

        grid-template-columns:
            1fr;

        border-radius:
            27px;

        max-width:
            500px;

        margin:
            auto;

    }


    .login-visual {

        min-height:
            auto;

        padding:
            21px 17px 10px;

    }


    .login-brand h1 {

        font-size:
            43px;

    }


    .login-art {

        width:
            min(280px,83%);

        margin-top:
            4px;

    }


    .login-form {

        padding:
            23px 18px 28px;

    }


    .login-inner h2 {

        font-size:
            27px;

    }


    .login-description {

        font-size:
            12px;

        margin-bottom:
            20px;

    }


    .login-input {

        height:
            52px;

    }


    .login-button {

        height:
            53px;

    }

}


@media(max-width:390px) {

    .login-brand h1 {

        font-size:
            38px;

    }


    .login-art {

        width:
            230px;

    }


    .login-form {

        padding:
            20px 14px 24px;

    }

}

</style>

</head>


<body>


<!-- LOGIN LOADING -->

<div id="login-loading">

    <div class="login-loading-card">

        ${portalArt}

        <h3>
            PORTAL 2A
        </h3>

        <div class="login-loading-pill">
            Memuat...
        </div>

        <div class="login-loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>

    </div>

</div>


<div class="login-wrapper">

    <div class="login-card">


        <!-- LEFT -->

        <section class="login-visual">

            <div class="login-brand">

                <h1>
                    PORTAL
                    <br>
                    <span>2A</span>
                </h1>

                <div class="login-tag">
                    Portal Walimurid Kelas 2A
                </div>

            </div>


            ${portalArt}

        </section>


        <!-- RIGHT -->

        <section class="login-form">

            <div class="login-inner">

                <h2>
                    Assalamualaikum 👋
                </h2>


                <p class="login-description">
                    Assalamualaikum, selamat datang Ayah Bunda.<br>
                    Mohon masukkan Username dan Password
                </p>


                <form
                    action="/login"
                    method="POST"
                    onsubmit="
                        document.getElementById(
                            'login-loading'
                        ).style.display='flex';
                    "
                >


                    <div class="login-field">

                        <label class="login-label">
                            Username
                        </label>

                        <input
                            type="text"
                            name="first_name"
                            required
                            class="login-input"
                            placeholder="Nama Siswa"
                        >

                    </div>


                    <div class="login-field">

                        <label class="login-label">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            required
                            class="login-input"
                            placeholder="Password Akun"
                        >

                    </div>


                    <button
                        type="submit"
                        class="login-button"
                    >
                        Masuk →
                    </button>


                </form>

            </div>

        </section>


    </div>

</div>

</body>

</html>

    `);

});


// =========================================================
// LOGIN POST — ORIGINAL FUNCTION
// =========================================================

app.post('/admin/add-summative', checkAuth, async (req, res) => {
    if (
        !req.user.isAdmin &&
        String(req.user.first_name || '').trim().toLowerCase() !== 'admin'
    ) {
        return res.status(403).send("Unauthorized");
    }

    try {
        const params = new URLSearchParams({
            action: 'addSummative',
            ...req.body
        });

        await fetch(`${SCRIPT_URL}?${params.toString()}`);

        cacheData = null;

        res.redirect('/admin/manage');

    } catch (e) {
        res.status(500).send(
            "Gagal menambah materi sumatif"
        );
    }
});

app.listen(
    PORT,
    '0.0.0.0',
    () => console.log(`PORTAL 2A running on port ${PORT}`)
);


// =========================================================
// LOGOUT — ORIGINAL
// =========================================================

app.get('/logout', (req, res) => {

    res.setHeader(
        'Set-Cookie',
        'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );

    res.redirect('/login');

});


// =========================================================
// DASHBOARD
// =========================================================

app.get(
    '/dashboard',
    checkAuth,
    (req, res) => {

        const content = `

        <div
            class="
                portal-card
                p-5
                sm:p-7
                mb-5
                overflow-hidden
            "
            style="
                background:
                linear-gradient(
                    135deg,
                    #EAF7EE 0%,
                    #FFFDF4 62%,
                    #FFF0D9 100%
                );
            "
        >

            <div
                class="
                    grid
                    md:grid-cols-[1fr_280px]
                    gap-4
                    items-center
                "
            >

                <div>

                    <span
                        class="
                            inline-flex
                            items-center
                            px-3
                            py-1.5
                            rounded-full
                            bg-white
                            text-[10px]
                            uppercase
                            tracking-widest
                            font-extrabold
                            text-deepgreen
                        "
                    >
                        Dashboard Wali Murid
                    </span>


                    <h2
                        class="
                            text-2xl
                            sm:text-3xl
                            font-display
                            font-extrabold
                            mt-3
                            text-deepgreen
                        "
                    >
                        Assalamualaikum,
                        Ayah & Bunda
                        ${String(req.user.first_name)}
                    </h2>


                    <p
                        class="
                            text-sm
                            sm:text-base
                            mt-1
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Semoga hari ini menjadi hari
                        yang penuh berkah 🌿
                    </p>

                </div>


                <div
                    class="
                        hidden
                        md:block
                    "
                >
                    ${portalArt}
                </div>

            </div>

        </div>


        <div
            class="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-4
            "
        >


            <!-- CALENDAR -->

            <a
                href="/calendar"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    📅
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Kalendar Akademik
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Agenda kelas & jadwal pribadi siswa.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


            <!-- KAS -->

            <a
                href="/kas"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    💰
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Iuran Kas Siswa
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Pembayaran kas pribadi setiap siswa.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


            <!-- FINANCE -->

            <a
                href="/finances"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    📊
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Laporan Keuangan
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Rincian income & expense kelas 2A.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


            <!-- ANNOUNCEMENTS -->

            <a
                href="/announcements"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    📢
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Pengumuman
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Informasi resmi dari sekolah.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


            <!-- SUMMATIVE -->

            <a
                href="/summative"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    📚
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Materi Sumatif
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Kisi-kisi dan materi bulanan lengkap.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


            <!-- PASSWORD -->

            <a
                href="/change-password"
                class="
                    portal-card
                    p-5
                    flex
                    items-center
                    gap-4
                    group
                "
            >

                <div class="portal-icon">
                    🔐
                </div>

                <div class="min-w-0">

                    <h3
                        class="
                            font-display
                            font-extrabold
                            text-lg
                        "
                    >
                        Ganti Password
                    </h3>

                    <p
                        class="
                            text-xs
                            sm:text-sm
                            text-earthtext/70
                            font-semibold
                        "
                    >
                        Ubah kata sandi akun Anda.
                    </p>

                </div>

                <span
                    class="
                        ml-auto
                        text-xl
                        text-deepgreen
                    "
                >
                    ›
                </span>

            </a>


        </div>

        `;

        res.send(
            layout(
                'Dashboard',
                content
            )
        );

    }
);