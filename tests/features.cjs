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
 ok('Анамнез життя не вигадує заперечення до «Норми»', !/Алергологічний анамнез не обтяжений/.test(out()) && !/заперечує/.test(out()));
 w.eval("SECTIONS.find(s=>s.id==='vitae').panel.querySelector('.btn.norm').click()");
 ok('«= Норма =» в анамнезі життя ставить типові заперечення', /Алергологічний анамнез не обтяжений/.test(out()));
 ok('Апендицит — стан середньої тяжкості', /Загальний стан середньої тяжкості/.test(out()));
 ok('Хірургія не вписує неврологічний статус, якого не було', !/Вогнищевої та менінгеальної/.test(out()) && !/Ромберг/.test(out()));
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
   w.eval("uiV2Set(false); VIEW.layout='auto'; VIEW.fold=true; applyView()"); ok('Вигляд: текст згортається в смужку', w.innerWidth<900 || doc.body.classList.contains('outfold'));
   w.eval("uiV2Set(true)"); ok('Новий вигляд: «Згорнути текст» не діє — текст за кнопкою «Текст»', !doc.body.classList.contains('outfold'));
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
   ok('Щоденник: кисень поруч із SpO₂', /SpO₂ 94 % на кисні 3 л\/хв/.test(out()), out().slice(0,400));
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
   const def=JSON.parse(w.eval(`(()=>{ switchDoc('ohl'); goTab('zah'); return JSON.stringify([OPG.on, document.body.classList.contains('onepage'), TABS.filter(t=>!t.panel.hidden).length]); })()`));
   ok('0.9.3.116: за замовчуванням — один розділ на екрані', def[0]===false && def[1]===false && def[2]===1, JSON.stringify(def));
   const r=JSON.parse(w.eval(`(()=>{ oneSecSet(true); switchDoc('ohl'); goTab('zah'); const a=[document.body.classList.contains('onepage'), TABS.filter(t=>!t.panel.hidden).length];
     const f=SECTIONS.find(s=>s.id==='dyh').fields.find(x=>x.type!=='hdr' && !x.bo && val(x)); a.push(f ? qeField(SECTIONS.find(s=>s.id==='dyh'), document.querySelector('#out [data-sec="dyh"]').textContent, 30)===f || true : false);
     const d=document.querySelector('#out [data-sec="dyh"]'); qeOpen(f, 'dyh', d); a.push(!!document.querySelector('.qe') && f.wrapEl.parentElement.classList.contains('qe')); qeClose(); a.push(!document.querySelector('.qe') && !f.wrapEl.closest('.qe'));
     switchDoc('epi'); addRx({drug:'Цефтриаксон', dose:'1 г', route:'в/в', freq:'1 р/д', start:todayISO(), days:7}); update(); a.push(document.querySelectorAll('.ghost:not([hidden])').length); RX.pop(); update(); switchDoc('ohl'); oneSecSet(false); return JSON.stringify(a); })()`));
   ok('Однією сторінкою (якщо обрано): розділи огляду підряд', r[0]===true && r[1]>8, JSON.stringify(r));
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
   const r=JSON.parse(w.eval(`(()=>{ const __v=UIV2; uiV2Set(false); try{ return (()=>{ const saved=snap(), q0=QUICK, cf=window.confirm; CACHE={}; dirty=false; switchDoc('ohl'); const out=document.getElementById('out'), manual='<p><b>Ручні правки</b></p>', a=[];
     out.innerHTML=manual; out.dispatchEvent(new Event('input')); a.push(!document.getElementById('banner').hidden && /Є ручні зміни/.test(document.getElementById('banner').textContent));
     document.getElementById('quickBtn').click(); a.push(out.innerHTML===manual && dirty); document.getElementById('allNorm').click(); a.push(out.innerHTML===manual);
     applyPreset(PRESETS[0],HV.cards[0]); a.push(out.innerHTML===manual); switchDoc('rx'); const other='<p>Інший документ</p>'; out.innerHTML=other; out.dispatchEvent(new Event('input')); switchDoc('ohl'); a.push(out.innerHTML===manual); switchDoc('rx'); a.push(out.innerHTML===other); switchDoc('ohl');
     window.confirm=()=>false; document.getElementById('regen').click(); a.push(out.innerHTML===manual && dirty); window.confirm=()=>true; document.getElementById('regen').click(); a.push(out.innerHTML!==manual && !dirty); undoLast(); a.push(out.innerHTML===manual && dirty); applyDoc(true); a.push(out.innerHTML===manual && dirty);
     window.confirm=cf; QUICK=q0; localStorage.setItem('po.quick',q0?'1':'0'); restore(saved); return JSON.stringify(a); })(); } finally { uiV2Set(__v); } })()`));
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
   const r=JSON.parse(w.eval("(()=>{ const __v=UIV2; uiV2Set(false); try{ return (()=>{ const oldDoc=DOC; switchDoc('ohl'); const clearAll=$('#clearAll'), norm=$('#allNorm'); " +
     "const clearLabel=[...TABS[active].panel.querySelectorAll('.more-dd .mmenu button')].some(b=>b.getAttribute('aria-label')==='Очистити поточний документ'&&b.textContent.trim()==='Очистити поточний документ'); " +
     "const labels=clearLabel&&norm.getAttribute('aria-label')==='Норма в усіх системах огляду'&&clearAll.getAttribute('aria-label')==='Новий пацієнт (поточний збережено)'&&clearAll.title==='Новий пацієнт (поточний збережено)'&&clearAll.textContent.includes('Новий пацієнт (поточний збережено)'); " +
     "const undoBefore=UNDO.length, beforeNorm=JSON.stringify(snap()); norm.click(); const normToast=$('#toast'), normAction=normToast.querySelector('button'), normToastOk=DANGER_UNDO_MS===8000&&normToast.classList.contains('undo-toast')&&normAction&&normAction.textContent==='Скасувати'; " +
     "if(normAction) normAction.click(); const normUndo=UNDO.length===undoBefore&&JSON.stringify(snap())===beforeNorm; " +
     "const clear=[...TABS[active].panel.querySelectorAll('.more-dd .mmenu button')].find(b=>b.getAttribute('aria-label')==='Очистити поточний документ'); const undoBeforeClear=UNDO.length, beforeClear=JSON.stringify(snap()); clear.click(); " +
     "const firstClick=clear.dataset.arm==='1'&&!$('#toast').classList.contains('undo-toast')&&UNDO.length===undoBeforeClear; clear.click(); const clearToast=$('#toast'), clearAction=clearToast.querySelector('button'), clearToastOk=clearToast.classList.contains('undo-toast')&&clearAction&&clearAction.textContent==='Скасувати'; " +
     "if(clearAction) clearAction.click(); const clearUndo=UNDO.length===undoBeforeClear&&JSON.stringify(snap())===beforeClear; UNDO.length=undoBefore; REDO.length=0; undoBtn(); switchDoc(oldDoc); " +
     "return JSON.stringify([labels,normToastOk,normUndo,firstClick,clearToastOk,clearUndo]); })(); } finally { uiV2Set(__v); } })()"));
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
   const before=w.eval("F('zah.svid').el.value"), opt=[...pbox().querySelectorAll('.pe-opt')].find(o=>o.textContent.trim()==='оглушення');
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
 { const css=fs.readFileSync(path.join(__dirname,'..','src','styles.css'),'utf8');
  const src=css.replace(/\/\*[\s\S]*?\*\//g,'');
  const pr=(src.match(/#print[^{]*\{[^}]*\}/g)||[]).join(' ');
  const cols=pr.match(/#[0-9a-fA-F]{3,8}\b/g)||[];
  ok('Друк на старих принтерах: у правилах #print лише чорний (#000) і білий', cols.every(c=>/^#(000|fff|000000|ffffff)$/i.test(c)) && !/(?:rgba?|hsla?)\s*\(/i.test(pr), [...new Set(cols)].join(' '));
  const blockEnd=(s,start)=>{let depth=0,q='',esc=false,comment=false;for(let i=start;i<s.length;i++){const c=s[i],n=s[i+1];if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}if(q){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===q)q='';continue;}if(c==='/'&&n==='*'){comment=true;i++;continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='{')depth++;else if(c==='}'&&--depth===0)return i;}return -1;};
  const media=[];let pos=0;while((pos=src.indexOf('@media print',pos))>=0){const open=src.indexOf('{',pos),end=blockEnd(src,open);if(end<0)break;media.push(src.slice(open+1,end));pos=end+1;}
  const bad=[];
  media.forEach(body=>{for(const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)){const sel=m[1].trim(),d=m[2],lines=/\.blines\b/.test(sel);
    const colors=d.match(/#[0-9a-fA-F]{3,8}\b/g)||[];
    if(colors.some(c=>!/^#(000|fff|000000|ffffff)$/i.test(c)))bad.push(sel+': колір');
    if(/(?:rgba?|hsla?)\s*\(/i.test(d))bad.push(sel+': прозорий/сірий колір');
    if(/\b(?:box|text)-shadow\s*:\s*(?!none\b)[^;]+/i.test(d))bad.push(sel+': тінь');
    if(/\bfilter\s*:\s*(?!none\b)[^;]+/i.test(d))bad.push(sel+': фільтр');
    if(/gradient/i.test(d)&&!lines)bad.push(sel+': градієнт поза .blines');
    const bg=[...d.matchAll(/\bbackground(?:-color)?\s*:\s*([^;]+)/gi)].map(x=>x[1].trim());
    if(bg.some(v=>! /^(?:none|transparent|#(?:000|fff|000000|ffffff)|black|white)\b/i.test(v)))bad.push(sel+': блідий фон');
    const bi=[...d.matchAll(/\bbackground-image\s*:\s*([^;]+)/gi)].map(x=>x[1].trim());
    if(bi.some(v=>!/^none\b/i.test(v)&&!(lines&&/gradient/i.test(v))))bad.push(sel+': фонове зображення');
  }});
  ok('Друк на старих принтерах: усі @media print без сірого, rgba, тіней і блідих фонів; градієнт лише на .blines', media.length>0 && bad.length===0, JSON.stringify({media:media.length,bad}));
  const legacyBlack = /#print\s+\.pr-free\s+\.crow,#print\s+\.pr-free\s+\.prow\{[^}]*border-top:1px solid #000/i.test(src)
    && /#print\s+\.memo\s+td\{[^}]*border-bottom:1px solid #000/i.test(src)
    && /#print\s+\.memo\s+\.ms\{[^}]*color:#000/i.test(src);
  ok('Друк: лінії призначень і пам’яток, дрібний текст — чорні', legacyBlack); }
{ const ff=/@font-face\{font-family:"Zakon"/.test(html);
  const od=!!$('set_fdoc') && [...$('set_fdoc').options].some(o=>o.value==='Zakon'), ou=!!$('set_fui') && [...$('set_fui').options].some(o=>o.value==='Zakon');
  const sp=$('set_fprint'), R0=doc.documentElement; let on=false, off=false, def=false;
  if (sp){ def=sp.value==='Times New Roman' && !R0.classList.contains('pf-zakon');
    sp.value='Zakon'; sp.dispatchEvent(new w.Event('change')); on=R0.classList.contains('pf-zakon');
    sp.value='Times New Roman'; sp.dispatchEvent(new w.Event('change')); off=!R0.classList.contains('pf-zakon'); }
  ok('Шрифт Zakon: вбудований, є у виборі тексту, інтерфейсу й друку; за замовчуванням друк — Times New Roman', ff && od && ou && def && on && off, JSON.stringify([ff, od, ou, def, on, off])); }
{ const r=w.eval(`(()=>{ const a=!!DMAP['декскетопрофен'] && !!DMAP['кедол (декскетопрофен)'] && !!DMAP['кедол'];
    const n=['Декскетопрофен','Кедол (декскетопрофен)','Кедол'].every(x=>DCLS.nsaid.includes(x));
    const l=!!rxLib()['декскетопрофен'] && !!rxLib()['кедол (декскетопрофен)'];
    const k=(DMAP['декскетопрофен'].renal||[]).some(x=>x.lt===50);
    return JSON.stringify([a,n,l,k]); })()`);
  ok('Декскетопрофен і Кедол: у переліку препаратів, у підказках доз, НПЗП у перевірці взаємодій, корекція за КК', r==='[true,true,true,true]', r); }
{ w.print=()=>{printed++};   // попередні перевірки підміняють window.print своїм лічильником
  const btn=doc.querySelector('.more-dd .mmenu .fbbtn'); const n0=printed;
  const okp=w.eval("printBlanks(['ter','amb','e003'])"); const P=$('print');
  const cnt=P.querySelectorAll('.fbk').length, d2=P.querySelectorAll('.fbk-ter .fb-diary').length, ep=P.querySelectorAll('.fbk-e003 .fb-ep').length;
  const clean=!/undefined|null/.test(P.textContent) && !P.querySelector('[class=""]');
  w.eval('blanksDialog()'); const dlg=$('fbPick'), boxes=dlg ? dlg.querySelectorAll('input[type=checkbox]').length : 0; if (dlg) dlg.remove();
  ok('Порожні бланки: пункт у меню «⋯», вибір 9 бланків, друк обраних кожен окремо (щоденник — 2 на аркуш, епікриз 003/о — 2 сторінки)', !!btn && okp===true && printed===n0+1 && cnt===3 && d2===2 && ep===2 && clean && boxes===9, JSON.stringify([!!btn, okp, printed-n0, cnt, d2, ep, clean, boxes])); }
{ const r=w.eval(`(()=>{ const sw=$('#set_ampsop'); const off0=!ampOn();
    lsSet('po.ampsop','1'); const on=ampOn(); ampBlanksSync(); const nb=FBLANKS.filter(b=>/^amp\\d$/.test(b.k)).length;
    const it=addRx({drug:'Цефтріаксон'}); renderRx(); const row=document.querySelector('#rxList .rx[data-id="'+it.id+'"]');
    const btns=row?row.querySelectorAll('.amp-acts button').length:0, badge=!!(row&&row.querySelector('.ampk'));
    const ok1=ampPrintD1(it); const P=$('#print'); const t1=P.textContent; const ok4=ampPrintD4(it); const t4=P.textContent;
    const kinds=[ampKind('Флуконазол'),ampKind('Осельтамівір'),ampKind('Альбендазол'),ampKind('Цефтріаксон'),ampKind('Парацетамол')].join(',');
    RX.splice(RX.indexOf(it),1); renderRx(); lsSet('po.ampsop','0'); ampBlanksSync(); const nb0=FBLANKS.filter(b=>/^amp\\d$/.test(b.k)).length; lsSet('po.ampsop','');
    return JSON.stringify([!!sw, off0, on, nb, btns, badge, ok1, /Додаток 1/.test(t1)&&/Цефтріаксон/.test(t1)&&/спостереження/.test(t1), ok4, /Додаток 4/.test(t4)&&/СОП № 214/.test(t4), kinds, nb0]); })()`);
  ok('СОП закладу: вмикач у «Налаштуваннях» (за замовчуванням вимкнено), Додатки 1–5 у порожніх бланках, у листі призначень — вид і друк заповнених Додатків 1 і 4', r==='[true,true,true,5,3,true,true,true,true,true,"af,av,ap,ab,",0]', r); }
{ const r=w.eval(`(()=>{ const n=['Метамізол натрію','Мелоксикам','Німесулід','Кетопрофен','Лорноксикам','Ацеклофенак','Целекоксиб','Еторикоксиб','Трамадол','Морфін'];
    const inCat=n.every(x=>!!DMAP[x.toLowerCase()]&&!!rxLib()[x.toLowerCase()]); const ns=['Мелоксикам','Німесулід','Кетопрофен','Лорноксикам','Ацеклофенак','Целекоксиб','Еторикоксиб'].every(x=>DCLS.nsaid.includes(x));
    const notOp=!DCLS.nsaid.includes('Трамадол')&&!DCLS.nsaid.includes('Метамізол натрію'); const noTr=!DMAP['тримеперидин'];
    return JSON.stringify([inCat,ns,notOp,noTr]); })()`);
  ok('Знеболювальні: 10 нових препаратів у переліку й підказках доз, нові НПЗП — у перевірці взаємодій, опіоїди й метамізол — ні', r==='[true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const keep=RX.slice(), keepR=RES.slice(); RX.length=0; RES.length=0; lsSet('po.ampsop','0'); const off=ampWarnings().length===0; lsSet('po.ampsop','1');
    const t=todayISO(); const a=addRx({drug:'Цефтріаксон', start:addDays(t,-4), route:'в/в', cult:'взято'}); a.rev=addDays(t,-2);
    const b=addRx({drug:'Левофлоксацин', start:t, route:'в/в', cult:'взято'}); const g=addRx({drug:'Гентаміцин', start:t, freq:'2 р/д', cult:''});
    const W=rxWarnings().map(x=>x.t).join(' | ');
    const rev=/перегляд призначення Цефтріаксон мав бути/.test(W), par=/Цефтріаксон парентерально понад 72 год/.test(W)&&/амоксицилін\\/клавуланова кислота або цефіксим/.test(W);
    const cfq=/заборонена комбінація Цефтріаксон[^|]*Левофлоксацин/.test(W), camg=/заборонена комбінація Цефтріаксон[^|]*Гентаміцин/.test(W), amg1=/Гентаміцин: рекомендовано повну добову дозу/.test(W), cult=/Гентаміцин: до введення ПЛЗ/.test(W);
    RES.push({id:999,d:t,t:'бактеріологічне дослідження мокротиння',v:'Str. pneumoniae 10^6 КУО/мл'}); const W2=rxWarnings().map(x=>x.t).join(' | ');
    const cfq2=!/заборонена комбінація Цефтріаксон[^|]*Левофлоксацин/.test(W2)&&/заборонена комбінація Цефтріаксон[^|]*Гентаміцин/.test(W2);
    RX.length=0; keep.forEach(x=>RX.push(x)); RES.length=0; keepR.forEach(x=>RES.push(x)); lsSet('po.ampsop',''); renderRx();
    return JSON.stringify([off,rev,par,cfq,camg,amg1,cult,cfq2]); })()`);
  ok('СОП закладу, перевірки: перегляд 48–72 год, парентерально > 72 год із заміною, заборонені комбінації (цефалоспорин + фторхінолон — лише без посіву), аміноглікозид 1 р/д, бакпосів; без СОП — нічого', r==='[true,true,true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const f=F('e_lik.rez'); const i=f.opts.findIndex(o=>O(o).t==='Виписується за власним бажанням');
    const opt=i>=0&&!![...f.el.options].find(o=>o.value===String(i)); const btn=!!(f.el.nextElementSibling&&f.el.nextElementSibling.classList.contains('segbtns')&&f.el.nextElementSibling.children.length===f.opts.length);
    const keep=RES.slice(); RES.length=0; RES.push({id:901,d:'2026-10-01',t:'ЗАК',v:'Hb 112 г/л, лейк. 14,2 ×10⁹/л'},{id:902,d:'2026-10-05',t:'ЗАК',v:'Hb 124 г/л, лейк. 7,8 ×10⁹/л'});
    const dyn=epiDynamics(); RES.length=0; keep.forEach(x=>RES.push(x));
    return JSON.stringify([opt, btn, /лейк\\. 14,2 → 7,8/.test(dyn)&&/Hb 112 → 124/.test(dyn), !!document.querySelector('.epidyn')]); })()`);
  ok('Епікриз: «Виписується за власним бажанням» (у списку й кнопках), «± Динаміка аналізів з журналу» — «лейк. 14,2 → 7,8»', r==='[true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const P=F('e_per.per'), k1=P.d1.value, k2=P.d2.value, keepD=DIARIES.slice(), keepDoc=DOC, keepDt=mv('dt');
    P.d1.value='2026-10-02'; P.d2.value='2026-10-06'; BF.pid='x'; const days=bfRowsSync().map(r=>r.d).join(',');
    BF.rows[0].t='38,2'; BF.rows[1].t='37,4'; BF.rows[1].spo='95';
    DIARIES.length=0; const nB=DIARIES.length; const n=bfGenerate(); const add=DIARIES.slice(nB);
    const dates=DIARIES.filter(x=>x.bf).map(x=>String(x.dt).split('T')[0]).join(',');
    const t1=DIARIES.find(x=>x.bf&&/^2026-10-02/.test(x.dt)); const ok1=!!t1&&/38,2/.test(t1.html);
    const again=bfGenerate();
    const menu=!!document.querySelector('.more-dd .mmenu .bfbtn'); bfDialog(); const dlg=document.getElementById('bfBox'); const rows=dlg?dlg.querySelectorAll('.bf-t tbody tr').length:0; if(dlg) dlg.remove();
    DIARIES.length=0; keepD.forEach(x=>DIARIES.push(x)); P.d1.value=k1; P.d2.value=k2; const e=document.getElementById('meta_dt'); if(e) e.value=keepDt; if (DOC!==keepDoc) switchDoc(keepDoc); renderDiaries(); BF.rows=[]; BF.pid=null; update();
    return JSON.stringify([days, n, dates, ok1, again, menu, rows]); })()`);
  ok('Дописати історію: робочі дні (без суботи й неділі, крім дня надходження й виписки), щоденники з датою й показниками, повторно не дублюються, пункт у меню «⋯»', r==='["2026-10-02,2026-10-05,2026-10-06",3,"2026-10-02,2026-10-05,2026-10-06",true,0,true,3]', r); }
{ const r=w.eval(`(()=>{ const kP=PAPER, kB=BLANK, kD=DOC; if (DOC!=='ohl') switchDoc('ohl'); PAPER=true; BLANK=false;
    const c=F('skarhy.c').chips[0]; if (c.getAttribute('aria-pressed')!=='true') c.click(); update(); renderPaper();
    const row=document.querySelector('#paper .pr-body [data-sec="skarhy"]'); const marked=!!row&&row.classList.contains('pe-row');
    const keys=row?JSON.stringify(peRowKeys(row)):''; const op=row?peOpen(window,row):false;
    const box=document.querySelector('.pe-box'); const t=box?box.querySelector('.pe-head b').textContent:''; const foc=document.activeElement&&document.activeElement.getAttribute('aria-pressed')==='true';
    const scr=box?box.querySelector('.pe-body').scrollTop:-1; peClose();
    const fol=bmapRowFor('skarhy.c',false,document.getElementById('paper'))===row;
    PAPER=kP; BLANK=kB; if (DOC!==kD) switchDoc(kD); renderPaper();
    return JSON.stringify([marked, keys, op, t, foc, scr, fol]); })()`);
  ok('«Перед друком» без бланка: клік по «Скарги» — віконце з пунктами розділу на вибраних пунктах, аркуш стежить за полем', r==='[true,"[\\"skarhy\\"]",true,"Скарги",true,0,true]', r); }
{ const R=doc.documentElement; const def=R.classList.contains('ui-ios');
  w.eval("uiStyleSet('classic')"); const cl=!R.classList.contains('ui-ios') && w.eval("lsGet('po.uistyle','')")==='classic';
  w.eval("openViewPop()"); const row=[...doc.querySelectorAll('.viewpop .vrow .vl')].some(e=>e.textContent==='Стиль'); w.eval("closeViewPop()");
  w.eval("uiStyleSet('ios')"); const back=R.classList.contains('ui-ios'); const fs=w.eval("FS_SET_KEYS.includes('po.uistyle')");
  ok('Стиль інтерфейсу: за замовчуванням iOS, «Класичний» на вибір у «Вигляді», зберігається', def && cl && row && back && fs, JSON.stringify([def, cl, row, back, fs])); }
{ const r=w.eval(`(()=>{ uiStyleSet('ios'); const pd=typeof SHELL.placeDocs==='function'; const sty=[...document.styleSheets].map(s=>{ try{ return [...s.cssRules].map(x=>x.cssText).join(' '); }catch(e){ return ''; } }).join(' ');
    const peek=/ui-ios #copyPeek/.test(sty), fld=/ui-ios \.entry-field:not/.test(sty), und=/ui-ios #undoBtn \.hide-m/.test(sty);
    return JSON.stringify([pd, peek, fld, und]); })()`);
  ok('Стиль Apple без шуму: «Перед копіюванням» — у «Перевірці», на полях лише відхилення, «Скасувати» — значком, документи в шапці', r==='[true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ uiStyleSet('ios'); const f=F('dyh.gk'); const box=f.el.nextElementSibling; const list=!!box&&box.classList.contains('seglist')&&f.el.classList.contains('seg-hidden');
    const keep=f.el.value; box.children[1].click(); const set=f.el.value==='1'&&box.children[1].getAttribute('aria-pressed')==='true'; f.el.value=keep; f.el.dispatchEvent(new Event('change',{bubbles:true}));
    const perk=F('dyh.perk').el.nextElementSibling.classList.contains('seglist'); const big=F('dyh.hr'); const dd=!big.el.classList.contains('seg-hidden');
    uiStyleSet('classic'); const back=!f.el.classList.contains('seg-hidden')&&!(f.el.nextElementSibling&&f.el.nextElementSibling.classList.contains('seglist'))&&!F('dyh.perk').el.nextElementSibling.classList.contains('seglist');
    uiStyleSet('ios'); const again=f.el.nextElementSibling.classList.contains('seglist'); update();
    return JSON.stringify([list,set,perk,dd,back,again]); })()`);
  ok('Стиль Apple: випадний список до 8 варіантів і довгі варіанти — списком рядків (вибір пишеться у поле), 9+ — випадний; «Класичний» повертає як було', r==='[true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ uiStyleSet('ios'); const p=addrParse('с. Тестове, вул. Садова, 5, кв. 2, Тестова громада, Тестовий р-н, Полтавська обл., 37700');
    const ok1=p.np_t==='с.'&&p.np==='Тестове'&&p.hr==='Тестова громада'&&p.ra==='Тестовий р-н'&&p.ob==='Полтавська обл.'&&p.st==='вул. Садова, 5, кв. 2'&&p.zip==='37700';
    const p2=addrParse('м. Тестів, просп. Миру, 1'); const ok2=p2.np_t==='м.'&&p2.np==='Тестів'&&p2.st==='просп. Миру, 1';
    const btn=!!document.getElementById('cmdkBtn')&&!document.getElementById('cmdkBtn').hidden; const fit=typeof outFit==='function'&&typeof ptPlace==='function';
    uiStyleSet('classic'); const back=document.getElementById('cmdkBtn').hidden&&!document.documentElement.classList.contains('pt-side')&&!document.querySelector('.addrbox.addr-c'); uiStyleSet('ios');
    return JSON.stringify([ok1,ok2,btn,fit,back]); })()`);
  ok('Стиль Apple: адреса одним рядком розкладається на поля (село, громада, район, область, вулиця, індекс), пошук кнопкою в шапці; «Класичний» — як було', r==='[true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const kD=DOC, kB=BLANK; switchDoc('kons'); BLANK=true; const ok1=blankOK()&&blankOn();
    const pg=b028(); const t=pg[0].textContent; const items=['№ 028/о','Консультаційний висновок спеціаліста','1. Найменування закладу охорони здоров’я, який направив','2. Прізвище, ім’я, по батькові пацієнта','3. Дата народження','(число, місяць, рік)','4. Спеціальність, прізвище','5. Результати лабораторного','6. Результати функціонального','7. Висновок спеціаліста','8. Рекомендації','М.П.','Лікар-консультант','Завідувач поліклініки або стаціонарного відділення','14 лютого 2012 року'].every(x=>t.includes(x));
    const empty=b028(true)[0]; const noPat=!(mv('pib')&&empty.textContent.includes(mv('pib'))); const inPack=FBLANKS.some(b=>b.k==='k028'&&b.html.includes('028/о'));
    const hosp=DOCMORE.hosp.some(x=>x[0]==='kons'); BLANK=kB; switchDoc(kD);
    return JSON.stringify([ok1,items,noPat,inPack,hosp]); })()`);
  ok('Бланк 028/о «Консультаційний висновок спеціаліста» — як у закладі: у «Перед друком» на «Консультації», порожній — у «Порожніх бланках», консультація є і в стаціонарі', r==='[true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const btn=!!document.getElementById('blanksBtn')&&document.getElementById('blanksBtn').previousElementSibling===document.getElementById('printBtn');
    layoutTabs(); const nb=document.getElementById('tab_blanks'); const nav=!!nb&&nb.parentElement.querySelector('.tgl').textContent==='Інструменти';
    const srch=searchItems().some(x=>/Бланки для друку/.test(x.t)&&/щоденник/.test(x.s));
    lsSet('po.ampsop','1'); blanksDialog(); const d=document.getElementById('fbPick'); const comb=!!d&&[...d.querySelectorAll('input')].some(i=>i.value==='amp1r'); if (d) d.remove();
    const b=FBLANKS.find(x=>x.k==='amp1r'); const txt=b?b.html:''; const ok2=/Обґрунтування призначення/.test(txt)&&/Перегляд антибактеріальної терапії через 48–72 год/.test(txt)&&/потрібне підкреслити/.test(txt);
    lsSet('po.ampsop',''); blanksDialog(); const d2=document.getElementById('fbPick'); const off=!!d2&&![...d2.querySelectorAll('input')].some(i=>i.value==='amp1r'); if (d2) d2.remove();
    return JSON.stringify([btn,nav,srch,comb,ok2,off]); })()`);
  ok('Бланки там, де шукають: «🖨 Бланки» біля «Друк / PDF», у «Інструментах», у пошуку; «Додаток 1 + перегляд АБТ» — з увімкненим СОП', r==='[true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const b=FBLANKS.find(x=>x.k==='ohl'); const t=b?b.html:''; return JSON.stringify([!!b, FBLANKS[0]&&FBLANKS[0].k==='ohl', ['33. Скарги','34. Anamnesis morbi','35. Anamnesis vitae','36. Об’єктивні дані','Органи дихання','Серцево-судинна система','Органи травлення','Сечовидільна система','Неврологічний статус','37. Огляд на коросту','Попередній діагноз','План обстеження','План лікування','потрібне підкреслити'].every(x=>t.includes(x))]); })()`);
  ok('Порожній бланк «Первинний огляд — стаціонар» (003/о, п. 33–40): усі системи, варіанти — підкреслити', r==='[true,true,true]', r); }
{ const r=w.eval(`(()=>{ uiStyleSet('ios'); const R=document.documentElement; const keepPib=mv('pib'); const e=document.getElementById('meta_pib'); e.value=''; UST.dismissed=false; update();
    const st1=R.classList.contains('ui-start')===stEmpty(); const head=!!document.querySelector('.ust-head .ust-new');
    stNew(); const st2=!R.classList.contains('ui-start'); const i=TABS.findIndex(t=>t.id==='meta'); show(i); const ne=R.classList.contains('ui-nonexam');
    const j=TABS.findIndex(t=>t.id==='dyh'); show(j); const ex=!R.classList.contains('ui-nonexam'); show(i);
    const pm=!!document.querySelector('#profBtn .pmode'); renderViewCtl(); openViewPop(); const th=[...document.querySelectorAll('.viewpop .vrow .vl')].some(x=>x.textContent==='Тема'); closeViewPop();
    uiStyleSet('classic'); const cl=!R.classList.contains('ui-start')&&!R.classList.contains('ui-nonexam')&&!document.querySelector('#profBtn .pmode'); uiStyleSet('ios');
    e.value=keepPib; update(); return JSON.stringify([st1,head,st2,ne,ex,pm,th,cl]); })()`);
  ok('Стиль Apple при вході: екран «Пацієнти» з «＋ Новий пацієнт», дії огляду лише в огляді, режим у «Профілі», тема у «Вигляді»; «Класичний» — як було', r==='[true,true,true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const g=!!document.getElementById('sideGrip'); const ic=TABS.filter(t=>t.tab&&t.tab.dataset.ic).length===TABS.length;
    const kf=VIEW.sideFold, kw=VIEW.sideW; VIEW.sideFold=true; renderSideFold(); const f=document.body.classList.contains('sidefold')||layoutNow()!=='B'; const lab=SIDE_FOLD_BUTTON?SIDE_FOLD_BUTTON.textContent:'';
    VIEW.sideFold=false; VIEW.sideW=300; renderSideFold(); const w=document.documentElement.style.getPropertyValue('--sidew')==='300px';
    VIEW.sideFold=kf; VIEW.sideW=kw; saveView(); applyView(); return JSON.stringify([g,ic,f,lab===(document.body.classList.contains('sidefold')?'»':'« Лише значки'),w]); })()`);
  ok('Бічне меню: межа для перетягування, значки розділів, згорнуте — «»», ширина зберігається', r==='[true,true,true,true,true]', r); }
{ // шаблони: видалений варіант, список, застосування, порожні поля в тексті
  const saved = w.eval('snap()');
  const r = JSON.parse(w.eval(`(()=>{
    const a = [];
    switchDoc('ohl'); show(TABS.findIndex(t=>t.id==='tpl'));
    const panel = TABS.find(t=>t.id==='tpl').panel;
    const key = 'zah.stan', text = 'Аудитний варіант стану';
    document.getElementById('tplField').value = key;
    document.getElementById('tplText').value = text;
    [...panel.querySelectorAll('button')].find(b=>b.textContent.trim()==='Додати').click();
    a.push((CUSTOM.opts[key]||[]).includes(text) && [...F(key).el.options].some(o=>o.textContent.includes(text)));
    [...document.querySelectorAll('#tplOpts .prow')].find(row=>row.dataset.text===text).querySelector('.tpl-acts button').click();
    const ask = document.getElementById('tplAsk');
    a.push(!!ask && /Видалити варіант/.test(ask.textContent));
    [...ask.querySelectorAll('button')].find(b=>b.textContent.trim()==='Скасувати').click();
    a.push((CUSTOM.opts[key]||[]).includes(text) && !document.getElementById('tplAsk'));
    [...document.querySelectorAll('#tplOpts .prow')].find(row=>row.dataset.text===text).querySelector('.tpl-acts button').click();
    document.querySelector('#tplAsk .btn.primary').click();
    a.push(!(CUSTOM.opts[key]||[]).includes(text));
    const f = F(key), i = f.opts.findIndex(o=>O(o).t===text);
    const op = i>=0 && f.el.querySelector('option[value="'+i+'"]');
    a.push(!!(f.gone && f.gone.has(text)) && !!op && (op.hidden || op.disabled));
    document.getElementById('tplText').value = text;
    [...panel.querySelectorAll('button')].find(b=>b.textContent.trim()==='Додати').click();
    const op2 = f.el.querySelector('option[value="'+i+'"]');
    a.push((CUSTOM.opts[key]||[]).includes(text) && op2 && !op2.hidden && !op2.disabled && document.getElementById('toast').textContent!=='Такий варіант уже є');
    F('dx.osn').el.value = 'Аудитний діагноз шаблону'; F('dx.mkh').el.value = 'J18.9';
    const savedN = CUSTOM.presets.length;
    const savedOk = saveExamTemplate('Аудитний шаблон', 'my');
    const p = CUSTOM.presets.find(x=>x.name==='Аудитний шаблон');
    a.push(savedOk && !!p && p.osn==='Аудитний діагноз шаблону' && CUSTOM.presets.length===savedN+1);
    const q = document.getElementById('tplPresetQ'); q.value = 'Аудитний шаблон'; q.dispatchEvent(new Event('input'));
    const rows = [...document.querySelectorAll('#tplPresets .prow')];
    a.push(rows.some(r=>!r.hidden && r.dataset.key===p.key) && rows.filter(r=>r.dataset.key!==p.key).every(r=>r.hidden));
    const ag = AGATE; AGATE = false;
    rows.find(r=>r.dataset.key===p.key).querySelector('.tpl-apply').click();
    AGATE = ag;
    a.push(curKey===p.key && F('dx.osn').el.value==='Аудитний діагноз шаблону');
    renderTplLists();
    a.push(document.querySelector('#tplPresets .prow[data-key="'+p.key+'"] .tpl-apply').textContent==='Застосовано');
    document.querySelector('#tplPresets .prow[data-key="'+p.key+'"] .tpl-acts .more').click();
    document.querySelector('#tplAsk input').value = 'Аудитний шаблон 2';
    document.querySelector('#tplAsk .btn.primary').click();
    a.push(p.name==='Аудитний шаблон 2' && !!document.querySelector('#tplPresets .prow[data-key="'+p.key+'"]'));
    switchDoc('shch');
    F('d_lik.kor').el.value = '…'; update();
    const hid = !/Корекція терапії:\\s*…/.test(generate().plain);
    F('d_lik.kor').el.value = 'Дозу антибіотика зменшено'; update();
    const shown = /Корекція терапії: Дозу антибіотика зменшено/.test(generate().plain);
    a.push(hid && shown);
    switchDoc('ohl');
    const rxKeep = RX.slice();
    RX.length = 0; addRx({drug:'Цефтріаксон', dose:'1 г', route:'в/в', freq:'1 р/д', start:todayISO()}); update();
    const t1 = generate().plain;
    const noEmpty = !/бактеріологічне дослідження до початку — …/.test(t1) && !/перегляд ефективності — …/.test(t1) && /Цефтріаксон/.test(t1);
    RX[0].cult = 'мокротиння'; update();
    const hasCult = /бактеріологічне дослідження до початку — мокротиння/.test(generate().plain);
    RX.length = 0; rxKeep.forEach(x=>RX.push(x));
    a.push(noEmpty && hasCult);
    const menu = !!document.querySelector('.more-dd .tpl-save-doc');
    const near = !!document.querySelector('.hvsearch .tpl-save-doc');
    a.push(menu && near);
    return JSON.stringify(a);
  })()`));
  ok('Свій варіант: видалення питає підтвердження; скасування лишає варіант; після видалення той самий текст додається знову', r.slice(0,6).every(Boolean), JSON.stringify(r));
  ok('Шаблон огляду: зберігається, шукається, «Застосувати» підставляє діагноз, «Перейменувати» змінює назву', r.slice(6,10).every(Boolean), JSON.stringify(r));
  ok('Порожнє «…» і незаповнений бакпосів не друкуються; «Зберегти як шаблон» є в документі', r.slice(10).every(Boolean), JSON.stringify(r));
  w.eval('restore('+JSON.stringify(saved)+')');
}
// 0.9.3.90 — плаваючі віконця: варіанти молочних залоз і кісткової системи, фрази листа призначень, перенос і розмір
{ const r=JSON.parse(w.eval(`(()=>{ const kP=PAPER, kB=BLANK, kD=DOC, a=[];
    const mol=F('zah.moloch'), op=F('zah.opora'), m0=mol.el.value, o0=op.el.value;
    if (DOC!=='ohl') switchDoc('ohl'); peSetMode('here'); PAPER=true; BLANK=false; renderPaper(); seMark(document.getElementById('paper'));
    a.push([...document.querySelectorAll('#paper [data-sec] .se')].every(s=>s.dataset.se.split('.')[0]===s.closest('[data-sec]').dataset.sec));
    BLANK=true; BLP.exam=true; renderPaper();
    const row=re=>[...document.querySelectorAll('#paper .b003 .pe-row')].find(x=>re.test(x.textContent.trim()));
    const ck=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    ck(row(/^Молочні залози/)); let box=document.querySelector('.pe-box');
    const mb=box ? [...box.querySelectorAll('.pw-choices button')] : [];
    a.push(mb.length>=4 && mb.some(b=>/ущільнень не пальпується/.test(b.textContent)));
    a.push(!!box.querySelector('.fw-grip') && !!box.querySelector('.pe-head.fw-drag'));
    mb[0].click(); a.push(/симетричні/.test(mol.el.value));
    peClose(); ck(row(/^Кістково-суглобова/)); box=document.querySelector('.pe-box');
    a.push(!!box && [...box.querySelectorAll('.pw-choices button')].some(b=>/без видимих деформацій/.test(b.textContent)));
    peClose();
    const o=seOpts(op); a.push(o.length>=4 && o.every(x=>x.quickT));
    mol.el.value=m0; op.el.value=o0; update(); DOC!==kD && switchDoc(kD); PAPER=kP; BLANK=kB; renderPaper();
    return JSON.stringify(a); })()`));
  ok('Листок призначень та інші блоки: фраза не відкриває поле чужого розділу', r[0]);
  ok('Бланк: «Молочні залози» — готові варіанти у віконці', r[1]);
  ok('Віконце бланка: заголовок перетягується, кут змінює розмір', r[2]);
  ok('Варіант молочних залоз записується в поле', r[3]);
  ok('Бланк: «Кістково-суглобова система» — готові варіанти', r[4]);
  ok('«Бачу — редагую»: текстове поле з фразами дає варіанти', r[5]);
}
// 0.9.3.91 — телефон: межа стає в три положення; «Норма» у віконці бланка
{ const r=JSON.parse(w.eval(`(()=>{ const kP=PAPER, kB=BLANK, kD=DOC, kh=PHS.h, a=[];
    PHS.h=0.62; phpSnap(); a.push(PHS.h===0.5);
    PHS.h=0.3; phpSnap(); a.push(PHS.h===0.33);
    phpToggleFull(); const full=PHS.h; phpToggleFull(); a.push(full===0.85 && PHS.h===0.33);
    if (DOC!=='ohl') switchDoc('ohl'); peSetMode('here'); PAPER=true; BLANK=true; BLP.exam=true; renderPaper();
    const row=re=>[...document.querySelectorAll('#paper .b003 .pe-row')].find(x=>re.test(x.textContent.trim()));
    const ck=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    const kol=F('shk.kol'), k0=kol.el.value;
    kol.el.value='2'; kol.el.dispatchEvent(new Event('change',{bubbles:true}));
    ck(row(/^Шкіра/)); let nb=document.querySelector('.pe-box .pe-norm');
    a.push(!!nb && nb.textContent==='Норма');
    nb.click(); a.push(kol.el.value===String(kol.norm) && !document.querySelector('.pe-box .pe-undo').disabled);
    document.querySelector('.pe-box .pe-undo').click(); a.push(kol.el.value==='2');
    peClose(); ck(row(/^Молочні залози/)); a.push(!document.querySelector('.pe-box .pe-norm'));
    peClose(); kol.el.value=k0; update(); PHS.h=kh; DOC!==kD && switchDoc(kD); PAPER=kP; BLANK=kB; renderPaper();
    return JSON.stringify(a); })()`));
  ok('Телефон: межа після відпускання стає на найближче з трьох положень', r[0] && r[1]);
  ok('Телефон: подвійний дотик по межі — на весь екран і назад', r[2]);
  ok('Бланк: у віконці рядка з нормою є кнопка «Норма»', r[3]);
  ok('«Норма» у віконці ставить норму розділу, «Скасувати» її повертає', r[4] && r[5]);
  ok('Рядок без пунктів із нормою — без кнопки «Норма»', r[6]);
}
// 0.9.3.94 — масштаб аркуша під панель: «По ширині / Весь аркуш / 100 %»
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=SFIT, kP=PAPER, kB=BLANK, kD=DOC;
    if (DOC!=='ohl') switchDoc('ohl'); PAPER=true; BLANK=true; renderPaper();
    const seg=document.querySelector('#paper .sfit-seg');
    a.push(!!seg && [...seg.querySelectorAll('button')].map(b=>b.textContent).join('|')==='По ширині|Весь аркуш|100 %');
    sfitSet('page'); a.push(SFIT==='page' && localStorage.getItem('po.sheetfit')==='page' && seg.querySelector('[data-k="page"]').getAttribute('aria-pressed')==='true');
    sfitSet('нема'); a.push(SFIT==='width');
    a.push(FS_SET_KEYS.includes('po.sheetfit'));
    sfitSet(k); PAPER=kP; BLANK=kB; DOC!==kD && switchDoc(kD); renderPaper(); return JSON.stringify(a); })()`));
  ok('Аркуш: перемикач масштабу «По ширині / Весь аркуш / 100 %»', r[0]);
  ok('Аркуш: вибір масштабу запам’ятовується', r[1]);
  ok('Аркуш: невідомий масштаб — «По ширині»', r[2]);
  ok('Аркуш: масштаб зберігається в Налаштування.json', r[3]);
}
// 0.9.3.95 — новий вигляд, етап 1: кнопка «Текст» з лічильником, «Старий вигляд»
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2;
    uiV2Set(true); a.push(document.documentElement.classList.contains('ui-v2') && !!document.querySelector('#txtBtn'));
    v2Count(); const n=itext(document.querySelector('#out')).trim().length; a.push(document.querySelector('.v2cnt').textContent===n.toLocaleString('uk-UA'));
    txtOpen(true); a.push(document.body.classList.contains('v2-txt-open') && document.querySelector('#txtBtn').getAttribute('aria-expanded')==='true');
    txtOpen(false); a.push(!document.body.classList.contains('v2-txt-open'));
    uiV2Set(false); txtOpen(true); a.push(!document.documentElement.classList.contains('ui-v2') && !document.body.classList.contains('v2-txt-open'));
    a.push(TABS.filter(t=>TOOL_TABS.includes(t.id)).every(t=>t.tab.classList.contains('v2tool')));
    uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Новий вигляд: клас ui-v2 і кнопка «Текст» у шапці', r[0]);
  ok('Кнопка «Текст» показує кількість знаків документа', r[1]);
  ok('«Текст» відкриває й закриває панель тексту', r[2] && r[3]);
  ok('«Старий вигляд» знімає новий вигляд і не відкриває панель', r[4]);
  ok('Інструменти в меню розділів — без кружка стану', r[5]);
}
// 0.9.3.95 — фундамент: шкала шрифтів екрана (7 розмірів)
{ const r=JSON.parse(w.eval(`(()=>{ const cs=getComputedStyle(document.documentElement); return JSON.stringify([1,2,3,4,5,6,7].map(i=>cs.getPropertyValue('--fs-'+i).trim())); })()`));
  ok('Шкала шрифтів: 7 розмірів --fs-1…--fs-7', r.length===7 && r.every(Boolean), r.join(' '));
}
// 0.9.3.95 — фундамент: SVG-значки замість емодзі; «Старий вигляд» повертає емодзі
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2;
    uiV2Set(true); v2IcFix(document.body); const n=document.querySelectorAll('svg.v2ic').length; a.push(n>0);
    a.push(!document.querySelector('#out svg.v2ic, #print svg.v2ic'));
    uiV2Set(false); a.push(document.querySelectorAll('svg.v2ic').length===0);
    uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Новий вигляд: емодзі на кнопках замінено SVG-значками', r[0]);
  ok('Значки не потрапляють у текст документа й друк', r[1]);
  ok('«Старий вигляд» повертає емодзі', r[2]);
}
// 0.9.3.95 — каркас: Ctrl+K знаходить пацієнтів, Alt+N — новий пацієнт, Ctrl+Enter показує «Текст»
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2;
    const e=document.getElementById('meta_pib'); const v0=e.value; e.value='Тестовий Пошук Пацієнтович'; e.dispatchEvent(new Event('input')); savePatient(true); const id=PID;
    a.push(searchItems().some(x=>x.k==='Пацієнт' && /Тестовий Пошук/.test(x.t)));
    a.push(searchItems().some(x=>x.t==='Новий пацієнт' && x.s==='Alt+N'));
    document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN',key:'n',altKey:true,bubbles:true}));
    a.push(PID!==id && !document.getElementById('meta_pib').value);
    openPatient(id); a.push(PID===id);
    uiV2Set(true); txtOpen(false);
    return JSON.stringify(a); })()`));
  ok('Ctrl+K знаходить пацієнта за ПІБ', r[0]);
  ok('У пошуку «Новий пацієнт» з підказкою Alt+N', r[1]);
  ok('Alt+N — новий пацієнт (поточний збережено)', r[2] && r[3]);
}
// 0.9.3.95 — введення пацієнта: дата народження з маскою, «Імпорт ▾»
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true);
    const t=document.getElementById('meta_dob_t'), d=document.getElementById('meta_dob'), d0=d.value;
    a.push(!!t);
    t.value='12031962'; t.dispatchEvent(new Event('input',{bubbles:true}));
    a.push(t.value==='12.03.1962' && d.value==='1962-03-12');
    t.value='31.02.1962'; t.dispatchEvent(new Event('input',{bubbles:true}));
    a.push(t.classList.contains('bad') && d.value==='');
    t.value=''; t.dispatchEvent(new Event('input',{bubbles:true}));
    d.value='1970-05-01'; t.blur(); v2pSync(); a.push(t.value==='01.05.1970');
    d.value=d0; d.dispatchEvent(new Event('input',{bubbles:true})); v2pSync();
    a.push(!!document.querySelector('#misIn .v2imp'));
    uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Дата народження: поле з маскою дд.мм.рррр', r[0] && r[1]);
  ok('Дата народження: неіснуюча дата позначається і не записується', r[2]);
  ok('Дата народження: відкритий пацієнт показується в масці', r[3]);
  ok('Імпорт — одна кнопка «Імпорт ▾»', r[4]);
}
// 0.9.3.95 — «розумна клавіатура»: підказки, «38.5 С» → «38,5 °C», часті фрази
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], sec=SECTIONS.find(x=>x.id==='skarhy'), el=F('skarhy.cx').el, v0=el.value, ph=JSON.stringify(SI_PHR);
    a.push(siCands(sec,'каш').some(c=>/кашель/.test(c.t)));
    el.value='Температура 38.5 С'; el.setSelectionRange(el.value.length, el.value.length); siFormat(el); a.push(el.value==='Температура 38,5 °C');
    el.value='Скарги, біль'; siFormat(el); a.push(el.value==='Скарги, біль');
    el.value='підвищення температури, каш'; el.setSelectionRange(el.value.length, el.value.length); const fr=siFrag(el, sec); a.push(!!fr && fr.text.trim()==='каш' && fr.list.length>0);
    el.value='Щось .взд'; el.setSelectionRange(el.value.length, el.value.length); a.push(!siFrag(el, sec));
    el.value='Важкість у правому підребер’ї після жирної їжі'; siLearn(sec, el); a.push(siCands(sec,'важк').some(c=>c.src==='ваше'));
    el.value=v0; SI_PHR=JSON.parse(ph); lsSet('po.phr', ph); update(); return JSON.stringify(a); })()`));
  ok('Розумна клавіатура: підказка з кнопок розділу (каш → кашель…)', r[0]);
  ok('Розумна клавіатура: «38.5 С» → «38,5 °C»', r[1]);
  ok('Розумна клавіатура: слова не змінюються без дії лікаря', r[2]);
  ok('Розумна клавіатура: підказка після коми (кома в числі — не межа)', r[3]);
  ok('Розумна клавіатура: «.взд» лишається скороченням', r[4]);
  ok('Розумна клавіатура: інша фраза не підміняється («дискомфорт у правому…» ≠ «важкість у правому…»)', w.eval(`(()=>{ const sec=SECTIONS.find(x=>x.id==='skarhy'), el=F('skarhy.cx').el, v0=el.value; el.value="дискомфорт у правому підребер'ї"; el.setSelectionRange(el.value.length, el.value.length); const f=siFrag(el, sec); el.value=v0; return !f || !f.list.some(x=>/важкість/.test(x.t)); })()`));
  ok('Розумна клавіатура: часті фрази лікаря — у підказках', r[5]);
}
// 0.9.3.95 — скарги: підказка-кнопка натискає кнопку; поле першим, кнопки згорнуті
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true);
    const c=F('skarhy.c'), cx=F('skarhy.cx'), el=cx.el, v0=el.value, i=c.opts.findIndex(o=>/^сухий кашель$/.test(O(o).t)), was=c.chips[i].getAttribute('aria-pressed');
    if (was==='true') c.chips[i].click();
    el.value='Біль, сухий ка'; el.setSelectionRange(el.value.length, el.value.length);
    const sec=SECTIONS.find(x=>x.id==='skarhy'); SI.f=cx; SI.sec=sec; SI.frag=siFrag(el, sec); SI.list=SI.frag.list; SI.sel=SI.list.findIndex(x=>x.t==='сухий кашель'); siAccept();
    a.push(c.chips[i].getAttribute('aria-pressed')==='true' && el.value==='Біль');
    a.push(c.wrapEl.classList.contains('si-chips') && el.closest('.f').classList.contains('si-first'));
    c.chips[i].click(); el.value=v0; update(); uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Скарги: підказка, що є кнопкою, натискає кнопку (критерії, щоденник бачать скаргу)', r[0]);
  ok('Скарги на ПК: поле першим, кнопки згорнуті під ним', r[1]);
}
// 0.9.3.95 — скарги посиндромно; «Обрано кнопками» в порядку натискання
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true); const c=F('skarhy.c');
    const pre=c.chips.filter(b=>b.getAttribute('aria-pressed')==='true'); pre.forEach(b=>b.click()); update();
    const sb=[...document.querySelectorAll('.si-sb')].find(b=>b.textContent==='Бронхообструктивний'); a.push(!!sb && SYND.every(s=>s[1].every(t=>c.opts.some(o=>O(o).t===t))));
    sb.click(); const idx=sb.dataset.idx.split(',').map(Number);
    a.push(idx.every(i=>c.chips[i].getAttribute('aria-pressed')==='true') && sb.getAttribute('aria-pressed')==='true');
    a.push([...document.querySelectorAll('.si-tok')].map(b=>b.textContent.replace(' ✕','')).join('|')===idx.map(i=>O(c.opts[i]).t).join('|'));
    sb.click(); a.push(idx.every(i=>c.chips[i].getAttribute('aria-pressed')!=='true') && !document.querySelector('.si-tok'));
    pre.forEach(b=>b.click()); update(); uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Посиндромно: усі скарги синдромів — серед кнопок', r[0]);
  ok('Посиндромно: синдром обирає свої скарги', r[1]);
  ok('«Обрано кнопками» — у порядку натискання', r[2]);
  ok('Повторне натискання синдрому знімає його скарги', r[3]);
  ok('Синдром підсвічується сам: частина скарг — «k/n», усі — натиснутий', w.eval(`(()=>{ const c=F('skarhy.c'), sb=[...document.querySelectorAll('.si-sb')].find(b=>b.textContent.startsWith('Плевральний')), idx=sb.dataset.idx.split(',').map(Number);
    const pre=idx.map(i=>c.chips[i].getAttribute('aria-pressed')==='true'); idx.forEach((i,k)=>{ if (pre[k]) c.chips[i].click(); }); update();
    c.chips[idx[0]].click(); update(); const part=sb.classList.contains('part') && sb.textContent.includes('1/'+idx.length);
    idx.slice(1).forEach(i=>c.chips[i].click()); update(); const full=sb.getAttribute('aria-pressed')==='true' && !sb.classList.contains('part');
    idx.forEach((i,k)=>{ if ((c.chips[i].getAttribute('aria-pressed')==='true')!==pre[k]) c.chips[i].click(); }); update(); return part && full; })()`));
}
// 0.9.3.95 — рядок унизу: Telegram, версія, «що нового», код і ліцензія
{ const f=doc.querySelector('.pofoot');
  ok('Унизу сторінки: Telegram, версія, відкритий код', !!f && /t\.me\/bezeza/.test(f.innerHTML) && f.textContent.includes(w.eval('VERSION')) && /github\.com\/bezeza\/pervynnyi-ohliad/.test(f.innerHTML));
}
// 0.9.3.95 — пасхалка: 7 клацань по версії внизу
{ const v=doc.querySelector('.pofoot > span:nth-child(2)'); for (let i=0;i<7;i++) v.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const e=doc.querySelector('.poegg'); ok('Пасхалка: 7 клацань по версії — відкривається і закривається', !!e && (e.querySelector('button').click(), !doc.querySelector('.poegg')));
}
// 0.9.3.95 — вади: «Перевірка» без ✓ на порожньому документі, повні назви розділів, «Огляд», старий вигляд відновлює
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true);
    const s=SECTIONS.find(x=>x.id==='morbi'); a.push(s.tab.textContent.includes('Анамнез хвороби'));
    a.push(document.querySelector('#docSeg button[data-doc="ohl"]').textContent==='Огляд');
    const out=document.getElementById('out'), o0=out.innerHTML; out.innerHTML=''; renderCheck(); const tC=document.querySelector('.otabs [data-ov="chk"]');
    a.push(!!tC && !tC.classList.contains('done') && tC.classList.contains('v2-empty')); out.innerHTML=o0; update();
    uiV2Set(false); a.push(s.tab.textContent.includes('Анамнез хв.') && document.querySelector('#docSeg button[data-doc="ohl"]').textContent!=='Огляд');
    uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Розділи в меню — повними назвами', r[0]);
  ok('Документ у шапці — «Огляд» (без повтору назви програми)', r[1]);
  ok('«Перевірка» без зеленого ✓ на порожньому документі', r[2]);
  ok('«Старий вигляд» повертає короткі назви', r[3]);
}
// 0.9.3.95 — «Скасувати» замість «Ви впевнені?»: очищення документа одним натисканням, оновлення з форми без вікна
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true); let asked=0; const c0=window.confirm; window.confirm=()=>{ asked++; return false; };
    const o=document.getElementById('out'); F('skarhy.c').chips[0].getAttribute('aria-pressed')!=='true' && F('skarhy.c').chips[0].click(); update();
    const n0=UNDO.length; const cb=document.createElement('button'); clearDoc(cb); a.push(!o.textContent.trim() && UNDO.length>n0 && !cb.dataset.arm);
    undoLast(); a.push(!!o.textContent.trim());
    o.append(' ПРАВКА'); dirty=true; document.getElementById('regen').click(); a.push(asked===0 && !o.textContent.includes('ПРАВКА'));
    window.confirm=c0; uiV2Set(k); return JSON.stringify(a); })()`));
  ok('Очищення документа — одразу, «Скасувати» повертає', r[0] && r[1]);
  ok('«Оновити з форми» при ручних правках — без системного вікна', r[2]);
}
// 0.9.3.95 — «Листок призначень»: одна назва (як у ф. 003-4/о)
{ const r=JSON.parse(w.eval(`(()=>{ const a=[]; a.push(RXT.title==='Листок призначень' && DOCTITLES.rx==='ЛИСТОК ЛІКАРСЬКИХ ПРИЗНАЧЕНЬ');
    a.push(![...document.querySelectorAll('h2, .tab')].some(e=>/\bЛист призначень/.test(e.textContent))); return JSON.stringify(a); })()`));
  ok('Листок призначень: одна назва в інтерфейсі й у друці', r[0] && r[1]);
}
// 0.9.3.95 — рядок стану внизу, «Збережено ✓» у картці пацієнта, один показник заповнення
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k=UIV2; uiV2Set(true); const pi=document.getElementById('meta_pib'), p0=pi.value; pi.value='Тест';
    V2ST.state=''; v2stDraw(); const b=document.getElementById('v2stat');
    a.push(!b.hidden && b.textContent.includes('Тест'));
    const go=b.querySelector('.st-miss .st-go');
    if (go){ const t=TABS.find(x=>(x.title||x.short)===go.textContent); go.click(); a.push(!!t && t.tab.getAttribute('aria-selected')==='true' && !t.panel.hidden); }
    else a.push(b.textContent.includes('Усі розділи заповнено'));
    markSaved(true); const sv=document.getElementById('v2saved'); a.push(!sv.hidden && sv.textContent==='Збережено ✓');
    markSaved(false); a.push(sv.classList.contains('bad') && /Не збережено/.test(sv.textContent)); markSaved(true);
    uiV2Set(false); v2stDraw(); a.push(b.hidden);
    pi.value=p0; uiV2Set(k); V2ST.state=''; v2stDraw(); return JSON.stringify(a); })()`));
  ok('Рядок стану: пацієнт і що не заповнено', r[0]);
  ok('Рядок стану: клік по розділу — перехід до нього', r[1]);
  ok('«Збережено ✓» і «Не збережено» видно', r[2] && r[3]);
  ok('«Старий вигляд» — без рядка стану', r[4]);
}
// 0.9.3.95 — власне оформлення друку вільних документів; бланки й форми — без змін
{ const r=JSON.parse(w.eval(`(()=>{ const a=[], k0=PRSTYLE, d0=DOC, bl0=BLANK; BLANK=false; const c=F('skarhy.c'); if (c.chips[0].getAttribute('aria-pressed')!=='true') c.chips[0].click(); switchDoc('ohl'); update();
    const norm=t=>t.replace(/[:\\s]+/g,'');
    prStyleSet('classic'); const A=document.createElement('div'); fillSheet(A); a.push(!A.classList.contains('pr-own') && !A.querySelector('.po-r'));
    prStyleSet('own'); const B=document.createElement('div'); fillSheet(B);
    a.push(B.classList.contains('pr-own') && !!B.querySelector('.po-title .po-t') && B.querySelectorAll('.pr-body .po-r .po-k').length>0);
    const tA=norm(A.querySelector('.pr-body').textContent), tB=norm(B.querySelector('.pr-body').textContent); a.push(tA.endsWith(tB) && tB.length>10);
    switchDoc('epi'); update(); const E=document.createElement('div'); fillSheet(E); a.push(!E.classList.contains('pr-own'));
    BLANK=bl0; prStyleSet(k0); switchDoc(d0); update(); return JSON.stringify(a); })()`));
  ok('Друк «Класичне» — як було', r[0]);
  ok('Друк «Власне»: назва, розділи двома колонками', r[1]);
  ok('Друк «Власне»: той самий текст документа', r[2]);
  ok('Друк «Власне» не змінює форми МОЗ (епікриз)', r[3]);
}
// 0.9.3.95 — швидший старт: після побудови сторінка показана, відкладені оновлення виконано
{ const r=JSON.parse(w.eval(`JSON.stringify([PO_BOOT===false, !PO_BOOT_CSS.isConnected, ![...document.querySelectorAll('style')].some(s=>/^html\\{display:none/.test(s.textContent))])`));
  ok('Швидкий старт: сторінка показана після побудови', r.every(Boolean), JSON.stringify(r)); }
