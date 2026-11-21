/* ===== 0.9.3.152 — зв’язок госпіталізацій однієї людини: `person` і `case` у знімку пацієнта (задача 17, крок 3) =====
   Запис пацієнта лишається як був (одна госпіталізація). Два необов’язкові поля в `snap` — `person` (спільний ключ людини) і `case`
   (номер госпіталізації) — зберігаються й читаються разом зі знімком, тож копії, експорт, PIN і папка даних працюють без змін.
   Записи без `person` — як раніше. «Нова госпіталізація» копіює лише ПІБ, дату народження й стать; огляд порожній.
   Зв’язування записів із однаковими ПІБ і датою народження — лише після підтвердження лікаря. Проєкт: docs/task-17-sprava-design.md */
const CASE = {person:'', n:0};
{ const s0 = snap; snap = function(){ const r = s0.apply(this, arguments); if (CASE.person){ r.person = CASE.person; r.case = CASE.n || 1; } return r; }; }
{ const r0 = restore; restore = function(S){ const r = r0.apply(this, arguments); CASE.person = (S && S.person) || ''; CASE.n = (S && S.case) || 0; return r; }; }
{ const n0 = newPatient; newPatient = function(){ const r = n0.apply(this, arguments); CASE.person = ''; CASE.n = 0; return r; }; }
const caseNorm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
/* інші госпіталізації цієї людини: [{id, n, name, d1, d2}] */
function caseSiblings(){
  if (!CASE.person) return [];
  const st = loadStore(), out = [];
  for (const id in st){ const s = st[id].snap || {}; if (id !== PID && s.person === CASE.person){ const f = s.f || {}; out.push({id, n:s.case || 1, name:st[id].name, d1:f.e_per_per_1 || '', d2:f.e_per_per_2 || ''}); } }
  return out.sort((a, b)=>a.n - b.n);
}
/* записи з тим самим ПІБ і датою народження, ще не зв’язані з цією людиною */
function caseCandidates(){
  const name = caseNorm(patientName()), dob = mv('dob'); if (!name || !dob) return [];
  const st = loadStore(), out = [];
  for (const id in st){ if (id === PID) continue; const p = st[id], s = p.snap || {};
    if (caseNorm(p.name) === name && p.dob === dob && !(CASE.person && s.person === CASE.person)){ const f = s.f || {}; out.push({id, d1:f.e_per_per_1 || '', d2:f.e_per_per_2 || ''}); } }
  return out;
}
function caseEnsurePerson(){ if (!CASE.person){ CASE.person = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); CASE.n = 1; } }
function caseLink(id){
  if (!PID) savePatient(true); if (!PID){ toast('Спершу вкажіть ПІБ пацієнта'); return false; }
  caseEnsurePerson(); savePatient(true);
  const st = loadStore(), p = st[id]; if (!p || !p.snap) return false;
  const max = [CASE.n, ...caseSiblings().map(x=>x.n)].reduce((a, b)=>Math.max(a, b), 0);
  p.snap.person = CASE.person; p.snap.case = max + 1; p.updated = Date.now(); saveStore(st); caseRenumber(CASE.person); renderPatients();
  return true;
}
/* номери госпіталізацій однієї людини — за датою надходження (без дати — після датованих; рівні — за попереднім номером) */
function caseRenumber(person){
  const st = loadStore(), ids = Object.keys(st).filter(id=>(st[id].snap || {}).person === person);
  ids.sort((a, b)=>{ const sa = st[a].snap, sb = st[b].snap, da = (sa.f || {}).e_per_per_1 || '9999', db = (sb.f || {}).e_per_per_1 || '9999';
    return da < db ? -1 : da > db ? 1 : (sa.case || 0) - (sb.case || 0); });
  let ch = false; ids.forEach((id, i)=>{ if (st[id].snap.case !== i + 1){ st[id].snap.case = i + 1; st[id].updated = Date.now(); ch = true; } if (id === PID) CASE.n = i + 1; });
  if (ch) saveStore(st); return ch;
}
function caseNewAdmission(){
  if (!PID && !patientName()){ toast('Спершу вкажіть ПІБ пацієнта'); return false; }
  const name = patientName(), dob = mv('dob'), sx = sex;
  caseEnsurePerson(); savePatient(true);
  const max = [CASE.n, ...caseSiblings().map(x=>x.n)].reduce((a, b)=>Math.max(a, b), 0), person = CASE.person;
  PID = null; DIARIES = []; clearAll(); renderDiaries();
  CASE.person = person; CASE.n = max + 1;
  const set = (id, v) => { const e = document.getElementById(id); if (e && v){ e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); } };
  set('meta_pib', name); set('meta_dob', dob);
  sex = sx; document.querySelectorAll('#sexSeg button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.sex === sex ? 'true' : 'false'));
  try{ refreshLabels(); calcAge(); }catch(e){}
  update(); savePatient(true); renderPatients();
  toast(`Нова госпіталізація №${CASE.n}: ${name}. Перенесено лише ПІБ, дату народження й стать`, 5000);
  return true;
}
