/* 0.9.3.45 — основні дії документа, меню завантаження й форматування під час ручної правки. */
{
  const outBox = $('#outBox'), out = $('#out'), fmtBtn = $('#fmtBtn'), fmt = outBox && outBox.querySelector('.fmt');
  if (outBox && out && fmtBtn && fmt){
    let editing = false, formatOpen = lsGet('po.fmt', '0') === '1';
    fmt.id = 'fmtToolbar';
    fmtBtn.hidden = true;
    fmtBtn.title = 'Показати форматування тексту під час ручної правки';
    fmtBtn.setAttribute('aria-controls', fmt.id);
    const syncFormat = () => {
      fmtBtn.hidden = !editing;
      fmt.hidden = !editing || !formatOpen;
      fmtBtn.setAttribute('aria-pressed', formatOpen ? 'true' : 'false');
      outBox.dataset.manualEditing = editing ? 'true' : 'false';
    };
    const enterEditing = () => { editing = true; syncFormat(); };
    const leaveEditing = () => setTimeout(()=>{
      const active = document.activeElement;
      if (out.contains(active) || fmt.contains(active) || active === fmtBtn) return;
      editing = false; syncFormat();
    }, 0);
    out.addEventListener('focusin', enterEditing);
    fmt.addEventListener('focusin', enterEditing);
    fmtBtn.addEventListener('focusin', enterEditing);
    out.addEventListener('focusout', leaveEditing);
    fmt.addEventListener('focusout', leaveEditing);
    fmtBtn.addEventListener('focusout', leaveEditing);
    fmtBtn.onclick = () => {
      editing = true; formatOpen = !formatOpen;
      lsSet('po.fmt', formatOpen ? '1' : '0'); syncFormat();
    };
    syncFormat();
  }

  /* Перед друком уже є окремою вкладкою; лишаємо лише її, без дублювальної кнопки. */
  const paperBtn = $('#paperBtn');
  if (paperBtn) paperBtn.hidden = true;

  /* ШІ лишається доступним у пошуку дій, не займаючи місце в панелі документа. */
  const aiBtn = $('#aiBtn');
  if (aiBtn) aiBtn.hidden = true;

  const save = outBox && outBox.querySelector('.savewrap');
  const trigger = save && save.querySelector('#saveBtn');
  const menu = save && save.querySelector('.savemenu');
  if (trigger && menu){
    [...menu.querySelectorAll('button')].filter(b=>/PDF/i.test(b.textContent)).forEach(b=>b.remove());
    menu.id = 'downloadMenu';
    trigger.textContent = 'Завантажити ▾';
    trigger.title = 'Завантажити документ у форматі Word або LibreOffice';
    trigger.setAttribute('aria-label', 'Завантажити документ');
    trigger.setAttribute('aria-controls', menu.id);

    const items = () => [...menu.querySelectorAll('button:not([disabled])')];
    const closeMenu = (restoreFocus=false) => {
      menu.hidden = true; trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus();
    };
    trigger.addEventListener('keydown', e=>{
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      if (menu.hidden) trigger.click();
      const list = items();
      (e.key === 'ArrowDown' ? list[0] : list[list.length - 1])?.focus();
    });
    menu.addEventListener('keydown', e=>{
      const list = items(), i = list.indexOf(e.target.closest('button'));
      if (e.key === 'Escape'){ e.preventDefault(); closeMenu(true); return; }
      if (e.key === 'Home' || e.key === 'End'){
        e.preventDefault(); (e.key === 'Home' ? list[0] : list[list.length - 1])?.focus(); return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault(); const step = e.key === 'ArrowDown' ? 1 : -1;
        list[(i + step + list.length) % list.length]?.focus();
      }
    });
    menu.addEventListener('click', e=>{
      if (e.target.closest('button')) setTimeout(()=>{ if (menu.hidden) trigger.focus(); }, 0);
    });
    save.addEventListener('focusout', ()=>setTimeout(()=>{
      if (!save.contains(document.activeElement)) closeMenu();
    }, 0));
  }

  const printBtn = $('#printBtn');
  if (printBtn) printBtn.setAttribute('aria-label', 'Друк документа або збереження як PDF');
}
