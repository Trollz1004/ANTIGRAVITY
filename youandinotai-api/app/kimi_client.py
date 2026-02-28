"""Kimi (Kilocode) API client for AI matching and analysis."""

import httpx
from app.config import get_settings

settings = get_settings()


class KimiClient:
    """Kimi API client for matching algorithm and user profile analysis."""

    def __init__(self):
        self.api_key = settings.kimi_api_key
        self.model = settings.kimi_model
        self.base_url = "https://api.moonshot.cn/v1"
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {self.api_key}"}
        )

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def analyze_profile(self, user_data: dict) -> dict:
        """
        Analyze user profile for matching insights.
        
        Args:
            user_data: User profile data (bio, interests, etc.)
            
        Returns:
            Analysis result with key traits and preferences
        """
        if not self.api_key:
            return {"error": "Kimi API key not configured"}

        prompt = f"""Analyze this dating profile and extract key traits, interests, and relationship goals:

Bio: {user_data.get('bio', '')}
Age: {user_data.get('age', '')}
Interests: {user_data.get('interests', '')}
Location: {user_data.get('location', '')}

Provide a JSON response with: traits (list), interests (list), personality_type (str), relationship_goal (str), compatibility_factors (list)"""

        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {"status": "success", "analysis": content}
        except Exception as e:
            return {"error": f"Kimi analysis failed: {str(e)}"}

    async def calculate_compatibility(
        self, user1_profile: dict, user2_profile: dict
    ) -> dict:
        """
        Calculate compatibility score between two users.
        
        Args:
            user1_profile: First user's profile
            user2_profile: Second user's profile
            
        Returns:
            Compatibility score (0-100) and explanation
        """
        if not self.api_key:
            return {"error": "Kimi API key not configured"}

        prompt = f"""Calculate compatibility between these two dating profiles on a scale of 0-100.

User 1:
Bio: {user1_profile.get('bio', '')}
Interests: {user1_profile.get('interests', '')}
Goal: {user1_profile.get('relationship_goal', '')}

User 2:
Bio: {user2_profile.get('bio', '')}
Interests: {user2_profile.get('interests', '')}
Goal: {user2_profile.get('relationship_goal', '')}

Respond with JSON: {{
  "score": <0-100>,
  "reason": "<brief explanation>",
  "strengths": ["<similarity>", ...],
  "challenges": ["<potential issue>", ...]
}}"""

        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {"status": "success", "compatibility": content}
        except Exception as e:
            return {"error": f"Compatibility calculation failed: {str(e)}"}


# Singleton instance
_kimi_client = None


def get_kimi_client() -> KimiClient:
    """Get or create Kimi client instance."""
    global _kimi_client
    if _kimi_client is None:
        _kimi_client = KimiClient()
    return _kimi_client
