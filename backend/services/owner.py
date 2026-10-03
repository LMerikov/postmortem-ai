"""
Anonymous ownership for postmortems.

The browser generates a random client ID once, keeps it in localStorage and
sends it in the X-Client-Id header. The server never stores the raw ID: it
keeps a SHA-256 hash, so a database leak does not expose working IDs.

This is not authentication. It scopes history, deletion and the similarity
cache to one browser so visitors never see each other's incidents.
"""
import hashlib
import re

from flask import request

HEADER = "X-Client-Id"
_VALID_ID = re.compile(r"^[A-Za-z0-9-]{16,128}$")


def owner_hash_from_request() -> str | None:
    """Return the hashed owner for the current request, or None if absent/invalid."""
    raw = request.headers.get(HEADER, "").strip()
    if not _VALID_ID.match(raw):
        return None
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
