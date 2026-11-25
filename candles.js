/**
 * Liamvtrade Quant Terminal — candles.js
 * Fetcher OHLC Candle Nyata (Binance Klines & TwelveData Time Series)
 * dengan Cache per Pair/Timeframe, Deduplikasi Request, dan Fallback Cache Lokal.
 */

(function (global) {
  'use strict';

  const CACHE_PREFIX = 'liamvtrade_ohlc_v1_';
  const DEFAULT_TTL_MS = {
    M5: 30 * 1000,
    M15: 60 * 1000,
    H1: 3 * 60 * 1000,
    H4: 5 * 60 * 1000
  };

  const TF_TO_BINANCE = {
    M5: '5m',
    M15: '15m',
    H1: '1h',
    H4: '4h'
  };

  const TF_TO_TWELVEDATA = {
    M5: '5min',
    M15: '15min',
    H1: '1h',
    H4: '4h'
  };

  const memoryCache = new Map();
  const inFlightRequests = new Map();

  function normalizePair(pair) {
    const clean = String(pair || 'XAUUSD').trim().toUpperCase();
    if (clean === 'BTC' || clean === 'BTCUSD' || clean === 'BTCUSDT') return 'BTCUSDT';
    if (clean === 'NDX' || clean === 'NASDAQ' || clean === 'US100') return 'US100';
    if (clean === 'GOLD' || clean === 'XAU' || clean === 'XAUUSD') return 'XAUUSD';
    if (clean === 'EUR' || clean === 'EURUSD') return 'EURUSD';
    return clean;
  }

  function normalizeTimeframe(tf) {
    const clean = String(tf || 'M15').trim().toUpperCase();
    return TF_TO_BINANCE[clean] ? clean : 'M15';
  }

  function toTwelveDataSymbol(pair) {
    const p = normalizePair(pair);
    if (p === 'XAUUSD') return 'XAU/USD';
    if (p === 'EURUSD') return 'EUR/USD';
    if (p === 'US100') return 'NDX';
    return p;
  }

  function getTwelveDataApiKey(overrideKey) {
    if (typeof overrideKey === 'string' && overrideKey.trim()) {
      return overrideKey.trim();
    }
    if (typeof global.LIAM_TWELVEDATA_KEY === 'string' && global.LIAM_TWELVEDATA_KEY.trim()) {
      return global.LIAM_TWELVEDATA_KEY.trim();
    }
    if (typeof global.TWELVEDATA_API_KEY === 'string' && global.TWELVEDATA_API_KEY.trim()) {
      return global.TWELVEDATA_API_KEY.trim();
    }
    try {
      const saved = global.localStorage && global.localStorage.getItem('liamvtrade_twelvedata_key');
      if (saved && saved.trim()) return saved.trim();
    } catch (_) {
      // Abaikan error akses localStorage
    }
    return '';
  }

  function setTwelveDataApiKey(key) {
    const clean = String(key || '').trim();
    global.LIAM_TWELVEDATA_KEY = clean;
    try {
      if (global.localStorage) {
        if (clean) {
          global.localStorage.setItem('liamvtrade_twelvedata_key', clean);
        } else {
          global.localStorage.removeItem('liamvtrade_twelvedata_key');
        }
      }
    } catch (_) {
      // Abaikan error akses localStorage
    }
  }

  function normalizeCandles(rawList) {
    if (!Array.isArray(rawList)) return [];
    const normalized = [];

    for (let i = 0; i < rawList.length; i += 1) {
      const item = rawList[i];
      if (!item) continue;

      let ts, open, high, low, close, volume;
      if (Array.isArray(item)) {
        ts = Number(item[0]);
        open = Number(item[1]);
        high = Number(item[2]);
        low = Number(item[3]);
        close = Number(item[4]);
        volume = Number(item[5] || 0);
      } else {
        ts = Number(item.timestampMs || item.timeMs || item.ts || item.time || item.openTime || item.datetime || 0);
        if (!Number.isFinite(ts) || ts === 0) {
          const parsedDate = Date.parse(item.datetime || item.time || '');
          ts = Number.isFinite(parsedDate) ? parsedDate : 0;
        }
        if (ts > 0 && ts < 1e12) ts = ts * 1000;
        open = Number(item.open !== undefined ? item.open : item.o);
        high = Number(item.high !== undefined ? item.high : item.h);
        low = Number(item.low !== undefined ? item.low : item.l);
        close = Number(item.close !== undefined ? item.close : item.c);
        volume = Number(item.volume !== undefined ? item.volume : (item.v || 0));
      }

      if (!Number.isFinite(ts) || ts <= 0) continue;
      if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        continue;
      }
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;

      const realHigh = Math.max(open, high, low, close);
      const realLow = Math.min(open, high, low, close);

      normalized.push({
        ts,
        timestampMs: ts,
        open,
        high: realHigh,
        low: realLow,
        close,
        volume: Number.isFinite(volume) ? volume : 0
      });
    }

    normalized.sort((a, b) => a.ts - b.ts);

    const deduped = [];
    for (const c of normalized) {
      if (deduped.length > 0 && deduped[deduped.length - 1].ts === c.ts) {
        deduped[deduped.length - 1] = c;
      } else {
        deduped.push(c);
      }
    }
    return deduped;
  }

  function getCacheKey(pair, timeframe) {
    return `${CACHE_PREFIX}${normalizePair(pair)}_${normalizeTimeframe(timeframe)}`;
  }

  function readStorageCache(cacheKey) {
    try {
      if (!global.localStorage) return null;
      const raw = global.localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.candles)) return null;
      return {
        candles: normalizeCandles(parsed.candles),
        fetchedAt: Number(parsed.fetchedAt) || 0,
        source: parsed.source || 'cache'
      };
    } catch (_) {
      return null;
    }
  }

  function writeStorageCache(cacheKey, payload) {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (_) {
      // Abaikan jika quota penuh atau storage diblokir
    }
  }

  function getCachedCandles(pair, timeframe, options) {
    const opts = options || {};
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(timeframe);
    const key = getCacheKey(p, tf);
    const ttlMs = Number.isFinite(Number(opts.ttlMs))
      ? Number(opts.ttlMs)
      : (DEFAULT_TTL_MS[tf] || 60000);
    const now = Date.now();

    let entry = memoryCache.get(key);
    if (!entry) {
      entry = readStorageCache(key);
      if (entry) memoryCache.set(key, entry);
    }

    if (!entry || !Array.isArray(entry.candles) || entry.candles.length === 0) {
      return null;
    }

    const ageMs = now - (entry.fetchedAt || 0);
    const isFresh = ageMs >= 0 && ageMs <= ttlMs;
    if (!isFresh && !opts.allowStale) {
      return null;
    }

    return {
      pair: p,
      timeframe: tf,
      candles: entry.candles,
      lastPrice: entry.candles[entry.candles.length - 1].close,
      lastCandleTs: entry.candles[entry.candles.length - 1].ts,
      fetchedAt: entry.fetchedAt,
      ageMs,
      isFresh,
      source: entry.source || 'cache',
      fromCache: true
    };
  }

  function saveCachedCandles(pair, timeframe, candles, source) {
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(timeframe);
    const key = getCacheKey(p, tf);
    const cleanCandles = normalizeCandles(candles);
    if (cleanCandles.length === 0) return null;

    const payload = {
      pair: p,
      timeframe: tf,
      candles: cleanCandles.slice(-300),
      fetchedAt: Date.now(),
      source: source || 'live'
    };

    memoryCache.set(key, payload);
    writeStorageCache(key, payload);

    return {
      pair: p,
      timeframe: tf,
      candles: payload.candles,
      lastPrice: payload.candles[payload.candles.length - 1].close,
      lastCandleTs: payload.candles[payload.candles.length - 1].ts,
      fetchedAt: payload.fetchedAt,
      ageMs: 0,
      isFresh: true,
      source: payload.source,
      fromCache: false
    };
  }

  async function fetchBinanceKlines(pair, timeframe, limit) {
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(timeframe);
    const interval = TF_TO_BINANCE[tf];
    const safeLimit = Math.min(500, Math.max(20, Number(limit) || 150));
    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(p)}&interval=${encodeURIComponent(interval)}&limit=${safeLimit}`;

    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Binance klines HTTP ${resp.status}`);
    }
    const json = await resp.json();
    if (!Array.isArray(json)) {
      throw new Error('Format respons Binance klines tidak valid');
    }

    const candles = normalizeCandles(json);
    if (candles.length === 0) {
      throw new Error('Candle Binance kosong');
    }
    return candles;
  }

  async function fetchTwelveDataSeries(pair, timeframe, limit, apiKeyOverride) {
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(timeframe);
    const interval = TF_TO_TWELVEDATA[tf];
    const symbol = toTwelveDataSymbol(p);
    const outputsize = Math.min(300, Math.max(20, Number(limit) || 120));
    const apiKey = getTwelveDataApiKey(apiKeyOverride);

    if (!apiKey) {
      throw new Error('TwelveData API key belum diatur');
    }

    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&outputsize=${outputsize}&apikey=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`TwelveData HTTP ${resp.status}`);
    }
    const json = await resp.json();
    if (!json || json.status === 'error' || !Array.isArray(json.values)) {
      throw new Error(json && json.message ? `TwelveData: ${json.message}` : 'Respons TwelveData tidak valid');
    }

    const candles = normalizeCandles(json.values);
    if (candles.length === 0) {
      throw new Error('Candle TwelveData kosong');
    }
    return candles;
  }

  async function fetchCandles(pair, timeframe, options) {
    const opts = options || {};
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(timeframe);
    const force = Boolean(opts.force);
    const limit = Number(opts.limit) || 150;

    if (!force) {
      const cached = getCachedCandles(p, tf, { ttlMs: opts.ttlMs, allowStale: false });
      if (cached) return cached;
    }

    const reqKey = `${p}_${tf}_${limit}`;
    if (inFlightRequests.has(reqKey)) {
      return inFlightRequests.get(reqKey);
    }

    const task = (async () => {
      try {
        let candles;
        let source;
        if (p === 'BTCUSDT') {
          candles = await fetchBinanceKlines(p, tf, limit);
          source = 'binance';
        } else {
          candles = await fetchTwelveDataSeries(p, tf, limit, opts.apiKey);
          source = 'twelvedata';
        }
        return saveCachedCandles(p, tf, candles, source);
      } catch (err) {
        const stale = getCachedCandles(p, tf, { allowStale: true });
        if (stale && stale.candles.length > 0) {
          return Object.assign({}, stale, {
            isFresh: false,
            staleFallback: true,
            error: err && err.message ? err.message : String(err)
          });
        }
        return {
          pair: p,
          timeframe: tf,
          candles: [],
          lastPrice: null,
          lastCandleTs: null,
          fetchedAt: null,
          isFresh: false,
          fromCache: false,
          source: p === 'BTCUSDT' ? 'binance' : 'twelvedata',
          error: err && err.message ? err.message : String(err)
        };
      } finally {
        inFlightRequests.delete(reqKey);
      }
    })();

    inFlightRequests.set(reqKey, task);
    return task;
  }

  async function fetchMultiTimeframeBundle(pair, entryTimeframe, options) {
    const opts = options || {};
    const p = normalizePair(pair);
    const tf = normalizeTimeframe(entryTimeframe || 'M15');
    const limit = Number(opts.limit) || 150;

    const [entryRes, h1Res, h4Res] = await Promise.all([
      fetchCandles(p, tf, Object.assign({}, opts, { limit })),
      tf === 'H1' ? Promise.resolve(null) : fetchCandles(p, 'H1', Object.assign({}, opts, { limit: Math.min(limit, 120) })),
      tf === 'H4' ? Promise.resolve(null) : fetchCandles(p, 'H4', Object.assign({}, opts, { limit: Math.min(limit, 120) }))
    ]);

    const candles = (entryRes && entryRes.candles) || [];
    const h1Candles = tf === 'H1' ? candles : ((h1Res && h1Res.candles) || []);
    const h4Candles = tf === 'H4' ? candles : ((h4Res && h4Res.candles) || []);

    const primaryMeta = entryRes || {};
    const livePrice = Number.isFinite(Number(primaryMeta.lastPrice)) && primaryMeta.lastPrice > 0
      ? Number(primaryMeta.lastPrice)
      : (candles.length > 0 ? candles[candles.length - 1].close : null);

    const lastCandleTs = Number.isFinite(Number(primaryMeta.lastCandleTs)) && primaryMeta.lastCandleTs > 0
      ? Number(primaryMeta.lastCandleTs)
      : (candles.length > 0 ? candles[candles.length - 1].ts : null);

    const isVerifiedLive = Boolean(
      primaryMeta.fromCache === false &&
      primaryMeta.isFresh === true &&
      !primaryMeta.error &&
      candles.length > 0
    );

    return {
      pair: p,
      timeframe: tf,
      candles,
      h1Candles,
      h4Candles,
      livePrice,
      lastCandleTs,
      fetchedAt: primaryMeta.fetchedAt || null,
      source: primaryMeta.source || 'unknown',
      fromCache: Boolean(primaryMeta.fromCache),
      isVerifiedLive,
      error: primaryMeta.error || null,
      meta: {
        entry: entryRes,
        h1: h1Res,
        h4: h4Res
      }
    };
  }

  function clearCandleCache(pair, timeframe) {
    if (pair && timeframe) {
      const key = getCacheKey(pair, timeframe);
      memoryCache.delete(key);
      try {
        if (global.localStorage) global.localStorage.removeItem(key);
      } catch (_) {}
      return;
    }
    memoryCache.clear();
    try {
      if (!global.localStorage) return;
      const keysToRemove = [];
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const k = global.localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) keysToRemove.push(k);
      }
      for (const k of keysToRemove) {
        global.localStorage.removeItem(k);
      }
    } catch (_) {}
  }

  global.LiamCandles = {
    DEFAULT_TTL_MS,
    normalizePair,
    normalizeTimeframe,
    toTwelveDataSymbol,
    getTwelveDataApiKey,
    setTwelveDataApiKey,
    normalizeCandles,
    getCachedCandles,
    fetchCandles,
    fetchMultiTimeframeBundle,
    clearCandleCache
  };
})(window);
