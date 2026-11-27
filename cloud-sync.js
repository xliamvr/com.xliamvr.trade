const WORKER_URL = "https://liamvtrade-scanner.SUBDOMAIN-KAMU.workers.dev";
const ADMIN_SECRET = "kode-rahasia-kamu"; // Samakan dengan di Cloudflare

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
      Authorization: `Bearer ${ADMIN_SECRET}`
    },
    body: JSON.stringify(payload)
  });

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
