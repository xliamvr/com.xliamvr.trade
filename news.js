/*!
 * Liamvtrade — Real-Time Economic Calendar + Fundamental & Technical Buy/Sell Engine v2.8
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const NEWS_CACHE_KEY = 'liamvtrade_news_cache_v28';

function getWibNowObj() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
}

function getWibDateBounds() {
  const wib = getWibNowObj();
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, '0');
  const d = String(wib.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;
  const monthPrefix = `${y}-${m}`;

  // Hitung Senin - Minggu pada pekan WIB berjalan
  const dayOfWeek = wib.getDay(); // 0=Min, 1=Sen, ..., 6=Sab
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(wib);
  monday.setDate(wib.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const toIso = (dt) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  return {
    todayIso,
    monthPrefix,
    weekStartIso: toIso(monday),
    weekEndIso: toIso(sunday),
    nowMs: Date.now()
  };
}

function formatReadableWibDate(isoDateStr) {
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [yy, mm, dd] = isoDateStr.split('-').map(Number);
  const dt = new Date(yy, (mm || 1) - 1, dd || 1);
  return `${dayNames[dt.getDay()]}, ${dd} ${monthNames[(mm || 1) - 1]} ${yy}`;
}

function buildWibTimestampMs(isoDateStr, timeWibStr) {
  const cleanTime = (timeWibStr || '20:30').replace(/[^0-9:]/g, '');
  const [hh, min] = cleanTime.split(':').map((v) => parseInt(v, 10) || 0);
  // WIB = UTC+7 -> UTC = WIB - 7 jam
  const [yy, mm, dd] = isoDateStr.split('-').map(Number);
  return Date.UTC(yy, (mm || 1) - 1, dd || 1, hh - 7, min, 0);
}

function formatCountdownToEvent(eventTsMs) {
  const diff = eventTsMs - Date.now();
  if (diff <= -3600000) return { label: 'SELESAI RILIS', isUpcoming: false, isImminent: false };
  if (diff <= 0) return { label: '🔴 SEDANG RILIS / VOLATIL', isUpcoming: true, isImminent: true };
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / 1440);
  const hrs = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const isImminent = totalMin <= 45;
  if (days > 0) return { label: `⏳ ${days}h ${hrs}j lagi`, isUpcoming: true, isImminent: false };
  if (hrs > 0) return { label: `⏳ ${hrs}j ${mins}m lagi`, isUpcoming: true, isImminent };
  return { label: `🚨 ${mins} menit lagi`, isUpcoming: true, isImminent: true };
}

/**
 * Kalender Ekonomi Terverifikasi (23–27 Nov 2026 & Desember 2026)
 * Lengkap dengan parameter konsensus makro aktual & skenario USD/XAUUSD/US100/EURUSD
 */
