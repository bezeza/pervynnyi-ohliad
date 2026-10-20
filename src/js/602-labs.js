/* ===== Журнал обстежень розділами (0.9.3.12): кров, біохімія, сеча, кал, мікробіологія, інструментальні, інші.
   Вписування клітинками (Tab — далі, Enter — зберегти), норма за статтю й ↑↓, попереднє значення поруч, таблиця динаміки,
   розбір рядка, вставленого з МІС/лабораторії, свої аналізи. Усе — в одному журналі RES: звідти беруть щоденник, епікриз і бланк. ===== */
const LGROUPS = [['blood','Кров'],['bio','Біохімія крові'],['urine','Сеча'],['stool','Кал'],['micro','Мікробіологія'],['instr','Інструментальні'],['other','Інші']];
const P_ = (n, u, m, f, o) => Object.assign({n, u:u || '', m:m || null, f:f || m || null}, o || {});
const T_ = (n, ph, o) => Object.assign({n, txt:true, ph:ph || ''}, o || {});
const fromLABS = t => (LABS[t] || []).map(p=>P_(p[0], p[1], p[2], p[3], {k:p[4]}));
const LABCAT = [
  /* кров */
  {t:'ЗАК', g:'blood', p:[P_('Hb','г/л',[130,175],[120,160],{k:'hb', al:'hb|hgb|гемоглобін|гем'}), P_('ер.','×10¹²/л',[4.0,5.5],[3.5,5.0],{al:'ер|еритроцити|rbc'}), P_('КП','',[0.85,1.05],null,{al:'кп|колірний показник'}),
    P_('лейк.','×10⁹/л',[4.0,9.0],null,{al:'лейк|лейкоцити|wbc|л(?=\\s*[-:=]?\\s*\\d)'}), P_('е','%',[1,5],null,{al:'е|еоз|еозинофіли'}), P_('п/я','%',[1,6],null,{al:'п/я|п|пал|паличкоядерні'}), P_('с/я','%',[47,72],null,{al:'с/я|с|сегм|сегментоядерні'}),
    P_('л','%',[19,37],null,{al:'лімф|лімфоцити', noName:true}), P_('м','%',[3,11],null,{al:'м|мон|моноцити'}), P_('тр.','×10⁹/л',[150,400],null,{al:'тр|тромбоцити|plt'}), P_('ШОЕ','мм/год',[2,15],[2,20],{al:'шое|шоэ|сое|esr'})]},
  /* ЗАК з гематологічного аналізатора (5-diff: WBC, Neu#, Lym#…, RBC, HGB, HCT, MCV…, PLT, MPV, PDW, PCT, P-LCC, P-LCR); норми — типові референтні для дорослих */
  {t:'ЗАК (гематологічний аналізатор)', g:'blood', p:[
    P_('лейк.','×10⁹/л',[4.0,9.0],null,{al:'wbc'}), P_('нейтр. абс.','×10⁹/л',[2.0,7.0],null,{al:'neu#'}), P_('лімф. абс.','×10⁹/л',[0.8,4.0],null,{al:'lym#'}), P_('мон. абс.','×10⁹/л',[0.12,1.2],null,{al:'mon#'}),
    P_('еоз. абс.','×10⁹/л',[0.02,0.5],null,{al:'eos#'}), P_('баз. абс.','×10⁹/л',[0,0.1],null,{al:'bas#'}),
    P_('нейтр.','%',[47,72],null,{al:'neu%'}), P_('лімф.','%',[19,37],null,{al:'lym%'}), P_('мон.','%',[3,11],null,{al:'mon%'}), P_('еоз.','%',[0.5,5],null,{al:'eos%'}), P_('баз.','%',[0,1],null,{al:'bas%'}),
    P_('ер.','×10¹²/л',[4.0,5.5],[3.5,5.0],{al:'rbc'}), P_('Hb','г/л',[130,175],[120,160],{al:'hgb|hb', k:'hb'}), P_('Ht','%',[40,48],[36,42],{al:'hct'}),
    P_('MCV','фл',[80,100],null,{al:'mcv'}), P_('MCH','пг',[27,34],null,{al:'mch'}), P_('MCHC','г/л',[320,360],null,{al:'mchc'}), P_('RDW-CV','%',[11.5,14.5],null,{al:'rdw-cv'}), P_('RDW-SD','фл',[39,46],null,{al:'rdw-sd'}),
    P_('тр.','×10⁹/л',[150,400],null,{al:'plt'}), P_('MPV','фл',[7.0,11.0],null,{al:'mpv'}), P_('PDW','',[15,17],null,{al:'pdw'}), P_('PCT','%',[0.108,0.282],null,{al:'pct'}),
    P_('P-LCC','×10⁹/л',[30,90],null,{al:'p-lcc'}), P_('P-LCR','%',[11,45],null,{al:'p-lcr'}), P_('ШОЕ','мм/год',[2,15],[2,20],{al:'шое|сое|esr'})]},
  {t:'коагулограма', g:'blood', p:[P_('МНВ','',[0.8,1.2],null,{al:'мнв|inr'}), P_('ПТІ','%',[80,105]), P_('АЧТЧ','с',[25,35]), P_('фібриноген','г/л',[2,4])]},
  {t:'D-димер', g:'blood', p:[P_('D-димер','мкг/мл FEU',[0,0.5])]},
  {t:'група крові та резус-фактор', g:'blood', p:[T_('група','O(I), A(II), B(III), AB(IV)'), T_('резус','Rh+ / Rh−')]},
  {t:'RW', g:'blood', p:[T_('результат','негативна')]},
  {t:'ВІЛ', g:'blood', p:[T_('результат','негативний')]},
  {t:'маркери вірусних гепатитів', g:'blood', p:[T_('HBsAg','не виявлено'), T_('анти-HCV','не виявлено')]},
  /* біохімія */
  {t:'біохімічний аналіз крові', g:'bio', p:fromLABS('біохімічний аналіз крові')},
  {t:'печінкові проби', g:'bio', p:[P_('білірубін заг.','мкмоль/л',[3.4,20.5]), P_('прямий','мкмоль/л',[0,5.1]), P_('непрямий','мкмоль/л',[3.4,15.4]), P_('АЛТ','Од/л',[0,40]), P_('АСТ','Од/л',[0,40]), P_('тимолова проба','од',[0,4]), P_('ЛФ','Од/л',[40,150]), P_('ГГТП','Од/л',[10,71],[6,42])]},
  {t:'глюкоза крові', g:'bio', p:[P_('глюкоза','ммоль/л',[3.9,6.1],null,{k:'glu'})]},
  {t:'глікований гемоглобін', g:'bio', p:fromLABS('глікований гемоглобін')},
  {t:'ліпідограма', g:'bio', p:fromLABS('ліпідограма')},
  {t:'амілаза крові', g:'bio', p:[P_('амілаза','Од/л',[28,100])]},
  {t:'С-реактивний білок', g:'bio', p:[P_('СРБ','мг/л',[0,5])]},
  {t:'ТТГ', g:'bio', p:[P_('ТТГ','мОд/л',[0.4,4.0])]},
  {t:'феритин', g:'bio', p:[P_('феритин','нг/мл',[30,400],[13,150])]},
  {t:'сечова кислота', g:'bio', p:[P_('сечова кислота','мкмоль/л',[200,420],[140,340])]},
  /* сеча */
  /* ЗАС — у порядку бланка ф. 210/о; хімічна частина читається й з аналізатора (cobas u 411 тощо: SG, PH, LEU, NIT, PRO, GLU, KET, UBG, BIL, ERY, Color, Clarity) */
  {t:'ЗАС', g:'urine', p:[P_('кількість','мл'), T_('колір','солом’яно-жовтий',{al:'colou?r|колір'}), T_('прозорість','прозора',{al:'clarity|прозорість'}),
    P_('питома вага','',[1010,1025],null,{al:'sg|пит\\.? вага|питома вага|відн\\.? щільність', sg:true}), P_('реакція (pH)','',[4.5,8],null,{al:'ph|рн|реакція'}),
    P_('білок','г/л',[0,0.033],null,{al:'pro|білок'}), P_('глюкоза','ммоль/л',[0,0.8],null,{al:'glu|глюкоза'}), P_('кетонові тіла','',null,null,{al:'ket|кетон[а-яі]*'}),
    P_('реакція на кров','',null,null,{al:'ery|bld|кров'}), P_('білірубін','',null,null,{al:'bil|білірубін'}), P_('уробіліноген','',null,null,{al:'ubg|уробіл[а-яі]*'}),
    P_('нітрити','',null,null,{al:'nit|нітрит[а-яі]*'}), P_('лейкоцити (смужка)','/мкл',[0,10],null,{al:'leu|лейк[а-яі]*\\s*смуж[а-яі]*'}),
    P_('лейк.','в п/з',[0,5],[0,6],{al:'лейк|лейкоцити', noName:true}), P_('ер.','в п/з',[0,2],null,{al:'ер|еритроцити', noName:true}), T_('епітелій','плоский поодинокий'),
    T_('циліндри','немає'), T_('солі','немає'), T_('бактерії','немає'), T_('слиз','немає')]},
  {t:'проба Нечипоренка', g:'urine', p:[P_('лейк.','/мл',[0,2000]), P_('ер.','/мл',[0,1000]), P_('циліндри','/мл',[0,20])]},
  {t:'аналіз сечі на глюкозу (добова)', g:'urine', p:[P_('діурез','мл/добу',[800,2000]), P_('глюкоза','ммоль/л',[0,0.8]), T_('глюкоза за добу','… г')]},
  {t:'діастаза сечі', g:'urine', p:[P_('діастаза','од (за Вольгемутом)',[16,64])]},
  {t:'проба Зимницького', g:'urine', p:[P_('добовий діурез','мл',[800,2000]), P_('денний','мл'), P_('нічний','мл'), T_('щільність','від … до …')]},
  /* кал */
  {t:'копрограма', g:'stool', p:[T_('консистенція','оформлений'), T_('колір','коричневий'), T_('м’язові волокна','поодинокі'), T_('нейтральний жир','немає'), T_('жирні кислоти','немає'),
    T_('крохмаль','немає'), T_('клітковина','незначна кількість'), T_('слиз','немає'), T_('лейкоцити','поодинокі'), T_('еритроцити','немає'), T_('яйця глистів','не виявлено')]},
  {t:'аналіз калу на яйця глистів', g:'stool', p:[T_('результат','не виявлено')]},
  {t:'аналіз калу на приховану кров', g:'stool', p:[T_('результат','негативний')]},
  /* мікробіологія */
  ...['бактеріологічне дослідження харкотиння','бактеріологічне дослідження сечі','бактеріологічне дослідження калу','посів крові на стерильність','бактеріологічне дослідження ранового вмісту','мазок із зіву на флору та BL','мокротиння на МБТ','експрес-тест на SARS-CoV-2 і грип']
    .map(t=>({t, g:'micro', p:[T_('збудник','… або «росту немає»'), T_('чутливий до',''), T_('резистентний до','')]})),
  /* інструментальні */
  {t:'ЕКГ', g:'instr', p:[T_('ритм','синусовий'), P_('ЧСС','за хв',[60,90]), T_('ЕВС','нормальна'), T_('висновок','')]},
  {t:'рентгенографія ОГК', g:'instr', p:[T_('висновок','')]},
  {t:'спірографія', g:'instr', p:[P_('ОФВ1','% належн.',[80,999]), P_('ФЖЄЛ','% належн.',[80,999]), P_('ОФВ1/ФЖЄЛ','',[0.7,1]), T_('висновок','')]},
  {t:'ЕхоКГ', g:'instr', p:[P_('ФВ ЛШ','%',[52,80]), T_('висновок','')]}
];
/* решта обстежень із плану — текстом за шаблоном, у «Інструментальні» або «Інші» */
const LAB_INSTR = /^(УЗД|ФГДС|холтер|ДМАТ|оглядова|рентгенограф|КТ|МРТ|ЕЕГ|мамограф|флюорограф|пікфлоу|люмбальн)/i;
function labCat(){
  const own = (CUSTOM.labs || []).map(x=>Object.assign({own:true}, x));
  const L = [...LABCAT, ...own], have = new Set(L.map(x=>x.t));
  resTests().forEach(t=>{ if (!have.has(t)){ L.push({t, g:LAB_INSTR.test(t) ? 'instr' : 'other', p:[T_('результат', resTpl(t))]}); have.add(t); } });
  RES.forEach(r=>{ if (!have.has(r.t)){ L.push({t:r.t, g:'other', p:[T_('результат','')]}); have.add(r.t); } });
  return L;
}
/* що означають коди аналізаторів — підказка під клітинкою */
const LDESC = {wbc:'WBC — лейкоцити', 'neu#':'Neu# — нейтрофіли, абсолютна кількість', 'lym#':'Lym# — лімфоцити, абс.', 'mon#':'Mon# — моноцити, абс.', 'eos#':'Eos# — еозинофіли, абс.', 'bas#':'Bas# — базофіли, абс.',
  'neu%':'Neu% — нейтрофіли (п/я + с/я), %', 'lym%':'Lym% — лімфоцити, %', 'mon%':'Mon% — моноцити, %', 'eos%':'Eos% — еозинофіли, %', 'bas%':'Bas% — базофіли, %', rbc:'RBC — еритроцити',
  'hgb|hb':'HGB — гемоглобін', hct:'HCT — гематокрит', mcv:'MCV — середній об’єм еритроцита', mch:'MCH — середній вміст Hb в еритроциті', mchc:'MCHC — середня концентрація Hb в еритроцитах',
  'rdw-cv':'RDW-CV — ширина розподілу еритроцитів (анізоцитоз), %', 'rdw-sd':'RDW-SD — ширина розподілу еритроцитів, фл', plt:'PLT — тромбоцити', mpv:'MPV — середній об’єм тромбоцита',
  pdw:'PDW — ширина розподілу тромбоцитів', pct:'PCT — тромбокрит', 'p-lcc':'P-LCC — кількість великих тромбоцитів', 'p-lcr':'P-LCR — частка великих тромбоцитів',
  'sg|пит\\.? вага|питома вага|відн\\.? щільність':'SG — питома вага (аналізатор 1.005 = 1005)', 'ph|рн|реакція':'PH — реакція сечі', 'pro|білок':'PRO — білок', 'glu|глюкоза':'GLU — глюкоза',
  'ket|кетон[а-яі]*':'KET — кетонові тіла', 'ery|bld|кров':'ERY / BLD — кров (еритроцити, Hb) у сечі', 'bil|білірубін':'BIL — білірубін', 'ubg|уробіл[а-яі]*':'UBG — уробіліноген',
  'nit|нітрит[а-яі]*':'NIT — нітрити (ознака бактеріурії)', 'leu|лейк[а-яі]*\\s*смуж[а-яі]*':'LEU — лейкоцитарна естераза (лейкоцити на смужці)', 'colou?r|колір':'Color — колір', 'clarity|прозорість':'Clarity — прозорість'};
