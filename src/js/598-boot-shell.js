/* 0.10, етап 6: перерозташування документів у шапці — один раз після побудови (див. 101-boot.js) */
{ const pd0 = SHELL.placeDocs; SHELL.placeDocs = function(){ if (PO_BOOT) return; return pd0.apply(this, arguments); }; }
