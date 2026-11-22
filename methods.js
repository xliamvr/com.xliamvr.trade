/*!
 * Liamvtrade — Multi-Strategy ICT / SMC / Fibo / Liquidity Engine v2.6
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const LIAMV_METHODS = [
  {
    id: 'AUTO',
    code: 'AUTO',
    name: 'Auto Sniper (Konfluensi Tertinggi)',
    shortName: 'Auto Sniper',
    badge: 'REKOMENDASI',
    sessionFit: 'Semua Sesi & Killzone',
    desc: 'Memilih otomatis metode dengan probabilitas tertinggi berdasarkan Killzone WIB & struktur candle aktif.'
  },
  {
    id: 'ICT',
    code: 'M-01',
    name: 'Metode 01: ICT Model (Killzone + Judas Swing)',
    shortName: 'ICT Model',
    badge: 'TERBAIK M15',
    sessionFit: 'London (14-17) & NY (19.30-22.30)',
    desc: 'Menunggu sapuan likuiditas sesi sebelumnya (Judas Swing), Market Structure Shift (MSS), dan entry di FVG CE.'
  },
  {
    id: 'SMC',
    code: 'M-02',
    name: 'Metode 02: SMC (Order Block + FVG)',
    shortName: 'SMC OB/FVG',
    badge: 'PRESISI POI',
    sessionFit: 'London & NY Overlap',
    desc: 'Membidik area Supply/Demand Order Block ekstrem setelah Break of Structure (BOS) terkonfirmasi.'
  },
  {
    id: 'FIBO',
    code: 'M-03',
    name: 'Metode 03: Fibonacci OTE (0.618 – 0.786)',
    shortName: 'Fibonacci OTE',
    badge: 'TERBAIK H1',
    sessionFit: 'Intraday Swing H1 / M15',
    desc: 'Mengunci Sweet-Spot retracement institusi di level Golden Pocket 0.705 OTE dengan rasio R:R tinggi.'
  },
  {
    id: 'LIQ',
    code: 'M-04',
    name: 'Metode 04: Liquidity Pool Reversal (EQH/EQL)',
    shortName: 'Liquidity Sweep',
    badge: 'TERBAIK BTC',
    sessionFit: 'NY Open & Weekend Crypto',
    desc: 'Berburu pembalikan arah setelah harga menyapu Equal Highs (BSL) atau Equal Lows (SSL) secara tajam.'
  }
];

const LIAMV_PAIRS = {
  XAUUSD: {
    id: 'XAUUSD',
    label: 'XAUUSD',
    decimals: 2,
    pipSize: 0.1,
    spreadBuffer: 0.30,
    unitLabel: 'pips',
    usdPerUnitPerLot: 10.0,
    weekendActive: false,
    tfConfig: {
      M5:  { slUnits: 22, tp1Units: 33, tp2Units: 48, tp3Units: 70, expiryMins: 75 },
      M15: { slUnits: 30, tp1Units: 45, tp2Units: 68, tp3Units: 98, expiryMins: 180 },
      H1:  { slUnits: 48, tp1Units: 72, tp2Units: 110, tp3Units: 160, expiryMins: 480 },
      H4:  { slUnits: 80, tp1Units: 120, tp2Units: 185, tp3Units: 260, expiryMins: 1440 }
    }
  },
  US100: {
    id: 'US100',
    label: 'US100',
    decimals: 2,
    pipSize: 1.0,
    spreadBuffer: 2.0,
    unitLabel: 'pts',
    usdPerUnitPerLot: 1.0,
    weekendActive: false,
    tfConfig: {
      M5:  { slUnits: 18, tp1Units: 27, tp2Units: 40, tp3Units: 58, expiryMins: 75 },
      M15: { slUnits: 25, tp1Units: 38, tp2Units: 56, tp3Units: 82, expiryMins: 180 },
      H1:  { slUnits: 42, tp1Units: 64, tp2Units: 95, tp3Units: 140, expiryMins: 480 },
      H4:  { slUnits: 72, tp1Units: 110, tp2Units: 165, tp3Units: 240, expiryMins: 1440 }
    }
  },
  BTCUSDT: {
    id: 'BTCUSDT',
    label: 'BTCUSDT',
    decimals: 2,
    pipSize: 1.0,
    spreadBuffer: 25.0,
    unitLabel: 'pts',
    usdPerUnitPerLot: 1.0,
    weekendActive: true,
    tfConfig: {
      M5:  { slUnits: 360, tp1Units: 540, tp2Units: 780, tp3Units: 1100, expiryMins: 90 },
      M15: { slUnits: 480, tp1Units: 720, tp2Units: 1050, tp3Units: 1500, expiryMins: 240 },
      H1:  { slUnits: 580, tp1Units: 880, tp2Units: 1300, tp3Units: 1850, expiryMins: 600 },
      H4:  { slUnits: 850, tp1Units: 1280, tp2Units: 1900, tp3Units: 2700, expiryMins: 1440 }
    }
  },
  EURUSD: {
    id: 'EURUSD',
    label: 'EURUSD',
    decimals: 5,
    pipSize: 0.0001,
    spreadBuffer: 0.00015,
    unitLabel: 'pips',
    usdPerUnitPerLot: 10.0,
    weekendActive: false,
    tfConfig: {
      M5:  { slUnits: 9,  tp1Units: 14, tp2Units: 21, tp3Units: 30, expiryMins: 75 },
      M15: { slUnits: 13, tp1Units: 20, tp2Units: 30, tp3Units: 44, expiryMins: 180 },
      H1:  { slUnits: 22, tp1Units: 33, tp2Units: 50, tp3Units: 72, expiryMins: 480 },
      H4:  { slUnits: 36, tp1Units: 54, tp2Units: 82, tp3Units: 120, expiryMins: 1440 }
    }
  }
};

const LIAMV_ASSET_ROADMAP = [
  {
    title: 'Forex Pairs Lengkap',
    items: 'GBPUSD, USDJPY, GBPJPY, XAGUSD',
    status: 'Fase Berikutnya'
  },
  {
    title: 'Crypto & Memecoin Radar',
    items: 'SOL, ETH, PEPE, WIF, DOGE (DEX & CEX)',
    status: 'Fase Berikutnya'
  },
  {
    title: 'Saham US (Wall Street)',
    items: 'NVDA, TSLA, AAPL, MSFT, META',
    status: 'Fase Berikutnya'
  },
  {
    title: 'Saham Indonesia (IDX)',
    items: 'BBCA, BBRI, BMRI, ADRO, BREN',
    status: 'Fase Berikutnya'
  }
];

function getWibContext() {
  const now = new Date();
  const wib = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
  const day = wib.getDay(); // 0=Min, 1=Sen, ..., 6=Sab
  const decHour = wib.getHours() + wib.getMinutes() / 60;
  const isWeekend = day === 0 || day === 6;
  const isMonday = day === 1;

  if (isWeekend) {
    return {
      isWeekend: true,
      isMonday: false,
      isPrime: false,
      name: 'Weekend Crypto Window (BTC 24/7)',
      recommendedMethod: 'LIQ',
      confidenceBoost: 2
    };
  }
  if (decHour >= 14.0 && decHour < 17.0) {
    return {
      isWeekend: false,
      isMonday,
      isPrime: true,
      name: 'ICT London Open Killzone (14.00–17.00 WIB)',
      recommendedMethod: 'ICT',
      confidenceBoost: 7
    };
  }
  if (decHour >= 19.5 && decHour < 22.5) {
    return {
      isWeekend: false,
      isMonday,
      isPrime: true,
      name: 'ICT New York AM Killzone (19.30–22.30 WIB)',
      recommendedMethod: 'ICT',
      confidenceBoost: 9
    };
  }
  if (decHour >= 7.0 && decHour < 14.0) {
    return {
      isWeekend: false,
      isMonday,
      isPrime: false,
      name: 'Sesi Asia Range (Wait Liquidity Sweep)',
      recommendedMethod: 'SMC',
      confidenceBoost: -4
    };
  }
  return {
    isWeekend: false,
    isMonday,
    isPrime: false,
    name: 'Transisi Sesi / Observasi Struktur',
    recommendedMethod: 'FIBO',
    confidenceBoost: 0
  };
}

function getIctKillzoneContext() {
  return getWibContext();
}

function getConfidenceMeta(score) {
  if (score >= 82) {
    return {
      tier: 'HIGH SIGNAL',
      badgeClass: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
      isHigh: true
    };
  }
  if (score >= 74) {
    return {
      tier: 'MODERATE',
      badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
      isHigh: false
    };
  }
  return {
    tier: 'OBSERVE',
    badgeClass: 'bg-slate-500/15 opacity-80 border border-slate-400/30',
    isHigh: false
  };
}

/**
 * Menghitung ukuran lot aman beserta estimasi dolar risiko SL & profit TP1/TP2/TP3
 */
