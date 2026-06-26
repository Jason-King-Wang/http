const state = {
  data: window.__PUBLIC_SELL_MODEL_DATA__ || { summary: {}, daily_history: [], checks: [], stocks: [], actions: {} },
  filters: {
    search: "",
    theme: "",
    role: "",
    review: ""
  },
  selectedStockId: null
};

const DATA_JSON_URL = "./data/public-sell-model.json";
const LIVE_REFRESH_INTERVAL_MS = 60 * 1000;
const MAX_DAILY_HISTORY_ITEMS = 30;
const MAX_DAILY_HISTORY_CARDS = 3;

const elements = {
  dailySummaryNote: document.querySelector("#summary-daily-summary-note"),
  dailyComparison: document.querySelector("#summary-daily-comparison"),
  dailyHistoryList: document.querySelector("#summary-daily-history-list"),
  heroMeta: document.querySelector("#hero-meta"),
  sourceSummary: document.querySelector("#source-summary"),
  publicScope: document.querySelector("#public-scope"),
  summaryCards: document.querySelector("#summary-cards"),
  dailyCompareTableBody: document.querySelector("#daily-compare-table-body"),
  storyList: document.querySelector("#story-list"),
  actionSummary: document.querySelector("#action-summary"),
  actionPills: document.querySelector("#action-pills"),
  actionList: document.querySelector("#action-list"),
  themeBoard: document.querySelector("#theme-board"),
  checkStats: document.querySelector("#check-stats"),
  checkGroups: document.querySelector("#check-groups"),
  stockTableBody: document.querySelector("#stock-table-body"),
  detailPanel: document.querySelector("#detail-panel"),
  searchInput: document.querySelector("#search-input"),
  themeFilter: document.querySelector("#theme-filter"),
  roleFilter: document.querySelector("#role-filter"),
  reviewFilter: document.querySelector("#review-filter")
};

bootstrap();

async function bootstrap() {
  bindFilters();
  registerServiceWorker();
  renderDashboard();
  await refreshLiveData({ silent: true });
  startLiveRefresh();
}

function bindFilters() {
  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderDashboard();
  });

  [
    ["theme", elements.themeFilter],
    ["role", elements.roleFilter],
    ["review", elements.reviewFilter]
  ].forEach(([key, element]) => {
    element.addEventListener("change", (event) => {
      state.filters[key] = event.target.value;
      renderDashboard();
    });
  });
}

function renderDashboard() {
  const rows = state.data.stocks || [];
  const filteredRows = applyFilters(rows);

  if (!filteredRows.some((row) => row.stock_id === state.selectedStockId)) {
    state.selectedStockId = filteredRows[0]?.stock_id || rows[0]?.stock_id || null;
  }

  renderDailyOverview();
  renderHero();
  renderPublicScope();
  renderSummaryCards();
  renderDailyComparisonTable();
  renderStories(rows);
  renderActions();
  renderThemes(rows);
  renderChecks();
  renderFilterOptions(rows);
  renderTable(filteredRows);
  renderDetailPanel(filteredRows, rows);
}

function isSellModelSourceMissing(value) {
  return value?.source_missing === true || String(value?.source_status || value?.status || "").trim() === "missing_source";
}

function sellModelSourceMissingText(summary) {
  return summary?.source_missing_message
    || `${summary?.target_trade_date || "最新交易日"} 的賣價模型公開輸入尚未產生；公開頁先顯示缺口，不沿用舊資料。`;
}

function renderHero() {
  const summary = state.data.summary || {};
  const actions = state.data.actions || {};
  const rows = state.data.stocks || [];
  const dailyHistory = getDailyHistory();
  const sourceMissing = isSellModelSourceMissing(summary);

  const tags = [
    sourceMissing ? "賣價模型來源缺失" : null,
    `最新資料日 ${summary.target_trade_date || "未提供"}`,
    `${formatInteger(summary.verified_stock_count)} 檔驗證樣本`,
    `${formatInteger(rows.length)} 檔公開個股`,
    hasNumericValue(actions.total_actions) && toNumber(actions.total_actions) > 0
      ? `今日回寫 ${formatInteger(actions.total_actions)} 動作`
      : null,
    `公開整理 ${formatDateTime(summary.generated_at)}`,
    `逐日摘要 ${formatInteger(dailyHistory.length)} 天`
  ].filter(Boolean);

  elements.heroMeta.innerHTML = tags.map((text) => `<span class="pill">${escapeHtml(text)}</span>`).join("");
  if (sourceMissing) {
    elements.sourceSummary.textContent = sellModelSourceMissingText(summary);
    return;
  }
  elements.sourceSummary.textContent = [
    "目前公開版以 sell model v3 quantile 為主，q50 是中位高點估計，q60 是賣價目標，q80 是樂觀上緣。",
    actions.headline || "收盤後若有回寫動作，頁面會整理成今天模型怎麼修。",
    "頁面會保留結果與結論，但不公開內部分流規則、關聯標記與判斷來源。",
    `最後公開整理 ${formatDateTime(summary.generated_at)}。`,
    "頁面開著時會自動檢查更新。"
  ].join(" ");
}

function renderDailyOverview() {
  if (!elements.dailySummaryNote || !elements.dailyComparison || !elements.dailyHistoryList) {
    return;
  }

  const history = getDailyHistory();
  if (!history.length) {
    elements.dailySummaryNote.textContent = "最近 30 個交易日內還沒有可公開的逐日摘要。";
    elements.dailyComparison.innerHTML = `<div class="empty-state">等第一批逐日資料進來後，這裡會顯示整理後的比較摘要。</div>`;
    elements.dailyHistoryList.innerHTML = `<div class="empty-state">目前沒有逐日資料。</div>`;
    return;
  }

  const latest = history[0];
  const previous = history[1] || null;
  const comparisonBase = findComparisonBase(history);
  const metrics = buildDailyComparisonMetrics(latest, comparisonBase);

  elements.dailySummaryNote.textContent = buildDailySummaryNote(latest, previous, comparisonBase, history.length);
  elements.dailyComparison.innerHTML = metrics
    .map((metric) => `
      <article class="daily-mini-metric">
        <span class="metric-label">${escapeHtml(metric.label)}</span>
        <strong class="metric-value ${escapeHtml(metric.tone || "trend-flat")}">${escapeHtml(metric.value)}</strong>
        <p class="metric-note">${escapeHtml(metric.note)}</p>
      </article>
    `)
    .join("");

  elements.dailyHistoryList.innerHTML = history
    .slice(0, MAX_DAILY_HISTORY_CARDS)
    .map((entry, index) => renderDailyHistoryCard(entry, index === 0))
    .join("");
}