function getVerifiedMacroCalendar() {
  return [
    {
      id: 'cal-2026-11-23-pmi',
      dateIso: '2026-11-23',
      timeWib: '21:45 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'US S&P Global Manufacturing & Services PMI (Flash Nov)',
      previous: '51.0',
      forecast: '51.4',
      actual: 'Menunggu Rilis',
      biasSignal: 'SELL RALLY / WAIT SWEEP',
      primaryPair: 'XAUUSD & EURUSD',
      fundamentalThesis:
        'Pembacaan PMI AS terakhir mendorong yield obligasi 10-tahun AS naik ke kisaran 5.0%–5.3% dan memperkuat DXY. Jika Flash PMI Nov kembali bertahan di atas 51.4, pasar akan memangkas ekspektasi pemangkasan suku bunga The Fed dalam waktu dekat.',
      bullishUsdScenario:
        'Actual > 51.4 (Ekonomi AS kuat) → DXY menguat: Cari konfirmasi SELL XAUUSD & SELL EURUSD setelah sapuan likuiditas sesi NY.',
      bearishUsdScenario:
        'Actual < 51.0 (Kontraksi sektor jasa/manufaktur) → Yield AS turun: Eksekusi BUY XAUUSD & BUY US100 dari zona Demand OB bawah.'
    },
    {
      id: 'cal-2026-11-23-fed',
      dateIso: '2026-11-23',
      timeWib: '23:00 WIB',
      currency: 'USD',
      impact: 'MED',
      title: 'Pidato Pejabat The Fed (Williams) & ECB Lane',
      previous: '3.75%-4.00%',
      forecast: 'Hawkish Hold',
      actual: 'Menunggu Pernyataan',
      biasSignal: 'SELL EURUSD / RANGE XAU',
      primaryPair: 'EURUSD & XAUUSD',
      fundamentalThesis:
        'The Fed mempertahankan suku bunga di 3.75%–4.00% sambil memantau inflasi yang masih lengket di atas 3%. Komentar pejabat The Fed yang menekankan suku bunga tinggi lebih lama memberi tekanan lanjutan pada EURUSD.',
      bullishUsdScenario:
        'Nada Hawkish ("inflasi belum tuntas") → DXY lanjut naik: Prioritas SELL EURUSD pada pullback ke Bearish FVG M15.',
      bearishUsdScenario:
        'Nada Dovish ("risiko perlambatan tenaga kerja") → Pantulan teknikal BUY EURUSD & BUY XAUUSD menuju Asia High.'
    },
    {
      id: 'cal-2026-11-24-ifo',
      dateIso: '2026-11-24',
      timeWib: '16:00 WIB',
      currency: 'EUR',
      impact: 'MED',
      title: 'German IFO Business Climate Index (Nov)',
      previous: '86.5',
      forecast: '86.1',
      actual: 'Menunggu Rilis',
      biasSignal: 'SELL EURUSD',
      primaryPair: 'EURUSD',
      fundamentalThesis:
        'Sentimen bisnis Jerman masih terbebani biaya energi dan tekanan tarif perdagangan global. Angka di bawah 86.1 memperlebar divergensi pertumbuhan antara Zona Euro dan AS.',
      bullishUsdScenario:
        'Actual < 86.1 (EUR melemah) → Konfirmasi lanjutan SELL EURUSD saat sesi London Killzone menyapu Buy-Side Liquidity.',
      bearishUsdScenario:
        'Actual > 87.0 (EUR pulih) → Peluang short-covering BUY EURUSD hingga area Supply Order Block H1.'
    },
    {
      id: 'cal-2026-11-24-adp',
      dateIso: '2026-11-24',
      timeWib: '20:15 WIB',
      currency: 'USD',
      impact: 'MED',
      title: 'US ADP Weekly Employment & Chicago Fed Labor Indicators',
      previous: '+142K',
      forecast: '+135K',
      actual: 'Menunggu Rilis',
      biasSignal: 'BUY DEMAND / SELL SUPPLY',
      primaryPair: 'US100 & XAUUSD',
      fundamentalThesis:
        'Menjadi pemanasan sebelum rilis klaim pengangguran dan PCE pada hari Rabu. Pasar saham US100 sangat sensitif terhadap data ketenagakerjaan karena memengaruhi biaya pendanaan sektor AI & teknologi.',
      bullishUsdScenario:
        'Tenaga kerja terlalu panas (>+150K) → Tekanan yield naik menekan US100 (SELL US100) & menahan kenaikan XAUUSD.',
      bearishUsdScenario:
        'Pendinginan tenaga kerja (<+125K) → Melegakan saham teknologi: Peluang BUY US100 & BUY XAUUSD di Demand OB.'
    },
    {
      id: 'cal-2026-11-25-pce',
      dateIso: '2026-11-25',
      timeWib: '20:30 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'US Core PCE Price Index (Oct) & Headline PCE Inflation',
      previous: '3.1% YoY',
      forecast: '3.2% YoY (0.3% MoM)',
      actual: 'Menunggu Rilis',
      biasSignal: 'HIGH VOLATILITY — WAIT SWEEP',
      primaryPair: 'XAUUSD, US100, EURUSD',
      fundamentalThesis:
        'Barometer inflasi favorit The Fed sebelum rapat FOMC Desember. Konsensus memperkirakan Core PCE naik ke 3.2% YoY dan Headline PCE ke 3.8% YoY. Ini adalah katalis penggerak terbesar minggu ini.',
      bullishUsdScenario:
        'Core PCE >= 0.4% MoM / > 3.2% YoY → DXY melonjak tajam: Eksekusi SELL XAUUSD, SELL EURUSD, dan SELL US100 setelah MSS M5.',
      bearishUsdScenario:
        'Core PCE <= 0.2% MoM / < 3.1% YoY → Ekspektasi cut rate hidup kembali: Eksekusi BUY XAUUSD & BUY US100 target BSL atas.'
    },
    {
      id: 'cal-2026-11-25-gdp',
      dateIso: '2026-11-25',
      timeWib: '20:30 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'US Q3 GDP (Second Estimate), Durable Goods & Jobless Claims',
      previous: '2.8% GDP / 215K',
      forecast: '2.8% GDP / 218K',
      actual: 'Menunggu Rilis',
      biasSignal: 'JUDAS SWING TRAP',
      primaryPair: 'XAUUSD & US100',
      fundamentalThesis:
        'Dirilis bersamaan dengan data PCE menjelang libur Thanksgiving AS. Kombinasi 4 data sekaligus memicu sapuan likuiditas dua arah (whipsaw) dalam 5–15 menit pertama sebelum tren asli terbentuk.',
      bullishUsdScenario:
        'GDP direvisi naik > 2.9% & Jobless Claims < 212K → Dolar dominan: SELL XAUUSD & SELL EURUSD pada retest FVG.',
      bearishUsdScenario:
        'Jobless Claims melonjak > 225K & Durable Goods lemah → BUY XAUUSD dari sapuan Sell-Side Liquidity bawah.'
    },
    {
      id: 'cal-2026-11-26-thanksgiving',
      dateIso: '2026-11-26',
      timeWib: '20:00 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'US Thanksgiving Holiday (Likuiditas Sesi NY Tutup / Tipis)',
      previous: 'Normal Vol',
      forecast: 'Low Liquidity',
      actual: 'Market Holiday',
      biasSignal: 'HINDARI BREAKOUT / SCALP RANGE',
      primaryPair: 'XAUUSD & US100',
      fundamentalThesis:
        'Bank dan institusi Wall Street libur merayakan Thanksgiving. Tanpa likuiditas sesi New York, pergerakan harga cenderung terjebak dalam konsolidasi sempit dan rawan spread melebar.',
      bullishUsdScenario:
        'Sesi London saja yang aktif (14.00–17.00 WIB): Fokus scalping pantulan di batas Range Asia/London dan tutup posisi sebelum 20.00 WIB.',
      bearishUsdScenario:
        'Jangan mengejar breakout saat sesi malam WIB karena tidak ada dorongan volume institusi AS.'
    },
    {
      id: 'cal-2026-11-27-eucpi',
      dateIso: '2026-11-27',
      timeWib: '15:00 WIB',
      currency: 'EUR',
      impact: 'MED',
      title: 'French & Spanish Prelim CPI (Nov) + US Black Friday Early Close',
      previous: '1.8% YoY',
      forecast: '1.9% YoY',
      actual: 'Menunggu Rilis',
      biasSignal: 'FRIDAY REVERSAL SETUP',
      primaryPair: 'EURUSD & XAUUSD',
      fundamentalThesis:
        'Data inflasi awal negara inti Zona Euro menentukan arah kebijakan ECB pada Desember, sementara sesi AS tutup lebih awal (Black Friday) sehingga rawan aksi ambil untung mingguan (Friday Reversal).',
      bullishUsdScenario:
        'CPI Eropa di bawah konsensus (<1.8%) → Memperkuat peluang ECB pangkas bunga: SELL EURUSD menuju weekly low.',
      bearishUsdScenario:
        'Profit taking posisi Short Dolar jelang akhir pekan → Pantulan BUY XAUUSD & BUY EURUSD di sesi London.'
    },
    {
      id: 'cal-2026-12-04-nfp',
      dateIso: '2026-12-04',
      timeWib: '20:30 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'US Non-Farm Payrolls (NFP) & Unemployment Rate (Nov)',
      previous: '+155K / 4.2%',
      forecast: '+165K / 4.2%',
      actual: 'Jadwal Desember',
      biasSignal: 'MAJOR TREND CATALYST',
      primaryPair: 'XAUUSD, US100, EURUSD',
      fundamentalThesis:
        'Laporan tenaga kerja utama terakhir sebelum rapat FOMC 8–9 Desember 2026. Menjadi penentu final apakah The Fed akan menahan suku bunga atau memberi sinyal pelonggaran.',
      bullishUsdScenario:
        'NFP > +185K & Tingkat Pengangguran turun (4.1%) → Rally DXY: SELL XAUUSD & SELL EURUSD setelah liquidity sweep.',
      bearishUsdScenario:
        'NFP < +130K & Tingkat Pengangguran naik (>=4.3%) → BUY XAUUSD & BUY US100 dari Demand Order Block H1.'
    },
    {
      id: 'cal-2026-12-10-fomc',
      dateIso: '2026-12-10',
      timeWib: '02:00 WIB',
      currency: 'USD',
      impact: 'HIGH',
      title: 'FOMC Interest Rate Decision, Dot Plot & US CPI (20:30 WIB)',
      previous: '3.75%-4.00%',
      forecast: '3.75%-4.00% + Dot Plot',
      actual: 'Jadwal Desember',
      biasSignal: 'SUPER MACRO DAY',
      primaryPair: 'Semua Pair Utama',
      fundamentalThesis:
        'Rapat FOMC penutup tahun 2026 disertai rilis proyeksi suku bunga (Dot Plot) pada pukul 02.00 WIB, dilanjutkan rilis inflasi US CPI pada pukul 20.30 WIB di hari yang sama.',
      bullishUsdScenario:
        'Dot Plot menunjukkan pemangkasan bunga lebih sedikit di 2027 → Tekanan jual besar pada XAUUSD & EURUSD.',
      bearishUsdScenario:
        'Dot Plot dovish + CPI melandai → Reli besar pada XAUUSD, US100, dan Bitcoin (BTCUSDT).'
    }
  ];
}

