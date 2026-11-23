/*!
 * Liamvtrade — Quant Terminal Core Application Engine v2.7
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const APP_VERSION = '2.7.0';
const STORAGE_KEY = 'liamvtrade_state_v27';
const LEGACY_KEYS = ['liamvtrade_state_v26', 'liamvtrade_state_v25'];

const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Akun Utama #1',
    firm: 'Propanium',
    balance: 5000,
    equity: 5124.70,
    riskPct: 0.4,
    maxLotCap: 0.25,
    maxEntries: 2,
    maxSLs: 2,
    myfxbookId: '',
    entriesToday: 0,
    slToday: 0,
    wins: 14,
    losses: 5,
    isCustom: false
  },
  {
    id: 'acc-2',
    name: 'Akun Evaluasi #2',
    firm: 'The5ers',
    balance: 10000,
    equity: 10280.00,
    riskPct: 0.4,
    maxLotCap: 0.50,
    maxEntries: 2,
    maxSLs: 2,
    myfxbookId: '',
    entriesToday: 0,
    slToday: 0,
    wins: 19,
    losses: 6,
    isCustom: false
  },
  {
    id: 'acc-3',
    name: 'Akun Scalping #3',
    firm: 'Alpha Trader',
    balance: 2500,
    equity: 2560.00,
    riskPct: 0.4,
    maxLotCap: 0.15,
    maxEntries: 2,
    maxSLs: 2,
    myfxbookId: '',
    entriesToday: 0,
    slToday: 0,
    wins: 11,
    losses: 4,
    isCustom: false
  },
  {
    id: 'acc-bf',
    name: 'BrightFunded #4',
    firm: 'Bright Funded',
    balance: 1000,
    equity: 984.94,
    riskPct: 0.4,
    maxLotCap: 0.05,
    maxEntries: 2,
    maxSLs: 2,
    myfxbookId: '',
    entriesToday: 0,
    slToday: 0,
    wins: 8,
    losses: 3,
    isCustom: true
  }
];

const DEFAULT_CHECKLIST = [
  { text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', checked: true },
  { text: 'Cek jadwal High Impact News USD (CPI/NFP/FOMC)', checked: false },
  { text: 'Wajib tunggu Liquidity Sweep + CHoCH M5/M1', checked: false }
];

let appState = loadAppState();
let activeTab = 'home';
let editingAccountId = null;
let lastBannerMessage = '';
let priceSourceLabel = 'Menghubungkan live feed...';

function createDefaultState() {
  return {
    version: APP_VERSION,
    theme: 'dark',
    auth: {
      loggedIn: true,
      role: 'OWNER',
      user: '@xliamvr',
      tier: 'LIFETIME OWNER'
    },
    activeAccountId: 'acc-bf',
    accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
    checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
    lastResetDateWib: getWibDateStamp(),
    signalConfig: {
      pair: 'XAUUSD',
      tf: 'M15',
      method: 'AUTO',
      autoNotif: true
    },
    filters: {
      engineEnabled: true,
      mondayFilter: true,
      sessionFilter: true,
      newsShield: true,
      slCooldown: true,
      weekendBtc: true
    },
    historyView: {
      period: 'ALL',
      feedMode: 'SYSTEM',
      statusFilter: 'ALL',
      pairFilter: 'ALL'
    },
    livePrices: {
      XAUUSD: 3576.20,
      US100: 21450.00,
      BTCUSDT: 94250.00,
      EURUSD: 1.05650
    },
    priceOffsets: {
      XAUUSD: 0,
      US100: 0,
      BTCUSDT: 0,
      EURUSD: 0
    },
    marketRanges: {
      XAUUSD: { high: 3588.50, low: 3558.40 },
      US100: { high: 21540.00, low: 21320.00 },
      BTCUSDT: { high: 95400.00, low: 92800.00 },
      EURUSD: { high: 1.05920, low: 1.05310 }
    },
    activeSignals: {},
    cooldownUntil: {},
    systemHistory: [],
    userJournal: [],
    settings: {
      twelveDataKey: '',
      supabaseUrl: 'https://wgaixhcamdlsgyavrddq.supabase.co',
      supabaseKey: '',
      tgToken: '',
      tgChatId: '',
      tdCallsToday: 0,
      tdQuotaDate: getWibDateStamp()
    },
    ownerControls: {
      broadcastMessage: ''
    },
    newsFilter: 'ALL'
  };
}

function loadAppState() {
  const base = createDefaultState();
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const oldKey of LEGACY_KEYS) {
        const legacy = localStorage.getItem(oldKey);
        if (legacy) {
          raw = legacy;
          break;
        }
      }
    }
    if (!raw) return base;
    const parsed = JSON.parse(raw);

    return {
      ...base,
      ...parsed,
      auth: { ...base.auth, ...(parsed.auth || {}) },
      signalConfig: { ...base.signalConfig, ...(parsed.signalConfig || {}) },
      filters: { ...base.filters, ...(parsed.filters || {}) },
      historyView: { ...base.historyView, ...(parsed.historyView || {}) },
      livePrices: { ...base.livePrices, ...(parsed.livePrices || {}) },
      priceOffsets: { ...base.priceOffsets, ...(parsed.priceOffsets || {}) },
      marketRanges: { ...base.marketRanges, ...(parsed.marketRanges || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      ownerControls: { ...base.ownerControls, ...(parsed.ownerControls || {}) },
      accounts: Array.isArray(parsed.accounts) && parsed.accounts.length ? parsed.accounts : base.accounts,
      checklist: Array.isArray(parsed.checklist) && parsed.checklist.length ? parsed.checklist : base.checklist,
      systemHistory: Array.isArray(parsed.systemHistory) ? parsed.systemHistory : [],
      userJournal: Array.isArray(parsed.userJournal) ? parsed.userJournal : [],
      activeSignals: parsed.activeSignals || {},
      cooldownUntil: parsed.cooldownUntil || {}
    };
  } catch (e) {
    return base;
  }
}

function saveAppState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Storage save skipped:', e);
  }
}

/* ==================== TIME & WIB HELPERS ==================== */
function getNowWib() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
}

function getWibDateStamp() {
  const wib = getNowWib();
  // Reset harian jam 05:00 WIB
  const shifted = new Date(wib.getTime() - 5 * 3600000);
  return shifted.toISOString().slice(0, 10);
}

function formatWibClockFull() {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const wib = getNowWib();
  const dName = days[wib.getDay()];
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  return `${dName}, ${hh}:${mm}:${ss} WIB`;
}

function formatIsoToWibTime(isoString) {
  if (!isoString) return '--:-- WIB';
  const dt = new Date(isoString);
  const wib = new Date(dt.getTime() + dt.getTimezoneOffset() * 60000 + 7 * 3600000);
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

function formatDurationHuman(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}j ${mins}m ${secs}d`;
  if (mins > 0) return `${mins}m ${secs}d`;
  return `${secs}d`;
}

function checkDailyAutoReset() {
  const todayStamp = getWibDateStamp();
  if (appState.lastResetDateWib !== todayStamp) {
    appState.lastResetDateWib = todayStamp;
    appState.accounts.forEach((acc) => {
      acc.entriesToday = 0;
      acc.slToday = 0;
    });
    appState.checklist.forEach((item) => {
      item.checked = false;
    });
    appState.cooldownUntil = {};
    saveAppState();
  }
  if (appState.settings.tdQuotaDate !== todayStamp) {
    appState.settings.tdQuotaDate = todayStamp;
    appState.settings.tdCallsToday = 0;
    saveAppState();
  }
}

/* ==================== UI HELPERS & NAVIGATION ==================== */
function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('opacity-0', '-translate-y-2');
  box.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    box.classList.add('opacity-0', '-translate-y-2');
    box.classList.remove('opacity-100', 'translate-y-0');
  }, 2600);
}

function copyTextValue(val, label = 'Nilai') {
  const text = String(val);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ ${label} disalin: ${text}`);
    }).catch(() => fallbackCopy(text, label));
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast(`✅ ${label} disalin: ${text}`);
}

function applyTheme() {
  const theme = appState.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');
  if (sun && moon) {
    sun.classList.toggle('hidden', theme !== 'dark');
    moon.classList.toggle('hidden', theme === 'dark');
  }
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  saveAppState();
  applyTheme();
  if (activeTab === 'chart') renderTradingViewChart();
}

