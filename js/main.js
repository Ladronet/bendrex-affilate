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

  var specToggles = document.querySelectorAll(".spec-toggle");
  Array.prototype.forEach.call(specToggles, function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = expanded;
      }
      var icon = btn.querySelector(".spec-chevron");
      if (icon) {
        icon.textContent = expanded ? "+" : "−";
      }
    });
  });

  var year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
