import random
import threading
import uuid
import datetime
from django.utils import timezone

def build_daraja_style_payload(checkout_request_id: str, outcome: str) -> dict:
    """Builds a payload shaped like Safaricom's real callback body."""
    if outcome == "SUCCESS":
        result_code = 0
        result_desc = "The service request is processed successfully."
    elif outcome == "INSUFFICIENT_FUNDS":
        result_code = 1
        result_desc = "The balance is insufficient for the transaction."
    elif outcome == "CANCELLED":
        result_code = 1032
        result_desc = "Request cancelled by user."
    else:
        result_code = 1
        result_desc = "Failed"

    payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": f"mock-req-{uuid.uuid4()}",
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": result_code,
                "ResultDesc": result_desc,
            }
        }
    }

    if outcome == "SUCCESS":
        payload["Body"]["stkCallback"]["CallbackMetadata"] = {
            "Item": [
                {"Name": "Amount", "Value": 100},
                {"Name": "MpesaReceiptNumber", "Value": f"MOCK{random.randint(10000, 99999)}"},
                {"Name": "TransactionDate", "Value": int(timezone.now().timestamp() * 1000)},
                {"Name": "PhoneNumber", "Value": 254700000000}
            ]
        }

    return payload


def _fire_callback(checkout_request_id: str, outcome: str):
    # This runs in a separate thread.
    from orders.api import process_mpesa_callback, DarajaCallbackSchema
    
    payload = build_daraja_style_payload(checkout_request_id, outcome)
    schema_instance = DarajaCallbackSchema.parse_obj(payload)
    
    # We must ensure the DB connections are closed after thread finishes
    # Django handles this automatically if wrapped in connection.close() or we just let it be for dev
    from django.db import connection
    try:
        process_mpesa_callback(schema_instance.Body.stkCallback)
    finally:
        connection.close()


def schedule_mock_callback(checkout_request_id: str, order_id: int, outcome: str = None, delay_seconds: int = 10):
    """
    outcome: None = randomly weighted realistic mix.
    """
    if outcome is None:
        outcome = random.choices(["SUCCESS", "INSUFFICIENT_FUNDS", "CANCELLED"], weights=[80, 10, 10])[0]

    # Use threading.Timer to execute the callback asynchronously in dev mode
    timer = threading.Timer(delay_seconds, _fire_callback, args=[checkout_request_id, outcome])
    timer.start()
