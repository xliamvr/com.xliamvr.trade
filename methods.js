const DEFAULT_CONFIG = {
  enabled: true,
  pairs: ["XAUUSD", "US100", "EURUSD", "BTCUSDT"],
  timeframes: ["M5", "M15", "H1", "H4"],
  methods: ["auto"],
  minScore: 4,
  lot: 0.02
};

const PAIR_SPECS = {
  XAUUSD: {
    source: "twelvedata",
    apiSymbol: "XAU/USD",
    label: "XAUUSD",
    decimals: 2,
    pipSize: 0.1,
    pipValuePerLot: 10,
    baseAtrM15: 3.2,
    defaultSpreadPips: 2.5
  },
  US100: {
    source: "twelvedata",
    apiSymbol: "NDX",
    label: "US100",
    decimals: 2,
    pipSize: 1.0,
    pipValuePerLot: 1,
    baseAtrM15: 34.0,
    defaultSpreadPips: 2.0
  },
  BTCUSDT: {
    source: "binance",
    apiSymbol: "BTCUSDT",
    label: "BTCUSDT",
    decimals: 2,
    pipSize: 1.0,
    pipValuePerLot: 1,
    baseAtrM15: 180.0,
    defaultSpreadPips: 15.0
  },
  EURUSD: {
    source: "twelvedata",
    apiSymbol: "EUR/USD",
    label: "EURUSD",
    decimals: 5,
    pipSize: 0.0001,
    pipValuePerLot: 10,
    baseAtrM15: 0.0014,
    defaultSpreadPips: 1.0
  }
};

const TF_MAP = {
  M5:  { td: "5min",  bn: "5m",  intervalMin: 2,  atrMult: 0.45, expiryMin: 25,  candleMs: 5 * 60 * 1000,   label: "M5 Scalping" },
  M15: { td: "15min", bn: "15m", intervalMin: 6,  atrMult: 0.80, expiryMin: 60,  candleMs: 15 * 60 * 1000,  label: "M15 Intraday" },
  H1:  { td: "1h",    bn: "1h",  intervalMin: 30, atrMult: 1.55, expiryMin: 180, candleMs: 60 * 60 * 1000,  label: "H1 Session Swing" },
  H4:  { td: "4h",    bn: "4h",  intervalMin: 60, atrMult: 2.75, expiryMin: 360, candleMs: 240 * 60 * 1000, label: "H4 HTF Swing" }
};

const METHOD_CATALOG = {
  auto:          { key: "auto",          name: "Auto Sniper (Multi-Confluence + Pola N)", shortTag: "AUTO" },
  n_pattern:     { key: "n_pattern",     name: "Pola N (Impulse-Pullback-Break)",        shortTag: "POLA N" },
  sweep:         { key: "sweep",         name: "Liquidity Sweep + MSS",                  shortTag: "SWEEP" },
  judas:         { key: "judas",         name: "ICT Judas Swing (Asia Range)",           shortTag: "JUDAS" },
  smc_ob:        { key: "smc_ob",        name: "SMC Order Block + FVG Confluence",       shortTag: "SMC OB" },
  silver_bullet: { key: "silver_bullet", name: "ICT Silver Bullet (Time-Window FVG)",    shortTag: "SILVER BULLET" },
  ote:           { key: "ote",           name: "FIB OTE (0.62–0.79 / Entry 0.705)",      shortTag: "FIB OTE" }
};

const MIN_RR_TP1 = 1.5;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/config" && request.method === "GET") {
      const cfg = await getConfig(env);
      return jsonResponse(cfg);
    }

    if (url.pathname === "/config" && request.method === "POST") {
      if (env.ADMIN_SECRET) {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }
      }
      const body = await request.json();
      const current = await getConfig(env);
      const updated = normalizeConfig({ ...current, ...body });
      await env.LIAM_KV.put("config", JSON.stringify(updated));
      return jsonResponse({ ok: true, config: updated });
    }

    if (url.pathname === "/status" && request.method === "GET") {
      const cfg = await getConfig(env);
      const lastScan = await env.LIAM_KV.get("last_scan", "json");
      return jsonResponse({ ok: true, enabled: cfg.enabled, config: cfg, lastScan });
    }

    if (url.pathname === "/scan") {
      const logs = await runScanner(env, true);
      return jsonResponse({ ok: true, logs });
    }

    return jsonResponse({ status: "Liamvtrade Quant Cloud Engine Active (v4.1 ICT/SMC)" });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScanner(env, false));
  }
};

function normalizePair(pair) {
  const clean = String(pair || "XAUUSD").trim().toUpperCase();
  if (clean === "BTC" || clean === "BTCUSD" || clean === "BTCUSDT") return "BTCUSDT";
  if (clean === "NDX" || clean === "NASDAQ" || clean === "NAS100" || clean === "US100") return "US100";
  if (clean === "GOLD" || clean === "XAU" || clean === "XAUUSD") return "XAUUSD";
  if (clean === "EUR" || clean === "EURUSD") return "EURUSD";
  return PAIR_SPECS[clean] ? clean : null;
}

function normalizeMethodKey(m) {
  const clean = String(m || "").trim().toLowerCase();
  if (clean === "auto" || clean === "auto_sniper" || clean === "all_method") return "auto";
  if (clean === "n_pattern" || clean === "pola_n" || clean === "npattern") return "n_pattern";
  if (clean === "sweep" || clean === "liq_sweep") return "sweep";
  if (clean === "judas" || clean === "judas_swing") return "judas";
  if (clean === "smc_ob" || clean === "fvg" || clean === "ob") return "smc_ob";
  if (clean === "silver_bullet" || clean === "sb") return "silver_bullet";
  if (clean === "ote" || clean === "fib_ote") return "ote";
  return METHOD_CATALOG[clean] ? clean : null;
}

function normalizeConfig(rawCfg) {
  const merged = { ...DEFAULT_CONFIG, ...(rawCfg || {}) };
  const pairs = Array.isArray(merged.pairs)
    ? Array.from(new Set(merged.pairs.map(normalizePair).filter(Boolean)))
    : DEFAULT_CONFIG.pairs;
  const timeframes = Array.isArray(merged.timeframes)
    ? Array.from(new Set(merged.timeframes.map((t) => String(t).toUpperCase()).filter((t) => TF_MAP[t])))
    : DEFAULT_CONFIG.timeframes;
  const methods = Array.isArray(merged.methods)
    ? Array.from(new Set(merged.methods.map(normalizeMethodKey).filter(Boolean)))
    : DEFAULT_CONFIG.methods;

  return {
    enabled: Boolean(merged.enabled),
    pairs: pairs.length ? pairs : [],
    timeframes: timeframes.length ? timeframes : [],
    methods: methods.length ? methods : ["auto"],
    minScore: Number.isFinite(Number(merged.minScore)) ? Number(merged.minScore) : 4,
    lot: Number.isFinite(Number(merged.lot)) && Number(merged.lot) > 0 ? Number(merged.lot) : 0.02
  };
}

