/* ===== 0.9.3.68 — шрифт Zakon (Мінкульт України, Zakon Text Regular) на вибір =====
   Додається у «Шрифт тексту документа» й «Шрифт інтерфейсу», а також новий вибір «Шрифт друку, «Аркуша» й бланків».
   За замовчуванням усе як було: Source Serif 4, IBM Plex Sans, Times New Roman.
   Вбудовано лише накреслення Regular — жирне браузер домальовує сам.
   Друк і бланки: клас pf-zakon на <html> (стилі — у кінці styles.css). Word і LibreOffice — і далі Times New Roman. */
const ZAKON = 'Zakon';
const FONTS_PRINT = [['Times New Roman', 'Times New Roman (як у паперових формах)'], [ZAKON, 'Zakon — шрифт для документів (Мінкульт)']];
try{ if (!FONTS_DOC.some(x=>x[0] === ZAKON)) FONTS_DOC.push([ZAKON, 'Zakon — шрифт для документів (Мінкульт)', 'serif']); }catch(e){}
try{ if (!FONTS_UI.some(x=>x[0] === ZAKON)) FONTS_UI.push([ZAKON, 'Zakon']); }catch(e){}
function printFontApply(doc){
  const z = lsGet('po.fprint', 'Times New Roman') === ZAKON;
  [document, doc].filter(Boolean).forEach(d=>d.documentElement.classList.toggle('pf-zakon', z));
  try{ if (POP.w && !POP.w.closed) POP.w.document.documentElement.classList.toggle('pf-zakon', z); }catch(e){}
}
{ const x0 = fontApply; fontApply = function(doc){ const r = x0.apply(this, arguments); try{ printFontApply(doc); }catch(e){} return r; }; }
/* варіант Zakon у вже побудованих списках «Налаштувань» */
try{
  [['set_fdoc', FONTS_DOC, 'po.fdoc'], ['set_fui', FONTS_UI, 'po.fui']].forEach(([id, list, key])=>{
    const s = document.getElementById(id); if (!s || [...s.options].some(o=>o.value === ZAKON)) return;
    const it = list.find(x=>x[0] === ZAKON); if (!it) return;
    s.append(h('option', {value:ZAKON}, it[1])); s.value = lsGet(key, s.value) || s.value;
    if (!s.value) s.selectedIndex = 0;
  });
}catch(e){}
/* новий вибір: шрифт друку, «Аркуша» й бланків */
try{
  const su = document.getElementById('set_fui');
  if (su && !document.getElementById('set_fprint')){
    const sp = h('select', {id:'set_fprint'}, ...FONTS_PRINT.map(([v, t])=>h('option', {value:v}, t)));
    sp.value = lsGet('po.fprint', 'Times New Roman'); if (!sp.value) sp.selectedIndex = 0;
    sp.addEventListener('change', ()=>{ lsSet('po.fprint', sp.value); fontApply(); toast('Шрифт друку й бланків: ' + sp.value); });
    const box = su.closest('.f');
    if (box) box.after(h('div', {class:'f'}, h('label', {for:'set_fprint'}, 'Шрифт друку, «Аркуша» й бланків'), sp));
    const hint = [...document.querySelectorAll('.chips-hint')].find(p=>/Друк, «Аркуш» і бланки — Times New Roman/.test(p.textContent));
    if (hint) hint.textContent = 'Шрифти вбудовані у програму й працюють без інтернету. Друк, «Аркуш» і бланки — Times New Roman, як у паперових формах, або Zakon. Файли Word і LibreOffice — Times New Roman.';
  }
}catch(e){}
try{ if (!FS_SET_KEYS.includes('po.fprint')) FS_SET_KEYS.push('po.fprint'); }catch(e){}
fontApply();
