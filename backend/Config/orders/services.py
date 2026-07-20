from django.db import transaction
from django.db.models import F
from ninja.errors import HttpError
from .models import Order, OrderStatusHistory
from catalog.models import Product

ALLOWED_TRANSITIONS = {
    "PENDING":     {"PROCESSING", "CANCELLED"},
    "PROCESSING":  {"SHIPPED", "CANCELLED"},
    "SHIPPED":     {"DELIVERED"},
    "DELIVERED":   set(),   # terminal
    "CANCELLED":   set(),   # terminal
}

@transaction.atomic
def transition_order_status(order, new_status: str, actor):
    if new_status not in ALLOWED_TRANSITIONS.get(order.status, set()):
        raise HttpError(409, f"Cannot move order from {order.status} to {new_status}")

    # HARD RULE: cancellation is blocked once payment is captured.
    if new_status == "CANCELLED" and hasattr(order, 'payment') and order.payment.status == "SUCCESS":
        raise HttpError(409, "Cannot cancel a paid order directly — process a refund first.")

    if new_status == "CANCELLED":
        # only reachable here if payment was never captured (order was PENDING/PROCESSING, unpaid)
        for item in order.items.select_related("product"):
            if item.product:
                Product.objects.filter(id=item.product_id).update(
                    stock_quantity=F("stock_quantity") + item.quantity
                )

    OrderStatusHistory.objects.create(
        order=order, from_status=order.status, to_status=new_status, changed_by=actor
    )
    # old_status = order.status
    order.status = new_status
    order.save()

    # order_status_changed.send(sender=Order, order=order, old_status=old_status, new_status=new_status, actor=actor)
    # (Signal not implemented in this pass but the logic structure supports it later)
