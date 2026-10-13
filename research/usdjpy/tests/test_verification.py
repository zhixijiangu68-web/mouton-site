"""Adversarial regression checks beyond the original happy-path fixture."""
import json
import random
import subprocess
import sys
import tempfile
import unittest
from dataclasses import replace
from datetime import timedelta
from decimal import Decimal as D
from pathlib import Path
from research.usdjpy.tests.test_pipeline import BASE, FIXTURE, wave
from research.usdjpy.model import Bar
from research.usdjpy.fib_events import detect
from research.usdjpy.ingest import read_minutes, parse_time
from research.usdjpy.bars import aggregate


class VerificationTest(unittest.TestCase):
    def test_all_three_ratios_and_no_repeat(self):
        bars = wave()
        bars[17] = replace(bars[17], low=D(110))
        events, _ = detect(bars)
        self.assertEqual([e['level'] for e in events], [D('113.888'), D('112'), D('110.112')])
        self.assertEqual(len({(e['wave_id'], e['ratio']) for e in events}), 3)

    def test_price_jumps_over_level_then_returns(self):
        bars = wave()
        # 38.2% is crossed in an unobserved gap from 117 to 113, then touched upward.
        bars[17] = replace(bars[17], open=D(113), high=D('113.5'), low=D('112.5'), close=D(113))
        bars[18] = replace(bars[18], open=D(113), high=D(115), low=D('112.5'), close=D(114))
        events, _ = detect(bars)
        self.assertNotIn('0.382', [e['ratio'] for e in events])

    def test_source_offset_must_preserve_utc_minute_alignment(self):
        with self.assertRaises(ValueError):
            parse_time('2012-01-01T00:00:00+00:00:30')

    def test_duplicate_header_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'bad.csv'
            p.write_text('timestamp,open,high,low,close,close\n2012-01-01T00:00Z,150,151,149,999,150\n')
            with self.assertRaises(ValueError):
                read_minutes(p)

    def test_randomized_prefix_invariance(self):
        for seed in range(12):
            rng = random.Random(seed)
            bars, price = [], D(150)
            for i in range(160):
                close = price+D(rng.randint(-20,20))/100
                bars.append(Bar(BASE+timedelta(minutes=15*i), BASE+timedelta(minutes=15*(i+1)),
                                price,max(price,close)+D('0.02'),min(price,close)-D('0.02'),close))
                price = close
            full, audit = detect(bars)
            for n in range(10,161,10):
                partial, pa = detect(bars[:n])
                self.assertEqual(partial,[e for e in full if e['available_at']<=bars[n-1].end])
                self.assertEqual(pa,[e for e in audit if e['confirmed_at']<=bars[n-1].end])

    def test_aggregation_independent_hand_example(self):
        minutes = [Bar(BASE+timedelta(minutes=i),BASE+timedelta(minutes=i+1),D(150+i),D(152+i),D(149+i),D(151+i)) for i in range(60)]
        for tf in (5,15,30,60):
            bars, invalid = aggregate(minutes,tf)
            self.assertEqual(invalid,0)
            self.assertEqual(len(bars),60//tf)
            self.assertEqual((bars[0].open,bars[0].high,bars[0].low,bars[0].close),(D(150),D(151+tf),D(149),D(150+tf)))

    def test_holdout_prices_do_not_change_development_outputs(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            outputs=[]
            for i, price in enumerate((150,900)):
                p = root/f'input{i}.csv'
                p.write_text(FIXTURE.read_text()+f'2025-01-08T00:00:00Z,{price},{price+1},{price-1},{price}\n')
                out=root/f'out{i}'
                subprocess.run([sys.executable,'-m','research.usdjpy.run','--input',str(p),'--output',str(out)],check=True,capture_output=True)
                outputs.append(out)
            for name in ('bars.csv','swings.csv','fib_events.csv'):
                self.assertEqual((outputs[0]/name).read_bytes(),(outputs[1]/name).read_bytes())
            reports=[json.loads((out/'report.json').read_text()) for out in outputs]
            for report in reports:
                report.pop('input_sha256')
            self.assertEqual(*reports)

    def test_histdata_fixed_est_and_range(self):
        from zipfile import ZipFile
        from research.usdjpy.import_histdata import convert
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            z = root/'source.zip'
            with ZipFile(z,'w') as archive:
                archive.writestr('DAT_MT_USDJPY_M1_2012.csv',
                    '2012.07.01,00:00,79,80,78,79,0\n2012.07.01,00:01,79,80,78,79,0\n')
            out = root/'standard.csv'
            meta = convert(z,out,parse_time('2012-07-01T14:00:00+09:00'),parse_time('2012-07-01T14:01:00+09:00'))
            bars,_ = read_minutes(out)
            self.assertEqual(meta['rows'],1)
            self.assertEqual(bars[0].start,parse_time('2012-07-01T05:00:00Z'))
