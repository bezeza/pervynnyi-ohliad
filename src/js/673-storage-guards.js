/* 0.9.3.86 — захист збереження: гонка PIN при видаленні, два вікна, кошик зі старого сховища, чужий HTML у файлі пацієнта.
   Наявні функції лише обгортаються. */
function safeStyle(s){
  const out = [];
  String(s || '').split(';').forEach(part=>{
    const i = part.indexOf(':'); if (i < 0) return;
    const k = part.slice(0, i).trim().toLowerCase(), v = part.slice(i + 1).trim().toLowerCase();
    if ((k === 'text-align' && /^(left|right|center|justify)$/.test(v)) || (k === 'font-size' && /^\d+(\.\d+)?(px|pt|%)$/.test(v)) || (k === 'font-weight' && /^(bold|normal|[1-9]00)$/.test(v)) || (k === 'font-style' && /^(italic|normal)$/.test(v)) || (k === 'text-decoration' && /^(underline|none)$/.test(v))) out.push(k + ':' + v);
  });
  return out.join(';');
}
function safeHtml(s){
  const raw = String(s == null ? '' : s);
  let doc; try{ doc = new DOMParser().parseFromString('<div id="po-safe">' + raw + '</div>', 'text/html'); }catch(e){ return ''; }
  const root = doc.getElementById('po-safe'); if (!root) return '';
  const OK = new Set(['DIV','B','I','U','BR','SPAN','P','STRONG','EM','SUB','SUP']);
  const DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','IMG','SVG','MATH','VIDEO','AUDIO','FORM','INPUT','BUTTON','TEXTAREA','SELECT']);
  const walk = node => {
    [...node.childNodes].forEach(n=>{
      if (n.nodeType === 3) return;
      if (n.nodeType !== 1){ n.remove(); return; }
      if (DROP.has(n.tagName)){ n.remove(); return; }
      if (!OK.has(n.tagName)){ while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); return; }
      [...n.attributes].forEach(a=>{
        const name = a.name.toLowerCase();
        if (name === 'data-sec' && n.tagName === 'DIV' && /^[a-z0-9_-]{1,40}$/i.test(a.value)) return;
        if (name === 'style'){ const safe = safeStyle(a.value); if (safe) n.setAttribute('style', safe); else n.removeAttribute(a.name); return; }
        n.removeAttribute(a.name);
      });
      walk(n);
    });
  };
  walk(root);
  return root.innerHTML;
}
function scrubSnap(S){
  if (!S || typeof S !== 'object') return;
  if (S.cache) for (const k in S.cache){ const c = S.cache[k]; if (c && typeof c.html === 'string') c.html = safeHtml(c.html); }
  if (Array.isArray(S.diaries)) S.diaries.forEach(d=>{ if (d && typeof d.html === 'string') d.html = safeHtml(d.html); });
}
{ const r0 = restore; restore = function(S){ try{ scrubSnap(S); }catch(e){} return r0.apply(this, arguments); }; }

/* видалення має скасувати ще не дописаний зашифрований запис, інакше він лягає поверх delete */
{ const s0 = saveStore; saveStore = function(st){
  try{
    if (st && IDB.w && typeof PINC !== 'undefined' && PINC.key && typeof PIN_Q !== 'undefined'){
      for (const id in IDB.w) if (!(id in st)) PIN_Q[id] = (PIN_Q[id] || 0) + 1;
    }
  }catch(e){}
  return s0.apply(this, arguments);
}; }

