// Vault foundation layer
// Storage abstraction before full encryption implementation.

const Vault = (() => {
  const KEY = 'po.vault.state';

  function isInitialized(){
    try {
      return localStorage.getItem(KEY) === '1';
    } catch(e){
      return false;
    }
  }

  function initialize(){
    localStorage.setItem(KEY, '1');
    return true;
  }

  return {
    isInitialized,
    initialize
  };
})();
