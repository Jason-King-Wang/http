const state = {
  data: window.__PUBLIC_SELL_MODEL_DATA__ || { summary: {}, daily_history: [], checks: [], stocks: [] },
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

const elements = {
  dailySummaryNote: document.querySelector("#summary-daily-summary-note"),
  dailyComparison: document.querySelector("#summary-daily-comparison"),
  dailyHistoryList: document.querySelector("#summary-daily-history-list"),
  heroMeta: document.querySelector("#hero-meta"),
  sourceSummary: document.querySelector("#source-summary"),
  publicScope: document.querySelector("#public-scope"),
  summaryCards: document.querySelector("#summary-cards"),
  storyList: document.querySelector("#story-list"),
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
  renderStories(rows);
  renderThemes(rows);
  renderChecks();
  renderFilterOptions(rows);
  renderTable(filteredRows);
  renderDetailPanel(filteredRows, rows);
}

function renderHero() {
  const summary = state.data.summary || {};
  const rows = state.data.stocks || [];
  const dailyHistory = getDailyHistory();

  const tags = [
    `最新資料日 ${summary.target_trade_date || "未提供"}`,
    `${formatInteger(summary.verified_stock_count)} 檔驗證樣本`,
    `${formatInteger(rows.length)} 檔公開個股`,
    `公開整理 ${formatDateTime(summary.generated_at)}`,
    `逐日摘要 ${formatInteger(dailyHistory.length)} 天`
  ];

  elements.heroMeta.innerHTML = tags.map((text) => `<span class="pill">${escapeHtml(text)}</span>`).join("");
  elements.sourceSummary.textContent = [
    "目前只展示最新賣價模型資料，不包含內部分流規則、邏輯標記與判斷文字。",
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
    .map((entry, index) => renderDailyHistoryCard(entry, index === 0))
    .join("");
}

function buildDailySummaryNote(latest, previous, comparisonBase, historyCount) {
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
      label: "平均信心",
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

  if (hasVerifiedMetrics(latest)) {
    metrics.push({
      label: "峰值命中率",
      value: formatPercent(latest.peak_hit_rate),
      note: buildDeltaNote(latest.peak_hit_rate, comparisonBase?.peak_hit_rate, comparisonBase?.trade_date, "percent"),
      tone: buildDeltaTone(latest.peak_hit_rate, comparisonBase?.peak_hit_rate)
    });
    metrics.push({
      label: "價格 MAE",
      value: formatDecimal(latest.pred_peak_mae, 2),
      note: buildDeltaNote(latest.pred_peak_mae, comparisonBase?.pred_peak_mae, comparisonBase?.trade_date, "decimal", { lowerIsBetter: true }),
      tone: buildDeltaTone(latest.pred_peak_mae, comparisonBase?.pred_peak_mae, { lowerIsBetter: true })
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

function resolveStatusClass(status) {
  return status === "verified" ? "status-pass" : "status-neutral";
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
  if (format === "integer") {
    return `${sign}${Math.round(delta)}`;
  }
  return `${sign}${delta.toFixed(2)}`;
}

function renderPublicScope() {
  const items = [
    "保留最新 sell model 的整體摘要與個股結果。",
    "移除內部分流邏輯、關聯標記與內部規則來源。",
    "移除會透露模型判斷來源的訊號摘要與邏輯標記。"
  ];

  elements.publicScope.innerHTML = items
    .map((text) => `<article class="story-item"><p class="story-text">${escapeHtml(text)}</p></article>`)
    .join("");
}

function renderSummaryCards() {
  const summary = state.data.summary || {};
  const checks = state.data.checks || [];
  const metrics = [
    {
      label: "峰值命中率",
      value: formatPercent(summary.peak_hit_rate),
      note: `${formatInteger(summary.verified_stock_count)} 檔驗證樣本`
    },
    {
      label: "Top10 命中率",
      value: formatPercent(summary.top10_hit_rate),
      note: `Top20 ${formatPercent(summary.top20_hit_rate)} / Top30 ${formatPercent(summary.top30_hit_rate)}`
    },
    {
      label: "價格 MAE",
      value: formatDecimal(summary.pred_peak_mae, 2),
      note: "預測高點與實際高點的平均絕對誤差"
    },
    {
      label: "時間命中率",
      value: formatPercent(summary.pred_peak_time_bucket_hit_rate),
      note: "高點時間區間是否預測正確"
    },
    {
      label: "50 點分數",
      value: formatDecimal(summary.fifty_point_score, 2),
      note: `${countWhere(checks, (item) => item.status === "pass")} pass / ${countWhere(checks, (item) => item.status === "fail")} fail`
    },
    {
      label: "規則候選數",
      value: formatInteger(summary.rule_candidate_count),
      note: "僅顯示數量，不公開內部判斷來源"
    }
  ];

  elements.summaryCards.innerHTML = metrics
    .map((metric) => `
      <article class="metric-card">
        <span class="metric-label">${escapeHtml(metric.label)}</span>
        <strong class="metric-value">${escapeHtml(metric.value)}</strong>
        <p class="metric-note">${escapeHtml(metric.note)}</p>
      </article>
    `)
    .join("");
}

function renderStories(rows) {
  const summary = state.data.summary || {};
  const strongestRow = [...rows]
    .filter((row) => toNumber(row.peak_hit) === 1)
    .sort((left, right) => toNumber(left.model_rank) - toNumber(right.model_rank))[0];
  const worstRow = [...rows]
    .filter((row) => Number.isFinite(toNumber(row.pred_peak_error_abs)))
    .sort((left, right) => toNumber(right.pred_peak_error_abs) - toNumber(left.pred_peak_error_abs))[0];

  const storyItems = [
    {
      title: "今日摘要",
      text: summary.summary_note || "目前沒有額外的文字摘要。"
    },
    {
      title: "排名前段表現",
      text: `Top10 命中率 ${formatPercent(summary.top10_hit_rate)}，Top30 命中率 ${formatPercent(summary.top30_hit_rate)}。`
    },
    {
      title: strongestRow ? `最亮眼個股：${strongestRow.stock_name}` : "最亮眼個股",
      text: strongestRow
        ? `${strongestRow.stock_name} 排名第 ${formatInteger(strongestRow.model_rank)}，預測高點 ${formatNumber(strongestRow.pred_peak_price)}，實際高點 ${formatNumber(strongestRow.actual_high)}。`
        : "目前沒有足夠資料。"
    },
    {
      title: worstRow ? `誤差最大：${worstRow.stock_name}` : "誤差追蹤",
      text: worstRow
        ? `${worstRow.stock_name} 的高點絕對誤差為 ${formatDecimal(worstRow.pred_peak_error_abs, 2)}。`
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
        <td colspan="8">
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
            <span class="metric-sub">${escapeHtml(row.role_level || "未分層")}</span>
          </div>
        </td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatNumber(row.pred_peak_price))}</strong>
            <span class="metric-sub">${escapeHtml(row.pred_peak_time_bucket || "未提供")} / upside ${escapeHtml(formatPercentFromPoints(row.pred_remaining_upside_from_now))}</span>
          </div>
        </td>
        <td>
          <div class="stacked">
            <strong>${escapeHtml(formatNumber(row.actual_high))}</strong>
            <span class="metric-sub">${escapeHtml(row.actual_high_time_bucket || "未提供")}</span>
          </div>
        </td>
        <td><strong>${escapeHtml(formatDecimal(row.pred_peak_error_abs, 2))}</strong></td>
        <td><span class="tag ${toNumber(row.peak_hit) === 1 ? "tag-pass" : "tag-fail"}">${toNumber(row.peak_hit) === 1 ? "命中" : "未命中"}</span></td>
        <td>${escapeHtml(row.review_tag || "未標記")}</td>
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
        <span class="tag">${toNumber(selectedRow.peak_hit) === 1 ? "命中高點" : "未命中"}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-metric">
        <small>模型分數</small>
        <strong>${escapeHtml(formatDecimal(selectedRow.model_score, 2))}</strong>
      </div>
      <div class="detail-metric">
        <small>預測區間</small>
        <strong>${escapeHtml(selectedRow.pred_peak_range || "未提供")}</strong>
      </div>
      <div class="detail-metric">
        <small>階段賣點</small>
        <strong>${escapeHtml(formatNumber(selectedRow.stage_1_price))} / ${escapeHtml(formatNumber(selectedRow.stage_2_price))}</strong>
      </div>
      <div class="detail-metric">
        <small>高點誤差</small>
        <strong>${escapeHtml(formatDecimal(selectedRow.pred_peak_error_abs, 2))}</strong>
      </div>
    </div>
    <div class="detail-copy">
      <p>預測高點 ${escapeHtml(formatNumber(selectedRow.pred_peak_price))}，實際高點 ${escapeHtml(formatNumber(selectedRow.actual_high))}，預測時段 ${escapeHtml(selectedRow.pred_peak_time_bucket || "未提供")}，實際時段 ${escapeHtml(selectedRow.actual_high_time_bucket || "未提供")}。</p>
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

    navigator.serviceWorker.register("./service-worker.js")
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

function formatPercent(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "-";
}

function formatPercentFromPoints(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "-";
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
