"""Development-only baseline; exit 2 means an unresolved held-data gap, not success."""
import argparse
from collections import Counter
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import subprocess
from .ingest import read_minutes, parse_time
from .bars import aggregate
from .fib_events import detect
from .splits import boundaries
from .trade_model import Rules
from .signals import build_signals
from .backtest import simulate
from .metrics import performance
from .ledger import encode, write_ledgers


def source_identity():
    root = Path(__file__).resolve().parent
    digest = hashlib.sha256()
    for path in sorted(root.glob('*.py')):
        digest.update(path.name.encode() + b'\0' + path.read_bytes() + b'\0')
    try:
        sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True,
                                      stderr=subprocess.DEVNULL).strip()
        dirty = bool(subprocess.check_output(['git', 'status', '--porcelain', '--', '.'],
                                            cwd=root, text=True, stderr=subprocess.DEVNULL))
    except (OSError, subprocess.CalledProcessError):
        sha, dirty = None, None
    return dict(code_sha=sha, research_worktree_dirty=dirty, source_sha256=digest.hexdigest())


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input', required=True, type=Path)
    p.add_argument('--config', type=Path, default=Path('research/usdjpy/config.backtest-2012.json'))
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--partition', choices=['development'], default='development')
    args = p.parse_args(argv)
    cfg = json.loads(args.config.read_text(encoding='utf-8'))
    if (cfg['symbol'], cfg['price_type'], cfg['timeframe_minutes'], cfg['pivot_width']) != ('USDJPY', 'bid', 15, 2):
        p.error('Baseline requires USDJPY Bid, 15m, pivot width 2')
    rules = Rules.from_config(cfg['strategy'])
    cuts = boundaries(cfg['splits'])
    start, end = cuts['start'], cuts['development_end']
    minutes, quality = read_minutes(args.input, cfg['source_timezone'])
    selected = [b for b in minutes if start <= b.start and b.end <= end]
    if not selected:
        p.error('No development minutes')
    bars, invalid = aggregate(selected, 15)
    events, swings = detect(bars, 2)
    signals = build_signals(events, bars, rules)
    result = simulate(selected, signals, start, end, rules)
    # Input/config hashes are provenance; later partitions never feed the simulator.
    config_bytes = json.dumps(cfg, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    report = dict(
        stage='minimal_trade_backtest', partition='development', **source_identity(),
        input_sha256=hashlib.sha256(args.input.read_bytes()).hexdigest(),
        config_sha256=hashlib.sha256(config_bytes).hexdigest(), config=cfg,
        effective_rules=asdict(rules), evaluation_start=start, evaluation_end=end,
        status=result['status'], halted_at=result['halted_at'],
        quality=dict(development_minutes=len(selected), complete_15m_bars=len(bars),
                     incomplete_buckets=invalid,
                     gaps=[g for g in quality['gaps']
                           if start <= parse_time(g['start']) < parse_time(g['end']) <= end]),
        full_development_arrival_events=len(events), full_development_pivots=len(swings),
        signals_processed=len(result['signals']),
        signal_statuses=dict(Counter(s['status'] for s in result['signals'])),
        entries=len(result['trades']),
        unresolved_trades=sum(t['status'] == 'unresolved' for t in result['trades']),
        **performance(result),
        limitations=['Spread/slippage are fixed assumptions, not observed Ask quotes',
                     'No swap modeled; holding is capped at 60 minutes with fixed JST entry windows',
                     'DD is observed minute-close liquidation equity, not tick extrema',
                     'Full-window arrival diagnostics may extend beyond a trading halt',
                     'Development integration check only; no profitability or 1000-trade claim'])
    # Refuse overwriting prior runs or accidental price inputs.
    args.output.mkdir(parents=True, exist_ok=False)
    write_ledgers(args.output, result)
    (args.output/'backtest_report.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2, default=encode, allow_nan=False)+'\n', encoding='utf-8')
    print(f"{result['status']}: {report['entries']} entries, {report['unresolved_trades']} unresolved -> {args.output}")
    return 0 if result['status'] == 'complete' else 2


if __name__ == '__main__':
    raise SystemExit(main())
