// Повторюваний профіль продуктивності ядра в jsdom.
// Час — діагностичний показник без порога: CI не падає через повільний runner.
// Усі дані синтетичні; формат збереження пацієнтів не використовується.
const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'app.html'), 'utf8');
const errors = [];
const dom = new JSDOM(html, {
  url:'https://x.test/',
  runScripts:'dangerously',
  pretendToBeVisual:true,
  beforeParse(w){
    try{
      w.localStorage.setItem('po.autogate', '0');
      w.localStorage.setItem('po.welcome', '1');
      w.localStorage.setItem('po.profask', '1');
      w.localStorage.setItem('po.uistyle', 'ios');
      w.localStorage.setItem('po.theme', 'day');
      w.localStorage.setItem('po.mode', 'hosp');
      w.localStorage.setItem('po.spec', 'ter');
    }catch(e){}
    w.scrollTo = () => {};
    w.scrollBy = () => {};
    w.Element.prototype.scrollIntoView = () => {};
    w.print = () => {};
    w.console.warn = (...a) => errors.push(a.join(' '));
    w.addEventListener('error', e => errors.push(e.message));
  }
});
const w = dom.window, doc = w.document;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const set = (id, value) => {
  const e = doc.getElementById(id);
  if (!e) throw new Error('Не знайдено поле ' + id);
  e.value = value;
  e.dispatchEvent(new w.Event(e.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true}));
};
const median = values => {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.floor(sorted.length / 2)] || 0;
};

(async()=>{
  await sleep(450);
  w.eval('newPatient()');
  set('meta_pib', 'Тестовий Пацієнт');
  set('meta_card', 'Історія 7');
  set('meta_dob', '1980-01-01');
  const sex = doc.querySelector('#sexSeg [data-sex="m"]');
  if (sex) sex.click();
  const hv = w.eval("TABS.findIndex(t=>t.id==='hv')");
  if (hv >= 0) w.eval('show(' + hv + ')');
  const preset = [...doc.querySelectorAll('.dcard')].find(b=>b.textContent.includes('Негоспітальна пневмонія'));
  if (!preset) throw new Error('Не знайдено синтетичний шаблон для профілювання');
  preset.click();

  const sampleHtml = doc.getElementById('out').innerHTML || '<p>Історія 7</p>';
  w.eval(`for(let i=0;i<10;i++) DIARIES.push({dt:'2026-11-'+String(i+1).padStart(2,'0')+'T09:00',rec:'',html:${JSON.stringify(sampleHtml)}+'<p>Історія 7</p>',data:{f:{},c:{}}});`);
  w.eval(`for(let i=0;i<20;i++) RES.push({id:1000+i,d:'2026-11-'+String(i+1).padStart(2,'0'),t:'Тестове обстеження',v:'Результат'});`);
  w.eval(`if(RX.length){const first={...RX[0]};while(RX.length<15)RX.push({...first,id:10000+RX.length});}else{for(let i=0;i<15;i++)RX.push({id:10000+i,drug:'Тестовий препарат',dose:'1',route:'per os',freq:'1 р/д'});}`);
  w.eval('renderDiaries(); renderRes(); renderRx(); update()');
  if (!doc.getElementById('out').textContent.trim()) throw new Error('Не згенеровано тестовий документ');

  for(let i=0;i<5;i++) w.eval('update()');
  const before = w.eval('PO18_CHECK_CACHE.executions');
  const samples = [];
  for(let i=0;i<10;i++){
    const t = w.performance.now();
    w.eval('update()');
    samples.push(w.performance.now()-t);
  }
  const checkRuns = w.eval('PO18_CHECK_CACHE.executions') - before;
  const rounded = samples.map(x=>+x.toFixed(2));
  console.log('Профіль update() (jsdom, синтетичний заповнений пацієнт):');
  console.log(JSON.stringify({
    samplesMs:rounded,
    medianMs:+median(samples).toFixed(2),
    minMs:+Math.min(...samples).toFixed(2),
    maxMs:+Math.max(...samples).toFixed(2),
    updateCount:samples.length,
    checkDocExecutions:checkRuns,
    checkDocExecutionsPerUpdate:+(checkRuns/samples.length).toFixed(2),
    consoleErrors:errors.length
  }, null, 2));
  if(checkRuns!==samples.length) throw new Error('Очікувалась одна фактична перевірка checkDoc на update; отримано '+checkRuns+' на '+samples.length+' оновлень');
  if(errors.length) throw new Error('Помилки браузера: '+errors.join(' | '));
  dom.window.close();
})().catch(e=>{
  console.error(e.stack || e);
  dom.window.close();
  process.exitCode=1;
});