function switchTab(tab) {
  activeTab = tab;
  const tabs = ['home', 'news', 'signals', 'chart', 'profile'];
  tabs.forEach((t) => {
    const sec = document.getElementById(`tab-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    if (sec) sec.classList.toggle('hidden', t !== tab);
    if (navBtn && t !== 'signals') {
      navBtn.classList.toggle('text-blue-500', t === tab);
      navBtn.classList.toggle('opacity-60', t !== tab);
    }
  });

  if (tab === 'home') renderHomeTab();
  if (tab === 'news') renderNewsTab();
  if (tab === 'signals') renderSignalsTab();
  if (tab === 'chart') renderChartTab();
  if (tab === 'profile') renderProfileTab();
}

/* ==================== LIVE MULTI-SOURCE PRICE ENGINE ==================== */
function getEffectivePrice(pairId) {
  const base = Number(appState.livePrices[pairId]) || 0;
  const offset = Number(appState.priceOffsets?.[pairId]) || 0;
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  return +(base + offset).toFixed(cfg.decimals);
}

async function fetchLiveMarketPrices(manual = false) {
  const tdKey = (appState.settings.twelveDataKey || '').trim();
  const wib = getNowWib();
  const isWeekend = wib.getDay() === 0 || wib.getDay() === 6;

  // 1. BTCUSDT — Binance 24hr Live (Gratis, 24/7, Tanpa API Key)
  try {
    const btcRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    if (btcRes.ok) {
      const btcData = await btcRes.json();
      const last = parseFloat(btcData.lastPrice);
      const high = parseFloat(btcData.highPrice);
      const low = parseFloat(btcData.lowPrice);
      if (last > 1000) {
        appState.livePrices.BTCUSDT = +last.toFixed(2);
        if (high > low) {
          appState.marketRanges.BTCUSDT = { high: +high.toFixed(2), low: +low.toFixed(2) };
        }
      }
    }
  } catch (e) {
    try {
      const ccRes = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD');
      const ccData = await ccRes.json();
      if (ccData?.USD) appState.livePrices.BTCUSDT = +Number(ccData.USD).toFixed(2);
    } catch (_) {}
  }

  // 2. XAUUSD, EURUSD, US100 — Twelve Data (Jika tersedia & kuota aman) + Fallback Spot Gratis Akurat
  let usedTwelveData = false;
  if (tdKey && appState.settings.tdCallsToday < 760) {
    try {
      const symbols = 'XAU/USD,EUR/USD,NDX';
      const tdRes = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${encodeURIComponent(tdKey)}`);
      if (tdRes.ok) {
        const tdJson = await tdRes.json();
        appState.settings.tdCallsToday += 3;
        if (tdJson['XAU/USD']?.close) {
          const p = parseFloat(tdJson['XAU/USD'].close);
          const h = parseFloat(tdJson['XAU/USD'].high) || p + 12;
          const l = parseFloat(tdJson['XAU/USD'].low) || p - 12;
          if (p > 1000) {
            appState.livePrices.XAUUSD = +p.toFixed(2);
            appState.marketRanges.XAUUSD = { high: +h.toFixed(2), low: +l.toFixed(2) };
            usedTwelveData = true;
          }
        }
        if (tdJson['EUR/USD']?.close) {
          const p = parseFloat(tdJson['EUR/USD'].close);
          const h = parseFloat(tdJson['EUR/USD'].high) || p + 0.003;
          const l = parseFloat(tdJson['EUR/USD'].low) || p - 0.003;
          if (p > 0.5) {
            appState.livePrices.EURUSD = +p.toFixed(5);
            appState.marketRanges.EURUSD = { high: +h.toFixed(5), low: +l.toFixed(5) };
            usedTwelveData = true;
          }
        }
        if (tdJson['NDX']?.close) {
          const p = parseFloat(tdJson['NDX'].close);
          const h = parseFloat(tdJson['NDX'].high) || p + 120;
          const l = parseFloat(tdJson['NDX'].low) || p - 120;
          if (p > 5000) {
            appState.livePrices.US100 = +p.toFixed(2);
            appState.marketRanges.US100 = { high: +h.toFixed(2), low: +l.toFixed(2) };
            usedTwelveData = true;
          }
        }
      }
    } catch (_) {}
  }

  // Fallback Akurat Tanpa Kunci API jika Twelve Data tidak aktif / terbatas
  if (!usedTwelveData) {
    // Spot Gold (XAUUSD) dari GoldPrice Public Spot Feed
    try {
      const goldRes = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
      if (goldRes.ok) {
        const goldJson = await goldRes.json();
        const xau = Number(goldJson?.items?.[0]?.xauPrice);
        if (xau > 1500) {
          appState.livePrices.XAUUSD = +xau.toFixed(2);
          const curRng = appState.marketRanges.XAUUSD;
          if (!curRng || Math.abs(curRng.high - xau) > 120) {
            appState.marketRanges.XAUUSD = {
              high: +(xau + 14.5).toFixed(2),
              low: +(xau - 14.5).toFixed(2)
            };
          } else {
            curRng.high = Math.max(curRng.high, xau);
            curRng.low = Math.min(curRng.low, xau);
          }
        }
      }
    } catch (_) {}

    // Spot EUR/USD dari Open Exchange Interbank Feed
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/EUR');
      if (fxRes.ok) {
        const fxJson = await fxRes.json();
        const eurUsd = Number(fxJson?.rates?.USD);
        if (eurUsd > 0.7 && eurUsd < 1.6) {
          appState.livePrices.EURUSD = +eurUsd.toFixed(5);
          const curRng = appState.marketRanges.EURUSD;
          if (!curRng || Math.abs(curRng.high - eurUsd) > 0.03) {
            appState.marketRanges.EURUSD = {
              high: +(eurUsd + 0.0028).toFixed(5),
              low: +(eurUsd - 0.0028).toFixed(5)
            };
          } else {
            curRng.high = Math.max(curRng.high, eurUsd);
            curRng.low = Math.min(curRng.low, eurUsd);
          }
        }
      }
    } catch (_) {}
  }

  priceSourceLabel = usedTwelveData
    ? 'Live Twelve Data + Binance 24/7'
    : isWeekend
    ? 'Spot Referensi + Binance BTC Live 24/7'
    : 'Spot Interbank Live + Binance 24/7';

  saveAppState();
  updateHeaderLiveTicker();
  evaluateAllActiveSignals();

  if (activeTab === 'signals') renderSignalsTab();
  if (activeTab === 'chart') updateChartRadarBox();
  if (activeTab === 'profile') updateQuotaBadge();

  if (manual) {
    const p = appState.signalConfig.pair;
    showToast(`📡 Harga diperbarui: ${p} (${getEffectivePrice(p)})`);
  }
}

function updateHeaderLiveTicker() {
  const pair = appState.signalConfig.pair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pair] || LIAMV_PAIRS.XAUUSD;
  const price = getEffectivePrice(pair);
  const lbl = document.getElementById('header-pair-label');
  const prc = document.getElementById('header-pair-price');
  const dot = document.getElementById('header-price-status');
  if (lbl) lbl.textContent = cfg.label;
  if (prc) {
    prc.textContent =
      pair === 'XAUUSD' || pair === 'US100' || pair === 'BTCUSDT'
        ? price.toLocaleString('en-US', { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })
        : price.toFixed(cfg.decimals);
  }
  if (dot) {
    dot.className = appState.filters.engineEnabled
      ? 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500'
      : 'relative inline-flex rounded-full h-2 w-2 bg-amber-500';
  }
}

/* ==================== SIGNAL ENGINE & LIFECYCLE ==================== */
function getSetupKey(pair, tf) {
  return `${pair}_${tf}`;
}

function getOrCreateActiveSetup(pair, tf, forceNew = false, forceSide = null, flipCount = 0) {
  const key = getSetupKey(pair, tf);
  let sig = appState.activeSignals[key];
  if (!sig || forceNew) {
    const livePrice = getEffectivePrice(pair);
    sig = buildLockedSniperSetup(
      pair,
      tf,
      appState.signalConfig.method,
      livePrice,
      appState.marketRanges,
      forceSide,
      flipCount,
      appState.filters
    );
    appState.activeSignals[key] = sig;
    saveAppState();
  }
  return sig;
}

function evaluateAllActiveSignals() {
  if (!appState.filters.engineEnabled) return;
  const wib = getNowWib();
  const isWeekend = wib.getDay() === 0 || wib.getDay() === 6;

  Object.keys(appState.activeSignals).forEach((key) => {
    const sig = appState.activeSignals[key];
    if (!sig) return;
    const price = getEffectivePrice(sig.pair);
    const res = evaluateSetupLifecycle(sig, price, appState.marketRanges, isWeekend);

    if (res.action === 'FILL_RUNNING') {
      sig.status = 'RUNNING';
      sig.filledAt = res.filledAt;
      saveAppState();
      triggerPushNotification(`⚡ LIMIT TERSENTUH: ${sig.pair} ${sig.direction}`, `Entry aktif di ${sig.limitPrice}. SL ${sig.sl} | TP1 ${sig.tp1}`);
    } else if (res.action === 'TRAIL_TP1') {
      sig.tp1Reached = true;
      sig.sl = res.newSl;
      saveAppState();
      triggerPushNotification(`🎯 TP1 HIT: ${sig.pair}`, `Amankan 50% profit & geser SL ke Break Even (${sig.sl}).`);
    } else if (res.action === 'TRAIL_TP2') {
      sig.tp2Reached = true;
      sig.sl = res.newSl;
      saveAppState();
      triggerPushNotification(`🚀 TP2 HIT: ${sig.pair}`, `Amankan 30% profit & trail SL ke TP1 (${sig.sl}).`);
    } else if (res.action === 'REPLACE') {
      archiveSignalRecord(sig, res.archiveStatus, 0);
      lastBannerMessage = res.bannerMsg;
      const fresh = buildLockedSniperSetup(
        sig.pair,
        sig.tf,
        appState.signalConfig.method,
        price,
        appState.marketRanges,
        res.flipSide,
        res.flipCount,
        appState.filters
      );
      appState.activeSignals[key] = fresh;
      saveAppState();
    } else if (res.action === 'FINALIZE') {
      archiveSignalRecord(sig, res.finalStatus, res.signedUnits);
      if (res.finalStatus === 'SL HIT' && appState.filters.slCooldown) {
        appState.cooldownUntil[sig.pair] = Date.now() + 30 * 60000;
      }
      const fresh = buildLockedSniperSetup(
        sig.pair,
        sig.tf,
        appState.signalConfig.method,
        price,
        appState.marketRanges,
        null,
        0,
        appState.filters
      );
      appState.activeSignals[key] = fresh;
      saveAppState();
      triggerPushNotification(`🏁 ${res.finalStatus}: ${sig.pair}`, `Hasil: ${res.signedUnits >= 0 ? '+' : ''}${res.signedUnits} ${sig.unitLabel}`);
    }
  });
}

function archiveSignalRecord(sig, finalStatus, signedUnits) {
  const closedAt = new Date().toISOString();
  const record = {
    ...sig,
    status: finalStatus,
    resultUnits: signedUnits,
    closedAt
  };
  appState.systemHistory.unshift(record);
  if (appState.systemHistory.length > 300) appState.systemHistory.length = 300;

  if (sig.takenByUser) {
    const idx = appState.userJournal.findIndex((j) => j.id === sig.id);
    if (idx >= 0) {
      appState.userJournal[idx] = { ...appState.userJournal[idx], ...record };
    } else {
      appState.userJournal.unshift(record);
    }
  }
}

