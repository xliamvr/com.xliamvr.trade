/**
 * Liamvtrade Quant Terminal — npattern.js
 * Detektor Pola N (Impulse - Pullback - Continuation) berbasis data OHLC
 */
(function (global) {
  'use strict';

  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function normalizeList(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (let i = 0; i < raw.length; i += 1) {
      const c = raw[i];
      if (!c) continue;
      const o = toNum(c.open !== undefined ? c.open : c.o);
      const h = toNum(c.high !== undefined ? c.high : c.h);
      const l = toNum(c.low !== undefined ? c.low : c.l);
      const cl = toNum(c.close !== undefined ? c.close : c.c);
      const ts = toNum(c.ts || c.timestampMs || c.time || (i + 1) * 60000);
      if (!Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(cl)) continue;
      if (o <= 0 || h <= 0 || l <= 0 || cl <= 0) continue;
      out.push({
        index: out.length,
        ts: Number.isFinite(ts) && ts > 0 ? ts : (i + 1) * 60000,
        open: o,
        high: Math.max(o, h, l, cl),
        low: Math.min(o, h, l, cl),
        close: cl
      });
    }
    out.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < out.length; i += 1) out[i].index = i;
    return out;
  }

  function getDecimals(pair) {
    const p = String(pair || 'XAUUSD').toUpperCase();
    if (p === 'EURUSD') return 5;
    return 2;
  }

  function getPipSize(pair) {
    const p = String(pair || 'XAUUSD').toUpperCase();
    if (p === 'EURUSD') return 0.0001;
    if (p === 'US100' || p === 'BTCUSDT') return 1.0;
    return 0.1;
  }

  /**
   * Mendeteksi Pola N Bullish atau Bearish pada array candle OHLC.
   * Bullish N: titik A (swing low) -> titik B (impulse high) -> pullback C (higher low di atas A) -> dorongan D/breakout.
   * Bearish N: titik A (swing high) -> titik B (impulse low) -> pullback C (lower high di bawah A) -> dorongan D/breakdown.
   */
  function detectNPattern(rawCandles, options) {
    const opts = options || {};
    const pair = String(opts.pair || 'XAUUSD').toUpperCase();
    const tf = String(opts.timeframe || 'M15').toUpperCase();
    const dec = getDecimals(pair);
    const pip = getPipSize(pair);

    const candles = normalizeList(rawCandles);
    if (candles.length < 12) {
      return {
        detected: false,
        direction: null,
        confidence: 0,
        reason: 'Data candle kurang untuk validasi Pola N (< 12 bar).'
      };
    }

    const slice = candles.slice(-45);
    const last = slice[slice.length - 1];
    const recent = slice.slice(-18);

    // Cari titik terendah dan tertinggi di jendela awal & tengah
    let minIdx = 0;
    let maxIdx = 0;
    for (let i = 1; i < recent.length - 2; i += 1) {
      if (recent[i].low < recent[minIdx].low) minIdx = i;
      if (recent[i].high > recent[maxIdx].high) maxIdx = i;
    }

    // 1. Cek Pola N Bullish (A = low awal, B = high impuls, C = pullback higher low)
    if (minIdx < maxIdx && maxIdx < recent.length - 1) {
      const pointA = recent[minIdx];
      const pointB = recent[maxIdx];
      let pullbackLow = Infinity;
      let pullbackIdx = -1;

      for (let j = maxIdx + 1; j < recent.length; j += 1) {
        if (recent[j].low < pullbackLow) {
          pullbackLow = recent[j].low;
          pullbackIdx = j;
        }
      }

      const leg1 = pointB.high - pointA.low;
      const retrace = pullbackLow - pointA.low;
      const retraceRatio = leg1 > 0 ? (pointB.high - pullbackLow) / leg1 : 1;
      const validHigherLow = Number.isFinite(pullbackLow) && pullbackLow > pointA.low && retraceRatio >= 0.25 && retraceRatio <= 0.85;
      const continuingUp = last.close >= pullbackLow && (last.close > recent[pullbackIdx].open || last.high >= pointB.high * 0.999);

      if (validHigherLow && leg1 > pip * 3 && continuingUp) {
        const entry = Number(((pullbackLow + Math.min(last.close, pointB.high)) / 2).toFixed(dec));
        const sl = Number((pullbackLow - Math.max(pip * 2, leg1 * 0.08)).toFixed(dec));
        const risk = Math.max(pip, Math.abs(entry - sl));
        const tp1 = Number((entry + risk * 1.6).toFixed(dec));
        const tp2 = Number((entry + risk * 2.4).toFixed(dec));
        const tp3 = Number((pointB.high + leg1 * 0.35).toFixed(dec));
        const conf = Math.min(9.5, Number((7.2 + (continuingUp ? 1.0 : 0.4) + (retraceRatio <= 0.62 ? 0.6 : 0.2)).toFixed(1)));

        return {
          detected: true,
          patternName: 'Pola N Bullish',
          direction: 'BUY',
          timeframe: tf,
          pair,
          confidence: conf,
          pointA: pointA.low,
          pointB: pointB.high,
          pointC: pullbackLow,
          entry,
          sl,
          tp1,
          tp2,
          tp3,
          reason: `Pola N Bullish (${tf}): Low A ${pointA.low.toFixed(dec)} → High B ${pointB.high.toFixed(dec)} → Higher Low C ${pullbackLow.toFixed(dec)} (retracement ${(retraceRatio * 100).toFixed(0)}%).`
        };
      }
    }

    // 2. Cek Pola N Bearish (A = high awal, B = low impuls, C = pullback lower high)
    if (maxIdx < minIdx && minIdx < recent.length - 1) {
      const pointA = recent[maxIdx];
      const pointB = recent[minIdx];
      let pullbackHigh = -Infinity;
      let pullbackIdx = -1;

      for (let j = minIdx + 1; j < recent.length; j += 1) {
        if (recent[j].high > pullbackHigh) {
          pullbackHigh = recent[j].high;
          pullbackIdx = j;
        }
      }

      const leg1 = pointA.high - pointB.low;
      const retraceRatio = leg1 > 0 ? (pullbackHigh - pointB.low) / leg1 : 1;
      const validLowerHigh = Number.isFinite(pullbackHigh) && pullbackHigh < pointA.high && retraceRatio >= 0.25 && retraceRatio <= 0.85;
      const continuingDown = last.close <= pullbackHigh && (last.close < recent[pullbackIdx].open || last.low <= pointB.low * 1.001);

      if (validLowerHigh && leg1 > pip * 3 && continuingDown) {
        const entry = Number(((pullbackHigh + Math.max(last.close, pointB.low)) / 2).toFixed(dec));
        const sl = Number((pullbackHigh + Math.max(pip * 2, leg1 * 0.08)).toFixed(dec));
        const risk = Math.max(pip, Math.abs(sl - entry));
        const tp1 = Number((entry - risk * 1.6).toFixed(dec));
        const tp2 = Number((entry - risk * 2.4).toFixed(dec));
        const tp3 = Number((pointB.low - leg1 * 0.35).toFixed(dec));
        const conf = Math.min(9.5, Number((7.2 + (continuingDown ? 1.0 : 0.4) + (retraceRatio <= 0.62 ? 0.6 : 0.2)).toFixed(1)));

        return {
          detected: true,
          patternName: 'Pola N Bearish',
          direction: 'SELL',
          timeframe: tf,
          pair,
          confidence: conf,
          pointA: pointA.high,
          pointB: pointB.low,
          pointC: pullbackHigh,
          entry,
          sl,
          tp1,
          tp2,
          tp3,
          reason: `Pola N Bearish (${tf}): High A ${pointA.high.toFixed(dec)} → Low B ${pointB.low.toFixed(dec)} → Lower High C ${pullbackHigh.toFixed(dec)} (retracement ${(retraceRatio * 100).toFixed(0)}%).`
        };
      }
    }

    return {
      detected: false,
      direction: null,
      confidence: 0,
      reason: `Belum terbentuk Pola N valid pada ${pair} (${tf}).`
    };
  }

  global.NPattern = {
    detectNPattern: detectNPattern,
    normalizeList: normalizeList
  };
})(window);
