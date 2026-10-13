// Profile initialization hook
// Keeps existing welcome form unchanged and connects it to profile storage.

(function(){
  function initProfileFromCurrentData(){
    if (typeof ProfileStore === 'undefined') return null;

    const data = {
      doctor_name: (window.mv && mv('doc')) || '',
      specialty: window.SPEC || '',
      clinic: (window.mv && mv('zoz')) || ''
    };

    if (!data.doctor_name && !data.clinic) return null;
    return ProfileStore.save(data);
  }

  window.ProfileInit = {
    initProfileFromCurrentData
  };
})();