async function getConfig(env) {
  const raw = await env.LIAM_KV.get("config");
  return normalizeConfig(raw ? JSON.parse(raw) : DEFAULT_CONFIG);
}

async function runScanner(env, forceAll = false) {
  const cfg = await getConfig(env);
  if (!cfg.enabled) return ["Scanner sedang OFF"];
  if (cfg.pairs.length === 0 || cfg.timeframes.length === 0 || cfg.methods.length === 0) {
    return ["Tidak ada Pair / TF / Method yang diaktifkan"];
  }

  const nowMs = Date.now();
  const now = new Date(nowMs);
  const wibHour = (now.getUTCHours() + 7) % 24;
  const nyCtx = getNySessionContext(nowMs);
  const currentMinute = now.getUTCMinutes();
  const isLiquidHour = wibHour >= 12 || wibHour <= 3;

  const logs = [];

  for (const pair of cfg.pairs) {
    const spec = PAIR_SPECS[pair];
    if (!spec) continue;

    if (spec.source === "twelvedata" && (nyCtx.isWeekend || (!forceAll && !isLiquidHour))) {
      logs.push(`Skip ${pair} (${nyCtx.isWeekend ? "Market weekend tutup" : "Jam sepi subuh"})`);
      continue;
    }

    // Ambil H1 sebagai HTF bias referensi jika tersedia
    let h1Candles = [];
    try {
      h1Candles = await fetchCandles(spec, TF_MAP.H1, env, 80);
      if (spec.source === "twelvedata") await sleep(1200);
    } catch (_) {}

    for (const tf of cfg.timeframes) {
      const tfInfo = TF_MAP[tf];
      if (!tfInfo) continue;

      if (!forceAll && currentMinute % tfInfo.intervalMin !== 0) {
        continue;
      }

      try {
        const candles = tf === "H1" && h1Candles.length >= 30
          ? h1Candles
          : await fetchCandles(spec, tfInfo, env, 100);

        if (!candles || candles.length < 20) {
          logs.push(`Skip ${pair} ${tf}: Data candle kurang (${candles ? candles.length : 0})`);
          continue;
        }

        const signals = evaluateConfiguredMethods(pair, tf, candles, h1Candles, cfg, nowMs);

        if (signals.length === 0) {
          logs.push(`${pair} ${tf}: NO_TRADE (Belum ada setup ICT/SMC valid)`);
        }

        for (const sig of signals) {
          if (sig.score < cfg.minScore) continue;

          const dedupKey = `dedup:${pair}:${tf}:${sig.selectedMethodKey}:${sig.entryFmt}`;
          const alreadySent = await env.LIAM_KV.get(dedupKey);
          if (alreadySent) {
            logs.push(`Duplikat diabaikan: ${pair} ${tf} ${sig.selectedMethodKey}`);
            continue;
          }

          await sendTelegram(env, sig, cfg.lot);
          await env.LIAM_KV.put(dedupKey, "1", { expirationTtl: 14400 });
          logs.push(`TERKIRIM: ${pair} ${tf} ${sig.direction} (${sig.selectedMethodKey.toUpperCase()}) @ ${sig.entryFmt} | RR 1:${sig.rrTp1}`);
        }

        if (spec.source === "twelvedata") {
          await sleep(1500);
        }
      } catch (err) {
        logs.push(`Error ${pair} ${tf}: ${err.message}`);
      }
    }
  }

  await env.LIAM_KV.put(
    "last_scan",
    JSON.stringify({ time: now.toISOString(), summary: logs.slice(0, 12) }),
    { expirationTtl: 86400 }
  );

  return logs;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCandles(spec, tfInfo, env, limit = 100) {
  if (spec.source === "binance") {
    const res = await fetch(
      `https://data-api.binance.vision/api/v3/klines?symbol=${spec.apiSymbol}&interval=${tfInfo.bn}&limit=${limit}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Liamvtrade-Quant-Worker/4.1"
        }
      }
    );
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(data.msg || "Respons Binance tidak valid");
    return normalizeCandleArray(data);
  }

  const res = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${spec.apiSymbol}&interval=${tfInfo.td}&outputsize=${limit}&timezone=UTC&apikey=${env.TWELVEDATA_API_KEY}`
  );
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message || "TwelveData API error");
  if (!Array.isArray(data.values)) return [];

  const formatted = data.values.slice().reverse().map((c) => {
    const parsedTs = Date.parse(String(c.datetime || "").replace(" ", "T") + "Z");
    return {
      ts: Number.isFinite(parsedTs) ? parsedTs : Date.now(),
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close)
    };
  });
  return normalizeCandleArray(formatted);
}

// ============================================================================
// PORTING MESIN ANALISIS v4.1-ohlc-npattern DARI methods.js
// ============================================================================

function formatPrice(pair, value) {
  const spec = PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  if (!Number.isFinite(Number(value))) return "--";
  return Number(value).toFixed(spec.decimals);
}

function toPips(pair, priceDiff) {
  const spec = PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  const raw = Math.abs(Number(priceDiff) || 0) / spec.pipSize;
  return spec.decimals === 2 && pair === "XAUUSD"
    ? Number(raw.toFixed(1))
    : Math.round(raw);
}

function formatIsoTime(ts) {
  if (!Number.isFinite(Number(ts)) || Number(ts) <= 0) return "N/A";
  return new Date(Number(ts)).toISOString();
}

function getNyParts(refTimeMs) {
  const ms = Number.isFinite(refTimeMs) ? refTimeMs : Date.now();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(ms));

  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    nyHour: Number(map.hour) || 0,
    nyMinute: Number(map.minute) || 0,
    nyWeekday: map.weekday || "Mon"
  };
}

