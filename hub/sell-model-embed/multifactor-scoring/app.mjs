// Independent public demonstration. Fixed rules; no runtime AI or network calls.
export const DEFAULTS = Object.freeze({ k: 3, H: 14, beta: 2, gamma: 0.2, w_u: 0.5, w_m: 0.3, w_c: 0.2 });
export const CASES = Object.freeze(Object.fromEntries(Object.entries({
  A: { benefit: 95, readiness: 85, cost: 30, risk: 65, quality: 90, age_days: 21, prerequisites: true },
  B: { benefit: 90, readiness: 90, cost: 30, risk: 15, quality: 97, age_days: 7, prerequisites: true },
  C: { benefit: 65, readiness: 70, cost: 15, risk: 20, quality: 92, age_days: 1, prerequisites: true },
  D: { benefit: 98, readiness: 95, cost: 20, risk: 10, quality: 45, age_days: 1, prerequisites: true },
}).map(([id, raw]) => [id, Object.freeze(raw)])));

const INPUTS = [
  ['benefit', 'Benefit', 100, '0–100'], ['readiness', 'Readiness', 100, '0–100'],
  ['cost', 'Cost', 100, '0–100'], ['risk', 'Risk', 100, '0–100'],
  ['quality', 'Data quality', 100, '0–100'], ['age_days', 'Age', 365, 'days'],
];
const POLICY = [
  ['k', 'Benefit curve', 0.1, 10, 'k'], ['H', 'Time half-life', 0.25, 365, 'H · days'],
  ['beta', 'Risk penalty', 0, null, 'beta'], ['gamma', 'Interaction', 0, null, 'gamma'],
  ['w_u', 'Benefit weight', 0, null, 'w_u'], ['w_m', 'Readiness weight', 0, null, 'w_m'],
  ['w_c', 'Cost weight', 0, null, 'w_c'],
];
const REASONS = { prerequisites_not_met: 'Prerequisites not met', quality_below_60: 'Quality below 60', risk_above_80: 'Risk above 80' };

