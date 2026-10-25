/* 0.9.3.48 — виправлення після аудиту друкованих бланків.
   Не додає медичних висновків: друкує лише введені значення, прибирає непідтверджені фрази
   та спрямовує клік до вже наявного поля. */

/* Старі записи щоденника могли зберегтися до появи власних полів _own.
   Для них прибираємо фрази-норми, які не підтверджені даними. */
{ const entry0 = bDiaryEntry; bDiaryEntry = function(e){
  const root = entry0.apply(this, arguments), fields = e && e.f || {};
  const legacy = e && !e.cur && !Object.keys(fields).some(key=>key.endsWith('_own'));
  const rows = [...root.querySelectorAll('.bdr>.brow')];
  if (legacy){
    const value = key => bDv(fields, key);
    const general = rows.find(row=>/^Об’єктивно/.test(row.textContent.trim()));
    if (general){
      const dyn = (value('d_main.dyn').match(/з позитивною динамікою|покращився|погіршився|без суттєвої динаміки/) || [''])[0];
      general.replaceChildren(h('span', {class:'bl'}, 'Об’єктивно: загальний стан '), bFill([value('d_main.stan'), dyn].filter(Boolean).join(', '), true));
    }
    const skin = rows.find(row=>/^Реакція на огляд/.test(row.textContent.trim()));
    if (skin) skin.replaceChildren(h('span', {class:'bl'}, 'Шкірні покриви та видимі слизові '), bFill(value('d_obj.shk').replace(/^Шкірні покриви /, ''), false, true));
    const abdomen = rows.find(row=>/^Живіт/.test(row.textContent.trim()));
    if (abdomen) abdomen.replaceChildren(h('span', {class:'bl'}, 'Живіт при пальпації '), bFill(value('d_obj.zhyv'), false, true));
    const stool = rows.find(row=>/^Випорожнення/.test(row.textContent.trim()));
    if (stool){
      const raw = value('d_obj.fiz');
      const result = /регулярні/.test(raw) ? 'регулярні' : /Рідкі/.test(raw) ? 'рідкі' : /Затримка/.test(raw) ? 'затримка' : '';
      stool.replaceChildren(h('span', {class:'bl'}, 'Випорожнення '), bFill(result, false, true));
    }
  }
  /* У поточному щоденнику клік по підпису показника має відкривати його рядок,
     а не завжди редактор температури. */
  if (e && e.cur){
    const left = root.querySelector('.bdl');
    if (left) [...left.children].forEach(row=>{
      const text = row.textContent.trim();
      const key = /^Дата\b/.test(text) ? 'date' : /^T\s*[–-]/i.test(text) ? 'temp' : /^Ps\s*[–-]/i.test(text) ? 'pulse' : /^АТ\s*[–-]/i.test(text) ? 'pressure' : /^ЧДР\s*[–-]/i.test(text) ? 'breath' : '';
      if (key && typeof diaryInlineMark === 'function') diaryInlineMark(row, key);
    });
  }
  return root;
}; }

/* Категорія резистентності 003/о відповідає однойменному вибору в 066/о.
   Порожнє джерело лишається порожнім; при кліку відкриваємо саме це поле. */
{ const epi0 = bEpi; bEpi = function(){
  const pages = epi0.apply(this, arguments), source = F('s066.tbres');
  const row = pages.flatMap(page=>[...page.querySelectorAll('.brow')]).find(item=>/^Категорія резистентності:/.test(item.textContent.trim()));
  if (row && source){
    row.dataset.s66fld = 'tbres'; row.title = 'Відкрити це поле у формі 066/о';
    const index = S66('tbres'), box = row.querySelector('.bbox');
    if (box && index >= 0) box.textContent = String(index + 1);
  }
  return pages;
}; }
document.addEventListener('click', e=>{
  const row = e.target.closest && e.target.closest('#paper .bepi2 .brow[data-s66fld="tbres"]');
  if (!row) return;
  e.preventDefault(); e.stopImmediatePropagation();
  switchDoc('f066');
  setTimeout(()=>goTab('s066', 's066.tbres'), 0);
}, true);

/* У протоколі анестезії не підставляємо місце переведення без вибору лікаря.
   Розділ пункції показуємо лише після введення її основного типу/рівня/дози;
   рядок підпису анестезіолога лишається на бланку завжди. */
{ const anest0 = b333c; b333c = function(){
  const root = anest0.apply(this, arguments), transfer = root.querySelector('[data-an="an_prot.per"]');
  if (transfer && AI_('an_prot.per') < 0){
    const value = transfer.querySelector('.bf'); if (value) value.replaceWith(bFill(''));
  }
  const hasProcedure = AI_('an_pun.prost') >= 0 || ['riv','osn'].some(key=>AT_('an_pun.' + key));
  const signature = [...root.querySelectorAll('.brow')].find(row=>!row.hasAttribute('data-an') && /^Анестезіолог(?:\s|$)/.test(row.textContent.trim()));
  if (!hasProcedure) root.querySelectorAll('[data-an^="an_pun."]').forEach(row=>row.remove());
  if (signature) signature.dataset.an = 'an_zak.anest';
  return root;
}; }