function calculateSafeLotDetails(pairId, slUnits, account, customSlUnits = null) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const activeSlUnits = Math.max(1, Number(customSlUnits || slUnits) || 20);
  const balance = Math.max(50, Number(account?.balance) || 1000);
  const equity = Math.max(50, Number(account?.equity) || balance);
  const baseRiskPct = Math.max(0.1, Number(account?.riskPct) || 0.4);
  const maxLotCap = Math.max(0.01, Number(account?.maxLotCap) || +(balance / 10000).toFixed(2));

  // Drawdown Guard: jika ekuitas turun di bawah 97% modal awal, otomatis potong risiko setengah
  const isRecoveryMode = equity < balance * 0.97;
  const effectiveRiskPct = isRecoveryMode ? +(baseRiskPct * 0.5).toFixed(2) : baseRiskPct;
  const targetRiskUsd = balance * (effectiveRiskPct / 100);

  const rawLot = targetRiskUsd / (activeSlUnits * cfg.usdPerUnitPerLot);
  const isCapped = rawLot > maxLotCap;
  const finalLot = Math.max(0.01, Math.min(maxLotCap, +rawLot.toFixed(2)));

  const actualRiskUsd = +(finalLot * activeSlUnits * cfg.usdPerUnitPerLot).toFixed(2);
  const tfCfg = cfg.tfConfig.M15;
  const estTp2Usd = +(finalLot * (tfCfg.tp2Units * 0.85) * cfg.usdPerUnitPerLot).toFixed(2);

  return {
    lot: finalLot,
    isRecoveryMode,
    isCapped,
    effectiveRiskPct,
    actualRiskUsd,
    estTp2Usd
  };
}

