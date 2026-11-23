/**
 * price-feed.js — Modul Khusus Harga Live Real-Time (US100, BTCUSDT, EURUSD, XAUUSD)
 */
(function (global) {
  'use strict';

  const CACHE_KEY = 'liamvtrade_last_live_prices_v2';

  async function fetchWithTimeout(url, ms = 5500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveCache(obj) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  async function fetchAccuratePrices(tdApiKey) {
    const cached = loadCache() || {};
    const result = {
      XAUUSD: Number.isFinite(Number(cached.XAUUSD)) && Number(cached.XAUUSD) > 500 ? Number(cached.XAUUSD) : null,
      US100: Number.isFinite(Number(cached.US100)) && Number(cached.US100) > 10000 ? Number(cached.US100) : null,
      BTCUSDT: Number.isFinite(Number(cached.BTCUSDT)) && Number(cached.BTCUSDT) > 1000 ? Number(cached.BTCUSDT) : null,
      EURUSD: Number.isFinite(Number(cached.EURUSD)) && Number(cached.EURUSD) > 0.5 ? Number(cached.EURUSD) : null,
      source: 'Live Feed'
    };

    if (tdApiKey && tdApiKey.trim().length > 8) {
      try {
        const key = encodeURIComponent(tdApiKey.trim());
        const res = await fetchWithTimeout(`https://api.twelvedata.com/price?symbol=XAU/USD,NDX,BTC/USD,EUR/USD&apikey=${key}`);
        if (res.ok) {
          const d = await res.json();
          if (Number(d['XAU/USD']?.price) > 500) result.XAUUSD = Number(Number(d['XAU/USD'].price).toFixed(2));
          if (Number(d['NDX']?.price) > 10000) result.US100 = Number(Number(d['NDX'].price).toFixed(2));
          if (Number(d['BTC/USD']?.price) > 1000) result.BTCUSDT = Number(Number(d['BTC/USD'].price).toFixed(2));
          if (Number(d['EUR/USD']?.price) > 0.5) result.EURUSD = Number(Number(d['EUR/USD'].price).toFixed(5));
          result.source = 'TwelveData';
        }
      } catch (_) {}
    }

    // BTCUSDT
    try {
      const r = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      if (r.ok) {
        const j = await r.json();
        const px = Number(j?.price);
        if (px > 1000) {
          result.BTCUSDT = Number(px.toFixed(2));
          result.source = 'Binance Live';
        }
      }
    } catch (_) {}

    if (!result.BTCUSDT) {
      try {
        const r = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (r.ok) {
          const j = await r.json();
          const px = Number(j?.bitcoin?.usd);
          if (px > 1000) {
            result.BTCUSDT = Number(px.toFixed(2));
            result.source = 'CoinGecko Live';
          }
        }
      } catch (_) {}
    }

    // XAUUSD
    const goldSources = [
      async () => {
        const r = await fetchWithTimeout('https://api.gold-api.com/price/XAU');
        if (!r.ok) return null;
        return Number((await r.json())?.price);
      },
      async () => {
        const r = await fetchWithTimeout('https://data-asg.goldprice.org/dbAsset/XAU');
        if (!r.ok) return null;
        return Number((await r.json())?.items?.[0]?.xauPrice);
      },
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 6500);
        if (!r.ok) return null;
        return Number((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice);
      }
    ];
    for (const fn of goldSources) {
      try {
        const px = await fn();
        if (Number.isFinite(px) && px > 500) {
          result.XAUUSD = Number(px.toFixed(2));
          result.source = 'Live Spot';
          break;
        }
      } catch (_) {}
    }

    // EURUSD
    try {
      const r = await fetchWithTimeout('https://api.frankfurter.app/latest?from=EUR&to=USD');
      if (r.ok) {
        const j = await r.json();
        const px = Number(j?.rates?.USD);
        if (px > 0.5 && px < 2.5) result.EURUSD = Number(px.toFixed(5));
      }
    } catch (_) {}

    if (!result.EURUSD) {
      try {
        const r = await fetchWithTimeout('https://open.er-api.com/v6/latest/EUR');
        if (r.ok) {
          const j = await r.json();
          const px = Number(j?.rates?.USD);
          if (px > 0.5 && px < 2.5) result.EURUSD = Number(px.toFixed(5));
        }
      } catch (_) {}
    }

    // US100 (Yahoo NQ=F / ^NDX / Stooq)
    const ndxSources = [
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 6500);
        if (!r.ok) return null;
        return Number((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice);
      },
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5ENDX?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 6500);
        if (!r.ok) return null;
        return Number((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice);
      },
      async () => {
        const u = encodeURIComponent('https://stooq.com/q/l/?s=nq.f&f=sd2t2ohlcv&h&e=csv');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 6500);
        if (!r.ok) return null;
        const lines = (await r.text()).trim().split('\n');
        return lines.length > 1 ? Number(lines[1].split(',')[6]) : null;
      }
    ];
    for (const fn of ndxSources) {
      try {
        const px = await fn();
        if (Number.isFinite(px) && px > 10000) {
          result.US100 = Number(px.toFixed(2));
          break;
        }
      } catch (_) {}
    }

    saveCache(result);
    return result;
  }

  global.LiamPriceFeed = { fetchAccuratePrices };
})(window);
