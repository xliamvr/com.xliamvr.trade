/**
 * Liamvtrade Quant Terminal v2.9 — app.js (FULL COMPLETE EDITION)
 * Mengatur State, Live Market Feed Akurat + Kalibrasi Broker, WIB Killzones & Weekend BTC,
 * Circuit Breaker + Anti-Revenge Cooldown, Pre-Trade SOP + Score Boost, Prop Firm Portfolio,
 * News Engine + Eksekusi BUY/SELL News, Sniper Signal Engine + Interactive POI Education,
 * News Sniper Mode, Performance Recap + CSV Export, TradingView Radar (CAPITALCOM:US100),
 * Super Admin Console, Supabase 2-Way Sync, Native Push Alert & Telegram VIP Dispatcher.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'liamvtrade_quant_v29_state';
  const DEFAULT_SB_URL = 'https://zslntgghkdvhtfofnzxq.supabase.co';
  const DEFAULT_SB_KEY = 'sb_publishable_q5L3wJ7V78z0jN52V2uL9A_V2s5r0_p';

  const DEFAULT_SOP_ITEMS = [
    { id: 'sop-1', text: 'Struktur HTF (H1/H4) jelas & searah bias POI', checked: false },
    { id: 'sop-2', text: 'Likuiditas (EQH/EQL/Session High-Low) sudah tersapu / terpetakan', checked: false },
    { id: 'sop-3', text: 'Berada dalam Killzone aktif atau Zona Discount/Premium valid', checked: false },
    { id: 'sop-4', text: 'Tidak ada rilis News High Impact ±15 menit (News Shield aman)', checked: false },
    { id: 'sop-5', text: 'Risiko per trade sesuai batas akun & tidak sedang revenge trade', checked: false }
  ];

  const DEFAULT_ACCOUNTS = [
    {
      id: 'acc-bf-4',
      name: 'BrightFunded #4',
      firm: 'BrightFunded',
      balance: 1000,
      equity: 984.94,
      riskPct: 0.4,
      maxLot: 0.15,
      dailyDdPct: 4,
      maxDdPct: 8,
      targetPct: 8,
      minBuffer: 25,
      maxEntry: 2,
      maxSl: 2,
      curEntry: 0,
      curSl: 0,
      winrate: 74,
      myfxbookId: '',
      notes: 'Jaga daily loss di bawah 4% dan hindari overtrade saat sesi sepi.'
    },
    {
      id: 'acc-5ers-1',
      name: 'The5ers #1',
      firm: 'The5ers',
      balance: 5000,
      equity: 5185.40,
      riskPct: 0.5,
      maxLot: 0.50,
      dailyDdPct: 4,
      maxDdPct: 8,
      targetPct: 8,
      minBuffer: 100,
      maxEntry: 2,
      maxSl: 2,
      curEntry: 0,
      curSl: 0,
      winrate: 76,
      myfxbookId: '',
      notes: 'Fokus setup High Confluence dengan RR minimal 1:2.'
    },
    {
      id: 'acc-prop-2',
      name: 'Propanium #2',
      firm: 'Propanium',
      balance: 10000,
      equity: 10279.30,
      riskPct: 0.5,
      maxLot: 1.00,
      dailyDdPct: 4,
      maxDdPct: 8,
      targetPct: 10,
      minBuffer: 200,
      maxEntry: 2,
      maxSl: 2,
      curEntry: 0,
      curSl: 0,
      winrate: 72,
      myfxbookId: '',
      notes: 'Disiplin maksimal 2 entry per hari pada Killzone London/NY.'
    }
  ];

  function createInitialState() {
    return {
      theme: 'dark',
      activeTab: 'beranda',
      activeAccountId: 'acc-bf-4',
      weekendBtcMode: false,
      cooldownUntilMs: 0,
      lastResetDateWib: getWibDateKey(),

      // Flags & Guards
      flags: {
        newsShield: true,
        mondayFilter: false,
        morningFilter: false,
        signalAlert: true,
        newsSniper: false,
        engineMasterActive: true,
        requireSop100: false,
        blockOnCooldown: true
      },

      // Broadcast & VIP
      broadcastMessage: '',
      broadcastDismissed: false,
      memberCodes: [],

      // API & Telegram Config
      config: {
        tdApiKey: '',
        sbUrl: DEFAULT_SB_URL,
        sbKey: DEFAULT_SB_KEY,
        tgToken: '',
        tgChatId: '',
        tgAutoSignal: false,
        tgAutoNews: true,
        tgAutoResult: true
      },

      // Live Prices & Broker Calibration Offsets
      prices: {
        XAUUSD: 2650.00,
        US100: 20850.00,
        BTCUSDT: 92000.00,
        EURUSD: 1.08500
      },
      priceOffsets: {
        XAUUSD: 0,
        US100: 0,
        BTCUSDT: 0,
        EURUSD: 0
      },
      priceSourceLabel: 'Syncing Live Feed...',
      lastPriceSyncMs: 0,
      tdQuotaUsed: 0,

      // Signal Engine Selection
      signal: {
        pair: 'XAUUSD',
        timeframe: 'M15',
        method: 'auto',
        scanSeed: 1,
        expiryEndMs: Date.now() + 45 * 60000,
        showStandardFormat: false,
        showPoiEducation: false
      },

      // Chart Tab Selection
      chart: {
        pair: 'XAUUSD',
        lastScanText: ''
      },

      // News Filters
      news: {
        period: 'today',
        impact: 'all',
        pair: 'ALL',
        wire: []
      },

      // SOP Checklist
      sopItems: JSON.parse(JSON.stringify(DEFAULT_SOP_ITEMS)),

      // Prop Accounts
      accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),

      // Trade Logs & Recap
      recapPeriod: 'today',
      logSubTab: 'signals',
      logStatusFilter: 'all',
      logPairFilter: 'ALL',
      tradeLogs: []
    };
  }

  let state = loadState();
  let currentSignalObj = null;
  let lastAutoSentSignalKey = '';
  let lastAutoSentNewsKey = '';

  function getWibDateKey() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    const y = wib.getFullYear();
    const m = String(wib.getMonth() + 1).padStart(2, '0');
    const d = String(wib.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      const base = createInitialState();
      return {
        ...base,
        ...parsed, 
      weekendBtcMode: false,
      flags: { ...base.flags, ...(parsed.flags || {}) },
      config: { ...base.config, ...(parsed.config || {}) },
      prices: { ...base.prices, ...(parsed.prices || {}) },
      priceOffsets: { ...base.priceOffsets, ...(parsed.priceOffsets || {}) },
      signal: { ...base.signal, ...(parsed.signal || {}) },
      chart: { ...base.chart, ...(parsed.chart || {}) },
      news: { ...base.news, ...(parsed.news || {}) },
      sopItems: Array.isArray(parsed.sopItems) && parsed.sopItems.length > 0 ? parsed.sopItems : base.sopItems,
      accounts: Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : base.accounts,
      tradeLogs: Array.isArray(parsed.tradeLogs) ? parsed.tradeLogs : []
    };

    } catch (_) {
      return createInitialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Abaikan jika storage penuh
    }
  }

  // =========================================================================
  // TOAST & MODAL HELPERS
  // =========================================================================
  function showToast(message, tone = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const palette = {
      info: 'bg-slate-900/95 border-sky-400/50 text-sky-200',
      success: 'bg-emerald-950/95 border-emerald-400/50 text-emerald-200',
      warn: 'bg-amber-950/95 border-amber-400/50 text-amber-200',
      error: 'bg-rose-950/95 border-rose-400/50 text-rose-200'
    };

    const el = document.createElement('div');
    el.className = `px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur-md transition-all ${palette[tone] || palette.info}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      setTimeout(() => el.remove(), 220);
    }, 2800);
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('hidden');
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  }

    function copyTextValue(text, label = 'Nilai') {
    const safeText = text === undefined || text === null ? '' : String(text).trim();
    if (!safeText || safeText === '--') {
      showToast(`${label} belum tersedia untuk disalin`, 'warn');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(safeText).then(
        () => showToast(`${label} disalin: ${safeText}`, 'success'),
        () => fallbackCopy(safeText, label)
      );
    } else {
      fallbackCopy(safeText, label);
    }
  }

  function copySignalField(field) {
    if (!currentSignalObj) {
      showToast('Data sinyal belum siap', 'warn');
      return;
    }
    const map = {
      entry: { val: currentSignalObj.entryFmt, label: 'Entry' },
      sl: { val: currentSignalObj.slFmt, label: 'Stop Loss' },
      tp1: { val: currentSignalObj.tp1Fmt, label: 'TP 1' },
      tp2: { val: currentSignalObj.tp2Fmt, label: 'TP 2' },
      tp3: { val: currentSignalObj.tp3Fmt, label: 'TP 3' }
    };
    const item = map[field];
    if (item) copyTextValue(item.val, item.label);
  }


  function fallbackCopy(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(`${label} disalin: ${text}`, 'success');
    } catch (_) {
      showToast('Gagal menyalin otomatis', 'error');
    }
    ta.remove();
  }

  // =========================================================================
  // THEME & TAB NAVIGATION
  // =========================================================================
  function applyTheme() {
    const htmlEl = document.documentElement;
    const btn = document.getElementById('btn-theme-toggle');
    if (state.theme === 'light') {
      htmlEl.classList.remove('dark');
      if (btn) btn.textContent = '🌙';
    } else {
      htmlEl.classList.add('dark');
      if (btn) btn.textContent = '☀️';
    }
  }

  function toggleThemeMode() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
    if (state.activeTab === 'chart') {
      renderTradingViewChart(state.chart.pair);
    }
    showToast(`Mode tampilan diubah ke ${state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'info');
  }

  function switchMainTab(tabName) {
    state.activeTab = tabName;
    saveState();

    document.querySelectorAll('.tab-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });

    document.querySelectorAll('.nav-item-btn').forEach((btn) => {
      const target = btn.getAttribute('data-nav');
      const isCenter = target === 'signals';
      if (isCenter) {
        btn.classList.toggle('ring-2', tabName === 'signals');
        btn.classList.toggle('ring-white', tabName === 'signals');
      } else {
        btn.classList.toggle('text-sky-400', target === tabName);
        btn.classList.toggle('text-slate-400', target !== tabName);
      }
    });

    if (tabName === 'chart') {
      const sel = document.getElementById('chart-pair-select');
      if (sel) sel.value = state.chart.pair;
      renderTradingViewChart(state.chart.pair);
      scanChartStructure(false);
    } else if (tabName === 'news') {
      renderNewsSection();
    } else if (tabName === 'signals') {
      recalculateAndRenderSignal(false);
      renderPerformanceAndLogs();
    } else if (tabName === 'beranda') {
      renderHomeSection();
    } else if (tabName === 'profil') {
      populateProfileInputs();
    }
  }

  // =========================================================================
  // WIB CLOCK, SESSIONS, WEEKEND BTC & DAILY AUTO-RESET (05:00 WIB)
  // =========================================================================
  function updateClockAndSessions() {
    const ctx = global.LiamMethods.getWibContext();
    const wib = ctx.wib;

    const daysId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayName = daysId[wib.getDay()];
    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    const ss = String(wib.getSeconds()).padStart(2, '0');

    const clockEl = document.getElementById('header-wib-clock');
    if (clockEl) clockEl.textContent = `${dayName}, ${hh}:${mm}:${ss} WIB`;

    const dateKey = getWibDateKey();
    if (ctx.hour === 5 && ctx.minute === 0 && state.lastResetDateWib !== dateKey) {
      state.lastResetDateWib = dateKey;
      resetAllAccountsDailyTrackers(true);
    }

    const weekendBtn = document.getElementById('btn-weekend-btc');
    if (weekendBtn) {
      weekendBtn.textContent = state.weekendBtcMode ? '₿ Weekend BTC: ON' : '₿ Weekend BTC: OFF';
      weekendBtn.className = state.weekendBtcMode
        ? 'px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-400/50 bg-amber-500/20 text-amber-200 transition'
        : 'px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-800/80 text-slate-300 transition';
    }

    const badgeEl = document.getElementById('session-badge');
    const titleEl = document.getElementById('session-title');
    const descEl = document.getElementById('session-desc');
    const tipEl = document.getElementById('session-action-tip');
    const nextKzEl = document.getElementById('next-kz-countdown');

    if (ctx.isWeekend && state.weekendBtcMode) {
      if (badgeEl) badgeEl.textContent = 'WEEKEND BTC';
      if (titleEl) titleEl.textContent = 'Crypto Weekend Liquidity Session';
      if (descEl) descEl.textContent = 'Pasar forex & indeks tutup akhir pekan; fokus pada likuiditas BTCUSDT, Equal High/Low, dan Order Block H1/M15.';
      if (tipEl) tipEl.textContent = 'Pantau sweep range weekend pada BTCUSDT';
      if (nextKzEl) nextKzEl.textContent = 'Senin 05:00 WIB';
    } else if (ctx.hour >= 13 && ctx.hour < 17) {
      if (badgeEl) badgeEl.textContent = 'LONDON KZ';
      if (titleEl) titleEl.textContent = 'London Killzone & Judas Swing';
      if (descEl) descEl.textContent = 'Sesi pembukaan Eropa dengan potensi manipulasi awal (Judas Swing) menyapu High/Low Asia sebelum ekspansi tren.';
      if (tipEl) tipEl.textContent = 'Waspadai fakeout Asia High/Low & cari MSS M15';
      if (nextKzEl) nextKzEl.textContent = formatCountdownToHour(wib, 19);
    } else if (ctx.hour >= 19 && ctx.hour < 23) {
      if (badgeEl) badgeEl.textContent = 'NEW YORK KZ';
      if (titleEl) titleEl.textContent = 'New York AM Killzone (Prime)';
      if (descEl) descEl.textContent = 'Volatilitas tertinggi XAUUSD, US100, dan EURUSD. Likuiditas institusional aktif penuh dan sering mengejar target harian.';
      if (tipEl) tipEl.textContent = 'Eksekusi POI diskon/premium terbaik (Max 2 setup)';
      if (nextKzEl) nextKzEl.textContent = 'Killzone Aktif';
    } else if (ctx.hour >= 0 && ctx.hour < 3) {
      if (badgeEl) badgeEl.textContent = 'NY PM / CLOSE';
      if (titleEl) titleEl.textContent = 'New York PM Re-Distribution';
      if (descEl) descEl.textContent = 'Fase konsolidasi atau kelanjutan tren akhir sesi Amerika. Hindari entry terburu-buru menjelang penutupan harian.';
      if (tipEl) tipEl.textContent = 'Amankan profit / trailing ke breakeven';
      if (nextKzEl) nextKzEl.textContent = formatCountdownToHour(wib, 13);
    } else if (ctx.hour >= 5 && ctx.hour < 13) {
      if (badgeEl) badgeEl.textContent = 'ASIA RANGE';
      if (titleEl) titleEl.textContent = 'Asia Accumulation Range';
      if (descEl) descEl.textContent = 'Pembentukan Asia High & Asia Low sebagai kolam likuiditas (liquidity pool) untuk sesi London.';
      if (tipEl) tipEl.textContent = 'Tandai High/Low Asia untuk Judas Swing';
      if (nextKzEl) nextKzEl.textContent = formatCountdownToHour(wib, 13);
    } else {
      if (badgeEl) badgeEl.textContent = 'TRANSITION';
      if (titleEl) titleEl.textContent = 'Pre-Killzone Consolidation';
      if (descEl) descEl.textContent = 'Masa transisi antar sesi global. Tunggu struktur yang jelas dan hindari entry di tengah range sempit.';
      if (tipEl) tipEl.textContent = 'Siapkan watchlist POI & cek jadwal News';
      if (nextKzEl) nextKzEl.textContent = formatCountdownToHour(wib, ctx.hour < 13 ? 13 : 19);
    }

    updateCooldownTicker();
    updateSignalExpiryTicker();
  }

  function formatCountdownToHour(wibNow, targetHour) {
    const target = new Date(wibNow.getTime());
    target.setHours(targetHour, 0, 0, 0);
    if (target.getTime() <= wibNow.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const diffMin = Math.max(1, Math.round((target.getTime() - wibNow.getTime()) / 60000));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `Next KZ: ${h}j ${m}m`;
  }

  function toggleWeekendBtcMode() {
    state.weekendBtcMode = !state.weekendBtcMode;
    if (state.weekendBtcMode) {
      selectSignalPair('BTCUSDT');
    }
    saveState();
    updateClockAndSessions();
    showToast(`Weekend BTC Mode: ${state.weekendBtcMode ? 'AKTIF' : 'NONAKTIF'}`, 'info');
  }

  // =========================================================================
  // ANTI-REVENGE COOLDOWN (20 MENIT PASCA-SL)
  // =========================================================================
  function triggerAntiRevengeCooldown(minutes = 20) {
    state.cooldownUntilMs = Date.now() + minutes * 60000;
    saveState();
    updateCooldownTicker();
    showToast(`🧊 Cooldown ${minutes} menit aktif untuk mencegah revenge trade!`, 'warn');
  }

  function clearCooldownManual() {
    state.cooldownUntilMs = 0;
    saveState();
    updateCooldownTicker();
    showToast('Cooldown dilewati secara manual.', 'info');
  }

  function updateCooldownTicker() {
    const banner = document.getElementById('cooldown-banner');
    const timerText = document.getElementById('cooldown-timer-text');
    if (!banner || !timerText) return;

    const remMs = state.cooldownUntilMs - Date.now();
    if (remMs > 0) {
      banner.classList.remove('hidden');
      const totalSec = Math.ceil(remMs / 1000);
      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      timerText.textContent = `${mins}:${secs}`;
    } else {
      if (state.cooldownUntilMs !== 0) {
        state.cooldownUntilMs = 0;
        saveState();
      }
      banner.classList.add('hidden');
    }
  }

  // =========================================================================
  // LIVE MARKET PRICE FEED (AKURAT SESUAI TRADINGVIEW / SPOT GLOBAL)
  // =========================================================================
  function getCalibratedPrice(pair) {
    const raw = Number(state.prices[pair]);
    const offset = Number(state.priceOffsets[pair]) || 0;
    const spec = global.LiamMethods.getPairSpec(pair);
    const val = (Number.isFinite(raw) ? raw : 0) + offset;
    return Number(val.toFixed(spec.decimals));
  }

  function renderPriceDisplays() {
    const xauPrice = getCalibratedPrice('XAUUSD');
    const us100Price = getCalibratedPrice('US100');
    const btcPrice = getCalibratedPrice('BTCUSDT');
    const eurPrice = getCalibratedPrice('EURUSD');

    const headerTicker = document.getElementById('header-ticker-text');
    const feedDot = document.getElementById('header-feed-dot');
    const activePair = state.signal.pair || 'XAUUSD';
    const activeCal = getCalibratedPrice(activePair);

    if (headerTicker) {
      headerTicker.textContent = `${activePair} ${global.LiamMethods.formatPrice(activePair, activeCal)}`;
    }
    if (feedDot) {
      feedDot.className = state.config.engineMasterActive
        ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse'
        : 'w-2 h-2 rounded-full bg-amber-400';
    }

    const pXau = document.getElementById('pair-btn-price-XAUUSD');
    const pUs = document.getElementById('pair-btn-price-US100');
    const pBtc = document.getElementById('pair-btn-price-BTCUSDT');
    const pEur = document.getElementById('pair-btn-price-EURUSD');

    if (pXau) pXau.textContent = xauPrice.toFixed(2);
    if (pUs) pUs.textContent = us100Price.toFixed(2);
    if (pBtc) pBtc.textContent = btcPrice.toFixed(2);
    if (pEur) pEur.textContent = eurPrice.toFixed(5);

    const quotaEl = document.getElementById('td-quota-badge');
    if (quotaEl) quotaEl.textContent = `Kuota TD: ${state.tdQuotaUsed} / 800`;
  }

  
async function syncLiveMarketPrices(forceShowToast = false) {
  let updatedAny = false;
  let sourceTag = 'Live Feed';

  if (global.LiamPriceFeed) {
    const live = await global.LiamPriceFeed.fetchAccuratePrices(state.config.tdApiKey);
    if (live.XAUUSD) { state.prices.XAUUSD = live.XAUUSD; updatedAny = true; }
    if (live.US100)  { state.prices.US100 = live.US100;   updatedAny = true; }
    if (live.BTCUSDT){ state.prices.BTCUSDT = live.BTCUSDT; updatedAny = true; }
    if (live.EURUSD) { state.prices.EURUSD = live.EURUSD; updatedAny = true; }
    if (live.source) sourceTag = live.source;
  }

  state.priceSourceLabel = sourceTag;
  state.lastPriceSyncMs = Date.now();
  saveState();
  renderPriceDisplays();

      if (state.activeTab === 'news') renderNewsSection();


  if (forceShowToast) {
    showToast(updatedAny ? `Harga live diperbarui (${sourceTag})` : 'Menggunakan harga kalibrasi aktif', updatedAny ? 'success' : 'info');
  }
}


  // =========================================================================
  // KALIBRASI HARGA BROKER & KALKULATOR LOT
  // =========================================================================
  function openCalibrationModal() {
    const pair = state.signal.pair || 'XAUUSD';
    const rawPrice = Number(state.prices[pair]) || 0;
    const curOffset = Number(state.priceOffsets[pair]) || 0;
    const calPrice = getCalibratedPrice(pair);
    const acc = getActiveAccount();
    const spec = global.LiamMethods.getPairSpec(pair);

    const nameEl = document.getElementById('cal-pair-name');
    const rawEl = document.getElementById('cal-raw-price');
    const offEl = document.getElementById('cal-current-offset');
    const inputEl = document.getElementById('cal-broker-price-input');
    const lotBox = document.getElementById('cal-lot-breakdown');

    if (nameEl) nameEl.textContent = pair;
    if (rawEl) rawEl.textContent = global.LiamMethods.formatPrice(pair, rawPrice);
    if (offEl) offEl.textContent = (curOffset >= 0 ? '+' : '') + global.LiamMethods.formatPrice(pair, curOffset);
    if (inputEl) inputEl.value = global.LiamMethods.formatPrice(pair, calPrice);

    if (lotBox && acc) {
      const riskDollar = ((Number(acc.equity) || Number(acc.balance) || 1000) * (Number(acc.riskPct) || 0.4)) / 100;
      const sampleSlPips = pair === 'XAUUSD' ? 35 : pair === 'US100' ? 45 : pair === 'BTCUSDT' ? 220 : 18;
      const calcLot = Math.min(
        Number(acc.maxLot) || 0.5,
        Math.max(0.01, Math.floor((riskDollar / (sampleSlPips * spec.pipValuePerLot)) * 100) / 100)
      );
      lotBox.innerHTML = `
        <div><strong>Akun Aktif:</strong> ${acc.name} (Equity $${Number(acc.equity).toFixed(2)}, Risk ${acc.riskPct}%)</div>
        <div><strong>Target Risiko / Trade:</strong> $${riskDollar.toFixed(2)} • <strong>Hard Lot Max:</strong> ${acc.maxLot}</div>
        <div><strong>Estimasi Lot (SL ${sampleSlPips} pips):</strong> <span class="font-mono font-bold text-cyan-400">${calcLot.toFixed(2)} Lot</span></div>
      `;
    }

    openModal('modal-calibration');
  }

  function applyBrokerPriceCalibration() {
    const pair = state.signal.pair || 'XAUUSD';
    const inputEl = document.getElementById('cal-broker-price-input');
    if (!inputEl) return;

    const targetBrokerPrice = Number(inputEl.value);
    const rawPrice = Number(state.prices[pair]);
    if (!Number.isFinite(targetBrokerPrice) || targetBrokerPrice <= 0) {
      showToast('Masukkan harga broker yang valid!', 'error');
      return;
    }

    state.priceOffsets[pair] = Number((targetBrokerPrice - rawPrice).toFixed(6));
    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
    closeModal('modal-calibration');
    showToast(`Kalibrasi ${pair} diterapkan ke ${global.LiamMethods.formatPrice(pair, targetBrokerPrice)}`, 'success');
  }

  function resetBrokerPriceCalibration() {
    const pair = state.signal.pair || 'XAUUSD';
    state.priceOffsets[pair] = 0;
    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
    closeModal('modal-calibration');
    showToast(`Offset kalibrasi ${pair} direset ke 0`, 'info');
  }

  // =========================================================================
  // BERANDA: CIRCUIT BREAKER, SOP CHECKLIST & PROP FIRM PORTFOLIO
  // =========================================================================
  function getActiveAccount() {
    return state.accounts.find((a) => a.id === state.activeAccountId) || state.accounts[0];
  }

  function switchActiveAccount(accountId) {
    state.activeAccountId = accountId;
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    const acc = getActiveAccount();
    if (acc) showToast(`Akun aktif: ${acc.name}`, 'info');
  }

  function adjustAccountLimit(field, delta) {
    const acc = getActiveAccount();
    if (!acc) return;
    const currentVal = Number(acc[field]) || 2;
    acc[field] = Math.max(1, Math.min(20, currentVal + delta));
    saveState();
    renderHomeSection();
  }

  function adjustAccountCounter(field, delta) {
    const acc = getActiveAccount();
    if (!acc) return;
    const prevVal = Number(acc[field]) || 0;
    const nextVal = Math.max(0, prevVal + delta);
    acc[field] = nextVal;

    if (field === 'curSl' && delta > 0) {
      triggerAntiRevengeCooldown(20);
      if (nextVal >= (Number(acc.maxSl) || 2)) {
        showToast(`🛑 Batas Max SL Harian (${acc.maxSl}) tercapai pada ${acc.name}!`, 'error');
      }
    } else if (field === 'curEntry' && delta > 0) {
      if (nextVal >= (Number(acc.maxEntry) || 2)) {
        showToast(`⚠️ Kuota Max Entry Harian (${acc.maxEntry}) pada ${acc.name} telah penuh.`, 'warn');
      }
    }

    saveState();
    renderHomeSection();
  }

  function resetAllAccountsDailyTrackers(silent = false) {
    state.accounts.forEach((acc) => {
      acc.curEntry = 0;
      acc.curSl = 0;
    });
    state.cooldownUntilMs = 0;
    saveState();
    renderHomeSection();
    if (!silent) showToast('Counter Entry & SL harian semua akun direset ke 0.', 'success');
  }

  // SOP Checklist
  function getSopProgress() {
    const items = state.sopItems || [];
    if (items.length === 0) return { checked: 0, total: 0, percent: 0, scoreBonus: 0 };
    const checkedCount = items.filter((i) => i.checked).length;
    const percent = Math.round((checkedCount / items.length) * 100);
    const scoreBonus = Number(((checkedCount / items.length) * 0.6).toFixed(1));
    return { checked: checkedCount, total: items.length, percent, scoreBonus };
  }

  function toggleSopItem(id) {
    const item = state.sopItems.find((i) => i.id === id);
    if (!item) return;
    item.checked = !item.checked;
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
  }

  function addCustomSopItem() {
    const input = document.getElementById('new-sop-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      showToast('Isi teks aturan SOP terlebih dahulu.', 'warn');
      return;
    }
    state.sopItems.push({
      id: 'sop-' + Date.now(),
      text,
      checked: true
    });
    input.value = '';
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    showToast('Aturan SOP kustom ditambahkan.', 'success');
  }

  function removeSopItem(id, ev) {
    if (ev) ev.stopPropagation();
    state.sopItems = state.sopItems.filter((i) => i.id !== id);
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
  }

  function resetSopChecklist() {
    state.sopItems.forEach((i) => {
      i.checked = false;
    });
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    showToast('Checklist SOP direset.', 'info');
  }

  // Prop Firm Portfolio CRUD
  function toggleAddAccountDrawer() {
    const drawer = document.getElementById('add-account-drawer');
    const arrow = document.getElementById('add-account-arrow');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden', !isHidden);
    if (arrow) arrow.textContent = isHidden ? 'Tutup' : 'Buka';
  }

  function saveNewPropAccount() {
    const name = (document.getElementById('new-acc-name')?.value || '').trim();
    const firm = (document.getElementById('new-acc-firm')?.value || 'Prop Firm').trim();
    const balance = Number(document.getElementById('new-acc-balance')?.value) || 5000;
    const riskPct = Number(document.getElementById('new-acc-risk')?.value) || 0.5;
    const maxLot = Number(document.getElementById('new-acc-maxlot')?.value) || 0.5;
    const dailyDdPct = Number(document.getElementById('new-acc-dailydd')?.value) || 4;
    const maxDdPct = Number(document.getElementById('new-acc-maxdd')?.value) || 8;
    const targetPct = Number(document.getElementById('new-acc-target')?.value) || 8;
    const maxEntry = Number(document.getElementById('new-acc-maxentry')?.value) || 2;
    const maxSl = Number(document.getElementById('new-acc-maxsl')?.value) || 2;
    const notes = (document.getElementById('new-acc-notes')?.value || '').trim();

    if (!name) {
      showToast('Masukkan nama akun Prop Firm!', 'error');
      return;
    }

    const newAcc = {
      id: 'acc-' + Date.now(),
      name,
      firm,
      balance,
      equity: balance,
      riskPct,
      maxLot,
      dailyDdPct,
      maxDdPct,
      targetPct,
      minBuffer: Math.round(balance * 0.025),
      maxEntry,
      maxSl,
      curEntry: 0,
      curSl: 0,
      winrate: 70,
      myfxbookId: '',
      notes
    };

    state.accounts.push(newAcc);
    state.activeAccountId = newAcc.id;
    saveState();

    document.getElementById('new-acc-name').value = '';
    document.getElementById('new-acc-notes').value = '';
    toggleAddAccountDrawer();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    showToast(`Akun ${name} berhasil ditambahkan!`, 'success');
  }

  function openEditAccountModal(accountId) {
    const acc = state.accounts.find((a) => a.id === accountId);
    if (!acc) return;

    document.getElementById('edit-acc-id').value = acc.id;
    document.getElementById('edit-acc-name').value = acc.name;
    document.getElementById('edit-acc-firm').value = acc.firm;
    document.getElementById('edit-acc-balance').value = acc.balance;
    document.getElementById('edit-acc-equity').value = acc.equity;
    document.getElementById('edit-acc-risk').value = acc.riskPct;
    document.getElementById('edit-acc-maxlot').value = acc.maxLot;
    document.getElementById('edit-acc-dailydd').value = acc.dailyDdPct;
    document.getElementById('edit-acc-maxdd').value = acc.maxDdPct;
    document.getElementById('edit-acc-target').value = acc.targetPct;
    document.getElementById('edit-acc-buffer').value = acc.minBuffer || 0;
    document.getElementById('edit-acc-maxentry').value = acc.maxEntry || 2;
    document.getElementById('edit-acc-maxsl').value = acc.maxSl || 2;
    document.getElementById('edit-acc-myfxbook').value = acc.myfxbookId || '';
    document.getElementById('edit-acc-notes').value = acc.notes || '';

    openModal('modal-edit-account');
  }

  function saveEditedAccount() {
    const id = document.getElementById('edit-acc-id').value;
    const acc = state.accounts.find((a) => a.id === id);
    if (!acc) return;

    acc.name = (document.getElementById('edit-acc-name').value || acc.name).trim();
    acc.firm = (document.getElementById('edit-acc-firm').value || acc.firm).trim();
    acc.balance = Number(document.getElementById('edit-acc-balance').value) || acc.balance;
    acc.equity = Number(document.getElementById('edit-acc-equity').value) || acc.equity;
    acc.riskPct = Number(document.getElementById('edit-acc-risk').value) || acc.riskPct;
    acc.maxLot = Number(document.getElementById('edit-acc-maxlot').value) || acc.maxLot;
    acc.dailyDdPct = Number(document.getElementById('edit-acc-dailydd').value) || acc.dailyDdPct;
    acc.maxDdPct = Number(document.getElementById('edit-acc-maxdd').value) || acc.maxDdPct;
    acc.targetPct = Number(document.getElementById('edit-acc-target').value) || acc.targetPct;
    acc.minBuffer = Number(document.getElementById('edit-acc-buffer').value) || 0;
    acc.maxEntry = Number(document.getElementById('edit-acc-maxentry').value) || 2;
    acc.maxSl = Number(document.getElementById('edit-acc-maxsl').value) || 2;
    acc.myfxbookId = (document.getElementById('edit-acc-myfxbook').value || '').trim();
    acc.notes = (document.getElementById('edit-acc-notes').value || '').trim();

    saveState();
    closeModal('modal-edit-account');
    renderHomeSection();
    recalculateAndRenderSignal(false);
    showToast(`Data akun ${acc.name} diperbarui!`, 'success');
  }

  function deleteEditedAccount() {
    const id = document.getElementById('edit-acc-id').value;
    if (state.accounts.length <= 1) {
      showToast('Minimal harus ada 1 akun Prop Firm aktif.', 'warn');
      return;
    }
    state.accounts = state.accounts.filter((a) => a.id !== id);
    if (state.activeAccountId === id) {
      state.activeAccountId = state.accounts[0].id;
    }
    saveState();
    closeModal('modal-edit-account');
    renderHomeSection();
    recalculateAndRenderSignal(false);
    showToast('Akun Prop Firm dihapus.', 'info');
  }

  function renderHomeSection() {
    const acc = getActiveAccount();
    if (!acc) return;

    const selectEl = document.getElementById('active-account-select');
    if (selectEl) {
      selectEl.innerHTML = state.accounts
        .map((a) => {
          const pnl = Number(a.equity) - Number(a.balance);
          const sign = pnl >= 0 ? '+' : '';
          return `<option value="${a.id}" ${a.id === acc.id ? 'selected' : ''}>${a.name} — $${Number(a.equity).toFixed(2)} (${sign}$${pnl.toFixed(2)})</option>`;
        })
        .join('');
    }

    const maxEntry = Number(acc.maxEntry) || 2;
    const maxSl = Number(acc.maxSl) || 2;
    const curEntry = Number(acc.curEntry) || 0;
    const curSl = Number(acc.curSl) || 0;

    setText('disp-max-entry', maxEntry);
    setText('disp-max-entry-2', maxEntry);
    setText('disp-cur-entry', curEntry);
    setText('disp-max-sl', maxSl);
    setText('disp-max-sl-2', maxSl);
    setText('disp-cur-sl', curSl);

    const sop = getSopProgress();
    setText('sop-score-boost', `+${sop.scoreBonus.toFixed(1)} Score`);
    setText('sop-percent-badge', `${sop.percent}%`);

    const sopListEl = document.getElementById('sop-list-container');
    if (sopListEl) {
      sopListEl.innerHTML = state.sopItems
        .map(
          (item) => `
          <div onclick="toggleSopItem('${item.id}')"
            class="cursor-pointer rounded-xl p-3 border transition flex items-start justify-between gap-2.5 ${
              item.checked
                ? 'bg-emerald-950/35 border-emerald-500/45 text-white'
                : 'bg-slate-900/75 border-slate-800 text-slate-300'
            }">
            <div class="flex items-start gap-2.5 min-w-0">
              <span class="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-xs font-extrabold shrink-0 ${
                item.checked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 border border-slate-600 text-transparent'
              }">✓</span>
              <span class="text-xs leading-relaxed ${item.checked ? 'line-through opacity-85' : ''}">${item.text}</span>
            </div>
            <button type="button" onclick="removeSopItem('${item.id}', event)" title="Hapus SOP"
              class="text-slate-500 hover:text-rose-400 text-xs font-bold px-1 shrink-0">✕</button>
          </div>`
        )
        .join('');
    }

    const totalBalance = state.accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const totalEquity = state.accounts.reduce((sum, a) => sum + (Number(a.equity) || 0), 0);
    const netPnl = totalEquity - totalBalance;
    const avgWr = Math.round(
      state.accounts.reduce((sum, a) => sum + (Number(a.winrate) || 70), 0) / Math.max(1, state.accounts.length)
    );

    setText('portfolio-total-equity', `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const netEl = document.getElementById('portfolio-net-profit');
    if (netEl) {
      netEl.textContent = `${netPnl >= 0 ? '+' : '-'}$${Math.abs(netPnl).toFixed(2)}`;
      netEl.className = `text-sm font-mono font-extrabold mt-0.5 ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    setText('portfolio-avg-winrate', `${avgWr}%`);

    const accListEl = document.getElementById('prop-accounts-list');
    if (accListEl) {
      accListEl.innerHTML = state.accounts
        .map((a) => {
          const eq = Number(a.equity) || 0;
          const bal = Number(a.balance) || 1;
          const pnl = eq - bal;
          const pnlPct = ((pnl / bal) * 100).toFixed(2);
          const dailyDdDollar = (bal * (Number(a.dailyDdPct) || 4)) / 100;
          const maxDdDollar = (bal * (Number(a.maxDdPct) || 8)) / 100;
          const targetDollar = (bal * (Number(a.targetPct) || 8)) / 100;
          const isSelected = a.id === acc.id;

          return `
            <div class="rounded-2xl p-3.5 border transition ${
              isSelected
                ? 'bg-slate-900/95 border-sky-500/60'
                : 'bg-slate-900/65 border-slate-800'
            } space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <div onclick="switchActiveAccount('${a.id}')" class="cursor-pointer min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-sm font-extrabold text-white">${a.name}</span>
                    ${isSelected ? '<span class="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] font-extrabold">AKTIF</span>' : ''}
                  </div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                    ${a.firm} • Risk ${a.riskPct}% • Max Lot ${a.maxLot}
                  </div>
                </div>
                <button type="button" onclick="openEditAccountModal('${a.id}')"
                  class="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-sky-300 active:scale-95 shrink-0">
                  ✏️ Edit Saldo
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <span class="text-[9px] text-slate-400 block">EQUITY</span>
                  <strong class="text-white">$${eq.toFixed(2)}</strong>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 block">GAIN / LOSS</span>
                  <strong class="${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)} (${pnlPct}%)</strong>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 block">TARGET (${a.targetPct}%)</span>
                  <strong class="text-cyan-400">+$${targetDollar.toFixed(0)}</strong>
                </div>
              </div>

              <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/70 rounded-xl px-2.5 py-1.5">
                <span>Daily DD Guard: <strong class="text-amber-300">$${dailyDdDollar.toFixed(0)} (${a.dailyDdPct}%)</strong></span>
                <span>Max DD: <strong class="text-rose-300">$${maxDdDollar.toFixed(0)} (${a.maxDdPct}%)</strong></span>
              </div>

              ${a.notes ? `<p class="text-[11px] text-slate-400 italic">Catatan: ${a.notes}</p>` : ''}
            </div>`;
        })
        .join('');
    }
  }

  // =========================================================================
  // NEWS ENGINE: KALENDER EKONOMI FULL, SCAN PELUANG, EKSEKUSI & TELEGRAM
  // =========================================================================
  function setNewsPeriodFilter(period) {
    state.news.period = period;
    saveState();
    renderNewsSection();
  }

  function setNewsImpactFilter(impact) {
    state.news.impact = impact;
    saveState();
    renderNewsSection();
  }

  function setNewsPairFilter(pair) {
    state.news.pair = pair;
    saveState();
    renderNewsSection();
  }

  async function syncNewsEngine(forceToast = false) {
    const statusEl = document.getElementById('news-sync-status');
    if (statusEl) statusEl.textContent = '● Menyinkronkan Kalender & Macro Wire...';

    const wireItems = await global.LiamNews.fetchLiveMacroWire();
    state.news.wire = wireItems;
    saveState();

    if (statusEl) {
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      statusEl.textContent = `● Kalender Terverifikasi + Live Wire (${nowTime} WIB)`;
    }

    renderNewsSection();
    if (forceToast) showToast('Kalender Ekonomi & Macro Wire diperbarui!', 'success');
  }

  function getFilteredNewsEvents() {
    const allEvents = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    const dates = global.LiamNews.getWibTodayStrings();
    const period = state.news.period || 'today';
    const impact = state.news.impact || 'all';
    const pair = state.news.pair || 'ALL';

    return allEvents.filter((evt) => {
      let dateOk = true;
      if (period === 'today') {
        dateOk = evt.dateStr === dates.today;
      } else if (period === 'week') {
        dateOk = evt.dateStr <= dates.day6;
      } else if (period === 'month') {
        dateOk = evt.dateStr <= dates.day18;
      }

      const impactOk = impact === 'all' || evt.impact === impact;
      const pairOk = pair === 'ALL' || evt.affectedPairs.includes(pair);

      return dateOk && impactOk && pairOk;
    });
  }

  function renderNewsSection() {
    document.querySelectorAll('.news-period-btn').forEach((btn) => {
      const active = btn.getAttribute('data-news-period') === state.news.period;
      btn.className = active
        ? 'news-period-btn py-2 rounded-xl text-xs font-bold bg-blue-600 text-white'
        : 'news-period-btn py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300';
    });

    document.querySelectorAll('.news-impact-btn').forEach((btn) => {
      const imp = btn.getAttribute('data-news-impact');
      const active = imp === state.news.impact;
      const baseColor = imp === 'high' ? 'text-rose-300' : imp === 'medium' ? 'text-amber-300' : 'text-slate-300';
      btn.className = active
        ? 'news-impact-btn py-2 rounded-xl text-xs font-bold bg-blue-600 text-white'
        : `news-impact-btn py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 ${baseColor}`;
    });

    document.querySelectorAll('.news-pair-btn').forEach((btn) => {
      const p = btn.getAttribute('data-news-pair');
      const active = p === state.news.pair;
      btn.className = active
        ? 'news-pair-btn py-1.5 rounded-lg text-[11px] font-bold bg-sky-500/20 border border-sky-400/50 text-sky-300'
        : 'news-pair-btn py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });

    const allEvents = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    const filtered = getFilteredNewsEvents();

    const summaryEl = document.getElementById('news-summary-banner');
    if (summaryEl) {
      const highCount = filtered.filter((e) => e.impact === 'high').length;
      summaryEl.innerHTML = `Menampilkan <strong>${filtered.length}</strong> agenda makro (<strong>${highCount} High Impact</strong>) untuk filter aktif. Hindari entry agresif ±15 menit menjelang rilis data merah.`;
    }

    const bestEvt = global.LiamNews.pickBestNewsOpportunity(filtered.length > 0 ? filtered : allEvents, state.news.pair);
    const bestContentEl = document.getElementById('best-news-content');
    if (bestContentEl && bestEvt) {
      const dirBadge = bestEvt.verdictDirection === 'BUY'
        ? '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-extrabold">BUY</span>'
        : '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-extrabold">SELL</span>';

      bestContentEl.innerHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <strong class="text-white text-sm">${bestEvt.title} (${bestEvt.timeWib})</strong>
          <div class="flex items-center gap-1.5 text-[11px]">
            <span class="font-mono font-bold text-cyan-300">${bestEvt.verdictPair}</span>
            ${dirBadge}
          </div>
        </div>
        <p class="text-slate-300 mt-1">${bestEvt.verdictSummary}</p>
        <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
          <span class="text-[11px] font-mono text-amber-300">${bestEvt.verdictConfidence}</span>
          <button type="button" onclick="applyNewsEventToSignalTab('${bestEvt.id}')"
            class="px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-extrabold active:scale-95">
            ⚡ Muat ke Terminal Signals
          </button>
        </div>
      `;
    }

    const wireListEl = document.getElementById('breaking-wire-list');
    if (wireListEl) {
      const wireData = state.news.wire && state.news.wire.length > 0
        ? state.news.wire
        : global.LiamNews.fetchLiveMacroWire ? [] : [];

      const itemsToRender = wireData.length > 0 ? wireData : [
        {
          title: 'Likuiditas Sesi Global Aktif — Pantau Reaksi Harga pada Zona POI Sebelum Entry',
          source: 'QUANT MACRO DESK',
          time: 'Live WIB',
          impactTag: 'ACTIVE'
        }
      ];

      wireListEl.innerHTML = itemsToRender
        .map(
          (w) => `
          <div class="rounded-xl bg-slate-900/85 border border-slate-800 p-3 space-y-1">
            <div class="flex items-center justify-between gap-2 text-[10px] font-mono">
              <span class="text-sky-400 font-bold">${w.source}</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">${w.impactTag} • ${w.time}</span>
            </div>
            <div class="text-xs font-bold text-slate-100 leading-snug">${w.title}</div>
          </div>`
        )
        .join('');
    }

    const eventsContainer = document.getElementById('news-events-list');
    if (!eventsContainer) return;

    if (filtered.length === 0) {
      eventsContainer.innerHTML = `
        <div class="glass-card rounded-2xl p-5 text-center space-y-2">
          <div class="text-sm font-bold text-slate-200">Tidak ada jadwal news sesuai filter ini</div>
          <p class="text-xs text-slate-400">Coba ubah periode ke "Minggu Ini" atau "Bulan Ini" untuk melihat agenda lanjutan.</p>
        </div>`;
      return;
    }

    eventsContainer.innerHTML = filtered
      .map((evt) => {
        const isHigh = evt.impact === 'high';
        const isBuy = evt.verdictDirection === 'BUY';
        const tp = evt.tradePlan || {};

        return `
          <div class="glass-card rounded-2xl p-4 space-y-3 border ${isHigh ? 'border-rose-500/35' : 'border-slate-800'}">
            <!-- Top Meta -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold ${
                  isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }">${isHigh ? '🔴 HIGH IMPACT' : '🟠 MEDIUM IMPACT'}</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[10px] font-bold text-sky-300">${evt.currency}</span>
              </div>
              <span class="text-[11px] font-mono text-slate-400">${evt.dateStr} • <strong class="text-white">${evt.timeWib}</strong></span>
            </div>

            <!-- Event Title & Affected Pairs -->
            <div>
              <h3 class="text-sm font-extrabold text-white leading-snug">${evt.title}</h3>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span class="text-[10px] text-slate-400">Pair Terdampak:</span>
                ${evt.affectedPairs
                  .map((p) => `<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-200">${p}</span>`)
                  .join('')}
              </div>
            </div>

            <!-- Forecast / Previous / Actual Grid -->
            <div class="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-slate-950/75 rounded-xl p-2.5 border border-slate-800/80">
              <div>
                <span class="text-[9px] text-slate-400 block">FORECAST</span>
                <strong class="text-sky-300">${evt.forecast}</strong>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 block">PREVIOUS</span>
                <strong class="text-slate-200">${evt.previous}</strong>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 block">ACTUAL</span>
                <strong class="text-amber-300">${evt.actual}</strong>
              </div>
            </div>

            <!-- Analisa Sementara (Single Verdict BUY/SELL) -->
            <div class="rounded-xl p-3 border ${
              isBuy ? 'bg-emerald-950/30 border-emerald-500/35' : 'bg-rose-950/30 border-rose-500/35'
            } space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">ANALISA SEMENTARA (1 ARAH)</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold ${
                  isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }">${evt.verdictPair} • ${evt.verdictDirection}</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed">${evt.verdictSummary}</p>
              <div class="text-[10px] font-mono text-amber-300">${evt.verdictConfidence}</div>
            </div>

            <!-- Fundamental Reasoning -->
            <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-1">
              <div class="text-[10px] font-extrabold uppercase text-sky-400">ANALISA FUNDAMENTAL &amp; MAKRO</div>
              <p class="text-xs text-slate-300 leading-relaxed">${evt.fundamentalReasoning}</p>
            </div>

            <!-- Dual POI Zones: Pre-News & Post-News -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="rounded-xl bg-slate-900/90 border border-amber-500/30 p-2.5 space-y-1">
                <div class="text-[10px] font-extrabold text-amber-300">${evt.poiPreNews.label}</div>
                <div class="text-xs font-mono font-extrabold text-white">${evt.poiPreNews.range}</div>
                <div class="text-[10px] text-slate-400">${evt.poiPreNews.note}</div>
              </div>
              <div class="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-2.5 space-y-1">
                <div class="text-[10px] font-extrabold text-cyan-300">${evt.poiPostNews.label}</div>
                <div class="text-xs font-mono font-extrabold text-white">${evt.poiPostNews.range}</div>
                <div class="text-[10px] text-slate-400">${evt.poiPostNews.note}</div>
              </div>
            </div>

            <!-- News Trade Plan Levels & Action Buttons -->
            ${
              tp.entry
                ? `
                <div class="rounded-xl bg-slate-950/85 border border-slate-800 p-2.5 font-mono text-[11px] flex items-center justify-between gap-2 flex-wrap">
                  <span>Entry: <strong class="text-sky-400">${tp.entry}</strong></span>
                  <span>SL: <strong class="text-rose-400">${tp.sl}</strong></span>
                  <span>TP1: <strong class="text-emerald-400">${tp.tp1}</strong></span>
                  <span>TP2: <strong class="text-emerald-300">${tp.tp2}</strong></span>
                </div>`
                : ''
            }

            <div class="grid grid-cols-3 gap-2 pt-0.5">
              <button type="button" onclick="executeNewsPlanToJournal('${evt.id}')"
                class="py-2 rounded-xl bg-blue-600 text-white text-[11px] font-extrabold active:scale-95">
                ⚡ Ambil ${evt.verdictDirection}
              </button>
              <button type="button" onclick="copyNewsEventPlan('${evt.id}')"
                class="py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold active:scale-95">
                📋 Copy Plan
              </button>
              <button type="button" onclick="sendNewsEventToTelegram('${evt.id}')"
                class="py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-extrabold active:scale-95">
                📨 Kirim Tele
              </button>
            </div>
          </div>`;
      })
      .join('');
  }

  function findNewsEventById(id) {
    const events = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    return events.find((e) => e.id === id) || events[0];
  }

  function applyNewsEventToSignalTab(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    if (evt.verdictPair && global.LiamMethods.PAIR_SPECS[evt.verdictPair]) {
      state.signal.pair = evt.verdictPair;
    }
    saveState();
    switchMainTab('signals');
    showToast(`Pair sinyal diarahkan ke ${evt.verdictPair} (${evt.title})`, 'info');
  }

  function copyNewsEventPlan(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    const tp = evt.tradePlan || {};
    const txt = [
      `📰 NEWS PLAN: ${evt.title} (${evt.timeWib})`,
      `Pair: ${evt.verdictPair} | Arah: ${evt.verdictDirection}`,
      `Forecast: ${evt.forecast} | Prev: ${evt.previous}`,
      `Pre-News POI: ${evt.poiPreNews.range}`,
      `Post-News POI: ${evt.poiPostNews.range}`,
      tp.entry ? `Entry: ${tp.entry} | SL: ${tp.sl} | TP1: ${tp.tp1} | TP2: ${tp.tp2}` : ''
    ]
      .filter(Boolean)
      .join('\n');
    copyTextValue(txt, 'Rencana News');
  }

  function executeNewsPlanToJournal(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    if (!canExecuteNewTrade()) return;

    const acc = getActiveAccount();
    const tp = evt.tradePlan || {};
    const pair = evt.verdictPair || 'XAUUSD';

    const logEntry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      timeLabel: formatWibShortTime(),
      accountId: acc ? acc.id : '',
      accountName: acc ? acc.name : 'Default',
      pair,
      timeframe: 'NEWS',
      methodLabel: `News Quant (${evt.title.slice(0, 28)})`,
      direction: evt.verdictDirection,
      orderType: `${evt.verdictDirection} STOP/LIMIT`,
      entry: tp.entry || global.LiamMethods.formatPrice(pair, getCalibratedPrice(pair)),
      sl: tp.sl || '--',
      tp1: tp.tp1 || '--',
      tp2: tp.tp2 || '--',
      tp3: '--',
      slPips: 35,
      tp1Pips: 45,
      tp2Pips: 85,
      lot: acc ? Math.min(Number(acc.maxLot) || 0.1, 0.05) : 0.02,
      status: 'active',
      outcome: null,
      pipsResult: 0
    };

    state.tradeLogs.unshift(logEntry);
    if (acc) acc.curEntry = (Number(acc.curEntry) || 0) + 1;
    saveState();
    renderHomeSection();
    renderPerformanceAndLogs();
    showToast(`Setup News ${pair} ${evt.verdictDirection} dicatat ke Jurnal!`, 'success');
  }

  async function sendNewsEventToTelegram(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    const tp = evt.tradePlan || {};
    const msg = [
      `🚨 <b>XLIAMVR NEWS QUANT ALERT</b>`,
      `📌 Event: <b>${escapeHtml(evt.title)}</b>`,
      `🕒 Jadwal: <code>${evt.dateStr} ${evt.timeWib}</code> (${evt.currency})`,
      `📊 Forecast: <code>${evt.forecast}</code> | Prev: <code>${evt.previous}</code>`,
      `🎯 Bias: <b>${evt.verdictPair} — ${evt.verdictDirection}</b> (${evt.verdictConfidence})`,
      tp.entry ? `📍 Entry: <code>${tp.entry}</code> | SL: <code>${tp.sl}</code> | TP1: <code>${tp.tp1}</code> | TP2: <code>${tp.tp2}</code>` : '',
      `💡 <i>${escapeHtml(evt.verdictSummary)}</i>`
    ]
      .filter(Boolean)
      .join('\n');

    await dispatchTelegramMessage(msg, true);
  }

  // =========================================================================
  // SIGNALS ENGINE, NEWS SNIPER & INTERACTIVE POI EDUCATION
  // =========================================================================
  function canExecuteNewTrade() {
    if (!state.config.engineMasterActive) {
      showToast('Mesin sinyal sedang dijeda oleh Owner di tab Profil.', 'warn');
      return false;
    }
    if (state.flags.blockOnCooldown && state.cooldownUntilMs > Date.now()) {
      showToast('🧊 Masih dalam masa Anti-Revenge Cooldown! Tunggu atau lewati dulu.', 'warn');
      return false;
    }
    if (state.flags.requireSop100) {
      const sop = getSopProgress();
      if (sop.percent < 100) {
        showToast(`SOP baru ${sop.percent}%. Centang 100% SOP terlebih dahulu!`, 'warn');
        return false;
      }
    }
    const acc = getActiveAccount();
    if (acc && (Number(acc.curSl) || 0) >= (Number(acc.maxSl) || 2)) {
      showToast(`🛑 Batas Max SL Harian (${acc.maxSl}) akun ${acc.name} sudah tercapai!`, 'error');
      return false;
    }
    return true;
  }

  function selectSignalPair(pair) {
    if (!global.LiamMethods.PAIR_SPECS[pair]) return;
    state.signal.pair = pair;
    state.signal.expiryEndMs = Date.now() + (global.LiamMethods.TF_MULTIPLIERS[state.signal.timeframe]?.expiryMin || 45) * 60000;
    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(true);
  }

  function selectSignalTimeframe(tf) {
    if (!global.LiamMethods.TF_MULTIPLIERS[tf]) return;
    state.signal.timeframe = tf;
    state.signal.expiryEndMs = Date.now() + global.LiamMethods.TF_MULTIPLIERS[tf].expiryMin * 60000;
    saveState();
    recalculateAndRenderSignal(true);
  }

  function selectSignalMethod(methodKey) {
    if (!global.LiamMethods.METHOD_CATALOG[methodKey]) return;
    state.signal.method = methodKey;
    saveState();
    recalculateAndRenderSignal(true);
    showToast(`Metode: ${global.LiamMethods.METHOD_CATALOG[methodKey].name}`, 'info');
  }

  function forceRescanSignal() {
    state.signal.scanSeed = (Number(state.signal.scanSeed) || 1) + 1;
    state.signal.expiryEndMs = Date.now() + (global.LiamMethods.TF_MULTIPLIERS[state.signal.timeframe]?.expiryMin || 45) * 60000;
    saveState();
    recalculateAndRenderSignal(true);
    showToast(`Struktur ${state.signal.pair} (${state.signal.timeframe}) di-scan ulang!`, 'success');
  }

  function toggleSignalFilterDrawer() {
    const drawer = document.getElementById('signal-filter-drawer');
    if (drawer) drawer.classList.toggle('hidden');
  }

  function saveTerminalGuardPrefs() {
    const chkSop = document.getElementById('chk-require-sop');
    const chkCd = document.getElementById('chk-require-cooldown');
    if (chkSop) state.flags.requireSop100 = chkSop.checked;
    if (chkCd) state.flags.blockOnCooldown = chkCd.checked;
    saveState();
    showToast('Filter perlindungan eksekusi disimpan.', 'info');
  }

  function toggleTerminalFlag(flagName) {
    state.flags[flagName] = !state.flags[flagName];
    saveState();
    syncFilterButtonsUI();
    recalculateAndRenderSignal(false);
    showToast(`${flagName}: ${state.flags[flagName] ? 'ON' : 'OFF'}`, 'info');
  }

  function toggleSignalAlertMode() {
    state.flags.signalAlert = !state.flags.signalAlert;
    saveState();
    syncFilterButtonsUI();
    showToast(`Alert Sinyal: ${state.flags.signalAlert ? 'ON' : 'OFF'}`, 'info');
  }

  function toggleNewsSniperMode() {
    state.flags.newsSniper = !state.flags.newsSniper;
    saveState();
    syncFilterButtonsUI();
    renderNewsSniperPanel();
    showToast(`News Sniper Mode: ${state.flags.newsSniper ? 'AKTIF' : 'OFF'}`, state.flags.newsSniper ? 'success' : 'info');
    if (state.flags.newsSniper && state.config.tgAutoNews) {
      dispatchNewsSniperTelegram(false);
    }
  }

  function syncFilterButtonsUI() {
    const alertBtn = document.getElementById('btn-signal-alert-toggle');
    if (alertBtn) {
      alertBtn.textContent = state.flags.signalAlert ? '● ALERT: ON' : '○ ALERT: OFF';
      alertBtn.className = state.flags.signalAlert
        ? 'px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold active:scale-95'
        : 'px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold active:scale-95';
    }

    const nsBtn = document.getElementById('btn-news-shield');
    if (nsBtn) {
      nsBtn.textContent = state.flags.newsShield ? '🛡️ News Shield: ON' : '🛡️ News Shield: OFF';
      nsBtn.className = state.flags.newsShield
        ? 'px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const mfBtn = document.getElementById('btn-monday-filter');
    if (mfBtn) {
      mfBtn.textContent = state.flags.mondayFilter ? '📅 Monday Filter: ON' : '📅 Monday Filter: OFF';
      mfBtn.className = state.flags.mondayFilter
        ? 'px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const mornBtn = document.getElementById('btn-morning-filter');
    if (mornBtn) {
      mornBtn.textContent = state.flags.morningFilter ? '🌅 Filter Pagi: ON' : '🌅 Filter Pagi: OFF';
      mornBtn.className = state.flags.morningFilter
        ? 'px-2.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const sniperBtn = document.getElementById('btn-news-sniper-toggle');
    if (sniperBtn) {
      sniperBtn.textContent = state.flags.newsSniper ? 'News Sniper: ON' : 'News Sniper: OFF';
      sniperBtn.className = state.flags.newsSniper
        ? 'px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold shrink-0 active:scale-95'
        : 'px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-[11px] font-extrabold shrink-0 active:scale-95';
    }

    const shieldBar = document.getElementById('news-shield-status-bar');
    if (shieldBar) {
      const ctx = global.LiamMethods.getWibContext();
      let extraMsg = '';
      if (state.flags.mondayFilter && ctx.day === 1) {
        extraMsg += ' • <strong>Monday Filter Aktif:</strong> Hari Senin awal, tunggu pembentukan range yang matang.';
      }
      if (state.flags.morningFilter && ctx.hour >= 5 && ctx.hour < 12) {
        extraMsg += ' • <strong>Filter Pagi Aktif:</strong> Sesi pagi WIB likuiditas masih tipis.';
      }
      shieldBar.innerHTML = state.flags.newsShield
        ? `🛡️ <strong>News Shield Aktif:</strong> Terminal memantau jadwal High Impact USD/EUR di tab News. Hindari entry ±15 menit saat rilis data merah.${extraMsg}`
        : `⚠️ <strong>News Shield Nonaktif:</strong> Pastikan kamu mengecek kalender rilis berita secara manual sebelum entry.${extraMsg}`;
    }
  }

  function buildNewsSniperSetup() {
    const events = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    const activeEvt = events.find((e) => e.impact === 'high') || events[0];
    const pair = activeEvt.verdictPair || state.signal.pair || 'XAUUSD';
    const live = getCalibratedPrice(pair);
    const spec = global.LiamMethods.getPairSpec(pair);
    const isBuy = activeEvt.verdictDirection === 'BUY';

    const slDist = pair === 'XAUUSD' ? 7.5 : pair === 'US100' ? 75 : pair === 'BTCUSDT' ? 650 : 0.0022;
    const tpDist = slDist * 2.2;

    const entry = live;
    const sl = isBuy ? live - slDist : live + slDist;
    const tp = isBuy ? live + tpDist : live - tpDist;

    return {
      event: activeEvt,
      pair,
      direction: activeEvt.verdictDirection,
      entryFmt: entry.toFixed(spec.decimals),
      slFmt: sl.toFixed(spec.decimals),
      tpFmt: tp.toFixed(spec.decimals),
      rationale: `${activeEvt.title} (${activeEvt.timeWib}) — ${activeEvt.verdictSummary}`
    };
  }

  function renderNewsSniperPanel() {
    const panel = document.getElementById('news-sniper-live-panel');
    if (!panel) return;
    if (!state.flags.newsSniper) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    const ns = buildNewsSniperSetup();
    setText('news-sniper-event-title', `${ns.event.title} • ${ns.event.timeWib}`);
    const badge = document.getElementById('news-sniper-direction-badge');
    if (badge) {
      badge.textContent = `${ns.direction} ${ns.pair}`;
      badge.className = `px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
        ns.direction === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
      }`;
    }
    setText('news-sniper-rationale', ns.rationale);
    setText('news-sniper-entry', ns.entryFmt);
    setText('news-sniper-sl', ns.slFmt);
    setText('news-sniper-tp', ns.tpFmt);
  }

  async function dispatchNewsSniperTelegram(showFeedback = true) {
    const ns = buildNewsSniperSetup();
    const msg = [
      `⚡ <b>NEWS SNIPER AUTO-SIGNAL</b>`,
      `📰 Event: <b>${escapeHtml(ns.event.title)}</b> (${ns.event.timeWib})`,
      `🎯 Eksekusi: <b>${ns.direction} ${ns.pair}</b>`,
      `📍 Entry: <code>${ns.entryFmt}</code>`,
      `🛑 SL: <code>${ns.slFmt}</code>`,
      `🎯 TP: <code>${ns.tpFmt}</code>`,
      `📌 <i>${escapeHtml(ns.rationale)}</i>`
    ].join('\n');

    await dispatchTelegramMessage(msg, showFeedback);
  }

  function recalculateAndRenderSignal(allowAutoTelegram = false) {
    document.querySelectorAll('.pair-select-btn').forEach((btn) => {
      const p = btn.getAttribute('data-pair');
      const active = p === state.signal.pair;
      btn.className = active
        ? 'pair-select-btn rounded-xl p-2 bg-blue-600 text-white text-center border border-blue-400/60 transition active:scale-95'
        : 'pair-select-btn rounded-xl p-2 bg-slate-900 text-slate-300 text-center border border-slate-800 transition active:scale-95';
    });

    document.querySelectorAll('.tf-select-btn').forEach((btn) => {
      const tf = btn.getAttribute('data-tf');
      const active = tf === state.signal.timeframe;
      btn.className = active
        ? 'tf-select-btn py-2 rounded-xl text-xs font-extrabold bg-cyan-500 text-slate-950'
        : 'tf-select-btn py-2 rounded-xl text-xs font-extrabold bg-slate-900 border border-slate-800 text-slate-400';
    });

    const methodSelect = document.getElementById('signal-method-select');
    if (methodSelect) methodSelect.value = state.signal.method;

    const sop = getSopProgress();
    const livePrice = getCalibratedPrice(state.signal.pair);
    const acc = getActiveAccount();
    let sig = null;
    try {
      sig = global.LiamMethods.buildSignalSetup({
        pair: state.signal.pair,
        timeframe: state.signal.timeframe,
        method: state.signal.method,
        livePrice,
        scanSeed: state.signal.scanSeed,
        sopScoreBonus: sop.scoreBonus
      });
    } catch (_) {
      sig = null;
    }

    if (!sig || !sig.entryFmt || sig.entryFmt === '--') {
      const pair = state.signal.pair || 'XAUUSD';
      const dec = pair === 'EURUSD' ? 5 : 2;
      const isBuy = (Number(state.signal.scanSeed) || 1) % 2 === 1;
      const slDist = pair === 'XAUUSD' ? 8.5 : pair === 'US100' ? 65 : pair === 'BTCUSDT' ? 550 : 0.0020;
      const entryNum = isBuy ? livePrice - slDist * 0.4 : livePrice + slDist * 0.4;
      const slNum = isBuy ? entryNum - slDist : entryNum + slDist;
      const tp1Num = isBuy ? entryNum + slDist * 1.3 : entryNum - slDist * 1.3;
      const tp2Num = isBuy ? entryNum + slDist * 2.2 : entryNum - slDist * 2.2;
      const tp3Num = isBuy ? entryNum + slDist * 3.2 : entryNum - slDist * 3.2;
      const zMin = Math.min(entryNum, livePrice);
      const zMax = Math.max(entryNum, livePrice);
      const pipFactor = pair === 'EURUSD' ? 10000 : 10;
      const slPipsCalc = Math.max(10, Math.round(Math.abs(entryNum - slNum) * pipFactor));
      const tp1PipsCalc = Math.max(15, Math.round(Math.abs(tp1Num - entryNum) * pipFactor));
      const tp2PipsCalc = Math.max(25, Math.round(Math.abs(tp2Num - entryNum) * pipFactor));
      const tp3PipsCalc = Math.max(40, Math.round(Math.abs(tp3Num - entryNum) * pipFactor));

      sig = {
        pair,
        timeframe: state.signal.timeframe || 'M15',
        methodKey: state.signal.method || 'auto',
        methodLabel: 'Auto Sniper (Multi-Confluence)',
        methodShortTag: 'AUTO',
        direction: isBuy ? 'BUY' : 'SELL',
        orderType: isBuy ? 'BUY LIMIT' : 'SELL LIMIT',
        score: Number((8.2 + sop.scoreBonus).toFixed(1)),
        zoneRangeFormatted: `${zMin.toFixed(dec)} - ${zMax.toFixed(dec)}`,
        entryFmt: entryNum.toFixed(dec),
        entryNote: isBuy ? 'Midpoint Bullish OB / FVG' : 'Midpoint Bearish OB / FVG',
        slFmt: slNum.toFixed(dec),
        slPips: slPipsCalc,
        slReason: isBuy ? 'Di bawah Swing Low' : 'Di atas Swing High',
        tp1Fmt: tp1Num.toFixed(dec),
        tp1Pips: tp1PipsCalc,
        tp1Reason: '1:1.3 Internal High/Low',
        tp2Fmt: tp2Num.toFixed(dec),
        tp2Pips: tp2PipsCalc,
        tp2Reason: '1:2.2 Equilibrium',
        tp3Fmt: tp3Num.toFixed(dec),
        tp3Pips: tp3PipsCalc,
        tp3Reason: '1:3.2+ HTF Pool',
        poiSummary: `Struktur ${pair} terdeteksi di area ${isBuy ? 'Discount' : 'Premium'} dengan konfluensi likuiditas sesi aktif.`,
        educationHtml: `<p><strong>${isBuy ? 'BUY LIMIT' : 'SELL LIMIT'}</strong> ditempatkan pada area POI terkonfirmasi dengan manajemen risiko terukur.</p>`
      };
    }

        let pos = { lot: 0.02, actualRiskDollar: 4.0, tp2Dollar: 8.8, wasCapped: false };
    try {
      if (global.LiamMethods && typeof global.LiamMethods.calculatePositionSize === 'function') {
        pos = global.LiamMethods.calculatePositionSize(acc || { equity: 1000, balance: 1000, riskPct: 0.4, maxLot: 0.15 }, sig);
      }
    } catch (_) {}


    const isBuy = sig.direction === 'BUY';
    const mainCard = document.getElementById('main-sniper-card');
    if (mainCard) {
      mainCard.className = `glass-card rounded-2xl p-4 border ${
        isBuy ? 'border-emerald-500/45' : 'border-rose-500/45'
      } space-y-3.5`;
    }

    setText('sig-pair-tf', `${sig.pair} • ${sig.timeframe}`);
    setText('sig-method-label', sig.methodLabel);
    setText('sig-score-label', `Score ${sig.score.toFixed(1)}/10`);

    const dirBadge = document.getElementById('sig-direction-badge');
    if (dirBadge) {
      dirBadge.textContent = isBuy ? `● ${sig.orderType}` : `● ${sig.orderType}`;
      dirBadge.className = isBuy
        ? 'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold tracking-wide shrink-0'
        : 'px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-extrabold tracking-wide shrink-0';
    }

    setText('sig-entry-zone-range', sig.zoneRangeFormatted);
    setText('sig-entry-type-label', sig.orderType);
    const entryEl = document.getElementById('sig-entry-price');
    if (entryEl) {
      entryEl.textContent = sig.entryFmt;
      entryEl.className = `text-lg font-mono font-extrabold ${isBuy ? 'text-sky-400' : 'text-amber-300'}`;
    }
    setText('sig-entry-note', sig.entryNote);

    setText('sig-sl-pips-label', `STOP LOSS (-${sig.slPips} pips)`);
    setText('sig-sl-price', sig.slFmt);
    setText('sig-sl-reason', sig.slReason);

    setText('sig-tp1-pips', `TP 1 (+${sig.tp1Pips})`);
    setText('sig-tp1-price', sig.tp1Fmt);
    setText('sig-tp1-reason', sig.tp1Reason);

    setText('sig-tp2-pips', `TP 2 (+${sig.tp2Pips})`);
    setText('sig-tp2-price', sig.tp2Fmt);
    setText('sig-tp2-reason', sig.tp2Reason);

    setText('sig-tp3-pips', `TP 3 (+${sig.tp3Pips})`);
    setText('sig-tp3-price', sig.tp3Fmt);
    setText('sig-tp3-reason', sig.tp3Reason);

    const poiSummaryEl = document.getElementById('sig-poi-summary');
    if (poiSummaryEl) {
      poiSummaryEl.innerHTML = `📐 <strong class="text-amber-300">Struktur POI:</strong> ${sig.poiSummary}`;
    }

    const eduContentEl = document.getElementById('poi-edu-content');
    if (eduContentEl) eduContentEl.innerHTML = sig.educationHtml;

    setText('sig-account-name', acc ? acc.name : 'Account');
    setText('sig-lot-risk', `Lot: ${pos.lot.toFixed(2)} (Risk ${acc ? acc.riskPct : 0.4}%)`);
    setText('sig-dollar-metrics', `Risk: -$${pos.actualRiskDollar.toFixed(2)} | TP2: +$${pos.tp2Dollar.toFixed(2)}`);

    const sopBadge = document.getElementById('sig-sop-readiness');
    if (sopBadge) {
      sopBadge.textContent = `SOP: ${sop.percent}%`;
      sopBadge.className = `px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-extrabold shrink-0 ${
        sop.percent >= 80 ? 'text-emerald-400' : sop.percent >= 40 ? 'text-amber-300' : 'text-slate-300'
      }`;
    }

    const lotWarn = document.getElementById('sig-lot-warning');
    if (lotWarn) lotWarn.classList.toggle('hidden', !pos.wasCapped);

    const stdBox = document.getElementById('standard-format-preview');
    if (stdBox && state.signal.showStandardFormat) {
      stdBox.textContent = formatSignalPlainText(currentSignalObj);
    }

    renderNewsSniperPanel();
    updateSignalExpiryTicker();

    if (allowAutoTelegram && state.config.tgAutoSignal) {
      const sigKey = `${sig.pair}|${sig.timeframe}|${sig.methodKey}|${sig.direction}|${sig.entryFmt}|${state.signal.scanSeed}`;
      if (sigKey !== lastAutoSentSignalKey) {
        lastAutoSentSignalKey = sigKey;
        sendCurrentSignalToTelegramOnly(false);
      }
    }
  }

  function updateSignalExpiryTicker() {
    const el = document.getElementById('sig-expiry-timer');
    if (!el) return;
    let remSec = Math.floor((Number(state.signal.expiryEndMs || 0) - Date.now()) / 1000);
    if (remSec <= 0) {
      const tfMin = global.LiamMethods.TF_MULTIPLIERS[state.signal.timeframe]?.expiryMin || 45;
      state.signal.expiryEndMs = Date.now() + tfMin * 60000;
      remSec = tfMin * 60;
      saveState();
    }
    const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
    const ss = String(remSec % 60).padStart(2, '0');
    el.textContent = `⏳ ${mm}:${ss}`;
  }

  function togglePoiEducationDrawer() {
    state.signal.showPoiEducation = !state.signal.showPoiEducation;
    saveState();
    const drawer = document.getElementById('poi-education-drawer');
    const badge = document.getElementById('poi-edu-toggle-badge');
    if (drawer) drawer.classList.toggle('hidden', !state.signal.showPoiEducation);
    if (badge) badge.textContent = state.signal.showPoiEducation ? '📖 Tutup ▲' : '📖 Belajar ▼';
  }

  function copySignalField(field) {
    if (!currentSignalObj) return;
    const map = {
      entry: { val: currentSignalObj.entryFmt, label: 'Entry' },
      sl: { val: currentSignalObj.slFmt, label: 'Stop Loss' },
      tp1: { val: currentSignalObj.tp1Fmt, label: 'TP 1' },
      tp2: { val: currentSignalObj.tp2Fmt, label: 'TP 2' },
      tp3: { val: currentSignalObj.tp3Fmt, label: 'TP 3' }
    };
    const item = map[field];
    if (item) copyTextValue(item.val, item.label);
  }

  function formatSignalPlainText(s) {
    if (!s) return '';
    return [
      `📊 ${s.pair} (${s.timeframe}) — ${s.orderType}`,
      `Metode: ${s.methodLabel} | Score: ${s.score}/10`,
      `Zona POI: ${s.zoneRangeFormatted}`,
      `Entry: ${s.entryFmt}`,
      `SL: ${s.slFmt} (-${s.slPips} pips)`,
      `TP1: ${s.tp1Fmt} (+${s.tp1Pips})`,
      `TP2: ${s.tp2Fmt} (+${s.tp2Pips})`,
      `TP3: ${s.tp3Fmt} (+${s.tp3Pips})`,
      `Lot: ${s.pos ? s.pos.lot.toFixed(2) : '0.02'}`
    ].join('\n');
  }

  function copyFullSignalSetup() {
    if (!currentSignalObj) return;
    copyTextValue(formatSignalPlainText(currentSignalObj), 'Setup Lengkap');
  }

  function toggleStandardFormatBox() {
    state.signal.showStandardFormat = !state.signal.showStandardFormat;
    saveState();
    const box = document.getElementById('standard-format-preview');
    if (!box) return;
    box.classList.toggle('hidden', !state.signal.showStandardFormat);
    if (state.signal.showStandardFormat && currentSignalObj) {
      box.textContent = formatSignalPlainText(currentSignalObj);
    }
  }

  async function takeSetupAndSendTelegram() {
    if (!currentSignalObj) return;
    if (!canExecuteNewTrade()) return;

    const acc = getActiveAccount();
    const s = currentSignalObj;

    const logItem = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      timeLabel: formatWibShortTime(),
      accountId: acc ? acc.id : '',
      accountName: acc ? acc.name : 'Default',
      pair: s.pair,
      timeframe: s.timeframe,
      methodLabel: s.methodLabel,
      direction: s.direction,
      orderType: s.orderType,
      entry: s.entryFmt,
      sl: s.slFmt,
      tp1: s.tp1Fmt,
      tp2: s.tp2Fmt,
      tp3: s.tp3Fmt,
      slPips: s.slPips,
      tp1Pips: s.tp1Pips,
      tp2Pips: s.tp2Pips,
      tp3Pips: s.tp3Pips,
      lot: s.pos ? s.pos.lot : 0.02,
      status: 'active',
      outcome: null,
      pipsResult: 0
    };

    state.tradeLogs.unshift(logItem);
    if (acc) {
      acc.curEntry = (Number(acc.curEntry) || 0) + 1;
    }
    saveState();
    renderHomeSection();
    renderPerformanceAndLogs();

    showToast(`Setup ${s.pair} ${s.orderType} diambil & masuk Jurnal!`, 'success');
    await sendCurrentSignalToTelegramOnly(true);
  }

  async function sendCurrentSignalToTelegramOnly(showFeedback = true) {
    if (!currentSignalObj) return;
    const s = currentSignalObj;
    const msg = [
      `🎯 <b>XLIAMVR SNIPER SIGNAL</b>`,
      `📈 Pair: <b>${s.pair}</b> • Timeframe: <b>${s.timeframe}</b>`,
      `🧭 Arah: <b>${s.orderType}</b> (${s.methodShortTag}) • Score: <code>${s.score.toFixed(1)}/10</code>`,
      `📐 Zona POI: <code>${s.zoneRangeFormatted}</code>`,
      `📍 Entry: <code>${s.entryFmt}</code>`,
      `🛑 SL: <code>${s.slFmt}</code> (-${s.slPips} pips)`,
      `✅ TP1: <code>${s.tp1Fmt}</code> (+${s.tp1Pips})`,
      `✅ TP2: <code>${s.tp2Fmt}</code> (+${s.tp2Pips})`,
      `✅ TP3: <code>${s.tp3Fmt}</code> (+${s.tp3Pips})`,
      `⚖️ Rekomendasi Lot: <code>${s.pos ? s.pos.lot.toFixed(2) : '0.02'}</code>`
    ].join('\n');

    await dispatchTelegramMessage(msg, showFeedback);
  }

  // =========================================================================
  // PERFORMANCE RECAP, JOURNAL LOGS & CSV EXPORT
  // =========================================================================
  function setRecapPeriod(period) {
    state.recapPeriod = period;
    saveState();
    renderPerformanceAndLogs();
  }

  function switchLogSubTab(tab) {
    state.logSubTab = tab;
    saveState();
    renderPerformanceAndLogs();
  }

  function setLogStatusFilter(status) {
    state.logStatusFilter = status;
    saveState();
    renderPerformanceAndLogs();
  }

  function setLogPairFilter(pair) {
    state.logPairFilter = pair;
    saveState();
    renderPerformanceAndLogs();
  }

  function getPeriodFilteredLogs() {
    const now = Date.now();
    const dayMs = 86400000;
    const period = state.recapPeriod || 'today';

    return state.tradeLogs.filter((item) => {
      const ts = Number(item.timestamp) || now;
      const diff = now - ts;
      if (period === 'today') return getWibDateFromMs(ts) === getWibDateKey();
      if (period === 'week') return diff <= 7 * dayMs;
      if (period === 'month') return diff <= 30 * dayMs;
      if (period === 'year') return diff <= 365 * dayMs;
      return true;
    });
  }

  function getWibDateFromMs(ms) {
    const d = new Date(ms + 7 * 3600000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  async function markTradeOutcome(logId, outcome) {
    const item = state.tradeLogs.find((t) => t.id === logId);
    if (!item) return;

    item.outcome = outcome;
    if (outcome === 'TP1') {
      item.status = 'done';
      item.pipsResult = Number(item.tp1Pips) || 25;
    } else if (outcome === 'TP2') {
      item.status = 'done';
      item.pipsResult = Number(item.tp2Pips) || 50;
    } else if (outcome === 'TP3') {
      item.status = 'done';
      item.pipsResult = Number(item.tp3Pips) || 80;
    } else if (outcome === 'BE') {
      item.status = 'done';
      item.pipsResult = 0;
    } else if (outcome === 'SL') {
      item.status = 'done';
      item.pipsResult = -Math.abs(Number(item.slPips) || 20);
      const acc = state.accounts.find((a) => a.id === item.accountId) || getActiveAccount();
      if (acc) acc.curSl = (Number(acc.curSl) || 0) + 1;
      triggerAntiRevengeCooldown(20);
    } else if (outcome === 'CANCEL') {
      item.status = 'cancel';
      item.pipsResult = 0;
    }

    saveState();
    renderHomeSection();
    renderPerformanceAndLogs();
    showToast(`Status ${item.pair} diperbarui menjadi ${outcome}`, 'info');

    if (state.config.tgAutoResult && outcome !== 'CANCEL') {
      const pipSign = item.pipsResult > 0 ? `+${item.pipsResult}` : `${item.pipsResult}`;
      const msg = [
        `📣 <b>UPDATE HASIL TRADE — ${item.pair}</b>`,
        `Hasil: <b>${outcome}</b> (${pipSign} pips)`,
        `Arah: ${item.orderType} • Entry: <code>${item.entry}</code>`,
        `Akun: ${item.accountName}`
      ].join('\n');
      await dispatchTelegramMessage(msg, false);
    }
  }

  function resetTradeLogs() {
    state.tradeLogs = [];
    saveState();
    renderPerformanceAndLogs();
    showToast('Semua riwayat jurnal sinyal direset.', 'info');
  }

  function renderPerformanceAndLogs() {
    document.querySelectorAll('.recap-period-btn').forEach((btn) => {
      const active = btn.getAttribute('data-recap-period') === state.recapPeriod;
      btn.className = active
        ? 'recap-period-btn py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 text-white'
        : 'recap-period-btn py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });

    document.querySelectorAll('.log-subtab-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-tab') === state.logSubTab;
      btn.className = active
        ? 'log-subtab-btn py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white'
        : 'log-subtab-btn py-2 rounded-xl text-xs font-extrabold text-slate-400';
    });

    document.querySelectorAll('.log-status-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-status') === state.logStatusFilter;
      btn.className = active
        ? 'log-status-btn px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500 text-slate-950'
        : 'log-status-btn px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300';
    });

    document.querySelectorAll('.log-pair-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-pair') === state.logPairFilter;
      btn.className = active
        ? 'log-pair-btn py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 text-white'
        : 'log-pair-btn py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });

    const periodLogs = getPeriodFilteredLogs();
    let tpHit = 0;
    let slHit = 0;
    let beHit = 0;
    let plusPips = 0;
    let minusPips = 0;

    periodLogs.forEach((item) => {
      if (['TP1', 'TP2', 'TP3'].includes(item.outcome)) {
        tpHit += 1;
        plusPips += Math.abs(Number(item.pipsResult) || 0);
      } else if (item.outcome === 'SL') {
        slHit += 1;
        minusPips += Math.abs(Number(item.pipsResult) || 0);
      } else if (item.outcome === 'BE') {
        beHit += 1;
      }
    });

    const totalClosed = tpHit + slHit;
    const winrate = totalClosed > 0 ? Math.round((tpHit / totalClosed) * 100) : 0;
    const netPips = Number((plusPips - minusPips).toFixed(1));
    const profitFactor = minusPips > 0 ? (plusPips / minusPips).toFixed(2) : plusPips > 0 ? '9.99' : '0.00';

    setText('journal-count-pill', `${state.tradeLogs.length} JURNAL`);
    setText('journal-tab-count', `${state.tradeLogs.length}`);
    setText('stat-tp-hit', tpHit);
    setText('stat-sl-hit', slHit);
    setText('stat-be-hit', beHit);
    setText('stat-winrate', `${winrate}%`);
    setText('stat-plus-pips', `+${plusPips}`);
    setText('stat-minus-pips', `-${minusPips}`);
    setText('stat-net-pips', `${netPips > 0 ? '+' : ''}${netPips}`);
    setText('stat-profit-factor', `${profitFactor}x`);

    const filteredList = state.tradeLogs.filter((item) => {
      const statusOk =
        state.logStatusFilter === 'all' ||
        (state.logStatusFilter === 'done' && item.status === 'done') ||
        (state.logStatusFilter === 'cancel' && item.status === 'cancel');
      const pairOk = state.logPairFilter === 'ALL' || item.pair === state.logPairFilter;
      return statusOk && pairOk;
    });

    const listEl = document.getElementById('trade-logs-container');
    if (!listEl) return;

    if (filteredList.length === 0) {
      listEl.innerHTML = `
        <div class="rounded-xl bg-slate-900/70 border border-slate-800 p-4 text-center text-xs text-slate-400">
          Belum ada catatan sinyal pada filter ini. Tekan <strong>Ambil Setup &amp; Kirim Tele</strong> untuk mulai mencatat.
        </div>`;
      return;
    }

    listEl.innerHTML = filteredList
      .map((item) => {
        const outcomeBadge = item.outcome
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
              ['TP1', 'TP2', 'TP3'].includes(item.outcome)
                ? 'bg-emerald-500/20 text-emerald-300'
                : item.outcome === 'SL'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-slate-700 text-slate-200'
            }">${item.outcome} (${item.pipsResult > 0 ? '+' : ''}${item.pipsResult} pips)</span>`
          : `<span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">OPEN / PENDING</span>`;

        return `
          <div class="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <strong class="text-xs font-extrabold text-white">${item.pair}</strong>
                <span class="text-[10px] font-mono text-slate-400">${item.timeframe} • ${item.timeLabel}</span>
              </div>
              ${outcomeBadge}
            </div>
            <div class="text-[11px] font-mono text-slate-300 flex items-center justify-between flex-wrap gap-1">
              <span>${item.orderType} @ <strong class="text-sky-400">${item.entry}</strong></span>
              <span>SL: <strong class="text-rose-400">${item.sl}</strong> | TP2: <strong class="text-emerald-400">${item.tp2}</strong></span>
              <span>Lot: <strong>${Number(item.lot).toFixed(2)}</strong></span>
            </div>
            <div class="grid grid-cols-5 gap-1 pt-1">
              <button type="button" onclick="markTradeOutcome('${item.id}', 'TP1')" class="py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-95">TP1</button>
              <button type="button" onclick="markTradeOutcome('${item.id}', 'TP2')" class="py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-95">TP2</button>
              <button type="button" onclick="markTradeOutcome('${item.id}', 'BE')" class="py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-extrabold text-amber-300 active:scale-95">BE</button>
              <button type="button" onclick="markTradeOutcome('${item.id}', 'SL')" class="py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[10px] font-extrabold text-rose-300 active:scale-95">SL</button>
              <button type="button" onclick="markTradeOutcome('${item.id}', 'CANCEL')" class="py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 active:scale-95">Batal</button>
            </div>
          </div>`;
      })
      .join('');
  }

  function copyPerformanceRecap() {
    const tp = document.getElementById('stat-tp-hit')?.textContent || '0';
    const sl = document.getElementById('stat-sl-hit')?.textContent || '0';
    const wr = document.getElementById('stat-winrate')?.textContent || '0%';
    const net = document.getElementById('stat-net-pips')?.textContent || '0';
    const pf = document.getElementById('stat-profit-factor')?.textContent || '0.00x';

    const txt = [
      `📊 REKAP PERFORMA XLIAMVR (${state.recapPeriod.toUpperCase()})`,
      `TP Hit: ${tp} | SL Hit: ${sl}`,
      `Winrate: ${wr} | Profit Factor: ${pf}`,
      `Net Pips: ${net}`
    ].join('\n');

    copyTextValue(txt, 'Rekap Performa');
  }

  function exportJournalCsv() {
    if (state.tradeLogs.length === 0) {
      showToast('Belum ada data jurnal untuk di-export.', 'warn');
      return;
    }
    const headers = ['Waktu', 'Akun', 'Pair', 'Timeframe', 'Metode', 'Arah', 'Entry', 'SL', 'TP1', 'TP2', 'Lot', 'Hasil', 'Pips'];
    const rows = state.tradeLogs.map((r) => [
      `"${r.timeLabel}"`,
      `"${r.accountName}"`,
      r.pair,
      r.timeframe,
      `"${r.methodLabel}"`,
      r.orderType,
      r.entry,
      r.sl,
      r.tp1,
      r.tp2,
      r.lot,
      r.outcome || 'OPEN',
      r.pipsResult || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liamvtrade-journal-${getWibDateKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File Jurnal (.CSV) berhasil diunduh!', 'success');
  }

  // =========================================================================
  // CHART TAB: TRADINGVIEW RADAR (WITH UNLOCKED CAPITALCOM:US100)
  // =========================================================================
  const TV_SYMBOL_MAP = {
    XAUUSD: 'OANDA:XAUUSD',
    US100: 'CAPITALCOM:US100',
    BTCUSDT: 'BINANCE:BTCUSDT',
    EURUSD: 'FX:EURUSD'
  };

  function changeChartPair(pair) {
    state.chart.pair = pair;
    saveState();
    renderTradingViewChart(pair);
    scanChartStructure(false);
  }

  function renderTradingViewChart(pair) {
    const wrapper = document.getElementById('tv-chart-wrapper');
    if (!wrapper) return;

    const symbol = TV_SYMBOL_MAP[pair] || 'OANDA:XAUUSD';
    const isDark = state.theme === 'dark';

    const widgetConfig = {
      autosize: true,
      symbol,
      interval: '15',
      timezone: 'Asia/Jakarta',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'id',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    };

    wrapper.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.setAttribute('allowfullscreen', 'true');

    const encodedConfig = encodeURIComponent(JSON.stringify(widgetConfig));
    iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_liam_chart&symbol=${encodeURIComponent(symbol)}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=${isDark ? '0f172a' : 'f1f5f9'}&theme=${isDark ? 'dark' : 'light'}&style=1&timezone=Asia%2FJakarta&locale=id#${encodedConfig}`;

    wrapper.appendChild(iframe);
  }

  function scanChartStructure(showFeedback = true) {
    const pair = state.chart.pair || 'XAUUSD';
    const price = getCalibratedPrice(pair);
    const dr = global.LiamMethods.analyzeDealingRange(pair, price, state.signal.timeframe || 'M15', state.signal.scanSeed);

    setText('chart-swing-high', dr.swingHighFmt);
    setText('chart-swing-low', dr.swingLowFmt);
    setText('chart-active-range', global.LiamMethods.formatPrice(pair, dr.totalRange));

    const verdictBox = document.getElementById('chart-scan-verdict-box');
    const zoneLabel = dr.pdPercent >= 50 ? 'PREMIUM (Area Jual / Distribusi)' : 'DISCOUNT (Area Beli / Akumulasi)';
    const text = `<strong>${pair} (${TV_SYMBOL_MAP[pair]})</strong> berada pada posisi <strong>${dr.pdPercent}% Dealing Range</strong> → Zona <strong>${zoneLabel}</strong>. Equilibrium di <code>${dr.equilibriumFmt}</code>.`;

    if (verdictBox) verdictBox.innerHTML = text;
    if (showFeedback) showToast(`Struktur ${pair} dipindai!`, 'success');
  }

  // =========================================================================
  // PROFIL: SUPER ADMIN, SUPABASE 2-WAY SYNC, BACKUP/RESTORE, PUSH & TELEGRAM
  // =========================================================================
  function populateProfileInputs() {
    const bInput = document.getElementById('owner-broadcast-input');
    if (bInput) bInput.value = state.broadcastMessage || '';

    const masterBtn = document.getElementById('btn-engine-master-toggle');
    if (masterBtn) {
      masterBtn.textContent = state.config.engineMasterActive
        ? '🟢 Mesin Sinyal: AKTIF (Ketuk untuk Jeda)'
        : '🔴 Mesin Sinyal: DIJEDA (Ketuk untuk Aktifkan)';
      masterBtn.className = state.config.engineMasterActive
        ? 'w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold active:scale-95 transition'
        : 'w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95 transition';
    }

    setVal('cfg-td-apikey', state.config.tdApiKey || '');
    setVal('cfg-sb-url', state.config.sbUrl || DEFAULT_SB_URL);
    setVal('cfg-sb-key', state.config.sbKey || DEFAULT_SB_KEY);
    setVal('cfg-tg-token', state.config.tgToken || '');
    setVal('cfg-tg-chatid', state.config.tgChatId || '');

    const cSig = document.getElementById('cfg-tg-auto-signal');
    const cNews = document.getElementById('cfg-tg-auto-news');
    const cRes = document.getElementById('cfg-tg-auto-result');
    if (cSig) cSig.checked = Boolean(state.config.tgAutoSignal);
    if (cNews) cNews.checked = Boolean(state.config.tgAutoNews);
    if (cRes) cRes.checked = Boolean(state.config.tgAutoResult);

    updatePushPermissionLabel();
  }

  function saveOwnerBroadcast() {
    const input = document.getElementById('owner-broadcast-input');
    if (!input) return;
    state.broadcastMessage = input.value.trim();
    state.broadcastDismissed = false;
    saveState();
    renderBroadcastBanner();
    showToast(state.broadcastMessage ? 'Siaran global disiarkan!' : 'Siaran global dikosongkan.', 'success');
  }

  function renderBroadcastBanner() {
    const bar = document.getElementById('global-broadcast-bar');
    const textEl = document.getElementById('global-broadcast-text');
    if (!bar || !textEl) return;
    if (state.broadcastMessage && !state.broadcastDismissed) {
      textEl.textContent = `📢 ${state.broadcastMessage}`;
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }

  function dismissBroadcastBanner() {
    state.broadcastDismissed = true;
    saveState();
    renderBroadcastBanner();
  }

  function toggleSignalEngineMaster() {
    state.config.engineMasterActive = !state.config.engineMasterActive;
    saveState();
    populateProfileInputs();
    renderPriceDisplays();
    showToast(
      state.config.engineMasterActive ? 'Mesin Sinyal diaktifkan kembali.' : 'Mesin Sinyal dijeda.',
      state.config.engineMasterActive ? 'success' : 'warn'
    );
  }

  function toggleMemberCodeDrawer() {
    const d = document.getElementById('member-code-drawer');
    if (d) d.classList.toggle('hidden');
  }

  function generateCommercialMemberCode() {
    const label = (document.getElementById('member-label-input')?.value || 'VIP MEMBER').trim();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `XLIAM-VIP-${randomPart}`;
    state.memberCodes.unshift({ code, label, createdAt: formatWibShortTime() });
    saveState();
    const box = document.getElementById('generated-member-code-box');
    if (box) box.textContent = `Kode baru (${label}): ${code}`;
    copyTextValue(code, 'Kode Member VIP');
  }

  function saveApiAndCloudSettings() {
    state.config.tdApiKey = (document.getElementById('cfg-td-apikey')?.value || '').trim();
    state.config.sbUrl = (document.getElementById('cfg-sb-url')?.value || DEFAULT_SB_URL).trim();
    state.config.sbKey = (document.getElementById('cfg-sb-key')?.value || DEFAULT_SB_KEY).trim();
    state.config.tgToken = (document.getElementById('cfg-tg-token')?.value || '').trim();
    state.config.tgChatId = (document.getElementById('cfg-tg-chatid')?.value || '').trim();
    state.config.tgAutoSignal = Boolean(document.getElementById('cfg-tg-auto-signal')?.checked);
    state.config.tgAutoNews = Boolean(document.getElementById('cfg-tg-auto-news')?.checked);
    state.config.tgAutoResult = Boolean(document.getElementById('cfg-tg-auto-result')?.checked);

    saveState();
    showToast('Semua pengaturan API, Supabase & Telegram disimpan!', 'success');
    syncLiveMarketPrices(false);
  }

  // Supabase 2-Way Sync (via REST table `terminal_sync` dengan fallback lokal aman)
  async function pushDataToSupabase() {
    const sbUrl = (state.config.sbUrl || '').replace(/\/+$/, '');
    const sbKey = state.config.sbKey || '';
    if (!sbUrl || !sbKey) {
      showToast('Lengkapi Supabase URL & Key terlebih dahulu.', 'warn');
      return;
    }

    try {
      const payload = {
        id: 'xliamvr_owner_state',
        updated_at: new Date().toISOString(),
        state_json: state
      };

      const res = await fetch(`${sbUrl}/rest/v1/terminal_sync?on_conflict=id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      showToast('☁️ Data berhasil di-push ke Supabase Cloud!', 'success');
    } catch (err) {
      showToast(`Sync Cloud gagal (${err.message}). Data tetap tersimpan aman di HP.`, 'warn');
    }
  }

  async function pullDataFromSupabase() {
    const sbUrl = (state.config.sbUrl || '').replace(/\/+$/, '');
    const sbKey = state.config.sbKey || '';
    if (!sbUrl || !sbKey) {
      showToast('Lengkapi Supabase URL & Key terlebih dahulu.', 'warn');
      return;
    }

    try {
      const res = await fetch(`${sbUrl}/rest/v1/terminal_sync?id=eq.xliamvr_owner_state&select=state_json`, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].state_json) {
        const merged = { ...createInitialState(), ...rows[0].state_json };
        state = merged;
        saveState();
        applyTheme();
        renderBroadcastBanner();
        renderHomeSection();
        renderPriceDisplays();
        recalculateAndRenderSignal(false);
        renderPerformanceAndLogs();
        populateProfileInputs();
        showToast('📥 Data terbaru berhasil dimuat dari Cloud!', 'success');
      } else {
        showToast('Belum ada snapshot tersimpan di Cloud.', 'info');
      }
    } catch (err) {
      showToast(`Gagal pull Cloud (${err.message}).`, 'warn');
    }
  }

  function exportBackupJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liamvtrade-backup-${getWibDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup (.JSON) berhasil diunduh!', 'success');
  }

  function importBackupJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        state = { ...createInitialState(), ...parsed };
        saveState();
        applyTheme();
        renderBroadcastBanner();
        renderHomeSection();
        renderPriceDisplays();
        recalculateAndRenderSignal(false);
        renderPerformanceAndLogs();
        populateProfileInputs();
        showToast('Backup (.JSON) berhasil dipulihkan!', 'success');
      } catch (_) {
        showToast('File JSON tidak valid!', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Native Push Notification HP
  function updatePushPermissionLabel() {
    const el = document.getElementById('push-permission-status');
    if (!el) return;
    if (!('Notification' in window)) {
      el.textContent = 'Status izin browser: TIDAK DIDUKUNG';
      return;
    }
    el.textContent = `Status izin browser: ${Notification.permission.toUpperCase()}`;
  }

  async function requestNativePushPermission() {
    if (!('Notification' in window)) {
      showToast('Browser ini tidak mendukung Web Push Notification.', 'warn');
      return;
    }
    const perm = await Notification.requestPermission();
    updatePushPermissionLabel();
    showToast(`Izin Notifikasi HP: ${perm.toUpperCase()}`, perm === 'granted' ? 'success' : 'warn');
  }

  function sendTestPushNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      showToast('Aktifkan izin Alert HP terlebih dahulu!', 'warn');
      return;
    }
    new Notification('Liamvtrade Quant Terminal', {
      body: `Test Notifikasi HP aktif • ${state.signal.pair} @ ${getCalibratedPrice(state.signal.pair)}`,
      icon: 'https://xliamvr.github.io/com.xliamvr.scan/icon-192.png'
    });
    showToast('Notifikasi tes dikirim ke perangkat!', 'success');
  }

  // Telegram Bot Dispatcher
  async function dispatchTelegramMessage(htmlText, showFeedback = true) {
    const token = (state.config.tgToken || '').trim();
    const chatId = (state.config.tgChatId || '').trim();

    if (!token || !chatId) {
      if (showFeedback) {
        showToast('Bot Token / Chat ID Telegram belum diisi di tab Profil.', 'warn');
      }
      return false;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
        if (showFeedback) showToast('📨 Pesan terkirim ke Telegram VIP!', 'success');
        return true;
      }
      if (showFeedback) showToast(`Telegram error: ${data.description || 'Gagal kirim'}`, 'error');
      return false;
    } catch (err) {
      if (showFeedback) showToast(`Koneksi Telegram gagal: ${err.message}`, 'error');
      return false;
    }
  }

  async function testTelegramVipBot() {
    const msg = [
      `🤖 <b>LIAMVTRADE QUANT BOT TEST</b>`,
      `Status: <b>ONLINE &amp; TERHUBUNG</b>`,
      `Waktu: <code>${formatWibShortTime()}</code>`,
      `Akun Aktif: <b>${getActiveAccount()?.name || '-'}</b>`
    ].join('\n');
    await dispatchTelegramMessage(msg, true);
  }

  function openGuideModal() {
    openModal('modal-guide');
  }

  // =========================================================================
  // SMALL DOM UTILITIES
  // =========================================================================
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = String(val);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatWibShortTime() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    return `${String(wib.getHours()).padStart(2, '0')}:${String(wib.getMinutes()).padStart(2, '0')} WIB`;
  }
    function fallbackCopy(text, label) {
    try {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (typeof showToast === 'function') {
        showToast(ok ? `${label} disalin: ${text}` : 'Gagal menyalin otomatis', ok ? 'success' : 'error');
      }
    } catch (_) {
      if (typeof showToast === 'function') showToast('Gagal menyalin otomatis', 'error');
    }
  }

  function copyTextValue(text, label = 'Nilai') {
    const safe = text === undefined || text === null ? '' : String(text).trim();
    if (!safe || safe === '--') {
      if (typeof showToast === 'function') showToast(`${label} belum tersedia`, 'warn');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(safe).then(
        () => { if (typeof showToast === 'function') showToast(`${label} disalin: ${safe}`, 'success'); },
        () => fallbackCopy(safe, label)
      );
    } else {
      fallbackCopy(safe, label);
    }
  }

  function copySignalField(field) {
    if (!currentSignalObj) return;
    const map = {
      entry: [currentSignalObj.entryFmt, 'Entry'],
      sl: [currentSignalObj.slFmt, 'Stop Loss'],
      tp1: [currentSignalObj.tp1Fmt, 'TP 1'],
      tp2: [currentSignalObj.tp2Fmt, 'TP 2'],
      tp3: [currentSignalObj.tp3Fmt, 'TP 3']
    };
    if (map[field]) copyTextValue(map[field][0], map[field][1]);
  }

  function buildSignalSummaryText(sig) {
    if (!sig) return '';
    return [
      `${sig.pair} (${sig.timeframe}) - ${sig.orderType || sig.direction}`,
      `Entry: ${sig.entryFmt} | SL: ${sig.slFmt}`,
      `TP1: ${sig.tp1Fmt} | TP2: ${sig.tp2Fmt} | TP3: ${sig.tp3Fmt}`
    ].join('\n');
  }

  function copyFullSignalSetup() {
    if (!currentSignalObj) return;
    copyTextValue(buildSignalSummaryText(currentSignalObj), 'Full Setup');
  }

  async function dispatchTelegramMessage(text) {
    const token = (state.config?.tgToken || '').trim();
    const chatId = (state.config?.tgChatId || '').trim();
    if (!token || !chatId) {
      if (typeof showToast === 'function') showToast('Isi Bot Token & Chat ID Telegram di tab Profil dulu', 'warn');
      return false;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      });
      if (res.ok) {
        if (typeof showToast === 'function') showToast('Setup terkirim ke Telegram', 'success');
        return true;
      }
      if (typeof showToast === 'function') showToast('Gagal kirim ke Telegram (cek Token/Chat ID)', 'error');
      return false;
    } catch (_) {
      if (typeof showToast === 'function') showToast('Koneksi gagal saat kirim ke Telegram', 'error');
      return false;
    }
  }

  function takeSignalSetupOnly() {
    if (!currentSignalObj) return;
    if (typeof showToast === 'function') {
      showToast(`Setup ${currentSignalObj.pair} ${currentSignalObj.orderType || currentSignalObj.direction} diambil`, 'success');
    }
  }

  async function sendSignalToTelegramOnly() {
    if (!currentSignalObj) return;
    await dispatchTelegramMessage(buildSignalSummaryText(currentSignalObj));
  }

  async function takeAndSendSignalToTelegram() {
    if (!currentSignalObj) return;
    takeSignalSetupOnly();
    await dispatchTelegramMessage(buildSignalSummaryText(currentSignalObj));
  }

  function updateChartSwingMetrics() {
    const pair = state.chart?.pair || state.signal?.pair || 'US100';
    const price = Number(state.prices?.[pair]) || 0;
    if (!price) return;
    const dec = pair === 'EURUSD' ? 5 : 2;
    const span = pair === 'EURUSD' ? 0.0045 : pair === 'XAUUSD' ? 18 : pair === 'BTCUSDT' ? 1400 : 180;
    const sh = document.getElementById('chart-swing-high') || document.querySelector('[data-metric="swing-high"]');
    const sl = document.getElementById('chart-swing-low') || document.querySelector('[data-metric="swing-low"]');
    const ar = document.getElementById('chart-active-range') || document.querySelector('[data-metric="active-range"]');
    const highVal = price + span * 0.55;
    const lowVal = price - span * 0.45;
    if (sh) sh.textContent = highVal.toFixed(dec);
    if (sl) sl.textContent = lowVal.toFixed(dec);
    if (ar) ar.textContent = `${lowVal.toFixed(dec)} - ${highVal.toFixed(dec)}`;
  }

  function updateSignalExpiryTicker() {
    const el = document.getElementById('sig-expiry-timer');
    if (!el) return;
    const tfMin = global.LiamMethods?.TF_MULTIPLIERS?.[state.signal?.timeframe]?.expiryMin || 30;
    const windowMs = tfMin * 60000;
    const now = Date.now();
    let endMs = Number(state.signal?.expiryEndMs) || 0;
    if (!Number.isFinite(endMs) || endMs <= now || endMs - now > windowMs) {
      endMs = now + windowMs;
      state.signal.expiryEndMs = endMs;
    }
    const rem = Math.max(0, Math.floor((endMs - now) / 1000));
    const mm = String(Math.floor(rem / 60)).padStart(2, '0');
    const ss = String(rem % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const txt = (btn.textContent || '').trim().toLowerCase();
    const id = btn.id || '';

    if (id.includes('take-send') || txt.includes('ambil setup & kirim tele')) {
      e.preventDefault();
      takeAndSendSignalToTelegram();
    } else if (id.includes('send-only') || txt === 'kirim saja') {
      e.preventDefault();
      sendSignalToTelegramOnly();
    } else if (id.includes('copy-setup') || txt.includes('copy setup')) {
      e.preventDefault();
      copyFullSignalSetup();
    } else if (txt === 'copy' || id.startsWith('btn-copy-')) {
      const card = btn.closest('[data-copy-field]') || btn.parentElement;
      const field = card?.dataset?.copyField ||
        (txt.includes('copy') && card?.textContent?.toLowerCase().includes('stop loss') ? 'sl' :
         card?.textContent?.toLowerCase().includes('tp 1') ? 'tp1' :
         card?.textContent?.toLowerCase().includes('tp 2') ? 'tp2' :
         card?.textContent?.toLowerCase().includes('tp 3') ? 'tp3' : 'entry');
      e.preventDefault();
      copySignalField(field);
    }
  });

  setInterval(() => {
    updateSignalExpiryTicker();
    updateChartSwingMetrics();
  }, 1000);


  // =========================================================================
  // EXPOSE GLOBAL HANDLERS & BOOTSTRAP
  // =========================================================================
  Object.assign(global, {
    switchMainTab,
    toggleThemeMode,
    toggleWeekendBtcMode,
    openCalibrationModal,
    applyBrokerPriceCalibration,
    resetBrokerPriceCalibration,
    openGuideModal,
    closeModal,
    copySignalField,
    copyTextValue,
    copyFullSignalSetup,
    switchActiveAccount,
    adjustAccountLimit,
    adjustAccountCounter,
    resetAllAccountsDailyTrackers,
    clearCooldownManual,
    toggleSopItem,
    addCustomSopItem,
    removeSopItem,
    resetSopChecklist,
    toggleAddAccountDrawer,
    saveNewPropAccount,
    openEditAccountModal,
    saveEditedAccount,
    deleteEditedAccount,
    setNewsPeriodFilter,
    setNewsImpactFilter,
    setNewsPairFilter,
    syncNewsEngine,
    applyNewsEventToSignalTab,
    copyNewsEventPlan,
    executeNewsPlanToJournal,
    sendNewsEventToTelegram,
    selectSignalPair,
    selectSignalTimeframe,
    selectSignalMethod,
    forceRescanSignal,
    toggleSignalFilterDrawer,
    saveTerminalGuardPrefs,
    toggleTerminalFlag,
    toggleSignalAlertMode,
    toggleNewsSniperMode,
    dispatchNewsSniperTelegram,
    togglePoiEducationDrawer,
    copySignalField,
    copyTextValue,
    copyFullSignalSetup,
    toggleStandardFormatBox,
    takeSetupAndSendTelegram,
    sendCurrentSignalToTelegramOnly,
    setRecapPeriod,
    switchLogSubTab,
    setLogStatusFilter,
    setLogPairFilter,
    markTradeOutcome,
    resetTradeLogs,
    copyPerformanceRecap,
    exportJournalCsv,
    changeChartPair,
    scanChartStructure,
    saveOwnerBroadcast,
    dismissBroadcastBanner,
    toggleSignalEngineMaster,
    toggleMemberCodeDrawer,
    generateCommercialMemberCode,
    saveApiAndCloudSettings,
    pushDataToSupabase,
    pullDataFromSupabase,
    exportBackupJson,
    importBackupJson,
    requestNativePushPermission,
    sendTestPushNotification,
    testTelegramVipBot
  });

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderBroadcastBanner();
    syncFilterButtonsUI();
    renderPriceDisplays();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    renderPerformanceAndLogs();
    renderNewsSection();
    populateProfileInputs();
    updateClockAndSessions();

    // Sync harga live & news wire saat startup
    syncLiveMarketPrices(false);
    syncNewsEngine(false);

    // Tick setiap 1 detik untuk jam WIB, cooldown & timer expiry sinyal
    setInterval(updateClockAndSessions, 1000);

    // Auto-refresh harga live setiap 25 detik
    setInterval(() => syncLiveMarketPrices(false), 25000);
  });
})(window);
