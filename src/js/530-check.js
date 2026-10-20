/* ================= ПЕРЕВІРКА ПОВНОТИ ПЕРЕД ПІДПИСОМ ================= */
function checkDoc(){
  const L = [], add = (m, tab) => L.push({m, tab});
  const v = k => val(F(k), true), sel = k => F(k).el.value !== '';
  const txt = itext($('#out'));
  if (!txt.trim()) return L;
  if (!mv('pib')) add('Не вказано ПІБ пацієнта', 'meta');
  if (!mv('doc')) add('Не вказано лікаря (ПІБ для підпису) — «Налаштування»', 'set');
  if (!mv('zoz')) add('Не вказано назву закладу для шапки — «Налаштування»', 'set');
  if (!sex && rawTokens) add('Не вибрано стать — у тексті є «хворим/хворою»', 'meta');
  const dots = (txt.match(/…/g) || []).length; if (dots) add(`Залишилось незаповнених «…»: ${dots}`, null);
  const abCheck = () => RX.filter(isAB).forEach(it=>{
    const miss = [!it.cult && 'бакпосів до початку', !it.rev && 'дату перегляду'].filter(Boolean);
    if (miss.length) add(`Антибіотик «${it.drug}»: не вказано ${miss.join(' і ')} (наказ МОЗ № 1328)`, 'rxt');
    const d = todayISO(); if (it.rev && it.rev <= d && !it.stop && (!rxEnd(it) || rxEnd(it) >= d)) add(`«${it.drug}»: настав строк перегляду ефективності (${fmtD(it.rev)})`, 'rxt');
  });
  const renal = () => RX.filter(it=>!it.stop && renalMsg(it)).forEach(it=>add(`Перевірте дозу «${it.drug}» за кліренсом креатиніну`, 'rxt'));
  const rxIncomplete = () => RX.filter(it=>!it.stop && it.drug && (!it.dose && it.drug !== 'Оксигенотерапія' || !it.route || !it.freq)).forEach(it=>add(`«${it.drug}»: не вказано дозу, шлях або кратність`, 'rxt'));
  const dx = () => { if (!v('dx.osn')) add('Не вказано основний діагноз', 'dx'); else if (!v('dx.mkh')) add('Не вказано код МКХ-10', 'dx'); };
  if (DOC === 'ohl'){
    if (!v('skarhy.c') && !v('skarhy.cx') && !v('skarhy.none')) add('Не вказано скарги (або оберіть «Якщо скарг немає»)', 'skarhy');
    if (!['dur','onset','hron','ax'].some(k=>v('morbi.' + k))) add('Не заповнено анамнез захворювання', 'morbi');
    if (MODE === 'hosp' && !sel('morbi.hosp')) add('Не вказано, як госпіталізовано (направлення, самозвернення, ЕМД)', 'morbi');
    if (!sel('vitae.alerg')) add('Не вказано алергологічний анамнез', 'vitae');
    if (!sel('vitae.strah')) add('Не вказано працездатність / ЕЛН', 'vitae');
    const vit = [['zah_temp_0','t°','zah'],['ssc_ad_0','АТ','ssc'],['ssc_chss_0','ЧСС','ssc'],['dyh_chd_0','ЧД','dyh'],['dyh_chd_1','SpO2','dyh']].filter(([id])=>!document.getElementById(id).value.trim());
    if (vit.length) add('Не вказано: ' + vit.map(x=>x[1]).join(', '), vit[0][2]);
    const empty = ['zah','shk','dyh','ssc','trav','sech','nevr'].map(id=>SECTIONS.find(x=>x.id===id)).filter(sc=>!sc.fields.some(f=>f.type !== 'num' && val(f)));
    if (empty.length) add('Не описано: ' + empty.map(x=>x.short || x.title).join(', ') + ' — заповніть, натисніть «= Норма =» або оберіть «Якщо змін немає — одним рядком»', empty[0].id);
    dx();
    if (MODE === 'hosp' && !v('dx.plan')) add('Не складено план обстеження', 'dx');
    if (MODE === 'hosp'){
      if (!sel('hosp.vyd')) add('Не вказано вид госпіталізації', 'hosp');
      else if (!['spec','gen','auto','vid'].some(k=>v('hosp.' + k))) add('Немає обґрунтування госпіталізації (наказ МОЗ № 1044)', 'hosp');
    } else if (!sel('hosp.vyda')) add('Не вказано рішення щодо госпіталізації', 'hosp');
    abCheck(); renal(); rxIncomplete();
    rxWarnings().filter(w=>w.c === 'bad').forEach(w=>add(w.t, 'rxt'));
  }
  if (DOC === 'shch'){
    const sm = diarySimilar();
    if (sm && sm.sim > 0.9) add('Запис майже такий самий, як попередній — оновіть показники й динаміку', 'd_obj');
    else if (sm && sm.sameVit) add('Показники (t°, АТ, ЧСС) такі самі, як у попередньому записі — перевірте', 'd_obj');
    rxWarnings().filter(w=>w.c === 'bad').forEach(w=>add(w.t, 'rxt'));
    if (!sel('d_main.sk') && !v('d_main.skx')) add('Не вказано скарги', 'd_main');
    const vit = [['d_obj_t_0','t°'],['d_obj_ad_0','АТ'],['d_obj_chss_0','ЧСС']].filter(([id])=>!document.getElementById(id).value.trim());
    if (vit.length) add('Не вказано: ' + vit.map(x=>x[1]).join(', '), 'd_obj');
    if (MODE === 'hosp' && !v('d_lik.osn')) add('Немає оцінки обґрунтованості перебування в стаціонарі (наказ МОЗ № 1044)', 'd_lik');
    abCheck(); renal();
  }
  if (DOC === 'rx'){
    if (!RX.length) add('Немає жодного призначення', 'rxt');
    if (!v('dx.osn')) add('Не вказано діагноз (на вкладці «Діагноз» первинного огляду)', null);
    abCheck(); renal(); rxIncomplete();
  }
  if (DOC === 'epi'){
    if (!F('e_per.per').d1.value || !F('e_per.per').d2.value) add('Не вказано період лікування', 'e_per');
    dx();
    if (!v('e_obs.obs')) add('Не внесено результати обстежень', 'e_obs');
    if (!v('e_lik.lik')) add('Не вказано проведене лікування', 'e_lik');
    if (!sel('e_lik.rez')) add('Не вказано результат лікування (з покращенням, без змін…)', 'e_lik');
    if (!sel('e_lik.eln')) add('Не вказано працездатність / ЕЛН', 'e_lik');
    if (!v('e_rek.rek')) add('Немає рекомендацій', 'e_rek');
    if (!mv('zav')) add('Не вказано завідувача відділення для підпису', 'meta');
  }
  if (DOC === 'kons'){ if (!v('k_main.obj')) add('Не заповнено об’єктивний статус', 'k_main'); dx(); if (!v('e_rek.rek')) add('Немає рекомендацій', 'e_rek'); }
  if (DOC === 'konc'){
    const K = koncMembers();
    if (!K.hol) add('Не обрано голову консиліуму', 'c_main');
    if (K.mem.length < 2) add('Зазвичай у консиліумі щонайменше три лікарі: перевірте склад', 'c_main');
    [K.hol, ...K.mem].filter(m=>m && !m.raw && !m.name && m.t !== 'черговий лікар').forEach(m=>add(`Не вказано ПІБ: ${m.t} (вкладка «Налаштування»)`, 'set'));
    if (!sel('c_main.mt') && !v('c_main.mtx')) add('Не вказано мету консиліуму', 'c_main');
    if (!v('c_main.obj')) add('Не заповнено об’єктивний статус', 'c_main');
    dx();
    if (!v('c_end.vysn')) add('Немає висновку консиліуму', 'c_end');
    if (!val(F('c_end.rish'))) add('Не відмічено рішення консиліуму', 'c_end');
  }
  if (DOC === 'zav'){
    { const zp = zavParts(); zp.list.filter(u=>!u.name && u.pos !== 'Черговий лікар' && UCH.some(x=>x[3] === u.pos)).forEach(u=>add(`Не вказано ПІБ: ${u.pos.toLowerCase()} (вкладка «Налаштування»)`, 'set')); }
    if (!mv('zav') && !zavParts().list.length) add('Не вказано завідувача відділення', 'meta');
    if (!v('z_main.obj')) add('Не заповнено об’єктивний статус', 'z_main');
    if (!sel('z_main.dzv')) add('Не вказано висновок щодо діагнозу', 'z_main');
    dx();
  }
  if (DOC === 'etap' || DOC === 'per'){
    const P = F(DOC === 'etap' ? 't_main.pe' : 't_main.pp'); if (!P.d1.value || !P.d2.value) add('Не вказано період', 't_main');
    if (!v('t_main.dyn')) add('Не описано динаміку', 't_main');
    dx();
    if (DOC === 'per'){ if (!v('t_lik.kudy')) add('Не вказано, куди переводиться', 't_lik'); if (!sel('t_lik.stp')) add('Не вказано стан при переведенні', 't_lik'); }
    else if (!v('t_lik.plan')) add('Не вказано план подальшого лікування', 't_lik');
  }
  if (DOC === 'napr'){ if (!v('n_main.komu')) add('Не вказано, до якого спеціаліста', 'n_main'); if (!v('n_end.pyt')) add('Не сформульовано питання до консультанта', 'n_end'); dx(); }
  if (DOC === 'dov'){ if (!F('v_main.per').d1.value) add('Не вказано дату (період)', 'v_main'); }
  if (DOC === 'zgoda'){ if (!v('g_main.vtr') && !mv2('g_main_vx')) add('Не відмічено медичних втручань', 'g_main'); }
  return L;
}
function goTab(id){
  const t = id === 'meta' ? META : id === 'rxt' ? RXT : TABS.find(x=>x.id === id);
  if (t && t.docs.includes(DOC)) show(TABS.indexOf(t));
  else if (t){ toast('Це поле — у первинному огляді'); }
}
function renderCheck(){
  const box = $('#chk'); if (!box) return;
  const L = checkDoc(), sum = box.querySelector('summary .cnt'), ul = box.querySelector('ul');
  box.hidden = !itext($('#out')).trim();
  box.classList.toggle('ok', !L.length); if (!L.length) box.classList.remove('alert');
  sum.textContent = L.length ? `зауважень: ${L.length}` : 'усе заповнено';
  ul.innerHTML = '';
  L.forEach(x=>ul.append(h('li', {}, x.tab ? h('button', {type:'button', class:'more', onclick:()=>goTab(x.tab)}, x.m) : x.m)));
  return L.length;
}

