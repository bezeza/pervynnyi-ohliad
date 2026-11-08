/* ===== 0.9.3.95 — «розумна клавіатура», етап 1 (PLAN-UI-0.10, «Скарги — розумна клавіатура») — новий вигляд, ПК =====
   У текстових полях розділів (і «Додатково своїми словами» у скаргах):
   • з 3 літер — підказки: перша виділена, Tab приймає; ↑↓ — вибір, Enter — прийняти, Esc — сховати;
   • джерела: ваші часті фрази в цьому розділі (запам’ятовуються, коли виходите з поля), варіанти кнопок
     цього розділу (скарги, стани тощо), обрана хвороба;
   • безпечне форматування лише форми: «38.5 С» / «38,5с» → «38,5 °C», зайві пробіли, пробіл після коми.
     Слова без дії лікаря не міняються; велику літеру й крапку ставить сам текст документа, тому тут їх немає.
   Скорочення «.взд» + пробіл — як і раніше (590-comfort2.js). Нічого не надсилається; фрази — лише в цьому браузері.
   «Старий вигляд» і телефон — без підказок. */
const SI = {cache:{}, pop:null, f:null, sec:null, list:[], sel:0, frag:null};
const SI_KEY = 'po.phr';
let SI_PHR = {}; try{ SI_PHR = JSON.parse(lsGet(SI_KEY, '{}')) || {}; }catch(e){ SI_PHR = {}; }
try{ if (!FS_SET_KEYS.includes(SI_KEY)) FS_SET_KEYS.push(SI_KEY); }catch(e){}
const siOn = () => typeof UIV2 !== 'undefined' && UIV2 && (typeof v2Wide !== 'function' || v2Wide());
const siNorm = t => String(t).toLowerCase().replace(/[’ʼ']/g, '’');

/* варіанти розділу: кнопки полів, швидкі фрази, обрана хвороба */
function siBase(sec){
  if (SI.cache[sec.id]) return SI.cache[sec.id];
  const set = new Set();
  const add = t => { t = String(t || '').replace(/\[([^|\]]*)\|([^\]]*)\]/g, '$1').replace(/\s+/g, ' ').trim(); if (t.length >= 4 && t.length <= 120 && !/[{}]/.test(t)) set.add(t); };
  (sec.fields || []).forEach(f=>{ (f.opts || []).forEach(o=>add(O(o).t)); (f.quick || []).forEach(q=>add(q)); });
  return (SI.cache[sec.id] = [...set]);
}
function siPreset(sec){
  const out = [];
  try{ const p = SI.preset; if (p && p.set) Object.entries(p.set).forEach(([k, v])=>{ if (k.startsWith(sec.id + '.')) [].concat(v).forEach(x=>{ if (typeof x === 'string' && x.length >= 4) out.push(x); }); }); }catch(e){}
  return out;
}
function siCands(sec, frag){
  const q = siNorm(frag); if (q.length < 3) return [];
  const own = Object.entries(SI_PHR[sec.id] || {}).sort((a, b)=>b[1] - a[1]).map(x=>x[0]);
  const seen = new Set(), res = [];
  const take = (arr, src) => { for (const t of arr){ const n = siNorm(t); if (seen.has(n) || n === q) continue;
    const at = n.startsWith(q) ? 0 : n.indexOf(' ' + q) >= 0 ? 1 : -1; if (at < 0) continue; seen.add(n); res.push({t, src, at}); if (res.length >= 24) return; } };
  take(own, 'ваше'); take(siPreset(sec), 'хвороба'); take(siBase(sec), 'кнопки');
  return res.sort((a, b)=>a.at - b.at).slice(0, 6);
}
/* фрагмент перед курсором: останні 1–4 слова після коми / крапки / нового рядка (кома в числі «38,5» — не межа);
   береться найдовший кінець, для якого є підказки */
