/* ===== Епікриз (0.9.3.29): варіант «як у лікарні» (пп. 1–11), лікування групами з курсами, «Продовжити прийом»
   з листа призначень, динаміка показників і стан при виписці зі щоденників, попередження про нестабільність перед випискою. ===== */
const epiD2 = () => F('e_per.per').d2.value || todayISO();
const nDays = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5) + 1;
const fmtDM = d => d ? d.slice(8, 10) + '.' + d.slice(5, 7) : '';
/* групи лікування — за назвою препарату */
const RXGRP = [
  ['Антибактеріальна терапія', it=>isAB(it)],
  ['Інфузійна (дезінтоксикаційна) терапія', it=>/розчин|рінгер|натрію хлорид|глюкоз|реосорб|ксилат|сорбілакт|гекодез|тівортін/i.test(it.drug) || /інфуз|крапельн/i.test(it.route || '') && /мл/.test(it.dose || '')],
  ['Кисневотерапія', it=>/кисн|оксиген/i.test(it.drug)],
  ['Бронхолітична та інгаляційна терапія', it=>/беродуал|сальбутамол|іпратроп|фенотерол|будесонід|пульмікорт|еуфілін|амінофілін|тіотроп|флутиказон|формотерол|вентолін/i.test(it.drug) || /інгал|небул/i.test(it.route || '')],
  ['Глюкокортикоїди', it=>/дексаметазон|преднізолон|гідрокортизон|метилпреднізолон/i.test(it.drug)],
  ['Антикоагулянти', it=>/еноксапарин|гепарин|надропарин|фондапарин|апіксабан|ривароксабан|дабігатран|варфарин/i.test(it.drug)],
  ['Кардіологічна та антигіпертензивна терапія', it=>/прил$|сартан$|амлодипін|бісопролол|метопролол|карведилол|небіволол|торасемід|фуросемід|спіронолактон|еплеренон|урапідил|статин$|ацетилсаліц|клопідогрел|тикагрелор|нітро|моксонідин|індапамід|гідрохлортіазид|дигоксин|аміодарон|дапагліфлозин|емпагліфлозин|сакубітрил/i.test(it.drug)],
  ['Гастропротекція', it=>/празол$|фамотидин/i.test(it.drug)],
  ['Симптоматична та інша терапія', ()=>true]];
