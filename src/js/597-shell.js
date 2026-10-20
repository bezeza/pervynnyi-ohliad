/* ===== Оформлення 0.9.4 (варіант «Д»): темна шапка з документами, банер пацієнта, бічна панель з прогресом і шаблоном ===== */
const SHELL = {};
{ const top = $('header.top'), wrap = $('main.wrap'), line = $('#ptline'), form = $('.form'), dbar = $('.docbar');
  const seg = $('#docSeg'), more = $('#docMore'), brand = top.querySelector('.brand');
  document.body.classList.add('shell');

  /* 1. документи — вкладками в шапці (на телефоні лишається список у формі) */
  const wideTop = () => !window.matchMedia || matchMedia('(min-width:1280px)').matches;
  const docs = h('nav', {class:'topdocs', 'aria-label':'Документи'});
  brand.after(docs);
  SHELL.placeDocs = () => {
    if (wideTop()){ if (seg.parentElement !== docs) docs.append(seg, more);
      /* не вміщаються в шапку (напр., поруч «Стаціонар / Амбулаторно») — лишаються над формою */
      if (docs.scrollWidth > docs.clientWidth + 2 || seg.scrollWidth > seg.clientWidth + 2 || top.scrollWidth > top.clientWidth + 2) dbar.prepend(seg, more); }
    else if (seg.parentElement !== dbar) dbar.prepend(seg, more);
  };
  SHELL.placeDocs();
  if (window.matchMedia){ const f = () => { SHELL.placeDocs(); SHELL.sync(); }; ['(max-width:899px)', '(min-width:1280px)'].forEach(q=>{ const mq = matchMedia(q); if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); }); }

  /* 2. банер пацієнта на всю ширину: ініціали, ПІБ, діагноз з кодом, день госпіталізації, алергії */
  wrap.before(line);
  const ava = h('span', {class:'pava', 'aria-hidden':'true'}); line.prepend(ava);
  const cols = h('div', {class:'pcols'}); $('#ptbar').after(cols);
  /* стать — одразу біля ПІБ, щоб було зрозуміло, чия вона */
  { const sx = $('#sexSeg'); if (sx){ $('#ptbar').after(sx); sx.title = 'Стать пацієнта'; } }
  const shortDx = t => { t = String(t || '').replace(/\s*\(.*$/, '').split(/[,;.]/)[0].trim(); return t.length > 46 ? t.slice(0, 44).trim() + '…' : t; };
  const dmy = d => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; };
  function drawBanner(){
    const pib = mv('pib');
    ava.textContent = pib ? pib.split(/\s+/).filter(Boolean).slice(0, 2).map(w=>w[0]).join('').toUpperCase() : '?';
    ava.classList.toggle('none', !pib);
    cols.innerHTML = '';
    const col = (l, go, ...v) => cols.append(h('button', {type:'button', class:'pcol', title:'Відкрити: ' + l.toLowerCase(), onclick:go}, h('span', {class:'plab'}, l), h('span', {class:'pval'}, ...v)));
    try{
      const mkh = val(F('dx.mkh'), true), osn = val(F('dx.osn'), true);
      if (mkh || osn) col('Діагноз', ()=>SHELL.goExam('dx', 'dx.osn'), mkh ? h('span', {class:'pcode'}, mkh) : '', shortDx(osn));
      if (MODE === 'hosp'){ const n = stayDay(), d = F('e_per.per').d1.value; if (n || d) col('Госпіталізація', ()=>SHELL.goAdm(), (n ? 'День ' + n : '') + (n && d ? ' · ' : '') + dmy(d)); }
      const a = F('vitae.alerg');
      if (a && a.el && a.el.value !== ''){
        const okA = String(a.el.value) === String(a.norm), x = val(F('vitae.alergx'), true);
        col('Алергії', ()=>SHELL.goExam('vitae', 'vitae.alerg'), h('span', {class:'pbadge ' + (okA ? 'ok' : 'warn')}, okA ? 'не обтяжений' : (x ? shortDx(x) : 'обтяжений')));
      }
    }catch(e){}
    line.classList.toggle('hascols', !!cols.firstChild);
    document.documentElement.style.setProperty('--pbh', line.offsetHeight + 'px');
  }
  /* клік по банеру: поле в первинному огляді (з іншого документа — перейти в огляд) */
  SHELL.goExam = (tab, fld) => { const t = TABS.find(x=>x.id === tab); if (t && !t.docs.includes(DOC)) switchDoc('ohl'); goTab(tab, fld); };
  SHELL.goAdm = () => { if (DOC === 'shch'){ goTab('d_main'); setTimeout(()=>{ const a = document.querySelector('.adm-d'); if (a){ a.scrollIntoView({block:'center'}); a.focus(); const w = a.closest('.res-form') || a; w.classList.add('fieldflash'); setTimeout(()=>w.classList.remove('fieldflash'), 2600); } }, 80); }
    else { if (DOC !== 'epi') switchDoc('epi'); goTab('e_per', 'e_per.per'); } };
  const rp = renderPtBar; renderPtBar = function(){ rp.apply(this, arguments); drawBanner(); };

  /* 3. бічна картка: прогрес заповнення й еталонний шаблон */
  const side = h('div', {id:'sidecard'}), sidein = h('div', {class:'sidein'}), sidecol = h('div', {id:'sidecol'}, sidein);
  $('#tabs').before(sidecol); sidein.append(side, $('#tabs'));
  const pr = h('div', {class:'sprog'}), tpl = h('div', {class:'stpl'});
  side.append(tpl, pr);
  function drawSide(){
    const seq = tabOrder().filter(i=>!TOOL_TABS.includes(TABS[i].id) && TABS[i] !== HV && TABS[i] !== META), done = seq.filter(i=>TABS[i].tab.classList.contains('filled')).length;
    pr.innerHTML = '';
    if (seq.length){ pr.append(h('div', {class:'sp1'}, h('span', {}, 'Заповнено'), h('span', {class:'spn'}, `${done} з ${seq.length}`)),
      h('div', {class:'spbar', role:'progressbar', 'aria-valuemin':'0', 'aria-valuemax':String(seq.length), 'aria-valuenow':String(done), 'aria-label':'Заповнено розділів'}, h('i', {style:`width:${Math.round(done / seq.length * 100)}%`}))); }
    const p = PRESETS.find(x=>x.key === curKey);
    tpl.innerHTML = '';
    tpl.append(h('div', {class:'st1'}, 'Еталонний шаблон'), h('div', {class:'st2'}, p ? p.name : 'не обрано'),
      h('button', {type:'button', class:'btn st3', onclick:()=>show(TABS.indexOf(HV))}, p ? 'Змінити шаблон…' : 'Обрати хворобу…'));
    tpl.classList.toggle('on', !!p);
  }

  /* 4. «За шаблоном» — лише поточний розділ за обраною хворобою */
  const secHas = (s, p) => s.id === 'skarhy' || s.id === 'dx' || s.id === 'morbi' || !!s.objective || Object.keys(p.set || {}).some(k=>k.startsWith(s.id + '.'));
  function presetSection(s){
    const p0 = PRESETS.find(x=>x.key === curKey); if (!p0) return;
    const p = sidePreset(p0);
    if (s.objective && !DSEC.includes(s.id)) applyNorm(s);
    if (s.id === 'skarhy'){ pick(F('skarhy.c'), p.skarhy); detPick(F('skarhy.c'), p.det); }
    if (s.id === 'morbi') anPreset(p0);
    for (const k in (p.set || {})){
      if (!k.startsWith(s.id + '.')) continue;
      const f = F(k); if (!f) continue;
      if (Array.isArray(p.set[k])){ pick(f, p.set[k]); continue; }
      if (f.type === 'line' || f.type === 'text'){ f.el.value = p.set[k]; continue; }
      const i = f.opts.findIndex(o=>O(o).t === p.set[k]); if (i >= 0){ f.el.value = i; mark(f.el, f); }
    }
    if (s.id === 'dx'){ F('dx.osn').el.value = p.osn || ''; F('dx.mkh').el.value = p.mkh || ''; F('dx.uskl').el.value = p.uskl || ''; }
    update(); toast(`«${s.title}» — за шаблоном «${p.name}»`, 2200);
  }
  SHELL.presetSection = typeof undoable === 'function' ? undoable(s=>'розділ «' + s.title + '» за шаблоном', presetSection) : presetSection;
  SECTIONS.forEach(s=>{
    const a = s.panel && s.panel.querySelector('.ph .acts2'); if (!a || DSEC.includes(s.id)) return;
    s.tplBtn = h('button', {type:'button', class:'btn tplsec', hidden:'', title:'Заповнити лише цей розділ за обраною хворобою', onclick:()=>SHELL.presetSection(s)}, 'За шаблоном');
    a.prepend(s.tplBtn);
  });
  function drawTplBtns(){
    const p = PRESETS.find(x=>x.key === curKey);
    SECTIONS.forEach(s=>{ if (s.tplBtn) s.tplBtn.hidden = !p || !secHas(s, p); });
  }

  SHELL.sync = () => { drawBanner(); drawSide(); drawTplBtns(); if (SHELL.docsKey !== MODE + DOC + !$('#modeSeg').hidden){ SHELL.docsKey = MODE + DOC + !$('#modeSeg').hidden; SHELL.placeDocs(); } };
  const up0 = update; update = function(){ const r = up0.apply(this, arguments); try{ SHELL.sync(); }catch(e){} return r; };
  { const s0 = show; show = function(i){ const r = s0.apply(this, arguments); try{ drawSide(); }catch(e){} return r; }; }
  window.addEventListener('resize', ()=>{ document.documentElement.style.setProperty('--pbh', line.offsetHeight + 'px'); clearTimeout(SHELL.rz); SHELL.rz = setTimeout(()=>{ if (seg.parentElement === dbar && wideTop()) docs.append(seg, more); SHELL.placeDocs(); }, 150); });
  SHELL.sync();
}

