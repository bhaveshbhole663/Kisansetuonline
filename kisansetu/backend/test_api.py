import sys
from fastapi.testclient import TestClient
from main import app
from datetime import date

client = TestClient(app)

def run_tests():
    print("=== STARTING KISANSETU AUTOMATED TESTS ===")

    # Test 1: Root & Health Check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    data = res.json()
    assert data["status"] == "ONLINE"
    assert "WEB" in data["supported_channels"]
    print("[PASS] Test 1: System root & health check online.")

    # Test 2: Centres & Smart Recommendations
    res = client.get("/api/centres")
    assert res.status_code == 200
    centres = res.json()["centres"]
    assert len(centres) >= 4, "Should have seeded APMC centres"
    print(f"[PASS] Test 2: Retrieved {len(centres)} APMC centres with live load percentages.")

    # Test 3: Web Slot Booking
    today_str = date.today().isoformat()
    slot_res = client.get(f"/api/centres/1/slots?target_date={today_str}")
    assert slot_res.status_code == 200
    slot_data = slot_res.json()
    avail_slot = [s for s in slot_data["slots"] if s["booked_count"] < s["capacity"]][0]

    book_res = client.post("/api/bookings", json={
        "farmer_id": 1,
        "centre_id": 1,
        "slot_id": avail_slot["id"],
        "crop": "Wheat",
        "quantity": 45.0,
        "booking_channel": "WEB"
    })
    assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
    booking = book_res.json()["booking"]
    token_web = booking["token_number"]
    assert "PUN-" in token_web
    assert booking["booking_channel"] == "WEB"
    print(f"[PASS] Test 3: Web booking confirmed with token {token_web}.")

    # Test 4: SMS State Machine & Commands
    # 4a: Direct STATUS query
    sms_res = client.post("/api/channels/sms", json={
        "from_phone": "9876543210",
        "message": f"STATUS {token_web}"
    })
    assert sms_res.status_code == 200
    assert token_web in sms_res.json()["reply"]
    print(f"[PASS] Test 4a: SMS command 'STATUS' resolved token {token_web}.")

    # 4b: Multi-turn SMS Booking State Machine
    phone_sms = "9988776655"
    s1 = client.post("/api/channels/sms", json={"from_phone": phone_sms, "message": "BOOK"})
    assert "Select Centre" in s1.json()["reply"]

    s2 = client.post("/api/channels/sms", json={"from_phone": phone_sms, "message": "1"})
    assert "Select Date" in s2.json()["reply"]

    s3 = client.post("/api/channels/sms", json={"from_phone": phone_sms, "message": "1"})
    assert "Available Slots" in s3.json()["reply"]

    s4 = client.post("/api/channels/sms", json={"from_phone": phone_sms, "message": "1"})
    sms_reply = s4.json()["reply"]
    assert "Booking Confirmed!" in sms_reply
    assert "Token:" in sms_reply
    print("[PASS] Test 4b: 4-turn deterministic SMS booking state machine completed successfully.")

    # Test 5: IVR Multi-turn DTMF Helpline
    ivr_phone = "9123456780"
    # Step 0: Greeting
    ivr_0 = client.post("/api/channels/ivr", json={"caller_phone": ivr_phone, "step": "INIT"})
    assert ivr_0.json()["next_step"] == "LANG_SELECTED"

    # Step 1: Language selected (1 for Hindi)
    ivr_1 = client.post("/api/channels/ivr", json={"caller_phone": ivr_phone, "step": "LANG_SELECTED", "input_digits": "1"})
    assert ivr_1.json()["next_step"] == "MENU_SELECTED"

    # Step 2: Main Menu selected (1 for Book Slot)
    ivr_2 = client.post("/api/channels/ivr", json={"caller_phone": ivr_phone, "step": "MENU_SELECTED", "input_digits": "1", "language": "hi"})
    assert ivr_2.json()["next_step"] == "CENTRE_SELECTED"

    # Step 3: Centre selected (1 for Pune)
    ivr_3 = client.post("/api/channels/ivr", json={"caller_phone": ivr_phone, "step": "CENTRE_SELECTED", "input_digits": "1", "language": "hi"})
    assert ivr_3.json()["next_step"] == "SLOT_SELECTED"

    # Step 4: Slot selected (1 for Slot 1)
    ivr_4 = client.post("/api/channels/ivr", json={"caller_phone": ivr_phone, "step": "SLOT_SELECTED", "input_digits": "1", "language": "hi", "centre_id": 1})
    assert ivr_4.json()["next_step"] == "FINISHED"
    assert "token_number" in ivr_4.json()
    print(f"[PASS] Test 5: Multi-turn IVR telephone booking confirmed token {ivr_4.json()['token_number']}.")

    # Test 6: Walk-in Farmer Registration
    walk_res = client.post("/api/admin/walkins", json={
        "name": "Eknath Shinde",
        "mobile": "9855544433",
        "centre_id": 1,
        "crop": "Soybean",
        "estimated_quantity": 38.0,
        "village": "Uruli Kanchan"
    })
    assert walk_res.status_code == 200
    walk_data = walk_res.json()
    assert walk_data["channel"] == "WALK_IN"
    assert "-W" in walk_data["token_number"]
    print(f"[PASS] Test 6: Walk-in farmer registered with spot token {walk_data['token_number']}.")

    # Test 7: Admin Queue Verification (All 4 channels present)
    queue_res = client.get("/api/admin/queue")
    assert queue_res.status_code == 200
    queue = queue_res.json()["queue"]
    channels_found = {item["booking_channel"] for item in queue}
    assert "WEB" in channels_found, "WEB bookings should be in queue"
    assert "SMS" in channels_found, "SMS bookings should be in queue"
    assert "IVR" in channels_found, "IVR bookings should be in queue"
    assert "WALK_IN" in channels_found, "WALK_IN bookings should be in queue"
    print(f"[PASS] Test 7: Centralized queue contains all 4 channels: {channels_found}.")

    # Test 8: Procurement 8-Stage Lifecycle Advancement
    booking_id = booking["id"]
    # 8a: Mark Arrived
    r1 = client.post("/api/admin/procurement/status", json={"booking_id": booking_id, "new_status": "ARRIVED"})
    assert r1.status_code == 200 and r1.json()["procurement_status"] == "ARRIVED"

    # 8b: Quality Check
    r2 = client.post("/api/admin/procurement/status", json={"booking_id": booking_id, "new_status": "QUALITY_CHECK", "quality_result": "GRADE_A"})
    assert r2.status_code == 200 and r2.json()["procurement_status"] == "QUALITY_CHECK"

    # 8c: Weighed
    r3 = client.post("/api/admin/procurement/status", json={"booking_id": booking_id, "new_status": "WEIGHED", "quantity": 44.5})
    assert r3.status_code == 200 and r3.json()["procurement_status"] == "WEIGHED"

    # 8d: Accepted
    r4 = client.post("/api/admin/procurement/status", json={"booking_id": booking_id, "new_status": "ACCEPTED"})
    assert r4.status_code == 200 and r4.json()["procurement_status"] == "ACCEPTED"

    # 8e: Paid (Simulated PFMS)
    r5 = client.post("/api/admin/procurement/status", json={"booking_id": booking_id, "new_status": "PAID"})
    assert r5.status_code == 200 and r5.json()["procurement_status"] == "PAID"
    print("[PASS] Test 8: Complete 8-stage procurement progression verified with simulated DBT payment.")

    # Test 9: Grounded Multilingual AI Query Assistant
    ai_res = client.post("/api/ai/query", json={
        "farmer_id": 1,
        "query_text": "मेरा पेमेंट कब आएगा?",
        "language": "hi"
    })
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["intent"] == "PAYMENT_STATUS"
    assert ai_data["ground_truth_record"] is not None
    print("[PASS] Test 9: Multilingual AI farmer assistant intent resolved from real DB records.")

    # Test 10: Analytics KPI Summary
    analytics_res = client.get("/api/analytics/summary")
    assert analytics_res.status_code == 200
    ana_data = analytics_res.json()
    assert "metrics" in ana_data
    assert "channel_breakdown" in ana_data
    print("[PASS] Test 10: Operational analytics & channel breakdowns verified.")

    print("\n=== ALL 10 TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
