/* ===== Зі Skiagrama, частина 2 (0.9.3.11): перегляд перед друком на весь екран, друк пачкою, журнал дій,
   «Як минулого разу» (повторна госпіталізація), олівець ✎ для кнопок, пакети фраз із підписом автора, флешка раз на тиждень ===== */

/* ---------- журнал дій (локально, без ПІБ і тексту документів) ---------- */
const ALOG_MAX = 3000;
let ALOG = (()=>{ try{ return JSON.parse(lsGet('po.actlog', '[]')) || []; }catch(e){ return []; } })();
function logAct(t, d){ ALOG.push({ts:Date.now(), who:mv('doc') || '', t, d:d || '', doc:DOC}); if (ALOG.length > ALOG_MAX) ALOG = ALOG.slice(-ALOG_MAX); lsSet('po.actlog', JSON.stringify(ALOG)); }
const DOCN = k => (([...DOCLIST.hosp, ...DOCLIST.amb, ...DOCMORE.hosp, ...DOCMORE.amb].find(x=>x[0] === k) || [k, k])[1]);
{ const w = (name, t, d) => { const f0 = window[name] || eval(name); return function(){ const r = f0.apply(this, arguments); try{ logAct(t, typeof d === 'function' ? d.apply(null, arguments) : d); }catch(e){} return r; }; };
  openPatient = w('openPatient', 'Відкрито пацієнта');
  newPatient = w('newPatient', 'Новий пацієнт');
  delPatient = w('delPatient', 'Пацієнта видалено в кошик');
  saveDiary = w('saveDiary', 'Запис щоденника в журнал');
  doPrint = w('doPrint', 'Друк', ()=>DOCN(DOC) + (typeof blankOn === 'function' && blankOn() ? ' (бланк 003/о)' : ''));
  copy = w('copy', 'Копіювання тексту', ()=>DOCN(DOC));
  exportAll = w('exportAll', 'Резервна копія всіх пацієнтів у файл');
  switchDoc = w('switchDoc', 'Документ', k=>DOCN(k));
  applyPreset = w('applyPreset', 'Заповнено за хворобою', p=>p && p.name || '');
}
function actLogBlock(){
  const box = h('div', {class:'alog'});
  const draw = () => { box.innerHTML = '';
    const L = ALOG.slice(-30).reverse();
    box.append(h('div', {class:'acts2'},
      h('button', {type:'button', class:'btn', onclick:()=>{ const q = s=>'"' + String(s).replace(/"/g, '""') + '"';
        const rows = ['Дата;Час;Лікар;Дія;Деталі;Документ'].concat(ALOG.map(a=>{ const d = new Date(a.ts); return [`${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`, `${pad(d.getHours())}:${pad(d.getMinutes())}`, a.who, a.t, a.d, DOCN(a.doc)].map(q).join(';'); }));
        const d0 = new Date(), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.join('\r\n')], {type:'text/csv'}));
        a.download = `zhurnal_dii_${d0.getFullYear()}-${pad(d0.getMonth()+1)}-${pad(d0.getDate())}.csv`; document.body.append(a); a.click(); a.remove(); toast('Журнал дій збережено (CSV — відкривається в Excel)'); }}, `Зберегти журнал (CSV, ${ALOG.length})`),
      h('button', {type:'button', class:'more', onclick:e=>{ const b = e.currentTarget; if (!b.dataset.arm){ b.dataset.arm = '1'; b.textContent = 'Точно очистити?'; setTimeout(()=>{ delete b.dataset.arm; b.textContent = 'Очистити журнал'; }, 3000); return; } ALOG = []; lsSet('po.actlog', '[]'); draw(); }}, 'Очистити журнал')));
    box.append(L.length ? h('div', {class:'alist'}, ...L.map(a=>{ const d = new Date(a.ts); return h('div', {class:'arow'}, h('span', {class:'chips-hint'}, `${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`), h('span', {}, a.t + (a.d ? ' — ' + a.d : ''))); })) : h('p', {class:'chips-hint'}, 'Подій ще немає.'));
  };
  draw(); box.redraw = draw; return box;
}
if (SETTINGS_EL){ const ab = actLogBlock();
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Журнал дій'), h('p', {class:'chips-hint'}, 'Лише на цьому пристрої: час, ім’я лікаря з налаштувань і що зроблено (відкрито, записано, надруковано, видалено). ПІБ пацієнтів і текст документів не записуються.'), ab);
  const s0 = show; show = function(i){ const r = s0.apply(this, arguments); try{ if (TABS[i] && TABS[i].id === 'set') ab.redraw(); }catch(e){} return r; }; }

