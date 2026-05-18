"""Shared utility helpers for the FastAPI application."""


def patch_model(db_model, pydantic_model, fields: set[str] | None = None):
    """Apply only explicitly-set fields from a Pydantic model to a SQLAlchemy model.

    Args:
        db_model:      The SQLAlchemy ORM instance to mutate in-place.
        pydantic_model: The Pydantic request model whose ``model_fields_set``
                        tracks which fields were explicitly provided by the caller.
        fields:         Optional explicit set of field names to apply.  When *None*
                        (the default) ``pydantic_model.model_fields_set`` is used.

    Example::

        patch_model(profile, payload)
        # Only fields the caller sent in the JSON body are written.
    """
    if fields is None:
        fields = pydantic_model.model_fields_set
    for field in fields:
        if hasattr(db_model, field):
            setattr(db_model, field, getattr(pydantic_model, field))
