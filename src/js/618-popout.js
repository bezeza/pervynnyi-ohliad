/* ===== Документ в окремому вікні — для другого монітора (0.9.3.32) =====
   Кнопка «⧉» у панелі тексту відкриває вікно, яке оновлюється наживо: «Текст» або «Аркуш» (як перед друком).
   Якщо браузер уміє (Chrome/Edge: керування вікнами на кількох екранах) — вікно саме стає на інший монітор;
   інакше відкривається там, де стояло минулого разу. */
const POP = { w:null, mode:'text', fs:16, t:0 };
try{ POP.mode = localStorage.getItem('po.popmode') || 'text'; POP.fs = +(localStorage.getItem('po.popfs') || 16) || 16; }catch(e){}

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
#paper.pw-paper{display:block;max-width:none;padding:18px;overflow:visible}#paper.pw-paper .sheet{margin:0 auto}`;
  d.head.append(st);
  const bar = d.createElement('div'); bar.className = 'pw-bar';
  bar.innerHTML = '<span class="t">Документ</span><span class="s" id="pwS"></span><span class="pw-seg"><button type="button" data-m="text">Текст</button><button type="button" data-m="paper">Аркуш</button></span><button type="button" data-f="-1" title="Менший шрифт">A−</button><button type="button" data-f="1" title="Більший шрифт">A+</button>';
  bar.addEventListener('click', e=>{
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.m){ POP.mode = b.dataset.m; try{ localStorage.setItem('po.popmode', POP.mode); }catch(x){} popRender(); }
    if (b.dataset.f){ POP.fs = Math.max(11, Math.min(26, POP.fs + +b.dataset.f)); try{ localStorage.setItem('po.popfs', POP.fs); }catch(x){} popRender(); }
  });
  const box = d.createElement('div'); box.id = 'pwBox';
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
  const y = w.scrollY;
  box.innerHTML = '';
  if (POP.mode === 'paper'){
    const tmp = document.createElement('div'); tmp.className = 'sheet';
    try{ fillSheet(tmp, false); }catch(e){ tmp.textContent = 'Не вдалося побудувати аркуш: ' + e.message; }
    const bl = typeof blankOn === 'function' && blankOn(); if (bl) tmp.classList.add('blankmode');
    const pp = d.createElement('div'); pp.id = 'paper'; pp.className = 'paper pw-paper';
    const sh = d.importNode(tmp, true); pp.append(sh); box.append(pp);
    sh.style.fontSize = '';
    const cw = w.innerWidth - 40; if (bl && cw) sh.style.setProperty('--bz', Math.min(1.4, cw / 794).toFixed(3));
  } else {
    const src = $('#out'); const t = src ? src.innerHTML.trim() : '';
    if (!t){ const e = d.createElement('p'); e.className = 'pw-empty'; e.textContent = 'Тут з’явиться текст документа.'; box.append(e); }
    else { const tx = d.createElement('div'); tx.className = 'pw-text'; tx.innerHTML = src.innerHTML; tx.style.fontSize = POP.fs + 'px'; box.append(tx); }
  }
  const m = box.querySelector('mark.chg, .flash');
  if (m){ const r = m.getBoundingClientRect(); if (r.top < 60 || r.bottom > w.innerHeight) w.scrollTo(0, Math.max(0, y + r.top - w.innerHeight / 3)); else w.scrollTo(0, y); }
  else w.scrollTo(0, y);
}
function popSoon(){ if (!POP.w || POP.w.closed) return; clearTimeout(POP.t); POP.t = setTimeout(()=>{ try{ popRender(); }catch(e){} }, 200); }
{ const up = update; update = function(){ const r = up.apply(this, arguments); popSoon(); return r; }; }
document.addEventListener('input', e=>{ if (e.target && e.target.id === 'out') popSoon(); });
window.addEventListener('beforeunload', ()=>{ try{ if (POP.w && !POP.w.closed) POP.w.close(); }catch(e){} });

function popBtnSync(){ const b = $('#popBtn'); if (b) b.setAttribute('aria-pressed', POP.w && !POP.w.closed ? 'true' : 'false'); }
{ const acts = $('#outBox .oh .acts');
  if (acts) acts.prepend(h('button', {type:'button', class:'btn', id:'popBtn', 'aria-pressed':'false',
    title:'Відкрити документ в окремому вікні — наприклад, на другому моніторі. Оновлюється наживо.',
    'aria-label':'Документ в окремому вікні', onclick:()=>popOpen()}, '⧉')); }
