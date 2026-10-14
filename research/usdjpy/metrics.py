"""Net-of-cost metrics with explicit undefined and incomplete cases."""
from collections import Counter
from decimal import Decimal as D


def summarize(trades, equity):
    closed = [t for t in trades if t['status'] == 'closed']
    pnl = [t['net_pnl_jpy'] for t in closed]
    profit = sum((p for p in pnl if p > 0), D(0))
    loss = -sum((p for p in pnl if p < 0), D(0))
    n = len(closed)
    streak = longest = 0
    for p in pnl:
        streak = streak + 1 if p < 0 else 0
        longest = max(longest, streak)
    def mean(field):
        return sum((t[field] for t in closed), D(0))/n if n else None
    return dict(
        trades=n, wins=sum(p > 0 for p in pnl), losses=sum(p < 0 for p in pnl),
        breakeven=sum(p == 0 for p in pnl),
        win_rate=D(sum(p > 0 for p in pnl))/n if n else None,
        profit_factor=profit/loss if loss else None,
        pf_undefined_reason=('no_trades' if not n else 'no_losses') if not loss else None,
        net_pnl_jpy=sum(pnl, D(0)), gross_profit_jpy=profit, gross_loss_jpy=loss,
        expectancy_jpy=mean('net_pnl_jpy'), expectancy_pips=mean('net_pips'),
        expectancy_r=mean('net_r'), max_consecutive_losses=longest,
        max_drawdown_jpy=max((e['drawdown_jpy'] for e in equity), default=D(0)),
        max_drawdown_pct=max((e['drawdown_pct'] for e in equity), default=D(0)),
        drawdown_basis='observed_1m_close_executable_liquidation_including_exit_costs',
        holding_minutes_mean_min=mean('holding_minutes_min'),
        holding_minutes_mean_max=mean('holding_minutes_max'),
        exits=dict(Counter(t['exit_reason'] for t in closed)),
        ambiguous_intrabar=sum(t['ambiguous_intrabar'] for t in closed),
        total_cost_jpy=sum((t['total_cost_jpy'] for t in closed), D(0)))


def performance(result):
    metrics = summarize(result['trades'], result['equity'])
    if result['status'] != 'complete':
        return dict(metrics=None, partial_metrics=metrics,
                    partial_metrics_scope='closed_trades_and_observed_equity_before_halt',
                    metrics_unavailable_reason='unresolved_position_missing_execution_data')
    return dict(metrics=metrics, partial_metrics=None, metrics_unavailable_reason=None)
