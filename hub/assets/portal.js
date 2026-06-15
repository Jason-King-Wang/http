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

const AB_HISTORY_EAGER_DETAIL_COUNT = 2;

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
    return window.__SHORT_TERM_RADAR_DATA__ || null;
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

function radarChartStockTrigger(item, selectedDate, className = "") {
  const symbol = String(item?.symbol ?? "").trim();
  const name = String(item?.name ?? "").trim();
  const label = [symbol, name].filter(Boolean).join(" ") || "--";
  if (!symbol) {
    return `<span>${escapeHtml(label)}</span>`;
  }
  return `
    <button
      type="button"
      class="radar-stock-trigger ${escapeHtml(className)}"
      data-weekly-symbol="${escapeHtml(symbol)}"
      data-weekly-name="${escapeHtml(name)}"
      data-weekly-date="${escapeHtml(selectedDate || "")}"
      aria-label="${escapeHtml(`查看 ${label} 周K`)}"
    >${escapeHtml(label)}</button>
  `;
}

function radarWeeklyChartEntry(payload, symbol) {
  const charts = payload?.weeklyCharts || window.__RADAR_WEEKLY_CHARTS__ || {};
  const bySymbol = charts?.bySymbol || {};
  return bySymbol[String(symbol || "").trim()] || null;
}

function weeklyChartContextWindow(entry, selectedDate, payload) {
  const candles = Array.isArray(entry?.candles) ? entry.candles : [];
  if (!candles.length) {
    return { visible: [], selectedIndex: -1, signalWeek: "", lookbackWeeks: 0 };
  }
  const chartMeta = payload?.weeklyCharts || {};
  const lookbackWeeks = Math.max(0, Math.round(asNumber(entry?.lookbackWeeks) ?? asNumber(chartMeta?.lookbackWeeks) ?? 52));
  const signalDate = selectedDate || entry?.firstSelectedDate || "";
  let selectedIndex = signalDate ? candles.findIndex((item) => String(item.week || "") >= signalDate) : -1;
  if (selectedIndex < 0) {
    selectedIndex = candles.length - 1;
  }
  const startIndex = Math.max(0, selectedIndex - lookbackWeeks);
  const visible = candles.slice(startIndex);
  return {
    visible,
    selectedIndex: selectedIndex - startIndex,
    signalWeek: candles[selectedIndex]?.week || signalDate,
    lookbackWeeks,
  };
}

function renderRadarWeeklyChart(symbol, name, selectedDate, payload) {
  const entry = radarWeeklyChartEntry(payload, symbol);
  const stockLabel = [symbol, name || entry?.name].filter(Boolean).join(" ");
  if (!entry || !Array.isArray(entry.candles) || !entry.candles.length) {
    return `
      <div class="radar-weekly-chart">
        <div class="weekly-chart-empty">
          <strong>${escapeHtml(stockLabel || symbol || "--")}</strong>
          <span>本機日K目前沒有可聚合的周K資料。</span>
        </div>
      </div>
    `;
  }

  const startDate = selectedDate || entry.firstSelectedDate || "";
  const candles = startDate ? entry.candles.filter((item) => String(item.week || "") >= startDate) : entry.candles;
  const visible = candles.length ? candles : entry.candles;
  const first = visible[0] || {};
  const last = visible[visible.length - 1] || {};
  const firstBase = asNumber(first.open) ?? asNumber(first.close);
  const lastClose = asNumber(last.close);
  const returnPct = firstBase && lastClose !== null ? (lastClose - firstBase) / firstBase : null;
  const returnClass = returnPct === null ? "trend-flat" : returnPct >= 0 ? "trend-positive" : "trend-negative";

  return `
    <div class="radar-weekly-chart">
      <div class="weekly-chart-head">
        <div>
          <strong>${escapeHtml(stockLabel || symbol)}</strong>
          <span>周K｜上榜日 ${escapeHtml(startDate || "--")} 到 ${escapeHtml(entry.lastDate || last.week || "--")}</span>
        </div>
        <div class="weekly-chart-metrics">
          <span>${escapeHtml(formatNumber(visible.length))} 周</span>
          <span>最新 ${escapeHtml(formatNumber(lastClose))}</span>
          <span class="${returnClass}">${escapeHtml(formatPct(returnPct))}</span>
        </div>
      </div>
      ${renderRadarWeeklyCandlesSvg(visible)}
      <div class="weekly-chart-note">紅K代表周收盤高於周開盤，綠K代表低於周開盤；資料由本機日K每周重新聚合。</div>
    </div>
  `;
}

function renderRadarWeeklyCandlesSvg(candles) {
  const rows = candles
    .map((item) => ({
      week: item.week,
      open: asNumber(item.open),
      high: asNumber(item.high),
      low: asNumber(item.low),
      close: asNumber(item.close),
    }))
    .filter((item) => item.week && item.open !== null && item.high !== null && item.low !== null && item.close !== null);
  if (!rows.length) {
    return '<div class="weekly-chart-empty"><span>周K資料不足。</span></div>';
  }

  const width = Math.max(720, rows.length * 9 + 80);
  const height = 260;
  const padX = 46;
  const padTop = 18;
  const padBottom = 34;
  const highs = rows.map((item) => item.high);
  const lows = rows.map((item) => item.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const span = maxPrice - minPrice || Math.max(maxPrice, 1);
  const y = (value) => padTop + ((maxPrice - value) / span) * (height - padTop - padBottom);
  const step = (width - padX * 2) / Math.max(rows.length, 1);
  const candleWidth = Math.max(3, Math.min(8, step * 0.56));

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const price = maxPrice - span * ratio;
      const yy = y(price);
      return `<g class="weekly-grid"><line x1="${padX}" y1="${yy.toFixed(2)}" x2="${width - padX}" y2="${yy.toFixed(2)}"></line><text x="8" y="${(yy + 4).toFixed(2)}">${escapeHtml(formatNumber(price))}</text></g>`;
    })
    .join("");

  const bodies = rows
    .map((item, index) => {
      const x = padX + index * step + step / 2;
      const yHigh = y(item.high);
      const yLow = y(item.low);
      const yOpen = y(item.open);
      const yClose = y(item.close);
      const top = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      const klass = item.close >= item.open ? "weekly-candle-up" : "weekly-candle-down";
      return `<g class="${klass}"><line x1="${x.toFixed(2)}" y1="${yHigh.toFixed(2)}" x2="${x.toFixed(2)}" y2="${yLow.toFixed(2)}"></line><rect x="${(x - candleWidth / 2).toFixed(2)}" y="${top.toFixed(2)}" width="${candleWidth.toFixed(2)}" height="${bodyHeight.toFixed(2)}" rx="1"></rect></g>`;
    })
    .join("");

  const first = rows[0]?.week || "";
  const last = rows[rows.length - 1]?.week || "";
  return `
    <svg class="weekly-k-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="weekly candlestick chart">
      ${grid}
      ${bodies}
      <g class="weekly-axis">
        <line x1="${padX}" y1="${height - padBottom}" x2="${width - padX}" y2="${height - padBottom}"></line>
        <text x="${padX}" y="${height - 10}">${escapeHtml(first)}</text>
        <text x="${width - padX}" y="${height - 10}" text-anchor="end">${escapeHtml(last)}</text>
      </g>
    </svg>
  `;
}

