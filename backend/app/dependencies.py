from fastapi import Depends, HTTPException, status
from app.models.model_user import User, UserRole
from app.crud.crud_users import get_user_by_email
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession
from jose import JWTError, jwt

from app.database import get_session
from app import auth

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

ROLE_HIERARCHY = {
    UserRole.system_admin: 4,
    UserRole.world_builder: 3,
    UserRole.writer: 2,
    UserRole.player: 1,
}

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user_by_email(session, email)
    if not user:
        raise credentials_exception
    return user

def require_role(minimum_role: str):
    def dependency(current_user: User = Depends(get_current_user)):
        user_role_value = ROLE_HIERARCHY.get(current_user.role, 0)
        required_role_value = ROLE_HIERARCHY.get(minimum_role, 999)
        if user_role_value < required_role_value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient privileges. Requires '{minimum_role}' or higher."
            )
        return current_user
    return dependency
