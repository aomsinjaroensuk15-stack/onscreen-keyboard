/* ================================================================
 * On-Screen Keyboard  v2.1 — ไทย/English (Kedmanee, TIS 820)
 * ================================================================
 * v2.1 fixes:
 *  - จบการเล็งที่ pointerdown/touchstart ทันที (แก้บั๊ก touch บนมือถือที่
 *    pointerdown.preventDefault บล็อก click เดิม)
 *  - grace period 600ms กลืน click หลังเล็งเสร็จ กันเกมได้รับคลิกปลอม
 *  - ปุ่ม 🔥 ทดสอบยิง key + แสดงจำนวน doc/iframe ที่เข้าถึงได้ (diagnostics)
 *  - ปุ่ม 🔗 เต็มจอ: เปิด Scratch แบบ embed (เกมเป็นหน้าหลัก ยิงถึง 100%)
 *  - hook iframe ซ้ำทุก 2 วิ (รองรับ iframe ที่โหลดช้า)
 *  - เล็งเจอช่องพิมพ์ → ปิดโหมดเกมอัตโนมัติ / เล็งเจอ canvas → เปิดให้
 * ================================================================ */
(function () {
'use strict';

/* ==================== PHASE 1: layout data ==================== */
var LAY = {
en: { rows: [
  [['Backquote','`','~'],['Digit1','1','!'],['Digit2','2','@'],['Digit3','3','#'],['Digit4','4','$'],['Digit5','5','%'],['Digit6','6','^'],['Digit7','7','&'],['Digit8','8','*'],['Digit9','9','('],['Digit0','0',')'],['Minus','-','_'],['Equal','=','+'],['Backspace','\u232B','','osk-w2']],
  [['Tab','Tab','','osk-w15'],['KeyQ','q','Q'],['KeyW','w','W'],['KeyE','e','E'],['KeyR','r','R'],['KeyT','t','T'],['KeyY','y','Y'],['KeyU','u','U'],['KeyI','i','I'],['KeyO','o','O'],['KeyP','p','P'],['BracketLeft','[','{'],['BracketRight',']','}'],['Backslash','\\','|']],
  [['Caps','Caps','','osk-w175'],['KeyA','a','A'],['KeyS','s','S'],['KeyD','d','D'],['KeyF','f','F'],['KeyG','g','G'],['KeyH','h','H'],['KeyJ','j','J'],['KeyK','k','K'],['KeyL','l','L'],['Semicolon',';',':'],['Quote',"'",'"'],['Enter','Enter','','osk-w225']],
  [['ShiftL','Shift','','osk-w225'],['KeyZ','z','Z'],['KeyX','x','X'],['KeyC','c','C'],['KeyV','v','V'],['KeyB','b','B'],['KeyN','n','N'],['KeyM','m','M'],['Comma',',','<'],['Period','.','>'],['Slash','/','?'],['ShiftR','Shift','','osk-w275']],
  [['Ctrl','Ctrl','','osk-w15'],['Win','Win','','osk-w15'],['Alt','Alt','','osk-w15'],['Space','','','osk-w6'],['AltGr','AltGr','','osk-w15'],['Lang','ไทย','','osk-w175'],['ARR']]
]},
th: { rows: [
  [['Backquote','%','_'],['Digit1','ๅ','๑'],['Digit2','/','๒'],['Digit3','-','๓'],['Digit4','ภ','๔'],['Digit5','ถ','ู'],['Digit6','ุ','฿'],['Digit7','ึ','๕'],['Digit8','ค','๖'],['Digit9','ต','๗'],['Digit0','จ','๘'],['Minus','ข','๙'],['Equal','ช',''],['Backspace','\u232B','','osk-w2']],
  [['Tab','Tab','๐','osk-w15'],['KeyQ','ๆ','"'],['KeyW','ไ','ฎ'],['KeyE','ำ','ฑ'],['KeyR','พ','ธ'],['KeyT','ะ','ํ'],['KeyY','ั','๊'],['KeyU','ี','ณ'],['KeyI','ร','ฯ'],['KeyO','น','ญ'],['KeyP','ย','ฐ'],['BracketLeft','บ',','],['BracketRight','ล',''],['Backslash','ฃ','']],
  [['Caps','Caps','','osk-w175'],['KeyA','ฟ','ฆ'],['KeyS','ห','ฏ'],['KeyD','ก','โ'],['KeyF','ด','ฌ'],['KeyG','เ','็'],['KeyH','้','๋'],['KeyJ','่','ษ'],['KeyK','า','ศ'],['KeyL','ส','ซ'],['Semicolon','ว','.'],['Quote','ง','ฅ'],['Enter','Enter','','osk-w225']],
  [['ShiftL','Shift','','osk-w225'],['KeyZ','ผ','('],['KeyX','ป',')'],['KeyC','แ','ฉ'],['KeyV','อ','ฮ'],['KeyB','ิ','ฺ'],['KeyN','ื','์'],['KeyM','ท','?'],['Comma','ม','ฒ'],['Period','ใ','ฬ'],['Slash','ฝ','ฦ'],['ShiftR','Shift','','osk-w275']],
  [['Ctrl','Ctrl','','osk-w15'],['Win','Win','','osk-w15'],['Alt','Alt','','osk-w15'],['Space','','','osk-w6'],['AltGr','AltGr','','osk-w15'],['Lang','EN','','osk-w175'],['ARR']]
]}};

/* key meta สำหรับโหมดเกม: id -> [key, code, keyCode, ย้ำได้ไหม] */
var KEYMETA = {
  Backspace: ['Backspace', 'Backspace', 8, true],
  Tab:       ['Tab', 'Tab', 9, false],
  Enter:     ['Enter', 'Enter', 13, false],
  Space:     [' ', 'Space', 32, true],
  Up:        ['ArrowUp', 'ArrowUp', 38, true],
  Down:      ['ArrowDown', 'ArrowDown', 40, true],
  Left:      ['ArrowLeft', 'ArrowLeft', 37, true],
  Right:     ['ArrowRight', 'ArrowRight', 39, true],
  ShiftL:    ['Shift', 'ShiftLeft', 16, false],
  ShiftR:    ['Shift', 'ShiftRight', 16, false],
  Ctrl:      ['Control', 'ControlLeft', 17, false],
  Alt:       ['Alt', 'AltLeft', 18, false],
  Win:       ['Meta', 'MetaLeft', 91, false],
  AltGr:     ['AltGraph', 'AltRight', 225, false]
};

/* ==================== PHASE 2: CSS + state + helpers ==================== */
var CSS = `
.osk-wrap{font-family:'Segoe UI',Tahoma,sans-serif;width:100%;max-width:980px}
.osk-bar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;cursor:move;padding:2px}
.osk-btn{border:1px solid #c9c9cf;background:#fff;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer;color:#222;flex:none}
.osk-btn:hover{background:#f0f0f3}
.osk-btn.on{background:#1a73e8;color:#fff;border-color:#1a73e8}
.osk-btn.game-on{background:#188038;color:#fff;border-color:#188038}
.osk-tgt{margin-left:auto;font-size:12px;color:#888;font-style:italic;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:default}
.osk-out{width:100%;box-sizing:border-box;border:1px solid #c9c9cf;border-radius:12px;background:#fff;padding:12px 14px;font-size:18px;min-height:88px;resize:vertical;margin-bottom:12px;font-family:inherit;color:#222}
.osk-kb{background:#202024;border-radius:16px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.osk-row{display:flex;gap:8px;margin-bottom:8px}
.osk-k{--h:0;--osk-hue:0;flex:1 1 0;min-width:0;height:56px;border:none;border-radius:7px;background:#3f3f46;color:#f4f4f6;font-size:16px;position:relative;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;box-shadow:0 4px 0 #17171a;font-family:inherit;transition:transform .08s ease-out,background .08s ease-out}
.osk-k .osk-s{position:absolute;top:4px;right:7px;font-size:11px;color:#a5a5ad;pointer-events:none}
.osk-k:hover{background:#4c4c54}
.osk-k.pressed{transform:translateY(3px);box-shadow:0 1px 0 #17171a;background:#5a5a63}
.osk-k.on{background:#f4f4f6;color:#202024}
.osk-k.on .osk-s{color:#55555e}
.osk-w15{flex-grow:1.5}.osk-w175{flex-grow:1.75}.osk-w2{flex-grow:2}.osk-w225{flex-grow:2.25}.osk-w275{flex-grow:2.75}.osk-w6{flex-grow:6}
.osk-arr{flex:2.6 1 0;display:flex;flex-direction:column;gap:8px}
.osk-arow{display:flex;gap:8px;flex:1}
.osk-arow .osk-k{height:auto;min-height:26px}
.osk-sp{flex:1;visibility:hidden}
@property --osk-hue{syntax:'<number>';inherits:false;initial-value:0}
.osk-led .osk-k{animation:oskHue 5s linear infinite;box-shadow:0 4px 0 #17171a,0 0 14px 2px hsl(calc(var(--h) + var(--osk-hue)) 100% 60% / .5)}
.osk-led .osk-k .osk-c{text-shadow:0 0 8px hsl(calc(var(--h) + var(--osk-hue)) 100% 65% / .85)}
@keyframes oskHue{to{--osk-hue:360}}
`;

/* ---------- state ---------- */
var SCR = null, KB = null, BAR = {}, activeEl = null, ROOT = null;
var lang = 'th', caps = false, held = false, sticky = false, shiftUsed = false;
var sndOn = true, ledOn = true, ac = null, codeMap = {}, DEFS = {};
var picking = false, hl = null, hookedDocs = [], lastPick = 0;
var gameMode = false;
var heldKeys = {}, heldMeta = {}, repeatTimers = {};

/* ---------- เป้าหมายการพิมพ์ ---------- */
function isTypeable(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  var tag = el.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text','search','url','tel','password','email','number'].indexOf(t) >= 0;
  }
  return false;
}
function typeableTarget() { return isTypeable(activeEl) ? activeEl : null; }
function TGT() { return typeableTarget() || SCR; }
function targetName(el) {
  if (!el) return '—';
  if (el === SCR) return 'กระดานโน้ต';
  var n = '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '>';
  if (el.tagName === 'IFRAME') {
    try { if (el.contentDocument) n += ' (iframe)'; else n = '⚠ iframe เข้าไม่ถึง'; }
    catch (e) { n = '⚠ iframe เข้าไม่ถึง'; }
  }
  return n;
}
function statusSet(t) { if (BAR.tgt) BAR.tgt.textContent = t; }
function setTarget(el, fromPick) {
  activeEl = el;
  var typeable = isTypeable(el);
  if (fromPick) {   // เล็งเจอช่องพิมพ์ → ออกโหมดเกม / เจอ canvas → เข้าโหมดเกม
    if (typeable && gameMode) toggleGame(false);
    if (!typeable && el !== SCR && !gameMode) toggleGame(true);
  }
  statusSet('พิมพ์ลง: ' + targetName(el) + (typeable ? '' : ' (ส่ง key)'));
}

/* ---------- 🎮 GAME CORE ---------- */
function collectDocs() {
  var docs = [], cross = 0, seen = [];
  (function walk(doc) {
    if (!doc || seen.indexOf(doc) >= 0) return;
    seen.push(doc); docs.push(doc);
    var fr;
    try { fr = doc.querySelectorAll('iframe'); } catch (e) { return; }
    for (var i = 0; i < fr.length; i++) {
      try {
        var d = fr[i].contentDocument;
        if (d) walk(d); else cross++;
      } catch (e) { cross++; }
    }
  })(document);
  return { docs: docs, cross: cross };
}
function fireInDoc(doc, opts, withKeyUp, printable) {
  var W;
  try { W = doc.defaultView; } catch (e) { return; }
  if (!W) return;
  var t = doc.body || doc.documentElement;
  if (!t) return;
  try {
    t.dispatchEvent(new W.KeyboardEvent('keydown', opts));
    if (printable) {
      t.dispatchEvent(new W.KeyboardEvent('keypress', {
        key: opts.key, charCode: opts.keyCode, keyCode: opts.keyCode, which: opts.keyCode,
        bubbles: true, cancelable: true
      }));
    }
    if (withKeyUp) t.dispatchEvent(new W.KeyboardEvent('keyup', opts));
  } catch (e) {}
}
function broadcast(opts, withKeyUp, printable) {
  var c = collectDocs();
  for (var i = 0; i < c.docs.length; i++) fireInDoc(c.docs[i], opts, withKeyUp, printable);
  return c;
}
function metaOf(id, def) {
  if (def && def.b && def.b.length === 1) {
    var k = effChar(def);
    return { key: k, code: id, kc: k.toUpperCase().charCodeAt(0), repeat: true };
  }
  var m = KEYMETA[id];
  if (!m) return null;
  return { key: m[0], code: m[1], kc: m[2], repeat: m[3] };
}
function gameKeyDown(id, def) {
  if (heldKeys[id]) return;
  var meta = metaOf(id, def);
  if (!meta) return;
  heldKeys[id] = true; heldMeta[id] = meta;
  var opts = { key: meta.key, code: meta.code, keyCode: meta.kc, which: meta.kc, bubbles: true, cancelable: true };
  var printable = meta.key.length === 1;
  var c = broadcast(opts, false, printable);
  statusSet('➜ ' + (meta.key === ' ' ? 'Space' : meta.key) + ' → ' + c.docs.length + ' doc' + (c.cross ? ' ⚠เข้าไม่ถึง ' + c.cross + ' iframe' : ''));
  snd();
  if (meta.repeat) {
    (function (o, p, docs) {
      repeatTimers[id] = setInterval(function () {
        for (var i = 0; i < docs.length; i++) fireInDoc(docs[i], o, false, p);
      }, 120);
    })(opts, printable, c.docs.slice());
  }
}
function gameKeyUp(id) {
  if (!heldKeys[id]) return;
  heldKeys[id] = false;
  if (repeatTimers[id]) { clearInterval(repeatTimers[id]); delete repeatTimers[id]; }
  var meta = heldMeta[id];
  delete heldMeta[id];
  if (!meta) return;
  var opts = { key: meta.key, code: meta.code, keyCode: meta.kc, which: meta.kc, bubbles: true, cancelable: true };
  broadcast(opts, true, false);
}
function stopAllRepeats() {
  Object.keys(repeatTimers).forEach(function (id) {
    clearInterval(repeatTimers[id]); delete repeatTimers[id];
  });
  heldKeys = {}; heldMeta = {};
}

/* ---------- 🎯 crosshair picker (v2.1: จบที่ pointerdown/touchstart) ---------- */
function pierceTarget(doc, x, y) {
  var el = doc.elementFromPoint(x, y);
  var guard = 0;
  while (el && el.tagName === 'IFRAME' && guard++ < 10) {
    var d;
    try { d = el.contentDocument; } catch (e) { d = null; }
    if (!d) return el;
    var r = el.getBoundingClientRect();
    x = (x - r.left) * (d.documentElement.clientWidth  / r.width);
    y = (y - r.top)  * (d.documentElement.clientHeight / r.height);
    doc = d;
    el = d.elementFromPoint(x, y);
  }
  return el;
}
function absRect(el) {
  var r = el.getBoundingClientRect();
  var out = { left: r.left, top: r.top, width: r.width, height: r.height };
  var win = el.ownerDocument.defaultView, g = 0;
  while (win && win.frameElement && g++ < 10) {
    var fr = win.frameElement.getBoundingClientRect();
    out.left += fr.left; out.top += fr.top;
    win = win.parent;
  }
  return out;
}
function showHl(el) {
  if (!hl) {
    hl = document.createElement('div');
    hl.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;border:2px solid #1a73e8;background:rgba(26,115,232,.15);border-radius:4px;transition:all .05s';
    document.body.appendChild(hl);
  }
  var r = absRect(el);
  hl.style.display = 'block';
  hl.style.left = (r.left - 3) + 'px'; hl.style.top = (r.top - 3) + 'px';
  hl.style.width = (r.width + 6) + 'px'; hl.style.height = (r.height + 6) + 'px';
  statusSet('เล็ง: ' + targetName(el));
}
function hideHl() { if (hl) hl.style.display = 'none'; }
function pickMove(doc, x, y) {
  var el = pierceTarget(doc, x, y);
  if (el && el !== hl) showHl(el);
}
/* จบการเล็งทันทีตอน pointerdown (แก้บั๊ก touch: preventDefault บล็อก click) */
function makePickDown(doc) {
  return function (e) {
    if (!picking) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var el;
    try { el = pierceTarget(doc, e.clientX, e.clientY) || e.target; } catch (err) { el = e.target; }
    lastPick = Date.now();
    if (el && el.closest && el.closest('.osk-wrap')) { togglePick(false); return; }
    setTarget(el, true);
    togglePick(false);
  };
}
/* grace 600ms: กลืน click/touch หลังเล็งเสร็จ กันเกมได้รับคลิกปลอม (แต่ไม่กลืนคลิกบนแป้นตัวเอง) */
function graceSwallow(e) {
  if (!(picking || Date.now() - lastPick < 600)) return;
  if (e.target && e.target.closest && e.target.closest('.osk-wrap')) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
}
function makePickTouchMove(doc) {
  return function (e) {
    if (!picking) return;
    e.preventDefault();
    var t = e.changedTouches[0];
    if (t) pickMove(doc, t.clientX, t.clientY);
  };
}
function hookDoc(doc) {
  if (!doc || hookedDocs.indexOf(doc) >= 0) return;
  hookedDocs.push(doc);
  doc.addEventListener('focusin', function (e) {
    if (!SCR) return;
    if (isTypeable(e.target)) setTarget(e.target, false);
  });
  doc.addEventListener('mousemove', function (e) { if (picking) pickMove(doc, e.clientX, e.clientY); }, true);
  doc.addEventListener('touchmove', makePickTouchMove(doc), { capture: true, passive: false });
  doc.addEventListener('pointerdown', makePickDown(doc), true);
  doc.addEventListener('touchstart', graceSwallow, { capture: true, passive: false });
  ['mousedown', 'click', 'pointerup'].forEach(function (t) {
    doc.addEventListener(t, graceSwallow, true);
  });
  doc.addEventListener('keydown', function (e) {
    if (picking && e.key === 'Escape') { e.stopPropagation(); togglePick(false); }
  }, true);
}
function hookIframesDeep(doc) {
  var fr;
  try { fr = doc.querySelectorAll('iframe'); } catch (e) { return; }
  for (var i = 0; i < fr.length; i++) {
    try {
      var d = fr[i].contentDocument;
      if (d) { hookDoc(d); hookIframesDeep(d); }
    } catch (e) {}
  }
}
function togglePick(force) {
  picking = force !== undefined ? force : !picking;
  if (BAR.pick) BAR.pick.classList.toggle('on', picking);
  document.documentElement.style.cursor = picking ? 'crosshair' : '';
  if (picking) {
    hookIframesDeep(document);
    statusSet('🎯 แตะเป้าหมาย 1 ครั้งเพื่อเลือก (Esc ยกเลิก)');
  } else {
    hideHl();
  }
}

/* top document listeners */
document.addEventListener('mousemove', function (e) { if (picking) pickMove(document, e.clientX, e.clientY); }, true);
document.addEventListener('touchmove', function (e) { if (picking) { e.preventDefault(); var t = e.changedTouches[0]; if (t) pickMove(document, t.clientX, t.clientY); } }, { capture: true, passive: false });
document.addEventListener('pointerdown', makePickDown(document), true);
document.addEventListener('touchstart', graceSwallow, { capture: true, passive: false });
['mousedown', 'click', 'pointerup'].forEach(function (t) {
  document.addEventListener(t, graceSwallow, true);
});
document.addEventListener('scroll', function () { if (picking) hideHl(); }, true);
document.addEventListener('keydown', function (e) {
  if (picking && e.key === 'Escape') { e.stopPropagation(); togglePick(false); }
}, true);

/* focus ปกติ */
document.addEventListener('focusin', function (e) {
  if (!SCR) return;
  if (KB && KB.contains(e.target)) return;
  if (e.target.closest && e.target.closest('.osk-wrap')) return;
  if (isTypeable(e.target)) setTarget(e.target, false);
});

/* ---------- helpers โหมดพิมพ์ข้อความ ---------- */
function shiftActive() { return held || sticky; }
function effChar(def) {
  var sh = shiftActive();
  if (/^[a-z]$/.test(def.b) && caps) { return sh ? def.b : def.s; }
  return sh ? (def.s || def.b) : def.b;
}
function setVal(el, v) {
  var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
}
function fireInput(el) { el.dispatchEvent(new Event('input', { bubbles: true })); }
function ins(t) {
  var el = TGT();
  if (el.isContentEditable) { el.focus(); document.execCommand('insertText', false, t); return; }
  var s = el.selectionStart == null ? el.value.length : el.selectionStart;
  var e = el.selectionEnd   == null ? el.value.length : el.selectionEnd;
  setVal(el, el.value.slice(0, s) + t + el.value.slice(e));
  el.setSelectionRange(s + t.length, s + t.length);
  fireInput(el);
}
function delBack() {
  var el = TGT();
  if (el.isContentEditable) {
    el.focus();
    var sel = window.getSelection();
    if (sel.isCollapsed) sel.modify('move', 'backward', 'character');
    document.execCommand('forwardDelete');
    return;
  }
  var v = el.value, s = el.selectionStart, e = el.selectionEnd;
  if (s !== e) { setVal(el, v.slice(0, s) + v.slice(e)); el.setSelectionRange(s, s); fireInput(el); return; }
  if (!s) return;
  var ch = [...v.slice(0, s)]; ch.pop();
  setVal(el, ch.join('') + v.slice(s));
  el.setSelectionRange(s - 1, s - 1);
  fireInput(el);
}
function move(d) {
  var el = TGT();
  if (el.isContentEditable) {
    el.focus();
    window.getSelection().modify('move', d < 0 ? 'backward' : 'forward', 'character');
    return;
  }
  var v = el.value, s = el.selectionStart, e = el.selectionEnd;
  if (d < 0) {
    if (s !== e) { el.setSelectionRange(s, s); return; }
    if (!s) return;
    var p = [...v.slice(0, s)].slice(0, -1).join('').length;
    el.setSelectionRange(p, p);
  } else {
    if (s !== e) { el.setSelectionRange(e, e); return; }
    if (e >= v.length) return;
    var seg = [...v.slice(e)];
    el.setSelectionRange(e + seg[0].length, e + seg[0].length);
  }
}
function moveLine(d) {
  var el = TGT();
  if (el.isContentEditable) {
    el.focus();
    window.getSelection().modify('move', d < 0 ? 'backward' : 'forward', 'line');
    return;
  }
  var v = el.value, pos = el.selectionStart;
  var before = v.slice(0, pos), lineStart = before.lastIndexOf('\n') + 1;
  var col = [...before.slice(lineStart)].length;
  var nl = v.indexOf('\n', pos);
  if (d < 0) {
    if (!lineStart) return;
    var prevEnd = lineStart - 1, prevStart = v.lastIndexOf('\n', Math.max(0, prevEnd - 1)) + 1;
    var len = [...v.slice(prevStart, prevEnd)].length;
    var p = prevStart + [...v.slice(prevStart, prevStart + Math.min(col, len))].join('').length;
    el.setSelectionRange(p, p);
  } else {
    if (nl === -1) return;
    var ns = nl + 1, nn = v.indexOf('\n', ns), ne = nn === -1 ? v.length : nn;
    var len2 = [...v.slice(ns, ne)].length;
    var p2 = ns + [...v.slice(ns, ns + Math.min(col, len2))].join('').length;
    el.setSelectionRange(p2, p2);
  }
}
function snd() {
  if (!sndOn) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1500, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 0.06);
  } catch (e) {}
}

