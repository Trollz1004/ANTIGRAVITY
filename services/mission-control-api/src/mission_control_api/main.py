from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import health, deploy, runbooks, hermes, tasks

app = FastAPI(title="Mission Control API")

origins = settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(deploy.router)
app.include_router(runbooks.router)
app.include_router(hermes.router)
app.include_router(tasks.router)

# Lifespan event to enforce reserve percent already validated on import
