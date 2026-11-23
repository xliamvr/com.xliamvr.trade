/**
 * ui-picker.js — Custom Bottom-Sheet Option Picker
 * Menggantikan <select> pop-up bawaan Android dengan UI Sheet modern yang rapi,
 * kompak, dan mendukung Dark/Light mode tanpa mengubah logika <select> asli.
 */
(function () {
  'use strict';

  const TARGET_SELECT_IDS = [
    'active-account-select',
    'signal-method-select',
    'chart-pair-select'
  ];

  function ensureSheetModal() {
    let modal = document.getElementById('custom-option-sheet');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'custom-option-sheet';
    modal.className = 'hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center p-3';
    modal.innerHTML = `
      <div class="glass-card w-full max-w-md rounded-2xl p-4 space-y-2.5 border border-slate-700 animate-[fadeSlideIn_0.16s_ease-out]">
        <div class="flex items-center justify-between pb-1 border-b border-slate-800">
          <span id="custom-sheet-title" class="text-xs font-extrabold uppercase tracking-wider text-sky-400">PILIH OPSI</span>
          <button type="button" id="custom-sheet-close" class="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">✕</button>
        </div>
        <div id="custom-sheet-list" class="max-h-[55vh] overflow-y-auto space-y-1.5 pr-0.5"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
    document.getElementById('custom-sheet-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    return modal;
  }

  function openSheetForSelect(selectEl, titleText) {
    const modal = ensureSheetModal();
    const titleEl = document.getElementById('custom-sheet-title');
    const listEl = document.getElementById('custom-sheet-list');
    if (!titleEl || !listEl) return;

    titleEl.textContent = titleText || 'PILIH OPSI';
    const options = Array.from(selectEl.options);

    listEl.innerHTML = options
      .map((opt) => {
        const isSelected = opt.value === selectEl.value;
        return `
          <button type="button" data-opt-val="${opt.value}"
            class="w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition active:scale-98 ${
              isSelected
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-slate-900/85 border-slate-800 text-slate-200'
            }">
            <span class="leading-snug">${opt.textContent}</span>
            ${isSelected ? '<span class="text-xs font-extrabold shrink-0">✓</span>' : ''}
          </button>
        `;
      })
      .join('');

    listEl.querySelectorAll('button[data-opt-val]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-opt-val');
        selectEl.value = val;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        syncTriggerLabel(selectEl);
        modal.classList.add('hidden');
      });
    });

    modal.classList.remove('hidden');
  }

  function syncTriggerLabel(selectEl) {
    const btn = document.getElementById(`trigger-${selectEl.id}`);
    if (!btn) return;
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    const labelSpan = btn.querySelector('.picker-label-text');
    if (labelSpan && selectedOpt) {
      labelSpan.textContent = selectedOpt.textContent;
    }
  }

  function enhanceSelect(selectId, titleText) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl || selectEl.dataset.enhanced === '1') return;

    selectEl.dataset.enhanced = '1';
    selectEl.classList.add('hidden');

    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.id = `trigger-${selectId}`;
    triggerBtn.className = selectEl.className.replace('hidden', '') + ' flex items-center justify-between gap-2 text-left cursor-pointer active:scale-98 transition';
    triggerBtn.innerHTML = `
      <span class="picker-label-text truncate">${selectEl.options[selectEl.selectedIndex]?.textContent || 'Pilih...'}</span>
      <span class="text-[10px] opacity-80 shrink-0">▼</span>
    `;

    triggerBtn.addEventListener('click', () => openSheetForSelect(selectEl, titleText));
    selectEl.parentNode.insertBefore(triggerBtn, selectEl.nextSibling);

    // Pantau perubahan option dinamis (seperti daftar akun Prop Firm)
    const observer = new MutationObserver(() => syncTriggerLabel(selectEl));
    observer.observe(selectEl, { childList: true, subtree: true, attributes: true });
  }

  function initCustomPickers() {
    enhanceSelect('active-account-select', 'PILIH AKUN PROP FIRM AKTIF');
    enhanceSelect('signal-method-select', 'PILIH METODE ANALISIS ICT / SMC');
    enhanceSelect('chart-pair-select', 'PILIH PAIR LIVE CHART');

    setInterval(() => {
      TARGET_SELECT_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) syncTriggerLabel(el);
      });
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomPickers);
  } else {
    initCustomPickers();
  }
})();
