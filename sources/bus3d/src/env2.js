// ---------- props for the "bro IQ" reel ----------
function drawWindow(ctx, x, y, s, t, night = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -170, -210, 340, 420, 18); fillStroke(ctx, '#fff7e6', 10);
  ctx.save(); rrect(ctx, -145, -185, 290, 370, 8); ctx.clip();
  const g = ctx.createLinearGradient(0, -185, 0, 185);
  g.addColorStop(0, mix('#4fb4f0', '#1b2350', night)); g.addColorStop(1, mix('#d9f2ff', '#3a3270', night));
  ctx.fillStyle = g; ctx.fillRect(-150, -190, 300, 380);
  if (night < .5) { circle(ctx, 60, -80, 46); ctx.fillStyle = '#fff3b0'; ctx.fill(); drawCloud(ctx, -50 + Math.sin(t * .3) * 10, 40, 60, 3); }
  else { circle(ctx, 60, -80, 40); ctx.fillStyle = '#f4f0d8'; ctx.fill(); }
  ctx.restore();
  rrect(ctx, -145, -185, 290, 370, 8); fillStroke(ctx, null, 8);
  line(ctx, 0, -185, 0, 185, 12, '#fff7e6'); line(ctx, -145, 0, 145, 0, 12, '#fff7e6');
  ctx.restore();
}
function roomBG(ctx, cam, o = {}) {
  const fy = o.fy || 1180, t = o.t || 0;
  applyCam(ctx, cam, 1);
  const g = ctx.createLinearGradient(0, -600, 0, fy); g.addColorStop(0, o.wall || '#ffd36b'); g.addColorStop(1, o.wall2 || '#ffb347');
  ctx.fillStyle = g; ctx.fillRect(-1500, -1500, 4080, fy + 1500);
  ctx.fillStyle = 'rgba(255,255,255,.13)'; for (let x = -1500; x < 2600; x += 150) ctx.fillRect(x, -1500, 64, fy + 1500);
  if (o.window) drawWindow(ctx, o.window[0], o.window[1], o.window[2] || 1, t, o.night || 0);
  if (o.frame) {
    const [fx, fyy] = o.frame; rrect(ctx, fx - 95, fyy - 75, 190, 150, 8); fillStroke(ctx, '#fff7e6', 8);
    rrect(ctx, fx - 75, fyy - 55, 150, 110, 4); fillStroke(ctx, '#7fd3e0', 5);
    path(ctx, [[fx - 75, fyy + 55], [fx - 20, fyy - 10], [fx + 20, fyy + 30], [fx + 45, fyy + 5], [fx + 75, fyy + 55]]); fillStroke(ctx, '#3fa35b', 5);
  }
  const fg = ctx.createLinearGradient(0, fy, 0, fy + 900); fg.addColorStop(0, o.floor || '#c98a52'); fg.addColorStop(1, o.floor2 || '#9a6236');
  ctx.fillStyle = fg; ctx.fillRect(-1500, fy, 4080, 2000);
  ctx.strokeStyle = 'rgba(60,30,10,.25)'; ctx.lineWidth = 5;
  for (let i = 1; i < 9; i++) { const yy = fy + i * i * 14; ctx.beginPath(); ctx.moveTo(-1500, yy); ctx.lineTo(2600, yy); ctx.stroke(); }
  ctx.fillStyle = '#fff3dc'; ctx.fillRect(-1500, fy - 34, 4080, 34); line(ctx, -1500, fy - 34, 2600, fy - 34, 6); line(ctx, -1500, fy, 2600, fy, 6);
}
function iqMeter(ctx, x, y, s, val, flash = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const v = Math.round(val);
  const col = v > 80 ? '#2fae5a' : v > 30 ? '#f2a12a' : '#e0392f';
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  rrect(ctx, -250, -120, 500, 240, 44); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
  rrect(ctx, -250, -120, 500, 240, 44); fillStroke(ctx, null, 10);
  brain(ctx, -180, -20, 52, v > 30 ? '#ff9fb8' : '#c7a3ad');
  text(ctx, 'IQ', -112, -20, 66, INK, INK, 0, 'Poppins', 700, 'left');
  text(ctx, String(v), 222, -20, 108, col, INK, 9, 'Poppins', 700, 'right');
  rrect(ctx, -200, 62, 400, 30, 15); fillStroke(ctx, '#ececec', 6);
  const f = clamp(val / 100);
  if (f > 0) { rrect(ctx, -200, 62, 400 * f, 30, 15); fillStroke(ctx, col, 6); }
  if (flash > 0) { rrect(ctx, -250, -120, 500, 240, 44); ctx.fillStyle = `rgba(255,40,40,${.45 * flash})`; ctx.fill(); }
  ctx.restore();
}
function brain(ctx, x, y, r, col = '#ff9fb8') {
  ctx.save(); ctx.translate(x, y);
  const blobs = [[-.45, -.2, .5], [.05, -.42, .52], [.5, -.15, .48], [-.35, .3, .45], [.35, .3, .45], [0, .05, .5]];
  ctx.beginPath(); blobs.forEach(([bx, by, br]) => { ctx.moveTo(bx * r + br * r, by * r); ctx.arc(bx * r, by * r, br * r, 0, TAU); });
  ctx.lineWidth = r * .16; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); blobs.forEach(([bx, by, br]) => { ctx.moveTo(bx * r + br * r, by * r); ctx.arc(bx * r, by * r, br * r, 0, TAU); }); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = r * .08; ctx.strokeStyle = 'rgba(120,30,60,.6)'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -.8 * r); ctx.quadraticCurveTo(.15 * r, -.2 * r, -.05 * r, .6 * r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-.6 * r, -.1 * r); ctx.quadraticCurveTo(-.3 * r, .05 * r, -.45 * r, .35 * r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(.6 * r, -.05 * r); ctx.quadraticCurveTo(.3 * r, .1 * r, .45 * r, .4 * r); ctx.stroke();
  ctx.restore();
}
// speech bubble; k = pop progress 0..1, tail = [dx, dy] from the bubble centre to the speaker's mouth
function bubble(ctx, x, y, str, size, tail, k = 1, fill = '#fff', tcol = INK) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); const sc = backOut(clamp(k)); ctx.scale(sc, sc);
  ctx.font = `700 ${size}px Poppins`; const w = ctx.measureText(str).width + size * 1.0, h = size * 1.55;
  const tp = () => { ctx.beginPath(); ctx.moveTo(-w * .12, h * .3); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(w * .12, h * .3); ctx.closePath(); };
  tp(); fillStroke(ctx, fill, size * .11);
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2); fillStroke(ctx, fill, size * .11);
  tp(); ctx.fillStyle = fill; ctx.fill();
  text(ctx, str, 0, size * .04, size, tcol, INK, 0);
  ctx.restore();
}
// floating red damage number; p = seconds since it appeared
function minusPop(ctx, x, y, str, p, size = 130, col = '#ff3b3b') {
  if (p < 0 || p > 1.4) return;
  const a = 1 - inv(.9, 1.4, p); const sc = backOut(clamp(p / .18));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y - p * 110); ctx.scale(sc, sc); ctx.rotate(-.08);
  text(ctx, str, 0, 0, size, col, INK, size * .12); ctx.restore();
}
function drawPhone(ctx, x, y, s, bat, t = 0, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -130, -250, 260, 500, 40); fillStroke(ctx, '#2b2730', 10);
  rrect(ctx, -110, -222, 220, 444, 24); ctx.fillStyle = '#d8f1ff'; ctx.fill();
  rrect(ctx, -40, -238, 80, 14, 7); ctx.fillStyle = '#111'; ctx.fill();
  const col = bat > 50 ? '#2fae5a' : bat > 20 ? '#f2a12a' : '#e0392f';
  rrect(ctx, -70, -60, 140, 70, 12); fillStroke(ctx, '#fff', 8); rrect(ctx, 70, -38, 14, 26, 4); fillStroke(ctx, INK, 0);
  ctx.fillStyle = INK; ctx.fillRect(70, -36, 12, 22);
  rrect(ctx, -60, -50, 120 * clamp(bat / 100), 50, 6); ctx.fillStyle = col; ctx.fill();
  text(ctx, `${Math.round(bat)}%`, 0, 70, 64, col, INK, 7);
  ctx.restore();
}
function drawDoor(ctx, x, y, s, label = 'PULL', bump = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -230, -760, 460, 760, 10); fillStroke(ctx, '#fff3dc', 10);
  ctx.save(); ctx.translate(0, 0); ctx.rotate(bump * .01);
  rrect(ctx, -195, -725, 390, 725, 6); fillStroke(ctx, '#a8602e', 9);
  for (const yy of [-660, -330]) { rrect(ctx, -140, yy, 280, 260, 10); fillStroke(ctx, '#bd7238', 7); }
  shadeShape(ctx, () => rrect(ctx, -195, -725, 390, 725, 6), 1, .15, .3, [-195, -725, 390, 725]);
  rrect(ctx, 120, -430, 30, 110, 14); fillStroke(ctx, '#e8c04a', 6);
  rrect(ctx, -110, -470, 220, 90, 12); fillStroke(ctx, '#fff', 7);
  text(ctx, label, 0, -423, 66, '#e0392f', INK, 0);
  ctx.restore(); ctx.restore();
}
function drawToaster(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const pop = o.pop || 0;
  for (const tx of [-70, 70]) { rrect(ctx, tx - 55, -300 - pop * 180, 110, 150, 30); fillStroke(ctx, '#e7b46a', 8); rrect(ctx, tx - 42, -287 - pop * 180, 84, 120, 22); ctx.fillStyle = '#f6d9a0'; ctx.fill(); }
  ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
  rrect(ctx, -230, -260, 460, 260, 70); ctx.fillStyle = '#c4d0db'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rrect(ctx, -230, -260, 460, 260, 70); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-200, -240, 60, 230); ctx.fillStyle = 'rgba(40,50,70,.15)'; ctx.fillRect(110, -270, 140, 280); ctx.restore();
  rrect(ctx, -230, -260, 460, 260, 70); fillStroke(ctx, null, 9);
  for (const tx of [-70, 70]) { rrect(ctx, tx - 60, -268, 120, 20, 10); fillStroke(ctx, '#3a3440', 6); }
  rrect(ctx, 230, -170 + pop * 70, 50, 26, 10); fillStroke(ctx, '#2b2730', 6);
  // angry face
  const ang = o.angry || 0;
  for (const side of [-1, 1]) {
    circle(ctx, side * 75, -135, 26); fillStroke(ctx, '#fff', 6);
    circle(ctx, side * 75 + (o.look || 0) * 8, -132, 12); ctx.fillStyle = INK; ctx.fill();
    ctx.save(); ctx.translate(side * 75, -182); ctx.rotate(side * .35 * ang); line(ctx, -32, 0, 32, 0, 11); ctx.restore();
  }
  const mo = o.mouth || 0;
  ellipse(ctx, 0, -62, 42, 10 + mo * 26); fillStroke(ctx, '#5a1e24', 7);
  rrect(ctx, -190, -10, 60, 30, 10); fillStroke(ctx, '#2b2730', 6); rrect(ctx, 130, -10, 60, 30, 10); fillStroke(ctx, '#2b2730', 6);
  ctx.restore();
}
function drawCouch(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -330, -330, 660, 230, 50); fillStroke(ctx, '#3fa38f', 9);
  rrect(ctx, -300, -160, 600, 130, 30); fillStroke(ctx, '#4fbca6', 9);
  for (const side of [-1, 1]) { rrect(ctx, side * 330 - 60, -250, 120, 230, 50); fillStroke(ctx, '#368f7d', 9); }
  for (const lx of [-280, 280]) { rrect(ctx, lx - 14, -30, 28, 30, 6); fillStroke(ctx, '#4a2c1c', 6); }
  ctx.restore();
}
function drawGlasses(ctx, hx, hy, s, shine = 0) {
  const ex = .072 * s, r = .058 * s, y = hy - .005 * s;
  ctx.lineWidth = .016 * s; ctx.strokeStyle = INK;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(hx + side * ex - r, y - r * .8, r * 2, r * 1.6, r * .4); ctx.stroke(); }
  line(ctx, hx - ex + r, y - r * .2, hx + ex - r, y - r * .2, .014 * s);
  if (shine > 0) sparkle(ctx, hx + ex + r * .4, y - r * .6, r * 1.2 * shine, shine);
}
function confetti(ctx, t, n = 40, seed = 9) {
  const R = rng(seed); const cols = ['#ff3b3b', '#2fae5a', '#2f63c9', '#f2b52a', '#ff9fb8', '#7a4bc4'];
  for (let i = 0; i < n; i++) {
    const x0 = R() * 1080, v = 250 + R() * 300, ph = R() * 3, c = cols[i % cols.length];
    const y = -60 + ((t + ph) * v) % 2000, x = x0 + Math.sin(t * 2 + i) * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 + i); ctx.fillStyle = c; ctx.fillRect(-12, -6, 24, 12); ctx.restore();
  }
}
function flashScreen(ctx, a, col = '#fff') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function bigLabel(ctx, str, x, y, size, col = '#fff', k = 1) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); const sc = backOut(clamp(k)); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  text(ctx, str, 0, 0, size, col, INK, size * .13); ctx.shadowColor = 'transparent'; text(ctx, str, 0, 0, size, col, INK, 0); ctx.restore();
}

const flashAt = (lt, h, d = .45) => lt < h ? 0 : 1 - inv(h, h + d, lt);
function handOverMouth(ctx, x, y, s, k = 1) {
  if (k <= 0) return; const m = [x + .01 * s, y - .675 * s];
  ctx.save(); ctx.translate(m[0], m[1] + (1 - k) * .25 * s);
  line(ctx, .02 * s, .02 * s, .16 * s, .2 * s, .028 * s);
  ellipse(ctx, 0, .005 * s, .042 * s, .028 * s); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}
