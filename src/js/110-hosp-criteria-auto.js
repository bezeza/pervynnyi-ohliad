/* ===== Автоматичне визначення критеріїв госпіталізації за введеними даними ===== */
function autoRules(){
  const spec = new Set(), gen = new Set();
  const N = id => { const e = document.getElementById(id); return e && e.value.trim() ? num(e.value) : NaN; };
  const T = k => val(F(k));
  const abn = k => { const f = F(k); return f.el.value !== '' && f.norm !== undefined && +f.el.value !== f.norm; };
  const cl = id => { const c = CALCS.find(x=>x.id===id); return c && c.last && !c.last.msg ? parseInt(c.last.score) : NaN; };
  const spo = N('dyh_chd_1'), rr = N('dyh_chd_0'), sb = N('ssc_ad_0'), t = N('zah_temp_0');
  const hr = has(N('ssc_chss_0')) ? N('ssc_chss_0') : N('ssc_ps_0');
  const sk = T('skarhy.c'), K = curKey;
  const neuro = ['nevr.par','nevr.mova','nevr.obl','nevr.chut','nevr.n2','nevr.okor','nevr.bulb'].some(abn) || !!val(F('nevr.patzn'));
  const dehydr = /знижений/.test(T('shk.tur')) || /^сухий/.test(T('trav.yaz'));
  const consc = /оглушення|сопор|кома/.test(T('zah.svid'));

  // загальні пороги розділу III
  if (spo <= 92) spec.add(RESP[0]);
  if (rr >= 30) spec.add(RESP[1]);
  // нозологічні правила
  if (cl('curb') >= 3) spec.add(KRIT.pneu[0]);
  if ((K === 'pneu' || K === 'covid') && (spo <= 92 || rr >= 30 || consc)) spec.add(KRIT.pneu[1]);
  if (K === 'copd' && spo <= 92) spec.add(KRIT.copd[2]);
  if (K === 'hf' && (spo <= 92 || /з обох боків/.test(T('dyh.hr')) || /ортопное/.test(T('zah.pol')))) spec.add(KRIT.hf[0]);
  if (K === 'gh' && sb >= 180 && (neuro || /вологі|крепітація/.test(T('dyh.hr')) || sk.includes('стискаючий біль'))) spec.add(KRIT.gh[0]);
  if (K === 'stroke' && neuro){ spec.add(KRIT.stroke[0]); spec.add(NEURO[0]); }
  if (K === 'tia') spec.add(KRIT.tia[0]);
  if (K === 'bell' && neuro) spec.add(NEURO[0]);
  if ((K === 'dm' || K === 'dpn') && consc) spec.add(DM[0]);
  if (K === 'gib'){
    if (sb < 90 || (sb < 100 && hr >= 100) || hr >= 120 || cl('gbs') >= 7) spec.add(KRIT.gib[0]);
    if (/мелена/.test(T('trav.vyp')) || /чорного/.test(T('trav.rect')) || sk.includes('кавовою')) spec.add(KRIT.gib[1]);
  }
  if (/Щоткіна/.test(T('trav.och'))) spec.add(ABD[0]);
  if (/невправиме/.test(T('trav.hryzha')) || (/дзвінка/.test(T('trav.perist')) && /Затримка/.test(T('trav.vyp'))) || (K === 'app' && /здухвинній/.test(T('trav.zhyv')))) spec.add(ABD[1]);
  if (K === 'chol' && /Ортнера|Мерфі/.test(T('trav.symp')) && t >= 37.5) spec.add(KRIT.chol[0]);
  if (K === 'panc' && sk.includes('багаторазове блювання') && dehydr) spec.add(KRIT.panc[1]);
  if ((K === 'food' || K === 'gastr') && (sk.includes('рідкі випорожнення') || sk.includes('блювання')) && dehydr) spec.add(VOMIT[1]);
  if (K === 'ery' && t >= 38 && /еритеми/.test(T('shk.vys'))) spec.add(KRIT.ery[0]);
  if (K === 'hep' && consc) spec.add(KRIT.hep[1]);
  const qsofa = (rr >= 22) + (sb <= 100) + consc;
  if (K === 'af' && (hr >= 130 || sb < 90 || spo <= 92)) spec.add(KRIT.af[0]);
  if (K === 'asthma'){ if (spo <= 92 || rr >= 25 || hr >= 110) spec.add(KRIT.asthma[0]); if (consc || /ціанотичні/.test(T('shk.kol'))) spec.add(KRIT.asthma[1]); }
  if ((K === 'pyelo' || K === 'absc' || K === 'mening') && qsofa >= 2) spec.add(RESP[2]);
  if (K === 'pyelo' && (qsofa >= 2 || /Олігурія/.test(T('sech.diur')))) spec.add(KRIT.pyelo[0]);
  if (K === 'epi' && consc) spec.add(KRIT.epi[0]);
  if (K === 'cerv' && abn('nevr.par')) spec.add(KRIT.cerv[0]);
  if (K === 'perf') spec.add(ABD[1]);
  if (K === 'colic' && t >= 38) spec.add(KRIT.colic[1]);
  if (K === 'absc' && /флуктуацією/.test(T('shk.vys'))) spec.add(KRIT.absc[0]);
  if (K === 'mening' && /Ригідність/.test(T('nevr.men'))) spec.add(KRIT.mening[0]);
  if (K === 'thip') spec.add(KRIT.thip[0]);
  if (K === 'tspine' && (abn('nevr.par') || /Знижена|ослаблена/.test(T('loc.nv')))) spec.add(NEURO[0]);
  if (K === 'trib' && /емфізема/.test(T('loc.shk'))) spec.add(ABD[1]);
  if (K === 'tcmt' && (abn('nevr.par') || abn('nevr.zin') || consc)) spec.add(NEURO[0]);
  if (K === 'varic' && (spo <= 92 || /хрипи|крепітація/.test(T('dyh.hr')) && !/не вислуховуються/.test(T('dyh.hr')))) spec.add(KRIT.varic[0]);
  // за скаргами, ускладненнями та листом призначень
  const usk = T('dx.uskl');
  const rxA = RX.filter(it=>String(it.drug || '').trim() && !(it.stop && it.stop <= todayISO()));
  const hasRx = re => rxA.some(it=>re.test(it.drug));
  const parenteral = it => /в\/в|в\/м|п\/ш/.test(it.route || '');
  const ivAB = rxA.some(it=>isAB(it) && /в\/в/.test(it.route || ''));
  const neb = rxA.some(it=>/небулайзер/.test(it.route || '')), sGCS = hasRx(/Преднізолон|Дексаметазон|Метилпреднізолон/);
  const pain810 = /інтенсивністю (8|9|10)\/10/.test(sk);
  if ((K === 'pneu' || K === 'covid') && /ЛН|плеврит|абсцес|сепсис|емпієм/i.test(usk)) spec.add(KRIT.pneu[1]);
  if (K === 'copd' && neb && sGCS) spec.add(KRIT.copd[0]);
  if (K === 'asthma' && neb && sGCS) spec.add(KRIT.asthma[0]);
  if (K === 'chol' && ivAB) spec.add(KRIT.chol[0]);
  if (K === 'ery' && ivAB) spec.add(KRIT.ery[0]);
  if (K === 'absc' && ivAB) spec.add(KRIT.absc[0]);
  if (K === 'mening') spec.add(KRIT.mening[0]);
  if (K === 'dvt' && hasRx(/Еноксапарин|Гепарин/) && !hasRx(/Ривароксабан|Апіксабан|Дабігатран/)) spec.add(KRIT.dvt[2]);
  if ((K === 'rad' || K === 'cerv') && pain810) spec.add(KRIT.rad[1]);
  if (K === 'epi' && /понад 5 хв/.test(sk)) spec.add(KRIT.epi[0]);
  if (K === 'colic' && sk.includes('блювання') && dehydr) spec.add(KRIT.colic[0]);
  if (K === 'bppv' && /багаторазове блювання/.test(sk)) spec.add(VOMIT[0]);
  if (K === 'migr' && /блювання/.test(sk) && rxA.some(it=>/крапельно/.test(it.route || ''))) spec.add(KRIT.migr[2]);
  if (K === 'af' && rxA.some(it=>/Аміодарон|Дигоксин/.test(it.drug) && /в\/в/.test(it.route || ''))) spec.add(KRIT.af[0]);
  // загальні підстави — з листа призначень (те, що справді призначено)
  if (ivAB) gen.add('внутрішньовенна антибактеріальна терапія з потребою частого нагляду (п. II.6)');
  if (hasRx(/^Оксигенотерапія/)) gen.add('кисневотерапія з титруванням SpO2, яку неможливо безпечно забезпечити амбулаторно (п. II.1)');
  if (rxA.some(it=>parenteral(it) && /Диклофенак|Кеторолак|Метоклопрамід|Парацетамол|Дротаверин/.test(it.drug))) gen.add('регулярна парентеральна аналгезія або протиблювотна терапія (п. II.18)');
  if (rxA.some(it=>/крапельно/.test(it.route || '') && !isAB(it)) || hasRx(/Фуросемід|Дексаметазон|Пантопразол|Діазепам/) && rxA.some(it=>/в\/в/.test(it.route || '') && !isAB(it))) gen.add('парентеральна терапія, що потребує спеціалізованого моніторингу (п. II.5)');
  if (K === 'tcmt' && (MODE === 'hosp' ? F('hosp.vyd').el.value === '0' : F('hosp.vyda').el.value === '1')) gen.add('потреба в цілодобовому медичному нагляді (п. I.4)');
  if (K === 'stroke' || K === 'mening' || K === 'gib' || K === 'perf') gen.add('значущий ризик гострих ускладнень, що потребують негайного втручання (п. II.12)');
  // загальні підстави
  // типовий критерій заготовки — лише коли за даними нічого не знайдено; позначається «з шаблону — перевірте»
  const tpl = new Set(), P0 = PRESETS.find(x=>x.key === K);
  const emerg = MODE === 'hosp' ? F('hosp.vyd').el.value === '0' : F('hosp.vyda').el.value === '1';
  if (P0 && !P0.custom && emerg && !spec.size){
    const c = TPLKRIT[K] !== undefined && KRIT[K] ? KRIT[K][TPLKRIT[K]] : TPLURG[K];
    if (c){ spec.add(c); tpl.add(c); }
  }
  if (spec.size) gen.add('потреба в цілодобовому медичному нагляді (п. I.4)');
  const news = cl('news');
  if (news >= 5) gen.add('потреба в цілодобовому медичному нагляді (п. I.4)');
  if (news >= 7 || sb < 90) gen.add('значущий ризик гострих ускладнень, що потребують негайного втручання (п. II.12)');
  return {spec, gen, tpl};
}
/* індекс типового критерію KRIT[ключ] для заготовок з екстреною госпіталізацією; хвороби без ключа — лише за даними */
/* типовий ургентний критерій для хвороб, що зазвичай плануються, — коли обрано екстрену госпіталізацію */
const TPLURG = {gh:KRIT.gh[0], ihd:KRIT.ihd[0], dm:DM[0], dpn:DM[0], gastr:VOMIT[0], de:NEURO[0], cerv:KRIT.rad[1], bppv:VOMIT[0], epi:NEURO[0]};
let HOSPDEF = 'preset'; try{ HOSPDEF = localStorage.getItem('po.hospdef') || 'preset'; }catch(e){}
/* Спеціальність: 'tr' — травматологія (вкладка «Травма» і поля травми видимі завжди) */
let SPEC = 'ter'; try{ SPEC = localStorage.getItem('po.spec') || 'ter'; }catch(e){}
let F110 = true; try{ F110 = localStorage.getItem('po.f110') !== '0'; }catch(e){}   // документи за бланками наказу МОЗ № 110
function locOn(){
  if (SPEC === 'tr') return true;
  const p = curKey && PRESETS.find(x=>x.key === curKey); if (p && p.group === 'tr') return true;
  const L = SECTIONS.find(x=>x.id === 'loc'); return !!(L && L.tab && L.fields.some(f=>f.type !== 'hdr' && val(f)));
}
function syncLoc(force){
  const on = locOn(); if (!force && syncLoc.on === on) return; syncLoc.on = on;
  SECTIONS.forEach(sc=>sc.fields.forEach(f=>{ if (f.loc && f.wrapEl) f.wrapEl.hidden = !on || (f.only && f.only !== MODE) || (f.docs && !f.docs.includes(DOC)); }));
  const L = SECTIONS.find(x=>x.id === 'loc');
  if (L && L.tab){ const hid = !on || !L.docs.includes(DOC) || (quickHide() && !QT.includes('loc')); if (L.tab.hidden !== hid){ L.tab.hidden = hid; layoutTabs(); } }
}
const TPLKRIT = {pneu:1, covid:0, hf:0, copd:0, asthma:0, af:0, stroke:0, tia:0, rad:1, cerv:1, migr:1, bell:0, app:1, chol:0, panc:1, gib:1, obstr:1, hern:1, perf:1,
  dvt:1, colic:0, absc:0, mening:0, food:1, ery:0, tdr:0, thip:0, tank:0, tdisl:0};

