/* 0.9.3.134 — дата надходження з первинного огляду: при переході з огляду в щоденник чи епікриз порожня «Дата надходження»
   береться з дати огляду (раніше — лише після збереження пацієнта або «Заповнити епікриз»; день перебування не рахувався). */
{
  const sw0 = switchDoc;
  switchDoc = function(to){
    try{
      if (DOC === 'ohl' && to !== 'ohl' && MODE === 'hosp'){
        const P = F('e_per.per'), dt = String(mv('dt') || '').split('T')[0];
        if (P && P.d1 && !P.d1.value && /^\d{4}-\d{2}-\d{2}$/.test(dt) && val(F('dx.osn'), true)) P.d1.value = dt;   // лише коли огляд справді є (діагноз)
      }
    }catch(e){}
    return sw0.apply(this, arguments);
  };
}
