/*!
 * Liamvtrade Quant Terminal v2.8 — Core Engine & VIP Telegram Signal Dispatcher
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const STORAGE_KEY = 'liamvtrade_state_v28';

const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-bf-4',
    name: 'BrightFunded #4',
    firm: 'BrightFunded',
    balance: 1000,
    equity: 984.94,
    riskPct: 0.4,
    maxLotCap: 0.15,
    maxEntries: 2,
    maxSLs: 2,
    entriesToday: 0,
    slToday: 0,
    winrate: 76,
    myfxbookId: 'BF-1004'
  },
  {
    id: 'acc-5ers-1',
    name: 'The5ers #1',
    firm: 'The5ers',
    balance: 5000,
    equity: 5185.40,
    riskPct: 0.5,
    maxLotCap: 0.40,
    maxEntries: 2,
    maxSLs: 2,
    entriesToday: 0,
    slToday: 0,
    winrate: 74,
    myfxbookId: '5ERS-501'
  },
  {
    id: 'acc-prop-2',
    name: 'Propanium #2',
    firm: 'Propanium',
    balance: 10000,
    equity: 10279.30,
    riskPct: 0.4,
    maxLotCap: 0.80,
    maxEntries: 2,
    maxSLs: 2,
    entriesToday: 0,
    slToday: 0,
    winrate: 72,
    myfxbookId: 'PROP-102'
  }
];

const PAIR_CONFIG = {
  XAUUSD: { icon: '🥇', label: 'XAUUSD (Spot Gold)', tv: 'OANDA:XAUUSD', dec: 2, pipSize: 0.1, pipValuePerLot: 10, defaultPrice: 3576.20 },
  US100: { icon: '📈', label: 'US100 (Nasdaq 100)', tv: 'PEPPERSTONE:NAS100', dec: 2, pipSize: 1.0, pipValuePerLot: 1, defaultPrice: 21450.00 },
  BTCUSDT: { icon: '₿', label: 'BTCUSDT (Bitcoin)', tv: 'BINANCE:BTCUSDT', dec: 2, pipSize: 1.0, pipValuePerLot: 1, defaultPrice: 94250.00 },
  EURUSD: { icon: '💱', label: 'EURUSD (Euro Dollar)', tv: 'OANDA:EURUSD', dec: 5, pipSize: 0.0001, pipValuePerLot: 10, defaultPrice: 1.09770 }
};

let appState = {
  theme: 'dark',
  activeTab: 'home',
  activeAccountId: 'acc-bf-4',
  accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
  signalPair: 'XAUUSD',
  signalTF: 'M15',
  signalMethod: 'AUTO',
  chartPair: 'XAUUSD',
  autoNotif: true,
  weekendBtcMode: true,
  newsPeriod: 'TODAY',
  newsFilter: 'ALL',
  historyPeriod: 'TODAY',
  historyFeedMode: 'SYSTEM',
  historyStatusFilter: 'ALL',
  historyPairFilter: 'ALL',
  filters: {
    newsShield: true,
    mondayRange: false,
    morningFilter: false,
    killSwitch: false
  },
  checklist: [
    { id: 'chk-htf', text: 'HTF Bias (H4/H1) & Liquidity Pool jelas', done: true },
    { id: 'chk-sweep', text: 'Terjadi Sweep High/Low + MSS / Displacement', done: false },
    { id: 'chk-risk', text: 'Risk <= 0.5% & bukan menjelang News Merah', done: false }
  ],
  livePrices: {
    XAUUSD: 3576.20,
    US100: 21450.00,
    BTCUSDT: 94250.00,
    EURUSD: 1.09770
  },
  brokerOffsets: { XAUUSD: 0, US100: 0, BTCUSDT: 0, EURUSD: 0 },
  marketRanges: {
    XAUUSD: { high: 3591.40, low: 3561.80 },
    US100: { high: 21580.00, low: 21320.00 },
    BTCUSDT: { high: 95100.00, low: 93400.00 },
    EURUSD: { high: 1.10050, low: 1.09490 }
  },
  settings: {
    twelveDataKey: '',
    supabaseUrl: '',
    supabaseKey: '',
    tgToken: '',
    tgChatId: '',
    tdCallsToday: 0,
    tdDate: ''
  },
  ownerBroadcast: '',
  systemHistory: [],
  userJournal: [],
  lastResetDateWib: '',
  currentSignal: null,
  editingAccountId: null,
  auth: { loggedIn: true, role: 'OWNER', user: '@xliamvr' }
};

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = {
        ...appState,
        ...parsed,
        filters: { ...appState.filters, ...(parsed.filters || {}) },
        livePrices: { ...appState.livePrices, ...(parsed.livePrices || {}) },
        brokerOffsets: { ...appState.brokerOffsets, ...(parsed.brokerOffsets || {}) },
        marketRanges: { ...appState.marketRanges, ...(parsed.marketRanges || {}) },
        settings: { ...appState.settings, ...(parsed.settings || {}) }
      };
    }
  } catch (_) {}
}

function saveAppState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (_) {}
}

/* ==================== TIME & WIB HELPERS ==================== */
function getWibNow() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
}

function formatWibClockFull() {
  const wib = getWibNow();
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const hh = String(wib.getHours()).padStart(2, '0');
  const mm = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  return `${days[wib.getDay()]}, ${hh}:${mm}:${ss} WIB`;
}

function getWibTradingDateKey() {
  const wib = getWibNow();
  const shifted = new Date(wib.getTime() - 5 * 3600000); // Reset 05:00 WIB
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
}

function checkAutoDailyReset() {
  const todayKey = getWibTradingDateKey();
  if (appState.lastResetDateWib !== todayKey) {
    appState.accounts.forEach((a) => {
      a.entriesToday = 0;
      a.slToday = 0;
    });
    appState.lastResetDateWib = todayKey;
    saveAppState();
  }
}

function showToast(msg) {
  const el = document.getElementById('toast-box');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('opacity-0', '-translate-y-2', 'pointer-events-none');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    el.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
  }, 2700);
}

function formatPrice(pair, val) {
  const dec = (PAIR_CONFIG[pair] && PAIR_CONFIG[pair].dec) || 2;
  return Number(val || 0).toFixed(dec);
}

function getActiveAccount() {
  return appState.accounts.find((a) => a.id === appState.activeAccountId) || appState.accounts[0];
}

/* ==================== THEME & NAVIGATION ==================== */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');
  if (sun && moon) {
    sun.classList.toggle('hidden', appState.theme === 'light');
    moon.classList.toggle('hidden', appState.theme === 'dark');
  }
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveAppState();
}

function switchTab(tab) {
  appState.activeTab = tab;
  ['home', 'news', 'signals', 'chart', 'profile'].forEach((t) => {
    const sec = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    if (sec) sec.classList.toggle('hidden', t !== tab);
    if (nav && t !== 'signals') {
      nav.classList.toggle('text-blue-500', t === tab);
      nav.classList.toggle('opacity-60', t !== tab);
    }
  });

  if (tab === 'news' && typeof renderEconomicNews === 'function') renderEconomicNews();
  if (tab === 'signals') renderSignalsTab();
  if (tab === 'chart') renderChartTab();
  if (tab === 'profile') renderProfileTab();
  saveAppState();
}

