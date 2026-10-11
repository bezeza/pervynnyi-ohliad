/* ================= ТЕМА: авто / день / ніч ================= */
let THEME = 'auto'; try{ THEME = localStorage.getItem('po.theme') || 'auto'; }catch(e){}
function applyTheme(){
  const r = document.documentElement;
  if (THEME === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', THEME === 'night' ? 'dark' : 'light');
  const b = $('#themeBtn'); if (b){ b.innerHTML = '<span class="hide-m">Тема: ' + {auto:'авто', day:'день', night:'ніч'}[THEME] + '</span><span class="show-m" aria-hidden="true">' + {auto:'◐', day:'☀', night:'☾'}[THEME] + '</span>'; b.title = 'Тема оформлення: ' + {auto:'як у системі', day:'світла', night:'темна'}[THEME] + '. Натисніть, щоб змінити'; }
}