const labDef = t => labCat().find(x=>x.t === t);
const lNum = v => { const m = String(v).replace(',', '.').match(/-?\d+(?:\.\d+)?/g); return m ? Math.max(...m.map(Number)) : NaN; };
const lRange = p => !p.m ? null : sex === 'f' ? (p.f || p.m) : sex === 'm' ? p.m : [Math.min(p.m[0], (p.f || p.m)[0]), Math.max(p.m[1], (p.f || p.m)[1])];
const lRngTxt = r => !r ? '' : r[0] <= 0 ? '< ' + dec(r[1]) : r[1] >= 900 ? '> ' + dec(r[0]) : dec(r[0]) + '–' + dec(r[1]);
function lMark(p, v){ if (p.txt) return ''; let x = lNum(v); const r = lRange(p); if (p.sg && x < 2) x *= 1000; if (isNaN(x) || !r) return ''; return x < r[0] ? ' ↓' : x > r[1] ? ' ↑' : ''; }
function lCompose(def, vals){
  return def.p.map((p, i)=>{ const v = String(vals[i] || '').trim(); if (!v) return '';
    if (def.p.length === 1 && (p.n === 'результат' || p.n === 'висновок')) return v;
    const isNum = !p.txt && /^-?\d+([.,]\d+)?$/.test(v);
    return `${p.n} ${isNum ? v.replace('.', ',') : v}${isNum && p.u ? ' ' + p.u : ''}${lMark(p, v)}`; }).filter(Boolean).join(', ');
}
/* значення в калькулятори й контроль (Hb, креатинін, глюкоза…) */
function lApply(def, vals, date){
  def.p.forEach((p, i)=>{ const x = lNum(vals[i]); if (!p.k || isNaN(x)) return;
    const pt = document.getElementById('pt_' + p.k); if (pt) pt.value = dec(x);
    const c = document.getElementById(`ctrl_${p.k}_0`); if (c){ c.value = dec(x); const cd = document.getElementById(`ctrl_${p.k}_d`); if (cd) cd.value = date; } });
}
/* розбір рядка з МІС / бланка лабораторії: «Hb 174 Ер 5,1 Л 10,2 ШОЕ 28» */
const LWORD = {neg:'негативно', negative:'негативно', norm:'норма', normal:'норма', pos:'позитивно', positive:'позитивно', trace:'сліди', tr:'сліди',
  yellow:'жовтий', 'light yellow':'світло-жовтий', straw:'солом’яно-жовтий', amber:'бурштиновий', red:'червоний', brown:'коричневий', colorless:'безбарвний', orange:'помаранчевий',
  clear:'прозора', cloudy:'каламутна', turbid:'каламутна', 'sl cloudy':'злегка каламутна', hazy:'злегка каламутна'};
const lEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function lParse(def, text){
  const out = def.p.map(()=>''), src = ' ' + String(text).replace(/[\r\n]+/g, ' ; ').replace(/\s+/g, ' ') + ' ';
  def.p.forEach((p, i)=>{
    const names = [p.noName ? '' : lEsc(p.n.replace(/\.$/, '')), ...(p.al ? p.al.split('|') : [])].filter(Boolean);
    for (const nm of names){
      const re = new RegExp('(?:^|[\\s,;(])(?:' + nm + ')\\.?\\s*[-–:=]?\\s*(?:[A-Za-zА-ЯІЇЄҐ↑↓*]{1,2}\\s+)?(\\d+(?:[.,]\\d+)?|[A-Za-zА-Яа-яІіЇїЄєҐґ’\']+(?: (?:yellow|cloudy))?)', 'i');
      const m = src.match(re); if (!m) continue;
      let v = m[1];
      if (/^\d/.test(v)){ let x = +v.replace(',', '.'); if (p.sg && x < 2) v = String(Math.round(x * 1000)); else v = v.replace('.', ','); }
      else { const w = LWORD[v.toLowerCase()]; if (!w) continue; v = w; }
      out[i] = v; break;
    }
  });
  return out;
}
/* попереднє значення цього показника */
function lPrev(t, i, beforeDate, exceptId){
  const L = RES.filter(r=>r.t === t && r.vals && r.id !== exceptId && (!beforeDate || r.d <= beforeDate)).sort((a, b)=>a.d < b.d ? 1 : a.d > b.d ? -1 : b.id - a.id);
  for (const r of L){ const v = String(r.vals[i] || '').trim(); if (v) return {v, d:r.d}; }
  return null;
}
function lSave(def, date, vals, id){
  const v = lCompose(def, vals); if (!v){ toast('Впишіть хоча б один показник'); return false; }
  if (id){ const r = RES.find(x=>x.id === id); if (r){ r.d = date; r.vals = vals.slice(); r.v = v; } }
  else RES.push({id:++RESN, d:date, t:def.t, v, vals:vals.slice()});
  RES.sort((a, b)=>a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id);
  lApply(def, vals, date); renderRes(); savePatient(true); update();
  try{ logAct('Аналіз вписано', def.t); }catch(e){}
  return true;
}

