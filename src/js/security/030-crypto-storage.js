/* Encrypted storage adapter foundation. Keeps storage separate from existing patient DB. */
(function(){
  const encoder=new TextEncoder();

  function toBytes(v){return encoder.encode(JSON.stringify(v));}
  function fromBytes(v){return JSON.parse(new TextDecoder().decode(v));}

  async function encryptObject(key,obj){
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,toBytes(obj));
    return {iv:Array.from(iv),data:Array.from(new Uint8Array(data))};
  }

  async function decryptObject(key,payload){
    const data=await crypto.subtle.decrypt(
      {name:'AES-GCM',iv:new Uint8Array(payload.iv)},
      key,
      new Uint8Array(payload.data)
    );
    return fromBytes(data);
  }

  window.POCryptoStorage={encryptObject,decryptObject};
})();