function getNySessionContext(refTimeMs) {
  const p = getNyParts(refTimeMs);
  const { nyHour, nyMinute, nyWeekday, dateKey } = p;

  const isWeekend =
    nyWeekday === "Sat" ||
    nyWeekday === "Sun" ||
    (nyWeekday === "Fri" && nyHour >= 17);

  let sessionName = "Off-Session / NY Close";
  const isLondonJudasWindow = nyHour >= 2 && nyHour < 5;
  const isNyOpenJudasWindow = nyHour >= 7 && nyHour < 9;
  const isJudasWindow = isLondonJudasWindow || isNyOpenJudasWindow;

  const silverBulletWindow =
    nyHour === 3 ? "03:00–04:00 NY" :
    nyHour === 10 ? "10:00–11:00 NY" :
    nyHour === 14 ? "14:00–15:00 NY" :
    null;

  if (isLondonJudasWindow) sessionName = "London Killzone";
  else if (nyHour >= 7 && nyHour < 11) sessionName = "New York AM Killzone";
  else if (nyHour >= 13 && nyHour < 16) sessionName = "New York PM Session";
  else if (nyHour >= 19 || nyHour < 2) sessionName = "Asia Range";

  return {
    dateKey,
    nyHour,
    nyMinute,
    nyWeekday,
    isWeekend,
    sessionName,
    isJudasWindow,
    isSilverBulletWindow: Boolean(silverBulletWindow),
    silverBulletWindow
  };
}

function normalizeCandleArray(rawCandles) {
  if (!Array.isArray(rawCandles)) return [];
  const list = [];
  for (let i = 0; i < rawCandles.length; i += 1) {
    const c = rawCandles[i];
    if (!c) continue;
    let open, high, low, close, ts;
    if (Array.isArray(c)) {
      ts = Number(c[0]);
      open = Number(c[1]);
      high = Number(c[2]);
      low = Number(c[3]);
      close = Number(c[4]);
    } else {
      ts = Number(c.ts || c.time || 0);
      if (ts > 0 && ts < 1e12) ts *= 1000;
      open = Number(c.open);
      high = Number(c.high);
      low = Number(c.low);
      close = Number(c.close);
    }
    if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) continue;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
    const realHigh = Math.max(open, high, low, close);
    const realLow = Math.min(open, high, low, close);
    list.push({
      index: list.length,
      ts: Number.isFinite(ts) && ts > 0 ? ts : (i + 1) * 60000,
      open,
      high: realHigh,
      low: realLow,
      close,
      body: Math.abs(close - open),
      range: Math.max(1e-9, realHigh - realLow),
      isBull: close >= open,
      isBear: close < open
    });
  }
  list.sort((a, b) => a.ts - b.ts);
  for (let i = 0; i < list.length; i += 1) list[i].index = i;
  return list;
}

function calculateAtrSeries(candles, period = 14) {
  const trList = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  const atrSeries = new Array(candles.length).fill(0);
  let sum = 0;
  for (let i = 0; i < trList.length; i += 1) {
    sum += trList[i];
    atrSeries[i] = i < period ? sum / (i + 1) : (atrSeries[i - 1] * (period - 1) + trList[i]) / period;
  }
  return atrSeries;
}

function detectFractalSwings(candles, leftBars = 3, rightBars = 3) {
  const swingHighs = [];
  const swingLows = [];
  if (candles.length < leftBars + rightBars + 1) return { swingHighs, swingLows };

  for (let i = leftBars; i < candles.length - rightBars; i += 1) {
    const curr = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let k = i - leftBars; k <= i + rightBars; k += 1) {
      if (k === i) continue;
      if (candles[k].high >= curr.high) isHigh = false;
      if (candles[k].low <= curr.low) isLow = false;
    }
    if (isHigh) swingHighs.push({ index: i, ts: curr.ts, price: curr.high });
    if (isLow) swingLows.push({ index: i, ts: curr.ts, price: curr.low });
  }
  return { swingHighs, swingLows };
}

function isDisplacementCandle(candles, idx, atrSeries) {
  const c = candles[idx];
  if (!c) return { valid: false, direction: null };
  const atr = Math.max(1e-9, atrSeries[idx] || c.range);
  if (c.body >= 1.5 * atr) {
    return { valid: true, direction: c.isBull ? "BUY" : "SELL" };
  }
  if (idx >= 2) {
    const c0 = candles[idx - 2];
    const c1 = candles[idx - 1];
    const allBull = c0.isBull && c1.isBull && c.isBull;
    const allBear = c0.isBear && c1.isBear && c.isBear;
    if ((allBull || allBear) && Math.abs(c.close - c0.open) >= atr * 0.8) {
      return { valid: true, direction: allBull ? "BUY" : "SELL" };
    }
  }
  return { valid: false, direction: null };
}

function detectFVGs(candles, atrSeries, minAtrRatio = 0.3) {
  const fvgs = [];
  for (let i = 2; i < candles.length; i += 1) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    const atr = Math.max(1e-9, atrSeries[i] || c3.range);
    const minGap = minAtrRatio * atr;

    if (c3.low > c1.high && c3.low - c1.high >= minGap) {
      const gapSize = c3.low - c1.high;
      let mitigated = false;
      for (let j = i + 1; j < candles.length; j += 1) {
        if (candles[j].low <= c1.high + gapSize * 0.25) { mitigated = true; break; }
      }
      fvgs.push({ direction: "BUY", top: c3.low, bottom: c1.high, ce: (c3.low + c1.high) / 2, createdIndex: i, ts: c3.ts, mitigated });
    }

    if (c3.high < c1.low && c1.low - c3.high >= minGap) {
      const gapSize = c1.low - c3.high;
      let mitigated = false;
      for (let j = i + 1; j < candles.length; j += 1) {
        if (candles[j].high >= c3.high - gapSize * 0.25) { mitigated = true; break; }
      }
      fvgs.push({ direction: "SELL", top: c1.low, bottom: c3.high, ce: (c1.low + c3.high) / 2, createdIndex: i, ts: c3.ts, mitigated });
    }
  }
  return fvgs;
}

