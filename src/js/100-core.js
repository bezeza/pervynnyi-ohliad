/* ================= ЛОГІКА ================= */
const $ = s => document.querySelector(s);
const O = o => Array.isArray(o) ? {l:o[0], t:o[1]} : {l:o, t:o};
/* власні зміни формулювань (вкладка «Мої шаблони»): заготовки шукають варіант за початковим текстом, а в документ іде змінений */
const OT = (f, o) => { const t = O(o).t; return (f.ovr && f.ovr[t]) || t; };
const OTM = (f, i) => { const b = O(f.opts[i]).t, t = f.detBox ? detText(f, i, b) : b; return t === b && f.ovr && f.ovr[b] ? f.ovr[b] : t; };
const itext = el => {
  if (!el) return '';
  const text = el.innerText;
  if (text !== undefined && (text.trim() || el.id !== 'out' || !el.textContent.trim())) return text;
  if (el.id !== 'out' || !document.body) return text !== undefined ? text : el.textContent;
  const clone = el.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:visible!important;display:block!important';
  document.body.append(clone);
  const rendered = clone.innerText;
  clone.remove();
  return rendered !== undefined ? rendered : el.textContent;
};
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let dirty = false, active = 0, ORD = 0, rawTokens = false, sex = '';
let DOC = 'ohl';
let CACHE = {};   // ручні правки тексту окремо для кожного документа
let MODE = 'hosp'; try{ const m = localStorage.getItem('po.mode'); if (m === 'amb' || (!m && localStorage.getItem('po.spec') === 'fam')) MODE = 'amb'; }catch(e){}

function h(tag, a = {}, ...kids){
  const e = document.createElement(tag);
  for (const k in a){ if (a[k] == null) continue; if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); }
  for (const c of kids) if (c != null) e.append(c);
  return e;
}

