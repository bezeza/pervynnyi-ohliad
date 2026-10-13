// Patient form adapter
// Connects existing UI with patient controller without changing the form.

const PatientFormAdapter = (() => {
  function saveFromForm(data){
    if (typeof PatientController === 'undefined') return null;
    return PatientController.createPatient(data || {});
  }

  function loadPatients(){
    if (typeof PatientController === 'undefined') return [];
    return PatientController.getPatients();
  }

  return { saveFromForm, loadPatients };
})();
