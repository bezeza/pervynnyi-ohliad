/* Crypto foundation: local key management placeholder. No patient data migration. */
(function(){
  const NS='po.crypto';
  function getKeyMeta(){
    try{return JSON.parse(localStorage.getItem(NS+'.meta')||'null')}catch(e){return null}
  }
  function setKeyMeta(v){localStorage.setItem(NS+'.meta',JSON.stringify(v))}
  async function generateKey(){
    return crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  }
  window.POCryptoKeys={getKeyMeta,setKeyMeta,generateKey};
})();
