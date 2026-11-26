/**
 * Liamvtrade Quant Terminal — npattern-bridge.js
 * Menghubungkan window.NPattern ke LiamMethods.buildSignalSetup & alasan/catatan UI
 */
(function (global) {
  'use strict';

  function getCandlesSafe(pair, tf, params) {
    if (params && Array.isArray(params.candles) && params.candles.length >= 12) {
      return params.candles;
    }
    const feed = global.LiamOhlcFeed || global.LiamCandles;
    if (feed && typeof feed.getCandles === 'function') {
      try {
        return feed.getCandles(pair, tf) || [];
      } catch (_) {}
    }
    return [];
  }

  function enrichResultWithNPattern(result, params) {
    const np = global.NPattern;
    if (!np || typeof np.detectNPattern !== 'function') return result;

    const p = (params && params.pair) || (result && result.pair) || 'XAUUSD';
    const tf = (params && params.timeframe) || (result && result.timeframe) || 'M15';
    const candles = getCandlesSafe(p, tf, params);
    const pattern = np.detectNPattern(candles, { pair: p, timeframe: tf });

    if (!result || typeof result !== 'object') return result;

    result.nPattern = pattern;

    if (result.status === 'SIGNAL') {
      const sameDir = pattern.detected && pattern.direction === result.direction;
      if (sameDir) {
        if (Number.isFinite(Number(result.score))) {
          result.score = Number(Math.min(9.9, Number(result.score) + 0.5).toFixed(1));
        }
        if (Array.isArray(result.checklist)) {
          result.checklist.push(`✔ ${pattern.patternName} terkonfirmasi (${pattern.confidence}/10)`);
        }
        const nTag = `${pattern.patternName} searah ${result.direction}`;
        result.poiSummary = result.poiSummary
          ? `${result.poiSummary} • ${nTag}`
          : `${nTag} — ${pattern.reason}`;
        if (!result.entryNote || result.entryNote === 'undefined') {
          result.entryNote = `${pattern.patternName} pullback terkonfirmasi`;
        }
        if (!result.slReason || result.slReason === 'undefined') {
          result.slReason = `Invalidasi di luar titik C / struktur ${tf}`;
        }
        if (!result.tp1Reason || result.tp1Reason === 'undefined') result.tp1Reason = 'Target likuiditas TP1 (Pola N)';
        if (!result.tp2Reason || result.tp2Reason === 'undefined') result.tp2Reason = 'Ekspansi target TP2 (Pola N)';
        if (!result.tp3Reason || result.tp3Reason === 'undefined') result.tp3Reason = 'Ekstensi leg Pola N (TP3)';
      } else {
        const altNote = pattern.detected
          ? `Pola N terdeteksi (${pattern.patternName}) namun fokus tetap mengikuti setup utama ${result.direction}.`
          : `Setup utama ${result.direction} aktif; ${pattern.reason}`;
        result.poiSummary = result.poiSummary
          ? `${result.poiSummary} • ${altNote}`
          : altNote;
      }
    } else {
      const baseText = result.reasonText || result.poiSummary || 'Menunggu konfirmasi struktur valid.';
      const combinedReason = pattern.detected
        ? `${baseText} | Catatan: ${pattern.reason}`
        : `${baseText} | ${pattern.reason}`;
      result.reasonText = combinedReason;
      result.poiSummary = combinedReason;
    }

    return result;
  }

  function installBridge() {
    const methods = global.LiamMethods;
    if (!methods || typeof methods.buildSignalSetup !== 'function' || methods.__nPatternBridgeInstalled) {
      return;
    }
    const origBuild = methods.buildSignalSetup;
    methods.buildSignalSetup = function (params) {
      const res = origBuild.apply(this, arguments);
      return enrichResultWithNPattern(res, params);
    };
    methods.__nPatternBridgeInstalled = true;
  }

  installBridge();
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('load', installBridge);
  }

  global.LiamNPatternBridge = {
    installBridge: installBridge,
    enrichResultWithNPattern: enrichResultWithNPattern
  };
})(window);