function detectOrderBlocks(candles, atrSeries, fvgs) {
  const obs = [];
  for (let i = 1; i < candles.length; i += 1) {
    const disp = isDisplacementCandle(candles, i, atrSeries);
    if (!disp.valid) continue;

    if (disp.direction === "BUY") {
      let obCandle = null;
      for (let k = i - 1; k >= Math.max(0, i - 6); k -= 1) {
        if (candles[k].isBear) { obCandle = candles[k]; break; }
      }
      if (!obCandle) continue;
      const matchingFvg = fvgs.find((f) => f.direction === "BUY" && f.createdIndex >= i - 1 && f.createdIndex <= i + 2 && f.bottom <= obCandle.high && f.top >= obCandle.low);
      let mitigated = false;
      for (let j = i + 1; j < candles.length; j += 1) {
        if (candles[j].close < obCandle.low) { mitigated = true; break; }
      }
      obs.push({ direction: "BUY", top: obCandle.high, bottom: obCandle.low, mid50: (obCandle.high + obCandle.low) / 2, displacementIndex: i, ts: obCandle.ts, hasFvgOverlap: Boolean(matchingFvg), fvg: matchingFvg || null, mitigated });
    } else {
      let obCandle = null;
      for (let k = i - 1; k >= Math.max(0, i - 6); k -= 1) {
        if (candles[k].isBull) { obCandle = candles[k]; break; }
      }
      if (!obCandle) continue;
      const matchingFvg = fvgs.find((f) => f.direction === "SELL" && f.createdIndex >= i - 1 && f.createdIndex <= i + 2 && f.top >= obCandle.low && f.bottom <= obCandle.high);
      let mitigated = false;
      for (let j = i + 1; j < candles.length; j += 1) {
        if (candles[j].close > obCandle.high) { mitigated = true; break; }
      }
      obs.push({ direction: "SELL", top: obCandle.high, bottom: obCandle.low, mid50: (obCandle.high + obCandle.low) / 2, displacementIndex: i, ts: obCandle.ts, hasFvgOverlap: Boolean(matchingFvg), fvg: matchingFvg || null, mitigated });
    }
  }
  return obs;
}

function detectStructureShifts(candles, swings) {
  const events = [];
  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const prev = candles[i - 1];
    const lastHigh = swings.swingHighs.filter((h) => h.index < i).pop();
    if (lastHigh && c.close > lastHigh.price && prev.close <= lastHigh.price) {
      events.push({ type: "BOS_BULL", direction: "BUY", level: lastHigh.price, index: i, ts: c.ts });
    }
    const lastLow = swings.swingLows.filter((l) => l.index < i).pop();
    if (lastLow && c.close < lastLow.price && prev.close >= lastLow.price) {
      events.push({ type: "BOS_BEAR", direction: "SELL", level: lastLow.price, index: i, ts: c.ts });
    }
  }
  return events;
}

function extractLiquidityLevels(candles, swings, pair) {
  const spec = PAIR_SPECS[pair] || PAIR_SPECS.XAUUSD;
  const eqTol = Math.max(spec.pipSize * 1.5, ((candles[candles.length - 1] && candles[candles.length - 1].range) || spec.pipSize * 5) * 0.08);
  const levels = [];

  for (const sh of swings.swingHighs) levels.push({ kind: "SWING_HIGH", side: "HIGH", price: sh.price, index: sh.index, ts: sh.ts, label: `Swing High ${formatPrice(pair, sh.price)}` });
  for (const sl of swings.swingLows) levels.push({ kind: "SWING_LOW", side: "LOW", price: sl.price, index: sl.index, ts: sl.ts, label: `Swing Low ${formatPrice(pair, sl.price)}` });

  for (let i = 0; i < swings.swingHighs.length; i += 1) {
    for (let j = i + 1; j < swings.swingHighs.length; j += 1) {
      if (Math.abs(swings.swingHighs[i].price - swings.swingHighs[j].price) <= eqTol) {
        const avg = (swings.swingHighs[i].price + swings.swingHighs[j].price) / 2;
        levels.push({ kind: "EQH", side: "HIGH", price: avg, index: swings.swingHighs[j].index, ts: swings.swingHighs[j].ts, label: `Equal Highs ${formatPrice(pair, avg)}` });
      }
    }
  }
  for (let i = 0; i < swings.swingLows.length; i += 1) {
    for (let j = i + 1; j < swings.swingLows.length; j += 1) {
      if (Math.abs(swings.swingLows[i].price - swings.swingLows[j].price) <= eqTol) {
        const avg = (swings.swingLows[i].price + swings.swingLows[j].price) / 2;
        levels.push({ kind: "EQL", side: "LOW", price: avg, index: swings.swingLows[j].index, ts: swings.swingLows[j].ts, label: `Equal Lows ${formatPrice(pair, avg)}` });
      }
    }
  }

  const byDate = new Map();
  const asiaByDate = new Map();
  for (const c of candles) {
    const ny = getNyParts(c.ts);
    if (!byDate.has(ny.dateKey)) byDate.set(ny.dateKey, { high: c.high, low: c.low, ts: c.ts });
    else {
      const d = byDate.get(ny.dateKey);
      if (c.high > d.high) d.high = c.high;
      if (c.low < d.low) d.low = c.low;
    }
    if (ny.nyHour >= 19) {
      if (!asiaByDate.has(ny.dateKey)) asiaByDate.set(ny.dateKey, { high: c.high, low: c.low, ts: c.ts, endTs: c.ts });
      else {
        const a = asiaByDate.get(ny.dateKey);
        if (c.high > a.high) a.high = c.high;
        if (c.low < a.low) a.low = c.low;
        a.endTs = c.ts;
      }
    }
  }

  const dateKeys = Array.from(byDate.keys()).sort();
  if (dateKeys.length >= 2) {
    const prevDay = byDate.get(dateKeys[dateKeys.length - 2]);
    levels.push({ kind: "PDH", side: "HIGH", price: prevDay.high, index: candles.length - 1, ts: prevDay.ts, label: `PDH ${formatPrice(pair, prevDay.high)}` });
    levels.push({ kind: "PDL", side: "LOW", price: prevDay.low, index: candles.length - 1, ts: prevDay.ts, label: `PDL ${formatPrice(pair, prevDay.low)}` });
  }

  const asiaKeys = Array.from(asiaByDate.keys()).sort();
  let latestAsia = null;
  if (asiaKeys.length > 0) {
    const lastAsiaKey = asiaKeys[asiaKeys.length - 1];
    latestAsia = { dateKey: lastAsiaKey, ...asiaByDate.get(lastAsiaKey) };
    levels.push({ kind: "ASIA_HIGH", side: "HIGH", price: latestAsia.high, index: candles.length - 1, ts: latestAsia.endTs, label: `Asia High ${formatPrice(pair, latestAsia.high)}` });
    levels.push({ kind: "ASIA_LOW", side: "LOW", price: latestAsia.low, index: candles.length - 1, ts: latestAsia.endTs, label: `Asia Low ${formatPrice(pair, latestAsia.low)}` });
  }

  return { levels, latestAsia };
}