/* ---------- вікно журналу ---------- */
let LJ = null, LJG = 'blood';
function labsOpen(o){
  o = o || {}; if (LJ) LJ.remove();
  const tabs = h('div', {class:'seg ljtabs', role:'tablist'}), body = h('div', {class:'ljbody'}), ed = h('div', {class:'ljed', hidden:''});
  LJ = h('div', {class:'navsheet packsheet ljdlg', role:'dialog', 'aria-modal':'true', 'aria-label':'Журнал обстежень'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Журнал обстежень'), h('span', {style:'flex:1'}),
      h('button', {type:'button', class:'btn primary', onclick:()=>edit(null)}, '＋ Вписати аналіз'), h('button', {type:'button', class:'btn', onclick:()=>ownLabDialog()}, '＋ Свій аналіз'),
      h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')), tabs, ed, body));
  function close(){ if (LJ){ LJ.remove(); LJ = null; } }
  LJ.addEventListener('click', e=>{ if (e.target === LJ) close(); });
  LJ.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); if (!ed.hidden){ ed.hidden = true; drawBody(); } else close(); } });
  const cat = labCat();
  function drawTabs(){
    tabs.innerHTML = '';
    LGROUPS.forEach(([g, n])=>{ const c = RES.filter(r=>{ const d = cat.find(x=>x.t === r.t); return (d ? d.g : 'other') === g; }).length;
      tabs.append(h('button', {type:'button', role:'tab', 'aria-pressed':LJG === g ? 'true' : 'false', onclick:()=>{ LJG = g; ed.hidden = true; drawTabs(); drawBody(); }}, n + (c ? ' · ' + c : ''))); });
  }
  function drawBody(){
    body.innerHTML = ''; const tests = cat.filter(x=>x.g === LJG);
    const used = tests.filter(d=>RES.some(r=>r.t === d.t)), free = tests.filter(d=>!RES.some(r=>r.t === d.t));
    if (!used.length) body.append(h('p', {class:'chips-hint'}, 'У цьому розділі ще нічого не вписано.'));
    used.forEach(d=>{
      const L = RES.filter(r=>r.t === d.t);
      const head = h('div', {class:'ljh'}, h('b', {}, cap(d.t)), h('span', {style:'flex:1'}), h('button', {type:'button', class:'btn sm', onclick:()=>edit(d.t)}, '+ дата'));
      if (d.p.length > 1 && L.some(r=>r.vals)){
        const tb = h('table', {class:'ljt'}), tr0 = h('tr', {}, h('th', {}, 'Показник'));
        L.forEach(r=>tr0.append(h('th', {}, h('button', {type:'button', class:'more', title:'Змінити запис', onclick:()=>edit(d.t, r.id)}, fmtS(r.d)))));
        tb.append(h('thead', {}, tr0));
        const tbody = h('tbody');
        d.p.forEach((p, i)=>{ if (!L.some(r=>r.vals && String(r.vals[i] || '').trim())) return;
          const tr = h('tr', {}, h('th', {}, p.n + (p.u ? ', ' + p.u : ''), h('span', {class:'chips-hint'}, p.m ? ' ' + lRngTxt(lRange(p)) : '')));
          L.forEach(r=>{ const v = r.vals ? String(r.vals[i] || '').trim() : ''; const mk = v ? lMark(p, v) : ''; tr.append(h('td', {class:mk ? 'abn' : ''}, v ? v + mk : '—')); });
          tbody.append(tr); });
        tb.append(tbody); body.append(h('div', {class:'ljcard'}, head, h('div', {class:'ljscroll'}, tb)));
      } else body.append(h('div', {class:'ljcard'}, head, ...L.map(r=>h('div', {class:'ljrow'}, h('button', {type:'button', class:'more', onclick:()=>edit(d.t, r.id)}, fmtS(r.d)), h('span', {}, r.v)))));
    });
    if (free.length) body.append(h('div', {class:'ljfree'}, h('span', {class:'chips-hint'}, 'Вписати: '), ...free.map(d=>h('button', {type:'button', class:'chip q', onclick:()=>edit(d.t)}, d.t))));
  }
  /* форма вписування: клітинки з Tab */
  function edit(t, id){
    ed.hidden = false; ed.innerHTML = '';
    const r0 = id ? RES.find(x=>x.id === id) : null;
    const sel = h('select', {'aria-label':'Аналіз'}, h('option', {value:''}, '— оберіть аналіз —'), ...LGROUPS.map(([g, n])=>h('optgroup', {label:n}, ...cat.filter(x=>x.g === g).map(x=>h('option', {value:x.t}, x.t)))));
    sel.value = t || (r0 && r0.t) || '';
    const date = h('input', {type:'date', 'aria-label':'Дата аналізу', value:(r0 && r0.d) || todayISO()});
    const grid = h('div', {class:'ljgrid'}), paste = h('textarea', {rows:1, placeholder:'Вставте рядок з МІС або лабораторії: «Hb 174 Ер 5,1 Л 10,2 ШОЕ 28» — розкладу по клітинках', 'aria-label':'Вставити рядок'});
    let ins = [];
    const save = (next) => { const d = labDef(sel.value); if (!d){ toast('Оберіть аналіз'); sel.focus(); return; }
      if (!lSave(d, date.value || todayISO(), ins.map(i=>i.value.trim()), r0 && r0.id)) return;
      toast('Записано: ' + d.t + ' (' + fmtS(date.value || todayISO()) + ')'); drawTabs();
      if (next){ const g = cat.filter(x=>x.g === d.g), k = g.findIndex(x=>x.t === d.t); const nx = g.slice(k + 1).find(x=>!RES.some(r=>r.t === x.t && r.d === (date.value || todayISO())));
        if (nx){ LJG = d.g; edit(nx.t); drawBody(); return; } }
      LJG = d.g; drawTabs(); ed.hidden = true; drawBody(); };
    const build = () => {
      grid.innerHTML = ''; ins = []; const d = labDef(sel.value); if (!d) return;
      d.p.forEach((p, i)=>{
        const v0 = r0 && r0.vals ? r0.vals[i] || '' : '';
        const inp = h('input', {inputmode:p.txt ? 'text' : 'decimal', value:v0, placeholder:p.ph || '', 'aria-label':p.n});
        const pv = lPrev(d.t, i, date.value, r0 && r0.id), rg = lRange(p);
        const flag = h('span', {class:'ljflag'});
        const upd = () => { const mk = lMark(p, inp.value); flag.textContent = mk.trim(); inp.classList.toggle('abn', !!mk); };
        inp.addEventListener('input', upd); upd();
        inp.addEventListener('keydown', e=>{ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); save(true); } });
        if (p.txt && p.ph) inp.addEventListener('focus', ()=>{ if (!inp.value){ inp.value = p.ph.replace(/^… або .*$/, ''); inp.select(); upd(); } });
        const ds = p.al && LDESC[p.al];
        grid.append(h('label', {class:'ljcell' + (p.txt ? ' txt' : ''), title:ds || ''}, h('span', {class:'ljn'}, p.n, p.u ? h('small', {}, ' ' + p.u) : ''), ds ? h('small', {class:'ljd'}, ds) : '',
          h('span', {class:'ljin'}, inp, flag),
          h('small', {class:'chips-hint'}, [rg ? 'норма ' + lRngTxt(rg) : '', pv ? `було ${pv.v} (${fmtS(pv.d)})` : ''].filter(Boolean).join(' · ') || ' ')));
        ins.push(inp);
      });
      setTimeout(()=>{ const f = ins.find(i=>!i.value) || ins[0]; if (f) f.focus(); }, 30);
    };
    sel.addEventListener('change', build);
    paste.addEventListener('input', ()=>{ const d = labDef(sel.value); if (!d) return; const v = lParse(d, paste.value); let n = 0; v.forEach((x, i)=>{ if (x && ins[i]){ ins[i].value = x; ins[i].dispatchEvent(new Event('input')); n++; } }); if (n) toast(`Розкладено по клітинках: ${n}`); });
    const del = r0 ? h('button', {type:'button', class:'more', onclick:()=>{ if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно видалити?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = 'Видалити запис'; }, 3000); return; }
      RES = RES.filter(x=>x !== r0); renderRes(); savePatient(true); update(); ed.hidden = true; drawTabs(); drawBody(); }}, 'Видалити запис') : '';
    ed.append(h('div', {class:'res-form'}, sel, date), paste, grid,
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>save(false)}, 'Записати'), h('button', {type:'button', class:'btn', onclick:()=>save(true)}, 'Записати й далі (Enter)'),
        h('button', {type:'button', class:'more', onclick:()=>{ ed.hidden = true; }}, 'Скасувати'), del),
      h('p', {class:'chips-hint'}, 'Tab — наступна клітинка, Enter — записати й перейти до наступного аналізу розділу. Порожні клітинки в текст не йдуть.'));
    build(); if (!sel.value) sel.focus();
    ed.scrollIntoView({block:'nearest'});
  }
  drawTabs(); drawBody(); document.body.append(LJ);
  if (o.test){ const d = labDef(o.test); if (d){ LJG = d.g; drawTabs(); drawBody(); } edit(o.test, o.id); }
  else if (o.add) edit(null);
  return LJ;
}

