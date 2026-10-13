// Synchronization queue foundation
// Stores future encrypted packages waiting for transfer.

const SyncQueue = (() => {
  const KEY = 'po.sync.queue';

  function load(){
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch(e){
      return [];
    }
  }

  function save(queue){
    localStorage.setItem(KEY, JSON.stringify(queue));
  }

  function add(item){
    const queue = load();
    const packet = Object.assign({
      id: crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status: 'pending',
      created_at: new Date().toISOString()
    }, item || {});
    queue.push(packet);
    save(queue);
    return packet;
  }

  function getPending(){
    return load().filter(x => x.status === 'pending');
  }

  return { add, getPending, load };
})();
