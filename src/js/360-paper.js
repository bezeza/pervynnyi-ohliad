/* ===== Аркуш: перегляд «як на папері» ===== */
let PAPER = false; try{ PAPER = localStorage.getItem('po.paper') === '1'; }catch(e){}
function fillSheet(P){
  const H = formHeader(), lm = (()=>{ try{ return localStorage.getItem('po.zlogomode') || 'color'; }catch(e){ return 'color'; } })(), logo = lm === 'none' ? '' : (()=>{ try{ return localStorage.getItem('po.zlogo') || ''; }catch(e){ return ''; } })();
  P.innerHTML = '';
  P.append(h('div', {class:'pr-top'}, h('div', {class:'pr-l'}, logo ? h('img', {class:'pr-logo' + (lm === 'bw' ? ' bw' : ''), src:logo, alt:''}) : '', h('div', {}, ...H.left.flatMap((l,k)=>k ? [h('br'), l] : [l]))), h('div', {class:'r'}, ...H.right.flatMap((l,k)=>k ? [h('br'), l] : [l]))),
    H.card ? h('p', {class:'pr-card'}, H.card) : '', H.pat ? h('p', {class:'pr-pat'}, H.pat) : '');
  const body = h('div', {class:'pr-body'}); body.innerHTML = $('#out').innerHTML; P.append(body);
}
function renderPaper(){
  const pp = $('#paper'); if (!pp) return;
  $('#out').hidden = PAPER; pp.hidden = !PAPER; $('#outBox').classList.toggle('paperon', PAPER);
  const b = $('#paperBtn'); if (b) b.setAttribute('aria-pressed', PAPER ? 'true' : 'false');
  if (!PAPER) return;
  const sheet = pp.querySelector('.sheet'); fillSheet(sheet);
  if (!itext($('#out')).trim()) sheet.querySelector('.pr-body').append(h('p', {class:'chips-hint'}, 'Текст документа з’явиться тут, щойно заповните форму.'));
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

