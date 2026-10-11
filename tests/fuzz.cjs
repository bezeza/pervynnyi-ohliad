const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','build','app.html'),'utf8');
const problems=new Set();
function run(seed){
 let x=seed; const rnd=n=>{x=(x*1103515245+12345)%2147483648; return x%n;};
 const errs=[];
 const d=new JSDOM(html,{url:'https://x.test/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.Element.prototype.scrollIntoView=()=>{};w.scrollBy=()=>{};w.document.execCommand=()=>true;w.print=()=>{};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};w.console.warn=(...a)=>errs.push('WARN '+a.join(' '));w.addEventListener('error',e=>errs.push(e.message));}});
 const w=d.window,doc=w.document,ev=(e,t)=>e.dispatchEvent(new w.Event(t));
 return new Promise(res=>setTimeout(()=>{
  const out=()=>doc.getElementById('out').textContent;
  for(let step=0;step<400;step++){
   const r=rnd(10);
   if(r<3){const sels=[...doc.querySelectorAll('#panels select, #docMore')]; const s=sels[rnd(sels.length)]; s.selectedIndex=rnd(s.options.length); ev(s,'change');}
   else if(r<5){const ch=[...doc.querySelectorAll('#panels .chip')]; ch[rnd(ch.length)].click();}
   else if(r<6){const ins=[...doc.querySelectorAll('#panels input:not([type=checkbox]):not([type=date]):not([type=datetime-local]):not([type=search]):not([type=file])')]; const i=ins[rnd(ins.length)]; i.value=String(rnd(200)); ev(i,'input');}
   else if(r<7){const cb=[...doc.querySelectorAll('#panels input[type=checkbox]')]; const c=cb[rnd(cb.length)]; c.checked=!c.checked; ev(c,'change');}
   else if(r<8){const b=[...doc.querySelectorAll('#docSeg button, #modeSeg button, #plist .btn, #clearAll, #sexSeg button, .gtab, .dcard')].filter(b=>!b.hidden); b[rnd(b.length)].click();}
   else if(r<9){const t=[...doc.querySelectorAll('.tab')].filter(t=>!t.hidden); t[rnd(t.length)].click();}
   else {const b=[...doc.querySelectorAll('#panels .btn, #allNorm, #regen, #copy, #printBtn')].filter(b=>!b.hidden && !b.disabled); b[rnd(b.length)].click();}
   const t=out();
   if(/undefined|NaN|\[object|null/.test(t)) problems.add('BAD TOKEN: '+t.match(/.{0,60}(undefined|NaN|\[object|null).{0,30}/)[0]);
   if(doc.querySelector('[aria-pressed=true][data-sex]') && /\[[^\]|]*\|/.test(t)) problems.add('UNRESOLVED GENDER TOKEN: '+t.match(/.{0,40}\[[^\]|]*\|.{0,30}/)[0]);
   { const tt=t; const m=tt.match(/.{0,50}(\.\.(?!\.)|,\.|\s\.|,,).{0,20}/); if(m) problems.add('PUNCT: '+m[0]); }
  }
  errs.forEach(e=>problems.add('ERR '+e));
  res();
 },50));
}
(async()=>{ for(let s=+process.argv[2];s<=+process.argv[3];s++) await run(s*7919); console.log([...problems].slice(0,40).join('\n')||'NO PROBLEMS'); process.exit(problems.size?1:0); })();
