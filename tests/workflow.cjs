const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','build','app.html'),'utf8');
const errors=[];
const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){try{w.localStorage.setItem('po.autogate','0')}catch(e){}
 w.localStorage.setItem('po.welcome','1');w.localStorage.setItem('po.profask','1');
 w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.document.execCommand=()=>false;
 w.addEventListener('error',e=>errors.push(e.message));w.console.warn=(...a)=>errors.push(a.join(' '));
}});
const w=d.window,doc=w.document,$=id=>doc.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(name,ok,detail='')=>{if(!ok)throw Error(`${name}${detail?': '+detail:''}`);};
const timed=(name,fn)=>{const t=w.performance.now();fn();return {name,ms:+(w.performance.now()-t).toFixed(2)};};
const set=(id,value)=>{const e=$(id);e.value=value;e.dispatchEvent(new w.Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};

(async()=>{
 await sleep(350);
 const profileDefs=w.eval('PROFS'),profiles=Object.keys(profileDefs),profileTimings=[];
 for(const id of profiles){
   const p=profileDefs[id],work=p.work||'hosp';
   w.profileDialog(false);
   const card=[...doc.querySelectorAll('.profdlg .pgrid .pcard')].find(b=>b.textContent.includes(p.n));
   check(`Profile choice exists: ${p.n}`,!!card);
   profileTimings.push(timed(`Profile ${p.n}`,()=>card.click()));
   const workLabel={hosp:'Стаціонар',amb:'Поліклініка / кабінет',both:'І там, і там'}[work];
   const workCard=[...doc.querySelectorAll('.profdlg .pwork .pcard')].find(b=>b.textContent.includes(workLabel));
   check(`Workplace choice exists: ${workLabel}`,!!workCard);
   workCard.click();
   doc.querySelector('.profdlg .pfoot .btn.primary').click();
   const applied=w.eval('({profile:PROF,mode:MODE})');
   check(`Profile applied: ${p.n}`,applied.profile.p===id&&applied.mode===work,`${applied.profile.p}/${applied.mode}`);
   const open=p.open;
   for(const sid of w.eval('SYS_IDS')){
     const tab=w.eval(`TABS.find(t=>t.id==='${sid}')`);
     if(tab&&tab.tab)check(`${p.n} system visibility: ${sid}`,tab.tab.hidden===!open.includes(sid));
   }
   if(p.docs)check(`${p.n} featured document`,p.docs.every(k=>w.eval(`DOCLIST['${work}'].some(x=>x[0]==='${k}')`)));
 }

 w.profileDialog(false);
 [...doc.querySelectorAll('.profdlg .pgrid .pcard')].find(b=>b.textContent.includes('Пульмонолог')).click();
 doc.querySelectorAll('.profdlg .pwork .pcard')[0].click();
 doc.querySelector('.profdlg .pfoot .btn.primary').click();
 w.eval("TABS.find(t=>t.id==='meta').tab").click();
 const flow=[];
 flow.push(timed('Enter synthetic patient details',()=>{
   set('meta_pib','Тестовий пацієнт UX — НЕ РЕАЛЬНА ОСОБА');
   set('meta_dob','1980-01-01');
   set('meta_card','UX-TEST-001');
   doc.querySelector('#sexSeg [data-sex="m"]').click();
 }));
 const card=[...doc.querySelectorAll('.dcard')].find(b=>b.textContent.includes('Негоспітальна пневмонія'));
 check('Profile preset available',!!card);
 flow.push(timed('Choose profile preset',()=>card.click()));
 check('Preset generated a reviewable document',$('out').textContent.length>500);
 const autoStart=Date.now();
 while(!Object.keys(w.eval('loadStore()')).length&&Date.now()-autoStart<2500)await sleep(25);
 const autosaveMs=Date.now()-autoStart;
 const id=w.eval('PID'),stored=w.eval('loadStore()')[id];
 check('Patient autosaved',!!stored&&stored.name==='Тестовий пацієнт UX — НЕ РЕАЛЬНА ОСОБА');
 check('Patient row shows saved status',!!doc.querySelector('#ptbar .pt-saved')?.textContent);

 const navigation=[];
 while(w.eval('TABS[active].id')!=='dx'&&navigation.length<12){
   await sleep(25);
   const current=w.eval('TABS[active]'),from=current.short||current.title;
   const next=current.panel.querySelector('.nb-next');
   check(`Next step exists at ${from}`,!!next);
   navigation.push(timed(next.textContent.trim(),()=>next.click()));
 }
 check('Next-step navigation reaches diagnosis',w.eval('TABS[active].id')==='dx',navigation.map(x=>x.name).join(' → '));
 check('Progress is visible',!!doc.querySelector('.tn-cur .tn-n')?.textContent);

 const docButtons=[...doc.querySelectorAll('#docSeg button')];
 const epi=docButtons.find(b=>b.dataset.doc==='epi'),ohl=docButtons.find(b=>b.dataset.doc==='ohl');
 check('Primary and discharge documents are available',!!epi&&!!ohl);
 flow.push(timed('Switch to discharge document',()=>epi.click()));
 check('Discharge document was generated',$('out').textContent.length>300);
 flow.push(timed('Return to primary exam',()=>ohl.click()));
 flow.push(timed('Toggle print preview',()=>{$('paperBtn').click();check('Preview visible',!$('paper').hidden);$('paperBtn').click();}));

 flow.push(timed('Open save menu',()=>$('saveBtn').click()));
 const saveOptions=[...doc.querySelectorAll('.savemenu button')].map(b=>b.textContent.replace(/\s+/g,' ').trim());
 check('Download menu includes Word and LibreOffice; PDF remains on print button',saveOptions.length===2&&saveOptions.some(x=>x.startsWith('Word'))&&saveOptions.some(x=>x.startsWith('LibreOffice'))&&!saveOptions.some(x=>x.startsWith('PDF'))&&!$('printBtn').hidden&&/PDF/.test($('printBtn').getAttribute('aria-label')||''),saveOptions.join(' / '));

 Object.defineProperty($('out'),'innerText',{configurable:true,get:()=>''});
 $('outBox').style.visibility='hidden';
 flow.push(timed('Copy while document pane is closed',()=>$('copy').click()));
 check('Hidden generated text is not reported empty',!$('toast').textContent.includes('Текст порожній'),$('toast').textContent);
 check('Manual-copy fallback reveals selectable document',$('outBox').classList.contains('open')&&w.getSelection().toString().length>300);

 let printCalls=0;w.print=()=>{printCalls++;};
 flow.push(timed('Prepare print',()=>$('printBtn').click()));
 check('Print action reaches print dialog',printCalls===1,String(printCalls));
 const save=[...doc.querySelectorAll('#panels button')].find(b=>b.textContent.trim()==='Зберегти');
 check('Explicit patient save action exists',!!save);
 flow.push(timed('Explicitly save patient',()=>save.click()));
 check('Patient save status is visible',$('saveState').textContent.includes('Збережено'),$('saveState').textContent);

 $('clearAll').click();
 $('ptbar').click();
 const row=[...doc.querySelectorAll('.switcher .swrow')].find(b=>b.textContent.includes('Тестовий пацієнт UX'));
 check('Saved patient can be found in switcher',!!row);
 flow.push(timed('Reopen saved patient',()=>row.click()));
 check('Reopened patient restores demographics',$('meta_pib').value==='Тестовий пацієнт UX — НЕ РЕАЛЬНА ОСОБА');
 check('No runtime errors',errors.length===0,errors.join(' | '));
 const actions=[...profileTimings,...flow].map(x=>x.ms).sort((a,b)=>a-b);
 const median=actions[Math.floor(actions.length/2)]||0,slowest=[...profileTimings,...flow].sort((a,b)=>a.ms-b.ms).at(-1);
 console.log(`UI workflow passed: ${profiles.length} profiles, ${navigation.length} next steps, autosave ${autosaveMs}ms, ${flow.length} actions; median ${median}ms, slowest ${slowest.name} ${slowest.ms}ms.`);
 process.exit(0);
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
