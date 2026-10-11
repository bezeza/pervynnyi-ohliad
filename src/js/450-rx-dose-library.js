/* Довідник доз: з переліку препаратів і всіх схем програми — стандартна доза, шлях, кратність і інші типові варіанти */
let RXLIB = null;
function rxLib(){
  if (RXLIB) return RXLIB; RXLIB = {};
  const add = (n, d, r, f, note, first) => { if (!n || (!d && !r)) return; const k = String(n).trim().toLowerCase();
    const e = RXLIB[k] || (RXLIB[k] = {n:String(n).trim(), def:{d:d || '', r:r || '', f:f || '', note:note || ''}, doses:[], routes:[], freqs:[]});
    if (first && !e.fromList){ e.def = {d:d || '', r:r || '', f:f || '', note:note || ''}; e.fromList = true; }
    [[e.doses, d], [e.routes, r], [e.freqs, f]].forEach(([a, v])=>{ if (v && !a.includes(v)) a.push(v); }); };
  DRUGS.forEach(x=>add(x.n, x.d, x.r, x.f, x.note, true));
  const rows = [];
  PRESETS.forEach(p=>rows.push(...(p.rx || [])));
  Object.values(RXA).forEach(L=>rows.push(...(L || [])));
  Object.values(RXV).forEach(L=>L.forEach(v=>rows.push(...v[1])));
  Object.values(RXSETS).forEach(L=>L.forEach(v=>rows.push(...v[1])));
  rows.forEach(r=>add(r[0], r[1], r[2], r[3], ''));
  return RXLIB;
}
const libInfo = n => rxLib()[String(n || '').trim().toLowerCase()] || null;
function drugDefaults(it, name){
  const d = drugInfo(name), L = libInfo(name); if (!d && !L) return false;
  const def = d ? {d:d.d, r:d.r, f:d.f, note:d.note || ''} : L.def;
  const A = it.auto || (it.auto = {});
  // новий препарат — доза, шлях і кратність завжди його власні (доза попереднього препарату небезпечна); примітка — лише якщо порожня чи автоматична
  [['dose','d'],['route','r'],['freq','f'],['note','note']].forEach(([k, j])=>{ if (k !== 'note' || !it[k] || it[k] === A[k]){ it[k] = def[j] || ''; A[k] = it[k]; } });
  if (d && d.ab && !it.rev) it.rev = addDays(it.start, 2);
  return true;
}