function applyAuto(){
  const {spec, gen, tpl} = autoRules();
  { const sf = F('hosp.spec'), em = MODE === 'hosp' ? F('hosp.vyd').el.value === '0' : F('hosp.vyda').el.value === '1';
    if (!sf.urgUser){ const nu = em && !spec.size && !sf.chips.some(c=>c.getAttribute('aria-pressed') === 'true'); if (nu !== !!sf.urg){ sf.urg = nu; refreshChips(sf); } } }
  let any = false;
  for (const [f, want] of [[F('hosp.spec'), spec], [F('hosp.gen'), gen]]){
    f.chips.forEach((c,i)=>{
      const t = O(f.opts[i]).t, on = c.getAttribute('aria-pressed') === 'true';
      if (want.has(t) && c.dataset.off !== '1'){ if (!on){ c.setAttribute('aria-pressed','true'); c.dataset.auto = '1'; c.dataset.ord = ++ORD; } if (c.dataset.auto === '1'){ if (tpl.has(t)) c.dataset.tpl = '1'; else delete c.dataset.tpl; } any = true; }
      else if (!want.has(t) && c.dataset.auto === '1'){ c.setAttribute('aria-pressed','false'); delete c.dataset.auto; delete c.dataset.ord; delete c.dataset.tpl; }
    });
    refreshChips(f);
  }
  if (MODE === 'hosp'){
    const v = F('hosp.vyd');
    if (any && v.el.value === ''){ v.el.value = 0; v.autoSet = true; }
    else if (!any && v.autoSet && !curKey){ v.el.value = ''; v.autoSet = false; }
  } else {
    const v = F('hosp.vyda');
    if (v.el.value === '' || v.autoSet){ const nv = any ? '1' : (curKey ? '0' : ''); if (v.el.value !== nv){ v.el.value = nv; } v.autoSet = true; }
  }
  const autoN = document.querySelectorAll('#panels .chip[data-auto="1"]').length;
  const hint = $('#autoHint'); if (hint) hint.hidden = !autoN;
}

