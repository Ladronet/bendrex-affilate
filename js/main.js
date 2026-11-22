/* ============================================================
   BENDREX — interazioni minime
   Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";

  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    var navLabelClosed = navToggle.getAttribute("aria-label") || "Apri menu";
    var navLabelOpen = "Chiudi menu";

    var setNav = function (open, restoreFocus) {
      navLinks.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? navLabelOpen : navLabelClosed);
      if (!open && restoreFocus) {
        navToggle.focus();
      }
    };

    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true", false);
    });

    // Esc chiude il menu e riporta il focus sul bottone (pattern disclosure).
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      setNav(false, true);
    });

    // Una voce già sulla pagina (es. Home) non deve lasciare il menu aperto.
    Array.prototype.forEach.call(navLinks.querySelectorAll("a"), function (link) {
      link.addEventListener("click", function () {
        setNav(false, false);
      });
    });
  }

  var buildCards = document.querySelectorAll(".card[role='button']");
  Array.prototype.forEach.call(buildCards, function (card) {
    var toggleCard = function () {
      var expanded = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", expanded ? "false" : "true");
      var panel = document.getElementById(card.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = expanded;
      }
    };
    card.addEventListener("click", toggleCard);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggleCard();
      }
    });
  });

  var year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // Reveal on scroll (skipped with reduced motion or when unsupported)
  var revealTargets = document.querySelectorAll(".card, .timeline li");
  if (revealTargets.length) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(revealTargets, function (el) {
        el.classList.add("reveal-in");
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        Array.prototype.forEach.call(entries, function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });
      Array.prototype.forEach.call(revealTargets, function (el) {
        io.observe(el);
      });
    }
  }

  // Indice di pagina: ancore con scroll controllato e reveal immediato.
  // Senza JS restano normali ancore: il browser salta e scroll-margin-top
  // evita che il titolo finisca sotto l'header sticky.
  var pageIndex = document.querySelector(".section-jump");
  var HEADER_OFFSET = 84;

  function revealSection(el) {
    if (!el) return;
    Array.prototype.forEach.call(el.querySelectorAll(".card, .timeline li"), function (child) {
      child.classList.add("reveal-in");
    });
  }

  function focusSection(el) {
    if (!el) return;
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }
    el.focus({ preventScroll: true });
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function targetTop(el) {
    return el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
  }

  function jumpTo(el, updateHash) {
    var dest = Math.max(0, Math.round(targetTop(el)));
    revealSection(el);
    focusSection(el);

    if (updateHash) {
      var hash = "#" + el.id;
      if (history.pushState) {
        history.pushState(null, "", hash);
      } else {
        location.hash = hash;
      }
    }

    if (prefersReducedMotion()) {
      window.scrollTo(0, dest);
      return;
    }

    // Animazione breve e costante: quella nativa su tratte lunghe arriva a 3-4 s.
    // Uso un timer invece di requestAnimationFrame perché alcuni contesti
    // (schede in background, browser embedded) non emettono frame.
    var docEl = document.documentElement;
    var previous = docEl.style.scrollBehavior;
    docEl.style.scrollBehavior = "auto";

    var from = window.pageYOffset;
    var distance = dest - from;
    var duration = Math.min(600, Math.max(260, Math.abs(distance) / 4));
    var startTime = Date.now();

    function step() {
      var progress = Math.min(1, (Date.now() - startTime) / duration);
      var eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      window.scrollTo(0, Math.round(from + distance * eased));
      if (progress < 1) {
        window.setTimeout(step, 16);
      } else {
        docEl.style.scrollBehavior = previous;
      }
    }
    step();
  }

  if (pageIndex) {
    Array.prototype.forEach.call(pageIndex.querySelectorAll("a[href^='#']"), function (link) {
      link.addEventListener("click", function (event) {
        var el = document.getElementById(link.getAttribute("href").slice(1));
        if (!el) return;
        event.preventDefault();
        jumpTo(el, true);
      });
    });

    // Arrivo con hash (link condiviso, ricarica, tasto indietro).
    if (location.hash.length > 1) {
      var initial = document.getElementById(location.hash.slice(1));
      if (initial) {
        revealSection(initial);
        focusSection(initial);
      }
    }

    window.addEventListener("hashchange", function () {
      var el = document.getElementById(location.hash.slice(1));
      if (!el) return;
      revealSection(el);
      focusSection(el);
    });
  }

  // ---------- Sfondo pixel: monete e cristalli nelle corsie laterali ----------
  // Variante B: le particelle vivono solo nello spazio ai lati della colonna
  // (max-width 1120 px, border-box), mai dietro al testo. Canvas fuori dal
  // flusso, nessuna immagine e nessuna libreria; sotto i 1024 px non viene
  // creato nulla.
  var FX_MIN_W = 1024;
  var FX_GUTTER = 1120;
  var FX_LANE_MIN = 52;
  var FX_FRAME = 1000 / 30;
  var FX_KEY = "bendrex-fx";
  var fxCanvas = null;
  var fxToggle = null;
  var fxRaf = 0;
  var fxLast = 0;
  var fxAcc = 0;
  var fxRunning = false;
  var fxPaused = false;
  var fxW = 0;
  var fxH = 0;
  var fxLane = 0;
  var fxParts = [];
  var fxSprites = null;
  var fxSeed = 20261122;
  var fxBound = false;
  var fxTimer = 0;
  var fxQueued = false;

  // PRNG deterministico e senza allocazione: evita Math.random nel loop.
  function fxRand() {
    fxSeed = (fxSeed * 1103515245 + 12345) & 0x7fffffff;
    return fxSeed / 0x7fffffff;
  }

  // Moneta 16x16 su griglia vera: disco schiacciato in larghezza
  // (16 -> 10 -> 4 -> 10 colonne), tre toni, alone e rombo centrale.
  function fxCoin(unit, w) {
    var c = document.createElement("canvas");
    c.width = c.height = 16 * unit;
    var g = c.getContext("2d");
    if (w < 6) {
      for (var y = 2; y < 14; y++) {
        for (var x = 6; x < 10; x++) {
          var edge = x === 6 || x === 9;
          var tip = x === 7 && y > 2 && y < 6;
          g.fillStyle = edge ? "rgba(146,64,14,0.25)" : tip ? "rgba(253,230,138,0.65)" : "rgba(251,191,36,0.60)";
          g.fillRect(x * unit, y * unit, unit, unit);
        }
      }
      return c;
    }
    var rx = Math.min(w / 2 - 0.4, 7.2);
    var ry = 7.2;
    for (var y = 0; y < 16; y++) {
      for (var x = 0; x < 16; x++) {
        var dx = (x + 0.5 - 8) / rx;
        var dy = (y + 0.5 - 8) / ry;
        var d = Math.sqrt(dx * dx + dy * dy);
        var col = "";
        if (d <= 1) {
          col = "rgba(251,191,36,0.60)";
          if (d > 0.9) col = "rgba(146,64,14,0.25)";
          else if (dx < -0.15 && dy < -0.15 && d < 0.6) col = "rgba(253,230,138,0.65)";
        } else if (d <= 1.08) {
          col = "rgba(120,53,15,0.25)";
        }
        if (col) {
          g.fillStyle = col;
          g.fillRect(x * unit, y * unit, unit, unit);
        }
      }
    }
    g.fillStyle = "rgba(146,64,14,0.58)";
    [[8, 7], [7, 8], [9, 8], [8, 9]].forEach(function (p) {
      g.fillRect(p[0] * unit, p[1] * unit, unit, unit);
    });
    return c;
  }

  // Capsula XP 8x16: tre bande di riempimento, bordo e alone a bassa alpha.
  function fxXp(unit) {
    var c = document.createElement("canvas");
    c.width = 8 * unit;
    c.height = 16 * unit;
    var g = c.getContext("2d");
    var bands = ["rgba(34,211,238,0.60)", "rgba(96,165,250,0.60)", "rgba(167,139,250,0.60)"];
    for (var y = 0; y < 16; y++) {
      var x0 = y === 0 || y === 15 ? 2 : y === 1 || y === 14 ? 1 : 0;
      var x1 = 7 - x0;
      for (var x = x0; x <= x1; x++) {
        var edge = x === x0 || x === x1;
        var col;
        if (edge || y < 2 || y > 13) col = "rgba(14,116,144,0.25)";
        else if (y < 6) col = bands[0];
        else if (y < 10) col = bands[1];
        else col = bands[2];
        if (!edge && x === 1 && y > 2 && y < 13) col = "rgba(207,250,254,0.25)";
        g.fillStyle = col;
        g.fillRect(x * unit, y * unit, unit, unit);
      }
    }
    return c;
  }

  // Sprite pre-renderizzati a due scale: 2x (lontano) e 3x (vicino).
  function fxBuild() {
    if (fxSprites) return;
    var coins = [];
    var xp = [];
    [2, 3].forEach(function (unit) {
      coins.push([fxCoin(unit, 16), fxCoin(unit, 10), fxCoin(unit, 4), fxCoin(unit, 10)]);
      xp.push(fxXp(unit));
    });
    fxSprites = { coins: coins, xp: xp };
  }

  function fxMake() {
    fxParts = [];
    for (var i = 0; i < 32; i++) {
      fxParts.push({
        lane: i % 2,
        gem: (i >> 1) % 4 === 3,
        depth: (i >> 3) % 2,
        unit: 2,
        w: 0,
        h: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        spin: 0,
        spinT: 0,
        tick: 0
      });
    }
  }

  function fxSpawn(p, initial) {
    var near = p.depth === 0;
    p.unit = near && fxLane >= 60 ? 3 : 2;
    p.w = (p.gem ? 8 : 16) * p.unit;
    p.h = 16 * p.unit;
    var minX = p.lane ? fxW - fxLane + 4 : 4;
    var maxX = (p.lane ? fxW - 4 : fxLane - 4) - p.w;
    if (maxX < minX) maxX = minX;
    p.x = minX + fxRand() * (maxX - minX);
    p.y = initial ? fxRand() * fxH : -p.h - fxRand() * 160;
    p.vy = (near ? 58 : 26) + fxRand() * (near ? 34 : 20);
    p.vx = (fxRand() * 2 - 1) * (near ? 8 : 4);
    p.rot = (fxRand() * 4) | 0;
    p.spin = 300 + fxRand() * 380;
    p.spinT = 0;
    p.tick = fxRand() * 2;
  }

  function fxDraw(dt) {
    var g = fxCanvas.getContext("2d");
    g.clearRect(0, 0, fxW, fxH);
    if (fxLane < FX_LANE_MIN) return;
    for (var i = 0; i < fxParts.length; i++) {
      var p = fxParts[i];
      var minX = p.lane ? fxW - fxLane + 4 : 4;
      var maxX = (p.lane ? fxW - 4 : fxLane - 4) - p.w;
      if (maxX < minX) maxX = minX;
      if (dt > 0) {
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.spinT += dt * 1000;
        p.tick += dt;
        if (p.spinT >= p.spin) {
          p.spinT = 0;
          p.rot = (p.rot + 1) & 3;
        }
        if (p.x < minX) { p.x = minX; p.vx = -p.vx; }
        if (p.x > maxX) { p.x = maxX; p.vx = -p.vx; }
        if (p.y > fxH + p.h) fxSpawn(p, false);
      }
      g.globalAlpha = p.depth === 0 ? 1 : 0.35;
      var scale = p.unit === 3 ? 1 : 0;
      var sprite = p.gem ? fxSprites.xp[scale] : fxSprites.coins[scale][p.rot];
      var px = Math.round(p.x);
      var py = Math.round(p.y);
      g.drawImage(sprite, px, py);
      if (p.gem) {
        var t1 = 12 - ((p.tick * 6) | 0) % 9;
        var t2 = t1 - 4;
        if (t2 < 2) t2 += 9;
        g.fillStyle = "rgba(224,242,254,0.65)";
        g.fillRect(px + 2 * p.unit, py + t1 * p.unit, p.unit, 2 * p.unit);
        g.fillRect(px + 5 * p.unit, py + t2 * p.unit, p.unit, 2 * p.unit);
      }
    }
    g.globalAlpha = 1;
  }

  function fxFrame(now) {
    if (!fxRunning) return;
    fxRaf = window.requestAnimationFrame(fxFrame);
    var dt = now - fxLast;
    fxLast = now;
    if (dt < 0) dt = 0;
    fxAcc += dt;
    if (fxAcc < FX_FRAME) return;
    var step = Math.min(fxAcc, 100);
    fxAcc = 0;
    fxDraw(step / 1000);
  }

  function fxStart() {
    if (!fxCanvas || fxRunning || fxPaused || document.hidden) return;
    fxRunning = true;
    fxLast = window.performance.now();
    fxAcc = FX_FRAME;
    fxRaf = window.requestAnimationFrame(fxFrame);
  }

  function fxStop() {
    fxRunning = false;
    if (fxRaf) window.cancelAnimationFrame(fxRaf);
    fxRaf = 0;
  }

  function fxSetPaused(paused, save) {
    fxPaused = paused;
    document.documentElement.classList.toggle("no-fx", paused);
    if (fxToggle) {
      fxToggle.setAttribute("aria-pressed", paused ? "true" : "false");
      fxToggle.setAttribute("aria-label", paused ? "Riprendi animazioni" : "Pausa animazioni");
      fxToggle.textContent = paused ? "\u25B6" : "II";
    }
    if (save) {
      try { localStorage.setItem(FX_KEY, paused ? "off" : "on"); } catch (e) {}
    }
    if (paused) fxStop();
    else fxStart();
  }

  function fxResize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxW = document.documentElement.clientWidth;
    fxH = document.documentElement.clientHeight;
    fxLane = (fxW - FX_GUTTER) / 2;
    fxCanvas.width = Math.round(fxW * dpr);
    fxCanvas.height = Math.round(fxH * dpr);
    var g = fxCanvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;
  }

  function fxCanRun() {
    var w = document.documentElement.clientWidth;
    if (w < FX_MIN_W || (w - FX_GUTTER) / 2 < FX_LANE_MIN) return false;
    var c = navigator.connection;
    if (c && (c.saveData || c.effectiveType === "slow-2g" || c.effectiveType === "2g" || c.effectiveType === "3g")) return false;
    return true;
  }

  function fxBuildDom() {
    if (fxCanvas || !fxCanRun()) return;
    fxBuild();
    if (!fxParts.length) fxMake();
    var saved = null;
    try { saved = localStorage.getItem(FX_KEY); } catch (e) {}
    fxPaused = saved ? saved === "off" : window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    fxCanvas = document.createElement("canvas");
    fxCanvas.id = "fx-canvas";
    fxCanvas.setAttribute("aria-hidden", "true");
    fxCanvas.style.opacity = "1"; // alpha per pixel negli sprite, niente velo uniforme
    document.body.appendChild(fxCanvas);
    fxResize();

    fxToggle = document.createElement("button");
    fxToggle.type = "button";
    fxToggle.id = "fx-toggle";
    fxToggle.addEventListener("click", function () { fxSetPaused(!fxPaused, true); });
    document.body.appendChild(fxToggle);

    for (var i = 0; i < fxParts.length; i++) fxSpawn(fxParts[i], true);
    fxSetPaused(fxPaused, false);
    if (fxPaused) fxDraw(0);
  }

  function fxTeardown() {
    fxStop();
    if (fxCanvas && fxCanvas.parentNode) fxCanvas.parentNode.removeChild(fxCanvas);
    if (fxToggle && fxToggle.parentNode) fxToggle.parentNode.removeChild(fxToggle);
    fxCanvas = null;
    fxToggle = null;
  }

  function fxSync() {
    if (!fxCanRun()) { if (fxCanvas) fxTeardown(); return; }
    if (!fxCanvas) { fxBuildDom(); return; }
    fxResize();
    for (var i = 0; i < fxParts.length; i++) fxSpawn(fxParts[i], true);
    if (fxPaused) fxDraw(0);
  }

  function fxInit() {
    if (!fxCanRun()) return;
    fxBuildDom();
    if (fxBound) return;
    fxBound = true;
    window.addEventListener("resize", function () {
      window.clearTimeout(fxTimer);
      fxTimer = window.setTimeout(fxSync, 160);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) fxStop();
      else if (!fxPaused) fxStart();
    });
  }

  function fxQueue() {
    if (fxQueued) return;
    fxQueued = true;
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fxInit, { timeout: 1800 });
    } else {
      window.setTimeout(fxInit, 160);
    }
  }

  if (document.readyState === "complete") fxQueue();
  else window.addEventListener("load", fxQueue);
})();
