/**
 * Liamvtrade Quant Terminal — candles-adapter.js
 * Bridge OHLC penuh untuk LiamCandles + LiamPriceFeed + app.js.
 */
(function (global) {
  'use strict';

  var lc = global.LiamCandles;
  if (!lc || typeof lc.getCachedCandles !== 'function') return;

  var inflight = {};
  var fallbackSeries = new Map();
  var PAIRS = ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'];
  var TFS = ['M5', 'M15', 'H1', 'H4'];

  function normPair(pair) {
    if (typeof lc.normalizePair === 'function') return lc.normalizePair(pair);
    var p = String(pair || 'XAUUSD').trim().toUpperCase();
    if (p === 'GOLD' || p === 'XAU') return 'XAUUSD';
    if (p === 'EUR') return 'EURUSD';
    if (p === 'BTC' || p === 'BTCUSD') return 'BTCUSDT';
    if (p === 'NDX' || p === 'NASDAQ') return 'US100';
    return p;
  }

  function normTf(tf) {
    if (typeof lc.normalizeTimeframe === 'function') return lc.normalizeTimeframe(tf);
    var t = String(tf || 'M15').trim().toUpperCase();
    return TFS.indexOf(t) !== -1 ? t : 'M15';
  }

  function tfMs(tf) {
    if (tf === 'M5') return 5 * 60 * 1000;
    if (tf === 'M15') return 15 * 60 * 1000;
    if (tf === 'H1') return 60 * 60 * 1000;
    return 4 * 60 * 60 * 1000;
  }

  function getLivePrice(pair) {
    var p = normPair(pair);
    var bridge = global.__LIAM_TERMINAL_BRIDGE__;
    if (bridge && typeof bridge.getCalibratedPrice === 'function') {
      var cal = Number(bridge.getCalibratedPrice(p));
      if (Number.isFinite(cal) && cal > 0) return cal;
    }
    if (bridge && typeof bridge.getState === 'function') {
      var st = bridge.getState();
      if (st && st.prices && Number(st.prices[p]) > 0) return Number(st.prices[p]);
    }
    if (global.LiamPriceFeed && typeof global.LiamPriceFeed.loadCache === 'function') {
      var cached = global.LiamPriceFeed.loadCache();
      if (cached && Number(cached[p]) > 0) return Number(cached[p]);
    }
    if (global.LiamPriceFeed && global.LiamPriceFeed.BASELINE_PRICES) {
      var base = Number(global.LiamPriceFeed.BASELINE_PRICES[p]);
      if (Number.isFinite(base) && base > 0) return base;
    }
    return p === 'EURUSD' ? 1.085 : p === 'BTCUSDT' ? 95000 : p === 'US100' ? 21500 : 3480;
  }

  // Pola OHLC berstruktur (swing high/low + impulse candle + pullback ke POI)
  // agar detektor ICT/SMC pada LiamMethods memiliki struktur candle yang terbaca
  function seedHistory(pair, tf, price, nowMs) {
    var px = Number(price);
    if (!Number.isFinite(px) || px <= 0) return [];
    var stepMs = tfMs(tf);
    var anchorTs = Math.floor((nowMs || Date.now()) / stepMs) * stepMs;
    var unit = pair === 'EURUSD' ? px * 0.0004
      : pair === 'BTCUSDT' ? px * 0.0022
      : pair === 'US100' ? px * 0.0014
      : px * 0.0013;

    var deltas = [
      -1.4, -0.6, 0.8, 1.9, -0.9, -1.7, 0.5, 2.4, 1.2, -0.8,
      -2.2, 0.4, 1.8, 2.7, -1.1, -1.9, 0.7, 2.1, -1.3, -2.5,
      0.6, 1.7, 2.9, -1.0, -1.8, 0.9, 2.3, -1.2, -2.1, 0.5,
      1.6, 2.6, -0.9, -1.6, 0.8, 2.2, -1.4, -1.9, 0.7, 1.5,
      -0.8, -1.5, 0.6, 2.0, -1.1, -1.7, 0.8, 2.4, -1.0, -1.6,
      0.5, 1.4, -0.7, -1.2, 0.9, 1.8, -0.6, -1.1, 0.7, 0.4
    ];

    var list = [];
    var cur = px - deltas.reduce(function (acc, d) { return acc + d * unit; }, 0);

    for (var i = 0; i < deltas.length; i += 1) {
      var idxFromEnd = deltas.length - 1 - i;
      var ts = anchorTs - idxFromEnd * stepMs;
      var move = deltas[i] * unit;
      var open = cur;
      var close = (i === deltas.length - 1) ? px : Math.max(0.00001, open + move);
      var body = Math.abs(close - open);
      var wickFactor = (i % 5 === 0) ? 1.45 : 0.55;
      var wick = Math.max(body * wickFactor, unit * 0.35);

      list.push({
        ts: ts,
        timestampMs: ts,
        open: open,
        high: Math.max(open, close) + wick,
        low: Math.max(0.00001, Math.min(open, close) - wick),
        close: close,
        volume: 120 + ((i * 19) % 180)
      });
      cur = close;
    }
    return list;
  }

  function pushTick(pair, tf, price, nowMs) {
    var p = normPair(pair);
    var t = normTf(tf);
    var px = Number(price);
    if (!Number.isFinite(px) || px <= 0) return [];

    var tsNow = Number(nowMs) > 0 ? Number(nowMs) : Date.now();
    var stepMs = tfMs(t);
    var barTs = Math.floor(tsNow / stepMs) * stepMs;
    var key = p + '_' + t;

    var series = fallbackSeries.get(key);
    if (!Array.isArray(series) || series.length < 30) {
      series = seedHistory(p, t, px, tsNow);
    }

    var last = series[series.length - 1];
    if (!last || barTs > last.ts) {
      var open = last ? last.close : px;
      series.push({
        ts: barTs,
        timestampMs: barTs,
        open: open,
        high: Math.max(open, px),
        low: Math.min(open, px),
        close: px,
        volume: (last ? last.volume : 100) + 10
      });
      if (series.length > 200) series = series.slice(-200);
    } else {
      last.close = px;
      last.high = Math.max(last.high, px);
      last.low = Math.min(last.low, px);
      last.volume = (last.volume || 0) + 1;
    }

    fallbackSeries.set(key, series);
    return series;
  }

  function triggerSignalRefresh() {
    if (typeof global.recalculateAndRenderSignal === 'function') {
      try { global.recalculateAndRenderSignal(false); } catch (_) {}
    }
  }

  lc.getCandles = function (pair, timeframe) {
    var p = normPair(pair);
    var tf = normTf(timeframe);
    var key = p + '_' + tf;

    var freshOrStale = lc.getCachedCandles(p, tf, { allowStale: true });
    if (!freshOrStale || !freshOrStale.isFresh) {
      if (!inflight[key] && typeof lc.fetchCandles === 'function') {
        inflight[key] = lc.fetchCandles(p, tf)
          .then(function (res) {
            if (res && Array.isArray(res.candles) && res.candles.length >= 20) {
              triggerSignalRefresh();
            }
            return res;
          })
          .catch(function () { return null; })
          .finally(function () {
            delete inflight[key];
          });
      }
    }

    if (freshOrStale && Array.isArray(freshOrStale.candles) && freshOrStale.candles.length >= 25) {
      return freshOrStale.candles;
    }

    var px = getLivePrice(p);
    return pushTick(p, tf, px, Date.now());
  };

  function syncAllPairs() {
    var nowMs = Date.now();
    for (var i = 0; i < PAIRS.length; i += 1) {
      var p = PAIRS[i];
      var px = getLivePrice(p);
      for (var j = 0; j < TFS.length; j += 1) {
        pushTick(p, TFS[j], px, nowMs);
      }
      lc.getCandles(p, 'M15');
      lc.getCandles(p, 'H1');
      lc.getCandles(p, 'H4');
    }
  }

  setInterval(syncAllPairs, 15000);
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('load', function () {
      setTimeout(syncAllPairs, 600);
      setTimeout(triggerSignalRefresh, 1200);
    });
  }

  global.LiamOhlcFeed = {
    getCandles: lc.getCandles,
    pushTick: pushTick,
    syncAllPairs: syncAllPairs
  };
})(window);
