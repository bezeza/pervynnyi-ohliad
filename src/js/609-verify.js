/* ===== Перевірка клінічного вмісту (0.9.3.20) =====
   Кожен шаблон хвороби, схема лікування, критерії госпіталізації (№ 1044), норми аналізів, препарат довідника й шкала
   має статус: «чернетка» (не перевірено), «перевірено» (хто, коли) або «змінено після перевірки» — якщо вміст
   змінився з оновленням програми, позначка сама знімається. Документ для звірки — друк або файл, з місцем для підпису.
   Статуси зберігаються в po.verify (переносяться разом із налаштуваннями й у папку даних). */
const VKEY = 'po.verify';
const vLoad = () => { try{ return JSON.parse(lsGet(VKEY, '{}')) || {}; }catch(e){ return {}; } };
const vSave = o => lsSet(VKEY, JSON.stringify(o));
const vHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const vRxLine = r => [r[0], r[1], r[2], r[3], r[4] ? r[4] + ' дн.' : '', r[5]].filter(x=>x !== '' && x != null).join(' · ');
const vNormTxt = p => p.txt ? (p.ph ? 'текст: ' + p.ph : 'текст') : (p.m ? `${dec(p.m[0])}–${dec(p.m[1])}` + (p.f && (p.f[0] !== p.m[0] || p.f[1] !== p.m[1]) ? ` (ч), ${dec(p.f[0])}–${dec(p.f[1])} (ж)` : '') : 'норму не задано');
const VCATS = [['tpl','Шаблони хвороб'],['rx','Схеми лікування'],['krit','Критерії госпіталізації (№ 1044)'],['norm','Норми аналізів'],['drug','Довідник препаратів'],['calc','Шкали']];
/* усі пункти для перевірки: {k, cat, title, sub, lines[]} */
function vItems(){
  const L = [], add = (cat, id, title, sub, lines) => L.push({k:cat + ':' + id, cat, title, sub, lines});
  PRESETS.forEach(p=>{
    add('tpl', p.key, p.name, (p.mkh || '') + (p.group ? ' · ' + p.group : ''), [
      'Діагноз: ' + (p.osn || '—') + (p.mkh ? ' (' + p.mkh + ')' : ''), p.uskl ? 'Ускладнення: ' + p.uskl : '',
      'Скарги: ' + (p.skarhy || []).join(', '),
      ...Object.entries(p.det || {}).map(([k, v])=>'  ' + k + ': ' + v.join(', ')),
      ...Object.entries(p.set || {}).map(([k, v])=>'Огляд, ' + k + ': ' + v),
      p.both && p.both.osn ? 'З обох боків: ' + p.both.osn : '',
      'План обстеження: ' + (p.plan || []).join(', ')].filter(Boolean));
    const rx = RXS[p.key] || p.rx || [], ra = RXA[p.key], rv = (typeof RXV !== 'undefined' && RXV[p.key]) || [], src = (typeof RXSRC !== 'undefined' && RXSRC[p.key]) || null;
    if (rx.length || (ra && ra.length) || rv.length) add('rx', p.key, p.name, src ? 'джерело: ' + src[0] + (src[2] ? '; ' + src[2] : '') : 'джерело не вказано', [
      ...(rx.length ? ['Стаціонар:', ...rx.map(r=>'  ' + vRxLine(r))] : []),
      ...(ra && ra.length ? ['Амбулаторно:', ...ra.map(r=>'  ' + vRxLine(r))] : ra ? ['Амбулаторно: схеми немає — лікування в стаціонарі'] : []),
      ...rv.flatMap(v=>['Варіант «' + v[0] + '»:', ...v[1].map(r=>'  ' + vRxLine(r))])]);
    const kr = KRIT[p.key]; if (kr && kr.length) add('krit', p.key, p.name, 'наказ МОЗ № 1044', kr.slice());
  });
  LABCAT.forEach(t=>add('norm', t.t, t.t, (LGROUPS.find(g=>g[0] === t.g) || [, ''])[1], t.p.map(p=>p.n + (p.u ? ', ' + p.u : '') + ': ' + vNormTxt(p))));
  DRUGS.forEach(d=>add('drug', d.n, d.n, d.ab ? 'AWaRe: ' + (AWARE[d.ab] || d.ab) : '', [
    'Типова доза: ' + [d.d, d.r, d.f].filter(Boolean).join(' · '), ...(d.renal || []).map(r=>`КК < ${r.lt} мл/хв: ${r.m}`), d.max ? 'Максимум: ' + d.max : '', d.note || ''].filter(Boolean)));
  CALCS.forEach(c=>add('calc', c.id, c.title, '', [c.desc, ...(c.items || []).map(i=>'□ ' + i[1] + (i[2] ? ` (${i[2] > 0 ? '+' : ''}${i[2]})` : '')), ...(c.sel || []).map(s=>s[1] + ': ' + s[2].map(o=>o[0] + ' (' + o[1] + ')').join('; '))]));
  L.forEach(it=>{ const extra = it.cat === 'calc' ? String((CALCS.find(c=>c.id === it.k.slice(5)) || {}).run || '') : ''; it.h = vHash(JSON.stringify(it.lines) + extra); });
  return L;
}
function vStatus(it, V){ const r = (V || vLoad())[it.k]; if (!r) return {s:'draft'}; return r.h === it.h ? {s:'ok', r} : {s:'changed', r}; }
const V_L = {draft:'чернетка', ok:'перевірено', changed:'змінено після перевірки'};
const vWho = () => lsGet('po.vwho', '') || (document.getElementById('meta_doc') || {}).value || '';
const fmtTs = t => new Date(t).toLocaleDateString('uk-UA');
/* статус одного пункту — для позначок у програмі */
function vOf(k){ const it = vItems().find(x=>x.k === k); return it ? vStatus(it) : null; }

