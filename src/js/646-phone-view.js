/* ===== 0.9.3.57 — «Вигляд» для телефона =====
   Раніше на телефоні «Вигляд» був один («На телефоні вигляд завжди один»), а ноутбук/монітор налаштовувались.
   Тепер на телефоні (до 899 px) у «Вигляд» — свої налаштування; зберігаються лише на цьому пристрої:
   • розмір тексту (той самий масштаб, що й на комп’ютері, але свій для кожного пристрою);
   • щільність: звичайно / компактно (менші відступи — більше на екрані);
   • нижня панель: значки (☰ 🧪 📄 — більше місця для «Копіювати») або підписи;
   • масштаб аркуша «Перед друком» за замовчуванням.
   Плюс: нижня панель більше не обрізає «Копіювати». */
const PHV = Object.assign({dense:'normal', bar:'icons', nav:'tabs'}, (()=>{ try{ return JSON.parse(lsGet('po.phview', '{}')) || {}; }catch(e){ return {}; } })());
function phvSave(){ lsSet('po.phview', JSON.stringify(PHV)); }
function phvApply(){
  const ph = isPhoneW(), r = document.documentElement;
  r.classList.toggle('ph-dense', ph && PHV.dense === 'compact');
  r.classList.toggle('ph-icons', ph && PHV.bar === 'icons');
}
{ const x0 = applyView; applyView = function(){ const r = x0.apply(this, arguments); try{ phvApply(); }catch(e){} return r; }; }
{ const x0 = viewCtl; viewCtl = function(){
  if (!isPhoneW()) return x0.apply(this, arguments);
  const box = h('div', {class:'vctl'});
  const seg = (name, cur, items, fn, hint) => h('div', {class:'vrow col'}, h('span', {class:'vl'}, name), h('div', {class:'vseg', role:'group', 'aria-label':name},
    ...items.map(([k, l])=>h('button', {type:'button', 'aria-pressed':String(cur) === String(k) ? 'true' : 'false', onclick:()=>fn(k)}, l))), hint ? h('p', {class:'chips-hint vnote'}, hint) : '');
  const Z = [0.9, 1, 1.1, 1.2, 1.3];
  box.append(h('p', {class:'chips-hint vnote'}, 'Налаштування телефона — лише для цього пристрою; на комп’ютері свої.'));
  box.append(seg('Розмір тексту', parseFloat(ZOOM) || 1, Z.map(z=>[z, Math.round(z * 100) + ' %']), z=>{ ZOOM = String(z); lsSet('po.zoom', ZOOM); applyZoom(); const s = $('#set_zoom'); if (s) s.value = ZOOM; applyView(); }));
  box.append(seg('Щільність', PHV.dense, [['normal', 'Звичайно'], ['compact', 'Компактно']], k=>{ PHV.dense = k; phvSave(); applyView(); toast(k === 'compact' ? 'Компактно: менші відступи, більше на екрані' : 'Звичайні відступи'); },
    'Компактно — менші відступи між полями й кнопками; на екран вміщується більше.'));
  box.append(seg('Нижня панель', PHV.bar, [['icons', 'Значки'], ['text', 'Підписи']], k=>{ PHV.bar = k; phvSave(); applyView(); }, 'Значки ☰ 🧪 📄 залишають більше місця для «Копіювати».'));
  box.append(seg('Аркуш «Перед друком»', typeof PHP !== 'undefined' ? PHP.k : 2, [[1, 'По ширині'], [1.5, '150 %'], [2, '200 %'], [2.5, '250 %']], k=>{ PHP.k = +k; try{ localStorage.setItem('po.phonez', String(PHP.k)); }catch(e){} try{ if (PAPER) renderPaper(); }catch(e){} renderViewCtl(); },
    'Масштаб також змінюється двома пальцями прямо на аркуші.'));
  return box;
}; }
/* кнопка «Вигляд» у шапці на телефоні — у меню «⋯ Документ і дії» (якщо є) або в «Налаштуваннях» */
phvApply(); try{ renderViewCtl(); }catch(e){}
