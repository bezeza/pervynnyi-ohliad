/*
 Encrypted patient storage adapter foundation.
 Does not replace existing patient DB.
 Provides a safe integration point for future migration.
*/
(function(){
  async function prepareForWrite(key, patientRecord){
    return {
      storageVersion:2,
      encrypted:true,
      payload: await POEncryptedStorageAdapter.encodeForStorage(key, patientRecord)
    };
  }

  async function restoreFromRead(key, storedRecord){
    if(!storedRecord) return null;

    if(storedRecord.encrypted && storedRecord.payload){
      return POEncryptedStorageAdapter.decodeFromStorage(key, storedRecord.payload);
    }

    // Backward compatibility with existing plaintext records.
    return storedRecord;
  }

  window.POPatientSecureStorage={
    prepareForWrite,
    restoreFromRead
  };
})();
