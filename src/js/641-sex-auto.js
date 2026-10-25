/* ===== 0.9.3.56 — стать: з по батькові автоматично, перемикач — у блоці «Пацієнт» =====
   • По батькові (третє слово ПІБ): «-ович», «-евич», «-йович», «-ич» → чоловік; «-івна», «-ївна», «-овна», «-евна», «-ична» → жінка.
   • Ручний вибір завжди переважає: після кліку програма стать сама не змінює (до «Нового пацієнта»).
   • У шапці перемикача немає; якщо стать не визначено, а ПІБ є — жовта позначка «Стать?» з вибором Ч/Ж. */
let SEX_AUTO = false;
function sexFromPib(pib){
  const w = String(pib || '').trim().split(/\s+/).filter(Boolean); if (w.length < 3) return '';
  const p = w[2].toLowerCase().replace(/[^а-яіїєґ’'ʼ-]/g, '');
  if (/(івна|ївна|овна|евна|ична)$/.test(p)) return 'f';
  if (/(ович|евич|йович|ич)$/.test(p)) return 'm';
  return '';
}
function sexSet(v, auto){
  sex = v; SEX_AUTO = !!(v && auto);
  document.querySelectorAll('#sexSeg button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.sex === sex ? 'true' : 'false'));
  try{ refreshLabels(); }catch(e){} try{ sexPlan(); }catch(e){} update();
}
function sexAuto(){
  if (sex && !SEX_AUTO) return;   /* вибрано вручну або відновлено з картки — не чіпаємо */
  const d = sexFromPib(mv('pib'));
  if (d && d !== sex) sexSet(d, true);
}
/* ручний клік — ручний вибір (обробник у 540 спрацює слідом і перемкне стать) */
/* натискання на вже визначену автоматично стать — підтвердження, а не зняття вибору */
document.querySelectorAll('#sexSeg button').forEach(b=>b.addEventListener('click', e=>{
  if (SEX_AUTO && b.dataset.sex === sex){ SEX_AUTO = false; e.stopImmediatePropagation(); try{ sexAsk(); }catch(x){} return; }
  SEX_AUTO = false; }, true));
{ const pib = document.getElementById('meta_pib'); if (pib) pib.addEventListener('input', ()=>{ try{ sexAuto(); }catch(e){} }); }
{ const x0 = snap; snap = function(){ const s = x0.apply(this, arguments); s.sexAuto = SEX_AUTO; return s; }; }
{ const x0 = restore; restore = function(S){ const r = x0.apply(this, arguments); SEX_AUTO = !!(S && S.sexAuto); try{ sexAuto(); sexAsk(); }catch(e){} return r; }; }
{ const x0 = clearAll; clearAll = function(){ SEX_AUTO = false; const r = x0.apply(this, arguments); try{ sexAsk(); }catch(e){} return r; }; }

/* перемикач — у блок «Пацієнт», після дати народження */
{ const sx = document.getElementById('sexSeg'), dob = document.getElementById('meta_dob'), host = dob && dob.closest('.f');
  if (sx && host){
    sx.querySelectorAll('button').forEach(b=>{ const t = b.dataset.sex === 'm' ? 'Чоловік' : 'Жінка'; b.replaceChildren(t); b.title = t; });
    host.after(h('div', {class:'f sexf'}, h('div', {class:'lbl', id:'sexLbl'}, 'Стать'), sx, h('p', {class:'chips-hint'}, 'Визначається з по батькові; натисніть, щоб виправити.')));
    sx.setAttribute('aria-labelledby', 'sexLbl');
  } }
/* у шапці — лише коли стать невідома */
const SEX_ASK = h('span', {id:'sexAsk', class:'sexask', hidden:''}, h('span', {}, 'Стать?'),
  ...[['m','Ч','Чоловік'],['f','Ж','Жінка']].map(([v, t, l])=>h('button', {type:'button', title:l, 'aria-label':'Стать: ' + l, onclick:()=>{ const b = document.querySelector(`#sexSeg button[data-sex="${v}"]`); if (b) b.click(); }}, t)));
{ const line = document.getElementById('ptline'), bar = document.getElementById('ptbar'); if (line && bar) bar.after(SEX_ASK); else if (line) line.append(SEX_ASK); }
function sexAsk(){ SEX_ASK.hidden = !!sex || !mv('pib'); }
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); try{ sexAsk(); }catch(e){} return r; }; }
try{ sexAuto(); sexAsk(); }catch(e){}