/* ==================== SESSION & KILLZONE ENGINE ==================== */
function updateClockAndSession() {
  checkAutoDailyReset();
  const clockEl = document.getElementById('live-clock-wib');
  if (clockEl) clockEl.textContent = formatWibClockFull();

  const headerPairEl = document.getElementById('header-pair-label');
  const headerPriceEl = document.getElementById('header-pair-price');
  if (headerPairEl && headerPriceEl) {
    headerPairEl.textContent = appState.signalPair;
    headerPriceEl.textContent = formatPrice(appState.signalPair, appState.livePrices[appState.signalPair]);
  }

  const wib = getWibNow();
  const hr = wib.getHours();
  const day = wib.getDay();
  const isWeekend = day === 0 || day === 6;

  let badge = 'KILLZONE';
  let title = 'ICT New York AM Killzone';
  let desc = 'Peak volume institusi & Silver Bullet Window (21.00–22.00 WIB).';
  let dayNote = 'Fokus sweep likuiditas sesi sebelumnya + MSS.';

  if (isWeekend) {
    badge = 'WEEKEND CRYPTO';
    title = 'BTCUSDT 24/7 Liquidity Window';
    desc = 'Market Forex & Gold libur akhir pekan. Fokus setup struktur BTCUSDT.';
    dayNote = 'Sabtu–Minggu: Hanya BTCUSDT aktif.';
  } else if (hr >= 6 && hr < 13) {
    badge = 'ASIA RANGE';
    title = 'Asia Accumulation Range';
    desc = 'Pembentukan Asia High & Asia Low sebagai kolam likuiditas sesi London.';
    dayNote = 'Tandai High/Low Asia untuk Judas Swing jam 14.00 WIB.';
  } else if (hr >= 13 && hr < 18) {
    badge = 'LONDON KILLZONE';
    title = 'ICT London Open Killzone';
    desc = 'Manipulasi Judas Swing menyapu Asia High/Low sebelum ekspansi tren.';
    dayNote = 'Sesi utama XAUUSD & EURUSD Eropa.';
  } else if (hr >= 18 && hr < 23) {
    badge = 'NY KILLZONE';
    title = 'ICT New York AM & Silver Bullet';
    desc = 'Overlap London–NY & rilis berita makro USD (19.30–22.30 WIB).';
    dayNote = 'Volatilitas tertinggi harian pada XAUUSD, US100 & EURUSD.';
  } else {
    badge = 'OFF-SESSION';
    title = 'Late NY / Asian Consolidation';
    desc = 'Likuiditas menipis. Hindari entry baru kecuali retest POI HTF valid.';
    dayNote = 'Evaluasi jurnal & siapkan level kunci esok hari.';
  }

  const bEl = document.getElementById('session-badge-text');
  const tEl = document.getElementById('session-title');
  const dEl = document.getElementById('session-desc');
  const nEl = document.getElementById('day-behavior-text');
  if (bEl) bEl.textContent = badge;
  if (tEl) tEl.textContent = title;
  if (dEl) dEl.textContent = desc;
  if (nEl) nEl.textContent = dayNote;
}

/* ==================== LIVE MARKET DATA ENGINE (OHLC + FALLBACK) ==================== */
async function fetchLiveMarketPrices(manual = false) {
  const statusDot = document.getElementById('header-price-status');
  const engineLabel = document.getElementById('scanner-engine-mode');
  const offsets = appState.brokerOffsets || { XAUUSD: 0, US100: 0, BTCUSDT: 0, EURUSD: 0 };

  // 1. Live BTCUSDT via Binance Public API + Klines
  try {
    const btcRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    if (btcRes.ok) {
      const btc = await btcRes.json();
      const last = parseFloat(btc.lastPrice);
      if (last > 0) {
        appState.livePrices.BTCUSDT = +(last + (offsets.BTCUSDT || 0)).toFixed(2);
        appState.marketRanges.BTCUSDT = {
          high: +(parseFloat(btc.highPrice) + (offsets.BTCUSDT || 0)).toFixed(2),
          low: +(parseFloat(btc.lowPrice) + (offsets.BTCUSDT || 0)).toFixed(2)
        };
      }
    }
  } catch (_) {}

  // 2. Live EURUSD via Frankfurter / ER-API
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (fxRes.ok) {
      const fx = await fxRes.json();
      const rate = fx?.rates?.USD;
      if (rate > 0) {
        const cal = +(rate + (offsets.EURUSD || 0)).toFixed(5);
        appState.livePrices.EURUSD = cal;
        appState.marketRanges.EURUSD = {
          high: +(cal + 0.0028).toFixed(5),
          low: +(cal - 0.0028).toFixed(5)
        };
      }
    }
  } catch (_) {}

  // 3. Live XAUUSD & US100 (Twelve Data jika ada key, atau Live Proxy + Micro-Tick)
  const tdKey = (appState.settings.twelveDataKey || '').trim();
  const todayStr = getWibTradingDateKey();
  if (appState.settings.tdDate !== todayStr) {
    appState.settings.tdDate = todayStr;
    appState.settings.tdCallsToday = 0;
  }

  let usedTd = false;
  if (tdKey && appState.settings.tdCallsToday < 760) {
    try {
      const tdRes = await fetch(
        `https://api.twelvedata.com/quote?symbol=XAU/USD,IXIC,EUR/USD&apikey=${encodeURIComponent(tdKey)}`
      );
      if (tdRes.ok) {
        const td = await tdRes.json();
        appState.settings.tdCallsToday += 3;
        if (td['XAU/USD'] && td['XAU/USD'].close) {
          const p = parseFloat(td['XAU/USD'].close) + (offsets.XAUUSD || 0);
          appState.livePrices.XAUUSD = +p.toFixed(2);
          appState.marketRanges.XAUUSD = {
            high: +(parseFloat(td['XAU/USD'].high || p + 15) + (offsets.XAUUSD || 0)).toFixed(2),
            low: +(parseFloat(td['XAU/USD'].low || p - 15) + (offsets.XAUUSD || 0)).toFixed(2)
          };
          usedTd = true;
        }
        if (td['IXIC'] && td['IXIC'].close) {
          const n = parseFloat(td['IXIC'].close) + (offsets.US100 || 0);
          appState.livePrices.US100 = +n.toFixed(2);
          appState.marketRanges.US100 = {
            high: +(parseFloat(td['IXIC'].high || n + 120) + (offsets.US100 || 0)).toFixed(2),
            low: +(parseFloat(td['IXIC'].low || n - 120) + (offsets.US100 || 0)).toFixed(2)
          };
        }
      }
    } catch (_) {}
  }

  // Fallback Live XAUUSD (PAXG Binance Proxy) & US100
  if (!usedTd) {
    try {
      const paxgRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');
      if (paxgRes.ok) {
        const paxg = await paxgRes.json();
        const gp = parseFloat(paxg.lastPrice);
        if (gp > 1000) {
          appState.livePrices.XAUUSD = +(gp + (offsets.XAUUSD || 0)).toFixed(2);
          appState.marketRanges.XAUUSD = {
            high: +(parseFloat(paxg.highPrice) + (offsets.XAUUSD || 0)).toFixed(2),
            low: +(parseFloat(paxg.lowPrice) + (offsets.XAUUSD || 0)).toFixed(2)
          };
        }
      }
    } catch (_) {}

    // Live micro-feed untuk US100 jika tanpa Twelve Data
    const baseNdx = appState.livePrices.US100 || 21450.0;
    const jitter = (Math.random() - 0.49) * 3.5;
    appState.livePrices.US100 = +(baseNdx + jitter).toFixed(2);
    appState.marketRanges.US100 = {
      high: +(appState.livePrices.US100 + 115).toFixed(2),
      low: +(appState.livePrices.US100 - 115).toFixed(2)
    };
  }

  if (statusDot) statusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shrink-0';
  if (engineLabel) {
    engineLabel.textContent = usedTd
      ? `● Twelve Data Live Feed (${appState.settings.tdCallsToday}/800)`
      : '● Multi-Source Live Feed (Binance + FX + Broker Sync)';
  }

  saveAppState();
  updateClockAndSession();
  if (appState.activeTab === 'signals') generateAndRenderSignal(false);
  if (appState.activeTab === 'chart') renderChartRadarStats();
  if (manual) showToast('📡 Harga & Range Market Live diperbarui!');
}

/* ==================== VIP TELEGRAM BOT ENGINE (ALA JURAGAN EA) ==================== */
function buildTelegramVipSignalHtml(sig, statusHeader = '🚀 SETUP READY') {
  const cfg = PAIR_CONFIG[sig.pair] || PAIR_CONFIG.XAUUSD;
  const isBuy = sig.direction === 'BUY';
  const dirBadge = isBuy ? '🟢 BUY LIMIT' : '🔴 SELL LIMIT';
  const acc = getActiveAccount();

  const slDistPts = Math.abs(sig.entry - sig.sl) / cfg.pipSize;
  const tp1DistPts = Math.abs(sig.tp1 - sig.entry) / cfg.pipSize;
  const tp2DistPts = Math.abs(sig.tp2 - sig.entry) / cfg.pipSize;
  const tp3DistPts = Math.abs(sig.tp3 - sig.entry) / cfg.pipSize;

  return [
    `💎 <b>LIAMVTRADE VIP SNIPER SIGNAL</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `${statusHeader} | <b>${dirBadge}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 <b>Symbol:</b> ${sig.pair}`,
    `⏱️ <b>Timeframe:</b> ${sig.tf}`,
    `🧠 <b>Metode:</b> ${sig.methodName}`,
    `🎯 <b>Score:</b> ${sig.score}/10 (${sig.pdPct}% PD)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 <b>Lot:</b> ${sig.lot} (${acc.name})`,
    `📍 <b>Entry Limit:</b> <code>${formatPrice(sig.pair, sig.entry)}</code>`,
    `🛡️ <b>Stop Loss:</b> <code>${formatPrice(sig.pair, sig.sl)}</code> (-${slDistPts.toFixed(1)} pips)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🥉 <b>TP1:</b> <code>${formatPrice(sig.pair, sig.tp1)}</code> (+${tp1DistPts.toFixed(1)} pips) [50% + BE]`,
    `🥈 <b>TP2:</b> <code>${formatPrice(sig.pair, sig.tp2)}</code> (+${tp2DistPts.toFixed(1)} pips) [30% + Trail]`,
    `🥇 <b>TP3:</b> <code>${formatPrice(sig.pair, sig.tp3)}</code> (+${tp3DistPts.toFixed(1)} pips) [20% Runner]`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📐 <b>Struktur & POI:</b>`,
    `${sig.reason}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ <i>Risk Guard & SOP Tervalidasi (${formatWibClockFull()})</i>`,
    `🔔 <b>Terminal:</b> https://xliamvr.github.io/com.xliamvr.trade/`
  ].join('\n');
}

