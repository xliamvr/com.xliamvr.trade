/**
 * price-feed.js — Modul Khusus Harga Live Real-Time (US100, BTCUSDT, EURUSD, XAUUSD)
 * Dengan Timestamp Update (fetchedAtMs), Tracking Kuota TwelveData, Fallback Aman & Timeout Responsif
 */
(function (global) {
  'use strict';

  const CACHE_KEY = 'liamvtrade_last_live_prices_v2';

  const BASELINE_PRICES = {
    XAUUSD: 2650.00,
    US100: 20850.00,
    BTCUSDT: 92000.00,
    EURUSD: 1.08500
  };

  async function fetchWithTimeout(url, ms = 4000) {
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

  function pickValidPrice(val, minVal, maxVal = Infinity) {
    const num = Number(val);
    return Number.isFinite(num) && num > minVal && num < maxVal ? num : null;
  }

  function incrementTdQuota(amount = 4) {
    try {
      const bridge = global.__LIAM_TERMINAL_BRIDGE__;
      if (bridge && typeof bridge.getState === 'function') {
        const st = bridge.getState();
        st.tdQuotaUsed = Math.min(800, (Number(st.tdQuotaUsed) || 0) + amount);
      }
    } catch (_) {}
  }

  async function fetchAccuratePrices(tdApiKey) {
    const cached = loadCache() || {};
    const nowMs = Date.now();

    const result = {
      XAUUSD: pickValidPrice(cached.XAUUSD, 500, 20000) ?? BASELINE_PRICES.XAUUSD,
      US100: pickValidPrice(cached.US100, 5000, 100000) ?? BASELINE_PRICES.US100,
      BTCUSDT: pickValidPrice(cached.BTCUSDT, 1000, 1000000) ?? BASELINE_PRICES.BTCUSDT,
      EURUSD: pickValidPrice(cached.EURUSD, 0.5, 2.5) ?? BASELINE_PRICES.EURUSD,
      source: cached.source || 'Cached / Baseline',
      fetchedAtMs: nowMs,
      liveUpdated: false
    };

    // 1. TwelveData (jika API key diisi)
    if (tdApiKey && String(tdApiKey).trim().length > 8) {
      try {
        const key = encodeURIComponent(String(tdApiKey).trim());
        const res = await fetchWithTimeout(
          `https://api.twelvedata.com/price?symbol=XAU/USD,NDX,BTC/USD,EUR/USD&apikey=${key}`,
          4500
        );
        if (res.ok) {
          const d = await res.json();
          incrementTdQuota(4);
          const pxXau = pickValidPrice(d['XAU/USD']?.price, 500, 20000);
          const pxUs = pickValidPrice(d['NDX']?.price, 5000, 100000);
          const pxBtc = pickValidPrice(d['BTC/USD']?.price, 1000, 1000000);
          const pxEur = pickValidPrice(d['EUR/USD']?.price, 0.5, 2.5);

          if (pxXau) { result.XAUUSD = Number(pxXau.toFixed(2)); result.liveUpdated = true; }
          if (pxUs)  { result.US100 = Number(pxUs.toFixed(2));   result.liveUpdated = true; }
          if (pxBtc) { result.BTCUSDT = Number(pxBtc.toFixed(2)); result.liveUpdated = true; }
          if (pxEur) { result.EURUSD = Number(pxEur.toFixed(5));  result.liveUpdated = true; }
          if (result.liveUpdated) result.source = 'TwelveData';
        }
      } catch (_) {}
    }

    // 2. BTCUSDT (Binance -> CoinGecko)
    let btcUpdated = false;
    try {
      const r = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', 3500);
      if (r.ok) {
        const j = await r.json();
        const px = pickValidPrice(j?.price, 1000, 1000000);
        if (px) {
          result.BTCUSDT = Number(px.toFixed(2));
          btcUpdated = true;
          result.liveUpdated = true;
          if (!result.source.includes('TwelveData')) result.source = 'Binance Live';
        }
      }
    } catch (_) {}

    if (!btcUpdated) {
      try {
        const r = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', 4000);
        if (r.ok) {
          const j = await r.json();
          const px = pickValidPrice(j?.bitcoin?.usd, 1000, 1000000);
          if (px) {
            result.BTCUSDT = Number(px.toFixed(2));
            btcUpdated = true;
            result.liveUpdated = true;
            if (!result.source.includes('TwelveData')) result.source = 'CoinGecko Live';
          }
        }
      } catch (_) {}
    }

    // 3. XAUUSD (Gold-API -> GoldPrice -> Yahoo GC=F)
    const goldSources = [
      async () => {
        const r = await fetchWithTimeout('https://api.gold-api.com/price/XAU', 3500);
        if (!r.ok) return null;
        return pickValidPrice((await r.json())?.price, 500, 20000);
      },
      async () => {
        const r = await fetchWithTimeout('https://data-asg.goldprice.org/dbAsset/XAU', 3500);
        if (!r.ok) return null;
        return pickValidPrice((await r.json())?.items?.[0]?.xauPrice, 500, 20000);
      },
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 4500);
        if (!r.ok) return null;
        return pickValidPrice((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice, 500, 20000);
      }
    ];
    for (const fn of goldSources) {
      try {
        const px = await fn();
        if (px) {
          result.XAUUSD = Number(px.toFixed(2));
          result.liveUpdated = true;
          if (!result.source.includes('TwelveData')) result.source = 'Live Spot';
          break;
        }
      } catch (_) {}
    }

    // 4. EURUSD (Frankfurter -> Open ER-API)
    let eurUpdated = false;
    try {
      const r = await fetchWithTimeout('https://api.frankfurter.app/latest?from=EUR&to=USD', 3500);
      if (r.ok) {
        const j = await r.json();
        const px = pickValidPrice(j?.rates?.USD, 0.5, 2.5);
        if (px) {
          result.EURUSD = Number(px.toFixed(5));
          eurUpdated = true;
          result.liveUpdated = true;
        }
      }
    } catch (_) {}

    if (!eurUpdated) {
      try {
        const r = await fetchWithTimeout('https://open.er-api.com/v6/latest/EUR', 3500);
        if (r.ok) {
          const j = await r.json();
          const px = pickValidPrice(j?.rates?.USD, 0.5, 2.5);
          if (px) {
            result.EURUSD = Number(px.toFixed(5));
            eurUpdated = true;
            result.liveUpdated = true;
          }
        }
      } catch (_) {}
    }

    // 5. US100 (Yahoo NQ=F -> ^NDX -> Stooq)
    const ndxSources = [
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 4500);
        if (!r.ok) return null;
        return pickValidPrice((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice, 5000, 100000);
      },
      async () => {
        const u = encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5ENDX?interval=1m&range=1d');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 4500);
        if (!r.ok) return null;
        return pickValidPrice((await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice, 5000, 100000);
      },
      async () => {
        const u = encodeURIComponent('https://stooq.com/q/l/?s=nq.f&f=sd2t2ohlcv&h&e=csv');
        const r = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${u}`, 4500);
        if (!r.ok) return null;
        const lines = (await r.text()).trim().split('\n');
        return lines.length > 1 ? pickValidPrice(lines[1].split(',')[6], 5000, 100000) : null;
      }
    ];
    for (const fn of ndxSources) {
      try {
        const px = await fn();
        if (px) {
          result.US100 = Number(px.toFixed(2));
          result.liveUpdated = true;
          break;
        }
      } catch (_) {}
    }

    result.fetchedAtMs = Date.now();
    saveCache(result);
    return result;
  }

  global.LiamPriceFeed = { fetchAccuratePrices };
})(window);