function forceRescanCurrentSignal() {
  const { pair, tf } = appState.signalConfig;
  lastBannerMessage = '';
  getOrCreateActiveSetup(pair, tf, true, null, 0);
  renderSignalsTab();
  showToast(`🔄 Setup ${pair} (${tf}) diperbarui sesuai struktur terkini.`);
}

/* ==================== TAB 1: BERANDA RENDERER ==================== */
function getActiveAccount() {
  return appState.accounts.find((a) => a.id === appState.activeAccountId) || appState.accounts[0];
}

function renderHomeTab() {
  const kz = getWibContext(appState.filters);
  const wib = getNowWib();
  const dayNames = [
    'Minggu — Market Forex/Index libur; BTC 24/7 aktif.',
    'Senin — Pembentukan Monday Range, tunggu likuiditas sesi.',
    'Selasa — Hari ekspansi tren utama (ICT Optimal Day).',
    'Rabu — Mid-week reversal & ekspansi sesi NY.',
    'Kamis — Peak volatility mingguan & rilis data USD.',
    'Jumat — Penutupan mingguan; amankan profit sebelum 22.00 WIB.',
    'Sabtu — Market Forex/Index libur; BTC 24/7 aktif.'
  ];

  const wbBtn = document.getElementById('weekend-btc-toggle');
  if (wbBtn) {
    wbBtn.textContent = appState.filters.weekendBtc ? '₿ Weekend BTC: ON' : '₿ Weekend BTC: OFF';
  }

  const sBadge = document.getElementById('session-badge-text');
  const sTitle = document.getElementById('session-title');
  const sDesc = document.getElementById('session-desc');
  const dText = document.getElementById('day-behavior-text');

  if (sBadge) {
    sBadge.textContent = kz.isPrime ? 'KILLZONE AKTIF' : 'OBSERVASI';
    sBadge.className = kz.isPrime
      ? 'px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[9.5px] font-extrabold shrink-0'
      : 'px-2.5 py-1 rounded-full bg-blue-600 text-white text-[9.5px] font-extrabold shrink-0';
  }
  if (sTitle) sTitle.textContent = kz.name;
  if (sDesc) {
    sDesc.textContent = kz.isPrime
      ? 'Likuiditas institusi aktif. Prioritaskan setup berkonfluensi tinggi di POI OB/FVG.'
      : appState.filters.sessionFilter
      ? 'Filter Sesi Pagi/Transisi AKTIF. Kamu bisa mematikan filter ini kapan saja lewat tombol Filter di tab Sinyal.'
      : 'Mode Bebas Trade AKTIF (Filter Sesi dimatikan manual). Tetap disiplin gunakan batas lot & SL harian.';
  }
  if (dText) dText.textContent = dayNames[wib.getDay()] || '';

  // Update Custom Account Trigger Button
  const acc = getActiveAccount();
  const accTriggerLabel = document.getElementById('account-trigger-label');
  const accTriggerSub = document.getElementById('account-trigger-sub');
  if (accTriggerLabel) accTriggerLabel.textContent = acc.name;
  if (accTriggerSub) accTriggerSub.textContent = `${acc.firm} • $${Number(acc.equity).toLocaleString('en-US')}`;

  // Counters & Circuit Breaker
  const maxE = acc.maxEntries || 2;
  const maxS = acc.maxSLs || 2;
  const curE = acc.entriesToday || 0;
  const curS = acc.slToday || 0;

  const elMaxE = document.getElementById('max-entry-display');
  const elCurE = document.getElementById('daily-entry-count');
  const elMaxS = document.getElementById('max-sl-display');
  const elCurS = document.getElementById('daily-sl-count');
  if (elMaxE) elMaxE.textContent = maxE;
  if (elCurE) elCurE.textContent = `${curE} / ${maxE}`;
  if (elMaxS) elMaxS.textContent = maxS;
  if (elCurS) elCurS.textContent = `${curS} / ${maxS}`;

  const cbAlert = document.getElementById('circuit-breaker-alert');
  const pfAlert = document.getElementById('profit-lock-alert');
  if (cbAlert) cbAlert.classList.toggle('hidden', curS < maxS);
  if (pfAlert) pfAlert.classList.toggle('hidden', !(acc.equity >= acc.balance * 1.02 && curE > 0));

  // Checklist
  const chkWrap = document.getElementById('checklist-items');
  if (chkWrap) {
    chkWrap.innerHTML = appState.checklist
      .map(
        (item, i) => `
      <div onclick="toggleChecklistItem(${i})" class="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] flex items-center gap-3 cursor-pointer active:scale-[0.99]">
        <div class="w-5 h-5 rounded-full border-2 ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500'} flex items-center justify-center text-[11px] font-extrabold shrink-0">
          ${item.checked ? '✓' : ''}
        </div>
        <span class="text-xs ${item.checked ? 'line-through opacity-60' : 'font-semibold'}">${item.text}</span>
      </div>`
      )
      .join('');
  }
  const doneCount = appState.checklist.filter((c) => c.checked).length;
  const pctBadge = document.getElementById('discipline-pct-badge');
  if (pctBadge) {
    pctBadge.textContent = `${Math.round((doneCount / appState.checklist.length) * 100)}%`;
  }

  // Portfolio Summary & Account List
  let totEq = 0;
  let totBal = 0;
  let totW = 0;
  let totL = 0;

  appState.accounts.forEach((a) => {
    totEq += Number(a.equity) || 0;
    totBal += Number(a.balance) || 0;
    totW += Number(a.wins) || 0;
    totL += Number(a.losses) || 0;
  });

  const netProfit = totEq - totBal;
  const avgWr = totW + totL > 0 ? Math.round((totW / (totW + totL)) * 100) : 0;

  const elTotEq = document.getElementById('portfolio-total-equity');
  const elTotPf = document.getElementById('portfolio-total-profit');
  const elAvgWr = document.getElementById('portfolio-avg-winrate');
  if (elTotEq) elTotEq.textContent = `$${totEq.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (elTotPf) {
    elTotPf.textContent = `${netProfit >= 0 ? '+' : '-'}$${Math.abs(netProfit).toFixed(2)}`;
    elTotPf.className = `font-mono-num text-xs font-extrabold mt-0.5 block ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (elAvgWr) elAvgWr.textContent = `${avgWr}%`;

  const accList = document.getElementById('accounts-list-container');
  if (accList) {
    accList.innerHTML = appState.accounts
      .map((a) => {
        const isSelected = a.id === appState.activeAccountId;
        const pnl = (Number(a.equity) || 0) - (Number(a.balance) || 0);
        const dailyLossGuard = +(Number(a.balance) * 0.04).toFixed(2);
        return `
        <div class="p-3 rounded-2xl ${isSelected ? 'bg-blue-600/20 border-cyan-400/50' : 'bg-white/[0.04] border-white/10'} border space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <strong class="text-xs font-extrabold truncate">${a.name}</strong>
                <span class="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-cyan-300 shrink-0">${a.firm}</span>
              </div>
              <span class="font-mono-num text-[11px] text-slate-300 block mt-0.5">
                Equity: <strong>$${Number(a.equity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                <span class="${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">(${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})</span>
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="openEditBalanceModal('${a.id}')" class="px-2.5 py-1.5 rounded-xl bg-white/10 text-[10px] font-extrabold active:scale-95">Edit $</button>
              <button onclick="selectActiveAccount('${a.id}')" class="px-2.5 py-1.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-blue-600 text-white'} text-[10px] font-extrabold active:scale-95">
                ${isSelected ? 'Aktif' : 'Pilih'}
              </button>
              ${a.isCustom ? `<button onclick="deleteAccount('${a.id}')" class="px-2 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-[10px] font-extrabold">✕</button>` : ''}
            </div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10 font-mono-num">
            <span>Risk: ${a.riskPct}% • Cap: ${a.maxLotCap} lot</span>
            <span>Daily DD Guard: -$${dailyLossGuard}</span>
          </div>
        </div>`;
      })
      .join('');
  }
}

function toggleChecklistItem(idx) {
  if (appState.checklist[idx]) {
    appState.checklist[idx].checked = !appState.checklist[idx].checked;
    saveAppState();
    renderHomeTab();
  }
}

function adjustCounter(type, delta) {
  const acc = getActiveAccount();
  if (type === 'entries') {
    acc.entriesToday = Math.max(0, (acc.entriesToday || 0) + delta);
  } else {
    acc.slToday = Math.max(0, (acc.slToday || 0) + delta);
  }
  saveAppState();
  renderHomeTab();
  if (activeTab === 'signals') renderSignalsTab();
}

function adjustAccountLimit(field, delta) {
  const acc = getActiveAccount();
  acc[field] = Math.max(1, Math.min(10, (acc[field] || 2) + delta));
  saveAppState();
  renderHomeTab();
}

function selectActiveAccount(accId) {
  appState.activeAccountId = accId;
  saveAppState();
  closeAccountDrawer();
  renderHomeTab();
  if (activeTab === 'signals') renderSignalsTab();
  const acc = getActiveAccount();
  showToast(`💼 Akun aktif: ${acc.name} ($${Number(acc.equity).toLocaleString('en-US')})`);
}