/**
 * Membangun 1 setup Sniper terkunci dengan Sweet-Spot Limit + Spread Buffer + Real Swing Range
 */
function buildLockedSniperSetup(pairId, tf, selectedMethod, livePrice, marketRanges, forceSide = null, flipCount = 0) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const tfCfg = cfg.tfConfig[tf] || cfg.tfConfig.M15;
  const d = cfg.decimals;
  const pip = cfg.pipSize;
  const buf = cfg.spreadBuffer;
  const kz = getWibContext();

  const current = Number(livePrice) || 2712.50;
  const rng = marketRanges?.[pairId] || {
    high: current + tfCfg.slUnits * pip * 1.4,
    low: current - tfCfg.slUnits * pip * 1.4
  };

  const span = Math.max(tfCfg.slUnits * pip * 1.5, rng.high - rng.low);
  const midRange = rng.low + span * 0.5;
  const posRatio = Math.max(0, Math.min(1, (current - rng.low) / span));

  // Tentukan arah berdasarkan Premium/Discount nyata (di bawah 50% = Discount/BUY, di atas 50% = Premium/SELL)
  let side = forceSide;
  if (!side) {
    side = posRatio <= 0.50 ? 'BUY' : 'SELL';
  }

  // Tentukan metode aktif
  const methodId = selectedMethod === 'AUTO' ? kz.recommendedMethod : selectedMethod;
  const methodObj = LIAMV_METHODS.find((m) => m.id === methodId) || LIAMV_METHODS[1];

  // Jarak pullback ke zona POI (FVG / OB / OTE)
  const pullbackDist = tfCfg.slUnits * pip * 0.55;
  const zoneHalfWidth = tfCfg.slUnits * pip * 0.22;

  let limitPrice, entryMin, entryMax, sl, tp1, tp2, tp3, structureText;

  if (side === 'BUY') {
    const rawLimit = current - pullbackDist;
    limitPrice = +(rawLimit + buf).toFixed(d); // Tambah spread buffer Ask agar limit mudah tersentuh
    entryMin = +(rawLimit - zoneHalfWidth).toFixed(d);
    entryMax = +(rawLimit + zoneHalfWidth).toFixed(d);
    sl = +(limitPrice - tfCfg.slUnits * pip).toFixed(d);
    tp1 = +(limitPrice + tfCfg.tp1Units * pip).toFixed(d);
    tp2 = +(limitPrice + tfCfg.tp2Units * pip).toFixed(d);
    tp3 = +(limitPrice + tfCfg.tp3Units * pip).toFixed(d);
    structureText =
      methodId === 'ICT'
        ? `Discount Zone (${Math.round(posRatio * 100)}% range) + Judas Swing sweep Low ${rng.low.toFixed(d)} → MSS Bullish, limit di FVG CE (+spread buffer).`
        : methodId === 'FIBO'
        ? `Retracement ke Golden Pocket 0.705 OTE di atas Demand ${rng.low.toFixed(d)} dengan invalidasi di bawah swing low.`
        : methodId === 'LIQ'
        ? `Sapuan Sell-Side Liquidity (EQL) di ${rng.low.toFixed(d)} diikuti rejection volume beli institusi.`
        : `Bullish Break of Structure + mitigasi Demand Order Block di area ${entryMin.toFixed(d)}–${entryMax.toFixed(d)}.`;
  } else {
    const rawLimit = current + pullbackDist;
    limitPrice = +(rawLimit - buf).toFixed(d);
    entryMin = +(rawLimit - zoneHalfWidth).toFixed(d);
    entryMax = +(rawLimit + zoneHalfWidth).toFixed(d);
    sl = +(limitPrice + tfCfg.slUnits * pip + buf).toFixed(d); // Tambah buffer Ask pada SL Sell
    tp1 = +(limitPrice - tfCfg.tp1Units * pip).toFixed(d);
    tp2 = +(limitPrice - tfCfg.tp2Units * pip).toFixed(d);
    tp3 = +(limitPrice - tfCfg.tp3Units * pip).toFixed(d);
    structureText =
      methodId === 'ICT'
        ? `Premium Zone (${Math.round(posRatio * 100)}% range) + Judas Swing sweep High ${rng.high.toFixed(d)} → MSS Bearish, limit di Bearish FVG CE.`
        : methodId === 'FIBO'
        ? `Pullback ke Golden Pocket 0.705 OTE di bawah Supply ${rng.high.toFixed(d)} dengan target ekstensi likuiditas bawah.`
        : methodId === 'LIQ'
        ? `Sapuan Buy-Side Liquidity (EQH) di ${rng.high.toFixed(d)} diikuti ekspansi turun tajam.`
        : `Bearish Break of Structure + mitigasi Supply Order Block di area ${entryMin.toFixed(d)}–${entryMax.toFixed(d)}.`;
  }

  // Hitung skor probabilitas (PD Score)
  const extremeBonus = Math.round(Math.abs(posRatio - 0.5) * 24);
  const tfBonus = tf === 'M15' || tf === 'H1' ? 5 : tf === 'H4' ? 3 : -4;
  const mondayPenalty = kz.isMonday ? -3 : 0;
  const rawConf = 74 + extremeBonus + kz.confidenceBoost + tfBonus + mondayPenalty;
  const confidence = Math.max(68, Math.min(94, rawConf));

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + tfCfg.expiryMins * 60000).toISOString();

  return {
    id: `sig-${pairId}-${tf}-${Date.now()}`,
    createdAt,
    expiresAt,
    pair: pairId,
    tf,
    method: methodId,
    methodName: methodObj.shortName,
    methodLabel: `${methodObj.shortName} (${tf})`,
    killzoneLabel: kz.name,
    isMondayWarning: kz.isMonday && !kz.isWeekend,
    direction: `${side} LIMIT`,
    side,
    bias: side === 'BUY' ? 'Bullish' : 'Bearish',
    confidence,
    entryMin,
    entryMax,
    limitPrice,
    entryPrice: limitPrice,
    sl,
    slUnits: tfCfg.slUnits,
    tp1,
    tp1Units: tfCfg.tp1Units,
    tp2,
    tp2Units: tfCfg.tp2Units,
    tp3,
    tp3Units: tfCfg.tp3Units,
    unitLabel: cfg.unitLabel,
    status: 'WAITING',
    tp1Reached: false,
    tp2Reached: false,
    flipCount,
    takenByUser: false,
    structure: structureText
  };
}

