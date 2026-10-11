/* ===== Перенесення пацієнтів між пристроями (телефон ⇄ комп’ютер) без хмари =====
   Файл перенесення (за бажанням — зашифрований паролем: AES-GCM, ключ з пароля через PBKDF2) передається будь-яким
   способом: «Поділитися» → месенджер / пошта / USB. На іншому пристрої — «Прийняти файл»: нові пацієнти додаються,
   наявні оновлюються лише якщо у файлі новіша версія (нічого не затирається старішим). */
const TR_ITER = 250000;
const b64 = buf => { let s = ''; new Uint8Array(buf).forEach(b=>s += String.fromCharCode(b)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function trKey(pass, salt){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:TR_ITER, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function trEncrypt(obj, pass){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({name:'AES-GCM', iv}, await trKey(pass, salt), new TextEncoder().encode(JSON.stringify(obj)));
  return {type:'po-transfer-enc', v:1, kdf:'PBKDF2-SHA256', iter:TR_ITER, salt:b64(salt), iv:b64(iv), data:b64(data)};
}
async function trDecrypt(o, pass){
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(o.iv)}, await trKey(pass, unb64(o.salt)), unb64(o.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
function trPayload(scope, withTpl){
  if (PID || patientName()) savePatient(true);
  const st = loadStore(), wk = Date.now() - 7 * 864e5, items = {};
  Object.keys(st).forEach(id=>{ if (scope === 'all' || (scope === 'cur' && id === PID) || (scope === 'week' && st[id].updated >= wk)) items[id] = st[id]; });
  const o = {type:'po-transfer', v:1, made:Date.now(), app:VERSION, items};
  if (withTpl) o.custom = CUSTOM;
  return o;
}
async function trSend(scope, withTpl, pass, share){
  const p = trPayload(scope, withTpl), n = Object.keys(p.items).length;
  if (!n && !withTpl){ toast('Немає пацієнтів для перенесення'); return; }
  const obj = pass ? await trEncrypt(p, pass) : p;
  const d = new Date(), name = `perenesennia_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${n}pac${pass ? '_zahyst' : ''}.json`;
  const file = new File([JSON.stringify(obj)], name, {type:'application/json'});
  if (share && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:'Первинний огляд — перенесення пацієнтів'}); toast('Файл передано. На іншому пристрої: «⇄ Перенесення» → «Прийняти файл»', 5000); return; }
    catch(e){ if (e && e.name === 'AbortError') return; }
  }
  await downloadJSON(obj, name);
}
/* злиття: нові — додаються; той самий пацієнт (той самий id або ПІБ + дата народження) — береться новіша версія */
function trPlan(items){
  const st = loadStore(), key = it => (String(it.name || '').trim().toLowerCase() + '|' + (it.dob || ''));
  const byKey = {}; Object.keys(st).forEach(id=>{ byKey[key(st[id])] = id; });
  const res = {add:[], upd:[], old:[]};
  Object.keys(items || {}).forEach(id=>{ const it = items[id]; if (!it || !it.snap || !it.snap.f) return;
    const here = st[id] ? id : byKey[key(it)];
    if (!here) res.add.push([id, it]); else if ((it.updated || 0) > (st[here].updated || 0)) res.upd.push([here, it]); else res.old.push([here, it]); });
  return res;
}
function trMergeCustom(c){
  if (!c || typeof c !== 'object') return 0; let n = 0;
  Object.keys(c.opts || {}).forEach(k=>{ const a = CUSTOM.opts[k] = CUSTOM.opts[k] || []; (c.opts[k] || []).forEach(x=>{ if (!a.includes(x)){ a.push(x); n++; } }); });
  [['presets','name'],['rxsets','name'],['diary','name'],['btns','t']].forEach(([k, f])=>{ const a = CUSTOM[k] = CUSTOM[k] || []; (c[k] || []).forEach(x=>{ if (x && !a.some(y=>JSON.stringify(y) === JSON.stringify(x) || (x[f] && y[f] === x[f]))){ a.push(x); n++; } }); });
  ['ovr','hid'].forEach(k=>{ CUSTOM[k] = CUSTOM[k] || {}; Object.keys(c[k] || {}).forEach(x=>{ if (!(x in CUSTOM[k])){ CUSTOM[k][x] = c[k][x]; n++; } }); });
  if (n) saveCustom();
  return n;
}
function trApply(plan, custom){
  const st = loadStore();
  plan.add.forEach(([id, it])=>{ st[st[id] ? 'p' + Date.now() + Math.random().toString(36).slice(2, 6) : id] = it; });
  plan.upd.forEach(([id, it])=>{ st[id] = it; });
  if (!saveStore(st)){ toast('Не вдалося зберегти: сховище браузера переповнене або заборонене', 5000); return; }
  const t = custom ? trMergeCustom(custom) : 0;
  renderPatients(); if (PID && plan.upd.some(([id])=>id === PID)) openPatient(PID);
  toast(`Перенесено: нових ${plan.add.length}, оновлено ${plan.upd.length}` + (plan.old.length ? `, пропущено (тут новіші) ${plan.old.length}` : '') + (t ? `; шаблонів додано: ${t}` : ''), 5000);
}
function trReceive(obj){
  const go = p => {
    if (!p || !(p.type === 'po-transfer' || p.type === 'po-patients') || typeof p.items !== 'object'){ toast('Це не файл пацієнтів цієї програми або він пошкоджений', 5000); return; }
    const plan = trPlan(p.items);
    const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-label':'Прийняти пацієнтів'}, h('div', {class:'nvbox'},
      h('h3', {}, 'Прийняти пацієнтів з файлу'),
      h('ul', {}, h('li', {}, `Нових пацієнтів: ${plan.add.length}`), h('li', {}, `Оновиться (у файлі новіша версія): ${plan.upd.length}`), h('li', {}, `Без змін (тут новіша або та сама): ${plan.old.length}`),
        p.custom ? h('li', {}, 'Мої шаблони й набори — додадуться ті, яких тут немає') : ''),
      plan.add.concat(plan.upd).length ? h('p', {class:'chips-hint'}, plan.add.concat(plan.upd).slice(0, 12).map(([,it])=>it.name).join(', ') + (plan.add.length + plan.upd.length > 12 ? '…' : '')) : '',
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); trApply(plan, p.custom); }}, 'Прийняти'), h('button', {type:'button', class:'more', onclick:()=>dlg.remove()}, 'Скасувати'))));
    document.body.append(dlg);
  };
  if (obj && obj.type === 'po-transfer-enc'){
    const pi = h('input', {type:'password', placeholder:'Пароль', 'aria-label':'Пароль', autocomplete:'off'}), err = h('p', {class:'rx-warn', hidden:''}, 'Невірний пароль');
    const tryIt = async () => { try{ const p = await trDecrypt(obj, pi.value); dlg.remove(); go(p); }catch(e){ err.hidden = false; pi.select(); } };
    pi.addEventListener('keydown', e=>{ if (e.key === 'Enter') tryIt(); });
    const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-label':'Пароль файлу'}, h('div', {class:'nvbox'}, h('h3', {}, 'Файл захищено паролем'), pi, err,
      h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn primary', onclick:tryIt}, 'Відкрити'), h('button', {type:'button', class:'more', onclick:()=>dlg.remove()}, 'Скасувати'))));
    document.body.append(dlg); setTimeout(()=>pi.focus(), 30); return;
  }
  go(obj);
}
importFile = function(file){ const rd = new FileReader(); rd.onload = ()=>{ let o = null; try{ o = JSON.parse(rd.result); }catch(e){} trReceive(o); }; rd.readAsText(file); };
function transferDialog(){
  const n = Object.keys(loadStore()).length + (PID ? 0 : (patientName() ? 1 : 0));
  let scope = 'all'; const sc = h('div', {class:'seg wseg'});
  [['all', `Усі (${n})`], ['week', 'Змінені за 7 днів'], ['cur', 'Лише відкритий']].forEach(([k,l])=>{ const b = h('button', {type:'button', 'aria-pressed':k === scope ? 'true' : 'false', disabled:k === 'cur' && !PID && !patientName() ? '' : null, onclick:()=>{ scope = k; sc.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }}, l); sc.append(b); });
  const tpl = h('input', {type:'checkbox', checked:''}), pass = h('input', {type:'password', placeholder:'Пароль (рекомендовано)', autocomplete:'new-password', 'aria-label':'Пароль'});
  const file = h('input', {type:'file', accept:'.json,application/json', hidden:'', onchange:e=>{ const f = e.target.files[0]; e.target.value = ''; if (f){ dlg.remove(); importFile(f); } }});
  const canShare = !!(navigator.canShare && window.File && (()=>{ try{ return navigator.canShare({files:[new File(['{}'], 't.json', {type:'application/json'})]}); }catch(e){ return false; } })());
  const send = share => async () => { const pw = pass.value; if (!pw && !confirm('Без пароля файл з даними пацієнтів зможе відкрити будь-хто, до кого він потрапить. Продовжити без пароля?')) return; dlg.remove(); await trSend(scope, tpl.checked, pw, share); };
  const dlg = h('div', {class:'navsheet packsheet trdlg', role:'dialog', 'aria-label':'Перенесення пацієнтів'}, h('div', {class:'nvbox'},
    h('div', {class:'nshead'}, h('b', {}, '⇄ Перенесення між телефоном і комп’ютером'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
    h('h3', {class:'sub'}, '1. Передати з цього пристрою'),
    sc, h('label', {class:'chk', style:'margin:8px 0'}, tpl, ' Разом із моїми шаблонами й наборами'), pass,
    h('p', {class:'chips-hint'}, 'Пароль повідомте собі окремо (не в тому ж чаті, що й файл). Без пароля файл — звичайний текст.'),
    h('div', {class:'acts2'}, canShare ? h('button', {type:'button', class:'btn primary', onclick:send(true)}, 'Поділитися… (Telegram, Viber, пошта)') : '',
      h('button', {type:'button', class:canShare ? 'btn' : 'btn primary', onclick:send(false)}, 'Зберегти файл')),
    h('h3', {class:'sub', style:'margin-top:16px'}, '2. Прийняти на іншому пристрої'),
    h('p', {class:'chips-hint'}, 'Відкрийте тут програму, натисніть «Прийняти файл» і виберіть отриманий файл. Нові пацієнти додадуться, наявні оновляться лише новішою версією.'),
    h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>file.click()}, 'Прийняти файл'), file),
    h('details', {class:'fold', style:'margin-top:12px'}, h('summary', {}, 'Як передати з телефона на комп’ютер'),
      h('ol', {}, h('li', {}, 'На телефоні: «⇄ Перенесення» → пароль → «Поділитися…» → Telegram, чат «Збережене» (або Viber «Мої нотатки», або пошта собі).'),
        h('li', {}, 'На комп’ютері: відкрийте той самий чат, збережіть файл.'), h('li', {}, 'У програмі на комп’ютері: «⇄ Перенесення» → «Прийняти файл» → введіть пароль.'),
        h('li', {}, 'Назад — так само, у зворотному напрямку.')))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.body.append(dlg);
}
/* кнопки: у «Записі» (список пацієнтів) і у вікні пацієнтів */
{ const pl = document.getElementById('plist'); if (pl) pl.before(h('div', {class:'acts2', style:'margin:6px 0'}, h('button', {type:'button', class:'btn', onclick:transferDialog}, '⇄ Перенесення телефон ⇄ комп’ютер'))); }
{ const o0 = openSwitcher; openSwitcher = function(){ o0(); const a = document.querySelector('.switcher .acts2'); if (a) a.append(h('button', {type:'button', class:'more', onclick:()=>{ document.querySelector('.switcher').remove(); transferDialog(); }}, '⇄ Перенесення')); }; }