function addNewAccount() {
  const name = (document.getElementById('new-acc-name')?.value || '').trim();
  const firm = (document.getElementById('new-acc-firm')?.value || 'Prop Firm').trim();
  const balance = parseFloat(document.getElementById('new-acc-balance')?.value) || 1000;
  const riskPct = parseFloat(document.getElementById('new-acc-risk')?.value) || 0.4;
  const maxLotCap = parseFloat(document.getElementById('new-acc-max-lot')?.value) || +(balance / 10000).toFixed(2);
  const maxEntries = parseInt(document.getElementById('new-acc-max-entry')?.value, 10) || 2;
  const maxSLs = parseInt(document.getElementById('new-acc-max-sl')?.value, 10) || 2;
  const myfxbookId = (document.getElementById('new-acc-myfxbook')?.value || '').trim();

  if (!name) {
    showToast('⚠️ Isi nama akun terlebih dahulu.');
    return;
  }

  const newAcc = {
    id: `acc-${Date.now()}`,
    name,
    firm,
    balance,
    equity: balance,
    riskPct,
    maxLotCap,
    maxEntries,
    maxSLs,
    myfxbookId,
    entriesToday: 0,
    slToday: 0,
    wins: 0,
    losses: 0,
    isCustom: true
  };

  appState.accounts.push(newAcc);
  appState.activeAccountId = newAcc.id;
  saveAppState();
  renderHomeTab();
  showToast(`✅ Akun "${name}" berhasil ditambahkan!`);
}

function deleteAccount(accId) {
  if (appState.accounts.length <= 1) return;
  appState.accounts = appState.accounts.filter((a) => a.id !== accId);
  if (appState.activeAccountId === accId) {
    appState.activeAccountId = appState.accounts[0].id;
  }
  saveAppState();
  renderHomeTab();
  showToast('🗑️ Akun dihapus.');
}

function openEditBalanceModal(accId) {
  editingAccountId = accId;
  const acc = appState.accounts.find((a) => a.id === accId);
  if (!acc) return;
  document.getElementById('edit-balance-acc-name').textContent = `${acc.name} (${acc.firm})`;
  document.getElementById('edit-balance-input').value = acc.balance;
  document.getElementById('edit-equity-input').value = acc.equity;
  document.getElementById('edit-lotcap-input').value = acc.maxLotCap;
  document.getElementById('edit-balance-modal').classList.remove('hidden');
}

function closeEditBalanceModal() {
  document.getElementById('edit-balance-modal').classList.add('hidden');
}

function saveEditedAccountBalance() {
  const acc = appState.accounts.find((a) => a.id === editingAccountId);
  if (!acc) return;
  acc.balance = Math.max(10, parseFloat(document.getElementById('edit-balance-input').value) || acc.balance);
  acc.equity = Math.max(10, parseFloat(document.getElementById('edit-equity-input').value) || acc.equity);
  acc.maxLotCap = Math.max(0.01, parseFloat(document.getElementById('edit-lotcap-input').value) || acc.maxLotCap);
  saveAppState();
  closeEditBalanceModal();
  renderHomeTab();
  if (activeTab === 'signals') renderSignalsTab();
  showToast(`✅ Saldo & Lot Cap ${acc.name} diperbarui.`);
}

/* ==================== CUSTOM BOTTOM-SHEET DRAWERS ==================== */
function openAccountDrawer() {
  const list = document.getElementById('account-drawer-list');
  if (list) {
    list.innerHTML = appState.accounts
      .map((a) => {
        const active = a.id === appState.activeAccountId;
        const pnl = (Number(a.equity) || 0) - (Number(a.balance) || 0);
        return `
        <button onclick="selectActiveAccount('${a.id}')" class="w-full p-3.5 rounded-2xl border ${active ? 'bg-blue-600/20 border-cyan-400' : 'bg-white/[0.04] border-white/10'} flex items-center justify-between gap-3 text-left active:scale-[0.99] transition">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl ${active ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-cyan-400'} flex items-center justify-center font-display font-extrabold text-sm shrink-0">
              ${a.firm.slice(0, 2).toUpperCase()}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <strong class="text-xs font-extrabold truncate">${a.name}</strong>
                <span class="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-slate-300">${a.firm}</span>
              </div>
              <span class="font-mono-num text-[11px] text-slate-300 block mt-0.5">
                $${Number(a.equity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span class="${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">(${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})</span>
              </span>
            </div>
          </div>
          <span class="w-5 h-5 rounded-full border-2 ${active ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'} flex items-center justify-center text-[10px] text-slate-950 font-extrabold shrink-0">
            ${active ? '✓' : ''}
          </span>
        </button>`;
      })
      .join('');
  }
  document.getElementById('account-drawer-modal').classList.remove('hidden');
}

function closeAccountDrawer() {
  document.getElementById('account-drawer-modal').classList.add('hidden');
}

function openChartPairDrawer() {
  const list = document.getElementById('chart-pair-drawer-list');
  const currentPair = appState.signalConfig.pair || 'XAUUSD';
  if (list) {
    list.innerHTML = Object.values(LIAMV_PAIRS)
      .map((p) => {
        const active = p.id === currentPair;
        const price = getEffectivePrice(p.id);
        return `
        <button onclick="selectChartPairFromDrawer('${p.id}')" class="w-full p-3.5 rounded-2xl border ${active ? 'bg-blue-600/20 border-cyan-400' : 'bg-white/[0.04] border-white/10'} flex items-center justify-between gap-3 text-left active:scale-[0.99] transition">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl ${active ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-white'} flex items-center justify-center text-lg shrink-0">
              ${p.icon}
            </div>
            <div class="min-w-0">
              <strong class="text-xs font-extrabold block">${p.fullName}</strong>
              <span class="font-mono-num text-[11px] text-cyan-300 block mt-0.5">Live: ${price.toFixed(p.decimals)} • ${p.tvSymbol}</span>
            </div>
          </div>
          <span class="w-5 h-5 rounded-full border-2 ${active ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'} flex items-center justify-center text-[10px] text-slate-950 font-extrabold shrink-0">
            ${active ? '✓' : ''}
          </span>
        </button>`;
      })
      .join('');
  }
  document.getElementById('chart-pair-drawer-modal').classList.remove('hidden');
}

function closeChartPairDrawer() {
  document.getElementById('chart-pair-drawer-modal').classList.add('hidden');
}

function selectChartPairFromDrawer(pairId) {
  appState.signalConfig.pair = pairId;
  saveAppState();
  closeChartPairDrawer();
  updateHeaderLiveTicker();
  renderChartTab();
}

function openMethodDrawer() {
  const list = document.getElementById('method-drawer-list');
  const current = appState.signalConfig.method || 'AUTO';
  if (list) {
    list.innerHTML = LIAMV_METHODS.map((m) => {
      const active = m.id === current;
      return `
      <button onclick="selectSignalMethod('${m.id}')" class="w-full p-3.5 rounded-2xl border ${active ? 'bg-blue-600/20 border-cyan-400' : 'bg-white/[0.04] border-white/10'} text-left space-y-1 active:scale-[0.99] transition">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono-num text-[9.5px] font-extrabold">${m.code}</span>
            <strong class="text-xs font-extrabold">${m.shortName}</strong>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[9px] font-extrabold">${m.badge}</span>
        </div>
        <p class="text-[11px] text-slate-300 leading-relaxed">${m.desc}</p>
        <span class="text-[9.5px] text-slate-400 block">⏰ Cocok: ${m.sessionFit}</span>
      </button>`;
    }).join('');
  }
  document.getElementById('method-drawer-modal').classList.remove('hidden');
}

function closeMethodDrawer() {
  document.getElementById('method-drawer-modal').classList.add('hidden');
}

function selectSignalMethod(methodId) {
  appState.signalConfig.method = methodId;
  saveAppState();
  closeMethodDrawer();
  forceRescanCurrentSignal();
}

/* ==================== FILTER CONTROL DRAWER (POINT #3) ==================== */
function openFilterDrawer() {
  renderFilterDrawerList();
  document.getElementById('filter-drawer-modal').classList.remove('hidden');
}

function closeFilterDrawer() {
  document.getElementById('filter-drawer-modal').classList.add('hidden');
}

function toggleSignalFilter(key) {
  appState.filters[key] = !appState.filters[key];
  saveAppState();
  renderFilterDrawerList();
  updateHeaderLiveTicker();
  if (activeTab === 'home') renderHomeTab();
  if (activeTab === 'signals') renderSignalsTab();
  if (activeTab === 'profile') renderProfileTab();
}

function toggleWeekendBtcMode() {
  toggleSignalFilter('weekendBtc');
  showToast(appState.filters.weekendBtc ? '₿ Mode Weekend BTC: AKTIF' : '₿ Mode Weekend BTC: NONAKTIF');
}

function renderFilterDrawerList() {
  const wrap = document.getElementById('filter-drawer-list');
  if (!wrap) return;
  const f = appState.filters;
  const items = [
    {
      key: 'engineEnabled',
      title: 'Mesin Sinyal Utama (Master Switch)',
      desc: 'Aktifkan atau jeda seluruh pemindaian & eksekusi sinyal kapan saja sesuai kontrol kamu.',
      active: f.engineEnabled
    },
    {
      key: 'mondayFilter',
      title: 'Monday Range Filter (Hari Senin)',
      desc: 'Jika ON: memberi peringatan & penalti skor pada hari Senin sebelum sapuan likuiditas sesi London. Matikan jika ingin trade normal di hari Senin.',
      active: f.mondayFilter
    },
    {
      key: 'sessionFilter',
      title: 'Filter Jam Sesi Pagi / Asia (07–14 WIB)',
      desc: 'Jika ON: menandai sesi pagi/Asia sebagai fase ranging. Matikan jika kamu melihat peluang & ingin bebas trade pagi.',
      active: f.sessionFilter
    },
    {
      key: 'newsShield',
      title: 'High-Impact News Shield (±15 Menit)',
      desc: 'Membatasi entry baru saat rilis berita merah USD (CPI, NFP, FOMC) berlangsung.',
      active: f.newsShield
    },
    {
      key: 'slCooldown',
      title: 'Anti-Revenge Cooldown 30 Menit (Pasca SL)',
      desc: 'Mengunci tombol Ambil Setup selama 30 menit setelah terkena SL pada pair tersebut.',
      active: f.slCooldown
    },
    {
      key: 'weekendBtc',
      title: 'Weekend Crypto Window (BTC 24/7)',
      desc: 'Mengizinkan eksekusi sinyal BTCUSDT saat hari Sabtu & Minggu.',
      active: f.weekendBtc
    }
  ];

  wrap.innerHTML = items
    .map(
      (it) => `
    <div onclick="toggleSignalFilter('${it.key}')" class="p-3.5 rounded-2xl border ${it.active ? 'bg-blue-600/15 border-cyan-400/50' : 'bg-white/[0.03] border-white/10'} flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition">
      <div class="space-y-0.5">
        <strong class="text-xs font-extrabold block">${it.title}</strong>
        <p class="text-[11px] text-slate-300 leading-relaxed">${it.desc}</p>
      </div>
      <span class="px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${it.active ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-400'}">
        ${it.active ? 'ON' : 'OFF'}
      </span>
    </div>`
    )
    .join('');
}

