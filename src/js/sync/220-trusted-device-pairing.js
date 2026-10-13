/*
 Trusted device pairing foundation.
 No network transport. Stores local trust metadata only.
*/
(function(){
  function createDeviceIdentity(){
    return {
      device_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      created_at:new Date().toISOString(),
      trusted:false
    };
  }

  function pairDevice(localDevice, remoteInfo){
    return {
      device_id: remoteInfo.device_id,
      name: remoteInfo.name || 'unknown device',
      trusted:true,
      paired_at:new Date().toISOString(),
      local_device:localDevice.device_id
    };
  }

  function revokeDevice(device){
    return {
      ...device,
      trusted:false,
      revoked_at:new Date().toISOString()
    };
  }

  window.POSyncTrustedDevices={
    createDeviceIdentity,
    pairDevice,
    revokeDevice
  };
})();
