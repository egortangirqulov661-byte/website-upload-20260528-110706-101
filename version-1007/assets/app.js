(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    document.querySelectorAll("[data-hero-slider]").forEach(function (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
      var prev = slider.querySelector("[data-hero-prev]");
      var next = slider.querySelector("[data-hero-next]");
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("active", dotIndex === index);
        });
      }

      function start() {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          start();
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
          start();
        });
      });

      show(0);
      start();
    });

    document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
      var input = panel.querySelector("[data-filter-input]");
      var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-type]"));
      var grid = panel.parentElement.querySelector("[data-filter-grid]");
      var activeType = "all";

      function applyFilter() {
        if (!grid) {
          return;
        }
        var query = input ? input.value.trim().toLowerCase() : "";
        Array.prototype.slice.call(grid.children).forEach(function (item) {
          var text = (item.getAttribute("data-search") || "").toLowerCase();
          var type = item.getAttribute("data-type") || "";
          var matchText = !query || text.indexOf(query) !== -1;
          var matchType = activeType === "all" || type.indexOf(activeType) !== -1;
          item.classList.toggle("is-hidden-by-filter", !(matchText && matchType));
        });
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeType = button.getAttribute("data-filter-type") || "all";
          buttons.forEach(function (item) {
            item.classList.toggle("active", item === button);
          });
          applyFilter();
        });
      });
    });

    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      var input = form.querySelector("[data-global-search]");
      var grid = document.querySelector("[data-search-grid]");
      var status = document.querySelector("[data-search-status]");

      function runSearch() {
        if (!input || !grid) {
          return;
        }
        var query = input.value.trim().toLowerCase();
        var matches = 0;
        grid.classList.toggle("search-active", !!query);
        Array.prototype.slice.call(grid.children).forEach(function (item) {
          var text = (item.getAttribute("data-search") || "").toLowerCase();
          var matched = !!query && text.indexOf(query) !== -1;
          item.classList.toggle("is-hidden-by-filter", !matched);
          if (matched) {
            matches += 1;
          }
        });
        if (status) {
          status.textContent = query ? "匹配内容：" + matches : "输入关键词开始搜索";
        }
      }

      var params = new URLSearchParams(window.location.search);
      var preset = params.get("q");
      if (preset && input) {
        input.value = preset;
      }
      runSearch();

      if (input) {
        input.addEventListener("input", runSearch);
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        runSearch();
      });
    });

    document.querySelectorAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var overlay = player.querySelector(".play-overlay");
      var stream = player.getAttribute("data-stream");
      var initialized = false;
      var hlsInstance = null;
      var waitForManifest = null;

      function setupStream() {
        if (!video || !stream) {
          return Promise.resolve();
        }
        if (initialized) {
          return waitForManifest || Promise.resolve();
        }
        initialized = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          waitForManifest = Promise.resolve();
          return waitForManifest;
        }
        if (window.Hls && window.Hls.isSupported()) {
          waitForManifest = new Promise(function (resolve) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(stream);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              resolve();
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                resolve();
              }
            });
          });
          return waitForManifest;
        }
        video.src = stream;
        waitForManifest = Promise.resolve();
        return waitForManifest;
      }

      function startVideo() {
        setupStream().then(function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
              if (overlay) {
                overlay.classList.remove("is-hidden");
              }
            });
          }
        });
      }

      if (overlay) {
        overlay.addEventListener("click", startVideo);
      }

      if (video) {
        video.addEventListener("play", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
        });
        video.addEventListener("ended", function () {
          if (overlay) {
            overlay.classList.remove("is-hidden");
          }
        });
      }

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  });
})();