/* ---------- флешка раз на тиждень ---------- */
function usbBox(){
  const n = Object.keys(loadStore()).length; if (!n) return null;
  const last = lsGet('po.usb', ''), later = lsGet('po.usbLater', ''), today = new Date().toISOString().slice(0, 10);
  const days = last ? Math.floor((Date.now() - +last) / 864e5) : Infinity;
  if (days < 7 || later === today) return null;
  return h('div', {class:'warnbox usb'},
    h('span', {}, '💾 Раз на тиждень скопіюйте дані на флешку — на випадок поломки комп’ютера.' + (last ? ` Востаннє: ${new Date(+last).toLocaleDateString('uk-UA')}.` : '')),
    h('span', {class:'acts2'},
      h('button', {type:'button', class:'btn primary', onclick:()=>exportAll()}, 'Зберегти копію у файл'),
      h('button', {type:'button', class:'btn', onclick:()=>{ lsSet('po.usb', String(Date.now())); renderToday(); toast('Добре. Нагадаю через тиждень'); logAct('Копія на флешку — зроблено'); }}, 'Скопіював на флешку'),
      h('button', {type:'button', class:'more', onclick:()=>{ lsSet('po.usbLater', today); renderToday(); }}, 'Не сьогодні')));
}
{ const rt = renderToday; renderToday = function(){ const r = rt.apply(this, arguments); try{ const bb = $('#bkBox'); if (bb){ const old = bb.querySelector('.usb'); if (old) old.remove(); const u = usbBox(); if (u) bb.append(u); } }catch(e){} return r; }; }

