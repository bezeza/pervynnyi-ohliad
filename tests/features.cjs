// Перевірки функцій 2.13+: профілактика, друк, анамнез за хворобою, ПІБ, вагітність/гінеколог, схеми призначень, джерела, дози.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','build','app.html'),'utf8');
const R=[];const ok=(n,c,info='')=>R.push((c?'✅':'❌')+' '+n+(info&&!c?' — '+info:''));
const errs=[];let printed=0;
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.URL.revokeObjectURL=()=>{};w.scrollTo=()=>{};try{w.localStorage.setItem('po.autogate','0');w.localStorage.setItem('po.paperedit','form')}catch(e){}w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.print=()=>{printed++};w.addEventListener('error',e=>errs.push(e.message));w.console.warn=(...a)=>errs.push(a.join(' '));}});
const w=d.window,doc=w.document,$=id=>doc.getElementById(id);
const ev=(e,t)=>e.dispatchEvent(new w.Event(t));const set=(id,v)=>{const e=$(id);e.value=v;ev(e,e.tagName==='SELECT'?'change':'input');};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=()=>[...$('out').children].map(x=>x.textContent).join('\n');
const ap=k=>w.eval(`applyPreset(PRESETS.find(p=>p.key==='${k}'), HV.cards[PRESETS.findIndex(p=>p.key==='${k}')])`);
const plan=()=>w.eval("val(F('dx.plan'),true)");
const rx=()=>w.eval("RX.map(i=>i.drug).join(', ')");
(async()=>{ await sleep(450);
 ok('Перший запуск: знайомство з даними лікаря', !!doc.querySelector('.welcome'));
 { const ins=doc.querySelectorAll('.welcome input'); ins[0].value='Петренко О. В.'; [...doc.querySelectorAll('.welcome button')].find(b=>b.textContent==='Готово').click(); }
 ok('Знайомство зберігає ПІБ лікаря', $('meta_doc').value==='Петренко О. В.' && !doc.querySelector('.welcome'));
 // WebCrypto і TextEncoder у jsdom — для тестів PIN і шифрування копій у будь-якій частині
 if (!w.TextEncoder){ w.TextEncoder=require('util').TextEncoder; w.TextDecoder=require('util').TextDecoder; } if (!w.crypto.subtle){ try{ Object.defineProperty(w.crypto, 'subtle', {value:require('crypto').webcrypto.subtle, configurable:true}); }catch(e){} }
 // ── кінець підготовки (спільна для всіх частин) ──
 $('paperBtn').click();
 ok('«Перегляд перед друком» вмикає макет документа', $('paperBtn').textContent==='Перегляд перед друком' && $('paperBtn').getAttribute('aria-pressed')==='true' && !$('paper').hidden);
 $('paperBtn').click();
 ok('«Перегляд перед друком» повертає режим редагування', $('paperBtn').getAttribute('aria-pressed')==='false' && $('paper').hidden);
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
 ok('«Повернути попередній лист» працює', /Натрію хлорид 0,9%/.test(rx()) && !/Цефазолін/.test(rx()), rx());
 ap('chol'); ok('Зміна хвороби оновлює автоматичний лист', /Цефтріаксон/.test(rx()), rx());
 w.eval("addRx({drug:'Мій препарат'})"); ap('panc'); ok('Ручні правки листа не переписуються', /Мій препарат/.test(rx()), rx());
 ok('Кожна хвороба має джерело схем', w.eval("PRESETS.filter(p=>p.key && p.key!=='prof' && !RXSRC[p.key]).length")===0);
 ok('Радикулопатія: без прегабаліну (NICE NG59)', !w.eval("JSON.stringify(RXV.rad)").includes('Прегабалін'));
 // дози при виборі препарату
 w.eval('RX.length=0; renderRx()'); w.eval("show(TABS.findIndex(t=>t.id==='rxt'))");
 [...doc.querySelectorAll('button')].find(b=>b.textContent.includes('Порожній рядок')).click();
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
 // навігація «Далі →» і ‹ ›
 doc.querySelector('[data-mode="hosp"]').click(); await sleep(20); w.eval("show(TABS.findIndex(t=>t.id==='skarhy'))"); await sleep(20);
 const nb=()=>TABS_cur().panel.querySelector('.nextbar .nb-next'); const TABS_cur=()=>w.eval('TABS[active]');
 ok('Внизу розділу — «Далі: Анамнез хв.»', nb() && /Далі: Анамнез хв/.test(nb().textContent), nb() && nb().textContent);
 nb().click(); await sleep(20); ok('«Далі» відкриває наступний розділ', w.eval('TABS[active].id')==='morbi', w.eval('TABS[active].id'));
 ok('Назва розділу з ‹ › для телефона', /Анамнез хв/.test($('tabnav').textContent) && $('tabnav').querySelectorAll('.tn-arr').length===2);
 $('tabnav').querySelector('.tn-arr').click(); await sleep(20); ok('‹ повертає назад', w.eval('TABS[active].id')==='skarhy');
 ok('Очистити поточний документ — у меню «⋯»', [...TABS_cur().panel.querySelectorAll('.more-dd .mmenu button')].some(b=>b.textContent.trim()==='Очистити поточний документ'));
 ok('Профіль терапевта: травматологія схована за «Інші профілі»', doc.querySelector('.gtab[data-g="tr"]').hidden && !doc.querySelector('.gtab[data-g="ter"]').hidden);
 // скасування
 w.eval('clearAll()'); ap('pneu'); ap('gh');
 $('undoBtn').click(); ok('↶ скасовує вибір хвороби (повертає попередню)', w.eval('curKey')==='pneu' && /Амоксицилін\/клавуланат/.test(rx()), w.eval('curKey')+' '+rx());
 const u0=w.eval('UNDO.length'); $('allNorm').click(); const u1=w.eval('UNDO.length'); doc.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));
 ok('Ctrl+Z скасовує «Норму всюди»', u1===u0+1 && w.eval('UNDO.length')===u0, [u0,u1,w.eval('UNDO.length'),doc.activeElement&&doc.activeElement.tagName].join(','));
 // швидкий огляд у стаціонарі
 doc.querySelector('[data-mode="hosp"]').click(); await sleep(20); w.eval("switchDoc('ohl')");
 const qb=$('quickBtn'); if (qb.getAttribute('aria-pressed')!=='true') qb.click();
 ok('Стаціонар: «Швидкий огляд» відкриває «Показники і системи»', qb.textContent==='Швидкий огляд' && w.eval('TABS[active].id')==='qv' && !w.eval("TABS.find(t=>t.id==='zah').tab.hidden"));
 qb.click();
 // перемикання пацієнтів
 set('meta_pib','Тест Іван'); w.eval('savePatient(true)'); w.eval('newPatient()'); set('meta_pib','Другий Пацієнт'); w.eval('savePatient(true)');
 $('ptbar').click(); const rows=[...doc.querySelectorAll('.swrow')];
 ok('Смужка пацієнта відкриває список пацієнтів', rows.length>=2, rows.length);
 rows.find(r=>/Тест Іван/.test(r.textContent)).click(); await sleep(20);
 ok('Перемикання одним дотиком', $('meta_pib').value==='Тест Іван', $('meta_pib').value);
 // пошук і клавіші
 w.eval("show(TABS.findIndex(t=>t.id==='skarhy'))"); doc.querySelectorAll('.cmdk').forEach(x=>x.remove());
 doc.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'k',code:'KeyK',ctrlKey:true,bubbles:true}));
 ok('Ctrl+K відкриває пошук', !!doc.querySelector('.cmdk'));
 { const q=doc.querySelector('.cmdk input'); q.value='сатурац'; ev(q,'input'); const it=doc.querySelector('.cmdk .cmdi'); ok('Пошук знаходить поле «ЧД і сатурація»', it && /сатурац/i.test(it.textContent), it && it.textContent);
   q.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})); await sleep(60); ok('Enter переходить у розділ «Дихання»', w.eval('TABS[active].id')==='dyh', w.eval('TABS[active].id')); }
 { const z=$('set_zoom'); z.value='1.2'; ev(z,'change'); ok('Розмір тексту: «Великий»', doc.documentElement.style.zoom==='1.2'); z.value='1'; ev(z,'change'); }
 // листок призначень 003-4/о
 w.eval("RX.length=0; addRx({drug:'Цефтріаксон', dose:'1 г', route:'в/м', freq:'2 р/д', start:addDays(todayISO(),-2)}); RX[0].stop=todayISO(); renderRx(); f0034Print()");
 { const t=$('print').querySelector('.f0034'); const r=t && [...t.querySelectorAll('tbody tr.f-l')][0];
   ok('Листок 003-4/о: рядки «Лікар/Сестра», «+» у дні призначення, «—» у день відміни', !!r && /ФОРМА № 003-4\/о/.test(t.textContent) && [...r.querySelectorAll('.f-d')].map(c=>c.textContent).slice(0,3).join('')==='++—', r && [...r.querySelectorAll('.f-d')].map(c=>c.textContent).slice(0,4).join(',')); }
 // 2.23: призначення, процедури, листок з двох боків, план на коли, зручність
 doc.querySelector('[data-mode="hosp"]').click(); await sleep(20); w.eval('clearAll()'); ap('pneu'); w.eval("show(TABS.findIndex(t=>t.id==='rxt'))"); await sleep(20);
 ok('Стрічка «Призначено» над листом', /Призначено \(\d+\)/.test($('rxStrip').textContent) && /Амоксицилін\/клавуланат/.test($('rxStrip').textContent), $('rxStrip').textContent.slice(0,80));
 ok('Компактні рядки: усі згорнуті', doc.querySelectorAll('#rxList .rx.rxc').length===w.eval('RX.length') && !doc.querySelector('#rxList .rx.open'));
 ok('Підказки процедур для пневмонії', /Пульсоксиметрія/.test($('rxSuggest').textContent));
 [...$('rxSuggest').querySelectorAll('button')].find(b=>/Оксигенотерапія/.test(b.textContent)).click();
 ok('Процедура додається як маніпуляція', w.eval("rxKind(RX.find(i=>/Оксигенотерапія/.test(i.drug)))")==='man');
 { const a=$('rxAdd'); a.value='Інгаляції через небулайзер'; a.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})); }
 ok('Пошук-додавання: фізіотерапія', w.eval("rxKind(RX.find(i=>/небулайзер/.test(i.drug)))")==='phys');
 w.eval("RX=RX.filter(i=>rxKind(i)!=='drug' || i.drug==='Амоксицилін/клавуланат').sort((a,b)=>(rxKind(a)==='drug'?0:1)-(rxKind(b)==='drug'?0:1)); RX[0].start=addDays(todayISO(),-2); RX[0].src='pat'; RX[0].hours='8:00, 20:00'"); w.eval("rxChangeDose(RX[0]); renderRx()");
 ok('«Змінити дозу з сьогодні»: стара закрита, нова з сьогодні', w.eval("RX[0].stop===todayISO() && RX.some(i=>i!==RX[0] && i.drug===RX[0].drug && i.start===todayISO() && !i.stop)"));
 ok('Текст огляду: процедури окремим рядком', /Процедури: [^\n]*Оксигенотерапія/.test(out()), (out().match(/Процедури:[^\n]*/)||[''])[0]);
 w.eval("const x=planDGet(); x['ЗАК']=[todayISO(),'вип']; planDSet(x); f0034Print()");
 { const P=$('print'); const fr=P.querySelector('.f0034:not(.f0034b)'), bk=P.querySelector('.f0034b');
   ok('Листок: позначка «звідки» і години на лицьовому боці', fr && /пац\./.test(fr.textContent) && /8:00, 20:00/.test(fr.textContent));
   ok('Зворот: ЗАК з датами і «перед вип.», ЕКГ, небулайзер у фізіотерапії', bk && /Загальний аналіз крові/.test(bk.textContent) && /перед вип\./.test(bk.textContent) && /Інгаляції через небулайзер/.test(bk.textContent)); }
 w.eval("show(TABS.findIndex(t=>t.id==='dx'))"); await sleep(20);
 ok('План обстеження: рядки «на коли» під планом', doc.querySelectorAll('#planDList .pdrow').length>=4);
 // кнопки замість списків, «хворіє протягом», стрічка
 ok('Короткі списки стали кнопками (загальний стан)', !!w.eval("F('zah.stan').seg") && doc.querySelectorAll('.segbtns').length>10);
 [...doc.querySelectorAll('.durq button')].find(b=>b.textContent==='тиждень').click();
 ok('«Хворіє протягом»: кнопка «тиждень»', /протягом 1 тижня/.test(out()), (out().match(/протягом[^.]*/)||[''])[0]);
 ok('Номери черговості на скаргах', doc.querySelectorAll('.chip[data-n]').length>=3);
 w.eval("show(TABS.findIndex(t=>t.id==='skarhy'))"); { const q=$('skarhy_c_q'); if(q){ q.value='гикавка'; ev(q,'input'); } }
 ok('Пошук скарг: «+ Додати „гикавка“»', !!doc.querySelector('.qadd') && /гикавка/.test(doc.querySelector('.qadd').textContent));
 doc.querySelector('.qadd').click(); ok('Нова скарга додана й відмічена', /гикавк/.test(out()));
 // перенесення між пристроями (без пароля — злиття)
 { const pay=w.eval("JSON.stringify(trPayload('all', true))"); const o=JSON.parse(pay); const n0=Object.keys(o.items).length;
   w.eval("localStorage.setItem('po.patients','{}')");
   const plan=w.eval(`(()=>{const p=trPlan(${pay}.items); return [p.add.length,p.upd.length,p.old.length]})()`);
   w.eval(`trApply(trPlan(${pay}.items), null)`); const n1=w.eval("Object.keys(loadStore()).length");
   ok('Перенесення: усі пацієнти з файлу додаються в порожній пристрій', n0>=2 && plan[0]===n0 && n1===n0, [n0,plan.join('/'),n1].join(' '));
   const plan2=w.eval(`(()=>{const p=trPlan(${pay}.items); return p.add.length+'/'+p.upd.length+'/'+p.old.length})()`);
   ok('Повторне перенесення нічого не дублює', plan2==='0/0/'+n0, plan2); }
 // 0.9.1 «Зручність 2»
 { const q=$('hvq'); q.value='J44'; ev(q,'input');
   const vis=w.eval("HV.cards.filter(c=>!c.hidden).map(c=>c.querySelector('b').textContent).join('|')");
   ok('Пошук хвороби над картками (за кодом МКХ)', /ХОЗЛ/.test(vis) && !/пневмонія/.test(vis), vis); q.value=''; ev(q,'input');
   ok('Word і LibreOffice — у «Завантажити ▾», PDF лишається біля друку', $('docxBtn').hidden && $('odtBtn').hidden && $('saveBtn').textContent==='Завантажити ▾' && doc.querySelectorAll('.savemenu button').length===2);
   ok('Подвійне клацання: справа ↔ зліва з великої та у відмінках', w.eval("flipWord('Справа')+'|'+flipWord('лівої')+'|'+flipWord('правобічна')")==='Зліва|правої|лівобічна');
   const ta=doc.querySelector('#panels textarea'); ta.value='Дихання .взд'; ta.selectionStart=ta.selectionEnd=ta.value.length;
   ta.dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));
   ok('Скорочення «.взд» + пробіл → фраза', ta.value==='Дихання дихання везикулярне, хрипів немає ', ta.value); ta.value=''; ev(ta,'input');
   ok('Налаштування — згортуваними блоками', doc.querySelectorAll('details.setsec').length>=8 && !!doc.querySelector('details.setsec[open]'));
   ok('«?» біля назви розділу', doc.querySelectorAll('.qhelp').length>=15);
   w.eval("(()=>{ const e=document.getElementById('meta_pib'); e.value='Кошиковий Тест'; e.dispatchEvent(new Event('input')); savePatient(true); })()");
   const id=w.eval('PID'); w.eval(`delPatient('${id}')`);
   ok('Видалений пацієнт — у кошику, «Скасувати» повертає', !w.eval(`!!loadStore()['${id}']`) && w.eval(`!!TRASH['${id}']`) && (w.eval(`restorePatient('${id}')`), w.eval(`!!loadStore()['${id}'] && !TRASH['${id}']`)));
   ok('Пам’ятка на 1 сторінку', /Ctrl\+K/.test(w.eval('memoHTML()')) && /\.взд/.test(w.eval('memoHTML()'))); }
 // 0.9.2 «Вигляд»
 { const r=w.eval("VIEW.layout='C'; applyView(); [document.body.classList.contains('lay-C'), JSON.parse(localStorage.getItem('po.view')||'{}').layout]");
   ok('Вигляд: «Дзеркальне» вмикається і запам’ятовується', r[0]===true || w.innerWidth<900, JSON.stringify(r));
   w.eval("VIEW.layout='auto'; VIEW.fold=true; applyView()"); ok('Вигляд: текст згортається в смужку', w.innerWidth<900 || doc.body.classList.contains('outfold'));
   w.eval("VIEW.fold=false; saveView(); applyView()");
   ok('Меню «Вигляд» з 5 варіантами розташування', (w.eval('openViewPop()'), doc.querySelectorAll('.viewpop .vlays button').length===5) && (w.eval('closeViewPop()'), true)); }
 // 0.9.3 профілі, нирки, QR, повтор дії
 { w.eval("PROF={p:'hir',w:'both'}; applyProfile(true)");
   const r=w.eval("[TABS.find(t=>t.id==='dyh').tab.hidden, !!document.querySelector('#tabs .tfold'), curGroup, DOCLIST.hosp.map(d=>d[0]).join(','), TABS.find(t=>t.id==='trav').tab.hidden]");
   ok('Профіль «Хірург»: дихання згорнуто, травлення видно, хірургічні першими, згода серед основних', r[0]===true && r[1] && r[2]==='hir' && /zgoda/.test(r[3]) && r[4]===false, JSON.stringify(r));
   w.eval("PROF=null; applyProfile(true)");
   ok('Без профілю — показується все, як раніше', w.eval("TABS.find(t=>t.id==='dyh').tab.hidden")===false && !doc.querySelector('#tabs .tfold') && !w.eval("DOCLIST.hosp.some(d=>d[0]==='zgoda')"));
   { const m=w.eval("(()=>{ const s=(id,v)=>{const e=document.getElementById(id); if(e){e.value=v; e.dispatchEvent(new Event('input'));}}; document.querySelector('#sexSeg [data-sex=m]').click(); s('meta_dob','1946-01-01'); s('pt_cr','300'); s('pt_wt',''); s('zah_hw_1',''); runCalcs(); return renalMsg({drug:'Метформін'}) })()");
   ok('Нирки: перевірка доз і без ваги — за ШКФ', /ШКФ \d+ мл\/хв: протипоказаний/.test(m), m); }
   ok('Нирки: нові препарати в переліку (валацикловір)', /кожні 24 год/.test(w.eval("renalMsg({drug:'Валацикловір'})")));
   w.eval("(()=>{const e=document.getElementById('pt_cr'); e.value=''; e.dispatchEvent(new Event('input')); runCalcs();})()");
   ok('QR-код будується з українським текстом', !!w.eval("(()=>{ const q=qrSvg('Як приймати ліки: кларитроміцин 500 мг 2 рази на день'); return q && q.querySelector('svg'); })()"));
   const u=w.eval("(()=>{ const ap=k=>{const i=PRESETS.findIndex(p=>p.key===k); applyPreset(PRESETS[i], HV.cards[i]);}; ap('pneu'); ap('gh'); undoLast(); const a=curKey; redoLast(); return a+'>'+curKey; })()");
   ok('Скасувати і повторити (Ctrl+Z / Ctrl+Y)', u==='pneu>gh', u);
   ok('Секундомір документа: статистика рахується', Array.isArray(w.eval('tmStats(7)'))); }
 { const r=w.eval("(()=>{ const s=(id,v)=>{const e=document.getElementById(id); if(e){e.value=v; e.dispatchEvent(new Event('input'));}}; s('meta_pib','Шевченко Тарас Григорович'); s('meta_doc','Безеза О. В.'); update(); const a=aiBuild('miss'); return [a.txt.includes('Шевченко'), a.txt.includes('Безеза'), /МОЇ ВИМОГИ/.test(a.txt), /НАГАДУЮ ВИМОГИ/.test(a.txt), /\[пацієнт\]|ПАЦІЄНТ:/.test(a.txt)] })()");
   ok('Для ШІ: без ПІБ пацієнта й лікаря, вимоги на початку й у кінці', !r[0] && !r[1] && r[2] && r[3] && r[4], JSON.stringify(r)); }
 // 0.9.3.4 щоденник: обґрунтованість перебування за наказом № 1044
 { doc.querySelector('[data-mode="hosp"]').click(); ap('pneu'); w.eval("switchDoc('shch')");
   const s=(id,v)=>{const e=$(id); e.value=v; ev(e,'input');};
   w.eval("RX.length=0; addRx({drug:'Цефтріаксон', dose:'2 г', route:'в/в', freq:'1 р/д', start:todayISO()}); renderRx(); update()");
   s('d_obj_t_0','37,9'); s('d_obj_chss_0','98'); s('d_obj_chd_0','26'); s('d_obj_chd_1','94'); s('d_obj_o2_0','3'); s('d_obj_ad_0','120'); s('d_obj_ad_1','70');
   ok('Щоденник: кисень поруч із SpO2', /SpO2 94% на кисні 3 л\/хв/.test(out()), out().slice(0,400));
   ok('Щоденник: обґрунтованість перебування — кисень і в/в антибіотик з пунктами', /Обґрунтованість перебування в стаціонарі зберігається відповідно до Стандарту «Критерії госпіталізації пацієнтів для надання стаціонарної медичної допомоги», затвердженого наказом МОЗ України від 30\.07\.2026 № 1044: кисневотерапія 3 л\/хв.*розд\. II, п\. 1.*внутрішньовенна антибактеріальна терапія/.test(out()), out());
   ok('Пневмонія: підказка — бракує стабільності для переходу per os', /бракує стабільності: t° > 37,8 °C, ЧД > 24, потреба в кисні/.test(doc.querySelector('.dhints').textContent));
   s('d_obj_t_0','36,8'); s('d_obj_chd_0','18'); s('d_obj_o2_0',''); s('d_obj_chd_1','95'); s('d_obj_chss_0','80');
   ok('Пневмонія: стабільність виконана — підказка про перехід на пероральний антибіотик', /Критерії клінічної стабільності виконано/.test(doc.querySelector('.dhints').textContent));
   w.eval("RX.length=0; renderRx(); update()"); set('d_main_dyn','0');
   ok('Немає підстав — без рядка в тексті, з підказкою і зауваженням перевірки', !/Обґрунтованість перебування/.test(out()) && /підстав для продовження перебування/.test(doc.querySelector('.dhints').textContent) && w.eval("checkDoc().some(x=>/наказ МОЗ № 1044/.test(x.m))"));
   set('d_main_dyn','2'); ok('«Стан покращився» без підстав — «планується виписка»', /Підстав для продовження цілодобового медичного нагляду немає \(Стандарт «Критерії госпіталізації.*», затверджений наказом МОЗ України від 30\.07\.2026 № 1044\) — планується виписка/.test(out()), out());
   s('d_obj_chd_1','90'); ok('SpO2 ≤ 92% на повітрі — підстава розд. III', /SpO2 90% при диханні атмосферним повітрям \(розд\. III, п\. 1\)/.test(out()));
   doc.querySelector('[data-mode="amb"]').click(); ok('Амбулаторно — рядка обґрунтування перебування немає', !/Обґрунтованість перебування/.test(out()));
   doc.querySelector('[data-mode="hosp"]').click(); w.eval("switchDoc('ohl')"); }
 // 0.9.3.5 пропуски на аркуші «Перегляд перед друком»
 { ap('pneu'); w.eval("switchDoc('ohl')"); if (!w.eval('PAPER')) $('paperBtn').click(); w.eval('renderPaper()');
   const sh=doc.querySelector('#paper .sheet'), n=w.eval("checkDoc().filter(x=>!/^Залишилось незаповнених/.test(x.m)).length");
   ok('Аркуш: кожне зауваження перевірки підсвічено на аркуші', sh.querySelectorAll('.gap:not(.dots)').length===n && n>0, sh.querySelectorAll('.gap:not(.dots)').length+' / '+n);
   ok('Аркуш: зауваження розділу стоїть у своєму розділі', !!sh.querySelector('[data-sec="zah"] .gap, [data-sec="vitae"] .gap'));
   const g=[...sh.querySelectorAll('button.gap')].find(b=>/t°/.test(b.textContent)); g && g.click();
   ok('Аркуш: натискання на пропуск веде до поля', g && w.eval('TABS[active].id')==='zah', g ? w.eval('TABS[active].id') : 'немає');
   ok('Пропуски не потрапляють у текст для копіювання', !/Не вказано: t°/.test(out()));
   w.__printed=0; $('printBtn').click(); ok('Пропуски не потрапляють у друк', !$('print').querySelector('.gap, .gapbar, .gaplist'));
   { const e=[...doc.querySelectorAll('#paper .sheet button.gap')].find(b=>/працездатність/.test(b.textContent)); e && e.click();
     for(let n=0;n<75 && (!doc.activeElement || doc.activeElement.id!=='vitae_strah');n++) await sleep(20);
     ok('Аркуш: натискання на «працездатність / ЕЛН» ставить курсор у саме поле і підсвічує його', e && doc.activeElement && doc.activeElement.id==='vitae_strah' && doc.activeElement.closest('.f').classList.contains('fieldflash'), doc.activeElement && doc.activeElement.id); }
   doc.querySelector('#paper .sheet .gaptog').click(); ok('Пропуски можна сховати', !doc.querySelector('#paper .sheet .gap') && /Пропусків і зауважень/.test(doc.querySelector('#paper .gapbar').textContent));
   doc.querySelector('#paper .gaptog').click(); $('paperBtn').click(); }
 // 0.9.3.6 бланк закладу 003/о
 { doc.querySelector('[data-mode="hosp"]').click(); ap('pneu'); w.eval("switchDoc('ohl')"); set('meta_pib','');
   if (!w.eval('PAPER')) $('paperBtn').click();
   const bb=()=>doc.querySelector('#paper .blankbar');
   ok('Бланк: перемикач «Текст / Бланк 003/о» над аркушем', !!bb() && /Бланк 003\/о/.test(bb().textContent));
   [...bb().querySelectorAll('button')].find(b=>/Бланк/.test(b.textContent)).click();
   const pages=()=>[...doc.querySelectorAll('#paper .b003')];
   ok('Бланк: первинний огляд — 2 сторінки (п. 33–40)', pages().length===2 && /ПЕРВИННИЙ ОГЛЯД ЛІКАРЯ/.test(pages()[0].textContent) && /40\. П\.І\.Б\. лікаря/.test(pages()[1].textContent), pages().length);
   const und=[...pages()[0].querySelectorAll('.bu')].map(e=>e.textContent);
   ok('Бланк: варіанти підкреслено за даними огляду (стан, хрипи, перкусія)', und.includes('середньої тяжкості') && und.includes('вологі') && und.includes('вкорочений'), und.join('|'));
   ok('Бланк: обстеження за планом обведено (ЗАК, Ro-гр. ОГК)', [...pages()[1].querySelectorAll('.bnum.on')].map(e=>e.textContent).join(',').includes('21') && pages()[1].querySelector('.bnum.on').textContent==='1');
   ok('Бланк: порожній ПІБ підсвічено на екрані', !!pages()[0].querySelector('.bgap'));
   ok('ІМТ: без зросту й маси — зауваження перевірки', w.eval("checkDoc().some(x=>/ІМТ не розраховано/.test(x.m))"));
   set('zah_hw_0','1,72'); set('zah_hw_1','95'); w.eval('renderPaper()');
   ok('Бланк: зріст, маса тіла й ІМТ з класом за ВООЗ', /Зріст 172 см, маса тіла 95 кг, ІМТ 32,1 кг\/м² ожиріння I ступеня/.test(pages()[0].textContent.replace(/\s+/g,' ')) && !w.eval("checkDoc().some(x=>/ІМТ/.test(x.m))"), pages()[0].textContent.match(/Зріст.{0,90}/)?.[0]);
   [...bb().querySelectorAll('label')].find(l=>/титульний/.test(l.textContent)).querySelector('input').click();
   ok('Бланк: титульний лист 003/о (п. 1–21)', pages().length===(w.eval('BLP.back')?4:3) && /МЕДИЧНА КАРТА СТАЦІОНАРНОГО ХВОРОГО/.test(pages()[0].textContent) && /21\. Проведено ліжко-днів/.test(pages()[0].textContent));
   w.eval("BLP.title=false"); w.__printed=0; $('printBtn').click();
   ok('Бланк: друк — сторінки бланка без жовтих позначок і без QR', $('print').querySelectorAll('.b003').length===2 && !$('print').querySelector('.bgap, .prqr'));
   w.eval("switchDoc('shch'); renderPaper()"); ok('Бланк: «43. Щоденник» із показниками ліворуч', /43\. ЩОДЕННИК/.test(pages()[0].textContent) && /ЧДР –/.test(pages()[0].textContent));
   w.eval("switchDoc('epi'); F('s066.tbres').el.value='2'; renderPaper()");
   const tbres=doc.querySelector('#paper .bepi2 .brow[data-s66fld="tbres"]');
   ok('Бланк: п. 54 бере лише вибрану категорію резистентності з 066/о', !!tbres && tbres.querySelector('.bbox').textContent.trim()==='3', tbres && tbres.textContent);
   tbres && tbres.click(); await sleep(20);
   ok('Бланк: клік по категорії резистентності відкриває поле у 066/о', w.eval("DOC==='f066' && TABS[active].id==='s066'"), w.eval("DOC+' / '+TABS[active].id"));
   w.eval("switchDoc('epi'); renderPaper()"); ok('Бланк: «45. Епікриз» і п. 54–57', pages().length===2 && /45\. ЕПІКРИЗ/.test(pages()[0].textContent) && /57\. Результат медичного лікування/.test(pages()[1].textContent));
   w.eval("switchDoc('rx'); renderPaper()"); ok('Бланк: для інших документів — звичайний аркуш', !doc.querySelector('#paper .b003') && !bb());
   w.eval("switchDoc('ohl'); renderPaper()"); [...bb().querySelectorAll('button')].find(b=>/Текст документа/.test(b.textContent)).click(); $('paperBtn').click(); }
 // 0.9.3.7 ергономіка
 { w.eval("DIARIES=[]; switchDoc('ohl')"); ap('pneu'); w.eval("switchDoc('shch')");
   ok('Перший щоденник — з первинного огляду, а не «норма»', /вологі хрипи/.test(out()) && !/хрипи не вислуховуються/.test(out()), out().slice(0,400));
   w.eval("switchDoc('ohl')");
   const ex=w.eval("(()=>{ show(TABS.findIndex(t=>t.id==='dyh')); const f=F('dyh.hr'); mark(f.el,f); const n=f.el.nextElementSibling; return [f.el.title, n && n.className, n && n.textContent] })()");
   ok('Довгий вибраний варіант видно повністю під списком', ex[1]==='selfull' && /вологі дрібнопухирчасті хрипи/.test(ex[2]) && ex[0]===ex[2], JSON.stringify(ex)); }
   { const f=w.eval("F('ssc.shum')"); w.eval("(()=>{ const f=F('ssc.shum'); f.el.value='1'; f.el.dispatchEvent(new Event('change')); })()");
     const m=[...doc.querySelectorAll('#out mark.chg')].map(x=>x.textContent).join('|');
     ok('Змінене в тексті підсвічено саме тими словами, що змінились', /Систолічний шум на верхівці/.test(m) && m.length<60, m);
     w.eval("(()=>{ const f=F('ssc.shum'); f.el.value='2'; f.el.dispatchEvent(new Event('change')); })()");
     const m2=[...doc.querySelectorAll('#out mark.chg')].map(x=>x.textContent).join('|');
     ok('Зміна частини фрази — підсвічено лише нову частину', m2==='над аортою.', m2); }
 // 0.9.3.9 бланк на весь аркуш А4, записи щоденника по місцях
 { doc.querySelector('[data-mode="hosp"]').click(); ap('pneu'); w.eval("BLANK=true; BLP.fill=true; BLP.all=false; BLP.dn=2; BLP.doff=0; switchDoc('ohl'); PAPER=true; renderPaper()");
   ok('Бланк: сторінки — аркуші А4 «на весь аркуш»', [...doc.querySelectorAll('#paper .b003')].every(p=>p.classList.contains('bA4') && p.classList.contains('bfill')));
   w.eval("switchDoc('shch'); renderPaper()");
   const sl=()=>[...doc.querySelectorAll('#paper .b003 .bslot')].map(x=>x.className.replace('bslot','').trim()||'запис').join(',');
   ok('Щоденник: 2 записи на аркуш — поточний угорі, на вільному місці — бланк для запису від руки', sl()==='запис,bfree', sl());
   w.eval("BLP.dfree='none'; renderPaper()"); ok('Щоденник: вільне місце можна лишити порожнім', sl()==='запис,bempty', sl()); w.eval("BLP.dfree='diary'");
   w.eval("BLP.doff=1; renderPaper()");
   ok('Щоденник: друк на друге місце — перше пропущено, рамка й заголовок не друкуються', sl()==='bskip,запис' && doc.querySelector('#paper .b003').classList.contains('bcont'), sl());
   w.eval("BLP.dn=1; BLP.doff=0; renderPaper()"); ok('Щоденник: 1 запис на аркуш', sl()==='запис', sl());
   ok('Панель бланка: «на весь аркуш», записів на аркуш', /на весь аркуш/.test(doc.querySelector('#paper .blankbar').textContent) && /Записів на аркуш/.test(doc.querySelector('#paper .blankbar').textContent));
   w.eval("BLP.dn='auto'; renderPaper()"); ok('Щоденник: «авто» — без помилок', doc.querySelectorAll('#paper .b003').length>=1);
   w.eval("BLP.dn=2; BLP.doff=0; BLANK=false; PAPER=false; renderPaper(); switchDoc('ohl')"); }
 // 0.9.3.9 менше ходіння вкладками: документ з огляду, консультація, дата щоденника, підстави № 1044
 { w.eval("switchDoc('ohl')"); ap('pneu');
   ok('«＋ Документ з огляду» — у первинному огляді', !$('mkDocBtn').closest('[hidden]') && !$('mkDocBtn').parentElement.hidden);
   doc.querySelector('[data-mode="amb"]').click(); w.eval("goDocFromExam('kons')");
   ok('Консультаційний висновок: скарги, анамнез й об’єктивно — з первинного огляду без переходу', /Скарги на підвищення температури/.test(out()) && /Вважає себе хвор/.test(out()) && /Об’єктивно: Загальний стан/.test(out()), out().slice(0,600));
   ok('Консультація: кнопка «← Первинний огляд»', !$('backExam').hidden);
   set('k_main_sk','на кашель уночі'); ok('Консультація: скарги можна вписати тут', /Скарги на кашель уночі/.test(out()));
   set('k_main_sk',''); doc.querySelector('[data-mode="hosp"]').click(); w.eval("switchDoc('ohl')"); }
 { w.eval("DIARIES=[]; switchDoc('ohl')"); ap('pneu'); w.eval("F('e_per.per').d1.value='2026-09-01'; switchDoc('shch')");
   ok('Перший щоденник заповнюється і з датою надходження', /вологі хрипи/.test(out()), out().slice(0,200));
   const i=doc.querySelector('.ddt'); i.value='2026-09-04T10:00'; ev(i,'change');
   ok('Дата запису щоденника: обрана дата і день перебування за нею', /04\.09\.2026, 10:00/.test(out()) && /4-й день перебування/.test(out()), out().slice(0,200));
   w.eval("diaryFromExam(1)"); ok('Закріплена дата не міняється на сьогоднішню при заповненні', /04\.09\.2026/.test(out()));
   w.eval("saveDiary()"); ok('Після запису в журнал — наступний день', $('meta_dt').value.startsWith('2026-09-05'), $('meta_dt').value);
   const chips=[...doc.querySelectorAll('.stayc .chip.q')]; ok('Підстави № 1044 — кнопками з пунктами', chips.some(c=>/II\.6/.test(c.textContent)) && chips.some(c=>/III\.1/.test(c.textContent)));
   chips.find(c=>/I\.4/.test(c.textContent)).click();
   ok('Підстава з кнопки — з повною назвою Стандарту і пунктом', /затвердженого наказом МОЗ України від 30\.07\.2026 № 1044: .*погіршення стану, що потребує цілодобового медичного нагляду \(розд\. I, п\. 4\)/.test(w.eval("F('d_lik.osn').el.value")));
   w.eval("F('d_lik.osn').el.value=''; DIARIES=[]; update(); switchDoc('ohl')"); }
 { w.eval("switchDoc('ohl')"); ap('pneu'); w.eval("BLANK=true; BLP.exam=true; PAPER=true; renderPaper()");
   const rows=[...doc.querySelectorAll('#paper .b003 .brow')];
   rows.find(x=>/^Хрипи/.test(x.textContent.trim())).click(); ok('Клік по пункту бланка «Хрипи» відкриває «Дихання»', w.eval("TABS[active].id")==='dyh');
   rows.find(x=>/^33\. Скарги/.test(x.textContent.trim())).nextElementSibling.click(); ok('Клік по тексту під «33. Скарги» відкриває «Скарги»', w.eval("TABS[active].id")==='skarhy');
   rows.find(x=>/^А\/Т/.test(x.textContent.trim())).click(); ok('Клік по «А/Т» відкриває поля артеріального тиску у формі', w.eval("TABS[active].id")==='ssc' && !doc.querySelector('.bqe[aria-label="Внести дані в друкований бланк"]'));
   w.eval("BLANK=false; renderPaper()"); const sec=doc.querySelector('#paper [data-sec="dyh"]'); if (sec){ sec.click(); }
   ok('«Текст документа» на аркуші: клік по розділу відкриває його', !sec || w.eval("TABS[active].id")==='dyh');
   w.eval("PAPER=false; renderPaper()"); }
 // 0.9.3.10 зі Skiagrama: пацієнти, захист екрана, принтер; клікабельний банер
 { const mk=n=>{ w.eval('newPatient()'); set('meta_pib', n); ap('pneu'); w.eval('savePatient(true)'); };
   mk('Тест Видалення Один'); mk('Тест Видалення Два'); mk('Тест Видалення Три');
   const n0=w.eval('Object.keys(loadStore()).length');
   $('ptbar').click(); const dl=()=>doc.querySelector('.pmgr');
   ok('Пацієнти: список із фільтрами й видаленням', !!dl() && /У відділенні/.test(dl().textContent) && dl().querySelectorAll('.pmdel').length>=3);
   const b=dl().querySelector('.pmdel'); b.click(); b.click();
   ok('Пацієнти: 🗑 видаляє в кошик', w.eval('Object.keys(loadStore()).length')===n0-1 && w.eval('Object.keys(TRASH).length')>=1);
   const cbs=[...dl().querySelectorAll('.pmrow input[type=checkbox]')]; cbs[0].click(); cbs[1].click();
   const bd=[...dl().querySelectorAll('.pmbar button')].find(x=>/Видалити вибраних \(2\)/.test(x.textContent));
   ok('Пацієнти: вибір кількох — «Видалити вибраних (2)»', !!bd); bd.click(); [...dl().querySelectorAll('.pmbar button')].find(x=>/Точно/.test(x.textContent)).click();
   ok('Пацієнти: вибраних видалено разом', w.eval('Object.keys(loadStore()).length')===n0-3);
   dl().remove(); }
 { ok('Захист екрана: налаштування і екран «Продовжити роботу»', !!$('set_lock') && !!$('lockScr'));
   w.eval('lockNow()'); ok('Захист екрана ховає дані', !$('lockScr').hidden); $('lockGo').click(); ok('«Продовжити роботу» повертає', $('lockScr').hidden);
   ok('Папір і принтер: підшивка, зсув, пробний аркуш', !!doc.querySelector('.paperctl') && /Пробний аркуш/.test(doc.querySelector('.paperctl').textContent)); }
 { w.eval("switchDoc('ohl')"); ap('pneu'); w.eval("switchDoc('shch')"); const c=[...doc.querySelectorAll('#ptline .pcol')].find(x=>/Діагноз/.test(x.textContent));
   c.click(); ok('Банер: клік по діагнозу відкриває діагноз у первинному огляді', w.eval('DOC')==='ohl' && w.eval('TABS[active].id')==='dx'); }
 // 0.9.3.11 зі Skiagrama, ч. 2
 { w.eval("switchDoc('ohl')"); ap('pneu'); w.eval('pvOpen()');
   ok('Перегляд перед друком на весь екран: аркуш, бланк, папір і принтер, друк', !!doc.querySelector('.pvfull .sheet') && /Папір і принтер/.test(doc.querySelector('.pvside').textContent) && /Друк/.test(doc.querySelector('.pvtop').textContent));
   w.eval('pvClose()'); ok('Перегляд закривається', !doc.querySelector('.pvfull'));
   ok('Журнал дій: події записуються без ПІБ', w.eval("ALOG.length>0 && ALOG.every(a=>!/Тест/.test(a.t+a.d))"), w.eval("JSON.stringify(ALOG.slice(-3))"));
   ok('Журнал дій у Налаштуваннях', !!doc.querySelector('.alog'));
   const S=w.eval("SECTIONS.find(s=>s.id==='skarhy').panel.querySelector('.pencil')"); ok('Олівець ✎ у розділі', !!S);
   w.eval("show(TABS.findIndex(t=>t.id==='skarhy'))"); S.click(); const ch=w.eval("F('skarhy.c').chips[2]"); const was=ch.getAttribute('aria-pressed'); ch.click();
   const ta=doc.querySelector('.pened textarea'); ok('✎: натискання кнопки відкриває правку', !!ta);
   if (ta){ ta.value='слабкість (змінено)'; [...doc.querySelectorAll('.pened button')].find(b=>b.textContent==='Зберегти').click(); }
   ok('✎: змінений текст кнопки збережено, вибір не змінився', /змінено/.test(ch.textContent) && ch.getAttribute('aria-pressed')===was, ch.textContent);
   w.eval("setOvr('skarhy.c', O(F('skarhy.c').opts[2]).t, '')"); S.click();
   ok('Пакет фраз: кнопка «Пакет із підписом автора…»', [...doc.querySelectorAll('button')].some(b=>/Пакет із підписом автора/.test(b.textContent)));
   w.eval("localStorage.removeItem('po.usb'); localStorage.removeItem('po.usbLater'); renderToday()");
   ok('Нагадування: раз на тиждень копія на флешку', !!doc.querySelector('#bkBox .usb') || w.eval("Object.keys(loadStore()).length===0")); }
 { w.eval('newPatient()'); set('meta_pib','Повтор Тестовий Пацієнт'); ap('copd'); set('meta_dob','1950-05-05'); w.eval("F('e_per.per').d1.value='2026-01-10'; F('e_per.per').d2.value='2026-01-20'; update(); savePatient(true)");
   const old=w.eval('PID'); w.eval('newPatient()'); set('meta_pib','Повтор Тестовий Пацієнт'); await sleep(700);
   const lb=doc.querySelector('.lastbox'); ok('«Як минулого разу»: пропонує попередню госпіталізацію', lb && !lb.hidden && /уже був/.test(lb.textContent), lb && lb.textContent);
   if (lb) [...lb.querySelectorAll('button')].find(b=>/Як минулого разу/.test(b.textContent)).click();
   ok('«Як минулого разу»: дата народження й анамнез життя взято', $('meta_dob').value==='1950-05-05');
   const ids=Object.keys(w.eval('loadStore()')).slice(0,2); let pr=0; w.print=()=>{pr++};
   w.eval(`batchPrint(${JSON.stringify(ids)}, 'ohl')`); for(let i=0;i<60&&!pr;i++) await sleep(50);   // під навантаженням друк приходить пізніше
   ok('Друк пачкою: документи вибраних — у друк по одному на аркуш', $('print').querySelectorAll('.bprint-one').length===2 && pr===1, $('print').querySelectorAll('.bprint-one').length+'/'+pr);
   ok('Після друку пачкою — відкритий той самий пацієнт', $('meta_pib').value==='Повтор Тестовий Пацієнт'); }
 // ── частина 2 ──
 // 0.9.3.12 журнал обстежень розділами
 { w.eval('newPatient()'); set('meta_pib','Лаб Тестовий Пацієнт'); doc.querySelector('[data-sex="m"]').click(); ap('pneu'); w.eval("RES.length=0; switchDoc('epi'); labsOpen({test:'ЗАК'})");
   const t=doc.querySelector('.ljed textarea'); t.value='Hb 174 Ер 5,1 Л 12,4 ШОЕ 28 лімф 18'; ev(t,'input');
   const v=[...doc.querySelectorAll('.ljcell input')].map(i=>i.value);
   ok('Аналіз: рядок з МІС розкладено по клітинках', v[0]==='174' && v[1]==='5,1' && v[3]==='12,4' && v[7]==='18' && v[10]==='28', v.join('|'));
   [...doc.querySelectorAll('.ljed button')].find(b=>b.textContent==='Записати').click();
   ok('Аналіз записано в журнал з ↑↓', w.eval("RES.length")===1 && /лейк\. 12,4 ×10⁹\/л ↑/.test(w.eval("RES[0].v")) && /л 18 % ↓/.test(w.eval("RES[0].v")), w.eval("RES[0] && RES[0].v"));
   ok('Журнал: розділи з кількістю й таблиця динаміки', /Кров · 1/.test(doc.querySelector('.ljtabs').textContent) && !!doc.querySelector('.ljt'));
   ok('Епікриз: аналіз із журналу — у тексті', /ЗАК .*Hb 174/.test(out()), out().slice(0,800));
   w.eval("BLANK=true; BLP.e45=true; PAPER=true; renderPaper()"); const r46=doc.querySelector('#paper .bepi [data-fld="e_obs_z46"]');
   ok('Бланк епікризу: п. 46 — з журналу', r46 && /Hb 174/.test(r46.textContent));
   doc.querySelector('.ljdlg').remove(); doc.querySelector('#paper .bepi [data-fld="e_obs_z47"]').click();
   ok('Бланк: клік по п. 47 — вписати ЗАС клітинками', !!doc.querySelector('.ljdlg .ljed') && doc.querySelector('.ljed select').value==='ЗАС');
   doc.querySelector('.ljdlg').remove(); w.eval("BLANK=false; PAPER=false; renderPaper()");
   ok('Банер: «Обстеження» з кількістю', /Обстеження/.test(doc.querySelector('#ptline').textContent));
   { const d=w.eval("labDef('ЗАК (гематологічний аналізатор)')"), v=w.lParse(d,'WBC 4.64 10^9/L\nNeu# 3.11 10^9/L\nNeu% 67.0 %\nRBC 4.62 10^12/L\nHGB 151 g/L\nMCHC 345 g/L\nPLT 212 10^9/L\nMPV B 11.1 fL\nP-LCR 35.4 %');
     ok('Аналізатор крові: роздруківка WBC/Neu#/HGB/MPV… розкладається по клітинках', v[0]==='4,64' && v[1]==='3,11' && v[6]==='67,0' && v[12]==='151' && v[16]==='345' && v[19]==='212' && v[20]==='11,1' && v[24]==='35,4', v.join('|'));
     const u=w.eval("labDef('ЗАС')"), z=w.lParse(u,'SG 1.005\nPH 7\nLEU 25 /µl *S\nNIT neg\nPRO neg\nGLU norm\nColor yellow');
     ok('Аналізатор сечі: SG 1.005 → 1005, neg/norm — словами', z[3]==='1005' && z[4]==='7' && z[5]==='негативно' && z[6]==='норма' && z[1]==='жовтий' && z[12]==='25', z.join('|'));
     ok('Аналізатор сечі: питома вага 1005 позначена ↓', /питома вага 1005 ↓/.test(w.lCompose(u,z))); }
   ok('Журнал обстежень — кнопка на головній сторінці й на телефоні', !!doc.querySelector('#sidecard .ljside') && !!$('mbLabs'));
   w.eval("ownLabDialog()"); const dl=doc.querySelector('.navsheet:last-of-type'); ok('Свій аналіз: діалог', !!doc.querySelector('.ownrow')); doc.querySelectorAll('.navsheet').forEach(x=>{ if (x.querySelector('.ownrow')) x.remove(); });
   w.eval("switchDoc('ohl')"); }
 // 0.9.3.15 безпечне автозаповнення
 { w.eval('newPatient()'); set('meta_pib','Авто Тестовий Пацієнт'); ap('pneu');
   const A=()=>w.eval('Object.keys(arevGet())');
   ok('Заготовка: розділи позначено «не переглянуто»', A().includes('dyh') && A().includes('skarhy') && A().includes('rxt'), A().join(','));
   ok('Непереглянуте — у «Перевірці»', w.eval("checkDoc().some(x=>/Органи дихання.*не переглянуто/.test(x.m))"));
   w.eval("show(TABS.findIndex(t=>t.id==='dyh'))"); const ab=w.eval("SECTIONS.find(s=>s.id==='dyh').panel.querySelector('.autobar')");
   ok('У розділі — банер і «✓ Переглянуто»', ab && !ab.hidden); ab.querySelector('.ab-ok').click();
   ok('«✓ Переглянуто» знімає позначку лише з цього розділу', !A().includes('dyh') && A().includes('ssc'));
   w.eval("AGATE=true"); let pr=0; w.print=()=>{pr++}; $('printBtn').click();
   ok('Друк з непереглянутим — спершу попередження', !!doc.querySelector('.agate') && pr===0);
   [...doc.querySelectorAll('.agate button')].find(b=>/Я перевірив/.test(b.textContent)).click();
   ok('«Я перевірив — продовжити» друкує й знімає позначки', pr===1 && A().length===0, pr+' '+A().join(','));
   w.eval("show(TABS.findIndex(t=>t.id==='dyh'))"); w.eval("(()=>{ const f=F('dyh.perk'); f.el.value='2'; mark(f.el,f); update(); })()");
   $('allNorm').click();
   ok('«Норма всюди» при ваших даних — питає, що робити', !!doc.querySelector('.agate') && /ваші дані/.test(doc.querySelector('.agate').textContent));
   [...doc.querySelectorAll('.agate button')].find(b=>/лише порожні/.test(b.textContent)).click();
   ok('«Заповнити лише порожні» — ваші дані лишились', w.eval("F('dyh.perk').el.value")==='2');
   w.eval("AGATE=false; newPatient()"); }
 // 0.9.3.16 перевірене відновлення
 { w.eval('newPatient()'); set('meta_pib','Копія Тестовий Пацієнт'); ap('pneu'); w.eval('savePatient(true)');
   const t=w.eval('bakSelfTest()'); ok('Самоперевірка: усі пацієнти зберігаються й відновлюються без втрат', t.n>0 && t.bad.length===0 && t.rep.ok, JSON.stringify({n:t.n,bad:t.bad.length}));
   let dump=null; { const B=w.Blob, cu=w.URL.createObjectURL, rv=w.URL.revokeObjectURL, ck=w.HTMLAnchorElement.prototype.click;
     w.Blob=function(parts){ w.__dump=parts[0]; }; w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{}; w.HTMLAnchorElement.prototype.click=function(){};
     try{ w.eval('exportAll()'); } finally { w.Blob=B; w.URL.createObjectURL=cu; w.URL.revokeObjectURL=rv; w.HTMLAnchorElement.prototype.click=ck; }
     try{ dump=JSON.parse(w.__dump); }catch(e){} }
   ok('Файл копії: версія програми й час', dump && dump.app===w.eval('VERSION') && dump.at>0);
   const R=w.eval('bakReport')(dump); ok('Перевірка копії: кількість пацієнтів і записів', R.ok && R.n===Object.keys(dump.items).length, JSON.stringify(R).slice(0,200));
   const bad=w.eval('bakReport')({type:'щось інше'}); ok('Перевірка копії: чужий файл — помилка, без змін', !bad.ok && bad.err.length>0);
   const id=w.eval('PID'); w.eval(`(()=>{ const st=loadStore(); delete st['${id}']; saveStore(st); })()`);
   w.eval('restoreFromObj')(dump, 'тест'); const b=[...doc.querySelectorAll('.navsheet button')].find(x=>/Додати нових/.test(x.textContent));
   ok('Відновлення: попередній перегляд «Нових пацієнтів: 1»', !!b && /Нових пацієнтів: 1\./.test(doc.querySelector('.navsheet:last-of-type').textContent));
   b.click(); await sleep(50); ok('Відновлення: пацієнта повернуто', !!w.eval(`loadStore()['${id}']`)); }
 // 0.9.3.17 PIN і шифрування
 { if (!w.TextEncoder){ w.TextEncoder=require('util').TextEncoder; w.TextDecoder=require('util').TextDecoder; } if (!w.crypto.subtle){ try{ Object.defineProperty(w.crypto, 'subtle', {value:require('crypto').webcrypto.subtle, configurable:true}); }catch(e){} }
   if (w.crypto.subtle){
     const r=await w.eval(`(async()=>{ const raw=crypto.getRandomValues(new Uint8Array(32)), cfg=await pinWrap('123456', raw); const k=await pinUnwrap('123456', cfg);
       const e=await encObj({name:'Секретний Пацієнт', x:[1,2]}, k); const d=await decObj(e, k); let bad=false; try{ await pinUnwrap('000000', cfg); }catch(x){ bad=true; }
       return {plain:JSON.stringify(e).includes('Секретний'), ok:d.name==='Секретний Пацієнт', bad, iter:cfg.iter}; })()`);
     ok('Шифрування: AES-GCM — у зашифрованому немає ПІБ, розшифровується ключем', !r.plain && r.ok, JSON.stringify(r));
     ok('Шифрування: неправильний PIN не відкриває ключ; PBKDF2 ≥ 300 000 ітерацій', r.bad && r.iter>=300000);
   }
   ok('PIN: блок у Налаштуваннях', !!doc.querySelector('.pinbox'));
   ok('PIN: поки не введено — запис відкритим текстом заборонено', w.eval("(()=>{ const c=PINC.cfg; PINC.cfg={v:1}; const b=pinBlocked(); PINC.cfg=c; return b; })()")); }
 { // 0.9.3.53: persistent backoff for every typed wrapper; config checksum is detectable tampering, not an HMAC.
   const r=JSON.parse(await w.eval(`(async()=>{
     const raw=crypto.getRandomValues(new Uint8Array(32)), cfg=await pinWrap('654321',raw), tag=await pinGuardTag(cfg), key=PIN_GUARD_PREFIX+tag;
     await pinGuardInit(cfg); const wrong=await pinUnwrap('incorrect',cfg).catch(e=>e.pinGate), afterWrong=JSON.parse(localStorage.getItem(key)); await pinGuardInit(cfg); let checked=0;
     const attempt=async now=>{try{await pinGuardCheck('incorrect',cfg,async()=>{checked++;throw Error('wrong')},now);return {code:'success'};}
       catch(e){return {code:e.pinGate,until:e.pinUntil||0};}};
     const first=[]; for(let i=0;i<5;i++) first.push(await attempt(1000000));
     const reload={tries:0,until:0}; PINC.tries=reload.tries; PINC.until=reload.until;
     const blocked=await attempt(1029999), n5=[]; for(let i=0;i<5;i++) n5.push(await attempt(1030000));
     const n10=[]; for(let i=0;i<5;i++) n10.push(await attempt(1330000));
     const lockedAfterReload=await attempt(1400000);
     const expired=await pinGuardCheck('correct',cfg,async()=>true,1630000), saved=JSON.parse(localStorage.getItem(key));
     let short=false; try{await pinWrap('1234',raw);}catch(e){short=e.pinGate==='short';}
     const other=await pinWrap('765432',raw), otherTag=await pinGuardTag(other); await pinGuardInit(other);
     await pinGuardCheck('wrong',other,async()=>{throw Error('wrong')},4000000).catch(()=>{});
     const ownAfter=JSON.parse(localStorage.getItem(key));
     const tamper=await pinWrap('987654',raw), tamperTag=await pinGuardTag(tamper), tamperKey=PIN_GUARD_PREFIX+tamperTag;
     await pinGuardInit(tamper); await pinGuardCheck('wrong',tamper,async()=>{throw Error('wrong')},5000000).catch(()=>{});
     const rec=JSON.parse(localStorage.getItem(tamperKey)); rec.failures=0; localStorage.setItem(tamperKey,JSON.stringify(rec));
     const edited=await pinGuardCheck('wrong',tamper,async()=>{throw Error('wrong')},5000001).catch(e=>({code:e.pinGate,until:e.pinUntil||0}));
     const primary=await pinWrap('112233',raw); await pinGuardInit(primary); localStorage.setItem('po.pin',JSON.stringify(primary)); PINC.cfg=primary;
     await pinGuardCheck('wrong',primary,async()=>{throw Error('wrong')},6000000).catch(()=>{});
     const legacyTag=await pinGuardTag(primary), legacyAttempts=JSON.parse(localStorage.getItem(PIN_GUARD_PREFIX+legacyTag)); delete primary.guard;
     localStorage.setItem('po.pin',JSON.stringify(primary)); PINC.cfg=primary;
     const migratedResults=await Promise.all([6000001,6000002].map(now=>pinGuardCheck('wrong',primary,async()=>{throw Error('wrong')},now).catch(e=>e.pinGate)));
     const migratedTag=await pinGuardTag(primary), migrated=JSON.parse(localStorage.getItem(PIN_GUARD_PREFIX+migratedTag)); PINC.cfg=null; localStorage.removeItem('po.pin');
     const missing=await pinWrap('223344',raw), missingTag=await pinGuardTag(missing); await pinGuardInit(missing); localStorage.setItem('po.pin',JSON.stringify(missing)); PINC.cfg=missing; localStorage.removeItem(PIN_GUARD_PREFIX+missingTag);
     const oldLog=logAct, logged=[]; logAct=(...args)=>logged.push(args[0]);
     const firstMissing=await pinGuardCheck('wrong',missing,async()=>{throw Error('wrong')},7000000).catch(e=>e.pinGate), missingState=JSON.parse(localStorage.getItem(PIN_GUARD_PREFIX+missingTag));
     logAct=oldLog; PINC.cfg=null; localStorage.removeItem('po.pin');
     const stored=await pinWrap('334455',raw), storedTag=await pinGuardTag(stored), storedKey=PIN_GUARD_PREFIX+storedTag; await pinGuardInit(stored);
     const storageProto=Object.getPrototypeOf(localStorage), originalSet=storageProto.setItem; storageProto.setItem=function(k,v){if(k===storedKey)throw Error('quota');return originalSet.call(this,k,v);};
     const oldWarn=console.warn; console.warn=()=>{};
     const resetError=await pinGuardCheck('334455',stored,async()=>true,8000000).catch(e=>e.pinGate);
     const failedStorage=await pinGuardCheck('wrong',stored,async()=>{throw Error('wrong')},8000001).catch(e=>({code:e.pinGate,until:e.pinUntil||0}));
     console.warn=oldWarn; storageProto.setItem=originalSet; PINC.tries=0; PINC.until=0;
     const legacySalt=crypto.getRandomValues(new Uint8Array(16)), legacyIv=crypto.getRandomValues(new Uint8Array(12)), legacyKek=await pinKEK('1234',legacySalt,PIN_ITER);
     const legacyCfg={v:1,salt:pb64(legacySalt),iter:PIN_ITER,iv:pb64(legacyIv),w:pb64(await crypto.subtle.encrypt({name:'AES-GCM',iv:legacyIv},legacyKek,raw))};
     const legacyKey=await pinUnwrap('1234',legacyCfg);
     return JSON.stringify({new:cfg.guard===1,short,first:first.map(x=>x.code),firstUntil:first[4].until,blocked, n5:n5.map(x=>x.code),n10:n10.map(x=>x.code),
       escalated:n5[4].until-1030000, escalated2:n10[4].until-1330000, reload:lockedAfterReload.code==='cooldown'&&lockedAfterReload.until>1400000,
       reset:saved.failures===0&&saved.until===0&&expired===true, other:otherTag!==tag&&ownAfter.failures===0, tamper:edited.code==='cooldown'&&edited.until-5000001===300000,
       unmark:migrated.failures===10&&migrated.until-6000001===300000&&primary.guard===1&&migratedResults.every(x=>x==='cooldown'),
       missing:firstMissing==='wrong'&&missingState.failures===1&&missingState.until===0&&logged.some(x=>/лічильник спроб PIN відсутній/i.test(x)),
       resetError:resetError===true&&failedStorage.code==='storage'&&failedStorage.until>8000001, legacy:!!legacyKey, wrapper:wrong==='wrong'&&afterWrong.failures===1});
   })()`));
   ok('Новий PIN: 6 символів; короткий новий PIN відхиляється',r.new&&r.short,JSON.stringify(r));
   ok('PIN: 5 спроб створюють 30-секундну паузу, яка переживає скидання пам’яті',r.first.every(x=>x==='wrong'||x==='cooldown')&&r.firstUntil===1030000&&r.blocked.code==='cooldown'&&r.reload,JSON.stringify(r));
   ok('PIN: після 5 хибних вводів пауза 30 с; після 10 і далі — 5 хвилин максимум',r.escalated===300000&&r.escalated2===300000,JSON.stringify(r));
   ok('PIN: правильний ввід скидає лічильник; інший файловий PIN має свій лічильник',r.reset&&r.other,JSON.stringify(r));
   ok('PIN: зміну лічильника й маркера виявлено; пауза після пошкодження — не довша за 5 хвилин',r.tamper&&r.unmark,JSON.stringify(r));
   ok('PIN: відсутній лічильник починається з нуля з подією в журналі; помилка сховища блокує лише після хибного PIN',r.missing&&r.resetError,JSON.stringify(r));
   ok('PIN: чинний 4-символьний конверт відкривається',r.legacy,JSON.stringify(r));
   ok('PIN: спільна перевірка pinUnwrap зберігає невдалу спробу',r.wrapper,JSON.stringify(r));
 }
 { // 0.9.3.53: UI показує тривалу паузу після п'ятої фактичної помилки.
   const r=JSON.parse(await w.eval(`(async()=>{ const oldCfg=PINC.cfg, oldJson=localStorage.getItem('po.pin'), oldTries=PINC.tries, oldUntil=PINC.until;
     const raw=crypto.getRandomValues(new Uint8Array(32)), cfg=await pinWrap('445566',raw); PINC.cfg=cfg; localStorage.setItem('po.pin',JSON.stringify(cfg)); await pinGuardInit(cfg); pinScreen('open',()=>{});
     const scr=document.querySelector('.pinscr'), inp=scr.querySelector('input'), btn=scr.querySelector('button'), msg=scr.querySelector('.pinmsg');
     for(let i=0;i<5;i++){ inp.value='000000'; btn.click(); for(let n=0;n<500 && msg.textContent==='Перевіряю…';n++) await new Promise(resolve=>setTimeout(resolve,10)); }
     const result={paused:/зачекайте \\d+ с/.test(msg.textContent),text:msg.textContent,persisted:JSON.parse(localStorage.getItem(PIN_GUARD_PREFIX+await pinGuardTag(cfg))).failures===5};
     scr.remove(); document.body.classList.remove('pinlocked'); await pinGuardForget(cfg); if(oldJson===null)localStorage.removeItem('po.pin');else localStorage.setItem('po.pin',oldJson);
     PINC.cfg=oldCfg;PINC.tries=oldTries;PINC.until=oldUntil;return JSON.stringify(result); })()`));
   ok('PIN: екран входу показує паузу після п’ятої хибної спроби',r.paused&&r.persisted,JSON.stringify(r));
 }
 { // 0.9.3.53: правильний PIN відкриває програму, навіть якщо лічильник не записується.
   const r=JSON.parse(await w.eval(`(async()=>{ const oldCfg=PINC.cfg, oldJson=localStorage.getItem('po.pin'), oldTries=PINC.tries, oldUntil=PINC.until;
     const raw=crypto.getRandomValues(new Uint8Array(32)), cfg=await pinWrap('556677',raw), tag=await pinGuardTag(cfg), key=PIN_GUARD_PREFIX+tag;
     PINC.cfg=cfg; localStorage.setItem('po.pin',JSON.stringify(cfg)); await pinGuardInit(cfg);
     const proto=Object.getPrototypeOf(localStorage), originalSet=proto.setItem, originalWarn=console.warn; let opened=false, warned=false;
     try{ proto.setItem=function(k,v){if(k===key)throw Error('quota');return originalSet.call(this,k,v);}; console.warn=(...a)=>{if(a[0]==='[PIN]')warned=true;}; pinScreen('open',()=>{opened=true;});
       const scr=document.querySelector('.pinscr'), inp=scr.querySelector('input'), btn=scr.querySelector('button'); inp.value='556677'; btn.click();
       for(let n=0;n<500 && document.querySelector('.pinscr');n++) await new Promise(resolve=>setTimeout(resolve,10));
       return JSON.stringify({opened,warned,unlocked:!document.body.classList.contains('pinlocked')&&!document.querySelector('.pinscr')});
     }finally{ proto.setItem=originalSet; console.warn=originalWarn; document.querySelectorAll('.pinscr').forEach(x=>x.remove()); document.body.classList.remove('pinlocked'); await pinGuardForget(cfg);
       if(oldJson===null)localStorage.removeItem('po.pin');else localStorage.setItem('po.pin',oldJson); PINC.cfg=oldCfg;PINC.tries=oldTries;PINC.until=oldUntil; }
   })()`));
   ok('PIN: правильний код відкриває програму, а помилка лічильника лише пишеться в журнал і попередження',r.opened&&r.unlocked&&r.warned,JSON.stringify(r));
 }
 // 0.9.4 оформлення «Д» і щоденник під хворобу
 { w.eval("switchDoc('ohl')"); ap('pneu'); set('meta_pib','Тестовий Пацієнт');
   ok('Оформлення: документи — вкладками в шапці', !!doc.querySelector('header.top .topdocs #docSeg'));
   const pc=doc.querySelector('#ptline .pcols').textContent;
   ok('Оформлення: банер пацієнта з ініціалами, діагнозом і кодом МКХ-10', doc.querySelector('#ptline .pava').textContent==='ТП' && /J18/.test(pc), pc);
   ok('Оформлення: еталонний шаблон і прогрес у бічній картці', /Негоспітальна пневмонія/.test($('sidecard').textContent) && /Заповнено/.test($('sidecard').textContent), $('sidecard').textContent);
   const r=w.eval("(()=>{ const s=SECTIONS.find(x=>x.id==='dyh'), f=F('dyh.hr'); f.el.value=''; mark(f.el,f); update(); const b=s.tplBtn, vis=!b.hidden; b.click(); return [vis, val(F('dyh.hr'),true)] })()");
   ok('«За шаблоном» заповнює лише поточний розділ', r[0] && /вологі/.test(r[1]), JSON.stringify(r)); }
   { const ob=$('outBox'), tb=[...ob.querySelectorAll('.otabs button')];
     ok('Панель тексту: вкладки «Текст · Перевірка · Перед друком»', tb.map(b=>b.textContent.replace(/\d+|✓/g,'').trim()).join('|')==='Текст|Перевірка|Перед друком', tb.map(b=>b.textContent).join('|'));
     ok('Панель тексту: «Копіювати», «Друк», «Зберегти» — унизу', !!ob.querySelector('.ofoot #copy') && !!ob.querySelector('.ofoot #printBtn') && !!ob.querySelector('.ofoot .savewrap'));
     const dl=$('downloadMenu'), dlb=$('saveBtn'), fm=ob.querySelector('.fmt'), fmt=$('fmtBtn');
     const names=[...dl.querySelectorAll('button')].map(b=>b.querySelector('b')?.textContent);
     ok('Дії документа: копіювання, друк і завантаження; кнопки перед друком та ШІ не перевантажують панель', !!ob.querySelector('.ofoot #copy') && !!ob.querySelector('.ofoot #printBtn') && !!ob.querySelector('.ofoot #saveBtn') && $('paperBtn').hidden && $('aiBtn').hidden);
     ok('Завантаження: Word і LibreOffice, без дублювального пункту PDF', dlb.textContent==='Завантажити ▾' && names.join('|')==='Word|LibreOffice');
     dlb.focus(); dlb.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
     ok('Завантаження: стрілка відкриває список і переводить фокус на Word', !dl.hidden && dlb.getAttribute('aria-expanded')==='true' && doc.activeElement===dl.querySelector('button'), JSON.stringify({hidden:dl.hidden,expanded:dlb.getAttribute('aria-expanded'),active:doc.activeElement.id,first:dl.querySelector('button')?.textContent}));
     dl.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
     ok('Завантаження: Escape закриває список і повертає фокус', dl.hidden && doc.activeElement===dlb);
     $('out').focus();
     ok('Aa: видно лише з фокусом у редакторі; панель спершу згорнута', !fmt.hidden && fm.hidden && ob.dataset.manualEditing==='true');
     fmt.click(); ok('Aa: форматування відкривається на запит', !fm.hidden && fmt.getAttribute('aria-pressed')==='true');
     doc.body.tabIndex=-1; doc.body.focus(); await sleep(0);
     ok('Aa: форматування й перемикач ховаються після виходу з ручної правки', fm.hidden && fmt.hidden && ob.dataset.manualEditing==='false');
     tb[1].click(); ok('Вкладка «Перевірка»: список зауважень замість тексту, число — на вкладці', ob.dataset.ov==='chk' && $('chk').open && /\d/.test(tb[1].textContent));
     tb[2].click(); ok('Вкладка «Перед друком» вмикає аркуш', w.eval('PAPER')===true && ob.dataset.ov==='paper');
     tb[0].click(); ok('Вкладка «Текст» повертає текст', w.eval('PAPER')===false && ob.dataset.ov==='text' && !$('out').hidden); }
 { w.eval("DIARIES=[]; curKey=null; SECTIONS.filter(s=>s.objective||s.id==='skarhy').forEach(s=>clearSection(s)); switchDoc('ohl'); switchDoc('shch')");
   ok('Щоденник без огляду й хвороби — форма питає хворобу', /Для якої хвороби щоденник/.test($('dsrc').textContent), $('dsrc').textContent.slice(0,120));
   w.eval("pickDiaryDisease('hf')");
   ok('Щоденник за хворобою: заповнено з еталонного шаблону', /Щоденник/.test(out()) && /набряки/i.test(out()), out().slice(0,300));
   const vis=id=>!w.eval(`F('d_obj.${id}').wrapEl.hidden`);
   ok('Щоденник під ХСН: маса й діурез, живіт (базовий набір, рішення лікаря 25.10.2026), печінка — показано; глікемію сховано', vis('masa') && vis('zhyv') && vis('pech') && !vis('glik'));
   ok('Щоденник під ХСН: обов’язкові пункти позначено «важливо»', w.eval("F('d_obj.masa').wrapEl.classList.contains('dneed')"));
   ok('Підказка щоденника: що щодня внести', w.eval("diaryHints().some(x=>/щодня внесіть/.test(x))"));
   set('d_obj_masa_0','82'); set('d_obj_masa_1','1400'); ok('Маса тіла й діурез — у тексті щоденника', /Маса тіла 82 кг, діурез 1400 мл\/добу/.test(out()), out());
   w.eval("DSHOWALL=true; update()"); ok('«Показати всі пункти» повертає сховане', vis('zhyv'));
   w.eval("DSHOWALL=false; update(); switchDoc('ohl')"); }
 { // 0.9.3.18: знахідки наскрізного аудиту
   w.eval("switchDoc('ohl')"); set('meta_dt','2026-10-18T09:30'); w.eval("update()");
   w.eval("switchDoc('shch'); switchDoc('ohl')");
   ok('Дата первинного огляду не замінюється на «зараз» після перемикання документів', $('meta_dt').value==='2026-10-18T09:30' && /18\.10\.2026, 09:30/.test(out()), $('meta_dt').value+' | '+out().slice(0,40));
   const S=w.eval("JSON.stringify(snap())"); w.eval("(()=>{ const s=snap(); clearAll(); restore(s); switchDoc('shch'); switchDoc('ohl'); })()");
   ok('Дата огляду зберігається з пацієнтом (snap.dts) і повертається після відкриття', JSON.parse(S).dts && JSON.parse(S).dts.ohl==='2026-10-18T09:30' && $('meta_dt').value==='2026-10-18T09:30', $('meta_dt').value);
   ok('Кнопка «Записати в журнал» на панелі тексту — лише в щоденнику', w.eval("switchDoc('ohl'); document.getElementById('dSaveTop').hidden") && w.eval("switchDoc('shch'); !document.getElementById('dSaveTop').hidden"));
   w.eval("switchDoc('epi'); F('e_per.per').d1.value='2026-10-21'; F('e_per.per').d2.value='2026-10-20'; update()");
   ok('Перевірка: дата виписки раніше за надходження', w.eval("checkDoc().some(x=>/раніше за дату надходження/.test(x.m))"));
   w.eval("F('e_per.per').d1.value=''; F('e_per.per').d2.value=''; switchDoc('ohl')"); }
 { // 0.9.3.19: SCORE2 / SCORE2-OP і PESI / sPESI
   const C=id=>w.eval(`(()=>{ const c=CALCS.find(x=>x.id==='${id}'); return JSON.stringify(c.run(c)); })()`), J=id=>JSON.parse(C(id));
   const pt=(k,v)=>{ const e=$('pt_'+k); e.value=v; ev(e,'input'); };
   w.eval("document.querySelector('#sexSeg button[data-sex=\"m\"]').click()");
   ['age','sbp','chol','hdl','hr','rr','t','spo'].forEach(k=>pt(k,''));
   pt('age','60'); pt('sbp','120'); pt('chol','6'); pt('hdl','1,3');
   let r=J('score2'); ok('SCORE2: чоловік 60, САТ 120, ХС 6, ЛПВЩ 1,3, не курить → 11,7% (дуже високий регіон)', r.score==='11,7%' && /дуже високий/.test(r.text), C('score2'));
   w.eval("document.getElementById('c_score2_smk').checked=true"); r=J('score2'); ok('SCORE2: куріння підвищує ризик', parseFloat(r.score.replace(',','.'))>11.7, r.score);
   w.eval("document.getElementById('c_score2_smk').checked=false");
   pt('age','75'); pt('sbp','150'); pt('hdl','1,4'); r=J('score2'); ok('SCORE2-OP для віку ≥ 70', /SCORE2-OP/.test(r.text) && /%$/.test(r.score), C('score2'));
   pt('age','35'); ok('SCORE2: поза віком 40–89 — пояснення', /40–69/.test(J('score2').msg||''));
   pt('age','60'); w.eval("document.getElementById('c_score2_dm').checked=true"); ok('SCORE2: при ЦД — відсилає до SCORE2-Diabetes', /SCORE2-Diabetes/.test(J('score2').msg||''));
   w.eval("document.getElementById('c_score2_dm').checked=false");
   pt('sbp','120'); pt('chol',''); pt('hdl',''); ok('SCORE2: без ліпідограми — просить холестерин', /холестерин/i.test(J('score2').msg||''), C('score2'));
   w.eval("RES.push({id:9901, d:'2026-10-19', t:'ліпідограма', v:'', vals:['6,0','3,1','1,3','1,5']})");
   ok('SCORE2: холестерин і ЛПВЩ беруться з журналу обстежень', J('score2').score==='11,7%', C('score2'));
   w.eval("RES=RES.filter(x=>x.id!==9901)");
   pt('age','70'); pt('hr','115'); pt('sbp','95'); pt('rr','22'); pt('t','36,6'); pt('spo','88');
   w.eval("document.getElementById('c_pesi_ca').checked=true");
   r=J('pesi'); ok('PESI: 70 р., чол., рак, ЧСС 115, САТ 95, SpO2 88 → 180 б., клас V; sPESI 4', r.score==='180 б. · V' && /sPESI 4/.test(r.text), C('pesi'));
   ok('PESI без шоку й маркерів ПШ — проміжний-низький', /проміжний-низький/.test(r.text));
   w.eval("document.getElementById('c_pesi_rv').checked=true; document.getElementById('c_pesi_trop').checked=true"); ok('PESI + дисфункція ПШ і тропонін — проміжний-високий', /проміжний-високий/.test(J('pesi').text));
   w.eval("document.getElementById('c_pesi_shock').checked=true"); ok('PESI + гемодинамічна нестабільність — високий', /— високий/.test(J('pesi').text));
   w.eval("['ca','rv','trop','shock'].forEach(k=>document.getElementById('c_pesi_'+k).checked=false)");
   pt('age','45'); w.eval("document.querySelector('#sexSeg button[data-sex=\"f\"]').click()"); pt('hr','80'); pt('sbp','125'); pt('spo','97');
   r=J('pesi'); ok('PESI: жінка 45 р. без ознак → клас I, sPESI 0, низький ризик', r.score==='45 б. · I' && /sPESI 0/.test(r.text) && /низький/.test(r.text), C('pesi'));
   ['age','sbp','chol','hdl','hr','rr','t','spo'].forEach(k=>pt(k,'')); }
 { // 0.9.3.20: перевірка клінічного вмісту, налаштувати під себе, телефон
   const cats=JSON.parse(w.eval("JSON.stringify(vItems().reduce((a,x)=>(a[x.cat]=(a[x.cat]||0)+1,a),{}))"));
   ok('Перевірка: є шаблони, схеми, критерії 1044, норми, препарати, шкали', ['tpl','rx','krit','norm','drug','calc'].every(k=>cats[k]>0), JSON.stringify(cats));
   w.eval("localStorage.removeItem('po.verify')");
   ok('Перевірка: без позначки — чернетка', w.eval("vOf('tpl:pneu').s")==='draft');
   w.eval("(()=>{ const it=vItems().find(x=>x.k==='tpl:pneu'); const V={}; V[it.k]={h:it.h,by:'Тест Т. Т.',at:Date.now()}; vSave(V); })()");
   ok('Перевірка: позначка «перевірено»', w.eval("vOf('tpl:pneu').s")==='ok');
   w.eval("PRESETS.find(x=>x.key==='pneu').plan.push('__тест__')");
   ok('Перевірка: вміст змінився — «змінено після перевірки»', w.eval("vOf('tpl:pneu').s")==='changed');
   w.eval("PRESETS.find(x=>x.key==='pneu').plan.pop()");
   const doc=w.eval("vDocHTML('krit')");
   ok('Документ для звірки: критерії, підписи', /Критерії госпіталізації/.test(doc) && /Перевірив\(ла\)/.test(doc) && /Затверджую/.test(doc) && /Негоспітальна пневмонія/.test(doc));
   w.eval("localStorage.removeItem('po.verify')");
   ok('Налаштувати під себе: сторінка відкривається, 9 карток', w.eval("(()=>{ customizeOpen(); const n=document.querySelectorAll('.cusdlg .cuscard').length; document.querySelector('.cusdlg .nshead .btn').click(); return n; })()")===9);
   ok('Файли папки даних: зрозумілі назви', w.eval("FS_FILES({},{}).map(x=>x[0]).join('|')")==='Мої шаблони.json|Мої кнопки і фрази.json|Налаштування.json|Перевірка вмісту.json');
   ok('Свої аналізи не губляться при збереженні шаблонів', w.eval("(()=>{ CUSTOM.labs=[{t:'Тест-аналіз',g:'other',p:[{n:'x'}]}]; saveCustom(); const c=JSON.parse(localStorage.getItem('po.custom')); CUSTOM.labs=[]; saveCustom(); return !!(c.labs&&c.labs.length); })()"));
   ok('Телефон: кнопка документа в навігації розділів', w.eval("(()=>{ renderTabNav(); const b=document.querySelector('#tabnav .tn-doc'); return !!b && /Огляд/.test(b.textContent); })()"));
   ok('Налаштування: усі блоки згорнуті, «Про програму» в кінці', w.eval("(()=>{ const k=[...SETTINGS_EL.children]; return !k.some(x=>x.matches('h3.sub')) && k[k.length-1].matches('details.about'); })()")); }
 { // 0.9.3.21: бланк — дата/час, ПІБ; адреса полями
   const sv=(id,v)=>{ const e=$(id); e.value=v; ev(e,e.tagName==='SELECT'?'change':'input'); };
   sv('meta_addr_np_t','с.'); sv('meta_addr_np','Тестове'); sv('meta_addr_hr','Тестова сільська'); sv('meta_addr_ra','Тестовий'); sv('meta_addr_ob','Тестова'); sv('meta_addr_st','вул. Садова, 1'); sv('meta_addr_zip','37700');
   ok('Адреса складається з полів', $('meta_addr').value==='с. Тестове, Тестова сільська громада, Тестовий район, Тестова область, вул. Садова, 1', $('meta_addr').value);
   const t=w.eval("(()=>{ const b=b003Title ? b003Title() : null; return b ? b.textContent : ''; })()".replace('b003Title ? b003Title() : null', "null"));
   w.eval("clearAll()");
   ok('Новий пацієнт: адреса й місце роботи очищені', !$('meta_addr').value && !$('meta_addr_np').value && !$('meta_work').value); }
 { // 0.9.3.22: листи призначень за настановами
   const sheet=(k,m)=>w.eval(`(()=>{ MODE='${m}'; applyDoc(true); RX=[]; const p=PRESETS.find(x=>x.key==='${k}'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); update(); return JSON.stringify(RX.map(it=>[rxKind(it), it.drug, it.dose])); })()`);
   let r=JSON.parse(sheet('pneu','hosp'));
   ok('Пневмонія, стаціонар: режим, дієта, моніторинг, кисень за показаннями, антибіотики, ВТЕ', ['reg','diet'].every(k=>r.some(x=>x[0]===k)) && r.some(x=>/^Контроль АТ/.test(x[1])) && r.some(x=>/^Оксигенотерапія/.test(x[1])) && r.some(x=>x[1]==='Амоксицилін/клавуланат') && r.some(x=>x[1]==='Еноксапарин'), JSON.stringify(r));
   ok('Пневмонія: парацетамол 500–1000 мг', r.some(x=>x[1]==='Парацетамол' && x[2]==='500–1000 мг'));
   r=JSON.parse(sheet('pneu','amb')); ok('Пневмонія, амбулаторно: амоксицилін 1 г, без в/в і палатного режиму', r.some(x=>x[1]==='Амоксицилін' && x[2]==='1 г') && !r.some(x=>/палатний/.test(x[1])));
   ok('Пневмонія: є тяжкий варіант з гідрокортизоном і варіант з ризиком синьогнійної', w.eval("(()=>{ MODE='hosp'; const v=rxVariants(PRESETS.find(x=>x.key==='pneu')); return v.some(x=>/Тяжка/.test(x[0]) && x[1].some(r=>r[0]==='Гідрокортизон')) && v.some(x=>/синьогнійної/.test(x[0])); })()"));
   ok('ХОЗЛ амбулаторно: стабільні групи A/B/E за GOLD', w.eval("(()=>{ MODE='amb'; return rxVariants(PRESETS.find(x=>x.key==='copd')).filter(x=>/Стабільна/.test(x[0])).length; })()")===4);
   ok('Астма амбулаторно: кроки GINA', w.eval("(()=>{ MODE='amb'; return rxVariants(PRESETS.find(x=>x.key==='asthma')).filter(x=>/^Крок/.test(x[0])).length; })()")===4);
   ok('Нові хвороби: бронхоектази й ТЕЛА зі схемами', JSON.parse(sheet('bronx','hosp')).some(x=>x[1]==='Амоксицилін/клавуланат') && JSON.parse(sheet('pe','hosp')).some(x=>x[1]==='Апіксабан'));
   ok('ЦД у стаціонарі: інсулін, без метформіну в листі', (()=>{ const x=JSON.parse(sheet('dm','hosp')); return x.some(y=>y[1]==='Інсулін гларгін') && !x.some(y=>y[1]==='Метформін'); })());
   ok('Шкала Падуа: 3+3+1 (вік ≥ 70) = 7 — високий ризик', w.eval("(()=>{ const c=CALCS.find(x=>x.id==='padua'); document.getElementById('pt_age').value='75'; document.getElementById('c_padua_ca').checked=true; document.getElementById('c_padua_mob').checked=true; const r=c.run(c); document.getElementById('pt_age').value=''; document.getElementById('c_padua_ca').checked=false; document.getElementById('c_padua_mob').checked=false; return r.score; })()")==='7 б.');
   ok('Схеми підписані: стаціонар / амбулаторно', w.eval("(()=>{ MODE='amb'; applyDoc(true); const p=PRESETS.find(x=>x.key==='pneu'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); const b=rxVarBlock(); return b && /амбулаторно/.test(b.querySelector('h3').textContent); })()"));
   w.eval("MODE='hosp'; applyDoc(true); RX=[];"); }
 { // 0.9.3.23: коди МКХ-10 — пульмонологія
   const f=q=>w.eval(`JSON.stringify(codeSearch(${JSON.stringify(q)}, mkhList(), 5).map(r=>r[0]))`);
   ok('МКХ: J15.8 знаходиться за кодом', /"J15\.8"/.test(f('J15.8')), f('J15.8'));
   ok('МКХ: «синьогнійна» → J15.1', /"J15\.1"/.test(f('синьогнійна')), f('синьогнійна'));
   ok('МКХ: бронхоектази із загостренням J47.1, емпієма J86.9', /"J47\.1"/.test(f('бронхоектази загострення')) && /"J86\.9"/.test(f('емпієма')), f('бронхоектази загострення')+' '+f('емпієма')); }
 { // 0.9.3.24: ліжко-дні і форма 066/о
   ok('Ліжко-дні: 20.10–27.10 = 7; той самий день = 1; без дати виписки — порожньо', w.eval("bedDays('2026-10-20','2026-10-27')")===7 && w.eval("bedDays('2026-10-20','2026-10-20')")===1 && w.eval("bedDays('2026-10-20','')")==='');
   ok('Документ «Карта вибулого (ф. 066/о)» є серед документів стаціонару', w.eval("DOCMORE.hosp.some(d=>d[0]==='f066')"));
   const pg=w.eval("(()=>{ MODE='hosp'; applyDoc(true); switchDoc('f066'); F('e_per.per').d1.value='2026-10-20'; F('e_per.per').d2.value='2026-10-20'; F('e_lik.rez').el.value='1'; const P=b066(); const t=P.map(p=>p.textContent).join(' '); switchDoc('ohl'); F('e_per.per').d1.value=''; F('e_per.per').d2.value=''; F('e_lik.rez').el.value=''; return JSON.stringify([P.length, t]); })()");
   const [n,t]=JSON.parse(pg);
   ok('066/о: два аркуші, пункти 1–21, ліжко-дні за правилом', n===2 && /Карта хворого, який вибув із стаціонару/.test(t) && /16\. Проведено ліжко-днів\s*1\s*17\./.test(t) && /21\.\s*Інвалід війни/.test(t) && /19\. Хірургічні операції/.test(t), t.slice(0,200));
   ok('066/о: результат з епікризу «з покращенням» → код 2', /здоровий\(а\) – 7\s*\(підкреслити\)\s*2/.test(t)); }
 { // 0.9.3.24: направлення — лікар і заклад; код відділення
   const r=w.eval("(()=>{ MODE='hosp'; applyDoc(true); switchDoc('ohl'); F('morbi.hosp').el.value='0'; F('morbi.hospd').el.value='Іваненко А. А.'; F('morbi.hospz').el.value='АЗПСМ № 3'; F('morbi.hospe').el.value='12345678'; F('morbi.hospn').el.value='1111-2222'; document.getElementById('meta_vcode').value='63'; update(); const o=document.getElementById('out').textContent; const t=bTitle().textContent; ['hospd','hospz','hospe','hospn'].forEach(k=>F('morbi.'+k).el.value=''); F('morbi.hosp').el.value=''; document.getElementById('meta_vcode').value=''; update(); return JSON.stringify([o,t]); })()");
   const [o,t]=JSON.parse(r);
   ok('Направлення: лікар (з ініціалами), заклад, № — у тексті огляду', /сімейного лікаря Іваненко А\. А\. \(АЗПСМ № 3\), № 1111-2222/.test(o), (o.match(/сімейного лікаря.{0,60}/)||[''])[0]);
   ok('003/о: «Ким направлений» — заклад, лікар і ЄДРПОУ; код відділення в п. 11 і 12', /9\. Ким направлений хворий\s*АЗПСМ № 3, лікар Іваненко А\. А\.\s*12345678/.test(t) && /11\. Відділення при госпіталізації\s*63/.test(t), (t.match(/9\. Ким.{0,80}/)||[''])[0]); }
 { // 0.9.3.25: 066/о — дві редакції
   const r=w.eval("(()=>{ MODE='hosp'; applyDoc(true); switchDoc('f066'); F('e_per.per').d1.value='2026-10-20'; F('e_per.per').d2.value='2026-10-27'; F('s066.ops').el.value='21.10.2026 11:00; 38415-00; Плевральна пункція; Петренко П. П.; місцева; —; без ускладнень'; F066ED='2012'; const a=b066().map(p=>p.textContent).join(' '); F066ED='2016'; const b=b066().map(p=>p.textContent).join(' '); const t=DOCTITLES.f066; F066ED='2012'; F('s066.ops').el.value=''; F('e_per.per').d1.value=''; F('e_per.per').d2.value=''; switchDoc('ohl'); return JSON.stringify([a,b,t]); })()");
   const [a,b,t]=JSON.parse(r);
   ok('066/о ред. 2012: «Карта хворого», п. 16 ліжко-дні, операція з кодом у дужках', /Карта хворого, який вибув/.test(a) && /Плевральна пункція \(38415-00\)/.test(a), a.slice(0,120));
   ok('066/о ред. 2016: «Карта пацієнта», пп. 6, 9, 17.1, 21.1, 27, 28; код анестезії «місцева» → 2', /КАРТА ПАЦІЄНТА, ЯКИЙ ВИБУВ/.test(b) && /6\.\s*Громадянство/.test(b) && /17\.1\./.test(b) && /21\.1\./.test(b) && /27\.\s*Обстеження органів грудної порожнини/.test(b) && /Плевральна пункціяПетренко П\. П\.2/.test(b), b.slice(0,120));
   ok('Назва документа відповідає редакції', t==='КАРТА ПАЦІЄНТА, ЯКИЙ ВИБУВ ІЗ СТАЦІОНАРУ'); }
 { // 0.9.3.27: бланк 003/о — пп. 37–39, клік по обстеженнях, аркуш іде за змінами
   const r=w.eval("(()=>{ MODE='hosp'; applyDoc(true); switchDoc('ohl'); F('shk.kor').el.value='0'; F('shk.ped').el.value='1'; F('shk.rezh').el.value='0'; update(); const t=bExam().map(p=>p.textContent).join(' '); F('shk.kor').el.value=''; F('shk.ped').el.value=''; F('shk.rezh').el.value=''; return t; })()");
   ok('003/о пп. 37–39 заповнюються з полів', /37\. Огляд на коросту:\s*так – 1;\s*ні – 2\s*1/.test(r) && /38\. Огляд на педикульоз:\s*так – 1;\s*ні – 2\s*2/.test(r) && /39\. З режимом дня[^:]*:\s*так – 1;\s*ні – 2\s*1/.test(r), (r.match(/38\..{0,140}/)||[''])[0]);
   ok('Клік по 37/38/39 і «КОНСУЛЬТАЦІЯ» веде до полів', w.eval("['37. Огляд на коросту','38. Огляд на педикульоз','39. З режимом дня','КОНСУЛЬТАЦІЯ'].map(t=>(BMAP.find(([re])=>re.test(t))||[])[1]).join(',')")==='shk.kor,shk.ped,shk.rezh,dx.plan#Консультації');
   const t2=w.eval("(()=>{ F('dx.plano').el.value='RW; кал на я/глист'; update(); const t=bExam().map(p=>p.textContent).join(' '); const o=document.getElementById('out').textContent; F('dx.plano').el.value=''; update(); return JSON.stringify([t,o]); })()");
   const [bt,ot]=JSON.parse(t2);
   ok('Інші обстеження: у тексті плану', /кал на я\/глист/.test(ot), (ot.match(/План обстеження:[^\n]{0,160}/)||[''])[0]); }
 { const rr=JSON.parse(w.eval("(()=>{ const s=document.getElementById('meta_vcode'); const tag=s.tagName; s.value='63'; MODE='hosp'; applyDoc(true); switchDoc('f066'); F('s066.prof').el.value=''; const t=b066().map(p=>p.textContent).join(' '); s.value=''; switchDoc('ohl'); return JSON.stringify([tag==='SELECT' && /10\\. Профіль ліжок\\s*терапевтичний/.test(t) && DEPT.length>=80, (t.match(/10\. Профіль.{0,30}/)||['?'+F066ED+'|'+t.slice(0,80)])[0]]); })()")); ok('Код відділення — список; профіль ліжок за кодом (63 → терапевтичний)', rr[0], rr[1]); }
 { // 0.9.3.28: огляд анестезіолога (ф. 003-3/о) і консультація анестезіолога
   ok('Документ «Анестезіолог» — у стаціонарі й амбулаторно', w.eval("DOCMORE.hosp.concat(DOCLIST.hosp).some(d=>d[0]==='anes') && DOCMORE.amb.concat(DOCLIST.amb).some(d=>d[0]==='anes')"));
   const r=w.eval(`(()=>{ MODE='hosp'; applyDoc(true); switchDoc('anes'); const sv=(k,i)=>{ F(k).el.value=String(i); }; const tx=(k,v)=>{ F(k).el.value=v; };
     clearSection(SECTIONS.find(x=>x.id==='an_pun')); clearSection(SECTIONS.find(x=>x.id==='an_prot')); const emptyProtocol=b333c(), transferRow=emptyProtocol.querySelector('[data-an="an_prot.per"]');
     const noPuncture=!/Протокол пункції|в асептичних умовах/.test(emptyProtocol.textContent), noDefaultTransfer=!!transferRow && !/до палати відділення/.test(transferRow.textContent) && !transferRow.querySelector('.bf')?.textContent.trim(), blankSignature=!!emptyProtocol.querySelector('.brow[data-an="an_zak.anest"]');
     sv('an_main.tip',0); tx('an_main.oper','лапароскопічна холецистектомія'); sv('an_obj.mal',2); sv('an_obj.sheya',1); sv('an_zak.asa',1); sv('an_zak.e',0); sv('an_zak.vg',1); sv('zah.stan',0); sv('vitae.zv',1);
     sv('an_prot.dsh',0); F('an_prot.int').inputs[0].value='7,5'; sv('an_pun.prost',0); tx('an_pun.riv','L3–L4'); tx('an_pun.osn','бупівакаїн 0,5% 3 мл'); update();
     const o=document.getElementById('out').textContent, fc=formCode(), P=b333(), t=P.map(p=>p.textContent).join(' '), hint=F('an_obj.hint').abox.textContent, signature=P.find(p=>p.classList.contains('b333c'))?.querySelector('.brow[data-an="an_zak.anest"]');
     MODE='amb'; applyDoc(true); update(); const oa=document.getElementById('out').textContent, fa=formCode();
     MODE='hosp'; applyDoc(true); clearSection(SECTIONS.find(x=>x.id==='an_main')); ['an_obj','an_zak','an_prot','an_pun'].forEach(id=>clearSection(SECTIONS.find(x=>x.id===id))); F('zah.stan').el.value=''; F('vitae.zv').el.value=''; switchDoc('ohl'); update();
     return JSON.stringify([o,fc,P.length,t,hint,oa,fa,noPuncture,noDefaultTransfer,blankSignature,!!signature]); })()`);
   const [o,fc,n,t,hint,oa,fa,noPuncture,noDefaultTransfer,blankSignature,signature]=JSON.parse(r);
   ok('Анестезіолог (стаціонар): текст — привід, Маллампаті, ASA IIE, вид анестезії, протоколи', /готується до планового оперативного лікування/.test(o) && /Клас за Маллампаті III/.test(o) && /ASA IIE/.test(o) && /інгаляційний наркоз з ШВЛ/.test(o) && /Протокол знеболення/.test(o) && /трубка № 7,5/.test(o) && /субарахноїдального простору/.test(o), [/Клас за Маллампаті III/.test(o),/ASA IIE/.test(o),/інгаляційний наркоз з ШВЛ/.test(o),/Протокол знеболення/.test(o),/трубка № 7,5/.test(o),/субарахноїдального простору/.test(o)].join()+' '+(o.match(/Висновок.{0,200}/)||[''])[0]);
   ok('Анестезіолог: форма 003-3/о, три аркуші бланка', fc==='003-3/о' && n===3 && /№ 003-3\/о/.test(t) && /ПЕРЕДОПЕРАЦІЙНИЙ ОГЛЯД АНЕСТЕЗІОЛОГОМ ТА ПРОТОКОЛ ЗАГАЛЬНОГО ЗНЕБОЛЕННЯ/.test(t) && /Листок знеболення/.test(t) && /ПРОТОКОЛ ЗНЕБОЛЕННЯ №/.test(t), t.slice(0,160));
   ok('Бланк 003-3/о: вибране позначено «●» (планового, Маллампаті III, ASA II, Е, паління так)', /●\s*III/.test(t) && /●\s*II/.test(t) && /●\s*Е \(ургентне/.test(t) && /Паління:\s*●\s*так/.test(t), (t.match(/Клас за Маллампаті.{0,40}/)||[''])[0]);
   ok('Підказка: можливі труднощі з дихальними шляхами (Маллампаті III, коротка шия)', /Маллампаті III, коротка шия/.test(hint), hint);
   ok('Амбулаторно: консультаційний висновок (028/о), без протоколу знеболення', fa==='028/о' && /КОНСУЛЬТАЦІЙНИЙ ВИСНОВОК АНЕСТЕЗІОЛОГА/.test(oa) && !/Протокол знеболення/.test(oa), oa.slice(0,200));
   ok('003-3/о: без даних не друкується протокол пункції та вигадане місце переведення', noPuncture && noDefaultTransfer, JSON.stringify([noPuncture,noDefaultTransfer]));
   ok('003-3/о: підпис анестезіолога залишається, навіть якщо даних пункції немає', blankSignature);
   ok('003-3/о: підпис у протоколі клікабельний і відкриває поле анестезіолога', signature); }
 { // 0.9.3.29: епікриз «як у лікарні», курси лікування, «Продовжити прийом», динаміка зі щоденників
   const r=w.eval(`(()=>{ MODE='hosp'; applyDoc(true); switchDoc('epi'); const P=F('e_per.per'); P.d1.value='2026-10-14'; P.d2.value='2026-10-20';
     const rx0=RX.slice(), di0=DIARIES.slice(); RX.length=0; DIARIES.length=0;
     addRx({drug:'Цефтріаксон',dose:'2 г',route:'в/в',freq:'1 р/д',start:'2026-10-14',days:7}); addRx({drug:'Розчин Рінгера',dose:'400 мл',route:'в/в крапельно',freq:'1 р/д',start:'2026-10-14',days:3});
     addRx({drug:'Бісопролол',dose:'5 мг',route:'per os',freq:'1 р/д',start:'2026-10-14',hours:'8:00'}); addRx({drug:'Амоксицилін/клавуланат',dose:'875/125 мг',route:'per os',freq:'2 р/д',start:'2026-10-18',days:7});
     const D=(dt,t,s,di,hr,rr,sp)=>DIARIES.push({dt:dt+'T09:00',data:{f:{d_obj_t_0:t,d_obj_ad_0:s,d_obj_ad_1:di,d_obj_chss_0:hr,d_obj_chd_0:rr,d_obj_chd_1:sp},c:{}}});
     D('2026-10-15','38,6','135','85','96','24','92'); D('2026-10-17','36,8','125','80','78','18','96'); D('2026-10-20','36,6','120','80','72','16','98');
     F('e_per.vyg').el.value='3'; F('e_lik.rez').el.value='4'; update(); const o=document.getElementById('out').textContent;
     D('2026-10-20','38,0','120','80','110','26','95'); const u=unstableAtDischarge();
     F('e_per.vyg').el.value='0'; F('e_lik.rez').el.value=''; P.d1.value=''; P.d2.value=''; RX.length=0; rx0.forEach(x=>RX.push(x)); DIARIES.length=0; di0.forEach(x=>DIARIES.push(x)); switchDoc('ohl'); update();
     return JSON.stringify([o,u]); })()`);
   const [o,u]=JSON.parse(r);
   ok('Епікриз «як у лікарні»: пп. 1–11 і «Продовжити прийом»', /ЕПІКРИЗ/.test(o) && /1\. Прізвище/.test(o) && /9\. Лікування:/.test(o) && /11\. Рекомендовано:/.test(o) && /Продовжити прийом:/.test(o) && /проведено ліжко-днів: 6/.test(o), o.slice(0,200));
   ok('Лікування групами з курсами', /Антибактеріальна терапія: Цефтріаксон 2 г в\/в 1 р\/д — з 14\.10 по 20\.10 \(7 днів\)/.test(o) && /Інфузійна \(дезінтоксикаційна\) терапія: Розчин Рінгера[^;]*з 14\.10 по 16\.10 \(3 дні\)/.test(o), (o.match(/9\. Лікування:.{0,200}/)||[''])[0]);
   ok('Продовжити прийом: per os, не відмінене; в/в — ні', /Бісопролол 5 мг per os 1 р\/д о 8:00 — тривало/.test(o) && /Амоксицилін\/клавуланат[^\n]*ще 4 дні/.test(o) && !/Продовжити прийом:[\s\S]*Цефтріаксон/.test(o), (o.match(/Продовжити прийом:[\s\S]{0,200}/)||[''])[0]);
   ok('Динаміка й стан при виписці — зі щоденників; самовільно залишив', /температура тіла до 38,6 °C \(15\.10\), нормалізувалась з 17\.10/.test(o) && /SpO2 92 % → 98 %/.test(o) && /При виписці: Температура тіла 36,6 °C/.test(o) && /залишив/i.test(o), (o.match(/10\. Перебіг.{0,300}/)||[''])[0]);
   ok('Попередження: ≥ 2 ознаки нестабільності перед випискою', /t > 37,5/.test(u) && /ЧД ≥ 24/.test(u) && /ЧСС > 100/.test(u), u); }
 { // 0.9.3.30: ЧСС = пульс; поле «Пульс» — лише при аритмії
   const r=JSON.parse(w.eval(`(()=>{ MODE='hosp'; applyDoc(true); switchDoc('ohl'); const C=F('ssc.chss'), P=F('ssc.ps'), R=F('ssc.rytm');
     C.inputs[0].value='76'; P.inputs[0].value=''; R.el.value='0'; update(); const a=document.getElementById('out').textContent, hid=P.wrapEl.hidden;
     C.inputs[0].value='110'; P.inputs[0].value='92'; R.el.value='1'; update(); const b=document.getElementById('out').textContent, shown=!P.wrapEl.hidden;
     C.inputs[0].value=''; P.inputs[0].value=''; R.el.value=''; update(); return JSON.stringify([a,hid,b,shown]); })()`));
   ok('Ритм правильний: «ЧСС = пульс», поле «Пульс» сховано', /ЧСС = пульс 76 уд\.\/хв/.test(r[0]) && r[1]===true, (r[0].match(/ЧСС.{0,40}/)||[''])[0]);
   ok('Аритмія: ЧСС, пульс і дефіцит пульсу', /ЧСС 110 уд\.\/хв, пульс 92 уд\.\/хв, дефіцит пульсу 18/.test(r[2]) && r[3]===true && !/Пульс 92/.test(r[2]), (r[2].match(/ЧСС.{0,80}/)||[''])[0]); }
 { // 0.9.3.31: ергономіка
   w.eval("switchDoc('ohl')");
   const r=JSON.parse(w.eval(`(()=>{ const n=SECTIONS.reduce((a,s)=>a+s.fields.filter(f=>f.seg).length,0); const f=SECTIONS.flatMap(s=>s.fields).find(f=>f.seg && f.opts.length===6);
     const b=f.el.nextElementSibling; b.children[1].click(); const a=[n, f.el.value, b.children[1].getAttribute('aria-pressed'), b.querySelectorAll('.chip').length];
     b.children[1].click(); a.push(f.el.value); update(); return JSON.stringify(a); })()`));
   ok('Кнопки замість списків — і для 6 варіантів; повторне натискання знімає', r[0]>120 && r[1]==='1' && r[2]==='true' && r[3]===6 && r[4]==='', JSON.stringify(r));
   ok('Довгий список лишається списком', !w.eval("F('dyh.hr').seg"));
   const ac=w.eval(`(()=>{ const a=SECTIONS.find(s=>s.id==='dyh').panel.querySelector('.ph .acts2'); return [...a.children].filter(x=>x.tagName==='BUTTON'&&!x.hidden&&!x.classList.contains('tplsec')).map(x=>x.textContent).join('|')+'#'+[...a.querySelectorAll('.mmenu button')].map(x=>x.textContent).join('|'); })()`);
   ok('У заголовку вкладки — «Норма», решта під «⋯»', /^Норма#/.test(ac) && /Б\/о — одним рядком/.test(ac) && /Олівець/.test(ac) && w.document.querySelectorAll('#'+'tab-x .more-dd').length===0 && /Очистити вкладку/.test(ac), ac);
   const v=w.eval("vqApply('38,5 24 92 130/80 96').join('|')"); const o=out();
   ok('Показники одним рядком: t, ЧД, SpO2, АТ, ЧСС', /Температура тіла 38,5 °C/.test(o) && /ЧД 24 за хв, SpO2 92%/.test(o) && /АТ 130\/80/.test(o) && /пульс 96/.test(o), v);
   ok('Показники з мітками й перевірка меж', /АТ 150\/90/.test(w.eval("vqApply('ад 150/90 п 88').join('|')")) && /⚠ t 45/.test(w.eval("vqApply('t45').join('|')")));
   w.eval("['zah.temp','dyh.chd','ssc.ad','ssc.chss'].forEach(k=>F(k).inputs.forEach(i=>i.value='')); update()"); }
 { // 0.9.3.32: документ в окремому вікні
   const fr=doc.createElement('iframe'); doc.body.append(fr);
   const r=JSON.parse(w.eval(`(()=>{ const fw=document.querySelector('body>iframe:last-of-type').contentWindow; fw.scrollTo=()=>{}; POP.w=fw; popInit(fw); POP.mode='text'; switchDoc('ohl'); vqApply('37,9 22'); popRender();
     const a=[fw.document.querySelector('.pw-text') ? fw.document.querySelector('.pw-text').textContent : '']; POP.mode='paper'; popRender();
     a.push(!!fw.document.querySelector('#paper .sheet') && fw.document.querySelector('#paper .sheet').textContent.length); a.push(!!document.getElementById('popBtn'));
     const t=[...fw.document.querySelectorAll('#paper .sheet *')].find(x=>x.children.length===0 && /Перкуторно|ЧД \\d/.test(x.textContent)); if (t){ t.click(); } a.push(!!fw.document.querySelector('.pw-insert'));
     popInsertClose(); POP.mode='text'; POP.w=null; return JSON.stringify(a); })()`));
   ok('Окреме вікно: клік в «Аркуші» відкриває поле тут', r[3]===true, JSON.stringify(r).slice(0,200));
   ok('Окреме вікно: текст наживо, аркуш, кнопка ⧉', /37,9/.test(r[0]) && r[1]>50 && r[2]===true, JSON.stringify(r).slice(0,200));
   fr.remove(); w.eval("['zah.temp','dyh.chd'].forEach(k=>F(k).inputs.forEach(i=>i.value='')); update()"); }
 { // 0.9.3.34: однією сторінкою, підказ підстановки, швидка правка
   const r=JSON.parse(w.eval(`(()=>{ switchDoc('ohl'); goTab('zah'); const a=[document.body.classList.contains('onepage'), TABS.filter(t=>!t.panel.hidden).length];
     const f=SECTIONS.find(s=>s.id==='dyh').fields.find(x=>x.type!=='hdr' && !x.bo && val(x)); a.push(f ? qeField(SECTIONS.find(s=>s.id==='dyh'), document.querySelector('#out [data-sec="dyh"]').textContent, 30)===f || true : false);
     const d=document.querySelector('#out [data-sec="dyh"]'); qeOpen(f, 'dyh', d); a.push(!!document.querySelector('.qe') && f.wrapEl.parentElement.classList.contains('qe')); qeClose(); a.push(!document.querySelector('.qe') && !f.wrapEl.closest('.qe'));
     switchDoc('epi'); addRx({drug:'Цефтриаксон', dose:'1 г', route:'в/в', freq:'1 р/д', start:todayISO(), days:7}); update(); a.push(document.querySelectorAll('.ghost:not([hidden])').length); RX.pop(); update(); switchDoc('ohl'); return JSON.stringify(a); })()`));
   ok('Однією сторінкою: розділи огляду підряд', r[0]===true && r[1]>8, JSON.stringify(r));
   ok('Швидка правка поля з тексту: відкривається й повертає поле на місце', r[3]===true && r[4]===true, JSON.stringify(r));
   ok('Епікриз: порожні поля показують, що підтягнеться', r[5]>=1, JSON.stringify(r)); }
 { // 0.9.3.35: стани введення не змінюють медичний текст і не вгадують норму.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(); switchDoc('ohl'); const a=[], allergy=F('vitae.alerg'), lungs=SECTIONS.find(s=>s.id==='dyh');
     allergy.el.value=''; update(); a.push(allergy.entryStatus.textContent.includes('не заповнено'));
     allergy.el.value=String(allergy.norm); mark(allergy.el,allergy); update(); a.push(allergy.entryStatus.textContent.includes('норма'));
     allergy.el.value='1'; mark(allergy.el,allergy); update(); a.push(allergy.entryStatus.textContent.includes('є відхилення'));
     clearSection(lungs); update(); a.push(lungs.entryStatus.textContent.includes('не заповнено'));
     const bo=lungs.fields.find(f=>f.bo); bo.el.value='0'; update(); a.push(lungs.entryStatus.textContent.includes('норма'));
     const exam=F('dyh.ausk'); exam.el.value='1'; mark(exam.el,exam); update(); a.push(lungs.entryStatus.textContent.includes('є відхилення'));
     exam.el.value=''; bo.el.value=''; const vit=F('dyh.chd'); vit.inputs[0].value='16'; vit.inputs[1].value='97'; update(); a.push(vit.entryStatus.textContent.includes('норма'));
     vit.inputs[1].value='92'; update(); a.push(vit.entryStatus.textContent.includes('є відхилення'));
     vit.inputs[1].value=''; update(); a.push(vit.entryStatus.textContent.includes('частково') && !vit.entryStatus.textContent.includes('норма'));
     vit.inputs[0].value='abc'; update(); a.push(vit.entryStatus.textContent.includes('перевірте значення'));
     const text=F('vitae.alergx'); text.el.value='Перевірка введення'; update(); a.push(text.entryStatus.textContent.includes('заповнено') && !text.entryStatus.textContent.includes('норма'));
     const html=document.getElementById('out').innerHTML; entryRender(); a.push(html===document.getElementById('out').innerHTML && !/entry-status/.test(html));
     a.push((allergy.el.getAttribute('aria-describedby') || '').split(' ').includes(allergy.entryStatus.id));
     const before=document.querySelectorAll('.entry-status').length; entryRender(); entryRender(); a.push(document.querySelectorAll('.entry-status').length===before);
     restore(saved); return JSON.stringify(a); })()`));
   ok('Стани полів: алергії — порожньо, норма, відхилення', r.slice(0,3).every(Boolean), JSON.stringify(r));
   ok('Стани розділів: порожньо, Б/о, детальне відхилення має пріоритет', r.slice(3,6).every(Boolean), JSON.stringify(r));
   ok('Стани показників: норма, відхилення, часткове й некоректне введення', r.slice(6,10).every(Boolean), JSON.stringify(r));
   ok('Стани полів: довільний текст не оголошується нормою', r[10]===true);
   ok('Стани полів: не змінюють документ, доступні для читача екрана, не дублюються', r.slice(11).every(Boolean), JSON.stringify(r));
 }
 { // 0.9.3.36: прогрес і необов’язкові доповнення.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(); switchDoc('ohl'); const dt=document.getElementById('meta_dt'); dt.value=''; update(); const a=[progressRequired().some(x=>x.f==='meta_dt')];
     const next=document.querySelector('#progressNext button'); a.push(!!next && /Потрібно/.test(document.getElementById('progressNext').textContent)); next.click(); a.push(TABS[active].id==='meta');
     const f=F('skarhy.cx'); if(f){ f.el.value=''; update(); a.push(f.entryStatus.hidden); } else a.push(false);
     const sc=SECTIONS.find(s=>s.id==='dyh'); clearSection(sc); const b=sc.fields.find(f=>f.bo); F('dyh.ausk').el.value='0'; update(); a.push(b.entryStatus.hidden);
     F('dyh.ausk').el.value=''; update(); a.push(!b.entryStatus.hidden); restore(saved); return JSON.stringify(a); })()`));
   ok('Прогрес: важливі пропуски й перехід до поля', r.slice(0,3).every(Boolean), JSON.stringify(r));
   ok('Прогрес: необов’язкові порожні доповнення й Б/о не заважають', r.slice(3).every(Boolean), JSON.stringify(r));
 }
 { // 0.9.3.37: виклад перевірки не створює нових правил і не змінює документ.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(); switchDoc('ohl'); const out=document.getElementById('out'); out.innerHTML='<p>Перевірка інтерфейсу</p>'; document.getElementById('meta_pib').value=''; const html=out.innerHTML; renderCheck();
     const source=checkDoc(), shown=[...document.querySelectorAll('#copyPeek .copy-peek-item')]; const a=[shown.length===Math.min(2,source.length),shown.every((b,i)=>b.textContent===source[i].m),out.innerHTML===html];
     shown[0].click(); a.push(TABS[active].id===source[0].tab); out.innerHTML=''; renderCheck(); a.push(document.getElementById('copyPeek').hidden); restore(saved); return JSON.stringify(a); })()`));
   ok('Коротка перевірка: до двох наявних зауважень і перехід до поля', r.slice(0,4).every(Boolean),JSON.stringify(r));
   ok('Коротка перевірка: порожній документ не показує зауважень', r[4]===true);
 }
 { // 0.9.3.39: ручні правки зберігаються, заміна підтверджується й скасовується.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(), q0=QUICK, cf=window.confirm; CACHE={}; dirty=false; switchDoc('ohl'); const out=document.getElementById('out'), manual='<p><b>Ручні правки</b></p>', a=[];
     out.innerHTML=manual; out.dispatchEvent(new Event('input')); a.push(!document.getElementById('banner').hidden && /Є ручні зміни/.test(document.getElementById('banner').textContent));
     document.getElementById('quickBtn').click(); a.push(out.innerHTML===manual && dirty); document.getElementById('allNorm').click(); a.push(out.innerHTML===manual);
     applyPreset(PRESETS[0],HV.cards[0]); a.push(out.innerHTML===manual); switchDoc('rx'); const other='<p>Інший документ</p>'; out.innerHTML=other; out.dispatchEvent(new Event('input')); switchDoc('ohl'); a.push(out.innerHTML===manual); switchDoc('rx'); a.push(out.innerHTML===other); switchDoc('ohl');
     window.confirm=()=>false; document.getElementById('regen').click(); a.push(out.innerHTML===manual && dirty); window.confirm=()=>true; document.getElementById('regen').click(); a.push(out.innerHTML!==manual && !dirty); undoLast(); a.push(out.innerHTML===manual && dirty); applyDoc(true); a.push(out.innerHTML===manual && dirty);
     window.confirm=cf; QUICK=q0; localStorage.setItem('po.quick',q0?'1':'0'); restore(saved); return JSON.stringify(a); })()`));
   ok('Ручний текст: статус, швидкий режим, норма й шаблон не стирають правки',r.slice(0,4).every(Boolean),JSON.stringify(r));
   ok('Ручний текст: документи зберігають окремі правки',r.slice(4,6).every(Boolean),JSON.stringify(r));
   ok('Ручний текст: відмова, підтвердження, скасування й перебудова',r.slice(6).every(Boolean),JSON.stringify(r));
 }
 { // 0.9.3.38: пункти бланка щоденника
   const r=JSON.parse(w.eval(`(()=>{ switchDoc('shch'); const f=F('d_obj.perk'), l=F('d_obj.lv'); const a=[!!f && !!l, !/Перкуторно|Лімфатичні/.test(generate().plain)];
     f.el.value='1'; l.el.value='0'; update(); const t=generate().plain; a.push(/Перкуторно притуплення в нижніх відділах справа/.test(t) && /Лімфатичні вузли не збільшені/.test(t));
     const e={f:diaryFields().f, cur:true, dt:'2026-10-23T09:00'}; const el=bDiaryEntry(e); a.push(/притуплення в нижніх відділах справа/.test(el.textContent) && !!el.querySelector('[data-dsel="d_obj.perk"]'));
     f.el.value=''; l.el.value=''; update(); switchDoc('ohl'); return JSON.stringify(a); })()`));
   ok('Щоденник: «Перкуторно», «Лімфатичні вузли» тощо — поля, у тексті лише коли вибрано', r[0] && r[1] && r[2], JSON.stringify(r));
   ok('Бланк щоденника: рядок заповнюється і відкриває вибір', r[3]===true, JSON.stringify(r)); }
 { // 0.9.3.40: правка поточного щоденника біля рядка, без перенесення полів із форми.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(), paper=PAPER, blank=BLANK, params={...BLP}; DIARIES=[]; switchDoc('shch'); diaryReset(); PAPER=true;BLANK=true;BLP.fill=false;BLP.all=false;BLP.dn=1;update();renderPaper();const a=[], section=active;
     const before=F('d_obj.serce').el.value;diaryInlineAnchor('heart').click();DIARY_INLINE.box.querySelector('[data-value="1"]').click();
     a.push(active===section && F('d_obj.serce').el.value==='1' && !!DIARY_INLINE.box && document.querySelector('#paper .bcur').textContent.includes(O(F('d_obj.serce').opts[1]).t.split(',')[0]));
     DIARY_INLINE.box.querySelector('.diary-undo').click();a.push(F('d_obj.serce').el.value===before && !!DIARY_INLINE.box);
     const own=DIARY_INLINE.box.querySelector('[data-diary-source="d_obj_serce_own"]');own.value='Власне формулювання';own.dispatchEvent(new Event('input',{bubbles:true}));
     const snapshot=snap(), entry=diaryFields(), archive=bDiaryEntry({cur:false,f:entry.f});
     const plain={...entry.f};Object.keys(plain).filter(key=>key.endsWith('_own')).forEach(key=>plain[key]='');plain.d_main_svid='1';plain.d_obj_zhyv='3';const archived=bDiaryEntry({cur:false,f:plain});
     const legacy={...plain};Object.keys(legacy).filter(key=>key.endsWith('_own')).forEach(key=>delete legacy[key]);const archivedLegacy=bDiaryEntry({cur:false,f:legacy});
     diaryInlineClose();const pulseRow=document.querySelector('#paper .bdi.bcur .bdl>div[data-diary-key="pulse"]');pulseRow.click();const pulseOpens=DIARY_INLINE.key==='pulse'&&!!DIARY_INLINE.box;diaryInlineClose();
     a.push(snapshot.f.d_obj_serce_own==='Власне формулювання' && entry.f.d_obj_serce_own==='Власне формулювання' && archive.textContent.includes('Власне формулювання') && !archive.querySelector('[data-diary-key]') && /здутий, болючий/.test(archived.textContent) && !/свідомість не порушена|Живіт м’який|Реакція на огляд адекватна|раз на добу|оформлене/.test(archived.textContent.split(String.fromCharCode(160)).join(' ')) && /оглушення/.test(archivedLegacy.textContent) && /здутий, болючий/.test(archivedLegacy.textContent) && !/свідомість не порушена|Живіт м’який|Реакція на огляд адекватна|раз на добу|оформлене/.test(archivedLegacy.textContent.split(String.fromCharCode(160)).join(' ')) && pulseOpens);
     diaryInlineClose();clearAll(true);restore(snapshot);a.push(val(F('d_obj.serce'))==='Власне формулювання');
     diaryInlineOpen('pressure');const inputs=DIARY_INLINE.box.querySelectorAll('input');inputs[0].value='130';inputs[0].dispatchEvent(new Event('input',{bubbles:true}));inputs[1].value='80';inputs[1].dispatchEvent(new Event('input',{bubbles:true}));
     a.push(document.querySelector('#paper .bcur').textContent.includes('130/80'));inputs[1].dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));a.push(DIARY_INLINE.key==='breath');
     diaryInlineOpen('complaints');const text=DIARY_INLINE.box.querySelector('[data-diary-source="d_main_skx"]'), event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});text.dispatchEvent(event);a.push(!event.defaultPrevented && DIARY_INLINE.key==='complaints' && !!DIARY_INLINE.box.querySelector('input[type=search]'));
     const print=document.createElement('div');fillSheet(print,false);a.push(!/\\+ вибрати|\\+ вписати/.test(print.textContent) && !print.querySelector('.diary-inline-editor'));
     DIARY_MODE_BUTTON.click();const manual=DIARY_INLINE.manual && !PAPER;document.getElementById('out').insertAdjacentHTML('beforeend','<p>Ручний текст</p>');document.getElementById('out').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('out').click();DIARY_MODE_BUTTON.click();a.push(manual && PAPER && !DIARY_INLINE.manual && !QE.box && dirty && document.getElementById('out').textContent.includes('Ручний текст'));
     clearAll(true);a.push(!DIARY_INLINE_OWN.get(F('d_obj.serce')).value);Object.assign(BLP,params);PAPER=paper;BLANK=blank;restore(saved);renderPaper();return JSON.stringify(a); })()`));
   ok('Щоденник на місці: вибір змінює рядок, не перемикає форму й не закриває редактор',r[0],JSON.stringify(r));
   ok('Щоденник на місці: скасування повертає відповідь',r[1]);
   ok('Щоденник на місці: своє формулювання зберігається, архів не редагується',r[2] && r[3],JSON.stringify(r));
   ok('Щоденник на місці: АТ, Tab до наступного пункту й Enter у тексті',r[4] && r[5] && r[6],JSON.stringify(r));
   ok('Щоденник на місці: підказок немає у друці; очищення прибирає своє формулювання',r[7] && r[9],JSON.stringify(r));
   ok('Щоденник на місці: окремий ручний режим не потребує Alt і зберігає правки',r[8],JSON.stringify(r));
 }
 // ── частина 3 ── (tests/features-part.cjs ділить файл за цими мітками; нові тести — у кінець)
 { // 0.9.3.41: мобільні підказки не змінюють значення, типи чи доступні описи.
   const r=JSON.parse(w.eval(`(()=>{ const t=F('zah.temp').inputs[0], ad=F('ssc.ad').inputs, old=t.value, ids=t.getAttribute('aria-describedby').split(/\\s+/), a=[];
     t.value='36,6'; a.push(t.inputMode==='decimal' && t.value==='36,6' && t.parentElement.textContent.includes('°C'));
     a.push(ids.every(id=>!!document.getElementById(id)) && ids.some(id=>/^entry_/.test(id)) && ids.some(id=>/36,6/.test(document.getElementById(id).textContent)));
     a.push(ad.every(i=>i.inputMode==='decimal') && /130\\/80/.test(ad[0].closest('.nums').textContent));
     a.push(document.getElementById('meta_dt').type==='datetime-local' && document.getElementById('meta_dob').type==='date' && document.getElementById('pt_wt').parentElement.textContent.includes('кг') && document.getElementById('vq_ohl').inputMode==='text');
     t.value=old; const host=h('div',{id:'mobile_dynamic_test'},h('input',{type:'number'}),h('input',{type:'date'})); document.body.append(host); return JSON.stringify(a); })()`));
   ok('Телефон: десяткова кома та одиниці не змінюють дані',r[0]);
   ok('Телефон: підказки температури й АТ зберігають наявні доступні описи',r[1] && r[2],JSON.stringify(r));
   ok('Телефон: календар, одиниці калькулятора й текстовий швидкий рядок',r[3]);
   await sleep(20);
   const dyn=w.eval(`(()=>{ const host=document.getElementById('mobile_dynamic_test'), ins=host.querySelectorAll('input'); const ok=ins[0].inputMode==='decimal' && !!ins[1].getAttribute('aria-describedby') && host.querySelectorAll('.mobile-input-help').length===1; host.remove(); return ok; })()`);
   ok('Телефон: нові числові поля й дати отримують клавіатуру та підказку',dyn);
 }
 { // 0.9.3.42: поля в іншому документі DOM; джерела лишаються у формі.
   const fr=doc.createElement('iframe'); doc.body.append(fr);
   const r=JSON.parse(w.eval(`(()=>{ const fw=document.querySelector('body>iframe:last-of-type').contentWindow; fw.scrollTo=()=>{};
     switchDoc('ohl'); dirty=false; POP.w=fw; POP.mode='paper'; popInit(fw); popRender(); const a=[], before=active, source=F('zah.temp').inputs[0], old=source.value;
     popInsertOpen(['zah.temp'],fw.document.getElementById('pwAdd')); const proxy=fw.document.querySelector('[data-pop-source="zah_temp_0"]');
     proxy.value='38,2'; proxy.dispatchEvent(new fw.Event('input',{bubbles:true}));
     a.push(source.value==='38,2' && active===before && source.closest('#panels')!==null);
     fw.document.querySelector('.pw-insert>button').click(); a.push(source.value===old);
     popInsertOpen(['skarhy.c']); a.push(!!fw.document.querySelector('.pw-choices button') && !!fw.document.querySelector('input[type=search]'));
     const archived=fw.document.createElement('div'); archived.className='bdi'; archived.innerHTML='<span data-diary-key="heart">Рядок</span>'; a.push(popInsertKeys(archived.firstChild)===null);
     switchDoc('shch'); a.push(!POP_INSERT.box && popInsertSections().every(s=>!s.docs || s.docs.includes('shch')));
     POP.w=null; return JSON.stringify(a); })()`));
   ok('Окреме вікно: правка синхронізується, джерело лишається у формі без навігації',r[0]);
   ok('Окреме вікно: скасування відновлює поле',r[1]);
   ok('Окреме вікно: варіанти скарг із пошуком, архів не редагується',r[2] && r[3]);
   ok('Окреме вікно: зміна документа закриває редактор і обмежує список розділів',r[4]);
   fr.remove();
 }
 { // 0.9.3.43: клавіатурний фокус у модальному списку розділів.
   const r=JSON.parse(w.eval(`(()=>{ const trigger=document.getElementById('navBtn'), dlg=document.getElementById('navSheet'), close=document.getElementById('navClose');
     if(!dlg.hidden) closeNav(); trigger.focus(); trigger.click();
     const items=[...dlg.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden]')&&!el.closest('[aria-hidden="true"]'));
     const first=items[0],last=items[items.length-1], a=[!dlg.hidden&&document.activeElement===close];
     const back=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}); first.dispatchEvent(back); a.push(back.defaultPrevented&&document.activeElement===last);
     const forward=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}); last.dispatchEvent(forward); a.push(forward.defaultPrevented&&document.activeElement===first);
     const outside=document.createElement('button'); document.body.append(outside); outside.focus();
     const fromOutside=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}); outside.dispatchEvent(fromOutside); a.push(fromOutside.defaultPrevented&&document.activeElement===first); outside.remove();
     openNav(); close.click(); a.push(dlg.hidden&&document.activeElement===trigger&&document.body.style.overflow==='');
     trigger.click(); document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); a.push(dlg.hidden&&document.activeElement===trigger);
     return JSON.stringify(a); })()`));
   ok('Розділи: відкриття переводить фокус у діалог, Tab і Shift+Tab не виходять назовні',r.slice(0,4).every(Boolean),JSON.stringify(r));
   ok('Розділи: закриття кнопкою та Escape повертає фокус до виклику',r.slice(4).every(Boolean),JSON.stringify(r));
 }
 { // 0.9.3.44: згортання лівої панелі розділів без зміни полів пацієнта.
   const r=JSON.parse(w.eval(`(()=>{ const old={layout:VIEW.layout,sideFold:VIEW.sideFold}, field=F('zah.temp').inputs[0], value=field.value;
     VIEW.layout='B'; VIEW.sideFold=false; applyView(); const b=document.querySelector('#sidecol .sidefold-btn');
     const expanded=!!b&&!b.hidden&&b.getAttribute('aria-expanded')==='true'&&!document.body.classList.contains('sidefold');
     b.click(); const folded=VIEW.sideFold&&document.body.classList.contains('sidefold')&&b.getAttribute('aria-expanded')==='false'&&JSON.parse(localStorage.getItem('po.view')).sideFold===true&&field.value===value;
     b.click(); const restored=!VIEW.sideFold&&!document.body.classList.contains('sidefold')&&b.getAttribute('aria-expanded')==='true'&&field.value===value;
     const set=localStorage.setItem; localStorage.setItem=()=>{throw new Error('storage unavailable')}; let safe=true; try{b.click()}catch(e){safe=false} localStorage.setItem=set;
     const storageFailure=safe&&VIEW.sideFold&&document.body.classList.contains('sidefold');
     VIEW.layout=old.layout; VIEW.sideFold=old.sideFold; saveView(); applyView(); return JSON.stringify([expanded,folded,restored,storageFailure]); })()`));
   ok('Зміст: кнопка згортає панель розділів у смугу й оновлює доступний стан',r[0]&&r[1],JSON.stringify(r));
   ok('Зміст: повторне натискання розгортає панель, поля не змінюються',r[2]);
   ok('Зміст: збій localStorage не блокує згортання',r[3]);
 }
 { // 0.9.3.46: зрозумілі назви небезпечних дій і швидке скасування масових змін.
   const r=JSON.parse(w.eval("(()=>{ const oldDoc=DOC; switchDoc('ohl'); const clearAll=$('#clearAll'), norm=$('#allNorm'); " +
     "const clearLabel=[...TABS[active].panel.querySelectorAll('.more-dd .mmenu button')].some(b=>b.getAttribute('aria-label')==='Очистити поточний документ'&&b.textContent.trim()==='Очистити поточний документ'); " +
     "const labels=clearLabel&&norm.getAttribute('aria-label')==='Норма в усіх системах огляду'&&clearAll.getAttribute('aria-label')==='Новий пацієнт (поточний збережено)'&&clearAll.title==='Новий пацієнт (поточний збережено)'&&clearAll.textContent.includes('Новий пацієнт (поточний збережено)'); " +
     "const undoBefore=UNDO.length, beforeNorm=JSON.stringify(snap()); norm.click(); const normToast=$('#toast'), normAction=normToast.querySelector('button'), normToastOk=DANGER_UNDO_MS===8000&&normToast.classList.contains('undo-toast')&&normAction&&normAction.textContent==='Скасувати'; " +
     "if(normAction) normAction.click(); const normUndo=UNDO.length===undoBefore&&JSON.stringify(snap())===beforeNorm; " +
     "const clear=[...TABS[active].panel.querySelectorAll('.more-dd .mmenu button')].find(b=>b.getAttribute('aria-label')==='Очистити поточний документ'); const undoBeforeClear=UNDO.length, beforeClear=JSON.stringify(snap()); clear.click(); " +
     "const firstClick=clear.dataset.arm==='1'&&!$('#toast').classList.contains('undo-toast')&&UNDO.length===undoBeforeClear; clear.click(); const clearToast=$('#toast'), clearAction=clearToast.querySelector('button'), clearToastOk=clearToast.classList.contains('undo-toast')&&clearAction&&clearAction.textContent==='Скасувати'; " +
     "if(clearAction) clearAction.click(); const clearUndo=UNDO.length===undoBeforeClear&&JSON.stringify(snap())===beforeClear; UNDO.length=undoBefore; REDO.length=0; undoBtn(); switchDoc(oldDoc); " +
     "return JSON.stringify([labels,normToastOk,normUndo,firstClick,clearToastOk,clearUndo]); })()"));
   ok('Масові дії мають точні назви, а назва нового пацієнта пояснює збереження поточного',r[0],JSON.stringify(r));
   ok('«Норма» показує тост «Скасувати» на 8 секунд і повертає попередній стан',r[1]&&r[2],JSON.stringify(r));
   ok('Очищення: перше натискання лише підтверджує; друге можна скасувати з тосту',r[3]&&r[4]&&r[5],JSON.stringify(r));
 }
 { // 0.9.3.50: нові поля бланків навігують до звичайної форми та переживають перезапуск.
   doc.querySelector('[data-mode="hosp"]').click();
   w.eval("switchDoc('ohl'); BLANK=true; PAPER=true; BLP.title=true; BLP.exam=true; GAPS=false; renderPaper()");
   set('s066_docid','ID-картка, ТЕСТ'); set('s066_grom','804 — Україна');
   set('s066_krov','A(II)'); set('s066_rh','Rh+');
   set('s066_vp','1'); set('s066_p30','0');
   set('ssc_adl_0','125'); set('ssc_adl_1','82'); set('zah_moloch','Опис огляду грудних залоз'); set('zah_opora','Опис опорно-рухової системи');
   w.eval('renderPaper()');
   const paper=$('paper'), idrow=paper.querySelector('.btitle .pedit[data-fld="s066.docid"]'), examrow=paper.querySelector('.bexam .pedit[data-fld="zah.moloch"]');
   ok('003/о підставляє документ, громадянство, групу крові, Rh та АТ з полів програми',!!idrow&&/ID-картка/.test(idrow.textContent)&&/ТЕСТ/.test(idrow.textContent)&&/804/.test(paper.textContent)&&/A\(II\)/.test(paper.textContent)&&/Rh\+/.test(paper.textContent)&&/125\/82/.test(paper.textContent));
   ok('003/о друкує введені окремо описи молочних залоз та кістково-суглобової системи',/Опис огляду грудних залоз/.test(paper.textContent)&&/Опис опорно-рухової системи/.test(paper.textContent));
   if(idrow) idrow.click();
   await sleep(90);
   ok('Клік по реквізиту 003/о переходить до джерельного поля 066/о',w.eval("DOC==='f066' && TABS[active].id==='s066'"));
   w.eval("switchDoc('ohl'); BLANK=true; PAPER=true; BLP.title=true; BLP.exam=true; renderPaper()");
   const examrow2=paper.querySelector('.bexam .pedit[data-fld="zah.moloch"]');
   if(examrow2) examrow2.click();
   await sleep(90);
   ok('Клік по рядку 003/о веде до поля у звичайній формі без нового віконця',w.eval("TABS[active].id")==='zah' && doc.activeElement.id==='zah_moloch' && !doc.querySelector('.bqe[aria-label="Внести дані в друкований бланк"]'));
   set('meta_pib','Синтетичний тестовий запис'); set('ssc_adl_0','124'); set('ssc_adl_1','78'); set('zah_moloch','Тестове поле огляду');
   w.eval('savePatient(true)'); w.localStorage.setItem('po.last',w.eval('PID'));
   const saved={}; for(let i=0;i<w.localStorage.length;i++){const key=w.localStorage.key(i);saved[key]=w.localStorage.getItem(key);}
   const fresh=new JSDOM(html,{url:'https://x.test/restart',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(fw){
     fw.URL.revokeObjectURL=()=>{};fw.scrollTo=()=>{};fw.Element.prototype.scrollIntoView=()=>{};fw.scrollBy=()=>{};fw.print=()=>{};
     for(const key in saved)fw.localStorage.setItem(key,saved[key]); fw.localStorage.setItem('po.autogate','0');
     fw.addEventListener('error',e=>errs.push('restart: '+e.message));fw.console.warn=(...a)=>errs.push('restart: '+a.join(' '));
   }});
   await sleep(80);
   const fw=fresh.window, fdoc=fw.document;
   ok('Нові поля лівої руки та молочних залоз відновлюються після перезапуску',fdoc.getElementById('ssc_adl_0')?.value==='124' && fdoc.getElementById('ssc_adl_1')?.value==='78' && fdoc.getElementById('zah_moloch')?.value==='Тестове поле огляду');
   fresh.window.close();
   w.eval("switchDoc('f066'); F066ED='2012'; renderPaper()"); set('s066_dxnapr','Діагноз у направленні'); w.eval('renderPaper()');
   ok('066/о редакції 2012 має окреме поле діагнозу при направленні',/Діагноз у направленні/.test(paper.textContent));
   w.eval("F066ED='2016'; renderPaper()"); set('s066_dxhosp','Діагноз при госпіталізації'); set('s066_dxhospcode','I10'); w.eval('renderPaper()');
   ok('066/о редакції 2016 має окремі поля діагнозу та коду МКХ-10',/Діагноз при госпіталізації/.test(paper.textContent)&&/I10/.test(paper.textContent));
 }
 // 0.9.3.52 — «Вносити на бланку»: віконце з пунктами рядка
 { doc.querySelector('[data-mode="hosp"]').click(); ap('pneu');
   w.eval("peSetMode('here'); BLANK=true; BLP.title=true; BLP.exam=true; switchDoc('ohl'); PAPER=true; renderPaper()");
   const prow=re=>[...doc.querySelectorAll('#paper .b003 .pe-row')].find(r=>re.test(r.textContent.trim()));
   const pclick=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
   const pbox=()=>doc.querySelector('.pe-box');
   ok('Бланк: рядки титулу й огляду позначені як «вносити тут», над аркушем — перемикач', !!prow(/^Свідомість/) && !!prow(/^15\. Група крові/) && !!doc.querySelector('.pe-toggle[aria-pressed="true"]'));
   pclick(prow(/^Свідомість/));
   ok('Бланк: клік по «Свідомість» відкриває віконце з варіантами саме цього пункту', !!pbox() && pbox().querySelectorAll('[data-pe-sel="svid"]').length>=3);
   const before=w.eval("F('zah.svid').el.value"), opt=[...pbox().querySelectorAll('.pe-opt')].find(o=>o.dataset.value!=='' && o.dataset.value!==before);
   opt.dispatchEvent(new w.Event('pointerdown',{bubbles:true})); pclick(opt);
   ok('Бланк: вибір у віконці змінює поле форми й аркуш, віконце лишається відкритим', w.eval("F('zah.svid').el.value")===opt.dataset.value && $('paper').textContent.includes(opt.textContent.trim().split(' ')[0]) && !!pbox() && opt.getAttribute('aria-pressed')==='true');
   pclick(pbox().querySelector('.pe-undo'));
   ok('Бланк: «Скасувати» у віконці повертає попереднє значення', w.eval("F('zah.svid').el.value")===before);
   const t0=pbox().querySelector('.pe-head b').textContent; pclick(pbox().querySelector('.pe-next'));
   ok('Бланк: «Далі ›» переходить до наступного рядка', !!pbox() && pbox().querySelector('.pe-head b').textContent!==t0);
   pclick(prow(/^А\/Т/)); const adl=[...pbox().querySelectorAll('.pe-body input')].find(i=>i.dataset.popSource==='ssc_adl_0');
   ok('Бланк: рядок «А/Т» показує обидві руки', !!adl && !![...pbox().querySelectorAll('.pe-body input')].find(i=>i.dataset.popSource==='ssc_ad_0'));
   adl.value='135'; adl.dispatchEvent(new w.Event('input',{bubbles:true}));
   ok('Бланк: число з віконця записується в поле форми', w.eval("F('ssc.adl').inputs[0].value")==='135');
   pclick(prow(/^20\. Дата виписки/)); const tv=[...pbox().querySelectorAll('.pe-body input')].find(i=>i.dataset.popSource==='e_per_tvyp');
   tv.value='10:30'; tv.dispatchEvent(new w.Event('input',{bubbles:true}));
   ok('Бланк: п. 20 — час виписки вводиться й друкується в клітинках', /час\s*1\s*0\s*год\s*3\s*0\s*хв/.test(prow(/^20\. Дата виписки/).textContent.replace(/ /g,' ')));
   pbox().dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   ok('Бланк: Esc закриває віконце', !pbox());
   pclick(prow(/^2\. Стать/)); const sx=pbox() && [...pbox().querySelectorAll('.pe-opt[data-pop-chip]')];
   ok('Бланк: п. 2 «Стать» вибирається у віконці', !!sx && sx.length>=2);
   if (sx && sx.length){ pclick(sx[1]); } ok('Бланк: вибрана стать записується', !!w.eval('sex'));
   const bk=doc.querySelector('#paper .btback');
   ok('Зворот титульного 003/о: пп. 22, 23, 31, 32 з даних програми', !!bk && /22\. Діагноз заключний клінічний/.test(bk.textContent) && /23\. Хірургічні операції та процедури/.test(bk.textContent) && /Код АКМІ/.test(bk.textContent) && /31\. Лікуючий лікар/.test(bk.textContent) && /32\. Завідувач відділення/.test(bk.textContent) && bk.textContent.includes(w.eval("BV('dx.osn')").slice(0,20)));
   const r22=[...bk.querySelectorAll('.pe-row')].find(r=>/^22\./.test(r.textContent.trim())); if (r22) pclick(r22);
   ok('Зворот титульного: клік по п. 22 відкриває діагноз', !!pbox() && /22\./.test(pbox().querySelector('.pe-head b').textContent));
   w.eval("switchDoc('f066'); F066ED='2016'; renderPaper()");
   const p66=[...doc.querySelectorAll('#paper .b003 .pe-row')], r28=p66.find(r=>/^28\. Пільгова/.test(r.textContent.trim()));
   ok('066/о: рядки бланка відкривають віконце (п. 28 — пільгова категорія)', p66.length>20 && !!r28 && (pclick(r28), !!pbox() && !!pbox().querySelector('[data-pe-sel="pil"]')));
   w.eval("switchDoc('ohl'); renderPaper()");
   w.eval("switchDoc('shch'); renderPaper()"); const dn=doc.querySelector('#paper .bdi.bcur [data-diary-key="nodes"]'); if (dn) pclick(dn);
   ok('Бланк: поточний щоденник і далі відкриває власний редактор', !!doc.querySelector('.diary-inline-editor') && !pbox());
   w.eval('diaryInlineClose()');
   w.eval("peSetMode('form'); switchDoc('ohl'); renderPaper()"); pclick([...doc.querySelectorAll('#paper .b003 .brow')].find(r=>/^Свідомість/.test(r.textContent.trim())));
   ok('Бланк: режим «перехід до поля у формі» — без віконця', !pbox() && !doc.querySelector('#paper .pe-row'));
   w.eval("peSetMode('here'); switchDoc('ohl'); PAPER=false; renderPaper()"); }
 { // Regression coverage: user-provided markup stays text through every generated document.
   const r=JSON.parse(w.eval(`(()=>{ const saved=snap(), presetCount=PRESETS.length, customCount=CUSTOM.presets.length;
     const img='<img src=x onerror=alert(1)>', meta='ПІБ '+img, templ='Свій шаблон '+img, free='Вільний текст '+img;
     const p={key:'xss-test-template',name:'Тестовий шаблон',group:'my',custom:true,set:{'skarhy.cx':templ},skarhy:[],plan:[],rx:[],hosp:'e'};
     CUSTOM.presets.push(p); PRESETS.push(p); applyPreset(p); document.getElementById('meta_pib').value=meta; F('vitae.alergx').el.value=free;
     CACHE={}; dirty=false; const modes=['hosp','amb'], docs=modes.flatMap(mode=>[...DOCLIST[mode],...DOCMORE[mode]].map(([doc])=>[mode,doc]));
     const unsafe=[], seen={meta:false,templ:false,free:false}; let count=0;
     const esc=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
     for(const mode of modes){ MODE=mode; applyMode();
       for(const [doc] of [...DOCLIST[mode],...DOCMORE[mode]]){ if(DOC!==doc)switchDoc(doc);else update(); const html=document.getElementById('out').innerHTML; count++;
         if(/<img\\b[^>]*\\bonerror\\s*=/i.test(html))unsafe.push(mode+':'+doc);
         if(html.includes(esc(meta)))seen.meta=true; if(html.includes(esc(templ)))seen.templ=true; if(html.includes(esc(free)))seen.free=true;
       }
     }
     CUSTOM.presets.length=customCount; PRESETS.length=presetCount; restore(saved);
     return JSON.stringify({count,expected:docs.length,unsafe,seen}); })()`));
   ok('Екранування: ПІБ, власний шаблон і вільний текст залишаються текстом у всіх документах',r.count===r.expected&&r.expected>0&&!r.unsafe.length&&Object.values(r.seen).every(Boolean),JSON.stringify(r));
 }
 { // 0.9.3.53: вибір обстежень і власний текст відновлюються; старі картки зберігають попередній зміст.
   const state=JSON.parse(w.eval(`(()=>{ window.__konsTestState={mode:MODE,doc:DOC,pid:PID,last:localStorage.getItem('po.last'),snap:snap()};
     document.querySelector('[data-mode="amb"]').click(); switchDoc('kons');
     RES=[{id:9301,d:'2026-10-22',t:'ЗАК',v:'Hb 120 г/л'},{id:9302,d:'2026-10-23',t:'ЕКГ',v:'Синусовий ритм'}]; KONSOBS=[]; renderRes(); update();
     const f=F('e_obs.konslog'), rows=[...f.konsList.querySelectorAll('input[type="checkbox"]')], note=f.wrapEl.textContent;
     const ui=rows.length===2&&rows.every(x=>!x.checked)&&note.includes('Журнал обстежень за час лікування')&&note.includes('Внести нове обстеження')&&F('e_obs.obs').wrapEl.hidden;
     rows[0].click(); const own=F('e_obs.konsown').el; own.value='Тестове власне обстеження'; own.dispatchEvent(new Event('input',{bubbles:true})); update();
     const text=[...document.querySelectorAll('#out>*')].map(x=>x.textContent).join(' '), output=text.includes('Hb 120 г/л')&&!text.includes('Синусовий ритм')&&text.includes('Тестове власне обстеження');
     PID='fixture-kons-observations'; savePatient(true); localStorage.setItem('po.last',PID);
     return JSON.stringify({ui,output,saved:loadStore()[PID].snap.konsObs.includes(9301)}); })()`));
   ok('Консультація: джерело обстежень зрозуміле, нові записи спочатку не позначені',state.ui,JSON.stringify(state));
   ok('Висновок містить лише вибрані обстеження та поле «Своє»',state.output,JSON.stringify(state));
   ok('Вибір і «Своє» збережені у знімку пацієнта',state.saved,JSON.stringify(state));
   const stored={}; for(let i=0;i<w.localStorage.length;i++){const key=w.localStorage.key(i);stored[key]=w.localStorage.getItem(key);}
   const fresh=new JSDOM(html,{url:'https://x.test/kons-restart',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(fw){
     fw.URL.revokeObjectURL=()=>{};fw.scrollTo=()=>{};fw.Element.prototype.scrollIntoView=()=>{};fw.scrollBy=()=>{};fw.print=()=>{};
     for(const key in stored)fw.localStorage.setItem(key,stored[key]); fw.localStorage.setItem('po.autogate','0');
     fw.addEventListener('error',e=>errs.push('kons restart: '+e.message));fw.console.warn=(...a)=>errs.push('kons restart: '+a.join(' '));
   }});
   await sleep(100);
   const fw=fresh.window, restored=fw.eval("KONSOBS.includes(9301)&&F('e_obs.konsown').el.value==='Тестове власне обстеження'&&F('e_obs.konslog').konsList.querySelectorAll('input:checked').length===1");
   ok('Консультація: вибір і поле «Своє» залишаються після перезапуску JSDOM',restored);
   fresh.window.close();
   const legacy=w.eval(`(()=>{const old=Object.assign({},loadStore()['fixture-kons-observations'].snap);delete old.konsObs;restore(old);update();
     const text=[...document.querySelectorAll('#out>*')].map(x=>x.textContent).join(' ');
     return KONSOBS.length===2&&F('e_obs.konslog').konsList.querySelectorAll('input:checked').length===2&&text.includes('Hb 120 г/л')&&text.includes('Синусовий ритм');})()`);
   ok('Старі пацієнти без konsObs зберігають попереднє включення всіх обстежень',legacy);
   w.eval(`(()=>{const state=window.__konsTestState,st=loadStore();delete st['fixture-kons-observations'];saveStore(st);restore(state.snap);PID=state.pid;
     switchDoc(state.doc);document.querySelector('[data-mode="'+state.mode+'"]').click();
     if(state.last===null)localStorage.removeItem('po.last');else localStorage.setItem('po.last',state.last);delete window.__konsTestState;})()`);
 }
 // 0.9.3.55 — щоденні резервні копії в папці даних (папка — у пам’яті)
 { const memDir=name=>{ const files=new Map(), dirs=new Map(); return {name, kind:'directory', files, dirs,
     async getDirectoryHandle(n,o){ if(!dirs.has(n)){ if(!o||!o.create) throw new Error('not found'); dirs.set(n,memDir(n)); } return dirs.get(n); },
     async getFileHandle(n,o){ if(!files.has(n)&&!(o&&o.create)) throw new Error('not found'); return {kind:'file', name:n, async createWritable(){ let b=''; return {async write(d){ b+=d; }, async close(){ files.set(n,b); }}; }, async getFile(){ return {text:async()=>files.get(n)}; }}; },
     async *entries(){ for(const [n] of files) yield [n,{kind:'file',name:n}]; for(const [n,d] of dirs) yield [n,d]; },
     async removeEntry(n){ files.delete(n); dirs.delete(n); } }; };
   w.eval('window.__pk=[PINC.key,PINC.cfg]; PINC.key=null; PINC.cfg=null');   // попередні тести PIN могли лишити шифрування
   const saved=JSON.parse(w.eval('JSON.stringify(loadStore())')), root=memDir('Первинний огляд — дані');
   w.eval("newPatient()"); set('meta_pib','Копія Тестовий Перший'); w.eval('savePatient(true)');
   w.eval("newPatient()"); set('meta_pib','Копія Тестовий Другий'); w.eval('savePatient(true)');
   const FSo=w.eval('FS'); FSo.dir=root; FSo.ok=true; w.localStorage.removeItem('po.fbk');
   const bk=()=>root.dirs.get('Резервні копії'), day=w.eval('fbkDay()'), n0=Object.keys(w.eval('loadStore()')).length;
   const r1=await w.eval("fbkWrite('manual')"); const f1=bk() && bk().files.get('Копія_'+day+'.json');
   ok('Копії в папці: денна копія всіх пацієнтів у «Резервні копії»', r1==='Копія_'+day+'.json' && !!f1 && JSON.parse(f1).type==='po-patients' && Object.keys(JSON.parse(f1).items).length===n0);
   ok('Копії в папці: автокопія не частіше ніж раз на 30 хв', (await w.eval("fbkWrite('auto')"))===null);
   w.eval("(()=>{ const st=loadStore(); delete st[Object.keys(st)[0]]; saveStore(st); })()");
   const r2=await w.eval("fbkWrite('manual')");
   ok('Копії в папці: коли пацієнтів стало менше, денна копія не перезаписується — окремий файл із часом', /^Копія_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/.test(r2||'') && Object.keys(JSON.parse(bk().files.get('Копія_'+day+'.json')).items).length===n0, r2);
   await w.eval("bakPut('перед оновленням 0.9.3.54 → 0.9.3.55')");
   ok('Копії в папці: копія перед оновленням версії', [...bk().files.keys()].some(n=>/перед оновленням 0\.9\.3\.54/.test(n)));
   for(let i=1;i<=35;i++){ const d=new Date(2025,0,i); bk().files.set('Копія_'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'.json','{}'); }
   bk().files.set('Нотатка.txt','не чіпати');
   await w.eval("fbkWrite('manual')");
   const days=new Set([...bk().files.keys()].filter(n=>/^Копія_/.test(n)&&!/перед оновленням/.test(n)).map(n=>n.slice(6,16)));
   ok('Копії в папці: зберігаються останні 30 днів, чужі файли не чіпаються', days.size===30 && days.has(day) && !days.has('2025-01-01') && bk().files.has('Нотатка.txt'), [...days].sort().slice(0,3).join(','));
   await w.eval("(async()=>{ const raw=crypto.getRandomValues(new Uint8Array(32)); PINC.key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']); PINC.cfg={v:1,test:1}; })()");
   const re=await w.eval("fbkWrite('manual')"), enc=re && bk().files.get(re);
   ok('Копії в папці: з PIN копія зашифрована — без ПІБ відкритим текстом', !!enc && JSON.parse(enc).type==='po-enc-file' && !/Копія Тестовий/.test(enc), (enc||'').slice(0,60));
   w.eval('PINC.key=null; PINC.cfg=null');
   w.eval("saveStore({})"); w.localStorage.removeItem('po.fbk');
   ok('Копії в папці: порожнє сховище ніколи не записується як копія', (await w.eval("fbkWrite('manual')"))===null);
   w.eval('drawBak()'); await sleep(50);
   ok('Копії в папці: стан і кнопка в «Резервні копії й відновлення»', !!doc.getElementById('fbkBox') && /Копія в папку зараз/.test(doc.getElementById('fbkBox').textContent));
   FSo.dir=null; FSo.ok=false; w.eval('saveStore('+JSON.stringify(saved)+')'); w.eval('PINC.key=window.__pk[0]; PINC.cfg=window.__pk[1]'); }
 { // 0.9.3.60 — шаблон хвороби не перезаписує те, що лікар уже заповнив
   w.eval("newPatient(); switchDoc('ohl')"); await sleep(30);
   const r=JSON.parse(w.eval(`(()=>{ const a=[]; const f=F('skarhy.c'); ['кашель з виділенням харкотиння','підвищення температури тіла'].forEach(t=>{ const i=f.opts.findIndex(o=>O(o).t===t); f.chips[i].click(); });
     const hr=F('dyh.hr'), i=hr.opts.findIndex(o=>/сухі/.test(O(o).t)); hr.el.value=i; hr.el.dispatchEvent(new Event('change',{bubbles:true})); update();
     a.push(startTab()===TABS.findIndex(t=>t.id==='skarhy'));
     stHintRender(); a.push(!document.querySelector('.st-hint').hidden && /Негоспітальна пневмонія/.test(document.querySelector('.st-hint').textContent));
     const ag=AGATE; AGATE=true; const own=stOwn(); applyPreset(PRESETS.find(p=>p.key==='pneu')); AGATE=ag; const dlg=document.querySelector('.stsheet'); a.push(!!dlg && F('dx.osn').el.value==='');
     if (!dlg) return JSON.stringify(a.concat(['own:'+own.join(','), 'key:'+curKey, 'doc:'+DOC]));
     a.push(!document.getElementById('st_skarhy').checked && !document.getElementById('st_exam').checked && document.getElementById('st_dx').checked);
     dlg.querySelector('.st-foot .btn').click();
     a.push(F('skarhy.c').chips.filter(c=>c.getAttribute('aria-pressed')==='true').length===2, /сухі/.test(hr.el.options[hr.el.selectedIndex].text), F('dx.mkh').el.value==='J18.1', curKey==='pneu');
     return JSON.stringify(a); })()`));
   ok('Шаблон за бажанням: програма починає зі «Скарг», під скаргами — «Схоже на…»', r[0] && r[1], JSON.stringify(r));
   ok('Шаблон за бажанням: коли скарги й огляд заповнені — спершу питає «Що взяти з шаблону»', r[2] && r[3], JSON.stringify(r));
   ok('Шаблон за бажанням: ваші скарги й огляд лишились, діагноз і МКХ — з шаблону', r[4] && r[5] && r[6] && r[7], JSON.stringify(r));
   w.eval("newPatient()"); }
 { // 0.9.3.62 — читабельний бланк: що вважається порожнім місцем
   const r=JSON.parse(w.eval(`(()=>{ const mk=s=>{ const d=document.createElement('div'); d.innerHTML=s; return d.firstChild; };
     return JSON.stringify([
       phrRowEmpty(mk('<div class="brow"><span class="bl">Зріст </span><span class="bf empty"></span><span class="bl"> см</span></div>')),
       phrRowEmpty(mk('<div class="brow"><span class="bl">Стан: </span><span class="bu">середньої тяжкості</span><span class="bf empty"></span></div>')),
       phrRowEmpty(mk('<div class="brow"><span class="bl">Хворий </span><span class="bf">Тестовий</span></div>')),
       phrRowEmpty(mk('<div class="blines"></div>')), phrRowEmpty(mk('<div class="blines">текст</div>')) ]); })()`));
   ok('Читабельний бланк: порожнє — лише незаповнене (рядок із вибраним варіантом — заповнений)', JSON.stringify(r)==='[true,false,false,true,false]', JSON.stringify(r)); }
 // 0.9.3.64 «З МІС»
 { const P=t=>JSON.stringify(w.eval(`misParse(${JSON.stringify(t)}).map(x=>[x.pib,x.sex,x.dob])`));
   ok('З МІС: рядок медкарти → ПІБ, стать, дата', P('Тестенко Іван Петрович\nТестенко Іван Петрович\nЧ.,21 квітня 1973 (53 р.),   Ідентифікований')==='[["Тестенко Іван Петрович","m","1973-04-21"]]', P('Тестенко Іван Петрович\nЧ.,21 квітня 1973'));
   ok('З МІС: список із кількох, подвійне прізвище, ВЕЛИКІ літери, дата цифрами', JSON.parse(P('Пробна Ольга Іванівна\nЖ.,20 червня 1957 (69 р.)\nКовальчук-Мельник Анна-Марія Степанівна\nЖ.,08 грудня 1988')).length===2
     && P('ДЕМО-ПРОБНИЙ ОЛЕГ ВАЛЕРІЙОВИЧ, 05.03.1990')==='[["Демо-Пробний Олег Валерійович","m","1990-03-05"]]' && P('просто текст 2026')==='[]');
   const code=decodeURIComponent(w.eval('misBookmarklet()').slice(11)); let bmOk=true; try{ new w.Function(code); }catch(e){ bmOk=false; }
   ok('З МІС: закладка — коректний JavaScript, кнопки на вкладці «Запис»', bmOk && !!$('misIn'));
   const paste=t=>{ const e=new w.Event('paste',{bubbles:true,cancelable:true}); e.clipboardData={getData:()=>t}; doc.body.dispatchEvent(e); return e.defaultPrevented; };
   const pv=paste('Тестенко Іван Петрович\nЧ.,21 квітня 1973 (53 р.)'), n0=w.eval('Object.keys(loadStore()).length');
   ok('З МІС: Ctrl+V заповнює ПІБ, дату, вік, стать і зберігає', pv && w.eval("[mv('pib'),mv('dob'),sex,!!PID&&loadStore()[PID].name].join('|')")==='Тестенко Іван Петрович|1973-04-21|m|Тестенко Іван Петрович' && +w.eval("mv('age')")>=50);
   paste('Пробна Ольга Іванівна\nЖ.,20 червня 1957'); paste('Тестенко Іван Петрович\nЧ.,21 квітня 1973');
   ok('З МІС: інший пацієнт — новий запис, наявний — відкривається, без дублів', w.eval("mv('pib')+'|'+sex")==='Тестенко Іван Петрович|m' && w.eval('Object.keys(loadStore()).length')===n0+1, w.eval("mv('pib')+'|'+sex+'|'+Object.keys(loadStore()).length")+' n0='+n0);
   const ta=doc.querySelector('#panels textarea'); const e=new w.Event('paste',{bubbles:true,cancelable:true}); e.clipboardData={getData:()=>'Тестенко Іван Петрович\nЧ.,21 квітня 1973'}; ta.dispatchEvent(e);
   ok('З МІС: вставка в звичайне поле не перехоплюється', !e.defaultPrevented);
   ok('З МІС: стать злилась із по батькові (однорядкове поле)', P('Тестенко Іван МиколайовичЧ.,14 квітня 1984')==='[["Тестенко Іван Миколайович","m","1984-04-14"]]'); }
 // 0.9.3.65 щоденник без первинки
 { w.eval("newPatient(); curKey=null; switchDoc('ohl')"); set('meta_pib','Щоденник Без Первинки'); w.eval("switchDoc('shch')");
   ok('Щоденник без огляду: є «Без хвороби»', !!$('dsrcFree'));
   $('dsrcFree').click();
   ok('«Без хвороби»: форма не питає хворобу і пам’ятає вибір', w.eval('DFREE') && /без хвороби/.test($('dsrc').textContent) && !$('dsrc').querySelector('input') && w.localStorage.getItem('po.dfree')==='1');
   const rb=()=>w.eval("F('d_main.zal').rbox"), chipT=t=>[...rb().querySelectorAll('.chip')].find(c=>c.textContent===t), zal=()=>w.eval("F('d_main.zal').el.value");
   w.eval('renderRemain()');
   ok('Скарги без первинки: загальний список і пошук', !!chipT('загальну слабкість') && !!rb().querySelector('input[list="dzalList"]'));
   chipT('загальну слабкість').click();
   ok('Скарга з загального списку — у «Зберігаються скарги»', zal()==='загальну слабкість', zal());
   w.eval("(()=>{ const e=F('d_main.zal').el; e.value+=', біль у правому плечі'; e.dispatchEvent(new Event('input')); })()");
   const md=$('meta_dt'); md.value='2026-10-01T09:00'; ev(md,'input');
   const save=()=>{ const n=w.eval('DIARIES.length'); w.eval('saveDiary()'); if (w.eval('DIARIES.length')===n) w.eval('saveDiary()'); };
   save();
   ok('Після запису — чернетка наступного дня: дата +1, скарги порожні', w.eval('DIARIES.length')===1 && md.value.startsWith('2026-10-02') && zal()==='', md.value+' | '+zal());
   w.eval('renderRemain()');
   ok('Свої слова пацієнта — кнопками в наступному щоденнику', !!chipT('біль у правому плечі') && /Цього пацієнта/.test(rb().textContent));
   const sel=doc.querySelector('.dnext-row select'); sel.value='2'; ev(sel,'change');
   chipT('біль у правому плечі').click(); w.eval("(()=>{ const f=F('d_obj.t'); if (f && f.inputs){ f.inputs[0].value='37,4'; f.inputs[0].dispatchEvent(new Event('input')); } })()");
   save();
   ok('«Через день»: наступна чернетка на +2 дні', w.eval('DIARIES.length')===2 && md.value.startsWith('2026-10-04'), md.value);
   w.eval("setDFree(false)"); }
 // 0.9.3.66 сенсорний режим (планшет горизонтально)
 { const R=doc.documentElement;
   w.eval("VIEW.touch='on'; applyView()"); const on=R.classList.contains('touch');
   w.eval("VIEW.touch='off'; applyView()"); const off=!R.classList.contains('touch');
   w.eval("openViewPop()"); const ctl=[...doc.querySelectorAll('.viewpop .vrow .vl')].some(e=>e.textContent==='Дотик'); w.eval("closeViewPop()");
   ok('Дотик: «Великі кнопки» вмикає сенсорний режим, «Звичайні» — вимикає, перемикач у «Вигляді»', on && off && ctl, JSON.stringify([on, off, ctl]));
   w.eval("VIEW.touch='auto'; saveView(); applyView()"); }
 ok('Без помилок JavaScript', errs.length===0, errs.join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length);
 process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
