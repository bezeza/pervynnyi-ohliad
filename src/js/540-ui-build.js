/* ================= ПОБУДОВА ІНТЕРФЕЙСУ ================= */
let curGroup = SPEC === 'tr' ? 'tr' : SPEC === 'fam' ? 'fam' : 'ter';
const SPEC_GROUPS = {ter:['ter','nevr','inf'], tr:['tr','hir'], fam:['fam','ter']};   // які групи хвороб видно одразу; решта — «Інші профілі»
/* вкладки згруповані за етапами роботи — так легше орієнтуватися і на ПК, і на телефоні */
const TGRP = {meta:'Пацієнт', hv:'Пацієнт', skarhy:'Анамнез', morbi:'Анамнез', vitae:'Анамнез',
  zah:'Огляд', loc:'Огляд', shk:'Огляд', dyh:'Огляд', ssc:'Огляд', trav:'Огляд', sech:'Огляд', nevr:'Огляд',
  dx:'Висновок', scr:'Висновок', hosp:'Висновок', rxt:'Висновок', eln:'Висновок', calc:'Інструменти', tpl:'Інструменти', set:'Інструменти', help:'Інструменти', qv:'Огляд', ctrl:'Огляд'};
function layoutTabs(){
  // видимі вкладки — у порядку роботи, послідовні з однаковим етапом об’єднуються в групу з підписом
  const exam = TABS.some(t=>(t.id === 'zah' || t.id === 'qv') && !t.tab.hidden);
  const box = $('#tabs'); box.innerHTML = ''; let gr = null;
  const W = t => t.id === 'meta' || t.id === 'hv' ? -2 : t.id === 'c_main' ? -1 : t.id === 'c_end' ? 0.5 : ['calc','tpl','set','help'].includes(t.id) ? 1 : 0;   // консиліум: склад — першим, рішення — після призначень
  [...TABS].sort((a,b)=>W(a) - W(b)).forEach(t=>{
    if (t.tab.hidden) return;
    let l = TGRP[t.id] || 'Документ';
    if (!exam && l !== 'Пацієнт' && l !== 'Інструменти') l = 'Документ';
    if (!gr || gr.l !== l){ gr = {l, el:h('div', {class:'tgrp', role:'presentation'}, h('span', {class:'tgl', 'aria-hidden':'true'}, l))}; box.append(gr.el); }
    gr.el.append(t.tab);
  });
  if (typeof renderTabNav === 'function') setTimeout(renderTabNav, 0);
}
TABS.forEach((s,i)=>{
  s.tab = h('button', {type:'button', class:'tab', role:'tab', id:`tab_${s.id}`, onclick:()=>show(i)}, s.short || s.title, h('span',{class:'dot','aria-hidden':'true'}));
  $('#tabs').append(s.tab);
  let head, grid;
  if (s.special === 'meta'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Пацієнт і запис'));
    grid = buildMetaPanel();
  } else if (s.special === 'hv'){
    head = h('div', {class:'ph'}, h('h2', {}, 'При хворобі'));
    grid = h('div', {});
    grid.append(h('p', {class:'lead'}, 'Оберіть захворювання: відмітяться характерні скарги, типові зміни при огляді, клінічний діагноз з кодом МКХ-10 і план обстеження. Решта систем виставиться в норму. Далі підправте те, що не збігається з вашим пацієнтом.'));
    const gt = h('div', {class:'gtabs', role:'group', 'aria-label':'Профіль'});
    const cards = h('div', {class:'dz-grid'});
    const filter = ()=>{
      gt.querySelectorAll('.gtab').forEach(b=>b.setAttribute('aria-pressed', b.dataset.g === curGroup ? 'true' : 'false'));
      s.cards.forEach(c=>{ c.hidden = c.dataset.g !== curGroup; });
      const any = s.cards.some(c=>!c.hidden); s.emptyMy.hidden = any; if (s.groupVis) s.groupVis();
    };
    s.filter = filter;
    s.emptyMy = h('p', {class:'chips-hint', hidden:''}, 'Тут ще немає хвороб. Збережіть свою на вкладці «Мої шаблони».');
    GROUPS.forEach(([k,l])=>{ const b = h('button', {type:'button', class:'gtab', 'aria-pressed':'false', onclick:()=>{ curGroup = k; filter(); }}, l); b.dataset.g = k; gt.append(b); });
    { let all = false; try{ all = localStorage.getItem('po.gall') === '1'; }catch(e){}
      const tg = h('button', {type:'button', class:'gtab gmore', 'aria-expanded':'false'});
      const own = () => (SPEC_GROUPS[SPEC] || SPEC_GROUPS.ter);
      s.groupVis = () => { const o = own(); gt.querySelectorAll('.gtab[data-g]').forEach(b=>{ b.hidden = !all && !o.includes(b.dataset.g) && b.dataset.g !== 'my' && b.dataset.g !== curGroup; });
        tg.textContent = all ? 'Менше ▴' : 'Інші профілі ▾'; tg.setAttribute('aria-expanded', all ? 'true' : 'false'); };
      tg.onclick = () => { all = !all; try{ localStorage.setItem('po.gall', all ? '1' : '0'); }catch(e){} s.groupVis(); };
      gt.append(tg); s.groupVis(); }
    s.cardBox = cards;
    s.cards = PRESETS.map(p=>makeCard(p));
    const sideSeg = h('div', {class:'sideseg'}, h('span', {class:'chips-hint'}, 'Бік ураження:'));
    [['r','справа'],['l','зліва'],['b','з обох боків']].forEach(([k,l])=>{ const b = h('button', {type:'button', class:'stab', 'aria-pressed':k === SIDE ? 'true' : 'false', onclick:()=>{
        const p = PRESETS.find(x=>x.key === curKey);
        if (k === 'b' && p && p.sides && !p.both){ toast(`Для «${p.name}» двобічного варіанта немає — оберіть бік`, 3500); return; }
        SIDE = k; sideSeg.querySelectorAll('.stab').forEach(x=>x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        if (p && p.sides) applyPreset(p, s.cards[PRESETS.indexOf(p)]);
      }}, l); sideSeg.append(b); });
    sideSeg.append(h('span', {class:'chips-hint hide-m'}, 'з обох боків — пневмонія, пієлонефрит, радикулопатія, тромбоз, переломи ребер'));
    grid.append(gt, sideSeg, cards, s.emptyMy, h('div', {class:'tips', id:'hvTips', hidden:''}), h('div', {class:'pt rxvarbox', hidden:''})); filter();
  } else if (s.special === 'rx'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Лист призначень'));
    grid = rxPanel();
  } else if (s.special === 'tpl'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Мої шаблони'));
    grid = tplPanel();
  } else if (s.special === 'set'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Налаштування'));
    grid = SETTINGS_EL || h('div', {});
  } else if (s.special === 'help'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Довідка: як працювати з програмою'));
    grid = helpPanel();
  } else if (s.special === 'qv'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Показники і системи'));
    grid = qvPanel();
  } else if (s.special === 'calc'){
    head = h('div', {class:'ph'}, h('h2', {}, 'Медичні калькулятори'));
    grid = buildCalcPanel();
  } else {
    const hasNorm = s.fields.some(f=>f.norm !== undefined);
    head = h('div', {class:'ph'}, h('h2', {}, s.title),
      h('div', {class:'acts2'},
        s.fields.some(f=>f.bo) ? h('button', {type:'button', class:'btn', title:'Одним рядком: «Без особливостей» (варіант можна змінити у першому полі)', onclick:()=>{
          s.fields.forEach(f=>{ if (f.type === 'sel' && !f.bo && f.norm !== undefined){ f.el.value = ''; mark(f.el, f); } if (f.type === 'multi'){ f.chips.forEach(c=>{ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; }); refreshChips(f); } });
          const b = s.fields.find(f=>f.bo); if (b.el.value === '') b.el.value = 0; mark(b.el, b); update(); toast('Записано коротко: ' + O(b.opts[+b.el.value]).t);
        }}, 'Б/о') : null,
        hasNorm ? h('button', {type:'button', class:'btn norm', title:'Детальний опис норми по кожному пункту', onclick:()=>{applyNorm(s); update();}}, '= Норма =') : null,
        s.fields.some(f=>f.type === 'text') ? h('button', {type:'button', class:'more', title:'Створити свою кнопку з готовою фразою для цієї вкладки', onclick:()=>myBtnForm(s)}, '+ Своя кнопка') : null,
        h('button', {type:'button', class:'more', title:'Очистити поля цієї вкладки', onclick:e=>{ const b = e.currentTarget; if (!b.dataset.arm){ b.dataset.arm = '1'; b.textContent = 'Точно?'; setTimeout(()=>{ delete b.dataset.arm; b.textContent = 'Очистити вкладку'; }, 3000); return; } delete b.dataset.arm; b.textContent = 'Очистити вкладку'; clearSection(s); update(); toast('Вкладку очищено'); }}, 'Очистити вкладку')));
    grid = h('div', {class:'grid'});
    if (s.fields.some(f=>f.type === 'text')){ s.myBox = h('div', {class:'f wide mybtns', hidden:''}); grid.append(s.myBox); }
    if (s.id === 'd_main') grid.append(h('div', {class:'f wide'}, diaryBlock()));
    if (s.id === 'd_lik' || s.id === 'e_obs') grid.append(h('div', {class:'f wide'}, resBlock()));
    if (s.id === 'ctrl') grid.prepend(h('div', {class:'f wide'}, ctrlBlock()));
    if (s.id === 'scr') grid.prepend(h('div', {class:'f wide'}, scrBlock()));
    if (s.id === 'dx'){ grid.prepend(h('div', {class:'f wide'}, h('div', {class:'pt', id:'dxb', hidden:''}))); grid.append(h('div', {class:'f wide'}, h('div', {class:'pt dxhbox', id:'dxh'}))); }
    if (s.id === 'e_per') grid.prepend(h('div', {class:'f wide'}, h('div', {class:'pt'}, h('h3', {}, 'Виписка за хвилину', h('span', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:epiAuto}, 'Зібрати виписку'))),
      h('p', {class:'chips-hint'}, 'Заповнить порожні поля: дати, анамнез, динаміку й стан при виписці (з останнього щоденника), результати обстежень (з журналу), лікування (з листа призначень) і рекомендації — що продовжити приймати та поради за хворобою. Заповнене вами не змінюється.'))));
    s.hintsAfter = s.id === 'd_main' || s.id === 'd_obj' || s.id === 'd_lik';
    let boxName = null, boxGrid = null;
    s.fields.forEach(f=>{
      const el = buildField(s,f);
      if (typeof f.box === 'string'){
        if (boxName !== f.box){ boxGrid = h('div', {class:'grid'}); grid.append(h('details', {class:'box f wide'}, h('summary', {}, f.box), boxGrid)); boxName = f.box; }
        boxGrid.append(el);
      } else { boxName = null; grid.append(el); }
    });
    if (s.hintsAfter) grid.append(h('div', {class:'f wide tips dhints'}));
    if (s.hospWarn){
      s.warnEl = h('div', {class:'warnbox', hidden:''}, 'Не відмічено жодного критерію госпіталізації. Відмітьте наявні критерії або заповніть «Відступ від критеріїв» (п. I.8).');
      const src = h('p', {class:'src'}, 'Критерії подано скорочено за Стандартом, затвердженим ',
        h('a', {href:'https://www.kmu.gov.ua/news/moz-zatverdzheno-kryterii-hospitalizatsii-shcho-zminytsia-dlia-medykiv-i-patsiientiv', target:'_blank', rel:'noopener'}, 'наказом МОЗ від 30.07.2026 № 1044'),
        '. Остаточне рішення ухвалює лікар; формулювання звіряйте з офіційним текстом.');
      const ah = h('div', {class:'autohint', id:'autoHint', hidden:''}, 'Позначки «авто» поставлено за даними огляду й шкал. Перевірте їх: зайву позначку можна зняти натисканням, і вона більше не з’явиться для цього пацієнта.');
      const wrapG = h('div', {}, s.warnEl, ah, grid, src); grid = wrapG;
    }
  }
  const foot = h('div', {class:'pf'}); s.foot = foot;
  s.panel = h('div', {class:'panel', role:'tabpanel', 'aria-labelledby':`tab_${s.id}`}, head, grid, foot);
  $('#panels').append(s.panel);
});

