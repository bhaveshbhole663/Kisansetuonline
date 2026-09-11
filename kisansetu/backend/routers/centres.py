from fastapi import APIRouter, HTTPException, Query
from datetime import date
from database import get_connection

router = APIRouter(prefix="/api/centres", tags=["centres"])

@router.get("")
def list_centres(target_date: str = Query(default=None)):
    if not target_date:
        target_date = date.today().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM centres WHERE active = 1 ORDER BY id ASC")
        centres = [dict(c) for c in cursor.fetchall()]

        # Compute utilization for each centre on target_date
        for c in centres:
            cursor.execute("""
                SELECT SUM(capacity) as total_cap, SUM(booked_count) as total_booked
                FROM slots
                WHERE centre_id = ? AND date = ?
            """, (c["id"], target_date))
            stats = cursor.fetchone()
            total_cap = stats["total_cap"] or c["daily_capacity"] or 100
            total_booked = stats["total_booked"] or 0
            load_pct = min(100, round((total_booked / total_cap) * 100)) if total_cap > 0 else 0

            c["total_capacity"] = total_cap
            c["total_booked"] = total_booked
            c["available_capacity"] = max(0, total_cap - total_booked)
            c["load_percentage"] = load_pct
            c["is_congested"] = load_pct >= 85

        return {"success": True, "date": target_date, "centres": centres}
    finally:
        conn.close()

@router.get("/{centre_id}/slots")
def get_centre_slots(centre_id: int, target_date: str = Query(default=None)):
    if not target_date:
        target_date = date.today().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM centres WHERE id = ?", (centre_id,))
        centre = cursor.fetchone()
        if not centre:
            raise HTTPException(status_code=404, detail="Centre not found")

        cursor.execute("""
            SELECT * FROM slots
            WHERE centre_id = ? AND date = ?
            ORDER BY start_time ASC
        """, (centre_id, target_date))
        slots = [dict(s) for s in cursor.fetchall()]

        if not slots:
            time_windows = [
                ("08:00", "09:00", 20),
                ("09:00", "10:00", 20),
                ("10:00", "11:00", 20),
                ("11:00", "12:00", 20),
                ("13:00", "14:00", 20),
                ("14:00", "15:00", 20),
            ]
            for start_t, end_t, cap in time_windows:
                cursor.execute("""
                    INSERT INTO slots (centre_id, date, start_time, end_time, capacity, booked_count, status)
                    VALUES (?, ?, ?, ?, ?, 0, 'AVAILABLE')
                """, (centre_id, target_date, start_t, end_t, cap))
            conn.commit()
            cursor.execute("""
                SELECT * FROM slots
                WHERE centre_id = ? AND date = ?
                ORDER BY start_time ASC
            """, (centre_id, target_date))
            slots = [dict(s) for s in cursor.fetchall()]

        # Check Smart Slot Recommendation
        recommendations = []
        # Find slots with lowest load
        available_slots = [s for s in slots if s["booked_count"] < s["capacity"]]
        if available_slots:
            best_slot = min(available_slots, key=lambda s: s["booked_count"])
            recommendations.append({
                "type": "OPTIMAL_SLOT",
                "slot_id": best_slot["id"],
                "time_window": f"{best_slot['start_time']} - {best_slot['end_time']}",
                "message": f"Optimal traffic: {best_slot['start_time']} - {best_slot['end_time']} has lowest expected waiting time."
            })

        # If centre is over 80% full, check for alternative neighboring centres
        cursor.execute("""
            SELECT SUM(capacity) as total_cap, SUM(booked_count) as total_booked
            FROM slots
            WHERE centre_id = ? AND date = ?
        """, (centre_id, target_date))
        stats = cursor.fetchone()
        if stats and stats["total_cap"]:
            load = (stats["total_booked"] or 0) / stats["total_cap"]
            if load >= 0.8:
                # Find alternative centre in same district with < 70% load
                cursor.execute("""
                    SELECT c.id, c.name, c.district, SUM(s.capacity) as cap, SUM(s.booked_count) as booked
                    FROM centres c
                    JOIN slots s ON s.centre_id = c.id
                    WHERE c.id != ? AND s.date = ? AND c.active = 1
                    GROUP BY c.id
                    HAVING (CAST(SUM(s.booked_count) AS FLOAT) / SUM(s.capacity)) < 0.70
                    ORDER BY (CAST(SUM(s.booked_count) AS FLOAT) / SUM(s.capacity)) ASC
                    LIMIT 1
                """, (centre_id, target_date))
                alt_centre = cursor.fetchone()
                if alt_centre:
                    alt_load = round(((alt_centre["booked"] or 0) / (alt_centre["cap"] or 1)) * 100)
                    recommendations.append({
                        "type": "ALTERNATIVE_CENTRE",
                        "centre_id": alt_centre["id"],
                        "centre_name": alt_centre["name"],
                        "message": f"Smart Load Balancing: {centre['name']} is crowded ({round(load*100)}% load). {alt_centre['name']} is only at {alt_load}% capacity with near-zero waiting time."
                    })

        return {
            "success": True,
            "centre": dict(centre),
            "date": target_date,
            "slots": slots,
            "recommendations": recommendations
        }
    finally:
        conn.close()