/* ==================== TAB 3: SNIPER SIGNALS RENDERER ==================== */
function setSignalPair(pairId) {
  appState.signalConfig.pair = pairId;
  saveAppState();
  updateHeaderLiveTicker();
  renderSignalsTab();
}

function setSignalTF(tf) {
  appState.signalConfig.tf = tf;
  saveAppState();
  renderSignalsTab();
}

function toggleAutoNotif() {
  appState.signalConfig.autoNotif = !appState.signalConfig.autoNotif;
  saveAppState();
  renderSignalsTab();
  showToast(appState.signalConfig.autoNotif ? '🔔 Smart Alert diaktifkan.' : '🔕 Smart Alert dimatikan.');
}

function renderSignalsTab() {
  const { pair, tf, method, autoNotif } = appState.signalConfig;
  const cfg = LIAMV_PAIRS[pair] || LIAMV_PAIRS.XAUUSD;
  const acc = getActiveAccount();

  // Pair buttons with professional icons
  Object.values(LIAMV_PAIRS).forEach((p) => {
    const btn = document.getElementById(`pair-btn-${p.id}`);
    if (!btn) return;
    const isSel = p.id === pair;
    btn.className = isSel
      ? 'py-2 px-1.5 rounded-xl bg-blue-600 text-white border border-cyan-400/60 text-[10.5px] font-extrabold flex items-center justify-center gap-1 shadow-md shadow-blue-600/25 transition'
      : 'py-2 px-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] text-[10.5px] font-extrabold flex items-center justify-center gap-1 opacity-80 transition';
    btn.innerHTML = `<span>${p.icon}</span><span>${p.id === 'BTCUSDT' ? 'BTC' : p.id}</span>`;
  });

  // TF buttons
  ['M5', 'M15', 'H1', 'H4'].forEach((t) => {
    const btn = document.getElementById(`tf-btn-${t}`);
    if (!btn) return;
    btn.className =
      t === tf
        ? 'py-2 rounded-xl bg-blue-600 text-white border border-cyan-400/50 font-mono-num text-[11px] font-extrabold'
        : 'py-2 rounded-xl border border-[var(--border-subtle)] font-mono-num text-[11px] font-extrabold opacity-75';
  });

  // Method trigger
  const mObj = LIAMV_METHODS.find((m) => m.id === method) || LIAMV_METHODS[0];
  const mBadge = document.getElementById('method-trigger-badge');
  const mLabel = document.getElementById('method-trigger-label');
  if (mBadge) mBadge.textContent = mObj.code;
  if (mLabel) mLabel.textContent = mObj.shortName;

  // Smart Alert badge
  const notifBadge = document.getElementById('auto-notif-badge');
  if (notifBadge) notifBadge.textContent = autoNotif ? 'ALERT: ON' : 'ALERT: OFF';

  // Active Filter Quick Pills
  const filterBar = document.getElementById('active-filters-strip');
  if (filterBar) {
    const f = appState.filters;
    filterBar.innerHTML = `
      <button onclick="toggleSignalFilter('engineEnabled')" class="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold ${f.engineEnabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}">
        ${f.engineEnabled ? '● Sinyal: ON' : '⏸ Sinyal: OFF'}
      </button>
      <button onclick="toggleSignalFilter('mondayFilter')" class="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold ${f.mondayFilter ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-white/10 opacity-60'}">
        Monday: ${f.mondayFilter ? 'ON' : 'OFF'}
      </button>
      <button onclick="toggleSignalFilter('sessionFilter')" class="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold ${f.sessionFilter ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-white/10 opacity-60'}">
        Filter Pagi: ${f.sessionFilter ? 'ON' : 'OFF'}
      </button>
    `;
  }

  // Flip / Invalidated Banner
  const flipBanner = document.getElementById('flip-reason-banner');
  if (flipBanner) {
    if (lastBannerMessage) {
      flipBanner.classList.remove('hidden');
      flipBanner.className = 'p-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-semibold flex items-start justify-between gap-2';
      flipBanner.innerHTML = `<span>⚡ ${lastBannerMessage}</span><button onclick="lastBannerMessage=''; renderSignalsTab();" class="text-xs font-extrabold">✕</button>`;
    } else {
      flipBanner.classList.add('hidden');
    }
  }

  // Get or build active setup
  const sig = getOrCreateActiveSetup(pair, tf, false);
  const livePrice = getEffectivePrice(pair);
  const d = cfg.decimals;
  const lotInfo = calculateSafeLotDetails(pair, sig.slUnits, acc);
  const confMeta = getConfidenceMeta(sig.confidence);

  // Full Un-Truncated Timing String
  const nowMs = Date.now();
  const createdMs = new Date(sig.createdAt).getTime();
  const expiresMs = new Date(sig.expiresAt).getTime();
  const elapsedStr = formatDurationHuman(nowMs - createdMs);
  const remainStr = formatDurationHuman(expiresMs - nowMs);
  const expWibStr = formatIsoToWibTime(sig.expiresAt);

  const timingLine =
    sig.status === 'RUNNING'
      ? `⚡ RUNNING • Berjalan ${formatDurationHuman(nowMs - new Date(sig.filledAt || sig.createdAt).getTime())} (Fill ${formatIsoToWibTime(sig.filledAt || sig.createdAt)})`
      : `⏳ Menunggu Limit • Sisa ${remainStr} (Exp ${expWibStr}) • Berjalan ${elapsedStr}`;

  // Guards & Lock Checks
  const wib = getNowWib();
  const isWeekend = wib.getDay() === 0 || wib.getDay() === 6;
  const weekendLocked = isWeekend && !cfg.weekendActive && !(pair === 'BTCUSDT' && appState.filters.weekendBtc);
  const slLimitLocked = (acc.slToday || 0) >= (acc.maxSLs || 2);
  const cooldownEnd = appState.cooldownUntil[pair] || 0;
  const inCooldown = appState.filters.slCooldown && cooldownEnd > nowMs;
  const enginePaused = !appState.filters.engineEnabled;

  let lockReason = '';
  if (enginePaused) lockReason = '⏸ Mesin Sinyal sedang dinonaktifkan manual (Aktifkan di tombol Filter).';
  else if (weekendLocked) lockReason = '🔒 Market Forex/Index tutup akhir pekan (Gunakan BTCUSDT 24/7).';
  else if (slLimitLocked) lockReason = `🛑 Circuit Breaker SL Harian (${acc.slToday}/${acc.maxSLs}) tercapai.`;
  else if (inCooldown) lockReason = `⏳ Cooldown pasca SL aktif (${formatDurationHuman(cooldownEnd - nowMs)} tersisa).`;

  const estSlUsd = +(lotInfo.lot * sig.slUnits * cfg.usdPerUnitPerLot).toFixed(2);
  const estTp2Usd = +(lotInfo.lot * sig.tp2Units * cfg.usdPerUnitPerLot).toFixed(2);
  const rrRatio = (sig.tp2Units / Math.max(1, sig.slUnits)).toFixed(1);
  const isBuy = sig.side === 'BUY';

  const cardWrap = document.getElementById('sniper-live-card');
  if (cardWrap) {
    cardWrap.innerHTML = `
    <div class="glass-card p-4 space-y-3 border ${isBuy ? 'border-emerald-500/35' : 'border-rose-500/35'}">
      <!-- Top Row: Direction + Pair + Live Price -->
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 rounded-lg ${isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'} font-display text-xs font-extrabold">
              ${sig.side}
            </span>
            <strong class="font-display text-lg font-extrabold">${cfg.icon} ${pair}</strong>
            <span class="font-mono-num text-xs opacity-75">(${tf})</span>
            <span class="font-mono-num px-2 py-0.5 rounded-md ${confMeta.badgeClass} text-[10.5px] font-extrabold">${sig.confidence}%</span>
          </div>
          <p class="font-mono-num text-[10.5px] text-cyan-300 leading-snug">${timingLine}</p>
        </div>

        <div class="text-right shrink-0">
          <span class="font-mono-num text-lg font-extrabold block">${livePrice.toFixed(d)}</span>
          <span class="px-2 py-0.5 rounded-full ${sig.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/15 text-amber-400'} text-[9px] font-extrabold inline-block mt-0.5">
            ${sig.status === 'RUNNING' ? '⚡ RUNNING' : '⏳ WAITING LIMIT'}
          </span>
        </div>
      </div>

      <!-- Optional Monday Warning (Only shown if Monday Filter is ON) -->
      ${
        sig.isMondayWarning && appState.filters.mondayFilter
          ? `<div class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-semibold flex items-center justify-between gap-2">
              <span>⚠️ MONDAY RANGE FILTER: Tunggu sapuan likuiditas awal sesi London (14.00 WIB).</span>
              <button onclick="toggleSignalFilter('mondayFilter')" class="px-2 py-1 rounded-lg bg-amber-500/25 text-[9.5px] font-extrabold shrink-0">Matikan</button>
            </div>`
          : ''
      }

      <!-- Method & Rescan -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <span class="font-bold opacity-90">${sig.methodLabel} • <span class="font-mono-num">R:R 1:${rrRatio}</span></span>
        <button onclick="forceRescanCurrentSignal()" class="px-3 py-1.5 rounded-xl bg-white/10 text-[11px] font-extrabold active:scale-95">
          ↻ Scan Baru
        </button>
      </div>

      <!-- LIMIT ORDER BOX -->
      <div class="p-3.5 rounded-2xl ${isBuy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} border flex items-center justify-between gap-2">
        <div>
          <span class="text-[9.5px] font-extrabold uppercase ${isBuy ? 'text-emerald-400' : 'text-rose-400'} block">
            🎯 PASANG ${sig.direction} (SWEET-SPOT)
          </span>
          <strong class="font-mono-num text-2xl font-extrabold block mt-0.5">${Number(sig.limitPrice).toFixed(d)}</strong>
          <span class="font-mono-num text-[10px] opacity-70">Zona POI: ${Number(sig.entryMin).toFixed(d)} – ${Number(sig.entryMax).toFixed(d)}</span>
        </div>
        <button onclick="copyTextValue('${Number(sig.limitPrice).toFixed(d)}', 'Harga Limit')" class="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-extrabold text-xs shadow active:scale-95 shrink-0">
          Copy
        </button>
      </div>

      <!-- STOP LOSS BOX -->
      <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-2">
        <div>
          <span class="text-[9.5px] font-extrabold uppercase text-rose-400 block">
            STOP LOSS (-${sig.slUnits} ${sig.unitLabel} • -$${estSlUsd})
          </span>
          <strong class="font-mono-num text-lg font-extrabold text-rose-400">${Number(sig.sl).toFixed(d)}</strong>
        </div>
        <button onclick="copyTextValue('${Number(sig.sl).toFixed(d)}', 'Stop Loss')" class="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-extrabold active:scale-95">
          Copy SL
        </button>
      </div>

      <!-- TP 1, TP 2, TP 3 -->
      <div class="space-y-2">
        <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
          <div>
            <span class="text-[9.5px] font-extrabold text-emerald-400 block">TP 1 (50% • Set BE) • +${sig.tp1Units} ${sig.unitLabel}</span>
            <strong class="font-mono-num text-base font-extrabold">${Number(sig.tp1).toFixed(d)}</strong>
          </div>
          <button onclick="copyTextValue('${Number(sig.tp1).toFixed(d)}', 'TP 1')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-extrabold active:scale-95">
            Copy TP1
          </button>
        </div>

        <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
          <div>
            <span class="text-[9.5px] font-extrabold text-emerald-400 block">TP 2 (30% • Trail TP1) • +${sig.tp2Units} ${sig.unitLabel} (+$${estTp2Usd})</span>
            <strong class="font-mono-num text-base font-extrabold">${Number(sig.tp2).toFixed(d)}</strong>
          </div>
          <button onclick="copyTextValue('${Number(sig.tp2).toFixed(d)}', 'TP 2')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-extrabold active:scale-95">
            Copy TP2
          </button>
        </div>

        <div class="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between gap-2">
          <div>
            <span class="text-[9.5px] font-extrabold text-cyan-400 block">TP 3 (20% • Runner Target) • +${sig.tp3Units} ${sig.unitLabel}</span>
            <strong class="font-mono-num text-base font-extrabold">${Number(sig.tp3).toFixed(d)}</strong>
          </div>
          <button onclick="copyTextValue('${Number(sig.tp3).toFixed(d)}', 'TP 3')" class="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-extrabold active:scale-95">
            Copy TP3
          </button>
        </div>
      </div>

      <!-- Structure Note -->
      <div class="p-2.5 rounded-xl bg-black/20 text-[11px] opacity-85 leading-relaxed">
        📐 <strong>Konfirmasi Struktur:</strong> ${sig.structure}
      </div>

      <!-- Primary Execution Action Button -->
      ${
        lockReason
          ? `<div class="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-bold text-center">${lockReason}</div>`
          : `<button onclick="takeCurrentSetupToJournal()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-display text-sm font-extrabold shadow-lg shadow-blue-600/30 active:scale-[0.99] transition">
              ${sig.takenByUser ? '✅ Sudah Dicatat di Jurnal Saya' : `⚡ Ambil Setup (${acc.name} • ${lotInfo.lot.toFixed(2)} lot)`}
            </button>`
      }
    </div>`;
  }

  renderHistoryAndPerformance();
}