function finiteInRange(value, name, min, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number ${max === Infinity ? `at least ${min}` : `from ${min} to ${max}`}.`);
  }
}

export function evaluate(raw, overrides = {}) {
  const policy = { ...DEFAULTS, ...overrides };
  for (const [key, label, min, max] of POLICY) finiteInRange(policy[key], `${label} (${key})`, min, max ?? Infinity);
  const Z = policy.w_u + policy.w_m + policy.w_c + policy.gamma;
  if (!Number.isFinite(Z) || Z <= 0) throw new RangeError('The total normalization weight Z must be finite and greater than zero.');
  if (!raw || typeof raw !== 'object') throw new TypeError('A candidate input object is required.');
  for (const [key, label, max] of INPUTS) finiteInRange(raw[key], label, 0, max);
  if (typeof raw.prerequisites !== 'boolean') throw new TypeError('Prerequisites must be true or false.');
  // Validation intentionally precedes every eligibility gate.
  const reasons = [];
  if (!raw.prerequisites) reasons.push('prerequisites_not_met');
  if (raw.quality < 60) reasons.push('quality_below_60');
  if (raw.risk > 80) reasons.push('risk_above_80');
  if (reasons.length) return { status: 'INELIGIBLE', score: null, reasons };
  const u = raw.benefit / 100, m = raw.readiness / 100, c = raw.cost / 100, r = raw.risk / 100, q = raw.quality / 100;
  const U = -Math.expm1(-policy.k * u) / -Math.expm1(-policy.k);
  const D = Math.exp(-Math.LN2 * raw.age_days / policy.H);
  const P = Math.exp(-policy.beta * r * r);
  // Normalize before multiplying to preserve weight-scale invariance even for subnormal weights.
  const terms = { benefit: (policy.w_u / Z) * U, readiness: (policy.w_m / Z) * m, cost: (policy.w_c / Z) * (1 - c), interaction: (policy.gamma / Z) * U * m };
  const B = Object.values(terms).reduce((sum, value) => sum + value, 0);
  const score = 100 * B * D * P * q;
  const contributions = Object.fromEntries(Object.entries(terms).map(([name, value]) => [name, 100 * value * D * P * q]));
  return { status: 'ELIGIBLE', score, score_2dp: score.toFixed(2), reasons: [], U, D, P, B, q, Z, contributions };
}

export function rankCandidates(cases, policy = {}) {
  return Object.entries(cases).map(([id, raw]) => {
    try { return { id, ...evaluate(raw, policy) }; }
    catch (error) { return { id, status: 'INVALID', score: null, reasons: [], error: error.message }; }
  }).sort((a, b) => {
    if (a.score !== null && b.score !== null) return b.score - a.score || a.id.localeCompare(b.id, 'en');
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return a.id.localeCompare(b.id, 'en');
  });
}

export function runSelfChecks() {
  const checks = [];
  const check = (name, test) => {
    try { if (!test()) throw new Error('Assertion did not hold.'); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  const near = (a, b, tolerance = 1e-10) => Number.isFinite(a) && Math.abs(a - b) <= tolerance;
  const reject = (raw = CASES.C, policy = {}) => { try { evaluate(raw, policy); return false; } catch { return true; } };
  const C = evaluate(CASES.C);
  for (const [id, expected] of [['A', 12.066021879288241], ['B', 58.879425764689216], ['C', 64.50501930336792]]) {
    check(`Default Case ${id} matches the fixed reference value`, () => near(evaluate(CASES[id]).score, expected));
  }
  check('Default Case D has null score and is ineligible', () => evaluate(CASES.D).score === null && evaluate(CASES.D).status === 'INELIGIBLE');
  check('Default ranking is C, B, A; D is excluded', () => rankCandidates(CASES).filter(row => row.score !== null).map(row => row.id).join(',') === 'C,B,A');
  for (const [id, H, expected] of [['B', 7, 41.634041230581666], ['C', 7, 61.389114215871714], ['B', 30, 70.83342330505955], ['C', 30, 66.23100099536398]]) {
    check(`Case ${id} matches reference at H = ${H}`, () => near(evaluate(CASES[id], { H }).score, expected));
  }
  check('At H = 30, B ranks above C', () => rankCandidates(CASES, { H: 30 })[0].id === 'B');
  check('Case C at gamma = 0 matches the fixed reference', () => near(evaluate(CASES.C, { gamma: 0 }).score, 67.19197823031202));
  check('Increasing gamma need not increase Case C score', () => evaluate(CASES.C, { gamma: 0 }).score > C.score);
  check('No interaction contribution when gamma is zero', () => evaluate(CASES.C, { gamma: 0 }).contributions.interaction === 0);
  check('Arithmetic contributions sum to the score', () => near(Object.values(C.contributions).reduce((a, b) => a + b, 0), C.score));
  check('Benefit transform starts at zero', () => evaluate({ ...CASES.C, benefit: 0 }).U === 0);
  check('Benefit transform ends at one', () => evaluate({ ...CASES.C, benefit: 100 }).U === 1);
  check('Benefit has diminishing increments', () => evaluate({ ...CASES.C, benefit: 50 }).U > 1 - evaluate({ ...CASES.C, benefit: 50 }).U);
  check('Zero age has no time discount', () => evaluate({ ...CASES.C, age_days: 0 }).D === 1);
  check('One half-life halves the time multiplier', () => near(evaluate({ ...CASES.C, age_days: 14 }).D, 0.5));
  check('Two half-lives give a quarter multiplier', () => near(evaluate({ ...CASES.C, age_days: 28 }).D, 0.25));
  check('Zero risk has no risk discount', () => evaluate({ ...CASES.C, risk: 0 }).P === 1);
  check('Zero beta removes the risk discount', () => evaluate(CASES.C, { beta: 0 }).P === 1);
  for (const key of ['benefit', 'readiness', 'quality']) check(`Increasing ${key} cannot lower the default score`, () => evaluate({ ...CASES.C, [key]: CASES.C[key] + 1 }).score >= C.score);
  for (const key of ['cost', 'risk', 'age_days']) check(`Increasing ${key} cannot raise the default score`, () => evaluate({ ...CASES.C, [key]: CASES.C[key] + 1 }).score <= C.score);
  check('Quality 60 is eligible', () => evaluate({ ...CASES.C, quality: 60 }).status === 'ELIGIBLE');
  check('Quality below 60 is excluded', () => evaluate({ ...CASES.C, quality: 59.9 }).score === null);
  check('Risk 80 is eligible', () => evaluate({ ...CASES.C, risk: 80 }).status === 'ELIGIBLE');
  check('Risk above 80 is excluded', () => evaluate({ ...CASES.C, risk: 80.1 }).score === null);
  check('Unmet prerequisites exclude a candidate', () => evaluate({ ...CASES.C, prerequisites: false }).score === null);
  check('All applicable exclusion reasons are retained', () => evaluate({ ...CASES.D, risk: 81, prerequisites: false }).reasons.length === 3);
  for (const [key, value] of [['k', 0], ['k', 10.1], ['H', 0], ['H', 366], ['beta', -1], ['gamma', -1], ['w_u', -1], ['w_m', NaN], ['w_c', Infinity]]) {
    check(`Reject invalid ${key} = ${String(value)}`, () => reject(CASES.C, { [key]: value }));
  }
  check('Accept the lower k and H endpoints', () => Number.isFinite(evaluate(CASES.C, { k: 0.1, H: 0.25 }).score));
  check('Accept the upper k and H endpoints', () => Number.isFinite(evaluate(CASES.C, { k: 10, H: 365 }).score));
  check('Reject zero total normalization weight', () => reject(CASES.C, { w_u: 0, w_m: 0, w_c: 0, gamma: 0 }));
  check('Reject overflowed normalization weight', () => reject(CASES.C, { w_u: Number.MAX_VALUE, w_m: Number.MAX_VALUE }));
  check('Scaling a single positive weight down to the smallest number preserves the score', () => near(evaluate(CASES.C, { w_u: Number.MIN_VALUE, w_m: 0, w_c: 0, gamma: 0 }).score, evaluate(CASES.C, { w_u: 1, w_m: 0, w_c: 0, gamma: 0 }).score));
  for (const [key, value] of [['benefit', -1], ['readiness', 101], ['cost', Infinity], ['risk', NaN], ['quality', '92'], ['age_days', 366], ['prerequisites', 1]]) {
    check(`Reject invalid ${key} input`, () => reject({ ...CASES.C, [key]: value }));
  }
  check('Validate input before an unmet prerequisite gate', () => reject({ ...CASES.C, benefit: NaN, prerequisites: false }));
  check('Validate policy before an ineligibility gate', () => reject(CASES.D, { k: 0 }));
  check('One invalid candidate does not prevent ranking valid cases', () => {
    const rows = rankCandidates({ broken: { ...CASES.C, benefit: NaN }, valid: CASES.C });
    return rows[0].id === 'valid' && rows[1].status === 'INVALID';
  });
  check('Exact ties resolve by case ID', () => rankCandidates({ Z: CASES.C, A: CASES.C })[0].id === 'A');
  return { total: checks.length, passed: checks.filter(check => check.passed).length, checks };
}

function startUI() {
  const $ = id => document.getElementById(id);
  let selected = 'C';
  let candidates = structuredClone(CASES);
  let policy = { ...DEFAULTS };
  const field = (key, label, min, max, unit, prefix = '') => {
    const wrapper = document.createElement('div'); wrapper.className = 'field';
    const id = `${prefix}${key}`;
    const caption = document.createElement('label'); caption.htmlFor = id;
    caption.append(document.createTextNode(label));
    const units = document.createElement('span'); units.textContent = unit; caption.append(units);
    const input = document.createElement('input'); input.type = 'number'; input.id = id; input.name = id;
    input.min = min; if (max !== null) input.max = max; input.step = 'any'; input.required = true;
    input.addEventListener('input', () => {
      const value = input.value === '' ? NaN : input.valueAsNumber;
      if (prefix) policy[key] = value; else candidates[selected][key] = value;
      input.setAttribute('aria-invalid', String(!input.validity.valid)); render();
    });
    wrapper.append(caption, input); return wrapper;
  };
  for (const [key, label, max, unit] of INPUTS) $('input-fields').append(field(key, label, 0, max, unit));
  for (const [key, label, min, max, unit] of POLICY) $('policy-fields').append(field(key, label, min, max, unit, 'policy-'));
  for (const id of Object.keys(CASES)) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `Case ${id}`;
    button.dataset.case = id; button.setAttribute('aria-pressed', String(id === selected));
    button.addEventListener('click', () => { selected = id; syncFields(); render(); });
    $('case-buttons').append(button);
  }
  $('prerequisites').addEventListener('change', event => { candidates[selected].prerequisites = event.target.checked; render(); });
  $('candidate-form').addEventListener('submit', event => event.preventDefault());
  $('reset').addEventListener('click', () => { candidates = structuredClone(CASES); policy = { ...DEFAULTS }; selected = 'C'; syncFields(); render(); });

  function syncFields() {
    for (const [key] of INPUTS) { $(key).value = Number.isFinite(candidates[selected][key]) ? candidates[selected][key] : ''; $(key).removeAttribute('aria-invalid'); }
    for (const [key] of POLICY) { $(`policy-${key}`).value = Number.isFinite(policy[key]) ? policy[key] : ''; $(`policy-${key}`).removeAttribute('aria-invalid'); }
    $('prerequisites').checked = candidates[selected].prerequisites;
    for (const button of $('case-buttons').children) button.setAttribute('aria-pressed', String(button.dataset.case === selected));
  }
  const scoreText = value => value === null ? '—' : value.toFixed(2);
  function cell(row, value, className = '') { const td = document.createElement('td'); td.textContent = value; if (className) td.className = className; row.append(td); return td; }
  function render() {
    const edited = INPUTS.some(([key]) => candidates[selected][key] !== CASES[selected][key]) || candidates[selected].prerequisites !== CASES[selected].prerequisites;
    $('case-note').textContent = edited ? 'Edited case · Reset all restores the original examples.' : { A: 'Strong benefit, but older and higher risk.', B: 'High readiness, recent and low risk.', C: 'Fresh information, lower cost and balanced inputs.', D: 'Strong inputs, but data quality fails the gate.' }[selected];
    $('result-title').textContent = `Case ${selected}${edited ? ' · edited' : ''}`;
    $('trace-case').textContent = `Case ${selected} / current policy`;
    let result;
    try { result = evaluate(candidates[selected], policy); }
    catch (error) { result = { status: 'INVALID', score: null, error: error.message }; }
    const eligible = result.status === 'ELIGIBLE';
    const invalid = result.status === 'INVALID';
    $('error').hidden = !invalid; $('error').textContent = result.error || '';
    $('eligibility').textContent = invalid ? 'Invalid input' : eligible ? 'Eligible' : 'Excluded';
    $('eligibility').className = `badge ${invalid ? 'invalid' : eligible ? '' : 'excluded'}`;
    $('score').textContent = scoreText(result.score);
    $('score-meter').style.width = `${eligible ? Math.min(100, Math.max(0, result.score)) : 0}%`;
    $('score-context').textContent = invalid ? 'Correct the highlighted input or policy setting to continue.' : eligible ? 'All eligibility conditions are met. The current rules determine this score.' : result.reasons.map(reason => REASONS[reason]).join(' · ');
    $('result-status').textContent = `Case ${selected}: ${invalid ? result.error : eligible ? `eligible, priority score ${result.score.toFixed(2)}` : `excluded, ${result.reasons.map(reason => REASONS[reason]).join(', ')}`}`;
    const rows = rankCandidates(candidates, policy);
    $('ranking').replaceChildren();
    let rank = 0;
    for (const item of rows) {
      const tr = document.createElement('tr'); if (item.id === selected) tr.className = 'selected';
      const rankCell = cell(tr, ''); const marker = document.createElement('span'); marker.className = 'rank-number'; marker.textContent = item.score !== null ? String(++rank) : '—'; rankCell.append(marker);
      cell(tr, `Case ${item.id}${item.id === selected ? ' •' : ''}`); cell(tr, scoreText(item.score));
      const stateText = item.status === 'INVALID' ? 'Invalid input' : item.score !== null ? 'Eligible' : item.reasons.map(reason => REASONS[reason]).join('; ');
      cell(tr, stateText, `row-status ${item.score === null ? 'excluded' : ''}`); $('ranking').append(tr);
    }
    $('trace').replaceChildren(); $('contributions').replaceChildren();
    if (eligible) {
      for (const [key, title, description] of [['U', 'Benefit U', 'Saturation'], ['B', 'Base B', 'Normalized blend'], ['D', 'Time D', 'Age decay'], ['P', 'Risk P', 'Attenuation'], ['q', 'Quality q', 'Direct multiplier'], ['Z', 'Weight Z', 'Normalization']]) {
        const div = document.createElement('div'); div.className = 'trace-item';
        const label = document.createElement('span'); label.textContent = title;
        const value = document.createElement('strong'); value.textContent = result[key].toFixed(6);
        const note = document.createElement('small'); note.textContent = description;
        div.append(label, value, note); $('trace').append(div);
      }
      for (const [name, value] of Object.entries(result.contributions)) {
        const div = document.createElement('div'); const label = document.createElement('div'); label.className = 'contribution-label';
        const title = document.createElement('span'); title.textContent = name[0].toUpperCase() + name.slice(1);
        const number = document.createElement('strong'); number.textContent = value.toFixed(4);
        label.append(title, number); const bar = document.createElement('div'); bar.className = 'contribution-bar';
        const fill = document.createElement('span'); fill.style.width = `${result.score > 0 ? 100 * value / result.score : 0}%`; bar.append(fill); div.append(label, bar); $('contributions').append(div);
      }
    } else {
      const p = document.createElement('p'); p.className = 'trace-unavailable'; p.textContent = invalid ? 'A calculation trace is available after valid inputs and policy are restored.' : 'Eligibility is evaluated before scoring. No score or contribution trace is produced for an excluded candidate.'; $('trace').append(p);
    }
    renderSensitivity();
  }

  function chart(container, series, xMax, xTicks, xLabel, ariaLabel) {
    container.replaceChildren();
    if (!series.some(line => line.points.some(point => point[1] !== null))) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'No eligible, valid results are available for this view.'; container.append(p); return; }
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 460 195'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', ariaLabel);
    const draw = (name, attrs, content) => { const el = document.createElementNS(NS, name); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value); if (content !== undefined) el.textContent = content; svg.append(el); return el; };
    const x = value => 33 + value / xMax * 408; const y = value => 150 - value / 100 * 127;
    for (const tick of [0, 50, 100]) { draw('line', { x1: 33, x2: 441, y1: y(tick), y2: y(tick), class: 'axis' }); draw('text', { x: 24, y: y(tick) + 3, 'text-anchor': 'end' }, tick); }
    for (const tick of xTicks) draw('text', { x: x(tick), y: 168, 'text-anchor': 'middle' }, tick);
    draw('text', { x: 237, y: 189, 'text-anchor': 'middle' }, xLabel);
    for (const line of series) {
      let path = '', drawing = false;
      for (const [a, b] of line.points) { if (b === null) { drawing = false; continue; } path += `${drawing ? 'L' : 'M'}${x(a).toFixed(2)},${y(b).toFixed(2)} `; drawing = true; }
      if (path) draw('path', { d: path, fill: 'none', stroke: line.color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    }
    container.append(svg);
    const legend = document.createElement('div'); legend.className = 'chart-legend';
    for (const item of series) { const label = document.createElement('span'); label.style.setProperty('--legend', item.color); label.textContent = item.name; legend.append(label); } container.append(legend);
  }
  function renderSensitivity() {
    const safeScore = (raw, overrides) => { try { return evaluate(raw, { ...policy, ...overrides }).score; } catch { return null; } };
    const halfSeries = ['B', 'C'].map((id, index) => ({ name: `Case ${id}`, color: index ? '#007d7f' : '#7693b6', points: Array.from({ length: 61 }, (_, i) => { const H = 0.25 + i * 29.75 / 60; return [H, safeScore(candidates[id], { H })]; }) }));
    chart($('half-life-chart'), halfSeries, 30, [0, 7, 14, 30], 'Half-life H (days) · score on vertical axis', 'Priority score versus time half-life for Cases B and C. Exact values for 7, 14 and 30 days follow in the table.');
    $('half-life-table').replaceChildren();
    for (const H of [7, 14, 30]) {
      const b = safeScore(candidates.B, { H }), c = safeScore(candidates.C, { H }); const tr = document.createElement('tr');
      cell(tr, `${H} days`); cell(tr, scoreText(b)); cell(tr, scoreText(c)); cell(tr, b === null && c === null ? '—' : b === null ? 'C only' : c === null ? 'B only' : Math.abs(b - c) < 1e-12 ? 'Tie' : b > c ? 'B' : 'C'); $('half-life-table').append(tr);
    }
    const gammaSeries = [{ name: `Case ${selected}`, color: '#007d7f', points: Array.from({ length: 51 }, (_, i) => [i / 50, safeScore(candidates[selected], { gamma: i / 50 })]) }];
    chart($('gamma-chart'), gammaSeries, 1, [0, 0.2, 0.5, 1], 'Interaction coefficient gamma · score on vertical axis', `Priority score versus interaction coefficient for Case ${selected}. Exact values at gamma zero and the current gamma follow.`);
    $('gamma-comparison').replaceChildren();
    for (const [label, value] of [['gamma = 0', safeScore(candidates[selected], { gamma: 0 })], [`Current gamma = ${Number.isFinite(policy.gamma) ? policy.gamma : 'invalid'}`, safeScore(candidates[selected], {})]]) {
      const div = document.createElement('div'); const caption = document.createElement('span'); caption.textContent = label; const score = document.createElement('strong'); score.textContent = scoreText(value); div.append(caption, score); $('gamma-comparison').append(div);
    }
  }
  $('run-checks').addEventListener('click', () => {
    const started = performance.now(); const report = runSelfChecks(); const elapsed = performance.now() - started;
    $('checks-status').textContent = `${report.passed} / ${report.total} checks passed · ${elapsed.toFixed(1)} ms · Run at ${new Date().toLocaleTimeString('en-GB', { hour12: false })} (your local time). Fixed test fixtures are independent of your edits above.`;
    $('checks-status').className = `check-status ${report.passed === report.total ? 'passed' : 'failed'}`;
    $('checks-list').replaceChildren();
    for (const item of report.checks) { const li = document.createElement('li'); if (!item.passed) li.className = 'failed'; const status = document.createElement('span'); status.textContent = item.passed ? 'PASS · ' : 'FAIL · '; li.append(status, document.createTextNode(`${item.name}${item.error ? `: ${item.error}` : ''}`)); $('checks-list').append(li); }
    $('checks-details').hidden = false;
  });
  syncFields(); render();
}

if (typeof document !== 'undefined') startUI();
