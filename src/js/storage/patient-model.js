// Patient model foundation
// Defines a common structure for future database and sync.

const PatientModel = {
  create(data = {}) {
    return {
      patient_id: data.patient_id || (crypto && crypto.randomUUID ? crypto.randomUUID() : 'patient-' + Date.now()),
      profile_id: data.profile_id || null,
      full_name: data.full_name || '',
      birth_date: data.birth_date || '',
      contacts: data.contacts || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
