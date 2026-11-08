/* 0.10, етап 6: кінець побудови — відкладені оновлення виконуються один раз (див. 101-boot.js).
   Порядок важливий: спершу шапка й банер (SHELL.sync очищає колонки банера), потім update(), що їх доповнює. */
PO_BOOT = false; PO_BOOT_CSS.remove();
try{ SHELL.placeDocs(); }catch(e){}
try{ SHELL.sync(); }catch(e){}
try{ update(); }catch(e){ console.warn(e); }
