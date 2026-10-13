/* Session layer foundation. Runtime-only unlocked state. */
(function(){
  let session=null;

  function openSession(value){
    session=value;
  }

  function closeSession(){
    session=null;
  }

  function isOpen(){
    return !!session;
  }

  function getSession(){
    return session;
  }

  window.POSession={openSession,closeSession,isOpen,getSession};
})();
