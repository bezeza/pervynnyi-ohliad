// Patient controller adapter
// Connects UI actions with repository layer without changing existing forms.

const PatientController = (() => {
  function createPatient(data){
    if (typeof PatientRepository === 'undefined') return null;
    return PatientRepository.create(data || {});
  }

  function getPatients(){
    if (typeof PatientRepository === 'undefined') return [];
    return PatientRepository.list();
  }

  return {
    createPatient,
    getPatients
  };
})();
