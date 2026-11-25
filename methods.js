/**
 * Liamvtrade Quant Terminal — methods.js (v3.0-sync)
 * Mesin 6 Metode Analisis ICT / SMC / Liquidity dengan Skala SL per Timeframe,
 * NY Session (DST-aware) + WIB Context, Lock per Candle/SignalId, & Gate Data/News
 */

(function (global) {
  'use strict';

  const ENGINE_VERSION = 'v3.0-sync';
  const DEFAULT_MAX_DATA_AGE_MS = 120000; // 2 menit batas maksimal kesegaran data live

  const PAIR_SPECS = {
    XAUUSD: {
      label: 'XAUUSD',
      decimals: 2,
      pipSize: 0.1,        // 0.10 = 1 pip
      contractSize: 100,
      pipValuePerLot: 10,  // $10 per pip per 1.00 lot ($0.10 per 0.01 lot)
      baseAtrM15: 3.2,
      minSlPips: 10,
      maxSlPips: { M5: 48, M15: 72, H1: 115, H4: 185 },
      defaultSpreadPips: 2.5
    },
    US100: {
      label: 'US100',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 34.0,
      minSlPips: 12,
      maxSlPips: { M5: 55, M15: 85, H1: 140, H4: 220 },
      defaultSpreadPips: 2.0
    },
    BTCUSDT: {
      label: 'BTCUSDT',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 180.0,
      minSlPips: 25,
      maxSlPips: { M5: 130, M15: 210, H1: 360, H4: 600 },
      defaultSpreadPips: 15.0
    },
    EURUSD: {
      label: 'EURUSD',
      decimals: 5,
      pipSize: 0.0001,
      contractSize: 100000,
      pipValuePerLot: 10,
      baseAtrM15: 0.0014,
      minSlPips: 6,
      maxSlPips: { M5: 20, M15: 35, H1: 60, H4: 95 },
      defaultSpreadPips: 1.0
    }
  };

  const TF_CONFIG = {
    M5:  { atrMult: 0.45, slAtrFactor: 0.85, tpMults: [1.2, 1.9, 2.7], expiryMin: 20,  candleMs: 5 * 60 * 1000,   label: 'M5 Scalping' },
    M15: { atrMult: 0.80, slAtrFactor: 1.05, tpMults: [1.3, 2.1, 3.0], expiryMin: 45,  candleMs: 15 * 60 * 1000,  label: 'M15 Intraday' },
    H1:  { atrMult: 1.55, slAtrFactor: 1.25, tpMults: [1.4, 2.4, 3.5], expiryMin: 120, candleMs: 60 * 60 * 1000,  label: 'H1 Session Swing' },
    H4:  { atrMult: 2.75, slAtrFactor: 1.45, tpMults: [1.5, 2.6, 4.0], expiryMin: 240, candleMs: 240 * 60 * 1000, label: 'H4 HTF Swing' }
  };

  const METHOD_CATALOG = {
    auto: {
      key: 'auto',
      name: 'Auto Sniper (Multi-Confluence)',
      shortTag: 'AUTO',
      baseScore: 8.2
    },
    judas: {
      key: 'judas',
      name: 'ICT Judas Swing (Session Manipulation)',
      shortTag: 'JUDAS',
      baseScore: 8.4
    },
    smc_ob: {
      key: 'smc_ob',
      name: 'SMC Order Block + FVG Confluence',
      shortTag: 'SMC OB',
      baseScore: 8.3
    },
    sweep: {
      key: 'sweep',
      name: 'Liquidity Sweep (Turtle Soup Stop-Hunt)',
      shortTag: 'SWEEP',
      baseScore: 8.4
    },
    silver_bullet: {
      key: 'silver_bullet',
      name: 'ICT Silver Bullet (Time-Window FVG)',
      shortTag: 'SILVER BULLET',
      baseScore: 8.2
    },
    ote: {
      key: 'ote',
      name: 'FIB OTE (Optimal Trade Entry 0.62–0.79)',
      shortTag: 'FIB OTE',
      baseScore: 8.1
    }
  };

  const lockedSignalCache = new Map();
  const lockedPairCandleBias = new Map();

  function getPairSpec(pair) {
    return PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  }

  function formatPrice(pair, value) {
    const spec = getPairSpec(pair);
    if (!Number.isFinite(Number(value))) return '--';
    return Number(value).toFixed(spec.decimals);
  }

  function toPips(pair, priceDiff) {
    const spec = getPairSpec(pair);
    const raw = Math.abs(priceDiff) / spec.pipSize;
    return spec.decimals === 2 && pair === 'XAUUSD'
      ? Number(raw.toFixed(1))
      : Math.round(raw);
  }

  function getWibContext(refTimeMs) {
    const ms = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    const now = new Date(ms);
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

  function getNySessionContext(refTimeMs) {
    const ms = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    const dateObj = new Date(ms);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(dateObj);

    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }

    const nyHour = Number(map.hour) || 0;
    const nyMinute = Number(map.minute) || 0;
    const nyWeekday = map.weekday || 'Mon';

    const isWeekend =
      nyWeekday === 'Sat' ||
      nyWeekday === 'Sun' ||
      (nyWeekday === 'Fri' && nyHour >= 17);

    let sessionName = 'Off-Session / NY Close';
    let sessionBiasHint = 'Konsolidasi / Transisi Sesi';
    let isSilverBulletWindow = false;
    let isJudasWindow = false;

    if (nyHour >= 2 && nyHour < 5) {
      sessionName = 'London Killzone';
      sessionBiasHint = 'Pembukaan London & Potensi Judas Swing';
      isJudasWindow = true;
      if (nyHour === 3) isSilverBulletWindow = true;
    } else if (nyHour >= 7 && nyHour < 11) {
      sessionName = 'New York AM Killzone';
      sessionBiasHint = 'Ekspansi Likuiditas & Sesi NY Utama';
      isJudasWindow = nyHour === 7 || nyHour === 8;
      if (nyHour === 10) isSilverBulletWindow = true;
    } else if (nyHour >= 13 && nyHour < 16) {
      sessionName = 'New York PM Session';
      sessionBiasHint = 'Re-distribusi & Kelanjutan Sesi US';
      if (nyHour === 14) isSilverBulletWindow = true;
    } else if (nyHour >= 19 || nyHour < 2) {
      sessionName = 'Asia Range';
      sessionBiasHint = 'Pembentukan Range Asia';
    }

    return {
      nyHour,
      nyMinute,
      nyWeekday,
      isWeekend,
      sessionName,
      sessionBiasHint,
      isJudasWindow,
      isSilverBulletWindow
    };
  }

  function getCandleCloseTimestamp(timeframe, refTimeMs, explicitCloseTs) {
    if (Number.isFinite(Number(explicitCloseTs)) && Number(explicitCloseTs) > 0) {
      return Number(explicitCloseTs);
    }
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const baseMs = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    const candleOpenTs = Math.floor(baseMs / tfCfg.candleMs) * tfCfg.candleMs;
    return candleOpenTs + tfCfg.candleMs;
  }

  function buildDeterministicSignalId(pair, timeframe, methodKey, candleCloseTs) {
    return `${pair}_${timeframe}_${methodKey.toUpperCase()}_${candleCloseTs}`;
  }

  function clearLockedSignal(signalId) {
    if (signalId) {
      lockedSignalCache.delete(signalId);
    } else {
      lockedSignalCache.clear();
      lockedPairCandleBias.clear();
    }
  }

  // Kunci 1 arah per pair + H1/M15 candle block agar tidak gonta-ganti BUY/SELL tiap scan
  function getLockedOneWayBias(pair, timeframe, candleCloseTs, opts, livePrice, equilibrium) {
    const explicitBias = (opts.htfBias || opts.trendBias || opts.structureBias || '').toUpperCase();
    if (explicitBias === 'BUY' || explicitBias === 'BULLISH') {
      return { direction: 'BUY', source: 'bias struktur/tren BULLISH (1-Arah)' };
    }
    if (explicitBias === 'SELL' || explicitBias === 'BEARISH') {
      return { direction: 'SELL', source: 'bias struktur/tren BEARISH (1-Arah)' };
    }

    const biasKey = `${pair}_${timeframe}_${candleCloseTs}`;
    if (lockedPairCandleBias.has(biasKey)) {
      const cachedDir = lockedPairCandleBias.get(biasKey);
      return { direction: cachedDir, source: `arah terkunci 1-arah (${cachedDir})` };
    }

    let initialDir = 'BUY';
    let sourceDesc = 'struktur utama (1-Arah)';

    if (opts.sweptSide === 'LOW' || opts.sweepType === 'SELL_SIDE_SWEEP') {
      initialDir = 'BUY';
      sourceDesc = 'sweep likuiditas bawah (SSL)';
    } else if (opts.sweptSide === 'HIGH' || opts.sweepType === 'BUY_SIDE_SWEEP') {
      initialDir = 'SELL';
      sourceDesc = 'sweep likuiditas atas (BSL)';
    } else {
      const prevClose = Number(opts.prevClose);
      const candleOpen = Number(opts.candleOpen);
      if (Number.isFinite(prevClose) && Number.isFinite(candleOpen) && prevClose !== candleOpen) {
        initialDir = prevClose > candleOpen ? 'BUY' : 'SELL';
        sourceDesc = `arah candle sebelumnya (${initialDir})`;
      } else if (Number.isFinite(Number(equilibrium))) {
        initialDir = livePrice <= equilibrium ? 'BUY' : 'SELL';
        sourceDesc = livePrice <= equilibrium ? 'zona Discount (< 50% EQ)' : 'zona Premium (> 50% EQ)';
      }
    }

    lockedPairCandleBias.set(biasKey, initialDir);
    return { direction: initialDir, source: sourceDesc };
  }

  function analyzeDealingRange(pair, livePrice, timeframe, deterministicSeed, marketContext) {
    const spec = getPairSpec(pair);
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const ctx = marketContext || {};
    const nyCtx = getNySessionContext(ctx.nowMs);
    const seed = Number.isFinite(Number(deterministicSeed)) ? Number(deterministicSeed) : 1;

    const hasRealAtr = Number.isFinite(Number(ctx.realAtr)) && Number(ctx.realAtr) > 0;
    const unitAtr = hasRealAtr
      ? Number(ctx.realAtr)
      : Math.max(spec.pipSize * 4, spec.baseAtrM15 * tfCfg.atrMult);

    const hasRealSwing =
      Number.isFinite(Number(ctx.recentHigh)) &&
      Number.isFinite(Number(ctx.recentLow)) &&
      Number(ctx.recentHigh) > Number(ctx.recentLow);

    let swingLow;
    let swingHigh;
    let totalRange;

    if (hasRealSwing) {
      swingLow = Number(ctx.recentLow);
      swingHigh = Number(ctx.recentHigh);
      totalRange = Math.max(unitAtr * 1.1, swingHigh - swingLow);
    } else {
      // Rentang stabil berbasis seed candle (bukan scanCounter) agar tidak bergeser saat scan ulang
      const fixedRatio = 0.5;
      const rangeSpreadFactor = 1.6 + (Math.abs(Math.cos(seed + 0.7)) * 0.25);
      totalRange = unitAtr * rangeSpreadFactor;
      swingLow = livePrice - totalRange * fixedRatio;
      swingHigh = swingLow + totalRange;
    }

    const equilibrium = swingLow + totalRange * 0.5;
    const pdPercent = Math.round(
      Math.min(95, Math.max(5, ((livePrice - swingLow) / Math.max(spec.pipSize, totalRange)) * 100))
    );

    const dirInfo = getLockedOneWayBias(pair, timeframe, ctx.candleCloseTs || 0, ctx, livePrice, equilibrium);

    return {
      pair,
      timeframe,
      livePrice,
      unitAtr,
      hasRealAtr,
      hasRealSwing,
      swingHigh,
      swingHighFmt: formatPrice(pair, swingHigh),
      swingLow,
      swingLowFmt: formatPrice(pair, swingLow),
      totalRange,
      equilibrium,
      equilibriumFmt: formatPrice(pair, equilibrium),
      pdPercent,
      direction: dirInfo.direction,
      directionSource: dirInfo.source,
      nyCtx
    };
  }

  function createDecision(baseMeta, status, reasonCode, detectedFacts, extra) {
    return Object.assign({}, baseMeta, {
      status,
      isExecutable: status === 'SIGNAL',
      reasonCode,
      detectedFacts: Array.isArray(detectedFacts) ? detectedFacts : []
    }, extra || {});
  }

  function buildSignalSetup(options) {
    const opts = options || {};
    const pair = opts.pair || 'XAUUSD';
    const timeframe = opts.timeframe || 'M15';
    const methodKey = METHOD_CATALOG[opts.method] ? opts.method : 'auto';
    const forceReanalyze = Boolean(opts.forceReanalyze);

    const nowMs = Number.isFinite(Number(opts.nowMs)) ? Number(opts.nowMs) : Date.now();
    const candleCloseTs = getCandleCloseTimestamp(timeframe, nowMs, opts.candleCloseTs);
    const signalId = buildDeterministicSignalId(pair, timeframe, methodKey, candleCloseTs);

    if (!forceReanalyze && lockedSignalCache.has(signalId)) {
      return Object.assign({}, lockedSignalCache.get(signalId), {
        lockedFromCache: true
      });
    }

    const livePrice = Number(opts.livePrice);
    const maxDataAgeMs = Number.isFinite(Number(opts.maxDataAgeMs))
      ? Number(opts.maxDataAgeMs)
      : DEFAULT_MAX_DATA_AGE_MS;

    const spec = getPairSpec(pair);
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const methodMeta = METHOD_CATALOG[methodKey];
    const nyCtx = getNySessionContext(nowMs);

    const baseMeta = {
      engineVersion: ENGINE_VERSION,
      signalId,
      candleCloseTs,
      candleCloseIso: new Date(candleCloseTs).toISOString(),
      pair,
      timeframe,
      methodKey,
      methodLabel: methodMeta.name,
      methodShortTag: methodMeta.shortTag,
      sessionName: nyCtx.sessionName,
      nyTimeLabel: `${String(nyCtx.nyHour).padStart(2, '0')}:${String(nyCtx.nyMinute).padStart(2, '0')} NY (${nyCtx.nyWeekday})`,
      livePrice: Number.isFinite(livePrice) ? livePrice : null
    };

    if (nyCtx.isWeekend && pair !== 'BTCUSDT') {
      const res = createDecision(baseMeta, 'NO_TRADE', 'WEEKEND_MARKET_CLOSED', [
        `Pasar sedang libur akhir pekan (${nyCtx.nyWeekday}, ${baseMeta.nyTimeLabel}).`
      ], {
        direction: null,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Akhir pekan / pasar tutup.'
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const lastUpdateRaw = opts.lastUpdateTs;
    const lastUpdateNum = Number(lastUpdateRaw);
    if (!Number.isFinite(livePrice) || livePrice <= 0) {
      const res = createDecision(baseMeta, 'NO_TRADE', 'INVALID_LIVE_PRICE', [
        'Harga live tidak tersedia atau tidak valid.'
      ], {
        direction: null,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Harga live tidak valid.'
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    if (lastUpdateRaw === undefined || lastUpdateRaw === null || !Number.isFinite(lastUpdateNum) || lastUpdateNum <= 0) {
      const res = createDecision(baseMeta, 'NO_TRADE', 'MISSING_LAST_UPDATE_TS', [
        'Timestamp pembaruan data (lastUpdateTs) tidak tersedia.'
      ], {
        direction: null,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Waktu update data tidak valid.'
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const dataAgeMs = nowMs - lastUpdateNum;
    if (dataAgeMs < 0 || dataAgeMs > maxDataAgeMs) {
      const ageSec = Math.max(0, Math.round(dataAgeMs / 1000));
      const res = createDecision(baseMeta, 'NO_TRADE', 'STALE_PRICE_DATA', [
        `Data harga berusia ${ageSec} detik (melewati batas kesegaran ${Math.round(maxDataAgeMs / 1000)} detik).`
      ], {
        dataAgeMs,
        direction: null,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Data harga basi, sinyal ditahan.'
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const deterministicSeed = (candleCloseTs % 1000000) / 10000;
    const dr = analyzeDealingRange(pair, livePrice, timeframe, deterministicSeed, {
      nowMs,
      candleCloseTs,
      realAtr: opts.realAtr,
      recentHigh: opts.recentHigh,
      recentLow: opts.recentLow,
      htfBias: opts.htfBias,
      trendBias: opts.trendBias,
      structureBias: opts.structureBias,
      sweptSide: opts.sweptSide,
      sweepType: opts.sweepType,
      prevClose: opts.prevClose,
      candleOpen: opts.candleOpen
    });

    const detectedFacts = [
      `Sesi NY aktif: ${nyCtx.sessionName} (${baseMeta.nyTimeLabel}).`,
      `Arah ${dr.direction} merujuk pada ${dr.directionSource}.`,
      `ATR ${timeframe} acuan: ${formatPrice(pair, dr.unitAtr)}.`
    ];

    if (methodKey === 'silver_bullet' && !nyCtx.isSilverBulletWindow) {
      const res = createDecision(baseMeta, 'NO_TRADE', 'SILVER_BULLET_WINDOW_INACTIVE', detectedFacts.concat([
        'Di luar jendela jam Silver Bullet NY (03:00, 10:00, atau 14:00 waktu New York).'
      ]), {
        direction: dr.direction,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Di luar jendela waktu Silver Bullet.'
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    if (methodKey === 'judas' && !nyCtx.isJudasWindow && nyCtx.sessionName !== 'London Killzone' && nyCtx.sessionName !== 'New York AM Killzone') {
      const res = createDecision(baseMeta, 'NO_TRADE', 'JUDAS_SESSION_INACTIVE', detectedFacts.concat([
        `Sesi ${nyCtx.sessionName} bukan jendela manipulasi Judas Swing utama.`
      ]), {
        direction: dr.direction,
        orderType: 'NO TRADE',
        poiSummary: `NO TRADE: Judas Swing tidak aktif pada ${nyCtx.sessionName}.`
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const highImpactEvents = Array.isArray(opts.highImpactEvents) ? opts.highImpactEvents : [];
    const lockWindowMs = 30 * 60 * 1000;
    const activeLockEvent = highImpactEvents.find((ev) => {
      const evTs = Number(ev && (ev.timestampMs || ev.timeMs || ev.ts));
      return Number.isFinite(evTs) && Math.abs(nowMs - evTs) <= lockWindowMs;
    });

    if (Boolean(opts.newsLockActive) || Boolean(activeLockEvent)) {
      const evTitle = activeLockEvent && activeLockEvent.title ? ` (${activeLockEvent.title})` : '';
      const res = createDecision(baseMeta, 'WAIT', 'NEWS_LOCK_30M', detectedFacts.concat([
        `News Lock ±30 menit aktif di sekitar rilis High Impact${evTitle}.`
      ]), {
        direction: dr.direction,
        orderType: 'WAIT',
        poiSummary: `WAIT: News Lock ±30 menit aktif${evTitle}.`
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const rawNewsBias = (opts.newsBias || '').toUpperCase();
    const validNewsBias = rawNewsBias === 'BUY' || rawNewsBias === 'SELL' ? rawNewsBias : '';
    if (validNewsBias && validNewsBias !== dr.direction) {
      const res = createDecision(baseMeta, 'WAIT', 'NEWS_BIAS_CONFLICT', detectedFacts.concat([
        `Bias kalender news (${validNewsBias}) bertentangan dengan arah engine (${dr.direction}).`
      ]), {
        direction: dr.direction,
        orderType: 'WAIT',
        poiSummary: `WAIT: Bias news (${validNewsBias}) berlawanan dengan arah ${dr.direction}.`
      });
      lockedSignalCache.set(signalId, res);
      return res;
    }

    const spreadPips = Number.isFinite(Number(opts.spreadPips)) && Number(opts.spreadPips) >= 0
      ? Number(opts.spreadPips)
      : spec.defaultSpreadPips;
    const spreadPrice = spreadPips * spec.pipSize;

    const maxAllowedSlPips = (spec.maxSlPips && spec.maxSlPips[timeframe]) || 60;
    const minAllowedSlPips = spec.minSlPips || 8;
    const maxAllowedSlPrice = maxAllowedSlPips * spec.pipSize;
    const minAllowedSlPrice = minAllowedSlPips * spec.pipSize;

    const direction = dr.direction;
    const orderType = direction === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
    const shFmt = dr.swingHighFmt;
    const slFmt = dr.swingLowFmt;
    const eqFmt = dr.equilibriumFmt;

    let entry = livePrice;
    let zoneLow = livePrice;
    let zoneHigh = livePrice;
    let sl = livePrice;
    let slReason = '';
    let entryNote = '';
    let poiSummary = '';

    if (direction === 'BUY') {
      if (methodKey === 'ote') {
        const fib705 = dr.swingHigh - dr.totalRange * 0.705;
        const fib786 = dr.swingHigh - dr.totalRange * 0.786;
        const fib618 = dr.swingHigh - dr.totalRange * 0.618;
        entry = Math.min(livePrice - spec.pipSize * 4, fib705);
        zoneLow = Math.min(fib786, entry - dr.unitAtr * 0.08);
        zoneHigh = Math.max(fib618, entry + dr.unitAtr * 0.08);
        entryNote = 'FIB OTE 0.705 (Zona 0.618–0.786)';
        poiSummary = `OTE Fibo BUY: Area 0.618–0.786 di sekitar ${formatPrice(pair, entry)}.`;
      } else if (methodKey === 'smc_ob') {
        const obBottom = dr.swingLow + dr.totalRange * 0.12;
        const obTop = dr.swingLow + dr.totalRange * 0.24;
        entry = Math.min(livePrice - spec.pipSize * 4, (obBottom + obTop) / 2);
        zoneLow = obBottom;
        zoneHigh = obTop;
        entryNote = 'SMC Bullish OB + FVG Mean Threshold';
        poiSummary = `SMC OB+FVG BUY: Zona OB ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}.`;
      } else if (methodKey === 'sweep') {
        entry = Math.min(livePrice - spec.pipSize * 4, dr.swingLow + spec.pipSize * 6);
        zoneLow = dr.swingLow - spec.pipSize * 4;
        zoneHigh = entry + spec.pipSize * 5;
        entryNote = 'Reversal setelah Liquidity Sweep Low';
        poiSummary = `Liquidity Sweep BUY: Area pantulan dekat low ${slFmt}.`;
      } else if (methodKey === 'judas') {
        entry = Math.min(livePrice - spec.pipSize * 4, dr.swingLow + dr.unitAtr * 0.15);
        zoneLow = entry - dr.unitAtr * 0.08;
        zoneHigh = entry + dr.unitAtr * 0.08;
        entryNote = 'Retest pasca Judas Swing Low';
        poiSummary = `Judas Swing BUY: Retest area bawah setelah gerakan awal sesi.`;
      } else if (methodKey === 'silver_bullet') {
        entry = Math.min(livePrice - spec.pipSize * 4, livePrice - dr.unitAtr * 0.18);
        zoneLow = entry - dr.unitAtr * 0.08;
        zoneHigh = entry + dr.unitAtr * 0.08;
        entryNote = 'Silver Bullet FVG Window';
        poiSummary = `Silver Bullet BUY: Zona FVG pada jendela waktu aktif.`;
      } else {
        entry = Math.min(livePrice - spec.pipSize * 4, livePrice - dr.unitAtr * 0.20);
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.10;
        entryNote = 'Auto Sniper Discount POI';
        poiSummary = `Auto Sniper BUY: Zona POI ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}.`;
      }

      const rawSlDist = dr.unitAtr * tfCfg.slAtrFactor + spreadPrice;
      const clampedSlDist = Math.min(maxAllowedSlPrice, Math.max(minAllowedSlPrice, rawSlDist));
      sl = entry - clampedSlDist;

      if (clampedSlDist >= maxAllowedSlPrice - 1e-9) {
        slReason = `Dibatasi plafon ${timeframe} (${maxAllowedSlPips} pip termasuk spread ${spreadPips} pip)`;
      } else if (clampedSlDist <= minAllowedSlPrice + 1e-9) {
        slReason = `Dibatasi minimum jarak SL (${minAllowedSlPips} pip termasuk spread ${spreadPips} pip)`;
      } else {
        slReason = `Berbasis ${tfCfg.slAtrFactor}x ATR ${timeframe} + spread ${spreadPips} pip`;
      }
    } else {
      if (methodKey === 'ote') {
        const fib705 = dr.swingLow + dr.totalRange * 0.705;
        const fib618 = dr.swingLow + dr.totalRange * 0.618;
        const fib786 = dr.swingLow + dr.totalRange * 0.786;
        entry = Math.max(livePrice + spec.pipSize * 4, fib705);
        zoneLow = Math.min(fib618, entry - dr.unitAtr * 0.08);
        zoneHigh = Math.max(fib786, entry + dr.unitAtr * 0.08);
        entryNote = 'FIB OTE 0.705 (Zona 0.618–0.786)';
        poiSummary = `OTE Fibo SELL: Area 0.618–0.786 di sekitar ${formatPrice(pair, entry)}.`;
      } else if (methodKey === 'smc_ob') {
        const obBottom = dr.swingHigh - dr.totalRange * 0.24;
        const obTop = dr.swingHigh - dr.totalRange * 0.12;
        entry = Math.max(livePrice + spec.pipSize * 4, (obBottom + obTop) / 2);
        zoneLow = obBottom;
        zoneHigh = obTop;
        entryNote = 'SMC Bearish OB + FVG Mean Threshold';
        poiSummary = `SMC OB+FVG SELL: Zona OB ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}.`;
      } else if (methodKey === 'sweep') {
        entry = Math.max(livePrice + spec.pipSize * 4, dr.swingHigh - spec.pipSize * 6);
        zoneLow = entry - spec.pipSize * 5;
        zoneHigh = dr.swingHigh + spec.pipSize * 4;
        entryNote = 'Reversal setelah Liquidity Sweep High';
        poiSummary = `Liquidity Sweep SELL: Area penolakan dekat high ${shFmt}.`;
      } else if (methodKey === 'judas') {
        entry = Math.max(livePrice + spec.pipSize * 4, dr.swingHigh - dr.unitAtr * 0.15);
        zoneLow = entry - dr.unitAtr * 0.08;
        zoneHigh = entry + dr.unitAtr * 0.08;
        entryNote = 'Retest pasca Judas Swing High';
        poiSummary = `Judas Swing SELL: Retest area atas setelah gerakan awal sesi.`;
      } else if (methodKey === 'silver_bullet') {
        entry = Math.max(livePrice + spec.pipSize * 4, livePrice + dr.unitAtr * 0.18);
        zoneLow = entry - dr.unitAtr * 0.08;
        zoneHigh = entry + dr.unitAtr * 0.08;
        entryNote = 'Silver Bullet FVG Window';
        poiSummary = `Silver Bullet SELL: Zona FVG pada jendela waktu aktif.`;
      } else {
        entry = Math.max(livePrice + spec.pipSize * 4, livePrice + dr.unitAtr * 0.20);
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.10;
        entryNote = 'Auto Sniper Premium POI';
        poiSummary = `Auto Sniper SELL: Zona POI ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}.`;
      }

      const rawSlDist = dr.unitAtr * tfCfg.slAtrFactor + spreadPrice;
      const clampedSlDist = Math.min(maxAllowedSlPrice, Math.max(minAllowedSlPrice, rawSlDist));
      sl = entry + clampedSlDist;

      if (clampedSlDist >= maxAllowedSlPrice - 1e-9) {
        slReason = `Dibatasi plafon ${timeframe} (${maxAllowedSlPips} pip termasuk spread ${spreadPips} pip)`;
      } else if (clampedSlDist <= minAllowedSlPrice + 1e-9) {
        slReason = `Dibatasi minimum jarak SL (${minAllowedSlPips} pip termasuk spread ${spreadPips} pip)`;
      } else {
        slReason = `Berbasis ${tfCfg.slAtrFactor}x ATR ${timeframe} + spread ${spreadPips} pip`;
      }
    }

    const riskDist = Math.abs(entry - sl);
    const tp1 = direction === 'BUY' ? entry + riskDist * tfCfg.tpMults[0] : entry - riskDist * tfCfg.tpMults[0];
    const tp2 = direction === 'BUY' ? entry + riskDist * tfCfg.tpMults[1] : entry - riskDist * tfCfg.tpMults[1];
    const tp3 = direction === 'BUY' ? entry + riskDist * tfCfg.tpMults[2] : entry - riskDist * tfCfg.tpMults[2];

    const slPips = toPips(pair, entry - sl);
    const tp1Pips = toPips(pair, tp1 - entry);
    const tp2Pips = toPips(pair, tp2 - entry);
    const tp3Pips = toPips(pair, tp3 - entry);

    let score = methodMeta.baseScore + (Number(opts.sopScoreBonus) || 0);
    if (dr.hasRealAtr) score += 0.3;
    if (dr.hasRealSwing) score += 0.3;
    if (methodKey === 'silver_bullet' && nyCtx.isSilverBulletWindow) score += 0.4;
    if (methodKey === 'judas' && nyCtx.isJudasWindow) score += 0.3;
    const finalScore = Math.min(9.9, Math.max(6.0, Number(score.toFixed(1))));

    const educationHtml = `
      <p><strong>${orderType} (${methodMeta.shortTag})</strong> ditempatkan pada zona <strong>${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}</strong> (${dr.directionSource}).</p>
      <p class="mt-1">Stop Loss terukur <strong>${slPips} pips</strong> (${slReason}) dengan target rasio RR hingga <strong>1:${tfCfg.tpMults[2]}</strong> di TP3.</p>
    `;

    const result = createDecision(baseMeta, 'SIGNAL', 'VALID_SETUP', detectedFacts.concat([
      `Jarak SL terhitung ${slPips} pip (batas ${timeframe}: maks ${maxAllowedSlPips} pip, spread ${spreadPips} pip).`
    ]), {
      direction,
      orderType,
      entry,
      entryFmt: formatPrice(pair, entry),
      zoneLow,
      zoneHigh,
      zoneRangeFormatted: `${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}`,
      entryNote,
      sl,
      slFmt: formatPrice(pair, sl),
      slPips,
      spreadPips,
      slReason,
      tp1,
      tp1Fmt: formatPrice(pair, tp1),
      tp1Pips,
      tp1Reason: `1:${tfCfg.tpMults[0]} Target 1`,
      tp2,
      tp2Fmt: formatPrice(pair, tp2),
      tp2Pips,
      tp2Reason: `1:${tfCfg.tpMults[1]} Target 2`,
      tp3,
      tp3Fmt: formatPrice(pair, tp3),
      tp3Pips,
      tp3Reason: `1:${tfCfg.tpMults[2]} Target 3`,
      score: finalScore,
      expiryMinutes: tfCfg.expiryMin,
      poiSummary,
      educationHtml,
      swingHigh: dr.swingHigh,
      swingHighFmt: shFmt,
      swingLow: dr.swingLow,
      swingLowFmt: slFmt,
      activeRangeFmt: formatPrice(pair, dr.totalRange),
      equilibriumFmt: eqFmt,
      pdPercent: dr.pdPercent,
      pipValuePerLot: spec.pipValuePerLot
    });

    lockedSignalCache.set(signalId, result);
    return result;
  }

  function calculatePositionSize(account, signal) {
    if (!signal || signal.status !== 'SIGNAL') {
      return {
        lot: 0,
        isBlocked: true,
        blockReason: 'Sinyal tidak dalam status eksekusi (SIGNAL).',
        actualRiskDollar: 0,
        tp1Dollar: 0,
        tp2Dollar: 0,
        tp3Dollar: 0
      };
    }

    const equity = Number(account && (account.equity !== undefined ? account.equity : account.balance));
    const riskPct = Number(account && account.riskPct);
    const hardMaxLot = Number(account && account.maxLot);

    if (!Number.isFinite(equity) || equity <= 0 || !Number.isFinite(riskPct) || riskPct <= 0) {
      return {
        lot: 0,
        isBlocked: true,
        blockReason: 'Equity atau persentase risiko akun belum terisi valid.',
        actualRiskDollar: 0,
        tp1Dollar: 0,
        tp2Dollar: 0,
        tp3Dollar: 0
      };
    }

    const spec = getPairSpec(signal.pair);
    const slPips = Math.max(1, Number(signal.slPips) || 1);
    const targetRiskDollar = equity * (riskPct / 100);
    const rawLot = targetRiskDollar / (slPips * spec.pipValuePerLot);

    let finalLot = Math.floor(rawLot * 100) / 100;
    let wasCapped = false;

    if (Number.isFinite(hardMaxLot) && hardMaxLot > 0 && finalLot > hardMaxLot) {
      finalLot = Math.floor(hardMaxLot * 100) / 100;
      wasCapped = true;
    }

    if (finalLot < 0.01) {
      return {
        lot: 0,
        isBlocked: true,
        blockReason: 'Ukuran lot di bawah 0.01; dipaksa 0.01 akan melewati batas risiko target.',
        targetRiskDollar: Number(targetRiskDollar.toFixed(2)),
        actualRiskDollar: 0,
        tp1Dollar: 0,
        tp2Dollar: 0,
        tp3Dollar: 0
      };
    }

    const actualRiskDollar = finalLot * slPips * spec.pipValuePerLot;
    const tp1Dollar = finalLot * (Number(signal.tp1Pips) || 0) * spec.pipValuePerLot;
    const tp2Dollar = finalLot * (Number(signal.tp2Pips) || 0) * spec.pipValuePerLot;
    const tp3Dollar = finalLot * (Number(signal.tp3Pips) || 0) * spec.pipValuePerLot;

    return {
      lot: Number(finalLot.toFixed(2)),
      isBlocked: false,
      wasCapped,
      targetRiskDollar: Number(targetRiskDollar.toFixed(2)),
      actualRiskDollar: Number(actualRiskDollar.toFixed(2)),
      tp1Dollar: Number(tp1Dollar.toFixed(2)),
      tp2Dollar: Number(tp2Dollar.toFixed(2)),
      tp3Dollar: Number(tp3Dollar.toFixed(2))
    };
  }

  function evaluateRunningPositionMetrics(tradeOrSignal, currentPrice, options) {
    const src = tradeOrSignal || {};
    const opts = options || {};
    const pair = src.pair || opts.pair || 'XAUUSD';
    const spec = getPairSpec(pair);
    const direction = (src.direction || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    const entry = Number(src.entry);
    const sl = Number(src.sl);
    const tp1 = Number(src.tp1);
    const tp2 = Number(src.tp2);
    const tp3 = Number(src.tp3);
    const price = Number(currentPrice);
    const lot = Number.isFinite(Number(opts.lot)) ? Number(opts.lot) : (Number(src.lot) || 0.01);
    const pipValPerLot = Number(src.pipValuePerLot) || spec.pipValuePerLot;

    const forcedStatus = (opts.forcedStatus || src.status || '').toUpperCase();
    if (['TP1', 'TP2', 'TP3', 'BE', 'SL', 'CUT', 'CANCEL'].includes(forcedStatus)) {
      const closedPips = Number.isFinite(Number(opts.closedPips))
        ? Number(opts.closedPips)
        : (forcedStatus === 'BE' || forcedStatus === 'CANCEL' ? 0 : (forcedStatus === 'SL' ? -Math.abs(Number(src.slPips) || 0) : Math.abs(Number(src.tp1Pips) || 0)));
      const closedUsd = Number.isFinite(Number(opts.closedUsd))
        ? Number(opts.closedUsd)
        : Number((closedPips * pipValPerLot * lot).toFixed(2));
      return {
        isTriggered: true,
        isClosed: true,
        status: forcedStatus,
        deltaPips: closedPips,
        floatingUsd: closedUsd
      };
    }

    if (!Number.isFinite(entry) || !Number.isFinite(price)) {
      return {
        isTriggered: false,
        isClosed: false,
        status: 'MENUNGGU LIMIT',
        deltaPips: 0,
        floatingUsd: 0
      };
    }

    const isTriggered = direction === 'BUY'
      ? (price <= entry || Boolean(opts.isTriggered))
      : (price >= entry || Boolean(opts.isTriggered));

    if (!isTriggered) {
      return {
        isTriggered: false,
        isClosed: false,
        status: 'MENUNGGU LIMIT',
        deltaPips: 0,
        floatingUsd: 0
      };
    }

    const signedDiff = direction === 'BUY' ? (price - entry) : (entry - price);
    const absPips = toPips(pair, signedDiff);
    const deltaPips = signedDiff >= 0 ? absPips : -absPips;
    const floatingUsd = Number((deltaPips * pipValPerLot * lot).toFixed(2));

    let status = 'RUNNING';
    if (Number.isFinite(tp3) && (direction === 'BUY' ? price >= tp3 : price <= tp3)) {
      status = 'TP3';
    } else if (Number.isFinite(tp2) && (direction === 'BUY' ? price >= tp2 : price <= tp2)) {
      status = 'TP2';
    } else if (Number.isFinite(tp1) && (direction === 'BUY' ? price >= tp1 : price <= tp1)) {
      status = 'TP1';
    } else if (Number.isFinite(sl) && Math.abs(sl - entry) <= spec.pipSize * 0.5 && Math.abs(price - entry) <= spec.pipSize * 1.5) {
      status = 'BE';
    } else if (Number.isFinite(sl) && (direction === 'BUY' ? price <= sl : price >= sl)) {
      status = 'SL';
    }

    return {
      isTriggered: true,
      isClosed: ['TP1', 'TP2', 'TP3', 'SL'].includes(status),
      status,
      deltaPips,
      floatingUsd
    };
  }

  function calculateManualTpMetrics(tradeOrSignal, manualTpPrice, lot) {
    const src = tradeOrSignal || {};
    const pair = src.pair || 'XAUUSD';
    const spec = getPairSpec(pair);
    const direction = (src.direction || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    const entry = Number(src.entry);
    const tpVal = Number(manualTpPrice);
    const safeLot = Number.isFinite(Number(lot)) && Number(lot) > 0 ? Number(lot) : (Number(src.lot) || 0.01);
    const pipValPerLot = Number(src.pipValuePerLot) || spec.pipValuePerLot;

    if (!Number.isFinite(entry) || !Number.isFinite(tpVal)) {
      return { valid: false, tpPips: 0, tpDollar: 0 };
    }

    const signedMove = direction === 'BUY' ? (tpVal - entry) : (entry - tpVal);
    const absPips = toPips(pair, signedMove);
    const tpPips = signedMove >= 0 ? absPips : -absPips;
    const tpDollar = Number((tpPips * pipValPerLot * safeLot).toFixed(2));

    return {
      valid: true,
      tpPips,
      tpDollar,
      tpFmt: formatPrice(pair, tpVal)
    };
  }

  function evaluateNewsLockStatus(options) {
    const opts = options || {};
    const nowMs = Number.isFinite(Number(opts.nowMs)) ? Number(opts.nowMs) : Date.now();
    const lockWindowMs = Number.isFinite(Number(opts.lockWindowMs)) ? Number(opts.lockWindowMs) : 30 * 60 * 1000;
    const highImpactEvents = Array.isArray(opts.highImpactEvents) ? opts.highImpactEvents : [];

    const matchedEvent = highImpactEvents.find((ev) => {
      const evTs = Number(ev && (ev.timestampMs || ev.timeMs || ev.ts));
      return Number.isFinite(evTs) && Math.abs(nowMs - evTs) <= lockWindowMs;
    });

    const isLocked = Boolean(opts.newsLockActive) || Boolean(matchedEvent);
    const direction = (opts.direction || '').toUpperCase();
    const rawNewsBias = (opts.newsBias || '').toUpperCase();
    const hasConflict = Boolean(direction && (rawNewsBias === 'BUY' || rawNewsBias === 'SELL') && rawNewsBias !== direction);

    let severity = 'NONE';
    let warningTitle = '';
    let warningMessage = '';

    if (isLocked) {
      severity = 'LOCK';
      const evTitle = matchedEvent && matchedEvent.title ? ` — ${matchedEvent.title}` : '';
      warningTitle = `⚠️ NEWS LOCK AKTIF${evTitle}`;
      warningMessage = `Waspada volatilitas tinggi & pelebaran spread di sekitar jendela news ±${Math.round(lockWindowMs / 60000)} menit.`;
    } else if (hasConflict) {
      severity = 'CONFLICT';
      warningTitle = '⚠️ KONFLIK BIAS NEWS';
      warningMessage = `Bias kalender news (${rawNewsBias}) berbeda dengan arah setup (${direction}); perhatikan reaksi rilis data.`;
    }

    return {
      isLocked,
      hasConflict,
      severity,
      matchedEvent: matchedEvent || null,
      warningTitle,
      warningMessage
    };
  }

  global.LiamMethods = {
    ENGINE_VERSION,
    DEFAULT_MAX_DATA_AGE_MS,
    PAIR_SPECS,
    TF_CONFIG,
    METHOD_CATALOG,
    getPairSpec,
    formatPrice,
    toPips,
    getWibContext,
    getNySessionContext,
    getCandleCloseTimestamp,
    buildDeterministicSignalId,
    clearLockedSignal,
    analyzeDealingRange,
    buildSignalSetup,
    calculatePositionSize,
    evaluateRunningPositionMetrics,
    calculateManualTpMetrics,
    evaluateNewsLockStatus
  };
})(window);
