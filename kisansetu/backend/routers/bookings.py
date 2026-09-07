from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date
from database import get_connection
from models import BookingCreateRequest

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

def generate_token(cursor, centre_code: str, slot_date: str) -> str:
    # ddmm format
    dt = datetime.strptime(slot_date, "%Y-%m-%d")
    ddmm = dt.strftime("%d%m")
    prefix = f"{centre_code}-{ddmm}-"

    cursor.execute("""
        SELECT token_number FROM bookings 
        WHERE token_number LIKE ? 
        ORDER BY id DESC LIMIT 1
    """, (f"{prefix}%",))
    last_token = cursor.fetchone()

    if last_token:
        try:
            last_seq = int(last_token["token_number"].split("-")[-1])
            new_seq = last_seq + 1
        except Exception:
            new_seq = 35
    else:
        new_seq = 35

    return f"{prefix}{str(new_seq).zfill(3)}"

@router.post("")
def create_booking(req: BookingCreateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    try:
        # Resolve farmer_id if not provided
        farmer_id = req.farmer_id
        if not farmer_id and req.farmer_mobile:
            cursor.execute("SELECT id FROM farmers WHERE mobile = ?", (req.farmer_mobile,))
            f_row = cursor.fetchone()
            if f_row:
                farmer_id = f_row["id"]
            else:
                name = req.farmer_name or f"Farmer {req.farmer_mobile[-4:]}"
                ident = f"KID-{req.farmer_mobile[-4:]}-MH"
                cursor.execute("""
                    INSERT INTO users (phone, role, language, created_at)
                    VALUES (?, 'FARMER', 'hi', ?)
                """, (req.farmer_mobile, now_iso))
                uid = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                    VALUES (?, ?, ?, ?, 'Pune', ?, 'hi', ?)
                """, (uid, name, req.farmer_mobile, req.farmer_village or "Hadapsar", ident, now_iso))
                farmer_id = cursor.lastrowid

        if not farmer_id:
            raise HTTPException(status_code=400, detail="Farmer ID or valid mobile number is required")

        # Check slot exists and has capacity
        cursor.execute("SELECT * FROM slots WHERE id = ?", (req.slot_id,))
        slot = cursor.fetchone()
        if not slot:
            raise HTTPException(status_code=404, detail="Selected slot does not exist")

        if slot["booked_count"] >= slot["capacity"]:
            # Find next available slot for rule-based recommendation
            cursor.execute("""
                SELECT * FROM slots 
                WHERE centre_id = ? AND date = ? AND booked_count < capacity AND id != ?
                ORDER BY start_time ASC LIMIT 1
            """, (slot["centre_id"], slot["date"], slot["id"]))
            alt_slot = cursor.fetchone()
            msg = "Selected slot is completely full."
            if alt_slot:
                msg += f" Recommendation: Slot {alt_slot['start_time']}-{alt_slot['end_time']} is available."
            raise HTTPException(status_code=409, detail=msg)

        # Get centre info
        cursor.execute("SELECT * FROM centres WHERE id = ?", (req.centre_id,))
        centre = cursor.fetchone()
        if not centre:
            raise HTTPException(status_code=404, detail="Centre not found")

        # Generate scoped token
        token_num = generate_token(cursor, centre["code"], slot["date"])

        # Insert booking
        cursor.execute("""
            INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
            VALUES (?, ?, ?, ?, ?, 'BOOKED', ?)
        """, (farmer_id, req.centre_id, req.slot_id, token_num, req.booking_channel or "WEB", now_iso))
        booking_id = cursor.lastrowid

        # Update slot count
        new_count = slot["booked_count"] + 1
        new_status = "FULL" if new_count >= slot["capacity"] else "AVAILABLE"
        cursor.execute("UPDATE slots SET booked_count = ?, status = ? WHERE id = ?", (new_count, new_status, req.slot_id))

        # Create procurement record
        cursor.execute("""
            INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
            VALUES (?, ?, ?, 'PENDING', 'SLOT_BOOKED', 'Slot booked successfully', ?, ?)
        """, (booking_id, req.crop, req.quantity or 40.0, now_iso, now_iso))
        procurement_id = cursor.lastrowid

        # Create initial payment record
        cursor.execute("""
            INSERT INTO payments (procurement_id, amount, payment_status)
            VALUES (?, 0.0, 'PENDING')
        """, (procurement_id,))

        # Record status history
        cursor.execute("""
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
            VALUES (?, 'REGISTERED', 'SLOT_BOOKED', ?, ?, ?)
        """, (booking_id, req.booking_channel or "WEB", now_iso, f"Booked via {req.booking_channel} for {slot['date']} {slot['start_time']}-{slot['end_time']}"))

        # Notification
        sms_text = f"KisanSetu: Slot confirmed for {req.crop} at {centre['name']}. Date: {slot['date']}, Time: {slot['start_time']}-{slot['end_time']}. Token: {token_num}. Arrive 15m early."
        cursor.execute("""
            INSERT INTO notifications (farmer_id, booking_id, channel, message, status, sent_at)
            VALUES (?, ?, 'SMS', ?, 'SENT', ?)
        """, (farmer_id, booking_id, sms_text, now_iso))

        conn.commit()

        # Retrieve newly created record
        return {
            "success": True,
            "message": "Booking confirmed successfully",
            "booking": {
                "id": booking_id,
                "token_number": token_num,
                "booking_channel": req.booking_channel,
                "centre_name": centre["name"],
                "date": slot["date"],
                "start_time": slot["start_time"],
                "end_time": slot["end_time"],
                "crop": req.crop,
                "quantity": req.quantity,
                "status": "SLOT_BOOKED"
            }
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/farmer/{farmer_id}")
def get_farmer_bookings(farmer_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                b.id, b.token_number, b.booking_channel, b.booking_status, b.created_at,
                c.name as centre_name, c.address as centre_address, c.code as centre_code,
                s.date as slot_date, s.start_time, s.end_time,
                p.crop, p.quantity, p.quality_result, p.procurement_status, p.quality_notes,
                pay.amount as payment_amount, pay.payment_status, pay.transaction_reference, pay.payment_date
            FROM bookings b
            JOIN centres c ON b.centre_id = c.id
            JOIN slots s ON b.slot_id = s.id
            LEFT JOIN procurement_records p ON p.booking_id = b.id
            LEFT JOIN payments pay ON pay.procurement_id = p.id
            WHERE b.farmer_id = ?
            ORDER BY b.id DESC
        """, (farmer_id,))
        bookings = [dict(r) for r in cursor.fetchall()]
        return {"success": True, "bookings": bookings}
    finally:
        conn.close()

