/*!
 * Liamvtrade — Pre/Post-News Verdict, OB/SnR Confluence & Breaking Wire v2.6
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const LIAMV_BREAKING_WIRE = [
  {
    id: 'wire-trump',
    tag: '🇺🇸 TRUMP & KEBIJAKAN TARIF',
    timeWib: 'Pantauan 24 Jam',
    title: 'Pidato Donald Trump, Tarif Impor & Tekanan Fiskal AS',
    summary: 'Pernyataan mendadak terkait tarif dagang atau tekanan ke The Fed memicu lonjakan volatilitas DXY. Tarif agresif biasanya mengangkat XAUUSD (Safe Haven) sekaligus menekan US100.'
  },
  {
    id: 'wire-geopolitik',
    tag: '🌍 GEOPOLITIK AS – IRAN / TIMUR TENGAH',
    timeWib: 'Alert Darurat',
    title: 'Eskalasi Militer & Ketegangan Geopolitik Global',
    summary: 'Berita serangan atau sanksi baru AS–Iran memicu arus Safe Haven: XAUUSD melonjak tajam ke atas, sedangkan US100 & BTCUSDT cenderung mengalami koreksi cepat (Risk-Off).'
  },
  {
    id: 'wire-fed',
    tag: '🏛️ THE FED & LIKUIDITAS NY',
    timeWib: '20.30 – 01.00 WIB',
    title: 'Pidato Pejabat FOMC & Rotasi DXY Pembukaan New York',
    summary: 'Komentar hawkish (menahan suku bunga tinggi) menguatkan USD dan menekan XAUUSD/EURUSD. Komentar dovish memicu reli pada Gold, Nasdaq, dan Bitcoin.'
  }
];

/**
 * Menghasilkan jadwal kalender ekonomi USD dengan hari, tanggal, dan jam WIB pasti untuk minggu berjalan
 */
function generateDatedWeeklyUsdNews() {
  const now = new Date();
  const wibNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
  const dayOfWeek = wibNow.getDay(); // 0=Minggu, 1=Senin, ...
  // Cari Senin minggu aktif (jika hari Minggu, arahkan ke Senin besok)
  const diffToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
  const mondayWib = new Date(wibNow.getFullYear(), wibNow.getMonth(), wibNow.getDate() + diffToMonday);

  const scheduleTemplates = [
    {
      dayOffset: 0, // Senin
      hour: 21,
      minute: 45,
      impact: 'MED',
      category: 'Manufaktur & Jasa AS',
      title: 'US Flash Manufacturing & Services PMI',
      forecast: '51.4',
      previous: '51.0',
      inverse: false
    },
    {
      dayOffset: 1, // Selasa
      hour: 22,
      minute: 0,
      impact: 'HIGH',
      category: 'Kepercayaan Konsumen AS',
      title: 'CB Consumer Confidence & Richmond Mfg Index',
      forecast: '103.5',
      previous: '102.8',
      inverse: false
    },
    {
      dayOffset: 2, // Rabu
      hour: 20,
      minute: 30,
      impact: 'HIGH',
      category: 'Pertumbuhan Ekonomi AS',
      title: 'US Prelim GDP (q/q) & Durable Goods Orders',
      forecast: '2.8%',
      previous: '2.8%',
      inverse: false
    },
    {
      dayOffset: 2, // Rabu malam
      hour: 22,
      minute: 0,
      impact: 'HIGH',
      category: 'Inflasi Pilihan The Fed',
      title: 'US Core PCE Price Index (m/m) & Personal Spending',
      forecast: '0.3%',
      previous: '0.3%',
      inverse: false
    },
    {
      dayOffset: 3, // Kamis
      hour: 20,
      minute: 30,
      impact: 'HIGH',
      category: 'Klaim Pengangguran AS',
      title: 'Unemployment Claims (Initial Jobless Claims)',
      forecast: '218K',
      previous: '222K',
      inverse: true
    },
    {
      dayOffset: 3, // Kamis malam
      hour: 23,
      minute: 0,
      impact: 'HIGH',
      category: 'Pidato Kebijakan Moneter',
      title: 'Fed Chair Powell / FOMC Member Speech & US Policy',
      forecast: 'Hawkish',
      previous: 'Netral',
      inverse: false
    },
    {
      dayOffset: 4, // Jumat
      hour: 20,
      minute: 30,
      impact: 'HIGH',
      category: 'Tenaga Kerja & Inflasi',
      title: 'US Non-Farm Employment / Core PPI / Chicago PMI',
      forecast: '0.2%',
      previous: '0.3%',
      inverse: false
    }
  ];

  return scheduleTemplates.map((tpl, idx) => {
    const targetWib = new Date(
      mondayWib.getFullYear(),
      mondayWib.getMonth(),
      mondayWib.getDate() + tpl.dayOffset,
      tpl.hour,
      tpl.minute,
      0
    );
    // Konversi balik dari WIB (UTC+7) ke UTC timestamp asli
    const utcMs = targetWib.getTime() - 7 * 3600000 - now.getTimezoneOffset() * 60000;

    const dateLabel = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(targetWib);

    const hh = String(tpl.hour).padStart(2, '0');
    const mm = String(tpl.minute).padStart(2, '0');

    return {
      id: `sched-usd-${idx}`,
      impact: tpl.impact,
      timestampMs: utcMs,
      time: `${dateLabel} • ${hh}.${mm} WIB`,
      currency: 'USD',
      category: tpl.category,
      title: tpl.title,
      actual: 'Menunggu',
      forecast: tpl.forecast,
      previous: tpl.previous,
      inverse: tpl.inverse
    };
  });
}

