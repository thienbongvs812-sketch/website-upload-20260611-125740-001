(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHeroCarousel() {
    var root = document.querySelector("[data-hero-carousel]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var backgrounds = Array.prototype.slice.call(root.querySelectorAll("[data-hero-bg]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function activate(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      backgrounds.forEach(function (bg, itemIndex) {
        bg.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        activate(dotIndex);
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    activate(0);
    start();
  }

  function setupInlineFilters() {
    var filter = document.querySelector("[data-filter-bar]");
    var grid = document.querySelector("[data-filter-grid]");
    var empty = document.querySelector("[data-empty-results]");
    if (!filter || !grid) {
      return;
    }
    var keyword = filter.querySelector("[data-filter-keyword]");
    var year = filter.querySelector("[data-filter-year]");
    var region = filter.querySelector("[data-filter-region]");
    var type = filter.querySelector("[data-filter-type]");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));

    function matches(card) {
      var text = [
        card.getAttribute("data-title") || "",
        card.getAttribute("data-genre") || "",
        card.getAttribute("data-region") || "",
        card.getAttribute("data-type") || ""
      ].join(" ").toLowerCase();
      var key = keyword && keyword.value ? keyword.value.trim().toLowerCase() : "";
      var yearValue = year && year.value ? year.value : "";
      var regionValue = region && region.value ? region.value : "";
      var typeValue = type && type.value ? type.value : "";
      if (key && text.indexOf(key) === -1) {
        return false;
      }
      if (yearValue && card.getAttribute("data-year") !== yearValue) {
        return false;
      }
      if (regionValue && card.getAttribute("data-region") !== regionValue) {
        return false;
      }
      if (typeValue && card.getAttribute("data-type") !== typeValue) {
        return false;
      }
      return true;
    }

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var isVisible = matches(card);
        card.style.display = isVisible ? "" : "none";
        if (isVisible) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    [keyword, year, region, type].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    apply();
  }

  function setupSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.MOVIES) {
      return;
    }
    var input = root.querySelector("[data-search-input]");
    var results = root.querySelector("[data-search-results]");
    var empty = root.querySelector("[data-empty-results]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (input) {
      input.value = initial;
    }

    function normalize(value) {
      return String(value || "").toLowerCase();
    }

    function render() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var list = window.MOVIES.filter(function (movie) {
        if (!query) {
          return true;
        }
        return normalize(movie.title + " " + movie.region + " " + movie.type + " " + movie.year + " " + movie.genre + " " + movie.tags).indexOf(query) !== -1;
      }).slice(0, 120);
      results.innerHTML = list.map(function (movie) {
        return [
          '<article class="movie-card">',
          '<a class="poster-wrap" href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">',
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '<span class="poster-mask"></span>',
          '<span class="year-badge">' + escapeHtml(movie.year) + '</span>',
          '</a>',
          '<div class="movie-card-body">',
          '<div class="card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
          '<h2><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h2>',
          '<p>' + escapeHtml(movie.oneLine) + '</p>',
          '<div class="tag-row">' + movie.tags.slice(0, 3).map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join("") + '</div>',
          '</div>',
          '</article>'
        ].join("");
      }).join("");
      if (empty) {
        empty.classList.toggle("is-visible", list.length === 0);
      }
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>\"]/g, function (item) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;"
        }[item];
      });
    }

    if (input) {
      input.addEventListener("input", render);
    }
    render();
  }

  function loadScript(src, callback) {
    var script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    script.onerror = callback;
    document.head.appendChild(script);
  }

  window.setupPlayer = function (source) {
    var video = document.querySelector("[data-player-video]");
    var overlay = document.querySelector("[data-player-overlay]");
    if (!video || !source) {
      return;
    }
    var hlsInstance = null;
    var hasLoaded = false;

    function bind(playAfterBind) {
      if (hasLoaded) {
        if (playAfterBind) {
          video.play().catch(function () {});
        }
        return;
      }
      hasLoaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        if (playAfterBind) {
          video.play().catch(function () {});
        }
        return;
      }
      function attach() {
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          if (playAfterBind) {
            video.play().catch(function () {});
          }
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            if (playAfterBind) {
              video.play().catch(function () {});
            }
          });
        } else {
          video.src = source;
          if (playAfterBind) {
            video.play().catch(function () {});
          }
        }
      }
      if (window.Hls) {
        attach();
      } else {
        loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js", attach);
      }
    }

    function start() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      bind(true);
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupInlineFilters();
    setupSearchPage();
  });
})();
