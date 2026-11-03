/* ===== 0.9.3.75 — «Дописати історію»: паперова історія → щоденники за дні перебування, епікриз, друк =====
   Для історій, де первинний огляд, лікування й аналізи вже є на папері, а щоденників та епікризу ще немає.
   • Картка: ПІБ, № карти, дати надходження й виписки, діагноз (поля ті самі, що в програмі).
   • Таблиця днів: від надходження до виписки, без субот і неділь (день надходження й виписки — завжди; вихідний можна додати
     для тяжкого хворого). Показники з температурного листка — жоден не обов’язковий; динаміка на кожен день
     (за замовчуванням «з позитивною динамікою», останній день — «перед випискою»).
   • «Згенерувати щоденники»: на кожен день без запису — щоденник з первинного огляду / шаблону хвороби за динамікою
     (той самий механізм, що й кнопки шаблонів щоденника) з датою дня, показниками і лікуванням на цей день (лист призначень).
     Нічого понад внесені дані не вигадується; порожній показник у щоденник не йде.
   • Далі — «Епікриз» і «🖨 Друк історії» (кілька документів одним завданням).
   Формат збереження пацієнтів не змінюється: щоденники потрапляють у звичайний журнал щоденників. */
const BF = {rows:[], pid:null, skip:new Set()};
const BF_T = ['36,6','36,8','37,0','37,2','37,5','38,0','38,5','39,0'];
const BF_DYN = [['1','↑ з позитивною динамікою'],['0','= без суттєвої динаміки'],['3','↘ погіршення'],['2','перед випискою (покращення)']];
const BF_WD = ['нд','пн','вт','ср','чт','пт','сб'];
const bfWd = d => BF_WD[new Date(d + 'T00:00').getDay()];
function bfDays(d1, d2){
  if (!d1 || !d2 || d2 < d1) return [];
  const out = [];
  for (let d = d1, k = 0; d <= d2 && k < 400; d = addDays(d, 1), k++){ const wd = new Date(d + 'T00:00').getDay(); if ((wd === 0 || wd === 6) && d !== d1 && d !== d2) continue; out.push(d); }
  return out;
}
const bfHasDiary = d => DIARIES.some(x=>String(x.dt || '').split('T')[0] === d);
function bfRowsSync(){
  const P = F('e_per.per'), d1 = P.d1.value, d2 = P.d2.value;
  if (BF.pid !== (typeof PID !== 'undefined' ? PID : null)){ BF.rows = []; BF.skip = new Set(); BF.pid = (typeof PID !== 'undefined' ? PID : null); }
  const old = new Map(BF.rows.map(r=>[r.d, r]));
  const extra = BF.rows.filter(r=>r.extra && d1 && d2 && r.d >= d1 && r.d <= d2).map(r=>r.d);
  const days = [...new Set([...bfDays(d1, d2), ...extra])].filter(d=>!BF.skip.has(d)).sort();
  BF.rows = days.map(d=>old.get(d) || {d, t:'', ad1:'', ad2:'', hr:'', rr:'', spo:'', o2:'', dyn: d === d2 ? '2' : '1', extra: extra.includes(d)});
  return BF.rows;
}
function bfFillDown(){
  const K = ['t','ad1','ad2','hr','rr','spo','o2'];
  for (let i = 1; i < BF.rows.length; i++) K.forEach(k=>{ if (!String(BF.rows[i][k] || '').trim() && String(BF.rows[i - 1][k] || '').trim()) BF.rows[i][k] = BF.rows[i - 1][k]; });
}
function bfGenerate(){
  const rows = BF.rows.filter(r=>!bfHasDiary(r.d));
  if (!rows.length){ toast('Щоденники на всі дні таблиці вже є в журналі'); return 0; }
  const keepDt = mv('dt'), keepToast = toast; let n = 0;
  try{
    toast = function(){};
    if (DOC !== 'shch') switchDoc('shch');
    rows.forEach(r=>{
      diaryFromExam(+r.dyn);
      const dt = document.getElementById('meta_dt'); if (dt) dt.value = r.d + 'T09:00';
      const set = (k, i, v) => { try{ const f = F(k); if (f && f.inputs && f.inputs[i]) f.inputs[i].value = String(v || '').trim(); }catch(e){} };
      set('d_obj.t', 0, r.t); set('d_obj.ad', 0, r.ad1); set('d_obj.ad', 1, r.ad2); set('d_obj.chss', 0, r.hr); set('d_obj.chd', 0, r.rr); set('d_obj.chd', 1, r.spo); set('d_obj.o2', 0, r.o2);
      const di = document.getElementById('d_main_den_0'); if (di){ delete di.dataset.user; di.value = ''; }
      update();
      DIARIES.push({dt:mv('dt'), rec:mv('rec'), html:$('#out').innerHTML, data:diaryFields(), bf:1}); n++;
    });
    DIARIES.sort((a, b)=>String(a.dt).localeCompare(String(b.dt)));
  } finally { toast = keepToast; }
  const dt = document.getElementById('meta_dt'); if (dt) dt.value = keepDt;
  try{ renderDiaries(); }catch(e){} try{ savePatient(true); }catch(e){} update();
  toast(`Додано щоденників: ${n}. Перегляньте їх у журналі щоденників і за потреби поправте`, 4000);
  return n;
}
/* ---------- вікно ---------- */
function bfDialog(){
  const old = document.getElementById('bfBox'); if (old) old.remove();
  const back = document.activeElement;
  const close = () => { box.remove(); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const P = F('e_per.per');
  const proxy = (label, el, attrs) => { if (!el) return ''; const id = 'bf_' + (el.id || Math.random().toString(36).slice(2));
    const i = h('input', Object.assign({id, value:el.value}, attrs || {})); i.addEventListener('input', ()=>{ el.value = i.value; el.dispatchEvent(new Event('input', {bubbles:true})); if (el === P.d1 || el === P.d2) draw(); });
    return h('div', {class:'f'}, h('label', {for:id}, label), i); };
  const dx = (()=>{ try{ return F('dx.osn').el; }catch(e){ return null; } })();
  const card = h('div', {class:'grid bf-card'},
    proxy('ПІБ (або «Історія N»)', document.getElementById('meta_pib')), proxy('№ медичної карти', document.getElementById('meta_card')),
    proxy('Дата надходження', P.d1, {type:'date'}), proxy('Дата виписки', P.d2, {type:'date'}),
    dx ? proxy('Діагноз', dx, {class:'bf-dx'}) : '');
  const hint = h('p', {class:'chips-hint'});
  const tbox = h('div', {class:'bf-tbl'}), info = h('p', {class:'chips-hint bf-info'}), gen = h('button', {type:'button', class:'btn primary'});
  const extraD = h('input', {type:'date', class:'bf-xd', 'aria-label':'Дата вихідного дня'});
  const dl = h('datalist', {id:'bfTlist'}, ...BF_T.map(v=>h('option', {value:v})));
  function draw(){
    bfRowsSync();
    hint.textContent = 'Хвороба (шаблон щоденника): ' + ((typeof curKey !== 'undefined' && curKey && (PRESETS.find(x=>x.key === curKey) || {}).name) || 'не обрано — щоденники будуть з первинного огляду') + '. Субота й неділя пропущені; день надходження й виписки — завжди.';
    tbox.innerHTML = '';
    if (!BF.rows.length){ tbox.append(h('p', {}, 'Вкажіть дати надходження й виписки — з’явиться таблиця днів.')); gen.disabled = true; gen.textContent = 'Згенерувати щоденники'; info.textContent = ''; return; }
    const inp = (r, k, ph, extra) => { const i = h('input', Object.assign({value:r[k] || '', placeholder:ph, inputmode:'decimal', 'aria-label':ph + ' ' + fmtD(r.d), class:'bf-in'}, extra || {})); i.addEventListener('input', ()=>{ r[k] = i.value; }); return i; };
    const tb = h('tbody', {}, ...BF.rows.map(r=>{
      const done = bfHasDiary(r.d);
      const sel = h('select', {'aria-label':'Динаміка ' + fmtD(r.d)}, ...BF_DYN.map(([v, t])=>h('option', {value:v}, t))); sel.value = r.dyn; sel.addEventListener('change', ()=>{ r.dyn = sel.value; });
      const rm = h('button', {type:'button', class:'more', title:'Прибрати день з таблиці', 'aria-label':'Прибрати ' + fmtD(r.d), onclick:()=>{ BF.skip.add(r.d); BF.rows = BF.rows.filter(x=>x !== r); draw(); }}, '×');
      return h('tr', {class:done ? 'bf-done' : ''}, h('td', {class:'bf-d'}, fmtS(r.d), ' ', h('span', {class:'chips-hint'}, bfWd(r.d))),
        h('td', {}, inp(r, 't', 't°', {list:'bfTlist'})), h('td', {class:'bf-ad'}, inp(r, 'ad1', 'САТ'), '/', inp(r, 'ad2', 'ДАТ')),
        h('td', {}, inp(r, 'hr', 'ЧСС')), h('td', {}, inp(r, 'rr', 'ЧД')), h('td', {}, inp(r, 'spo', 'SpO₂')), h('td', {}, inp(r, 'o2', 'О₂ л/хв')),
        h('td', {}, sel), h('td', {class:'bf-st'}, done ? '✓ є' : ''), h('td', {}, done ? '' : rm));
    }));
    const tbl = h('table', {class:'bf-t'}, h('thead', {}, h('tr', {}, ...['Дата','t°','АТ','ЧСС','ЧД','SpO₂','О₂','Динаміка','Щоденник',''].map(x=>h('th', {}, x)))), tb);
    tbox.append(tbl);
    const todo = BF.rows.filter(r=>!bfHasDiary(r.d)).length;
    gen.disabled = !todo; gen.textContent = todo ? `Згенерувати щоденники (${todo})` : 'Щоденники на всі дні вже є';
    info.textContent = `Днів у таблиці: ${BF.rows.length}; уже є щоденників: ${BF.rows.length - todo}. Порожні показники в щоденник не йдуть.`;
  }
  gen.addEventListener('click', ()=>{ const n = bfGenerate(); if (n) draw(); });
  const box = h('div', {id:'bfBox', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'bfT'},
    h('div', {class:'mcard bf-m'},
      h('div', {class:'ph'}, h('h2', {id:'bfT'}, 'Дописати історію'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      h('p', {class:'chips-hint'}, 'Для паперової історії, де первинний огляд, лікування й аналізи вже є: внесіть дати й показники з температурного листка — програма складе щоденники на робочі дні. Лікування на кожен день береться з листа призначень, аналізи — з журналу обстежень.'),
      card, hint, dl, tbox,
      h('div', {class:'acts2'},
        h('button', {type:'button', class:'btn', onclick:()=>{ bfFillDown(); draw(); }, title:'Порожні клітинки заповнити значенням попереднього дня'}, '↓ Порожні — як попередній день'),
        extraD, h('button', {type:'button', class:'btn', onclick:()=>{ const d = extraD.value; if (!d) return; if (!P.d1.value || !P.d2.value || d < P.d1.value || d > P.d2.value){ toast('Дата має бути в межах перебування'); return; } BF.skip.delete(d); if (!BF.rows.some(r=>r.d === d)){ BF.rows.push({d, t:'', ad1:'', ad2:'', hr:'', rr:'', spo:'', o2:'', dyn:'1', extra:true}); } draw(); }}, '+ день (вихідний для тяжкого хворого)')),
      info,
      h('div', {class:'acts2'}, gen,
        h('button', {type:'button', class:'btn', onclick:()=>{ close(); if (DOC !== 'epi') switchDoc('epi'); toast('Епікриз складається з картки, призначень, журналу обстежень і останнього щоденника. Перевірте й допишіть'); }}, 'Епікриз →'),
        h('button', {type:'button', class:'btn', onclick:()=>{ close(); packDialog(); }}, '🖨 Друк історії'))));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box); draw();
  const f = box.querySelector('.bf-card input'); if (f) f.focus();
}
/* пункт меню «⋯» поруч із «🖨 Кілька документів» */
try{
  document.querySelectorAll('.more-dd .mmenu').forEach(menu=>{
    const multi = [...menu.querySelectorAll('button')].find(b=>/^🖨 Кілька документів/.test(b.textContent.trim()));
    if (!multi || menu.querySelector('.bfbtn')) return;
    multi.before(h('button', {type:'button', class:'more bfbtn', role:'menuitem', title:'Паперова історія: щоденники за дні перебування з температурного листка, епікриз, друк', onclick:()=>{ const dd = menu.closest('details'); if (dd) dd.open = false; bfDialog(); }}, '📝 Дописати історію'));
  });
}catch(e){}