function rxCourse(it, d2){
  const e0 = rxEnd(it), e = e0 && e0 < d2 ? e0 : d2, s = it.start && it.start <= e ? it.start : '';
  const base = [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ');
  if (!s) return base;
  const n = nDays(s, e);
  return base + ` — з ${fmtDM(s)} по ${fmtDM(e)} (${n} ${plural(n, ['день','дні','днів'])})`;
}
function epiCourses(){
  const L = RXF(); if (!L.length) return '';
  const d2 = epiD2(), used = new Set(), out = [];
  RXGRP.forEach(([name, test])=>{ const g = L.filter(it=>!used.has(it) && test(it)); g.forEach(it=>used.add(it)); if (g.length) out.push(name + ': ' + g.map(it=>rxCourse(it, d2)).join('; ')); });
  return out.map(x=>end(x)).join('\n');
}
/* «Продовжити прийом»: не відмінено на день виписки, не парентерально */
function contList(){
  const d2 = epiD2();
  const L = RXF().filter(it=>{ const e = rxEnd(it); return (!it.start || it.start <= d2) && (!e || e > d2) && !/в\/в|в\/м|інфуз|крапел/i.test(it.route || '') && !/кисн|оксиген|розчин|рінгер/i.test(it.drug); });
  return L.map((it, i)=>{ const e = rxEnd(it), left = e ? nDays(d2, e) - 1 : 0;
    const when = it.hours ? ' о ' + it.hours : '';
    const how = e ? (left > 0 ? ` — ще ${left} ${plural(left, ['день','дні','днів'])} (до ${fmtD(e)} включно)` : '') : ' — тривало';
    return `${i + 1}. ${[it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ')}${when}${how}.`; }).join('\n');
}
/* показники зі щоденників */
const dnum = (D, id) => { const v = String((D.data && D.data.f || {})[id] || '').trim().replace(',', '.'); const x = parseFloat(v); return isNaN(x) ? null : x; };
function diarySeries(){
  return DIARIES.slice().filter(D=>D && D.data).sort((a, b)=>String(a.dt) < String(b.dt) ? -1 : 1).map(D=>({d:String(D.dt || '').split('T')[0], t:dnum(D, 'd_obj_t_0'), s:dnum(D, 'd_obj_ad_0'), di:dnum(D, 'd_obj_ad_1'), hr:dnum(D, 'd_obj_chss_0'), rr:dnum(D, 'd_obj_chd_0'), sp:dnum(D, 'd_obj_chd_1')}));
}
const dc = x => String(x).replace('.', ',');
function vitDyn(){
  const S = diarySeries(); if (S.length < 2) return '';
  const out = [], T = S.filter(x=>x.t != null);
  if (T.length >= 2){ const mx = T.reduce((a, b)=>b.t > a.t ? b : a);
    if (mx.t >= 37.5){ const after = T.filter(x=>x.d > mx.d), norm = after.find((x, i)=>after.slice(i).every(y=>y.t < 37.1));
      out.push(`температура тіла до ${dc(mx.t)} °C (${fmtDM(mx.d)})` + (norm ? `, нормалізувалась з ${fmtDM(norm.d)}` : '')); } }
  const pair = (k, u, f) => { const A = S.filter(x=>x[k] != null); if (A.length >= 2 && A[0][k] !== A[A.length - 1][k]) out.push(f(A[0], A[A.length - 1])); };
  pair('sp', '%', (a, b)=>`SpO2 ${dc(a.sp)} % → ${dc(b.sp)} %`);
  pair('rr', '', (a, b)=>`ЧД ${dc(a.rr)} → ${dc(b.rr)} за хв`);
  const A = S.filter(x=>x.s != null && x.di != null); if (A.length >= 2 && (A[0].s !== A[A.length - 1].s || A[0].di !== A[A.length - 1].di)) out.push(`АТ ${A[0].s}/${A[0].di} → ${A[A.length - 1].s}/${A[A.length - 1].di} мм рт. ст.`);
  pair('hr', '', (a, b)=>`ЧСС ${dc(a.hr)} → ${dc(b.hr)} уд./хв`);
  return out.length ? 'Динаміка показників: ' + out.join('; ') + '.' : '';
}
function vypAuto(){
  const S = diarySeries(); if (!S.length) return '';
  const L = S[S.length - 1], p = [];
  if (L.t != null) p.push(`температура тіла ${dc(L.t)} °C`);
  if (L.s != null && L.di != null) p.push(`АТ ${L.s}/${L.di} мм рт. ст.`);
  if (L.hr != null) p.push(`ЧСС ${dc(L.hr)} уд./хв`);
  if (L.rr != null) p.push(`ЧД ${dc(L.rr)} за хв`);
  if (L.sp != null) p.push(`SpO2 ${dc(L.sp)} %`);
  return p.length ? cap(p.join(', ')) + (L.d ? ` (${fmtDM(L.d)})` : '') + '.' : '';
}
/* ознаки нестабільності за останню добу перед випискою (≥ 2) */
function unstableAtDischarge(){
  const d2 = F('e_per.per').d2.value; if (!d2) return '';
  const S = diarySeries().filter(x=>x.d && x.d >= addDays(d2, -1) && x.d <= d2); if (!S.length) return '';
  const L = S[S.length - 1], f = [];
  if (L.t != null && L.t > 37.5) f.push('t > 37,5 °C'); if (L.rr != null && L.rr >= 24) f.push('ЧД ≥ 24'); if (L.hr != null && L.hr > 100) f.push('ЧСС > 100');
  if (L.s != null && L.s <= 90) f.push('сист. АТ ≤ 90'); if (L.sp != null && L.sp < 90) f.push('SpO2 < 90 %');
  return f.length >= 2 ? f.join(', ') : '';
}
/* ---------- варіант «як у лікарні» ---------- */
const epiHosp = () => { const f = F('e_per.vyg'); return !!(f && f.el && f.el.value === '3'); };
function epiHospParts(){
  const sec = id => SECTIONS.find(x=>x.id === id), body = id => { const t = sectionText(sec(id)); return t ? t.body : ''; };
  const V = k => { const f = F(k); return f ? String(val(f, true) || '').trim() : ''; };
  const P = F('e_per.per'), d1 = P.d1.value, d2 = P.d2.value, days = typeof bedDays === 'function' ? bedDays(d1, d2) : '';
  const dob = mv('dob'), age = mv('age');
  const sk = V('e_per.sk'), anam = V('e_per.anam') || (typeof bSec === 'function' ? bSec('morbi') : ''), obj = typeof objFromExam === 'function' ? objFromExam() : '';
  const p7 = [sk ? end(cap(sk)) : '', anam ? 'Анамнез: ' + end(anam) : '', obj ? 'Об’єктивно при надходженні: ' + end(obj) : ''].filter(Boolean).join('\n');
  const lik = V('e_lik.lik');
  const dyn = V('e_lik.dyn'), vd = vitDyn(), vyp = V('e_lik.vyp'), rez = V('e_lik.rez');
  const p10 = [dyn ? end(cap(dyn)) : '', vd, vyp ? 'При виписці: ' + end(vyp) : '', rez ? end(g(rez)) : ''].filter(Boolean).join(' ');
  const rek = V('e_rek.rek'), eln = V('e_lik.eln');
  const rekL = rek.split('\n').map(x=>x.trim()).filter(Boolean); if (eln) rekL.push(end(cap(eln)));
  const prod = V('e_rek.prod');
  const items = [];
  const kudy = V('e_per.kudy'); if (kudy) items.push(['У', kudy]);
  items.push(['1. Прізвище, ім’я, по батькові хворого:', mv('pib') || '______________________________'],
    ['2. Дата народження:', dob ? fmtD(dob) + (age ? ` (${age} ${plural(+age, ['рік','роки','років'])})` : '') : '__________'],
    ['3. Місце проживання хворого:', mv('addr') || 'область ________, район ________, село (місто) ________, вулиця ________, будинок ____'],
    ['4. Місце роботи:', mv('work') || '______________________________'],
    ['5. Дати:', `госпіталізації — ${d1 ? fmtD(d1) : '__________'}; виписки — ${d2 ? fmtD(d2) : '__________'}` + (days !== '' && d1 && d2 ? ` (проведено ліжко-днів: ${days})` : '')],
    ['6. Повний діагноз (основне захворювання, супутні захворювання та ускладнення):', body('dx') || '______________________________', '\n'],
    ['7. Скарги, анамнез, об’єктивні дані при надходженні:', p7 || '______________________________', '\n'],
    ['8. Обстеження:', body('e_obs') || '______________________________', '\n'],
    ['9. Лікування:', lik || '______________________________', '\n'],
    ['10. Перебіг і стан при виписці:', p10 || '______________________________', '\n'],
    ['11. Рекомендовано:', rekL.length ? rekL.map((x, i)=>`${i + 1}. ${x.replace(/^\d+\.\s*/, '')}`).join('\n') : '______________________________', '\n']);
  if (prod) items.push(['Продовжити прийом:', prod, '\n']);
  return items.map(([head, b, sep])=>({head, body:b, sep: sep || ' ', title:head}));
}
{ const e0 = epi027; epi027 = function(){ return e0.apply(this, arguments) || epiHosp(); };
  const p0 = epi027Parts; epi027Parts = function(){ return epiHosp() ? epiHospParts() : p0.apply(this, arguments); };
  const m0 = metaLines; metaLines = function(){ const r = m0.apply(this, arguments);
    if (DOC === 'epi' && epiHosp()){ const vidd = mv('vidd');
      r.head = [{t:'ЕПІКРИЗ', b:true, c:true}, {t:'із медичної карти стаціонарного хворого № ' + (mv('card') || '______'), b:true, c:true}];
      if (vidd) r.head.push({t:vidd.toUpperCase(), b:false, c:true}); }
    return r; };
  const c0 = checkDoc; checkDoc = function(){ const L = c0.apply(this, arguments);
    if (DOC === 'epi'){ const u = unstableAtDischarge(); if (u) L.push({m:`За останню добу перед випискою є ознаки нестабільності (${u}) — перевірте готовність до виписки`, tab:'e_lik', f:'e_lik.vyp'}); }
    return L; }; }
/* «Продовжити прийом» потрібен лише в епікризі; у змісті «Рекомендацій» інших варіантів — окремим блоком після рекомендацій */
/* фірмовий вигляд епікризу: акцентні заголовки пунктів, більший логотип; «чорно-білий логотип» — і заголовки чорні */
{ const fs0 = fillSheet; fillSheet = function(P){ const r = fs0.apply(this, arguments);
    try{ const on = DOC === 'epi' && epiHosp() && !(typeof blankOn === 'function' && blankOn()); P.classList.toggle('pr-epi', on);
      let lm = 'color'; try{ lm = localStorage.getItem('po.zlogomode') || 'color'; }catch(e){} P.classList.toggle('pr-bw', on && lm === 'bw'); }catch(e){}
    return r; }; }
