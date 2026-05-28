(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('.site-search'));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
  var lists = Array.prototype.slice.call(document.querySelectorAll('.searchable-list'));
  var activeFilter = 'all';

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function collectText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-year'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-genre'),
      card.textContent
    ].join(' '));
  }

  function applyFilters() {
    var keyword = searchInputs.length ? normalize(searchInputs[0].value) : '';
    lists.forEach(function (list) {
      var cards = Array.prototype.slice.call(list.children);
      cards.forEach(function (card) {
        var haystack = collectText(card);
        var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
        var filterMatch = activeFilter === 'all' || haystack.indexOf(normalize(activeFilter)) !== -1;
        card.classList.toggle('hidden-by-filter', !(keywordMatch && filterMatch));
      });
    });
  }

  searchInputs.forEach(function (input) {
    input.addEventListener('input', applyFilters);
  });

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter') || 'all';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applyFilters();
    });
  });

  function initializePlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('.play-button');
    var source = shell.getAttribute('data-hls');
    var hlsInstance = null;

    if (!video || !source) {
      return;
    }

    function loadAndPlay() {
      if (!video.getAttribute('data-ready')) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
        video.setAttribute('data-ready', '1');
      }

      shell.classList.add('is-playing');
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    shell.addEventListener('click', function (event) {
      if (event.target === video && !video.paused) {
        return;
      }
      loadAndPlay();
    });

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        loadAndPlay();
      });
    }

    video.addEventListener('play', function () {
      shell.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      shell.classList.remove('is-playing');
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance && typeof hlsInstance.destroy === 'function') {
        hlsInstance.destroy();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('.player-shell')).forEach(initializePlayer);
})();
