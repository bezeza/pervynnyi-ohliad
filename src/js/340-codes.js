const ICPCMAP = {"pneu": "R81", "gh": "K87", "ihd": "K74", "hf": "K77", "gastr": "D87", "copd": "R95", "dm": "T90", "af": "K78", "asthma": "R96", "pyelo": "U70", "stroke": "K90", "tia": "K89", "de": "K91", "rad": "L86", "dpn": "N94", "migr": "N89", "bell": "N91", "epi": "N88", "cerv": "L83", "bppv": "H82", "app": "D88", "chol": "D98", "panc": "D99", "gib": "D99", "obstr": "D99", "hern": "D89", "dvt": "K94", "perf": "D86", "colic": "U95", "absc": "S10", "arvi": "R74", "flu": "R80", "covid": "", "food": "D73", "tons": "R76", "hep": "D72", "ery": "S76", "mening": "N71", "mono": "A75", "varic": "A72", "tdr": "L72", "thip": "L75", "tank": "L73", "tsprain": "L77", "trib": "L76", "tcmt": "N79", "tspine": "L76", "tclav": "L76", "twound": "S18", "tdisl": "L80", "cyst": "U71", "otit": "H71", "sinus": "R75", "bronch": "R78", "lbp": "L03", "anem": "B80", "hypot": "T86", "gerd": "D84", "urtic": "S98", "insom": "P06", "anx": "P74", "dyslip": "T93", "gout": "T92", "prof": "A98"}, ICPC_C = {"підвищення температури тіла": "A03", "загальну слабкість": "A04", "кашель з виділенням харкотиння": "R05", "сухий кашель": "R05", "задишку при фізичному навантаженні": "R02", "задишку у спокої": "R02", "головний біль": "N01", "запаморочення": "N17", "серцебиття": "K04", "біль у грудній клітці": "A11", "стискаючий біль за грудиною при навантаженні": "K01", "біль в епігастрії": "D02", "нудоту": "D09", "блювання": "D10", "рідкі випорожнення": "D11", "біль у горлі": "R21", "нежить": "R07", "біль у поперековій ділянці": "U14", "біль і печіння при сечовипусканні": "U01", "часте сечовипускання": "U02", "біль у попереку з іррадіацією в ногу": "L03", "біль у шиї з іррадіацією в руку": "L01", "висипання на шкірі": "S06", "біль у ділянці травми": "A80", "набряки нижніх кінцівок": "K07", "біль у правій здухвинній ділянці": "D06", "біль у спині після травми": "L02", "біль у вусі": "H01", "зниження слуху": "H28", "порушення сну": "P06", "тривожність і внутрішнє напруження": "P01", "біль над лобком": "U13", "біль і набряк суглоба": "L20"};
const DICT = {nk025:null, nk026:null};
const CSTOP = new Set(['гостр','хроні','неуто','інший','інша','інші','інших','без','або','та','при','стаді','ступе','форма','тяжк','серед','фаза','клініч','групи','група','справ','зліва','обох','правої','лівої','право','ліво','перві','повто','загос','уточн','класи','рубри','частк']);
const ctok = t => String(t || '').toLowerCase().replace(/[’ʼ`']/g, '’').split(/[^a-zа-яіїєґ0-9’]+/).map(x=>/^[ivxіх]+$/.test(x) ? x.replace(/і/g, 'i').replace(/х/g, 'x') : x).filter(x=>x.length >= 2 || /^[0-9ivx]$/.test(x)).map(x=>/^[a-z]?\d/.test(x) || /^[ivx]+$/.test(x) ? x : x.slice(0, 5));
const cprep = list => list.map(e=>Object.assign(e, {st: e.st || new Set(ctok(e[1] + ' ' + (e[2] || '')))}));
function codeSearch(q, list, n){
  q = String(q || '').trim(); if (!q || !list) return [];
  const qc = q.toUpperCase().replace(/\s+/g, ''), qt = [...new Set(ctok(q))];
  const res = [];
  for (const e of list){
    let sc = 0; const code = String(e[0]).toUpperCase();
    if (code === qc) sc += 20; else if (qc.length >= 2 && code.startsWith(qc)) sc += 10;
    for (const t of qt){ let hit = e.st.has(t); if (!hit && t.length >= 4) for (const s of e.st){ if (s.startsWith(t) || (s.length >= 4 && t.startsWith(s))){ hit = true; break; } } if (hit) sc += CSTOP.has(t) ? 0.25 : /^([0-9]|[ivx]+)$/.test(t) ? 0.6 : 1; }
    if (sc > 0){ if (/без ускладнень|неуточнен/.test(e[1])) sc += 0.1; res.push([sc, e]); }
  }
  return res.sort((a,b)=>b[0] - a[0] || a[1][1].length - b[1][1].length).slice(0, n || 8).map(x=>x[1]);
}
const mkhList = () => DICT.nk025 || cprep(ICD10), icpcList = () => cprep(ICPC2);
function codePicker(o){
  const box = h('div', {class:'cpick'});
  const inp = h('input', {type:'search', placeholder:o.ph, 'aria-label':o.ph});
  const list = h('div', {class:'cpres', role:'listbox'});
  const draw = q => { list.innerHTML = ''; const R = codeSearch(q, o.list()); if (!R.length){ if (q) list.append(h('p', {class:'chips-hint'}, o.none || 'Нічого не знайдено — уточніть запит')); return; }
    R.forEach(e=>list.append(h('button', {type:'button', class:'cpitem', onclick:()=>{ o.pick(e); list.innerHTML = ''; inp.value = ''; }}, h('b', {}, e[0]), ' ', e[1]))); };
  inp.addEventListener('input', ()=>draw(inp.value));
  const acts = (o.btns || []).map(([l, fn])=>h('button', {type:'button', class:'more', onclick:()=>fn(draw, inp)}, l));
  box.append(h('div', {class:'cprow'}, inp, ...acts), list, o.note ? h('p', {class:'chips-hint cpnote'}, o.note()) : '');
  box.refresh = () => { const n = box.querySelector('.cpnote'); if (n && o.note) n.textContent = o.note(); };
  return box;
}
const mkhSrc = () => DICT.nk025 ? `Довідник: НК 025:2021 (завантажений, ${DICT.nk025.length} кодів).` : 'Довідник: вбудований МКХ-10 (ВООЗ), найуживаніші коди. Для кодування за НК 025:2021 (МКХ-10-АМ) завантажте офіційний файл у «Налаштуваннях» → «Довідники».';
function suppCodes(){
  const f = F('dx.supd'), cur = (f.el.value || val(f, true) || '').trim(); if (!cur){ toast('Супутніх діагнозів ще немає'); return; }
  const items = cur.split(/;\s*|\.\s+(?=[А-ЯІЇЄҐA-Z])|\n+/).map(x=>x.trim().replace(/\.$/, '')).filter(Boolean);
  let n = 0; const miss = [];
  const out = items.map(it=>{ if (/\([A-Z]\d/.test(it)) return it; const r = codeSearch(it, mkhList(), 1)[0]; if (r){ n++; return it + ' (' + r[0] + ')'; } miss.push(it); return it; });
  f.el.value = out.join('; '); update();
  toast(n ? `Додано кодів: ${n}. Перевірте відповідність` + (miss.length ? `; без коду: ${miss.join(', ')}` : '') : 'Не вдалося підібрати коди — скористайтеся пошуком', 5000);
}
function dxCodeUI(){
  const wrapOf = k => { const f = F(k); return f && f.el ? f.el.closest('.f') : null; };
  const mk = wrapOf('dx.mkh'); if (!mk || mk.dataset.cp) return; mk.dataset.cp = '1';
  const pm = codePicker({ph:'Пошук коду МКХ-10: назва або код', list:mkhList, note:mkhSrc,
    pick:e=>{ F('dx.mkh').el.value = e[0]; update(); toast('Код ' + e[0] + ' — ' + e[1]); },
    btns:[['Підібрати за діагнозом', (draw, inp)=>{ const o = val(F('dx.osn'), true); if (!o){ toast('Спершу впишіть основний діагноз'); return; } inp.value = ''; draw(o); }]]});
  mk.classList.add('wide'); mk.append(pm); DICT.pickers = [pm];
  const sp = wrapOf('dx.supd');
  if (sp){ const ps = codePicker({ph:'Додати супутній діагноз з кодом: пошук', list:mkhList,
      pick:e=>{ const f = F('dx.supd'), cur = (f.el.value || val(f, true) || '').trim(); f.el.value = (cur ? cur.replace(/[.;]\s*$/, '') + '; ' : '') + e[1] + ' (' + e[0] + ')'; update(); },
      btns:[['Додати коди до наявних', ()=>suppCodes()]]}); sp.append(ps); DICT.pickers.push(ps); }
  ['dx.icpcr', 'dx.icpc'].forEach(k=>{ const w = wrapOf(k); if (!w) return;
    w.append(codePicker({ph:'Пошук ICPC-2: назва або код', list:icpcList, pick:e=>{ F(k).el.value = e[0]; update(); }})); });
  const pl = wrapOf('dx.posl');
  if (pl) pl.append(codePicker({ph:'Пошук послуги / інтервенції (НК 026:2021)', list:()=>DICT.nk026, none:'Довідник НК 026:2021 не завантажено або нічого не знайдено. Завантажте офіційний файл у «Налаштуваннях» → «Довідники».',
    pick:e=>{ const f = F('dx.posl'); f.el.value = ((f.el.value || '').trim() ? f.el.value.trim().replace(/[.;]$/, '') + ';\n' : '') + e[0] + ' ' + e[1]; update(); },
    btns:[['За планом обстеження', (draw, inp)=>{ if (!DICT.nk026){ toast('Спершу завантажте НК 026:2021 у «Налаштуваннях» → «Довідники»', 4000); return; } const pl = val(F('dx.plan'), true); if (!pl){ toast('План обстеження порожній'); return; } inp.value = ''; draw(pl); }]]}));
}
/* --- Довідники з файлу (CSV / TXT) --- */
function dictParse(text, kind){
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l=>l.trim());
  const sample = lines.slice(0, 20).join('\n'), dl = ['\t', ';', ','].sort((a,b)=>sample.split(b).length - sample.split(a).length)[0];
  const re = kind === 'nk025' ? /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?[†*]?$/ : /^\d{4,5}-\d{2}(-\d{2})?$/;
  const out = [];
  for (const l of lines){
    const cells = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++){ const c = l[i]; if (c === '"'){ if (q && l[i+1] === '"'){ cur += '"'; i++; } else q = !q; } else if (c === dl && !q){ cells.push(cur); cur = ''; } else cur += c; }
    cells.push(cur);
    const cc = cells.map(x=>x.trim()); const ci = cc.findIndex(x=>re.test(x)); if (ci < 0) continue;
    const name = cc.filter((x,i)=>i !== ci && !re.test(x)).sort((a,b)=>b.length - a.length)[0] || '';
    if (name) out.push([cc[ci], name, '']);
  }
  return out;
}
function dictIdb(mode, fn){ return new Promise((res, rej)=>{ const r = indexedDB.open('po-dict', 1); r.onupgradeneeded = ()=>r.result.createObjectStore('d'); r.onsuccess = ()=>{ const tx = r.result.transaction('d', mode), q = fn(tx.objectStore('d')); tx.oncomplete = ()=>res(q && q.result); tx.onerror = ()=>rej(tx.error); }; r.onerror = ()=>rej(r.error); }); }
async function dictLoad(){ for (const k of ['nk025','nk026']){ try{ const d = await dictIdb('readonly', st=>st.get(k)); if (d && d.length) DICT[k] = cprep(d); }catch(e){} } dictRender(); (DICT.pickers || []).forEach(p=>p.refresh()); }
function dictFile(kind, file){
  const rd = new FileReader();
  rd.onload = async () => {
    const d = dictParse(String(rd.result), kind);
    if (d.length < 50){ toast('Не вдалося розпізнати коди у файлі. Збережіть таблицю як CSV (UTF-8): код в одному стовпці, назва — в іншому.', 7000); return; }
    try{ await dictIdb('readwrite', st=>st.put(d, kind)); }catch(e){}
    DICT[kind] = cprep(d); toast(`Завантажено ${kind === 'nk025' ? 'НК 025:2021' : 'НК 026:2021'}: ${d.length} записів`, 4000); dictRender(); (DICT.pickers || []).forEach(p=>p.refresh());
  };
  rd.readAsText(file, 'utf-8');
}
async function dictClear(kind){ try{ await dictIdb('readwrite', st=>st.delete(kind)); }catch(e){} DICT[kind] = null; dictRender(); (DICT.pickers || []).forEach(p=>p.refresh()); toast('Довідник видалено'); }
function dictRender(){
  document.querySelectorAll('.dictbox').forEach(b=>{
    b.innerHTML = '';
    [['nk025','НК 025:2021 — класифікатор хвороб (МКХ-10-АМ)'],['nk026','НК 026:2021 — класифікатор медичних інтервенцій (АКМІ)']].forEach(([k, l])=>{
      const fi = h('input', {type:'file', accept:'.csv,.txt,.tsv', hidden:'', onchange:e=>{ if (e.target.files[0]) dictFile(k, e.target.files[0]); e.target.value = ''; }});
      b.append(h('div', {class:'dictrow'}, h('div', {}, h('b', {}, l), h('div', {class:'chips-hint'}, DICT[k] ? `Завантажено: ${DICT[k].length} записів` : 'Не завантажено')),
        h('div', {class:'acts2'}, fi, h('button', {type:'button', class:'btn', onclick:()=>fi.click()}, DICT[k] ? 'Оновити файл' : 'Завантажити файл'), DICT[k] ? h('button', {type:'button', class:'more', onclick:()=>dictClear(k)}, 'Видалити') : '')));
    });
  });
}
function icpcAuto(p){
  if (MODE !== 'amb') return;
  const fi = F('dx.icpc'), fr = F('dx.icpcr');
  if (fi && ICPCMAP[p.key]) fi.el.value = ICPCMAP[p.key];
  if (fr){ const c = (p.skarhy || []).map(x=>ICPC_C[x]).find(Boolean); fr.el.value = c || ''; }
}