/* ---------- діалог перевірки ---------- */
function verifyOpen(cat0, key0){
  const items = vItems(); let cat = cat0 || 'tpl', flt = 'all', q = '';
  const dlg = h('div', {class:'navsheet vdlg', role:'dialog', 'aria-modal':'true', 'aria-label':'Перевірка клінічного вмісту'});
  const close = () => { dlg.remove(); document.body.style.overflow = ''; try{ renderTabNav(); vMarks(); }catch(e){} };
  const who = h('input', {type:'text', id:'vWho', value:vWho(), placeholder:'ПІБ, посада того, хто перевіряє', oninput:()=>lsSet('po.vwho', who.value.trim())});
  const tabs = h('div', {class:'vtabs', role:'tablist'}), sum = h('p', {class:'chips-hint vsum'}), list = h('div', {class:'vlist'});
  const fsel = h('select', {'aria-label':'Показати', onchange:()=>{ flt = fsel.value; draw(); }},
    h('option', {value:'all'}, 'Усі'), h('option', {value:'draft'}, 'Не перевірені'), h('option', {value:'changed'}, 'Змінені після перевірки'), h('option', {value:'ok'}, 'Перевірені'));
  const srch = h('input', {type:'search', placeholder:'Пошук…', 'aria-label':'Пошук', oninput:()=>{ q = srch.value.trim().toLowerCase(); draw(); }});
  const mark = (it, on, note) => { const V = vLoad(); if (on){ const w = who.value.trim(); if (!w){ toast('Впишіть, хто перевіряє (ПІБ, посада)'); who.focus(); return false; } V[it.k] = {h:it.h, by:w, at:Date.now(), note:note || ''}; } else delete V[it.k]; vSave(V); typeof logAct === 'function' && logAct((on ? 'Перевірено: ' : 'Знято позначку: ') + VCATS.find(c=>c[0] === it.cat)[1] + ' — ' + it.title); return true; };
  function draw(){
    const V = vLoad();
    tabs.innerHTML = '';
    VCATS.forEach(([c, l])=>{ const its = items.filter(x=>x.cat === c), ok = its.filter(x=>vStatus(x, V).s === 'ok').length;
      tabs.append(h('button', {type:'button', role:'tab', class:'btn' + (c === cat ? ' on' : ''), 'aria-selected':c === cat ? 'true' : 'false', onclick:()=>{ cat = c; draw(); }}, l, h('span', {class:'vcnt'}, ` ${ok}/${its.length}`))); });
    const all = items.length, okAll = items.filter(x=>vStatus(x, V).s === 'ok').length, chAll = items.filter(x=>vStatus(x, V).s === 'changed').length;
    sum.textContent = `Перевірено ${okAll} з ${all}` + (chAll ? ` · змінено після перевірки: ${chAll}` : '') + '. Позначка знімається сама, якщо з оновленням програми вміст змінився.';
    list.innerHTML = '';
    const its = items.filter(x=>x.cat === cat && (flt === 'all' || vStatus(x, V).s === flt) && (!q || (x.title + ' ' + x.lines.join(' ')).toLowerCase().includes(q)));
    if (!its.length) list.append(h('p', {class:'chips-hint'}, 'Нічого не знайдено.'));
    its.forEach(it=>{
      const st = vStatus(it, V), note = h('input', {type:'text', class:'vnote', placeholder:'Зауваження (що виправити) — необов’язково', value:st.r && st.r.note || ''});
      const det = h('details', {class:'vitem v-' + st.s, id:'v_' + it.k.replace(/[^\wа-яіїєґ]/gi, '_')},
        h('summary', {}, h('span', {class:'vt'}, it.title), it.sub ? h('span', {class:'vs'}, it.sub) : '', h('span', {class:'vpill'}, V_L[st.s] + (st.r ? ' · ' + st.r.by + ', ' + fmtTs(st.r.at) : ''))),
        h('pre', {class:'vbody'}, it.lines.join('\n')),
        h('div', {class:'vacts'}, note,
          st.s === 'ok' ? h('button', {type:'button', class:'btn', onclick:()=>{ mark(it, false); draw(); }}, 'Зняти позначку')
            : h('button', {type:'button', class:'btn primary', onclick:()=>{ if (mark(it, true, note.value.trim())){ toast('Позначено: перевірено'); draw(); } }}, '✓ Перевірено'),
          st.s === 'ok' ? h('button', {type:'button', class:'btn', onclick:()=>{ const V2 = vLoad(); if (V2[it.k]){ V2[it.k].note = note.value.trim(); vSave(V2); toast('Зауваження збережено'); } }}, 'Зберегти зауваження') : ''));
      if (key0 && it.k === cat + ':' + key0) det.open = true;
      list.append(det);
    });
  }
  dlg.append(
    h('div', {class:'nshead'}, h('b', {}, 'Перевірка клінічного вмісту'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('p', {class:'chips-hint'}, 'Шаблони, схеми, дози, критерії й норми — чернетка, доки їх не перевірить профільний фахівець. Відкрийте пункт, звірте з чинними наказами й настановами, натисніть «✓ Перевірено» або запишіть зауваження.'),
    h('div', {class:'res-form vwho'}, h('label', {for:'vWho', class:'lbl', style:'margin:0'}, 'Хто перевіряє'), who),
    h('div', {class:'vbar'},
      h('button', {type:'button', class:'btn', onclick:()=>vDocPrint(cat)}, '🖨 Документ для звірки (цей розділ)'),
      h('button', {type:'button', class:'btn', onclick:()=>vDocPrint(null)}, 'Документ: усе'),
      h('button', {type:'button', class:'btn', onclick:vExport}, 'Зберегти позначки у файл'),
      h('button', {type:'button', class:'btn', onclick:()=>vImport(draw)}, 'Додати позначки з файлу')),
    tabs, h('div', {class:'vflt'}, srch, fsel), sum, list);
  document.body.append(dlg); document.body.style.overflow = 'hidden';
  dlg.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });
  draw();
  if (key0) setTimeout(()=>{ const o = dlg.querySelector('details[open]'); if (o) o.scrollIntoView({block:'center'}); }, 50);
}
/* ---------- документ для звірки ---------- */
function vDocHTML(cat){
  const V = vLoad(), items = vItems().filter(x=>!cat || x.cat === cat), esc = s => String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const zoz = (document.getElementById('meta_zoz') || {}).value || '', vidd = (document.getElementById('meta_vidd') || {}).value || '';
  const parts = VCATS.filter(c=>!cat || c[0] === cat).map(([c, l])=>{ const its = items.filter(x=>x.cat === c); if (!its.length) return '';
    return `<h2>${esc(l)} <small>(${its.filter(x=>vStatus(x, V).s === 'ok').length} з ${its.length} перевірено)</small></h2>` + its.map(it=>{ const st = vStatus(it, V);
      return `<div class="it"><div class="hd"><b>${esc(it.title)}</b>${it.sub ? ' <span class="sub">' + esc(it.sub) + '</span>' : ''}<span class="st ${st.s}">${V_L[st.s]}${st.r ? ': ' + esc(st.r.by) + ', ' + fmtTs(st.r.at) : ''}</span></div><pre>${esc(it.lines.join('\n'))}</pre>${st.r && st.r.note ? '<p class="nt">Зауваження: ' + esc(st.r.note) + '</p>' : ''}<p class="sg">☐ Відповідає &nbsp; ☐ Потребує змін: ________________________________________________</p></div>`; }).join(''); }).join('');
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Звірка клінічного вмісту — Первинний огляд ${VERSION}</title><style>
body{font:10.5pt/1.4 "Times New Roman",serif;margin:16mm 14mm;color:#000}h1{font-size:14pt;margin:0 0 4px}h2{font-size:12pt;margin:18px 0 6px;border-bottom:1px solid #000;break-after:avoid}h2 small{font-weight:400}
.it{break-inside:avoid;margin:0 0 10px;padding:0 0 6px;border-bottom:1px dotted #888}.hd{display:flex;gap:8px;flex-wrap:wrap;align-items:baseline}.sub{color:#444;font-size:9.5pt}.st{margin-left:auto;font-size:9pt;border:1px solid #000;padding:0 4px}
.st.ok{background:#e8f4ec}.st.changed{background:#fff2cc}pre{font:9.5pt/1.35 "Times New Roman",serif;white-space:pre-wrap;margin:4px 0}.nt{font-style:italic;margin:2px 0}.sg{font-size:9.5pt;margin:2px 0}.meta{font-size:10pt}.sign{margin-top:24px;break-inside:avoid}
@page{size:A4;margin:0}</style></head><body>
<h1>Звірка клінічного вмісту програми «Первинний огляд»</h1>
<p class="meta">Версія ${VERSION} · сформовано ${new Date().toLocaleDateString('uk-UA')}${zoz ? ' · ' + esc(zoz) : ''}${vidd ? ' · ' + esc(vidd) : ''}<br>
Формулювання в програмі скорочені. Звіряйте з чинними наказами МОЗ, стандартами й настановами. Позначте кожен пункт; зауваження внесіть у програму або передайте розробнику.</p>
${parts}
<div class="sign"><p>Перевірив(ла): _______________________________ (ПІБ, посада) &nbsp; Підпис: ____________ &nbsp; Дата: ____________</p>
<p>Затверджую: _______________________________ (заступник головного лікаря з медичної роботи) &nbsp; Підпис: ____________ &nbsp; Дата: ____________</p></div>
</body></html>`;
}
function vDocPrint(cat){
  const html = vDocHTML(cat);
  const fr = h('iframe', {style:'position:fixed;right:0;bottom:0;width:0;height:0;border:0', 'aria-hidden':'true'}); document.body.append(fr);
  const d = fr.contentDocument; d.open(); d.write(html); d.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){ vDocSave(html); } setTimeout(()=>fr.remove(), 60000); }, 300);
  toast('Друк документа для звірки. Щоб надіслати файлом — «Зберегти як PDF» у вікні друку', 4000);
}
function vDocSave(html){ const a = h('a', {href:URL.createObjectURL(new Blob([html], {type:'text/html'})), download:'zvirka_klinichnoho_vmistu_' + VERSION + '.html'}); document.body.append(a); a.click(); a.remove(); }
function vExport(){ const a = h('a', {href:URL.createObjectURL(new Blob([JSON.stringify({type:'po-verify', app:VERSION, at:new Date().toISOString(), data:vLoad()}, null, 1)], {type:'application/json'})), download:'perevirka_vmistu_' + todayISO() + '.json'}); document.body.append(a); a.click(); a.remove(); toast('Позначки збережено у файл — його можна передати колезі або завідувачу'); }
function vImport(after){
  const inp = h('input', {type:'file', accept:'.json,application/json', style:'display:none'});
  inp.onchange = async () => { const f = inp.files[0]; inp.remove(); if (!f) return;
    try{ const o = JSON.parse(await f.text()); if (!o || o.type !== 'po-verify' || !o.data) throw new Error('це не файл позначок перевірки');
      const V = vLoad(); let n = 0; for (const k in o.data){ const r = o.data[k]; if (r && r.h && (!V[k] || (r.at || 0) > (V[k].at || 0))){ V[k] = r; n++; } }
      vSave(V); toast(`Додано позначок: ${n}`); if (after) after(); }catch(e){ toast('Не вдалося прочитати файл: ' + e.message, 5000); } };
  document.body.append(inp); inp.click();
}
/* ---------- позначки в програмі ---------- */
function vMarks(){
  const V = vLoad();
  /* картка шаблону в боковій панелі */
  const tp = document.querySelector('#sidecard .stpl');
  if (tp){ let b = tp.querySelector('.vmark'); if (!b){ b = h('button', {type:'button', class:'vmark', onclick:e=>{ e.stopPropagation(); verifyOpen('tpl', curKey); }}); tp.append(b); }
    const it = curKey && vItems().find(x=>x.k === 'tpl:' + curKey); if (!it){ b.hidden = true; } else { const st = vStatus(it, V); b.hidden = false; b.className = 'vmark v-' + st.s; b.textContent = st.s === 'ok' ? '✓ перевірено' + (st.r ? ': ' + st.r.by.split(/[ ,]/)[0] + ', ' + fmtTs(st.r.at) : '') : st.s === 'changed' ? '⚠ змінено після перевірки' : 'чернетка — не перевірено фахівцем'; b.title = 'Відкрити перевірку шаблону'; } }
  /* картки хвороб */
  document.querySelectorAll('.dcard').forEach(c=>{ const nm = (c.querySelector('b') || {}).textContent, p = PRESETS.find(x=>x.name === nm); if (!p) return;
    const r = V['tpl:' + p.key]; let m = c.querySelector('.vdot'); if (!m){ m = h('span', {class:'vdot', 'aria-hidden':'true'}); c.append(m); }
    m.textContent = r ? '✓' : ''; m.title = r ? 'Шаблон перевірено: ' + r.by : ''; });
  /* шкали */
  CALCS.forEach(c=>{ const s = document.querySelector('#calc_' + c.id + ' > summary'); if (!s) return; let m = s.querySelector('.vdot'); if (!m){ m = h('span', {class:'vdot'}); s.firstChild.after(m); }
    const r = V['calc:' + c.id]; m.textContent = r ? ' ✓' : ''; m.title = r ? 'Шкалу перевірено: ' + r.by : 'Шкалу ще не перевірено фахівцем'; });
}
{ const up = update; update = function(){ const r = up.apply(this, arguments); clearTimeout(vMarks.t); vMarks.t = setTimeout(()=>{ try{ vMarks(); }catch(e){} }, 120); return r; }; }
/* Налаштування: блок перевірки */
{ const box = h('div', {class:'vset'},
    h('p', {class:'chips-hint'}, 'Шаблони хвороб, схеми лікування й дози, критерії госпіталізації (№ 1044), норми аналізів і шкали — чернетка, доки їх не перевірить профільний фахівець. Тут їх можна переглянути, позначити перевіреними й надрукувати документ для звірки з підписом.'),
    h('p', {class:'chips-hint vset-n'}),
    h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>verifyOpen()}, 'Відкрити перевірку'), h('button', {type:'button', class:'btn', onclick:()=>vDocPrint(null)}, '🖨 Документ для звірки')));
  if (SETTINGS_EL) SETTINGS_EL.append(h('h3', {class:'sub'}, 'Перевірка клінічного вмісту'), box);
  const n = () => { const its = vItems(), V = vLoad(); box.querySelector('.vset-n').textContent = `Перевірено ${its.filter(x=>vStatus(x, V).s === 'ok').length} з ${its.length}.`; };
  try{ n(); }catch(e){}
  const sh = show; show = function(i){ const r = sh.apply(this, arguments); if (TABS[i] === SET) try{ n(); }catch(e){} return r; };
}
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'Перевірка клінічного вмісту (шаблони, дози, норми, № 1044)', s:'', go:()=>verifyOpen()}); return L; }; }