function makeChip(f, i){
  const o = f.opts[i];
  const c = h('button', {type:'button', class:'chip', 'aria-pressed':'false', id:`${f.cid}_${i}`,
    onclick:()=>{ const on = c.getAttribute('aria-pressed') !== 'true';
      c.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) c.dataset.ord = ++ORD; else delete c.dataset.ord;
      if (c.dataset.auto){ delete c.dataset.auto; if (!on) c.dataset.off = '1'; }
      if (on) delete c.dataset.off;
      update(); }}, g(O(o).l));
  f.cbox.append(c); if (f.gEls) f.gEls[f.gEls.length - 1].idx.push(i); return c;
}
function makeQuick(f, q){
  const t = f.el;
  const c = h('button', {type:'button', class:'chip q', onclick:()=>{
    const ins = g(q), old = t.value.trim();
    const start = old ? old.length + 1 : 0;
    t.value = old ? old + (f.sep || '\n') + ins : ins;
    update(); t.focus();
    const k = ins.indexOf('…');
    if (k >= 0) t.setSelectionRange(start + k, start + k + 1); else t.setSelectionRange(t.value.length, t.value.length);
  }});
  c.dataset.raw = '+ ' + q.replace(/\.$/, ''); c.textContent = g(c.dataset.raw);
  f.qbox.append(c); return c;
}
function buildField(s, f){
  const id = `${s.id}_${f.id}`;
  if (f.type === 'hdr') return h('h3', {class:'sub f wide'}, f.label);
  const wrap = h('div', {class:'f' + (f.wide || f.type==='multi' || f.type==='text' ? ' wide' : '')});
  if (f.only) wrap.dataset.only = f.only;
  if (f.docs) wrap.dataset.docs = f.docs.join(' ');
  wrap.hidden = (f.only && f.only !== MODE) || (f.docs && !f.docs.includes(DOC));
  f.wrapEl = wrap; if (f.loc) wrap.hidden = true;
  if (f.type === 'sel'){
    wrap.append(h('label', {for:id}, f.label));
    const sel = h('select', {id, onchange:()=>{ f.autoSet = false; mark(sel,f); update(); }});
    if (!f.headOnly) sel.append(h('option', {value:''}, '— не вказано —'));
    f.opts.forEach((o,i)=>sel.append(h('option', {value:i}, O(o).l)));
    if (f.def !== undefined) sel.value = f.def;
    f.el = sel; wrap.append(sel);
  } else if (f.type === 'multi'){
    wrap.append(h('div', {class:'lbl'}, f.label));
    if (f.search){
      const q = h('input', {type:'search', id:`${id}_q`, placeholder:'Пошук…', 'aria-label':'Пошук у списку', style:'max-width:320px'});
      q.addEventListener('input', ()=>refreshChips(f));
      f.q = q; wrap.append(q);
    }
    if (f.krit) f.keys = f.opts.map(o=>Object.keys(KRIT).filter(k=>KRIT[k].includes(O(o).t)));
    const box = h('div', {class:'chips'});
    f.cid = id; f.cbox = box;
    f.chips = f.opts.map((o,i)=>makeChip(f, i));
    if (f.groups) groupChips(f, box);
    wrap.append(box);
    if (f.krit){
      f.hintP = h('p', {class:'chips-hint'});
      f.moreB = h('button', {type:'button', class:'more', onclick:()=>{ f.exp = !f.exp; refreshChips(f); }});
      f.urgB = h('button', {type:'button', class:'more', onclick:()=>{ f.urg = !f.urg; f.urgUser = true; refreshChips(f); }});
      wrap.append(f.hintP, h('div', {class:'acts2'}, f.urgB, f.moreB));
    } else if (f.top){
      f.moreB = h('button', {type:'button', class:'more', onclick:()=>{ f.exp = !f.exp; refreshChips(f); }});
      wrap.append(f.moreB);
    }
    if (f.det) buildDet(f, wrap);
    refreshChips(f);
  } else if (f.type === 'period'){
    wrap.append(h('div', {class:'lbl'}, f.label));
    f.d1 = h('input', {type:'date', id:`${id}_1`, 'aria-label':'Дата надходження', oninput:update, style:'width:auto'});
    f.d2 = h('input', {type:'date', id:`${id}_2`, 'aria-label':'Дата виписки', oninput:update, style:'width:auto'});
    f.hintEl = h('span', {class:'hint'});
    wrap.append(h('div', {class:'nums'}, h('span', {class:'u'}, 'з'), f.d1, h('span', {class:'u'}, 'по'), f.d2, f.hintEl));
  } else if (f.type === 'auto'){
    wrap.append(h('div', {class:'lbl'}, f.label));
    f.abox = h('div', {class:'autobox', id, 'aria-live':'polite'}); wrap.append(f.abox);
  } else if (f.type === 'numsel'){
    wrap.append(h('div', {class:'lbl'}, f.label));
    const row = h('div', {class:'nums'});
    f.inp = h('input', {id:`${id}_n`, inputmode:'numeric', placeholder:'5', 'aria-label':f.label, oninput:update});
    f.unit = h('select', {id:`${id}_u`, 'aria-label':'Одиниці', onchange:update, style:'width:auto'});
    f.ulabels.forEach((u,i)=>f.unit.append(h('option', {value:i}, u)));
    row.append(f.inp, f.unit); wrap.append(row);
  } else if (f.type === 'num'){
    wrap.append(h('div', {class:'lbl'}, f.label));
    const row = h('div', {class:'nums'});
    f.inputs = f.parts.map((p,i)=>{
      const inp = h('input', {id:`${id}_${i}`, inputmode:'decimal', placeholder:p.ph, 'aria-label':`${f.label} ${p.u}`, oninput:update});
      row.append(inp, h('span', {class:'u'}, p.u)); return inp;
    });
    if (f.hint){ f.hintEl = h('span', {class:'hint'}); row.append(f.hintEl); }
    wrap.append(row);
  } else {
    wrap.append(h('label', {for:id}, f.label));
    const t = f.type === 'line' ? h('input', {id, type:f.itype || 'text', oninput:update, placeholder:f.placeholder || '', list:f.list ? id + '_dl' : null}) : h('textarea', {id, rows:f.rows||2, oninput:update});
    if (f.list) wrap.append(h('datalist', {id:id + '_dl'}, ...f.list.map(o=>h('option', {value:o}))));
    f.el = t;
    const mb = f.type === 'text' ? micBtn(t) : null;
    if (mb) wrap.append(h('div', {class:'micwrap'}, t, mb)); else wrap.append(t);
    const box = h('div', {class:'chips'});
    if (f.objFrom){
      box.append(h('button', {type:'button', class:'chip q', onclick:()=>{
        const txt = objFromExam();
        if (!txt){ toast('У первинному огляді ще не заповнено об’єктивний статус'); return; }
        t.value = g(txt); update();
      }}, '+ з первинного огляду'));
    }
    if (f.diaryFrom){
      box.append(h('button', {type:'button', class:'chip q', onclick:()=>{
        const keep = DOC; DOC = 'shch'; const p = sectionText(SECTIONS.find(x=>x.id==='d_obj')); DOC = keep;
        let txt = p ? p.body : '';
        if (!txt && DIARIES.length){ const tmp = document.createElement('div'); tmp.innerHTML = DIARIES[DIARIES.length-1].html; const l = [...tmp.children].map(x=>itext(x)).find(x=>/^Об’єктивно:/.test(x)); if (l) txt = l.replace(/^Об’єктивно:\s*/, ''); }
        if (!txt){ toast('Щоденник ще не заповнено'); return; }
        t.value = g(txt); update();
      }}, '+ з останнього щоденника'));
    }
    if (f.testChips){
      const ins = x => { const line = TESTS[x] || cap(x) + ' (…): ….'; const old = t.value.trim(); const start = old ? old.length + 1 : 0;
        t.value = old ? old + '\n' + line : line; update(); t.focus(); const k = line.indexOf('…'); if (k >= 0) t.setSelectionRange(start + k, start + k + 1); };
      f.planHint = h('p', {class:'chips-hint'});
      const goPlan = h('button', {type:'button', class:'more', onclick:()=>{
        switchDoc('ohl'); show(TABS.indexOf(SECTIONS.find(x=>x.id==='dx')));
        setTimeout(()=>{ const q = document.getElementById('dx_plan_q'); if (q){ q.scrollIntoView({block:'center'}); q.focus(); } }, 50);
        toast('Відмітьте обстеження в плані, потім поверніться у «Виписний епікриз»', 4000);
      }}, 'Перейти до плану обстеження в первинному огляді');
      const own = h('div', {class:'chips'});
      const all = [...new Set([...Object.keys(TESTS), ...F('dx.plan').opts.map(o=>O(o).t)])].filter(x=>!/^консультація/.test(x));
      f.ownChips = all.map((x,k)=>{ const c = h('button', {type:'button', class:'chip q', onclick:()=>ins(x)}, '+ ' + x); if (k >= 12) c.hidden = true; own.append(c); return c; });
      const more = h('button', {type:'button', class:'more', onclick:()=>{ const open = f.ownChips[12].hidden; f.ownChips.forEach((c,k)=>{ if (k >= 12) c.hidden = !open; }); more.textContent = open ? 'Згорнути' : 'Показати всі (' + all.length + ')'; }}, 'Показати всі (' + all.length + ')');
      wrap.append(f.planHint, h('div', {class:'lbl', style:'margin-top:6px'}, 'Додати шаблон окремого обстеження:'), own, h('div', {class:'acts2'}, more, goPlan));
    }
    if (f.planTpl){
      box.append(h('button', {type:'button', class:'chip q', onclick:()=>{
        const pf = F('dx.plan'); let items = pf.chips.map((c,i)=>c.getAttribute('aria-pressed')==='true' ? {t:O(pf.opts[i]).t, o:+(c.dataset.ord||0)} : null).filter(Boolean).sort((a,b)=>a.o-b.o).map(x=>x.t);
        if (!items.length){ toast('План обстеження не заповнено — вставлено базовий набір (ЗАК, ЗАС, біохімія, ЕКГ)', 3500); items = ['ЗАК','ЗАС','біохімічний аналіз крові','ЕКГ']; }
        const ins = items.map(x=>TESTS[x] || cap(x) + ' (…): ….').join('\n');
        t.value = t.value.trim() ? t.value.trim() + '\n' + ins : ins; update(); t.focus();
        const k = t.value.indexOf('…'); if (k >= 0) t.setSelectionRange(k, k + 1);
      }}, '+ шаблони за планом обстеження'));
    }
    if (f.fromVitae){
      box.append(h('button', {type:'button', class:'chip q', onclick:()=>{
        const v = val(F('vitae.sup'), true); if (!v){ toast('В анамнезі життя не відмічено супутніх захворювань'); return; }
        t.value = cap(v); update();
      }}, '+ з анамнезу життя'));
    }
    if (f.quick){ f.qbox = box; f.qchips = f.quick.map(q=>makeQuick(f, q)); f.quickOrig = f.quick.slice(); }
    if (f.remainFrom){ f.rbox = h('div', {class:'chips rem'}); wrap.append(f.rbox); }
    if (box.childNodes.length || f.quick) wrap.append(box);
  }
  return wrap;
}

