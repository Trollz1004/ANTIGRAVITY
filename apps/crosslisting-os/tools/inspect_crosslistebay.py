import csv
from collections import Counter
from pathlib import Path

path = Path('/home/ubuntu/upload/crosslistebay')
with path.open('r', encoding='utf-8', newline='') as f:
    rows = list(csv.DictReader(f))

fields = ['UPC', 'Title', 'ImageURL']
print(f'rows: {len(rows)}')
print(f'headers: {", ".join(rows[0].keys()) if rows else "none"}')
for field in fields:
    blanks = [index + 2 for index, row in enumerate(rows) if not (row.get(field) or '').strip()]
    values = [(row.get(field) or '').strip() for row in rows]
    duplicates = sum(count - 1 for value, count in Counter(values).items() if value and count > 1)
    print(f'blank_{field}: {len(blanks)}' + (f' (line {", ".join(map(str, blanks[:10]))})' if blanks else ''))
    print(f'duplicate_{field}_records: {duplicates}')

bad_upcs = [row['UPC'] for row in rows if not row['UPC'].isdigit() or len(row['UPC']) not in range(11, 15)]
placeholder_titles = sum(row['Title'].startswith('DVD Title for UPC ') for row in rows)
example_urls = sum(row['ImageURL'].startswith('https://example.com/images/') for row in rows)
print(f'bad_upc_records: {len(bad_upcs)}')
print(f'placeholder_title_records: {placeholder_titles}')
print(f'example_com_image_url_records: {example_urls}')
print('last_three_rows:')
for row in rows[-3:]:
    print(row)

# Detect structural anomalies supplied by DictReader.
with path.open('r', encoding='utf-8', newline='') as f:
    raw_reader = csv.reader(f)
    header = next(raw_reader)
    malformed = [(idx + 2, len(record), record) for idx, record in enumerate(raw_reader) if len(record) != len(header)]
print(f'malformed_row_count: {len(malformed)}')
for item in malformed[:5]:
    print(f'malformed: line={item[0]}, fields={item[1]}, data={item[2]}')
