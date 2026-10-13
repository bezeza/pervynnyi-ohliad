// Automatic profile capture hook
// Keeps existing welcome form unchanged and captures profile after initialization.

(function(){
  window.ProfileInit = window.ProfileInit || {};

  ProfileInit.captureCurrentProfile = function(){
    if (typeof ProfileStore === 'undefined') return null;

    const data = {
      doctor_name: (typeof mv === 'function' && mv('doc')) || '',
      specialty: (typeof SPEC !== 'undefined' && SPEC) || '',
      clinic: (typeof mv === 'function' && mv('zoz')) || ''
    };

    return ProfileStore.save(data);
  };
})();