function detectSweeps(candles, liquidityLevels) {
  const sweeps = [];
  for (const lvl of liquidityLevels) {
    if (lvl.index >= candles.length - 1) continue;
    for (let startIdx = lvl.index + 1; startIdx < candles.length; startIdx += 1) {
      const maxWindow = Math.min(candles.length - 1, startIdx + 2);
      if (lvl.side === "LOW") {
        let extremeLow = Infinity;
        let sweepCandle = null;
        for (let k = startIdx; k <= maxWindow; k += 1) {
          if (candles[k].low < lvl.price) {
            if (candles[k].low < extremeLow) extremeLow = candles[k].low;
            if (candles[k].close >= lvl.price) { sweepCandle = candles[k]; break; }
          }
        }
        if (sweepCandle && Number.isFinite(extremeLow)) {
          sweeps.push({ side: "LOW", direction: "BUY", level: lvl.price, levelLabel: lvl.label, extremePrice: extremeLow, candleIndex: sweepCandle.index, ts: sweepCandle.ts, timeIso: formatIsoTime(sweepCandle.ts) });
          break;
        }
      } else {
        let extremeHigh = -Infinity;
        let sweepCandle = null;
        for (let k = startIdx; k <= maxWindow; k += 1) {
          if (candles[k].high > lvl.price) {
            if (candles[k].high > extremeHigh) extremeHigh = candles[k].high;
            if (candles[k].close <= lvl.price) { sweepCandle = candles[k]; break; }
          }
        }
        if (sweepCandle && Number.isFinite(extremeHigh)) {
          sweeps.push({ side: "HIGH", direction: "SELL", level: lvl.price, levelLabel: lvl.label, extremePrice: extremeHigh, candleIndex: sweepCandle.index, ts: sweepCandle.ts, timeIso: formatIsoTime(sweepCandle.ts) });
          break;
        }
      }
    }
  }
  sweeps.sort((a, b) => a.candleIndex - b.candleIndex);
  return sweeps;
}

function computeHtfBias(h1Candles, entryCandles) {
  const src = h1Candles && h1Candles.length >= 15 ? h1Candles : entryCandles;
  const tfTag = h1Candles && h1Candles.length >= 15 ? "H1" : "TF";
  const swings = detectFractalSwings(src, 3, 3);
  const breaks = detectStructureShifts(src, swings);
  const lastBos = breaks.length > 0 ? breaks[breaks.length - 1] : null;
  const recentSlice = src.slice(-50);
  const rangeHigh = Math.max(...recentSlice.map((c) => c.high));
  const rangeLow = Math.min(...recentSlice.map((c) => c.low));
  const eq = (rangeHigh + rangeLow) / 2;
  const lastPrice = src[src.length - 1].close;
  const zone = rangeHigh > rangeLow ? (lastPrice <= eq ? "DISCOUNT" : "PREMIUM") : "EQUILIBRIUM";
  const direction = lastBos ? lastBos.direction : (lastPrice >= src[src.length - 2].close ? "BUY" : "SELL");
  return { direction, tfTag, rangeHigh, rangeLow, zone };
}

function buildRealLiquidityTargets(direction, entry, sl, liquidityLevels, fallbackSwingHigh, fallbackSwingLow, pair) {
  const riskDist = Math.abs(entry - sl);
  if (!Number.isFinite(riskDist) || riskDist <= 0) return [];
  const candidates = [];

  for (const lvl of liquidityLevels) {
    if (direction === "BUY" && lvl.price > entry + riskDist * MIN_RR_TP1) {
      candidates.push({ price: lvl.price, label: lvl.label });
    } else if (direction === "SELL" && lvl.price < entry - riskDist * MIN_RR_TP1) {
      candidates.push({ price: lvl.price, label: lvl.label });
    }
  }

  if (direction === "BUY") {
    if (Number.isFinite(fallbackSwingHigh) && fallbackSwingHigh > entry + riskDist * MIN_RR_TP1) {
      candidates.push({ price: fallbackSwingHigh, label: `Swing High ${formatPrice(pair, fallbackSwingHigh)}` });
    }
    candidates.sort((a, b) => a.price - b.price);
  } else {
    if (Number.isFinite(fallbackSwingLow) && fallbackSwingLow < entry - riskDist * MIN_RR_TP1) {
      candidates.push({ price: fallbackSwingLow, label: `Swing Low ${formatPrice(pair, fallbackSwingLow)}` });
    }
    candidates.sort((a, b) => b.price - a.price);
  }

  const uniqueTargets = [];
  const minStep = riskDist * 0.4;
  for (const c of candidates) {
    if (!uniqueTargets.some((u) => Math.abs(u.price - c.price) < minStep)) {
      const rr = Math.abs(c.price - entry) / riskDist;
      uniqueTargets.push({ price: c.price, label: c.label, rr: Number(rr.toFixed(2)) });
    }
    if (uniqueTargets.length >= 3) break;
  }
  return uniqueTargets;
}

function finalizeSetupWithGates(params) {
  const { pair, timeframe, methodKey, direction, entry, sl, invalidation, trigger, checklist, liquidityLevels, swingHigh, swingLow, htfBias, nyCtx } = params;
  if (!Number.isFinite(entry) || !Number.isFinite(sl) || entry <= 0 || sl <= 0) return null;
  if (direction === "BUY" && !(sl < entry)) return null;
  if (direction === "SELL" && !(sl > entry)) return null;

  const isReversalSweep = methodKey === "sweep" || methodKey === "judas";
  if (htfBias && htfBias.direction && htfBias.direction !== direction && !isReversalSweep) return null;

  const targets = buildRealLiquidityTargets(direction, entry, sl, liquidityLevels, swingHigh, swingLow, pair);
  if (targets.length === 0 || targets[0].rr < MIN_RR_TP1) return null;

  const finalChecklist = checklist.slice();
  if (htfBias && htfBias.direction === direction) {
    finalChecklist.push(`✔ Searah bias ${htfBias.tfTag} (${direction}, zona ${htfBias.zone})`);
  }
  finalChecklist.push(`✔ RR ke TP1 1:${targets[0].rr} (>= 1.5) menuju ${targets[0].label}`);

  const tp1 = targets[0].price;
  const tp2 = targets[1] ? targets[1].price : tp1;
  const tp3 = targets[2] ? targets[2].price : tp2;

  return {
    valid: true,
    pair,
    tf: timeframe,
    methodKey,
    selectedMethodKey: methodKey,
    direction,
    orderType: direction === "BUY" ? "BUY LIMIT" : "SELL LIMIT",
    sessionName: nyCtx.sessionName,
    trigger,
    invalidation,
    checklist: finalChecklist,
    score: finalChecklist.length,
    entry,
    entryFmt: formatPrice(pair, entry),
    sl,
    slFmt: formatPrice(pair, sl),
    slPips: toPips(pair, entry - sl),
    tp1,
    tp1Fmt: formatPrice(pair, tp1),
    tp1Pips: toPips(pair, tp1 - entry),
    tp1Label: targets[0].label,
    tp2,
    tp2Fmt: formatPrice(pair, tp2),
    tp2Pips: toPips(pair, tp2 - entry),
    tp3,
    tp3Fmt: formatPrice(pair, tp3),
    tp3Pips: toPips(pair, tp3 - entry),
    rrTp1: targets[0].rr
  };
}