/* чи обрізається текст вибраного варіанта у списку (видимий — міряємо, прихований — за довжиною) */
function selCut(sel, t){
  const w = sel.clientWidth; if (!w) return t.length > 38;
  try{ const c = selCut.c || (selCut.c = document.createElement('canvas').getContext('2d')); const cs = getComputedStyle(sel); c.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; return c.measureText(t).width > w - 34; }catch(e){ return t.length > 38; }
}
function mark(sel, f){
  if (f.headOnly) return;
  { // довгий вибраний варіант не вміщується в список — повний текст рядком під ним
    const t = sel.value !== '' && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : '';
    sel.title = t;
    let sf = sel.nextElementSibling && sel.nextElementSibling.classList.contains('selfull') ? sel.nextElementSibling : null;
    if (t && selCut(sel, t)){ if (!sf){ sf = h('div', {class:'selfull'}); sel.after(sf); } sf.textContent = t; }
    else if (sf) sf.remove();
  }
  sel.classList.toggle('set', sel.value !== '');
  sel.classList.toggle('abn', sel.value !== '' && f.norm !== undefined && +sel.value !== f.norm);
}

function val(f, any){
  if (f.type === 'hdr') return '';
  if (!any && f.only && f.only !== MODE) return '';
  if (!any && f.docs && !f.docs.includes(DOC)) return '';
  if (f.type === 'sel') return f.el.value === '' ? (f.fallback ? f.fallback() : '') : OT(f, f.opts[+f.el.value]);
  if (f.type === 'multi'){ if (f.detBox) refreshDet(f); return f.chips.map((c,i)=>c.getAttribute('aria-pressed')==='true' ? {t:OTM(f, i), o:+(c.dataset.ord||0)} : null)
    .filter(Boolean).sort((a,b)=>a.o-b.o).map(x=>x.t).join(f.detBox && f.chips.some((c,i)=>c.getAttribute('aria-pressed')==='true' && detText(f, i, O(f.opts[i]).t) !== O(f.opts[i]).t) ? '; ' : (f.sepv || ', ')); }
  if (f.type === 'numsel'){
    const n = f.inp.value.trim(); if (!n) return '';
    const k = parseInt(n,10), forms = f.units[+f.unit.value];
    return n + ' ' + (k % 10 === 1 && k % 100 !== 11 ? forms[0] : forms[1]);
  }
  if (f.type === 'num'){
    f.inputs.forEach((inp,i)=>{
      const p = f.parts[i], x = num(inp.value), has = inp.value.trim() !== '' && !isNaN(x);
      const bad = has && p.ok && (x < p.ok[0] || x > p.ok[1]);
      inp.classList.toggle('bad', bad);
      inp.classList.toggle('abn', !bad && has && p.n && (x < p.n[0] || x > p.n[1]));
      inp.title = bad ? 'Перевірте значення' : '';
    });
    const v = f.inputs.map(i=>i.value.trim().replace('.',',')); if (f.hintEl) f.hintEl.textContent = f.hint(v); return f.fmt(v);
  }
  if (f.type === 'auto'){ const t = f.fn ? f.fn() : autoKrit(); f.abox.textContent = t; return t; }
  if (f.type === 'period'){
    const a = f.d1.value, b = f.d2.value; if (!a) return '';
    if (!b) return 'з ' + fmtD(a);
    const n = Math.round((new Date(b) - new Date(a)) / 864e5) + (f.incl ? 1 : 0), fm = f.dayForms || ['ліжко-день','ліжко-дні','ліжко-днів'];
    f.hintEl.textContent = n >= 0 ? n + ' ' + plural(n, fm) : 'Перевірте дати';
    return `з ${fmtD(a)} по ${fmtD(b)}` + (n >= 0 ? ` (${n} ${plural(n, fm)})` : '');
  }
  const tv = f.el.value.trim(); return tv || (f.fallback ? f.fallback() : '');
}