/* ---------- «Як минулого разу»: повторна госпіталізація того самого пацієнта ---------- */
const LASTP = ['vitae_', 'meta_dob', 'meta_addr', 'meta_work', 'dx_supd', 'zah_hw_'];
function prevStayOf(name, card){
  const nm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!nm(name) || nm(name).split(' ').length < 2) return null;
  const st = loadStore();
  return Object.entries(st).filter(([id, p])=>id !== PID && (nm(p.name) === nm(name) || (card && p.card && p.card === card && false))).sort((a, b)=>b[1].updated - a[1].updated)[0] || null;
}
function likeLastTime(id){
  const p = loadStore()[id]; if (!p || !p.snap) return;
  const S = p.snap, take = k => LASTP.some(x=>k.startsWith(x));
  for (const k in S.f){ if (!take(k)) continue; const e = document.getElementById(k); if (!e) continue; if (e.type === 'checkbox') e.checked = !!S.f[k]; else e.value = S.f[k]; }
  document.querySelectorAll('#panels .chip[id^="vitae_"]').forEach(b=>{ b.setAttribute('aria-pressed', 'false'); delete b.dataset.ord; });
  for (const k in S.c){ if (!take(k)) continue; const b = document.getElementById(k); if (!b) continue; b.setAttribute('aria-pressed', S.c[k].p ? 'true' : 'false'); if (S.c[k].o) b.dataset.ord = S.c[k].o; }
  SECTIONS.forEach(sc=>sc.fields.forEach(f=>{ if (f.type === 'sel') mark(f.el, f); if (f.type === 'multi'){ refreshChips(f); try{ refreshDet(f); }catch(e){} } }));
  calcAge(); update(); logAct('Як минулого разу', 'анамнез життя, дата народження, адреса, супутні');
  const F0 = S.f || {}; toast('Взято з попередньої госпіталізації' + (F0.e_per_per_1 ? ' (' + fmtD(F0.e_per_per_1) + ')' : '') + ': анамнез життя, алергії, дата народження, адреса, робота, супутні діагнози, зріст і маса', 4500);
}
{ const pi = document.getElementById('meta_pib'), box = h('div', {class:'lastbox', hidden:''});
  if (pi){ const w = pi.closest('.f') || pi.parentElement; w.after(box);
    let tmr = 0;
    const chk = () => { box.hidden = true; box.innerHTML = ''; const r = prevStayOf(pi.value, mv('card')); if (!r) return;
      const [id, p] = r, F0 = (p.snap && p.snap.f) || {};
      box.hidden = false;
      box.append(h('span', {}, 'Цей пацієнт уже був' + (F0.e_per_per_1 ? ' ' + fmtD(F0.e_per_per_1) + (F0.e_per_per_2 ? ' – ' + fmtD(F0.e_per_per_2) : '') : '') + (F0.dx_osn ? ': ' + F0.dx_osn.split('\n')[0].slice(0, 80) : '') + '.'),
        h('button', {type:'button', class:'btn primary', onclick:()=>{ likeLastTime(id); box.hidden = true; }}, 'Як минулого разу'),
        h('button', {type:'button', class:'more', onclick:()=>{ box.hidden = true; }}, 'Ні'));
    };
    pi.addEventListener('input', ()=>{ clearTimeout(tmr); tmr = setTimeout(chk, 500); });
    const op = openPatient; openPatient = function(){ const r = op.apply(this, arguments); box.hidden = true; return r; };
  }
}

