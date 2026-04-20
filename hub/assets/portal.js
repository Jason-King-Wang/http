async function fetchPortalManifest() {
  if (window.__PORTAL_MANIFEST__) {
    return window.__PORTAL_MANIFEST__;
  }
  try {
    const response = await fetch("./data/portal-manifest.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Manifest request failed: ${response.status}`);
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function formatPct(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "無資料";
  }
  return `${(number * 100).toFixed(2)}%`;
}

function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "無資料";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function renderPortalHome(manifest) {
  const meta = document.querySelector("#portal-meta");
  const sell = manifest?.sell_model || {};
  const auto = manifest?.auto_trading || {};
  const status = [
    `賣價模型 ${sell.target_trade_date || "無資料"}`,
    `自動交易 ${auto.trade_date || "無資料"}`,
    `更新時間 ${manifest?.generated_at || "無資料"}`
  ];
  if (meta) {
    meta.innerHTML = status.map((item) => `<span class="pill">${item}</span>`).join("");
  }

  const sellMetrics = document.querySelector("#sell-model-metrics");
  if (sellMetrics) {
    sellMetrics.innerHTML = [
      ["目標交易日", sell.target_trade_date || "無資料"],
      ["驗證股票數", sell.verified_stock_count ?? "無資料"],
      ["高點命中率", formatPct(sell.peak_hit_rate)],
      ["資料範圍", sell.source_scope || "public"]
    ]
      .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
      .join("");
  }

  const autoMetrics = document.querySelector("#auto-trading-metrics");
  if (autoMetrics) {
    autoMetrics.innerHTML = [
      ["交易日", auto.trade_date || "無資料"],
      ["今日狀態", auto.today_status || "無資料"],
      ["策略報酬", formatPct(auto.strategy_return)],
      ["目前權益", formatMoney(auto.current_equity)]
    ]
      .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
      .join("");
  }

  const deployState = document.querySelector("#deploy-state");
  if (deployState) {
    deployState.textContent =
      "這個站台已經 external-ready，接上 git repo 與託管目標後才會變成公開網址。";
  }
}

function wireAutoTradingFrame(manifest) {
  const data = manifest?.auto_trading || {};
  const frame = document.querySelector("#auto-trading-frame");
  const currentButton = document.querySelector("#link-current");
  const dailyButton = document.querySelector("#link-daily");
  const weeklyButton = document.querySelector("#link-weekly");
  const meta = document.querySelector("#auto-page-meta");

  if (!frame || !currentButton || !dailyButton || !weeklyButton || !meta) {
    return;
  }

  const currentPath = "../auto-trading-embed/current.html";
  const dailyPath = data.latest_daily_html ? `../auto-trading-embed/daily/${data.latest_daily_html}` : currentPath;
  const weeklyPath = data.latest_weekly_html ? `../auto-trading-embed/weeks/${data.latest_weekly_html}` : currentPath;

  frame.src = currentPath;
  currentButton.href = currentPath;
  dailyButton.href = dailyPath;
  weeklyButton.href = weeklyPath;

  currentButton.addEventListener("click", (event) => {
    event.preventDefault();
    frame.src = currentPath;
  });
  dailyButton.addEventListener("click", (event) => {
    event.preventDefault();
    frame.src = dailyPath;
  });
  weeklyButton.addEventListener("click", (event) => {
    event.preventDefault();
    frame.src = weeklyPath;
  });

  meta.innerHTML = [
    `交易日 ${data.trade_date || "無資料"}`,
    `模式 ${data.mode || "無資料"}`,
    `狀態 ${data.today_status || "無資料"}`,
    `來源 ${data.provider_name || "無資料"}`
  ]
    .map((item) => `<span class="pill">${item}</span>`)
    .join("");
}

async function bootstrapPortal() {
  const manifest = await fetchPortalManifest();
  if (document.body.dataset.page === "portal-home") {
    renderPortalHome(manifest);
  }
  if (document.body.dataset.page === "auto-trading-wrapper") {
    wireAutoTradingFrame(manifest);
  }
}

bootstrapPortal();
