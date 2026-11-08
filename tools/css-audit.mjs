#!/usr/bin/env node
/* Аудит стилів для оновлення інтерфейсу 0.10 (PLAN-UI-0.10.md, «Фундамент»).
   Рахує в src/styles.css: розміри шрифтів (екран окремо від друку), кольори, !important, рівні z-index;
   у src/js — емодзі, що працюють як значки. Нічого не змінює.
   node tools/css-audit.mjs          — короткий звіт
   node tools/css-audit.mjs --json   — цифри для порівняння «до / після» */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/* правила з контекстом @media: друк — окремо (бланки МОЗ не чіпаємо) */
function rules(src){
  const out = []; const stack = []; let buf = '', i = 0;
  for (; i < src.length; i++){
    const c = src[i];
    if (c === '{'){ stack.push(buf.trim()); buf = ''; }
    else if (c === '}'){
      const sel = stack.pop() || '';
      if (buf.trim() && !sel.startsWith('@')) out.push({sel, body:buf, ctx:stack.slice()});
      buf = '';
    }
    else buf += c;
  }
  return out;
}
const R = rules(css);
const isPrint = r => r.ctx.some(c=>/@media[^{]*\bprint\b/.test(c) && !/\bscreen\b/.test(c)) || /#print\b|\.b003|\.bA4|\.sheet\b|\.paper\b|\.b028|\.fb-|\.f0034|@page/.test(r.sel);

const sizes = {screen:new Map(), print:new Map()};
const colors = new Map(); let important = 0; const z = new Map();
const add = (m, k) => m.set(k, (m.get(k) || 0) + 1);
for (const r of R){
  const where = isPrint(r) ? 'print' : 'screen';
  for (const m of r.body.matchAll(/font-size\s*:\s*([^;!}]+)/g)) add(sizes[where], m[1].trim());
  for (const m of r.body.matchAll(/(?:^|;)\s*font\s*:\s*([^;!}]+)/g)){ const s = m[1].match(/(?:^|\s)(\d*\.?\d+(?:px|pt|rem|em|%))(?:\/|\s)/); if (s) add(sizes[where], s[1]); }
  for (const m of r.body.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)) add(colors, m[0].toLowerCase().replace(/\s+/g, ''));
  important += (r.body.match(/!important/g) || []).length;
  for (const m of r.body.matchAll(/z-index\s*:\s*([^;!}]+)/g)) add(z, m[1].trim());
}
const jsDir = path.join(root, 'src', 'js');
let emoji = 0; const emSet = new Map();
for (const f of fs.readdirSync(jsDir)){
  if (!f.endsWith('.js') || /data-/.test(f)) continue;
  const s = fs.readFileSync(path.join(jsDir, f), 'utf8');
  for (const m of s.matchAll(/\p{Extended_Pictographic}/gu)){ emoji++; add(emSet, m[0]); }
}
const res = {
  fontSizesScreen: sizes.screen.size, fontSizesPrint: sizes.print.size,
  colors: colors.size, important, zIndexLevels: z.size, emojiUses: emoji, emojiKinds: emSet.size,
  topScreenSizes: [...sizes.screen].sort((a, b)=>b[1] - a[1]).slice(0, 40),
  zIndex: [...z].sort((a, b)=>(parseFloat(a[0]) || 0) - (parseFloat(b[0]) || 0)),
};
if (process.argv.includes('--json')) console.log(JSON.stringify(res, null, 1));
else {
  console.log(`Розмірів шрифту (екран): ${res.fontSizesScreen}; друк і бланки: ${res.fontSizesPrint}`);
  console.log(`Кольорів (різних значень): ${res.colors}`);
  console.log(`!important: ${res.important}`);
  console.log(`Рівнів z-index: ${res.zIndexLevels}`);
  console.log(`Емодзі у коді інтерфейсу: ${res.emojiUses} (різних: ${res.emojiKinds})`);
}
