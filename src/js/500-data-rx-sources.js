/* Джерела схем: настанови МОЗ України (де знайдено чинний документ) і міжнародні з найвищою доказовістю.
   Рівень: високий — сильна рекомендація / клас I, рівень A; помірний — B або умовна рекомендація; низький — C, думка експертів. */
const MOZ_AB = 'МОЗ: стандарти «Раціональне застосування протимікробних лікарських засобів…» (наказ № 1328 від 09.09.2026)';
const MOZ_PAP = 'МОЗ: стандарт «Парентеральна периопераційна антибіотикопрофілактика» (наказ № 540 від 23.04.2026)';
const RXSRC = {
  pneu:['ATS/IDSA 2019; ERS/ESICM/ESCMID/ALAT 2023', 'високий', MOZ_AB], gh:['ESC 2024 (АГ)', 'високий', 'МОЗ: УКПМД «Гіпертонічна хвороба (артеріальна гіпертензія)» (наказ № 1581 від 12.09.2024)'],
  ihd:['ESC 2024 (хронічні коронарні синдроми)', 'високий'], hf:['ESC 2021 + оновлення 2023 (СН)', 'високий'], gastr:['Maastricht VI/Florence 2022 (H. pylori)', 'високий'],
  copd:['GOLD 2025', 'високий', 'МОЗ: УКПМД «Хронічне обструктивне захворювання легень» (наказ № 1610 від 20.09.2024)'],
  dm:['ADA Standards of Care 2025 (зокрема розділ «Діабет у стаціонарі»)', 'високий', 'МОЗ: УКПМД «Цукровий діабет 2 типу у дорослих» (наказ № 1300 від 24.07.2024, зміни № 1678 від 01.10.2024)'],
  af:['ESC 2024 (ФП)', 'високий'], asthma:['GINA 2024', 'високий'], pyelo:['EAU 2024 (урологічні інфекції)', 'помірний', MOZ_AB],
  stroke:['ESO; AHA/ASA 2019 і 2021', 'високий', 'МОЗ: стандарт «Ішемічний інсульт» (наказ № 1070 від 20.06.2024); «Вторинна профілактика інсульту» (наказ № 1967 від 02.11.2022)'],
  tia:['AHA/ASA 2021 (вторинна профілактика)', 'високий', 'МОЗ: стандарт «Вторинна профілактика інсульту» (наказ № 1967 від 02.11.2022)'],
  de:['ESC 2021 (профілактика ССЗ)', 'помірний'], rad:['NICE NG59 (2016, оновл. 2020)', 'помірний', 'МОЗ: стандарт «Біль у попереку (нижній частині спини)» (наказ № 1326 від 08.09.2026)'],
  cerv:['NICE CKS (шийна радикулопатія)', 'низький'], dpn:['ADA 2022; AAN 2022 (больова нейропатія)', 'високий'], migr:['EHF 2022; AHS 2021', 'високий'],
  bell:['AAO-HNS 2013', 'високий'], epi:['ESETT 2019; AES 2016 (епістатус)', 'високий'], bppv:['AAO-HNS 2017', 'високий'],
  app:['WSES 2020 (Jerusalem)', 'високий', MOZ_PAP], chol:['Tokyo Guidelines 2018; WSES 2020', 'помірний', MOZ_PAP], panc:['AGA 2018; IAP/APA; WATERFALL 2022', 'помірний'],
  gib:['ESGE 2021; Baveno VII 2022', 'високий'], obstr:['WSES 2017 (Bologna)', 'помірний'], hern:['HerniaSurge 2018; WSES 2017', 'помірний', MOZ_PAP],
  dvt:['ESC 2019; ASH 2020; CHEST 2021', 'високий'], perf:['WSES 2020 (перфоративна виразка)', 'помірний', MOZ_PAP], colic:['EAU 2024 (сечокам’яна хвороба)', 'високий'],
  absc:['IDSA 2014 (інфекції шкіри й м’яких тканин)', 'помірний', MOZ_AB], arvi:['NICE; Cochrane — симптоматичне лікування', 'помірний', MOZ_AB], flu:['IDSA 2018 (грип)', 'помірний'],
  covid:['ВООЗ 2023 (терапія COVID-19); RECOVERY', 'високий'], food:['IDSA 2017 (інфекційна діарея)', 'помірний', MOZ_AB], tons:['IDSA 2012; NICE NG84', 'високий', MOZ_AB],
  hep:['ВООЗ / CDC — підтримувальне лікування', 'низький'], ery:['IDSA 2014', 'помірний', MOZ_AB], mening:['ESCMID 2016', 'високий'], mono:['думка експертів (підтримувальне лікування)', 'низький'],
  varic:['IDSA / CDC', 'помірний'], tdr:['NICE NG38 (переломи)', 'помірний'], thip:['AAOS 2021 (перелом стегна); NICE NG89 (ВТЕ)', 'високий', MOZ_PAP], tank:['NICE NG38; NICE NG89', 'помірний'],
  tsprain:['ESSKA-AFAS 2022; NICE CKS', 'помірний'], trib:['думка експертів (знеболення)', 'низький'], tcmt:['NICE NG232 (травма голови)', 'помірний'], tspine:['NICE NG41', 'низький'],
  tclav:['NICE NG38', 'помірний'], twound:['ВООЗ 2017 (правець)', 'високий'], tdisl:['NICE NG38', 'низький'],
  cyst:['EAU 2024; IDSA 2011 (цистит)', 'високий', MOZ_AB], otit:['NICE NG91', 'помірний', MOZ_AB], sinus:['IDSA 2012; EPOS 2020; NICE NG79', 'помірний', MOZ_AB],
  bronch:['NICE NG120 (кашель)', 'помірний', MOZ_AB], lbp:['NICE NG59; ACP 2017', 'помірний', 'МОЗ: стандарт «Біль у попереку (нижній частині спини)» (наказ № 1326 від 08.09.2026)'],
  anem:['BSG 2021 (залізодефіцитна анемія)', 'помірний'], hypot:['ATA 2014', 'помірний'], gerd:['ACG 2022', 'високий'], urtic:['EAACI/GA²LEN 2022', 'високий'],
  insom:['ACP 2016; ESRS 2023', 'високий'], anx:['NICE CG113', 'високий'], dyslip:['ESC/EAS 2019 (+ оновлення 2025)', 'високий'], gout:['ACR 2020; EULAR 2016', 'високий']
};
/* рівень доказовості окремих варіантів, якщо відрізняється від базового */
const RXLVL = {'app:Базова схема':'низький', 'hern:Базова схема':'низький', 'obstr:Базова схема':'низький', 'perf:Базова схема':'помірний', 'de:Базова схема':'низький', 'hep:Базова схема':'низький', 'gh:Неускладнений криз':'низький', 'twound:Забруднена рана':'низький', 'mono:Загроза обструкції дихальних шляхів':'низький', 'cerv:НПЗП протипоказані':'низький',
  'rad:НПЗП протипоказані':'низький', 'lbp:НПЗП протипоказані':'низький', 'bronch:Сухий виснажливий кашель':'низький', 'bppv:Репозиційний маневр':'високий',
  'stroke:Малий інсульт: подвійна антиагрегантна':'високий', 'stroke:Кардіоемболічний (ФП)':'помірний', 'app:Деструктивний / перитоніт':'помірний', 'panc:Тяжкий, інтенсивний біль':'помірний',
  'gastr:Ерадикація: потрійна терапія':'помірний', 'af:ХСН, низький АТ':'помірний', 'dpn:Амітриптилін':'помірний', 'anx:Прегабалін':'помірний', 'anem:Через день':'помірний',
  'insom:Короткий курс снодійного':'помірний', 'rad:Тяжка ішіалгія':'помірний', 'dvt:Еноксапарин (рак, стаціонар)':'високий', 'tank:Іммобілізація нижньої кінцівки':'помірний'};
