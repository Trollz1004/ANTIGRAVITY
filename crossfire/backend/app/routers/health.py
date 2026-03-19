from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    return {"app": "CROSSFIRE", "status": "running", "version": "0.1.0"}


@router.get("/health")
@router.get("/api/health")
async def health():
    return {"status": "ok"}
