/* 0.9.3.43 — локальний ліміт спроб PIN на спільній межі перевірки.
   Стан прив'язаний до точного конверта PIN; це best-effort захист інтерфейсу від перезапуску.
   Власник профілю браузера може змінити localStorage і перевіряти копію конверта офлайн. */
const PIN_GUARD_PREFIX='po.pin.attempt.', PIN_GUARD_QUEUE=new Map(), PIN_GUARD_DELAYS=[30000,300000,1800000];
function pinGuardError(code, until, detail){
  const e=new Error(detail || code); e.pinGate=code; e.pinUntil=until || 0; return e;
}
async function pinGuardTag(cfg){
  const data=new TextEncoder().encode(JSON.stringify(cfg)), hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function pinGuardChecksum(state){
  const data=new TextEncoder().encode([state.v,state.tag,state.failures,state.until,state.reason || ''].join('|'));
  const hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function pinGuardWrite(cfg,tag,state){
  const rec={v:1,tag,failures:state.failures,until:state.until || 0,reason:state.reason || ''};
  rec.sum=await pinGuardChecksum(rec);
  try{ const value=JSON.stringify(rec), key=PIN_GUARD_PREFIX+tag; localStorage.setItem(key,value);
    if (localStorage.getItem(key)!==value) throw new Error('Запис не підтверджено');
  }catch(e){ throw pinGuardError('storage',0,'Не вдалося зберегти ліміт спроб PIN. Перевірте вільне місце у сховищі браузера.'); }
}
async function pinGuardInit(cfg){
  const tag=await pinGuardTag(cfg); await pinGuardWrite(cfg,tag,{failures:0,until:0});
}
async function pinGuardForget(cfg){
  if (!cfg) return; try{ const tag=await pinGuardTag(cfg); localStorage.removeItem(PIN_GUARD_PREFIX+tag); }catch(e){}
}
function pinGuardQueue(tag,fn){
  try{ if (navigator.locks && typeof navigator.locks.request==='function') return navigator.locks.request('po-pin-attempt-'+tag,fn); }catch(e){}
  const prev=PIN_GUARD_QUEUE.get(tag) || Promise.resolve(); let release;
  const next=new Promise(resolve=>{ release=resolve; }); PIN_GUARD_QUEUE.set(tag,next);
  return prev.catch(()=>{}).then(fn).finally(()=>{ release(); if (PIN_GUARD_QUEUE.get(tag)===next) PIN_GUARD_QUEUE.delete(tag); });
}
function pinGuardWaitError(state,now){
  const seconds=Math.max(1,Math.ceil((state.until-now)/1000));
  const reason=state.reason==='edited' ? 'Лічильник спроб PIN змінено або пошкоджено — ' : state.reason==='missing' ? 'Лічильник спроб PIN відсутній — ' : '';
  return pinGuardError('cooldown',state.until,reason+`зачекайте ${seconds} с`);
}
async function pinGuardCheck(pin,cfg,verify,now=Date.now()){
  if (!cfg || typeof pin!=='string' || !pin) throw pinGuardError('empty',0,'Введіть PIN');
  const queueCfg=Object.assign({},cfg); delete queueCfg.guard;
  const queueTag=await pinGuardTag(queueCfg);
  return pinGuardQueue(queueTag,async()=>{
    let tag=await pinGuardTag(cfg);
    const primary=!!PINC.cfg && JSON.stringify(cfg)===JSON.stringify(PINC.cfg); let justMarked=false, raw;
    let migrated=null;
    try{
      if (primary && !cfg.guard){
        const previous=Object.assign({},cfg,{guard:1}), oldTag=await pinGuardTag(previous), oldRaw=localStorage.getItem(PIN_GUARD_PREFIX+oldTag);
        cfg.guard=1; localStorage.setItem('po.pin',JSON.stringify(cfg)); justMarked=true;
        tag=oldTag;
        if (oldRaw){ let saved,sum; try{saved=JSON.parse(oldRaw);sum=await pinGuardChecksum(saved);}catch(e){}
          migrated=saved && saved.v===1 && saved.tag===oldTag && Number.isSafeInteger(saved.failures) && saved.failures>=0 && Number.isFinite(saved.until) && saved.until>=0 && saved.sum===sum
            ? {failures:Math.max(15,saved.failures),until:Math.max(saved.until,now+PIN_GUARD_DELAYS[2]),reason:'edited'}
            : {failures:15,until:now+PIN_GUARD_DELAYS[2],reason:'edited'};
        }
      }
      raw=localStorage.getItem(PIN_GUARD_PREFIX+tag);
    }catch(e){ throw pinGuardError('storage',0,'Не вдалося прочитати ліміт спроб PIN у сховищі браузера.'); }
    let state={failures:0,until:0,reason:''};
    if (migrated){ state=migrated; await pinGuardWrite(cfg,tag,state); raw=localStorage.getItem(PIN_GUARD_PREFIX+tag); }
    if (!raw && primary && cfg.guard && !justMarked){
      state={failures:15,until:now+PIN_GUARD_DELAYS[2],reason:'missing'};
      await pinGuardWrite(cfg,tag,state); throw pinGuardWaitError(state,now);
    }
    if (raw){
      let saved, sum; try{ saved=JSON.parse(raw); sum=await pinGuardChecksum(saved); }catch(e){}
      if (!saved || saved.v!==1 || saved.tag!==tag || !Number.isSafeInteger(saved.failures) || saved.failures<0 || !Number.isFinite(saved.until) || saved.until<0 || saved.sum!==sum){
        state={failures:15,until:now+PIN_GUARD_DELAYS[2],reason:'edited'};
        await pinGuardWrite(cfg,tag,state); throw pinGuardWaitError(state,now);
      }
      if (!migrated) state={failures:saved.failures,until:saved.until,reason:saved.reason || ''};
    }
    if (state.until>now) throw pinGuardWaitError(state,now);
    if (state.reason){ state.reason=''; await pinGuardWrite(cfg,tag,state); }
    let result;
    try{ result=await verify(); }
    catch(cause){
      const failures=state.failures+1, delay=failures%5===0 ? PIN_GUARD_DELAYS[Math.min(Math.floor(failures/5)-1,PIN_GUARD_DELAYS.length-1)] : 0;
      state={failures,until:delay ? now+delay : 0,reason:''};
      try{ await pinGuardWrite(cfg,tag,state); }
      catch(e){ PINC.tries=4; PINC.until=Date.now()+PIN_GUARD_DELAYS[2]; throw e; }
      if (delay) throw pinGuardWaitError(state,now);
      throw pinGuardError('wrong',0,'Неправильний PIN');
    }
    await pinGuardWrite(cfg,tag,{failures:0,until:0,reason:''}); PINC.tries=0; PINC.until=0; return result;
  });
}
// Створення/зміна: нові PIN — щонайменше шість символів. Старі конверти лишаються сумісними для входу.
{ const x0=pinWrap; pinWrap=async function(pin,raw){
  if (typeof pin!=='string' || pin.length<6) throw pinGuardError('short',0,'Новий PIN має містити щонайменше 6 символів.');
  const cfg=await x0.apply(this,arguments); cfg.guard=1; return cfg;
}; }
{ const x0=pinUnwrap; pinUnwrap=function(pin,cfg){ return pinGuardCheck(pin,cfg,()=>x0.apply(this,arguments)); }; }
{ const x0=pinEnable; pinEnable=async function(key,cfg){
  cfg.guard=1; await pinGuardInit(cfg); const ok=await x0.apply(this,arguments);
  if (!ok) await pinGuardForget(cfg);
  return ok;
}; }
{ const x0=pinDisable; pinDisable=async function(){
  const cfg=PINC.cfg, ok=await x0.apply(this,arguments); if (ok) await pinGuardForget(cfg); return ok;
}; }
