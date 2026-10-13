/*
 Patient versioning foundation for future Sync Core integration.
 Does not modify existing patient database.
*/
(function(){
  function now(){ return new Date().toISOString(); }

  function ensureVersionMeta(record, context={}){
    const existing=record._sync || {};

    return {
      ...record,
      _sync:{
        revision: existing.revision || 1,
        device_id: existing.device_id || context.device_id || null,
        profile_id: existing.profile_id || context.profile_id || null,
        created_at: existing.created_at || now(),
        updated_at: now(),
        tombstone: existing.tombstone || false
      }
    };
  }

  function nextRevision(record){
    return {
      ...record,
      _sync:{
        ...(record._sync||{}),
        revision:((record._sync&&record._sync.revision)||0)+1,
        updated_at:now()
      }
    };
  }

  function createTombstone(id,meta={}){
    return {
      id,
      _sync:{
        revision:meta.revision||1,
        device_id:meta.device_id||null,
        profile_id:meta.profile_id||null,
        updated_at:now(),
        tombstone:true
      }
    };
  }

  window.POPatientVersioning={
    ensureVersionMeta,
    nextRevision,
    createTombstone
  };
})();
