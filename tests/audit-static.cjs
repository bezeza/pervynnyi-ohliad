const fs=require('node:fs'),path=require('node:path'),postcss=require('postcss');
const ROOT=path.resolve(__dirname,'..'),JS=path.join(ROOT,'src','js'),OUT=path.join(ROOT,'audit-output');
fs.mkdirSync(OUT,{recursive:true});
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const files=fs.readdirSync(JS).filter(f=>f.endsWith('.js')).sort();
const source=files.map(f=>read(path.join('src/js',f))).join('\n')+'\n'+read('src/body.html');
const cssText=read('src/styles.css'),css=postcss.parse(cssText,{from:'src/styles.css'});
const treeRules=[];css.walkRules(r=>treeRules.push(r));
const exact=new Map(),selectorCount=new Map();
for(const r of treeRules){
 const selector=r.selector.trim().replace(/\s+/g,' ');
 selectorCount.set(selector,(selectorCount.get(selector)||0)+1);
 const decl=r.nodes.filter(n=>n.type==='decl').map(d=>d.prop.trim()+':'+d.value.trim()+(d.important?'!important':'')).join(';');
 const key=selector+'{'+decl+'}';
 const v=exact.get(key)||{selector,decl,count:0,lines:[]};v.count++;v.lines.push(r.source.start.line);exact.set(key,v);
}
const duplicateExact=[...exact.values()].filter(x=>x.count>1);
const duplicateSelectors=[...selectorCount.entries()].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).slice(0,80).map(([selector,count])=>({selector,count}));
const candidates=new Map();
for(const r of treeRules){
 const tokens=[...r.selector.matchAll(/\.([A-Za-z_][\w-]*)|#([A-Za-z_][\w-]*)/g)].map(m=>m[1]||m[2]);
 const missing=tokens.filter(t=>!source.includes(t));
 if(missing.length){for(const token of missing){const v=candidates.get(token)||{token,count:0,selectors:[]};v.count++;if(v.selectors.length<5)v.selectors.push({selector:r.selector,line:r.source.start.line});candidates.set(token,v);}}
}
const unusedCandidates=[...candidates.values()].sort((a,b)=>b.count-a.count).slice(0,100);
const printNonBW=[];
css.walkRules(r=>{
 const media=[];let p=r.parent;while(p&&p.type!=='root'){if(p.type==='atrule')media.push(p.params||p.name);p=p.parent;}
 const inPrint=media.some(x=>/print/i.test(x))||r.selector.includes('#print');
 if(!inPrint)return;
 r.walkDecls(d=>{
  if(!/(^color$|background|border|outline|shadow|fill|stroke)/i.test(d.prop))return;
  const colors=[...d.value.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:gray|grey|silver|black|white)\b/ig)].map(x=>x[0]);
  colors.filter(c=>!['#000','#000000','#fff','#ffffff','black','white'].includes(c.toLowerCase())).forEach(c=>printNonBW.push({selector:r.selector,property:d.prop,value:d.value,color:c,line:d.source.start.line,media:media.join(' / ')}));
 });
});
const observers=[],intervals=[],listeners=[];
for(const f of files){
 const c=read(path.join('src/js',f)),lines=c.split('\n');
 lines.forEach((line,i)=>{
  if(/new\s+MutationObserver/.test(line))observers.push({file:f,line:i+1,disconnectInFile:/\.disconnect\(/.test(c),observeLine:lines.findIndex(x=>/\.observe\(/.test(x))+1});
  if(/setInterval\s*\(/.test(line))intervals.push({file:f,line:i+1,excerpt:line.trim().slice(0,180)});
  if(/addEventListener\s*\(\s*['"](?:scroll|resize)['"]/.test(line))listeners.push({file:f,line:i+1,event:(line.match(/addEventListener\s*\(\s*['"]([^'"]+)/)||[])[1],excerpt:line.trim().slice(0,180)});
 });
}
const fontMeta=JSON.parse(read('src/fonts/fonts.json'));
const fontFiles=fontMeta.map(f=>({file:f.file,family:f.family,weight:f.weight,bytes:fs.statSync(path.join(ROOT,'src/fonts',f.file)).size,base64Bytes:fs.readFileSync(path.join(ROOT,'src/fonts',f.file)).toString('base64').length,range:f.range}));
const glyphs=[['°',0x00b0],['²',0x00b2],['₂',0x2082],['→',0x2192],['×',0x00d7],['±',0x00b1],['№',0x2116],['’',0x2019],['«',0x00ab],['»',0x00bb],['–',0x2013],['—',0x2014]];
function covers(range,cp){return range.split(',').some(part=>{const m=part.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i);if(!m)return false;const a=parseInt(m[1],16),b=parseInt(m[2]||m[1],16);return cp>=a&&cp<=b;});}
const familyCoverage={};
for(const fam of [...new Set(fontMeta.map(f=>f.family))]){
 const entries=fontMeta.filter(f=>f.family===fam);
 familyCoverage[fam]=glyphs.map(([g,cp])=>({glyph:g,covered:entries.some(e=>covers(e.range,cp))}));
}
const fontRaw=fontFiles.reduce((s,x)=>s+x.bytes,0),fontB64=fontFiles.reduce((s,x)=>s+x.base64Bytes,0);
const jsFiles=files.map(f=>({file:f,bytes:Buffer.byteLength(read(path.join('src/js',f)))}));
const jsBytes=jsFiles.reduce((s,x)=>s+x.bytes,0);
const dataMatchers=[/^\d+-data-/,/^\d+-sections-/,/^\d+-(?:.*blank)/,/^\d+-(?:.*(?:sop|evidence|labs))/];
const contentFiles=new Set(jsFiles.filter(x=>dataMatchers.some(re=>re.test(x.file))).map(x=>x.file));
const contentBytes=jsFiles.filter(x=>contentFiles.has(x.file)).reduce((s,x)=>s+x.bytes,0);
const changelog=jsFiles.find(x=>x.file==='120-version-changelog.js');
const shellBytes=['src/head.html','src/body.html','src/tail.html'].reduce((s,p)=>s+fs.statSync(path.join(ROOT,p)).size,0);
const cssBytes=Buffer.byteLength(cssText);
const htmlPath=path.join(ROOT,'pervynnyi-ohliad.html'),htmlBytes=fs.existsSync(htmlPath)?fs.statSync(htmlPath).size:null;
const fontFamilyUse={};
for(const fam of [...new Set(fontMeta.map(f=>f.family))])fontFamilyUse[fam]=source.includes(fam)||cssText.includes(fam);
const out={
 generatedAt:new Date().toISOString(),
 sizes:{htmlBytes,jsFiles:jsFiles.length,jsBytes,cssBytes,fontFiles:fontFiles.length,fontRawBytes:fontRaw,fontBase64Bytes:fontB64,fontEncodingOverhead:fontB64-fontRaw,shellBytes,otherBytes:htmlBytes===null?null:htmlBytes-jsBytes-cssBytes-fontB64-shellBytes,contentHeavyModuleBytes:contentBytes,contentHeavyFiles:[...contentFiles],changelogBytes:changelog?.bytes},
 largestJs:jsFiles.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,25),
 css:{rules:treeRules.length,selectors:selectorCount.size,duplicateExact,duplicateSelectors,unusedSelectorCandidates:unusedCandidates,printNonBW},
 reliability:{mutationObservers:observers,intervals,scrollResizeListeners:listeners},
 fonts:{families:[...new Set(fontMeta.map(f=>f.family))],files:fontFiles,familyUse,fontGlyphCoverage:familyCoverage,requiredGlyphs:glyphs.map(([glyph,codepoint])=>({glyph,codepoint:'U+'+codepoint.toString(16).toUpperCase().padStart(4,'0')}))}
};
fs.writeFileSync(path.join(OUT,'static-audit.json'),JSON.stringify(out,null,2));
const summary=[
 'HTML: '+htmlBytes+' байт',
 'JS: '+jsBytes+' байт ('+jsFiles.length+' модулів)',
 'CSS: '+cssBytes+' байт',
 'Шрифти: '+fontRaw+' байт WOFF2 → '+fontB64+' байт у base64 ('+fontFiles.length+' файлів)',
 'Контентні модулі (за назвами): '+contentBytes+' байт; CHANGELOG: '+(changelog?.bytes||0)+' байт',
 'CSS: '+treeRules.length+' правил; '+duplicateExact.length+' точних дублікатів; '+unusedCandidates.length+' кандидатів на невикористані класи/ID',
 'Друк: '+printNonBW.length+' явних кольорів, відмінних від #000/#fff',
 'MutationObserver: '+observers.length+'; scroll/resize listeners: '+listeners.length+'; setInterval: '+intervals.length,
 'Шрифтові сімейства: '+[...new Set(fontMeta.map(f=>f.family))].join(', ')
].join('\n');
fs.writeFileSync(path.join(OUT,'static-audit-summary.txt'),summary+'\n');
console.log(summary);