function takeCurrentSetupToJournal() {
  const { pair, tf } = appState.signalConfig;
  const sig = getOrCreateActiveSetup(pair, tf, false);
  const acc = getActiveAccount();

  if (sig.takenByUser) {
    showToast('ℹ️ Setup ini sudah masuk ke Jurnal Saya.');
    return;
  }

  sig.takenByUser = true;
  acc.entriesToday = (acc.entriesToday || 0) + 1;

  const exists = appState.userJournal.some((j) => j.id === sig.id);
  if (!exists) {
    appState.userJournal.unshift({
      ...sig,
      accountName: acc.name,
      takenAt: new Date().toISOString()
    });
  }

  saveAppState();
  renderSignalsTab();
  showToast(`✅ Setup ${pair} dicatat ke Jurnal Saya (${acc.entriesToday}/${acc.maxEntries} entry hari ini).`);
}

/* ==================== PERFORMANCE & HISTORY FEED ==================== */
function setHistoryPeriod(p) {
  appState.historyView.period = p;
  saveAppState();
  renderHistoryAndPerformance();
}

function setHistoryFeedMode(mode) {
  appState.historyView.feedMode = mode;
  saveAppState();
  renderHistoryAndPerformance();
}

function setHistoryStatusFilter(st) {
  appState.historyView.statusFilter = st;
  saveAppState();
  renderHistoryAndPerformance();
}

function setHistoryPairFilter(pr) {
  appState.historyView.pairFilter = pr;
  saveAppState();
  renderHistoryAndPerformance();
}

function filterRecordsByPeriod(list, period) {
  if (period === 'ALL') return list;
  const now = Date.now();
  const dayMs = 86400000;
  const cutoff =
    period === 'TODAY'
      ? now - dayMs
      : period === 'WEEK'
      ? now - 7 * dayMs
      : period === 'MONTH'
      ? now - 30 * dayMs
      : now - 365 * dayMs;
  return list.filter((item) => new Date(item.closedAt || item.createdAt).getTime() >= cutoff);
}

function renderHistoryAndPerformance() {
  const { period, feedMode, statusFilter, pairFilter } = appState.historyView;

  ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].forEach((p) => {
    const b = document.getElementById(`period-btn-${p}`);
    if (b) b.className = p === period ? 'py-1.5 rounded-lg bg-blue-600 text-white' : 'py-1.5 rounded-lg bg-white/5 opacity-70';
  });

  const tabSys = document.getElementById('feed-tab-SYSTEM');
  const tabJrn = document.getElementById('feed-tab-JOURNAL');
  if (tabSys) tabSys.className = feedMode === 'SYSTEM' ? 'py-2 rounded-xl bg-blue-600 text-white transition' : 'py-2 rounded-xl opacity-75 transition';
  if (tabJrn) tabJrn.className = feedMode === 'JOURNAL' ? 'py-2 rounded-xl bg-blue-600 text-white transition flex items-center justify-center gap-1.5' : 'py-2 rounded-xl opacity-75 transition flex items-center justify-center gap-1.5';

  const jBadge = document.getElementById('journal-count-badge');
  if (jBadge) jBadge.textContent = appState.userJournal.length;

  ['ALL', 'DECIDED', 'CANCELLED'].forEach((s) => {
    const b = document.getElementById(`status-filter-${s}`);
    if (b) b.className = s === statusFilter ? 'px-2.5 py-1 rounded-lg bg-blue-600 text-white' : 'px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] opacity-75';
  });

  ['ALL', 'XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((pr) => {
    const b = document.getElementById(`pair-filter-${pr}`);
    if (b) b.className = pr === pairFilter ? 'py-1 rounded-lg bg-blue-600 text-white' : 'py-1 rounded-lg border border-[var(--border-subtle)] opacity-75';
  });

  const sourceList = feedMode === 'JOURNAL' ? appState.userJournal : appState.systemHistory;
  let filtered = filterRecordsByPeriod(sourceList, period);
  if (pairFilter !== 'ALL') filtered = filtered.filter((i) => i.pair === pairFilter);
  if (statusFilter === 'DECIDED') {
    filtered = filtered.filter((i) => String(i.status).startsWith('TP') || i.status === 'SL HIT' || i.status === 'BREAK EVEN');
  } else if (statusFilter === 'CANCELLED') {
    filtered = filtered.filter((i) => i.status === 'INVALIDATED' || i.status === 'MISSED / FLIPPED');
  }

  let tpCount = 0;
  let slCount = 0;
  let beCount = 0;
  let posPips = 0;
  let negPips = 0;

  filtered.forEach((item) => {
    const u = Number(item.resultUnits) || 0;
    if (String(item.status).startsWith('TP')) {
      tpCount++;
      posPips += Math.max(0, u);
    } else if (item.status === 'SL HIT') {
      slCount++;
      negPips += Math.abs(u);
    } else if (item.status === 'BREAK EVEN') {
      beCount++;
    }
  });

  const decided = tpCount + slCount;
  const winrate = decided > 0 ? Math.round((tpCount / decided) * 100) : 0;
  const netPips = posPips - negPips;
  const pf = negPips > 0 ? (posPips / negPips).toFixed(2) : posPips > 0 ? '∞' : '0.00';

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt('stat-total-signals', `${filtered.length} SINYAL`);
  setTxt('stat-tp-count', tpCount);
  setTxt('stat-sl-count', slCount);
  setTxt('stat-be-count', beCount);
  setTxt('stat-winrate', `${winrate}%`);
  setTxt('stat-pos-pips', `+${posPips}`);
  setTxt('stat-neg-pips', `-${negPips}`);
  setTxt('stat-net-pips', `${netPips >= 0 ? '+' : ''}${netPips}`);
  setTxt('stat-profit-factor', `${pf}x`);

  const edgeEl = document.getElementById('edge-finder-banner');
  if (edgeEl) {
    edgeEl.textContent =
      decided === 0
        ? '📊 Belum ada transaksi selesai pada periode ini. Sinyal yang tersentuh Limit & menyentuh TP/SL akan otomatis tercatat di sini.'
        : `💡 Edge Insight: Winrate murni ${winrate}% (${tpCount}W / ${slCount}L / ${beCount}BE) dengan Net ${netPips >= 0 ? '+' : ''}${netPips} pips/pts.`;
  }

  const feedContainer = document.getElementById('history-feed-container');
  if (feedContainer) {
    if (!filtered.length) {
      feedContainer.innerHTML = `<div class="glass-card p-4 text-center text-xs opacity-70">Belum ada riwayat sinyal pada filter ini.</div>`;
    } else {
      feedContainer.innerHTML = filtered
        .slice(0, 40)
        .map((item) => {
          const edu = explainSignalEducation(item);
          const isWin = String(item.status).startsWith('TP');
          const isLoss = item.status === 'SL HIT';
          const badgeCls = isWin
            ? 'bg-emerald-500/20 text-emerald-400'
            : isLoss
            ? 'bg-rose-500/20 text-rose-400'
            : 'bg-slate-500/20 text-slate-300';
          return `
          <div class="glass-card p-3.5 space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <strong class="font-display font-extrabold">${item.pair} (${item.tf})</strong>
                <span class="text-[10px] opacity-75">${item.direction}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full ${badgeCls} font-mono-num text-[10px] font-extrabold">
                ${item.status} (${item.resultUnits > 0 ? '+' : ''}${item.resultUnits || 0})
              </span>
            </div>
            <p class="font-mono-num text-[10.5px] opacity-75">${edu.riskSummary}</p>
            <p class="text-[11px] opacity-85 leading-relaxed">${edu.outcomeInsight}</p>
          </div>`;
        })
        .join('');
    }
  }

  // Standard SMC Output Text
  const { pair, tf } = appState.signalConfig;
  const activeSig = getOrCreateActiveSetup(pair, tf, false);
  const acc = getActiveAccount();
  const lotInfo = calculateSafeLotDetails(pair, activeSig.slUnits, acc);
  const pre = document.getElementById('smc-standard-output');
  if (pre) pre.textContent = formatStandardSmcSignal(activeSig, lotInfo.lot, acc.name);
}

