/* ===== 0.9.3.80 — стиль «Apple», далі:
   • шапка в один рядок: картка пацієнта (ПІБ, діагноз, алергії, обстеження, «＋ Новий») — угорі бічної панелі
     («Робоче місце»); без бічної панелі — рядок під шапкою, як було;
   • права панель — на всю висоту вікна (кнопки «Копіювати», «Друк» завжди видно);
   • адреса — одним полем: «с. Оржиця, вул. Шевченка, 5, Лубенський р-н, Полтавська обл.» розкладається на поля
     для бланків сама; поля — під «Розбити на поля»;
   • пошук по всьому (Ctrl+K) — кнопкою в шапці. «Класичний» стиль — як було. ===== */
const UIM = {};
const uimOn = () => typeof UISTYLE !== 'undefined' && UISTYLE === 'ios';
/* 1. картка пацієнта в бічній панелі */
function ptPlace(){
  const line = document.getElementById('ptline'), side = document.querySelector('#sidecol > .sidein'), wrap = document.querySelector('main.wrap');
  if (!line || !wrap) return;
  const want = !!side && uimOn() && document.body.classList.contains('lay-B') && window.innerWidth >= 900;
  if (want){ const fb = side.querySelector('.sidefold-btn');
    if (line.parentElement !== side){ UIM.home = {p:line.parentElement, n:line.nextSibling}; }
    if (line.parentElement !== side || line.previousElementSibling !== fb){ if (fb) fb.after(line); else side.prepend(line); } }
  else if (UIM.home && line.parentElement === side){ const {p, n} = UIM.home; if (n && n.parentNode === p) p.insertBefore(line, n); else wrap.before(line); UIM.home = null; }
  document.documentElement.classList.toggle('pt-side', want);
  if (!want) try{ document.documentElement.style.setProperty('--pbh', line.offsetHeight + 'px'); }catch(e){}
}
/* 2. права панель — до низу вікна */
function outFit(){
  const o = document.getElementById('outBox'); if (!o) return;
  if (!uimOn() || window.innerWidth < 900 || getComputedStyle(o).position !== 'sticky'){ if (o.style.maxHeight) o.style.maxHeight = ''; return; }
  const top = Math.max(o.getBoundingClientRect().top, 0), mh = Math.max(360, Math.round(window.innerHeight - top - 12)) + 'px';
  if (o.style.maxHeight !== mh) o.style.maxHeight = mh;
}
{ let rq = 0; const soon = () => { if (rq) return; rq = requestAnimationFrame(()=>{ rq = 0; outFit(); }); };
  window.addEventListener('scroll', soon, {passive:true}); window.addEventListener('resize', ()=>{ ptPlace(); soon(); }); UIM.soon = soon; }
/* 3. адреса одним полем */
function addrParse(s){
  const o = {np_t:'', np:'', hr:'', ra:'', ob:'', st:'', zip:''}, rest = [];
  String(s || '').split(/[,;]+/).map(x=>x.trim()).filter(Boolean).forEach(p=>{
    let m;
    if (!o.zip && /^\d{5}$/.test(p)){ o.zip = p; return; }
    if (!o.ob && /(^|\s)(обл\.?|область)(\s|$)/i.test(p)){ o.ob = p; return; }
    if (!o.ra && /(^|\s)(р-н|район)(\s|$)/i.test(p)){ o.ra = p; return; }
    if (!o.hr && /громад|(^|\s)(тг|отг)(\s|$)/i.test(p)){ o.hr = p; return; }
    if (!o.np && (m = p.match(/^(м\.|місто|смт|с-ще|селище|с\.|село)\s*(.+)$/i))){ const t = m[1].toLowerCase(); o.np_t = /^м/.test(t) ? 'м.' : t === 'смт' ? 'смт' : /^(с-ще|селище)$/.test(t) ? 'с-ще' : 'с.'; o.np = m[2].trim(); return; }
    rest.push(p);
  });
  if (!o.np && rest.length && !/^(вул|пров|просп|бульв|бул\.|пл\.|майдан|буд|кв|\d)/i.test(rest[0])) o.np = rest.shift();
  o.st = rest.join(', ');
  return o;
}
function addrFromLine(){
  const a = document.getElementById('meta_addr'); if (!a) return;
  const ids = ADDR.map(([k])=>'meta_addr_' + k), els = ids.map(id=>document.getElementById(id));
  if (els.some(e=>e && e.value.trim() && e.dataset.auto !== '1')) return;   /* поля заповнено вручну — не чіпаємо */
  const p = addrParse(a.value);
  ADDR.forEach(([k], i)=>{ const e = els[i]; if (!e) return; e.value = p[k] || ''; if (e.tagName === 'SELECT' && e.value !== (p[k] || '')) e.value = ''; e.dataset.auto = '1'; });
}
{ const a = document.getElementById('meta_addr');
  if (a){
    let t = 0; a.addEventListener('input', e=>{ if (!e.isTrusted) return; clearTimeout(t); t = setTimeout(addrFromLine, 400); });
    a.addEventListener('change', addrFromLine);
    ADDR.forEach(([k])=>{ const e = document.getElementById('meta_addr_' + k); if (e) ['input','change'].forEach(ev=>e.addEventListener(ev, x=>{ if (x.isTrusted) delete e.dataset.auto; })); });
  } }
