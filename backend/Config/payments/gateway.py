import base64
import datetime
import logging
import random
import uuid
import requests
from typing import Protocol
from django.conf import settings
from orders.models import Order, Payment

logger = logging.getLogger(__name__)

class PaymentGateway(Protocol):
    def initiate_payment(self, order: Order, phone_number: str) -> str:
        """Returns a checkout_request_id. Does NOT confirm payment — this only starts it."""
        ...
        
    def query_status(self, checkout_request_id: str) -> dict:
        """Active polling query to Safaricom Daraja API."""
        ...

class DarajaGateway:
    def _get_access_token(self) -> str:
        consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        
        base_url = "https://sandbox.safaricom.co.ke" if env == "sandbox" else "https://api.safaricom.co.ke"
        api_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        try:
            resp = requests.get(api_url, auth=(consumer_key, consumer_secret), timeout=15)
            resp.raise_for_status()
            data = resp.json()
            return data.get("access_token")
        except Exception as e:
            logger.error(f"Error fetching Daraja access token: {e}")
            raise RuntimeError(f"Could not authenticate with Safaricom Daraja: {e}")

    def initiate_payment(self, order: Order, phone_number: str) -> str:
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        base_url = "https://sandbox.safaricom.co.ke" if env == "sandbox" else "https://api.safaricom.co.ke"
        stk_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
        
        token = self._get_access_token()
        shortcode = str(getattr(settings, 'MPESA_SHORTCODE', '174379'))
        passkey = getattr(settings, 'MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
        callback_url = getattr(settings, 'MPESA_CALLBACK_URL', 'https://api.mavinehouseholds.com/api/orders/payment/callback')
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        raw_password = f"{shortcode}{passkey}{timestamp}".encode('utf-8')
        password = base64.b64encode(raw_password).decode('utf-8')
        
        formatted_phone = phone_number.strip().replace("+", "")
        if formatted_phone.startswith("0"):
            formatted_phone = "254" + formatted_phone[1:]
        elif not formatted_phone.startswith("254"):
            formatted_phone = "254" + formatted_phone
            
        amount = int(round(float(order.total_amount)))
        if amount < 1:
            amount = 1
            
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": formatted_phone,
            "PartyB": shortcode,
            "PhoneNumber": formatted_phone,
            "CallBackURL": callback_url,
            "AccountReference": f"MVE{order.id}",
            "TransactionDesc": f"Mavine Order #{order.id}"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"Initiating STK Push to {formatted_phone} for KES {amount} (Order #{order.id})")
        resp = requests.post(stk_url, json=payload, headers=headers, timeout=20)
        res_data = resp.json()
        
        if res_data.get('ResponseCode') == '0':
            checkout_request_id = res_data.get('CheckoutRequestID')
            logger.info(f"Safaricom STK Push accepted: CheckoutRequestID={checkout_request_id}")
            return checkout_request_id
        else:
            err_msg = res_data.get('CustomerMessage') or res_data.get('ResponseDescription') or "STK Push request rejected by Safaricom"
            logger.error(f"Safaricom STK Push error: {res_data}")
            raise RuntimeError(f"Safaricom STK Push error: {err_msg}")

    def query_status(self, checkout_request_id: str) -> dict:
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        base_url = "https://sandbox.safaricom.co.ke" if env == "sandbox" else "https://api.safaricom.co.ke"
        query_url = f"{base_url}/mpesa/stkpushquery/v1/query"
        
        try:
            token = self._get_access_token()
            shortcode = str(getattr(settings, 'MPESA_SHORTCODE', '174379'))
            passkey = getattr(settings, 'MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
            
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            raw_password = f"{shortcode}{passkey}{timestamp}".encode('utf-8')
            password = base64.b64encode(raw_password).decode('utf-8')
            
            payload = {
                "BusinessShortCode": shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            resp = requests.post(query_url, json=payload, headers=headers, timeout=12)
            data = resp.json()
            logger.info(f"Daraja STK query response for {checkout_request_id}: {data}")
            
            result_code = str(data.get("ResultCode", ""))
            result_desc = data.get("ResultDesc", "")
            
            if result_code == "0":
                return {"status": "SUCCESS", "receipt": data.get("MpesaReceiptNumber", "")}
            elif result_code in ["1032", "1", "1037", "1025", "1001", "2001"]:
                # 1032 = Cancelled by user
                # 1 = Insufficient funds
                # 1037 = Timeout / No response
                return {"status": "FAILED", "desc": result_desc or "Payment failed or was cancelled"}
            elif data.get("errorCode") or data.get("ResponseCode") != "0":
                desc = data.get("errorMessage") or data.get("ResponseDescription") or ""
                return {"status": "PENDING", "desc": desc}
            else:
                return {"status": "PENDING", "desc": result_desc}
        except Exception as e:
            logger.error(f"Error querying Daraja status: {e}")
            return {"status": "PENDING", "desc": str(e)}

class MockGateway:
    def initiate_payment(self, order: Order, phone_number: str) -> str:
        checkout_request_id = f"ws_CO_{datetime.datetime.now().strftime('%d%m%Y%H%M%S')}_{uuid.uuid4().hex[:8]}"
        from .tasks import schedule_mock_callback
        schedule_mock_callback(checkout_request_id, order.id, delay_seconds=5)
        return checkout_request_id

    def query_status(self, checkout_request_id: str) -> dict:
        payment = Payment.objects.filter(checkout_request_id=checkout_request_id).first()
        if payment and payment.status == 'SUCCESS':
            return {"status": "SUCCESS", "receipt": payment.mpesa_receipt_number or ""}
        elif payment and payment.status == 'FAILED':
            return {"status": "FAILED", "desc": "Payment was cancelled or failed."}
        return {"status": "PENDING"}

def get_payment_gateway() -> PaymentGateway:
    mode = getattr(settings, "PAYMENT_GATEWAY_MODE", "daraja")
    return MockGateway() if mode == "mock" else DarajaGateway()
