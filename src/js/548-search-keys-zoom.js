/* ===== Пошук будь-чого (Ctrl+K), гарячі клавіші, розмір тексту ===== */
function searchItems(){
  const L = [], tabVis = t => t.tab && !t.tab.hidden;
  TABS.forEach((t,i)=>{ if (tabVis(t)) L.push({k:'Розділ', t:t.title, s:t.short || '', go:()=>show(i)}); });
  SECTIONS.forEach(sc=>{ const i = TABS.indexOf(sc); if (i < 0 || !tabVis(sc)) return;
    sc.fields.forEach(f=>{ if (!f.label || f.type === 'hdr' || f.type === 'auto') return;
      L.push({k:sc.short || sc.title, t:f.label.replace(/\s*\(.*?\)\s*$/, ''), go:()=>{ show(i); setTimeout(()=>{ const el = f.el || (f.inputs && f.inputs[0]) || f.inp || (f.chips && f.chips[0]) || f.d1; if (el){ el.scrollIntoView({block:'center'}); try{ el.focus({preventScroll:true}); }catch(e){} } }, 30); }}); }); });
  PRESETS.forEach((p,k)=>{ if (p.name) L.push({k:'Хвороба', t:p.name, s:p.mkh || '', go:()=>applyPreset(p, HV.cards[k])}); });
  const act = (t, fn, s) => L.push({k:'Дія', t, s:s || '', go:fn});
  act('Копіювати текст', copy, 'Ctrl+Enter'); act('Друк / PDF', doPrint, 'Ctrl+P'); act('Зберегти у Word', ()=>$('#docxBtn').click());
  act('Пацієнти: перемкнути або знайти', openSwitcher); act('Новий пацієнт', newPatient); act('Скасувати останню дію', undoLast, 'Ctrl+Z');
  act('Норма у всіх системах', ()=>$('#allNorm').click()); act('Друк кількох документів', packDialog); act('Знайомство: дані лікаря', ()=>welcomeDialog(true));
  [...DOCLIST[MODE], ...DOCMORE[MODE]].forEach(([k,l])=>act('Документ: ' + l, ()=>switchDoc(k)));
  return L;
}
function openSearch(){
  if (document.querySelector('.cmdk')) return;
  const items = searchItems(), q = h('input', {type:'search', placeholder:'Що знайти? Розділ, поле, хворобу, дію…', 'aria-label':'Пошук'}), list = h('div', {class:'cmdl', role:'listbox'});
  let sel = 0, shown = [];
  const norm = t => String(t).toLowerCase().replace(/[’ʼ']/g, '');
  const draw = () => { const s = norm(q.value.trim()), words = s.split(/\s+/).filter(Boolean);
    shown = (words.length ? items.filter(it=>{ const x = norm(it.t + ' ' + (it.s || '') + ' ' + it.k); return words.every(w=>x.includes(w)); }) : items.filter(it=>it.k === 'Дія' || it.k === 'Розділ')).slice(0, 40);
    sel = Math.min(sel, Math.max(0, shown.length - 1)); list.innerHTML = '';
    if (!shown.length) list.append(h('p', {class:'chips-hint'}, 'Нічого не знайдено'));
    shown.forEach((it, i)=>list.append(h('button', {type:'button', class:'cmdi' + (i === sel ? ' on' : ''), role:'option', onclick:()=>run(it)}, h('span', {class:'cmdk-k'}, it.k), h('span', {}, it.t), it.s ? h('span', {class:'cmdk-s'}, it.s) : ''))); };
  const close = () => dlg.remove();
  const run = it => { close(); it.go(); };
  q.addEventListener('input', ()=>{ sel = 0; draw(); });
  q.addEventListener('keydown', e=>{ if (e.key === 'ArrowDown'){ sel = Math.min(sel + 1, shown.length - 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp'){ sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === 'Enter' && shown[sel]){ e.preventDefault(); run(shown[sel]); } else if (e.key === 'Escape') close(); });
  const dlg = h('div', {class:'navsheet packsheet cmdk', role:'dialog', 'aria-modal':'true', 'aria-label':'Пошук'}, h('div', {class:'nvbox'}, q, list,
    h('p', {class:'chips-hint', style:'margin-top:8px'}, '↑↓ — вибір, Enter — відкрити, Esc — закрити. Ctrl+Enter — копіювати текст, Ctrl+P — друк, Ctrl+Z — скасувати.')));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) close(); });
  document.body.append(dlg); draw(); setTimeout(()=>q.focus(), 20);
}
document.addEventListener('keydown', e=>{
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.code === 'KeyK' || e.key === 'k' || e.key === 'л')){ e.preventDefault(); openSearch(); }
  else if (mod && e.key === 'Enter'){ e.preventDefault(); copy(); }
  else if (mod && !e.shiftKey && (e.code === 'KeyP' || e.key === 'p' || e.key === 'з')){ e.preventDefault(); doPrint(); }
});
{ const nl = document.querySelector('#navSheet .nshead'); if (nl) nl.after(h('button', {type:'button', class:'btn nsearch', onclick:()=>{ closeNav(); openSearch(); }}, '🔍 Пошук: розділ, поле, хвороба, дія')); }
/* розмір тексту */
let ZOOM = '1'; try{ ZOOM = localStorage.getItem('po.zoom') || '1'; }catch(e){}
function applyZoom(){ document.documentElement.style.zoom = ZOOM === '1' ? '' : ZOOM; }
applyZoom();
if (SETTINGS_EL){ const z = h('select', {id:'set_zoom'}, h('option', {value:'1'}, 'Звичайний'), h('option', {value:'1.1'}, 'Більший'), h('option', {value:'1.2'}, 'Великий'));
  z.value = ZOOM; z.addEventListener('change', ()=>{ ZOOM = z.value; try{ localStorage.setItem('po.zoom', ZOOM); }catch(x){} applyZoom(); });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Розмір тексту програми'), h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {for:'set_zoom'}, 'Розмір'), z)),
    h('div', {class:'acts2', style:'margin:6px 0 4px'}, h('button', {type:'button', class:'more', onclick:()=>welcomeDialog(true)}, 'Показати знайомство ще раз')));
  const ab = (k, l) => { const e = h('input', {value:SRCAB[k], style:'max-width:120px', 'aria-label':l}); e.addEventListener('input', ()=>{ SRCAB[k] = e.value.trim() || (k === 'dep' ? 'від.' : 'пац.'); try{ localStorage.setItem('po.srcab', JSON.stringify(SRCAB)); }catch(x){} }); return h('div', {class:'f'}, h('label', {}, l), e); };
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Листок призначень (ф. 003-4/о)'), h('p', {class:'chips-hint'}, 'Позначка на полі листка «звідки препарат». Впишіть скорочення, як заведено у вашому відділенні.'),
    h('div', {class:'grid'}, ab('dep', 'З відділення'), ab('pat', 'Ліки пацієнта')));
}
