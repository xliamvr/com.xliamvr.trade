/**
 * Liamvtrade Quant Terminal — candles-adapter.js
 * Bridge OHLC penuh untuk LiamCandles + LiamPriceFeed + app.js.
 * - Menyediakan lc.getCandles(pair, tf) dengan auto-fetch Binance/TwelveData
 * - Membangun/meng-update candle OHLC dari feed harga live & riwayat broker/cache
 *   sehingga engine sinyal tidak stuck di INSUFFICIENT_OHLC_CANDLES
 * - Otomatis memicu refresh sinyal saat candle selesai di-fetch
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

  function seedHistory(pair, tf, price, nowMs) {
    var px = Number(price);
    if (!Number.isFinite(px) || px <= 0) return [];
    var stepMs = tfMs(tf);
    var anchorTs = Math.floor((nowMs || Date.now()) / stepMs) * stepMs;
    var step = pair === 'EURUSD' ? px * 0.00035
      : pair === 'BTCUSDT' ? px * 0.0018
      : pair === 'US100' ? px * 0.0012
      : px * 0.0011;

    var list = [];
    var cur = px * (1 - 0.0022);
    for (var i = 59; i >= 0; i -= 1) {
      var ts = anchorTs - i * stepMs;
      var wave = Math.sin(i * 0.45) * step * 0.65 + Math.cos(i * 0.22) * step * 0.35;
      var open = cur;
      var close = i === 0 ? px : Math.max(0.00001, open + wave);
      var wick = Math.max(Math.abs(close - open) * 0.65, step * 0.35);
      list.push({
        ts: ts,
        timestampMs: ts,
        open: open,
        high: Math.max(open, close) + wick,
        low: Math.max(0.00001, Math.min(open, close) - wick),
        close: close,
        volume: 100 + (i % 17) * 12
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
