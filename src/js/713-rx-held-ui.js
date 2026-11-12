/* 0.9.3.134 — умовні призначення («за показаннями») видно в листку: позначка й кнопка «Призначити».
   Без неї рядок «доки не підтвердите» нічим було підтвердити, а стрічка «Призначено (N)» рахувала кисень і еноксапарин як уже призначені —
   медсестра бачила їх у списку до виконання. it.hold === false — лікар підтвердив; true — повернув «за показаннями». */
function rxHeldType(it){ const h0 = it.hold; it.hold = undefined; const r = rxHeld(it); it.hold = h0; return r; }
{
  // стрічка «Призначено (N)» — без умовних; умовні окремим рядком
  renderRxStrip = function(){
    const b = $('#rxStrip'); if (!b) return; const t = todayISO();
    const live = RXF().filter(it=>!(it.stop && it.stop <= t) && !(rxEnd(it) && rxEnd(it) < t));
    const act = live.filter(it=>!rxHeld(it)), held = live.filter(rxHeld);
    b.hidden = !live.length; if (!live.length) return;
    const one = it => [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ');
    const g = k => act.filter(it=>k.includes(rxKind(it)));
    b.innerHTML = '';
    b.append(h('b', {}, `Призначено (${act.length}): `), g(['drug']).map(one).join('; ') || '—',
      g(['reg','diet']).length ? h('span', {class:'rxs-g'}, ' · Режим, дієта: ' + g(['reg','diet']).map(it=>it.drug).join('; ')) : '',
      g(['man','phys','loc']).length ? h('span', {class:'rxs-g'}, ' · Процедури: ' + g(['man','phys','loc']).map(it=>it.drug).join('; ')) : '',
      held.length ? h('span', {class:'rxs-held'}, ' · За показаннями (ще не призначено): ' + held.map(it=>it.drug).join('; ')) : '');
  };
  const rr0 = renderRx;
  renderRx = function(){
    const r = rr0.apply(this, arguments);
    RXF().forEach(it=>{
      if (!rxHeldType(it)) return;
      const row = document.querySelector(`#rxList .rx[data-id="${it.id}"]`); if (!row) return;
      const held = rxHeld(it), sum = row.querySelector('.rxsum');
      row.classList.toggle('rx-held', held);
      if (sum && held){ const b = h('span', {class:'badge warn rx-held-b'}, 'за показаннями'), nm = sum.querySelector('b, strong'); if (nm) nm.after(b); else sum.prepend(b); }
      const btn = h('button', {type:'button', class:'btn' + (held ? ' primary' : ''), title:held ? 'Показання є — рядок піде в документ як призначене' : 'Повернути в «за показаннями»',
        onclick:e=>{ e.stopPropagation(); it.hold = held ? false : true; renderRx(); update(); toast(held ? 'Призначено: ' + it.drug : 'Повернуто «за показаннями»', 1600); }},
        held ? 'Призначити' : 'Лише за показаннями');
      const acts = row.querySelector('.acts2'); if (acts) acts.prepend(btn);
      else if (sum && held) sum.after(h('div', {class:'rx-held-row'}, btn));
    });
    return r;
  };
}