function buildDailySummaryNote(latest, previous, comparisonBase, historyCount) {
  const accuracySummary = buildAccuracySummarySentence(latest);
  if (accuracySummary) {
    return accuracySummary;
  }

  if (!comparisonBase) {
    return `目前已整理 ${historyCount} 個交易日摘要，最新日期是 ${latest.trade_date}。`;
  }

  if (comparisonBase.trade_date === previous?.trade_date) {
    if (hasVerifiedMetrics(latest) && hasVerifiedMetrics(comparisonBase)) {
      return `最新交易日 ${latest.trade_date} 已可直接和前一交易日 ${comparisonBase.trade_date} 比較。`;
    }

    return `最新交易日 ${latest.trade_date} 與前一交易日 ${comparisonBase.trade_date} 先比較公開個股數、平均分數與預測摘要；驗證指標會在資料補齊後更新。`;
  }

  return `前一交易日 ${previous?.trade_date || "未提供"} 目前仍是待驗證狀態，所以這裡先拿最近可比較的 ${comparisonBase.trade_date} 當基準。`;
}

function buildDailyComparisonMetrics(latest, comparisonBase) {
  const metrics = [
    {
      label: "公開個股",
      value: formatInteger(latest.stock_count),
      note: buildDeltaNote(latest.stock_count, comparisonBase?.stock_count, comparisonBase?.trade_date, "integer"),
      tone: buildDeltaTone(latest.stock_count, comparisonBase?.stock_count)
    },
    {
      label: "平均分數",
      value: formatDecimal(latest.avg_model_score, 2),
      note: buildDeltaNote(latest.avg_model_score, comparisonBase?.avg_model_score, comparisonBase?.trade_date, "decimal"),
      tone: buildDeltaTone(latest.avg_model_score, comparisonBase?.avg_model_score)
    }
  ];

  if (hasNumericValue(latest.avg_confidence)) {
    metrics.push({
      label: "平均可靠度",
      value: formatPercent(latest.avg_confidence),
      note: buildDeltaNote(latest.avg_confidence, comparisonBase?.avg_confidence, comparisonBase?.trade_date, "percent"),
      tone: buildDeltaTone(latest.avg_confidence, comparisonBase?.avg_confidence)
    });
  } else {
    metrics.push({
      label: "領先股",
      value: latest.lead_stock || "-",
      note: `${latest.source_label || "逐日摘要"} / ${latest.top_theme || "未分類"} ${formatInteger(latest.top_theme_count)} 檔`,
      tone: "trend-flat"
    });
  }

  metrics.push(buildAccuracyOverviewMetric(latest));

  if (hasVerifiedMetrics(latest)) {
    metrics.push({
      label: "全體低估率",
      value: formatPercent(latest.under_rate),
      note: buildDeltaNote(latest.under_rate, comparisonBase?.under_rate, comparisonBase?.trade_date, "percent"),
      tone: buildDeltaTone(latest.under_rate, comparisonBase?.under_rate, { lowerIsBetter: true })
    });
    metrics.push({
      label: "Q80 覆蓋率",
      value: formatPercent(latest.q80_coverage_rate),
      note: buildDeltaNote(latest.q80_coverage_rate, comparisonBase?.q80_coverage_rate, comparisonBase?.trade_date, "percent"),
      tone: buildDeltaTone(latest.q80_coverage_rate, comparisonBase?.q80_coverage_rate)
    });
  } else {
    metrics.push({
      label: "主題焦點",
      value: latest.top_theme || "未分類",
      note: `${formatInteger(latest.top_theme_count)} 檔 / ${latest.status_label || "待處理"}`,
      tone: "trend-flat"
    });
  }

  return metrics;
}

function buildAccuracySummarySentence(entry) {
  if (!entry) {
    return "";
  }

  const tradeDate = entry.trade_date || "未提供";
  const referenceDate = entry.accuracy_reference_date;
  const label = getAccuracyLabel(entry);
  const note = entry.accuracy_note || buildAccuracyFallbackNote(entry);

  if (entry.accuracy_status === "baseline") {
    return `最新交易日 ${tradeDate} 是目前第一筆已驗證資料，還沒有更早的已驗證交易日可比較。`;
  }

  if (entry.accuracy_status === "pending") {
    if (referenceDate) {
      return `最新交易日 ${tradeDate} 還在等驗證資料，之後會再和 ${referenceDate} 比較有沒有更準。`;
    }
    return `最新交易日 ${tradeDate} 還在等驗證資料，之後再判斷有沒有更準。`;
  }

  if (referenceDate) {
    return `最新交易日 ${tradeDate} 和 ${referenceDate} 相比，有沒有更準：${label}。${note}`;
  }

  return `最新交易日 ${tradeDate} 的準度比較：${label}。${note}`;
}

function buildAccuracyOverviewMetric(entry) {
  return {
    label: "有沒有更準",
    value: getAccuracyLabel(entry),
    note: entry?.accuracy_note || buildAccuracyFallbackNote(entry),
    tone: toAccuracyTrendTone(entry?.accuracy_status)
  };
}

function renderDailyHistoryCard(entry, isLatest) {
  const metricChips = [
    `${formatInteger(entry.stock_count)} 檔公開`,
    `候選 ${formatInteger(entry.candidate_count)}`,
    hasVerifiedMetrics(entry)
      ? `命中 ${formatPercent(entry.peak_hit_rate)}`
      : hasNumericValue(entry.avg_confidence)
        ? `信心 ${formatPercent(entry.avg_confidence)}`
        : entry.source_label || "摘要"
  ];
  if (hasNumericValue(entry.action_count) && toNumber(entry.action_count) > 0) {
    metricChips.push(`回寫 ${formatInteger(entry.action_count)} 動作`);
  }

  return `
    <article class="daily-history-item ${isLatest ? "is-latest" : ""}">
      <div class="daily-history-head">
        <div class="daily-history-title">
          <strong>${escapeHtml(entry.trade_date || "未提供")}</strong>
          <span class="mini-note">${escapeHtml(entry.summary_note || "目前沒有逐日摘要。")}</span>
        </div>
        <div class="daily-status-row">
          <span class="status-badge ${escapeHtml(resolveStatusClass(entry.status))}">${escapeHtml(entry.status_label || "未提供")}</span>
          <span class="tag tag-neutral">${escapeHtml(entry.source_label || "摘要")}</span>
        </div>
      </div>
      <div class="daily-inline-metrics">
        ${metricChips
          .map((text) => `<span class="pill">${escapeHtml(text)}</span>`)
          .join("")}
      </div>
      <div class="daily-accuracy-row">
        <span class="status-badge ${escapeHtml(buildAccuracyBadgeClass(entry.accuracy_status))}">有沒有更準：${escapeHtml(getAccuracyLabel(entry))}</span>
        <span class="mini-note">${escapeHtml(entry.accuracy_note || buildAccuracyFallbackNote(entry))}</span>
      </div>
      <p class="daily-history-note">
        主題焦點 ${escapeHtml(entry.top_theme || "未分類")} (${escapeHtml(formatInteger(entry.top_theme_count))} 檔)
        / 領先股 ${escapeHtml(entry.lead_stock || "-")}
      </p>
    </article>
  `;
}

function getDailyHistory() {
  return Array.isArray(state.data.daily_history)
    ? state.data.daily_history.slice(0, MAX_DAILY_HISTORY_ITEMS)
    : [];
}

function findComparisonBase(history) {
  const latest = history[0];
  if (!latest) {
    return null;
  }

  const immediatePrevious = history[1] || null;
  if (hasVerifiedMetrics(latest)) {
    return history.slice(1).find((entry) => hasVerifiedMetrics(entry)) || immediatePrevious;
  }

  return immediatePrevious;
}

