/* ===== Зі Skiagrama (0.9.3.10): керування пацієнтами (видалення, вибір кількох, фільтри, кошик),
   захист екрана після простою, папір і принтер для бланків (поле під підшивку, зсув принтера, пробний аркуш з лінійкою) ===== */

/* ---------- 1. Пацієнти: список з видаленням і вибором кількох ---------- */
const PSTATE = p => { const S = p.snap || {}, F0 = S.f || {}; if (S.mode === 'amb') return 'amb'; return F0.e_per_per_2 ? 'out' : 'in'; };
const PDAYS = d => d ? Math.round((Date.now() - new Date(d + 'T00:00')) / 864e5) : 0;
let PFILT = 'all';
openSwitcher = function(){
  const sel = new Set();
  const q = h('input', {type:'search', placeholder:'Пошук за ПІБ, № карти або діагнозом', 'aria-label':'Пошук пацієнта'});
  const list = h('div', {class:'swlist'}), bar = h('div', {class:'pmbar'}), seg = h('div', {class:'seg pmseg', role:'group', 'aria-label':'Які пацієнти'}), foot = h('div', {class:'acts2 pmfoot'});
  const FL = [['all','Усі'],['in','У відділенні'],['out','Виписані'],['amb','Амбулаторно']];
  const rows = () => { const st = loadStore(), s = q.value.trim().toLowerCase();
    return Object.keys(st).sort((a,b)=>st[b].updated - st[a].updated).map(id=>[id, st[id]])
      .filter(([, p])=>PFILT === 'all' || PSTATE(p) === PFILT)
      .filter(([, p])=>!s || (p.name + ' ' + (p.card || '') + ' ' + ((p.snap && p.snap.f && p.snap.f.dx_osn) || '')).toLowerCase().includes(s)); };
  const draw = () => {
    const st = loadStore(), all = Object.values(st), L = rows();
    seg.innerHTML = ''; FL.forEach(([k, t])=>{ const n = k === 'all' ? all.length : all.filter(p=>PSTATE(p) === k).length;
      seg.append(h('button', {type:'button', 'aria-pressed':PFILT === k ? 'true' : 'false', onclick:()=>{ PFILT = k; sel.clear(); draw(); }}, t + ' · ' + n)); });
    list.innerHTML = '';
    if (!L.length) list.append(h('p', {class:'chips-hint'}, all.length ? 'Нікого не знайдено' : 'Збережених пацієнтів ще немає'));
    L.slice(0, 200).forEach(([id, p])=>{
      const fl = (typeof todayFlags === 'function' ? todayFlags(p) : null) || [], dx = p.snap && p.snap.f ? (p.snap.f.dx_osn || '') : '', S = PSTATE(p), F0 = (p.snap && p.snap.f) || {};
      const cb = h('input', {type:'checkbox', 'aria-label':'Вибрати ' + p.name}); cb.checked = sel.has(id);
      cb.addEventListener('change', ()=>{ cb.checked ? sel.add(id) : sel.delete(id); drawBar(); });
      const del = h('button', {type:'button', class:'btn sm pmdel', title:'Видалити в кошик (30 днів можна відновити)', 'aria-label':'Видалити ' + p.name, onclick:e=>{ e.stopPropagation();
        if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = '🗑'; }, 3000); return; }
        delPatient(id); sel.delete(id); draw(); }}, '🗑');
      const st = S === 'out' ? h('span', {class:'badge'}, 'виписано ' + fmtD(F0.e_per_per_2)) : S === 'amb' ? h('span', {class:'badge'}, 'амбулаторно') : F0.e_per_per_1 ? h('span', {class:'badge ok'}, 'день ' + (PDAYS(F0.e_per_per_1) + 1)) : '';
      const open = h('button', {type:'button', class:'swrow' + (id === PID ? ' cur' : ''), onclick:()=>{ dlg.remove(); if (id !== PID) openPatient(id); }},
        h('span', {class:'swn'}, h('b', {}, p.name), p.card ? h('span', {class:'chips-hint'}, ' № ' + p.card) : '', ' ', st),
        dx ? h('span', {class:'swd'}, dx.split('\n')[0].slice(0, 90)) : '',
        fl.length ? h('span', {class:'swf'}, ...fl.slice(0, 3).map(f=>h('span', {class:'badge ' + (f.c || '')}, f.t))) : '',
        id === PID ? h('span', {class:'badge ok'}, 'відкрито') : '');
      list.append(h('div', {class:'pmrow' + (sel.has(id) ? ' on' : '')}, cb, open, del));
    });
    if (L.length > 200) list.append(h('p', {class:'chips-hint'}, `Показано 200 з ${L.length} — уточніть пошук`));
    drawBar(); drawFoot();
  };
  const drawBar = () => {
    bar.innerHTML = ''; const L = rows();
    const all = h('label', {class:'blk'}, (()=>{ const c = h('input', {type:'checkbox'}); c.checked = L.length && L.every(([id])=>sel.has(id)); c.addEventListener('change', ()=>{ L.forEach(([id])=>c.checked ? sel.add(id) : sel.delete(id)); draw(); }); return c; })(), ' вибрати всіх у списку');
    bar.append(all);
    if (sel.size){
      const d = h('button', {type:'button', class:'btn danger', onclick:()=>{ if (!d.dataset.arm){ d.dataset.arm = '1'; d.textContent = `Точно видалити ${sel.size}?`; setTimeout(()=>{ delete d.dataset.arm; d.textContent = `Видалити вибраних (${sel.size})`; }, 3500); return; }
        const n = sel.size, ids = [...sel]; ids.forEach(id=>delPatient(id)); sel.clear(); draw();
        snack(`Видалено ${n} — у кошику 30 днів`, 'Відновити всіх', ()=>{ ids.forEach(id=>restorePatient(id)); draw(); }); }}, `Видалити вибраних (${sel.size})`);
      const ex = h('button', {type:'button', class:'btn', onclick:()=>{ const st = loadStore(), items = {}; sel.forEach(id=>{ if (st[id]) items[id] = st[id]; }); const d0 = new Date();
        downloadJSON({type:'po-patients', items}, `patsienty_vybrani_${d0.getFullYear()}-${pad(d0.getMonth()+1)}-${pad(d0.getDate())}.json`); }}, 'Зберегти вибраних у файл');
      bar.append(d, ex, h('button', {type:'button', class:'more', onclick:()=>{ sel.clear(); draw(); }}, 'Зняти вибір'));
    }
  };
  const drawFoot = () => {
    foot.innerHTML = '';
    foot.append(h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); newPatient(); }}, '+ Новий пацієнт'));
    const old = Object.entries(loadStore()).filter(([, p])=>PSTATE(p) === 'out' && PDAYS(p.snap.f.e_per_per_2) > 30);
    if (old.length) foot.append(h('button', {type:'button', class:'btn', title:'Виписані понад 30 днів тому — у кошик (перед цим збережіть копію)', onclick:()=>{ PFILT = 'out'; sel.clear(); old.forEach(([id])=>sel.add(id)); draw(); toast(`Вибрано ${old.length} виписаних понад 30 днів тому — збережіть у файл і видаліть`, 4000); }}, `Виписані > 30 днів (${old.length})`));
    const nt = Object.keys(TRASH).length;
    if (nt) foot.append(h('button', {type:'button', class:'more', onclick:()=>{ dlg.remove(); trashDialog(); }}, `Кошик (${nt})`));
    if (typeof transferDialog === 'function') foot.append(h('button', {type:'button', class:'more', onclick:()=>{ dlg.remove(); transferDialog(); }}, '⇄ Перенесення'));
    foot.append(h('button', {type:'button', class:'more', onclick:()=>{ dlg.remove(); show(TABS.indexOf(META)); }}, 'Дані цього пацієнта («Запис»)'));
  };
  q.addEventListener('input', draw);
  const dlg = h('div', {class:'navsheet packsheet switcher pmgr', role:'dialog', 'aria-modal':'true', 'aria-label':'Пацієнти'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Пацієнти'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      seg, q, bar, list, foot,
      h('p', {class:'chips-hint'}, 'Видалені пацієнти 30 днів лежать у кошику — їх можна відновити. Пацієнти зберігаються лише в цьому браузері.')));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape'){ dlg.remove(); document.removeEventListener('keydown', esc); } });
  draw(); document.body.append(dlg); if (!window.matchMedia || !matchMedia('(max-width:899px)').matches) q.focus();
};

