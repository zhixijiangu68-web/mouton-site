"""Frozen baseline settings. Prices and account amounts stay Decimal."""
from dataclasses import dataclass
from decimal import Decimal as D

PIP = D('0.01')


@dataclass(frozen=True)
class Rules:
    version: str = 'fib50-rebound-v1'
    ratio: str = '0.500'
    spread_pips: D = D('1.0')
    slippage_pips: D = D('0.1')
    sl_buffer_pips: D = D('1.0')
    rr: D = D('2')
    hold_minutes: int = 60
    units: D = D('1000')
    initial_equity_jpy: D = D('1000000')
    commission_per_side_jpy: D = D('0')

    def __post_init__(self):
        if self.version != 'fib50-rebound-v1' or self.ratio != '0.500':
            raise ValueError('Only the frozen Fib 50% baseline is implemented')
        if type(self.hold_minutes) is not int or self.hold_minutes != 60 or self.rr != 2:
            raise ValueError('Baseline requires 60 minutes and 2R')
        for key in ('spread_pips', 'slippage_pips', 'sl_buffer_pips', 'rr',
                    'units', 'initial_equity_jpy', 'commission_per_side_jpy'):
            value = getattr(self, key)
            if not isinstance(value, D) or not value.is_finite() or value < 0:
                raise ValueError(f'{key} must be a finite nonnegative Decimal')
        if min(self.units, self.initial_equity_jpy, self.sl_buffer_pips) <= 0:
            raise ValueError('Units, capital and SL buffer must be positive')

    @classmethod
    def from_config(cls, config):
        values = dict(config)
        for key in cls.__dataclass_fields__:
            if key in values and key not in ('version', 'ratio', 'hold_minutes'):
                values[key] = D(str(values[key]))
        return cls(**values)

    @property
    def spread(self):
        return self.spread_pips * PIP

    @property
    def slip(self):
        return self.slippage_pips * PIP
