/* 0.9.3.101 — епікриз: підписи дат періоду перебування (перенесено з #112).
   Лише підписи у формі; текст документа й бланки не змінюються. */
function epiPeriodLabels(){
  const f = F('e_per.per'); if (!f || !f.d1 || !f.d2 || !f.wrapEl) return;
  const lbl = f.wrapEl.querySelector('.lbl'); const tn = lbl && [...lbl.childNodes].find(x=>x.nodeType === 3 && x.textContent.trim());
  if (tn) tn.textContent = 'Період перебування у стаціонарі';   // значок стану поля лишається
  const u = f.wrapEl.querySelectorAll('.nums > .u');
  if (u[0]) u[0].textContent = 'Поступив/Поступила до стаціонару';
  if (u[1]) u[1].textContent = 'Виписаний/Виписана';
  f.d1.setAttribute('aria-label', 'Дата госпіталізації');
  f.d2.setAttribute('aria-label', 'Дата виписки');
}
try{ epiPeriodLabels(); }catch(e){ console.warn(e); }
