/**
 * Liamvtrade Quant Terminal — methods.js (v4.0-ohlc-strict)
 * Mesin 6 Metode Analisis ICT / SMC / Liquidity Berbasis Data Candle OHLC Nyata,
 * Detektor Ketat (No Fallback SIGNAL), Gate RR >= 1.5, Gate News ±30m & Actual vs Forecast.
 */

(function (global) {
  'use strict';

  const ENGINE_VERSION = 'v4.0-ohlc-strict';
  const DEFAULT_MAX_DATA_AGE_MS = 120000;
  const NEWS_LOCK_WINDOW_MS = 30 * 60 * 1000;
  const MIN_RR_TP1 = 1.5;

  const PAIR_SPECS = {
    XAUUSD: {
      label: 'XAUUSD',
      decimals: 2,
      pipSize: 0.1,
      contractSize: 100,
      pipValuePerLot: 10,
      baseAtrM15: 3.2,
      minSlPips: 8,
      maxSlPips: { M5: 55, M15: 85, H1: 140, H4: 240 },
      defaultSpreadPips: 2.5
    },
    US100: {
      label: 'US100',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 34.0,
      minSlPips: 10,
      maxSlPips: { M5: 70, M15: 110, H1: 180, H4: 300 },
      defaultSpreadPips: 2.0
    },
    BTCUSDT: {
      label: 'BTCUSDT',
      decimals: 2,
      pipSize: 1.0,
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 180.0,
      minSlPips: 20,
      maxSlPips: { M5: 160, M15: 260, H1: 450, H4: 750 },
      defaultSpreadPips: 15.0
    },
    EURUSD: {
      label: 'EURUSD',
      decimals: 5,
      pipSize: 0.0001,
      contractSize: 100000,
      pipValuePerLot: 10,
      baseAtrM15: 0.0014,
      minSlPips: 5,
      maxSlPips: { M5: 25, M15: 40, H1: 70, H4: 120 },
      defaultSpreadPips: 1.0
    }
  };

  const TF_CONFIG = {
    M5:  { atrMult: 0.45, expiryMin: 25,  candleMs: 5 * 60 * 1000,   label: 'M5 Scalping' },
    M15: { atrMult: 0.80, expiryMin: 60,  candleMs: 15 * 60 * 1000,  label: 'M15 Intraday' },
    H1:  { atrMult: 1.55, expiryMin: 180, candleMs: 60 * 60 * 1000,  label: 'H1 Session Swing' },
    H4:  { atrMult: 2.75, expiryMin: 360, candleMs: 240 * 60 * 1000, label: 'H4 HTF Swing' }
  };

  const METHOD_CATALOG = {
    auto: {
      key: 'auto',
      name: 'Auto Sniper (Multi-Confluence)',
      shortTag: 'AUTO'
    },
    sweep: {
      key: 'sweep',
      name: 'Liquidity Sweep + MSS',
      shortTag: 'SWEEP'
    },
    judas: {
      key: 'judas',
      name: 'ICT Judas Swing (Asia Range Manipulation)',
      shortTag: 'JUDAS'
    },
    smc_ob: {
      key: 'smc_ob',
      name: 'SMC Order Block + FVG Confluence',
      shortTag: 'SMC OB'
    },
    silver_bullet: {
      key: 'silver_bullet',
      name: 'ICT Silver Bullet (Time-Window FVG)',
      shortTag: 'SILVER BULLET'
    },
    ote: {
      key: 'ote',
      name: 'FIB OTE (0.62–0.79 / Entry 0.705)',
      shortTag: 'FIB OTE'
    }
  };

  const lockedSignalCache = new Map();
  const lockedPairCandleBias = new Map();

  function pruneCacheMap(map, maxSize) {
    if (map.size <= maxSize) return;
    const excess = map.size - maxSize;
    let count = 0;
    for (const k of map.keys()) {
      map.delete(k);
      count += 1;
      if (count >= excess) break;
    }
  }

  function normalizePair(pair) {
    const clean = String(pair || 'XAUUSD').trim().toUpperCase();
    if (clean === 'BTC' || clean === 'BTCUSD') return 'BTCUSDT';
    if (clean === 'NDX' || clean === 'NASDAQ') return 'US100';
    if (clean === 'GOLD' || clean === 'XAU') return 'XAUUSD';
    if (clean === 'EUR') return 'EURUSD';
    return PAIR_SPECS[clean] ? clean : 'XAUUSD';
  }

  function getPairSpec(pair) {
    const key = normalizePair(pair);
    return PAIR_SPECS[key] || PAIR_SPECS.XAUUSD;
  }

  function formatPrice(pair, value) {
    const spec = getPairSpec(pair);
    if (!Number.isFinite(Number(value))) return '--';
    return Number(value).toFixed(spec.decimals);
  }

  function toPips(pair, priceDiff) {
    const key = normalizePair(pair);
    const spec = getPairSpec(key);
    const raw = Math.abs(Number(priceDiff) || 0) / spec.pipSize;
    return spec.decimals === 2 && key === 'XAUUSD'
      ? Number(raw.toFixed(1))
      : Math.round(raw);
  }

  function formatIsoTime(ts) {
    if (!Number.isFinite(Number(ts)) || Number(ts) <= 0) return 'N/A';
    return new Date(Number(ts)).toISOString();
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

  function getNyParts(refTimeMs) {
    const ms = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    const dateObj = new Date(ms);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(dateObj);

    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }

    return {
      year: map.year,
      month: map.month,
      day: map.day,
      dateKey: `${map.year}-${map.month}-${map.day}`,
      nyHour: Number(map.hour) || 0,
      nyMinute: Number(map.minute) || 0,
      nyWeekday: map.weekday || 'Mon'
    };
  }

  function getNySessionContext(refTimeMs) {
    const ms = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
    const p = getNyParts(ms);
    const nyHour = p.nyHour;
    const nyMinute = p.nyMinute;
    const nyWeekday = p.nyWeekday;

    const isWeekend =
      nyWeekday === 'Sat' ||
      nyWeekday === 'Sun' ||
      (nyWeekday === 'Fri' && nyHour >= 17);

    let sessionName = 'Off-Session / NY Close';
    let sessionBiasHint = 'Konsolidasi / Transisi Sesi';

    const isAsiaSession = nyHour >= 19 || nyHour < 0;
    const isLondonJudasWindow = nyHour >= 2 && nyHour < 5;
    const isNyOpenJudasWindow = nyHour >= 7 && nyHour < 9;
    const isJudasWindow = isLondonJudasWindow || isNyOpenJudasWindow;

    const silverBulletWindow =
      (nyHour === 3) ? '03:00–04:00 NY' :
      (nyHour === 10) ? '10:00–11:00 NY' :
      (nyHour === 14) ? '14:00–15:00 NY' :
      null;
    const isSilverBulletWindow = Boolean(silverBulletWindow);

    if (isLondonJudasWindow) {
      sessionName = 'London Killzone';
      sessionBiasHint = 'Pembukaan London & Potensi Judas Swing (02–05 NY)';
    } else if (nyHour >= 7 && nyHour < 11) {
      sessionName = 'New York AM Killzone';
      sessionBiasHint = 'Ekspansi Likuiditas NY AM (07–11 NY)';
    } else if (nyHour >= 13 && nyHour < 16) {
      sessionName = 'New York PM Session';
      sessionBiasHint = 'Re-distribusi Sesi US (13–16 NY)';
    } else if (nyHour >= 19 || nyHour < 2) {
      sessionName = 'Asia Range';
      sessionBiasHint = 'Pembentukan Range Asia (19:00–00:00 NY)';
    }

    return {
      year: p.year,
      month: p.month,
      day: p.day,
      dateKey: p.dateKey,
      nyHour,
      nyMinute,
      nyWeekday,
      isWeekend,
      sessionName,
      sessionBiasHint,
      isAsiaSession,
      isLondonJudasWindow,
      isNyOpenJudasWindow,
      isJudasWindow,
      isSilverBulletWindow,
      silverBulletWindow
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
    const cleanPair = normalizePair(pair);
    return `${cleanPair}_${timeframe}_${methodKey.toUpperCase()}_${candleCloseTs}`;
  }

  function clearLockedSignal(signalId) {
    if (signalId) {
      lockedSignalCache.delete(signalId);
    } else {
      lockedSignalCache.clear();
      lockedPairCandleBias.clear();
    }
  }

  // ============================================================================
  // NORMALISASI & PRIMITIF OHLC NYATA
  // ============================================================================

  function normalizeCandleArray(rawCandles) {
    if (!Array.isArray(rawCandles)) return [];
    const list = [];
    for (let i = 0; i < rawCandles.length; i += 1) {
      const c = rawCandles[i];
      if (!c) continue;
      // Mendukung format object { open, high, low, close, time/timestamp/ts } maupun array [openTime, open, high, low, close, ...]
      let open, high, low, close, ts;
      if (Array.isArray(c)) {
        ts = Number(c[0]);
        open = Number(c[1]);
        high = Number(c[2]);
        low = Number(c[3]);
        close = Number(c[4]);
      } else {
        ts = Number(c.timestampMs || c.timeMs || c.ts || c.time || c.openTime || 0);
        if (ts > 0 && ts < 1e12) ts = ts * 1000;
        open = Number(c.open !== undefined ? c.open : c.o);
        high = Number(c.high !== undefined ? c.high : c.h);
        low = Number(c.low !== undefined ? c.low : c.l);
        close = Number(c.close !== undefined ? c.close : c.c);
      }

      if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        continue;
      }
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
      const realHigh = Math.max(open, high, low, close);
      const realLow = Math.min(open, high, low, close);

      list.push({
        index: list.length,
        ts: Number.isFinite(ts) && ts > 0 ? ts : (i + 1) * 60000,
        open,
        high: realHigh,
        low: realLow,
        close,
        body: Math.abs(close - open),
        range: Math.max(1e-9, realHigh - realLow),
        isBull: close >= open,
        isBear: close < open
      });
    }
    list.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < list.length; i += 1) {
      list[i].index = i;
    }
    return list;
  }

  function calculateAtrSeries(candles, period) {
    const p = period || 14;
    if (!Array.isArray(candles) || candles.length === 0) return [];
    const trList = [];
    for (let i = 0; i < candles.length; i += 1) {
      const c = candles[i];
      if (i === 0) {
        trList.push(c.high - c.low);
      } else {
        const prevClose = candles[i - 1].close;
        const tr = Math.max(
          c.high - c.low,
          Math.abs(c.high - prevClose),
          Math.abs(c.low - prevClose)
        );
        trList.push(tr);
      }
    }

    const atrSeries = new Array(candles.length).fill(0);
    let sum = 0;
    for (let i = 0; i < trList.length; i += 1) {
      sum += trList[i];
      if (i < p) {
        atrSeries[i] = sum / (i + 1);
      } else {
        atrSeries[i] = (atrSeries[i - 1] * (p - 1) + trList[i]) / p;
      }
    }
    return atrSeries;
  }

  // Swing pivot fractal 3 kiri / 3 kanan
  function detectFractalSwings(candles, leftBars, rightBars) {
    const L = leftBars || 3;
    const R = rightBars || 3;
    const swingHighs = [];
    const swingLows = [];

    if (!Array.isArray(candles) || candles.length < L + R + 1) {
      return { swingHighs, swingLows };
    }

    for (let i = L; i < candles.length - R; i += 1) {
      const curr = candles[i];
      let isHigh = true;
      let isLow = true;

      for (let k = i - L; k <= i + R; k += 1) {
        if (k === i) continue;
        if (candles[k].high >= curr.high) isHigh = false;
        if (candles[k].low <= curr.low) isLow = false;
      }

      if (isHigh) {
        swingHighs.push({
          index: i,
          ts: curr.ts,
          price: curr.high,
          candle: curr
        });
      }
      if (isLow) {
        swingLows.push({
          index: i,
          ts: curr.ts,
          price: curr.low,
          candle: curr
        });
      }
    }

    return { swingHighs, swingLows };
  }

  // Displacement: body >= 1.5x ATR atau 3 candle searah
  function isDisplacementCandle(candles, idx, atrSeries) {
    const c = candles[idx];
    if (!c) return { valid: false, type: null, reason: '' };
    const atr = Math.max(1e-9, (atrSeries && atrSeries[idx]) || c.range);

    if (c.body >= 1.5 * atr) {
      return {
        valid: true,
        direction: c.isBull ? 'BUY' : 'SELL',
        reason: `body candle >= 1.5x ATR (${formatPrice('XAUUSD', c.body)} vs ${(1.5 * atr).toFixed(4)})`
      };
    }

    if (idx >= 2) {
      const c0 = candles[idx - 2];
      const c1 = candles[idx - 1];
      const c2 = candles[idx];
      const allBull = c0.isBull && c1.isBull && c2.isBull;
      const allBear = c0.isBear && c1.isBear && c2.isBear;
      if (allBull || allBear) {
        const totalMove = Math.abs(c2.close - c0.open);
        if (totalMove >= atr * 0.8) {
          return {
            valid: true,
            direction: allBull ? 'BUY' : 'SELL',
            reason: `3 candle searah (${allBull ? 'BULLISH' : 'BEARISH'})`
          };
        }
      }
    }

    return { valid: false, direction: null, reason: '' };
  }

  // FVG: celah candle 1 dan 3 (idx-2 dan idx), ukuran minimal 0.3 ATR + cek mitigasi
  function detectFVGs(candles, atrSeries, minAtrRatio) {
    const ratio = Number.isFinite(minAtrRatio) ? minAtrRatio : 0.3;
    const fvgs = [];
    if (!Array.isArray(candles) || candles.length < 3) return fvgs;

    for (let i = 2; i < candles.length; i += 1) {
      const c1 = candles[i - 2];
      const c3 = candles[i];
      const atr = Math.max(1e-9, (atrSeries && atrSeries[i]) || c3.range);
      const minGap = ratio * atr;

      // Bullish FVG: low candle 3 > high candle 1
      if (c3.low > c1.high) {
        const gapSize = c3.low - c1.high;
        if (gapSize >= minGap) {
          let mitigated = false;
          for (let j = i + 1; j < candles.length; j += 1) {
            // Dianggap termitigasi jika harga menembus masuk jauh / melewati zona FVG
            if (candles[j].low <= c1.high + gapSize * 0.25) {
              mitigated = true;
              break;
            }
          }
          fvgs.push({
            direction: 'BUY',
            top: c3.low,
            bottom: c1.high,
            ce: (c3.low + c1.high) / 2,
            size: gapSize,
            createdIndex: i,
            ts: c3.ts,
            mitigated
          });
        }
      }

      // Bearish FVG: high candle 3 < low candle 1
      if (c3.high < c1.low) {
        const gapSize = c1.low - c3.high;
        if (gapSize >= minGap) {
          let mitigated = false;
          for (let j = i + 1; j < candles.length; j += 1) {
            if (candles[j].high >= c3.high - gapSize * 0.25) {
              mitigated = true;
              break;
            }
          }
          fvgs.push({
            direction: 'SELL',
            top: c1.low,
            bottom: c3.high,
            ce: (c1.low + c3.high) / 2,
            size: gapSize,
            createdIndex: i,
            ts: c3.ts,
            mitigated
          });
        }
      }
    }

    return fvgs;
  }

  // OB: candle berlawanan terakhir sebelum displacement yang mematahkan struktur & berkaitan dengan FVG
  function detectOrderBlocks(candles, atrSeries, fvgs) {
    const obs = [];
    if (!Array.isArray(candles) || candles.length < 4) return obs;

    for (let i = 1; i < candles.length; i += 1) {
      const disp = isDisplacementCandle(candles, i, atrSeries);
      if (!disp.valid) continue;

      if (disp.direction === 'BUY') {
        // Cari candle bearish terakhir sebelum i
        let obCandle = null;
        for (let k = i - 1; k >= Math.max(0, i - 6); k -= 1) {
          if (candles[k].isBear) {
            obCandle = candles[k];
            break;
          }
        }
        if (!obCandle) continue;

        const matchingFvg = (fvgs || []).find((f) =>
          f.direction === 'BUY' &&
          f.createdIndex >= i - 1 &&
          f.createdIndex <= i + 2 &&
          f.bottom <= obCandle.high &&
          f.top >= obCandle.low
        );

        let mitigated = false;
        for (let j = i + 1; j < candles.length; j += 1) {
          if (candles[j].close < obCandle.low) {
            mitigated = true;
            break;
          }
        }

        obs.push({
          direction: 'BUY',
          top: obCandle.high,
          bottom: obCandle.low,
          mid50: (obCandle.high + obCandle.low) / 2,
          candleIndex: obCandle.index,
          displacementIndex: i,
          ts: obCandle.ts,
          hasFvgOverlap: Boolean(matchingFvg),
          fvg: matchingFvg || null,
          mitigated
        });
      } else if (disp.direction === 'SELL') {
        let obCandle = null;
        for (let k = i - 1; k >= Math.max(0, i - 6); k -= 1) {
          if (candles[k].isBull) {
            obCandle = candles[k];
            break;
          }
        }
        if (!obCandle) continue;

        const matchingFvg = (fvgs || []).find((f) =>
          f.direction === 'SELL' &&
          f.createdIndex >= i - 1 &&
          f.createdIndex <= i + 2 &&
          f.top >= obCandle.low &&
          f.bottom <= obCandle.high
        );

        let mitigated = false;
        for (let j = i + 1; j < candles.length; j += 1) {
          if (candles[j].close > obCandle.high) {
            mitigated = true;
            break;
          }
        }

        obs.push({
          direction: 'SELL',
          top: obCandle.high,
          bottom: obCandle.low,
          mid50: (obCandle.high + obCandle.low) / 2,
          candleIndex: obCandle.index,
          displacementIndex: i,
          ts: obCandle.ts,
          hasFvgOverlap: Boolean(matchingFvg),
          fvg: matchingFvg || null,
          mitigated
        });
      }
    }

    return obs;
  }

  // MSS / BOS: candle close melewati swing terakhir
  function detectStructureShifts(candles, swings) {
    const events = [];
    const highs = (swings && swings.swingHighs) || [];
    const lows = (swings && swings.swingLows) || [];

    for (let i = 1; i < candles.length; i += 1) {
      const c = candles[i];
      const prev = candles[i - 1];

      // Bullish break: close menembus swing high sebelumnya
      const lastHigh = highs.filter((h) => h.index < i).pop();
      if (lastHigh && c.close > lastHigh.price && prev.close <= lastHigh.price) {
        events.push({
          type: 'BOS_BULL',
          direction: 'BUY',
          level: lastHigh.price,
          index: i,
          ts: c.ts,
          swingIndex: lastHigh.index
        });
      }

      // Bearish break: close menembus swing low sebelumnya
      const lastLow = lows.filter((l) => l.index < i).pop();
      if (lastLow && c.close < lastLow.price && prev.close >= lastLow.price) {
        events.push({
          type: 'BOS_BEAR',
          direction: 'SELL',
          level: lastLow.price,
          index: i,
          ts: c.ts,
          swingIndex: lastLow.index
        });
      }
    }

    return events;
  }

  // Ekstraksi level likuiditas: PDH/PDL, Asia high/low, equal highs/lows, swing high/low
  function extractLiquidityLevels(candles, swings, pair) {
    const spec = getPairSpec(pair);
    const eqTol = Math.max(spec.pipSize * 1.5, ((candles[candles.length - 1] && candles[candles.length - 1].range) || spec.pipSize * 5) * 0.08);
    const levels = [];

    // 1. Swing High / Low
    for (const sh of (swings.swingHighs || [])) {
      levels.push({ kind: 'SWING_HIGH', side: 'HIGH', price: sh.price, index: sh.index, ts: sh.ts, label: `Swing High ${formatPrice(pair, sh.price)}` });
    }
    for (const sl of (swings.swingLows || [])) {
      levels.push({ kind: 'SWING_LOW', side: 'LOW', price: sl.price, index: sl.index, ts: sl.ts, label: `Swing Low ${formatPrice(pair, sl.price)}` });
    }

    // 2. Equal Highs / Equal Lows
    const highs = swings.swingHighs || [];
    for (let i = 0; i < highs.length; i += 1) {
      for (let j = i + 1; j < highs.length; j += 1) {
        if (Math.abs(highs[i].price - highs[j].price) <= eqTol) {
          const avg = (highs[i].price + highs[j].price) / 2;
          levels.push({ kind: 'EQH', side: 'HIGH', price: avg, index: highs[j].index, ts: highs[j].ts, label: `Equal Highs ${formatPrice(pair, avg)}` });
        }
      }
    }
    const lows = swings.swingLows || [];
    for (let i = 0; i < lows.length; i += 1) {
      for (let j = i + 1; j < lows.length; j += 1) {
        if (Math.abs(lows[i].price - lows[j].price) <= eqTol) {
          const avg = (lows[i].price + lows[j].price) / 2;
          levels.push({ kind: 'EQL', side: 'LOW', price: avg, index: lows[j].index, ts: lows[j].ts, label: `Equal Lows ${formatPrice(pair, avg)}` });
        }
      }
    }

    // 3. PDH / PDL & Asia High / Low berdasarkan tanggal NY
    const byDate = new Map();
    const asiaByDate = new Map();

    for (const c of candles) {
      const ny = getNyParts(c.ts);
      if (!byDate.has(ny.dateKey)) {
        byDate.set(ny.dateKey, { high: c.high, low: c.low, ts: c.ts });
      } else {
        const d = byDate.get(ny.dateKey);
        if (c.high > d.high) d.high = c.high;
        if (c.low < d.low) d.low = c.low;
      }

      // Asia range: 19:00–00:00 NY (nyHour >= 19)
      if (ny.nyHour >= 19) {
        if (!asiaByDate.has(ny.dateKey)) {
          asiaByDate.set(ny.dateKey, { high: c.high, low: c.low, ts: c.ts, endTs: c.ts });
        } else {
          const a = asiaByDate.get(ny.dateKey);
          if (c.high > a.high) a.high = c.high;
          if (c.low < a.low) a.low = c.low;
          a.endTs = c.ts;
        }
      }
    }

    const dateKeys = Array.from(byDate.keys()).sort();
    if (dateKeys.length >= 2) {
      const prevKey = dateKeys[dateKeys.length - 2];
      const prevDay = byDate.get(prevKey);
      levels.push({ kind: 'PDH', side: 'HIGH', price: prevDay.high, index: candles.length - 1, ts: prevDay.ts, label: `PDH ${formatPrice(pair, prevDay.high)}` });
      levels.push({ kind: 'PDL', side: 'LOW', price: prevDay.low, index: candles.length - 1, ts: prevDay.ts, label: `PDL ${formatPrice(pair, prevDay.low)}` });
    }

    const asiaKeys = Array.from(asiaByDate.keys()).sort();
    let latestAsia = null;
    if (asiaKeys.length > 0) {
      const lastAsiaKey = asiaKeys[asiaKeys.length - 1];
      latestAsia = Object.assign({ dateKey: lastAsiaKey }, asiaByDate.get(lastAsiaKey));
      levels.push({ kind: 'ASIA_HIGH', side: 'HIGH', price: latestAsia.high, index: candles.length - 1, ts: latestAsia.endTs, label: `Asia High ${formatPrice(pair, latestAsia.high)}` });
      levels.push({ kind: 'ASIA_LOW', side: 'LOW', price: latestAsia.low, index: candles.length - 1, ts: latestAsia.endTs, label: `Asia Low ${formatPrice(pair, latestAsia.low)}` });
    }

    return { levels, latestAsia };
  }

  // Sweep: wick menembus level, lalu close balik ke dalam dalam 1–3 candle
  function detectSweeps(candles, liquidityLevels, pair) {
    const sweeps = [];
    if (!Array.isArray(candles) || candles.length < 2) return sweeps;

    for (const lvl of (liquidityLevels || [])) {
      if (lvl.index >= candles.length - 1) continue;

      for (let startIdx = lvl.index + 1; startIdx < candles.length; startIdx += 1) {
        const maxWindow = Math.min(candles.length - 1, startIdx + 2); // total 1–3 candle window

        if (lvl.side === 'LOW') {
          // Wick tembus di bawah lvl.price, lalu close balik >= lvl.price dalam 1–3 candle
          let extremeLow = Infinity;
          let sweepCandle = null;
          for (let k = startIdx; k <= maxWindow; k += 1) {
            if (candles[k].low < lvl.price) {
              if (candles[k].low < extremeLow) extremeLow = candles[k].low;
              if (candles[k].close >= lvl.price) {
                sweepCandle = candles[k];
                break;
              }
            }
          }
          if (sweepCandle && Number.isFinite(extremeLow)) {
            sweeps.push({
              side: 'LOW',
              direction: 'BUY', // sweep low -> bias reversal/bullish
              level: lvl.price,
              levelLabel: lvl.label,
              levelKind: lvl.kind,
              extremePrice: extremeLow,
              candleIndex: sweepCandle.index,
              ts: sweepCandle.ts,
              timeIso: formatIsoTime(sweepCandle.ts)
            });
            break;
          }
        } else if (lvl.side === 'HIGH') {
          let extremeHigh = -Infinity;
          let sweepCandle = null;
          for (let k = startIdx; k <= maxWindow; k += 1) {
            if (candles[k].high > lvl.price) {
              if (candles[k].high > extremeHigh) extremeHigh = candles[k].high;
              if (candles[k].close <= lvl.price) {
                sweepCandle = candles[k];
                break;
              }
            }
          }
          if (sweepCandle && Number.isFinite(extremeHigh)) {
            sweeps.push({
              side: 'HIGH',
              direction: 'SELL', // sweep high -> bias reversal/bearish
              level: lvl.price,
              levelLabel: lvl.label,
              levelKind: lvl.kind,
              extremePrice: extremeHigh,
              candleIndex: sweepCandle.index,
              ts: sweepCandle.ts,
              timeIso: formatIsoTime(sweepCandle.ts)
            });
            break;
          }
        }
      }
    }

    sweeps.sort((a, b) => a.candleIndex - b.candleIndex);
    return sweeps;
  }

  // Bias HTF dari H4/H1: arah BOS terakhir di H4/H1 + posisi premium/discount di dealing range
  function computeHtfBias(h4Candles, h1Candles, entryCandles) {
    const h4Norm = normalizeCandleArray(h4Candles);
    const h1Norm = normalizeCandleArray(h1Candles);
    const src = h4Norm.length >= 10 ? h4Norm : (h1Norm.length >= 10 ? h1Norm : entryCandles);
    const tfTag = h4Norm.length >= 10 ? 'H4' : (h1Norm.length >= 10 ? 'H1' : 'TF');

    const swings = detectFractalSwings(src, 3, 3);
    const breaks = detectStructureShifts(src, swings);
    const lastBos = breaks.length > 0 ? breaks[breaks.length - 1] : null;

    const recentSlice = src.slice(-50);
    const rangeHigh = recentSlice.length ? Math.max.apply(null, recentSlice.map((c) => c.high)) : 0;
    const rangeLow = recentSlice.length ? Math.min.apply(null, recentSlice.map((c) => c.low)) : 0;
    const eq = (rangeHigh + rangeLow) / 2;
    const lastPrice = src.length ? src[src.length - 1].close : eq;
    const zone = rangeHigh > rangeLow ? (lastPrice <= eq ? 'DISCOUNT' : 'PREMIUM') : 'EQUILIBRIUM';

    let direction = null;
    if (lastBos) {
      direction = lastBos.direction;
    } else if (src.length >= 2) {
      direction = lastPrice >= src[src.length - 2].close ? 'BUY' : 'SELL';
    }

    return {
      direction,
      tfTag,
      lastBos,
      rangeHigh,
      rangeLow,
      equilibrium: eq,
      zone
    };
  }

  // ============================================================================
  // EVALUASI NEWS (ACTUAL VS FORECAST PER PAIR & GATE ±30 MENIT)
  // ============================================================================

  function inferNewsDirectionFromActualForecast(event, pair) {
    if (!event) return null;
    const explicitDir = String(event.direction || event.bias || '').toUpperCase();
    if (explicitDir === 'BUY' || explicitDir === 'BULLISH') return 'BUY';
    if (explicitDir === 'SELL' || explicitDir === 'BEARISH') return 'SELL';

    const actual = Number(event.actual);
    const forecast = Number(event.forecast);
    if (!Number.isFinite(actual) || !Number.isFinite(forecast)) return null;
    if (actual === forecast) return null;

    const cleanPair = normalizePair(pair);
    const title = String(event.title || event.name || '').toUpperCase();
    const isAbove = actual > forecast;

    // Aturan khusus CPI: di atas forecast biasanya bearish XAU, US100, dan EURUSD
    if (title.includes('CPI')) {
      if (cleanPair === 'XAUUSD' || cleanPair === 'US100' || cleanPair === 'EURUSD') {
        return isAbove ? 'SELL' : 'BUY';
      }
    }

    // Aturan umum per pair (data ekonomi USD/makro lebih kuat -> USD menguat -> XAU & EURUSD cenderung turun)
    if (cleanPair === 'XAUUSD' || cleanPair === 'EURUSD') {
      return isAbove ? 'SELL' : 'BUY';
    }
    if (cleanPair === 'US100') {
      return isAbove ? 'SELL' : 'BUY';
    }
    if (cleanPair === 'BTCUSDT') {
      return isAbove ? 'SELL' : 'BUY';
    }

    return null;
  }

  function evaluateNewsGate(opts, nowMs) {
    const events = Array.isArray(opts.highImpactEvents) ? opts.highImpactEvents : [];
    const pair = normalizePair(opts.pair);

    // 1. Cek news high impact dalam ±30 menit -> WAIT
    const nearEvent = events.find((ev) => {
      const evTs = Number(ev && (ev.timestampMs || ev.timeMs || ev.ts));
      return Number.isFinite(evTs) && Math.abs(nowMs - evTs) <= NEWS_LOCK_WINDOW_MS;
    });

    if (Boolean(opts.newsLockActive) || Boolean(nearEvent)) {
      const evTitle = nearEvent && nearEvent.title ? ` (${nearEvent.title})` : '';
      return {
        status: 'WAIT',
        reasonCode: 'NEWS_LOCK_30M',
        message: `WAIT: News high impact dalam ±30 menit${evTitle}. Dilarang entry pre-news / sekitar rilis.`,
        postReleaseBias: null,
        postReleaseReason: null
      };
    }

    // 2. Cek event yang baru saja dirilis (0 sampai 45 menit lalu) dengan actual & forecast tersedia
    let postReleaseBias = null;
    let postReleaseReason = null;

    for (let i = events.length - 1; i >= 0; i -= 1) {
      const ev = events[i];
      const evTs = Number(ev && (ev.timestampMs || ev.timeMs || ev.ts));
      if (!Number.isFinite(evTs)) continue;
      const diffMs = nowMs - evTs;
      if (diffMs > 0 && diffMs <= 45 * 60 * 1000 && ev.actual !== undefined && ev.actual !== null && ev.forecast !== undefined && ev.forecast !== null) {
        const inferred = inferNewsDirectionFromActualForecast(ev, pair);
        if (inferred) {
          postReleaseBias = inferred;
          postReleaseReason = `Rilis ${ev.title || 'Event'}: actual (${ev.actual}) vs forecast (${ev.forecast}) → ${inferred} pada ${pair}`;
          break;
        }
      }
    }

    const explicitNewsBias = String(opts.newsBias || '').toUpperCase();
    if (!postReleaseBias && (explicitNewsBias === 'BUY' || explicitNewsBias === 'SELL')) {
      postReleaseBias = explicitNewsBias;
      postReleaseReason = `Bias news terkonfirmasi: ${explicitNewsBias}`;
    }

    return {
      status: 'OK',
      reasonCode: 'NEWS_CLEAR',
      message: null,
      postReleaseBias,
      postReleaseReason
    };
  }

  // ============================================================================
  // PERHITUNGAN RR & TARGET LIKUIDITAS NYATA
  // ============================================================================

  function buildRealLiquidityTargets(direction, entry, sl, liquidityLevels, fallbackSwingHigh, fallbackSwingLow, pair) {
    const riskDist = Math.abs(entry - sl);
    if (!Number.isFinite(riskDist) || riskDist <= 0) return [];

    const candidates = [];
    for (const lvl of (liquidityLevels || [])) {
      if (direction === 'BUY' && lvl.price > entry + riskDist * 1.5) {
        candidates.push({ price: lvl.price, label: lvl.label });
      } else if (direction === 'SELL' && lvl.price < entry - riskDist * 1.5) {
        candidates.push({ price: lvl.price, label: lvl.label });
      }
    }

    if (direction === 'BUY') {
      if (Number.isFinite(fallbackSwingHigh) && fallbackSwingHigh > entry + riskDist * 1.5) {
        candidates.push({ price: fallbackSwingHigh, label: `Swing High ${formatPrice(pair, fallbackSwingHigh)}` });
      }
      candidates.sort((a, b) => a.price - b.price);
    } else {
      if (Number.isFinite(fallbackSwingLow) && fallbackSwingLow < entry - riskDist * 1.5) {
        candidates.push({ price: fallbackSwingLow, label: `Swing Low ${formatPrice(pair, fallbackSwingLow)}` });
      }
      candidates.sort((a, b) => b.price - a.price);
    }

    const uniqueTargets = [];
    const minStep = riskDist * 0.4;
    for (const c of candidates) {
      const tooClose = uniqueTargets.some((u) => Math.abs(u.price - c.price) < minStep);
      if (!tooClose) {
        const rr = Math.abs(c.price - entry) / riskDist;
        uniqueTargets.push({
          price: c.price,
          label: c.label,
          rr: Number(rr.toFixed(2))
        });
      }
      if (uniqueTargets.length >= 3) break;
    }

    return uniqueTargets;
  }

  function finalizeSetupWithGates(params) {
    const {
      pair,
      timeframe,
      methodKey,
      direction,
      entry,
      sl,
      invalidation,
      trigger,
      checklist,
      liquidityLevels,
      swingHigh,
      swingLow,
      htfBias,
      postReleaseBias,
      spreadPrice,
      atrNow,
      tfCfg,
      nowMs
    } = params;

    if (!Number.isFinite(entry) || !Number.isFinite(sl) || entry <= 0 || sl <= 0) {
      return { valid: false, reasonCode: 'INVALID_PRICE_LEVELS', reasonText: 'Level entry atau SL tidak valid.' };
    }

    if (direction === 'BUY' && !(sl < entry)) {
      return { valid: false, reasonCode: 'INVALID_SL_SIDE', reasonText: 'Untuk BUY, SL harus berada di bawah entry.' };
    }
    if (direction === 'SELL' && !(sl > entry)) {
      return { valid: false, reasonCode: 'INVALID_SL_SIDE', reasonText: 'Untuk SELL, SL harus berada di atas entry.' };
    }

    const isReversalSweep = methodKey === 'sweep' || methodKey === 'judas';
    const effectiveBias = postReleaseBias || (htfBias && htfBias.direction);
    if (effectiveBias && effectiveBias !== direction && !isReversalSweep) {
      return {
        valid: false,
        reasonCode: 'HTF_BIAS_MISMATCH',
        reasonText: `Arah ${direction} bertentangan dengan bias HTF/News (${effectiveBias}) dan bukan setup reversal sweep + MSS.`
      };
    }

    const targets = buildRealLiquidityTargets(direction, entry, sl, liquidityLevels, swingHigh, swingLow, pair);
    if (targets.length === 0) {
      return {
        valid: false,
        reasonCode: 'NO_REAL_LIQUIDITY_TP',
        reasonText: 'Tidak ditemukan likuiditas nyata (PDH/PDL, Asia range, atau swing) dengan RR >= 1:1.5.'
      };
    }

    const rrTp1 = targets[0].rr;
    if (rrTp1 < MIN_RR_TP1) {
      return {
        valid: false,
        reasonCode: 'RR_BELOW_1_5',
        reasonText: `RR ke TP1 (${rrTp1}) di bawah batas minimum 1:${MIN_RR_TP1}.`
      };
    }

    const finalChecklist = checklist.slice();
    if (postReleaseBias === direction) {
      finalChecklist.push(`✔ Konfirmasi rilis news searah ${direction}`);
    } else if (htfBias && htfBias.direction === direction) {
      finalChecklist.push(`✔ Searah bias ${htfBias.tfTag} (${direction}, zona ${htfBias.zone})`);
    }
    finalChecklist.push(`✔ RR ke TP1 ${rrTp1} (>= 1.5) menuju ${targets[0].label}`);

    const score = finalChecklist.length;
    const slPips = toPips(pair, entry - sl);
    const tpPrices = targets.map((t) => t.price);
    const tp1 = tpPrices[0];
    const tp2 = tpPrices[1] !== undefined ? tpPrices[1] : tp1;
    const tp3 = tpPrices[2] !== undefined ? tpPrices[2] : tp2;
    const validUntilTs = nowMs + tfCfg.expiryMin * 60 * 1000;

    return {
      valid: true,
      methodKey,
      direction,
      orderType: direction === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT',
      trigger,
      checklist: finalChecklist,
      score,
      entry,
      entryFmt: formatPrice(pair, entry),
      sl,
      slFmt: formatPrice(pair, sl),
      slPips,
      tp: tpPrices,
      tpTargets: targets,
      tp1,
      tp1Fmt: formatPrice(pair, tp1),
      tp1Pips: toPips(pair, tp1 - entry),
      tp2,
      tp2Fmt: formatPrice(pair, tp2),
      tp2Pips: toPips(pair, tp2 - entry),
      tp3,
      tp3Fmt: formatPrice(pair, tp3),
      tp3Pips: toPips(pair, tp3 - entry),
      rrTp1,
      invalidation,
      validUntil: formatIsoTime(validUntilTs),
      validUntilTs,
      zoneLow: Math.min(entry, sl),
      zoneHigh: Math.max(entry, sl),
      zoneRangeFormatted: `${formatPrice(pair, Math.min(entry, sl))} – ${formatPrice(pair, Math.max(entry, sl))}`,
      spreadPips: toPips(pair, spreadPrice || 0),
      atrNow
    };
  }

  // ============================================================================
  // 5 DETEKTOR WAJIB
  // ============================================================================

  function detectLiquiditySweepSetup(ctx) {
    const { candles, atrSeries, swings, sweeps, shifts, fvgList, obList, liquidityLevels, spreadPrice, atrNow, tfCfg, nowMs, pair, htfBias, postReleaseBias } = ctx;
    if (!sweeps || sweeps.length === 0) return null;

    const recentSweep = sweeps[sweeps.length - 1];
    if (candles.length - 1 - recentSweep.candleIndex > 12) return null;

    const dir = recentSweep.direction;
    // Harus ada MSS setelah sweep
    const mssAfter = (shifts || []).find((s) => s.direction === dir && s.index >= recentSweep.candleIndex);
    if (!mssAfter) return null;

    // Cari FVG atau OB unmitigated hasil displacement setelah sweep
    const fvgAfter = (fvgList || []).slice().reverse().find((f) => f.direction === dir && !f.mitigated && f.createdIndex >= recentSweep.candleIndex);
    const obAfter = (obList || []).slice().reverse().find((o) => o.direction === dir && !o.mitigated && o.displacementIndex >= recentSweep.candleIndex);
    if (!fvgAfter && !obAfter) return null;

    const poi = fvgAfter || obAfter;
    const entry = fvgAfter ? fvgAfter.ce : obAfter.mid50;
    const buffer = atrNow * 0.25 + spreadPrice;
    const sl = dir === 'BUY'
      ? Math.min(recentSweep.extremePrice, obAfter ? obAfter.bottom : recentSweep.extremePrice) - buffer
      : Math.max(recentSweep.extremePrice, obAfter ? obAfter.top : recentSweep.extremePrice) + buffer;

    const checklist = [
      `✔ Sweep ${recentSweep.side} (${recentSweep.levelLabel}) lalu close balik`,
      `✔ MSS terkonfirmasi di ${formatPrice(pair, mssAfter.level)}`,
      fvgAfter
        ? `✔ FVG unmitigated ${formatPrice(pair, fvgAfter.bottom)}–${formatPrice(pair, fvgAfter.top)}`
        : `✔ OB unmitigated ${formatPrice(pair, obAfter.bottom)}–${formatPrice(pair, obAfter.top)}`
    ];

    const eqPrice = (swings.swingHighs.length && swings.swingLows.length)
      ? (swings.swingHighs[swings.swingHighs.length - 1].price + swings.swingLows[swings.swingLows.length - 1].price) / 2
      : entry;

    const extraLevels = (liquidityLevels || []).concat([{
      kind: 'EQ',
      side: dir === 'BUY' ? 'HIGH' : 'LOW',
      price: eqPrice,
      label: `Equilibrium ${formatPrice(pair, eqPrice)}`
    }]);

    return finalizeSetupWithGates({
      pair,
      timeframe: ctx.timeframe,
      methodKey: 'sweep',
      direction: dir,
      entry,
      sl,
      invalidation: `Close di luar ekstrem sweep ${formatPrice(pair, recentSweep.extremePrice)}`,
      trigger: {
        jenis: `SWEEP_${recentSweep.side}_AND_MSS`,
        level: recentSweep.level,
        waktuCandle: recentSweep.timeIso
      },
      checklist,
      liquidityLevels: extraLevels,
      swingHigh: swings.swingHighs.length ? swings.swingHighs[swings.swingHighs.length - 1].price : null,
      swingLow: swings.swingLows.length ? swings.swingLows[swings.swingLows.length - 1].price : null,
      htfBias,
      postReleaseBias,
      spreadPrice,
      atrNow,
      tfCfg,
      nowMs,
      poiMeta: poi
    });
  }

  function detectJudasSwingSetup(ctx) {
    const { candles, latestAsia, nyCtx, shifts, fvgList, obList, liquidityLevels, spreadPrice, atrNow, tfCfg, nowMs, pair, htfBias, postReleaseBias } = ctx;
    if (!nyCtx.isJudasWindow) return null;
    if (!latestAsia || !(latestAsia.high > latestAsia.low)) return null;

    // Cari sapuan Asia high atau Asia low di sesi London (02–05 NY) atau NY Open (07–09 NY)
    let judasSweep = null;
    for (let i = 0; i < candles.length; i += 1) {
      const p = getNyParts(candles[i].ts);
      const inJudas = (p.nyHour >= 2 && p.nyHour < 5) || (p.nyHour >= 7 && p.nyHour < 9);
      if (!inJudas) continue;

      if (candles[i].high > latestAsia.high && candles[i].close <= latestAsia.high) {
        judasSweep = {
          side: 'HIGH',
          direction: 'SELL', // sapuan Asia High -> bias berlawanan (SELL)
          level: latestAsia.high,
          extreme: candles[i].high,
          index: i,
          ts: candles[i].ts
        };
      } else if (candles[i].low < latestAsia.low && candles[i].close >= latestAsia.low) {
        judasSweep = {
          side: 'LOW',
          direction: 'BUY', // sapuan Asia Low -> bias berlawanan (BUY)
          level: latestAsia.low,
          extreme: candles[i].low,
          index: i,
          ts: candles[i].ts
        };
      }
    }

    if (!judasSweep) return null;
    const dir = judasSweep.direction;

    const mssAfter = (shifts || []).find((s) => s.direction === dir && s.index >= judasSweep.index);
    if (!mssAfter) return null;

    const retestZone = (fvgList || []).slice().reverse().find((f) => f.direction === dir && !f.mitigated && f.createdIndex >= judasSweep.index)
      || (obList || []).slice().reverse().find((o) => o.direction === dir && !o.mitigated && o.displacementIndex >= judasSweep.index);
    if (!retestZone) return null;

    const entry = retestZone.ce !== undefined ? retestZone.ce : retestZone.mid50;
    const buffer = atrNow * 0.2 + spreadPrice;
    const sl = dir === 'BUY' ? judasSweep.extreme - buffer : judasSweep.extreme + buffer;

    // TP sisi lain range Asia dulu, lalu PDH/PDL
    const asiaOppositeLevel = {
      kind: 'ASIA_OPPOSITE',
      side: dir === 'BUY' ? 'HIGH' : 'LOW',
      price: dir === 'BUY' ? latestAsia.high : latestAsia.low,
      label: `Asia ${dir === 'BUY' ? 'High' : 'Low'} ${formatPrice(pair, dir === 'BUY' ? latestAsia.high : latestAsia.low)}`
    };

    const pdLevels = (liquidityLevels || []).filter((l) => l.kind === 'PDH' || l.kind === 'PDL');
    const orderedTargets = [asiaOppositeLevel].concat(pdLevels).concat(liquidityLevels || []);

    const checklist = [
      `✔ Range Asia (${formatPrice(pair, latestAsia.low)}–${formatPrice(pair, latestAsia.high)}) terbentuk`,
      `✔ Judas sweep Asia ${judasSweep.side} di ${formatPrice(pair, judasSweep.extreme)} (${nyCtx.sessionName})`,
      `✔ MSS searah ${dir} & zona retest unmitigated tersedia`
    ];

    return finalizeSetupWithGates({
      pair,
      timeframe: ctx.timeframe,
      methodKey: 'judas',
      direction: dir,
      entry,
      sl,
      invalidation: `Temus ekstrem Judas ${formatPrice(pair, judasSweep.extreme)}`,
      trigger: {
        jenis: `JUDAS_ASIA_${judasSweep.side}_SWEEP`,
        level: judasSweep.level,
        waktuCandle: formatIsoTime(judasSweep.ts)
      },
      checklist,
      liquidityLevels: orderedTargets,
      swingHigh: latestAsia.high,
      swingLow: latestAsia.low,
      htfBias,
      postReleaseBias,
      spreadPrice,
      atrNow,
      tfCfg,
      nowMs
    });
  }

  function detectSmcObSetup(ctx) {
    const { obList, shifts, liquidityLevels, spreadPrice, atrNow, tfCfg, nowMs, pair, htfBias, postReleaseBias } = ctx;
    if (!htfBias || !htfBias.direction) return null;
    const dir = htfBias.direction;

    // Harus ada BOS/MSS searah bias HTF dan OB valid yang memiliki overlap dengan FVG serta unmitigated
    const validBos = (shifts || []).slice().reverse().find((s) => s.direction === dir);
    if (!validBos) return null;

    const validOb = (obList || []).slice().reverse().find((o) =>
      o.direction === dir &&
      !o.mitigated &&
      o.hasFvgOverlap &&
      o.fvg &&
      !o.fvg.mitigated
    );
    if (!validOb) return null;

    const overlapTop = Math.min(validOb.top, validOb.fvg.top);
    const overlapBottom = Math.max(validOb.bottom, validOb.fvg.bottom);
    const entry = overlapTop >= overlapBottom
      ? (overlapTop + overlapBottom) / 2
      : validOb.mid50;

    const buffer = atrNow * 0.2 + spreadPrice;
    const sl = dir === 'BUY' ? validOb.bottom - buffer : validOb.top + buffer;

    const checklist = [
      `✔ Bias HTF ${htfBias.tfTag} ${dir} & BOS di ${formatPrice(pair, validBos.level)}`,
      `✔ OB ${formatPrice(pair, validOb.bottom)}–${formatPrice(pair, validOb.top)} overlap dengan FVG`,
      `✔ Zona OB & FVG masih unmitigated`
    ];

    return finalizeSetupWithGates({
      pair,
      timeframe: ctx.timeframe,
      methodKey: 'smc_ob',
      direction: dir,
      entry,
      sl,
      invalidation: `Close melewati wick OB ${formatPrice(pair, dir === 'BUY' ? validOb.bottom : validOb.top)}`,
      trigger: {
        jenis: 'SMC_OB_FVG_OVERLAP',
        level: entry,
        waktuCandle: formatIsoTime(validOb.ts)
      },
      checklist,
      liquidityLevels,
      swingHigh: htfBias.rangeHigh,
      swingLow: htfBias.rangeLow,
      htfBias,
      postReleaseBias,
      spreadPrice,
      atrNow,
      tfCfg,
      nowMs
    });
  }

  function detectSilverBulletSetup(ctx) {
    const { candles, nyCtx, sweeps, shifts, fvgList, liquidityLevels, atrNow, tfCfg, nowMs, pair, htfBias, postReleaseBias } = ctx;
    if (!nyCtx.isSilverBulletWindow) return null;

    // Harus ada sweep dan MSS dulu, lalu FVG terbentuk di dalam jendela 03–04, 10–11, atau 14–15 NY
    const recentSweep = (sweeps || []).slice().reverse().find((sw) => candles.length - 1 - sw.candleIndex <= 20);
    if (!recentSweep) return null;

    const dir = recentSweep.direction;
    const mssAfter = (shifts || []).find((s) => s.direction === dir && s.index >= recentSweep.candleIndex);
    if (!mssAfter) return null;

    const windowFvg = (fvgList || []).slice().reverse().find((f) => {
      if (f.direction !== dir || f.mitigated || f.createdIndex < mssAfter.index) return false;
      const p = getNyParts(f.ts);
      return (p.nyHour === 3 || p.nyHour === 10 || p.nyHour === 14);
    });
    if (!windowFvg) return null;

    // SL di balik candle pertama FVG (windowFvg.createdIndex - 2)
    const firstFvgCandle = candles[Math.max(0, windowFvg.createdIndex - 2)];
    const sl = dir === 'BUY' ? firstFvgCandle.low : firstFvgCandle.high;
    const entry = windowFvg.ce;

    const checklist = [
      `✔ Jendela Silver Bullet aktif (${nyCtx.silverBulletWindow})`,
      `✔ Sweep ${recentSweep.side} (${recentSweep.levelLabel}) & MSS terkonfirmasi`,
      `✔ FVG terbentuk di dalam jendela (${formatPrice(pair, windowFvg.bottom)}–${formatPrice(pair, windowFvg.top)})`
    ];

    return finalizeSetupWithGates({
      pair,
      timeframe: ctx.timeframe,
      methodKey: 'silver_bullet',
      direction: dir,
      entry,
      sl,
      invalidation: `Temus balik candle pertama FVG di ${formatPrice(pair, sl)}`,
      trigger: {
        jenis: 'SILVER_BULLET_WINDOW_FVG',
        level: windowFvg.ce,
        waktuCandle: formatIsoTime(windowFvg.ts)
      },
      checklist,
      liquidityLevels,
      swingHigh: Math.max.apply(null, candles.slice(-30).map((c) => c.high)),
      swingLow: Math.min.apply(null, candles.slice(-30).map((c) => c.low)),
      htfBias,
      postReleaseBias,
      spreadPrice: ctx.spreadPrice,
      atrNow,
      tfCfg,
      nowMs
    });
  }

  function detectFibOteSetup(ctx) {
    const { candles, swings, shifts, fvgList, obList, liquidityLevels, atrNow, tfCfg, nowMs, pair, htfBias, postReleaseBias } = ctx;
    const highs = swings.swingHighs || [];
    const lows = swings.swingLows || [];
    if (highs.length === 0 || lows.length === 0) return null;

    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;

    // Leg impuls valid setelah MSS: swing low -> high (BUY) atau swing high -> low (SELL)
    let dir = null;
    let legLow = null;
    let legHigh = null;

    if (lastLow.index < lastHigh.index) {
      const mssBull = (shifts || []).find((s) => s.direction === 'BUY' && s.index >= lastLow.index);
      if (mssBull) {
        dir = 'BUY';
        legLow = lastLow.price;
        legHigh = lastHigh.price;
      }
    } else if (lastHigh.index < lastLow.index) {
      const mssBear = (shifts || []).find((s) => s.direction === 'SELL' && s.index >= lastHigh.index);
      if (mssBear) {
        dir = 'SELL';
        legHigh = lastHigh.price;
        legLow = lastLow.price;
      }
    }

    if (!dir || !(legHigh > legLow)) return null;
    const legRange = legHigh - legLow;

    let fib062, fib079, entry0705, sl, extLevels;
    if (dir === 'BUY') {
      // Retracement dari high ke low: 0.62–0.79 diukur dari swing high ke swing low
      fib062 = legHigh - legRange * 0.62;
      fib079 = legHigh - legRange * 0.79;
      entry0705 = legHigh - legRange * 0.705;
      sl = legLow; // di balik titik 0 leg
      const ext027 = legHigh + legRange * 0.27;
      const ext062 = legHigh + legRange * 0.62;
      extLevels = [
        { kind: 'FIB_EXT_027', side: 'HIGH', price: ext027, label: `Fib Ext -0.27 (${formatPrice(pair, ext027)})` },
        { kind: 'FIB_EXT_062', side: 'HIGH', price: ext062, label: `Fib Ext -0.62 (${formatPrice(pair, ext062)})` }
      ];
    } else {
      fib062 = legLow + legRange * 0.62;
      fib079 = legLow + legRange * 0.79;
      entry0705 = legLow + legRange * 0.705;
      sl = legHigh; // di balik titik 0 leg
      const ext027 = legLow - legRange * 0.27;
      const ext062 = legLow - legRange * 0.62;
      extLevels = [
        { kind: 'FIB_EXT_027', side: 'LOW', price: ext027, label: `Fib Ext -0.27 (${formatPrice(pair, ext027)})` },
        { kind: 'FIB_EXT_062', side: 'LOW', price: ext062, label: `Fib Ext -0.62 (${formatPrice(pair, ext062)})` }
      ];
    }

    const zoneMin = Math.min(fib062, fib079);
    const zoneMax = Math.max(fib062, fib079);
    const inOteZone = currentPrice >= zoneMin - atrNow * 0.15 && currentPrice <= zoneMax + atrNow * 0.15;
    if (!inOteZone) return null;

    const checklist = [
      `✔ Leg impuls ${dir} (${formatPrice(pair, legLow)}–${formatPrice(pair, legHigh)}) setelah MSS`,
      `✔ Harga berada di zona Fib OTE 0.62–0.79 (${formatPrice(pair, zoneMin)}–${formatPrice(pair, zoneMax)})`,
      `✔ Entry presisi di level 0.705 (${formatPrice(pair, entry0705)})`
    ];

    const hasPoiInZone = (fvgList || []).some((f) => !f.mitigated && f.top >= zoneMin && f.bottom <= zoneMax)
      || (obList || []).some((o) => !o.mitigated && o.top >= zoneMin && o.bottom <= zoneMax);
    if (hasPoiInZone) {
      checklist.push('✔ Bonus konfluensi FVG/OB di dalam zona OTE');
    }

    const combinedLiquidity = extLevels.concat(liquidityLevels || []);

    return finalizeSetupWithGates({
      pair,
      timeframe: ctx.timeframe,
      methodKey: 'ote',
      direction: dir,
      entry: entry0705,
      sl,
      invalidation: `Temus titik 0 leg impuls di ${formatPrice(pair, sl)}`,
      trigger: {
        jenis: 'FIB_OTE_0705',
        level: entry0705,
        waktuCandle: formatIsoTime(lastCandle.ts)
      },
      checklist,
      liquidityLevels: combinedLiquidity,
      swingHigh: legHigh,
      swingLow: legLow,
      htfBias,
      postReleaseBias,
      spreadPrice: ctx.spreadPrice,
      atrNow,
      tfCfg,
      nowMs
    });
  }

  function runSingleDetector(methodKey, ctx) {
    if (methodKey === 'sweep') return detectLiquiditySweepSetup(ctx);
    if (methodKey === 'judas') return detectJudasSwingSetup(ctx);
    if (methodKey === 'smc_ob') return detectSmcObSetup(ctx);
    if (methodKey === 'silver_bullet') return detectSilverBulletSetup(ctx);
    if (methodKey === 'ote') return detectFibOteSetup(ctx);
    return null;
  }

  function runAutoSniper(ctx) {
    const keys = ['sweep', 'judas', 'smc_ob', 'silver_bullet', 'ote'];
    const validSetups = [];

    for (const k of keys) {
      const s = runSingleDetector(k, ctx);
      if (s && s.valid) {
        validSetups.push(s);
      }
    }

    if (validSetups.length === 0) {
      return {
        valid: false,
        reasonCode: 'NO_DETECTOR_MATCH',
        reasonText: 'Tidak ada detektor (Sweep, Judas, SMC OB, Silver Bullet, FIB OTE) yang memenuhi syarat.'
      };
    }

    const dirs = new Set(validSetups.map((s) => s.direction));
    if (dirs.size > 1) {
      return {
        valid: false,
        reasonCode: 'CONFLICTING_DETECTOR_DIRECTIONS',
        reasonText: 'Arah antar detektor yang valid saling bertentangan (BUY vs SELL) → NO_TRADE.'
      };
    }

    // Urutkan berdasarkan jumlah syarat terpenuhi (score) tertinggi
    validSetups.sort((a, b) => b.score - a.score);
    const best = Object.assign({}, validSetups[0]);

    // Jika >= 2 metode searah memiliki zona entry yang berdekatan/overlap, beri bonus skor
    if (validSetups.length >= 2) {
      const tol = Math.max(ctx.atrNow * 0.4, ctx.spreadPrice * 3);
      const hasOverlap = validSetups.slice(1).some((other) => Math.abs(other.entry - best.entry) <= tol);
      if (hasOverlap) {
        best.score += 1;
        best.checklist = best.checklist.concat([
          `✔ Bonus konfluensi: >= 2 metode searah dengan zona overlap (terpilih: ${best.methodKey.toUpperCase()})`
        ]);
      }
    }

    best.selectedMethodKey = best.methodKey;
    best.methodKey = 'auto';
    best.checklist.unshift(`✔ Auto Sniper memilih metode terbaik: ${best.selectedMethodKey.toUpperCase()}`);
    best.score = best.checklist.length;
    return best;
  }

  // ============================================================================
  // KOMPATIBILITAS HELPER (DEALING RANGE, LOT, RUNNING TRADE, MANUAL TP)
  // ============================================================================

  function analyzeDealingRange(pair, livePrice, timeframe, deterministicSeed, marketContext) {
    const cleanPair = normalizePair(pair);
    const spec = getPairSpec(cleanPair);
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
      const rangeSpreadFactor = 1.6 + (Math.abs(Math.cos(seed + 0.7)) * 0.25);
      totalRange = unitAtr * rangeSpreadFactor;
      swingLow = livePrice - totalRange * 0.5;
      swingHigh = swingLow + totalRange;
    }

    const equilibrium = swingLow + totalRange * 0.5;
    const pdPercent = Math.round(
      Math.min(95, Math.max(5, ((livePrice - swingLow) / Math.max(spec.pipSize, totalRange)) * 100))
    );

    const biasKey = `${cleanPair}_${timeframe}_${ctx.candleCloseTs || 0}`;
    let direction = lockedPairCandleBias.get(biasKey) || (livePrice <= equilibrium ? 'BUY' : 'SELL');
    if (!lockedPairCandleBias.has(biasKey)) {
      lockedPairCandleBias.set(biasKey, direction);
      pruneCacheMap(lockedPairCandleBias, 300);
    }

    return {
      pair: cleanPair,
      timeframe,
      livePrice,
      unitAtr,
      hasRealAtr,
      hasRealSwing,
      swingHigh,
      swingHighFmt: formatPrice(cleanPair, swingHigh),
      swingLow,
      swingLowFmt: formatPrice(cleanPair, swingLow),
      totalRange,
      equilibrium,
      equilibriumFmt: formatPrice(cleanPair, equilibrium),
      pdPercent,
      direction,
      nyCtx
    };
  }

  function createNoTradeResult(baseMeta, reasonCode, detectedFacts, extra) {
    return Object.assign({}, baseMeta, {
      status: 'NO_TRADE',
      isExecutable: false,
      reasonCode,
      direction: null,
      orderType: 'NO TRADE',
      entry: null,
      sl: null,
      tp: [],
      rrTp1: null,
      invalidation: null,
      validUntil: null,
      trigger: null,
      checklist: [],
      score: 0,
      detectedFacts: Array.isArray(detectedFacts) ? detectedFacts : []
    }, extra || {});
  }

  function createWaitResult(baseMeta, reasonCode, detectedFacts, extra) {
    return Object.assign({}, baseMeta, {
      status: 'WAIT',
      isExecutable: false,
      reasonCode,
      direction: null,
      orderType: 'WAIT',
      entry: null,
      sl: null,
      tp: [],
      rrTp1: null,
      invalidation: null,
      validUntil: null,
      trigger: null,
      checklist: [],
      score: 0,
      detectedFacts: Array.isArray(detectedFacts) ? detectedFacts : []
    }, extra || {});
  }

  function buildSignalSetup(options) {
    const opts = options || {};
    const pair = normalizePair(opts.pair || 'XAUUSD');
    const timeframe = TF_CONFIG[opts.timeframe] ? opts.timeframe : 'M15';
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

    const spec = getPairSpec(pair);
    const tfCfg = TF_CONFIG[timeframe];
    const methodMeta = METHOD_CATALOG[methodKey];
    const nyCtx = getNySessionContext(nowMs);
    const candles = normalizeCandleArray(opts.candles || opts.ohlc);

    const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    const livePrice = Number.isFinite(Number(opts.livePrice)) && Number(opts.livePrice) > 0
      ? Number(opts.livePrice)
      : (lastCandle ? lastCandle.close : NaN);

    const maxDataAgeMs = Number.isFinite(Number(opts.maxDataAgeMs))
      ? Number(opts.maxDataAgeMs)
      : DEFAULT_MAX_DATA_AGE_MS;

    const baseMeta = {
      engineVersion: ENGINE_VERSION,
      signalId,
      candleCloseTs,
      candleCloseIso: formatIsoTime(candleCloseTs),
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
      const res = createNoTradeResult(baseMeta, 'WEEKEND_MARKET_CLOSED', [
        `Pasar tutup akhir pekan (${baseMeta.nyTimeLabel}).`
      ], { poiSummary: 'NO_TRADE: Pasar tutup akhir pekan.' });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    if (!Number.isFinite(livePrice) || livePrice <= 0) {
      const res = createNoTradeResult(baseMeta, 'INVALID_LIVE_PRICE', [
        'Harga live / data candle OHLC tidak tersedia.'
      ], { poiSummary: 'NO_TRADE: Harga live tidak valid.' });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    const lastUpdateNum = Number(opts.lastUpdateTs !== undefined && opts.lastUpdateTs !== null ? opts.lastUpdateTs : (lastCandle ? lastCandle.ts : NaN));
    if (!Number.isFinite(lastUpdateNum) || lastUpdateNum <= 0) {
      const res = createNoTradeResult(baseMeta, 'MISSING_LAST_UPDATE_TS', [
        'Timestamp data OHLC/live tidak tersedia.'
      ], { poiSummary: 'NO_TRADE: Timestamp data tidak valid.' });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    const dataAgeMs = nowMs - lastUpdateNum;
    if (dataAgeMs < 0 || dataAgeMs > maxDataAgeMs) {
      const res = createNoTradeResult(baseMeta, 'STALE_PRICE_DATA', [
        `Data berusia ${Math.max(0, Math.round(dataAgeMs / 1000))} detik (batas ${Math.round(maxDataAgeMs / 1000)} detik).`
      ], { dataAgeMs, poiSummary: 'NO_TRADE: Data basi.' });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    // Gate News: ±30 menit -> WAIT, dan evaluasi actual vs forecast
    const newsGate = evaluateNewsGate(opts, nowMs);
    if (newsGate.status === 'WAIT') {
      const res = createWaitResult(baseMeta, newsGate.reasonCode, [newsGate.message], {
        poiSummary: newsGate.message
      });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    // Wajib ada candle OHLC nyata minimal untuk analisis struktur
    if (candles.length < 15) {
      const res = createNoTradeResult(baseMeta, 'INSUFFICIENT_OHLC_CANDLES', [
        `Jumlah candle OHLC (${candles.length}) kurang untuk deteksi swing/struktur nyata.`
      ], { poiSummary: 'NO_TRADE: Data candle OHLC belum mencukupi.' });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    const atrSeries = calculateAtrSeries(candles, 14);
    const atrNow = Math.max(spec.pipSize, atrSeries[atrSeries.length - 1] || spec.baseAtrM15 * tfCfg.atrMult);
    const spreadPips = Number.isFinite(Number(opts.spreadPips)) && Number(opts.spreadPips) >= 0
      ? Number(opts.spreadPips)
      : spec.defaultSpreadPips;
    const spreadPrice = spreadPips * spec.pipSize;

    const swings = detectFractalSwings(candles, 3, 3);
    const shifts = detectStructureShifts(candles, swings);
    const fvgList = detectFVGs(candles, atrSeries, 0.3);
    const obList = detectOrderBlocks(candles, atrSeries, fvgList);
    const liqInfo = extractLiquidityLevels(candles, swings, pair);
    const sweeps = detectSweeps(candles, liqInfo.levels, pair);
    const htfBias = computeHtfBias(opts.h4Candles, opts.h1Candles, candles);

    const detectorCtx = {
      pair,
      timeframe,
      candles,
      atrSeries,
      atrNow,
      spreadPrice,
      swings,
      shifts,
      fvgList,
      obList,
      liquidityLevels: liqInfo.levels,
      latestAsia: liqInfo.latestAsia,
      sweeps,
      htfBias,
      postReleaseBias: newsGate.postReleaseBias,
      nyCtx,
      tfCfg,
      nowMs
    };

    const evaluated = methodKey === 'auto'
      ? runAutoSniper(detectorCtx)
      : runSingleDetector(methodKey, detectorCtx);

    if (!evaluated || !evaluated.valid) {
      const reasonCode = (evaluated && evaluated.reasonCode) || 'NO_VALID_SETUP';
      const reasonText = (evaluated && evaluated.reasonText) || 'Syarat detektor tidak terpenuhi.';
      const res = createNoTradeResult(baseMeta, reasonCode, [reasonText], {
        poiSummary: `NO_TRADE: ${reasonText}`
      });
      lockedSignalCache.set(signalId, res);
      pruneCacheMap(lockedSignalCache, 400);
      return res;
    }

    const activeMethodKey = evaluated.methodKey;
    const activeMeta = METHOD_CATALOG[activeMethodKey] || methodMeta;
    const chosenSubTag = evaluated.selectedMethodKey
      ? `${activeMeta.shortTag} → ${evaluated.selectedMethodKey.toUpperCase()}`
      : activeMeta.shortTag;

    const result = Object.assign({}, baseMeta, {
      status: 'SIGNAL',
      isExecutable: true,
      reasonCode: 'VALID_SETUP',
      methodKey: activeMethodKey,
      selectedMethodKey: evaluated.selectedMethodKey || activeMethodKey,
      methodLabel: evaluated.selectedMethodKey
        ? `${activeMeta.name} (${evaluated.selectedMethodKey.toUpperCase()})`
        : activeMeta.name,
      methodShortTag: chosenSubTag,
      direction: evaluated.direction,
      orderType: evaluated.orderType,
      trigger: evaluated.trigger,
      checklist: evaluated.checklist,
      score: evaluated.score,
      entry: evaluated.entry,
      entryFmt: evaluated.entryFmt,
      sl: evaluated.sl,
      slFmt: evaluated.slFmt,
      slPips: evaluated.slPips,
      spreadPips: evaluated.spreadPips,
      tp: evaluated.tp,
      tpTargets: evaluated.tpTargets,
      tp1: evaluated.tp1,
      tp1Fmt: evaluated.tp1Fmt,
      tp1Pips: evaluated.tp1Pips,
      tp2: evaluated.tp2,
      tp2Fmt: evaluated.tp2Fmt,
      tp2Pips: evaluated.tp2Pips,
      tp3: evaluated.tp3,
      tp3Fmt: evaluated.tp3Fmt,
      tp3Pips: evaluated.tp3Pips,
      rrTp1: evaluated.rrTp1,
      invalidation: evaluated.invalidation,
      validUntil: evaluated.validUntil,
      validUntilTs: evaluated.validUntilTs,
      zoneLow: evaluated.zoneLow,
      zoneHigh: evaluated.zoneHigh,
      zoneRangeFormatted: evaluated.zoneRangeFormatted,
      expiryMinutes: tfCfg.expiryMin,
      poiSummary: evaluated.checklist.join(' • '),
      detectedFacts: evaluated.checklist.concat(
        newsGate.postReleaseReason ? [newsGate.postReleaseReason] : []
      ),
      pipValuePerLot: spec.pipValuePerLot
    });

    lockedSignalCache.set(signalId, result);
    pruneCacheMap(lockedSignalCache, 400);
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
    const pair = normalizePair(src.pair || opts.pair || 'XAUUSD');
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
      return { isTriggered: false, isClosed: false, status: 'MENUNGGU LIMIT', deltaPips: 0, floatingUsd: 0 };
    }

    const isTriggered = direction === 'BUY'
      ? (price <= entry || Boolean(opts.isTriggered))
      : (price >= entry || Boolean(opts.isTriggered));

    if (!isTriggered) {
      return { isTriggered: false, isClosed: false, status: 'MENUNGGU LIMIT', deltaPips: 0, floatingUsd: 0 };
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
    const pair = normalizePair(src.pair || 'XAUUSD');
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
    const lockWindowMs = Number.isFinite(Number(opts.lockWindowMs)) ? Number(opts.lockWindowMs) : NEWS_LOCK_WINDOW_MS;
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
      warningMessage = `Bias kalender news (${rawNewsBias}) berbeda dengan arah setup (${direction}).`;
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
    NEWS_LOCK_WINDOW_MS,
    MIN_RR_TP1,
    PAIR_SPECS,
    TF_CONFIG,
    METHOD_CATALOG,
    normalizePair,
    getPairSpec,
    formatPrice,
    toPips,
    getWibContext,
    getNySessionContext,
    getCandleCloseTimestamp,
    buildDeterministicSignalId,
    clearLockedSignal,
    normalizeCandleArray,
    calculateAtrSeries,
    detectFractalSwings,
    detectFVGs,
    detectOrderBlocks,
    detectStructureShifts,
    extractLiquidityLevels,
    detectSweeps,
    computeHtfBias,
    analyzeDealingRange,
    buildSignalSetup,
    calculatePositionSize,
    evaluateRunningPositionMetrics,
    calculateManualTpMetrics,
    evaluateNewsLockStatus
  };
})(window);
