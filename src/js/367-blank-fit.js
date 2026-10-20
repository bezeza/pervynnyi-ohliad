/* ===== Бланк 003/о на весь аркуш А4 (0.9.3.9): сторінка = А4, вільні поля розтягуються до низу аркуша;
   масштаб тексту регулюється, а якщо не вміщається — зменшується сам. Щоденники: 1 / 2 / 3 записи на аркуш або «авто»,
   друк з потрібного місця аркуша (друга половина — коли перша вже заповнена). ===== */
BLP = Object.assign({fill:true, sc:1, dn:2, doff:0, dfree:'diary'}, BLP);
/* вільне місце на аркуші щоденника — бланк для запису від руки */
const BFREE = {diary:'бланк щоденника', zav:'огляд завідувача', kons:'консультація', lines:'лінійки', none:'порожньо'};
function bFreeSlot(kind){
  if (kind === 'none') return h('div', {class:'bslot bempty'});
  const lines = h('div', {class:'blines bfree-l', style:'min-height:6em'});
  if (kind === 'diary') return h('div', {class:'bslot bfree'}, h('div', {class:'bdi'},
    h('div', {class:'bdl'}, h('div', {}, 'Дата'), bFill(''), h('div', {}, 'T – ', bFill(''), ' °C'), h('div', {}, 'Ps – ', bFill(''), ' /хв.'), h('div', {}, 'АТ – ', bFill(''), ' мм рт. ст.'), h('div', {}, 'ЧДР – ', bFill(''), ' /хв.'), h('div', {}, 'SpO2 – ', bFill(''), ' %')),
    h('div', {class:'bdr'}, lines, h('div', {class:'brow'}, h('span', {class:'bl'}, 'Лікар '), bFill('')))));
  const T = {zav:'Огляд завідувача відділення', kons:'Консультація спеціаліста'}[kind];
  return h('div', {class:'bslot bfree bfree2'}, T ? h('div', {class:'bt2'}, T, '   Дата ', bFill('')) : '', lines, T ? h('div', {class:'brow'}, h('span', {class:'bl'}, 'Підпис '), bFill('')) : '');
}
const B_SC = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2];
let BMEAS = null;
function bMeasureBox(){
  if (!BMEAS || !BMEAS.isConnected){ BMEAS = h('div', {class:'bmeasbox', 'aria-hidden':'true'}); document.body.append(BMEAS); }
  return BMEAS;
}
const bPx = el => parseFloat(getComputedStyle(el).height) || 0;
/* сторінка вміщується? (у вимірювальному режимі поля не розтягуються, записи — за вмістом) */
function bFits(pg){
  const fr = pg.querySelector('.bframe'); if (!fr) return true;
  const cs = getComputedStyle(pg), inner = pg.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (!inner) return true;   // без розмітки (тести) — вважаємо, що вміщається
  const slots = [...fr.querySelectorAll(':scope > .bslot')];
  if (slots.length){
    const n = +pg.dataset.slots || slots.length, other = fr.offsetHeight - slots.reduce((a, s)=>a + s.offsetHeight, 0);
    return other + Math.max(...slots.map(s=>s.offsetHeight)) * n <= inner + 1;
  }
  return fr.offsetHeight <= inner + 1;
}
/* «На весь аркуш»: найбільший масштаб тексту, з яким сторінка вміщується (70–140 %), решту місця займають поля для запису.
   Вимкнено — масштаб задає користувач (A− / A+), сторінка за вмістом. */
