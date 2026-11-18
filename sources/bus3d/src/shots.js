// "Why manhole covers are round": 2D stick characters (canvas billboards) in a 3D world
import * as THREE from 'three';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, clamp, range, V, cam, place, shake } from './anim.js';
import { glowSprite, sparks } from './props.js';
import { DURATION as DUR, CAPTIONS as CAPS, AMP } from './data.js';
export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [];

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
  prof: { cols: ['#8a5a34', '#8a5a34'], hat: 'none', belt: false, extra: (c, x, y, s, hx, hy, r) => { drawGlasses(c, hx, hy, s); tie(c, x, y, s); c.beginPath(); c.arc(hx, hy, r * 1.02, Math.PI + .5, -.5); c.closePath(); fillStroke(c, '#d9d9e0', r * .06); } },
  rival: { cols: ['#2b2730', '#2b2730'], hat: 'none', belt: false, extra: (c, x, y, s, hx, hy, r) => { bossLook(c, x, y, s, hx, hy, r); tie(c, x, y, s); } },
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


// ================= Why are school buses yellow? =================
const YEL = 0xf6b52a, GRAY = new THREE.Color(0x3a3d44);
function sideTex(col, lettered) {
  return canvasTex(512, 200, (g, w, h) => { g.fillStyle = '#' + new THREE.Color(col).getHexString(); g.fillRect(0, 0, w, h); g.fillStyle = '#16181d'; g.fillRect(0, 118, w, 14); if (lettered) { g.font = '800 54px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#111'; g.fillText('SCHOOL BUS', w / 2, 178); } });
}
function bus(col, lettered = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: sideTex(col, lettered), roughness: .55 });
  const plain = new THREE.MeshStandardMaterial({ color: col, roughness: .55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.9, 2.2), [plain, plain, plain, plain, bodyMat, bodyMat]); body.position.y = 1.35; body.castShadow = true;
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 2.0), plain); hood.position.set(3.0, .95, 0); hood.castShadow = true;
  g.add(body, hood);
  for (let i = 0; i < 6; i++) for (const z of [1.111, -1.111]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(.6, .55), new THREE.MeshStandardMaterial({ color: 0x9fd3f2, roughness: .2, side: THREE.DoubleSide })); w.position.set(-2.0 + i * .75, 1.85, z); g.add(w); }
  g.wheels = [];
  for (const [x, z] of [[-1.6, 1.1], [-1.6, -1.1], [2.6, 1.1], [2.6, -1.1]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 24), std(0x1d1f24)); w.rotation.x = Math.PI / 2; w.position.set(x, .42, z); g.add(w); g.wheels.push(w); }
  g.mats = [plain, bodyMat]; g.base = new THREE.Color(col);
  g.dim = (d) => { plain.color.copy(g.base).lerp(GRAY, d); bodyMat.color.setRGB(1, 1, 1).lerp(new THREE.Color(0x55585f), d); };
  return g;
}
function car(col) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: col, roughness: .45 }); const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, .7, 1.4), m); b.position.y = .6; const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, .55, 1.3), m); c.position.set(-.2, 1.2, 0); g.add(b, c); for (const [x, z] of [[-.9, .7], [-.9, -.7], [.9, .7], [.9, -.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 16), std(0x1d1f24)); w.rotation.x = Math.PI / 2; w.position.set(x, .3, z); g.add(w); } g.m = m; g.base = new THREE.Color(col); return g; }
function dusk(scene, d) { // 0 = day, 1 = deep dusk
  setSky(scene, new THREE.Color(0x3f8fe0).lerp(new THREE.Color(0x141a3a), d).getHex(), new THREE.Color(0x8cc4f0).lerp(new THREE.Color(0x553060), d).getHex(), new THREE.Color(0xffd9a8).lerp(new THREE.Color(0xff7a3c), d).getHex(), 0xa9cdf1);
  const k = scene.userData.key; if (k) { k.intensity = lerp(2.6, .35, d); k.color.set(new THREE.Color(0xfff3e6).lerp(new THREE.Color(0xff9a5a), d)); }
  scene.children.filter(o => o.isHemisphereLight).forEach(h => h.intensity = lerp(.75, .22, d));
}
function paintWall() { return canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#efe6d6'; g.fillRect(0, 0, w, h); const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7); for (let i = 0; i < 50; i++) { const x = 40 + (i % 10) * 96, y = 40 + Math.floor(i / 10) * 92; g.fillStyle = i === 23 ? '#f6b52a' : `hsl(${Math.floor(R() * 360)},${50 + R() * 40}%,${30 + R() * 45}%)`; g.fillRect(x, y, 70, 70); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(x + 35, y + 6, 6, 0, 7); g.fill(); } }); }
// A: dusk street, buses of every color; the dark one disappears (0 - 6.05)
function shotA({ makeStage }) {
  const scene = makeStage({ shadowSize: 9, sunDir: [-6, 5, 4] });
  makeStreet(scene, [], { noDash: false }); lamp(scene, -4, -2.2); lamp(scene, 4, -2.2);
  const cols = [0xd8312b, 0x1d2a5a, 0x3fa35b, 0x7a4bc4]; const buses = cols.map(c => { const b = bus(c); scene.add(b); return b; });
  const kid = makeChar('walker'); kid.position.set(1.0, .18, -2.3); scene.add(kid);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const d = kf(t, [[0, .55], [6, .8]]); dusk(scene, d);
    buses.forEach((b, i) => { const x = -12 + ((t * 2.6 + i * 6.5) % 26); b.position.set(x, 0, i % 2 ? 1.6 : -.2); b.wheels.forEach(w => w.rotation.y = 0); b.dim(i === 1 ? clamp(.5 + (t - 4.6) * .6) : d * .5); b.visible = !(i === 1 && t > 5.6); });
    kid.draw(t, { seed: 5, face: { eyes: t > 5.0 ? 'wide' : 'normal', mouth: t > 5.0 ? 'o' : 'smile', look: [1, 0], browUp: t > 5 ? 1 : 0 }, arms: t > 5.2 ? { L: [2.6, .3], R: [2.6, .3] } : undefined }, c);
    const s = shake(t, 1.2); place(c, [s[0], 4.2 + s[1], 21], [0, 1.4, 0]); faceCam([kid], c);
    return { bloom: .5, exposure: lerp(1.0, .75, d) };
  } };
}
// B: red at sunset, dark in the fog (6.05 - 10.15)
function shotB({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-6, 3, 4] });
  makeStreet(scene, [], {}); const red = bus(0xd8312b); const dark = bus(0x1d2a5a); scene.add(red, dark);
  scene.fog = new THREE.Fog(0x8a90a0, 6, 22);
  const c = cam(38);
  return { scene, camera: c, update(lt, t) {
    const d = kf(t, [[6.05, .6], [8.0, .95]]); dusk(scene, d);
    red.position.set(lerp(-3, 1, lt / 4), 0, -.3); red.dim(clamp((t - 6.6) / 1.2) * .85); red.visible = t < 8.2;
    dark.position.set(lerp(-2, 6, clamp((t - 8.2) / 2)), 0, -.3); dark.visible = t >= 8.2; dark.dim(.4);
    scene.fog.near = t > 8.2 ? lerp(30, 9, clamp((t - 8.3) / 1.4)) : 60; scene.fog.far = t > 8.2 ? lerp(60, 21, clamp((t - 8.3) / 1.4)) : 90;
    const s = shake(t, 1); place(c, [4 + s[0], 3.2 + s[1], 16], [0, 1.4, 0]);
    return { bloom: .4, exposure: lerp(1, .7, d) };
  } };
}
// C: the professor and about fifty paint colors (10.15 - 14.75)
function shotC({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-3, 6, 5] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0xb07a4a)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshStandardMaterial({ map: paintWall(), roughness: .9 })); wall.position.set(0, 2.2, -2.5); scene.add(wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), std(0xd9c9a8)); back.position.set(0, 4, -2.55); scene.add(back);
  const sign = label('1939: BUS COLOR MEETING', '#ffe14d', .32); sign.position.set(0, 4.55, -2.4); scene.add(sign);
  const prof = makeChar('prof'); prof.position.set(-1.0, 0, .6); scene.add(prof);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    prof.draw(t, { seed: 2, arms: t > 12.0 && t < 13.0 ? { L: [.3, -.1], R: [2.4, .3] } : { L: [.3, -.1], R: [.9, -1.9] }, hand: { R: t > 12 && t < 13 ? 'point' : 'open' }, face: { eyes: 'normal', mouth: 'smile', look: [1, -.3] } }, c);
    const z = kf(t, [[10.15, 9.5], [14.7, 7.5]]); const s = shake(t, 1); place(c, [s[0], 2.3 + s[1], z], [0, 2.1, -2.5]); faceCam([prof], c);
    return { bloom: .3 };
  } };
}
// D: the rival: "Red means stop!" (14.75 - 17.55)
function shotD({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-3, 6, 5] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0xb07a4a)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshStandardMaterial({ map: paintWall(), roughness: .9 })); wall.position.set(0, 2.2, -2.5); scene.add(wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), std(0xd9c9a8)); back.position.set(0, 4, -2.55); scene.add(back);
  const rival = makeChar('rival'); rival.position.set(.7, 0, 0); scene.add(rival);
  const prof = makeChar('prof'); prof.position.set(-1.4, 0, -.4); scene.add(prof);
  const swatch = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .04), std(0xd8312b)); scene.add(swatch);
  const c = cam(38);
  return { scene, camera: c, update(lt, t) {
    const yell = t > 16.3 && t < 17.3;
    rival.draw(t, { seed: 6, arms: { L: [.3, -.1], R: [2.5, .3] }, hand: { R: 'fist' }, lean: yell ? -.08 : 0, face: { mouth: 'talk', open: yell ? clamp(amp(t) * 1.3) : 0, eyes: 'normal', browAng: -.35, look: [-1, 0] } }, c);
    prof.draw(t, { seed: 2, face: { eyes: 'half', mouth: 'flat', browOne: 1, look: [1, 0] } }, c);
    swatch.position.set(.95, 2.35 + Math.sin(t * 8) * .03, .1);
    const z = yell ? lerp(4.2, 3.0, clamp((t - 16.3) / .3)) : 4.4; const s = shake(t, yell ? 3 : 1); place(c, [.2 + s[0], 1.7 + s[1], z], [.2, 1.5, 0]); faceCam([rival, prof], c);
    return { bloom: .3 };
  } };
}
// E: the dusk test: red goes gray, yellow-orange stays bright (17.55 - 21.3)
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-6, 4, 4] });
  makeStreet(scene, [], {}); const red = bus(0xd8312b); const yel = bus(YEL); red.position.set(-1, 0, -1.4); yel.position.set(-1, 0, 1.6); scene.add(red, yel);
  const lr = label('RED', '#ff6b6b', .45), ly = label('YELLOW-ORANGE', '#ffd23a', .45); scene.add(lr, ly);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const d = kf(t, [[17.55, .1], [18.1, .1], [19.6, .95]]); dusk(scene, d);
    red.dim(clamp((t - 18.4) / 1.3) * .95); yel.dim(0);
    lr.position.set(-1, 3.6, -1.4); ly.position.set(-1, 3.0, 2.4); lr.material.opacity = 1 - clamp((t - 19.2) / .8) * .6;
    const s = shake(t, 1); place(c, [11 + s[0], 4.5 + s[1], 13], [-1, 1.4, 0]);
    return { bloom: lerp(.3, .7, d), exposure: lerp(1, .8, d) };
  } };
}
// F: picked yellow-orange; your eyes catch it; black letters; every state (21.3 - 31.0)
function shotF({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-6, 7, 4] });
  makeStreet(scene, [], {}); lamp(scene, -6, -2.2);
  const hero = bus(YEL, false), lettered = bus(YEL, true); scene.add(hero, lettered);
  const fleet = []; for (let i = 0; i < 6; i++) { const b = bus(YEL, true); b.position.set(-30 + i * 6, 0, -.2); scene.add(b); fleet.push(b); }
  const lname = label('NATIONAL SCHOOL BUS CHROME', '#ffd23a', .34); scene.add(lname);
  const prof = makeChar('prof'); prof.position.set(-3.2, .18, -2.4); scene.add(prof);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    dusk(scene, kf(t, [[21.3, .2], [27, .55], [31, .3]]));
    const letters = t > 27.28; hero.visible = !letters; lettered.visible = letters;
    [hero, lettered].forEach(b => b.position.set(lerp(-1, .5, clamp(lt / 6)), 0, -.2));
    fleet.forEach((b, i) => { b.visible = t > 29.2; b.position.x = lerp(-34 + i * 6.2, -8 + i * 6.2 - 20, clamp((t - 29.2) / 1.6)) + 20; b.position.z = 2.2; });
    lname.position.set(0, 5.2, 0); lname.scale.set(.5 * lname.aspect, .5, 1); lname.visible = t > 29.2;
    prof.draw(t, { seed: 2, arms: { L: [.3, -.1], R: [2.5, .3] }, hand: { R: 'point' }, face: { eyes: 'happy', mouth: 'grin' } }, c);
    const peri = t > 23.8 && t < 27.2;
    const pos = peri ? [9, 3.0, 15] : t > 29.2 ? [2, 6.5, 30] : [7, 3.4, 15];
    const look = peri ? [5, 1.6, 0] : t > 29.2 ? [0, 1.6, 0] : [0, 1.4, 0];
    const s = shake(t, 1); place(c, [pos[0] + s[0], pos[1] + s[1], pos[2]], look); faceCam([prof], c);
    return { bloom: .5 };
  } };
}
// G: the rival's red car at sunset: nobody sees it (31.0 - end)
function shotG({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-6, 3, 4] });
  makeStreet(scene, [], {}); const rc = car(0xd8312b); rc.position.set(.5, 0, -.4); scene.add(rc);
  const yb = bus(YEL, true); scene.add(yb);
  const rival = makeChar('rival'); rival.position.set(-1.6, .18, -2.4); scene.add(rival);
  const huh = label('WHERE IS MY CAR?', '#ffffff', .32); scene.add(huh);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const d = kf(t, [[31, .5], [33, .97]]); dusk(scene, d);
    rc.m.color.copy(rc.base).lerp(GRAY, clamp((t - 31.6) / 1.4) * .95);
    yb.position.set(lerp(-14, 12, clamp((t - 31.4) / 3.4)), 0, 1.8);
    rival.draw(t, { seed: 6, arms: t > 33.2 ? { L: [2.6, .3], R: [2.6, .3] } : { L: [.3, -.1], R: [.9, -1.9] }, face: { eyes: t > 33.2 ? 'wide' : 'smug', mouth: t > 33.2 ? 'o' : 'smirk', look: [1, .5], browUp: t > 33.2 ? 1 : 0 } }, c);
    huh.position.set(-1.6, 3.4, -2.4); huh.scale.set(.42 * huh.aspect, .42, 1); huh.visible = t > 33.3;
    const s = shake(t, 1); place(c, [1 + s[0], 3.4 + s[1], 15], [0, 1.2, 0]); faceCam([rival], c);
    return { bloom: .5, exposure: lerp(1, .7, d) };
  } };
}
export const SHOTS = [
  { start: 0, end: 6.05, build: shotA },
  { start: 6.05, end: 10.15, build: shotB },
  { start: 10.15, end: 14.75, build: shotC },
  { start: 14.75, end: 17.55, build: shotD },
  { start: 17.55, end: 21.3, build: shotE },
  { start: 21.3, end: 31.0, build: shotF },
  { start: 31.0, end: 99, build: shotG },
];
