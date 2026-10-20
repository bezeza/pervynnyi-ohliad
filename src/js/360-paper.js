/* ===== Аркуш: перегляд «як на папері» ===== */
let PAPER = false; try{ PAPER = localStorage.getItem('po.paper') === '1'; }catch(e){}
function fillSheet(P, gaps){
  if (typeof blankOn === 'function' && blankOn()){   // бланк закладу 003/о замість тексту
    P.innerHTML = ''; BGAP = !!gaps && GAPS;
    try{ blankPages().forEach(pg=>P.append(pg)); } finally { BGAP = false; }
    if (gaps) markGaps(P, null);
    return;
  }
  const H = formHeader(), lm = (()=>{ try{ return localStorage.getItem('po.zlogomode') || 'color'; }catch(e){ return 'color'; } })(), logo = lm === 'none' ? '' : (()=>{ try{ return localStorage.getItem('po.zlogo') || ''; }catch(e){ return ''; } })();
  P.innerHTML = '';
  P.append(h('div', {class:'pr-top'}, h('div', {class:'pr-l'}, logo ? h('img', {class:'pr-logo' + (lm === 'bw' ? ' bw' : ''), src:logo, alt:''}) : '', h('div', {}, ...H.left.flatMap((l,k)=>k ? [h('br'), l] : [l]))), h('div', {class:'r'}, ...H.right.flatMap((l,k)=>k ? [h('br'), l] : [l]))),
    H.card ? h('p', {class:'pr-card'}, H.card) : '', H.pat ? h('p', {class:'pr-pat'}, H.pat) : '');
  const body = h('div', {class:'pr-body'}); body.innerHTML = $('#out').innerHTML; P.append(body);
  if (gaps) markGaps(P, body);
}
/* ===== Пропуски на аркуші: те саме, що «Перевірка перед підписом», — жовтим на своєму місці; натискання веде до поля.
   Лише на екрані: у друк, копіювання й файли не потрапляє. ===== */