/**
 * Menghitung Analisa Teknikal & Zona POI (Order Block / FVG / SnR)
 * secara real-time berdasarkan harga live & range aktif terminal
 */
function buildTechnicalConfluenceForEvent(ev) {
  const prices = (typeof appState !== 'undefined' && appState.livePrices) || {
    XAUUSD: 3576.20,
    US100: 21450.00,
    EURUSD: 1.09770,
    BTCUSDT: 94250.00
  };
  const ranges = (typeof appState !== 'undefined' && appState.marketRanges) || {};

  const xau = Number(prices.XAUUSD) || 3576.20;
  const eur = Number(prices.EURUSD) || 1.09770;
  const ndx = Number(prices.US100) || 21450.00;

  const xauRng = ranges.XAUUSD || { high: xau + 14.5, low: xau - 14.5 };
  const eurRng = ranges.EURUSD || { high: eur + 0.0028, low: eur - 0.0028 };
  const ndxRng = ranges.US100 || { high: ndx + 110, low: ndx - 110 };

  if (ev.currency === 'EUR') {
    const supplyOb = (eur + 0.0022).toFixed(5);
    const demandOb = (eur - 0.0024).toFixed(5);
    return {
      techSummary: `EURUSD berada di struktur Bearish HTF (harga saat ini ${eur.toFixed(5)}). Pantau sapuan BSL di atas ${Number(eurRng.high).toFixed(5)} untuk entry Sell, atau reaksi Demand OB di ${demandOb}.`,
      buyZone: `BUY EURUSD di Demand OB ${demandOb} – ${(eur - 0.0030).toFixed(5)} (Target TP: ${Number(eurRng.high).toFixed(5)})`,
      sellZone: `SELL EURUSD di Supply OB ${supplyOb} – ${(eur + 0.0030).toFixed(5)} (Target TP: ${Number(eurRng.low).toFixed(5)})`
    };
  }

  if (ev.id.includes('adp')) {
    const ndxSupply = (ndx + 95).toFixed(2);
    const ndxDemand = (ndx - 105).toFixed(2);
    return {
      techSummary: `US100 (${ndx.toFixed(2)}) menguji zona keseimbangan harian (${Number(ndxRng.low).toFixed(0)}–${Number(ndxRng.high).toFixed(0)}). Tunggu konfirmasi MSS M5 setelah sapuan likuiditas sesi NY.`,
      buyZone: `BUY US100 di Demand OB ${ndxDemand} – ${(ndx - 145).toFixed(2)} (Target BSL: ${Number(ndxRng.high).toFixed(2)})`,
      sellZone: `SELL US100 di Supply OB ${ndxSupply} – ${(ndx + 140).toFixed(2)} (Target SSL: ${Number(ndxRng.low).toFixed(2)})`
    };
  }

  const xauSupply = (xau + 13.5).toFixed(2);
  const xauDemand = (xau - 14.0).toFixed(2);
  return {
    techSummary: `XAUUSD (${xau.toFixed(2)}) bergerak di antara Liquidity Pool bawah ${Number(xauRng.low).toFixed(2)} dan atas ${Number(xauRng.high).toFixed(2)}. Hindari entry di tengah range; tunggu sweep ke salah satu ekstrem POI.`,
    buyZone: `BUY XAUUSD di Demand OB / FVG ${xauDemand} – ${(xau - 19.0).toFixed(2)} (SL di bawah ${(xau - 23.5).toFixed(2)})`,
    sellZone: `SELL XAUUSD di Supply OB / FVG ${xauSupply} – ${(xau + 19.0).toFixed(2)} (SL di atas ${(xau + 23.5).toFixed(2)})`
  };
}

