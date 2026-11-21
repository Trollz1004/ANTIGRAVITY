"""Social boards router — posts, comments, likes."""

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_verified_profile
from app.config import get_settings
from app.database import get_db
from app.models import Board, Comment, Post, SupportTicket, User
from app.moderation import blocked_by_user_subquery, blocked_user_subquery
from app.schemas import (
    CommentCreateRequest,
    CommentResponse,
    PostCreateRequest,
    PostReportRequest,
    PostResponse,
)
from app.support_service import notify_support_ticket

router = APIRouter(prefix="/boards")

# Default boards created on first access
DEFAULT_BOARDS = [
    (
        "usa",
        "USA Group Chat",
        "Open to every verified member, anywhere in the country.",
    ),
    ("general", "General", "Chat about anything"),
    ("dating-tips", "Dating Tips", "Share your best dating advice"),
    ("success-stories", "Success Stories", "Celebrate your matches"),
    ("events", "Events & Meetups", "Find local events"),
    ("volunteering", "Volunteering", "Find local volunteer opportunities"),
]


async def _ensure_boards(db: AsyncSession) -> None:
    """Create default boards if they don't exist."""
    existing_slugs = set((await db.scalars(select(Board.slug))).all())
    added = False
    for slug, name, desc in DEFAULT_BOARDS:
        if slug not in existing_slugs:
            db.add(Board(id=uuid.uuid4(), name=name, description=desc, slug=slug))
            added = True
    if added:
        await db.commit()


@router.get("")
async def list_boards(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_boards(db)
    boards = (
        await db.scalars(
            select(Board).order_by(
                case((Board.slug == "usa", 0), else_=1),
                Board.name,
            )
        )
    ).all()
    return [
        {"slug": b.slug, "name": b.name, "description": b.description} for b in boards
    ]


@router.get("/{slug}/posts", response_model=list[PostResponse])
async def list_posts(
    slug: str,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = 0,
    order: Literal["asc", "desc"] = Query(default="desc"),
) -> list[PostResponse]:
    await _ensure_boards(db)
    board = await db.scalar(select(Board).where(Board.slug == slug))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    blocked_by_me = blocked_by_user_subquery(user.id)
    blocked_me = blocked_user_subquery(user.id)

    # Join and filter on the author's verification and block status BEFORE
    # offset/limit -- filtering in Python after the SQL page was cut would
    # silently drop verified posts that fell past the page boundary once
    # legacy unverified or blocked posts were excluded, and neither board
    # client in the frontend advances `offset`, so those posts would become
    # permanently invisible instead of just reordered.
    created_order = Post.created_at.asc() if order == "asc" else Post.created_at.desc()
    rows = (
        await db.execute(
            select(Post, User)
            .join(User, User.id == Post.author_id)
            .where(
                Post.board_id == board.id,
                User.bot_shield_verified.is_(True),
                Post.author_id.notin_(blocked_by_me),
                Post.author_id.notin_(blocked_me),
            )
            .order_by(created_order)
            .offset(offset)
            .limit(limit)
        )
    ).all()

    return [
        PostResponse(
            id=post.id,
            board_slug=slug,
            author_id=post.author_id,
            author_name=author.display_name,
            title=post.title,
            body=post.body,
            like_count=post.like_count,
            created_at=post.created_at,
        )
        for post, author in rows
    ]


@router.post("/{slug}/posts", response_model=PostResponse, status_code=201)
async def create_post(
    slug: str,
    payload: PostCreateRequest,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    await _ensure_boards(db)
    board = await db.scalar(select(Board).where(Board.slug == slug))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=user.id,
        title=payload.title,
        body=payload.body,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return PostResponse(
        id=post.id,
        board_slug=slug,
        author_id=user.id,
        author_name=user.display_name,
        title=post.title,
        body=post.body,
        like_count=0,
        created_at=post.created_at,
    )


@router.get("/{slug}/posts/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    slug: str,
    post_id: uuid.UUID,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> list[CommentResponse]:
    blocked_by_me = blocked_by_user_subquery(user.id)
    blocked_me = blocked_user_subquery(user.id)
    comments = (
        await db.scalars(
            select(Comment)
            .where(
                Comment.post_id == post_id,
                Comment.author_id.notin_(blocked_by_me),
                Comment.author_id.notin_(blocked_me),
            )
            .order_by(Comment.created_at.asc())
        )
    ).all()

    results = []
    for comment in comments:
        author = await db.get(User, comment.author_id)
        if not author or not author.bot_shield_verified:
            continue
        results.append(
            CommentResponse(
                id=comment.id,
                author_id=comment.author_id,
                author_name=author.display_name,
                body=comment.body,
                created_at=comment.created_at,
            )
        )
    return results


@router.post(
    "/{slug}/posts/{post_id}/comments", response_model=CommentResponse, status_code=201
)
async def create_comment(
    slug: str,
    post_id: uuid.UUID,
    payload: CommentCreateRequest,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> CommentResponse:
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post_author = await db.get(User, post.author_id)
    if not post_author or not post_author.bot_shield_verified:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        id=uuid.uuid4(),
        post_id=post_id,
        author_id=user.id,
        body=payload.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        author_id=user.id,
        author_name=user.display_name,
        body=comment.body,
        created_at=comment.created_at,
    )


@router.post("/posts/{post_id}/report")
async def report_post(
    post_id: uuid.UUID,
    payload: PostReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author = await db.get(User, post.author_id)
    ticket = SupportTicket(
        id=uuid.uuid4(),
        user_id=user.id,
        status="open",
        category="safety",
        subject=f"Board post report: {post.title[:120]}",
        customer_email=user.email,
        customer_message=payload.details or payload.reason,
        bot_response="A board post safety report was submitted for moderation review.",
        escalation_reason=f"board_post:{payload.reason}",
        transcript=[
            {"role": "user", "content": payload.details or payload.reason},
            {
                "role": "system",
                "content": (
                    f"Reported board post {post.id} by "
                    f"{author.display_name if author else post.author_id}. "
                    f"reason={payload.reason}"
                ),
            },
        ],
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    await notify_support_ticket(ticket=ticket, user=user, settings=get_settings())

    return {"status": "reported", "post_id": str(post_id)}