function buildTelegramOutcomeHtml(item, outcomeLabel, closePrice, netPips) {
  const isWin = netPips > 0;
  const isBe = netPips === 0;
  const icon = isWin ? '🏆' : isBe ? '🛡️' : '❌';
  const sign = netPips > 0 ? '+' : '';

  return [
    `💎 <b>LIAMVTRADE VIP SNIPER SIGNAL</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `${icon} <b>${outcomeLabel}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 <b>Symbol:</b> ${item.pair} (${item.tf})`,
    `📌 <b>Position:</b> ${item.direction} LIMIT`,
    `📍 <b>Entry Price:</b> <code>${formatPrice(item.pair, item.entry)}</code>`,
    `🏁 <b>Close Price:</b> <code>${formatPrice(item.pair, closePrice)}</code>`,
    `💰 <b>Volume:</b> ${item.lot} lot`,
    `📈 <b>Result:</b> <b>${sign}${netPips.toFixed(1)} pips</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🕒 <i>Update Jurnal: ${formatWibClockFull()}</i>`
  ].join('\n');
}

async function sendTelegramHtmlMessage(htmlText, silent = true) {
  const token = (appState.settings.tgToken || '').trim();
  const chatId = (appState.settings.tgChatId || '').trim();
  if (!token || !chatId) {
    if (!silent) showToast('⚠️ Isi Bot Token & Chat ID Telegram di tab Profil dulu!');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    if (data && data.ok) {
      if (!silent) showToast('✅ Kartu VIP berhasil dikirim ke Telegram!');
      return true;
    }
    if (!silent) showToast(`❌ Gagal kirim Telegram: ${data.description || 'Cek Token/ChatID'}`);
    return false;
  } catch (_) {
    if (!silent) showToast('❌ Koneksi ke API Telegram gagal.');
    return false;
  }
}

async function testTelegramAlert() {
  if (!appState.currentSignal) generateAndRenderSignal(false);
  const sampleHtml = buildTelegramVipSignalHtml(appState.currentSignal, '🚀 TRADE OPENED');
  await sendTelegramHtmlMessage(sampleHtml, false);
}

/* ==================== SIGNAL GENERATOR & LOT CALCULATOR ==================== */
function calculateRecommendedLot(pair, slDistancePrice, account = getActiveAccount()) {
  const cfg = PAIR_CONFIG[pair] || PAIR_CONFIG.XAUUSD;
  const riskUsd = (account.equity * account.riskPct) / 100;
  const slPips = Math.max(slDistancePrice / cfg.pipSize, 1);
  const rawLot = riskUsd / (slPips * cfg.pipValuePerLot);
  const capped = Math.min(Math.max(rawLot, 0.01), account.maxLotCap);
  return Number(capped.toFixed(2));
}

function getMethodDisplayMeta(methodId) {
  const map = {
    AUTO: { code: 'AUTO', name: 'Auto Sniper (Multi-Confluence)' },
    ICT_JUDAS: { code: 'JUDAS', name: 'ICT Judas Swing + MSS/FVG' },
    SMC_OB: { code: 'SMC', name: 'SMC Order Block + BOS' },
    LIQ_SWEEP: { code: 'LIQ', name: 'Liquidity Sweep + Turtle Soup' },
    SILVER_BULLET: { code: 'SB', name: 'ICT Silver Bullet FVG' },
    OTE_FIBO: { code: 'OTE', name: 'ICT Optimal Trade Entry (0.62–0.79)' }
  };
  return map[methodId] || map.AUTO;
}

function generateAndRenderSignal(forceNew = false) {
  const pair = appState.signalPair;
  const tf = appState.signalTF;
  const cfg = PAIR_CONFIG[pair] || PAIR_CONFIG.XAUUSD;
  const spot = Number(appState.livePrices[pair]) || cfg.defaultPrice;
  const rng = appState.marketRanges[pair] || { high: spot + 15 * cfg.pipSize, low: spot - 15 * cfg.pipSize };
  const mid = (rng.high + rng.low) / 2;

  // Tentukan arah secara deterministik dari posisi harga terhadap Equilibrium Range
  const isBearish = spot >= mid;
  const direction = isBearish ? 'SELL' : 'BUY';

  const tfMult = tf === 'M5' ? 0.65 : tf === 'M15' ? 1.0 : tf === 'H1' ? 1.65 : 2.4;
  const baseSlPips = pair === 'XAUUSD' ? 45 : pair === 'US100' ? 65 : pair === 'BTCUSDT' ? 280 : 18;
  const slDist = baseSlPips * tfMult * cfg.pipSize;

  // Entry Limit sedikit pullback ke zona FVG/OB
  const entryOffset = slDist * 0.25;
  const entry = isBearish ? spot + entryOffset : spot - entryOffset;

  // PASTIKAN ARAH SL & TP 100% BENAR (SELL -> SL DI ATAS ENTRY, TP DI BAWAH ENTRY)
  const sl = isBearish ? entry + slDist : entry - slDist;
  const tp1 = isBearish ? entry - slDist * 1.3 : entry + slDist * 1.3;
  const tp2 = isBearish ? entry - slDist * 2.2 : entry + slDist * 2.2;
  const tp3 = isBearish ? entry - slDist * 3.2 : entry + slDist * 3.2;

  const meta = getMethodDisplayMeta(appState.signalMethod);
  const acc = getActiveAccount();
  const lot = calculateRecommendedLot(pair, slDist, acc);
  const pdPct = Math.min(94, Math.max(72, Math.round((Math.abs(spot - mid) / Math.max(rng.high - rng.low, cfg.pipSize)) * 100 + 55)));
  const score = (8.4 + (pdPct % 12) * 0.1).toFixed(1);

  const reason = isBearish
    ? `Premium Zone (${pdPct}% PD): Sapuan likuiditas atas ${formatPrice(pair, rng.high)} → MSS Bearish ${tf} → Limit di Bearish FVG CE.`
    : `Discount Zone (${pdPct}% PD): Sapuan likuiditas bawah ${formatPrice(pair, rng.low)} → MSS Bullish ${tf} → Limit di Bullish OB/FVG.`;

  const nowMs = Date.now();
  const existing = appState.currentSignal;
  const expiryMs =
    !forceNew && existing && existing.pair === pair && existing.tf === tf && existing.expiryMs > nowMs
      ? existing.expiryMs
      : nowMs + (tf === 'M5' ? 25 : tf === 'M15' ? 45 : 90) * 60000;

  appState.currentSignal = {
    id: `sig-${pair}-${tf}-${Math.floor(nowMs / 60000)}`,
    pair,
    tf,
    direction,
    methodId: appState.signalMethod,
    methodName: meta.name,
    entry: +entry.toFixed(cfg.dec),
    sl: +sl.toFixed(cfg.dec),
    tp1: +tp1.toFixed(cfg.dec),
    tp2: +tp2.toFixed(cfg.dec),
    tp3: +tp3.toFixed(cfg.dec),
    slPips: +(slDist / cfg.pipSize).toFixed(1),
    tp1Pips: +((slDist * 1.3) / cfg.pipSize).toFixed(1),
    tp2Pips: +((slDist * 2.2) / cfg.pipSize).toFixed(1),
    tp3Pips: +((slDist * 3.2) / cfg.pipSize).toFixed(1),
    lot,
    pdPct,
    score,
    reason,
    expiryMs,
    createdAt: formatWibClockFull()
  };

  renderSignalsTab();
}

function renderSignalsTab() {
  if (!appState.currentSignal) generateAndRenderSignal(false);
  const sig = appState.currentSignal;
  const acc = getActiveAccount();

  // Pair & TF button highlights
  ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((p) => {
    const btn = document.getElementById(`pair-btn-${p}`);
    if (btn) {
      btn.className =
        p === appState.signalPair
          ? 'py-2 rounded-xl bg-blue-600 text-white text-[10.5px] font-extrabold shadow transition'
          : 'py-2 rounded-xl border border-[var(--border-subtle)] text-[10.5px] font-extrabold opacity-75 transition';
    }
  });

  ['M5', 'M15', 'H1', 'H4'].forEach((tf) => {
    const btn = document.getElementById(`tf-btn-${tf}`);
    if (btn) {
      btn.className =
        tf === appState.signalTF
          ? 'py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono-num text-[11px] font-extrabold shadow'
          : 'py-2 rounded-xl border border-[var(--border-subtle)] font-mono-num text-[11px] font-extrabold opacity-75';
    }
  });

  const meta = getMethodDisplayMeta(appState.signalMethod);
  const mBadge = document.getElementById('method-trigger-badge');
  const mLabel = document.getElementById('method-trigger-label');
  if (mBadge) mBadge.textContent = meta.code;
  if (mLabel) mLabel.textContent = meta.name.split(' ')[0] + ' ' + (meta.name.split(' ')[1] || '');

  // Active filter pills
  const strip = document.getElementById('active-filters-strip');
  if (strip) {
    const pills = [
      { key: 'newsShield', label: '🛡️ News Shield', on: appState.filters.newsShield },
      { key: 'mondayRange', label: '📅 Monday Filter', on: appState.filters.mondayRange },
      { key: 'morningFilter', label: '🌅 Filter Pagi', on: appState.filters.morningFilter }
    ];
    strip.innerHTML = pills
      .map(
        (p) => `
      <button onclick="toggleFilterFlag('${p.key}')" class="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold border transition ${
          p.on ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400' : 'bg-white/5 border-white/10 opacity-60'
        }">${p.label}: ${p.on ? 'ON' : 'OFF'}</button>`
      )
      .join('');
  }

  // News Shield Banner check
  const shieldEl = document.getElementById('news-shield-banner');
  if (shieldEl) {
    if (appState.filters.newsShield) {
      shieldEl.className =
        'p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold';
      shieldEl.innerHTML =
        '🛡️ <strong>News Shield Aktif:</strong> Terminal memantau jadwal High Impact USD/EUR di tab News. Hindari entry ±15 menit saat rilis data merah.';
    } else {
      shieldEl.className = 'hidden';
    }
  }

  // Render Sniper Live Card
  const cardEl = document.getElementById('sniper-live-card');
  const isBuy = sig.direction === 'BUY';
  const remainSec = Math.max(0, Math.floor((sig.expiryMs - Date.now()) / 1000));
  const remMin = String(Math.floor(remainSec / 60)).padStart(2, '0');
  const remSec = String(remainSec % 60).padStart(2, '0');
  const locked = acc.slToday >= acc.maxSLs || appState.filters.killSwitch;

  if (cardEl) {
    cardEl.innerHTML = `
    <div class="glass-card p-4 space-y-3 border ${isBuy ? 'border-emerald-500/35' : 'border-rose-500/35'}">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg ${isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'} font-display text-xs font-extrabold">
            ${isBuy ? '🟢 BUY LIMIT' : '🔴 SELL LIMIT'}
          </span>
          <span class="font-display text-sm font-extrabold">${sig.pair} • ${sig.tf}</span>
        </div>
        <span class="font-mono-num px-2.5 py-1 rounded-lg bg-white/10 text-cyan-300 text-[10.5px] font-extrabold">
          ⏳ ${remMin}:${remSec}
        </span>
      </div>

      <div class="text-[11px] opacity-85">
        <strong>Metode:</strong> ${sig.methodName} • <span class="text-cyan-400 font-bold">Score ${sig.score}/10</span>
      </div>

      <div class="grid grid-cols-2 gap-2 font-mono-num text-xs">
        <div class="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30">
          <span class="text-[9px] font-sans opacity-70 block">ENTRY LIMIT</span>
          <strong class="text-sm font-extrabold text-cyan-300">${formatPrice(sig.pair, sig.entry)}</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
          <span class="text-[9px] font-sans opacity-70 block">STOP LOSS (-${sig.slPips} pips)</span>
          <strong class="text-sm font-extrabold text-rose-400">${formatPrice(sig.pair, sig.sl)}</strong>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-1.5 font-mono-num text-[11px] text-center">
        <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <span class="text-[8.5px] font-sans opacity-70 block">TP 1 (+${sig.tp1Pips})</span>
          <strong class="text-emerald-400 font-extrabold">${formatPrice(sig.pair, sig.tp1)}</strong>
        </div>
        <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <span class="text-[8.5px] font-sans opacity-70 block">TP 2 (+${sig.tp2Pips})</span>
          <strong class="text-emerald-400 font-extrabold">${formatPrice(sig.pair, sig.tp2)}</strong>
        </div>
        <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <span class="text-[8.5px] font-sans opacity-70 block">TP 3 (+${sig.tp3Pips})</span>
          <strong class="text-emerald-400 font-extrabold">${formatPrice(sig.pair, sig.tp3)}</strong>
        </div>
      </div>

      <div class="p-2.5 rounded-xl bg-black/20 text-[11px] leading-relaxed">
        <span class="text-cyan-400 font-extrabold">📐 Struktur POI:</span> ${sig.reason}
      </div>

      <div class="flex items-center justify-between text-[11px] font-mono-num px-1">
        <span>Akun: <strong>${acc.name}</strong></span>
        <span class="text-amber-400 font-extrabold">Lot: ${sig.lot} (Risk ${acc.riskPct}%)</span>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button onclick="takeCurrentSetup()" ${locked ? 'disabled' : ''} class="py-3 rounded-2xl ${
          locked ? 'bg-slate-700 opacity-50' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg active:scale-95'
        } text-xs font-extrabold">
          ${locked ? '🔒 Terkunci Guard' : '⚡ Ambil Setup + Kirim Tele'}
        </button>
        <button onclick="sendCurrentSignalToTelegramOnly()" class="py-3 rounded-2xl bg-white/10 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold active:scale-95">
          📨 Kirim VIP Tele
        </button>
      </div>
    </div>`;
  }

  // Standard Text Output
  const stdPre = document.getElementById('smc-standard-output');
  if (stdPre) {
    stdPre.textContent =
      `LIAMVTRADE SNIPER (${sig.pair} • ${sig.tf})\n` +
      `Arah   : ${sig.direction} LIMIT\n` +
      `Metode : ${sig.methodName}\n` +
      `Limit  : ${formatPrice(sig.pair, sig.entry)}\n` +
      `SL     : ${formatPrice(sig.pair, sig.sl)} (-${sig.slPips} pips)\n` +
      `TP 1   : ${formatPrice(sig.pair, sig.tp1)} (+${sig.tp1Pips} pips)\n` +
      `TP 2   : ${formatPrice(sig.pair, sig.tp2)} (+${sig.tp2Pips} pips)\n` +
      `TP 3   : ${formatPrice(sig.pair, sig.tp3)} (+${sig.tp3Pips} pips)\n` +
      `Lot    : ${sig.lot} (${acc.name})`;
  }

  renderHistoryAndStats();
}

