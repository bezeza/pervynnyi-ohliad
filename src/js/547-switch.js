/* ===== Швидке перемикання пацієнтів: натисніть смужку з ПІБ угорі ===== */
function openSwitcher(){
  const st = loadStore(), ids = Object.keys(st).sort((a,b)=>st[b].updated - st[a].updated);
  const q = h('input', {type:'search', placeholder:'Пошук за ПІБ або № карти', 'aria-label':'Пошук пацієнта'});
  const list = h('div', {class:'swlist'});
  const draw = () => { list.innerHTML = ''; const s = q.value.trim().toLowerCase();
    const L = ids.filter(id=>!s || (st[id].name + ' ' + (st[id].card || '')).toLowerCase().includes(s)).slice(0, 30);
    if (!L.length) list.append(h('p', {class:'chips-hint'}, ids.length ? 'Нікого не знайдено' : 'Збережених пацієнтів ще немає'));
    L.forEach(id=>{ const p = st[id], fl = (typeof todayFlags === 'function' ? todayFlags(p) : null) || [], dx = p.snap && p.snap.f ? (p.snap.f.dx_osn || '') : '';
      list.append(h('button', {type:'button', class:'swrow' + (id === PID ? ' cur' : ''), onclick:()=>{ dlg.remove(); if (id !== PID) openPatient(id); }},
        h('span', {class:'swn'}, h('b', {}, p.name), p.card ? h('span', {class:'chips-hint'}, ' № ' + p.card) : ''),
        dx ? h('span', {class:'swd'}, dx.split('\n')[0].slice(0, 90)) : '',
        fl.length ? h('span', {class:'swf'}, ...fl.slice(0, 3).map(f=>h('span', {class:'badge ' + (f.c || '')}, f.t))) : '',
        id === PID ? h('span', {class:'badge ok'}, 'відкрито') : '')); }); };
  q.addEventListener('input', draw);
  const dlg = h('div', {class:'navsheet packsheet switcher', role:'dialog', 'aria-modal':'true', 'aria-label':'Пацієнти'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Пацієнти'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      q, list,
      h('div', {class:'acts2', style:'margin-top:10px'},
        h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); newPatient(); }}, '+ Новий пацієнт'),
        h('button', {type:'button', class:'more', onclick:()=>{ dlg.remove(); show(TABS.indexOf(META)); }}, 'Дані цього пацієнта («Запис»)'))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape'){ dlg.remove(); document.removeEventListener('keydown', esc); } });
  draw(); document.body.append(dlg); if (!window.matchMedia || !matchMedia('(max-width:899px)').matches) q.focus();
}
