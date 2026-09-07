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
        cursor.execute("SELECT * FROM users WHERE phone = ?", (req.phone,))
        user = cursor.fetchone()
        if not user:
            # If farmer logging in for demo, auto-register quick demo profile
            if req.role == "FARMER":
                now_iso = datetime.now().isoformat()
                cursor.execute("""
                    INSERT INTO users (phone, role, language, created_at)
                    VALUES (?, 'FARMER', 'hi', ?)
                """, (req.phone, now_iso))
                user_id = cursor.lastrowid
                ident_ref = f"KID-{req.phone[-4:]}-MH"
                cursor.execute("""
                    INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
                    VALUES (?, ?, ?, 'Hadapsar', 'Pune', ?, 'hi', ?)
                """, (user_id, f"Farmer {req.phone[-4:]}", req.phone, ident_ref, now_iso))
                farmer_id = cursor.lastrowid
                conn.commit()
                return {
                    "success": True,
                    "token": f"token-{req.phone}",
                    "user": {"id": user_id, "phone": req.phone, "role": "FARMER", "language": "hi"},
                    "farmer": {"id": farmer_id, "name": f"Farmer {req.phone[-4:]}", "mobile": req.phone, "village": "Hadapsar", "identity_reference": ident_ref}
                }
            elif req.role == "ADMIN" and req.phone == "9999999999":
                return {
                    "success": True,
                    "token": "admin-token-99999",
                    "user": {"id": 1, "phone": req.phone, "role": "ADMIN", "language": "en"}
                }
            else:
                raise HTTPException(status_code=404, detail="User not found")

        farmer_data = None
        if user["role"] == "FARMER":
            cursor.execute("SELECT * FROM farmers WHERE user_id = ? OR mobile = ?", (user["id"], user["phone"]))
            f_row = cursor.fetchone()
            if f_row:
                farmer_data = dict(f_row)

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
