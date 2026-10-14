import unittest
from dataclasses import replace
from datetime import timedelta
from decimal import Decimal as D
from research.usdjpy.model import Bar
from research.usdjpy.trade_model import Rules
from research.usdjpy.execution import enter, exit_at_open, exit_intrabar
from research.usdjpy.tests.test_signals import T


def minute(i=0, o='150', h='150.001', l='149.999', c='150'):
    return Bar(T+timedelta(minutes=i), T+timedelta(minutes=i+1), *map(D, (o,h,l,c)))


def signal(direction='buy', at=T, wave='w', sl=None):
    return dict(signal_id=f'{wave}:{direction}:{at.isoformat()}', wave_id=wave, direction=direction,
                ratio='0.500', available_at=at, entry_due=at, status='pending',
                sl=D(sl or ('149.9' if direction == 'buy' else '150.1')))


class ExecutionTest(unittest.TestCase):
    def setUp(self):
        self.r = Rules()
        self.buy, _ = enter(signal(), minute(), self.r, 'T1')
        self.sell, _ = enter(signal('sell'), minute(), self.r, 'T2')

    def test_entry_and_2r_hand_calculation(self):
        self.assertEqual(self.buy['entry_fill'], D('150.011'))
        self.assertEqual(self.buy['risk_price'], D('.111'))
        self.assertEqual(self.buy['tp'], D('150.233'))
        self.assertEqual(self.sell['entry_fill'], D('149.999'))
        self.assertEqual(self.sell['risk_price'], D('.101'))
        self.assertEqual(self.sell['tp'], D('149.797'))

    def test_equal_bid_round_trip_cost_both_directions(self):
        for t in (self.buy, self.sell):
            result = exit_at_open(t, minute(60), self.r)
            self.assertEqual(result['net_pnl_jpy'], D('-12'))
            self.assertEqual(result['gross_bid_pnl_jpy'], 0)
            self.assertEqual(result['total_cost_jpy'], D('12'))
            self.assertEqual(result['spread_cost_jpy']+result['slippage_cost_jpy'], D('12'))

    def test_intrabar_tp_and_sl_buy(self):
        tp = exit_intrabar(self.buy, minute(h='150.24'), self.r)
        sl = exit_intrabar(self.buy, minute(l='149.9'), self.r)
        self.assertEqual(tp['exit_reason'], 'tp')
        self.assertEqual(tp['net_pnl_jpy'], D('222'))
        self.assertEqual(tp['net_r'], 2)
        self.assertEqual(sl['exit_fill'], D('149.899'))
        self.assertEqual(sl['net_pnl_jpy'], D('-112'))
        self.assertIsNone(sl['exit_at'])
        self.assertEqual(sl['exit_timing'], 'intrabar')

    def test_sell_uses_ask_and_both_touch_choose_sl(self):
        # Bid never reaches SL=150.1, but Ask reaches it.
        t = exit_intrabar(self.sell, minute(h='150.09'), self.r)
        self.assertEqual(t['exit_reason'], 'sl')
        self.assertEqual(t['exit_fill'], D('150.101'))
        t = exit_intrabar(self.sell, minute(h='150.09', l='149.78'), self.r)
        self.assertTrue(t['ambiguous_intrabar'])
        t = exit_intrabar(self.buy, minute(h='150.24', l='149.9'), self.r)
        self.assertEqual(t['exit_reason'], 'sl')
        self.assertTrue(t['ambiguous_intrabar'])

    def test_sell_tp_ask_threshold(self):
        self.assertIsNone(exit_intrabar(self.sell, minute(l='149.797'), self.r))
        t = exit_intrabar(self.sell, minute(l='149.787'), self.r)
        self.assertEqual(t['exit_fill'], D('149.797'))
        self.assertEqual(t['net_r'], 2)

    def test_gap_sl_unfavorable_and_tp_no_improvement(self):
        for trade, stop_open, tp_open in [(self.buy, '149.8', '150.5'), (self.sell, '150.2', '149.5')]:
            s = exit_at_open(trade, minute(o=stop_open), self.r)
            p = exit_at_open(trade, minute(o=tp_open), self.r)
            self.assertEqual(s['exit_reason'], 'sl')
            self.assertLess(s['net_r'], -1)
            self.assertEqual(p['exit_fill'], trade['tp'])

    def test_time_exit_ignores_later_extremes_and_open_stop_priority(self):
        t = exit_at_open(self.buy, minute(60,h='160',l='140'), self.r)
        self.assertEqual(t['exit_reason'], 'time')
        self.assertEqual(t['exit_fill'], D('149.999'))
        t = exit_at_open(self.buy, minute(60,o='149.8'), self.r)
        self.assertEqual(t['exit_reason'], 'sl')

    def test_entry_stop_crossed_rejected(self):
        for direction, sl in [('buy','150'),('sell','150.01')]:
            t, reason = enter(signal(direction, sl=sl), minute(), self.r, 'T')
            self.assertIsNone(t)
            self.assertEqual(reason, 'sl_crossed_at_entry')

    def test_commission_no_double_charge(self):
        r = replace(self.r, commission_per_side_jpy=D(2))
        t, _ = enter(signal(), minute(), r, 'T')
        result = exit_at_open(t, minute(60), r)
        self.assertEqual(result['net_pnl_jpy'], D('-16'))
        self.assertEqual(result['total_cost_jpy'], D('16'))
