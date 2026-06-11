(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function getSearchText(card) {
    return [
      card.dataset.title || '',
      card.dataset.year || '',
      card.dataset.genre || '',
      card.dataset.tags || ''
    ].join(' ').toLowerCase();
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    if (slides.length < 2) {
      return;
    }
    var index = 0;

    function show(nextIndex) {
      index = nextIndex % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
      });
    });

    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupFilters() {
    var filterInput = document.querySelector('[data-filter-input]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-title].movie-card'));
    if (!cards.length || (!filterInput && !yearSelect)) {
      return;
    }

    function applyFilter() {
      var query = filterInput ? filterInput.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';
      cards.forEach(function (card) {
        var text = getSearchText(card);
        var matchQuery = !query || text.indexOf(query) !== -1;
        var matchYear = !year || card.dataset.year === year;
        card.hidden = !(matchQuery && matchYear);
      });
    }

    if (filterInput) {
      filterInput.addEventListener('input', applyFilter);
    }
    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilter);
    }
  }

  function createSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="' + escapeHtml(movie.url) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="card-score">' + escapeHtml(movie.score) + '</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <a class="movie-title" href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a>',
      '    <div class="movie-meta">',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.category) + '</span>',
      '    </div>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="card-tags">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var input = document.querySelector('[data-search-field]');
    if (!results || !input || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function render() {
      var query = input.value.trim().toLowerCase();
      var list = window.SEARCH_MOVIES.filter(function (movie) {
        if (!query) {
          return true;
        }
        return [
          movie.title,
          movie.year,
          movie.region,
          movie.genre,
          movie.category,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' ').toLowerCase().indexOf(query) !== -1;
      }).slice(0, 120);

      if (!list.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配内容，可以换一个片名、年份或标签继续搜索。</div>';
        return;
      }
      results.innerHTML = list.map(createSearchCard).join('');
    }

    input.addEventListener('input', render);
    render();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });

  window.initMoviePlayer = function (videoUrl) {
    var video = document.getElementById('movieVideo');
    var cover = document.querySelector('[data-player-cover]');
    var startButton = document.querySelector('[data-player-start]');
    var status = document.querySelector('[data-player-status]');
    if (!video || !videoUrl) {
      return;
    }

    function showStatus(message) {
      if (!status) {
        return;
      }
      status.textContent = message;
      status.hidden = false;
    }

    function hideStatus() {
      if (status) {
        status.hidden = true;
      }
    }

    function attach() {
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, hideStatus);
        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (data && data.fatal) {
            showStatus('视频暂时无法播放');
          }
        });
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', hideStatus, { once: true });
        return;
      }

      video.src = videoUrl;
      hideStatus();
    }

    function start() {
      if (cover) {
        cover.classList.add('is-hidden');
      }
      video.setAttribute('controls', 'controls');
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          if (cover) {
            cover.classList.remove('is-hidden');
          }
        });
      }
    }

    attach();
    if (startButton) {
      startButton.addEventListener('click', start);
    }
    if (cover) {
      cover.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
  };
})();
