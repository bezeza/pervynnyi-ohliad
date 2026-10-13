/*
 Conflict resolver foundation for Sync Core.
 Conflicts are queued for review, never silently overwritten.
*/
(function(){
  function createConflict({entity_id,field,local,remote,meta={}}){
    return {
      conflict_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      entity:'patient',
      entity_id,
      field,
      local,
      remote,
      local_revision:meta.local_revision || null,
      remote_revision:meta.remote_revision || null,
      created_at:new Date().toISOString(),
      status:'pending_review'
    };
  }

  function canAutoApply(localRevision,remoteRevision){
    return localRevision !== null && localRevision===remoteRevision;
  }

  window.POSyncConflictResolver={
    createConflict,
    canAutoApply
  };
})();
