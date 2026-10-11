/* ================= ЗБЕРЕЖЕННЯ ДОКУМЕНТА У WORD (.docx) — без інтернету ================= */
const CRC_T = (()=>{ const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b){ let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files){            // ZIP без стиснення: [{name, data:Uint8Array}]
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = n => [n & 255, (n >>> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  for (const f of files){
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0)];
    const lh = new Uint8Array([...u32(0x04034b50), ...common]);
    parts.push(lh, nm, f.data);
    cen.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
    off += lh.length + nm.length + sz;
  }
  const cenLen = cen.reduce((a,b)=>a + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cenLen), ...u32(off), ...u16(0)]);
  const all = [...parts, ...cen, end], out = new Uint8Array(all.reduce((a,b)=>a + b.length, 0)); let p = 0;
  for (const a of all){ out.set(a, p); p += a.length; }
  return out;
}
const xe = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BLOCK = /^(DIV|P|H1|H2|H3|LI|UL|OL)$/;
/* Модель документа: абзаци з вирівнюванням і фрагментами тексту (жирний/курсив/підкреслений/розмір) */
function runsOf(node, st, out){
  if (node.nodeType === 3){ const t = node.nodeValue.replace(/ /g, ' '); if (t) out.push(Object.assign({t}, st)); return; }
  if (node.nodeType !== 1) return;
  if (node.tagName === 'BR'){ out.push({br:true}); return; }
  const n = Object.assign({}, st), tg = node.tagName, sty = node.style || {};
  if (tg === 'B' || tg === 'STRONG' || /bold|[6-9]00/.test(sty.fontWeight || '')) n.b = true;
  else if (/normal|[1-4]00/.test(sty.fontWeight || '')) n.b = false;
  if (tg === 'I' || tg === 'EM' || sty.fontStyle === 'italic') n.i = true;
  else if (sty.fontStyle === 'normal') n.i = false;
  if (tg === 'U' || tg === 'INS' || /underline/.test(sty.textDecoration || sty.textDecorationLine || '')) n.u = true;
  const fs = /([\d.]+)(pt|px)/.exec(sty.fontSize || '');
  if (fs) n.sz = fs[2] === 'px' ? Math.round(parseFloat(fs[1]) * 0.75 * 2) / 2 : parseFloat(fs[1]);
  else if (tg === 'FONT' && node.getAttribute('size')) n.sz = {1:8, 2:10, 3:12, 4:14, 5:18, 6:24, 7:36}[node.getAttribute('size')] || n.sz;
  node.childNodes.forEach(c=>runsOf(c, n, out));
}
function para(node, align){
  const runs = []; runsOf(node, {}, runs);
  while (runs.length && runs[runs.length - 1].br) runs.pop();     // <div>текст<br></div>
  return {align: ['center','right','justify'].includes(align) ? align : '', runs};
}
function docModel(){
  const root = $('#out'), paras = [];
  const walk = (el, inh) => {
    let inline = [];
    const flush = ()=>{ if (inline.length){ const w = document.createElement('div'); inline.forEach(n=>w.append(n.cloneNode(true))); paras.push(para(w, inh)); inline = []; } };
    el.childNodes.forEach(c=>{
      if (c.nodeType === 1 && BLOCK.test(c.tagName)){
        flush();
        const al = (c.style && c.style.textAlign) || c.getAttribute('align') || inh;
        if ([...c.childNodes].some(x=>x.nodeType === 1 && BLOCK.test(x.tagName))) walk(c, al); else paras.push(para(c, al));
      } else inline.push(c);
    });
    flush();
  };
  walk(root, '');
  const head = formHeader();
  return {head, paras};
}
function docTitle(){ return {gosp:'Направлення на госпіталізацію', pam:'Пам’ятка пацієнту', zav:'Огляд завідувача / спільний огляд', konc:'Протокол консиліуму', etap:'Етапний епікриз', per:'Переказний епікриз', napr:'Направлення на консультацію', dov:'Довідка', zgoda:'Інформована згода', rx:'Лист призначень', ohl: MODE === 'amb' ? 'Первинний огляд (амбулаторно)' : 'Первинний огляд', shch: MODE === 'amb' ? 'Повторний огляд' : 'Щоденник', epi:'Виписний епікриз', kons:'Консультаційний висновок'}[DOC]; }