/**
 * Mengevaluasi siklus hidup sinyal: WAITING -> RUNNING -> TP1 (BE) -> TP2 (Trail) -> TP3 / SL / EXPIRED / FLIP
 */
function evaluateSetupLifecycle(sig, currentPrice, marketRanges, isWeekend) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const isBuy = sig.side === 'BUY';
  const nowMs = Date.now();

  if (sig.status === 'WAITING') {
    // Bekukan timer saat weekend untuk market Forex/Index/Gold
    if (isWeekend && !cfg.weekendActive) {
      return { action: 'HOLD' };
    }

    // 1. Cek apakah harga menyentuh Sweet-Spot Limit
    const touchedLimit = isBuy ? currentPrice <= sig.limitPrice : currentPrice >= sig.limitPrice;
    if (touchedLimit) {
      return {
        action: 'FILL_RUNNING',
        filledAt: new Date().toISOString()
      };
    }

    // 2. Cek apakah harga lari menjauh melewati TP1 sebelum jemput limit (Auto-Flip maksimal 1x per sesi)
    const ranAwayPastTp1 = isBuy ? currentPrice >= sig.tp1 : currentPrice <= sig.tp1;
    if (ranAwayPastTp1) {
      const canFlip = (sig.flipCount || 0) < 1;
      return {
        action: 'REPLACE',
        archiveStatus: 'MISSED / FLIPPED',
        flipSide: canFlip ? (isBuy ? 'SELL' : 'BUY') : null,
        flipCount: (sig.flipCount || 0) + 1,
        bannerMsg: canFlip
          ? `Setup ${sig.pair} ${sig.direction} sebelumnya melewatkan limit dan menembus TP1. Arah dialihkan (1x Auto-Flip) ke zona struktur baru.`
          : `Setup ${sig.pair} melewatkan limit (batas 1x Auto-Flip sesi tercapai). Setup baru diselaraskan ulang.`
      };
    }

    // 3. Cek kadaluwarsa waktu
    if (sig.expiresAt && nowMs >= new Date(sig.expiresAt).getTime()) {
      return {
        action: 'REPLACE',
        archiveStatus: 'INVALIDATED',
        flipSide: null,
        flipCount: sig.flipCount || 0,
        bannerMsg: `Setup ${sig.pair} ${sig.direction} melewati batas waktu tunggu tanpa menyentuh limit (Invalidated).`
      };
    }

    return { action: 'HOLD' };
  }

  if (sig.status === 'RUNNING') {
    // Cek TP3 (Full Runner)
    if ((isBuy && currentPrice >= sig.tp3) || (!isBuy && currentPrice <= sig.tp3)) {
      return { action: 'FINALIZE', finalStatus: 'TP3 HIT', signedUnits: sig.tp3Units };
    }

    // Cek TP2 -> Geser Trailing SL ke TP1
    if (!sig.tp2Reached && ((isBuy && currentPrice >= sig.tp2) || (!isBuy && currentPrice <= sig.tp2))) {
      return { action: 'TRAIL_TP2', newSl: sig.tp1 };
    }

    // Cek TP1 -> Geser SL ke Break Even (Limit Price)
    if (!sig.tp1Reached && ((isBuy && currentPrice >= sig.tp1) || (!isBuy && currentPrice <= sig.tp1))) {
      return { action: 'TRAIL_TP1', newSl: sig.limitPrice };
    }

    // Cek SL / Trailing SL / Break Even
    const hitSl = isBuy ? currentPrice <= sig.sl : currentPrice >= sig.sl;
    if (hitSl) {
      if (sig.tp2Reached) {
        return { action: 'FINALIZE', finalStatus: 'TP2 HIT', signedUnits: sig.tp2Units };
      }
      if (sig.tp1Reached) {
        return { action: 'FINALIZE', finalStatus: 'BREAK EVEN', signedUnits: 0 };
      }
      return { action: 'FINALIZE', finalStatus: 'SL HIT', signedUnits: -sig.slUnits };
    }
  }

  return { action: 'HOLD' };
}