const out = $('#out');
out.addEventListener('input', ()=>{ dirty = true; autosave(); });
out.addEventListener('paste', e=>{ e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
let savedRange = null;
document.addEventListener('selectionchange', ()=>{
  const sel = getSelection();
  if (sel.rangeCount && out.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
});
const restoreSel = ()=>{ if (!savedRange) return false; const sel = getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); return true; };
document.querySelectorAll('.fmt button').forEach(b=>{
  b.addEventListener('mousedown', e=>e.preventDefault());
  b.addEventListener('click', ()=>{
    const align = b.dataset.cmd.startsWith('justify');
    const sel = getSelection();
    const inside = sel.rangeCount && out.contains(sel.anchorNode);
    if (!inside && !restoreSel()){ toast(align ? 'Поставте курсор у потрібний рядок' : 'Спочатку виділіть текст'); return; }
    if (!align && getSelection().isCollapsed){ toast('Спочатку виділіть текст'); return; }
    if (b.dataset.cmd === 'removeFormat'){
      document.execCommand('removeFormat');
      const r = getSelection().getRangeAt(0);
      out.querySelectorAll('span[style]').forEach(sp=>{ if (r.intersectsNode(sp)) sp.replaceWith(...sp.childNodes); });
    } else document.execCommand(b.dataset.cmd);
    dirty = true;
  });
});
$('#fsize').addEventListener('change', e=>{
  const pt = e.target.value; e.target.value = '';
  if (!pt) return;
  if (!restoreSel() || getSelection().isCollapsed){ toast('Спочатку виділіть текст'); return; }
  const r = getSelection().getRangeAt(0);
  const span = document.createElement('span'); span.style.fontSize = pt + 'pt';
  span.append(r.extractContents());
  span.querySelectorAll('span').forEach(x=>{ x.style.fontSize = ''; if (!x.getAttribute('style')) x.replaceWith(...x.childNodes); });
  r.insertNode(span);
  const sel = getSelection(); sel.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(span); sel.addRange(nr);
  dirty = true; out.focus();
});
$('#regen').onclick = ()=>{ dirty = false; $('#banner').hidden = true; update(); };
$('#allNorm').onclick = ()=>{ SECTIONS.filter(s=>s.objective && s.docs.includes(DOC)).forEach(applyNorm); update(); toast('Норму виставлено в усіх системах'); };
$('#clearAll').onclick = newPatient;
$('#printBtn').onclick = doPrint;
addPrintBtns();
{ const fb = $('#fmtBtn'), fm = document.querySelector('.fmt'); let on = false; try{ on = localStorage.getItem('po.fmt') === '1'; }catch(e){}
  const ap = ()=>{ fm.hidden = !on; fb.setAttribute('aria-pressed', on ? 'true' : 'false'); }; ap();
  fb.onclick = ()=>{ on = !on; try{ localStorage.setItem('po.fmt', on ? '1' : '0'); }catch(e){} ap(); }; }
$('#paperBtn').onclick = ()=>{ PAPER = !PAPER; try{ localStorage.setItem('po.paper', PAPER ? '1' : '0'); }catch(e){} renderPaper(); };
$('#docxBtn').onclick = saveDocx;
$('#odtBtn').onclick = saveOdt;
$('#themeBtn').onclick = ()=>{ THEME = {auto:'day', day:'night', night:'auto'}[THEME]; try{ localStorage.setItem('po.theme', THEME); }catch(e){} applyTheme(); toast({auto:'Тема як у системі', day:'Денна тема', night:'Нічна тема'}[THEME]); };
applyTheme();
$('#copy').onclick = copy; $('#copy2').onclick = copy;
document.querySelectorAll('#sexSeg button').forEach(b=>b.addEventListener('click', ()=>{
  sex = sex === b.dataset.sex ? '' : b.dataset.sex;
  document.querySelectorAll('#sexSeg button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.sex === sex ? 'true' : 'false'));
  refreshLabels(); sexPlan(); update();
}));
$('#toText').onclick = ()=>$('#outBox').classList.add('open');
function openNav(){
  const L = $('#navList'); L.innerHTML = '';
  $('#tabs').querySelectorAll('.tgrp').forEach(g=>{
    const lab = g.querySelector('.tgl'); if (lab) L.append(h('div', {class:'nsg'}, lab.textContent));
    const grid = h('div', {class:'nsl'});
    g.querySelectorAll('.tab').forEach(t=>{
      const i = TABS.findIndex(x=>x.tab === t); if (i < 0 || t.hidden) return;
      grid.append(h('button', {type:'button', 'aria-current': i === active ? 'true' : 'false', onclick:()=>{ closeNav(); show(i); const f = $('.form'); if (f) window.scrollTo({top: f.getBoundingClientRect().top + window.scrollY - 4}); }},
        h('span', {}, TABS[i].short || TABS[i].title), t.classList.contains('filled') ? h('span', {class:'d', 'aria-label':'заповнено'}) : ''));
    });
    L.append(grid);
  });
  $('#navSheet').hidden = false; document.body.style.overflow = 'hidden';
}
function closeNav(){ $('#navSheet').hidden = true; document.body.style.overflow = ''; }
$('#navBtn').onclick = openNav; $('#navClose').onclick = closeNav;
document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && !$('#navSheet').hidden) closeNav(); });
$('#closeSheet2').onclick = ()=>$('#outBox').classList.remove('open');

