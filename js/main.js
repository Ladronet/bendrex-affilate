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
  // da 1160 px, mai dietro al testo. Canvas fuori dal flusso, nessuna immagine
  // e nessuna libreria; sotto i 1024 px non viene creato nulla.
  var FX_MIN_W = 1024;
  var FX_GUTTER = 1160;
  var FX_LANE_MIN = 40;
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

  function fxSprite(rows, colors, unit) {
    var c = document.createElement("canvas");
    c.width = c.height = rows.length * unit;
    var g = c.getContext("2d");
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var fill = colors[rows[y].charAt(x)];
        if (!fill) continue;
        g.fillStyle = fill;
        g.fillRect(x * unit, y * unit, unit, unit);
      }
    }
    return c;
  }

  function fxRotate(rows) {
    var out = [];
    for (var x = 0; x < rows.length; x++) {
      var line = "";
      for (var y = rows.length - 1; y >= 0; y--) line += rows[y].charAt(x);
      out.push(line);
    }
    return out;
  }

  // Sprite pre-renderizzati: 4 rotazioni da 90° per le monete, 2 palette per
  // i cristalli, due scale (vicino/lontano). Nessun disegno per pixel nel loop.
  function fxBuild() {
    if (fxSprites) return;
    var coin = [
      " ##### ",
      "#YYYYY#",
      "#YWWYY#",
      "#YWYYY#",
      "#YYYYY#",
      "#YYYYY#",
      " ##### "
    ];
    var gem = [
      "  ##  ",
      " #CC# ",
      "#CWWC#",
      "#CWWC#",
      " #CC# ",
      "  ##  "
    ];
    var coinColors = { "#": "#5B3A08", "Y": "#FBBF24", "W": "#FDE68A" };
    var cyan = { "#": "#0E7490", "C": "#22D3EE", "W": "#CFFAFE" };
    var violet = { "#": "#6D28D9", "C": "#A78BFA", "W": "#E9D5FF" };
    var coins = [];
    var gems = [];
    [1, 2].forEach(function (unit) {
      var frames = [];
      var rows = coin;
      for (var i = 0; i < 4; i++) {
        frames.push(fxSprite(rows, coinColors, unit));
        rows = fxRotate(rows);
      }
      coins.push(frames);
      gems.push([fxSprite(gem, cyan, unit), fxSprite(gem, violet, unit)]);
    });
    fxSprites = { coins: coins, gems: gems };
  }

  function fxMake() {
    fxParts = [];
    for (var i = 0; i < 24; i++) {
      fxParts.push({
        lane: i % 2,
        gem: i % 3 === 0,
        depth: (i >> 1) % 2,
        color: i % 2,
        size: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        spin: 0,
        spinT: 0,
        alpha: 1
      });
    }
  }

  function fxSpawn(p, initial) {
    var near = p.depth === 0;
    var size = p.gem ? (near ? 12 : 6) : (near ? 14 : 7);
    var minX = p.lane ? fxW - fxLane + 4 : 4;
    var maxX = (p.lane ? fxW - 4 : fxLane - 4) - size;
    if (maxX < minX) maxX = minX;
    p.size = size;
    p.x = minX + fxRand() * (maxX - minX);
    p.y = initial ? fxRand() * fxH : -size - fxRand() * 160;
    p.vy = (near ? 58 : 26) + fxRand() * (near ? 34 : 20);
    p.vx = (fxRand() * 2 - 1) * (near ? 8 : 4);
    p.rot = (fxRand() * 4) | 0;
    p.spin = 300 + fxRand() * 380;
    p.spinT = 0;
    p.alpha = near ? 1 : 0.6;
  }

  function fxDraw(dt) {
    var g = fxCanvas.getContext("2d");
    g.clearRect(0, 0, fxW, fxH);
    if (fxLane < FX_LANE_MIN) return;
    for (var i = 0; i < fxParts.length; i++) {
      var p = fxParts[i];
      var minX = p.lane ? fxW - fxLane + 4 : 4;
      var maxX = (p.lane ? fxW - 4 : fxLane - 4) - p.size;
      if (maxX < minX) maxX = minX;
      if (dt > 0) {
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.spinT += dt * 1000;
        if (p.spinT >= p.spin) {
          p.spinT = 0;
          p.rot = (p.rot + 1) & 3;
        }
        if (p.x < minX) { p.x = minX; p.vx = -p.vx; }
        if (p.x > maxX) { p.x = maxX; p.vx = -p.vx; }
        if (p.y > fxH + p.size) fxSpawn(p, false);
      }
      g.globalAlpha = p.alpha;
      var scale = p.depth === 0 ? 1 : 0;
      var sprite = p.gem
        ? fxSprites.gems[scale][p.color]
        : fxSprites.coins[scale][p.rot];
      g.drawImage(sprite, Math.round(p.x), Math.round(p.y));
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