/* ==================== PHASE 3: render + events + init ==================== */
function syncMeta() {
  KB.querySelectorAll('[data-id="ShiftL"],[data-id="ShiftR"]').forEach(function (b) { b.classList.toggle('on', shiftActive()); });
  KB.querySelectorAll('[data-id="Caps"]').forEach(function (b) { b.classList.toggle('on', caps); });
  BAR.lang.textContent = lang === 'th' ? 'ไทย' : 'EN';
  if (BAR.game) {
    BAR.game.classList.toggle('game-on', gameMode);
    BAR.game.textContent = gameMode ? '🎮 เกม: เปิด' : '🎮 เกม: ปิด';
  }
}
function toggleLang() { lang = lang === 'th' ? 'en' : 'th'; render(); }
function toggleGame(force) {
  gameMode = force !== undefined ? force : !gameMode;
  if (!gameMode) stopAllRepeats();
  if (gameMode) {
    hookIframesDeep(document);
    var c = collectDocs();
    statusSet('🎮 โหมดเกม: ยิง key ไป ' + c.docs.length + ' doc' + (c.cross ? ' ⚠เข้าไม่ถึง ' + c.cross + ' iframe' : '') + ' — กดปุ่มได้เลย ไม่ต้องเล็ง');
  } else {
    statusSet('โหมดพิมพ์ข้อความ: แตะช่องที่จะพิมพ์ หรือ 🎯 เล็ง element');
  }
  syncMeta();
}
function afterKey() { snd(); shiftUsed = true; if (sticky) sticky = false; syncMeta(); }