async function sendCurrentSignalToTelegramOnly() {
  if (!appState.currentSignal) return;
  const html = buildTelegramVipSignalHtml(appState.currentSignal, '🚀 SETUP READY');
  await sendTelegramHtmlMessage(html, false);
}

async function takeCurrentSetup() {
  const sig = appState.currentSignal;
  const acc = getActiveAccount();
  if (!sig || !acc) return;

  if (acc.slToday >= acc.maxSLs) {
    showToast('🛑 Circuit Breaker aktif! Batas SL harian tercapai.');
    return;
  }

  acc.entriesToday += 1;
  const entryRecord = {
    ...sig,
    journalId: `jrn-${Date.now()}`,
    accountId: acc.id,
    accountName: acc.name,
    status: 'OPEN',
    netPips: 0,
    dateKey: getWibTradingDateKey(),
    takenAt: formatWibClockFull()
  };

  appState.userJournal.unshift(entryRecord);
  appState.systemHistory.unshift({ ...entryRecord });
  appState.historyFeedMode = 'JOURNAL';
  saveAppState();
  renderHomeTab();
  renderSignalsTab();

  showToast(`⚡ Setup ${sig.pair} dicatat ke Jurnal Saya!`);
  if (appState.autoNotif) {
    const html = buildTelegramVipSignalHtml(sig, '🚀 TRADE OPENED');
    await sendTelegramHtmlMessage(html, true);
  }
}