// 1. Detektor Pola N (Impulse-Pullback-Break)
function detectNPatternSetup(ctx) {
  const { candles, swings, shifts, liquidityLevels, spreadPrice, atrNow, pair, timeframe, htfBias, nyCtx } = ctx;
  const highs = swings.swingHighs;
  const lows = swings.swingLows;
  if (highs.length < 1 || lows.length < 1) return null;

  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const lastCandle = candles[candles.length - 1];
  const buffer = Math.max(atrNow * 0.22, spreadPrice);

  let candidate = null;
  if (lastLow.index < lastHigh.index) {
    const bullShift = shifts.slice().reverse().find((s) => s.direction === "BUY" && s.index >= lastHigh.index);
    if (bullShift) {
      const retraceMid = lastHigh.price - (lastHigh.price - lastLow.price) * 0.5;
      candidate = {
        direction: "BUY",
        entry: Math.min(lastCandle.close, retraceMid > 0 ? retraceMid : lastCandle.close),
        sl: lastLow.price - buffer,
        legHigh: lastHigh.price,
        legLow: lastLow.price,
        breakLevel: bullShift.level,
        reason: `Impulse naik → Pullback sehat → Break struktur ${formatPrice(pair, bullShift.level)}`
      };
    }
  } else if (lastHigh.index < lastLow.index) {
    const bearShift = shifts.slice().reverse().find((s) => s.direction === "SELL" && s.index >= lastLow.index);
    if (bearShift) {
      const retraceMid = lastLow.price + (lastHigh.price - lastLow.price) * 0.5;
      candidate = {
        direction: "SELL",
        entry: Math.max(lastCandle.close, retraceMid > 0 ? retraceMid : lastCandle.close),
        sl: lastHigh.price + buffer,
        legHigh: lastHigh.price,
        legLow: lastLow.price,
        breakLevel: bearShift.level,
        reason: `Impulse turun → Pullback sehat → Break struktur ${formatPrice(pair, bearShift.level)}`
      };
    }
  }
  if (!candidate) return null;

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "n_pattern", direction: candidate.direction,
    entry: candidate.entry, sl: candidate.sl,
    invalidation: `Tembus batas pullback Pola N di ${formatPrice(pair, candidate.sl)}`,
    trigger: `POLA_N_${candidate.direction}_BREAK @ ${formatPrice(pair, candidate.breakLevel)}`,
    checklist: [
      `✔ Pola N ${candidate.direction}: ${candidate.reason}`,
      `✔ Pullback terukur di area ${formatPrice(pair, candidate.legLow)}–${formatPrice(pair, candidate.legHigh)}`
    ],
    liquidityLevels, swingHigh: candidate.legHigh, swingLow: candidate.legLow, htfBias, nyCtx
  });
}

// 2. Detektor Liquidity Sweep + MSS
function detectLiquiditySweepSetup(ctx) {
  const { candles, swings, sweeps, shifts, fvgList, obList, liquidityLevels, spreadPrice, atrNow, pair, timeframe, htfBias, nyCtx } = ctx;
  if (sweeps.length === 0) return null;
  const recentSweep = sweeps[sweeps.length - 1];
  if (candles.length - 1 - recentSweep.candleIndex > 12) return null;

  const dir = recentSweep.direction;
  const mssAfter = shifts.find((s) => s.direction === dir && s.index >= recentSweep.candleIndex);
  if (!mssAfter) return null;

  const fvgAfter = fvgList.slice().reverse().find((f) => f.direction === dir && !f.mitigated && f.createdIndex >= recentSweep.candleIndex);
  const obAfter = obList.slice().reverse().find((o) => o.direction === dir && !o.mitigated && o.displacementIndex >= recentSweep.candleIndex);
  if (!fvgAfter && !obAfter) return null;

  const entry = fvgAfter ? fvgAfter.ce : obAfter.mid50;
  const buffer = atrNow * 0.25 + spreadPrice;
  const sl = dir === "BUY"
    ? Math.min(recentSweep.extremePrice, obAfter ? obAfter.bottom : recentSweep.extremePrice) - buffer
    : Math.max(recentSweep.extremePrice, obAfter ? obAfter.top : recentSweep.extremePrice) + buffer;

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "sweep", direction: dir, entry, sl,
    invalidation: `Close di luar ekstrem sweep ${formatPrice(pair, recentSweep.extremePrice)}`,
    trigger: `SWEEP_${recentSweep.side}_AND_MSS @ ${formatPrice(pair, mssAfter.level)}`,
    checklist: [
      `✔ Sweep ${recentSweep.side} (${recentSweep.levelLabel}) lalu close balik`,
      `✔ MSS terkonfirmasi di ${formatPrice(pair, mssAfter.level)}`,
      fvgAfter ? `✔ FVG unmitigated ${formatPrice(pair, fvgAfter.bottom)}–${formatPrice(pair, fvgAfter.top)}` : `✔ OB unmitigated ${formatPrice(pair, obAfter.bottom)}–${formatPrice(pair, obAfter.top)}`
    ],
    liquidityLevels,
    swingHigh: swings.swingHighs.length ? swings.swingHighs[swings.swingHighs.length - 1].price : null,
    swingLow: swings.swingLows.length ? swings.swingLows[swings.swingLows.length - 1].price : null,
    htfBias, nyCtx
  });
}