function renderRadarWeeklyChartContextual(symbol, name, selectedDate, payload) {
  const entry = radarWeeklyChartEntry(payload, symbol);
  const stockLabel = [symbol, name || entry?.name].filter(Boolean).join(" ");
  if (!entry || !Array.isArray(entry.candles) || !entry.candles.length) {
    return `
      <div class="radar-weekly-chart">
        <div class="weekly-chart-empty">
          <strong>${escapeHtml(stockLabel || symbol || "--")}</strong>
          <span>本機日K目前沒有可聚合的周K資料。</span>
        </div>
      </div>
    `;
  }

  const signalDate = selectedDate || entry.firstSelectedDate || "";
  const windowed = weeklyChartContextWindow(entry, signalDate, payload);
  const visible = windowed.visible.length ? windowed.visible : entry.candles;
  const first = visible[0] || {};
  const last = visible[visible.length - 1] || {};
  const firstBase = asNumber(first.open) ?? asNumber(first.close);
  const lastClose = asNumber(last.close);
  const returnPct = firstBase && lastClose !== null ? (lastClose - firstBase) / firstBase : null;
  const returnClass = returnPct === null ? "trend-flat" : returnPct >= 0 ? "trend-positive" : "trend-negative";

  return `
    <div class="radar-weekly-chart">
      <div class="weekly-chart-head">
        <div>
          <strong>${escapeHtml(stockLabel || symbol)}</strong>
          <span>周K｜上榜日 ${escapeHtml(signalDate || "--")}，標在 ${escapeHtml(windowed.signalWeek || "--")}｜顯示 ${escapeHtml(first.week || "--")} 到 ${escapeHtml(entry.lastDate || last.week || "--")}</span>
        </div>
        <div class="weekly-chart-metrics">
          <span>${escapeHtml(formatNumber(visible.length))} 周</span>
          <span>前置 ${escapeHtml(formatNumber(windowed.lookbackWeeks))} 周</span>
          <span>最新 ${escapeHtml(formatNumber(lastClose))}</span>
          <span class="${returnClass}">${escapeHtml(formatPct(returnPct))}</span>
        </div>
      </div>
      ${renderRadarWeeklyCandlesSvgContextual(visible, windowed.selectedIndex)}
      <div class="weekly-chart-note">垂直標線是該列的上榜週；左側保留上榜前背景，右側一路顯示到目前本機最新周K。</div>
    </div>
  `;
}

function renderRadarWeeklyCandlesSvgContextual(candles, selectedIndex = -1) {
  const rows = candles
    .map((item) => ({
      week: item.week,
      open: asNumber(item.open),
      high: asNumber(item.high),
      low: asNumber(item.low),
      close: asNumber(item.close),
    }))
    .filter((item) => item.week && item.open !== null && item.high !== null && item.low !== null && item.close !== null);
  if (!rows.length) {
    return '<div class="weekly-chart-empty"><span>周K資料不足。</span></div>';
  }

  const width = Math.max(720, rows.length * 9 + 80);
  const height = 260;
  const padX = 46;
  const padTop = 18;
  const padBottom = 34;
  const highs = rows.map((item) => item.high);
  const lows = rows.map((item) => item.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const span = maxPrice - minPrice || Math.max(maxPrice, 1);
  const y = (value) => padTop + ((maxPrice - value) / span) * (height - padTop - padBottom);
  const step = (width - padX * 2) / Math.max(rows.length, 1);
  const candleWidth = Math.max(3, Math.min(8, step * 0.56));

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const price = maxPrice - span * ratio;
      const yy = y(price);
      return `<g class="weekly-grid"><line x1="${padX}" y1="${yy.toFixed(2)}" x2="${width - padX}" y2="${yy.toFixed(2)}"></line><text x="8" y="${(yy + 4).toFixed(2)}">${escapeHtml(formatNumber(price))}</text></g>`;
    })
    .join("");

  const bodies = rows
    .map((item, index) => {
      const x = padX + index * step + step / 2;
      const yHigh = y(item.high);
      const yLow = y(item.low);
      const yOpen = y(item.open);
      const yClose = y(item.close);
      const top = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      const klass = item.close >= item.open ? "weekly-candle-up" : "weekly-candle-down";
      return `<g class="${klass}"><line x1="${x.toFixed(2)}" y1="${yHigh.toFixed(2)}" x2="${x.toFixed(2)}" y2="${yLow.toFixed(2)}"></line><rect x="${(x - candleWidth / 2).toFixed(2)}" y="${top.toFixed(2)}" width="${candleWidth.toFixed(2)}" height="${bodyHeight.toFixed(2)}" rx="1"></rect></g>`;
    })
    .join("");

  const marker =
    selectedIndex >= 0 && selectedIndex < rows.length
      ? (() => {
          const x = padX + selectedIndex * step + step / 2;
          const textX = Math.min(width - padX, x + 6);
          const textAnchor = x > width - padX - 64 ? "end" : "start";
          return `
            <g class="weekly-signal-marker">
              <line x1="${x.toFixed(2)}" y1="${padTop}" x2="${x.toFixed(2)}" y2="${height - padBottom}"></line>
              <text x="${textX.toFixed(2)}" y="${padTop + 13}" text-anchor="${textAnchor}">上榜週</text>
            </g>
          `;
        })()
      : "";

  const first = rows[0]?.week || "";
  const last = rows[rows.length - 1]?.week || "";
  return `
    <svg class="weekly-k-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="weekly candlestick chart">
      ${grid}
      ${bodies}
      ${marker}
      <g class="weekly-axis">
        <line x1="${padX}" y1="${height - padBottom}" x2="${width - padX}" y2="${height - padBottom}"></line>
        <text x="${padX}" y="${height - 10}">${escapeHtml(first)}</text>
        <text x="${width - padX}" y="${height - 10}" text-anchor="end">${escapeHtml(last)}</text>
      </g>
    </svg>
  `;
}

function closeRadarWeeklyCharts(root) {
  root.querySelectorAll(".radar-weekly-chart-row, .radar-weekly-chart-list-item, .radar-weekly-chart-block").forEach((node) => node.remove());
  root.querySelectorAll(".radar-stock-trigger.is-active").forEach((node) => node.classList.remove("is-active"));
}

function wireRadarWeeklyChartToggles(root, payload) {
  if (!root) {
    return;
  }
  root.__radarPayload = payload || {};
  if (root.dataset.weeklyChartWired === "1") {
    return;
  }
  root.dataset.weeklyChartWired = "1";
  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-weekly-symbol]");
    if (!trigger || !root.contains(trigger)) {
      return;
    }
    event.preventDefault();
    const wasActive = trigger.classList.contains("is-active");
    const symbol = trigger.dataset.weeklySymbol || "";
    const name = trigger.dataset.weeklyName || "";
    const selectedDate = trigger.dataset.weeklyDate || "";
    const payloadForChart = root.__radarPayload || window.__SHORT_TERM_RADAR_CURRENT_PAYLOAD__ || {};
    closeRadarWeeklyCharts(root);
    if (wasActive) {
      return;
    }
    trigger.classList.add("is-active");
    const chartHtml = renderRadarWeeklyChartContextual(symbol, name, selectedDate, payloadForChart);
    const row = trigger.closest("tr");
    if (row) {
      const chartRow = document.createElement("tr");
      chartRow.className = "radar-weekly-chart-row";
      const cell = document.createElement("td");
      cell.colSpan = Math.max(row.children.length, 1);
      cell.innerHTML = chartHtml;
      chartRow.appendChild(cell);
      row.after(chartRow);
      return;
    }
    const item = trigger.closest("li");
    if (item) {
      const chartItem = document.createElement("li");
      chartItem.className = "radar-weekly-chart-list-item";
      chartItem.innerHTML = chartHtml;
      item.after(chartItem);
      return;
    }
    const block = document.createElement("div");
    block.className = "radar-weekly-chart-block";
    block.innerHTML = chartHtml;
    trigger.after(block);
  });
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

