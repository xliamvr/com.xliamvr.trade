const WORKER_URL = "https://liamvtrade-scanner.ilhammaulananuralrasyid.workers.dev";

function getAdminSecret() {
  let secret = localStorage.getItem("liam_admin_secret");
  if (!secret) {
    secret = prompt("Masukkan ADMIN_SECRET Cloudflare:");
    if (secret) localStorage.setItem("liam_admin_secret", secret.trim());
  }
  return secret;
}

// Ambil setting terakhir saat halaman pengaturan dibuka
async function loadCloudSettings() {
  const res = await fetch(`${WORKER_URL}/config`);
  const cfg = await res.json();

  document.querySelectorAll("[data-pair]").forEach((el) => {
    el.checked = cfg.pairs.includes(el.dataset.pair);
  });
  document.querySelectorAll("[data-tf]").forEach((el) => {
    el.checked = cfg.timeframes.includes(el.dataset.tf);
  });
  document.querySelectorAll("[data-method]").forEach((el) => {
    el.checked = cfg.methods.includes(el.dataset.method);
  });
  document.getElementById("minScoreInput").value = cfg.minScore;
  document.getElementById("lotInput").value = cfg.lot;
}

// Kirim perubahan sakelar ke Cloud KV
async function saveCloudSettings() {
  const adminSecret = getAdminSecret();
  if (!adminSecret) return;

  const pairs = [...document.querySelectorAll("[data-pair]:checked")].map((el) => el.dataset.pair);
  const timeframes = [...document.querySelectorAll("[data-tf]:checked")].map((el) => el.dataset.tf);
  const methods = [...document.querySelectorAll("[data-method]:checked")].map((el) => el.dataset.method);

  const payload = {
    enabled: true,
    pairs,
    timeframes,
    methods,
    minScore: parseFloat(document.getElementById("minScoreInput").value),
    lot: parseFloat(document.getElementById("lotInput").value)
  };

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
    alert("ADMIN_SECRET salah. Silakan simpan ulang dan masukkan kode yang benar.");
    return;
  }

  if (res.ok) {
    alert("Cloud Scanner tersinkron! Aplikasi aman ditutup.");
  }
}

// Fungsi tombol "ALL ON" untuk masing-masing kategori
function toggleAllGroup(attributeName, state = true) {
  document.querySelectorAll(`[${attributeName}]`).forEach((el) => {
    el.checked = state;
  });
  saveCloudSettings();
}
