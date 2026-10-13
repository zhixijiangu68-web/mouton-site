from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

JST = timezone(timedelta(hours=9))

@dataclass(frozen=True)
class Bar:
    start: datetime
    end: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal


def session(t):
    h = t.astimezone(JST).hour
    if 10 <= h < 11:
        return '10-11'
    if 16 <= h < 18:
        return '16-18'
    if h >= 22 or h < 1:
        return '22-01'
    return 'outside'
