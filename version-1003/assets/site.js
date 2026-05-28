(function () {
  const menuButton = document.querySelector(".menu-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function () {
      const open = mobilePanel.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".site-search").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      const input = form.querySelector("input[name='q']");
      if (!input || !input.value.trim()) {
        event.preventDefault();
        input && input.focus();
      }
    });
  });

  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dots button"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    let active = 0;
    let timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === active);
        dot.setAttribute("aria-current", dotIndex === active ? "true" : "false");
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    prev && prev.addEventListener("click", function () {
      show(active - 1);
      start();
    });

    next && next.addEventListener("click", function () {
      show(active + 1);
      start();
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  document.querySelectorAll("[data-filter-input]").forEach(function (input) {
    const target = document.querySelector(input.getAttribute("data-filter-input"));
    const counter = document.querySelector(input.getAttribute("data-filter-count"));
    const cards = target ? Array.from(target.querySelectorAll("[data-filter]")) : [];

    function update() {
      const value = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(function (card) {
        const matched = !value || card.getAttribute("data-filter").includes(value);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (counter) {
        counter.textContent = String(visible);
      }
    }

    input.addEventListener("input", update);
    update();
  });

  function createSearchCard(item) {
    const link = document.createElement("a");
    link.className = "movie-card";
    link.href = item.href;
    link.innerHTML = [
      '<span class="poster-frame">',
      '<img src="' + item.image + '" alt="' + escapeHtml(item.title) + '" loading="lazy" onerror="this.remove()">',
      '<span class="poster-gradient"></span>',
      '<span class="poster-summary">' + escapeHtml(item.oneLine) + '</span>',
      '<span class="type-badge">' + escapeHtml(item.type) + '</span>',
      '</span>',
      '<span class="card-body">',
      '<strong>' + escapeHtml(item.title) + '</strong>',
      '<span class="card-meta">',
      '<span>' + escapeHtml(item.category) + '</span>',
      '<span>' + escapeHtml(item.year) + '</span>',
      '</span>',
      '</span>'
    ].join("");
    return link;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const searchRoot = document.querySelector("[data-search-results]");
  if (searchRoot && Array.isArray(window.movieSearchIndex)) {
    const params = new URLSearchParams(window.location.search);
    const keyword = (params.get("q") || "").trim().toLowerCase();
    const heading = document.querySelector("[data-search-heading]");
    const source = keyword
      ? window.movieSearchIndex.filter(function (item) {
          return item.search.includes(keyword);
        })
      : window.movieSearchIndex.slice(0, 24);

    if (heading) {
      heading.textContent = keyword ? "搜索结果" : "热门片单";
    }

    searchRoot.innerHTML = "";
    if (source.length) {
      source.slice(0, 120).forEach(function (item) {
        searchRoot.appendChild(createSearchCard(item));
      });
    } else {
      const empty = document.createElement("div");
      empty.className = "search-results-empty";
      empty.textContent = "未找到相关内容";
      searchRoot.appendChild(empty);
    }
  }

  document.querySelectorAll("[data-player]").forEach(function (player) {
    const video = player.querySelector("video");
    const cover = player.querySelector(".play-cover");
    if (!video) {
      return;
    }

    function loadAndPlay() {
      const stream = video.getAttribute("data-stream");
      if (!stream) {
        return;
      }
      if (!video.dataset.ready) {
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
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
              hls.destroy();
            }
          });
          video.dataset.ready = "1";
        } else {
          video.src = stream;
          video.dataset.ready = "1";
        }
      }
      player.classList.add("is-started");
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    cover && cover.addEventListener("click", loadAndPlay);
  });
})();
