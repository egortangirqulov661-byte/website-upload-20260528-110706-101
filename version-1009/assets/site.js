(function () {
  var mobileButton = document.querySelector('[data-mobile-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      var target = './search.html';
      if (value) {
        target += '?q=' + encodeURIComponent(value);
      }
      window.location.href = target;
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
    }

    function startTimer() {
      if (timer || slides.length <= 1) {
        return;
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function resetTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      startTimer();
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        resetTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        resetTimer();
      });
    }

    show(0);
    startTimer();
  });

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters(scope) {
    var input = scope.querySelector('[data-filter-input]');
    var region = scope.querySelector('[data-region-filter]');
    var type = scope.querySelector('[data-type-filter]');
    var year = scope.querySelector('[data-year-filter]');
    var listSection = document.querySelector('[data-card-list]');
    var cards = listSection ? Array.prototype.slice.call(listSection.querySelectorAll('.movie-card')) : [];
    var empty = listSection ? listSection.querySelector('[data-empty-state]') : null;

    function apply() {
      var keyword = normalize(input ? input.value : '');
      var regionValue = normalize(region ? region.value : '');
      var typeValue = normalize(type ? type.value : '');
      var yearValue = normalize(year ? year.value : '');
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' '));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesRegion = !regionValue || normalize(card.getAttribute('data-region')) === regionValue;
        var matchesType = !typeValue || normalize(card.getAttribute('data-type')) === typeValue;
        var matchesYear = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
        var isVisible = matchesKeyword && matchesRegion && matchesType && matchesYear;
        card.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, region, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');
    if (initialQuery && input) {
      input.value = initialQuery;
    }
    apply();
  }

  document.querySelectorAll('[data-filter-scope]').forEach(setupFilters);

  document.querySelectorAll('.player-panel').forEach(function (panel) {
    var video = panel.querySelector('video');
    var button = panel.querySelector('.play-overlay');
    var stream = panel.getAttribute('data-stream');
    var hlsInstance = null;
    var prepared = false;

    function prepare() {
      if (!video || !stream || prepared) {
        return;
      }
      prepared = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        return;
      }

      video.src = stream;
    }

    function play() {
      if (!video) {
        return;
      }
      prepare();
      if (button) {
        button.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          if (button) {
            button.classList.remove('is-hidden');
          }
        });
      }
    }

    if (button) {
      button.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
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
      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    }
  });
})();
