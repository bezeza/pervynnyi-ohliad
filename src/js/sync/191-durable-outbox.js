/*
 Durable Outbox foundation using IndexedDB.
 Transport independent. Keeps pending sync changes after restart.
*/
(function(){
  const DB_NAME='po-sync-db';
  const STORE='sync_outbox';
  let dbPromise;

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=e=>{
        const db=e.target.result;
        if(!db.objectStoreNames.contains(STORE)){
          db.createObjectStore(STORE,{keyPath:'outbox_id'});
        }
      };
      req.onsuccess=e=>resolve(e.target.result);
      req.onerror=e=>reject(e.target.error);
    });
    return dbPromise;
  }

  async function add(item){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(item);
      tx.oncomplete=()=>resolve(item);
      tx.onerror=()=>reject(tx.error);
    });
  }

  async function list(){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  window.PODurableOutbox={openDB,add,list};
})();
