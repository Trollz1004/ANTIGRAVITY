import pandas as pd
from pathlib import Path

xlsx_path = Path('/home/ubuntu/upload/High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344(1).xlsx')
out_path = Path('/home/ubuntu/workbook_inspection.txt')

xl = pd.ExcelFile(xlsx_path)
lines = []
lines.append(f'Workbook: {xlsx_path.name}')
lines.append(f'Sheets: {len(xl.sheet_names)}')
lines.append('')

for sheet in xl.sheet_names:
    df = pd.read_excel(xlsx_path, sheet_name=sheet)
    lines.append(f'## Sheet: {sheet}')
    lines.append(f'Rows: {len(df)} | Columns: {len(df.columns)}')
    lines.append('Columns: ' + ' | '.join(str(c) for c in df.columns))
    preview = df.head(8).fillna('')
    if not preview.empty:
        lines.append(preview.to_markdown(index=False))
    else:
        lines.append('[Empty sheet]')
    lines.append('')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(out_path)
