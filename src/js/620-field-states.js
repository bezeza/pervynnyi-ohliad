/* 0.9.3.35 — текстові стани введення; значки не потрапляють у документ. */
const ENTRY_LABELS = {empty:'не заповнено', normal:'норма', abnormal:'є відхилення', filled:'заповнено', partial:'заповнено частково', check:'перевірте значення', inherited:'підставлено автоматично'};
const ENTRY_ICONS = {empty:'○', normal:'✓', abnormal:'!', filled:'●', partial:'◐', check:'!', inherited:'↳'};
function entryFieldState(f){
  if (f.type === 'sel'){
    if (f.el.value === '') return 'empty';
    if (f.bo) return 'normal';
    if (f.norm === undefined || f.noOut) return 'filled';
    return +f.el.value === f.norm ? 'normal' : 'abnormal';
  }
  if (f.type === 'num'){
    const values = f.inputs.map(input=>input.value.trim());
    if (!values.some(Boolean)) return 'empty';
    let abnormal = false, invalid = false;
    values.forEach((v,i)=>{
      if (!v) return;
      const n = Number(v.replace(',', '.')), p = f.parts[i];
      if (!/^-?\d+(?:[.,]\d+)?$/.test(v) || !Number.isFinite(n) || p.ok && (n < p.ok[0] || n > p.ok[1])) invalid = true;
      else if (p.n && (n < p.n[0] || n > p.n[1])) abnormal = true;
    });
    if (invalid) return 'check';
    if (abnormal) return 'abnormal';
    if (!values.every(Boolean)) return 'partial';
    return f.parts.every(p=>p.n) ? 'normal' : 'filled';
  }
  if (f.type === 'multi') return f.chips.some(c=>c.getAttribute('aria-pressed') === 'true') ? 'filled' : 'empty';
  if (f.type === 'numsel') return f.inp.value.trim() ? 'filled' : 'empty';
  if (f.type === 'period') return !f.d1.value && !f.d2.value ? 'empty' : !f.d1.value || !f.d2.value ? 'partial' : 'filled';
  if (f.type === 'auto') return f.abox && f.abox.textContent.trim() ? 'filled' : 'empty';
  if (f.el && f.el.value.trim()) return 'filled';
  // Наявний підказ onepage відрізняє підстановку від власного введення.
  if (f.ghost && !f.ghost.hidden) return 'inherited';
  return 'empty';
}
function entryFields(s){
  return s.fields.filter(f=>f.type !== 'hdr' && !f.headOnly && f.wrapEl && !f.wrapEl.hidden &&
    (!f.only || f.only === MODE) && (!f.docs || f.docs.includes(DOC)));
}
function entrySectionState(s){
  const fields = entryFields(s), states = fields.map(entryFieldState);
  if (states.includes('check')) return 'check';
  if (states.includes('abnormal')) return 'abnormal';
  if (states.every(state=>state === 'empty')) return 'empty';
  // Порожні поля не стають нормою через нормальне сусіднє поле.
  const normals = fields.filter(f=>(f.type === 'sel' && f.norm !== undefined && !f.noOut) || (f.type === 'num' && f.parts.some(p=>p.n)));
  const normalStates = normals.map(entryFieldState);
  const shortNormal = fields.some(f=>f.bo && entryFieldState(f) === 'normal');
  const narrative = fields.some(f=>['line','text'].includes(f.type) && entryFieldState(f) === 'filled');
  if (!narrative && (shortNormal || normalStates.length && normalStates.every(state=>state === 'normal'))) return 'normal';
  return 'filled';
}
function entryBadge(state, kind){
  return h('span', {class:'entry-status ' + kind, 'data-state':state},
    h('span', {'aria-hidden':'true', class:'entry-icon'}, ENTRY_ICONS[state]),
    h('span', {}, ENTRY_LABELS[state]));
}
function entrySet(badge, state){
  if (badge.dataset.state === state) return;
  badge.dataset.state = state;
  badge.firstChild.textContent = ENTRY_ICONS[state]; badge.lastChild.textContent = ENTRY_LABELS[state];
}
function entryRender(){
  SECTIONS.forEach(s=>{
    if (!s.panel || !s.docs.includes(DOC) || s.only && s.only !== MODE) return;
    entryFields(s).forEach(f=>{
      const state = entryFieldState(f);
      if (!f.entryStatus){
        const label = f.wrapEl.querySelector(':scope > label, :scope > .lbl'); if (!label) return;
        f.entryStatus = entryBadge(state, 'entry-field'); label.append(f.entryStatus);
        f.entryStatus.id = `entry_${s.id}_${f.id}`;
        // Прихований select і його кнопки мають одну й ту саму текстову підказку.
        const inputs = f.wrapEl.querySelectorAll('input:not([type=search]), select, textarea, .segbtns');
        inputs.forEach(input=>{
          const ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
          if (!ids.includes(f.entryStatus.id)) input.setAttribute('aria-describedby', [...ids, f.entryStatus.id].join(' '));
        });
      } else entrySet(f.entryStatus, state);
    });
    const state = entrySectionState(s);
    if (!s.entryStatus){
      const header = s.panel.querySelector('.ph'); if (!header) return;
      s.entryStatus = entryBadge(state, 'entry-section'); header.append(s.entryStatus);
    } else entrySet(s.entryStatus, state);
    s.entryStatus.title = 'Стан введених даних розділу. Повнота й клінічна перевірка документа оцінюються окремо.';
  });
  // «Показники» містять проксі тих самих полів, а не окремий огляд.
  document.querySelectorAll('#qvVit input[data-for]').forEach(input=>{
    const source = document.getElementById(input.dataset.for), wrap = source && source.closest('.f');
    const badge = wrap && wrap.querySelector('.entry-field'); if (!badge) return;
    let proxy = input.parentElement.querySelector(`[data-source="${input.dataset.for}"]`);
    if (!proxy){ proxy = entryBadge(badge.dataset.state, 'entry-proxy'); proxy.dataset.source = input.dataset.for; input.after(proxy); }
    entrySet(proxy, badge.dataset.state);
  });
}
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); entryRender(); return r; }; }
{ const x0 = show; show = function(){ const r = x0.apply(this, arguments); entryRender(); return r; }; }
{ const x0 = restore; restore = function(){ const r = x0.apply(this, arguments); entryRender(); return r; }; }
entryRender();
