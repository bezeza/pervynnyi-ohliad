/* 0.9.3.99 — щоденник: «(день N з M)» і «Курс … завершено» у блоці «Лікування». Лише для щоденника (DOC === 'shch'). */
{
  const rxPart0 = rxPart;
  rxPart = function(){
    if (DOC !== 'shch') return rxPart0.apply(this, arguments);
    const RXA = typeof RXACT === 'function' ? RXACT : RXF;   // умовні «за показаннями» — не в щоденник
    if (!RXA().length) return null;
    const date = todayISO(), act = it => it.start <= date && (!rxEnd(it) || rxEnd(it) >= date);
    const cont = RXA().filter(it=>act(it) && it.start < date && it.stop !== date), nw = RXA().filter(it=>it.start === date && act(it)), off = RXA().filter(it=>it.stop === date);
    const completed = RXA().filter(it=>diaryCourseCompleted(it, date));
    const lines = [];
    if (cont.length) lines.push('Продовжує отримувати: ' + cont.map(it=>diaryCourseLine(it, date)).join('; ') + '.');
    if (nw.length) lines.push('Призначено: ' + nw.map(it=>diaryCourseLine(it, date)).join('; ') + '.');
    if (off.length) lines.push('Відмінено: ' + off.map(it=>it.drug).join(', ') + '.');
    if (completed.length) lines.push(completed.map(it=>'Курс ' + it.drug + ' завершено').join('; ') + '.');
    return lines.length ? {head:'Лікування:', body:lines.join(' '), sep:' '} : null;
  };
}
