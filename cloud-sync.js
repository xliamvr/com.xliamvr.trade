const WORKER_URL = "https://liamvtrade-scanner.ilhammaulananuralrasyid.workers.dev";

function getAdminSecret(forcePrompt = false) {
  let secret = forcePrompt ? null : localStorage.getItem("liam_admin_secret");
  if (!secret) {
    secret = prompt("Masukkan ADMIN_SECRET Cloudflare:");
    if (secret && secret.trim()) {
      localStorage.setItem("liam_admin_secret", secret.trim());
      secret = secret.trim();
    }
  }
  return secret;
}

function resetAdminSecret() {
  localStorage.removeItem("liam_admin_secret");
  const updated = getAdminSecret(true);
  if (updated) {
    setCloudStatusText("ADMIN_SECRET diperbarui. Silakan klik Simpan.", "ok");
  }
}

function normalizeUiPair(pair) {
  const clean = String(pair || "").trim().toUpperCase();
  if (clean === "BTCUSD" || clean === "BTC") return "BTCUSDT";
  if (clean === "NAS100" || clean === "NDX") return "US100";
  return clean;
}

function normalizeUiMethod(method) {
  const clean = String(method || "").trim().toLowerCase();
  if (clean === "auto_sniper" || clean === "all_method") return "auto";
  if (clean === "liq_sweep") return "sweep";
  if (clean === "fvg") return "smc_ob";
  return clean;
}

function setCloudStatusText(message, state = "neutral") {
  const badge = document.getElementById("cloudSyncStatus");
  if (!badge) return;
  badge.textContent = message;
  badge.dataset.state = state;
}

// Ambil setting terakhir saat halaman pengaturan dibuka
async function loadCloudSettings() {
  try {
    setCloudStatusText("Memuat status Cloud...", "loading");
    const res = await fetch(`${WORKER_URL}/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cfg = await res.json();

    const activePairs = Array.isArray(cfg.pairs) ? cfg.pairs.map(normalizeUiPair) : [];
    const activeTfs = Array.isArray(cfg.timeframes) ? cfg.timeframes.map((t) => String(t).toUpperCase()) : [];
    const activeMethods = Array.isArray(cfg.methods) ? cfg.methods.map(normalizeUiMethod) : [];

    const enabledEl = document.getElementById("cloudEnabledToggle");
    if (enabledEl) enabledEl.checked = cfg.enabled !== false;

    document.querySelectorAll("[data-cloud-pair]").forEach((el) => {
      el.checked = activePairs.includes(normalizeUiPair(el.dataset.cloudPair));
    });
    document.querySelectorAll("[data-cloud-tf]").forEach((el) => {
      el.checked = activeTfs.includes(String(el.dataset.cloudTf).toUpperCase());
    });
    document.querySelectorAll("[data-cloud-method]").forEach((el) => {
      el.checked = activeMethods.includes(normalizeUiMethod(el.dataset.cloudMethod));
    });

    const minScoreEl = document.getElementById("minScoreInput");
    if (minScoreEl && cfg.minScore !== undefined) {
      minScoreEl.value = cfg.minScore;
    }

    const lotEl = document.getElementById("lotInput");
    if (lotEl && cfg.lot !== undefined) {
      lotEl.value = cfg.lot;
    }

    const statusLabel = cfg.enabled !== false
      ? `Cloud Aktif • ${activePairs.length} Pair • ${activeTfs.length} TF`
      : "Cloud Scanner OFF";
    setCloudStatusText(statusLabel, cfg.enabled !== false ? "ok" : "off");
  } catch (err) {
    setCloudStatusText("Gagal terhubung ke Cloud (cek DNS 1.1.1.1)", "error");
  }
}

// Kirim perubahan sakelar ke Cloud KV
async function saveCloudSettings(silent = false) {
  const adminSecret = getAdminSecret();
  if (!adminSecret) return;

  const enabledEl = document.getElementById("cloudEnabledToggle");
  const enabled = enabledEl ? Boolean(enabledEl.checked) : true;

  const pairs = [...document.querySelectorAll("[data-cloud-pair]:checked")].map((el) => el.dataset.cloudPair);
  const timeframes = [...document.querySelectorAll("[data-cloud-tf]:checked")].map((el) => el.dataset.cloudTf);
  const methods = [...document.querySelectorAll("[data-cloud-method]:checked")].map((el) => el.dataset.cloudMethod);

  const minScoreEl = document.getElementById("minScoreInput");
  const lotEl = document.getElementById("lotInput");

  const parsedMinScore = minScoreEl ? parseFloat(minScoreEl.value) : 4;
  const parsedLot = lotEl ? parseFloat(lotEl.value) : 0.02;

  const payload = {
    enabled,
    pairs,
    timeframes,
    methods: methods.length ? methods : ["auto"],
    minScore: Number.isFinite(parsedMinScore) && parsedMinScore > 0 ? parsedMinScore : 4,
    lot: Number.isFinite(parsedLot) && parsedLot > 0 ? parsedLot : 0.02
  };

  try {
    setCloudStatusText("Menyimpan ke Cloud KV...", "loading");
    const res = await fetch(`${WORKER_URL}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSecret}`
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      localStorage.removeItem("liam_admin_secret");
      setCloudStatusText("ADMIN_SECRET salah", "error");
      alert("ADMIN_SECRET salah. Silakan simpan ulang dan masukkan kode yang benar.");
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const statusLabel = enabled
      ? `Tersinkron • ${pairs.length} Pair • ${timeframes.length} TF`
      : "Cloud Scanner Dimatikan (OFF)";
    setCloudStatusText(statusLabel, enabled ? "ok" : "off");

    if (!silent) {
      alert("Cloud Scanner tersinkron! Aplikasi aman ditutup.");
    }
  } catch (err) {
    setCloudStatusText("Gagal menyimpan ke Cloud", "error");
    alert(`Gagal menyimpan pengaturan Cloud: ${err.message}`);
  }
}

// Fungsi tombol "ALL ON" / "OFF" untuk masing-masing kategori
function toggleAllGroup(attributeName, state = true) {
  document.querySelectorAll(`[${attributeName}]`).forEach((el) => {
    el.checked = state;
  });
  saveCloudSettings(true);
}

// Tes scan manual langsung dari tombol UI
async function triggerCloudScanNow() {
  const btn = document.getElementById("btnCloudTestScan");
  if (btn) btn.disabled = true;
  try {
    setCloudStatusText("Memindai market sekarang...", "loading");
    const res = await fetch(`${WORKER_URL}/scan`);
    const data = await res.json();
    if (data && data.ok) {
      const info = Array.isArray(data.logs) && data.logs.length > 0 ? data.logs[0] : "Scan selesai";
      setCloudStatusText(`Scan OK: ${info}`, "ok");
    } else {
      setCloudStatusText("Scan selesai tanpa log", "neutral");
    }
  } catch (err) {
    setCloudStatusText("Gagal menjalankan scan manual", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCloudSettings);
  } else {
    loadCloudSettings();
  }
}
