/*
 Sync Package Adapter foundation.
 Prepares changes for Sync Core packages.
 No transport, network or cloud logic.
*/
(function(){
  function createPackage(changes, meta={}){
    return {
      package_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      format_version:1,
      created_at:new Date().toISOString(),
      sender:{
        device_id:meta.device_id || null,
        profile_id:meta.profile_id || null
      },
      changes:Array.isArray(changes)?changes:[],
      status:'created'
    };
  }

  function validatePackage(pkg){
    return !!(
      pkg &&
      pkg.package_id &&
      pkg.format_version &&
      Array.isArray(pkg.changes)
    );
  }

  window.POSyncPackageAdapter={
    createPackage,
    validatePackage
  };
})();