function renderHelpCard(key, title, rows, note = "") {
  const body = rows
    .map(
      ([label, description]) => `
        <div class="radar-help-row">
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(description)}</dd>
        </div>
      `
    )
    .join("");
  const noteHtml = note ? `<p class="radar-help-note">${escapeHtml(note)}</p>` : "";
  return `
    <details class="radar-help-card" data-help-key="${escapeHtml(key)}">
      <summary>
        <span class="radar-help-kicker">說明</span>
        <strong>${escapeHtml(title)}</strong>
      </summary>
      <div class="radar-help-body">
        <dl>${body}</dl>
        ${noteHtml}
      </div>
    </details>
  `;
}

function mountHelpCard(anchor, key, title, rows, note = "", position = "beforebegin") {
  if (!anchor) {
    return;
  }
  const html = renderHelpCard(key, title, rows, note);
  const existing = document.querySelector(`[data-help-key="${key}"]`);
  if (existing) {
    existing.outerHTML = html;
    return;
  }
  anchor.insertAdjacentHTML(position, html);
}

const RADAR_HELP = {
  overview: [
    ["這頁用途", "短線雷達是研究用選股雷達，目標是找出短中期可能強勢的股票，不是自動下單系統。"],
    ["資料時間", "頁面上的日期代表目前公開 snapshot 的出榜日；名單用當天以前可取得的資料產生。"],
    ["怎麼看", "先看黃金榜和成效追蹤，再看普通 Top20 名單與個股細節。"],
  ],
  summary: [
    ["出榜日", "這份短線雷達名單對應的交易日。"],
    ["候選數", "本次公開列出的股票數量。"],
    ["分數", "雷達綜合動能、相對強度、籌碼、營收、族群與風險後的排序分數。"],
    ["覆蓋", "這是資料完整度，不是勝率；越接近 100% 代表可用資料越完整。"],
  ],
  effectiveness: [
    ["X 軸", "每一個點是一個歷史出榜日，也就是那一天產生的黃金榜或 Top20。"],
    ["Y 軸", "那天出榜後，往後持有 20 / 60 / 120 個交易日的平均漲跌幅。"],
    ["虛線", "橘色水平虛線是 0% 基準線；線在上方代表該出榜日往後報酬為正。"],
    ["黃金榜", "連續 10 個交易日都在 Top20 內的精選名單。"],
    ["普通 Top20", "同一天原始短線雷達 Top20，沒有經過連續上榜條件過濾。"],
    ["外部最佳", "同一天同一區間，在 0050、台積電、台股加權三者裡表現最好的 benchmark。"],
    ["樣本天", "可計算該 horizon 的歷史出榜日數；越長的 120 日會少掉較近期還沒滿 120 日的出榜日。"],
  ],
  golden: [
    ["黃金榜", "用穩定性過濾普通 Top20：必須連續 10 個交易日都在 Top20。"],
    ["Top5 / Top10 / Top20 tier", "如果這 10 天每天都在 Top5，就列為 Top5 tier；每天都在 Top10 則列 Top10；其餘連續 Top20 是 Top20 tier。"],
    ["最新排名", "這檔股票在最新出榜日的排名。"],
    ["平均排名", "最近 10 個交易日上榜排名的平均值，越小代表越穩定靠前。"],
    ["最差排名", "最近 10 個交易日中最差的一次排名，用來看穩定度。"],
    ["10 日路徑", "這檔股票過去 10 個交易日每天的排名變化。"],
  ],
  watchlist: [
    ["排序", "本次短線雷達的排名。"],
    ["標的", "股票代號、名稱與產業。"],
    ["階段", "雷達給的觀察強度與是否需要人工確認。"],
    ["分數", "綜合排序分數，越高代表雷達越偏好。"],
    ["收盤", "出榜資料日的收盤價。"],
    ["20 日 / 60 日", "過去 20 / 60 個交易日的已發生漲跌幅，不是未來預測。"],
    ["量能", "目前成交量相對於 20 日均量的倍數。"],
    ["覆蓋", "這檔股票本次算分資料完整度，不是勝率。"],
    ["風險摘要", "例如短線過熱、近期大跌、注意股或資料缺口等提醒。"],
  ],
  history: [
    ["10 天名單", "列出最近 10 個交易日的普通 Top20，黃金榜就是從這 10 天連續上榜者篩出來。"],
    ["用途", "用來看一檔股票是剛衝進榜，還是已經穩定多天排在前面。"],
    ["分數", "每一天當時的雷達分數，不是用今天資料回填。"],
  ],
  detail: [
    ["Top Observation", "右側細節預設顯示目前排名第一的標的。"],
    ["分數拆解", "下面各小格顯示營收、價量、族群、籌碼、催化等分項。"],
    ["雷達理由", "列出它為什麼被短線雷達排上來。"],
    ["覆蓋狀態", "顯示哪些雷達資料可用、哪些資料不足或降級。"],
  ],
  dataHealth: [
    ["Data Health", "檢查短線雷達本輪用到的資料表是否存在、最新日期與資料量。"],
    ["Fresh", "代表該資料源近期有更新。"],
    ["Historical / Partial", "代表資料可用但可能不是當天最新，或只覆蓋部分欄位。"],
    ["Source missing", "代表該資料源目前缺失，雷達會降級或限制該項分數。"],
  ],
  notices: [
    ["Compliance", "這裡放研究限制、資料限制與非投資建議聲明。"],
    ["研究頁", "短線雷達是研究與觀察工具，不代表保證獲利或下單建議。"],
    ["資料限制", "外部資料、交易所資料或歷史資料若延遲，頁面會以目前可用資料呈現。"],
  ],
};

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
    explosive_radar_v2_current: "爆發短線雷達 v2",
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

function intradayTrendPoints(row) {
  const trend = row?.intraday_15m;
  if (!trend || trend.status !== "ok" || !Array.isArray(trend.points)) {
    return [];
  }
  return trend.points
    .map((point) => ({
      time: String(point?.time || "").trim(),
      price: asNumber(point?.price),
      changePct: asNumber(point?.change_pct),
    }))
    .filter((point) => point.price !== null);
}

