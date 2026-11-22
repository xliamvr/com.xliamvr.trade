/*!
 * Liamvtrade — Multi-Pair, Candle Structure & Dynamic Signal Engine (v2.2)
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
    defaultPrice: 97450.00,
    weekendActive: true, // Aktif penuh Sabtu & Minggu (24/7)
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
    id: 'ALL',
    name: 'Semua Metode (SMC + Fibo + Liquidity)',
    shortName: 'Multi-Strategy'
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

// 5. Kalkulator Ukuran Lot Presisi per Instrumen & Akun
function calculateLotForPair(pairId, slUnits, accountBalance, riskPct) {
  const riskUsd = accountBalance * (riskPct / 100);
  if (slUnits <= 0) return 0.02;

  let rawLot = 0.02;
  if (pairId === 'XAUUSD') {
    rawLot = riskUsd / (slUnits * 0.1);
  } else if (pairId === 'EURUSD') {
    rawLot = riskUsd / (slUnits * 10);
  } else if (pairId === 'US100') {
    rawLot = riskUsd / slUnits;
  } else if (pairId === 'BTCUSDT') {
    rawLot = riskUsd / slUnits;
  }

  return Math.max(0.01, +rawLot.toFixed(2));
}

// 6. Generator Sinyal Multi-Timeframe (M5, M15, H1, H4) & Multi-Metode
function generateSignalsForPair(pairId, livePrices, marketRanges = {}) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const base = Number(livePrices[pairId]) || cfg.defaultPrice;
  const d = cfg.decimals;
  const mult = cfg.pipMultiplier;

  // Skala jarak per instrumen & pengali timeframe
  const baseStepMap = {
    XAUUSD: { zone: 1.5, sl: 3.0, tp1: 4.5, tp2: 6.5, tp3: 9.5, offset: 2.0 },
    US100: { zone: 12.0, sl: 22.0, tp1: 35.0, tp2: 50.0, tp3: 75.0, offset: 16.0 },
    BTCUSDT: { zone: 130.0, sl: 240.0, tp1: 380.0, tp2: 540.0, tp3: 800.0, offset: 180.0 },
    EURUSD: { zone: 0.0008, sl: 0.0012, tp1: 0.0018, tp2: 0.0026, tp3: 0.0038, offset: 0.0010 }
  };

  const tfScaleMap = {
    M5: 0.75,
    M15: 1.0,
    H1: 1.45,
    H4: 2.1
  };

  const rangeInfo = marketRanges[pairId] || {};
  const swingHigh = Number(rangeInfo.high) || +(base + baseStepMap[pairId].offset * 2.5).toFixed(d);
  const swingLow = Number(rangeInfo.low) || +(base - baseStepMap[pairId].offset * 2.5).toFixed(d);

  const timeframes = ['M5', 'M15', 'H1', 'H4'];
  const generated = [];

  timeframes.forEach((tf) => {
    const scale = tfScaleMap[tf];
    const b = baseStepMap[pairId];
    const zone = b.zone * scale;
    const slDist = b.sl * scale;
    const tp1Dist = b.tp1 * scale;
    const tp2Dist = b.tp2 * scale;
    const tp3Dist = b.tp3 * scale;
    const offset = b.offset * scale;

    // Setup 1 per TF: SMC Liquidity Sweep + FVG/OB (BUY LIMIT di area Discount)
    const buyEntryMax = +(base - offset).toFixed(d);
    const buyEntryMin = +(buyEntryMax - zone).toFixed(d);
    const buySl = +(buyEntryMin - (slDist - zone)).toFixed(d);
    const buySlUnits = Math.max(1, Math.round(Math.abs(buyEntryMax - buySl) * mult));
    const smcConf = tf === 'M15' ? 88 : tf === 'H1' ? 85 : tf === 'M5' ? 78 : 81;

    generated.push({
      id: `${pairId}-${tf.toLowerCase()}-smc`,
      pair: pairId,
      tf: tf,
      method: 'SMC',
      methodLabel: `SMC Liquidity Sweep + Unmitigated FVG (${tf})`,
      direction: 'BUY LIMIT',
      bias: 'Bullish',
      confidence: smcConf,
      entryMin: buyEntryMin,
      entryMax: buyEntryMax,
      sl: buySl,
      slUnits: buySlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(buyEntryMax + tp1Dist).toFixed(d),
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: +(buyEntryMax + tp2Dist).toFixed(d),
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: +(buyEntryMax + tp3Dist).toFixed(d),
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      bestTp:
        tf === 'M5'
          ? `TP 1 (1:1.5) — ${(buyEntryMax + tp1Dist).toFixed(d)}`
          : `TP 2 (1:2) — ${(buyEntryMax + tp2Dist).toFixed(d)}`,
      bestTpReason:
        tf === 'M5'
          ? `Scalping cepat ${tf} pada ${pairId}; amankan partial profit di TP1 + geser SL ke Break Even.`
          : `Retest area Discount FVG ${tf} setelah sapuan likuiditas di dekat Session Low (${swingLow.toFixed(d)}).`,
      session: cfg.primeSession,
      structure: `Sweep Low ${swingLow.toFixed(d)} → Displacement Bullish & CHoCH → Retest Extreme FVG/OB ${tf}.`,
      note: `Wajib geser SL ke BE setelah profit +TP1. Rentang SL ideal ${pairId}: ${cfg.slRange}.`
    });

    // Setup 2 per TF: Fibonacci / Liquidity Reversal (SELL LIMIT di area Premium)
    const isFibo = tf === 'H1' || tf === 'M15';
    const sellEntryMin = +(base + offset).toFixed(d);
    const sellEntryMax = +(sellEntryMin + zone).toFixed(d);
    const sellSl = +(sellEntryMax + (slDist - zone)).toFixed(d);
    const sellSlUnits = Math.max(1, Math.round(Math.abs(sellSl - sellEntryMin) * mult));
    const secConf = tf === 'H1' ? 82 : tf === 'M15' ? 75 : tf === 'M5' ? 68 : 58;

    generated.push({
      id: `${pairId}-${tf.toLowerCase()}-${isFibo ? 'fibo' : 'liq'}`,
      pair: pairId,
      tf: tf,
      method: isFibo ? 'FIBO' : 'LIQ',
      methodLabel: isFibo
        ? `Fibonacci Golden Pocket 0.618–0.786 (${tf})`
        : `Equal Highs Liquidity Sweep (${tf})`,
      direction: 'SELL LIMIT',
      bias: 'Bearish',
      confidence: secConf,
      entryMin: sellEntryMin,
      entryMax: sellEntryMax,
      sl: sellSl,
      slUnits: sellSlUnits,
      unitLabel: cfg.unitLabel,
      tp1: +(sellEntryMin - tp1Dist).toFixed(d),
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: +(sellEntryMin - tp2Dist).toFixed(d),
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: +(sellEntryMin - tp3Dist).toFixed(d),
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      bestTp: `TP 1 (1:1.5) — ${(sellEntryMin - tp1Dist).toFixed(d)}`,
      bestTpReason:
        secConf < 65
          ? `Status masih LOW SIGNAL (Early Alert) — tunggu sweep di atas ${swingHigh.toFixed(d)} & CHoCH M5.`
          : `Area Premium ${isFibo ? 'Golden Pocket 0.705 Fibo' : 'Liquidity Pool'} berhimpitan dengan Supply ${tf}.`,
      session: secConf < 65 ? 'Menunggu Konfirmasi' : cfg.primeSession,
      structure: `Harga menguji area Premium dekat Session High ${swingHigh.toFixed(d)}; pantau rejection & CHoCH M5.`,
      note:
        secConf < 65
          ? 'LOW SIGNAL — Jadikan watchlist saja, dilarang entry sebelum konfirmasi CHoCH M5.'
          : 'Patuhi batas maksimal Entry & SL harian pada akun aktif.'
    });
  });

  return generated;
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
