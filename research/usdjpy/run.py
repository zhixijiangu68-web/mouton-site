"""Run from repository root: python -m research.usdjpy.run --help."""
import argparse
import csv
import hashlib
import json
import math
from collections import Counter, defaultdict
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from statistics import median
from .ingest import read_minutes
from .bars import aggregate
from .fib_events import detect
from .splits import boundaries, label
from .model import JST, session


def encode(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(type(value).__name__)


def write_csv(path, fields, rows):
    with path.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: encode(v) if isinstance(v, (datetime, Decimal)) else v for k, v in r.items()})


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input', required=True, type=Path)
    p.add_argument('--config', type=Path, default=Path('research/usdjpy/config.json'))
    p.add_argument('--output', type=Path, default=Path('research/usdjpy/output'))
    p.add_argument('--partition', choices=['development', 'validation', 'holdout'], default='development')
    p.add_argument('--unlock-holdout', action='store_true', help='Explicitly open holdout after freezing rules')
    args = p.parse_args()
    if args.partition == 'holdout' and not args.unlock_holdout:
        p.error('Holdout requires --unlock-holdout after freezing rules')
    cfg = json.loads(args.config.read_text(encoding='utf-8'))
    if cfg['symbol'] != 'USDJPY' or cfg['price_type'] not in ('bid', 'ask', 'mid'):
        p.error('Expected USDJPY and bid/ask/mid price_type')
    if not isinstance(cfg['pivot_width'], int) or not 1 <= cfg['pivot_width'] <= 20:
        p.error('pivot_width must be an integer from 1 to 20')
    cuts = boundaries(cfg['splits'])
    cutoff = cuts[{'development': 'development_end', 'validation': 'validation_end', 'holdout': 'end'}[args.partition]]
    minutes, quality = read_minutes(args.input, cfg['source_timezone'])
    # Parsing checks input integrity; do not expose later-partition prices/events/statistics.
    selected = [b for b in minutes if cuts['start'] <= b.start and b.end <= cutoff]
    if not selected:
        p.error('No minutes in requested history window')
    bars, invalid = aggregate(selected, cfg['timeframe_minutes'])
    events, swings = detect(bars, cfg['pivot_width'])
    event_rows = [e | {'partition': args.partition} for e in events
                  if label(e['bar_start'], e['available_at'], cuts) == args.partition]
    bar_rows = [b for b in bars if label(b.start, b.end, cuts) == args.partition]
    # Volatility is emitted for requested partition only, with nearest-rank p90.
    groups = defaultdict(list)
    for b in bar_rows:
        groups[f'{b.start.astimezone(JST).year}:{session(b.start)}'].append((b.high-b.low)/Decimal('0.01'))
    volatility = {k: {'count': len(v), 'median_pips': median(v),
                      'p90_pips': sorted(v)[math.ceil(len(v)*.9)-1]} for k, v in groups.items()}
    report = {
        'stage': 'arrival_events_only_not_trades', 'partition': args.partition,
        'input_sha256': hashlib.sha256(args.input.read_bytes()).hexdigest(),
        'config': cfg, 'history_cutoff': cutoff,
        'input_integrity': {'valid_minutes': quality['valid_minutes'], 'duplicates_removed': quality['duplicates_removed']},
        'history_quality': {'used_minutes': len(selected), 'valid_bars': len(bars), 'invalid_buckets': invalid,
                            'gaps': [g for g in quality['gaps'] if cuts['start'] <= datetime.fromisoformat(g['start']) < datetime.fromisoformat(g['end']) <= cutoff]},
        'partition_bars': len(bar_rows),
        'confirmed_pivots': sum(label(s['confirmed_at'], s['confirmed_at'], cuts) == args.partition for s in swings),
        'events': len(event_rows), 'events_by_ratio': dict(Counter(e['ratio'] for e in event_rows)),
        'volatility_by_year_session': volatility,
        'limitations': ['No rebound/entry/SL/TP/costs or performance metrics',
                        'Weekend gaps are heuristic candidates, not verified exchange holidays',
                        'CSV timestamp denotes minute open; every input row must be a completed minute',
                        'Split dates are explicit; config.json is synthetic, real-data configs must be reviewed separately']}
    args.output.mkdir(parents=True, exist_ok=True)
    write_csv(args.output/'fib_events.csv', ['wave_id', 'direction', 'confirmed_at', 'ratio', 'level',
                                           'bar_start', 'available_at', 'session', 'partition'], event_rows)
    write_csv(args.output/'bars.csv', ['start', 'end', 'open', 'high', 'low', 'close'],
              [vars(b) for b in bar_rows])
    write_csv(args.output/'swings.csv', ['kind', 'price', 'pivot_at', 'confirmed_at'],
              [s for s in swings if label(s['confirmed_at'], s['confirmed_at'], cuts) == args.partition])
    (args.output/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2, default=encode)+'\n', encoding='utf-8')
    print(f'{len(bar_rows)} bars, {len(event_rows)} arrival events -> {args.output}')


if __name__ == '__main__':
    main()