function pressDown(id, def, phys) {
  if (id === 'Lang') { toggleLang(); return; }
  if (gameMode) {
    if (id === 'Caps') { caps = !caps; syncMeta(); return; }
    if (id === 'ShiftL' || id === 'ShiftR') {
      if (phys) held = true; else if (held) shiftUsed = true; else { held = true; shiftUsed = false; }
      syncMeta();
    }
    gameKeyDown(id, def);
    return;
  }
  if (id === 'ShiftL' || id === 'ShiftR') {
    if (phys) { held = true; }
    else if (held) { shiftUsed = true; } else { held = true; shiftUsed = false; }
    syncMeta(); return;
  }
  if (id === 'Caps') { caps = !caps; syncMeta(); return; }
  if (id === 'Ctrl' || id === 'Win' || id === 'Alt' || id === 'AltGr') return;
  if (id === 'Backspace') { delBack(); snd(); return; }
  if (id === 'Enter')     { ins('\n'); snd(); return; }
  if (id === 'Tab')       { ins(shiftActive() && lang === 'th' ? '๐' : '\t'); snd(); return; }
  if (id === 'Space')     { ins(' ');  snd(); return; }
  if (id === 'Up')    { moveLine(-1); return; }
  if (id === 'Down')  { moveLine(1);  return; }
  if (id === 'Left')  { move(-1); return; }
  if (id === 'Right') { move(1);  return; }
  if (!def || !def.b) return;
  ins(effChar(def));
  afterKey();
}
function pressUp(id) {
  if (gameMode) {
    if (id === 'ShiftL' || id === 'ShiftR') {
      gameKeyUp(id);
      held = false; shiftUsed = false; syncMeta();
      return;
    }
    gameKeyUp(id);
    return;
  }
  if (id === 'ShiftL' || id === 'ShiftR') {
    if (held && !shiftUsed) sticky = !sticky;
    held = false; shiftUsed = false; syncMeta();
  }
}

