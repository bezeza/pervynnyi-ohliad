/* Storage compatibility test scaffold. Synthetic data only. */
(function(){
  async function runStorageCompatibilityTest(key){
    const legacyRecord={
      id:'LEGACY-TEST',
      diagnosis:'old plaintext record'
    };

    const encrypted=await POEncryptedStorageAdapter.encodeForStorage(key,legacyRecord);
    const encryptedDetected=POEncryptedStorageAdapter.isEncryptedRecord(encrypted);
    const restored=await POEncryptedStorageAdapter.decodeFromStorage(key,encrypted);

    return {
      encryptedDetected,
      restored,
      passed: encryptedDetected && JSON.stringify(restored)===JSON.stringify(legacyRecord)
    };
  }

  window.POStorageTests={runStorageCompatibilityTest};
})();
