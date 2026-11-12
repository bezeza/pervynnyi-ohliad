/* 0.9.3.99 — щоденник: лише явно внесені відомості про кисень і тривалість курсу (перенесено з #111).
   Функції оголошені через function: доступні й під час початкового формування полів. */
function diaryOxygenText(source, method, flow){
  source = String(source ?? ''); method = String(method ?? '');
  flow = String(flow ?? '').trim();
  if (source === '0') return 'на атмосферному повітрі';
  const device = method === '0' ? ' через назальну канюлю' : method === '1' ? ' через лицеву маску' : '';
  if (source === '1') return 'за допомогою кисневого концентратора' + device + (flow ? ', потік ' + flow + ' л/хв' : '');
  if (device) return 'на кисні' + device + (flow ? ', потік ' + flow + ' л/хв' : '');
  return flow ? 'на кисні ' + flow + ' л/хв' : '';
}
/* 0.9.3.134: у щоденнику — коротко (препарат, доза, шлях, кратність); пояснення з примітки лишаються в листку призначень */
const diaryRxShort = it => [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ') + (it.hours ? ' о ' + it.hours : '');
function diaryCourseLine(it, date){
  const total = Number(it.days), rxLine = diaryRxShort;
  if (!it.start || !Number.isInteger(total) || total <= 0) return rxLine(it);
  const elapsed = Math.floor((Date.parse(date + 'T00:00:00Z') - Date.parse(it.start + 'T00:00:00Z')) / 864e5) + 1;
  return Number.isFinite(elapsed) && elapsed >= 1 && elapsed <= total
    ? rxLine(it) + ' (день ' + elapsed + ' з ' + total + ')' : rxLine(it);
}
function diaryCourseCompleted(it, date){
  const total = Number(it.days);
  if ((typeof rxKind === 'function' && rxKind(it) !== 'drug') || !it.start || !Number.isInteger(total) || total <= 0) return false;
  return date === addDays(it.start, total - 1) && (!it.stop || it.stop > date);
}
