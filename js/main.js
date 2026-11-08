/* ============================================================
   BENDREX — interazioni minime
   Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";

  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
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
})();