/* ---------- 2. Захист екрана: після простою дані пацієнта ховаються ---------- */
const LOCK = {last:Date.now(), min:(()=>{ const v = lsGet('po.lock', ''); return v === '' ? 10 : +v; })()};
const lockScr = h('div', {class:'lockscr', id:'lockScr', hidden:'', role:'dialog', 'aria-modal':'true', 'aria-label':'Екран захищено'},
  h('div', {class:'lockbox'}, h('div', {class:'lockic', 'aria-hidden':'true'}, '🔒'), h('b', {}, 'Дані пацієнта сховано'),
    h('p', {class:'chips-hint'}, 'Минуло кілька хвилин без дій — щоб сторонні не бачили документів.'),
    h('button', {type:'button', class:'btn primary', id:'lockGo', onclick:()=>unlockScr()}, 'Продовжити роботу')));
document.body.append(lockScr);
['pointerdown','keydown','wheel','touchstart'].forEach(ev=>document.addEventListener(ev, ()=>{ if (lockScr.hidden) LOCK.last = Date.now(); }, {capture:true, passive:true}));
function lockNow(){ if (!lockScr.hidden) return; lockScr.hidden = false; document.body.classList.add('locked'); setTimeout(()=>{ const b = $('#lockGo'); if (b) b.focus(); }, 0); }
function unlockScr(){ lockScr.hidden = true; document.body.classList.remove('locked'); LOCK.last = Date.now(); }
setInterval(()=>{ if (LOCK.min > 0 && Date.now() - LOCK.last > LOCK.min * 60000) lockNow(); }, 15000);

