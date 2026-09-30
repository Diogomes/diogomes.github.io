#!/usr/bin/env python3
"""Checagem estrutural das páginas: ids duplicados e tags desbalanceadas.

Uso: python3 scripts/check_html.py [arquivos...]   (sem argumentos: todas as páginas versionadas)
Sai com código 1 se encontrar problemas.
"""
import subprocess
import sys, collections
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','param'}
files = sys.argv[1:] or [f for f in subprocess.check_output(['git', 'ls-files', '*.html']).decode().split()
                         if not f.startswith('assets/vendor/')]
failed = 0
for f in files:
    ids=collections.Counter(); stack=[]; errs=[]
    class P(HTMLParser):
        def handle_starttag(s,t,a):
            d=dict(a)
            if 'id' in d: ids[d['id']]+=1
            if t not in VOID: stack.append((t,s.getpos()[0]))
        def handle_startendtag(s,t,a):
            d=dict(a)
            if 'id' in d: ids[d['id']]+=1
        def handle_endtag(s,t):
            if t in VOID: return
            if stack and stack[-1][0]==t: stack.pop(); return
            for i in range(len(stack)-1,-1,-1):
                if stack[i][0]==t:
                    for x in stack[i+1:]:
                        if x[0] not in ('p','li','td','tr','th','option'): errs.append(f'unclosed <{x[0]}> line {x[1]}')
                    del stack[i:]; return
            errs.append(f'stray </{t}> line {s.getpos()[0]}')
    P(convert_charrefs=True).feed(open(f).read())
    d=[k for k,v in ids.items() if v>1]
    if d: errs.append('duplicate ids: '+', '.join(d))
    for x in stack:
        if x[0] not in ('p','li','td','tr','th','option','html','body'): errs.append(f'unclosed <{x[0]}> line {x[1]}')
    if errs:
        failed += 1
        print(f + '\n  ' + '\n  '.join(errs[:15]))
print(f'{len(files) - failed}/{len(files)} páginas OK')
sys.exit(1 if failed else 0)