function rxSrc(key, name){ const s = RXSRC[key]; if (!s) return null;
  return {g:s[0], l:(name && RXLVL[key + ':' + name]) || s[1], m:s[2] || ''}; }
let RX_AUTO = '', RX_PREV = null, RX_PREV_A = '', RX_VAR = '';
const rxSig = () => JSON.stringify(RX.map(it=>[it.drug, it.dose, it.route, it.freq]));
function rxVariants(p){
  if (!p) return [];
  const base = rxFor(p), L = base.length ? [['Базова схема', base]] : [];
  (RXV[p.key] || []).forEach(v=>{ if (!v[2] || (v[2] === 'h') === (MODE === 'hosp')) L.push(v); });
  return L;
}
function rxReplace(rows, name){
  RX_PREV = RX.map(it=>Object.assign({}, it)); RX_PREV_A = RX_AUTO;
  RX.length = 0; rows.forEach(r=>addRx({drug:r[0], dose:r[1], route:r[2], freq:r[3], days:r[4] || '', note:r[5]}));
  RX_AUTO = rxSig(); RX_VAR = name; renderRx(); update(); rxVarRedraw();
  toast(`Лист призначень: «${name}». Перевірте дози під пацієнта`, 3000);
}
function rxUndo(){ if (!RX_PREV) return; RX.length = 0; RX_PREV.forEach(it=>RX.push(it)); RX_PREV = null; RX_AUTO = RX_PREV_A; renderRx(); update(); rxVarRedraw(); toast('Повернуто попередній лист'); }
function rxVarBlock(){
  const p = PRESETS.find(x=>x.key === curKey), V = rxVariants(p);
  if (!V.length) return null;
  const chips = h('div', {class:'chips'});
  V.forEach(([name, rows])=>{ const sr = rxSrc(p.key, name);
    chips.append(h('button', {type:'button', class:'chip', 'aria-pressed': name === RX_VAR && rxSig() === RX_AUTO ? 'true' : 'false',
      title:rows.map(r=>[r[0], r[1]].filter(Boolean).join(' ')).join('; ') + (sr ? '\nРівень доказовості: ' + sr.l : ''), onclick:()=>rxReplace(rows, name)}, name, sr ? h('span', {class:'lvl lvl-' + ({'високий':'a','помірний':'b','низький':'c'})[sr.l]}, ({'високий':'A','помірний':'B','низький':'C'})[sr.l]) : '')); });
  const s0 = rxSrc(p.key);
  const src = s0 ? h('details', {class:'rxsrc'}, h('summary', {}, 'Джерела і рівень доказовості'),
    h('p', {}, h('b', {}, 'Настанови: '), s0.g + '.'), s0.m ? h('p', {}, h('b', {}, 'Україна: '), s0.m + '.') : '',
    h('ul', {}, ...V.map(([name])=>{ const r = rxSrc(p.key, name); return h('li', {}, name + ' — рівень доказовості: ' + r.l); })),
    h('p', {class:'chips-hint'}, 'A — високий (сильна рекомендація, клас I / рівень A); B — помірний (умовна рекомендація або рівень B); C — низький (рівень C, думка експертів). Дози — типові для дорослого; перед призначенням звірте з повним текстом чинної редакції.')) : '';
  return h('div', {class:'rxvar'}, h('h3', {}, 'Схеми для «' + p.name + '»'), chips,
    h('p', {class:'chips-hint'}, 'Натисніть схему — лист призначень заміниться нею. Наведіть курсор, щоб побачити склад. Літера — рівень доказовості.'), src,
    RX_PREV ? h('button', {type:'button', class:'more', onclick:rxUndo}, '↶ Повернути попередній лист') : '');
}
function rxVarRedraw(){
  document.querySelectorAll('.rxvarbox').forEach(b=>{ b.innerHTML = ''; const x = rxVarBlock(); if (x) b.append(x); b.hidden = !x; });
}