function calculateSplitUsdPnl(pairId, sig, lot) {
  const cfg = LIAMV_PAIRS[pairId] || LIAMV_PAIRS.XAUUSD;
  const units = Number(sig.resultUnits) || 0;
  return +(units * lot * cfg.usdPerUnitPerLot).toFixed(2);
}

function explainSignalEducation(item) {
  const riskSummary = `Limit: ${item.limitPrice} | SL: ${item.sl} (-${item.slUnits} ${item.unitLabel}) | TP2: ${item.tp2} (+${item.tp2Units} ${item.unitLabel})`;
  let outcomeInsight = '';

  if (String(item.status).startsWith('TP')) {
    outcomeInsight = `✅ Profit Terkunci (+${item.resultUnits} ${item.unitLabel}): Harga menghormati zona POI dan menembus target ekspansi.`;
  } else if (item.status === 'SL HIT') {
    outcomeInsight = `❌ Terkena Stop Loss (${item.resultUnits} ${item.unitLabel}): Struktur batal; sistem otomatis mengaktifkan jeda Cooldown 30 menit anti-whipsaw.`;
  } else if (item.status === 'BREAK EVEN') {
    outcomeInsight = `🛡️ Aman di Break Even (0 ${item.unitLabel}): Harga sempat menyentuh TP1 dan mengunci SL di harga masuk sebelum berbalik.`;
  } else {
    outcomeInsight = `ℹ️ Setup dibatalkan/terlewat sebelum menyentuh harga Limit sehingga tidak memotong saldo maupun Winrate.`;
  }

  return { riskSummary, outcomeInsight };
}