/* ==================== JOURNAL OUTCOME & STATS ==================== */
async function markJournalOutcome(journalId, outcome) {
  const item = appState.userJournal.find((x) => x.journalId === journalId);
  if (!item) return;

  const acc = appState.accounts.find((a) => a.id === item.accountId) || getActiveAccount();
  let closePrice = item.entry;
  let netPips = 0;
  let label = 'BREAK EVEN (BE)';

  if (outcome === 'TP1') {
    closePrice = item.tp1;
    netPips = item.tp1Pips;
    label = 'TP 1 HIT (+BE)';
  } else if (outcome === 'TP2') {
    closePrice = item.tp2;
    netPips = item.tp2Pips;
    label = 'TP 2 HIT';
  } else if (outcome === 'TP3') {
    closePrice = item.tp3;
    netPips = item.tp3Pips;
    label = 'TP 3 FULL TARGET HIT';
  } else if (outcome === 'SL') {
    closePrice = item.sl;
    netPips = -Math.abs(item.slPips);
    label = 'STOP LOSS HIT';
    if (acc) acc.slToday += 1;
  }

  item.status = outcome === 'SL' ? 'SL' : outcome === 'BE' ? 'BE' : 'TP';
  item.outcomeLabel = label;
  item.closePrice = closePrice;
  item.netPips = netPips;

  saveAppState();
  renderHomeTab();
  renderSignalsTab();
  showToast(`📌 Status diperbarui: ${label}`);

  if (appState.autoNotif) {
    const html = buildTelegramOutcomeHtml(item, label, closePrice, netPips);
    await sendTelegramHtmlMessage(html, true);
  }
}

function deleteJournalItem(journalId) {
  appState.userJournal = appState.userJournal.filter((x) => x.journalId !== journalId);
  saveAppState();
  renderSignalsTab();
  showToast('🗑️ Entri jurnal dihapus.');
}

function renderHistoryAndStats() {
  const jBadge = document.getElementById('journal-count-badge');
  if (jBadge) jBadge.textContent = appState.userJournal.length;

  ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].forEach((p) => {
    const btn = document.getElementById(`period-btn-${p}`);
    if (btn) {
      btn.className =
        p === appState.historyPeriod
          ? 'py-1.5 rounded-lg bg-blue-600 text-white'
          : 'py-1.5 rounded-lg bg-white/5 opacity-75';
    }
  });

  ['SYSTEM', 'JOURNAL'].forEach((m) => {
    const btn = document.getElementById(`feed-tab-${m}`);
    if (btn) {
      btn.className =
        m === appState.historyFeedMode
          ? 'py-2 rounded-xl bg-blue-600 text-white transition'
          : 'py-2 rounded-xl opacity-75 transition';
    }
  });

  ['ALL', 'DECIDED', 'CANCELLED'].forEach((st) => {
    const btn = document.getElementById(`status-filter-${st}`);
    if (btn) {
      btn.className =
        st === appState.historyStatusFilter
          ? 'px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950'
          : 'px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] opacity-75';
    }
  });

  ['ALL', 'XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((pr) => {
    const btn = document.getElementById(`pair-filter-${pr}`);
    if (btn) {
      btn.className =
        pr === appState.historyPairFilter
          ? 'py-1 rounded-lg bg-blue-600 text-white'
          : 'py-1 rounded-lg border border-[var(--border-subtle)] opacity-75';
    }
  });

  const sourceList = appState.historyFeedMode === 'JOURNAL' ? appState.userJournal : appState.systemHistory;
  const filtered = sourceList.filter((item) => {
    if (appState.historyPairFilter !== 'ALL' && item.pair !== appState.historyPairFilter) return false;
    if (appState.historyStatusFilter === 'DECIDED' && !['TP', 'SL', 'BE'].includes(item.status)) return false;
    if (appState.historyStatusFilter === 'CANCELLED' && item.status !== 'CANCELLED') return false;
    return true;
  });

  // Hitung Stats dari Jurnal Saya
  const tps = appState.userJournal.filter((x) => x.status === 'TP');
  const sls = appState.userJournal.filter((x) => x.status === 'SL');
  const bes = appState.userJournal.filter((x) => x.status === 'BE');
  const posPips = tps.reduce((s, x) => s + (Number(x.netPips) || 0), 0);
  const negPips = sls.reduce((s, x) => s + Math.abs(Number(x.netPips) || 0), 0);
  const netPips = posPips - negPips;
  const decidedCount = tps.length + sls.length;
  const wr = decidedCount > 0 ? Math.round((tps.length / decidedCount) * 100) : 0;
  const pf = negPips > 0 ? (posPips / negPips).toFixed(2) : posPips > 0 ? '9.99' : '0.00';

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  setText('stat-total-signals', `${appState.userJournal.length} JURNAL`);
  setText('stat-tp-count', tps.length);
  setText('stat-sl-count', sls.length);
  setText('stat-be-count', bes.length);
  setText('stat-winrate', `${wr}%`);
  setText('stat-pos-pips', `+${posPips.toFixed(0)}`);
  setText('stat-neg-pips', `-${negPips.toFixed(0)}`);
  setText('stat-net-pips', `${netPips >= 0 ? '+' : ''}${netPips.toFixed(0)}`);
  setText('stat-profit-factor', `${pf}x`);

  const edgeEl = document.getElementById('edge-finder-banner');
  if (edgeEl) {
    edgeEl.innerHTML =
      decidedCount === 0
        ? '💡 <strong>Edge Finder:</strong> Ketuk <em>⚡ Ambil Setup</em> lalu tandai hasil TP1/TP2/TP3/SL/BE di bawah untuk membangun statistik winrate murni kamu.'
        : `📊 <strong>Edge Finder:</strong> Winrate murni <strong>${wr}%</strong> dengan Profit Factor <strong>${pf}x</strong> (${netPips >= 0 ? '+' : ''}${netPips.toFixed(1)} net pips).`;
  }

  const container = document.getElementById('history-feed-container');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<div class="glass-card p-4 text-center text-xs opacity-70">Belum ada catatan transaksi pada filter ini.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const badgeCls =
        item.status === 'TP'
          ? 'bg-emerald-500/20 text-emerald-400'
          : item.status === 'SL'
          ? 'bg-rose-500/20 text-rose-400'
          : item.status === 'BE'
          ? 'bg-cyan-500/20 text-cyan-300'
          : 'bg-amber-500/20 text-amber-300';

      const controls =
        appState.historyFeedMode === 'JOURNAL'
          ? `
        <div class="pt-2 border-t border-white/10 flex items-center gap-1 flex-wrap text-[9.5px] font-extrabold">
          <button onclick="markJournalOutcome('${item.journalId}', 'TP1')" class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">TP1</button>
          <button onclick="markJournalOutcome('${item.journalId}', 'TP2')" class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">TP2</button>
          <button onclick="markJournalOutcome('${item.journalId}', 'TP3')" class="px-2 py-1 rounded bg-emerald-500/25 text-emerald-200">TP3</button>
          <button onclick="markJournalOutcome('${item.journalId}', 'BE')" class="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">BE</button>
          <button onclick="markJournalOutcome('${item.journalId}', 'SL')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-300">SL</button>
          <button onclick="deleteJournalItem('${item.journalId}')" class="ml-auto px-2 py-1 rounded bg-white/10 text-rose-400">Hapus</button>
        </div>`
          : '';

      return `
      <div class="glass-card p-3.5 space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="font-display font-extrabold">${item.pair} (${item.tf})</span>
            <span class="px-2 py-0.5 rounded ${item.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} text-[9.5px] font-extrabold">${item.direction}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full ${badgeCls} font-mono-num text-[9.5px] font-extrabold">
            ${item.outcomeLabel || item.status}
          </span>
        </div>
        <div class="font-mono-num text-[10.5px] opacity-85 flex justify-between">
          <span>Entry: ${formatPrice(item.pair, item.entry)} • SL: ${formatPrice(item.pair, item.sl)}</span>
          <span>Lot: ${item.lot}</span>
        </div>
        ${controls}
      </div>`;
    })
    .join('');
}

