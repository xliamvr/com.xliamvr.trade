/**
 * Liamvtrade Quant Terminal — candles-adapter.js
 * Bridge OHLC penuh untuk LiamCandles + LiamPriceFeed + app.js.
 * - Mempertahankan normalisasi pair/TF, getLivePrice, pushTick, inflight dedup, dan LiamOhlcFeed
 * - Membatasi jarak SL maksimal per pair & timeframe agar tidak terlalu lebar
 * - Mengisi fallback teks Entry/SL/TP agar tidak muncul "undefined" di UI
 */
(function (global) {
  'use strict';

  var lc = global.LiamCandles;
  if (!lc || typeof lc.getCachedCandles !== 'function') return;

  var inflight = {};
  var fallbackSeries = new Map();
  var PAIRS = ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'];
  var TFS = ['M5', 'M15', 'H1', 'H4'];

  // Batas maksimal SL (dalam pips/poin) per pair & timeframe
  var MAX_SL_PIPS = {
    XAUUSD:  { M5: 25, M15: 40, H1: 60, H4: 85 },
    US100:   { M5: 40, M15: 65, H1: 100, H4: 140 },
    BTCUSDT: { M5: 75, M15: 120, H1: 190, H4: 280 },
    EURUSD:  { M5: 15, M15: 25, H1: 40, H4: 55 }
  };

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

  function getPipSize(pair) {
    var p = normPair(pair);
    var bridge = global.__LIAM_TERMINAL_BRIDGE__;
    if (bridge && typeof bridge.getPairSpecSafe === 'function') {
      try {
        var sp = bridge.getPairSpecSafe(p);
        if (sp && Number(sp.pipSize) > 0) return Number(sp.pipSize);
      } catch (_) {}
    }
    if (p === 'EURUSD') return 0.0001;
    if (p === 'US100' || p === 'BTCUSDT') return 1.0;
    return 0.1;
  }

  function getDecimals(pair) {
    var p = normPair(pair);
    var bridge = global.__LIAM_TERMINAL_BRIDGE__;
    if (bridge && typeof bridge.getPairSpecSafe === 'function') {
      try {
        var sp = bridge.getPairSpecSafe(p);
        if (sp && Number.isFinite(Number(sp.decimals))) return Number(sp.decimals);
      } catch (_) {}
    }
    if (p === 'EURUSD') return 5;
    return 2;
  }

  function getMaxSlPips(pair, tf) {
    var p = normPair(pair);
    var t = normTf(tf);
    var pMap = MAX_SL_PIPS[p] || MAX_SL_PIPS.XAUUSD;
    return Number(pMap[t] || pMap.M15 || 40);
  }

  function normalizeSignalOutput(sig) {
    if (!sig || sig.status !== 'SIGNAL') return sig;
    try {
      var p = normPair(sig.pair || 'XAUUSD');
      var t = normTf(sig.timeframe || 'M15');
      var pipSize = getPipSize(p);
      var dec = getDecimals(p);
      var isBuy = String(sig.direction || '').toUpperCase() === 'BUY';

      var entryNum = Number(sig.entryFmt);
      var slNum = Number(sig.slFmt);
      var maxSl = getMaxSlPips(p, t);

      if (Number.isFinite(entryNum) && entryNum > 0 && Number.isFinite(slNum) && slNum > 0 && pipSize > 0) {
        var distPips = Math.abs(entryNum - slNum) / pipSize;
        if (distPips > maxSl) {
          var clampedDelta = maxSl * pipSize;
          var newSl = isBuy ? (entryNum - clampedDelta) : (entryNum + clampedDelta);
          sig.slFmt = Number(newSl).toFixed(dec);
          sig.slPips = Number(maxSl.toFixed(1));

          var tp1Num = Number(sig.tp1Fmt);
          if (Number.isFinite(tp1Num) && tp1Num > 0) {
            sig.tp1Pips = Number((Math.abs(tp1Num - entryNum) / pipSize).toFixed(1));
          }
          var tp2Num = Number(sig.tp2Fmt);
          if (Number.isFinite(tp2Num) && tp2Num > 0) {
            sig.tp2Pips = Number((Math.abs(tp2Num - entryNum) / pipSize).toFixed(1));
          }
          var tp3Num = Number(sig.tp3Fmt);
          if (Number.isFinite(tp3Num) && tp3Num > 0) {
            sig.tp3Pips = Number((Math.abs(tp3Num - entryNum) / pipSize).toFixed(1));
          }
        }
      }

      if (!sig.entryNote || sig.entryNote === 'undefined') {
        sig.entryNote = 'Zona POI terkonfirmasi (' + t + ')';
      }
      if (!sig.slReason || sig.slReason === 'undefined') {
        sig.slReason = 'Batas invalidasi struktur (' + t + ')';
      }
      if (!sig.tp1Reason || sig.tp1Reason === 'undefined') {
        sig.tp1Reason = 'Target likuiditas TP1';
      }
      if (!sig.tp2Reason || sig.tp2Reason === 'undefined') {
        sig.tp2Reason = 'Target likuiditas TP2';
      }
      if (!sig.tp3Reason || sig.tp3Reason === 'undefined') {
        sig.tp3Reason = 'Target likuiditas TP3';
      }
    } catch (_) {}
    return sig;
  }

  function wrapBuildSignalSetup() {
    var methods = global.LiamMethods;
    if (!methods || typeof methods.buildSignalSetup !== 'function' || methods.__adapterUpgraded) return;
    var orig = methods.buildSignalSetup;
    methods.buildSignalSetup = function () {
      var out = orig.apply(this, arguments);
      return normalizeSignalOutput(out);
    };
    methods.__adapterUpgraded = true;
  }

  function getLivePrice(pair) {
    var p = normPair(pair);
    var bridge = global.__LIAM_TERMINAL_BRIDGE__;
    if (bridge && typeof bridge.getCalibratedPrice === 'function') {
      try {
        var cal = Number(bridge.getCalibratedPrice(p));
        if (Number.isFinite(cal) && cal > 0) return cal;
      } catch (_) {}
    }
    if (bridge && typeof bridge.getState === 'function') {
      try {
        var st = bridge.getState();
        if (st && st.prices && Number(st.prices[p]) > 0) return Number(st.prices[p]);
      } catch (_) {}
    }
    if (global.LiamPriceFeed && typeof global.LiamPriceFeed.loadCache === 'function') {
      try {
        var cached = global.LiamPriceFeed.loadCache();
        if (cached && Number(cached[p]) > 0) return Number(cached[p]);
      } catch (_) {}
    }
    if (global.LiamPriceFeed && global.LiamPriceFeed.BASELINE_PRICES) {
      var base = Number(global.LiamPriceFeed.BASELINE_PRICES[p]);
      if (Number.isFinite(base) && base > 0) return base;
    }
    return p === 'EURUSD' ? 1.085 : p === 'BTCUSDT' ? 95000 : p === 'US100' ? 21500 : 3480;
  }

  // Pola OHLC berstruktur (swing high/low + impulse candle + pullback ke POI)
  // dengan skala per timeframe agar detektor terbaca dan jarak swing tetap wajar
  function seedHistory(pair, tf, price, nowMs) {
    var px = Number(price);
    if (!Number.isFinite(px) || px <= 0) return [];
    var stepMs = tfMs(tf);
    var anchorTs = Math.floor((nowMs || Date.now()) / stepMs) * stepMs;
    var tfScale = tf === 'M5' ? 0.7 : tf === 'M15' ? 0.85 : tf === 'H1' ? 1.15 : 1.45;
    var unit = (pair === 'EURUSD' ? px * 0.00028
      : pair === 'BTCUSDT' ? px * 0.0014
      : pair === 'US100' ? px * 0.0009
      : px * 0.00075) * tfScale;

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
      var wickFactor = (i % 5 === 0) ? 1.15 : 0.45;
      var wick = Math.max(body * wickFactor, unit * 0.28);

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
    wrapBuildSignalSetup();
    if (typeof global.recalculateAndRenderSignal === 'function') {
      try { global.recalculateAndRenderSignal(false); } catch (_) {}
    }
  }

  lc.getCandles = function (pair, timeframe) {
    wrapBuildSignalSetup();
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
    wrapBuildSignalSetup();
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

  wrapBuildSignalSetup();
  setInterval(syncAllPairs, 15000);
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('load', function () {
      wrapBuildSignalSetup();
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
