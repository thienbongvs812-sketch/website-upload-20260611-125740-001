(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function auto() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        auto();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        auto();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        auto();
      });
    });

    show(0);
    auto();
  }

  function setupLocalFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

    scopes.forEach(function (scope) {
      var list = document.querySelector('[data-filter-list]');
      var search = scope.querySelector('[data-local-search]');
      var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-year]'));
      var activeYear = 'all';

      if (!list) {
        return;
      }

      var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

      function apply() {
        var keyword = search ? search.value.trim().toLowerCase() : '';

        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();

          var yearMatched = activeYear === 'all' || card.getAttribute('data-year') === activeYear;
          var keywordMatched = !keyword || haystack.indexOf(keyword) !== -1;

          card.style.display = yearMatched && keywordMatched ? '' : 'none';
        });
      }

      if (search) {
        search.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeYear = button.getAttribute('data-filter-year') || 'all';
          buttons.forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          apply();
        });
      });
    });
  }

  function setupPlayers() {
    var shells = Array.prototype.slice.call(document.querySelectorAll('[data-video-url]'));

    shells.forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('[data-video-start]');
      var source = shell.getAttribute('data-video-url');
      var initialized = false;

      function initPlayer() {
        if (!video || !source || initialized) {
          return;
        }

        initialized = true;

        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(source);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else {
          video.src = source;
        }
      }

      function playVideo() {
        initPlayer();

        if (button) {
          button.classList.add('is-hidden');
        }

        var promise = video.play();

        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            video.controls = true;
          });
        }
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }

      if (video) {
        video.addEventListener('play', initPlayer);
      }
    });
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '  <a class="movie-poster" href="./' + movie.detail + '">',
      '    <img src="./' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.closest(\'.movie-poster\').classList.add(\'image-missing\')">',
      '    <span class="poster-play">▶</span>',
      '  </a>',
      '  <div class="movie-info">',
      '    <div class="movie-meta">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '    </div>',
      '    <h3><a href="./' + movie.detail + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine || movie.summary || '') + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function setupSearchPage() {
    var page = document.querySelector('[data-search-page]');

    if (!page) {
      return;
    }

    var input = page.querySelector('[data-search-input]');
    var regionSelect = page.querySelector('[data-search-region]');
    var typeSelect = page.querySelector('[data-search-type]');
    var yearSelect = page.querySelector('[data-search-year]');
    var count = page.querySelector('[data-search-count]');
    var results = document.querySelector('[data-search-results]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (input) {
      input.value = query;
    }

    fetch('./assets/data/movies.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (movies) {
        fillSelect(regionSelect, uniqueValues(movies, 'region'), '全部地区');
        fillSelect(typeSelect, uniqueValues(movies, 'type'), '全部类型');
        fillSelect(yearSelect, uniqueValues(movies, 'year').sort().reverse(), '全部年份');

        function render() {
          var keyword = input ? input.value.trim().toLowerCase() : '';
          var region = regionSelect ? regionSelect.value : '';
          var type = typeSelect ? typeSelect.value : '';
          var year = yearSelect ? yearSelect.value : '';

          var filtered = movies.filter(function (movie) {
            var text = [
              movie.title,
              movie.region,
              movie.type,
              movie.year,
              movie.genre,
              movie.oneLine,
              movie.summary,
              (movie.tags || []).join(' ')
            ].join(' ').toLowerCase();

            return (!keyword || text.indexOf(keyword) !== -1) &&
              (!region || movie.region === region) &&
              (!type || movie.type === type) &&
              (!year || movie.year === year);
          }).slice(0, 120);

          if (count) {
            count.textContent = '找到 ' + filtered.length + ' 条结果（最多显示 120 条）';
          }

          if (results) {
            results.innerHTML = filtered.map(movieCard).join('') || '<p>没有找到匹配影片，请更换关键词。</p>';
          }
        }

        [input, regionSelect, typeSelect, yearSelect].forEach(function (element) {
          if (element) {
            element.addEventListener('input', render);
            element.addEventListener('change', render);
          }
        });

        render();
      });
  }

  function uniqueValues(items, key) {
    var map = {};

    items.forEach(function (item) {
      if (item[key]) {
        map[item[key]] = true;
      }
    });

    return Object.keys(map);
  }

  function fillSelect(select, values, defaultText) {
    if (!select) {
      return;
    }

    select.innerHTML = '<option value="">' + defaultText + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
  }

  setupHero();
  setupLocalFilters();
  setupPlayers();
  setupSearchPage();
})();
