/* ===== Місце проживання полями (0.9.3.21): тип населеного пункту, назва, громада, район, область, вулиця, індекс.
   З них складається адреса одним рядком (meta_addr) — для бланка 003/о (п. 7, 7.1), виписки 027/о й форм МОЗ.
   Підказки (громада, район, область, назви) — з попередніх пацієнтів цього браузера. ===== */
const ADDR = [['np_t','Тип'],['np','Населений пункт'],['hr','Громада'],['ra','Район'],['ob','Область'],['st','Вулиця, будинок, квартира'],['zip','Поштовий індекс']];
const aV = k => { const e = document.getElementById('meta_addr_' + k); return e ? e.value.trim() : ''; };
function addrCompose(){
  const t = aV('np_t'), np = aV('np'), hr = aV('hr'), ra = aV('ra'), ob = aV('ob'), st = aV('st');
  const parts = [
    np ? (t ? t + ' ' : '') + np : '',
    hr ? (/громад/i.test(hr) ? hr : hr + ' громада') : '',
    ra ? (/район|р-н/i.test(ra) ? ra : ra + ' район') : '',
    ob ? (/обл/i.test(ob) ? ob : ob + ' область') : '',
    st];
  return parts.filter(Boolean).join(', ');
}
{ const a = document.getElementById('meta_addr'), wrap = a && (a.closest('.f') || a.parentElement);
  if (a && wrap){
    const dl = k => h('datalist', {id:'dl_addr_' + k});
    const mk = (k, label, attrs) => { const id = 'meta_addr_' + k, e = h('input', Object.assign({id, autocomplete:'off', list:'dl_addr_' + k, oninput:()=>{ a.value = addrCompose(); a.dispatchEvent(new Event('input', {bubbles:true})); }}, attrs || {}));
      return h('div', {class:'f'}, h('label', {for:id}, label), e, dl(k)); };
    const tsel = h('select', {id:'meta_addr_np_t', onchange:()=>{ a.value = addrCompose(); a.dispatchEvent(new Event('input', {bubbles:true})); }},
      h('option', {value:''}, '—'), h('option', {value:'м.'}, 'місто'), h('option', {value:'смт'}, 'селище (смт)'), h('option', {value:'с-ще'}, 'селище'), h('option', {value:'с.'}, 'село'));
    const box = h('div', {class:'addrbox wide'},
      h('div', {class:'lbl'}, 'Місце проживання'),
      h('div', {class:'addrg'},
        h('div', {class:'f'}, h('label', {for:'meta_addr_np_t'}, 'Тип'), tsel),
        mk('np', 'Населений пункт', {placeholder:'назва'}),
        mk('hr', 'Громада', {placeholder:'напр., ___ селищна'}),
        mk('ra', 'Район', {placeholder:'напр., ___ район'}),
        mk('ob', 'Область', {placeholder:'напр., ___ область'}),
        mk('st', 'Вулиця, будинок, квартира', {placeholder:'вул. ___, буд. __, кв. __'}),
        mk('zip', 'Індекс', {inputmode:'numeric', maxlength:'5', placeholder:'5 цифр'})));
    wrap.before(box);
    const lb = wrap.querySelector('label'); if (lb) lb.textContent = 'Адреса одним рядком (складається з полів вище; можна виправити)';
    /* підказки з попередніх пацієнтів */
    const fillDl = () => { const st = loadStore(), seen = {}; ADDR.forEach(([k])=>seen[k] = new Set());
      Object.values(st).forEach(p=>{ const f = p.snap && p.snap.f || {}; ['np','hr','ra','ob'].forEach(k=>{ const v = String(f['meta_addr_' + k] || '').trim(); if (v) seen[k].add(v); }); });
      ['np','hr','ra','ob'].forEach(k=>{ const d = document.getElementById('dl_addr_' + k); if (d){ d.innerHTML = ''; [...seen[k]].sort().slice(0, 60).forEach(v=>d.append(h('option', {value:v}))); } }); };
    box.addEventListener('focusin', fillDl);
  } }
/* новий пацієнт — адреса й місце роботи очищуються (раніше лишались від попереднього) */
{ const ca = clearAll; clearAll = function(forRestore){ const r = ca.apply(this, arguments);
    if (!forRestore) ['addr','work', ...ADDR.map(x=>'addr_' + x[0])].forEach(k=>{ const e = document.getElementById('meta_' + k); if (e) e.value = ''; });
    return r; }; }
/* «Для ШІ»: адресу прибирати повністю */
ADDR.forEach(([k])=>{ if (!AI_KEEP.includes('addr_' + k)) AI_KEEP.push('addr_' + k); });
