import csv
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from zoneinfo import ZoneInfo
from .model import Bar


def parse_time(value, source_timezone=None):
    t = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if t.tzinfo is None:
        if not source_timezone:
            raise ValueError('Naive timestamp requires source_timezone')
        zone = ZoneInfo(source_timezone)
        a, b = t.replace(tzinfo=zone, fold=0), t.replace(tzinfo=zone, fold=1)
        if a.utcoffset() != b.utcoffset():
            raise ValueError('Ambiguous/nonexistent local time: use explicit offset')
        t = a
    if t.second or t.microsecond:
        raise ValueError('Timestamp must be minute-aligned')
    t = t.astimezone(timezone.utc)
    if t.second or t.microsecond:
        raise ValueError('UTC timestamp must be minute-aligned')
    return t


def read_minutes(path, source_timezone=None):
    rows, duplicates = {}, 0
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        if len(reader.fieldnames or []) != len(set(reader.fieldnames or [])):
            raise ValueError('Duplicate CSV column names')
        if not {'timestamp', 'open', 'high', 'low', 'close'} <= set(reader.fieldnames or []):
            raise ValueError('Required columns: timestamp,open,high,low,close')
        for n, r in enumerate(reader, 2):
            try:
                t = parse_time(r['timestamp'], source_timezone)
                o, h, l, c = (Decimal(r[k]) for k in ('open', 'high', 'low', 'close'))
                if not all(x.is_finite() and x > 0 for x in (o, h, l, c)):
                    raise ValueError('Non-finite/nonpositive price')
                if not l <= min(o, c) <= max(o, c) <= h:
                    raise ValueError('Invalid OHLC')
                bar = Bar(t, t + timedelta(minutes=1), o, h, l, c)
                if t in rows:
                    if rows[t] != bar:
                        raise ValueError('Conflicting duplicate')
                    duplicates += 1
                rows[t] = bar
            except (ValueError, InvalidOperation, TypeError) as e:
                raise ValueError(f'CSV line {n}: {e}') from e
    bars = sorted(rows.values(), key=lambda b: b.start)
    if not bars:
        raise ValueError('Empty input')
    gaps = [{'start': a.end.isoformat(), 'end': b.start.isoformat(),
             'missing_minutes': int((b.start-a.end).total_seconds()/60),
             'kind': 'weekend_candidate' if (b.start-a.end).days >= 1 and
             any((a.end+timedelta(days=i)).weekday() >= 5 for i in range((b.start-a.end).days+1))
             else 'unclassified'}
            for a, b in zip(bars, bars[1:]) if b.start != a.end]
    return bars, {'valid_minutes': len(bars), 'duplicates_removed': duplicates, 'gaps': gaps}
