// Сценарій «огляд за 5 хвилин» (план 0.10): типовий первинний огляд від нового пацієнта до друку — дії лікаря, як у житті.
// Повторювати після кожного етапу змін інтерфейсу: рахує кількість дій (натискань і введень) і час відповіді програми.
// Межі: не більше 20 дій; час роботи програми тут — у jsdom (у 5–10 разів повільніший за браузер), тож межа 20 с — лише запобіжник.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','build','app.html'),'utf8');
const errors=[];let printed=0;
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
 try{w.localStorage.setItem('po.autogate','0');w.localStorage.setItem('po.welcome','1');w.localStorage.setItem('po.profask','1');w.localStorage.setItem('po.hintsoff','1');}catch(e){}
 w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.scrollTo=()=>{};w.print=()=>{printed++};w.document.execCommand=()=>false;
 w.addEventListener('error',e=>errors.push(e.message));w.console.warn=(...a)=>errors.push(a.join(' '));}});
const w=d.window,doc=w.document,$=id=>doc.getElementById(id);
const steps=[];let actions=0;
const act=(name,n,fn)=>{const t=w.performance.now();fn();const ms=w.performance.now()-t;actions+=n;steps.push([name,n,ms]);};
const fail=m=>{console.log('❌ '+m);process.exit(1);};
const type=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
setTimeout(()=>{
 act('Новий пацієнт',1,()=>$('clearAll').click());
 act('ПІБ і дата народження',2,()=>{type($('meta_pib'),'Тестенко Петро Іванович');const dob=$('meta_dob_t')||$('meta_dob');type(dob,dob.id==='meta_dob'?'1962-03-14':'14.03.1962');});
 act('За хворобою: негоспітальна пневмонія',2,()=>{w.eval("goTab('hv')");const c=w.eval('PRESETS').findIndex(p=>/пневмон/i.test(p.name));if(c<0)fail('немає шаблону пневмонії');w.eval(`applyPreset(PRESETS[${c}])`);});
 act('Скарги: додати дві свої',2,()=>{const ch=w.eval("F('skarhy.c').chips").filter(b=>b.getAttribute('aria-pressed')!=='true').slice(0,2);ch.forEach(b=>b.click());});
 act('Огляд: змінити одну знахідку',1,()=>{const ok=w.eval("(()=>{const f=F('dyh.hr');if(!f||!f.el)return false;const b0=f.el.value;const o=f.opts&&f.opts.find(x=>x&&x.click&&x.getAttribute&&x.getAttribute('aria-pressed')!=='true');if(o)o.click();else{const opt=[...f.el.options].find(x=>x.value&&x.value!==b0);if(!opt)return false;f.el.value=opt.value;f.el.dispatchEvent(new Event('change',{bubbles:true}));}return f.el.value!==b0})()");if(!ok)fail('не знайшов знахідки в органах дихання');});
 act('Діагноз перевірити',0,()=>{if(!w.eval("F('dx.osn').el.value.trim()"))fail('діагноз не заповнився');});
 act('Текст документа',1,()=>{const b=$('txtBtn');if(b)b.click();});
 act('Друк',1,()=>{const b=$('printBtn');if(!b)fail('немає кнопки друку');b.click();});
 const out=$('out').textContent;
 const need=['Скарги','діагноз','План обстеження'];const miss=need.filter(k=>!out.toLowerCase().includes(k.toLowerCase()));
 const total=steps.reduce((s,x)=>s+x[2],0);
 console.log('Сценарій «огляд за 5 хвилин»:');steps.forEach(([n,k,ms])=>console.log(`  ${n.padEnd(40)} дій: ${k}  програма: ${ms.toFixed(0)} мс`));
 console.log(`  Разом дій: ${actions}; робота програми: ${(total/1000).toFixed(2)} с; друк: ${printed}`);
 if(miss.length)fail('у документі немає: '+miss.join(', '));
 if(!printed)fail('друк не викликано');
 if(actions>20)fail('забагато дій: '+actions);
 if(total>20000)fail('програма відповідає задовго: '+(total/1000).toFixed(2)+' с');
 if(errors.length)fail('помилки JavaScript: '+errors.join(' | '));
 console.log('✅ Огляд від нового пацієнта до друку — за '+actions+' дій');process.exit(0);
},400);
