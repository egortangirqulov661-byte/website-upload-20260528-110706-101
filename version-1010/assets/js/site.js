(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupImages() {
    document.querySelectorAll("[data-cover-image]").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("is-missing");
      }, { once: true });
    });
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var activeIndex = slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    });

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    function show(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle("is-active", current === activeIndex);
      });
      dots.forEach(function (dot, current) {
        if (current === activeIndex) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function move(step) {
      show(activeIndex + step);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        move(-1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        move(1);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        move(1);
      }, 5200);
    }
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    if (!panels.length) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var params = new URLSearchParams(window.location.search);

    panels.forEach(function (panel) {
      var input = panel.querySelector("[data-search-input]");
      var typeSelect = panel.querySelector("[data-filter-type]");
      var yearSelect = panel.querySelector("[data-filter-year]");
      var empty = document.querySelector("[data-empty-state]");

      if (input && params.get("q")) {
        input.value = params.get("q");
      }

      function apply() {
        var keyword = normalize(input && input.value);
        var typeValue = normalize(typeSelect && typeSelect.value);
        var yearValue = normalize(yearSelect && yearSelect.value);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.dataset.search);
          var cardType = normalize(card.dataset.type);
          var cardYear = normalize(card.dataset.year);
          var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
          var typeMatch = !typeValue || cardType.indexOf(typeValue) !== -1 || haystack.indexOf(typeValue) !== -1;
          var yearMatch = !yearValue || cardYear.indexOf(yearValue) !== -1;
          var matched = keywordMatch && typeMatch && yearMatch;

          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.hidden = visibleCount !== 0;
        }
      }

      [input, typeSelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function setupPlayer() {
    var player = document.querySelector("[data-player]");
    if (!player) {
      return;
    }

    var video = player.querySelector("video[data-video-src]");
    var button = player.querySelector("[data-play-button]");
    var message = player.querySelector("[data-player-message]");

    if (!video) {
      return;
    }

    var source = video.getAttribute("data-video-src");
    var prepared = false;

    function showMessage() {
      if (message) {
        message.hidden = false;
      }
    }

    function prepare() {
      if (prepared || !source) {
        return prepared;
      }

      prepared = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        player.classList.add("is-ready");
        return true;
      }

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          player.classList.add("is-ready");
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage();
          }
        });
        return true;
      }

      showMessage();
      return false;
    }

    function play() {
      if (!prepare()) {
        return;
      }

      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          player.classList.remove("is-playing");
        });
      }
    }

    prepare();

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        play();
      });
    }

    video.addEventListener("play", function () {
      player.classList.add("is-playing");
    });

    video.addEventListener("pause", function () {
      player.classList.remove("is-playing");
    });

    video.addEventListener("ended", function () {
      player.classList.remove("is-playing");
    });
  }

  ready(function () {
    setupImages();
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
