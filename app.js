/*!
 * Liamvtrade — Quant Terminal Controller v2.5 (Auth, Lifecycle, News Verdict & Journal)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// ==================== 1. DEFAULT ACCOUNTS, SAMPLE ARCHIVE & STATE ====================
const OWNER_CREDENTIALS = {
  username: 'xliamvr',
  displayName: 'Ilham Maulana (@xliamvr)',
  role: 'OWNER',
  planTier: 'UNLIMITED OWNER'
};

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
    maxDailyLossPct: 4.0,
    maxLotCap: 0.5,
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
    maxDailyLossPct: 4.0,
    maxLotCap: 1.0,
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
    maxDailyLossPct: 4.0,
    maxLotCap: 0.3,
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
      method: 'ICT',
      methodLabel: 'ICT Judas Swing + Bullish MSS/FVG (M15)',
      killzoneLabel: 'ICT New York AM Killzone (19.30–22.30 WIB)',
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: 89,
      entryMin: 2708.00,
      entryMax: 2709.60,
      limitPrice: 2708.95,
      entryPrice: 2708.95,
      sl: 2705.95,
      slUnits: 30,
      tp1: 2713.45,
      tp1Units: 45,
      tp2: 2715.45,
      tp2Units: 65,
      tp3: 2718.45,
      tp3Units: 95,
      unitLabel: 'pips',
      status: 'TP2 HIT',
      tp1Reached: true,
      tp2Reached: true,
      resultUnits: 65,
      structure: 'ICT NY Killzone: Judas Swing menyapu Asia Low → MSS Bullish → Pasang Limit di FVG CE.'
    },
    {
      id: 'hist-seed-2',
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      closedAt: new Date(now - 3600000 * 4).toISOString(),
      pair: 'BTCUSDT',
      tf: 'M15',
      method: 'FIBO',
      methodLabel: 'Fibonacci Golden Pocket 0.705 OTE (M15)',
      killzoneLabel: 'Weekend Crypto Window',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 85,
      entryMin: 59820.00,
      entryMax: 59960.00,
      limitPrice: 59910.00,
      entryPrice: 59910.00,
      sl: 60150.00,
      slUnits: 240,
      tp1: 59530.00,
      tp1Units: 380,
      tp2: 59360.00,
      tp2Units: 550,
      tp3: 59090.00,
      tp3Units: 820,
      unitLabel: 'pts',
      status: 'TP3 HIT',
      tp1Reached: true,
      tp2Reached: true,
      resultUnits: 820,
      structure: 'Rejection 0.705 OTE + Sweep Equal Highs M15.'
    },
    {
      id: 'hist-seed-3',
      createdAt: new Date(now - 3600000 * 8).toISOString(),
      closedAt: new Date(now - 3600000 * 7).toISOString(),
      pair: 'XAUUSD',
      tf: 'M15',
      method: 'SMC',
      methodLabel: 'SMC Liquidity Sweep + Discount FVG (M15)',
      killzoneLabel: 'ICT London Open Killzone (14.00–17.00 WIB)',
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: 83,
      entryMin: 2714.00,
      entryMax: 2715.60,
      limitPrice: 2714.95,
      entryPrice: 2714.95,
      sl: 2711.95,
      slUnits: 30,
      tp1: 2719.45,
      tp1Units: 45,
      tp2: 2721.45,
      tp2Units: 65,
      tp3: 2724.45,
      tp3Units: 95,
      unitLabel: 'pips',
      status: 'BREAK EVEN',
      tp1Reached: true,
      tp2Reached: false,
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
      methodLabel: 'Equal Highs Liquidity Pool Reversal (M15)',
      killzoneLabel: 'ICT New York AM Killzone (19.30–22.30 WIB)',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 79,
      entryMin: 21210.00,
      entryMax: 21224.00,
      limitPrice: 21215.00,
      entryPrice: 21215.00,
      sl: 21237.00,
      slUnits: 22,
      tp1: 21180.00,
      tp1Units: 35,
      tp2: 21163.00,
      tp2Units: 52,
      tp3: 21137.00,
      tp3Units: 78,
      unitLabel: 'pts',
      status: 'SL HIT',
      tp1Reached: false,
      tp2Reached: false,
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
  lastRolloverKey: '',
  accounts: DEFAULT_ACCOUNTS,
  lockedSetups: {},
  flipBanners: {},
  signalHistory: createInitialHistorySeed(),
  userJournal: [],
  customNewsActuals: {},
  checklist: [
    { id: 'c1', text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', done: true },
    { id: 'c2', text: 'Cek jadwal High Impact News USD (CPI/NFP/FOMC)', done: false },
    { id: 'c3', text: 'Wajib tunggu Judas Swing / Sweep + MSS M5/M1', done: false }
  ],
  // Auth & Owner Control Foundation
  authUser: {
    loggedIn: true,
    username: 'xliamvr',
    displayName: 'Ilham Maulana (@xliamvr)',
    role: 'OWNER', // OWNER | MEMBER
    planTier: 'UNLIMITED OWNER',
    creditsBalance: 999999,
    sessionToken: 'owner-vault-token'
  },
  ownerBroadcast: '',
  signalKillSwitch: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  twelveDataKey: '',
  tgToken: '',
  tgChatId: ''
};

// Migrasi otomatis pengaturan lama (v2.1 – v2.4) agar API Key, Token, Akun & Jurnal tetap utuh
const prevV24 = JSON.parse(localStorage.getItem('liamvtrade_v24_state') || 'null');
const prevV23 = JSON.parse(localStorage.getItem('liamvtrade_v23_state') || 'null');
const prevV22 = JSON.parse(localStorage.getItem('liamvtrade_v22_state') || 'null');
const prevV21 = JSON.parse(localStorage.getItem('liamvtrade_v21_state') || '{}');
const savedState = JSON.parse(localStorage.getItem('liamvtrade_v25_state') || 'null');

let state = {
  ...DEFAULT_STATE,
  ...(savedState || prevV24 || prevV23 || prevV22 || prevV21)
};

if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
  state.accounts = [...DEFAULT_ACCOUNTS];
}
if (!state.lockedSetups || typeof state.lockedSetups !== 'object') {
  state.lockedSetups = {};
}
if (!state.flipBanners || typeof state.flipBanners !== 'object') {
  state.flipBanners = {};
}
if (!Array.isArray(state.signalHistory)) {
  state.signalHistory = createInitialHistorySeed();
}
if (!Array.isArray(state.userJournal)) {
  state.userJournal = [];
}
if (!state.authUser) {
  state.authUser = { ...DEFAULT_STATE.authUser };
}

function getWibNow() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
}

function isWeekendWib() {
  const d = getWibNow().getDay();
  return d === 0 || d === 6;
}

// Auto-select BTCUSDT saat weekend jika mode aktif
(function autoSelectWeekendPair() {
  if (isWeekendWib() && state.weekendBtcMode) {
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
  // Batasi ukuran signalHistory sistem maksimal 500 entri terbaru agar HP tetap ringan
  if (state.signalHistory.length > 500) {
    state.signalHistory = state.signalHistory.slice(0, 500);
  }
  localStorage.setItem('liamvtrade_v25_state', JSON.stringify(state));
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
  }, 2900);
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

// ==================== 3. AUTHENTICATION, OWNER PANEL & CLOUD SYNC ====================
function renderAuthAndOwnerUI() {
  const gate = document.getElementById('auth-gate-modal');
  const userBadge = document.getElementById('header-user-badge');
  const profileCard = document.getElementById('profile-account-card');
  const ownerPanel = document.getElementById('owner-control-panel');
  const bcBanner = document.getElementById('global-broadcast-banner');
  const bcText = document.getElementById('global-broadcast-text');

  const isLoggedIn = !!state.authUser?.loggedIn;
  const isOwner = state.authUser?.role === 'OWNER';

  if (gate) {
    gate.classList.toggle('hidden', isLoggedIn);
  }

  if (userBadge && isLoggedIn) {
    userBadge.textContent = isOwner ? 'OWNER' : state.authUser.planTier || 'MEMBER';
  }

  if (bcBanner && bcText) {
    if (state.ownerBroadcast && state.ownerBroadcast.trim().length > 0) {
      bcText.textContent = state.ownerBroadcast.trim();
      bcBanner.classList.remove('hidden');
    } else {
      bcBanner.classList.add('hidden');
    }
  }

  if (profileCard && isLoggedIn) {
    profileCard.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-display text-sm font-extrabold">${state.authUser.displayName}</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
              isOwner ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/15 text-blue-500'
            }">${state.authUser.role}</span>
          </div>
          <span class="text-[11px] opacity-70 block mt-0.5">
            Paket: <strong>${state.authUser.planTier}</strong> • ${
              isOwner ? 'Multi-Device Bebas & Tanpa Batas Kredit' : 'Single-Device Lock Aktif'
            }
          </span>
        </div>
        <button onclick="logoutSession()" class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 text-[11px] font-bold active:scale-95">
          Keluar
        </button>
      </div>
    `;
  }

  if (ownerPanel) {
    ownerPanel.classList.toggle('hidden', !isOwner);
    const bcInput = document.getElementById('owner-broadcast-input');
    const ksBtn = document.getElementById('owner-killswitch-btn');
    if (bcInput && document.activeElement !== bcInput) {
      bcInput.value = state.ownerBroadcast || '';
    }
    if (ksBtn) {
      ksBtn.textContent = state.signalKillSwitch
        ? '🔴 Mesin Sinyal: PAUSED (Aktifkan Lagi)'
        : '🟢 Mesin Sinyal: AKTIF (Pause Darurat)';
      ksBtn.className = state.signalKillSwitch
        ? 'w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow active:scale-95'
        : 'w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow active:scale-95';
    }
  }
}

function submitLoginForm() {
  const userIn = (document.getElementById('auth-username')?.value || '').trim().toLowerCase();
  const passIn = (document.getElementById('auth-password')?.value || '').trim();
  const errEl = document.getElementById('auth-error-msg');

  if (!userIn) {
    if (errEl) {
      errEl.textContent = 'Masukkan username atau email terlebih dahulu.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (userIn === 'xliamvr' || userIn === 'owner') {
    state.authUser = {
      loggedIn: true,
      username: 'xliamvr',
      displayName: 'Ilham Maulana (@xliamvr)',
      role: 'OWNER',
      planTier: 'UNLIMITED OWNER',
      creditsBalance: 999999,
      sessionToken: `owner-${Date.now()}`
    };
  } else {
    if (!passIn || passIn.length < 4) {
      if (errEl) {
        errEl.textContent = 'Password minimal 4 karakter.';
        errEl.classList.remove('hidden');
      }
      return;
    }
    state.authUser = {
      loggedIn: true,
      username: userIn,
      displayName: userIn,
      role: 'MEMBER',
      planTier: 'PRO TRIAL',
      creditsBalance: 50,
      sessionToken: `member-${Date.now()}`
    };
  }

  if (errEl) errEl.classList.add('hidden');
  saveState();
  renderAuthAndOwnerUI();
  showToast(`🔓 Selamat datang, ${state.authUser.displayName}`);
}

function quickOwnerVaultLogin() {
  state.authUser = {
    loggedIn: true,
    username: 'xliamvr',
    displayName: 'Ilham Maulana (@xliamvr)',
    role: 'OWNER',
    planTier: 'UNLIMITED OWNER',
    creditsBalance: 999999,
    sessionToken: 'owner-vault-token'
  };
  saveState();
  renderAuthAndOwnerUI();
  showToast('⚡ Akses Instan Owner (@xliamvr) aktif!');
}

function logoutSession() {
  state.authUser.loggedIn = false;
  saveState();
  renderAuthAndOwnerUI();
}

function saveOwnerBroadcast() {
  if (state.authUser?.role !== 'OWNER') return;
  const val = document.getElementById('owner-broadcast-input')?.value || '';
  state.ownerBroadcast = val.trim();
  saveState();
  renderAuthAndOwnerUI();
  showToast(val.trim() ? '📢 Pengumuman Global ditayangkan!' : '🗑️ Pengumuman Global dihapus');
}

function toggleSignalKillSwitch() {
  if (state.authUser?.role !== 'OWNER') return;
  state.signalKillSwitch = !state.signalKillSwitch;
  saveState();
  renderAuthAndOwnerUI();
  if (state.activeTab === 'signals') renderSignals();
  showToast(
    state.signalKillSwitch
      ? '🛑 Kill-Switch Aktif: Pemindaian sinyal dijeda sementara'
      : '🟢 Mesin Sinyal kembali berjalan normal'
  );
}

function exportFullBackupJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Liamvtrade v2.5',
    owner: state.authUser?.username || 'xliamvr',
    accounts: state.accounts,
    userJournal: state.userJournal,
    signalHistory: state.signalHistory
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Liamvtrade_CloudBackup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 File Backup JSON berhasil diunduh!');
}

// ==================== 4. LIVE MARKET PRICES (ADAPTIVE POLLING + UNBLOCKED 4G) ====================
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

  // Adaptive Polling: hemat kuota 800/hari Twelve Data saat jam sepi atau weekend
  const now = Date.now();
  const kz = typeof getIctKillzoneContext === 'function' ? getIctKillzoneContext() : { isPrime: false };
  const hasRunningOrder = Object.values(state.lockedSetups).some((s) => s && s.status === 'RUNNING');
  const minIntervalMs = kz.isPrime || hasRunningOrder ? 20000 : 75000;

  if (state.twelveDataKey && !isWeekendWib() && (forceTwelveData || now - lastTwelveDataSync >= minIntervalMs)) {
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

  evaluateAllLockedSetups();

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

// ==================== 5. THEME & NAVIGATION ====================
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

// ==================== 6. REAL-TIME WIB, AUTO-ROLLOVER 05:00 WIB & TIMER ====================
function checkAutoRollover05Wib() {
  const wib = getWibNow();
  // Geser mundur 5 jam sehingga pergantian hari broker tepat di 05:00 WIB
  const brokerDay = new Date(wib.getTime() - 5 * 3600000);
  const key = `${brokerDay.getFullYear()}-${String(brokerDay.getMonth() + 1).padStart(2, '0')}-${String(
    brokerDay.getDate()
  ).padStart(2, '0')}`;

  if (!state.lastRolloverKey) {
    state.lastRolloverKey = key;
    saveState();
    return;
  }

  if (state.lastRolloverKey !== key) {
    state.lastRolloverKey = key;
    state.accounts.forEach((a) => {
      a.entriesToday = 0;
      a.slsToday = 0;
    });
    state.checklist.forEach((c) => (c.done = false));
    saveState();
    renderHomeDashboard();
    showToast('🌅 Rollover 05:00 WIB: Kuota Entry & SL harian otomatis di-reset!');
  }
}

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
  if (!isoStart) return '0m 00s';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoStart).getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = String(diffSec % 60).padStart(2, '0');
  if (hrs > 0) return `${hrs}j ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatRemainingCountdown(isoExpiry) {
  if (!isoExpiry) return '-';
  const remSec = Math.max(0, Math.floor((new Date(isoExpiry).getTime() - Date.now()) / 1000));
  const hrs = Math.floor(remSec / 3600);
  const mins = Math.floor((remSec % 3600) / 60);
  if (hrs > 0) return `${hrs}j ${mins}m lagi`;
  return `${mins}m lagi`;
}

function updateWibSession() {
  checkAutoRollover05Wib();
  const wib = getWibNow();

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayIdx = wib.getDay();
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  const decHour = wib.getHours() + wib.getMinutes() / 60;

  const clockEl = document.getElementById('live-clock-wib');
  if (clockEl) clockEl.textContent = `${days[dayIdx]}, ${hh}:${mm}:${ss} WIB`;

  // Update timer setup aktif setiap detik
  const activeKey = `${state.selectedPair}_${state.selectedTF}`;
  const activeSetup = state.lockedSetups[activeKey];
  const timerEl = document.getElementById('live-setup-timer');
  if (timerEl && activeSetup) {
    if (activeSetup.status === 'RUNNING') {
      timerEl.textContent = `Running ${formatElapsedDuration(activeSetup.filledAt || activeSetup.createdAt)}`;
    } else if (activeSetup.status === 'WAITING') {
      const cfg = LIAMV_PAIRS[activeSetup.pair] || LIAMV_PAIRS.XAUUSD;
      if (isWeekendWib() && !cfg.weekendActive) {
        timerEl.textContent = 'Market Tutup (Timer Dibekukan)';
      } else {
        timerEl.textContent = `Menunggu Limit (Exp: ${formatRemainingCountdown(activeSetup.expiresAt)})`;
      }
    }
  }

  const dayNotes = {
    0: 'Minggu — Forex/Gold Tutup • Crypto BTCUSDT Aktif 24/7',
    1: 'Senin — Pembentukan Range Awal, Rawan False Breakout',
    2: 'Selasa — Pembentukan Weekly High/Low & Ekspansi Awal',
    3: 'Rabu — Sesi Paling Teknis, Struktur ICT/SMC Sangat Rapi',
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
  } else if (decHour >= 14 && decHour < 17) {
    title = 'ICT London Open Killzone';
    desc = 'Jam prioritas entry! Sweep Asia Range & ekspansi sesi Eropa.';
    badge = 'KILLZONE';
  } else if (decHour >= 17 && decHour < 19.5) {
    title = 'London Lunch / Pra-NY';
    desc = 'Konsolidasi menuju pembukaan sesi New York.';
    badge = 'OBSERVE';
  } else if (decHour >= 19.5 && decHour < 22.5) {
    title = 'ICT New York AM Killzone';
    desc = 'Peak volume harian & Silver Bullet (21.00–22.00 WIB)!';
    badge = 'KILLZONE';
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

// ==================== 7. MULTI-ACCOUNT PORTFOLIO & CIRCUIT BREAKER ====================
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
  const maxLotCap = parseFloat(document.getElementById('new-acc-max-lot')?.value) || +(balance / 10000).toFixed(2);
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
    maxDailyLossPct: 4.0,
    maxLotCap: Math.max(0.05, maxLotCap),
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
                <span class="text-[10px] text-slate-400 block">${a.firm} • Risk ${a.riskPct}% • Max ${a.maxLotCap || 0.5} lot</span>
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

// ==================== 8. LOCKED SNIPER LIFECYCLE, AUTO-FLIP & JOURNAL ====================
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
    showToast('🔔 Auto-Notif Aktif — Sinyal baru, fill & TP/SL otomatis terkirim!');
  } else {
    showToast('🔕 Auto-Notif Dimatikan');
  }
}

function isActiveStatus(st) {
  return st === 'WAITING' || st === 'RUNNING' || st === 'LIVE';
}

function getOrLockCurrentSniperSetup(forceRefresh = false, forceSide = null) {
  const pairId = state.selectedPair || 'XAUUSD';
  const tf = state.selectedTF || 'M15';
  const methodId = state.selectedMethod || 'AUTO';
  const key = `${pairId}_${tf}`;

  let existing = state.lockedSetups[key];
  if (!existing || !isActiveStatus(existing.status) || forceRefresh) {
    const newSetup = buildLockedSniperSetup(
      pairId,
      tf,
      methodId,
      livePrices[pairId],
      marketRanges,
      forceSide
    );
    state.lockedSetups[key] = newSetup;
    if (forceRefresh && !forceSide) {
      delete state.flipBanners[key];
    }
    saveState();

    if (state.autoNotif && !state.signalKillSwitch) {
      dispatchAutoSetupNotification(newSetup, 'NEW');
    }
    return newSetup;
  }
  return existing;
}

function forceNewSniperSetup() {
  const setup = getOrLockCurrentSniperSetup(true, null);
  renderSignals();
  showToast(`🎯 Setup baru terkunci: ${setup.pair} ${setup.direction}`);
}

function evaluateAllLockedSetups() {
  if (state.signalKillSwitch) return;
  let changed = false;
  const weekend = isWeekendWib();

  Object.keys(state.lockedSetups).forEach((key) => {
    const sig = state.lockedSetups[key];
    if (!sig || !isActiveStatus(sig.status)) return;
    if (sig.status === 'LIVE') sig.status = 'RUNNING'; // Normalisasi migrasi lama

    const current = Number(livePrices[sig.pair]);
    if (!current) return;

    const decision = evaluateSetupLifecycle(sig, current, marketRanges, weekend);

    if (decision.action === 'FILL_RUNNING') {
      sig.status = 'RUNNING';
      sig.filledAt = decision.filledAt;
      changed = true;
      if (state.autoNotif) dispatchAutoSetupNotification(sig, 'FILLED');
    } else if (decision.action === 'TRAIL_TP1') {
      sig.tp1Reached = true;
      sig.sl = decision.newSl;
      changed = true;
      if (state.autoNotif) dispatchAutoSetupNotification(sig, 'TP1_BE');
    } else if (decision.action === 'TRAIL_TP2') {
      sig.tp2Reached = true;
      sig.sl = decision.newSl;
      changed = true;
      if (state.autoNotif) dispatchAutoSetupNotification(sig, 'TP2_TRAIL');
    } else if (decision.action === 'FINALIZE') {
      finalizeSetupOutcome(key, decision.finalStatus, decision.signedUnits);
      changed = true;
    } else if (decision.action === 'REPLACE') {
      // Arsipkan setup kadaluwarsa/flipped tanpa memotong winrate
      sig.status = decision.archiveStatus;
      sig.resultUnits = 0;
      sig.closedAt = new Date().toISOString();
      state.signalHistory.unshift({ ...sig });
      state.flipBanners[key] = decision.bannerMsg;

      // Buat setup baru secara otomatis (termasuk auto-flip jika harga lari ke zona lawan)
      const replacement = buildLockedSniperSetup(
        sig.pair,
        sig.tf,
        sig.method || state.selectedMethod,
        current,
        marketRanges,
        decision.flipSide
      );
      state.lockedSetups[key] = replacement;
      changed = true;
      if (state.autoNotif) dispatchAutoSetupNotification(replacement, 'FLIP_NEW');
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

  state.signalHistory.unshift({ ...sig });

  if (sig.takenByUser) {
    const pnlUsd = calculateSplitUsdPnl(sig.pair, sig, sig.takenLot || 0.01);
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
      if (pnlUsd > 0) acc.wins += 1;
      if (pnlUsd < 0) {
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
  if (!sig || !isActiveStatus(sig.status)) return;

  const mapUnits = {
    'TP1 HIT': sig.tp1Units,
    'TP2 HIT': sig.tp2Units,
    'TP3 HIT': sig.tp3Units,
    'BREAK EVEN': 0,
    'SL HIT': -sig.slUnits
  };
  if (outcomeType.startsWith('TP')) sig.tp1Reached = true;
  if (outcomeType === 'TP2 HIT' || outcomeType === 'TP3 HIT') sig.tp2Reached = true;

  finalizeSetupOutcome(key, outcomeType, mapUnits[outcomeType] ?? 0);
  renderSignals();
  showToast(`📌 Hasil dicatat: ${sig.pair} → ${outcomeType}`);
}

function takeCurrentSetup() {
  const sig = getOrLockCurrentSniperSetup(false);
  const activeAcc = getActiveAccount();

  if (sig.takenByUser) {
    showToast(`ℹ️ Setup ini sudah masuk Jurnal (${sig.takenAccountName})`);
    return;
  }

  // Cek apakah pair yang sama sudah diambil di akun lain (peringatan over-exposure)
  const otherAccountActive = state.userJournal.find(
    (j) => j.pair === sig.pair && isActiveStatus(j.status) && j.takenAccountId !== activeAcc.id
  );

  const lotInfo = calculateSafeLotDetails(sig.pair, sig.slUnits, activeAcc);
  sig.takenByUser = true;
  sig.takenAccountId = activeAcc.id;
  sig.takenAccountName = activeAcc.name;
  sig.takenLot = lotInfo.lot;

  activeAcc.entriesToday = Math.min(activeAcc.maxEntries, activeAcc.entriesToday + 1);

  state.userJournal.unshift({
    ...sig,
    pnlUsd: 0
  });

  saveState();
  renderHomeDashboard();
  renderSignals();

  if (otherAccountActive) {
    showToast(`⚠️ Tercatat di ${activeAcc.name} (${lotInfo.lot} lot) — Info: ${sig.pair} juga aktif di ${otherAccountActive.takenAccountName}`);
  } else {
    showToast(`✅ Setup masuk Jurnal Saya (${activeAcc.name} • ${lotInfo.lot.toFixed(2)} lot)`);
  }
}

function copyLimitPrice(valStr) {
  navigator.clipboard.writeText(String(valStr));
  showToast(`🎯 Harga Limit ${valStr} disalin — siap paste ke MT5/cTrader!`);
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
  const shieldBanner = document.getElementById('news-shield-banner');
  const flipBanner = document.getElementById('flip-reason-banner');
  if (!liveCardBox) return;

  updateAutoNotifUI();

  // 1. Cek Kill-Switch Owner
  if (state.signalKillSwitch) {
    liveCardBox.innerHTML = `
      <div class="glass-card p-5 text-center space-y-2 border-2 border-rose-500/40">
        <span class="px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 text-xs font-extrabold">🛑 SIGNAL ENGINE PAUSED</span>
        <p class="text-xs opacity-80 leading-relaxed">Pemindaian sinyal sedang dijeda sementara oleh Owner (${OWNER_CREDENTIALS.displayName}).</p>
      </div>
    `;
    renderHistoryAndStats();
    return;
  }

  // 2. Cek News Shield (±30 Menit High-Impact USD)
  const shield = typeof evaluateNewsShield === 'function' ? evaluateNewsShield(activeNewsList) : { active: false };
  if (shieldBanner) {
    if (shield.active) {
      shieldBanner.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-500 text-xs space-y-1">
          <span class="font-extrabold block">${shield.badgeText}</span>
          <span class="text-[11px] opacity-90 block leading-relaxed">${shield.warningText}</span>
        </div>
      `;
      shieldBanner.classList.remove('hidden');
    } else {
      shieldBanner.classList.add('hidden');
    }
  }

  // 3. Cek Banner Alasan Kadaluwarsa / Auto-Flip
  const key = `${state.selectedPair}_${state.selectedTF}`;
  if (flipBanner) {
    if (state.flipBanners[key]) {
      flipBanner.innerHTML = `
        <div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] flex items-start justify-between gap-2">
          <span>🔄 ${state.flipBanners[key]}</span>
          <button onclick="dismissFlipBanner('${key}')" class="font-extrabold px-1.5">×</button>
        </div>
      `;
      flipBanner.classList.remove('hidden');
    } else {
      flipBanner.classList.add('hidden');
    }
  }

  const sig = getOrLockCurrentSniperSetup(false);
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const activeAcc = getActiveAccount();
  const isBuy = sig.side === 'BUY';
  const meta = getConfidenceMeta(sig.confidence);
  const lotInfo = calculateSafeLotDetails(sig.pair, sig.slUnits, activeAcc);
  const livePrice = Number(livePrices[sig.pair]) || sig.limitPrice;
  const isRunning = sig.status === 'RUNNING';
  const isWaiting = sig.status === 'WAITING';
  const weekendClosed = isWeekendWib() && !cfg.weekendActive;
  const limitFormatted = Number(sig.limitPrice || sig.entryPrice).toFixed(d);

  const statusBadgeHtml = weekendClosed
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-500/20 opacity-80">MARKET CLOSED</span>`
    : isRunning
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">● RUNNING LIVE</span>`
    : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30">⏳ WAITING LIMIT</span>`;

  liveCardBox.innerHTML = `
    <div class="glass-card p-5 space-y-4 border-2 ${isBuy ? 'border-emerald-500/40' : 'border-rose-500/40'} shadow-lg">
      <!-- Header Status Ala Terminal Pro -->
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
              <span class="w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              <span id="live-setup-timer" class="font-mono-num">${
                weekendClosed
                  ? 'Market Tutup (Timer Dibekukan)'
                  : isRunning
                  ? 'Running ' + formatElapsedDuration(sig.filledAt || sig.createdAt)
                  : 'Menunggu Limit (Exp: ' + formatRemainingCountdown(sig.expiresAt) + ')'
              }</span>
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-mono-num text-sm font-extrabold block">${livePrice.toFixed(d)}</span>
          ${statusBadgeHtml}
        </div>
      </div>

      <!-- Metode, Killzone & Tombol Scan Baru -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-bold truncate">${sig.methodLabel}</p>
          <div class="flex flex-wrap items-center gap-1.5 mt-1">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold ${meta.badgeClass}">
              ${meta.tier} • ${sig.confidence}% PD
            </span>
            <span class="text-[9.5px] opacity-65 truncate">${sig.killzoneLabel || ''}</span>
          </div>
        </div>
        <button onclick="forceNewSniperSetup()" class="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[10px] font-bold active:scale-95 whitespace-nowrap shrink-0">
          ↻ Scan Baru
        </button>
      </div>

      <!-- KOTAK UTAMA: 1 ANGKA PASTI PASANG LIMIT + TOMBOL COPY -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-r ${
        isBuy ? 'from-emerald-500/15 to-cyan-500/10 border-emerald-500/35' : 'from-rose-500/15 to-amber-500/10 border-rose-500/35'
      } border flex items-center justify-between gap-2">
        <div>
          <span class="text-[9.5px] font-extrabold uppercase tracking-wider opacity-75 block">
            🎯 PASANG ${sig.direction} (SWEET-SPOT)
          </span>
          <span class="font-mono-num text-lg font-extrabold tracking-tight block mt-0.5">${limitFormatted}</span>
          <span class="font-mono-num text-[10px] opacity-70 block">Zona POI: ${sig.entryMin.toFixed(d)} – ${sig.entryMax.toFixed(d)}</span>
        </div>
        <button onclick="copyLimitPrice('${limitFormatted}')" class="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold shadow active:scale-95 shrink-0">
          Copy
        </button>
      </div>

      <!-- Grid Stop Loss, Lot Aman & Drawdown Guard -->
      <div class="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)]">
        <div>
          <span class="text-[9px] font-bold uppercase opacity-60 block">Stop Loss ${sig.tp1Reached ? '(Locked BE)' : ''}</span>
          <span class="font-mono-num text-xs font-extrabold text-rose-500">${sig.sl.toFixed(d)} (${sig.slUnits} ${sig.unitLabel})</span>
        </div>
        <div>
          <span class="text-[9px] font-bold uppercase opacity-60 block">Lot (${activeAcc.name.split(' ')[0]})</span>
          <span class="font-mono-num text-xs font-extrabold text-blue-500">
            ${lotInfo.lot.toFixed(2)} lot
            ${lotInfo.isRecoveryMode ? '<span class="text-[9px] text-amber-500">(½ Risk)</span>' : ''}
            ${lotInfo.isCapped ? '<span class="text-[9px] text-amber-500">(Cap)</span>' : ''}
          </span>
        </div>
      </div>

      <!-- Target TP1 - TP3 -->
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 1 (50% Partial • Set BE)</span>
          <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp1.toFixed(d)} (+${sig.tp1Units} ${sig.unitLabel})</span>
        </div>
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 2 (30% Partial • Trail TP1)</span>
          <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp2.toFixed(d)} (+${sig.tp2Units} ${sig.unitLabel})</span>
        </div>
        <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 3 (20% Runner • Extreme)</span>
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

      <!-- Tombol Catat Hasil Akhir Manual -->
      ${
        isWaiting || isRunning
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
    outputBox.textContent = formatStandardSmcSignal(sig, lotInfo.lot, activeAcc.name);
  }

  renderHistoryAndStats();
}

function dismissFlipBanner(key) {
  delete state.flipBanners[key];
  saveState();
  renderSignals();
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

function computeEdgeFinderInsight(items) {
  const valid = items.filter((i) => String(i.status).startsWith('TP') || i.status === 'SL HIT');
  if (valid.length < 2) {
    return 'Edge Finder: Kumpulkan minimal 2 trade selesai untuk memetakan metode & pair paling profit.';
  }

  const statsByMethod = {};
  valid.forEach((i) => {
    const m = i.method || 'SMC';
    if (!statsByMethod[m]) statsByMethod[m] = { wins: 0, total: 0 };
    statsByMethod[m].total += 1;
    if (String(i.status).startsWith('TP')) statsByMethod[m].wins += 1;
  });

  let bestMethod = 'ICT';
  let bestWr = -1;
  Object.entries(statsByMethod).forEach(([m, s]) => {
    const wr = Math.round((s.wins / s.total) * 100);
    if (wr > bestWr) {
      bestWr = wr;
      bestMethod = m;
    }
  });

  return `🏆 Edge Finder: Metode ${bestMethod} unggul dengan Winrate ${bestWr}% dari ${valid.length} trade terverifikasi.`;
}

function renderHistoryAndStats() {
  const sourceList =
    state.historyFeedMode === 'JOURNAL' ? state.userJournal : state.signalHistory;
  const periodItems = filterItemsByPeriod(sourceList, state.historyPeriod);

  const jBadge = document.getElementById('journal-count-badge');
  if (jBadge) jBadge.textContent = state.userJournal.length;

  const edgeEl = document.getElementById('edge-finder-banner');
  if (edgeEl) {
    edgeEl.textContent = computeEdgeFinderInsight(sourceList);
  }

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
            : 'Riwayat terverifikasi otomatis terisi setiap sinyal selesai atau berganti.'
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

      const displayPrice = Number(item.limitPrice || item.entryPrice).toFixed(d);

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
              <span class="font-mono-num text-xs font-extrabold block">${displayPrice}</span>
              <span class="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold tracking-wider ${badgeStyle}">
                ${item.status}
              </span>
            </div>
          </div>

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
    'Harga Limit',
    'Stop Loss',
    'Jarak SL (Pips/Pts)',
    'Target TP2',
    'Lot Size',
    'Status Hasil',
    'Net Pips/Pts',
    'Estimasi PnL Bersih (USD)'
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
        : calculateSplitUsdPnl(item.pair, item, Number(item.takenLot) || 0.01);

    return [
      idx + 1,
      `"${fmtDate(item.createdAt)}"`,
      `"${fmtDate(item.closedAt)}"`,
      `"${item.takenAccountName || 'Akun Utama'}"`,
      item.pair,
      item.tf,
      item.direction,
      item.method,
      Number(item.limitPrice || item.entryPrice).toFixed(d),
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

// ==================== 9. PRE-NEWS & POST-NEWS VERDICT ENGINE ====================
function classifyNewsCategory(title) {
  const t = String(title || '').toLowerCase();
  if (t.includes('cpi') || t.includes('inflation') || t.includes('pce')) return 'Inflasi AS';
  if (t.includes('non-farm') || t.includes('nfp') || t.includes('payroll') || t.includes('unemployment'))
    return 'Tenaga Kerja AS';
  if (t.includes('jobless') || t.includes('claims')) return 'Klaim Pengangguran';
  if (t.includes('fomc') || t.includes('fed') || t.includes('powell') || t.includes('rate'))
    return 'Kebijakan The Fed';
  return 'Rilis Ekonomi USD';
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

        const newsId = `live-news-${idx}`;
        const manualActual = state.customNewsActuals?.[newsId];

        return {
          id: newsId,
          impact: ev.impact === 'High' ? 'HIGH' : 'MED',
          timestampMs: dt.getTime(),
          time: `${wibDate} WIB`,
          currency: 'USD',
          category: classifyNewsCategory(ev.title),
          title: ev.title,
          actual: manualActual || ev.actual || 'Menunggu',
          forecast: ev.forecast || '-',
          previous: ev.previous || '-'
        };
      });

      if (statusEl) statusEl.textContent = '● Live Kalender USD + Pre/Post Verdict Aktif';
      if (manualTrigger) showToast('📰 Kalender ekonomi USD diperbarui!');
      renderNews(currentNewsFilter);
      if (state.activeTab === 'signals') renderSignals();
      return;
    }
  } catch (err) {
    // Terapkan input actual manual pada daftar referensi jika ada
    activeNewsList = activeNewsList.map((n) => ({
      ...n,
      actual: state.customNewsActuals?.[n.id] || n.actual
    }));
    if (statusEl) statusEl.textContent = '● Mode Playbook Pre/Post-News USD';
    if (manualTrigger) showToast('ℹ️ Menampilkan playbook utama news USD');
  }
  renderNews(currentNewsFilter);
}

function submitQuickNewsActual(newsId) {
  const input = document.getElementById(`news-actual-input-${newsId}`);
  const val = input?.value.trim();
  if (!val) {
    showToast('⚠️ Masukkan angka Actual terlebih dahulu (cth: 0.2% atau 165K)');
    return;
  }
  if (!state.customNewsActuals) state.customNewsActuals = {};
  state.customNewsActuals[newsId] = val;
  saveState();

  activeNewsList = activeNewsList.map((n) => (n.id === newsId ? { ...n, actual: val } : n));
  renderNews(currentNewsFilter);
  showToast(`⚡ Vonis Post-News dihitung untuk Actual: ${val}`);
}

function renderNews(filter = 'ALL') {
  currentNewsFilter = filter;
  const list = activeNewsList.filter((n) => filter === 'ALL' || n.impact === filter);
  const container = document.getElementById('news-list-container');
  const wireContainer = document.getElementById('breaking-wire-container');

  if (wireContainer && typeof LIAMV_BREAKING_WIRE !== 'undefined') {
    wireContainer.innerHTML = LIAMV_BREAKING_WIRE.map(
      (w) => `
        <div class="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
          <span class="text-[9.5px] font-extrabold text-blue-500 uppercase tracking-wider">${w.tag}</span>
          <strong class="block font-display text-xs">${w.title}</strong>
          <p class="text-[11px] opacity-80 leading-relaxed">${w.summary}</p>
        </div>
      `
    ).join('');
  }

  if (!container) return;

  container.innerHTML = list
    .map((n) => {
      const analysis =
        typeof buildNewsPreAndPostAnalysis === 'function'
          ? buildNewsPreAndPostAnalysis(n)
          : null;

      const postHtml =
        analysis && analysis.postVerdict
          ? `<div class="p-3 rounded-2xl border ${
              analysis.postVerdict.biasColor === 'emerald'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-300'
                : analysis.postVerdict.biasColor === 'rose'
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-300'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-300'
            } text-xs space-y-1">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[9.5px] font-extrabold uppercase tracking-wider">⚡ POST-NEWS VERDICT</span>
                <span class="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[9px] font-extrabold">${analysis.postVerdict.verdictBadge}</span>
              </div>
              <strong class="font-display text-sm block">${analysis.postVerdict.directionCall}</strong>
              <p class="text-[11px] opacity-90 leading-relaxed">${analysis.postVerdict.deviationText}</p>
              <p class="text-[11px] font-semibold">📌 Eksekusi: ${analysis.postVerdict.executionAdvice}</p>
            </div>`
          : '';

      const preHtml = analysis
        ? `<div class="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] text-[11px] space-y-1.5">
            <span class="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-500 block">📋 PRE-NEWS PLAYBOOK (SEBELUM RILIS)</span>
            <p class="opacity-85 leading-relaxed">${analysis.prePlaybook.expectationText}</p>
            <p class="text-rose-500 font-semibold">• ${analysis.prePlaybook.scenarioSellRiskAssets}</p>
            <p class="text-emerald-500 font-semibold">• ${analysis.prePlaybook.scenarioBuyRiskAssets}</p>
            <p class="text-amber-600 dark:text-amber-400 font-semibold pt-0.5">⚠️ ${analysis.prePlaybook.safetyRule}</p>
          </div>`
        : '';

      return `
        <div class="glass-card p-5 space-y-3 card-3d">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${n.impact === 'HIGH' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}">
              ${n.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟠 MEDIUM'} • ${n.category}
            </span>
            <span class="font-mono-num text-[11px] font-bold opacity-75 text-right">${n.time}</span>
          </div>

          <h3 class="font-display text-base font-bold leading-snug">${n.title}</h3>

          <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-center font-mono-num text-xs">
            <div><span class="text-[9px] block opacity-60 font-sans">ACTUAL</span><strong>${n.actual}</strong></div>
            <div><span class="text-[9px] block opacity-60 font-sans">FORECAST</span><strong>${n.forecast}</strong></div>
            <div><span class="text-[9px] block opacity-60 font-sans">PREVIOUS</span><strong>${n.previous}</strong></div>
          </div>

          <!-- Input Cepat Angka Actual Saat Detik Rilis -->
          <div class="flex items-center gap-1.5">
            <input id="news-actual-input-${n.id}" type="text" placeholder="Input Actual rilis (cth: 0.2% / 165K)..." class="flex-1 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--border-subtle)] text-[11px] outline-none" />
            <button onclick="submitQuickNewsActual('${n.id}')" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold active:scale-95 whitespace-nowrap">
              Hitung Arah
            </button>
          </div>

          ${postHtml}
          ${preHtml}
        </div>
      `;
    })
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

// ==================== 10. TRADINGVIEW & LIVE CANDLE RADAR ====================
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

// ==================== 11. NATIVE HP NOTIFICATION + AUTO TELEGRAM ====================
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
    'Notifikasi Native aktif! Sinyal ICT/SMC Sniper & update TP/SL otomatis berjalan.'
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
  const lotInfo = calculateSafeLotDetails(sig.pair, sig.slUnits, activeAcc);
  const lim = Number(sig.limitPrice || sig.entryPrice).toFixed(d);

  let title = '';
  let body = '';

  if (eventType === 'NEW' || eventType === 'FLIP_NEW') {
    title = `🎯 ${eventType === 'FLIP_NEW' ? 'AUTO-FLIP' : 'SNIPER'} ${sig.pair} ${sig.direction} (${sig.tf})`;
    body = `Pasang Limit: ${lim} | SL: ${sig.sl.toFixed(d)} | TP2: ${sig.tp2.toFixed(d)} (${lotInfo.lot.toFixed(2)} lot)`;
  } else if (eventType === 'FILLED') {
    title = `⚡ ${sig.pair} LIMIT TERSENTUH (RUNNING)`;
    body = `Order aktif di ${lim}. Pantau target TP1 ${sig.tp1.toFixed(d)}.`;
  } else if (eventType === 'TP1_BE') {
    title = `🛡️ ${sig.pair} TP1 HIT → SL Digeser ke BE`;
    body = `Amankan 50% partial (+${sig.tp1Units} ${sig.unitLabel}) & SL dikunci di ${lim}.`;
  } else if (eventType === 'TP2_TRAIL') {
    title = `🚀 ${sig.pair} TP2 HIT → Trailing SL ke TP1`;
    body = `Amankan 30% partial (+${sig.tp2Units} ${sig.unitLabel}) & SL dikunci di ${sig.tp1.toFixed(d)}.`;
  } else {
    title = `📌 ${sig.pair} (${sig.tf}) → ${eventType}`;
    body = `Hasil: ${sig.resultUnits >= 0 ? '+' : ''}${sig.resultUnits} ${sig.unitLabel} | ${sig.methodLabel}`;
  }

  await sendNativePush(title, body);
  const fullText = formatStandardSmcSignal(sig, lotInfo.lot, activeAcc.name);
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

// ==================== 12. ROADMAP, SETTINGS & BOOT ====================
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
  const sbUrl = document.getElementById('cfg-supabase-url');
  const sbKey = document.getElementById('cfg-supabase-key');

  if (td) td.value = state.twelveDataKey;
  if (tgT) tgT.value = state.tgToken;
  if (tgC) tgC.value = state.tgChatId;
  if (sbUrl) sbUrl.value = state.supabaseUrl || '';
  if (sbKey) sbKey.value = state.supabaseAnonKey || '';
  updateNativeNotifStatusUI();
  renderAssetRoadmap();
  renderAuthAndOwnerUI();
}

function saveSettings() {
  state.twelveDataKey = document.getElementById('cfg-twelvedata-key')?.value.trim() || '';
  state.tgToken = document.getElementById('cfg-tg-token')?.value.trim() || '';
  state.tgChatId = document.getElementById('cfg-tg-chatid')?.value.trim() || '';
  state.supabaseUrl = document.getElementById('cfg-supabase-url')?.value.trim() || '';
  state.supabaseAnonKey = document.getElementById('cfg-supabase-key')?.value.trim() || '';
  saveState();
  syncLiveMarketPrices(true);
  showToast('💾 Pengaturan API & Cloud tersimpan');
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
