"""A chronological, single-position simulator. Missing held minutes stop the run."""
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal as D
from .model import session
from .execution import enter, exit_at_open, exit_intrabar, liquidation

MINUTE = timedelta(minutes=1)


def simulate(minutes, signals, start, end, rules):
    if start >= end or start.tzinfo is None or end.tzinfo is None:
        raise ValueError('Expected an aware, increasing evaluation window')
    prices = {}
    for b in minutes:
        if b.end - b.start != MINUTE:
            raise ValueError('Execution requires one-minute bars')
        if start <= b.start and b.end <= end:
            if b.start in prices:
                raise ValueError('Duplicate execution minute')
            prices[b.start] = b
    scheduled = defaultdict(list)
    ids = set()
    for s in signals:
        if s['signal_id'] in ids:
            raise ValueError('Duplicate signal id')
        ids.add(s['signal_id'])
        if s['entry_due'] != s['available_at']:
            raise ValueError('Entry must follow the completed arrival bar immediately')
        if start <= s['available_at'] < end:
            scheduled[s['available_at']].append(dict(s))
    ledger, trades, equity, used_waves = [], [], [], set()
    position = None
    realized = D(0)
    peak = rules.initial_equity_jpy
    t = start

    def close(result):
        nonlocal position, realized
        # Entry commission was charged on entry; add it back to avoid double counting.
        realized += result['net_pnl_jpy'] + rules.commission_per_side_jpy
        trades.append(result)
        position = None

    while t < end:
        b = prices.get(t)
        busy_at_open = position is not None
        if busy_at_open and b is None:
            trades.append(position | dict(status='unresolved', exit_reason='missing_minute',
                                          unresolved_at=t, last_observed_end=t))
            return dict(status='unresolved', halted_at=t, signals=ledger, trades=trades,
                        equity=equity, missing_held_minute=t)
        if busy_at_open:
            result = exit_at_open(position, b, rules)
            if result:
                close(result)
        for s in sorted(scheduled.get(t, []), key=lambda x: x['signal_id']):
            s['entry_session'] = session(t)
            if s['status'] == 'pending':
                if busy_at_open or position is not None:
                    s['status'] = 'position_busy'
                elif s['wave_id'] in used_waves:
                    s['status'] = 'wave_already_traded'
                elif session(t) == 'outside':
                    s['status'] = 'outside_entry_session'
                elif t + timedelta(minutes=rules.hold_minutes) + MINUTE > end:
                    # Known split boundary, not a look-ahead check of future data availability.
                    s['status'] = 'boundary_horizon'
                elif b is None:
                    s['status'] = 'missing_entry_minute'
                else:
                    position, reason = enter(s, b, rules, f'T{len(trades)+1:06d}')
                    s['status'] = reason or 'entered'
                    if position:
                        s['trade_id'] = position['trade_id']
                        used_waves.add(s['wave_id'])
                        realized -= rules.commission_per_side_jpy
            ledger.append(s)
        if position:
            result = exit_intrabar(position, b, rules)
            if result:
                close(result)
        if b is not None:
            floating = liquidation(position, b.close, rules) if position else D(0)
            value = rules.initial_equity_jpy + realized + floating
            peak = max(peak, value)
            equity.append(dict(at=b.end, realized_pnl_jpy=realized,
                               liquidation_pnl_jpy=floating, equity_jpy=value,
                               peak_equity_jpy=peak, drawdown_jpy=peak-value,
                               drawdown_pct=(peak-value)/peak*100,
                               trade_id=position['trade_id'] if position else None))
        t += MINUTE
    if position:
        # Should be unreachable under the boundary horizon gate; never silently force-close.
        raise RuntimeError('Position crossed the evaluation boundary')
    return dict(status='complete', halted_at=None, signals=ledger, trades=trades,
                equity=equity, missing_held_minute=None)
