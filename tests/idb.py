import asyncio, json
from playwright.async_api import async_playwright
import os
URL='file://'+os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','pervynnyi-ohliad.html')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs=[]
        ctx = await b.new_context(); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        # 1) старий користувач: пацієнти в localStorage
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.evaluate("""(()=>{const s=(k,v)=>{const e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input'))};
           s('meta_pib','Старий Перший'); savePatient(true); newPatient(); s('meta_pib','Старий Другий'); savePatient(true);
           const st=JSON.parse(localStorage.getItem('po.patients')||'{}'); localStorage.setItem('po.welcome','1'); return Object.keys(st).length})()""")
        # імітуємо стару версію: стерти IndexedDB і покласти дані в localStorage
        legacy = await pg.evaluate("JSON.stringify(Object.assign({}, IDB.ok ? IDB.cache : JSON.parse(localStorage.getItem('po.patients')||'{}')))")
        await pg.evaluate("l=>{ indexedDB.deleteDatabase('po-db'); localStorage.setItem('po.patients', l); localStorage.setItem('po.last', Object.keys(JSON.parse(l))[0]); }", legacy); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_timeout(1200)
        r = await pg.evaluate("[IDB.ok, Object.keys(IDB.cache||{}).length, localStorage.getItem('po.patients')===null, document.querySelectorAll('#plist .prow').length, document.getElementById('meta_pib').value]")
        print('migration: idb ok, count, ls removed, list rows, restored:', r)
        # 2) великий обсяг: 600 пацієнтів по ~40 КБ
        await pg.evaluate("""(()=>{const st=loadStore(); const big='x'.repeat(40000); for(let i=0;i<600;i++){ st['pbig'+i]={name:'Тест '+i, updated:Date.now(), snap:{v:1,f:{meta_pib:'Тест '+i, pad:big},c:{}}}; } return saveStore(st)})()""")
        await pg.wait_for_timeout(3000); await pg.reload(); await pg.wait_for_timeout(2500)
        print('after 600×40KB reload:', await pg.evaluate("Object.keys(loadStore()).length"), 'MB≈', await pg.evaluate("Math.round(JSON.stringify(loadStore()).length/1e6)"))
        # 3) видалення
        await pg.evaluate("(()=>{const st=loadStore(); for(let i=0;i<600;i++) delete st['pbig'+i]; saveStore(st)})()"); await pg.wait_for_timeout(1500); await pg.reload(); await pg.wait_for_timeout(1500)
        print('after delete reload:', await pg.evaluate("Object.keys(loadStore()).length"))
        print('errs', errs); await b.close()
asyncio.run(main())