function copyStandardOutput() {
  const text = document.getElementById('smc-standard-output')?.textContent || '';
  copyTextValue(text, 'Format Sinyal ICT/SMC');
}

function copyDailyRecapSummary() {
  const tp = document.getElementById('stat-tp-count')?.textContent || '0';
  const sl = document.getElementById('stat-sl-count')?.textContent || '0';
  const wr = document.getElementById('stat-winrate')?.textContent || '0%';
  const net = document.getElementById('stat-net-pips')?.textContent || '0';
  copyTextValue(`📊 Rekap Liamvtrade: TP ${tp} | SL ${sl} | Winrate ${wr} | Net ${net} pips`, 'Rekap Performa');
}

function clearSystemHistory() {
  appState.systemHistory = [];
  saveAppState();
  renderHistoryAndPerformance();
  showToast('🗑️ Log riwayat sistem dibersihkan.');
}

function exportUserJournalCsv() {
  const rows = [['ID', 'Waktu', 'Pair', 'TF', 'Arah', 'Limit', 'SL', 'TP1', 'TP2', 'Status', 'ResultUnits']];
  appState.userJournal.forEach((j) => {
    rows.push([j.id, j.createdAt, j.pair, j.tf, j.direction, j.limitPrice, j.sl, j.tp1, j.tp2, j.status, j.resultUnits || 0]);
  });
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `liamvtrade-journal-${getWibDateStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 File Excel/CSV Jurnal berhasil diunduh.');
}

/* ==================== TAB 4: CHART & RADAR ==================== */
function renderChartTab() {
  const pair = appState.signalConfig.pair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pair] || LIAMV_PAIRS.XAUUSD;
  const price = getEffectivePrice(pair);

  const trigIcon = document.getElementById('chart-pair-trigger-icon');
  const trigLabel = document.getElementById('chart-pair-trigger-label');
  const trigSub = document.getElementById('chart-pair-trigger-sub');
  if (trigIcon) trigIcon.textContent = cfg.icon;
  if (trigLabel) trigLabel.textContent = cfg.fullName;
  if (trigSub) trigSub.textContent = `${cfg.tvSymbol} • Live: ${price.toFixed(cfg.decimals)}`;

  renderTradingViewChart();
  updateChartRadarBox();
}

function renderTradingViewChart() {
  const pair = appState.signalConfig.pair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pair] || LIAMV_PAIRS.XAUUSD;
  const theme = appState.theme === 'light' ? 'light' : 'dark';
  const wrapper = document.getElementById('tv-chart-wrapper');
  if (!wrapper) return;

  const tvUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(cfg.tvSymbol)}&interval=15&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=${theme}&style=1&timezone=Asia%2FJakarta&withdateranges=1&hideideas=1`;
  wrapper.innerHTML = `<iframe src="${tvUrl}" class="w-full h-full border-0" allowtransparency="true" scrolling="no"></iframe>`;
}

function updateChartRadarBox() {
  const pair = appState.signalConfig.pair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const rng = appState.marketRanges[pair] || { high: 0, low: 0 };
  const span = Math.max(0, rng.high - rng.low);

  const modeEl = document.getElementById('scanner-engine-mode');
  const hiEl = document.getElementById('radar-asia-high');
  const loEl = document.getElementById('radar-asia-low');
  const rgEl = document.getElementById('radar-day-range');

  if (modeEl) modeEl.textContent = `${pair} • ${priceSourceLabel}`;
  if (hiEl) hiEl.textContent = Number(rng.high).toFixed(d);
  if (loEl) loEl.textContent = Number(rng.low).toFixed(d);
  if (rgEl) rgEl.textContent = span.toFixed(d);
}

function runManualScan() {
  fetchLiveMarketPrices(true);
}

/* ==================== TAB 2: NEWS & BREAKING WIRE ==================== */
function filterNews(level) {
  appState.newsFilter = level;
  saveAppState();
  renderNewsTab();
}

function renderNewsTab() {
  ['ALL', 'HIGH', 'MED'].forEach((lvl) => {
    const btn = document.getElementById(`news-filter-${lvl}`);
    if (!btn) return;
    btn.className =
      lvl === appState.newsFilter
        ? 'news-filter-btn py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold'
        : 'news-filter-btn py-2 rounded-xl glass-card text-xs font-extrabold';
  });

  if (typeof renderEconomicNews === 'function') {
    renderEconomicNews();
  }
}

/* ==================== MODALS: LOT CALCULATOR & BROKER OFFSET ==================== */
function openLotCalcModal() {
  const sel = document.getElementById('lot-calc-pair');
  if (sel) sel.value = appState.signalConfig.pair || 'XAUUSD';
  recalcManualLot();
  document.getElementById('lot-calc-modal').classList.remove('hidden');
}

function closeLotCalcModal() {
  document.getElementById('lot-calc-modal').classList.add('hidden');
}

function recalcManualLot() {
  const pair = document.getElementById('lot-calc-pair')?.value || 'XAUUSD';
  const slUnits = parseFloat(document.getElementById('lot-calc-sl')?.value) || 25;
  const acc = getActiveAccount();
  const info = calculateSafeLotDetails(pair, slUnits, acc, slUnits);
  const resBox = document.getElementById('lot-calc-result');
  if (resBox) {
    resBox.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs opacity-80">Lot Rekomendasi (${acc.name}):</span>
        <strong class="font-mono-num text-xl font-extrabold text-cyan-400">${info.lot.toFixed(2)} lot</strong>
      </div>
      <div class="text-[11px] opacity-75 mt-1 font-mono-num">
        Risiko Riil: -$${info.actualRiskUsd} (${info.effectiveRiskPct}%) • Max Cap: ${acc.maxLotCap} lot
      </div>`;
  }
}

function applyBrokerPriceCalibration() {
  const pair = document.getElementById('lot-calc-pair')?.value || appState.signalConfig.pair;
  const brokerPrice = parseFloat(document.getElementById('broker-calibrate-price')?.value);
  if (!brokerPrice || brokerPrice <= 0) {
    showToast('⚠️ Masukkan harga MT5/cTrader yang valid.');
    return;
  }
  const base = Number(appState.livePrices[pair]) || brokerPrice;
  appState.priceOffsets[pair] = +(brokerPrice - base).toFixed(5);
  saveAppState();
  updateHeaderLiveTicker();
  if (activeTab === 'signals') renderSignalsTab();
  showToast(`🎯 Harga ${pair} dikalibrasi ke ${brokerPrice}`);
}

function resetBrokerPriceCalibration() {
  const pair = document.getElementById('lot-calc-pair')?.value || appState.signalConfig.pair;
  appState.priceOffsets[pair] = 0;
  saveAppState();
  updateHeaderLiveTicker();
  if (activeTab === 'signals') renderSignalsTab();
  showToast(`↺ Offset kalibrasi ${pair} direset ke 0.`);
}

function openQuickGuideModal() {
  document.getElementById('quick-guide-modal').classList.remove('hidden');
}

function closeQuickGuideModal() {
  document.getElementById('quick-guide-modal').classList.add('hidden');
}

/* ==================== TAB 5: PROFIL, OWNER CONSOLE & SUPABASE ==================== */
function renderProfileTab() {
  const accCard = document.getElementById('profile-account-card');
  if (accCard) {
    accCard.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div>
          <strong class="font-display text-base font-extrabold">${appState.auth.user}</strong>
          <span class="text-xs opacity-75 block">Role: ${appState.auth.role} • Lisensi: ${appState.auth.tier}</span>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">VERIFIED OWNER</span>
      </div>`;
  }

  const bcInput = document.getElementById('owner-broadcast-input');
  if (bcInput) bcInput.value = appState.ownerControls.broadcastMessage || '';

  const ksBtn = document.getElementById('owner-killswitch-btn');
  if (ksBtn) {
    ksBtn.textContent = appState.filters.engineEnabled
      ? '🟢 Mesin Sinyal: AKTIF (Ketuk untuk Jeda)'
      : '⏸ Mesin Sinyal: DIJEDA (Ketuk untuk Aktifkan)';
    ksBtn.className = appState.filters.engineEnabled
      ? 'w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold active:scale-95'
      : 'w-full py-2.5 rounded-xl bg-amber-600 text-white text-xs font-extrabold active:scale-95';
  }

  const tdInput = document.getElementById('cfg-twelvedata-key');
  const sbUrl = document.getElementById('cfg-supabase-url');
  const sbKey = document.getElementById('cfg-supabase-key');
  const tgTok = document.getElementById('cfg-tg-token');
  const tgCid = document.getElementById('cfg-tg-chatid');
  if (tdInput) tdInput.value = appState.settings.twelveDataKey || '';
  if (sbUrl) sbUrl.value = appState.settings.supabaseUrl || 'https://wgaixhcamdlsgyavrddq.supabase.co';
  if (sbKey) sbKey.value = appState.settings.supabaseKey || '';
  if (tgTok) tgTok.value = appState.settings.tgToken || '';
  if (tgCid) tgCid.value = appState.settings.tgChatId || '';

  updateQuotaBadge();
  updateNativeNotifStatus();

  const rm = document.getElementById('roadmap-container');
  if (rm && Array.isArray(LIAMV_ASSET_ROADMAP)) {
    rm.innerHTML = LIAMV_ASSET_ROADMAP.map(
      (r) => `
      <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2">
        <div>
          <strong class="block">${r.title}</strong>
          <span class="opacity-70 text-[10.5px]">${r.items}</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9.5px] font-bold shrink-0">${r.status}</span>
      </div>`
    ).join('');
  }
}

