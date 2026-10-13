// Profile bridge integration layer
// Connects existing welcome flow with future profile synchronization.

(function(){
  function saveProfileFromWelcome(data){
    if (typeof ProfileStore === 'undefined') return null;
    return ProfileStore.save({
      doctor_name: data.doc || '',
      specialty: data.spec || '',
      clinic: data.zoz || ''
    });
  }

  window.ProfileBridge = {
    saveProfileFromWelcome
  };
})();
