# app/api/api_import_export.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.crud.crud_import_export import export_world, import_world, export_world_zip, import_world_zip
from app.models.model_user import User, UserRole
from app.dependencies import get_current_user, require_role
import json

from fastapi import Body

router = APIRouter(prefix="/import_export", tags=["ImportExport"], dependencies=[Depends(get_current_user)])

@router.get("/export/{world_id}")
async def export_world_zip_endpoint(
    world_id: int,
    frontend_base_url: str,  # REQUIRED: frontend_base_url param from query
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),
):
    """
    Export a world as a ZIP containing world.json and all referenced files, fetched via HTTP from frontend_base_url.
    """
    zip_bytes, found = await export_world_zip(session, world_id, frontend_base_url)
    if not found:
        raise HTTPException(status_code=404, detail="World not found")
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="world_{world_id}_export.zip"'
        }
    )

@router.post("/import/")
async def import_world_endpoint(
    data: dict = Body(...),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role(UserRole.world_builder)),
):
    new_world_id = await import_world(session, data)
    return {"ok": True, "new_world_id": new_world_id}
