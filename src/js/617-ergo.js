/* ===== Ергономіка, крок 1 (0.9.3.31) =====
   1) Кнопки замість списків (segFor, 549) — тепер до 6 варіантів і довші підписи; відхилення від норми — жовтим.
   2) У заголовку вкладки — одна кнопка «Норма»; решта дій — під «⋯».
   3) Банер «Папка даних не підключена» після «Пізніше» згортається в значок у рядку пацієнта.
   4) Швидкий рядок показників: «38,5 24 92 130/80 96» → t, ЧД, SpO2, АТ, ЧСС. */
/* ---- одна кнопка «Норма», решта під «⋯» ---- */
function ergoActs(){
  SECTIONS.forEach(s=>{
    const a = s.panel && s.panel.querySelector('.ph .acts2'); if (!a || a.dataset.ergo) return;
    a.dataset.ergo = '1';
    const btns = [...a.children].filter(b=>b.tagName === 'BUTTON');
    const norm = btns.find(b=>b.classList.contains('norm'));
    const bo = btns.find(b=>/^Б\/о/.test(b.textContent));
    const keep = new Set(btns.filter(b=>b.classList.contains('tplsec')));
    if (norm){ norm.textContent = 'Норма'; keep.add(norm); } else if (bo) keep.add(bo);
    const rest = btns.filter(b=>!keep.has(b)); if (!rest.length) return;
    let dd = a.querySelector('details.more-dd'), menu = dd && dd.querySelector('.mmenu');
    if (!menu){ menu = h('div', {class:'mmenu', role:'menu'});
      dd = h('details', {class:'more-dd'}, h('summary', {class:'btn', title:'Інші дії', 'aria-label':'Інші дії'}, '⋯'), menu); a.append(dd); }
    else a.append(dd);
    rest.reverse().forEach(b=>{ b.classList.remove('btn'); b.classList.add('more'); b.setAttribute('role', 'menuitem');
      if (b.classList.contains('pencil')) b.textContent = '✎ Олівець: змінити чи сховати кнопки';
      if (b.textContent === 'Б/о') b.textContent = 'Б/о — одним рядком';
      b.addEventListener('click', ()=>{ dd.open = false; });
      menu.prepend(b); });
  });
}

/* ---- банер папки → значок ---- */
function fsIcon(){
  const pl = document.getElementById('ptline'); if (!pl) return;
  let ic = document.getElementById('fsIcon');
  const later = fsSupported() && lsGet('po.welcome', '') !== '' && !FS.dir && lsGet('po.fslater', '') === fsToday();
  if (!later){ if (ic) ic.hidden = true; return; }
  if (!ic){
    ic = h('button', {type:'button', id:'fsIcon', class:'fsicon', title:'Папка даних не підключена — пацієнти лише в цьому браузері. Натисніть, щоб підключити.', 'aria-label':'Папка даних не підключена',
      onclick:()=>{ lsSet('po.fslater', ''); fsBanner(); fsIcon(); }}, '📁');
    pl.append(ic);
  }
  ic.hidden = false;
}
{ const fb = fsBanner; fsBanner = function(){ const r = fb.apply(this, arguments); try{ fsIcon(); }catch(e){} return r; }; }
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('#fsBanner button'); if (b && b.textContent === 'Пізніше') setTimeout(()=>{ try{ fsIcon(); }catch(x){} }, 0); });

