/*
 Outbox adapter foundation for Sync Core.
 Stores pending changes independently from transport.
 No network communication.
*/
(function(){
  const queue=[];

  function enqueue(change){
    const item={
      outbox_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status:'pending',
      created_at:new Date().toISOString(),
      change
    };
    queue.push(item);
    return item;
  }

  function listPending(){
    return queue.filter(x=>x.status==='pending');
  }

  function markSent(id){
    const item=queue.find(x=>x.outbox_id===id);
    if(item) item.status='sent';
  }

  function remove(id){
    const index=queue.findIndex(x=>x.outbox_id===id);
    if(index>=0) queue.splice(index,1);
  }

  window.POSyncOutbox={
    enqueue,
    listPending,
    markSent,
    remove
  };
})();
