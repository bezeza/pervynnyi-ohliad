/* ===== 0.9.3.57 — телефон: вкладки внизу за етапами роботи + стрічка розділів угорі =====
   Внизу: «Пацієнт · Анамнез · Огляд · Висновок» (групи — ті самі, що в бічному меню на комп’ютері; у щоденнику
   й інших документах — свої) і «Текст» (текст документа, перевірка, друк, «Копіювати»; на значку — кількість зауважень).
   Угорі: стрічка розділів поточної групи з крапками стану, гортається пальцем; поруч 🧪 (журнал обстежень) і «⋯» — «Документ і дії».
   У щоденнику внизу ще «📓 Записати» (у журнал).
   «Далі: …» у кінці розділу лишається. Повернутись до старої навігації — «Вигляд» → «Навігація» → «Як раніше». */
const PHT = { last:{} };
/* у режимі «однією сторінкою» перехід сам прокручує до розділу; у вкладках — на початок розділу */
const phtTop = () => { if (!document.body.classList.contains('onepage')) window.scrollTo({top:0}); };
const PHT_ICON = {'Пацієнт':'👤', 'Анамнез':'💬', 'Огляд':'🩺', 'Висновок':'📋', 'Документ':'📝'};
const phtOn = () => isPhone() && (typeof PHV === 'undefined' || PHV.nav !== 'old');
function phtGroups(){
  const L = [];
  tabOrder().forEach(i=>{ const t = TABS[i]; if (!t || !t.tab || t.tab.hidden || TOOL_TABS.includes(t.id)) return;
    const g = tabGroupLabel(i) || 'Документ'; let x = L.find(y=>y.l === g); if (!x){ x = {l:g, idx:[]}; L.push(x); } x.idx.push(i); });
  return L;
}
function phtGroupOf(i){ const t = TABS[i]; return t && TOOL_TABS.includes(t.id) ? '' : tabGroupLabel(i) || 'Документ'; }
const PHT_BAR = h('nav', {class:'phtabs', 'aria-label':'Етапи заповнення'});
document.body.append(PHT_BAR);
function phtRemarks(){ const m = (($('#copy2') || {}).textContent || '').match(/\d+/); return m ? m[0] : ''; }
function phtRenderBar(){
  const on = phtOn(); document.body.classList.toggle('pht', on); PHT_BAR.hidden = !on; if (!on) return;
  const G = phtGroups(), curG = phtGroupOf(active), open = $('#outBox') && $('#outBox').classList.contains('open');
  PHT_BAR.replaceChildren(...G.map(g=>h('button', {type:'button', class:'pht-b', 'aria-current':!open && g.l === curG ? 'page' : null,
      onclick:()=>{ $('#outBox').classList.remove('open'); const i = PHT.last[g.l]; show(g.idx.includes(i) ? i : g.idx[0]); phtTop(); }},
      h('span', {class:'pht-i', 'aria-hidden':'true'}, PHT_ICON[g.l] || g.l[0]), h('span', {class:'pht-l'}, g.l))),
    DOC === 'shch' ? h('button', {type:'button', class:'pht-b pht-save', onclick:()=>{ try{ saveDiary(); }catch(e){} }},
      h('span', {class:'pht-i', 'aria-hidden':'true'}, '📓'), h('span', {class:'pht-l'}, 'Записати')) : '',
    h('button', {type:'button', class:'pht-b pht-doc', 'aria-current':open ? 'page' : null, onclick:()=>{ $('#outBox').classList.add('open'); phtRenderBar(); }},
      h('span', {class:'pht-i', 'aria-hidden':'true'}, '📄'), h('span', {class:'pht-l'}, 'Текст'),
      phtRemarks() ? h('span', {class:'pht-n', 'aria-label':'зауважень: ' + phtRemarks()}, phtRemarks()) : ''));
}
function phtRenderStrip(){
  const tn = $('#tabnav'); if (!tn) return;
  if (!phtOn()){ tn.classList.remove('pht-strip'); return; }
  const g = phtGroups().find(x=>x.l === phtGroupOf(active)), idx = g ? g.idx : [active];
  if (TABS[active] && !TOOL_TABS.includes(TABS[active].id)) PHT.last[phtGroupOf(active)] = active;
  tn.classList.add('pht-strip'); tn.replaceChildren();
  const strip = h('div', {class:'pht-chips', role:'tablist', 'aria-label':g ? g.l : 'Розділи'});
  idx.forEach(i=>{ const t = TABS[i], st = ['filled','cw','autof'].filter(c=>t.tab.classList.contains(c)).join(' ');
    strip.append(h('button', {type:'button', class:'pht-c ' + st, role:'tab', 'aria-selected':i === active ? 'true' : 'false', onclick:()=>{ show(i); phtTop(); }},
      h('span', {class:'pht-d', 'aria-hidden':'true'}), t.short || t.title)); });
  const extra = h('div', {class:'pht-x'},
    h('button', {type:'button', class:'btn pht-e', 'aria-label':'Журнал обстежень', title:'Журнал обстежень', onclick:()=>{ try{ labsOpen(); }catch(e){} }}, '🧪'),
    h('button', {type:'button', class:'btn pht-e pht-doc-b', 'aria-label':'Документ і дії: ' + docShort(DOC), title:'Документ і дії', onclick:()=>{ try{ openActs(); }catch(e){} }}, docShort(DOC) + ' ⋯'));
  tn.append(strip, extra);
  const a = strip.querySelector('[aria-selected="true"]'); if (a) try{ a.scrollIntoView({block:'nearest', inline:'center'}); }catch(e){}
}
{ const x0 = renderTabNav; renderTabNav = function(){ const r = x0.apply(this, arguments); try{ phtRenderStrip(); phtRenderBar(); }catch(e){} return r; }; }
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); try{ phtRenderBar(); }catch(e){} return r; }; }
/* «Закрити» текст документа — оновити нижню панель */
new MutationObserver(()=>{ try{ phtRenderBar(); }catch(e){} }).observe($('#outBox'), {attributes:true, attributeFilter:['class']});
if (window.matchMedia) matchMedia('(max-width:899px)').addEventListener('change', ()=>{ try{ renderTabNav(); }catch(e){} });
/* перемикач у «Вигляд» на телефоні */
{ const x0 = viewCtl; viewCtl = function(){ const box = x0.apply(this, arguments);
  if (!isPhoneW()) return box;
  const cur = (typeof PHV !== 'undefined' && PHV.nav) || 'tabs';
  const row = h('div', {class:'vrow col'}, h('span', {class:'vl'}, 'Навігація'), h('div', {class:'vseg', role:'group', 'aria-label':'Навігація'},
    ...[['tabs', 'Вкладки внизу'], ['old', 'Як раніше']].map(([k, l])=>h('button', {type:'button', 'aria-pressed':cur === k ? 'true' : 'false', onclick:()=>{ PHV.nav = k; phvSave(); renderTabNav(); renderViewCtl(); }}, l))),
    h('p', {class:'chips-hint vnote'}, 'Вкладки внизу: Пацієнт · Анамнез · Огляд · Висновок · Текст; угорі — розділи вибраної групи.'));
  box.insertBefore(row, box.children[1] || null); return box; }; }
try{ renderTabNav(); }catch(e){}