// 3. Detektor ICT Judas Swing
function detectJudasSwingSetup(ctx) {
  const { candles, latestAsia, nyCtx, shifts, fvgList, obList, liquidityLevels, spreadPrice, atrNow, pair, timeframe, htfBias } = ctx;
  if (!nyCtx.isJudasWindow || !latestAsia || !(latestAsia.high > latestAsia.low)) return null;

  let judasSweep = null;
  for (let i = 0; i < candles.length; i += 1) {
    const p = getNyParts(candles[i].ts);
    const inJudas = (p.nyHour >= 2 && p.nyHour < 5) || (p.nyHour >= 7 && p.nyHour < 9);
    if (!inJudas) continue;
    if (candles[i].high > latestAsia.high && candles[i].close <= latestAsia.high) {
      judasSweep = { side: "HIGH", direction: "SELL", level: latestAsia.high, extreme: candles[i].high, index: i };
    } else if (candles[i].low < latestAsia.low && candles[i].close >= latestAsia.low) {
      judasSweep = { side: "LOW", direction: "BUY", level: latestAsia.low, extreme: candles[i].low, index: i };
    }
  }
  if (!judasSweep) return null;

  const dir = judasSweep.direction;
  const mssAfter = shifts.find((s) => s.direction === dir && s.index >= judasSweep.index);
  if (!mssAfter) return null;

  const retestZone = fvgList.slice().reverse().find((f) => f.direction === dir && !f.mitigated && f.createdIndex >= judasSweep.index)
    || obList.slice().reverse().find((o) => o.direction === dir && !o.mitigated && o.displacementIndex >= judasSweep.index);
  if (!retestZone) return null;

  const entry = retestZone.ce !== undefined ? retestZone.ce : retestZone.mid50;
  const buffer = atrNow * 0.2 + spreadPrice;
  const sl = dir === "BUY" ? judasSweep.extreme - buffer : judasSweep.extreme + buffer;

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "judas", direction: dir, entry, sl,
    invalidation: `Tembus ekstrem Judas ${formatPrice(pair, judasSweep.extreme)}`,
    trigger: `JUDAS_ASIA_${judasSweep.side}_SWEEP @ ${formatPrice(pair, judasSweep.level)}`,
    checklist: [
      `✔ Range Asia (${formatPrice(pair, latestAsia.low)}–${formatPrice(pair, latestAsia.high)})`,
      `✔ Judas sweep Asia ${judasSweep.side} (${nyCtx.sessionName}) & MSS searah ${dir}`
    ],
    liquidityLevels, swingHigh: latestAsia.high, swingLow: latestAsia.low, htfBias, nyCtx
  });
}

// 4. Detektor SMC Order Block + FVG Confluence
function detectSmcObSetup(ctx) {
  const { obList, shifts, liquidityLevels, spreadPrice, atrNow, pair, timeframe, htfBias, nyCtx } = ctx;
  if (!htfBias || !htfBias.direction) return null;
  const dir = htfBias.direction;

  const validBos = shifts.slice().reverse().find((s) => s.direction === dir);
  if (!validBos) return null;

  const validOb = obList.slice().reverse().find((o) => o.direction === dir && !o.mitigated && o.hasFvgOverlap && o.fvg && !o.fvg.mitigated);
  if (!validOb) return null;

  const overlapTop = Math.min(validOb.top, validOb.fvg.top);
  const overlapBottom = Math.max(validOb.bottom, validOb.fvg.bottom);
  const entry = overlapTop >= overlapBottom ? (overlapTop + overlapBottom) / 2 : validOb.mid50;
  const buffer = atrNow * 0.2 + spreadPrice;
  const sl = dir === "BUY" ? validOb.bottom - buffer : validOb.top + buffer;

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "smc_ob", direction: dir, entry, sl,
    invalidation: `Close melewati wick OB ${formatPrice(pair, dir === "BUY" ? validOb.bottom : validOb.top)}`,
    trigger: `SMC_OB_FVG_OVERLAP @ ${formatPrice(pair, entry)}`,
    checklist: [
      `✔ Bias HTF ${htfBias.tfTag} ${dir} & BOS di ${formatPrice(pair, validBos.level)}`,
      `✔ OB ${formatPrice(pair, validOb.bottom)}–${formatPrice(pair, validOb.top)} overlap FVG unmitigated`
    ],
    liquidityLevels, swingHigh: htfBias.rangeHigh, swingLow: htfBias.rangeLow, htfBias, nyCtx
  });
}

// 5. Detektor ICT Silver Bullet
function detectSilverBulletSetup(ctx) {
  const { candles, nyCtx, sweeps, shifts, fvgList, liquidityLevels, pair, timeframe, htfBias } = ctx;
  if (!nyCtx.isSilverBulletWindow) return null;

  const recentSweep = sweeps.slice().reverse().find((sw) => candles.length - 1 - sw.candleIndex <= 20);
  if (!recentSweep) return null;

  const dir = recentSweep.direction;
  const mssAfter = shifts.find((s) => s.direction === dir && s.index >= recentSweep.candleIndex);
  if (!mssAfter) return null;

  const windowFvg = fvgList.slice().reverse().find((f) => {
    if (f.direction !== dir || f.mitigated || f.createdIndex < mssAfter.index) return false;
    const p = getNyParts(f.ts);
    return p.nyHour === 3 || p.nyHour === 10 || p.nyHour === 14;
  });
  if (!windowFvg) return null;

  const firstFvgCandle = candles[Math.max(0, windowFvg.createdIndex - 2)];
  const sl = dir === "BUY" ? firstFvgCandle.low : firstFvgCandle.high;

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "silver_bullet", direction: dir, entry: windowFvg.ce, sl,
    invalidation: `Tembus balik candle pertama FVG di ${formatPrice(pair, sl)}`,
    trigger: `SILVER_BULLET_${nyCtx.silverBulletWindow}`,
    checklist: [
      `✔ Jendela Silver Bullet aktif (${nyCtx.silverBulletWindow})`,
      `✔ Sweep ${recentSweep.side} + MSS & FVG (${formatPrice(pair, windowFvg.bottom)}–${formatPrice(pair, windowFvg.top)})`
    ],
    liquidityLevels,
    swingHigh: Math.max(...candles.slice(-30).map((c) => c.high)),
    swingLow: Math.min(...candles.slice(-30).map((c) => c.low)),
    htfBias, nyCtx
  });
}