/* ---------- олівець ✎: правка кнопок розділу на місці ---------- */
let PENCIL = null;
function pencilEdit(f, idx, anchor){
  document.querySelectorAll('.pened').forEach(x=>x.remove());
  const o = O(f.opts[idx]).t, key = f.pkey || '', cur = (CUSTOM.ovr[key] || {})[o] || o, hid = (CUSTOM.hid[key] || []).includes(o);
  const ta = h('textarea', {rows:2, 'aria-label':'Текст кнопки'}); ta.value = cur;
  const pop = h('div', {class:'pened bqe', role:'dialog', 'aria-label':'Змінити кнопку'},
    h('b', {}, 'Змінити кнопку'), h('span', {class:'chips-hint'}, 'Як є в програмі: «' + o + '»'), ta,
    h('div', {class:'acts2'},
      h('button', {type:'button', class:'btn primary', onclick:()=>{ setOvr(key, o, ta.value.trim()); pop.remove(); logAct('Кнопку змінено ✎'); toast('Збережено — так буде і в документах'); }}, 'Зберегти'),
      h('button', {type:'button', class:'btn', onclick:()=>{ setHid(key, o, !hid); pop.remove(); toast(hid ? 'Кнопку повернуто' : 'Кнопку сховано (повернути — ✎ або «Мої шаблони»)'); }}, hid ? 'Показати' : 'Сховати'),
      cur !== o ? h('button', {type:'button', class:'more', onclick:()=>{ setOvr(key, o, ''); pop.remove(); }}, 'Як було') : '',
      h('button', {type:'button', class:'more', onclick:()=>pop.remove()}, 'Скасувати')));
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(window.innerWidth - pop.offsetWidth - 8, Math.max(8, r.left)) + 'px';
  pop.style.top = Math.min(window.innerHeight - pop.offsetHeight - 8, r.bottom + 6) + 'px';
  ta.focus(); ta.select();
}
SECTIONS.forEach(s=>{
  const a = s.panel && s.panel.querySelector('.ph .acts2'); if (!a) return;
  if (!s.fields.some(f=>f.type === 'multi' || f.type === 'sel')) return;
  s.fields.forEach(f=>{ f.pkey = s.id + '.' + f.id; });
  const b = h('button', {type:'button', class:'btn pencil', 'aria-pressed':'false', title:'Олівець: змінити текст кнопки або сховати її — натисніть кнопку, яку правите', onclick:()=>{
    const on = PENCIL !== s; PENCIL = on ? s : null;
    document.querySelectorAll('.pencil').forEach(x=>x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('pencilon', on); s.panel.classList.toggle('pencilsec', on);
    SECTIONS.forEach(x=>{ if (x !== s && x.panel) x.panel.classList.remove('pencilsec'); });
    if (on) toast('Олівець ✎: натисніть кнопку, яку хочете змінити або сховати. Вимкнути — ✎ ще раз', 3500); }}, '✎');
  a.append(b);
});
document.addEventListener('click', e=>{
  if (!PENCIL) return;
  const c = e.target.closest && e.target.closest('.pencilsec .chip'); if (!c) return;
  for (const f of PENCIL.fields){
    const i = f.chips ? f.chips.indexOf(c) : -1;
    if (i >= 0){ e.preventDefault(); e.stopImmediatePropagation(); pencilEdit(f, i, c); return; }
    const sb = f.type === 'sel' && f.el && f.el.nextElementSibling && f.el.nextElementSibling.classList.contains('segbtns') ? f.el.nextElementSibling : null;
    if (sb && sb.contains(c)){ const k = [...sb.querySelectorAll('.chip')].indexOf(c); if (k >= 0){ e.preventDefault(); e.stopImmediatePropagation(); pencilEdit(f, k, c); return; } }
  }
}, true);
document.addEventListener('mousedown', e=>{
  if (!PENCIL) return; const se = e.target.closest && e.target.closest('.pencilsec select'); if (!se) return;
  const f = PENCIL.fields.find(x=>x.el === se); if (!f || f.type !== 'sel') return;
  e.preventDefault(); if (se.value === ''){ toast('Спершу оберіть варіант у списку (вимкніть ✎), потім змініть його олівцем', 3500); return; }
  pencilEdit(f, +se.value, se);
}, true);
document.addEventListener('keydown', e=>{ if (e.key === 'Escape') document.querySelectorAll('.pened').forEach(x=>x.remove()); });

/* ---------- пакети фраз із підписом автора ---------- */
let PACKS = (()=>{ try{ return JSON.parse(lsGet('po.packs', '[]')) || []; }catch(e){ return []; } })();
const savePacks = () => lsSet('po.packs', JSON.stringify(PACKS.map(p=>Object.assign({}, p))));
function packExportDialog(){
  const fld = (l, ph, v) => { const i = h('input', {placeholder:ph, value:v || ''}); return [h('label', {class:'wl'}, l, i), i]; };
  const [l1, nm] = fld('Назва пакета', 'напр., «Пульмонологія — щоденники»');
  const [l2, au] = fld('Автор (ПІБ)', 'Прізвище І. Б.', mv('doc'));
  const [l3, sz] = fld('Посада, стаж', 'напр., лікар-пульмонолог, стаж 12 років', mv('pos'));
  const [l4, dt] = fld('Дата затвердження', '', new Date().toLocaleDateString('uk-UA'));
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Пакет фраз'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Зберегти пакет фраз із підписом'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('p', {class:'chips-hint'}, 'У пакет ідуть ваші варіанти, змінені формулювання, кнопки, шаблони щоденника й призначень. Дані пацієнтів не потрапляють. Колега побачить, хто автор, і зможе повернути як було.'),
      h('div', {class:'wgrid'}, l1, l2, l3, l4),
      h('div', {class:'acts2', style:'margin-top:12px'}, h('button', {type:'button', class:'btn primary', onclick:()=>{
        if (!nm.value.trim() || !au.value.trim()){ toast('Вкажіть назву пакета й автора'); return; }
        const pack = {name:nm.value.trim(), author:au.value.trim(), stazh:sz.value.trim(), date:dt.value.trim(), app:'Первинний огляд ' + VERSION};
        downloadJSON({type:'po-templates', pack, opts:CUSTOM.opts, presets:CUSTOM.presets, ovr:CUSTOM.ovr, hid:CUSTOM.hid, diary:CUSTOM.diary, btns:CUSTOM.btns || [], rxsets:CUSTOM.rxsets || []},
          'paket_' + pack.name.replace(/[^\p{L}\d]+/gu, '_').slice(0, 40) + '.json');
        logAct('Збережено пакет фраз', pack.name); dlg.remove(); }}, 'Зберегти пакет у файл'))));
  document.body.append(dlg); nm.focus();
}
function packInstall(o, file){
  const pk = o.pack;
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Встановити пакет'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Пакет фраз: ' + pk.name), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('div', {class:'packsig'}, h('div', {}, 'Автор: ', h('b', {}, pk.author || '—')), pk.stazh ? h('div', {}, pk.stazh) : '', pk.date ? h('div', {}, 'Затверджено: ' + pk.date) : '', pk.app ? h('div', {class:'chips-hint'}, 'Створено в: ' + pk.app) : ''),
      h('p', {class:'chips-hint'}, 'Фрази додадуться до ваших, нічого не стирається. Передумаєте — «Повернути як було» в «Моїх шаблонах».'),
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>{
        PACKS.push({id:'k' + Date.now(), name:pk.name, author:pk.author, stazh:pk.stazh, date:pk.date, at:Date.now(), before:JSON.stringify(CUSTOM)}); savePacks();
        importTpl0(file); logAct('Встановлено пакет фраз', pk.name + ' — ' + (pk.author || '')); dlg.remove(); setTimeout(renderPacks, 300); }}, 'Встановити'),
        h('button', {type:'button', class:'more', onclick:()=>dlg.remove()}, 'Скасувати'))));
  document.body.append(dlg);
}
const importTpl0 = importTpl;
importTpl = function(file){
  const rd = new FileReader();
  rd.onload = () => { let o = null; try{ o = JSON.parse(rd.result); }catch(e){} if (o && o.type === 'po-templates' && o.pack && o.pack.name) packInstall(o, file); else importTpl0(file); };
  rd.readAsText(file);
};
let packBox = null;
function renderPacks(){
  if (!packBox) return; packBox.innerHTML = '';
  if (!PACKS.length){ packBox.append(h('p', {class:'chips-hint'}, 'Встановлених пакетів немає.')); return; }
  PACKS.slice().reverse().forEach(p=>{
    const back = h('button', {type:'button', class:'more', onclick:()=>{ if (!back.dataset.arm){ back.dataset.arm = '1'; back.textContent = 'Точно? Зміни після встановлення теж зникнуть'; setTimeout(()=>{ delete back.dataset.arm; back.textContent = 'Повернути як було'; }, 4000); return; }
      try{ localStorage.setItem('po.custom', p.before); }catch(e){} PACKS = PACKS.filter(x=>PACKS.indexOf(x) < PACKS.indexOf(p)); savePacks(); logAct('Пакет фраз прибрано', p.name); toast('Повернуто як було до пакета — програма перезавантажиться'); setTimeout(()=>location.reload(), 900); }}, 'Повернути як було');
    packBox.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, p.name), h('span', {}, [p.author, p.stazh, p.date ? 'затв. ' + p.date : '', 'встановлено ' + new Date(p.at).toLocaleDateString('uk-UA')].filter(Boolean).join(' · '))), back));
  });
}
{ const pt = [...document.querySelectorAll('#panels .pt h3')].find(x=>/Обмін з колегами/.test(x.textContent));
  if (pt){ const box = pt.parentElement, a = box.querySelector('.acts2');
    if (a) a.prepend(h('button', {type:'button', class:'btn primary', onclick:packExportDialog}, 'Пакет із підписом автора…'));
    packBox = h('div', {class:'plist packs'}); box.append(h('h3', {class:'sub'}, 'Встановлені пакети фраз'), packBox); renderPacks(); } }

