#!/usr/bin/env python3
"""
import_attendance.py — Bulk Upload Attendance Logs

Parses a CSV file and upserts attendance records into Supabase.

CSV Format:
  EmployeeIdentifier, Date, InTime, OutTime, Status, Remarks

  - EmployeeIdentifier: Can be email or employee_id
  - Date: YYYY-MM-DD
  - InTime: HH:MM (24h) or empty
  - OutTime: HH:MM (24h) or empty
  - Status: present | absent | half_day | on_leave | holiday | weekend
  - Remarks: Optional text

Usage:
  python3 execution/import_attendance.py <path_to_csv>
"""

import csv
import sys
import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# ── Load env ────────────────────────────────────────────────────────────────

def load_env(env_path: str = ".env") -> dict:
    env = {}
    path = Path(env_path)
    if not path.exists():
        root_env = Path(__file__).resolve().parent.parent / ".env"
        if root_env.exists():
            path = root_env
        else:
            return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env

# ── Supabase Helpers ────────────────────────────────────────────────────────

def supabase_request(url: str, key: str, endpoint: str, method: str = "GET", data: dict = None, params: str = ""):
    full_url = f"{url}/rest/v1/{endpoint}{params}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",  # Get back the inserted/updated row
    }
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(full_url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"❌ API Error {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Request Failed: {str(e)}")
        return None

def fetch_employees(url: str, key: str) -> dict:
    """Returns a lookup dict: {email: uuid, employee_code: uuid}"""
    print("⏳ Fetching employee list...")
    data = supabase_request(url, key, "employees", params="?select=id,email,employee_id")
    if not data:
        print("❌ Could not fetch employees.")
        return {}
    
    lookup = {}
    for emp in data:
        if emp.get("email"):
            lookup[emp["email"].lower()] = emp["id"]
        if emp.get("employee_id"):
            lookup[emp["employee_id"].lower()] = emp["id"]
    
    print(f"✅ Loaded {len(data)} employees.")
    return lookup

# ── Main Logic ──────────────────────────────────────────────────────────────

def parse_time(date_str: str, time_str: str) -> str:
    """Combines YYYY-MM-DD and HH:MM into ISO8601 string."""
    if not time_str or not time_str.strip():
        return None
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        return dt.isoformat()
    except ValueError:
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 execution/import_attendance.py <path_to_csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        sys.exit(1)

    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") or env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Missing Supabase credentials in .env")
        sys.exit(1)

    employee_lookup = fetch_employees(url, key)
    if not employee_lookup:
        sys.exit(1)

    success_count = 0
    fail_count = 0

    print(f"\nProcessing {csv_path}...")

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        headers = [h.strip().lower() for h in reader.fieldnames]
        
        # Mapping helpers
        def get_col(row, *aliases):
            for a in aliases:
                for k in row.keys():
                    if k.strip().lower() == a:
                        return row[k]
            return None

        for row in reader:
            emp_identifier = get_col(row, "employeeidentifier", "code", "email", "employee_id")
            date_str = get_col(row, "date", "attendance_date")
            status = get_col(row, "status")
            in_time = get_col(row, "intime", "in_time", "check_in")
            out_time = get_col(row, "outtime", "out_time", "check_out")
            remarks = get_col(row, "remarks", "note")

            if not emp_identifier or not date_str or not status:
                print(f"⚠️  Skipping invalid row: {row}")
                fail_count += 1
                continue

            # Resolve Employee ID
            emp_uuid = employee_lookup.get(emp_identifier.lower())
            if not emp_uuid:
                print(f"⚠️  Employee not found: {emp_identifier}")
                fail_count += 1
                continue

            # Construct Payload
            payload = {
                "employee_id": emp_uuid,
                "date": date_str,
                "status": status.lower(),
                "check_in": parse_time(date_str, in_time),
                "check_out": parse_time(date_str, out_time),
                "remarks": remarks
            }

            # Upsert (using on_conflict logic via REST? No, REST upsert uses POST with Prefer: resolution=merge-duplicates)
            # We need to make sure we treat (employee_id, date) as unique key.
            # Supabase upsert requires specifying the on_conflict columns if it's not the PK.
            # We can use the 'unique_employee_date' constraint we just added.
            
            res = supabase_request(
                url, key, 
                "attendance", 
                method="POST", 
                data=payload, 
                params="?on_conflict=employee_id,date"
            )

            if res is not None:
                print(f"✅ Imported: {emp_identifier} on {date_str} ({status})")
                success_count += 1
            else:
                print(f"❌ Failed: {emp_identifier} on {date_str}")
                fail_count += 1

    print("\n" + "="*40)
    print(f"Done. Success: {success_count}, Failed: {fail_count}")
    print("="*40)

if __name__ == "__main__":
    main()
