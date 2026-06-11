(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var menu = document.querySelector('[data-mobile-nav]');
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero-carousel]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }
        function play() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }
        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            play();
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }
        show(0);
        play();
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function setupSearch() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-search-scope]'));
        scopes.forEach(function (scope) {
            var input = scope.querySelector('[data-search-input]');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('.searchable-card'));
            var empty = scope.querySelector('[data-empty-state]');
            if (!input || !cards.length) {
                return;
            }
            function filter() {
                var query = normalize(input.value);
                var visible = 0;
                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute('data-filter') || card.textContent);
                    var matched = !query || text.indexOf(query) !== -1;
                    card.classList.toggle('is-hidden', !matched);
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }
            input.addEventListener('input', filter);
            var params = new URLSearchParams(window.location.search);
            var q = params.get('q');
            if (q) {
                input.value = q;
                filter();
            }
        });
    }

    window.initMoviePlayer = function (config) {
        var shell = document.querySelector(config.shell);
        var video = document.querySelector(config.video);
        if (!shell || !video || !config.url) {
            return;
        }
        var overlay = shell.querySelector('[data-player-start]');
        var errorBox = shell.querySelector('[data-player-error]');
        var loaded = false;
        var hls = null;

        function showError(message) {
            if (errorBox) {
                errorBox.textContent = message;
                errorBox.classList.add('is-visible');
            }
        }

        function bindVideo() {
            if (loaded) {
                return true;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = config.url;
                loaded = true;
                return true;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(config.url);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        showError('播放加载失败，请稍后重试');
                        hls.destroy();
                    }
                });
                loaded = true;
                return true;
            }
            showError('播放加载失败，请稍后重试');
            return false;
        }

        function start() {
            if (!bindVideo()) {
                return;
            }
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            video.controls = true;
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {
                    if (overlay) {
                        overlay.classList.remove('is-hidden');
                    }
                });
            }
        }

        if (overlay) {
            overlay.addEventListener('click', start);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
        window.addEventListener('pagehide', function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupSearch();
    });
}());
