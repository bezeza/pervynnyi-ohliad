/* ===== 0.9.3.78 — стиль «Apple»: документи — у шапці, коли вміщаються (стиль компактніший, тож перевіряємо ще раз після вмикання) ===== */
{ const x0 = uiStyleApply; uiStyleApply = function(){ const r = x0.apply(this, arguments); try{ if (SHELL && SHELL.placeDocs){ SHELL.placeDocs(); if (SHELL.sync) SHELL.sync(); } }catch(e){} return r; }; }
try{ requestAnimationFrame(()=>{ try{ SHELL.placeDocs(); }catch(e){} }); }catch(e){}
try{ SHELL.placeDocs(); }catch(e){}
