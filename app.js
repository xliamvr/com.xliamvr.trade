/*!
 * Liamvtrade — Core Application Engine, Multi-Account & Live Market Feed (v2.3)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// ==================== 1. DEFAULT ACCOUNTS & STATE ====================
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

const DEFAULT_STATE = {
  theme: 'light',
  activeTab: 'home',
  selectedPair: 'XAUUSD',
  selectedTF: 'M15',
  weekendBtcMode: true,
  activeAccountId: 'acc-1',
  accounts: DEFAULT_ACCOUNTS,
  checklist: [
    { id: 'c1', text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', done: true },
    { id: 'c2', text: 'Cek jadwal High Impact News USD (CPI/NFP/FOMC)', done: false },
    { id: 'c3', text: 'Wajib tunggu Liquidity Sweep + CHoCH M5/M1', done: false }
  ],
  twelveDataKey: '',
  tgToken: '',
  tgChatId: ''
};

// Migrasi otomatis pengaturan lama agar API Key & Token tetap tersimpan
const prevV22 = JSON.parse(localStorage.getItem('liamvtrade_v22_state') || 'null');
const prevV21 = JSON.parse(localStorage.getItem('liamvtrade_v21_state') || '{}');
const savedState = JSON.parse(localStorage.getItem('liamvtrade_v23_state') || 'null');

let state = {
  ...DEFAULT_STATE,
  ...(savedState || prevV22 || prevV21)
};

if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
  state.accounts = [...DEFAULT_ACCOUNTS];
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

function saveState() {
  localStorage.setItem('liamvtrade_v23_state', JSON.stringify(state));
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
  // Jalur 1: CryptoCompare Public API (Analytics domain — terbuka penuh di 4G Indonesia + CORS *)
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

  // Jalur 2: CoinGecko Public API (Cadangan — juga terbuka penuh di jaringan 4G Indonesia)
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
  // 1. BTCUSDT Live 24/7 (CryptoCompare / CoinGecko)
  const btcOk = await fetchLiveBtcUnblocked();

  // 2. Twelve Data API (Aman dari rate-limit 8 kredit/menit)
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

// ==================== 5. REAL-TIME WIB & WEEKEND BTC SESSION ====================
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

// ==================== 7. MULTI-PAIR & MULTI-METHOD SIGNALS ====================
function populateMethodDropdown() {
  const select = document.getElementById('method-select');
  if (!select || typeof LIAMV_METHODS === 'undefined') return;
  select.innerHTML = LIAMV_METHODS.map(
    (m) => `<option value="${m.id}">${m.name}</option>`
  ).join('');
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

function renderSignals() {
  const container = document.getElementById('signals-container');
  const outputBox = document.getElementById('smc-standard-output');
  if (!container) return;

  if (typeof generateSignalsForPair !== 'function') {
    container.innerHTML = `
      <div class="glass-card p-6 text-center">
        <p class="font-display font-bold text-sm">Memperbarui Engine Sinyal...</p>
        <p class="text-xs opacity-65 mt-1">Tarik layar ke bawah untuk memuat ulang cache.</p>
      </div>
    `;
    return;
  }

  const pairId = state.selectedPair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const activeAcc = getActiveAccount();

  const allPairSignals = generateSignalsForPair(pairId, livePrices, marketRanges);
  const methodFilter = document.getElementById('method-select')?.value || 'ALL';
  const filtered = allPairSignals.filter((s) => {
    const tfMatch = s.tf === state.selectedTF;
    const methodMatch = methodFilter === 'ALL' || s.method === methodFilter;
    return tfMatch && methodMatch;
  });

  const headingEl = document.getElementById('signal-list-heading');
  const countEl = document.getElementById('signal-active-count');
  if (headingEl) headingEl.textContent = `${pairId} • ${state.selectedTF} Signals`;
  if (countEl) countEl.textContent = `${filtered.length} aktif`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card p-6 text-center">
        <p class="font-display font-bold text-sm">Tidak ada metode terpilih di ${pairId} (${state.selectedTF})</p>
        <p class="text-xs opacity-65 mt-1">Ubah filter metode ke "Semua Metode" untuk melihat seluruh setup aktif.</p>
      </div>
    `;
    if (outputBox) outputBox.textContent = 'NO SETUP — PILIH "SEMUA METODE" UNTUK MELIHAT SETUP AKTIF';
    return;
  }

  container.innerHTML = filtered
    .map((sig) => {
      const isBuy = sig.direction.includes('BUY');
      const meta = getConfidenceMeta(sig.confidence);
      const radius = 22;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (sig.confidence / 100) * circumference;
      const lotSize = calculateLotForPair(pairId, sig.slUnits, activeAcc.balance, activeAcc.riskPct);

      return `
        <div class="glass-card p-5 space-y-3.5 card-3d">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display text-lg font-extrabold">${sig.pair}</span>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap ${isBuy ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}">${sig.direction}</span>
              </div>
              <p class="text-[11px] font-semibold opacity-70 mt-0.5">${sig.methodLabel}</p>
              <span class="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider whitespace-nowrap ${meta.badgeClass}">${meta.tier}</span>
            </div>

            <div class="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg class="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="${radius}" stroke="currentColor" stroke-opacity="0.12" stroke-width="5" fill="none"/>
                <circle cx="28" cy="28" r="${radius}" stroke="${meta.strokeColor}" stroke-width="5" stroke-linecap="round" fill="none"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
              </svg>
              <div class="absolute text-center">
                <span class="font-mono-num text-xs font-extrabold block leading-none">${sig.confidence}%</span>
                <span class="text-[8px] font-bold uppercase opacity-60">PD</span>
              </div>
            </div>
          </div>

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

          <div class="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div class="flex items-center gap-1.5 text-blue-500 font-bold text-[11px]">
              <span>⭐ Rekomendasi TP Terbaik:</span>
              <span>${sig.bestTp}</span>
            </div>
            <p class="text-[11px] opacity-80 mt-1 leading-relaxed">${sig.bestTpReason}</p>
          </div>

          <p class="text-[11px] opacity-75 leading-relaxed">
            <strong class="opacity-100">Struktur:</strong> ${sig.structure}
          </p>

          <div class="flex gap-2 pt-1">
            <button onclick="triggerSignalAlert('${sig.id}')" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow active:scale-95">
              Kirim Notif Sinyal
            </button>
            <button onclick="adjustCounter('entries', 1); showToast('✅ Entry dicatat di ${activeAcc.name}');" class="px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold active:scale-95 whitespace-nowrap">
              Ambil Setup
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  if (outputBox) {
    const top = filtered[0];
    const topLot = calculateLotForPair(pairId, top.slUnits, activeAcc.balance, activeAcc.riskPct);
    outputBox.textContent = formatStandardSmcSignal(top, topLot, activeAcc.name);
  }
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

// ==================== 10. NATIVE HP NOTIFICATION + OPTIONAL TELEGRAM ====================
function updateNativeNotifStatusUI() {
  const statusEl = document.getElementById('native-notif-status');
  const btnEl = document.getElementById('btn-enable-notif');
  if (!statusEl || !btnEl) return;

  if (!('Notification' in window)) {
    statusEl.textContent = 'Browser tidak mendukung Notifikasi Native';
    return;
  }

  if (Notification.permission === 'granted') {
    statusEl.textContent = '✅ Aktif — Siap kirim banner & getar ke HP';
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
    'Notifikasi Native aktif! Sinyal SMC Multi-Pair & alert sesi siap berjalan.'
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

async function triggerSignalAlert(sigId) {
  const pairId = state.selectedPair || 'XAUUSD';
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const sig = generateSignalsForPair(pairId, livePrices, marketRanges).find((s) => s.id === sigId);
  if (!sig) return;

  const activeAcc = getActiveAccount();
  const lotSize = calculateLotForPair(pairId, sig.slUnits, activeAcc.balance, activeAcc.riskPct);
  const title = `${sig.pair} ${sig.direction} (${sig.tf}) • ${sig.confidence}% PD`;
  const shortBody = `Entry: ${sig.entryMin.toFixed(d)}-${sig.entryMax.toFixed(d)} | SL: ${sig.sl.toFixed(d)} | ${activeAcc.name} (${lotSize.toFixed(2)} lot)`;

  const sentNative = await sendNativePush(title, shortBody);
  const fullText = formatStandardSmcSignal(sig, lotSize, activeAcc.name);
  const sentTg = await dispatchTelegramOptional(fullText);

  if (sentNative && sentTg) {
    showToast('🚀 Notif HP & arsip Telegram terkirim!');
  } else if (sentNative) {
    showToast('🔔 Notifikasi sinyal muncul di layar HP!');
  } else if (sentTg) {
    showToast('🚀 Sinyal terkirim ke Telegram!');
  } else {
    showToast('🔔 Aktifkan izin Notifikasi HP di tab Profil!');
  }
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
  syncLiveMarketPrices(true);
  setInterval(() => syncLiveMarketPrices(false), 15000);
  switchTab(state.activeTab);
});