var hueCounter = 0;
function mkBtn(id, base, shift, code, w) {
  var b = document.createElement('button');
  b.className = 'osk-k ' + (w || '');
  b.dataset.id = id;
  if (code) b.dataset.code = code;
  b.style.setProperty('--h', (hueCounter++ * 14) % 360);
  if (base) {
    var sp = document.createElement('span');
    sp.className = 'osk-c';
    sp.textContent = base;
    b.appendChild(sp);
  }
  if (shift) {
    var ss = document.createElement('span');
    ss.className = 'osk-s';
    ss.textContent = shift;
    b.appendChild(ss);
  }
  b.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    b.classList.add('pressed');
    pressDown(id, DEFS[id], false);
  });
  var up = function () {
    b.classList.remove('pressed');
    pressUp(id);
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
  return b;
}

function arrows() {
  var w = document.createElement('div'); w.className = 'osk-arr';
  var r1 = document.createElement('div'); r1.className = 'osk-arow';
  var s1 = document.createElement('div'); s1.className = 'osk-sp';
  var s2 = document.createElement('div'); s2.className = 'osk-sp';
  r1.appendChild(s1); r1.appendChild(mkBtn('Up', '↑', '', 'ArrowUp')); r1.appendChild(s2);
  var r2 = document.createElement('div'); r2.className = 'osk-arow';
  r2.appendChild(mkBtn('Left', '←', '', 'ArrowLeft'));
  r2.appendChild(mkBtn('Down', '↓', '', 'ArrowDown'));
  r2.appendChild(mkBtn('Right', '→', '', 'ArrowRight'));
  w.appendChild(r1); w.appendChild(r2);
  return w;
}