/* Логотип закладу для Word / LibreOffice: PNG (з ч/б за потреби), висота 1,6 см */
async function logoForDoc(){
  let src = '', mode = 'color'; try{ src = localStorage.getItem('po.zlogo') || ''; mode = localStorage.getItem('po.zlogomode') || 'color'; }catch(e){}
  if (!src || mode === 'none') return null;
  try{
    const img = await new Promise((res, rej)=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = rej; i.src = src; });
    const w0 = img.naturalWidth || 200, h0 = img.naturalHeight || 200, k = Math.min(1, 400 / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    const x = c.getContext('2d'); if (!x) return null;
    x.drawImage(img, 0, 0, c.width, c.height);
    if (mode === 'bw'){ const d = x.getImageData(0, 0, c.width, c.height), a = d.data; for (let i = 0; i < a.length; i += 4){ const g = Math.round(0.299 * a[i] + 0.587 * a[i+1] + 0.114 * a[i+2]); a[i] = a[i+1] = a[i+2] = g; } x.putImageData(d, 0, 0); }
    const url = c.toDataURL('image/png'), bin = atob(url.split(',')[1]), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const hcm = 1.6, wcm = Math.min(3.2, hcm * c.width / c.height);
    return {bytes, wcm, hcm: wcm < hcm * c.width / c.height ? wcm * c.height / c.width : hcm};
  }catch(e){ return null; }
}
/* ---- Word (.docx) ---- */
function makeDocx(LOGO){
  const M = docModel(), enc = new TextEncoder();
  const run = r => r.br ? '<w:r><w:br/></w:r>' : (()=>{ const pr = (r.b ? '<w:b/>' : '') + (r.i ? '<w:i/>' : '') + (r.u ? '<w:u w:val="single"/>' : '') + (r.sz ? `<w:sz w:val="${Math.round(r.sz*2)}"/><w:szCs w:val="${Math.round(r.sz*2)}"/>` : '');
    return `<w:r>${pr ? '<w:rPr>' + pr + '</w:rPr>' : ''}<w:t xml:space="preserve">${xe(r.t)}</w:t></w:r>`; })();
  const jc = {center:'center', right:'right', justify:'both'};
  const H = M.head;
  const sp = (t, al) => `<w:p><w:pPr><w:jc w:val="${al}"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r></w:p>`;
  const cell = (lines, al, pct) => `<w:tc><w:tcPr><w:tcW w:w="${pct || 2500}" w:type="pct"/></w:tcPr>${lines.map(l=>sp(l, al)).join('')}</w:tc>`;
  const EMU = cm => Math.round(cm * 360000);
  const pic = LOGO ? `<w:tc><w:tcPr><w:tcW w:w="700" w:type="pct"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${EMU(LOGO.wcm)}" cy="${EMU(LOGO.hcm)}"/><wp:docPr id="1" name="Логотип"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${EMU(LOGO.wcm)}" cy="${EMU(LOGO.hcm)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:tc>` : '';
  let body = '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>'
    + (LOGO ? '<w:tblGrid><w:gridCol w:w="1350"/><w:gridCol w:w="4144"/><w:gridCol w:w="4144"/></w:tblGrid>' : '<w:tblGrid><w:gridCol w:w="4819"/><w:gridCol w:w="4819"/></w:tblGrid>')
    + `<w:tr>${pic}${cell(H.left, 'left', LOGO ? 2150 : 2500)}${cell(H.right, 'right', LOGO ? 2150 : 2500)}</w:tr></w:tbl>`
    + (H.card ? `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${xe(H.card)}</w:t></w:r></w:p>` : '')
    + (H.pat ? `<w:p><w:pPr><w:spacing w:before="80"/></w:pPr><w:r><w:t xml:space="preserve">${xe(H.pat)}</w:t></w:r></w:p>` : '')
    + '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr><w:spacing w:after="120"/></w:pPr></w:p>';
  body += M.paras.map(p=>`<w:p>${p.align ? `<w:pPr><w:jc w:val="${jc[p.align]}"/></w:pPr>` : ''}${p.runs.map(run).join('')}</w:p>`).join('');
  const docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body
    + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA"/></w:rPr></w:rPrDefault>'
    + '<w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + (LOGO ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : '') + '</Relationships>';
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + `<dc:title>${xe(docTitle())}</dc:title><dc:creator>${xe(mv('doc') || '')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
  return zipStore([
    {name:'[Content_Types].xml', data:enc.encode(ct)}, {name:'_rels/.rels', data:enc.encode(rels)}, {name:'docProps/core.xml', data:enc.encode(core)},
    {name:'word/document.xml', data:enc.encode(docXml)}, {name:'word/styles.xml', data:enc.encode(styles)}, {name:'word/_rels/document.xml.rels', data:enc.encode(drels)},
    ...(LOGO ? [{name:'word/media/logo.png', data:LOGO.bytes}] : [])]);
}

/* ---- LibreOffice (.odt) ---- */
function makeOdt(LOGO){
  const M = docModel(), enc = new TextEncoder();
  const NS = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.3"';
  const tstyles = {}; let tn = 0;
  const tstyle = r => { const k = (r.b ? 'b' : '') + (r.i ? 'i' : '') + (r.u ? 'u' : '') + (r.sz ? 's' + r.sz : ''); if (!k) return ''; if (!tstyles[k]) tstyles[k] = {name:'T' + (++tn), r}; return tstyles[k].name; };
  const sp = t => xe(t).replace(/ {2,}/g, m=>' <text:s text:c="' + (m.length - 1) + '"/>').replace(/\t/g, '<text:tab/>');
  const run = r => { if (r.br) return '<text:line-break/>'; const st = tstyle(r); return st ? `<text:span text:style-name="${st}">${sp(r.t)}</text:span>` : sp(r.t); };
  const pst = {center:'Pc', right:'Pr', justify:'Pj', '':'Standard'};
  const H = M.head;
  const cell = (lines, st) => `<table:table-cell office:value-type="string">${lines.map(l=>`<text:p text:style-name="${st}">${sp(l)}</text:p>`).join('')}</table:table-cell>`;
  const lcell = LOGO ? `<table:table-cell office:value-type="string"><text:p text:style-name="Ps"><draw:frame draw:name="Логотип" text:anchor-type="as-char" svg:width="${LOGO.wcm.toFixed(2)}cm" svg:height="${LOGO.hcm.toFixed(2)}cm"><draw:image xlink:href="Pictures/logo.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame></text:p></table:table-cell>` : '';
  let body = `<table:table table:name="Шапка" table:style-name="Th">${LOGO ? '<table:table-column table:style-name="Tc0"/><table:table-column table:style-name="Tc1" table:number-columns-repeated="2"/>' : '<table:table-column table:number-columns-repeated="2"/>'}<table:table-row>${lcell}${cell(H.left, 'Ps')}${cell(H.right, 'PsR')}</table:table-row></table:table>`
    + (H.card ? `<text:p text:style-name="Pcard">${sp(H.card)}</text:p>` : '') + (H.pat ? `<text:p text:style-name="Ppat">${sp(H.pat)}</text:p>` : '') + '<text:p text:style-name="Pline"/>';
  body += M.paras.map(p=>`<text:p text:style-name="${pst[p.align]}">${p.runs.map(run).join('')}</text:p>`).join('');
  const tdefs = Object.values(tstyles).map(({name, r})=>`<style:style style:name="${name}" style:family="text"><style:text-properties${r.b ? ' fo:font-weight="bold" style:font-weight-complex="bold"' : ''}${r.i ? ' fo:font-style="italic"' : ''}${r.u ? ' style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"' : ''}${r.sz ? ` fo:font-size="${r.sz}pt"` : ''}/></style:style>`).join('');
  const pdefs = '<style:style style:name="Pc" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="center"/></style:style>'
    + '<style:style style:name="Pr" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="end"/></style:style>'
    + '<style:style style:name="Pj" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="justify"/></style:style>'
    + '<style:style style:name="Ps" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="start" fo:margin-bottom="0cm"/><style:text-properties fo:font-size="9pt"/></style:style>'
    + '<style:style style:name="PsR" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="end" fo:margin-bottom="0cm"/><style:text-properties fo:font-size="9pt"/></style:style>'
    + '<style:style style:name="Th" style:family="table"><style:table-properties style:width="17cm" table:align="margins"/></style:style>'
    + '<style:style style:name="Tc0" style:family="table-column"><style:table-column-properties style:column-width="2.4cm"/></style:style><style:style style:name="Tc1" style:family="table-column"><style:table-column-properties style:column-width="7.3cm"/></style:style>'
    + '<style:style style:name="Pcard" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="center" fo:margin-top="0.25cm" fo:margin-bottom="0cm"/><style:text-properties fo:font-size="10pt"/></style:style>'
    + '<style:style style:name="Ppat" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-top="0.2cm"/></style:style>'
    + '<style:style style:name="Pline" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:border-bottom="0.5pt solid #000000" fo:padding-bottom="0.05cm" fo:margin-bottom="0.2cm"/></style:style>';
  const content = `<?xml version="1.0" encoding="UTF-8"?><office:document-content ${NS}><office:automatic-styles>${pdefs}${tdefs}</office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:document-content>`;
  const styles = `<?xml version="1.0" encoding="UTF-8"?><office:document-styles ${NS}>`
    + '<office:font-face-decls><style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;" style:font-family-generic="roman"/></office:font-face-decls>'
    + '<office:styles><style:default-style style:family="paragraph"><style:paragraph-properties fo:margin-bottom="0.1cm" fo:text-align="justify" fo:line-height="110%"/><style:text-properties style:font-name="Times New Roman" fo:font-size="12pt" fo:language="uk" fo:country="UA"/></style:default-style>'
    + '<style:style style:name="Standard" style:family="paragraph" style:class="text"/></office:styles>'
    + '<office:automatic-styles><style:page-layout style:name="pm1"><style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2.5cm" fo:margin-right="1.5cm"/></style:page-layout></office:automatic-styles>'
    + '<office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"/></office:master-styles></office:document-styles>';
  const manifest = '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">'
    + '<manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.text"/>'
    + '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>'
    + (LOGO ? '<manifest:file-entry manifest:full-path="Pictures/logo.png" manifest:media-type="image/png"/>' : '') + '</manifest:manifest>';
  return zipStore([   // mimetype має бути першим і без стиснення
    {name:'mimetype', data:enc.encode('application/vnd.oasis.opendocument.text')},
    {name:'META-INF/manifest.xml', data:enc.encode(manifest)}, {name:'content.xml', data:enc.encode(content)}, {name:'styles.xml', data:enc.encode(styles)},
    ...(LOGO ? [{name:'Pictures/logo.png', data:LOGO.bytes}] : [])]);
}