const cap = s => /^\[[^|\]]*\|[^\]]*\]/.test(s) ? s.replace(/^\[([^|\]]*)\|([^\]]*)\]/, (m,a,b)=>'[' + a.charAt(0).toUpperCase() + a.slice(1) + '|' + b.charAt(0).toUpperCase() + b.slice(1) + ']') : s.charAt(0).toUpperCase() + s.slice(1);
const end = s => /[.!?]$/.test(s) ? s : s + '.';

function sectionText(s){
  const out = []; // {t, br}
  let prev = false, needHead = false, rich = false;
  for (const f of s.fields){
    if (f.headOnly || f.type === 'hdr' || f.noOut || f.bo) continue;
    if (f.when && !f.when()){ prev = false; continue; }
    if ((f.docs && !f.docs.includes(DOC)) || (f.only && f.only !== MODE)) continue;
    if (f.unless && val(s.fields.find(x=>x.id === f.unless))){ prev = false; continue; }
    const v = val(f); if (!v){ prev = false; continue; }
    if (f.dz) needHead = true;
    const join = f.cont && prev && out.length;
    const tp = !join && f.solo ? f.solo : (F110 && f.tpl110) ? f.tpl110 : f.tpl;
    const t = f.type === 'num' ? v : tp.replace('{v}', v);
    if (join) out[out.length-1].t = out[out.length-1].t.replace(/\.$/,'') + (f.joiner || ', ') + t;
    else out.push({t:((s.nocap && !out.length) || /^[а-в]\) /.test(t)) ? t : cap(t), br:!!f.br});
    prev = true; if (f.type !== 'num') rich = true;
  }
  // «без особливостей» — лише коли в системі не описано жодної зміни (показники АТ, ЧСС тощо зберігаються)
  const bf = s.fields.find(f=>f.bo);
  if (bf && !rich && (!bf.docs || bf.docs.includes(DOC))){ const bv = val(bf); if (bv) out.push({t:cap(bv), br:false}); }
  if (!out.length) return null;
  let body = '';
  out.forEach((o,i)=>{ body += (i===0 ? '' : (o.br ? '\n' : ' ')) + end(o.t); });
  let head = (MODE === 'amb' && s.headAmb) || (F110 && MODE === 'hosp' && s.head110) || s.head || '';
  const hf = s.fields.find(f=>f.headOnly);
  if (hf) head = needHead ? (DOC === 'epi' ? 'Заключний клінічний діагноз' : DOC === 'kons' || DOC === 'napr' ? 'Діагноз' : DOC === 'ohl' ? val(hf) : 'Клінічний діагноз') + ':' : '';
  return {head, body, sep: s.headBr ? '\n' : ' '};
}

