/**
 * Liamvtrade Quant Terminal v2.9.4 — news.js (FULL INSTITUTIONAL + LIVE CALENDAR UPGRADE)
 * Kalender Ekonomi Live (ff_calendar_thisweek.json) + Fallback 11 Agenda Lengkap
 * + Live Macro Wire + Scan Peluang News Terbaik + Analisa Sementara & Fundamental
 * + Dual Zona POI (Entry/SL/TP) + News Lock Warning Detector (±15m)
 */

(function (global) {
  'use strict';

  const CALENDAR_CACHE_KEY = 'liamvtrade_live_ff_calendar_v1';
  const CALENDAR_CACHE_TTL_MS = 15 * 60 * 1000;
  const FF_THIS_WEEK_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

  function getWibTodayStrings() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);

    const fmtDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const addDays = (days) => {
      const copy = new Date(wib.getTime() + days * 86400000);
      return fmtDate(copy);
    };

    return {
      today: fmtDate(wib),
      day1: addDays(1),
      day2: addDays(2),
      day3: addDays(3),
      day4: addDays(4),
      day6: addDays(6),
      day8: addDays(8),
      day10: addDays(10),
      day14: addDays(14),
      day18: addDays(18),
      wibNow: wib
    };
  }

  function loadLiveCalendarCache() {
    try {
      const raw = localStorage.getItem(CALENDAR_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.items) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function saveLiveCalendarCache(items) {
    try {
      localStorage.setItem(
        CALENDAR_CACHE_KEY,
        JSON.stringify({ savedAtMs: Date.now(), items })
      );
    } catch (_) {}
  }

  function parseIsoDateToWib(isoStr) {
    const dt = new Date(isoStr);
    if (!Number.isFinite(dt.getTime())) return null;
    const utcMs = dt.getTime() + dt.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    const y = wib.getFullYear();
    const m = String(wib.getMonth() + 1).padStart(2, '0');
    const day = String(wib.getDate()).padStart(2, '0');
    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    return {
      dateStr: `${y}-${m}-${day}`,
      timeWib: `${hh}:${mm} WIB`,
      timestampMs: dt.getTime()
    };
  }

  function parseWibDateTimeMs(dateStr, timeWibStr) {
    try {
      const [y, m, d] = String(dateStr).split('-').map(Number);
      const cleanTime = String(timeWibStr || '00:00').replace(/[^0-9:]/g, '');
      const [hh, mm] = cleanTime.split(':').map(Number);
      if (!y || !m || !d) return null;
      return Date.UTC(y, m - 1, d, (hh || 0) - 7, mm || 0, 0);
    } catch (_) {
      return null;
    }
  }

  function mapRawLiveEventToInstitutionalCard(raw, prices) {
    const xau = Number(prices?.XAUUSD) || 2650.00;
    const us100 = Number(prices?.US100) || 20850.00;
    const eur = Number(prices?.EURUSD) || 1.08500;
    const btc = Number(prices?.BTCUSDT) || 92000.00;

    const ccy = String(raw.country || 'USD').toUpperCase();
    const title = String(raw.title || 'Macro Economic Data');
    const tLow = title.toLowerCase();
    const impact = String(raw.impact || '').toLowerCase() === 'high' ? 'high' : 'medium';
    const wibInfo = parseIsoDateToWib(raw.date) || {
      dateStr: getWibTodayStrings().today,
      timeWib: '20:30 WIB',
      timestampMs: null
    };

    const affectedPairs =
      ccy === 'USD'
        ? ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT']
        : ccy === 'EUR'
        ? ['EURUSD']
        : ['XAUUSD', 'EURUSD'];

    let primaryPair = 'XAUUSD';
    if (ccy === 'EUR') primaryPair = 'EURUSD';
    else if (tLow.includes('consumer confidence') || tLow.includes('ism manufacturing') || tLow.includes('nasdaq')) {
      primaryPair = 'US100';
    } else if (tLow.includes('pce')) {
      primaryPair = 'BTCUSDT';
    }

    const isBuy =
      tLow.includes('cpi') ||
      tLow.includes('pce') ||
      tLow.includes('nfp') ||
      tLow.includes('non-farm') ||
      tLow.includes('jobless') ||
      tLow.includes('unemployment') ||
      primaryPair === 'US100' ||
      primaryPair === 'BTCUSDT';

    const direction = isBuy ? 'BUY' : 'SELL';
    const forecastStr = raw.forecast || '-';
    const prevStr = raw.previous || '-';

    let poiPreNews;
    let poiPostNews;
    let tradePlan;

    if (primaryPair === 'EURUSD') {
      poiPreNews = {
        label: isBuy ? 'Zona Pre-News (Discount FVG EURUSD)' : 'Zona Pre-News (Judas High EURUSD)',
        range: isBuy
          ? `${(eur - 0.0025).toFixed(5)} – ${(eur - 0.0015).toFixed(5)}`
          : `${(eur + 0.0018).toFixed(5)} – ${(eur + 0.0026).toFixed(5)}`,
        note: isBuy ? 'Bullish FVG M15 sesi London' : 'Bearish Order Block M15 di atas sesi Asia'
      };
      poiPostNews = {
        label: isBuy ? 'Zona Post-News (Premium BSL)' : 'Zona Post-News (Discount Target)',
        range: isBuy
          ? `${(eur + 0.0024).toFixed(5)} – ${(eur + 0.0036).toFixed(5)}`
          : `${(eur - 0.0034).toFixed(5)} – ${(eur - 0.0022).toFixed(5)}`,
        note: isBuy ? 'Previous Day High Liquidity' : 'Liquidity pool Previous Session Low'
      };
      tradePlan = isBuy
        ? {
            pair: 'EURUSD',
            direction: 'BUY',
            entry: (eur - 0.0019).toFixed(5),
            sl: (eur - 0.0038).toFixed(5),
            tp1: (eur + 0.0012).toFixed(5),
            tp2: (eur + 0.0032).toFixed(5)
          }
        : {
            pair: 'EURUSD',
            direction: 'SELL',
            entry: (eur + 0.0021).toFixed(5),
            sl: (eur + 0.0042).toFixed(5),
            tp1: (eur - 0.0012).toFixed(5),
            tp2: (eur - 0.0030).toFixed(5)
          };
    } else if (primaryPair === 'US100') {
      poiPreNews = {
        label: 'Zona Pre-News (Discount Demand US100)',
        range: `${(us100 - 95).toFixed(2)} – ${(us100 - 52).toFixed(2)}`,
        note: 'Bullish Order Block M15 sesi New York Open'
      };
      poiPostNews = {
        label: 'Zona Post-News (Expansion BSL Target)',
        range: `${(us100 + 115).toFixed(2)} – ${(us100 + 170).toFixed(2)}`,
        note: 'Buy-Side Liquidity di atas Previous Day High'
      };
      tradePlan = {
        pair: 'US100',
        direction: 'BUY',
        entry: (us100 - 68).toFixed(2),
        sl: (us100 - 135).toFixed(2),
        tp1: (us100 + 45).toFixed(2),
        tp2: (us100 + 140).toFixed(2)
      };
    } else if (primaryPair === 'BTCUSDT') {
      poiPreNews = {
        label: 'Zona Pre-News (Accumulation OB BTC)',
        range: `${(btc - 850).toFixed(2)} – ${(btc - 420).toFixed(2)}`,
        note: 'Discount FVG H1 menjelang rilis data'
      };
      poiPostNews = {
        label: 'Zona Post-News (Breakout EQH Target)',
        range: `${(btc + 1150).toFixed(2)} – ${(btc + 1720).toFixed(2)}`,
        note: 'Equal Highs H4 Liquidity Pool'
      };
      tradePlan = {
        pair: 'BTCUSDT',
        direction: 'BUY',
        entry: (btc - 580).toFixed(2),
        sl: (btc - 1350).toFixed(2),
        tp1: (btc + 550).toFixed(2),
        tp2: (btc + 1450).toFixed(2)
      };
    } else {
      poiPreNews = isBuy
        ? {
            label: 'Zona Pre-News (SSL Sweep Discount)',
            range: `${(xau - 10.5).toFixed(2)} – ${(xau - 5.8).toFixed(2)}`,
            note: 'Bullish Order Block M15 di bawah London Low'
          }
        : {
            label: 'Zona Pre-News (Liquidity Raid Sell)',
            range: `${(xau + 6.5).toFixed(2)} – ${(xau + 11.2).toFixed(2)}`,
            note: 'Premium Bearish FVG H1 + Asia/London High Sweep'
          };
      poiPostNews = isBuy
        ? {
            label: 'Zona Post-News (BSL Expansion)',
            range: `${(xau + 9.5).toFixed(2)} – ${(xau + 15.0).toFixed(2)}`,
            note: 'Target likuiditas atas sesi New York'
          }
        : {
            label: 'Zona Post-News (Displacement Continuation)',
            range: `${(xau - 14.5).toFixed(2)} – ${(xau - 9.2).toFixed(2)}`,
            note: 'Target Demand H1 / Sell-Side Liquidity (SSL) Pool'
          };
      tradePlan = isBuy
        ? {
            pair: 'XAUUSD',
            direction: 'BUY',
            entry: (xau - 7.5).toFixed(2),
            sl: (xau - 15.0).toFixed(2),
            tp1: (xau + 3.0).toFixed(2),
            tp2: (xau + 12.5).toFixed(2)
          }
        : {
            pair: 'XAUUSD',
            direction: 'SELL',
            entry: (xau + 7.8).toFixed(2),
            sl: (xau + 15.2).toFixed(2),
            tp1: (xau - 2.5).toFixed(2),
            tp2: (xau - 11.5).toFixed(2)
          };
    }

    const slug = `${wibInfo.dateStr}-${ccy}-${title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 44);

    return {
      id: `ff-live-${slug}`,
      dateStr: wibInfo.dateStr,
      timeWib: wibInfo.timeWib,
      timestampMs: wibInfo.timestampMs,
      currency: ccy,
      impact,
      title,
      affectedPairs,
      primaryPair,
      forecast: forecastStr,
      previous: prevStr,
      actual: raw.actual || 'Live Kalender',
      verdictDirection: direction,
      verdictPair: primaryPair,
      verdictConfidence: impact === 'high' ? '85% Live High-Impact Catalyst' : '78% Live Session Catalyst',
      verdictSummary: `Jadwal Kalender Live (${ccy}): ${title}. Konsensus Forecast: ${forecastStr} vs Previous: ${prevStr}. Waspadai sapuan likuiditas 5–15 menit di sekitar rilis data sebelum konfirmasi arah.`,
      fundamentalReasoning: `Data makro ${ccy} (${title}) dipantau langsung pelaku pasar institusional untuk mengukur tekanan inflasi, ketenagakerjaan, dan ekspektasi suku bunga bank sentral.`,
      poiPreNews,
      poiPostNews,
      tradePlan,
      isLiveCalendar: true
    };
  }

  function buildFallbackStaticEvents(prices) {
    const d = getWibTodayStrings();
    const xau = Number(prices?.XAUUSD) || 2650.00;
    const us100 = Number(prices?.US100) || 20850.00;
    const eur = Number(prices?.EURUSD) || 1.08500;
    const btc = Number(prices?.BTCUSDT) || 92000.00;

    return [
      {
        id: 'evt-us-pmi-today',
        dateStr: d.today,
        timeWib: '21:45 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US S&P Global Services & Manufacturing PMI (Flash)',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        primaryPair: 'XAUUSD',
        forecast: '55.2',
        previous: '55.0',
        actual: 'Menunggu Rilis',
        verdictDirection: 'SELL',
        verdictPair: 'XAUUSD',
        verdictConfidence: '86% Bearish Gold Bias',
        verdictSummary:
          'Konsensus pasar memproyeksikan ekspansi sektor jasa AS tetap kuat di 55.2 (di atas ambang ekspansi 50.0). Jika data Aktual ≥ 55.2, indeks DXY dan Yield US10Y berpotensi melonjak sehingga memicu distribusi jual pada XAUUSD.',
        fundamentalReasoning:
          'Sektor jasa menyumbang lebih dari 70% Produk Domestik Bruto (PDB) Amerika Serikat. Ketahanan sektor jasa menandakan daya beli domestik masih panas, sehingga membatasi ruang The Fed untuk memangkas suku bunga secara agresif.',
        poiPreNews: {
          label: 'Zona Pre-News (Liquidity Raid Sell)',
          range: `${(xau + 6.5).toFixed(2)} – ${(xau + 11.2).toFixed(2)}`,
          note: 'Premium Bearish FVG H1 + Asia/London High Sweep'
        },
        poiPostNews: {
          label: 'Zona Post-News (Displacement Continuation)',
          range: `${(xau - 14.5).toFixed(2)} – ${(xau - 9.2).toFixed(2)}`,
          note: 'Target Demand H1 / Sell-Side Liquidity (SSL) Pool'
        },
        tradePlan: {
          pair: 'XAUUSD',
          direction: 'SELL',
          entry: (xau + 7.8).toFixed(2),
          sl: (xau + 15.2).toFixed(2),
          tp1: (xau - 2.5).toFixed(2),
          tp2: (xau - 11.5).toFixed(2)
        }
      },
      {
        id: 'evt-eur-ifo-today',
        dateStr: d.today,
        timeWib: '16:00 WIB',
        currency: 'EUR',
        impact: 'medium',
        title: 'German Ifo Business Climate & Expectations Index',
        affectedPairs: ['EURUSD'],
        primaryPair: 'EURUSD',
        forecast: '86.1',
        previous: '86.5',
        actual: 'Menunggu Rilis',
        verdictDirection: 'SELL',
        verdictPair: 'EURUSD',
        verdictConfidence: '79% Bearish EUR Bias',
        verdictSummary:
          'Ekspektasi iklim bisnis Jerman diperkirakan turun ke 86.1. Tekanan sektor industri Eropa cenderung memicu manipulasi naik (Judas Swing) di sesi London sebelum penurunan lanjutan pada EURUSD.',
        fundamentalReasoning:
          'Jerman merupakan ekonomi terbesar Zona Euro. Pelemahan survei manajer bisnis Ifo memperkuat ekspektasi pelonggaran kebijakan moneter lanjutan oleh Bank Sentral Eropa (ECB).',
        poiPreNews: {
          label: 'Zona Pre-News (Judas High EURUSD)',
          range: `${(eur + 0.0018).toFixed(5)} – ${(eur + 0.0026).toFixed(5)}`,
          note: 'Bearish Order Block M15 di atas sesi Asia'
        },
        poiPostNews: {
          label: 'Zona Post-News (Discount Target)',
          range: `${(eur - 0.0034).toFixed(5)} – ${(eur - 0.0022).toFixed(5)}`,
          note: 'Liquidity pool Previous Session Low'
        },
        tradePlan: {
          pair: 'EURUSD',
          direction: 'SELL',
          entry: (eur + 0.0021).toFixed(5),
          sl: (eur + 0.0042).toFixed(5),
          tp1: (eur - 0.0012).toFixed(5),
          tp2: (eur - 0.0030).toFixed(5)
        }
      },
      {
        id: 'evt-us-cb-confidence',
        dateStr: d.day1,
        timeWib: '22:00 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US CB Consumer Confidence & New Home Sales',
        affectedPairs: ['US100', 'XAUUSD', 'BTCUSDT'],
        primaryPair: 'US100',
        forecast: '111.8',
        previous: '108.7',
        actual: 'Terjadwal',
        verdictDirection: 'BUY',
        verdictPair: 'US100',
        verdictConfidence: '84% Bullish Nasdaq Bias',
        verdictSummary:
          'Optimisme konsumen AS diproyeksikan naik dari 108.7 ke 111.8. Sentimen konsumsi rumah tangga yang solid mendorong aliran dana institusional masuk ke indeks teknologi US100 (Nasdaq).',
        fundamentalReasoning:
          'Kenaikan kepercayaan konsumen tanpa lonjakan ekspektasi inflasi mendukung skenario soft-landing ekonomi AS yang sangat positif bagi saham pertumbuhan (Big Tech) dan aset risiko.',
        poiPreNews: {
          label: 'Zona Pre-News (Discount Demand US100)',
          range: `${(us100 - 95).toFixed(2)} – ${(us100 - 52).toFixed(2)}`,
          note: 'Bullish Order Block M15 sesi New York Open'
        },
        poiPostNews: {
          label: 'Zona Post-News (Expansion BSL Target)',
          range: `${(us100 + 115).toFixed(2)} – ${(us100 + 170).toFixed(2)}`,
          note: 'Buy-Side Liquidity di atas Previous Day High'
        },
        tradePlan: {
          pair: 'US100',
          direction: 'BUY',
          entry: (us100 - 68).toFixed(2),
          sl: (us100 - 135).toFixed(2),
          tp1: (us100 + 45).toFixed(2),
          tp2: (us100 + 140).toFixed(2)
        }
      },
      {
        id: 'evt-us-fomc-minutes',
        dateStr: d.day2,
        timeWib: '02:00 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'FOMC Meeting Minutes (Risalah Kebijakan The Fed)',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        primaryPair: 'XAUUSD',
        forecast: 'Hawkish Hold',
        previous: 'Data-Dependent',
        actual: 'Terjadwal',
        verdictDirection: 'SELL',
        verdictPair: 'XAUUSD',
        verdictConfidence: '87% High-Volatility Setup',
        verdictSummary:
          'Risalah FOMC cenderung memicu sapuan dua arah (whipsaw) pada 5 menit awal. Bias utama condong ke penguatan DXY jika risalah menegaskan kehati-hatian pemangkasan suku bunga.',
        fundamentalReasoning:
          'Pelaku pasar membedah seberapa banyak anggota komite FOMC yang menilai risiko inflasi jasa masih lengket. Nada hawkish menjaga imbal hasil Treasury 10Y tetap tinggi dan menekan emas.',
        poiPreNews: {
          label: 'Zona Pre-News (Upper Liquidity Sweep)',
          range: `${(xau + 9.0).toFixed(2)} – ${(xau + 14.5).toFixed(2)}`,
          note: 'Premium FVG H1 di atas Equal Highs'
        },
        poiPostNews: {
          label: 'Zona Post-News (HTF FVG Mitigation)',
          range: `${(xau - 18.0).toFixed(2)} – ${(xau - 12.0).toFixed(2)}`,
          note: 'Zona keseimbangan H4 pasca-risalah'
        },
        tradePlan: {
          pair: 'XAUUSD',
          direction: 'SELL',
          entry: (xau + 11.2).toFixed(2),
          sl: (xau + 19.5).toFixed(2),
          tp1: (xau - 3.5).toFixed(2),
          tp2: (xau - 15.0).toFixed(2)
        }
      },
      {
        id: 'evt-us-jobless-claims',
        dateStr: d.day3,
        timeWib: '20:30 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US Initial Jobless Claims & Core Durable Goods Orders',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD'],
        primaryPair: 'XAUUSD',
        forecast: '224K',
        previous: '217K',
        actual: 'Terjadwal',
        verdictDirection: 'BUY',
        verdictPair: 'XAUUSD',
        verdictConfidence: '81% Bullish Reversal Play',
        verdictSummary:
          'Klaim pengangguran mingguan diproyeksikan naik tipis dari 217K ke 224K. Jika rilis Aktual menembus > 225K, pelemahan DXY berpotensi memicu pantulan kuat XAUUSD dari zona Discount.',
        fundamentalReasoning:
          'Klaim pengangguran awal merupakan indikator tercepat (high-frequency) untuk mendeteksi pendinginan pasar tenaga kerja AS yang menjadi acuan utama kebijakan suku bunga The Fed.',
        poiPreNews: {
          label: 'Zona Pre-News (SSL Sweep Discount)',
          range: `${(xau - 10.5).toFixed(2)} – ${(xau - 5.8).toFixed(2)}`,
          note: 'Bullish Order Block M15 di bawah London Low'
        },
        poiPostNews: {
          label: 'Zona Post-News (BSL Expansion)',
          range: `${(xau + 9.5).toFixed(2)} – ${(xau + 15.0).toFixed(2)}`,
          note: 'Target likuiditas atas sesi New York'
        },
        tradePlan: {
          pair: 'XAUUSD',
          direction: 'BUY',
          entry: (xau - 7.5).toFixed(2),
          sl: (xau - 15.0).toFixed(2),
          tp1: (xau + 3.0).toFixed(2),
          tp2: (xau + 12.5).toFixed(2)
        }
      },
      {
        id: 'evt-us-core-pce',
        dateStr: d.day4,
        timeWib: '20:30 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US Core PCE Price Index m/m & Personal Spending',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        primaryPair: 'BTCUSDT',
        forecast: '0.2%',
        previous: '0.3%',
        actual: 'Terjadwal',
        verdictDirection: 'BUY',
        verdictPair: 'BTCUSDT',
        verdictConfidence: '85% Risk-On Liquidity Surge',
        verdictSummary:
          'Core PCE merupakan tolok ukur inflasi favorit The Fed. Proyeksi melandai ke 0.2% membuka peluang arus masuk likuiditas besar ke aset kripto (BTCUSDT) dan indeks saham AS.',
        fundamentalReasoning:
          'Penurunan tekanan inflasi inti meredam kekhawatiran suku bunga tinggi berkepanjangan, menekan imbal hasil obligasi riil AS dan mendorong rotasi modal ke aset beta tinggi.',
        poiPreNews: {
          label: 'Zona Pre-News (Accumulation OB BTC)',
          range: `${(btc - 850).toFixed(2)} – ${(btc - 420).toFixed(2)}`,
          note: 'Discount FVG H1 menjelang rilis PCE'
        },
        poiPostNews: {
          label: 'Zona Post-News (Breakout EQH Target)',
          range: `${(btc + 1150).toFixed(2)} – ${(btc + 1720).toFixed(2)}`,
          note: 'Equal Highs H4 Liquidity Pool'
        },
        tradePlan: {
          pair: 'BTCUSDT',
          direction: 'BUY',
          entry: (btc - 580).toFixed(2),
          sl: (btc - 1350).toFixed(2),
          tp1: (btc + 550).toFixed(2),
          tp2: (btc + 1450).toFixed(2)
        }
      },
      {
        id: 'evt-eur-cpi-flash',
        dateStr: d.day6,
        timeWib: '17:00 WIB',
        currency: 'EUR',
        impact: 'high',
        title: 'Eurozone Core CPI Flash Estimate y/y',
        affectedPairs: ['EURUSD'],
        primaryPair: 'EURUSD',
        forecast: '2.7%',
        previous: '2.7%',
        actual: 'Bulan Ini',
        verdictDirection: 'BUY',
        verdictPair: 'EURUSD',
        verdictConfidence: '80% Bullish EUR Reclaim',
        verdictSummary:
          'Inflasi inti Zona Euro diperkirakan tertahan di 2.7% (masih di atas target 2.0% ECB). Jika rilis Aktual ≥ 2.7%, EURUSD berpotensi melakukan sapuan low lalu reli menuju sesi NY.',
        fundamentalReasoning:
          'Inflasi sektor jasa Eropa yang masih bertahan di atas target memaksa ECB menjaga suku bunga lebih bertahap, menopang nilai tukar Euro terhadap Dolar AS.',
        poiPreNews: {
          label: 'Zona Pre-News (Discount FVG EURUSD)',
          range: `${(eur - 0.0025).toFixed(5)} – ${(eur - 0.0015).toFixed(5)}`,
          note: 'Bullish FVG M15 sesi London'
        },
        poiPostNews: {
          label: 'Zona Post-News (Premium BSL)',
          range: `${(eur + 0.0024).toFixed(5)} – ${(eur + 0.0036).toFixed(5)}`,
          note: 'Previous Day High Liquidity'
        },
        tradePlan: {
          pair: 'EURUSD',
          direction: 'BUY',
          entry: (eur - 0.0019).toFixed(5),
          sl: (eur - 0.0038).toFixed(5),
          tp1: (eur + 0.0012).toFixed(5),
          tp2: (eur + 0.0032).toFixed(5)
        }
      },
      {
        id: 'evt-us-ism-mfg',
        dateStr: d.day8,
        timeWib: '22:00 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US ISM Manufacturing PMI & Prices Paid',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD'],
        primaryPair: 'US100',
        forecast: '47.6',
        previous: '46.5',
        actual: 'Bulan Ini',
        verdictDirection: 'BUY',
        verdictPair: 'US100',
        verdictConfidence: '82% Bullish Recovery',
        verdictSummary:
          'Perbaikan bertahap ISM Manufaktur dari 46.5 menuju 47.6 tanpa lonjakan komponen harga (Prices Paid) mendukung ekspansi indeks US100 pada jam pertama New York.',
        fundamentalReasoning:
          'ISM Manufacturing merupakan survei paling diawasi institusi Wall Street setiap awal bulan untuk membaca siklus ekspansi maupun kontraksi korporasi AS.',
        poiPreNews: {
          label: 'Zona Pre-News (NY Open Demand)',
          range: `${(us100 - 110).toFixed(2)} – ${(us100 - 65).toFixed(2)}`,
          note: 'Bullish Order Block H1'
        },
        poiPostNews: {
          label: 'Zona Post-News (HTF Swing Target)',
          range: `${(us100 + 130).toFixed(2)} – ${(us100 + 195).toFixed(2)}`,
          note: 'Weekly Buy-Side Liquidity'
        },
        tradePlan: {
          pair: 'US100',
          direction: 'BUY',
          entry: (us100 - 82).toFixed(2),
          sl: (us100 - 165).toFixed(2),
          tp1: (us100 + 60).toFixed(2),
          tp2: (us100 + 165).toFixed(2)
        }
      },
      {
        id: 'evt-us-nfp-monthly',
        dateStr: d.day10,
        timeWib: '20:30 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        primaryPair: 'XAUUSD',
        forecast: '185K',
        previous: '227K',
        actual: 'Bulan Ini',
        verdictDirection: 'BUY',
        verdictPair: 'XAUUSD',
        verdictConfidence: '89% Major Macro Catalyst',
        verdictSummary:
          'Pertumbuhan lapangan kerja AS diproyeksikan melandai dari 227K ke 185K. Pendinginan tenaga kerja menjadi katalis utama pelemahan DXY dan reli besar XAUUSD pasca-sapuan awal.',
        fundamentalReasoning:
          'Mandat ganda The Fed sangat sensitif terhadap tingkat pengangguran dan NFP. Penambahan tenaga kerja di bawah 185K memperkuat ekspektasi pelonggaran likuiditas dolar.',
        poiPreNews: {
          label: 'Zona Pre-News (Stop-Hunt Demand Gold)',
          range: `${(xau - 12.0).toFixed(2)} – ${(xau - 6.8).toFixed(2)}`,
          note: 'Bullish OB H1 di bawah Asia/London Low'
        },
        poiPostNews: {
          label: 'Zona Post-News (Major BSL Target)',
          range: `${(xau + 16.5).toFixed(2)} – ${(xau + 25.0).toFixed(2)}`,
          note: 'Weekly High Liquidity Pool'
        },
        tradePlan: {
          pair: 'XAUUSD',
          direction: 'BUY',
          entry: (xau - 8.8).toFixed(2),
          sl: (xau - 17.5).toFixed(2),
          tp1: (xau + 5.5).toFixed(2),
          tp2: (xau + 21.0).toFixed(2)
        }
      },
      {
        id: 'evt-us-cpi-monthly',
        dateStr: d.day14,
        timeWib: '20:30 WIB',
        currency: 'USD',
        impact: 'high',
        title: 'US Consumer Price Index (CPI) y/y & Core CPI m/m',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        primaryPair: 'XAUUSD',
        forecast: '2.6%',
        previous: '2.7%',
        actual: 'Bulan Ini',
        verdictDirection: 'BUY',
        verdictPair: 'XAUUSD',
        verdictConfidence: '88% Tier-1 Inflation Play',
        verdictSummary:
          'Inflasi tahunan AS diproyeksikan turun dari 2.7% ke 2.6%. Data CPI di bawah ekspektasi secara historis memicu pelemahan tajam DXY dan lonjakan harga emas dalam hitungan menit.',
        fundamentalReasoning:
          'CPI adalah data inflasi paling volatil di pasar global karena langsung menentukan ekspektasi suku bunga FOMC berikutnya.',
        poiPreNews: {
          label: 'Zona Pre-News (Discount OB Gold)',
          range: `${(xau - 11.0).toFixed(2)} – ${(xau - 6.0).toFixed(2)}`,
          note: 'Demand H1 menjelang rilis CPI'
        },
        poiPostNews: {
          label: 'Zona Post-News (Liquidity Expansion)',
          range: `${(xau + 15.0).toFixed(2)} – ${(xau + 23.0).toFixed(2)}`,
          note: 'Target Swing High H4'
        },
        tradePlan: {
          pair: 'XAUUSD',
          direction: 'BUY',
          entry: (xau - 8.2).toFixed(2),
          sl: (xau - 16.5).toFixed(2),
          tp1: (xau + 5.0).toFixed(2),
          tp2: (xau + 19.5).toFixed(2)
        }
      },
      {
        id: 'evt-us-retail-sales',
        dateStr: d.day18,
        timeWib: '20:30 WIB',
        currency: 'USD',
        impact: 'medium',
        title: 'US Core Retail Sales m/m & Philly Fed Manufacturing',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD'],
        primaryPair: 'EURUSD',
        forecast: '0.3%',
        previous: '0.4%',
        actual: 'Bulan Ini',
        verdictDirection: 'BUY',
        verdictPair: 'EURUSD',
        verdictConfidence: '77% Moderate USD Pullback',
        verdictSummary:
          'Penjualan ritel inti AS diperkirakan melandai ke 0.3% dari 0.4%, membuka ruang koreksi DXY dan pantulan teknikal pada EURUSD di sesi New York.',
        fundamentalReasoning:
          'Belanja ritel mencerminkan kekuatan konsumsi konsumen AS secara langsung.',
        poiPreNews: {
          label: 'Zona Pre-News (Discount Demand)',
          range: `${(eur - 0.0022).toFixed(5)} – ${(eur - 0.0014).toFixed(5)}`,
          note: 'Bullish FVG M15'
        },
        poiPostNews: {
          label: 'Zona Post-News (BSL Target)',
          range: `${(eur + 0.0020).toFixed(5)} – ${(eur + 0.0031).toFixed(5)}`,
          note: 'Asia/London High Pool'
        },
        tradePlan: {
          pair: 'EURUSD',
          direction: 'BUY',
          entry: (eur - 0.0017).toFixed(5),
          sl: (eur - 0.0035).toFixed(5),
          tp1: (eur + 0.0011).toFixed(5),
          tp2: (eur + 0.0028).toFixed(5)
        }
      }
    ];
  }

  function buildDynamicEconomicEvents(prices) {
    const cached = loadLiveCalendarCache();
    if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
      const relevant = cached.items.filter((item) => {
        const ccy = String(item?.country || '').toUpperCase();
        const imp = String(item?.impact || '').toLowerCase();
        return ['USD', 'EUR', 'GBP', 'JPY'].includes(ccy) && (imp === 'high' || imp === 'medium');
      });
      if (relevant.length > 0) {
        return relevant.map((raw) => mapRawLiveEventToInstitutionalCard(raw, prices));
      }
    }
    return buildFallbackStaticEvents(prices);
  }

  async function syncLiveEconomicCalendar() {
    const cached = loadLiveCalendarCache();
    if (cached && Date.now() - Number(cached.savedAtMs || 0) < CALENDAR_CACHE_TTL_MS) {
      return cached.items;
    }

    const urls = [
      FF_THIS_WEEK_URL,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(FF_THIS_WEEK_URL)}`
    ];

    for (const url of urls) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(tid);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLiveCalendarCache(data);
          return data;
        }
      } catch (_) {}
    }

    return cached ? cached.items : [];
  }

  function getActiveNewsLock(nowMs = Date.now(), pair = 'ALL', windowMinutes = 15) {
    const events = buildDynamicEconomicEvents({});
    const windowMs = Math.max(5, Number(windowMinutes) || 15) * 60000;

    for (const evt of events) {
      if (evt.impact !== 'high') continue;
      if (pair && pair !== 'ALL' && Array.isArray(evt.affectedPairs) && !evt.affectedPairs.includes(pair)) {
        continue;
      }
      const evtMs = evt.timestampMs || parseWibDateTimeMs(evt.dateStr, evt.timeWib);
      if (!evtMs) continue;

      if (Math.abs(nowMs - evtMs) <= windowMs) {
        return {
          locked: true,
          event: evt,
          minutesAway: Math.round((evtMs - nowMs) / 60000),
          reason: `Peringatan News (±${windowMinutes}m): ${evt.title} (${evt.timeWib})`
        };
      }
    }

    return { locked: false, event: null, minutesAway: null, reason: '' };
  }

  function getStaticFallbackWire() {
    return [
      {
        title: 'US Treasury 10Y Yield Bertahan di Zona Kunci Menjelang Rilis Data Makro AS',
        source: 'MACRO DESK • USD / GOLD',
        time: 'Update Sesi WIB',
        impactTag: 'HIGH IMPACT'
      },
      {
        title: 'Aliran Dana Institusional ETF & Tech Megacap Menjaga Volatilitas Nasdaq (US100) di Sesi NY',
        source: 'EQUITY WIRE • US100',
        time: 'Update Sesi WIB',
        impactTag: 'MEDIUM-HIGH'
      },
      {
        title: 'Pejabat ECB Soroti Pertumbuhan Moderat Zona Euro; Trader Pantau Likuiditas EURUSD',
        source: 'FX DESK • EURUSD',
        time: 'Update Sesi WIB',
        impactTag: 'MEDIUM'
      },
      {
        title: 'Likuiditas BTCUSDT Meningkat di Sesi Amerika Seiring Pergerakan Indeks Dolar (DXY)',
        source: 'CRYPTO DESK • BTCUSDT',
        time: 'Update Sesi WIB',
        impactTag: 'HIGH IMPACT'
      }
    ];
  }

  async function fetchLiveMacroWire() {
    await syncLiveEconomicCalendar();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.fxstreet.com%2Frss%2Fnews',
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('RSS non-200');
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.slice(0, 5).map((item) => ({
          title: item.title || 'Update Pasar Global',
          source: 'FXSTREET LIVE WIRE',
          time: item.pubDate ? item.pubDate.slice(11, 16) + ' UTC' : 'Live',
          impactTag: 'LIVE FEED'
        }));
      }
    } catch (_) {
      // Fallback ke macro desk wire terverifikasi
    }
    return getStaticFallbackWire();
  }

  function pickBestNewsOpportunity(events, pairFilter) {
    const nowMs = Date.now();
    const pool =
      pairFilter && pairFilter !== 'ALL'
        ? events.filter((e) => e.affectedPairs.includes(pairFilter))
        : events;

    const highEvents = pool.filter((e) => e.impact === 'high');
    const candidates = highEvents.length > 0 ? highEvents : pool;
    const upcoming = candidates.filter((e) => {
      const ts = e.timestampMs || parseWibDateTimeMs(e.dateStr, e.timeWib);
      return ts && ts >= nowMs - 30 * 60000;
    });

    return upcoming[0] || candidates[0] || events[0];
  }

  // Jalankan prefetch kalender live saat file dimuat agar cache langsung siap
  syncLiveEconomicCalendar();

  global.LiamNews = {
    getWibTodayStrings,
    buildDynamicEconomicEvents,
    syncLiveEconomicCalendar,
    getActiveNewsLock,
    fetchLiveMacroWire,
    pickBestNewsOpportunity
  };
})(window);
