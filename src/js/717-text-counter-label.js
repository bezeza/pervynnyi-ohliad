/* ===== 0.9.3.135 — прибрати незрозумілий лічильник біля «Текст» =====
   Раніше v2Count показував довжину тексту документа в символах:
   textContent після згортання послідовностей пробілів і trim().
   Це не кількість зауважень «Перевірки», тому число прибрано з кнопки. */
{
  const count = txtCnt;
  const button = txtBtn;
  if (typeof v2Count === 'function' && count && button) {
    const v0 = v2Count;
    v2Count = function(){
      const r = v0.apply(this, arguments);
      count.hidden = true;
      button.setAttribute('aria-label', 'Текст документа: відкрити панель дій');
      return r;
    };
    v2Count();
  } else if (count && button) {
    count.hidden = true;
    button.setAttribute('aria-label', 'Текст документа: відкрити панель дій');
  }
}
