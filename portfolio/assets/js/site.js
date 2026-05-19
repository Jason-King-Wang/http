
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

  async function getJson(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
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
        (item.image_url ? '<img class="kb-result-image" src="' + escapeText(item.image_url) + '" alt="' + escapeText(item.title) + '" loading="lazy">' : '') +
      '</article>';
    }).join("");
  }

  async function runKbSearch() {
    const form = document.querySelector("[data-kb-search-form]");
    if (!form) return;
    if (!isLocalDemoHost()) {
      renderKbResults({
        results: [{
          display_name: "公開展示版",
          title: "公開展示版",
          snippet: "GitHub Pages 只發布作品集與安全摘要，不連接本機角色向量資料庫。面試現場可用 localhost 安全鎖開啟 live demo。",
          score: 1,
          source_type: "documentation",
          timeline_layer: "不適用",
          source_path: "public-demo",
          heading_path: ["Security boundary"]
        }]
      });
      return;
    }
    const data = new FormData(form);
    const params = new URLSearchParams();
    params.set("q", String(data.get("q") || "").slice(0, 120));
    params.set("limit", "6");
    const sourceType = String(data.get("source_type") || "");
    if (sourceType) params.set("source_type", sourceType);
    renderKbResults({ results: [] });
    const payload = await getJson("/api/vector/search?" + params.toString());
    renderKbResults(payload);
  }

  function renderKbImages(payload, selectedCharacter = "") {
    const target = document.querySelector("[data-kb-images]");
    if (!target) return;
    const images = (payload.images || []).filter((item) => !selectedCharacter || item.character === selectedCharacter);
    target.innerHTML = images.map((item) =>
      '<article class="kb-image-card">' +
        '<img src="' + escapeText(item.image_url) + '" alt="' + escapeText((item.display_name || item.character) + " " + item.image_type) + '" loading="lazy">' +
        '<div><strong>' + escapeText(item.display_name || item.character) + '</strong><span>' + escapeText(item.image_type === "face" ? "正臉照" : "形象圖") + '</span><span>' + escapeText(item.title) + '</span></div>' +
      '</article>'
    ).join("");
  }

  async function initKbDemo() {
    if (!kbDemo) return;
    const state = document.querySelector("[data-kb-api-state]");
    if (!isLocalDemoHost()) {
      if (state) {
        state.textContent = "公開版不連接本機 API";
        state.classList.add("ready");
      }
      renderKbStats({ documents: 0, chunks: 0, entities: 0, relationships: 0 });
      await runKbSearch();
      return;
    }
    try {
      const stats = await getJson("/api/vector/stats");
      state.textContent = "本機 API 已連線";
      state.classList.add("ready");
      renderKbStats(stats);
      await runKbSearch();
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
      if (state) {
        state.textContent = error && error.status === 401 ? "安全鎖尚未解鎖" : "請先啟動本機 API";
        state.classList.add("error");
      }
      const results = document.querySelector("[data-kb-results]");
      if (results) results.innerHTML = error && error.status === 401
        ? '<p class="kb-note">安全鎖已啟用，請先輸入 demo key 解鎖。</p>'
        : '<p class="kb-note">公開版不連接本機向量 API；面試現場使用安全鎖本機 demo。</p>';
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
