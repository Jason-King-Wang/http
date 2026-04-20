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

function fallbackText(value) {
  return value === undefined || value === null || value === "" ? "--" : value;
}

function formatPct(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "--";
  }
  return `${(number * 100).toFixed(2)}%`;
}

function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "--";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function renderMetricCards(target, rows) {
  if (!target) {
    return;
  }

  target.innerHTML = rows
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${fallbackText(value)}</strong></article>`)
    .join("");
}

function renderPortalHome(manifest) {
  const meta = document.querySelector("#portal-meta");
  const sell = manifest?.sell_model || {};
  const auto = manifest?.auto_trading || {};

  if (meta) {
    meta.innerHTML = [
      `賣價模型日期 ${fallbackText(sell.target_trade_date)}`,
      `自動交易日期 ${fallbackText(auto.trade_date)}`,
      `最後同步 ${fallbackText(manifest?.generated_at)}`,
    ]
      .map((item) => `<span class="pill">${item}</span>`)
      .join("");
  }

  renderMetricCards(document.querySelector("#sell-model-metrics"), [
    ["目標交易日", sell.target_trade_date],
    ["驗證股票數", sell.verified_stock_count],
    ["Peak 命中率", formatPct(sell.peak_hit_rate)],
    ["資料範圍", sell.source_scope || "public"],
  ]);

  renderMetricCards(document.querySelector("#auto-trading-metrics"), [
    ["交易日", auto.trade_date],
    ["今日狀態", auto.today_status],
    ["策略報酬率", formatPct(auto.strategy_return)],
    ["目前權益", formatMoney(auto.current_equity)],
  ]);

  const deployState = document.querySelector("#deploy-state");
  if (deployState) {
    deployState.textContent =
      manifest?.deployment_note ||
      "公開入口站已上線，並掛在 Sell Model 的同一條發布鏈下。";
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
    `交易日 ${fallbackText(data.trade_date)}`,
    `模式 ${fallbackText(data.mode)}`,
    `狀態 ${fallbackText(data.today_status)}`,
    `資料來源 ${fallbackText(data.provider_name)}`,
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
