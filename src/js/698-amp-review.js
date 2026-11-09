/* ===== 0.9.3.107 — СОП закладу: запис перегляду протимікробної терапії через 48–72 год =====
   У листі призначень біля протимікробного препарату (лише з увімкненим «СОП закладу»):
   • «📝 Перегляд 48–72 год» — віконце: ефективність, рішення (продовжити / деескалація / ескалація / перевести на per os /
     припинити), «на що», примітка, наступний перегляд. Клінічні й лабораторні дані (день 0 → зараз) і посів підставляються самі.
     Запис зберігається в призначенні (it.revLog); «продовжити/деескалація/ескалація/per os» переносить дату перегляду,
     «припинити» — відміняє препарат цим днем. Нові препарати при деескалації чи ескалації лікар додає сам.
   • У щоденнику за день перегляду — абзац «Перегляд … терапії через 48 год (СОП № 214)» після блоку «Лікування».
   • «🖨 Дод. 1 + перегляд» — Додаток 1, заповнений, і запис перегляду з підписом на одному друку. */
const AMP4_EFF = ['позитивна динаміка', 'без суттєвої динаміки', 'погіршення'];
const AMP4_DEC = [['cont','продовжити'], ['deesc','деескалація'], ['esc','ескалація'], ['po','перевести з парентерального введення на per os'], ['stop','припинити']];
const AMP4_TERAP = {ab:'антибактеріальної', af:'антифунгальної', av:'противірусної', ap:'протипаразитарної'};
const amp4N = s => parseFloat(String(s).replace(',', '.'));
/* значення показника в день 0 (останнє до/в день початку, інакше перше) і зараз (останнє) */
function amp4Lab(start, tre, re, numRe){
  try{
    const L = (RES || []).filter(r=>(tre && tre.test(r.t)) || (re && re.test(r.v))).slice().sort((a,b)=>String(a.d).localeCompare(String(b.d)));
    const num = r => { const m = r && numRe.exec(r.v); return m ? m[1] : ''; };
    const withN = L.filter(r=>num(r)); if (!withN.length) return ['', ''];
    const before = withN.filter(r=>!start || r.d <= start), first = before.length ? before[before.length - 1] : withN[0], last = withN[withN.length - 1];
    return [num(first), last === first ? '' : num(last)];
  }catch(e){ return ['', '']; }
}
function amp4Auto(it){
  const v = ampData(it), s = it.start;
  const wbc = amp4Lab(s, /^ЗАК$|загальний аналіз крові/i, /лейк/i, /лейк[а-яіїєґa-z]*\.?\s*([\d.,]+)/i);
  const crp = amp4Lab(s, /С-реактивний білок/i, /СРБ|C-реактив|С-реактив/i, /(?:СРБ|реактивний білок)\s*([\d.,]+)/i);
  const pct = amp4Lab(s, /прокальцитонін/i, /прокальцитонін|ПКТ|PCT/i, /(?:прокальцитонін|ПКТ|PCT)\s*([\d.,]+)/i);
  const ar = (n, [a, b], u) => a ? n + ' ' + a + (b ? ' → ' + b : '') + ' ' + u : '';
  const lab = [ar('лейкоцити', wbc, '×10⁹/л'), ar('СРБ', crp, 'мг/л'), ar('прокальцитонін', pct, 'нг/мл'), v.kk ? 'КК ' + v.kk + ' мл/хв' : ''].filter(Boolean).join(', ');
  const vit = [v.t ? 't ' + v.t + ' °C' : '', v.chd ? 'ЧД ' + v.chd + '/хв' : '', v.spo2 ? 'SpO₂ ' + v.spo2 + ' %' + (v.o2 ? ' на кисні ' + v.o2 + ' л/хв' : '') : '', v.ad ? 'АТ ' + v.ad + ' мм рт. ст.' : '', v.ps ? 'ЧСС ' + v.ps + '/хв' : ''].filter(Boolean).join(', ');
  const cult = v.bug ? 'посів від ' + v.cult + ': ' + v.bug : /взято/i.test(it.cult || '') ? 'посів взято, результат очікується' : '';
  const down = (([a, b])=>a && b && amp4N(b) < amp4N(a))(wbc) || (([a, b])=>a && b && amp4N(b) < amp4N(a))(crp);
  const up = (([a, b])=>a && b && amp4N(b) > amp4N(a) * 1.1)(crp);
  return {v, vit, lab, cult, effGuess:down && !up ? 0 : up ? 2 : -1};
}
function amp4Hours(it, d){ if (!it.start) return ''; const h = Math.round((new Date(d + 'T00:00') - new Date(it.start + 'T00:00')) / 36e5); return h <= 0 ? '' : h <= 48 ? 48 : h <= 72 ? 72 : h; }
function amp4Text(it, r){
  const k = ampKind(it.drug) || 'ab';
  const rx = [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ') + (it.start ? ' з ' + fmtD(it.start) : '');
  const dec = (AMP4_DEC.find(x=>x[0] === r.dec) || ['', ''])[1] + (r.to && /deesc|esc|po/.test(r.dec) ? ' на ' + r.to : '');
  return `Перегляд ${AMP4_TERAP[k]} терапії${r.h ? ' через ' + r.h + ' год' : ''} (${AMP_SOP[k]}): ${rx}.`
    + (r.vit ? ' ' + r.vit.replace(/^./, c=>c.toUpperCase()) + '.' : '')
    + (r.lab ? ' Лабораторно (день 0 → зараз): ' + r.lab + '.' : '')
    + (r.cult ? ' Мікробіологія: ' + r.cult + '.' : '')
    + (r.eff >= 0 ? ' Ефективність терапії: ' + AMP4_EFF[r.eff] + '.' : '')
    + (dec ? ' Рішення: ' + dec + '.' : '')
    + (r.note ? ' ' + r.note.replace(/\.?$/, '.') : '')
    + (r.next ? ' Наступний перегляд — ' + fmtD(r.next) + '.' : '');
}
function amp4Dialog(it){
  const old = document.getElementById('ampRev'); if (old) old.remove();
  const back = document.activeElement, a = amp4Auto(it), t = todayISO();
  const st = {eff:a.effGuess, dec:''};
  const close = () => { box.remove(); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const chips = (list, key, onPick) => h('div', {class:'chips'}, ...list.map((x, i)=>{ const id = Array.isArray(x) ? x[0] : i, lab = Array.isArray(x) ? x[1] : x;
    const b = h('button', {type:'button', class:'chip', 'aria-pressed':String(st[key] === id), onclick:()=>{ st[key] = st[key] === id ? (key === 'eff' ? -1 : '') : id;
      b.parentNode.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed', 'false')); if (st[key] === id) b.setAttribute('aria-pressed', 'true'); if (onPick) onPick(); preview(); }}, lab); return b; }));
  const inp = (id, attrs) => h('input', Object.assign({id, oninput:()=>preview()}, attrs));
  const dEl = inp('arv_d', {type:'date', value:t}), toEl = inp('arv_to', {placeholder:'препарат, доза, шлях'}), noteEl = inp('arv_note', {placeholder:'необов’язково'});
  const nextEl = inp('arv_next', {type:'date', value:addDays(t, 2)});
  const vitEl = inp('arv_vit', {value:a.vit}), labEl = inp('arv_lab', {value:a.lab}), cultEl = inp('arv_cult', {value:a.cult});
  const toRow = h('div', {class:'f wide', hidden:true}, h('label', {for:'arv_to'}, 'На що'), toEl);
  const nextRow = h('div', {class:'f'}, h('label', {for:'arv_next'}, 'Наступний перегляд'), nextEl);
  const pv = h('p', {class:'arv-pv'});
  const rec = () => ({d:dEl.value || t, h:amp4Hours(it, dEl.value || t), vit:vitEl.value.trim(), lab:labEl.value.trim(), cult:cultEl.value.trim(),
    eff:st.eff, dec:st.dec, to:toEl.value.trim(), note:noteEl.value.trim(), next:st.dec === 'stop' ? '' : nextEl.value});
  function preview(){ toRow.hidden = !/^(deesc|esc|po)$/.test(st.dec); nextRow.hidden = st.dec === 'stop'; pv.textContent = amp4Text(it, rec()); }
  const save = () => {
    if (!st.dec){ toast('Оберіть рішення'); return; }
    const r = rec(); it.revLog = (it.revLog || []).filter(x=>x.d !== r.d); it.revLog.push(r); it.revLog.sort((x, y)=>String(x.d).localeCompare(String(y.d)));
    if (r.dec === 'stop'){ if (!it.stop || it.stop > r.d) it.stop = r.d; }
    else if (r.next){ it.rev = r.next; it.revTouched = true; }
    close(); try{ renderRx(); }catch(e){} try{ update(); }catch(e){} try{ renderRxStrip(); }catch(e){}
    toast(r.dec === 'stop' ? it.drug + ': перегляд записано, препарат відмінено з ' + fmtD(r.d)
      : /^(deesc|esc|po)$/.test(r.dec) ? 'Перегляд записано. Новий препарат додайте в лист призначень, а цей відмініть' : 'Перегляд записано, наступний — ' + fmtD(r.next), 4500);
  };
  const box = h('div', {id:'ampRev', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'ampRevT'},
    h('div', {class:'mcard'},
      h('div', {class:'ph'}, h('h2', {id:'ampRevT'}, 'Перегляд через 48–72 год — ' + it.drug), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      h('div', {class:'arv-grid'},
        h('div', {class:'f'}, h('label', {for:'arv_d'}, 'Дата перегляду'), dEl),
        h('div', {class:'f wide'}, h('label', {for:'arv_vit'}, 'Клінічно'), vitEl),
        h('div', {class:'f wide'}, h('label', {for:'arv_lab'}, 'Лабораторно (день 0 → зараз)'), labEl),
        h('div', {class:'f wide'}, h('label', {for:'arv_cult'}, 'Мікробіологія'), cultEl)),
      h('p', {class:'b'}, 'Ефективність'), chips(AMP4_EFF, 'eff'),
      h('p', {class:'b'}, 'Рішення'), chips(AMP4_DEC, 'dec'),
      h('div', {class:'arv-grid'}, toRow, nextRow, h('div', {class:'f wide'}, h('label', {for:'arv_note'}, 'Примітка'), noteEl)),
      h('p', {class:'chips-hint'}, 'Так буде в щоденнику за дату перегляду:'), pv,
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:save}, 'Записати перегляд'))));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box); preview(); const f = box.querySelector('.chip'); if (f) f.focus();
}
function amp4PrintD1R(it){
  const L = it.revLog || [], r = L[L.length - 1];
  const rev = r ? `<div class="ampf"><h2>Перегляд ${AMP4_TERAP[ampKind(it.drug) || 'ab']} терапії через 48–72 год</h2><p>${ampE(amp4Text(it, r))}</p>
<div class="ar">Дата ${ampE(fmtD(r.d))}. Лікуючий лікар (ПІБ): ${ampV(mv('doc'), 'g')} Підпис: ${ampV('', 'w30')}</div></div>` : '';
  return ampPrint(ampD1(ampData(it)) + rev, r ? 'Додаток 1 і перегляд' : 'Додаток 1');
}
/* кнопки в листі призначень */
{ const x0 = ampDecorate; ampDecorate = function(){ const r = x0.apply(this, arguments);
    try{ if (!ampOn()) return r;
      document.querySelectorAll('#rxList .rx[data-id] .amp-acts').forEach(box=>{ if (box.querySelector('.amp-rev')) return;
        const row = box.closest('.rx[data-id]'), it = ampItem(row.dataset.id); if (!it) return;
        const n = (it.revLog || []).length, b = (txt, fn, title, cls) => h('button', {type:'button', class:'btn ' + cls, title, onclick:e=>{ e.preventDefault(); const x = ampItem(row.dataset.id); if (x) fn(x); }}, txt);
        box.append(b('📝 Перегляд 48–72 год' + (n ? ' (' + n + ')' : ''), amp4Dialog, 'Записати оцінку ефективності й рішення — піде в щоденник за дату перегляду', 'amp-rev'),
          n ? b('🖨 Дод. 1 + перегляд', amp4PrintD1R, 'Додаток 1 і останній запис перегляду з підписом', 'amp-revp') : '');
      }); }catch(e){}
    return r; }; }
/* щоденник: абзац перегляду за дату щоденника */
{ const x0 = rxPart; rxPart = function(){ const r = x0.apply(this, arguments);
    try{ if (DOC !== 'shch' || !ampOn()) return r; const d = todayISO();
      const txt = RXF().map(it=>(it.revLog || []).filter(x=>x.d === d).map(x=>amp4Text(it, x))).flat();
      if (!txt.length) return r;
      return r ? Object.assign({}, r, {body:r.body + ' ' + txt.join(' ')}) : {head:'Лікування:', body:txt.join(' '), sep:' '};
    }catch(e){ return r; } }; }
try{ renderRx(); }catch(e){}
