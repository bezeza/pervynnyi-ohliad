/* ===== 0.9.3.56 — шрифти: текст документа на екрані — Source Serif 4; вибір у «Налаштуваннях» =====
   Усі шрифти вбудовані у файл (src/fonts, OFL 1.1) — нічого не завантажується.
   Друк, «Аркуш», бланки МОЗ — і далі Times New Roman. */
const FONTS_DOC = [['Source Serif 4','Source Serif 4 — із засічками (рекомендовано)','serif'],['Literata','Literata — із засічками','serif'],
  ['Golos Text','Golos Text — без засічок','sans-serif'],['Inter','Inter — без засічок','sans-serif'],['IBM Plex Sans','IBM Plex Sans — як інтерфейс','sans-serif']];
const FONTS_UI = [['IBM Plex Sans','IBM Plex Sans (як було)'],['Golos Text','Golos Text'],['Inter','Inter']];
const fontStack = (name, kind) => `"${name}",${kind === 'serif' ? 'Georgia,"Times New Roman",serif' : '"Segoe UI",Roboto,Arial,sans-serif'}`;
function fontVars(){
  const d = lsGet('po.fdoc', 'Source Serif 4'), u = lsGet('po.fui', 'IBM Plex Sans');
  const D = FONTS_DOC.find(x=>x[0] === d) || FONTS_DOC[0], U = FONTS_UI.find(x=>x[0] === u) || FONTS_UI[0];
  return {'--f-doc':fontStack(D[0], D[2]), '--f-ui':fontStack(U[0], 'sans'), '--f-head':fontStack(U[0], 'sans')};
}
function fontApply(doc){
  const v = fontVars(); [document, doc].filter(Boolean).forEach(d=>{ for (const k in v) d.documentElement.style.setProperty(k, v[k]); });
  try{ if (POP.w && !POP.w.closed) for (const k in v) POP.w.document.documentElement.style.setProperty(k, v[k]); }catch(e){}
}
{ const x0 = popInit; popInit = function(w){ const r = x0.apply(this, arguments); try{ fontApply(w.document); }catch(e){} return r; }; }
/* щоб вибір їхав разом із «Налаштування.json» у папці даних */
try{ ['po.fdoc','po.fui'].forEach(k=>{ if (!FS_SET_KEYS.includes(k)) FS_SET_KEYS.push(k); }); }catch(e){}
if (SETTINGS_EL){
  const mk = (id, list, key, def) => { const s = h('select', {id}, ...list.map(([v, t])=>h('option', {value:v}, t))); s.value = lsGet(key, def);
    s.addEventListener('change', ()=>{ lsSet(key, s.value); fontApply(); toast('Шрифт: ' + s.value); }); return s; };
  const sd = mk('set_fdoc', FONTS_DOC, 'po.fdoc', 'Source Serif 4'), su = mk('set_fui', FONTS_UI, 'po.fui', 'IBM Plex Sans');
  const sample = h('p', {class:'font-sample'}, 'Об’єктивно: температура тіла 36,8 °C, АТ 130/80 мм рт. ст., ЧСС 84 уд./хв. Ґґ Її Єє 0123456789');
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Шрифти'), h('div', {class:'grid'},
    h('div', {class:'f'}, h('label', {for:'set_fdoc'}, 'Шрифт тексту документа (на екрані)'), sd),
    h('div', {class:'f'}, h('label', {for:'set_fui'}, 'Шрифт інтерфейсу'), su),
    h('div', {class:'f wide'}, sample, h('p', {class:'chips-hint'}, 'Шрифти вбудовані у програму й працюють без інтернету. Друк, «Аркуш» і бланки — Times New Roman, як у паперових формах.'))));
  try{ setRegroup(); }catch(e){}
}
fontApply();
