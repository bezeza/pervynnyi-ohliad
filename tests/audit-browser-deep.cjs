const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),APP=path.join(ROOT,'build','app.html'),OUT=path.join(ROOT,'audit-output');
fs.mkdirSync(OUT,{recursive:true});
const result={generatedAt:new Date().toISOString(),performance:{},journey:null,documents:[],keyboard:{},storageBlocked:null,externalRequests:[],errors:[]};
let browser,server;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const raf=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
server=http.createServer((req,res)=>{if(req.url==='/'||req.url==='/app.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});fs.createReadStream(APP).pipe(res);}else{res.writeHead(404);res.end();}});
async function open({width=1366,height=768,style='ios',theme='day',blockStorage=false,cpu=0}={}){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme==='night'?'dark':'light',reducedMotion:'reduce'});
 await context.addInitScript(({style,theme,blockStorage})=>{
  if(blockStorage){Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError');}});return;}
  try{localStorage.setItem('po.autogate','0');localStorage.setItem('po.welcome','1');localStorage.setItem('po.profask','1');localStorage.setItem('po.uistyle',style);localStorage.setItem('po.theme',theme);localStorage.setItem('po.mode','hosp');localStorage.setItem('po.spec','ter');}catch(e){}
 },{style,theme,blockStorage});
 const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push({type:'pageerror',message:String(e)}));
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')result.errors.push({type:'console-'+m.type(),message:m.text()});});
 await page.route('**/*',route=>{const u=route.request().url();if(u.startsWith('http://127.0.0.1:4174/'))return route.continue();if(/^https?:/.test(u)){result.externalRequests.push(u);return route.abort();}return route.continue();});
 const cdp=await context.newCDPSession(page);if(cpu)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 await page.goto('http://127.0.0.1:4174/app.html',{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForSelector('#out',{state:'attached',timeout:15000});await raf(page);
 const readyMs=await page.evaluate(()=>performance.now());
 return {context,page,cdp,readyMs};
}
function stats(a){if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);return {n:a.length,values:a.map(x=>+x.toFixed(1)),median:+s[Math.floor(s.length/2)].toFixed(1),min:+s[0].toFixed(1),max:+s[s.length-1].toFixed(1)};}
async function perfScenario(populated){
 const x=await open({width:1920,height:1080,style:'ios',theme:'day',cpu:4});
 const setup=await x.page.evaluate(({populated})=>{
  const b=document.querySelector('.ust-new')||document.getElementById('clearAll');if(b)b.click();else newPatient();
  if(populated){
   const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};
   set('meta_pib','Тестовий Пацієнт');set('meta_card','Історія 7');set('meta_dob','1980-01-01');
   const hv=TABS.findIndex(t=>t.id==='hv');if(hv>=0)show(hv);
   const preset=[...document.querySelectorAll('.dcard')].find(b=>b.textContent.includes('Негоспітальна пневмонія'));if(preset)preset.click();
   const html=document.getElementById('out').innerHTML||'<p>Тестова історія</p>';
   for(let i=0;i<10;i++)DIARIES.push({dt:'2026-11-'+String(i+1).padStart(2,'0')+'T09:00',rec:'',html:html+'<p>Історія 7</p>',data:{f:{},c:{}}});
   for(let i=0;i<20;i++)RES.push({id:1000+i,d:'2026-11-'+String(i+1).padStart(2,'0'),t:'Тестове обстеження',v:'Результат'});
   if(RX.length){const first={...RX[0]};while(RX.length<15)RX.push({...first,id:10000+RX.length});}
   else for(let i=0;i<15;i++)RX.push({id:10000+i,drug:'Тестова позиція',dose:'1',route:'—',freq:'1'});
   renderDiaries();renderRes();renderRx();update();
  }
  const idx=TABS.findIndex(t=>t.id==='skarhy');if(idx>=0)show(idx);
  return {preset:!!populated&&!!document.querySelector('.dcard[aria-pressed="true"]'),diaries:DIARIES.length,rx:RX.length,res:RES.length,active:TABS[active]?.id};
 },{populated});
 const measured=await x.page.evaluate(async()=>{
  const out=document.getElementById('out'),tab=TABS.find(t=>t.id==='skarhy');
  const chip=tab?.panel?.querySelector('.chip:not(.q):not([hidden])');
  if(!out||!chip)return {error:'У видимому розділі «Скарги» не знайдено варіанта для вимірювання'};
  window.__updateTimes=[];
  const u0=update;window.update=function(){const t=performance.now();try{return u0.apply(this,arguments);}finally{window.__updateTimes.push(performance.now()-t);}};
  const clickToText=[];
  for(let i=0;i<5;i++){
   const before=out.innerHTML,start=performance.now();
   const ms=await new Promise(resolve=>{
    let done=false;const finish=()=>{if(done)return;done=true;obs.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-start)));};
    const obs=new MutationObserver(()=>{if(out.innerHTML!==before)finish();});
    obs.observe(out,{childList:true,subtree:true,characterData:true});
    chip.click();if(out.innerHTML!==before)finish();
    setTimeout(()=>finish(),2500);
   });
   clickToText.push(ms);
  }
  const showTimes=[],a=TABS.findIndex(t=>t.id==='skarhy'),b=TABS.findIndex(t=>t.id==='morbi');
  for(let i=0;i<5;i++){const t=performance.now();show(i%2?b:a);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));showTimes.push(performance.now()-t);}
  const paperTimes=[];PAPER=true;
  for(let i=0;i<5;i++){const t=performance.now();renderPaper();await new Promise(r=>requestAnimationFrame(r));paperTimes.push(performance.now()-t);}
  PAPER=false;renderPaper();
  const u=window.__updateTimes.slice();
  return {clickToVisibleText:stats(clickToText),updateSync:stats(u),showToFrame:stats(showTimes),renderPaperToFrame:stats(paperTimes),chipText:chip.textContent.trim().slice(0,80),chipVisible:!!(chip.offsetWidth||chip.offsetHeight)};
 });
 let popoutMs=null;
 if(populated){try{const start=await x.page.evaluate(()=>performance.now());const p=x.page.waitForEvent('popup',{timeout:4000});await x.page.locator('#popBtn').click({timeout:4000});const popup=await p;await popup.waitForSelector('#pwBox',{timeout:5000});popoutMs=await x.page.evaluate(t=>performance.now()-t,start);await popup.close();}catch(e){result.errors.push({type:'perf-popout',message:String(e.message||e)});}}
 result.performance[populated?'populated':'empty']={readyMs:x.readyMs,setup,measurements:measured,popoutMs};
 await x.context.close();
}
(async()=>{
 await new Promise(r=>server.listen(4174,'127.0.0.1',r));browser=await chromium.launch({headless:true});
 await perfScenario(false);await perfScenario(true);
 const journey=await open({width:1366,height:768,style:'ios',theme:'day'});
 await journey.context.grantPermissions(['clipboard-read','clipboard-write']);
 await journey.page.evaluate(()=>{window.__auditClicks=[];document.addEventListener('click',e=>{if(e.isTrusted)window.__auditClicks.push({id:e.target.closest('button')?.id||'',text:(e.target.closest('button')?.innerText||'').trim().replace(/\s+/g,' ').slice(0,55)});},true);window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;};});
 const click=async sel=>{const l=journey.page.locator(sel).first();if(!(await l.count()))throw new Error('Не знайдено елемент: '+sel);await l.click({timeout:5000});};
 const fill=async(sel,val)=>{await click(sel);await journey.page.locator(sel).fill(val,{timeout:5000});};
 let journeyErrors=[];
 try{
  await click('.ust-new');
  await fill('#meta_pib','Тестовий Пацієнт');await fill('#meta_card','Історія 7');await fill('#meta_dob','1980-01-01');
  await click('#sexSeg [data-sex="m"]');await click('#tab_hv');
  await click('.dcard');
  let steps=0;
  while(steps<20){
   const id=await journey.page.evaluate(()=>TABS[active]?.id);if(id==='dx')break;
   const n=journey.page.locator('.nb-next:visible').first();if(!(await n.count()))break;await n.click({timeout:5000});steps++;
  }
  const examClicks=await journey.page.evaluate(()=>__auditClicks.length);
  await click('#outBox .otabs [data-ov="paper"]');await click('#copy');await click('#printBtn');
  const primaryPrintClicks=await journey.page.evaluate(()=>__auditClicks.length);
  await click('#docSeg [data-doc="shch"]');
  if(await journey.page.locator('#dSaveTop').isVisible().catch(()=>false))await click('#dSaveTop');
  const paperTab=journey.page.locator('#outBox .otabs [data-ov="paper"]');
  if(await paperTab.getAttribute('aria-selected')!=='true')await paperTab.click();
  await click('#printBtn');
  const diaryClicks=await journey.page.evaluate(()=>__auditClicks.length);
  await click('#docSeg [data-doc="epi"]');
  if(await journey.page.locator('#tab_e_per').count())await click('#tab_e_per');
  const auto=journey.page.getByRole('button',{name:/Зібрати виписку/});
  if(await auto.count())await auto.first().click();
  if(await paperTab.getAttribute('aria-selected')!=='true')await paperTab.click();
  await click('#printBtn');
  const epiClicks=await journey.page.evaluate(()=>__auditClicks.length);
  result.journey={nextSteps:steps,toReadyExamClicks:examClicks,toPrimaryExamPrintClicks:primaryPrintClicks,toDiaryPrintAdditionalClicks:diaryClicks-primaryPrintClicks,toDiaryPrintTotalClicks:diaryClicks,toDischargeEpicrisisPrintAdditionalClicks:epiClicks-diaryClicks,toDischargeEpicrisisPrintTotalClicks:epiClicks,clicks:await journey.page.evaluate(()=>__auditClicks),printCalls:await journey.page.evaluate(()=>window.__printCalls||0)};
 }catch(e){journeyErrors.push(String(e.stack||e));result.journey={error:journeyErrors[0],clicks:await journey.page.evaluate(()=>__auditClicks)};}
 await journey.context.close();
 const docs=await open({width:1366,height:768,style:'ios',theme:'day'});
 await docs.page.evaluate(()=>{
  newPatient();const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};
  set('meta_pib','Тестовий Пацієнт');set('meta_card','Історія 7');set('meta_dob','1980-01-01');update();
 });
 const docIds=['ohl','shch','rx','epi','anes','f066','pam','zav','konc','etap','per','napr','kons','dov','zgoda'];
 for(const id of docIds){
  const r=await docs.page.evaluate(id=>{try{switchDoc(id);update();PAPER=true;renderPaper();PAPER=false;renderPaper();return {id,doc:DOC,textLength:document.getElementById('out')?.textContent.length||0};}catch(e){PAPER=false;return {id,error:String(e.stack||e)};}},id);
  result.documents.push(r);await sleep(25);
 }
 result.documentErrors=result.errors.slice();
 await docs.context.close();
 const kb=await open({width:1366,height:768,style:'ios',theme:'day'});
 await kb.page.screenshot({path:path.join(OUT,'ui-1366-apple-day.png')});
 await kb.page.evaluate(()=>{VIEW.layout='B';applyView();});
 const grip=await kb.page.evaluate(()=>{const g=document.getElementById('sideGrip');return g?{exists:true,visible:!!(g.offsetWidth||g.offsetHeight),label:g.getAttribute('aria-label'),min:g.getAttribute('aria-valuemin'),max:g.getAttribute('aria-valuemax'),now:g.getAttribute('aria-valuenow')}:null;});
 let sideWidth=null;try{await kb.page.locator('#sideGrip').focus();const before=await kb.page.locator('#sidecol').evaluate(e=>e.getBoundingClientRect().width);await kb.page.keyboard.press('ArrowRight');const after=await kb.page.locator('#sidecol').evaluate(e=>e.getBoundingClientRect().width);sideWidth={before,after,changed:after!==before};}catch(e){sideWidth={error:String(e.message||e)};}
 const menu={};
 try{
  await kb.page.locator('#profBtn').click();menu.profileOpen=await kb.page.locator('#profPop').count()>0;menu.profileFocusInside=await kb.page.evaluate(()=>!!document.activeElement.closest('#profPop'));await kb.page.keyboard.press('Escape');menu.profileEscapeCloses=await kb.page.locator('#profPop').count()===0;if(await kb.page.locator('#profPop').count())await kb.page.locator('#profBtn').click();
 }catch(e){menu.profileError=String(e.message||e);}
 try{
  await kb.page.locator('#viewBtn').click();menu.viewOpen=await kb.page.locator('#viewPop').isVisible();menu.viewFocusInside=await kb.page.evaluate(()=>!!document.activeElement.closest('#viewPop'));await kb.page.keyboard.press('Tab');menu.viewTabEnters=await kb.page.evaluate(()=>!!document.activeElement.closest('#viewPop'));await kb.page.keyboard.press('Escape');menu.viewEscapeCloses=await kb.page.locator('#viewPop').isHidden();
 }catch(e){menu.viewError=String(e.message||e);}
 try{
  await kb.page.evaluate(()=>blanksDialog());menu.blanksOpen=await kb.page.locator('#fbPick').count()>0;menu.blanksInitialFocusInside=await kb.page.evaluate(()=>!!document.activeElement.closest('#fbPick'));await kb.page.keyboard.press('Shift+Tab');menu.blanksShiftTabStaysInside=await kb.page.evaluate(()=>!!document.activeElement.closest('#fbPick'));await kb.page.keyboard.press('Escape');menu.blanksEscapeCloses=await kb.page.locator('#fbPick').count()===0;
 }catch(e){menu.blanksError=String(e.message||e);}
 const iconAudit=await kb.page.evaluate(()=>{
  const names=['popBtn','pvBtn','undoBtn','cmdkBtn','viewBtn','profBtn'];
  const named=names.map(id=>{const b=document.getElementById(id);return {id,exists:!!b,aria:b?.getAttribute('aria-label')||'',title:b?.title||'',text:b?.innerText?.trim()||''};});
  const glyphOnly=[...document.querySelectorAll('button')].filter(b=>{const t=(b.innerText||'').trim();return t&&/^[^\p{L}\p{N}]+$/u.test(t)&&!b.getAttribute('aria-label')&&!b.getAttribute('aria-labelledby')&&!b.title;}).map(b=>({text:(b.innerText||'').trim(),id:b.id,cls:b.className}));
  return {named,glyphOnly,tabs:document.getElementById('tabs')?.outerHTML.slice(0,1400)||''};
 });
 await kb.page.screenshot({path:path.join(OUT,'ui-390-apple-day.png')}).catch(()=>{});
 result.keyboard={grip,sideWidth,menus:menu,icons:iconAudit};
 await kb.context.close();
 const blocked=await open({width:1366,height:768,style:'ios',theme:'day',blockStorage:true});
 result.storageBlocked=await blocked.page.evaluate(async()=>{
  let error=null;try{newPatient();const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};set('meta_pib','Тестовий Пацієнт');set('meta_card','Історія 7');update();if(typeof savePatient==='function')savePatient(true);}catch(e){error=String(e);}
  await new Promise(r=>setTimeout(r,350));
  return {loaded:!!document.getElementById('out'),idb:typeof IDB!=='undefined'?IDB.ok:null,patientName:document.getElementById('meta_pib')?.value||'',textLength:document.getElementById('out')?.textContent.length||0,error};
 });
 await blocked.context.close();
 fs.writeFileSync(path.join(OUT,'browser-audit-deep.json'),JSON.stringify(result,null,2));
 const summary=[
  'Performance: '+JSON.stringify(result.performance),
  'Кліки: '+JSON.stringify(result.journey),
  'Документи: '+JSON.stringify(result.documents),
  'Клавіатура: '+JSON.stringify(result.keyboard),
  'localStorage заблоковано: '+JSON.stringify(result.storageBlocked),
  'Зовнішні запити: '+result.externalRequests.length,
  'Помилки/попередження: '+result.errors.length
 ].join('\n');
 fs.writeFileSync(path.join(OUT,'browser-audit-deep-summary.txt'),summary+'\n');
 console.log(summary.slice(0,12000));
 await browser.close();server.closeAllConnections?.();server.close();
})().catch(async e=>{fs.writeFileSync(path.join(OUT,'browser-audit-deep-error.txt'),e.stack||String(e));console.error(e.stack||e);try{await browser?.close();}catch(_){}try{server?.closeAllConnections?.();server?.close();}catch(_){}process.exitCode=1;});
