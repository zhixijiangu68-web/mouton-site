import csv
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal as D
from pathlib import Path
from research.usdjpy.model import Bar, session
from research.usdjpy.ingest import read_minutes, parse_time
from research.usdjpy.bars import aggregate
from research.usdjpy.swings import confirmed_pivot
from research.usdjpy.fib_events import detect
from research.usdjpy.splits import boundaries, label

BASE = datetime(2025, 1, 6, tzinfo=timezone.utc)
FIXTURE = Path(__file__).parent/'fixtures/minute_sample.csv'


def wave():
    # H1=110 L1=100 H2=114 L2=104 H3=120; only H3 confirms an uptrend.
    centers = [106,108,109,107,104,101,104,108,113,110,107,105,108,114,119,118,117,113,112,115]
    return [Bar(BASE+timedelta(minutes=15*i), BASE+timedelta(minutes=15*(i+1)),
                D(v), D(v+1), D(v-1), D(v)) for i, v in enumerate(centers)]


class PipelineTest(unittest.TestCase):
    def read_text(self, text, tz=None):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'input.csv'
            p.write_text('timestamp,open,high,low,close\n'+text)
            return read_minutes(p, tz)

    def test_normalization_and_duplicates(self):
        bars, q = self.read_text('2025-01-06T09:00:00+09:00,150,151,149,150\n2025-01-06T00:00:00Z,150,151,149,150\n')
        self.assertEqual(bars[0].start, BASE)
        self.assertEqual(q['duplicates_removed'], 1)
        self.assertEqual(parse_time('2025-01-06T09:00:00', 'Asia/Tokyo'), BASE)
        with self.assertRaises(ValueError):
            parse_time('2025-01-06T09:00:00')
        with self.assertRaises(ValueError):
            parse_time('2025-11-02T01:30:00', 'America/New_York')

    def test_bad_input_rejected(self):
        for row in ['2025-01-06T00:00:01Z,150,151,149,150\n',
                    '2025-01-06T00:00:00Z,150,149,148,150\n',
                    '2025-01-06T00:00:00Z,NaN,151,149,150\n',
                    '2025-01-06T00:00:00Z,150,151,149,150\n2025-01-06T00:00:00Z,150,152,149,150\n']:
            with self.subTest(row=row), self.assertRaises(ValueError):
                self.read_text(row)

    def test_aggregation_and_missing(self):
        m, _ = read_minutes(FIXTURE)
        b, invalid = aggregate(m, 15)
        self.assertEqual(b, wave())
        self.assertEqual(invalid, 0)
        b2, invalid = aggregate(m[:7]+m[8:], 15)
        self.assertEqual(len(b2), len(b)-1)
        self.assertEqual(invalid, 1)
        for tf in (5,30,60):
            result, _ = aggregate(m, tf)
            self.assertTrue(all(x.end-x.start == timedelta(minutes=tf) for x in result))

    def test_pivot_confirmation_and_ties(self):
        b = wave()
        self.assertIsNone(confirmed_pivot(b[:4], 3))
        p = confirmed_pivot(b[:5], 4)
        self.assertEqual(p.index, 2)
        self.assertEqual(p.confirmed_at, b[4].end)
        self.assertEqual(p.price, D(110))
        b[3] = Bar(b[3].start, b[3].end, D(108), D(110), D(106), D(108))
        self.assertIsNone(confirmed_pivot(b, 4))

    def test_fib_hand_calculation(self):
        events, _ = detect(wave())
        self.assertEqual([e['ratio'] for e in events], ['0.382', '0.500'])
        self.assertEqual([e['level'] for e in events], [D('113.888'), D('112')])
        self.assertTrue(all(e['bar_start'] == wave()[17].start for e in events))
        self.assertTrue(all(e['confirmed_at'] == wave()[16].end for e in events))

    def test_future_append_cannot_change_past(self):
        b = wave()
        full, pivots = detect(b)
        for n in range(1, len(b)+1):
            events, partial_pivots = detect(b[:n])
            self.assertEqual(events, [e for e in full if e['available_at'] <= b[n-1].end])
            self.assertEqual(partial_pivots, [e for e in pivots if e['confirmed_at'] <= b[n-1].end])

    def test_sell_symmetry(self):
        b = [Bar(x.start,x.end,D(300)-x.open,D(300)-x.low,D(300)-x.high,D(300)-x.close) for x in wave()]
        events, _ = detect(b)
        self.assertEqual([e['direction'] for e in events], ['sell','sell'])
        self.assertEqual([e['level'] for e in events], [D('186.112'), D('188')])

    def test_stale_and_range_break(self):
        b = wave()
        b[16] = Bar(b[16].start,b[16].end,D(117),D(118),D(113),D(117))
        self.assertNotIn('0.382', [e['ratio'] for e in detect(b)[0]])
        b = wave()
        b[17] = Bar(b[17].start,b[17].end,D(113),D(121),D(112),D(113))
        self.assertEqual(detect(b)[0], [])

    def test_gap_resets_state(self):
        b = wave()
        self.assertEqual(detect(b[:15]+b[16:])[0], [])

    def test_sessions_and_splits(self):
        for hour, expected in [(0,'22-01'),(1,'outside'),(10,'10-11'),(11,'outside'),(16,'16-18'),(18,'outside'),(22,'22-01')]:
            self.assertEqual(session(parse_time(f'2025-01-06T{hour:02}:00:00+09:00')), expected)
        cuts = boundaries({'start':'2025-01-01T00:00Z','development_end':'2025-01-02T00:00Z',
                           'validation_end':'2025-01-03T00:00Z','end':'2025-01-04T00:00Z'})
        t = cuts['development_end']
        self.assertEqual(label(t,t+timedelta(minutes=15),cuts), 'validation')
        self.assertEqual(label(t-timedelta(minutes=5),t+timedelta(minutes=10),cuts), 'boundary_or_outside')

    def test_cli_and_holdout_guard(self):
        with tempfile.TemporaryDirectory() as d:
            cmd = [sys.executable,'-m','research.usdjpy.run','--input',str(FIXTURE),'--output',d]
            subprocess.run(cmd, check=True, capture_output=True)
            report = json.loads((Path(d)/'report.json').read_text())
            self.assertEqual(report['events'], 2)
            self.assertEqual(report['partition_bars'], 20)
            self.assertNotEqual(subprocess.run(cmd+['--partition','holdout'], capture_output=True).returncode,0)


if __name__ == '__main__':
    unittest.main()
