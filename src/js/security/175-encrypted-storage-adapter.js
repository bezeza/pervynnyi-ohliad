/* Encrypted storage adapter foundation.
   Keeps crypto layer separated from existing patient DB.
   Does not replace existing storage yet.
*/
(function(){
  async function encodeForStorage(key, record){
    return POCryptoStorage.encryptObject(key, record);
  }

  async function decodeFromStorage(key, payload){
    return POCryptoStorage.decryptObject(key, payload);
  }

  function isEncryptedRecord(record){
    return !!(record && record.iv && record.data);
  }

  window.POEncryptedStorageAdapter={
    encodeForStorage,
    decodeFromStorage,
    isEncryptedRecord
  };
})();
