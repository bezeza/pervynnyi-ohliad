/* ===== Телефон: менше всього на екрані (0.9.3.20) =====
   Замість темної шапки, рядка «Документ · Норма · Швидко · ↶ · Документ з огляду» і картки шаблону —
   одна кнопка з назвою документа поруч із розділами. Вона відкриває аркуш «Документ і дії». */
const isPhone = () => !!(window.matchMedia && matchMedia('(max-width:899px)').matches);
const docName = k => { const d = [...DOCLIST[MODE], ...DOCMORE[MODE]].find(x=>x[0] === k); return d ? d[1] : k; };
const docShort = k => ({ohl:'Огляд', shch:'Щоденник', epi:'Епікриз', rx:'Призначення'}[k] || docName(k).split(/[\s(]/)[0]);
function openActs(){
  const sh = h('div', {class:'navsheet actsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Документ і дії'});
  const close = () => { sh.remove(); document.body.style.overflow = ''; };
  const act = (label, fn, cls) => h('button', {type:'button', class:'btn ' + (cls || ''), onclick:()=>{ close(); fn(); }}, label);
  const click = id => () => { const b = document.getElementById(id); if (b) b.click(); };
  const main = DOCLIST[MODE], more = DOCMORE[MODE];
  const dbtn = ([k, l]) => h('button', {type:'button', class:'btn' + (k === DOC ? ' on' : ''), 'aria-pressed':k === DOC ? 'true' : 'false', onclick:()=>{ close(); switchDoc(k); }}, l);
  const tplName = curKey && typeof PRESETS !== 'undefined' ? ((PRESETS.find(p=>p.key === curKey) || {}).name || '') : '';
  sh.append(
    h('div', {class:'nshead'}, h('b', {}, 'Документ і дії'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('h3', {class:'as-h'}, 'Документ'),
    h('div', {class:'as-docs'}, ...main.map(dbtn)),
    more.length ? h('details', {class:'as-more'}, h('summary', {}, 'Інші документи · ' + more.length), h('div', {class:'as-docs'}, ...more.map(dbtn))) : '',
    h('h3', {class:'as-h'}, 'Заповнення'),
    h('div', {class:'as-list'},
      act('= Норма в усіх системах', click('allNorm'), 'norm'),
      act('⚡ Швидкий режим (лише головне)', click('quickBtn')),
      act('↶ Скасувати останню дію', click('undoBtn')),
      act('＋ Документ з огляду…', click('mkDocBtn')),
      act(tplName ? 'Змінити шаблон («' + tplName + '»)…' : 'Обрати хворобу (шаблон)…', ()=>goTab('hv'))),
    h('h3', {class:'as-h'}, 'Програма'),
    h('div', {class:'as-list'},
      act('👥 Пацієнти', click('ptbar')),
      act('🩺 Профіль (спеціальність, де працюєте)', click('profBtn')),
      act('◐ Тема оформлення', click('themeBtn')),
      act('▦ Вигляд на телефоні (розмір тексту, щільність, панель)', ()=>{ goTab('set'); setTimeout(()=>{ const v = document.getElementById('viewSet'); if (v){ const d = v.closest('details'); if (d) d.open = true; v.scrollIntoView({block:'start', behavior:'smooth'}); } }, 120); }),
      act('⚙ Налаштувати під себе', ()=>customizeOpen()),
      act('Усі налаштування', ()=>goTab('set'))));
  document.body.append(sh); document.body.style.overflow = 'hidden';
  sh.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });
  const f = sh.querySelector('.as-docs .on'); if (f) f.focus();
}
{ const rt = renderTabNav; renderTabNav = function(){ const r = rt.apply(this, arguments);
    const tn = $('#tabnav'); if (tn && !tn.querySelector('.tn-doc')) tn.append(h('button', {type:'button', class:'btn tn-doc', 'aria-haspopup':'dialog', title:'Документ і дії', onclick:openActs}, h('span', {class:'tn-dn'}, docShort(DOC)), h('span', {'aria-hidden':'true'}, ' ⋯')));
    return r; };
  const sd = switchDoc; switchDoc = function(){ const r = sd.apply(this, arguments); try{ renderTabNav(); }catch(e){} return r; };
}
/* на телефоні шапка пацієнта ховається, коли гортаєте вниз, і повертається, коли вгору */
{ let y0 = 0;
  addEventListener('scroll', ()=>{ if (!isPhone()) { document.body.classList.remove('pt-hide'); return; }
    const y = scrollY; if (Math.abs(y - y0) < 12) return;
    document.body.classList.toggle('pt-hide', y > y0 && y > 160); y0 = y; }, {passive:true}); }
