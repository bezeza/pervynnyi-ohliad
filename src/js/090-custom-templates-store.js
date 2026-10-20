/* ======== СВОЇ ШАБЛОНИ КОРИСТУВАЧА (зберігаються в цьому браузері) ======== */
let CUSTOM = {opts:{}, presets:[], ovr:{}, hid:{}, diary:[], rxsets:[], btns:[]};
try{ const c = JSON.parse(localStorage.getItem('po.custom') || '{}'); if (c && typeof c === 'object') CUSTOM = Object.assign({}, c, {opts:c.opts || {}, presets:c.presets || [], ovr:c.ovr || {}, hid:c.hid || {}, diary:c.diary || [], rxsets:c.rxsets || [], btns:c.btns || [], labs:c.labs || []}); /* інші ключі (свої аналізи тощо) не губляться */ }catch(e){}
for (const k in CUSTOM.opts){
  const [sid, fid] = k.split('.'); const sec = SECTIONS.find(x=>x.id===sid); const f = sec && sec.fields.find(x=>x.id===fid); if (!f) continue;
  const arr = f.type === 'text' ? (f.quick = f.quick || []) : f.opts;
  (CUSTOM.opts[k] || []).forEach(t=>{ if (typeof t === 'string' && !arr.some(o=>(Array.isArray(o) ? o[1] : o) === t)) arr.push(t); });
}
CUSTOM.presets.forEach(p=>{ if (p && p.key && !PRESETS.some(x=>x.key === p.key)) PRESETS.push(Object.assign({skarhy:[], set:{}, plan:[]}, p, {custom:true})); });

