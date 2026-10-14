import unittest
from decimal import Decimal as D
from research.usdjpy.metrics import summarize


def trade(pnl):
    return dict(status='closed',net_pnl_jpy=D(pnl),net_pips=D(pnl)/10,net_r=D(pnl)/100,
                holding_minutes_min=10,holding_minutes_max=11,exit_reason='time',
                ambiguous_intrabar=False,total_cost_jpy=D(12))


class MetricsTest(unittest.TestCase):
    def test_hand_calculated_sequence(self):
        m = summarize([trade(p) for p in (200,-100,-50,0,-100,150)],[])
        self.assertEqual(m['profit_factor'],D('1.4'))
        self.assertEqual(m['trades'],6)
        self.assertEqual(m['win_rate'],D(2)/6)
        self.assertEqual(m['expectancy_jpy'],D(100)/6)
        self.assertEqual(m['expectancy_r'],D(1)/6)
        self.assertEqual(m['max_consecutive_losses'],2)
        self.assertEqual(m['total_cost_jpy'],72)

    def test_no_trades_all_wins_all_losses(self):
        empty = summarize([],[])
        self.assertIsNone(empty['profit_factor'])
        self.assertIsNone(empty['win_rate'])
        self.assertIsNone(empty['expectancy_jpy'])
        wins = summarize([trade(100)],[])
        self.assertIsNone(wins['profit_factor'])
        self.assertEqual(wins['pf_undefined_reason'],'no_losses')
        losses = summarize([trade(-100),trade(-10)],[])
        self.assertEqual(losses['profit_factor'],0)
        self.assertEqual(losses['max_consecutive_losses'],2)