function siFrag(el, sec){
  const v = el.value, c = el.selectionStart; if (c == null || c !== el.selectionEnd) return null;
  if (/[\p{L}\d]/u.test(v.charAt(c) || '')) return null;   // посеред слова — не підказуємо
  const before = v.slice(0, c), m = /(?:^|(?<!\d)[,.;:\n(](?!\d))\s*([^\n;:(]*)$/u.exec(before);
  if (!m) return null; const seg = m[1].replace(/^.*(?<!\d)[,.](?!\d)\s*/u, '');
  if (/(^|\s)\.\S*$/.test(seg)) return null;   // «.взд» — це скорочення
  const words = seg.split(/(\s+)/);
  for (let n = Math.min(4, Math.ceil(words.length / 2)); n >= 1; n--){
    const tail = words.slice(words.length - (2 * n - 1)).join(''); if (tail.trim().length < 3) continue;
    const list = siCands(sec, tail.trim()); if (list.length) return {start:c - tail.length, end:c, text:tail, list};
  }
  return null;
}
function siClose(){ if (SI.pop){ SI.pop.remove(); SI.pop = null; } SI.list = []; SI.frag = null; }
function siDraw(){
  if (!SI.list.length || !SI.f){ siClose(); return; }
  if (!SI.pop){ SI.pop = h('div', {class:'si-pop', role:'listbox', 'aria-label':'Підказки'}); document.body.append(SI.pop); }
  const P = SI.pop; P.innerHTML = '';
  SI.list.forEach((c, i)=>{
    const n = siNorm(c.t), q = siNorm(SI.frag.text.trim()), k = n.startsWith(q) ? 0 : n.indexOf(' ' + q) + 1;
    const b = h('button', {type:'button', class:'si-i' + (i === SI.sel ? ' on' : ''), role:'option', 'aria-selected':i === SI.sel ? 'true' : 'false', tabindex:'-1'},
      h('span', {class:'si-t'}, c.t.slice(0, k), h('b', {}, c.t.slice(k, k + q.length)), c.t.slice(k + q.length)),
      h('span', {class:'si-s'}, i === SI.sel ? 'Tab' : c.src));
    b.addEventListener('mousedown', e=>{ e.preventDefault(); SI.sel = i; siAccept(); });
    P.append(b);
  });
  const r = SI.f.el.getBoundingClientRect();
  P.style.left = Math.round(Math.min(r.left, window.innerWidth - 420)) + 'px';
  P.style.width = Math.round(Math.min(Math.max(r.width, 280), 420)) + 'px';
  const below = window.innerHeight - r.bottom > 230;
  P.style.top = below ? Math.round(r.bottom + 4) + 'px' : ''; P.style.bottom = below ? '' : Math.round(window.innerHeight - r.top + 4) + 'px';
}
function siAccept(){
  const c = SI.list[SI.sel], el = SI.f && SI.f.el, fr = SI.frag; if (!c || !el || !fr) return siClose();
  const lead = (/^\s*/.exec(fr.text) || [''])[0], typed = fr.text.slice(lead.length);
  let t = c.t; if (/^\p{Lu}/u.test(typed) && !/^\p{Lu}/u.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);
  else if (/^\p{Ll}/u.test(typed) && /^\p{Lu}\p{Ll}/u.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1);
  const v = el.value, ins = lead + t;
  el.value = v.slice(0, fr.start) + ins + v.slice(fr.end);
  const p = fr.start + ins.length; el.setSelectionRange(p, p);
  siClose(); el.dispatchEvent(new Event('input', {bubbles:true}));
}
/* «38.5 С», «38,5с», «38,5 гр» → «38,5 °C» (лише 34–43, перед пробілом / розділовим знаком / кінцем) */
function siFormat(el){
  const v0 = el.value, c0 = el.selectionStart;
  let v = v0.replace(/\b(3[4-9]|4[0-3])[.,](\d)\s?(?:°\s?)?(?:[CcСс]|гр\.?|град\.?)(?=[\s,.;)]|$)/g, '$1,$2 °C');
  v = v.replace(/([^\s\d]),(?=[\p{L}])/gu, '$1, ').replace(/ {2,}/g, ' ');
  if (v === v0) return false;
  el.value = v; const p = Math.max(0, c0 + (v.length - v0.length)); try{ el.setSelectionRange(p, p); }catch(e){}
  el.dispatchEvent(new Event('input', {bubbles:true})); return true;
}
/* запам’ятати фрази лікаря з поля (до 300 на розділ) */
function siLearn(sec, el){
  const parts = String(el.value || '').split(/[.;\n]+|,\s+/).map(s=>s.trim()).filter(s=>s.length >= 6 && s.length <= 100 && /\p{L}{3}/u.test(s));
  if (!parts.length) return;
  const m = SI_PHR[sec.id] || (SI_PHR[sec.id] = {});
  parts.forEach(p=>{ const k = p.charAt(0).toLowerCase() + p.slice(1); m[k] = (m[k] || 0) + 1; });
  const keys = Object.keys(m); if (keys.length > 300) keys.sort((a, b)=>m[a] - m[b]).slice(0, keys.length - 300).forEach(k=>delete m[k]);
  lsSet(SI_KEY, JSON.stringify(SI_PHR));
}
function siFieldOf(el){
  for (const sec of SECTIONS) for (const f of (sec.fields || [])) if (f.el === el && (f.type === 'text' || f.type === 'line') && !f.list && !f.noSmart) return {sec, f};
  return null;
}
document.addEventListener('input', e=>{
  if (!siOn()) return; const el = e.target; if (!el || !el.matches || !el.matches('#panels textarea, #panels input[type="text"]')) return;
  const hit = (SI.f && SI.f.el === el) ? {sec:SI.sec, f:SI.f} : siFieldOf(el); if (!hit){ siClose(); return; }
  SI.f = hit.f; SI.sec = hit.sec;
  if (e.data === ' ' || e.inputType === 'insertLineBreak') siFormat(el);
  const fr = siFrag(el, hit.sec); if (!fr){ siClose(); return; }
  SI.frag = fr; SI.list = fr.list; SI.sel = 0; siDraw();
}, true);
document.addEventListener('keydown', e=>{
  if (!SI.pop || !SI.f || e.target !== SI.f.el) return;
  if (e.key === 'Tab' && !e.shiftKey){ e.preventDefault(); siAccept(); }
  else if (e.key === 'ArrowDown'){ e.preventDefault(); SI.sel = (SI.sel + 1) % SI.list.length; siDraw(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); SI.sel = (SI.sel - 1 + SI.list.length) % SI.list.length; siDraw(); }
  else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey){ e.preventDefault(); siAccept(); }
  else if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); siClose(); }
}, true);
document.addEventListener('focusout', e=>{
  const f = SI.f && SI.f.el === e.target ? SI.f : null, sec = SI.sec; if (!f) return;
  setTimeout(()=>{ if (document.activeElement !== f.el){ siClose(); if (siOn()){ siFormat(f.el); siLearn(sec, f.el); } } }, 120);
}, true);
window.addEventListener('scroll', ()=>{ if (SI.pop) siDraw(); }, {passive:true, capture:true});
{ const a0 = uiV2Apply; uiV2Apply = function(){ const r = a0.apply(this, arguments); if (!UIV2) siClose(); return r; }; }
{ const p0 = applyPreset; applyPreset = function(p){ SI.preset = p; return p0.apply(this, arguments); }; }
