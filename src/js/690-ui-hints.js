/* ===== 0.10, надійність: короткі підказки при першому відкритті розділу + зрозумілі тексти помилок =====
   Підказка — одне речення внизу екрана, лише раз для кожного розділу (новий вигляд). Вимкнути — «Налаштування» → «Підказки».
   Технічні повідомлення браузера (англійською, «QuotaExceededError», «Unexpected token»…) замінюються на зрозумілі, з тим, що зробити. */
const V2HINTS = {
  hv:'Оберіть хворобу — програма заповнить огляд за еталоном. Далі змініть лише те, що у вашого пацієнта інакше.',
  skarhy:'Пишіть скарги своїми словами: з 3 літер з’являться підказки, Tab приймає. Кнопка синдрому обирає всі його скарги.',
  morbi:'Тривалість і початок — кнопками («5 днів», «гострий»), друкувати не обов’язково.',
  vitae:'Якщо анамнез без особливостей — натисніть «Норма» і змініть лише те, що відрізняється.',
  zah:'«Норма в усіх системах огляду» вгорі заповнює весь огляд; далі змініть лише знахідки.',
  dx:'Основний діагноз, код МКХ-10 і план обстеження — у цьому розділі; вони потраплять і в епікриз.',
  rxt:'Наберіть назву препарату в полі «+ Додати…» — доза й кратність підставляться, змініть за потреби.',
  d_main:'Щоденник заповнюється з первинного огляду — змініть лише те, що змінилось за добу.',
  e_per:'Дати й діагнози підтягуються з огляду — перевірте їх і допишіть перебіг.'
};
let V2HSEEN = (()=>{ try{ return JSON.parse(lsGet('po.hints', '[]')) || []; }catch(e){ return []; } })();
let V2HOFF = lsGet('po.hintsoff', '') === '1';
try{ ['po.hints', 'po.hintsoff'].forEach(k=>{ if (!FS_SET_KEYS.includes(k)) FS_SET_KEYS.push(k); }); }catch(e){}
function v2Hint(i){
  if (V2HOFF || PO_BOOT || !UIV2) return;
  const t = TABS[i]; if (!t || !V2HINTS[t.id] || V2HSEEN.includes(t.id)) return;
  V2HSEEN.push(t.id); lsSet('po.hints', JSON.stringify(V2HSEEN));
  clearTimeout(v2Hint.t); v2Hint.t = setTimeout(()=>{ if (active === i) toast('Підказка · ' + (t.short || t.title) + ': ' + V2HINTS[t.id], 3000); }, 500);
}
function v2HintsReset(){ V2HSEEN = []; lsSet('po.hints', '[]'); }
{ const s0 = show; show = function(i){ const r = s0.apply(this, arguments); try{ v2Hint(i); }catch(e){} return r; }; }
{ const o0 = opSpy; opSpy = function(){ const a0 = active, r = o0.apply(this, arguments); try{ if (active !== a0) v2Hint(active); }catch(e){} return r; }; }
/* налаштування */
try{ if (SETTINGS_EL){ const cb = h('input', {type:'checkbox', id:'set_hints'}); cb.checked = !V2HOFF;
  cb.addEventListener('change', ()=>{ V2HOFF = !cb.checked; lsSet('po.hintsoff', V2HOFF ? '1' : ''); });
  const sec = h('details', {class:'setsec'}, h('summary', {}, 'Підказки'), h('div', {class:'grid'}, h('div', {class:'f wide'},
    h('label', {class:'chk'}, cb, ' Показувати коротку підказку, коли розділ відкривається вперше'),
    h('button', {type:'button', class:'btn', onclick:()=>{ v2HintsReset(); toast('Підказки покажуться знову при першому відкритті розділів'); }}, 'Показати підказки знову'))));
  const about = SETTINGS_EL.querySelector(':scope > details.about'); if (about) about.before(sec); else SETTINGS_EL.append(sec); } }catch(e){}

/* зрозумілі тексти помилок */
function v2PlainErr(m){
  if (typeof m !== 'string') return m;
  const tech = /[A-Za-z]{4,}(Error|Exception)|Unexpected token|JSON|undefined|null|is not|cannot|failed|quota/i;
  if (/^(Помилка сховища|Не вдалося зберегти пацієнта в сховище браузера)/.test(m))
    return /quota|exceed|переповн/i.test(m)
      ? 'Пацієнта не збережено: у браузері закінчилось місце. Збережіть усіх пацієнтів у файл («Пацієнти» → «Резервна копія»), потім видаліть старих, яких уже виписано.'
      : 'Пацієнта не збережено: браузер не дає зберігати дані (можливо, приватне вікно). Відкрийте програму у звичайному вікні або збережіть пацієнтів у файл («Пацієнти» → «Резервна копія»).';
  if (/^Не вдалося прочитати файл:/.test(m) && tech.test(m.slice(25)))
    return 'Не вдалося прочитати файл: він пошкоджений або це файл іншої програми. Оберіть файл, збережений «Первинним оглядом» (.json).';
  return m;
}
{ const t0 = toast; toast = function(m){ const a = [...arguments]; try{ a[0] = v2PlainErr(m); }catch(e){} return t0.apply(this, a); }; }