/* стать: [чоловіча|жіноча] форма */
function g(s){ return s.replace(/\[([^|\]]*)\|([^\]]*)\]/g, (m,a,b)=> sex==='f' ? b : sex==='m' ? a : a + '/' + b); }
function refreshLabels(){
  for (const s of SECTIONS) for (const f of s.fields){
    if (f.type === 'sel') [...f.el.options].forEach(op=>{ if (op.value !== '' && f.opts[+op.value] !== undefined){ const o = O(f.opts[+op.value]); op.textContent = g((f.ovr && f.ovr[o.t]) || o.l); } });
    if (f.type === 'multi') f.chips.forEach((c,i)=>{ const o = O(f.opts[i]); c.textContent = g((f.ovr && f.ovr[o.t]) || o.l); });
    if (f.qchips) f.qchips.forEach(c=>{ c.textContent = g(c.dataset.raw); });
  }
}

const plural = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2]; };
const TESTS = {
  'ЗАК':'ЗАК (…): Hb … г/л, ер. … ×10¹²/л, лейк. … ×10⁹/л, тр. … ×10⁹/л, ШОЕ … мм/год.',
  'ЗАС':'ЗАС (…): відн. щільність …, білок … г/л, лейк. … в п/з, ер. … в п/з.',
  'глюкоза крові':'Глюкоза крові (…): … ммоль/л.',
  'глікований гемоглобін':'HbA1c (…): … %.',
  'біохімічний аналіз крові':'Біохімічний аналіз крові (…): креатинін … мкмоль/л, сечовина … ммоль/л, білірубін заг. … мкмоль/л, АЛТ … Од/л, АСТ … Од/л, K … ммоль/л, Na … ммоль/л.',
  'ліпідограма':'Ліпідограма (…): ЗХС … ммоль/л, ХС ЛПНЩ … ммоль/л, ТГ … ммоль/л.',
  'амілаза крові':'Амілаза крові (…): … Од/л.',
  'коагулограма':'Коагулограма (…): МНВ …, АЧТЧ … с, фібриноген … г/л.',
  'D-димер':'D-димер (…): … нг/мл.',
  'ЕКГ':'ЕКГ (…): ритм …, ЧСС … за хв, ЕВС …, ….',
  'ЕхоКГ':'ЕхоКГ (…): ФВ ЛШ … %, ….',
  'рентгенографія ОГК':'Рентгенографія ОГК (…): ….',
  'УЗД ОЧП':'УЗД ОЧП (…): ….',
  'ФГДС':'ФГДС (…): ….'
};
const SUBHEADS = /(^|\n)(Основний:|Ускладнення:|Супутні:|План обстеження:|Рекомендації:|а\) основний:|б\) ускладнення основного:|в\) супутній:)/g;
function generate(){
  const ORDS = {epi:['e_per','dx','e_obs','e_lik','e_rek'], kons:['k_main','loc','ctrl','dx','e_obs','e_rek','eln'], shch:['d_main','d_obj','d_lik','ctrl','RX','eln'], gosp:['gs_main','dx','e_obs','hosp'], pam:['p_main'], rx:['RX'], zav:['z_main','dx','RX'], konc:['c_main','dx','e_obs','RX','c_end'], etap:['t_main','dx','e_obs','t_lik'], per:['t_main','dx','e_obs','t_lik'], napr:['n_main','dx','e_obs','n_end'], dov:['v_main'], zgoda:['g_main']};
  let ORD_IDS = ORDS[DOC] ? ORDS[DOC].slice() : SECTIONS.filter(s=>s.docs.includes(DOC)).map(s=>s.id);
  if (DOC === 'ohl'){ const k = ORD_IDS.indexOf('dx'); ORD_IDS.splice(k + 1, 0, 'RX'); }
  if (DOC === 'shch' && !ORD_IDS.includes('RX')) ORD_IDS.push('RX');
  ORD_IDS = ORD_IDS.filter(id=>{ const sc = SECTIONS.find(x=>x.id === id); return !sc || !sc.only || sc.only === MODE; });
  RXT.tab.classList.toggle('filled', RX.length > 0);
  SECTIONS.forEach(s=>{ if (!ORD_IDS.includes(s.id)) s.tab.classList.remove('filled'); });
  const parts = (DOC === 'epi' && epi027()) ? epi027Parts() : (DOC === 'epi' && epi003()) ? epi003Parts() : (DOC === 'kons' && F110) ? kons028Parts() : ORD_IDS.map(id=>{ if (id === 'RX'){ const r = rxPart(); if (r) r.sid = 'rxt'; return r; } const s = SECTIONS.find(x=>x.id===id); const p = sectionText(s); s.tab.classList.toggle('filled', !!p); if (p){ p.title = s.title; p.sid = id; } return p; }).filter(Boolean);
  LASTPARTS = parts;
  const M = metaLines();
  let plain = parts.map(p=>(p.head ? p.head + p.sep : '') + p.body).join('\n');
  if (plain && M.head.length) plain = M.head.map(x=>x.t).join('\n') + '\n' + plain;
  if (plain && M.foot.length) plain += '\n\n' + M.foot.join('\n');
  rawTokens = /\[[^|\]]*\|[^\]]*\]/.test(plain);
  let html = parts.map(p=>{
    const body = esc(p.body).replace(SUBHEADS, '$1<b>$2</b>').split('\n');
    const hd = p.head ? '<b>' + esc(p.head) + '</b>' : '';
    const lines = p.sep === '\n' && hd ? [hd, ...body] : [(hd ? hd + ' ' : '') + body[0], ...body.slice(1)];
    const da = p.sid ? '<div data-sec="' + p.sid + '">' : '<div>';
    return lines.map(l=>da + l + '</div>').join('');
  }).join('');
  if (html && M.head.length) html = M.head.map(x=>(x.c ? '<div style="text-align:center">' : '<div>') + (x.b ? '<b>' + esc(x.t) + '</b>' : esc(x.t)) + '</div>').join('') + html;
  if (html && M.foot.length) html += '<div><br></div>' + M.foot.map(l=>'<div>' + esc(l) + '</div>').join('');
  return {plain:g(plain), html:g(html)};
}

