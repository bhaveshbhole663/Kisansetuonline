import sqlite3
import os
import re
from datetime import datetime, date, timedelta

# Check for online PostgreSQL Database URL (Supabase or Railway)
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DB_PATH = os.path.join(os.path.dirname(__file__), "kisansetu.db")

class PostgresCursorWrapper:
    """Wraps psycopg cursor so standard SQLite '?' queries and dict access work seamlessly."""
    def __init__(self, raw_cursor):
        self.cursor = raw_cursor

    def execute(self, query, params=None):
        # Translate '?' placeholders to '%s' for PostgreSQL
        pg_query = query.replace("?", "%s")
        # Handle SQLite AUTOINCREMENT -> PostgreSQL SERIAL syntax differences if any in dynamic DDL
        pg_query = pg_query.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
        
        # In PostgreSQL, to get last inserted ID, append RETURNING id if INSERT
        is_insert = pg_query.strip().upper().startswith("INSERT INTO")
        if is_insert and "RETURNING id" not in pg_query.upper():
            pg_query = pg_query.rstrip("; ") + " RETURNING id"

        if params is not None:
            if isinstance(params, (list, tuple)):
                self.cursor.execute(pg_query, params)
            else:
                self.cursor.execute(pg_query, (params,))
        else:
            self.cursor.execute(pg_query)

        if is_insert:
            try:
                row = self.cursor.fetchone()
                self.lastrowid = row["id"] if isinstance(row, dict) else (row[0] if row else None)
            except Exception:
                self.lastrowid = None
        else:
            self.lastrowid = None
        return self

    def executemany(self, query, seq_of_params):
        pg_query = query.replace("?", "%s")
        return self.cursor.executemany(pg_query, seq_of_params)

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def __iter__(self):
        return iter(self.cursor)

class PostgresConnectionWrapper:
    def __init__(self, raw_conn):
        self.conn = raw_conn

    def cursor(self):
        return PostgresCursorWrapper(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

def get_connection():
    if DATABASE_URL:
        try:
            import psycopg
            from psycopg.rows import dict_row
            raw = psycopg.connect(DATABASE_URL, row_factory=dict_row)
            return PostgresConnectionWrapper(raw)
        except Exception as e:
            print(f"[Warning] Failed to connect to PostgreSQL ({DATABASE_URL[:25]}...): {e}. Falling back to SQLite.")

    # Default to Local SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def is_postgres():
    return bool(DATABASE_URL)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL,
        language VARCHAR(10) DEFAULT 'hi',
        created_at TEXT NOT NULL
    )
    """ if is_postgres() else """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('FARMER', 'CENTRE_STAFF', 'ADMIN', 'SUPER_ADMIN')),
        language TEXT DEFAULT 'hi',
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        village VARCHAR(100),
        district VARCHAR(100),
        identity_reference VARCHAR(50),
        preferred_language VARCHAR(10) DEFAULT 'hi',
        created_at TEXT NOT NULL
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS centres (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        district VARCHAR(100) NOT NULL,
        latitude REAL,
        longitude REAL,
        daily_capacity INTEGER DEFAULT 100,
        active INTEGER DEFAULT 1
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        centre_id INTEGER REFERENCES centres(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        capacity INTEGER DEFAULT 20,
        booked_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'AVAILABLE'
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
        centre_id INTEGER REFERENCES centres(id) ON DELETE CASCADE,
        slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
        token_number VARCHAR(50) UNIQUE NOT NULL,
        booking_channel VARCHAR(20) NOT NULL,
        booking_status VARCHAR(20) DEFAULT 'BOOKED',
        created_at TEXT NOT NULL
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS procurement_records (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        crop VARCHAR(50) NOT NULL,
        quantity REAL DEFAULT 0.0,
        quality_result VARCHAR(20) DEFAULT 'PENDING',
        procurement_status VARCHAR(30) DEFAULT 'SLOT_BOOKED',
        quality_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        procurement_id INTEGER REFERENCES procurement_records(id) ON DELETE CASCADE,
        amount REAL DEFAULT 0.0,
        payment_status VARCHAR(20) DEFAULT 'PENDING',
        transaction_reference VARCHAR(100),
        payment_date TEXT
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        channel VARCHAR(10) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'SENT',
        sent_at TEXT NOT NULL
    )
    """ if is_postgres() else """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS status_history (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        old_status VARCHAR(30),
        new_status VARCHAR(30) NOT NULL,
        changed_by VARCHAR(50) DEFAULT 'SYSTEM',
        timestamp TEXT NOT NULL,
        remarks TEXT
    )
    """ if is_postgres() else """
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
    row = cursor.fetchone()
    count = row["count"] if isinstance(row, dict) else row[0]
    if count == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today_str = date.today().isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()
    day_after_str = (date.today() + timedelta(days=2)).isoformat()

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

    cursor.execute("SELECT id, code FROM centres")
    centre_map = {row["code"]: row["id"] for row in cursor.fetchall()}

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

    farmers_data = [
        ("Ramesh Jadhav", "9876543210", "Hadapsar", "Pune", "KID-4091-MH", "mr"),
        ("Suresh Patil", "9823456789", "Baramati Rural", "Pune", "KID-5102-MH", "hi"),
        ("Mahesh Shinde", "9812345678", "Daund Gaon", "Pune", "KID-6203-MH", "mr"),
        ("Ganesh Deshmukh", "9898989898", "Manchar", "Pune", "KID-7304-MH", "en"),
    ]

    for name, mob, vil, dist, ident, lang in farmers_data:
        cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES (?, 'FARMER', ?, ?)", (mob, lang, now_iso))
        uid = cursor.lastrowid
        cursor.execute("""
            INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (uid, name, mob, vil, dist, ident, lang, now_iso))

    cursor.execute("INSERT INTO users (phone, role, language, created_at) VALUES ('9999999999', 'ADMIN', 'en', ?)", (now_iso,))

    conn.commit()

if __name__ == "__main__":
    init_db()
    db_type = "PostgreSQL (Supabase/Railway)" if is_postgres() else f"SQLite ({DB_PATH})"
    print(f"Database initialized successfully using: {db_type}")
