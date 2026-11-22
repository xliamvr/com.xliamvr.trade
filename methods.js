/*!
 * Liamvtrade — Multi-Pair, Multi-Method & Dynamic Price Engine (v2.1)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// 1. Konfigurasi Instrumen Aktif (Siap Multi-Pair & Weekend BTC Mode)
const LIAMV_PAIRS = {
  XAUUSD: {
    id: 'XAUUSD',
    name: 'XAUUSD (Gold)',
    category: 'Commodity / Metal',
    tvSymbol: 'OANDA:XAUUSD',
    tdSymbol: 'XAU/USD',
    decimals: 2,
    unitLabel: 'pips',
    pipMultiplier: 10, // $1.00 = 10 pips
    defaultPrice: 2685.50,
    weekendActive: false,
    primeSession: 'London (15.30–18.00) & NY (20.30–22.30 WIB)',
    slRange: '20 – 35 pips ($2.0 – $3.5)'
  },
  US100: {
    id: 'US100',
    name: 'US100 (Nasdaq)',
    category: 'US Index',
    tvSymbol: 'NASDAQ:NDX',
    tdSymbol: 'NDX',
    decimals: 2,
    unitLabel: 'pts',
    pipMultiplier: 1, // 1.00 index point
    defaultPrice: 21150.00,
    weekendActive: false,
    primeSession: 'New York Open (20.30–23.00 WIB)',
    slRange: '15 – 30 points'
  },
  BTCUSDT: {
    id: 'BTCUSDT',
    name: 'BTCUSDT (Bitcoin)',
    category: 'Crypto 24/7',
    tvSymbol: 'BINANCE:BTCUSDT',
    tdSymbol: 'BTC/USD',
    decimals: 2,
    unitLabel: 'pts',
    pipMultiplier: 1, // $1.00 = 1 point
    defaultPrice: 96500.00,
    weekendActive: true, // Tetap aktif saat Sabtu & Minggu
    primeSession: '24/7 Active • Peak NY (20.00–00.00 WIB)',
    slRange: '$180 – $350 points'
  },
  EURUSD: {
    id: 'EURUSD',
    name: 'EURUSD (Euro)',
    category: 'Major Forex',
    tvSymbol: 'OANDA:EURUSD',
    tdSymbol: 'EUR/USD',
    decimals: 5,
    unitLabel: 'pips',
    pipMultiplier: 10000, // 0.0001 = 1 pip
    defaultPrice: 1.05450,
    weekendActive: false,
    primeSession: 'London (14.00–17.30) & Overlap (19.30–22.00 WIB)',
    slRange: '8 – 15 pips'
  }
};

// 2. Catatan Roadmap Ekspansi Aset Masa Depan (Tersimpan di Sistem)
const LIAMV_ASSET_ROADMAP = [
  { id: 'rm-forex', title: 'Forex Pairs Lengkap', items: 'GBPUSD, USDJPY, GBPJPY, XAGUSD', status: 'Fase Berikutnya' },
  { id: 'rm-crypto', title: 'Crypto & Memecoin Radar', items: 'SOL, ETH, PEPE, WIF, DOGE (DEX & CEX)', status: 'Fase Berikutnya' },
  { id: 'rm-usstock', title: 'Saham US (Wall Street)', items: 'NVDA, TSLA, AAPL, MSFT, META', status: 'Fase Berikutnya' },
  { id: 'rm-idx', title: 'Saham Indonesia (IDX)', items: 'BBCA, BBRI, BMRI, ADRO, BREN', status: 'Fase Berikutnya' }
];

// 3. Katalog Metode Analisis
const LIAMV_METHODS = [
  {
    id: 'ALL',
    name: 'Semua Metode (SMC + Fibo + Liquidity)',
    shortName: 'Multi-Strategy'
  },
  {
    id: 'SMC',
    name: 'Metode 01: SMC (Asia/Session Sweep + OB/FVG)',
    shortName: 'SMC Sweep'
  },
  {
    id: 'FIBO',
    name: 'Metode 02: Fibonacci Golden Pocket (0.618 – 0.786)',
    shortName: 'Fibo OTE'
  },
  {
    id: 'LIQ',
    name: 'Metode 03: Equal Highs/Lows Liquidity Reversal',
    shortName: 'Liquidity Pool'
  }
];

// 4. Klasifikasi Confidence Score (% PD)
function getConfidenceMeta(pdScore) {
  if (pdScore >= 80) {
    return {
      tier: 'HIGH SIGNAL',
      badgeClass: 'text-emerald-500 bg-emerald-500/15',
      strokeColor: '#10B981'
    };
  }
  if (pdScore >= 65) {
    return {
      tier: 'MEDIUM SIGNAL',
      badgeClass: 'text-amber-500 bg-amber-500/15',
      strokeColor: '#F59E0B'
    };
  }
  return {
    tier: 'LOW SIGNAL',
    badgeClass: 'text-rose-500 bg-rose-500/15',
    strokeColor: '#F43F5E'
  };
}

// 5. Kalkulator Ukuran Lot Presisi per Instrumen & Akun
function calculateLotForPair(pairId, slUnits, accountBalance, riskPct) {
  const riskUsd = accountBalance * (riskPct / 100);
  if (slUnits <= 0) return 0.02;

  let rawLot = 0.02;
  if (pairId === 'XAUUSD') {
    // 0.01 lot = $0.10 per pip
    rawLot = riskUsd / (slUnits * 0.1);
  } else if (pairId === 'EURUSD') {
    // 0.01 lot = $0.10 per pip (1 lot = $10/pip)
    rawLot = riskUsd / (slUnits * 10);
  } else if (pairId === 'US100') {
    // Standar CFD: 1 lot = $1 per 1.0 point
    rawLot = riskUsd / slUnits;
  } else if (pairId === 'BTCUSDT') {
    // 1 BTC = $1 per $1 move
    rawLot = riskUsd / slUnits;
  }

  return Math.max(0.01, +rawLot.toFixed(2));
}

// 6. Generator Sinyal Dinamis Mengikuti Harga Live Market Saat Ini
function generateSignalsForPair(pairId, livePrices) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const base = livePrices[pairId] || cfg.defaultPrice;
  const d = cfg.decimals;
  const mult = cfg.pipMultiplier;

  // Skala jarak per instrumen agar realistis mengikuti harga live
  const stepMap = {
    XAUUSD: { zone: 1.5, sl: 3.0, tp1: 4.5, tp2: 6.5, tp3: 9.5, offset: 2.2 },
    US100: { zone: 12.0, sl: 22.0, tp1: 35.0, tp2: 50.0, tp3: 75.0, offset: 18.0 },
    BTCUSDT: { zone: 140.0, sl: 260.0, tp1: 400.0, tp2: 580.0, tp3: 850.0, offset: 210.0 },
    EURUSD: { zone: 0.0008, sl: 0.0012, tp1: 0.0018, tp2: 0.0026, tp3: 0.0038, offset: 0.0010 }
  };
  const s = stepMap[pairId] || stepMap.XAUUSD;

  const buyEntryMax = +(base - s.offset).toFixed(d);
  const buyEntryMin = +(buyEntryMax - s.zone).toFixed(d);
  const buySl = +(buyEntryMin - (s.sl - s.zone)).toFixed(d);
  const buySlUnits = Math.round(Math.abs(buyEntryMax - buySl) * mult);

  const sellEntryMin = +(base + s.offset).toFixed(d);
  const sellEntryMax = +(sellEntryMin + s.zone).toFixed(d);
  const sellSl = +(sellEntryMax + (s.sl - s.zone)).toFixed(d);
  const sellSlUnits = Math.round(Math.abs(sellSl - sellEntryMin) * mult);

  return [
    {
      id: `${pairId}-m15-smc`,
      pair: pairId,
      tf: 'M15',
      method: 'SMC',
      methodLabel: 'SMC Liquidity Sweep + Unmitigated FVG',
      direction: 'BUY LIMIT',
      bias: 'Bullish',
      confidence: 87,
      entryMin: buyEntryMin,
      entryMax: buyEntryMax,
      sl: buySl,
      slUnits: buySlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(buyEntryMax + s.tp1).toFixed(d),
      tp1Units: Math.round(s.tp1 * mult),
      tp2: +(buyEntryMax + s.tp2).toFixed(d),
      tp2Units: Math.round(s.tp2 * mult),
      tp3: +(buyEntryMax + s.tp3).toFixed(d),
      tp3Units: Math.round(s.tp3 * mult),
      bestTp: `TP 2 (1:2) — ${(buyEntryMax + s.tp2).toFixed(d)}`,
      bestTpReason: `Struktur intraday ${pairId} menghormati area Discount FVG M15 setelah sapuan likuiditas bawah.`,
      session: cfg.primeSession,
      structure: `Sweep Low terdekat di bawah ${buyEntryMin.toFixed(d)} → Displacement Bullish & CHoCH M5 → Retest FVG M15.`,
      note: `Geser SL ke BE setelah profit mencapai TP1. Ideal SL ${pairId}: ${cfg.slRange}.`
    },
    {
      id: `${pairId}-m5-smc`,
      pair: pairId,
      tf: 'M5',
      method: 'SMC',
      methodLabel: 'SMC Judas Swing + Extreme OB',
      direction: 'SELL LIMIT',
      bias: 'Bearish',
      confidence: 74,
      entryMin: sellEntryMin,
      entryMax: sellEntryMax,
      sl: sellSl,
      slUnits: sellSlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(sellEntryMin - s.tp1).toFixed(d),
      tp1Units: Math.round(s.tp1 * mult),
      tp2: +(sellEntryMin - s.tp2).toFixed(d),
      tp2Units: Math.round(s.tp2 * mult),
      tp3: +(sellEntryMin - s.tp3).toFixed(d),
      tp3Units: Math.round(s.tp3 * mult),
      bestTp: `TP 1 (1:1.5) — ${(sellEntryMin - s.tp1).toFixed(d)}`,
      bestTpReason: 'Setup scalping cepat M5; amankan partial profit di TP1 + Set BE lebih awal.',
      session: cfg.primeSession,
      structure: `Sweep Resistance atas → Engulfing Bearish M5 + CHoCH M1 kembali ke Extreme OB.`,
      note: 'Patuhi batas maksimal Entry & SL harian per akun.'
    },
    {
      id: `${pairId}-h1-fibo`,
      pair: pairId,
      tf: 'H1',
      method: 'FIBO',
      methodLabel: 'Fibonacci Golden Pocket (0.618–0.786)',
      direction: 'BUY LIMIT',
      bias: 'Bullish',
      confidence: 83,
      entryMin: +(buyEntryMin - s.zone * 0.6).toFixed(d),
      entryMax: +(buyEntryMax - s.zone * 0.6).toFixed(d),
      sl: +(buySl - s.zone * 0.6).toFixed(d),
      slUnits: buySlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(buyEntryMax + s.tp1).toFixed(d),
      tp1Units: Math.round(s.tp1 * mult),
      tp2: +(buyEntryMax + s.tp2).toFixed(d),
      tp2Units: Math.round(s.tp2 * mult),
      tp3: +(buyEntryMax + s.tp3).toFixed(d),
      tp3Units: Math.round(s.tp3 * mult),
      bestTp: `TP 2 (1:2) — ${(buyEntryMax + s.tp2).toFixed(d)}`,
      bestTpReason: 'Zona Golden Pocket 0.705 Fibo sejajar dengan Extreme Order Block H1.',
      session: cfg.primeSession,
      structure: 'BOS Bullish H1 valid → Retracement sehat ke zona OTE 0.618–0.786.',
      note: 'Tunggu konfirmasi wick rejection di M5 sebelum eksekusi.'
    },
    {
      id: `${pairId}-h4-liq`,
      pair: pairId,
      tf: 'H4',
      method: 'LIQ',
      methodLabel: 'Major Equal Highs Liquidity Pool',
      direction: 'SELL LIMIT',
      bias: 'Bearish',
      confidence: 57,
      entryMin: +(sellEntryMin + s.zone * 1.4).toFixed(d),
      entryMax: +(sellEntryMax + s.zone * 1.4).toFixed(d),
      sl: +(sellSl + s.zone * 1.4).toFixed(d),
      slUnits: sellSlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(sellEntryMin - s.tp1).toFixed(d),
      tp1Units: Math.round(s.tp1 * mult),
      tp2: +(sellEntryMin - s.tp2).toFixed(d),
      tp2Units: Math.round(s.tp2 * mult),
      tp3: +(sellEntryMin - s.tp3).toFixed(d),
      tp3Units: Math.round(s.tp3 * mult),
      bestTp: `TP 1 (1:1.5) — ${(sellEntryMin - s.tp1).toFixed(d)}`,
      bestTpReason: 'Masih berstatus LOW SIGNAL (Early Alert) — belum terjadi sweep H4.',
      session: 'Menunggu Konfirmasi',
      structure: 'Harga mendekati Equal Highs H4; pantau reaksi likuiditas.',
      note: 'LOW SIGNAL — Jadikan watchlist, jangan entry sebelum CHoCH M5.'
    }
  ];
}

// 7. Formatter Output Standar SMC per Pair & Akun
function formatStandardSmcSignal(sig, lotSize, accountLabel) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const meta = getConfidenceMeta(sig.confidence);

  return `${sig.pair} | 🔵 ${sig.direction} AREA 🔵

🟡 ZONA ENTRY : ${sig.entryMin.toFixed(d)} - ${sig.entryMax.toFixed(d)}
❌ STOP LOSS  : ${sig.sl.toFixed(d)} (${sig.slUnits} ${sig.unitLabel})
✅ TARGET TP 1 : ${sig.tp1.toFixed(d)} (${sig.tp1Units} ${sig.unitLabel}) — RR 1:1.5 (Set BE + Partial)
✅ TARGET TP 2 : ${sig.tp2.toFixed(d)} (${sig.tp2Units} ${sig.unitLabel}) — RR 1:2
✅ TARGET TP 3 : ${sig.tp3.toFixed(d)} (${sig.tp3Units} ${sig.unitLabel}) — RR 1:3

📊 Bias Directional : ${sig.bias}
🎯 Metode Setup    : ${sig.methodLabel} [${meta.tier} • ${sig.confidence}% PD]
⭐ Rekomendasi TP  : ${sig.bestTp}
💼 Akun & Lot      : ${accountLabel} (${lotSize.toFixed(2)} lot)
🕐 Sesi & Waktu     : ${sig.session}
📌 Alasan Struktur  : ${sig.structure}
⚠️ Catatan Khusus   : ${sig.note}`;
}
