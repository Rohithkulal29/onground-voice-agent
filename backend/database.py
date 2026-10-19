import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "retail_leads.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            store_branch TEXT NOT NULL,
            campaign_offer TEXT NOT NULL,
            call_status TEXT NOT NULL DEFAULT 'Pending',
            call_id TEXT,
            transcript TEXT,
            created_at TEXT NOT NULL
        );
    """)
    conn.commit()

    # Pre-seed database with sample retail store leads if table is empty
    cursor.execute("SELECT COUNT(*) FROM leads")
    count = cursor.fetchone()[0]
    if count == 0:
        # Dynamically load test lead phone from environment variable, falling back to default
        test_lead_phone = os.getenv("TEST_LEAD_PHONE", "+919876543210")
        
        sample_leads = [
            (
                "Rajesh Sharma",
                test_lead_phone,
                "Rajajinagar Flagship",
                "Exclusive VIP Preview: 25% Off Festive Kurtas & Ethnic Wear + Free Tailoring",
                "Pending",
                None,
                None,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ),
            (
                "Ananya Rao",
                "+919123456780",
                "Indiranagar Store",
                "Weekend Special: Buy 1 Get 1 on Premium Activewear + 500 On-Ground Reward Points",
                "Pending",
                None,
                None,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        ]
        cursor.executemany("""
            INSERT INTO leads (
                customer_name, phone_number, store_branch, campaign_offer,
                call_status, call_id, transcript, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_leads)
        conn.commit()
    conn.close()

def get_all_leads() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leads ORDER BY id DESC")
    rows = cursor.fetchall()
    leads = [dict(row) for row in rows]
    conn.close()
    return leads

def get_lead_by_id(lead_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_lead(customer_name: str, phone_number: str, store_branch: str, campaign_offer: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO leads (customer_name, phone_number, store_branch, campaign_offer, call_status, created_at)
        VALUES (?, ?, ?, ?, 'Pending', ?)
    """, (customer_name.strip(), phone_number.strip(), store_branch.strip(), campaign_offer.strip(), now_str))
    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_lead_by_id(lead_id)

def update_lead_status(lead_id: int, call_status: str, call_id: Optional[str] = None, transcript: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    fields = ["call_status = ?"]
    params = [call_status]

    if call_id is not None:
        fields.append("call_id = ?")
        params.append(call_id)
    if transcript is not None:
        fields.append("transcript = ?")
        params.append(transcript)

    params.append(lead_id)
    cursor.execute(f"UPDATE leads SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return get_lead_by_id(lead_id)

def update_lead_by_call_id(call_id: str, call_status: Optional[str] = None, transcript: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    params = []

    if call_status is not None:
        fields.append("call_status = ?")
        params.append(call_status)
    if transcript is not None:
        fields.append("transcript = ?")
        params.append(transcript)

    if not fields:
        conn.close()
        return None

    params.append(call_id)
    cursor.execute(f"UPDATE leads SET {', '.join(fields)} WHERE call_id = ?", params)
    conn.commit()
    cursor.execute("SELECT * FROM leads WHERE call_id = ?", (call_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None