/* старт з порожньої форми: нічого не підставляється без дії лікаря */
window.addEventListener('beforeunload', e=>{ if (PID || patientName()){ savePatient(true); return; } if (itext(out).trim()){ e.preventDefault(); e.returnValue=''; } });


const RECS_D = ['Щоденник спостереження','Огляд чергового лікаря','Спільний огляд із завідувачем відділення','Спільний огляд із заступником головного лікаря з медичної роботи','Спільний огляд із завідувачем відділення та заступником головного лікаря з медичної роботи'];
function buildFeet(){   // кнопки «‹ назад / Далі ›» внизу розділу — тепер у renderTabNav (порядок як у вкладках, без «Інструментів»)
  TABS.forEach(s=>{ if (s.foot) s.foot.innerHTML = ''; }); if (typeof renderTabNav === 'function') renderTabNav();
}
const DOCLIST = {hosp:[['ohl','Первинний огляд'],['shch','Щоденник'],['rx','Призначення'],['epi','Виписний епікриз']], amb:[['ohl','Первинний огляд'],['shch','Повторний огляд'],['rx','Призначення'],['kons','Консультаційний висновок']]};
const DOCMORE = {hosp:[['pam','Пам’ятка пацієнту'],['zav','Огляд завідувача / спільний огляд'],['konc','Консиліум'],['etap','Етапний епікриз'],['per','Переказний епікриз'],['napr','Направлення на консультацію'],['dov','Довідка'],['zgoda','Інформована згода']],
  amb:[['gosp','Направлення на госпіталізацію'],['napr','Направлення на консультацію'],['zav','Спільний огляд'],['konc','Консиліум'],['pam','Пам’ятка пацієнту'],['dov','Довідка'],['zgoda','Інформована згода']]};