function formatStandardSmcSignal(sig, lot, accName) {
  const cfg = LIAMV_PAIRS[sig.pair] || LIAMV_PAIRS.XAUUSD;
  const d = cfg.decimals;
  return [
    `🎯 LIAMVTRADE SNIPER (${sig.pair} • ${sig.tf})`,
    `Arah     : ${sig.direction} (${sig.bias})`,
    `Metode   : ${sig.methodLabel} [${sig.confidence}% PD]`,
    `Limit    : ${Number(sig.limitPrice).toFixed(d)}`,
    `SL       : ${Number(sig.sl).toFixed(d)} (-${sig.slUnits} ${sig.unitLabel})`,
    `TP 1     : ${Number(sig.tp1).toFixed(d)} (+${sig.tp1Units} ${sig.unitLabel}) [50% + BE]`,
    `TP 2     : ${Number(sig.tp2).toFixed(d)} (+${sig.tp2Units} ${sig.unitLabel}) [30% + Trail]`,
    `TP 3     : ${Number(sig.tp3).toFixed(d)} (+${sig.tp3Units} ${sig.unitLabel}) [20% Runner]`,
    `Akun/Lot : ${accName} → ${Number(lot).toFixed(2)} lot`,
    `Struktur : ${sig.structure}`
  ].join('\n');
}
