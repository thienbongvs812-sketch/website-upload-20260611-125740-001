(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function setupMobileNavigation() {
        var toggle = document.querySelector('[data-mobile-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));

        if (slides.length === 0) {
            return;
        }

        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-current', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-current', dotIndex === current);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function reset() {
            if (timer) {
                window.clearInterval(timer);
            }
            start();
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = Number(dot.getAttribute('data-hero-dot')) || 0;
                show(index);
                reset();
            });
        });

        start();
    }

    function setupLocalSearch() {
        var input = document.querySelector('[data-local-search]');
        var grid = document.querySelector('[data-filter-grid]');

        if (!input || !grid) {
            return;
        }

        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card, .rank-card'));
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';

        if (query) {
            input.value = query;
            filter(query);
        }

        input.addEventListener('input', function () {
            filter(input.value);
        });

        function filter(value) {
            var text = String(value || '').trim().toLowerCase();

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-region'),
                    card.textContent
                ].join(' ').toLowerCase();

                card.classList.toggle('is-filtered', text && haystack.indexOf(text) === -1);
            });
        }
    }

    function setupImages() {
        Array.prototype.slice.call(document.querySelectorAll('img')).forEach(function (image) {
            image.addEventListener('error', function () {
                image.classList.add('is-hidden');
            }, { once: true });
        });
    }

    function setupVideoPlayers() {
        var videos = Array.prototype.slice.call(document.querySelectorAll('[data-video-player]'));

        videos.forEach(function (video) {
            var button = video.parentElement ? video.parentElement.querySelector('[data-play-button]') : null;

            if (button) {
                button.addEventListener('click', function () {
                    startVideo(video, button);
                });
            }

            video.addEventListener('click', function () {
                if (video.paused) {
                    startVideo(video, button);
                }
            });

            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('is-hidden');
                }
            });

            video.addEventListener('pause', function () {
                if (button && video.currentTime === 0) {
                    button.classList.remove('is-hidden');
                }
            });
        });
    }

    function startVideo(video, button) {
        attachStream(video);

        var playAttempt = video.play();

        if (playAttempt && typeof playAttempt.catch === 'function') {
            playAttempt.catch(function () {
                video.controls = true;
            });
        }

        if (button) {
            button.classList.add('is-hidden');
        }
    }

    function attachStream(video) {
        if (video.getAttribute('data-ready') === 'true') {
            return;
        }

        var url = video.getAttribute('data-source');

        if (!url) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.setAttribute('data-ready', 'true');
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.setAttribute('data-ready', 'true');
            return;
        }

        video.src = url;
        video.setAttribute('data-ready', 'true');
    }

    ready(function () {
        setupMobileNavigation();
        setupHero();
        setupLocalSearch();
        setupImages();
        setupVideoPlayers();
    });
}());
