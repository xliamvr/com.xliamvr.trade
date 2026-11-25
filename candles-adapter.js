(function (global) {
  'use strict';

  var lc = global.LiamCandles;
  if (!lc || typeof lc.getCachedCandles !== 'function') return;

  var inflight = {};

  lc.getCandles = function (pair, timeframe) {
    var p = typeof lc.normalizePair === 'function' ? lc.normalizePair(pair) : String(pair || 'XAUUSD').toUpperCase();
    var tf = typeof lc.normalizeTimeframe === 'function' ? lc.normalizeTimeframe(timeframe) : String(timeframe || 'M15').toUpperCase();
    var key = p + '_' + tf;

    var freshOrStale = lc.getCachedCandles(p, tf, { allowStale: true });
    if (!freshOrStale || !freshOrStale.isFresh) {
      if (!inflight[key] && typeof lc.fetchCandles === 'function') {
        inflight[key] = lc.fetchCandles(p, tf).finally(function () {
          delete inflight[key];
        });
      }
    }

    return (freshOrStale && Array.isArray(freshOrStale.candles)) ? freshOrStale.candles : [];
  };
})(window);
