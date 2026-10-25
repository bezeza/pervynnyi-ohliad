/* ===== Перший запуск: коротке знайомство (лікар, заклад, профіль, режим) ===== */
function welcomeDialog(force){
  let seen = false; try{ seen = localStorage.getItem('po.welcome') === '1' || !!mv('doc'); }catch(e){}
  if (seen && !force) return;
  const fld = (id, label, ph, extra) => { const src = document.getElementById('meta_' + id);
    const e = h('input', Object.assign({value:src ? src.value : '', placeholder:ph, 'aria-label':label}, extra || {})); return [h('label', {class:'wl'}, label, e), e]; };
  const [lDoc, iDoc] = fld('doc', 'Ваше ПІБ (для підпису)', 'Прізвище І. Б.');
  const [lPos, iPos] = fld('pos', 'Посада', 'Лікар-терапевт', {list:'posList'});
  const [lVid, iVid] = fld('vidd', 'Відділення', 'Терапевтичне відділення № 2');
  const [lZoz, iZoz] = fld('zoz', 'Заклад охорони здоров’я', 'КНП «…»');
  const spec = h('select', {'aria-label':'Профіль'}, h('option', {value:'ter'}, 'Терапія та суміжні (неврологія, інфекційні, хірургія)'), h('option', {value:'tr'}, 'Травматологія'), h('option', {value:'fam'}, 'Сімейна медицина'));
  spec.value = SPEC;
  const mode = h('div', {class:'seg wseg'}); let md = MODE;
  [['hosp','Стаціонар'],['amb','Амбулаторно']].forEach(([k,l])=>{ const b = h('button', {type:'button', 'aria-pressed':k === md ? 'true' : 'false', onclick:()=>{ md = k; mode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }}, l); mode.append(b); });
  spec.addEventListener('change', ()=>{ if (spec.value === 'fam'){ md = 'amb'; mode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x.textContent === 'Амбулаторно' ? 'true' : 'false')); } });
  const close = () => { dlg.remove(); try{ localStorage.setItem('po.welcome', '1'); }catch(e){} };
  const done = () => {
    [['doc', iDoc], ['pos', iPos], ['vidd', iVid], ['zoz', iZoz]].forEach(([k, e])=>{ const t = document.getElementById('meta_' + k); if (t && e.value.trim()){ t.value = e.value.trim(); t.dispatchEvent(new Event('input')); } });
    const ss = document.getElementById('set_spec'); if (ss && ss.value !== spec.value){ ss.value = spec.value; ss.dispatchEvent(new Event('change')); }
    if (md !== MODE){ const mb = document.querySelector(`#modeSeg [data-mode="${md}"]`); if (mb) mb.click(); }
    close(); show(startTab()); toast('Збережено. Змінити й додати решту (завідувач, адреса, ЄДРПОУ, логотип) — у «Налаштуваннях»', 4500);
  };
  const dlg = h('div', {class:'navsheet packsheet welcome', role:'dialog', 'aria-modal':'true', 'aria-label':'Знайомство'},
    h('div', {class:'nvbox'},
      h('h3', {}, 'Вітаю! Кілька даних — один раз'),
      h('p', {class:'chips-hint'}, 'Вони підставлятимуться в шапку й підписи всіх документів і зберігаються лише в цьому браузері. Усе можна змінити пізніше в «Налаштуваннях».'),
      h('div', {class:'wgrid'}, lDoc, lPos, lVid, lZoz, h('label', {class:'wl'}, 'Профіль роботи', spec), h('div', {class:'wl'}, h('span', {}, 'Працюю переважно'), mode)),
      h('div', {class:'acts2', style:'margin-top:14px'}, h('button', {type:'button', class:'btn primary', onclick:done}, 'Готово'),
        h('button', {type:'button', class:'more', onclick:close}, 'Пропустити — заповню пізніше'))));
  document.body.append(dlg); setTimeout(()=>iDoc.focus(), 50);
}
setTimeout(()=>welcomeDialog(false), 300);
