from .ingest import parse_time


def boundaries(config):
    keys = ('start', 'development_end', 'validation_end', 'end')
    values = [parse_time(config[k]) for k in keys]
    if any(a >= b for a, b in zip(values, values[1:])):
        raise ValueError('Split boundaries must be strictly increasing')
    return dict(zip(keys, values))


def label(start, end, cuts):
    for name, a, b in [('development', cuts['start'], cuts['development_end']),
                       ('validation', cuts['development_end'], cuts['validation_end']),
                       ('holdout', cuts['validation_end'], cuts['end'])]:
        if a <= start < b and start <= end <= b:
            return name
    return 'boundary_or_outside'
