"""Matching API endpoints using Kimi AI."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.kimi_client import get_kimi_client

router = APIRouter(prefix="/matches", tags=["matches"])


@router.post("/analyze/{user_id}")
async def analyze_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    kimi = Depends(get_kimi_client),
):
    """Analyze user profile for matching insights using Kimi AI."""
    try:
        # TODO: Fetch user profile from database
        # user = await db.get(User, user_id)
        # if not user:
        #     raise HTTPException(status_code=404, detail="User not found")

        user_data = {
            "bio": "Sample bio",
            "age": 28,
            "interests": "Travel, music, cooking",
            "location": "San Francisco, CA",
        }

        analysis = await kimi.analyze_profile(user_data)
        return {"user_id": user_id, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/compatibility")
async def calculate_compatibility(
    user1_id: str,
    user2_id: str,
    db: AsyncSession = Depends(get_db),
    kimi = Depends(get_kimi_client),
):
    """Calculate compatibility between two users using Kimi AI."""
    try:
        # TODO: Fetch both user profiles from database
        # user1 = await db.get(User, user1_id)
        # user2 = await db.get(User, user2_id)

        user1_profile = {
            "bio": "User 1 bio",
            "interests": "Travel, reading",
            "relationship_goal": "Long-term",
        }
        user2_profile = {
            "bio": "User 2 bio",
            "interests": "Travel, fitness",
            "relationship_goal": "Long-term",
        }

        compatibility = await kimi.calculate_compatibility(user1_profile, user2_profile)
        return {
            "user1_id": user1_id,
            "user2_id": user2_id,
            "compatibility": compatibility,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")
