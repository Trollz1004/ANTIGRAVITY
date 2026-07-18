"""Link Forge — affiliate link generation, tracking, and redirect."""

import logging
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.error_responses import bad_request, not_found
from app.link_forge import forge_link
from app.models import AffiliateClick, AffiliateConversion, AffiliateLink, User
from app.schemas import (
    AffiliateApprovedLinkRow,
    AffiliateApprovedLinksDoc,
    AffiliateChannelGenerateRequest,
    AffiliateClickResponse,
    AffiliateConversionResponse,
    AffiliateForgedLinkResponse,
    AffiliateLinkCreateRequest,
    AffiliateLinkResponse,
    AffiliateStatsResponse,
)

logger = logging.getLogger("youandinotai.api.affiliates")
settings = get_settings()

router = APIRouter(prefix="/affiliate", tags=["affiliate"])


def _generate_short_code() -> str:
    return secrets.token_urlsafe(8)


@router.post("/links", response_model=AffiliateLinkResponse, status_code=201)
async def create_affiliate_link(
    payload: AffiliateLinkCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new trackable affiliate link with a unique short code."""
    existing = await db.scalar(
        select(AffiliateLink).where(AffiliateLink.short_code == _generate_short_code())
    )
    short_code = _generate_short_code()
    while existing is not None:
        short_code = _generate_short_code()
        existing = await db.scalar(
            select(AffiliateLink).where(AffiliateLink.short_code == short_code)
        )

    link = AffiliateLink(
        id=uuid.uuid4(),
        affiliate_id=payload.affiliate_id,
        user_id=current_user.id,
        campaign=payload.campaign,
        destination_url=payload.destination_url,
        short_code=short_code,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        utm_term=payload.utm_term,
        utm_content=payload.utm_content,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    response = AffiliateLinkResponse.model_validate(link)
    response.short_url = f"{settings.app_url}/api/v1/affiliate/r/{short_code}"
    return response


@router.get("/links", response_model=list[AffiliateLinkResponse])
async def list_affiliate_links(
    campaign: str | None = Query(None, max_length=100),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List affiliate links owned by the current user."""
    stmt = select(AffiliateLink).where(AffiliateLink.user_id == current_user.id)
    if campaign:
        stmt = stmt.where(AffiliateLink.campaign == campaign)
    if active_only:
        stmt = stmt.where(AffiliateLink.active == True)
    stmt = stmt.order_by(AffiliateLink.created_at.desc())

    results = await db.scalars(stmt)
    links = results.all()

    resp = []
    for link in links:
        item = AffiliateLinkResponse.model_validate(link)
        item.short_url = f"{settings.app_url}/api/v1/affiliate/r/{link.short_code}"
        resp.append(item)
    return resp


@router.get("/links/{link_id}", response_model=AffiliateLinkResponse)
async def get_affiliate_link(
    link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific affiliate link."""
    link = await db.scalar(
        select(AffiliateLink).where(
            AffiliateLink.id == link_id, AffiliateLink.user_id == current_user.id
        )
    )
    if not link:
        raise not_found("Affiliate link not found")

    response = AffiliateLinkResponse.model_validate(link)
    response.short_url = f"{settings.app_url}/api/v1/affiliate/r/{link.short_code}"
    return response


@router.get("/r/{short_code}", status_code=302)
async def affiliate_redirect(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Redirect an affiliate short URL and record the click."""
    link = await db.scalar(
        select(AffiliateLink).where(
            AffiliateLink.short_code == short_code, AffiliateLink.active == True
        )
    )
    if not link:
        raise not_found("Affiliate link not found or inactive")

    click = AffiliateClick(
        id=uuid.uuid4(),
        link_id=link.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        referer=request.headers.get("referer"),
    )
    db.add(click)

    link.click_count = AffiliateLink.click_count + 1

    await db.commit()

    from fastapi.responses import RedirectResponse

    return RedirectResponse(url=link.destination_url, status_code=302)


@router.get("/links/{link_id}/clicks", response_model=list[AffiliateClickResponse])
async def list_affiliate_clicks(
    link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List clicks for a specific affiliate link."""
    link = await db.scalar(
        select(AffiliateLink).where(
            AffiliateLink.id == link_id, AffiliateLink.user_id == current_user.id
        )
    )
    if not link:
        raise not_found("Affiliate link not found")

    results = await db.scalars(
        select(AffiliateClick)
        .where(AffiliateClick.link_id == link_id)
        .order_by(AffiliateClick.created_at.desc())
        .limit(500)
    )
    return [AffiliateClickResponse.model_validate(c) for c in results.all()]


@router.get(
    "/links/{link_id}/conversions", response_model=list[AffiliateConversionResponse]
)
async def list_affiliate_conversions(
    link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List conversions attributed to a specific affiliate link."""
    link = await db.scalar(
        select(AffiliateLink).where(
            AffiliateLink.id == link_id, AffiliateLink.user_id == current_user.id
        )
    )
    if not link:
        raise not_found("Affiliate link not found")

    results = await db.scalars(
        select(AffiliateConversion)
        .where(AffiliateConversion.link_id == link_id)
        .order_by(AffiliateConversion.created_at.desc())
        .limit(500)
    )
    return [AffiliateConversionResponse.model_validate(c) for c in results.all()]


@router.get("/stats", response_model=AffiliateStatsResponse)
async def affiliate_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate statistics for all affiliate links owned by the current user."""
    total_links = await db.scalar(
        select(sa_func.count(AffiliateLink.id)).where(
            AffiliateLink.user_id == current_user.id
        )
    )

    total_clicks = await db.scalar(
        select(sa_func.coalesce(sa_func.sum(AffiliateLink.click_count), 0)).where(
            AffiliateLink.user_id == current_user.id
        )
    )

    total_conversions = await db.scalar(
        select(sa_func.count(AffiliateConversion.id)).where(
            AffiliateConversion.link_id.in_(
                select(AffiliateLink.id).where(
                    AffiliateLink.user_id == current_user.id
                )
            )
        )
    )

    total_revenue = await db.scalar(
        select(sa_func.coalesce(sa_func.sum(AffiliateConversion.revenue_cents), 0)).where(
            AffiliateConversion.link_id.in_(
                select(AffiliateLink.id).where(
                    AffiliateLink.user_id == current_user.id
                )
            )
        )
    )

    total_commission = await db.scalar(
        select(
            sa_func.coalesce(sa_func.sum(AffiliateConversion.commission_cents), 0)
        ).where(
            AffiliateConversion.link_id.in_(
                select(AffiliateLink.id).where(
                    AffiliateLink.user_id == current_user.id
                )
            )
        )
    )

    total_links = total_links or 0
    total_clicks = total_clicks or 0
    total_conversions = total_conversions or 0
    total_revenue = total_revenue or 0
    total_commission = total_commission or 0
    conversion_rate = (
        round(total_conversions / total_clicks, 4) if total_clicks > 0 else 0.0
    )

    return AffiliateStatsResponse(
        total_links=total_links,
        total_clicks=total_clicks,
        total_conversions=total_conversions,
        total_revenue_cents=total_revenue,
        total_commission_cents=total_commission,
        conversion_rate=conversion_rate,
    )


@router.post("/generate", response_model=AffiliateForgedLinkResponse)
async def generate_channel_link(
    payload: AffiliateChannelGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a channel-specific affiliate link with UTM parameters and copy."""
    try:
        forged = forge_link(
            channel=payload.channel,
            ref_id=payload.ref_id,
            campaign=payload.campaign,
            term=payload.term,
            content=payload.content,
        )
    except ValueError as exc:
        raise bad_request(str(exc))

    return AffiliateForgedLinkResponse(
        channel=forged.channel,
        destination_url=forged.destination_url,
        utm_source=forged.utm_source,
        utm_medium=forged.utm_medium,
        utm_campaign=forged.utm_campaign,
        utm_term=forged.utm_term,
        utm_content=forged.utm_content,
        purpose=forged.purpose,
        presentation_copy=forged.presentation_copy,
    )


@router.post("/links/{link_id}/approve", response_model=AffiliateLinkResponse)
async def approve_affiliate_link(
    link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve an affiliate link (board/admin action). Links must be approved before going live."""
    link = await db.scalar(
        select(AffiliateLink).where(AffiliateLink.id == link_id)
    )
    if not link:
        raise not_found("Affiliate link not found")

    link.approved = True
    link.approved_at = datetime.now(timezone.utc)
    link.approved_by = current_user.id
    await db.commit()
    await db.refresh(link)

    response = AffiliateLinkResponse.model_validate(link)
    response.short_url = f"{settings.app_url}/api/v1/affiliate/r/{link.short_code}"
    return response


@router.get("/approved-links", response_model=AffiliateApprovedLinksDoc)
async def get_approved_links_doc(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate the APPROVED LINKS document consumed by the Marketing-CMO daily routine.
    
    Returns one row per approved link: channel inferred from utm_source, full URL,
    purpose (campaign), date approved, short code, and click count.
    """
    stmt = (
        select(AffiliateLink)
        .where(AffiliateLink.approved == True)
        .order_by(AffiliateLink.approved_at.desc().nullslast(), AffiliateLink.created_at.desc())
    )
    results = await db.scalars(stmt)
    links = results.all()

    rows = []
    for link in links:
        short_url = f"{settings.app_url}/api/v1/affiliate/r/{link.short_code}"
        rows.append(
            AffiliateApprovedLinkRow(
                channel=link.utm_source or "direct",
                url=short_url,
                purpose=link.campaign,
                date_approved=link.approved_at,
                short_code=link.short_code,
                campaign=link.campaign,
                click_count=link.click_count,
            )
        )

    return AffiliateApprovedLinksDoc(
        generated_at=datetime.now(timezone.utc),
        total_links=len(rows),
        links=rows,
    )
