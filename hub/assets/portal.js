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

async function fetchShortTermRadarData() {
  if (window.__SHORT_TERM_RADAR_DATA__) {
    return window.__SHORT_TERM_RADAR_DATA__;
  }

  const basePath = document.body.dataset.page === "portal-home" ? "./" : "../";
  try {
    const response = await fetch(`${basePath}data/short-term-radar-snapshot.json?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Short term radar request failed: ${response.status}`);
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function fallbackText(value) {
  return value === undefined || value === null || value === "" ? "--" : value;
}

function isNA(value) {
  return String(value ?? "").trim().toUpperCase() === "NA";
}

function asNumber(value) {
  if (isNA(value)) {
    return null;
  }
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function formatPct(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  return number === null ? "--" : `${(number * 100).toFixed(2)}%`;
}

function formatPctPoints(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  return number === null ? "--" : `${number.toFixed(2)}%`;
}

function formatSignedPctPoints(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatMoney(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatSignedMoney(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${Math.round(number).toLocaleString("zh-TW")}`;
}

function formatNumber(value) {
  if (isNA(value)) {
    return "NA";
  }
  const number = asNumber(value);
  if (number === null) {
    return "--";
  }
  return number.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatSignedNumber(value) {
  if (isNA(value)) {
    return "NA";
  }
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

function asBool(value) {
  if (value === true || value === 1) {
    return true;
  }
  return String(value ?? "").trim().toLowerCase() === "true";
}

function rotationActionLabel(action) {
  const normalized = String(action || "").trim();
  const labels = {
    no_action: "照原 AB",
    confirm_required: "不切，只提高確認門檻",
    hard_change_required: "不要無腦照原 AB，人工風控確認",
    clean_rotation_candidate: "可考慮切 receiver side，但仍需人工確認",
    anti_kill_suppressed: "反殺週優先",
    not_applied_non_monday: "今日不套用，週參考",
  };
  return labels[normalized] || normalized || "--";
}

function rotationConclusionText(entry) {
  const explicit = String(entry?.rotation_daily_conclusion_text || "").trim();
  if (explicit) {
    return explicit;
  }
  const conclusion = String(entry?.rotation_daily_conclusion || "").trim();
  if (conclusion) {
    return rotationActionLabel(conclusion);
  }
  const regime = String(entry?.weekly_rotation_regime_reference || entry?.final_rotation_regime || "").trim();
  const action = String(entry?.rotation_shadow_action || "").trim();
  if (regime === "clean_a_to_b_rotation" || regime === "clean_b_to_a_rotation") {
    return rotationActionLabel("clean_rotation_candidate");
  }
  if (regime === "anti_kill_week_suppressed" || action === "anti_kill_suppressed") {
    return rotationActionLabel("anti_kill_suppressed");
  }
  return rotationActionLabel(action || "no_action");
}

function rotationStatusClass(entry) {
  const action = String(entry?.rotation_shadow_action || "").trim();
  if (action === "hard_change_required") {
    return "rotation-hard";
  }
  if (action === "confirm_required") {
    return "rotation-confirm";
  }
  if (action === "not_applied_non_monday") {
    return "rotation-reference";
  }
  if (action === "anti_kill_suppressed") {
    return "rotation-suppressed";
  }
  return "rotation-neutral";
}

function rotationAppliedToDaily(entry) {
  return asBool(entry?.rotation_applied_to_daily_preselect) || asBool(entry?.rotation_applied_to_daily_finalize);
}

function rotationCompactText(entry) {
  const conclusion = rotationConclusionText(entry);
  if (!conclusion || conclusion === "--") {
    return "";
  }
  const action = String(entry?.rotation_shadow_action || "").trim();
  if (action === "not_applied_non_monday") {
    const weekly = entry?.weekly_rotation_regime_reference || "--";
    return `輪動結論: ${conclusion}；週參考 ${weekly}`;
  }
  return `輪動結論: ${conclusion}`;
}

function renderRotationStatusBand(entry) {
  const action = String(entry?.rotation_shadow_action || "").trim();
  const weeklyRegime = entry?.weekly_rotation_regime_reference || "";
  if (!action && !weeklyRegime) {
    return "";
  }

  const applied = rotationAppliedToDaily(entry);
  const headline = applied ? "AB 快速輪動 shadow 已套用到今日 AB" : "AB 快速輪動本日未套用";
  const conclusion = rotationConclusionText(entry);
  const note = entry?.rotation_mode_switch_note || (
    applied
      ? "今日為週一，ROT-PRE / ROT-FIN shadow 欄位已顯示在每日 AB。"
      : "今日非週一；weekly rotation regime 只作參考，不切換今日 AB 預選 / 定版。"
  );
  const details = [
    ["daily_trade_date", entry?.daily_trade_date || entry?.trade_date],
    ["daily_weekday", entry?.daily_weekday],
    ["target_trade_date", entry?.source_target_trade_date || entry?.rotation_effective_trade_date],
    ["target_weekday", entry?.rotation_effective_weekday],
    ["rotation_daily_conclusion", conclusion],
    ["rotation_shadow_action", rotationActionLabel(action)],
    ["weekly_reference", weeklyRegime],
    ["week_monday", entry?.rotation_trade_week_monday],
    ["cutoff_date", entry?.rotation_cutoff_date],
    ["execution_status", entry?.actual_execution_status],
  ];

  return `
    <section class="rotation-status-band ${rotationStatusClass(entry)}">
      <div class="rotation-status-head">
        <div>
          <p class="eyebrow">Rotation Shadow</p>
          <h3>${escapeHtml(headline)}</h3>
        </div>
        <span class="rotation-status-badge">${escapeHtml(rotationActionLabel(action))}</span>
      </div>
      <p class="rotation-note"><strong>${escapeHtml(conclusion)}</strong></p>
      <p class="rotation-note">${escapeHtml(note)}</p>
      <div class="rotation-status-grid">
        ${details
          .map(
            ([label, value]) => `
              <div class="rotation-status-item">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(fallbackText(value))}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMetricCards(target, rows) {
  if (!target) {
    return;
  }

  target.innerHTML = rows
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${fallbackText(value)}</strong></article>`)
    .join("");
}

function formatScore(value) {
  const number = asNumber(value);
  return number === null ? "--" : number.toFixed(1);
}

function formatCompactDateTime(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "--";
  }
  return text.replace("T", " ");
}

function modeLabel(mode) {
  const labels = {
    full_short_term_radar: "完整短線雷達",
  };
  return labels[mode] || mode || "--";
}

function stageLabel(stage) {
  const labels = {
    S1: "初篩觀察",
    S2: "進階觀察",
    S3: "高強度觀察",
  };
  return labels[stage] || stage || "--";
}

function entryZoneLabel(zone) {
  const labels = {
    early_watch: "早期觀察",
    watch_only: "觀察中",
    confirm_required: "需自行確認",
  };
  return labels[zone] || zone || "--";
}

function freshnessLabel(value) {
  const labels = {
    fresh: "新鮮",
    partial: "部分更新",
    stale: "待更新",
    historical: "歷史資料",
    source_missing: "來源缺口",
  };
  return labels[value] || value || "--";
}

function freshnessClass(value) {
  const normalized = String(value || "unknown").replaceAll("_", "-");
  return `radar-status-${normalized}`;
}

function radarRiskText(candidate) {
  const flags = Array.isArray(candidate?.riskFlags) ? candidate.riskFlags.filter(Boolean) : [];
  return flags.length ? flags.join("、") : "未標記";
}

function renderStatusBadge(label, className = "") {
  return `<span class="radar-status-badge ${className}">${escapeHtml(label)}</span>`;
}

function renderPortalHome(manifest, radar) {
  const meta = document.querySelector("#portal-meta");
  const sell = manifest?.sell_model || {};
  const ab = manifest?.ab_daily || {};
  const auto = manifest?.auto_trading || {};
  const radarSummary = radar?.summary || {};

  if (meta) {
    meta.innerHTML = [
      `每日 AB 日期 ${fallbackText(ab.trade_date)}`,
      `賣價模型日期 ${fallbackText(sell.target_trade_date)}`,
      `短線雷達日期 ${fallbackText(radar?.asOfDate)}`,
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

  renderMetricCards(document.querySelector("#short-term-radar-metrics"), [
    ["掃描日", radar?.asOfDate],
    ["候選清單", radarSummary.totalCandidates],
    ["早期觀察", radarSummary.entryZoneCounts?.early_watch],
    ["平均覆蓋", formatPct(radarSummary.averageScoreCoverage)],
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

function summarizePool(rows, baseline = "open") {
  let totalCost = 0;
  let totalValue = 0;
  let completeRows = 0;

  rows.forEach((row) => {
    const entry = baseline === "week" ? asNumber(row.week_entry_price) : asNumber(row.open_price);
    const current = baseline === "week"
      ? asNumber(row.close_price) ?? asNumber(row.open_price)
      : asNumber(row.close_price);
    if (entry === null) {
      return;
    }
    totalCost += entry * 1000;
    if (current === null) {
      return;
    }
    totalValue += current * 1000;
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
      <td>${escapeHtml(formatNumber(row.week_entry_price))}</td>
      <td>${escapeHtml(formatSignedPctPoints(row.week_entry_return_pct))}</td>
      <td>${escapeHtml(formatSignedMoney(row.week_entry_pnl_twd))}</td>
      <td>${escapeHtml(formatNumber(row.open_price))}</td>
      <td>${escapeHtml(formatNumber(row.close_price))}</td>
      <td>${escapeHtml(formatSignedPctPoints(row.change_pct))}</td>
      <td>${escapeHtml(formatSignedNumber(row.change_amount))}</td>
      <td>${escapeHtml(formatSignedMoney(row.lot_pnl_twd))}</td>
      <td class="reason-cell">${escapeHtml(reasonForPool(row, pool) || "--")}</td>
    </tr>
  `;
}

function renderPoolTable(title, pool, rows, options = {}) {
  const nonTradingSelectionDay = options.nonTradingSelectionDay === true;
  const summary = summarizePool(rows);
  const weekSummary = summarizePool(rows, "week");
  const body = rows.length
    ? rows.map((row) => renderAbRow(row, pool)).join("")
    : '<tr><td class="empty-cell" colspan="13">這一池目前沒有預選股。</td></tr>';
  const summaryReturnText = nonTradingSelectionDay ? "NA" : formatSignedPctPoints(summary.returnPct);
  const summaryPnlText = nonTradingSelectionDay ? "NA" : formatSignedMoney(summary.pnl);
  const weekReturnText = nonTradingSelectionDay ? "NA" : formatSignedPctPoints(weekSummary.returnPct);
  const weekPnlText = nonTradingSelectionDay ? "NA" : formatSignedMoney(weekSummary.pnl);

  return `
    <article class="pool-card pool-card-${pool}">
      <div class="pool-head">
        <div>
          <p class="eyebrow">${pool === "a" ? "A Preselect" : "B Preselect"}</p>
          <h3>${title}</h3>
        </div>
        <div class="pill-row compact-pills">
          <span class="pill">${rows.length} 檔</span>
          <span class="pill">各買一張 ${summaryReturnText}</span>
          <span class="pill">損益 ${summaryPnlText}</span>
          <span class="pill">周一9.10分買的話 ${weekReturnText}</span>
          <span class="pill">損益 ${weekPnlText}</span>
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
              <th>周一9:10價</th>
              <th>周一9.10分買的話%</th>
              <th>周一9.10損益</th>
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
  if (isAbSourceMissing(entry)) {
    return [
      `交易日 ${fallbackText(entry.trade_date)}`,
      `${fallbackText(entry.phase_label)}`,
      "AB 預選來源缺失",
      "未沿用舊資料",
    ];
  }

  const poolHealthLabel = entry?.candidate_pool_health_label || (
    entry?.external_scan_status === "completed" ? "選池正常" : entry?.external_scan_status
  );
  const pills = [
    `交易日 ${fallbackText(entry.trade_date)}`,
    `${fallbackText(entry.phase_label)}`,
    `選池 ${fallbackText(poolHealthLabel)}`,
    `A 預選 ${fallbackText(entry.a_count)}`,
    `B 預選 ${fallbackText(entry.b_count)}`,
    `重疊 ${fallbackText(entry.ab_count)}`,
  ];
  if (entry?.rotation_shadow_action) {
    pills.push(`輪動 ${rotationConclusionText(entry)}`);
  }
  if (entry?.weekly_rotation_regime_reference) {
    pills.push(`週參考 ${entry.weekly_rotation_regime_reference}`);
  }
  return pills;
}

function renderPoolGrid(entry) {
  if (isAbSourceMissing(entry)) {
    return renderSourceMissingPanel(entry);
  }

  const aRows = rowsForPool(entry, "a");
  const bRows = rowsForPool(entry, "b");
  return [
    renderPoolTable("A 預選", "a", aRows, { nonTradingSelectionDay: entry?.non_trading_selection_day === true }),
    renderPoolTable("B 預選", "b", bRows, { nonTradingSelectionDay: entry?.non_trading_selection_day === true }),
  ].join("");
}

function getAbRows(entry) {
  return Array.isArray(entry?.rows) ? entry.rows : [];
}

function isAbSourceMissing(entry) {
  return entry?.source_missing === true || String(entry?.source_status || "").trim() === "missing_preselect";
}

function sourceMissingText(entry) {
  return entry?.source_missing_message || `${fallbackText(entry?.trade_date)} 的 AB LLM 預選來源尚未產生；公開頁先顯示缺口，不沿用舊資料。`;
}

function renderSourceMissingPanel(entry) {
  const expectedPath = String(entry?.source_missing_expected_json || "").trim();
  return `
    <article class="source-missing-card">
      <div>
        <p class="eyebrow">Source Missing</p>
        <h3>${escapeHtml(entry?.trade_date || "--")} AB 預選來源缺失</h3>
        <p>${escapeHtml(sourceMissingText(entry))}</p>
      </div>
      ${expectedPath ? `<code>${escapeHtml(expectedPath)}</code>` : ""}
    </article>
  `;
}

function renderAbStockText(rows) {
  if (!rows.length) {
    return "-";
  }

  const codes = rows
    .map((row) => row.stock_id || row.stock_name)
    .filter(Boolean);
  const visible = codes.slice(0, 5).join(" ");
  const more = codes.length > 5 ? ` +${codes.length - 5}` : "";

  return `${visible}${more}`;
}

function renderAbStockList(rows, label) {
  return `
    <div class="ab-stock-list">
      <div class="ab-stock-head">
        <span class="tag-chip tag-chip-${label.toLowerCase()}">${escapeHtml(label)}</span>
        <span class="ab-stock-count">${escapeHtml(formatNumber(rows.length))} 檔</span>
      </div>
      <span class="ab-stock-codes">${escapeHtml(renderAbStockText(rows))}</span>
    </div>
  `;
}

function toneForSignedNumber(value) {
  const number = asNumber(value);
  if (number === null || Math.abs(number) < 0.0001) {
    return "trend-flat";
  }
  return number > 0 ? "trend-positive" : "trend-negative";
}

function renderAbMetricStack(summary, options = {}) {
  const nonTradingSelectionDay = options.nonTradingSelectionDay === true;
  const returnText = nonTradingSelectionDay ? "NA" : formatSignedPctPoints(summary?.returnPct);
  const pnlText = nonTradingSelectionDay ? "NA" : formatSignedMoney(summary?.pnl);
  const tone = nonTradingSelectionDay ? "trend-flat" : toneForSignedNumber(summary?.pnl);

  return `
    <div class="ab-metric-stack">
      <strong class="${tone}">${escapeHtml(returnText)}</strong>
      <span class="metric-sub">損益 ${escapeHtml(pnlText)}</span>
    </div>
  `;
}

function buildAbAllSummary(entry, baseline = "open") {
  const summary = summarizePool(getAbRows(entry), baseline);

  if (baseline === "open") {
    const returnPct = asNumber(entry?.equal_lot_return_pct);
    const pnl = asNumber(entry?.equal_lot_pnl_twd);
    if (returnPct !== null) {
      summary.returnPct = returnPct;
    }
    if (pnl !== null) {
      summary.pnl = pnl;
    }
  }

  return summary;
}

function renderAbDailyHistoryRow(entry, isLatest) {
  if (isAbSourceMissing(entry)) {
    return `
      <tr class="${isLatest ? "is-latest" : ""} source-missing-row">
        <td>
          <div class="stacked">
            <strong>${escapeHtml(entry.trade_date || "--")}</strong>
            <span class="metric-sub">${escapeHtml(entry.phase_label || "來源缺失")}</span>
          </div>
        </td>
        <td colspan="8">
          <div class="source-missing-inline">
            <strong>AB 預選來源缺失</strong>
            <span>${escapeHtml(sourceMissingText(entry))}</span>
          </div>
        </td>
      </tr>
    `;
  }

  const aRows = rowsForPool(entry, "a");
  const bRows = rowsForPool(entry, "b");
  const nonTradingSelectionDay = entry?.non_trading_selection_day === true;

  return `
    <tr class="${isLatest ? "is-latest" : ""}">
      <td>
        <div class="stacked">
          <strong>${escapeHtml(entry.trade_date || "--")}</strong>
          <span class="metric-sub">${escapeHtml(entry.phase_label || entry.phase || "--")}</span>
          <span class="metric-sub">${escapeHtml(rotationCompactText(entry))}</span>
        </div>
      </td>
      <td>${renderAbStockList(aRows, "A")}</td>
      <td>${renderAbMetricStack(summarizePool(aRows), { nonTradingSelectionDay })}</td>
      <td>${renderAbMetricStack(summarizePool(aRows, "week"), { nonTradingSelectionDay })}</td>
      <td>${renderAbStockList(bRows, "B")}</td>
      <td>${renderAbMetricStack(summarizePool(bRows), { nonTradingSelectionDay })}</td>
      <td>${renderAbMetricStack(summarizePool(bRows, "week"), { nonTradingSelectionDay })}</td>
      <td>${renderAbMetricStack(buildAbAllSummary(entry), { nonTradingSelectionDay })}</td>
      <td>${renderAbMetricStack(buildAbAllSummary(entry, "week"), { nonTradingSelectionDay })}</td>
    </tr>
  `;
}

function renderAbDailyHistorySummaryTable(history) {
  if (!history.length) {
    return '<div class="empty-state">目前還沒有歷史資料。</div>';
  }

  return `
    <div class="ab-history-summary-head">
      <strong>每日 A/B 摘要表</strong>
      <span class="mini-note">每天只看 A 預選、B 預選、各買一張與週一 9:10 兩組損益。</span>
    </div>
    <div class="table-wrap ab-history-table-wrap">
      <table class="ab-history-table ab-history-summary-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>A 預選</th>
            <th>A 各買一張</th>
            <th>A 週一 9:10</th>
            <th>B 預選</th>
            <th>B 各買一張</th>
            <th>B 週一 9:10</th>
            <th>全部各買一張</th>
            <th>全部週一 9:10</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((entry, index) => renderAbDailyHistoryRow(entry, index === 0)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function hasVisibleAbRows(entry) {
  return isAbSourceMissing(entry) || (Array.isArray(entry?.rows) && entry.rows.length > 0);
}

function renderHistoryToggleButton() {
  return `
    <button class="history-toggle" type="button" data-history-toggle aria-expanded="true">
      收起
    </button>
  `;
}

function syncHistoryCardToggle(card, collapsed) {
  const button = card?.querySelector("[data-history-toggle]");
  if (!button) {
    return;
  }

  button.textContent = collapsed ? "展開" : "收起";
  button.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function wireAbHistoryToggles(historyList) {
  if (!historyList || historyList.dataset.toggleBound === "true") {
    return;
  }

  historyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-toggle]");
    if (!button) {
      return;
    }

    const card = button.closest(".history-card");
    if (!card) {
      return;
    }

    const collapsed = card.classList.toggle("is-collapsed");
    syncHistoryCardToggle(card, collapsed);
  });

  historyList.dataset.toggleBound = "true";
}

function renderAbHistoryCards(history) {
  return history
    .map((entry, index) => {
      const body = isAbSourceMissing(entry)
        ? renderSourceMissingPanel(entry)
        : `${renderRotationStatusBand(entry)}<div class="pool-grid">${renderPoolGrid(entry)}</div>`;
      return `
        <article class="history-card ${index === 0 ? "is-latest" : ""}">
          <div class="history-head">
            <div>
              <p class="eyebrow">History</p>
              <h3>${escapeHtml(entry.trade_date || "--")} ${escapeHtml(entry.phase_label || "")}</h3>
            </div>
            <div class="history-head-actions">
              <div class="pill-row compact-pills">
                ${buildAbPills(entry)
                  .map((item) => `<span class="pill">${item}</span>`)
                  .join("")}
              </div>
              ${renderHistoryToggleButton()}
            </div>
          </div>
          <div class="history-body">
            ${body}
          </div>
        </article>
      `;
    })
    .join("");
}

function setHistorySummaryOnly(toggleButton, historyList, history, enabled) {
  if (!toggleButton || !historyList) {
    return;
  }

  const rows = Array.isArray(history) ? history : historyList.__abDailyHistory || [];
  historyList.__abDailyHistory = rows;
  historyList.classList.toggle("is-summary-only", enabled);
  historyList.classList.toggle("is-summary-table", enabled);
  toggleButton.classList.toggle("is-active", enabled);
  toggleButton.textContent = enabled ? "顯示 A/B 明細" : "只看每日 A/B 摘要";
  toggleButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  historyList.innerHTML = enabled ? renderAbDailyHistorySummaryTable(rows) : renderAbHistoryCards(rows);
}

function wireAbHistorySummaryToggle(toggleButton, historyList, history) {
  if (!toggleButton || !historyList) {
    return;
  }

  historyList.__abDailyHistory = Array.isArray(history) ? history : [];

  if (toggleButton.dataset.summaryToggleBound === "true") {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const enabled = !historyList.classList.contains("is-summary-only");
    setHistorySummaryOnly(toggleButton, historyList, historyList.__abDailyHistory, enabled);
  });

  toggleButton.dataset.summaryToggleBound = "true";
}

function syncLatestToggle(toggleButton, latestShell, collapsed) {
  if (!toggleButton || !latestShell) {
    return;
  }

  toggleButton.textContent = collapsed ? "展開" : "收起";
  toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function wireLatestToggle(toggleButton, latestShell) {
  if (!toggleButton || !latestShell || toggleButton.dataset.latestToggleBound === "true") {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const collapsed = latestShell.classList.toggle("is-collapsed");
    syncLatestToggle(toggleButton, latestShell, collapsed);
  });

  toggleButton.dataset.latestToggleBound = "true";
}

function renderAbDailyPage(payload) {
  const history = (Array.isArray(payload?.history) ? payload.history : []).filter((entry) => hasVisibleAbRows(entry));
  const latest = hasVisibleAbRows(payload?.latest) ? payload.latest : history[0] || {};
  const latestSourceMissing = isAbSourceMissing(latest);
  const latestShell = document.querySelector(".ab-latest-shell");
  const latestToggle = document.querySelector("#ab-latest-toggle");
  const latestPools = document.querySelector("#ab-latest-pools");
  const latestSummary = document.querySelector("#ab-latest-summary");
  const latestPills = document.querySelector("#ab-latest-pills");
  const historyList = document.querySelector("#ab-history-list");
  const historySummaryToggle = document.querySelector("#ab-history-summary-toggle");
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
    if (historySummaryToggle) {
      historySummaryToggle.disabled = true;
      historySummaryToggle.classList.remove("is-active");
      historySummaryToggle.textContent = "只看每日 A/B 摘要";
      historySummaryToggle.setAttribute("aria-pressed", "false");
    }
    if (latestToggle) {
      latestToggle.disabled = true;
      syncLatestToggle(latestToggle, latestShell, false);
    }
    return;
  }

  if (historySummaryToggle) {
    historySummaryToggle.disabled = false;
  }
  if (latestToggle) {
    latestToggle.disabled = false;
    wireLatestToggle(latestToggle, latestShell);
    syncLatestToggle(latestToggle, latestShell, latestShell?.classList.contains("is-collapsed"));
  }

  const sourceLabel = latestSourceMissing
    ? "來源缺失"
    : latest.rows?.some((row) => row.preselect_source === "llm_rules_preselect")
    ? "LLM 規則預選"
    : "LLM 預選";

  pageMeta.innerHTML = [
    `最後同步 ${fallbackText(payload.generated_at)}`,
    `最新交易日 ${fallbackText(latest.trade_date)}`,
    `${fallbackText(latest.phase_label)}`,
    latestSourceMissing ? "AB 預選來源缺失" : `輪動 ${rotationActionLabel(latest.rotation_shadow_action)}`,
    latestSourceMissing ? "" : `週一 ${fallbackText(latest.rotation_trade_week_monday)}`,
    sourceLabel,
  ]
    .filter(Boolean)
    .map((item) => `<span class="pill">${item}</span>`)
    .join("");

  latestSummary.textContent = latestSourceMissing
    ? sourceMissingText(latest)
    : `${latest.trade_date} 的 ${latest.phase_label} 已更新。輪動結論：${rotationConclusionText(latest)}。這版只保留 A 預選與 B 預選兩池，不收斂成 AB 定版。`;

  latestPills.innerHTML = buildAbPills(latest)
    .map((item) => `<span class="pill">${item}</span>`)
    .join("");

  latestPools.innerHTML = latestSourceMissing
    ? renderSourceMissingPanel(latest)
    : `${renderRotationStatusBand(latest)}${renderPoolGrid(latest)}`;

  historyList.innerHTML = '<div class="empty-state">正在整理每日 A/B 摘要...</div>';
  const renderHistory = () => {
    wireAbHistoryToggles(historyList);
    wireAbHistorySummaryToggle(historySummaryToggle, historyList, history);
    setHistorySummaryOnly(historySummaryToggle, historyList, history, true);
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(renderHistory);
  } else {
    renderHistory();
  }
}

function renderRadarCandidateRow(candidate) {
  const stockLabel = [candidate?.symbol, candidate?.name].filter(Boolean).join(" ");
  const stage = `${stageLabel(candidate?.stage)} / ${entryZoneLabel(candidate?.entryZone)}`;
  const volumeRatio = asNumber(candidate?.volumeExpansionRatio);
  const volumeText = volumeRatio === null ? "--" : `${formatNumber(volumeRatio)}x`;

  return `
    <tr>
      <td>${escapeHtml(candidate?.rank || "--")}</td>
      <td>
        <div class="radar-stock">
          <strong>${escapeHtml(stockLabel || "--")}</strong>
          <span>${escapeHtml(candidate?.industry || "產業未標記")}</span>
        </div>
      </td>
      <td>${renderStatusBadge(stage, "radar-status-stage")}</td>
      <td><span class="score-pill">${escapeHtml(formatScore(candidate?.scoreTotal))}</span></td>
      <td>${escapeHtml(formatNumber(candidate?.lastClose))}</td>
      <td>${escapeHtml(formatPct(candidate?.ret20d))}</td>
      <td>${escapeHtml(formatPct(candidate?.ret60d))}</td>
      <td>${escapeHtml(volumeText)}</td>
      <td>${escapeHtml(formatPct(candidate?.scoreDataCoverageRatio))}</td>
      <td class="risk-cell">${escapeHtml(radarRiskText(candidate))}</td>
    </tr>
  `;
}

function renderRadarCandidateTable(candidates) {
  if (!candidates.length) {
    return '<div class="empty-state">目前沒有可呈現的短線雷達觀察清單。</div>';
  }

  return `
    <table class="ab-history-table radar-table">
      <thead>
        <tr>
          <th>排序</th>
          <th>標的</th>
          <th>階段</th>
          <th>分數</th>
          <th>收盤</th>
          <th>20 日</th>
          <th>60 日</th>
          <th>量能</th>
          <th>覆蓋</th>
          <th>風險標記</th>
        </tr>
      </thead>
      <tbody>${candidates.map(renderRadarCandidateRow).join("")}</tbody>
    </table>
  `;
}

function renderRadarScoreGrid(candidate) {
  const scores = candidate?.scores || {};
  const rows = [
    ["營收", scores.revenue],
    ["預期差", scores.expectationGap],
    ["價量", scores.priceVolume],
    ["題材群", scores.themeGroup],
    ["籌碼", scores.chip],
    ["事件", scores.catalyst],
  ];

  return `
    <div class="radar-score-grid">
      ${rows
        .map(
          ([label, value]) => `
            <div class="radar-score-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(formatScore(value))}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderRadarDetail(candidate) {
  if (!candidate) {
    return `
      <p class="eyebrow">Detail</p>
      <h2>尚無觀察資料</h2>
      <p class="section-copy">短線雷達 snapshot 尚未提供候選清單。</p>
    `;
  }

  const stockLabel = [candidate.symbol, candidate.name].filter(Boolean).join(" ");
  const reasons = Array.isArray(candidate.reasons) ? candidate.reasons.filter(Boolean) : [];
  const availableRadars = Array.isArray(candidate.availableRadars) ? candidate.availableRadars : [];
  const degradedRadars = Array.isArray(candidate.degradedRadars) ? candidate.degradedRadars : [];

  return `
    <p class="eyebrow">Top Observation</p>
    <h2>${escapeHtml(stockLabel || "--")}</h2>
    <p class="section-copy">
      目前排序第 ${escapeHtml(candidate.rank || "--")}，${escapeHtml(stageLabel(candidate.stage))}，
      ${escapeHtml(entryZoneLabel(candidate.entryZone))}。此區僅呈現條件掃描結果與資料狀態。
    </p>
    <div class="radar-detail-grid">
      <div>
        <span>總分</span>
        <strong>${escapeHtml(formatScore(candidate.scoreTotal))}</strong>
      </div>
      <div>
        <span>最近收盤</span>
        <strong>${escapeHtml(formatNumber(candidate.lastClose))}</strong>
      </div>
      <div>
        <span>20 日變動</span>
        <strong>${escapeHtml(formatPct(candidate.ret20d))}</strong>
      </div>
      <div>
        <span>量能倍率</span>
        <strong>${escapeHtml(asNumber(candidate.volumeExpansionRatio) === null ? "--" : `${formatNumber(candidate.volumeExpansionRatio)}x`)}</strong>
      </div>
    </div>
    ${renderRadarScoreGrid(candidate)}
    <div class="radar-detail-block">
      <strong>條件摘要</strong>
      <ul class="list">
        ${
          reasons.length
            ? reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")
            : "<li>尚無條件摘要。</li>"
        }
      </ul>
    </div>
    <div class="radar-detail-block">
      <strong>雷達覆蓋</strong>
      <p class="mini-note">
        可用：${escapeHtml(availableRadars.length ? availableRadars.join("、") : "--")}
        <br />
        降級：${escapeHtml(degradedRadars.length ? degradedRadars.join("、") : "--")}
      </p>
    </div>
  `;
}

function renderRadarSourceStatus(source) {
  const className = freshnessClass(source?.freshness);
  const markets = Array.isArray(source?.markets) ? source.markets.join(" / ") : "--";
  return `
    <article class="radar-source-card ${className}">
      <div class="radar-source-head">
        <strong>${escapeHtml(source?.label || source?.dataset || "--")}</strong>
        ${renderStatusBadge(freshnessLabel(source?.freshness), className)}
      </div>
      <div class="radar-source-meta">
        <span>最新：${escapeHtml(fallbackText(source?.latest))}</span>
        <span>市場：${escapeHtml(markets)}</span>
        <span>筆數：${escapeHtml(formatNumber(source?.actualCount))}</span>
      </div>
    </article>
  `;
}

function renderShortTermRadarPage(payload) {
  const pageMeta = document.querySelector("#radar-page-meta");
  const summaryMetrics = document.querySelector("#radar-summary-metrics");
  const candidateTable = document.querySelector("#radar-candidate-table");
  const detail = document.querySelector("#radar-detail");
  const sourceGrid = document.querySelector("#radar-source-grid");
  const notices = document.querySelector("#radar-notices");
  const summary = payload?.summary || {};
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const topCandidates = candidates.slice(0, 20);

  if (pageMeta) {
    pageMeta.innerHTML = payload
      ? [
          `掃描日 ${fallbackText(payload.asOfDate)}`,
          modeLabel(summary.mode),
          `候選 ${fallbackText(summary.totalCandidates)} 檔`,
          `產生時間 ${formatCompactDateTime(payload.createdAt)}`,
        ]
          .map((item) => `<span class="pill">${item}</span>`)
          .join("")
      : '<span class="pill">短線雷達資料尚未載入</span>';
  }

  renderMetricCards(summaryMetrics, [
    ["掃描日", payload?.asOfDate],
    ["候選檔數", summary.totalCandidates],
    ["核心資料完成", summary.coreReadyCount],
    ["最高分數", formatScore(summary.topScore)],
    ["平均分數覆蓋", formatPct(summary.averageScoreCoverage)],
    ["Slot 覆蓋", formatPct(summary.averageSlotCoverage)],
  ]);

  if (candidateTable) {
    candidateTable.innerHTML = renderRadarCandidateTable(topCandidates);
  }

  if (detail) {
    detail.innerHTML = renderRadarDetail(candidates[0]);
  }

  if (sourceGrid) {
    const sources = Array.isArray(payload?.datasetStatus) ? payload.datasetStatus : [];
    sourceGrid.innerHTML = sources.length
      ? sources.map(renderRadarSourceStatus).join("")
      : '<div class="empty-state">尚無資料源狀態。</div>';
  }

  if (notices) {
    const noticeRows = Array.isArray(payload?.notices) && payload.notices.length
      ? payload.notices
      : ["本系統為交易規則量化與下單輔助工具，不提供個股投資建議、不保證收益。使用者須自行評估投資風險。"];
    notices.innerHTML = noticeRows
      .map((notice) => `<article class="radar-notice">${escapeHtml(notice)}</article>`)
      .join("");
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
  const cacheKey = encodeURIComponent(data.trade_date || String(Date.now()));
  const framePath = (path) => `${path}?v=${cacheKey}`;
  let frameResizeObserver = null;
  let frameMutationObserver = null;
  const clearFrameObservers = () => {
    frameResizeObserver?.disconnect();
    frameMutationObserver?.disconnect();
    frameResizeObserver = null;
    frameMutationObserver = null;
  };
  const resizeFrame = () => {
    try {
      const frameDocument = frame.contentDocument;
      if (!frameDocument) {
        return;
      }
      const height = Math.max(
        900,
        frameDocument.documentElement?.scrollHeight || 0,
        frameDocument.documentElement?.offsetHeight || 0,
        frameDocument.body?.scrollHeight || 0,
        frameDocument.body?.offsetHeight || 0
      );
      frame.style.height = `${Math.ceil(height + 64)}px`;
    } catch (_error) {
      frame.style.height = "";
    }
  };
  const scheduleResizeFrame = () => {
    resizeFrame();
    [120, 600, 1500, 3000].forEach((delay) => window.setTimeout(resizeFrame, delay));
    try {
      const frameDocument = frame.contentDocument;
      if (!frameDocument) {
        return;
      }
      clearFrameObservers();
      if (typeof ResizeObserver !== "undefined") {
        frameResizeObserver = new ResizeObserver(resizeFrame);
        if (frameDocument.documentElement) {
          frameResizeObserver.observe(frameDocument.documentElement);
        }
        if (frameDocument.body) {
          frameResizeObserver.observe(frameDocument.body);
        }
      }
      if (typeof MutationObserver !== "undefined" && frameDocument.body) {
        frameMutationObserver = new MutationObserver(resizeFrame);
        frameMutationObserver.observe(frameDocument.body, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }
    } catch (_error) {
      clearFrameObservers();
    }
  };
  const showFrame = (path) => {
    clearFrameObservers();
    frame.style.height = "";
    frame.src = framePath(path);
  };

  frame.setAttribute("scrolling", "auto");
  frame.addEventListener("load", scheduleResizeFrame);
  showFrame(currentPath);
  currentButton.href = currentPath;
  dailyButton.href = dailyPath;
  weeklyButton.href = weeklyPath;

  const frameButtons = [currentButton, dailyButton, weeklyButton];
  const selectFrameButton = (activeButton) => {
    frameButtons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-selected", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  };
  selectFrameButton(currentButton);

  currentButton.addEventListener("click", (event) => {
    event.preventDefault();
    showFrame(currentPath);
    selectFrameButton(currentButton);
  });
  dailyButton.addEventListener("click", (event) => {
    event.preventDefault();
    showFrame(dailyPath);
    selectFrameButton(dailyButton);
  });
  weeklyButton.addEventListener("click", (event) => {
    event.preventDefault();
    showFrame(weeklyPath);
    selectFrameButton(weeklyButton);
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
    const radar = await fetchShortTermRadarData();
    renderPortalHome(manifest, radar);
  }

  if (document.body.dataset.page === "ab-daily-wrapper") {
    const abDaily = await fetchAbDailyData();
    renderAbDailyPage(abDaily);
  }

  if (document.body.dataset.page === "short-term-radar-wrapper") {
    const radar = await fetchShortTermRadarData();
    renderShortTermRadarPage(radar);
  }

  if (document.body.dataset.page === "auto-trading-wrapper") {
    wireAutoTradingFrame(manifest);
  }
}

bootstrapPortal();
