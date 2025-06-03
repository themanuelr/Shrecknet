from typing import Optional, List
from sqlmodel import SQLModel

class PageCharacteristicValueBase(SQLModel):
    characteristic_id: int
    value: Optional[List[str]]

class   PageCharacteristicValueCreate(PageCharacteristicValueBase):
    pass

class PageCharacteristicValueUpdate(SQLModel):
    characteristic_id: int
    value: Optional[List[str]]

class PageCharacteristicValueRead(PageCharacteristicValueBase):
    pass