function render() {
  KB.innerHTML = ''; codeMap = {}; DEFS = {}; hueCounter = 0;
  LAY[lang].rows.forEach(function (row) {
    var r = document.createElement('div'); r.className = 'osk-row';
    row.forEach(function (k) {
      if (k[0] === 'ARR') { r.appendChild(arrows()); return; }
      DEFS[k[0]] = { b: k[1], s: k[2] };
      r.appendChild(mkBtn(k[0], k[1], k[2], k[0], k[3]));
    });
    KB.appendChild(r);
  });
  KB.querySelectorAll('[data-code]').forEach(function (b) { codeMap[b.dataset.code] = b; });
  syncMeta();
}

/* คีย์บอร์ดจริง sync กับหน้าจอ */
document.addEventListener('keydown', function (e) {
  if (!e.isTrusted) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var b = codeMap[e.code];
  if (!b) return;
  e.preventDefault();
  b.classList.add('pressed');
  if (e.code === 'CapsLock') { if (!e.repeat) pressDown('Caps', null, true); return; }
  pressDown(b.dataset.id, DEFS[b.dataset.id], true);
});
document.addEventListener('keyup', function (e) {
  if (!e.isTrusted) return;
  var b = codeMap[e.code];
  if (b) b.classList.remove('pressed');
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') pressUp('ShiftL');
});
window.addEventListener('blur', function () {
  held = false; stopAllRepeats();
  if (KB) KB.querySelectorAll('.pressed').forEach(function (x) { x.classList.remove('pressed'); });
});

