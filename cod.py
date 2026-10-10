import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs=[]
        m = await b.new_page(viewport={'width':390,'height':844}, locale='uk-UA', device_scale_factor=2, is_mobile=True, has_touch=True)
        m.on('pageerror', lambda e: errs.append(str(e)))
        await m.goto('file:///home/claude/pervynnyi-ohliad.html'); await m.wait_for_timeout(400)
        await m.add_style_tag(content='.toast{display:none!important}')
        await m.evaluate("(()=>{MODE='amb'; applyMode(); const p=PRESETS.find(x=>x.key==='gh'); applyPreset(p, HV.cards[PRESETS.indexOf(p)]); show(TABS.indexOf(SECTIONS.find(s=>s.id==='dx')));})()")
        await m.wait_for_timeout(200)
        await m.click('text=Підібрати за діагнозом'); await m.wait_for_timeout(200)
        await m.evaluate("F('dx.mkh').el.closest('.f').scrollIntoView()"); await m.wait_for_timeout(200); await m.screenshot(path='c1.png')
        await m.evaluate("F('dx.icpcr').el.closest('.f').scrollIntoView()"); await m.wait_for_timeout(200); await m.screenshot(path='c2.png')
        await m.evaluate("show(TABS.indexOf(SET)); document.querySelector('.dictbox').scrollIntoView()"); await m.wait_for_timeout(200); await m.screenshot(path='c3.png')
        print(errs); await b.close()
asyncio.run(main())