function bFit(pg){
  let sc = BLP.sc || 1;
  pg.style.setProperty('--bsc', sc);
  if (!BLP.fill) return pg;
  const box = bMeasureBox(); box.append(pg); pg.classList.add('bmeasure');
  try{
    const ok = v => { pg.style.setProperty('--bsc', v); return bFits(pg); };
    if (!pg.clientHeight){ sc = 1; }
    else { let lo = 0.6, hi = 1.4; if (ok(hi)) lo = hi; else { for (let i = 0; i < 8; i++){ const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } } sc = Math.floor(lo * 100) / 100; }
    pg.style.setProperty('--bsc', sc);
  } finally { pg.classList.remove('bmeasure'); pg.remove(); }
  pg.dataset.sc = Math.round(sc * 100);
  return pg;
}
/* щоденник: записи по місцях аркуша */
function bDiaryPages(){
  const old = bDiary();   // готові сторінки (по 2 записи) — беремо з них записи
  const entries = old.flatMap(p=>[...p.querySelectorAll('.bdi')]);
  const mk = (n, list, off) => {
    const pg = bPage('bdiary bslots', h('div', {class:'bt'}, '43. ЩОДЕННИК'));
    const fr = pg.querySelector('.bframe'); pg.dataset.slots = n;
    for (let i = 0; i < n; i++){
      const e = i < off ? null : list.shift();
      fr.append(e ? h('div', {class:'bslot'}, e) : i < off ? h('div', {class:'bslot bskip'}) : bFreeSlot(BLP.dfree || 'diary'));
    }
    if (off) pg.classList.add('bcont');
    return pg;
  };
  const pages = [];
  if (BLP.dn === 'auto'){
    /* скільки вміститься: міряємо кожен запис */
    const box = bMeasureBox(), probe = bPage('bdiary bslots bmeasure bA4', h('div', {class:'bt'}, '43. ЩОДЕННИК')); probe.style.setProperty('--bsc', BLP.fill ? 0.9 : (BLP.sc || 1)); box.append(probe);   // «авто»: пакуємо щільно (90 %), потім сторінка розтягується
    const fr = probe.querySelector('.bframe'), cs = getComputedStyle(probe), inner = probe.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const head = fr.offsetHeight, hs = entries.map(e=>{ const s = h('div', {class:'bslot'}, e); fr.append(s); const v = s.offsetHeight; s.remove(); return v; });
    probe.remove();
    let cur = [], used = head;
    entries.forEach((e, i)=>{ if (cur.length && inner && used + hs[i] > inner){ pages.push(cur); cur = []; used = head; } cur.push(e); used += hs[i]; });
    if (cur.length) pages.push(cur);
    return pages.map(list=>{ const pg = mk(list.length, list.slice(), 0); pg.classList.add('bauto'); return pg; });
  }
  const n = Math.max(1, Math.min(3, +BLP.dn || 2)), off = Math.min(+BLP.doff || 0, n - 1), list = entries.slice();
  pages.push(mk(n, list, off));
  while (list.length) pages.push(mk(n, list, 0));
  return pages;
}
{ const bp0 = blankPages;
  blankPages = function(){
    const pages = DOC === 'shch' ? bDiaryPages() : bp0.apply(this, arguments);
    pages.forEach(p=>{ p.classList.add('bA4'); if (BLP.fill) p.classList.add('bfill'); bFit(p); });
    return pages;
  };
  const bb0 = blankBar;
  blankBar = function(){
    const bar = bb0.apply(this, arguments); if (!BLANK || !blankOK()) return bar;
    const setP = (k, v) => { BLP[k] = v; try{ localStorage.setItem('po.blankp', JSON.stringify(BLP)); }catch(e){} renderPaper(); };
    const sb = (t, on, fn, title) => h('button', {type:'button', 'aria-pressed':on ? 'true' : 'false', title:title || '', onclick:fn}, t);
    const k = B_SC.indexOf(BLP.sc) < 0 ? 4 : B_SC.indexOf(BLP.sc);
    const row = h('div', {class:'bctl'});
    row.append(h('span', {class:'bcl'}, 'Аркуш А4:'),
      h('label', {class:'blk', title:'Вільні поля для запису розтягуються до низу аркуша; якщо текст не вміщається — зменшується сам'}, (()=>{ const c = h('input', {type:'checkbox'}); c.checked = !!BLP.fill; c.addEventListener('change', ()=>setP('fill', c.checked)); return c; })(), ' на весь аркуш'),
      BLP.fill ? h('span', {class:'bzv bauto', title:'Розмір тексту підбирається сам, щоб сторінка займала весь аркуш'}, 'текст: авто') :
      h('span', {class:'seg bzoom', role:'group', 'aria-label':'Розмір тексту'},
        sb('A−', false, ()=>setP('sc', B_SC[Math.max(0, k - 1)]), 'Менший текст'),
        h('span', {class:'bzv'}, Math.round((BLP.sc || 1) * 100) + ' %'),
        sb('A+', false, ()=>setP('sc', B_SC[Math.min(B_SC.length - 1, k + 1)]), 'Більший текст')));
    if (DOC === 'shch'){
      const n = BLP.dn;
      row.append(h('span', {class:'bcl'}, 'Записів на аркуш:'),
        h('span', {class:'seg'}, ...[[1,'1'],[2,'2'],[3,'3'],['auto','авто']].map(([v,t])=>sb(t, n === v, ()=>{ BLP.doff = 0; setP('dn', v); }, v === 'auto' ? 'Скільки вміститься — без порожніх місць' : `Аркуш ділиться на ${v} рівні місця`))));
      if (n !== 'auto' && +n > 1)
        row.append(h('span', {class:'bcl'}, 'Друкувати з місця:'),
          h('span', {class:'seg'}, ...Array.from({length:+n}, (_, i)=>sb(i === 0 ? 'з початку' : (i + 1) + '-го', (+BLP.doff || 0) === i, ()=>setP('doff', i),
            i ? `Перші ${i} місця на аркуші вже заповнені — покладіть цей аркуш у принтер ще раз` : ''))),
          (+BLP.doff || 0) ? h('span', {class:'chips-hint'}, 'Друкується лише новий запис на вільному місці — рамка й заголовок уже є на аркуші.') : '');
      if (n !== 'auto' && +n > 1 && !(+BLP.doff || 0))
        row.append(h('span', {class:'bcl'}, 'Вільне місце:'), h('span', {class:'seg'}, ...Object.entries(BFREE).map(([v, t])=>sb(t, (BLP.dfree || 'diary') === v, ()=>setP('dfree', v)))));
    }
    bar.append(row);
    setTimeout(()=>{ const v = [...document.querySelectorAll('#paper .b003[data-sc]')].map(p=>p.dataset.sc); const a = bar.querySelector('.bauto'); if (a && v.length) a.textContent = 'текст: авто, ' + [...new Set(v)].join(' / ') + ' %'; }, 0);
    return bar;
  };
  /* перегляд: сторінка А4 зменшується під ширину панелі */
  const rp0 = renderPaper;
  renderPaper = function(){
    const r = rp0.apply(this, arguments);
    const sh = document.querySelector('#paper .sheet');
    if (sh && PAPER){ const w = sh.clientWidth; if (w) sh.style.setProperty('--bz', Math.min(1, (w - 4) / 794).toFixed(3)); }
    return r;
  };
  let rz = 0; window.addEventListener('resize', ()=>{ clearTimeout(rz); rz = setTimeout(()=>{ if (PAPER && blankOn()) renderPaper(); }, 250); });
}