/* ---------- свій аналіз ---------- */
function ownLabDialog(){
  const nm = h('input', {placeholder:'Назва, напр. «Прокальцитонін»'}), gs = h('select', {}, ...LGROUPS.map(([g, n])=>h('option', {value:g}, n)));
  const rows = h('div', {class:'ownrows'});
  const addRow = () => { const r = h('div', {class:'ownrow'}, h('input', {placeholder:'Показник', class:'on'}), h('input', {placeholder:'Одиниці', class:'ou'}), h('input', {placeholder:'норма від', class:'ol', inputmode:'decimal'}), h('input', {placeholder:'до', class:'oh', inputmode:'decimal'}),
    h('label', {class:'blk'}, h('input', {type:'checkbox', class:'ot'}), ' текст')); rows.append(r); r.querySelector('input').focus(); };
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Свій аналіз'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Свій аналіз'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('div', {class:'wgrid'}, h('label', {class:'wl'}, 'Назва', nm), h('label', {class:'wl'}, 'Розділ', gs)), h('b', {style:'display:block;margin-top:10px'}, 'Показники'), rows,
      h('div', {class:'acts2', style:'margin-top:8px'}, h('button', {type:'button', class:'btn', onclick:addRow}, '+ показник'), h('button', {type:'button', class:'btn primary', onclick:()=>{
        const t = nm.value.trim(); if (!t){ toast('Вкажіть назву'); return; }
        const p = [...rows.children].map(r=>{ const g = c => r.querySelector('.' + c).value.trim(), lo = num(g('ol')), hi = num(g('oh')), txt = r.querySelector('.ot').checked;
          return g('on') ? (txt ? {n:g('on'), txt:true, ph:''} : {n:g('on'), u:g('ou'), m:isNaN(lo) && isNaN(hi) ? null : [isNaN(lo) ? 0 : lo, isNaN(hi) ? 999 : hi], f:null}) : null; }).filter(Boolean);
        if (!p.length){ toast('Додайте хоча б один показник'); return; }
        CUSTOM.labs = (CUSTOM.labs || []).filter(x=>x.t !== t); CUSTOM.labs.push({t, g:gs.value, p}); saveCustom();
        toast('Свій аналіз «' + t + '» додано'); dlg.remove(); if (LJ){ LJG = gs.value; labsOpen({test:t}); } }}, 'Зберегти аналіз')),
      h('p', {class:'chips-hint'}, 'Зберігається в «Моїх шаблонах» і йде в пакет фраз — можна поділитися з колегами.')));
  document.body.append(dlg); addRow(); nm.focus();
}