function addrPlace(){
  const a = document.getElementById('meta_addr'), af = a && (a.closest('.f') || a.parentElement), box = document.querySelector('.addrbox'); if (!af || !box) return;
  const lb = af.querySelector('label'), on = uimOn();
  if (!UIM.addrLbl && lb) UIM.addrLbl = lb.textContent;
  let tg = box.querySelector('.addr-tg');
  if (on){
    if (af.nextElementSibling !== box) box.before(af);
    if (lb) lb.textContent = 'Місце проживання';
    a.placeholder = 'с. Оржиця, вул. Шевченка, 5, Лубенський р-н, Полтавська обл.';
    if (!tg){ tg = h('button', {type:'button', class:'more addr-tg', 'aria-expanded':'false', onclick:()=>{ const open = !box.classList.contains('addr-open'); box.classList.toggle('addr-open', open); tg.setAttribute('aria-expanded', open ? 'true' : 'false'); tg.textContent = open ? 'Сховати поля адреси ▴' : 'Розбити на поля (для бланків) ▾'; }}, 'Розбити на поля (для бланків) ▾');
      box.prepend(tg); }
    box.classList.add('addr-c');
  } else {
    if (box.nextElementSibling !== af) box.after(af);
    if (lb && UIM.addrLbl) lb.textContent = UIM.addrLbl;
    a.placeholder = 'необов’язково'; if (tg) tg.remove(); box.classList.remove('addr-c', 'addr-open');
  }
}
/* 4. пошук — кнопкою в шапці */
function searchBtnPlace(){
  let b = document.getElementById('cmdkBtn');
  if (!uimOn()){ if (b) b.hidden = true; return; }
  if (!b){ const anchor = document.querySelector('header.top .profbtn') || document.getElementById('themeBtn'); if (!anchor) return;
    b = h('button', {type:'button', class:'btn cmdk-btn', id:'cmdkBtn', title:'Знайти розділ, поле, хворобу чи дію (Ctrl+K)', 'aria-label':'Пошук (Ctrl+K)', onclick:()=>openSearch()},
      (()=>{ const i = h('span', {'aria-hidden':'true', class:'cmdk-i'}); i.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="6.8" cy="6.8" r="4.8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'; return i; })(), h('span', {class:'cmdk-l'}, ' Пошук'), h('kbd', {}, /Mac/i.test(navigator.platform || '') ? '⌘K' : 'Ctrl K'));
    anchor.before(b); }
  b.hidden = false;
}
function uimApply(){ ptPlace(); addrPlace(); searchBtnPlace(); try{ SHELL.placeDocs(); }catch(e){} outFit(); }
{ const x0 = uiStyleApply; uiStyleApply = function(){ const r = x0.apply(this, arguments); try{ uimApply(); }catch(e){} return r; }; }
{ const x0 = applyView; applyView = function(){ const r = x0.apply(this, arguments); try{ ptPlace(); outFit(); }catch(e){} return r; }; }
try{ uimApply(); }catch(e){}
try{ requestAnimationFrame(()=>{ try{ uimApply(); }catch(e){} }); }catch(e){}
