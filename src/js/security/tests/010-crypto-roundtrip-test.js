/* Crypto roundtrip test scaffold. Uses synthetic data only. */
(function(){
  async function runCryptoRoundtripTest(){
    const key=await crypto.subtle.generateKey(
      {name:'AES-GCM',length:256},true,['encrypt','decrypt']
    );

    const source={
      id:'TEST-PATIENT',
      diagnosis:'Synthetic test record'
    };

    const encrypted=await POCryptoStorage.encryptObject(key,source);
    const restored=await POCryptoStorage.decryptObject(key,encrypted);

    return JSON.stringify(source)===JSON.stringify(restored);
  }

  window.POCryptoTests={runCryptoRoundtripTest};
})();