/* --- уточнення скарг --- */
function buildDet(f, wrap){
  f.detBox = h('div', {class:'det', hidden:''}, h('div', {class:'lbl'}, 'Уточнення відмічених скарг — за бажанням'));
  f.detRows = {}; f.detMap = {}; f.detChips = [];
  f.opts.forEach((o,i)=>{
    const d = DET[O(o).t]; if (!d) return;
    const row = h('div', {class:'drow', hidden:''}, h('div', {class:'dn'}, g(O(o).l)));
    d.g.forEach((gr, gi)=>{
      const line = h('div', {class:'dg'}, h('span', {class:'dgl'}, gr.n));
      gr.o.forEach((op, k)=>{
        const c = h('button', {type:'button', class:'chip s', 'aria-pressed':'false', id:`${f.cid}_d${i}_${gi}_${k}`}, op[0]);
        c.addEventListener('click', ()=>{
          const on = c.getAttribute('aria-pressed') !== 'true';
          if (on && !gr.m) line.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed','false'));
          c.setAttribute('aria-pressed', on ? 'true' : 'false'); update();
        });
        f.detMap[`${i}_${gi}_${k}`] = c; f.detChips.push(c); line.append(c);
      });
      row.append(line);
    });
    f.detRows[i] = row; f.detBox.append(row);
  });
  wrap.append(f.detBox);
}
function objFromExam(){
  const keep = DOC; DOC = 'ohl';
  const txt = ['zah','shk','dyh','ssc','trav','sech','nevr'].map(id=>{ const p = sectionText(SECTIONS.find(x=>x.id===id)); return p ? (p.head && id !== 'zah' ? p.head + ' ' : '') + p.body : ''; }).filter(Boolean).join(' ');
  DOC = keep; return txt;
}
function groupChips(f, box){
  box.classList.add('grouped');
  const used = new Set(); f.gEls = [];
  const mk = (title, idx) => {
    const cb = h('div', {class:'chips'}); idx.forEach(i=>{ cb.append(f.chips[i]); used.add(i); });
    const el = h('div', {class:'cg'}, h('div', {class:'cgl'}, title), cb); box.append(el); f.gEls.push({el, idx, cb});
  };
  f.groups.forEach(([title, texts])=>mk(title, texts.map(t=>f.opts.findIndex(o=>O(o).t === t)).filter(i=>i >= 0 && !used.has(i))));
  mk('Інші та мої', f.chips.map((c,i)=>i).filter(i=>!used.has(i)));
  f.cbox = f.gEls[f.gEls.length - 1].cb;   // нові власні варіанти — у «Інші та мої»
}
function refreshDet(f){
  // уточнення показуються одразу під групою, де відмічено скаргу (не внизу сторінки)
  if (!f.detBox) return; let any = false;
  for (const i in f.detRows){
    const row = f.detRows[i], c = f.chips[i], on = c.getAttribute('aria-pressed') === 'true';
    const host = on ? (c.closest('.cg') || (c.parentElement && c.parentElement.parentElement)) : null;
    if (on && host && host !== f.detBox && !host.contains(f.detBox)){ if (row.parentElement !== host) host.append(row); row.classList.add('inl'); }
    else { if (row.parentElement !== f.detBox) f.detBox.append(row); row.classList.remove('inl'); if (on) any = true; }
    row.hidden = !on;
  }
  f.detBox.hidden = !any;
}
function detText(f, i, t){
  const d = DET[t]; if (!d || !f.detRows || !f.detRows[i]) return t;
  let ins = '', tail = '';
  d.g.forEach((gr, gi)=>{
    const v = gr.o.filter((op,k)=>f.detMap[`${i}_${gi}_${k}`].getAttribute('aria-pressed') === 'true').map(op=>op[1]).join(', ');
    if (!v) return;
    if (gr.s === 'in') ins += v + ' '; else tail += gr.s + v;
  });
  return (d.t ? d.t.replace('{}', ins) : t) + tail;
}
function detReset(f){ if (f.detChips) f.detChips.forEach(c=>c.setAttribute('aria-pressed','false')); }
function detPick(f, det){
  for (const t in det || {}){
    const i = f.opts.findIndex(o=>O(o).t === t), d = DET[t];
    if (i < 0 || !d){ console.warn('Немає уточнення', t); continue; }
    let n = 0;
    d.g.forEach((gr,gi)=>gr.o.forEach((op,k)=>{ if (det[t].includes(op[1])){ f.detMap[`${i}_${gi}_${k}`].setAttribute('aria-pressed','true'); n++; } }));
    if (n !== det[t].length) console.warn('Немає варіанту уточнення', t, det[t]);
  }
}
function detCollect(f){
  const r = {};
  for (const i in f.detRows){
    if (f.chips[i].getAttribute('aria-pressed') !== 'true') continue;
    const t = O(f.opts[i]).t, v = [];
    DET[t].g.forEach((gr,gi)=>gr.o.forEach((op,k)=>{ if (f.detMap[`${i}_${gi}_${k}`].getAttribute('aria-pressed') === 'true') v.push(op[1]); }));
    if (v.length) r[t] = v;
  }
  return r;
}

