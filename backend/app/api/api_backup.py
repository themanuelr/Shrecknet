from fastapi import APIRouter, Depends, UploadFile, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.crud.crud_backup import export_backup_zip, import_backup_zip
from app.models.model_user import User, UserRole
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/backup", tags=["Backup"], dependencies=[Depends(get_current_user)])

@router.get("/export")
async def export_backup(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.system_admin)),
):
    data = await export_backup_zip(session)
    return Response(
        content=data,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="backup.zip"'}
    )

@router.post("/import")
async def import_backup(
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.system_admin)),
):
    await import_backup_zip(session, file)
    return {"ok": True}
