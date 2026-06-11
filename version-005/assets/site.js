(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileMenu = document.querySelector('[data-mobile-menu]');
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', function () {
        mobileMenu.classList.toggle('is-open');
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
      var prev = hero.querySelector('[data-hero-prev]');
      var next = hero.querySelector('[data-hero-next]');
      var index = 0;
      var timer = null;
      var show = function (nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      };
      var restart = function () {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      };
      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          restart();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          restart();
        });
      }
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
          restart();
        });
      });
      restart();
    }

    var mainSearch = document.querySelector('[data-main-search]');
    if (mainSearch) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q) {
        mainSearch.value = q;
      }
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-card-filter]')).forEach(function (input) {
      var section = input.closest('section') || document;
      var list = section.querySelector('[data-card-list]');
      var empty = section.querySelector('[data-empty-state]');
      var cards = list ? Array.prototype.slice.call(list.querySelectorAll('[data-movie-card]')) : [];
      var apply = function () {
        var value = input.value.trim().toLowerCase();
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-tags') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-region') || '',
            card.textContent || ''
          ].join(' ').toLowerCase();
          var matched = !value || haystack.indexOf(value) !== -1;
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      };
      input.addEventListener('input', apply);
      apply();
    });

    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-play]');
      var src = box.getAttribute('data-src');
      var hlsInstance = null;
      var started = false;
      var start = function () {
        if (!video || !src) {
          return;
        }
        if (button) {
          button.classList.add('is-hidden');
        }
        video.controls = true;
        if (!started) {
          started = true;
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
          } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
          } else {
            video.src = src;
          }
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      };
      if (button) {
        button.addEventListener('click', start);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (!started) {
            start();
          }
        });
        video.addEventListener('error', function () {
          if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
          }
        });
      }
    });
  });
})();
