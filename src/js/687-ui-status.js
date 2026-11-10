/* ===== 0.10, етап 4: рядок стану внизу, «Збережено ✓», один показник заповнення (лише новий вигляд, широкий екран) =====
   «Збережено ✓» — у картці пацієнта.
   Рядок стану: пацієнт · день · що не заповнено (клік — до розділу) · нагадування про резервну копію.
   Показник заповнення лишається один — кружки біля розділів; смужку «Заповнено N з M» сховано стилями. */
const V2ST = {bar:null, saved:null, raf:0, state:''};
function v2stSeq(){ try{ return tabOrder().filter(i=>!TOOL_TABS.includes(TABS[i].id) && TABS[i] !== HV && TABS[i] !== META); }catch(e){ return []; } }
function v2stName(i){ const t = TABS[i]; return t.title || t.short || (t.tab ? t.tab.textContent.trim() : ''); }
function v2stDay(){ try{ const n = typeof stayDay === 'function' ? stayDay() : 0; return n ? n + (MODE === 'amb' ? '-й день лікування' : '-й день') : ''; }catch(e){ return ''; } }
function v2stDraw(){
  V2ST.raf = 0;
  let on = document.documentElement.classList.contains('ui-v2');
  if (!V2ST.bar) return;
  const pib = mv('pib'); if (on && !pib && !PID) on = false;   // стартовий екран без пацієнта — рядок стану не потрібен (0.9.3.97)
  V2ST.bar.hidden = !on; document.body.classList.toggle('v2-stat', on);
  if (!on){ V2ST.state = ''; return; }
  const seq = v2stSeq(), miss = seq.filter(i=>!TABS[i].tab.classList.contains('filled'));
  let bk = null; try{ bk = backupInfo(); }catch(e){}
  const key = [pib, v2stDay(), DOC, miss.join(','), seq.length, bk && bk.due, bk && bk.days].join('|');
  if (key === V2ST.state) return; V2ST.state = key;
  const b = V2ST.bar; b.innerHTML = '';
  const who = h('span', {class:'st-who'}, h('b', {}, pib || 'Пацієнт без ПІБ'));
  const d = v2stDay(); if (d) who.append(h('span', {}, ' · ' + d));
  b.append(who);
  const m = h('span', {class:'st-miss'});
  if (!seq.length) m.append('');
  else if (!miss.length) m.append(h('span', {class:'st-ok'}, 'Усі розділи заповнено'));
  else {
    m.append(h('span', {class:'st-l'}, 'Не заповнено:'));
    miss.slice(0, 4).forEach(i=>m.append(h('button', {type:'button', class:'st-go', title:'Перейти до розділу', onclick:()=>show(i)}, v2stName(i))));
    if (miss.length > 4) m.append(h('span', {class:'st-more', title:miss.slice(4).map(v2stName).join(', ')}, '+' + (miss.length - 4)));
  }
  b.append(m);
  if (bk && bk.due){
    b.append(h('span', {class:'st-bk'}, h('span', {}, bk.t ? `Резервна копія: ${bk.days} дн. тому` : 'Резервної копії ще немає'),
      h('button', {type:'button', class:'st-go', onclick:()=>{ exportAll(); v2stLater(); }}, 'Зберегти у файл')));
  }
}
function v2stLater(){ if (!V2ST.raf) V2ST.raf = requestAnimationFrame(v2stDraw); }
/* «Збережено ✓» — у картці пацієнта (вона завжди на екрані, на відміну від шапки, що гортається) */
function v2stSaved(s){
  const e = V2ST.saved; if (!e) return;
  const has = !!(PID || mv('pib'));
  e.hidden = !has || !s;
  e.classList.toggle('bad', s === 'bad'); e.classList.toggle('wait', s === 'wait');
  e.textContent = s === 'bad' ? '⚠ Не збережено' : s === 'wait' ? 'Зберігається…' : 'Збережено ✓';
  e.title = s === 'ok' ? 'Пацієнта збережено в ' + new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'}) : s === 'bad' ? 'Браузер не дав зберегти — збережіть копію у файл' : '';
}
{
  V2ST.bar = h('div', {id:'v2stat', class:'v2stat', role:'status', 'aria-live':'off', hidden:''});
  document.body.append(V2ST.bar);
  V2ST.saved = h('span', {id:'v2saved', class:'v2saved', role:'status', hidden:''});
  const v2stPlace = () => { const b = $('#ptbar .pt1'); if (b && V2ST.saved.parentElement !== b.parentElement) b.parentElement.append(V2ST.saved); };
  v2stPlace(); { const rp0 = renderPtBar; renderPtBar = function(){ const r = rp0.apply(this, arguments); v2stPlace(); return r; }; }
  const ms0 = markSaved; markSaved = function(ok){ const r = ms0.apply(this, arguments); v2stSaved(ok ? 'ok' : 'bad'); v2stLater(); return r; };
  const as0 = autosave; autosave = function(){ const r = as0.apply(this, arguments); if (!RESTORING && (PID || mv('pib'))) v2stSaved('wait'); return r; };
  const np0 = newPatient; newPatient = function(){ const r = np0.apply(this, arguments); v2stSaved(''); v2stLater(); return r; };
  onUpdate('687-ui-status', ()=>{ v2stLater(); });
  const sd0 = switchDoc; switchDoc = function(){ const r = sd0.apply(this, arguments); v2stLater(); return r; };
  const ua0 = uiV2Apply; uiV2Apply = function(){ const r = ua0.apply(this, arguments); V2ST.state = ''; v2stLater(); return r; };
  v2stDraw();
}
