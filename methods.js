/*!
 * Liamvtrade — Locked Sniper Engine, Pips Educator & Multi-Pair Core (v2.4)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// 1. Konfigurasi Instrumen Aktif (Bebas Blokir DNS 4G Indonesia & Weekend BTC Mode)
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
    usdPerUnitPerLot: 10, // 1.00 lot = $10 per pip ($0.10/pip di 0.01 lot)
    defaultPrice: 2712.50,
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
    usdPerUnitPerLot: 1, // 1.00 lot CFD = $1 per 1.0 point
    defaultPrice: 21180.00,
    weekendActive: false,
    primeSession: 'New York Open (20.30–23.00 WIB)',
    slRange: '15 – 30 points'
  },
  BTCUSDT: {
    id: 'BTCUSDT',
    name: 'BTCUSDT (Bitcoin)',
    category: 'Crypto 24/7',
    tvSymbol: 'COINBASE:BTCUSD',
    tdSymbol: 'BTC/USD',
    decimals: 2,
    unitLabel: 'pts',
    pipMultiplier: 1, // $1.00 = 1 point
    usdPerUnitPerLot: 1, // 1.00 BTC = $1 per $1.00 move
    defaultPrice: 59350.00,
    weekendActive: true,
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
    usdPerUnitPerLot: 10, // 1.00 lot = $10 per pip
    defaultPrice: 1.05450,
    weekendActive: false,
    primeSession: 'London (14.00–17.30) & Overlap (19.30–22.00 WIB)',
    slRange: '8 – 15 pips'
  }
};

// 2. Catatan Roadmap Ekspansi Aset Masa Depan
const LIAMV_ASSET_ROADMAP = [
  { id: 'rm-forex', title: 'Forex Pairs Lengkap', items: 'GBPUSD, USDJPY, GBPJPY, XAGUSD', status: 'Fase Berikutnya' },
  { id: 'rm-crypto', title: 'Crypto & Memecoin Radar', items: 'SOL, ETH, PEPE, WIF, DOGE (DEX & CEX)', status: 'Fase Berikutnya' },
  { id: 'rm-usstock', title: 'Saham US (Wall Street)', items: 'NVDA, TSLA, AAPL, MSFT, META', status: 'Fase Berikutnya' },
  { id: 'rm-idx', title: 'Saham Indonesia (IDX)', items: 'BBCA, BBRI, BMRI, ADRO, BREN', status: 'Fase Berikutnya' }
];

// 3. Katalog Metode Analisis
const LIAMV_METHODS = [
  {
    id: 'AUTO',
    name: 'Auto Sniper (Konfluensi Tertinggi)',
    shortName: 'Auto Sniper'
  },
  {
    id: 'SMC',
    name: 'Metode 01: SMC (Session Sweep + OB/FVG)',
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

// 5. Kalkulator Ukuran Lot & Estimasi Profit/Loss ($)
function calculateLotForPair(pairId, slUnits, accountBalance, riskPct) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const riskUsd = accountBalance * (riskPct / 100);
  if (slUnits <= 0) return 0.01;
  const rawLot = riskUsd / (slUnits * cfg.usdPerUnitPerLot);
  return Math.max(0.01, +rawLot.toFixed(2));
}

function calculateUsdPnl(pairId, signedUnits, lotSize) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  return +(signedUnits * cfg.usdPerUnitPerLot * lotSize).toFixed(2);
}

// 6. Generator 1 SNIPER SETUP TERKUNCI (Anti-Spam & Anti-Geser)
function buildLockedSniperSetup(pairId, tf, methodId, currentPrice, marketRanges = {}) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const base = Number(currentPrice) || cfg.defaultPrice;
  const d = cfg.decimals;
  const mult = cfg.pipMultiplier;

  const baseStepMap = {
    XAUUSD: { zone: 1.5, sl: 3.0, tp1: 4.5, tp2: 6.5, tp3: 9.5, offset: 1.8 },
    US100: { zone: 12.0, sl: 22.0, tp1: 35.0, tp2: 50.0, tp3: 75.0, offset: 15.0 },
    BTCUSDT: { zone: 130.0, sl: 240.0, tp1: 380.0, tp2: 540.0, tp3: 800.0, offset: 170.0 },
    EURUSD: { zone: 0.0008, sl: 0.0012, tp1: 0.0018, tp2: 0.0026, tp3: 0.0038, offset: 0.0009 }
  };

  const tfScaleMap = {
    M5: 0.75,
    M15: 1.0,
    H1: 1.45,
    H4: 2.1
  };

  const scale = tfScaleMap[tf] || 1.0;
  const b = baseStepMap[pairId] || baseStepMap.XAUUSD;
  const zone = b.zone * scale;
  const slDist = b.sl * scale;
  const tp1Dist = b.tp1 * scale;
  const tp2Dist = b.tp2 * scale;
  const tp3Dist = b.tp3 * scale;
  const offset = b.offset * scale;

  const rangeInfo = marketRanges[pairId] || {};
  const swingHigh = Number(rangeInfo.high) || +(base + b.offset * 2.5).toFixed(d);
  const swingLow = Number(rangeInfo.low) || +(base - b.offset * 2.5).toFixed(d);
  const midRange = (swingHigh + swingLow) / 2;

  // Tentukan arah tunggal berdasarkan posisi harga terhadap Equilibrium (50% Range)
  const isDiscountBuy = base <= midRange;
  const chosenMethod = methodId === 'AUTO' ? (tf === 'H1' ? 'FIBO' : 'SMC') : methodId;

  const methodTitleMap = {
    SMC: isDiscountBuy
      ? `SMC Liquidity Sweep + Discount FVG (${tf})`
      : `SMC Judas Swing + Premium OB (${tf})`,
    FIBO: `Fibonacci Golden Pocket 0.618–0.786 (${tf})`,
    LIQ: isDiscountBuy
      ? `Equal Lows Liquidity Reversal (${tf})`
      : `Equal Highs Liquidity Reversal (${tf})`
  };

  const confidence = tf === 'M15' ? 88 : tf === 'H1' ? 85 : tf === 'M5' ? 79 : 82;
  const nowIso = new Date().toISOString();

  if (isDiscountBuy) {
    const entryMax = +(base - offset).toFixed(d);
    const entryMin = +(entryMax - zone).toFixed(d);
    const entryMid = +((entryMin + entryMax) / 2).toFixed(d);
    const sl = +(entryMin - (slDist - zone)).toFixed(d);
    const slUnits = Math.max(1, Math.round(Math.abs(entryMid - sl) * mult));
    const tp1 = +(entryMid + tp1Dist).toFixed(d);
    const tp2 = +(entryMid + tp2Dist).toFixed(d);
    const tp3 = +(entryMid + tp3Dist).toFixed(d);

    return {
      id: `sig-${Date.now()}`,
      createdAt: nowIso,
      closedAt: null,
      pair: pairId,
      tf: tf,
      method: chosenMethod,
      methodLabel: methodTitleMap[chosenMethod],
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: confidence,
      entryMin: entryMin,
      entryMax: entryMax,
      entryPrice: entryMid,
      sl: sl,
      slUnits: slUnits,
      tp1: tp1,
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: tp2,
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: tp3,
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      unitLabel: cfg.unitLabel,
      bestTp: `TP 2 (1:2) — ${tp2.toFixed(d)}`,
      bestTpReason: `Harga berada di zona Discount (<50% range); target likuiditas atas menuju ${swingHigh.toFixed(d)}.`,
      session: cfg.primeSession,
      structure: `Sweep Low dekat ${swingLow.toFixed(d)} → Displacement Bullish & CHoCH → Retest FVG/OB ${tf}.`,
      note: `Angka order dikunci sampai setup selesai. Geser SL ke BE saat harga menyentuh TP1 (+${Math.round(tp1Dist * mult)} ${cfg.unitLabel}).`,
      status: 'LIVE', // LIVE | TP1 HIT | TP2 HIT | TP3 HIT | BREAK EVEN | SL HIT
      resultUnits: 0,
      takenByUser: false,
      takenAccountId: null,
      takenLot: 0
    };
  } else {
    const entryMin = +(base + offset).toFixed(d);
    const entryMax = +(entryMin + zone).toFixed(d);
    const entryMid = +((entryMin + entryMax) / 2).toFixed(d);
    const sl = +(entryMax + (slDist - zone)).toFixed(d);
    const slUnits = Math.max(1, Math.round(Math.abs(sl - entryMid) * mult));
    const tp1 = +(entryMid - tp1Dist).toFixed(d);
    const tp2 = +(entryMid - tp2Dist).toFixed(d);
    const tp3 = +(entryMid - tp3Dist).toFixed(d);

    return {
      id: `sig-${Date.now()}`,
      createdAt: nowIso,
      closedAt: null,
      pair: pairId,
      tf: tf,
      method: chosenMethod,
      methodLabel: methodTitleMap[chosenMethod],
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: confidence,
      entryMin: entryMin,
      entryMax: entryMax,
      entryPrice: entryMid,
      sl: sl,
      slUnits: slUnits,
      tp1: tp1,
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: tp2,
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: tp3,
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      unitLabel: cfg.unitLabel,
      bestTp: `TP 2 (1:2) — ${tp2.toFixed(d)}`,
      bestTpReason: `Harga berada di zona Premium (>50% range); target likuiditas bawah menuju ${swingLow.toFixed(d)}.`,
      session: cfg.primeSession,
      structure: `Sweep High dekat ${swingHigh.toFixed(d)} → Displacement Bearish & CHoCH → Retest OB/FVG ${tf}.`,
      note: `Angka order dikunci sampai setup selesai. Geser SL ke BE saat harga menyentuh TP1 (+${Math.round(tp1Dist * mult)} ${cfg.unitLabel}).`,
      status: 'LIVE',
      resultUnits: 0,
      takenByUser: false,
      takenAccountId: null,
      takenLot: 0
    };
  }
}

// 7. Penjelasan Edukasi Pips & Evaluasi Hasil Trade
function explainSignalEducation(sig) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const u = sig.unitLabel;
  const rr2 = (sig.tp2Units / Math.max(1, sig.slUnits)).toFixed(1);

  let outcomeInsight = '';
  if (sig.status === 'TP1 HIT') {
    outcomeInsight = `Harga menyentuh TP1 (+${sig.tp1Units} ${u}). Sesuai aturan SMC, 50% posisi diamankan dan SL digeser ke Break Even (BE) sehingga posisi bebas risiko.`;
  } else if (sig.status === 'TP2 HIT') {
    outcomeInsight = `Target utama intraday tercapai di TP2 (+${sig.tp2Units} ${u}) dengan rasio Risk-to-Reward 1:${rr2}. Struktur momentum valid mengikuti bias ${sig.bias}.`;
  } else if (sig.status === 'TP3 HIT') {
    outcomeInsight = `Ekspansi penuh menyapu likuiditas ekstrem hingga TP3 (+${sig.tp3Units} ${u}). Setup optimal saat volume sesi utama tinggi.`;
  } else if (sig.status === 'BREAK EVEN') {
    outcomeInsight = `Harga sempat bergerak positif lalu berbalik menyentuh titik impas (0 ${u}). Modal terlindungi utuh tanpa terkena kerugian SL.`;
  } else if (sig.status === 'SL HIT') {
    outcomeInsight = `Harga menembus batas invalidasi SL (-${sig.slUnits} ${u}). Evaluasi: pastikan tidak ada rilis berita USD mendadak atau sweep lanjutan sebelum CHoCH valid.`;
  } else {
    outcomeInsight = `Setup masih aktif dipantau. Risiko terukur ${sig.slUnits} ${u} melawan potensi target ${sig.tp1Units} / ${sig.tp2Units} / ${sig.tp3Units} ${u}.`;
  }

  return {
    riskSummary: `Jarak SL: ${sig.slUnits} ${u} (${sig.sl.toFixed(d)}) • Target: TP1 +${sig.tp1Units} ${u} | TP2 +${sig.tp2Units} ${u} | TP3 +${sig.tp3Units} ${u}`,
    outcomeInsight: outcomeInsight
  };
}

// 8. Formatter Output Standar SMC (Untuk Clipboard & Auto-Telegram)
function formatStandardSmcSignal(sig, lotSize, accountLabel) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const meta = getConfidenceMeta(sig.confidence);

  return `${sig.pair} | 🔵 ${sig.direction} AREA 🔵 [${sig.status}]

🟡 ZONA ENTRY : ${sig.entryMin.toFixed(d)} - ${sig.entryMax.toFixed(d)}
❌ STOP LOSS  : ${sig.sl.toFixed(d)} (${sig.slUnits} ${sig.unitLabel})
✅ TARGET TP 1 : ${sig.tp1.toFixed(d)} (${sig.tp1Units} ${sig.unitLabel}) — RR 1:1.5 (Set BE)
✅ TARGET TP 2 : ${sig.tp2.toFixed(d)} (${sig.tp2Units} ${sig.unitLabel}) — RR 1:2
✅ TARGET TP 3 : ${sig.tp3.toFixed(d)} (${sig.tp3Units} ${sig.unitLabel}) — RR 1:3

📊 Bias Directional : ${sig.bias}
🎯 Metode Setup    : ${sig.methodLabel} [${meta.tier} • ${sig.confidence}% PD]
⭐ Rekomendasi TP  : ${sig.bestTp}
💼 Akun & Lot      : ${accountLabel} (${lotSize.toFixed(2)} lot)
📌 Alasan Struktur  : ${sig.structure}`;
}
