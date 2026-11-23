/**
 * Liamvtrade Quant Terminal v2.9 — methods.js
 * Mesin 6 Metode Analisis ICT / SMC / Liquidity dengan Kalibrasi Skala per Timeframe & Pair
 * + Zona Range Area Entry POI + Alasan Struktur SL/TP + Modul Edukasi POI Interaktif
 */

(function (global) {
  'use strict';

  const PAIR_SPECS = {
    XAUUSD: {
      label: 'XAUUSD',
      decimals: 2,
      pipSize: 0.1,        // 0.10 = 1 pip (3.50 = 35 pips)
      contractSize: 100,   // $10 per pip per 1.00 lot ($0.10 per pip per 0.01 lot)
      pipValuePerLot: 10,
      baseAtrM15: 3.4      // Dikalibrasi agar M5 ~22-35 pips & M15 ~35-55 pips
    },
    US100: {
      label: 'US100',
      decimals: 2,
      pipSize: 1.0,        // 1.00 index point = 1 pip
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 36.0
    },
    BTCUSDT: {
      label: 'BTCUSDT',
      decimals: 2,
      pipSize: 1.0,        // $1.00 = 1 pip
      contractSize: 1,
      pipValuePerLot: 1,
      baseAtrM15: 190.0
    },
    EURUSD: {
      label: 'EURUSD',
      decimals: 5,
      pipSize: 0.0001,     // 0.00010 = 1 pip
      contractSize: 100000,
      pipValuePerLot: 10,
      baseAtrM15: 0.0014
    }
  };

  // Skala lebih proporsional agar M5 tidak melebar seperti H1
  const TF_MULTIPLIERS = {
    M5:  { atrMult: 0.52, rangeMult: 1.55, expiryMin: 20, label: 'M5 Scalping' },
    M15: { atrMult: 0.85, rangeMult: 1.85, expiryMin: 40, label: 'M15 Intraday Sniper' },
    H1:  { atrMult: 1.55, rangeMult: 2.20, expiryMin: 120, label: 'H1 Session Swing' },
    H4:  { atrMult: 2.65, rangeMult: 2.55, expiryMin: 240, label: 'H4 HTF Institutional' }
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
    const day = wib.getDay();

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
   * yang terjangkar pada harga live aktual + volatilitas sesi & timeframe.
   */
  function analyzeDealingRange(pair, livePrice, timeframe, scanSeed) {
    const spec = getPairSpec(pair);
    const tfCfg = TF_MULTIPLIERS[timeframe] || TF_MULTIPLIERS.M15;
    const wibCtx = getWibContext();
    const seed = Number(scanSeed) || 0;

    const unitAtr = Math.max(spec.pipSize * 5, spec.baseAtrM15 * tfCfg.atrMult);

    const priceWave = Math.sin(livePrice / Math.max(spec.pipSize * 20, unitAtr * 1.4) + seed * 1.15);
    const sessionShift = ((wibCtx.hour % 4) - 1.5) * 0.025;
    const pdRatio = Math.min(0.82, Math.max(0.18, 0.5 + priceWave * 0.24 + sessionShift));

    const rangeSpreadFactor = tfCfg.rangeMult + (Math.abs(Math.cos(seed + 0.7)) * 0.25);
    const totalRange = unitAtr * rangeSpreadFactor;
    const swingLow = livePrice - totalRange * pdRatio;
    const swingHigh = swingLow + totalRange;
    const equilibrium = swingLow + totalRange * 0.5;
    const pdPercent = Math.round(pdRatio * 100);

    const direction = pdPercent >= 50 ? 'SELL' : 'BUY';

    const shFmt = formatPrice(pair, swingHigh);
    const slFmt = formatPrice(pair, swingLow);
    const eqFmt = formatPrice(pair, equilibrium);

    return {
      pair,
      timeframe,
      livePrice,
      unitAtr,
      swingHigh,
      swingHighFmt: shFmt,
      swingLow,
      swingLowFmt: slFmt,
      totalRange,
      equilibrium,
      equilibriumFmt: eqFmt,
      pdPercent,
      direction,
      sessionName: wibCtx.sessionName,
      isSilverBulletWindow: wibCtx.isSilverBulletWindow
    };
  }

  /**
   * Menghitung sinyal lengkap berdasarkan metode yang dipilih user.
   */
  function buildSignalSetup(options) {
    const pair = options.pair || 'XAUUSD';
    const timeframe = options.timeframe || 'M15';
    const methodKey = METHOD_CATALOG[options.method] ? options.method : 'auto';
    const livePrice = Number(options.livePrice) || 2645.50;
    const scanSeed = Number(options.scanSeed) || 0;
    const sopScoreBonus = Number(options.sopScoreBonus) || 0;

    const spec = getPairSpec(pair);
    const tfCfg = TF_MULTIPLIERS[timeframe] || TF_MULTIPLIERS.M15;
    const methodMeta = METHOD_CATALOG[methodKey];
    const dr = analyzeDealingRange(pair, livePrice, timeframe, scanSeed);

    const direction = dr.direction;
    const orderType = direction === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
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

    const shFmt = dr.swingHighFmt;
    const slFmt = dr.swingLowFmt;
    const eqFmt = dr.equilibriumFmt;

    // 1. AUTO SNIPER (MULTI-CONFLUENCE ICT/SMC)
    if (methodKey === 'auto') {
      if (direction === 'BUY') {
        entry = Math.min(livePrice - dr.unitAtr * 0.16, dr.swingLow + dr.totalRange * 0.34);
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.12;
        zoneHigh = entry + dr.unitAtr * 0.12;
        sl = Math.max(dr.swingLow - dr.unitAtr * 0.16, entry - dr.unitAtr * 0.72);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.25;
        tp2 = entry + riskDist * 2.00;
        tp3 = entry + riskDist * 2.85;

        entryNote = 'Midpoint Bullish OB / FVG CE';
        slReason = `Invalidasi di bawah Swing Low (${slFmt})`;
        tp1Reason = '1:1.25 Internal High';
        tp2Reason = '1:2.0 Equilibrium / BSL';
        tp3Reason = `1:2.85 HTF Pool (${shFmt})`;
        poiSummary = `Discount Zone (${dr.pdPercent}% PD): Sapuan likuiditas bawah ${slFmt} → MSS Bullish ${timeframe} → Limit di Bullish OB/FVG.`;
      } else {
        entry = Math.max(livePrice + dr.unitAtr * 0.16, dr.swingHigh - dr.totalRange * 0.34);
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.12;
        zoneHigh = entry + dr.unitAtr * 0.12;
        sl = Math.min(dr.swingHigh + dr.unitAtr * 0.16, entry + dr.unitAtr * 0.72);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.25;
        tp2 = entry - riskDist * 2.00;
        tp3 = entry - riskDist * 2.85;

        entryNote = 'Midpoint Bearish OB / FVG CE';
        slReason = `Invalidasi di atas Swing High (${shFmt})`;
        tp1Reason = '1:1.25 Internal Low';
        tp2Reason = '1:2.0 Equilibrium / SSL';
        tp3Reason = `1:2.85 HTF Pool (${slFmt})`;
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

    // 2. ICT JUDAS SWING (SESSION MANIPULATION REVERSAL)
    else if (methodKey === 'judas') {
      if (direction === 'BUY') {
        const fakeoutLow = dr.swingLow - dr.unitAtr * 0.14;
        entry = livePrice - dr.unitAtr * 0.12;
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.08;
        sl = Math.max(fakeoutLow - dr.unitAtr * 0.12, entry - dr.unitAtr * 0.68);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.25;
        tp2 = entry + riskDist * 2.10;
        tp3 = entry + riskDist * 2.90;

        entryNote = 'Retest Breaker setelah Fakeout Low';
        slReason = `Di bawah ekor Judas Sweep (${formatPrice(pair, fakeoutLow)})`;
        tp1Reason = `1:1.25 Menuju Equilibrium (${eqFmt})`;
        tp2Reason = '1:2.1 Ekspansi Killzone';
        tp3Reason = `1:2.9 Sapuan Session High (${shFmt})`;
        poiSummary = `Judas Swing (${dr.sessionName}): Manipulasi turun menembus ${slFmt} untuk menjebak seller → Reclaim struktur → Target berbalik ke ${shFmt}.`;
      } else {
        const fakeoutHigh = dr.swingHigh + dr.unitAtr * 0.14;
        entry = livePrice + dr.unitAtr * 0.12;
        zoneLow = entry - dr.unitAtr * 0.08;
        zoneHigh = entry + dr.unitAtr * 0.10;
        sl = Math.min(fakeoutHigh + dr.unitAtr * 0.12, entry + dr.unitAtr * 0.68);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.25;
        tp2 = entry - riskDist * 2.10;
        tp3 = entry - riskDist * 2.90;

        entryNote = 'Retest Breaker setelah Fakeout High';
        slReason = `Di atas ekor Judas Sweep (${formatPrice(pair, fakeoutHigh)})`;
        tp1Reason = `1:1.25 Menuju Equilibrium (${eqFmt})`;
        tp2Reason = '1:2.1 Ekspansi Killzone';
        tp3Reason = `1:2.9 Sapuan Session Low (${slFmt})`;
        poiSummary = `Judas Swing (${dr.sessionName}): Manipulasi naik menembus ${shFmt} untuk menjebak buyer → Reclaim struktur → Target berbalik ke ${slFmt}.`;
      }

      score += 0.2;
      educationHtml = buildEducationTemplate({
        conceptTitle: 'ICT Judas Swing (Jebakan Awal Sesi London / New York)',
        whyBias: `Pada awal sesi ${dr.sessionName}, algoritma pasar sering melakukan gerakan palsu (Judas Swing) ke arah yang berlawanan dengan tren sesungguhnya untuk mengumpulkan likuiditas sebelum bergerak ke target utama.`,
        terms: [
          { term: 'Judas Swing', desc: 'Pergerakan palsu di awal sesi yang sengaja menembus Asia High/Low untuk memancing breakout trader masuk ke arah yang salah.' },
          { term: 'Breaker Block', desc: 'Order block gagal yang ditembus kuat saat harga berbalik arah dan berubah fungsi menjadi pijakan retest.' },
          { term: 'Equilibrium (50%)', desc: 'Titik keseimbangan tengah antara Swing High dan Swing Low yang menjadi acuan arah pembalikan.' }
        ],
        confirmation: `Pastikan candle ${timeframe} sudah kembali ditutup di dalam range (reclaim) sebelum order limit tersentuh.`
      });
    }

    // 3. SMC ORDER BLOCK + FVG CONFLUENCE
    else if (methodKey === 'smc_ob') {
      if (direction === 'BUY') {
        const obTop = dr.swingLow + dr.totalRange * 0.28;
        const obBottom = dr.swingLow + dr.totalRange * 0.14;
        entry = Math.min(livePrice - dr.unitAtr * 0.18, (obTop + obBottom) / 2);
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.20;
        zoneLow = Math.min(obBottom, entry - dr.unitAtr * 0.10);
        zoneHigh = Math.max(obTop, entry + dr.unitAtr * 0.10);
        sl = Math.max(obBottom - dr.unitAtr * 0.14, entry - dr.unitAtr * 0.70);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.30;
        tp2 = entry + riskDist * 2.20;
        tp3 = entry + riskDist * 3.00;

        entryNote = '50% Mean Threshold Bullish OB';
        slReason = `Di bawah batas bawah OB (${formatPrice(pair, zoneLow)})`;
        tp1Reason = '1:1.3 Unmitigated Supply';
        tp2Reason = '1:2.2 Premium Imbalance';
        tp3Reason = `1:3.0 Major High (${shFmt})`;
        poiSummary = `SMC Bullish Order Block (${formatPrice(pair, zoneLow)}–${formatPrice(pair, zoneHigh)}): Last down-candle sebelum impuls naik + FVG terbuka di atasnya.`;
      } else {
        const obBottom = dr.swingHigh - dr.totalRange * 0.28;
        const obTop = dr.swingHigh - dr.totalRange * 0.14;
        entry = Math.max(livePrice + dr.unitAtr * 0.18, (obTop + obBottom) / 2);
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.20;
        zoneLow = Math.min(obBottom, entry - dr.unitAtr * 0.10);
        zoneHigh = Math.max(obTop, entry + dr.unitAtr * 0.10);
        sl = Math.min(obTop + dr.unitAtr * 0.14, entry + dr.unitAtr * 0.70);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.30;
        tp2 = entry - riskDist * 2.20;
        tp3 = entry - riskDist * 3.00;

        entryNote = '50% Mean Threshold Bearish OB';
        slReason = `Di atas batas atas OB (${formatPrice(pair, zoneHigh)})`;
        tp1Reason = '1:1.3 Unmitigated Demand';
        tp2Reason = '1:2.2 Discount Imbalance';
        tp3Reason = `1:3.0 Major Low (${slFmt})`;
        poiSummary = `SMC Bearish Order Block (${formatPrice(pair, zoneLow)}–${formatPrice(pair, zoneHigh)}): Last up-candle sebelum impuls turun + FVG terbuka di bawahnya.`;
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

    // 4. LIQUIDITY SWEEP / TURTLE SOUP
    else if (methodKey === 'sweep') {
      if (direction === 'BUY') {
        entry = Math.min(livePrice - dr.unitAtr * 0.16, dr.swingLow + dr.unitAtr * 0.12);
        if (entry >= livePrice) entry = livePrice - dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.11;
        zoneHigh = entry + dr.unitAtr * 0.11;
        sl = Math.max(dr.swingLow - dr.unitAtr * 0.18, entry - dr.unitAtr * 0.65);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.40;
        tp2 = entry + riskDist * 2.30;
        tp3 = entry + riskDist * 3.10;

        entryNote = 'Snipe Reversal di Pool EQL';
        slReason = `Buffer anti-wick bawah EQL (${slFmt})`;
        tp1Reason = `1:1.4 Mid-Range (${eqFmt})`;
        tp2Reason = '1:2.3 Counter-Liquidity';
        tp3Reason = `1:3.1 Opposing EQH (${shFmt})`;
        poiSummary = `Turtle Soup Sweep: Menangkap stop-hunt di bawah Equal Lows (${slFmt}) untuk menunggangi pembalikan ke arah Equal Highs (${shFmt}).`;
      } else {
        entry = Math.max(livePrice + dr.unitAtr * 0.16, dr.swingHigh - dr.unitAtr * 0.12);
        if (entry <= livePrice) entry = livePrice + dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.11;
        zoneHigh = entry + dr.unitAtr * 0.11;
        sl = Math.min(dr.swingHigh + dr.unitAtr * 0.18, entry + dr.unitAtr * 0.65);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.40;
        tp2 = entry - riskDist * 2.30;
        tp3 = entry - riskDist * 3.10;

        entryNote = 'Snipe Reversal di Pool EQH';
        slReason = `Buffer anti-wick atas EQH (${shFmt})`;
        tp1Reason = `1:1.4 Mid-Range (${eqFmt})`;
        tp2Reason = '1:2.3 Counter-Liquidity';
        tp3Reason = `1:3.1 Opposing EQL (${slFmt})`;
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

    // 5. ICT SILVER BULLET (TIME-WINDOW FVG)
    else if (methodKey === 'silver_bullet') {
      const sbWindowNote = dr.isSilverBulletWindow
        ? 'JAM SILVER BULLET AKTIF!'
        : 'Simulasi Zona FVG Silver Bullet (Jam Optimal: 14:00, 21:00, 01:00 WIB)';

      if (direction === 'BUY') {
        entry = livePrice - dr.unitAtr * 0.16;
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.10;
        sl = entry - dr.unitAtr * 0.55;
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.35;
        tp2 = entry + riskDist * 2.00;
        tp3 = entry + riskDist * 2.80;

        entryNote = 'Batas Atas Bullish FVG Sesi';
        slReason = 'Di bawah candle pembentuk FVG';
        tp1Reason = '1:1.35 Nearest Liquidity';
        tp2Reason = '1:2.0 Silver Bullet Standard';
        tp3Reason = '1:2.8 Extended Session DOL';
        poiSummary = `ICT Silver Bullet (${sbWindowNote}): Eksekusi pada Bullish Fair Value Gap terdekat menuju likuiditas sesi berikutnya.`;
      } else {
        entry = livePrice + dr.unitAtr * 0.16;
        zoneLow = entry - dr.unitAtr * 0.10;
        zoneHigh = entry + dr.unitAtr * 0.10;
        sl = entry + dr.unitAtr * 0.55;
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.35;
        tp2 = entry - riskDist * 2.00;
        tp3 = entry - riskDist * 2.80;

        entryNote = 'Batas Bawah Bearish FVG Sesi';
        slReason = 'Di atas candle pembentuk FVG';
        tp1Reason = '1:1.35 Nearest Liquidity';
        tp2Reason = '1:2.0 Silver Bullet Standard';
        tp3Reason = '1:2.8 Extended Session DOL';
        poiSummary = `ICT Silver Bullet (${sbWindowNote}): Eksekusi pada Bearish Fair Value Gap terdekat menuju likuiditas sesi berikutnya.`;
      }

      if (dr.isSilverBulletWindow) score += 0.5;
      expiryMinutes = Math.min(60, tfCfg.expiryMin + 15);

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

    // 6. FIB OTE (OPTIMAL TRADE ENTRY 0.618 - 0.705 - 0.786)
    else if (methodKey === 'ote') {
      if (direction === 'BUY') {
        entry = livePrice - dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.11;
        zoneHigh = entry + dr.unitAtr * 0.11;
        sl = Math.max(dr.swingLow - dr.unitAtr * 0.12, entry - dr.unitAtr * 0.64);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(entry - sl));
        tp1 = entry + riskDist * 1.40;
        tp2 = entry + riskDist * 2.25;
        tp3 = entry + riskDist * 3.00;

        entryNote = 'Golden Level 0.705 OTE Fibo';
        slReason = `Invalidasi Origin 1.0 Fib (${slFmt})`;
        tp1Reason = `1:1.4 Menuju High (${shFmt})`;
        tp2Reason = '1:2.25 Fib Extension Target';
        tp3Reason = '1:3.0 Fib Full Expansion';
        poiSummary = `ICT OTE Fibo (0.618–0.786): Retracement ke Golden Pocket di sekitar ${formatPrice(pair, entry)} dengan target ekstensi Fibonacci bertahap.`;
      } else {
        entry = livePrice + dr.unitAtr * 0.18;
        zoneLow = entry - dr.unitAtr * 0.11;
        zoneHigh = entry + dr.unitAtr * 0.11;
        sl = Math.min(dr.swingHigh + dr.unitAtr * 0.12, entry + dr.unitAtr * 0.64);
        const riskDist = Math.max(spec.pipSize * 4, Math.abs(sl - entry));
        tp1 = entry - riskDist * 1.40;
        tp2 = entry - riskDist * 2.25;
        tp3 = entry - riskDist * 3.00;

        entryNote = 'Golden Level 0.705 OTE Fibo';
        slReason = `Invalidasi Origin 1.0 Fib (${shFmt})`;
        tp1Reason = `1:1.4 Menuju Low (${slFmt})`;
        tp2Reason = '1:2.25 Fib Extension Target';
        tp3Reason = '1:3.0 Fib Full Expansion';
        poiSummary = `ICT OTE Fibo (0.618–0.786): Retracement ke Golden Pocket di sekitar ${formatPrice(pair, entry)} dengan target ekstensi Fibonacci bertahap.`;
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

  function calculatePositionSize(account, signal) {
    const spec = getPairSpec(signal.pair);
    const equity = Number(account.equity) || Number(account.balance) || 1000;
    const riskPct = Number(account.riskPct) || 0.4;
    const hardMaxLot = Number(account.maxLot) || 0.15;

    const targetRiskDollar = equity * (riskPct / 100);
    const slPips = Math.max(1, Number(signal.slPips) || 20);
    const rawLot = targetRiskDollar / (slPips * spec.pipValuePerLot);

    let finalLot = Math.floor(rawLot * 100) / 100;
    let wasCapped = false;
    let isMinFloorApplied = false;

    if (finalLot < 0.01) {
      finalLot = 0.01;
      isMinFloorApplied = true;
    }

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
      isMinFloorApplied,
      targetRiskDollar: Number(targetRiskDollar.toFixed(2)),
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
