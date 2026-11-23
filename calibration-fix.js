(function (global) {
  'use strict';

  function getPairInfo(pair) {
    const specs = {
      XAUUSD: { decimals: 2, pipSize: 0.1, pipValuePerLot: 10 },
      US100: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      BTCUSDT: { decimals: 2, pipSize: 1.0, pipValuePerLot: 1 },
      EURUSD: { decimals: 5, pipSize: 0.0001, pipValuePerLot: 10 }
    };
    if (global.LiamMethods && typeof global.LiamMethods.getPairSpec === 'function') {
      return global.LiamMethods.getPairSpec(pair);
    }
    return specs[pair] || specs.XAUUSD;
  }

  function fmtPx(pair, val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return '--';
    if (global.LiamMethods && typeof global.LiamMethods.formatPrice === 'function') {
      return global.LiamMethods.formatPrice(pair, num);
    }
    return num.toFixed(getPairInfo(pair).decimals);
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

  function openCalibrationModal() {
    const pair = (global.state && global.state.signal && global.state.signal.pair) || 'XAUUSD';
    const rawPx = Number(global.state && global.state.prices ? global.state.prices[pair] : 0) || 0;
    const offset = Number(global.state && global.state.priceOffsets ? global.state.priceOffsets[pair] : 0) || 0;
    const currentPx = Number((rawPx + offset).toFixed(getPairInfo(pair).decimals));

    setTextEl('cal-pair-name', pair);
    setTextEl('cal-raw-price', fmtPx(pair, rawPx));
    setTextEl('cal-current-offset', offset > 0 ? `+${offset}` : `${offset}`);
    setValEl('cal-broker-price-input', currentPx);

    const acc =
      Array.isArray(global.state && global.state.accounts)
        ? global.state.accounts.find((a) => a.id === global.state.activeAccountId) || global.state.accounts[0]
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
    if (!global.state) return;
    const pair = (global.state.signal && global.state.signal.pair) || 'XAUUSD';
    const inputEl = document.getElementById('cal-broker-price-input');
    const brokerPx = Number(inputEl && inputEl.value);

    if (!Number.isFinite(brokerPx) || brokerPx <= 0) {
      notifyUser('Masukkan harga broker yang valid.');
      return;
    }

    const spec = getPairInfo(pair);
    global.state.prices = global.state.prices || {};
    global.state.priceOffsets = global.state.priceOffsets || {};

    const rawPx = Number(global.state.prices[pair]);
    if (Number.isFinite(rawPx) && rawPx > 0) {
      global.state.priceOffsets[pair] = Number((brokerPx - rawPx).toFixed(spec.decimals));
    } else {
      global.state.prices[pair] = brokerPx;
      global.state.priceOffsets[pair] = 0;
    }

    try {
      localStorage.setItem('liamvtrade_quant_v29_state', JSON.stringify(global.state));
    } catch (_) {}

    hideModalBox('modal-calibration');
    if (typeof global.renderPriceDisplays === 'function') global.renderPriceDisplays();
    if (typeof global.recalculateAndRenderSignal === 'function') global.recalculateAndRenderSignal(false);
    if (typeof global.evaluateActiveTradesAgainstLivePrices === 'function') global.evaluateActiveTradesAgainstLivePrices();
    notifyUser(`Kalibrasi ${pair} diterapkan (${fmtPx(pair, brokerPx)}).`);
  }

  function resetBrokerPriceCalibration() {
    if (!global.state) return;
    const pair = (global.state.signal && global.state.signal.pair) || 'XAUUSD';
    global.state.priceOffsets = global.state.priceOffsets || {};
    global.state.priceOffsets[pair] = 0;

    try {
      localStorage.setItem('liamvtrade_quant_v29_state', JSON.stringify(global.state));
    } catch (_) {}

    hideModalBox('modal-calibration');
    if (typeof global.renderPriceDisplays === 'function') global.renderPriceDisplays();
    if (typeof global.recalculateAndRenderSignal === 'function') global.recalculateAndRenderSignal(false);
    if (typeof global.evaluateActiveTradesAgainstLivePrices === 'function') global.evaluateActiveTradesAgainstLivePrices();
    notifyUser(`Offset ${pair} direset ke 0.`);
  }

  global.openCalibrationModal = openCalibrationModal;
  global.applyBrokerPriceCalibration = applyBrokerPriceCalibration;
  global.resetBrokerPriceCalibration = resetBrokerPriceCalibration;
})(window);
