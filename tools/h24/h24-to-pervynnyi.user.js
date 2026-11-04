// ==UserScript==
// @name         H24 → Первинний огляд
// @namespace    github.com/bezeza/pervynnyi-ohliad
// @version      1.0.0
// @description  Лише читає відкриту медкарту H24 і копіює ПІБ, епізоди, діагнози, алергії й ліки в буфер для «Первинного огляду». Нічого не натискає, не змінює поля і не надсилає даних.
// @author       bezeza
// @license      AGPL-3.0-only
// @match        https://mis.h24.ua/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

/* Зчитування з уже намальованого DOM. Записів у МІС немає: жодних натискань «Зберегти / Підписати / Надіслати / Отримати доступ», жодних правок полів, жодних мережевих запитів.
   Що шукає розбір (евристики, бо точна розмітка H24 не зафіксована):
   - ПІБ: [data-test="patientFullName"], .patient_title span, пара «ПІБ» у [class*="key-value"] (напр. .h24-popover__key-value), заголовок сторінки, h1
   - дата народження: [data-test="birthDate"] або підпис «Дата народження» (dd.mm.yyyy або «21 квітня 1973»)
   - стать: [data-test="gender"] або підпис «Стать»; якщо порожньо — з по батькові
   - епізоди / діагнози: table (навіть без thead). Шапка за словами «Назва / Діагноз / МКХ / Статус / Період / Тип». Код МКХ-10 латиницею. Розділ — за найближчим h1–h4 («Епізоди», «Діагнози») або за адресою (/patient-summary, /histories, /diagnosis)
   - алергії й ліки: пари ключ–значення і текст одразу після заголовка «Алергії» / «Лікарські засоби»; колонка «Препарат»
   Список /patients/list навмисно без кнопки, щоб не схопити чужий рядок. */
