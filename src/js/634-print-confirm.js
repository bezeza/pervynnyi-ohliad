/* 0.9.3.49 — явне підтвердження лікаря безпосередньо перед системним друком.
   Це локальна дія в журналі, не електронний підпис і не доказ незмінності документа. */
{
  const print0 = window.print;
  if (typeof print0 === 'function') window.print = function(){
    const title = typeof DOCN === 'function' ? DOCN(DOC) : (typeof docTitle === 'function' ? docTitle() : 'документ');
    const doctor = typeof mv === 'function' ? String(mv('doc') || '').trim() : '';
    const details = [
      'Перед друком перевірте дані пацієнта та весь зміст документа.',
      `Підтверджуєте, що переглянули «${title}»${doctor ? `, лікар: ${doctor}` : ''}, і погоджуєте його друк?`,
      'Це внутрішнє підтвердження; воно не є електронним підписом.'
    ].join('\n\n');
    if (!window.confirm(details)) return;
    try{ if (typeof logAct === 'function') logAct('Підтвердження перед друком', title); }catch(e){}
    return print0.apply(this, arguments);
  };
}
