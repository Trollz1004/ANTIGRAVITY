import pandas as pd
from pathlib import Path

xlsx_path = Path('/home/ubuntu/upload/High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344(1).xlsx')
out_path = Path('/home/ubuntu/workbook_keyword_hits.txt')
keywords = ['meta', 'facebook', 'instagram', 'ad', 'ads', 'creative', 'image', 'copy', 'launch', 'content', 'signup', 'signups']

xl = pd.ExcelFile(xlsx_path)
lines = []
for sheet in xl.sheet_names:
    df = pd.read_excel(xlsx_path, sheet_name=sheet, header=None).fillna('')
    hits = []
    for i, row in df.iterrows():
        row_text = ' | '.join(str(v) for v in row.tolist())
        row_lower = row_text.lower()
        matched = sorted({k for k in keywords if k in row_lower})
        if matched:
            hits.append((i + 1, matched, row_text))
    if hits:
        lines.append(f'## Sheet: {sheet}')
        for idx, matched, text in hits[:40]:
            lines.append(f'Row {idx} | keywords={", ".join(matched)}')
            lines.append(text)
            lines.append('')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(out_path)
