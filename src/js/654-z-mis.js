/* ===== З МІС: ПІБ, стать і дата народження з МІС Health24 (закладка в браузері → буфер → Ctrl+V у програмі) ===== */
/* misParse — самодостатня: її текст вбудовується в закладку, тому без зовнішніх змінних */
function misParse(t){
  const M = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const W = "[А-ЯІЇЄҐ][А-ЯІЇЄҐа-яіїєґ'’ʼ-]+", N = '(' + W + '(?:[ \\t]+' + W + '){1,3})';
  const nice = s => s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])([а-яіїєґ])/g, (m, a, b) => a + b.toUpperCase()) : s;
  const bySx = n => /(ович|йович|ич)$/i.test(n) ? 'm' : /(івна|ївна|овна|инична)$/i.test(n) ? 'f' : '';
  const p2 = n => String(n).padStart(2, '0'), R = [], seen = {};
  const add = (raw, pib, sx, d, m, y) => {
    pib = nice(pib.trim().replace(/\s+/g, ' ')); d = +d; m = +m; y = +y;
    if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && y > 1900 && y <= new Date().getFullYear())) return;
    const dob = y + '-' + p2(m) + '-' + p2(d), k = pib + '|' + dob; if (seen[k]) return; seen[k] = 1;
    R.push({pib, sex: sx === 'Ч' ? 'm' : sx === 'Ж' ? 'f' : bySx(pib.split(' ')[2] || ''), dob, raw: raw.trim()});
  };
  /* МІС Health24: «Прізвище Ім’я По батькові» ↵ «Ч.,21 квітня 1973 (53 р.)» */
  for (const x of t.matchAll(new RegExp(N + '[ \\t]*\\r?\\n?[ \\t]*([ЧЖ])\\.?,?\\s*(\\d{1,2})[ \\t]+(' + M.join('|') + ')[ \\t]+(\\d{4})', 'g')))
    add(x[0], x[1], x[2], x[3], M.indexOf(x[4]) + 1, x[5]);
  /* просто «Прізвище Ім’я По батькові, 21.04.1973» */
  if (!R.length) for (const x of t.matchAll(new RegExp(N + '[ \\t,]*\\r?\\n?[ \\t]*(?:дата народження:?\\s*)?(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})', 'gi')))
    add(x[0], x[1], '', x[2], x[3], x[4]);
  return R;
}

function misFill(p){
  const st = loadStore(), same = Object.keys(st).find(id=>st[id].name === p.pib && (!st[id].dob || st[id].dob === p.dob));
  if (same){ if (same !== PID) openPatient(same); toast('Пацієнт уже є — відкрито: ' + p.pib, 2600); return; }
  if (mv('pib') && mv('pib') !== p.pib) newPatient();
  [['pib', p.pib], ['dob', p.dob]].forEach(([k, v])=>{ const e = document.getElementById('meta_' + k); if (e){ e.value = v; e.dispatchEvent(new Event('input')); } });
  if (p.sex) sexSet(p.sex, false);   /* стать із МІС — як ручний вибір: автовизначення за по батькові її не змінює */
  calcAge(); update(); savePatient(true); renderPtBar();
  toast('З МІС: ' + p.pib + ', ' + fmtD(p.dob) + (p.sex ? (p.sex === 'f' ? ', жінка' : ', чоловік') : ''), 2600);
}
function misPick(list){
  if (list.length === 1){ misFill(list[0]); return; }
  const old = document.getElementById('misPick'); if (old) old.remove();
  const close = ()=>box.remove();
  const box = h('div', {id:'misPick', class:'modal', role:'dialog', 'aria-label':'Кого перенести з МІС'},
    h('div', {class:'mcard'},
      h('div', {class:'ph'}, h('h2', {}, 'Кого перенести з МІС?'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      h('div', {class:'acts2', style:'flex-direction:column;align-items:stretch'}, ...list.map(p=>h('button', {type:'button', class:'btn', onclick:()=>{ close(); misFill(p); }}, p.pib + ', ' + fmtD(p.dob))))));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  document.body.append(box);
}
function misFromText(t, quiet){
  const r = misParse(t || '');
  if (!r.length){ if (!quiet) toast('У буфері немає ПІБ і дати народження з МІС. Натисніть закладку «З МІС» на сторінці пацієнта', 3500); return false; }
  misPick(r); return true;
}
function misBookmarklet(){
  const fb = "const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove();done()";
  const code = `(()=>{const misParse=${misParse.toString()};const s=String(getSelection()),r=misParse(s.trim()?s:document.body.innerText);`
    + `if(!r.length){alert('Первинний огляд: не знайшов ПІБ і дату народження. Відкрийте медкарту пацієнта або виділіть рядок пацієнта.');return}`
    + `let p=r[0];if(r.length>1){const n=prompt('Кого перенести в «Первинний огляд»? Номер:\\n'+r.map((x,i)=>(i+1)+'. '+x.pib).join('\\n'),'1');if(n===null)return;p=r[(+n||0)-1];if(!p)return}`
    + `const t=p.raw,done=()=>alert('Скопійовано: '+p.pib+'\\nПерейдіть у «Первинний огляд» і натисніть Ctrl+V');`
    + `try{navigator.clipboard.writeText(t).then(done,()=>{${fb}})}catch(e){${fb}}})()`;
  return 'javascript:' + encodeURIComponent(code);
}

/* Ctrl+V поза полями (або в полі ПІБ) — заповнює пацієнта, якщо в буфері рядок із МІС */
document.addEventListener('paste', e=>{
  const t = e.target, inField = t && t.closest && t.closest('input,textarea,select,[contenteditable="true"],#out');
  if (inField && t.id !== 'meta_pib') return;
  const s = (e.clipboardData || window.clipboardData).getData('text/plain');
  if (!misParse(s).length) return;
  e.preventDefault(); misFromText(s, true);
});

{ const pib = document.getElementById('meta_pib'), grid = pib && pib.closest('.grid');
  if (grid){
    const btn = h('button', {type:'button', class:'btn', title:'Вставити ПІБ, стать і дату народження, скопійовані закладкою «З МІС»', onclick:()=>{
      try{ navigator.clipboard.readText().then(t=>misFromText(t), ()=>toast('Натисніть Ctrl+V — браузер не дав прочитати буфер', 3000)); }
      catch(x){ toast('Натисніть Ctrl+V — браузер не дав прочитати буфер', 3000); } }}, '⇩ З МІС');
    const bm = h('a', {class:'btn', href:misBookmarklet(), title:'Перетягніть на панель закладок браузера', onclick:e=>{ e.preventDefault(); toast('Перетягніть цю кнопку на панель закладок (Ctrl+Shift+B — показати панель)', 3500); }}, '🔖 З МІС → Первинний огляд');
    grid.after(h('div', {class:'acts2', id:'misIn', style:'margin:6px 0 4px'}, btn, bm,
      h('span', {class:'chips-hint', style:'margin:0'}, 'Один раз перетягніть «🔖» на панель закладок. У МІС відкрийте медкарту пацієнта → закладка → тут Ctrl+V. Дані йдуть лише через буфер обміну.')));
  }
}
