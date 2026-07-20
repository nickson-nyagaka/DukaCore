import random
import uuid
import requests
from typing import Protocol
from django.conf import settings
from orders.models import Order, Payment

class PaymentGateway(Protocol):
    def initiate_payment(self, order: Order, phone_number: str) -> str:
        """Returns a checkout_request_id. Does NOT confirm payment — this only starts it."""
        ...
        
    def query_status(self, checkout_request_id: str) -> str:
        """Fallback polling — used when a callback never arrives."""
        ...

class DarajaGateway:
    def initiate_payment(self, order: Order, phone_number: str) -> str:
        # TODO: Implement real STK push
        DARAJA_STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        # resp = requests.post(DARAJA_STK_PUSH_URL, json={...}, headers=self._auth_headers())
        # return resp.json()["CheckoutRequestID"]
        raise NotImplementedError("Daraja gateway not fully implemented yet.")

    def query_status(self, checkout_request_id: str) -> str:
        # TODO: calls /mpesa/transactionstatus/v1/query
        raise NotImplementedError()

class MockGateway:
    def initiate_payment(self, order: Order, phone_number: str) -> str:
        checkout_request_id = f"mock-{uuid.uuid4()}"
        
        # We must import the task here to avoid circular imports if it imports anything from gateway
        from .tasks import schedule_mock_callback
        
        # Simulate real STK Push latency (async)
        delay_seconds = random.randint(5, 15)
        schedule_mock_callback(checkout_request_id, order.id, delay_seconds=delay_seconds)
        
        return checkout_request_id

    def query_status(self, checkout_request_id: str) -> str:
        payment = Payment.objects.get(checkout_request_id=checkout_request_id)
        return payment.status

def get_payment_gateway() -> PaymentGateway:
    return MockGateway() if settings.PAYMENT_GATEWAY_MODE == "mock" else DarajaGateway()
