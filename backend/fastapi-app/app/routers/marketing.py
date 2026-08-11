"""Marketing automation and AI agent content integration router.

All endpoints read from and write to real database rows
(:class:`app.models.MarketingContent`). No endpoint fabricates content —
unknown IDs return 404 and creates/updates persist immediately.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import MarketingContent, User

router = APIRouter(prefix="/marketing", tags=["marketing"])

# Core branded hashtags
BRANDED_HASHTAGS = {
    "primary": "#YouAndINotAI",
    "themes": [
        "#AIDoesItAll",
        "#AISolutionsStore",
        "#DateWithPurpose",
        "#HumanFirstDating",
        "#DatingApp",
        "#BotShield",
        "#VerifiedMembers",
    ],
}

# Platform hashtag limits
PLATFORM_HASHTAG_LIMITS = {
    "x": 2,
    "instagram": (3, 7),
    "linkedin": 3,
    "tiktok": (3, 5),
    "facebook": 2,
}


class MarketingPost(BaseModel):
    campaign_name: str = Field(..., description="Name of the marketing campaign")
    objective: str = Field(..., description="Campaign objective")
    audience: str = Field(..., description="Target audience")
    platforms: List[str] = Field(..., description="Platforms to publish on")
    core_message: str = Field(..., description="Core marketing message")
    post_type: str = Field(
        ..., description="Type of post (e.g., announcement, story, testimonial)"
    )
    primary_caption: str = Field(..., description="Main caption text")
    call_to_action: Optional[str] = Field(None, description="Call to action phrase")
    hashtag_block: List[str] = Field(
        default_factory=list,
        description="Hashtags including brand, campaign, topic, and optional location",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "campaign_name": "SpringMemberLaunch",
                "objective": "Invite verified members to try local event planning",
                "audience": "Singles who prefer real-world plans",
                "platforms": ["instagram", "facebook"],
                "core_message": "Meet verified members who want to make real plans offline.",
                "post_type": "story",
                "primary_caption": "Skip the bot noise. Meet verified members who want real plans, real conversations, and accountable profiles. #YouAndINotAI #BotShield #DateWithPurpose",
                "call_to_action": "Sign up now",
                "hashtag_block": [
                    "#YouAndINotAI",
                    "#BotShield",
                    "#DateWithPurpose",
                    "#VerifiedMembers",
                    "#HumanFirstDating",
                ],
            }
        }


class ContentItem(BaseModel):
    """Serialized marketing content record sourced from the database."""

    id: uuid.UUID
    title: str
    content: str
    tags: List[str]
    created_at: datetime
    published: bool
    campaign_name: str
    objective: str
    audience: str
    platforms: List[str]
    core_message: str
    post_type: str
    primary_caption: str
    call_to_action: Optional[str]
    hashtag_block: List[str]
    updated_at: datetime


def _serialize(record: MarketingContent) -> ContentItem:
    """Map a ``MarketingContent`` ORM row to its API representation."""
    return ContentItem(
        id=record.id,
        # Original public fields retained for backwards compatibility.
        title=record.campaign_name,
        content=record.primary_caption,
        tags=list(record.hashtag_block or []),
        created_at=record.created_at,
        published=record.published,
        # Full stored record.
        campaign_name=record.campaign_name,
        objective=record.objective,
        audience=record.audience,
        platforms=list(record.platforms or []),
        core_message=record.core_message,
        post_type=record.post_type,
        primary_caption=record.primary_caption,
        call_to_action=record.call_to_action,
        hashtag_block=list(record.hashtag_block or []),
        updated_at=record.updated_at,
    )


def _validate_branded_hashtag(hashtag_block: List[str]) -> None:
    """Require at least one branded hashtag in the block."""
    branded_hashtags_present = any(
        tag in hashtag_block
        for tag in [BRANDED_HASHTAGS["primary"]] + BRANDED_HASHTAGS["themes"]
    )
    if not branded_hashtags_present:
        raise HTTPException(
            status_code=400, detail="At least one branded hashtag must be included"
        )


def _validate_platform_limits(platforms: List[str], hashtag_block: List[str]) -> None:
    """Enforce per-platform hashtag count limits."""
    for platform in platforms:
        if platform in PLATFORM_HASHTAG_LIMITS:
            hashtag_count = len([tag for tag in hashtag_block if tag.startswith("#")])
            limit = PLATFORM_HASHTAG_LIMITS[platform]

            if isinstance(limit, tuple):
                min_limit, max_limit = limit
                if not (min_limit <= hashtag_count <= max_limit):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Platform {platform} requires {min_limit}-{max_limit} hashtags, got {hashtag_count}",
                    )
            else:
                if hashtag_count > limit:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Platform {platform} allows maximum {limit} hashtags, got {hashtag_count}",
                    )


def _validate_post(content: MarketingPost) -> None:
    _validate_branded_hashtag(content.hashtag_block)
    _validate_platform_limits(content.platforms, content.hashtag_block)


async def _get_or_404(content_id: uuid.UUID, db: AsyncSession) -> MarketingContent:
    """Fetch a stored content item or raise 404 — never fabricate one."""
    record = await db.get(MarketingContent, content_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Marketing content not found")
    return record


@router.post(
    "/content", response_model=ContentItem, status_code=status.HTTP_201_CREATED
)
async def create_content_item(
    content: MarketingPost,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new marketing content item from an AI agent.

    The payload is validated and persisted to the database; the response is the
    stored row.
    """
    _validate_post(content)

    record = MarketingContent(
        campaign_name=content.campaign_name,
        objective=content.objective,
        audience=content.audience,
        platforms=content.platforms,
        core_message=content.core_message,
        post_type=content.post_type,
        primary_caption=content.primary_caption,
        call_to_action=content.call_to_action,
        hashtag_block=content.hashtag_block,
        published=False,
        created_by=current_user.id,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _serialize(record)


@router.get("/content", response_model=List[ContentItem])
async def list_content_items(
    published: Optional[bool] = Query(
        None, description="Filter by published state when provided"
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List persisted marketing content items, newest first.
    """
    stmt = select(MarketingContent).order_by(MarketingContent.created_at.desc())
    if published is not None:
        stmt = stmt.where(MarketingContent.published.is_(published))
    stmt = stmt.offset(offset).limit(limit)
    records = (await db.scalars(stmt)).all()
    return [_serialize(record) for record in records]


@router.get("/content/{content_id}", response_model=ContentItem)
async def get_content_item(
    content_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific persisted marketing content item (404 when it does not exist).
    """
    record = await _get_or_404(content_id, db)
    return _serialize(record)


@router.put("/content/{content_id}", response_model=ContentItem)
async def update_content_item(
    content_id: uuid.UUID,
    content_update: MarketingPost,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fully replace a persisted marketing content item (404 when it does not exist).
    """
    _validate_post(content_update)

    record = await _get_or_404(content_id, db)
    record.campaign_name = content_update.campaign_name
    record.objective = content_update.objective
    record.audience = content_update.audience
    record.platforms = content_update.platforms
    record.core_message = content_update.core_message
    record.post_type = content_update.post_type
    record.primary_caption = content_update.primary_caption
    record.call_to_action = content_update.call_to_action
    record.hashtag_block = content_update.hashtag_block

    await db.commit()
    await db.refresh(record)
    return _serialize(record)


class MarketingPostUpdate(BaseModel):
    """Partial update schema — all fields optional for PATCH semantics."""

    campaign_name: Optional[str] = Field(
        None, description="Name of the marketing campaign"
    )
    objective: Optional[str] = Field(None, description="Campaign objective")
    audience: Optional[str] = Field(None, description="Target audience")
    platforms: Optional[List[str]] = Field(None, description="Platforms to publish on")
    core_message: Optional[str] = Field(None, description="Core marketing message")
    post_type: Optional[str] = Field(None, description="Type of post")
    primary_caption: Optional[str] = Field(None, description="Main caption text")
    call_to_action: Optional[str] = Field(None, description="Call to action phrase")
    hashtag_block: Optional[List[str]] = Field(None, description="Hashtags")
    published: Optional[bool] = Field(None, description="Published state")


@router.patch("/content/{content_id}", response_model=ContentItem)
async def patch_content_item(
    content_id: uuid.UUID,
    patch_data: MarketingPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Partially update a persisted marketing content item.

    Only fields explicitly provided in the request body are updated;
    omitted fields retain their current values.
    """
    record = await _get_or_404(content_id, db)

    update_dict = patch_data.model_dump(exclude_unset=True)

    if "hashtag_block" in update_dict:
        _validate_branded_hashtag(update_dict["hashtag_block"])

    platforms = update_dict.get("platforms")
    if platforms is not None:
        hashtag_block = update_dict.get("hashtag_block", record.hashtag_block or [])
        _validate_platform_limits(platforms, hashtag_block)

    _EDITABLE_FIELDS = (
        "campaign_name",
        "objective",
        "audience",
        "platforms",
        "core_message",
        "post_type",
        "primary_caption",
        "call_to_action",
        "hashtag_block",
        "published",
    )
    for field_name in _EDITABLE_FIELDS:
        if field_name in update_dict:
            setattr(record, field_name, update_dict[field_name])

    await db.commit()
    await db.refresh(record)
    return _serialize(record)


@router.post("/content/{content_id}/publish", response_model=ContentItem)
async def publish_content_item(
    content_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a persisted content item as published."""
    record = await _get_or_404(content_id, db)
    record.published = True
    await db.commit()
    await db.refresh(record)
    return _serialize(record)


@router.delete("/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_item(
    content_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a persisted marketing content item (404 when it does not exist)."""
    record = await _get_or_404(content_id, db)
    await db.delete(record)
    await db.commit()
