/* PIN lock foundation. Stores verifier metadata only, never plaintext PIN. */
(function(){
  const NS='po.pin';

  function bufToHex(buffer){
    return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  function randomSalt(){
    const a=new Uint8Array(16);
    crypto.getRandomValues(a);
    return bufToHex(a);
  }

  async function derivePinHash(pin,salt){
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey(
      'raw',enc.encode(pin),
      {name:'PBKDF2'},false,['deriveBits']
    );
    const bits=await crypto.subtle.deriveBits(
      {name:'PBKDF2',salt:enc.encode(salt),iterations:120000,hash:'SHA-256'},
      key,256
    );
    return bufToHex(bits);
  }

  async function setPin(pin){
    const salt=randomSalt();
    const hash=await derivePinHash(pin,salt);
    localStorage.setItem(NS+'.meta',JSON.stringify({salt,hash}));
  }

  async function verifyPin(pin){
    const meta=JSON.parse(localStorage.getItem(NS+'.meta')||'null');
    if(!meta)return false;
    return (await derivePinHash(pin,meta.salt))===meta.hash;
  }

  window.POPinLock={setPin,verifyPin};
})();