/* ---------- init ---------- */
function injectStyle() {
  if (document.getElementById('osk-style')) return;
  var st = document.createElement('style');
  st.id = 'osk-style';
  st.textContent = CSS;
  document.head.appendChild(st);
}
function barBtn(label, fn) {
  var b = document.createElement('button');
  b.className = 'osk-btn'; b.textContent = label;
  b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
  b.addEventListener('click', function () { fn(); });
  return b;
}
function init(opts) {
  opts = opts || {};
  injectStyle();
  var container = typeof opts.container === 'string' ? document.querySelector(opts.container) : opts.container;
  if (!container) { console.error('OnScreenKeyboard: ไม่เจอ container'); return; }
  if (container.dataset.osk) return;
  container.dataset.osk = '1';
  container.classList.add('osk-wrap');
  ROOT = container;

  SCR = typeof opts.output === 'string' ? document.querySelector(opts.output)
      : (opts.output || null);
  if (!SCR) {
    SCR = document.createElement('textarea');
    SCR.className = 'osk-out';
    SCR.placeholder = '🎮 โหมดเกม: กดปุ่มได้เลย ไม่ต้องเล็ง • พิมพ์ข้อความ: แตะช่อง หรือ 🎯 เล็ง element';
    container.appendChild(SCR);
  }
  var bar = document.createElement('div'); bar.className = 'osk-bar';
  BAR.lang = barBtn('ไทย', toggleLang);
  BAR.game = barBtn('🎮 เกม: ปิด', function () { toggleGame(); });
  BAR.test = barBtn('🔥 ทดสอบ Z', function () {
    var on = gameMode;
    if (!on) toggleGame(true);
    gameKeyDown('KeyZ', { b: 'z', s: 'Z' });
    setTimeout(function () { gameKeyUp('KeyZ'); }, 250);
  });
  BAR.pick = barBtn('🎯 เล็ง element', function () { togglePick(); });
  /* ปุ่มเปิดแบบเต็มจอสำหรับ Scratch — เกมกลายเป็นหน้าหลัก ยิงถึง 100% */
  var mm = location.href.match(/scratch\.mit\.edu\/(?:projects|embed)\/(\d+)/);
  if (mm && location.href.indexOf('/embed') === -1) {
    BAR.full = barBtn('🔗 เต็มจอ (แนะนำ)', function () {
      location.href = 'https://scratch.mit.edu/projects/' + mm[1] + '/embed';
    });
  }
  BAR.led  = barBtn('ไฟ LED: เปิด', function () {
    ledOn = !ledOn;
    KB.classList.toggle('osk-led', ledOn);
    BAR.led.textContent = ledOn ? 'ไฟ LED: เปิด' : 'ไฟ LED: ปิด';
  });
  BAR.snd  = barBtn('เสียง: เปิด', function () {
    sndOn = !sndOn;
    BAR.snd.textContent = sndOn ? 'เสียง: เปิด' : 'เสียง: ปิด';
  });
  BAR.clr  = barBtn('ล้าง', function () { var t = TGT(); if (t.value !== undefined) t.value = ''; });
  BAR.min  = barBtn('— ย่อ', function () {
    var hide = SCR.style.display !== 'none';
    SCR.style.display = hide ? 'none' : '';
    KB.style.display = hide ? 'none' : '';
    BAR.min.textContent = hide ? '▢ ขยาย' : '— ย่อ';
  });
  BAR.close = barBtn('✕', function () {
    stopAllRepeats(); togglePick(false);
    container.remove();
    delete container.dataset.osk;
  });
  BAR.tgt  = document.createElement('span'); BAR.tgt.className = 'osk-tgt';
  BAR.tgt.textContent = 'พร้อมใช้งาน';
  bar.appendChild(BAR.lang); bar.appendChild(BAR.game); bar.appendChild(BAR.test);
  bar.appendChild(BAR.pick);
  if (BAR.full) bar.appendChild(BAR.full);
  bar.appendChild(BAR.led);  bar.appendChild(BAR.snd);  bar.appendChild(BAR.clr);
  bar.appendChild(BAR.min);  bar.appendChild(BAR.close); bar.appendChild(BAR.tgt);
  container.appendChild(bar);

  KB = document.createElement('div'); KB.className = 'osk-kb';
  container.appendChild(KB);

  /* ลากย้ายแผงคีย์บอร์ด */
  var drag = null;
  bar.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest && ev.target.closest('.osk-btn')) return;
    if (ev.target.closest && ev.target.closest('.osk-tgt')) return;
    ev.preventDefault();
    var cs = getComputedStyle(container);
    if (cs.position !== 'fixed') container.style.position = 'fixed';
    var r = container.getBoundingClientRect();
    container.style.left = r.left + 'px';
    container.style.top = r.top + 'px';
    container.style.bottom = 'auto';
    container.style.transform = 'none';
    drag = { dx: ev.clientX - r.left, dy: ev.clientY - r.top };
    try { bar.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  bar.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var x = ev.clientX - drag.dx, y = ev.clientY - drag.dy;
    x = Math.max(0, Math.min(window.innerWidth - 80, x));
    y = Math.max(0, Math.min(window.innerHeight - 60, y));
    container.style.left = x + 'px';
    container.style.top = y + 'px';
  });
  bar.addEventListener('pointerup', function () {
    drag = null;
    try { localStorage.setItem('osk-pos', JSON.stringify({ l: container.style.left, t: container.style.top })); } catch (e) {}
  });
  try {
    var saved = JSON.parse(localStorage.getItem('osk-pos') || 'null');
    if (saved && saved.l) {
      container.style.position = 'fixed';
      container.style.left = saved.l; container.style.top = saved.t;
      container.style.bottom = 'auto'; container.style.transform = 'none';
    }
  } catch (e) {}

  if (opts.lang === 'en') lang = 'en';
  if (opts.sound === false) sndOn = false;
  if (opts.led === false) ledOn = false;
  KB.classList.toggle('osk-led', ledOn);
  BAR.led.textContent = ledOn ? 'ไฟ LED: เปิด' : 'ไฟ LED: ปิด';
  if (!sndOn) BAR.snd.textContent = 'เสียง: ปิด';

  render();
  hookIframesDeep(document);
  setInterval(function () { if (KB) hookIframesDeep(document); }, 2000);  // hook iframe ที่โหลดช้า
  toggleGame(opts.game !== false);
}

function autoInit() {
  var c = document.getElementById('osk') || document.getElementById('kb');
  if (c && !c.dataset.osk) init({ container: c });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
else autoInit();

window.OnScreenKeyboard = { init: init, render: render, pick: togglePick, game: toggleGame };
})();