function renderIntradayMiniChart(row) {
  const trend = row?.intraday_15m;
  const points = intradayTrendPoints(row);
  const modeLabel = trend?.mode_label || "15分鐘走勢";
  if (!points.length) {
    return `
      <div class="intraday-mini intraday-empty" title="目前沒有 15 分鐘走勢資料">
        <span>15m</span>
        <small>無資料</small>
      </div>
    `;
  }

  const width = 150;
  const height = 44;
  const padX = 5;
  const padY = 6;
  const prices = points.map((point) => point.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (min === max) {
    min -= Math.max(0.1, min * 0.001);
    max += Math.max(0.1, max * 0.001);
  }
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = points.length === 1
      ? width / 2
      : padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = padY + ((max - point.price) / span) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const endChange = asNumber(trend?.change_pct);
  const tone = toneForSignedNumber(endChange);
  const first = points[0];
  const last = points[points.length - 1];
  const title = `${modeLabel}: ${first.time || "--"} ${formatNumber(first.price)} → ${last.time || "--"} ${formatNumber(last.price)}`;
  const lastCoord = coords[coords.length - 1].split(",");

  return `
    <div class="intraday-mini ${tone}" title="${escapeHtml(title)}">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
        <line class="intraday-grid-line" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
        <polyline points="${coords.join(" ")}"></polyline>
        <circle cx="${lastCoord[0]}" cy="${lastCoord[1]}" r="2.8"></circle>
      </svg>
      <div class="intraday-meta">
        <span>${escapeHtml(modeLabel)}</span>
        <strong>${escapeHtml(formatSignedPctPoints(endChange))}</strong>
      </div>
    </div>
  `;
}

function finalizeSide(pool) {
  return pool === "a" ? "A" : "B";
}

function finalizeForPool(row, pool) {
  const side = finalizeSide(pool);
  const finalize = row?.finalize;
  if (!finalize || typeof finalize !== "object") {
    return null;
  }
  const entry = finalize[side];
  return entry && typeof entry === "object" ? entry : null;
}

function isFinalizedForPool(row, pool) {
  return finalizeForPool(row, pool)?.finalized === true;
}

function compactTime(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "--";
  }
  const isoMatch = text.match(/T(\d{2}:\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }
  const plainMatch = text.match(/\b(\d{2}:\d{2})\b/);
  return plainMatch ? plainMatch[1] : text;
}

function registerAbIntradayRow(row, pool, tradeDate) {
  window.__AB_INTRADAY_ROW_MAP__ = window.__AB_INTRADAY_ROW_MAP__ || {};
  const key = `${tradeDate || "latest"}-${pool}-${row?.stock_id || row?.stock_name || "row"}`;
  window.__AB_INTRADAY_ROW_MAP__[key] = { row, pool, tradeDate };
  return key;
}

function renderAbStockName(row, pool, tradeDate) {
  const finalized = isFinalizedForPool(row, pool);
  const side = finalizeSide(pool);
  const key = registerAbIntradayRow(row, pool, tradeDate);
  const label = row.stock_name || row.stock_id || "--";
  return `
    <button
      type="button"
      class="ab-stock-trigger ${finalized ? "ab-finalized-name" : ""}"
      data-ab-intraday-toggle
      data-ab-row-key="${escapeHtml(key)}"
      aria-expanded="false"
      title="${escapeHtml("點擊查看定版當時走勢")}"
    >
      <span>${escapeHtml(label)}</span>
      ${finalized ? `<span class="ab-finalize-chip">定版 ${escapeHtml(side)}</span>` : ""}
    </button>
  `;
}

function finalizeSnapshotValue(row, pool, key, fallbackKey) {
  const finalize = finalizeForPool(row, pool);
  const directValue = asNumber(row?.[fallbackKey]);
  const finalizeValue = finalize ? asNumber(finalize[key]) : null;
  const intradayKey = fallbackKey.replace("finalize_intraday_", "");
  const intradayValue = asNumber(row?.intraday_15m?.[intradayKey]);
  return directValue ?? finalizeValue ?? intradayValue;
}

function renderFinalizeSnapshot(row, pool) {
  const finalize = finalizeForPool(row, pool);
  const finalized = finalize?.finalized === true;
  const change = finalizeSnapshotValue(row, pool, "friday_close_to_finalize_pct", "finalize_intraday_change_pct");
  const price = finalizeSnapshotValue(row, pool, "finalize_price", "finalize_intraday_price");
  const asOf = row?.finalize_intraday_as_of || finalize?.finalize_as_of || row?.intraday_15m?.as_of || "";
  const tone = toneForSignedNumber(change);
  const label = finalized ? "定版" : finalize ? "觀察" : "快照";
  return `
    <div class="ab-finalize-snapshot ${finalized ? "is-finalized" : ""}">
      <strong class="${tone}">${escapeHtml(formatSignedPctPoints(change))}</strong>
      <span>${escapeHtml(formatNumber(price))} · ${escapeHtml(compactTime(asOf))}</span>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

function renderAbIntradayDetailChart(row) {
  const trend = row?.intraday_15m;
  const points = intradayTrendPoints(row);
  const modeLabel = trend?.mode_label || "15分鐘走勢";
  if (!points.length) {
    return `
      <div class="ab-intraday-detail is-empty">
        <strong>${escapeHtml(row?.stock_id || "")} ${escapeHtml(row?.stock_name || "")}</strong>
        <span>目前沒有可用的定版走勢資料。</span>
      </div>
    `;
  }

  const width = 640;
  const height = 170;
  const padX = 38;
  const padTop = 18;
  const padBottom = 30;
  const prices = points.map((point) => point.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (min === max) {
    min -= Math.max(0.1, min * 0.001);
    max += Math.max(0.1, max * 0.001);
  }
  const span = max - min || 1;
  const xFor = (index) => points.length === 1
    ? width / 2
    : padX + (index / (points.length - 1)) * (width - padX * 2);
  const yFor = (price) => padTop + ((max - price) / span) * (height - padTop - padBottom);
  const coords = points.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.price).toFixed(1)}`);
  const last = points[points.length - 1];
  const first = points[0];
  const lastCoord = coords[coords.length - 1].split(",");
  const tone = toneForSignedNumber(trend?.change_pct);
  const gridValues = [max, min + span / 2, min];
  const grid = gridValues
    .map((price) => {
      const y = yFor(price);
      return `<g class="ab-intraday-grid"><line x1="${padX}" y1="${y.toFixed(1)}" x2="${width - padX}" y2="${y.toFixed(1)}"></line><text x="4" y="${(y + 4).toFixed(1)}">${escapeHtml(formatNumber(price))}</text></g>`;
    })
    .join("");

  return `
    <div class="ab-intraday-detail ${tone}">
      <div class="ab-intraday-detail-head">
        <div>
          <strong>${escapeHtml(row?.stock_id || "")} ${escapeHtml(row?.stock_name || "")}</strong>
          <span>${escapeHtml(modeLabel)} · ${escapeHtml(first.time || "--")} 至 ${escapeHtml(last.time || compactTime(trend?.as_of))}</span>
        </div>
        <div class="ab-intraday-detail-metrics">
          <span>${escapeHtml(formatNumber(trend?.last_price))}</span>
          <strong>${escapeHtml(formatSignedPctPoints(trend?.change_pct))}</strong>
        </div>
      </div>
      <svg class="ab-intraday-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(`${row?.stock_id || ""} ${modeLabel}`)}">
        ${grid}
        <polyline points="${coords.join(" ")}"></polyline>
        <circle cx="${lastCoord[0]}" cy="${lastCoord[1]}" r="4"></circle>
        <g class="ab-intraday-axis">
          <text x="${padX}" y="${height - 8}">${escapeHtml(first.time || "--")}</text>
          <text x="${width - padX}" y="${height - 8}" text-anchor="end">${escapeHtml(last.time || compactTime(trend?.as_of))}</text>
        </g>
      </svg>
    </div>
  `;
}

