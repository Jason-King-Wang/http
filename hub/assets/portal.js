async function fetchPortalManifest() {
  if (window.__PORTAL_MANIFEST__) {
    return window.__PORTAL_MANIFEST__;
  }

  const basePath = document.body.dataset.page === "portal-home" ? "./" : "../";
  try {
    const response = await fetch(`${basePath}data/portal-manifest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Manifest request failed: ${response.status}`);
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}

async function fetchAbDailyData() {
  if (window.__PUBLIC_AB_DAILY_DATA__) {
    return window.__PUBLIC_AB_DAILY_DATA__;
  }

  const basePath = document.body.dataset.page === "portal-home" ? "./" : "../";
  try {
    const response = await fetch(`${basePath}sell-model-embed/data/public-ab-daily.json?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`AB daily request failed: ${response.status}`);
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function fallbackText(value) {
  return value === undefined || value === null || value === "" ? "--" : value;
}

function asNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function formatPct(value) {
  const number = asNumber(value);
  return number === null ? "--" : `${(number * 100).toFixed(2)}%`;
}

function formatPctPoints(value) {
  const number = asNumber(value);
  return number === null ? "--" : `${number.toFixed(2)}%`;
}

function formatSignedPctPoints(value) {
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatMoney(value) {
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatSignedMoney(value) {
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${Math.round(number).toLocaleString("zh-TW")}`;
}

function formatNumber(value) {
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatSignedNumber(value) {
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const ab = manifest?.ab_daily || {};
  const auto = manifest?.auto_trading || {};

  if (meta) {
    meta.innerHTML = [
      `每日 AB 日期 ${fallbackText(ab.trade_date)}`,
      `賣價模型日期 ${fallbackText(sell.target_trade_date)}`,
      `自動交易日期 ${fallbackText(auto.trade_date)}`,
      `最後同步 ${fallbackText(manifest?.generated_at)}`,
    ]
      .map((item) => `<span class="pill">${item}</span>`)
      .join("");
  }

  renderMetricCards(document.querySelector("#ab-daily-metrics"), [
    ["交易日", ab.trade_date],
    ["版本", ab.phase_label],
    ["A 預選", ab.a_count],
    ["B 預選", ab.b_count],
  ]);

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

function renderSelectionTag(tag) {
  const normalized = String(tag || "").trim().toUpperCase();
  if (!normalized) {
    return '<span class="tag-chip tag-chip-empty">-</span>';
  }
  return `<span class="tag-chip tag-chip-${normalized.toLowerCase()}">${escapeHtml(normalized)}</span>`;
}

function rowsForPool(entry, pool) {
  const rows = Array.isArray(entry?.rows) ? entry.rows : [];
  const flag = pool === "a" ? "a_flag" : "b_flag";
  return rows.filter((row) => Number(row?.[flag]) === 1);
}

function summarizePool(rows) {
  let totalCost = 0;
  let totalValue = 0;
  let completeRows = 0;

  rows.forEach((row) => {
    const open = asNumber(row.open_price);
    const close = asNumber(row.close_price);
    if (open === null) {
      return;
    }
    totalCost += open * 1000;
    if (close === null) {
      return;
    }
    totalValue += close * 1000;
    completeRows += 1;
  });

  if (!rows.length || completeRows !== rows.length || !totalCost) {
    return {
      cost: null,
      value: null,
      pnl: null,
      returnPct: null,
    };
  }

  const pnl = totalValue - totalCost;
  return {
    cost: totalCost,
    value: totalValue,
    pnl,
    returnPct: (pnl / totalCost) * 100,
  };
}

function reasonForPool(row, pool) {
  return pool === "a" ? row.a_reason || "" : row.b_reason || "";
}

function renderAbRow(row, pool) {
  return `
    <tr>
      <td>${escapeHtml(row.stock_id)}</td>
      <td>${escapeHtml(row.stock_name)}</td>
      <td>${renderSelectionTag(row.selection_tag)}</td>
      <td>${escapeHtml(row.theme || "--")}</td>
      <td>${escapeHtml(formatNumber(row.open_price))}</td>
      <td>${escapeHtml(formatNumber(row.close_price))}</td>
      <td>${escapeHtml(formatSignedPctPoints(row.change_pct))}</td>
      <td>${escapeHtml(formatSignedNumber(row.change_amount))}</td>
      <td>${escapeHtml(formatSignedMoney(row.lot_pnl_twd))}</td>
      <td class="reason-cell">${escapeHtml(reasonForPool(row, pool) || "--")}</td>
    </tr>
  `;
}

function renderPoolTable(title, pool, rows) {
  const summary = summarizePool(rows);
  const body = rows.length
    ? rows.map((row) => renderAbRow(row, pool)).join("")
    : '<tr><td class="empty-cell" colspan="10">這一池目前沒有預選股。</td></tr>';

  return `
    <article class="pool-card pool-card-${pool}">
      <div class="pool-head">
        <div>
          <p class="eyebrow">${pool === "a" ? "A Preselect" : "B Preselect"}</p>
          <h3>${title}</h3>
        </div>
        <div class="pill-row compact-pills">
          <span class="pill">${rows.length} 檔</span>
          <span class="pill">各買一張 ${formatSignedPctPoints(summary.returnPct)}</span>
          <span class="pill">損益 ${formatSignedMoney(summary.pnl)}</span>
        </div>
      </div>
      <div class="table-wrap">
        <table class="ab-history-table">
          <thead>
            <tr>
              <th>股號</th>
              <th>股名</th>
              <th>重疊</th>
              <th>主題</th>
              <th>開盤價</th>
              <th>收盤價</th>
              <th>漲跌幅%</th>
              <th>漲跌實際</th>
              <th>一張損益</th>
              <th>LLM 理由</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </article>
  `;
}

function buildAbPills(entry) {
  return [
    `交易日 ${fallbackText(entry.trade_date)}`,
    `${fallbackText(entry.phase_label)}`,
    `A 預選 ${fallbackText(entry.a_count)}`,
    `B 預選 ${fallbackText(entry.b_count)}`,
    `重疊 ${fallbackText(entry.ab_count)}`,
  ];
}

function renderPoolGrid(entry) {
  const aRows = rowsForPool(entry, "a");
  const bRows = rowsForPool(entry, "b");
  return [
    renderPoolTable("A 預選", "a", aRows),
    renderPoolTable("B 預選", "b", bRows),
  ].join("");
}

function renderAbDailyPage(payload) {
  const latest = payload?.latest || {};
  const history = Array.isArray(payload?.history) ? payload.history : [];
  const latestPools = document.querySelector("#ab-latest-pools");
  const latestSummary = document.querySelector("#ab-latest-summary");
  const latestPills = document.querySelector("#ab-latest-pills");
  const historyList = document.querySelector("#ab-history-list");
  const pageMeta = document.querySelector("#ab-page-meta");

  if (!latestPools || !latestSummary || !latestPills || !historyList || !pageMeta) {
    return;
  }

  if (!history.length) {
    pageMeta.innerHTML = '<span class="pill">目前沒有資料</span>';
    latestSummary.textContent = "目前還沒有每日版本的 A/B 預選資料。";
    latestPills.innerHTML = "";
    latestPools.innerHTML = "";
    historyList.innerHTML = '<div class="empty-state">目前還沒有歷史資料。</div>';
    return;
  }

  const sourceLabel = latest.rows?.some((row) => row.preselect_source === "llm_rules_preselect")
    ? "LLM 規則預選"
    : "候選檔 flag 備援";

  pageMeta.innerHTML = [
    `最後同步 ${fallbackText(payload.generated_at)}`,
    `最新交易日 ${fallbackText(latest.trade_date)}`,
    `${fallbackText(latest.phase_label)}`,
    sourceLabel,
  ]
    .map((item) => `<span class="pill">${item}</span>`)
    .join("");

  latestSummary.textContent =
    `${latest.trade_date} 的 ${latest.phase_label} 已更新。這版只保留 A 預選與 B 預選兩池，不收斂成 AB 定版。`;

  latestPills.innerHTML = buildAbPills(latest)
    .map((item) => `<span class="pill">${item}</span>`)
    .join("");

  latestPools.innerHTML = renderPoolGrid(latest);

  historyList.innerHTML = history
    .map(
      (entry, index) => `
        <article class="history-card ${index === 0 ? "is-latest" : ""}">
          <div class="history-head">
            <div>
              <p class="eyebrow">History</p>
              <h3>${escapeHtml(entry.trade_date || "--")} ${escapeHtml(entry.phase_label || "")}</h3>
            </div>
            <div class="pill-row compact-pills">
              ${buildAbPills(entry)
                .map((item) => `<span class="pill">${item}</span>`)
                .join("")}
            </div>
          </div>
          <div class="pool-grid">${renderPoolGrid(entry)}</div>
        </article>
      `
    )
    .join("");
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

  if (document.body.dataset.page === "ab-daily-wrapper") {
    const abDaily = await fetchAbDailyData();
    renderAbDailyPage(abDaily);
  }

  if (document.body.dataset.page === "auto-trading-wrapper") {
    wireAutoTradingFrame(manifest);
  }
}

bootstrapPortal();
