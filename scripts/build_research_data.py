#!/usr/bin/env python3
"""
Chuyển kết quả nghiên cứu AirPulse V2 (Mỹ) và V3 (Việt Nam) thành JSON gọn cho website.

Không tạo số liệu mới: script chỉ đọc, kiểm tra và đổi định dạng các file kết quả.
Mọi phép kiểm tra ghép dữ liệu được ghi lại vào JSON đầu ra (join_audit) để website hiển thị.

Cách chạy (từ thư mục gốc project):
    python3 scripts/build_research_data.py --v2 research/V2 --v3 research/V3

    --v2  thư mục đã giải nén AirPulse_V2_Results.zip
    --v3  thư mục đã giải nén AirPulse_V3_Results.zip
Đầu ra: public/data/research/*.json
"""
import argparse
import json
import math
import re
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "research"
FLIGHTS = ROOT / "public" / "flights.json"

EXPERIMENTS = ["real_pilot", "synthetic_to_real", "synthetic_only"]
MODELS = ["logistic", "xgboost"]
WINDOWS = range(1, 8)
MODEL_FILE_PATTERNS = ["*.pkl", "*.joblib", "*.json", "*.ubj", "*.bst", "*.onnx", "*.py", "*.ipynb"]


def clean(v):
    """Chuyển giá trị pandas/numpy sang JSON thuần, giữ None cho NaN."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if hasattr(v, "item"):
        v = v.item()
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
    return v


def records(df):
    return [{k: clean(v) for k, v in row.items()} for row in df.to_dict(orient="records")]


def r4(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), 4)


def write(name, obj):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size/1024:.0f} KB)")


def model_artifacts(folder: Path):
    found = []
    for pat in MODEL_FILE_PATTERNS:
        for p in folder.rglob(pat):
            if p.name.startswith("results_"):  # results_V2_fair.json là bảng kết quả, không phải model
                continue
            found.append(p.name)
    return sorted(found)


# --------------------------------------------------------------------------- V2
def build_v2(v2: Path):
    print("V2 (US benchmark)")
    res = pd.read_csv(v2 / "results_V2_fair.csv")
    res["confusion_matrix"] = res["confusion_matrix"].apply(json.loads)
    split = pd.read_csv(v2 / "split_summary_V2.csv")
    audit_df = pd.read_csv(v2 / "data_audit.csv")
    audit = {str(r.iloc[0]): clean(r.iloc[1]) for _, r in audit_df.iterrows()}

    files = sorted(p.name for p in v2.iterdir() if p.is_file())
    payload = {
        "dataset": "V2",
        "label": "US Benchmark",
        "currency": "USD",
        "source_files": files,
        "availability": {
            "aggregate_metrics": True,
            "price_series": False,
            "row_level_predictions": False,
            "row_level_backtest": False,
            "model_artifact": bool(model_artifacts(v2)),
            "feature_pipeline": False,
        },
        "model_files_found": model_artifacts(v2),
        "results": records(res),
        "split_summary": records(split),
        "data_audit": audit,
    }
    write("v2_us_benchmark.json", payload)
    return payload


# --------------------------------------------------------------------------- V3
def parse_real_id(series_id):
    # R_VJ501_HAN_DAD_20261014T0540
    m = re.match(r"^R_([A-Z0-9]+)_([A-Z]{3})_([A-Z]{3})_(\d{8})T(\d{4})$", series_id)
    if not m:
        return None
    fn, o, d, ymd, hm = m.groups()
    return {
        "flight": fn, "origin": o, "destination": d,
        "departure_date": f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:]}",
        "departure_time": f"{hm[:2]}:{hm[2:]}",
    }


def parse_syn_id(series_id):
    # S_QH-HANDAD-2026082712-ECO-0085
    m = re.match(r"^S_([A-Z0-9]+)-([A-Z]{3})([A-Z]{3})-(\d{8})(\d{2})-([A-Z]+)-(\d+)$", series_id)
    if not m:
        return {"label": series_id}
    al, o, d, ymd, hh, cabin, idx = m.groups()
    return {
        "airline_code": al, "origin": o, "destination": d,
        "departure_date": f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:]}", "departure_hour": f"{hh}:00",
        "cabin": cabin, "index": idx,
    }


def build_v3(v3: Path):
    print("V3 (Vietnam pilot)")
    exp = pd.read_csv(v3 / "experiment_results.csv")
    label = pd.read_csv(v3 / "label_audit.csv")
    daud = pd.read_csv(v3 / "data_audit.csv")
    pred = pd.read_csv(v3 / "predictions.csv")

    # wait_n trong file gốc bị âm ở một số dòng -> ghi nhận, tính lại từ ma trận nhầm lẫn
    exp["wait_n_from_cm"] = exp["TP"] + exp["FN"]
    exp["wait_n_reported_inconsistent"] = exp["wait_n"] != exp["wait_n_from_cm"]

    # ---- backtest theo dòng
    bt_frames = []
    missing_bt = []
    for e in EXPERIMENTS:
        for m in MODELS:
            for W in WINDOWS:
                f = v3 / f"backtest_{e}_{m}_W{W}.csv"
                if not f.exists():
                    missing_bt.append(f.name)
                    continue
                b = pd.read_csv(f)
                b["experiment"], b["model"], b["W"] = e, m, W
                bt_frames.append(b)
    bt = pd.concat(bt_frames, ignore_index=True)
    merged = pred.merge(bt, on=["experiment", "model", "W", "series_id", "obs_date"], how="outer", indicator=True)
    thr = {(r.experiment, r.model, int(r.W)): float(r.threshold) for r in exp.itertuples()}
    merged["threshold"] = [thr.get((a, b, int(c))) for a, b, c in zip(merged.experiment, merged.model, merged.W)]
    both = merged[merged["_merge"] == "both"]

    checks = {
        "predictions_rows": int(len(pred)),
        "backtest_rows": int(len(bt)),
        "matched_rows": int(len(both)),
        "predictions_without_backtest": int((merged["_merge"] == "left_only").sum()),
        "backtest_without_prediction": int((merged["_merge"] == "right_only").sum()),
        "buy_cost_equals_price_pct": round(float((both.buy_cost == both.price).mean() * 100), 3),
        "purchase_day0_iff_p_below_threshold_pct": round(
            float(((both.purchase_day == 0) == (both.p_wait < both.threshold)).mean() * 100), 3),
        "savings_equals_buy_minus_model_pct": round(
            float(((both.savings - (both.buy_cost - both.model_cost)).abs() < 1).mean() * 100), 3),
        "missing_backtest_files": missing_bt,
    }

    # ---- ghép với flights.json của website
    flights = json.loads(FLIGHTS.read_text(encoding="utf-8"))["flights"]
    by_id = {f["id"]: f for f in flights}
    real = both[both.series_id.str.startswith("R_")]
    real_ids = sorted(real.series_id.unique())
    unmatched, time_mismatch = [], []
    for sid in real_ids:
        fid = sid[2:]
        f = by_id.get(fid)
        meta = parse_real_id(sid)
        if f is None:
            unmatched.append(sid)
            continue
        dep = f["departure_at"].replace(" ", "T")[:16]
        if meta and dep != f"{meta['departure_date']}T{meta['departure_time']}":
            time_mismatch.append(sid)
        if meta and f["flight_number"].replace(" ", "") != meta["flight"]:
            time_mismatch.append(sid)

    # Giá ngày trong V3 so với giá quan sát trong ngày (giờ Việt Nam) của flights.json
    daily = real.drop_duplicates(["series_id", "obs_date"])[["series_id", "obs_date", "price"]]
    n_median = n_in_day = n_total = 0
    for r in daily.itertuples():
        f = by_id.get(r.series_id[2:])
        if not f:
            continue
        day = [p["price_vnd"] for p in f.get("price_history") or [] if p["observed_at"][:10] == r.obs_date]
        if not day:
            continue
        n_total += 1
        n_median += abs(statistics.median(day) - r.price) < 1
        n_in_day += r.price in day

    join_audit = {
        "rule": "series_id = 'R_' + flights.json id; id = {flight_number bỏ khoảng trắng}_{origin}_{destination}_{YYYYMMDD}T{HHMM}",
        "real_series_in_results": len(real_ids),
        "website_flights": len(flights),
        "matched": len(real_ids) - len(unmatched),
        "unmatched_series": unmatched,
        "departure_or_flight_number_mismatch": time_mismatch,
        "daily_price_checked": n_total,
        "daily_price_equals_vn_day_median": int(n_median),
        "daily_price_found_in_vn_day_observations": int(n_in_day),
        "series_by_experiment": {
            e: int(both[both.experiment == e].series_id.nunique()) for e in EXPERIMENTS
        },
    }
    checks["join"] = join_audit
    print("  join:", json.dumps(join_audit, ensure_ascii=False)[:400])

    # ---- tóm tắt
    summary = {
        "dataset": "V3",
        "label": "Vietnam Pilot",
        "currency": "VND",
        "source_files_count": len([p for p in v3.iterdir() if p.is_file()]),
        "availability": {
            "aggregate_metrics": True,
            "price_series": True,
            "price_series_note": "Giá ngày (trung vị các lần quan sát trong ngày, giờ VN) có trong predictions.csv; giá theo giờ của 232 chuyến thật có trong flights.json.",
            "row_level_predictions": True,
            "row_level_backtest": True,
            "price_forecast": False,
            "model_artifact": bool(model_artifacts(v3)),
            "feature_pipeline": False,
        },
        "model_files_found": model_artifacts(v3),
        "experiments": records(exp),
        "label_audit": records(label),
        "data_audit": records(daud),
        "checks": checks,
        "experiment_notes": {
            "real_pilot": "Huấn luyện và kiểm tra trên dữ liệu thật VN; predictions chỉ chứa tập kiểm tra (47 chuyến).",
            "synthetic_to_real": "Huấn luyện trên dữ liệu tổng hợp, kiểm tra trên toàn bộ 232 chuyến thật.",
            "synthetic_only": "Huấn luyện và kiểm tra trên dữ liệu tổng hợp (54 chuỗi kiểm tra).",
        },
    }
    write("v3_summary.json", summary)

    # ---- chuỗi theo flight: dạng cột gọn
    def series_payload(frame, is_real):
        dates = sorted(frame.obs_date.unique())
        di = {d: i for i, d in enumerate(dates)}
        out = {}
        for sid, g in frame.groupby("series_id"):
            px = g.drop_duplicates("obs_date").sort_values("obs_date")
            # giá ngày phải giống nhau giữa mọi cấu hình
            chk = g.groupby("obs_date").price.nunique()
            if (chk > 1).any():
                print(f"  WARN giá ngày không nhất quán: {sid}", file=sys.stderr)
            runs = {}
            for (e, m, W), h in g.groupby(["experiment", "model", "W"]):
                h = h.sort_values("obs_date")
                runs[f"{e}|{m}|{int(W)}"] = [
                    [di[r.obs_date], r4(r.p_wait), int(r.true_wait), int(r.purchase_day),
                     int(round(r.model_cost)), int(round(r.oracle_cost)), int(round(r.savings))]
                    for r in h.itertuples()
                ]
            out[sid] = {
                "meta": parse_real_id(sid) if is_real else parse_syn_id(sid),
                "daily": [[di[r.obs_date], int(round(r.price))] for r in px.itertuples()],
                "runs": runs,
            }
        return {
            "dates": dates,
            "row_format": ["date_idx", "p_wait", "true_wait", "purchase_day", "model_cost", "oracle_cost", "savings"],
            "series": out,
        }

    write("v3_series_real.json", series_payload(real, True))
    syn = both[both.series_id.str.startswith("S_")]
    write("v3_series_synthetic.json", series_payload(syn, False))
    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--v2", required=True, type=Path)
    ap.add_argument("--v3", required=True, type=Path)
    a = ap.parse_args()
    build_v2(a.v2)
    build_v3(a.v3)


if __name__ == "__main__":
    main()