function renderAbIntradayDetailPanel(row, pool) {
  const finalize = finalizeForPool(row, pool);
  const reason = finalize?.selection_reason || finalize?.rejection_reason || reasonForPool(row, pool) || "";
  return `
    ${renderAbIntradayDetailChart(row)}
    ${reason ? `<p class="ab-intraday-reason">${escapeHtml(reason)}</p>` : ""}
  `;
}

function wireAbIntradayToggles(root) {
  if (!root || root.dataset.abIntradayToggleBound === "true") {
    return;
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ab-intraday-toggle]");
    if (!trigger || !root.contains(trigger)) {
      return;
    }
    event.preventDefault();

    const key = trigger.dataset.abRowKey || "";
    const entry = window.__AB_INTRADAY_ROW_MAP__?.[key];
    const row = trigger.closest("tr");
    if (!entry || !row) {
      return;
    }

    const tableBody = row.parentElement;
    const next = row.nextElementSibling;
    if (next?.classList.contains("ab-intraday-detail-row") && next.dataset.abRowKey === key) {
      next.remove();
      trigger.classList.remove("is-active");
      trigger.setAttribute("aria-expanded", "false");
      return;
    }

    tableBody?.querySelectorAll(".ab-intraday-detail-row").forEach((node) => node.remove());
    tableBody?.querySelectorAll("[data-ab-intraday-toggle].is-active").forEach((node) => {
      node.classList.remove("is-active");
      node.setAttribute("aria-expanded", "false");
    });

    const detailRow = document.createElement("tr");
    detailRow.className = "ab-intraday-detail-row";
    detailRow.dataset.abRowKey = key;
    const cell = document.createElement("td");
    cell.colSpan = Math.max(row.children.length, 1);
    cell.innerHTML = renderAbIntradayDetailPanel(entry.row, entry.pool);
    detailRow.appendChild(cell);
    row.after(detailRow);
    trigger.classList.add("is-active");
    trigger.setAttribute("aria-expanded", "true");
  });

  root.dataset.abIntradayToggleBound = "true";
}

function renderAbRow(row, pool, tradeDate) {
  const finalized = isFinalizedForPool(row, pool);
  return `
    <tr class="${finalized ? "is-finalized-row" : ""}">
      <td data-label="股號">${escapeHtml(row.stock_id)}</td>
      <td data-label="股名 / 走勢">${renderAbStockName(row, pool, tradeDate)}</td>
      <td data-label="定版時漲幅">${renderFinalizeSnapshot(row, pool)}</td>
      <td data-label="重疊">${renderSelectionTag(row.selection_tag)}</td>
      <td data-label="主題">${escapeHtml(row.theme || "--")}</td>
      <td data-label="周一9:10價">${escapeHtml(formatNumber(row.week_entry_price))}</td>
      <td data-label="周一9.10分買的話%">${escapeHtml(formatSignedPctPoints(row.week_entry_return_pct))}</td>
      <td data-label="周一9.10損益">${escapeHtml(formatSignedMoney(row.week_entry_pnl_twd))}</td>
      <td data-label="開盤價">${escapeHtml(formatNumber(row.open_price))}</td>
      <td data-label="收盤價">${escapeHtml(formatNumber(row.close_price))}</td>
      <td data-label="漲跌幅%">${escapeHtml(formatSignedPctPoints(row.change_pct))}</td>
      <td data-label="漲跌實際">${escapeHtml(formatSignedNumber(row.change_amount))}</td>
      <td data-label="一張損益">${escapeHtml(formatSignedMoney(row.lot_pnl_twd))}</td>
      <td data-label="LLM 理由" class="reason-cell">${escapeHtml(reasonForPool(row, pool) || "--")}</td>
    </tr>
  `;
}

