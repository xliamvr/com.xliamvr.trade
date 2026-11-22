/*!
 * Liamvtrade — Pre/Post-News Verdict Engine, News Shield & Macro Wire (v2.5)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

// 1. Detektor Indikator Terbalik (Actual Lebih Rendah = USD Menguat)
function isInverseUsdIndicator(title) {
  const t = String(title || '').toLowerCase();
  return (
    t.includes('unemployment') ||
    t.includes('jobless') ||
    t.includes('claims')
  );
}

// 2. Parser Angka Makroekonomi (Mendukung %, K, M, B)
function parseMacroNumeric(valStr) {
  if (valStr === null || valStr === undefined) return null;
  const cleaned = String(valStr).trim();
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'menunggu') return null;

  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  let num = parseFloat(match[0]);

  if (/k$/i.test(cleaned)) num *= 1000;
  else if (/m$/i.test(cleaned)) num *= 1000000;
  else if (/b$/i.test(cleaned)) num *= 1000000000;

  return Number.isNaN(num) ? null : num;
}

// 3. Mesin Analisis Sebelum Rilis (Pre-News) & Sesudah Rilis (Post-News Verdict)
function buildNewsPreAndPostAnalysis(item) {
  const inverse = typeof item.isInverseUsd === 'boolean'
    ? item.isInverseUsd
    : isInverseUsdIndicator(item.title);

  const actualNum = parseMacroNumeric(item.actual);
  const forecastNum = parseMacroNumeric(item.forecast);
  const prevNum = parseMacroNumeric(item.previous);

  // A. Analisis Sebelum Rilis (Pre-News Playbook)
  let expectationText = 'Konsensus pasar menunggu konfirmasi data tanpa bias ekstrem.';
  if (forecastNum !== null && prevNum !== null && forecastNum !== prevNum) {
    const forecastHigher = forecastNum > prevNum;
    const usdBullishExpectation = inverse ? !forecastHigher : forecastHigher;
    expectationText = usdBullishExpectation
      ? `Pasar memprediksi data lebih solid bagi USD (Forecast ${item.forecast} vs Prev ${item.previous}) — waspadai tekanan awal pada XAUUSD & EURUSD.`
      : `Pasar memprediksi perlambatan data USD (Forecast ${item.forecast} vs Prev ${item.previous}) — berpotensi menopang kenaikan XAUUSD & US100.`;
  }

  const hotCondition = inverse
    ? `Actual < ${item.forecast || 'Forecast'}`
    : `Actual > ${item.forecast || 'Forecast'}`;
  const coolCondition = inverse
    ? `Actual > ${item.forecast || 'Forecast'}`
    : `Actual < ${item.forecast || 'Forecast'}`;

  const prePlaybook = {
    expectationText,
    scenarioSellRiskAssets: `Jika ${hotCondition} (Data Panas / USD Menguat) → Skenario SELL pada XAUUSD, EURUSD, US100 & BTCUSDT.`,
    scenarioBuyRiskAssets: `Jika ${coolCondition} (Data Dingin / USD Melemah) → Skenario BUY pada XAUUSD, EURUSD, US100 & BTCUSDT.`,
    safetyRule: 'Batalkan pending order 15 menit sebelum rilis; tunggu candle M5 pertama selesai menyapu likuiditas.'
  };

  // B. Analisis Sesudah Rilis (Post-News Verdict) jika Actual sudah keluar
  if (actualNum !== null && forecastNum !== null) {
    const diff = actualNum - forecastNum;
    if (Math.abs(diff) < 1e-9) {
      return {
        phase: 'POST_NEWS',
        prePlaybook,
        postVerdict: {
          verdictBadge: 'NETRAL / IN-LINE',
          directionCall: 'WAIT RETRACEMENT (STRUKTUR TEKNIKAL)',
          biasColor: 'amber',
          deviationText: `Actual (${item.actual}) tepat sesuai Forecast (${item.forecast}). Tidak ada kejutan fundamental.`,
          executionAdvice: 'Ikuti arah struktur ICT/SMC utama dan tunggu retest FVG M5 setelah spread normal.'
        }
      };
    }

    const rawBeat = actualNum > forecastNum;
    const usdStrengthens = inverse ? !rawBeat : rawBeat;

    if (usdStrengthens) {
      return {
        phase: 'POST_NEWS',
        prePlaybook,
        postVerdict: {
          verdictBadge: 'USD BULLISH • DATA PANAS',
          directionCall: 'PRIORITAS SELL (XAUUSD / EURUSD / US100)',
          biasColor: 'rose',
          deviationText: `Actual (${item.actual}) menguatkan Dolar AS dibanding Forecast (${item.forecast}). Imbal hasil obligasi AS terdorong naik.`,
          executionAdvice: 'Tunggu pullback ke Bearish FVG / Premium OB M5 (10–15 menit pasca-rilis) sebelum eksekusi SELL.'
        }
      };
    } else {
      return {
        phase: 'POST_NEWS',
        prePlaybook,
        postVerdict: {
          verdictBadge: 'USD BEARISH • DATA DINGIN',
          directionCall: 'PRIORITAS BUY (XAUUSD / EURUSD / US100 / BTC)',
          biasColor: 'emerald',
          deviationText: `Actual (${item.actual}) melemahkan Dolar AS dibanding Forecast (${item.forecast}). Ekspektasi pelonggaran The Fed meningkat.`,
          executionAdvice: 'Tunggu koreksi turun menyapu low M5 lalu masuk pada Bullish FVG / Discount OB.'
        }
      };
    }
  }

  return {
    phase: 'PRE_NEWS',
    prePlaybook,
    postVerdict: null
  };
}

// 4. Detektor News Shield (±30 Menit dari Berita Merah USD)
function evaluateNewsShield(newsList) {
  if (!Array.isArray(newsList) || newsList.length === 0) {
    return { active: false };
  }

  const nowMs = Date.now();
  const windowMs = 30 * 60 * 1000; // ±30 menit

  for (const ev of newsList) {
    if (ev.impact !== 'HIGH' || !ev.timestampMs) continue;
    const diffMs = ev.timestampMs - nowMs;
    if (Math.abs(diffMs) <= windowMs) {
      const mins = Math.round(diffMs / 60000);
      const timingText =
        mins > 0
          ? `Rilis dalam ${mins} menit`
          : mins === 0
          ? 'SEDANG RILIS SEKARANG'
          : `Baru rilis ${Math.abs(mins)} menit lalu`;

      return {
        active: true,
        title: ev.title,
        minutesToEvent: mins,
        badgeText: `⚠️ NEWS SHIELD ACTIVE • ${timingText}`,
        warningText: `${ev.title} (${timingText}): Tunda pemasangan limit baru hingga volatilitas M5 mereda.`
      };
    }
  }

  return { active: false };
}

// 5. Referensi Kalender Ekonomi Utama USD (Fallback & Offline Mode)
const LIAMV_NEWS = [
  {
    id: 'usd-cpi',
    impact: 'HIGH',
    timestampMs: null,
    time: 'Rutin Bulanan • 19.30 WIB',
    currency: 'USD',
    category: 'Inflasi AS',
    isInverseUsd: false,
    title: 'US Core CPI (m/m) & Consumer Price Index (y/y)',
    actual: 'Menunggu',
    forecast: '0.3%',
    previous: '0.3%',
    smcWarning: 'Wajib tutup/amankan posisi & batalkan Pending Order 15 menit sebelum rilis.',
    explanation:
      'Barometer utama inflasi AS. Jika Actual > Forecast, The Fed cenderung menahan suku bunga tinggi → USD menguat dan menekan XAUUSD serta US100.'
  },
  {
    id: 'usd-nfp',
    impact: 'HIGH',
    timestampMs: null,
    time: 'Jumat Pertama • 19.30 WIB',
    currency: 'USD',
    category: 'Tenaga Kerja AS',
    isInverseUsd: false,
    title: 'Non-Farm Employment Change (NFP) & Unemployment Rate',
    actual: 'Menunggu',
    forecast: '185K',
    previous: '194K',
    smcWarning: 'Spread melebar ekstrem saat detik rilis. Tunggu 15–30 menit hingga struktur M5 terbentuk.',
    explanation:
      'Mengukur penambahan tenaga kerja non-pertanian AS. Angka di atas Forecast menandakan ekonomi solid dan memicu penguatan USD.'
  },
  {
    id: 'usd-fomc',
    impact: 'HIGH',
    timestampMs: null,
    time: 'Jadwal FOMC • 01.00 WIB',
    currency: 'USD',
    category: 'Kebijakan The Fed',
    isInverseUsd: false,
    title: 'FOMC Statement, Federal Funds Rate & Press Conference',
    actual: 'Menunggu',
    forecast: '4.25%',
    previous: '4.25%',
    smcWarning: 'Volatilitas dua arah (whipsaw) ekstrem. Hindari posisi terbuka saat konferensi pers Powell.',
    explanation:
      'Keputusan suku bunga acuan AS. Pernyataan dovish atau pemangkasan suku bunga menjadi katalis Bullish kuat bagi Emas, Nasdaq, dan Bitcoin.'
  },
  {
    id: 'usd-claims',
    impact: 'MED',
    timestampMs: null,
    time: 'Setiap Kamis • 19.30 WIB',
    currency: 'USD',
    category: 'Klaim Pengangguran',
    isInverseUsd: true,
    title: 'Unemployment Claims (Initial Jobless Claims)',
    actual: 'Menunggu',
    forecast: '218K',
    previous: '221K',
    smcWarning: 'Sering memicu Judas Swing menyapu Asia High/Low sebelum tren NY berjalan.',
    explanation:
      'Indikator terbalik: jika jumlah pengangguran lebih rendah dari Forecast (Actual < Forecast), pasar kerja AS dinilai ketat → USD menguat.'
  }
];

// 6. Jalur Breaking Market Wire (Katalis Non-Kalender)
const LIAMV_BREAKING_WIRE = [
  {
    id: 'wire-1',
    tag: 'LIQUIDITY REGIME',
    title: 'Fokus Likuiditas Sesi NY & Rotasi DXY',
    summary: 'Pantau korelasi terbalik DXY terhadap XAUUSD & EURUSD setiap pembukaan bursa New York pukul 20.30 WIB.'
  },
  {
    id: 'wire-2',
    tag: 'CRYPTO 24/7',
    title: 'Arus ETF & Likuidasi Futures BTCUSDT',
    summary: 'Saat akhir pekan ketika pasar Forex tutup, pergerakan BTC banyak digerakkan oleh sapuan likuiditas high/low akhir pekan.'
  }
];