/* ---- швидкий рядок показників ---- */
const VQ = {
  ohl:{ t:'zah.temp', ad:'ssc.ad', chss:'ssc.chss', chd:'dyh.chd', host:'zah' },
  shch:{ t:'d_obj.t', ad:'d_obj.ad', chss:'d_obj.chss', chd:'d_obj.chd', host:'d_obj' }
};
const vqNum = s => +String(s).replace(',', '.');
function vqParse(str){
  const r = {}, free = [];
  String(str || '').toLowerCase().replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')
    .replace(/(^|\s)(t|т|темп|чд|ч\.д\.?|spo2|sp|сат|sat|ад|ат|bp|чсс|пульс|п|hr)\s*[:=]?\s+(?=\d)/g, '$1$2').split(/[\s;]+/).filter(Boolean).forEach(tk=>{
    const m = tk.match(/^(t|т|темп|чд|ч\.д\.?|sp|spo2|сат|sat|ад|ат|bp|чсс|пульс|п|hr)?[:=]?(\d+(?:[.,]\d+)?(?:\/\d+)?)%?$/);
    if (!m) return;
    const k = m[1] || '', v = m[2];
    if (v.includes('/')){ const [a, b] = v.split('/'); r.ad = [a, b]; return; }
    if (/^(t|т|темп)$/.test(k)) r.t = v.replace('.', ',');
    else if (/^(чд|ч\.д\.?)$/.test(k)) r.chd = v;
    else if (/^(sp|spo2|сат|sat)$/.test(k)) r.sat = v;
    else if (/^(чсс|пульс|п|hr)$/.test(k)) r.chss = v;
    else if (/^(ад|ат|bp)$/.test(k)) return;
    else free.push(v);
  });
  free.forEach(v=>{
    const n = vqNum(v);
    if (r.t === undefined && (/[.,]/.test(v) || (n >= 34 && n <= 42.9))){ r.t = v.replace('.', ','); return; }
    if (r.chd === undefined) r.chd = v;
    else if (r.sat === undefined) r.sat = v;
    else if (r.chss === undefined) r.chss = v;
  });
  return r;
}
function vqApply(str){
  const m = VQ[DOC]; if (!m) return [];
  const v = vqParse(str), done = [];
  const bad = (f, i, x) => { const p = f.parts[i], n = vqNum(x); return !!(p && p.ok && (n < p.ok[0] || n > p.ok[1])); };
  const put = (key, i, x, name) => { const f = F(key); if (!f || !f.inputs || x === undefined) return;
    if (bad(f, i, x)){ done.push('⚠ ' + name + ' ' + x + '?'); return; }
    f.inputs[i].value = x; done.push(name + ' ' + x); };
  put(m.t, 0, v.t, 't');
  put(m.chd, 0, v.chd, 'ЧД'); put(m.chd, 1, v.sat, 'SpO2');
  if (v.ad){ const f = F(m.ad); if (f && f.inputs){ if (bad(f, 0, v.ad[0]) || bad(f, 1, v.ad[1])) done.push('⚠ АТ ' + v.ad.join('/') + '?'); else { f.inputs[0].value = v.ad[0]; f.inputs[1].value = v.ad[1]; done.push('АТ ' + v.ad.join('/')); } } }
  put(m.chss, 0, v.chss, 'ЧСС');
  if (done.length) update();
  return done;
}
function vqBuild(){
  Object.keys(VQ).forEach(doc=>{
    const s = SECTIONS.find(x=>x.id === VQ[doc].host); if (!s || !s.panel || s.vqEl) return;
    const grid = s.panel.querySelector('.grid'); if (!grid) return;
    const inp = h('input', {type:'text', class:'vq-in', id:'vq_' + doc, inputmode:'text', autocomplete:'off',
      placeholder:'38,5 24 92 130/80 96', 'aria-label':'Показники одним рядком: температура, ЧД, SpO2, АТ, ЧСС'});
    const msg = h('span', {class:'hint vq-msg', 'aria-live':'polite'});
    const go = () => { const d = vqApply(inp.value); msg.textContent = d.length ? 'Записано: ' + d.join(', ') : 'Не розпізнано — приклад: 38,5 24 92 130/80 96'; if (d.length && !d.some(x=>x[0] === '⚠')) inp.value = ''; };
    inp.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
    s.vqEl = h('div', {class:'f wide vq', 'data-docs':doc},
      h('label', {for:inp.id}, 'Показники одним рядком'),
      h('div', {class:'vq-row'}, inp, h('button', {type:'button', class:'btn', onclick:go}, 'Внести'), msg),
      h('p', {class:'vq-h'}, 'Температура, ЧД, SpO2, АТ, ЧСС — через пробіл. Можна з мітками: «ад 150/90 п 88».'));
    grid.prepend(s.vqEl);
  });
}
function vqVis(){ Object.keys(VQ).forEach(doc=>{ const s = SECTIONS.find(x=>x.id === VQ[doc].host); if (s && s.vqEl) s.vqEl.hidden = DOC !== doc; }); }
{ const up = update; update = function(){ const r = up.apply(this, arguments); try{ vqVis(); }catch(e){} return r; }; }

try{ ergoActs(); vqBuild(); vqVis(); fsIcon(); }catch(e){ console.warn('ergo', e); }