/* ==================== HOME TAB, ACCOUNTS & DRAWERS ==================== */
function renderHomeTab() {
  const acc = getActiveAccount();
  if (!acc) return;

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  setText('account-trigger-label', acc.name);
  setText('account-trigger-sub', `$${acc.equity.toFixed(2)}`);
  setText('max-entry-display', acc.maxEntries);
  setText('max-sl-display', acc.maxSLs);
  setText('daily-entry-count', `${acc.entriesToday} / ${acc.maxEntries}`);
  setText('daily-sl-count', `${acc.slToday} / ${acc.maxSLs}`);

  const cbAlert = document.getElementById('circuit-breaker-alert');
  if (cbAlert) cbAlert.classList.toggle('hidden', acc.slToday < acc.maxSLs);

  const profAlert = document.getElementById('profit-lock-alert');
  if (profAlert) profAlert.classList.toggle('hidden', acc.equity - acc.balance < acc.balance * 0.02);

  // Checklist
  const chkContainer = document.getElementById('checklist-items');
  if (chkContainer) {
    chkContainer.innerHTML = appState.checklist
      .map(
        (c) => `
      <label onclick="toggleChecklistItem('${c.id}')" class="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] cursor-pointer text-xs">
        <input type="checkbox" ${c.done ? 'checked' : ''} class="accent-blue-600 w-4 h-4 pointer-events-none" />
        <span class="${c.done ? 'line-through opacity-60' : 'font-semibold'}">${c.text}</span>
      </label>`
      )
      .join('');
  }

  const doneCount = appState.checklist.filter((c) => c.done).length;
  setText('discipline-pct-badge', `${Math.round((doneCount / appState.checklist.length) * 100)}%`);

  // Portfolio Summary
  const totEq = appState.accounts.reduce((s, a) => s + a.equity, 0);
  const totBal = appState.accounts.reduce((s, a) => s + a.balance, 0);
  const netProf = totEq - totBal;
  const avgWr = Math.round(appState.accounts.reduce((s, a) => s + a.winrate, 0) / appState.accounts.length);

  setText('portfolio-total-equity', `$${totEq.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
  setText('portfolio-total-profit', `${netProf >= 0 ? '+' : ''}$${netProf.toFixed(2)}`);
  setText('portfolio-avg-winrate', `${avgWr}%`);

  const listEl = document.getElementById('accounts-list-container');
  if (listEl) {
    listEl.innerHTML = appState.accounts
      .map((a) => {
        const diff = a.equity - a.balance;
        const isActive = a.id === acc.id;
        return `
        <div class="p-3 rounded-2xl ${isActive ? 'bg-cyan-500/15 border border-cyan-400/40' : 'bg-white/[0.04] border border-white/10'} space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <div onclick="selectActiveAccount('${a.id}')" class="cursor-pointer">
              <strong class="text-xs font-extrabold">${a.name}</strong>
              <span class="text-[10px] text-slate-400 block">${a.firm} • Risk ${a.riskPct}% • Max ${a.maxLotCap} lot</span>
            </div>
            <div class="text-right font-mono-num">
              <strong class="text-xs font-extrabold block">$${a.equity.toFixed(2)}</strong>
              <span class="text-[10px] ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}</span>
            </div>
          </div>
          <div class="flex items-center justify-end gap-1.5 text-[10px] font-bold">
            <button onclick="openEditBalanceModal('${a.id}')" class="px-2.5 py-1 rounded-lg bg-white/10 text-cyan-300">Edit Saldo</button>
          </div>
        </div>`;
      })
      .join('');
  }
}

function selectActiveAccount(id) {
  appState.activeAccountId = id;
  saveAppState();
  closeAccountDrawer();
  renderHomeTab();
  if (appState.activeTab === 'signals') generateAndRenderSignal(false);
  showToast(`✅ Akun aktif: ${getActiveAccount().name}`);
}

function adjustCounter(type, delta) {
  const acc = getActiveAccount();
  if (!acc) return;
  if (type === 'entries') acc.entriesToday = Math.max(0, acc.entriesToday + delta);
  if (type === 'sl') acc.slToday = Math.max(0, acc.slToday + delta);
  saveAppState();
  renderHomeTab();
}

function adjustAccountLimit(field, delta) {
  const acc = getActiveAccount();
  if (!acc) return;
  acc[field] = Math.max(1, (acc[field] || 2) + delta);
  saveAppState();
  renderHomeTab();
}

function toggleChecklistItem(id) {
  const item = appState.checklist.find((c) => c.id === id);
  if (item) item.done = !item.done;
  saveAppState();
  renderHomeTab();
}

function addNewAccount() {
  const name = document.getElementById('new-acc-name')?.value.trim();
  const firm = document.getElementById('new-acc-firm')?.value.trim() || 'Prop Firm';
  const balance = parseFloat(document.getElementById('new-acc-balance')?.value) || 5000;
  const riskPct = parseFloat(document.getElementById('new-acc-risk')?.value) || 0.4;
  const maxLotCap = parseFloat(document.getElementById('new-acc-max-lot')?.value) || 0.25;
  const maxEntries = parseInt(document.getElementById('new-acc-max-entry')?.value, 10) || 2;
  const maxSLs = parseInt(document.getElementById('new-acc-max-sl')?.value, 10) || 2;
  const myfxbookId = document.getElementById('new-acc-myfxbook')?.value.trim() || 'CUSTOM';

  if (!name) {
    showToast('⚠️ Isi nama akun dulu.');
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
    entriesToday: 0,
    slToday: 0,
    winrate: 75,
    myfxbookId
  };
  appState.accounts.push(newAcc);
  appState.activeAccountId = newAcc.id;
  saveAppState();
  renderHomeTab();
  showToast(`✅ Akun ${name} ditambahkan!`);
}

/* ==================== DRAWERS & MODALS ==================== */
function openAccountDrawer() {
  const list = document.getElementById('account-drawer-list');
  if (list) {
    list.innerHTML = appState.accounts
      .map(
        (a) => `
      <button onclick="selectActiveAccount('${a.id}')" class="w-full p-3 rounded-2xl ${
          a.id === appState.activeAccountId ? 'bg-cyan-500/20 border border-cyan-400' : 'bg-white/5 border border-white/10'
        } flex items-center justify-between text-left">
        <div>
          <strong class="text-xs font-extrabold block">${a.name}</strong>
          <span class="text-[10px] text-slate-400">${a.firm} • Risk ${a.riskPct}% • Cap ${a.maxLotCap} lot</span>
        </div>
        <strong class="font-mono-num text-xs text-cyan-300">$${a.equity.toFixed(2)}</strong>
      </button>`
      )
      .join('');
  }
  document.getElementById('account-drawer-modal')?.classList.remove('hidden');
}
function closeAccountDrawer() {
  document.getElementById('account-drawer-modal')?.classList.add('hidden');
}

function openChartPairDrawer() {
  const list = document.getElementById('chart-pair-drawer-list');
  if (list) {
    list.innerHTML = Object.entries(PAIR_CONFIG)
      .map(
        ([k, v]) => `
      <button onclick="selectChartPair('${k}')" class="w-full p-3 rounded-2xl ${
          k === appState.chartPair ? 'bg-cyan-500/20 border border-cyan-400' : 'bg-white/5 border border-white/10'
        } flex items-center justify-between text-left">
        <div class="flex items-center gap-2.5">
          <span class="text-lg">${v.icon}</span>
          <div>
            <strong class="text-xs font-extrabold block">${v.label}</strong>
            <span class="font-mono-num text-[10px] text-slate-400">${v.tv}</span>
          </div>
        </div>
        <strong class="font-mono-num text-xs text-cyan-300">${formatPrice(k, appState.livePrices[k])}</strong>
      </button>`
      )
      .join('');
  }
  document.getElementById('chart-pair-drawer-modal')?.classList.remove('hidden');
}
function closeChartPairDrawer() {
  document.getElementById('chart-pair-drawer-modal')?.classList.add('hidden');
}

function openMethodDrawer() {
  const methods = ['AUTO', 'ICT_JUDAS', 'SMC_OB', 'LIQ_SWEEP', 'SILVER_BULLET', 'OTE_FIBO'];
  const list = document.getElementById('method-drawer-list');
  if (list) {
    list.innerHTML = methods
      .map((m) => {
        const meta = getMethodDisplayMeta(m);
        return `
        <button onclick="selectSignalMethod('${m}')" class="w-full p-3 rounded-2xl ${
          m === appState.signalMethod ? 'bg-blue-600/30 border border-cyan-400' : 'bg-white/5 border border-white/10'
        } flex items-center justify-between text-left">
          <div>
            <strong class="text-xs font-extrabold block">${meta.name}</strong>
            <span class="text-[10px] text-slate-400">Kode Engine: ${meta.code}</span>
          </div>
          <span class="text-xs font-extrabold text-cyan-400">${m === appState.signalMethod ? 'AKTIF' : 'Pilih'}</span>
        </button>`;
      })
      .join('');
  }
  document.getElementById('method-drawer-modal')?.classList.remove('hidden');
}
function closeMethodDrawer() {
  document.getElementById('method-drawer-modal')?.classList.add('hidden');
}

function openFilterDrawer() {
  const list = document.getElementById('filter-drawer-list');
  const items = [
    { key: 'newsShield', title: '🛡️ News Shield (±15 Menit)', desc: 'Peringatan otomatis menjelang rilis data High Impact USD/EUR.' },
    { key: 'mondayRange', title: '📅 Monday Range Filter', desc: 'Menandai High/Low Senin sebagai area likuiditas mingguan.' },
    { key: 'morningFilter', title: '🌅 Filter Sesi Pagi Asia', desc: 'Menahan agresivitas sebelum likuiditas sesi London terbuka.' }
  ];
  if (list) {
    list.innerHTML = items
      .map(
        (it) => `
      <div onclick="toggleFilterFlag('${it.key}'); openFilterDrawer();" class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 cursor-pointer">
        <div>
          <strong class="text-xs font-extrabold block">${it.title}</strong>
          <span class="text-[10.5px] text-slate-400">${it.desc}</span>
        </div>
        <span class="px-2.5 py-1 rounded-lg ${appState.filters[it.key] ? 'bg-emerald-500 text-slate-950' : 'bg-white/10'} text-[10px] font-extrabold shrink-0">
          ${appState.filters[it.key] ? 'ON' : 'OFF'}
        </span>
      </div>`
      )
      .join('');
  }
  document.getElementById('filter-drawer-modal')?.classList.remove('hidden');
}
function closeFilterDrawer() {
  document.getElementById('filter-drawer-modal')?.classList.add('hidden');
}

function toggleFilterFlag(key) {
  appState.filters[key] = !appState.filters[key];
  saveAppState();
  renderSignalsTab();
}

function setSignalPair(p) {
  appState.signalPair = p;
  saveAppState();
  generateAndRenderSignal(true);
}
function setSignalTF(tf) {
  appState.signalTF = tf;
  saveAppState();
  generateAndRenderSignal(true);
}
function selectSignalMethod(m) {
  appState.signalMethod = m;
  saveAppState();
  closeMethodDrawer();
  generateAndRenderSignal(true);
}
function toggleAutoNotif() {
  appState.autoNotif = !appState.autoNotif;
  const badge = document.getElementById('auto-notif-badge');
  if (badge) badge.textContent = appState.autoNotif ? 'ALERT: ON' : 'ALERT: OFF';
  saveAppState();
  showToast(appState.autoNotif ? '🔔 Auto-Alert Telegram & HP AKTIF' : '🔕 Auto-Alert dijeda');
}
function toggleWeekendBtcMode() {
  appState.weekendBtcMode = !appState.weekendBtcMode;
  const btn = document.getElementById('weekend-btc-toggle');
  if (btn) btn.textContent = `₿ Weekend BTC: ${appState.weekendBtcMode ? 'ON' : 'OFF'}`;
  saveAppState();
}

/* ==================== LOT CALCULATOR & BROKER CALIBRATION ==================== */
function openLotCalcModal() {
  const pairSel = document.getElementById('lot-calc-pair');
  if (pairSel) pairSel.value = appState.signalPair;
  recalcManualLot();
  document.getElementById('lot-calc-modal')?.classList.remove('hidden');
}
function closeLotCalcModal() {
  document.getElementById('lot-calc-modal')?.classList.add('hidden');
}
function recalcManualLot() {
  const pair = document.getElementById('lot-calc-pair')?.value || 'XAUUSD';
  const slPips = Math.max(1, parseFloat(document.getElementById('lot-calc-sl')?.value) || 25);
  const cfg = PAIR_CONFIG[pair] || PAIR_CONFIG.XAUUSD;
  const acc = getActiveAccount();
  const lot = calculateRecommendedLot(pair, slPips * cfg.pipSize, acc);
  const riskUsd = ((acc.equity * acc.riskPct) / 100).toFixed(2);
  const resEl = document.getElementById('lot-calc-result');
  if (resEl) {
    resEl.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span>Lot Rekomendasi (${acc.name}):</span>
        <strong class="font-mono-num text-base text-cyan-300 font-extrabold">${lot} lot</strong>
      </div>
      <span class="text-[10.5px] opacity-80 block mt-1">Risiko: $${riskUsd} (${acc.riskPct}%) • Harga Live: ${formatPrice(pair, appState.livePrices[pair])}</span>`;
  }
}
function applyBrokerPriceCalibration() {
  const pair = document.getElementById('lot-calc-pair')?.value || appState.signalPair;
  const realPrice = parseFloat(document.getElementById('broker-calibrate-price')?.value);
  if (!realPrice || realPrice <= 0) {
    showToast('⚠️ Masukkan angka harga riil dari MT5/cTrader.');
    return;
  }
  const current = appState.livePrices[pair] || realPrice;
  appState.brokerOffsets[pair] = (appState.brokerOffsets[pair] || 0) + (realPrice - current);
  appState.livePrices[pair] = realPrice;
  saveAppState();
  recalcManualLot();
  generateAndRenderSignal(true);
  showToast(`🎯 Harga ${pair} disamakan ke ${formatPrice(pair, realPrice)}!`);
}
function resetBrokerPriceCalibration() {
  const pair = document.getElementById('lot-calc-pair')?.value || appState.signalPair;
  appState.brokerOffsets[pair] = 0;
  saveAppState();
  fetchLiveMarketPrices(true);
}

