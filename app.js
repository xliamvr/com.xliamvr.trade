/*!
 * Liamvtrade — Locked Sniper Engine, Auto-Notif & Journal Archive (v2.4)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// ==================== 1. DEFAULT ACCOUNTS, SAMPLE ARCHIVE & STATE ====================
const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Akun Utama #1',
    firm: 'The5ers / Funded',
    balance: 5000,
    equity: 5145,
    wins: 11,
    losses: 4,
    riskPct: 0.4,
    maxEntries: 2,
    maxSLs: 2,
    entriesToday: 0,
    slsToday: 0,
    myfxbookId: ''
  },
  {
    id: 'acc-2',
    name: 'Akun Evaluasi #2',
    firm: 'Bright Funded',
    balance: 10000,
    equity: 10280,
    wins: 8,
    losses: 3,
    riskPct: 0.4,
    maxEntries: 3,
    maxSLs: 2,
    entriesToday: 0,
    slsToday: 0,
    myfxbookId: ''
  },
  {
    id: 'acc-3',
    name: 'Akun Scalping #3',
    firm: 'Propanium',
    balance: 2500,
    equity: 2560,
    wins: 6,
    losses: 2,
    riskPct: 0.5,
    maxEntries: 2,
    maxSLs: 2,
    entriesToday: 0,
    slsToday: 0,
    myfxbookId: ''
  }
];

function createInitialHistorySeed() {
  const now = Date.now();
  return [
    {
      id: 'hist-seed-1',
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      closedAt: new Date(now - 3600000 * 1.2).toISOString(),
      pair: 'XAUUSD',
      tf: 'M15',
      method: 'SMC',
      methodLabel: 'SMC Liquidity Sweep + Discount FVG (M15)',
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: 88,
      entryMin: 2708.00,
      entryMax: 2709.50,
      entryPrice: 2708.80,
      sl: 2705.80,
      slUnits: 30,
      tp1: 2713.30,
      tp1Units: 45,
      tp2: 2715.30,
      tp2Units: 65,
      tp3: 2718.30,
      tp3Units: 95,
      unitLabel: 'pips',
      status: 'TP2 HIT',
      resultUnits: 65,
      structure: 'Sweep Asia Low → Displacement Bullish & CHoCH M5 → Retest FVG M15.'
    },
    {
      id: 'hist-seed-2',
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      closedAt: new Date(now - 3600000 * 4).toISOString(),
      pair: 'BTCUSDT',
      tf: 'M15',
      method: 'FIBO',
      methodLabel: 'Fibonacci Golden Pocket 0.618–0.786 (M15)',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 85,
      entryMin: 59820.00,
      entryMax: 59950.00,
      entryPrice: 59885.00,
      sl: 60125.00,
      slUnits: 240,
      tp1: 59505.00,
      tp1Units: 380,
      tp2: 59345.00,
      tp2Units: 540,
      tp3: 59085.00,
      tp3Units: 800,
      unitLabel: 'pts',
      status: 'TP3 HIT',
      resultUnits: 800,
      structure: 'Rejection Golden Pocket 0.705 Fibo + Sweep Equal Highs M15.'
    },
    {
      id: 'hist-seed-3',
      createdAt: new Date(now - 3600000 * 8).toISOString(),
      closedAt: new Date(now - 3600000 * 7).toISOString(),
      pair: 'XAUUSD',
      tf: 'M15',
      method: 'SMC',
      methodLabel: 'SMC Liquidity Sweep + Discount FVG (M15)',
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: 82,
      entryMin: 2714.00,
      entryMax: 2715.50,
      entryPrice: 2714.80,
      sl: 2711.80,
      slUnits: 30,
      tp1: 2719.30,
      tp1Units: 45,
      tp2: 2721.30,
      tp2Units: 65,
      tp3: 2724.30,
      tp3Units: 95,
      unitLabel: 'pips',
      status: 'BREAK EVEN',
      resultUnits: 0,
      structure: 'Harga sempat menyentuh TP1 (+45 pips), SL digeser ke BE sebelum pullback.'
    },
    {
      id: 'hist-seed-4',
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      closedAt: new Date(now - 86400000 * 2 + 3600000).toISOString(),
      pair: 'US100',
      tf: 'M15',
      method: 'LIQ',
      methodLabel: 'Equal Highs Liquidity Reversal (M15)',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 79,
      entryMin: 21210.00,
      entryMax: 21222.00,
      entryPrice: 21216.00,
      sl: 21238.00,
      slUnits: 22,
      tp1: 21181.00,
      tp1Units: 35,
      tp2: 21166.00,
      tp2Units: 50,
      tp3: 21141.00,
      tp3Units: 75,
      unitLabel: 'pts',
      status: 'SL HIT',
      resultUnits: -22,
      structure: 'Ekspansi volume pembukaan NY menembus batas invalidasi atas.'
    }
  ];
}

const DEFAULT_STATE = {
  theme: 'light',
  activeTab: 'home',
  selectedPair: 'XAUUSD',
  selectedTF: 'M15',
  selectedMethod: 'AUTO',
  weekendBtcMode: true,
  autoNotif: true,
  historyPeriod: 'TODAY', // TODAY | WEEK | MONTH | YEAR | ALL
  historyFeedMode: 'SYSTEM', // SYSTEM | JOURNAL
  activeAccountId: 'acc-1',
  accounts: DEFAULT_ACCOUNTS,
  lockedSetups: {}, // Key: `${pair}_${tf}` -> Single locked setup object
  signalHistory: createInitialHistorySeed(),
  userJournal: [], // Khusus setup yang diambil user ("Ambil Setup")
  checklist: [
    { id: 'c1', text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', done: true },
    { id: 'c2', text: 'Cek jadwal High Impact News USD (CPI/NFP/FOMC)', done: false },
    { id: 'c3', text: 'Wajib tunggu Liquidity Sweep + CHoCH M5/M1', done: false }
  ],
  twelveDataKey: '',
  tgToken: '',
  tgChatId: ''
};

// Migrasi otomatis pengaturan lama agar API Key, Token & Akun tetap tersimpan
const prevV23 = JSON.parse(localStorage.getItem('liamvtrade_v23_state') || 'null');
const prevV22 = JSON.parse(localStorage.getItem('liamvtrade_v22_state') || 'null');
const prevV21 = JSON.parse(localStorage.getItem('liamvtrade_v21_state') || '{}');
const savedState = JSON.parse(localStorage.getItem('liamvtrade_v24_state') || 'null');

let state = {
  ...DEFAULT_STATE,
  ...(savedState || prevV23 || prevV22 || prevV21)
};

if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
  state.accounts = [...DEFAULT_ACCOUNTS];
}
if (!state.lockedSetups || typeof state.lockedSetups !== 'object') {
  state.lockedSetups = {};
}
if (!Array.isArray(state.signalHistory)) {
  state.signalHistory = createInitialHistorySeed();
}
if (!Array.isArray(state.userJournal)) {
  state.userJournal = [];
}

// Otomatis pilih BTCUSDT saat Sabtu/Minggu jika Weekend BTC Mode aktif
(function autoSelectWeekendPair() {
  const now = new Date();
  const wib = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
  const day = wib.getDay();
  if ((day === 0 || day === 6) && state.weekendBtcMode) {
    state.selectedPair = 'BTCUSDT';
  }
})();

let livePrices = {
  XAUUSD: 2712.50,
  US100: 21180.00,
  BTCUSDT: 59350.00,
  EURUSD: 1.05450
};

let priceFeedStatus = {
  XAUUSD: 'REF',
  US100: 'REF',
  BTCUSDT: 'SYNC',
  EURUSD: 'REF'
};

let marketRanges = {
  XAUUSD: { high: 2718.00, low: 2705.20 },
  US100: { high: 21240.00, low: 21110.00 },
  BTCUSDT: { high: 60250.00, low: 59150.00 },
  EURUSD: { high: 1.05680, low: 1.05210 }
};

let activeNewsList = typeof LIAMV_NEWS !== 'undefined' ? [...LIAMV_NEWS] : [];
let currentNewsFilter = 'ALL';
let lastTwelveDataSync = 0;
let expandedHistoryId = null;

function saveState() {
  localStorage.setItem('liamvtrade_v24_state', JSON.stringify(state));
}

function getActiveAccount() {
  return state.accounts.find((a) => a.id === state.activeAccountId) || state.accounts[0];
}

// ==================== 2. TOAST & AUDIO CHIME ====================
function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('opacity-0', '-translate-y-2');
  box.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    box.classList.remove('opacity-100', 'translate-y-0');
    box.classList.add('opacity-0', '-translate-y-2');
  }, 2800);
}

function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (e) {}
}

// ==================== 3. LIVE MARKET PRICES (BEBAS BLOKIR DNS 4G INDONESIA) ====================
async function fetchLiveBtcUnblocked() {
  try {
    const ccRes = await fetch(
      'https://min-api.cryptocompare.com/data/v2/histominute?fsym=BTC&tsym=USD&limit=32&aggregate=15',
      { cache: 'no-store' }
    );
    const ccJson = await ccRes.json();
    const candles = ccJson?.Data?.Data;
    if (Array.isArray(candles) && candles.length > 0) {
      const latest = candles[candles.length - 1];
      livePrices.BTCUSDT = parseFloat(latest.close);
      priceFeedStatus.BTCUSDT = 'LIVE';

      const highs = candles.map((c) => parseFloat(c.high));
      const lows = candles.map((c) => parseFloat(c.low));
      marketRanges.BTCUSDT = {
        high: Math.max(...highs),
        low: Math.min(...lows)
      };
      return true;
    }
  } catch (e) {}

  try {
    const cgRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_high=true&include_24hr_low=true',
      { cache: 'no-store' }
    );
    const cgJson = await cgRes.json();
    if (cgJson?.bitcoin?.usd) {
      const p = parseFloat(cgJson.bitcoin.usd);
      livePrices.BTCUSDT = p;
      priceFeedStatus.BTCUSDT = 'LIVE';
      marketRanges.BTCUSDT = {
        high: parseFloat(cgJson.bitcoin.usd_24h_high) || +(p + 450).toFixed(2),
        low: parseFloat(cgJson.bitcoin.usd_24h_low) || +(p - 450).toFixed(2)
      };
      return true;
    }
  } catch (e) {}

  return false;
}

async function syncLiveMarketPrices(forceTwelveData = false) {
  const btcOk = await fetchLiveBtcUnblocked();

  const now = Date.now();
  if (state.twelveDataKey && (forceTwelveData || now - lastTwelveDataSync >= 55000)) {
    lastTwelveDataSync = now;
    const symbols = btcOk ? 'XAU/USD,EUR/USD,QQQ' : 'XAU/USD,EUR/USD,QQQ,BTC/USD';
    try {
      const r = await fetch(
        `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${state.twelveDataKey}`,
        { cache: 'no-store' }
      );
      const data = await r.json();

      if (data['XAU/USD']?.price) {
        const p = parseFloat(data['XAU/USD'].price);
        livePrices.XAUUSD = p;
        priceFeedStatus.XAUUSD = 'LIVE';
        marketRanges.XAUUSD = { high: +(p + 6.5).toFixed(2), low: +(p - 6.5).toFixed(2) };
      }
      if (data['EUR/USD']?.price) {
        const p = parseFloat(data['EUR/USD'].price);
        livePrices.EURUSD = p;
        priceFeedStatus.EURUSD = 'LIVE';
        marketRanges.EURUSD = { high: +(p + 0.0022).toFixed(5), low: +(p - 0.0022).toFixed(5) };
      }
      if (data['QQQ']?.price) {
        const p = +(parseFloat(data['QQQ'].price) * 42.15).toFixed(2);
        livePrices.US100 = p;
        priceFeedStatus.US100 = 'LIVE';
        marketRanges.US100 = { high: +(p + 65).toFixed(2), low: +(p - 65).toFixed(2) };
      }
      if (!btcOk && data['BTC/USD']?.price) {
        const p = parseFloat(data['BTC/USD'].price);
        livePrices.BTCUSDT = p;
        priceFeedStatus.BTCUSDT = 'LIVE';
        marketRanges.BTCUSDT = { high: +(p + 450).toFixed(2), low: +(p - 450).toFixed(2) };
      }
    } catch (e) {}
  }

  // Pantau apakah harga live menyentuh TP1/TP2/TP3/BE/SL pada setup yang sedang terkunci
  evaluateLockedSetupsAgainstLivePrice();

  updateHeaderTicker();
  updateRadarMetricsUI();
  if (state.activeTab === 'signals') renderSignals();
}

function updateHeaderTicker() {
  const pairId = state.selectedPair || 'XAUUSD';
  const cfg = typeof LIAMV_PAIRS !== 'undefined' ? LIAMV_PAIRS[pairId] : null;
  const decimals = cfg ? cfg.decimals : 2;
  const price = Number(livePrices[pairId]) || 0;
  const status = priceFeedStatus[pairId] || 'REF';

  const lblEl = document.getElementById('header-pair-label');
  const prcEl = document.getElementById('header-pair-price');
  const stsEl = document.getElementById('header-price-status');

  if (lblEl) lblEl.textContent = pairId === 'BTCUSDT' ? 'BTC' : pairId;
  if (prcEl) {
    prcEl.textContent = price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  if (stsEl) {
    stsEl.className = `relative inline-flex rounded-full h-2 w-2 ${
      status === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-400'
    }`;
  }
}

function updateRadarMetricsUI() {
  const select = document.getElementById('chart-symbol-select');
  const modeLabel = document.getElementById('scanner-engine-mode');
  const hiEl = document.getElementById('radar-asia-high');
  const loEl = document.getElementById('radar-asia-low');
  const rngEl = document.getElementById('radar-day-range');
  if (!select || !hiEl || !loEl || !rngEl) return;

  const [, apiSym] = select.value.split('|');
  const mapSymToPair = {
    'XAU/USD': 'XAUUSD',
    NDX: 'US100',
    BTCUSDT: 'BTCUSDT',
    'EUR/USD': 'EURUSD'
  };
  const pairId = mapSymToPair[apiSym] || 'BTCUSDT';
  const dec = pairId === 'EURUSD' ? 5 : 2;
  const rng = marketRanges[pairId] || { high: 0, low: 0 };

  hiEl.textContent = rng.high.toFixed(dec);
  loEl.textContent = rng.low.toFixed(dec);
  rngEl.textContent =
    pairId === 'EURUSD'
      ? `${Math.round((rng.high - rng.low) * 10000)} pips`
      : `$${(rng.high - rng.low).toFixed(2)}`;

  if (modeLabel) {
    modeLabel.textContent =
      priceFeedStatus[pairId] === 'LIVE'
        ? `Live ${pairId} Feed Terhubung (${livePrices[pairId].toFixed(dec)})`
        : `${pairId} Referensi (Market Tutup / Menunggu Sesi)`;
  }
}

// ==================== 4. THEME & NAVIGATION ====================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');
  if (sun && moon) {
    if (theme === 'dark') {
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
  }
  if (state.activeTab === 'chart') renderTradingViewChart();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveState();
  applyTheme(state.theme);
}

function switchTab(tabName) {
  state.activeTab = tabName;
  saveState();
  ['home', 'news', 'signals', 'chart', 'profile'].forEach((t) => {
    const sec = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    if (!sec) return;

    if (t === tabName) {
      sec.classList.remove('hidden', 'page-enter');
      void sec.offsetWidth;
      sec.classList.add('page-enter');
      if (nav && t !== 'signals') {
        nav.classList.add('nav-active', 'text-blue-500');
        nav.classList.remove('opacity-60');
      }
    } else {
      sec.classList.add('hidden');
      if (nav && t !== 'signals') {
        nav.classList.remove('nav-active', 'text-blue-500');
        nav.classList.add('opacity-60');
      }
    }
  });

  if (tabName === 'chart') {
    const chartSel = document.getElementById('chart-symbol-select');
    if (chartSel && state.selectedPair === 'BTCUSDT') {
      chartSel.value = 'BINANCE:BTCUSDT|BTCUSDT';
    }
    renderTradingViewChart();
    updateRadarMetricsUI();
  }
  if (tabName === 'signals') renderSignals();
}

// ==================== 5. REAL-TIME WIB, TIMER SETUP & WEEKEND BTC ====================
function toggleWeekendBtcMode() {
  state.weekendBtcMode = !state.weekendBtcMode;
  saveState();
  updateWibSession();
  if (state.weekendBtcMode) {
    setSignalPair('BTCUSDT');
    showToast('₿ Weekend BTC Mode Aktif — Pasar Crypto 24/7');
  } else {
    showToast('⏸️ Weekend BTC Mode Dinonaktifkan');
  }
}

function formatElapsedDuration(isoStart) {
  if (!isoStart) return '0m 00s berjalan';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = String(diffSec % 60).padStart(2, '0');
  if (hrs > 0) return `${hrs}j ${mins}m ${secs}s berjalan`;
  return `${mins}m ${secs}s berjalan`;
}

function updateWibSession() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayIdx = wib.getDay();
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  const decHour = wib.getHours() + wib.getMinutes() / 60;

  const clockEl = document.getElementById('live-clock-wib');
  if (clockEl) clockEl.textContent = `${days[dayIdx]}, ${hh}:${mm}:${ss} WIB`;

  // Perbarui timer live pada kartu sinyal aktif setiap detik
  const activeKey = `${state.selectedPair}_${state.selectedTF}`;
  const activeSetup = state.lockedSetups[activeKey];
  const timerEl = document.getElementById('live-setup-timer');
  if (timerEl && activeSetup && activeSetup.status === 'LIVE') {
    timerEl.textContent = formatElapsedDuration(activeSetup.createdAt);
  }

  const dayNotes = {
    0: 'Minggu — Forex/Gold Tutup • Crypto BTCUSDT Aktif 24/7',
    1: 'Senin — Pembentukan Range Awal, Rawan False Breakout',
    2: 'Selasa — Pembentukan Weekly High/Low & Ekspansi Awal',
    3: 'Rabu — Sesi Paling Teknis, Struktur SMC Sangat Rapi',
    4: 'Kamis — Rawan Reversal & Sweep News Klaim Pengangguran',
    5: 'Jumat — Volatilitas Tinggi Awal NY & Profit Taking Akhir Pekan',
    6: 'Sabtu — Forex/Gold Tutup • Crypto BTCUSDT Aktif 24/7'
  };
  const dayEl = document.getElementById('day-behavior-text');
  if (dayEl) dayEl.textContent = dayNotes[dayIdx];

  const wkToggle = document.getElementById('weekend-btc-toggle');
  if (wkToggle) {
    wkToggle.textContent = state.weekendBtcMode ? '₿ Weekend BTC: ON' : '₿ Weekend BTC: OFF';
  }

  let title = 'Dini Hari (Dilarang Entry)';
  let desc = 'Volatilitas mati & spread mekar. Fokus istirahat.';
  let badge = 'LOCKED';

  if (dayIdx === 0 || dayIdx === 6) {
    if (state.weekendBtcMode) {
      title = 'Weekend Crypto (BTC 24/7)';
      desc = 'XAUUSD, US100 & EURUSD tutup. Sinyal & harga live BTCUSDT aktif penuh!';
      badge = 'BTC ACTIVE';
    } else {
      title = 'Weekend Market Tutup';
      desc = 'Aktifkan Weekend BTC Mode jika ingin memantau sinyal Bitcoin 24/7.';
      badge = 'CLOSED';
    }
  } else if (decHour >= 7 && decHour < 14) {
    title = 'Sesi Asia (Ranging)';
    desc = 'Pembentukan Asia High & Asia Low (Liquidity Pool). HINDARI ENTRY.';
    badge = 'WAIT POOL';
  } else if (decHour >= 14 && decHour < 15.5) {
    title = 'Pra-London (Manipulasi)';
    desc = 'Sering terjadi sweep tipis pada Asia High/Low. Siapkan alert.';
    badge = 'STANDBY';
  } else if (decHour >= 15.5 && decHour < 18) {
    title = 'Prime London Session';
    desc = 'Jam prioritas entry! Ekspansi awal & sweep Asia Range.';
    badge = 'PRIME';
  } else if (decHour >= 18 && decHour < 20.5) {
    title = 'Overlap / Pra-New York';
    desc = 'Pullback menuju FVG M15 sebelum pembukaan bursa NY.';
    badge = 'OBSERVE';
  } else if (decHour >= 20.5 && decHour < 22.5) {
    title = 'Prime New York Session';
    desc = 'Peak volume paling likuid! Pantau Sweep + CHoCH M5/M1.';
    badge = 'PRIME';
  } else if (decHour >= 22.5 || decHour < 1) {
    title = 'Tengah / Akhir NY';
    desc = 'Pergerakan melambat, hindari entry baru & amankan posisi.';
    badge = 'WIND DOWN';
  }

  const titleEl = document.getElementById('session-title');
  const descEl = document.getElementById('session-desc');
  const badgeEl = document.getElementById('session-badge-text');
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (badgeEl) badgeEl.textContent = badge;
}

// ==================== 6. MULTI-ACCOUNT PORTFOLIO & CIRCUIT BREAKER ====================
function selectActiveAccount(accId) {
  state.activeAccountId = accId;
  saveState();
  renderHomeDashboard();
  renderSignals();
}

function adjustAccountLimit(field, delta) {
  const acc = getActiveAccount();
  if (!acc) return;
  if (field === 'maxEntries') {
    acc.maxEntries = Math.max(1, Math.min(20, (acc.maxEntries || 2) + delta));
  } else if (field === 'maxSLs') {
    acc.maxSLs = Math.max(1, Math.min(10, (acc.maxSLs || 2) + delta));
  }
  saveState();
  renderHomeDashboard();
  showToast(`⚙️ Batas ${field === 'maxEntries' ? 'Entry' : 'SL'} ${acc.name} diubah`);
}

function adjustCounter(type, delta) {
  const acc = getActiveAccount();
  if (!acc) return;

  if (type === 'entries') {
    acc.entriesToday = Math.max(0, Math.min(acc.maxEntries, acc.entriesToday + delta));
  } else {
    acc.slsToday = Math.max(0, Math.min(acc.maxSLs, acc.slsToday + delta));
    if (acc.slsToday >= acc.maxSLs) {
      showToast(`🛑 Batas ${acc.maxSLs} SL pada ${acc.name} tercapai!`);
    }
  }
  saveState();
  renderHomeDashboard();
}

function recordTradeOutcome(accId, isWin) {
  const acc = state.accounts.find((a) => a.id === accId);
  if (!acc) return;

  const riskUsd = +(acc.balance * (acc.riskPct / 100)).toFixed(2);
  if (isWin) {
    acc.wins += 1;
    acc.equity = +(acc.equity + riskUsd * 2).toFixed(2);
    acc.entriesToday = Math.min(acc.maxEntries, acc.entriesToday + 1);
    showToast(`✅ +$${(riskUsd * 2).toFixed(1)} Win dicatat di ${acc.name}`);
  } else {
    acc.losses += 1;
    acc.equity = +(acc.equity - riskUsd).toFixed(2);
    acc.entriesToday = Math.min(acc.maxEntries, acc.entriesToday + 1);
    acc.slsToday = Math.min(acc.maxSLs, acc.slsToday + 1);
    showToast(`❌ -$${riskUsd.toFixed(1)} SL dicatat di ${acc.name}`);
  }

  saveState();
  renderHomeDashboard();
}

function addNewAccount() {
  const name = document.getElementById('new-acc-name')?.value.trim();
  const firm = document.getElementById('new-acc-firm')?.value.trim() || 'Prop Firm';
  const balance = parseFloat(document.getElementById('new-acc-balance')?.value) || 5000;
  const riskPct = parseFloat(document.getElementById('new-acc-risk')?.value) || 0.4;
  const maxEntries = parseInt(document.getElementById('new-acc-max-entry')?.value, 10) || 2;
  const maxSLs = parseInt(document.getElementById('new-acc-max-sl')?.value, 10) || 2;
  const myfxbookId = document.getElementById('new-acc-myfxbook')?.value.trim() || '';

  if (!name) {
    showToast('⚠️ Isi nama akun terlebih dahulu');
    return;
  }

  const newAcc = {
    id: `acc-${Date.now()}`,
    name,
    firm,
    balance,
    equity: balance,
    wins: 0,
    losses: 0,
    riskPct,
    maxEntries,
    maxSLs,
    entriesToday: 0,
    slsToday: 0,
    myfxbookId
  };

  state.accounts.push(newAcc);
  state.activeAccountId = newAcc.id;
  saveState();

  document.getElementById('new-acc-name').value = '';
  document.getElementById('new-acc-myfxbook').value = '';
  renderHomeDashboard();
  renderSignals();
  showToast(`🎉 Akun "${name}" berhasil ditambahkan!`);
}

function deleteAccount(accId) {
  if (state.accounts.length <= 1) {
    showToast('⚠️ Minimal harus menyisakan 1 akun aktif');
    return;
  }
  state.accounts = state.accounts.filter((a) => a.id !== accId);
  if (state.activeAccountId === accId) {
    state.activeAccountId = state.accounts[0].id;
  }
  saveState();
  renderHomeDashboard();
  renderSignals();
  showToast('🗑️ Akun dihapus');
}

function renderHomeDashboard() {
  const activeAcc = getActiveAccount();

  const accSelect = document.getElementById('active-account-select');
  if (accSelect) {
    accSelect.innerHTML = state.accounts
      .map(
        (a) =>
          `<option value="${a.id}" ${a.id === activeAcc.id ? 'selected' : ''}>${a.name} ($${a.balance.toLocaleString()})</option>`
      )
      .join('');
  }

  const entryEl = document.getElementById('daily-entry-count');
  const slEl = document.getElementById('daily-sl-count');
  const maxEntryEl = document.getElementById('max-entry-display');
  const maxSlEl = document.getElementById('max-sl-display');

  if (entryEl) entryEl.textContent = `${activeAcc.entriesToday} / ${activeAcc.maxEntries}`;
  if (slEl) slEl.textContent = `${activeAcc.slsToday} / ${activeAcc.maxSLs}`;
  if (maxEntryEl) maxEntryEl.textContent = activeAcc.maxEntries;
  if (maxSlEl) maxSlEl.textContent = activeAcc.maxSLs;

  const cbAlert = document.getElementById('circuit-breaker-alert');
  if (cbAlert) {
    cbAlert.classList.toggle('hidden', activeAcc.slsToday < activeAcc.maxSLs);
  }

  const listEl = document.getElementById('checklist-items');
  if (listEl) {
    listEl.innerHTML = state.checklist
      .map(
        (item, idx) => `
        <div onclick="toggleChecklist(${idx})" class="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border-subtle)] cursor-pointer transition active:scale-[0.99] ${item.done ? 'bg-blue-500/10' : ''}">
          <div class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${item.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400'}">
            ${item.done ? '✓' : ''}
          </div>
          <span class="text-xs font-medium ${item.done ? 'line-through opacity-60' : ''}">${item.text}</span>
        </div>
      `
      )
      .join('');
  }

  const doneCount = state.checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / state.checklist.length) * 100);
  const pctEl = document.getElementById('discipline-pct-badge');
  if (pctEl) pctEl.textContent = `${pct}%`;

  const totalBalance = state.accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalEquity = state.accounts.reduce((sum, a) => sum + Number(a.equity), 0);
  const totalProfit = totalEquity - totalBalance;
  const totalWins = state.accounts.reduce((sum, a) => sum + Number(a.wins), 0);
  const totalLosses = state.accounts.reduce((sum, a) => sum + Number(a.losses), 0);
  const totalTrades = totalWins + totalLosses;
  const avgWinrate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

  const eqEl = document.getElementById('portfolio-total-equity');
  const prfEl = document.getElementById('portfolio-total-profit');
  const wrEl = document.getElementById('portfolio-avg-winrate');

  if (eqEl) eqEl.textContent = `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (prfEl) {
    const sign = totalProfit >= 0 ? '+' : '-';
    prfEl.textContent = `${sign}$${Math.abs(totalProfit).toFixed(0)}`;
    prfEl.className = `font-mono-num text-xs font-extrabold mt-0.5 block whitespace-nowrap ${
      totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
    }`;
  }
  if (wrEl) wrEl.textContent = `${avgWinrate}% (${totalWins}W/${totalLosses}L)`;

  const accListEl = document.getElementById('accounts-list-container');
  if (accListEl) {
    accListEl.innerHTML = state.accounts
      .map((a) => {
        const pnl = a.equity - a.balance;
        const pnlPct = ((pnl / a.balance) * 100).toFixed(2);
        const trades = a.wins + a.losses;
        const wr = trades > 0 ? Math.round((a.wins / trades) * 100) : 0;
        const isSelected = a.id === activeAcc.id;

        return `
          <div onclick="selectActiveAccount('${a.id}')" class="p-3.5 rounded-2xl border transition cursor-pointer ${
            isSelected
              ? 'bg-blue-500/15 border-blue-400/50'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-display text-xs font-extrabold text-white truncate">${a.name}</span>
                  ${isSelected ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold">AKTIF</span>' : ''}
                </div>
                <span class="text-[10px] text-slate-400 block">${a.firm} • Risk ${a.riskPct}% • Limit ${a.maxEntries}E/${a.maxSLs}SL</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-mono-num text-xs font-extrabold text-white block">$${a.equity.toLocaleString()}</span>
                <span class="font-mono-num text-[10px] font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                  ${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(0)} (${pnlPct}%)
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-[10px]">
              <span class="text-slate-300 font-mono-num">WR: <strong>${wr}%</strong> • ${a.myfxbookId ? `ID #${a.myfxbookId}` : 'Myfxbook Standby'}</span>
              <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                <button onclick="recordTradeOutcome('${a.id}', true)" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">+Win</button>
                <button onclick="recordTradeOutcome('${a.id}', false)" class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">+SL</button>
                <button onclick="deleteAccount('${a.id}')" class="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-bold">×</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}

function toggleChecklist(idx) {
  state.checklist[idx].done = !state.checklist[idx].done;
  saveState();
  renderHomeDashboard();
}

// ==================== 7. LOCKED SNIPER ENGINE, AUTO-NOTIF & JOURNAL ====================
function populateMethodDropdown() {
  const select = document.getElementById('method-select');
  if (!select || typeof LIAMV_METHODS === 'undefined') return;
  select.innerHTML = LIAMV_METHODS.map(
    (m) => `<option value="${m.id}" ${m.id === state.selectedMethod ? 'selected' : ''}>${m.name}</option>`
  ).join('');
}

function updateAutoNotifUI() {
  const btn = document.getElementById('auto-notif-btn');
  const badge = document.getElementById('auto-notif-badge');
  if (!btn || !badge) return;
  if (state.autoNotif) {
    btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95';
    badge.textContent = 'AUTO-NOTIF: ON';
  } else {
    btn.className = 'px-3 py-1.5 rounded-xl bg-slate-500/15 border border-slate-400/30 opacity-75 text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95';
    badge.textContent = 'AUTO-NOTIF: OFF';
  }
}

function toggleAutoNotif() {
  state.autoNotif = !state.autoNotif;
  saveState();
  updateAutoNotifUI();
  if (state.autoNotif) {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(updateNativeNotifStatusUI);
    }
    showToast('🔔 Auto-Notif Aktif — Sinyal baru & hasil TP/SL otomatis terkirim!');
  } else {
    showToast('🔕 Auto-Notif Dimatikan');
  }
}

function getOrLockCurrentSniperSetup(forceRefresh = false) {
  const pairId = state.selectedPair || 'XAUUSD';
  const tf = state.selectedTF || 'M15';
  const methodId = state.selectedMethod || 'AUTO';
  const key = `${pairId}_${tf}`;

  let existing = state.lockedSetups[key];
  if (!existing || existing.status !== 'LIVE' || forceRefresh) {
    const newSetup = buildLockedSniperSetup(
      pairId,
      tf,
      methodId,
      livePrices[pairId],
      marketRanges
    );
    state.lockedSetups[key] = newSetup;
    saveState();

    // Otomatis kirim notifikasi saat setup baru terkunci jika Auto-Notif ON
    if (state.autoNotif) {
      dispatchAutoSetupNotification(newSetup, 'NEW');
    }
    return newSetup;
  }
  return existing;
}

function forceNewSniperSetup() {
  const setup = getOrLockCurrentSniperSetup(true);
  renderSignals();
  showToast(`🎯 Setup baru terkunci: ${setup.pair} ${setup.direction}`);
}

function evaluateLockedSetupsAgainstLivePrice() {
  let changed = false;

  Object.keys(state.lockedSetups).forEach((key) => {
    const sig = state.lockedSetups[key];
    if (!sig || sig.status !== 'LIVE') return;

    const current = Number(livePrices[sig.pair]);
    if (!current) return;

    const isBuy = sig.side === 'BUY';

    if (isBuy) {
      if (current >= sig.tp3) {
        finalizeSetupOutcome(key, 'TP3 HIT', sig.tp3Units);
        changed = true;
      } else if (current >= sig.tp1 && !sig.tp1Reached) {
        sig.tp1Reached = true;
        sig.sl = sig.entryPrice; // Geser SL otomatis ke Break Even
        changed = true;
        if (state.autoNotif) dispatchAutoSetupNotification(sig, 'TP1_BE');
      } else if (current <= sig.sl) {
        if (sig.tp1Reached) {
          finalizeSetupOutcome(key, 'BREAK EVEN', 0);
        } else {
          finalizeSetupOutcome(key, 'SL HIT', -sig.slUnits);
        }
        changed = true;
      }
    } else {
      if (current <= sig.tp3) {
        finalizeSetupOutcome(key, 'TP3 HIT', sig.tp3Units);
        changed = true;
      } else if (current <= sig.tp1 && !sig.tp1Reached) {
        sig.tp1Reached = true;
        sig.sl = sig.entryPrice;
        changed = true;
        if (state.autoNotif) dispatchAutoSetupNotification(sig, 'TP1_BE');
      } else if (current >= sig.sl) {
        if (sig.tp1Reached) {
          finalizeSetupOutcome(key, 'BREAK EVEN', 0);
        } else {
          finalizeSetupOutcome(key, 'SL HIT', -sig.slUnits);
        }
        changed = true;
      }
    }
  });

  if (changed) saveState();
}

function finalizeSetupOutcome(setupKey, finalStatus, signedUnits) {
  const sig = state.lockedSetups[setupKey];
  if (!sig) return;

  sig.status = finalStatus;
  sig.resultUnits = signedUnits;
  sig.closedAt = new Date().toISOString();

  // Masukkan ke riwayat sinyal sistem (paling atas)
  state.signalHistory.unshift({ ...sig });

  // Jika user sempat menekan "Ambil Setup", perbarui jurnal pribadi & saldo akunnya
  if (sig.takenByUser) {
    const pnlUsd = calculateUsdPnl(sig.pair, signedUnits, sig.takenLot || 0.01);
    const jIdx = state.userJournal.findIndex((j) => j.id === sig.id);
    const journalEntry = {
      ...sig,
      status: finalStatus,
      resultUnits: signedUnits,
      pnlUsd: pnlUsd
    };
    if (jIdx >= 0) {
      state.userJournal[jIdx] = journalEntry;
    } else {
      state.userJournal.unshift(journalEntry);
    }

    const acc = state.accounts.find((a) => a.id === sig.takenAccountId);
    if (acc) {
      acc.equity = +(acc.equity + pnlUsd).toFixed(2);
      if (signedUnits > 0) acc.wins += 1;
      if (signedUnits < 0) {
        acc.losses += 1;
        acc.slsToday = Math.min(acc.maxSLs, acc.slsToday + 1);
      }
    }
  }

  saveState();
  renderHomeDashboard();

  if (state.autoNotif) {
    dispatchAutoSetupNotification(sig, finalStatus);
  }
}

function manualResolveCurrentSetup(outcomeType) {
  const key = `${state.selectedPair}_${state.selectedTF}`;
  const sig = state.lockedSetups[key];
  if (!sig || sig.status !== 'LIVE') return;

  const mapUnits = {
    'TP1 HIT': sig.tp1Units,
    'TP2 HIT': sig.tp2Units,
    'TP3 HIT': sig.tp3Units,
    'BREAK EVEN': 0,
    'SL HIT': -sig.slUnits
  };
  finalizeSetupOutcome(key, outcomeType, mapUnits[outcomeType] ?? 0);
  renderSignals();
  showToast(`📌 Hasil dicatat: ${sig.pair} → ${outcomeType}`);
}

function takeCurrentSetup() {
  const key = `${state.selectedPair}_${state.selectedTF}`;
  const sig = getOrLockCurrentSniperSetup(false);
  const activeAcc = getActiveAccount();

  if (sig.takenByUser) {
    showToast(`ℹ️ Setup ini sudah masuk Jurnal (${sig.takenAccountName})`);
    return;
  }

  const lotSize = calculateLotForPair(sig.pair, sig.slUnits, activeAcc.balance, activeAcc.riskPct);
  sig.takenByUser = true;
  sig.takenAccountId = activeAcc.id;
  sig.takenAccountName = activeAcc.name;
  sig.takenLot = lotSize;

  activeAcc.entriesToday = Math.min(activeAcc.maxEntries, activeAcc.entriesToday + 1);

  state.userJournal.unshift({
    ...sig,
    pnlUsd: 0
  });

  saveState();
  renderHomeDashboard();
  renderSignals();
  showToast(`✅ Setup masuk Jurnal Saya (${activeAcc.name} • ${lotSize.toFixed(2)} lot)`);
}

function setSignalPair(pairId) {
  state.selectedPair = pairId;
  saveState();
  ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((p) => {
    const btn = document.getElementById(`pair-btn-${p}`);
    if (!btn) return;
    if (p === pairId) {
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
    }
  });
  updateHeaderTicker();
  renderSignals();
}

function setSignalTF(tf) {
  state.selectedTF = tf;
  saveState();
  ['M5', 'M15', 'H1', 'H4'].forEach((t) => {
    const btn = document.getElementById(`tf-btn-${t}`);
    if (!btn) return;
    if (t === tf) {
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
    }
  });
  renderSignals();
}

function onMethodChange() {
  const val = document.getElementById('method-select')?.value || 'AUTO';
  state.selectedMethod = val;
  saveState();
  forceNewSniperSetup();
}

function setHistoryPeriod(period) {
  state.historyPeriod = period;
  saveState();
  ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].forEach((p) => {
    const btn = document.getElementById(`period-btn-${p}`);
    if (!btn) return;
    if (p === period) {
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('glass-card');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('glass-card');
    }
  });
  renderHistoryAndStats();
}

function setHistoryFeedMode(mode) {
  state.historyFeedMode = mode;
  saveState();
  ['SYSTEM', 'JOURNAL'].forEach((m) => {
    const btn = document.getElementById(`feed-tab-${m}`);
    if (!btn) return;
    if (m === mode) {
      btn.classList.add('bg-blue-600', 'text-white');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
    }
  });
  renderHistoryAndStats();
}

function toggleHistoryCardDetail(itemId) {
  expandedHistoryId = expandedHistoryId === itemId ? null : itemId;
  renderHistoryAndStats();
}

function renderSignals() {
  const liveCardBox = document.getElementById('sniper-live-card');
  const outputBox = document.getElementById('smc-standard-output');
  if (!liveCardBox) return;

  updateAutoNotifUI();

  const sig = getOrLockCurrentSniperSetup(false);
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const activeAcc = getActiveAccount();
  const isBuy = sig.side === 'BUY';
  const meta = getConfidenceMeta(sig.confidence);
  const lotSize = calculateLotForPair(sig.pair, sig.slUnits, activeAcc.balance, activeAcc.riskPct);
  const livePrice = Number(livePrices[sig.pair]) || sig.entryPrice;
  const isLive = sig.status === 'LIVE';

  liveCardBox.innerHTML = `
    <div class="glass-card p-5 space-y-4 border-2 ${isBuy ? 'border-emerald-500/40' : 'border-rose-500/40'} shadow-lg">
      <!-- Baris Atas Ala Terminal Pro (Sesuai Referensi Gambar) -->
      <div class="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-1.5 h-10 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0"></div>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider ${isBuy ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}">
            ${sig.side}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-display text-base font-extrabold">${sig.pair}</span>
              <span class="text-[10px] font-bold opacity-60">(${sig.tf})</span>
            </div>
            <div class="flex items-center gap-1.5 text-[10.5px] opacity-75">
              <span class="w-1.5 h-1.5 rounded-full ${isLive ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}"></span>
              <span id="live-setup-timer" class="font-mono-num">${isLive ? formatElapsedDuration(sig.createdAt) : 'Selesai (' + sig.status + ')'}</span>
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-mono-num text-sm font-extrabold block">${livePrice.toFixed(d)}</span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            isLive ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-500'
          }">
            ${isLive ? '• LIVE LOCKED' : sig.status}
          </span>
        </div>
      </div>

      <!-- Metode & Confidence -->
      <div class="flex items-center justify-between gap-2">
        <div>
          <p class="text-xs font-bold">${sig.methodLabel}</p>
          <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${meta.badgeClass}">
            ${meta.tier} • ${sig.confidence}% PD
          </span>
        </div>
        <button onclick="forceNewSniperSetup()" class="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[10px] font-bold active:scale-95 whitespace-nowrap">
          ↻ Scan Baru
        </button>
      </div>

      <!-- Grid Harga Terkunci (Tidak Bergeser Sendiri) -->
      <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)]">
        <div>
          <span class="text-[9px] font-bold uppercase opacity-60 block">Zona Entry</span>
          <span class="font-mono-num text-[10.5px] font-extrabold text-amber-500">${sig.entryMin.toFixed(d)} - ${sig.entryMax.toFixed(d)}</span>
        </div>
        <div>
          <span class="text-[9px] font-bold uppercase opacity-60 block">Stop Loss</span>
          <span class="font-mono-num text-[10.5px] font-extrabold text-rose-500">${sig.sl.toFixed(d)} (${sig.slUnits}${sig.unitLabel[0]})</span>
        </div>
        <div>
          <span class="text-[9px] font-bold uppercase opacity-60 block">Lot (${activeAcc.name.split(' ')[0]})</span>
          <span class="font-mono-num text-[10.5px] font-extrabold text-blue-500 whitespace-nowrap">${lotSize.toFixed(2)} lot</span>
        </div>
      </div>

      <!-- Target TP1 - TP3 -->
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 1 (1:1.5 • Set BE)</span>
          <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp1.toFixed(d)} (+${sig.tp1Units} ${sig.unitLabel})</span>
        </div>
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 2 (1:2 • Intraday)</span>
          <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp2.toFixed(d)} (+${sig.tp2Units} ${sig.unitLabel})</span>
        </div>
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 3 (1:3 • Extreme)</span>
          <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp3.toFixed(d)} (+${sig.tp3Units} ${sig.unitLabel})</span>
        </div>
      </div>

      <!-- Alasan Struktur -->
      <p class="text-[11px] opacity-80 leading-relaxed">
        <strong>Struktur:</strong> ${sig.structure}
      </p>

      <!-- Tombol Ambil Setup (Masuk Jurnal & Excel) -->
      <div class="flex gap-2">
        <button onclick="takeCurrentSetup()" class="flex-1 py-2.5 rounded-xl ${
          sig.takenByUser
            ? 'bg-emerald-600 text-white'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
        } text-xs font-bold shadow active:scale-95">
          ${sig.takenByUser ? `✓ Tercatat di Jurnal (${sig.takenAccountName})` : `Ambil Setup (${activeAcc.name})`}
        </button>
      </div>

      <!-- Tombol Catat Hasil Akhir Manual (Jika Close Lebih Awal di MT5/cTrader) -->
      ${
        isLive
          ? `<div class="pt-2 border-t border-[var(--border-subtle)]">
              <span class="text-[9.5px] font-bold uppercase opacity-60 block mb-1.5">Tandai Hasil Setup (Jika Sudah Close):</span>
              <div class="grid grid-cols-5 gap-1.5 text-[9.5px] font-extrabold">
                <button onclick="manualResolveCurrentSetup('TP1 HIT')" class="py-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 active:scale-95">TP1</button>
                <button onclick="manualResolveCurrentSetup('TP2 HIT')" class="py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 active:scale-95">TP2</button>
                <button onclick="manualResolveCurrentSetup('TP3 HIT')" class="py-1.5 rounded-lg bg-emerald-500/25 text-emerald-500 active:scale-95">TP3</button>
                <button onclick="manualResolveCurrentSetup('BREAK EVEN')" class="py-1.5 rounded-lg bg-slate-500/15 opacity-80 active:scale-95">BE</button>
                <button onclick="manualResolveCurrentSetup('SL HIT')" class="py-1.5 rounded-lg bg-rose-500/15 text-rose-500 active:scale-95">SL</button>
              </div>
            </div>`
          : ''
      }
    </div>
  `;

  if (outputBox) {
    outputBox.textContent = formatStandardSmcSignal(sig, lotSize, activeAcc.name);
  }

  renderHistoryAndStats();
}

function filterItemsByPeriod(items, period) {
  if (period === 'ALL') return items;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return items.filter((item) => {
    const t = new Date(item.closedAt || item.createdAt).getTime();
    if (period === 'TODAY') return t >= startOfToday;
    if (period === 'WEEK') return t >= startOfToday - 6 * 86400000;
    if (period === 'MONTH') return t >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    if (period === 'YEAR') return t >= new Date(now.getFullYear(), 0, 1).getTime();
    return true;
  });
}

function renderHistoryAndStats() {
  const sourceList =
    state.historyFeedMode === 'JOURNAL' ? state.userJournal : state.signalHistory;
  const periodItems = filterItemsByPeriod(sourceList, state.historyPeriod);

  const jBadge = document.getElementById('journal-count-badge');
  if (jBadge) jBadge.textContent = state.userJournal.length;

  // Hitung Statistik Periode Terpilih
  const tpCount = periodItems.filter((i) => String(i.status).startsWith('TP')).length;
  const slCount = periodItems.filter((i) => i.status === 'SL HIT').length;
  const beCount = periodItems.filter((i) => i.status === 'BREAK EVEN').length;
  const decided = tpCount + slCount;
  const winrate = decided > 0 ? Math.round((tpCount / decided) * 100) : 0;
  const netUnits = periodItems.reduce((sum, i) => sum + (Number(i.resultUnits) || 0), 0);

  const elTot = document.getElementById('stat-total-signals');
  const elTp = document.getElementById('stat-tp-count');
  const elSl = document.getElementById('stat-sl-count');
  const elBe = document.getElementById('stat-be-count');
  const elWr = document.getElementById('stat-winrate');
  const elPips = document.getElementById('stat-net-pips');

  if (elTot) elTot.textContent = `${periodItems.length} SINYAL`;
  if (elTp) elTp.textContent = tpCount;
  if (elSl) elSl.textContent = slCount;
  if (elBe) elBe.textContent = beCount;
  if (elWr) elWr.textContent = `${winrate}%`;
  if (elPips) {
    elPips.textContent = `${netUnits >= 0 ? '+' : ''}${netUnits}`;
    elPips.className = `font-mono-num text-xs font-extrabold ${
      netUnits >= 0 ? 'text-emerald-500' : 'text-rose-500'
    }`;
  }

  const feedEl = document.getElementById('history-feed-container');
  if (!feedEl) return;

  if (periodItems.length === 0) {
    feedEl.innerHTML = `
      <div class="glass-card p-5 text-center">
        <p class="text-xs font-bold opacity-75">Belum ada catatan pada periode ini.</p>
        <p class="text-[11px] opacity-60 mt-1">${
          state.historyFeedMode === 'JOURNAL'
            ? 'Tekan tombol "Ambil Setup" pada kartu sinyal di atas untuk mencatat jurnal pribadimu.'
            : 'Riwayat otomatis terisi setiap sinyal menyentuh TP, Break Even, atau SL.'
        }</p>
      </div>
    `;
    return;
  }

  feedEl.innerHTML = periodItems
    .map((item) => {
      const cfg = LIAMV_PAIRS[item.pair] || LIAMV_PAIRS.XAUUSD;
      const d = cfg.decimals;
      const isBuy = item.side === 'BUY';
      const isTp = String(item.status).startsWith('TP');
      const isSl = item.status === 'SL HIT';
      const isExpanded = expandedHistoryId === item.id;
      const edu = explainSignalEducation(item);

      const badgeStyle = isTp
        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
        : isSl
        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
        : 'bg-slate-500/15 opacity-80 border border-slate-400/30';

      const wibTime = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(item.closedAt || item.createdAt));

      return `
        <div onclick="toggleHistoryCardDetail('${item.id}')" class="glass-card p-3.5 cursor-pointer transition active:scale-[0.99]">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-1 h-8 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0"></div>
              <span class="px-2 py-0.5 rounded text-[9.5px] font-extrabold ${
                isBuy ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
              }">${item.side}</span>
              <div class="min-w-0">
                <span class="font-display text-xs font-extrabold block truncate">${item.pair} <span class="opacity-55 font-normal">• ${wibTime}</span></span>
                ${
                  item.takenAccountName
                    ? `<span class="text-[9.5px] text-blue-500 font-bold block">${item.takenAccountName} (${item.takenLot} lot)</span>`
                    : ''
                }
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="font-mono-num text-xs font-extrabold block">${Number(item.entryPrice).toFixed(d)}</span>
              <span class="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold tracking-wider ${badgeStyle}">
                ${item.status}
              </span>
            </div>
          </div>

          <!-- Penjelasan Edukasi Pips Saat Kartu Diketuk -->
          ${
            isExpanded
              ? `<div class="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[11px] space-y-1.5">
                  <p class="font-mono-num font-bold text-blue-500">${edu.riskSummary}</p>
                  <p class="opacity-85 leading-relaxed">${edu.outcomeInsight}</p>
                  <p class="opacity-70 text-[10.5px]"><strong>Struktur:</strong> ${item.structure}</p>
                </div>`
              : `<p class="text-[9.5px] opacity-50 mt-1.5 text-right">Ketuk untuk penjelasan pips & evaluasi ▾</p>`
          }
        </div>
      `;
    })
    .join('');
}

function exportUserJournalCsv() {
  if (!state.userJournal || state.userJournal.length === 0) {
    showToast('⚠️ Jurnal Saya masih kosong — klik "Ambil Setup" pada sinyal dulu');
    return;
  }

  const headers = [
    'No',
    'Waktu Entry (WIB)',
    'Waktu Close (WIB)',
    'Akun Prop Firm',
    'Pair',
    'Timeframe',
    'Arah',
    'Metode',
    'Entry Price',
    'Stop Loss',
    'Jarak SL (Pips/Pts)',
    'Target TP2',
    'Lot Size',
    'Status Hasil',
    'Net Pips/Pts',
    'Estimasi PnL (USD)'
  ];

  const rows = state.userJournal.map((item, idx) => {
    const cfg = LIAMV_PAIRS[item.pair] || LIAMV_PAIRS.XAUUSD;
    const d = cfg.decimals;
    const fmtDate = (iso) =>
      iso
        ? new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
            .format(new Date(iso))
            .replace(/,/g, '')
        : 'Berjalan';

    const pnlUsd =
      typeof item.pnlUsd === 'number'
        ? item.pnlUsd
        : calculateUsdPnl(item.pair, Number(item.resultUnits) || 0, Number(item.takenLot) || 0.01);

    return [
      idx + 1,
      `"${fmtDate(item.createdAt)}"`,
      `"${fmtDate(item.closedAt)}"`,
      `"${item.takenAccountName || 'Akun Utama'}"`,
      item.pair,
      item.tf,
      item.direction,
      item.method,
      Number(item.entryPrice).toFixed(d),
      Number(item.sl).toFixed(d),
      item.slUnits,
      Number(item.tp2).toFixed(d),
      Number(item.takenLot || 0.01).toFixed(2),
      item.status,
      item.resultUnits || 0,
      pnlUsd.toFixed(2)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStr = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `Liamvtrade_Jurnal_Saya_${todayStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`📊 Excel CSV berhasil diunduh (${state.userJournal.length} trade)!`);
}

function copyStandardOutput() {
  const txt = document.getElementById('smc-standard-output')?.textContent || '';
  navigator.clipboard.writeText(txt);
  showToast('📋 Format sinyal standar disalin!');
}

// ==================== 8. LIVE ECONOMIC NEWS ====================
function generateNewsExplanation(title) {
  const t = title.toLowerCase();
  if (t.includes('cpi') || t.includes('inflation') || t.includes('pce')) {
    return {
      category: 'Inflasi AS',
      smcWarning: 'Wajib tutup/amankan posisi & batalkan Pending Order 15 menit sebelum rilis.',
      explanation:
        'Mengukur tekanan inflasi AS. Jika Actual lebih tinggi dari Forecast, ekspektasi suku bunga ketat akan menguatkan USD dan menekan XAUUSD serta US100 turun tajam.'
    };
  }
  if (t.includes('non-farm') || t.includes('nfp') || t.includes('payroll') || t.includes('unemployment')) {
    return {
      category: 'Tenaga Kerja AS',
      smcWarning: 'Spread melebar ekstrem saat rilis. Tunggu 15–30 menit hingga struktur M5 stabil.',
      explanation:
        'Indikator utama pasar tenaga kerja AS. Penambahan kerja lebih tinggi dari prediksi (Actual > Forecast) mendorong penguatan USD dan menekan harga Emas.'
    };
  }
  if (t.includes('jobless') || t.includes('claims')) {
    return {
      category: 'Klaim Pengangguran',
      smcWarning: 'Rutin rilis Kamis malam — rawan sweep Asia High/Low sebelum arah asli terbentuk.',
      explanation:
        'Jika jumlah klaim lebih rendah dari prediksi (Actual < Forecast), pasar kerja AS dinilai solid → cenderung Bearish jangka pendek bagi XAUUSD.'
    };
  }
  if (t.includes('fomc') || t.includes('fed') || t.includes('powell') || t.includes('rate')) {
    return {
      category: 'Kebijakan The Fed',
      smcWarning: 'Volatilitas sangat tinggi & rawan slippage. Hindari posisi terbuka saat rilis.',
      explanation:
        'Keputusan suku bunga bank sentral AS. Nada dovish atau pemangkasan suku bunga melemahkan USD dan menjadi katalis Bullish kuat untuk Emas, Nasdaq, dan BTC.'
    };
  }
  return {
    category: 'Rilis Ekonomi USD',
    smcWarning: 'Pantau pergerakan ekor candle M5 saat jam rilis berita.',
    explanation:
      'Data fundamental USD berdampak pada pergerakan Dolar AS. Hasil lebih kuat dari prediksi umumnya menekan XAUUSD & EURUSD.'
  };
}

async function fetchLiveEconomicNews(manualTrigger = false) {
  const statusEl = document.getElementById('news-sync-status');
  if (statusEl) statusEl.textContent = 'Menyinkronkan kalender USD...';

  try {
    const targetUrl = encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    const res = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`);
    if (!res.ok) throw new Error('Network error');
    const rawEvents = await res.json();

    const usdEvents = rawEvents.filter(
      (ev) => ev.country === 'USD' && (ev.impact === 'High' || ev.impact === 'Medium')
    );

    if (usdEvents.length > 0) {
      activeNewsList = usdEvents.slice(0, 14).map((ev, idx) => {
        const dt = new Date(ev.date);
        const wibDate = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dt);

        const autoMeta = generateNewsExplanation(ev.title || '');
        return {
          id: `live-news-${idx}`,
          impact: ev.impact === 'High' ? 'HIGH' : 'MED',
          time: `${wibDate} WIB`,
          currency: 'USD',
          category: autoMeta.category,
          title: ev.title,
          actual: ev.actual || 'Menunggu',
          forecast: ev.forecast || '-',
          previous: ev.previous || '-',
          smcWarning: autoMeta.smcWarning,
          explanation: autoMeta.explanation
        };
      });

      if (statusEl) statusEl.textContent = '● Live Kalender USD Minggu Ini';
      if (manualTrigger) showToast('📰 Kalender ekonomi USD diperbarui!');
      renderNews(currentNewsFilter);
      return;
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = '● Mode Kamus Dampak Market';
    if (manualTrigger) showToast('ℹ️ Menampilkan referensi utama news USD');
  }
  renderNews(currentNewsFilter);
}

function renderNews(filter = 'ALL') {
  currentNewsFilter = filter;
  const list = activeNewsList.filter((n) => filter === 'ALL' || n.impact === filter);
  const container = document.getElementById('news-list-container');
  if (!container) return;

  container.innerHTML = list
    .map(
      (n) => `
      <div class="glass-card p-5 space-y-2.5 card-3d">
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${n.impact === 'HIGH' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}">
            ${n.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟠 MEDIUM'}
          </span>
          <span class="font-mono-num text-[11px] font-bold opacity-75 text-right">${n.time}</span>
        </div>

        <h3 class="font-display text-base font-bold leading-snug">${n.title}</h3>

        <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-center font-mono-num text-xs">
          <div><span class="text-[9px] block opacity-60 font-sans">ACTUAL</span><strong>${n.actual}</strong></div>
          <div><span class="text-[9px] block opacity-60 font-sans">FORECAST</span><strong>${n.forecast}</strong></div>
          <div><span class="text-[9px] block opacity-60 font-sans">PREVIOUS</span><strong>${n.previous}</strong></div>
        </div>

        <div class="p-3 rounded-2xl bg-blue-500/10 text-xs leading-relaxed">
          <strong class="text-blue-500 block mb-0.5">Dampak ke Market (${n.category}):</strong>
          <span class="opacity-85">${n.explanation}</span>
          <span class="block mt-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">⚠️ ${n.smcWarning}</span>
        </div>
      </div>
    `
    )
    .join('');
}

function filterNews(level) {
  document.querySelectorAll('.news-filter-btn').forEach((btn) => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('glass-card');
  });
  const activeBtn = document.getElementById(`news-filter-${level}`);
  if (activeBtn) {
    activeBtn.classList.remove('glass-card');
    activeBtn.classList.add('bg-blue-600', 'text-white');
  }
  renderNews(level);
}

// ==================== 9. TRADINGVIEW & LIVE CANDLE RADAR ====================
function renderTradingViewChart() {
  const wrapper = document.getElementById('tv-chart-wrapper');
  const select = document.getElementById('chart-symbol-select');
  if (!wrapper || !select) return;

  let val = select.value.split('|')[0];
  if (val === 'BINANCE:BTCUSDT') val = 'COINBASE:BTCUSD';
  const tvTheme = state.theme === 'dark' ? 'dark' : 'light';

  wrapper.innerHTML = '';
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.innerHTML = JSON.stringify({
    autosize: true,
    symbol: val,
    interval: '15',
    timezone: 'Asia/Jakarta',
    theme: tvTheme,
    style: '1',
    locale: 'id',
    hide_top_toolbar: false,
    hide_legend: true,
    allow_symbol_change: true,
    save_image: false,
    support_host: 'https://www.tradingview.com'
  });
  wrapper.appendChild(script);
}

function changeChartSymbol() {
  renderTradingViewChart();
  runManualScan();
}

async function runManualScan() {
  await syncLiveMarketPrices(true);
  showToast(`📡 Harga & candle diperbarui: ${state.selectedPair} (${livePrices[state.selectedPair]})`);
}

// ==================== 10. NATIVE HP NOTIFICATION + AUTO TELEGRAM ====================
function updateNativeNotifStatusUI() {
  const statusEl = document.getElementById('native-notif-status');
  const btnEl = document.getElementById('btn-enable-notif');
  if (!statusEl || !btnEl) return;

  if (!('Notification' in window)) {
    statusEl.textContent = 'Browser tidak mendukung Notifikasi Native';
    return;
  }

  if (Notification.permission === 'granted') {
    statusEl.textContent = '✅ Aktif — Auto-Notif HP siap jalan otomatis';
    statusEl.className = 'text-xs font-bold text-emerald-500 mt-1';
    btnEl.textContent = 'Tes Bunyi & Notif HP';
    btnEl.onclick = testNativeNotification;
  } else if (Notification.permission === 'denied') {
    statusEl.textContent = '❌ Diblokir — Izinkan notifikasi di Pengaturan Situs browser';
    statusEl.className = 'text-xs font-bold text-rose-500 mt-1';
  } else {
    statusEl.textContent = 'Belum diaktifkan — Ketuk tombol di bawah';
    statusEl.className = 'text-xs opacity-70 mt-1';
  }
}

async function enableNativeNotifications() {
  if (!('Notification' in window)) {
    showToast('⚠️ Browser ini belum mendukung Notifikasi Native');
    return;
  }
  const perm = await Notification.requestPermission();
  updateNativeNotifStatusUI();
  if (perm === 'granted') {
    testNativeNotification();
  } else {
    showToast('⚠️ Izin notifikasi belum diberikan');
  }
}

async function sendNativePush(title, body) {
  playAlertChime();
  if (navigator.vibrate) navigator.vibrate([180, 90, 220]);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body: body,
          tag: 'liamvtrade-signal',
          renotify: true,
          vibrate: [200, 100, 200]
        });
        return true;
      }
      new Notification(title, { body });
      return true;
    } catch (e) {}
  }
  return false;
}

function testNativeNotification() {
  sendNativePush(
    '🧠 LIAMVTRADE — Xliamvr Terminal',
    'Notifikasi Native aktif! Sinyal SMC Sniper & update TP/SL otomatis berjalan.'
  );
  showToast('🔔 Notifikasi tes dikirim ke HP!');
}

async function dispatchTelegramOptional(text) {
  if (!state.tgToken || !state.tgChatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${state.tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: state.tgChatId, text })
    });
    const data = await res.json();
    return !!data.ok;
  } catch (err) {
    return false;
  }
}

async function dispatchAutoSetupNotification(sig, eventType) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const activeAcc = getActiveAccount();
  const lotSize = calculateLotForPair(sig.pair, sig.slUnits, activeAcc.balance, activeAcc.riskPct);

  let title = '';
  let body = '';

  if (eventType === 'NEW') {
    title = `🎯 SNIPER ${sig.pair} ${sig.direction} (${sig.tf})`;
    body = `Entry: ${sig.entryMin.toFixed(d)}-${sig.entryMax.toFixed(d)} | SL: ${sig.sl.toFixed(d)} | TP2: ${sig.tp2.toFixed(d)} (${lotSize.toFixed(2)} lot)`;
  } else if (eventType === 'TP1_BE') {
    title = `🛡️ ${sig.pair} TP1 HIT → SL Digeser ke BE`;
    body = `Amankan partial profit (+${sig.tp1Units} ${sig.unitLabel}) & geser SL ke ${sig.entryPrice.toFixed(d)}.`;
  } else {
    title = `📌 ${sig.pair} (${sig.tf}) → ${eventType}`;
    body = `Hasil: ${sig.resultUnits >= 0 ? '+' : ''}${sig.resultUnits} ${sig.unitLabel} | ${sig.methodLabel}`;
  }

  await sendNativePush(title, body);
  const fullText = formatStandardSmcSignal(sig, lotSize, activeAcc.name);
  await dispatchTelegramOptional(fullText);
}

async function testTelegramAlert() {
  if (!state.tgToken || !state.tgChatId) {
    showToast('⚠️ Isi Bot Token & Chat ID Telegram terlebih dahulu');
    return;
  }
  const ok = await dispatchTelegramOptional(
    '🧠 LIAMVTRADE — Xliamvr Terminal\n✅ Koneksi arsip Telegram opsional berhasil terhubung!'
  );
  showToast(ok ? '🚀 Tes Telegram berhasil!' : '❌ Gagal: Periksa Token / Chat ID');
}

// ==================== 11. ROADMAP, SETTINGS & BOOT ====================
function renderAssetRoadmap() {
  const box = document.getElementById('roadmap-container');
  if (!box || typeof LIAMV_ASSET_ROADMAP === 'undefined') return;
  box.innerHTML = LIAMV_ASSET_ROADMAP.map(
    (item) => `
      <div class="p-3 rounded-2xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-2">
        <div>
          <span class="text-xs font-bold block">${item.title}</span>
          <span class="text-[10.5px] opacity-65 block mt-0.5">${item.items}</span>
        </div>
        <span class="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-[9px] font-bold whitespace-nowrap shrink-0">${item.status}</span>
      </div>
    `
  ).join('');
}

function loadSettingsUI() {
  const td = document.getElementById('cfg-twelvedata-key');
  const tgT = document.getElementById('cfg-tg-token');
  const tgC = document.getElementById('cfg-tg-chatid');

  if (td) td.value = state.twelveDataKey;
  if (tgT) tgT.value = state.tgToken;
  if (tgC) tgC.value = state.tgChatId;
  updateNativeNotifStatusUI();
  renderAssetRoadmap();
}

function saveSettings() {
  state.twelveDataKey = document.getElementById('cfg-twelvedata-key').value.trim();
  state.tgToken = document.getElementById('cfg-tg-token').value.trim();
  state.tgChatId = document.getElementById('cfg-tg-chatid').value.trim();
  saveState();
  syncLiveMarketPrices(true);
  showToast('💾 Pengaturan API tersimpan');
}

function resetDailyCounters() {
  state.accounts.forEach((a) => {
    a.entriesToday = 0;
    a.slsToday = 0;
  });
  state.checklist.forEach((c) => (c.done = false));
  saveState();
  renderHomeDashboard();
  showToast('🔄 Tracker harian seluruh akun di-reset');
}

// 3D Card Pointer Tilt Physics
document.addEventListener('pointermove', (e) => {
  const card = e.target.closest('.card-3d');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
});

document.addEventListener('pointerout', (e) => {
  const card = e.target.closest('.card-3d');
  if (card) card.style.transform = '';
});

// Boot Sequence
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  setTimeout(() => {
    const bar = document.getElementById('splash-bar');
    if (bar) bar.style.width = '100%';
  }, 220);

  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hide');
  }, 1250);

  applyTheme(state.theme);
  populateMethodDropdown();
  loadSettingsUI();
  updateWibSession();
  setInterval(updateWibSession, 1000);
  renderHomeDashboard();
  fetchLiveEconomicNews(false);
  setSignalPair(state.selectedPair);
  setSignalTF(state.selectedTF);
  setHistoryPeriod(state.historyPeriod);
  setHistoryFeedMode(state.historyFeedMode);
  syncLiveMarketPrices(true);
  setInterval(() => syncLiveMarketPrices(false), 15000);
  switchTab(state.activeTab);
});
