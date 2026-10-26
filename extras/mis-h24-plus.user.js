// ==UserScript==
// @name         МІС Health24+ для «Первинного огляду»
// @namespace    github.com/bezeza/pervynnyi-ohliad
// @version      1.0.0
// @description  Кнопка «→ ПО» біля пацієнта (ПІБ, стать, дата народження в буфер для «Первинного огляду»), приховування порожніх розділів «(0)», підтвердження перед «Внести запис як помилковий» і «Закрити епізод». Працює лише у вашому браузері, у МІС нічого не записує.
// @author       bezeza
// @license      AGPL-3.0-only
// @match        https://mis.h24.ua/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const css = document.createElement('style');
  css.textContent = `
    .mhp-btn { margin-left: 8px; padding: 1px 8px; font: 500 12px/1.6 inherit; border-radius: 6px; cursor: pointer; vertical-align: middle;
      border: 1px solid var(--mh-blue, #4d7396); color: var(--mh-blue, #4d7396) !important; background: transparent; }
    .mhp-btn:hover { background: var(--mh-blue, #4d7396); color: #fff !important; }
    .mhp-empty { display: none !important; }
    body.mhp-showall .mhp-empty { display: block !important; opacity: .6; }
    .mhp-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 99999; padding: 8px 16px; border-radius: 8px;
      background: #2f3337; color: #f3f1ec; font: 14px/1.4 sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.25); pointer-events: none; }`;
  document.head.append(css);
  const toast = (m) => { const t = document.createElement('div'); t.className = 'mhp-toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); };
  const txt = (e) => (e && e.textContent || '').replace(/\s+/g, ' ').trim();
  const copy = (t) => {
    if (typeof GM_setClipboard === 'function') { GM_setClipboard(t, 'text'); return Promise.resolve(); }
    return navigator.clipboard.writeText(t);
  };

  /* 1. «→ ПО»: ПІБ ↵ «Ч.,21 квітня 1973» — формат, який розпізнає «Первинний огляд» (Ctrl+V) */
  function addCopyButtons() {
    document.querySelectorAll('h24-patient-short-info').forEach((si) => {
      const box = si.closest('.info-patient, .patient-item'); if (!box || box.dataset.mhp) return;
      const nameEl = box.querySelector('[data-test="patientFullName"], .patient_title > span');
      const g = txt(si.querySelector('[data-test="gender"]')), b = txt(si.querySelector('[data-test="birthDate"]'));
      if (!nameEl || !txt(nameEl) || !b) return;
      box.dataset.mhp = '1';
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'mhp-btn'; btn.textContent = '→ ПО';
      btn.title = 'Скопіювати ПІБ, стать і дату народження для «Первинного огляду» (там — Ctrl+V)';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const pib = txt(nameEl);
        copy(pib + '\n' + g.replace(/\s/g, '') + txt(si.querySelector('[data-test="birthDate"]')))
          .then(() => toast('Скопійовано: ' + pib + ' — у «Первинному огляді» натисніть Ctrl+V'), () => toast('Не вдалося скопіювати'));
      });
      (nameEl.closest('a') || nameEl).after(btn);
    });
  }

  /* 2. Порожні розділи «(0)» / «: 0» у записі — сховати; кнопка «Показати порожні» */
  function hideEmpty() {
    let n = 0;
    document.querySelectorAll('h24-group-template.entity-group > .group').forEach((g) => {
      const empty = /\(0\)\s*$|:\s*0\s*$/.test(txt(g.querySelector('.group-top .title')));
      g.classList.toggle('mhp-empty', empty); if (empty) n++;
    });
    const outer = document.querySelector('h24-group-template.entity-group')?.closest('.group_content')?.parentElement;
    const top = outer && outer.querySelector(':scope > .group-top'); if (!top) return;
    let b = top.querySelector('.mhp-btn');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'mhp-btn';
      b.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.toggle('mhp-showall'); hideEmpty(); });
      (top.querySelector('.group-title_wrap') || top).append(b);
    }
    const label = document.body.classList.contains('mhp-showall') ? 'Сховати порожні' : 'Показати порожні (' + n + ')';
    if (b.textContent !== label) b.textContent = label;
    b.hidden = !n;
  }

  /* 3. Підтвердження перед незворотними діями (спрацьовує раніше за обробник МІС) */
  const RISKY = [[/помилков/i, 'Запис буде позначено як помилковий в ЕСОЗ. Цю дію не скасувати.'], [/закрити епізод/i, 'Епізод лікування буде закрито.']];
  window.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.appBtn.__red, button'); if (!b) return;
    const t = txt(b), r = RISKY.find(([re]) => re.test(t)); if (!r) return;
    const who = txt(document.querySelector('.patient-container .ng-value')) || (document.title.split('|')[1] || '').trim();
    if (!confirm('«' + t + '»' + (who ? '\nПацієнт: ' + who : '') + '\n\n' + r[1] + '\n\nПродовжити?')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  let q = 0;
  const run = () => { q = 0; addCopyButtons(); hideEmpty(); };
  new MutationObserver(() => { if (!q) q = requestAnimationFrame(run); }).observe(document.body, {childList: true, subtree: true, characterData: true});
  run();
})();
