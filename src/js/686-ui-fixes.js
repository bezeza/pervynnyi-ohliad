/* ===== 0.9.3.95 — вади з PLAN-UI-0.10 («Знайдені вади») — новий вигляд на ПК =====
   • «Перевірка» на порожньому документі — без позначки (ні зеленого ✓, ні лічильника): перевіряти ще нічого.
   • Розділи в меню — повними назвами («Анамнез хвороби», а не «Анамнез хв.»): місця вистачає.
   • У шапці документ «Первинний огляд» — коротко «Огляд» (назва програми поруч у логотипі).
   • «Швидкий огляд» — один раз (у «Швидких діях»), без повтору в рядку над формою.
   • Сповіщення не перекривають панель «Текст»: коли вона відкрита — зліва від неї.
   «Старий вигляд» — як було. */
const v2fOn = () => typeof UIV2 !== 'undefined' && UIV2;
{ const rc = renderCheck; renderCheck = function(){
  const n = rc.apply(this, arguments);
  try{ const tC = document.querySelector('.otabs [data-ov="chk"]'), cc = tC && tC.querySelector('.otc');
    const empty = !((document.getElementById('out') || {}).textContent || '').trim();
    if (tC && cc && v2fOn() && empty){ cc.textContent = ''; tC.classList.remove('done', 'warn'); tC.classList.add('v2-empty'); }
    else if (tC) tC.classList.remove('v2-empty');
  }catch(e){}
  return n;
}; }
const V2F = {short:new Map(), doc:null};
function v2fNames(){
  const on = v2fOn();
  SECTIONS.forEach(s=>{ if (!s.tab || !s.short || s.short === s.title) return;
    const t = [...s.tab.childNodes].find(n=>n.nodeType === 3 && n.nodeValue.trim()); if (!t) return;
    if (!V2F.short.has(s.id)) V2F.short.set(s.id, t.nodeValue);
    t.nodeValue = on ? s.title : V2F.short.get(s.id); });
  const d = document.querySelector('#docSeg button[data-doc="ohl"]');
  if (d){ if (V2F.doc == null) V2F.doc = d.textContent; d.textContent = on ? 'Огляд' : V2F.doc; d.title = 'Первинний огляд'; }
}
{ const a0 = uiV2Apply; uiV2Apply = function(){ const r = a0.apply(this, arguments); try{ v2fNames(); renderCheck(); }catch(e){} return r; }; }
{ const s0 = switchDoc; switchDoc = function(){ const r = s0.apply(this, arguments); try{ v2fNames(); }catch(e){} return r; }; }
try{ v2fNames(); renderCheck(); }catch(e){}
