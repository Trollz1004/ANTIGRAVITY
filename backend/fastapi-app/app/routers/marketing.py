"""Marketing automation and AI agent content integration router."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/marketing", tags=["marketing"])

# Core branded hashtags
BRANDED_HASHTAGS = {
    "primary": "#YouAndINotAI",
    "themes": [
        "#AIDoesItAll",
        "#AISolutionsStore",
        "#DateWithPurpose",
        "#LoveFundsKids",
        "#DatingApp",
        "#AIForGood",
        "#CharityTech",
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
        schema_extra = {
            "example": {
                "campaign_name": "SpringVolunteerDrive",
                "objective": "Recruit volunteers for community garden project",
                "audience": "Environmentally conscious singles",
                "platforms": ["instagram", "facebook"],
                "core_message": "Join our community garden project and make a difference!",
                "post_type": "story",
                "primary_caption": "Looking to make a real impact this spring? Join our community garden project where you can meet like-minded people while contributing to a greener future. #YouAndINotAI #AIForGood #DateWithPurpose",
                "call_to_action": "Sign up now",
                "hashtag_block": [
                    "#YouAndINotAI",
                    "#AIForGood",
                    "#DateWithPurpose",
                    "#EcoLove",
                    "#CommunityGarden",
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


@router.get("/content", response_model=List[ContentItem])
async def list_content_items(current_user: User = Depends(get_current_user)):
    """
    List all marketing content items.
    """
    # In a real implementation, this would fetch from database
    return []


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
    Update a marketing content item.
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