const RECS_DA = ['Повторний огляд','Огляд вдома','Огляд за викликом'];
function switchDoc(nd){
  if (DOC === nd) return;
  CACHE[DOC] = {html: $('#out').innerHTML, dirty};
  DOC = nd;
  if (!(CACHE[DOC] && CACHE[DOC].dirty)) setNow();
  applyDoc(false);
  if (CACHE[DOC] && CACHE[DOC].dirty){ $('#out').innerHTML = CACHE[DOC].html; dirty = true; }
  toast({konc:'Консиліум: склад, мета, висновок і рішення; підписи всіх членів — внизу документа', gosp:'Направлення на госпіталізацію: критерії — на вкладці «Направлення» (рішення)', pam:'Пам’ятка пацієнту: ліки — з листа призначень, поради й тривожні ознаки — за хворобою', zav:'Огляд завідувача', etap:'Етапний епікриз', per:'Переказний епікриз', napr:'Направлення на консультацію', dov:'Довідка: оберіть вид і період', zgoda:'Інформована згода: відмітьте втручання', rx:'Лист призначень', ohl:'Первинний огляд', shch: MODE === 'amb' ? 'Повторний огляд' : 'Щоденник спостереження', epi:'Виписний епікриз: діагноз і скарги беруться з первинного огляду', kons:'Консультаційний висновок: скарги, діагноз і огляд беруться з первинного огляду'}[DOC]);
}
function applyDoc(first){
  if (!applyDoc.bound){ applyDoc.bound = true; $('#docMore').addEventListener('change', e=>{ if (e.target.value) switchDoc(e.target.value); }); if (window.matchMedia){ const mq = matchMedia('(max-width:899px)'); const f = ()=>applyDoc(true); if (mq.addEventListener) mq.addEventListener('change', f); } }
  if (![...DOCLIST[MODE], ...DOCMORE[MODE]].some(d=>d[0] === DOC)) DOC = 'ohl';
  const seg = $('#docSeg'); seg.innerHTML = '';
  DOCLIST[MODE].forEach(([k,l])=>{ const b = h('button', {type:'button', 'aria-pressed': k === DOC ? 'true' : 'false', onclick:()=>switchDoc(k)}, l); b.dataset.doc = k; seg.append(b); });
  const more = $('#docMore'); more.innerHTML = '';
  if (window.matchMedia && matchMedia('(max-width:899px)').matches){
    // телефон: один список усіх документів замість кнопок
    more.append(h('optgroup', {label:'Основні'}, ...DOCLIST[MODE].map(([k,l])=>h('option', {value:k}, l))), h('optgroup', {label:'Інші документи'}, ...DOCMORE[MODE].map(([k,l])=>h('option', {value:k}, l))));
    more.value = DOC; more.classList.remove('on');
  } else {
    more.append(h('option', {value:''}, 'Інші документи…'), ...DOCMORE[MODE].map(([k,l])=>h('option', {value:k}, l)));
    more.value = DOCMORE[MODE].some(d=>d[0] === DOC) ? DOC : '';
    more.classList.toggle('on', !!more.value);
  }
  const qOn = quickOn();
  TABS.forEach(t=>{ t.tab.hidden = !t.docs.includes(DOC) || (t.only && t.only !== MODE) || (t === QV ? !qOn : qOn && !QT.includes(t.id)) || (t.locSec && !locOn()); });
  layoutTabs(); syncLoc(true);
  const qb = $('#quickBtn'); if (qb){ qb.hidden = !(MODE === 'amb' && DOC === 'ohl'); qb.setAttribute('aria-pressed', QUICK ? 'true' : 'false'); }
  if (TABS[active] && TABS[active].tab.hidden && !first){ const t = TABS.find(x=>!x.tab.hidden && x !== META); if (t) show(TABS.indexOf(t)); }
  document.querySelectorAll('[data-docs]').forEach(e=>{ e.hidden = !e.dataset.docs.split(' ').includes(DOC) || (e.dataset.only && e.dataset.only !== MODE); });
  const r = document.getElementById('meta_rec');
  if (r){ const list = DOC === 'shch' ? (MODE === 'amb' ? RECS_DA : RECS_D) : DOC === 'zav' ? ['Огляд завідувача відділення','Спільний огляд з лікуючим лікарем'] : DOCTITLES[DOC] ? [docTitle()] : (MODE === 'amb' ? RECS_A : RECS);
    const keep = r.value; r.innerHTML = ''; list.forEach(o=>r.append(h('option', {}, o))); if (list.includes(keep)) r.value = keep; }
  $('#allNorm').hidden = !['ohl','shch'].includes(DOC);
  $('#allNorm').textContent = DOC === 'shch' ? 'Стабільно' : (window.matchMedia && matchMedia('(max-width:899px)').matches ? 'Норма' : 'Норма всюди');
  $('#allNorm').title = DOC === 'shch' ? 'Типовий стабільний запис щоденника' : 'Виставити норму в усіх системах огляду';
  buildFeet();
  if (!first){
    const start = DOC === 'ohl' ? HV : DOC === 'rx' ? RXT : SECTIONS.find(x=>x.id === {konc:'c_main', gosp:'gs_main', pam:'p_main', shch:'d_main', epi:'e_per', kons:'k_main', zav:'z_main', etap:'t_main', per:'t_main', napr:'n_main', dov:'v_main', zgoda:'g_main'}[DOC]);
    show(TABS.indexOf(start));
  }
  dirty = false; $('#banner').hidden = true;
  update();
}

