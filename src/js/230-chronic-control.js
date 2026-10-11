/* ===== Контроль хронічних хвороб ===== */
function ldlTarget(){
  if (ldlTarget.cache) return ldlTarget.cache;
  const o = [val(F('dx.osn'), true), val(F('dx.supd'), true), val(F('vitae.sup'), true)].join(' ').toLowerCase();
  if (['ihd','stroke','tia'].includes(curKey) || /іхс|інфаркт|інсульт|стенокард|атеросклер/.test(o)) return {v:1.4, t:'< 1,4 (дуже високий ризик)'};
  if (['dm','dpn'].includes(curKey) || /цукровий діабет|хронічна хвороба нирок|хзн|ххн/.test(o)) return {v:1.8, t:'< 1,8 (високий ризик)'};
  return {v:2.6, t:'< 2,6 (помірний ризик)'};
}
const CTRL = [
  {k:'ad', n:'АТ (офісний)', u:'мм рт. ст.', two:true, ph:['130','80'], t:()=>'< 130/80 (за переносимості; у літніх і ослаблених — < 140/90)', ok:(a,b)=>a < 130 && b < 80, mo:(ok)=>ok ? 3 : 1},
  {k:'hba1c', n:'HbA1c', u:'%', ph:['7,0'], t:()=>'< 7,0 (індивідуально)', ok:a=>a < 7, mo:ok=>ok ? 6 : 3},
  {k:'glu', n:'Глюкоза натще', u:'ммоль/л', ph:['6,0'], t:()=>'4,4–7,2 при ЦД', ok:a=>a >= 4.4 && a <= 7.2, mo:ok=>ok ? 3 : 1},
  {k:'ldl', n:'ХС ЛПНЩ', u:'ммоль/л', ph:['2,5'], t:()=>ldlTarget().t, ok:a=>a < ldlTarget().v, mo:ok=>ok ? 12 : 2},
  {k:'chol', n:'Загальний ХС', u:'ммоль/л', ph:['5,0'], t:()=>'< 5,0', ok:a=>a < 5, mo:ok=>ok ? 12 : 3},
  {k:'egfr', n:'ШКФ', u:'мл/хв/1,73 м²', ph:['75'], t:()=>'≥ 60', ok:a=>a >= 60, mo:ok=>ok ? 12 : 6},
  {k:'k', n:'Калій', u:'ммоль/л', ph:['4,5'], t:()=>'3,5–5,0', ok:a=>a >= 3.5 && a <= 5, mo:ok=>ok ? 6 : 1},
  {k:'acr', n:'Альбумін/креатинін сечі', u:'мг/ммоль', ph:['2'], t:()=>'< 3', ok:a=>a < 3, mo:ok=>ok ? 12 : 6},
  {k:'imt', n:'ІМТ', u:'кг/м²', ph:['25'], t:()=>'18,5–24,9', ok:a=>a >= 18.5 && a < 25, mo:ok=>6}
];
const ctrlV = (k, i) => { const e = document.getElementById(`ctrl_${k}_${i}`); return e && e.value.trim() !== '' ? num(e.value) : NaN; };
function ctrlEval(c){
  const a = ctrlV(c.k, 0), b = c.two ? ctrlV(c.k, 1) : 0;
  if (isNaN(a) || (c.two && isNaN(b))) return null;
  const dEl = document.getElementById(`ctrl_${c.k}_d`), d = dEl && dEl.value ? dEl.value : '';
  const ok = c.ok(a, b), base = d || todayISO();
  const nx = new Date(base + 'T00:00'); nx.setMonth(nx.getMonth() + c.mo(ok));
  return {a, b, d, ok, next:`${pad(nx.getMonth() + 1)}.${nx.getFullYear()}`};
}
function ctrlText(){
  return CTRL.map(c=>{ const r = ctrlEval(c); if (!r) return '';
    const v = c.two ? `${dec(r.a)}/${dec(r.b)}` : dec(r.a);
    return `${c.n} ${v} ${c.u}${r.d ? ' (' + fmtS(r.d) + ')' : ''} — ціль ${c.t()}${r.ok ? ', досягнуто' : ', не досягнуто'}`; }).filter(Boolean).join('; ');
}
function ctrlBlock(){
  const rows = CTRL.map(c=>{
    const ins = (c.two ? [0,1] : [0]).map(i=>h('input', {id:`ctrl_${c.k}_${i}`, inputmode:'decimal', 'aria-label':c.n + (c.two ? (i ? ' діастолічний' : ' систолічний') : ''), oninput:update}));
    const d = h('input', {type:'date', id:`ctrl_${c.k}_d`, 'aria-label':'Дата: ' + c.n, oninput:update});
    const st = h('span', {class:'cst', id:`ctrl_${c.k}_s`});
    return h('div', {class:'crow'}, h('div', {class:'cn'}, h('b', {}, c.n), h('span', {class:'ct', 'data-k':c.k}, '')),
      h('div', {class:'cv'}, ...ins.flatMap((x,i)=>i ? [h('span', {class:'u'}, '/'), x] : [x]), h('span', {class:'u'}, c.u)), d, st);
  });
  return h('div', {class:'pt ctrlbox'}, h('h3', {}, 'Показники та цілі'),
    h('p', {class:'chips-hint'}, 'Внесіть останні значення й дату аналізу. Ціль підбирається за діагнозом (для ХС ЛПНЩ — за серцево-судинним ризиком); поруч — коли повторити. Відхилення від цілі підсвічується.'),
    ...rows);
}
function renderCtrl(){
  if (MODE !== 'amb') return;
  const L = ldlTarget(); ldlTarget.cache = L;
  CTRL.forEach(c=>{
    const t = c.ctEl || (c.ctEl = document.querySelector(`.ct[data-k="${c.k}"]`)); if (!t) return;
    t.textContent = 'ціль ' + c.t();
    const r = ctrlEval(c), st = document.getElementById(`ctrl_${c.k}_s`);
    st.className = 'cst' + (r ? (r.ok ? ' ok' : ' bad') : '');
    st.textContent = r ? (r.ok ? 'досягнуто' : 'не досягнуто') + ' · повторити ~' + r.next : '';
  });
  ldlTarget.cache = null;
}