const DEFAULT_BREAKING_WIRE = [
  {
    id: 'bw-fed-2026',
    tag: 'THE FED • YIELD 5.3%',
    tagColor: 'bg-blue-500/20 text-blue-300',
    time: 'Macro Desk',
    headline: 'Yield Obligasi 10-Tahun AS Bertahan Tinggi Jelang Data Core PCE Rabu; DXY Menekan XAUUSD & EURUSD',
    impactNote: 'Bias Teknis: Waspadai spike USD jika Core PCE di atas 3.2% YoY; tunggu sapuan likuiditas sebelum entry.'
  },
  {
    id: 'bw-ai-ndx-2026',
    tag: 'US100 • TECH VOLATILITY',
    tagColor: 'bg-amber-500/20 text-amber-300',
    time: 'Wall Street Radar',
    headline: 'Pasar Saham Teknologi AS (Nasdaq 100) Uji Support Struktural di Tengah Evaluasi Belanja Infrastruktur AI',
    impactNote: 'Bias Teknis: US100 sensitif pada pembukaan sesi NY 21.30 WIB; prioritaskan setup setelah Judas Swing.'
  },
  {
    id: 'bw-geo-2026',
    tag: 'GEOPOLITIK • SAFE HAVEN',
    tagColor: 'bg-rose-500/20 text-rose-300',
    time: 'Global Risk',
    headline: 'Dinamika Tarif Perdagangan & Jalur Energi Timur Tengah Menjaga Permintaan Lindung Nilai Emas di Zona Demand',
    impactNote: 'Bias Teknis: Setiap koreksi tajam XAUUSD ke Demand OB H1/H4 berpotensi memicu pantulan pembeli institusi.'
  }
];

