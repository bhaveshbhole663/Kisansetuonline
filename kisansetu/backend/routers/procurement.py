from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date
from database import get_connection
from models import ProcurementStatusUpdateRequest, PaymentStatusUpdateRequest

router = APIRouter(prefix="/api/admin", tags=["admin_procurement"])

MSP_RATES = {
    "Wheat": 2300.0,
    "Soybean": 4892.0,
    "Gram (Chana)": 5440.0,
    "Mustard": 5650.0,
    "Paddy": 2320.0,
    "Cotton": 7121.0
}

@router.get("/queue")
def get_live_queue(centre_id: int = Query(default=None), target_date: str = Query(default=None)):
    if not target_date:
        target_date = date.today().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT 
                b.id as booking_id, b.token_number, b.booking_channel, b.booking_status, b.created_at as booked_at,
                f.id as farmer_id, f.name as farmer_name, f.mobile as farmer_mobile, f.village, f.district, f.identity_reference,
                c.id as centre_id, c.name as centre_name, c.code as centre_code,
                s.id as slot_id, s.date as slot_date, s.start_time, s.end_time,
                p.id as procurement_id, p.crop, p.quantity, p.quality_result, p.procurement_status, p.quality_notes, p.updated_at,
                pay.id as payment_id, pay.amount as payment_amount, pay.payment_status, pay.transaction_reference, pay.payment_date
            FROM bookings b
            JOIN farmers f ON b.farmer_id = f.id
            JOIN centres c ON b.centre_id = c.id
            JOIN slots s ON b.slot_id = s.id
            LEFT JOIN procurement_records p ON p.booking_id = b.id
            LEFT JOIN payments pay ON pay.procurement_id = p.id
            WHERE s.date = ? AND b.booking_status != 'CANCELLED'
        """
        params = [target_date]
        if centre_id:
            query += " AND b.centre_id = ?"
            params.append(centre_id)

        query += " ORDER BY s.start_time ASC, b.id ASC"

        cursor.execute(query, params)
        items = [dict(r) for r in cursor.fetchall()]

        # Compute summary metrics for today
        counts = {
            "total_bookings": len(items),
            "arrived": len([x for x in items if x["procurement_status"] in ('ARRIVED', 'QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID')]),
            "quality_checked": len([x for x in items if x["procurement_status"] in ('QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID')]),
            "weighed": len([x for x in items if x["procurement_status"] in ('WEIGHED', 'ACCEPTED', 'PAYMENT_PROCESSING', 'PAID')]),
            "accepted": len([x for x in items if x["procurement_status"] in ('ACCEPTED', 'PAYMENT_PROCESSING', 'PAID')]),
            "paid": len([x for x in items if x["procurement_status"] == 'PAID' or x["payment_status"] == 'PAID']),
            "waiting": len([x for x in items if x["procurement_status"] in ('SLOT_BOOKED', 'ARRIVED', 'QUALITY_CHECK', 'WEIGHED')]),
        }

        return {"success": True, "date": target_date, "metrics": counts, "queue": items}
    finally:
        conn.close()

@router.post("/procurement/status")
def update_procurement_status(req: ProcurementStatusUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()
    try:
        # Get current record
        cursor.execute("""
            SELECT p.*, b.farmer_id, b.token_number, c.name as centre_name, f.mobile, f.preferred_language
            FROM procurement_records p
            JOIN bookings b ON p.booking_id = b.id
            JOIN centres c ON b.centre_id = c.id
            JOIN farmers f ON b.farmer_id = f.id
            WHERE p.booking_id = ?
        """, (req.booking_id,))
        rec = cursor.fetchone()
        if not rec:
            raise HTTPException(status_code=404, detail="Procurement record not found")

        old_status = rec["procurement_status"]
        new_status = req.new_status.upper()
        quantity = req.quantity if req.quantity is not None else rec["quantity"]
        quality_res = req.quality_result if req.quality_result is not None else rec["quality_result"]
        quality_notes = req.quality_notes or rec["quality_notes"] or ""

        # Update procurement record
        cursor.execute("""
            UPDATE procurement_records
            SET procurement_status = ?, quality_result = ?, quality_notes = ?, quantity = ?, updated_at = ?
            WHERE booking_id = ?
        """, (new_status, quality_res, quality_notes, quantity, now_iso, req.booking_id))

        # Check payment calculations
        crop = rec["crop"]
        rate = MSP_RATES.get(crop, 2300.0)
        computed_amount = req.payment_amount or (quantity * rate)

        cursor.execute("SELECT * FROM payments WHERE procurement_id = ?", (rec["id"],))
        pay_row = cursor.fetchone()

        if new_status in ("ACCEPTED", "PAYMENT_PROCESSING", "PAID"):
            p_status = "PAID" if new_status == "PAID" else "PROCESSING"
            p_ref = pay_row["transaction_reference"] if (pay_row and pay_row["transaction_reference"]) else f"PFMS-DEMO-{req.booking_id + 82930}"
            p_date = today_str if new_status == "PAID" else None

            if pay_row:
                cursor.execute("""
                    UPDATE payments 
                    SET amount = ?, payment_status = ?, transaction_reference = ?, payment_date = COALESCE(payment_date, ?)
                    WHERE id = ?
                """, (computed_amount, p_status, p_ref, p_date, pay_row["id"]))
            else:
                cursor.execute("""
                    INSERT INTO payments (procurement_id, amount, payment_status, transaction_reference, payment_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (rec["id"], computed_amount, p_status, p_ref, p_date))

        # Add to status history
        remarks = req.remarks or f"Status transitioned to {new_status}"
        cursor.execute("""
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (req.booking_id, old_status, new_status, req.changed_by or "CENTRE_STAFF", now_iso, remarks))

        # Send notification to farmer
        status_readable = new_status.replace("_", " ").title()
        sms_msg = f"KisanSetu Update for {rec['token_number']}: Your status is now {status_readable}. "
        if new_status == "WEIGHED":
            sms_msg += f"Net Quantity: {quantity} Quintals. Est. Amount: Rs {int(computed_amount)}."
        elif new_status == "PAID":
            sms_msg += f"Simulated DBT payment of Rs {int(computed_amount)} transferred. Ref: PFMS-DEMO-{req.booking_id + 82930}."

        cursor.execute("""
            INSERT INTO notifications (farmer_id, booking_id, channel, message, status, sent_at)
            VALUES (?, ?, 'SMS', ?, 'SENT', ?)
        """, (rec["farmer_id"], req.booking_id, sms_msg, now_iso))

        conn.commit()

        return {
            "success": True,
            "message": f"Procurement status updated to {new_status}",
            "booking_id": req.booking_id,
            "token_number": rec["token_number"],
            "procurement_status": new_status,
            "quantity": quantity,
            "quality_result": quality_res,
            "amount": computed_amount
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/payment/status")
def update_payment_status(req: PaymentStatusUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    today_str = date.today().isoformat()
    now_iso = datetime.now().isoformat()
    try:
        ref = req.transaction_reference or f"PFMS-DEMO-{req.procurement_id + 82930}"
        cursor.execute("""
            UPDATE payments
            SET payment_status = ?, transaction_reference = ?, payment_date = ?
            WHERE id = ?
        """, (req.payment_status.upper(), ref, today_str if req.payment_status.upper() == "PAID" else None, req.procurement_id))

        # Update procurement status if paid
        if req.payment_status.upper() == "PAID":
            cursor.execute("""
                UPDATE procurement_records
                SET procurement_status = 'PAID', updated_at = ?
                WHERE id = ?
            """, (now_iso, req.procurement_id))

            cursor.execute("""
                SELECT p.booking_id, b.farmer_id, b.token_number, p.crop, pay.amount
                FROM procurement_records p
                JOIN bookings b ON p.booking_id = b.id
                JOIN payments pay ON pay.procurement_id = p.id
                WHERE p.id = ?
            """, (req.procurement_id,))
            b_info = cursor.fetchone()
            if b_info:
                cursor.execute("""
                    INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
                    VALUES (?, 'PAYMENT_PROCESSING', 'PAID', 'PFMS_GATEWAY', ?, ?)
                """, (b_info["booking_id"], now_iso, f"Direct Benefit Transfer simulated via PFMS ref {ref}"))

                sms_msg = f"KisanSetu DBT Alert: Rs {int(b_info['amount'])} credited for token {b_info['token_number']}. PFMS Ref: {ref}."
                cursor.execute("""
                    INSERT INTO notifications (farmer_id, booking_id, channel, message, status, sent_at)
                    VALUES (?, ?, 'SMS', ?, 'SENT', ?)
                """, (b_info["farmer_id"], b_info["booking_id"], sms_msg, now_iso))

        conn.commit()
        return {"success": True, "message": f"Payment updated to {req.payment_status.upper()}", "transaction_reference": ref}
    finally:
        conn.close()
