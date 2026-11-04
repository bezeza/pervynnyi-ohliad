/* ===== Імпорт з H24: JSON з буфера (скрипт «→ в Первинний огляд») → підтвердження → нова картка =====
   Лише те, що лікар бачить у вікні і підтверджує. У мережу нічого не йде.
   h24ImportValidate / h24ImportPlan — без DOM, їх перевіряють тести. */
function h24ImpPad(n){ return String(n).padStart(2, '0'); }
function h24ImpValidDate(y, m, d){
  y = +y; m = +m; d = +d;
  if (!(y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
  return y + '-' + h24ImpPad(m) + '-' + h24ImpPad(d);
}
function h24ImpDate(s){
  const t = String(s || '').trim();
  if (!t) return '';
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return h24ImpValidDate(m[1], m[2], m[3]);
  m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return h24ImpValidDate(m[3], m[2], m[1]);
  return '';
}
function h24ImpFmt(iso){
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + '.' + m[2] + '.' + m[1] : '';
}
function h24ImpSex(raw, name){
  const t = String(raw || '').trim().toLowerCase();
  if (/^(m|male|ч|чол)/.test(t) || /^ч[.,\s]/.test(t)) return 'm';
  if (/^(f|female|ж|жін)/.test(t) || /^ж[.,\s]/.test(t)) return 'f';
  const w = String(name || '').trim().split(/\s+/);
  const p = (w[2] || '').toLowerCase();
  if (/(івна|ївна|овна|евна|ична)$/.test(p)) return 'f';
  if (/(ович|евич|йович|ич)$/.test(p)) return 'm';
  return '';
}
function h24ImpIcd(code){
  const c = String(code || '').toUpperCase().trim();
  return /^[A-TV-Z]\d{2}(?:\.\d{1,2})?$/.test(c) ? c : '';
}
function h24ImpStr(v, max){
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (!s || /[<>]/.test(s)) return '';
  return s.slice(0, max || 300);
}
function h24ImpDenial(s){
  return /немає|нема\b|відсутн|не вияв|не обтяжен|заперечу|не зазнач|невідом|без алергі/i.test(String(s || ''));
}
function h24ImpActive(ep){
  const s = String(ep && ep.status || '').toLowerCase();
  if (/закри|заверш|скасов|помилк/.test(s)) return false;
  if (/актив|відкри|поточ|триває|в роботі|госпітал/.test(s)) return true;
  return !ep.end;
}
function h24ImportValidate(input){
  let raw = input;
  if (typeof raw === 'string'){
    const t = raw.replace(/^\uFEFF/, '').trim();
    if (!t) return {ok:false, error:'Буфер порожній. На сторінці пацієнта в МІС натисніть «→ в Первинний огляд».'};
    try { raw = JSON.parse(t); }
    catch (e){
      const a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a >= 0 && b > a){ try { raw = JSON.parse(t.slice(a, b + 1)); } catch (e2){ raw = null; } }
      else raw = null;
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {ok:false, error:'У буфері не JSON з H24. Для короткого рядка ПІБ є кнопка «⇩ З МІС».'};
  if (raw.source !== 'h24') return {ok:false, error:'Це не дані з H24 (немає позначки source: h24).'};
  if (+raw.version !== 1) return {ok:false, error:'Ця версія програми читає лише формат H24 версії 1.'};
  const p = raw.patient;
  if (!p || typeof p !== 'object') return {ok:false, error:'У JSON немає блока пацієнта.'};
  const fullName = h24ImpStr(p.fullName, 120);
  if (!fullName || !/[А-ЯІЇЄҐа-яіїєґA-Za-z]{2}/.test(fullName)) return {ok:false, error:'Немає ПІБ — імпорт зупинено, щоб не створити порожню картку.'};
  let birth = '';
  if (p.birthDate != null && String(p.birthDate).trim()){
    birth = h24ImpDate(p.birthDate);
    if (!birth) return {ok:false, error:'Дата народження не читається: ' + h24ImpStr(p.birthDate, 40)};
  }
  const sex = h24ImpSex(p.sex, fullName);
  const row = (it, withRole) => {
    if (!it || typeof it !== 'object') return null;
    const code = h24ImpIcd(it.code);
    let name = h24ImpStr(it.name, 300);
    if (code && name) name = name.replace(new RegExp('^' + code + '\\b\\s*', 'i'), '').trim();
    if (!code && !name) return null;
    const o = {code, name};
    if (withRole) o.role = h24ImpStr(it.role, 80);
    else { o.start = h24ImpDate(it.start); o.end = h24ImpDate(it.end); o.status = h24ImpStr(it.status, 80); }
    return o;
  };
  const list = (arr, withRole) => {
    if (arr == null) return [];
    if (!Array.isArray(arr)) return null;
    return arr.slice(0, 40).map(it => row(it, withRole)).filter(Boolean);
  };
  const episodes = list(raw.episodes, false);
  const diagnoses = list(raw.diagnoses, true);
  if (!episodes || !diagnoses) return {ok:false, error:'Епізоди або діагнози мають бути списком.'};
  const strings = arr => {
    if (arr == null) return [];
    if (!Array.isArray(arr)) return null;
    return arr.slice(0, 40).map(s => h24ImpStr(s, 300)).filter(Boolean);
  };
  const allergies = strings(raw.allergies);
  const medications = strings(raw.medications);
  if (!allergies || !medications) return {ok:false, error:'Алергії або ліки мають бути списком рядків.'};
  return {ok:true, data:{
    source:'h24', version:1, capturedAt: typeof raw.capturedAt === 'string' ? raw.capturedAt.slice(0, 40) : '',
    patient:{fullName, birthDate:birth, sex},
    episodes, diagnoses, allergies, medications
  }};
}
function h24ImportPick(data){
  const diags = (data.diagnoses || []).filter(d => d && (d.code || d.name));
  if (diags.length){
    const primary = diags.find(d => /основ/i.test(d.role || '')) || diags[0];
    return {main:primary, rest:diags.filter(d => d !== primary), source:'diagnosis'};
  }
  const eps = (data.episodes || []).filter(e => e && (e.code || e.name));
  const active = eps.filter(h24ImpActive);
  const pool = active.length ? active : eps;
  const sorted = pool.slice().sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')));
  return {main:sorted[0] || null, rest:[], source:sorted[0] ? 'episode' : ''};
}
function h24ImpDxText(d){
  if (!d) return '';
  if (d.name && d.code) return d.name + ' (' + d.code + ')';
  return d.name || d.code || '';
}
function h24ImportPlan(data){
  const pick = h24ImportPick(data);
  const p = data.patient || {};
  const main = pick.main;
  const sup = pick.rest.map(h24ImpDxText).filter(Boolean).join('; ');
  const rawA = data.allergies || [];
  const realA = rawA.filter(s => !h24ImpDenial(s));
  let allergyMode = '', allergyText = '';
  if (realA.length){ allergyMode = 'has'; allergyText = realA.join('; '); }
  else if (rawA.length) allergyMode = 'none';
  const meds = data.medications || [];
  const medsLine = meds.length ? 'Постійно приймає: ' + meds.join('; ') + '.' : '';
  const dxShown = main ? (h24ImpDxText(main) || 'на екрані не видно') : 'на екрані не видно';
  const lines = [
    ['ПІБ', p.fullName || ''],
    ['Дата народження', p.birthDate ? h24ImpFmt(p.birthDate) : 'на екрані не видно'],
    ['Стать', p.sex === 'm' ? 'чоловік' : p.sex === 'f' ? 'жінка' : 'на екрані не видно'],
    ['Діагноз', dxShown + (pick.source === 'episode' ? ' — з активного епізоду' : '')],
    ['Код МКХ-10', (main && main.code) || 'на екрані не видно'],
  ];
  if (sup) lines.push(['Супутні', sup]);
  if (allergyMode === 'has') lines.push(['Алергії', allergyText]);
  else if (allergyMode === 'none') lines.push(['Алергії', 'не обтяжений']);
  else lines.push(['Алергії', 'на екрані не видно — поле не чіпаємо']);
  lines.push(medsLine ? ['Ліки', medsLine] : ['Ліки', 'на екрані не видно — поле не чіпаємо']);
  lines.push(['Епізоди на екрані', String((data.episodes || []).length)]);
  return {
    ok:true, pib:p.fullName || '', dob:p.birthDate || '', sex:p.sex || '',
    dxName:(main && main.name) || '', dxCode:(main && main.code) || '', sup, allergyMode, allergyText, medsLine,
    source:pick.source, lines
  };
}
function h24ImportSame(plan){
  let sameId = '', sameOpen = false;
  try {
    const st = loadStore();
    sameId = Object.keys(st).find(id => st[id] && st[id].name === plan.pib && (!plan.dob || !st[id].dob || st[id].dob === plan.dob)) || '';
    sameOpen = mv('pib') === plan.pib && (!plan.dob || !mv('dob') || mv('dob') === plan.dob);
  } catch (e) {}
  return {sameId, existing: !!(sameId || sameOpen)};
}
function h24ImportDescribe(data){
  const plan = h24ImportPlan(data);
  const same = h24ImportSame(plan);
  plan.mode = same.existing ? 'existing' : 'new';
  plan.note = same.existing
    ? 'Такий пацієнт уже є — відкриємо його картку і допишемо лише порожні поля.'
    : 'Буде створено нового пацієнта й заповнено первинний огляд.';
  try {
    if (same.existing){
      const osn = F('dx.osn');
      if (osn && osn.el && osn.el.value.trim()){
        plan.dxLocked = true;
        plan.lines = plan.lines.map(([k, v]) => k === 'Діагноз' || k === 'Код МКХ-10' ? [k, v + ' — у картці вже є, не замінюємо'] : [k, v]);
      }
    }
  } catch (e) {}
  return plan;
}
function h24SetChoice(fid, text){
  const f = F(fid);
  if (!f || f.type !== 'sel' || !f.el || f.el.value !== '') return false;
  const i = f.opts.findIndex(o => O(o).t === text || O(o).l === text);
  if (i < 0) return false;
  f.el.value = String(i);
  f.autoSet = false;
  try { mark(f.el, f); } catch (e) {}
  return true;
}
function h24ImportApply(data){
  const v = data && data.source === 'h24' && data.patient ? {ok:true, data} : h24ImportValidate(data);
  if (!v.ok) return v;
  const plan = h24ImportPlan(v.data);
  const same = h24ImportSame(plan);
  if (same.sameId && typeof PID !== 'undefined' && same.sameId !== PID){ try { openPatient(same.sameId); } catch (e) {} }
  else if (!same.existing && (mv('pib') || (typeof PID !== 'undefined' && PID))){ try { newPatient(); } catch (e) {} }
  else { try { UST.dismissed = true; } catch (e) {} }
  const put = (id, value, overwrite) => {
    const e = document.getElementById(id);
    if (!e || value == null || value === '') return;
    if (!overwrite && String(e.value || '').trim()) return;
    e.value = value;
    e.dispatchEvent(new Event('input', {bubbles:true}));
  };
  put('meta_pib', plan.pib, !same.existing);
  put('meta_dob', plan.dob, !same.existing);
  if (plan.sex && (!same.existing || !sex)){ try { sexSet(plan.sex, false); } catch (e) {} }
  try {
    const osn = F('dx.osn'), mkh = F('dx.mkh'), sup = F('dx.supd');
    if (osn && plan.dxName && (!same.existing || !osn.el.value.trim())) osn.el.value = plan.dxName;
    if (mkh && plan.dxCode && (!same.existing || !mkh.el.value.trim())) mkh.el.value = plan.dxCode;
    if (sup && plan.sup && !sup.el.value.trim()) sup.el.value = plan.sup;
  } catch (e) {}
  try {
    if (plan.allergyMode === 'none') h24SetChoice('vitae.alerg', 'Алергологічний анамнез не обтяжений');
    else if (plan.allergyMode === 'has'){
      h24SetChoice('vitae.alerg', 'Алергологічний анамнез обтяжений');
      const x = F('vitae.alergx');
      if (x && plan.allergyText && !x.el.value.trim()) x.el.value = plan.allergyText;
    }
    if (plan.medsLine){
      const vx = F('vitae.vx');
      if (vx && vx.el.value.indexOf(plan.medsLine) < 0){
        const cur = vx.el.value.trim();
        vx.el.value = cur ? cur + '\n' + plan.medsLine : plan.medsLine;
      }
    }
  } catch (e) {}
  try { calcAge(); } catch (e) {}
  try { update(); } catch (e) {}
  try { savePatient(true); } catch (e) {}
  try { renderPtBar(); } catch (e) {}
  try { const i = TABS.findIndex(t => t.id === 'meta'); if (i >= 0) show(i); } catch (e) {}
  try { if (typeof UST !== 'undefined'){ UST.dismissed = true; stApply(); } } catch (e) {}
  try { toast('З H24: ' + plan.pib, 2800); } catch (e) {}
  return plan;
}
function h24ImportDialog(state){
  const old = document.getElementById('h24ImportDlg'); if (old) old.remove();
  state = state || {};
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  let body, actions;
  if (state.data){
    const plan = h24ImportDescribe(state.data);
    body = h('div', {},
      h('p', {class:'chips-hint'}, plan.note + ' Дані лишаються в цьому браузері.'),
      h('div', {}, ...plan.lines.map(([k, v]) => h('div', {style:'display:flex;gap:10px;margin:4px 0;align-items:baseline'},
        h('b', {style:'min-width:11.5em;flex:none'}, k), h('span', {}, v)))));
    actions = h('div', {class:'acts2', style:'margin-top:12px'},
      h('button', {type:'button', class:'btn primary', onclick:()=>{ h24ImportApply(state.data); close(); }}, 'Заповнити'),
      h('button', {type:'button', class:'btn', onclick:close}, 'Скасувати'));
  } else {
    const ta = h('textarea', {id:'h24ImportPaste', rows:'8', style:'width:100%;margin-top:8px', 'aria-label':'JSON з H24', placeholder:'Вставте сюди JSON з кнопки «→ в Первинний огляд»'});
    if (state.draft) ta.value = state.draft;
    const err = h('p', {class:'chips-hint', style:'color:var(--warn, #8a5a00)'}, state.error || 'Вставте JSON, скопійований у МІС.');
    body = h('div', {}, err, ta);
    actions = h('div', {class:'acts2', style:'margin-top:12px'},
      h('button', {type:'button', class:'btn primary', onclick:()=>{
        const v = h24ImportValidate(ta.value);
        if (!v.ok){ err.textContent = v.error; return; }
        h24ImportDialog({data:v.data});
      }}, 'Перевірити'),
      h('button', {type:'button', class:'btn', onclick:close}, 'Скасувати'));
  }
  const box = h('div', {id:'h24ImportDlg', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-label':'Імпорт з H24'},
    h('div', {class:'mcard'},
      h('div', {class:'ph'}, h('h2', {}, 'Імпорт з H24'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      body, actions));
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(box);
  const focus = box.querySelector(state.data ? '.btn.primary' : 'textarea');
  if (focus) setTimeout(()=>{ try { focus.focus(); } catch (e) {} }, 0);
}
function h24ImportOpen(){
  const paste = msg => h24ImportDialog({error:msg || 'Браузер не дав прочитати буфер. Вставте JSON у поле нижче.'});
  let read = null;
  try { read = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : null; } catch (e) { read = null; }
  if (!read || typeof read.then !== 'function'){ paste(); return; }
  read.then(text => {
    const v = h24ImportValidate(text);
    if (v.ok) h24ImportDialog({data:v.data});
    else h24ImportDialog({error:v.error, draft:String(text || '').slice(0, 20000)});
  }, () => paste());
}
function h24ImportButton(){
  return h('button', {type:'button', class:'btn', 'data-h24-import':'1', title:'Вставити JSON, скопійований кнопкою «→ в Первинний огляд» у МІС. Спершу покаже, що буде заповнено.', onclick:h24ImportOpen}, 'Імпорт з H24');
}
function h24ImportPlace(){
  const mis = document.getElementById('misIn');
  if (mis && !mis.querySelector('[data-h24-import]')) mis.append(h24ImportButton());
  document.querySelectorAll('.ust-acts').forEach(acts => { if (!acts.querySelector('[data-h24-import]')) acts.append(h24ImportButton()); });
}
function h24ImportInstall(){
  h24ImportPlace();
  setTimeout(h24ImportPlace, 0);
  setTimeout(h24ImportPlace, 400);
  try {
    if (typeof stBuild === 'function' && !stBuild._h24){
      const orig = stBuild;
      const wrapped = function(){ const r = orig.apply(this, arguments); try { h24ImportPlace(); } catch (e) {} return r; };
      wrapped._h24 = 1;
      stBuild = wrapped;
    }
  } catch (e) {}
}
try { if (typeof document !== 'undefined' && document.getElementById && document.getElementById('meta_pib')) h24ImportInstall(); } catch (e) {}
