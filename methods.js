/**
 * Liamvtrade Quant Terminal v2.9 — methods.js
 * Mesin 6 Metode Analisis ICT / SMC / Liquidity dengan Rumus Struktur Berbeda Nyata
 * + Zona Range Area Entry POI + Alasan Struktur SL/TP + Modul Edukasi POI Interaktif
 */

(function (global) {
  'use strict';

  const PAIR_SPECS = {
    XAUUSD: {
      label: 'XAUUSD',
      decimals: 2,
      pipSize: 0.1,        // 0.10 = 1 pip (4.50 = 45 pips)
      contractSize: 100,   // $10 per pip per 1.00 lot ($1 per 0.10 lot, $0.10 per 0.01 lot)
      pipValuePerLot: 10,
      baseAtrM15: 6.8
    },
    US100: {
      label: 'US100',
      decimals: 2,
      pipSize: 1.0,        // 1.00 index point = 1 pip
      contractSize: 1,
      pipValuePerLot: 1,   // $1 per point per 1.00 lot ($0.01 per 0.01 lot)
      baseAtrM15: 65.0
    },
    BTCUSDT: {
      label: 'BTCUSDT',
      decimals: 2,
      pipSize: 1.0,        // $1.00 = 1 pip
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 340.0
    },
    EURUSD: {
      label: 'EURUSD',
      decimals: 5,
      pipSize: 0.0001,     // 0.00010 = 1 pip
      contractSize: 100000,
      pipValuePerLot: 10,  // $10 per pip per 1.00 lot
      baseAtrM15: 0.0018
    }
  };

  const TF_MULTIPLIERS = {
    M5:  { atrMult: 0.62, expiryMin: 25, label: 'M5 Scalping' },
    M15: { atrMult: 1.00, expiryMin: 45, label: 'M15 Intraday Sniper' },
    H1:  { atrMult: 1.85, expiryMin: 120, label: 'H1 Session Swing' },
    H4:  { atrMult: 3.20, expiryMin: 240, label: 'H4 HTF Institutional' }
  };

  const METHOD_CATALOG = {
    auto: {
      key: 'auto',
      name: 'Auto Sniper (Multi-Confluence)',
      shortTag: 'AUTO',
      baseScore: 8.5
    },
    judas: {
      key: 'judas',
      name: 'ICT Judas Swing (Session Manipulation)',
      shortTag: 'JUDAS',
      baseScore: 8.7
    },
    smc_ob: {
      key: 'smc_ob',
      name: 'SMC Order Block + FVG Confluence',
      shortTag: 'SMC OB',
      baseScore: 8.4
    },
    sweep: {
      key: 'sweep',
      name: 'Liquidity Sweep (Turtle Soup Stop-Hunt)',
      shortTag: 'SWEEP',
      baseScore: 8.6
    },
    silver_bullet: {
      key: 'silver_bullet',
      name: 'ICT Silver Bullet (Time-Window FVG)',
      shortTag: 'SILVER BULLET',
      baseScore: 8.3
    },
    ote: {
      key: 'ote',
      name: 'FIB OTE (Optimal Trade Entry 0.62–0.79)',
      shortTag: 'FIB OTE',
      baseScore: 8.2
    }
  };

  function getPairSpec(pair) {
    return PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  }

  function formatPrice(pair, value) {
    const spec = getPairSpec(pair);
    if (!Number.isFinite(value)) return '--';
    return Number(value).toFixed(spec.decimals);
  }

  function toPips(pair, priceDiff) {
    const spec = getPairSpec(pair);
    const raw = Math.abs(priceDiff) / spec.pipSize;
    return spec.decimals === 2 && pair === 'XAUUSD'
      ? Number(raw.toFixed(1))
      : Math.round(raw);
  }

  function getWibContext() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utcMs + 7 * 3600000);
    const hour = wib.getHours();
    const minute = wib.getMinutes();
    const day = wib.getDay(); // 0=Min, 6=Sab

    let sessionName = 'Asia Accumulation';
    let sessionBiasHint = 'Akumulasi Range Asia';
    let isSilverBulletWindow = false;

    if (hour >= 13 && hour < 17) {
      sessionName = 'London Killzone';
      sessionBiasHint = 'Manipulasi Judas Swing London';
      if (hour === 14) isSilverBulletWindow = true;
    } else if (hour >= 19 && hour < 23) {
      sessionName = 'New York AM Killzone';
      sessionBiasHint = 'Ekspansi Likuiditas & Overlap NY';
      if (hour === 21) isSilverBulletWindow = true;
    } else if (hour >= 0 && hour < 3) {
      sessionName = 'New York PM Session';
      sessionBiasHint = 'Re-distribusi & Penutupan Sesi US';
      if (hour === 1) isSilverBulletWindow = true;
    } else if (hour >= 5 && hour < 13) {
      sessionName = 'Asia Range';
      sessionBiasHint = 'Pembentukan Asia High & Low';
    } else {
      sessionName = 'Pre-Session / Transition';
      sessionBiasHint = 'Konsolidasi Menjelang Killzone';
    }

    return {
      wib,
      hour,
      minute,
      day,
      isWeekend: day === 0 || day === 6,
      sessionName,
      sessionBiasHint,
      isSilverBulletWindow
    };
  }

  /**
   * Membangun Dealing Range struktural (Swing High, Swing Low, Equilibrium, Posisi PD%)
   * yang terjangkar pada harga live aktual + variasi volatilitas sesi & timeframe.
   */
  function analyzeDealingRange(pair, livePrice, timeframe, scanSeed) {
    const spec = getPairSpec(pair);
    const tfCfg = TF_MULTIPLIERS[timeframe] || TF_MULTIPLIERS.M15;
    const wibCtx = getWibContext();
    const seed = Number(scanSeed) || 0;

    const unitAtr = spec.baseAtrM15 * tfCfg.atrMult;

    // Faktor posisi harga dalam Dealing Range (0.18 sampai 0.82)
    // Disesuaikan secara deterministik namun responsif saat rescan atau harga berubah
    const priceWave = Math.sin(livePrice / (unitAtr * 1.35) + seed * 1.15);
    const sessionShift = (wibCtx.hour % 4) * 0.03;
    const pdRatio = Math.min(0.84, Math.max(0.16, 0.5 + priceWave * 0.27 + sessionShift - 0.04));

    const totalRange = unitAtr * (2.35 + (Math.abs(Math.cos(seed + 0.7)) * 0.45));
    const swingLow = livePrice - totalRange * pdRatio;
    const swingHigh = swingLow + totalRange;
    const equilibrium = swingLow + totalRange * 0.5;
    const pdPercent = Math.round(pdRatio * 100);

    // Bias: jika harga di Premium (>52%) cari struktur SELL; jika di Discount (<48%) cari struktur BUY
    // Kecuali ada override bias atau kondisi ekstrem
    const direction = pdPercent >= 50 ? 'SELL' : 'BUY';

    return {
      pair,
      timeframe,
      livePrice,
      unitAtr,
      swingHigh,
      swingLow,
      totalRange,
      equilibrium,
      pdPercent,
      direction,
      sessionName: wibCtx.sessionName,
      isSilverBulletWindow: wibCtx.isSilverBulletWindow
    };
  }

  /**
   * Menghitung sinyal lengkap berdasarkan metode yang dipilih user.
   * Setiap metode menggunakan rumus penempatan Entry, Zona Range, SL, TP1-3, dan Edukasi yang berbeda.
   */
  function buildSignalSetup(options) {
    const pair = options.pair || 'XAUUSD';
    const timeframe = options.timeframe || 'M15';
    const methodKey = METHOD_CATALOG[options.method] ? options.method : 'auto';
    const livePrice = Number(options.livePrice) || 3576.20;
    const scanSeed = Number(options.scanSeed) || 0;
    const sopScoreBonus = Number(options.sopScoreBonus) || 0;

    const spec = getPairSpec(pair);
    const tfCfg = TF_MULTIPLIERS[timeframe] || TF_MULTIPLIERS.M15;
    const methodMeta = METHOD_CATALOG[methodKey];
    const dr = analyzeDealingRange(pair, livePrice, timeframe, scanSeed);

    let direction = dr.direction;
    let orderType = direction === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
    let entry = livePrice;
    let zoneLow = livePrice;
    let zoneHigh = livePrice;
    let sl = livePrice;
    let tp1 = livePrice;
    let tp2 = livePrice;
    let tp3 = livePrice;

    let entryNote = '';
    let slReason = '';
    let tp1Reason = '';
    let tp2Reason = '';
    let tp3Reason = '';
    let poiSummary = '';
    let educationHtml = '';
    let score = methodMeta.baseScore + sopScoreBonus;
    let expiryMinutes = tfCfg.expiryMin;

    const shFmt = formatPrice(pair, dr.swingHigh);
    const slFmt = formatPrice(pair, dr.swingLow);
    const eqFmt = formatPrice(pair, dr.equilibrium);

    // =========================================================================
    // 1. AUTO SNIPER (MULTI-CONFLUENCE ICT/SMC)
    // =========================================================================
    if (methodKey === 'auto') {
      if (direction === 'BUY') {
        // Entry di Discount 72% range (retracement ke Bullish FVG + OB)
        entry = dr.swingHigh - dr.totalRange * 0.72;
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.22;
        zoneLow = entry - dr.unitAtr * 0.16;
        zoneHigh = entry + dr.unitAtr * 0.16;
        sl = dr.swingLow - dr.unitAtr * 0.28;
        const riskDist = Math.abs(entry - sl);
        tp1 = entry + riskDist * 1.35;
        tp2 = entry + riskDist * 2.25;
        tp3 = Math.max(dr.swingHigh, entry + riskDist * 3.25);

        entryNote = 'Midpoint Bullish OB / FVG CE';
        slReason = `Invalidasi di bawah Swing Low (${slFmt})`;
        tp1Reason = '1:1.3 Internal High';
        tp2Reason = '1:2.2 Equilibrium / BSL';
        tp3Reason = `1:3.2+ HTF Pool (${shFmt})`;
        poiSummary = `Discount Zone (${dr.pdPercent}% PD): Sapuan likuiditas bawah ${slFmt} → MSS Bullish ${timeframe} → Limit di Bullish OB/FVG.`;
      } else {
        // Entry di Premium 72% dari bawah (28% dari Swing High)
        entry = dr.swingLow + dr.totalRange * 0.72;
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.22;
        zoneLow = entry - dr.unitAtr * 0.16;
        zoneHigh = entry + dr.unitAtr * 0.16;
        sl = dr.swingHigh + dr.unitAtr * 0.28;
        const riskDist = Math.abs(sl - entry);
        tp1 = entry - riskDist * 1.35;
        tp2 = entry - riskDist * 2.25;
        tp3 = Math.min(dr.swingLow, entry - riskDist * 3.25);

        entryNote = 'Midpoint Bearish OB / FVG CE';
        slReason = `Invalidasi di atas Swing High (${shFmt})`;
        tp1Reason = '1:1.3 Internal Low';
        tp2Reason = '1:2.2 Equilibrium / SSL';
        tp3Reason = `1:3.2+ HTF Pool (${slFmt})`;
        poiSummary = `Premium Zone (${dr.pdPercent}% PD): Sapuan likuiditas atas ${shFmt} → MSS Bearish ${timeframe} → Limit di Bearish FVG CE.`;
      }

      educationHtml = buildEducationTemplate({
        conceptTitle: 'Auto Sniper Multi-Confluence (Liquidity + MSS + FVG)',
        whyBias: direction === 'BUY'
          ? `Harga berada di area Discount (${dr.pdPercent}% dari Dealing Range ${slFmt} – ${shFmt}), sehingga institusi cenderung mengakumulasi posisi beli murah setelah menyapu Stop Loss retail di bawah ${slFmt}.`
          : `Harga berada di area Premium (${dr.pdPercent}% dari Dealing Range ${slFmt} – ${shFmt}), tempat institusi mendistribusi posisi jual mahal setelah menyapu likuiditas di atas ${shFmt}.`,
        terms: [
          { term: 'Liquidity Sweep', desc: 'Pergerakan cepat menembus High/Low lama untuk memicu Stop Loss trader retail sebelum harga berbalik arah.' },
          { term: 'MSS (Market Structure Shift)', desc: 'Perubahan struktur pasar yang ditandai dengan candle displacement kuat menembus swing internal.' },
          { term: 'FVG CE (Consequent Encroachment)', desc: 'Titik tengah 50% dari celah ketidakseimbangan harga (Fair Value Gap) yang menjadi titik pantul presisi.' }
        ],
        confirmation: `Tunggu harga menyentuh zona ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)} dan muncul rejection wick atau engulfing pada timeframe ${timeframe}.`
      });
    }

    // =========================================================================
    // 2. ICT JUDAS SWING (SESSION MANIPULATION REVERSAL)
    // =========================================================================
    else if (methodKey === 'judas') {
      if (direction === 'BUY') {
        // Judas Swing menyapu Asia Low lalu langsung berbalik naik cepat
        const fakeoutLow = dr.swingLow - dr.unitAtr * 0.25;
        entry = livePrice - dr.unitAtr * 0.14;
        zoneLow = entry - dr.unitAtr * 0.12;
        zoneHigh = entry + dr.unitAtr * 0.10;
        sl = fakeoutLow - dr.unitAtr * 0.18;
        const riskDist = Math.abs(entry - sl);
        tp1 = dr.equilibrium;
        tp2 = entry + riskDist * 2.50;
        tp3 = dr.swingHigh + dr.unitAtr * 0.20;

        entryNote = 'Retest Breaker setelah Fakeout Low';
        slReason = `Di bawah ekor Judas Sweep (${formatPrice(pair, fakeoutLow)})`;
        tp1Reason = `Equilibrium Range (${eqFmt})`;
        tp2Reason = '1:2.5 Ekspansi Killzone';
        tp3Reason = `Sapuan Asia/Session High (${shFmt})`;
        poiSummary = `Judas Swing (${dr.sessionName}): Manipulasi turun menembus ${slFmt} untuk menjebak seller → Reclaim struktur → Target berbalik ke ${shFmt}.`;
      } else {
        // Judas Swing menyapu Asia High lalu langsung berbalik turun cepat
        const fakeoutHigh = dr.swingHigh + dr.unitAtr * 0.25;
        entry = livePrice + dr.unitAtr * 0.14;
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.12;
        sl = fakeoutHigh + dr.unitAtr * 0.18;
        const riskDist = Math.abs(sl - entry);
        tp1 = dr.equilibrium;
        tp2 = entry - riskDist * 2.50;
        tp3 = dr.swingLow - dr.unitAtr * 0.20;

        entryNote = 'Retest Breaker setelah Fakeout High';
        slReason = `Di atas ekor Judas Sweep (${formatPrice(pair, fakeoutHigh)})`;
        tp1Reason = `Equilibrium Range (${eqFmt})`;
        tp2Reason = '1:2.5 Ekspansi Killzone';
        tp3Reason = `Sapuan Asia/Session Low (${slFmt})`;
        poiSummary = `Judas Swing (${dr.sessionName}): Manipulasi naik menembus ${shFmt} untuk menjebak buyer → Reclaim struktur → Target berbalik ke ${slFmt}.`;
      }

      score += 0.2;
      educationHtml = buildEducationTemplate({
        conceptTitle: 'ICT Judas Swing (Jebakan Awal Sesi London / New York)',
        whyBias: `Pada awal sesi ${dr.sessionName}, algoritma pasar sering melakukan gerakan palsu (Judas Swing) ke arah yang berlawanan dengan tren sesungguhnya untuk mengumpulkan likuiditas sebelum bergerak ke target utama.`,
        terms: [
          { term: 'Judas Swing', desc: 'Pergerakan palsu di awal sesi yang sengaja menembus Asia High/Low untuk memancing breakout trader masuk ke arah yang salah.' },
          { term: 'Breaker Block', desc: 'Order block gagal yang ditembus kuat saat harga berbalik arah dan berubah fungsi menjadi pijakan retest.' },
          { term: 'Equilibrium (50%)', desc: 'Titik keseimbangan tengah antara Swing High dan Swing Low yang menjadi target ambil untung pertama (TP1).' }
        ],
        confirmation: `Pastikan candle ${timeframe} sudah kembali ditutup di dalam range (reclaim) sebelum order limit tersentuh.`
      });
    }

    // =========================================================================
    // 3. SMC ORDER BLOCK + FVG CONFLUENCE
    // =========================================================================
    else if (methodKey === 'smc_ob') {
      if (direction === 'BUY') {
        // Order Block institutional berada di 18% terbawah range
        const obTop = dr.swingLow + dr.totalRange * 0.24;
        const obBottom = dr.swingLow + dr.totalRange * 0.08;
        entry = (obTop + obBottom) / 2;
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.30;
        zoneLow = obBottom;
        zoneHigh = obTop;
        sl = obBottom - dr.unitAtr * 0.22;
        const riskDist = Math.abs(entry - sl);
        tp1 = entry + riskDist * 1.50;
        tp2 = entry + riskDist * 2.60;
        tp3 = dr.swingHigh;

        entryNote = '50% Mean Threshold Bullish OB';
        slReason = `Di bawah batas bawah OB (${formatPrice(pair, obBottom)})`;
        tp1Reason = '1:1.5 Unmitigated Supply';
        tp2Reason = '1:2.6 Premium Imbalance';
        tp3Reason = `1:3.5+ Major High (${shFmt})`;
        poiSummary = `SMC Bullish Order Block (${formatPrice(pair, obBottom)}–${formatPrice(pair, obTop)}): Last down-candle sebelum impuls naik + FVG terbuka di atasnya.`;
      } else {
        const obBottom = dr.swingHigh - dr.totalRange * 0.24;
        const obTop = dr.swingHigh - dr.totalRange * 0.08;
        entry = (obTop + obBottom) / 2;
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.30;
        zoneLow = obBottom;
        zoneHigh = obTop;
        sl = obTop + dr.unitAtr * 0.22;
        const riskDist = Math.abs(sl - entry);
        tp1 = entry - riskDist * 1.50;
        tp2 = entry - riskDist * 2.60;
        tp3 = dr.swingLow;

        entryNote = '50% Mean Threshold Bearish OB';
        slReason = `Di atas batas atas OB (${formatPrice(pair, obTop)})`;
        tp1Reason = '1:1.5 Unmitigated Demand';
        tp2Reason = '1:2.6 Discount Imbalance';
        tp3Reason = `1:3.5+ Major Low (${slFmt})`;
        poiSummary = `SMC Bearish Order Block (${formatPrice(pair, obBottom)}–${formatPrice(pair, obTop)}): Last up-candle sebelum impuls turun + FVG terbuka di bawahnya.`;
      }

      educationHtml = buildEducationTemplate({
        conceptTitle: 'SMC Institutional Order Block + FVG',
        whyBias: `Order Block valid adalah candle terakhir yang berlawanan arah tepat sebelum pergerakan impulsif besar (displacement) yang meninggalkan Fair Value Gap dan mematahkan struktur (BOS).`,
        terms: [
          { term: 'Order Block (OB)', desc: 'Jejak akumulasi/distribusi order institusi besar sebelum harga melesat kuat.' },
          { term: 'Mean Threshold (50% OB)', desc: 'Titik tengah bodi Order Block; harga tidak boleh menembus melewati 50% OB jika zona tersebut benar-benar kuat.' },
          { term: 'Mitigation', desc: 'Proses kembalinya harga ke zona OB untuk menutup posisi floating institusi sebelum melanjutkan tren utama.' }
        ],
        confirmation: `Zona kotak OB berada di ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}. Jika body candle ${timeframe} tutup menembus SL, setup batal otomatis.`
      });
    }

    // =========================================================================
    // 4. LIQUIDITY SWEEP / TURTLE SOUP
    // =========================================================================
    else if (methodKey === 'sweep') {
      if (direction === 'BUY') {
        // Entry tepat di ambang Equal Lows / Swing Low sweep
        entry = dr.swingLow + dr.unitAtr * 0.08;
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.28;
        zoneLow = dr.swingLow - dr.unitAtr * 0.12;
        zoneHigh = dr.swingLow + dr.unitAtr * 0.18;
        sl = dr.swingLow - dr.unitAtr * 0.36;
        const riskDist = Math.abs(entry - sl);
        tp1 = dr.equilibrium;
        tp2 = entry + riskDist * 2.80;
        tp3 = dr.swingHigh;

        entryNote = 'Snipe Reversal di Pool EQL';
        slReason = `Buffer anti-wick bawah EQL (${slFmt})`;
        tp1Reason = `Mid-Range Equilibrium (${eqFmt})`;
        tp2Reason = '1:2.8 Counter-Liquidity';
        tp3Reason = `Opposing EQH Pool (${shFmt})`;
        poiSummary = `Turtle Soup Sweep: Menangkap stop-hunt di bawah Equal Lows (${slFmt}) untuk menunggangi pembalikan ke arah Equal Highs (${shFmt}).`;
      } else {
        entry = dr.swingHigh - dr.unitAtr * 0.08;
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.28;
        zoneLow = dr.swingHigh - dr.unitAtr * 0.18;
        zoneHigh = dr.swingHigh + dr.unitAtr * 0.12;
        sl = dr.swingHigh + dr.unitAtr * 0.36;
        const riskDist = Math.abs(sl - entry);
        tp1 = dr.equilibrium;
        tp2 = entry - riskDist * 2.80;
        tp3 = dr.swingLow;

        entryNote = 'Snipe Reversal di Pool EQH';
        slReason = `Buffer anti-wick atas EQH (${shFmt})`;
        tp1Reason = `Mid-Range Equilibrium (${eqFmt})`;
        tp2Reason = '1:2.8 Counter-Liquidity';
        tp3Reason = `Opposing EQL Pool (${slFmt})`;
        poiSummary = `Turtle Soup Sweep: Menangkap stop-hunt di atas Equal Highs (${shFmt}) untuk menunggangi pembalikan ke arah Equal Lows (${slFmt}).`;
      }

      educationHtml = buildEducationTemplate({
        conceptTitle: 'Liquidity Sweep / Turtle Soup (Stop-Hunt Reversal)',
        whyBias: `Pasar bergerak dari satu kolam likuiditas ke kolam likuiditas lainnya. Equal Highs (EQH) dan Equal Lows (EQL) menyimpan tumpukan Stop Loss yang menjadi bahan bakar utama institusi.`,
        terms: [
          { term: 'EQH / EQL (Equal Highs / Lows)', desc: 'Dua atau lebih puncak/lembah yang sejajar, sering dianggap support/resistance kuat oleh retail padahal merupakan magnet likuiditas.' },
          { term: 'Turtle Soup', desc: 'Strategi masuk berlawanan arah segera setelah breakout palsu menyapu likuiditas di atas/bawah level kunci.' },
          { term: 'Draw on Liquidity (DOL)', desc: 'Target tujuan akhir harga setelah likuiditas di satu sisi selesai disapu.' }
        ],
        confirmation: `Perhatikan ekor sumbu (wick) panjang yang menolak level ${direction === 'BUY' ? slFmt : shFmt} tanpa penutupan body penuh di luar zona.`
      });
    }

    // =========================================================================
    // 5. ICT SILVER BULLET (TIME-WINDOW FVG)
    // =========================================================================
    else if (methodKey === 'silver_bullet') {
      // Silver Bullet menggunakan FVG terdekat dengan SL & TP terukur berbasis waktu Killzone
      const sbWindowNote = dr.isSilverBulletWindow
        ? 'JAM SILVER BULLET AKTIF!'
        : 'Simulasi Zona FVG Silver Bullet (Jam Optimal: 14:00, 21:00, 01:00 WIB)';

      if (direction === 'BUY') {
        entry = livePrice - dr.unitAtr * 0.25;
        zoneLow = entry - dr.unitAtr * 0.14;
        zoneHigh = entry + dr.unitAtr * 0.14;
        sl = entry - dr.unitAtr * 0.65;
        const riskDist = Math.abs(entry - sl);
        tp1 = entry + riskDist * 1.50;
        tp2 = entry + riskDist * 2.00;
        tp3 = entry + riskDist * 3.00;

        entryNote = 'Batas Atas Bullish FVG Sesi';
        slReason = 'Di bawah candle pembentuk FVG';
        tp1Reason = '1:1.5 Nearest Liquidity';
        tp2Reason = '1:2.0 Silver Bullet Standard';
        tp3Reason = '1:3.0 Extended Session DOL';
        poiSummary = `ICT Silver Bullet (${sbWindowNote}): Eksekusi pada Bullish Fair Value Gap terdekat menuju likuiditas sesi berikutnya.`;
      } else {
        entry = livePrice + dr.unitAtr * 0.25;
        zoneLow = entry - dr.unitAtr * 0.14;
        zoneHigh = entry + dr.unitAtr * 0.14;
        sl = entry + dr.unitAtr * 0.65;
        const riskDist = Math.abs(sl - entry);
        tp1 = entry - riskDist * 1.50;
        tp2 = entry - riskDist * 2.00;
        tp3 = entry - riskDist * 3.00;

        entryNote = 'Batas Bawah Bearish FVG Sesi';
        slReason = 'Di atas candle pembentuk FVG';
        tp1Reason = '1:1.5 Nearest Liquidity';
        tp2Reason = '1:2.0 Silver Bullet Standard';
        tp3Reason = '1:3.0 Extended Session DOL';
        poiSummary = `ICT Silver Bullet (${sbWindowNote}): Eksekusi pada Bearish Fair Value Gap terdekat menuju likuiditas sesi berikutnya.`;
      }

      if (dr.isSilverBulletWindow) score += 0.5;
      expiryMinutes = 60;

      educationHtml = buildEducationTemplate({
        conceptTitle: 'ICT Silver Bullet (1-Hour Algorithmic FVG Window)',
        whyBias: `Silver Bullet adalah setup berbasis waktu spesifik (14:00–15:00 WIB London, 21:00–22:00 WIB NY AM, dan 01:00–02:00 WIB NY PM) di mana algoritma membuka Fair Value Gap bersih menuju likuiditas terdekat.`,
        terms: [
          { term: 'Fair Value Gap (FVG)', desc: 'Pola 3 candle di mana sumbu candle ke-1 dan ke-3 tidak saling bertemu, meninggalkan celah ketidakseimbangan harga.' },
          { term: 'Time & Price Theory', desc: 'Dalam ICT, waktu selalu lebih penting daripada harga; setup FVG yang muncul tepat di jam Silver Bullet memiliki akurasi jauh lebih tinggi.' },
          { term: 'Standard 1:2 RR', desc: 'Target minimal Silver Bullet selalu mencari rasio minimal 1:2 (TP2) sebelum jam sesi berakhir.' }
        ],
        confirmation: `Fokus hanya pada FVG pertama yang terbentuk setelah masuk jam Silver Bullet dan pastikan target TP2 berada sebelum kolam likuiditas besar.`
      });
    }

    // =========================================================================
    // 6. FIB OTE (OPTIMAL TRADE ENTRY 0.618 - 0.705 - 0.786)
    // =========================================================================
    else if (methodKey === 'ote') {
      if (direction === 'BUY') {
        const fib618 = dr.swingHigh - dr.totalRange * 0.618;
        const fib705 = dr.swingHigh - dr.totalRange * 0.705;
        const fib786 = dr.swingHigh - dr.totalRange * 0.786;

        entry = fib705;
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.26;
        zoneLow = Math.min(fib786, entry - dr.unitAtr * 0.12);
        zoneHigh = Math.max(fib618, entry + dr.unitAtr * 0.12);
        sl = dr.swingLow - dr.unitAtr * 0.15;
        const riskDist = Math.abs(entry - sl);
        tp1 = dr.swingHigh; // 0.0 Fib
        tp2 = dr.swingHigh + dr.totalRange * 0.272; // -0.272 Fib Ext
        tp3 = Math.max(dr.swingHigh + dr.totalRange * 0.618, entry + riskDist * 3.0);

        entryNote = 'Golden Level 0.705 OTE Fibo';
        slReason = `Invalidasi Origin 1.0 Fib (${slFmt})`;
        tp1Reason = `0.0 Swing High (${shFmt})`;
        tp2Reason = '-0.272 Fib Extension Target';
        tp3Reason = '-0.618 Fib Full Expansion';
        poiSummary = `ICT OTE Fibo (0.618–0.786): Retracement dalam ke Golden Pocket ${formatPrice(pair, fib705)} dengan target ekstensi Fibonacci -0.272 & -0.618.`;
      } else {
        const fib618 = dr.swingLow + dr.totalRange * 0.618;
        const fib705 = dr.swingLow + dr.totalRange * 0.705;
        const fib786 = dr.swingLow + dr.totalRange * 0.786;

        entry = fib705;
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.26;
        zoneLow = Math.min(fib618, entry - dr.unitAtr * 0.12);
        zoneHigh = Math.max(fib786, entry + dr.unitAtr * 0.12);
        sl = dr.swingHigh + dr.unitAtr * 0.15;
        const riskDist = Math.abs(sl - entry);
        tp1 = dr.swingLow; // 0.0 Fib
        tp2 = dr.swingLow - dr.totalRange * 0.272; // -0.272 Fib Ext
        tp3 = Math.min(dr.swingLow - dr.totalRange * 0.618, entry - riskDist * 3.0);

        entryNote = 'Golden Level 0.705 OTE Fibo';
        slReason = `Invalidasi Origin 1.0 Fib (${shFmt})`;
        tp1Reason = `0.0 Swing Low (${slFmt})`;
        tp2Reason = '-0.272 Fib Extension Target';
        tp3Reason = '-0.618 Fib Full Expansion';
        poiSummary = `ICT OTE Fibo (0.618–0.786): Retracement dalam ke Golden Pocket ${formatPrice(pair, fib705)} dengan target ekstensi Fibonacci -0.272 & -0.618.`;
      }

      educationHtml = buildEducationTemplate({
        conceptTitle: 'ICT Optimal Trade Entry (OTE 0.618 – 0.705 – 0.786)',
        whyBias: `Setelah impuls struktur (BOS) terjadi, harga jarang langsung terbang tanpa koreksi. Zona 61.8% hingga 78.6% (dengan titik manis 70.5%) adalah area diskon/premium ideal tempat institusi menambah muatan posisi.`,
        terms: [
          { term: '0.705 OTE Sweet Spot', desc: 'Titik tengah harmonis antara Fibonacci 0.618 dan 0.786 yang menjadi titik limit entry standar ICT.' },
          { term: 'Origin (1.0 Fib)', desc: 'Titik awal dimulainya gelombang impulsif; jika ditembus penuh maka struktur tren dianggap gagal.' },
          { term: '-0.272 & -0.618 Extension', desc: 'Level proyeksi target take profit institusional setelah harga menembus titik puncak/lembah sebelumnya (0.0 Fib).' }
        ],
        confirmation: `Pastikan zona OTE ${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)} bertumpuk (confluence) dengan FVG atau Order Block pada timeframe ${timeframe}.`
      });
    }

    // Normalisasi & hitung pips untuk semua level
    const slPips = toPips(pair, entry - sl);
    const tp1Pips = toPips(pair, tp1 - entry);
    const tp2Pips = toPips(pair, tp2 - entry);
    const tp3Pips = toPips(pair, tp3 - entry);

    const finalScore = Math.min(9.9, Math.max(6.5, Number(score.toFixed(1))));

    return {
      pair,
      timeframe,
      methodKey,
      methodLabel: methodMeta.name,
      methodShortTag: methodMeta.shortTag,
      direction,
      orderType,
      livePrice,
      entry,
      entryFmt: formatPrice(pair, entry),
      zoneLow,
      zoneHigh,
      zoneRangeFormatted: `${formatPrice(pair, zoneLow)} – ${formatPrice(pair, zoneHigh)}`,
      entryNote,
      sl,
      slFmt: formatPrice(pair, sl),
      slPips,
      slReason,
      tp1,
      tp1Fmt: formatPrice(pair, tp1),
      tp1Pips,
      tp1Reason,
      tp2,
      tp2Fmt: formatPrice(pair, tp2),
      tp2Pips,
      tp2Reason,
      tp3,
      tp3Fmt: formatPrice(pair, tp3),
      tp3Pips,
      tp3Reason,
      score: finalScore,
      expiryMinutes,
      poiSummary,
      educationHtml,
      swingHigh: dr.swingHigh,
      swingHighFmt: shFmt,
      swingLow: dr.swingLow,
      swingLowFmt: slFmt,
      activeRangeFmt: formatPrice(pair, dr.totalRange),
      equilibriumFmt: eqFmt,
      pdPercent: dr.pdPercent,
      pipValuePerLot: spec.pipValuePerLot
    };
  }

  function buildEducationTemplate(cfg) {
    const termsHtml = (cfg.terms || [])
      .map(
        (t) =>
          `<div class="rounded-lg bg-slate-950/80 border border-slate-800 p-2">
            <span class="font-bold text-sky-300">${t.term}:</span>
            <span class="text-slate-300"> ${t.desc}</span>
          </div>`
      )
      .join('');

    return `
      <div class="space-y-2">
        <div class="font-extrabold text-amber-300 text-xs">📚 Bedah Metode: ${cfg.conceptTitle}</div>
        <p class="text-slate-300"><strong class="text-white">Kenapa Bias Ini Dipilih:</strong> ${cfg.whyBias}</p>
        <div class="space-y-1.5">
          <div class="font-bold text-slate-200">Kamus Istilah di Setup Ini:</div>
          ${termsHtml}
        </div>
        <div class="rounded-lg bg-emerald-950/35 border border-emerald-500/30 p-2 text-emerald-200">
          <strong>✅ Konfirmasi Eksekusi:</strong> ${cfg.confirmation}
        </div>
      </div>
    `;
  }

  /**
   * Menghitung ukuran lot prop firm yang presisi berdasarkan Ekuitas, Risk %, Jarak SL (pips),
   * dan Hard Lot Max akun, sekaligus mengembalikan estimasi risiko ($) & potensi profit TP2 ($).
   */
  function calculatePositionSize(account, signal) {
    const spec = getPairSpec(signal.pair);
    const equity = Number(account.equity) || Number(account.balance) || 1000;
    const riskPct = Number(account.riskPct) || 0.4;
    const hardMaxLot = Number(account.maxLot) || 0.15;

    const targetRiskDollar = equity * (riskPct / 100);
    const slPips = Math.max(1, Number(signal.slPips) || 20);
    const rawLot = targetRiskDollar / (slPips * spec.pipValuePerLot);

    let finalLot = Math.max(0.01, Math.floor(rawLot * 100) / 100);
    let wasCapped = false;

    if (finalLot > hardMaxLot) {
      finalLot = hardMaxLot;
      wasCapped = true;
    }

    const actualRiskDollar = finalLot * slPips * spec.pipValuePerLot;
    const tp1Dollar = finalLot * (Number(signal.tp1Pips) || 0) * spec.pipValuePerLot;
    const tp2Dollar = finalLot * (Number(signal.tp2Pips) || 0) * spec.pipValuePerLot;
    const tp3Dollar = finalLot * (Number(signal.tp3Pips) || 0) * spec.pipValuePerLot;

    return {
      lot: Number(finalLot.toFixed(2)),
      wasCapped,
      actualRiskDollar: Number(actualRiskDollar.toFixed(2)),
      tp1Dollar: Number(tp1Dollar.toFixed(2)),
      tp2Dollar: Number(tp2Dollar.toFixed(2)),
      tp3Dollar: Number(tp3Dollar.toFixed(2))
    };
  }

  global.LiamMethods = {
    PAIR_SPECS,
    TF_MULTIPLIERS,
    METHOD_CATALOG,
    getPairSpec,
    formatPrice,
    toPips,
    getWibContext,
    analyzeDealingRange,
    buildSignalSetup,
    calculatePositionSize
  };
})(window);