let curKey = null;
function refreshChips(f){
  const t = f.q ? f.q.value.trim().toLowerCase() : '';
  let shown = 0;
  f.chips.forEach((c,i)=>{
    const on = c.getAttribute('aria-pressed') === 'true';
    let vis;
    if (on) vis = true;
    else if (f.hidT && f.hidT.has(O(f.opts[i]).t)) vis = false;
    else if (t) vis = O(f.opts[i]).l.toLowerCase().includes(t);
    else if (f.krit) vis = f.exp || (!!curKey && f.keys[i].includes(curKey)) || (!!f.urg && URGK.has(O(f.opts[i]).t));
    else if (f.gEls) vis = f.exp || f.gEls.some(gr=>gr.idx.indexOf(i) >= 0 && gr.idx.indexOf(i) < f.gtop);
    else if (f.top) vis = f.exp || i < f.top;
    else vis = true;
    c.hidden = !vis; if (vis) shown++;
  });
  if (f.krit){
    f.hintP.textContent = curKey || f.exp || f.urg ? '' : 'Оберіть хворобу на вкладці «За хворобою», і тут з’являться її критерії.';
    f.urgB.textContent = f.urg ? 'Сховати ургентні (розд. III)' : 'Ургентні критерії (розд. III)';
    f.hintP.hidden = !f.hintP.textContent;
    f.moreB.textContent = f.exp ? 'Лише для обраної хвороби' : 'Показати всі критерії (' + f.opts.length + ')';
  }
  if (f.gEls) f.gEls.forEach(gr=>{ gr.el.hidden = !gr.cb.querySelector('.chip:not([hidden])'); });
  if (f.krit){} else if (f.top){
    f.moreB.textContent = f.exp ? 'Згорнути' : 'Показати всі (' + f.opts.length + ')';
    f.moreB.hidden = !!t;
  }
}

