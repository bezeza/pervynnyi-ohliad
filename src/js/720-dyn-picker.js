/* ===== 0.9.3.153 — вибір динаміки на кожен день у «Дописати історію» (задача 17, п. 4 рішень лікаря) =====
   Видно три основні: «↑ з позитивною», «= без суттєвої», «↘ з негативною»; далі власні формулювання лікаря (★, «+ своє»),
   решта («перед випискою») — під «ще ›»; частіше вжиті піднімаються. Програма лише підказує варіант за показниками дня
   (порівняння з попереднім днем, без порогів) — вибір завжди за лікарем. Власне формулювання підміняє речення динаміки в
   записаному щоденнику; медична логіка diaryFromExam не змінюється (власна фраза спирається на один з чотирьох базових варіантів).
   Зберігання: localStorage (try/catch), ключі po.dynPhrases і po.dynUse; дані пацієнтів туди не потрапляють. */
const DYN_BASE = ['Стан без суттєвої динаміки', 'Стан з позитивною динамікою', 'Стан покращився', 'Стан погіршився'];
const DYN_MAIN = [['1', '↑ з позитивною динамікою'], ['0', '= без суттєвої динаміки'], ['3', '↘ з негативною динамікою']];
const DYN_MORE = [['2', 'перед випискою (покращення)']];
function dynLoad(k, d){ try{ const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
function dynSave(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
const dynPhrases = () => dynLoad('po.dynPhrases', []).filter(x=>x && x.id && x.t && '0123'.includes(String(x.k)));
const dynUse = () => dynLoad('po.dynUse', {});
function dynBump(v){ const u = dynUse(); u[v] = (u[v] || 0) + 1; dynSave('po.dynUse', u); }
/* базовий варіант 0–3 для значення вибору (число або власна фраза 'c:<id>') */
function bfDynK(v){ v = String(v); if (v.startsWith('c:')){ const c = dynPhrases().find(x=>'c:' + x.id === v); return c ? +c.k : 1; } return +v; }
/* текст записаного щоденника: речення динаміки замінюється власним формулюванням */
function bfDynHtml(v, html){
  v = String(v); if (!v.startsWith('c:')) return html;
  const c = dynPhrases().find(x=>'c:' + x.id === v); if (!c) return html;
  const base = DYN_BASE[+c.k], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return html.replace(esc(base), esc(c.t));
}
/* підказка: показники кращі / гірші за попередній день (t° нижча, SpO₂ вища — «кращі»); суперечливі або неповні — без підказки */
function bfDynHint(prev, cur){
  if (!prev || !cur) return '';
  const n = x => { const v = parseFloat(String(x || '').replace(',', '.')); return isNaN(v) ? null : v; };
  let up = 0, down = 0;
  const t0 = n(prev.t), t1 = n(cur.t); if (t0 != null && t1 != null){ if (t1 < t0) up++; else if (t1 > t0) down++; }
  const s0 = n(prev.spo), s1 = n(cur.spo); if (s0 != null && s1 != null){ if (s1 > s0) up++; else if (s1 < s0) down++; }
  return up && !down ? '1' : down && !up ? '3' : '';
}
function bfDynPicker(r, prev, onChange){
  const wrap = h('div', {class:'bf-dyn', role:'group', 'aria-label':'Динаміка ' + fmtD(r.d)});
  let more = false;
  const draw = () => {
    wrap.innerHTML = '';
    const use = dynUse(), cust = dynPhrases().map(c=>['c:' + c.id, '★ ' + c.t]);
    const rest = [...DYN_MORE, ...cust].sort((a, b)=>(use[b[0]] || 0) - (use[a[0]] || 0));
    const shown = more ? [...DYN_MAIN, ...rest] : [...DYN_MAIN, ...rest.filter(x=>x[0] === String(r.dyn))];
    shown.forEach(([v, t])=>wrap.append(h('button', {type:'button', class:'chip q bf-dyn-b', 'aria-pressed':String(r.dyn) === v ? 'true' : 'false', onclick:()=>{ r.dyn = v; onChange(v); draw(); }}, t)));
    wrap.append(h('button', {type:'button', class:'more bf-dyn-more', 'aria-expanded':String(more), onclick:()=>{ more = !more; draw(); }}, more ? '‹ менше' : 'ще ›'));
    if (more) wrap.append(h('button', {type:'button', class:'more bf-dyn-add', onclick:()=>{
      const t = (prompt('Власне формулювання динаміки (замінить речення динаміки в щоденнику):') || '').trim(); if (!t) return;
      const k = (prompt('На який з варіантів спирається текст щоденника? 0 — без суттєвої, 1 — позитивна, 2 — покращення, 3 — погіршення', '1') || '').trim(); if (!'0123'.includes(k) || k === '') return;
      const all = dynPhrases(); all.push({id:Date.now().toString(36), t, k:+k}); dynSave('po.dynPhrases', all); draw(); } }, '+ своє'));
    const hint = bfDynHint(prev, r);
    if (hint && String(r.dyn) !== hint) wrap.append(h('span', {class:'chips-hint bf-dyn-h'}, 'підказка за показниками: ' + (hint === '1' ? '↑' : '↘')));
  };
  draw(); return wrap;
}
