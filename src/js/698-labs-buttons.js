/* 0.9.3.104 — журнал обстежень: якісні пункти кнопками, ЕхоКГ — основні числа (погоджено лікарем 09.11.2026).
   • ЗАС і копрограма: під клітинкою — кнопки варіантів; натискання вписує варіант, клітинку можна правити й далі.
     Для «немає» лікар пише і «немає», і «не виявлено» — є обидві кнопки.
   • ЕхоКГ: ФВ ЛШ, КДР ЛШ, ЛП, МШП, ЗСЛШ — з нормою за статтю за рекомендаціями ASE/EACVI 2015
     (Lang RM et al. J Am Soc Echocardiogr 2015;28:1–39): ФВ 52–72 % (ч) / 54–74 % (ж); КДР 42–58 / 38–52 мм;
     ЛП (передньо-задній) 30–40 / 27–38 мм; МШП і ЗСЛШ 6–10 / 6–9 мм. СТЛА — без позначки ↑↓
     (ESC/ERS 2022 оцінюють ймовірність ЛГ за швидкістю трикуспідальної регургітації, не за СТЛА).
     Далі «клапани», «висновок», «повний текст протоколу» (необов’язково).
   Наявні функції журналу не змінено: каталог доповнюється при завантаженні, кнопки додаються до готових клітинок. */
const LQB_ABS = ['не виявлено', 'немає'];
const LQB = {
  'ЗАС':{
    'колір':['солом’яно-жовтий','жовтий','насичено-жовтий','червонуватий'],
    'прозорість':['прозора','слабко каламутна','каламутна'],
    'білок':[...LQB_ABS,'сліди'], 'глюкоза':LQB_ABS,
    'кетонові тіла':[...LQB_ABS,'+','++','+++'], 'реакція на кров':[...LQB_ABS,'+','++','+++'], 'білірубін':[...LQB_ABS,'+','++','+++'],
    'нітрити':['негативні','позитивні'], 'уробіліноген':['в нормі','підвищений'],
    'епітелій':['плоский поодинокий','плоский, помірна кількість','плоский, значна кількість'],
    'циліндри':[...LQB_ABS,'гіалінові поодинокі','зернисті'], 'солі':[...LQB_ABS,'урати','оксалати','фосфати'],
    'бактерії':[...LQB_ABS,'+','++','+++'], 'слиз':[...LQB_ABS,'+','++']
  },
  'копрограма':{
    'консистенція':['оформлений','кашкоподібний','рідкий'], 'колір':['коричневий','світло-коричневий','темний'],
    'лейкоцити':[...LQB_ABS,'поодинокі в п/з'], 'еритроцити':[...LQB_ABS,'поодинокі в п/з'], 'яйця глистів':['не виявлено','виявлено: ']
  }
};
['м’язові волокна','нейтральний жир','жирні кислоти','крохмаль','клітковина','слиз'].forEach(n=>{ LQB['копрограма'][n] = [...LQB_ABS,'поодинокі','незначна кількість','помірна кількість','значна кількість']; });
/* ЕхоКГ: нові показники в каталозі */
const LQB_ECHO_OLD = 2;   // було: [ФВ ЛШ, висновок]
{ const e = LABCAT.find(x=>x.t === 'ЕхоКГ');
  if (e) e.p = [P_('ФВ ЛШ','%',[52,72],[54,74]), P_('КДР ЛШ','мм',[42,58],[38,52]), P_('ЛП','мм',[30,40],[27,38]), P_('МШП','мм',[6,10],[6,9]), P_('ЗСЛШ','мм',[6,10],[6,9]),
    P_('СТЛА','мм рт. ст.'), T_('клапани',''), T_('висновок',''), T_('повний текст протоколу','')]; }
/* старі записи ЕхоКГ [ФВ, висновок] → нові місця, щоб висновок не став «КДР» */
function lqbMigrate(){ (RES || []).forEach(r=>{ if (r.t === 'ЕхоКГ' && Array.isArray(r.vals) && r.vals.length === LQB_ECHO_OLD){ const [ef, z] = r.vals; r.vals = [ef, '', '', '', '', '', '', z, '']; } }); }
{ const r0 = restore; restore = function(){ const r = r0.apply(this, arguments); try{ lqbMigrate(); }catch(e){} return r; }; }
/* кнопки під клітинками */
function lqbEnhance(grid){
  const ed = grid.closest('.ljed'), sel = ed && ed.querySelector('select'), opts = sel && LQB[sel.value]; if (!opts) return;
  [...grid.querySelectorAll('.ljcell')].forEach(cell=>{
    if (cell.querySelector('.ljqb')) return;
    const inp = cell.querySelector('input'), list = inp && opts[inp.getAttribute('aria-label')]; if (!list) return;
    const box = h('span', {class:'ljqb', role:'group', 'aria-label':'Варіанти: ' + inp.getAttribute('aria-label')});
    const mark = () => box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', inp.value.trim() === b.dataset.v.trim() ? 'true' : 'false'));
    list.forEach(v=>box.append(h('button', {type:'button', class:'chip s', 'data-v':v, 'aria-pressed':'false', onclick:e=>{ e.preventDefault();
      inp.value = v; inp.dispatchEvent(new Event('input')); mark(); if (/: $/.test(v)){ inp.focus(); inp.setSelectionRange(v.length, v.length); } }}, v.replace(/: $/, '…'))));
    inp.addEventListener('input', mark); mark();
    const hint = cell.querySelector(':scope > small.chips-hint'); if (hint) hint.before(box); else cell.append(box);
  });
}
new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(n=>{ if (n.nodeType !== 1) return;
  const g = n.classList && n.classList.contains('ljgrid') ? n : n.closest && n.closest('.ljgrid') || (n.querySelector && n.querySelector('.ljgrid'));
  if (g) lqbEnhance(g); })); }).observe(document.body, {childList:true, subtree:true});
