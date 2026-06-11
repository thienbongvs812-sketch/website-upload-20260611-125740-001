(function () {
  var menuButton = document.querySelector('[data-mobile-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var carousel = document.querySelector('[data-hero-carousel]');

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var active = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      active = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        showSlide(active + 1);
      }, 6200);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
        startTimer();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(active - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(active + 1);
        startTimer();
      });
    }

    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
  }

  var filterPanel = document.querySelector('[data-filter-panel]');

  if (filterPanel) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card], [data-rank-row]'));
    var input = filterPanel.querySelector('[data-filter-input]');
    var typeSelect = filterPanel.querySelector('[data-filter-type]');
    var yearSelect = filterPanel.querySelector('[data-filter-year]');
    var empty = document.querySelector('[data-filter-empty]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (input && query) {
      input.value = query;
    }

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function inYearRange(year, range) {
      if (!range) {
        return true;
      }

      var value = Number(year || 0);

      if (range.indexOf('-') > -1) {
        var parts = range.split('-').map(Number);
        return value >= parts[0] && value <= parts[1];
      }

      return value === Number(range);
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : '');
      var type = normalize(typeSelect ? typeSelect.value : '');
      var year = yearSelect ? yearSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-category'),
          card.getAttribute('data-tags')
        ].join(' '));
        var cardType = normalize(card.getAttribute('data-type'));
        var cardYear = card.getAttribute('data-year');
        var matched = (!keyword || haystack.indexOf(keyword) > -1) && (!type || cardType.indexOf(type) > -1) && inYearRange(cardYear, year);

        card.style.display = matched ? '' : 'none';

        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }
})();
