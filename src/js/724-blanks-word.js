/* ===== 0.9.3.157 — порожні бланки → файл для Word (.doc) =====
   «⋯» → «🖨 Порожні бланки» → «💾 Зберегти у Word»: той самий бланк, але файлом, який відкриває Word (і LibreOffice) і де
   його можна змінити або надрукувати. Макет бланка у програмі — на flex і розтягнутих лініях, яких Word не знає, тому бланк
   спершу виводиться поза екраном, а потім перекладається у прості блоки, таблиці й підкреслені пропуски. */
const BW_CSS = ['font-family','font-size','font-weight','font-style','color','text-align','line-height','vertical-align','white-space'];
let BW_LH = 1;
function bwPx(v){ const n = parseFloat(v); return isFinite(n) ? n : 0; }
function bwHex(c){ const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(c || ''); return m ? '#' + [m[1], m[2], m[3]].map(x=>(+x).toString(16).padStart(2, '0')).join('') : (c || '#000000'); }
function bwEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function bwStyle(el, cs, extra, noBox){
  const o = [];
  BW_CSS.forEach(p=>{ const v = cs.getPropertyValue(p); if (v && v !== 'normal' && v !== 'start') o.push(p + ':' + (p === 'color' ? bwHex(v) : /px$/.test(v) && /^(font-size|line-height)$/.test(p) ? (bwPx(v) * 0.75 * BW_LH).toFixed(1) + 'pt' : v.replace(/"/g, "'"))); });
  const td = cs.getPropertyValue('text-decoration-line'); if (td && td !== 'none') o.push('text-decoration:' + td.split(' ')[0]);
  if (!noBox) ['top','right','bottom','left'].forEach(s=>{
    const w = bwPx(cs.getPropertyValue('border-' + s + '-width')), st = cs.getPropertyValue('border-' + s + '-style');
    if (w > 0 && st && st !== 'none') o.push('border-' + s + ':' + Math.max(0.5, w * 0.75).toFixed(1) + 'pt ' + st + ' ' + bwHex(cs.getPropertyValue('border-' + s + '-color')));
    const p = bwPx(cs.getPropertyValue('padding-' + s)); if (p) o.push('padding-' + s + ':' + (p * 0.75).toFixed(1) + 'pt');
    const m = bwPx(cs.getPropertyValue('margin-' + s)); if (m > 0) o.push('margin-' + s + ':' + (m * 0.75).toFixed(1) + 'pt');
  });
  const bg = cs.getPropertyValue('background-color'); if (bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg)) o.push('background:' + bwHex(bg));
  if (/^(table|td|th)$/i.test(el.tagName)){ const w = el.getBoundingClientRect().width; if (w) o.push('width:' + (w * 0.75).toFixed(0) + 'pt'); if (/^table$/i.test(el.tagName)) o.push('border-collapse:' + (cs.borderCollapse || 'collapse')); }
  if (/^(p|div|section)$/i.test(el.tagName) && !o.some(x=>/^margin-top/.test(x))) o.push('margin-top:0;margin-bottom:0');
  return o.concat(extra || []).join(';');
}
/* ширина пропуску (порожній <i class="fb-f">) → підкреслені нерозривні пробіли */
function bwGap(el, nb){ const w = el.getBoundingClientRect().width; const n = Math.max(2, Math.round(w / nb)); return '<span style="text-decoration:underline">' + (n > 30 ? (' '.repeat(28) + ' ').repeat(Math.floor(n / 29)) : ' '.repeat(n)) + '</span>'; }
function bwPseudo(el, which){ if (/jsdom/i.test(navigator.userAgent)) return ''; try{ const c = getComputedStyle(el, which).content; if (c && c !== 'none' && c !== 'normal') return bwEsc(c.replace(/^["']|["']$/g, '')); }catch(e){} return ''; }
function bwNode(n, nb){
  if (n.nodeType === 3) return bwEsc(n.nodeValue).replace(/_{3,}/g, m=>'<span style="text-decoration:underline">' + '\u00a0'.repeat(m.length * 2) + '</span>');
  if (n.nodeType !== 1) return '';
  const tag = n.tagName.toLowerCase(), cs = getComputedStyle(n);
  if (cs.display === 'none' || /^(script|style)$/.test(tag)) return '';
  if (!n.childNodes.length && !n.textContent && cs.display === 'inline-block' && bwPx(cs.borderBottomWidth) > 0) return bwGap(n, nb);
  const flex = /flex|grid/.test(cs.display);
  { /* ряд окремих клітинок-рамок (коди, дата) — одна таблиця в рядок */
    const ek = [...n.children];
    if (!/^(tr|table|tbody|thead|tfoot)$/.test(tag) && ek.length >= 2 && ek.length === n.childNodes.length && ek.every(e=>{ const c = getComputedStyle(e); return !e.children.length && ['top','right','bottom','left'].every(x=>bwPx(c.getPropertyValue('border-' + x + '-width')) > 0); })){
      /* клітинки-квадрати коду/дати у Word незручні для вписування — замість них один підкреслений пропуск тієї ж ширини */
      return bwGap({getBoundingClientRect:()=>n.getBoundingClientRect()}, nb);
    }
  }
  let inner = bwPseudo(n, '::before');
  const kids = [...n.childNodes];
  if (flex && cs.justifyContent === 'space-between' && kids.filter(k=>k.nodeType === 1).length === 2){
    const [a, b] = kids.filter(k=>k.nodeType === 1);
    return '<table width="100%" style="border-collapse:collapse"><tr><td>' + bwNode(a, nb) + '</td><td style="text-align:right">' + bwNode(b, nb) + '</td></tr></table>';
  }
  if (/^(td|th)$/.test(tag) && !kids.length) inner += '&nbsp;';
  const blk = e=>e && e.nodeType === 1 && !/^inline/.test(getComputedStyle(e).display);
  kids.forEach((k, ki)=>{ if (k.nodeType === 3 && !/\S/.test(k.nodeValue) && (ki === 0 || ki === kids.length - 1 || blk(kids[ki - 1]) || blk(kids[ki + 1]))) return;
    inner += bwNode(k, nb); if (flex && /^row/.test(cs.flexDirection) && k.nodeType === 1 && k !== kids[kids.length - 1]) inner += '\u00a0\u00a0\u00a0'; }); inner += bwPseudo(n, '::after');
  let t = tag === 'p' ? 'div' : tag, extra = [];
  const boxed = /^(div|p|section)$/.test(tag) && ['top','right','bottom','left'].some(x=>bwPx(cs.getPropertyValue('border-' + x + '-width')) > 0 && cs.getPropertyValue('border-' + x + '-style') !== 'none');
  if (flex){ t = /^(div|li|td|th)$/.test(tag) ? tag : 'div'; const g = bwPx(cs.columnGap); if (g) extra.push('word-spacing:' + (g * 0.375).toFixed(1) + 'pt'); }
  if (tag === 'section') t = 'div';
  if (!kids.length && !n.textContent && /^(div|p)$/.test(t) && bwPx(cs.height) > 0) extra.push('height:' + Math.min(26, bwPx(cs.height) * 0.75).toFixed(1) + 'pt');
  if (cs.breakBefore === 'page') extra.push('page-break-before:always');
  if (cs.breakInside === 'avoid') extra.push('page-break-inside:avoid');
  const at = /^(td|th)$/.test(tag) ? [' width="' + Math.round(n.getBoundingClientRect().width) + '"', n.colSpan > 1 ? ' colspan="' + n.colSpan + '"' : '', n.rowSpan > 1 ? ' rowspan="' + n.rowSpan + '"' : ''].join('') : '';
  const tb = tag === 'table' ? ' cellspacing="0" cellpadding="0"' : '';
  if (/^(br|hr|img)$/.test(tag)) return '<' + tag + '>';
  if (boxed){
    const bd = [], pd = [];
    ['top','right','bottom','left'].forEach(x=>{
      const w = bwPx(cs.getPropertyValue('border-' + x + '-width')), st = cs.getPropertyValue('border-' + x + '-style');
      if (w > 0 && st !== 'none') bd.push('border-' + x + ':' + Math.max(0.5, w * 0.75).toFixed(1) + 'pt solid ' + bwHex(cs.getPropertyValue('border-' + x + '-color')));
      const p = bwPx(cs.getPropertyValue('padding-' + x)); if (p) pd.push('padding-' + x + ':' + (p * 0.75).toFixed(1) + 'pt');
    });
    const hh = !kids.length && !n.textContent && bwPx(cs.height) > 0 ? 'height:' + Math.min(26, bwPx(cs.height) * 0.75).toFixed(1) + 'pt;' : '';
    const av = n.classList.contains('fb-diary') ? 'page-break-inside:avoid;' : '';
    const full = ['top','right','bottom','left'].every(x=>bwPx(cs.getPropertyValue('border-' + x + '-width')) > 0);
    const sp = full && !av ? '<div style="margin:0;font-size:3pt;line-height:3pt">&nbsp;</div>' : '';
    return '<table width="100%" cellspacing="0" cellpadding="0" style="' + av + 'border-collapse:collapse;width:100%;margin:0"><tr style="' + av + '"><td style="' + bd.join(';') + ';' + pd.join(';') + ';' + hh + bwStyle(n, cs, extra, true) + '">' + (inner || '&nbsp;') + '</td></tr></table>' + sp;
  }
  return '<' + t + at + tb + ' style="' + bwStyle(n, cs, extra) + '">' + inner + '</' + t + '>';
}
function blanksWordHtml(keys){
  const L = FBLANKS.filter(b=>(keys || []).includes(b.k)); if (!L.length) return '';
  const probe = document.createElement('span'); probe.textContent = ' '.repeat(20);
  let sect = '', css = '', i = 0;
  L.forEach(b=>{
    const host = document.createElement('div'); host.className = b.cls;
    host.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + (/fbk-d|fbk-g/.test(b.cls) ? '196mm' : '184mm') + ';background:#fff';
    host.innerHTML = b.html; document.body.append(host); BW_LH = /fbk-d/.test(b.cls) ? 0.74 : 1;
    const nb = (() => { host.append(probe); const w = probe.getBoundingClientRect().width / 20; probe.remove(); return w || 3; })();
    const wide = /fbk-d/.test(b.cls), land = !!host.querySelector('[data-landscape]');
    const mar = wide ? '5mm 7mm 5mm 7mm' : '10mm 10mm 10mm 15mm';
    css += '@page S' + i + '{size:' + (land ? '297mm 210mm' : '210mm 297mm') + ';margin:' + mar + ';mso-page-orientation:' + (land ? 'landscape' : 'portrait') + '}div.S' + i + '{page:S' + i + '}\n';
    sect += '<div class="S' + i + '"' + (i ? ' style="page-break-before:always"' : '') + '>' + [...host.childNodes].map(k=>bwNode(k, nb)).join('') + '</div>\n';
    host.remove(); i++;
  });
  BW_LH = 1;
  return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"><title>Порожні бланки</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
    '<style>' + css + 'body{font-family:"Times New Roman",serif}p{margin:0}</style></head><body>' + sect + '</body></html>';
}
function blankFileName(b){ return String(b.t || b.k).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) + '.doc'; }
async function blanksWord(keys){
  const L = FBLANKS.filter(b=>(keys || []).includes(b.k)); if (!L.length){ toast('Позначте хоча б один бланк'); return false; }
  for (let i = 0; i < L.length; i++){   /* кожен бланк — окремий файл з його назвою */
    const html = blanksWordHtml([L[i].k]); if (!html) continue;
    await saveFile(new TextEncoder().encode('\ufeff' + html), blankFileName(L[i]), 'application/msword', 'Бланк «' + L[i].t + '»');
    if (i < L.length - 1) await new Promise(r=>setTimeout(r, 400));
  }
  toast('Готово. У Word: клікніть на лінію і пишіть; варіант — виділіть і натисніть Ctrl+B або Ctrl+U', 7000);
  return true;
}
/* окрема кнопка «📄 Бланки» поруч із «Новий» — щоб не шукати в меню «⋯» */
try{
  const nw = document.getElementById('clearAll');
  if (nw && !document.getElementById('blanksTop')){
    const b = h('button', {type:'button', class:'btn', id:'blanksTop', title:'Порожні бланки: друк або збереження у Word для заповнення вручну', onclick:()=>blanksDialog()}, '📄 Бланки');
    nw.after(b);
  }
}catch(e){}
