(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMobileNav() {
        var button = qs('.mobile-menu-button');
        var nav = qs('.mobile-nav');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    function initHero() {
        var hero = qs('#homeHero');
        if (!hero) {
            return;
        }
        var slides = qsa('[data-hero-slide]', hero);
        var controls = qsa('[data-hero-dot]', hero);
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            controls.forEach(function (control) {
                control.classList.toggle('is-active', Number(control.getAttribute('data-hero-dot')) === index);
            });
        }
        function start() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        controls.forEach(function (control) {
            control.addEventListener('click', function () {
                show(Number(control.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });
        hero.addEventListener('mouseenter', function () {
            clearInterval(timer);
        });
        hero.addEventListener('mouseleave', start);
        start();
    }

    function initFilters() {
        var scopes = qsa('.filter-scope');
        if (!scopes.length) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';
        var input = qs('.movie-filter-input');
        if (input && query) {
            input.value = query;
        }
        function apply() {
            var text = (input ? input.value : '').trim().toLowerCase();
            var selectValues = {};
            qsa('.filter-select').forEach(function (select) {
                selectValues[select.getAttribute('data-filter')] = select.value;
            });
            scopes.forEach(function (scope) {
                var cards = qsa('.movie-card, .ranking-item', scope);
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
                    var ok = !text || haystack.indexOf(text) !== -1;
                    Object.keys(selectValues).forEach(function (key) {
                        var selected = selectValues[key];
                        if (selected && (card.getAttribute('data-' + key) || '') !== selected) {
                            ok = false;
                        }
                    });
                    card.style.display = ok ? '' : 'none';
                    if (ok) {
                        visible += 1;
                    }
                });
                var empty = scope.parentElement ? scope.parentElement.querySelector('.filter-empty') : null;
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            });
        }
        if (input) {
            input.addEventListener('input', apply);
        }
        qsa('.filter-select').forEach(function (select) {
            select.addEventListener('change', apply);
        });
        apply();
    }

    window.initMoviePlayer = function (stream) {
        var video = document.getElementById('moviePlayer');
        var trigger = document.getElementById('playerTrigger');
        if (!video || !stream) {
            return;
        }
        var attached = false;
        var hls = null;
        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
            } else {
                video.src = stream;
            }
        }
        function begin() {
            attach();
            if (trigger) {
                trigger.classList.add('is-hidden');
            }
            video.controls = true;
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }
        if (trigger) {
            trigger.addEventListener('click', begin);
        }
        video.addEventListener('click', function () {
            if (!attached) {
                begin();
            }
        });
        video.addEventListener('play', function () {
            if (trigger) {
                trigger.classList.add('is-hidden');
            }
        });
        window.addEventListener('pagehide', function () {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMobileNav();
        initHero();
        initFilters();
    });
})();
