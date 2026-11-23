/**
 * price-feed.js — Modul Khusus Harga Live Real-Time (Multi-Source + Cache Aman)
 */
(function (global) {
  'use strict';

  const CACHE_KEY = 'liamvtrade_last_live_prices';

  async function fetchWithTimeout(url, ms = 5000) {
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

  function loadCachedLivePrices() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveCachedLivePrices(pricesObj) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(pricesObj));
    } catch (_) {}
  }

  async function fetchAccuratePrices(tdApiKey) {
    const cached = loadCachedLivePrices() || {};
    const result = {
      XAUUSD: cached.XAUUSD || null,
      US100: cached.US100 || null,
      BTCUSDT: cached.BTCUSDT || null,
      EURUSD: cached.EURUSD || null,
      source: cached.XAUUSD ? 'Cached Live' : ''
    };

    // 1. Twelve Data API Key (jika diisi di Profil)
    if (tdApiKey && tdApiKey.trim().length > 8) {
      try {
        const key = encodeURIComponent(tdApiKey.trim());
        const res = await fetchWithTimeout(`https://api.twelvedata.com/price?symbol=XAU/USD,NDX,BTC/USD,EUR/USD&apikey=${key}`);
        if (res.ok) {
          const d = await res.json();
          if (Number(d['XAU/USD']?.price) > 500) result.XAUUSD = Number(Number(d['XAU/USD'].price).toFixed(2));
          if (Number(d['NDX']?.price) > 5000) result.US100 = Number(Number(d['NDX'].price).toFixed(2));
          if (Number(d['BTC/USD']?.price) > 1000) result.BTCUSDT = Number(Number(d['BTC/USD'].price).toFixed(2));
          if (Number(d['EUR/USD']?.price) > 0.5) result.EURUSD = Number(Number(d['EUR/USD'].price).toFixed(5));
          if (result.XAUUSD || result.US100) result.source = 'TwelveData Live';
        }
      } catch (_) {}
    }

    // 2. BTCUSDT dari Binance Public API
    try {
      const res = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      if (res.ok) {
        const d = await res.json();
        if (Number(d.price) > 1000) {
          result.BTCUSDT = Number(Number(d.price).toFixed(2));
          if (!result.source || result.source === 'Cached Live') result.source = 'Live Market Feed';
        }
      }
    } catch (_) {}

    // 3. XAUUSD — Coba beberapa endpoint publik berurutan
    const goldEndpoints = [
      async () => {
        const r = await fetchWithTimeout('https://api.gold-api.com/price/XAU');
        if (!r.ok) return null;
        const j = await r.json();
        return Number(j?.price);
      },
      async () => {
        const r = await fetchWithTimeout('https://data-asg.goldprice.org/dbAsset/XAU');
        if (!r.ok) return null;
        const j = await r.json();
        return Number(j?.items?.[0]?.xauPrice);
      },
      async () => {
        const target = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${target}`, 6500);
        if (!r.ok) return null;
        const j = await r.json();
        return Number(j?.chart?.result?.[0]?.meta?.regularMarketPrice);
      },
      async () => {
        const r = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
        if (!r.ok) return null;
        const j = await r.json();
        return Number(j?.price);
      }
    ];

    for (const fn of goldEndpoints) {
      try {
        const px = await fn();
        if (Number.isFinite(px) && px > 500) {
          result.XAUUSD = Number(px.toFixed(2));
          result.source = 'Live Spot XAU';
          break;
        }
      } catch (_) {}
    }

    // 4. EURUSD
    try {
      const resEur = await fetchWithTimeout('https://open.er-api.com/v6/latest/EUR');
      if (resEur.ok) {
        const e = await resEur.json();
        const usdRate = Number(e?.rates?.USD);
        if (usdRate > 0.5 && usdRate < 2.5) {
          result.EURUSD = Number(usdRate.toFixed(5));
        }
      }
    } catch (_) {}

    // 5. US100 (Nasdaq-100 / NQ=F)
    try {
      const target = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1m&range=1d');
      const resUs = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${target}`, 6500);
      if (resUs.ok) {
        const dUs = await resUs.json();
        const px = Number(dUs?.chart?.result?.[0]?.meta?.regularMarketPrice);
        if (px > 5000) {
          result.US100 = Number(px.toFixed(2));
        }
      }
    } catch (_) {}

    saveCachedLivePrices({
      XAUUSD: result.XAUUSD,
      US100: result.US100,
      BTCUSDT: result.BTCUSDT,
      EURUSD: result.EURUSD
    });

    return result;
  }

  global.LiamPriceFeed = {
    fetchAccuratePrices
  };
})(window);
