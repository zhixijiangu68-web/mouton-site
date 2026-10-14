import csv
import json
import subprocess
import sys
import tempfile
import unittest
from dataclasses import replace
from datetime import timedelta
from decimal import Decimal as D
from pathlib import Path
from research.usdjpy.backtest import simulate
from research.usdjpy.trade_model import Rules
from research.usdjpy.metrics import performance
from research.usdjpy.tests.test_execution import minute, signal, T
from research.usdjpy.tests.test_pipeline import wave


class BacktestTest(unittest.TestCase):
    def run_sim(self, bars=None, signals=None, rules=None, start=T, length=121):
        return simulate(bars if bars is not None else [minute(i) for i in range(length)],
                        signals if signals is not None else [signal()], start,
                        start+timedelta(minutes=length), rules or Rules())

    def test_time_exit_ledger_and_equity_reconcile(self):
        r = self.run_sim(rules=Rules(commission_per_side_jpy=D(2)))
        self.assertEqual(r['status'], 'complete')
        self.assertEqual(len(r['trades']), 1)
        t = r['trades'][0]
        self.assertEqual(t['exit_at'], T+timedelta(minutes=60))
        self.assertEqual(t['net_pnl_jpy'], D(-16))
        self.assertEqual(r['equity'][0]['equity_jpy'], D(999984))
        self.assertEqual(r['equity'][-1]['equity_jpy'], D(999984))
        self.assertEqual(performance(r)['metrics']['net_pnl_jpy'], D(-16))

    def test_immediate_stop_and_intrabar_ambiguity(self):
        r = self.run_sim(bars=[minute(0,h='150.3',l='149.8')])
        t = r['trades'][0]
        self.assertEqual(t['exit_reason'], 'sl')
        self.assertTrue(t['ambiguous_intrabar'])
        self.assertEqual(t['holding_minutes_max'], 1)
        self.assertEqual(r['status'], 'complete')

    def test_next_bar_extrema_do_not_change_entry(self):
        a = self.run_sim()
        b = self.run_sim(bars=[minute(0,h='151',l='149')]+[minute(i) for i in range(1,121)])
        for key in ('entry_at','entry_fill','sl','tp'):
            self.assertEqual(a['trades'][0][key], b['trades'][0][key])

    def test_no_fill_before_available_and_missing_entry_cancel(self):
        s = signal(at=T+timedelta(minutes=15))
        r = self.run_sim(signals=[s])
        self.assertTrue(all(e['trade_id'] is None for e in r['equity'][:15]))
        self.assertEqual(r['trades'][0]['entry_at'], s['available_at'])
        r = self.run_sim(bars=[minute(i) for i in range(1,121)])
        self.assertEqual(r['signals'][0]['status'], 'missing_entry_minute')
        self.assertEqual(r['trades'], [])

    def test_gap_while_held_is_not_lookahead_entry_filter(self):
        r = self.run_sim(bars=[minute(i) for i in range(121) if i != 10])
        self.assertEqual(r['signals'][0]['status'], 'entered')
        self.assertEqual(r['status'], 'unresolved')
        self.assertEqual(r['halted_at'], T+timedelta(minutes=10))
        self.assertEqual(r['trades'][0]['status'], 'unresolved')
        self.assertNotIn('net_pnl_jpy', r['trades'][0])
        self.assertIsNone(performance(r)['metrics'])

    def test_deadline_minute_missing_is_unresolved(self):
        r = self.run_sim(bars=[minute(i) for i in range(60)])
        self.assertEqual(r['halted_at'], T+timedelta(minutes=60))
        self.assertEqual(r['status'], 'unresolved')

    def test_boundary_horizon_uses_known_dates(self):
        r = self.run_sim(length=60)
        self.assertEqual(r['signals'][0]['status'], 'boundary_horizon')
        self.assertEqual(r['trades'], [])
        r = self.run_sim(length=61)
        self.assertEqual(r['trades'][0]['exit_reason'], 'time')

    def test_busy_signals_discarded_even_when_old_position_exits_at_open(self):
        signals = [signal(),signal(at=T+timedelta(minutes=15),wave='b'),
                   signal(at=T+timedelta(minutes=60),wave='c')]
        r = self.run_sim(signals=signals)
        self.assertEqual([s['status'] for s in r['signals']], ['entered','position_busy','position_busy'])
        self.assertEqual(len(r['trades']), 1)

    def test_same_wave_cannot_reenter_after_stop(self):
        bars = [minute(0,l='149.8')]+[minute(i) for i in range(1,121)]
        r = self.run_sim(bars=bars,signals=[signal(),signal(at=T+timedelta(minutes=15))])
        self.assertEqual(r['signals'][1]['status'], 'wave_already_traded')

    def test_entry_sessions_use_actual_entry_time(self):
        for hour, minute_value, allowed in [(10,0,True),(11,0,False),(16,0,True),
                                           (18,0,False),(22,0,True),(0,0,True),(1,0,False)]:
            at = T.replace(hour=hour,minute=minute_value)
            delta = at-T
            bars = [replace(minute(i),start=minute(i).start+delta,end=minute(i).end+delta) for i in range(61)]
            r = self.run_sim(bars=bars,signals=[signal(at=at)],start=at,length=61)
            self.assertEqual(bool(r['trades']), allowed)

    def test_failed_rebound_never_queued_for_retry(self):
        s = signal() | {'status':'no_rebound'}
        r = self.run_sim(signals=[s])
        self.assertEqual(r['trades'], [])
        self.assertEqual(r['signals'][0]['status'], 'no_rebound')

    def test_future_append_preserves_resolved_decisions(self):
        short = self.run_sim(bars=[minute(i) for i in range(61)])
        full = self.run_sim()
        self.assertEqual(short['signals'], full['signals'])
        self.assertEqual(short['trades'], full['trades'])
        self.assertEqual(short['equity'], full['equity'][:61])

    def test_floating_loss_included_in_dd(self):
        bars = [minute(i) for i in range(121)]
        bars[10] = minute(10,l='149.94',c='149.95')
        r = self.run_sim(bars=bars)
        m = performance(r)['metrics']
        self.assertEqual(m['net_pnl_jpy'], -12)
        self.assertEqual(m['max_drawdown_jpy'], 62)

    def test_signal_duplicate_rejected(self):
        with self.assertRaises(ValueError):
            self.run_sim(signals=[signal(),signal()])