function renderPtBar(){
  const bar = $('#ptbar'); if (!bar) return;
  const pib = mv('pib'), age = mv('age'), osn = val(F('dx.osn'), true), mkh = val(F('dx.mkh'), true);
  const sx = sex === 'm' ? 'чол.' : sex === 'f' ? 'жін.' : '';
  if (!pib && !age && !osn){ bar.hidden = true; document.documentElement.style.setProperty('--pth', '0px'); return; }
  bar.hidden = false;
  const p1 = bar.querySelector('.pt1'); p1.innerHTML = '';
  p1.append(pib ? h('b', {}, pib) : h('span', {class:'warn', style:'display:inline'}, 'ПІБ не вказано'));
  const extra = [age ? age + ' ' + plural(+age, ['рік','роки','років']) : '', sx, mv('card') ? '№ ' + mv('card') : ''].filter(Boolean).join(', ');
  if (extra) p1.append(', ' + extra);
  bar.querySelector('.pt2').textContent = osn ? osn + (mkh ? ' (' + mkh + ')' : '') : '';
  document.documentElement.style.setProperty('--pth', (window.innerWidth < 900 ? bar.offsetHeight : 0) + 'px');
}
function elnDefaults(){
  const st = F('eln.st'), P = F('eln.per'); if (!st.el || !P.d1) return;
  if ((st.el.value === '1' || st.el.value === '2') && !P.d1.value) P.d1.value = todayISO();
}
function syncDiaryDay(){
  const di = document.getElementById('d_main_den_0'); if (!di) return;
  if (!di.dataset.bound){ di.dataset.bound = '1'; di.addEventListener('input', ()=>{ if (di.value.trim()) di.dataset.user = '1'; else delete di.dataset.user; }); }
  let n = stayDay();
  if (!n && DIARIES.length){   // без дати надходження — від дня в останньому записі журналу
    const L = DIARIES[DIARIES.length - 1], ld = +((L.data && L.data.f && L.data.f.d_main_den_0) || 0), dt = String(L.dt || '').split('T')[0];
    if (ld && dt){ const k = Math.round((new Date(todayISO() + 'T00:00') - new Date(dt + 'T00:00')) / 864e5); if (k >= 0) n = ld + k; }
  }
  if (!di.dataset.user && n && di.value !== String(n)) di.value = n;
  document.querySelectorAll('.adm-d').forEach(a=>{ if (document.activeElement !== a) a.value = F('e_per.per').d1.value; });
}
function update(){
  autosave(); renderPtBar(); syncDiaryDay(); syncLoc();
  { const of = F('e_obs.obs'); if (of && of.planHint){ const n = F('dx.plan').chips.filter(c=>c.getAttribute('aria-pressed')==='true').length;
    of.planHint.textContent = n ? `За планом первинного огляду відмічено обстежень: ${n}. Кнопка «шаблони за планом» вставить їх усі.` : 'У первинному огляді план обстеження не заповнено. Додайте шаблони окремих обстежень нижче або перейдіть до плану.'; } }
  runCalcs();
  applyAuto(); renderDHints(); renderRemain(); renderCtrl(); renderScr(); renderPlanD(); renderQV(); try{ renderLive(); renderOrderMarks(); }catch(e){} elnDefaults();
  if (dxPanel.key !== curKey) dxPanel();
  renderDxHints();
  const r = generate();
  const H = SECTIONS.find(x=>x.id==='hosp');
  if (H && H.warnEl){
    const any = ['spec','gen','auto','vid'].some(k=>val(F('hosp.' + k)));
    const crit = ['spec','gen','auto'].some(k=>val(F('hosp.' + k)));
    let w = '';
    const P1 = PRESETS.find(x=>x.key === curKey);
    if (MODE === 'hosp' && val(F('hosp.vyd')) && !any && P1 && !P1.custom && TPLKRIT[curKey] === undefined){
      w = P1.hosp === 'p' ? `Для «${P1.name}» (планова госпіталізація) типового критерію за Стандартом немає. Відмітьте наявні критерії (напр., підбір терапії, яку потрібно починати в стаціонарі, п. II.22) або заповніть «Відступ від критеріїв» (п. I.8).`
        : `Для «${P1.name}» госпіталізація обґрунтовується лише ознаками тяжкості: внесіть показники (SpO2, ЧД, АТ, ЧСС, t°) — критерій з’явиться сам, — або відмітьте наявний критерій чи «Відступ від критеріїв» (п. I.8).`;
    } else if (MODE === 'hosp'){ if (val(F('hosp.vyd')) && !any) w = 'Не відмічено жодного критерію госпіталізації. Відмітьте наявні критерії або заповніть «Відступ від критеріїв» (п. I.8).'; }
    else {
      const a = F('hosp.vyda').el.value;
      if ((a === '1' || a === '2') && !any) w = 'Пацієнта направлено на госпіталізацію, але не відмічено жодного критерію. Відмітьте наявні критерії.';
      if (a === '0' && crit) w = 'Є критерії госпіталізації за Стандартом, а обрано амбулаторне лікування. Перевірте рішення.';
    }
    H.warnEl.textContent = w; H.warnEl.hidden = !w;
  }
  if (dirty){ $('#banner').hidden = false; renderCheck(); return; }
  const prevT = [...$('#out').children].map(e=>e.textContent);
  $('#out').innerHTML = r.html;
  try{ flashChanged(prevT); }catch(e){}
  renderCheck();
}

