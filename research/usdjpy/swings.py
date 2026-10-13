from dataclasses import dataclass
from .model import Bar

@dataclass(frozen=True)
class Pivot:
    index: int
    kind: str
    bar: Bar
    confirmed_at: object

    @property
    def price(self):
        return self.bar.high if self.kind == 'high' else self.bar.low


def confirmed_pivot(bars, end_index, width=2):
    if width < 1:
        raise ValueError('width must be positive')
    i = end_index-width
    if i < width:
        return None
    window = bars[i-width:end_index+1]
    if any(a.end != b.start for a, b in zip(window, window[1:])):
        return None
    center = bars[i]
    others = window[:width]+window[width+1:]
    high = all(center.high > b.high for b in others)
    low = all(center.low < b.low for b in others)
    if high == low:
        return None
    return Pivot(i, 'high' if high else 'low', center, bars[end_index].end)


def update_pivots(pivots, p):
    if pivots and pivots[-1].kind == p.kind:
        old = pivots[-1]
        if (p.kind == 'high' and p.price > old.price) or (p.kind == 'low' and p.price < old.price):
            pivots[-1] = p
        else:
            return False
    else:
        pivots.append(p)
    return True


def trend(pivots):
    highs = [p.price for p in pivots if p.kind == 'high'][-2:]
    lows = [p.price for p in pivots if p.kind == 'low'][-2:]
    if len(highs) < 2 or len(lows) < 2:
        return None
    if highs[1] > highs[0] and lows[1] > lows[0]:
        return 'buy'
    if highs[1] < highs[0] and lows[1] < lows[0]:
        return 'sell'
    return None
