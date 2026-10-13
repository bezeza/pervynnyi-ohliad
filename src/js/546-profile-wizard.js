// First run profile wizard foundation
// UI integration will be added carefully without changing medical forms.

const ProfileWizard = (() => {
  function needsSetup() {
    return typeof ProfileStore !== 'undefined' && !ProfileStore.exists();
  }

  function setup(profile) {
    if (typeof ProfileStore === 'undefined') return null;
    return ProfileStore.save(profile || {});
  }

  function open() {
    // Placeholder: future UI dialog for first launch.
    // Keeps current application flow unchanged.
    return needsSetup();
  }

  return { needsSetup, setup, open };
})();
