(function (global) {
  'use strict';

  function getPairInfo(pair) {
    const cleanPair =
      global.LiamMethods && typeof global.LiamMethods.normalizePair === 'function'
        ? global.LiamMethods.normalizePair(pair)
        : String(pair || 'XAUUSD').toUpperCase();

    const specs = {
      XAUUSD: { decimals: 2, pipSize: 0.1, pipValuePerLot: 10 },
      US100: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      BTCUSDT: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      EURUSD: { decimals: 5, pipSize: 0.0001, pipValuePerLot: 10 }
    };
    if (global.LiamMethods && typeof global.LiamMethods.getPairSpec === 'function') {
      return global.LiamMethods.getPairSpec(cleanPair);
    }
    return specs[cleanPair] || specs.XAUUSD;
  }

  function fmtPx(pair, val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return '--';
    if (global.LiamMethods && typeof global.LiamMethods.formatPrice === 'function') {
      return global.LiamMethods.formatPrice(pair, num);
    }
    return num.toFixed(getPairInfo(pair).decimals);
  }

  function resolveState() {
    if (global.state && typeof global.state === 'object') {
      return global.state;
    }
    const bridge = global.__LIAM_TERMINAL_BRIDGE__;
    if (bridge && typeof bridge.getState === 'function') {
      const st = bridge.getState();
      if (st && typeof st === 'object') {
        global.state = st;
        return st;
      }
    }
    return null;
  }

  function resolveActivePair(st) {
    const rawPair =
      (st && st.signal && st.signal.pair) ||
      (st && st.pair) ||
      (document.getElementById('chart-pair-select') && document.getElementById('chart-pair-select').value) ||
      'XAUUSD';

    if (global.LiamMethods && typeof global.LiamMethods.normalizePair === 'function') {
      return global.LiamMethods.normalizePair(rawPair);
    }
    return String(rawPair || 'XAUUSD').toUpperCase();
  }

  function setTextEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(text);
  }

  function setValEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = String(val);
  }

  function showModalBox(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function hideModalBox(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function notifyUser(msg) {
    if (typeof global.showToast === 'function') {
      global.showToast(msg, 'info');
      return;
    }
    const container = document.getElementById('toast-container');
    if (container) {
      const box = document.createElement('div');
      box.className = 'px-3.5 py-2.5 rounded-xl border bg-slate-900/95 border-sky-400/50 text-sky-200 text-xs font-semibold shadow-xl';
      box.textContent = msg;
      container.appendChild(box);
      setTimeout(() => box.remove(), 2600);
    }
  }

  function syncAfterCalibration(st) {
    try {
      localStorage.setItem('liamvtrade_quant_v29_state', JSON.stringify(st));
    } catch (_) {}

    try {
      if (global.LiamMethods && typeof global.LiamMethods.clearLockedSignal === 'function') {
        global.LiamMethods.clearLockedSignal();
      }
    } catch (_) {}

    hideModalBox('modal-calibration');
    if (typeof global.renderPriceDisplays === 'function') global.renderPriceDisplays();
    if (typeof global.recalculateAndRenderSignal === 'function') global.recalculateAndRenderSignal(true);
    if (typeof global.evaluateActiveTradesAgainstLivePrices === 'function') global.evaluateActiveTradesAgainstLivePrices();
  }

  function openCalibrationModal() {
    const st = resolveState();
    const pair = resolveActivePair(st);
    const rawPx = Number(st && st.prices ? st.prices[pair] : 0) || 0;
    const offset = Number(st && st.priceOffsets ? st.priceOffsets[pair] : 0) || 0;
    const currentPx = Number((rawPx + offset).toFixed(getPairInfo(pair).decimals));

    setTextEl('cal-pair-name', pair);
    setTextEl('cal-raw-price', fmtPx(pair, rawPx));
    setTextEl('cal-current-offset', offset > 0 ? `+${offset}` : `${offset}`);
    setValEl('cal-broker-price-input', currentPx);

    const acc =
      Array.isArray(st && st.accounts)
        ? st.accounts.find((a) => a.id === st.activeAccountId) || st.accounts[0]
        : null;

    const breakdownEl = document.getElementById('cal-lot-breakdown');
    if (breakdownEl) {
      const eq = Number(acc && (acc.equity !== undefined ? acc.equity : acc.balance)) || 1000;
      const riskPct = Number(acc && acc.riskPct) || 0.4;
      const maxLot = Number(acc && acc.maxLot) || 0.15;
      const estRiskDollar = ((eq * riskPct) / 100).toFixed(2);
      breakdownEl.innerHTML =
        `<div>Akun Aktif: <strong>${acc && acc.name ? acc.name : 'Default'}</strong> (Risk ${riskPct}% • Max Lot ${maxLot})</div>` +
        `<div>Target Risiko per Trade: <strong class="text-rose-400">-$${estRiskDollar}</strong></div>`;
    }

    showModalBox('modal-calibration');
  }

  function applyBrokerPriceCalibration() {
    const st = resolveState();
    if (!st) return;
    const pair = resolveActivePair(st);
    const inputEl = document.getElementById('cal-broker-price-input');
    const brokerPx = Number(inputEl && inputEl.value);

    if (!Number.isFinite(brokerPx) || brokerPx <= 0) {
      notifyUser('Masukkan harga broker yang valid.');
      return;
    }

    const spec = getPairInfo(pair);
    st.prices = st.prices || {};
    st.priceOffsets = st.priceOffsets || {};

    const rawPx = Number(st.prices[pair]);
    if (Number.isFinite(rawPx) && rawPx > 0) {
      st.priceOffsets[pair] = Number((brokerPx - rawPx).toFixed(spec.decimals));
    } else {
      st.prices[pair] = brokerPx;
      st.priceOffsets[pair] = 0;
    }

    syncAfterCalibration(st);
    notifyUser(`Kalibrasi ${pair} diterapkan (${fmtPx(pair, brokerPx)}).`);
  }

  function resetBrokerPriceCalibration() {
    const st = resolveState();
    if (!st) return;
    const pair = resolveActivePair(st);
    st.priceOffsets = st.priceOffsets || {};
    st.priceOffsets[pair] = 0;

    syncAfterCalibration(st);
    notifyUser(`Offset ${pair} direset ke 0.`);
  }

  global.openCalibrationModal = openCalibrationModal;
  global.applyBrokerPriceCalibration = applyBrokerPriceCalibration;
  global.resetBrokerPriceCalibration = resetBrokerPriceCalibration;
})(window);
