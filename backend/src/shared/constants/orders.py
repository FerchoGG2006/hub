from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERING = "delivering"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BusinessEventType(str, Enum):
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    ORDER_PAID = "ORDER_PAID"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    QR_SCANNED = "QR_SCANNED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