/* ---------- 3. Папір і принтер (бланки 003/о): поле під підшивку, зсув принтера, пробний аркуш ---------- */
const PAPERSET = Object.assign({bind:0, offX:0, offY:0}, (()=>{ try{ return JSON.parse(lsGet('po.paperset', '{}')) || {}; }catch(e){ return {}; } })());
function applyPaperSet(){ const r = document.documentElement.style; r.setProperty('--bind', (+PAPERSET.bind || 0) + 'mm'); r.setProperty('--offx', (+PAPERSET.offX || 0) + 'mm'); r.setProperty('--offy', (+PAPERSET.offY || 0) + 'mm'); }
function setPaper(k, v){ PAPERSET[k] = v; lsSet('po.paperset', JSON.stringify(PAPERSET)); applyPaperSet(); try{ if (PAPER) renderPaper(); }catch(e){} drawPaperCtl(); }
applyPaperSet();
function rulerSheet(){
  const tick = (n, horiz) => Array.from({length:n}, (_, i)=>`<span style="position:absolute;${horiz ? `left:${i * 10}mm;top:0;height:${i % 5 ? 3 : 6}mm;border-left` : `top:${i * 10}mm;left:0;width:${i % 5 ? 3 : 6}mm;border-top`}:.3mm solid #111"></span>`).join('');
  const P = $('#print');
  P.innerHTML = `<div class="ruler" style="position:relative;width:186mm;height:270mm;font:11pt Arial,sans-serif;color:#111">${tick(19, true)}${tick(28, false)}
    <div style="position:absolute;left:10mm;top:10mm;width:166mm;height:250mm;border:.4mm solid #111"></div>
    <div style="position:absolute;left:20mm;top:30mm;width:140mm;line-height:1.5">Пробний аркуш «Первинний огляд».<br>Рамка має стояти рівно на 10 мм від поділок лінійки зліва й зверху.<br>
    Якщо зміщено — виміряйте, на скільки, і впишіть «Зсув принтера» в Налаштуваннях: праворуч / вниз — плюс, ліворуч / вгору — мінус.</div></div>`;
  toast('Пробний аркуш: друкуйте без масштабування («Фактичний розмір»)', 3500);
  setTimeout(()=>window.print(), 50);
}
let paperCtl = null;
function drawPaperCtl(){
  if (!paperCtl) return; paperCtl.innerHTML = '';
  const num = (k, lab, min, max, step) => { const i = h('input', {type:'number', min, max, step, value:PAPERSET[k] || 0, style:'width:5.5em', 'aria-label':lab}); i.addEventListener('change', ()=>setPaper(k, Math.max(min, Math.min(max, +i.value || 0)))); return h('label', {class:'wl'}, h('span', {}, lab), i); };
  const bc = h('input', {type:'checkbox'}); bc.checked = +PAPERSET.bind > 0; bc.addEventListener('change', ()=>setPaper('bind', bc.checked ? 20 : 0));
  paperCtl.append(h('label', {class:'blk'}, bc, ' Поле під підшивку зліва'),
    +PAPERSET.bind > 0 ? num('bind', 'ширина, мм', 5, 40, 1) : '',
    num('offX', 'Зсув ↔, мм', -10, 10, 0.5), num('offY', 'Зсув ↕, мм', -10, 10, 0.5),
    h('button', {type:'button', class:'btn', onclick:rulerSheet}, 'Пробний аркуш з лінійкою'));
}
if (SETTINGS_EL){
  paperCtl = h('div', {class:'acts2 paperctl'}); drawPaperCtl();
  const lk = h('select', {id:'set_lock'}, ...[[0,'не ховати'],[5,'5 хв'],[10,'10 хв'],[15,'15 хв'],[30,'30 хв']].map(([v,t])=>h('option', {value:String(v)}, t)));
  lk.value = String(LOCK.min); lk.addEventListener('change', ()=>{ LOCK.min = +lk.value; lsSet('po.lock', lk.value); toast(LOCK.min ? `Дані ховатимуться після ${LOCK.min} хв без дій` : 'Захист екрана вимкнено'); });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Захист екрана'), h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {for:'set_lock'}, 'Ховати дані пацієнта після простою'), lk,
      h('p', {class:'chips-hint'}, 'Щоб сторонні не бачили документів, коли ви відійшли. Повернутися — «Продовжити роботу».'))),
    h('h3', {class:'sub'}, 'Папір і принтер (бланки 003/о)'), paperCtl,
    h('p', {class:'chips-hint'}, 'Надрукуйте пробний аркуш: якщо рамка зміщена — впишіть зсув. Поле під підшивку зсуває текст бланка праворуч.'));
}
/* у пошуку Ctrl+K */
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'Пацієнти: видалити, вибрати кількох, кошик', go:openSwitcher}, {k:'Дія', t:'Сховати екран (захист)', go:lockNow}, {k:'Дія', t:'Пробний аркуш з лінійкою (принтер)', go:rulerSheet}); return L; }; }
