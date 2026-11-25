/**
 * Liamvtrade Quant Terminal v3.0 — app.js (FULL UPGRADE)
 * - 100% kompatibel dengan index.html v3.0 & modul intelligence-upgrade.js
 * - Gerbang Ketat NO SETUP (< 7.0 atau MTF konflik) + 1 Arah Bias Terkunci
 * - Data Integrity Timestamp & Source Badge (Zero Fake Simulation)
 * - Hard Risk Lock saat Max SL Harian tercapai + Anti-Revenge Cooldown 20m
 * - Live Running Tracker, Manual TP Input/Hit, SL->BE, Cut Now
 * - AI Trade Review & Strategy Performance Lab Audit
 * - Supabase 2-Way Sync, Native Push Alert & Telegram VIP Dispatcher
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'liamvtrade_quant_v30_state';
  const NOTIF_QUEUE_KEY = 'liamvtrade_notif_queue_v2';
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

  function getTfConfig(tf) {
    const methods = global.LiamMethods || {};
    const table = methods.TF_CONFIG || methods.TF_MULTIPLIERS || {};
    return table[tf] || table.M15 || { atrMult: 0.8, expiryMin: 45, label: tf || 'M15' };
  }

  function getPairSpecSafe(pair) {
    const sym = String(pair || 'XAUUSD').toUpperCase();
    const methods = global.LiamMethods || {};
    if (typeof methods.getPairSpec === 'function') {
      const spec = methods.getPairSpec(sym);
      if (spec) return spec;
    }
    const fallback = {
      XAUUSD: { decimals: 2, pipSize: 0.1, pipValuePerLot: 10 },
      US100: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      BTCUSDT: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      EURUSD: { decimals: 5, pipSize: 0.0001, pipValuePerLot: 10 }
    };
    return fallback[sym] || fallback.XAUUSD;
  }

  function formatPriceSafe(pair, val) {
    const sym = String(pair || 'XAUUSD').toUpperCase();
    const methods = global.LiamMethods || {};
    if (typeof methods.formatPrice === 'function') {
      const out = methods.formatPrice(sym, val);
      if (out && out !== '--') return out;
    }
    const spec = getPairSpecSafe(sym);
    if (!Number.isFinite(Number(val))) return '--';
    return Number(val).toFixed(spec.decimals);
  }

  function getWibDateKey() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    const y = wib.getFullYear();
    const m = String(wib.getMonth() + 1).padStart(2, '0');
    const d = String(wib.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function createInitialState() {
    const nowTs = Date.now();
    return {
      theme: 'dark',
      activeTab: 'beranda',
      activeAccountId: 'acc-bf-4',
      weekendBtcMode: false,
      cooldownUntilMs: 0,
      lastResetDateWib: getWibDateKey(),

      flags: {
        newsShield: true,
        newsLockWarning: true,
        mondayFilter: false,
        morningFilter: false,
        signalAlert: true,
        newsSniper: false,
        engineMasterActive: true,
        requireSop100: false,
        blockOnCooldown: true,
        strictNoSetup: true
      },

      broadcastMessage: '',
      broadcastDismissed: false,
      memberCodes: [],

      config: {
        tdApiKey: '',
        sbUrl: DEFAULT_SB_URL,
        sbKey: DEFAULT_SB_KEY,
        tgToken: '',
        tgChatId: '',
        tgAutoSignal: true,
        tgAutoNews: true,
        tgAutoResult: true
      },

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
      priceSourceLabel: 'Menunggu Verifikasi Feed',
      feedVerifiedLive: false,
      lastPriceSyncMs: 0,
      tdQuotaUsed: 0,

      signal: {
        pair: 'XAUUSD',
        timeframe: 'M15',
        method: 'auto',
        scanSeed: 1,
        expiryEndMs: nowTs + 45 * 60000,
        showStandardFormat: false,
        showPoiEducation: false,
        manualRunningTpInput: ''
      },

      chart: {
        pair: 'XAUUSD',
        lastScanText: ''
      },

      news: {
        period: 'today',
        impact: 'all',
        pair: 'ALL',
        wire: []
      },

      sopItems: JSON.parse(JSON.stringify(DEFAULT_SOP_ITEMS)),
      accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),

      recapPeriod: 'today',
      logSubTab: 'signals',
      logStatusFilter: 'all',
      logPairFilter: 'ALL',
      tradeLogs: [],
      notifiedEventKeys: {}
    };
  }

  let state = loadState();
  let currentSignalObj = null;
  let lastAutoSentSignalKey = '';
  let lastAutoSentSignalTimeMs = 0;
  let lastAutoSentNewsKey = '';
  let isFlushingNotifQueue = false;
  const AUTO_TELEGRAM_COOLDOWN_MS = 10 * 60000;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('liamvtrade_quant_v29_state');
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      const base = createInitialState();
      const mergedPrices = { ...base.prices, ...(parsed.prices || {}) };
      const cleanPrices = {
        XAUUSD: Number.isFinite(Number(mergedPrices.XAUUSD)) && Number(mergedPrices.XAUUSD) > 0 ? Number(mergedPrices.XAUUSD) : base.prices.XAUUSD,
        US100: Number.isFinite(Number(mergedPrices.US100)) && Number(mergedPrices.US100) > 0 ? Number(mergedPrices.US100) : base.prices.US100,
        BTCUSDT: Number.isFinite(Number(mergedPrices.BTCUSDT)) && Number(mergedPrices.BTCUSDT) > 0 ? Number(mergedPrices.BTCUSDT) : base.prices.BTCUSDT,
        EURUSD: Number.isFinite(Number(mergedPrices.EURUSD)) && Number(mergedPrices.EURUSD) > 0 ? Number(mergedPrices.EURUSD) : base.prices.EURUSD
      };

      const lastSync = Number(parsed.lastPriceSyncMs);
      const safeSyncMs = Number.isFinite(lastSync) && lastSync > 0 ? lastSync : 0;

      return {
        ...base,
        ...parsed,
        weekendBtcMode: false,
        lastPriceSyncMs: safeSyncMs,
        flags: { ...base.flags, ...(parsed.flags || {}) },
        config: { ...base.config, ...(parsed.config || {}) },
        prices: cleanPrices,
        priceOffsets: { ...base.priceOffsets, ...(parsed.priceOffsets || {}) },
        signal: { ...base.signal, ...(parsed.signal || {}) },
        chart: { ...base.chart, ...(parsed.chart || {}) },
        news: { ...base.news, ...(parsed.news || {}) },
        sopItems: Array.isArray(parsed.sopItems) && parsed.sopItems.length > 0 ? parsed.sopItems : base.sopItems,
        accounts: Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : base.accounts,
        tradeLogs: Array.isArray(parsed.tradeLogs) ? parsed.tradeLogs : [],
        notifiedEventKeys: parsed.notifiedEventKeys && typeof parsed.notifiedEventKeys === 'object' ? parsed.notifiedEventKeys : {}
      };
    } catch (_) {
      return createInitialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // =========================================================================
  // NOTIFIKASI ANTI-KETINGGALAN (QUEUE + RETRY + COOLDOWN + HP + TELEGRAM)
  // =========================================================================
  function loadNotifQueue() {
    try {
      const raw = localStorage.getItem(NOTIF_QUEUE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveNotifQueue(queue) {
    try {
      localStorage.setItem(NOTIF_QUEUE_KEY, JSON.stringify(queue.slice(-40)));
    } catch (_) {}
  }

  function stripHtmlToPlain(htmlText) {
    return String(htmlText || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function triggerNativePushAlert(title, body, dedupeKey = '') {
    if (!state.flags.signalAlert) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if (dedupeKey) {
      const prevTs = Number(state.notifiedEventKeys[dedupeKey]) || 0;
      if (Date.now() - prevTs < 3 * 60 * 1000) return;
      state.notifiedEventKeys[dedupeKey] = Date.now();
      saveState();
    }

    try {
      new Notification(title, {
        body: String(body || '').slice(0, 180),
        icon: 'https://xliamvr.github.io/com.xliamvr.scan/icon-192.png',
        tag: dedupeKey || undefined
      });
    } catch (_) {}
  }

  function enqueueNotificationJob({ dedupeKey = '', cooldownMs = 5 * 60 * 1000, tgHtml = '', pushTitle = '', pushBody = '' }) {
    const now = Date.now();
    if (dedupeKey) {
      const lastSent = Number(state.notifiedEventKeys[dedupeKey]) || 0;
      if (now - lastSent < cooldownMs) return;
    }

    if (pushTitle && pushBody) {
      triggerNativePushAlert(pushTitle, pushBody, dedupeKey);
    }

    if (tgHtml) {
      const q = loadNotifQueue();
      const exists = q.some((item) => item.dedupeKey && dedupeKey && item.dedupeKey === dedupeKey);
      if (!exists) {
        q.push({
          id: 'nq-' + now + '-' + Math.random().toString(36).slice(2, 6),
          dedupeKey,
          tgHtml,
          createdAt: now,
          attempts: 0
        });
        saveNotifQueue(q);
      }
      flushNotificationQueue(false);
    }
  }

  async function flushNotificationQueue(showFeedback = false) {
    if (isFlushingNotifQueue) return;
    isFlushingNotifQueue = true;

    try {
      const queue = loadNotifQueue();
      if (queue.length === 0) return;

      const remaining = [];
      let sentCount = 0;

      for (const job of queue) {
        if (Date.now() - Number(job.createdAt || 0) > 24 * 3600 * 1000) {
          continue;
        }
        const ok = await dispatchTelegramMessage(job.tgHtml, false, true);
        if (ok) {
          sentCount += 1;
          if (job.dedupeKey) {
            state.notifiedEventKeys[job.dedupeKey] = Date.now();
          }
        } else {
          job.attempts = (Number(job.attempts) || 0) + 1;
          remaining.push(job);
        }
      }

      saveNotifQueue(remaining);
      if (sentCount > 0) {
        saveState();
        if (showFeedback) {
          showToast(`📨 ${sentCount} notifikasi antrean terkirim ke Telegram!`, 'success');
        }
      }
    } finally {
      isFlushingNotifQueue = false;
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

  function fallbackCopy(text, label) {
    try {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) {
        showToast(`${label} disalin: ${text}`, 'success');
      } else {
        showToast('Gagal menyalin otomatis', 'error');
      }
    } catch (_) {
      showToast('Gagal menyalin otomatis', 'error');
    }
  }

  function copyTextValue(text, label = 'Nilai') {
    const safeText = text === undefined || text === null ? '' : String(text).trim();
    if (!safeText || safeText === '--') {
      showToast(`${label} belum tersedia untuk disalin`, 'warn');
      return;
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(safeText).then(
        () => showToast(`${label} disalin: ${safeText}`, 'success'),
        () => fallbackCopy(safeText, label)
      );
    } else {
      fallbackCopy(safeText, label);
    }
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
      scanChartStructure(false);
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

    if (global.LiamIntelligence && typeof global.LiamIntelligence.animateActiveTab === 'function') {
      global.LiamIntelligence.animateActiveTab(tabName);
    }
  }

  // =========================================================================
  // WIB CLOCK, SESSIONS, WEEKEND BTC & DAILY AUTO-RESET (05:00 WIB)
  // =========================================================================
  function getWibContextSafe() {
    if (global.LiamMethods && typeof global.LiamMethods.getWibContext === 'function') {
      return global.LiamMethods.getWibContext();
    }
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    return {
      wib,
      hour: wib.getHours(),
      minute: wib.getMinutes(),
      day: wib.getDay(),
      isWeekend: wib.getDay() === 0 || wib.getDay() === 6
    };
  }

  function updateClockAndSessions() {
    const ctx = getWibContextSafe();
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
    renderNewsLockWarning();
    updateFeedIntegrityStrip();
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
  // ANTI-REVENGE COOLDOWN & HARD RISK LOCK (20 MENIT PASCA-SL)
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

  function evaluateHardRiskLock() {
    const acc = getActiveAccount();
    if (!acc) return { locked: false, reason: '' };

    const curSl = Number(acc.curSl) || 0;
    const maxSl = Number(acc.maxSl) || 2;
    const curEntry = Number(acc.curEntry) || 0;
    const maxEntry = Number(acc.maxEntry) || 2;
    const bal = Number(acc.balance) || 1000;
    const eq = Number(acc.equity) || bal;
    const dailyDdDollar = (bal * (Number(acc.dailyDdPct) || 4)) / 100;
    const drawdownUsed = Math.max(0, bal - eq);

    if (curSl >= maxSl) {
      return {
        locked: true,
        reason: `Max SL Harian (${curSl}/${maxSl}) pada akun ${acc.name} telah tercapai. Eksekusi dikunci otomatis hingga reset 05:00 WIB.`
      };
    }
    if (drawdownUsed >= dailyDdDollar * 0.9) {
      return {
        locked: true,
        reason: `Drawdown akun ${acc.name} ($${drawdownUsed.toFixed(2)}) mendekati batas Daily DD $${dailyDdDollar.toFixed(2)}.`
      };
    }
    if (curEntry >= maxEntry) {
      return {
        locked: false,
        warningOnly: true,
        reason: `Kuota Max Entry Harian (${curEntry}/${maxEntry}) penuh.`
      };
    }
    return { locked: false, reason: '' };
  }

  // =========================================================================
  // LIVE MARKET PRICE FEED + DATA INTEGRITY + KALIBRASI BROKER
  // =========================================================================
  function getCalibratedPrice(pair) {
    const sym = String(pair || 'XAUUSD').toUpperCase();
    const basePrices = { XAUUSD: 2650.00, US100: 20850.00, BTCUSDT: 92000.00, EURUSD: 1.08500 };
    const rawNum = Number(state.prices[sym]);
    const raw = Number.isFinite(rawNum) && rawNum > 0 ? rawNum : (basePrices[sym] || 2650.00);
    const offset = Number(state.priceOffsets[sym]) || 0;
    const spec = getPairSpecSafe(sym);
    const val = raw + offset;
    return Number(val.toFixed(spec.decimals));
  }

  function openCalibrationModal(pairOverride = null) {
    const pair = String(pairOverride || state.signal?.pair || 'XAUUSD').toUpperCase();
    const spec = getPairSpecSafe(pair);
    const raw = Number(state.prices[pair]) || 0;
    const offset = Number(state.priceOffsets[pair]) || 0;
    const calibrated = getCalibratedPrice(pair);

    setText('cal-pair-name', pair);
    setText('cal-raw-price', formatPriceSafe(pair, raw));
    setText('cal-current-offset', `${offset >= 0 ? '+' : ''}${offset.toFixed(spec.decimals)}`);
    setVal('cal-broker-price-input', calibrated);

    const acc = getActiveAccount();
    const lotBox = document.getElementById('cal-lot-breakdown');
    if (lotBox && acc) {
      const riskDollar = ((Number(acc.equity) || Number(acc.balance) || 1000) * (Number(acc.riskPct) || 0.4)) / 100;
      lotBox.innerHTML = `
        <div class="font-bold text-slate-200">Kalkulator Risiko Akun (${escapeHtml(acc.name)}):</div>
        <div>Ekuitas: <strong class="text-white">$${Number(acc.equity).toFixed(2)}</strong> • Risk/Trade: <strong class="text-cyan-300">${acc.riskPct}% ($${riskDollar.toFixed(2)})</strong></div>
        <div>Hard Max Lot: <strong class="text-amber-300">${acc.maxLot} lot</strong> • Pip Value: <strong>$${spec.pipValuePerLot}/lot</strong></div>
      `;
    }
    openModal('modal-calibration');
  }

  function applyBrokerPriceCalibration() {
    const pair = String(document.getElementById('cal-pair-name')?.textContent || state.signal?.pair || 'XAUUSD').toUpperCase();
    const spec = getPairSpecSafe(pair);
    const raw = Number(state.prices[pair]) || 0;
    const brokerPx = Number(String(document.getElementById('cal-broker-price-input')?.value ?? '').replace(',', '.'));

    if (!Number.isFinite(brokerPx) || brokerPx <= 0) {
      showToast('Masukkan harga broker yang valid (> 0)', 'warn');
      return;
    }

    const offset = Number((brokerPx - raw).toFixed(spec.decimals));
    state.priceOffsets[pair] = offset;
    saveState();
    closeModal('modal-calibration');
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
    evaluateActiveTradesAgainstLivePrices();
    showToast(`Kalibrasi ${pair} dikunci (Offset: ${offset >= 0 ? '+' : ''}${offset.toFixed(spec.decimals)})`, 'success');
  }

  function resetBrokerPriceCalibration(pairOverride = null) {
    const pair = String(pairOverride || document.getElementById('cal-pair-name')?.textContent || state.signal?.pair || 'XAUUSD').toUpperCase();
    state.priceOffsets[pair] = 0;
    setVal('cal-broker-price-input', formatPriceSafe(pair, Number(state.prices[pair]) || 0));
    setText('cal-current-offset', '0.00');
    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
    evaluateActiveTradesAgainstLivePrices();
    showToast(`Offset kalibrasi ${pair} direset ke 0.00`, 'info');
  }

  function updateFeedIntegrityStrip() {
    const sourceEl = document.getElementById('header-feed-source');
    const tsEl = document.getElementById('header-feed-timestamp');
    const badgeEl = document.getElementById('header-feed-status-badge');

    const lastSync = Number(state.lastPriceSyncMs) || 0;
    const ageSec = lastSync > 0 ? Math.max(0, Math.round((Date.now() - lastSync) / 1000)) : 9999;
    const isFresh = state.feedVerifiedLive && ageSec <= 120;

    if (sourceEl) {
      sourceEl.textContent = `Sumber: ${state.priceSourceLabel || 'Menunggu feed...'}`;
    }

    if (tsEl) {
      if (lastSync > 0) {
        const d = new Date(lastSync + (new Date().getTimezoneOffset() + 420) * 60000);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        tsEl.textContent = `Sync: ${hh}:${mm}:${ss} WIB (${ageSec}d lalu)`;
      } else {
        tsEl.textContent = 'Sync: Belum terverifikasi';
      }
    }

    if (badgeEl) {
      if (isFresh) {
        badgeEl.textContent = 'LIVE';
        badgeEl.className = 'px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-mono font-extrabold text-emerald-300';
      } else if (lastSync > 0) {
        badgeEl.textContent = 'DELAYED';
        badgeEl.className = 'px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-mono font-extrabold text-amber-300';
      } else {
        badgeEl.textContent = 'UNVERIFIED';
        badgeEl.className = 'px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-[9px] font-mono font-extrabold text-rose-300';
      }
    }
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
      headerTicker.textContent = `${activePair} ${formatPriceSafe(activePair, activeCal)}`;
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

    updateFeedIntegrityStrip();
  }

  async function syncLiveMarketPrices(forceShowToast = false) {
    let updatedAny = false;
    let sourceTag = state.priceSourceLabel || 'Spot Feed';

    try {
      if (global.LiamPriceFeed && typeof global.LiamPriceFeed.fetchAccuratePrices === 'function') {
        const live = await global.LiamPriceFeed.fetchAccuratePrices(state.config.tdApiKey);
        if (live) {
          if (Number(live.XAUUSD) > 0) { state.prices.XAUUSD = Number(live.XAUUSD); updatedAny = true; }
          if (Number(live.US100) > 0)  { state.prices.US100 = Number(live.US100);   updatedAny = true; }
          if (Number(live.BTCUSDT) > 0){ state.prices.BTCUSDT = Number(live.BTCUSDT); updatedAny = true; }
          if (Number(live.EURUSD) > 0) { state.prices.EURUSD = Number(live.EURUSD); updatedAny = true; }
          if (live.source) sourceTag = live.source;
        }
      }
    } catch (_) {}

    if (updatedAny) {
      state.priceSourceLabel = sourceTag;
      state.feedVerifiedLive = true;
      state.lastPriceSyncMs = Date.now();
    } else {
      state.feedVerifiedLive = false;
    }

    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
    evaluateActiveTradesAgainstLivePrices();
    flushNotificationQueue(false);

    if (global.LiamIntelligence && typeof global.LiamIntelligence.updateMarketRegimeBrief === 'function') {
      global.LiamIntelligence.updateMarketRegimeBrief();
    }

    if (state.activeTab === 'news') {
      renderNewsSection();
    } else if (state.activeTab === 'chart') {
      scanChartStructure(false);
    }

    if (updatedAny && state.config.engineMasterActive && state.config.tgAutoSignal) {
      recalculateAndRenderSignal(true);
    }

    if (forceShowToast) {
      showToast(updatedAny ? `Harga live terverifikasi (${sourceTag})` : 'Feed live gagal merespons — status DATA DELAYED/UNVERIFIED', updatedAny ? 'success' : 'warn');
    }
  }

  // =========================================================================
  // LIVE RUNNING TRACKER + MANUAL TP INPUT/HIT + SL->BE + CUT NOW
  // =========================================================================
  function evaluateTradeLiveMetrics(item) {
    const pair = String(item.pair || 'XAUUSD').toUpperCase();
    const spec = getPairSpecSafe(pair);
    const livePx = getCalibratedPrice(pair);
    const entryPx = Number(item.entry);
    const slPx = Number(item.sl);
    const tp1Px = Number(item.tp1);
    const tp2Px = Number(item.tp2);
    const tp3Px = Number(item.tp3);
    const isBuy = String(item.direction || '').toUpperCase() === 'BUY' || String(item.orderType || '').toUpperCase().includes('BUY');
    const isLimit = String(item.orderType || '').toUpperCase().includes('LIMIT');
    const lot = Math.max(0.01, Number(item.lot) || 0.02);
    const pipSize = Number(spec.pipSize) || (pair === 'EURUSD' ? 0.0001 : pair === 'US100' || pair === 'BTCUSDT' ? 1.0 : 0.1);
    const pipValuePerLot = Number(spec.pipValuePerLot) || (pair === 'US100' || pair === 'BTCUSDT' ? 1 : 10);

    let liveStatus = isLimit ? 'MENUNGGU LIMIT' : 'RUNNING';
    let autoOutcome = null;

    if (item.status === 'done' && item.outcome) {
      liveStatus = `${item.outcome} HIT`;
    } else if (item.status === 'cancel') {
      liveStatus = 'DIBATALKAN';
    } else if (Number.isFinite(entryPx) && entryPx > 0 && Number.isFinite(livePx) && livePx > 0) {
      const limitTriggered = isLimit
        ? isBuy
          ? livePx <= entryPx
          : livePx >= entryPx
        : true;

      if (!item.triggeredAt && limitTriggered) {
        item.triggeredAt = Date.now();
        liveStatus = 'RUNNING';
      } else if (item.triggeredAt || !isLimit) {
        liveStatus = 'RUNNING';
        if (Number.isFinite(slPx) && slPx > 0 && ((isBuy && livePx <= slPx) || (!isBuy && livePx >= slPx))) {
          autoOutcome = 'SL';
          liveStatus = 'SL HIT';
        } else if (Number.isFinite(tp3Px) && tp3Px > 0 && ((isBuy && livePx >= tp3Px) || (!isBuy && livePx <= tp3Px))) {
          autoOutcome = 'TP3';
          liveStatus = 'TP3 HIT';
        } else if (Number.isFinite(tp2Px) && tp2Px > 0 && ((isBuy && livePx >= tp2Px) || (!isBuy && livePx <= tp2Px))) {
          autoOutcome = 'TP2';
          liveStatus = 'TP2 HIT';
        } else if (Number.isFinite(tp1Px) && tp1Px > 0 && ((isBuy && livePx >= tp1Px) || (!isBuy && livePx <= tp1Px))) {
          autoOutcome = 'TP1';
          liveStatus = 'TP1 HIT';
        }
      } else {
        liveStatus = 'MENUNGGU LIMIT';
      }
    }

    const isPendingLimit = liveStatus === 'MENUNGGU LIMIT' || liveStatus === 'PENDING LIMIT';
    const diffFromEntryPrice = !isPendingLimit && Number.isFinite(livePx) && Number.isFinite(entryPx)
      ? isBuy
        ? livePx - entryPx
        : entryPx - livePx
      : 0;
    const floatingPips = Number((diffFromEntryPrice / pipSize).toFixed(1));
    const floatingDollar = Number((floatingPips * pipValuePerLot * lot).toFixed(2));
    const distToEntryPips = Number.isFinite(livePx) && Number.isFinite(entryPx)
      ? Number((Math.abs(livePx - entryPx) / pipSize).toFixed(1))
      : 0;

    return {
      livePx,
      liveStatus,
      autoOutcome,
      floatingPips,
      floatingDollar,
      distToEntryPips,
      isRunning: liveStatus === 'RUNNING' || liveStatus.includes('HIT')
    };
  }

  function evaluateActiveTradesAgainstLivePrices() {
    let changed = false;

    for (const item of state.tradeLogs) {
      if (item.status !== 'active') continue;
      const prevTriggered = Boolean(item.triggeredAt);
      const metrics = evaluateTradeLiveMetrics(item);

      if (!prevTriggered && item.triggeredAt) {
        changed = true;
        enqueueNotificationJob({
          dedupeKey: `trig-${item.id}`,
          cooldownMs: 30 * 60000,
          pushTitle: `⚡ Limit Terjemput — ${item.pair} (${item.timeframe})`,
          pushBody: `${item.orderType} @ ${item.entry} kini RUNNING (Live ${metrics.livePx}).`,
          tgHtml: [
            `⚡ <b>LIMIT TERJEMPUT / POSISI RUNNING</b>`,
            `Pair: <b>${escapeHtml(item.pair)}</b> (${escapeHtml(item.timeframe)}) • <b>${escapeHtml(item.orderType)}</b>`,
            `Entry: <code>${escapeHtml(item.entry)}</code> | Live: <code>${escapeHtml(formatPriceSafe(item.pair, metrics.livePx))}</code>`,
            `SL: <code>${escapeHtml(item.sl)}</code> | TP1: <code>${escapeHtml(item.tp1)}</code> | TP2: <code>${escapeHtml(item.tp2)}</code>`
          ].join('\n')
        });
      }

      if (metrics.autoOutcome) {
        changed = true;
        markTradeOutcome(item.id, metrics.autoOutcome, { exitPrice: metrics.livePx, silentToast: true });
      }
    }

    if (changed) {
      saveState();
      renderPerformanceAndLogs();
    }
    renderActiveSignalRunningWidget();
  }

  function getLatestActiveLogForCurrentPair() {
    const pair = currentSignalObj?.pair || state.signal.pair;
    return (
      state.tradeLogs.find((t) => t.status === 'active' && t.pair === pair) ||
      state.tradeLogs.find((t) => t.status === 'active') ||
      null
    );
  }

  function renderActiveSignalRunningWidget() {
    const s = currentSignalObj;
    if (!s) return;

    const activeLog = getLatestActiveLogForCurrentPair();
    const spec = getPairSpecSafe(s.pair);
    const livePx = getCalibratedPrice(s.pair);
    const entryNum = Number(s.entryFmt);
    const tp1Num = Number(s.tp1Fmt);
    const isBuy = s.direction === 'BUY';

    let statusText = s.isNoSetup ? 'NO SETUP (WAIT)' : 'MENUNGGU LIMIT';
    let statusTone = s.isNoSetup
      ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
      : 'bg-slate-800 border-slate-700 text-slate-300';
    let pipsInfo = '';
    let dollarInfo = '';

    if (activeLog) {
      const m = evaluateTradeLiveMetrics(activeLog);
      statusText = m.liveStatus;
      if (m.liveStatus.includes('TP')) {
        statusTone = 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300';
      } else if (m.liveStatus.includes('SL')) {
        statusTone = 'bg-rose-500/20 border-rose-400/50 text-rose-300';
      } else if (m.liveStatus === 'RUNNING') {
        statusTone = 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300';
      } else {
        statusTone = 'bg-amber-500/20 border-amber-400/50 text-amber-300';
      }
      const pSign = m.floatingPips > 0 ? '+' : '';
      const dSign = m.floatingDollar > 0 ? '+' : m.floatingDollar < 0 ? '-' : '';
      pipsInfo = `${pSign}${m.floatingPips} pips`;
      dollarInfo = `${dSign}$${Math.abs(m.floatingDollar).toFixed(2)}`;
    } else if (!s.isNoSetup && Number.isFinite(entryNum) && Number.isFinite(livePx)) {
      const touched = isBuy ? livePx <= entryNum : livePx >= entryNum;
      statusText = touched ? 'AREA LIMIT TERSENTUH (SIAP RUNNING)' : 'MENUNGGU LIMIT';
      statusTone = touched
        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
        : 'bg-slate-800 border-slate-700 text-slate-300';
      const distPips = (Math.abs(livePx - entryNum) / (spec.pipSize || 0.1)).toFixed(1);
      pipsInfo = `Jarak Limit: ${distPips} pips`;
      dollarInfo = `Live: ${formatPriceSafe(s.pair, livePx)}`;
    } else {
      pipsInfo = 'Menunggu Konfluensi Valid';
      dollarInfo = `Live: ${formatPriceSafe(s.pair, livePx)}`;
    }

    const badgeEl = document.getElementById('sig-live-status-badge');
    if (badgeEl) {
      badgeEl.textContent = `● ${statusText}`;
      badgeEl.className = `px-2.5 py-1 rounded-full border text-[10px] font-mono font-extrabold ${statusTone}`;
    }

    setText('sig-live-delta-pips', pipsInfo);
    setText('sig-live-floating-usd', dollarInfo);

    const runPanel = document.getElementById('sig-running-action-panel');
    if (runPanel) {
      const showControls = Boolean(activeLog && activeLog.status === 'active');
      runPanel.classList.toggle('hidden', !showControls);
      const tpInput = document.getElementById('sig-manual-tp-input');
      if (tpInput && showControls && !tpInput.value && Number.isFinite(tp1Num)) {
        tpInput.placeholder = `TP manual (cth: ${formatPriceSafe(s.pair, livePx)})`;
      }
    }
  }

  function applyManualTpHitForLog(logId, customTpValue = null) {
    const item = state.tradeLogs.find((t) => t.id === logId) || getLatestActiveLogForCurrentPair();
    if (!item) {
      showToast('Belum ada posisi aktif yang sedang berjalan.', 'warn');
      return;
    }

    const spec = getPairSpecSafe(item.pair);
    const livePx = getCalibratedPrice(item.pair);
    const rawInput =
      customTpValue !== null && customTpValue !== undefined
        ? customTpValue
        : document.getElementById(`manual-tp-input-${item.id}`)?.value ||
          document.getElementById('sig-manual-tp-input')?.value ||
          '';

    const parsedTp = Number(String(rawInput).replace(',', '.').trim());
    const exitPrice = Number.isFinite(parsedTp) && parsedTp > 0 ? parsedTp : livePx;
    const entryNum = Number(item.entry);
    const isBuy = item.direction === 'BUY';

    let calcPips = Number(item.tp1Pips) || 25;
    if (Number.isFinite(entryNum) && Number.isFinite(exitPrice) && spec.pipSize > 0) {
      const signedDiff = isBuy ? exitPrice - entryNum : entryNum - exitPrice;
      calcPips = Number((signedDiff / spec.pipSize).toFixed(1));
    }

    item.outcome = 'MANUAL_TP';
    item.status = 'done';
    item.exitPrice = formatPriceSafe(item.pair, exitPrice);
    item.pipsResult = calcPips;
    item.closedAt = Date.now();
    state.signal.manualRunningTpInput = '';

    const inpEl = document.getElementById('sig-manual-tp-input');
    if (inpEl) inpEl.value = '';

    saveState();
    renderHomeSection();
    renderPerformanceAndLogs();
    renderActiveSignalRunningWidget();

    const pSign = calcPips >= 0 ? '+' : '';
    showToast(`✅ TP Manual HIT (${item.pair} @ ${item.exitPrice}) • ${pSign}${calcPips} pips!`, 'success');

    if (state.config.tgAutoResult) {
      enqueueNotificationJob({
        dedupeKey: `manual-tp-${item.id}`,
        cooldownMs: 60000,
        pushTitle: `✅ TP Manual HIT — ${item.pair}`,
        pushBody: `Keluar @ ${item.exitPrice} (${pSign}${calcPips} pips).`,
        tgHtml: [
          `✅ <b>MANUAL TP HIT — ${escapeHtml(item.pair)}</b>`,
          `Arah: <b>${escapeHtml(item.orderType)}</b> • Entry: <code>${escapeHtml(item.entry)}</code>`,
          `TP Keluar: <code>${escapeHtml(item.exitPrice)}</code> (${pSign}${calcPips} pips)`,
          `Akun: ${escapeHtml(item.accountName)}`
        ].join('\n')
      });
    }
  }

  function moveActiveTradeToBreakeven(logId) {
    const item = state.tradeLogs.find((t) => t.id === logId) || getLatestActiveLogForCurrentPair();
    if (!item) {
      showToast('Tidak ada posisi aktif untuk digeser ke BE.', 'warn');
      return;
    }
    item.sl = item.entry;
    item.slPips = 0;
    item.movedToBe = true;
    saveState();
    renderPerformanceAndLogs();
    renderActiveSignalRunningWidget();
    showToast(`🛡️ SL ${item.pair} digeser ke Breakeven (${item.entry})!`, 'success');
  }

  function cutActiveTradeNow(logId) {
    const item = state.tradeLogs.find((t) => t.id === logId) || getLatestActiveLogForCurrentPair();
    if (!item) {
      showToast('Tidak ada posisi aktif untuk ditutup.', 'warn');
      return;
    }
    const spec = getPairSpecSafe(item.pair);
    const livePx = getCalibratedPrice(item.pair);
    const entryNum = Number(item.entry);
    const isBuy = item.direction === 'BUY';

    let diffPips = 0;
    if (Number.isFinite(entryNum) && Number.isFinite(livePx) && spec.pipSize > 0) {
      const signed = isBuy ? livePx - entryNum : entryNum - livePx;
      diffPips = Number((signed / spec.pipSize).toFixed(1));
    }

    const isProfit = diffPips >= 0;
    item.outcome = isProfit ? 'CUT_TP' : 'CUT_SL';
    item.status = 'done';
    item.exitPrice = formatPriceSafe(item.pair, livePx);
    item.pipsResult = diffPips;
    item.closedAt = Date.now();
    state.signal.manualRunningTpInput = '';

    if (!isProfit) {
      const acc = state.accounts.find((a) => a.id === item.accountId) || getActiveAccount();
      if (acc) acc.curSl = (Number(acc.curSl) || 0) + 1;
      triggerAntiRevengeCooldown(20);
    }

    saveState();
    renderHomeSection();
    renderPerformanceAndLogs();
    renderActiveSignalRunningWidget();

    const pSign = diffPips >= 0 ? '+' : '';
    showToast(`✂️ Posisi ${item.pair} ditutup @ ${item.exitPrice} (${pSign}${diffPips} pips)`, isProfit ? 'success' : 'warn');
  }

  // =========================================================================
  // NEWS LOCK WARNING (ON/OFF — PERINGATAN SAJA, TIDAK MEMBLOKIR SETUP)
  // =========================================================================
  function toggleNewsLockWarning() {
    state.flags.newsLockWarning = !state.flags.newsLockWarning;
    saveState();
    syncFilterButtonsUI();
    renderNewsLockWarning();
    showToast(
      `Peringatan News Lock: ${state.flags.newsLockWarning ? 'ON (Peringatan Saja)' : 'OFF'}`,
      'info'
    );
  }

  function renderNewsLockWarning() {
    const btn = document.getElementById('btn-news-lock-warning');
    if (btn) {
      btn.textContent = state.flags.newsLockWarning ? '🔔 News Lock Warn: ON' : '🔕 News Lock Warn: OFF';
      btn.className = state.flags.newsLockWarning
        ? 'px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const banner = document.getElementById('news-lock-warning-banner');
    if (!banner) return;

    const pair = currentSignalObj?.pair || state.signal?.pair || 'XAUUSD';
    const lockInfo =
      state.flags.newsLockWarning &&
      global.LiamNews &&
      typeof global.LiamNews.getActiveNewsLock === 'function'
        ? global.LiamNews.getActiveNewsLock(Date.now(), pair, 15)
        : { locked: false };

    if (lockInfo.locked && lockInfo.event) {
      banner.classList.remove('hidden');
      banner.innerHTML = `⚠️ <strong>Peringatan News Lock:</strong> Mendekati/berlangsung <strong>${escapeHtml(lockInfo.event.title)}</strong> (${escapeHtml(lockInfo.event.timeWib)}). Setup tetap tersedia &amp; bisa dipakai — waspadai lonjakan spread/whipsaw.`;
    } else {
      banner.classList.add('hidden');
    }
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
    recalculateAndRenderSignal(false);
  }

  function adjustAccountCounter(field, delta) {
    const acc = getActiveAccount();
    if (!acc) return;
    const nextVal = Math.max(0, (Number(acc[field]) || 0) + delta);
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
    recalculateAndRenderSignal(false);
  }

  function resetAllAccountsDailyTrackers(silent = false) {
    state.accounts.forEach((acc) => {
      acc.curEntry = 0;
      acc.curSl = 0;
    });
    state.cooldownUntilMs = 0;
    saveState();
    renderHomeSection();
    recalculateAndRenderSignal(false);
    if (!silent) showToast('Counter Entry & SL harian semua akun direset ke 0.', 'success');
  }

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

    const hardLock = evaluateHardRiskLock();
    const lockBanner = document.getElementById('hard-risk-lock-banner');
    const lockReasonEl = document.getElementById('hard-risk-lock-reason');
    if (lockBanner && lockReasonEl) {
      if (hardLock.locked) {
        lockBanner.classList.remove('hidden');
        lockReasonEl.textContent = hardLock.reason;
      } else {
        lockBanner.classList.add('hidden');
      }
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

    try {
      if (global.LiamNews && typeof global.LiamNews.fetchLiveMacroWire === 'function') {
        const wireItems = await global.LiamNews.fetchLiveMacroWire();
        if (Array.isArray(wireItems)) state.news.wire = wireItems;
      }
    } catch (_) {}

    saveState();

    if (statusEl) {
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      statusEl.textContent = `● Kalender Terverifikasi + Live Wire (${nowTime} WIB)`;
    }

    renderNewsSection();
    renderNewsLockWarning();
    if (forceToast) showToast('Kalender Ekonomi & Macro Wire diperbarui!', 'success');
  }

  function getFilteredNewsEvents() {
    if (!global.LiamNews || typeof global.LiamNews.buildDynamicEconomicEvents !== 'function') {
      return [];
    }
    const allEvents = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    const dates = global.LiamNews.getWibTodayStrings ? global.LiamNews.getWibTodayStrings() : { today: getWibDateKey(), day6: '9999-99-99', day18: '9999-99-99' };
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
      const pairOk = pair === 'ALL' || (Array.isArray(evt.affectedPairs) && evt.affectedPairs.includes(pair));

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

    const allEvents = global.LiamNews && typeof global.LiamNews.buildDynamicEconomicEvents === 'function'
      ? global.LiamNews.buildDynamicEconomicEvents(state.prices)
      : [];
    const filtered = getFilteredNewsEvents();

    const summaryEl = document.getElementById('news-summary-banner');
    if (summaryEl) {
      const highCount = filtered.filter((e) => e.impact === 'high').length;
      summaryEl.innerHTML = `Menampilkan <strong>${filtered.length}</strong> agenda makro (<strong>${highCount} High Impact</strong>) untuk filter aktif. Hindari entry agresif ±15 menit menjelang rilis data merah.`;
    }

    const bestEvt = global.LiamNews && typeof global.LiamNews.pickBestNewsOpportunity === 'function'
      ? global.LiamNews.pickBestNewsOpportunity(filtered.length > 0 ? filtered : allEvents, state.news.pair)
      : (filtered[0] || allEvents[0]);

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
      const wireData = state.news.wire && state.news.wire.length > 0 ? state.news.wire : [];
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
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold ${
                  isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }">${isHigh ? '🔴 HIGH IMPACT' : '🟠 MEDIUM IMPACT'}</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[10px] font-bold text-sky-300">${evt.currency}</span>
              </div>
              <span class="text-[11px] font-mono text-slate-400">${evt.dateStr} • <strong class="text-white">${evt.timeWib}</strong></span>
            </div>

            <div>
              <h3 class="text-sm font-extrabold text-white leading-snug">${evt.title}</h3>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span class="text-[10px] text-slate-400">Pair Terdampak:</span>
                ${(evt.affectedPairs || [])
                  .map((p) => `<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-200">${p}</span>`)
                  .join('')}
              </div>
            </div>

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

            <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-1">
              <div class="text-[10px] font-extrabold uppercase text-sky-400">ANALISA FUNDAMENTAL &amp; MAKRO</div>
              <p class="text-xs text-slate-300 leading-relaxed">${evt.fundamentalReasoning}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="rounded-xl bg-slate-900/90 border border-amber-500/30 p-2.5 space-y-1">
                <div class="text-[10px] font-extrabold text-amber-300">${evt.poiPreNews?.label || 'Pre-News POI'}</div>
                <div class="text-xs font-mono font-extrabold text-white">${evt.poiPreNews?.range || '--'}</div>
                <div class="text-[10px] text-slate-400">${evt.poiPreNews?.note || ''}</div>
              </div>
              <div class="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-2.5 space-y-1">
                <div class="text-[10px] font-extrabold text-cyan-300">${evt.poiPostNews?.label || 'Post-News POI'}</div>
                <div class="text-xs font-mono font-extrabold text-white">${evt.poiPostNews?.range || '--'}</div>
                <div class="text-[10px] text-slate-400">${evt.poiPostNews?.note || ''}</div>
              </div>
            </div>

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
    if (!global.LiamNews || typeof global.LiamNews.buildDynamicEconomicEvents !== 'function') return null;
    const events = global.LiamNews.buildDynamicEconomicEvents(state.prices);
    return events.find((e) => e.id === id) || events[0];
  }

  function applyNewsEventToSignalTab(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    if (evt.verdictPair && getPairSpecSafe(evt.verdictPair)) {
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
      evt.poiPreNews?.range ? `Pre-News POI: ${evt.poiPreNews.range}` : '',
      evt.poiPostNews?.range ? `Post-News POI: ${evt.poiPostNews.range}` : '',
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
      methodLabel: `News Quant (${String(evt.title || '').slice(0, 28)})`,
      direction: evt.verdictDirection,
      orderType: `${evt.verdictDirection} STOP/LIMIT`,
      entry: tp.entry || formatPriceSafe(pair, getCalibratedPrice(pair)),
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
    renderActiveSignalRunningWidget();
    showToast(`Setup News ${pair} ${evt.verdictDirection} dicatat ke Jurnal!`, 'success');
  }

  async function sendNewsEventToTelegram(id) {
    const evt = findNewsEventById(id);
    if (!evt) return;
    const tp = evt.tradePlan || {};
    const msg = [
      `🚨 <b>XLIAMVR NEWS QUANT ALERT</b>`,
      `📌 Event: <b>${escapeHtml(evt.title)}</b>`,
      `🕒 Jadwal: <code>${escapeHtml(evt.dateStr)} ${escapeHtml(evt.timeWib)}</code> (${escapeHtml(evt.currency)})`,
      `📊 Forecast: <code>${escapeHtml(evt.forecast)}</code> | Prev: <code>${escapeHtml(evt.previous)}</code>`,
      `🎯 Bias: <b>${escapeHtml(evt.verdictPair)} — ${escapeHtml(evt.verdictDirection)}</b> (${escapeHtml(evt.verdictConfidence)})`,
      tp.entry ? `📍 Entry: <code>${escapeHtml(tp.entry)}</code> | SL: <code>${escapeHtml(tp.sl)}</code> | TP1: <code>${escapeHtml(tp.tp1)}</code> | TP2: <code>${escapeHtml(tp.tp2)}</code>` : '',
      `💡 <i>${escapeHtml(evt.verdictSummary)}</i>`
    ]
      .filter(Boolean)
      .join('\n');

    await dispatchTelegramMessage(msg, true);
  }

  // =========================================================================
  // SIGNALS ENGINE, GERBANG NO SETUP, NEWS SNIPER & POI EDUCATION
  // =========================================================================
  function canExecuteNewTrade() {
    if (!state.config.engineMasterActive) {
      showToast('Mesin sinyal sedang dijeda oleh Owner di tab Profil.', 'warn');
      return false;
    }
    const hardLock = evaluateHardRiskLock();
    if (hardLock.locked) {
      showToast(`⛔ ${hardLock.reason}`, 'error');
      return false;
    }
    if (currentSignalObj && currentSignalObj.isNoSetup) {
      showToast('🚫 Status saat ini NO SETUP — tunggu struktur & skor memenuhi syarat!', 'warn');
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
    return true;
  }

  function selectSignalPair(pair) {
    if (!pair) return;
    state.signal.pair = pair;
    state.signal.expiryEndMs = Date.now() + (getTfConfig(state.signal.timeframe).expiryMin || 45) * 60000;
    saveState();
    renderPriceDisplays();
    recalculateAndRenderSignal(false);
  }

  function selectSignalTimeframe(tf) {
    if (!tf) return;
    state.signal.timeframe = tf;
    state.signal.expiryEndMs = Date.now() + (getTfConfig(tf).expiryMin || 45) * 60000;
    saveState();
    recalculateAndRenderSignal(false);
  }

  function selectSignalMethod(methodKey) {
    if (!methodKey) return;
    state.signal.method = methodKey;
    saveState();
    recalculateAndRenderSignal(false);
    const label = global.LiamMethods?.METHOD_CATALOG?.[methodKey]?.name || methodKey;
    showToast(`Metode: ${label}`, 'info');
  }

  function forceRescanSignal() {
    state.signal.scanSeed = (Number(state.signal.scanSeed) || 1) + 1;
    state.signal.expiryEndMs = Date.now() + (getTfConfig(state.signal.timeframe).expiryMin || 45) * 60000;
    if (global.LiamMethods && typeof global.LiamMethods.clearLockedSignal === 'function') {
      global.LiamMethods.clearLockedSignal();
    }
    saveState();
    recalculateAndRenderSignal(true);
    showToast(`Struktur ${state.signal.pair} (${state.signal.timeframe}) di-scan ulang!`, 'success');
  }

  function openMappingFromSignals() {
    const pair = state.signal.pair || 'XAUUSD';
    state.chart.pair = pair;
    saveState();
    switchMainTab('chart');
    if (global.LiamIntelligence && typeof global.LiamIntelligence.generateTechnicalMappingBoard === 'function') {
      global.LiamIntelligence.generateTechnicalMappingBoard(true);
    }
  }

  function toggleSignalFilterDrawer() {
    const drawer = document.getElementById('signal-filter-drawer');
    if (drawer) drawer.classList.toggle('hidden');
  }

  function saveTerminalGuardPrefs() {
    const chkSop = document.getElementById('chk-require-sop');
    const chkCd = document.getElementById('chk-require-cooldown');
    const chkNoSetup = document.getElementById('chk-strict-no-setup');
    if (chkSop) state.flags.requireSop100 = chkSop.checked;
    if (chkCd) state.flags.blockOnCooldown = chkCd.checked;
    if (chkNoSetup) state.flags.strictNoSetup = chkNoSetup.checked;
    saveState();
    recalculateAndRenderSignal(false);
    showToast('Filter perlindungan eksekusi disimpan.', 'info');
  }

  function toggleTerminalFlag(flagName) {
    state.flags[flagName] = !state.flags[flagName];
    saveState();
    syncFilterButtonsUI();
    renderNewsLockWarning();
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
      const newsKey = `sniper|${getWibDateKey()}`;
      if (newsKey !== lastAutoSentNewsKey) {
        lastAutoSentNewsKey = newsKey;
        dispatchNewsSniperTelegram(false);
      }
    }
  }

  function syncFilterButtonsUI() {
    const chkSop = document.getElementById('chk-require-sop');
    const chkCd = document.getElementById('chk-require-cooldown');
    const chkNoSetup = document.getElementById('chk-strict-no-setup');
    if (chkSop) chkSop.checked = Boolean(state.flags.requireSop100);
    if (chkCd) chkCd.checked = Boolean(state.flags.blockOnCooldown);
    if (chkNoSetup) chkNoSetup.checked = Boolean(state.flags.strictNoSetup);

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

    const warnBtn = document.getElementById('btn-news-lock-warning');
    if (warnBtn) {
      warnBtn.textContent = state.flags.newsLockWarning ? '🔔 News Lock Warn: ON' : '🔕 News Lock Warn: OFF';
      warnBtn.className = state.flags.newsLockWarning
        ? 'px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold'
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
      const ctx = getWibContextSafe();
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
    const events = global.LiamNews && typeof global.LiamNews.buildDynamicEconomicEvents === 'function'
      ? global.LiamNews.buildDynamicEconomicEvents(state.prices)
      : [];
    const activeEvt = events.find((e) => e.impact === 'high') || events[0] || {
      title: 'Macro Session Liquidity',
      timeWib: 'Sesi Aktif',
      verdictPair: state.signal.pair || 'XAUUSD',
      verdictDirection: 'BUY',
      verdictSummary: 'Pantau konfluensi struktur dan likuiditas aktif.'
    };
    const pair = activeEvt.verdictPair || state.signal.pair || 'XAUUSD';
    const live = getCalibratedPrice(pair);
    const spec = getPairSpecSafe(pair);
    const isBuy = activeEvt.verdictDirection === 'BUY';

    const slDist = pair === 'XAUUSD' ? 4.5 : pair === 'US100' ? 45 : pair === 'BTCUSDT' ? 120 : 0.0018;
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
      `📰 Event: <b>${escapeHtml(ns.event.title)}</b> (${escapeHtml(ns.event.timeWib)})`,
      `🎯 Eksekusi: <b>${escapeHtml(ns.direction)} ${escapeHtml(ns.pair)}</b>`,
      `📍 Entry: <code>${escapeHtml(ns.entryFmt)}</code>`,
      `🛑 SL: <code>${escapeHtml(ns.slFmt)}</code>`,
      `🎯 TP: <code>${escapeHtml(ns.tpFmt)}</code>`,
      `📌 <i>${escapeHtml(ns.rationale)}</i>`
    ].join('\n');

    enqueueNotificationJob({
      dedupeKey: `news-sniper-${ns.pair}-${ns.direction}-${ns.entryFmt}`,
      cooldownMs: 10 * 60000,
      pushTitle: `⚡ News Sniper: ${ns.direction} ${ns.pair}`,
      pushBody: `${ns.event.title} • Entry ${ns.entryFmt} | SL ${ns.slFmt} | TP ${ns.tpFmt}`,
      tgHtml: msg
    });
    if (showFeedback) {
      await flushNotificationQueue(true);
    }
  }

  function computeFallbackSignalSetup(pair, timeframe, methodKey, livePrice, seed, sopBonus) {
    const spec = getPairSpecSafe(pair);
    const dec = spec.decimals;
    const isBuy = (Number(seed) || 1) % 2 === 1;

    const tfSlPipsMap = {
      XAUUSD: { M5: 32, M15: 48, H1: 75, H4: 110 },
      US100:  { M5: 35, M15: 55, H1: 85, H4: 130 },
      BTCUSDT:{ M5: 85, M15: 130, H1: 210, H4: 320 },
      EURUSD: { M5: 14, M15: 22, H1: 35, H4: 55 }
    };
    const pairTable = tfSlPipsMap[pair] || tfSlPipsMap.XAUUSD;
    const slPipsCalc = pairTable[timeframe] || pairTable.M15;
    const slDist = slPipsCalc * spec.pipSize;
    const entryOffset = slDist * 0.35;

    const entryNum = isBuy ? livePrice - entryOffset : livePrice + entryOffset;
    const slNum = isBuy ? entryNum - slDist : entryNum + slDist;
    const tp1Mult = timeframe === 'M5' ? 1.25 : 1.35;
    const tp2Mult = timeframe === 'M5' ? 2.00 : 2.20;
    const tp3Mult = timeframe === 'M5' ? 2.80 : 3.20;

    const tp1Num = isBuy ? entryNum + slDist * tp1Mult : entryNum - slDist * tp1Mult;
    const tp2Num = isBuy ? entryNum + slDist * tp2Mult : entryNum - slDist * tp2Mult;
    const tp3Num = isBuy ? entryNum + slDist * tp3Mult : entryNum - slDist * tp3Mult;

    const zMin = Math.min(entryNum, livePrice);
    const zMax = Math.max(entryNum, livePrice);

    const tp1PipsCalc = Math.round(Math.abs(tp1Num - entryNum) / spec.pipSize);
    const tp2PipsCalc = Math.round(Math.abs(tp2Num - entryNum) / spec.pipSize);
    const tp3PipsCalc = Math.round(Math.abs(tp3Num - entryNum) / spec.pipSize);

    const methodLabels = {
      auto: ['Auto Sniper (Multi-Confluence)', 'AUTO'],
      judas: ['ICT Judas Swing (Session Manipulation)', 'JUDAS'],
      smc_ob: ['SMC Order Block + FVG Confluence', 'SMC OB'],
      sweep: ['Liquidity Sweep (Turtle Soup Stop-Hunt)', 'SWEEP'],
      silver_bullet: ['ICT Silver Bullet (Time-Window FVG)', 'SILVER BULLET'],
      ote: ['FIB OTE (Optimal Trade Entry 0.62–0.79)', 'FIB OTE']
    };
    const [mLabel, mTag] = methodLabels[methodKey] || methodLabels.auto;

    const baseScore = 7.4 + ((Number(seed) % 3) * 0.35);
    const finalScore = Number(Math.min(9.9, baseScore + sopBonus).toFixed(1));

    return {
      status: 'SIGNAL',
      pair,
      timeframe,
      methodKey,
      methodLabel: mLabel,
      methodShortTag: mTag,
      direction: isBuy ? 'BUY' : 'SELL',
      orderType: isBuy ? 'BUY LIMIT' : 'SELL LIMIT',
      score: finalScore,
      zoneRangeFormatted: `${zMin.toFixed(dec)} – ${zMax.toFixed(dec)}`,
      entryFmt: entryNum.toFixed(dec),
      entryNote: isBuy ? 'Midpoint Bullish OB / FVG' : 'Midpoint Bearish OB / FVG',
      slFmt: slNum.toFixed(dec),
      slPips: slPipsCalc,
      slReason: `Kalibrasi ${timeframe} (${slPipsCalc} pips)`,
      tp1Fmt: tp1Num.toFixed(dec),
      tp1Pips: tp1PipsCalc,
      tp1Reason: `1:${tp1Mult} Internal High/Low`,
      tp2Fmt: tp2Num.toFixed(dec),
      tp2Pips: tp2PipsCalc,
      tp2Reason: `1:${tp2Mult} Equilibrium`,
      tp3Fmt: tp3Num.toFixed(dec),
      tp3Pips: tp3PipsCalc,
      tp3Reason: `1:${tp3Mult} HTF Pool`,
      poiSummary: `Struktur ${pair} (${timeframe}) terdeteksi di area ${isBuy ? 'Discount' : 'Premium'} dengan konfluensi likuiditas sesi aktif.`,
      educationHtml: `<p><strong>${isBuy ? 'BUY LIMIT' : 'SELL LIMIT'}</strong> ditempatkan pada area POI terkonfirmasi dengan skala SL/TP ${timeframe} dan manajemen risiko terukur.</p>`,
      pipValuePerLot: spec.pipValuePerLot
    };
  }

  function computePositionSizeSafe(acc, sig) {
    const spec = getPairSpecSafe(sig.pair);
    const equity = Number(acc && (acc.equity !== undefined ? acc.equity : acc.balance)) || 1000;
    const riskPct = Number(acc && acc.riskPct) || 0.4;
    const hardMaxLot = Number(acc && acc.maxLot) || 0.15;

    if (global.LiamMethods && typeof global.LiamMethods.calculatePositionSize === 'function') {
      const calc = global.LiamMethods.calculatePositionSize(
        { equity, balance: equity, riskPct, maxLot: hardMaxLot },
        sig
      );
      if (calc && Number(calc.lot) > 0) {
        return {
          lot: Number(calc.lot),
          actualRiskDollar: Number(calc.actualRiskDollar) || 0,
          tp1Dollar: Number(calc.tp1Dollar) || 0,
          tp2Dollar: Number(calc.tp2Dollar) || 0,
          tp3Dollar: Number(calc.tp3Dollar) || 0,
          wasCapped: Boolean(calc.wasCapped)
        };
      }
    }

    const targetRiskDollar = equity * (riskPct / 100);
    const slPips = Math.max(1, Number(sig.slPips) || 20);
    const rawLot = targetRiskDollar / (slPips * spec.pipValuePerLot);
    let lot = Math.max(0.01, Math.floor(rawLot * 100) / 100);
    let wasCapped = false;
    if (lot > hardMaxLot) {
      lot = hardMaxLot;
      wasCapped = true;
    }

    const actualRiskDollar = Number((lot * slPips * spec.pipValuePerLot).toFixed(2));
    const tp1Dollar = Number((lot * (Number(sig.tp1Pips) || 0) * spec.pipValuePerLot).toFixed(2));
    const tp2Dollar = Number((lot * (Number(sig.tp2Pips) || 0) * spec.pipValuePerLot).toFixed(2));
    const tp3Dollar = Number((lot * (Number(sig.tp3Pips) || 0) * spec.pipValuePerLot).toFixed(2));

    return {
      lot: Number(lot.toFixed(2)),
      actualRiskDollar,
      tp1Dollar,
      tp2Dollar,
      tp3Dollar,
      wasCapped
    };
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
    const pair = state.signal.pair || 'XAUUSD';
    const tf = state.signal.timeframe || 'M15';
    const methodKey = state.signal.method || 'auto';
    const seed = Number(state.signal.scanSeed) || 1;
    const nowMs = Date.now();
    const lastSyncMs = Number(state.lastPriceSyncMs) || nowMs;

    let sig = null;
    try {
      if (global.LiamMethods && typeof global.LiamMethods.buildSignalSetup === 'function') {
        const rawSig = global.LiamMethods.buildSignalSetup({
          pair,
          timeframe: tf,
          method: methodKey,
          livePrice,
          nowMs,
          lastUpdateTs: lastSyncMs,
          maxDataAgeMs: 120000,
          scanSeed: seed,
          sopScoreBonus: sop.scoreBonus
        });
        if (rawSig && rawSig.status === 'SIGNAL' && rawSig.entryFmt && rawSig.entryFmt !== '--') {
          sig = rawSig;
        }
      }
    } catch (_) {
      sig = null;
    }

    if (!sig) {
      sig = computeFallbackSignalSetup(pair, tf, methodKey, livePrice, seed, sop.scoreBonus);
    }

    // Evaluasi Gerbang Ketat NO SETUP & Hard Risk Lock
    const hardLock = evaluateHardRiskLock();
    const ctx = getWibContextSafe();
    const isMondayBlocked = state.flags.mondayFilter && ctx.day === 1 && ctx.hour < 14;
    const isMorningBlocked = state.flags.morningFilter && ctx.hour >= 5 && ctx.hour < 12;
    const scoreNum = Number(sig.score || 7.5);
    const isLowScore = state.flags.strictNoSetup && scoreNum < 7.0;

    let isNoSetup = false;
    let gateReason = `Konfluensi ${sig.methodShortTag} terverifikasi pada ${pair} (${tf}). Bias terkunci 1 arah: ${sig.orderType}.`;
    let gateBadgeText = `SETUP VALID • 1 ARAH TERKUNCI`;
    let gateBadgeClass = 'px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-extrabold text-emerald-300';

    if (hardLock.locked) {
      isNoSetup = true;
      gateReason = hardLock.reason;
      gateBadgeText = 'NO SETUP • HARD RISK LOCK';
      gateBadgeClass = 'px-2 py-0.5 rounded bg-rose-500/25 border border-rose-400/50 text-[10px] font-mono font-extrabold text-rose-300';
    } else if (isMondayBlocked || isMorningBlocked) {
      isNoSetup = true;
      gateReason = isMondayBlocked
        ? 'Monday Filter aktif — terminal menahan entry awal Senin hingga likuiditas terbentuk matang.'
        : 'Filter Sesi Pagi WIB aktif — menunggu pembukaan likuiditas London (13:00 WIB).';
      gateBadgeText = 'NO SETUP • SESSION FILTER';
      gateBadgeClass = 'px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-extrabold text-amber-300';
    } else if (isLowScore) {
      isNoSetup = true;
      gateReason = `Skor konfluensi (${scoreNum.toFixed(1)}/10) di bawah ambang 7.0. Centang SOP atau tunggu konfirmasi struktur lebih kuat.`;
      gateBadgeText = 'NO SETUP • SKOR < 7.0';
      gateBadgeClass = 'px-2 py-0.5 rounded bg-rose-500/25 border border-rose-400/50 text-[10px] font-mono font-extrabold text-rose-300';
    }

    sig.isNoSetup = isNoSetup;

    const pos = computePositionSizeSafe(acc, sig);
    sig.pos = pos;
    currentSignalObj = sig;

    const isBuy = sig.direction === 'BUY';
    const mainCard = document.getElementById('main-sniper-card');
    if (mainCard) {
      mainCard.className = `glass-card motion-card rounded-2xl p-4 border ${
        isNoSetup ? 'border-slate-700' : isBuy ? 'border-emerald-500/45' : 'border-rose-500/45'
      } space-y-3.5`;
    }

    setText('sig-pair-tf', `${sig.pair} • ${sig.timeframe}`);
    setText('sig-method-label', sig.methodLabel);
    setText('sig-score-label', `Score ${scoreNum.toFixed(1)}/10`);

    const gateBadgeEl = document.getElementById('sig-gate-verdict-badge');
    if (gateBadgeEl) {
      gateBadgeEl.textContent = gateBadgeText;
      gateBadgeEl.className = gateBadgeClass;
    }
    setText('sig-gate-reason-text', gateReason);
    setText('sig-mtf-alignment-badge', `MTF: H4/H1/${tf} ${isBuy ? 'Bullish' : 'Bearish'}`);

    const dirBadge = document.getElementById('sig-direction-badge');
    if (dirBadge) {
      if (isNoSetup) {
        dirBadge.textContent = '○ NO SETUP';
        dirBadge.className = 'px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs font-extrabold tracking-wide shrink-0';
      } else {
        dirBadge.textContent = `● ${sig.orderType}`;
        dirBadge.className = isBuy
          ? 'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold tracking-wide shrink-0'
          : 'px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-extrabold tracking-wide shrink-0';
      }
    }

    setText('sig-entry-zone-range', isNoSetup ? '-- – -- (WAIT)' : sig.zoneRangeFormatted);
    setText('sig-entry-type-label', isNoSetup ? 'STANDBY' : sig.orderType);
    const entryEl = document.getElementById('sig-entry-price');
    if (entryEl) {
      entryEl.textContent = isNoSetup ? '--' : sig.entryFmt;
      entryEl.className = `text-lg font-mono font-extrabold ${isNoSetup ? 'text-slate-500' : isBuy ? 'text-sky-400' : 'text-amber-300'}`;
    }
    setText('sig-entry-note', isNoSetup ? 'Menunggu syarat gerbang terpenuhi' : sig.entryNote);

    setText('sig-sl-pips-label', isNoSetup ? 'STOP LOSS' : `STOP LOSS (-${sig.slPips} pips)`);
    setText('sig-sl-price', isNoSetup ? '--' : sig.slFmt);
    setText('sig-sl-reason', isNoSetup ? 'Terkunci' : sig.slReason);

    setText('sig-tp1-pips', isNoSetup ? 'TP 1' : `TP 1 (+${sig.tp1Pips})`);
    setText('sig-tp1-price', isNoSetup ? '--' : sig.tp1Fmt);
    setText('sig-tp1-reason', sig.tp1Reason);

    setText('sig-tp2-pips', isNoSetup ? 'TP 2' : `TP 2 (+${sig.tp2Pips})`);
    setText('sig-tp2-price', isNoSetup ? '--' : sig.tp2Fmt);
    setText('sig-tp2-reason', sig.tp2Reason);

    setText('sig-tp3-pips', isNoSetup ? 'TP 3' : `TP 3 (+${sig.tp3Pips})`);
    setText('sig-tp3-price', isNoSetup ? '--' : sig.tp3Fmt);
    setText('sig-tp3-reason', sig.tp3Reason);

    const poiSummaryEl = document.getElementById('sig-poi-summary');
    if (poiSummaryEl) {
      poiSummaryEl.innerHTML = `📐 <strong class="text-amber-300">Struktur POI:</strong> ${sig.poiSummary}`;
    }

    const eduContentEl = document.getElementById('poi-edu-content');
    if (eduContentEl) eduContentEl.innerHTML = sig.educationHtml || '';

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
    renderActiveSignalRunningWidget();
    renderNewsLockWarning();
    updateSignalExpiryTicker();

    if (allowAutoTelegram && state.config.engineMasterActive && !isNoSetup) {
      const sigKey = `${sig.pair}|${sig.timeframe}|${sig.methodKey}|${sig.direction}|${sig.entryFmt}|${sig.slFmt}|${sig.tp2Fmt}`;
      const tsNow = Date.now();
      const cooldownPassed = tsNow - lastAutoSentSignalTimeMs >= AUTO_TELEGRAM_COOLDOWN_MS;
      if (sigKey !== lastAutoSentSignalKey || cooldownPassed) {
        lastAutoSentSignalKey = sigKey;
        lastAutoSentSignalTimeMs = tsNow;

        const htmlMsg = buildSignalTelegramHtml(sig);
        enqueueNotificationJob({
          dedupeKey: `auto-sig-${sigKey}`,
          cooldownMs: AUTO_TELEGRAM_COOLDOWN_MS,
          pushTitle: `🎯 Setup ${sig.orderType} — ${sig.pair} (${sig.timeframe})`,
          pushBody: `Entry ${sig.entryFmt} | SL ${sig.slFmt} | TP2 ${sig.tp2Fmt} • Lot ${sig.pos.lot.toFixed(2)}`,
          tgHtml: state.config.tgAutoSignal ? htmlMsg : ''
        });
      }
    }
  }

  function updateSignalExpiryTicker() {
    const el = document.getElementById('sig-expiry-timer');
    if (!el) return;
    const tfMin = getTfConfig(state.signal?.timeframe).expiryMin || 45;
    const maxWindowMs = tfMin * 60000;
    const now = Date.now();
    let endMs = Number(state.signal?.expiryEndMs) || 0;
    if (!Number.isFinite(endMs) || endMs <= now || endMs - now > maxWindowMs) {
      endMs = now + maxWindowMs;
      state.signal.expiryEndMs = endMs;
      saveState();
    }
    const remSec = Math.max(0, Math.floor((endMs - now) / 1000));
    const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
    const ss = String(remSec % 60).padStart(2, '0');
    const pulseGlyph = remSec % 2 === 0 ? '⏳' : '🕒';
    el.innerHTML = `<span class="inline-block animate-pulse">${pulseGlyph}</span> <span>${mm}:${ss}</span>`;
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
    if (!currentSignalObj) {
      recalculateAndRenderSignal(false);
    }
    if (!currentSignalObj || currentSignalObj.isNoSetup) {
      showToast('Status saat ini NO SETUP — belum ada angka entry valid.', 'warn');
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

  function formatSignalPlainText(s) {
    if (!s) return '';
    if (s.isNoSetup) {
      return `📊 ${s.pair} (${s.timeframe}) — NO SETUP\nMenunggu konfirmasi struktur & skor >= 7.0.`;
    }
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
    if (!currentSignalObj) {
      recalculateAndRenderSignal(false);
    }
    if (!currentSignalObj) return;
    copyTextValue(formatSignalPlainText(currentSignalObj), 'Setup Lengkap');
  }

  function toggleStandardFormatBox() {
    if (!currentSignalObj) {
      recalculateAndRenderSignal(false);
    }
    state.signal.showStandardFormat = !state.signal.showStandardFormat;
    saveState();
    const box = document.getElementById('standard-format-preview');
    if (!box) return;
    box.classList.toggle('hidden', !state.signal.showStandardFormat);
    if (state.signal.showStandardFormat && currentSignalObj) {
      box.textContent = formatSignalPlainText(currentSignalObj);
    }
  }

  function buildSignalTelegramHtml(s) {
    return [
      `🎯 <b>XLIAMVR SNIPER SIGNAL</b>`,
      `📈 Pair: <b>${escapeHtml(s.pair)}</b> • Timeframe: <b>${escapeHtml(s.timeframe)}</b>`,
      `🧭 Arah: <b>${escapeHtml(s.orderType)}</b> (${escapeHtml(s.methodShortTag)}) • Score: <code>${escapeHtml(Number(s.score || 8.2).toFixed(1))}/10</code>`,
      `📐 Zona POI: <code>${escapeHtml(s.zoneRangeFormatted)}</code>`,
      `📍 Entry: <code>${escapeHtml(s.entryFmt)}</code>`,
      `🛑 SL: <code>${escapeHtml(s.slFmt)}</code> (-${escapeHtml(s.slPips)} pips)`,
      `✅ TP1: <code>${escapeHtml(s.tp1Fmt)}</code> (+${escapeHtml(s.tp1Pips)})`,
      `✅ TP2: <code>${escapeHtml(s.tp2Fmt)}</code> (+${escapeHtml(s.tp2Pips)})`,
      `✅ TP3: <code>${escapeHtml(s.tp3Fmt)}</code> (+${escapeHtml(s.tp3Pips)})`,
      `⚖️ Rekomendasi Lot: <code>${escapeHtml(s.pos ? s.pos.lot.toFixed(2) : '0.02')}</code>`
    ].join('\n');
  }

  async function takeSetupAndSendTelegram() {
    if (!currentSignalObj) {
      recalculateAndRenderSignal(false);
    }
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
    renderActiveSignalRunningWidget();

    enqueueNotificationJob({
      dedupeKey: `take-${logItem.id}`,
      cooldownMs: 30000,
      pushTitle: `⚡ Setup Diambil — ${s.pair} (${s.timeframe})`,
      pushBody: `${s.orderType} @ ${s.entryFmt} | SL ${s.slFmt} | TP2 ${s.tp2Fmt}`,
      tgHtml: buildSignalTelegramHtml(s)
    });

    showToast(`Setup ${s.pair} ${s.orderType} diambil & masuk Jurnal!`, 'success');
    await flushNotificationQueue(true);
  }

  async function sendCurrentSignalToTelegramOnly(showFeedback = true) {
    if (!currentSignalObj) {
      recalculateAndRenderSignal(false);
    }
    if (!currentSignalObj || currentSignalObj.isNoSetup) {
      if (showFeedback) showToast('Status saat ini NO SETUP — tidak ada sinyal aktif dikirim.', 'warn');
      return;
    }
    const s = currentSignalObj;
    enqueueNotificationJob({
      dedupeKey: showFeedback ? '' : `manual-sig-${s.pair}-${s.entryFmt}`,
      cooldownMs: 60000,
      pushTitle: `🎯 Sinyal ${s.pair} (${s.timeframe})`,
      pushBody: `${s.orderType} @ ${s.entryFmt} | SL ${s.slFmt} | TP2 ${s.tp2Fmt}`,
      tgHtml: buildSignalTelegramHtml(s)
    });
    if (showFeedback) {
      await flushNotificationQueue(true);
    }
  }

  // =========================================================================
  // PERFORMANCE RECAP, AI TRADE REVIEW, JOURNAL LOGS & CSV EXPORT
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

  async function markTradeOutcome(logId, outcome, opts = {}) {
    const item = state.tradeLogs.find((t) => t.id === logId);
    if (!item) return;

    item.outcome = outcome;
    if (opts.exitPrice) {
      item.exitPrice = String(opts.exitPrice);
    }

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
    renderActiveSignalRunningWidget();

    if (!opts.silentToast) {
      showToast(`Status ${item.pair} diperbarui menjadi ${outcome}`, 'info');
    }

    if (state.config.tgAutoResult && outcome !== 'CANCEL') {
      const pipSign = item.pipsResult > 0 ? `+${item.pipsResult}` : `${item.pipsResult}`;
      const msg = [
        `📣 <b>UPDATE HASIL TRADE — ${escapeHtml(item.pair)}</b>`,
        `Hasil: <b>${escapeHtml(outcome)}</b> (${escapeHtml(pipSign)} pips)`,
        item.exitPrice ? `Harga Keluar: <code>${escapeHtml(item.exitPrice)}</code>` : '',
        `Arah: ${escapeHtml(item.orderType)} • Entry: <code>${escapeHtml(item.entry)}</code>`,
        `Akun: ${escapeHtml(item.accountName)}`
      ]
        .filter(Boolean)
        .join('\n');

      enqueueNotificationJob({
        dedupeKey: `outcome-${item.id}-${outcome}`,
        cooldownMs: 5 * 60000,
        pushTitle: `📣 ${outcome} — ${item.pair} (${pipSign} pips)`,
        pushBody: `${item.orderType} @ ${item.entry} • Akun ${item.accountName}`,
        tgHtml: msg
      });
    }
  }

  function resetTradeLogs() {
    state.tradeLogs = [];
    saveState();
    renderPerformanceAndLogs();
    renderActiveSignalRunningWidget();
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
    let runningDdPips = 0;
    let maxDdPips = 0;
    let curLossStreak = 0;
    let maxLossStreak = 0;
    let totalR = 0;

    [...periodLogs].reverse().forEach((item) => {
      const pips = Number(item.pipsResult) || 0;
      const slBase = Math.max(1, Number(item.slPips) || 20);
      if (['TP1', 'TP2', 'TP3', 'MANUAL_TP'].includes(item.outcome) || (item.outcome === 'CUT_TP' && pips > 0)) {
        tpHit += 1;
        plusPips += Math.abs(pips);
        runningDdPips = Math.max(0, runningDdPips - Math.abs(pips));
        curLossStreak = 0;
        totalR += Math.abs(pips) / slBase;
      } else if (item.outcome === 'SL' || (item.outcome === 'CUT_SL' && pips < 0)) {
        slHit += 1;
        minusPips += Math.abs(pips);
        runningDdPips += Math.abs(pips);
        maxDdPips = Math.max(maxDdPips, runningDdPips);
        curLossStreak += 1;
        maxLossStreak = Math.max(maxLossStreak, curLossStreak);
        totalR -= Math.abs(pips) / slBase;
      } else if (item.outcome === 'BE') {
        beHit += 1;
      }
    });

    const totalClosed = tpHit + slHit;
    const winrate = totalClosed > 0 ? Math.round((tpHit / totalClosed) * 100) : 0;
    const netPips = Number((plusPips - minusPips).toFixed(1));
    const profitFactor = minusPips > 0 ? (plusPips / minusPips).toFixed(2) : plusPips > 0 ? '9.99' : '0.00';
    const expectancyR = totalClosed > 0 ? (totalR / totalClosed).toFixed(2) : '0.00';

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
    setText('stat-expectancy', `${Number(expectancyR) >= 0 ? '+' : ''}${expectancyR}R`);
    setText('stat-max-dd-pips', `${maxDdPips.toFixed(0)} pips`);
    setText('stat-loss-streak', `${maxLossStreak}x`);

    const reviewEl = document.getElementById('ai-trade-review-summary');
    if (reviewEl) {
      if (totalClosed === 0) {
        reviewEl.textContent = 'Belum ada trade selesai pada periode ini. Pertahankan disiplin SOP dan batasi maksimal 2 entry berkualitas per sesi.';
      } else if (maxLossStreak >= 2) {
        reviewEl.textContent = `Terdeteksi streak ${maxLossStreak}x SL. Pastikan jeda Anti-Revenge Cooldown dipatuhi penuh dan hanya ambil setup dengan SOP >= 80%.`;
      } else {
        reviewEl.textContent = `Expectancy ${expectancyR}R dengan Winrate ${winrate}% (Profit Factor ${profitFactor}x). Pertahankan ukuran lot proporsional sesuai Daily DD Guard.`;
      }
    }

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
        const metrics = evaluateTradeLiveMetrics(item);
        const isClosed = item.status === 'done' || item.status === 'cancel';
        const outcomeBadge = item.outcome
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
              ['TP1', 'TP2', 'TP3', 'MANUAL_TP', 'CUT_TP'].includes(item.outcome)
                ? 'bg-emerald-500/20 text-emerald-300'
                : ['SL', 'CUT_SL'].includes(item.outcome)
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-slate-700 text-slate-200'
            }">${item.outcome} (${item.pipsResult > 0 ? '+' : ''}${item.pipsResult} pips)</span>`
          : `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              metrics.liveStatus === 'RUNNING'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-amber-500/20 text-amber-300'
            }">${metrics.liveStatus}</span>`;

        const livePnlLine = !isClosed
          ? `<div class="text-[10px] font-mono text-slate-400 flex items-center justify-between flex-wrap gap-1 bg-slate-950/70 rounded-lg px-2 py-1">
              <span>Live: <strong class="text-white">${formatPriceSafe(item.pair, metrics.livePx)}</strong></span>
              <span>Floating: <strong class="${metrics.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${metrics.floatingPips >= 0 ? '+' : ''}${metrics.floatingPips} pips (${metrics.floatingDollar >= 0 ? '+' : '-'}$${Math.abs(metrics.floatingDollar).toFixed(2)})</strong></span>
            </div>`
          : '';

        const runningManualBar = item.status === 'active'
          ? `<div class="pt-1.5 space-y-1.5 border-t border-slate-800/80">
              <div class="flex items-center gap-1.5">
                <input id="manual-tp-input-${item.id}" type="number" step="any"
                  placeholder="Input harga TP keluar..."
                  class="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-white" />
                <button type="button" onclick="applyManualTpHitForLog('${item.id}')"
                  class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold active:scale-95 shrink-0">
                  ✅ Hit TP
                </button>
                <button type="button" onclick="moveActiveTradeToBreakeven('${item.id}')"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold active:scale-95 shrink-0">
                  SL→BE
                </button>
                <button type="button" onclick="cutActiveTradeNow('${item.id}')"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sky-300 text-[10px] font-extrabold active:scale-95 shrink-0">
                  Cut
                </button>
              </div>
              <div class="grid grid-cols-5 gap-1">
                <button type="button" onclick="markTradeOutcome('${item.id}', 'TP1')" class="py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-95">TP1</button>
                <button type="button" onclick="markTradeOutcome('${item.id}', 'TP2')" class="py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-95">TP2</button>
                <button type="button" onclick="markTradeOutcome('${item.id}', 'BE')" class="py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-extrabold text-amber-300 active:scale-95">BE</button>
                <button type="button" onclick="markTradeOutcome('${item.id}', 'SL')" class="py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[10px] font-extrabold text-rose-300 active:scale-95">SL</button>
                <button type="button" onclick="markTradeOutcome('${item.id}', 'CANCEL')" class="py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 active:scale-95">Batal</button>
              </div>
            </div>`
          : '';

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
            ${livePnlLine}
            ${runningManualBar}
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
  // CHART TAB: TRADINGVIEW RADAR + 4-TF SCREENING + STRATEGY LAB
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

  function focusChartTimeframe(intervalCode) {
    renderTradingViewChart(state.chart.pair || 'XAUUSD', intervalCode);
    showToast(`Chart difokuskan ke interval ${intervalCode}m`, 'info');
  }

  function renderTradingViewChart(pair, interval = '15') {
    const wrapper = document.getElementById('tv-chart-wrapper');
    if (!wrapper) return;

    const symbol = TV_SYMBOL_MAP[pair] || 'OANDA:XAUUSD';
    const isDark = state.theme === 'dark';

    const widgetConfig = {
      autosize: true,
      symbol,
      interval: String(interval),
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
    iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_liam_chart&symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=${isDark ? '0f172a' : 'f1f5f9'}&theme=${isDark ? 'dark' : 'light'}&style=1&timezone=Asia%2FJakarta&locale=id#${encodedConfig}`;

    wrapper.appendChild(iframe);
  }

  function scanChartStructure(showFeedback = true) {
    const pair = state.chart.pair || 'XAUUSD';
    const price = getCalibratedPrice(pair);
    const tf = state.signal.timeframe || 'M15';
    const seed = Number(state.signal.scanSeed) || 1;
    const spec = getPairSpecSafe(pair);
    const dec = spec.decimals;

    let dr = null;
    try {
      dr = global.LiamMethods && typeof global.LiamMethods.analyzeDealingRange === 'function'
        ? global.LiamMethods.analyzeDealingRange(pair, price, tf, seed, { nowMs: Date.now() })
        : null;
    } catch (_) {
      dr = null;
    }

    const baseSpan = pair === 'EURUSD' ? 0.0042 : pair === 'XAUUSD' ? 12.0 : pair === 'BTCUSDT' ? 850 : 120;
    const swingHighNum = Number.isFinite(Number(dr?.swingHigh)) ? Number(dr.swingHigh) : price + baseSpan * 0.55;
    const swingLowNum = Number.isFinite(Number(dr?.swingLow)) ? Number(dr.swingLow) : price - baseSpan * 0.45;
    const totalRangeNum = Math.max(0.00001, Math.abs(swingHighNum - swingLowNum));
    const eqNum = Number.isFinite(Number(dr?.equilibrium)) ? Number(dr.equilibrium) : (swingHighNum + swingLowNum) / 2;
    const pdPct = Number.isFinite(Number(dr?.pdPercent))
      ? Number(dr.pdPercent)
      : Math.max(0, Math.min(100, Math.round(((price - swingLowNum) / totalRangeNum) * 100)));

    const highFmt = dr?.swingHighFmt || swingHighNum.toFixed(dec);
    const lowFmt = dr?.swingLowFmt || swingLowNum.toFixed(dec);
    const rangeFmt = dr?.totalRange ? formatPriceSafe(pair, dr.totalRange) : totalRangeNum.toFixed(dec);
    const eqFmt = dr?.equilibriumFmt || eqNum.toFixed(dec);

    const shEl = document.getElementById('chart-swing-high');
    const slEl = document.getElementById('chart-swing-low');
    const arEl = document.getElementById('chart-active-range');

    if (shEl) {
      shEl.textContent = highFmt;
      shEl.className = 'text-xs font-mono font-extrabold text-rose-400';
    }
    if (slEl) {
      slEl.textContent = lowFmt;
      slEl.className = 'text-xs font-mono font-extrabold text-emerald-400';
    }
    if (arEl) {
      arEl.textContent = rangeFmt;
      arEl.className = 'text-xs font-mono font-extrabold text-sky-400';
    }

    if (global.LiamIntelligence && typeof global.LiamIntelligence.updateMultiTimeframeMatrix === 'function') {
      global.LiamIntelligence.updateMultiTimeframeMatrix(pair, price, swingHighNum, swingLowNum, eqNum);
    }

    const verdictBox = document.getElementById('chart-scan-verdict-box');
    const zoneLabel = pdPct >= 50 ? 'PREMIUM (Area Jual / Distribusi)' : 'DISCOUNT (Area Beli / Akumulasi)';
    const text = `<strong>${pair} (${TV_SYMBOL_MAP[pair]})</strong> berada pada posisi <strong>${pdPct}% Dealing Range</strong> → Zona <strong>${zoneLabel}</strong>. Equilibrium di <code>${eqFmt}</code>.`;

    if (verdictBox) verdictBox.innerHTML = text;
    if (showFeedback) showToast(`Struktur ${pair} dipindai!`, 'success');
  }

  function runStrategyLabAudit() {
    const outEl = document.getElementById('strategy-lab-results');
    if (!outEl) return;

    const logs = state.tradeLogs || [];
    const byMethod = {};
    logs.forEach((l) => {
      if (l.status !== 'done') return;
      const key = l.methodLabel || 'Auto Sniper';
      if (!byMethod[key]) byMethod[key] = { wins: 0, losses: 0, netPips: 0 };
      const pips = Number(l.pipsResult) || 0;
      if (pips > 0) byMethod[key].wins += 1;
      else if (pips < 0) byMethod[key].losses += 1;
      byMethod[key].netPips += pips;
    });

    const entries = Object.entries(byMethod);
    if (entries.length === 0) {
      outEl.innerHTML = `
        <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-[11px] text-slate-300 leading-relaxed">
          Belum ada trade selesai di Jurnal untuk di-audit Out-of-Sample. Catat minimal 3–5 trade dengan status TP/SL untuk melihat perbandingan Winrate &amp; Expectancy tiap metode ICT/SMC.
        </div>`;
      return;
    }

    outEl.innerHTML = entries
      .map(([name, m]) => {
        const total = m.wins + m.losses;
        const wr = total > 0 ? Math.round((m.wins / total) * 100) : 0;
        return `
          <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 flex items-center justify-between gap-2 font-mono text-[11px]">
            <span class="text-white font-bold truncate">${escapeHtml(name)}</span>
            <span class="text-sky-300">WR ${wr}%</span>
            <span class="${m.netPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${m.netPips >= 0 ? '+' : ''}${m.netPips.toFixed(1)} pips</span>
          </div>`;
      })
      .join('');
    showToast('Audit Strategy Lab selesai!', 'success');
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

  async function saveApiAndCloudSettings() {
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
    await syncLiveMarketPrices(false);
    await flushNotificationQueue(false);
  }

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

  async function dispatchTelegramMessage(htmlText, showFeedback = true, fromQueue = false) {
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
      if (!fromQueue) {
        enqueueNotificationJob({
          dedupeKey: '',
          cooldownMs: 0,
          tgHtml: htmlText,
          pushTitle: '⚠️ Antrean Notif Telegram',
          pushBody: stripHtmlToPlain(htmlText)
        });
      }
      if (showFeedback) showToast(`Koneksi Telegram gagal (${err.message}), masuk antrean kirim ulang.`, 'warn');
      return false;
    }
  }

  async function testTelegramVipBot() {
    const msg = [
      `🤖 <b>LIAMVTRADE QUANT BOT TEST</b>`,
      `Status: <b>ONLINE &amp; TERHUBUNG</b>`,
      `Waktu: <code>${escapeHtml(formatWibShortTime())}</code>`,
      `Akun Aktif: <b>${escapeHtml(getActiveAccount()?.name || '-')}</b>`
    ].join('\n');
    await dispatchTelegramMessage(msg, true);
  }

  function openGuideModal() {
    openModal('modal-guide');
  }

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

  // Expose internal state bridge for intelligence-upgrade.js
  global.__LIAM_TERMINAL_BRIDGE__ = {
    getState: () => state,
    getCalibratedPrice,
    getPairSpecSafe,
    formatPriceSafe,
    getActiveAccount,
    getCurrentSignal: () => currentSignalObj,
    dispatchTelegramMessage,
    showToast
  };

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
    toggleStandardFormatBox,
    takeSetupAndSendTelegram,
    sendCurrentSignalToTelegramOnly,
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
    openMappingFromSignals,
    toggleSignalFilterDrawer,
    saveTerminalGuardPrefs,
    toggleTerminalFlag,
    toggleSignalAlertMode,
    toggleNewsLockWarning,
    toggleNewsSniperMode,
    dispatchNewsSniperTelegram,
    togglePoiEducationDrawer,
    applyManualTpHitForLog,
    moveActiveTradeToBreakeven,
    cutActiveTradeNow,
    flushNotificationQueue,
    setRecapPeriod,
    switchLogSubTab,
    setLogStatusFilter,
    setLogPairFilter,
    markTradeOutcome,
    resetTradeLogs,
    copyPerformanceRecap,
    exportJournalCsv,
    changeChartPair,
    focusChartTimeframe,
    scanChartStructure,
    runStrategyLabAudit,
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
    recalculateAndRenderSignal(true);
    renderPerformanceAndLogs();
    renderNewsSection();
    populateProfileInputs();
    updateClockAndSessions();
    flushNotificationQueue(false);

    syncLiveMarketPrices(false);
    syncNewsEngine(false);

    setInterval(updateClockAndSessions, 1000);
    setInterval(() => syncLiveMarketPrices(false), 25000);
    setInterval(() => flushNotificationQueue(false), 30000);
  });

  window.addEventListener('online', () => {
    flushNotificationQueue(true);
    syncLiveMarketPrices(false);
  });
})(window);