/* ---------- інтеграція ---------- */
/* старі поля п. 46–53 епікризу більше не потрібні — дані беруться з журналу */
SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (s.id === 'e_obs' && /^z\d\d$/.test(f.id)){ f.noOut = true; if (f.wrapEl) f.wrapEl.hidden = true; const d = f.wrapEl && f.wrapEl.closest('details'); if (d) d.hidden = true; } }));
/* кнопки журналу в блоках «Журнал обстежень» (щоденник, епікриз) */
document.querySelectorAll('.resbox').forEach(b=>{ const hd = b.querySelector('h3');
  b.classList.add('resnew');
  const a = h('div', {class:'acts2 resacts'}, h('button', {type:'button', class:'btn primary', onclick:()=>labsOpen({add:true})}, '＋ Вписати аналіз'), h('button', {type:'button', class:'btn', onclick:()=>labsOpen()}, 'Журнал обстежень (розділами)'));
  if (hd) hd.after(a); else b.prepend(a); });
/* п. 46–53 на бланку: клік — вписати саме цей аналіз */
const BEPI_T = {46:'ЗАК', 47:'ЗАС', 48:'печінкові проби', 49:'копрограма', 50:'глюкоза крові', 51:'амілаза крові', 52:'аналіз сечі на глюкозу (добова)', 53:'діастаза сечі'};
document.addEventListener('click', e=>{
  const g = e.target.closest && e.target.closest('#paper .bepi [data-fld^="e_obs_z"]'); if (!g) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const n = +g.dataset.fld.replace('e_obs_z', ''); labsOpen({test:BEPI_T[n]});
}, true);
/* банер: «Обстеження · N» */
function labsCol(){ const cols = document.querySelector('#ptline .pcols'); if (!cols) return; let c = cols.querySelector('.pcol.labs'); const n = RES.length;
  if (!c){ c = h('button', {type:'button', class:'pcol labs', title:'Журнал обстежень розділами', onclick:()=>labsOpen()}, h('span', {class:'plab'}, 'Обстеження'), h('span', {class:'pval'})); cols.append(c); }
  c.querySelector('.pval').textContent = n ? `${n} ${plural(n, ['запис','записи','записів'])}` : 'вписати'; }
{ const rp = renderPtBar; renderPtBar = function(){ const r = rp.apply(this, arguments); try{ labsCol(); }catch(e){} return r; }; }
{ const up = update; update = function(){ const r = up.apply(this, arguments); try{ labsCol(); }catch(e){} return r; }; }
/* свої аналізи — у файл шаблонів і пакети */
{ const dj = downloadJSON; downloadJSON = function(obj){ if (obj && obj.type === 'po-templates' && !obj.labs) obj.labs = CUSTOM.labs || []; return dj.apply(this, arguments); }; }
{ const i1 = importTpl; importTpl = function(file){ const rd = new FileReader(); rd.onload = () => { try{ const o = JSON.parse(rd.result); if (o && o.type === 'po-templates' && Array.isArray(o.labs)){ let n = 0; o.labs.forEach(x=>{ if (x && x.t && Array.isArray(x.p) && !(CUSTOM.labs = CUSTOM.labs || []).some(y=>y.t === x.t)){ CUSTOM.labs.push(x); n++; } }); if (n){ saveCustom(); toast(`Своїх аналізів додано: ${n}`, 2500); } } }catch(e){} }; rd.readAsText(file); return i1.apply(this, arguments); }; }
/* Ctrl+K */
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'Вписати аналіз (журнал обстежень)', go:()=>labsOpen({add:true})}, {k:'Дія', t:'Журнал обстежень розділами', go:()=>labsOpen()}, {k:'Дія', t:'Свій аналіз', go:ownLabDialog}); return L; }; }