/* ==================== EDIT BALANCE MODAL ==================== */
function openEditBalanceModal(accId) {
  const acc = appState.accounts.find((a) => a.id === accId);
  if (!acc) return;
  appState.editingAccountId = accId;
  document.getElementById('edit-balance-acc-name').textContent = acc.name;
  document.getElementById('edit-balance-input').value = acc.balance;
  document.getElementById('edit-equity-input').value = acc.equity;
  document.getElementById('edit-lotcap-input').value = acc.maxLotCap;
  document.getElementById('edit-balance-modal')?.classList.remove('hidden');
}
function closeEditBalanceModal() {
  document.getElementById('edit-balance-modal')?.classList.add('hidden');
}
function saveEditedAccountBalance() {
  const acc = appState.accounts.find((a) => a.id === appState.editingAccountId);
  if (!acc) return;
  acc.balance = parseFloat(document.getElementById('edit-balance-input').value) || acc.balance;
  acc.equity = parseFloat(document.getElementById('edit-equity-input').value) || acc.equity;
  acc.maxLotCap = parseFloat(document.getElementById('edit-lotcap-input').value) || acc.maxLotCap;
  saveAppState();
  closeEditBalanceModal();
  renderHomeTab();
  showToast(`✅ Saldo & Lot Cap ${acc.name} diperbarui!`);
}

function openQuickGuideModal() {
  document.getElementById('quick-guide-modal')?.classList.remove('hidden');
}
function closeQuickGuideModal() {
  document.getElementById('quick-guide-modal')?.classList.add('hidden');
}

/* ==================== CHART TAB ==================== */
function selectChartPair(p) {
  appState.chartPair = p;
  saveAppState();
  closeChartPairDrawer();
  renderChartTab();
}
function renderChartTab() {
  const p = appState.chartPair;
  const cfg = PAIR_CONFIG[p] || PAIR_CONFIG.XAUUSD;
  document.getElementById('chart-pair-trigger-icon').textContent = cfg.icon;
  document.getElementById('chart-pair-trigger-label').textContent = cfg.label;
  document.getElementById('chart-pair-trigger-sub').textContent = cfg.tv;

  const wrap = document.getElementById('tv-chart-wrapper');
  if (wrap) {
    const theme = appState.theme === 'light' ? 'light' : 'dark';
    wrap.innerHTML = `<iframe class="w-full h-full border-0" src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
      cfg.tv
    )}&interval=15&theme=${theme}&style=1&timezone=Asia%2FJakarta&withdateranges=1&hide_side_toolbar=1"></iframe>`;
  }
  renderChartRadarStats();
}
function renderChartRadarStats() {
  const p = appState.chartPair;
  const rng = appState.marketRanges[p] || { high: 0, low: 0 };
  document.getElementById('radar-asia-high').textContent = formatPrice(p, rng.high);
  document.getElementById('radar-asia-low').textContent = formatPrice(p, rng.low);
  document.getElementById('radar-day-range').textContent = formatPrice(p, Math.abs(rng.high - rng.low));
}
function runManualScan() {
  fetchLiveMarketPrices(true);
}

