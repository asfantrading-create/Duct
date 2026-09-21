#!/usr/bin/env python3
"""Builds the app icon (build/icon.png 512x512 + build/icon.ico) and a square
logo mark (assets/logo-mark.png) from the ASFAN logo (assets/logo.png)."""
from PIL import Image
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logo = Image.open(os.path.join(root, 'assets', 'logo.png')).convert('RGBA')
w, h = logo.size
# The hexagonal mark occupies the left part of the wordmark; find its bounding box
# by scanning alpha for the first fully transparent column gap after the mark.
alpha = logo.split()[-1]
cols = [max(alpha.crop((x, 0, x + 1, h)).getdata()) for x in range(w)]
start = next(i for i, c in enumerate(cols) if c > 10)
x = start
while x < w and cols[x] > 10:
    x += 1
end = x
mark = logo.crop((start, 0, end, h))
bbox = mark.getbbox()
mark = mark.crop(bbox)
mw, mh = mark.size
side = int(max(mw, mh) * 1.18)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
canvas.paste(mark, ((side - mw) // 2, (side - mh) // 2), mark)
canvas.save(os.path.join(root, 'assets', 'logo-mark.png'))
icon = canvas.resize((512, 512), Image.LANCZOS)
os.makedirs(os.path.join(root, 'build'), exist_ok=True)
icon.save(os.path.join(root, 'build', 'icon.png'))
icon.save(os.path.join(root, 'build', 'icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
# also a 256 png for the renderer
icon.resize((256, 256), Image.LANCZOS).save(os.path.join(root, 'assets', 'icon-256.png'))
print('mark bbox', start, end, bbox, 'icon written')
