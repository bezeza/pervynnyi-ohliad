/* ===== Менше ходіння вкладками (0.9.3.9):
   1) «Створити з огляду» — консультаційний висновок, направлення, довідка… одним кліком із первинного огляду; у документі — «← Первинний огляд»;
   2) обґрунтованість перебування (наказ МОЗ № 1044) — підбір підстав кнопками з пунктом Стандарту і повною назвою;
   3) пропуски на бланку (t°, АТ, ЧСС…) — вписати просто на аркуші; перехід до поля закриває панель тексту на телефоні. ===== */
const N1044 = 'Стандарту «Критерії госпіталізації пацієнтів для надання стаціонарної медичної допомоги», затвердженого наказом МОЗ України від 30.07.2026 № 1044';
const STAY_PRE = 'Обґрунтованість перебування в стаціонарі зберігається відповідно до ' + N1044 + ': ';
const STAY_END = 'Підстав для продовження цілодобового медичного нагляду немає (' + N1044.replace(/^Стандарту/, 'Стандарт').replace('затвердженого', 'затверджений') + ') — планується виписка.';
const STAYC = [
  ['погіршення стану, що потребує цілодобового медичного нагляду (розд. I, п. 4)', 'Погіршення, цілодобовий нагляд · I.4'],
  ['кисневотерапія з титруванням SpO2 (розд. II, п. 1)', 'Кисневотерапія · II.1'],
  ['SpO2 ≤ 92% при диханні атмосферним повітрям (розд. III, п. 1)', 'SpO2 ≤ 92% · III.1'],
  ['ЧД ≥ 30/хв з ознаками дихального дистресу (розд. III, п. 1)', 'ЧД ≥ 30 · III.1'],
  ['парентеральна терапія, що потребує спеціалізованого моніторингу (розд. II, п. 5)', 'Парентеральна терапія · II.5'],
  ['внутрішньовенна антибактеріальна терапія з потребою частого нагляду (розд. II, п. 6)', 'В/в антибіотик · II.6'],
  ['часті небулайзерні інгаляції і системні глюкокортикостероїди (п. IV.1.5)', 'Небулайзер + ГКС · IV.1.5']
];
/* автоматичні підстави з показників → у повну форму */
function stayAutoText(){
  const S = stayJust(); if (S.reasons.length) return STAY_PRE + S.reasons.map(r=>r.replace(/\(п\. (I{1,3})\.(\d+)\)/, '(розд. $1, п. $2)')).join('; ') + '.';
  return S.text ? (F('d_main.dyn').el.value === '2' ? STAY_END : S.text) : '';
}
{ /* поле «Обґрунтованість перебування»: повна назва Стандарту і підбір підстав */
  const f = F('d_lik.osn');
  if (f){
    f.fallback = stayAutoText;
    if (f.qbox) f.qbox.querySelectorAll('.chip.q').forEach(c=>{ if (/№ 1044/.test(c.dataset.raw || '')) c.remove(); });
    const box = h('div', {class:'stayc'});
    f.wrapEl.append(box);
    const cur = () => { const t = f.el.value.trim() || stayAutoText(); return t.startsWith(STAY_PRE) ? t.slice(STAY_PRE.length).replace(/\.$/, '').split(/;\s*/).filter(Boolean) : []; };
    const write = list => { f.el.value = list.length ? STAY_PRE + list.join('; ') + '.' : ''; update(); };
    const kritFor = () => (curKey && typeof KRIT !== 'undefined' && KRIT[curKey]) ? KRIT[curKey] : [];
    SHELL.drawStay = () => {
      box.innerHTML = '';
      const L = cur(), S = stayJust();
      const code = t => (t.match(/\((?:розд\.|п\.)[^)]*\)/) || [''])[0].replace(/розд\. (I{1,3}|IV|V), п\. (\d+)/, '$1.$2').replace(/[^IV\d.]/g, '');
      const key = t => code(t) + '|' + t.trim().split(/\s/)[0].toLowerCase();
      const auto = new Set(S.reasons.map(r=>key(r.replace(/\(п\. (I{1,3})\.(\d+)\)/, '(розд. $1, п. $2)'))));
      const chip = (t, l, sug) => { const on = L.some(x=>key(x) === key(t));
        return h('button', {type:'button', class:'chip q' + (sug ? ' sug' : ''), 'aria-pressed':on ? 'true' : 'false', title:t + (sug ? ' — є за показниками / призначеннями' : ''),
          onclick:()=>{ const now = cur(); write(on ? now.filter(x=>key(x) !== key(t)) : [...now, t]); }}, l); };
      box.append(h('div', {class:'stayh'}, 'Підстави за ', h('b', {}, 'наказом МОЗ № 1044'), ' — натисніть, щоб додати чи прибрати (підсвічено ті, що є за показниками й призначеннями):'));
      box.append(h('div', {class:'chips'}, ...STAYC.map(([t, l])=>chip(t, l, auto.has(key(t))))));
      const K = kritFor();
      if (K.length){ const p = PRESETS.find(x=>x.key === curKey);
        box.append(h('div', {class:'stayh'}, 'Для «' + (p ? p.name : '') + '»:'), h('div', {class:'chips'}, ...K.map(t=>chip(t, t.length > 70 ? t.slice(0, 68) + '…' : t, false)))); }
      box.append(h('div', {class:'chips'}, h('button', {type:'button', class:'chip q', onclick:()=>{ f.el.value = STAY_END; update(); }}, 'Підстав немає — виписка'),
        h('button', {type:'button', class:'more', onclick:()=>{ f.el.value = ''; update(); }}, 'Автоматично за показниками')));
      box.append(h('p', {class:'chips-hint'}, 'Пункти — за текстом Стандарту; звіряйте з офіційною редакцією наказу.'));
    };
  }
}
{ /* «Створити з огляду» */
  const db = $('.docbar');
  const wrap = h('span', {class:'savewrap mkdoc'});
  const menu = h('div', {class:'savemenu', role:'menu', hidden:''});
  const btn = h('button', {type:'button', class:'btn', id:'mkDocBtn', 'aria-haspopup':'menu', title:'Новий документ на основі цього огляду: скарги, анамнез, об’єктивно й діагноз підставляться самі',
    onclick:e=>{ e.stopPropagation(); fill(); menu.hidden = !menu.hidden; }}, '＋ Документ з огляду ▾');
  const DESC = {kons:'скарги, анамнез, об’єктивно, діагноз', gosp:'діагноз, стан, критерії', napr:'діагноз, мета', dov:'діагноз, період', pam:'рекомендації за хворобою', shch:'стан і динаміка з огляду',
    epi:'анамнез, діагноз, лікування', zav:'скарги, об’єктивно, діагноз', konc:'діагноз, стан', etap:'перебіг, діагноз', per:'перебіг, діагноз', zgoda:'діагноз, втручання'};
  function fill(){
    menu.innerHTML = '';
    [...DOCLIST[MODE], ...DOCMORE[MODE]].filter(([k])=>k !== 'ohl' && k !== 'rx').forEach(([k, l])=>menu.append(h('button', {type:'button', role:'menuitem', onclick:()=>{ menu.hidden = true; goDocFromExam(k); }},
      h('b', {}, l), h('span', {}, DESC[k] ? 'з огляду: ' + DESC[k] : 'дані з огляду'))));
  }
  wrap.append(btn, menu);
  if (db) db.append(wrap);
  document.addEventListener('click', e=>{ if (!menu.hidden && !wrap.contains(e.target)) menu.hidden = true; });
  /* «← Первинний огляд» у кожному іншому документі */
  const back = h('button', {type:'button', class:'btn', id:'backExam', title:'Повернутися до первинного огляду', onclick:()=>switchDoc('ohl')}, '← Первинний огляд');
  if (db) db.append(back);
  SHELL.syncLinks = () => { wrap.hidden = DOC !== 'ohl'; back.hidden = DOC === 'ohl' || DOC === 'rx'; };
  SHELL.syncLinks();
}
function goDocFromExam(k){
  switchDoc(k);
  if (k === 'kons'){ const t = TABS.find(x=>x.id === 'k_main'); if (t) show(TABS.indexOf(t)); }
  toast('Взято з первинного огляду — правте прямо тут, на вкладки огляду ходити не треба', 3200);
}
{ /* консультація: одна кнопка «підставити з огляду для правки» */
  const S = SECTIONS.find(x=>x.id === 'k_main');
  const a = S && S.panel && S.panel.querySelector('.ph .acts2');
  if (a) a.prepend(h('button', {type:'button', class:'btn', title:'Вписати в поля скарги, анамнез і об’єктивно з первинного огляду, щоб відредагувати', onclick:()=>{
    ['sk','anam','obj'].forEach(id=>{ const f = F('k_main.' + id); if (f && !f.el.value.trim() && f.fallback) f.el.value = f.fallback() || ''; }); update(); toast('Підставлено з первинного огляду — відредагуйте за потреби');
  }}, 'Підставити з огляду'));
}
/* перехід до поля: на телефоні й у «Один стовпчик» спершу закрити панель тексту */
{ const gt0 = goTab; goTab = function(){ const ob = $('#outBox'); if (ob && ob.classList.contains('open')) ob.classList.remove('open'); return gt0.apply(this, arguments); }; }
/* пропуски на бланку щоденника — вписати на місці */
function bQuickEdit(anchor, ids){
  document.querySelectorAll('.bqe').forEach(x=>x.remove());
  const LBL = Object.assign({}, ...[46,47,48,49,50,51,52,53].map(n=>{ const f = F('e_obs.z' + n); return f ? {['e_obs_z' + n]:f.label} : {}; }), {d_obj_t_0:'t, °C', d_obj_ad_0:'АТ сист.', d_obj_ad_1:'АТ діаст.', d_obj_chss_0:'Пульс', d_obj_chd_0:'ЧД', d_obj_chd_1:'SpO2, %'});
  const ins = ids.map(id=>{ const src = document.getElementById(id); const i = h('input', {inputmode:/^e_obs/.test(id) ? 'text' : 'decimal', value:src ? src.value : '', 'aria-label':LBL[id] || id, placeholder:src ? src.placeholder : ''}); return [id, i]; });
  const save = () => { ins.forEach(([id, i])=>{ const src = document.getElementById(id); if (src && src.value !== i.value){ src.value = i.value; src.dispatchEvent(new Event('input', {bubbles:true})); } }); pop.remove(); update(); renderPaper(); };
  const pop = h('div', {class:'bqe', role:'dialog', 'aria-label':'Вписати показники'},
    h('b', {}, /^e_obs/.test(ids[0]) ? 'Вписати в епікриз' : 'Вписати в щоденник'),
    h('div', {class:'bqg' + (ids.length === 1 ? ' one' : '')}, ...ins.map(([id, i])=>h('label', {}, h('span', {}, LBL[id] || id), i))),
    h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:save}, 'Готово'), h('button', {type:'button', class:'more', onclick:()=>pop.remove()}, 'Скасувати'),
      h('button', {type:'button', class:'more', onclick:()=>{ pop.remove(); goTab(/^e_obs/.test(ids[0]) ? 'e_obs' : 'd_obj', ids[0]); }}, 'До поля у формі')));
  ins.forEach(([, i])=>i.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); save(); } if (e.key === 'Escape') pop.remove(); }));
  const r = anchor.getBoundingClientRect();
  pop.style.top = Math.min(window.innerHeight - 220, Math.max(8, r.bottom + 6)) + 'px';
  document.body.append(pop);
  pop.style.left = Math.min(window.innerWidth - pop.offsetWidth - 8, Math.max(8, r.left - 20)) + 'px';
  pop.style.top = Math.min(window.innerHeight - pop.offsetHeight - 8, Math.max(8, r.bottom + 6)) + 'px'; setTimeout(()=>{ const f = ins.find(([, i])=>!i.value) || ins[0]; f[1].focus(); }, 30);
}
document.addEventListener('click', e=>{
  const g = e.target.closest && e.target.closest('#paper .bdi.bcur [data-fld], #paper .bepi [data-fld]');
  if (g){ e.preventDefault(); bQuickEdit(g, g.dataset.fld.split(' ')); return; }
  const q = document.querySelector('.bqe'); if (q && !q.contains(e.target)) q.remove();
});
{ const u0 = update; update = function(){ const r = u0.apply(this, arguments); try{ SHELL.syncLinks(); if (DOC === 'shch' && SHELL.drawStay) SHELL.drawStay(); }catch(e){} return r; }; }
/* дата і час запису щоденника — вибирається тут (за нею рахується день перебування); можна вести історію за минулі дні */
let DDPIN = false;
{ const md = document.getElementById('meta_dt');
  const tb = SECTIONS.find(x=>x.id === 'd_main').panel.querySelector('.dtpl');
  if (md && tb){
    const inp = h('input', {type:'datetime-local', class:'ddt', 'aria-label':'Дата і час запису щоденника'});
    const day = h('span', {class:'chips-hint ddt-n'});
    const now = h('button', {type:'button', class:'btn', title:'Поставити поточні дату й час', onclick:()=>{ DDPIN = false; setNow(); md.dispatchEvent(new Event('input', {bubbles:true})); update(); }}, 'Зараз');
    const prev = h('button', {type:'button', class:'btn', title:'На день раніше', 'aria-label':'На день раніше', onclick:()=>shift(-1)}, '‹');
    const next = h('button', {type:'button', class:'btn', title:'На день пізніше', 'aria-label':'На день пізніше', onclick:()=>shift(1)}, '›');
    const set = v => { if (!v) return; DDPIN = true; md.value = v; md.dispatchEvent(new Event('input', {bubbles:true})); md.dispatchEvent(new Event('change', {bubbles:true})); const di = document.getElementById('d_main_den_0'); if (di) delete di.dataset.user; update(); };
    function shift(k){ const v = md.value || ''; const d = new Date((v.split('T')[0] || todayISO()) + 'T00:00'); d.setDate(d.getDate() + k);
      set(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${(v.split('T')[1] || '09:00')}`); }
    inp.addEventListener('change', ()=>set(inp.value));
    const row = h('div', {class:'res-form ddt-row'}, h('span', {class:'lbl', style:'margin:0'}, 'Дата запису'), prev, inp, next, now, day);
    const adm = tb.querySelector('.adm-d'); const ar = adm && adm.closest('.res-form');
    if (ar) ar.after(row); else tb.prepend(row);
    SHELL.syncDDT = () => { if (document.activeElement !== inp) inp.value = md.value || ''; const n = stayDay();
      day.textContent = n ? `${n}-й день перебування` + (DDPIN ? ' · дата закріплена (не змінюється на сьогоднішню)' : '') : (DDPIN ? 'дата закріплена' : 'вкажіть дату надходження — порахую день перебування'); };
    /* закріплена дата не перезаписується «зараз» при заповненні */
    const sn0 = setNow; setNow = function(){ if (DOC === 'shch' && DDPIN) return; return sn0.apply(this, arguments); };
    /* після «Записати в журнал» із закріпленою датою — наступний день */
    const sd0 = saveDiary; saveDiary = function(){ const n = DIARIES.length; const r = sd0.apply(this, arguments);
      if (DDPIN && DIARIES.length > n){ shift(1); toast('Записано. Наступний запис — ' + fmtD((md.value || '').split('T')[0]) + ' (можна змінити)', 3500); }
      return r; };
  }
}
{ const u1 = update; update = function(){ const r = u1.apply(this, arguments); try{ if (DOC === 'shch' && SHELL.syncDDT) SHELL.syncDDT(); }catch(e){} return r; }; }
/* ===== Клік по пункту на аркуші «Перед друком» → відкрити розділ і поле у формі, курсор — на початок, поле блимає ===== */
const BMAP = [
  [/^Хворий/, 'meta_pib'], [/^1\. Дата госпіталізації/, 'meta_dt'], [/^3\. Прізвище/, 'meta_pib'], [/^4\. Дата народження/, 'meta_dob'], [/^7\. Постійне місце/, 'meta_addr'],
  [/^8\. Місце роботи/, 'meta_work'], [/^9\. Ким направлений/, 'morbi.hosp'], [/^10\. Діагноз при госпіталізації/, 'dx.osn'], [/^13\. Госпіталізація: ургентна/, 'hosp.vyd'],
  [/^18\. Алергічні/, 'vitae.alerg'], [/^20\. Дата виписки/, 'e_per.per'],
  [/^33\. Скарги/, 'skarhy.c'], [/^34\. Anamnesis morbi/, 'morbi'], [/^35\. Anamnesis vitae/, 'vitae'], [/^Алергічні реакції/, 'vitae.alerg'], [/^Перенесені захворювання/, 'vitae'],
  [/^36\. Об’єктивні дані|^Загальний стан/, 'zah.stan'], [/^Свідомість/, 'zah'], [/^Шкіра|^Видимі слизові|^Варикозне/, 'shk'], [/^Харчування/, 'zah'], [/^Зріст/, 'zah_hw_0'],
  [/^Периф\. л\/в|^Щитоподібна/, 'shk'], [/^Система органів дихання|^Перкуторно над легенями/, 'dyh'], [/^Аускультативно:/, 'dyh'], [/^Хрипи/, 'dyh.hr'],
  [/^Температура тіла:/, 'zah'], [/^Серцево-судинна система|^А\/Т|^Межі серця|^Тони серця/, 'ssc'], [/^Система травлення|^Живіт:/, 'trav'],
  [/^С-м подразнення очеревини/, 'trav'], [/^С-м Пастернацького|^Сечовипускання/, 'sech'], [/^Випорожнення/, 'trav'], [/^Неврологічний статус/, 'nevr'],
  [/^DIAGNOS|^Діагноз|^На підставі/, 'dx.osn'], [/^ОБСТЕЖЕННЯ/, 'dx.plan'], [/^ЛІКУВАННЯ|^РЕЖИМ/, 'rxt'], [/^КОНСУЛЬТАЦІЯ/, 'dx'],
  [/^45\. ЕПІКРИЗ/, 'e_per'], [/^Медична карта стаціонарного хворого №/, 'meta_card'], [/^Дані обстеження/, 'e_obs'], [/^54\. Діагноз|^Додаткові діагнози/, 'dx.osn'],
  [/^55\. Медичне лікування/, 'e_lik.lik'], [/^56\. Лікувальні рекомендації/, 'e_rek'], [/^57\. Результат/, 'e_lik.rez'],
  /* щоденник (поточний запис) */
  [/^Скарги/, 'd_main.sk'], [/^Об’єктивно/, 'd_obj'], [/^Набряки/, 'd_obj.nab'], [/^Аускультативно в легенях|^Дихання/, 'd_obj.dyh'], [/^Діяльність серця|^Тони/, 'd_obj.serce'],
  [/^Живіт/, 'd_obj.zhyv'], [/^Випорожнення|^Сечовипускання/, 'd_obj.fiz'], [/^Лікування|^Призначено/, 'd_lik.kor'], [/^Дата\b/, 'meta_dt']
];
function bGo(fld){
  if (fld === 'rxt'){ goTab('rxt'); return; }
  if (fld === 'meta_dt' && DOC === 'shch'){ goTab('d_main'); setTimeout(()=>{ const i = document.querySelector('.ddt'); if (!i) return; const w = i.closest('.res-form') || i; w.scrollIntoView({block:'center', behavior:'smooth'}); i.focus({preventScroll:true}); w.classList.remove('fieldflash'); void w.offsetWidth; w.classList.add('fieldflash'); setTimeout(()=>w.classList.remove('fieldflash'), 2600); }, 80); return; }
  const sec = /^meta_/.test(fld) ? 'meta' : fld.split(/[._]/)[0] === 'e' || fld.split(/[._]/)[0] === 'd' ? fld.split('.')[0].split('_').slice(0, 2).join('_') : fld.split(/[._]/)[0];
  const S = SECTIONS.find(x=>x.id === sec);
  const target = /\./.test(fld) || /_\d$/.test(fld) || /^meta_/.test(fld) ? fld : null;
  /* розділ без поля — перше поле розділу */
  const first = !target && S ? (S.fields.find(f=>!f.noOut && f.type !== 'hdr' && (!f.docs || f.docs.includes(DOC)) && !(f.when && !f.when()) && f.wrapEl && !f.wrapEl.hidden) || {}) : null;
  goTab(sec, target || (first && first.id ? sec + '.' + first.id : null));
}
document.addEventListener('click', e=>{
  const t = e.target; if (!t.closest || !t.closest('#paper')) return;
  if (t.closest('[data-fld], .gap, .gapbar, .gaplist, .blankbar, button, a, input, label')) return;
  /* «Текст документа»: блок розділу */
  const ds = t.closest('#paper [data-sec]');
  if (ds && !t.closest('.b003')){ const sid = ds.dataset.sec; bGo(sid === 'rxt' ? 'rxt' : sid); return; }
  const pg = t.closest('.b003'); if (!pg) return;
  const di = t.closest('.bdi'); if (di && !di.classList.contains('bcur')){ toast('Це запис із журналу — відкрийте його в журналі щоденника', 2500); return; }
  let row = t.closest('.brow, .bt2, .bt, .blines, .bdx, .bdl'); if (!row) return;
  if (row.classList.contains('bdl')){ bGo('d_obj.t'); return; }
  let txt = row.textContent.trim(), n = row;
  /* лінійки під заголовком — шукаємо заголовок вище */
  for (let k = 0; k < 4 && !BMAP.some(([re])=>re.test(txt)) && n.previousElementSibling; k++){ n = n.previousElementSibling; txt = n.textContent.trim(); }
  const hit = BMAP.find(([re])=>re.test(txt)); if (!hit) return;
  let fld = hit[1];
  if (di) fld = fld.replace(/^dyh$/, 'd_obj.dyh');
  if (DOC === 'shch' && /^(dx|zah|shk|dyh|ssc|trav|sech|nevr|skarhy|morbi|vitae)/.test(fld)){ toast('Це поле — у первинному огляді', 2000); return; }
  bGo(fld);
});
/* курсор — на початок поля; якщо список показано кнопками — фокус на вибрану кнопку */
function bFocusIn(wrap, el){
  const vis = x => x && x.offsetParent !== null && !x.closest('[hidden]');
  let t = vis(el) ? el : null;
  if (!t) t = [...wrap.querySelectorAll('.chip[aria-pressed="true"], input:not([type=hidden]), textarea, select, .chip, button')].find(vis) || null;
  if (!t) return;
  try{ t.focus({preventScroll:true}); }catch(e){}
  if (t.setSelectionRange && /^(text|search|)$/.test(t.type || '')){ try{ t.setSelectionRange(0, 0); t.scrollTop = 0; }catch(e){} }
}
{ const gf0 = goField; goField = function(fld){
    { const f0 = /\./.test(fld) ? F(fld) : null; if (f0 && f0.dHide){ DSHOWALL = true; applyDProfile.sig = null; update(); } }
    const r = gf0.apply(this, arguments);
    let el = null; if (/\./.test(fld)){ const f = F(fld); if (f) el = f.el || (f.inputs && f.inputs[0]) || f.d1 || (f.chips && f.chips[0]) || f.abox || (f.wrapEl && f.wrapEl.querySelector('input,select,textarea,button')) || null; if (!el && f && f.wrapEl) el = f.wrapEl; } else el = document.getElementById(fld);
    if (el){ const wrap = el.closest('.f') || el.closest('.res-form') || el;
      if (!wrap.classList.contains('fieldflash')){ try{ wrap.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){} wrap.classList.add('fieldflash'); setTimeout(()=>wrap.classList.remove('fieldflash'), 2600); }
      bFocusIn(wrap, el); }
    return r; }; }
