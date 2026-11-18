"""Rebuild DESCRIPTIONS.md: every video's title, description and pinned comment in copy boxes, in README order.
Run from the repo root after adding an upload file:  python3 tools/build_descriptions.py"""
import re, os
readme = open('README.md').read()
names = re.findall(r'\(uploads/([\w-]+)\.md\)', readme)
out = ['# Copy and paste: titles, descriptions and pinned comments', '',
       'Every video in upload order. Tap a box to copy it. The full upload settings are in each file in `uploads/`.', '']
for n, name in enumerate(names, 1):
    s = open(f'uploads/{name}.md').read()
    head = s.splitlines()[0].replace('# Upload: ', '')
    def block(label):
        m = re.search(r'\*\*' + re.escape(label) + r'\*\*\s*```\n(.*?)\n```', s, re.S)
        return m.group(1).strip() if m else ''
    pub = re.search(r'Publish: (.*)', s); pl = re.search(r'\*\*Playlist:\*\* (.*)', s)
    out += [f'## {n}. {head}', '', f'Video: [videos/{name}.mp4](videos/{name}.mp4) · Thumbnails: [vertical](thumbnails/{name}_vertical.png), [16:9](thumbnails/{name}_16x9.png)', '']
    for label in ('Title', 'Description', 'Pinned comment'):
        b = block(label)
        if b: out += [f'**{label}**', '```', b, '```', '']
    extra = []
    if pl: extra.append(f'Playlist: {pl.group(1).strip()}')
    if pub: extra.append(f'Publish: {pub.group(1).strip()}')
    if extra: out += [' · '.join(extra), '']
    out += ['---', '']
open('DESCRIPTIONS.md', 'w').write('\n'.join(out))
print('DESCRIPTIONS.md:', len(names), 'videos')
