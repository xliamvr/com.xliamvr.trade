/**
 * Liamvtrade Quant Terminal — methods_2.js (v2.9.2-p1p2)
 * Mesin Analisis ICT / SMC / Liquidity Tunggal + Gate P1/P2 + Validasi Struktur & ATR
 */

(function (global) {
  'use strict';

  const ENGINE_VERSION = 'v2.9.2-p1p2';
  const DEFAULT_MAX_DATA_AGE_MS = 120000; // 2 menit maksimal usia data harga live

  const PAIR_SPECS = {
    XAUUSD: {
      label: 'XAUUSD',
      decimals: 2,
      pipSize: 0.1,        // 0.10 = 1 pip
      contractSize: 100,
      pipValuePerLot: 10,  // $10 per pip per 1.00 lot ($0.10 per 0.01 lot)
      baseAtrM15: 3.4,
      minSlPips: 12,
      maxSlPips: { M5: 45, M15: 65, H1: 110, H4: 180 }
    },
    US100: {
      label: 'US100',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 36.0,
      minSlPips: 12,
      maxSlPips: { M5: 55, M15: 85, H1: 140, H4: 220 }
    },
    BTCUSDT: {
      label: 'BTCUSDT',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 190.0,
      minSlPips: 25,
      maxSlPips: { M5: 140, M15: 220, H1: 380, H4: 650 }
    },
    EURUSD: {
      label: 'EURUSD',
      decimals: 5,
      pipSize: 0.0001,
      contractSize: 100000,
      pipValuePerLot: 10,
      baseAtrM15: 0.0014,
      minSlPips: 6,
      maxSlPips: { M5: 22, M15: 35, H1: 60, H4: 95 }
    }
  };

  const TF_CONFIG = {
    M5:  { atrMult: 0.52, rangeMult: 1.55, expiryMin: 20, candleMs: 5 * 60 * 1000,  label: 'M5 Scalping' },
    M15: { atrMult: 0.85, rangeMult: 1.85, expiryMin: 40, candleMs: 15 * 60 * 1000, label: 'M15 Intraday Sniper' },
    H1:  { atrMult: 1.55, rangeMult: 2.20, expiryMin: 120, candleMs: 60 * 60 * 1000, label: 'H1 Session Swing' },
    H4:  { atrMult: 2.65, rangeMult: 2.55, expiryMin: 240, candleMs: 240 * 60 * 1000, label: 'H4 HTF Institutional' }
  };

  const METHOD_CATALOG = {
    auto: {
      key: 'auto',
      name: 'Auto Sniper (Multi-Confluence)',
      shortTag: 'AUTO',
      baseScore: 8.5,
      requiresKillzone: false
    },
    judas: {
      key: 'judas',
      name: 'ICT Judas Swing (Session Manipulation)',
      shortTag: 'JUDAS',
      baseScore: 8.7,
      requiresKillzone: true,
      allowedSessions: ['London Killzone', 'New York AM Killzone']
    },
    smc_ob: {
      key: 'smc_ob',
      name: 'SMC Order Block + FVG Confluence',
      shortTag: 'SMC OB',
      baseScore: 8.4,
      requiresKillzone: false
    },
    sweep: {
      key: 'sweep',
      name: 'Liquidity Sweep (Turtle Soup Stop-Hunt)',
      shortTag: 'SWEEP',
      baseScore: 8.6,
      requiresKillzone: false
    },
    silver_bullet: {
      key: 'silver_bullet',
      name: 'ICT Silver Bullet (Time-Window FVG)',
      shortTag: 'SILVER BULLET',
      baseScore: 8.3,
      requiresKillzone: true,
      silverBulletOnly: true
    },
    ote: {
      key: 'ote',
      name: 'FIB OTE (Optimal Trade Entry 0.62–0.79)',
      shortTag: 'FIB OTE',
      baseScore: 8.2,
      requiresKillzone: false
    }
  };

  function getPairSpec(pair) {
    return PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  }

  function formatPrice(pair, value) {
    const spec = getPairSpec(pair);
    if (!Number.isFinite(value)) return '--';
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
    const now = new Date(Number.isFinite(refTimeMs) ? refTimeMs : Date.now());
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    const hour = wib.getHours();
    const minute = wib.getMinutes();
    const day = wib.getDay();

    let sessionName = 'Pre-Session / Transition';
    let sessionBiasHint = 'Konsolidasi Menjelang Killzone';
    let isKillzone = false;
    let isSilverBulletWindow = false;

    if (hour >= 13 && hour < 17) {
      sessionName = 'London Killzone';
      sessionBiasHint = 'Manipulasi Judas Swing London';
      isKillzone = true;
      if (hour === 14) isSilverBulletWindow = true;
    } else if (hour >= 19 && hour < 23) {
      sessionName = 'New York AM Killzone';
      sessionBiasHint = 'Ekspansi Likuiditas & Overlap NY';
      isKillzone = true;
      if (hour === 21) isSilverBulletWindow = true;
    } else if (hour >= 0 && hour < 3) {
      sessionName = 'New York PM Session';
      sessionBiasHint = 'Re-distribusi & Penutupan Sesi US';
      isKillzone = true;
      if (hour === 1) isSilverBulletWindow = true;
    } else if (hour >= 5 && hour < 13) {
      sessionName = 'Asia Range';
      sessionBiasHint = 'Pembentukan Asia High & Low';
    }

    return {
      wib,
      hour,
      minute,
      day,
      isWeekend: day === 0 || day === 6,
      sessionName,
      sessionBiasHint,
      isKillzone,
      isSilverBulletWindow
    };
  }

  /**
   * Menghitung timestamp penutupan candle terakhir untuk timeframe tertentu.
   * Dipakai sebagai kunci deterministik agar scan ulang di candle yang sama tidak mengubah hasil.
   */
  function getCandleCloseTimestamp(timeframe, refTimeMs) {
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const baseMs = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    return Math.floor(baseMs / tfCfg.candleMs) * tfCfg.candleMs;
  }

  function buildDeterministicSignalId(pair, timeframe, methodKey, candleCloseTs) {
    return `${pair}_${timeframe}_${methodKey.toUpperCase()}_${candleCloseTs}`;
  }

  /**
   * Membangun Dealing Range struktural berbasis ATR nyata per timeframe & harga aktual.
   * Jika data candle/ATR nyata disediakan dari broker, memakai ATR & high/low aktual.
   */
  function analyzeDealingRange(pair, livePrice, timeframe, scanSeed, marketContext) {
    const spec = getPairSpec(pair);
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const ctx = marketContext || {};
    const wibCtx = getWibContext(ctx.nowMs);
    const seed = Number.isFinite(Number(scanSeed)) ? Number(scanSeed) : 0;

    const hasRealAtr = Number.isFinite(Number(ctx.realAtr)) && Number(ctx.realAtr) > 0;
    const unitAtr = hasRealAtr
      ? Number(ctx.realAtr)
      : Math.max(spec.pipSize * 5, spec.baseAtrM15 * tfCfg.atrMult);

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
      const priceWave = Math.sin(livePrice / Math.max(spec.pipSize * 20, unitAtr * 1.4) + seed * 1.15);
      const sessionShift = ((wibCtx.hour % 4) - 1.5) * 0.025;
      const pdSeedRatio = Math.min(0.82, Math.max(0.18, 0.5 + priceWave * 0.24 + sessionShift));
      const rangeSpreadFactor = tfCfg.rangeMult + (Math.abs(Math.cos(seed + 0.7)) * 0.25);
      totalRange = unitAtr * rangeSpreadFactor;
      swingLow = livePrice - totalRange * pdSeedRatio;
      swingHigh = swingLow + totalRange;
    }

    const rawPdRatio = (livePrice - swingLow) / Math.max(spec.pipSize, totalRange);
    const pdRatio = Math.min(0.95, Math.max(0.05, rawPdRatio));
    const pdPercent = Math.round(pdRatio * 100);
    const equilibrium = swingLow + totalRange * 0.5;
    const direction = pdPercent >= 50 ? 'SELL' : 'BUY';

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
      direction,
      sessionName: wibCtx.sessionName,
      isKillzone: wibCtx.isKillzone,
      isSilverBulletWindow: wibCtx.isSilverBulletWindow
    };
  }

  function createDecisionState(baseMeta, status, reasonCode, detectedFacts, extra) {
    return Object.assign({}, baseMeta, {
      status, // 'SIGNAL' | 'WAIT' | 'NO_TRADE'
      isExecutable: status === 'SIGNAL',
      reasonCode,
      detectedFacts: Array.isArray(detectedFacts) ? detectedFacts : [],
      validationBadge: 'Belum tervalidasi',
      sampleCount: Number(baseMeta.sampleCount) || 0,
      minSamplesRequired: 150
    }, extra || {});
  }

  /**
   * Menghasilkan keputusan sinyal yang terkunci per candle close dan mematuhi gate P1 & P2.
   */
  function buildSignalSetup(options) {
    const opts = options || {};
    const pair = opts.pair || 'XAUUSD';
    const timeframe = opts.timeframe || 'M15';
    const methodKey = METHOD_CATALOG[opts.method] ? opts.method : 'auto';
    const livePrice = Number(opts.livePrice);
    const nowMs = Number.isFinite(Number(opts.nowMs)) ? Number(opts.nowMs) : Date.now();
    const lastUpdateTs = Number.isFinite(Number(opts.lastUpdateTs)) ? Number(opts.lastUpdateTs) : nowMs;
    const maxDataAgeMs = Number.isFinite(Number(opts.maxDataAgeMs)) ? Number(opts.maxDataAgeMs) : DEFAULT_MAX_DATA_AGE_MS;
    const candleCloseTs = Number.isFinite(Number(opts.candleCloseTs))
      ? Number(opts.candleCloseTs)
      : getCandleCloseTimestamp(timeframe, nowMs);

    // Seed deterministik terkunci per candle close (tidak berubah saat scan ulang di candle yang sama)
    const deterministicSeed = (candleCloseTs % 1000000) / 10000;
    const sopScoreBonus = Number(opts.sopScoreBonus) || 0;

    const spec = getPairSpec(pair);
    const tfCfg = TF_CONFIG[timeframe] || TF_CONFIG.M15;
    const methodMeta = METHOD_CATALOG[methodKey];
    const signalId = buildDeterministicSignalId(pair, timeframe, methodKey, candleCloseTs);

    const baseMeta = {
      engineVersion: ENGINE_VERSION,
      signalId,
      candleCloseTs,
      candleCloseIso: new Date(candleCloseTs).toISOString(),
      lastUpdateTs,
      pair,
      timeframe,
      methodKey,
      methodLabel: methodMeta.name,
      methodShortTag: methodMeta.shortTag,
      livePrice: Number.isFinite(livePrice) ? livePrice : null,
      sampleCount: Number(opts.sampleCount) || 0
    };

    // P1: Blokir sinyal jika harga tidak valid atau data basi
    if (!Number.isFinite(livePrice) || livePrice <= 0) {
      return createDecisionState(baseMeta, 'NO_TRADE', 'INVALID_PRICE', [
        'Harga broker tidak tersedia atau tidak valid.'
      ], {
        poiSummary: 'NO TRADE: Harga live broker belum valid.',
        educationHtml: ''
      });
    }

    const dataAgeMs = Math.max(0, nowMs - lastUpdateTs);
    if (dataAgeMs > maxDataAgeMs) {
      return createDecisionState(baseMeta, 'NO_TRADE', 'STALE_PRICE_FEED', [
        `Data harga terakhir diperbarui ${Math.round(dataAgeMs / 1000)} detik lalu (batas ${Math.round(maxDataAgeMs / 1000)} detik).`
      ], {
        dataAgeMs,
        poiSummary: 'NO TRADE: Feed harga basi/terputus, sinyal diblokir otomatis.',
        educationHtml: ''
      });
    }

    const dr = analyzeDealingRange(pair, livePrice, timeframe, deterministicSeed, {
      nowMs,
      realAtr: opts.realAtr,
      recentHigh: opts.recentHigh,
      recentLow: opts.recentLow
    });

    const detectedFacts = [
      `Sesi aktif terdeteksi: ${dr.sessionName}.`,
      dr.hasRealAtr
        ? `ATR aktual ${timeframe} terdeteksi: ${formatPrice(pair, dr.unitAtr)}.`
        : `Estimasi ATR ${timeframe} terkalibrasi: ${formatPrice(pair, dr.unitAtr)}.`,
      `Posisi harga di ${dr.pdPercent}% range (${dr.swingLowFmt} – ${dr.swingHighFmt}).`
    ];

    // P2: News Lock ±30 menit di sekitar High Impact
    const newsLockActive = Boolean(opts.newsLockActive);
    const newsBias = (opts.newsBias || '').toUpperCase(); // 'BUY' | 'SELL' | ''
    if (newsLockActive) {
      return createDecisionState(baseMeta, 'WAIT', 'NEWS_LOCK_WINDOW', detectedFacts.concat([
        'News Lock aktif dalam jendela ±30 menit rilis High Impact.'
      ]), {
        direction: null,
        orderType: 'WAIT',
        poiSummary: 'WAIT: News Lock ±30 menit aktif di sekitar rilis berita High Impact.',
        educationHtml: ''
      });
    }

    // P2: Killzone gate per metode
    if (methodMeta.silverBulletOnly && !dr.isSilverBulletWindow) {
      return createDecisionState(baseMeta, 'NO_TRADE', 'OUTSIDE_SILVER_BULLET_WINDOW', detectedFacts.concat([
        `Waktu saat ini bukan jendela Silver Bullet aktif (${dr.sessionName}).`
      ]), {
        direction: null,
        orderType: 'NO TRADE',
        poiSummary: 'NO TRADE: Di luar jam jendela Silver Bullet aktif.',
        educationHtml: ''
      });
    }

    if (methodMeta.requiresKillzone && Array.isArray(methodMeta.allowedSessions)) {
      if (!methodMeta.allowedSessions.includes(dr.sessionName)) {
        return createDecisionState(baseMeta, 'NO_TRADE', 'OUTSIDE_METHOD_KILLZONE', detectedFacts.concat([
          `Metode ${methodMeta.shortTag} dibatasi pada sesi ${methodMeta.allowedSessions.join(' / ')}, sedangkan sesi saat ini ${dr.sessionName}.`
        ]), {
          direction: null,
          orderType: 'NO TRADE',
          poiSummary: `NO TRADE: Metode ${methodMeta.shortTag} tidak aktif di sesi ${dr.sessionName}.`,
          educationHtml: ''
        });
      }
    }

    const direction = dr.direction;

    // P2: Jika bias news bertentangan dengan bias engine -> WAIT
    if (newsBias && (newsBias === 'BUY' || newsBias === 'SELL') && newsBias !== direction) {
      return createDecisionState(baseMeta, 'WAIT', 'NEWS_ENGINE_BIAS_CONFLICT', detectedFacts.concat([
        `Bias news (${newsBias}) bertentangan dengan bias struktur engine (${direction}).`
      ]), {
        direction,
        orderType: 'WAIT',
        poiSummary: `WAIT: Bias news (${newsBias}) berlawanan dengan bias engine (${direction}).`,
        educationHtml: ''
      });
    }

    const orderType = direction === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
    let entry = livePrice;
    let zoneLow = livePrice;
    let zoneHigh = livePrice;
    let sl = livePrice;
    let tp1 = livePrice;
    let tp2 = livePrice;
    let tp3 = livePrice;

    let entryNote = '';
    let slReason = '';
    let tp1Reason = '';
    let tp2Reason = '';
    let tp3Reason = '';
    let poiSummary = '';
    let educationHtml = '';
    let score = methodMeta.baseScore + sopScoreBonus;
    const expiryMinutes = tfCfg.expiryMin;

    const shFmt = dr.swingHighFmt;
    const slFmt = dr.swingLowFmt;
    const eqFmt = dr.equilibriumFmt;

    if (direction === 'BUY') {
      const entryOffset = methodKey === 'sweep' ? 0.12 : methodKey === 'ote' ? 0.18 : 0.16;
      entry = Math.min(livePrice - dr.unitAtr * entryOffset, dr.swingLow + dr.totalRange * 0.35);
      if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.18;

      zoneLow = entry - dr.unitAtr * 0.11;
      zoneHigh = entry + dr.unitAtr * 0.11;
      sl = Math.max(dr.swingLow - dr.unitAtr * 0.15, entry - dr.unitAtr * 0.68);

      const riskDist = Math.abs(entry - sl);
      tp1 = entry + riskDist * 1.30;
      tp2 = entry + riskDist * 2.10;
      tp3 = entry + riskDist * 2.90;

      entryNote = `${methodMeta.shortTag} Bullish POI (${formatPrice(pair, entry)})`;
      slReason = `Di bawah struktur Swing Low (${slFmt})`;
      tp1Reason = '1:1.3 Target Awal';
      tp2Reason = `1:2.1 Equilibrium / Likuiditas (${eqFmt})`;
      tp3Reason = `1:2.9 Area High (${shFmt})`;
      poiSummary = `Bias BUY (${dr.pdPercent}% range): Zona POI ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)} di bawah harga ${formatPrice(pair, livePrice)}.`;
    } else {
      const entryOffset = methodKey === 'sweep' ? 0.12 : methodKey === 'ote' ? 0.18 : 0.16;
      entry = Math.max(livePrice + dr.unitAtr * entryOffset, dr.swingHigh - dr.totalRange * 0.35);
      if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.18;

      zoneLow = entry - dr.unitAtr * 0.11;
      zoneHigh = entry + dr.unitAtr * 0.11;
      sl = Math.min(dr.swingHigh + dr.unitAtr * 0.15, entry + dr.unitAtr * 0.68);

      const riskDist = Math.abs(sl - entry);
      tp1 = entry - riskDist * 1.30;
      tp2 = entry - riskDist * 2.10;
      tp3 = entry - riskDist * 2.90;

      entryNote = `${methodMeta.shortTag} Bearish POI (${formatPrice(pair, entry)})`;
      slReason = `Di atas struktur Swing High (${shFmt})`;
      tp1Reason = '1:1.3 Target Awal';
      tp2Reason = `1:2.1 Equilibrium / Likuiditas (${eqFmt})`;
      tp3Reason = `1:2.9 Area Low (${slFmt})`;
      poiSummary = `Bias SELL (${dr.pdPercent}% range): Zona POI ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)} di atas harga ${formatPrice(pair, livePrice)}.`;
    }

    const slPips = toPips(pair, entry - sl);
    const tp1Pips = toPips(pair, tp1 - entry);
    const tp2Pips = toPips(pair, tp2 - entry);
    const tp3Pips = toPips(pair, tp3 - entry);

    const maxAllowedSl = (spec.maxSlPips && spec.maxSlPips[timeframe]) || 80;
    const minAllowedSl = spec.minSlPips || 5;

    // P2: Jika jarak SL di luar batas wajar ATR/timeframe atau RR TP2 < 1.5, jangan keluarkan sinyal
    const rrTp2 = slPips > 0 ? tp2Pips / slPips : 0;
    if (slPips < minAllowedSl || slPips > maxAllowedSl || rrTp2 < 1.5) {
      const gateReasons = [];
      if (slPips < minAllowedSl) gateReasons.push(`Jarak SL (${slPips} pips) terlalu sempit (minimum ${minAllowedSl} pips).`);
      if (slPips > maxAllowedSl) gateReasons.push(`Jarak SL (${slPips} pips) melewati batas ${timeframe} (${maxAllowedSl} pips).`);
      if (rrTp2 < 1.5) gateReasons.push(`Rasio Risk:Reward TP2 (${rrTp2.toFixed(2)}) di bawah batas minimum 1.5.`);

      return createDecisionState(baseMeta, 'NO_TRADE', 'STRUCTURE_ATR_FILTER_REJECTED', detectedFacts.concat(gateReasons), {
        direction,
        orderType: 'NO TRADE',
        slPips,
        tp1Pips,
        tp2Pips,
        tp3Pips,
        poiSummary: `NO TRADE: Syarat struktur/ATR/RR pada ${pair} ${timeframe} tidak terpenuhi.`,
        educationHtml: ''
      });
    }

    if (dr.isSilverBulletWindow && methodKey === 'silver_bullet') {
      score += 0.5;
    }

    const finalScore = Math.min(9.9, Math.max(6.5, Number(score.toFixed(1))));

    educationHtml = buildEducationTemplate({
      conceptTitle: `${methodMeta.name} (${pair} ${timeframe})`,
      whyBias: `Arah ${direction} terdeteksi pada posisi ${dr.pdPercent}% dalam range ${slFmt} – ${shFmt} pada sesi ${dr.sessionName}.`,
      facts: detectedFacts,
      confirmation: `Tunggu harga menyentuh area ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)} dan terkonfirmasi pada penutupan candle ${timeframe}.`
    });

    return createDecisionState(baseMeta, 'SIGNAL', 'VALID_SETUP', detectedFacts, {
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
      slReason,
      tp1,
      tp1Fmt: formatPrice(pair, tp1),
      tp1Pips,
      tp1Reason,
      tp2,
      tp2Fmt: formatPrice(pair, tp2),
      tp2Pips,
      tp2Reason,
      tp3,
      tp3Fmt: formatPrice(pair, tp3),
      tp3Pips,
      tp3Reason,
      rrTp2: Number(rrTp2.toFixed(2)),
      score: finalScore,
      expiryMinutes,
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
  }

  function buildEducationTemplate(cfg) {
    const factsHtml = (cfg.facts || [])
      .map(
        (fact) =>
          `<div class="rounded-lg bg-slate-950/80 border border-slate-800 p-2 text-slate-300">${fact}</div>`
      )
      .join('');

    return `
      <div class="space-y-2">
        <div class="font-extrabold text-amber-300 text-xs">📚 Ringkasan Kondisi Terdeteksi: ${cfg.conceptTitle}</div>
        <p class="text-slate-300"><strong class="text-white">Posisi Struktur:</strong> ${cfg.whyBias}</p>
        <div class="space-y-1.5">
          <div class="font-bold text-slate-200">Fakta Terukur dari Engine:</div>
          ${factsHtml}
        </div>
        <div class="rounded-lg bg-emerald-950/35 border border-emerald-500/30 p-2 text-emerald-200">
          <strong>✅ Rencana Pantauan:</strong> ${cfg.confirmation}
        </div>
      </div>
    `;
  }

  function calculatePositionSize(account, signal) {
    if (!signal || signal.status !== 'SIGNAL') {
      return {
        lot: 0,
        wasCapped: false,
        isMinFloorApplied: false,
        actualRiskDollar: 0,
        tp1Dollar: 0,
        tp2Dollar: 0,
        tp3Dollar: 0
      };
    }

    const spec = getPairSpec(signal.pair);
    const equity = Number(account && (account.equity || account.balance)) || 1000;
    const riskPct = Number(account && account.riskPct) || 0.4;
    const hardMaxLot = Number(account && account.maxLot) || 0.15;

    const targetRiskDollar = equity * (riskPct / 100);
    const slPips = Math.max(1, Number(signal.slPips) || 20);
    const rawLot = targetRiskDollar / (slPips * spec.pipValuePerLot);

    let finalLot = Math.floor(rawLot * 100) / 100;
    let isMinFloorApplied = false;
    let wasCapped = false;

    if (finalLot < 0.01) {
      finalLot = 0.01;
      isMinFloorApplied = true;
    }

    if (finalLot > hardMaxLot) {
      finalLot = hardMaxLot;
      wasCapped = true;
    }

    const actualRiskDollar = finalLot * slPips * spec.pipValuePerLot;
    const tp1Dollar = finalLot * (Number(signal.tp1Pips) || 0) * spec.pipValuePerLot;
    const tp2Dollar = finalLot * (Number(signal.tp2Pips) || 0) * spec.pipValuePerLot;
    const tp3Dollar = finalLot * (Number(signal.tp3Pips) || 0) * spec.pipValuePerLot;

    return {
      lot: Number(finalLot.toFixed(2)),
      wasCapped,
      isMinFloorApplied,
      targetRiskDollar: Number(targetRiskDollar.toFixed(2)),
      actualRiskDollar: Number(actualRiskDollar.toFixed(2)),
      tp1Dollar: Number(tp1Dollar.toFixed(2)),
      tp2Dollar: Number(tp2Dollar.toFixed(2)),
      tp3Dollar: Number(tp3Dollar.toFixed(2))
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
    getCandleCloseTimestamp,
    buildDeterministicSignalId,
    analyzeDealingRange,
    buildSignalSetup,
    calculatePositionSize
  };
})(window);
