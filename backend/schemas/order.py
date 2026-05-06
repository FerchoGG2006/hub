from pydantic import BaseModel
from typing import Optional

class OrderRequest(BaseModel):
    items_json: str
    total_price: int
    customer_name: str
    phone: str
    table_number: Optional[str] = None
    delivery_method: str = "mesa" # mesa, domicilio, recojo
    payment_method: str = "transferencia"
    branch_id: Optional[int] = None

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    total_price: int
    status: str
    table_number: Optional[str]
    items_json: str
    branch_id: Optional[int]
    branch_name: str

    class Config:
        from_attributes = True
