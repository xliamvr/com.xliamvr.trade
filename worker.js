const DEFAULT_CONFIG = {
  enabled: true,
  pairs: ["XAUUSD", "NAS100", "EURUSD", "BTCUSD"],
  timeframes: ["M5", "M15", "H1"],
  methods: ["AUTO_SNIPER", "SMC_OB", "FVG", "LIQ_SWEEP"],
  minScore: 7.2,
  lot: 0.02
};

// Mapping simbol & ukuran 1 pip per instrumen
const PAIR_META = {
  XAUUSD: { source: "twelvedata", symbol: "XAU/USD", pip: 0.1, minSlPips: 20, spreadPips: 2.5, digits: 2 },
  EURUSD: { source: "twelvedata", symbol: "EUR/USD", pip: 0.0001, minSlPips: 10, spreadPips: 1.2, digits: 5 },
  NAS100: { source: "twelvedata", symbol: "NDX", pip: 1.0, minSlPips: 20, spreadPips: 2.0, digits: 2 },
  BTCUSD: { source: "binance", symbol: "BTCUSDT", pip: 10.0, minSlPips: 35, spreadPips: 5.0, digits: 2 }
};

const TF_MAP = {
  M5: { td: "5min", bn: "5m", intervalMin: 2 },
  M15: { td: "15min", bn: "15m", intervalMin: 6 },
  H1: { td: "1h", bn: "1h", intervalMin: 30 }
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export default {
  // 1. Endpoint HTTP untuk Remote Control dari Aplikasi Web & Tes Manual
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Ambil status sakelar terkini
    if (url.pathname === "/config" && request.method === "GET") {
      const cfg = await getConfig(env);
      return jsonResponse(cfg);
    }

    // Simpan perubahan sakelar dari UI aplikasi
    if (url.pathname === "/config" && request.method === "POST") {
      if (env.ADMIN_SECRET) {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }
      }
      const body = await request.json();
      const current = await getConfig(env);
      const updated = { ...current, ...body };
      await env.LIAM_KV.put("config", JSON.stringify(updated));
      return jsonResponse({ ok: true, config: updated });
    }

    // Trigger scan manual lewat browser (https://worker-kamu.workers.dev/scan)
    if (url.pathname === "/scan") {
      const logs = await runScanner(env, true);
      return jsonResponse({ ok: true, logs });
    }

    return jsonResponse({ status: "Liamvtrade Quant Cloud Engine Active" });
  },

  // 2. Cron Trigger Otomatis 24/7 (Set ke */2 * * * * di Cloudflare)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScanner(env, false));
  }
};

async function getConfig(env) {
  const raw = await env.LIAM_KV.get("config");
  return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
}

