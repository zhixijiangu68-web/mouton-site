"""Convert a supplied HISTDATA MetaTrader M1 ZIP to standard CSV (no download)."""
import argparse
import csv
import hashlib
import io
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zipfile import ZipFile

EST_FIXED = timezone(timedelta(hours=-5))
SPEC = 'https://www.histdata.com/f-a-q/data-files-detailed-specification/'


def convert(source, output, start=None, end=None):
    if (start is None) != (end is None):
        raise ValueError('Specify both start and end, or neither')
    if start is not None and (start.tzinfo is None or end.tzinfo is None or start >= end):
        raise ValueError('Expected increasing timezone-aware range')
    count = 0
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(source) as archive:
        names = [n for n in archive.namelist() if Path(n).name.startswith('DAT_MT_USDJPY_M1_') and n.lower().endswith('.csv')]
        if len(names) != 1:
            raise ValueError('Expected exactly one USDJPY MetaTrader M1 CSV member')
        with archive.open(names[0]) as raw, output.open('w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, lineterminator='\n')
            writer.writerow(['timestamp','open','high','low','close'])
            for line, row in enumerate(csv.reader(io.TextIOWrapper(raw, encoding='utf-8-sig')),1):
                if len(row) != 7:
                    raise ValueError(f'MetaTrader line {line}: expected seven columns')
                t = datetime.strptime(row[0]+' '+row[1], '%Y.%m.%d %H:%M').replace(tzinfo=EST_FIXED)
                # Read only dates outside the requested development window, not prices.
                if start is not None and not start <= t < end:
                    continue
                writer.writerow([t.isoformat(), *row[2:6]])
                count += 1
    metadata = {'source_zip': source.name, 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'member': names[0], 'rows':count, 'price_type':'bid','source_offset':'-05:00 fixed, no DST',
                'official_specification':SPEC, 'start':start.isoformat() if start else None,
                'end':end.isoformat() if end else None,
                'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    output.with_suffix('.manifest.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
    return metadata


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--start',type=datetime.fromisoformat)
    parser.add_argument('--end',type=datetime.fromisoformat)
    a=parser.parse_args()
    print(json.dumps(convert(a.zip,a.output,a.start,a.end),indent=2))
