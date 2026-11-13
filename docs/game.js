/* Bunny Catch: tiny 30-second canvas game. Vanilla JS, touch + mouse + keyboard. */
(function () {
  "use strict";
  var cv = document.getElementById("gameCanvas"), ctx = cv.getContext("2d");
  var W = 360, H = 480, DURATION = 30;
  var $ = function (id) { return document.getElementById(id); };
  var overlay = $("overlay"), ovTitle = $("ovTitle"), ovText = $("ovText"), startBtn = $("startBtn"), ovRsvp = $("ovRsvp");

  // crisp on retina screens; logical coordinates stay 360x480
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var best = 0;
  try { best = parseInt(localStorage.getItem("bunnyBest"), 10) || 0; } catch (e) {}
  $("best").textContent = best;

  // ---- sound (off by default; iOS needs a tap to start audio) ----
  var audio, soundOn = false;
  window.playPop = function (hi) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = hi ? 880 : 620;
      g.gain.setValueAtTime(.12, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .15);
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .16);
    } catch (e) {}
  };
  $("mute").addEventListener("click", function () {
    soundOn = !soundOn; this.textContent = soundOn ? "🔊" : "🔇";
    this.setAttribute("aria-pressed", soundOn); this.setAttribute("aria-label", soundOn ? "Sound on" : "Sound off");
    window.playPop(true);
  });

  // ---- state ----
  var bunny, items, score, timeLeft, running = false, last = 0, spawnT = 0, targetX = W / 2, keys = {}, floats = [], raf = 0, endAt = 0;

  function reset() {
    bunny = { x: W / 2, y: H - 62, w: 64, vx: 0, squish: 0 };
    items = []; floats = []; score = 0; timeLeft = DURATION; spawnT = 0; targetX = W / 2;
    $("score").textContent = 0; $("time").textContent = DURATION;
  }

  function spawn() {
    var r = Math.random(), type = r < .5 ? "carrot" : r < .8 ? "heart" : "cloud";
    items.push({ type: type, x: 24 + Math.random() * (W - 48), y: -24, vy: 90 + Math.random() * 90 + (DURATION - timeLeft) * 3, rot: Math.random() * 6 });
  }

  // ---- drawing ----
  function drawBunny(b) {
    var x = b.x, y = b.y, s = 1 + b.squish * .12;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / s, s);
    ctx.lineWidth = 3; ctx.strokeStyle = "#F7A3C0";
    [[-13, -4], [13, 4]].forEach(function (e) {
      ctx.save(); ctx.translate(e[0], -34); ctx.rotate(e[1] * Math.PI / 180);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, 0, 9, 24, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFC2D6"; ctx.beginPath(); ctx.ellipse(0, 3, 4, 16, 0, 0, 7); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, 0, 32, 28, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#7A3E5C"; ctx.beginPath(); ctx.arc(-12, -4, 3.6, 0, 7); ctx.arc(12, -4, 3.6, 0, 7); ctx.fill();
    ctx.fillStyle = "#FFC2D6"; ctx.beginPath(); ctx.ellipse(-22, 6, 6, 4, 0, 0, 7); ctx.ellipse(22, 6, 6, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#F7A3C0"; ctx.beginPath(); ctx.ellipse(0, 5, 4.5, 3.2, 0, 0, 7); ctx.fill();
    // open mouth when something is near
    ctx.strokeStyle = "#7A3E5C"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-3, 9, 3, 0, Math.PI); ctx.arc(3, 9, 3, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }
  function heart(x, y, s, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * .9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .7, y - s * 1.2, x, y - s * .4);
    ctx.bezierCurveTo(x + s * .7, y - s * 1.2, x + s * 1.6, y - s * .2, x, y + s * .9); ctx.fill();
  }
  function drawItem(it) {
    ctx.save(); ctx.translate(it.x, it.y);
    if (it.type === "carrot") {
      ctx.rotate(.5);
      ctx.fillStyle = "#9AD0A6"; ctx.beginPath(); ctx.ellipse(-3, -17, 4, 9, -.5, 0, 7); ctx.ellipse(4, -17, 4, 9, .5, 0, 7); ctx.fill();
      ctx.fillStyle = "#FFB27D"; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(0, 22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#F29A62"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(1, -3); ctx.moveTo(-2, 5); ctx.lineTo(3, 5); ctx.stroke();
    } else if (it.type === "heart") {
      heart(0, 0, 13, "#E6759F");
    } else {
      ctx.fillStyle = "#C9B6C2"; ctx.beginPath(); ctx.arc(-10, 2, 10, 0, 7); ctx.arc(2, -5, 12, 0, 7); ctx.arc(13, 3, 9, 0, 7); ctx.rect(-12, 2, 25, 9); ctx.fill();
      ctx.fillStyle = "#5b4552"; ctx.fillRect(-6, 0, 3, 5); ctx.fillRect(5, 0, 3, 5);
      ctx.strokeStyle = "#5b4552"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(0, 6, 7, 10); ctx.stroke();
    }
    ctx.restore();
  }
  function drawBg() {
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#FFF7FA"); g.addColorStop(1, "#FFE3EE");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    [[60, 70, 1], [270, 120, .8]].forEach(function (c) {
      ctx.beginPath(); ctx.arc(c[0], c[1], 20 * c[2], 0, 7); ctx.arc(c[0] + 22 * c[2], c[1] + 4, 16 * c[2], 0, 7); ctx.arc(c[0] - 22 * c[2], c[1] + 6, 15 * c[2], 0, 7); ctx.fill();
    });
    ctx.fillStyle = "#FFD6E4"; ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = "#FFC2D6"; for (var x = 0; x < W; x += 24) { ctx.beginPath(); ctx.arc(x + 12, H - 34, 12, Math.PI, 0); ctx.fill(); }
  }
  function render() {
    drawBg(); items.forEach(drawItem); drawBunny(bunny);
    ctx.font = "700 20px Fredoka, sans-serif"; ctx.textAlign = "center";
    floats.forEach(function (f) { ctx.globalAlpha = Math.max(0, f.t); ctx.fillStyle = f.c; ctx.fillText(f.txt, f.x, f.y); ctx.globalAlpha = 1; });
  }

  // ---- loop ----
  function step(ts) {
    if (!running) return;
    var dt = Math.min((ts - last) / 1000, .05); last = ts;
    timeLeft = Math.max(0, (endAt - ts) / 1000);
    $("time").textContent = Math.ceil(timeLeft);
    // control: keys nudge target, pointer sets target
    if (keys.ArrowLeft) targetX -= 320 * dt;
    if (keys.ArrowRight) targetX += 320 * dt;
    targetX = Math.max(36, Math.min(W - 36, targetX));
    bunny.x += (targetX - bunny.x) * Math.min(1, dt * 14);
    bunny.squish *= .85;
    spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = .45 + Math.random() * .35 - (DURATION - timeLeft) * .005; }
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i]; it.y += it.vy * dt;
      if (Math.abs(it.x - bunny.x) < 38 && Math.abs(it.y - (bunny.y - 8)) < 34) {
        var pts = it.type === "carrot" ? 1 : it.type === "heart" ? 3 : -2;
        score = Math.max(0, score + pts); $("score").textContent = score; bunny.squish = 1;
        floats.push({ x: it.x, y: it.y - 10, txt: (pts > 0 ? "+" : "") + pts, c: pts > 0 ? "#E6759F" : "#7A3E5C", t: 1 });
        window.playPop(pts > 0); items.splice(i, 1);
      } else if (it.y > H + 30) items.splice(i, 1);
    }
    floats.forEach(function (f) { f.y -= 40 * dt; f.t -= dt * 1.4; }); floats = floats.filter(function (f) { return f.t > 0; });
    render();
    if (timeLeft <= 0) return finish();
    raf = requestAnimationFrame(step);
  }

  // ---- attract mode: the bunny sways and things drift down before/after playing ----
  var idleRaf = 0, idleLast = 0, idleT = 0, onScreen = true, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function idleStep(ts) {
    if (running || document.hidden || !onScreen) { idleRaf = 0; return; }
    var dt = Math.min((ts - (idleLast || ts)) / 1000, .05); idleLast = ts; idleT += dt;
    bunny.x = W / 2 + Math.sin(idleT * 1.4) * 95; bunny.squish = Math.max(0, Math.sin(idleT * 5.6)) * .4;
    spawnT -= dt; if (spawnT <= 0) { timeLeft = DURATION; spawn(); spawnT = .7; }
    items.forEach(function (it) { it.y += it.vy * .6 * dt; });
    items = items.filter(function (it) { return it.y < H + 30; });
    render(); idleRaf = requestAnimationFrame(idleStep);
  }
  function startIdle() {
    if (idleRaf || running) return;
    if (reduce) { reset(); render(); return; }
    idleLast = 0; idleRaf = requestAnimationFrame(idleStep);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) startIdle(); }, { threshold: .05 }).observe(cv);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) startIdle(); });

  function start() {
    if (idleRaf) { cancelAnimationFrame(idleRaf); idleRaf = 0; }
    reset(); overlay.hidden = true; running = true; ovRsvp.hidden = true;
    last = performance.now(); endAt = last + DURATION * 1000; raf = requestAnimationFrame(step);
  }
  function finish() {
    running = false; render();
    var isBest = score > best;
    if (isBest) { best = score; $("best").textContent = best; try { localStorage.setItem("bunnyBest", best); } catch (e) {} }
    ovTitle.textContent = score >= 25 ? "Hop, hop, hooray!" : "Nice hopping!";
    ovText.textContent = "You scored " + score + (isBest && score > 0 ? " (new best!)" : "") + ". Now come celebrate with us in real life!";
    $("startLabel").textContent = "Play again"; overlay.className = "overlay"; ovRsvp.hidden = false; overlay.hidden = false;
    if (score >= 25 && window.confetti) window.confetti();
    setTimeout(startIdle, 2500);
  }

  // ---- input ----
  function pointerX(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
  cv.addEventListener("pointermove", function (e) { if (running) targetX = pointerX(e); });
  cv.addEventListener("pointerdown", function (e) { if (running) { targetX = pointerX(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} } });
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { keys[e.key] = true; if (running) e.preventDefault(); }
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });
  startBtn.addEventListener("click", start);
  // folding the game away ends a round in progress
  window.addEventListener("game:fold", function () { if (running) { running = false; cancelAnimationFrame(raf); finish(); } });
  // pause if tab hidden so the clock isn't unfair
  document.addEventListener("visibilitychange", function () { if (document.hidden && running) { running = false; cancelAnimationFrame(raf); finish(); } });

  reset(); render(); startIdle();
})();