function hasVerifiedMetrics(entry) {
  return hasNumericValue(entry?.peak_hit_rate) && hasNumericValue(entry?.pred_peak_mae);
}

function hasNumericValue(value) {
  return Number.isFinite(toMaybeNumber(value));
}

function firstPresentValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }
    if (String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function q50Pct(row) {
  return firstPresentValue(row?.pred_peak_q50_pct, row?.pred_peak_p50_pct);
}

function q60Pct(row) {
  return firstPresentValue(row?.pred_sell_target_pct, row?.pred_peak_q60_pct, row?.pred_remaining_upside_from_now);
}

function getV4Comparison(entry = null) {
  return entry?.v4_comparison || state.data?.v4_comparison || state.data?.summary?.v4_comparison || {};
}

function hasV4ActualComparison(comparison) {
  return hasNumericValue(comparison?.v3_q60_abs_error_mean) && hasNumericValue(comparison?.v4_q60_abs_error_mean);
}

function formatV4SummaryValue(comparison) {
  if (hasV4ActualComparison(comparison)) {
    if (comparison.v4_better === true || comparison.winner === "v4") {
      return "V4 better";
    }
    if (comparison.valid_for_promotion === true || comparison.winner === "v3") {
      return "V3 better";
    }
    return "Tracking";
  }
  if (comparison?.forecast_available) {
    return "Shadow run";
  }
  return "No data";
}

function buildV4SummaryNote(comparison) {
  if (hasV4ActualComparison(comparison)) {
    const streak = hasNumericValue(comparison.consecutive_better_days) && hasNumericValue(comparison.gate_consecutive_days)
      ? ` / gate ${formatInteger(comparison.consecutive_better_days)}/${formatInteger(comparison.gate_consecutive_days)}`
      : "";
    return `q60 MAPE v3 ${formatPercentFromPoints(comparison.v3_q60_abs_error_mean)} / v4 ${formatPercentFromPoints(comparison.v4_q60_abs_error_mean)}${streak}`;
  }
  if (comparison?.forecast_available) {
    return `v4 applied ${formatInteger(comparison.v4_applied_count)} / fallback ${formatInteger(comparison.v4_fallback_count)}`;
  }
  return comparison?.reason || "v4 comparison file is not available yet";
}

function buildV4Tone(comparison) {
  if (!hasV4ActualComparison(comparison)) {
    return "metric-compare-flat";
  }
  if (comparison.v4_better === true || comparison.winner === "v4") {
    return "metric-compare-positive";
  }
  if (comparison.valid_for_promotion === true || comparison.winner === "v3") {
    return "metric-compare-negative";
  }
  return "metric-compare-flat";
}

function renderV4ComparisonCell(entry) {
  const comparison = getV4Comparison(entry);
  return `
    <div class="stacked accuracy-cell">
      <span class="status-badge ${escapeHtml(buildV4Tone(comparison))}">${escapeHtml(formatV4SummaryValue(comparison))}</span>
      <span class="metric-sub">${escapeHtml(buildV4SummaryNote(comparison))}</span>
    </div>
  `;
}

function renderV4StockCell(row) {
  const v3Q60 = firstPresentValue(row?.v3_q60_pct, row?.pred_peak_q60_pct, row?.pred_sell_target_pct);
  const v4Q60 = firstPresentValue(row?.v4_q60_pct);
  const hasError = hasNumericValue(row?.v3_q60_abs_error) && hasNumericValue(row?.v4_q60_abs_error);
  const delta = hasNumericValue(row?.v4_q60_error_delta)
    ? `delta ${formatSignedPoints(row.v4_q60_error_delta)}`
    : hasNumericValue(row?.v4_q60_delta_pct)
      ? `q60 ${formatSignedPoints(row.v4_q60_delta_pct)}`
      : row?.v4_fallback_reason || "";
  const label = row?.v4_applied === true || row?.v4_applied === 1 || String(row?.v4_applied) === "1"
    ? "v4 applied"
    : row?.v4_fallback_reason
      ? "v4 fallback"
      : "v4 pending";
  return `
    <div class="stacked">
      <strong>${escapeHtml(formatPercentFromPoints(v3Q60))} / ${escapeHtml(formatPercentFromPoints(v4Q60))}</strong>
      <span class="metric-sub">${escapeHtml(label)}${hasError ? ` / v3 ${escapeHtml(formatPercentFromPoints(row.v3_q60_abs_error))} v4 ${escapeHtml(formatPercentFromPoints(row.v4_q60_abs_error))}` : ""}${delta ? ` / ${escapeHtml(delta)}` : ""}</span>
    </div>
  `;
}

function q80Pct(row) {
  return firstPresentValue(row?.pred_peak_upper_pct, row?.pred_peak_q80_pct, row?.pred_peak_p80_pct);
}

function q90Pct(row) {
  return firstPresentValue(row?.pred_peak_q90_pct, row?.pred_peak_p95_pct);
}

function sellTargetPrice(row) {
  return firstPresentValue(row?.pred_sell_target_price, row?.pred_peak_q60_price, row?.pred_peak_price);
}

function upperBandPrice(row) {
  return firstPresentValue(row?.pred_peak_upper_price, row?.pred_peak_q80_price);
}

function resolveStatusClass(status) {
  return status === "verified" ? "status-pass" : "status-neutral";
}

function getAccuracyLabel(entry) {
  return entry?.accuracy_label || (entry?.status === "verified" ? "未提供" : "待驗證");
}

function buildAccuracyFallbackNote(entry) {
  if (entry?.accuracy_status === "baseline") {
    return "目前沒有更早的已驗證交易日可比較。";
  }
  if (entry?.status !== "verified") {
    return "這天還沒有實際高點回顧，之後再判斷有沒有更準。";
  }
  if (entry?.accuracy_reference_date) {
    return `比 ${entry.accuracy_reference_date} 的準度資料尚未整理。`;
  }
  return "目前沒有可比較的資料。";
}

function buildAccuracyBadgeClass(status) {
  if (status === "better") {
    return "status-pass";
  }
  if (status === "worse") {
    return "status-fail";
  }
  return "status-neutral";
}

function toAccuracyTrendTone(status) {
  if (status === "better") {
    return "trend-positive";
  }
  if (status === "worse") {
    return "trend-negative";
  }
  return "trend-flat";
}

function buildAccuracyReferenceText(entry) {
  if (entry?.accuracy_status === "baseline") {
    return "目前最早的已驗證日";
  }
  if (entry?.accuracy_status === "pending") {
    return entry?.accuracy_reference_date
      ? `等回顧後再比 ${entry.accuracy_reference_date}`
      : "等回顧資料補齊";
  }
  if (entry?.accuracy_reference_date) {
    return `比 ${entry.accuracy_reference_date}`;
  }
  return "暫無可比資料";
}

function buildDeltaNote(latestValue, previousValue, previousDate, format, options = {}) {
  const latestNumber = toMaybeNumber(latestValue);
  const previousNumber = toMaybeNumber(previousValue);
  if (!previousDate) {
    return "目前沒有前一交易日可比較。";
  }
  if (!Number.isFinite(latestNumber) || !Number.isFinite(previousNumber)) {
    return `${previousDate} 暫時沒有可直接比較的數值。`;
  }

  const delta = latestNumber - previousNumber;
  if (Math.abs(delta) < 0.0001) {
    return `和 ${previousDate} 持平。`;
  }

  const direction = describeDelta(delta, options);
  return `比 ${previousDate} ${formatSignedChange(delta, format)} (${direction})`;
}

function buildDeltaTone(latestValue, previousValue, options = {}) {
  const latestNumber = toMaybeNumber(latestValue);
  const previousNumber = toMaybeNumber(previousValue);
  if (!Number.isFinite(latestNumber) || !Number.isFinite(previousNumber)) {
    return "trend-flat";
  }

  const delta = latestNumber - previousNumber;
  if (Math.abs(delta) < 0.0001) {
    return "trend-flat";
  }

  const isPositive = options.lowerIsBetter ? delta < 0 : delta > 0;
  return isPositive ? "trend-positive" : "trend-negative";
}

function describeDelta(delta, { lowerIsBetter = false } = {}) {
  if (Math.abs(delta) < 0.0001) {
    return "持平";
  }

  if (lowerIsBetter) {
    return delta < 0 ? "更低" : "更高";
  }

  return delta > 0 ? "增加" : "減少";
}

function formatSignedChange(delta, format) {
  const sign = delta > 0 ? "+" : "";
  if (format === "percent") {
    return `${sign}${(delta * 100).toFixed(2)}%`;
  }
  if (format === "percentPoints") {
    return `${sign}${delta.toFixed(2)}%`;
  }
  if (format === "integer") {
    return `${sign}${Math.round(delta)}`;
  }
  return `${sign}${delta.toFixed(2)}`;
}

function renderPublicScope() {
  const items = [
    "公開版現在以 v3 quantile high-forecast model 為主，q60 是賣價目標，q80 只作樂觀上緣。",
    "頁面會展示 q50 / q60 / q80 / q90、dynamic cap、forecast regime、reliability 與時段機率。",
    "每天收盤後若有 review actions，會整理成今天模型怎麼修，直接顯示主題、個股與時段修正。",
    "會保留結果與結論，但仍移除內部分流邏輯、關聯標記與規則來源。"
  ];

  elements.publicScope.innerHTML = items
    .map((text) => `<article class="story-item"><p class="story-text">${escapeHtml(text)}</p></article>`)
    .join("");
}

function renderSummaryCards() {
  const summary = state.data.summary || {};
  const history = getDailyHistory();
  const v4Comparison = getV4Comparison();
  const metrics = [
    {
      label: "峰值命中率",
      value: formatPercent(summary.peak_hit_rate),
      note: `${formatInteger(summary.verified_stock_count)} 檔驗證樣本`,
      comparison: buildSummaryMetricComparison(summary, history, "peak_hit_rate", "percent")
    },
    {
      label: "全體低估率",
      value: formatPercent(summary.under_rate),
      note: `Top10 ${formatPercent(summary.top10_under_rate)} / Top20 ${formatPercent(summary.top20_under_rate)}`,
      comparison: buildSummaryMetricComparison(summary, history, "under_rate", "percent", { lowerIsBetter: true })
    },
    {
      label: "高點 MAPE",
      value: formatPercentFromPoints(summary.pred_peak_mape),
      note: `中位誤差 ${formatPercentFromPoints(summary.median_abs_error_pct)} / 平均 signed ${formatSignedPoints(summary.mean_signed_error_pct)}`,
      comparison: buildSummaryMetricComparison(summary, history, "pred_peak_mape", "percentPoints", { lowerIsBetter: true })
    },
    {
      label: "Q80 覆蓋率",
      value: formatPercent(summary.q80_coverage_rate),
      note: hasNumericValue(summary.sell_target_hit_rate)
        ? `q60 hit ${formatPercent(summary.sell_target_hit_rate)} / q50 MAPE ${formatPercentFromPoints(summary.q50_mape)}`
        : "待驗證日會在收盤後補 q80 coverage",
      comparison: buildSummaryMetricComparison(summary, history, "q80_coverage_rate", "percent")
    },
    {
      label: "V4 vs V3",
      value: formatV4SummaryValue(v4Comparison),
      note: buildV4SummaryNote(v4Comparison),
      comparison: {
        label: "10-day gate",
        value: `${formatInteger(v4Comparison.consecutive_better_days)}/${formatInteger(v4Comparison.gate_consecutive_days || 10)}`,
        tone: buildV4Tone(v4Comparison)
      }
    },
    {
      label: "時間命中率",
      value: formatPercent(summary.pred_peak_time_bucket_hit_rate),
      note: "高點時間區間是否預測正確",
      comparison: buildSummaryMetricComparison(summary, history, "pred_peak_time_bucket_hit_rate", "percent")
    },
    {
      label: "Objective",
      value: formatDecimal(summary.objective_loss, 2),
      note: `Over ${formatPercent(summary.over_rate)} / 核心低估 ${formatPercent(summary.core_under_rate)}`,
      comparison: buildSummaryMetricComparison(summary, history, "objective_loss", "decimal", { lowerIsBetter: true })
    }
  ];

  elements.summaryCards.innerHTML = metrics
    .map((metric) => `
      <article class="metric-card">
        <span class="metric-label">${escapeHtml(metric.label)}</span>
        <strong class="metric-value">${escapeHtml(metric.value)}</strong>
        <div class="metric-compare-block">
          <span class="metric-compare-label">${escapeHtml(metric.comparison.label)}</span>
          <strong class="metric-compare-value ${escapeHtml(metric.comparison.tone)}">${escapeHtml(metric.comparison.value)}</strong>
        </div>
        <p class="metric-note">${escapeHtml(metric.note)}</p>
      </article>
    `)
    .join("");
}

function buildSummaryMetricComparison(summary, history, field, format, options = {}) {
  const latestValue = summary?.[field];
  const immediatePrevious = history[1] || null;

  if (!hasNumericValue(latestValue)) {
    return {
      label: "最新資料",
      value: "待驗證",
      tone: "metric-compare-flat"
    };
  }

  const comparisonBase = findMetricComparisonBase(history, field);
  if (!comparisonBase) {
    if (immediatePrevious?.trade_date) {
      return {
        label: `前日 ${immediatePrevious.trade_date}`,
        value: "待驗證",
        tone: "metric-compare-flat"
      };
    }

    return {
      label: "前日資料",
      value: "暫無可比",
      tone: "metric-compare-flat"
    };
  }

  const latestNumber = toMaybeNumber(latestValue);
  const previousNumber = toMaybeNumber(comparisonBase[field]);
  if (!Number.isFinite(latestNumber) || !Number.isFinite(previousNumber)) {
    return {
      label: `比 ${comparisonBase.trade_date}`,
      value: "無法比較",
      tone: "metric-compare-flat"
    };
  }

  const delta = latestNumber - previousNumber;
  if (Math.abs(delta) < 0.0001) {
    return {
      label: `比 ${comparisonBase.trade_date}`,
      value: "持平",
      tone: "metric-compare-flat"
    };
  }

  return {
    label: `比 ${comparisonBase.trade_date}`,
    value: formatSignedChange(delta, format),
    tone: toMetricCompareTone(buildDeltaTone(latestValue, comparisonBase[field], options))
  };
}

function findMetricComparisonBase(history, field) {
  return history.slice(1).find((entry) => hasNumericValue(entry?.[field])) || null;
}

function toMetricCompareTone(trend) {
  if (trend === "trend-positive") {
    return "metric-compare-positive";
  }
  if (trend === "trend-negative") {
    return "metric-compare-negative";
  }
  return "metric-compare-flat";
}

function renderStories(rows) {
  const summary = state.data.summary || {};
  const history = getDailyHistory();
  const strongestRow = [...rows]
    .filter((row) => toNumber(row.peak_hit) === 1)
    .sort((left, right) => toNumber(left.model_rank) - toNumber(right.model_rank))[0];
  const worstRow = [...rows]
    .filter((row) => Number.isFinite(toNumber(row.pred_peak_error_pct_abs)) || Number.isFinite(toNumber(row.pred_peak_error_abs)))
    .sort((left, right) => {
      const rightValue = Number.isFinite(toNumber(right.pred_peak_error_pct_abs)) ? toNumber(right.pred_peak_error_pct_abs) : toNumber(right.pred_peak_error_abs);
      const leftValue = Number.isFinite(toNumber(left.pred_peak_error_pct_abs)) ? toNumber(left.pred_peak_error_pct_abs) : toNumber(left.pred_peak_error_abs);
      return rightValue - leftValue;
    })[0];

  const storyItems = [
    {
      title: "今日摘要",
      text: summary.summary_note || "目前沒有額外的文字摘要。"
    },
    {
      title: "低估壓力",
      text: `全體低估率 ${formatPercent(summary.under_rate)}，Top20 低估率 ${formatPercent(summary.top20_under_rate)}，核心低估率 ${formatPercent(summary.core_under_rate)}。`
    },
    {
      title: "近幾天有沒有更準",
      text: buildRecentAccuracyStory(history)
    },
    {
      title: "分位數表現",
      text: `Q80 coverage ${formatPercent(summary.q80_coverage_rate)}，q50 MAPE ${formatPercentFromPoints(summary.q50_mape)}，objective ${formatDecimal(summary.objective_loss, 2)}。`
    },
    {
      title: strongestRow ? `最亮眼個股：${strongestRow.stock_name}` : "最亮眼個股",
      text: strongestRow
        ? `${strongestRow.stock_name} 排名第 ${formatInteger(strongestRow.model_rank)}，正式預測高點 ${formatNumber(strongestRow.pred_peak_price)}，forecast regime ${formatForecastRegime(strongestRow.forecast_regime)}。`
        : "目前沒有足夠資料。"
    },
    {
      title: worstRow ? `失真最大：${worstRow.stock_name}` : "誤差追蹤",
      text: worstRow
        ? `${worstRow.stock_name} 的高點百分比誤差為 ${formatPercentFromPoints(worstRow.pred_peak_error_pct_abs)}，signed ${formatSignedPoints(worstRow.pred_peak_error_pct_signed)}。`
        : "目前沒有足夠資料。"
    }
  ];

  elements.storyList.innerHTML = storyItems
    .map((item) => `
      <article class="story-item">
        <h3 class="story-title">${escapeHtml(item.title)}</h3>
        <p class="story-text">${escapeHtml(item.text)}</p>
      </article>
    `)
    .join("");
}

function renderActions() {
  if (!elements.actionSummary || !elements.actionPills || !elements.actionList) {
    return;
  }

  const actions = state.data.actions || {};
  const highlights = Array.isArray(actions.highlights) ? actions.highlights : [];
  const recentRunDates = Array.isArray(actions.recent_run_dates) ? actions.recent_run_dates : [];
  const pills = [];

  if (hasNumericValue(actions.total_actions)) {
    pills.push(`<span class="pill"><strong>${formatInteger(actions.total_actions)}</strong> 個動作</span>`);
  }
  if (recentRunDates.length) {
    pills.push(`<span class="pill">最近 ${escapeHtml(formatInteger(recentRunDates.length))} 日：${escapeHtml(recentRunDates.join(" / "))}</span>`);
  }
  if (hasNumericValue(actions.review_count) && toNumber(actions.review_count) > 0) {
    pills.push(`<span class="pill">${escapeHtml(formatInteger(actions.review_count))} 檔 review evidence</span>`);
  }

  elements.actionSummary.textContent = [actions.headline, actions.focus_note]
    .filter(Boolean)
    .join(" ");
  elements.actionPills.innerHTML = pills.join("");

  if (!highlights.length) {
    elements.actionList.innerHTML = `<div class="empty-state">今天沒有新的回寫動作，模型暫時沿用目前 state。</div>`;
    return;
  }

  elements.actionList.innerHTML = highlights
    .map((item) => `
      <article class="action-item ${escapeHtml(item.tone || "tone-neutral")}">
        <div class="action-head">
          <div class="stacked">
            <span class="tag tag-neutral">${escapeHtml(item.group_label || "回寫")}</span>
            <h3 class="story-title">${escapeHtml(item.title || "未命名動作")}</h3>
          </div>
          <strong class="action-value">${escapeHtml(item.value || "未提供")}</strong>
        </div>
        <p class="action-meta">${escapeHtml(item.detail || "目前沒有補充。")}</p>
        <p class="story-text">${escapeHtml(item.note || "目前沒有補充。")}</p>
      </article>
    `)
    .join("");
}

function buildRecentAccuracyStory(history) {
  const comparableEntries = history
    .filter((entry) => ["better", "worse", "mixed", "same"].includes(entry?.accuracy_status))
    .slice(0, 5);

  if (!comparableEntries.length) {
    return history[0]
      ? buildAccuracySummarySentence(history[0])
      : "最近幾天還沒有足夠的資料可比較。";
  }

  const counts = comparableEntries.reduce((result, entry) => {
    result[entry.accuracy_status] = (result[entry.accuracy_status] || 0) + 1;
    return result;
  }, { better: 0, worse: 0, mixed: 0, same: 0 });

  const parts = [];
  if (counts.better) {
    parts.push(`更準 ${counts.better} 天`);
  }
  if (counts.worse) {
    parts.push(`沒更準 ${counts.worse} 天`);
  }
  if (counts.mixed) {
    parts.push(`有些更準 ${counts.mixed} 天`);
  }
  if (counts.same) {
    parts.push(`差不多 ${counts.same} 天`);
  }

  const latestComparable = comparableEntries[0];
  const latestTail = latestComparable?.accuracy_reference_date
    ? `最新一天 ${latestComparable.trade_date} 比 ${latestComparable.accuracy_reference_date} 有沒有更準：${getAccuracyLabel(latestComparable)}。`
    : `最新一天 ${latestComparable.trade_date} 有沒有更準：${getAccuracyLabel(latestComparable)}。`;

  return `最近 ${comparableEntries.length} 個可比較交易日裡，${parts.join("、")}。${latestTail}`;
}

function renderDailyComparisonTable() {
  if (!elements.dailyCompareTableBody) {
    return;
  }

  const history = getDailyHistory();
  if (!history.length) {
    elements.dailyCompareTableBody.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">目前沒有逐日比較資料。</div>
        </td>
      </tr>
    `;
    return;
  }

  elements.dailyCompareTableBody.innerHTML = history
    .map((entry, index) => `
      <tr class="${index === 0 ? "is-latest" : ""}">
        <td>
          <div class="stacked">
            <strong>${escapeHtml(entry.trade_date || "未提供")}</strong>
            <span class="metric-sub">${escapeHtml(entry.source_label || "摘要")}</span>
          </div>
        </td>
        <td><span class="status-badge ${escapeHtml(resolveStatusClass(entry.status))}">${escapeHtml(entry.status_label || "未提供")}</span></td>
        <td>${renderAccuracyCell(entry)}</td>
        <td>${renderV4ComparisonCell(entry)}</td>
        <td>${escapeHtml(formatInteger(entry.verified_stock_count ?? entry.stock_count))}</td>
        <td>${renderHistoryMetricCell(entry, "peak_hit_rate", "percent")}</td>
        <td>${renderHistoryMetricCell(entry, "under_rate", "percent")}</td>
        <td>${renderHistoryMetricCell(entry, "pred_peak_mape", "percentPoints", { lowerIsBetter: true })}</td>
        <td>${renderHistoryMetricCell(entry, "q80_coverage_rate", "percent")}</td>
        <td>${renderHistoryMetricCell(entry, "pred_peak_time_bucket_hit_rate", "percent")}</td>
        <td>${renderHistoryMetricCell(entry, "objective_loss", "decimal", { lowerIsBetter: true })}</td>
      </tr>
    `)
    .join("");
}

function renderAccuracyCell(entry) {
  return `
    <div class="stacked accuracy-cell">
      <span class="status-badge ${escapeHtml(buildAccuracyBadgeClass(entry?.accuracy_status))}">${escapeHtml(getAccuracyLabel(entry))}</span>
      <span class="metric-sub">${escapeHtml(buildAccuracyReferenceText(entry))}</span>
    </div>
  `;
}

function renderHistoryMetricCell(entry, field, format, options = {}) {
  const fallbackValue = options.fallbackValue;
  const value = entry?.[field] ?? fallbackValue;
  if (!hasNumericValue(value)) {
    if (entry?.status !== "verified") {
      return `<span class="metric-sub">待驗證</span>`;
    }
    return `<span class="metric-sub">-</span>`;
  }

  return `<strong>${escapeHtml(formatMetricValue(value, format))}</strong>`;
}

function formatMetricValue(value, format) {
  if (format === "percent") {
    return formatPercent(value);
  }
  if (format === "percentPoints") {
    return formatPercentFromPoints(value);
  }
  if (format === "integer") {
    return formatInteger(value);
  }
  return formatDecimal(value, 2);
}

function renderThemes(rows) {
  const groupedThemes = Array.from(groupBy(rows, (row) => row.theme || "未分類").entries())
    .map(([theme, items]) => ({
      theme,
      count: items.length,
      avgScore: average(items.map((item) => toNumber(item.model_score))),
      hitRate: average(items.map((item) => toNumber(item.peak_hit)))
    }))
    .sort((left, right) => right.avgScore - left.avgScore)
    .slice(0, 8);

  if (!groupedThemes.length) {
    elements.themeBoard.innerHTML = `<div class="empty-state">還沒有主題資料可顯示。</div>`;
    return;
  }

  const maxScore = Math.max(...groupedThemes.map((item) => item.avgScore), 1);
  elements.themeBoard.innerHTML = groupedThemes
    .map((item) => `
      <article class="theme-item">
        <div class="theme-head">
          <strong>${escapeHtml(item.theme)}</strong>
          <span class="mini-note">${formatInteger(item.count)} 檔 / 命中 ${formatPercent(item.hitRate)}</span>
        </div>
        <div class="theme-track">
          <span class="theme-fill" style="width: ${Math.max((item.avgScore / maxScore) * 100, 8)}%"></span>
        </div>
        <span class="mini-note">平均模型分數 ${formatDecimal(item.avgScore, 2)}</span>
      </article>
    `)
    .join("");
}

function renderChecks() {
  const checks = state.data.checks || [];
  const grouped = Array.from(groupBy(checks, (item) => item.check_group || "未分類").entries());
  const passCount = countWhere(checks, (item) => item.status === "pass");
  const failCount = countWhere(checks, (item) => item.status === "fail");

  elements.checkStats.innerHTML = [
    `<span class="pill"><strong>${formatInteger(passCount)}</strong> Pass</span>`,
    `<span class="pill"><strong>${formatInteger(failCount)}</strong> Fail</span>`
  ].join("");

  if (!grouped.length) {
    elements.checkGroups.innerHTML = `<div class="empty-state">還沒有公開檢查資料。</div>`;
    return;
  }

  elements.checkGroups.innerHTML = grouped
    .map(([groupName, items]) => `
      <section class="check-group">
        <div class="check-group-header">
          <h3>${escapeHtml(groupName)}</h3>
          <span class="mini-note">${formatInteger(items.length)} 項</span>
        </div>
        <div class="check-list">
          ${items
            .map((item) => `
              <article class="check-item">
                <span class="status-badge ${item.status === "pass" ? "status-pass" : item.status === "fail" ? "status-fail" : "status-neutral"}">${escapeHtml(item.status || "na")}</span>
                <p class="check-name">${escapeHtml(item.check_name || "未命名檢查")}</p>
                <p class="check-note">${escapeHtml(item.short_note || "沒有補充說明。")}</p>
              </article>
            `)
            .join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderFilterOptions(rows) {
  syncSelectOptions(elements.themeFilter, distinctValues(rows, "theme"), state.filters.theme, "全部主題");
  syncSelectOptions(elements.roleFilter, distinctValues(rows, "role_level"), state.filters.role, "全部層級");
  syncSelectOptions(elements.reviewFilter, distinctValues(rows, "review_tag"), state.filters.review, "全部評語");
}

function renderTable(rows) {
  if (!rows.length) {
    elements.stockTableBody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">目前沒有符合篩選條件的股票。</div>
        </td>
      </tr>
    `;
    return;
  }

  elements.stockTableBody.innerHTML = rows
    .map((row) => `
      <tr data-stock-id="${escapeHtml(row.stock_id)}" class="${row.stock_id === state.selectedStockId ? "is-selected" : ""}">
        <td><span class="rank-chip">${formatInteger(row.model_rank)}</span></td>
        <td>
          <div class="stock-cell">
            <span class="stock-name">${escapeHtml(row.stock_name || "-")}</span>
            <span class="stock-sub">${escapeHtml(row.stock_id || "-")} / ${escapeHtml(row.theme || "未分類")}</span>
          </div>
        </td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatDecimal(row.model_score, 2))}</strong>
            <span class="metric-sub">${escapeHtml(row.role_level || "未分層")} / ${escapeHtml(formatForecastRegime(row.forecast_regime))}</span>
          </div>
        </td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatNumber(sellTargetPrice(row)))}</strong>
            <span class="metric-sub">q60 ${escapeHtml(formatPercentFromPoints(q60Pct(row)))} / q80 ${escapeHtml(formatPercentFromPoints(q80Pct(row)))} / ${escapeHtml(row.pred_peak_time_bucket || "未提供")}</span>
          </div>
        </td>
        <td>${renderV4StockCell(row)}</td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatNumber(row.actual_high))}</strong>
            <span class="metric-sub">${escapeHtml(row.actual_high_time_bucket || "未提供")} / ${escapeHtml(buildOutcomeSummary(row))}</span>
          </div>
        </td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatPercentFromPoints(row.pred_peak_error_pct_abs))}</strong>
            <span class="metric-sub">signed ${escapeHtml(formatSignedPoints(row.pred_peak_error_pct_signed))} / 價差 ${escapeHtml(formatDecimal(row.pred_peak_error_abs, 2))}</span>
          </div>
        </td>
        <td><span class="tag ${toNumber(row.peak_hit) === 1 ? "tag-pass" : "tag-fail"}">${toNumber(row.peak_hit) === 1 ? "命中" : "未命中"}</span></td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(row.review_tag || "未標記")}</strong>
            <span class="metric-sub">reliability ${escapeHtml(formatPercent(row.forecast_reliability || row.pred_confidence))} / uncertainty ${escapeHtml(formatPercentFromPoints(row.dynamic_uncertainty_pct))}</span>
          </div>
        </td>
      </tr>
    `)
    .join("");

  elements.stockTableBody.querySelectorAll("tr[data-stock-id]").forEach((rowElement) => {
    rowElement.addEventListener("click", () => {
      state.selectedStockId = rowElement.dataset.stockId;
      renderDashboard();
    });
  });
}

function renderDetailPanel(filteredRows, rows) {
  const selectedRow = filteredRows.find((row) => row.stock_id === state.selectedStockId)
    || rows.find((row) => row.stock_id === state.selectedStockId);

  if (!selectedRow) {
    elements.detailPanel.innerHTML = `<div class="empty-state">選一檔股票後，這裡會顯示更細的公開資料說明。</div>`;
    return;
  }

  const bucketProbabilityMarkup = renderBucketProbabilityMarkup(selectedRow);
  const forecastComponentMarkup = renderForecastComponentMarkup(selectedRow);
  const reliabilityValue = selectedRow.forecast_reliability || selectedRow.pred_confidence;
  const q50Value = q50Pct(selectedRow);
  const q60Value = q60Pct(selectedRow);
  const q80Value = q80Pct(selectedRow);
  const q90Value = q90Pct(selectedRow);
  const targetPrice = sellTargetPrice(selectedRow);
  const upperPrice = upperBandPrice(selectedRow);

  elements.detailPanel.innerHTML = `
    <div class="detail-head">
      <div>
        <p class="eyebrow">Focused Stock</p>
        <h2>${escapeHtml(selectedRow.stock_name || "-")} <span class="mini-note">(${escapeHtml(selectedRow.stock_id || "-")})</span></h2>
        <p>${escapeHtml(selectedRow.public_note || "這檔股票目前沒有額外補充。")}</p>
      </div>
      <div class="detail-tags">
        <span class="tag">${escapeHtml(selectedRow.theme || "未分類主題")}</span>
        <span class="tag">${escapeHtml(selectedRow.role_level || "未分層")}</span>
        <span class="tag">${escapeHtml(formatForecastRegime(selectedRow.forecast_regime))}</span>
        <span class="tag">${escapeHtml(buildReliabilityLabel(reliabilityValue))}</span>
        <span class="tag ${toNumber(selectedRow.underestimation_flag) === 1 ? "tag-fail" : toNumber(selectedRow.overestimation_flag) === 1 ? "tag-neutral" : "tag-pass"}">${escapeHtml(buildOutcomeSummary(selectedRow))}</span>
        <span class="tag">${toNumber(selectedRow.peak_hit) === 1 ? "命中高點" : "未命中"}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-metric">
        <small>模型分數</small>
        <strong>${escapeHtml(formatDecimal(selectedRow.model_score, 2))}</strong>
        <span class="detail-metric-note">${escapeHtml(selectedRow.role_level || "未分層")}</span>
      </div>
      <div class="detail-metric">
        <small>正式高點預測</small>
        <strong>${escapeHtml(formatNumber(targetPrice))}</strong>
        <span class="detail-metric-note">q60 sell target ${escapeHtml(formatPercentFromPoints(q60Value))}</span>
      </div>
      <div class="detail-metric">
        <small>q50 / q60 / q80 / q90</small>
        <strong>${escapeHtml(formatPercentFromPoints(q50Value))} / ${escapeHtml(formatPercentFromPoints(q60Value))} / ${escapeHtml(formatPercentFromPoints(q80Value))} / ${escapeHtml(formatPercentFromPoints(q90Value))}</strong>
        <span class="detail-metric-note">分位數高點預測</span>
      </div>
      <div class="detail-metric">
        <small>可靠度 / 不確定性</small>
        <strong>${escapeHtml(formatPercent(reliabilityValue))} / ${escapeHtml(formatPercentFromPoints(selectedRow.dynamic_uncertainty_pct))}</strong>
        <span class="detail-metric-note">forecast reliability / dynamic uncertainty</span>
      </div>
      <div class="detail-metric">
        <small>Dynamic Cap</small>
        <strong>${escapeHtml(formatPercentFromPoints(selectedRow.forecast_cap_pct))}</strong>
        <span class="detail-metric-note">${escapeHtml(formatForecastRegime(selectedRow.forecast_regime))}</span>
      </div>
      <div class="detail-metric">
        <small>預測區間</small>
        <strong>${escapeHtml(selectedRow.pred_peak_range || "未提供")}</strong>
        <span class="detail-metric-note">${escapeHtml(selectedRow.pred_peak_time_bucket || "未提供")}</span>
      </div>
      <div class="detail-metric">
        <small>q80 樂觀上緣</small>
        <strong>${escapeHtml(formatNumber(upperPrice))}</strong>
        <span class="detail-metric-note">${escapeHtml(formatPercentFromPoints(q80Value))}</span>
      </div>
      <div class="detail-metric">
        <small>高點誤差</small>
        <strong>${escapeHtml(formatPercentFromPoints(selectedRow.pred_peak_error_pct_abs))}</strong>
        <span class="detail-metric-note">signed ${escapeHtml(formatSignedPoints(selectedRow.pred_peak_error_pct_signed))} / 價差 ${escapeHtml(formatDecimal(selectedRow.pred_peak_error_abs, 2))}</span>
      </div>
    </div>
    <div class="detail-sections">
      <section class="detail-section">
        <div class="detail-section-head">
          <h3>高點時段機率</h3>
          <span class="mini-note">bucket probability</span>
        </div>
        ${bucketProbabilityMarkup}
      </section>
      <section class="detail-section">
        <div class="detail-section-head">
          <h3>預測拆解</h3>
          <span class="mini-note">forecast components</span>
        </div>
        ${forecastComponentMarkup}
      </section>
    </div>
    <div class="detail-copy">
      <p>正式預測使用 q60 賣價目標。這檔 q60 目標 ${escapeHtml(formatNumber(targetPrice))}，q80 樂觀上緣 ${escapeHtml(formatNumber(upperPrice))}，實際高點 ${escapeHtml(formatNumber(selectedRow.actual_high))}，預測時段 ${escapeHtml(selectedRow.pred_peak_time_bucket || "未提供")}，實際時段 ${escapeHtml(selectedRow.actual_high_time_bucket || "未提供")}。</p>
      <p>狀態：${escapeHtml(buildOutcomeSummary(selectedRow))}，forecast regime ${escapeHtml(formatForecastRegime(selectedRow.forecast_regime))}，reliability ${escapeHtml(buildReliabilityLabel(reliabilityValue))}。</p>
      <p>模型評語：${escapeHtml(selectedRow.review_note || "目前沒有額外備註。")}</p>
    </div>
  `;
}

function applyFilters(rows) {
  return rows.filter((row) => {
    const haystack = [row.stock_id, row.stock_name, row.theme, row.review_tag]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (!state.filters.search || haystack.includes(state.filters.search))
      && (!state.filters.theme || row.theme === state.filters.theme)
      && (!state.filters.role || row.role_level === state.filters.role)
      && (!state.filters.review || row.review_tag === state.filters.review);
  });
}

function syncSelectOptions(selectElement, values, selectedValue, placeholder) {
  selectElement.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
    .concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
  selectElement.value = values.includes(selectedValue) ? selectedValue : "";
}

function distinctValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-Hant"));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    let hasReloadedForServiceWorker = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasReloadedForServiceWorker) {
        return;
      }
      hasReloadedForServiceWorker = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("./service-worker-v12.js")
      .then((registration) => {
        void registration.update();
      })
      .catch(() => {
        // Ignore optional offline support errors.
      });
  });
}

function startLiveRefresh() {
  if (window.location.protocol === "file:") {
    return;
  }

  window.setInterval(() => {
    if (document.visibilityState === "visible") {
      void refreshLiveData();
    }
  }, LIVE_REFRESH_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshLiveData();
    }
  });

  window.addEventListener("focus", () => {
    void refreshLiveData();
  });
}

async function refreshLiveData({ silent = false } = {}) {
  try {
    const response = await fetch(DATA_JSON_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch live data: ${response.status}`);
    }

    const nextData = await response.json();
    if (shouldHydrateData(nextData) || hasNewerData(nextData)) {
      state.data = nextData;
      renderDashboard();
    }
  } catch (error) {
    if (!silent) {
      console.warn(error);
    }
  }
}