async function runScanner(env, forceAll = false) {
  const cfg = await getConfig(env);
  if (!cfg.enabled) return ["Scanner sedang OFF"];

  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;
  const wibDay = new Date(now.getTime() + 7 * 3600 * 1000).getUTCDay(); // 0 = Minggu, 6 = Sabtu
  const currentMinute = now.getUTCMinutes();
  const isWeekend = wibDay === 0 || wibDay === 6;
  const isLiquidHour = wibHour >= 12 || wibHour <= 3; // 12:00 - 03:59 WIB

  const logs = [];

  for (const pair of cfg.pairs) {
    const meta = PAIR_META[pair];
    if (!meta) continue;

    // Hemat kuota TwelveData saat weekend atau jam sepi subuh
    if (!forceAll && meta.source === "twelvedata" && (isWeekend || !isLiquidHour)) {
      logs.push(`Skip ${pair} (Market tutup / jam sepi)`);
      continue;
    }

    for (const tf of cfg.timeframes) {
      const tfInfo = TF_MAP[tf];
      if (!tfInfo) continue;

      // Tiered polling: M5 tiap 2m, M15 tiap 6m, H1 tiap 30m
      if (!forceAll && currentMinute % tfInfo.intervalMin !== 0) {
        continue;
      }

      try {
        const candles = await fetchCandles(meta, tfInfo, env);
        if (!candles || candles.length < 30) continue;

        // Jalankan semua metode aktif di memori yang sama (0 kuota tambahan)
        const signals = detectSetups(pair, tf, meta, candles, cfg);

        for (const sig of signals) {
          if (sig.score < cfg.minScore) continue;

          // Cek anti-duplikat di KV (kunci berdasarkan Pair + TF + Metode + Zona Entry)
          const dedupKey = `dedup:${pair}:${tf}:${sig.method}:${sig.entry}`;
          const alreadySent = await env.LIAM_KV.get(dedupKey);
          if (alreadySent) {
            logs.push(`Duplikat diabaikan: ${pair} ${tf} ${sig.method}`);
            continue;
          }

          await sendTelegram(env, sig, cfg.lot);
          // Simpan cache selama 4 jam (14400 detik) agar tidak spam sinyal yang sama
          await env.LIAM_KV.put(dedupKey, "1", { expirationTtl: 14400 });
          logs.push(`TERKIRIM: ${pair} ${tf} ${sig.method} @ ${sig.entry}`);
        }

        // Jeda 1.5 detik khusus TwelveData agar aman dari limit 8 req/menit
        if (meta.source === "twelvedata") {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (err) {
        logs.push(`Error ${pair} ${tf}: ${err.message}`);
      }
    }
  }

  return logs;
}

// Penarik data OHLC (Binance gratis 100%, TwelveData untuk emas/forex/indeks)
async function fetchCandles(meta, tfInfo, env) {
  if (meta.source === "binance") {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${meta.symbol}&interval=${tfInfo.bn}&limit=60`
    );
    const data = await res.json();
    return data.map((c) => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4])
    }));
  }

  const res = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${meta.symbol}&interval=${tfInfo.td}&outputsize=60&apikey=${env.TWELVEDATA_API_KEY}`
  );
  const data = await res.json();
  if (!data.values) return [];
  return data.values.reverse().map((c) => ({
    time: c.datetime,
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close)
  }));
}

// Mesin Deteksi Multi-Metode (Silakan sesuaikan rumus POI v2.9 milikmu di sini)
function detectSetups(pair, tf, meta, candles, cfg) {
  const results = [];
  const last = candles[candles.length - 1];
  const prev1 = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];
  const prev3 = candles[candles.length - 4];

  // Hitung ATR(14) untuk SL dinamis
  let trSum = 0;
  for (let i = candles.length - 14; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    trSum += Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
  }
  const atr = trSum / 14;
  const rawSlDist = atr * 1.05 + meta.spreadPips * meta.pip;
  const slDist = Math.max(rawSlDist, meta.minSlPips * meta.pip);

  const buildSignal = (direction, method, poiLow, poiHigh, entry, score) => {
    const isBuy = direction === "BUY LIMIT";
    const sl = isBuy ? entry - slDist : entry + slDist;
    const tp1 = isBuy ? entry + slDist * 1.3 : entry - slDist * 1.3;
    const tp2 = isBuy ? entry + slDist * 2.1 : entry - slDist * 2.1;
    const tp3 = isBuy ? entry + slDist * 3.0 : entry - slDist * 3.0;
    const slPips = (slDist / meta.pip).toFixed(1);

    return {
      pair,
      tf,
      direction,
      method,
      score,
      poiLow: poiLow.toFixed(meta.digits),
      poiHigh: poiHigh.toFixed(meta.digits),
      entry: entry.toFixed(meta.digits),
      sl: sl.toFixed(meta.digits),
      slPips,
      tp1: tp1.toFixed(meta.digits),
      tp1Pips: (slPips * 1.3).toFixed(1),
      tp2: tp2.toFixed(meta.digits),
      tp2Pips: (slPips * 2.1).toFixed(1),
      tp3: tp3.toFixed(meta.digits),
      tp3Pips: (slPips * 3.0).toFixed(1)
    };
  };

  // 1. Detektor SMC Order Block (SMC_OB)
  if (cfg.methods.includes("SMC_OB") || cfg.methods.includes("AUTO_SNIPER")) {
    const isBullOB = prev2.close < prev2.open && prev1.close > prev2.high && last.close > prev1.close;
    const isBearOB = prev2.close > prev2.open && prev1.close < prev2.low && last.close < prev1.close;

    if (isBullOB) {
      results.push(buildSignal("BUY LIMIT", "SMC_OB", prev2.low, prev2.high, prev2.high, 7.8));
    } else if (isBearOB) {
      results.push(buildSignal("SELL LIMIT", "SMC_OB", prev2.low, prev2.high, prev2.low, 7.8));
    }
  }

  // 2. Detektor Fair Value Gap (FVG)
  if (cfg.methods.includes("FVG") || cfg.methods.includes("AUTO_SNIPER")) {
    const bullFvg = prev1.low > prev3.high && (prev1.low - prev3.high) > atr * 0.4;
    const bearFvg = prev1.high < prev3.low && (prev3.low - prev1.high) > atr * 0.4;

    if (bullFvg) {
      results.push(buildSignal("BUY LIMIT", "FVG", prev3.high, prev1.low, prev1.low, 7.5));
    } else if (bearFvg) {
      results.push(buildSignal("SELL LIMIT", "FVG", prev1.high, prev3.low, prev1.high, 7.5));
    }
  }

  // 3. Detektor Liquidity Sweep (LIQ_SWEEP)
  if (cfg.methods.includes("LIQ_SWEEP") || cfg.methods.includes("AUTO_SNIPER")) {
    const sweepLow = prev1.low < prev2.low && prev1.close > prev2.low && last.close > prev1.high;
    const sweepHigh = prev1.high > prev2.high && prev1.close < prev2.high && last.close < prev1.low;

    if (sweepLow) {
      results.push(buildSignal("BUY LIMIT", "LIQ_SWEEP", prev1.low, prev2.low, prev2.low, 8.2));
    } else if (sweepHigh) {
      results.push(buildSignal("SELL LIMIT", "LIQ_SWEEP", prev2.high, prev1.high, prev2.high, 8.2));
    }
  }

  return results;
}

async function sendTelegram(env, s, lot) {
  const text = [
    `🎯 <b>XLIAMVR SNIPER SIGNAL</b>`,
    `📈 Pair: <b>${s.pair}</b> • Timeframe: <b>${s.tf}</b>`,
    `🧭 Arah: <b>${s.direction}</b> (${s.method}) • Score: <b>${s.score}/10</b>`,
    `📐 Zona POI: <code>${s.poiLow} - ${s.poiHigh}</code>`,
    `📍 Entry: <code>${s.entry}</code>`,
    `🛑 SL: <code>${s.sl}</code> (-${s.slPips} pips)`,
    `✅ TP1: <code>${s.tp1}</code> (+${s.tp1Pips})`,
    `✅ TP2: <code>${s.tp2}</code> (+${s.tp2Pips})`,
    `✅ TP3: <code>${s.tp3}</code> (+${s.tp3Pips})`,
    `⚖️ Rekomendasi Lot: <b>${lot}</b>`
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
