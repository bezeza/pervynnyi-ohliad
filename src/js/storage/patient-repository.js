// Patient repository operations
// Provides a controlled access layer for patient records.

const PatientRepository = (() => {
  function create(data){
    if (typeof PatientStore === 'undefined') return null;
    return PatientStore.add(data || {});
  }

  function list(){
    if (typeof PatientStore === 'undefined') return [];
    return PatientStore.all();
  }

  function findById(id){
    return list().find(patient => patient.patient_id === id) || null;
  }

  return { create, list, findById };
})();
