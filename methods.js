/*!
 * Liamvtrade — Multi-Method Signal & Confidence Engine (v2.0)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// 1. Katalog Metode Trading (Muncul otomatis di dropdown pilihan indikator)
const LIAMV_METHODS = [
  {
    id: 'ALL',
    name: 'Semua Metode (SMC + Fibo + Liquidity)',
    shortName: 'Multi-Strategy',
    description: 'Menggabungkan konfluensi SMC Asia Sweep, Fibonacci Golden Pocket, dan Liquidity Pool.'
  },
  {
    id: 'SMC',
    name: 'Metode 01: XAUUSD SMC (Asia Sweep + OB/FVG)',
    shortName: 'SMC Asia Sweep',
    description: 'Wajib Liquidity Sweep Asia High/Low + Displacement & CHoCH M5/M1 lalu retest Extreme OB/FVG.'
  },
  {
    id: 'FIBO',
    name: 'Metode 02: Fibonacci Golden Pocket (0.618 – 0.786)',
    shortName: 'Fibo OTE',
    description: 'Entry retracement pada zona Optimal Trade Entry (0.618–0.786) searah BOS timeframe besar.'
  },
  {
    id: 'LIQ',
    name: 'Metode 03: Equal Highs/Lows Liquidity Reversal',
    shortName: 'Liquidity Pool',
    description: 'Berburu sapuan likuiditas pada Equal Highs/Lows & level psikologis bulat ($10/$50/$100).'
  }
];

// 2. Klasifikasi Tingkat Keyakinan (% PD)
function getConfidenceMeta(pdScore) {
  if (pdScore >= 80) {
    return {
      tier: 'HIGH SIGNAL',
      badgeClass: 'text-emerald-500 bg-emerald-500/15',
      strokeColor: '#10B981',
      advice: 'Konfirmasi lengkap & berada di sesi likuiditas utama.'
    };
  }
  if (pdScore >= 65) {
    return {
      tier: 'MEDIUM SIGNAL',
      badgeClass: 'text-amber-500 bg-amber-500/15',
      strokeColor: '#F59E0B',
      advice: 'Struktur valid, utamakan TP1 + geser SL ke BE lebih cepat.'
    };
  }
  return {
    tier: 'LOW SIGNAL',
    badgeClass: 'text-rose-500 bg-rose-500/15',
    strokeColor: '#F43F5E',
    advice: 'Early alert — tunggu konfirmasi CHoCH M5/M1 sebelum entry.'
  };
}

// 3. Database Sinyal Multi-Timeframe (M5, M15, H1, H4)
const LIAMV_SIGNALS = [
  {
    id: 'sig-m15-smc',
    pair: 'XAUUSD',
    tf: 'M15',
    method: 'SMC',
    methodLabel: 'Liquidity Sweep + Unmitigated FVG',
    direction: 'BUY LIMIT',
    bias: 'Bullish',
    confidence: 88,
    entryMin: 2732.50,
    entryMax: 2734.00,
    sl: 2730.00,
    slPips: 32,
    tp1: 2738.00,
    tp1Pips: 48,
    tp2: 2739.60,
    tp2Pips: 64,
    tp3: 2742.80,
    tp3Pips: 96,
    bestTp: 'TP 2 (1:2) — 2739.60',
    bestTpReason: 'Ekspansi awal sesi NY memiliki volume tinggi dan Asia High (2741.80) menjadi magnet likuiditas utama.',
    session: 'New York (20:45 WIB)',
    structure: 'Sweep Asia Low 2728.20 → Displacement Bullish & CHoCH M5 → Retest Unmitigated FVG M15 di area Discount.',
    note: 'Running +$3.0 (30 pips) wajib geser SL ke BE. Jangan biarkan pending order aktif saat rilis news USD.'
  },
  {
    id: 'sig-m5-smc',
    pair: 'XAUUSD',
    tf: 'M5',
    method: 'SMC',
    methodLabel: 'Liquidity Sweep + Extreme OB',
    direction: 'SELL LIMIT',
    bias: 'Bearish',
    confidence: 75,
    entryMin: 2741.20,
    entryMax: 2742.50,
    sl: 2744.80,
    slPips: 29,
    tp1: 2737.50,
    tp1Pips: 44,
    tp2: 2736.00,
    tp2Pips: 58,
    tp3: 2733.10,
    tp3Pips: 87,
    bestTp: 'TP 1 (1:1.5) — 2737.50',
    bestTpReason: 'Setup scalping cepat di M5; amankan partial profit di TP1 dan set BE karena tren H4 masih cenderung bullish.',
    session: 'London (16:20 WIB)',
    structure: 'Judas Swing menyapu Asia High 2741.80 → Engulfing Bearish M5 + CHoCH M1 kembali ke Extreme OB.',
    note: 'Maksimal 2 entry/hari. Jika sudah kena 2 SL hari ini, hentikan eksekusi.'
  },
  {
    id: 'sig-h1-fibo',
    pair: 'XAUUSD',
    tf: 'H1',
    method: 'FIBO',
    methodLabel: 'Fibonacci Golden Pocket (0.618–0.786)',
    direction: 'BUY LIMIT',
    bias: 'Bullish',
    confidence: 84,
    entryMin: 2729.40,
    entryMax: 2731.20,
    sl: 2726.80,
    slPips: 35,
    tp1: 2735.50,
    tp1Pips: 52,
    tp2: 2737.30,
    tp2Pips: 70,
    tp3: 2740.80,
    tp3Pips: 105,
    bestTp: 'TP 2 (1:2) — 2737.30',
    bestTpReason: 'Level Fibo 0.705 berhimpitan langsung dengan Extreme Order Block H1 serta level psikologis $2,730.',
    session: 'Overlap London–NY (19:50 WIB)',
    structure: 'BOS Bullish H1 terkonfirmasi → Pullback sehat ke zona Discount Golden Pocket 0.618–0.786.',
    note: 'Tunggu rejection wick atau CHoCH M5 saat harga masuk zona entry.'
  },
  {
    id: 'sig-h4-liq',
    pair: 'XAUUSD',
    tf: 'H4',
    method: 'LIQ',
    methodLabel: 'Equal Highs Liquidity + Psychological $2,750',
    direction: 'SELL LIMIT',
    bias: 'Bearish',
    confidence: 58,
    entryMin: 2748.50,
    entryMax: 2750.00,
    sl: 2752.80,
    slPips: 35,
    tp1: 2744.00,
    tp1Pips: 52,
    tp2: 2742.20,
    tp2Pips: 70,
    tp3: 2738.70,
    tp3Pips: 105,
    bestTp: 'TP 1 (1:1.5) — 2744.00',
    bestTpReason: 'Status masih LOW SIGNAL (Early Alert) — belum terjadi sweep atau CHoCH di timeframe bawah.',
    session: 'Menunggu Konfirmasi',
    structure: 'Harga mendekati Equal Highs H4 dan angka bulat psikologis $2,750.00.',
    note: 'LOW SIGNAL — Jadikan watchlist saja, dilarang entry sebelum konfirmasi CHoCH M5.'
  }
];

// 4. Formatter Output Standar SMC (Sesuai Template Wajib)
function formatStandardSmcSignal(sig, lotSize) {
  const meta = getConfidenceMeta(sig.confidence);
  return `${sig.pair} | 🔵 ${sig.direction} AREA 🔵

🟡 ZONA ENTRY : ${sig.entryMin.toFixed(2)} - ${sig.entryMax.toFixed(2)}
❌ STOP LOSS  : ${sig.sl.toFixed(2)} (${sig.slPips} Poin / Pips)
✅ TARGET TP 1 : ${sig.tp1.toFixed(2)} (${sig.tp1Pips} Poin) — RR 1:1.5 (Set BE + Partial)
✅ TARGET TP 2 : ${sig.tp2.toFixed(2)} (${sig.tp2Pips} Poin) — RR 1:2
✅ TARGET TP 3 : ${sig.tp3.toFixed(2)} (${sig.tp3Pips} Poin) — RR 1:3

📊 Bias Directional : ${sig.bias}
🎯 Metode Setup    : ${sig.methodLabel} [${meta.tier} • ${sig.confidence}% PD]
⭐ Rekomendasi TP  : ${sig.bestTp}
💼 Lot Prop Firm   : ${lotSize.toFixed(2)} lot
🕐 Sesi & Waktu     : ${sig.session}
📌 Alasan Struktur  : ${sig.structure}
⚠️ Catatan Khusus   : ${sig.note}`;
}
