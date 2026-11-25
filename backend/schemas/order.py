from pydantic import BaseModel, Field
from typing import Literal
from typing import Optional

class OrderRequest(BaseModel):
    items_json: str = Field(max_length=100_000)
    total_price: int = Field(default=0, ge=0)
    customer_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20, pattern=r'^\+?[0-9 ()-]+$')
    table_number: Optional[str] = Field(default=None, max_length=255)
    delivery_method: Literal['mesa', 'domicilio', 'recoger', 'recojo', 'pick'] = "mesa"
    payment_method: Literal['transferencia', 'wompi', 'nequi', 'pse', 'efectivo'] = "transferencia"
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
