(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    show(0);
    start();
  }

  function setupFilters() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-box]"));
    boxes.forEach(function (box) {
      var input = box.querySelector("[data-filter-input]");
      var year = box.querySelector("[data-filter-year]");
      var region = box.querySelector("[data-filter-region]");
      var target = document.querySelector(box.getAttribute("data-filter-box"));
      var empty = document.querySelector(box.getAttribute("data-filter-empty"));
      if (!target) {
        return;
      }
      var cards = Array.prototype.slice.call(target.querySelectorAll("[data-card]"));

      function apply() {
        var q = input ? input.value.trim().toLowerCase() : "";
        var y = year ? year.value : "";
        var r = region ? region.value : "";
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-tags") || "",
            card.getAttribute("data-genre") || ""
          ].join(" ").toLowerCase();
          var matchText = !q || haystack.indexOf(q) !== -1;
          var matchYear = !y || card.getAttribute("data-year") === y;
          var matchRegion = !r || card.getAttribute("data-region") === r;
          var match = matchText && matchYear && matchRegion;
          card.style.display = match ? "" : "none";
          if (match) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      if (year) {
        year.addEventListener("change", apply);
      }
      if (region) {
        region.addEventListener("change", apply);
      }
      var params = new URLSearchParams(window.location.search);
      var initial = params.get("q");
      if (initial && input) {
        input.value = initial;
      }
      apply();
    });
  }

  function attachPlayer(videoId, buttonId, source) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(buttonId);
    var hls = null;
    if (!video || !source) {
      return;
    }

    function load() {
      if (video.getAttribute("data-ready") === "1") {
        return Promise.resolve();
      }
      video.setAttribute("data-ready", "1");
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(source);
        hls.attachMedia(video);
        return Promise.resolve();
      }
      video.src = source;
      return Promise.resolve();
    }

    function play() {
      load().then(function () {
        if (overlay) {
          overlay.classList.add("hide");
        }
        var action = video.play();
        if (action && typeof action.catch === "function") {
          action.catch(function () {});
        }
      });
    }

    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.getAttribute("data-ready") !== "1") {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("hide");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.initMoviePlayer = attachPlayer;

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