class BacktestCLITest(unittest.TestCase):
    def test_full_pipeline_hand_trade_reproducibility_and_holdout_guard(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            config = json.loads(Path('research/usdjpy/config.backtest-2012.json').read_text())
            bars = wave()
            delta = T-timedelta(minutes=18*15)-bars[0].start
            bars = [replace(b,start=b.start+delta,end=b.end+delta) for b in bars]
            bars[17] = replace(bars[17],close=D('113.5'))
            config['splits'] = dict(start=bars[0].start.isoformat(),
                                    development_end=(T+timedelta(hours=3)).isoformat(),
                                    validation_end=(T+timedelta(days=1)).isoformat(),
                                    end=(T+timedelta(days=2)).isoformat())
            cfg = root/'config.json'
            cfg.write_text(json.dumps(config))
            lines = ['timestamp,open,high,low,close']
            for b in bars:
                for j in range(15):
                    lines.append(','.join(map(str,[ (b.start+timedelta(minutes=j)).isoformat(),
                                                    b.open,b.high,b.low,b.close ])))
            outputs = []
            for n, future_price in enumerate((150,900)):
                path = root/f'input{n}.csv'
                future = T+timedelta(days=1,hours=1)
                path.write_text('\n'.join(lines)+f'\n{future.isoformat()},{future_price},{future_price},{future_price},{future_price}\n')
                out = root/f'out{n}'
                cmd = [sys.executable,'-m','research.usdjpy.run_backtest','--input',str(path),
                       '--config',str(cfg),'--output',str(out)]
                result = subprocess.run(cmd,capture_output=True,text=True)
                self.assertEqual(result.returncode,0,result.stderr)
                outputs.append(out)
                self.assertNotEqual(subprocess.run(cmd+['--partition','holdout'],capture_output=True).returncode,0)
                self.assertNotEqual(subprocess.run(cmd,capture_output=True).returncode,0)
            for file in ('signals.csv','trades.csv','equity.csv'):
                self.assertEqual((outputs[0]/file).read_bytes(),(outputs[1]/file).read_bytes())
            with (outputs[0]/'trades.csv').open() as f:
                trades = list(csv.DictReader(f))
            self.assertEqual(len(trades),1)
            self.assertEqual(D(trades[0]['net_pnl_jpy']),D('-22'))
            reports = [json.loads((o/'backtest_report.json').read_text()) for o in outputs]
            for report in reports:
                report.pop('input_sha256')
            self.assertEqual(*reports)

    def test_unresolved_cli_nonzero_with_usable_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out = root/'out'
            cfg = json.loads(Path('research/usdjpy/config.backtest-2012.json').read_text())
            bars = wave()
            delta = T-timedelta(minutes=18*15)-bars[0].start
            bars = [replace(b,start=b.start+delta,end=b.end+delta) for b in bars]
            bars[17] = replace(bars[17],close=D('113.5'))
            # The entry minute stays between SL/TP, then the very next minute is missing.
            bars[18] = replace(bars[18],open=D(112),high=D('112.001'),low=D(112),close=D(112))
            cfg['splits'] = dict(start=bars[0].start.isoformat(),
                                development_end=(T+timedelta(hours=3)).isoformat(),
                                validation_end=(T+timedelta(days=1)).isoformat(),
                                end=(T+timedelta(days=2)).isoformat())
            cp = root/'cfg.json'
            cp.write_text(json.dumps(cfg))
            fixture = root/'minutes.csv'
            with fixture.open('w') as f:
                writer = csv.writer(f)
                writer.writerow(['timestamp','open','high','low','close'])
                for b in bars:
                    for i in range(15):
                        at = b.start+timedelta(minutes=i)
                        if at != T+timedelta(minutes=1):
                            writer.writerow([at.isoformat(),b.open,b.high,b.low,b.close])
            result = subprocess.run([sys.executable,'-m','research.usdjpy.run_backtest',
                                     '--input',str(fixture),'--config',str(cp),'--output',str(out)],
                                    capture_output=True,text=True)
            self.assertEqual(result.returncode,2,result.stderr)
            report = json.loads((out/'backtest_report.json').read_text())
            self.assertEqual(report['entries'],1)
            self.assertEqual(report['unresolved_trades'],1)
            self.assertIsNone(report['metrics'])
            self.assertEqual(report['halted_at'],(T+timedelta(minutes=1)).isoformat())
