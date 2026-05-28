(function () {
  var scriptUrl = document.currentScript ? document.currentScript.src : "";
  var hlsModuleUrl = scriptUrl ? new URL("hls-dru42stk.js", scriptUrl).href : "./assets/hls-dru42stk.js";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function getHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (window.__siteHlsReady) {
      return window.__siteHlsReady;
    }
    window.__siteHlsReady = import(hlsModuleUrl).then(function (module) {
      return module.H;
    }).catch(function () {
      return loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js").then(function () {
        return window.Hls;
      });
    });
    return window.__siteHlsReady;
  }

  function parseSource() {
    var node = document.getElementById("movie-source");
    if (!node) {
      return "";
    }
    try {
      var data = JSON.parse(node.textContent || "{}");
      return data.url || "";
    } catch (err) {
      return "";
    }
  }

  function startPlayer(shell) {
    var video = shell.querySelector("video");
    var button = shell.querySelector(".play-trigger");
    var url = parseSource();
    if (!video || !url) {
      return;
    }
    var started = false;

    function play() {
      shell.classList.add("is-playing");
      if (button) {
        button.setAttribute("hidden", "hidden");
      }
      if (started) {
        video.play().catch(function () {});
        return;
      }
      started = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(function () {});
        return;
      }
      getHls().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = url;
          video.play().catch(function () {});
        }
      }).catch(function () {
        video.src = url;
        video.play().catch(function () {});
      });
    }

    if (button) {
      button.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    if (slides.length < 2) {
      return;
    }
    var active = 0;
    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
      });
    });
    window.setInterval(function () {
      show(active + 1);
    }, 4600);
  }

  function setupFilters() {
    document.querySelectorAll(".js-filter-panel").forEach(function (panel) {
      var search = panel.querySelector(".js-filter-search");
      var year = panel.querySelector(".js-filter-year");
      var type = panel.querySelector(".js-filter-type");
      var cards = Array.prototype.slice.call(document.querySelectorAll(".js-filter-card"));
      var empty = document.querySelector(".empty-state");
      function apply() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var y = year ? year.value : "";
        var t = type ? type.value : "";
        var visible = 0;
        cards.forEach(function (card) {
          var text = [card.dataset.title, card.dataset.tags, card.dataset.region, card.dataset.genre].join(" ").toLowerCase();
          var ok = (!q || text.indexOf(q) !== -1) && (!y || card.dataset.year === y) && (!t || card.dataset.type === t);
          card.style.display = ok ? "" : "none";
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.style.display = visible ? "none" : "block";
        }
      }
      [search, year, type].forEach(function (el) {
        if (el) {
          el.addEventListener("input", apply);
          el.addEventListener("change", apply);
        }
      });
    });
  }

  function setupSiteSearch() {
    document.querySelectorAll(".js-site-search").forEach(function (input) {
      var wrap = input.closest(".header-search");
      var panel = wrap ? wrap.querySelector(".search-results") : null;
      if (!panel) {
        return;
      }
      function render() {
        var q = input.value.trim().toLowerCase();
        if (!q) {
          panel.hidden = true;
          panel.innerHTML = "";
          return;
        }
        var items = (window.SEARCH_ITEMS || []).filter(function (item) {
          var text = [item.title, item.year, item.type, item.region, item.tags].join(" ").toLowerCase();
          return text.indexOf(q) !== -1;
        }).slice(0, 9);
        panel.innerHTML = items.map(function (item) {
          return '<a class="search-result" href="' + item.link + '"><img src="' + item.cover + '" alt="' + item.title.replace(/"/g, "&quot;") + '"><span><strong>' + item.title + '</strong><span>' + item.year + ' · ' + item.region + ' · ' + item.type + '</span></span></a>';
        }).join("");
        panel.hidden = false;
      }
      input.addEventListener("input", render);
      document.addEventListener("click", function (event) {
        if (wrap && !wrap.contains(event.target)) {
          panel.hidden = true;
        }
      });
    });
  }

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".nav-links");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupSiteSearch();
    document.querySelectorAll(".player-shell").forEach(startPlayer);
  });
})();
