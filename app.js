/**
 * Liamvtrade Quant Terminal v2.9 — app.js
 * Core Controller:
 * - Multi-Source Live Feed Anti-Nyangkut (XAUUSD, US100, BTCUSDT, EURUSD) + Kalibrasi Broker
 * - ICT Killzone & Session WIB + Auto Weekend BTC Guard
 * - Circuit Breaker Harian + Anti-Revenge Cooldown Timer Pasca-SL
 * - Interactive Pre-Trade SOP (Score Boost & Entry Guard)
 * - Multi-Account Prop Firm Manager + Modal Edit Saldo Lengkap + Daily DD Progress Bar
 * - Signal Terminal (1-Tap Copy per Level, Zona Range POI, Alasan SL/TP, Klik Edukasi POI, News Sniper)
 * - Jurnal & Rekap Pips dengan Auto-Update Ekuitas Akun + Export Excel (.CSV)
 * - Telegram VIP Dispatcher (Format HTML Anti-Error + Auto-Broadcast)
 * - TradingView Radar + Chart Structure Scanner
 * - Super Admin Console + Supabase Cloud Sync 2-Arah (Push & Pull) + Backup/Restore JSON
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'liamvtrade_quant_v29_state';

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
      minBuffer: 20,
      maxEntry: 2,
      curEntry: 0,
      maxSl: 2,
      curSl: 0,
      myfxbookId: '',
      notes: 'Max risk 0.4% per setup. Dilarang entry ±2 menit news merah.'
    },
    {
      id: 'acc-5ers-1',
      name: 'The5ers #1',
      firm: 'The5ers',
      balance: 5000,
      equity: 5185.40,
      riskPct: 0.5,
      maxLot: 0.40,
      dailyDdPct: 5,
      maxDdPct: 10,
      targetPct: 8,
      minBuffer: 100,
      maxEntry: 2,
      curEntry: 0,
      maxSl: 2,
      curSl: 0,
      myfxbookId: '',
      notes: 'High Stakes Step 1. Fokus sesi London & New York Killzone.'
    },
    {
      id: 'acc-prop-2',
      name: 'Propanium #2',
      firm: 'Propanium',
      balance: 10000,
      equity: 10279.30,
      riskPct: 0.4,
      maxLot: 0.80,
      dailyDdPct: 4,
      maxDdPct: 8,
      targetPct: 10,
      minBuffer: 200,
      maxEntry: 2,
      curEntry: 0,
      maxSl: 2,
      curSl: 0,
      myfxbookId: '',
      notes: 'Funded 1-Phase Starter. Jaga konsistensi lot & hindari overtrade.'
    }
  ];

  const DEFAULT_SOP_ITEMS = [
    { id: 'sop-1', text: 'HTF Bias (H4/H1) & Liquidity Pool jelas', checked: false },
    { id: 'sop-2', text: 'Terjadi Sweep High/Low + MSS / Displacement', checked: false },
    { id: 'sop-3', text: 'Risk <= 0.5% & bukan menjelang News Merah', checked: false }
  ];

  const DEFAULT_STATE = {
    theme: 'dark',
    activeTab: 'beranda',
    activePair: 'XAUUSD',
    activeTimeframe: 'M15',
    activeMethod: 'auto',
    chartPair: 'XAUUSD',
    activeAccountId: 'acc-bf-4',
    lastTradingDayWib: '',
    weekendBtcOverride: null, // null = auto (ON Sabtu-Minggu, OFF Senin-Jumat)
    cooldownUntil: 0,
    alertOn: true,
    engineActive: true,
    newsShield: true,
    mondayFilter: false,
    morningFilter: false,
    newsSniperMode: false,
    requireSop100: false,
    requireCooldownLock: true,
    poiEduExpanded: false,
    scanSeed: 1,
    signalCreatedAt: Date.now(),
    recapPeriod: 'today',
    logSubTab: 'signals',
    logStatusFilter: 'all',
    logPairFilter: 'ALL',
    broadcastMessage: '',
    broadcastDismissed: false,
    tdApiKey: '',
    tdQuotaUsed: 0,
    tdQuotaDate: '',
    sbUrl: '',
    sbKey: '',
    tgToken: '',
    tgChatId: '',
    tgAutoSignal: false,
    tgAutoNews: true,
    tgAutoResult: true,
    brokerOffsets: {
      XAUUSD: 0,
      US100: 0,
      BTCUSDT: 0,
      EURUSD: 0
    },
    accounts: DEFAULT_ACCOUNTS,
    sopItems: DEFAULT_SOP_ITEMS,
    tradeLogs: []
  };

  // Live Market Feed State (di-update setiap beberapa detik dari endpoint real-time)
  const marketFeed = {
    rawPrices: {
      XAUUSD: 2645.50,
      US100: 20850.00,
      BTCUSDT: 91500.00,
      EURUSD: 1.05450
    },
    isLive: {
      XAUUSD: false,
      US100: false,
      BTCUSDT: false,
      EURUSD: false
    },
    lastFetchOkAt: 0
  };

  let appState = loadPersistedState();
  let currentSignalSetup = null;
  let lastBroadcastedSignalSignature = '';

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(raw);
      return {
        ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
        ...parsed,
        brokerOffsets: {
          ...DEFAULT_STATE.brokerOffsets,
          ...(parsed.brokerOffsets || {})
        },
        accounts: Array.isArray(parsed.accounts) && parsed.accounts.length ? parsed.accounts : JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
        sopItems: Array.isArray(parsed.sopItems) && parsed.sopItems.length ? parsed.sopItems : JSON.parse(JSON.stringify(DEFAULT_SOP_ITEMS)),
        tradeLogs: Array.isArray(parsed.tradeLogs) ? parsed.tradeLogs : []
      };
    } catch (_e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (_e) {
      // Ignore storage quota errors
    }
  }

  global.appState = appState;

  // ===========================================================================
  // UTILITY HELPERS (TOAST, HTML ESCAPE, CLIPBOARD, WIB TIME)
  // ===========================================================================

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const palette =
      type === 'error'
        ? 'bg-rose-950/95 border-rose-500 text-rose-100'
        : type === 'warn'
        ? 'bg-amber-950/95 border-amber-400 text-amber-100'
        : 'bg-slate-900/95 border-cyan-400 text-cyan-100';

    const el = document.createElement('div');
    el.className = `pointer-events-auto px-4 py-2.5 rounded-2xl border shadow-xl text-xs font-bold backdrop-blur-md transition-all duration-200 ${palette}`;
    el.textContent = message;
    container.innerHTML = '';
    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 2800);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function copyTextValue(text, label) {
    const val = String(text || '').trim();
    if (!val) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(val);
      } else {
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(`✅ ${label || 'Teks'} disalin: ${val.length > 26 ? val.slice(0, 26) + '...' : val}`, 'success');
    } catch (_e) {
      showToast('Gagal menyalin ke clipboard.', 'error');
    }
  }

  function getWibNow() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 7 * 3600000);
  }

  function getTradingDayKeyWib() {
    // Reset harian trading pukul 05:00 WIB
    const wib = getWibNow();
    const shifted = new Date(wib.getTime() - 5 * 3600000);
    return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
  }

  function checkAutoDailyReset() {
    const todayKey = getTradingDayKeyWib();
    if (appState.lastTradingDayWib && appState.lastTradingDayWib !== todayKey) {
      appState.accounts.forEach((acc) => {
        acc.curEntry = 0;
        acc.curSl = 0;
      });
      appState.sopItems.forEach((item) => {
        item.checked = false;
      });
      appState.cooldownUntil = 0;
    }
    appState.lastTradingDayWib = todayKey;
    persistState();
  }

  function getLivePairPrice(pair) {
    const p = pair || appState.activePair || 'XAUUSD';
    const raw = Number(marketFeed.rawPrices[p]) || 0;
    const offset = Number(appState.brokerOffsets[p]) || 0;
    return raw + offset;
  }

  function getActiveAccount() {
    return appState.accounts.find((a) => a.id === appState.activeAccountId) || appState.accounts[0];
  }

  // ===========================================================================
  // MULTI-SOURCE REAL-TIME PRICE ENGINE (CORS-SAFE & ANTI-STUCK)
  // ===========================================================================

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs || 4500);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  function trackTwelveDataQuota() {
    const today = getTradingDayKeyWib();
    if (appState.tdQuotaDate !== today) {
      appState.tdQuotaDate = today;
      appState.tdQuotaUsed = 0;
    }
    appState.tdQuotaUsed += 1;
    const badge = document.getElementById('td-quota-badge');
    if (badge) {
      badge.textContent = `Kuota TD: ${appState.tdQuotaUsed} / 800`;
    }
  }

  async function refreshAllLivePrices(forceRescanAfter) {
    const tdKey = (appState.tdApiKey || '').trim();

    // 1. BTCUSDT (Binance Real-Time Spot Tick)
    try {
      const btcData = await fetchJsonWithTimeout('https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT', 3500);
      const px = parseFloat(btcData.price);
      if (Number.isFinite(px) && px > 1000) {
        marketFeed.rawPrices.BTCUSDT = px;
        marketFeed.isLive.BTCUSDT = true;
      }
    } catch (_e1) {
      try {
        const btcBackup = await fetchJsonWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', 3500);
        const px = parseFloat(btcBackup.price);
        if (Number.isFinite(px) && px > 1000) {
          marketFeed.rawPrices.BTCUSDT = px;
          marketFeed.isLive.BTCUSDT = true;
        }
      } catch (_e2) {
        marketFeed.isLive.BTCUSDT = false;
      }
    }

    // 2. XAUUSD (Twelve Data -> Gold-API Live Spot -> GoldPrice.org -> PAXGUSDT fallback)
    let xauUpdated = false;
    if (tdKey) {
      try {
        const tdXau = await fetchJsonWithTimeout(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${encodeURIComponent(tdKey)}`, 4000);
        trackTwelveDataQuota();
        const px = parseFloat(tdXau.price);
        if (Number.isFinite(px) && px > 500) {
          marketFeed.rawPrices.XAUUSD = px;
          marketFeed.isLive.XAUUSD = true;
          xauUpdated = true;
        }
      } catch (_e) {}
    }
    if (!xauUpdated) {
      try {
        const goldApi = await fetchJsonWithTimeout('https://api.gold-api.com/price/XAU', 3800);
        const px = parseFloat(goldApi.price);
        if (Number.isFinite(px) && px > 500) {
          marketFeed.rawPrices.XAUUSD = px;
          marketFeed.isLive.XAUUSD = true;
          xauUpdated = true;
        }
      } catch (_e) {}
    }
    if (!xauUpdated) {
      try {
        const gp = await fetchJsonWithTimeout('https://data-asg.goldprice.org/dbXRates/USD', 3800);
        const px = gp && gp.items && gp.items[0] ? parseFloat(gp.items[0].xauPrice) : NaN;
        if (Number.isFinite(px) && px > 500) {
          marketFeed.rawPrices.XAUUSD = px;
          marketFeed.isLive.XAUUSD = true;
          xauUpdated = true;
        }
      } catch (_e) {}
    }
    if (!xauUpdated) {
      try {
        const paxg = await fetchJsonWithTimeout('https://data-api.binance.vision/api/v3/ticker/price?symbol=PAXGUSDT', 3500);
        const px = parseFloat(paxg.price);
        if (Number.isFinite(px) && px > 500) {
          marketFeed.rawPrices.XAUUSD = px;
          marketFeed.isLive.XAUUSD = true;
          xauUpdated = true;
        }
      } catch (_e) {
        marketFeed.isLive.XAUUSD = false;
      }
    }

    // 3. EURUSD (Twelve Data -> Binance EURUSDT Tick -> Frankfurter ECB Live)
    let eurUpdated = false;
    if (tdKey) {
      try {
        const tdEur = await fetchJsonWithTimeout(`https://api.twelvedata.com/price?symbol=EUR/USD&apikey=${encodeURIComponent(tdKey)}`, 4000);
        trackTwelveDataQuota();
        const px = parseFloat(tdEur.price);
        if (Number.isFinite(px) && px > 0.5 && px < 2.0) {
          marketFeed.rawPrices.EURUSD = px;
          marketFeed.isLive.EURUSD = true;
          eurUpdated = true;
        }
      } catch (_e) {}
    }
    if (!eurUpdated) {
      try {
        const eurTick = await fetchJsonWithTimeout('https://data-api.binance.vision/api/v3/ticker/price?symbol=EURUSDT', 3500);
        const px = parseFloat(eurTick.price);
        if (Number.isFinite(px) && px > 0.5 && px < 2.0) {
          marketFeed.rawPrices.EURUSD = px;
          marketFeed.isLive.EURUSD = true;
          eurUpdated = true;
        }
      } catch (_e) {}
    }
    if (!eurUpdated) {
      try {
        const fx = await fetchJsonWithTimeout('https://api.frankfurter.app/latest?from=EUR&to=USD', 3500);
        const px = fx && fx.rates ? parseFloat(fx.rates.USD) : NaN;
        if (Number.isFinite(px) && px > 0.5 && px < 2.0) {
          marketFeed.rawPrices.EURUSD = px;
          marketFeed.isLive.EURUSD = true;
          eurUpdated = true;
        }
      } catch (_e) {
        marketFeed.isLive.EURUSD = false;
      }
    }

    // 4. US100 (Twelve Data NDX -> Yahoo Finance ^NDX via CORS-safe proxy)
    let us100Updated = false;
    if (tdKey) {
      try {
        const tdNdx = await fetchJsonWithTimeout(`https://api.twelvedata.com/price?symbol=NDX&apikey=${encodeURIComponent(tdKey)}`, 4000);
        trackTwelveDataQuota();
        const px = parseFloat(tdNdx.price);
        if (Number.isFinite(px) && px > 5000) {
          marketFeed.rawPrices.US100 = px;
          marketFeed.isLive.US100 = true;
          us100Updated = true;
        }
      } catch (_e) {}
    }
    if (!us100Updated) {
      try {
        const yfTarget = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5ENDX?interval=1m&range=1d');
        const yfWrap = await fetchJsonWithTimeout(`https://api.allorigins.win/raw?url=${yfTarget}`, 4500);
        const meta = yfWrap && yfWrap.chart && yfWrap.chart.result && yfWrap.chart.result[0] ? yfWrap.chart.result[0].meta : null;
        const px = meta ? parseFloat(meta.regularMarketPrice) : NaN;
        if (Number.isFinite(px) && px > 5000) {
          marketFeed.rawPrices.US100 = px;
          marketFeed.isLive.US100 = true;
          us100Updated = true;
        }
      } catch (_e) {
        marketFeed.isLive.US100 = false;
      }
    }

    marketFeed.lastFetchOkAt = Date.now();
    updatePriceDisplays();

    if (forceRescanAfter || !currentSignalSetup) {
      recalculateAndRenderSignal(false);
    }
  }

  function updatePriceDisplays() {
    const activePair = appState.activePair || 'XAUUSD';
    const livePx = getLivePairPrice(activePair);
    const fmtPx = global.LiamMethods ? global.LiamMethods.formatPrice(activePair, livePx) : livePx.toFixed(2);
    const isFeedOk = Boolean(marketFeed.isLive[activePair]);

    // Header pill
    const tickerText = document.getElementById('header-ticker-text');
    const feedDot = document.getElementById('header-feed-dot');
    if (tickerText) {
      tickerText.textContent = `${activePair} ${fmtPx}`;
      tickerText.className = isFeedOk
        ? 'text-[11px] font-mono font-bold text-emerald-300'
        : 'text-[11px] font-mono font-bold text-amber-300';
    }
    if (feedDot) {
      feedDot.className = isFeedOk
        ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse'
        : 'w-2 h-2 rounded-full bg-amber-400';
    }

    // Mini prices inside all 4 Pair Selector Buttons
    ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'].forEach((p) => {
      const el = document.getElementById(`pair-btn-price-${p}`);
      if (el) {
        const val = getLivePairPrice(p);
        el.textContent = global.LiamMethods ? global.LiamMethods.formatPrice(p, val) : val.toFixed(2);
      }
    });
  }

  // ===========================================================================
  // BROKER PRICE CALIBRATION MODAL
  // ===========================================================================

  function openCalibrationModal() {
    const pair = appState.activePair || 'XAUUSD';
    const raw = Number(marketFeed.rawPrices[pair]) || 0;
    const offset = Number(appState.brokerOffsets[pair]) || 0;
    const fmt = (v) => (global.LiamMethods ? global.LiamMethods.formatPrice(pair, v) : v.toFixed(2));

    document.getElementById('cal-pair-name').textContent = pair;
    document.getElementById('cal-raw-price').textContent = fmt(raw);
    document.getElementById('cal-current-offset').textContent = (offset >= 0 ? '+' : '') + fmt(offset);
    document.getElementById('cal-broker-price-input').value = fmt(raw + offset);

    // Lot breakdown info
    const acc = getActiveAccount();
    if (acc && currentSignalSetup && global.LiamMethods) {
      const pos = global.LiamMethods.calculatePositionSize(acc, currentSignalSetup);
      document.getElementById('cal-lot-breakdown').innerHTML = `
        <div>Akun Aktif: <strong class="text-white">${escapeHtml(acc.name)}</strong> (Ekuitas $${Number(acc.equity).toFixed(2)})</div>
        <div>Risk ${acc.riskPct}% • SL ${currentSignalSetup.slPips} pips → <strong class="text-cyan-300">${pos.lot} Lot</strong></div>
        <div>Estimasi Risiko SL: <span class="text-rose-400">-$${pos.actualRiskDollar}</span> | TP2: <span class="text-emerald-400">+$${pos.tp2Dollar}</span></div>
      `;
    }

    document.getElementById('modal-calibration').classList.remove('hidden');
  }

  function applyBrokerPriceCalibration() {
    const pair = appState.activePair || 'XAUUSD';
    const inputVal = parseFloat(document.getElementById('cal-broker-price-input').value);
    if (!Number.isFinite(inputVal) || inputVal <= 0) {
      showToast('Masukkan angka harga broker yang valid.', 'error');
      return;
    }
    const raw = Number(marketFeed.rawPrices[pair]) || 0;
    appState.brokerOffsets[pair] = Number((inputVal - raw).toFixed(6));
    persistState();
    updatePriceDisplays();
    recalculateAndRenderSignal(false);
    closeModal('modal-calibration');
    showToast(`Harga ${pair} diselaraskan ke ${inputVal}!`, 'success');
  }

  function resetBrokerPriceCalibration() {
    const pair = appState.activePair || 'XAUUSD';
    appState.brokerOffsets[pair] = 0;
    persistState();
    updatePriceDisplays();
    recalculateAndRenderSignal(false);
    closeModal('modal-calibration');
    showToast(`Offset harga ${pair} direset ke 0.`, 'success');
  }

  // ===========================================================================
  // WIB CLOCK, ICT KILLZONE & WEEKEND BTC GUARD
  // ===========================================================================

  function updateWibClockAndSession() {
    const wib = getWibNow();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    const ss = String(wib.getSeconds()).padStart(2, '0');

    const clockEl = document.getElementById('header-wib-clock');
    if (clockEl) {
      clockEl.textContent = `${days[wib.getDay()]}, ${hh}:${mm}:${ss} WIB`;
    }

    const hour = wib.getHours();
    const day = wib.getDay();
    const isRealWeekend = day === 0 || day === 6;
    const isWeekendBtcOn = appState.weekendBtcOverride !== null ? Boolean(appState.weekendBtcOverride) : isRealWeekend;

    const btnWeekend = document.getElementById('btn-weekend-btc');
    if (btnWeekend) {
      btnWeekend.textContent = isWeekendBtcOn ? '₿ Weekend BTC: ON' : '₿ Weekend BTC: OFF';
      btnWeekend.className = isWeekendBtcOn
        ? 'px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-400/50 bg-amber-500/20 text-amber-200 transition'
        : 'px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-800/80 text-slate-400 transition';
    }

    let badge = 'ASIA RANGE';
    let title = 'Asia Accumulation Range';
    let desc = 'Pembentukan Asia High & Asia Low sebagai kolam likuiditas (liquidity pool) untuk sesi London.';
    let tip = 'Tandai High/Low Asia untuk Judas Swing';
    let nextKzHour = 13;

    if (isWeekendBtcOn) {
      badge = 'CRYPTO 24/7';
      title = 'Weekend Crypto Liquidity Mode';
      desc = 'Pasar Forex & Gold tutup akhir pekan. Terminal difokuskan pada pergerakan likuiditas BTCUSDT.';
      tip = 'Fokus sweep High/Low harian BTCUSDT';
      nextKzHour = 19;
    } else if (hour >= 13 && hour < 17) {
      badge = 'LONDON KZ';
      title = 'London Killzone (Judas Swing)';
      desc = 'Manipulasi awal sesi London sering menyapu Asia High/Low sebelum memulai ekspansi tren intraday.';
      tip = 'Tunggu sweep Asia High/Low + MSS M15';
      nextKzHour = 19;
    } else if (hour >= 19 && hour < 23) {
      badge = 'NY AM KZ';
      title = 'New York AM Killzone (Overlap)';
      desc = 'Volatilitas tertinggi harian saat sesi London & New York tumpang tindih; validasi FVG & Silver Bullet.';
      tip = 'Waspadai rilis News USD 19:30–22:00 WIB';
      nextKzHour = 24;
    } else if (hour >= 0 && hour < 3) {
      badge = 'NY PM KZ';
      title = 'New York PM Re-Distribution';
      desc = 'Sesi penutupan indeks & obligasi AS; sering terjadi pembalikan atau kelanjutan menuju Daily High/Low.';
      tip = 'Amankan profit sebelum spread rollover';
      nextKzHour = 5;
    } else if (hour >= 3 && hour < 5) {
      badge = 'DEAD ZONE';
      title = 'Daily Rollover & Spread Widening';
      desc = 'Likuiditas antarbank menipis dan spread broker melebar. Hindari pembukaan posisi baru.';
      tip = 'Tunggu pembukaan Asia 05:00 WIB';
      nextKzHour = 5;
    }

    const badgeEl = document.getElementById('session-badge');
    const titleEl = document.getElementById('session-title');
    const descEl = document.getElementById('session-desc');
    const tipEl = document.getElementById('session-action-tip');
    const nextKzEl = document.getElementById('next-kz-countdown');

    if (badgeEl) badgeEl.textContent = badge;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (tipEl) tipEl.textContent = tip;

    if (nextKzEl) {
      let diffMins = (nextKzHour - hour) * 60 - wib.getMinutes();
      if (diffMins < 0) diffMins += 24 * 60;
      const nh = Math.floor(diffMins / 60);
      const nm = diffMins % 60;
      nextKzEl.textContent = `Next KZ: ${nh}j ${nm}m`;
    }

    updateCooldownBanner();
    updateSignalExpiryCountdown();
  }

  function toggleWeekendBtcMode() {
    const wib = getWibNow();
    const isRealWeekend = wib.getDay() === 0 || wib.getDay() === 6;
    const current = appState.weekendBtcOverride !== null ? appState.weekendBtcOverride : isRealWeekend;
    appState.weekendBtcOverride = !current;
    if (appState.weekendBtcOverride) {
      selectSignalPair('BTCUSDT');
    }
    persistState();
    updateWibClockAndSession();
  }

  // ===========================================================================
  // CIRCUIT BREAKER & ANTI-REVENGE COOLDOWN
  // ===========================================================================

  function startAntiRevengeCooldown(minutes) {
    const mins = Number(minutes) || 20;
    appState.cooldownUntil = Date.now() + mins * 60000;
    persistState();
    updateCooldownBanner();
  }

  function clearCooldownManual() {
    appState.cooldownUntil = 0;
    persistState();
    updateCooldownBanner();
    showToast('Timer Cooldown direset.', 'success');
  }

  function updateCooldownBanner() {
    const banner = document.getElementById('cooldown-banner');
    const timerText = document.getElementById('cooldown-timer-text');
    if (!banner || !timerText) return;

    const remMs = Number(appState.cooldownUntil) - Date.now();
    if (remMs > 0) {
      banner.classList.remove('hidden');
      const totalSec = Math.ceil(remMs / 1000);
      const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');
      timerText.textContent = `${m}:${s}`;
    } else {
      banner.classList.add('hidden');
    }
  }

  function adjustAccountLimit(field, delta) {
    const acc = getActiveAccount();
    if (!acc) return;
    const nextVal = Math.max(1, Math.min(10, (Number(acc[field]) || 2) + delta));
    acc[field] = nextVal;
    persistState();
    renderBerandaAccounts();
  }

  function adjustAccountCounter(field, delta) {
    const acc = getActiveAccount();
    if (!acc) return;
    const prevVal = Number(acc[field]) || 0;
    const nextVal = Math.max(0, prevVal + delta);
    acc[field] = nextVal;

    // Jika SL Hari Ini bertambah, otomatis aktifkan Anti-Revenge Cooldown 20 menit
    if (field === 'curSl' && nextVal > prevVal) {
      startAntiRevengeCooldown(20);
      showToast('⚠️ SL tercatat! Cooldown 20 menit aktif untuk menjaga psikologi.', 'warn');
    }

    persistState();
    renderBerandaAccounts();
  }

  function resetAllAccountsDailyTrackers() {
    appState.accounts.forEach((acc) => {
      acc.curEntry = 0;
      acc.curSl = 0;
    });
    appState.cooldownUntil = 0;
    persistState();
    renderBerandaAccounts();
    showToast('✅ Tracker Entry, SL & Cooldown seluruh akun direset!', 'success');
  }

  // ===========================================================================
  // PRE-TRADE SOP CHECKLIST (INTERACTIVE & SCORE-BOOSTING)
  // ===========================================================================

  function getSopCompletionStats() {
    const total = appState.sopItems.length || 1;
    const done = appState.sopItems.filter((i) => i.checked).length;
    const pct = Math.round((done / total) * 100);
    const scoreBonus = Number(((done / total) * 0.6).toFixed(1));
    return { total, done, pct, scoreBonus };
  }

  function renderSopList() {
    const container = document.getElementById('sop-list-container');
    if (!container) return;

    const stats = getSopCompletionStats();
    const pctBadge = document.getElementById('sop-percent-badge');
    const boostBadge = document.getElementById('sop-score-boost');
    const hintEl = document.getElementById('sop-status-hint');

    if (pctBadge) {
      pctBadge.textContent = `${stats.pct}%`;
      pctBadge.className =
        stats.pct === 100
          ? 'px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-mono font-extrabold'
          : 'px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-mono font-extrabold text-emerald-300';
    }
    if (boostBadge) {
      boostBadge.textContent = `+${stats.scoreBonus.toFixed(1)} Score`;
    }
    if (hintEl) {
      hintEl.textContent =
        stats.pct === 100
          ? '✅ SOP 100% Lengkap! Kesiapan eksekusi maksimal (+0.6 Score aktif di Terminal).'
          : 'Ketuk baris SOP di bawah untuk mencentang. Berpengaruh langsung ke Skor Sinyal.';
    }

    container.innerHTML = appState.sopItems
      .map(
        (item, idx) => `
        <div onclick="toggleSopItem(${idx})"
          class="flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 border cursor-pointer transition active:scale-[0.99] ${
            item.checked
              ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-100'
              : 'bg-slate-900/80 border-slate-800 text-slate-200'
          }">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-5 h-5 rounded-md flex items-center justify-center text-xs font-extrabold shrink-0 ${
              item.checked
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 border border-slate-600 text-transparent'
            }">✓</span>
            <span class="text-xs font-medium leading-snug ${item.checked ? 'text-emerald-200' : 'text-slate-200'}">
              ${escapeHtml(item.text)}
            </span>
          </div>
          ${
            idx >= 3
              ? `<button type="button" onclick="event.stopPropagation(); removeCustomSopItem(${idx})" class="text-[11px] text-rose-400 px-1">✕</button>`
              : ''
          }
        </div>
      `
      )
      .join('');
  }

  function toggleSopItem(index) {
    if (!appState.sopItems[index]) return;
    appState.sopItems[index].checked = !appState.sopItems[index].checked;
    persistState();
    renderSopList();
    recalculateAndRenderSignal(false);
  }

  function addCustomSopItem() {
    const input = document.getElementById('new-sop-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      showToast('Ketik aturan SOP terlebih dahulu.', 'warn');
      return;
    }
    appState.sopItems.push({
      id: `sop-${Date.now()}`,
      text,
      checked: false
    });
    input.value = '';
    persistState();
    renderSopList();
    showToast('Aturan SOP baru ditambahkan.', 'success');
  }

  function removeCustomSopItem(index) {
    appState.sopItems.splice(index, 1);
    persistState();
    renderSopList();
    recalculateAndRenderSignal(false);
  }

  function resetSopChecklist() {
    appState.sopItems.forEach((i) => {
      i.checked = false;
    });
    persistState();
    renderSopList();
    recalculateAndRenderSignal(false);
    showToast('Checklist SOP direset ke 0%.', 'success');
  }

  // ===========================================================================
  // PROP FIRM PORTFOLIO, ACCOUNT SWITCHER & FULL EDIT SALDO MODAL
  // ===========================================================================

  function renderBerandaAccounts() {
    const selectEl = document.getElementById('active-account-select');
    const activeAcc = getActiveAccount();

    if (selectEl) {
      selectEl.innerHTML = appState.accounts
        .map(
          (a) =>
            `<option value="${a.id}" ${a.id === activeAcc.id ? 'selected' : ''}>${escapeHtml(a.name)} ($${Number(a.equity).toFixed(2)})</option>`
        )
        .join('');
    }

    if (activeAcc) {
      document.getElementById('disp-max-entry').textContent = activeAcc.maxEntry;
      document.getElementById('disp-max-entry-2').textContent = activeAcc.maxEntry;
      document.getElementById('disp-cur-entry').textContent = activeAcc.curEntry;
      document.getElementById('disp-max-sl').textContent = activeAcc.maxSl;
      document.getElementById('disp-max-sl-2').textContent = activeAcc.maxSl;
      document.getElementById('disp-cur-sl').textContent = activeAcc.curSl;

      const ddBadge = document.getElementById('portfolio-dd-badge');
      if (ddBadge) {
        ddBadge.innerHTML = `${activeAcc.dailyDdPct || 4}% Daily<br>Guard`;
      }
    }

    // Portfolio summary totals
    let totalEquity = 0;
    let totalBalance = 0;
    appState.accounts.forEach((a) => {
      totalEquity += Number(a.equity) || 0;
      totalBalance += Number(a.balance) || 0;
    });
    const netProfit = totalEquity - totalBalance;

    const doneTrades = appState.tradeLogs.filter((t) => ['TP1', 'TP2', 'TP3', 'SL'].includes(t.status));
    const wins = doneTrades.filter((t) => ['TP1', 'TP2', 'TP3'].includes(t.status)).length;
    const avgWr = doneTrades.length > 0 ? Math.round((wins / doneTrades.length) * 100) : 74;

    document.getElementById('portfolio-total-equity').textContent = `$${totalEquity.toLocaleString('en-US', {
      minimumFractionDigits: totalEquity % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;

    const netEl = document.getElementById('portfolio-net-profit');
    netEl.textContent = `${netProfit >= 0 ? '+' : '-'}$${Math.abs(netProfit).toFixed(2)}`;
    netEl.className = netProfit >= 0 ? 'text-sm font-mono font-extrabold text-emerald-400' : 'text-sm font-mono font-extrabold text-rose-400';

    document.getElementById('portfolio-avg-winrate').textContent = `${avgWr}%`;

    // Render individual account cards with Daily Drawdown progress bar
    const listEl = document.getElementById('prop-accounts-list');
    if (!listEl) return;

    listEl.innerHTML = appState.accounts
      .map((acc) => {
        const isSelected = acc.id === activeAcc.id;
        const pnl = (Number(acc.equity) || 0) - (Number(acc.balance) || 0);
        const dailyDdLimitDollar = (Number(acc.balance) || 1000) * ((Number(acc.dailyDdPct) || 4) / 100);
        const lossUsed = pnl < 0 ? Math.abs(pnl) : 0;
        const ddUsedPct = Math.min(100, Math.round((lossUsed / Math.max(1, dailyDdLimitDollar)) * 100));
        const remDailyDollar = Math.max(0, dailyDdLimitDollar - lossUsed);

        return `
          <div onclick="switchActiveAccount('${acc.id}')"
            class="rounded-2xl p-3.5 border transition cursor-pointer ${
              isSelected
                ? 'bg-cyan-950/25 border-cyan-400/55 shadow-md shadow-cyan-950/30'
                : 'bg-slate-900/75 border-slate-800'
            } space-y-2.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h4 class="text-sm font-extrabold text-white truncate">${escapeHtml(acc.name)}</h4>
                  ${isSelected ? '<span class="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 text-[9px] font-extrabold">AKTIF</span>' : ''}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  ${escapeHtml(acc.firm)} • Risk ${acc.riskPct}% • Max ${acc.maxLot} lot
                </p>
              </div>

              <div class="text-right shrink-0">
                <div class="text-sm font-mono font-extrabold text-white">$${Number(acc.equity).toFixed(2)}</div>
                <div class="text-xs font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                  ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
                </div>
              </div>
            </div>

            <!-- Daily Drawdown Guard Bar & Edit Saldo Button -->
            <div class="flex items-center justify-between gap-3 pt-1">
              <div class="flex-1 space-y-1">
                <div class="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Sisa Daily DD: $${remDailyDollar.toFixed(2)}</span>
                  <span>Target: ${acc.targetPct || 8}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full ${ddUsedPct > 70 ? 'bg-rose-500' : 'bg-emerald-400'}" style="width: ${Math.max(4, 100 - ddUsedPct)}%"></div>
                </div>
              </div>

              <button type="button" onclick="event.stopPropagation(); openEditAccountModal('${acc.id}')"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 shrink-0 active:scale-95">
                Edit Saldo
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function switchActiveAccount(accId) {
    appState.activeAccountId = accId;
    persistState();
    renderBerandaAccounts();
    recalculateAndRenderSignal(false);
  }

  function toggleAddAccountDrawer() {
    const drawer = document.getElementById('add-account-drawer');
    const arrow = document.getElementById('add-account-arrow');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden');
    if (arrow) arrow.textContent = isHidden ? 'Tutup' : 'Buka';
  }

  function saveNewPropAccount() {
    const name = document.getElementById('new-acc-name').value.trim();
    const firm = document.getElementById('new-acc-firm').value.trim() || 'Prop Firm';
    const balance = parseFloat(document.getElementById('new-acc-balance').value) || 1000;
    const riskPct = parseFloat(document.getElementById('new-acc-risk').value) || 0.4;
    const maxLot = parseFloat(document.getElementById('new-acc-maxlot').value) || 0.15;
    const dailyDdPct = parseFloat(document.getElementById('new-acc-dailydd').value) || 4;
    const maxDdPct = parseFloat(document.getElementById('new-acc-maxdd').value) || 8;
    const targetPct = parseFloat(document.getElementById('new-acc-target').value) || 8;
    const maxEntry = parseInt(document.getElementById('new-acc-maxentry').value, 10) || 2;
    const maxSl = parseInt(document.getElementById('new-acc-maxsl').value, 10) || 2;
    const notes = document.getElementById('new-acc-notes').value.trim();

    if (!name) {
      showToast('Isi Nama Akun terlebih dahulu.', 'warn');
      return;
    }

    const newAcc = {
      id: `acc-${Date.now()}`,
      name,
      firm,
      balance,
      equity: balance,
      riskPct,
      maxLot,
      dailyDdPct,
      maxDdPct,
      targetPct,
      minBuffer: Math.round(balance * 0.02),
      maxEntry,
      curEntry: 0,
      maxSl,
      curSl: 0,
      myfxbookId: '',
      notes
    };

    appState.accounts.push(newAcc);
    appState.activeAccountId = newAcc.id;
    persistState();
    renderBerandaAccounts();
    recalculateAndRenderSignal(false);
    toggleAddAccountDrawer();
    showToast(`Akun ${name} berhasil ditambahkan!`, 'success');
  }

  function openEditAccountModal(accId) {
    const acc = appState.accounts.find((a) => a.id === accId);
    if (!acc) return;

    document.getElementById('edit-acc-id').value = acc.id;
    document.getElementById('edit-acc-name').value = acc.name;
    document.getElementById('edit-acc-firm').value = acc.firm;
    document.getElementById('edit-acc-balance').value = acc.balance;
    document.getElementById('edit-acc-equity').value = acc.equity;
    document.getElementById('edit-acc-risk').value = acc.riskPct;
    document.getElementById('edit-acc-maxlot').value = acc.maxLot;
    document.getElementById('edit-acc-dailydd').value = acc.dailyDdPct ?? 4;
    document.getElementById('edit-acc-maxdd').value = acc.maxDdPct ?? 8;
    document.getElementById('edit-acc-target').value = acc.targetPct ?? 8;
    document.getElementById('edit-acc-buffer').value = acc.minBuffer ?? 0;
    document.getElementById('edit-acc-maxentry').value = acc.maxEntry ?? 2;
    document.getElementById('edit-acc-maxsl').value = acc.maxSl ?? 2;
    document.getElementById('edit-acc-myfxbook').value = acc.myfxbookId || '';
    document.getElementById('edit-acc-notes').value = acc.notes || '';

    document.getElementById('modal-edit-account').classList.remove('hidden');
  }

  function saveEditedAccount() {
    const id = document.getElementById('edit-acc-id').value;
    const acc = appState.accounts.find((a) => a.id === id);
    if (!acc) return;

    acc.name = document.getElementById('edit-acc-name').value.trim() || acc.name;
    acc.firm = document.getElementById('edit-acc-firm').value.trim() || acc.firm;
    acc.balance = parseFloat(document.getElementById('edit-acc-balance').value) || acc.balance;
    acc.equity = parseFloat(document.getElementById('edit-acc-equity').value) || acc.equity;
    acc.riskPct = parseFloat(document.getElementById('edit-acc-risk').value) || acc.riskPct;
    acc.maxLot = parseFloat(document.getElementById('edit-acc-maxlot').value) || acc.maxLot;
    acc.dailyDdPct = parseFloat(document.getElementById('edit-acc-dailydd').value) || 4;
    acc.maxDdPct = parseFloat(document.getElementById('edit-acc-maxdd').value) || 8;
    acc.targetPct = parseFloat(document.getElementById('edit-acc-target').value) || 8;
    acc.minBuffer = parseFloat(document.getElementById('edit-acc-buffer').value) || 0;
    acc.maxEntry = parseInt(document.getElementById('edit-acc-maxentry').value, 10) || 2;
    acc.maxSl = parseInt(document.getElementById('edit-acc-maxsl').value, 10) || 2;
    acc.myfxbookId = document.getElementById('edit-acc-myfxbook').value.trim();
    acc.notes = document.getElementById('edit-acc-notes').value.trim();

    persistState();
    renderBerandaAccounts();
    recalculateAndRenderSignal(false);
    closeModal('modal-edit-account');
    showToast(`✅ Parameter akun ${acc.name} disimpan!`, 'success');
  }

  function deleteEditedAccount() {
    if (appState.accounts.length <= 1) {
      showToast('Minimal harus tersisa 1 akun Prop Firm.', 'warn');
      return;
    }
    const id = document.getElementById('edit-acc-id').value;
    appState.accounts = appState.accounts.filter((a) => a.id !== id);
    if (appState.activeAccountId === id) {
      appState.activeAccountId = appState.accounts[0].id;
    }
    persistState();
    renderBerandaAccounts();
    recalculateAndRenderSignal(false);
    closeModal('modal-edit-account');
    showToast('Akun dihapus dari portofolio.', 'success');
  }

  // ===========================================================================
  // SIGNAL TERMINAL, INTERACTIVE POI EDUCATION & NEWS SNIPER SWITCH
  // ===========================================================================

  function selectSignalPair(pair) {
    appState.activePair = pair;
    appState.chartPair = pair;
    appState.signalCreatedAt = Date.now();
    persistState();

    document.querySelectorAll('.pair-select-btn').forEach((btn) => {
      const active = btn.getAttribute('data-pair') === pair;
      btn.className = active
        ? 'pair-select-btn rounded-xl p-2 bg-blue-600 text-white text-center border border-blue-400/60 transition active:scale-95'
        : 'pair-select-btn rounded-xl p-2 bg-slate-900 text-slate-300 text-center border border-slate-800 transition active:scale-95';
    });

    const chartSel = document.getElementById('chart-pair-select');
    if (chartSel) chartSel.value = pair;

    updatePriceDisplays();
    recalculateAndRenderSignal(true);
    if (global.LiamNews) {
      global.LiamNews.updateNewsSniperPanel(appState.newsSniperMode);
    }
  }

  function selectSignalTimeframe(tf) {
    appState.activeTimeframe = tf;
    appState.signalCreatedAt = Date.now();
    persistState();

    document.querySelectorAll('.tf-select-btn').forEach((btn) => {
      const active = btn.getAttribute('data-tf') === tf;
      btn.className = active
        ? 'tf-select-btn px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-cyan-500 text-slate-950'
        : 'tf-select-btn px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-slate-900 border border-slate-800 text-slate-400';
    });

    recalculateAndRenderSignal(true);
  }

  function selectSignalMethod(method) {
    appState.activeMethod = method;
    appState.signalCreatedAt = Date.now();
    persistState();
    recalculateAndRenderSignal(true);
  }

  function forceRescanSignal() {
    appState.scanSeed = (Number(appState.scanSeed) || 1) + 1;
    appState.signalCreatedAt = Date.now();
    persistState();
    refreshAllLivePrices(true);
    showToast('🔄 Memindai struktur POI terbaru...', 'success');
  }

  function toggleSignalFilterDrawer() {
    const drawer = document.getElementById('signal-filter-drawer');
    if (drawer) drawer.classList.toggle('hidden');
  }

  function saveTerminalGuardPrefs() {
    appState.requireSop100 = Boolean(document.getElementById('chk-require-sop').checked);
    appState.requireCooldownLock = Boolean(document.getElementById('chk-require-cooldown').checked);
    persistState();
  }

  function toggleSignalAlertMode() {
    appState.alertOn = !appState.alertOn;
    persistState();
    syncFilterButtonsUi();
    showToast(appState.alertOn ? '🔔 Alert Sinyal AKTIF' : '🔕 Alert Sinyal DIMATIKAN', 'success');
  }

  function toggleTerminalFlag(flagName) {
    appState[flagName] = !appState[flagName];
    persistState();
    syncFilterButtonsUi();
    recalculateAndRenderSignal(false);
  }

  function toggleNewsSniperMode() {
    appState.newsSniperMode = !appState.newsSniperMode;
    persistState();
    syncFilterButtonsUi();
    if (global.LiamNews) {
      global.LiamNews.updateNewsSniperPanel(appState.newsSniperMode);
    }
    showToast(
      appState.newsSniperMode
        ? '📰 Modul News Sniper AKTIF: Siap menangkap sinyal arah saat news!'
        : '📰 Modul News Sniper DIMATIKAN.',
      'success'
    );
  }

  function syncFilterButtonsUi() {
    const alertBtn = document.getElementById('btn-signal-alert-toggle');
    if (alertBtn) {
      alertBtn.textContent = appState.alertOn ? '● ALERT: ON' : '○ ALERT: OFF';
      alertBtn.className = appState.alertOn
        ? 'px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold active:scale-95'
        : 'px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-extrabold active:scale-95';
    }

    const nsBtn = document.getElementById('btn-news-shield');
    if (nsBtn) {
      nsBtn.textContent = appState.newsShield ? '🛡️ News Shield: ON' : '🛡️ News Shield: OFF';
      nsBtn.className = appState.newsShield
        ? 'px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const monBtn = document.getElementById('btn-monday-filter');
    if (monBtn) {
      monBtn.textContent = appState.mondayFilter ? '📅 Monday Filter: ON' : '📅 Monday Filter: OFF';
      monBtn.className = appState.mondayFilter
        ? 'px-2.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const pagiBtn = document.getElementById('btn-morning-filter');
    if (pagiBtn) {
      pagiBtn.textContent = appState.morningFilter ? '🌅 Filter Pagi: ON' : '🌅 Filter Pagi: OFF';
      pagiBtn.className = appState.morningFilter
        ? 'px-2.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[11px] font-bold'
        : 'px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold';
    }

    const sniperBtn = document.getElementById('btn-news-sniper-toggle');
    if (sniperBtn) {
      sniperBtn.textContent = appState.newsSniperMode ? 'News Sniper: ON' : 'News Sniper: OFF';
      sniperBtn.className = appState.newsSniperMode
        ? 'px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold shrink-0 active:scale-95'
        : 'px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-[11px] font-extrabold shrink-0 active:scale-95';
    }

    const chkSop = document.getElementById('chk-require-sop');
    const chkCd = document.getElementById('chk-require-cooldown');
    if (chkSop) chkSop.checked = Boolean(appState.requireSop100);
    if (chkCd) chkCd.checked = Boolean(appState.requireCooldownLock);
  }

  function recalculateAndRenderSignal(allowAutoTelegramBroadcast) {
    if (!global.LiamMethods) return;

    const sopStats = getSopCompletionStats();
    const livePx = getLivePairPrice(appState.activePair);
    const setup = global.LiamMethods.buildSignalSetup({
      pair: appState.activePair,
      timeframe: appState.activeTimeframe,
      method: appState.activeMethod,
      livePrice: livePx,
      scanSeed: appState.scanSeed,
      sopScoreBonus: sopStats.scoreBonus
    });

    currentSignalSetup = setup;

    const isBuy = setup.direction === 'BUY';
    const cardEl = document.getElementById('main-sniper-card');
    if (cardEl) {
      cardEl.className = isBuy
        ? 'glass-card rounded-2xl p-4 border border-emerald-500/40 space-y-3.5'
        : 'glass-card rounded-2xl p-4 border border-rose-500/40 space-y-3.5';
    }

    const dirBadge = document.getElementById('sig-direction-badge');
    if (dirBadge) {
      dirBadge.textContent = `● ${setup.orderType}`;
      dirBadge.className = isBuy
        ? 'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold tracking-wide shrink-0'
        : 'px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-extrabold tracking-wide shrink-0';
    }

    document.getElementById('sig-pair-tf').textContent = `${setup.pair} • ${setup.timeframe}`;
    document.getElementById('sig-method-label').textContent = setup.methodLabel;
    document.getElementById('sig-score-label').textContent = `Score ${setup.score}/10`;
    document.getElementById('sig-entry-zone-range').textContent = setup.zoneRangeFormatted;

    document.getElementById('sig-entry-type-label').textContent = setup.orderType;
    document.getElementById('sig-entry-price').textContent = setup.entryFmt;
    document.getElementById('sig-entry-note').textContent = setup.entryNote;

    document.getElementById('sig-sl-pips-label').textContent = `STOP LOSS (-${setup.slPips} pips)`;
    document.getElementById('sig-sl-price').textContent = setup.slFmt;
    document.getElementById('sig-sl-reason').textContent = setup.slReason;

    document.getElementById('sig-tp1-pips').textContent = `TP 1 (+${setup.tp1Pips})`;
    document.getElementById('sig-tp1-price').textContent = setup.tp1Fmt;
    document.getElementById('sig-tp1-reason').textContent = setup.tp1Reason;

    document.getElementById('sig-tp2-pips').textContent = `TP 2 (+${setup.tp2Pips})`;
    document.getElementById('sig-tp2-price').textContent = setup.tp2Fmt;
    document.getElementById('sig-tp2-reason').textContent = setup.tp2Reason;

    document.getElementById('sig-tp3-pips').textContent = `TP 3 (+${setup.tp3Pips})`;
    document.getElementById('sig-tp3-price').textContent = setup.tp3Fmt;
    document.getElementById('sig-tp3-reason').textContent = setup.tp3Reason;

    // Interactive POI Summary & Expandable Education Content
    document.getElementById('sig-poi-summary').innerHTML = `📐 <strong class="text-amber-300">Struktur POI:</strong> ${escapeHtml(setup.poiSummary)}`;
    document.getElementById('poi-edu-content').innerHTML = setup.educationHtml;

    const eduDrawer = document.getElementById('poi-education-drawer');
    const eduBadge = document.getElementById('poi-edu-toggle-badge');
    if (eduDrawer && eduBadge) {
      if (appState.poiEduExpanded) {
        eduDrawer.classList.remove('hidden');
        eduBadge.textContent = '📖 Tutup ▲';
      } else {
        eduDrawer.classList.add('hidden');
        eduBadge.textContent = '📖 Belajar ▼';
      }
    }

    // Account Lot & Dollar Risk/Reward
    const acc = getActiveAccount();
    if (acc) {
      const pos = global.LiamMethods.calculatePositionSize(acc, setup);
      document.getElementById('sig-account-name').textContent = acc.name;
      document.getElementById('sig-lot-risk').textContent = `Lot: ${pos.lot.toFixed(2)} (Risk ${acc.riskPct}%)`;
      document.getElementById('sig-dollar-metrics').textContent = `Risk: -$${pos.actualRiskDollar} | TP2: +$${pos.tp2Dollar}`;
      document.getElementById('sig-sop-readiness').textContent = `SOP: ${sopStats.pct}%`;

      const warnEl = document.getElementById('sig-lot-warning');
      if (warnEl) {
        warnEl.classList.toggle('hidden', !pos.wasCapped);
      }
    }

    // News Shield Status Banner
    const shieldBar = document.getElementById('news-shield-status-bar');
    if (shieldBar) {
      if (!appState.newsShield) {
        shieldBar.className = 'rounded-2xl bg-slate-900/80 border border-slate-700 px-3.5 py-2.5 text-xs text-slate-400 leading-relaxed';
        shieldBar.innerHTML = '🛡️ <strong>News Shield Nonaktif:</strong> Proteksi jeda berita dimatikan sementara.';
      } else if (global.LiamNews) {
        const alertStatus = global.LiamNews.getActiveNewsAlertStatus(setup.pair);
        if (alertStatus.inDangerWindow && alertStatus.event) {
          shieldBar.className = 'rounded-2xl bg-rose-950/55 border border-rose-500/60 px-3.5 py-2.5 text-xs text-rose-200 leading-relaxed';
          shieldBar.innerHTML = `🚨 <strong>NEWS SHIELD WARNING:</strong> Agenda merah <em>${escapeHtml(alertStatus.event.title)}</em> (${alertStatus.timing.countdownText}). Tahan entry baru hingga volatilitas mereda!`;
        } else {
          shieldBar.className = 'rounded-2xl bg-amber-500/10 border border-amber-400/35 px-3.5 py-2.5 text-xs text-amber-200 leading-relaxed';
          shieldBar.innerHTML = '🛡️ <strong>News Shield Aktif:</strong> Terminal memantau jadwal High Impact USD/EUR di tab News. Hindari entry ±15 menit saat rilis data merah.';
        }
      }
    }

    // Standard Format Text Preview
    const fmtPreview = document.getElementById('standard-format-preview');
    if (fmtPreview) {
      fmtPreview.textContent = buildStandardPlainTextSignal(setup);
    }

    // Auto-Broadcast to VIP Telegram if enabled and setup changed
    const sigKey = `${setup.pair}-${setup.timeframe}-${setup.methodKey}-${setup.direction}-${setup.entryFmt}`;
    if (
      allowAutoTelegramBroadcast &&
      appState.tgAutoSignal &&
      appState.engineActive &&
      lastBroadcastedSignalSignature !== sigKey
    ) {
      lastBroadcastedSignalSignature = sigKey;
      sendTelegramHtmlMessage(buildTelegramHtmlSignal(setup), `Auto-Sinyal ${setup.pair}`, true);
    }
  }

  function togglePoiEducationDrawer() {
    appState.poiEduExpanded = !appState.poiEduExpanded;
    persistState();
    const drawer = document.getElementById('poi-education-drawer');
    const badge = document.getElementById('poi-edu-toggle-badge');
    if (drawer && badge) {
      drawer.classList.toggle('hidden', !appState.poiEduExpanded);
      badge.textContent = appState.poiEduExpanded ? '📖 Tutup ▲' : '📖 Belajar ▼';
    }
  }

  function updateSignalExpiryCountdown() {
    const timerEl = document.getElementById('sig-expiry-timer');
    if (!timerEl || !currentSignalSetup) return;
    const totalMs = (currentSignalSetup.expiryMinutes || 45) * 60000;
    const elapsed = Date.now() - (Number(appState.signalCreatedAt) || Date.now());
    const rem = totalMs - elapsed;
    if (rem <= 0) {
      appState.signalCreatedAt = Date.now();
      appState.scanSeed = (Number(appState.scanSeed) || 1) + 1;
      recalculateAndRenderSignal(false);
      return;
    }
    const sec = Math.floor(rem / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    timerEl.textContent = `⏳ ${m}:${s}`;
  }

  function copySignalField(field) {
    if (!currentSignalSetup) return;
    const map = {
      entry: { val: currentSignalSetup.entryFmt, name: 'Entry Limit' },
      sl: { val: currentSignalSetup.slFmt, name: 'Stop Loss' },
      tp1: { val: currentSignalSetup.tp1Fmt, name: 'TP 1' },
      tp2: { val: currentSignalSetup.tp2Fmt, name: 'TP 2' },
      tp3: { val: currentSignalSetup.tp3Fmt, name: 'TP 3' }
    };
    const item = map[field];
    if (item) copyTextValue(item.val, item.name);
  }

  function buildStandardPlainTextSignal(setup) {
    const acc = getActiveAccount();
    const pos = acc && global.LiamMethods ? global.LiamMethods.calculatePositionSize(acc, setup) : { lot: 0.01 };
    return [
      `⚡ LIAMVTRADE QUANT SIGNAL`,
      `Pair: ${setup.pair} (${setup.timeframe})`,
      `Order: ${setup.orderType}`,
      `Metode: ${setup.methodLabel} | Score ${setup.score}/10`,
      `Zona Range POI: ${setup.zoneRangeFormatted}`,
      `Entry: ${setup.entryFmt}`,
      `SL: ${setup.slFmt} (-${setup.slPips} pips)`,
      `TP 1: ${setup.tp1Fmt} (+${setup.tp1Pips} pips)`,
      `TP 2: ${setup.tp2Fmt} (+${setup.tp2Pips} pips)`,
      `TP 3: ${setup.tp3Fmt} (+${setup.tp3Pips} pips)`,
      `Lot Akun (${acc ? acc.name : 'Prop'}): ${pos.lot} lot`,
      `Struktur: ${setup.poiSummary}`
    ].join('\n');
  }

  function copyFullSignalSetup() {
    if (!currentSignalSetup) return;
    copyTextValue(buildStandardPlainTextSignal(currentSignalSetup), 'Setup Lengkap');
  }

  function toggleStandardFormatBox() {
    const box = document.getElementById('standard-format-preview');
    if (box) box.classList.toggle('hidden');
  }

  // ===========================================================================
  // TELEGRAM VIP DISPATCHER (HTML PARSE MODE — ANTI-ERROR 400)
  // ===========================================================================

  function buildTelegramHtmlSignal(setup) {
    const acc = getActiveAccount();
    const pos = acc && global.LiamMethods
      ? global.LiamMethods.calculatePositionSize(acc, setup)
      : { lot: 0.01, actualRiskDollar: 0, tp2Dollar: 0 };
    const icon = setup.direction === 'BUY' ? '🟢' : '🔴';

    return [
      `${icon} <b>LIAMVTRADE VIP QUANT SIGNAL</b>`,
      ``,
      `📌 <b>Pair:</b> ${escapeHtml(setup.pair)} • <b>TF:</b> ${escapeHtml(setup.timeframe)}`,
      `⚡ <b>Eksekusi:</b> <b>${escapeHtml(setup.orderType)}</b>`,
      `🧠 <b>Metode:</b> ${escapeHtml(setup.methodLabel)} (Score ${setup.score}/10)`,
      `📍 <b>Zona POI:</b> <code>${escapeHtml(setup.zoneRangeFormatted)}</code>`,
      ``,
      `🎯 <b>Entry:</b> <code>${escapeHtml(setup.entryFmt)}</code>`,
      `🛑 <b>SL:</b> <code>${escapeHtml(setup.slFmt)}</code> (-${setup.slPips} pips)`,
      `✅ <b>TP 1:</b> <code>${escapeHtml(setup.tp1Fmt)}</code> (+${setup.tp1Pips} pips)`,
      `✅ <b>TP 2:</b> <code>${escapeHtml(setup.tp2Fmt)}</code> (+${setup.tp2Pips} pips)`,
      `✅ <b>TP 3:</b> <code>${escapeHtml(setup.tp3Fmt)}</code> (+${setup.tp3Pips} pips)`,
      ``,
      `💼 <b>Lot Saran:</b> ${pos.lot} lot (Risk ${acc ? acc.riskPct : 0.4}% / -$${pos.actualRiskDollar})`,
      `📐 <b>Analisa:</b> <i>${escapeHtml(setup.poiSummary)}</i>`
    ].join('\n');
  }

  async function sendTelegramHtmlMessage(htmlMessage, actionLabel, isSilent) {
    const token = (appState.tgToken || '').trim();
    const chatId = (appState.tgChatId || '').trim();

    if (!token || !chatId) {
      if (!isSilent) {
        showToast('Isi Bot Token & Chat ID Telegram di tab Profil terlebih dahulu.', 'warn');
      }
      return false;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      const data = await res.json();
      if (!data.ok) {
        if (!isSilent) {
          showToast(`Telegram Error (${data.error_code}): ${data.description}`, 'error');
        }
        return false;
      }
      if (!isSilent) {
        showToast(`📨 ${actionLabel || 'Pesan'} terkirim ke VIP Telegram!`, 'success');
      }
      return true;
    } catch (err) {
      if (!isSilent) {
        showToast('Gagal terhubung ke server Telegram. Cek koneksi internet.', 'error');
      }
      return false;
    }
  }

  async function testTelegramVipBot() {
    saveApiAndCloudSettings(true);
    const msg = [
      `✅ <b>TES KONEKSI BOT VIP BERHASIL!</b>`,
      ``,
      `Terminal <b>Liamvtrade Quant v2.9</b> siap mengirim sinyal ICT/SMC, News Sniper, &amp; Laporan Jurnal otomatis.`
    ].join('\n');
    await sendTelegramHtmlMessage(msg, 'Tes Bot VIP', false);
  }

  async function sendCurrentSignalToTelegramOnly() {
    if (!currentSignalSetup) return;
    await sendTelegramHtmlMessage(buildTelegramHtmlSignal(currentSignalSetup), `Sinyal ${currentSignalSetup.pair}`, false);
  }

  async function takeSetupAndSendTelegram() {
    if (!currentSignalSetup) return;

    // 1. Cek Guard SOP 100% jika diaktifkan
    const sopStats = getSopCompletionStats();
    if (appState.requireSop100 && sopStats.pct < 100) {
      showToast(`⚠️ Lengkapi Pre-Trade SOP di Beranda dulu (Baru ${sopStats.pct}%).`, 'warn');
      return;
    }

    // 2. Cek Cooldown Guard
    if (appState.requireCooldownLock && Number(appState.cooldownUntil) > Date.now()) {
      showToast('🧊 Anti-Revenge Cooldown masih aktif! Tunggu jeda selesai.', 'warn');
      return;
    }

    // 3. Cek Circuit Breaker Entry Harian
    const acc = getActiveAccount();
    if (acc && acc.curEntry >= acc.maxEntry) {
      showToast(`🛑 Batas Entry Harian akun ${acc.name} (${acc.maxEntry}/${acc.maxEntry}) sudah penuh!`, 'error');
      return;
    }

    const pos = acc && global.LiamMethods
      ? global.LiamMethods.calculatePositionSize(acc, currentSignalSetup)
      : { lot: 0.01 };

    const logEntry = {
      id: `trd-${Date.now()}`,
      createdAt: Date.now(),
      dateWib: getTradingDayKeyWib(),
      accountId: acc ? acc.id : '',
      accountName: acc ? acc.name : 'Prop Account',
      pair: currentSignalSetup.pair,
      timeframe: currentSignalSetup.timeframe,
      methodLabel: currentSignalSetup.methodShortTag,
      direction: currentSignalSetup.direction,
      orderType: currentSignalSetup.orderType,
      entryFmt: currentSignalSetup.entryFmt,
      slFmt: currentSignalSetup.slFmt,
      tp1Fmt: currentSignalSetup.tp1Fmt,
      tp2Fmt: currentSignalSetup.tp2Fmt,
      tp3Fmt: currentSignalSetup.tp3Fmt,
      slPips: currentSignalSetup.slPips,
      tp1Pips: currentSignalSetup.tp1Pips,
      tp2Pips: currentSignalSetup.tp2Pips,
      tp3Pips: currentSignalSetup.tp3Pips,
      pipValuePerLot: currentSignalSetup.pipValuePerLot,
      lot: pos.lot,
      status: 'OPEN', // 'OPEN' | 'TP1' | 'TP2' | 'TP3' | 'SL' | 'BE' | 'BATAL'
      resultPips: 0,
      resultDollar: 0
    };

    appState.tradeLogs.unshift(logEntry);
    if (acc) {
      acc.curEntry = (Number(acc.curEntry) || 0) + 1;
    }
    persistState();
    renderBerandaAccounts();
    renderPerformanceAndLogs();

    showToast(`⚡ Setup ${logEntry.pair} dicatat ke Jurnal!`, 'success');
    if (appState.tgToken && appState.tgChatId) {
      await sendTelegramHtmlMessage(buildTelegramHtmlSignal(currentSignalSetup), `Setup ${logEntry.pair}`, false);
    }
  }

  // ===========================================================================
  // PERFORMANCE RECAP & JOURNAL (AUTO-UPDATES PROP ACCOUNT EQUITY)
  // ===========================================================================

  function setRecapPeriod(period) {
    appState.recapPeriod = period;
    persistState();
    document.querySelectorAll('.recap-period-btn').forEach((btn) => {
      const active = btn.getAttribute('data-recap-period') === period;
      btn.className = active
        ? 'recap-period-btn py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 text-white'
        : 'recap-period-btn py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });
    renderPerformanceAndLogs();
  }

  function switchLogSubTab(sub) {
    appState.logSubTab = sub;
    persistState();
    document.querySelectorAll('.log-subtab-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-tab') === sub;
      btn.className = active
        ? 'log-subtab-btn py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white'
        : 'log-subtab-btn py-2 rounded-xl text-xs font-extrabold text-slate-400';
    });
    renderPerformanceAndLogs();
  }

  function setLogStatusFilter(status) {
    appState.logStatusFilter = status;
    persistState();
    document.querySelectorAll('.log-status-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-status') === status;
      btn.className = active
        ? 'log-status-btn px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500 text-slate-950'
        : 'log-status-btn px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300';
    });
    renderPerformanceAndLogs();
  }

  function setLogPairFilter(pair) {
    appState.logPairFilter = pair;
    persistState();
    document.querySelectorAll('.log-pair-btn').forEach((btn) => {
      const active = btn.getAttribute('data-log-pair') === pair;
      btn.className = active
        ? 'log-pair-btn py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 text-white'
        : 'log-pair-btn py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });
    renderPerformanceAndLogs();
  }

  function filterLogsByRecapPeriod(logs) {
    const now = Date.now();
    const todayKey = getTradingDayKeyWib();
    return logs.filter((t) => {
      if (appState.recapPeriod === 'today') return t.dateWib === todayKey;
      const diffDays = (now - Number(t.createdAt)) / (1000 * 3600 * 24);
      if (appState.recapPeriod === 'week') return diffDays <= 7;
      if (appState.recapPeriod === 'month') return diffDays <= 31;
      if (appState.recapPeriod === 'year') return diffDays <= 366;
      return true;
    });
  }

  function renderPerformanceAndLogs() {
    const periodLogs = filterLogsByRecapPeriod(appState.tradeLogs);

    let tpHit = 0;
    let slHit = 0;
    let beHit = 0;
    let plusPips = 0;
    let minusPips = 0;

    periodLogs.forEach((t) => {
      if (['TP1', 'TP2', 'TP3'].includes(t.status)) {
        tpHit += 1;
        plusPips += Math.abs(Number(t.resultPips) || 0);
      } else if (t.status === 'SL') {
        slHit += 1;
        minusPips += Math.abs(Number(t.resultPips) || 0);
      } else if (t.status === 'BE') {
        beHit += 1;
      }
    });

    const decided = tpHit + slHit;
    const winrate = decided > 0 ? Math.round((tpHit / decided) * 100) : 0;
    const netPips = Number((plusPips - minusPips).toFixed(1));
    const pf = minusPips > 0 ? (plusPips / minusPips).toFixed(2) : plusPips > 0 ? '9.99' : '0.00';

    document.getElementById('stat-tp-hit').textContent = tpHit;
    document.getElementById('stat-sl-hit').textContent = slHit;
    document.getElementById('stat-be-hit').textContent = beHit;
    document.getElementById('stat-winrate').textContent = `${winrate}%`;
    document.getElementById('stat-plus-pips').textContent = `+${Number(plusPips.toFixed(1))}`;
    document.getElementById('stat-minus-pips').textContent = `-${Number(minusPips.toFixed(1))}`;
    document.getElementById('stat-net-pips').textContent = `${netPips >= 0 ? '+' : ''}${netPips}`;
    document.getElementById('stat-profit-factor').textContent = `${pf}x`;

    const totalCount = appState.tradeLogs.length;
    document.getElementById('journal-count-pill').textContent = `${totalCount} JURNAL`;
    document.getElementById('journal-tab-count').textContent = totalCount;

    // Filter list for display
    const visibleLogs = appState.tradeLogs.filter((t) => {
      if (appState.logPairFilter !== 'ALL' && t.pair !== appState.logPairFilter) return false;
      if (appState.logStatusFilter === 'done' && !['TP1', 'TP2', 'TP3', 'SL', 'BE'].includes(t.status)) return false;
      if (appState.logStatusFilter === 'cancel' && t.status !== 'BATAL') return false;
      return true;
    });

    const container = document.getElementById('trade-logs-container');
    if (!container) return;

    if (!visibleLogs.length) {
      container.innerHTML = `
        <div class="glass-card rounded-2xl p-5 text-center text-xs text-slate-400">
          Belum ada catatan transaksi pada filter ini.
        </div>
      `;
      return;
    }

    container.innerHTML = visibleLogs
      .map((t) => {
        const isBuy = t.direction === 'BUY';
        const statusColors = {
          OPEN: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
          TP1: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          TP2: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          TP3: 'bg-emerald-400 text-slate-950 border-emerald-300',
          SL: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          BE: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          BATAL: 'bg-slate-800 text-slate-400 border-slate-700'
        };

        return `
          <div class="glass-card rounded-2xl p-3.5 space-y-2.5 border border-slate-800">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }">${t.orderType}</span>
                <strong class="text-xs text-white">${t.pair} • ${t.timeframe}</strong>
                <span class="text-[10px] text-slate-400">(${escapeHtml(t.methodLabel)})</span>
              </div>
              <span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${statusColors[t.status] || statusColors.OPEN}">
                ${t.status}
              </span>
            </div>

            <div class="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>Entry: <strong class="text-sky-400">${t.entryFmt}</strong> • SL: <strong class="text-rose-400">${t.slFmt}</strong></span>
              <span class="${t.resultDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                ${t.resultPips !== 0 ? `${t.resultPips > 0 ? '+' : ''}${t.resultPips} pips ($${t.resultDollar.toFixed(2)})` : `${t.lot} lot`}
              </span>
            </div>

            <div class="text-[10px] text-slate-400">Akun: ${escapeHtml(t.accountName)} • ${t.dateWib}</div>

            <!-- 1-Tap Outcome Buttons (Auto-Updates Account Equity!) -->
            <div class="grid grid-cols-6 gap-1 pt-1">
              <button type="button" onclick="markTradeOutcome('${t.id}', 'TP1')"
                class="py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-90">TP1</button>
              <button type="button" onclick="markTradeOutcome('${t.id}', 'TP2')"
                class="py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300 active:scale-90">TP2</button>
              <button type="button" onclick="markTradeOutcome('${t.id}', 'TP3')"
                class="py-1.5 rounded-lg bg-emerald-600 text-[10px] font-extrabold text-white active:scale-90">TP3</button>
              <button type="button" onclick="markTradeOutcome('${t.id}', 'SL')"
                class="py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[10px] font-extrabold text-rose-300 active:scale-90">SL</button>
              <button type="button" onclick="markTradeOutcome('${t.id}', 'BE')"
                class="py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-[10px] font-extrabold text-amber-300 active:scale-90">BE</button>
              <button type="button" onclick="markTradeOutcome('${t.id}', 'BATAL')"
                class="py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 active:scale-90">Batal</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  async function markTradeOutcome(tradeId, outcome) {
    const trade = appState.tradeLogs.find((t) => t.id === tradeId);
    if (!trade) return;

    const acc = appState.accounts.find((a) => a.id === trade.accountId) || getActiveAccount();

    // Rollback dampak saldo sebelumnya jika user mengoreksi status
    if (acc && trade.resultDollar !== 0) {
      acc.equity = Number((Number(acc.equity) - Number(trade.resultDollar)).toFixed(2));
    }

    let pips = 0;
    if (outcome === 'TP1') pips = Math.abs(Number(trade.tp1Pips) || 0);
    else if (outcome === 'TP2') pips = Math.abs(Number(trade.tp2Pips) || 0);
    else if (outcome === 'TP3') pips = Math.abs(Number(trade.tp3Pips) || 0);
    else if (outcome === 'SL') pips = -Math.abs(Number(trade.slPips) || 0);
    else pips = 0;

    const pipVal = Number(trade.pipValuePerLot) || 10;
    const lot = Number(trade.lot) || 0.01;
    const dollarChange = Number((pips * lot * pipVal).toFixed(2));

    trade.status = outcome;
    trade.resultPips = pips;
    trade.resultDollar = dollarChange;

    if (acc) {
      acc.equity = Number((Number(acc.equity) + dollarChange).toFixed(2));
      if (outcome === 'SL') {
        acc.curSl = (Number(acc.curSl) || 0) + 1;
        startAntiRevengeCooldown(20);
      }
    }

    persistState();
    renderBerandaAccounts();
    renderPerformanceAndLogs();

    showToast(
      `Jurnal ditandai ${outcome} (${pips >= 0 ? '+' : ''}${pips} pips / ${dollarChange >= 0 ? '+' : ''}$${dollarChange.toFixed(2)})`,
      outcome === 'SL' ? 'warn' : 'success'
    );

    if (appState.tgAutoResult && appState.tgToken && appState.tgChatId && outcome !== 'BATAL') {
      const icon = outcome.startsWith('TP') ? '🏆' : outcome === 'SL' ? '🛑' : '⚖️';
      const msg = [
        `${icon} <b>UPDATE JURNAL LIAMVTRADE: ${escapeHtml(outcome)}</b>`,
        `Pair: <b>${escapeHtml(trade.pair)}</b> (${escapeHtml(trade.orderType)})`,
        `Hasil: <b>${pips >= 0 ? '+' : ''}${pips} pips</b> (${dollarChange >= 0 ? '+' : ''}$${dollarChange.toFixed(2)})`,
        `Ekuitas ${escapeHtml(acc ? acc.name : '')}: <b>$${acc ? acc.equity.toFixed(2) : '-'}</b>`
      ].join('\n');
      await sendTelegramHtmlMessage(msg, 'Laporan Jurnal', true);
    }
  }

  function resetTradeLogs() {
    appState.tradeLogs = [];
    persistState();
    renderPerformanceAndLogs();
    showToast('Riwayat & Jurnal Sinyal dikosongkan.', 'success');
  }

  function copyPerformanceRecap() {
    const text = [
      `📊 REKAP PERFORMA LIAMVTRADE (${appState.recapPeriod.toUpperCase()})`,
      `TP Hit: ${document.getElementById('stat-tp-hit').textContent} | SL Hit: ${document.getElementById('stat-sl-hit').textContent} | BE: ${document.getElementById('stat-be-hit').textContent}`,
      `Winrate: ${document.getElementById('stat-winrate').textContent} | Net Pips: ${document.getElementById('stat-net-pips').textContent} | Profit Factor: ${document.getElementById('stat-profit-factor').textContent}`
    ].join('\n');
    copyTextValue(text, 'Rekap Performa');
  }

  function exportJournalCsv() {
    if (!appState.tradeLogs.length) {
      showToast('Belum ada data jurnal untuk diexport.', 'warn');
      return;
    }
    const headers = ['Tanggal_WIB', 'Akun', 'Pair', 'Timeframe', 'Order', 'Metode', 'Entry', 'SL', 'TP1', 'TP2', 'TP3', 'Lot', 'Status', 'Net_Pips', 'Net_USD'];
    const rows = appState.tradeLogs.map((t) => [
      t.dateWib,
      `"${t.accountName}"`,
      t.pair,
      t.timeframe,
      t.orderType,
      `"${t.methodLabel}"`,
      t.entryFmt,
      t.slFmt,
      t.tp1Fmt,
      t.tp2Fmt,
      t.tp3Fmt,
      t.lot,
      t.status,
      t.resultPips,
      t.resultDollar
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Liamvtrade_Jurnal_${getTradingDayKeyWib()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📥 File Excel (.CSV) Jurnal berhasil diunduh!', 'success');
  }

  // ===========================================================================
  // TAB CHART (TRADINGVIEW RADAR & STRUCTURE SCANNER)
  // ===========================================================================

  function renderTradingViewRadar(pair) {
    const wrapper = document.getElementById('tv-chart-wrapper');
    if (!wrapper) return;

    const symbolMap = {
      XAUUSD: 'OANDA:XAUUSD',
      US100: 'NASDAQ:NDX',
      BTCUSDT: 'BINANCE:BTCUSDT',
      EURUSD: 'FX:EURUSD'
    };
    const tvSymbol = symbolMap[pair] || 'OANDA:XAUUSD';
    const theme = appState.theme === 'light' ? 'light' : 'dark';

    const iframeUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
      tvSymbol
    )}&interval=15&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=070d19&studies=%5B%5D&theme=${theme}&style=1&timezone=Asia%2FJakarta&withdateranges=1&locale=id`;

    wrapper.innerHTML = `<iframe src="${iframeUrl}" class="w-full h-full border-0" allowtransparency="true" scrolling="no"></iframe>`;
  }

  function changeChartPair(pair) {
    appState.chartPair = pair;
    persistState();
    renderTradingViewRadar(pair);
    scanChartStructure(false);
  }

  function scanChartStructure(showFeedback) {
    const pair = appState.chartPair || appState.activePair || 'XAUUSD';
    const livePx = getLivePairPrice(pair);
    if (!global.LiamMethods) return;

    const dr = global.LiamMethods.analyzeDealingRange(pair, livePx, appState.activeTimeframe, appState.scanSeed);
    const fmt = (v) => global.LiamMethods.formatPrice(pair, v);

    document.getElementById('chart-swing-high').textContent = fmt(dr.swingHigh);
    document.getElementById('chart-swing-low').textContent = fmt(dr.swingLow);
    document.getElementById('chart-active-range').textContent = fmt(dr.totalRange);

    const isDiscount = dr.pdPercent < 50;
    const verdictBox = document.getElementById('chart-scan-verdict-box');
    if (verdictBox) {
      verdictBox.innerHTML = `
        <div class="space-y-1">
          <div class="font-extrabold ${isDiscount ? 'text-emerald-400' : 'text-rose-400'}">
            📊 Hasil Scan ${pair} (${appState.activeTimeframe}): ${isDiscount ? 'DISCOUNT ZONE — PRIORITAS CARI BUY' : 'PREMIUM ZONE — PRIORITAS CARI SELL'}
          </div>
          <p class="text-slate-300">
            Harga saat ini (<strong>${fmt(livePx)}</strong>) berada di posisi <strong>${dr.pdPercent}% Dealing Range</strong> (Equilibrium: ${fmt(dr.equilibrium)}).
            ${
              isDiscount
                ? `Tunggu sapuan likuiditas bawah ${fmt(dr.swingLow)} lalu cari entry Bullish OB/FVG menuju ${fmt(dr.swingHigh)}.`
                : `Tunggu sapuan likuiditas atas ${fmt(dr.swingHigh)} lalu cari entry Bearish OB/FVG menuju ${fmt(dr.swingLow)}.`
            }
          </p>
        </div>
      `;
    }

    if (showFeedback) {
      showToast(`✅ Struktur grafik ${pair} selesai dipindai!`, 'success');
    }
  }

  // ===========================================================================
  // PROFIL: SUPER ADMIN CONSOLE, SUPABASE 2-WAY SYNC, BACKUP & PUSH ALERT
  // ===========================================================================

  function loadSettingsInputsFromState() {
    document.getElementById('owner-broadcast-input').value = appState.broadcastMessage || '';
    document.getElementById('cfg-td-apikey').value = appState.tdApiKey || '';
    document.getElementById('cfg-sb-url').value = appState.sbUrl || '';
    document.getElementById('cfg-sb-key').value = appState.sbKey || '';
    document.getElementById('cfg-tg-token').value = appState.tgToken || '';
    document.getElementById('cfg-tg-chatid').value = appState.tgChatId || '';
    document.getElementById('cfg-tg-auto-signal').checked = Boolean(appState.tgAutoSignal);
    document.getElementById('cfg-tg-auto-news').checked = Boolean(appState.tgAutoNews);
    document.getElementById('cfg-tg-auto-result').checked = Boolean(appState.tgAutoResult);

    const engBtn = document.getElementById('btn-engine-master-toggle');
    if (engBtn) {
      engBtn.textContent = appState.engineActive
        ? '🟢 Mesin Sinyal: AKTIF (Ketuk untuk Jeda)'
        : '⏸️ Mesin Sinyal: DIJEDA (Ketuk untuk Aktifkan)';
      engBtn.className = appState.engineActive
        ? 'w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold active:scale-95 transition'
        : 'w-full py-2.5 rounded-xl bg-amber-600 text-white text-xs font-extrabold active:scale-95 transition';
    }

    renderBroadcastBanner();
    updatePushPermissionLabel();
  }

  function saveApiAndCloudSettings(silent) {
    appState.tdApiKey = document.getElementById('cfg-td-apikey').value.trim();
    appState.sbUrl = document.getElementById('cfg-sb-url').value.trim().replace(/\/+$/, '');
    appState.sbKey = document.getElementById('cfg-sb-key').value.trim();
    appState.tgToken = document.getElementById('cfg-tg-token').value.trim();
    appState.tgChatId = document.getElementById('cfg-tg-chatid').value.trim();
    appState.tgAutoSignal = Boolean(document.getElementById('cfg-tg-auto-signal').checked);
    appState.tgAutoNews = Boolean(document.getElementById('cfg-tg-auto-news').checked);
    appState.tgAutoResult = Boolean(document.getElementById('cfg-tg-auto-result').checked);
    persistState();

    if (!silent) {
      showToast('✅ Pengaturan API, Cloud & Bot Telegram disimpan!', 'success');
      refreshAllLivePrices(true);
    }
  }

  function saveOwnerBroadcast() {
    appState.broadcastMessage = document.getElementById('owner-broadcast-input').value.trim();
    appState.broadcastDismissed = false;
    persistState();
    renderBroadcastBanner();
    showToast(appState.broadcastMessage ? '📢 Global Broadcast diperbarui!' : 'Broadcast dihapus.', 'success');
  }

  function dismissBroadcastBanner() {
    appState.broadcastDismissed = true;
    persistState();
    renderBroadcastBanner();
  }

  function renderBroadcastBanner() {
    const bar = document.getElementById('global-broadcast-bar');
    const txt = document.getElementById('global-broadcast-text');
    if (!bar || !txt) return;
    if (appState.broadcastMessage && !appState.broadcastDismissed) {
      txt.textContent = `📢 ${appState.broadcastMessage}`;
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }

  function toggleSignalEngineMaster() {
    appState.engineActive = !appState.engineActive;
    persistState();
    loadSettingsInputsFromState();
    showToast(appState.engineActive ? '🟢 Mesin Sinyal diaktifkan!' : '⏸️ Mesin Sinyal dijeda.', 'success');
  }

  async function pushDataToSupabase() {
    saveApiAndCloudSettings(true);
    if (!appState.sbUrl || !appState.sbKey) {
      showToast('Isi Supabase URL & Publishable Key terlebih dahulu.', 'warn');
      return;
    }
    try {
      const payload = {
        id: 'xliamvr_owner_terminal',
        updated_at: new Date().toISOString(),
        state_json: appState
      };
      const res = await fetch(`${appState.sbUrl}/rest/v1/terminal_state?on_conflict=id`, {
        method: 'POST',
        headers: {
          apikey: appState.sbKey,
          Authorization: `Bearer ${appState.sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        showToast(`Cloud Push gagal (${res.status}): Pastikan tabel terminal_state ada di Supabase.`, 'error');
        console.warn('Supabase push response:', errText);
        return;
      }
      showToast('☁️ Seluruh data berhasil di-Sync (Push) ke Supabase!', 'success');
    } catch (_e) {
      showToast('Gagal terhubung ke Supabase Cloud.', 'error');
    }
  }

  async function pullDataFromSupabase() {
    saveApiAndCloudSettings(true);
    if (!appState.sbUrl || !appState.sbKey) {
      showToast('Isi Supabase URL & Publishable Key terlebih dahulu.', 'warn');
      return;
    }
    try {
      const res = await fetch(`${appState.sbUrl}/rest/v1/terminal_state?id=eq.xliamvr_owner_terminal&select=state_json`, {
        headers: {
          apikey: appState.sbKey,
          Authorization: `Bearer ${appState.sbKey}`
        }
      });
      if (!res.ok) {
        showToast(`Cloud Pull gagal (${res.status}).`, 'error');
        return;
      }
      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length || !rows[0].state_json) {
        showToast('Belum ada data backup tersimpan di Cloud Supabase.', 'warn');
        return;
      }
      appState = { ...appState, ...rows[0].state_json };
      global.appState = appState;
      persistState();
      initFullUiFromState();
      showToast('📥 Data akun & jurnal berhasil dimuat dari Cloud!', 'success');
    } catch (_e) {
      showToast('Gagal menarik data dari Supabase Cloud.', 'error');
    }
  }

  function exportBackupJson() {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Liamvtrade_Backup_${getTradingDayKeyWib()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 File Backup (.JSON) diunduh!', 'success');
  }

  function importBackupJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(String(e.target.result));
        appState = { ...appState, ...parsed };
        global.appState = appState;
        persistState();
        initFullUiFromState();
        showToast('📂 Backup (.JSON) berhasil direstore!', 'success');
      } catch (_err) {
        showToast('File JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function toggleMemberCodeDrawer() {
    const d = document.getElementById('member-code-drawer');
    if (d) d.classList.toggle('hidden');
  }

  function generateCommercialMemberCode() {
    const label = (document.getElementById('member-label-input').value.trim() || 'VIP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `LVT-${label}-${rand}-2026`;
    const box = document.getElementById('generated-member-code-box');
    if (box) {
      box.innerHTML = `Kode Aktif: <strong>${code}</strong> <button type="button" onclick="copyTextValue('${code}', 'Kode VIP')" class="underline ml-2 text-sky-400">Copy</button>`;
    }
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
      showToast('Browser ini tidak mendukung Web Notification.', 'warn');
      return;
    }
    const perm = await Notification.requestPermission();
    updatePushPermissionLabel();
    if (perm === 'granted') {
      triggerBrowserNotification('Liamvtrade Quant Terminal', 'Notifikasi layar HP aktif untuk Sinyal & News Sniper!');
    }
  }

  function triggerBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (_e) {}
    }
  }

  function sendTestPushNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      requestNativePushPermission();
      return;
    }
    triggerBrowserNotification('⚡ TES ALERT LIAMVTRADE', 'Sinyal ICT/SMC & News Sniper siap masuk ke layar HP kamu!');
    showToast('🔔 Tes notifikasi HP dikirim!', 'success');
  }

  // ===========================================================================
  // NAVIGATION, THEME & MODALS
  // ===========================================================================

  function switchMainTab(tabName) {
    appState.activeTab = tabName;
    persistState();

    document.querySelectorAll('.tab-pane').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `tab-${tabName}`);
    });

    document.querySelectorAll('.nav-item-btn').forEach((btn) => {
      const isTarget = btn.getAttribute('data-nav') === tabName;
      btn.className = isTarget
        ? 'nav-item-btn flex flex-col items-center gap-1 py-1 text-sky-400'
        : 'nav-item-btn flex flex-col items-center gap-1 py-1 text-slate-400';
    });

    if (tabName === 'chart') {
      const chartSel = document.getElementById('chart-pair-select');
      if (chartSel) chartSel.value = appState.chartPair || appState.activePair;
      renderTradingViewRadar(appState.chartPair || appState.activePair);
      scanChartStructure(false);
    } else if (tabName === 'news' && global.LiamNews) {
      global.LiamNews.renderNewsTab();
    }
  }

  function toggleThemeMode() {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    persistState();
    applyThemeClass();
    if (appState.activeTab === 'chart') {
      renderTradingViewRadar(appState.chartPair || appState.activePair);
    }
  }

  function applyThemeClass() {
    document.documentElement.classList.toggle('dark', appState.theme !== 'light');
  }

  function openGuideModal() {
    document.getElementById('modal-guide').classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  // ===========================================================================
  // INITIALIZATION & LIVE LOOPS
  // ===========================================================================

  function initFullUiFromState() {
    applyThemeClass();
    checkAutoDailyReset();
    loadSettingsInputsFromState();
    syncFilterButtonsUi();

    // Sync pair, timeframe, and method selector UI
    selectSignalPair(appState.activePair || 'XAUUSD');
    selectSignalTimeframe(appState.activeTimeframe || 'M15');
    const methodSel = document.getElementById('signal-method-select');
    if (methodSel) methodSel.value = appState.activeMethod || 'auto';

    renderSopList();
    renderBerandaAccounts();
    renderPerformanceAndLogs();
    updateWibClockAndSession();

    if (global.LiamNews) {
      global.LiamNews.syncNewsEngine(false);
    }

    switchMainTab(appState.activeTab || 'beranda');
  }

  // Expose functions to global scope for inline HTML handlers & news.js
  global.getLivePairPrice = getLivePairPrice;
  global.showToast = showToast;
  global.escapeHtml = escapeHtml;
  global.copyTextValue = copyTextValue;
  global.sendTelegramHtmlMessage = sendTelegramHtmlMessage;
  global.triggerBrowserNotification = triggerBrowserNotification;

  global.openCalibrationModal = openCalibrationModal;
  global.applyBrokerPriceCalibration = applyBrokerPriceCalibration;
  global.resetBrokerPriceCalibration = resetBrokerPriceCalibration;
  global.openGuideModal = openGuideModal;
  global.toggleThemeMode = toggleThemeMode;
  global.closeModal = closeModal;
  global.dismissBroadcastBanner = dismissBroadcastBanner;

  global.toggleWeekendBtcMode = toggleWeekendBtcMode;
  global.switchActiveAccount = switchActiveAccount;
  global.clearCooldownManual = clearCooldownManual;
  global.adjustAccountLimit = adjustAccountLimit;
  global.adjustAccountCounter = adjustAccountCounter;
  global.resetAllAccountsDailyTrackers = resetAllAccountsDailyTrackers;

  global.toggleSopItem = toggleSopItem;
  global.addCustomSopItem = addCustomSopItem;
  global.removeCustomSopItem = removeCustomSopItem;
  global.resetSopChecklist = resetSopChecklist;

  global.toggleAddAccountDrawer = toggleAddAccountDrawer;
  global.saveNewPropAccount = saveNewPropAccount;
  global.openEditAccountModal = openEditAccountModal;
  global.saveEditedAccount = saveEditedAccount;
  global.deleteEditedAccount = deleteEditedAccount;

  global.selectSignalPair = selectSignalPair;
  global.selectSignalTimeframe = selectSignalTimeframe;
  global.selectSignalMethod = selectSignalMethod;
  global.forceRescanSignal = forceRescanSignal;
  global.toggleSignalFilterDrawer = toggleSignalFilterDrawer;
  global.saveTerminalGuardPrefs = saveTerminalGuardPrefs;
  global.toggleSignalAlertMode = toggleSignalAlertMode;
  global.toggleTerminalFlag = toggleTerminalFlag;
  global.toggleNewsSniperMode = toggleNewsSniperMode;
  global.togglePoiEducationDrawer = togglePoiEducationDrawer;
  global.copySignalField = copySignalField;
  global.copyFullSignalSetup = copyFullSignalSetup;
  global.toggleStandardFormatBox = toggleStandardFormatBox;

  global.takeSetupAndSendTelegram = takeSetupAndSendTelegram;
  global.sendCurrentSignalToTelegramOnly = sendCurrentSignalToTelegramOnly;
  global.testTelegramVipBot = testTelegramVipBot;

  global.setRecapPeriod = setRecapPeriod;
  global.switchLogSubTab = switchLogSubTab;
  global.setLogStatusFilter = setLogStatusFilter;
  global.setLogPairFilter = setLogPairFilter;
  global.markTradeOutcome = markTradeOutcome;
  global.resetTradeLogs = resetTradeLogs;
  global.copyPerformanceRecap = copyPerformanceRecap;
  global.exportJournalCsv = exportJournalCsv;

  global.changeChartPair = changeChartPair;
  global.scanChartStructure = scanChartStructure;

  global.saveOwnerBroadcast = saveOwnerBroadcast;
  global.toggleSignalEngineMaster = toggleSignalEngineMaster;
  global.pushDataToSupabase = pushDataToSupabase;
  global.pullDataFromSupabase = pullDataFromSupabase;
  global.exportBackupJson = exportBackupJson;
  global.importBackupJson = importBackupJson;
  global.toggleMemberCodeDrawer = toggleMemberCodeDrawer;
  global.generateCommercialMemberCode = generateCommercialMemberCode;
  global.requestNativePushPermission = requestNativePushPermission;
  global.sendTestPushNotification = sendTestPushNotification;
  global.saveApiAndCloudSettings = saveApiAndCloudSettings;
  global.switchMainTab = switchMainTab;

  document.addEventListener('DOMContentLoaded', () => {
    initFullUiFromState();
    refreshAllLivePrices(true);

    // Update detik jam WIB, cooldown & countdown sinyal tiap 1 detik
    setInterval(updateWibClockAndSession, 1000);

    // Refresh harga live tiap 12 detik tanpa merusak state UI
    setInterval(() => {
      if (appState.engineActive) {
        refreshAllLivePrices(false);
      }
    }, 12000);
  });
})(window);
