/* ===== Щоденник: щоденна оцінка обґрунтованості перебування (Стандарт, наказ МОЗ від 30.07.2026 № 1044) =====
   Підстави беруться з показників щоденника (SpO2, ЧД, САТ, кисень), динаміки і листа призначень.
   Пункти — ті самі, що в критеріях госпіталізації первинного огляду (020-data-hosp-criteria.js, 110-hosp-criteria-auto.js).
   Вихідний день, відсутність транспорту, очікування планових обстежень підставою для продовження не є. */
function stayRx(){
  const d = todayISO();
  return RX.filter(it=>String(it.drug || '').trim() && !(it.stop && it.stop <= d) && !(rxEnd(it) && rxEnd(it) < d) && !(it.start && it.start > d));
}
function stayVitals(){
  const N = id => { const e = document.getElementById(id); return e && e.value.trim() ? num(e.value) : NaN; };
  return {t:N('d_obj_t_0'), sb:N('d_obj_ad_0'), hr:N('d_obj_chss_0'), rr:N('d_obj_chd_0'), spo:N('d_obj_chd_1'), o2:N('d_obj_o2_0')};
}
function stayJust(){
  const V = stayVitals(), K = curKey, dyn = F('d_main.dyn').el.value;
  const rxA = stayRx(), R = [];
  const ivAB = rxA.some(it=>isAB(it) && /в\/в/.test(it.route || ''));
  const o2rx = rxA.some(it=>/^Оксигенотерапія/.test(it.drug));
  const neb = rxA.some(it=>/небулайзер/.test(it.route || '')), sGCS = rxA.some(it=>/Преднізолон|Дексаметазон|Метилпреднізолон/.test(it.drug));
  const parent = rxA.some(it=>!isAB(it) && it.drug !== 'Оксигенотерапія' && (/крапельно/.test(it.route || '') || /в\/в/.test(it.route || '')));
  if (dyn === '3') R.push('погіршення стану, що потребує цілодобового медичного нагляду (п. I.4)');
  if (V.o2 > 0) R.push(`кисневотерапія ${String(V.o2).replace('.', ',')} л/хв з титруванням SpO2 (п. II.1)`);
  else if (V.spo <= 92) R.push(`SpO2 ${V.spo}% при диханні атмосферним повітрям (розд. III, п. 1)`);
  else if (o2rx && !has(V.spo)) R.push('кисневотерапія з титруванням SpO2 (п. II.1)');
  if (V.rr >= 30) R.push(`ЧД ${V.rr} за хв (розд. III, п. 1)`);
  if (V.sb < 90) R.push(`САТ ${V.sb} мм рт. ст. (розд. III)`);
  if (ivAB) R.push('внутрішньовенна антибактеріальна терапія з потребою частого нагляду (п. II.6)');
  if ((K === 'copd' || K === 'asthma') && neb && sGCS) R.push('часті небулайзерні інгаляції і системні ГКС (п. IV.1.5)');
  if (parent) R.push('парентеральна терапія, що потребує спеціалізованого моніторингу (п. II.5)');
  let text = '';
  if (R.length) text = 'Обґрунтованість перебування в стаціонарі зберігається (наказ МОЗ № 1044): ' + R.join('; ') + '.';
  else if (dyn === '2') text = 'Підстав для продовження цілодобового нагляду немає (наказ МОЗ № 1044) — планується виписка.';
  return {reasons:R, text, ivAB, V};
}
/* критерії клінічної стабільності при пневмонії (ATS/IDSA 2019): перехід на пероральний антибіотик і виписка */
function pneuStable(V){
  const m = [];
  if (!has(V.t) || !has(V.hr) || !has(V.rr) || !has(V.sb) || !has(V.spo)) return null;
  if (V.t > 37.8) m.push('t° > 37,8 °C');
  if (V.hr > 100) m.push('ЧСС > 100');
  if (V.rr > 24) m.push('ЧД > 24');
  if (V.sb < 90) m.push('САТ < 90');
  if (V.o2 > 0) m.push('потреба в кисні'); else if (V.spo < 90) m.push('SpO2 < 90%');
  return m;
}
function stayHints(){
  if (MODE === 'amb') return [];
  const L = [], S = stayJust(), V = S.V, dyn = F('d_main.dyn').el.value, K = curKey;
  const own = (document.getElementById('d_lik_osn') || {}).value;
  if (!S.reasons.length && dyn !== '2' && !(own && own.trim()))
    L.push({t:'За показниками і листом призначень підстав для продовження перебування (наказ МОЗ № 1044) не знайдено. Вкажіть підставу в полі «Обґрунтованість перебування» або плануйте виписку. Вихідні, транспорт, очікування планових обстежень підставою не є.'});
  const day = new Date(todayISO() + 'T00:00').getDay();
  if (day === 0 || day === 6) L.push({t:'Вихідний день: Стандарт № 1044 вимагає щоденної оцінки доцільності перебування — достатньо короткого запису чергового лікаря з рядком обґрунтування.'});
  if ((K === 'pneu' || K === 'covid') && S.ivAB){
    const m = pneuStable(V);
    if (m && !m.length) L.push({t:'Критерії клінічної стабільності виконано (t° ≤ 37,8 °C, ЧСС ≤ 100, ЧД ≤ 24, САТ ≥ 90, SpO2 ≥ 90% без кисню): розгляньте перехід на пероральний антибіотик і виписку (ATS/IDSA 2019).',
      ins:'Критерії клінічної стабільності виконано — переведений на пероральний антибіотик ….'});
    else if (m) L.push({t:'До переходу на пероральний антибіотик бракує стабільності: ' + m.join(', ') + '.'});
  }
  if (K === 'copd' && V.o2 > 0 && V.spo > 92) L.push({t:`SpO2 ${V.spo}% на кисні — вище цілі 88–92% при ХОЗЛ: зменшіть потік (ризик гіперкапнії).`});
  return L;
}
