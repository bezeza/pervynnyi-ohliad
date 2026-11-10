/* ===== 0.9.3.110 · реєстр дій після оновлення (аудит 11.2026) =====
   Раніше кожен модуль обгортав update() ще раз (31 обгортка): порядок важко простежити, помилка в одній обриває решту.
   Тепер: onUpdate('назва', fn) — після основного update(); onUpdate('назва', fn, 'before') — перед ним.
   Порядок той самий, що й був: «перед» — у зворотному порядку підключення (зовнішня обгортка спрацьовувала першою),
   «після» — у порядку модулів. Помилка однієї дії записується в журнал і не зупиняє інші.
   Чому саме тут, а не одразу після 111: поля форми (540-ui-build) запам’ятовують update на час побудови —
   як і раніше, вони викликають лише основну частину. Змінювати це — окреме рішення (див. ZAVDANNIA.md).
   692-perf-check-cache лишається обгорткою навколо всього (кеш перевірки на один цикл). updStats() — час кожної дії. */
const UPD = {before:[], after:[], st:{}};
function onUpdate(name, fn, when){ (when === 'before' ? UPD.before : UPD.after).push({name, fn}); }
function updRun(x){
    const t = performance.now();
    try{ x.fn(); }catch(e){ try{ window.poErrAdd && window.poErrAdd(e && e.message || e, 'після оновлення: ' + x.name, e && e.stack); }catch(_){} }
    const s = UPD.st[x.name] || (UPD.st[x.name] = {n:0, ms:0, max:0}), d = performance.now() - t; s.n++; s.ms += d; if (d > s.max) s.max = d;
}
{ const core = update; update = function(){
  for (let i = UPD.before.length - 1; i >= 0; i--) updRun(UPD.before[i]);
  const r = core.apply(this, arguments);
  for (const x of UPD.after) updRun(x);
  return r;
}; }
function updStats(){ return Object.entries(UPD.st).map(([k, s])=>({дія:k, викликів:s.n, 'сер., мс':+(s.ms / s.n).toFixed(2), 'макс., мс':+s.max.toFixed(1)})).sort((a, b)=>b['сер., мс'] - a['сер., мс']); }
