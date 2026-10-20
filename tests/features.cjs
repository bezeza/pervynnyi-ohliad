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
   ok('Щоденник: обґрунтованість перебування — кисень і в/в антибіотик з пунктами', /Обґрунтованість перебування в стаціонарі зберігається \(наказ МОЗ № 1044\): кисневотерапія 3 л\/хв.*п\. II\.1.*внутрішньовенна антибактеріальна терапія/.test(out()), out());
   ok('Пневмонія: підказка — бракує стабільності для переходу per os', /бракує стабільності: t° > 37,8 °C, ЧД > 24, потреба в кисні/.test(doc.querySelector('.dhints').textContent));
   s('d_obj_t_0','36,8'); s('d_obj_chd_0','18'); s('d_obj_o2_0',''); s('d_obj_chd_1','95'); s('d_obj_chss_0','80');
   ok('Пневмонія: стабільність виконана — підказка про перехід на пероральний антибіотик', /Критерії клінічної стабільності виконано/.test(doc.querySelector('.dhints').textContent));
   w.eval("RX.length=0; renderRx(); update()"); set('d_main_dyn','0');
   ok('Немає підстав — без рядка в тексті, з підказкою і зауваженням перевірки', !/Обґрунтованість перебування/.test(out()) && /підстав для продовження перебування/.test(doc.querySelector('.dhints').textContent) && w.eval("checkDoc().some(x=>/наказ МОЗ № 1044/.test(x.m))"));
   set('d_main_dyn','2'); ok('«Стан покращився» без підстав — «планується виписка»', /Підстав для продовження цілодобового нагляду немає \(наказ МОЗ № 1044\) — планується виписка/.test(out()), out());
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
   sh.querySelector('.gaptog').click(); ok('Пропуски можна сховати', !doc.querySelector('#paper .sheet .gap') && /Пропусків і зауважень/.test(doc.querySelector('#paper .gapbar').textContent));
   doc.querySelector('#paper .gaptog').click(); $('paperBtn').click(); }
 ok('Без помилок JavaScript', errs.length===0, errs.join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length);
 process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
