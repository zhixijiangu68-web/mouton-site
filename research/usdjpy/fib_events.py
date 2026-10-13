from decimal import Decimal
from .model import session
from .swings import confirmed_pivot, update_pivots, trend


def detect(bars, width=2):
    pivots, events, audit, active = [], [], [], None
    for j, b in enumerate(bars):
        if j and bars[j-1].end != b.start:
            pivots, active = [], None
        # Only a previously confirmed wave can generate an event on this bar.
        if active:
            if b.low < active['low'] or b.high > active['high']:
                active = None
            else:
                for ratio, price in list(active['levels'].items()):
                    # A level passed between observed bars cannot later become
                    # a first pullback touch in the opposite direction.
                    jumped = b.high < price if active['direction'] == 'buy' else b.low > price
                    if jumped:
                        del active['levels'][ratio]
                        continue
                    if b.low <= price <= b.high:
                        events.append({k: active[k] for k in ('wave_id', 'direction', 'confirmed_at')} |
                                      {'ratio': ratio, 'level': price, 'bar_start': b.start,
                                       'available_at': b.end, 'session': session(b.start)})
                        del active['levels'][ratio]
        p = confirmed_pivot(bars, j, width)
        if not p:
            continue
        audit.append({'kind': p.kind, 'price': p.price, 'pivot_at': p.bar.start,
                      'confirmed_at': p.confirmed_at})
        if not update_pivots(pivots, p):
            continue
        active = None
        direction = trend(pivots)
        if not direction or len(pivots) < 2 or p.kind != ('high' if direction == 'buy' else 'low'):
            continue
        a = pivots[-2]
        lo, hi = (a.price, p.price) if direction == 'buy' else (p.price, a.price)
        if hi <= lo:
            continue
        confirmation = bars[p.index+1:j+1]
        if any(x.low < lo or x.high > hi for x in confirmation):
            continue
        levels = {}
        for ratio in ('0.382', '0.500', '0.618'):
            price = hi-(hi-lo)*Decimal(ratio) if direction == 'buy' else lo+(hi-lo)*Decimal(ratio)
            # Reaching OR passing the level during confirmation makes it stale.
            stale = any(x.low <= price if direction == 'buy' else x.high >= price for x in confirmation)
            if not stale:
                levels[ratio] = price
        active = {'wave_id': f'{direction}:{a.bar.start.isoformat()}:{p.bar.start.isoformat()}',
                  'direction': direction, 'confirmed_at': p.confirmed_at,
                  'low': lo, 'high': hi, 'levels': levels}
    return events, audit
