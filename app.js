(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  var pick = function (a) { return a[rnd(a.length)]; };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var TAU = Math.PI * 2;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- storage (always guarded) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('eeny:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('eeny:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  /* ---------- confetti ---------- */
  var fx = $('#fx'), fctx = fx.getContext('2d'), parts = [], raf = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
  function sizeFx() { fx.width = innerWidth * DPR; fx.height = innerHeight * DPR; }
  sizeFx(); addEventListener('resize', sizeFx);
  function confetti(x, y, n) {
    if (reduced) n = Math.min(n || 60, 20);
    var cols = [css('--red'), css('--yellow'), css('--aqua'), css('--sky'), css('--pink'), css('--orange')];
    for (var i = 0; i < (n || 70); i++) {
      var a = Math.random() * TAU, s = 4 + Math.random() * 9;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: 4 + Math.random() * 5, c: pick(cols), rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1 });
    }
    if (!raf) raf = requestAnimationFrame(stepFx);
  }
  function stepFx() {
    fctx.clearRect(0, 0, fx.width, fx.height);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
      fctx.save(); fctx.translate(p.x * DPR, p.y * DPR); fctx.rotate(p.rot); fctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      fctx.fillStyle = p.c; fctx.fillRect(-p.r * DPR, -p.r * .5 * DPR, p.r * 2 * DPR, p.r * DPR); fctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(stepFx) : 0;
    if (!raf) fctx.clearRect(0, 0, fx.width, fx.height);
  }
  function burstAt(el, n) { var r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, n); }

  function showResult(el, big, sub) {
    el.classList.remove('show'); void el.offsetWidth;
    var b = $('.big', el); b.textContent = big; b.classList.toggle('long', big.length > 16);
    $('.sub', el).textContent = sub || '';
    el.classList.add('show');
  }

  /* ---------- tabs ---------- */
  var TABS = [
    { id: 'coin', label: 'Coin', c: '--yellow' }, { id: 'wheel', label: 'Wheel', c: '--red' },
    { id: 'number', label: 'Number', c: '--aqua' }, { id: 'oracle', label: 'Oracle', c: '--sky' }
  ];
  var tabsEl = $('#tabs'), onShow = {};
  TABS.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'tab'; b.type = 'button'; b.id = 'tab-' + t.id; b.textContent = t.label;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'p-' + t.id);
    b.style.setProperty('--tabc', 'var(' + t.c + ')');
    b.addEventListener('click', function () { go(t.id); });
    tabsEl.appendChild(b);
  });
  function go(id) {
    if (!TABS.some(function (t) { return t.id === id; })) id = 'coin';
    TABS.forEach(function (t) {
      var on = t.id === id;
      $('#p-' + t.id).hidden = !on;
      var b = $('#tab-' + t.id); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
    store.set('tab', id);
    try { history.replaceState(null, '', '#open-' + id); } catch (e) {}
    if (onShow[id]) onShow[id]();
  }
  tabsEl.addEventListener('keydown', function (e) {
    var i = TABS.findIndex(function (t) { return $('#tab-' + t.id).getAttribute('aria-selected') === 'true'; });
    if (e.key === 'ArrowRight') go(TABS[(i + 1) % TABS.length].id);
    if (e.key === 'ArrowLeft') go(TABS[(i + TABS.length - 1) % TABS.length].id);
  });

  /* ---------- COIN ---------- */
  var coin = $('#coin'), arc = $('#arc'), puddle = $('#puddle'), flipBtn = $('#flip'), stage = $('#stage');
  var coinAngle = 0, flipping = false, edge = $('#edge');
  /* touch devices get a slower, gentler spin; the coin is flipped in flat 2D (scaleX) so it renders the same everywhere */
  function touch() { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } }
  function setAngle(deg) {
    var cos = Math.cos(deg * Math.PI / 180), s = Math.abs(cos), onEdge = s < 0.07;
    coin.classList.toggle('back', cos < 0);
    coin.style.visibility = onEdge ? 'hidden' : 'visible';
    coin.style.transform = 'scaleX(' + Math.max(s, 0.02) + ')';
    edge.hidden = !onEdge;
  }
  setAngle(0);
  var QH = ['Heads. The tiger has chosen.', 'Heads! The tiger looks smug.', 'Heads. Your gut already knew.', 'HEADS. Go before you overthink it.', 'Heads. Rawr. Decision made.'];
  var QT = ['Tails. The tiger walked away.', 'Tails! Tiger butt has spoken.', 'Tails. Bold. Mysterious. Fluffy.', 'TAILS. Do it now, feel feelings later.', 'Tails. A tiger tail of destiny.'];
  var PANG = ' Felt a pang? That is your real answer.';
  $('#lblH').value = store.get('lblH', ''); $('#lblT').value = store.get('lblT', '');
  $('#lblH').addEventListener('input', function (e) { store.set('lblH', e.target.value); });
  $('#lblT').addEventListener('input', function (e) { store.set('lblT', e.target.value); });
  $('#lblClear').addEventListener('click', function () {
    $('#lblH').value = ''; $('#lblT').value = ''; store.set('lblH', ''); store.set('lblT', '');
  });

  function flipCoin() {
    if (flipping) return; flipping = true; flipBtn.disabled = true;
    var r = Math.random(), outcome = r < 0.01 ? 'e' : (r < 0.505 ? 'h' : 't');
    var base = outcome === 'h' ? 0 : outcome === 't' ? 180 : 90;
    var slow = touch(), turns = slow ? 3 + rnd(2) : 4 + rnd(3), dur = slow ? 2700 : 1900;
    var from = coinAngle, to = from + turns * 360 + ((base - from) % 360 + 360) % 360;
    var lift = Math.round(stage.clientHeight * 0.14), t0 = performance.now();
    buzz(20);
    $('#coinRes').classList.remove('show');
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 2.6);
      setAngle(from + (to - from) * e);
      var q = Math.min(1, (now - t0) / (dur * .8)), h = Math.sin(Math.PI * q);
      arc.style.transform = 'translateY(' + (-lift * h) + 'px) scale(' + (1 + 0.12 * h) + ')';
      puddle.style.transform = 'scale(' + (1 - 0.4 * h) + ')'; puddle.style.opacity = String(0.22 - 0.12 * h);
      if (p < 1) requestAnimationFrame(frame); else land();
    })(t0);
    function land() {
      arc.style.transform = ''; puddle.style.transform = ''; puddle.style.opacity = '';
      coinAngle = to % 360; setAngle(coinAngle);
      flipping = false; flipBtn.disabled = false;
      var lh = $('#lblH').value.trim(), lt = $('#lblT').value.trim(), big, sub;
      if (outcome === 'e') {
        big = 'It landed on its EDGE.'; sub = 'The universe refuses to help. Flip again.'; buzz([60, 40, 60]);
      } else {
        if (outcome === 'h') { big = lh || 'Heads'; sub = pick(QH); }
        else { big = lt || 'Tails'; sub = pick(QT); }
        if (Math.random() < 0.25) sub = sub.split('.')[0] + '.' + PANG;
        buzz([30, 30, 60]); burstAt($('#coinRes'), 80);
      }
      showResult($('#coinRes'), big, sub);
    }
  }
  flipBtn.addEventListener('click', flipCoin);
  coin.addEventListener('click', flipCoin);
  coin.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCoin(); } });

  /* ---------- WHEEL ---------- */
  var DEFAULT_OPTS = ['Pizza', 'Tacos', 'Sushi', 'Cereal for dinner', 'Leftovers', 'Order the weird thing'];
  var opts = store.get('opts', null); if (!Array.isArray(opts)) opts = DEFAULT_OPTS.slice();
  var usingDefaults = store.get('opts', null) === null;
  var wc = $('#wheel'), wx = wc.getContext('2d'), rot = -Math.PI / 2 + 0.3, spinning = false, pal = null;
  var U = 340; /* the wheel is drawn in a 340-unit square and scaled to fit */

  function wheelPalette() {
    pal = { cols: ['--w1', '--w2', '--w3', '--w4', '--w5', '--w6'].map(css), line: css('--line'), shade: css('--shade'), card: css('--card'), red: css('--red'), ink: '#1F2A44' };
  }
  function sizeWheel() {
    var r = wc.getBoundingClientRect(), s = Math.round(r.width * DPR);
    if (s < 40) return false;
    if (wc.width !== s) { wc.width = s; wc.height = s; }
    return true;
  }
  function font(fs) { return '600 ' + fs + 'px Fredoka, system-ui, sans-serif'; }
  function fitLabel(t, maxW, maxH) {
    var w = function (s, fs) { wx.font = font(fs); return wx.measureText(s).width; };
    var cap1 = Math.floor(Math.min(22, maxH / 1.15)), fs1 = 0, fs;
    for (fs = cap1; fs >= 9; fs--) { if (w(t, fs) <= maxW) { fs1 = fs; break; } }
    var words = t.split(/\s+/), best = null;
    if (words.length > 1) {
      var cap2 = Math.floor(Math.min(22, maxH / 2.2));
      for (var k = 1; k < words.length; k++) {
        var l = [words.slice(0, k).join(' '), words.slice(k).join(' ')];
        for (fs = cap2; fs >= 9; fs--) {
          if (Math.max(w(l[0], fs), w(l[1], fs)) <= maxW) { if (!best || fs > best.fs) best = { lines: l, fs: fs }; break; }
        }
      }
    }
    if (best && best.fs > fs1) return best;
    if (fs1) return { lines: [t], fs: fs1 };
    var s = t; while (s.length > 2 && w(s + '…', 9) > maxW) s = s.slice(0, -1);
    return { lines: [s.trim() + '…'], fs: 9 };
  }
    /* Slices always use the six light wheel colors. If the last slice would repeat the first one's color, use a different light color. */
  function sliceColor(i, n) { var c = i % 6; return (n > 1 && i === n - 1 && c === 0) ? 2 : c; }
  function drawWheel() {
    if (!sizeWheel()) return; if (!pal) wheelPalette();
    var k = wc.width / U; wx.setTransform(k, 0, 0, k, 0, 0); wx.clearRect(0, 0, U, U);
    var c = U / 2, R = c - 7, n = opts.length, seg = TAU / Math.max(n, 1), i;
    wx.beginPath(); wx.arc(c, c + 3, R + 1, 0, TAU); wx.fillStyle = pal.shade; wx.fill();
    if (!n) {
      wx.beginPath(); wx.arc(c, c, R, 0, TAU); wx.fillStyle = pal.card; wx.fill(); wx.lineWidth = 5; wx.strokeStyle = pal.line; wx.stroke();
      wx.fillStyle = pal.ink; wx.globalAlpha = .6; wx.font = font(18); wx.textAlign = 'center'; wx.fillText('Add some options', c, c + 6); wx.globalAlpha = 1; return;
    }
    var maxW = R - 12 - 30, maxH = Math.max(16, 2 * (R * 0.6) * Math.sin(Math.min(seg, Math.PI) / 2) * 0.88);
    for (i = 0; i < n; i++) {
      var a0 = rot + i * seg, a1 = a0 + seg;
      wx.beginPath(); wx.moveTo(c, c); wx.arc(c, c, R, a0, a1); wx.closePath();
      wx.fillStyle = pal.cols[sliceColor(i, n)];
      wx.fill(); wx.lineWidth = 2; wx.strokeStyle = pal.line; wx.stroke();
      var f = fitLabel(opts[i], maxW, maxH);
      wx.save(); wx.translate(c, c); wx.rotate(a0 + seg / 2); wx.textAlign = 'right'; wx.textBaseline = 'middle';
      wx.fillStyle = pal.ink; wx.font = font(f.fs);
      var lh = f.fs * 1.08, y0 = -(f.lines.length - 1) * lh / 2;
      f.lines.forEach(function (ln, j) { wx.fillText(ln, R - 12, y0 + j * lh + 0.5); });
      wx.restore();
    }
    wx.beginPath(); wx.arc(c, c, R, 0, TAU); wx.lineWidth = 5; wx.strokeStyle = pal.line; wx.stroke();
    for (i = 0; i < n; i++) {
      var a = rot + i * seg;
      wx.beginPath(); wx.arc(c + Math.cos(a) * R, c + Math.sin(a) * R, 3.6, 0, TAU); wx.fillStyle = '#fff'; wx.fill(); wx.lineWidth = 1.5; wx.strokeStyle = pal.line; wx.stroke();
    }
    wx.beginPath(); wx.arc(c, c, 17, 0, TAU); wx.fillStyle = pal.card; wx.fill(); wx.lineWidth = 4; wx.strokeStyle = pal.line; wx.stroke();
    wx.beginPath(); wx.arc(c, c, 5, 0, TAU); wx.fillStyle = pal.red; wx.fill();
  }
  function idxAtPointer(r) {
    var n = opts.length, seg = TAU / n, a = ((-Math.PI / 2 - r) % TAU + TAU) % TAU;
    return Math.min(n - 1, Math.floor(a / seg));
  }
  function paintChips() {
    var box = $('#chips'); box.innerHTML = '';
    opts.forEach(function (o, i) {
      var ch = document.createElement('span'); ch.className = 'chip';
      var s = document.createElement('span'); s.textContent = o;
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + o);
      x.addEventListener('click', function () { if (spinning) return; opts.splice(i, 1); usingDefaults = false; saveOpts(); });
      ch.appendChild(s); ch.appendChild(x); box.appendChild(ch);
    });
    $('#spin').disabled = opts.length < 2 || spinning;
    $('#optNote').textContent = opts.length < 2 ? 'Add at least 2 options' : (usingDefaults ? 'Examples. Edit away.' : opts.length + ' options');
    drawWheel();
  }
  function saveOpts() { store.set('opts', opts); paintChips(); }
  function addOpt() {
    var v = $('#optIn').value.trim(); if (!v || spinning) return;
    if (usingDefaults) { opts = []; usingDefaults = false; }
    v.split(/[,\n]/).forEach(function (p) { p = p.trim(); if (p && opts.length < 24) opts.push(p); });
    $('#optIn').value = ''; saveOpts();
  }
  $('#optAdd').addEventListener('click', addOpt);
  $('#optIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addOpt(); } });
  $('#optClear').addEventListener('click', function () { if (spinning) return; opts = []; usingDefaults = false; saveOpts(); });

  var WQ = ['The wheel has no regrets. Neither should you.', 'Spun fair and square. Mostly square.', 'Destiny, but round.', 'Do not argue with a wheel.', 'It is decided. Go go go.'];
  function spinWheel() {
    if (spinning || opts.length < 2) return;
    spinning = true; $('#spin').disabled = true; $('#wheelRes').classList.remove('show');
    var n = opts.length, seg = TAU / n, win = rnd(n), f = 0.12 + Math.random() * 0.76;
    var base = -Math.PI / 2 - (win + f) * seg;
    var slow = touch(), delta = (((base - rot) % TAU) + TAU) % TAU + TAU * (slow ? 3 + rnd(2) : 5 + rnd(3));
    var r0 = rot, dur = slow ? 6800 : 4800, t0 = performance.now(), last = idxAtPointer(rot);
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      rot = r0 + delta * e; var cur = idxAtPointer(rot);
      if (cur !== last) { last = cur; buzz(8); }
      drawWheel();
      if (p < 1) requestAnimationFrame(frame); else done();
    })(t0);
    function done() {
      spinning = false; var w = opts[win];
      buzz([40, 30, 80]); burstAt($('#wheelRes'), 90);
      showResult($('#wheelRes'), w, pick(WQ));
      paintChips();
    }
  }
  $('#spin').addEventListener('click', spinWheel);
  $('.wheelin').addEventListener('click', spinWheel);
  onShow.wheel = function () { requestAnimationFrame(drawWheel); };
  try { new ResizeObserver(function () { drawWheel(); }).observe($('.wheelin')); } catch (e) {}

  /* ---------- NUMBER ---------- */
  var dial = $('#dial'), maxN = $('#maxN'), rolling = false;
  maxN.value = store.get('maxN', 10);
  [3, 6, 10, 20, 100].forEach(function (n) {
    var b = document.createElement('button'); b.className = 'small'; b.type = 'button';
    b.textContent = n === 6 ? 'd6' : n === 20 ? 'd20' : '1 to ' + n;
    b.addEventListener('click', function () { maxN.value = n; store.set('maxN', n); });
    $('#quick').appendChild(b);
  });
  maxN.addEventListener('input', function () { store.set('maxN', maxN.value); });
  var NQ = ['Not a vibe check, a math check.', 'Statistically speaking, that is a number.', 'Chosen by chaos. Certified by nobody.', 'Go with it. Future you says thanks.', 'The dice are cast. Metaphorically.'];
  async function rollNum() {
    if (rolling) return;
    var n = Math.max(2, Math.min(9999, parseInt(maxN.value, 10) || 10)); maxN.value = n; store.set('maxN', n);
    rolling = true; $('#roll').disabled = true; $('#numRes').classList.remove('show'); dial.classList.add('rolling');
    var slow = touch(), result = 1 + rnd(n), steps = slow ? 14 : 22;
    for (var i = 0; i < steps; i++) {
      dial.textContent = 1 + rnd(n); buzz(5);
      await sleep(slow ? 100 + Math.pow(i / steps, 3) * 480 : 40 + Math.pow(i / steps, 3) * 260);
    }
    dial.textContent = result; dial.classList.remove('rolling');
    rolling = false; $('#roll').disabled = false;
    buzz([30, 30, 60]); burstAt($('#numRes'), 70);
    showResult($('#numRes'), 'Option ' + result, pick(NQ));
  }
  $('#roll').addEventListener('click', rollNum);
  dial.addEventListener('click', rollNum);

  /* ---------- ORACLE ---------- */
  /* Two modes so the answer always fits the question: yes/no questions, or a choice between options. */
  var ORACLE = {
    yn: {
      hint: 'Ask a yes or no question out loud, then ask the orb.',
      groups: [
        { w: 40, verdicts: ['Yes.', 'Yes, absolutely.', 'Do it.', '100% yes.', 'Signs point to yes.', 'Go for it.', 'Yes. Immediately.', 'The orb says yes.'],
          twists: ['Wear socks while you commit.', 'The vibes are immaculate.', 'Do it before this sentence ends.', 'Future you will thank you.', 'It will make a decent story.', 'A pigeon already approved this.'] },
        { w: 40, verdicts: ['No.', 'Absolutely not.', 'Don\'t.', 'Hard pass.', 'Signs point to no.', 'Nope.', 'Not today.', 'The orb says no.'],
          twists: ['Trust your gut on this one.', 'Future you is relieved.', 'Save it for a better day.', 'The vibes are suspicious.', 'Hydrate instead.', 'A pigeon already vetoed this.'] },
        { w: 20, verdicts: ['Maybe.', 'Ask again later.', 'Ehh, 50/50.', 'Possibly. Sleep on it.', 'Too close to call.', 'The orb is thinking.'],
          twists: ['Hydrate and ask again.', 'Mercury is in a mood.', 'The orb needs a snack.', 'Check back after lunch.', 'Your gut already knows. Ask it.', 'Flip a coin if you must.'] }
      ]
    },
    opt: {
      hint: 'Think of your options, then ask the orb.',
      /* first and last have equal weight so two options are picked with equal odds; neither/both are rarer non-answers */
      groups: [
        { w: 30, verdicts: ['The first one.'], twists: ['Your gut said it first.', 'Go with your first instinct.'] },
        { w: 30, verdicts: ['The last one.'], twists: ['Save the best for last.', 'Last but not least.'] },
        { w: 16, verdicts: ['The one you keep avoiding.'], twists: ['You already know which one.', 'It has been on your mind.'] },
        { w: 12, verdicts: ['Neither. Invent a third option.'], twists: ['Skip both and surprise everyone.', 'The best option may not exist yet.'] },
        { w: 12, verdicts: ['Both. Chaos is a lifestyle.'], twists: ['Why not both? Seriously.', 'Doubling up is allowed.'] }
      ]
    }
  };
  var oraMode = store.get('oraMode', 'yn'); if (!ORACLE[oraMode]) oraMode = 'yn';
  function paintMode() {
    $('#modeYN').setAttribute('aria-pressed', String(oraMode === 'yn'));
    $('#modeOpt').setAttribute('aria-pressed', String(oraMode === 'opt'));
    $('#oraHint').textContent = ORACLE[oraMode].hint;
  }
  function setMode(m) { if (oraMode === m) return; oraMode = m; store.set('oraMode', m); paintMode(); $('#orbWin').textContent = '?'; }
  $('#modeYN').addEventListener('click', function () { setMode('yn'); });
  $('#modeOpt').addEventListener('click', function () { setMode('opt'); });
  paintMode();
  function oracleAnswer() {
    var gs = ORACLE[oraMode].groups, total = gs.reduce(function (s, g) { return s + g.w; }, 0), r = Math.random() * total, g = gs[gs.length - 1];
    for (var i = 0; i < gs.length; i++) { if (r < gs[i].w) { g = gs[i]; break; } r -= gs[i].w; }
    return { big: pick(g.verdicts), sub: pick(g.twists) };
  }
  var asking = false;
  async function consult() {
    if (asking) return; asking = true; $('#ask').disabled = true;
    var orb = $('#orb'), win = $('#orbWin'); $('#oraRes').classList.remove('show');
    orb.classList.remove('shake'); void orb.offsetWidth; orb.classList.add('shake'); win.textContent = '…'; buzz([40, 30, 40, 30, 40]);
    await sleep(950);
    var ans = oracleAnswer();
    win.textContent = '✦'; burstAt($('#oraRes'), 40);
    showResult($('#oraRes'), ans.big, ans.sub);
    asking = false; $('#ask').disabled = false;
  }
  $('#ask').addEventListener('click', consult);
  $('#orb').addEventListener('click', consult);

  /* ---------- theme redraw + boot ---------- */
  function themeChanged() { pal = null; drawWheel(); }
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged); } catch (e) {}
  try { new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWheel);

  paintChips();
  go((location.hash || '').replace(/^#(open-)?/, '') || 'coin');
})();
