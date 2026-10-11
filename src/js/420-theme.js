/* ================= ТЕМА: авто / день / ніч ================= */
let THEME = 'auto'; try{ THEME = localStorage.getItem('po.theme') || 'auto'; }catch(e){}
function applyTheme(){
  const r = document.documentElement;
  if (THEME === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', THEME === 'night' ? 'dark' : 'light');
  const b = $('#themeBtn'); if (b){ b.innerHTML = '<span class="hide-m">Тема: </span>' + {auto:'авто', day:'день', night:'ніч'}[THEME]; b.title = 'Тема оформлення: ' + {auto:'як у системі', day:'світла', night:'темна'}[THEME] + '. Натисніть, щоб змінити'; }
}


