"""Bounded per-process limits. Use a shared limiter before adding API replicas."""
import time
from collections import deque
from threading import Lock
from fastapi import HTTPException

_windows = {}
_lock = Lock()


def enforce_limit(key, limit, seconds):
    now = time.monotonic()
    with _lock:
        if len(_windows) > 10000:
            for old_key, (expires, _) in list(_windows.items()):
                if expires <= now:
                    del _windows[old_key]
            if len(_windows) > 10000:
                raise HTTPException(429, 'Demasiadas solicitudes; reintenta después')
        expires, attempts = _windows.get(key, (now + seconds, deque()))
        if expires <= now:
            expires, attempts = now + seconds, deque()
        if len(attempts) >= limit:
            raise HTTPException(429, 'Demasiados intentos; reintenta después', headers={'Retry-After': str(max(1, int(expires-now)))})
        attempts.append(now)
        _windows[key] = expires, attempts
