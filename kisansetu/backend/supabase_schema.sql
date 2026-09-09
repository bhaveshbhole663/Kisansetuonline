-- =========================================================================
-- KisanSetu — Multi-Channel Farmer Procurement System
-- Supabase & PostgreSQL Production Database Schema & Seed Data
-- =========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('FARMER', 'CENTRE_STAFF', 'ADMIN', 'SUPER_ADMIN')),
    language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Farmers Profile Table
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    village VARCHAR(100),
    district VARCHAR(100),
    identity_reference VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APMC Procurement Centres Table
CREATE TABLE IF NOT EXISTS centres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    daily_capacity INTEGER DEFAULT 100,
    active INTEGER DEFAULT 1
);

-- 4. Hourly Slots Table
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    centre_id INTEGER REFERENCES centres(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    capacity INTEGER DEFAULT 20,
    booked_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'FULL', 'CLOSED'))
);

-- 5. Bookings Table (One central table for Web, SMS, IVR, Walk-in)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    centre_id INTEGER REFERENCES centres(id) ON DELETE CASCADE,
    slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    booking_channel VARCHAR(20) NOT NULL CHECK(booking_channel IN ('WEB', 'SMS', 'IVR', 'WALK_IN')),
    booking_status VARCHAR(20) DEFAULT 'BOOKED' CHECK(booking_status IN ('BOOKED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Procurement Workflow Records (8-Stage Lifecycle)
CREATE TABLE IF NOT EXISTS procurement_records (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    crop VARCHAR(50) NOT NULL,
    quantity DOUBLE PRECISION DEFAULT 0.0,
    quality_result VARCHAR(20) DEFAULT 'PENDING' CHECK(quality_result IN ('PENDING', 'GRADE_A', 'GRADE_B', 'ACCEPTED', 'REJECTED')),
    procurement_status VARCHAR(30) DEFAULT 'SLOT_BOOKED' CHECK(
        procurement_status IN (
            'REGISTERED', 'SLOT_BOOKED', 'ARRIVED', 
            'QUALITY_CHECK', 'WEIGHED', 'ACCEPTED', 
            'REJECTED', 'PAYMENT_PROCESSING', 'PAID'
        )
    ),
    quality_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payments Table (Simulated DBT / PFMS Direct Benefit Transfer)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER REFERENCES procurement_records(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION DEFAULT 0.0,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED')),
    transaction_reference VARCHAR(100),
    payment_date DATE
);

-- 8. Notifications Log Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    channel VARCHAR(10) NOT NULL CHECK(channel IN ('SMS', 'WEB', 'IVR')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transparent Status History & Audit Trail Table
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(50) DEFAULT 'SYSTEM',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);

-- =========================================================================
-- SEED DATA (Maharashtra APMC Demonstration Centres, Farmers, Slots)
-- =========================================================================

-- Insert Centres
INSERT INTO centres (name, code, address, district, latitude, longitude, daily_capacity, active)
VALUES 
    ('Pune Central Grain Mandi (Hadapsar)', 'PUN', 'Hadapsar APMC Market Yard, Pune, MH', 'Pune', 18.5089, 73.9260, 100, 1),
    ('Baramati Krishi Kendra', 'BAR', 'MIDC Area, Baramati, Dist. Pune, MH', 'Pune', 18.1524, 74.5768, 80, 1),
    ('Daund Market Yard', 'DAU', 'Station Road, Daund, Dist. Pune, MH', 'Pune', 18.4651, 74.5828, 60, 1),
    ('Nashik APMC Sub-Yard', 'NSK', 'Peth Road, Panchavati, Nashik, MH', 'Nashik', 20.0125, 73.7915, 120, 1)
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Users & Farmers
INSERT INTO users (phone, role, language) VALUES 
    ('9876543210', 'FARMER', 'mr'),
    ('9823456789', 'FARMER', 'hi'),
    ('9812345678', 'FARMER', 'mr'),
    ('9898989898', 'FARMER', 'en'),
    ('9999999999', 'ADMIN', 'en')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO farmers (user_id, name, mobile, village, district, identity_reference, preferred_language)
VALUES 
    (1, 'Ramesh Jadhav', '9876543210', 'Hadapsar', 'Pune', 'KID-4091-MH', 'mr'),
    (2, 'Suresh Patil', '9823456789', 'Baramati Rural', 'Pune', 'KID-5102-MH', 'hi'),
    (3, 'Mahesh Shinde', '9812345678', 'Daund Gaon', 'Pune', 'KID-6203-MH', 'mr'),
    (4, 'Ganesh Deshmukh', '9898989898', 'Manchar', 'Pune', 'KID-7304-MH', 'en')
ON CONFLICT DO NOTHING;

-- Insert Slots for Today and Tomorrow
DO $$
DECLARE
    cid INT;
    d DATE;
    cur_date DATE := CURRENT_DATE;
BEGIN
    FOR cid IN SELECT id FROM centres LOOP
        FOR d IN SELECT cur_date + i FROM generate_series(0, 2) i LOOP
            INSERT INTO slots (centre_id, date, start_time, end_time, capacity, booked_count, status)
            VALUES 
                (cid, d, '08:00', '09:00', 20, 0, 'AVAILABLE'),
                (cid, d, '09:00', '10:00', 20, 0, 'AVAILABLE'),
                (cid, d, '10:00', '11:00', 20, 0, 'AVAILABLE'),
                (cid, d, '11:00', '12:00', 20, 0, 'AVAILABLE'),
                (cid, d, '13:00', '14:00', 20, 0, 'AVAILABLE'),
                (cid, d, '14:00', '15:00', 20, 0, 'AVAILABLE');
        END LOOP;
    END LOOP;
END $$;
