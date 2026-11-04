const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),APP=path.join(ROOT,'build','app.html'),OUT=path.join(ROOT,'audit-output');
fs.mkdirSync(OUT,{recursive:true});
const result={generatedAt:new Date().toISOString(),cpuThrottle:4,scenarios:[],populated:null,storage500:null,storageBlocked:null,styleToggle:null,errors:[]};
let browser,server;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
server=http.createServer((req,res)=>{if(req.url==='/'||req.url==='/app.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});fs.createReadStream(APP).pipe(res);}else{res.writeHead(404);res.end();}});
async function bounded(p,ms){return await Promise.race([p,sleep(ms).then(()=>({timeout:true}))]);}
(async()=>{
 await new Promise(r=>server.listen(4173,'127.0.0.1',r));
 browser=await chromium.launch({headless:true});
 async function open({width,height,style='ios',theme='day',seed500=false,blockStorage=false}){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme==='night'?'dark':'light',reducedMotion:'reduce'});
  await context.addInitScript(({style,theme,seed500,blockStorage})=>{
   try{
    if(blockStorage){Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError');}});return;}
    localStorage.setItem('po.autogate','0');localStorage.setItem('po.welcome','1');localStorage.setItem('po.profask','1');
    localStorage.setItem('po.uistyle',style);localStorage.setItem('po.theme',theme);localStorage.setItem('po.mode','hosp');
    if(seed500){try{Object.defineProperty(window,'indexedDB',{configurable:true,get(){return undefined;}});}catch(e){}
     const s={};for(let i=0;i<500;i++){const id='synthetic-'+i;s[id]={name:'Тестовий Пацієнт '+i,card:'TEST-'+i,updated:Date.now()-i,snap:{v:1,f:{},c:{},diaries:[],rx:[],res:[]}};}
     localStorage.setItem('po.patients',JSON.stringify(s));}
   }catch(e){}
  },{style,theme,seed500,blockStorage});
  const page=await context.newPage();
  page.on('pageerror',e=>result.errors.push({type:'pageerror',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')result.errors.push({type:'console-'+m.type(),message:m.text()});});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const start=Date.now();await page.goto('http://127.0.0.1:4173/app.html',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForSelector('#out',{state:'attached',timeout:15000});
  const raf=await bounded(page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))),5000);
  return {context,page,cdp,readyMs:Date.now()-start,rafTimeout:!!(raf&&raf.timeout),nav:await page.evaluate(()=>({dcl:+(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0).toFixed(2),load:+(performance.getEntriesByType('navigation')[0]?.loadEventEnd||0).toFixed(2)}))};
 }
 async function axeScan(page,cdp){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const hasAxe=await bounded(page.evaluate(()=>typeof axe!=='undefined'),5000);
  if(hasAxe?.timeout)return {timeout:true,stage:'axe-global-check'};
  if(!hasAxe){const add=await bounded(page.addScriptTag({path:require.resolve('axe-core/axe.min.js')}),10000);if(add?.timeout)return {timeout:true,stage:'axe-script-load'};}
  const pending=page.evaluate(async()=>{
   const roots=[document.querySelector('.top'),document.querySelector('#sidecol'),document.querySelector('#outBox')].filter(Boolean);
   const a=await axe.run(roots,{runOnly:{type:'rule',values:['button-name','label','aria-allowed-attr','aria-required-children','aria-required-parent','document-title','html-has-lang','landmark-one-main','region','tabindex'] }});
   return {violations:a.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length,examples:v.nodes.slice(0,3).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,300)}))})),passes:a.passes.length,incomplete:a.incomplete.length};
  });
  return await bounded(pending,15000);
 }
 async function contrastScan(page){
  const pending=page.evaluate(async()=>{
   const roots=[document.querySelector('.top'),document.querySelector('#sidecol'),document.querySelector('#outBox')].filter(Boolean);
   const a=await axe.run(roots,{runOnly:{type:'rule',values:['color-contrast']}});
   return {violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,examples:v.nodes.slice(0,5).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,250)}))})),passes:a.passes.length,incomplete:a.incomplete.length};
  });
  return await bounded(pending,15000);
 }
 async function keyboardScan(page){
  await page.evaluate(()=>{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();window.scrollTo(0,0);});
  const steps=[];
  for(let i=0;i<24;i++){
   await page.keyboard.press('Tab');
   const v=await bounded(page.evaluate(()=>{
    const e=document.activeElement,cs=getComputedStyle(e),r=e.getBoundingClientRect();
    return {tag:e.tagName,id:e.id||'',role:e.getAttribute('role')||'',label:e.getAttribute('aria-label')||e.getAttribute('title')||'',text:(e.innerText||e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,60),visible:r.width>0&&r.height>0,outline:cs.outlineStyle,outlineWidth:cs.outlineWidth};
   }),2000);
   if(v?.timeout){steps.push({timeout:true});break;}
   steps.push(v);
  }
  return {steps,focusWithoutVisibleOutline:steps.filter(x=>x.visible&&x.tag!=='BODY'&&(x.outline==='none'||x.outlineWidth==='0px')).length};
 }
 async function instrument(page){
  await page.evaluate(()=>{
   window.__audit={totals:{},components:{}};
   const wrap=(name,group)=>{const original=window[name];if(typeof original!=='function')return;
    window[name]=function(...args){const t=performance.now();try{return original.apply(this,args);}finally{const v=performance.now()-t;(window.__audit[group][name]??=[]).push(v);}};};
   ['update','show','renderPaper','popRender'].forEach(n=>wrap(n,'totals'));
   ['uilApply','stApply','entryRender','progressRender','progressOptional','manualTextStatus','phtRenderBar','phtRenderStrip','renderCheck','renderLive','renderTabNav','peSoon','popSoon','fillSheet','blankBar','peMarkRows','uimApply','exApply','renderPatients','renderDiaries','renderRes','renderRx'].forEach(n=>wrap(n,'components'));
  });
 }
 async function measure(page){
  return page.evaluate(()=>{
   const m=fn=>{const t=performance.now();fn();return +(performance.now()-t).toFixed(2);};
   const chip=document.querySelector('.chip:not(.q):not([hidden])');
   const clickMs=chip?m(()=>chip.click()):null;
   const idx=TABS.findIndex(t=>t.id==='skarhy');
   const showMs=m(()=>show(idx>=0?idx:active));
   const was=PAPER;PAPER=true;const paperMs=m(()=>renderPaper());PAPER=was;renderPaper();
   const stats=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,{calls:v.length,total:+v.reduce((a,b)=>a+b,0).toFixed(2),max:+Math.max(...v).toFixed(2),median:+v.slice().sort((a,b)=>a-b)[Math.floor(v.length/2)].toFixed(2)}]));
   return {clickMs,showMs,paperMs,total:stats(__audit.totals),components:stats(__audit.components)};
  });
 }
 for(const [width,height] of [[1366,768],[1920,1080],[390,844]]){
  let x;
  try{x=await open({width,height,style:'ios',theme:'day'});}catch(e){result.scenarios.push({width,height,openError:String(e)});continue;}
  const variants=[];let variantTimeout=false;
  for(const [style,theme] of [['ios','day'],['ios','night'],['classic','day'],['classic','night']]){
   const sw=await bounded(x.page.evaluate(({style,theme})=>{UISTYLE=style;uiStyleApply();THEME=theme;applyTheme();applyView();return {style:UISTYLE,theme:THEME,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth};},{style,theme}),10000);
   if(sw.timeout){variantTimeout=true;variants.push({style,theme,timeout:true});break;}
   variants.push(sw);
  }
  let axe=null;
  if(width===1366&&!variantTimeout){
   await x.page.evaluate(()=>{UISTYLE='ios';uiStyleApply();THEME='day';applyTheme();applyView();});
   console.log('Axe scan start: desktop navigation/output roots');
   axe=await axeScan(x.page,x.cdp);
   if(axe.timeout){result.errors.push({type:'axe-timeout',message:'axe-core перевищив 15 секунд на обмеженому наборі кореневих елементів.'});}
   console.log('Axe scan finished:',JSON.stringify(axe).slice(0,500));
   const contrast={};
   contrast.day=await contrastScan(x.page);
   await x.page.evaluate(()=>{THEME='night';applyTheme();});
   contrast.night=await contrastScan(x.page);
   await x.page.evaluate(()=>{THEME='day';applyTheme();});
   const keyboard=await keyboardScan(x.page);
   result.accessibility={contrast,keyboard};
  }
  result.scenarios.push({width,height,readyMs:x.readyMs,rafTimeout:x.rafTimeout,nav:x.nav,variants,axe});
  console.log('Viewport finished:',width,'variants',variants.length,'axe',axe?.timeout?'timeout':'done');
  console.log('Viewport finished:',width,'variantTimeout',variantTimeout);
  await bounded(x.context.close(),3000);
 }
 const x=await open({width:1920,height:1080,style:'ios',theme:'day'});
 await instrument(x.page);
 const emptyOps=await bounded(measure(x.page),30000);
 result.empty={readyMs:x.readyMs,operations:emptyOps.timeout?{timeout:true}:emptyOps};
 await x.page.evaluate(()=>{window.__audit={totals:{},components:{}};});
 const setup=await bounded(x.page.evaluate(()=>{
  const nb=document.querySelector('.ust-new')||document.querySelector('#clearAll');if(nb)nb.click();
  const pib=document.getElementById('meta_pib');pib.value='Тестовий Пацієнт';pib.dispatchEvent(new Event('input',{bubbles:true}));
  const dob=document.getElementById('meta_dob');dob.value='1980-01-01';dob.dispatchEvent(new Event('input',{bubbles:true}));
  const hv=TABS.findIndex(t=>t.id==='hv');if(hv>=0)show(hv);
  const preset=[...document.querySelectorAll('.dcard')].find(b=>b.textContent.includes('Негоспітальна пневмонія'));if(preset)preset.click();
  const html=document.getElementById('out').innerHTML||'<p>Тестовий щоденник</p>';
  for(let i=0;i<10;i++)DIARIES.push({dt:'2026-11-'+String(i+1).padStart(2,'0')+'T09:00',rec:'',html:html+'<p>Історія '+i+'</p>',data:{f:{},c:{}}});
  for(let i=0;i<20;i++)RES.push({id:1000+i,d:'2026-11-'+String(i+1).padStart(2,'0'),t:'Тестове обстеження '+i,v:'Результат '+i});
  if(RX.length){const first={...RX[0]};while(RX.length<15)RX.push({...first,id:10000+RX.length});}
  renderDiaries();renderRes();renderRx();update();
  return {preset:!!preset,diaries:DIARIES.length,prescriptions:RX.length,results:RES.length};
 }),30000);
 if(setup.timeout){result.populated={setupTimeout:true};result.errors.push({type:'stress-setup-timeout'});await bounded(x.context.close(),3000);}
 else{
  console.log('Stress data ready:',JSON.stringify(setup));
  await x.page.evaluate(()=>{window.__audit={totals:{},components:{}};});
  const ops=await bounded(measure(x.page),30000);
  let popoutMs=null;
  if(!ops.timeout){
   const popStart=Date.now();
   try{const p=x.page.waitForEvent('popup',{timeout:3000});await x.page.locator('#popBtn').click({timeout:3000});const popup=await p;await popup.waitForSelector('#pwBox',{timeout:3000});popoutMs=Date.now()-popStart;await popup.close();}catch(e){result.errors.push({type:'popout',message:String(e.message||e)});}
  }else result.errors.push({type:'stress-measure-timeout'});
  result.populated={setup,operations:ops.timeout?{timeout:true}:ops,popoutMs};
  console.log('Stress operations finished:',JSON.stringify(result.populated).slice(0,1200));
  await bounded(x.context.close(),3000);
 }
 const many=await open({width:1366,height:768,style:'ios',theme:'day',seed500:true});
 result.storage500=await bounded(many.page.evaluate(()=>{const t=performance.now();renderPatients();return {count:Object.keys(loadStore()).length,renderMs:+(performance.now()-t).toFixed(2),visibleRows:document.querySelectorAll('#plist .prow').length};}),15000);
 console.log('500 patients:',JSON.stringify(result.storage500));
 await bounded(many.context.close(),3000);
 const blocked=await open({width:1366,height:768,style:'ios',theme:'day',blockStorage:true});
 result.storageBlocked=await bounded(blocked.page.evaluate(()=>({loaded:!!document.getElementById('out'),idb:typeof IDB!=='undefined'?IDB.ok:null,textLength:document.getElementById('out')?.textContent.length||0})),5000);
 console.log('Storage blocked:',JSON.stringify(result.storageBlocked));
 await bounded(blocked.context.close(),3000);
 const toggle=await open({width:1366,height:768,style:'ios',theme:'day'});
 result.styleToggle=await bounded(toggle.page.evaluate(()=>{
  const seen=new WeakMap();let duplicateAdds=0,totalAdds=0;const original=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,fn,opts){if(typeof fn==='function'){let m=seen.get(this);if(!m){m=new Map();seen.set(this,m);}let s=m.get(type);if(!s){s=new WeakSet();m.set(type,s);}if(s.has(fn))duplicateAdds++;else s.add(fn);}totalAdds++;return original.call(this,type,fn,opts);};
  for(let i=0;i<5;i++){UISTYLE='classic';uiStyleApply();UISTYLE='ios';uiStyleApply();}
  return {cycles:5,duplicateAddAttempts:duplicateAdds,totalListenerAddAttempts:totalAdds,style:UISTYLE};
 }),15000);
 console.log('Style toggle:',JSON.stringify(result.styleToggle));
 await bounded(toggle.context.close(),3000);
 fs.writeFileSync(path.join(OUT,'browser-audit-lite.json'),JSON.stringify(result,null,2));
 fs.writeFileSync(path.join(OUT,'browser-audit-lite-summary.txt'),'Екрани: '+result.scenarios.length+'\nПомилки/попередження: '+result.errors.length+'\nЗаповнений сценарій: '+JSON.stringify(result.populated)+'\n500 пацієнтів: '+JSON.stringify(result.storage500)+'\nlocalStorage заблоковано: '+JSON.stringify(result.storageBlocked)+'\nПеремикання стилю: '+JSON.stringify(result.styleToggle)+'\n');
 console.log(fs.readFileSync(path.join(OUT,'browser-audit-lite-summary.txt'),'utf8'));
 await browser.close();server.closeAllConnections?.();server.close();
})().catch(async e=>{fs.writeFileSync(path.join(OUT,'browser-audit-lite-error.txt'),e.stack||String(e));console.error(e.stack||e);try{await browser?.close();}catch(_){}try{server?.closeAllConnections?.();server?.close();}catch(_){}process.exitCode=1;});