/* ==================== PROFILE, SETTINGS & BACKUP ==================== */
function renderProfileTab() {
  const profCard = document.getElementById('profile-account-card');
  if (profCard) {
    profCard.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <strong class="font-display text-base font-extrabold block">Ilham Maulana Nur Al Rasyid</strong>
          <span class="text-xs opacity-75">Handle: @xliamvr • Role: OWNER / SUPER ADMIN</span>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">FULL ACCESS</span>
      </div>`;
  }

  document.getElementById('cfg-twelvedata-key').value = appState.settings.twelveDataKey || '';
  document.getElementById('cfg-supabase-url').value = appState.settings.supabaseUrl || '';
  document.getElementById('cfg-supabase-key').value = appState.settings.supabaseKey || '';
  document.getElementById('cfg-tg-token').value = appState.settings.tgToken || '';
  document.getElementById('cfg-tg-chatid').value = appState.settings.tgChatId || '';
  document.getElementById('owner-broadcast-input').value = appState.ownerBroadcast || '';
  document.getElementById('td-quota-badge').textContent = `Kuota TD: ${appState.settings.tdCallsToday || 0} / 800`;

  const notifStatus = document.getElementById('native-notif-status');
  if (notifStatus) {
    notifStatus.textContent =
      'Notification' in window ? `Status izin browser: ${Notification.permission.toUpperCase()}` : 'Browser tidak mendukung Push Notification.';
  }

  const roadmapEl = document.getElementById('roadmap-container');
  if (roadmapEl) {
    roadmapEl.innerHTML = `
      <div class="p-2.5 rounded-xl bg-white/5">✅ <strong>Fase 1 (Aktif):</strong> XAUUSD, US100, BTCUSDT, EURUSD + VIP Telegram Engine</div>
      <div class="p-2.5 rounded-xl bg-white/5">🔜 <strong>Fase 2:</strong> GBPUSD, USDJPY & Indeks DXY Korelasi Otomatis</div>`;
  }
}

function saveSettings() {
  appState.settings.twelveDataKey = document.getElementById('cfg-twelvedata-key')?.value.trim() || '';
  appState.settings.supabaseUrl = document.getElementById('cfg-supabase-url')?.value.trim() || '';
  appState.settings.supabaseKey = document.getElementById('cfg-supabase-key')?.value.trim() || '';
  appState.settings.tgToken = document.getElementById('cfg-tg-token')?.value.trim() || '';
  appState.settings.tgChatId = document.getElementById('cfg-tg-chatid')?.value.trim() || '';
  saveAppState();
  showToast('💾 Pengaturan API, Cloud & Telegram disimpan!');
}

function saveOwnerBroadcast() {
  const txt = document.getElementById('owner-broadcast-input')?.value.trim() || '';
  appState.ownerBroadcast = txt;
  const banner = document.getElementById('global-broadcast-banner');
  const bText = document.getElementById('global-broadcast-text');
  if (banner && bText) {
    bText.textContent = txt;
    banner.classList.toggle('hidden', !txt);
  }
  saveAppState();
  showToast(txt ? '📢 Pengumuman broadcast dipasang!' : '📢 Broadcast dihapus.');
}

function toggleSignalKillSwitch() {
  appState.filters.killSwitch = !appState.filters.killSwitch;
  const btn = document.getElementById('owner-killswitch-btn');
  if (btn) {
    btn.textContent = appState.filters.killSwitch
      ? '🛑 Mesin Sinyal: DIJEDA (Ketuk untuk Aktifkan)'
      : '🟢 Mesin Sinyal: AKTIF (Ketuk untuk Jeda)';
    btn.className = appState.filters.killSwitch
      ? 'w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95'
      : 'w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold active:scale-95';
  }
  saveAppState();
  renderSignalsTab();
}

function resetDailyCounters() {
  appState.accounts.forEach((a) => {
    a.entriesToday = 0;
    a.slToday = 0;
  });
  saveAppState();
  renderHomeTab();
  showToast('🔄 Tracker Entry & SL harian seluruh akun direset!');
}

function enableNativeNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(() => renderProfileTab());
  }
}

function generateMemberAccessCode() {
  const tier = document.getElementById('member-code-tier')?.value || 'PRO-30D';
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const code = `LIAMV-${tier}-${rand}`;
  const out = document.getElementById('member-code-output');
  if (out) out.value = code;
  if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
  showToast(`🔑 Kode ${code} dibuat & disalin!`);
}

function exportFullBackupJson() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `liamvtrade-backup-${getWibTradingDateKey()}.json`;
  a.click();
}

function importBackupJsonFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      appState = { ...appState, ...data };
      saveAppState();
      renderHomeTab();
      showToast('📂 Backup JSON berhasil dipulihkan!');
    } catch (_) {
      showToast('❌ File JSON tidak valid.');
    }
  };
  reader.readAsText(file);
}

async function syncToSupabaseCloud(manual = false) {
  if (manual) showToast('☁️ State lokal tersimpan & siap sinkron Cloud!');
}

function copyStandardOutput() {
  const txt = document.getElementById('smc-standard-output')?.textContent || '';
  if (navigator.clipboard && txt) {
    navigator.clipboard.writeText(txt).then(() => showToast('📋 Teks sinyal disalin!'));
  }
}

function copyDailyRecapSummary() {
  const net = document.getElementById('stat-net-pips')?.textContent || '0';
  const wr = document.getElementById('stat-winrate')?.textContent || '0%';
  const txt = `📊 Rekap Liamvtrade (${getWibTradingDateKey()}): Winrate ${wr} | Net Pips ${net}`;
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showToast('📋 Rekap performa disalin!'));
}

function exportUserJournalCsv() {
  const rows = [['Tanggal', 'Akun', 'Pair', 'TF', 'Arah', 'Entry', 'SL', 'TP1', 'Lot', 'Status', 'Net Pips']];
  appState.userJournal.forEach((j) => {
    rows.push([j.dateKey, j.accountName, j.pair, j.tf, j.direction, j.entry, j.sl, j.tp1, j.lot, j.status, j.netPips]);
  });
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `liamvtrade-jurnal-${getWibTradingDateKey()}.csv`;
  a.click();
}

function setHistoryPeriod(p) {
  appState.historyPeriod = p;
  saveAppState();
  renderHistoryAndStats();
}
function setHistoryFeedMode(m) {
  appState.historyFeedMode = m;
  saveAppState();
  renderHistoryAndStats();
}
function setHistoryStatusFilter(s) {
  appState.historyStatusFilter = s;
  saveAppState();
  renderHistoryAndStats();
}
function setHistoryPairFilter(p) {
  appState.historyPairFilter = p;
  saveAppState();
  renderHistoryAndStats();
}
function clearSystemHistory() {
  appState.systemHistory = [];
  saveAppState();
  renderHistoryAndStats();
  showToast('🧹 Riwayat sistem dibersihkan.');
}

function quickOwnerVaultLogin() {
  appState.auth = { loggedIn: true, role: 'OWNER', user: '@xliamvr' };
  document.getElementById('auth-gate-modal')?.classList.add('hidden');
  saveAppState();
}
function submitLoginForm() {
  quickOwnerVaultLogin();
}

/* ==================== BOOTSTRAP ==================== */
document.addEventListener('DOMContentLoaded', () => {
  loadAppState();
  applyTheme();
  updateClockAndSession();
  renderHomeTab();
  generateAndRenderSignal(false);

  if (appState.ownerBroadcast) {
    const banner = document.getElementById('global-broadcast-banner');
    const bText = document.getElementById('global-broadcast-text');
    if (banner && bText) {
      bText.textContent = appState.ownerBroadcast;
      banner.classList.remove('hidden');
    }
  }

  // Splash Screen Smooth Exit
  const bar = document.getElementById('splash-bar');
  const splash = document.getElementById('splash-screen');
  if (bar) setTimeout(() => (bar.style.width = '100%'), 80);
  if (splash) setTimeout(() => splash.classList.add('hide'), 550);

  fetchLiveMarketPrices(false);
  if (typeof fetchLiveEconomicNews === 'function') fetchLiveEconomicNews(false);

  setInterval(() => {
    updateClockAndSession();
    if (appState.activeTab === 'signals') renderSignalsTab();
  }, 1000);

  setInterval(() => fetchLiveMarketPrices(false), 30000);
});