function applyMode(){
  if (typeof rxVarRedraw === 'function') setTimeout(rxVarRedraw, 0);
  document.querySelectorAll('#modeSeg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.mode === MODE ? 'true' : 'false'));
  document.querySelectorAll('[data-only]').forEach(e=>{ e.hidden = e.dataset.only !== MODE || (e.dataset.docs && !e.dataset.docs.split(' ').includes(DOC)); });
  const H = SECTIONS.find(x=>x.id==='hosp');
  H.tab.firstChild.textContent = MODE === 'amb' ? H.shortAmb : H.short;
  H.panel.querySelector('.ph h2').textContent = MODE === 'amb' ? H.titleAmb : H.title;
  const v = document.querySelector('label[for="meta_card"]'); if (v) v.textContent = MODE === 'amb' ? '№ амбулаторної карти' : '№ медичної карти';
  { const vb = $('#vBadge'); if (vb) vb.textContent = 'v' + VERSION + (STAGE ? ' ' + STAGE : ''); }
  $('#subT').textContent =  (MODE === 'amb' ? 'Амбулаторно · генератор тексту огляду, шкали, рішення щодо госпіталізації' : 'Стаціонар · генератор тексту огляду, шкали, критерії госпіталізації');
  F('hosp.vyda').autoSet = true;
  applyDoc(true);
}
document.querySelectorAll('#modeSeg button').forEach(b=>b.addEventListener('click', ()=>{
  MODE = b.dataset.mode; try{ localStorage.setItem('po.mode', MODE); }catch(e){}
  applyMode(); if (DOC === 'ohl') show(TABS.indexOf(HV)); toast(MODE === 'amb' ? 'Амбулаторний режим' : 'Стаціонарний режим');
}));
loadDoc(); setNow(); refreshLabels(); show(TABS.indexOf(HV)); applyMode();
$('#ptbar').addEventListener('click', ()=>show(TABS.indexOf(META)));
$('#misBtn').addEventListener('click', misPanel);
$('#clearDocBtn').addEventListener('click', e=>clearDoc(e.currentTarget));
$('#quickBtn').addEventListener('click', ()=>{ QUICK = !QUICK; try{ localStorage.setItem('po.quick', QUICK ? '1' : '0'); }catch(e){}
  applyDoc(false); if (QUICK) show(TABS.indexOf(HV)); update();
  toast(QUICK ? 'Швидкий прийом: лише головне. Показники та стан систем — на вкладці «Показники»' : 'Повний огляд: усі вкладки', 3500); });
applyOvrAll(); renderRes(); update();
window.addEventListener('resize', renderPtBar);
renderPatients(); renderDiaries(); fsInit(); storePersist(); dxCodeUI(); dictLoad(); renderMyBtns(); zlogoRender();
new MutationObserver(()=>{ if (PAPER){ clearTimeout(renderPaper.t); renderPaper.t = setTimeout(renderPaper, 120); } }).observe($('#out'), {childList:true, subtree:true, characterData:true}); renderPaper();
try{ const last = localStorage.getItem('po.last'); const st = loadStore(); if (last && st[last]){ PID = last; restore(st[last].snap); markSaved(true); toast('Відкрито останнього пацієнта: ' + st[last].name, 3000); } }catch(e){}
setTimeout(()=>{ const b = backupInfo(); if (b.due) toast(`Нагадування: резервна копія пацієнтів ${b.t ? 'від ' + new Date(b.t).toLocaleDateString('uk-UA') : 'ще не робилась'}. Вкладка «Запис» → «Зберегти всіх у файл»`, 6000); }, 3500);
let lastPID; setInterval(()=>{ if (PID === lastPID) return; lastPID = PID; try{ if (PID) localStorage.setItem('po.last', PID); else localStorage.removeItem('po.last'); }catch(e){} }, 2000);   // пише лише коли пацієнт змінився
