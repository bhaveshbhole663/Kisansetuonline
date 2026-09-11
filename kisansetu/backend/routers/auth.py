from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database import get_connection
from models import FarmerRegisterRequest, LoginRequest
import sqlite3

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register_farmer(req: FarmerRegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    try:
        # Check if phone already registered
        cursor.execute("SELECT id FROM users WHERE phone = ?", (req.mobile,))
        existing_user = cursor.fetchone()
        if existing_user:
            user_id = existing_user["id"]
        else:
            cursor.execute("""
                INSERT INTO users (phone, role, language, created_at)
                VALUES (?, 'FARMER', ?, ?)
            """, (req.mobile, req.preferred_language, now_iso))
            user_id = cursor.lastrowid

        # Check farmer record
        cursor.execute("SELECT id FROM farmers WHERE mobile = ?", (req.mobile,))
        existing_farmer = cursor.fetchone()
        if existing_farmer:
            farmer_id = existing_farmer["id"]
        else:
            ident_ref = f"KID-{req.mobile[-4:]}-MH"
            cursor.execute("""
                INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, req.name, req.mobile, req.village, req.district, ident_ref, req.preferred_language, now_iso))
            farmer_id = cursor.lastrowid

        conn.commit()
        return {
            "success": True,
            "message": "Farmer registered successfully",
            "farmer": {
                "id": farmer_id,
                "user_id": user_id,
                "name": req.name,
                "mobile": req.mobile,
                "village": req.village,
                "district": req.district,
                "preferred_language": req.preferred_language,
                "identity_reference": f"KID-{req.mobile[-4:]}-MH"
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Admin authentication flow
        if req.role == "ADMIN":
            admin_identifiers = ["9999999999", "admin", "admin@apmc.gov.in", "9876500000"]
            valid_pins = ["admin123", "1234", "admin", "9999", ""]
            
            clean_phone = req.phone.strip()
            if clean_phone in admin_identifiers or clean_phone.lower() == "admin":
                if req.pin and req.pin.strip() not in valid_pins:
                    raise HTTPException(status_code=401, detail="Invalid APMC Admin Passcode / PIN")
                
                return {
                    "success": True,
                    "token": "admin-token-99999",
                    "user": {
                        "id": 1,
                        "phone": clean_phone,
                        "name": "Shri R. K. Deshmukh",
                        "role": "ADMIN",
                        "designation": "Chief Mandi Procurement Officer",
                        "centre_id": 1,
                        "centre_name": "Pune Central Grain Mandi (Hadapsar)",
                        "language": "en"
                    }
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid APMC Staff ID or Unauthorized Role")

        # Farmer authentication flow
        cursor.execute("SELECT * FROM users WHERE phone = ?", (req.phone,))
        user = cursor.fetchone()
        if not user:
            # Auto-register farmer if first time entering mobile
            now_iso = datetime.now().isoformat()
            cursor.execute("""
                INSERT INTO users (phone, role, language, created_at)
                VALUES (?, 'FARMER', 'hi', ?)
            """, (req.phone, now_iso))
            user_id = cursor.lastrowid
            ident_ref = f"KID-{req.phone[-4:]}-MH"
            
            # Check demo names
            demo_names = {
                "9876543210": ("Ramesh Jadhav", "Hadapsar", "Pune"),
                "9823456789": ("Suresh Patil", "Baramati Rural", "Pune"),
                "9812345678": ("Mahesh Shinde", "Daund Gaon", "Pune")
            }
            default_info = demo_names.get(req.phone, (f"Farmer {req.phone[-4:]}", "Hadapsar", "Pune"))
            
            cursor.execute("""
                INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'hi', ?)
            """, (user_id, default_info[0], req.phone, default_info[1], default_info[2], ident_ref, now_iso))
            farmer_id = cursor.lastrowid
            conn.commit()
            
            return {
                "success": True,
                "token": f"token-{req.phone}",
                "user": {"id": user_id, "phone": req.phone, "role": "FARMER", "language": "hi"},
                "farmer": {
                    "id": farmer_id,
                    "user_id": user_id,
                    "name": default_info[0],
                    "mobile": req.phone,
                    "village": default_info[1],
                    "district": default_info[2],
                    "identity_reference": ident_ref,
                    "preferred_language": "hi"
                }
            }

        farmer_data = None
        if user["role"] == "FARMER":
            cursor.execute("SELECT * FROM farmers WHERE user_id = ? OR mobile = ?", (user["id"], user["phone"]))
            f_row = cursor.fetchone()
            if f_row:
                farmer_data = dict(f_row)
            else:
                ident_ref = f"KID-{user['phone'][-4:]}-MH"
                cursor.execute("""
                    INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                    VALUES (?, ?, ?, 'Hadapsar', 'Pune', ?, 'hi', ?)
                """, (user["id"], f"Farmer {user['phone'][-4:]}", user["phone"], ident_ref, datetime.now().isoformat()))
                farmer_id = cursor.lastrowid
                conn.commit()
                farmer_data = {
                    "id": farmer_id,
                    "user_id": user["id"],
                    "name": f"Farmer {user['phone'][-4:]}",
                    "mobile": user["phone"],
                    "village": "Hadapsar",
                    "district": "Pune",
                    "identity_reference": ident_ref,
                    "preferred_language": "hi"
                }

        return {
            "success": True,
            "token": f"token-{user['phone']}",
            "user": dict(user),
            "farmer": farmer_data
        }
    finally:
        conn.close()

@router.get("/farmers")
def list_farmers():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM farmers ORDER BY id DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        return {"success": True, "farmers": rows}
    finally:
        conn.close()
