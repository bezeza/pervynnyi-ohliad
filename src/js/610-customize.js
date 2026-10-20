/* ===== «Налаштувати під себе» (0.9.3.20): усе, що можна змінити, на одній сторінці простими словами.
   Зберігається в папці даних зрозумілими файлами: «Мої шаблони.json», «Мої кнопки і фрази.json», «Налаштування.json».
   Без папки (телефон, Firefox) — один файл «Мої налаштування» для перенесення. ===== */
function goSet(title){
  goTab('set');
  setTimeout(()=>{
    const w = title.toLowerCase();
    const d = [...document.querySelectorAll('details.setsec')].find(x=>x.querySelector('summary').textContent.toLowerCase().includes(w));
    if (d){ d.open = true; d.scrollIntoView({block:'start', behavior:'smooth'}); return; }
    const hh = [...document.querySelectorAll('h3.sub, h3')].find(x=>x.textContent.toLowerCase().includes(w));
    if (hh) hh.scrollIntoView({block:'start', behavior:'smooth'});
  }, 80);
}
function mySetupExport(){
  const cu = fsCustom(), o = {type:'po-my-setup', app:VERSION, saved:new Date().toISOString(), files:{}};
  const rest = Object.fromEntries(Object.keys(cu).filter(k=>!FS_BTN_KEYS.includes(k)).map(k=>[k, cu[k]])), btn = Object.fromEntries(Object.keys(cu).filter(k=>FS_BTN_KEYS.includes(k)).map(k=>[k, cu[k]]));
  FS_FILES(rest, btn).forEach(([nm, type, help, custom, keys])=>{ o.files[nm] = {type, help, custom, data:fsLocal(keys)}; });
  const a = h('a', {href:URL.createObjectURL(new Blob([JSON.stringify(o, null, 1)], {type:'application/json'})), download:'Мої_налаштування_' + todayISO() + '.json'});
  document.body.append(a); a.click(); a.remove();
  toast('Збережено «Мої налаштування»: шаблони, кнопки, фрази й налаштування. Пацієнтів у файлі немає', 4500);
}
function mySetupImport(){
  const inp = h('input', {type:'file', accept:'.json,application/json', style:'display:none'});
  inp.onchange = async () => { const f = inp.files[0]; inp.remove(); if (!f) return;
    try{ const o = JSON.parse(await f.text()); if (!o || o.type !== 'po-my-setup' || !o.files) throw new Error('це не файл «Мої налаштування»');
      let cu = fsCustom(), n = 0;
      for (const nm in o.files){ const x = o.files[nm] || {};
        if (x.custom) { cu = Object.assign(cu, x.custom); n++; }
        for (const k in (x.data || {})){ try{ localStorage.setItem(k, x.data[k]); n++; }catch(e){} } }
      localStorage.setItem('po.custom', JSON.stringify(cu));
      toast(`Завантажено (${n}). Програма перезапуститься, щоб застосувати`, 3000); setTimeout(()=>location.reload(), 1600);
    }catch(e){ toast('Не вдалося прочитати файл: ' + e.message, 5000); } };
  document.body.append(inp); inp.click();
}
function customizeOpen(){
  const dlg = h('div', {class:'navsheet cusdlg', role:'dialog', 'aria-modal':'true', 'aria-label':'Налаштувати під себе'});
  const close = () => { dlg.remove(); document.body.style.overflow = ''; };
  const go = fn => () => { close(); fn(); };
  const sec = id => SECTIONS.find(s=>s.id === id);
  const cu = fsCustom(), cnt = {tpl:(cu.presets || []).length + (cu.diary || []).length + (cu.rxsets || []).length, btn:(cu.btns || []).length, ovr:Object.keys(cu.ovr || {}).length + Object.keys(cu.opts || {}).length};
  const card = (icon, title, what, how, btnLabel, fn, file, n) => h('div', {class:'cuscard'},
    h('div', {class:'cus-h'}, h('span', {class:'cus-i', 'aria-hidden':'true'}, icon), h('b', {}, title), n ? h('span', {class:'cus-n'}, n) : ''),
    h('p', {}, what), how ? h('p', {class:'chips-hint'}, how) : '',
    h('div', {class:'cus-f'}, h('button', {type:'button', class:'btn', onclick:go(fn)}, btnLabel), h('span', {class:'chips-hint'}, '→ ' + file)));
  const fsOk = FS.dir && FS.ok;
  dlg.append(
    h('div', {class:'nshead'}, h('b', {}, 'Налаштувати під себе'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('p', {class:'chips-hint'}, 'Усе, що можна змінити під свою роботу. Зміни зберігаються одразу; у папці даних — окремими файлами, які легко скопіювати на інший комп’ютер.'),
    h('div', {class:'cusgrid'},
      card('👤', 'Лікар, відділення, заклад', 'ПІБ і посада для підпису, завідувач, заступник з медичної роботи, назва й реквізити закладу для шапки.', '', 'Відкрити', ()=>goSet('Лікар'), 'Налаштування.json'),
      card('🩺', 'Профіль', 'Ваша спеціальність і де працюєте (стаціонар, поліклініка). Від цього залежать хвороби, документи й кнопки, які видно.', '', 'Змінити профіль', ()=>{ const b = document.getElementById('profBtn'); if (b) b.click(); }, 'Налаштування.json'),
      card('📋', 'Мої шаблони', 'Свій шаблон хвороби, щоденника чи схеми лікування: заповніть огляд як завжди і збережіть як шаблон.', 'Вкладка «Мої шаблони» → «Зберегти поточний огляд як шаблон».', 'Відкрити «Мої шаблони»', ()=>goTab('tpl'), 'Мої шаблони.json', cnt.tpl ? 'є ' + cnt.tpl : ''),
      card('➕', 'Мої кнопки', 'Кнопка, що одним натисканням вставляє вашу фразу в потрібне поле розділу.', 'У будь-якому розділі: «⋯» → «Своя кнопка». Видалити — × на кнопці.', 'Додати кнопку в «Скарги»', ()=>{ goTab('skarhy'); setTimeout(()=>{ try{ myBtnForm(sec('skarhy')); }catch(e){} }, 120); }, 'Мої кнопки і фрази.json', cnt.btn ? 'є ' + cnt.btn : ''),
      card('✎', 'Свої формулювання', 'Змінити текст будь-якого варіанта під свій стиль, додати свій варіант або сховати непотрібний.', 'Натисніть ✎ біля назви розділу, потім — на варіант.', 'Спробувати в «Загальний стан»', ()=>goTab('zah'), 'Мої кнопки і фрази.json', cnt.ovr ? 'змін ' + cnt.ovr : ''),
      card('⌨', 'Мої скорочення', 'Наберіть «.слово» і пробіл — з’явиться ціла фраза.', '', 'Відкрити скорочення', ()=>goSet('скорочення'), 'Мої кнопки і фрази.json'),
      card('📦', 'Пакети фраз', 'Поділитися своїми шаблонами й кнопками з колегою або встановити його пакет.', '', 'Відкрити пакети', ()=>{ const t = [...document.querySelectorAll('#panels .pt h3')].find(x=>/Обмін з колегами/.test(x.textContent)); const tab = t && TABS.find(x=>x.panel && x.panel.contains(t)); if (tab) goTab(tab.id); setTimeout(()=>{ if (t) t.scrollIntoView({block:'start', behavior:'smooth'}); }, 120); }, 'Мої кнопки і фрази.json'),
      card('🖨', 'Папір і бланк', 'Відступ для підшивки, зсув під ваш принтер, скільки записів щоденника на аркуші.', '', 'Відкрити папір і принтер', ()=>goSet('Папір'), 'Налаштування.json'),
      card('🔤', 'Вигляд', 'Розмір тексту програми, тема, як показувати текст документа на телефоні.', '', 'Відкрити', ()=>goSet('Розмір тексту'), 'Налаштування.json')),
    h('div', {class:'cusfoot'},
      h('h3', {}, 'Де це зберігається'),
      fsOk ? h('p', {}, `Папка даних «${FS.dir.name}»: «Мої шаблони.json», «Мої кнопки і фрази.json», «Налаштування.json», «Перевірка вмісту.json» — оновлюються самі. Щоб перенести на інший комп’ютер — скопіюйте папку (наприклад, на флешку) і підключіть її там.`)
        : h('p', {}, fsSupported() ? 'Поки що — лише в цьому браузері. Підключіть папку даних, і все збережеться файлами на комп’ютері.' : 'На цьому пристрої папка даних недоступна — збережіть «Мої налаштування» у файл і відкрийте його на іншому пристрої.'),
      h('div', {class:'acts2'},
        !fsOk && fsSupported() ? h('button', {type:'button', class:'btn primary', onclick:go(()=>FS.dir ? fsReconnect() : fsPick())}, FS.dir ? 'Дозволити доступ до папки' : 'Підключити папку даних') : '',
        h('button', {type:'button', class:'btn', onclick:mySetupExport}, 'Зберегти «Мої налаштування» у файл'),
        h('button', {type:'button', class:'btn', onclick:mySetupImport}, 'Завантажити з файлу')),
      h('p', {class:'chips-hint'}, 'У файлі «Мої налаштування» немає даних пацієнтів — його можна передати колезі.')));
  document.body.append(dlg); document.body.style.overflow = 'hidden';
  dlg.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });
}
if (SETTINGS_EL){ const b = h('div', {class:'cusentry'}, h('button', {type:'button', class:'btn primary', onclick:customizeOpen}, '⚙ Налаштувати під себе'), h('span', {class:'chips-hint'}, 'шаблони, кнопки, формулювання, папір — усе в одному місці')); SETTINGS_EL.prepend(b); }
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'Налаштувати під себе (шаблони, кнопки, формулювання, файли)', s:'', go:customizeOpen}); return L; }; }
/* блоки налаштувань, додані після згортання (захист екрана, папір, резервні копії, PIN, перевірка…), — теж згорнутими блоками; «Про програму» — у кінці */
function setRegroup(){
  if (!SETTINGS_EL) return;
  const opened = new Set(JSON.parse(lsGet('po.setopen', '[]') || '[]'));
  let cur = null;
  [...SETTINGS_EL.children].forEach(k=>{
    if (k.matches('h3.sub, h3:not([class])') && !k.closest('details')){
      const t = k.textContent.trim(); cur = h('details', {class:'setsec'}); const s = h('summary', {}, t); cur.append(s); k.replaceWith(cur);
      if (opened.has(t)) cur.open = true;
      cur.addEventListener('toggle', ()=>{ const o = new Set(JSON.parse(lsGet('po.setopen', '[]') || '[]')); if (cur.open) o.add(t); else o.delete(t); lsSet('po.setopen', JSON.stringify([...o])); });
      return;
    }
    if (k.matches('details, .cusentry, input.setq, p.lead')) { cur = null; return; }
    if (cur) cur.append(k);
  });
  const about = SETTINGS_EL.querySelector(':scope > details.about'); if (about) SETTINGS_EL.append(about);
}
setRegroup();
