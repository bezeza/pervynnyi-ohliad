// Перевірки функцій 2.13+: профілактика, друк, анамнез за хворобою, ПІБ, вагітність/гінеколог, схеми призначень, джерела, дози.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','build','app.html'),'utf8');
const R=[];const ok=(n,c,info='')=>R.push((c?'✅':'❌')+' '+n+(info&&!c?' — '+info:''));
const errs=[];let printed=0;
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.print=()=>{printed++};w.addEventListener('error',e=>errs.push(e.message));w.console.warn=(...a)=>errs.push(a.join(' '));}});
const w=d.window,doc=w.document,$=id=>doc.getElementById(id);
const ev=(e,t)=>e.dispatchEvent(new w.Event(t));const set=(id,v)=>{const e=$(id);e.value=v;ev(e,e.tagName==='SELECT'?'change':'input');};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=()=>[...$('out').children].map(x=>x.textContent).join('\n');
const ap=k=>w.eval(`applyPreset(PRESETS.find(p=>p.key==='${k}'), HV.cards[PRESETS.findIndex(p=>p.key==='${k}')])`);
const plan=()=>w.eval("val(F('dx.plan'),true)");
const rx=()=>w.eval("RX.map(i=>i.drug).join(', ')");
(async()=>{ await sleep(150);
 // ПІБ: автоперехід
 doc.querySelector('[data-mode="hosp"]').click(); doc.querySelector('#sexSeg [data-sex="f"]').click();
 set('meta_dob','1998-03-15'); ap('app');
 ok('Після вибору хвороби без ПІБ — вкладка «Запис» і курсор у ПІБ', w.eval('TABS[active].id')==='meta' && doc.activeElement.id==='meta_pib');
 // анамнез і стан
 ok('Анамнез хвороби заповнено заготовкою', /Анамнез хвороби: Вважає себе хворою протягом 1 дня/.test(out()), out().slice(0,300));
 ok('Анамнез життя — типовий', /Алергологічний анамнез не обтяжений/.test(out()));
 ok('Апендицит — стан середньої тяжкості', /Загальний стан середньої тяжкості/.test(out()));
 ok('Хірургія — неврологічний статус одним рядком', /Неврологічний статус: Вогнищевої/.test(out()));
 // жінка 28 — ХГЛ і гінеколог
 ok('Жінка 28 р., апендицит: тест на вагітність і гінеколог', /тест на вагітність \(ХГЛ\)/.test(plan()) && /консультація гінеколога/.test(plan()), plan());
 doc.querySelector('#sexSeg [data-sex="m"]').click();
 ok('Зміна статі на чоловічу прибирає ХГЛ', !/ХГЛ/.test(plan()), plan());
 set('meta_pib','Тест Іван'); set('meta_pos','Лікар-хірург'); ap('app');
 ok('Лікар-хірург: без «консультації хірурга»', !/консультація хірурга/.test(plan()), plan());
 ok('З ПІБ — показується перший розділ огляду', w.eval('TABS[active].id')==='skarhy');
 // схеми призначень
 const box=()=>[...doc.querySelectorAll('.rxvarbox')].find(b=>!b.hidden);
 ok('Схеми для апендициту видно', box() && box().querySelectorAll('.chip').length>=4);
 ok('На схемах — рівень доказовості', box() && box().querySelectorAll('.chip .lvl').length>=4);
 ok('Джерела: WSES і наказ МОЗ про ПАП', box() && /WSES 2020/.test(box().textContent) && /№ 540/.test(box().textContent));
 box().querySelectorAll('.chip')[1].click();
 ok('Схема «Передопераційна підготовка» замінює лист', /Цефазолін/.test(rx()) && /Метронідазол/.test(rx()), rx());
 box().querySelector('button.more').click();
 ok('«Повернути попередній лист» працює', rx()==='Натрію хлорид 0,9%', rx());
 ap('chol'); ok('Зміна хвороби оновлює автоматичний лист', /Цефтріаксон/.test(rx()), rx());
 w.eval("addRx({drug:'Мій препарат'})"); ap('panc'); ok('Ручні правки листа не переписуються', /Мій препарат/.test(rx()), rx());
 ok('Кожна хвороба має джерело схем', w.eval("PRESETS.filter(p=>p.key && p.key!=='prof' && !RXSRC[p.key]).length")===0);
 ok('Радикулопатія: без прегабаліну (NICE NG59)', !w.eval("JSON.stringify(RXV.rad)").includes('Прегабалін'));
 // дози при виборі препарату
 w.eval('RX.length=0; renderRx()'); w.eval("show(TABS.findIndex(t=>t.id==='rxt'))");
 [...doc.querySelectorAll('button')].find(b=>b.textContent.includes('Додати препарат')).click();
 let di=doc.querySelector('.rx-drug'); di.value='Амоксицилін'; ev(di,'change');
 ok('Вибір препарату підставляє дозу, шлях, кратність', w.eval("JSON.stringify([RX[0].dose,RX[0].route,RX[0].freq])")==='["1000 мг","per os","3 р/д"]', w.eval("JSON.stringify(RX[0])"));
 const dose=doc.querySelector('.rx-dose'); dose.value='1 г'; ev(dose,'input');
 di=doc.querySelector('.rx-drug'); di.value='Октреотид'; ev(di,'change');
 ok('Зміна препарату не лишає дозу попереднього', w.eval('RX[0].dose')==='50 мкг', w.eval('RX[0].dose'));
 ok('Інші типові дози у підказці поля', [...doc.querySelectorAll('datalist[id^="dl_d_"] option')].length>=1);
 // друк
 const n0=printed; w.eval(`(()=>{const s=TABS.find(t=>t.id==='calc'); s.panel.querySelector('.prbtn').click();})()`);
 ok('Друк вкладки «Шкали»', printed===n0+1 && $('print').textContent.length>500);
 ok('Кнопки друку на всіх вкладках', doc.querySelectorAll('.prbtn').length===w.eval('TABS.length'));
 w.eval(`printDocs(['ohl','rx','pam'])`);
 ok('Друк кількох документів — кожен окремо', $('print').querySelectorAll('.pr-doc').length===3 && w.eval('DOC')==='ohl');
 // профілактика
 doc.querySelector('[data-mode="amb"]').click(); await sleep(20); set('meta_dob','1956-03-01');
 const zv=[...doc.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.textContent==='Палить'));
 zv.value=[...zv.options].find(o=>o.textContent==='Палить').value; ev(zv,'change');
 w.eval(`show(TABS.findIndex(t=>t.id==='scr'))`);
 const items=[...doc.querySelectorAll('#scrList .crow b')].map(b=>b.textContent).join('|');
 ok('Профілактика: чоловік 70, палить — УЗД аорти, без мамографії', /УЗД черевної аорти/.test(items) && !/Мамографія/.test(items), items);
 doc.querySelector('#scrList button').click();
 ok('«Відмітити» вносить захід у документ', /Профілактичні заходи: Вимірювання АТ/.test(out()));
 ok('Сімейна медицина: 14 заготовок з ICPC-2', w.eval("PRESETS.filter(p=>p.group==='fam').every(p=>ICPCMAP[p.key])") && w.eval("PRESETS.filter(p=>p.group==='fam').length")===14);
 ok('Без помилок JavaScript', errs.length===0, errs.join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length);
 process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
