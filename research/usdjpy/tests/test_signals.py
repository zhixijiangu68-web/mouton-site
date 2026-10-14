import unittest
from dataclasses import replace
from datetime import datetime, timedelta
from decimal import Decimal as D
from research.usdjpy.model import Bar, JST
from research.usdjpy.signals import build_signals
from research.usdjpy.trade_model import Rules

T = datetime(2012, 1, 3, 10, tzinfo=JST)


class SignalsTest(unittest.TestCase):
    def signals(self, direction='buy', ratio='0.500', **changes):
        b = Bar(T-timedelta(minutes=15), T, D('150'), D('150.2'), D('149.8'), D('150.1'))
        b = replace(b, **{k: D(v) for k, v in changes.items()})
        e = dict(wave_id='w', direction=direction, ratio=ratio, level=D('150'),
                 confirmed_at=b.start, bar_start=b.start, available_at=b.end, session='outside')
        return build_signals([e], [b], Rules())[0]

    def test_buy_rebound_and_fixed_stop(self):
        s = self.signals()
        self.assertEqual(s['status'], 'pending')
        self.assertEqual(s['sl'], D('149.79'))
        self.assertEqual(s['entry_due'], T)

    def test_sell_rebound_and_ask_stop(self):
        s = self.signals('sell', close='149.9')
        self.assertEqual(s['status'], 'pending')
        self.assertEqual(s['sl'], D('150.22'))

    def test_equal_level_doji_and_wrong_color_rejected(self):
        for changes in [dict(close='150'), dict(open='150.1'), dict(open='150.2')]:
            with self.subTest(changes=changes):
                self.assertEqual(self.signals(**changes)['status'], 'no_rebound')
        self.assertEqual(self.signals('sell', close='150')['status'], 'no_rebound')

    def test_other_ratios_are_audit_only(self):
        for ratio in ('0.382', '0.618'):
            self.assertEqual(self.signals(ratio=ratio)['status'], 'ratio_not_selected')

    def test_reject_unavailable_wave(self):
        b = Bar(T, T+timedelta(minutes=15), D(150), D(151), D(149), D('150.5'))
        e = dict(wave_id='w', direction='buy', ratio='0.500', level=D(150),
                 confirmed_at=b.end, bar_start=b.start, available_at=b.end, session='10-11')
        with self.assertRaises(ValueError):
            build_signals([e], [b], Rules())

    def test_invalid_rules(self):
        for changes in [dict(spread_pips='NaN'), dict(units=0), dict(hold_minutes=60.0),
                        dict(ratio='0.618'), dict(rr=3), dict(slippage_pips=-1)]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                Rules.from_config(changes)
