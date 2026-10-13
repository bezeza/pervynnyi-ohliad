// Profile finalizer
// Completes profile creation after the existing welcome flow finishes.

(function(){
  function finalizeProfile(){
    if (typeof ProfileInit === 'undefined' || !ProfileInit.captureCurrentProfile) return null;
    return ProfileInit.captureCurrentProfile();
  }

  window.addEventListener('storage', function(e){
    if (e.key === 'po.welcome' && e.newValue === '1') {
      finalizeProfile();
    }
  });

  window.ProfileFinalizer = { finalizeProfile };
})();
