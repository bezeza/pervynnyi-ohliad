/* ===== Нагадування про папку даних — як у Skiagrama (0.9.3.20) =====
   Поки папку не підключено, пацієнти живуть лише в цьому браузері. Смужка на головному екрані:
   «Підключити папку» або «Пізніше» (нагадає завтра). Після перезапуску браузера — «Дозволити» одним натисканням. */
const fsToday = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
function fsBanner(){
  let b = document.getElementById('fsBanner');
  const welcomed = lsGet('po.welcome', '') !== '';
  const need = fsSupported() && welcomed && (!FS.dir || !FS.ok);
  const perm = !!FS.dir && !FS.ok;
  if (!need || (!perm && lsGet('po.fslater', '') === fsToday())){ if (b) b.hidden = true; return; }
  if (!b){
    b = h('div', {id:'fsBanner', class:'fsbanner', role:'status'});
    const pl = document.getElementById('ptline'); if (pl) pl.after(b); else document.body.prepend(b);
  }
  b.innerHTML = '';
  b.append(h('span', {class:'fsb-t'}, perm ? `Папка даних «${FS.dir.name}» потребує дозволу браузера — без нього нові записи не потрапляють у папку.`
      : 'Папка даних не підключена. Пацієнти живуть лише в цьому браузері — підключіть папку, щоб не втратити записи.'),
    h('button', {type:'button', class:'btn primary', onclick:()=>perm ? fsReconnect() : fsPick()}, perm ? 'Дозволити' : 'Підключити папку'),
    perm ? '' : h('button', {type:'button', class:'btn', onclick:()=>{ lsSet('po.fslater', fsToday()); b.hidden = true; toast('Нагадаю завтра. Підключити можна в «Налаштуваннях» → «Папка даних на комп’ютері»', 4000); }}, 'Пізніше'));
  b.hidden = false;
}
{ const fr = fsRender; fsRender = function(){ const r = fr.apply(this, arguments); try{ fsBanner(); }catch(e){} return r; }; }
