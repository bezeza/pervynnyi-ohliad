/* ===== 0.9.3.65 — щоденник без первинки: скарги без шаблону, чернетка наступного дня =====
   Рішення лікаря (26.10.2026): шаблони допомагають, а не керують.
   1) Хвороба для щоденника необов’язкова («Без хвороби» у 598).
   2) «Скарги, що зберігаються»: зі скарг первинного огляду (якщо є) + слова лікаря з попередніх щоденників цього пацієнта
      + загальний список і пошук по всіх скаргах. Діагнозу в щоденнику немає — він у первинці й епікризі.
   3) Після «Записати в журнал» форма стає чернеткою наступного дня (щодня / через день / кожні 3 дні):
      дата закріплена, опис — «як учора», показники й скарги порожні та підсвічені. */
const DGEN = ['загальну слабкість','підвищену втомлюваність','головний біль','запаморочення','задишку при фізичному навантаженні','задишку у спокої',
  'сухий кашель','кашель з виділенням харкотиння','біль у грудній клітці','серцебиття','перебої в роботі серця','набряки нижніх кінцівок',
  'підвищення температури тіла','пітливість','біль у м’язах і суглобах','біль в епігастрії','нудоту','здуття живота'];
const dJoin = items => items.join(items.some(x=>x.includes(',')) ? '; ' : ', ');
/* слова лікаря: усе, що вписано в «Скарги, що зберігаються» в журналі цього пацієнта і зараз */
function dOwnComplaints(){
  const id = F('d_main.zal').el.id, seen = new Set(), L = [];
  [...DIARIES.map(d=>(d.data && d.data.f && d.data.f[id]) || ''), F('d_main.zal').el.value].forEach(v=>remItems(v).forEach(t=>{ const k = t.toLowerCase(); if (!seen.has(k)){ seen.add(k); L.push(t); } }));
  return L;
}
renderRemain = function(){
  const f = F('d_main.zal'); if (!f.rbox || DOC !== 'shch') return;
  const sk = F('skarhy.c');
  const exam = sk.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? {t:OTM(sk, i), o:+(c.dataset.ord || 0)} : null).filter(Boolean).sort((a,b)=>a.o - b.o).map(x=>x.t);
  const low = new Set(exam.map(x=>x.toLowerCase()));
  const own = dOwnComplaints().filter(t=>!low.has(t.toLowerCase())); own.forEach(t=>low.add(t.toLowerCase()));
  const all = sk.opts.map(o=>O(o).t), gen = (exam.length ? [] : DGEN.filter(t=>all.includes(t))).filter(t=>!low.has(t.toLowerCase()));
  const order = [...exam, ...own, ...gen], cur = remItems(f.el.value).map(x=>x.toLowerCase());
  const toggle = t => { let items = remItems(f.el.value); const k = items.findIndex(x=>x.toLowerCase() === t.toLowerCase());
    if (k >= 0) items.splice(k, 1); else { items.push(t); items.sort((a,b)=>{ const ia = order.indexOf(a), ib = order.indexOf(b); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); }); }
    f.el.value = dJoin(items); update(); };
  const chip = (t, cls) => h('button', {type:'button', class:'chip' + (cls ? ' ' + cls : ''), 'aria-pressed':cur.includes(t.toLowerCase()) ? 'true' : 'false', onclick:()=>toggle(t)}, t);
  const grp = (lbl, L, cls) => L.length ? h('div', {class:'chips', style:'margin-top:4px'}, h('span', {class:'chips-hint', style:'margin:0 6px 0 0'}, lbl), ...L.map(t=>chip(t, cls))) : '';
  const q = h('input', {type:'search', list:'dzalList', placeholder:'Знайти скаргу…', 'aria-label':'Знайти скаргу', style:'max-width:260px'});
  const add = () => { const t = q.value.trim(); if (!t) return; if (!remItems(f.el.value).some(x=>x.toLowerCase() === t.toLowerCase())) toggle(t); q.value = ''; };
  q.addEventListener('change', add); q.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); add(); } });
  f.rbox.innerHTML = '';
  f.rbox.append(
    grp('З первинного огляду:', exam), grp('Цього пацієнта:', own), grp('Загальні:', gen, 's'),
    h('div', {class:'chips', style:'margin-top:4px'}, q, h('datalist', {id:'dzalList'}, ...all.map(t=>h('option', {value:t}))),
      order.length ? h('button', {type:'button', class:'chip q', onclick:()=>{ f.el.value = ''; update(); }}, 'жодної') : ''),
    h('p', {class:'chips-hint', style:'margin:4px 0 0'}, 'Свої слова пишіть у полі через кому — у наступних щоденниках цього пацієнта вони стануть кнопками.'));
};
{ const lb = F('d_main.zal').wrapEl && F('d_main.zal').wrapEl.querySelector('label'); if (lb) lb.textContent = 'Скарги, що зберігаються (натисніть скаргу, щоб додати чи прибрати)'; }

/* ---- чернетка наступного дня після «Записати в журнал» ---- */
let DSTEP = (()=>{ try{ return +localStorage.getItem('po.dstep') || 1; }catch(e){ return 1; } })();
let DNEXT = (()=>{ try{ return localStorage.getItem('po.dnext') !== '0'; }catch(e){ return true; } })();
function dNextDraft(){
  const last = DIARIES[DIARIES.length - 1], md = document.getElementById('meta_dt'); if (!last || !md) return false;
  const v = String(last.dt || md.value || ''), d = new Date((v.split('T')[0] || todayISO()) + 'T00:00'); d.setDate(d.getDate() + DSTEP);
  diaryNoChange();
  DDPIN = true; md.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${v.split('T')[1] || '09:00'}`;
  md.dispatchEvent(new Event('input', {bubbles:true})); md.dispatchEvent(new Event('change', {bubbles:true}));
  const di = document.getElementById('d_main_den_0'); if (di) delete di.dataset.user;
  update();
  const n = stayDay();
  toast('Записано. Чернетка на ' + fmtD(md.value.split('T')[0]) + (n ? ' (' + n + '-й день)' : '') + ': опис — як у попередньому записі; внесіть показники, скарги й те, що змінилось', 5500);
  return true;
}
{ const sd0 = saveDiary; saveDiary = function(){ const n = DIARIES.length; const r = sd0.apply(this, arguments);
    if (DNEXT && DIARIES.length > n) try{ dNextDraft(); }catch(e){}
    return r; }; }
{ const row = document.querySelector('.ddt-row');
  if (row){
    const sel = h('select', {'aria-label':'Наступний запис', title:'На скільки днів уперед ставити чернетку після запису'},
      ...[[1,'щодня'],[2,'через день'],[3,'кожні 3 дні']].map(([v, t])=>h('option', {value:v}, t)));
    sel.value = String(DSTEP);
    sel.addEventListener('change', ()=>{ DSTEP = +sel.value || 1; try{ localStorage.setItem('po.dstep', String(DSTEP)); }catch(e){} });
    const cb = h('input', {type:'checkbox', id:'dnextCb'}); cb.checked = DNEXT;
    cb.addEventListener('change', ()=>{ DNEXT = cb.checked; try{ localStorage.setItem('po.dnext', DNEXT ? '1' : '0'); }catch(e){} });
    row.after(h('div', {class:'res-form dnext-row'}, h('label', {for:'dnextCb', style:'display:flex;gap:6px;align-items:center;margin:0'}, cb, 'Після запису — чернетка наступного дня'), sel));
  }
}
