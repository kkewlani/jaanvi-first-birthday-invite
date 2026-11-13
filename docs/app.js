(function () {
  "use strict";
  var P = window.PARTY || {};
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PALETTE = ["#F7A3C0", "#E6759F", "#B79CE6", "#7CCBA5", "#F2C94C", "#7FB8EE", "#FFB27D"];

  // ---------- fill content from config ----------
  var start = new Date(P.startISO), end = new Date(P.endISO);
  function fmtDate(d) {
    try { return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
    catch (e) { return d.toDateString(); }
  }
  function fmtTime(d) {
    try { return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
    catch (e) { return d.toTimeString().slice(0, 5); }
  }
  $("headline").textContent = P.headline || "";
  $("childName").textContent = P.childName || "";
  $("subline").textContent = P.subline || "";
  $("quoteFrom").textContent = P.transitionFrom || "";
  $("quoteTo").textContent = P.transitionTo || "";
  $("datePill").textContent = fmtDate(start) + " · " + fmtTime(start);
  $("whenText").textContent = fmtDate(start) + ", " + fmtTime(start) + " to " + fmtTime(end);
  $("whereText").textContent = (P.venueName ? P.venueName + " · " : "") + (P.address || "");
  $("rsvpBy").textContent = P.rsvpBy || "";
  $("footerHost").textContent = P.hostName ? "With love, " + P.hostName : "";
  document.title = (P.headline || "Birthday") + " | " + (P.childName || "Invite");

  var map = $("mapLink");
  var mapsUrl = P.mapsUrl || (P.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(P.address) : "");
  if (mapsUrl) { map.href = mapsUrl; map.hidden = false; }

  // ---------- bunny illustrations (inline SVG so they can animate) ----------
  // opts: eyes (open|happy|closed), hat (colour), paw (waving), blanket, earL/earR (rotation), feet
  function bunny(o) {
    o = o || {};
    var S = "#F7A3C0", ink = "#7A3E5C", sw = 'stroke="' + S + '" stroke-width="3"';
    var line = 'fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"';
    var eyes = o.eyes === "closed" ? '<path d="M37 97q7 6 14 0M69 97q7 6 14 0" ' + line + '/>'
      : o.eyes === "happy" ? '<path d="M37 100q7-9 14 0M69 100q7-9 14 0" ' + line + '/>'
      : '<circle cx="44" cy="96" r="5" fill="' + ink + '"/><circle cx="76" cy="96" r="5" fill="' + ink + '"/><circle cx="45.8" cy="94" r="1.6" fill="#fff"/><circle cx="77.8" cy="94" r="1.6" fill="#fff"/>';
    var s = '<svg class="bun" viewBox="-6 0 132 158" aria-hidden="true">';
    if (!o.blanket) s += '<ellipse cx="36" cy="146" rx="15" ry="8" fill="#fff" ' + sw + '/><ellipse cx="84" cy="146" rx="15" ry="8" fill="#fff" ' + sw + '/>';
    s += '<g transform="rotate(' + (o.earL || 0) + ' 38 70)"><ellipse cx="38" cy="38" rx="14" ry="36" fill="#fff" ' + sw + '/><ellipse cx="38" cy="40" rx="6.5" ry="26" fill="#FFC2D6"/></g>';
    s += '<g transform="rotate(' + (8 + (o.earR || 0)) + ' 82 70)"><ellipse cx="82" cy="38" rx="14" ry="36" fill="#fff" ' + sw + '/><ellipse cx="82" cy="40" rx="6.5" ry="26" fill="#FFC2D6"/></g>';
    s += '<ellipse cx="60" cy="100" rx="42" ry="40" fill="#fff" ' + sw + '/>' + eyes;
    s += '<ellipse cx="33" cy="108" rx="8" ry="5" fill="#FFC2D6" opacity=".8"/><ellipse cx="87" cy="108" rx="8" ry="5" fill="#FFC2D6" opacity=".8"/>';
    s += '<path d="M54 106q6 7 12 0q-6-4-12 0z" fill="' + S + '"/><path d="M60 111v4M60 115q-5 5-10 1M60 115q5 5 10 1" ' + line.replace('stroke-width="3"', 'stroke-width="2.2"') + '/>';
    if (o.hat) s += '<path d="M44 66L60 22l16 44z" fill="' + o.hat + '" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="21" r="6" fill="#FFE08A"/><circle cx="55" cy="48" r="2.6" fill="#fff" opacity=".8"/><circle cx="64" cy="38" r="2.6" fill="#fff" opacity=".8"/>';
    if (o.paw) {
      s += '<g><ellipse cx="108" cy="116" rx="9" ry="15" fill="#fff" ' + sw + '/>' +
        (reduceMotion ? "" : '<animateTransform attributeName="transform" type="rotate" values="-18 104 128;22 104 128;-18 104 128" dur="0.9s" repeatCount="indefinite"/>') + '</g>';
    }
    if (o.blanket) s += '<path d="M6 120Q60 104 114 120L114 152H6z" fill="#E6DAFA" stroke="#B79CE6" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="136" r="3" fill="#fff"/><circle cx="60" cy="130" r="3" fill="#fff"/><circle cx="90" cy="138" r="3" fill="#fff"/>';
    return s + "</svg>";
  }
  function balloon(c, cls) {
    return '<svg class="balloon ' + cls + '" viewBox="0 0 40 70"><ellipse cx="20" cy="22" rx="16" ry="20" fill="' + c + '"/><ellipse cx="14" cy="14" rx="4" ry="6" fill="#fff" opacity=".5"/><path d="M20 42l-3 5h6z" fill="' + c + '"/><path d="M20 47q-6 10 0 22" fill="none" stroke="#c9a4b8" stroke-width="1.5"/></svg>';
  }
  $("sceneWave").innerHTML = balloon("#B79CE6", "b1") + balloon("#F2C94C", "b2") + balloon("#7CCBA5", "b3") + bunny({ eyes: "happy", hat: "#E6759F", paw: true });
  $("sceneHop").innerHTML =
    '<svg class="trail" viewBox="0 0 200 176" aria-hidden="true"><path d="M18 152Q46 46 84 142M116 142Q154 46 182 152" fill="none" stroke="#F7A3C0" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>' +
    '<use href="#flower" x="2" y="150" width="20" height="20" style="color:#B79CE6"/><use href="#flower" x="178" y="150" width="20" height="20" style="color:#7CCBA5"/><use href="#star" x="93" y="14" width="14" height="14" style="color:#F2C94C"/></svg>' +
    '<div class="shadow"></div>' + bunny({ eyes: "happy", hat: "#B79CE6", earL: -14, earR: 14 });
  $("stageSleep").innerHTML = bunny({ eyes: "closed", blanket: true }) + '<span class="zzz">Z</span><span class="zzz z2">z</span>';
  $("stageHop").innerHTML = bunny({ eyes: "happy", earL: -10, earR: 10 });
  $("stageRun").innerHTML =
    '<svg class="speed" viewBox="0 0 34 40" aria-hidden="true"><path d="M2 8h28M8 20h24M2 32h22" stroke="#7CCBA5" stroke-width="3.5" stroke-linecap="round"/></svg>' +
    bunny({ eyes: "happy", earL: -38, earR: -30 });
  $("sceneThanks").innerHTML = bunny({ eyes: "happy", hat: "#E6759F", paw: true });

  // bunting flags
  var bt = $("bunting");
  for (var f = 0; f < 14; f++) { var fl = document.createElement("i"); fl.style.background = PALETTE[f % PALETTE.length]; bt.appendChild(fl); }

  // ---------- countdown ----------
  function tick() {
    var ms = start - new Date(), el = $("countdown");
    if (isNaN(ms)) { el.hidden = true; return; }
    if (ms <= 0) { el.innerHTML = "<div><b>🎉</b><small>It's party time!</small></div>"; return; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    el.innerHTML = "<div><b>" + d + "</b><small>days</small></div><div><b>" + h + "</b><small>hours</small></div><div><b>" + m + "</b><small>mins</small></div>";
  }
  tick(); setInterval(tick, 30000);

  // ---------- floating hearts / stars / flowers (decor) ----------
  if (!reduceMotion) {
    var fx = document.querySelector(".floaties"), kinds = ["heart", "star", "flower", "heart", "flower"];
    for (var i = 0; i < 12; i++) {
      var sp = document.createElement("span"), sz = 16 + Math.random() * 18;
      sp.style.cssText = "left:" + (Math.random() * 100) + "%;width:" + sz + "px;height:" + sz + "px;color:" + PALETTE[i % PALETTE.length] +
        ";animation-duration:" + (16 + Math.random() * 16) + "s;animation-delay:-" + (Math.random() * 24) + "s";
      sp.innerHTML = '<svg><use href="#' + kinds[i % kinds.length] + '"/></svg>';
      fx.appendChild(sp);
    }
  }

  // ---------- confetti ----------
  var cv = $("confetti"), cx = cv.getContext && cv.getContext("2d"), parts = [], raf = 0;
  function sizeCv() { var r = window.devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; if (cx) cx.setTransform(r, 0, 0, r, 0, 0); }
  sizeCv(); addEventListener("resize", sizeCv);
  var COLORS = ["#F7A3C0", "#FFD6E4", "#E6759F", "#fff", "#F5C96B", "#B79CE6", "#7CCBA5", "#7FB8EE", "#FFB27D"];
  window.confetti = function () {
    if (!cx || reduceMotion) return;
    for (var i = 0; i < 120; i++) parts.push({
      x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3,
      s: 5 + Math.random() * 7, c: COLORS[i % COLORS.length], r: Math.random() * 6, vr: (Math.random() - .5) * .3, heart: i % 4 === 0, life: 0
    });
    if (!raf) raf = requestAnimationFrame(loop);
  };
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.y < innerHeight + 20 && p.life < 220; });
    parts.forEach(function (p) {
      p.vy += .22; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= .99; p.life++;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
      if (p.heart) { cx.beginPath(); cx.arc(-p.s / 4, 0, p.s / 3, 0, 7); cx.arc(p.s / 4, 0, p.s / 3, 0, 7); cx.fill(); }
      else cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6);
      cx.restore();
    });
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  // ---------- toast ----------
  var toastT;
  window.toast = function (msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2800);
  };

  // ---------- calendar (.ics) ----------
  function icsDate(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function esc(s) { return String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
  $("calBtn").addEventListener("click", function () {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BunnyInvite//EN", "BEGIN:VEVENT",
      "UID:" + icsDate(start) + "@bunny-invite", "DTSTAMP:" + icsDate(new Date()),
      "DTSTART:" + icsDate(start), "DTEND:" + icsDate(end),
      "SUMMARY:" + esc((P.childName || "Birthday") + "'s 1st Birthday"),
      "LOCATION:" + esc((P.venueName ? P.venueName + ", " : "") + (P.address || "")),
      "DESCRIPTION:" + esc(P.subline), "END:VEVENT", "END:VCALENDAR"];
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "birthday.ics"; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  });

  // ---------- RSVP form ----------
  var form = $("rsvpForm"), errEl = $("formError"), btn = $("submitBtn");
  function showErr(m) { errEl.textContent = m; errEl.hidden = !m; }
  function waLink() { return P.hostWhatsApp ? "https://wa.me/" + P.hostWhatsApp.replace(/\D/g, "") : ""; }
  form.addEventListener("change", function () { $("countRow").hidden = form.attending.value === "no"; });

  function post(payload, tries) {
    return fetch(P.apiUrl, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).catch(function (e) {
      if (tries > 0) return new Promise(function (res) { setTimeout(res, 1200); }).then(function () { return post(payload, tries - 1); });
      throw e;
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); showErr("");
    var d = {
      name: form.name.value.trim(), attending: form.attending.value,
      adults: parseInt(form.adults.value, 10) || 0, kids: parseInt(form.kids.value, 10) || 0,
      email: form.email.value.trim(), phone: form.phone.value.trim(),
      notes: form.notes.value.trim(), website: form.website.value
    };
    if (!d.name) return showErr("Please tell us your name.");
    if (!d.email && !d.phone) return showErr("Please add an email or a phone number so we can reach you.");
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return showErr("That email doesn't look quite right.");
    if (d.phone && d.phone.replace(/\D/g, "").length < 7) return showErr("That phone number looks too short.");
    if (d.attending === "no") { d.adults = 0; d.kids = 0; }

    btn.disabled = true; btn.textContent = "Sending...";
    var done = function (ok, msg) {
      btn.disabled = false; btn.textContent = "Send RSVP";
      if (!ok) {
        var wa = waLink();
        showErr(msg || "We couldn't save that just now. Please try again" + (wa ? " or message us on WhatsApp." : "."));
        if (wa) errEl.innerHTML += ' <a href="' + wa + '" target="_blank" rel="noopener">Open WhatsApp</a>';
        return;
      }
      showThanks(d);
    };
    if (!P.apiUrl) { console.info("Demo mode: apiUrl not set, nothing saved.", d); return setTimeout(function () { done(true); }, 500); }
    post(d, 1).then(function (r) {
      if (r && r.closed) { btn.disabled = false; btn.textContent = "Send RSVP"; return showClosed(); }
      done(r && r.ok, r && !r.ok ? r.error : "");
    }).catch(function () { done(false); });
  });

  function showThanks(d) {
    form.hidden = true; $("thanks").hidden = false;
    var yes = d.attending === "yes", maybe = d.attending === "maybe";
    $("thanksTitle").textContent = yes ? "Hop, hop, hooray!" : maybe ? "Thanks, we'll keep a carrot for you!" : "We'll miss you!";
    $("thanksText").textContent = yes
      ? "Thank you, " + d.name + "! We can't wait to see you." + (d.email ? " A confirmation is on its way to your inbox." : "")
      : maybe ? "Thank you, " + d.name + ". Just update your RSVP any time."
      : "Thank you for letting us know, " + d.name + ". We'll be thinking of you!";
    if (yes) window.confetti();
    if (window.playPop) window.playPop();
    $("thanks").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }
  $("editAgain").addEventListener("click", function () { $("thanks").hidden = true; form.hidden = false; });

  // ---------- foldable game ----------
  var fun = $("funBtn"), gbody = $("gameBody");
  function setGame(open) {
    gbody.classList.toggle("open", open); gbody.setAttribute("aria-hidden", open ? "false" : "true");
    fun.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) setTimeout(function () { gbody.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }, 250);
    else { window.dispatchEvent(new Event("game:fold")); fun.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
  }
  fun.addEventListener("click", function () { setGame(true); });
  $("foldBtn").addEventListener("click", function () { setGame(false); });

  // ---------- RSVP deadline lock ----------
  var deadline = new Date(P.rsvpDeadlineISO || ""), lead = document.querySelector("#rsvp .lead");
  $("sceneClosed").innerHTML = bunny({ eyes: "closed", blanket: true });
  function showClosed() {
    form.hidden = true; $("thanks").hidden = true; $("closed").hidden = false; if (lead) lead.hidden = true;
    var wa = waLink(), txt = "The RSVP date (" + (P.rsvpBy || "") + ") has passed. ";
    $("closedText").textContent = txt + "If you'd still like to join, please contact " + (P.hostName || "the hosts") + " directly.";
    if (wa) $("closedText").innerHTML += ' <a href="' + wa + '" target="_blank" rel="noopener">Message us on WhatsApp</a>';
  }
  function showOpenForm() { $("closed").hidden = true; form.hidden = false; if (lead) lead.hidden = false; }
  if (!isNaN(deadline) && new Date() > deadline) {
    showClosed();
    // the host may have reopened RSVPs from the sheet menu: ask the server once
    if (P.apiUrl) fetch(P.apiUrl).then(function (r) { return r.json(); }).then(function (r) { if (r && r.open) showOpenForm(); }).catch(function () {});
  }

  // ---------- hidden bunnies (find all 5) ----------
  var spots = [
    ["details", "right:10px;top:12px"], ["rsvp", "left:8px;top:6px"], [".growing", "right:14px;bottom:8px"],
    [".footer", "left:20%;bottom:14px"], [".hero-inner", "left:2px;bottom:70px"]
  ];
  var found = 0; $("finder").hidden = false;
  spots.forEach(function (s) {
    var host = s[0].charAt(0) === "." ? document.querySelector(s[0]) : $(s[0]);
    if (!host) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var b = document.createElement("button");
    b.type = "button"; b.className = "hidden-bunny"; b.setAttribute("aria-label", "A tiny hidden bunny");
    b.style.cssText = s[1]; b.innerHTML = '<svg viewBox="0 0 120 150"><use href="#bunny"/></svg>';
    b.addEventListener("click", function () {
      if (b.classList.contains("found")) return;
      b.classList.add("found"); found++; $("foundCount").textContent = found;
      if (window.playPop) window.playPop();
      if (found === 5) { window.confetti(); window.toast("You found all 5 bunnies! Hop, hop, hooray!"); }
      else window.toast("Found one! " + (5 - found) + " more hiding...");
    });
    host.appendChild(b);
  });
})();