const LIAMV_NEWS = generateDatedWeeklyUsdNews();

/**
 * Mengambil berita breaking global terbaru (Trump, AS-Iran, The Fed, Makro) tanpa blokir CORS
 */
async function fetchLiveBreakingHeadlines() {
  try {
    const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      cache: 'no-store'
    });
    const json = await res.json();
    const articles = json?.Data;
    if (!Array.isArray(articles) || articles.length === 0) return LIAMV_BREAKING_WIRE;

    const keywords = [
      'trump',
      'iran',
      'war',
      'tariff',
      'fed',
      'powell',
      'inflation',
      'cpi',
      'rate',
      'gold',
      'dollar',
      'israel',
      'sanction',
      'fomc'
    ];

    const matched = articles
      .filter((a) => {
        const hay = `${a.title || ''} ${a.body || ''}`.toLowerCase();
        return keywords.some((kw) => hay.includes(kw));
      })
      .slice(0, 4);

    const chosen = matched.length > 0 ? matched : articles.slice(0, 3);

    return chosen.map((a, idx) => {
      const pubDate = new Date((a.published_on || Math.floor(Date.now() / 1000)) * 1000);
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(pubDate);

      const lower = `${a.title || ''}`.toLowerCase();
      let tag = '⚡ BREAKING MACRO WIRE';
      let impactNote = 'Pantau reaksi DXY & sapuan likuiditas M15 sebelum entry.';

      if (lower.includes('iran') || lower.includes('war') || lower.includes('israel')) {
        tag = '🚨 ALERT GEOPOLITIK / SAFE HAVEN';
        impactNote = 'Eskalasi konflik cenderung mendorong XAUUSD (Gold) NAIK & menekan aset berisiko.';
      } else if (lower.includes('trump') || lower.includes('tariff')) {
        tag = '🇺🇸 BREAKING TRUMP / KEBIJAKAN AS';
        impactNote = 'Komentar Trump/tarif memicu volatilitas mendadak pada USD, Gold & Nasdaq.';
      } else if (lower.includes('fed') || lower.includes('powell') || lower.includes('rate') || lower.includes('cpi')) {
        tag = '🏛️ BREAKING THE FED / INFLASI';
        impactNote = 'Katalis langsung arah suku bunga USD — perhatikan zona OB/FVG terdekat.';
      }

      return {
        id: `live-wire-${idx}`,
        tag,
        timeWib: `${timeStr} WIB`,
        title: a.title,
        summary: impactNote
      };
    });
  } catch (e) {
    return LIAMV_BREAKING_WIRE;
  }
}

function parseNumericMetric(rawStr) {
  if (!rawStr) return null;
  const cleaned = String(rawStr).replace(/,/g, '').trim();
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  let num = parseFloat(match[0]);
  if (cleaned.toUpperCase().includes('K')) num *= 1000;
  if (cleaned.toUpperCase().includes('M')) num *= 1000000;
  if (cleaned.toUpperCase().includes('B')) num *= 1000000000;
  return num;
}

function isInverseUsdEvent(title) {
  const t = String(title || '').toLowerCase();
  return (
    t.includes('unemployment') ||
    t.includes('jobless') ||
    t.includes('claims') ||
    t.includes('pengangguran')
  );
}

/**
 * Menggabungkan Analisis Fundamental (Forecast vs Previous) + Zona Teknikal (OB / SnR)
 * untuk menentukan 1 Asumsi Terkuat (BUY / SELL) sebelum rilis maupun vonis detik rilis
 */
