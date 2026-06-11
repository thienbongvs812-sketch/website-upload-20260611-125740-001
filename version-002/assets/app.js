(function () {
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
            return;
        }
        document.addEventListener('DOMContentLoaded', callback);
    }

    function setupNavigation() {
        var toggle = document.querySelector('[data-nav-toggle]');
        var nav = document.querySelector('[data-main-nav]');
        var search = document.querySelector('.header-search');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
            if (search) {
                search.classList.toggle('is-open');
            }
        });
    }

    function setupHero() {
        var root = document.querySelector('[data-hero]');
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
        var prev = root.querySelector('[data-hero-prev]');
        var next = root.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
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
        restart();
    }

    function setupPlayer() {
        var video = document.getElementById('videoPlayer');
        var play = document.querySelector('[data-play]');
        var cover = document.querySelector('[data-player-cover]');
        var status = document.querySelector('[data-player-status]');
        if (!video || !play) {
            return;
        }
        var source = video.getAttribute('data-src');
        var hlsInstance = null;

        function setStatus(text) {
            if (status) {
                status.textContent = text;
            }
        }

        function startNative() {
            video.src = source;
            video.controls = true;
            video.play().catch(function () {
                setStatus('浏览器已载入播放源，请再次点击视频区域播放。');
            });
        }

        function startHls() {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                video.controls = true;
                video.play().catch(function () {
                    setStatus('播放源已载入，请再次点击视频区域播放。');
                });
            });
            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    setStatus('播放源暂时无法连接，请稍后重试或更换浏览器。');
                    if (hlsInstance) {
                        hlsInstance.destroy();
                        hlsInstance = null;
                    }
                }
            });
        }

        play.addEventListener('click', function () {
            if (!source) {
                setStatus('当前影片暂无可用播放源。');
                return;
            }
            if (cover) {
                cover.classList.add('is-hidden');
            }
            setStatus('正在载入播放源...');
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                startNative();
            } else if (window.Hls && Hls.isSupported()) {
                startHls();
            } else {
                setStatus('当前浏览器不支持 HLS 播放，请使用支持 HLS 的浏览器访问。');
            }
        });
    }

    function buildCard(movie) {
        var tags = movie.tags.slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');
        return [
            '<article class="movie-card">',
            '    <a class="movie-poster" href="videos/' + movie.id + '.html">',
            '        <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.closest(\'.movie-poster\').classList.add(\'no-image\'); this.remove();">',
            '        <span class="poster-play">▶</span>',
            '        <span class="poster-badge">' + escapeHtml(movie.type) + '</span>',
            '    </a>',
            '    <div class="movie-card-body">',
            '        <a class="movie-title" href="videos/' + movie.id + '.html">' + escapeHtml(movie.title) + '</a>',
            '        <div class="movie-meta"><span>' + movie.year + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.genreRaw) + '</span></div>',
            '        <p>' + escapeHtml(movie.oneLine) + '</p>',
            '        <div class="tag-row">' + tags + '</div>',
            '    </div>',
            '</article>'
        ].join('\n');
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

    function setupSearch() {
        var data = window.MOVIES || [];
        var results = document.querySelector('[data-search-results]');
        var summary = document.querySelector('[data-search-summary]');
        var form = document.querySelector('[data-search-form]');
        var loadMore = document.querySelector('[data-load-more]');
        if (!results || !summary || !data.length) {
            return;
        }
        var filters = {
            region: document.querySelector('[data-filter="region"]'),
            type: document.querySelector('[data-filter="type"]'),
            year: document.querySelector('[data-filter="year"]'),
            genre: document.querySelector('[data-filter="genre"]')
        };
        var visibleCount = 24;
        var matched = [];

        function uniqueValues(key) {
            var seen = {};
            data.forEach(function (movie) {
                if (movie[key]) {
                    seen[movie[key]] = true;
                }
            });
            return Object.keys(seen).sort(function (a, b) {
                return String(b).localeCompare(String(a), 'zh-CN');
            });
        }

        function fillSelect(select, values) {
            if (!select) {
                return;
            }
            values.forEach(function (value) {
                var option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        }

        function getQueryParams() {
            var params = new URLSearchParams(window.location.search);
            return {
                q: params.get('q') || '',
                region: params.get('region') || '',
                type: params.get('type') || '',
                year: params.get('year') || '',
                genre: params.get('genre') || ''
            };
        }

        function applyQueryParams() {
            var params = getQueryParams();
            var input = form ? form.querySelector('input[name="q"]') : null;
            if (input) {
                input.value = params.q;
            }
            Object.keys(filters).forEach(function (key) {
                if (filters[key] && params[key]) {
                    filters[key].value = params[key];
                }
            });
        }

        function collectState() {
            var input = form ? form.querySelector('input[name="q"]') : null;
            return {
                q: input ? input.value.trim().toLowerCase() : '',
                region: filters.region ? filters.region.value : '',
                type: filters.type ? filters.type.value : '',
                year: filters.year ? filters.year.value : '',
                genre: filters.genre ? filters.genre.value : ''
            };
        }

        function match(movie, state) {
            var haystack = [
                movie.title,
                movie.region,
                movie.regionRaw,
                movie.type,
                movie.year,
                movie.genreRaw,
                movie.oneLine,
                movie.tags.join(' ')
            ].join(' ').toLowerCase();
            if (state.q && haystack.indexOf(state.q) === -1) {
                return false;
            }
            if (state.region && movie.region !== state.region) {
                return false;
            }
            if (state.type && movie.type !== state.type) {
                return false;
            }
            if (state.year && String(movie.year) !== state.year) {
                return false;
            }
            if (state.genre && movie.genreRaw.indexOf(state.genre) === -1 && movie.tags.indexOf(state.genre) === -1) {
                return false;
            }
            return true;
        }

        function render(resetVisible) {
            if (resetVisible) {
                visibleCount = 24;
            }
            var state = collectState();
            matched = data.filter(function (movie) {
                return match(movie, state);
            });
            var html = matched.slice(0, visibleCount).map(buildCard).join('\n');
            results.innerHTML = html;
            summary.textContent = '找到 ' + matched.length + ' 部影片，当前显示 ' + Math.min(visibleCount, matched.length) + ' 部。';
            if (loadMore) {
                loadMore.style.display = visibleCount < matched.length ? 'inline-flex' : 'none';
            }
        }

        fillSelect(filters.type, uniqueValues('type'));
        fillSelect(filters.year, uniqueValues('year'));
        fillSelect(filters.genre, Array.from(new Set(data.flatMap(function (movie) {
            return movie.tags.concat(movie.genreRaw.split(/[，,、/ ]+/));
        }))).filter(Boolean).sort(function (a, b) {
            return a.localeCompare(b, 'zh-CN');
        }).slice(0, 80));

        applyQueryParams();
        render(true);

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                render(true);
            });
        }
        Object.keys(filters).forEach(function (key) {
            if (filters[key]) {
                filters[key].addEventListener('change', function () {
                    render(true);
                });
            }
        });
        if (loadMore) {
            loadMore.addEventListener('click', function () {
                visibleCount += 24;
                render(false);
            });
        }
    }

    ready(function () {
        setupNavigation();
        setupHero();
        setupPlayer();
        setupSearch();
    });
})();
