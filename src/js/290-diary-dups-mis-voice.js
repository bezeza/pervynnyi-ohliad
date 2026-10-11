/* ===== Однакові щоденники ===== */
function wordsOf(t){ return new Set(t.toLowerCase().replace(/\d{1,2}\.\d{1,2}\.\d{4},?\s*\d{1,2}:\d{2}\.?/g, '').split(/[^а-яіїєґa-z0-9’']+/i).filter(w=>w.length > 2)); }
function diarySimilar(){
  const last = DIARIES[DIARIES.length - 1]; if (!last) return null;
  const tmp = document.createElement('div'); tmp.innerHTML = last.html;
  const a = wordsOf(itext(tmp)), b = wordsOf(itext($('#out')));
  if (!a.size || !b.size) return null;
  let inter = 0; b.forEach(w=>{ if (a.has(w)) inter++; });
  const sim = inter / (a.size + b.size - inter);
  const vit = ['d_obj_t_0','d_obj_ad_0','d_obj_ad_1','d_obj_chss_0'].map(id=>{ const e = document.getElementById(id); return e ? e.value.trim() : ''; });
  const lv = ['d_obj_t_0','d_obj_ad_0','d_obj_ad_1','d_obj_chss_0'].map(id=>(last.data && last.data.f && last.data.f[id]) || '');
  return {sim, sameVit: vit.join('|') === lv.join('|') && vit.some(Boolean)};
}

/* ===== Копіювання для МІС: окремими частинами ===== */
let LASTPARTS = [];
function copyPlain(t){
  const fb = ()=>{ const ta = h('textarea', {style:'position:fixed;left:-9999px'}); ta.value = t; document.body.append(ta); ta.select(); let ok = false; try{ ok = document.execCommand('copy'); }catch(e){} ta.remove(); toast(ok ? 'Скопійовано' : 'Не вдалося скопіювати — виділіть текст вручну'); };
  try{ if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(()=>toast('Скопійовано'), fb); return; } }catch(e){}
  fb();
}
function misPanel(){
  const old = document.getElementById('misBox'); if (old){ old.remove(); return; }
  generate();
  const parts = LASTPARTS.filter(p=>p.body && p.body.trim());
  if (!parts.length){ toast('Текст порожній'); return; }
  const close = ()=>box.remove();
  const box = h('div', {id:'misBox', class:'modal', role:'dialog', 'aria-label':'Копіювання для МІС'},
    h('div', {class:'mcard'},
      h('div', {class:'ph'}, h('h2', {}, 'Копіювання частинами для МІС'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      h('p', {class:'chips-hint'}, 'Кожен розділ — окремо, без шапки й підписів: вставляйте у відповідні поля медичної інформаційної системи. Ручні правки з вікна тексту тут не враховуються.'),
      h('div', {class:'acts2', style:'margin-bottom:8px'}, h('button', {type:'button', class:'btn primary', onclick:()=>copyPlain(g(parts.map(p=>(p.head ? p.head + ' ' : '') + p.body).join('\n')))}, 'Копіювати все без шапки')),
      ...parts.map(p=>{ const t = g(p.body); return h('div', {class:'mpart'}, h('div', {class:'mhead'}, h('b', {}, (p.head || p.title || 'Текст').replace(/:$/, '')),
        h('button', {type:'button', class:'btn', onclick:()=>copyPlain(t)}, 'Копіювати')), h('div', {class:'mbody'}, t.length > 260 ? t.slice(0, 260) + '…' : t)); })));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  document.body.append(box);
}

/* ===== Голосове введення (розпізнавання мови браузера) ===== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let REC = null;
function micBtn(target){
  if (!SR) return null;
  const b = h('button', {type:'button', class:'mic', title:'Надиктувати (розпізнавання мови браузера; у Chrome потрібен інтернет)', 'aria-label':'Надиктувати'});
  b.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><rect x="5.5" y="1" width="5" height="9" rx="2.5"/><path d="M3 7.5a5 5 0 0 0 10 0" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="7.3" y="12" width="1.4" height="3"/></svg>';
  b.addEventListener('click', ()=>{
    if (REC){ REC.stop(); return; }
    const r = new SR(); REC = r; r.lang = 'uk-UA'; r.interimResults = false; r.continuous = true;
    b.classList.add('on');
    r.onresult = e=>{ let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      t = t.trim(); if (!t) return; const v = target.value.trim(); target.value = v ? v.replace(/[.\s]*$/, '') + (/[.!?]$/.test(v) ? ' ' : '. ') + t.charAt(0).toUpperCase() + t.slice(1) : t.charAt(0).toUpperCase() + t.slice(1);
      target.dispatchEvent(new Event('input')); };
    r.onerror = e=>{ toast(e.error === 'not-allowed' ? 'Немає дозволу на мікрофон' : e.error === 'network' ? 'Розпізнавання мови потребує інтернету' : 'Розпізнавання зупинено'); };
    r.onend = ()=>{ REC = null; b.classList.remove('on'); };
    try{ r.start(); toast('Говоріть… Натисніть ще раз, щоб зупинити'); }catch(e){ REC = null; b.classList.remove('on'); }
  });
  return b;
}

