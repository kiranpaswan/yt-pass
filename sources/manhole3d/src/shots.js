// "Why manhole covers are round": 2D stick characters (canvas billboards) in a 3D world
import * as THREE from 'three';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, clamp, range, V, cam, place, shake } from './anim.js';
import { glowSprite, sparks } from './props.js';
import { DURATION as DUR, CAPTIONS as CAPS, AMP } from './data.js';
export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [[10.5, 10.62, 10.66, 10.8], [12.5, 12.6, 12.64, 12.75]];

const amp = t => { const i = Math.floor(t * 60); return i >= 0 && i < AMP.length ? AMP[i] : 0; };
const blink = (t, s = 0) => { const p = 2.7 + (s * .41) % 1.1, ph = (t + s * 1.7) % p; return ph < .13 ? Math.sin(ph / .13 * Math.PI) : 0; };
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, ...o });

// ---------- 2D characters as camera-facing billboards ----------
const PX = 0.00241;              // metres per canvas pixel (character ~1.75 m tall)
const CW = 512, CH = 900, FX = 256, FY = 860, FS = 760;
function hardHat(ctx, hx, hy, r) {
  ctx.beginPath(); ctx.arc(hx, hy - r * .08, r * 1.03, Math.PI + .15, -.15); ctx.closePath(); fillStroke(ctx, '#ffd23a', r * .07);
  rrect(ctx, hx - r * 1.25, hy - r * .22, r * 2.5, r * .2, r * .1); fillStroke(ctx, '#ffd23a', r * .07);
  line(ctx, hx, hy - r * 1.05, hx, hy - r * .3, r * .06);
}
function bossLook(ctx, x, y, s, hx, hy, r) {
  ctx.beginPath(); ctx.arc(hx, hy, r * 1.02, Math.PI + .4, -.4); ctx.quadraticCurveTo(hx + r * .2, hy - r * .5, hx - r * .9, hy - r * .4); ctx.closePath(); fillStroke(ctx, '#2b2230', r * .06);
}
function tie(ctx, x, y, s) { path(ctx, [[x - .03 * s, y - .6 * s], [x + .03 * s, y - .6 * s], [x + .035 * s, y - .38 * s], [x, y - .33 * s], [x - .035 * s, y - .38 * s]]); fillStroke(ctx, '#e0392f', .01 * s); }
const LOOKS = {
  gus: { cols: ['#ff8a1f', '#f2e14d'], hat: 'none', belt: false, extra: (c, x, y, s, hx, hy, r) => hardHat(c, hx, hy, r) },
  boss: { cols: ['#2a3f8f', '#2a3f8f'], hat: 'none', belt: false, extra: (c, x, y, s, hx, hy, r) => { bossLook(c, x, y, s, hx, hy, r); tie(c, x, y, s); } },
  walker: { cols: ['#7a4bc4', '#7a4bc4'], hat: 'none', belt: false },
};
function makeChar(look) {
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(CW * PX, CH * PX), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .05, side: THREE.DoubleSide, toneMapped: false }));
  plane.position.set(0, CH * PX / 2 - (CH - FY) * PX, 0);
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(.32, 32), new THREE.MeshBasicMaterial({ color: 0x10141c, transparent: true, opacity: .28, depthWrite: false }));
  shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = .012; shadowDisc.scale.set(1, .55, 1);
  const g = new THREE.Group(); g.add(plane, shadowDisc);
  const L = LOOKS[look];
  g.draw = (t, o = {}, camera) => {
    ctx.clearRect(0, 0, CW, CH);
    const sq = (o.sq || 1) * (1 + Math.sin(t * 2.4 + (o.seed || 0)) * .006);
    const face = Object.assign({ eyes: 'normal', blink: blink(t, o.seed || 0), mouth: 'smile' }, o.face || {});
    drawStick(ctx, Object.assign({}, L, { x: FX, y: FY, s: FS, squash: sq, lean: o.lean || 0, flip: o.flip || 1, shadow: false, hands: true,
      headTilt: o.tilt != null ? o.tilt : Math.sin(t * 1.3 + (o.seed || 0)) * .04, arms: o.arms, legs: o.legs, handPose: o.hand, face }));
    const hx = FX, hy = FY - .765 * FS * sq, r = .19 * FS;
    if (L.extra) L.extra(ctx, FX, FY, FS, hx, hy, r);
    if (o.over) o.over(ctx, hx, hy, r);
    tex.needsUpdate = true;
    if (camera) g.rotation.y = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
    shadowDisc.visible = o.shadow !== false;
  };
  return g;
}
const faceCam = (list, c) => list.forEach(g => { g.rotation.y = Math.atan2(c.position.x - g.position.x, c.position.z - g.position.z); });
const walkLegs = (t, sp = 9, a = .5) => ({ L: [Math.sin(t * sp) * a + .05, -Math.max(0, Math.sin(t * sp + 1)) * .7], R: [-Math.sin(t * sp) * a + .05, -Math.max(0, -Math.sin(t * sp + 1)) * .7] });
const walkArms = (t, sp = 9, a = .55) => ({ L: [.3 - Math.sin(t * sp) * a, -.35], R: [.3 + Math.sin(t * sp) * a, -.35] });

