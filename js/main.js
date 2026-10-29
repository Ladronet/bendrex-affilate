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
})();
