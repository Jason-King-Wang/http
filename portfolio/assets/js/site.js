
(function () {
  const body = document.body;
  const modeToggle = document.querySelector("[data-mode-toggle]");
  const savedMode = localStorage.getItem("portfolio-interview-mode");
  if (savedMode === "on") body.classList.add("interview-mode");

  modeToggle?.addEventListener("click", () => {
    body.classList.toggle("interview-mode");
    localStorage.setItem("portfolio-interview-mode", body.classList.contains("interview-mode") ? "on" : "off");
  });

  const search = document.querySelector("[data-project-search]");
  const cards = Array.from(document.querySelectorAll("[data-project-card]"));
  const filters = Array.from(document.querySelectorAll("[data-filter]"));
  let activeFilter = "all";

  function applyFilters() {
    const query = (search?.value || "").trim().toLowerCase();
    cards.forEach((card) => {
      const haystack = [card.dataset.title, card.dataset.tags, card.textContent.toLowerCase()].join(" ");
      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = activeFilter === "all" || haystack.includes(activeFilter);
      card.classList.toggle("hidden", !(matchesSearch && matchesFilter));
    });
  }

  search?.addEventListener("input", applyFilters);

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filters.forEach((item) => item.classList.toggle("active", item === button));
      applyFilters();
    });
  });

  const floatCarouselTimers = new WeakMap();

  function stopFloatCarousel(root) {
    const timer = floatCarouselTimers.get(root);
    if (timer) {
      window.clearInterval(timer);
      floatCarouselTimers.delete(root);
    }
  }

  function initFloatCarousel(root) {
    if (!root) return;
    stopFloatCarousel(root);
    const existingPanels = Array.from(root.children).filter((item) => item.classList.contains("float-carousel-panel"));
    if (existingPanels.length && existingPanels.length === root.children.length) return;

    const items = Array.from(root.children);
    const groupSize = Math.max(1, Number.parseInt(root.dataset.groupSize || "4", 10) || 4);
    const interval = Math.max(2400, Number.parseInt(root.dataset.interval || "5200", 10) || 5200);
    root.classList.add("float-carousel");

    if (!items.length) {
      root.classList.remove("is-ready");
      return;
    }

    items.forEach((item, index) => {
      item.style.setProperty("--float-slot", String(index % groupSize));
    });

    const panels = [];
    for (let index = 0; index < items.length; index += groupSize) {
      const panel = document.createElement("div");
      panel.className = "float-carousel-panel";
      panel.setAttribute("aria-hidden", panels.length === 0 ? "false" : "true");
      items.slice(index, index + groupSize).forEach((item, slot) => {
        item.style.setProperty("--float-slot", String(slot));
        panel.appendChild(item);
      });
      panels.push(panel);
    }

    panels[0].classList.add("is-active");
    root.replaceChildren(...panels);
    root.classList.add("is-ready");

    if (panels.length <= 1) return;

    let activeIndex = 0;
    const duration = 980;
    const showPanel = () => {
      const nextIndex = (activeIndex + 1) % panels.length;
      const outgoing = panels[activeIndex];
      const incoming = panels[nextIndex];
      outgoing.classList.remove("is-active", "is-entering");
      outgoing.classList.add("is-leaving");
      outgoing.setAttribute("aria-hidden", "true");
      incoming.classList.remove("is-leaving");
      incoming.classList.add("is-active", "is-entering");
      incoming.setAttribute("aria-hidden", "false");
      window.setTimeout(() => {
        outgoing.classList.remove("is-leaving");
        incoming.classList.remove("is-entering");
      }, duration);
      activeIndex = nextIndex;
    };

    const timer = window.setInterval(showPanel, interval);
    floatCarouselTimers.set(root, timer);
  }

  document.querySelectorAll("[data-float-carousel]").forEach(initFloatCarousel);

  const kbDemo = document.querySelector("[data-kb-demo]");

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function isLocalDemoHost() {
    return ["127.0.0.1", "localhost", "::1"].includes(location.hostname);
  }

  const API_BASE = String(window.__PORTFOLIO_API_BASE__ || "").replace(/\/$/, "");
  let liveApiAvailable = isLocalDemoHost() || Boolean(API_BASE);
  const PUBLIC_KB_DEMO = {
    stats: {
      documents: 5745,
      chunks: 19862,
      entities: 95,
      relationships: 858
    },
    results: [
      {
        display_name: "Yuna",
        title: "有娜 / 小有娜",
        snippet: "## 關係網摘要 - 核心關係：雷、凱爾、戀、盾、珍永、文汀、志敏、清源、羅伯特、玉婕。對雷的定位：迷妹、戀慕者、親侍、被雷培養的女武神。這是公開展示用的安全摘要，真 API 會依查詢即時回傳 scored chunks。",
        score: 0.3575,
        source_type: "character",
        timeline_layer: "mixed",
        source_path: "characters/有娜.md",
        heading_path: ["有娜 / 小有娜", "關係網摘要"]
      },
      {
        display_name: "Yuna",
        title: "有娜 / 小有娜",
        snippet: "## 主角性 - 從東北勇者線進入貝奧里德核心圈；她想變強，也想留在雷身邊。角色資料在進入向量庫前已先整理來源、命名、時間線與可公開等級。",
        score: 0.318,
        source_type: "experience",
        timeline_layer: "mixed",
        source_path: "characters/有娜.md",
        heading_path: ["有娜 / 小有娜", "主角性"]
      },
      {
        display_name: "Knowledge Demo",
        title: "公開 API 展示模式",
        snippet: "GitHub Pages 是靜態站，不能直接執行本機 SQLite / vector API。公開頁保留安全回傳範例；面試現場用 localhost 安全鎖會自動切換到真正的 /api/vector/search。",
        score: 1,
        source_type: "documentation",
        timeline_layer: "不適用",
        source_path: "public-demo",
        heading_path: ["Security boundary"]
      }
    ]
  };

  function hasLiveApi() {
    return liveApiAvailable;
  }

  function apiUrl(path) {
    return API_BASE ? API_BASE + path : path;
  }

  function mediaUrl(path) {
    const value = String(path || "");
    if (!value || /^(https?:|data:)/i.test(value)) return value;
    return API_BASE ? API_BASE + value : value;
  }

  async function getJson(url) {
    const response = await fetch(apiUrl(url), {
      headers: { Accept: "application/json" },
      credentials: API_BASE ? "omit" : "same-origin",
      cache: "no-store"
    });
    if (!response.ok) {
      const error = new Error("HTTP " + response.status);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  function renderKbStats(stats) {
    const target = document.querySelector("[data-kb-stats]");
    if (!target) return;
    const items = [
      [stats.documents, "文件"],
      [stats.chunks, "檢索片段"],
      [stats.entities, "角色實體"],
      [stats.relationships, "關係邊"]
    ];
    target.innerHTML = items.map(([value, label]) =>
      '<div class="stat-tile"><strong>' + Number(value || 0).toLocaleString() + '</strong><span>' + label + '</span></div>'
    ).join("");
  }

  function renderKbResults(data) {
    const target = document.querySelector("[data-kb-results]");
    if (!target) return;
    const results = data.results || [];
    if (!results.length) {
      target.innerHTML = '<p class="kb-note">沒有找到符合的安全展示結果。</p>';
      return;
    }
    target.innerHTML = results.map((item) => {
      const heading = (item.heading_path || []).join(" > ") || item.title;
      const typeLabels = {
        character: "人物設定",
        experience: "故事經歷",
        relationship_index: "人物關係",
        image_reference_index: "形象索引",
        prompt: "提示詞",
        translation: "英文譯名",
        conflict: "待確認矛盾",
        project_rule: "專案規則",
        documentation: "文件",
        portfolio_image: "角色圖"
      };
      const timelineLabels = {
        mixed: "混合",
        "不適用": "不適用",
        "真實線": "真實線",
        "命運線": "命運線",
        "待確認": "待確認"
      };
      return '<article class="kb-result">' +
        '<strong>' + escapeText(item.display_name || item.title) + '</strong>' +
        '<p>' + escapeText(item.snippet) + '</p>' +
        '<div class="kb-meta">' +
          '<span>分數 ' + Number(item.score || 0).toFixed(3) + '</span>' +
          '<span>' + escapeText(typeLabels[item.source_type] || item.source_type) + '</span>' +
          '<span>' + escapeText(timelineLabels[item.timeline_layer] || item.timeline_layer) + '</span>' +
          '<span>' + escapeText(item.source_path) + '</span>' +
          '<span>' + escapeText(heading) + '</span>' +
        '</div>' +
        (item.image_url ? '<img class="kb-result-image" src="' + escapeText(mediaUrl(item.image_url)) + '" alt="' + escapeText(item.title) + '" loading="lazy">' : '') +
      '</article>';
    }).join("");
  }

  async function runKbSearch() {
    const form = document.querySelector("[data-kb-search-form]");
    if (!form) return;
    const data = new FormData(form);
    if (!hasLiveApi()) {
      const sourceType = String(data.get("source_type") || "");
      const results = sourceType
        ? PUBLIC_KB_DEMO.results.filter((item) => item.source_type === sourceType)
        : PUBLIC_KB_DEMO.results;
      renderKbResults({ results: results.length ? results : PUBLIC_KB_DEMO.results.slice(-1) });
      return;
    }
    const params = new URLSearchParams();
    params.set("q", String(data.get("q") || "").slice(0, 120));
    params.set("limit", "6");
    const sourceType = String(data.get("source_type") || "");
    if (sourceType) params.set("source_type", sourceType);
    renderKbResults({ results: [] });
    try {
      const payload = await getJson("/api/vector/search?" + params.toString());
      renderKbResults(payload);
    } catch (error) {
      if (API_BASE && (!error || error.status !== 401)) {
        liveApiAvailable = false;
        const state = document.querySelector("[data-kb-api-state]");
        if (state) {
          state.textContent = "遠端 API 暫時關閉，已切回公開展示";
          state.classList.remove("error");
          state.classList.add("ready");
        }
        await runKbSearch();
        return;
      }
      throw error;
    }
  }

  function renderKbImages(payload, selectedCharacter = "") {
    const target = document.querySelector("[data-kb-images]");
    if (!target) return;
    stopFloatCarousel(target);
    const images = (payload.images || []).filter((item) => !selectedCharacter || item.character === selectedCharacter);
    target.classList.add("float-carousel");
    target.dataset.groupSize = target.dataset.groupSize || "4";
    target.dataset.interval = target.dataset.interval || "4800";
    if (!images.length) {
      target.classList.remove("is-ready");
      target.innerHTML = '<p class="kb-note">沒有符合篩選的安全展示角色圖。</p>';
      return;
    }
    target.innerHTML = images.map((item) =>
      '<article class="kb-image-card">' +
        '<img src="' + escapeText(mediaUrl(item.image_url)) + '" alt="' + escapeText((item.display_name || item.character) + " " + item.image_type) + '" loading="lazy">' +
        '<div><strong>' + escapeText(item.display_name || item.character) + '</strong><span>' + escapeText(item.image_type === "face" ? "正臉照" : "形象圖") + '</span><span>' + escapeText(item.title) + '</span></div>' +
      '</article>'
    ).join("");
    initFloatCarousel(target);
  }

  async function initKbDemo() {
    if (!kbDemo) return;
    const state = document.querySelector("[data-kb-api-state]");
    if (!hasLiveApi()) {
      if (state) {
        state.textContent = "公開 API 展示模式";
        state.classList.add("ready");
      }
      renderKbStats(PUBLIC_KB_DEMO.stats);
      await runKbSearch();
      return;
    }
    try {
      const stats = await getJson("/api/vector/stats");
      state.textContent = API_BASE ? "遠端 read-only API 已連線" : "本機 API 已連線";
      state.classList.add("ready");
      renderKbStats(stats);
      await runKbSearch();
      if (!hasLiveApi()) return;
      const images = await getJson("/api/portfolio/images");
      const filter = document.querySelector("[data-kb-character-filter]");
      if (filter) {
        const imageCharacters = Array.from(new Map((images.images || []).map((item) => [item.character, item.display_name || item.character])).entries());
        filter.innerHTML = '<option value="">全部角色</option>' + imageCharacters.map(([name, displayName]) =>
          '<option value="' + escapeText(name) + '">' + escapeText(displayName) + '</option>'
        ).join("");
        filter.addEventListener("change", () => renderKbImages(images, filter.value));
      }
      renderKbImages(images);
    } catch (error) {
      if (API_BASE && (!error || error.status !== 401)) {
        liveApiAvailable = false;
        if (state) {
          state.textContent = "遠端 API 暫時關閉，已切回公開展示";
          state.classList.remove("error");
          state.classList.add("ready");
        }
        renderKbStats(PUBLIC_KB_DEMO.stats);
        await runKbSearch();
        return;
      }
      if (state) {
        state.textContent = error && error.status === 401 ? "安全鎖尚未解鎖" : "請先啟動本機 API";
        state.classList.add("error");
      }
      const results = document.querySelector("[data-kb-results]");
      if (results) results.innerHTML = error && error.status === 401
        ? '<p class="kb-note">安全鎖已啟用，請先輸入 demo key 解鎖。</p>'
        : '<p class="kb-note">本機 API 尚未啟動。請先啟動安全鎖本機 demo 伺服器。</p>';
    }
  }

  document.querySelector("[data-kb-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runKbSearch().catch(() => {});
  });

  initKbDemo();

  window.addEventListener("keydown", (event) => {
    if (event.key === "/" && search && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
  });
})();
