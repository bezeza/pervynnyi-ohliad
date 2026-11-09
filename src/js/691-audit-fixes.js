/* ===== 0.9.3.97 — знахідки аудиту задачі 18, що лишились після 0.10 =====
   1. «Профіль»: одне натискання відкривало і маленьке меню, і велике вікно; маленьке меню, де лише одна кнопка, — зайвий крок.
      Курсор тепер переходить у вікно, Escape закриває, курсор повертається на кнопку.
   2. Список розділів для екранного читача: «Інші системи» й «Бланки для друку» всередині списку вкладок мають роль вкладки.
   3. «Друк» у шапці (новий вигляд, ПК): друк поточного документа з будь-якого розділу, без відкриття панелі «Текст». */
{ const b = document.getElementById('profBtn');
  if (b) b.addEventListener('click', e=>{
    if (!(stOnS() && window.innerWidth >= 900)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const modeRow = $('#modeSeg') && !(PROF && (PROF.w === 'hosp' || PROF.w === 'amb'));
    if (modeRow) profPop(); else profileDialog(false);
  }, true); }
{ const p0 = profPop; profPop = function(){ const back = document.activeElement, r = p0.apply(this, arguments); const box = document.getElementById('profPop');
    if (box){ const f = box.querySelector('button'); if (f) f.focus();
      box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); box.remove(); try{ (back && back.isConnected ? back : document.getElementById('profBtn')).focus(); }catch(x){} } }); }
    return r; }; }
{ const d0 = profileDialog; profileDialog = function(){ const back = document.activeElement, had = !!document.querySelector('.profdlg'); const r = d0.apply(this, arguments);
    const dlg = document.querySelector('.profdlg');
    if (dlg && !had){
      const f = dlg.querySelector('.pcard[aria-pressed="true"], .pcard.on, button'); if (f) try{ f.focus({preventScroll:true}); }catch(x){}
      const ob = new MutationObserver(()=>{ if (!dlg.isConnected){ ob.disconnect(); try{ const t = back && back.isConnected && back !== document.body ? back : document.getElementById('profBtn'); if (t) t.focus({preventScroll:true}); }catch(x){} } });
      ob.observe(document.body, {childList:true});
    }
    return r; }; }
/* у списку вкладок (role=tablist) кожна кнопка має бути вкладкою — інакше програма для незрячих бачить «зламаний» список */
function v2TabRoles(){ document.querySelectorAll('#tabs button').forEach(e=>{ if (e.getAttribute('role') !== 'tab'){ e.setAttribute('role', 'tab'); if (!e.hasAttribute('aria-selected')) e.setAttribute('aria-selected', 'false'); } }); }
try{ v2TabRoles(); const t = document.getElementById('tabs'); if (t) new MutationObserver(v2TabRoles).observe(t, {childList:true, subtree:true}); }catch(e){}
{ const pb = h('button', {type:'button', class:'btn v2print', id:'v2printBtn', title:'Друк поточного документа або «Зберегти як PDF»', 'aria-label':'Друк документа'}, 'Друк');
  pb.addEventListener('click', ()=>{ const b = document.getElementById('printBtn'); if (b) b.click(); else if (typeof doPrint === 'function') doPrint(); });
  const tb = document.getElementById('txtBtn'); if (tb && tb.parentElement) tb.after(pb); }
{ const x0 = blanksNav; blanksNav = function(){ const r = x0.apply(this, arguments); try{ v2TabRoles(); }catch(e){} return r; }; }
{ const x0 = layoutTabs; layoutTabs = function(){ const r = x0.apply(this, arguments); try{ v2TabRoles(); }catch(e){} return r; }; }
