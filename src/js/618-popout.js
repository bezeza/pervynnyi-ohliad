/* ===== Документ в окремому вікні — для другого монітора (0.9.3.32) =====
   Кнопка «⧉» у панелі тексту відкриває вікно, яке оновлюється наживо: «Текст» або «Аркуш» (як перед друком).
   Якщо браузер уміє (Chrome/Edge: керування вікнами на кількох екранах) — вікно саме стає на інший монітор;
   інакше відкривається там, де стояло минулого разу. */
const POP = { w:null, mode:'text', fs:16, t:0, z:1 };
try{ POP.mode = localStorage.getItem('po.popmode') || 'text'; POP.fs = +(localStorage.getItem('po.popfs') || 16) || 16; POP.z = +(localStorage.getItem('po.popzoom') || 1) || 1; }catch(e){}
/* масштаб вікна — свій, не браузерний (Ctrl+колесо в браузері збільшило б і основне вікно) */
function popZoom(z, fit){
  const w = POP.w; if (!w || w.closed) return; const d = w.document, box = d.getElementById('pwBox'); if (!box) return;
  if (fit){ box.style.zoom = 1; const el = box.querySelector('#paper .sheet, .pw-text'); const cw = el ? el.offsetWidth + 48 : 0; z = cw ? (w.innerWidth - 24) / cw : 1; }
  POP.z = Math.max(0.5, Math.min(3, Math.round(z * 100) / 100)); try{ localStorage.setItem('po.popzoom', POP.z); }catch(e){}
  box.style.zoom = POP.z; const zl = d.getElementById('pwZ'); if (zl) zl.textContent = Math.round(POP.z * 100) + '%';
}

