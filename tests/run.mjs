// Повна перевірка: збирання + всі тести послідовно. node tests/run.mjs [--quick]
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
const quick = process.argv.includes('--quick');
const steps = [['Збирання', 'node', [path.join(root, 'build.mjs')]], ['Основний сценарій', 'node', [path.join(here, 'full.cjs')]], ['Нові функції', 'node', [path.join(here, 'features.cjs')]], ['UI-сценарій пацієнта', 'node', [path.join(here, 'workflow.cjs')]], ['Збереження після перезапуску', 'node', [path.join(here, 'idb.cjs')]]];
if (!quick) steps.push(['Аудит усіх хвороб', 'node', [path.join(here, 'audit.cjs')]], ['Випадкові натискання', 'node', [path.join(here, 'fuzz.cjs'), '1', '6']]);
let bad = 0;
for (const [name, cmd, args] of steps){
  const t = Date.now();
  try { const o = execFileSync(cmd, args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000});
    console.log(`✅ ${name} (${((Date.now() - t) / 1000).toFixed(0)} с) — ${o.trim().split('\n').pop()}`); }
  catch (e){ bad++; console.log(`❌ ${name}\n${(e.stdout || '').split('\n').filter(l=>/❌|проблем|BAD|UNRESOLVED|Error|Помилка/.test(l)).slice(0, 15).join('\n')}${e.stderr ? '\n' + e.stderr.slice(0, 800) : ''}`); }
}
process.exit(bad ? 1 : 0);
