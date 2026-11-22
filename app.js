/*!
 * Liamvtrade — Quant Terminal Controller v2.6
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

const DEFAULT_SUPABASE_URL = 'https://wgaixhcamdlsgyavrddq.supabase.co';

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
    dailyProfitTargetPct: 1.5,
    maxLotCap: 0.50,
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
    dailyProfitTargetPct: 1.5,
    maxLotCap: 1.00,
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
    dailyProfitTargetPct: 1.5,
    maxLotCap: 0.25,
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
      createdAt: new Date(now - 3600000 * 3).toISOString(),
      closedAt: new Date(now - 3600000 * 2).toISOString(),
      pair: 'XAUUSD',
      tf: 'M15',
      method: 'ICT',
      methodLabel: 'ICT Model (M15)',
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
      tp2: 2715.75,
      tp2Units: 68,
      tp3: 2718.75,
      tp3Units: 98,
      unitLabel: 'pips',
      status: 'TP2 HIT',
      tp1Reached: true,
      tp2Reached: true,
      resultUnits: 68,
      structure: 'Discount Zone + Judas Swing sweep Low → MSS Bullish, limit di FVG CE.'
    },
    {
      id: 'hist-seed-2',
      createdAt: new Date(now - 3600000 * 6).toISOString(),
      closedAt: new Date(now - 3600000 * 5).toISOString(),
      pair: 'BTCUSDT',
      tf: 'H1',
      method: 'LIQ',
      methodLabel: 'Liquidity Sweep (H1)',
      killzoneLabel: 'Weekend Crypto Window (BTC 24/7)',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 85,
      entryMin: 61120.00,
      entryMax: 61280.00,
      limitPrice: 61210.00,
      entryPrice: 61210.00,
      sl: 61790.00,
      slUnits: 580,
      tp1: 60330.00,
      tp1Units: 880,
      tp2: 59910.00,
      tp2Units: 1300,
      tp3: 59360.00,
      tp3Units: 1850,
      unitLabel: 'pts',
      status: 'TP2 HIT',
      tp1Reached: true,
      tp2Reached: true,
      resultUnits: 1300,
      structure: 'Sapuan Buy-Side Liquidity (EQH) akhir pekan diikuti ekspansi turun H1.'
    },
    {
      id: 'hist-seed-3',
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      closedAt: new Date(now - 86400000 * 2 + 3600000).toISOString(),
      pair: 'US100',
      tf: 'M15',
      method: 'ICT',
      methodLabel: 'ICT Model (M15)',
      killzoneLabel: 'ICT New York AM Killzone (19.30–22.30 WIB)',
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: 80,
      entryMin: 21210.00,
      entryMax: 21224.00,
      limitPrice: 21215.00,
      entryPrice: 21215.00,
      sl: 21240.00,
      slUnits: 25,
      tp1: 21177.00,
      tp1Units: 38,
      tp2: 21159.00,
      tp2Units: 56,
      tp3: 21133.00,
      tp3Units: 82,
      unitLabel: 'pts',
      status: 'SL HIT',
      tp1Reached: false,
      tp2Reached: false,
      resultUnits: -25,
      structure: 'Ekspansi volume pembukaan NY menembus batas invalidasi atas.'
    }
  ];
}

const DEFAULT_STATE = {
  theme: 'dark',
  activeTab: 'home',
  selectedPair: 'XAUUSD',
  selectedTF: 'M15',
  selectedMethod: 'AUTO',
  weekendBtcMode: true,
  autoNotif: true,
  historyPeriod: 'ALL', // TODAY | WEEK | MONTH | YEAR | ALL
  historyStatusFilter: 'ALL', // ALL | DECIDED | CANCELLED
  historyPairFilter: 'ALL', // ALL | XAUUSD | US100 | BTCUSDT | EURUSD
  historyFeedMode: 'SYSTEM', // SYSTEM | JOURNAL
  activeAccountId: 'acc-1',
  lastRolloverKey: '',
  accounts: DEFAULT_ACCOUNTS,
  lockedSetups: {},
  cooldowns: {}, // { 'BTCUSDT_M15': { until: timestampMs, reason: '...' } }
  notifiedSessionKeys: {}, // Anti-spam: catat pair+sesi yang sudah dikirim notif
  flipBanners: {},
  signalHistory: createInitialHistorySeed(),
  userJournal: [],
  customNewsActuals: {},
  checklist: [
    { id: 'c1', text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', done: true },
    { id: 'c2', text: 'Cek jadwal High Impact News USD & zona OB/SnR terdekat', done: false },
    { id: 'c3', text: 'Wajib tunggu Judas Swing / Sweep + MSS M5/M1', done: false }
  ],
  authUser: {
    loggedIn: true,
    username: 'xliamvr',
    displayName: 'Ilham Maulana (@xliamvr)',
    role: 'OWNER',
    planTier: 'UNLIMITED OWNER',
    creditsBalance: 999999,
    sessionToken: 'owner-vault-token'
  },
  ownerBroadcast: '',
  signalKillSwitch: false,
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseAnonKey: '',
  lastCloudSyncAt: '',
  twelveDataKey: '',
  tdRequestsToday: 0,
  tdRequestsDate: '',
  tgToken: '',
  tgChatId: ''
};

// Migrasi aman dari v2.5 ke v2.6 tanpa menghapus API Key, Token, Akun, maupun Jurnal
const prevV25 = JSON.parse(localStorage.getItem('liamvtrade_v25_state') || 'null');
const prevV24 = JSON.parse(localStorage.getItem('liamvtrade_v24_state') || 'null');
const savedState = JSON.parse(localStorage.getItem('liamvtrade_v26_state') || 'null');

let state = {
  ...DEFAULT_STATE,
  ...(savedState || prevV25 || prevV24)
};

if (!state.supabaseUrl) state.supabaseUrl = DEFAULT_SUPABASE_URL;
if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
  state.accounts = [...DEFAULT_ACCOUNTS];
}
// Perbaiki bug migrasi maxLotCap agar proporsional dengan modal masing-masing akun
state.accounts = state.accounts.map((acc) => {
  const bal = Number(acc.balance) || 5000;
  const fixedCap =
    !acc.maxLotCap || (acc.maxLotCap === 0.5 && bal !== 5000)
      ? Math.max(0.05, +(bal / 10000).toFixed(2))
      : Number(acc.maxLotCap);
  return {
    ...acc,
    balance: bal,
    equity: Number(acc.equity) || bal,
    maxLotCap: fixedCap,
    maxDailyLossPct: Number(acc.maxDailyLossPct) || 4.0,
    dailyProfitTargetPct: Number(acc.dailyProfitTargetPct) || 1.5
  };
});

if (!state.lockedSetups || typeof state.lockedSetups !== 'object') state.lockedSetups = {};
if (!state.cooldowns || typeof state.cooldowns !== 'object') state.cooldowns = {};
if (!state.notifiedSessionKeys || typeof state.notifiedSessionKeys !== 'object') state.notifiedSessionKeys = {};
if (!state.flipBanners || typeof state.flipBanners !== 'object') state.flipBanners = {};
if (!Array.isArray(state.signalHistory)) state.signalHistory = createInitialHistorySeed();
if (!Array.isArray(state.userJournal)) state.userJournal = [];
if (!state.authUser) state.authUser = { ...DEFAULT_STATE.authUser };

function getWibNow() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
}

function isWeekendWib() {
  const d = getWibNow().getDay();
  return d === 0 || d === 6;
}

(function autoSelectWeekendPair() {
  if (isWeekendWib() && state.weekendBtcMode) {
    state.selectedPair = 'BTCUSDT';
    if (state.selectedTF === 'M5') state.selectedTF = 'H1';
  }
})();

let livePrices = {
  XAUUSD: 2712.50,
  US100: 21180.00,
  BTCUSDT: 60840.00,
  EURUSD: 1.05450
};

let priceFeedStatus = {
  XAUUSD: 'REF',
  US100: 'REF',
  BTCUSDT: 'SYNC',
  EURUSD: 'REF'
};

let marketRanges = {
  XAUUSD: { high: 2719.20, low: 2704.80 },
  US100: { high: 21245.00, low: 21105.00 },
  BTCUSDT: { high: 61350.00, low: 60150.00 },
  EURUSD: { high: 1.05690, low: 1.05200 }
};

let activeNewsList = typeof LIAMV_NEWS !== 'undefined' ? [...LIAMV_NEWS] : [];
let activeBreakingWire = typeof LIAMV_BREAKING_WIRE !== 'undefined' ? [...LIAMV_BREAKING_WIRE] : [];
let currentNewsFilter = 'ALL';
let lastTwelveDataSync = 0;
let expandedHistoryId = null;
let editingBalanceAccId = null;

function saveState() {
  if (state.signalHistory.length > 500) {
    state.signalHistory = state.signalHistory.slice(0, 500);
  }
  localStorage.setItem('liamvtrade_v26_state', JSON.stringify(state));
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
  }, 3000);
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

// ==================== 3. SUPABASE CLOUD SYNC, AUTH & OWNER CONSOLE ====================
function isSupabaseConfigured() {
  return Boolean(
    state.supabaseUrl &&
      state.supabaseUrl.startsWith('http') &&
      state.supabaseAnonKey &&
      state.supabaseAnonKey.length > 15
  );
}

function updateCloudSyncBadgeUI(statusText, isOk = true) {
  const badge = document.getElementById('cloud-sync-status-badge');
  if (!badge) return;
  badge.textContent = statusText;
  badge.className = isOk
    ? 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-extrabold'
    : 'px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9.5px] font-extrabold';
}

async function syncToSupabaseCloud(manualTrigger = false) {
  if (!isSupabaseConfigured()) {
    updateCloudSyncBadgeUI('CLOUD: STANDALONE', false);
    if (manualTrigger) {
      showToast('⚠️ Tempel Supabase Publishable Key (sb_publis...) di Profil dulu');
    }
    return false;
  }

  const baseUrl = state.supabaseUrl.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: state.supabaseAnonKey,
    Authorization: `Bearer ${state.supabaseAnonKey}`,
    Prefer: 'resolution=merge-duplicates'
  };

  try {
    // Sinkronkan riwayat sinyal terverifikasi ke tabel signal_history
    const recentSignals = state.signalHistory.slice(0, 25).map((s) => ({
      id: String(s.id),
      pair: s.pair,
      tf: s.tf,
      direction: s.direction,
      method: s.method || 'ICT',
      limit_price: Number(s.limitPrice || s.entryPrice) || 0,
      sl: Number(s.sl) || 0,
      tp1: Number(s.tp1) || 0,
      tp2: Number(s.tp2) || 0,
      tp3: Number(s.tp3) || 0,
      status: s.status || 'WAITING',
      result_units: Number(s.resultUnits) || 0,
      created_at: s.createdAt || new Date().toISOString(),
      closed_at: s.closedAt || null
    }));

    if (recentSignals.length > 0) {
      await fetch(`${baseUrl}/rest/v1/signal_history`, {
        method: 'POST',
        headers,
        body: JSON.stringify(recentSignals)
      });
    }

    state.lastCloudSyncAt = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
    saveState();

    updateCloudSyncBadgeUI(`🟢 SYNCED ${state.lastCloudSyncAt} WIB`, true);
    if (manualTrigger) {
      showToast(`☁️ Berhasil sinkron ke server Supabase (${recentSignals.length} sinyal)!`);
    }
    return true;
  } catch (err) {
    updateCloudSyncBadgeUI('⚠️ SYNC OFFLINE', false);
    if (manualTrigger) {
      showToast('❌ Gagal terhubung ke Supabase — cek koneksi 4G atau Publishable Key');
    }
    return false;
  }
}

function renderAuthAndOwnerUI() {
  const gate = document.getElementById('auth-gate-modal');
  const userBadge = document.getElementById('header-user-badge');
  const profileCard = document.getElementById('profile-account-card');
  const ownerPanel = document.getElementById('owner-control-panel');
  const bcBanner = document.getElementById('global-broadcast-banner');
  const bcText = document.getElementById('global-broadcast-text');

  const isLoggedIn = !!state.authUser?.loggedIn;
  const isOwner = state.authUser?.role === 'OWNER';

  if (gate) gate.classList.toggle('hidden', isLoggedIn);
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
              isOwner ? 'Multi-Device Bebas & API Twelve Data Aktif' : 'Single-Device Lock • Feed Sinyal Cloud'
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
    if (isSupabaseConfigured()) {
      updateCloudSyncBadgeUI(
        state.lastCloudSyncAt ? `🟢 SYNCED ${state.lastCloudSyncAt} WIB` : '🟢 CLOUD READY',
        true
      );
    } else {
      updateCloudSyncBadgeUI('⚠️ KEY BELUM DIISI', false);
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
        errEl.textContent = 'Password atau Kode Akses minimal 4 karakter.';
        errEl.classList.remove('hidden');
      }
      return;
    }
    state.authUser = {
      loggedIn: true,
      username: userIn,
      displayName: userIn,
      role: 'MEMBER',
      planTier: passIn.startsWith('VIP-') ? 'PRO VIP' : 'PRO MEMBER',
      creditsBalance: 100,
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

function generateMemberAccessCode() {
  const tier = document.getElementById('member-code-tier')?.value || 'PRO-30D';
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const code = `XLV-${tier}-${rand}`;
  const out = document.getElementById('member-code-output');
  if (out) out.value = code;
  navigator.clipboard.writeText(code).catch(() => {});
  showToast(`🎟️ Kode Member ${code} dibuat & disalin!`);
}

function exportFullBackupJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Liamvtrade v2.6',
    owner: state.authUser?.username || 'xliamvr',
    accounts: state.accounts,
    userJournal: state.userJournal,
    signalHistory: state.signalHistory,
    settings: {
      supabaseUrl: state.supabaseUrl,
      supabaseAnonKey: state.supabaseAnonKey,
      twelveDataKey: state.twelveDataKey,
      tgToken: state.tgToken,
      tgChatId: state.tgChatId
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Liamvtrade_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 File Backup .JSON berhasil diunduh!');
}

function importBackupJsonFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
        state.accounts = parsed.accounts;
        state.activeAccountId = parsed.accounts[0].id;
      }
      if (Array.isArray(parsed.userJournal)) state.userJournal = parsed.userJournal;
      if (Array.isArray(parsed.signalHistory)) state.signalHistory = parsed.signalHistory;
      if (parsed.settings) {
        if (parsed.settings.supabaseUrl) state.supabaseUrl = parsed.settings.supabaseUrl;
        if (parsed.settings.supabaseAnonKey) state.supabaseAnonKey = parsed.settings.supabaseAnonKey;
        if (parsed.settings.twelveDataKey) state.twelveDataKey = parsed.settings.twelveDataKey;
        if (parsed.settings.tgToken) state.tgToken = parsed.settings.tgToken;
        if (parsed.settings.tgChatId) state.tgChatId = parsed.settings.tgChatId;
      }
      saveState();
      loadSettingsUI();
      renderHomeDashboard();
      renderSignals();
      showToast('✅ Backup .JSON berhasil dipulihkan!');
    } catch (err) {
      showToast('❌ File .JSON tidak valid atau rusak');
    }
  };
  reader.readAsText(file);
}

// ==================== 4. LIVE MARKET PRICES & 24-CANDLE REAL SWING RANGE ====================
function trackTwelveDataQuota(count = 1) {
  const wib = getWibNow();
  const todayKey = `${wib.getFullYear()}-${wib.getMonth() + 1}-${wib.getDate()}`;
  if (state.tdRequestsDate !== todayKey) {
    state.tdRequestsDate = todayKey;
    state.tdRequestsToday = 0;
  }
  state.tdRequestsToday += count;
  const badge = document.getElementById('td-quota-badge');
  if (badge) {
    badge.textContent = `Kuota Hari Ini: ${state.tdRequestsToday} / 800 req`;
  }
}

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

async function fetchTwelveData24Candles(pairId) {
  if (!state.twelveDataKey || pairId === 'BTCUSDT') return false;
  const symMap = { XAUUSD: 'XAU/USD', EURUSD: 'EUR/USD', US100: 'QQQ' };
  const apiSym = symMap[pairId];
  if (!apiSym) return false;

  try {
    trackTwelveDataQuota(1);
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(apiSym)}&interval=15min&outputsize=24&apikey=${state.twelveDataKey}`,
      { cache: 'no-store' }
    );
    const json = await r.json();
    const values = json?.values;
    if (!Array.isArray(values) || values.length === 0) return false;

    const mult = pairId === 'US100' ? 42.15 : 1;
    const dec = pairId === 'EURUSD' ? 5 : 2;
    const latestClose = +(parseFloat(values[0].close) * mult).toFixed(dec);
    const highs = values.map((v) => +(parseFloat(v.high) * mult).toFixed(dec));
    const lows = values.map((v) => +(parseFloat(v.low) * mult).toFixed(dec));

    livePrices[pairId] = latestClose;
    priceFeedStatus[pairId] = 'LIVE';
    marketRanges[pairId] = {
      high: Math.max(...highs),
      low: Math.min(...lows)
    };
    return true;
  } catch (e) {
    return false;
  }
}

async function syncLiveMarketPrices(forceTwelveData = false) {
  const btcOk = await fetchLiveBtcUnblocked();

  const now = Date.now();
  const kz = typeof getWibContext === 'function' ? getWibContext() : { isPrime: false };
  const hasRunningOrder = Object.values(state.lockedSetups).some((s) => s && s.status === 'RUNNING');
  const minIntervalMs = kz.isPrime || hasRunningOrder ? 25000 : 85000;
  const isOwner = state.authUser?.role === 'OWNER';

  if (
    isOwner &&
    state.twelveDataKey &&
    !isWeekendWib() &&
    (forceTwelveData || now - lastTwelveDataSync >= minIntervalMs)
  ) {
    lastTwelveDataSync = now;
    // Ambil 24 candle M15 asli untuk pair yang sedang aktif agar Swing High/Low akurat
    await fetchTwelveData24Candles(state.selectedPair);

    // Sinkronkan harga pair lainnya sekaligus dalam 1 request ringan
    const symbols = btcOk ? 'XAU/USD,EUR/USD,QQQ' : 'XAU/USD,EUR/USD,QQQ,BTC/USD';
    try {
      trackTwelveDataQuota(1);
      const r = await fetch(
        `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${state.twelveDataKey}`,
        { cache: 'no-store' }
      );
      const data = await r.json();

      if (data['XAU/USD']?.price && state.selectedPair !== 'XAUUSD') {
        const p = parseFloat(data['XAU/USD'].price);
        livePrices.XAUUSD = p;
        priceFeedStatus.XAUUSD = 'LIVE';
      }
      if (data['EUR/USD']?.price && state.selectedPair !== 'EURUSD') {
        const p = parseFloat(data['EUR/USD'].price);
        livePrices.EURUSD = p;
        priceFeedStatus.EURUSD = 'LIVE';
      }
      if (data['QQQ']?.price && state.selectedPair !== 'US100') {
        const p = +(parseFloat(data['QQQ'].price) * 42.15).toFixed(2);
        livePrices.US100 = p;
        priceFeedStatus.US100 = 'LIVE';
      }
    } catch (e) {}
  }

  evaluateAllLockedSetups();
  updateHeaderTicker();
  updateRadarMetricsUI();
  if (state.activeTab === 'signals') renderSignals(true); // true = background refresh (hening/anti-spam)
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

// ==================== 5. THEME, NAVIGATION & MODALS ====================
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
  if (tabName === 'signals') renderSignals(true); // Hening saat buka tab
  if (tabName === 'news') renderNews(currentNewsFilter);
}

// Custom Bottom-Sheet Drawer untuk Pilihan Metode (Gantikan Dropdown Bawaan Chrome)
function openMethodDrawer() {
  const modal = document.getElementById('method-drawer-modal');
  const listEl = document.getElementById('method-drawer-list');
  if (!modal || !listEl || typeof LIAMV_METHODS === 'undefined') return;

  listEl.innerHTML = LIAMV_METHODS.map((m) => {
    const active = m.id === state.selectedMethod;
    return `
      <div onclick="selectMethodFromDrawer('${m.id}')" class="p-3.5 rounded-2xl border transition cursor-pointer ${
        active
          ? 'bg-blue-600/20 border-blue-500 shadow-md'
          : 'bg-white/[0.03] border-[var(--border-subtle)] hover:bg-white/[0.06]'
      }">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono-num text-[10px] font-extrabold">${m.code}</span>
            <span class="font-display text-sm font-extrabold">${m.shortName}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            active ? 'bg-blue-600 text-white' : 'bg-emerald-500/15 text-emerald-400'
          }">${active ? 'DIPILIH' : m.badge}</span>
        </div>
        <p class="text-[11px] opacity-75 mt-1.5 leading-relaxed">${m.desc}</p>
        <span class="text-[10px] font-semibold text-cyan-400 block mt-1">⏰ Sesi Ideal: ${m.sessionFit}</span>
      </div>
    `;
  }).join('');

  modal.classList.remove('hidden');
}

function closeMethodDrawer() {
  document.getElementById('method-drawer-modal')?.classList.add('hidden');
}

function selectMethodFromDrawer(methodId) {
  state.selectedMethod = methodId;
  saveState();
  updateMethodTriggerUI();
  closeMethodDrawer();
  // Ganti metode hanya menyusun ulang setup di layar (tanpa spam notif/Telegram)
  getOrLockCurrentSniperSetup(true, null, true);
  renderSignals(true);
  const mObj = LIAMV_METHODS.find((m) => m.id === methodId);
  showToast(`🎯 Metode aktif: ${mObj ? mObj.shortName : methodId}`);
}

function updateMethodTriggerUI() {
  const lbl = document.getElementById('method-trigger-label');
  const bdg = document.getElementById('method-trigger-badge');
  const mObj = typeof LIAMV_METHODS !== 'undefined'
    ? LIAMV_METHODS.find((m) => m.id === state.selectedMethod) || LIAMV_METHODS[0]
    : null;
  if (lbl && mObj) lbl.textContent = mObj.shortName;
  if (bdg && mObj) bdg.textContent = mObj.code;
}

// Kalkulator Lot Cepat Manual
function openLotCalcModal() {
  const modal = document.getElementById('lot-calc-modal');
  const pairSel = document.getElementById('lot-calc-pair');
  if (pairSel) pairSel.value = state.selectedPair || 'XAUUSD';
  recalcManualLot();
  modal?.classList.remove('hidden');
}

function closeLotCalcModal() {
  document.getElementById('lot-calc-modal')?.classList.add('hidden');
}

function recalcManualLot() {
  const pairId = document.getElementById('lot-calc-pair')?.value || 'XAUUSD';
  const slInput = parseFloat(document.getElementById('lot-calc-sl')?.value) || 25;
  const outEl = document.getElementById('lot-calc-result');
  if (!outEl) return;

  const activeAcc = getActiveAccount();
  const info = calculateSafeLotDetails(pairId, slInput, activeAcc, slInput);
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;

  outEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[10px] uppercase opacity-65 block">Ukuran Lot Aman (${activeAcc.name})</span>
        <span class="font-mono-num text-2xl font-extrabold text-cyan-400">${info.lot.toFixed(2)} LOT</span>
      </div>
      <div class="text-right">
        <span class="text-[10px] uppercase opacity-65 block">Risiko SL (${slInput} ${cfg.unitLabel})</span>
        <span class="font-mono-num text-base font-extrabold text-rose-400">-$${info.actualRiskUsd.toFixed(2)}</span>
      </div>
    </div>
    <p class="text-[10.5px] opacity-75 mt-2">
      Modal: $${activeAcc.balance.toLocaleString()} • Risk: ${info.effectiveRiskPct}% ${
        info.isRecoveryMode ? '(Mode Pemulihan ½ Risk)' : ''
      } ${info.isCapped ? '(Dibatasi Max Lot Cap)' : ''}
    </p>
  `;
}

// Panduan Cepat 30 Detik (?)
function openQuickGuideModal() {
  document.getElementById('quick-guide-modal')?.classList.remove('hidden');
}

function closeQuickGuideModal() {
  document.getElementById('quick-guide-modal')?.classList.add('hidden');
}

// ==================== 6. REAL-TIME WIB, AUTO-ROLLOVER 05:00 WIB & TIMER ====================
function checkAutoRollover05Wib() {
  const wib = getWibNow();
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
    state.notifiedSessionKeys = {};
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
  const secs = String(remSec % 60).padStart(2, '0');
  if (hrs > 0) return `${hrs}j ${mins}m`;
  return `${mins}m ${secs}s`;
}

function updateWibSession() {
  checkAutoRollover05Wib();
  const wib = getWibNow();

  const shortDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dayIdx = wib.getDay();
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  const decHour = wib.getHours() + wib.getMinutes() / 60;

  const clockEl = document.getElementById('live-clock-wib');
  if (clockEl) clockEl.textContent = `${shortDays[dayIdx]}, ${hh}:${mm}:${ss} WIB`;

  const activeKey = `${state.selectedPair}_${state.selectedTF}`;
  const cd = state.cooldowns[activeKey];
  const cdEl = document.getElementById('cooldown-countdown-timer');
  if (cdEl && cd && cd.until > Date.now()) {
    cdEl.textContent = formatRemainingCountdown(new Date(cd.until).toISOString());
  }

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
    1: 'Senin — Pembentukan Monday Range, Tunggu Sweep London',
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

// ==================== 7. MULTI-ACCOUNT PORTFOLIO, EDIT SALDO & DRAWDOWN METER ====================
function selectActiveAccount(accId) {
  state.activeAccountId = accId;
  saveState();
  renderHomeDashboard();
  if (state.activeTab === 'signals') renderSignals(true);
}

function openEditBalanceModal(accId) {
  const acc = state.accounts.find((a) => a.id === accId);
  if (!acc) return;
  editingBalanceAccId = accId;
  document.getElementById('edit-balance-acc-name').textContent = `${acc.name} (${acc.firm})`;
  document.getElementById('edit-balance-input').value = acc.balance;
  document.getElementById('edit-equity-input').value = acc.equity;
  document.getElementById('edit-lotcap-input').value = acc.maxLotCap || 0.5;
  document.getElementById('edit-balance-modal')?.classList.remove('hidden');
}

function closeEditBalanceModal() {
  editingBalanceAccId = null;
  document.getElementById('edit-balance-modal')?.classList.add('hidden');
}

function saveEditedAccountBalance() {
  const acc = state.accounts.find((a) => a.id === editingBalanceAccId);
  if (!acc) return;

  const newBal = parseFloat(document.getElementById('edit-balance-input')?.value);
  const newEq = parseFloat(document.getElementById('edit-equity-input')?.value);
  const newCap = parseFloat(document.getElementById('edit-lotcap-input')?.value);

  if (newBal > 0) acc.balance = +newBal.toFixed(2);
  if (newEq > 0) acc.equity = +newEq.toFixed(2);
  if (newCap >= 0.01) acc.maxLotCap = +newCap.toFixed(2);

  saveState();
  closeEditBalanceModal();
  renderHomeDashboard();
  if (state.activeTab === 'signals') renderSignals(true);
  showToast(`💰 Saldo & Lot Cap ${acc.name} diperbarui ($${acc.equity.toLocaleString()})`);
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
      showToast(`🛑 Batas ${acc.maxSLs} SL pada ${acc.name} tercapai! Tombol Ambil Setup dikunci.`);
    }
  }
  saveState();
  renderHomeDashboard();
  if (state.activeTab === 'signals') renderSignals(true);
}

function recordTradeOutcome(accId, isWin) {
  const acc = state.accounts.find((a) => a.id === accId);
  if (!acc) return;

  const riskUsd = +(acc.balance * (acc.riskPct / 100)).toFixed(2);
  if (isWin) {
    acc.wins += 1;
    acc.equity = +(acc.equity + riskUsd * 2).toFixed(2);
    acc.entriesToday = Math.min(acc.maxEntries, acc.entriesToday + 1);
    showToast(`✅ +$${(riskUsd * 2).toFixed(2)} Win dicatat di ${acc.name}`);
  } else {
    acc.losses += 1;
    acc.equity = +(acc.equity - riskUsd).toFixed(2);
    acc.entriesToday = Math.min(acc.maxEntries, acc.entriesToday + 1);
    acc.slsToday = Math.min(acc.maxSLs, acc.slsToday + 1);
    showToast(`❌ -$${riskUsd.toFixed(2)} SL dicatat di ${acc.name}`);
  }

  saveState();
  renderHomeDashboard();
  if (state.activeTab === 'signals') renderSignals(true);
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
    dailyProfitTargetPct: 1.5,
    maxLotCap: Math.max(0.01, maxLotCap),
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
  if (state.activeTab === 'signals') renderSignals(true);
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
  if (state.activeTab === 'signals') renderSignals(true);
  showToast('🗑️ Akun dihapus');
}

function renderHomeDashboard() {
  const activeAcc = getActiveAccount();

  const accSelect = document.getElementById('active-account-select');
  if (accSelect) {
    accSelect.innerHTML = state.accounts
      .map(
        (a) =>
          `<option value="${a.id}" ${a.id === activeAcc.id ? 'selected' : ''}>${a.name} ($${a.equity.toLocaleString()})</option>`
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

  // Daily Profit Target Lock Alert
  const profitAlert = document.getElementById('profit-lock-alert');
  if (profitAlert) {
    const netGain = activeAcc.equity - activeAcc.balance;
    const targetUsd = activeAcc.balance * ((activeAcc.dailyProfitTargetPct || 1.5) / 100);
    profitAlert.classList.toggle('hidden', netGain < targetUsd);
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

  if (eqEl) eqEl.textContent = `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (prfEl) {
    const sign = totalProfit >= 0 ? '+' : '-';
    prfEl.textContent = `${sign}$${Math.abs(totalProfit).toFixed(2)}`;
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

        // Prop Firm Drawdown Meter (Sisa napas rugi 4%)
        const maxDailyLossUsd = +(a.balance * ((a.maxDailyLossPct || 4.0) / 100)).toFixed(2);
        const currentDrawdown = Math.max(0, a.balance - a.equity);
        const remainingBreath = Math.max(0, +(maxDailyLossUsd - currentDrawdown).toFixed(2));
        const breathPct = Math.max(5, Math.min(100, Math.round((remainingBreath / maxDailyLossUsd) * 100)));

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
                <span class="text-[10px] text-slate-400 block">${a.firm} • Risk ${a.riskPct}% • Max ${a.maxLotCap} lot</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-mono-num text-xs font-extrabold text-white block">$${a.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span class="font-mono-num text-[10px] font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                  ${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)} (${pnlPct}%)
                </span>
              </div>
            </div>

            <!-- Drawdown Guard Bar -->
            <div class="mt-2.5 space-y-1">
              <div class="flex justify-between text-[9.5px] text-slate-300 font-mono-num">
                <span>Sisa Napas Drawdown (${a.maxDailyLossPct || 4}%):</span>
                <span class="font-bold text-cyan-300">$${remainingBreath.toFixed(2)} / $${maxDailyLossUsd.toFixed(2)}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full rounded-full ${breathPct > 50 ? 'bg-emerald-400' : 'bg-amber-400'}" style="width: ${breathPct}%"></div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-[10px]">
              <span class="text-slate-300 font-mono-num">WR: <strong>${wr}%</strong></span>
              <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                <button onclick="openEditBalanceModal('${a.id}')" class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">Edit $</button>
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

// ==================== 8. LOCKED SNIPER LIFECYCLE, ANTI-SPAM & COOLDOWN 30M ====================
function updateAutoNotifUI() {
  const btn = document.getElementById('auto-notif-btn');
  const badge = document.getElementById('auto-notif-badge');
  if (!btn || !badge) return;
  if (state.autoNotif) {
    btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95';
    badge.textContent = 'SMART ALERT: ON';
  } else {
    btn.className = 'px-3 py-1.5 rounded-xl bg-slate-500/15 border border-slate-400/30 opacity-75 text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95';
    badge.textContent = 'SMART ALERT: OFF';
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
    showToast('🔔 Smart Alert Aktif — Hanya High Signal Killzone & Posisi Diambil (Anti-Spam)');
  } else {
    showToast('🔕 Smart Alert Dimatikan');
  }
}

function isActiveStatus(st) {
  return st === 'WAITING' || st === 'RUNNING' || st === 'LIVE';
}

function isSetupInCooldown(key) {
  const cd = state.cooldowns[key];
  if (!cd) return null;
  if (Date.now() >= cd.until) {
    delete state.cooldowns[key];
    saveState();
    return null;
  }
  return cd;
}

function bypassCooldown(key) {
  delete state.cooldowns[key];
  saveState();
  getOrLockCurrentSniperSetup(true, null, true);
  renderSignals(true);
  showToast('⚡ Cooldown dilewati — Setup baru disiapkan');
}

function canSendSmartNewSignalAlert(setup) {
  if (!state.autoNotif || state.signalKillSwitch) return false;
  const kz = getWibContext();
  // Hanya kirim alert untuk HIGH SIGNAL (>=82%) pada jam Killzone aktif atau BTC Weekend
  const inPrimeWindow = kz.isPrime || (setup.pair === 'BTCUSDT' && kz.isWeekend);
  if (!inPrimeWindow || setup.confidence < 82) return false;

  const sessionBucket = `${setup.pair}_${kz.name}`;
  if (state.notifiedSessionKeys[sessionBucket]) {
    return false; // Sudah pernah dikirim pada pair & sesi ini (anti-spam!)
  }
  state.notifiedSessionKeys[sessionBucket] = Date.now();
  saveState();
  return true;
}

function getOrLockCurrentSniperSetup(forceRefresh = false, forceSide = null, silentBrowse = true, flipCount = 0) {
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
      forceSide,
      flipCount
    );
    state.lockedSetups[key] = newSetup;
    if (forceRefresh && !forceSide) {
      delete state.flipBanners[key];
    }
    saveState();

    // Hening saat user sekadar klik-klik pair atau timeframe (silentBrowse = true)
    if (!silentBrowse && canSendSmartNewSignalAlert(newSetup)) {
      dispatchAutoSetupNotification(newSetup, 'NEW');
    }
    return newSetup;
  }
  return existing;
}

function forceNewSniperSetup() {
  const key = `${state.selectedPair}_${state.selectedTF}`;
  delete state.cooldowns[key];
  const setup = getOrLockCurrentSniperSetup(true, null, true, 0);
  renderSignals(true);
  showToast(`🎯 Setup baru terkunci: ${setup.pair} ${setup.direction}`);
}

function createSetupFromNews(side) {
  const pairId = state.selectedPair || 'XAUUSD';
  const key = `${pairId}_M15`;
  state.selectedTF = 'M15';
  delete state.cooldowns[key];
  const setup = getOrLockCurrentSniperSetup(true, side, true, 0);
  switchTab('signals');
  showToast(`⚡ Setup ${side} ${pairId} (M15) dibuat searah analisis News!`);
}

function evaluateAllLockedSetups() {
  if (state.signalKillSwitch) return;
  let changed = false;
  const weekend = isWeekendWib();

  Object.keys(state.lockedSetups).forEach((key) => {
    const sig = state.lockedSetups[key];
    if (!sig || !isActiveStatus(sig.status)) return;
    if (sig.status === 'LIVE') sig.status = 'RUNNING';

    const current = Number(livePrices[sig.pair]);
    if (!current) return;

    const decision = evaluateSetupLifecycle(sig, current, marketRanges, weekend);

    if (decision.action === 'FILL_RUNNING') {
      sig.status = 'RUNNING';
      sig.filledAt = decision.filledAt;
      changed = true;
      if (sig.takenByUser || state.autoNotif) {
        dispatchAutoSetupNotification(sig, 'FILLED');
      }
    } else if (decision.action === 'TRAIL_TP1') {
      sig.tp1Reached = true;
      sig.sl = decision.newSl;
      changed = true;
      if (sig.takenByUser || state.autoNotif) {
        dispatchAutoSetupNotification(sig, 'TP1_BE');
      }
    } else if (decision.action === 'TRAIL_TP2') {
      sig.tp2Reached = true;
      sig.sl = decision.newSl;
      changed = true;
      if (sig.takenByUser || state.autoNotif) {
        dispatchAutoSetupNotification(sig, 'TP2_TRAIL');
      }
    } else if (decision.action === 'FINALIZE') {
      finalizeSetupOutcome(key, decision.finalStatus, decision.signedUnits);
      changed = true;
    } else if (decision.action === 'REPLACE') {
      sig.status = decision.archiveStatus;
      sig.resultUnits = 0;
      sig.closedAt = new Date().toISOString();
      state.signalHistory.unshift({ ...sig });
      state.flipBanners[key] = decision.bannerMsg;

      // Aktifkan Cooldown Anti-Whipsaw 30 menit jika sebelumnya Auto-Flip
      if (decision.archiveStatus === 'MISSED / FLIPPED') {
        state.cooldowns[key] = {
          until: Date.now() + 30 * 60000,
          reason: `Jeda Anti-Whipsaw 30 menit setelah harga menembus TP1 tanpa jemput limit (${sig.pair}).`
        };
      }

      const replacement = buildLockedSniperSetup(
        sig.pair,
        sig.tf,
        sig.method || state.selectedMethod,
        current,
        marketRanges,
        decision.flipSide,
        decision.flipCount || 0
      );
      state.lockedSetups[key] = replacement;
      changed = true;
      // Penggantian setup otomatis tidak mengirim spam Telegram kecuali diambil user
    }
  });

  if (changed) {
    saveState();
    if (isSupabaseConfigured()) syncToSupabaseCloud(false);
  }
}

function finalizeSetupOutcome(setupKey, finalStatus, signedUnits) {
  const sig = state.lockedSetups[setupKey];
  if (!sig) return;

  sig.status = finalStatus;
  sig.resultUnits = signedUnits;
  sig.closedAt = new Date().toISOString();

  state.signalHistory.unshift({ ...sig });

  // Aktifkan Cooldown Anti-Whipsaw 30 menit setiap kali kena SL HIT
  if (finalStatus === 'SL HIT') {
    state.cooldowns[setupKey] = {
      until: Date.now() + 30 * 60000,
      reason: `Jeda Anti-Whipsaw 30 menit setelah SL HIT pada ${sig.pair} (${sig.tf}) agar tidak terjebak bolak-balik.`
    };
  }

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

  if (sig.takenByUser || state.autoNotif) {
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
  renderSignals(true);
  showToast(`📌 Hasil dicatat: ${sig.pair} → ${outcomeType}`);
}

function takeCurrentSetup() {
  const sig = getOrLockCurrentSniperSetup(false, null, true);
  const activeAcc = getActiveAccount();

  if (activeAcc.slsToday >= activeAcc.maxSLs) {
    showToast(`🛑 Terkunci! Batas ${activeAcc.maxSLs} SL harian pada ${activeAcc.name} sudah tercapai.`);
    return;
  }

  if (sig.takenByUser) {
    showToast(`ℹ️ Setup ini sudah masuk Jurnal (${sig.takenAccountName})`);
    return;
  }

  // Peringatan Korelasi USD Searah (Hidden Double-Risk Guard)
  const usdInversePairs = ['XAUUSD', 'EURUSD', 'US100'];
  const activeCorrelated = state.userJournal.find(
    (j) =>
      isActiveStatus(j.status) &&
      j.pair !== sig.pair &&
      usdInversePairs.includes(j.pair) &&
      usdInversePairs.includes(sig.pair) &&
      j.side === sig.side
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
  renderSignals(true);

  if (activeCorrelated) {
    showToast(
      `⚠️ Masuk Jurnal (${lotInfo.lot} lot) — Waspada: searah ${activeCorrelated.side} ${activeCorrelated.pair} (korelasi USD)`
    );
  } else {
    showToast(`✅ Setup masuk Jurnal Saya (${activeAcc.name} • ${lotInfo.lot.toFixed(2)} lot)`);
  }
}

function copyPriceValue(label, valStr) {
  navigator.clipboard.writeText(String(valStr));
  showToast(`📋 ${label} (${valStr}) disalin — siap tempel ke MT5!`);
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
  renderSignals(true); // Hening saat pindah pair
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
  renderSignals(true); // Hening saat pindah timeframe
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

function setHistoryStatusFilter(stFilter) {
  state.historyStatusFilter = stFilter;
  saveState();
  ['ALL', 'DECIDED', 'CANCELLED'].forEach((f) => {
    const btn = document.getElementById(`status-filter-${f}`);
    if (!btn) return;
    if (f === stFilter) {
      btn.classList.add('bg-blue-600', 'text-white');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
    }
  });
  renderHistoryAndStats();
}

function setHistoryPairFilter(pairFilter) {
  state.historyPairFilter = pairFilter;
  saveState();
  ['ALL', 'XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((p) => {
    const btn = document.getElementById(`pair-filter-${p}`);
    if (!btn) return;
    if (p === pairFilter) {
      btn.classList.add('bg-blue-600', 'text-white');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
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

function clearSystemHistory() {
  state.signalHistory = [];
  saveState();
  renderHistoryAndStats();
  showToast('🧹 Riwayat sinyal sistem berhasil dibersihkan');
}

function editJournalEntry(itemId) {
  const entry = state.userJournal.find((j) => j.id === itemId);
  if (!entry) return;
  const rawPnl = prompt(
    `Masukkan Profit/Loss bersih ($) sesuai MT5 untuk ${entry.pair} (contoh: 8.50 atau -3.40):`,
    String(entry.pnlUsd || 0)
  );
  if (rawPnl === null) return;
  const val = parseFloat(rawPnl);
  if (!Number.isNaN(val)) {
    entry.pnlUsd = +val.toFixed(2);
    if (val > 0 && !String(entry.status).startsWith('TP')) entry.status = 'TP1 HIT';
    if (val < 0) entry.status = 'SL HIT';
    if (val === 0) entry.status = 'BREAK EVEN';
    saveState();
    renderHistoryAndStats();
    showToast(`✏️ PnL Jurnal diperbarui: ${val >= 0 ? '+' : ''}$${val.toFixed(2)}`);
  }
}

function deleteJournalEntry(itemId) {
  state.userJournal = state.userJournal.filter((j) => j.id !== itemId);
  saveState();
  renderHistoryAndStats();
  showToast('🗑️ Entri dihapus dari Jurnal Saya');
}

function toggleHistoryCardDetail(itemId) {
  expandedHistoryId = expandedHistoryId === itemId ? null : itemId;
  renderHistoryAndStats();
}

function renderSignals(silentBrowse = true) {
  const liveCardBox = document.getElementById('sniper-live-card');
  const outputBox = document.getElementById('smc-standard-output');
  const shieldBanner = document.getElementById('news-shield-banner');
  const flipBanner = document.getElementById('flip-reason-banner');
  if (!liveCardBox) return;

  updateAutoNotifUI();
  updateMethodTriggerUI();

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

  const key = `${state.selectedPair}_${state.selectedTF}`;
  if (flipBanner) {
    if (state.flipBanners[key]) {
      flipBanner.innerHTML = `
        <div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-[11px] flex items-start justify-between gap-2">
          <span>🔄 ${state.flipBanners[key]}</span>
          <button onclick="dismissFlipBanner('${key}')" class="font-extrabold px-1.5">×</button>
        </div>
      `;
      flipBanner.classList.remove('hidden');
    } else {
      flipBanner.classList.add('hidden');
    }
  }

  // Cek apakah pair + timeframe ini sedang dalam masa Cooldown Anti-Whipsaw 30 menit
  const activeCooldown = isSetupInCooldown(key);
  if (activeCooldown) {
    liveCardBox.innerHTML = `
      <div class="glass-card p-5 space-y-3 border-2 border-amber-500/40 text-center">
        <span class="px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-extrabold tracking-wider">
          🛡️ ANTI-WHIPSAW COOLDOWN (30 MENIT)
        </span>
        <h3 class="font-display text-base font-extrabold">${state.selectedPair} (${state.selectedTF}) Sedang Dikunci Sementara</h3>
        <p class="text-xs opacity-80 leading-relaxed">${activeCooldown.reason}</p>
        <div class="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] font-mono-num">
          <span class="text-[10px] uppercase opacity-60 block">Sisa Waktu Pendinginan</span>
          <span id="cooldown-countdown-timer" class="text-xl font-extrabold text-amber-500">${formatRemainingCountdown(
            new Date(activeCooldown.until).toISOString()
          )}</span>
        </div>
        <button onclick="bypassCooldown('${key}')" class="w-full py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold opacity-80 active:scale-95">
          Lewati Cooldown & Siapkan Setup Baru
        </button>
      </div>
    `;
    renderHistoryAndStats();
    return;
  }

  const sig = getOrLockCurrentSniperSetup(false, null, silentBrowse);
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
  const isAccountSlLocked = activeAcc.slsToday >= activeAcc.maxSLs;

  const limitStr = Number(sig.limitPrice || sig.entryPrice).toFixed(d);
  const slStr = Number(sig.sl).toFixed(d);
  const tp1Str = Number(sig.tp1).toFixed(d);
  const tp2Str = Number(sig.tp2).toFixed(d);
  const tp3Str = Number(sig.tp3).toFixed(d);

  const estTp2Dollar = +(lotInfo.lot * (sig.tp2Units * 0.8) * cfg.usdPerUnitPerLot).toFixed(2);
  const rrRatio = (sig.tp2Units / Math.max(1, sig.slUnits)).toFixed(1);

  const statusBadgeHtml = weekendClosed
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-500/20 opacity-80">MARKET CLOSED</span>`
    : isRunning
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">● RUNNING LIVE</span>`
    : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30">⏳ WAITING LIMIT</span>`;

  liveCardBox.innerHTML = `
    <div class="glass-card p-4 space-y-3 border-2 ${
      isBuy
        ? 'border-emerald-500/45 shadow-[0_0_30px_-10px_rgba(16,185,129,0.35)]'
        : 'border-rose-500/45 shadow-[0_0_30px_-10px_rgba(244,63,94,0.35)]'
    }">
      <!-- Header Ringkas 1-Layar -->
      <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-1.5 h-9 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'} shrink-0"></div>
          <span class="px-2 py-1 rounded-lg text-[10px] font-extrabold tracking-wider ${
            isBuy ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
          }">${sig.side}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-display text-base font-extrabold">${sig.pair}</span>
              <span class="text-[10px] font-bold opacity-60">(${sig.tf})</span>
              <span class="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold ${meta.badgeClass}">${sig.confidence}%</span>
            </div>
            <span id="live-setup-timer" class="font-mono-num text-[10px] opacity-70 block truncate">${
              weekendClosed
                ? 'Market Tutup (Timer Dibekukan)'
                : isRunning
                ? 'Running ' + formatElapsedDuration(sig.filledAt || sig.createdAt)
                : 'Menunggu Limit • Exp ' + formatRemainingCountdown(sig.expiresAt)
            }</span>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-mono-num text-sm font-extrabold block">${livePrice.toFixed(d)}</span>
          ${statusBadgeHtml}
        </div>
      </div>

      ${
        sig.isMondayWarning
          ? `<div class="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-bold">
              ⚠️ MONDAY RANGE FILTER: Tunggu sapuan likuiditas awal sesi London (14.00 WIB).
            </div>`
          : ''
      }

      <!-- Baris Metode + Tombol Scan Baru -->
      <div class="flex items-center justify-between gap-2 text-[11px]">
        <span class="font-bold truncate opacity-85">${sig.methodLabel} • R:R 1:${rrRatio}</span>
        <button onclick="forceNewSniperSetup()" class="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-[10px] font-bold active:scale-95 shrink-0">
          ↻ Scan Baru
        </button>
      </div>

      <!-- KOTAK UTAMA: PASANG LIMIT + COPY -->
      <div class="p-3 rounded-2xl bg-gradient-to-r ${
        isBuy ? 'from-emerald-500/15 to-cyan-500/10 border-emerald-500/35' : 'from-rose-500/15 to-amber-500/10 border-rose-500/35'
      } border flex items-center justify-between gap-2">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-wider opacity-75 block">
            🎯 PASANG ${sig.direction} (SWEET-SPOT)
          </span>
          <span class="font-mono-num text-xl font-extrabold tracking-tight block">${limitStr}</span>
        </div>
        <button onclick="copyPriceValue('Limit ${sig.pair}', '${limitStr}')" class="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold shadow active:scale-95 shrink-0">
          Copy
        </button>
      </div>

      <!-- BARIS STOP LOSS + RISIKO DOLAR + COPY -->
      <div class="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <span class="text-[9px] font-extrabold uppercase text-rose-500 block">
            STOP LOSS ${sig.tp1Reached ? '(LOCKED BE)' : `(-${sig.slUnits} ${sig.unitLabel} • -$${lotInfo.actualRiskUsd.toFixed(2)})`}
          </span>
          <span class="font-mono-num text-sm font-extrabold text-rose-500">${slStr}</span>
        </div>
        <button onclick="copyPriceValue('SL ${sig.pair}', '${slStr}')" class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-500 text-[10px] font-extrabold active:scale-95 shrink-0">
          Copy SL
        </button>
      </div>

      <!-- TARGET TP1 & TP2 LANGSUNG TERLIHAT + COPY -->
      <div class="grid grid-cols-1 gap-1.5 text-xs">
        <div class="px-3 py-2 rounded-xl bg-emerald-500/10 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <span class="text-[9.5px] font-bold text-emerald-500 block">TP 1 (50% • Set BE) • +${sig.tp1Units} ${sig.unitLabel}</span>
            <span class="font-mono-num text-xs font-extrabold">${tp1Str}</span>
          </div>
          <button onclick="copyPriceValue('TP1 ${sig.pair}', '${tp1Str}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold active:scale-95 shrink-0">
            Copy TP1
          </button>
        </div>

        <div class="px-3 py-2 rounded-xl bg-emerald-500/10 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <span class="text-[9.5px] font-bold text-emerald-500 block">TP 2 (30% • Trail TP1) • +${sig.tp2Units} ${sig.unitLabel} (+$${estTp2Dollar.toFixed(2)})</span>
            <span class="font-mono-num text-xs font-extrabold">${tp2Str}</span>
          </div>
          <button onclick="copyPriceValue('TP2 ${sig.pair}', '${tp2Str}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold active:scale-95 shrink-0">
            Copy TP2
          </button>
        </div>
      </div>

      <!-- Account Switcher Langsung di Kartu Sinyal + Tombol Ambil Setup -->
      <div class="pt-1 space-y-2">
        <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] text-[10.5px]">
          <select onchange="selectActiveAccount(this.value)" class="bg-transparent font-bold outline-none truncate max-w-[160px]">
            ${state.accounts
              .map(
                (a) =>
                  `<option value="${a.id}" ${a.id === activeAcc.id ? 'selected' : ''}>${a.name} ($${a.equity})</option>`
              )
              .join('')}
          </select>
          <span class="font-mono-num font-extrabold text-blue-500 shrink-0">
            ${lotInfo.lot.toFixed(2)} lot ${lotInfo.isRecoveryMode ? '(½ Risk)' : ''}
          </span>
        </div>

        <button
          onclick="takeCurrentSetup()"
          ${isAccountSlLocked ? 'disabled' : ''}
          class="w-full py-2.5 rounded-xl text-xs font-extrabold shadow active:scale-95 transition ${
            isAccountSlLocked
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 cursor-not-allowed'
              : sig.takenByUser
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
          }"
        >
          ${
            isAccountSlLocked
              ? `🔒 TERKUNCI (BATAS ${activeAcc.maxSLs} SL HARIAN TERCAPAI)`
              : sig.takenByUser
              ? `✓ Tercatat di Jurnal (${sig.takenAccountName})`
              : `Ambil Setup (${activeAcc.name} • ${lotInfo.lot.toFixed(2)} lot)`
          }
        </button>
      </div>

      <!-- Lipatan TP3, Penjelasan Struktur & Tombol Tandai Hasil -->
      <details class="pt-2 border-t border-[var(--border-subtle)] text-xs">
        <summary class="text-[10.5px] font-bold opacity-75 cursor-pointer select-none flex items-center justify-between">
          <span>Lihat TP 3 Runner, Penjelasan Struktur & Tutup Manual</span>
          <span>▾</span>
        </summary>
        <div class="mt-2.5 space-y-2.5">
          <div class="px-3 py-2 rounded-xl bg-emerald-500/10 flex items-center justify-between gap-2">
            <div>
              <span class="text-[9.5px] font-bold text-emerald-500 block">TP 3 (20% Runner) • +${sig.tp3Units} ${sig.unitLabel}</span>
              <span class="font-mono-num text-xs font-extrabold">${tp3Str}</span>
            </div>
            <button onclick="copyPriceValue('TP3 ${sig.pair}', '${tp3Str}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold">
              Copy TP3
            </button>
          </div>

          <p class="text-[11px] opacity-80 leading-relaxed">
            <strong>Struktur:</strong> ${sig.structure}
          </p>

          ${
            isWaiting || isRunning
              ? `<div>
                  <span class="text-[9.5px] font-bold uppercase opacity-60 block mb-1.5">Tandai Hasil Setup (Jika Sudah Close):</span>
                  <div class="grid grid-cols-5 gap-1.5 text-[9.5px] font-extrabold">
                    <button onclick="manualResolveCurrentSetup('TP1 HIT')" class="py-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">TP1</button>
                    <button onclick="manualResolveCurrentSetup('TP2 HIT')" class="py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">TP2</button>
                    <button onclick="manualResolveCurrentSetup('TP3 HIT')" class="py-1.5 rounded-lg bg-emerald-500/25 text-emerald-500">TP3</button>
                    <button onclick="manualResolveCurrentSetup('BREAK EVEN')" class="py-1.5 rounded-lg bg-slate-500/15 opacity-80">BE</button>
                    <button onclick="manualResolveCurrentSetup('SL HIT')" class="py-1.5 rounded-lg bg-rose-500/15 text-rose-500">SL</button>
                  </div>
                </div>`
              : ''
          }
        </div>
      </details>
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
  renderSignals(true);
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
    const m = i.method || 'ICT';
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

  let filtered = filterItemsByPeriod(sourceList, state.historyPeriod);

  // Filter Pair
  if (state.historyPairFilter && state.historyPairFilter !== 'ALL') {
    filtered = filtered.filter((i) => i.pair === state.historyPairFilter);
  }

  // Filter Status (Selesai TP/SL vs Batal/Terlewat)
  if (state.historyStatusFilter === 'DECIDED') {
    filtered = filtered.filter(
      (i) => String(i.status).startsWith('TP') || i.status === 'SL HIT' || i.status === 'BREAK EVEN'
    );
  } else if (state.historyStatusFilter === 'CANCELLED') {
    filtered = filtered.filter(
      (i) => i.status === 'INVALIDATED' || i.status === 'MISSED / FLIPPED'
    );
  }

  const jBadge = document.getElementById('journal-count-badge');
  if (jBadge) jBadge.textContent = state.userJournal.length;

  const edgeEl = document.getElementById('edge-finder-banner');
  if (edgeEl) edgeEl.textContent = computeEdgeFinderInsight(sourceList);

  const tpCount = filtered.filter((i) => String(i.status).startsWith('TP')).length;
  const slCount = filtered.filter((i) => i.status === 'SL HIT').length;
  const beCount = filtered.filter((i) => i.status === 'BREAK EVEN').length;
  const decided = tpCount + slCount;
  const winrate = decided > 0 ? Math.round((tpCount / decided) * 100) : 0;

  // Hitung +Pips (Profit), -Pips (Loss), Net Pips, dan Profit Factor
  const posUnits = filtered.reduce((sum, i) => {
    const u = Number(i.resultUnits) || 0;
    return u > 0 ? sum + u : sum;
  }, 0);
  const negUnits = filtered.reduce((sum, i) => {
    const u = Number(i.resultUnits) || 0;
    return u < 0 ? sum + Math.abs(u) : sum;
  }, 0);
  const netUnits = posUnits - negUnits;
  const profitFactor =
    negUnits > 0 ? (posUnits / negUnits).toFixed(2) : posUnits > 0 ? '∞' : '0.00';

  const elTot = document.getElementById('stat-total-signals');
  const elTp = document.getElementById('stat-tp-count');
  const elSl = document.getElementById('stat-sl-count');
  const elBe = document.getElementById('stat-be-count');
  const elWr = document.getElementById('stat-winrate');
  const elPos = document.getElementById('stat-pos-pips');
  const elNeg = document.getElementById('stat-neg-pips');
  const elNet = document.getElementById('stat-net-pips');
  const elPf = document.getElementById('stat-profit-factor');

  if (elTot) elTot.textContent = `${filtered.length} SINYAL`;
  if (elTp) elTp.textContent = tpCount;
  if (elSl) elSl.textContent = slCount;
  if (elBe) elBe.textContent = beCount;
  if (elWr) elWr.textContent = `${winrate}%`;
  if (elPos) elPos.textContent = `+${posUnits}`;
  if (elNeg) elNeg.textContent = `-${negUnits}`;
  if (elNet) {
    elNet.textContent = `${netUnits >= 0 ? '+' : ''}${netUnits}`;
    elNet.className = `font-mono-num text-xs font-extrabold ${
      netUnits >= 0 ? 'text-emerald-500' : 'text-rose-500'
    }`;
  }
  if (elPf) elPf.textContent = `${profitFactor}x`;

  const feedEl = document.getElementById('history-feed-container');
  if (!feedEl) return;

  if (filtered.length === 0) {
    feedEl.innerHTML = `
      <div class="glass-card p-5 text-center">
        <p class="text-xs font-bold opacity-75">Belum ada catatan pada filter ini.</p>
        <p class="text-[11px] opacity-60 mt-1">${
          state.historyFeedMode === 'JOURNAL'
            ? 'Tekan tombol "Ambil Setup" pada kartu sinyal untuk mencatat jurnal pribadimu.'
            : 'Coba ubah filter status/periode di atas untuk melihat riwayat lainnya.'
        }</p>
      </div>
    `;
    return;
  }

  feedEl.innerHTML = filtered
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
      const uVal = Number(item.resultUnits) || 0;
      const uBadge =
        uVal > 0
          ? `<span class="text-emerald-500 font-mono-num text-[10px] font-bold">+${uVal} ${item.unitLabel}</span>`
          : uVal < 0
          ? `<span class="text-rose-500 font-mono-num text-[10px] font-bold">${uVal} ${item.unitLabel}</span>`
          : '';

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
                    ? `<span class="text-[9.5px] text-blue-500 font-bold block">${item.takenAccountName} (${item.takenLot} lot) ${
                        typeof item.pnlUsd === 'number' && item.pnlUsd !== 0
                          ? `• ${item.pnlUsd >= 0 ? '+' : ''}$${item.pnlUsd.toFixed(2)}`
                          : ''
                      }</span>`
                    : uBadge
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
              ? `<div class="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-[11px] space-y-2" onclick="event.stopPropagation()">
                  <p class="font-mono-num font-bold text-blue-500">${edu.riskSummary}</p>
                  <p class="opacity-85 leading-relaxed">${edu.outcomeInsight}</p>
                  <p class="opacity-70 text-[10.5px]"><strong>Struktur:</strong> ${item.structure}</p>
                  ${
                    state.historyFeedMode === 'JOURNAL'
                      ? `<div class="flex gap-2 pt-1">
                          <button onclick="editJournalEntry('${item.id}')" class="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-500 text-[10px] font-bold">✏️ Edit PnL ($)</button>
                          <button onclick="deleteJournalEntry('${item.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-500 text-[10px] font-bold">🗑️ Hapus</button>
                        </div>`
                      : ''
                  }
                </div>`
              : `<p class="text-[9.5px] opacity-50 mt-1 text-right">Ketuk untuk detail pips & evaluasi ▾</p>`
          }
        </div>
      `;
    })
    .join('');
}

function copyDailyRecapSummary() {
  const winrate = document.getElementById('stat-winrate')?.textContent || '0%';
  const pos = document.getElementById('stat-pos-pips')?.textContent || '+0';
  const neg = document.getElementById('stat-neg-pips')?.textContent || '-0';
  const net = document.getElementById('stat-net-pips')?.textContent || '+0';
  const pf = document.getElementById('stat-profit-factor')?.textContent || '0.00x';

  const summary = [
    `📊 REKAP PERFORMA LIAMVTRADE (${state.historyPeriod})`,
    `Winrate       : ${winrate}`,
    `Profit (+Pips): ${pos}`,
    `Loss (-Pips)  : ${neg}`,
    `Net Pips      : ${net}`,
    `Profit Factor : ${pf}`
  ].join('\n');

  navigator.clipboard.writeText(summary);
  showToast('📋 Rekap performa (+Pips / -Pips / Winrate) disalin!');
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
    'PnL Bersih (USD)'
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

// ==================== 9. PRE-NEWS, OB/SNR CONFLUENCE & LIVE BREAKING WIRE ====================
async function fetchLiveEconomicNews(manualTrigger = false) {
  const statusEl = document.getElementById('news-sync-status');
  if (statusEl) statusEl.textContent = 'Menyinkronkan kalender USD & Breaking Wire...';

  // 1. Selalu gunakan jadwal mingguan bertanggal + jam WIB pasti sebagai fondasi anti-blokir
  const datedBase = typeof generateDatedWeeklyUsdNews === 'function' ? generateDatedWeeklyUsdNews() : [...activeNewsList];
  activeNewsList = datedBase.map((n) => ({
    ...n,
    actual: state.customNewsActuals?.[n.id] || n.actual
  }));

  // 2. Tarik Breaking Headlines terbaru (Trump, AS-Iran, The Fed)
  if (typeof fetchLiveBreakingHeadlines === 'function') {
    const liveWire = await fetchLiveBreakingHeadlines();
    if (Array.isArray(liveWire) && liveWire.length > 0) {
      activeBreakingWire = liveWire;
    }
  }

  if (statusEl) {
    statusEl.textContent = `● Kalender Mingguan Bertanggal + Live Breaking Wire (${state.selectedPair})`;
  }
  if (manualTrigger) showToast('📰 Jadwal News & Breaking Wire diperbarui!');
  renderNews(currentNewsFilter);
  if (state.activeTab === 'signals') renderSignals(true);
}

function submitQuickNewsActual(newsId) {
  const input = document.getElementById(`news-actual-input-${newsId}`);
  const val = input?.value.trim();
  if (!val) {
    showToast('⚠️ Masukkan angka Actual dulu (contoh: 0.2% atau 165K)');
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

  if (wireContainer) {
    wireContainer.innerHTML = activeBreakingWire
      .map(
        (w) => `
        <div class="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[9.5px] font-extrabold text-blue-400 uppercase tracking-wider">${w.tag}</span>
            <span class="font-mono-num text-[9.5px] opacity-65">${w.timeWib || ''}</span>
          </div>
          <strong class="block font-display text-xs leading-snug">${w.title}</strong>
          <p class="text-[11px] opacity-80 leading-relaxed">${w.summary}</p>
        </div>
      `
      )
      .join('');
  }

  if (!container) return;

  const pairId = state.selectedPair || 'XAUUSD';
  const curPrice = Number(livePrices[pairId]) || 2712.5;

  container.innerHTML = list
    .map((n) => {
      const analysis =
        typeof buildNewsPreAndPostAnalysis === 'function'
          ? buildNewsPreAndPostAnalysis(n, pairId, curPrice, marketRanges)
          : null;

      const postHtml =
        analysis && analysis.postVerdict
          ? `<div class="p-3 rounded-2xl border ${
              analysis.postVerdict.biasColor === 'emerald'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                : analysis.postVerdict.biasColor === 'rose'
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-400'
            } text-xs space-y-1">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[9.5px] font-extrabold uppercase tracking-wider">⚡ POST-NEWS VERDICT</span>
                <span class="px-2 py-0.5 rounded-full bg-black/20 text-[9px] font-extrabold">${analysis.postVerdict.verdictBadge}</span>
              </div>
              <strong class="font-display text-sm block">${analysis.postVerdict.directionCall}</strong>
              <p class="text-[11px] opacity-90 leading-relaxed">${analysis.postVerdict.deviationText}</p>
              <p class="text-[11px] font-semibold">📌 Eksekusi: ${analysis.postVerdict.executionAdvice}</p>
            </div>`
          : '';

      const preHtml = analysis
        ? `<div class="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] text-[11px] space-y-2">
            <!-- Asumsi Terkuat Fundamental + OB/SnR -->
            <div class="p-2.5 rounded-xl ${
              analysis.strongestSide === 'BUY'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            } space-y-1">
              <span class="text-[9px] font-extrabold uppercase tracking-wider block">🧠 KONFLUENSI FUNDAMENTAL + ZONA OB/SnR</span>
              <strong class="font-display text-xs block">${analysis.strongestTitle}</strong>
              <p class="text-[10.5px] opacity-90 leading-relaxed">${analysis.strongestReason}</p>
              <div class="flex items-center justify-between pt-1 text-[10px] font-mono-num">
                <span>Demand OB: ${analysis.demandObLevel}</span>
                <span>Supply OB: ${analysis.supplyObLevel}</span>
              </div>
            </div>

            <p class="opacity-85 leading-relaxed">${analysis.prePlaybook.expectationText}</p>
            <p class="text-rose-400 font-semibold">• ${analysis.prePlaybook.scenarioSellRiskAssets}</p>
            <p class="text-emerald-400 font-semibold">• ${analysis.prePlaybook.scenarioBuyRiskAssets}</p>

            <button onclick="createSetupFromNews('${analysis.strongestSide}')" class="w-full py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[11px] font-extrabold active:scale-95">
              🎯 Buat Setup ${analysis.strongestSide} ${pairId} (M15) Searah News
            </button>
          </div>`
        : '';

      return `
        <div class="glass-card p-4 space-y-3 card-3d">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold whitespace-nowrap ${
              n.impact === 'HIGH' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
            }">
              ${n.impact === 'HIGH' ? '🔴 HIGH' : '🟠 MED'} • ${n.category}
            </span>
            <span class="font-mono-num text-[10px] font-bold opacity-80 text-right">${n.time}</span>
          </div>

          <h3 class="font-display text-sm font-extrabold leading-snug">${n.title}</h3>

          <div class="grid grid-cols-3 gap-2 p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-center font-mono-num text-xs">
            <div><span class="text-[8.5px] block opacity-60 font-sans">ACTUAL</span><strong>${n.actual}</strong></div>
            <div><span class="text-[8.5px] block opacity-60 font-sans">FORECAST</span><strong>${n.forecast}</strong></div>
            <div><span class="text-[8.5px] block opacity-60 font-sans">PREVIOUS</span><strong>${n.previous}</strong></div>
          </div>

          <div class="flex items-center gap-1.5">
            <input id="news-actual-input-${n.id}" type="text" placeholder="Input Actual (cth: 0.2%)..." class="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--border-subtle)] text-[11px] outline-none" />
            <button onclick="submitQuickNewsActual('${n.id}')" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold active:scale-95 shrink-0">
              Vonis
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

// ==================== 11. NATIVE HP NOTIFICATION + OPTIONAL TELEGRAM ====================
function updateNativeNotifStatusUI() {
  const statusEl = document.getElementById('native-notif-status');
  const btnEl = document.getElementById('btn-enable-notif');
  if (!statusEl || !btnEl) return;

  if (!('Notification' in window)) {
    statusEl.textContent = 'Browser tidak mendukung Notifikasi Native';
    return;
  }

  if (Notification.permission === 'granted') {
    statusEl.textContent = '✅ Aktif — Smart Alert HP siap jalan otomatis';
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
    'Smart Alert aktif! Tanpa spam saat pindah pair/TF; hanya High Signal Killzone & update posisi aktif.'
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

  if (eventType === 'NEW') {
    title = `🎯 HIGH SIGNAL ${sig.pair} ${sig.direction} (${sig.tf})`;
    body = `Limit: ${lim} | SL: ${sig.sl.toFixed(d)} | TP2: ${sig.tp2.toFixed(d)} (${lotInfo.lot.toFixed(2)} lot)`;
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
    '🧠 LIAMVTRADE v2.6 — Xliamvr Terminal\n✅ Smart Alert Telegram terhubung (Mode Anti-Spam Aktif)!'
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
  if (sbUrl) sbUrl.value = state.supabaseUrl || DEFAULT_SUPABASE_URL;
  if (sbKey) sbKey.value = state.supabaseAnonKey || '';
  trackTwelveDataQuota(0);
  updateNativeNotifStatusUI();
  renderAssetRoadmap();
  renderAuthAndOwnerUI();
}

function saveSettings() {
  state.twelveDataKey = document.getElementById('cfg-twelvedata-key')?.value.trim() || '';
  state.tgToken = document.getElementById('cfg-tg-token')?.value.trim() || '';
  state.tgChatId = document.getElementById('cfg-tg-chatid')?.value.trim() || '';
  state.supabaseUrl = document.getElementById('cfg-supabase-url')?.value.trim() || DEFAULT_SUPABASE_URL;
  state.supabaseAnonKey = document.getElementById('cfg-supabase-key')?.value.trim() || '';
  saveState();
  renderAuthAndOwnerUI();
  syncLiveMarketPrices(true);
  if (isSupabaseConfigured()) syncToSupabaseCloud(true);
  showToast('💾 Pengaturan API & Cloud tersimpan');
}

function resetDailyCounters() {
  state.accounts.forEach((a) => {
    a.entriesToday = 0;
    a.slsToday = 0;
  });
  state.cooldowns = {};
  state.notifiedSessionKeys = {};
  state.checklist.forEach((c) => (c.done = false));
  saveState();
  renderHomeDashboard();
  if (state.activeTab === 'signals') renderSignals(true);
  showToast('🔄 Tracker harian & Cooldown seluruh akun di-reset');
}

// 3D Card Pointer Tilt Physics
document.addEventListener('pointermove', (e) => {
  const card = e.target.closest('.card-3d');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
});

document.addEventListener('pointerout', (e) => {
  const card = e.target.closest('.card-3d');
  if (card) card.style.transform = '';
});

// Boot Sequence & Update Detector
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              document.getElementById('update-banner')?.classList.remove('hidden');
            }
          });
        });
      })
      .catch(() => {});
  }

  setTimeout(() => {
    const bar = document.getElementById('splash-bar');
    if (bar) bar.style.width = '100%';
  }, 200);

  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hide');
  }, 1150);

  applyTheme(state.theme);
  updateMethodTriggerUI();
  loadSettingsUI();
  updateWibSession();
  setInterval(updateWibSession, 1000);
  renderHomeDashboard();
  fetchLiveEconomicNews(false);
  setSignalPair(state.selectedPair);
  setSignalTF(state.selectedTF);
  setHistoryPeriod(state.historyPeriod);
  setHistoryStatusFilter(state.historyStatusFilter);
  setHistoryPairFilter(state.historyPairFilter);
  setHistoryFeedMode(state.historyFeedMode);
  syncLiveMarketPrices(true);
  setInterval(() => syncLiveMarketPrices(false), 15000);
  if (isSupabaseConfigured()) syncToSupabaseCloud(false);
  switchTab(state.activeTab);
});
