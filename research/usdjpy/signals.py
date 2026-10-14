"""Rebound is decided only when the arrival bar closes."""
from .trade_model import PIP


def build_signals(events, bars, rules):
    by_start = {b.start: b for b in bars}
    rows = []
    for e in events:
        b = by_start[e['bar_start']]
        if e['available_at'] != b.end or e['confirmed_at'] > b.start:
            raise ValueError('Event is not available from a previously confirmed wave')
        buy = e['direction'] == 'buy'
        if e['direction'] not in ('buy', 'sell'):
            raise ValueError('Unknown direction')
        rebound = (b.close > e['level'] and b.close > b.open) if buy else (
            b.close < e['level'] and b.close < b.open)
        reason = ('ratio_not_selected' if e['ratio'] != rules.ratio else
                  'no_rebound' if not rebound else 'pending')
        # SL is expressed in the executable closing side: Bid for buys, Ask for sells.
        sl = b.low - rules.sl_buffer_pips * PIP if buy else (
            b.high + rules.spread + rules.sl_buffer_pips * PIP)
        rows.append(dict(
            signal_id=f"{e['wave_id']}:{e['ratio']}:{b.start.isoformat()}",
            wave_id=e['wave_id'], direction=e['direction'], ratio=e['ratio'],
            level=e['level'], wave_confirmed_at=e['confirmed_at'],
            arrival_start=b.start, available_at=b.end, entry_due=b.end,
            arrival_session=e['session'], rebound=rebound, sl=sl,
            status=reason, trade_id=None))
    return sorted(rows, key=lambda r: (r['available_at'], r['signal_id']))
