"""Link Forge — channel-specific affiliate link generation and formatting.

Each channel has a builder that produces a properly formatted URL with
appropriate UTM parameters and channel-specific presentation copy.
"""

from dataclasses import dataclass
from urllib.parse import urlencode, urlparse, urlunparse

from app.config import get_settings

settings = get_settings()
BASE_URL = settings.app_url


@dataclass
class ForgedLink:
    """A fully built affiliate link ready for its channel."""

    channel: str
    destination_url: str
    utm_source: str
    utm_medium: str
    utm_campaign: str
    utm_term: str | None
    utm_content: str | None
    purpose: str
    presentation_copy: str


def _append_utm(url: str, params: dict[str, str | None]) -> str:
    parsed = urlparse(url)
    existing = dict(qp.split("=", 1) for qp in parsed.query.split("&") if qp)
    for k, v in params.items():
        if v is not None:
            existing[k] = v
    new_query = urlencode(existing)
    return urlunparse(parsed._replace(query=new_query))


def build_youtube_link(
    ref_id: str,
    campaign: str = "youtube-creator-outreach",
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    url = _append_utm(BASE_URL, {
        "utm_source": "youtube",
        "utm_medium": "video-description",
        "utm_campaign": campaign,
        "utm_term": term,
        "utm_content": content,
        "ref": ref_id,
    })
    return ForgedLink(
        channel="youtube",
        destination_url=url,
        utm_source="youtube",
        utm_medium="video-description",
        utm_campaign=campaign,
        utm_term=term,
        utm_content=content,
        purpose="YouTube creator outreach — link in video description",
        presentation_copy=(
            f"🔗 Sign up at YouAndINotAI: {url}\n\n"
            "Verified profiles, real conversations. "
            "Bot-Shield verified members, prompt-first matching."
        ),
    )


def build_x_link(
    ref_id: str,
    campaign: str = "x-social",
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    url = _append_utm(BASE_URL, {
        "utm_source": "x",
        "utm_medium": "social-post",
        "utm_campaign": campaign,
        "utm_term": term,
        "utm_content": content,
        "ref": ref_id,
    })
    return ForgedLink(
        channel="x",
        destination_url=url,
        utm_source="x",
        utm_medium="social-post",
        utm_campaign=campaign,
        utm_term=term,
        utm_content=content,
        purpose="X.com social post — tweet with affiliate link",
        presentation_copy=(
            f"Verified profiles. Real conversations. No bots.\n\n"
            f"{url}\n\n"
            "#YouAndINotAI #BotShield"
        ),
    )


def build_facebook_link(
    ref_id: str,
    campaign: str = "facebook-social",
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    url = _append_utm(BASE_URL, {
        "utm_source": "facebook",
        "utm_medium": "social-post",
        "utm_campaign": campaign,
        "utm_term": term,
        "utm_content": content,
        "ref": ref_id,
    })
    return ForgedLink(
        channel="facebook",
        destination_url=url,
        utm_source="facebook",
        utm_medium="social-post",
        utm_campaign=campaign,
        utm_term=term,
        utm_content=content,
        purpose="Facebook post — share with friends and groups",
        presentation_copy=(
            f"Tired of bots and fake profiles? YouAndINotAI verifies every member. "
            f"Real people, prompt-first matching, zero bots.\n\n{url}"
        ),
    )


def build_threads_link(
    ref_id: str,
    campaign: str = "threads-social",
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    url = _append_utm(BASE_URL, {
        "utm_source": "threads",
        "utm_medium": "social-post",
        "utm_campaign": campaign,
        "utm_term": term,
        "utm_content": content,
        "ref": ref_id,
    })
    return ForgedLink(
        channel="threads",
        destination_url=url,
        utm_source="threads",
        utm_medium="social-post",
        utm_campaign=campaign,
        utm_term=term,
        utm_content=content,
        purpose="Threads post — short-form content with link",
        presentation_copy=(
            f"Finally, a dating app that verifies everyone.\n\n{url}"
        ),
    )


def build_blog_link(
    ref_id: str,
    campaign: str = "blog-content",
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    url = _append_utm(BASE_URL, {
        "utm_source": "blog",
        "utm_medium": "referral-post",
        "utm_campaign": campaign,
        "utm_term": term,
        "utm_content": content,
        "ref": ref_id,
    })
    return ForgedLink(
        channel="blog",
        destination_url=url,
        utm_source="blog",
        utm_medium="referral-post",
        utm_campaign=campaign,
        utm_term=term,
        utm_content=content,
        purpose="Blog or newsletter post — editorial recommendation",
        presentation_copy=(
            f"[Try YouAndINotAI — Bot-Shield verified dating]"
            f"({url})\n\n"
            "Prompt-first matching with verified humans. No bots, no fakes."
        ),
    )


CHANNEL_BUILDERS: dict[str, callable] = {
    "youtube": build_youtube_link,
    "x": build_x_link,
    "facebook": build_facebook_link,
    "threads": build_threads_link,
    "blog": build_blog_link,
}


def forge_link(
    channel: str,
    ref_id: str,
    campaign: str | None = None,
    term: str | None = None,
    content: str | None = None,
) -> ForgedLink:
    """Generate a channel-specific affiliate link.

    Raises ValueError if the channel is not supported.
    """
    builder = CHANNEL_BUILDERS.get(channel)
    if not builder:
        raise ValueError(
            f"Unsupported channel '{channel}'. Supported: {', '.join(CHANNEL_BUILDERS)}"
        )
    return builder(ref_id, campaign=campaign or f"{channel}-affiliate", term=term, content=content)
