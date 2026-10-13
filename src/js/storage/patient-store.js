// Patient storage foundation
// Prepares patient records for profile ownership and future sync.

const PatientStore = (() => {
  const KEY = 'po.patients';

  function createId(){
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'patient-' + Date.now();
  }

  function load(){
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch(e){
      return [];
    }
  }

  function save(list){
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function add(patient){
    const list = load();
    const item = Object.assign({
      patient_id: createId(),
      profile_id: null,
      created_at: new Date().toISOString()
    }, patient || {});

    list.push(item);
    save(list);
    return item;
  }

  function all(){
    return load();
  }

  return { add, all };
})();