/* 5. Панель тексту: вкладки «Текст · Перевірка · Перед друком»; дії документа — однією смужкою внизу */
{ const ob = $('#outBox'), oh = ob.querySelector('.oh'), acts = oh.querySelector('.acts'), chk = $('#chk'), note = ob.querySelector('.note');
  const tabs = h('div', {class:'otabs', role:'tablist', 'aria-label':'Вигляд документа'});
  const mk = (k, l, t) => { const b = h('button', {type:'button', role:'tab', title:t, onclick:()=>SHELL.setOV(k)}, l); b.dataset.ov = k; tabs.append(b); return b; };
  const tT = mk('text', 'Текст', 'Готовий текст — можна правити вручну');
  const tC = mk('chk', 'Перевірка', 'Що ще не заповнено перед підписом — натисніть пункт, щоб перейти до поля');
  const tP = mk('paper', 'Перед друком', 'Як буде на папері: шапка закладу, бланк 003/о, пропуски жовтим');
  const cc = h('span', {class:'otc'}); tC.append(cc);
  oh.after(tabs);
  const foot = h('div', {class:'ofoot'}); note.before(foot);
  [$('#copy'), $('#printBtn'), acts.querySelector('.savewrap'), $('#aiBtn')].forEach(b=>{ if (b) foot.append(b); });
  let OV = PAPER ? 'paper' : 'text';
  const sync = () => {
    if (PAPER) OV = 'paper'; else if (OV === 'paper') OV = 'text';
    ob.dataset.ov = OV;
    [tT, tC, tP].forEach(b=>b.setAttribute('aria-selected', b.dataset.ov === OV ? 'true' : 'false'));
  };
  SHELL.setOV = k => {
    OV = k;
    if ((k === 'paper') !== !!PAPER) $('#paperBtn').click();
    if (k === 'chk'){ chk.open = true; renderCheck(); }
    sync();
  };
  const rc = renderCheck; renderCheck = function(){
    const n = rc.apply(this, arguments);
    cc.textContent = n ? String(n) : '✓'; tC.classList.toggle('warn', !!n); tC.classList.toggle('done', !n);
    return n;
  };
  const rpp = renderPaper; renderPaper = function(){ const r = rpp.apply(this, arguments); sync(); return r; };
  sync();
}
{ const ap0 = applyProfile; applyProfile = function(){ const r = ap0.apply(this, arguments); try{ SHELL.placeDocs(); }catch(e){} return r; }; }
