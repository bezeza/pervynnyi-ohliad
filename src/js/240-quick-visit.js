/* ===== Швидкий прийом (амбулаторно) і швидкий огляд (стаціонар) =====
   Амбулаторно: лише головні вкладки + «Показники». Стаціонар: «Показники і системи» на одному екрані, вкладки систем лишаються для детального опису. */
let QUICK = false; try{ QUICK = localStorage.getItem('po.quick') === '1'; }catch(e){}
const QT = ['meta','hv','skarhy','morbi','qv','loc','help','ctrl','scr','dx','rxt','hosp','eln','calc','tpl','set'];
const quickOn = () => QUICK && DOC === 'ohl';
const quickHide = () => quickOn() && MODE === 'amb';   // ховати другорядні вкладки — лише на амбулаторному прийомі
const QSYS = ['zah','shk','dyh','ssc','trav','sech','nevr'];
function sysState(id){
  const sc = SECTIONS.find(x=>x.id === id);
  if (sc.fields.some(f=>f.type !== 'num' && !f.bo && f.type !== 'hdr' && !f.headOnly && val(f, true))) return 'описано';
  if (sc.fields.some(f=>f.bo && val(f, true))) return 'б/о';
  return '';
}
function qvPanel(){
  const wrap = h('div', {});
  wrap.append(h('div', {class:'pt'}, h('h3', {}, 'Основні показники'), h('div', {class:'qgrid', id:'qvVit'})),
    h('div', {class:'pt'}, h('h3', {}, 'Системи',
      h('span', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>{ let n = 0;
        QSYS.forEach(id=>{ if (sysState(id)) return; const sc = SECTIONS.find(x=>x.id === id), b = sc.fields.find(f=>f.bo);
          if (b){ b.el.value = 0; mark(b.el, b); n++; } else { applyNorm(sc); n++; } });
        update(); toast(n ? 'Неописані системи записано коротко: «Без особливостей»' : 'Усі системи вже описано'); }}, 'Решта — Б/о'),
        h('button', {type:'button', class:'btn norm', onclick:undoable('«Решта — Норма»', ()=>{ let n = 0; QSYS.forEach(id=>{ if (sysState(id)) return; applyNorm(SECTIONS.find(x=>x.id === id)); n++; });
          update(); toast(n ? 'Неописані системи заповнено детальною нормою' : 'Усі системи вже описано'); })}, 'Решта — Норма'))),
      h('p', {class:'chips-hint'}, 'Змінене — відкрийте систему й опишіть. Решту одним натисканням: «Б/о» (коротко) або «Норма» (детально).'),
      h('div', {id:'qvSys'})));
  return wrap;
}
function proxyIn(id, ph, u, lbl){
  const t = document.getElementById(id); const p = h('input', {inputmode:'decimal', placeholder:ph, 'aria-label':lbl, 'data-for':id});
  p.addEventListener('input', ()=>{ t.value = p.value; t.dispatchEvent(new Event('input')); });
  return [p, h('span', {class:'u'}, u)];
}
function renderQV(){
  const vb = document.getElementById('qvVit'); if (!vb || !quickOn()) return;
  if (!vb.dataset.built){
    vb.dataset.built = '1';
    const st = F('zah.stan'), sel = h('select', {'aria-label':'Загальний стан'}, h('option', {value:''}, '— стан —'), ...st.opts.map((o,i)=>h('option', {value:i}, O(o).l)));
    sel.addEventListener('change', ()=>{ st.el.value = sel.value; st.el.dispatchEvent(new Event('change')); }); sel.dataset.forSel = 'zah_stan';
    const row = (l, ...k) => h('div', {class:'f'}, h('div', {class:'lbl'}, l), h('div', {class:'nums'}, ...k));
    vb.append(h('div', {class:'f'}, h('div', {class:'lbl'}, 'Загальний стан'), sel),
      row('Температура', ...proxyIn('zah_temp_0', '36,6', '°C', 'Температура')),
      row('АТ', ...proxyIn('ssc_ad_0', '130', '/', 'АТ систолічний'), ...proxyIn('ssc_ad_1', '80', 'мм рт. ст.', 'АТ діастолічний')),
      row('ЧСС', ...proxyIn('ssc_chss_0', '76', 'уд./хв', 'ЧСС')),
      row('ЧД і SpO2', ...proxyIn('dyh_chd_0', '16', 'за хв', 'ЧД'), ...proxyIn('dyh_chd_1', '97', '%', 'SpO2')));
  }
  vb.querySelectorAll('input[data-for]').forEach(p=>{ if (document.activeElement !== p) p.value = document.getElementById(p.dataset.for).value; });
  const s0 = vb.querySelector('select'); if (s0) s0.value = F('zah.stan').el.value;
  const sb = document.getElementById('qvSys'); sb.innerHTML = '';
  QSYS.forEach(id=>{
    const sc = SECTIONS.find(x=>x.id === id), stt = sysState(id), b = sc.fields.find(f=>f.bo);
    sb.append(h('div', {class:'qsys'}, h('b', {}, sc.short || sc.title), h('span', {class:'qst' + (stt ? ' on' : '')}, stt || 'не описано'),
      h('span', {class:'acts2'},
        b ? h('button', {type:'button', class:'btn', onclick:()=>{ sc.fields.forEach(f=>{ if (f.type === 'sel' && !f.bo && f.norm !== undefined){ f.el.value = ''; mark(f.el, f); } }); if (b.el.value === '') b.el.value = 0; mark(b.el, b); update(); }}, 'Б/о') : null,
        h('button', {type:'button', class:'btn norm', onclick:()=>{ applyNorm(sc); update(); }}, 'Норма'),
        h('button', {type:'button', class:'more', onclick:()=>show(TABS.indexOf(sc))}, 'Відкрити'))));
  });
}

