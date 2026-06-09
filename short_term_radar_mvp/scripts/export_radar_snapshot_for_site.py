from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path
from statistics import mean
from typing import Any


DEFAULT_CANDIDATE_LIMIT = 50


DATASET_LABELS = {
    "prices_daily": "日線價量",
    "monthly_revenue": "月營收",
    "institutional_trading": "法人籌碼",
    "margin_short": "融資融券",
    "surveillance": "注意 / 處置",
    "material_events": "重大訊息",
    "corporate_actions": "除權息 / 公司行動",
    "financial_statement": "財報",
    "valuation": "估值",
    "tdcc_distribution": "TDCC 股權分散",
    "broker_branch_flow": "分點進出",
}


KEY_DATASETS = [
    "prices_daily",
    "monthly_revenue",
    "institutional_trading",
    "margin_short",
    "surveillance",
    "material_events",
    "corporate_actions",
    "financial_statement",
    "valuation",
    "tdcc_distribution",
    "broker_branch_flow",
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Export short-term radar CSV reports to a site JSON snapshot.")
    parser.add_argument("--scan", required=True, help="Radar scan CSV path.")
    parser.add_argument("--freshness", required=True, help="Data freshness CSV path.")
    parser.add_argument("--coverage", required=True, help="Data coverage CSV path.")
    parser.add_argument("--output", required=True, help="Output JSON path for the Next.js site.")
    parser.add_argument("--as-of", required=True, help="Scan date shown in the site.")
    parser.add_argument("--limit", type=int, default=DEFAULT_CANDIDATE_LIMIT)
    args = parser.parse_args()

    scan_rows = read_csv(Path(args.scan))
    freshness_rows = read_csv(Path(args.freshness))
    coverage_rows = read_csv(Path(args.coverage))

    candidates = [normalize_candidate(row) for row in scan_rows[: args.limit]]
    snapshot = {
        "asOfDate": args.as_of,
        "createdAt": candidates[0]["createdAt"] if candidates else None,
        "sourceReport": str(Path(args.scan).as_posix()),
        "summary": build_summary(candidates),
        "candidates": candidates,
        "datasetStatus": build_dataset_status(freshness_rows, coverage_rows),
        "notices": [
            "短線雷達是條件掃描與觀察清單，不是買賣建議。",
            "候選結果需由使用者自行確認，並搭配交易成本、流動性、滑價與風險承受度評估。",
            "部分資料源受官方公告節奏、來源限制或市場別差異影響，請以資料源狀態為準。",
        ],
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote radar site snapshot to {output}")
    return 0


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_candidate(row: dict[str, str]) -> dict[str, Any]:
    return {
        "rank": to_int(row.get("rank")),
        "symbol": text(row.get("symbol")),
        "name": text(row.get("name")),
        "industry": text(row.get("industry")),
        "scoreTotal": to_float(row.get("score_total")),
        "scores": {
            "revenue": to_float(row.get("score_revenue")),
            "expectationGap": to_float(row.get("score_expectation_gap")),
            "priceVolume": to_float(row.get("score_price_volume")),
            "themeGroup": to_float(row.get("score_theme_group")),
            "chip": to_float(row.get("score_chip")),
            "catalyst": to_float(row.get("score_catalyst")),
        },
        "riskPenalty": to_float(row.get("risk_penalty")),
        "stage": text(row.get("stage")),
        "entryZone": text(row.get("entry_zone")),
        "reasons": parse_json_list(row.get("reasons")),
        "riskFlags": parse_json_list(row.get("risk_flags")),
        "lastClose": to_float(row.get("last_close")),
        "ret20d": to_float(row.get("ret_20d")),
        "ret60d": to_float(row.get("ret_60d")),
        "volumeZ20": to_float(row.get("volume_z_20")),
        "volumeExpansionRatio": to_float(row.get("volume_expansion_ratio")),
        "breakoutFlag": to_bool(row.get("breakout_flag")),
        "breakout120dFlag": to_bool(row.get("breakout_120d_flag")),
        "maAlignmentBullFlag": to_bool(row.get("ma_alignment_bull_flag")),
        "mode": text(row.get("mode")),
        "scoreDataCoverageRatio": to_float(row.get("score_data_coverage_ratio")),
        "robotSlotCoverageRatio": to_float(row.get("robot_slot_coverage_ratio")),
        "robotSlotStatuses": parse_json_dict(row.get("robot_slot_statuses")),
        "availableRadars": parse_json_list(row.get("available_radars")),
        "degradedRadars": parse_json_list(row.get("degraded_radars")),
        "coreDataReady": to_bool(row.get("core_data_ready_flag")),
        "createdAt": text(row.get("created_at")),
    }


def build_summary(candidates: list[dict[str, Any]]) -> dict[str, Any]:
    stage_counts = Counter(candidate["stage"] for candidate in candidates if candidate.get("stage"))
    entry_zone_counts = Counter(candidate["entryZone"] for candidate in candidates if candidate.get("entryZone"))
    coverage_values = [
        candidate["scoreDataCoverageRatio"]
        for candidate in candidates
        if isinstance(candidate.get("scoreDataCoverageRatio"), (int, float))
    ]
    slot_values = [
        candidate["robotSlotCoverageRatio"]
        for candidate in candidates
        if isinstance(candidate.get("robotSlotCoverageRatio"), (int, float))
    ]
    return {
        "totalCandidates": len(candidates),
        "mode": candidates[0]["mode"] if candidates else None,
        "stageCounts": dict(stage_counts),
        "entryZoneCounts": dict(entry_zone_counts),
        "coreReadyCount": sum(1 for candidate in candidates if candidate.get("coreDataReady")),
        "averageScoreCoverage": round(mean(coverage_values), 4) if coverage_values else None,
        "averageSlotCoverage": round(mean(slot_values), 4) if slot_values else None,
        "topScore": candidates[0]["scoreTotal"] if candidates else None,
    }


def build_dataset_status(
    freshness_rows: list[dict[str, str]],
    coverage_rows: list[dict[str, str]],
) -> list[dict[str, Any]]:
    freshness_by_dataset: dict[str, list[dict[str, str]]] = {}
    for row in freshness_rows:
        dataset = row.get("dataset") or ""
        freshness_by_dataset.setdefault(dataset, []).append(row)

    coverage_by_dataset: dict[str, list[dict[str, str]]] = {}
    for row in coverage_rows:
        dataset = row.get("dataset") or ""
        coverage_by_dataset.setdefault(dataset, []).append(row)

    statuses = []
    for dataset in KEY_DATASETS:
        rows = freshness_by_dataset.get(dataset, [])
        coverage = coverage_by_dataset.get(dataset, [])
        markets = sorted({text(row.get("market")) for row in rows + coverage if text(row.get("market"))})
        latest_values = [text(row.get("latest_available_date_or_month")) for row in rows]
        latest_values = [value for value in latest_values if value]
        freshness_states = [text(row.get("freshness_status")) or "unknown" for row in rows]
        actual_count = sum(to_int(row.get("actual_count")) or 0 for row in coverage)
        expected_count = sum(to_int(row.get("expected_count")) or 0 for row in coverage)
        statuses.append(
            {
                "dataset": dataset,
                "label": DATASET_LABELS.get(dataset, dataset),
                "markets": markets,
                "latest": max(latest_values) if latest_values else None,
                "freshness": summarize_freshness(freshness_states, actual_count),
                "freshnessBreakdown": dict(Counter(freshness_states)),
                "actualCount": actual_count,
                "expectedCount": expected_count,
            }
        )
    return statuses


def summarize_freshness(states: list[str], actual_count: int) -> str:
    if not states:
        return "unknown"
    if all(state == "fresh" for state in states):
        return "fresh"
    if any(state == "fresh" for state in states):
        return "partial"
    if any(state == "source_missing" for state in states):
        return "source_missing"
    if actual_count > 0:
        return "historical"
    return "stale"


def parse_json_list(value: str | None) -> list[str]:
    parsed = parse_json(value)
    return parsed if isinstance(parsed, list) else []


def parse_json_dict(value: str | None) -> dict[str, Any]:
    parsed = parse_json(value)
    return parsed if isinstance(parsed, dict) else {}


def parse_json(value: str | None) -> Any:
    value = text(value)
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def to_float(value: str | None) -> float | None:
    value = text(value)
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def to_int(value: str | None) -> int | None:
    number = to_float(value)
    return int(number) if number is not None else None


def to_bool(value: str | None) -> bool:
    value = text(value)
    return value in {"1", "true", "True", "TRUE", "yes", "Y"}


def text(value: str | None) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


if __name__ == "__main__":
    raise SystemExit(main())