function todayISO(){ const d = new Date(); return (mv('dt') || '').split('T')[0] || `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addDays(d, n){ const x = new Date(d + 'T00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; }
function rxEnd(it){ return it.stop || (it.start && +it.days > 0 ? addDays(it.start, +it.days - 1) : ''); }
function fmtS(d){ if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}.${m}`; }
function crclVal(){ const c = CALCS.find(x=>x.id==='cg'); return c && c.last && !c.last.msg ? parseInt(c.last.score) : NaN; }
function renalMsg(it){
  const d = drugInfo(it.drug), k = crclVal(); if (!d || !d.renal || isNaN(k)) return '';
  const r = d.renal.slice().sort((a,b)=>a.lt - b.lt).find(x=>k < x.lt);
  return r ? `КК ${k} мл/хв: ${r.m} (перевірте за інструкцією)` : '';
}
const isAB = it => { const d = drugInfo(it.drug); return !!(d && d.ab); };
function addRx(o){
  o = o || {};
  const d = drugInfo(o.drug), it = {id:++RXN, drug:o.drug || '', dose:o.dose != null && o.dose !== '' ? o.dose : (d ? d.d : ''), route:o.route || (d ? d.r : ''), freq:o.freq || (d ? d.f : ''),
    start:o.start || todayISO(), days:o.days ? String(o.days) : '', stop:'', note:o.note != null ? o.note : (d && d.note) || '', ind:o.ind || '', cult:o.cult || '', rev:o.rev || ''};
  if (isAB(it) && !it.rev) it.rev = addDays(it.start, 2);
  RX.push(it); return it;
}
function rxLine(it, dates){
  const s = [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ');
  let t = s;
  if (it.days) t += `, ${it.days} ${plural(+it.days, ['день','дні','днів'])}`;
  if (it.note) t += ` (${it.note})`;
  if (dates){ const e = rxEnd(it); t += ` — з ${fmtS(it.start)}` + (e ? ` по ${fmtS(e)}` : ''); }
  return t;
}
function abLines(){
  const ab = RX.filter(isAB); if (!ab.length) return '';
  let osn = val(F('dx.osn'), true); if (/^[А-ЯІЇЄҐ][а-яіїєґ’']/.test(osn)) osn = osn.charAt(0).toLowerCase() + osn.slice(1);
  return ab.map(it=>`${it.drug} (група ${AWARE[drugInfo(it.drug).ab]} за AWaRe): показання — ${it.ind || osn || '…'}; бактеріологічне дослідження до початку — ${it.cult || '…'}; перегляд ефективності — ${it.rev ? fmtD(it.rev) : '…'}.`).join('\n');
}
const AB_HEAD = 'Обґрунтування антибактеріальної терапії (наказ МОЗ України від 09.09.2026 № 1328):';
const RXF = () => RX.filter(it=>String(it.drug || '').trim());   // порожні рядки не потрапляють у документ
function rxSummary(){ // для епікризів
  if (!RXF().length) return '';
  return RXF().map(it=>rxLine(it, true)).join('; ');
}
function rxPart(){
  if (!RXF().length) return null;
  const date = todayISO(), act = it => it.start <= date && (!rxEnd(it) || rxEnd(it) >= date);
  if (DOC === 'shch'){
    const cont = RXF().filter(it=>act(it) && it.start < date && it.stop !== date), nw = RXF().filter(it=>it.start === date && act(it)), off = RXF().filter(it=>it.stop === date);
    const lines = [];
    if (cont.length) lines.push('Продовжує отримувати: ' + cont.map(it=>rxLine(it)).join('; ') + '.');
    if (nw.length) lines.push('Призначено: ' + nw.map(it=>rxLine(it)).join('; ') + '.');
    if (off.length) lines.push('Відмінено: ' + off.map(it=>it.drug).join(', ') + '.');
    return lines.length ? {head:'Лікування:', body:lines.join(' '), sep:' '} : null;
  }
  const amb = MODE === 'amb' && DOC === 'ohl';
  let body = RXF().filter(it=>!it.stop || it.stop >= date || DOC === 'rx').map((it,k)=>`${k+1}. ${rxLine(it, DOC === 'rx')}${DOC === 'rx' && it.stop ? ' — відмінено ' + fmtS(it.stop) : ''}.`).join('\n');
  const ab = abLines(); if (ab) body += '\n' + AB_HEAD + '\n' + ab;
  if (DOC === 'rx'){ const k = crclVal(); if (!isNaN(k)) body += '\nКліренс креатиніну (Кокрофт–Голт): ' + k + ' мл/хв.'; }
  return {head: amb ? 'Рекомендовано:' : DOC === 'rx' ? '' : 'Призначено:', body, sep:'\n'};
}


