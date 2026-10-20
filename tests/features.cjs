// Перевірки функцій 2.13+: профілактика, друк, анамнез за хворобою, ПІБ, вагітність/гінеколог, схеми призначень, джерела, дози.
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','build','app.html'),'utf8');
const R=[];const ok=(n,c,info='')=>R.push((c?'✅':'❌')+' '+n+(info&&!c?' — '+info:''));
const errs=[];let printed=0;
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){try{w.localStorage.setItem('po.autogate','0')}catch(e){}w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.print=()=>{printed++};w.addEventListener('error',e=>errs.push(e.message));w.console.warn=(...a)=>errs.push(a.join(' '));}});
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
 ok('«Повернути попередній лист» працює', rx()==='Натрію хлорид 0,9%', rx());
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
 ok('Очистити весь документ — у меню «⋯»', [...TABS_cur().panel.querySelectorAll('.more-dd .mmenu button')].some(b=>/Очистити весь документ/.test(b.textContent)));
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
 ok('Стрічка «Призначено» над листом', /Призначено \(4\)/.test($('rxStrip').textContent), $('rxStrip').textContent.slice(0,80));
 ok('Компактні рядки: усі згорнуті', doc.querySelectorAll('#rxList .rx.rxc').length===4 && !doc.querySelector('#rxList .rx.open'));
 ok('Підказки процедур для пневмонії', /Пульсоксиметрія/.test($('rxSuggest').textContent));
 [...$('rxSuggest').querySelectorAll('button')].find(b=>/Оксигенотерапія/.test(b.textContent)).click();
 ok('Процедура додається як маніпуляція', w.eval("rxKind(RX.find(i=>/Оксигенотерапія/.test(i.drug)))")==='man');
 { const a=$('rxAdd'); a.value='Інгаляції через небулайзер'; a.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})); }
 ok('Пошук-додавання: фізіотерапія', w.eval("rxKind(RX.find(i=>/небулайзер/.test(i.drug)))")==='phys');
 w.eval("RX[0].start=addDays(todayISO(),-2); RX[0].src='pat'; RX[0].hours='8:00, 20:00'"); w.eval("rxChangeDose(RX[0]); renderRx()");
 ok('«Змінити дозу з сьогодні»: стара закрита, нова з сьогодні', w.eval("RX[0].stop===todayISO() && RX[1].drug===RX[0].drug && RX[1].start===todayISO() && !RX[1].stop"));
 ok('Текст огляду: процедури окремим рядком', /Процедури: Оксигенотерапія/.test(out()));
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
   ok('«Word» і «LibreOffice» — в одному «Зберегти ▾»', $('docxBtn').hidden && $('odtBtn').hidden && doc.querySelectorAll('.savemenu button').length===3);
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
   { const e=[...sh.querySelectorAll('button.gap')].find(b=>/працездатність/.test(b.textContent)); e && e.click(); await sleep(120);
     ok('Аркуш: натискання на «працездатність / ЕЛН» ставить курсор у саме поле і підсвічує його', e && doc.activeElement && doc.activeElement.id==='vitae_strah' && doc.activeElement.closest('.f').classList.contains('fieldflash'), doc.activeElement && doc.activeElement.id); }
   sh.querySelector('.gaptog').click(); ok('Пропуски можна сховати', !doc.querySelector('#paper .sheet .gap') && /Пропусків і зауважень/.test(doc.querySelector('#paper .gapbar').textContent));
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
   ok('Бланк: титульний лист 003/о (п. 1–21)', pages().length===3 && /МЕДИЧНА КАРТА СТАЦІОНАРНОГО ХВОРОГО/.test(pages()[0].textContent) && /21\. Проведено ліжко-днів/.test(pages()[0].textContent));
   w.eval("BLP.title=false"); w.__printed=0; $('printBtn').click();
   ok('Бланк: друк — сторінки бланка без жовтих позначок і без QR', $('print').querySelectorAll('.b003').length===2 && !$('print').querySelector('.bgap, .prqr'));
   w.eval("switchDoc('shch'); renderPaper()"); ok('Бланк: «43. Щоденник» із показниками ліворуч', /43\. ЩОДЕННИК/.test(pages()[0].textContent) && /ЧДР –/.test(pages()[0].textContent));
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
   rows.find(x=>/^А\/Т/.test(x.textContent.trim())).click(); ok('Клік по «А/Т» відкриває «Серце, судини»', w.eval("TABS[active].id")==='ssc');
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
   w.eval(`batchPrint(${JSON.stringify(ids)}, 'ohl')`); await sleep(150);
   ok('Друк пачкою: документи вибраних — у друк по одному на аркуш', $('print').querySelectorAll('.bprint-one').length===2 && pr===1, $('print').querySelectorAll('.bprint-one').length+'/'+pr);
   ok('Після друку пачкою — відкритий той самий пацієнт', $('meta_pib').value==='Повтор Тестовий Пацієнт'); }
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
     const r=await w.eval(`(async()=>{ const raw=crypto.getRandomValues(new Uint8Array(32)), cfg=await pinWrap('1234', raw); const k=await pinUnwrap('1234', cfg);
       const e=await encObj({name:'Секретний Пацієнт', x:[1,2]}, k); const d=await decObj(e, k); let bad=false; try{ await pinUnwrap('0000', cfg); }catch(x){ bad=true; }
       return {plain:JSON.stringify(e).includes('Секретний'), ok:d.name==='Секретний Пацієнт', bad, iter:cfg.iter}; })()`);
     ok('Шифрування: AES-GCM — у зашифрованому немає ПІБ, розшифровується ключем', !r.plain && r.ok, JSON.stringify(r));
     ok('Шифрування: неправильний PIN не відкриває ключ; PBKDF2 ≥ 300 000 ітерацій', r.bad && r.iter>=300000);
   }
   ok('PIN: блок у Налаштуваннях', !!doc.querySelector('.pinbox'));
   ok('PIN: поки не введено — запис відкритим текстом заборонено', w.eval("(()=>{ const c=PINC.cfg; PINC.cfg={v:1}; const b=pinBlocked(); PINC.cfg=c; return b; })()")); }
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
     tb[1].click(); ok('Вкладка «Перевірка»: список зауважень замість тексту, число — на вкладці', ob.dataset.ov==='chk' && $('chk').open && /\d/.test(tb[1].textContent));
     tb[2].click(); ok('Вкладка «Перед друком» вмикає аркуш', w.eval('PAPER')===true && ob.dataset.ov==='paper');
     tb[0].click(); ok('Вкладка «Текст» повертає текст', w.eval('PAPER')===false && ob.dataset.ov==='text' && !$('out').hidden); }
 { w.eval("DIARIES=[]; curKey=null; SECTIONS.filter(s=>s.objective||s.id==='skarhy').forEach(s=>clearSection(s)); switchDoc('ohl'); switchDoc('shch')");
   ok('Щоденник без огляду й хвороби — форма питає хворобу', /Для якої хвороби щоденник/.test($('dsrc').textContent), $('dsrc').textContent.slice(0,120));
   w.eval("pickDiaryDisease('hf')");
   ok('Щоденник за хворобою: заповнено з еталонного шаблону', /Щоденник/.test(out()) && /набряки/i.test(out()), out().slice(0,300));
   const vis=id=>!w.eval(`F('d_obj.${id}').wrapEl.hidden`);
   ok('Щоденник під ХСН: маса тіла й діурез показано, живіт і глікемію сховано', vis('masa') && !vis('zhyv') && !vis('glik') && !/Живіт/.test(out()));
   ok('Щоденник під ХСН: обов’язкові пункти позначено «важливо»', w.eval("F('d_obj.masa').wrapEl.classList.contains('dneed')"));
   ok('Підказка щоденника: що щодня внести', w.eval("diaryHints().some(x=>/щодня внесіть/.test(x))"));
   set('d_obj_masa_0','82'); set('d_obj_masa_1','1400'); ok('Маса тіла й діурез — у тексті щоденника', /Маса тіла 82 кг, діурез 1400 мл\/добу/.test(out()), out());
   w.eval("DSHOWALL=true; update()"); ok('«Показати всі пункти» повертає сховане', vis('zhyv'));
   w.eval("DSHOWALL=false; update(); switchDoc('ohl')"); }
 ok('Без помилок JavaScript', errs.length===0, errs.join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length);
 process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
