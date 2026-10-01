#!/usr/bin/env python3
"""Build a fully offline editor from readable source files (Python standard library only)."""
from pathlib import Path
import json
root = Path(__file__).resolve().parent
src = root / 'src'
core = (src / 'core.js').read_text()
game = (src / 'game.js').read_text()
game_css = (src / 'game.css').read_text()
# Escaping < prevents user data and source strings from closing the containing script.
bundle = 'const BUNDLE=' + json.dumps({'core': core, 'game': game, 'css': game_css}, ensure_ascii=False).replace('<', '\\u003c') + ';'
html = (src / 'shell.html').read_text()
for key, value in {'GAME_CSS': game_css, 'EDITOR_CSS': (src/'editor.css').read_text(), 'CORE': core, 'GAME': game, 'BUNDLE': bundle, 'EDITOR': (src/'editor.js').read_text()}.items():
    html = html.replace('/*__'+key+'__*/', value)
(root/'index.html').write_text(html)
print(f'index.html: {len(html.encode()):,} bytes')