async function popPlace(){
  let g = null; try{ g = JSON.parse(localStorage.getItem('po.popgeo') || 'null'); }catch(e){}
  try{
    if ('getScreenDetails' in window){
      const sd = await window.getScreenDetails();
      const other = sd.screens.find(s=>s !== sd.currentScreen);
      if (other) return {left:other.availLeft, top:other.availTop, width:other.availWidth, height:other.availHeight};
    }
  }catch(e){}
  return g || {left:(screen.availLeft || 0) + Math.max(0, screen.availWidth - 900), top:screen.availTop || 0, width:900, height:screen.availHeight || 900};
}
async function popOpen(){
  if (POP.w && !POP.w.closed){ POP.w.focus(); return; }
  const p = await popPlace();
  const w = window.open('', 'po_popout', `popup=yes,left=${Math.round(p.left)},top=${Math.round(p.top)},width=${Math.round(p.width)},height=${Math.round(p.height)}`);
  if (!w){ toast('Браузер заблокував нове вікно — дозвольте спливні вікна для цієї сторінки', 4500); return; }
  POP.w = w; popInit(w); popRender();
  try{ w.moveTo(p.left, p.top); w.resizeTo(p.width, p.height); }catch(e){}
  popBtnSync();
}
function popInit(w){
  const d = w.document;
  d.open(); d.write('<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Документ — Первинний огляд</title></head><body class="popwin"></body></html>'); d.close();
  document.querySelectorAll('style').forEach(s=>d.head.append(d.importNode(s, true)));
  const th = document.documentElement.getAttribute('data-theme'); if (th) d.documentElement.setAttribute('data-theme', th);
  const st = d.createElement('style');
  st.textContent = `body.popwin{margin:0;background:var(--bg,#f3f4f7);color:var(--ink,#1a1f2b);font-family:var(--f-sans,system-ui,sans-serif)}
.pw-bar{position:sticky;top:0;z-index:5;display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 14px;background:var(--surface,#fff);border-bottom:1px solid var(--line,#dde1e8)}
.pw-bar .t{font-weight:600;margin-right:auto}.pw-bar .s{font-size:12px;color:var(--muted,#667)}
.pw-seg{display:inline-flex;border:1px solid var(--line,#dde1e8);border-radius:8px;overflow:hidden}
.pw-seg button,.pw-bar>button{border:0;background:var(--surface,#fff);padding:5px 12px;font:inherit;cursor:pointer;color:inherit}
.pw-bar>button{border:1px solid var(--line,#dde1e8);border-radius:8px}
.pw-seg button[aria-pressed=true]{background:var(--accent-soft,#e3edf8);color:var(--accent,#1f5a8a);font-weight:600}
.pw-text{max-width:900px;margin:18px auto;padding:28px 36px;background:var(--surface,#fff);border:1px solid var(--line,#dde1e8);border-radius:10px;white-space:pre-wrap;line-height:1.5}
.pw-empty{color:var(--muted,#667);text-align:center;margin-top:60px}
#paper.pw-paper .sheet *{cursor:pointer}.pw-text:focus{outline:2px solid var(--accent,#1f5a8a);outline-offset:2px}
#paper.pw-paper{display:block;max-width:none;padding:18px;overflow:visible}#paper.pw-paper .sheet{margin:0 auto}`;
  d.head.append(st);
  const bar = d.createElement('div'); bar.className = 'pw-bar';
  bar.innerHTML = '<span class="t">Документ</span><span class="s" id="pwS"></span><span class="s" id="pwH"></span><span class="pw-seg"><button type="button" data-m="text">Текст</button><button type="button" data-m="paper">Аркуш</button></span><span class="pw-seg"><button type="button" data-z="-1" title="Зменшити (Ctrl + колесо миші вниз)">−</button><button type="button" data-z="0" id="pwZ" title="Повернути 100%">100%</button><button type="button" data-z="1" title="Збільшити (Ctrl + колесо миші вгору)">+</button></span><button type="button" data-z="fit" title="Вмістити по ширині вікна">⇔ По ширині</button>';
  bar.addEventListener('click', e=>{
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.m){ POP.mode = b.dataset.m; try{ localStorage.setItem('po.popmode', POP.mode); }catch(x){} popRender(); }
    if (b.dataset.z){ const z = b.dataset.z; if (z === 'fit') popZoom(1, true); else popZoom(z === '0' ? 1 : POP.z * (z === '1' ? 1.1 : 1 / 1.1)); }
  });
  const box = d.createElement('div'); box.id = 'pwBox'; box.addEventListener('click', popClick);
  w.addEventListener('wheel', e=>{ if (!e.ctrlKey) return; e.preventDefault(); popZoom(POP.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, {passive:false});
  w.addEventListener('keydown', e=>{ if (!(e.ctrlKey || e.metaKey)) return; const k = e.key;
    if (k === '+' || k === '=' ){ e.preventDefault(); popZoom(POP.z * 1.1); } else if (k === '-'){ e.preventDefault(); popZoom(POP.z / 1.1); } else if (k === '0'){ e.preventDefault(); popZoom(1); } });
  d.body.append(bar, box);
  const save = () => { try{ localStorage.setItem('po.popgeo', JSON.stringify({left:w.screenX, top:w.screenY, width:w.outerWidth, height:w.outerHeight})); }catch(x){} };
  w.addEventListener('beforeunload', ()=>{ save(); setTimeout(popBtnSync, 50); });
  w.addEventListener('resize', ()=>{ clearTimeout(POP.rz); POP.rz = setTimeout(()=>{ save(); if (POP.mode === 'paper') popRender(); }, 300); });
}
function popRender(){
  const w = POP.w; if (!w || w.closed) return;
  const d = w.document, box = d.getElementById('pwBox'); if (!box) return;
  d.querySelectorAll('.pw-seg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m === POP.mode ? 'true' : 'false'));
  const sEl = d.getElementById('pwS'); if (sEl){ const pib = (($('#meta_pib') || {}).value || '').trim(); sEl.textContent = (DOCTITLES && DOCTITLES[DOC] ? (typeof DOCTITLES[DOC] === 'string' ? DOCTITLES[DOC] : '') : '') + (pib ? ' · ' + pib : ''); }
  const hh = d.getElementById('pwH'); if (hh) hh.textContent = POP.mode === 'paper' ? 'клік по рядку — перехід до поля у формі' : 'текст можна правити прямо тут';
  const y = w.scrollY;
  box.innerHTML = '';
  if (POP.mode === 'paper'){
    const tmp = document.createElement('div'); tmp.className = 'sheet';
    try{ fillSheet(tmp, false); }catch(e){ tmp.textContent = 'Не вдалося побудувати аркуш: ' + e.message; }
    const bl = typeof blankOn === 'function' && blankOn(); if (bl) tmp.classList.add('blankmode');
    const pp = d.createElement('div'); pp.id = 'paper'; pp.className = 'paper pw-paper';
    const sh = d.importNode(tmp, true); pp.append(sh); box.append(pp); POP.src = tmp; POP.dst = sh;
    sh.style.fontSize = '';
    if (bl) sh.style.setProperty('--bz', '1');
  } else {
    const src = $('#out'); const t = src ? src.innerHTML.trim() : '';
    if (!t){ const e = d.createElement('p'); e.className = 'pw-empty'; e.textContent = 'Тут з’явиться текст документа.'; box.append(e); }
    else { const tx = d.createElement('div'); tx.className = 'pw-text'; tx.innerHTML = src.innerHTML; tx.style.fontSize = '16px';
      tx.contentEditable = 'true'; tx.spellcheck = false; tx.setAttribute('role', 'textbox'); tx.setAttribute('aria-multiline', 'true');
      tx.addEventListener('input', ()=>{ POP.edit = Date.now(); const o = $('#out'); if (!o) return; o.innerHTML = tx.innerHTML; o.dispatchEvent(new Event('input', {bubbles:true})); });
      tx.addEventListener('paste', e=>{ e.preventDefault(); const t = (e.clipboardData || w.clipboardData).getData('text/plain'); d.execCommand('insertText', false, t); });
      box.append(tx); }
  }
  box.style.zoom = POP.z; { const zl = d.getElementById('pwZ'); if (zl) zl.textContent = Math.round(POP.z * 100) + '%'; }
  const m = box.querySelector('mark.chg, .flash');
  if (m){ const r = m.getBoundingClientRect(); if (r.top < 60 || r.bottom > w.innerHeight) w.scrollTo(0, Math.max(0, y + r.top - w.innerHeight / 3)); else w.scrollTo(0, y); }
  else w.scrollTo(0, y);
}
/* клік в «Аркуші» — як в основному вікні: перехід до поля форми (основне вікно виходить наперед) */
function popClick(e){
  if (POP.mode !== 'paper' || !POP.src || !POP.dst) return;
  const path = []; for (let n = e.target; n && n !== POP.dst; n = n.parentNode){ if (!n.parentNode) return; path.unshift([...n.parentNode.childNodes].indexOf(n)); }
  let node = POP.src; for (const i of path){ node = node && node.childNodes[i]; } if (!node || node.nodeType !== 1) node = node && node.parentElement; if (!node) return;
  e.preventDefault();
  const go = () => { try{ window.focus(); }catch(x){} };
  const ff = node.closest('[data-fld]'); if (ff){ bGo(ff.dataset.fld.split(' ')[0]); go(); return; }
  const an = node.closest('[data-an]'); if (an){ const f = an.dataset.an; if (/^an_/.test(f)) goTab(f.split('.')[0], /\./.test(f) ? f : null); else bGo(f); go(); return; }
  const gb = node.closest('button'); if (gb){ gb.click(); go(); return; }
  const pp = $('#paper'); if (!pp) return;
  const holder = document.createElement('div'); holder.hidden = true; holder.append(POP.src); pp.append(holder);
  const before = typeof active !== 'undefined' ? active : null;
  try{ node.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); } finally { holder.remove(); }
  if (typeof active === 'undefined' || active !== before) go();
}
function popSoon(){ if (!POP.w || POP.w.closed) return; if (POP.mode === 'text' && Date.now() - (POP.edit || 0) < 1500) return; clearTimeout(POP.t); POP.t = setTimeout(()=>{ try{ popRender(); }catch(e){} }, 200); }
{ const up = update; update = function(){ const r = up.apply(this, arguments); popSoon(); return r; }; }
document.addEventListener('input', e=>{ if (e.target && e.target.id === 'out') popSoon(); });
window.addEventListener('beforeunload', ()=>{ try{ if (POP.w && !POP.w.closed) POP.w.close(); }catch(e){} });

function popBtnSync(){ const b = $('#popBtn'); if (b) b.setAttribute('aria-pressed', POP.w && !POP.w.closed ? 'true' : 'false'); }
{ const acts = $('#outBox .oh .acts');
  if (acts) acts.prepend(h('button', {type:'button', class:'btn', id:'popBtn', 'aria-pressed':'false',
    title:'Відкрити документ в окремому вікні — наприклад, на другому моніторі. Оновлюється наживо.',
    'aria-label':'Документ в окремому вікні', onclick:()=>popOpen()}, '⧉')); }
