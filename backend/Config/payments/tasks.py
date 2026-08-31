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
        from orders.models import Payment
        payment = Payment.objects.filter(checkout_request_id=checkout_request_id).first()
        amount = int(float(payment.amount)) if payment else 100
        phone = int(payment.phone_number_used.replace("+", "")) if (payment and payment.phone_number_used) else 254708374149
        
        # Generate realistic alphanumeric M-Pesa receipt e.g. RHK8921JKA
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        receipt_no = "MVE" + "".join(random.choices(chars, k=7))
        
        payload["Body"]["stkCallback"]["CallbackMetadata"] = {
            "Item": [
                {"Name": "Amount", "Value": amount},
                {"Name": "MpesaReceiptNumber", "Value": receipt_no},
                {"Name": "TransactionDate", "Value": int(timezone.now().strftime('%Y%m%d%H%M%S'))},
                {"Name": "PhoneNumber", "Value": phone}
            ]
        }

    return payload


def _fire_callback(checkout_request_id: str, outcome: str):
    # This runs in a separate thread.
    from orders.api import process_mpesa_callback, DarajaCallbackSchema
    
    payload = build_daraja_style_payload(checkout_request_id, outcome)
    schema_instance = DarajaCallbackSchema.parse_obj(payload)
    
    from django.db import connection
    try:
        process_mpesa_callback(schema_instance.Body.stkCallback)
    finally:
        connection.close()


def schedule_mock_callback(checkout_request_id: str, order_id: int, outcome: str = None, delay_seconds: int = 5):
    """
    Simulates realistic user entering PIN on their phone.
    Default outcome: 100% SUCCESS for seamless testing unless specified.
    """
    if outcome is None:
        outcome = "SUCCESS"

    timer = threading.Timer(delay_seconds, _fire_callback, args=[checkout_request_id, outcome])
    timer.start()
