from datetime import timedelta
from .model import Bar, JST


def aggregate(minutes, timeframe=15):
    if timeframe not in (5, 15, 30, 60):
        raise ValueError('timeframe must be 5, 15, 30 or 60')
    buckets = {}
    for b in minutes:
        t = b.start.astimezone(JST)
        start = t.replace(minute=t.minute // timeframe * timeframe)
        buckets.setdefault(start, []).append(b)
    result, invalid = [], 0
    for start, group in sorted(buckets.items()):
        if len(group) != timeframe or any(b.start != start+timedelta(minutes=i)
                                         for i, b in enumerate(group)):
            invalid += 1
            continue
        result.append(Bar(start, start+timedelta(minutes=timeframe), group[0].open,
                          max(b.high for b in group), min(b.low for b in group), group[-1].close))
    return result, invalid
