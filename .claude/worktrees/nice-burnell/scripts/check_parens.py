import sys
from pathlib import Path

p = Path('start_app.bat')
if not p.exists():
    p = Path('c:/Users/neytq/CURSA/start_app.bat')
text = p.read_text(encoding='utf-8')

stack = []
line_num = 1
errors = []
inside_single = False
inside_double = False
inside_rem = False
for i, ch in enumerate(text):
    if ch == '\n':
        line_num += 1
        inside_rem = False
        inside_single = False
        inside_double = False
        continue
    # handle rem style comments: 'rem ' at start of line
    # We approximate: if 'rem' at start of line (after whitespace), skip until newline
    # This is complex; we'll ignore for now
    if ch == '"' and not inside_single:
        inside_double = not inside_double
        continue
    if ch == "'" and not inside_double:
        inside_single = not inside_single
        continue
    if inside_single or inside_double:
        continue
    if ch == '(':
        stack.append((ch, line_num))
    elif ch == ')':
        if not stack:
            errors.append((line_num, 'unmatched )'))
        else:
            stack.pop()

for l, reason in errors:
    print(f"Error {reason} at line {l}")
if stack:
    for ch, ln in stack:
        print(f"Unmatched ( at line {ln}")
else:
    print('Parentheses seem balanced')