// 6. Detektor FIB OTE (0.62 - 0.79 / Entry 0.705)
function detectFibOteSetup(ctx) {
  const { candles, swings, shifts, fvgList, obList, liquidityLevels, atrNow, pair, timeframe, htfBias, nyCtx } = ctx;
  if (swings.swingHighs.length === 0 || swings.swingLows.length === 0) return null;

  const lastHigh = swings.swingHighs[swings.swingHighs.length - 1];
  const lastLow = swings.swingLows[swings.swingLows.length - 1];
  const currentPrice = candles[candles.length - 1].close;

  let dir = null, legLow = null, legHigh = null;
  if (lastLow.index < lastHigh.index && shifts.some((s) => s.direction === "BUY" && s.index >= lastLow.index)) {
    dir = "BUY"; legLow = lastLow.price; legHigh = lastHigh.price;
  } else if (lastHigh.index < lastLow.index && shifts.some((s) => s.direction === "SELL" && s.index >= lastHigh.index)) {
    dir = "SELL"; legHigh = lastHigh.price; legLow = lastLow.price;
  }
  if (!dir || !(legHigh > legLow)) return null;

  const legRange = legHigh - legLow;
  const fib062 = dir === "BUY" ? legHigh - legRange * 0.62 : legLow + legRange * 0.62;
  const fib079 = dir === "BUY" ? legHigh - legRange * 0.79 : legLow + legRange * 0.79;
  const entry0705 = dir === "BUY" ? legHigh - legRange * 0.705 : legLow + legRange * 0.705;
  const sl = dir === "BUY" ? legLow : legHigh;

  const zoneMin = Math.min(fib062, fib079);
  const zoneMax = Math.max(fib062, fib079);
  if (currentPrice < zoneMin - atrNow * 0.15 || currentPrice > zoneMax + atrNow * 0.15) return null;

  const checklist = [
    `✔ Leg impuls ${dir} (${formatPrice(pair, legLow)}–${formatPrice(pair, legHigh)}) setelah MSS`,
    `✔ Harga di zona Fib OTE 0.62–0.79, entry presisi 0.705 (${formatPrice(pair, entry0705)})`
  ];
  if (fvgList.some((f) => !f.mitigated && f.top >= zoneMin && f.bottom <= zoneMax) || obList.some((o) => !o.mitigated && o.top >= zoneMin && o.bottom <= zoneMax)) {
    checklist.push("✔ Bonus konfluensi FVG/OB di dalam zona OTE");
  }

  return finalizeSetupWithGates({
    pair, timeframe, methodKey: "ote", direction: dir, entry: entry0705, sl,
    invalidation: `Tembus titik 0 leg impuls di ${formatPrice(pair, sl)}`,
    trigger: `FIB_OTE_0705 @ ${formatPrice(pair, entry0705)}`,
    checklist, liquidityLevels, swingHigh: legHigh, swingLow: legLow, htfBias, nyCtx
  });
}

function evaluateConfiguredMethods(pair, timeframe, candles, h1Candles, cfg, nowMs) {
  const spec = PAIR_SPECS[pair];
  const tfInfo = TF_MAP[timeframe];
  const nyCtx = getNySessionContext(nowMs);
  const atrSeries = calculateAtrSeries(candles, 14);
  const atrNow = Math.max(spec.pipSize, atrSeries[atrSeries.length - 1] || spec.baseAtrM15 * tfInfo.atrMult);
  const spreadPrice = spec.defaultSpreadPips * spec.pipSize;

  const swings = detectFractalSwings(candles, 3, 3);
  const shifts = detectStructureShifts(candles, swings);
  const fvgList = detectFVGs(candles, atrSeries, 0.3);
  const obList = detectOrderBlocks(candles, atrSeries, fvgList);
  const liqInfo = extractLiquidityLevels(candles, swings, pair);
  const sweeps = detectSweeps(candles, liqInfo.levels);
  const htfBias = computeHtfBias(h1Candles, candles);

  const ctx = {
    pair, timeframe, candles, atrNow, spreadPrice,
    swings, shifts, fvgList, obList,
    liquidityLevels: liqInfo.levels, latestAsia: liqInfo.latestAsia,
    sweeps, htfBias, nyCtx
  };

  const detectors = {
    n_pattern: () => detectNPatternSetup(ctx),
    sweep: () => detectLiquiditySweepSetup(ctx),
    judas: () => detectJudasSwingSetup(ctx),
    smc_ob: () => detectSmcObSetup(ctx),
    silver_bullet: () => detectSilverBulletSetup(ctx),
    ote: () => detectFibOteSetup(ctx)
  };

  const keysToRun = cfg.methods.includes("auto")
    ? Object.keys(detectors)
    : cfg.methods.filter((k) => detectors[k]);

  const validSetups = [];
  for (const k of keysToRun) {
    const res = detectors[k]();
    if (res && res.valid) validSetups.push(res);
  }

  if (validSetups.length === 0) return [];

  // Kunci satu arah (One-Way Lock): tolak jika sinyal antar metode bentrok BUY vs SELL
  const dirs = new Set(validSetups.map((s) => s.direction));
  if (dirs.size > 1) return [];

  validSetups.sort((a, b) => b.score - a.score);
  const best = { ...validSetups[0] };

  if (cfg.methods.includes("auto")) {
    if (validSetups.length >= 2) {
      best.score += 1;
      best.checklist.push(`✔ Konfluensi ${validSetups.length} metode searah (${validSetups.map((s) => s.selectedMethodKey.toUpperCase()).join(" + ")})`);
    }
    best.methodKey = "auto";
    return [best];
  }

  return validSetups;
}

async function sendTelegram(env, s, lot) {
  const methodTitle = s.methodKey === "auto"
    ? `AUTO → ${s.selectedMethodKey.toUpperCase()}`
    : s.selectedMethodKey.toUpperCase();

  const text = [
    `🎯 <b>XLIAMVR SNIPER SIGNAL (v4.1)</b>`,
    `📈 Pair: <b>${s.pair}</b> • TF: <b>${s.tf}</b> • Sesi: <b>${s.sessionName}</b>`,
    `🧭 Arah: <b>${s.orderType}</b> (${methodTitle})`,
    `📊 Score: <b>${s.score}</b> • RR TP1: <b>1:${s.rrTp1}</b>`,
    `📍 Entry: <code>${s.entryFmt}</code>`,
    `🛑 SL: <code>${s.slFmt}</code> (-${s.slPips} pips)`,
    `✅ TP1: <code>${s.tp1Fmt}</code> (+${s.tp1Pips} pips • ${s.tp1Label})`,
    `✅ TP2: <code>${s.tp2Fmt}</code> (+${s.tp2Pips} pips)`,
    `✅ TP3: <code>${s.tp3Fmt}</code> (+${s.tp3Pips} pips)`,
    `⚡ Trigger: <code>${s.trigger}</code>`,
    `📝 <b>Konfirmasi:</b>\n${s.checklist.join("\n")}`,
    `⚖️ Lot: <b>${lot}</b>`
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