function renderPoolTable(title, pool, rows, options = {}) {
  const nonTradingSelectionDay = options.nonTradingSelectionDay === true;
  const tradeDate = options.tradeDate || "";
  const summary = summarizePool(rows);
  const weekSummary = summarizePool(rows, "week");
  const body = rows.length
    ? rows.map((row) => renderAbRow(row, pool, tradeDate || row?.daily_trade_date || row?.week_entry_date || "")).join("")
    : '<tr><td class="empty-cell" colspan="14">這一池目前沒有預選股。</td></tr>';
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
              <th>股名 / 走勢</th>
              <th>定版時漲幅</th>
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
  const intraday = entry?.intraday_15m_summary;
  if (intraday?.mode_label) {
    pills.push(`15分 ${intraday.mode_label} ${fallbackText(intraday.ok_count)}/${fallbackText(intraday.stock_count)}`);
  }
  const finalize = entry?.finalize;
  if (finalize?.available) {
    pills.push(`定版 A${fallbackText(finalize.a_finalize_count)} / B${fallbackText(finalize.b_finalize_count)}`);
  }
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
    <div class="ab-history-mobile-summary" aria-label="每日 A/B 手機摘要">
      ${history.map((entry, index) => renderAbDailyHistorySummaryCard(entry, index === 0)).join("")}
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

function renderHistoryToggleButton(options = {}) {
  const rendered = options.rendered !== false;
  const collapsed = options.collapsed === true;
  const label = rendered ? (collapsed ? "展開" : "收起") : "載入明細";
  return `
    <button class="history-toggle" type="button" data-history-toggle aria-expanded="${collapsed || !rendered ? "false" : "true"}">
      ${label}
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

    if (card.dataset.detailsRendered !== "true") {
      const index = Number(card.dataset.historyIndex);
      const entry = historyList.__abDailyHistory?.[index];
      const body = card.querySelector(".history-body");
      if (entry && body) {
        body.innerHTML = renderAbHistoryCardBody(entry);
        card.dataset.detailsRendered = "true";
        card.classList.remove("is-deferred");
        card.classList.remove("is-collapsed");
        syncHistoryCardToggle(card, false);
      }
      return;
    }

    const collapsed = card.classList.toggle("is-collapsed");
    syncHistoryCardToggle(card, collapsed);
  });

  historyList.dataset.toggleBound = "true";
}

function renderAbHistoryCardBody(entry) {
  return isAbSourceMissing(entry)
    ? renderSourceMissingPanel(entry)
    : `${renderRotationStatusBand(entry)}<div class="pool-grid">${renderPoolGrid(entry)}</div>`;
}

function renderDeferredHistoryBody(entry) {
  const rows = getAbRows(entry);
  return `
    <div class="history-deferred">
      <strong>${escapeHtml(entry?.trade_date || "--")} 明細尚未載入</strong>
      <span>這天有 ${escapeHtml(formatNumber(rows.length))} 筆股票列。為了讓手機版不一次塞滿表格，點「載入明細」再展開。</span>
    </div>
  `;
}

function renderAbHistoryCards(history) {
  return history
    .map((entry, index) => {
      const rendered = index < AB_HISTORY_EAGER_DETAIL_COUNT || isAbSourceMissing(entry);
      const collapsed = index !== 0;
      const body = rendered ? renderAbHistoryCardBody(entry) : renderDeferredHistoryBody(entry);
      return `
        <article
          class="history-card ${index === 0 ? "is-latest" : ""} ${collapsed ? "is-collapsed" : ""} ${rendered ? "" : "is-deferred"}"
          data-history-index="${index}"
          data-details-rendered="${rendered ? "true" : "false"}"
        >
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
              ${renderHistoryToggleButton({ rendered, collapsed })}
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

  window.__AB_INTRADAY_ROW_MAP__ = {};
  wireAbIntradayToggles(document.body);

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

function renderRadarCandidateRow(candidate, selectedDate) {
  const stage = `${stageLabel(candidate?.stage)} / ${entryZoneLabel(candidate?.entryZone)}`;
  const volumeRatio = asNumber(candidate?.volumeExpansionRatio);
  const volumeText = volumeRatio === null ? "--" : `${formatNumber(volumeRatio)}x`;

  return `
    <tr>
      <td>${escapeHtml(candidate?.rank || "--")}</td>
      <td>
        <div class="radar-stock">
          <strong>${radarChartStockTrigger(candidate, selectedDate)}</strong>
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

function renderRadarCandidateTable(candidates, selectedDate) {
  if (!candidates.length) {
    return '<div class="empty-state">目前沒有可呈現的短線雷達觀察清單。</div>';
  }

  return `
    ${renderHelpCard("current-watchlist", "普通 Top20 表格怎麼看", RADAR_HELP.watchlist, "20 日、60 日、量能、覆蓋都是出榜當下已知資訊，不是未來績效。")}
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
      <tbody>${candidates.map((candidate) => renderRadarCandidateRow(candidate, selectedDate)).join("")}</tbody>
    </table>
  `;
}

function renderRadarGoldenPanel(golden) {
  const rows = Array.isArray(golden?.candidates) ? golden.candidates : [];
  const tierCounts = golden?.tierCounts || {};
  const selectedDate = golden?.asOfDate || golden?.windowEnd || "";
  const meta = [
    `Window ${fallbackText(golden?.windowDays)} trading days`,
    `Top5 ${fallbackText(tierCounts.top5 || 0)}`,
    `Top10 ${fallbackText(tierCounts.top10 || 0)}`,
    `Top20 ${fallbackText(rows.length)}`,
  ];
  const body = rows.length
    ? rows
        .map(
          (item) => `
            <tr>
              <td><span class="golden-tier golden-tier-${escapeHtml(item.tier || "top20")}">${escapeHtml(item.tier || "top20")}</span></td>
              <td>
                <div class="radar-stock">
                  <strong>${radarChartStockTrigger(item, selectedDate)}</strong>
                  <span>${escapeHtml(item.industry || "--")}</span>
                </div>
              </td>
              <td>${escapeHtml(formatNumber(item.latestRank))}</td>
              <td>${escapeHtml(formatScore(item.latestScore))}</td>
              <td>${escapeHtml(formatNumber(item.averageRank))}</td>
              <td>${escapeHtml(formatNumber(item.worstRank))}</td>
              <td class="rank-path">${escapeHtml((item.rankPath || []).join(" / "))}</td>
            </tr>
          `
        )
        .join("")
    : '<tr><td class="empty-cell" colspan="7">最近 10 個交易日沒有每天都進 Top20 的股票。</td></tr>';

  return `
    <section class="radar-golden-band">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Golden Watch</p>
          <h3>黃金 Top20</h3>
        </div>
        <div class="pill-row compact-pills">
          ${meta.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>
      ${renderHelpCard("golden-watch", "黃金榜怎麼篩", RADAR_HELP.golden, "黃金榜是短線雷達的精選穩定名單；它不是另一套自動交易策略。")}
      <p class="mini-note">${escapeHtml(golden?.rule || "連續 10 個交易日都進 Top20；若每天都進 Top5/Top10，升級標示。")}</p>
      <div class="table-wrap">
        <table class="ab-history-table radar-golden-table">
          <thead>
            <tr>
              <th>級別</th>
              <th>股票</th>
              <th>最新排名</th>
              <th>最新分數</th>
              <th>平均排名</th>
              <th>最差排名</th>
              <th>10日路徑</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAbSummaryMetric(label, summary, options = {}) {
  const nonTradingSelectionDay = options.nonTradingSelectionDay === true;
  const returnText = nonTradingSelectionDay ? "NA" : formatSignedPctPoints(summary?.returnPct);
  const pnlText = nonTradingSelectionDay ? "NA" : formatSignedMoney(summary?.pnl);
  const tone = nonTradingSelectionDay ? "trend-flat" : toneForSignedNumber(summary?.pnl);
  return `
    <div class="ab-summary-metric">
      <span>${escapeHtml(label)}</span>
      <strong class="${tone}">${escapeHtml(returnText)}</strong>
      <small>${escapeHtml(pnlText)}</small>
    </div>
  `;
}

function renderAbDailyHistorySummaryCard(entry, isLatest) {
  if (isAbSourceMissing(entry)) {
    return `
      <article class="ab-summary-card ${isLatest ? "is-latest" : ""} source-missing-card-lite">
        <div class="ab-summary-date">
          <strong>${escapeHtml(entry.trade_date || "--")}</strong>
          <span>${escapeHtml(entry.phase_label || "來源缺失")}</span>
        </div>
        <p>${escapeHtml(sourceMissingText(entry))}</p>
      </article>
    `;
  }

  const aRows = rowsForPool(entry, "a");
  const bRows = rowsForPool(entry, "b");
  const nonTradingSelectionDay = entry?.non_trading_selection_day === true;
  return `
    <article class="ab-summary-card ${isLatest ? "is-latest" : ""}">
      <div class="ab-summary-date">
        <strong>${escapeHtml(entry.trade_date || "--")}</strong>
        <span>${escapeHtml(entry.phase_label || entry.phase || "--")}</span>
      </div>
      <div class="ab-summary-stock-row">
        ${renderAbStockList(aRows, "A")}
        ${renderAbStockList(bRows, "B")}
      </div>
      <div class="ab-summary-metric-grid">
        ${renderAbSummaryMetric("A 各買一張", summarizePool(aRows), { nonTradingSelectionDay })}
        ${renderAbSummaryMetric("B 各買一張", summarizePool(bRows), { nonTradingSelectionDay })}
        ${renderAbSummaryMetric("全部各買一張", buildAbAllSummary(entry), { nonTradingSelectionDay })}
        ${renderAbSummaryMetric("全部週一 9:10", buildAbAllSummary(entry, "week"), { nonTradingSelectionDay })}
      </div>
      <span class="metric-sub">${escapeHtml(rotationCompactText(entry))}</span>
    </article>
  `;
}

function renderDailyTop20Card(day, isGoldenWindow) {
  const candidates = Array.isArray(day?.candidates) ? day.candidates.slice(0, 20) : [];
  return `
    <details class="radar-day-panel ${isGoldenWindow ? "is-golden-window" : ""}">
      <summary class="radar-day-head">
        <strong>${escapeHtml(day?.asOfDate || "--")}</strong>
        <span>${isGoldenWindow ? "黃金榜窗口 / " : ""}${escapeHtml(formatNumber(day?.count || candidates.length))} 檔</span>
      </summary>
      <ol class="radar-day-list">
        ${candidates
          .map(
            (candidate) => `
              <li>
                <span class="radar-rank-chip">${escapeHtml(candidate.rank)}</span>
                <span>${radarChartStockTrigger(candidate, day?.asOfDate, "compact")}</span>
                <strong>${escapeHtml(formatScore(candidate.scoreTotal))}</strong>
              </li>
            `
          )
          .join("")}
      </ol>
    </details>
  `;
}

function renderGoldenHistoryCard(day) {
  const candidates = Array.isArray(day?.candidates) ? day.candidates : [];
  const tierCounts = day?.tierCounts || {};
  return `
    <details class="radar-day-panel radar-golden-history-card">
      <summary class="radar-day-head">
        <strong>${escapeHtml(day?.asOfDate || "--")}</strong>
        <span>${escapeHtml(formatNumber(candidates.length))} 檔 / Top5 ${escapeHtml(formatNumber(tierCounts.top5 || 0))} / Top10 ${escapeHtml(formatNumber(tierCounts.top10 || 0))}</span>
      </summary>
      <p class="mini-note">窗口：${escapeHtml(fallbackText(day?.windowStart))} - ${escapeHtml(fallbackText(day?.windowEnd))}</p>
      <ol class="radar-day-list radar-golden-history-list">
        ${candidates
          .map(
            (candidate) => `
              <li>
                <span class="golden-tier golden-tier-${escapeHtml(candidate.tier || "top20")}">${escapeHtml(candidate.tier || "top20")}</span>
                <span>${radarChartStockTrigger(candidate, day?.asOfDate, "compact")}</span>
                <strong>${escapeHtml(formatScore(candidate.latestScore))}</strong>
              </li>
            `
          )
          .join("")}
      </ol>
    </details>
  `;
}

function renderRadarHistoryPanel(history) {
  const days = Array.isArray(history?.daily) ? history.daily : [];
  if (!days.length) {
    return "";
  }
  const highlightDates = new Set(Array.isArray(history?.highlightLatestDays) ? history.highlightLatestDays : days.slice(0, 10).map((day) => day.asOfDate));

  return `
    <section class="radar-history-band">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Daily Top20</p>
          <h3>每日 Top20 名單</h3>
        </div>
        <span class="pill">${escapeHtml(formatNumber(days.length))} 天 / ${escapeHtml(fallbackText(history.startDate))} - ${escapeHtml(fallbackText(history.endDate))}</span>
      </div>
      ${renderHelpCard("radar-history", "每日 Top20 名單怎麼看", RADAR_HELP.history, "每張日期小卡預設收合；最新 10 個交易日是目前黃金榜的形成窗口，所以用金色標出。")}
      <div class="radar-history-grid">
        ${days.map((day) => renderDailyTop20Card(day, highlightDates.has(day.asOfDate))).join("")}
      </div>
    </section>
  `;
}

function renderRadarGoldenHistoryPanel(history) {
  const days = Array.isArray(history?.goldenHistory) ? history.goldenHistory : [];
  const latestGoldenDate = history?.golden?.asOfDate || days[0]?.asOfDate;
  const pastDays = days.filter((day) => day.asOfDate !== latestGoldenDate);
  if (!pastDays.length) {
    return "";
  }

  return `
    <section class="radar-history-band radar-golden-history-band">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Golden History</p>
          <h3>過往黃金榜</h3>
        </div>
        <span class="pill">${escapeHtml(formatNumber(pastDays.length))} 天 / 最新已在上方顯示</span>
      </div>
      ${renderHelpCard("radar-golden-history", "過往黃金榜怎麼看", RADAR_HELP.golden, "每張日期小卡都是該日用前 10 個交易日 Top20 形成的黃金榜；預設收合，點開才看股票。")}
      <div class="radar-history-grid">
        ${pastDays.map(renderGoldenHistoryCard).join("")}
      </div>
    </section>
  `;
}

function renderEffectivenessSparkline(points, series) {
  const rows = Array.isArray(points) ? points.filter((point) => point && point.date) : [];
  const usable = rows.filter((point) => series.some((item) => asNumber(point[item.key]) !== null));
  if (usable.length < 2) {
    return '<div class="effectiveness-empty-chart">可視化資料累積中</div>';
  }

  const width = 640;
  const height = 180;
  const padX = 34;
  const padY = 24;
  const values = [];
  usable.forEach((point) => {
    series.forEach((item) => {
      const value = asNumber(point[item.key]);
      if (value !== null) {
        values.push(value);
      }
    });
  });

  let min = Math.min(...values);
  let max = Math.max(...values);
  if (Math.abs(max - min) < 0.0001) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const xFor = (index) => padX + (index * (width - padX * 2)) / Math.max(1, usable.length - 1);
  const yFor = (value) => height - padY - ((value - min) / span) * (height - padY * 2);
  const zeroY = min < 0 && max > 0 ? yFor(0) : null;

  const paths = series
    .map((item) => {
      const segments = [];
      usable.forEach((point, index) => {
        const value = asNumber(point[item.key]);
        if (value === null) {
          return;
        }
        segments.push(`${segments.length ? "L" : "M"}${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}`);
      });
      if (!segments.length) {
        return "";
      }
      return `<path d="${segments.join(" ")}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("");

  const firstDate = usable[0]?.date || "";
  const lastDate = usable[usable.length - 1]?.date || "";
  return `
    <svg class="effectiveness-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="短線雷達成效曲線">
      <line x1="${padX}" x2="${width - padX}" y1="${padY}" y2="${padY}" />
      <line x1="${padX}" x2="${width - padX}" y1="${height - padY}" y2="${height - padY}" />
      ${zeroY === null ? "" : `<line class="zero-line" x1="${padX}" x2="${width - padX}" y1="${zeroY.toFixed(2)}" y2="${zeroY.toFixed(2)}" />`}
      ${paths}
      <text x="${padX}" y="${height - 5}">${escapeHtml(firstDate)}</text>
      <text x="${width - padX}" y="${height - 5}" text-anchor="end">${escapeHtml(lastDate)}</text>
      <text x="${padX}" y="16">${escapeHtml(formatSignedPctPoints(max))}</text>
      <text x="${padX}" y="${height - 30}">${escapeHtml(formatSignedPctPoints(min))}</text>
    </svg>
  `;
}

function renderEffectivenessMetric(label, value, options = {}) {
  const className = options.signed ? toneForSignedNumber(value) : "";
  const formatter = options.signed ? formatSignedPctPoints : formatPctPoints;
  return `
    <div class="effectiveness-metric">
      <span>${escapeHtml(label)}</span>
      <strong class="${className}">${escapeHtml(formatter(value))}</strong>
    </div>
  `;
}

function renderRadarEffectiveness(effectiveness) {
  const horizons = effectiveness?.horizons || {};
  const curves = effectiveness?.curves || {};
  const range = effectiveness?.range || {};
  const horizonKeys = ["20d", "60d", "120d"];
  const series = [
    { key: "golden", label: "黃金榜", color: "#0c8f7a" },
    { key: "top20", label: "普通 Top20", color: "#1d3557" },
    { key: "bestExternal", label: "外部三者最佳", color: "#ee6c4d" },
  ];

  if (!effectiveness || !Object.keys(horizons).length) {
    return '<div class="empty-state">黃金榜成效快照尚未產生；下一次短線雷達更新會補上。</div>';
  }

  const cards = horizonKeys
    .map((key) => {
      const horizon = horizons[key] || {};
      const internal = horizon.internal || {};
      const external = horizon.external || {};
      return `
        <article class="effectiveness-horizon-panel">
          <div class="effectiveness-panel-head">
            <div>
              <p class="eyebrow">Horizon</p>
              <h3>${escapeHtml(horizon.label || key)}</h3>
            </div>
            <span class="pill">${escapeHtml(formatNumber(internal.days || external.days))} 天樣本</span>
          </div>
          <div class="effectiveness-chart">
            ${renderEffectivenessSparkline(curves[key] || [], series)}
          </div>
          <div class="effectiveness-metrics">
            ${renderEffectivenessMetric("黃金榜平均", internal.goldenAvgPct)}
            ${renderEffectivenessMetric("普通 Top20", internal.top20AvgPct)}
            ${renderEffectivenessMetric("外部最佳", external.bestExternalAvgPct)}
            ${renderEffectivenessMetric("黃金 - Top20", internal.goldenMinusTop20Pct, { signed: true })}
            ${renderEffectivenessMetric("黃金 - 外部最佳", external.goldenMinusBestExternalPct, { signed: true })}
            ${renderEffectivenessMetric("每日勝外部", external.goldenBeatBestExternalDailyPct)}
          </div>
        </article>
      `;
    })
    .join("");

  const benchmarkRows = horizonKeys
    .map((key) => {
      const horizon = horizons[key] || {};
      const internal = horizon.internal || {};
      const external = horizon.external || {};
      const benchmarks = external.benchmarks || {};
      return `
        <tr>
          <td>${escapeHtml(horizon.label || key)}</td>
          <td>${escapeHtml(formatPctPoints(internal.goldenAvgPct))}</td>
          <td>${escapeHtml(formatPctPoints(internal.top20AvgPct))}</td>
          <td>${escapeHtml(formatPctPoints(benchmarks["0050"]?.avgPct))}</td>
          <td>${escapeHtml(formatPctPoints(benchmarks["2330"]?.avgPct))}</td>
          <td>${escapeHtml(formatPctPoints(benchmarks.TAIEX?.avgPct))}</td>
          <td>${escapeHtml(formatPctPoints(external.bestExternalAvgPct))}</td>
          <td class="${toneForSignedNumber(external.goldenMinusBestExternalPct)}">${escapeHtml(formatSignedPctPoints(external.goldenMinusBestExternalPct))}</td>
          <td>${escapeHtml(formatNumber(external.days || internal.days))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="radar-effectiveness-wrap">
      <div class="effectiveness-meta-row">
        <span class="pill">區間 ${escapeHtml(fallbackText(range.start))} - ${escapeHtml(fallbackText(range.end))}</span>
        <span class="pill">內部比較：黃金榜 vs 普通 Top20</span>
        <span class="pill">外部比較：0050 / 台積電 / 台股加權 / 三者最佳</span>
      </div>
      ${renderHelpCard("radar-effectiveness", "成效追蹤圖表怎麼看", RADAR_HELP.effectiveness, "這裡看的是歷史每個出榜日往後固定交易日的結果，不是每日淨值曲線。")}
      <div class="effectiveness-legend">
        ${series
          .map((item) => `<span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>`)
          .join("")}
      </div>
      <div class="radar-effectiveness-grid">${cards}</div>
      <div class="table-wrap effectiveness-table-wrap">
        <table class="effectiveness-table">
          <thead>
            <tr>
              <th>區間</th>
              <th>黃金榜</th>
              <th>普通 Top20</th>
              <th>0050</th>
              <th>台積電</th>
              <th>台股加權</th>
              <th>外部最佳</th>
              <th>黃金差距</th>
              <th>樣本天</th>
            </tr>
          </thead>
          <tbody>${benchmarkRows}</tbody>
        </table>
      </div>
      <p class="mini-note">
        固定 20/60/120 交易日 horizon；太晚、還沒有足夠未來交易日的訊號不納入該 horizon。
        外部基準使用 TWSE 官方月資料。這是研究用成效追蹤，不是交易建議。
      </p>
    </div>
  `;
}

function renderRadarScoreGrid(candidate) {
  const scores = candidate?.scores || {};
  const rows = [
    ["營收", scores.revenue],
    ["v2 動能", scores.expectationGap],
    ["價格 / RS", scores.priceVolume],
    ["題材", scores.themeGroup],
    ["籌碼", scores.chip],
    ["市場熱度", scores.catalyst],
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
      ${renderHelpCard("radar-detail-empty", "右側細節怎麼看", RADAR_HELP.detail)}
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
    ${renderHelpCard("radar-detail", "右側細節怎麼看", RADAR_HELP.detail)}
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
  const effectiveness = document.querySelector("#radar-effectiveness");
  const sourceGrid = document.querySelector("#radar-source-grid");
  const notices = document.querySelector("#radar-notices");
  const summary = payload?.summary || {};
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const topCandidates = candidates.slice(0, 20);
  const history = payload?.history || {};
  const golden = payload?.golden || history.golden || {};
  window.__SHORT_TERM_RADAR_CURRENT_PAYLOAD__ = payload || {};
  window.__RADAR_WEEKLY_CHARTS__ = payload?.weeklyCharts || {};

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
    mountHelpCard(pageMeta, "radar-overview", "這頁怎麼看", RADAR_HELP.overview, "所有說明卡預設收起，點開後會在原本位置展開，不會蓋住圖表或表格。", "afterend");
  }

  mountHelpCard(summaryMetrics, "radar-summary", "Snapshot 指標怎麼看", RADAR_HELP.summary);
  renderMetricCards(summaryMetrics, [
    ["掃描日", payload?.asOfDate],
    ["候選檔數", summary.totalCandidates],
    ["核心資料完成", summary.coreReadyCount],
    ["最高分數", formatScore(summary.topScore)],
    ["平均分數覆蓋", formatPct(summary.averageScoreCoverage)],
    ["Slot 覆蓋", formatPct(summary.averageSlotCoverage)],
  ]);

  if (effectiveness) {
    effectiveness.innerHTML = renderRadarEffectiveness(payload?.effectiveness);
  }

  if (candidateTable) {
    candidateTable.innerHTML = `${renderRadarGoldenPanel(golden)}${renderRadarCandidateTable(topCandidates, payload?.asOfDate)}${renderRadarHistoryPanel(history)}${renderRadarGoldenHistoryPanel(history)}`;
    wireRadarWeeklyChartToggles(candidateTable, payload);
  }

  if (detail) {
    detail.innerHTML = renderRadarDetail(candidates[0]);
  }

  if (sourceGrid) {
    mountHelpCard(sourceGrid, "radar-data-health", "Data Health 怎麼看", RADAR_HELP.dataHealth);
    const sources = Array.isArray(payload?.datasetStatus) ? payload.datasetStatus : [];
    sourceGrid.innerHTML = sources.length
      ? sources.map(renderRadarSourceStatus).join("")
      : '<div class="empty-state">尚無資料源狀態。</div>';
  }

  if (notices) {
    mountHelpCard(notices, "radar-compliance", "Compliance 怎麼看", RADAR_HELP.notices);
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