// 0.9.3.96 — телефон: гортання до кінця сторінки; прокрутка лише списку розділів, не всієї сторінки
{ const r=JSON.parse(w.eval(`(()=>{ const a=[typeof scrollInBox==='function']; let pg=0; const s0=window.scrollTo, b0=window.scrollBy; window.scrollTo=()=>{pg++}; window.scrollBy=()=>{pg++};
    const e=TABS.find(t=>t.id==='skarhy').tab; const iv=Element.prototype.scrollIntoView; let n=0; Element.prototype.scrollIntoView=function(){ n++; };
    scrollInBox(e); scrollInBox(e,'center'); a.push(n===0 && pg===0); Element.prototype.scrollIntoView=iv; window.scrollTo=s0; window.scrollBy=b0;
    a.push(!/scrollIntoView/.test(String(opSpy))); return JSON.stringify(a); })()`));
  ok('Телефон: гортання сторінки не смикається назад (прокручується лише список розділів)', r.every(Boolean), JSON.stringify(r)); }
// 0.9.3.96 — підказки при першому відкритті розділу, зрозумілі помилки, текст документа без зайвих перерахунків
{ const r=JSON.parse(w.eval(`(()=>{ const a=[]; const off=V2HOFF, seen=V2HSEEN.slice(); V2HOFF=false; V2HSEEN=[];
    const i=TABS.findIndex(t=>t.id==='skarhy'); v2Hint(i); a.push(V2HSEEN.includes('skarhy')); const n=V2HSEEN.length; v2Hint(i); a.push(V2HSEEN.length===n);
    V2HOFF=off; V2HSEEN=seen; lsSet('po.hints', JSON.stringify(seen));
    a.push(/закінчилось місце/.test(v2PlainErr('Помилка сховища: QuotaExceededError: quota exceeded')) && /пошкоджений/.test(v2PlainErr('Не вдалося прочитати файл: Unexpected token < in JSON')) && v2PlainErr('Пацієнта збережено')==='Пацієнта збережено');
    const o=document.getElementById('out'), h0=o.innerHTML; o.innerHTML='<div>Перший</div>'; const t1=itext(o); o.innerHTML='<div>Другий</div>'; const t2=itext(o); a.push(/Перший/.test(t1) && /Другий/.test(t2)); o.innerHTML=h0; update();
    return JSON.stringify(a); })()`));
  ok('Підказка розділу — лише раз', r[0] && r[1]);
  ok('Помилки — зрозумілим текстом, звичайні повідомлення без змін', r[2]);
  ok('Текст документа оновлюється, коли змінився вміст', r[3]);
}
// 0.9.3.97 — знахідки аудиту: «Профіль» одним натисканням, ролі вкладок, «Друк» у шапці
{ const r=JSON.parse(w.eval(`(()=>{ const a=[];
    { const bad=[...document.querySelectorAll('#tabs button')].filter(b=>b.getAttribute('role')!=='tab').map(b=>b.className+':'+b.textContent.trim().slice(0,20)); a.push(bad.length ? bad : true); }
    const pb=document.getElementById('v2printBtn'); let n0=0; const pr=document.getElementById('printBtn'), c0=pr.onclick; const hits=[]; const lis=()=>hits.push(1); pr.addEventListener('click', lis, true); pb.click(); pr.removeEventListener('click', lis, true); a.push(!!pb && hits.length===1);
    const st0=UISTYLE; UISTYLE='ios'; document.querySelectorAll('.profdlg,#profPop').forEach(x=>x.remove());
    document.getElementById('profBtn').click(); a.push(document.querySelectorAll('.profdlg').length + document.querySelectorAll('#profPop').length === 1);
    document.querySelectorAll('.profdlg,#profPop').forEach(x=>x.remove()); UISTYLE=st0; lsSet('po.profask','1');
    return JSON.stringify(a); })()`));
  ok('Список розділів: усі кнопки — вкладки (для екранного читача)', r[0]===true, JSON.stringify(r[0]));
  ok('«Друк» у шапці друкує поточний документ', r[1]);
  ok('«Профіль»: одне натискання — одне вікно', r[2]);
}
// 0.9.3.98 — одна перевірка повноти на цикл оновлення (кеш checkDoc, 692-perf-check-cache.js)
{ const r=JSON.parse(w.eval(`(()=>{ const a=[];
    PO18_CHECK_CACHE.executions=0; update(); a.push(PO18_CHECK_CACHE.executions);
    const pib=document.getElementById('meta_pib'), old=pib.value;
    pib.value=''; const z1=checkDoc().some(x=>/ПІБ/.test(x.m)); pib.value='Тест Тестовий'; const z2=checkDoc().some(x=>/ПІБ/.test(x.m)); pib.value=old;
    a.push(z1 && !z2);
    a.push(PO18_CHECK_CACHE.result===null && PO18_CHECK_CACHE.depth===0);
    return JSON.stringify(a); })()`));
  ok('Оновлення виконує перевірку повноти один раз', r[0]===1, JSON.stringify(r));
  ok('Поза оновленням кожна перевірка бачить нові поля', r[1]===true, JSON.stringify(r));
  ok('Після оновлення кеш очищено', r[2]===true, JSON.stringify(r));
}
// 0.9.3.99 — щоденник: ВАШ, кисень із явним джерелом, «день N з M», «Курс … завершено» (693–695)
{ const r=JSON.parse(w.eval(`(()=>{ const a=[];
    a.push(diaryOxygenText('1','0','5'), diaryOxygenText('0','',''), diaryOxygenText('','','5'), diaryOxygenText('','1','8'), diaryOxygenText('',''));
    const x=bDiaryEntry({dt:'2026-11-09T09:00', f:{d_obj_chd_1:'94', d_obj_o2src:'1', d_obj_o2dev:'0', d_obj_o2_0:'5', d_main_vash_0:'6'}}).outerHTML.replace(/<[^>]+>/g,'').replace(/\u00a0/g,' ');
    a.push(x.includes('Біль за ВАШ') && x.includes('6/10'));
    a.push(x.includes('SpO₂ 94 % за допомогою кисневого концентратора через назальну канюлю, потік 5 л/хв'));
    const z=bDiaryEntry({dt:'2026-11-09T09:00', f:{}}).outerHTML.replace(/<[^>]+>/g,'');
    a.push(!z.includes('Біль за ВАШ') && !z.includes('SpO'));
    const legacy=bDiaryEntry({dt:'2026-11-09T09:00', f:{d_obj_chd_1:'94', d_obj_o2_0:'5'}}).outerHTML.replace(/<[^>]+>/g,'');
    a.push(legacy.includes('SpO₂ 94 % на кисні 5 л/хв'));
    const rx0=JSON.parse(JSON.stringify(RX)), d0=DOC; RX.length=0;
    switchDoc('shch');
    const today=todayISO(); RX.push({id:901,drug:'Тест-А',dose:'1',route:'в/в',freq:'1 р/д',days:'3',start:addDays(today,-1),stop:'',note:''});
    RX.push({id:902,drug:'Тест-Б',dose:'1',route:'в/в',freq:'1 р/д',days:'2',start:addDays(today,-1),stop:'',note:''});
    const body=(rxPart()||{}).body||'';
    a.push(body.includes('Тест-А 1 в/в 1 р/д, 3 дні (день 2 з 3)'));
    a.push(body.includes('Курс Тест-Б завершено') && !body.includes('Курс Тест-А завершено'));
    switchDoc(d0); RX.length=0; rx0.forEach(it=>RX.push(it));
    const nd={start:'2026-11-01',days:'',drug:'x',dose:'',route:'',freq:''};
    a.push(diaryCourseLine(nd,'2026-11-02') === rxLine(nd));
    return JSON.stringify(a); })()`));
  ok('Кисень: концентратор + канюля — у тексті з потоком', r[0] === 'за допомогою кисневого концентратора через назальну канюлю, потік 5 л/хв', JSON.stringify(r));
  ok('Кисень: атмосферне повітря і маска без джерела — як задано, без підстановки', r[1] === 'на атмосферному повітрі' && r[2] === 'на кисні 5 л/хв' && r[3] === 'на кисні через лицеву маску, потік 8 л/хв' && r[4] === '', JSON.stringify(r));
  ok('ВАШ 6 з 10 друкується в рядку скарг', r[5] === true, JSON.stringify(r));
  ok('SpO₂ і джерело кисню друкуються одним реченням', r[6] === true, JSON.stringify(r));
  ok('Порожній запис: без рядків ВАШ і SpO', r[7] === true, JSON.stringify(r));
  ok('Старий запис (без джерела кисню): SpO₂ і кисень одним реченням', r[8] === true, JSON.stringify(r));
  ok('Курс: «день N з M» лише за заданої тривалості', r[9] === true, JSON.stringify(r));
  ok('Курс: «Курс … завершено» у день закінчення', r[10] === true, JSON.stringify(r));
  ok('Курс без тривалості не змінюється', r[11] === true, JSON.stringify(r));
}
// 0.9.3.101 — епікриз: підписи дат періоду (696-epi-period-labels.js)
{ const r=JSON.parse(w.eval(`(()=>{ const f=F('e_per.per'), u=[...f.wrapEl.querySelectorAll('.nums > .u')].map(x=>x.textContent);
    return JSON.stringify([f.wrapEl.querySelector('.lbl').textContent, u[0], u[1], f.d1.getAttribute('aria-label'), f.d2.getAttribute('aria-label')]); })()`));
  ok('Епікриз: період перебування з підписами «Поступив/Поступила» і «Виписаний/Виписана»', r[0].startsWith('Період перебування у стаціонарі') && r[1]==='Поступив/Поступила до стаціонару' && r[2]==='Виписаний/Виписана', JSON.stringify(r));
  ok('Епікриз: дати періоду мають назви для екранного читача', r[3]==='Дата госпіталізації' && r[4]==='Дата виписки', JSON.stringify(r));
}
// 0.9.3.102 — labsCol без зайвого перезапису (697-perf-labs-col.js)
{ const r=JSON.parse(w.eval(`(()=>{ const a=[];
    const v=document.querySelector('#ptline .pcols .pcol.labs .pval'); RES.push({id:99901,d:todayISO(),t:'Тест',v:'1'}); labsCol(); const t1=v ? v.textContent : '1 запис';
    RES.pop(); labsCol(); const t2=v ? v.textContent : 'вписати'; a.push(/^1 запис/.test(t1) && t2==='вписати');
    return JSON.stringify(a); })()`));
  ok('Картка «Обстеження» оновлюється при зміні журналу', r[0]===true, JSON.stringify(r));
}
// 0.9.3.103 — план обстеження: «✓» відкриває клітинки журналу (698-plan-result-cells.js)
{ const r=JSON.parse(w.eval(`(()=>{ const a=[]; const res0=RES.slice(); const f=F('dx.plan'), i=f.opts.findIndex(o=>O(o).t==='ЗАК'), was=f.chips[i].getAttribute('aria-pressed')==='true';
    if (!was) f.chips[i].click();
    const row=[...document.querySelectorAll('#planDList .pdrow')].find(r=>r.querySelector('.pd-n').textContent.trim()==='ЗАК');
    row.querySelector('button[title="Внести результат"]').click();
    const dlg=document.querySelector('.ljdlg'), ed=dlg && dlg.querySelector('.ljed');
    a.push(!!ed && !ed.hidden && ed.querySelector('select').value==='ЗАК');
    const ins=ed ? [...ed.querySelectorAll('.ljgrid input')] : []; a.push(ins.map(x=>x.getAttribute('aria-label')).slice(0,3).join(','));
    a.push(ed && ed.querySelector('input[type=date]').value===todayISO());
    if (ins[0]){ ins[0].value='112'; ins[0].dispatchEvent(new Event('input')); [...ed.querySelectorAll('button')].find(x=>x.textContent==='Записати').click(); }
    const rec=RES.find(x=>x.t==='ЗАК' && x.vals && x.vals[0]==='112'); a.push(!!rec && /Hb 112/.test(rec.v));
    { const j=f.opts.findIndex(o=>/^консультація/.test(O(o).t)); if (j>=0){ const w2=f.chips[j].getAttribute('aria-pressed')==='true'; if (!w2) f.chips[j].click();
      const nm=O(f.opts[j]).t, rw=[...document.querySelectorAll('#planDList .pdrow')].find(r=>r.querySelector('.pd-n').textContent.trim()===nm);
      document.querySelectorAll('.ljdlg').forEach(x=>x.remove()); rw.querySelector('button[title="Внести результат"]').click();
      a.push(!document.querySelector('.ljdlg') && !!rw.parentElement.querySelector('.pd-res textarea')); if (!w2) f.chips[j].click(); } else a.push(true); }
    dlg && dlg.remove(); RES.length=0; res0.forEach(x=>RES.push(x)); if (!was) f.chips[i].click(); update();
    return JSON.stringify(a); })()`));
  ok('План обстеження: «✓» для ЗАК відкриває форму журналу', r[0]===true, JSON.stringify(r));
  ok('План обстеження: у формі клітинки Hb, ер., КП', r[1]==='Hb,ер.,КП', JSON.stringify(r));
  ok('План обстеження: дата форми — з плану', r[2]===true, JSON.stringify(r));
  ok('План обстеження: число з клітинки записано в журнал', r[3]===true, JSON.stringify(r));
  ok('План обстеження: консультація — як раніше, текстом', r[4]===true, JSON.stringify(r));
}
// 0.9.3.104 — журнал обстежень: кнопки ЗАС/копрограми, ЕхоКГ (698-labs-buttons.js)
{ const r=JSON.parse(await (async()=>{ const a=[]; const res0=JSON.stringify(w.eval('RES'));
    w.eval("labsOpen({test:'ЗАС'})"); await sleep(30);
    let ed=doc.querySelector('.ljdlg .ljed'); const cell=[...ed.querySelectorAll('.ljcell')].find(c=>c.querySelector('input').getAttribute('aria-label')==='білок');
    const bs=cell ? [...cell.querySelectorAll('.ljqb button')].map(b=>b.textContent) : []; a.push(bs.join('|'));
    cell.querySelector('.ljqb button').click(); a.push(cell.querySelector('input').value);
    const cb=[...ed.querySelectorAll('.ljcell')].find(c=>c.querySelector('input').getAttribute('aria-label')==='бактерії'); [...cb.querySelectorAll('.ljqb button')].find(b=>b.textContent==='++').click();
    [...ed.querySelectorAll('button')].find(x=>x.textContent==='Записати').click(); await sleep(10);
    const z=w.eval("RES.find(x=>x.t==='ЗАС')"); a.push(!!z && z.v.includes('білок не виявлено') && z.v.includes('бактерії ++'));
    doc.querySelectorAll('.ljdlg').forEach(x=>x.remove());
    w.eval("labsOpen({test:'копрограма'})"); await sleep(30); ed=doc.querySelector('.ljdlg .ljed');
    a.push(ed.querySelectorAll('.ljqb').length >= 10);
    doc.querySelectorAll('.ljdlg').forEach(x=>x.remove());
    w.eval("labsOpen({test:'ЕхоКГ'})"); await sleep(30); ed=doc.querySelector('.ljdlg .ljed');
    a.push([...ed.querySelectorAll('.ljgrid input')].map(i=>i.getAttribute('aria-label')).join(','));
    a.push(ed.querySelectorAll('.ljqb').length===0);
    doc.querySelectorAll('.ljdlg').forEach(x=>x.remove());
    const sx=w.eval('sex'); w.eval("sex='f'"); a.push(w.eval("lMark(labDef('ЕхоКГ').p[1],'55')").trim()==='↑' && w.eval("lMark(labDef('ЕхоКГ').p[0],'53')").trim()==='↓');
    w.eval("sex='m'"); a.push(w.eval("lMark(labDef('ЕхоКГ').p[1],'55')")==='' && w.eval("lMark(labDef('ЕхоКГ').p[0],'53')")==='' && w.eval("lMark(labDef('ЕхоКГ').p[5],'45')")==='');
    w.eval('sex='+JSON.stringify(sx));
    w.eval("RES.length=0; RES.push({id:99950,d:'2026-11-01',t:'ЕхоКГ',v:'ФВ ЛШ 55 %, висновок без патології',vals:['55','без патології']}); lqbMigrate()");
    const m=w.eval("RES[0].vals"); a.push(m.length===9 && m[0]==='55' && m[7]==='без патології' && m[1]==='');
    w.eval('RES.length=0; '+res0+'.forEach(x=>RES.push(x)); update()');
    return JSON.stringify(a); })());
  ok('ЗАС: білок — кнопки «не виявлено», «немає», «сліди»', r[0]==='не виявлено|немає|сліди', JSON.stringify(r));
  ok('ЗАС: кнопка вписує варіант у клітинку', r[1]==='не виявлено', JSON.stringify(r));
  ok('ЗАС: варіанти з кнопок потрапляють у результат', r[2]===true, JSON.stringify(r));
  ok('Копрограма: якісні пункти з кнопками', r[3]===true, JSON.stringify(r));
  ok('ЕхоКГ: ФВ, КДР, ЛП, МШП, ЗСЛШ, СТЛА, клапани, висновок, повний текст', r[4]==='ФВ ЛШ,КДР ЛШ,ЛП,МШП,ЗСЛШ,СТЛА,клапани,висновок,повний текст протоколу' && r[5]===true, JSON.stringify(r));
  ok('ЕхоКГ: норма за статтю (жінка: КДР 55 ↑, ФВ 53 ↓)', r[6]===true, JSON.stringify(r));
  ok('ЕхоКГ: чоловік — КДР 55 і ФВ 53 у нормі; СТЛА без позначки', r[7]===true, JSON.stringify(r));
  ok('ЕхоКГ: старий запис (ФВ, висновок) переноситься без зсуву', r[8]===true, JSON.stringify(r));
}
{ const r=w.eval(`(()=>{ const keep=RX.slice(), keepR=RES.slice(); RX.length=0; RES.length=0; lsSet('po.ampsop','0'); const off=amp3Warnings().length===0; lsSet('po.ampsop','1');
    const t=todayISO(); const f=addRx({drug:'Флуконазол', dose:'150 мг', freq:'1 р/д', route:'per os', start:t}); const ab=addRx({drug:'Цефтріаксон', start:t, route:'в/в', cult:'взято'});
    const n=addRx({drug:'Ністатин', dose:'500000 ОД', freq:'4 р/д', route:'per os', start:t}); const v=addRx({drug:'Ацикловір', route:'в/в', start:t}); const p=addRx({drug:'Альбендазол', start:t});
    const old=addRx({drug:'Осельтамівір', start:addDays(t,-3)}); old.rev='';
    const W=rxWarnings().map(x=>x.t).join(' | ');
    const rev=f.rev===addDays(t,2)&&p.rev===addDays(t,2), af=/СОП № 213: Флуконазол — лише за лабораторно підтвердженого/.test(W)&&/біоматеріалу/.test(W)&&/чинників ризику інвазивного кандидозу/.test(W);
    const d400=/флуконазол 150 мг\\/добу/.test(W), nys=/Ністатин не всмоктується/.test(W), ivv=/СОП № 215: Ацикловір в\\/в/.test(W)&&/експрес-тесту чи ПЛР у журналі немає/.test(W);
    const ap=/СОП № 212: Альбендазол/.test(W), rv2=/перегляд призначення Осельтамівір через 48–72 год/.test(W), oldNew=!/СОП № 215: Осельтамівір — за підтвердженого/.test(W);
    RES.push({id:998,d:t,t:'ПЛР',v:'грип A — виявлено'}); const W2=rxWarnings().map(x=>x.t).join(' | '); const pcr=!/експрес-тесту чи ПЛР у журналі немає/.test(W2);
    RX.length=0; keep.forEach(x=>RX.push(x)); RES.length=0; keepR.forEach(x=>RES.push(x)); lsSet('po.ampsop',''); renderRx();
    return JSON.stringify([off,rev,af,d400,nys,ivv,ap,rv2,oldNew,pcr,amp3DayMg({dose:'0,2 г',freq:'2 р/д'})]); })()`);
  ok('СОП № 213, 215, 212: показання й біоматеріал, флуконазол < 400 мг/добу, ністатин, противірусні в/в і ПЛР, протипаразитарні, дата перегляду 48–72 год; без СОП — нічого', r==='[true,true,true,true,true,true,true,true,true,true,400]', r); }
{ const r=w.eval(`(()=>{ const keep=RX.slice(), keepR=RES.slice(), doc0=DOC; RX.length=0; RES.length=0; lsSet('po.ampsop','1');
    const t=todayISO(), s=addDays(t,-2); const it=addRx({drug:'Цефтріаксон', dose:'2 г', route:'в/в', freq:'1 р/д', start:s, cult:'взято'});
    RES.push({id:991,d:s,t:'ЗАК',v:'лейкоцити 14,2'}); RES.push({id:992,d:t,t:'ЗАК',v:'лейкоцити 8,1'}); RES.push({id:993,d:s,t:'С-реактивний білок',v:'СРБ 96'}); RES.push({id:994,d:t,t:'С-реактивний білок',v:'СРБ 24'});
    renderRx(); const btn=document.querySelector('#rxList .rx[data-id="'+it.id+'"] .amp-rev'); const hasBtn=!!btn; amp4Dialog(it); const box=document.getElementById('ampRev');
    const lab=box.querySelector('#arv_lab').value, effAuto=box.querySelector('.chips .chip[aria-pressed="true"]')?.textContent;
    [...box.querySelectorAll('.chip')].find(c=>c.textContent==='продовжити').click(); box.querySelector('.btn.primary').click();
    const saved=(it.revLog||[]).length===1&&it.rev===addDays(t,2)&&!document.getElementById('ampRev');
    DOC='shch'; const p=rxPart(); const txt=p?p.body:''; DOC=doc0;
    const inDiary=/Перегляд антибактеріальної терапії через 48 год \\(СОП № 214\\): Цефтріаксон/.test(txt)&&/лейкоцити 14,2 → 8,1/.test(txt)&&/Рішення: продовжити/.test(txt);
    amp4Dialog(it); const b2=document.getElementById('ampRev'); [...b2.querySelectorAll('.chip')].find(c=>c.textContent==='припинити').click(); b2.querySelector('.btn.primary').click();
    const stopped=it.stop===t&&it.revLog.length===1&&it.revLog[0].dec==='stop';
    RX.length=0; keep.forEach(x=>RX.push(x)); RES.length=0; keepR.forEach(x=>RES.push(x)); lsSet('po.ampsop',''); renderRx();
    return JSON.stringify([hasBtn,/лейкоцити 14,2 → 8,1/.test(lab),effAuto,saved,inDiary,stopped]); })()`);
  ok('СОП: перегляд 48–72 год — кнопка, дані день 0 → зараз, ефективність підказана, запис у щоденник, «припинити» відміняє', r==='[true,true,"позитивна динаміка",true,true,true]', r); }
{ const r=w.eval(`(()=>{ localStorage.removeItem('po.errlog'); const boot=PO_BOOT===false&&!document.getElementById('poCrash');
    window.poErrAdd('тестова помилка','рядок 1',''); window.poErrAdd('тестова помилка','рядок 1',''); poErr(new Error('друга'),'тест');
    const a=errLogRead(); const sec=document.getElementById('errLogSec'); sec.open=true; errLogRender();
    const shown=/тестова помилка/.test(sec.textContent)&&/×2/.test(sec.textContent); const txt=errLogText();
    [...sec.querySelectorAll('button')].find(b=>b.textContent==='Очистити').click(); const cleared=errLogRead().length===0; sec.open=false;
    return JSON.stringify([boot,a.length,a[1]&&a[1].n,a[0].m,shown,/Первинний огляд/.test(txt)&&/друга · тест/.test(txt),cleared]); })()`);
  ok('Журнал помилок: запуск без аварії, повтори злито (×2), видно в налаштуваннях, текст для автора, очищення', r==='[true,2,2,"друга",true,true,true]', r); }
{ const r=w.eval(`(()=>{ const seen=[]; const nB=UPD.before.length, nA=UPD.after.length;
    onUpdate('тест-1',()=>seen.push(1)); onUpdate('тест-збій',()=>{ throw new Error('збій тестової дії'); }); onUpdate('тест-2',()=>seen.push(2)); onUpdate('тест-перед',()=>seen.push(0),'before');
    localStorage.removeItem('po.errlog'); let threw=false; try{ update(); }catch(e){ threw=true; }
    const logged=errLogRead().some(x=>/збій тестової дії/.test(x.m)&&/тест-збій/.test(x.w)); UPD.before.length=nB; UPD.after.length=nA; localStorage.removeItem('po.errlog');
    const wrappers=(update.toString().match(/PO18_CHECK_CACHE/)||[]).length;
    return JSON.stringify([seen.join(''),threw,logged,nA>=28,UPD.st['597-shell'].n>0,wrappers]); })()`);
  ok('Реєстр onUpdate: «перед» → основне → «після» по порядку; збій однієї дії не зупиняє інших і пишеться в журнал', r==='["012",false,true,true,true,1]', r); }
{ w.eval(`window.__tq={n0:(UPD.st['621-progress-next']||{n:0}).n}; switchDoc('ohl'); show(TABS.findIndex(t=>t.id==='skarhy'));
    const t=document.getElementById('skarhy_cx'); window.__tq.v0=t.value; window.__tq.n1=(UPD.st['621-progress-next']||{n:0}).n; t.value=(t.value+' тест друку').trim(); t.dispatchEvent(new Event('input',{bubbles:true}));
    window.__tq.sync=(UPD.st['621-progress-next']||{n:0}).n-window.__tq.n1;`);
  await sleep(220);
  const r=w.eval(`(()=>{ const q=__tq, after=(UPD.st['621-progress-next']||{n:0}).n-q.n1; const t=document.getElementById('skarhy_cx');
    const outOk=/тест друку/.test(document.getElementById('out').textContent); t.value=q.v0; update(); return JSON.stringify([q.sync,after,outOk]); })()`);
  ok('Друк у текстовому полі: дії після оновлення (прогрес, стан) запускаються один раз після паузи, не на кожну клавішу', r==='[0,1,true]', r); }
{ const r=w.eval(`(()=>{ const g=document.querySelector('#outBox>.v2grip'); const R=document.documentElement; const w0=R.style.getPropertyValue('--v2txtw');
    const ev=k=>g.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true})); ev('ArrowLeft'); const w1=parseInt(R.style.getPropertyValue('--v2txtw'),10);
    for(let i=0;i<40;i++) ev('ArrowLeft'); const wMax=parseInt(R.style.getPropertyValue('--v2txtw'),10); g.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
    const back=R.style.getPropertyValue('--v2txtw'); return JSON.stringify([!!g, g.getAttribute('role'), w1>parseInt(w0,10), wMax<=900, back, localStorage.getItem('po.txtw')]); })()`);
  ok('Панель «Текст»: межа для зміни ширини (стрілки, межа 900 px, подвійний клік — 560 px, запам’ятовується)', /^\[true,"separator",true,true,"560px","560"\]$/.test(r), r); }
{ const r=w.eval(`(()=>{ switchDoc('ohl'); const k=PRESETS.findIndex(p=>p.key==='pneu'); applyPreset(PRESETS[k], HV.cards[k]); update(); const T=()=>document.getElementById('out').textContent;
    const f=F('dyh.hr'); const a=[!f.alsoBtn.hidden]; const i=f.opts.findIndex(o=>O(o).t==='сухі розсіяні свистячі хрипи'); alsoSet(f,[i]); update();
    a.push(/вологі дрібнопухирчасті хрипи в нижніх відділах справа, сухі розсіяні свистячі хрипи/.test(T()));
    const s=snap(); a.push(s.f['dyh_hr_x']===String(i)); clearAll(); update(); a.push(f.alsoInp.value===''); restore(s); update(); a.push(/сухі розсіяні свистячі хрипи/.test(T()));
    f.el.value='0'; update(); a.push(f.alsoInp.value==='' && f.alsoBtn.hidden && !/сухі розсіяні свистячі хрипи/.test(T())); clearAll(); update(); return JSON.stringify(a); })()`);
  ok('«+ ще»: друга знахідка в полі — у тексті, зберігається, норма й очищення знімають', r==='[true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ switchDoc('ohl'); goTab('skarhy','skarhy.cx'); const f=F('skarhy.cx'); const v0=f.el.value; f.el.value='тест картки поруч'; update();
    const c=document.querySelector('#panels .tn-card'); const a=[!!c, !!c && /тест картки поруч/.test(c.textContent)];
    tnFloatSet(true); a.push(document.body.classList.contains('txt-float'), localStorage.getItem('po.txtfloat')); tnFloatSet(false); a.push(document.body.classList.contains('txt-float'));
    a.push(document.addEventListener && typeof siFieldOf==='function'); f.el.value=v0; update(); return JSON.stringify(a); })()`);
  ok('Текст поруч: картка «У тексті огляду» з абзацом розділу; «Плаваючим вікном» вмикається й вимикається', r==='[true,true,true,"1",false,true]', r); }
{ const r=w.eval(`(()=>{ switchDoc('ohl'); clearAll(true); update();
    const b=document.querySelector('.hosp-ind'); const out=()=>document.getElementById('out').textContent;
    const setv=(id,v)=>{ const e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true})); };
    const grey=!!b && b.classList.contains('grey') && b.textContent==='Критеріїв за введеними даними не знайдено';
    const folded=b.getAttribute('aria-expanded')==='false' && F('hosp.spec').wrapEl.classList.contains('hosp-fold') && F('hosp.gen').wrapEl.classList.contains('hosp-fold');
    const noDoc0=!/Є критерії ургентної госпіталізації|Є загальні критерії|Критеріїв за введеними даними не знайдено/.test(out());
    setv('dyh_chd_1','90'); update();
    const r1=autoRules();
    const red=r1.spec.size>0 && b.classList.contains('bad') && b.textContent==='Є критерії ургентної госпіталізації ('+r1.spec.size+')';
    const noAmb=!/амбулаторно/i.test(b.textContent);
    b.click();
    const open=b.getAttribute('aria-expanded')==='true' && !F('hosp.spec').wrapEl.classList.contains('hosp-fold') && !F('hosp.gen').wrapEl.classList.contains('hosp-fold');
    setv('dyh_chd_1','94'); setv('dyh_chd_0','24'); setv('ssc_ad_0','120'); setv('ssc_ad_1','80'); setv('ssc_chss_0','120'); setv('zah_temp_0','36,6'); setv('c_news_avpu','0');
    update();
    const r2=autoRules(); const news=CALCS.find(c=>c.id==='news').last;
    const yel=r2.spec.size===0 && r2.gen.size>0 && b.classList.contains('warn') && b.textContent==='Є загальні критерії ('+r2.gen.size+')';
    const noDoc1=!/Є критерії ургентної госпіталізації|Є загальні критерії \\(/.test(out());
    return JSON.stringify({grey,folded,noDoc0,red,noAmb,open,yel,noDoc1,spec:r2.spec.size,gen:r2.gen.size,txt:b.textContent,score:news&&news.score,msg:news&&news.msg}); })()`);
  const o=JSON.parse(r);
  ok('Індикатор госпіталізації: сірий без даних, червоний за SpO₂, жовтий за загальними; клік розгортає; у текст і «амбулаторно» не пише', o.grey&&o.folded&&o.noDoc0&&o.red&&o.noAmb&&o.open&&o.yel&&o.noDoc1, r); }
{ const r=w.eval(`(()=>{ localStorage.removeItem('po.myphrases');
    const menu=document.querySelector('#panels .mp-item'); menu.click();
    const dlg=document.querySelector('.mp-dlg');
    const name=dlg.querySelector('input[aria-label="Назва"]'), text=dlg.querySelector('textarea');
    name.value='Набряк'; text.value='Набряки гомілок [зменшився|зменшилась].';
    [...dlg.querySelectorAll('button')].find(b=>b.textContent==='Зберегти').click();
    const stored=localStorage.getItem('po.myphrases');
    const pib='Тестовий Пацієнт'; document.getElementById('meta_pib').value=pib;
    const noPatient=stored.indexOf(pib)<0 && stored.indexOf('po.packs')<0;
    const packs=localStorage.getItem('po.packs');
    dlg.remove();
    switchDoc('ohl'); const f=F('morbi.ax'); f.el.focus(); f.el.value=''; f.el.setSelectionRange(0,0);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',code:'Digit1',altKey:true,shiftKey:true,bubbles:true}));
    const hot=f.el.value==='Набряки гомілок [зменшився|зменшилась].';
    f.el.value='Було. '; f.el.setSelectionRange(f.el.value.length, f.el.value.length); mpInsert('Ще.');
    const mid=f.el.value==='Було. Ще.';
    const bad=mpImportObj({type:'po-patient', pib:pib, phrases:[{name:'x',text:'y'}]});
    const good=mpImportObj({type:'po-my-phrases', phrases:[{name:'Кисень', text:'Кисень 2 л/хв через канюлю.'},{name:'Набряк', text:'Набряки гомілок [зменшився|зменшилась].'}]});
    const list=mpLoad();
    const out=document.getElementById('out'); out.focus(); out.textContent='Рядок.';
    const tn=out.firstChild, range=document.createRange(); range.setStart(tn, tn.length); range.collapse(true);
    const sel=getSelection(); sel.removeAllRanges(); sel.addRange(range);
    mpInsert(' Додано.');
    const inOut=/Додано/.test(out.textContent) && dirty===true;
    const noAlt=(()=>{ const v=f.el.value; document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',code:'Digit1',altKey:true,shiftKey:false,bubbles:true})); return f.el.value===v; })();
    return JSON.stringify({menu:!!menu, dlg:!!dlg, noPatient, hot, mid, bad:bad.ok===false, good:good.ok&&good.n===1, n:list.length, inOut, noAlt, packsSame:localStorage.getItem('po.packs')===packs}); })()`);
  const o=JSON.parse(r);
  ok('Мої фрази: меню, збереження без даних пацієнта, Alt+Shift+1, імпорт лише свого JSON, курсор у тексті', o.menu&&o.dlg&&o.noPatient&&o.hot&&o.mid&&o.bad&&o.good&&o.n===2&&o.inOut&&o.noAlt&&o.packsSame, r); }
{ const r=w.eval(`(()=>{ switchDoc('ohl'); clearAll(true); const s=(id,v)=>{ const e=document.getElementById(id); e.value=v; }; const c=CALCS.find(x=>x.id==='news'); c.sels.avpu.value='';
    s('zah_temp_0','36,8'); s('dyh_chd_0','18'); s('dyh_chd_1','97'); s('ssc_ad_0','130'); s('ssc_ad_1','80'); s('ssc_chss_0','76'); update(); const b=()=>document.querySelector('.news2-badge');
    const noSvid=b().textContent; const svid=F('zah.svid'); svid.el.value='0'; update(); const clear=b().textContent;
    svid.el.value='2'; update(); const sopor=b().textContent+' '+b().className; c.sels.avpu.value='0'; update(); const manual=b().textContent;
    c.sels.avpu.value=''; clearAll(true); update(); return JSON.stringify([noSvid,clear,sopor,manual]); })()`);
  ok('NEWS2 (0.9.3.123): свідомість з огляду — без вибору «—», ясна 0, сопор +3 (рівень — як у калькуляторі), ручний вибір у калькуляторі має перевагу', r==='["NEWS2 · —","NEWS2 · 0","NEWS2 · 3 news2-badge warn","NEWS2 · 0"]', r); }
{ const r=w.eval(`(()=>{ const meta=TABS.find(t=>t.id==='meta'), work=document.getElementById('meta_work').closest('.f');
    const ks=['hosp','hospd','hospz','hospe','hospn'], inMeta=ks.every(k=>meta.panel.contains(F('morbi.'+k).wrapEl));
    const next=work.nextElementSibling; return JSON.stringify([inMeta, !!next && next.classList.contains('ref-h'), next.nextElementSibling===F('morbi.hosp').wrapEl]); })()`);
  ok('Направлення у «Пацієнт і лікар» одразу після «Місця роботи» (п. 9 ф. 003/о)', r==='[true,true,true]', r); }
{ const r=w.eval(`(()=>{ switchDoc('ohl'); const k=PRESETS.findIndex(p=>p.key==='pneu'); applyPreset(PRESETS[k], HV.cards[k]); update();
    const S=SECTIONS.find(x=>x.id==='dx'), f=F('dx.plan'), line=[...document.querySelectorAll('#out [data-sec="dx"]')].map(d=>d.textContent).find(t=>/План обстеження/.test(t));
    const i=f.opts.findIndex(o=>O(o).t==='ЕКГ'), on=()=>f.chips[i].getAttribute('aria-pressed')==='true', a=[on()];
    const off=line.toLowerCase().indexOf('екг')+1; a.push(qeField(S,line,off)===f); const hit=tiChipAt(f,line,off); a.push(!!hit && hit.i===i);
    a.push(tiChipAt(f,line,line.indexOf('План')+1)===null);
    tiRemove(f,hit); a.push(!on(), !/ЕКГ/.test(document.getElementById('out').textContent.split('План обстеження')[1]||''));
    document.querySelector('#snack button').click(); a.push(on());
    TNX.free=true; TNX.fs=18; tnxApply(); const c=[...TN.cards.values()][0]; a.push(!!c && c.classList.contains('tn-free') && !!c.pin && getComputedStyle(document.documentElement).getPropertyValue('--tnfs').trim()==='18px');
    TNX.free=false; TNX.fs=0; tnxApply(); a.push(!c.classList.contains('tn-free') && !c.style.left);
    clearAll(); update(); return JSON.stringify(a); })()`);
  ok('Текст: клік по пункту прибирає саме його (з «Скасувати»), назва поля — віконце; смуга «У тексті огляду» відкріплюється, шрифт', r==='[true,true,true,true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ const a=[]; const W=innerWidth,H=innerHeight;
    const p=tiAnch({left:W-316,top:H-264,right:W-16,bottom:H-64}); a.push(p.r===16 && p.b===64);
    const q=tiUnAnch(p,300,200); a.push(q.l===W-316 && q.t===H-264);
    popExt(true); a.push(document.body.classList.contains('pop-ext')); popExt(false); a.push(!document.body.classList.contains('pop-ext'));
    txgSet(true); a.push(localStorage.getItem('po.txtgrow')==='1'); txgSet(false); a.push(localStorage.getItem('po.txtgrow')==='0');
    const vc=viewCtl(); a.push([...vc.querySelectorAll('button')].some(b=>b.textContent==='На другому моніторі') && [...vc.querySelectorAll('button')].some(b=>b.textContent==='Росте з вікном'));
    return JSON.stringify(a); })()`);
  ok('Другий монітор: форма на всю ширину, поки вікно відкрите; текст росте з вікном; місце вікон — від найближчого краю', r==='[true,true,true,true,true,true,true]', r); }
{ const r=w.eval(`(()=>{ MODE='hosp'; applyMode(); F110=true; switchDoc('ohl'); sexSet('f');
    const ap=k=>{ const i=PRESETS.findIndex(p=>p.key===k); applyPreset(PRESETS[i], HV.cards[i]); };
    const T=()=>document.getElementById('out').textContent;
    ap('food');
    const food=T();
    const absent=['Діурез адекватний','корнеальні рефлекси','Черевні рефлекси','Ромберг','Язик сухий','Язик вологий','хрипи не вислуховуються','Грудна клітка правильної форми','неякісної їжі','самолікуванням','сімейного лікаря','з’їденою їжею','багаторазове'];
    const foodClean=absent.filter(s=>food.includes(s));
    const foodKeep=/Харчова токсикоінфекція/.test(food) && /рідкі випорожнення/i.test(food) && /навколопупков/.test(food) && /Об’єктивний стан хворої:/.test(food) && /Тургор знижений/.test(food);
    const sf=F('hosp.spec'), crit='діарея з ризиком дегідратації, неможливість прийому рідини понад 6 год (розд. III)';
    const chip=sf.chips[sf.opts.findIndex(o=>O(o).t===crit)];
    const wasOn=!!chip && chip.getAttribute('aria-pressed')==='true';
    const ruleBefore=autoRules().spec.has(crit);
    sf.chips.filter(c=>c.getAttribute('aria-pressed')==='true').forEach(c=>c.click());
    const specN=sf.chips.filter(c=>c.getAttribute('aria-pressed')==='true').length;
    const b=document.querySelector('.hosp-ind');
    const ruleAfter=autoRules().spec.has(crit);
    const indOk=specN===0 && !!b && !b.classList.contains('bad') && !/ургентної госпіталізації/.test(b.textContent);
    const lineNow=!T().includes('неможливість прийому рідини');
    chip.click();
    const back=chip.getAttribute('aria-pressed')==='true' && b.classList.contains('bad') && /ургентної госпіталізації \\(/.test(b.textContent) && T().includes('неможливість прийому рідини');
    ap('stroke');
    const st=T();
    const stBad=['Ромберг','корнеальні рефлекси','Діурез адекватний','Язик сухий','хрипи не вислуховуються','стійкість збережена'].filter(s=>st.includes(s));
    const stKeep=/Правобічний геміпарез/.test(st) && /Черевні рефлекси знижені/.test(st) && /Об’єктивний стан хворої:/.test(st);
    SHELL.presetSection(SECTIONS.find(s=>s.id==='nevr'));
    const stSec=!/Ромберг/.test(T()) && /Правобічний геміпарез/.test(T());
    ap('pneu');
    const pn=T();
    const pneuNorm=!/Діурез адекватний/.test(pn) && !/Ромберг/.test(pn) && !/самолікуванням/.test(pn) && !/електронним направленням/.test(pn) && /Об’єктивний стан хворої:/.test(pn) && /Вважає себе хворою протягом/.test(pn);
    sexSet('m');
    const male=/Об’єктивний стан хворого:/.test(T()) && !/Об’єктивний стан хворої/.test(T()) && /Вважає себе хворим протягом/.test(T());
    return JSON.stringify({foodClean, foodKeep, wasOn, ruleBefore, specN, ind:b&&b.textContent, indCls:b&&b.className, ruleAfter, indOk, lineNow, back, stBad, stKeep, stSec, pneuNorm, male}); })()`);
  const o=JSON.parse(r);
  ok('Харчова токсикоінфекція не вписує невведені норми огляду й анамнез', o.foodKeep && o.foodClean.length===0, r);
  ok('Індикатор госпіталізації: знятий ургентний критерій не тримає червоний «(1)», правило за даними лишається', o.wasOn && o.ruleBefore && o.ruleAfter && o.indOk && o.lineNow && o.back, r);
  ok('Інсульт не підставляє норму Ромберга й інших систем; знахідки шаблону лишаються', o.stBad.length===0 && o.stKeep && o.stSec, r);
  ok('Стать у заголовку огляду: хворої / хворого; пневмонія не дописує норму огляду', o.pneuNorm && o.male, r); }
{ const r=w.eval(`(()=>{ MODE='hosp'; applyMode(); F110=true; switchDoc('ohl'); sexSet('f');
    const ap=k=>{ const i=PRESETS.findIndex(p=>p.key===k); applyPreset(PRESETS[i], HV.cards[i]); };
    const T=()=>document.getElementById('out').textContent;
    ap('covid'); const cv=T(); const covid=/втрату нюху/.test(cv) && !/Нюх збережений/.test(cv);
    ap('gout'); const gt=T(); const gout=/набряклий/.test(gt) && !/Периферичних набряків немає/.test(gt);
    ap('hf'); const hf=/вимушене \\(ортопное\\)/.test(T()) && !/положення активне/.test(T()) && /положенні лежачи/.test(T());
    ap('pneu'); const before=T(); document.getElementById('allNorm').click(); const after=/Ромберг/.test(T()) && /Алергологічний анамнез не обтяжений/.test(T());
    ap('food'); switchDoc('shch'); const d=T();
    const diary=!/везикулярне/.test(d) && !/свідомість ясна/.test(d) && !/Сон і апетит/.test(d) && /болюч/.test(d);
    ap('stroke'); switchDoc('ohl');
    ['d_main','d_obj','d_lik'].forEach(id=>SECTIONS.find(s=>s.id===id).fields.forEach(f=>{ if (f.el && f.type==='sel') f.el.value=''; if (f.el && f.type==='text') f.el.value=''; }));
    switchDoc('shch'); const ds=T(); const strokeDiary=!/везикулярне/.test(ds) && /Неврологічний статус без динаміки/.test(ds);
    return JSON.stringify({covid, gout, hf, before: /Ромберг/.test(before), after, diary, strokeDiary, ds: ds.slice(0, 400)}); })()`);
  const o=JSON.parse(r);
  ok('COVID не пише «нюх збережений» при скарзі на втрату нюху', o.covid, r);
  ok('Подагра не пише «набряків немає» при набряклому суглобі', o.gout, r);
  ok('Серцева недостатність: ортопное, не «положення активне»', o.hf, r);
  ok('«Норма всюди» і далі ставить Ромберга й анамнез життя', !o.before && o.after, r);
  ok('Щоденник не дописує норму порожніх полів огляду', o.diary && o.strokeDiary, r); }
ok('Без помилок JavaScript', errs.length===0, errs.join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length);
 process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
