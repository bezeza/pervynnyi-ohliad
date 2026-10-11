const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','build','app.html'),'utf8');const errs=[];
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.scrollTo=()=>{};w.TextEncoder=TextEncoder;w.document.execCommand=()=>true;w.console.warn=(...a)=>errs.push('W '+a.join(' '));w.console.error=(...a)=>errs.push('CE '+a.join(' '));w.addEventListener('error',e=>errs.push('E '+e.message));}});
setTimeout(async()=>{const w=d.window,doc=w.document; const prob=[];
const out=()=>[...doc.getElementById('out').children].map(x=>x.textContent).join('\n');
const bad=t=>/undefined|null|NaN|\[object|\{v\}|\{\w+\}|  \.|\.\.(?!\.)|,,/.test(t.replace(/…/g,''));
const set=(k,v)=>{const e=doc.getElementById('meta_'+k); e.value=v; e.dispatchEvent(new w.Event('input'));};
set('doc','Іваненко О. В.'); set('zav','Петренко С. М.'); set('nach','Сидоренко В. І.'); set('vidd','Терапевтичне відділення № 2'); set('zoz','КНП «Лікарня»');
w.eval("document.querySelector('#sexSeg button[data-sex=\"f\"]').click()");
set('pib','Коваль Ганна Петрівна'); set('dob','1958-05-02');
let n=0;
for (const mode of ['hosp','amb']){
  w.eval(`MODE='${mode}'; applyMode ? applyMode() : 0; applyDoc(true)`);
  for (const side of ['r','l','b']){
    const keys=w.eval("PRESETS.map(p=>p.key)");
    for (const k of keys){
      errs.length=0;
      w.eval(`SIDE='${side}'; RX=[]; { const p=PRESETS.find(x=>x.key==='${k}'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); } switchDoc('ohl'); update();`);
      const t=out(); n++;
      if (!t.trim()) prob.push(`${mode}/${side}/${k}: порожній текст`);
      if (bad(t)) prob.push(`${mode}/${side}/${k}: підозрілий текст: `+(t.match(/.{0,40}(undefined|null|NaN|\[object|\{v\}|\{\w+\}|  \.|\.\.|,,).{0,30}/)||[''])[0]);
      if (side==='l' && /справа|правої|правого/.test(w.eval(`(PRESETS.find(x=>x.key==='${k}').sides?1:0)`)?t.split('\n').filter(l=>/Основний|Status|Скарги/.test(l)).join(' '):'')) prob.push(`${mode}/l/${k}: лишилось «справа/правої» після перемикання на ліво`);
      if (errs.length) prob.push(`${mode}/${side}/${k}: `+errs.join(' | '));
    }
  }
  // all docs for one rich patient
  w.eval("SIDE='r'; RX=[]; { const p=PRESETS.find(x=>x.key==='pneu'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); }");
  const docs=w.eval("[...DOCLIST[MODE], ...DOCMORE[MODE]].map(d=>d[0])");
  for (const dk of docs){ errs.length=0; w.eval(`switchDoc('${dk}'); update();`); const t=out(); n++;
    if (!t.trim()) prob.push(`${mode}/doc ${dk}: порожній`); if (bad(t)) prob.push(`${mode}/doc ${dk}: підозрілий: `+(t.match(/.{0,40}(undefined|null|NaN|\[object|\{v\}|\{\w+\}|  \.|\.\.|,,).{0,30}/)||[''])[0]);
    if (errs.length) prob.push(`${mode}/doc ${dk}: `+errs.join(' | '));
    const vis=w.eval("TABS.filter(t=>!t.tab.hidden).length"); if (vis<3) prob.push(`${mode}/doc ${dk}: мало вкладок ${vis}`);
    // word export
    try{ const r=await w.eval("(async()=>{ const b = typeof makeDocx==='function' ? await makeDocx() : null; return b ? (b.size||b.length||1) : 0; })()"); if (!r) prob.push(`${mode}/doc ${dk}: Word не сформувався`); }catch(e){ prob.push(`${mode}/doc ${dk}: Word помилка ${e.message}`); }
  }
  w.eval("switchDoc('ohl')");
}
// save/restore round-trip with new features
w.eval("MODE='hosp'; applyDoc(true); RX=[]; { const p=PRESETS.find(x=>x.key==='tdr'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); } switchDoc('zav'); pick(F('z_main.uch'), ['заступник головного лікаря з медичної роботи','завідувач відділення']); switchDoc('konc'); pick(F('c_main.chl'), ['лікуючий лікар']); F('c_end.vysn').el.value='Діагноз підтверджено.'; switchDoc('ohl'); update(); savePatient(true);");
const before=w.eval("JSON.stringify(snap().f)"), beforeOut=out();
w.eval("newPatient()"); const pid=w.eval("Object.keys(loadStore())[0]"); w.eval(`openPatient('${pid}')`);
const after=w.eval("JSON.stringify(snap().f)");
if (before!==after) prob.push('Збереження/відкриття: поля відрізняються');
if (out()!==beforeOut) prob.push('Збереження/відкриття: текст відрізняється');
console.log('перевірок:', n, '| проблем:', prob.length); console.log(prob.slice(0,40).join('\n'));
process.exit(prob.length?1:0)},300);
