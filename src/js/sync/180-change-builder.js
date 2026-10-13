/*
 Change Builder foundation for Sync Core.
 Creates transport-independent change descriptions.
 Does not write to patient DB.
*/
(function(){
  function now(){ return new Date().toISOString(); }

  function createChange({entity_id,operation,field,before,after,meta={}}){
    return {
      change_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      entity:'patient',
      entity_id,
      operation,
      field:field || null,
      before: before === undefined ? null : before,
      after: after === undefined ? null : after,
      created_at:now(),
      revision:meta.revision || null,
      device_id:meta.device_id || null,
      profile_id:meta.profile_id || null
    };
  }

  function createUpdate(entity_id,field,before,after,meta={}){
    return createChange({
      entity_id,
      operation:'update',
      field,
      before,
      after,
      meta
    });
  }

  function createDelete(entity_id,meta={}){
    return createChange({
      entity_id,
      operation:'delete',
      meta
    });
  }

  window.POSyncChangeBuilder={
    createChange,
    createUpdate,
    createDelete
  };
})();
