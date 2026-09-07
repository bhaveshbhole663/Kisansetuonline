from fastapi import APIRouter, HTTPException
from datetime import datetime, date
from database import get_connection
from models import WalkInRegisterRequest

router = APIRouter(prefix="/api/admin/walkins", tags=["walkins"])

@router.post("")
def register_walk_in(req: WalkInRegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()
    ddmm = datetime.strptime(today_str, "%Y-%m-%d").strftime("%d%m")
    try:
        # Check or create farmer
        cursor.execute("SELECT id FROM farmers WHERE mobile = ?", (req.mobile,))
        f_row = cursor.fetchone()
        if f_row:
            farmer_id = f_row["id"]
        else:
            cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES (?, 'FARMER', 'hi', ?)", (req.mobile, now_iso))
            uid = cursor.lastrowid
            ident = f"KID-{req.mobile[-4:]}-MH"
            cursor.execute("""
                INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'hi', ?)
            """, (uid, req.name, req.mobile, req.village or "Local", req.district or "Pune", ident, now_iso))
            farmer_id = cursor.lastrowid

        # Get centre info
        cursor.execute("SELECT * FROM centres WHERE id = ?", (req.centre_id,))
        centre = cursor.fetchone()
        if not centre:
            raise HTTPException(status_code=404, detail="Centre not found")

        # Pick current active slot or create emergency walk-in slot
        cursor.execute("""
            SELECT * FROM slots 
            WHERE centre_id = ? AND date = ? 
            ORDER BY start_time ASC LIMIT 1
        """, (req.centre_id, today_str))
        slot = cursor.fetchone()
        if not slot:
            raise HTTPException(status_code=400, detail="No active slots for today at this centre")

        # Generate walk-in token e.g. PUN-0809-W01
        cursor.execute("""
            SELECT token_number FROM bookings 
            WHERE token_number LIKE ? 
            ORDER BY id DESC LIMIT 1
        """, (f"{centre['code']}-{ddmm}-W%",))
        last_w = cursor.fetchone()
        if last_w:
            try:
                seq = int(last_w["token_number"].split("-W")[-1]) + 1
            except Exception:
                seq = 1
        else:
            seq = 1

        token_num = f"{centre['code']}-{ddmm}-W{str(seq).zfill(2)}"

        # Insert booking with booking_channel = 'WALK_IN'
        cursor.execute("""
            INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
            VALUES (?, ?, ?, ?, 'WALK_IN', 'BOOKED', ?)
        """, (farmer_id, req.centre_id, slot["id"], token_num, now_iso))
        booking_id = cursor.lastrowid

        # Procurement record at 'ARRIVED' status immediately since farmer is physically present
        cursor.execute("""
            INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
            VALUES (?, ?, ?, 'PENDING', 'ARRIVED', 'Walk-in farmer registered at gate', ?, ?)
        """, (booking_id, req.crop, req.estimated_quantity, now_iso, now_iso))
        procurement_id = cursor.lastrowid

        # Payment record
        cursor.execute("""
            INSERT INTO payments (procurement_id, amount, payment_status)
            VALUES (?, 0.0, 'PENDING')
        """, (procurement_id,))

        # History
        cursor.execute("""
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
            VALUES (?, 'REGISTERED', 'ARRIVED', 'ADMIN_GATE', ?, 'On-spot walk-in entry authorized by APMC operator')
        """, (booking_id, now_iso))

        conn.commit()

        return {
            "success": True,
            "message": "Walk-in farmer admitted to live queue",
            "token_number": token_num,
            "booking_id": booking_id,
            "farmer_name": req.name,
            "status": "ARRIVED",
            "channel": "WALK_IN"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
