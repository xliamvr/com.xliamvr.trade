/*!
 * Liamvtrade — Core Application Engine, Live News & Native Alert System (v2.0)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// ==================== 1. STATE & LOCAL STORAGE ====================
const DEFAULT_STATE = {
  theme: 'light',
  activeTab: 'home',
  selectedTF: 'M15',
  accountSize: 5000,
  riskPct: 0.4,
  entriesToday: 0,
  slsToday: 0,
  checklist: [
    { id: 'c1', text: 'Asia High & Asia Low (07.00–14.00 WIB) terpetakan', done: true },
    { id: 'c2', text: 'Cek jadwal High Impact News USD (CPI/NFP/FOMC)', done: false },
    { id: 'c3', text: 'Wajib tunggu Liquidity Sweep + CHoCH M5/M1', done: false }
  ],
  twelveDataKey: '',
  tgToken: '',
  tgChatId: '',
  xauPrice: 2736.40
};

let state = {
  ...DEFAULT_STATE,
  ...JSON.parse(localStorage.getItem('liamvtrade_v2_state') || '{}')
};

let activeNewsList = typeof LIAMV_NEWS !== 'undefined' ? [...LIAMV_NEWS] : [];
let currentNewsFilter = 'ALL';

function saveState() {
  localStorage.setItem('liamvtrade_v2_state', JSON.stringify(state));
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

// ==================== 3. THEME & NAVIGATION ====================
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

  if (tabName === 'chart') renderTradingViewChart();
}

// ==================== 4. REAL-TIME WIB & SESSION GUARDRAIL ====================
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
    0: 'Minggu — Market Tutup (Persiapan Mapping Mingguan)',
    1: 'Senin — Pembentukan Range Awal, Rawan False Breakout',
    2: 'Selasa — Pembentukan Weekly High/Low & Ekspansi Awal',
    3: 'Rabu — Sesi Paling Teknis, Struktur SMC Sangat Rapi',
    4: 'Kamis — Rawan Reversal & Sweep News Klaim Pengangguran',
    5: 'Jumat — Volatilitas Tinggi Awal NY & Profit Taking Akhir Pekan',
    6: 'Sabtu — Market Tutup (Evaluasi Jurnal Minggu Ini)'
  };
  const dayEl = document.getElementById('day-behavior-text');
  if (dayEl) dayEl.textContent = dayNotes[dayIdx];

  let title = 'Dini Hari (Dilarang Entry)';
  let desc = 'Volatilitas mati & spread mekar. Fokus istirahat.';
  let badge = 'LOCKED';

  if (dayIdx === 0 || dayIdx === 6) {
    title = 'Weekend Market Tutup';
    desc = 'Gunakan waktu ini untuk backtest metode & evaluasi jurnal.';
    badge = 'CLOSED';
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

// ==================== 5. DISCIPLINE & PROP FIRM CALCULATOR ====================
function renderHomeDashboard() {
  const entryEl = document.getElementById('daily-entry-count');
  const slEl = document.getElementById('daily-sl-count');
  if (entryEl) entryEl.textContent = `${state.entriesToday} / 2`;
  if (slEl) slEl.textContent = `${state.slsToday} / 2`;

  const cbAlert = document.getElementById('circuit-breaker-alert');
  if (cbAlert) {
    cbAlert.classList.toggle('hidden', state.slsToday < 2);
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

  const riskUsd = (state.accountSize * (state.riskPct / 100)).toFixed(1);
  const calcLot = calculateLotForSL(32);
  const accEl = document.getElementById('home-account-size');
  const rskEl = document.getElementById('home-risk-pct');
  const lotEl = document.getElementById('home-ideal-lot');
  if (accEl) accEl.textContent = `$${Number(state.accountSize).toLocaleString()}`;
  if (rskEl) rskEl.textContent = `${state.riskPct}% ($${riskUsd})`;
  if (lotEl) lotEl.textContent = `${calcLot.toFixed(2)} lot`;
}

function toggleChecklist(idx) {
  state.checklist[idx].done = !state.checklist[idx].done;
  saveState();
  renderHomeDashboard();
}

function adjustCounter(type, delta) {
  if (type === 'entries') {
    state.entriesToday = Math.max(0, Math.min(2, state.entriesToday + delta));
  } else {
    state.slsToday = Math.max(0, Math.min(2, state.slsToday + delta));
    if (state.slsToday >= 2) showToast('🛑 2 SL Tercapai — Stop Trading Hari Ini!');
  }
  saveState();
  renderHomeDashboard();
}

function calculateLotForSL(slPips) {
  const riskUsd = state.accountSize * (state.riskPct / 100);
  const rawLot = riskUsd / (slPips * 0.1);
  return Math.min(0.05, Math.max(0.02, +rawLot.toFixed(2)));
}

// ==================== 6. MULTI-METHOD SIGNALS ENGINE ====================
function populateMethodDropdown() {
  const select = document.getElementById('method-select');
  if (!select || typeof LIAMV_METHODS === 'undefined') return;
  select.innerHTML = LIAMV_METHODS.map(
    (m) => `<option value="${m.id}">${m.name}</option>`
  ).join('');
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
  if (typeof LIAMV_SIGNALS === 'undefined') return;
  const methodFilter = document.getElementById('method-select')?.value || 'ALL';
  const filtered = LIAMV_SIGNALS.filter((s) => {
    const tfMatch = s.tf === state.selectedTF;
    const methodMatch = methodFilter === 'ALL' || s.method === methodFilter;
    return tfMatch && methodMatch;
  });

  const headingEl = document.getElementById('signal-list-heading');
  const countEl = document.getElementById('signal-active-count');
  if (headingEl) headingEl.textContent = `${state.selectedTF} Signals`;
  if (countEl) countEl.textContent = `${filtered.length} aktif`;

  const container = document.getElementById('signals-container');
  const outputBox = document.getElementById('smc-standard-output');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card p-6 text-center">
        <p class="font-display font-bold text-sm">NO SETUP DI TIMEFRAME ${state.selectedTF}</p>
        <p class="text-xs opacity-65 mt-1">Tunggu konfirmasi Liquidity Sweep & CHoCH sesuai aturan SMC.</p>
      </div>
    `;
    if (outputBox) outputBox.textContent = 'NO SETUP — TUNGGU KONFIRMASI LIQUIDITY SWEEP & CHoCH';
    return;
  }

  container.innerHTML = filtered
    .map((sig) => {
      const isBuy = sig.direction.includes('BUY');
      const meta = getConfidenceMeta(sig.confidence);
      const radius = 22;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (sig.confidence / 100) * circumference;
      const lotSize = calculateLotForSL(sig.slPips);

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
              <span class="font-mono-num text-[11px] font-extrabold text-amber-500">${sig.entryMin.toFixed(2)} - ${sig.entryMax.toFixed(2)}</span>
            </div>
            <div>
              <span class="text-[9px] font-bold uppercase opacity-60 block">Stop Loss</span>
              <span class="font-mono-num text-[11px] font-extrabold text-rose-500">${sig.sl.toFixed(2)} (${sig.slPips}p)</span>
            </div>
            <div>
              <span class="text-[9px] font-bold uppercase opacity-60 block">Lot Prop Firm</span>
              <span class="font-mono-num text-[11px] font-extrabold text-blue-500 whitespace-nowrap">${lotSize.toFixed(2)} lot</span>
            </div>
          </div>

          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 1 (1:1.5 • Set BE)</span>
              <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp1.toFixed(2)} (+${sig.tp1Pips}p)</span>
            </div>
            <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 2 (1:2 • Intraday)</span>
              <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp2.toFixed(2)} (+${sig.tp2Pips}p)</span>
            </div>
            <div class="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-500/10">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">TP 3 (1:3 • Extreme)</span>
              <span class="font-mono-num font-bold whitespace-nowrap">${sig.tp3.toFixed(2)} (+${sig.tp3Pips}p)</span>
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
            <button onclick="adjustCounter('entries', 1); showToast('✅ Entry dicatat ke tracker harian');" class="px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold active:scale-95 whitespace-nowrap">
              Ambil Setup
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  if (outputBox) {
    const top = filtered[0];
    outputBox.textContent = formatStandardSmcSignal(top, calculateLotForSL(top.slPips));
  }
}

function copyStandardOutput() {
  const txt = document.getElementById('smc-standard-output')?.textContent || '';
  navigator.clipboard.writeText(txt);
  showToast('📋 Format sinyal standar disalin!');
}

// ==================== 7. LIVE AUTO-UPDATE ECONOMIC NEWS ====================
function generateNewsExplanation(title) {
  const t = title.toLowerCase();
  if (t.includes('cpi') || t.includes('inflation') || t.includes('pce')) {
    return {
      category: 'Inflasi AS',
      smcWarning: 'Wajib tutup/amankan posisi & batalkan Pending Order 15 menit sebelum rilis.',
      explanation:
        'Mengukur tekanan inflasi AS. Jika Actual lebih tinggi dari Forecast, ekspektasi suku bunga ketat akan menguatkan USD dan menekan XAUUSD turun tajam.'
    };
  }
  if (t.includes('non-farm') || t.includes('nfp') || t.includes('payroll') || t.includes('unemployment')) {
    return {
      category: 'Tenaga Kerja AS',
      smcWarning: 'Spread XAUUSD melebar ekstrem saat rilis. Tunggu 15–30 menit hingga struktur M5 stabil.',
      explanation:
        'Indikator utama kesehatan pasar tenaga kerja AS. Penambahan kerja yang lebih tinggi dari prediksi (Actual > Forecast) mendorong penguatan USD dan menekan harga Emas.'
    };
  }
  if (t.includes('jobless') || t.includes('claims')) {
    return {
      category: 'Klaim Pengangguran',
      smcWarning: 'Rutin rilis Kamis malam — rawan sweep Asia High/Low sebelum arah asli terbentuk.',
      explanation:
        'Jika jumlah klaim pengangguran lebih rendah dari prediksi (Actual < Forecast), pasar kerja AS dinilai solid → cenderung Bearish jangka pendek bagi XAUUSD.'
    };
  }
  if (t.includes('fomc') || t.includes('fed') || t.includes('powell') || t.includes('rate')) {
    return {
      category: 'Kebijakan The Fed',
      smcWarning: 'Volatilitas sangat tinggi & rawan slippage. Hindari posisi terbuka saat rilis.',
      explanation:
        'Keputusan suku bunga dan pernyataan bank sentral AS. Nada dovish atau pemangkasan suku bunga melemahkan USD dan menjadi katalis Bullish kuat untuk Emas.'
    };
  }
  if (t.includes('pmi') || t.includes('retail') || t.includes('gdp')) {
    return {
      category: 'Pertumbuhan Ekonomi AS',
      smcWarning: 'Dapat memicu ekspansi lanjutan di sesi New York.',
      explanation:
        'Mengukur daya beli dan ekspansi sektor bisnis AS. Angka di atas perkiraan (Actual > Forecast) positif untuk USD dan menahan reli XAUUSD.'
    };
  }
  return {
    category: 'Rilis Ekonomi USD',
    smcWarning: 'Pantau pergerakan ekor candle M5 saat jam rilis berita.',
    explanation:
      'Data fundamental USD berdampak pada pergerakan Dolar AS. Hasil lebih kuat dari prediksi umumnya menekan XAUUSD, sedangkan hasil lebih lemah mendukung kenaikan Emas.'
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
    if (statusEl) statusEl.textContent = '● Mode Kamus Dampak XAUUSD';
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
          <strong class="text-blue-500 block mb-0.5">Dampak ke XAUUSD (${n.category}):</strong>
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

// ==================== 8. TRADINGVIEW & LIVE CANDLE RADAR ====================
function renderTradingViewChart() {
  const wrapper = document.getElementById('tv-chart-wrapper');
  const select = document.getElementById('chart-symbol-select');
  if (!wrapper || !select) return;

  const val = select.value.split('|')[0];
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
  const select = document.getElementById('chart-symbol-select');
  const modeLabel = document.getElementById('scanner-engine-mode');
  if (!select || !modeLabel) return;

  const [, apiSym] = select.value.split('|');

  try {
    if (apiSym === 'BTCUSDT') {
      const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=30');
      const data = await res.json();
      const highs = data.map((c) => parseFloat(c[2]));
      const lows = data.map((c) => parseFloat(c[3]));
      const hi = Math.max(...highs).toFixed(2);
      const lo = Math.min(...lows).toFixed(2);
      document.getElementById('radar-asia-high').textContent = hi;
      document.getElementById('radar-asia-low').textContent = lo;
      document.getElementById('radar-day-range').textContent = `$${(hi - lo).toFixed(2)}`;
      modeLabel.textContent = 'Live Binance Public API Terhubung (Gratis)';
      showToast('📡 Scan live candle BTCUSDT selesai!');
      return;
    }

    if (state.twelveDataKey) {
      const res = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${apiSym}&interval=15min&outputsize=30&apikey=${state.twelveDataKey}`
      );
      const data = await res.json();
      if (data.values) {
        const highs = data.values.map((c) => parseFloat(c.high));
        const lows = data.values.map((c) => parseFloat(c.low));
        const hi = Math.max(...highs).toFixed(2);
        const lo = Math.min(...lows).toFixed(2);
        document.getElementById('radar-asia-high').textContent = hi;
        document.getElementById('radar-asia-low').textContent = lo;
        document.getElementById('radar-day-range').textContent = `$${(hi - lo).toFixed(2)}`;
        modeLabel.textContent = `Live Twelve Data API (${apiSym}) Terhubung`;
        showToast(`📡 Scan live ${apiSym} berhasil!`);
        return;
      }
    }
  } catch (e) {}

  modeLabel.textContent = 'Mode Simulasi Aktif (Isi API Key di Profil untuk Live)';
  showToast('📡 Radar memindai struktur Asia High/Low...');
}

// ==================== 9. NATIVE HP NOTIFICATION + OPTIONAL TELEGRAM ====================
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
    'Notifikasi Native aktif! Sinyal SMC & alert sesi akan muncul langsung di HP kamu.'
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
  if (typeof LIAMV_SIGNALS === 'undefined') return;
  const sig = LIAMV_SIGNALS.find((s) => s.id === sigId);
  if (!sig) return;

  const meta = getConfidenceMeta(sig.confidence);
  const lotSize = calculateLotForSL(sig.slPips);
  const title = `${sig.pair} ${sig.direction} (${sig.tf}) • ${sig.confidence}% PD`;
  const shortBody = `Entry: ${sig.entryMin.toFixed(2)}-${sig.entryMax.toFixed(2)} | SL: ${sig.sl.toFixed(2)} | Best: ${sig.bestTp} (${lotSize.toFixed(2)} lot)`;

  const sentNative = await sendNativePush(title, shortBody);
  const fullText = formatStandardSmcSignal(sig, lotSize);
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

// ==================== 10. SETTINGS & INITIALIZATION ====================
function loadSettingsUI() {
  const acc = document.getElementById('cfg-account-size');
  const rsk = document.getElementById('cfg-risk-pct');
  const td = document.getElementById('cfg-twelvedata-key');
  const tgT = document.getElementById('cfg-tg-token');
  const tgC = document.getElementById('cfg-tg-chatid');

  if (acc) acc.value = state.accountSize;
  if (rsk) rsk.value = state.riskPct;
  if (td) td.value = state.twelveDataKey;
  if (tgT) tgT.value = state.tgToken;
  if (tgC) tgC.value = state.tgChatId;
  updateNativeNotifStatusUI();
}

function saveSettings() {
  state.accountSize = Number(document.getElementById('cfg-account-size').value);
  state.riskPct = Number(document.getElementById('cfg-risk-pct').value);
  state.twelveDataKey = document.getElementById('cfg-twelvedata-key').value.trim();
  state.tgToken = document.getElementById('cfg-tg-token').value.trim();
  state.tgChatId = document.getElementById('cfg-tg-chatid').value.trim();
  saveState();
  renderHomeDashboard();
  renderSignals();
  showToast('💾 Pengaturan tersimpan');
}

function resetDailyCounters() {
  state.entriesToday = 0;
  state.slsToday = 0;
  state.checklist.forEach((c) => (c.done = false));
  saveState();
  renderHomeDashboard();
  showToast('🔄 Tracker harian di-reset');
}

// Live Price Ticker Simulation
setInterval(() => {
  const delta = (Math.random() - 0.49) * 0.45;
  state.xauPrice = +(state.xauPrice + delta).toFixed(2);
  const priceEl = document.getElementById('header-xau-price');
  if (priceEl) priceEl.textContent = state.xauPrice.toFixed(2);
}, 2500);

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
  setSignalTF(state.selectedTF);
  switchTab(state.activeTab);
});