function buildNewsPreAndPostAnalysis(newsItem, activePair = 'XAUUSD', livePrice = 2712.5, marketRanges = {}) {
  const inverse = typeof newsItem.inverse === 'boolean' ? newsItem.inverse : isInverseUsdEvent(newsItem.title);
  const fVal = parseNumericMetric(newsItem.forecast);
  const pVal = parseNumericMetric(newsItem.previous);
  const aVal = parseNumericMetric(newsItem.actual);

  // 1. Hitung posisi harga terhadap Demand OB / Support & Supply OB / Resistance terdekat
  const rng = marketRanges?.[activePair] || { high: livePrice * 1.003, low: livePrice * 0.997 };
  const dec = activePair === 'EURUSD' ? 5 : 2;
  const span = Math.max(0.0001, rng.high - rng.low);
  const posRatio = Math.max(0, Math.min(1, (livePrice - rng.low) / span));

  const demandObLevel = rng.low.toFixed(dec);
  const supplyObLevel = rng.high.toFixed(dec);
  const nearDemandZone = posRatio <= 0.45;
  const nearSupplyZone = posRatio >= 0.55;

  // 2. Skor Fundamental Sebelum Rilis (Forecast vs Previous)
  let fundScore = 0; // Positif = Bullish Gold/BTC/EUR (USD Lemah), Negatif = Bearish (USD Kuat)
  let expectationText = 'Konsensus pasar seimbang — pergerakan awal cenderung menyapu area OB/SnR terdekat.';

  if (fVal !== null && pVal !== null && fVal !== pVal) {
    const forecastHigher = fVal > pVal;
    const usdBullishForecast = inverse ? !forecastHigher : forecastHigher;
    if (usdBullishForecast) {
      fundScore = -1;
      expectationText = `Forecast (${newsItem.forecast}) mengindikasikan USD lebih solid dibanding Previous (${newsItem.previous}).`;
    } else {
      fundScore = 1;
      expectationText = `Forecast (${newsItem.forecast}) mengindikasikan perlambatan USD dibanding Previous (${newsItem.previous}).`;
    }
  }

  // 3. Skor Teknikal (Posisi terhadap Demand OB / Support vs Supply OB / Resistance)
  const techScore = nearDemandZone ? 1 : nearSupplyZone ? -1 : 0;
  const combinedScore = fundScore + techScore;

  // 4. Tentukan 1 Asumsi Terkuat Sebelum Rilis (Konfluensi Fundamental + OB/SnR)
  let strongestSide = 'BUY';
  let strongestTitle = '';
  let strongestReason = '';

  if (combinedScore >= 1) {
    strongestSide = 'BUY';
    strongestTitle = `ASUMSI TERKUAT: BUY ${activePair} (Pantulan Demand OB / Support)`;
    strongestReason = nearDemandZone
      ? `Harga ${activePair} berada di area Discount dekat Demand OB / Support (${demandObLevel}). Waspadai wick news menyapu area ${demandObLevel} terlebih dahulu sebelum berbalik BUY.`
      : `Ekspektasi fundamental mendukung pelemahan USD; tunggu koreksi wick ke Demand OB (${demandObLevel}) untuk masuk BUY.`;
  } else if (combinedScore <= -1) {
    strongestSide = 'SELL';
    strongestTitle = `ASUMSI TERKUAT: SELL ${activePair} (Rejection Supply OB / Resistance)`;
    strongestReason = nearSupplyZone
      ? `Harga ${activePair} berada di area Premium dekat Supply OB / Resistance (${supplyObLevel}). Waspadai spike awal menyapu ${supplyObLevel} sebelum turun tajam (SELL).`
      : `Ekspektasi fundamental mendukung penguatan USD; pantau rejection di Supply OB (${supplyObLevel}) untuk masuk SELL.`;
  } else {
    // Jika fundamental dan teknikal berlawanan, ikuti struktur OB/SnR yang paling dekat dengan harga
    strongestSide = posRatio <= 0.5 ? 'BUY' : 'SELL';
    strongestTitle =
      strongestSide === 'BUY'
        ? `ASUMSI TERKUAT: BUY ${activePair} (Konfirmasi Sweep Support ${demandObLevel})`
        : `ASUMSI TERKUAT: SELL ${activePair} (Konfirmasi Sweep Resistance ${supplyObLevel})`;
    strongestReason = `Fundamental netral, sehingga algoritma market maker biasanya menyapu zona likuiditas ${
      strongestSide === 'BUY' ? `Demand OB (${demandObLevel})` : `Supply OB (${supplyObLevel})`
    } terlebih dahulu.`;
  }

  const scenarioSellRiskAssets = inverse
    ? `Jika Actual < ${newsItem.forecast} (USD Menguat) → Skenario SELL pada XAUUSD, EURUSD, US100 & BTCUSDT.`
    : `Jika Actual > ${newsItem.forecast} (Data Panas / USD Menguat) → Skenario SELL pada XAUUSD, EURUSD, US100 & BTCUSDT.`;

  const scenarioBuyRiskAssets = inverse
    ? `Jika Actual > ${newsItem.forecast} (USD Melemah) → Skenario BUY pada XAUUSD, EURUSD, US100 & BTCUSDT.`
    : `Jika Actual < ${newsItem.forecast} (Data Dingin / USD Melemah) → Skenario BUY pada XAUUSD, EURUSD, US100 & BTCUSDT.`;

  // 5. Post-News Verdict (Jika angka Actual sudah keluar atau diinput manual)
  let postVerdict = null;
  if (aVal !== null && fVal !== null && String(newsItem.actual).toLowerCase() !== 'menunggu') {
    const actualHigher = aVal > fVal;
    const isEqual = aVal === fVal;

    if (isEqual) {
      postVerdict = {
        verdictBadge: 'ACTUAL = FORECAST (NETRAL)',
        biasColor: 'amber',
        directionCall: `FOKUS ZONA OB/SnR (${strongestSide} ${activePair})`,
        deviationText: `Actual (${newsItem.actual}) sesuai ekspektasi (${newsItem.forecast}). Arah mengikuti reaksi pada Demand ${demandObLevel} / Supply ${supplyObLevel}.`,
        executionAdvice: `Tunggu wick news menyapu ${strongestSide === 'BUY' ? demandObLevel : supplyObLevel} lalu masuk searah MSS M5.`
      };
    } else {
      const usdBullish = inverse ? !actualHigher : actualHigher;
      if (usdBullish) {
        postVerdict = {
          verdictBadge: 'USD MENGUAT (HAWKISH)',
          biasColor: 'rose',
          directionCall: 'VONIS ARAH: SELL XAUUSD, EURUSD, US100 & BTC',
          deviationText: `Actual (${newsItem.actual}) vs Forecast (${newsItem.forecast}) memicu penguatan Dolar AS.`,
          executionAdvice: `Tunggu retrace ke Supply OB / Bearish FVG M5 setelah candle rilis selesai untuk entry SELL.`
        };
      } else {
        postVerdict = {
          verdictBadge: 'USD MELEMAH (DOVISH)',
          biasColor: 'emerald',
          directionCall: 'VONIS ARAH: BUY XAUUSD, EURUSD, US100 & BTC',
          deviationText: `Actual (${newsItem.actual}) vs Forecast (${newsItem.forecast}) menekan Dolar AS.`,
          executionAdvice: `Tunggu pullback ke Demand OB / Bullish FVG M5 setelah candle rilis selesai untuk entry BUY.`
        };
      }
    }
  }

  return {
    strongestSide,
    strongestTitle,
    strongestReason,
    demandObLevel,
    supplyObLevel,
    prePlaybook: {
      expectationText,
      scenarioSellRiskAssets,
      scenarioBuyRiskAssets,
      safetyRule: 'Hapus pending order 15 menit sebelum jam rilis; biarkan candle M5 pertama menyapu OB/SnR.'
    },
    postVerdict
  };
}

/**
 * Mengecek apakah ada berita High-Impact USD dalam rentang ±30 menit
 */
function evaluateNewsShield(newsList) {
  if (!Array.isArray(newsList)) return { active: false };
  const nowMs = Date.now();
  const windowMs = 30 * 60000;

  const upcomingHigh = newsList.find(
    (n) => n.impact === 'HIGH' && typeof n.timestampMs === 'number' && Math.abs(n.timestampMs - nowMs) <= windowMs
  );

  if (!upcomingHigh) return { active: false };

  const diffMins = Math.round((upcomingHigh.timestampMs - nowMs) / 60000);
  const timingText =
    diffMins > 0
      ? `${diffMins} menit lagi (${upcomingHigh.time})`
      : diffMins === 0
      ? 'SEDANG RILIS DETIK INI'
      : `${Math.abs(diffMins)} menit lalu (Volatilitas Pasca-Rilis)`;

  return {
    active: true,
    badgeText: `🛡️ NEWS SHIELD AKTIF • ${upcomingHigh.title}`,
    warningText: `Rilis High-Impact USD ${timingText}. Tahan eksekusi baru & amankan SL ke Break Even hingga candle M5 stabil.`
  };
}
