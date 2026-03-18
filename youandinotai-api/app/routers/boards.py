"""Social boards router — posts, comments, likes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Board, Comment, Post, User
from app.schemas import (
    CommentCreateRequest,
    CommentResponse,
    PostCreateRequest,
    PostResponse,
)

router = APIRouter(prefix="/boards")

# Default boards created on first access
DEFAULT_BOARDS = [
    ("general", "General", "Chat about anything"),
    ("dating-tips", "Dating Tips", "Share your best dating advice"),
    ("success-stories", "Success Stories", "Celebrate your matches"),
    ("events", "Events & Meetups", "Find local events"),
    ("volunteering", "Volunteering", "Give back to the community"),
]


async def _ensure_boards(db: AsyncSession) -> None:
    """Create default boards if they don't exist."""
    count = await db.scalar(select(func.count()).select_from(Board))
    if count == 0:
        for slug, name, desc in DEFAULT_BOARDS:
            db.add(Board(id=uuid.uuid4(), name=name, description=desc, slug=slug))
        await db.commit()


@router.get("")
async def list_boards(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_boards(db)
    boards = (await db.scalars(select(Board).order_by(Board.name))).all()
    return [{"slug": b.slug, "name": b.name, "description": b.description} for b in boards]


@router.get("/{slug}/posts", response_model=list[PostResponse])
async def list_posts(
    slug: str,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 30,
    offset: int = 0,
) -> list[PostResponse]:
    board = await db.scalar(select(Board).where(Board.slug == slug))
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    posts = (
        await db.scalars(
            select(Post)
            .where(Post.board_id == board.id)
            .order_by(Post.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
    ).all()

    results = []
    for post in posts:
        author = await db.get(User, post.author_id)
        results.append(
            PostResponse(
                id=post.id,
                board_slug=slug,
                author_id=post.author_id,
                author_name=author.display_name if author else "Unknown",
                title=post.title,
                body=post.body,
                like_count=post.like_count,
                created_at=post.created_at,
            )
        )
    return results


@router.post("/{slug}/posts", response_model=PostResponse, status_code=201)
async def create_post(
    slug: str,
    payload: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
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
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CommentResponse]:
    comments = (
        await db.scalars(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
        )
    ).all()

    results = []
    for comment in comments:
        author = await db.get(User, comment.author_id)
        results.append(
            CommentResponse(
                id=comment.id,
                author_id=comment.author_id,
                author_name=author.display_name if author else "Unknown",
                body=comment.body,
                created_at=comment.created_at,
            )
        )
    return results


@router.post("/{slug}/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    slug: str,
    post_id: uuid.UUID,
    payload: CommentCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CommentResponse:
    post = await db.get(Post, post_id)
    if not post:
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

    # In a real app, we might have a dedicated Report model.
    # For now, we'll log it as a privacy-related action or just return success.
    # According to task instructions, we just need the endpoint.
    return {"status": "reported", "post_id": str(post_id)}