function shouldHydrateData(nextData) {
  return (state.data?.stocks?.length || 0) === 0 && (nextData?.stocks?.length || 0) > 0;
}

function hasNewerData(nextData) {
  const currentVersion = state.data?.summary?.generated_at || "";
  const nextVersion = nextData?.summary?.generated_at || "";
  return Boolean(nextVersion) && currentVersion !== nextVersion;
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
    return groups;
  }, new Map());
}

function countWhere(items, predicate) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function average(values) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) {
    return 0;
  }
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

function toNumber(value) {
  if (typeof value === "number") {
    return value;
  }
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  if (!normalized) {
    return Number.NaN;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

function toMaybeNumber(value) {
  return toNumber(value);
}

function formatInteger(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? String(Math.round(number)) : "-";
}

function formatDecimal(value, digits = 2) {
  const number = toNumber(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "-";
}

function formatNumber(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  return number.toLocaleString("zh-TW", {
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function formatSignedNumber(value, digits = 2) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(digits)}`;
}

function formatSignedCurrency(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${Math.round(number).toLocaleString("zh-TW")}`;
}

function formatPercent(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "-";
}

function formatPercentFromPoints(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "-";
}

function formatSignedPercentPoints(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatSignedPoints(value, digits = 2) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(digits)}%`;
}

function formatForecastRegime(value) {
  const mapping = {
    normal: "一般",
    hot: "熱主題",
    runaway: "Runaway"
  };
  return mapping[String(value || "").trim().toLowerCase()] || "未提供";
}

function buildReliabilityLabel(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) {
    return "可靠度未提供";
  }
  if (number >= 0.8) {
    return "高可靠";
  }
  if (number >= 0.65) {
    return "中高可靠";
  }
  if (number >= 0.5) {
    return "中性可靠";
  }
  return "高波動";
}

function buildOutcomeSummary(row) {
  if (toNumber(row.underestimation_flag) === 1 || String(row.review_tag || "").includes("低估")) {
    return "偏低估";
  }
  if (toNumber(row.overestimation_flag) === 1 || String(row.review_tag || "").includes("高估")) {
    return "偏高估";
  }
  if (toNumber(row.peak_hit) === 1) {
    return "高點接近";
  }
  return row.review_tag || "待觀察";
}

function parseJsonRecord(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function renderBucketProbabilityMarkup(row) {
  const bucketMap = parseJsonRecord(row.pred_peak_time_bucket_probs);
  const entries = bucketMap
    ? Object.entries(bucketMap)
      .map(([label, probability]) => [label, toNumber(probability)])
      .filter(([, probability]) => Number.isFinite(probability))
      .sort((left, right) => right[1] - left[1])
    : [];

  if (!entries.length) {
    return `<div class="empty-state subtle-empty">目前沒有公開的 bucket probability。</div>`;
  }

  return `
    <div class="probability-list">
      ${entries
        .map(([label, probability]) => `
          <div class="probability-row">
            <div class="probability-meta">
              <strong>${escapeHtml(label)}</strong>
              <span>${escapeHtml(formatPercent(probability))}</span>
            </div>
            <div class="probability-track">
              <span class="probability-fill" style="width:${Math.max(0, Math.min(100, probability * 100)).toFixed(1)}%"></span>
            </div>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function renderForecastComponentMarkup(row) {
  const componentMap = parseJsonRecord(row.forecast_components);
  if (!componentMap) {
    return `<div class="empty-state subtle-empty">目前沒有公開的 forecast components。</div>`;
  }

  const labelMap = {
    base_score_upside: "Base",
    rank_adj: "Rank",
    theme_adj: "Theme",
    role_adj: "Role",
    market_adj: "Market",
    review_state_adj: "Review",
    stock_override_adj: "Stock Override",
    dynamic_uncertainty_pct: "Uncertainty",
    cap_pct: "Cap",
    final_pct_before_cap: "Before Cap",
    final_pct_after_cap: "After Cap"
  };

  const entries = Object.entries(componentMap)
    .map(([key, rawValue]) => [key, toNumber(rawValue)])
    .filter(([, numericValue]) => Number.isFinite(numericValue));

  if (!entries.length) {
    return `<div class="empty-state subtle-empty">目前沒有可顯示的 component 數值。</div>`;
  }

  return `
    <div class="component-grid">
      ${entries
        .map(([key, numericValue]) => `
          <article class="component-chip">
            <span class="component-label">${escapeHtml(labelMap[key] || key)}</span>
            <strong>${escapeHtml(formatSignedPoints(numericValue))}</strong>
          </article>
        `)
        .join("")}
    </div>
  `;
}

function formatDateTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return "未提供";
  }

  return date.toLocaleString("zh-TW", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
