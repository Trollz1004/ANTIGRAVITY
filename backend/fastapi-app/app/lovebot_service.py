"""LoveBot service for premium love consultation features."""

import random
from datetime import date


class LoveBotService:
    def __init__(self):
        self.quotes = [
            {
                "text": "The best thing to hold onto in life is each other.",
                "author": "Audrey Hepburn",
                "category": "cute",
            },
            {
                "text": "Love is composed of a single soul inhabiting two bodies.",
                "author": "Aristotle",
                "category": "deep",
            },
            {
                "text": "To love and be loved is to feel the sun from both sides.",
                "author": "David Viscott",
                "category": "cute",
            },
            {
                "text": "Where there is love there is life.",
                "author": "Mahatma Gandhi",
                "category": "aphorism",
            },
            {
                "text": "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
                "author": "Unknown",
                "category": "advice",
            },
        ]

        self.pickup_lines = [
            "Are you a magician? Because whenever I look at you, everyone else disappears!",
            "I'm not a photographer, but I can definitely picture us together.",
            "Do you have a map? I just got lost in your eyes.",
            "Is your name Google? Because you have everything I've been searching for.",
            "Are you French? Because Eiffel for you.",
        ]

        self.tips = {
            "attracting_partners_feminine": [
                "Be yourself and be confident, but not arrogant.",
                "Listen more than you talk.",
                "Originality is better than common pickup lines.",
                "Focus on shared interests.",
            ],
            "attracting_partners_masculine": [
                "Show genuine interest in his passions.",
                "Be direct but maintain a bit of mystery.",
                "Smile and make eye contact.",
                "Ask open-ended questions.",
            ],
            "attracting_partners_neutral": [
                "Respect boundaries and prioritize clear communication.",
                "Show genuine curiosity in what makes them unique.",
                "Emotional availability is the ultimate aphrodisiac.",
                "Authenticity always wins over performing.",
            ],
            "first_kiss": [
                "Watch for body language cues.",
                "Keep it brief and gentle at first.",
                "Fresh breath is key!",
                "Choose a comfortable, private moment.",
            ],
        }

    def get_random_quote(self, category: str | None = None) -> dict:
        if category:
            filtered = [q for q in self.quotes if q["category"] == category]
            if filtered:
                return random.choice(filtered)
        return random.choice(self.quotes)

    def get_random_pickup_line(self) -> str:
        return random.choice(self.pickup_lines)

    def calculate_compatibility(self, name1: str, name2: str) -> dict:
        """Simple name-based compatibility algorithm."""
        combined = name1.strip().lower() + name2.strip().lower()
        score = sum(ord(c) for c in combined) % 101

        if score > 80:
            message = "A match made in heaven! Your energies are perfectly aligned."
        elif score > 60:
            message = "Great potential! There's a strong connection here."
        elif score > 40:
            message = "A solid foundation to build upon. Communication will be key."
        else:
            message = (
                "Opposites attract, but it might take some work to find common ground."
            )

        return {"score": score, "message": message}

    def calculate_birthday_match(self, dob1: date, dob2: date) -> dict:
        """Simple birthday-based affinity."""
        # Use days difference mod 101 for a stable score
        diff = abs((dob1 - dob2).days)
        score = 100 - (diff % 101)

        return {
            "score": score,
            "message": (
                "Astrological alignment analysis complete."
                if score > 50
                else "The stars suggest a journey of discovery."
            ),
        }

    def get_gift_ideas(self, recipient: str = "neutral") -> list[str]:
        if recipient == "feminine":
            return [
                "A personalized photo album of shared memories.",
                "A spa day or relaxation kit.",
                "Jewelry with a meaningful engraving.",
                "A surprise weekend getaway.",
                "A handwritten letter expressing your feelings.",
            ]
        elif recipient == "masculine":
            return [
                "A high-quality watch or tech gadget.",
                "A custom leather wallet or bag.",
                "Tickets to a game or concert.",
                "A cooking or hobby-related workshop experience.",
                "A framed map of where you first met.",
            ]
        return [
            "An interactive experience class (cooking, pottery, art).",
            "A customized star map of a significant date.",
            "High-end matching comfort wear (like luxury robes).",
            "A surprise weekend getaway trip.",
            "An adventure or concert you can both enjoy.",
        ]


lovebot_service = LoveBotService()
