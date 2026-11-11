# 3D source: "Why manhole covers are round"

2D stick characters (canvas billboards) inside a three.js world, built on the zach-d-films engine from
https://github.com/artemnovitckii/claude-animation-skills (MIT).

- `src/shots.js`: the 5 shots (street, night workshop, truck street, explainer studio, payoff), world builders and the billboard characters.
- `src/data.js`: captions, duration and the voice amplitude array (generated from `audio/vo.wav`).
- `src/lib.js`, `src/chars.js`: the 2D stick rig (with glove hands and the talking mouth).
- `audio.py`: SFX and music cues; writes `audio/mix.wav`.

Render (no GPU): copy this folder over `skills/zach-d-films/engine`, link `kit/node_modules`, then
`GL=swiftshader CHROME=/opt/pw-browsers/chromium node render.mjs video silent.mp4 30 <from> <to>` (about 1 to 2 s a frame; run 4 ranges in parallel).