(function () {
  'use strict';

  var MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  var h24Busy = false;

  function h24Text(el) {
    if (!el) return '';
    var raw = el.innerText != null && String(el.innerText).trim() ? el.innerText : el.textContent;
    return String(raw || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function h24All(root, sel) {
    var out = [], seen = [];
    function walk(node) {
      if (!node || !node.querySelectorAll || seen.indexOf(node) >= 0) return;
      seen.push(node);
      node.querySelectorAll(sel).forEach(function (el) { out.push(el); });
      node.querySelectorAll('*').forEach(function (el) { if (el.shadowRoot) walk(el.shadowRoot); });
    }
    walk(root);
    return out;
  }
  function h24Pad(n) { return String(n).padStart(2, '0'); }
  function h24ValidDate(y, m, d) {
    y = +y; m = +m; d = +d;
    if (!(y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
    var dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
    return y + '-' + h24Pad(m) + '-' + h24Pad(d);
  }
  function h24NormDate(s) {
    var t = String(s || '');
    var m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return h24ValidDate(m[1], m[2], m[3]);
    m = t.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (m) return h24ValidDate(m[3], m[2], m[1]);
    m = t.match(new RegExp('(\\d{1,2})\\s+(' + MONTHS.join('|') + ')\\s+(\\d{4})', 'i'));
    if (m) return h24ValidDate(m[3], MONTHS.indexOf(m[2].toLowerCase()) + 1, m[1]);
    return '';
  }
  function h24AllDates(s) {
    var out = [], re = /(\d{1,2})[./](\d{1,2})[./](\d{4})/g, m;
    while ((m = re.exec(String(s || '')))) {
      var iso = h24ValidDate(m[3], m[2], m[1]);
      if (iso) out.push(iso);
    }
    return out;
  }
  function h24SexFromName(name) {
    var w = String(name || '').trim().split(/\s+/);
    var p = (w[2] || '').toLowerCase().replace(/[^а-яіїєґ'’ʼ-]/g, '');
    if (/(івна|ївна|овна|евна|ична)$/.test(p)) return 'f';
    if (/(ович|евич|йович|ич)$/.test(p)) return 'm';
    return '';
  }
  function h24NormSex(raw, name) {
    var t = String(raw || '').trim().toLowerCase();
    if (/^(m|male|ч|чол)/.test(t) || /^ч[.,\s]/.test(t)) return 'm';
    if (/^(f|female|ж|жін)/.test(t) || /^ж[.,\s]/.test(t)) return 'f';
    return h24SexFromName(name);
  }
  function h24LooksLikeName(s) {
    var w = String(s || '').trim().split(/\s+/);
    if (w.length < 2 || w.length > 5) return false;
    return w.every(function (x) { return /^[А-ЯІЇЄҐA-Z][А-ЯІЇЄҐа-яіїєґA-Za-z'’ʼ-]{1,}$/.test(x); });
  }
  function h24PlausibleName(s) {
    var t = String(s || '').trim();
    if (t.length < 5 || t.length > 120) return false;
    if (/[<>]/.test(t)) return false;
    return /[А-ЯІЇЄҐа-яіїєґA-Za-z]{2}/.test(t);
  }
  function h24IsUuid(s) {
    return /^[0-9a-f]{8}-[0-9a-f-]{13,}$/i.test(String(s || '').trim());
  }
  function h24SplitCodeName(text) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw || h24IsUuid(raw)) return {code: '', name: ''};
    var m = raw.match(/([A-TV-Z]\d{2}(?:\.\d{1,2})?)/i);
    if (!m) return {code: '', name: raw};
    var code = m[1].toUpperCase();
    var name = (raw.slice(0, m.index) + ' ' + raw.slice(m.index + m[1].length)).replace(/\s+/g, ' ').replace(/^[\s\-—:,.]+|[\s\-—:,.]+$/g, '').trim();
    if (/^мкх(?:-10)?$/i.test(name)) name = '';
    return {code: code, name: name};
  }
  function h24CleanName(name) {
    return String(name || '')
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{13,}\b/ig, '')
      .replace(/\d{1,2}[./]\d{1,2}[./]\d{4}/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-—:,.|]+|[\s\-—:,.|]+$/g, '')
      .trim()
      .slice(0, 300);
  }
  function h24StatusWord(s) {
    var m = String(s || '').match(/активний|активна|активне|відкритий|відкрито|закритий|закрито|завершений|завершено|скасований|скасовано|чернетка|поточний|поточна/i);
    return m ? m[0] : '';
  }
  function h24RoleWord(s) {
    var m = String(s || '').match(/основний|основна|супутній|супутня|ускладнення/i);
    return m ? m[0] : '';
  }
  function h24Pairs(root) {
    var pairs = [];
    h24All(root, '[class*="key-value"], [class*="key_value"]').forEach(function (box) {
      var kids = [].slice.call(box.children).filter(function (el) { return /^(SPAN|DIV|DT|DD|P|B|STRONG)$/.test(el.tagName); });
      if (kids.length >= 2) { pairs.push([h24Text(kids[0]), h24Text(kids[1])]); return; }
      var t = h24Text(box), m = t.match(/^([^:]{2,60}?)\s*[:：]\s*(.+)$/);
      if (m) pairs.push([m[1], m[2]]);
    });
    return pairs;
  }
  function h24ValueByLabel(pairs, re) {
    var hit = pairs.filter(function (p) { return re.test(p[0]); })[0];
    return hit ? hit[1] : '';
  }
  function h24Path(doc) {
    try {
      var loc = doc.defaultView && doc.defaultView.location;
      if (loc && loc.pathname) return loc.pathname;
    } catch (e) {}
    return '';
  }
  function h24PageKind(doc) {
    var p = h24Path(doc);
    if (/\/diagnosis(?:\/|$)|\/conditions(?:\/|$)/.test(p)) return 'diagnosis';
    if (/\/recipes(?:\/|$)|\/medication/.test(p)) return 'meds';
    if (/\/patient-summary(?:\/|$)|\/histories(?:\/|$)|medical-histor/.test(p)) return 'episode';
    return '';
  }
  function h24PrevHeading(el) {
    var n = el;
    while (n) {
      var p = n.previousElementSibling;
      while (p) {
        if (/^H[1-4]$/.test(p.tagName)) return h24Text(p);
        p = p.previousElementSibling;
      }
      n = n.parentElement;
      if (n && /^H[1-4]$/.test(n.tagName)) return h24Text(n);
    }
    return '';
  }
  function h24Kind(el, fallback) {
    var head = h24PrevHeading(el);
    var cls = String(el.className || '') + ' ' + String(el.id || '');
    var s = (head + ' ' + cls).toLowerCase();
    if (/алерг/.test(s)) return 'allergy';
    if (/лікарськ|препарат|медикамент|рецепт|recipes/.test(s)) return 'meds';
    if (/діагноз|diagnosis|conditions/.test(s)) return 'diagnosis';
    if (/епізод|patient-summary|histories|medical-histor/.test(s)) return 'episode';
    return fallback || '';
  }
  function h24RowTexts(tr) {
    return [].slice.call(tr.children).filter(function (el) { return el.tagName === 'TD' || el.tagName === 'TH'; }).map(h24Text);
  }
  function h24IsHeader(cells) {
    var blob = cells.join(' ').toLowerCase();
    if (!/(мкх|icd|діагноз|епізод|статус|період|назва|дата|тип|роль|препарат|лікарськ|ліки)/.test(blob)) return false;
    if (cells.some(function (c) { return /[A-TV-Z]\d{2}/i.test(c) && c.length > 8; })) return false;
    return true;
  }
  function h24HeaderMap(cells) {
    var map = {};
    cells.forEach(function (c, i) {
      var t = c.toLowerCase();
      if (/препарат|лікарськ|медикамент|^ліки$/.test(t)) map.drug = i;
      else if (/дата\s*(заверш|кінц)|завершен/.test(t)) map.end = i;
      else if (/дата\s*(поч|від)|почат/.test(t)) map.start = i;
      else if (/період|термін|дати|^дата$/.test(t)) map.dates = i;
      else if (/статус|^стан$/.test(t)) map.status = i;
      else if (/^тип$|роль|^вид$/.test(t)) map.role = i;
      else if (/мкх|icd|\bкод\b/.test(t)) map.code = i;
      else if (/епізод|назва|діагноз|опис/.test(t)) map.name = i;
    });
    return map;
  }
  function h24ParseRow(cells, map) {
    var code = '', name = '', status = '', role = '', start = '', end = '';
    var mapped = map && (map.code != null || map.name != null || map.status != null || map.role != null || map.dates != null || map.start != null || map.drug != null);
    if (mapped && map.drug == null) {
      if (map.code != null) {
        var sc = h24SplitCodeName(cells[map.code] || '');
        code = sc.code;
        if (sc.name) name = sc.name;
      }
      if (map.name != null) {
        var sn = h24SplitCodeName(cells[map.name] || '');
        if (!code && sn.code) code = sn.code;
        name = sn.name || cells[map.name] || name;
      }
      if (map.status != null) status = cells[map.status] || '';
      if (map.role != null) role = cells[map.role] || '';
      if (map.start != null) start = h24NormDate(cells[map.start] || '');
      if (map.end != null) end = h24NormDate(cells[map.end] || '');
      if (!start || !end) {
        var ds = h24AllDates(map.dates != null ? cells[map.dates] : '');
        if (!start && ds[0]) start = ds[0];
        if (!end && ds[1]) end = ds[1];
      }
    } else if (map && map.drug != null) {
      return null;
    } else {
      var joined = cells.filter(function (c) { return c && !h24IsUuid(c); }).join(' ');
      var s = h24SplitCodeName(joined);
      code = s.code;
      name = s.name;
      status = h24StatusWord(joined);
      role = h24RoleWord(joined);
      var dates = h24AllDates(joined);
      start = dates[0] || '';
      end = dates[1] || '';
      if (status) name = name.replace(new RegExp(status, 'i'), '');
      if (role) name = name.replace(new RegExp(role, 'i'), '');
    }
    name = h24CleanName(name);
    if (!status) status = h24StatusWord(cells.join(' '));
    if (!role) role = h24RoleWord(map && map.role != null ? (cells[map.role] || '') : '');
    if (!code && !name) return null;
    if (!code && /^(назва|діагноз|епізод|статус|період|тип)$/i.test(name)) return null;
    return {code: code, name: name, start: start || '', end: end || '', status: status || '', role: role || ''};
  }
  function h24ReadTable(table, fallback) {
    var rows = table.rows ? [].slice.call(table.rows) : [].slice.call(table.querySelectorAll('tr'));
    var matrix = rows.map(h24RowTexts).filter(function (r) { return r.length; });
    if (!matrix.length) return null;
    var start = 0, map = {};
    if (h24IsHeader(matrix[0])) { map = h24HeaderMap(matrix[0]); start = 1; }
    var kind = h24Kind(table, fallback);
    var mode = map.drug != null ? 'meds' : (kind || 'episode');
    var items = [], meds = [];
    for (var i = start; i < matrix.length; i++) {
      if (mode === 'meds') {
        var di = map.drug != null ? map.drug : 0;
        var bits = [];
        matrix[i].forEach(function (c, idx) {
          if (!c || h24IsUuid(c)) return;
          if (idx === di || (map.drug == null && idx === 0) || (map.drug != null && idx !== di && c.length < 80)) bits.push(c);
        });
        var line = bits.filter(function (c, idx) { return idx === 0 || map.drug != null; }).join(', ').replace(/\s+/g, ' ').trim();
        if (!line) line = (matrix[i][di] || '').trim();
        if (line && !/^(препарат|лікарський засіб|ліки)$/i.test(line)) meds.push(line.slice(0, 300));
        continue;
      }
      var item = h24ParseRow(matrix[i], map);
      if (item) items.push(item);
    }
    return {mode: mode, items: items, meds: meds};
  }
  function h24DedupRows(list) {
    var seen = {}, out = [];
    list.forEach(function (it) {
      var k = [it.code, it.name, it.start, it.role || ''].join('|').toLowerCase();
      if (!k.replace(/\|/g, '') || seen[k]) return;
      seen[k] = 1;
      out.push(it);
    });
    return out.slice(0, 40);
  }
  function h24DedupStr(list) {
    var seen = {}, out = [];
    list.forEach(function (s) {
      var t = String(s || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 300) return;
      var k = t.toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      out.push(t);
    });
    return out.slice(0, 40);
  }
  function h24ChunksAfter(root, re) {
    var out = [];
    h24All(root, 'h1, h2, h3, h4').forEach(function (h) {
      if (!re.test(h24Text(h))) return;
      var n = h.nextElementSibling, guard = 0;
      while (n && guard < 8 && !/^H[1-4]$/.test(n.tagName)) {
        if (n.tagName === 'TABLE') break;
        if (n.tagName === 'UL' || n.tagName === 'OL') {
          [].slice.call(n.children).forEach(function (li) { if (li.tagName === 'LI') out.push(h24Text(li)); });
        } else {
          var t = h24Text(n);
          if (t && t.length <= 240) out.push(t);
        }
        n = n.nextElementSibling;
        guard++;
      }
    });
    return out;
  }
  function h24PickName(doc) {
    var nodes = h24All(doc, '[data-test="patientFullName"], .patient_title span');
    var best = null, bestScore = -1;
    nodes.forEach(function (el) {
      var text = h24Text(el);
      if (!h24PlausibleName(text)) return;
      var box = el.closest('.info-patient, .patient-item, .patient-container, header') || el.parentElement;
      var inList = !!(el.closest && el.closest('table, [class*="patients-list"], [class*="patient-list"]'));
      var hasDob = !!(box && box.querySelector && box.querySelector('[data-test="birthDate"]'));
      var score = 0;
      if (el.getAttribute && el.getAttribute('data-test') === 'patientFullName') score += 4;
      if (hasDob) score += 3;
      if (!inList) score += 2;
      if (h24LooksLikeName(text)) score += 1;
      if (score > bestScore) { bestScore = score; best = {name: text, box: box}; }
    });
    return best || {name: '', box: null};
  }
  function h24Patient(doc) {
    var picked = h24PickName(doc);
    var pairs = h24Pairs(doc);
    if (!picked.name) {
      var fromLabel = h24ValueByLabel(pairs, /^(піб|п\.?\s*і\.?\s*б\.?|пацієнт|прізвище(?:,\s*ім.?я(?:,\s*по батькові)?)?)$/i);
      if (h24PlausibleName(fromLabel)) picked = {name: fromLabel.replace(/\s+/g, ' ').trim(), box: null};
    }
    if (!picked.name && doc.title) {
      var fromTitle = String(doc.title).split(/[|–—]/).map(function (s) { return s.trim(); }).filter(h24LooksLikeName)[0];
      if (fromTitle) picked = {name: fromTitle, box: null};
    }
    if (!picked.name) {
      var fromH = h24All(doc, 'h1').map(h24Text).filter(function (t) { return h24LooksLikeName(t); })[0];
      if (fromH) picked = {name: fromH, box: null};
    }
    var name = picked.name || '';
    var box = picked.box;
    var birthRaw = '', sexRaw = '';
    function firstOutsideList(sel) {
      var all = h24All(doc, sel);
      return all.filter(function (e) { return !(e.closest && e.closest('table, [class*="patient-list"], [class*="patients-list"]')); })[0] || all[0];
    }
    if (box && box.querySelector) {
      var b = box.querySelector('[data-test="birthDate"]');
      var g = box.querySelector('[data-test="gender"]');
      if (b) birthRaw = h24Text(b);
      if (g) sexRaw = h24Text(g);
    }
    if (!birthRaw) { var be = firstOutsideList('[data-test="birthDate"]'); if (be) birthRaw = h24Text(be); }
    if (!sexRaw) { var ge = firstOutsideList('[data-test="gender"]'); if (ge) sexRaw = h24Text(ge); }
    if (!birthRaw) birthRaw = h24ValueByLabel(pairs, /дата\s+народження|дата\s+нар\b/i);
    if (!sexRaw) sexRaw = h24ValueByLabel(pairs, /^стать$/i);
    return {fullName: name.slice(0, 120), birthDate: h24NormDate(birthRaw), sex: h24NormSex(sexRaw, name)};
  }

  function h24ParseDocument(doc, opt) {
    doc = doc || document;
    var capturedAt = opt && opt.now ? String(opt.now) : new Date().toISOString();
    var patient = h24Patient(doc);
    var fallback = h24PageKind(doc);
    var episodes = [], diagnoses = [], meds = [];
    h24All(doc, 'table').forEach(function (table) {
      if (table.parentElement && table.parentElement.closest && table.parentElement.closest('table')) return;
      var parsed = h24ReadTable(table, fallback);
      if (!parsed) return;
      if (parsed.mode === 'meds') { meds = meds.concat(parsed.meds); return; }
      parsed.items.forEach(function (it) {
        if (parsed.mode === 'diagnosis' || it.role) diagnoses.push({code: it.code, name: it.name, role: it.role || ''});
        else episodes.push({code: it.code, name: it.name, start: it.start, end: it.end, status: it.status});
      });
    });
    var pairs = h24Pairs(doc);
    var allergyRe = /алерг/i;
    var medRe = /лікарськ|препарат|медикамент|^ліки$|постійно приймає/i;
    var allergies = pairs.filter(function (p) { return allergyRe.test(p[0]); }).map(function (p) { return p[1]; });
    if (!allergies.length) allergies = h24ChunksAfter(doc, allergyRe);
    var medPairs = pairs.filter(function (p) { return medRe.test(p[0]); }).map(function (p) { return p[1]; });
    if (medPairs.length) meds = meds.concat(medPairs);
    else meds = meds.concat(h24ChunksAfter(doc, /лікарські засоби|препарати|медикаменти/i));
    function splitList(arr) {
      var out = [];
      arr.forEach(function (s) {
        String(s || '').split(/\n|;|,(?=\s*[А-ЯІЇЄҐA-Z])/).forEach(function (part) { out.push(part); });
      });
      return out;
    }
    return {
      source: 'h24',
      version: 1,
      capturedAt: capturedAt,
      patient: patient,
      episodes: h24DedupRows(episodes).map(function (it) { return {code: it.code, name: it.name, start: it.start, end: it.end, status: it.status}; }),
      diagnoses: h24DedupRows(diagnoses).map(function (it) { return {code: it.code, name: it.name, role: it.role || ''}; }),
      allergies: h24DedupStr(splitList(allergies)),
      medications: h24DedupStr(splitList(meds))
    };
  }

  function h24HasSignal(data) {
    return !!(data && data.patient && data.patient.fullName) || (data.episodes && data.episodes.length) || (data.diagnoses && data.diagnoses.length) || (data.allergies && data.allergies.length) || (data.medications && data.medications.length);
  }
  function h24IsPatientPage(loc, doc) {
    var p = String(loc && loc.pathname || '');
    if (/\/patients\/list(?:\/|$)/.test(p)) return false;
    if (/\/patients\/[^/]+\/medical-card(?:\/|$)/.test(p)) return true;
    if (/\/patients\/[^/]+\/?$/.test(p)) return true;
    if (doc && doc.querySelector && doc.querySelector('[data-test="patientFullName"], h24-patient-short-info')) return true;
    return false;
  }
  function h24Line(doc, text) {
    var d = doc.createElement('div');
    d.textContent = text;
    return d;
  }
  function h24ShowPreview(doc, data, mode, raw) {
    var box = doc.getElementById('h24po-preview');
    if (!box) {
      box = doc.createElement('div');
      box.id = 'h24po-preview';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-label', 'Що зчитано з екрана');
      (doc.body || doc.documentElement).appendChild(box);
    }
    while (box.firstChild) box.removeChild(box.firstChild);
    var p = data && data.patient || {};
    var head = mode === 'wait' ? 'Шукаю дані на екрані…' : mode === 'ok' ? 'Скопійовано в буфер' : mode === 'fail' ? 'Не вдалося скопіювати автоматично' : 'На екрані не видно даних пацієнта';
    var lines = [head];
    if (mode !== 'wait') {
      lines.push('ПІБ: ' + (p.fullName ? 'є' : 'немає'));
      lines.push('Дата народження: ' + (p.birthDate ? 'є' : 'немає'));
      lines.push('Стать: ' + (p.sex === 'm' ? 'чоловік' : p.sex === 'f' ? 'жінка' : 'немає'));
      lines.push('Епізоди: ' + ((data.episodes || []).length));
      lines.push('Діагнози: ' + ((data.diagnoses || []).length));
      lines.push('Алергії: ' + ((data.allergies || []).length));
      lines.push('Ліки: ' + ((data.medications || []).length));
      lines.push('У МІС нічого не змінено. Дані не залишають браузер.');
      if (mode === 'ok') lines.push('У «Первинному огляді» — кнопка «Імпорт з H24».');
    }
    lines.forEach(function (t) { box.appendChild(h24Line(doc, t)); });
    if (raw) {
      var ta = doc.createElement('textarea');
      ta.readOnly = true;
      ta.value = raw;
      ta.setAttribute('aria-label', 'JSON для ручного копіювання');
      box.appendChild(ta);
    }
    var close = doc.createElement('button');
    close.type = 'button';
    close.dataset.h24Close = '1';
    close.textContent = 'Закрити';
    box.appendChild(close);
  }
  function h24Deliver(win) {
    var data = h24ParseDocument(win.document);
    if (!h24HasSignal(data)) { h24ShowPreview(win.document, data, 'empty'); return; }
    var raw = JSON.stringify(data);
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(raw, 'text');
        h24ShowPreview(win.document, data, 'ok');
        return;
      }
    } catch (e) {}
    var pending = null;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') pending = navigator.clipboard.writeText(raw);
    } catch (e2) {}
    if (pending && typeof pending.then === 'function') {
      pending.then(function () { h24ShowPreview(win.document, data, 'ok'); }, function () { h24ShowPreview(win.document, data, 'fail', raw); });
    } else h24ShowPreview(win.document, data, 'fail', raw);
  }
  function h24WaitAndDeliver(win) {
    var doc = win.document, started = Date.now(), settled = false, obs = null, timer = 0;
    function ready() { return h24HasSignal(h24ParseDocument(doc)); }
    function finish() {
      if (settled) return;
      settled = true;
      h24Busy = false;
      try { if (obs) obs.disconnect(); } catch (e) {}
      if (timer) clearInterval(timer);
      h24Deliver(win);
    }
    if (ready()) { h24Busy = false; h24Deliver(win); return; }
    h24ShowPreview(doc, h24ParseDocument(doc), 'wait');
    try {
      obs = new MutationObserver(function () { if (ready()) finish(); });
      obs.observe(doc.documentElement, {childList: true, subtree: true, characterData: true});
    } catch (e2) {}
    timer = setInterval(function () { if (ready() || Date.now() - started >= 5000) finish(); }, 300);
  }
  function h24OnClick(win) {
    if (h24Busy) return;
    h24Busy = true;
    h24WaitAndDeliver(win);
  }
  function h24EnsureButton(win) {
    var doc = win.document;
    if (!doc.body) return;
    var on = h24IsPatientPage(win.location, doc);
    var b = doc.getElementById('h24po-btn');
    if (!on) { if (b) b.hidden = true; return; }
    if (!b) {
      b = doc.createElement('button');
      b.id = 'h24po-btn';
      b.type = 'button';
      b.textContent = '→ в Первинний огляд';
      b.title = 'Зчитати з екрана ПІБ, епізоди, діагнози, алергії й ліки в буфер. У МІС нічого не змінюється.';
      doc.body.appendChild(b);
    }
    b.hidden = false;
  }
  function h24Boot(win) {
    if (win.__h24po) return;
    win.__h24po = 1;
    var doc = win.document;
    var css = doc.createElement('style');
    css.textContent = '#h24po-btn{position:fixed;z-index:2147483646;right:16px;bottom:84px;margin:0;padding:6px 10px;font:600 13px/1.3 sans-serif;color:#17364a;background:#f4f7f8;border:1px solid #8aa4b5;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12);cursor:pointer}'
      + '#h24po-preview{position:fixed;z-index:2147483647;right:16px;bottom:132px;width:260px;max-width:calc(100vw - 24px);padding:10px 12px;background:#f7f8fa;color:#1c2830;border:1px solid #d5dee6;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.16);font:14px/1.4 sans-serif}'
      + '#h24po-preview textarea{box-sizing:border-box;width:100%;height:72px;margin-top:6px;font:12px/1.3 ui-monospace,monospace}'
      + '#h24po-preview button{margin-top:6px}';
    (doc.head || doc.documentElement).appendChild(css);
    win.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('#h24po-btn, #h24po-preview button');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      if (t.id === 'h24po-btn') h24OnClick(win);
      else if (t.dataset && t.dataset.h24Close) {
        var box = doc.getElementById('h24po-preview');
        if (box) box.remove();
      }
    }, true);
    var scheduled = 0;
    function poke() {
      if (scheduled) return;
      var raf = win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 16); };
      scheduled = raf(function () { scheduled = 0; h24EnsureButton(win); });
    }
    try { new MutationObserver(poke).observe(doc.documentElement, {childList: true, subtree: true}); } catch (e) {}
    win.addEventListener('popstate', function () { h24EnsureButton(win); });
    h24EnsureButton(win);
  }

  var root = typeof window !== 'undefined' ? window : globalThis;
  root.h24ParseDocument = h24ParseDocument;
  root.h24IsPatientPage = h24IsPatientPage;
  if (root.document && root.location && /(^|\.)mis\.h24\.ua$/.test(root.location.hostname || '')) h24Boot(root);
})();
