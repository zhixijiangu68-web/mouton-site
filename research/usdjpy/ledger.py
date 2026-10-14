"""Stable CSV schemas, including empty ledgers and unresolved trades."""
import csv
from datetime import datetime
from decimal import Decimal
from .model import JST

SIGNAL_FIELDS = ('signal_id wave_id direction ratio level wave_confirmed_at arrival_start '
                 'available_at entry_due arrival_session entry_session rebound sl status trade_id').split()
TRADE_FIELDS = ('trade_id signal_id wave_id direction ratio available_at entry_at entry_bid '
                'entry_quote entry_fill units sl tp risk_price deadline status entry_slippage_jpy '
                'entry_commission_jpy exit_at exit_bar_start exit_bar_end exit_timing '
                'exit_bid_reference exit_quote exit_fill exit_reason ambiguous_intrabar '
                'holding_minutes_min holding_minutes_max spread_cost_jpy slippage_cost_jpy '
                'commission_jpy gross_bid_pnl_jpy total_cost_jpy net_pnl_jpy net_pips net_r '
                'unresolved_at last_observed_end').split()
EQUITY_FIELDS = ('at realized_pnl_jpy liquidation_pnl_jpy equity_jpy peak_equity_jpy '
                 'drawdown_jpy drawdown_pct trade_id').split()


def encode(value):
    if isinstance(value, datetime):
        return value.astimezone(JST).isoformat()
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(type(value).__name__)


def write_ledger(path, fields, rows):
    with path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields, lineterminator='\n')
        writer.writeheader()
        for row in rows:
            writer.writerow({k: encode(v) if isinstance(v, (datetime, Decimal)) else v
                             for k, v in row.items()})


def write_ledgers(output, result):
    for name, fields in [('signals', SIGNAL_FIELDS), ('trades', TRADE_FIELDS), ('equity', EQUITY_FIELDS)]:
        write_ledger(output/f'{name}.csv', fields, result[name])