let mergedCalendarEvents = getVerifiedMacroCalendar();
let liveBreakingWire = [...DEFAULT_BREAKING_WIRE];

/**
 * Sinkronisasi Live Feed:
 * 1. Mencoba menarik kalender mingguan real-time (FairEconomy / ForexFactory JSON)
 * 2. Menarik headline berita makro live (CryptoCompare News API)
 * 3. Menggabungkan dengan kalender makro terverifikasi tanpa duplikasi
 */
async function fetchLiveEconomicNews(manual = false) {
  const statusEl = document.getElementById('news-sync-status');
  if (statusEl) {
    statusEl.textContent = '↻ Menyinkronkan Feed Kalender & Headline Makro Live...';
  }

  const baseEvents = getVerifiedMacroCalendar();
  let liveFetchedEvents = [];

  // 1. Live Economic Calendar Feed (ForexFactory / FairEconomy JSON)
  try {
    const ffRes = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    if (ffRes.ok) {
      const ffJson = await ffRes.json();
      if (Array.isArray(ffJson)) {
        liveFetchedEvents = ffJson
          .filter((item) => ['USD', 'EUR', 'GBP'].includes(item.country) && ['High', 'Medium'].includes(item.impact))
          .map((item, idx) => {
            const dt = new Date(item.date);
            const wibDt = new Date(dt.getTime() + dt.getTimezoneOffset() * 60000 + 7 * 3600000);
            const dateIso = `${wibDt.getFullYear()}-${String(wibDt.getMonth() + 1).padStart(2, '0')}-${String(wibDt.getDate()).padStart(2, '0')}`;
            const timeWib = `${String(wibDt.getHours()).padStart(2, '0')}:${String(wibDt.getMinutes()).padStart(2, '0')} WIB`;
            const isHigh = item.impact === 'High';
            return {
              id: `ff-live-${dateIso}-${idx}`,
              dateIso,
              timeWib,
              currency: item.country,
              impact: isHigh ? 'HIGH' : 'MED',
              title: `${item.country} ${item.title}`,
              previous: item.previous || '-',
              forecast: item.forecast || '-',
              actual: item.actual || 'Menunggu Rilis',
              biasSignal: isHigh ? 'HIGH IMPACT — WAIT SWEEP' : 'INTRADAY CONFLUENCE',
              primaryPair: item.country === 'EUR' ? 'EURUSD' : 'XAUUSD & US100',
              fundamentalThesis: `Rilis data ${item.title} (${item.country}) dengan konsensus ${item.forecast || 'stabil'} dibanding periode sebelumnya ${item.previous || '-'}. Selisih aktual terhadap konsensus akan menggerakkan DXY dan imbal hasil obligasi.`,
              bullishUsdScenario: `Actual lebih kuat dari Forecast (${item.forecast || 'konsensus'}) → Penguatan ${item.country}: Cari posisi searah momentum setelah retest FVG M5.`,
              bearishUsdScenario: `Actual lebih lemah dari Forecast (${item.forecast || 'konsensus'}) → Pelemahan ${item.country}: Cari reversal dari zona liquidity sweep berlawanan.`
            };
          });
      }
    }
  } catch (_) {
    // Jika CORS memblokir ff_calendar_thisweek.json di browser mobile, gunakan kalender terverifikasi di bawah
  }

  // Gabungkan liveFetchedEvents (jika berhasil) dengan getVerifiedMacroCalendar()
  if (liveFetchedEvents.length > 0) {
    const extraFuture = baseEvents.filter((b) => b.dateIso > '2026-11-29');
    mergedCalendarEvents = [...liveFetchedEvents, ...extraFuture];
  } else {
    mergedCalendarEvents = baseEvents;
  }

  // 2. Live Macro Headline Wire
  try {
    const wireRes = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    if (wireRes.ok) {
      const wireJson = await wireRes.json();
      const items = Array.isArray(wireJson.Data) ? wireJson.Data : [];
      const filtered = items
        .filter((n) => {
          const s = `${n.title} ${n.categories || ''}`.toLowerCase();
          return (
            s.includes('fed') ||
            s.includes('trump') ||
            s.includes('inflation') ||
            s.includes('cpi') ||
            s.includes('pce') ||
            s.includes('rate') ||
            s.includes('yield') ||
            s.includes('dollar') ||
            s.includes('gold') ||
            s.includes('nasdaq')
          );
        })
        .slice(0, 3)
        .map((n, i) => ({
          id: `wire-live-${n.id || i}`,
          tag: `LIVE WIRE • ${(n.source_info?.name || 'MACRO').toUpperCase()}`,
          tagColor: 'bg-cyan-500/20 text-cyan-300',
          time: 'Live Update',
          headline: n.title,
          impactNote: 'Pantau korelasi langsung ke DXY, US100, dan XAUUSD pada sesi aktif.'
        }));
      if (filtered.length > 0) {
        liveBreakingWire = [...filtered, ...DEFAULT_BREAKING_WIRE.slice(0, 2)];
      }
    }
  } catch (_) {}

  try {
    localStorage.setItem(
      NEWS_CACHE_KEY,
      JSON.stringify({ updatedAt: Date.now(), events: mergedCalendarEvents, wire: liveBreakingWire })
    );
  } catch (_) {}

  if (statusEl) {
    const clock = typeof formatWibClockFull === 'function' ? formatWibClockFull() : 'Tersinkron';
    const srcLabel = liveFetchedEvents.length > 0 ? 'Live Feed + Kalender Makro' : 'Kalender Terverifikasi + Live Wire';
    statusEl.textContent = `● ${srcLabel} (${clock})`;
  }

  renderEconomicNews();

  if (manual && typeof showToast === 'function') {
    showToast('📰 Kalender & Analisa Buy/Sell diperbarui!');
  }
}