function applyNorm(s){
  for (const f of s.fields){
    if (f.type === 'sel' && f.norm !== undefined){ f.el.value = f.norm; mark(f.el, f); }
    if (f.type === 'multi' && s.objective) f.chips.forEach(c=>{ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; });
  }
}

function clearAll(forRestore){
  for (const s of SECTIONS) for (const f of s.fields){
    if (f.type === 'sel'){ f.el.value = f.def !== undefined ? f.def : ''; mark(f.el, f); }
    else if (f.type === 'multi'){ f.chips.forEach(c=>{ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; delete c.dataset.auto; delete c.dataset.off; }); detReset(f); if (f.q) f.q.value = ''; f.exp = false; }
    else if (f.type === 'auto' || f.type === 'hdr'){}
    else if (f.type === 'period'){ f.d1.value = ''; f.d2.value = ''; f.hintEl.textContent = ''; }
    else if (f.type === 'num') f.inputs.forEach(i=>i.value='');
    else if (f.type === 'numsel'){ f.inp.value=''; f.unit.value='0'; }
    else f.el.value = '';
  }
  ['pib','dob','age','card'].forEach(k=>{ const e = document.getElementById('meta_' + k); if (e) e.value = ''; }); setNow();
  curKey = null; SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (f.type === 'multi') refreshChips(f); }));
  RX_AUTO = ''; RX_PREV = null; if (typeof rxVarRedraw === 'function') rxVarRedraw();
  if (HV.cards) HV.cards.forEach(c=>c.setAttribute('aria-pressed','false'));
  document.querySelectorAll('.pt input, .calc input, .calc select').forEach(x=>{ if (x.type === 'checkbox') x.checked = false; else x.value = ''; });
  sex = ''; document.querySelectorAll('#sexSeg button').forEach(x=>x.setAttribute('aria-pressed','false')); refreshLabels();
  CACHE = {};
  { const pd = document.getElementById('dx_pland'); if (pd) pd.value = '{}'; }
  if (!forRestore){ DIARIES = []; RX = []; RES = []; renderRx(); renderRes(); renderHvTips(); }
  dirty = false; $('#banner').hidden = true;
  if (!forRestore) update();
}

