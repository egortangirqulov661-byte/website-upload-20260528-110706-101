(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function text(value) {
    return String(value || "").toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var section = panel.parentElement;
      var cards = Array.prototype.slice.call(section.querySelectorAll(".filter-card"));
      var search = panel.querySelector(".filter-search");
      var year = panel.querySelector(".filter-year");
      var region = panel.querySelector(".filter-region");
      var type = panel.querySelector(".filter-type");

      function apply() {
        var q = text(search && search.value);
        var y = text(year && year.value);
        var r = text(region && region.value);
        var t = text(type && type.value);
        cards.forEach(function (card) {
          var body = [card.dataset.title, card.dataset.tags, card.textContent].map(text).join(" ");
          var ok = true;
          if (q && body.indexOf(q) === -1) {
            ok = false;
          }
          if (y && text(card.dataset.year) !== y) {
            ok = false;
          }
          if (r && text(card.dataset.region) !== r) {
            ok = false;
          }
          if (t && text(card.dataset.type) !== t) {
            ok = false;
          }
          card.classList.toggle("is-hidden", !ok);
        });
      }

      [search, year, region, type].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
    });
  }

  function cardMarkup(item) {
    return [
      '<article class="movie-card">',
      '<a href="' + escapeHtml(item.href) + '" class="card-link">',
      '<div class="poster-wrap">',
      '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
      '<div class="poster-shade"></div>',
      '<div class="poster-copy"><p>' + escapeHtml(item.oneLine) + '</p></div>',
      '<span class="type-badge">' + escapeHtml(item.type) + '</span>',
      '</div>',
      '<div class="card-body">',
      '<h2>' + escapeHtml(item.title) + '</h2>',
      '<div class="card-meta"><span>' + escapeHtml(item.category) + '</span><span>' + escapeHtml(item.year) + '</span></div>',
      '<p>' + escapeHtml(item.region) + ' · ' + escapeHtml(item.genre) + '</p>',
      '</div>',
      '</a>',
      '</article>'
    ].join("");
  }

  function initSearch() {
    var input = document.querySelector("[data-search-input]");
    var title = document.querySelector("[data-search-title]");
    var results = document.querySelector("[data-search-results]");
    if (!input || !title || !results || typeof SITE_MOVIES === "undefined") {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";
    input.value = q;

    function render(query) {
      var value = text(query).trim();
      if (!value) {
        title.textContent = "热门搜索";
        return;
      }
      var words = value.split(/\s+/).filter(Boolean);
      var matched = SITE_MOVIES.filter(function (item) {
        var haystack = text([item.title, item.oneLine, item.year, item.region, item.type, item.genre, item.tags, item.category].join(" "));
        return words.every(function (word) {
          return haystack.indexOf(word) !== -1;
        });
      }).slice(0, 120);
      title.textContent = "搜索结果";
      results.innerHTML = matched.length ? matched.map(cardMarkup).join("") : '<p class="empty-state">没有找到相关内容，可尝试更换关键词。</p>';
    }

    render(q);
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initSearch();
  });
})();

function attachMoviePlayer(stream) {
  var video = document.getElementById("movie-video");
  var layer = document.getElementById("player-layer");
  if (!video || !stream) {
    return;
  }
  var started = false;
  var hls = null;

  function playNow() {
    if (layer) {
      layer.classList.add("is-hidden");
    }
    if (!started) {
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        video.play().catch(function () {});
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        hls.on(Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal || !hls) {
            return;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
        return;
      }
      video.src = stream;
    }
    video.play().catch(function () {});
  }

  if (layer) {
    layer.addEventListener("click", playNow);
  }
  video.addEventListener("click", function () {
    if (!started || video.paused) {
      playNow();
    }
  });
}
