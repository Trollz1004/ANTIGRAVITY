"""LoveBot router for premium dating and relationship tools."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models import User
from app.schemas import (
    LoveBotCompatibilityRequest,
    LoveBotCompatibilityResponse,
    LoveBotQuoteResponse,
    LoveBotTipResponse,
    LoveBotGiftResponse
)
from app.lovebot_service import lovebot_service

router = APIRouter(prefix="/lovebot", tags=["LoveBot"])

async def get_premium_user(user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is a founding member or has an active subscription."""
    if not user.subscription_active:
        raise HTTPException(
            status_code=403,
            detail="LoveBot features require a Founding Member or Premium subscription."
        )
    return user

@router.post("/compatibility", response_model=LoveBotCompatibilityResponse)
async def check_compatibility(
    payload: LoveBotCompatibilityRequest,
    user: User = Depends(get_premium_user)
) -> LoveBotCompatibilityResponse:
    """Check name and optional birthday compatibility."""
    if payload.dob1 and payload.dob2:
        result = lovebot_service.calculate_birthday_match(payload.dob1, payload.dob2)
    else:
        result = lovebot_service.calculate_compatibility(payload.name1, payload.name2)
    
    return LoveBotCompatibilityResponse(
        score=result["score"],
        message=result["message"]
    )

@router.get("/quotes", response_model=LoveBotQuoteResponse)
async def get_love_quotes(
    category: str | None = None,
    user: User = Depends(get_premium_user)
) -> LoveBotQuoteResponse:
    """Get a random love quote or pickup line."""
    quote = lovebot_service.get_random_quote(category)
    return LoveBotQuoteResponse(
        text=quote["text"],
        author=quote["author"],
        category=quote["category"]
    )

@router.get("/tips", response_model=LoveBotTipResponse)
async def get_dating_tips(
    category: str = "pick_up_girls",
    user: User = Depends(get_premium_user)
) -> LoveBotTipResponse:
    """Get expert dating tips and lessons."""
    if category not in lovebot_service.tips:
        raise HTTPException(status_code=400, detail="Invalid tip category")
    
    return LoveBotTipResponse(
        category=category,
        tips=lovebot_service.tips[category]
    )

@router.get("/gifts", response_model=LoveBotGiftResponse)
async def get_gift_ideas(
    for_her: bool = True,
    user: User = Depends(get_premium_user)
) -> LoveBotGiftResponse:
    """Get personalized gift ideas for your soulmate."""
    ideas = lovebot_service.get_gift_ideas(for_her)
    return LoveBotGiftResponse(
        for_her=for_her,
        ideas=ideas
    )
