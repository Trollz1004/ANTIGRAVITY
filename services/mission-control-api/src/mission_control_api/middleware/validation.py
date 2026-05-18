"""
Request validation middleware for Mission Control API (OPU-32).

Provides a reusable validate_request() decorator/factory that validates
incoming JSON request bodies against Pydantic schemas and returns
proper 400 errors with detailed validation messages.

Applied to POST/PUT/PATCH routes that accept user input.

Usage:
    from mission_control_api.middleware.validation import validate_request

    @router.post("/items")
    @validate_request(CreateItemSchema)
    async def create_item(payload: CreateItemSchema):
        ...

Design decisions:
    - Uses Pydantic for schema validation (already in use in the project)
    - Returns 400 with detailed field-level error messages
    - Logs validation failures via structured logger
    - Pure decorator pattern — minimal changes to existing routes
"""

from __future__ import annotations

import functools
from typing import Any, Callable, Optional, Type

from fastapi import HTTPException, Request
from pydantic import BaseModel, ValidationError

from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)


def validate_request(schema_cls: Type[BaseModel]) -> Callable:
    """
    Decorator factory that validates the request body against a Pydantic schema.

    Usage:
        @router.post("/tasks/dispatch")
        @validate_request(TaskBrief)
        async def dispatch(payload: TaskBrief):
            ...

    The decorator:
      1. Parses the request body as JSON
      2. Validates it against the provided Pydantic schema
      3. On success: passes the validated model as `payload` kwarg
      4. On failure: returns 400 with field-level error details
    """

    def decorator(endpoint: Callable) -> Callable:
        @functools.wraps(endpoint)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Find the Request object in args/kwargs
            request: Optional[Request] = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                logger.error(
                    "validate_request: no Request object found in endpoint args",
                    extra={"endpoint": endpoint.__name__},
                )
                raise HTTPException(
                    status_code=500,
                    detail="Internal error: could not access request object",
                )

            # Read and validate the body
            try:
                body = await request.body()
                if not body:
                    raise HTTPException(
                        status_code=400,
                        detail="Request body is required",
                    )
                payload = schema_cls.model_validate_json(body)
            except ValidationError as exc:
                errors = []
                for err in exc.errors():
                    field = ".".join(str(loc) for loc in err["loc"])
                    errors.append(
                        {
                            "field": field,
                            "message": err["msg"],
                            "type": err["type"],
                        }
                    )
                logger.info(
                    "request validation failed",
                    extra={
                        "path": request.url.path,
                        "method": request.method,
                        "errors": errors,
                    },
                )
                raise HTTPException(
                    status_code=400,
                    detail={"message": "Validation failed", "errors": errors},
                )
            except HTTPException:
                raise
            except Exception as exc:
                logger.error(
                    "validate_request: unexpected error",
                    exc_info=True,
                    extra={"path": request.url.path},
                )
                raise HTTPException(
                    status_code=400,
                    detail="Invalid request body",
                )

            # Pass the validated payload
            kwargs["payload"] = payload
            return await endpoint(*args, **kwargs)

        return wrapper

    return decorator


def validate_query(schema_cls: Type[BaseModel]) -> Callable:
    """
    Decorator factory that validates query parameters against a Pydantic schema.

    Usage:
        @router.get("/items")
        @validate_query(ListItemsQuery)
        async def list_items(payload: ListItemsQuery):
            ...
    """

    def decorator(endpoint: Callable) -> Callable:
        @functools.wraps(endpoint)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            request: Optional[Request] = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                raise HTTPException(
                    status_code=500,
                    detail="Internal error: could not access request object",
                )

            try:
                query_dict = dict(request.query_params)
                payload = schema_cls.model_validate(query_dict)
            except ValidationError as exc:
                errors = []
                for err in exc.errors():
                    field = ".".join(str(loc) for loc in err["loc"])
                    errors.append(
                        {
                            "field": field,
                            "message": err["msg"],
                            "type": err["type"],
                        }
                    )
                raise HTTPException(
                    status_code=400,
                    detail={"message": "Query validation failed", "errors": errors},
                )

            kwargs["payload"] = payload
            return await endpoint(*args, **kwargs)

        return wrapper

    return decorator
