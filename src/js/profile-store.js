// Profile foundation for multi-device synchronization
// Stores doctor profile metadata locally. Future versions will move this into encrypted vault.

const ProfileStore = (() => {
  const KEY = 'po.profile';

  function createId() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'profile-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function save(profile) {
    const value = {
      profile_id: profile.profile_id || createId(),
      doctor_name: profile.doctor_name || '',
      specialty: profile.specialty || '',
      clinic: profile.clinic || '',
      created_at: profile.created_at || new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify(value));
    return value;
  }

  function exists() {
    return !!get();
  }

  return { get, save, exists, createId };
})();