@router.get("/token/{token_number}")
def get_booking_by_token(token_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                b.id, b.token_number, b.booking_channel, b.booking_status, b.created_at,
                f.name as farmer_name, f.mobile as farmer_mobile, f.village as farmer_village, f.identity_reference,
                c.name as centre_name, c.address as centre_address,
                s.date as slot_date, s.start_time, s.end_time,
                p.crop, p.quantity, p.quality_result, p.procurement_status, p.quality_notes,
                pay.amount as payment_amount, pay.payment_status, pay.transaction_reference, pay.payment_date
            FROM bookings b
            JOIN farmers f ON b.farmer_id = f.id
            JOIN centres c ON b.centre_id = c.id
            JOIN slots s ON b.slot_id = s.id
            LEFT JOIN procurement_records p ON p.booking_id = b.id
            LEFT JOIN payments pay ON pay.procurement_id = p.id
            WHERE UPPER(b.token_number) = UPPER(?)
        """, (token_number.strip(),))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail=f"Booking with token '{token_number}' not found")

        b_dict = dict(booking)

        # Get status history
        cursor.execute("""
            SELECT old_status, new_status, changed_by, timestamp, remarks 
            FROM status_history 
            WHERE booking_id = ? 
            ORDER BY id ASC
        """, (b_dict["id"],))
        b_dict["timeline"] = [dict(r) for r in cursor.fetchall()]

        return {"success": True, "booking": b_dict}
    finally:
        conn.close()

@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    try:
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        b = cursor.fetchone()
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Mark booking cancelled
        cursor.execute("UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?", (booking_id,))

        # Free slot capacity
        cursor.execute("UPDATE slots SET booked_count = MAX(0, booked_count - 1), status = 'AVAILABLE' WHERE id = ?", (b["slot_id"],))

        # Update status history
        cursor.execute("""
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
            VALUES (?, 'BOOKED', 'CANCELLED', 'FARMER', ?, 'Slot cancelled by farmer. Capacity released.')
        """, (booking_id, now_iso))

        conn.commit()
        return {"success": True, "message": f"Booking {b['token_number']} cancelled and capacity freed."}
    finally:
        conn.close()
