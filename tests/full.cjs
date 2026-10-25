const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','build','app.html'),'utf8');
const R=[]; const ok=(n,c,info='')=>R.push((c?'✅':'❌')+' '+n+(info&&!c?' — '+info:''));
const mk=(store)=>{const errs=[];const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){try{w.localStorage.setItem('po.autogate','0')}catch(e){}
 w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.document.execCommand=()=>true;w.TextEncoder=TextEncoder;w.confirm=m=>/^Перед друком перевірте/.test(String(m));w.print=()=>{w.__printed=(w.__printed||0)+1};
 w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){w.__dl=(w.__dl||[]).concat(this.download)};
 if(store)for(const k in store)w.localStorage.setItem(k,store[k]); w.console.warn=(...a)=>errs.push('W '+a.join(' ')); w.addEventListener('error',e=>errs.push(e.message));}});d.errs=errs;return d;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let d=mk(); let w=d.window, doc=w.document; await sleep(80);
 const ev=(e,t)=>e.dispatchEvent(new w.Event(t)), $=id=>doc.getElementById(id);
 const set=(id,v)=>{const e=$(id);e.value=v;ev(e,e.tagName==='SELECT'?'change':'input');};
 const out=()=>[...$('out').children].map(x=>x.textContent).join('\n');
 const btn=t=>[...doc.querySelectorAll('button')].find(b=>b.textContent.trim()===t && !b.closest('[hidden]'));
 const tabs=()=>[...doc.querySelectorAll('.tab')].filter(t=>!t.hidden).map(t=>t.textContent);
 const docBtn=k=>doc.querySelector(`#docSeg [data-doc="${k}"]`);

 // 1 старт
 ok('1. Старт: порожній текст, без помилок', out()==='' && d.errs.length===0);
 // 2 режими/документи
 ok('2. Стаціонар: документи', [...doc.querySelectorAll('#docSeg button')].map(b=>b.textContent).join('|')==='Первинний огляд|Щоденник|Призначення|Виписний епікриз');
 doc.querySelector('[data-mode="amb"]').click();
 ok('2. Амбулаторно: документи', [...doc.querySelectorAll('#docSeg button')].map(b=>b.textContent).join('|')==='Первинний огляд|Повторний огляд|Призначення|Консультаційний висновок');
 ok('2. Амбулаторно: вкладка «Направлення»', tabs().includes('Направлення'));
 doc.querySelector('[data-mode="hosp"]').click();
 // 3 заклад
 set('meta_pidp','Тестівська міська рада'); set('meta_zoz','КНП «Тестова лікарня»'); set('meta_adr','м. Тестівськ'); set('meta_edrpou','1234');
 ok('3. ЄДРПОУ: попередження при неповному коді', $('meta_edrpou').classList.contains('bad')); set('meta_edrpou','12345678');
 ok('3. ЄДРПОУ: 8 цифр приймаються', !$('meta_edrpou').classList.contains('bad'));
 set('meta_doc','Петренко О. В.'); set('meta_zav','Іваненко С. М.'); set('meta_vidd','Терапевтичне відділення № 2');
 ok('3. Дані лікаря запам’ятовуються', (w.localStorage.getItem('po.doc')||'').includes('12345678'));
 // 4 пацієнт, вік, стать
 set('meta_pib','Коваль Ганна Іванівна'); set('meta_dob','1958-05-02'); set('meta_card','1234'); set('meta_dt','2026-10-09T10:00');
 ok('4. Вік рахується з дати народження', $('meta_age').value==='68');
 // 5 профілі хвороб
 const vis=()=>[...doc.querySelectorAll('.dcard')].filter(c=>!c.hidden).length;
 let prof=[]; [...doc.querySelectorAll('.gtab[data-g]')].filter(g=>!g.closest('.rxsets')).forEach(g=>{g.click(); prof.push(vis());});
 ok('5. Кожен профіль показує свої хвороби (сімейна — 14) (Мої — порожньо)', prof.join()==='12,10,10,10,14,10,0', prof.join());
 doc.querySelectorAll('.gtab')[0].click();
 let bad=[]; [...doc.querySelectorAll('.dcard')].forEach(c=>{const n0=d.errs.length; c.click(); if(d.errs.length>n0) bad.push(c.querySelector('b').textContent);});
 ok('5. Усі 28 заготовок застосовуються без помилок', bad.length===0, bad.join(', '));
 // 6 стать
 doc.querySelector('[data-sex="f"]').click(); doc.querySelectorAll('.gtab')[0].click(); doc.querySelectorAll('.dcard')[0].click();
 set('morbi_dur_n','21'); set('morbi_hosp','1');
 ok('6. Узгодження за статтю й відмінювання', out().includes('хворою протягом 21 дня') && out().includes('Госпіталізована за самозверненням'));
 ok('6. Скарги в порядку важливості', out().includes('Скарги: на підвищення температури тіла'));
 // 7 показники
 set('zah_temp_0','38,4'); set('ssc_ad_0','1600'); set('ssc_ad_1','90'); set('zah_hw_0','1,72'); set('zah_hw_1','80');
 ok('7. Відхилення підсвічується', $('zah_temp_0').classList.contains('abn'));
 ok('7. Неможливе значення — червоним', $('ssc_ad_0').classList.contains('bad'));
 ok('7. Зріст у метрах → ІМТ правильний', out().includes('Зріст 172 см, вага 80 кг, ІМТ 27,0'));
 set('ssc_ad_0','135'); set('ssc_ad_1','85');
 // 8 неврологія
 const pz=doc.getElementById('nevr_patzn_0'); pz.click();
 ok('8. Патологічний знак замінює фразу «відсутні»', out().includes('Позитивні патологічні знаки: симптом Бабінського справа') && !out().includes('Патологічні стопні та кистьові знаки відсутні'));
 pz.click();
 ok('8. Зняли знак — фраза «відсутні» повертається', out().includes('Патологічні стопні та кистьові знаки відсутні'));
 // 9 діагноз
 ok('9. Клінічний діагноз з кодом МКХ', out().includes('а) основний: Негоспітальна пневмонія нижньої частки правої легені, ІІІ клінічна група (J18.1).'));
 // 10 госпіталізація
 set('dyh_chd_1','90');
 ok('10. Автокритерій SpO2 ≤ 92% з міткою «авто»', out().includes('SpO2 ≤ 92% при диханні') && doc.querySelector('.chip[data-auto="1"]'));
 const ac=doc.querySelector('#hosp_spec_2'); const wasAuto=ac.dataset.auto==='1'; ac.click(); set('dyh_chd_0','17');
 ok('10. Знята вручну авто-позначка не повертається', wasAuto && ac.getAttribute('aria-pressed')==='false');
 // 11 калькулятори
 set('pt_age',''); set('pt_cr','130'); set('pt_ur','9'); set('pt_hb','95');
 const badge=id=>doc.querySelector('#calc_'+id+' .badge').textContent;
 ok('11. ШКФ CKD-EPI (жінка 68 р., креатинін 130) ≈ 37', /^3[5-9] /.test(badge('ckd')), badge('ckd'));
 ok('11. Кокрофт–Голт рахується (вага з огляду)', /мл\/хв/.test(badge('cg')), badge('cg'));
 ok('11. CURB-65 бере вік і тиск з огляду', badge('curb')==='2 б.', badge('curb'));
 doc.querySelector('#calc_ckd .cres .btn').click();
 ok('11. «Додати в текст» → у діагноз', out().includes('ШКФ (CKD-EPI 2021)'));
 // 12 копіювання, друк, Word/ODT
 w.__printed=0; $('printBtn').click(); ok('12. Друк запускається (офлайн)', w.__printed===1 && $('print').textContent.includes('ЄДРПОУ 12345678'));
 const files=w.eval('[makeDocx().length, makeOdt().length]'); ok('12. Word і LibreOffice створюються', files[0]>5000 && files[1]>5000);
 // 13 щоденник
 docBtn('shch').click(); ok('13. Щоденник: свої вкладки', tabs().join('|')==='Запис|Самопочуття|Об’єктивно|Лікування|Призначення|Шкали|Мої шаблони|Налаштування|Довідка');
 $('allNorm').click(); set('d_main_sk','2'); set('d_obj_ad_0','125'); set('d_obj_ad_1','75');
 ok('13. Щоденник формується', out().includes('Щоденник спостереження') && out().includes('АТ 125/75 мм рт. ст.'));
 btn('Записати в журнал').click(); ok('13. Запис у журнал', doc.querySelectorAll('#dlist .prow').length===1);
 set('d_obj_ad_0',''); btn('Як попередній').click(); ok('13. «Як попередній» відновлює дані', $('d_obj_ad_0').value==='125');
 // 14 ручні правки зберігаються між документами
 $('out').insertAdjacentHTML('beforeend','<div>РУЧНА ПРАВКА</div>'); ev($('out'),'input');
 docBtn('ohl').click(); docBtn('shch').click(); ok('14. Ручна правка не губиться при перемиканні', out().includes('РУЧНА ПРАВКА'));
 // 15 епікриз
 docBtn('epi').click(); set('e_per_per_1','2026-10-01'); set('e_per_per_2','2026-10-09');
 ok('15. Епікриз: ліжко-дні', out().includes('(8 ліжко-днів)'));
 ok('15. Епікриз: скарги й заключний діагноз з огляду', out().includes('При надходженні скарги на підвищення') && (out().includes('Заключний клінічний діагноз:') || out().includes('6. Повний діагноз')));
 [...doc.querySelectorAll('.chip.q')].find(b=>b.textContent.includes('шаблони за планом')).click();
 ok('15. Шаблони обстежень за планом', $('e_obs_obs').value.includes('ЗАК (…)'));
 // 16 консультаційний висновок
 doc.querySelector('[data-mode="amb"]').click(); docBtn('kons').click();
 [...doc.querySelectorAll('.chip.q')].find(b=>b.textContent.includes('з первинного огляду')).click();
 ok('16. Консультаційний висновок з даними огляду', out().includes('КОНСУЛЬТАЦІЙНИЙ ВИСНОВОК') && out().includes('Об’єктивно: Загальний стан'));
 ok('16. Форма 028/о у шапці', w.eval('formHeader().right[1]').includes('028/о'));
 docBtn('ohl').click(); ok('16. Амбулаторно: рішення щодо госпіталізації', out().includes('Рішення щодо госпіталізації:'));
 doc.querySelector('[data-mode="hosp"]').click();

 // 20 лист призначень
 doc.querySelector('[data-mode="hosp"]').click(); docBtn('ohl').click();
 ok('20. Схема призначень додана з хворобою', w.eval('RX.length')>=3);
 ok('20. Обґрунтування антибіотиків (наказ № 1328) у тексті', out().includes('наказ МОЗ України від 09.09.2026 № 1328'));
 docBtn('rx').click(); ok('20. Документ «Лист призначень»', out().includes('ЛИСТ ЛІКАРСЬКИХ ПРИЗНАЧЕНЬ'));
 // 21 нові документи
 const goM=k=>{ set('docMore',k); };
 let docsOk=true; for(const [k,t] of [['zav','Огляд завідувача'],['etap','ЕТАПНИЙ ЕПІКРИЗ'],['per','ПЕРЕКАЗНИЙ ЕПІКРИЗ'],['napr','НАПРАВЛЕННЯ НА КОНСУЛЬТАЦІЮ'],['dov','ДОВІДКА'],['zgoda','ІНФОРМОВАНА ДОБРОВІЛЬНА ЗГОДА']]){ goM(k); if(!out().includes(t)) {docsOk=false; console.log('doc fail',k);} }
 ok('21. Шість нових документів формуються', docsOk);
 // 22 перевірка повноти
 docBtn('epi').click(); ok('22. Перевірка повноти показує зауваження', doc.querySelectorAll('#chk li').length>0);
 // 23 мої шаблони
 doc.getElementById('tab_tpl').click(); set('tplField','shk.kol'); set('tplText','мармурові'); [...doc.querySelectorAll('button')].find(b=>b.textContent==='Додати').click();
 ok('23. Свій варіант додається у список', [...doc.getElementById('shk_kol').options].some(o=>o.textContent==='мармурові'));
 docBtn('ohl').click();
 // 17 пацієнти, автозбереження, перезапуск
 await sleep(1400); await sleep(2100);
 const store={}; for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);store[k]=w.localStorage.getItem(k);}
 ok('17. Пацієнт автозбережений', !!store['po.patients'] && store['po.patients'].includes('Коваль'));
 const d2=mk(store); const w2=d2.window, doc2=w2.document; await sleep(150);
 ok('17. Після перезапуску відкривається той самий пацієнт', doc2.getElementById('meta_pib').value==='Коваль Ганна Іванівна');
 ok('17. Журнал щоденників відновлено', doc2.querySelectorAll('#dlist .prow').length===1);
 ok('17. Реквізити закладу збережені', doc2.getElementById('meta_edrpou').value==='12345678');
 doc2.getElementById('clearAll').click(); ok('17. «Новий пацієнт» очищує форму', doc2.getElementById('meta_pib').value==='' && doc2.getElementById('meta_edrpou').value==='12345678');
 [...doc2.querySelectorAll('#plist .btn')].find(b=>b.textContent==='Відкрити').click();
 ok('17. Відкриття зі списку', doc2.getElementById('meta_pib').value==='Коваль Ганна Іванівна');
 w2.__dl=[]; [...doc2.querySelectorAll('button')].find(b=>b.textContent==='Експорт усіх у файл').click(); await sleep(50);
 ok('17. Експорт у файл', (w2.__dl||[]).some(n=>/\.json$/.test(n)));
 const blob=JSON.stringify({type:'po-patients',items:JSON.parse(w2.localStorage.getItem('po.patients'))});
 w2.importFile(new w2.File([blob],'p.json')); await sleep(300); { const b=doc2.querySelector('.packsheet button.btn.primary'); if(b) b.click(); } ok('17. Імпорт з файлу (з підтвердженням, без дублів)', /Перенесено: нових \d+, оновлено \d+/.test(doc2.querySelector('#toast').textContent), doc2.querySelector('#toast').textContent);
 w2.importFile(new w2.File(['{"a":1}'],'x.json')); await sleep(80); ok('17. Чужий файл відхиляється', doc2.querySelector('#toast').textContent.includes('не файл пацієнтів'));
 // 18 тема
 const tb=doc2.getElementById('themeBtn'); tb.click(); const t1=doc2.documentElement.getAttribute('data-theme'); tb.click(); const t2=doc2.documentElement.getAttribute('data-theme');
 ok('18. Тема день/ніч перемикається', t1 && t2 && t1!==t2, t1+'/'+t2);
 // 19 помилки
 ok('19. Жодної помилки JavaScript за весь сценарій', d.errs.length===0 && d2.errs.length===0, d.errs.concat(d2.errs).join(' | '));
 console.log(R.join('\n')); console.log('\nРазом: '+R.filter(x=>x[0]==='✅').length+' з '+R.length); process.exit(R.some(x=>x[0]==='❌')?1:0);
})();
