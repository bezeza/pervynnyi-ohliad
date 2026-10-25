/* 0.9.3.43 — керування фокусом у діалозі розділів. */
const NAV_DIALOG = document.getElementById('navSheet');
const NAV_DIALOG_CLOSE = document.getElementById('navClose');
let NAV_DIALOG_RETURN_FOCUS = null;

const openNav0 = openNav;
openNav = function(){
  if (NAV_DIALOG.hidden) NAV_DIALOG_RETURN_FOCUS = document.activeElement;
  const result = openNav0.apply(this, arguments);
  NAV_DIALOG_CLOSE.focus();
  return result;
};

const closeNav0 = closeNav;
closeNav = function(){
  const wasOpen = !NAV_DIALOG.hidden;
  const result = closeNav0.apply(this, arguments);
  if (wasOpen){
    const target = NAV_DIALOG_RETURN_FOCUS;
    NAV_DIALOG_RETURN_FOCUS = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
  }
  return result;
};

function navDialogFocusable(){
  return [...NAV_DIALOG.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'));
}

document.addEventListener('keydown', e=>{
  if (e.key !== 'Tab' || NAV_DIALOG.hidden) return;
  const items = navDialogFocusable();
  if (!items.length){ e.preventDefault(); NAV_DIALOG_CLOSE.focus(); return; }
  const index = items.indexOf(document.activeElement);
  if (index < 0){
    e.preventDefault();
    (e.shiftKey ? items[items.length - 1] : items[0]).focus();
  } else if (e.shiftKey && index === 0){
    e.preventDefault(); items[items.length - 1].focus();
  } else if (!e.shiftKey && index === items.length - 1){
    e.preventDefault(); items[0].focus();
  }
});

/* The original handlers were assigned before this wrapper was loaded. */
document.getElementById('navBtn').onclick = openNav;
NAV_DIALOG_CLOSE.onclick = closeNav;
