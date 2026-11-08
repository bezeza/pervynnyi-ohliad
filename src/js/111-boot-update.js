/* 0.10, етап 6: під час побудови update() лише позначає, що оновлення потрібне (див. 101-boot.js) */
{ const u0 = update; update = function(){ if (PO_BOOT){ PO_BOOT_UPD = true; return; } return u0.apply(this, arguments); }; }