function updateQuotaBadge() {
  const b = document.getElementById('td-quota-badge');
  if (b) b.textContent = `Kuota TD: ${appState.settings.tdCallsToday || 0} / 800`;
}

function saveSettings() {
  appState.settings.twelveDataKey = (document.getElementById('cfg-twelvedata-key')?.value || '').trim();
  appState.settings.supabaseUrl = (document.getElementById('cfg-supabase-url')?.value || '').trim();
  appState.settings.supabaseKey = (document.getElementById('cfg-supabase-key')?.value || '').trim();
  appState.settings.tgToken = (document.getElementById('cfg-tg-token')?.value || '').trim();
  appState.settings.tgChatId = (document.getElementById('cfg-tg-chatid')?.value || '').trim();
  saveAppState();
  fetchLiveMarketPrices(true);
  showToast('✅ Pengaturan API & Cloud tersimpan.');
}

function saveOwnerBroadcast() {
  const msg = (document.getElementById('owner-broadcast-input')?.value || '').trim();
  appState.ownerControls.broadcastMessage = msg;
  saveAppState();
  applyBroadcastBanner();
  showToast(msg ? '📢 Broadcast banner diperbarui.' : '📢 Broadcast banner dihapus.');
}

function applyBroadcastBanner() {
  const banner = document.getElementById('global-broadcast-banner');
  const txt = document.getElementById('global-broadcast-text');
  const msg = appState.ownerControls.broadcastMessage;
  if (banner && txt) {
    if (msg) {
      txt.textContent = msg;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }
}

function toggleSignalKillSwitch() {
  toggleSignalFilter('engineEnabled');
  showToast(appState.filters.engineEnabled ? '🟢 Mesin Sinyal AKTIF.' : '⏸ Mesin Sinyal DIJEDA.');
}

function resetDailyCounters() {
  appState.accounts.forEach((a) => {
    a.entriesToday = 0;
    a.slToday = 0;
  });
  appState.cooldownUntil = {};
  saveAppState();
  renderHomeTab();
  showToast('↺ Seluruh counter harian & cooldown direset.');
}

async function syncToSupabaseCloud(manual = false) {
  const url = (appState.settings.supabaseUrl || '').trim().replace(/\/$/, '');
  const key = (appState.settings.supabaseKey || '').trim();
  const badge = document.getElementById('cloud-sync-status-badge');

  if (!url || !key) {
    if (manual) showToast('⚠️ Isi Supabase URL & Publishable Key di bawah terlebih dahulu.');
    return;
  }

  try {
    const records = appState.systemHistory.slice(0, 50).map((r) => ({
      id: r.id,
      pair: r.pair,
      tf: r.tf,
      direction: r.direction,
      method: r.methodLabel || r.method,
      limit_price: r.limitPrice,
      sl: r.sl,
      tp1: r.tp1,
      tp2: r.tp2,
      tp3: r.tp3,
      status: r.status,
      result_units: r.resultUnits || 0,
      created_at: r.createdAt,
      closed_at: r.closedAt || null
    }));

    if (records.length > 0) {
      const res = await fetch(`${url}/rest/v1/signal_history`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(records)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    if (badge) {
      badge.textContent = '🟢 SYNCED';
      badge.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-extrabold';
    }
    if (manual) showToast('☁️ Sinkronisasi Supabase berhasil!');
  } catch (err) {
    if (badge) {
      badge.textContent = '⚠️ SYNC ERROR';
      badge.className = 'px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9.5px] font-extrabold';
    }
    if (manual) showToast(`⚠️ Gagal sync Supabase: ${err.message}`);
  }
}

function exportFullBackupJson() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `liamvtrade-backup-${getWibDateStamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 File backup JSON diunduh.');
}

function importBackupJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      appState = { ...createDefaultState(), ...imported };
      saveAppState();
      switchTab(activeTab);
      showToast('✅ Backup JSON berhasil dipulihkan!');
    } catch (_) {
      showToast('❌ File JSON tidak valid.');
    }
  };
  reader.readAsText(file);
}

function generateMemberAccessCode() {
  const tier = document.getElementById('member-code-tier')?.value || 'PRO-30D';
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `LIAMV-${tier}-${rand}`;
  const out = document.getElementById('member-code-output');
  if (out) out.value = code;
  copyTextValue(code, 'Kode Akses Member');
}

/* ==================== NOTIFICATIONS & TELEGRAM ==================== */
function updateNativeNotifStatus() {
  const st = document.getElementById('native-notif-status');
  if (!st) return;
  if (!('Notification' in window)) {
    st.textContent = 'Browser ini tidak mendukung Web Push Notification.';
  } else if (Notification.permission === 'granted') {
    st.textContent = '🟢 Izin notifikasi layar HP AKTIF.';
  } else {
    st.textContent = '⚪ Izin notifikasi belum aktif. Ketuk tombol di bawah.';
  }
}

function enableNativeNotifications() {
  if (!('Notification' in window)) {
    showToast('⚠️ Browser tidak mendukung notifikasi.');
    return;
  }
  Notification.requestPermission().then((perm) => {
    updateNativeNotifStatus();
    if (perm === 'granted') {
      showToast('🔔 Notifikasi layar HP diaktifkan!');
      triggerPushNotification('Liamvtrade Quant Terminal v2.7', 'Notifikasi sinyal & alert posisi siap aktif.');
    }
  });
}

function triggerPushNotification(title, body) {
  if (!appState.signalConfig.autoNotif) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: './manifest.json' });
      });
    } else {
      new Notification(title, { body });
    }
  }
}

async function testTelegramAlert() {
  const token = (document.getElementById('cfg-tg-token')?.value || '').trim();
  const chatId = (document.getElementById('cfg-tg-chatid')?.value || '').trim();
  if (!token || !chatId) {
    showToast('⚠️ Isi Bot Token & Chat ID Telegram terlebih dahulu.');
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Liamvtrade Quant Terminal v2.7 (@xliamvr) terhubung ke Telegram!'
      })
    });
    if (res.ok) showToast('✅ Pesan tes terkirim ke Telegram!');
    else showToast('⚠️ Gagal mengirim ke Telegram. Cek Token/Chat ID.');
  } catch (_) {
    showToast('⚠️ Koneksi Telegram gagal.');
  }
}

function submitLoginForm() {
  document.getElementById('auth-gate-modal')?.classList.add('hidden');
}

function quickOwnerVaultLogin() {
  appState.auth = { loggedIn: true, role: 'OWNER', user: '@xliamvr', tier: 'LIFETIME OWNER' };
  saveAppState();
  document.getElementById('auth-gate-modal')?.classList.add('hidden');
  showToast('⚡ Selamat datang kembali, @xliamvr!');
}

/* ==================== BOOTSTRAP & CLOCK LOOP ==================== */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  checkDailyAutoReset();
  applyBroadcastBanner();
  updateHeaderLiveTicker();

  // Splash Screen dismissal
  const bar = document.getElementById('splash-bar');
  if (bar) setTimeout(() => { bar.style.width = '100%'; }, 80);
  setTimeout(() => {
    document.getElementById('splash-screen')?.classList.add('hide');
  }, 550);

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Render Initial Tab & Fetch Live Prices
  switchTab('home');
  fetchLiveMarketPrices(false);
  if (typeof fetchLiveEconomicNews === 'function') {
    fetchLiveEconomicNews(false);
  }

  // 1-Second Clock & Countdown Refresh Loop
  setInterval(() => {
    checkDailyAutoReset();
    const clk = document.getElementById('live-clock-wib');
    if (clk) clk.textContent = formatWibClockFull();

    if (activeTab === 'signals') {
      renderSignalsTab();
    }
  }, 1000);

  // 20-Second Live Market Price Polling
  setInterval(() => {
    fetchLiveMarketPrices(false);
  }, 20000);
});
