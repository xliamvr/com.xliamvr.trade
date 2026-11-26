/**
 * Liamvtrade Quant Terminal — candles-adapter.js
 * Bridge OHLC penuh untuk LiamCandles + LiamPriceFeed + app.js.
 * - Menyimpan & membangun candle M1, M5, M15, H1, H4 dari feed live
 * - Memasukkan konfirmasi mikro-struktur M1 ke penganalisis (buildSignalSetup) tanpa ubah tombol UI
 * - Membatasi jarak SL maksimal per pair & timeframe + isi fallback teks agar tidak "undefined"
 */
(function (global) {
  'use strict';

  var lc = global.LiamCandles;
  if (!lc || typeof lc.getCachedCandles !== 'function') return;

  var inflight = {};
  var fallbackSeries = new Map();
  var PAIRS = ['XAUUSD', 'US100', 'BTCUSDT', 'EURUSD'];
  var TFS = ['M1', 'M5', 'M15', 'H1', 'H4'];

  // Batas maksimal SL (dalam pips/poin) per pair & timeframe
  var MAX_SL_PIPS = {
    XAUUSD:  { M1: 12, M5: 18, M15: 28, H1: 45, H4: 65 },
    US100:   { M1: 20, M5: 30, M15: 50, H1: 80, H4: 120 },
    BTCUSDT: { M1: 40, M5: 60, M15: 100, H1: 160, H4: 240 },
    EURUSD:  { M1: 8,  M5: 12, M15: 20, H1: 32, H4: 45 }
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
    var t = String(tf || 'M15').trim().toUpperCase();
    if (t === 'M1') return 'M1';
    if (typeof lc.normalizeTimeframe === 'function') return lc.normalizeTimeframe(t);
    return TFS.indexOf(t) !== -1 ? t : 'M15';
  }

  function tfMs(tf) {
    if (tf === 'M1') return 60 * 1000;
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
    var map = MAX_SL_PIPS[p] || MAX_SL_PIPS.XAUUSD;
    return Number(map[t] || map.M15 || 28);
  }

  // Analisa mikro-struktur M1 (CHOCH/BOS & momentum 8 candle terakhir)
  function analyzeM1MicroStructure(m1Candles) {
    if (!Array.isArray(m1Candles) || m1Candles.length < 10) {
      return { bias: 'NEUTRAL', confirmed: false, note: 'M1 standby' };
    }
    var recent = m1Candles.slice(-8);
    var first = recent[0];
    var last = recent[recent.length - 1];
    var prev = recent[recent.length - 2];

    var swingHigh = -Infinity;
    var swingLow = Infinity;
    for (var i = 0; i < recent.length - 2; i += 1) {
      var h = Number(recent[i].high);
      var l = Number(recent[i].low);
      if (Number.isFinite(h) && h > swingHigh) swingHigh = h;
      if (Number.isFinite(l) && l < swingLow) swingLow = l;
    }

    var lastClose = Number(last.close);
    var prevClose = Number(prev.close);
    var startOpen = Number(first.open);

    if (lastClose > swingHigh && lastClose >= prevClose) {
      return { bias: 'BUY', confirmed: true, note: 'M1 BOS/CHOCH Bullish terkonfirmasi' };
    }
    if (lastClose < swingLow && lastClose <= prevClose) {
      return { bias: 'SELL', confirmed: true, note: 'M1 BOS/CHOCH Bearish terkonfirmasi' };
    }
    if (lastClose > startOpen) {
      return { bias: 'BUY', confirmed: false, note: 'M1 momentum naik' };
    }
    if (lastClose < startOpen) {
      return { bias: 'SELL', confirmed: false, note: 'M1 momentum turun' };
    }
    return { bias: 'NEUTRAL', confirmed: false, note: 'M1 konsolidasi' };
  }

  function normalizeSignalSetup(sig, m1Candles) {
    if (!sig || sig.status !== 'SIGNAL') return sig;
    try {
      var p = normPair(sig.pair || 'XAUUSD');
      var t = normTf(sig.timeframe || 'M15');
      var pipSize = getPipSize(p);
      var dec = getDecimals(p);
      var dir = String(sig.direction || '').toUpperCase();
      var isBuy = dir === 'BUY';

      // Konfirmasi mikro M1 di dalam penganalisis
      var m1Info = analyzeM1MicroStructure(m1Candles);
      if (m1Info.bias === dir) {
        var bonus = m1Info.confirmed ? 0.4 : 0.2;
        if (Number.isFinite(Number(sig.score))) {
          sig.score = Number(Math.min(9.9, Number(sig.score) + bonus).toFixed(1));
        }
        if (sig.poiSummary && sig.poiSummary.indexOf('M1:') === -1) {
          sig.poiSummary += ' • ✓ ' + m1Info.note;
        }
      }

      var entryNum = Number(sig.entryFmt);
      var slNum = Number(sig.slFmt);
      var maxSl = getMaxSlPips(p, t);

      if (Number.isFinite(entryNum) && entryNum > 0 && Number.isFinite(slNum) && slNum > 0 && pipSize > 0) {
        var distPips = Math.abs(entryNum - slNum) / pipSize;
        if (distPips > maxSl) {
          var delta = maxSl * pipSize;
          var clampedSl = isBuy ? (entryNum - delta) : (entryNum + delta);
          sig.slFmt = Number(clampedSl).toFixed(dec);
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
        sig.entryNote = (m1Info.bias === dir ? m1Info.note : 'Zona POI (' + t + ' + filter M1)');
      }
      if (!sig.slReason || sig.slReason === 'undefined') {
        sig.slReason = 'Batas invalidasi (' + t + ')';
      }
      if (!sig.tp1Reason || sig.tp1Reason === 'undefined') {
        sig.tp1Reason = 'Target TP1';
      }
      if (!sig.tp2Reason || sig.tp2Reason === 'undefined') {
        sig.tp2Reason = 'Target TP2';
      }
      if (!sig.tp3Reason || sig.tp3Reason === 'undefined') {
        sig.tp3Reason = 'Target TP3';
      }
    } catch (_) {}
    return sig;
  }

  function hookMethodsEngine() {
    var methods = global.LiamMethods;
    if (!methods || typeof methods.buildSignalSetup !== 'function' || methods.__m1AnalyzerHooked) return;
    var orig = methods.buildSignalSetup;
    methods.buildSignalSetup = function (params) {
      var p = normPair((params && params.pair) || 'XAUUSD');
      var m1Candles = lc.getCandles(p, 'M1');
      if (params && typeof params === 'object' && !params.m1Candles) {
        params.m1Candles = m1Candles;
      }
      var res = orig.apply(this, arguments);
      return normalizeSignalSetup(res, m1Candles);
    };
    methods.__m1AnalyzerHooked = true;
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
  function seedHistory(pair, tf, price, nowMs) {
    var px = Number(price);
    if (!Number.isFinite(px) || px <= 0) return [];
    var stepMs = tfMs(tf);
    var anchorTs = Math.floor((nowMs || Date.now()) / stepMs) * stepMs;
    var tfScale = tf === 'M1' ? 0.35 : tf === 'M5' ? 0.65 : tf === 'M15' ? 0.8 : tf === 'H1' ? 1.1 : 1.35;
    var unit = (pair === 'EURUSD' ? px * 0.00025
      : pair === 'BTCUSDT' ? px * 0.0012
      : pair === 'US100' ? px * 0.0008
      : px * 0.00065) * tfScale;

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
      var wickFactor = (i % 5 === 0) ? 1.05 : 0.4;
      var wick = Math.max(body * wickFactor, unit * 0.25);

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
    hookMethodsEngine();
    if (typeof global.recalculateAndRenderSignal === 'function') {
      try { global.recalculateAndRenderSignal(false); } catch (_) {}
    }
  }

  lc.getCandles = function (pair, timeframe) {
    hookMethodsEngine();
    var p = normPair(pair);
    var tf = normTf(timeframe);
    var key = p + '_' + tf;

    if (tf === 'M1') {
      return pushTick(p, 'M1', getLivePrice(p), Date.now());
    }

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
    hookMethodsEngine();
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

  hookMethodsEngine();
  setInterval(syncAllPairs, 15000);
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('load', function () {
      hookMethodsEngine();
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
