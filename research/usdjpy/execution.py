"""Executable-side fills; never infer a path through a minute's OHLC."""
from datetime import timedelta
from .trade_model import PIP


def side(direction):
    return 1 if direction == 'buy' else -1


def quote(bid, direction, rules):
    """Quote used to close a position."""
    return bid if direction == 'buy' else bid + rules.spread


def enter(signal, bar, rules, trade_id):
    direction = signal['direction']
    sign = side(direction)
    q = quote(bar.open, direction, rules)
    if sign * (q - signal['sl']) <= 0:
        return None, 'sl_crossed_at_entry'
    entry_quote = bar.open + (rules.spread if sign == 1 else 0)
    entry = entry_quote + sign * rules.slip
    risk = sign * (entry - signal['sl'])
    if risk <= 0 or signal['sl'] <= 0:
        return None, 'invalid_risk'
    tp = entry + sign * rules.rr * risk
    if tp <= 0:
        return None, 'invalid_target'
    return dict(
        trade_id=trade_id, signal_id=signal['signal_id'], wave_id=signal['wave_id'],
        direction=direction, ratio=signal['ratio'], available_at=signal['available_at'],
        entry_at=bar.start, entry_bid=bar.open, entry_quote=entry_quote, entry_fill=entry,
        units=rules.units, sl=signal['sl'], tp=tp, risk_price=risk,
        deadline=bar.start + timedelta(minutes=rules.hold_minutes),
        status='open', entry_slippage_jpy=rules.slip * rules.units,
        entry_commission_jpy=rules.commission_per_side_jpy), None


def finish(trade, bar, price, reason, timing, rules, ambiguous=False, slip=True):
    sign = side(trade['direction'])
    slippage = rules.slip if slip else 0
    fill = price - sign * slippage
    bid_reference = price - (rules.spread if sign == -1 else 0)
    gross = sign * (bid_reference - trade['entry_bid']) * rules.units
    net = sign * (fill - trade['entry_fill']) * rules.units - 2 * rules.commission_per_side_jpy
    return trade | dict(
        status='closed', exit_at=bar.start if timing == 'open' else None,
        exit_bar_start=bar.start, exit_bar_end=bar.end, exit_timing=timing,
        exit_bid_reference=bid_reference, exit_quote=price, exit_fill=fill,
        exit_reason=reason, ambiguous_intrabar=ambiguous,
        holding_minutes_min=int((bar.start-trade['entry_at']).total_seconds()/60),
        holding_minutes_max=int((bar.start-trade['entry_at']).total_seconds()/60) + (timing != 'open'),
        spread_cost_jpy=rules.spread * rules.units,
        slippage_cost_jpy=(rules.slip + slippage) * rules.units,
        commission_jpy=2 * rules.commission_per_side_jpy,
        gross_bid_pnl_jpy=gross, total_cost_jpy=gross-net, net_pnl_jpy=net,
        net_pips=net / rules.units / PIP, net_r=net / rules.units / trade['risk_price'])


def exit_at_open(trade, bar, rules):
    sign = side(trade['direction'])
    q = quote(bar.open, trade['direction'], rules)
    if sign * (q - trade['sl']) <= 0:
        return finish(trade, bar, q, 'sl', 'open', rules)
    if sign * (q - trade['tp']) >= 0:
        return finish(trade, bar, trade['tp'], 'tp', 'open', rules, slip=False)
    if bar.start >= trade['deadline']:
        return finish(trade, bar, q, 'time', 'open', rules)
    return None


def exit_intrabar(trade, bar, rules):
    high = quote(bar.high, trade['direction'], rules)
    low = quote(bar.low, trade['direction'], rules)
    buy = trade['direction'] == 'buy'
    sl_hit = low <= trade['sl'] if buy else high >= trade['sl']
    tp_hit = high >= trade['tp'] if buy else low <= trade['tp']
    if sl_hit:
        return finish(trade, bar, trade['sl'], 'sl', 'intrabar', rules, ambiguous=tp_hit)
    if tp_hit:
        return finish(trade, bar, trade['tp'], 'tp', 'intrabar', rules, slip=False)
    return None


def liquidation(trade, bid_close, rules):
    sign = side(trade['direction'])
    price = quote(bid_close, trade['direction'], rules) - sign * rules.slip
    # Realized balance already pays the entry commission; reserve exit commission here.
    return sign * (price - trade['entry_fill']) * rules.units - rules.commission_per_side_jpy
