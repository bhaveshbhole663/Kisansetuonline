from fastapi import APIRouter, HTTPException
from datetime import datetime, date, timedelta
from database import get_connection
from models import SMSWebhookRequest, IVRWebhookRequest
from routers.bookings import generate_token

router = APIRouter(prefix="/api/channels", tags=["channels"])

# In-memory session tracking for SMS state machines
# Key: from_phone -> {step, centre_id, date, slot_id, crop}
SMS_SESSIONS = {}

@router.post("/sms")
def handle_sms_webhook(req: SMSWebhookRequest):
    phone = req.from_phone.strip()
    msg = req.message.strip().upper()
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()
    day_after_str = (date.today() + timedelta(days=2)).isoformat()

    try:
        # Check command shortcuts first
        if msg == "HELP":
            return {
                "reply": "KisanSetu SMS Menu:\n- Reply 'BOOK' to reserve a slot\n- Reply 'STATUS <Token>' to track queue\n- Reply 'PAYMENT <Token>' for payment\n- Reply 'CANCEL <Token>' to cancel"
            }

        if msg.startswith("STATUS"):
            parts = msg.split()
            if len(parts) < 2:
                # Find latest booking for this phone
                cursor.execute("""
                    SELECT b.token_number, p.procurement_status, p.crop, p.quantity, p.quality_result, pay.payment_status, pay.amount, pay.transaction_reference
                    FROM bookings b
                    JOIN farmers f ON b.farmer_id = f.id
                    LEFT JOIN procurement_records p ON p.booking_id = b.id
                    LEFT JOIN payments pay ON pay.procurement_id = p.id
                    WHERE f.mobile = ?
                    ORDER BY b.id DESC LIMIT 1
                """, (phone,))
            else:
                target_token = parts[1].strip()
                cursor.execute("""
                    SELECT b.token_number, p.procurement_status, p.crop, p.quantity, p.quality_result, pay.payment_status, pay.amount, pay.transaction_reference
                    FROM bookings b
                    LEFT JOIN procurement_records p ON p.booking_id = b.id
                    LEFT JOIN payments pay ON pay.procurement_id = p.id
                    WHERE UPPER(b.token_number) = ?
                """, (target_token,))

            row = cursor.fetchone()
            if not row:
                return {"reply": "KisanSetu: No active booking found. Reply 'BOOK' to schedule a slot."}

            st = (row["procurement_status"] or "SLOT_BOOKED").replace("_", " ").title()
            reply = f"Token: {row['token_number']}\nStatus: {st}\nCrop: {row['crop']}\nQuantity: {row['quantity']} Q\nResult: {row['quality_result']}\nPayment: {row['payment_status']}"
            if row["payment_status"] == "PAID":
                reply += f"\nRef: {row['transaction_reference']} (Rs {int(row['amount'])})"
            return {"reply": reply}

        if msg.startswith("PAYMENT"):
            parts = msg.split()
            token_arg = parts[1].strip() if len(parts) > 1 else None
            if token_arg:
                cursor.execute("""
                    SELECT b.token_number, pay.amount, pay.payment_status, pay.transaction_reference, pay.payment_date
                    FROM bookings b
                    JOIN procurement_records p ON p.booking_id = b.id
                    JOIN payments pay ON pay.procurement_id = p.id
                    WHERE UPPER(b.token_number) = ?
                """, (token_arg,))
            else:
                cursor.execute("""
                    SELECT b.token_number, pay.amount, pay.payment_status, pay.transaction_reference, pay.payment_date
                    FROM bookings b
                    JOIN farmers f ON b.farmer_id = f.id
                    JOIN procurement_records p ON p.booking_id = b.id
                    JOIN payments pay ON pay.procurement_id = p.id
                    WHERE f.mobile = ?
                    ORDER BY b.id DESC LIMIT 1
                """, (phone,))
            pay_row = cursor.fetchone()
            if not pay_row:
                return {"reply": "KisanSetu: No payment record found for this token."}

            if pay_row["payment_status"] == "PAID":
                return {"reply": f"Token: {pay_row['token_number']}\nPayment: PAID\nAmount: Rs {int(pay_row['amount'])}\nPFMS Ref: {pay_row['transaction_reference']}\nDate: {pay_row['payment_date']}"}
            elif pay_row["payment_status"] == "PROCESSING":
                return {"reply": f"Token: {pay_row['token_number']}\nPayment: PROCESSING\nEstimated Amount: Rs {int(pay_row['amount'])}\nBank transfer initiated via DBT."}
            else:
                return {"reply": f"Token: {pay_row['token_number']}\nPayment: PENDING (weighing/quality acceptance pending)."}

        if msg.startswith("CANCEL"):
            parts = msg.split()
            if len(parts) < 2:
                return {"reply": "Please specify token to cancel, e.g. 'CANCEL PUN-0809-034'"}
            t_num = parts[1].strip()
            cursor.execute("SELECT id, slot_id FROM bookings WHERE UPPER(token_number) = ?", (t_num,))
            b_row = cursor.fetchone()
            if not b_row:
                return {"reply": f"No booking found for token {t_num}."}
            cursor.execute("UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?", (b_row["id"],))
            cursor.execute("UPDATE slots SET booked_count = MAX(0, booked_count - 1), status = 'AVAILABLE' WHERE id = ?", (b_row["slot_id"],))
            cursor.execute("""
                INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
                VALUES (?, 'BOOKED', 'CANCELLED', 'SMS', ?, 'Cancelled via SMS command')
            """, (b_row["id"], now_iso))
            conn.commit()
            return {"reply": f"KisanSetu: Booking {t_num} cancelled. Slot capacity released."}

        # SMS Booking State Machine
        session = SMS_SESSIONS.get(phone, {"step": "IDLE"})

        if msg == "BOOK" or session["step"] == "IDLE":
            cursor.execute("SELECT id, name, code FROM centres WHERE active = 1 ORDER BY id ASC")
            centres = cursor.fetchall()
            options = "\n".join([f"{idx+1}. {c['name']}" for idx, c in enumerate(centres)])
            SMS_SESSIONS[phone] = {
                "step": "WAITING_CENTRE",
                "centres": [dict(c) for c in centres]
            }
            return {
                "reply": f"KisanSetu — Select Centre:\n{options}\n\nReply with 1, 2, 3..."
            }

        if session.get("step") == "WAITING_CENTRE":
            try:
                choice = int(msg) - 1
                selected_centre = session["centres"][choice]
            except Exception:
                return {"reply": "Invalid choice. Reply with 1, 2 or 3 for centre."}

            session["centre_id"] = selected_centre["id"]
            session["centre_name"] = selected_centre["name"]
            session["centre_code"] = selected_centre["code"]
            session["step"] = "WAITING_DATE"
            session["dates"] = [today_str, tomorrow_str, day_after_str]
            SMS_SESSIONS[phone] = session

            date_options = f"1. {today_str} (Today)\n2. {tomorrow_str} (Tomorrow)\n3. {day_after_str}"
            return {
                "reply": f"Centre: {selected_centre['name']}\n\nSelect Date:\n{date_options}\n\nReply 1, 2 or 3."
            }

        if session.get("step") == "WAITING_DATE":
            try:
                choice = int(msg) - 1
                selected_date = session["dates"][choice]
            except Exception:
                return {"reply": "Invalid choice. Reply 1, 2 or 3 for date."}

            session["date"] = selected_date
            session["step"] = "WAITING_SLOT"

            # Fetch available slots
            cursor.execute("""
                SELECT id, start_time, end_time, capacity, booked_count 
                FROM slots 
                WHERE centre_id = ? AND date = ? AND booked_count < capacity
                ORDER BY start_time ASC
            """, (session["centre_id"], selected_date))
            avail_slots = [dict(s) for s in cursor.fetchall()]

            if not avail_slots:
                # Dynamically seed slots if date had no slots
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
                    """, (session["centre_id"], selected_date, start_t, end_t, cap))
                conn.commit()
                cursor.execute("""
                    SELECT id, start_time, end_time, capacity, booked_count 
                    FROM slots 
                    WHERE centre_id = ? AND date = ? AND booked_count < capacity
                    ORDER BY start_time ASC
                """, (session["centre_id"], selected_date))
                avail_slots = [dict(s) for s in cursor.fetchall()]

            session["slots"] = avail_slots
            SMS_SESSIONS[phone] = session

            slot_opts = "\n".join([f"{idx+1}. {s['start_time']}-{s['end_time']} ({s['capacity']-s['booked_count']} left)" for idx, s in enumerate(avail_slots[:5])])
            return {
                "reply": f"Available Slots on {selected_date}:\n{slot_opts}\n\nReply with number (e.g. 1 or 2)."
            }

        if session.get("step") == "WAITING_SLOT":
            try:
                choice = int(msg) - 1
                selected_slot = session["slots"][choice]
            except Exception:
                return {"reply": "Invalid slot choice. Reply with slot number."}

            # Complete Booking in DB
            # Get or create farmer
            cursor.execute("SELECT id FROM farmers WHERE mobile = ?", (phone,))
            f_row = cursor.fetchone()
            if f_row:
                farmer_id = f_row["id"]
            else:
                cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES (?, 'FARMER', 'hi', ?)", (phone, now_iso))
                uid = cursor.lastrowid
                ident = f"KID-{phone[-4:]}-MH"
                cursor.execute("""
                    INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                    VALUES (?, ?, ?, 'Rural Pune', 'Pune', ?, 'hi', ?)
                """, (uid, f"Farmer {phone[-4:]}", phone, ident, now_iso))
                farmer_id = cursor.lastrowid

            token_num = generate_token(cursor, session["centre_code"], session["date"])

            # Insert booking with booking_channel = 'SMS'
            cursor.execute("""
                INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
                VALUES (?, ?, ?, ?, 'SMS', 'BOOKED', ?)
            """, (farmer_id, session["centre_id"], selected_slot["id"], token_num, now_iso))
            booking_id = cursor.lastrowid

            # Slot count
            cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (selected_slot["id"],))

            # Procurement record
            cursor.execute("""
                INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
                VALUES (?, 'Wheat', 40.0, 'PENDING', 'SLOT_BOOKED', 'Booked via Keypad SMS', ?, ?)
            """, (booking_id, now_iso, now_iso))
            proc_id = cursor.lastrowid

            # Payment record
            cursor.execute("INSERT INTO payments (procurement_id, amount, payment_status) VALUES (?, 0.0, 'PENDING')", (proc_id,))

            # History
            cursor.execute("""
                INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
                VALUES (?, 'REGISTERED', 'SLOT_BOOKED', 'SMS_GATEWAY', ?, ?)
            """, (booking_id, now_iso, f"Booked via SMS for {session['date']} {selected_slot['start_time']}-{selected_slot['end_time']}"))

            conn.commit()
            SMS_SESSIONS.pop(phone, None)

            return {
                "reply": f"Booking Confirmed!\nCentre: {session['centre_name']}\nDate: {session['date']}\nTime: {selected_slot['start_time']}-{selected_slot['end_time']}\nToken: {token_num}\n\nReply STATUS for live queue updates."
            }

        # Fallback
        return {
            "reply": "KisanSetu: Command not recognized. Reply 'BOOK' to book a slot, 'STATUS' for updates, or 'HELP'."
        }
    except Exception as e:
        conn.rollback()
        return {"reply": f"KisanSetu Error: {str(e)}"}
    finally:
        conn.close()

@router.post("/ivr")
def handle_ivr_webhook(req: IVRWebhookRequest):
    step = req.step.upper()
    digits = (req.input_digits or "").strip()
    phone = req.caller_phone.strip()
    lang = req.language or "hi"
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()

    try:
        # Voice prompt audio scripts in Hindi, English, Marathi
        # Step 0: Initial Greeting -> Language Selection
        if step == "INIT":
            return {
                "next_step": "LANG_SELECTED",
                "voice_prompt_en": "Welcome to KisanSetu Farmer Procurement Helpline. For Hindi press 1. For English press 2. For Marathi press 3.",
                "voice_prompt_hi": "किसानसेतु में आपका स्वागत है। हिंदी के लिए 1 दबाएं। अंग्रेजी के लिए 2 दबाएं। मराठी के लिए 3 दबाएं।",
                "voice_prompt_mr": "किसानसेतू मध्ये आपले स्वागत आहे. हिंदीसाठी 1 दाबा. इंग्रजीसाठी 2 दाबा. मराठीसाठी 3 दाबा.",
                "display_text": "1: हिन्दी | 2: English | 3: मराठी"
            }

        if step == "LANG_SELECTED":
            lang_map = {"1": "hi", "2": "en", "3": "mr"}
            selected_lang = lang_map.get(digits, "hi")
            prompts = {
                "hi": "मुख्य मेनू: स्लॉट बुक करने के लिए 1 दबाएं। अपनी बुकिंग स्थिति जांचने के लिए 2 दबाएं। भुगतान स्थिति के लिए 3 दबाएं। सहायता के लिए 4 दबाएं।",
                "en": "Main Menu: Press 1 to Book a Slot. Press 2 to Check Booking Status. Press 3 to Check Payment Status. Press 4 for Help.",
                "mr": "मुख्य मेनू: स्लॉट बुक करण्यासाठी 1 दाबा. बुकिंग स्थिती तपासण्यासाठी 2 दाबा. पेमेंट स्थितीसाठी 3 दाबा. मदतीसाठी 4 दाबा."
            }
            return {
                "language": selected_lang,
                "next_step": "MENU_SELECTED",
                "voice_prompt": prompts[selected_lang],
                "display_text": "1: Book Slot | 2: Status | 3: Payment | 4: Help"
            }

        if step == "MENU_SELECTED":
            if digits == "1":
                # Book slot -> List centres
                cursor.execute("SELECT id, name FROM centres WHERE active = 1 ORDER BY id ASC")
                centres = [dict(c) for c in cursor.fetchall()]
                centre_prompt = "Select Procurement Centre. " + ". ".join([f"Press {idx+1} for {c['name']}" for idx, c in enumerate(centres)])
                return {
                    "language": lang,
                    "next_step": "CENTRE_SELECTED",
                    "centres": centres,
                    "voice_prompt": centre_prompt,
                    "display_text": " | ".join([f"{idx+1}: {c['name'].split()[0]}" for idx, c in enumerate(centres)])
                }
            elif digits == "2":
                # Check status
                cursor.execute("""
                    SELECT b.token_number, p.procurement_status, p.crop 
                    FROM bookings b
                    JOIN farmers f ON b.farmer_id = f.id
                    LEFT JOIN procurement_records p ON p.booking_id = b.id
                    WHERE f.mobile = ? ORDER BY b.id DESC LIMIT 1
                """, (phone,))
                row = cursor.fetchone()
                if row:
                    msg = f"Your active token is {row['token_number']} for {row['crop']}. Current status is {row['procurement_status'].replace('_', ' ')}."
                else:
                    msg = "No active booking found for your mobile number. Press 1 to book a new slot."
                return {"language": lang, "next_step": "FINISHED", "voice_prompt": msg, "display_text": msg}
            elif digits == "3":
                # Payment status
                cursor.execute("""
                    SELECT b.token_number, pay.amount, pay.payment_status 
                    FROM bookings b
                    JOIN farmers f ON b.farmer_id = f.id
                    JOIN procurement_records p ON p.booking_id = b.id
                    JOIN payments pay ON pay.procurement_id = p.id
                    WHERE f.mobile = ? ORDER BY b.id DESC LIMIT 1
                """, (phone,))
                row = cursor.fetchone()
                if row:
                    msg = f"Token {row['token_number']} payment status is {row['payment_status']}. Amount is Rupees {int(row['amount'])}."
                else:
                    msg = "No payment records found for your phone number."
                return {"language": lang, "next_step": "FINISHED", "voice_prompt": msg, "display_text": msg}

        if step == "CENTRE_SELECTED":
            # Map digit to centre
            cursor.execute("SELECT id, name, code FROM centres WHERE active = 1 ORDER BY id ASC")
            centres = [dict(c) for c in cursor.fetchall()]
            try:
                c_idx = int(digits) - 1
                centre = centres[c_idx]
            except Exception:
                centre = centres[0]

            # Ask for Slot time
            cursor.execute("""
                SELECT id, start_time, end_time, capacity, booked_count 
                FROM slots WHERE centre_id = ? AND date = ? AND booked_count < capacity
                ORDER BY start_time ASC LIMIT 3
            """, (centre["id"], today_str))
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
                    """, (centre["id"], today_str, start_t, end_t, cap))
                conn.commit()
                cursor.execute("""
                    SELECT id, start_time, end_time, capacity, booked_count 
                    FROM slots WHERE centre_id = ? AND date = ? AND booked_count < capacity
                    ORDER BY start_time ASC LIMIT 3
                """, (centre["id"], today_str))
                slots = [dict(s) for s in cursor.fetchall()]

            slot_prompt = f"Selected {centre['name']}. Select Slot. " + ". ".join([f"Press {idx+1} for {s['start_time']} to {s['end_time']}" for idx, s in enumerate(slots)])

            return {
                "language": lang,
                "centre_id": centre["id"],
                "centre_code": centre["code"],
                "centre_name": centre["name"],
                "slots": slots,
                "next_step": "SLOT_SELECTED",
                "voice_prompt": slot_prompt,
                "display_text": " | ".join([f"{idx+1}: {s['start_time']}-{s['end_time']}" for idx, s in enumerate(slots)])
            }

        if step == "SLOT_SELECTED":
            centre_id = req.centre_id or 1
            cursor.execute("SELECT code, name FROM centres WHERE id = ?", (centre_id,))
            c_row = cursor.fetchone()
            centre_code = c_row["code"] if c_row else "PUN"
            centre_name = c_row["name"] if c_row else "Pune APMC"

            # Get slot
            cursor.execute("""
                SELECT id, start_time, end_time FROM slots 
                WHERE centre_id = ? AND date = ? ORDER BY start_time ASC
            """, (centre_id, today_str))
            slots = [dict(s) for s in cursor.fetchall()]
            try:
                s_idx = int(digits) - 1
                slot = slots[s_idx]
            except Exception:
                slot = slots[0]

            # Register or fetch farmer
            cursor.execute("SELECT id FROM farmers WHERE mobile = ?", (phone,))
            f_row = cursor.fetchone()
            if f_row:
                farmer_id = f_row["id"]
            else:
                cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES (?, 'FARMER', ?, ?)", (phone, lang, now_iso))
                uid = cursor.lastrowid
                ident = f"KID-{phone[-4:]}-MH"
                cursor.execute("""
                    INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                    VALUES (?, ?, ?, 'Keypad Village', 'Pune', ?, ?, ?)
                """, (uid, f"Farmer {phone[-4:]}", phone, ident, lang, now_iso))
                farmer_id = cursor.lastrowid

            token_num = generate_token(cursor, centre_code, today_str)

            # Insert booking with booking_channel = 'IVR'
            cursor.execute("""
                INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
                VALUES (?, ?, ?, ?, 'IVR', 'BOOKED', ?)
            """, (farmer_id, centre_id, slot["id"], token_num, now_iso))
            booking_id = cursor.lastrowid

            cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (slot["id"],))

            cursor.execute("""
                INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
                VALUES (?, 'Wheat', 35.0, 'PENDING', 'SLOT_BOOKED', 'Booked via IVR Voice Helpline', ?, ?)
            """, (booking_id, now_iso, now_iso))
            proc_id = cursor.lastrowid

            cursor.execute("INSERT INTO payments (procurement_id, amount, payment_status) VALUES (?, 0.0, 'PENDING')", (proc_id,))

            cursor.execute("""
                INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
                VALUES (?, 'REGISTERED', 'SLOT_BOOKED', 'IVR_TELECOM', ?, ?)
            """, (booking_id, now_iso, f"Booked via IVR Helpline for {today_str} {slot['start_time']}-{slot['end_time']}"))

            sms_alert = f"KisanSetu IVR: Booking confirmed for {centre_name}. Time: {slot['start_time']}-{slot['end_time']}. Token: {token_num}."
            cursor.execute("""
                INSERT INTO notifications (farmer_id, booking_id, channel, message, status, sent_at)
                VALUES (?, ?, 'SMS', ?, 'SENT', ?)
            """, (farmer_id, booking_id, sms_alert, now_iso))

            conn.commit()

            voice_msg = f"Your booking is confirmed at {centre_name}. Your token number is {token_num}. Time: {slot['start_time']} to {slot['end_time']}. A confirmation SMS has been dispatched to your phone. Thank you for calling KisanSetu."

            return {
                "language": lang,
                "next_step": "FINISHED",
                "token_number": token_num,
                "voice_prompt": voice_msg,
                "display_text": f"Confirmed! Token: {token_num} | Slot: {slot['start_time']}-{slot['end_time']}"
            }

        return {"language": lang, "next_step": "INIT", "voice_prompt": "Thank you for using KisanSetu.", "display_text": "Call Ended"}
    finally:
        conn.close()