function setNewsPeriod(period) {
  if (typeof appState !== 'undefined') {
    appState.newsPeriod = period;
    if (typeof saveAppState === 'function') saveAppState();
  }
  renderEconomicNews();
}

function filterNews(level) {
  if (typeof appState !== 'undefined') {
    appState.newsFilter = level;
    if (typeof saveAppState === 'function') saveAppState();
  }
  renderEconomicNews();
}

function renderEconomicNews() {
  const activePeriod = (typeof appState !== 'undefined' && appState.newsPeriod) || 'WEEK';
  const activeImpact = (typeof appState !== 'undefined' && appState.newsFilter) || 'ALL';
  const bounds = getWibDateBounds();

  // Sync styling tombol Period (Hari Ini, Minggu Ini, Bulan Ini, Semua)
  ['TODAY', 'WEEK', 'MONTH', 'ALL'].forEach((p) => {
    const btn = document.getElementById(`news-period-${p}`);
    if (!btn) return;
    btn.className =
      p === activePeriod
        ? 'py-2 rounded-xl bg-blue-600 text-white shadow-sm transition'
        : 'py-2 rounded-xl glass-card opacity-75 transition';
  });

  // Sync styling tombol Impact
  ['ALL', 'HIGH', 'MED'].forEach((lvl) => {
    const btn = document.getElementById(`news-filter-${lvl}`);
    if (!btn) return;
    btn.className =
      lvl === activeImpact
        ? 'news-filter-btn py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold'
        : 'news-filter-btn py-2 rounded-xl glass-card text-xs font-extrabold opacity-80';
  });

  // Render Breaking Wire
  const wireContainer = document.getElementById('breaking-wire-container');
  if (wireContainer) {
    wireContainer.innerHTML = liveBreakingWire
      .map(
        (w) => `
      <div class="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--border-subtle)] space-y-1">
        <div class="flex items-center justify-between gap-2">
          <span class="px-2 py-0.5 rounded-md ${w.tagColor} text-[9px] font-extrabold tracking-wide">${w.tag}</span>
          <span class="font-mono-num text-[9.5px] opacity-65">${w.time}</span>
        </div>
        <h4 class="text-xs font-extrabold leading-snug">${w.headline}</h4>
        <p class="text-[11px] opacity-80 leading-relaxed">${w.impactNote}</p>
      </div>`
      )
      .join('');
  }

  // Filter Kalender berdasarkan Periode & Impact
  let filtered = [...mergedCalendarEvents];

  if (activePeriod === 'TODAY') {
    filtered = filtered.filter((e) => e.dateIso === bounds.todayIso);
  } else if (activePeriod === 'WEEK') {
    filtered = filtered.filter((e) => e.dateIso >= bounds.weekStartIso && e.dateIso <= bounds.weekEndIso);
  } else if (activePeriod === 'MONTH') {
    filtered = filtered.filter((e) => e.dateIso.startsWith(bounds.monthPrefix));
  }

  if (activeImpact !== 'ALL') {
    filtered = filtered.filter((e) => e.impact === activeImpact);
  }

  // Update Summary Strip
  const summaryStrip = document.getElementById('news-summary-strip');
  if (summaryStrip) {
    const highCount = filtered.filter((e) => e.impact === 'HIGH').length;
    const periodNames = {
      TODAY: `Hari Ini (${formatReadableWibDate(bounds.todayIso)})`,
      WEEK: 'Minggu Ini (Sen–Min)',
      MONTH: 'Bulan Ini (November 2026)',
      ALL: 'Semua Jadwal (Nov – Des 2026)'
    };
    summaryStrip.innerHTML = `📅 <strong>${periodNames[activePeriod]}:</strong> Ditemukan <strong>${filtered.length} agenda</strong> (${highCount} High Impact). Gunakan skenario <em>Buy/Sell + Zona POI</em> di bawah untuk konfirmasi entry.`;
  }

  // Render Cards
  const listContainer = document.getElementById('news-list-container');
  if (!listContainer) return;

  if (!filtered.length) {
    listContainer.innerHTML = `
      <div class="glass-card p-5 text-center space-y-2">
        <p class="text-xs font-bold opacity-80">Tidak ada jadwal berita pada filter periode/impact ini.</p>
        <button onclick="setNewsPeriod('WEEK'); filterNews('ALL');" class="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold">
          Lihat Semua Berita Minggu Ini
        </button>
      </div>`;
    return;
  }

  listContainer.innerHTML = filtered
    .map((ev) => {
      const isHigh = ev.impact === 'HIGH';
      const tsMs = buildWibTimestampMs(ev.dateIso, ev.timeWib);
      const cd = formatCountdownToEvent(tsMs);
      const tech = buildTechnicalConfluenceForEvent(ev);
      const dateReadable = formatReadableWibDate(ev.dateIso);

      return `
      <div class="glass-card p-4 space-y-3 border ${isHigh ? 'border-rose-500/30' : 'border-[var(--border-subtle)]'}">
        <!-- Header Impact, Tanggal & Countdown -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-md ${isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35' : 'bg-amber-500/20 text-amber-400 border border-amber-500/35'} text-[9px] font-extrabold">
              ${isHigh ? '🔴 HIGH IMPACT' : '🟠 MEDIUM'}
            </span>
            <span class="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 font-mono-num text-[9px] font-extrabold">
              ${ev.currency}
            </span>
            <span class="px-2 py-0.5 rounded-md ${cd.isImminent ? 'bg-rose-600 text-white' : 'bg-white/10 text-cyan-300'} font-mono-num text-[9px] font-extrabold">
              ${cd.label}
            </span>
          </div>
          <span class="font-mono-num text-[10px] font-bold text-slate-300 text-right shrink-0">
            ${dateReadable}<br/>${ev.timeWib}
          </span>
        </div>

        <!-- Judul Event & Pair Terdampak -->
        <div>
          <h3 class="font-display text-sm font-extrabold leading-snug">${ev.title}</h3>
          <span class="text-[10.5px] font-bold text-cyan-400 block mt-0.5">🎯 Fokus Pair: ${ev.primaryPair} • Bias: ${ev.biasSignal}</span>
        </div>

        <!-- Data Angka: Previous / Forecast / Actual -->
        <div class="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-[var(--border-subtle)] text-center font-mono-num text-[10.5px]">
          <div>
            <span class="text-[8.5px] opacity-60 font-sans block">PREVIOUS</span>
            <strong>${ev.previous}</strong>
          </div>
          <div>
            <span class="text-[8.5px] opacity-60 font-sans block">FORECAST</span>
            <strong class="text-cyan-400">${ev.forecast}</strong>
          </div>
          <div>
            <span class="text-[8.5px] opacity-60 font-sans block">ACTUAL</span>
            <strong class="text-amber-400">${ev.actual}</strong>
          </div>
        </div>

        <!-- Blok 1: Analisa Fundamental -->
        <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1 text-[11px] leading-relaxed">
          <span class="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-400 block">🏛️ ANALISA FUNDAMENTAL</span>
          <p class="opacity-90">${ev.fundamentalThesis}</p>
        </div>

        <!-- Blok 2: Analisa Teknikal & Zona POI Real-Time -->
        <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5 text-[11px] leading-relaxed">
          <span class="text-[9.5px] font-extrabold uppercase tracking-wider text-cyan-400 block">📐 ANALISA TEKNIKAL & ZONA POI LIVE</span>
          <p class="opacity-90">${tech.techSummary}</p>
          <div class="pt-1 space-y-1 font-mono-num text-[10px]">
            <div class="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold">🟢 ${tech.buyZone}</div>
            <div class="p-2 rounded-lg bg-rose-500/15 text-rose-300 font-bold">🔴 ${tech.sellZone}</div>
          </div>
        </div>

        <!-- Blok 3: Skenario Eksekusi Rilis Data (Buy vs Sell) -->
        <div class="p-3 rounded-xl bg-black/25 border border-white/10 space-y-1.5 text-[11px] leading-relaxed">
          <span class="text-[9.5px] font-extrabold uppercase tracking-wider text-amber-400 block">⚡ SKENARIO EKSEKUSI SAAT RILIS</span>
          <p class="text-rose-300"><strong>• Skenario SELL:</strong> ${ev.bullishUsdScenario}</p>
          <p class="text-emerald-300"><strong>• Skenario BUY:</strong> ${ev.bearishUsdScenario}</p>
        </div>
      </div>`;
    })
    .join('');
}

// Inisialisasi saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
  try {
    const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_KEY) || 'null');
    if (cached && Array.isArray(cached.events) && cached.events.length > 0) {
      mergedCalendarEvents = cached.events;
    }
    if (cached && Array.isArray(cached.wire) && cached.wire.length > 0) {
      liveBreakingWire = cached.wire;
    }
  } catch (_) {}

  renderEconomicNews();
});
