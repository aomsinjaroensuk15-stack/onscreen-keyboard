/* ============================================================
 * On-Screen Keyboard  v1.1  —  ไทย / English (Kedmanee, TIS 820)
 * Vanilla JS, zero dependency (inject CSS เอง)
 * v1.1: แป้นหนาขึ้น + พิมพ์ลง element ที่แตะล่าสุด (input/textarea/contenteditable)
 *
 * วิธีใช้:
 *   <div id="kb"></div>
 *   <script src="onscreen-keyboard.js"></script>
 *   <script>OnScreenKeyboard.init({container:'#kb'});</script>
 * ============================================================ */
(function () {
'use strict';

/* ==================== PHASE 1/3 : layout data ==================== */
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

/* ==================== PHASE 2/3 : CSS + state + helpers ==================== */
var CSS = `
.osk-wrap{font-family:'Segoe UI',Tahoma,sans-serif;width:100%;max-width:980px}
.osk-bar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center}
.osk-btn{border:1px solid #c9c9cf;background:#fff;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer;color:#222}
.osk-btn:hover{background:#f0f0f3}
.osk-tgt{margin-left:auto;font-size:12px;color:#888;font-style:italic}
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
var SCR = null, KB = null, BAR = {}, activeEl = null;
var lang = 'th', caps = false, held = false, sticky = false, shiftUsed = false;
var sndOn = true, ledOn = true, ac = null, codeMap = {}, DEFS = {};

/* ---------- focus tracking: จำ element ที่ผู้ใช้แตะ/คลิกล่าสุด ---------- */
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
function TGT() { return isTypeable(activeEl) ? activeEl : SCR; }
function targetName(el) {
  if (!el) return '—';
  if (el === SCR) return 'กระดานโน้ตของคีย์บอร์ด';
  return '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '>';
}
document.addEventListener('focusin', function (e) {
  if (!SCR) return;
  if (KB && KB.contains(e.target)) return;          // focus ในตัวคีย์บอร์ดเอง — ไม่สน
  if (e.target.closest && e.target.closest('.osk-wrap')) return;
  if (isTypeable(e.target)) {
    activeEl = e.target;
    if (BAR.tgt) BAR.tgt.textContent = 'พิมพ์ลง: ' + targetName(activeEl);
  }
});

/* ---------- helpers: ตัวอักษรที่จะพิมพ์ ---------- */
function shiftActive() { return held || sticky; }
function effChar(def) {
  var sh = shiftActive();
  if (/^[a-z]$/.test(def.b) && caps) { return sh ? def.b : def.s; }
  return sh ? (def.s || def.b) : def.b;
}

/* ---------- helpers: แทรก/ลบ/เลื่อนเคอร์เซอร์ (ทั้ง textarea/input และ contenteditable) ---------- */
function setVal(el, v) {   // native setter — ให้ React/Vue/Angular ตรวจจับการเปลี่ยนค่าได้
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
function delFwd() {
  var el = TGT();
  if (el.isContentEditable) { el.focus(); document.execCommand('forwardDelete'); return; }
  var v = el.value, s = el.selectionStart, e = el.selectionEnd;
  if (s !== e) { setVal(el, v.slice(0, s) + v.slice(e)); el.setSelectionRange(s, s); fireInput(el); return; }
  if (e >= v.length) return;
  var seg = [...v.slice(e)], p = e + seg[0].length;
  setVal(el, v.slice(0, e) + v.slice(p));
  el.setSelectionRange(e, e);
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
    el.setSelectionRange([...v.slice(0, s)].slice(0, -1).join('').length, [...v.slice(0, s)].slice(0, -1).join('').length);
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

/* ---------- helper: เสียงคลิกแบบ mechanical keyboard ---------- */
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

/* ==================== PHASE 3/3 : render + events + init ==================== */
function syncMeta() {
  KB.querySelectorAll('[data-id="ShiftL"],[data-id="ShiftR"]').forEach(function (b) { b.classList.toggle('on', shiftActive()); });
  KB.querySelectorAll('[data-id="Caps"]').forEach(function (b) { b.classList.toggle('on', caps); });
  BAR.lang.textContent = lang === 'th' ? 'ไทย' : 'EN';
}
function toggleLang() { lang = lang === 'th' ? 'en' : 'th'; render(); }

function act(id, def, phys) {
  if (id === 'ShiftL' || id === 'ShiftR') {
    if (phys) { held = true; }
    else if (held) { shiftUsed = true; } else { held = true; shiftUsed = false; }
    syncMeta(); return;
  }
  if (id === 'Caps') { caps = !caps; syncMeta(); return; }
  if (id === 'Lang') { toggleLang(); return; }
  if (id === 'Backspace') { delBack(); snd(); return; }
  if (id === 'Delete')    { delFwd();  snd(); return; }
  if (id === 'Enter')     { ins('\n'); snd(); return; }
  if (id === 'Tab')       { ins(shiftActive() && lang === 'th' ? '๐' : '\t'); snd(); return; }
  if (id === 'Space')     { ins(' ');  snd(); return; }
  if (id === 'Up')    { moveLine(-1); return; }
  if (id === 'Down')  { moveLine(1);  return; }
  if (id === 'Left')  { move(-1); return; }
  if (id === 'Right') { move(1);  return; }
  if (id === 'Ctrl' || id === 'Win' || id === 'Alt' || id === 'AltGr') return;
  if (!def || !def.b) return;
  ins(effChar(def));
  snd(); shiftUsed = true;
  if (sticky) sticky = false;
  syncMeta();
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
    ev.preventDefault();
    b.classList.add('pressed');
    setTimeout(function () { b.classList.remove('pressed'); }, 130);
    act(id, DEFS[id], false);
  });
  if (id === 'ShiftL' || id === 'ShiftR') {
    var rel = function () {
      if (held && !shiftUsed) sticky = !sticky;
      held = false; shiftUsed = false; syncMeta();
    };
    b.addEventListener('pointerup', rel);
    b.addEventListener('pointercancel', rel);
  }
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
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var b = codeMap[e.code];
  if (!b) return;
  e.preventDefault();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    b.classList.add('pressed');
    if (!e.repeat) act('ShiftL', null, true);
    syncMeta(); return;
  }
  if (e.code === 'CapsLock') {
    b.classList.add('pressed');
    if (!e.repeat) act('Caps');
    return;
  }
  b.classList.add('pressed');
  act(b.dataset.id, DEFS[b.dataset.id], true);
});
document.addEventListener('keyup', function (e) {
  var b = codeMap[e.code];
  if (b) b.classList.remove('pressed');
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    held = false;
    if (!shiftUsed) sticky = !sticky;
    shiftUsed = false; syncMeta();
  }
});
window.addEventListener('blur', function () {
  held = false;
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
  b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); });  // กัน focus หลุดจากช่องที่จะพิมพ์
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

  SCR = typeof opts.output === 'string' ? document.querySelector(opts.output)
      : (opts.output || null);
  if (!SCR) {
    SCR = document.createElement('textarea');
    SCR.className = 'osk-out';
    SCR.placeholder = 'แตะช่องไหนของเว็บเพื่อพิมพ์ลงนั้น (ถ้าไม่แตะ จะพิมพ์ลงกล่องนี้)';
    container.appendChild(SCR);
  }
  var bar = document.createElement('div'); bar.className = 'osk-bar';
  BAR.lang = barBtn('ไทย', toggleLang);
  BAR.led  = barBtn('ไฟ LED: เปิด', function () {
    ledOn = !ledOn;
    KB.classList.toggle('osk-led', ledOn);
    BAR.led.textContent = ledOn ? 'ไฟ LED: เปิด' : 'ไฟ LED: ปิด';
  });
  BAR.snd  = barBtn('เสียง: เปิด', function () {
    sndOn = !sndOn;
    BAR.snd.textContent = sndOn ? 'เสียง: เปิด' : 'เสียง: ปิด';
  });
  BAR.clr  = barBtn('ล้างข้อความ', function () { TGT().value = ''; });
  BAR.tgt  = document.createElement('span'); BAR.tgt.className = 'osk-tgt';
  BAR.tgt.textContent = 'พิมพ์ลง: กล่องข้อความของคีย์บอร์ด';
  bar.appendChild(BAR.lang); bar.appendChild(BAR.led);
  bar.appendChild(BAR.snd);  bar.appendChild(BAR.clr); bar.appendChild(BAR.tgt);
  container.appendChild(bar);

  KB = document.createElement('div'); KB.className = 'osk-kb';
  container.appendChild(KB);

  if (opts.lang === 'en') lang = 'en';
  if (opts.sound === false) sndOn = false;
  if (opts.led === false) ledOn = false;
  KB.classList.toggle('osk-led', ledOn);
  BAR.led.textContent = ledOn ? 'ไฟ LED: เปิด' : 'ไฟ LED: ปิด';
  if (!sndOn) BAR.snd.textContent = 'เสียง: ปิด';

  render();
}

function autoInit() {
  var c = document.getElementById('osk') || document.getElementById('kb');
  if (c && !c.dataset.osk) init({ container: c });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
else autoInit();

window.OnScreenKeyboard = { init: init, render: render };
})();
