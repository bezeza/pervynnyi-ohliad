// «Бачу — редагую»: клік по фразі в перегляді відкриває варіанти біля слова і записує їх у форму.
const {JSDOM} = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'app.html'), 'utf8');
const prob = []; const ok = (c, m) => { if (!c) prob.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const d = new JSDOM(html, {url:'https://x.test/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){
    w.localStorage.setItem('po.welcome','1'); w.localStorage.setItem('po.profask','1'); w.localStorage.setItem('po.autogate','0');
    w.localStorage.setItem('po.prof', JSON.stringify({p:'ter', w:'hosp'}));
    w.Element.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.scrollBy = () => {}; w.document.execCommand = () => false;
  }});
  const w = d.window;
  await wait(400);
  w.eval("F('zah.stan').el.value='1'; F('zah.stan').el.dispatchEvent(new Event('change',{bubbles:true}));");
  w.eval('PAPER=true; renderPaper();');
  await wait(50);
  const span = [...w.document.querySelectorAll('#paper .se')].filter(e => /середньої тяжкості/.test(e.textContent)).sort((a,b)=>a.textContent.length - b.textContent.length)[0];
  ok(!!span, 'фраза «середньої тяжкості» не позначена в перегляді');
  if (span) span.click();
  await wait(30);
  const pop = w.document.querySelector('.see-pop');
  ok(!!pop, 'віконце варіантів не відкрилось');
  if (pop && span){
    const pr = pop.getBoundingClientRect(), sr = span.getBoundingClientRect();
    ok(pop.style.position === 'fixed', 'віконце не прив’язане до екрана біля слова');
    ok(Math.abs(pr.left - Math.min(sr.left, w.innerWidth - pr.width - 8)) < 80 || pr.left <= sr.right, 'віконце не стоїть біля фрази: pop ' + Math.round(pr.left) + ' span ' + Math.round(sr.left));
    ok(!pop.classList.contains('pe-box'), 'відкрилось старе вікно всього рядка, а не варіанти фрази');
    const heavy = [...pop.querySelectorAll('.see-opt')].find(b => b.textContent.trim() === 'тяжкий');
    ok(!!heavy, 'немає варіанта «тяжкий»');
    if (heavy) heavy.click();
    await wait(30);
    ok(w.eval("F('zah.stan').el.value") === '2', 'вибір варіанта не змінив поле форми: ' + w.eval("F('zah.stan').el.value"));
    ok(!w.document.querySelector('.see-pop'), 'віконце не закрилось після вибору');
    ok(/тяжк/.test(w.document.getElementById('out').textContent), 'текст документа не оновився');
    w.undoLast();
    await wait(20);
    ok(w.eval("F('zah.stan').el.value") === '1', 'скасування не повернуло попередній стан');
  }
  w.eval("F('zah.stan').el.value='1'; F('zah.stan').el.dispatchEvent(new Event('change',{bubbles:true})); PAPER=true; renderPaper();");
  await wait(20);
  const span2 = [...w.document.querySelectorAll('#paper .se')].filter(e => /середньої тяжкості/.test(e.textContent)).sort((a,b)=>a.textContent.length - b.textContent.length)[0];
  if (span2) span2.click();
  const pop2 = w.document.querySelector('.see-pop');
  if (pop2){
    pop2.dispatchEvent(new w.KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
    const focused = w.document.activeElement;
    ok(focused && focused.classList.contains('see-opt'), 'стрілка не переходить між варіантами');
    pop2.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
    ok(!w.document.querySelector('.see-pop'), 'Esc не закриває віконце');
  } else ok(false, 'віконце не відкрилось вдруге');
  const css = [...w.document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
  ok(/\.see-opt\{[^}]*min-height:44px/.test(css), 'кнопки варіантів не мають висоти під палець');
  ok(/\.se-empty/.test(css) && /#FFE58A/.test(css), 'порожні місця не підсвічені');
  w.close();
  if (prob.length){ prob.forEach(p => console.log('❌ ' + p)); console.log(prob.length + ' проблем'); process.exit(1); }
  console.log('OK: бачу — редагую, фраза біля слова, варіант, скасування, Esc');
})().catch(e => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
