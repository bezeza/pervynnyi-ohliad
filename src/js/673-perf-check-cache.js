/* 0.9.3.86 — одна перевірка повноти на цикл оновлення.
   renderCheck, copyPeekRender і progressRequired читають той самий результат checkDoc().
   Поза update() кеш не діє: окремі перевірки завжди бачать актуальні поля. */
const PO18_CHECK_CACHE = {depth:0, result:null, executions:0, enabled:true};
{
  const checkDoc0 = checkDoc;
  checkDoc = function(){
    if (PO18_CHECK_CACHE.enabled && PO18_CHECK_CACHE.depth && PO18_CHECK_CACHE.result !== null) return PO18_CHECK_CACHE.result;
    const result = checkDoc0.apply(this, arguments);
    if (PO18_CHECK_CACHE.depth){
      PO18_CHECK_CACHE.executions++;
      if (PO18_CHECK_CACHE.enabled) PO18_CHECK_CACHE.result = result;
    }
    return result;
  };
}
{
  const update0 = update;
  update = function(){
    const nested = PO18_CHECK_CACHE.depth > 0;
    PO18_CHECK_CACHE.result = null;
    PO18_CHECK_CACHE.depth++;
    try{ return update0.apply(this, arguments); }
    finally{
      PO18_CHECK_CACHE.depth--;
      if (!PO18_CHECK_CACHE.depth || nested) PO18_CHECK_CACHE.result = null;
    }
  };
}