/* не перезаписувати картку, яку вже новіше зберегло інше вікно */
function rememberSeen(){
  IDB.seen = IDB.seen || {};
  if (!IDB.cache) return;
  for (const id in IDB.cache){ const v = IDB.cache[id]; if (v && !v.enc && v.updated != null) IDB.seen[id] = v.updated; }
}
function conflict(id, cur, v){
  if (!IDB.seen || IDB.seen[id] == null || !cur || !v) return false;
  const cu = cur.updated || 0, seen = IDB.seen[id];
  return cu > seen && cu !== (v.updated || 0);
}
{ const put0 = idbPutVal; idbPutVal = function(os, id, v){
  const plain = v && !v.enc;
  const note = () => { if (plain && IDB.seen && v.updated != null) IDB.seen[id] = v.updated; };
  const gen = typeof PIN_Q !== 'undefined' ? (PIN_Q[id] || 0) : 0;
  if (!plain || !IDB.db || !IDB.seen || IDB.seen[id] == null){ const r = put0.apply(this, arguments); note(); return r; }
  const decide = cur => {
    if (typeof PIN_Q !== 'undefined' && (PIN_Q[id] || 0) !== gen) return;
    if (IDB.block && IDB.block[id]) return;
    if (cur && conflict(id, cur, v)){
      IDB.block = IDB.block || {}; IDB.block[id] = 1;
      try{ if (IDB.w) IDB.w[id] = cur.updated; }catch(e){}
      try{ toast('Цього пацієнта вже змінено в іншому вікні. Оновіть сторінку, щоб не затерти новіший запис.', 6000); }catch(e){}
      if (typeof PIN_Q !== 'undefined') PIN_Q[id] = (PIN_Q[id] || 0) + 1;
      return;
    }
    put0.call(this, os, id, v); note();
  };
  if (typeof PINC !== 'undefined' && PINC.key){
    let req; try{ req = IDB.db.transaction('patients', 'readonly').objectStore('patients').get(id); }catch(e){ const r = put0.apply(this, arguments); note(); return r; }
    req.onsuccess = () => { const cur = req.result;
      if (cur && cur.enc && typeof decObj === 'function'){ decObj(cur).then(p=>decide(p)).catch(()=>decide(null)); return; }
      decide(cur && cur.enc ? null : cur);
    };
    req.onerror = () => { const r = put0.call(this, os, id, v); note(); return r; };
    return;
  }
  let req; try{ req = os.get(id); }catch(e){ const r = put0.apply(this, arguments); note(); return r; }
  req.onsuccess = () => decide(req.result);
  req.onerror = () => { put0.call(this, os, id, v); note(); };
}; }
{ const i0 = idbInit; idbInit = function(){
  return Promise.resolve(i0.apply(this, arguments)).then(async ok=>{ try{ rememberSeen(); if (IDB.ok && IDB.db) await reconcileTrash(); }catch(e){} return ok; });
}; }
/* idbInit() уже викликано раніше за цей файл — дочекатися тієї бази */
(function waitDb(k){
  if (IDB.ok && IDB.db){ rememberSeen(); reconcileTrash(); return; }
  if (k > 80) return;
  setTimeout(()=>waitDb(k + 1), 50);
})(0);

/* кошик: після відкриття бази лишаються лише записи з бази, старий po.trash більше не підмішується */
async function reconcileTrash(){
  const raw = await new Promise(res=>{
    let tx, req; try{ tx = IDB.db.transaction('patients', 'readonly'); req = tx.objectStore('patients').openCursor(); }catch(e){ res({}); return; }
    const out = {};
    req.onsuccess = e => { const c = e.target.result; if (c){ if (String(c.key).startsWith('trash:')) out[String(c.key).slice(6)] = c.value; c.continue(); } };
    tx.oncomplete = () => res(out); tx.onerror = () => res(out);
  });
  const T = {};
  for (const id in raw){
    let v = raw[id];
    if (v && v.enc){ if (typeof PINC === 'undefined' || !PINC.key || typeof decObj !== 'function') continue; try{ v = await decObj(v); }catch(e){ continue; } }
    if (v) T[id] = v;
  }
  Object.keys(TRASH).forEach(id=>{ if (!(id in T)) delete TRASH[id]; });
  Object.assign(TRASH, T);
  try{ localStorage.removeItem('po.trash'); localStorage.setItem('po.trash.mode', 'idb'); }catch(e){}
  try{ if (typeof renderTrashLink === 'function') renderTrashLink(); }catch(e){}
}