/* ---------- перегляд перед друком на весь екран ---------- */
let PV = null;
function pvOpen(){
  if (!itext($('#out')).trim()){ toast('Текст документа порожній'); return; }
  pvClose();
  const sheet = h('div', {class:'sheet'}), paper = h('div', {class:'paper pvpaper'}, sheet), side = h('div', {class:'pvside'});
  const zl = h('span', {class:'pvz'}, '');
  let zoom = lsGet('po.pvzoom', 'page');
  const setZ = z => { zoom = z; lsSet('po.pvzoom', String(z)); fitZ(); };
  const fitZ = () => { const pages = [...sheet.querySelectorAll('.b003, .pr-doc')], w = paper.clientWidth - 48, hh = paper.clientHeight - 48;
    const pw = 794, ph = 1123; let k = zoom === 'page' ? Math.min(w / pw, hh / ph) : zoom === 'width' ? w / pw : +zoom; k = Math.max(0.3, Math.min(2, k || 1));
    sheet.style.setProperty('--pvz', k.toFixed(3)); zl.textContent = Math.round(k * 100) + ' %'; };
  const tb = h('div', {class:'pvtop'},
    h('b', {}, 'Перегляд перед друком — ' + DOCN(DOC)),
    h('span', {class:'seg'}, ...[['page','Сторінка'],['width','По ширині'],['1','100 %']].map(([z, t])=>h('button', {type:'button', onclick:()=>setZ(z)}, t))),
    h('button', {type:'button', class:'btn', 'aria-label':'Зменшити', onclick:()=>setZ(Math.max(0.3, (parseFloat(sheet.style.getPropertyValue('--pvz')) || 1) - 0.1).toFixed(2))}, '−'), zl,
    h('button', {type:'button', class:'btn', 'aria-label':'Збільшити', onclick:()=>setZ(Math.min(2, (parseFloat(sheet.style.getPropertyValue('--pvz')) || 1) + 0.1).toFixed(2))}, '+'),
    h('span', {style:'flex:1'}),
    h('button', {type:'button', class:'btn primary', onclick:()=>{ pvClose(); doPrint(); }}, 'Друк'),
    h('button', {type:'button', class:'btn', onclick:()=>{ pvClose(); $('#docxBtn').click(); }}, 'Word'),
    h('button', {type:'button', class:'btn', onclick:()=>{ pvClose(); $('#odtBtn').click(); }}, 'LibreOffice'),
    h('button', {type:'button', class:'btn', onclick:pvClose}, 'Закрити ✕'));
  PV = h('div', {class:'pvfull', role:'dialog', 'aria-modal':'true', 'aria-label':'Перегляд перед друком'}, tb, h('div', {class:'pvbody'}, paper, side));
  PV.draw = () => {
    fillSheet(sheet, false); sheet.classList.toggle('blankmode', typeof blankOn === 'function' && blankOn());
    const n = sheet.querySelectorAll('.b003').length;
    side.innerHTML = '';
    if (typeof blankBar === 'function' && blankOK()) side.append(h('h4', {}, 'Бланк'), blankBar());
    side.append(h('h4', {}, 'Папір і принтер'));
    const pc = h('div', {class:'acts2 paperctl'}); side.append(pc);
    { const keep = paperCtl; paperCtl = pc; drawPaperCtl(); paperCtl = keep; }
    side.append(h('p', {class:'chips-hint'}, n ? `Аркушів: ${n}` : 'Текст документа — на аркуші А4 з шапкою закладу.'));
    fitZ();
  };
  document.body.append(PV); document.body.classList.add('pvopen'); PV.draw();
  PV.esc = e => { if (e.key === 'Escape') pvClose(); }; document.addEventListener('keydown', PV.esc);
  PV.rz = () => fitZ(); window.addEventListener('resize', PV.rz);
  logAct('Перегляд перед друком', DOCN(DOC));
}
function pvClose(){ if (!PV) return; document.removeEventListener('keydown', PV.esc); window.removeEventListener('resize', PV.rz); PV.remove(); PV = null; document.body.classList.remove('pvopen'); }
{ const rp = renderPaper; renderPaper = function(){ const r = rp.apply(this, arguments); try{ if (PV) PV.draw(); }catch(e){} return r; }; }
{ const sp = setPaper; setPaper = function(){ const r = sp.apply(this, arguments); try{ if (PV) PV.draw(); }catch(e){} return r; }; }
{ const acts = $('#outBox .oh .acts'); if (acts) acts.prepend(h('button', {type:'button', class:'btn', id:'pvBtn', title:'Перегляд перед друком на весь екран: масштаб, бланк, папір і принтер', 'aria-label':'Перегляд перед друком на весь екран', onclick:pvOpen}, '⤢')); }

