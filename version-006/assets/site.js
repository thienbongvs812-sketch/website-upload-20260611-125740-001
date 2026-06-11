(function () {
    var navToggle = document.querySelector('[data-nav-toggle]');
    var siteNav = document.querySelector('[data-site-nav]');

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', function () {
            siteNav.classList.toggle('is-open');
        });
    }

    var carousel = document.querySelector('[data-hero-carousel]');

    if (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var index = 0;

        var setSlide = function (next) {
            if (!slides.length) {
                return;
            }

            index = (next + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        };

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                setSlide(dotIndex);
            });
        });

        setInterval(function () {
            setSlide(index + 1);
        }, 5200);
    }

    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-search-panel]'));

    panels.forEach(function (panel) {
        var input = panel.querySelector('[data-search-input]');
        var clear = panel.querySelector('[data-search-clear]');
        var list = document.querySelector('[data-search-list]');
        var empty = document.querySelector('[data-search-empty]');

        if (!input || !list) {
            return;
        }

        var cards = Array.prototype.slice.call(list.querySelectorAll('[data-search-card]'));

        var runSearch = function () {
            var keyword = input.value.trim().toLowerCase();
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-region'),
                    card.textContent
                ].join(' ').toLowerCase();
                var matched = !keyword || haystack.indexOf(keyword) !== -1;

                card.style.display = matched ? '' : 'none';

                if (matched) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle('is-show', visible === 0);
            }
        };

        input.addEventListener('input', runSearch);

        if (clear) {
            clear.addEventListener('click', function () {
                input.value = '';
                runSearch();
                input.focus();
            });
        }
    });

    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (frame) {
        var video = frame.querySelector('video');
        var button = frame.querySelector('[data-play-button]');
        var source = frame.getAttribute('data-source');
        var hlsInstance = null;
        var started = false;

        if (!video || !source) {
            return;
        }

        var attachSource = function () {
            if (started) {
                return;
            }

            started = true;
            video.controls = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                return;
            }

            video.src = source;
        };

        var startPlay = function () {
            frame.classList.add('is-loading');
            attachSource();

            var promise = video.play();

            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    frame.classList.remove('is-loading');
                });
            }
        };

        if (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                startPlay();
            });
        }

        frame.addEventListener('click', function () {
            if (video.paused) {
                startPlay();
            }
        });

        video.addEventListener('click', function (event) {
            event.stopPropagation();

            if (video.paused) {
                startPlay();
            }
        });

        video.addEventListener('playing', function () {
            frame.classList.add('is-playing');
            frame.classList.remove('is-loading');
        });

        video.addEventListener('pause', function () {
            frame.classList.remove('is-playing');
        });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