let GAPS = true; try{ GAPS = localStorage.getItem('po.gaps') !== '0'; }catch(e){}
function gapMark(t, tab, fld){
  const m = h(tab ? 'button' : 'span', tab ? {type:'button', class:'gap', title:'Перейти до поля', onclick:()=>goTab(tab, fld)} : {class:'gap'}, t);
  return m;
}
function markGaps(P, body){
  if (!itext($('#out')).trim()) return;
  const L = checkDoc(), rest = [];
  const tog = h('button', {type:'button', class:'more gaptog', onclick:()=>{ GAPS = !GAPS; try{ localStorage.setItem('po.gaps', GAPS ? '1' : '0'); }catch(e){} renderPaper(); }},
    GAPS ? 'сховати' : 'показати');
  P.insertBefore(h('p', {class:'gapbar' + (L.length ? '' : ' ok')}, L.length ? `Пропусків і зауважень: ${L.length} · ` : 'Пропусків немає', L.length ? tog : ''), P.firstChild);
  if (!GAPS || !L.length) return;
  if (!body){   // бланк: перелік пропусків над сторінками, кожен веде до свого поля
    const first = P.querySelector('.b003');
    P.insertBefore(h('div', {class:'gaplist'}, h('b', {}, 'Ще не заповнено: '), ...L.flatMap((x,i)=>[i ? '; ' : '', gapMark(x.m, x.tab, x.f)])), first);
    return;
  }
  L.forEach(x=>{
    if (/^Залишилось незаповнених «…»/.test(x.m)) return;   // «…» підсвічуються на своєму місці нижче
    if (x.tab === 'meta' && /ПІБ пацієнта/.test(x.m)){ const pp = P.querySelector('.pr-pat'); if (pp){ pp.append(' ', gapMark('ПІБ не вказано', 'meta', 'meta_pib')); return; } }
    const sec = x.tab && [...body.querySelectorAll('[data-sec="' + x.tab + '"]')].pop();
    if (sec) sec.append(h('div', {class:'gaprow'}, gapMark(x.m, x.tab, x.f))); else rest.push(x);
  });
  const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT), nodes = [];
  while (tw.nextNode()) if (tw.currentNode.nodeValue.includes('…')) nodes.push(tw.currentNode);
  nodes.forEach(n=>{ const frag = document.createDocumentFragment();
    n.nodeValue.split('…').forEach((s,i,a)=>{ if (s) frag.append(s); if (i < a.length - 1) frag.append(h('span', {class:'gap dots', title:'Не заповнено'}, '…')); });
    n.replaceWith(frag); });
  if (rest.length) body.prepend(h('div', {class:'gaplist'}, h('b', {}, 'Ще не заповнено: '), ...rest.flatMap((x,i)=>[i ? '; ' : '', gapMark(x.m, x.tab, x.f)])));
}
function renderPaper(){
  const pp = $('#paper'); if (!pp) return;
  $('#out').hidden = PAPER; pp.hidden = !PAPER; $('#outBox').classList.toggle('paperon', PAPER);
  const b = $('#paperBtn'); if (b) b.setAttribute('aria-pressed', PAPER ? 'true' : 'false');
  if (!PAPER) return;
  const sheet = pp.querySelector('.sheet'); fillSheet(sheet, true);
  sheet.classList.toggle('blankmode', typeof blankOn === 'function' && blankOn());
  { const old = pp.querySelector('.blankbar'); if (old) old.remove(); if (typeof blankBar === 'function' && blankOK()) pp.insertBefore(blankBar(), sheet); }
  const pb = sheet.querySelector('.pr-body');
  if (pb && !itext($('#out')).trim()) pb.append(h('p', {class:'chips-hint'}, 'Текст документа з’явиться тут, щойно заповните форму.'));
}
function zlogoSet(file){
  if (!file) return; if (file.size > 400000){ toast('Зображення завелике: до 400 КБ (PNG або JPG)', 4000); return; }
  const rd = new FileReader(); rd.onload = () => { try{ localStorage.setItem('po.zlogo', rd.result); toast('Логотип закладу збережено'); }catch(e){ toast('Не вдалося зберегти логотип: браузер обмежив сховище', 5000); } zlogoRender(); renderPaper(); }; rd.readAsDataURL(file);
}
function zlogoRender(){ document.querySelectorAll('.zlogobox').forEach(b=>{ let l = ''; try{ l = localStorage.getItem('po.zlogo') || ''; }catch(e){}
  b.innerHTML = ''; const fi = h('input', {type:'file', accept:'image/png,image/jpeg,image/svg+xml', hidden:'', onchange:e=>{ zlogoSet(e.target.files[0]); e.target.value = ''; }});
  let lm = 'color'; try{ lm = localStorage.getItem('po.zlogomode') || 'color'; }catch(e){}
  const ms = h('select', {'aria-label':'Логотип у документах', style:'width:auto', onchange:e=>{ try{ localStorage.setItem('po.zlogomode', e.target.value); }catch(x){} zlogoRender(); renderPaper(); }}, h('option', {value:'color'}, 'Кольоровий'), h('option', {value:'bw'}, 'Чорно-білий'), h('option', {value:'none'}, 'Без логотипа')); ms.value = lm;
  b.append(l ? h('img', {src:l, alt:'Логотип закладу', class:'zlogo-prev' + (lm === 'bw' ? ' bw' : '') + (lm === 'none' ? ' off' : '')}) : h('span', {class:'chips-hint'}, 'Логотип не завантажено'), fi,
    h('button', {type:'button', class:'btn', onclick:()=>fi.click()}, l ? 'Замінити' : 'Завантажити логотип'),
    l ? ms : '', l ? h('button', {type:'button', class:'more', onclick:()=>{ try{ localStorage.removeItem('po.zlogo'); }catch(e){} zlogoRender(); renderPaper(); }}, 'Прибрати') : ''); }); }