function docFileName(ext){
  const d = (mv('dt') || '').split('T')[0] || new Date().toISOString().slice(0,10);
  const who = (mv('pib') || '').split(/\s+/)[0] || '';
  return [docTitle(), who, d].filter(Boolean).join(' ').replace(/[\\/:*?"<>|]+/g, ' ') + '.' + ext;
}
async function saveFile(bytes, name, mime, label){
  let framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  if (framed){
    let dl = null; try{ dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; }catch(e){}
    if (!dl){ toast('Тут збереження файлу недоступне. Скористайтеся збереженим файлом pervynnyi-ohliad.html або кнопкою «Копіювати».', 6000); return; }
    try{ await dl.save({filename:name, data:bytes}); toast(label + ' збережено'); }
    catch(e){ const c = e && e.code;
      toast(c === 'declined' ? 'Збереження скасовано' : c === 'rate_limited' ? 'Вікно збереження вже відкрите'
        : c === 'rejected_extension' || c === 'extension_not_enabled' ? 'Цей формат в онлайн-версії недоступний. Збережіть у Word — LibreOffice його відкриває, або скористайтеся офлайн-файлом.'
        : 'Не вдалося зберегти тут. Скористайтеся кнопкою «Копіювати».', 6000); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes], {type:mime}));
  a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  toast(label + ' збережено');
}
async function saveDocx(){
  chkWarn();
  if (!itext($('#out')).trim()){ toast('Текст порожній'); return; }
  await saveFile(makeDocx(await logoForDoc()), docFileName('docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Документ Word');
}
async function saveOdt(){
  chkWarn();
  if (!itext($('#out')).trim()){ toast('Текст порожній'); return; }
  await saveFile(makeOdt(await logoForDoc()), docFileName('odt'), 'application/vnd.oasis.opendocument.text', 'Документ LibreOffice');
}

