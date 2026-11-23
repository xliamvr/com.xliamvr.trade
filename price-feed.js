/**
 * price-feed.js — Modul Khusus Harga Live Real-Time
 * Terpisah dari app.js agar kalibrasi dan sumber harga bisa diperbaiki tanpa menyentuh fitur lain.
 */
(function (global) {
  'use strict';

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

  async function fetchAccuratePrices(tdApiKey) {
    const result = {
      XAUUSD: null,
      US100: null,
      BTCUSDT: null,
      EURUSD: null,
      source: ''
    };

    // 1. Prioritas Utama: Twelve Data API Key (jika diisi user di tab Profil)
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

    // 2. BTCUSDT Real-Time dari Binance Public API (CORS-Enabled 100%)
    if (!result.BTCUSDT) {
      try {
        const res = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        if (res.ok) {
          const d = await res.json();
          if (Number(d.price) > 1000) {
            result.BTCUSDT = Number(Number(d.price).toFixed(2));
            if (!result.source) result.source = 'Live Market Feed';
          }
        }
      } catch (_) {}
    }

    // 3. XAUUSD Real-Time via Gold-API / Binance PAXG Spot + CORS Proxy Yahoo GC=F
    if (!result.XAUUSD) {
      try {
        const resGold = await fetchWithTimeout('https://api.gold-api.com/price/XAU');
        if (resGold.ok) {
          const g = await resGold.json();
          if (Number(g.price) > 500) {
            result.XAUUSD = Number(Number(g.price).toFixed(2));
            result.source = 'Live Spot XAU';
          }
        }
      } catch (_) {}
    }

    if (!result.XAUUSD) {
      try {
        const resPaxg = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
        if (resPaxg.ok) {
          const p = await resPaxg.json();
          if (Number(p.price) > 500) {
            result.XAUUSD = Number(Number(p.price).toFixed(2));
            result.source = 'Live Gold Spot';
          }
        }
      } catch (_) {}
    }

    // 4. EURUSD Real-Time via Frankfurter / Open Exchange Rate (CORS-Enabled)
    if (!result.EURUSD) {
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
    }

    // 5. US100 (Nasdaq-100) via AllOrigins CORS Bridge ke Yahoo Finance NQ=F
    if (!result.US100) {
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
    }

    return result;
  }

  global.LiamPriceFeed = {
    fetchAccuratePrices
  };
})(window);
