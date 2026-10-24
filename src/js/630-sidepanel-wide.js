/* 0.9.3.44 — згортання бічної панелі й ширший робочий простір. */
VIEW.sideFold = !!VIEW.sideFold;
const SIDE_COL = document.getElementById('sidecol');
const SIDE_IN = SIDE_COL && SIDE_COL.querySelector(':scope > .sidein');
let SIDE_FOLD_BUTTON = null;

if (SIDE_IN){
  SIDE_FOLD_BUTTON = h('button', {
    type:'button', class:'btn sidefold-btn', 'aria-controls':'tabs', 'aria-expanded':'true',
    'aria-label':'Згорнути панель розділів', title:'Згорнути зміст розділів'
  }, h('span', {}, 'Згорнути зміст'));
  SIDE_IN.prepend(SIDE_FOLD_BUTTON);
  SIDE_FOLD_BUTTON.addEventListener('click', ()=>setSideFold(!document.body.classList.contains('sidefold')));
}

function sideFoldActive(){
  return !isPhoneW() && layoutNow() === 'B' && !!VIEW.sideFold;
}

function renderSideFold(){
  const folded = sideFoldActive();
  document.body.classList.toggle('sidefold', folded);
  if (!SIDE_FOLD_BUTTON) return;
  SIDE_FOLD_BUTTON.hidden = isPhoneW() || layoutNow() !== 'B';
  SIDE_FOLD_BUTTON.setAttribute('aria-expanded', folded ? 'false' : 'true');
  SIDE_FOLD_BUTTON.setAttribute('aria-label', folded ? 'Розгорнути панель розділів' : 'Згорнути панель розділів');
  SIDE_FOLD_BUTTON.title = folded ? 'Показати зміст розділів, шаблон і прогрес' : 'Згорнути зміст розділів';
  const label = SIDE_FOLD_BUTTON.querySelector('span');
  if (label) label.textContent = folded ? 'Розділи ›' : 'Згорнути зміст';
}

function setSideFold(folded){
  VIEW.sideFold = !!folded;
  saveView();
  applyView();
}

const applyViewWide0 = applyView;
applyView = function(){
  const result = applyViewWide0.apply(this, arguments);
  renderSideFold();
  return result;
};

renderSideFold();
