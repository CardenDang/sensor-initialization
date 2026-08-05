"""
Sleep Environment Monitor - Nightly Aggregation Script
--------------------------------------------------------
Reads your exported Excel workbook (with "Hourly Averages" and "Sleep Log"
tabs) and produces ONE ROW PER NIGHT, matching the exact format that
sleep_quality_model.py expects as input.

Workbook structure expected (3 tabs):
  - "Sensor Data"      : raw per-minute readings (not used directly here)
  - "Hourly Averages"  : period_start, period_end, avg_air_quality, avg_lux,
                          avg_temperature_c, avg_humidity_pct, avg_sound_level,
                          sample_count
  - "Sleep Log"         : session_start, session_end, slept_well

For each row in "Sleep Log", this script finds every "Hourly Averages" row
whose period falls inside that sleep session's start/end window, and
averages them together into a single summary row for that night.

NOTE: There is currently no dedicated CO2 sensor column in the sheet.
As a stand-in, this script maps "air_quality" (MQ135 reading) to the
"co2" column expected by the model. Swap this out once a real CO2/ENS160
column is added to your data.

Output: nightly_summary.csv, ready to feed directly into sleep_quality_model.py
"""

import pandas as pd

# ----------------------------------------------------------------------
# CONFIG - update this to match your actual downloaded Excel file
# ----------------------------------------------------------------------
EXCEL_PATH = "sleep_data.xlsx"
OUTPUT_PATH = "nightly_summary.csv"

SENSOR_DATA_SHEET = "Sensor Data"
HOURLY_AVG_SHEET = "Hourly Averages"
SLEEP_LOG_SHEET = "Sleep Log"

# Map source columns (Hourly Averages tab) -> model feature names
# (sleep_quality_model.py expects: temperature, humidity, co2, light, noise)
COLUMN_MAP = {
    "avg_temperature_c": "temperature",
    "avg_humidity_pct": "humidity",
    "avg_air_quality": "co2",   # stand-in until a real CO2 sensor column exists
    "avg_lux": "light",
    "avg_sound_level": "noise",
}


def load_sheets(path: str):
    """Load the Hourly Averages and Sleep Log tabs from the workbook."""
    hourly_df = pd.read_excel(path, sheet_name=HOURLY_AVG_SHEET)
    sleep_log_df = pd.read_excel(path, sheet_name=SLEEP_LOG_SHEET)

    # Parse timestamp columns as real datetimes so we can compare/filter by time
    hourly_df["period_start"] = pd.to_datetime(hourly_df["period_start"])
    hourly_df["period_end"] = pd.to_datetime(hourly_df["period_end"])
    sleep_log_df["session_start"] = pd.to_datetime(sleep_log_df["session_start"])
    sleep_log_df["session_end"] = pd.to_datetime(sleep_log_df["session_end"])

    return hourly_df, sleep_log_df


def build_nightly_summary(hourly_df: pd.DataFrame, sleep_log_df: pd.DataFrame) -> pd.DataFrame:
    """For each sleep session, average all Hourly Averages rows within that window."""
    nightly_rows = []

    for _, session in sleep_log_df.iterrows():
        start, end = session["session_start"], session["session_end"]

        # Keep only hourly-average rows whose period falls inside this session
        in_session = hourly_df[
            (hourly_df["period_start"] >= start) & (hourly_df["period_end"] <= end)
        ]

        if in_session.empty:
            print(f"Warning: no hourly data found for session {start} -> {end}, skipping.")
            continue

        # Weighted average by sample_count if available, else simple mean
        if "sample_count" in in_session.columns and in_session["sample_count"].sum() > 0:
            weights = in_session["sample_count"]
            averaged = {
                src_col: (in_session[src_col] * weights).sum() / weights.sum()
                for src_col in COLUMN_MAP
            }
        else:
            averaged = {src_col: in_session[src_col].mean() for src_col in COLUMN_MAP}

        row = {new_col: averaged[src_col] for src_col, new_col in COLUMN_MAP.items()}
        row["date"] = start.date()
        row["slept_well"] = str(session["slept_well"]).strip().lower()  # normalize "Yes"/"yes"/"YES" -> "yes"

        nightly_rows.append(row)

    summary_df = pd.DataFrame(nightly_rows)

    # Reorder columns to match sleep_quality_model.py's expected format
    column_order = ["date", "temperature", "humidity", "co2", "light", "noise", "slept_well"]
    summary_df = summary_df[column_order]

    return summary_df


def main():
    print(f"Reading {EXCEL_PATH}...")
    hourly_df, sleep_log_df = load_sheets(EXCEL_PATH)
    print(f"Found {len(hourly_df)} hourly-average rows and {len(sleep_log_df)} sleep sessions.\n")

    summary_df = build_nightly_summary(hourly_df, sleep_log_df)

    summary_df.to_csv(OUTPUT_PATH, index=False)
    print(f"Wrote {len(summary_df)} nightly summary row(s) to {OUTPUT_PATH}\n")
    print(summary_df)


if __name__ == "__main__":
    main()
