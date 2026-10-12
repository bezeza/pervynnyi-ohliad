/* ===== «Для ШІ» (0.9.4): знеособлений запит + ваші постійні вимоги в кожному запиті. Програма нічого не надсилає — лише копіює. ===== */
const AI_REQ_DEF = [
  'Відповідай українською мовою.',
  'Ти — консультант лікаря (не пацієнта). Рішення ухвалює лікар.',
  'Спирайся на чинні протоколи МОЗ України та міжнародні настанови з найвищим рівнем доказовості (ESC, ERS/ATS, GOLD, GINA, NICE, IDSA, KDIGO тощо); біля кожної рекомендації вкажи джерело і рівень доказовості.',
  'Не вигадуй дозувань і фактів: якщо не впевнений — так і напиши; дози — за інструкцією препарату з урахуванням віку та функції нирок.',
  'Якщо для висновку бракує даних — перелічи, яких саме.',
  'Відповідай стисло, пунктами, без загальних порад.'
].join('\n');
const AI_TASKS = {
  miss:{n:'Що я міг пропустити', t:'Оціни дані пацієнта. 1) Диференційний діагноз — від найімовірнішого, з аргументами «за» і «проти». 2) Які обстеження ще потрібні і чому. 3) Тривожні ознаки («червоні прапорці»), на які треба зважити. 4) Чи відповідає план лікування настановам.'},
  rx:{n:'Перевірити призначення', t:'Перевір лист призначень: показання, дози (з урахуванням віку, маси тіла, функції нирок), шлях і кратність, тривалість, взаємодії, протипоказання з урахуванням алергії та супутніх хвороб, дублювання. Для кожної проблеми — що змінити і джерело.'},
  epi:{n:'Чернетка епікризу', t:'На основі даних склади чернетку виписного епікризу українською мовою за звичною структурою (діагноз, скарги при надходженні, перебіг, обстеження з результатами, лікування, стан при виписці, рекомендації). Не додавай фактів, яких немає в даних; де бракує — постав «[уточнити]».'},
  pam:{n:'Пам’ятка простою мовою', t:'Перепиши рекомендації для пацієнта простою українською мовою (рівень 6–8 класу): як приймати ліки, режим, коли негайно звертатися по допомогу. Без латини і скорочень, короткими реченнями.'},
  own:{n:'Своє питання', t:''}
};
let AI_REQ = lsGet('po.aireq', '') || AI_REQ_DEF;
const AI_KEEP = ['addr','work','card','tel','email','adr','edrpou'];
/* знеособлення: прибрати ПІБ, дату народження, № карти, адреси, телефони, імена лікарів і заклад; дати — відносно дати документа */
function aiScrub(text){
  let t = String(text || ''); const W = [];
  const rep = (s, to) => { if (!s || s.length < 3) return; const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); if (re.test(t)){ t = t.replace(re, to); } };
  const pib = mv('pib'); if (pib){ rep(pib, '[пацієнт]'); pib.split(/\s+/).filter(x=>x.length > 2).forEach(x=>rep(x.replace(/\.$/, ''), '[пацієнт]')); }
  ['doc','zav','nach','golov'].forEach(k=>{ const v = mv(k); if (!v) return; rep(v, '[лікар]'); const sn = v.split(/\s+/)[0]; if (sn && sn.length > 3) rep(sn, '[лікар]'); });
  ['zoz','vidd','pidp'].forEach(k=>rep(mv(k), '[заклад]'));
  AI_KEEP.forEach(k=>rep(mv(k), '[приховано]'));
  t = t.replace(/(?:\+?38)?[\s(-]*0\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, '[телефон]').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]');
  // дати → «день N» відносно дати документа
  const base = (()=>{ const d = mv('dt') || todayISO(); const m = /(\d{4})-(\d{2})-(\d{2})/.exec(d); return m ? new Date(+m[1], m[2] - 1, +m[3]) : new Date(); })();
  const dob = mv('dob'); if (dob){ const m = /(\d{4})-(\d{2})-(\d{2})/.exec(dob); if (m) rep(`${m[3]}.${m[2]}.${m[1]}`, '[дата народження]'); }
  t = t.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})\b/g, (s, d, mo, y)=>{ const yy = +y < 100 ? 2000 + +y : +y; const dt = new Date(yy, mo - 1, +d); if (isNaN(dt)) return s;
    const n = Math.round((dt - base) / 864e5); return n === 0 ? '[день документа]' : n < 0 ? `[${-n} дн. тому]` : `[через ${n} дн.]`; });
  // що могло лишитися — показати лікарю
  if (/\b\d{6,}\b/.test(t)) W.push('довгі числа (номер документа, карти?)');
  if (/вул\.|вулиц|просп\.|буд\.\s*\d|кв\.\s*\d/i.test(t)) W.push('схоже на адресу');
  const caps = (t.match(/(?:^|[\s,(])([А-ЯІЇЄҐ][а-яіїєґ’']{2,}(?:енко|ук|юк|ич|ов|ова|ев|єв|ський|ська|цький|цька|ин|іна|ак|як|ук|чук|ко))(?=[\s,.)])/g) || []).map(s=>s.trim().replace(/^[,(]/, ''));
  const uniq = [...new Set(caps)].filter(x=>!/^(Ступінь|Стадія|Скарги|Анамнез|Об’єктивно|Діагноз|Лікування|Рекомендовано|Пацієнт|Загальний|Пульс|Тони|Живіт|Ушкодження|Ін’єкції)$/.test(x));
  if (uniq.length) W.push('можливі прізвища у вільному тексті: ' + uniq.slice(0, 5).join(', '));
  return {t, W};
}
function aiData(task){
  const L = [], age = mv('age'), sx = sex === 'm' ? 'чоловік' : sex === 'f' ? 'жінка' : '';
  L.push('ПАЦІЄНТ: ' + [sx, age ? age + (/\d$/.test(age) ? ' р.' : '') : ''].filter(Boolean).join(', ') + '. ' + (MODE === 'amb' ? 'Амбулаторний прийом.' : 'Стаціонар.'));
  const wt = has(pv('wt')) ? pv('wt') : NaN, k = renalNow();
  const ex = [has(wt) ? `маса тіла ${dec(wt)} кг` : '', has(pv('cr')) ? `креатинін ${dec(pv('cr'))} мкмоль/л` : '', k ? `${k.l === 'КК' ? 'кліренс креатиніну (Кокрофт–Голт)' : 'ШКФ (CKD-EPI)'} ${k.v} мл/хв` : ''].filter(Boolean);
  if (ex.length) L.push('Дані: ' + ex.join('; ') + '.');
  L.push('', 'ДОКУМЕНТ (' + (DOCNAME[DOC] || DOC) + '):', itext($('#out')).replace(/\n{3,}/g, '\n\n').trim());
  const d = todayISO(), rx = RX.filter(it=>it.drug && (!it.stop || it.stop > d));
  if ((task === 'rx' || task === 'miss' || task === 'epi') && rx.length && DOC !== 'rx')
    L.push('', 'ЛИСТ ПРИЗНАЧЕНЬ:', ...rx.map((it, i)=>`${i + 1}) ${[it.drug, it.dose, it.route, it.freq, it.days ? it.days + ' дн.' : ''].filter(Boolean).join(' ')}${it.note ? ' — ' + it.note : ''}`));
  if ((task === 'epi' || task === 'miss') && RES.length) L.push('', 'РЕЗУЛЬТАТИ ОБСТЕЖЕНЬ:', ...RES.map(r=>`${r.d ? fmtD(r.d) + ': ' : ''}${r.t ? r.t + ' — ' : ''}${r.v}`));
  if (task === 'epi' && DIARIES.length) L.push('', 'ЩОДЕННИКИ:', ...DIARIES.map(x=>x.text || '').filter(Boolean).slice(-10));
  return aiScrub(L.join('\n'));
}
function aiBuild(task, own){
  const T = AI_TASKS[task], D = aiData(task);
  const short = AI_REQ.split('\n').filter(Boolean).slice(0, 4).map(s=>s.replace(/\.$/, '')).join('; ');
  const txt = ['МОЇ ВИМОГИ (дотримуйся їх у всій відповіді):', AI_REQ.trim(), '', 'ЗАВДАННЯ: ' + (task === 'own' ? (own || '…') : T.t), '', D.t, '', 'НАГАДУЮ ВИМОГИ: ' + short + '.'].join('\n');
  return {txt, W:D.W};
}
function aiDialog(){
  if (!itext($('#out')).trim()){ toast('Спершу заповніть документ — текст для запиту береться з нього'); return; }
  let task = lsGet('po.aitask', 'miss'); if (!AI_TASKS[task]) task = 'miss';
  const own = h('textarea', {rows:'2', placeholder:'Ваше питання до ШІ про цього пацієнта', hidden:task === 'own' ? null : ''});
  const req = h('textarea', {rows:'6', 'aria-label':'Мої постійні вимоги'}); req.value = AI_REQ;
  const prev = h('textarea', {rows:'14', class:'aiprev', 'aria-label':'Текст запиту — можна правити'});
  const warn = h('div', {class:'aiwarn'});
  const tasks = h('div', {class:'chips'});
  const draw = () => { const r = aiBuild(task, own.value); prev.value = r.txt; warn.innerHTML = '';
    if (r.W.length) warn.append(h('b', {}, 'Перевірте перед копіюванням: '), r.W.join('; ') + '. Виправте прямо в тексті нижче.');
    warn.hidden = !r.W.length; };
  Object.keys(AI_TASKS).forEach(k=>tasks.append(h('button', {type:'button', class:'chip', 'aria-pressed':k === task ? 'true' : 'false', onclick:e=>{ task = k; lsSet('po.aitask', k); tasks.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed', c === e.currentTarget ? 'true' : 'false')); own.hidden = k !== 'own'; draw(); if (k === 'own') own.focus(); }}, AI_TASKS[k].n)));
  own.addEventListener('input', draw);
  req.addEventListener('input', ()=>{ AI_REQ = req.value; lsSet('po.aireq', AI_REQ); draw(); });
  const doCopy = () => { const t = prev.value;
    const ok = () => { toast('Скопійовано. Вставте у свій чат ШІ (Ctrl+V). Відповідь — лише друга думка, рішення за вами', 4500); close(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ()=>{ prev.select(); document.execCommand('copy'); ok(); });
    else { prev.select(); document.execCommand('copy'); ok(); } };
  const close = () => dlg.remove();
  const dlg = h('div', {class:'navsheet packsheet aidlg', role:'dialog', 'aria-modal':'true', 'aria-label':'Запит для ШІ'}, h('div', {class:'nvbox'},
    h('div', {class:'nshead'}, h('b', {}, '🤖 Запит для ШІ'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('p', {class:'chips-hint'}, 'Програма нічого нікуди не надсилає: вона готує знеособлений текст (без ПІБ, дати народження, № карти, адрес, телефонів, імен лікарів і закладу; дати — «N дн. тому»), а ви вставляєте його у свій чат ШІ. Перед копіюванням перегляньте текст. Відповідь ШІ — друга думка, рішення за лікарем.'),
    h('div', {class:'pstep'}, 'Що зробити'), tasks, own,
    h('details', {class:'fold aireq'}, h('summary', {}, 'Мої постійні вимоги — додаються до кожного запиту на початку й нагадуванням у кінці'), req,
      h('button', {type:'button', class:'more', onclick:()=>{ req.value = AI_REQ = AI_REQ_DEF; lsSet('po.aireq', ''); draw(); }}, 'Повернути стандартні')),
    warn, h('div', {class:'pstep'}, 'Текст запиту (можна правити)'), prev,
    h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn primary', onclick:doCopy}, 'Копіювати запит'), h('span', {class:'chips-hint'}, `≈ ${'{n}'} символів`))));
  const cnt = dlg.querySelector('.acts2 .chips-hint'); const upd = () => { cnt.textContent = `≈ ${prev.value.length} символів`; };
  prev.addEventListener('input', upd);
  dlg.addEventListener('click', e=>{ if (e.target === dlg) close(); });
  document.addEventListener('keydown', function k(e){ if (e.key === 'Escape' && document.body.contains(dlg)){ close(); document.removeEventListener('keydown', k); } });
  document.body.append(dlg); draw(); upd();
}
{ const acts = $('#outBox .oh .acts'), sw = acts && acts.querySelector('.savewrap');
  const b = h('button', {type:'button', class:'btn', id:'aiBtn', title:'Знеособлений запит до ШІ з вашими постійними вимогами — копіюється, програма нічого не надсилає', onclick:aiDialog}, '🤖', h('span', {class:'hide-m'}, ' Для ШІ'));
  if (sw) sw.after(b); else if (acts) acts.append(b); }
{ const si4 = searchItems; searchItems = function(){ const L = si4(); L.push({k:'Дія', t:'Запит для ШІ (знеособлений, з моїми вимогами)', s:'', go:aiDialog}); return L; }; }
