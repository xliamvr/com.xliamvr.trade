/*!
 * Liamvtrade — ICT/SMC Sniper Engine, Lifecycle State Machine & Risk Guard (v2.5)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// 1. Skema Instrumen Universal (Siap Ekspansi Crypto, Saham US & IDX)
const LIAMV_PAIRS = {
  XAUUSD: {
    id: 'XAUUSD',
    assetClass: 'METAL',
    name: 'XAUUSD (Gold)',
    category: 'Commodity / Metal',
    tvSymbol: 'OANDA:XAUUSD',
    tdSymbol: 'XAU/USD',
    decimals: 2,
    unitLabel: 'pips',
    pipMultiplier: 10,       // $1.00 = 10 pips
    usdPerUnitPerLot: 10,    // 1.00 lot = $10 per pip
    spreadBuffer: 0.25,      // Toleransi spread 2.5 pips
    commissionPerLot: 7.0,   // Estimasi komisi prop firm per 1.00 lot
    defaultPrice: 2712.50,
    weekendActive: false,
    primeSession: 'London (15.30–18.00) & NY (20.30–22.30 WIB)'
  },
  US100: {
    id: 'US100',
    assetClass: 'INDEX',
    name: 'US100 (Nasdaq)',
    category: 'US Index',
    tvSymbol: 'NASDAQ:NDX',
    tdSymbol: 'NDX',
    decimals: 2,
    unitLabel: 'pts',
    pipMultiplier: 1,
    usdPerUnitPerLot: 1,
    spreadBuffer: 1.5,
    commissionPerLot: 2.0,
    defaultPrice: 21180.00,
    weekendActive: false,
    primeSession: 'New York Open (20.30–23.00 WIB)'
  },
  BTCUSDT: {
    id: 'BTCUSDT',
    assetClass: 'CRYPTO',
    name: 'BTCUSDT (Bitcoin)',
    category: 'Crypto 24/7',
    tvSymbol: 'COINBASE:BTCUSD',
    tdSymbol: 'BTC/USD',
    decimals: 2,
    unitLabel: 'pts',
    pipMultiplier: 1,
    usdPerUnitPerLot: 1,
    spreadBuffer: 18.0,
    commissionPerLot: 5.0,
    defaultPrice: 59350.00,
    weekendActive: true,
    primeSession: '24/7 Active • Peak NY (20.00–00.00 WIB)'
  },
  EURUSD: {
    id: 'EURUSD',
    assetClass: 'FOREX',
    name: 'EURUSD (Euro)',
    category: 'Major Forex',
    tvSymbol: 'OANDA:EURUSD',
    tdSymbol: 'EUR/USD',
    decimals: 5,
    unitLabel: 'pips',
    pipMultiplier: 10000,
    usdPerUnitPerLot: 10,
    spreadBuffer: 0.00012,
    commissionPerLot: 7.0,
    defaultPrice: 1.05450,
    weekendActive: false,
    primeSession: 'London (14.00–17.30) & Overlap (19.30–22.00 WIB)'
  }
};

// 2. Roadmap Ekspansi Aset Fase Berikutnya
const LIAMV_ASSET_ROADMAP = [
  { id: 'rm-forex', title: 'Forex Pairs Lengkap', items: 'GBPUSD, USDJPY, GBPJPY, XAGUSD', status: 'Fase Berikutnya' },
  { id: 'rm-crypto', title: 'Crypto & Memecoin Radar', items: 'SOL, ETH, PEPE, WIF, DOGE (DEX & CEX)', status: 'Fase Berikutnya' },
  { id: 'rm-usstock', title: 'Saham US (Wall Street)', items: 'NVDA, TSLA, AAPL, MSFT, META', status: 'Fase Berikutnya' },
  { id: 'rm-idx', title: 'Saham Indonesia (IDX)', items: 'BBCA, BBRI, BMRI, ADRO, BREN', status: 'Fase Berikutnya' }
];

// 3. Katalog Metode Analisis (Termasuk ICT Model)
const LIAMV_METHODS = [
  {
    id: 'AUTO',
    name: 'Auto Sniper (Konfluensi Tertinggi)',
    shortName: 'Auto Sniper'
  },
  {
    id: 'ICT',
    name: 'Metode 01: ICT Model (Killzone + Judas Swing + FVG)',
    shortName: 'ICT Killzone'
  },
  {
    id: 'SMC',
    name: 'Metode 02: SMC (Session Sweep + OB/FVG)',
    shortName: 'SMC Sweep'
  },
  {
    id: 'FIBO',
    name: 'Metode 03: Fibonacci OTE (0.618 – 0.786)',
    shortName: 'Fibo OTE'
  },
  {
    id: 'LIQ',
    name: 'Metode 04: Liquidity Pool Reversal (EQH/EQL)',
    shortName: 'Liquidity Pool'
  }
];

// 4. Batas Kadaluwarsa Pending Order (Menit) Sebelum Auto-Refresh
const TF_EXPIRY_MINUTES = {
  M5: 120,   // 2 jam
  M15: 240,  // 4 jam
  H1: 720,   // 12 jam
  H4: 1440   // 24 jam
};

// 5. Detektor Konteks Waktu ICT Killzone (WIB)
function getIctKillzoneContext() {
  const now = new Date();
  const wib = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
  const day = wib.getDay();
  const decHour = wib.getHours() + wib.getMinutes() / 60;

  if (day === 0 || day === 6) {
    return {
      zoneName: 'Weekend Crypto Window',
      isPrime: true,
      bonusScore: 2,
      note: 'Bursa Forex/Metal tutup; fokus penuh pada struktur likuiditas BTCUSDT.'
    };
  }
  if (decHour >= 21.0 && decHour <= 22.0) {
    return {
      zoneName: 'ICT NY Silver Bullet (21.00–22.00 WIB)',
      isPrime: true,
      bonusScore: 6,
      note: 'Jendela presisi tinggi mencari FVG pertama pasca-pembukaan indeks AS.'
    };
  }
  if (decHour >= 19.5 && decHour <= 22.5) {
    return {
      zoneName: 'ICT New York AM Killzone (19.30–22.30 WIB)',
      isPrime: true,
      bonusScore: 5,
      note: 'Volume puncak harian; cari Judas Swing melawan tren awal lalu MSS.'
    };
  }
  if (decHour >= 14.0 && decHour <= 17.0) {
    return {
      zoneName: 'ICT London Open Killzone (14.00–17.00 WIB)',
      isPrime: true,
      bonusScore: 4,
      note: 'Pembentukan High/Low harian lewat sweep Asia Range.'
    };
  }
  if (decHour >= 7.0 && decHour < 14.0) {
    return {
      zoneName: 'Asia Accumulation (07.00–14.00 WIB)',
      isPrime: false,
      bonusScore: -6,
      note: 'Fase pembentukan pool likuiditas; rawan false breakout sebelum London.'
    };
  }
  return {
    zoneName: 'Inter-Session Transition',
    isPrime: false,
    bonusScore: -2,
    note: 'Transisi antar sesi; tunggu konfirmasi struktur M5 sebelum entry.'
  };
}

// 6. Klasifikasi Confidence Score (% PD)
function getConfidenceMeta(pdScore) {
  if (pdScore >= 80) {
    return {
      tier: 'HIGH SIGNAL',
      badgeClass: 'text-emerald-500 bg-emerald-500/15'
    };
  }
  if (pdScore >= 65) {
    return {
      tier: 'MEDIUM SIGNAL',
      badgeClass: 'text-amber-500 bg-amber-500/15'
    };
  }
  return {
    tier: 'LOW / ASIA FILTER',
    badgeClass: 'text-rose-500 bg-rose-500/15'
  };
}

// 7. Kalkulator Lot Aman (Hard Lot Cap + Half-Risk Drawdown Guard)
function calculateSafeLotDetails(pairId, slUnits, account) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const balance = Number(account?.balance) || 5000;
  const equity = Number(account?.equity) || balance;
  const baseRiskPct = Number(account?.riskPct) || 0.4;
  const maxDailyLossPct = Number(account?.maxDailyLossPct) || 4.0;
  const hardLotCap = Number(account?.maxLotCap) || Math.max(0.1, +(balance / 10000).toFixed(2));

  // Cek apakah drawdown akun sudah melewati 50% batas harian -> aktifkan Half-Risk Recovery
  const drawdownPct = balance > equity ? ((balance - equity) / balance) * 100 : 0;
  const isRecoveryMode = drawdownPct >= maxDailyLossPct * 0.5;
  const effectiveRiskPct = isRecoveryMode ? +(baseRiskPct * 0.5).toFixed(2) : baseRiskPct;

  const riskUsd = balance * (effectiveRiskPct / 100);
  if (slUnits <= 0) {
    return { lot: 0.01, effectiveRiskPct, isRecoveryMode, isCapped: false };
  }

  const rawLot = riskUsd / (slUnits * cfg.usdPerUnitPerLot);
  const isCapped = rawLot > hardLotCap;
  const finalLot = Math.max(0.01, +Math.min(rawLot, hardLotCap).toFixed(2));

  return {
    lot: finalLot,
    effectiveRiskPct,
    isRecoveryMode,
    isCapped
  };
}

// 8. Kalkulator Split-Lot PnL Realistis (Partial TP1 50%, TP2 30%, TP3 20%)
function calculateSplitUsdPnl(pairId, sig, lotSize) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const lot = Math.max(0.01, Number(lotSize) || 0.01);
  const commission = +(cfg.commissionPerLot * lot).toFixed(2);
  let grossUnits = 0;

  if (sig.status === 'TP3 HIT') {
    grossUnits = sig.tp1Units * 0.5 + sig.tp2Units * 0.3 + sig.tp3Units * 0.2;
  } else if (sig.status === 'TP2 HIT') {
    grossUnits = sig.tp1Units * 0.5 + sig.tp2Units * 0.5;
  } else if (sig.status === 'TP1 HIT' || sig.status === 'BREAK EVEN') {
    grossUnits = sig.tp1Reached ? sig.tp1Units * 0.5 : 0;
  } else if (sig.status === 'SL HIT') {
    grossUnits = -sig.slUnits;
  } else {
    grossUnits = Number(sig.resultUnits) || 0;
  }

  const netUsd = grossUnits * cfg.usdPerUnitPerLot * lot - (grossUnits !== 0 ? commission : 0);
  return +netUsd.toFixed(2);
}

// 9. Generator 1 SNIPER SETUP TERKUNCI + SWEET-SPOT LIMIT PRICE
function buildLockedSniperSetup(pairId, tf, methodId, currentPrice, marketRanges = {}, forceSide = null) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const base = Number(currentPrice) || cfg.defaultPrice;
  const d = cfg.decimals;
  const mult = cfg.pipMultiplier;
  const kz = getIctKillzoneContext();

  const baseStepMap = {
    XAUUSD: { zone: 1.6, sl: 3.0, tp1: 4.5, tp2: 6.5, tp3: 9.5, offset: 1.6 },
    US100: { zone: 14.0, sl: 22.0, tp1: 35.0, tp2: 52.0, tp3: 78.0, offset: 14.0 },
    BTCUSDT: { zone: 140.0, sl: 240.0, tp1: 380.0, tp2: 550.0, tp3: 820.0, offset: 150.0 },
    EURUSD: { zone: 0.0008, sl: 0.0012, tp1: 0.0018, tp2: 0.0026, tp3: 0.0038, offset: 0.0008 }
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
  const swingHigh = Number(rangeInfo.high) || +(base + b.offset * 2.6).toFixed(d);
  const swingLow = Number(rangeInfo.low) || +(base - b.offset * 2.6).toFixed(d);
  const midRange = (swingHigh + swingLow) / 2;

  const isBuy = forceSide ? forceSide === 'BUY' : base <= midRange;
  const chosenMethod =
    methodId === 'AUTO'
      ? kz.isPrime
        ? 'ICT'
        : tf === 'H1'
        ? 'FIBO'
        : 'SMC'
      : methodId;

  const methodTitleMap = {
    ICT: isBuy
      ? `ICT Judas Swing + Bullish MSS/FVG (${tf})`
      : `ICT Judas Swing + Bearish MSS/FVG (${tf})`,
    SMC: isBuy
      ? `SMC Liquidity Sweep + Discount FVG (${tf})`
      : `SMC Supply Sweep + Premium OB (${tf})`,
    FIBO: `Fibonacci Golden Pocket 0.705 OTE (${tf})`,
    LIQ: isBuy
      ? `Equal Lows Liquidity Pool Reversal (${tf})`
      : `Equal Highs Liquidity Pool Reversal (${tf})`
  };

  const rawConf = (tf === 'M15' ? 84 : tf === 'H1' ? 82 : tf === 'M5' ? 76 : 80) + kz.bonusScore;
  const confidence = Math.max(58, Math.min(94, rawConf));
  const nowMs = Date.now();
  const maxWaitMins = TF_EXPIRY_MINUTES[tf] || 240;

  if (isBuy) {
    const entryMax = +(base - offset).toFixed(d);
    const entryMin = +(entryMax - zone).toFixed(d);
    // Sweet-Spot Limit: 38.2% front-run POI untuk SMC/ICT, 0.705 OTE untuk Fibo
    const depthRatio = chosenMethod === 'FIBO' ? 0.65 : 0.382;
    const limitPrice = +(entryMax - zone * depthRatio).toFixed(d);
    const sl = +(entryMin - (slDist - zone)).toFixed(d);
    const slUnits = Math.max(1, Math.round(Math.abs(limitPrice - sl) * mult));
    const tp1 = +(limitPrice + tp1Dist).toFixed(d);
    const tp2 = +(limitPrice + tp2Dist).toFixed(d);
    const tp3 = +(limitPrice + tp3Dist).toFixed(d);

    return {
      id: `sig-${nowMs}`,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + maxWaitMins * 60000).toISOString(),
      filledAt: null,
      closedAt: null,
      pair: pairId,
      assetClass: cfg.assetClass,
      tf: tf,
      method: chosenMethod,
      methodLabel: methodTitleMap[chosenMethod],
      killzoneLabel: kz.zoneName,
      direction: 'BUY LIMIT',
      side: 'BUY',
      bias: 'Bullish',
      confidence: confidence,
      entryMin: entryMin,
      entryMax: entryMax,
      limitPrice: limitPrice,
      entryPrice: limitPrice,
      sl: sl,
      initialSl: sl,
      slUnits: slUnits,
      tp1: tp1,
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: tp2,
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: tp3,
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      unitLabel: cfg.unitLabel,
      status: 'WAITING', // WAITING -> RUNNING -> TP1/TP2/TP3/BE/SL/EXPIRED/FLIPPED/INVALIDATED
      tp1Reached: false,
      tp2Reached: false,
      resultUnits: 0,
      structure:
        chosenMethod === 'ICT'
          ? `${kz.zoneName}: Judas Swing menyapu Low ${swingLow.toFixed(d)} → MSS Bullish → Pasang Limit di FVG CE.`
          : `Sweep Low dekat ${swingLow.toFixed(d)} → Displacement Bullish & CHoCH → Pasang Limit di Sweet-Spot POI ${tf}.`,
      takenByUser: false,
      takenAccountId: null,
      takenAccountName: null,
      takenLot: 0
    };
  } else {
    const entryMin = +(base + offset).toFixed(d);
    const entryMax = +(entryMin + zone).toFixed(d);
    const depthRatio = chosenMethod === 'FIBO' ? 0.65 : 0.382;
    const limitPrice = +(entryMin + zone * depthRatio).toFixed(d);
    const sl = +(entryMax + (slDist - zone)).toFixed(d);
    const slUnits = Math.max(1, Math.round(Math.abs(sl - limitPrice) * mult));
    const tp1 = +(limitPrice - tp1Dist).toFixed(d);
    const tp2 = +(limitPrice - tp2Dist).toFixed(d);
    const tp3 = +(limitPrice - tp3Dist).toFixed(d);

    return {
      id: `sig-${nowMs}`,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + maxWaitMins * 60000).toISOString(),
      filledAt: null,
      closedAt: null,
      pair: pairId,
      assetClass: cfg.assetClass,
      tf: tf,
      method: chosenMethod,
      methodLabel: methodTitleMap[chosenMethod],
      killzoneLabel: kz.zoneName,
      direction: 'SELL LIMIT',
      side: 'SELL',
      bias: 'Bearish',
      confidence: confidence,
      entryMin: entryMin,
      entryMax: entryMax,
      limitPrice: limitPrice,
      entryPrice: limitPrice,
      sl: sl,
      initialSl: sl,
      slUnits: slUnits,
      tp1: tp1,
      tp1Units: Math.max(1, Math.round(tp1Dist * mult)),
      tp2: tp2,
      tp2Units: Math.max(1, Math.round(tp2Dist * mult)),
      tp3: tp3,
      tp3Units: Math.max(1, Math.round(tp3Dist * mult)),
      unitLabel: cfg.unitLabel,
      status: 'WAITING',
      tp1Reached: false,
      tp2Reached: false,
      resultUnits: 0,
      structure:
        chosenMethod === 'ICT'
          ? `${kz.zoneName}: Judas Swing menyapu High ${swingHigh.toFixed(d)} → MSS Bearish → Pasang Limit di FVG CE.`
          : `Sweep High dekat ${swingHigh.toFixed(d)} → Displacement Bearish & CHoCH → Pasang Limit di Sweet-Spot POI ${tf}.`,
      takenByUser: false,
      takenAccountId: null,
      takenAccountName: null,
      takenLot: 0
    };
  }
}

// 10. Mesin Evaluasi Siklus Hidup Setup (WAITING vs RUNNING + Auto-Flip)
function evaluateSetupLifecycle(sig, currentPrice, marketRanges = {}, isWeekend = false) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const price = Number(currentPrice);
  if (!price || !sig) return { action: 'NONE' };

  const isBuy = sig.side === 'BUY';
  const buf = cfg.spreadBuffer || 0;

  // FASE A: PENDING ORDER BELUM KESENTUH (WAITING)
  if (sig.status === 'WAITING') {
    // 1. Cek apakah harga menembus SL sebelum sempat masuk limit (Struktur Invalid)
    if ((isBuy && price <= sig.sl) || (!isBuy && price >= sig.sl)) {
      return {
        action: 'REPLACE',
        archiveStatus: 'INVALIDATED',
        signedUnits: 0,
        flipSide: null,
        bannerMsg: `Setup sebelumnya ${sig.direction} ${sig.limitPrice.toFixed(d)} dibatalkan karena area POI jebol sebelum tersentuh — diperbarui ke struktur baru.`
      };
    }

    // 2. Cek apakah harga lari ke TP1 atau masuk ekstrem zona lawan (>75% range) tanpa menjemput limit
    const rng = marketRanges[sig.pair] || {};
    const hi = Number(rng.high) || 0;
    const lo = Number(rng.low) || 0;
    const span = hi - lo;

    const ranToTarget = (isBuy && price >= sig.tp1) || (!isBuy && price <= sig.tp1);
    const shiftedToOppositeExtreme =
      span > 0 &&
      ((isBuy && price >= lo + span * 0.78) || (!isBuy && price <= hi - span * 0.78));

    if (ranToTarget || shiftedToOppositeExtreme) {
      const nextSide = isBuy ? 'SELL' : 'BUY';
      return {
        action: 'REPLACE',
        archiveStatus: 'MISSED / FLIPPED',
        signedUnits: 0,
        flipSide: nextSide,
        bannerMsg: `Setup sebelumnya ${sig.direction} ${sig.limitPrice.toFixed(d)} kadaluwarsa karena harga lari ke zona ${
          isBuy ? 'atas' : 'bawah'
        } — otomatis dialihkan ke ${nextSide} LIMIT baru.`
      };
    }

    // 3. Cek batas waktu kadaluwarsa (dibekukan saat weekend jika bukan Crypto)
    const weekendFrozen = isWeekend && !cfg.weekendActive;
    if (!weekendFrozen && sig.expiresAt && Date.now() >= new Date(sig.expiresAt).getTime()) {
      return {
        action: 'REPLACE',
        archiveStatus: 'EXPIRED',
        signedUnits: 0,
        flipSide: null,
        bannerMsg: `Setup sebelumnya ${sig.direction} ${sig.limitPrice.toFixed(d)} kadaluwarsa melewati batas waktu ${sig.tf} — diganti setup segar.`
      };
    }

    // 4. Cek apakah harga menyentuh Sweet-Spot Limit Price (+ toleransi spread) -> Masuk RUNNING!
    const touchedLimit = isBuy
      ? price <= sig.limitPrice + buf && price > sig.sl
      : price >= sig.limitPrice - buf && price < sig.sl;

    if (touchedLimit) {
      return {
        action: 'FILL_RUNNING',
        filledAt: new Date().toISOString()
      };
    }

    return { action: 'NONE' };
  }

  // FASE B: ORDER SUDAH AKTIF BERJALAN (RUNNING)
  if (sig.status === 'RUNNING') {
    if (isBuy) {
      if (price >= sig.tp3) {
        return { action: 'FINALIZE', finalStatus: 'TP3 HIT', signedUnits: sig.tp3Units };
      }
      if (price >= sig.tp2 && !sig.tp2Reached) {
        return { action: 'TRAIL_TP2', newSl: sig.tp1 };
      }
      if (price >= sig.tp1 && !sig.tp1Reached) {
        return { action: 'TRAIL_TP1', newSl: sig.limitPrice };
      }
      if (price <= sig.sl) {
        if (sig.tp2Reached) {
          return { action: 'FINALIZE', finalStatus: 'TP2 HIT', signedUnits: sig.tp2Units };
        }
        if (sig.tp1Reached) {
          return { action: 'FINALIZE', finalStatus: 'BREAK EVEN', signedUnits: 0 };
        }
        return { action: 'FINALIZE', finalStatus: 'SL HIT', signedUnits: -sig.slUnits };
      }
    } else {
      if (price <= sig.tp3) {
        return { action: 'FINALIZE', finalStatus: 'TP3 HIT', signedUnits: sig.tp3Units };
      }
      if (price <= sig.tp2 && !sig.tp2Reached) {
        return { action: 'TRAIL_TP2', newSl: sig.tp1 };
      }
      if (price <= sig.tp1 && !sig.tp1Reached) {
        return { action: 'TRAIL_TP1', newSl: sig.limitPrice };
      }
      if (price >= sig.sl) {
        if (sig.tp2Reached) {
          return { action: 'FINALIZE', finalStatus: 'TP2 HIT', signedUnits: sig.tp2Units };
        }
        if (sig.tp1Reached) {
          return { action: 'FINALIZE', finalStatus: 'BREAK EVEN', signedUnits: 0 };
        }
        return { action: 'FINALIZE', finalStatus: 'SL HIT', signedUnits: -sig.slUnits };
      }
    }
  }

  return { action: 'NONE' };
}

// 11. Penjelasan Edukasi Pips & Evaluasi Hasil Trade
function explainSignalEducation(sig) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const u = sig.unitLabel;
  const rr2 = (sig.tp2Units / Math.max(1, sig.slUnits)).toFixed(1);

  let outcomeInsight = '';
  if (sig.status === 'TP1 HIT') {
    outcomeInsight = `Target pertama tercapai (+${sig.tp1Units} ${u}). 50% posisi diamankan dan SL digeser ke Break Even (BE).`;
  } else if (sig.status === 'TP2 HIT') {
    outcomeInsight = `Target utama intraday tercapai di TP2 (+${sig.tp2Units} ${u}) dengan rasio RR 1:${rr2}. Trailing SL mengunci profit di TP1.`;
  } else if (sig.status === 'TP3 HIT') {
    outcomeInsight = `Ekspansi penuh menyapu likuiditas ekstrem hingga TP3 (+${sig.tp3Units} ${u}).`;
  } else if (sig.status === 'BREAK EVEN') {
    outcomeInsight = `Harga sempat menyentuh TP1 (+${sig.tp1Units} ${u}) lalu berbalik ke titik BE (0 ${u}). Modal aman 100% dan partial TP1 tetap tercatat profit.`;
  } else if (sig.status === 'SL HIT') {
    outcomeInsight = `Harga menembus batas invalidasi SL (-${sig.slUnits} ${u}). Evaluasi: cek apakah terjadi rilis berita USD mendadak atau sweep lanjutan.`;
  } else if (sig.status === 'MISSED / FLIPPED' || sig.status === 'EXPIRED' || sig.status === 'INVALIDATED') {
    outcomeInsight = `Pending order belum sempat tersentuh (${sig.status}), sehingga tidak memotong saldo maupun winrate akunmu.`;
  } else {
    outcomeInsight = `Risiko terukur ${sig.slUnits} ${u} melawan potensi target +${sig.tp1Units} / +${sig.tp2Units} / +${sig.tp3Units} ${u}.`;
  }

  return {
    riskSummary: `Limit: ${Number(sig.limitPrice || sig.entryPrice).toFixed(d)} | SL: ${sig.slUnits} ${u} | Target: TP1 +${sig.tp1Units} | TP2 +${sig.tp2Units} | TP3 +${sig.tp3Units} ${u}`,
    outcomeInsight: outcomeInsight
  };
}

// 12. Formatter Output Standar SMC/ICT (Clipboard & Auto-Telegram)
function formatStandardSmcSignal(sig, lotSize, accountLabel) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  const meta = getConfidenceMeta(sig.confidence);

  return `${sig.pair} | 🔵 ${sig.direction} 🔵 [${sig.status}]

🎯 PASANG LIMIT : ${Number(sig.limitPrice || sig.entryPrice).toFixed(d)}
🟡 ZONA POI     : ${sig.entryMin.toFixed(d)} - ${sig.entryMax.toFixed(d)}
❌ STOP LOSS    : ${sig.sl.toFixed(d)} (${sig.slUnits} ${sig.unitLabel})
✅ TARGET TP 1  : ${sig.tp1.toFixed(d)} (${sig.tp1Units} ${sig.unitLabel}) — Set BE
✅ TARGET TP 2  : ${sig.tp2.toFixed(d)} (${sig.tp2Units} ${sig.unitLabel}) — Trailing TP1
✅ TARGET TP 3  : ${sig.tp3.toFixed(d)} (${sig.tp3Units} ${sig.unitLabel}) — Extreme

🕒 Killzone / Sesi : ${sig.killzoneLabel || cfg.primeSession}
🎯 Metode Setup    : ${sig.methodLabel} [${meta.tier} • ${sig.confidence}% PD]
💼 Akun & Lot      : ${accountLabel} (${lotSize.toFixed(2)} lot)
📌 Alasan Struktur  : ${sig.structure}`;
}
