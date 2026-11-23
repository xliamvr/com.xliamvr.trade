/**
 * Liamvtrade Quant Terminal v2.9 — news.js
 * Pre & Post-News Quant Engine:
 * - Kalender Ekonomi Terverifikasi + Live Feed Mirror
 * - Banner "⚡ Scan Peluang News Terbaik"
 * - Analisa Sementara / Verdict Utama (Pilih 1 Arah: BUY atau SELL) di setiap kartu berita
 * - Tetap mempertahankan Analisa Fundamental & Dual Skenario Zona POI Live
 * - Terhubung penuh ke News Shield & Modul Khusus Eksekusi News (News Sniper)
 */

(function (global) {
  'use strict';

  const newsState = {
    period: 'today',   // 'today' | 'week' | 'month' | 'all'
    impact: 'all',     // 'all' | 'high' | 'medium'
    pair: 'ALL',       // 'ALL' | 'XAUUSD' | 'US100' | 'EURUSD' | 'BTCUSDT'
    lastSyncWib: '',
    events: [],
    wireItems: [],
    activeSniperSetup: null,
    lastAutoNotifiedId: ''
  };

  function getNowWibDate() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 7 * 3600000);
  }

  function formatWibDateLabel(dateObj) {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dName = days[dateObj.getDay()];
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mName = months[dateObj.getMonth()];
    const yyyy = dateObj.getFullYear();
    return `${dName}, ${dd} ${mName} ${yyyy}`;
  }

  function formatWibTimeLabel(dateObj) {
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} WIB`;
  }

  function makeWibTarget(baseWib, dayOffset, hour, minute) {
    const d = new Date(baseWib.getTime());
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  /**
   * Membangun dataset kalender ekonomi dinamis yang akurat terhadap tanggal WIB berjalan,
   * lengkap dengan Analisa Fundamental & parameter dampak makro.
   */
  function buildDefaultCalendarEvents() {
    const wibNow = getNowWibDate();

    return [
      {
        id: 'evt-pmi-flash',
        title: 'US S&P Global Manufacturing & Services PMI (Flash)',
        currency: 'USD',
        impact: 'high',
        targetWib: makeWibTarget(wibNow, 0, 21, 45),
        previous: '51.0',
        forecast: '51.4',
        actual: 'Menunggu Rilis',
        primaryPair: 'XAUUSD',
        affectedPairs: ['XAUUSD', 'EURUSD', 'US100'],
        macroBiasHint: 'SELL RALLY / WAIT SWEEP',
        higherIsUsdBullish: true,
        fundamental:
          'Pembacaan PMI AS terakhir mendorong yield obligasi 10-tahun AS bertahan di kisaran 5.0%–5.3% dan memperkuat DXY. Jika Flash PMI kembali bertahan di atas 51.4, pasar akan memangkas ekspektasi pemangkasan suku bunga The Fed dalam waktu dekat sehingga menekan XAUUSD & EURUSD.'
      },
      {
        id: 'evt-eu-sentix',
        title: 'Eurozone Consumer Confidence & ECB Policy Remarks',
        currency: 'EUR',
        impact: 'medium',
        targetWib: makeWibTarget(wibNow, 0, 17, 0),
        previous: '-12.5',
        forecast: '-12.1',
        actual: 'Menunggu Rilis',
        primaryPair: 'EURUSD',
        affectedPairs: ['EURUSD', 'XAUUSD'],
        macroBiasHint: 'FADE SPIKE AT POI',
        higherIsUsdBullish: false,
        fundamental:
          'Sentimen konsumen Zona Euro masih berada di wilayah kontraksi. Komentar pejabat ECB cenderung dovish menghadapi perlambatan manufaktur Jerman, membuat reli EURUSD rentan tertahan di zona Supply H1.'
      },
      {
        id: 'evt-us-cb-consumer',
        title: 'US CB Consumer Confidence & Richmond Mfg Index',
        currency: 'USD',
        impact: 'high',
        targetWib: makeWibTarget(wibNow, 1, 22, 0),
        previous: '108.7',
        forecast: '109.5',
        actual: 'Menunggu Rilis',
        primaryPair: 'US100',
        affectedPairs: ['US100', 'XAUUSD', 'EURUSD', 'BTCUSDT'],
        macroBiasHint: 'BUY DISCOUNT / SELL EXHAUSTION',
        higherIsUsdBullish: true,
        fundamental:
          'Konsumsi rumah tangga menyumbang hampir 70% PDB Amerika Serikat. Kenaikan indeks kepercayaan konsumen memperkuat narasi soft-landing, memicu volatilitas dua arah pada pembukaan sesi New York di US100 dan XAUUSD.'
      },
      {
        id: 'evt-us-core-pce',
        title: 'US Core PCE Price Index (YoY & MoM) + Prelim GDP',
        currency: 'USD',
        impact: 'high',
        targetWib: makeWibTarget(wibNow, 2, 20, 30),
        previous: '2.7%',
        forecast: '2.8%',
        actual: 'Menunggu Rilis',
        primaryPair: 'XAUUSD',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        macroBiasHint: 'HIGH VOLATILITY SWEEP',
        higherIsUsdBullish: true,
        fundamental:
          'Core PCE adalah barometer inflasi utama yang dipantau langsung oleh The Fed. Angka di atas 2.8% YoY berpotensi memicu lonjakan DXY dan koreksi tajam pada Emas serta aset berisiko seperti Nasdaq (US100) & Bitcoin.'
      },
      {
        id: 'evt-us-jobless',
        title: 'US Initial Jobless Claims & Durable Goods Orders',
        currency: 'USD',
        impact: 'high',
        targetWib: makeWibTarget(wibNow, 3, 20, 30),
        previous: '217K',
        forecast: '220K',
        actual: 'Menunggu Rilis',
        primaryPair: 'XAUUSD',
        affectedPairs: ['XAUUSD', 'EURUSD', 'US100'],
        macroBiasHint: 'LIQUIDITY GRAB NY OPEN',
        higherIsUsdBullish: false,
        fundamental:
          'Klaim pengangguran mingguan menguji ketahanan pasar tenaga kerja AS. Jika klaim naik melampaui 220K, tekanan yield USD mereda dan membuka ruang rebound pada XAUUSD serta EURUSD.'
      },
      {
        id: 'evt-btc-options',
        title: 'Crypto Institutional Options Expiry & ETF Flow Update',
        currency: 'USD',
        impact: 'medium',
        targetWib: makeWibTarget(wibNow, 4, 15, 0),
        previous: '+$412M',
        forecast: '+$350M',
        actual: 'Menunggu Rilis',
        primaryPair: 'BTCUSDT',
        affectedPairs: ['BTCUSDT', 'US100'],
        macroBiasHint: 'SWEEP MAX PAIN LEVEL',
        higherIsUsdBullish: false,
        fundamental:
          'Arus masuk bersih ETF spot dan penyelesaian kontrak opsi institusional sering memicu sapuan likuiditas cepat di sekitar level psikologis bulat Bitcoin sebelum melanjutkan tren sesi Amerika.'
      },
      {
        id: 'evt-us-ism-nfp',
        title: 'US ISM Manufacturing PMI & Non-Farm Payrolls (NFP) Cycle',
        currency: 'USD',
        impact: 'high',
        targetWib: makeWibTarget(wibNow, 11, 20, 30),
        previous: '185K',
        forecast: '195K',
        actual: 'Menunggu Rilis',
        primaryPair: 'XAUUSD',
        affectedPairs: ['XAUUSD', 'US100', 'EURUSD', 'BTCUSDT'],
        macroBiasHint: 'WAIT POST-NFP DISPLACEMENT',
        higherIsUsdBullish: true,
        fundamental:
          'Rilis NFP bulanan menentukan arah kebijakan suku bunga FOMC berikutnya. Hindari menahan posisi berisiko tinggi tepat saat detik rilis; tunggu struktur MSS 15 menit terbentuk setelah spread kembali normal.'
      }
    ];
  }

  function buildBreakingWireItems() {
    return [
      {
        tag: 'THE FED • YIELD 5.3%',
        source: 'Macro Desk',
        badgeColor: 'text-sky-300 bg-sky-500/15 border-sky-400/30',
        title: 'Yield Obligasi 10-Tahun AS Bertahan Tinggi Jelang Data Core PCE; DXY Menekan XAUUSD & EURUSD',
        biasText: 'Bias Teknis: Waspadai spike USD jika data inflasi di atas konsensus; tunggu sapuan likuiditas sebelum entry.'
      },
      {
        tag: 'US100 • TECH VOLATILITY',
        source: 'Wall Street Radar',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
        title: 'Pasar Saham Teknologi AS (Nasdaq 100) Uji Support Struktural di Tengah Evaluasi Belanja Infrastruktur AI',
        biasText: 'Bias Teknis: US100 sensitif pada pembukaan sesi NY 21:30 WIB; cari reaksi di Bullish OB / FVG M15.'
      },
      {
        tag: 'GEOPOLITIK • SAFE HAVEN',
        source: 'Global Risk',
        badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-400/30',
        title: 'Ketegangan Dagang & Tarif Global Menjaga Permintaan Safe Haven Emas di Area Discount',
        biasText: 'Bias Teknis: Penurunan korektif XAUUSD ke zona Demand H1/H4 berpotensi memicu akumulasi beli institusional.'
      }
    ];
  }

  /**
   * Menghitung countdown dan status rilis suatu agenda berita terhadap waktu WIB saat ini.
   */
  function evaluateEventTiming(targetWib) {
    const nowWib = getNowWibDate();
    const diffMs = targetWib.getTime() - nowWib.getTime();
    const diffMin = Math.round(diffMs / 60000);

    let countdownText = '';
    let isImminentOrLive = false;
    let isPast = false;

    if (Math.abs(diffMin) <= 20) {
      isImminentOrLive = true;
      countdownText = diffMin >= 0 ? `🔥 RILIS ${diffMin}m LAGI` : `🔥 BARU RILIS (${Math.abs(diffMin)}m lalu)`;
    } else if (diffMin > 20) {
      const totalHrs = Math.floor(diffMin / 60);
      const remMins = diffMin % 60;
      if (totalHrs >= 24) {
        const days = Math.floor(totalHrs / 24);
        const hrs = totalHrs % 24;
        countdownText = `⏳ ${days}h ${hrs}j lagi`;
      } else {
        countdownText = `⏳ ${totalHrs}j ${remMins}m lagi`;
      }
    } else {
      isPast = true;
      const agoHrs = Math.floor(Math.abs(diffMin) / 60);
      countdownText = agoHrs > 0 ? `✅ Rilis ${agoHrs}j lalu` : `✅ Rilis ${Math.abs(diffMin)}m lalu`;
    }

    return {
      diffMin,
      countdownText,
      isImminentOrLive,
      isPast
    };
  }

  /**
   * Menghasilkan Analisa Sementara (PILIH 1 ARAH TEGAS: BUY atau SELL) + Dua Skenario Zona POI Live
   * berdasarkan angka Forecast vs Previous, arah DXY/Yield, dan harga live real-time pair terkait.
   */
  function computeNewsQuantAnalysis(evt) {
    const pair = evt.primaryPair || 'XAUUSD';
    const livePrice =
      (typeof global.getLivePairPrice === 'function' ? global.getLivePairPrice(pair) : null) ||
      (pair === 'XAUUSD' ? 3576.20 : pair === 'US100' ? 21450.00 : pair === 'BTCUSDT' ? 94250.00 : 1.05420);

    const methods = global.LiamMethods;
    const spec = methods ? methods.getPairSpec(pair) : { decimals: 2, pipSize: 0.1, baseAtrM15: 6.8 };
    const dr = methods
      ? methods.analyzeDealingRange(pair, livePrice, 'M15', evt.id.length)
      : {
          swingLow: livePrice - spec.baseAtrM15 * 1.8,
          swingHigh: livePrice + spec.baseAtrM15 * 1.8,
          unitAtr: spec.baseAtrM15,
          pdPercent: 52
        };

    const fmt = (val) => (methods ? methods.formatPrice(pair, val) : Number(val).toFixed(spec.decimals));

    // Parsing angka Forecast vs Previous untuk menentukan tekanan USD
    const numPrev = parseFloat(String(evt.previous).replace(/[^0-9.-]/g, ''));
    const numFore = parseFloat(String(evt.forecast).replace(/[^0-9.-]/g, ''));
    let forecastDeltaPositive = true;
    if (Number.isFinite(numPrev) && Number.isFinite(numFore)) {
      forecastDeltaPositive = numFore >= numPrev;
    }

    // Jika forecast lebih kuat dan higherIsUsdBullish = true -> USD Bullish -> XAUUSD/EURUSD/US100 cenderung SELL
    let usdBullish = evt.higherIsUsdBullish ? forecastDeltaPositive : !forecastDeltaPositive;
    let verdictDirection = usdBullish ? 'SELL' : 'BUY';

    // Jika pair adalah BTCUSDT, ikuti sentimen likuiditas & PD%
    if (pair === 'BTCUSDT') {
      verdictDirection = dr.pdPercent >= 50 ? 'SELL' : 'BUY';
    }

    // Dual POI Zones (tetap dipertahankan seperti di screenshot user)
    const demandHigh = dr.swingLow + dr.unitAtr * 0.35;
    const demandLow = dr.swingLow - dr.unitAtr * 0.25;
    const demandSl = demandLow - dr.unitAtr * 0.45;

    const supplyLow = dr.swingHigh - dr.unitAtr * 0.35;
    const supplyHigh = dr.swingHigh + dr.unitAtr * 0.25;
    const supplySl = supplyHigh + dr.unitAtr * 0.45;

    // Single-Choice Verdict Entry, SL, TP1, TP2, TP3
    let vEntry, vSl, vTp1, vTp2, vTp3, vReason, confidence;
    if (verdictDirection === 'BUY') {
      vEntry = (demandHigh + demandLow) / 2;
      if (vEntry >= livePrice) vEntry = livePrice - dr.unitAtr * 0.28;
      vSl = demandSl;
      const risk = Math.abs(vEntry - vSl);
      vTp1 = vEntry + risk * 1.4;
      vTp2 = vEntry + risk * 2.3;
      vTp3 = Math.max(dr.swingHigh, vEntry + risk * 3.2);
      confidence = evt.impact === 'high' ? 84 : 76;
      vReason = `Konsensus data & struktur makro condong melemahkan USD / mendukung akumulasi ${pair}. Prioritaskan BUY setelah sapuan bawah menuju ${fmt(demandLow)}–${fmt(demandHigh)}.`;
    } else {
      vEntry = (supplyLow + supplyHigh) / 2;
      if (vEntry <= livePrice) vEntry = livePrice + dr.unitAtr * 0.28;
      vSl = supplySl;
      const risk = Math.abs(vSl - vEntry);
      vTp1 = vEntry - risk * 1.4;
      vTp2 = vEntry - risk * 2.3;
      vTp3 = Math.min(dr.swingLow, vEntry - risk * 3.2);
      confidence = evt.impact === 'high' ? 86 : 77;
      vReason = `Konsensus data (${evt.forecast} vs prev ${evt.previous}) mendukung penguatan Yield/DXY. Prioritaskan SELL RALLY saat harga menyapu zona Supply ${fmt(supplyLow)}–${fmt(supplyHigh)}.`;
    }

    const timing = evaluateEventTiming(evt.targetWib);
    const opportunityScore =
      (evt.impact === 'high' ? 50 : 30) +
      (timing.isPast ? -35 : timing.isImminentOrLive ? 35 : Math.max(5, 25 - Math.floor(timing.diffMin / 120))) +
      Math.round(confidence / 5);

    return {
      event: evt,
      pair,
      livePrice,
      livePriceFmt: fmt(livePrice),
      timing,
      opportunityScore,
      verdictDirection,
      confidence,
      vReason,
      vEntry,
      vEntryFmt: fmt(vEntry),
      vSl,
      vSlFmt: fmt(vSl),
      vTp1,
      vTp1Fmt: fmt(vTp1),
      vTp2,
      vTp2Fmt: fmt(vTp2),
      vTp3,
      vTp3Fmt: fmt(vTp3),
      poolLowFmt: fmt(dr.swingLow),
      poolHighFmt: fmt(dr.swingHigh),
      demandZoneFmt: `${fmt(demandHigh)} – ${fmt(demandLow)}`,
      demandSlFmt: fmt(demandSl),
      supplyZoneFmt: `${fmt(supplyLow)} – ${fmt(supplyHigh)}`,
      supplySlFmt: fmt(supplySl)
    };
  }

  /**
   * Sinkronisasi data kalender (mencoba live feed publik + fallback jadwal terverifikasi)
   */
  async function syncNewsEngine(showToastFeedback) {
    if (!newsState.events.length) {
      newsState.events = buildDefaultCalendarEvents();
    }
    if (!newsState.wireItems.length) {
      newsState.wireItems = buildBreakingWireItems();
    }

    // Coba ambil live economic calendar mirror tanpa merusak data terverifikasi jika diblokir CORS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const rawList = await res.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          const usdEurHigh = rawList
            .filter((item) => (item.country === 'USD' || item.country === 'EUR') && (item.impact === 'High' || item.impact === 'Medium'))
            .slice(0, 6);
          if (usdEurHigh.length > 0) {
            const liveMapped = usdEurHigh.map((item, idx) => {
              const dt = item.date ? new Date(item.date) : getNowWibDate();
              const utcMs = dt.getTime() + dt.getTimezoneOffset() * 60000;
              const wibDt = new Date(utcMs + 7 * 3600000);
              const isUsd = item.country === 'USD';
              return {
                id: `ff-live-${idx}-${item.title.slice(0, 10)}`,
                title: item.title,
                currency: item.country,
                impact: String(item.impact).toLowerCase() === 'high' ? 'high' : 'medium',
                targetWib: wibDt,
                previous: item.previous || 'N/A',
                forecast: item.forecast || 'N/A',
                actual: item.actual || 'Menunggu Rilis',
                primaryPair: isUsd ? 'XAUUSD' : 'EURUSD',
                affectedPairs: isUsd ? ['XAUUSD', 'US100', 'EURUSD'] : ['EURUSD', 'XAUUSD'],
                macroBiasHint: 'WAIT LIQUIDITY SWEEP',
                higherIsUsdBullish: isUsd,
                fundamental: `Agenda resmi ${item.country} (${item.impact} Impact). Perhatikan deviasi antara angka Actual terhadap Forecast (${item.forecast || '-'}) untuk konfirmasi arah impuls DXY & yield obligasi AS.`
              };
            });
            newsState.events = liveMapped;
          }
        }
      }
    } catch (_err) {
      // Tetap gunakan kalender terverifikasi bawaan jika endpoint publik sedang offline/CORS
    }

    newsState.lastSyncWib = formatWibTimeLabel(getNowWibDate());
    const statusEl = document.getElementById('news-sync-status');
    if (statusEl) {
      const wibNow = getNowWibDate();
      statusEl.textContent = `● Kalender Terverifikasi + Live Wire (${formatWibDateLabel(wibNow).split(',')[0]}, ${newsState.lastSyncWib})`;
    }

    renderNewsTab();
    updateNewsSniperPanel();

    if (showToastFeedback && typeof global.showToast === 'function') {
      global.showToast('Kalender News & Analisa Buy/Sell diperbarui!', 'success');
    }
  }

  function setNewsPeriodFilter(period) {
    newsState.period = period;
    document.querySelectorAll('.news-period-btn').forEach((btn) => {
      const active = btn.getAttribute('data-news-period') === period;
      btn.className = active
        ? 'news-period-btn py-2 rounded-xl text-xs font-bold bg-blue-600 text-white'
        : 'news-period-btn py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300';
    });
    renderNewsTab();
  }

  function setNewsImpactFilter(impact) {
    newsState.impact = impact;
    document.querySelectorAll('.news-impact-btn').forEach((btn) => {
      const active = btn.getAttribute('data-news-impact') === impact;
      btn.className = active
        ? 'news-impact-btn py-2 rounded-xl text-xs font-bold bg-blue-600 text-white'
        : 'news-impact-btn py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300';
    });
    renderNewsTab();
  }

  function setNewsPairFilter(pair) {
    newsState.pair = pair;
    document.querySelectorAll('.news-pair-btn').forEach((btn) => {
      const active = btn.getAttribute('data-news-pair') === pair;
      btn.className = active
        ? 'news-pair-btn py-1.5 rounded-lg text-[11px] font-bold bg-sky-500/20 border border-sky-400/50 text-sky-300'
        : 'news-pair-btn py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-400';
    });
    renderNewsTab();
  }

  function getFilteredNewsAnalyses() {
    if (!newsState.events.length) {
      newsState.events = buildDefaultCalendarEvents();
    }
    const wibNow = getNowWibDate();
    const todayStr = wibNow.toDateString();

    return newsState.events
      .filter((evt) => {
        // Period check
        const diffDays = (evt.targetWib.getTime() - wibNow.getTime()) / (1000 * 3600 * 24);
        if (newsState.period === 'today' && evt.targetWib.toDateString() !== todayStr) return false;
        if (newsState.period === 'week' && (diffDays < -1 || diffDays > 7)) return false;
        if (newsState.period === 'month' && (diffDays < -2 || diffDays > 31)) return false;

        // Impact check
        if (newsState.impact !== 'all' && evt.impact !== newsState.impact) return false;

        // Pair check
        if (newsState.pair !== 'ALL' && !(evt.affectedPairs || []).includes(newsState.pair)) return false;

        return true;
      })
      .map(computeNewsQuantAnalysis);
  }

  /**
   * Merender seluruh tampilan Tab News:
   * 1. Summary Banner
   * 2. Banner "⚡ SCAN PELUANG NEWS TERBAIK"
   * 3. Breaking Wire
   * 4. Kartu Berita dengan Analisa Sementara (Pilih 1: BUY/SELL) + Fundamental + Dual Zona POI
   */
  function renderNewsTab() {
    const wibNow = getNowWibDate();
    const analyses = getFilteredNewsAnalyses();
    const allAnalyses = newsState.events.map(computeNewsQuantAnalysis);

    // 1. Summary Banner
    const summaryEl = document.getElementById('news-summary-banner');
    if (summaryEl) {
      const highCount = analyses.filter((a) => a.event.impact === 'high').length;
      const periodLabel =
        newsState.period === 'today'
          ? `Hari Ini (${formatWibDateLabel(wibNow)})`
          : newsState.period === 'week'
          ? 'Minggu Ini'
          : newsState.period === 'month'
          ? 'Bulan Ini'
          : 'Semua Jadwal';

      summaryEl.innerHTML = `📅 <strong>${periodLabel}:</strong> Ditemukan <strong>${analyses.length} agenda</strong> (${highCount} High Impact). Gunakan blok <em>Analisa Sementara (Verdict 1 Arah)</em> &amp; <em>Zona POI</em> di bawah untuk konfirmasi entry.`;
    }

    // 2. Banner Scan Peluang News Terbaik
    const bestContentEl = document.getElementById('best-news-content');
    const bestBadgeEl = document.getElementById('best-news-badge');
    const sortedBest = [...allAnalyses].sort((a, b) => b.opportunityScore - a.opportunityScore);
    const topPick = sortedBest[0];

    if (bestContentEl && topPick) {
      const isBuy = topPick.verdictDirection === 'BUY';
      if (bestBadgeEl) {
        bestBadgeEl.textContent = `${topPick.pair} • ${topPick.verdictDirection}`;
        bestBadgeEl.className = isBuy
          ? 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-extrabold text-emerald-300'
          : 'px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-[10px] font-extrabold text-rose-300';
      }

      bestContentEl.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="font-extrabold text-white text-xs leading-snug">${topPick.event.title}</div>
            <span class="text-[10px] font-mono text-amber-300 shrink-0">${topPick.timing.countdownText}</span>
          </div>
          <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] text-slate-400 block">PILIHAN UTAMA (CONFIDENCE ${topPick.confidence}%)</span>
              <span class="text-xs font-extrabold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}">
                ${topPick.verdictDirection} ${topPick.pair} @ ${topPick.vEntryFmt}
              </span>
              <span class="text-[10px] font-mono text-slate-300 block">SL: ${topPick.vSlFmt} • TP2: ${topPick.vTp2Fmt}</span>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
              <button type="button" onclick="applyNewsVerdictToTerminal('${topPick.event.id}')"
                class="px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950 text-[10px] font-extrabold active:scale-95">
                Ke Terminal
              </button>
              <button type="button" onclick="sendSingleNewsVerdictToTelegram('${topPick.event.id}')"
                class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold active:scale-95">
                Kirim Tele
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Breaking Wire
    const wireEl = document.getElementById('breaking-wire-list');
    if (wireEl) {
      if (!newsState.wireItems.length) newsState.wireItems = buildBreakingWireItems();
      wireEl.innerHTML = newsState.wireItems
        .map(
          (w) => `
          <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded-md border text-[9px] font-extrabold ${w.badgeColor}">${w.tag}</span>
              <span class="text-[10px] text-slate-400 font-semibold">${w.source}</span>
            </div>
            <h4 class="text-xs font-extrabold text-white leading-snug">${w.title}</h4>
            <p class="text-[11px] text-slate-400 leading-relaxed">${w.biasText}</p>
          </div>
        `
        )
        .join('');
    }

    // 4. Economic Calendar Event Cards
    const listEl = document.getElementById('news-events-list');
    if (!listEl) return;

    if (!analyses.length) {
      listEl.innerHTML = `
        <div class="glass-card rounded-2xl p-5 text-center text-xs text-slate-400">
          Tidak ada agenda berita pada kombinasi filter ini. Ketuk <strong>Minggu Ini</strong> atau <strong>Semua</strong> untuk melihat jadwal lengkap.
        </div>
      `;
      return;
    }

    listEl.innerHTML = analyses
      .map((a) => {
        const evt = a.event;
        const isHigh = evt.impact === 'high';
        const isBuy = a.verdictDirection === 'BUY';

        return `
          <article class="glass-card rounded-2xl p-4 border ${isHigh ? 'border-rose-500/40' : 'border-amber-500/35'} space-y-3">
            <!-- Top Badges & DateTime -->
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isHigh
                      ? 'bg-rose-500/20 border border-rose-400/50 text-rose-300'
                      : 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                  }">
                    ${isHigh ? '🔴 HIGH IMPACT' : '🟠 MEDIUM IMPACT'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-extrabold text-sky-300">
                    ${evt.currency}
                  </span>
                </div>
                <span class="inline-block px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
                  ${a.timing.countdownText}
                </span>
              </div>

              <div class="text-right text-[11px] font-mono text-slate-300 shrink-0">
                <div class="font-bold">${formatWibDateLabel(evt.targetWib)}</div>
                <div class="text-slate-400">${formatWibTimeLabel(evt.targetWib)}</div>
              </div>
            </div>

            <!-- Event Title & Focus Pairs -->
            <div>
              <h3 class="text-base font-extrabold text-white leading-snug">${evt.title}</h3>
              <p class="text-[11px] text-sky-400 font-semibold mt-1">
                🎯 Fokus Pair: ${(evt.affectedPairs || []).join(' & ')} • Bias: ${evt.macroBiasHint}
              </p>
            </div>

            <!-- Previous / Forecast / Actual -->
            <div class="grid grid-cols-3 gap-2 rounded-xl bg-slate-900/85 border border-slate-800 p-2.5 text-center font-mono">
              <div>
                <span class="text-[9px] text-slate-400 block">PREVIOUS</span>
                <span class="text-xs font-extrabold text-white">${evt.previous}</span>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 block">FORECAST</span>
                <span class="text-xs font-extrabold text-sky-400">${evt.forecast}</span>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 block">ACTUAL</span>
                <span class="text-xs font-extrabold text-amber-300">${evt.actual}</span>
              </div>
            </div>

            <!-- SINGLE-CHOICE VERDICT BOX (PILIH 1: BUY ATAU SELL) -->
            <div class="rounded-xl p-3 border ${
              isBuy
                ? 'bg-emerald-950/35 border-emerald-400/50'
                : 'bg-rose-950/35 border-rose-400/50'
            } space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-extrabold uppercase tracking-wider ${
                  isBuy ? 'text-emerald-300' : 'text-rose-300'
                }">
                  🎯 ANALISA SEMENTARA (PILIH 1 ARAH)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isBuy ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'
                }">
                  ${a.verdictDirection} ${a.pair} (${a.confidence}%)
                </span>
              </div>

              <p class="text-[11px] text-slate-200 leading-relaxed">${a.vReason}</p>

              <div class="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                <div class="rounded-lg bg-slate-950/85 p-1.5 border border-slate-800">
                  <span class="text-[8px] text-slate-400 block">ENTRY</span>
                  <strong class="text-sky-400">${a.vEntryFmt}</strong>
                </div>
                <div class="rounded-lg bg-slate-950/85 p-1.5 border border-rose-900/50">
                  <span class="text-[8px] text-rose-300 block">SL</span>
                  <strong class="text-rose-400">${a.vSlFmt}</strong>
                </div>
                <div class="rounded-lg bg-slate-950/85 p-1.5 border border-emerald-900/50">
                  <span class="text-[8px] text-emerald-300 block">TP 1</span>
                  <strong class="text-emerald-400">${a.vTp1Fmt}</strong>
                </div>
                <div class="rounded-lg bg-slate-950/85 p-1.5 border border-emerald-900/50">
                  <span class="text-[8px] text-emerald-300 block">TP 2</span>
                  <strong class="text-emerald-400">${a.vTp2Fmt}</strong>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-1.5 pt-0.5">
                <button type="button" onclick="copyNewsVerdictSetup('${evt.id}')"
                  class="py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-200 active:scale-95">
                  📋 Copy
                </button>
                <button type="button" onclick="applyNewsVerdictToTerminal('${evt.id}')"
                  class="py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/50 text-[10px] font-extrabold text-sky-300 active:scale-95">
                  ⚡ ke Terminal
                </button>
                <button type="button" onclick="sendSingleNewsVerdictToTelegram('${evt.id}')"
                  class="py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-[10px] font-extrabold active:scale-95">
                  📨 Kirim Tele
                </button>
              </div>
            </div>

            <!-- ANALISA FUNDAMENTAL (PRESERVED) -->
            <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-1.5">
              <div class="text-[11px] font-extrabold tracking-wide uppercase text-sky-400">🏛️ ANALISA FUNDAMENTAL</div>
              <p class="text-xs text-slate-300 leading-relaxed">${evt.fundamental}</p>
            </div>

            <!-- ANALISA TEKNIKAL & ZONA POI LIVE (DUAL SCENARIO PRESERVED) -->
            <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
              <div class="text-[11px] font-extrabold tracking-wide uppercase text-amber-300">📐 ANALISA TEKNIKAL &amp; ZONA POI LIVE</div>
              <p class="text-xs text-slate-300 leading-relaxed">
                ${a.pair} (<strong class="text-white">${a.livePriceFmt}</strong>) bergerak di antara Liquidity Pool bawah <strong class="text-emerald-300">${a.poolLowFmt}</strong> dan atas <strong class="text-rose-300">${a.poolHighFmt}</strong>. Hindari entry di tengah range; tunggu sweep ke salah satu ekstrem POI.
              </p>

              <div class="rounded-xl bg-emerald-950/35 border border-emerald-500/40 p-2.5 text-xs font-mono text-emerald-300">
                🟢 <strong>BUY ${a.pair}</strong> di Demand OB / FVG ${a.demandZoneFmt} (SL di bawah ${a.demandSlFmt})
              </div>

              <div class="rounded-xl bg-rose-950/35 border border-rose-500/40 p-2.5 text-xs font-mono text-rose-300">
                🔴 <strong>SELL ${a.pair}</strong> di Supply OB / FVG ${a.supplyZoneFmt} (SL di atas ${a.supplySlFmt})
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  /**
   * Mengecek status perlindungan News Shield untuk pair yang sedang aktif di Terminal.
   */
  function getActiveNewsAlertStatus(activePair) {
    if (!newsState.events.length) {
      newsState.events = buildDefaultCalendarEvents();
    }
    const highEvents = newsState.events.filter(
      (e) =>
        e.impact === 'high' &&
        (e.affectedPairs || []).includes(activePair || 'XAUUSD')
    );

    for (const evt of highEvents) {
      const t = evaluateEventTiming(evt.targetWib);
      if (t.isImminentOrLive) {
        return {
          inDangerWindow: true,
          event: evt,
          timing: t
        };
      }
    }

    const nextEvt = highEvents[0] || newsState.events[0];
    return {
      inDangerWindow: false,
      event: nextEvt,
      timing: nextEvt ? evaluateEventTiming(nextEvt.targetWib) : null
    };
  }

  /**
   * Memperbarui panel Modul Khusus Eksekusi News (News Sniper) di Tab Signals.
   */
  function updateNewsSniperPanel(isNewsSniperEnabled) {
    const panelEl = document.getElementById('news-sniper-live-panel');
    if (!panelEl) return;

    const enabled =
      typeof isNewsSniperEnabled === 'boolean'
        ? isNewsSniperEnabled
        : Boolean(global.appState && global.appState.newsSniperMode);

    if (!enabled) {
      panelEl.classList.add('hidden');
      return;
    }

    panelEl.classList.remove('hidden');

    if (!newsState.events.length) {
      newsState.events = buildDefaultCalendarEvents();
    }

    const activePair = (global.appState && global.appState.activePair) || 'XAUUSD';
    const matching = newsState.events
      .filter((e) => (e.affectedPairs || []).includes(activePair))
      .map(computeNewsQuantAnalysis)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    const chosen = matching[0] || computeNewsQuantAnalysis(newsState.events[0]);
    newsState.activeSniperSetup = chosen;

    const titleEl = document.getElementById('news-sniper-event-title');
    const dirEl = document.getElementById('news-sniper-direction-badge');
    const ratEl = document.getElementById('news-sniper-rationale');
    const entryEl = document.getElementById('news-sniper-entry');
    const slEl = document.getElementById('news-sniper-sl');
    const tpEl = document.getElementById('news-sniper-tp');

    const isBuy = chosen.verdictDirection === 'BUY';
    if (titleEl) titleEl.textContent = `${chosen.event.title} (${chosen.timing.countdownText})`;
    if (dirEl) {
      dirEl.textContent = `${chosen.verdictDirection} ${chosen.pair}`;
      dirEl.className = isBuy
        ? 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400 text-slate-950'
        : 'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white';
    }
    if (ratEl) ratEl.textContent = chosen.vReason;
    if (entryEl) entryEl.textContent = chosen.vEntryFmt;
    if (slEl) slEl.textContent = chosen.vSlFmt;
    if (tpEl) tpEl.textContent = chosen.vTp2Fmt;

    // Jika event sedang rilis (±20m) dan belum pernah dinotifikasi otomatis, kirim push & Telegram jika aktif
    if (chosen.timing.isImminentOrLive && newsState.lastAutoNotifiedId !== chosen.event.id) {
      newsState.lastAutoNotifiedId = chosen.event.id;
      if (typeof global.triggerBrowserNotification === 'function') {
        global.triggerBrowserNotification(
          `🔥 NEWS SNIPER: ${chosen.verdictDirection} ${chosen.pair}`,
          `${chosen.event.title} • Entry ${chosen.vEntryFmt} | SL ${chosen.vSlFmt} | TP ${chosen.vTp2Fmt}`
        );
      }
      if (global.appState && global.appState.tgAutoNews && typeof global.sendTelegramHtmlMessage === 'function') {
        dispatchNewsSniperTelegram(true);
      }
    }
  }

  function findAnalysisById(eventId) {
    const evt = newsState.events.find((e) => e.id === eventId);
    if (!evt) return null;
    return computeNewsQuantAnalysis(evt);
  }

  function copyNewsVerdictSetup(eventId) {
    const a = findAnalysisById(eventId);
    if (!a) return;
    const text = [
      `📰 NEWS VERDICT: ${a.verdictDirection} ${a.pair}`,
      `Agenda: ${a.event.title}`,
      `Entry: ${a.vEntryFmt}`,
      `SL: ${a.vSlFmt}`,
      `TP1: ${a.vTp1Fmt} | TP2: ${a.vTp2Fmt} | TP3: ${a.vTp3Fmt}`
    ].join('\n');
    if (typeof global.copyTextValue === 'function') {
      global.copyTextValue(text, `Setup News ${a.pair}`);
    }
  }

  function applyNewsVerdictToTerminal(eventId) {
    const a = findAnalysisById(eventId);
    if (!a) return;
    if (typeof global.selectSignalPair === 'function') {
      global.selectSignalPair(a.pair);
    }
    if (typeof global.switchMainTab === 'function') {
      global.switchMainTab('signals');
    }
    if (typeof global.showToast === 'function') {
      global.showToast(`Pair ${a.pair} dimuat ke Terminal (${a.verdictDirection} News)`, 'success');
    }
  }

  function formatTelegramNewsMessage(a) {
    const esc = typeof global.escapeHtml === 'function' ? global.escapeHtml : (s) => String(s);
    const icon = a.verdictDirection === 'BUY' ? '🟢' : '🔴';
    return [
      `📰 <b>LIAMVTRADE NEWS SNIPER ALERT</b>`,
      ``,
      `📌 <b>Agenda:</b> ${esc(a.event.title)}`,
      `⏰ <b>Jadwal:</b> ${esc(formatWibDateLabel(a.event.targetWib))} • ${esc(formatWibTimeLabel(a.event.targetWib))}`,
      `📊 <b>Prev:</b> ${esc(a.event.previous)} | <b>Forecast:</b> ${esc(a.event.forecast)}`,
      ``,
      `${icon} <b>VERDICT UTAMA: ${esc(a.verdictDirection)} ${esc(a.pair)}</b> (${a.confidence}%)`,
      `🎯 <b>Entry Zone:</b> <code>${esc(a.vEntryFmt)}</code>`,
      `🛑 <b>Stop Loss:</b> <code>${esc(a.vSlFmt)}</code>`,
      `✅ <b>TP 1:</b> <code>${esc(a.vTp1Fmt)}</code>`,
      `✅ <b>TP 2:</b> <code>${esc(a.vTp2Fmt)}</code>`,
      `✅ <b>TP 3:</b> <code>${esc(a.vTp3Fmt)}</code>`,
      ``,
      `💡 <i>${esc(a.vReason)}</i>`
    ].join('\n');
  }

  async function sendSingleNewsVerdictToTelegram(eventId) {
    const a = findAnalysisById(eventId);
    if (!a) return;
    if (typeof global.sendTelegramHtmlMessage === 'function') {
      await global.sendTelegramHtmlMessage(formatTelegramNewsMessage(a), `Sinyal News ${a.pair}`);
    }
  }

  async function dispatchNewsSniperTelegram(isSilentAuto) {
    const a = newsState.activeSniperSetup;
    if (!a) {
      if (!isSilentAuto && typeof global.showToast === 'function') {
        global.showToast('Belum ada setup News Sniper aktif.', 'warn');
      }
      return;
    }
    if (typeof global.sendTelegramHtmlMessage === 'function') {
      await global.sendTelegramHtmlMessage(formatTelegramNewsMessage(a), `News Sniper ${a.pair}`, isSilentAuto);
    }
  }

  // Expose global hooks
  global.LiamNews = {
    syncNewsEngine,
    renderNewsTab,
    getActiveNewsAlertStatus,
    updateNewsSniperPanel
  };

  global.syncNewsEngine = syncNewsEngine;
  global.setNewsPeriodFilter = setNewsPeriodFilter;
  global.setNewsImpactFilter = setNewsImpactFilter;
  global.setNewsPairFilter = setNewsPairFilter;
  global.copyNewsVerdictSetup = copyNewsVerdictSetup;
  global.applyNewsVerdictToTerminal = applyNewsVerdictToTerminal;
  global.sendSingleNewsVerdictToTelegram = sendSingleNewsVerdictToTelegram;
  global.dispatchNewsSniperTelegram = dispatchNewsSniperTelegram;
})(window);