/* ---------- друк пачкою: вибрані пацієнти ---------- */
function batchPrint(ids, doc){
  if (!ids.length) return;
  if (PID || patientName()) savePatient(true);
  const cur = PID, curSnap = cur ? null : snap(), curDoc = DOC;
  const parts = [];
  try{
    ids.forEach(id=>{ const p = loadStore()[id]; if (!p || !p.snap) return;
      PID = id; restore(p.snap); if (DOC !== doc){ CACHE[DOC] = {html:$('#out').innerHTML, dirty}; DOC = doc; applyDoc(); update(); }
      const part = h('div', {class:'bprint-one'}); fillSheet(part, false); parts.push(part); });
  } finally {
    clearTimeout(saveTimer);
    if (cur){ PID = cur; restore(loadStore()[cur].snap); } else { PID = null; restore(curSnap); }
    if (DOC !== curDoc) switchDoc(curDoc);
    clearTimeout(saveTimer);
  }
  const P = $('#print'); P.innerHTML = ''; parts.forEach(x=>P.append(x));
  logAct('Друк пачкою', `${DOCN(doc)} — ${parts.length} пацієнтів`);
  toast(`Друк пачкою: ${DOCN(doc)}, пацієнтів — ${parts.length}`, 3000);
  setTimeout(()=>window.print(), 60);
}
{ const os = openSwitcher; openSwitcher = function(){ const r = os.apply(this, arguments);
    const dlg = document.querySelector('.pmgr'); if (!dlg) return r; const bar = dlg.querySelector('.pmbar');
    const add = () => { if (!bar || bar.querySelector('.bprint')) return; const ids = [...dlg.querySelectorAll('.pmrow')].filter(x=>x.querySelector('input[type=checkbox]').checked).map(x=>x.dataset.id).filter(Boolean);
      if (!ids.length) return;
      const docs = MODE === 'amb' ? [['ohl','Первинний огляд'],['shch','Повторний огляд'],['kons','Консультаційний висновок']] : [['ohl','Первинний огляд'],['shch','Щоденник'],['epi','Виписний епікриз']];
      const sel = h('select', {'aria-label':'Що друкувати'}, ...docs.map(([k, t])=>h('option', {value:k}, t)));
      bar.append(h('span', {class:'bprint'}, sel, h('button', {type:'button', class:'btn', onclick:()=>{ dlg.remove(); batchPrint(ids, sel.value); }}, `Друкувати вибраних (${ids.length})`))); };
    new MutationObserver(add).observe(bar, {childList:true}); add();
    return r; }; }
/* Ctrl+K */
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'Перегляд перед друком на весь екран', go:pvOpen}, {k:'Дія', t:'Пакет фраз із підписом автора', go:packExportDialog}, {k:'Дія', t:'Друк пачкою: вибрати пацієнтів', go:openSwitcher}); return L; }; }