function autoKrit(){
  const v = id => { const e = document.getElementById(id); return e && e.value.trim() ? num(e.value) : NaN; };
  const r = [];
  const spo = v('dyh_chd_1'), rr = v('dyh_chd_0'), sb = v('ssc_ad_0'), hr = has(v('ssc_chss_0')) ? v('ssc_chss_0') : v('ssc_ps_0');
  if (spo <= 92) r.push(`SpO2 ${dec(spo)}% (≤ 92%)`);
  if (rr >= 30) r.push(`ЧД ${dec(rr)}/хв (≥ 30)`); else if (rr <= 8) r.push(`ЧД ${dec(rr)}/хв (≤ 8)`);
  if (sb < 90) r.push(`САТ ${dec(sb)} мм рт. ст. (< 90)`);
  if (hr >= 130) r.push(`ЧСС ${dec(hr)}/хв (≥ 130)`);
  const cl = id => { const c = CALCS.find(x=>x.id===id); return c && c.last && !c.last.msg ? c.last : null; };
  const gcs = cl('gcs'); if (gcs && parseInt(gcs.score) <= 13) r.push(`шкала коми Глазго ${gcs.score} (≤ 13)`);
  const curb = cl('curb'); if (curb && parseInt(curb.score) >= 3) r.push(`CURB-65 ${curb.score} (≥ 3)`);
  const gbs = cl('gbs'); if (gbs && parseInt(gbs.score) >= 7) r.push(`шкала Глазго–Блетчфорд ${gbs.score} (високий ризик)`);
  return r.join('; ');
}
