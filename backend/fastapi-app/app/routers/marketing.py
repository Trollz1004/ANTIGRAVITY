"""Marketing automation and AI agent content integration router."""

from datetime import datetime, timezone
from uuid import uuid4
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import TrackedMarketingLink, User

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

REFERRAL_KIT_DESTINATIONS = [
    ("YouAndINotAI", "https://youandinotai.com"),
    ("Business Exchange", "https://aidoesitall.website"),
    ("Antigravity Dashboard", "https://dashboard.aidoesitall.website"),
    ("OnlineRecycle", "https://onlinerecycle.org"),
    ("AI-Solutions Store", "https://ai-solutions.store"),
]


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
        schema_extra = {
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
    id: str
    title: str
    content: str
    tags: List[str]
    created_at: datetime
    published: bool


class ReferralKitRequest(BaseModel):
    campaign_name: str = Field(..., description="Name of the referral campaign")
    referral_code: Optional[str] = Field(None, description="Optional referral code")
    source: str = Field(default="affiliate", description="Tracking source")
    medium: str = Field(default="referral", description="Tracking medium")


class ReferralKitLink(BaseModel):
    surface_name: str
    destination_url: str
    tracked_url: str
    slug: str
    source: str
    medium: str
    campaign_name: str
    referral_code: Optional[str] = None
    click_count: int
    created_at: datetime


class ReferralKitResponse(BaseModel):
    campaign_name: str
    source: str
    medium: str
    referral_code: Optional[str] = None
    links: list[ReferralKitLink]


def _with_tracking_params(
    destination_url: str,
    *,
    source: str,
    medium: str,
    campaign_name: str,
    referral_code: str | None,
) -> str:
    parsed = urlparse(destination_url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["utm_source"] = source
    query["utm_medium"] = medium
    query["utm_campaign"] = campaign_name
    if referral_code:
        query["ref"] = referral_code
    return urlunparse(parsed._replace(query=urlencode(query)))


def _serialize_tracked_link(
    link: TrackedMarketingLink,
    request: Request,
) -> ReferralKitLink:
    tracked_url = str(request.url_for("resolve_tracked_link", slug=link.slug))
    return ReferralKitLink(
        surface_name=link.surface_name,
        destination_url=link.destination_url,
        tracked_url=tracked_url,
        slug=link.slug,
        source=link.source,
        medium=link.medium,
        campaign_name=link.campaign_name,
        referral_code=link.referral_code,
        click_count=link.click_count,
        created_at=link.created_at,
    )


@router.post("/content", response_model=ContentItem)
async def create_content_item(
    content: MarketingPost, current_user: User = Depends(get_current_user)
):
    """
    Create a new marketing content item from AI agent.

    This endpoint accepts structured content from AI agents and stores it for publishing.
    """
    # Validate that at least one branded hashtag is present
    branded_hashtags_present = any(
        tag in content.hashtag_block
        for tag in [BRANDED_HASHTAGS["primary"]] + BRANDED_HASHTAGS["themes"]
    )
    if not branded_hashtags_present:
        raise HTTPException(
            status_code=400, detail="At least one branded hashtag must be included"
        )

    # Validate platform hashtag counts
    for platform in content.platforms:
        if platform in PLATFORM_HASHTAG_LIMITS:
            hashtag_count = len(
                [tag for tag in content.hashtag_block if tag.startswith("#")]
            )
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

    # In a real implementation, this would save to database
    # For now, we'll just return a mock content item
    return ContentItem(
        id="mock-id-123",
        title=content.campaign_name,
        content=content.primary_caption,
        tags=content.hashtag_block,
        created_at=datetime.now(),
        published=False,
    )


@router.post("/referral-kit", response_model=ReferralKitResponse)
async def create_referral_kit(
    payload: ReferralKitRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReferralKitResponse:
    now = datetime.now(timezone.utc)
    links: list[ReferralKitLink] = []

    for surface_name, destination_url in REFERRAL_KIT_DESTINATIONS:
        slug = uuid4().hex[:12]
        link = TrackedMarketingLink(
            slug=slug,
            surface_name=surface_name,
            destination_url=destination_url,
            source=payload.source,
            medium=payload.medium,
            campaign_name=payload.campaign_name,
            referral_code=payload.referral_code,
            click_count=0,
            created_by_user_id=current_user.id,
            created_at=now,
        )
        db.add(link)
        await db.flush()
        links.append(_serialize_tracked_link(link, request))

    await db.commit()
    return ReferralKitResponse(
        campaign_name=payload.campaign_name,
        source=payload.source,
        medium=payload.medium,
        referral_code=payload.referral_code,
        links=links,
    )


@router.get("/content", response_model=List[ContentItem])
async def list_content_items(current_user: User = Depends(get_current_user)):
    """
    List all marketing content items.
    """
    # In a real implementation, this would fetch from database
    return []


@router.get("/tracked-links/{slug}", name="resolve_tracked_link")
async def resolve_tracked_link(slug: str, db: AsyncSession = Depends(get_db)):
    link = await db.scalar(
        select(TrackedMarketingLink).where(TrackedMarketingLink.slug == slug)
    )
    if link is None:
        raise HTTPException(status_code=404, detail="Tracked link not found")

    link.click_count += 1
    link.last_clicked_at = datetime.now(timezone.utc)
    await db.commit()

    redirect_url = _with_tracking_params(
        link.destination_url,
        source=link.source,
        medium=link.medium,
        campaign_name=link.campaign_name,
        referral_code=link.referral_code,
    )
    return RedirectResponse(url=redirect_url, status_code=307)


@router.get("/content/{content_id}", response_model=ContentItem)
async def get_content_item(
    content_id: str, current_user: User = Depends(get_current_user)
):
    """
    Get a specific marketing content item.
    """
    # In a real implementation, this would fetch from database
    # Returning mock content for now
    return ContentItem(
        id=content_id,
        title="Mock Content",
        content="This is mock content for demonstration purposes.",
        tags=["#YouAndINotAI"],
        created_at=datetime.now(),
        published=False,
    )


@router.put("/content/{content_id}", response_model=ContentItem)
async def update_content_item(
    content_id: str,
    content_update: MarketingPost,
    current_user: User = Depends(get_current_user),
):
    """
    Update a marketing content item (full replace).
    """
    # Validate content same as in create endpoint
    branded_hashtags_present = any(
        tag in content_update.hashtag_block
        for tag in [BRANDED_HASHTAGS["primary"]] + BRANDED_HASHTAGS["themes"]
    )
    if not branded_hashtags_present:
        raise HTTPException(
            status_code=400, detail="At least one branded hashtag must be included"
        )

    # In a real implementation, this would update in database
    # Returning mock content for now
    return ContentItem(
        id=content_id,
        title=content_update.campaign_name,
        content=content_update.primary_caption,
        tags=content_update.hashtag_block,
        created_at=datetime.now(),
        published=False,
    )


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


@router.patch("/content/{content_id}", response_model=ContentItem)
async def patch_content_item(
    content_id: str,
    patch_data: MarketingPostUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Partially update a marketing content item.
    Only fields explicitly provided in the request body are updated;
    omitted fields retain their current values.
    """
    # Fetch existing item (in production, from DB)
    existing = ContentItem(
        id=content_id,
        title="Mock Content",
        content="This is mock content for demonstration purposes.",
        tags=["#YouAndINotAI"],
        created_at=datetime.now(),
        published=False,
    )

    # Merge: only update fields that were explicitly set in the request
    update_dict = patch_data.model_dump(exclude_unset=True)

    # Merge hashtag_block with branded hashtag validation
    if "hashtag_block" in update_dict:
        branded_hashtags_present = any(
            tag in update_dict["hashtag_block"]
            for tag in [BRANDED_HASHTAGS["primary"]] + BRANDED_HASHTAGS["themes"]
        )
        if not branded_hashtags_present:
            raise HTTPException(
                status_code=400, detail="At least one branded hashtag must be included"
            )

    # Build updated item — only overwrite provided fields
    updated = ContentItem(
        id=content_id,
        title=update_dict.get("campaign_name", existing.title),
        content=update_dict.get("primary_caption", existing.content),
        tags=update_dict.get("hashtag_block", existing.tags),
        created_at=existing.created_at,
        published=existing.published,
    )

    return updated
