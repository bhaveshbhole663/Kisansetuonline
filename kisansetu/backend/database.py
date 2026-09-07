import sqlite3
import os
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "kisansetu.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('FARMER', 'CENTRE_STAFF', 'ADMIN', 'SUPER_ADMIN')),
        language TEXT DEFAULT 'hi',
        created_at TEXT NOT NULL
    )
    """)

    # 2. Farmers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        village TEXT,
        district TEXT,
        identity_reference TEXT,
        preferred_language TEXT DEFAULT 'hi',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """)

    # 3. Centres
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS centres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        district TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        daily_capacity INTEGER DEFAULT 100,
        active INTEGER DEFAULT 1
    )
    """)

    # 4. Slots
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        centre_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        capacity INTEGER DEFAULT 20,
        booked_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'FULL', 'CLOSED')),
        FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE
    )
    """)

    # 5. Bookings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        centre_id INTEGER NOT NULL,
        slot_id INTEGER NOT NULL,
        token_number TEXT UNIQUE NOT NULL,
        booking_channel TEXT NOT NULL CHECK(booking_channel IN ('WEB', 'SMS', 'IVR', 'WALK_IN')),
        booking_status TEXT DEFAULT 'BOOKED' CHECK(booking_status IN ('BOOKED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
    )
    """)

    # 6. Procurement Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS procurement_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER UNIQUE NOT NULL,
        crop TEXT NOT NULL,
        quantity REAL DEFAULT 0.0,
        quality_result TEXT DEFAULT 'PENDING' CHECK(quality_result IN ('PENDING', 'GRADE_A', 'GRADE_B', 'ACCEPTED', 'REJECTED')),
        procurement_status TEXT DEFAULT 'SLOT_BOOKED' CHECK(
            procurement_status IN (
                'REGISTERED', 'SLOT_BOOKED', 'ARRIVED', 
                'QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 
                'REJECTED', 'PAYMENT_PROCESSING', 'PAID'
            )
        ),
        quality_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
    """)

    # 7. Payments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        procurement_id INTEGER NOT NULL,
        amount REAL DEFAULT 0.0,
        payment_status TEXT DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED')),
        transaction_reference TEXT,
        payment_date TEXT,
        FOREIGN KEY (procurement_id) REFERENCES procurement_records(id) ON DELETE CASCADE
    )
    """)

    # 8. Notifications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        booking_id INTEGER,
        channel TEXT NOT NULL CHECK(channel IN ('SMS', 'WEB', 'IVR')),
        message TEXT NOT NULL,
        status TEXT DEFAULT 'SENT',
        sent_at TEXT NOT NULL,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    )
    """)

    # 9. Status History (for transparent timeline)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by TEXT DEFAULT 'SYSTEM',
        timestamp TEXT NOT NULL,
        remarks TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
    """)

    conn.commit()

    # Check if centres exist, if not seed database
    cursor.execute("SELECT COUNT(*) as count FROM centres")
    if cursor.fetchone()["count"] == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()
    day_after_str = (date.today() + timedelta(days=2)).isoformat()

    # Seed APMC Centres
    centres = [
        ("Pune Central Grain Mandi (Hadapsar)", "PUN", "Hadapsar APMC Market Yard, Pune, MH", "Pune", 18.5089, 73.9260, 100, 1),
        ("Baramati Krishi Kendra", "BAR", "MIDC Area, Baramati, Dist. Pune, MH", "Pune", 18.1524, 74.5768, 80, 1),
        ("Daund Market Yard", "DAU", "Station Road, Daund, Dist. Pune, MH", "Pune", 18.4651, 74.5828, 60, 1),
        ("Nashik APMC Sub-Yard", "NSK", "Peth Road, Panchavati, Nashik, MH", "Nashik", 20.0125, 73.7915, 120, 1),
    ]
    cursor.executemany("""
        INSERT INTO centres (name, code, address, district, latitude, longitude, daily_capacity, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, centres)

    # Fetch centre IDs
    cursor.execute("SELECT id, code FROM centres")
    centre_map = {row["code"]: row["id"] for row in cursor.fetchall()}

    # Create slots for today, tomorrow, day after
    time_windows = [
        ("08:00", "09:00", 20),
        ("09:00", "10:00", 20),
        ("10:00", "11:00", 20),
        ("11:00", "12:00", 20),
        ("13:00", "14:00", 20),
        ("14:00", "15:00", 20),
    ]

    dates = [today_str, tomorrow_str, day_after_str]
    for cid in centre_map.values():
        for d in dates:
            for start_t, end_t, cap in time_windows:
                cursor.execute("""
                    INSERT INTO slots (centre_id, date, start_time, end_time, capacity, booked_count, status)
                    VALUES (?, ?, ?, ?, ?, 0, 'AVAILABLE')
                """, (cid, d, start_t, end_t, cap))

    # Seed initial demo farmers
    farmers_data = [
        ("Ramesh Jadhav", "9876543210", "Hadapsar", "Pune", "KID-4091-MH", "mr"),
        ("Suresh Patil", "9823456789", "Baramati Rural", "Pune", "KID-5102-MH", "hi"),
        ("Mahesh Shinde", "9812345678", "Daund Gaon", "Pune", "KID-6203-MH", "mr"),
        ("Ganesh Deshmukh", "9898989898", "Manchar", "Pune", "KID-7304-MH", "en"),
        ("Vikram Pawar", "9765432100", "Narayangaon", "Pune", "KID-8405-MH", "mr"),
    ]

    for name, mob, vil, dist, ident, lang in farmers_data:
        cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES (?, 'FARMER', ?, ?)", (mob, lang, now_iso))
        uid = cursor.lastrowid
        cursor.execute("""
            INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (uid, name, mob, vil, dist, ident, lang, now_iso))

    # Seed Admin User
    cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES ('9999999999', 'ADMIN', 'en', ?)", (now_iso,))

    # Seed bookings and procurement pipeline representing live APMC operation
    pune_id = centre_map["PUN"]
    cursor.execute("SELECT id FROM slots WHERE centre_id = ? AND date = ? ORDER BY start_time ASC", (pune_id, today_str))
    pune_slots = [r["id"] for r in cursor.fetchall()]

    ddmm = datetime.strptime(today_str, "%Y-%m-%d").strftime("%d%m")

    # Booking 1: Ramesh - Token PUN-ddmm-031 (Web) -> at 'WEIGHED' stage
    cursor.execute("""
        INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
        VALUES (1, ?, ?, ?, 'WEB', 'BOOKED', ?)
    """, (pune_id, pune_slots[0], f"PUN-{ddmm}-031", now_iso))
    b1_id = cursor.lastrowid
    cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (pune_slots[0],))
    cursor.execute("""
        INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
        VALUES (?, 'Wheat', 42.0, 'GRADE_A', 'WEIGHED', 'Moisture 11.2%, Foreign matter < 1%', ?, ?)
    """, (b1_id, now_iso, now_iso))
    pr1_id = cursor.lastrowid
    cursor.execute("""
        INSERT INTO payments (procurement_id, amount, payment_status, transaction_reference, payment_date)
        VALUES (?, 96600.0, 'PROCESSING', 'PFMS-DEMO-82932', ?)
    """, (pr1_id, today_str))

    # Booking 2: Suresh - Token PUN-ddmm-032 (SMS) -> at 'QUALITY_CHECK' stage
    cursor.execute("""
        INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
        VALUES (2, ?, ?, ?, 'SMS', 'BOOKED', ?)
    """, (pune_id, pune_slots[0], f"PUN-{ddmm}-032", now_iso))
    b2_id = cursor.lastrowid
    cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (pune_slots[0],))
    cursor.execute("""
        INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
        VALUES (?, 'Soybean', 35.5, 'GRADE_B', 'QUALITY_CHECK', 'Testing grain cleanliness and moisture', ?, ?)
    """, (b2_id, now_iso, now_iso))
    pr2_id = cursor.lastrowid
    cursor.execute("""
        INSERT INTO payments (procurement_id, amount, payment_status)
        VALUES (?, 163300.0, 'PENDING')
    """, (pr2_id,))

    # Booking 3: Mahesh - Token PUN-ddmm-033 (IVR) -> at 'ARRIVED' stage
    cursor.execute("""
        INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
        VALUES (3, ?, ?, ?, 'IVR', 'BOOKED', ?)
    """, (pune_id, pune_slots[1], f"PUN-{ddmm}-033", now_iso))
    b3_id = cursor.lastrowid
    cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (pune_slots[1],))
    cursor.execute("""
        INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
        VALUES (?, 'Gram (Chana)', 28.0, 'PENDING', 'ARRIVED', 'Gate entry verified', ?, ?)
    """, (b3_id, now_iso, now_iso))

    # Booking 4: Ganesh - Token PUN-ddmm-034 (Web) -> at 'SLOT_BOOKED' stage
    cursor.execute("""
        INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, booking_channel, booking_status, created_at)
        VALUES (4, ?, ?, ?, 'WEB', 'BOOKED', ?)
    """, (pune_id, pune_slots[1], f"PUN-{ddmm}-034", now_iso))
    b4_id = cursor.lastrowid
    cursor.execute("UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?", (pune_slots[1],))
    cursor.execute("""
        INSERT INTO procurement_records (booking_id, crop, quantity, quality_result, procurement_status, quality_notes, created_at, updated_at)
        VALUES (?, 'Wheat', 50.0, 'PENDING', 'SLOT_BOOKED', 'Awaiting arrival at Pune APMC', ?, ?)
    """, (b4_id, now_iso, now_iso))

    # Seed status timeline for Ramesh (PUN-ddmm-031)
    timeline = [
        ("SLOT_BOOKED", "Farmer registered slot via Web Portal", "2026-09-07T18:00:00"),
        ("ARRIVED", "Arrived at Hadapsar APMC Gate #2", "2026-09-08T08:50:00"),
        ("QUALITY_CHECK", "Grain moisture 11.2%, clean sample certified Grade A", "2026-09-08T09:12:00"),
        ("WEIGHED", "Weighbridge Net: 42.0 Quintals (MSP @ 2,300/Q = ₹96,600)", "2026-09-08T09:35:00"),
    ]
    for st, rm, ts in timeline:
        cursor.execute("""
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, remarks)
            VALUES (?, NULL, ?, 'OFFICER_PATIL', ?, ?)
        """, (b1_id, st, ts, rm))

    # Notifications seed
    cursor.execute("""
        INSERT INTO notifications (farmer_id, booking_id, channel, message, status, sent_at)
        VALUES (1, ?, 'SMS', ?, 'SENT', ?)
    """, (b1_id, f"KisanSetu: Your token PUN-{ddmm}-031 is WEIGHED (42.0 Q). Payment of Rs 96,600 in process.", now_iso))

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