// ---------- world pieces ----------
function canvasTex(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const coverTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#41464f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2b2f36'; g.lineWidth = 10; for (let i = 24; i < w; i += 36) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } g.fillStyle = '#5a606b'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('CITY', w / 2, h / 2 + 14); });
const ironMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: .55, metalness: .55 });
const ironSide = new THREE.MeshStandardMaterial({ color: 0x3a3e46, roughness: .6, metalness: .5 });
function squareCover(side = .86) { const m = new THREE.Mesh(new THREE.BoxGeometry(side, .05, side), [ironSide, ironSide, ironMat, ironSide, ironSide, ironSide]); m.castShadow = true; return m; }
function roundCover(r = .43) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .05, 64), [ironSide, ironMat, ironMat]); m.castShadow = true; return m; }

// street with real holes (pits under them) plus sidewalk and buildings
function makeStreet(scene, holes, o = {}) {
  const shape = new THREE.Shape(); shape.moveTo(-30, -30); shape.lineTo(30, -30); shape.lineTo(30, 30); shape.lineTo(-30, 30); shape.closePath();
  holes.forEach(h => {
    const p = new THREE.Path();
    if (h.type === 'sq') { const s = h.size / 2; p.moveTo(h.x - s, -h.z - s); p.lineTo(h.x + s, -h.z - s); p.lineTo(h.x + s, -h.z + s); p.lineTo(h.x - s, -h.z + s); p.closePath(); }
    else p.absarc(h.x, -h.z, h.size / 2, 0, Math.PI * 2, true);
    shape.holes.push(p);
    const pit = new THREE.Mesh(h.type === 'sq' ? new THREE.BoxGeometry(h.size, 3, h.size) : new THREE.CylinderGeometry(h.size / 2, h.size / 2, 3, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.BackSide }));
    pit.position.set(h.x, -1.5, h.z); scene.add(pit);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(h.size, h.size), new THREE.MeshBasicMaterial({ color: 0x050506 })); floor.rotation.x = -Math.PI / 2; floor.position.set(h.x, -2.9, h.z); scene.add(floor);
    const rim = h.type === 'sq' ? new THREE.Mesh(new THREE.BoxGeometry(h.size + .1, .02, h.size + .1), ironSide) : new THREE.Mesh(new THREE.RingGeometry(h.size / 2, h.size / 2 + .06, 48), ironSide);
    if (h.type === 'sq') { const inner = new THREE.Mesh(new THREE.BoxGeometry(h.size, .03, h.size), new THREE.MeshBasicMaterial({ color: 0x07080a })); rim.add(inner); } else rim.rotation.x = -Math.PI / 2;
    rim.position.set(h.x, .006, h.z); if (h.type !== 'sq') scene.add(rim);
  });
  const asphalt = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), std(o.asphalt || 0x4b4f58, { roughness: .95 }));
  asphalt.rotation.x = -Math.PI / 2; asphalt.receiveShadow = true; scene.add(asphalt);
  if (!o.noDash) for (let x = -14; x < 14; x += 2.4) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, .01, .12), std(0xf2c230)); d.position.set(x, .005, 2.2); scene.add(d); }
  const walk = new THREE.Mesh(new THREE.BoxGeometry(60, .18, 3), std(0xc9c3b8)); walk.position.set(0, .09, -3.2); walk.receiveShadow = true; scene.add(walk);
  const cols = [0xc4553c, 0xe0b45a, 0x7fb3d5, 0xb0703c, 0x9fc89a, 0xd98a8a];
  for (let i = -6; i <= 6; i++) {
    const h = 4 + ((i * 37 + 11) % 5) * 1.3, w = 3.6;
    const win = canvasTex(128, 256, (g, W, H) => { g.fillStyle = '#' + cols[(i + 12) % cols.length].toString(16).padStart(6, '0'); g.fillRect(0, 0, W, H); g.fillStyle = o.night ? '#ffd27a' : '#bfe3f7'; for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) g.fillRect(18 + c * 58, 16 + r * 40, 34, 26); });
    win.wrapS = win.wrapT = THREE.RepeatWrapping; win.repeat.set(1, h / 4);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), std(0xffffff, { map: win })); b.position.set(i * w, h / 2, -6.3); b.receiveShadow = true; scene.add(b);
  }
}
function lamp(scene, x, z) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 4, 12), std(0x2b3038, { metalness: .4 })); p.position.set(x, 2, z); scene.add(p); const h = new THREE.Mesh(new THREE.BoxGeometry(.7, .12, .25), std(0x2b3038)); h.position.set(x + .3, 4, z); scene.add(h); }
function truck() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.2), std(0x2fae5a)); body.position.set(-.6, 1.5, 0); body.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.7, 2.1), std(0xf2f2f2)); cab.position.set(1.8, 1.25, 0); cab.castShadow = true;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.05, .7, 1.8), std(0x9fd3f2, { roughness: .2 })); glass.position.set(2.51, 1.55, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, .25, 2.22), std(0xffd23a)); stripe.position.set(-.6, 1.1, 0);
  g.add(body, cab, glass, stripe); g.wheels = [];
  for (const [x, z] of [[-1.6, 1.05], [-1.6, -1.05], [1.8, 1.05], [1.8, -1.05]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 24), std(0x1d1f24)); w.rotation.x = Math.PI / 2; w.position.set(x, .42, z); w.castShadow = true; g.add(w); g.wheels.push(w); }
  return g;
}
function label(text, col = '#ffffff', size = .5) {
  const m = document.createElement('canvas').getContext('2d'); m.font = '800 70px sans-serif';
  const w = Math.ceil(m.measureText(text).width + 60), h = 120;
  const t = canvasTex(w, h, (g) => { g.font = '800 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#221c22'; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2); g.fillStyle = col; g.fillText(text, w / 2, h / 2); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.aspect = w / h; s.scale.set(size * w / h, size, 1); s.renderOrder = 10; return s;
}
function setSky(scene, top, mid, hor, flo) { const u = scene.userData.sky.material.uniforms; u.top.value.set(top); u.mid.value.set(mid); u.horizon.value.set(hor); u.floorC.value.set(flo); }

// ============ SHOT A: day street. a square cover falls in; Gus climbs out; the boss and his stack (0 - 10.62) ============
function shotA({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 8, 5] });
  const H = { x: 0, z: 0, type: 'sq', size: .8 };
  makeStreet(scene, [H]); lamp(scene, -3.2, -2.2); lamp(scene, 7, -2.2);
  const held = squareCover(); scene.add(held);
  const cover = squareCover(); scene.add(cover);
  const gus = makeChar('gus'); scene.add(gus);
  const boss = makeChar('boss'); boss.position.set(3.2, .18, -2.6); scene.add(boss);
  const stack = new THREE.Group(); for (let i = 0; i < 9; i++) { const c = squareCover(); c.position.y = .025 + i * .055; c.rotation.y = (i % 2) * .04; stack.add(c); } stack.position.set(4.3, .18, -2.4); scene.add(stack);
  const tally = label('COVERS LOST: 2', '#ffd23a', .3); tally.position.set(-.5, 2.15, -1.2); scene.add(tally);
  const tally3 = label('COVERS LOST: 3', '#ff5a3c', .3); tally3.position.copy(tally.position); scene.add(tally3);
  const cash = label('$ CHEAP $', '#7cf28a', .5); cash.position.set(3.6, 2.9, -2.4); scene.add(cash);
  const c = cam(36);
  return { scene, camera: c, update(lt, t) {
    // cover tips onto its edge, turns to the hole's diagonal and slips in
    const tip = kf(lt, [[.15, 0], [.75, 1]], easeInOut), drop = kf(lt, [[.9, 0], [1.6, 1]], easeIn);
    cover.rotation.set(tip * Math.PI / 2, tip * Math.PI / 4, 0, 'YXZ');
    cover.position.set(0, .03 + tip * .4 - drop * 3.2, 0);
    cover.visible = drop < .98;
    tally.visible = t < 3.28; tally3.visible = t >= 3.28; const k3 = .3 * (t < 3.6 ? 1 + Math.sin((t - 3.28) * 20) * .25 * (1 - range(t, 3.28, 3.6)) : 1); tally3.scale.set(k3 * tally3.aspect, k3, 1);
    // Gus climbs out with the cover on his head (4.56), sighs, climbs back down (5.68)
    const up = kf(t, [[4.2, -1.9], [4.75, -.25], [5.6, -.25], [6.4, -1.9]], easeInOut);
    gus.position.set(0, up, 0);
    gus.draw(t, { seed: 1, face: { eyes: t > 5.2 ? 'half' : 'normal', mouth: 'flat', look: [0, 0] }, arms: { L: { ik: [-.16, -1.0], bend: -1 }, R: { ik: [.16, -1.0], bend: 1 } }, hand: { L: 'open', R: 'open' }, shadow: false,
      }, c);
    held.position.set(0, up + 1.93, 0); held.rotation.set(Math.sin(t * 3) * .05, .3, Math.sin(t * 2) * .06); held.visible = t > 4.2 && t < 6.4;
    gus.visible = t > 4.2 && t < 6.4;
    // boss: thumbs up on "loves" (7.44), points at the stack on "stack" (9.76)
    boss.draw(t, { seed: 3, arms: t > 9.6 ? { L: [.3, -.1], R: [1.5, -.1] } : t > 7.3 ? { L: [.3, -.1], R: [2.4, .8] } : { L: [.9, -2.1], R: [.9, -2.1] }, hand: { R: t > 9.6 ? 'point' : t > 7.3 ? 'fist' : 'open' },
      face: { eyes: t > 7.3 ? 'happy' : 'smug', mouth: 'grin', look: [1, 0] } }, c);
    cash.visible = t > 9.0; cash.scale.set(.4 * cash.aspect * smooth(range(t, 9.0, 9.3)) + .01, .4 * smooth(range(t, 9.0, 9.3)) + .01, 1);
    // camera: low on the hole, rises and swings to the boss and his stack
    const s = shake(t, 1.2);
    const pos = kf(t, [[0, [1.4, 1.25, 2.7]], [2.6, [1.8, 2.0, 4.4]], [6.6, [1.2, 2.0, 4.8]], [8.0, [3.2, 1.9, 3.6]], [10.6, [4.4, 1.6, 2.2]]], easeInOut);
    const look = kf(t, [[0, [0, .25, 0]], [2.6, [0, .8, 0]], [6.6, [.2, 1.0, -.3]], [8.0, [3.5, 1.1, -2.5]], [9.6, [3.8, 1.1, -2.5]], [10.6, [4.3, .6, -2.4]]], easeInOut);
    place(c, [pos[0] + s[0], pos[1] + s[1], pos[2]], look);
    faceCam([gus, boss], c);
    return { bloom: .3 };
  } };
}
// ============ SHOT B: night workshop. Gus pours a round one (10.62 - 12.62) ============
function shotB({ makeStage }) {
  const scene = makeStage({ shadowSize: 3, sun: .25, sunDir: [2, 6, 3] });
  setSky(scene, 0x0b1230, 0x1b2350, 0x3a3270, 0x120e18);
  scene.children.filter(o => o.isHemisphereLight).forEach(h => h.intensity = .25);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0x3a2c26)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 6, .3), std(0x6b3a2c)); wall.position.set(0, 3, -2.5); scene.add(wall);
  const moon = glowSprite(0xdfe6ff, 1.2); moon.position.set(-3, 5, -10); scene.add(moon);
  const mold = new THREE.Mesh(new THREE.TorusGeometry(.48, .07, 16, 64), std(0x2b2f36, { metalness: .6 })); mold.rotation.x = Math.PI / 2; mold.position.set(0, .08, 0); scene.add(mold);
  const molten = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .05, 48), new THREE.MeshBasicMaterial({ color: 0xff7a1a, toneMapped: false })); molten.position.set(0, .06, 0); scene.add(molten);
  const ladle = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.13, .09, .17, 24), std(0x30343c, { metalness: .5 })); const handle = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.2, 8), std(0x30343c)); handle.rotation.z = Math.PI / 2; handle.position.x = -.62; ladle.add(cup, handle); scene.add(ladle);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.04, .03, 1, 12), new THREE.MeshBasicMaterial({ color: 0xffb04a, toneMapped: false })); scene.add(stream);
  const glow = glowSprite(0xff8a30, 2.2); glow.position.set(0, .3, 0); scene.add(glow);
  const light = new THREE.PointLight(0xff8a30, 6, 6, 1.5); light.position.set(0, .6, .4); scene.add(light);
  const sp = sparks(70, { speed: 1.4, spread: 1.2, gravity: -4, life: .7, dir: new THREE.Vector3(0, 1, 0), size: .03 }); sp.position.set(0, .1, 0); scene.add(sp);
  const gus = makeChar('gus'); gus.position.set(-1.05, 0, .2); scene.add(gus);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    ladle.position.set(.05, .95, .1); ladle.rotation.z = kf(lt, [[0, 0], [.4, -1.1]]);
    const fill = range(lt, .4, 1.8);
    molten.scale.y = .05 + fill; molten.scale.x = molten.scale.z = .2 + .8 * fill; molten.position.y = .04 + fill * .03;
    stream.visible = lt > .4; stream.position.set(.12, .55, 0);
    sp.update((lt - .45) % .7);
    gus.draw(t, { seed: 1, face: { eyes: 'happy', mouth: 'grin', look: [1, 0] }, arms: { L: [1.4, -.4], R: [1.5, -.2] }, hand: { L: 'fist', R: 'fist' }, lean: .05 }, c);
    const s = shake(t, 1);
    place(c, [kf(lt, [[0, -.9], [2, -.2]]) + s[0], 1.35 + s[1], 3.6], [-.5, .75, 0]);
    faceCam([gus], c);
    return { bloom: 1.1, exposure: 1.15 };
  } };
}
// ============ SHOT C: morning, garbage truck slams the street, covers jump, squares slip through (12.62 - 19.9) ============
function shotC({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-5, 7, 4], sun: 2.6 });
  setSky(scene, 0x3f8fe0, 0x8cc4f0, 0xffd9a8, 0xa9cdf1);
  const holes = [{ x: -1.5, z: 1, type: 'sq', size: .8 }, { x: 0, z: 1, type: 'rd', size: .8 }, { x: 1.5, z: 1, type: 'sq', size: .8 }];
  makeStreet(scene, holes, { noDash: true }); lamp(scene, -4, -2.2); lamp(scene, 4, -2.2);
  const covers = [squareCover(), roundCover(), squareCover()];
  covers.forEach((cv, i) => { cv.position.set(holes[i].x, .03, 1); scene.add(cv); });
  const tr = truck(); tr.position.set(-9, 0, -.9); scene.add(tr);
  const walker = makeChar('walker'); walker.position.set(-3.3, .18, -2.4); scene.add(walker);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    // truck drives through and hits a pothole on "slams" (14.32)
    const tx = lerp(-9, 9, range(t, 12.62, 16.4));
    const bump = t > 14.3 && t < 14.7 ? Math.sin((t - 14.3) / .4 * Math.PI) * .18 : 0;
    tr.position.set(tx, bump, -.9); tr.rotation.z = bump * .25; tr.wheels.forEach(w => w.rotation.y = 0); tr.wheels.forEach(w => w.rotation.z = Math.PI / 2 - 0); tr.wheels.forEach(w => w.rotateY(-tx * 2.4));
    tr.visible = t < 16.6;
    // every cover jumps (15.6 - 16.6), slow motion feel
    covers.forEach((cv, i) => {
      const j = kf(t, [[15.55 + i * .05, 0], [16.05 + i * .05, .42, easeOut], [16.7 + i * .05, 0, easeIn]]);
      if (i === 1) { cv.position.y = .03 + j; cv.rotation.x = j * .5; const land = t > 16.75 ? Math.abs(Math.sin((t - 16.75) * 14)) * .04 * Math.exp(-(t - 16.75) * 5) : 0; cv.position.y += land; return; }
      const tip = kf(t, [[16.9, 0], [17.7, 1]], easeInOut), drop = kf(t, [[18.6, 0], [19.4, 1]], easeIn);
      cv.rotation.set(j * .4 + tip * Math.PI / 2, tip * Math.PI / 4 * (i === 0 ? 1 : -1), 0, 'YXZ');
      cv.position.set(holes[i].x, .03 + j + tip * .42 - drop * 3.5, 1);
      cv.visible = drop < .97;
    });
    const shock = t > 14.32 && t < 14.9 ? 1 - range(t, 14.32, 14.9) : 0;
    walker.draw(t, { seed: 5, face: { eyes: t > 16 ? 'wide' : 'normal', mouth: t > 18.7 ? 'o' : 'smile', look: [t > 16 ? 1 : -1, .3], browUp: t > 16 ? 1 : 0 }, arms: t > 18.8 ? { L: [2.5, .4], R: [2.5, .4] } : undefined, hand: { L: 'open', R: 'open' }, sq: 1 - shock * .08 }, c);
    const s = shake(t, 1.3); const ks = shock * .05;
    const pos = kf(t, [[12.62, [0, 3.0, 9.5]], [15.0, [0, 2.3, 7.4]], [16.8, [.2, 1.7, 5.4]], [19.9, [1.4, 1.5, 4.4]]], easeInOut);
    const look = kf(t, [[12.62, [0, .9, 0]], [16.8, [0, .4, .8]], [18.4, [.8, .2, 1]], [19.9, [1.5, 0, 1]]], easeInOut);
    place(c, [pos[0] + s[0] + (Math.random() - .5) * 0 + Math.sin(t * 60) * ks, pos[1] + s[1] + Math.cos(t * 55) * ks, pos[2]], look);
    faceCam([walker], c);
    return { bloom: .3 };
  } };
}
// ============ SHOT D: explainer in a studio. square vs circle (19.9 - 29.95) ============
function shotD({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-3, 7, 4] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std(0xdfe8f2)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const yel = std(0xffc21a, { roughness: .5 });
  // square hole frame at x=-1.4, round hole ring at x=+1.4, both at height 1.0
  const sqF = new THREE.Group(); const S = .8, b = .08;
  [[0, S / 2 + b / 2, S + 2 * b, b], [0, -S / 2 - b / 2, S + 2 * b, b], [S / 2 + b / 2, 0, b, S], [-S / 2 - b / 2, 0, b, S]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .06, d), yel); m.position.set(x, 0, z); m.castShadow = true; sqF.add(m); });
  sqF.position.set(-1.4, 1.0, 0); scene.add(sqF);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.44, .045, 16, 64), yel); ring.rotation.x = Math.PI / 2; ring.position.set(1.4, 1.0, 0); ring.castShadow = true; scene.add(ring);
  for (const x of [-1.4, 1.4]) for (const dz of [-.6, .6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.0, 8), std(0x8a9099)); p.position.set(x + (x < 0 ? .55 : .55) * Math.sign(dz) * 0 + dz * 0, .5, dz); scene.add(p); }
  const sq = squareCover(); scene.add(sq);
  const side = new THREE.Mesh(new THREE.BoxGeometry(.86, .012, .03), new THREE.MeshBasicMaterial({ color: 0x2fdc6a, toneMapped: false })); sq.add(side); side.position.set(0, .032, .43);
  const diag = new THREE.Mesh(new THREE.BoxGeometry(1.216, .014, .035), new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false })); sq.add(diag); diag.position.set(0, .034, 0); diag.rotation.y = Math.PI / 4;
  const lSide = label('SIDE', '#2fdc6a', .3), lDiag = label('CORNER TO CORNER', '#ff5a5a', .3); scene.add(lSide, lDiag);
  const disc = roundCover(); scene.add(disc);
  const dia = new THREE.Mesh(new THREE.BoxGeometry(.86, .014, .035), new THREE.MeshBasicMaterial({ color: 0x3bb8ff, toneMapped: false })); disc.add(dia); dia.position.y = .034;
  const lSame = label('SAME WIDTH', '#3bb8ff', .32); scene.add(lSame);
  const bonk = label('BONK', '#ffd23a', .45); scene.add(bonk);
  const c = cam(34);
  return { scene, camera: c, update(lt, t) {
    // square: hover, show side (21.6) and diagonal (22.1), tilt to the diagonal (23.3) and pass through (24.5)
    const spin = t < 23.2 ? t * .5 : 23.2 * .5;
    const tip = kf(t, [[23.2, 0], [24.0, 1]], easeInOut), down = kf(t, [[24.3, 0], [25.3, 1]], easeIn);
    sq.rotation.set(tip * Math.PI / 2, lerp(spin, Math.ceil(spin / (Math.PI / 2)) * Math.PI / 2 + Math.PI / 4, tip), 0, 'YXZ');
    sq.position.set(-1.4, lerp(1.7, 1.75, tip) - down * 2.0, 0);
    side.visible = t > 21.5; diag.visible = t > 22.0;
    side.scale.x = smooth(range(t, 21.5, 21.8)) + .001; diag.scale.x = smooth(range(t, 22.0, 22.4)) + .001;
    lSide.position.set(-1.4, 2.02, .5); lSide.scale.set(.24 * lSide.aspect, .24, 1); lSide.visible = t > 21.5 && t < 23.3; lDiag.position.set(-1.4, 2.25, 0); lDiag.scale.set(.15 * lDiag.aspect, .15, 1); lDiag.visible = t > 22.0 && t < 23.3;
    // circle: spins with its diameter line (26.6), tilts and tries to drop (28.7) but jams at the ring
    const dt = Math.max(0, t - 25.6);
    const tipC = kf(t, [[28.0, 0], [28.6, 1]], easeInOut);
    const fall = kf(t, [[28.7, 0], [29.05, 1]], easeIn), rebound = t > 29.05 ? Math.abs(Math.sin((t - 29.05) * 12)) * .12 * Math.exp(-(t - 29.05) * 4) : 0;
    disc.rotation.set(tipC * Math.PI / 2, dt * 1.6, 0, 'YXZ');
    disc.position.set(1.4, lerp(1.75, 1.75, tipC) - fall * (1.75 - 1.158) + rebound, 0);
    lSame.position.set(1.4, 2.2, 0); lSame.visible = t > 26.6 && t < 28.2; const pulse = 1 + Math.sin(t * 8) * .04; lSame.scale.set(.24 * lSame.aspect * pulse, .24 * pulse, 1);
    bonk.position.set(1.4, 2.25, .2); bonk.visible = t > 29.05 && t < 29.8; const bk = backOutJS(range(t, 29.05, 29.25)); bonk.scale.set(.4 * bonk.aspect * bk + .01, .4 * bk + .01, 1);
    // camera: on the square, slow orbit, then glides across to the circle
    const s = shake(t, 1);
    const fx = kf(t, [[19.9, -1.4], [25.4, -1.4], [26.0, 1.4]], easeInOut);
    const ang = kf(t, [[19.9, -.5], [25.4, .3], [29.95, .6]]);
    const dist = kf(t, [[19.9, 4.0], [21.0, 3.4], [25.4, 3.6], [29.95, 3.3]]);
    place(c, [fx + Math.sin(ang) * dist + s[0], 2.4 + s[1], Math.cos(ang) * dist], [fx, 1.45, 0]);
    return { bloom: .45 };
  } };
}
const backOutJS = t => { const c1 = 1.9, c3 = c1 + 1; t = clamp(t); return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
// ============ SHOT E: the boss storms over, steps on a square cover and drops; Gus rolls the round one over (29.95 - end) ============
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 8, 5] });
  const holes = [{ x: 0, z: 0, type: 'sq', size: .8 }];
  makeStreet(scene, holes); lamp(scene, -5, -2.2);
  const trap = squareCover(); trap.position.set(0, .03, 0); scene.add(trap);
  const boss = makeChar('boss'); scene.add(boss);
  const gus = makeChar('gus'); scene.add(gus);
  const walker = makeChar('walker'); walker.position.set(-3.6, .18, -2.4); scene.add(walker);
  const wheel = roundCover(); scene.add(wheel);
  const c = cam(38);
  return { scene, camera: c, update(lt, t) {
    // boss walks in from the right, yelling (mouth follows the voice), steps on the cover at 32.16 and drops at 33.2
    const bx = kf(t, [[29.95, 3.2], [32.1, 0]], x => x);
    const tipT = kf(t, [[32.2, 0], [32.55, 1]], easeIn);
    const fallB = kf(t, [[32.5, 0], [33.4, 1]], easeIn);
    trap.rotation.set(tipT * 1.45, 0, 0); trap.position.set(0, .03 + tipT * .25 - fallB * 3, -tipT * .1); trap.visible = fallB < .95;
    boss.position.set(bx, -fallB * 2.6, 0);
    const walking = t < 32.1, falling = t > 32.3;
    boss.draw(t, { seed: 3, flip: -1, lean: walking ? -.08 : 0, legs: walking ? walkLegs(t, 10) : falling ? { L: [.8, -.6], R: [-.4, -.8] } : undefined,
      arms: falling ? { L: [2.8, .3], R: [2.8, .3] } : walking ? { L: [1.6 + Math.sin(t * 10) * .4, -.6], R: [2.2, .4] } : { L: [.3, -.1], R: [.3, -.1] }, hand: { L: 'open', R: falling ? 'open' : 'point' },
      face: { eyes: falling ? 'wide' : 'normal', mouth: 'talk', open: falling ? .9 : Math.min(1, amp(t) * 1.3), browAng: falling ? 0 : -.35, browUp: falling ? 1 : 0, look: [1, falling ? -1 : 0] }, shadow: !falling }, c);
    boss.visible = fallB < .9;
    // Gus rolls the round cover on its edge from the left, it wobbles flat onto the square hole
    const gx = kf(t, [[34.0, -3.4], [35.7, -1.0]], easeOut);
    gus.position.set(gx - .55, .0, .5);
    gus.draw(t, { seed: 1, face: { eyes: t > 35.7 ? 'smug' : 'normal', mouth: 'smirk', look: [1, 0], browOne: 1 }, legs: t > 34 && t < 35.7 ? walkLegs(t, 8, .4) : undefined, arms: { L: [.3, -.1], R: [1.55, -.1] }, hand: { R: 'open' } }, c);
    gus.visible = t > 33.6;
    const roll = kf(t, [[34.0, -3.0], [35.8, 0]], easeOut);
    const flat = kf(t, [[35.8, 0], [36.3, 1]], easeIn);
    wheel.rotation.set(0, 0, 0); wheel.rotation.order = 'XYZ';
    wheel.position.set(roll, lerp(.43, .03, flat), .0 + (1 - flat) * .5);
    wheel.rotation.x = Math.PI / 2 * (1 - flat); wheel.rotation.y = 0; wheel.rotateY(-roll / .43 * (1 - flat));
    wheel.visible = t > 33.8;
    walker.draw(t, { seed: 5, face: { eyes: t > 33.2 ? 'happy' : 'normal', mouth: t > 33.2 ? 'grin' : 'smile', look: [1, 0] }, arms: t > 33.3 ? { L: [.9, -2.0], R: [2.4 + Math.sin(t * 14) * .2, .4] } : undefined }, c);
    const s = shake(t, 1.2), hit = t > 32.55 && t < 33.0 ? (1 - range(t, 32.55, 33.0)) * .04 : 0;
    const pos = kf(t, [[29.95, [2.0, 1.6, 5.0]], [32.2, [.6, 1.5, 4.4]], [33.4, [.2, 1.8, 4.0]], [36.6, [-1.5, 1.8, 4.8]]], easeInOut);
    const look = kf(t, [[29.95, [1.6, .95, 0]], [32.2, [.2, .9, 0]], [33.4, [0, .4, 0]], [34.4, [-1.3, .7, 0]], [36.6, [-.95, .6, 0]]], easeInOut);
    place(c, [pos[0] + s[0] + Math.sin(t * 61) * hit, pos[1] + s[1] + Math.cos(t * 57) * hit, pos[2]], look);
    faceCam([boss, gus, walker], c);
    return { bloom: .3 };
  } };
}
export const SHOTS = [
  { start: 0, end: 10.62, build: shotA },
  { start: 10.62, end: 12.62, build: shotB },
  { start: 12.62, end: 19.9, build: shotC },
  { start: 19.9, end: 29.95, build: shotD },
  { start: 29.95, end: 99, build: shotE },
];
