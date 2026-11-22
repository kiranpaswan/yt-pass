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



// ================= Why are stop signs octagons (and why were they yellow)? =================
const YEL = '#f6c02a', RED = '#d8231f';
function signShape(g, shape, R) {
  g.beginPath();
  if (shape === 'oct') for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
  else if (shape === 'circle') g.arc(0, 0, R, 0, Math.PI * 2);
  else if (shape === 'diamond') { g.moveTo(0, -R); g.lineTo(R, 0); g.lineTo(0, R); g.lineTo(-R, 0); }
  else if (shape === 'rect') { g.rect(-R * 1.25, -R * .62, R * 2.5, R * 1.24); }
  g.closePath();
}
// a talking road sign: 3D post + camera-facing canvas plate with a face
function makeSign(shape, o = {}) {
  const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const size = o.size || 1.5, ph = o.pole || 2.2;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .05, side: THREE.DoubleSide, toneMapped: false }));
  plate.position.y = ph + size * .42;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, ph + .3, 12), std(0x9aa1a8, { metalness: .6, roughness: .4 })); post.position.y = (ph + .3) / 2; post.castShadow = true;
  const grp = new THREE.Group(); grp.add(post, plate);
  grp.draw = (t, d = {}, camera) => {
    g.clearRect(0, 0, S, S); g.save(); g.translate(S / 2, S / 2);
    const sq = d.sq || 1; g.scale(1 / Math.sqrt(sq), sq); g.rotate(d.rot || 0);
    const R = S * .44;
    signShape(g, shape, R); g.fillStyle = '#ffffff'; g.fill();
    signShape(g, shape, R * .92); g.fillStyle = d.col || YEL; g.fill(); g.lineWidth = 10; g.strokeStyle = '#1b1b1f'; signShape(g, shape, R); g.stroke();
    if (d.glow) { g.save(); g.globalAlpha = d.glow; signShape(g, shape, R * .92); g.fillStyle = '#fff'; g.fill(); g.restore(); }
    const tc = d.tcol || '#1b1b1f';
    if (d.rr) { g.save(); g.lineWidth = 22; g.strokeStyle = tc; g.beginPath(); g.moveTo(-R * .62, -R * .62); g.lineTo(R * .62, R * .62); g.moveTo(R * .62, -R * .62); g.lineTo(-R * .62, R * .62); g.stroke(); g.font = '900 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = tc; g.fillText('R', -R * .55, 0); g.fillText('R', R * .55, 0); g.restore(); }
    if (d.text) { g.font = `900 ${d.ts || 120}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = tc; g.fillText(d.text, 0, d.ty != null ? d.ty : R * .42); }
    if (d.face !== false) {
      const k = S * 1.7 * (d.fk || 1); g.save(); g.translate(0, d.fy != null ? d.fy : -R * .3); g.scale(k, k);
      drawFace(g, 0, 0, .19, Object.assign({ eyes: 'normal', blink: blink(t, d.seed || 0), mouth: 'smile', look: [0, 0] }, d.faceO || {}), { t });
      g.restore();
    }
    g.restore(); tex.needsUpdate = true;
    if (camera) grp.rotation.y = Math.atan2(camera.position.x - grp.position.x, camera.position.z - grp.position.z);
  };
  return grp;
}
function road(scene, o = {}) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std(o.grass || 0x7fb35a, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const r = new THREE.Mesh(new THREE.PlaneGeometry(200, 5), std(0x4b4f58, { roughness: .95 })); r.rotation.x = -Math.PI / 2; r.position.set(0, .01, 1.5); r.receiveShadow = true; scene.add(r);
  for (let x = -60; x < 60; x += 3) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.4, .01, .12), std(0xf2c230)); d.position.set(x, .02, 1.5); scene.add(d); }
  if (o.cross) { const r2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 200), std(0x4b4f58, { roughness: .95 })); r2.rotation.x = -Math.PI / 2; r2.position.set(o.cross, .011, 0); scene.add(r2); const sl = new THREE.Mesh(new THREE.BoxGeometry(.3, .012, 5), std(0xffffff)); sl.position.set(o.cross - 3, .02, 1.5); scene.add(sl); }
  if (o.trees) for (let i = 0; i < 16; i++) { const x = -30 + i * 4 + ((i * 7) % 3), z = -6 - (i % 3) * 3; const tr = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.6, 8), std(0x3f7f3a)); tr.position.set(x, 1.6, z); tr.castShadow = true; const tk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, .6, 8), std(0x6b4a2a)); tk.position.set(x, .3, z); scene.add(tr, tk); }
}
function houses(scene) { const cols = [0xc4553c, 0xe0b45a, 0x7fb3d5, 0xf0e0c0, 0x9fc89a]; for (let i = -5; i <= 5; i++) { const h = 3 + (i * 13 + 20) % 3; const b = new THREE.Mesh(new THREE.BoxGeometry(3.4, h, 3), std(cols[(i + 10) % 5])); b.position.set(i * 4.6, h / 2, -11); b.castShadow = true; b.receiveShadow = true; const rf = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), std(0x6b3b2a)); rf.rotation.y = Math.PI / 4; rf.position.set(i * 4.6, h + .7, -11); scene.add(b, rf); } }
function car(col) { const g = new THREE.Group(); const m = std(col, { roughness: .45 }); const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, .7, 1.4), m); b.position.y = .6; b.castShadow = true; const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, .55, 1.3), m); c.position.set(-.2, 1.2, 0); g.add(b, c); for (const [x, z] of [[-.9, .7], [-.9, -.7], [.9, .7], [.9, -.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 16), std(0x1d1f24)); w.rotation.x = Math.PI / 2; w.position.set(x, .3, z); g.add(w); } return g; }
function oldCar() { const g = car(0x1d1f24); const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, .8, 1.3), std(0x1d1f24)); top.position.set(-.3, 1.4, 0); g.add(top); return g; }
function train() { const g = new THREE.Group(); const cols = [0x2a3f8f, 0xc4553c, 0x6b6f78, 0xc4553c, 0x6b6f78]; cols.forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.6), std(c)); b.position.set(-i * 6.4, 1.7, 0); b.castShadow = true; g.add(b); }); const nose = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.4, 20), std(0x1d1f24)); nose.rotation.z = Math.PI / 2; nose.position.set(3.6, 1.6, 0); g.add(nose); return g; }
function rails(scene, z) { for (const dz of [-.6, .6]) { const r = new THREE.Mesh(new THREE.BoxGeometry(200, .1, .1), std(0x8a8f98, { metalness: .7 })); r.position.set(0, .06, z + dz); scene.add(r); } for (let x = -60; x < 60; x += .9) { const s = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, 1.8), std(0x6b4a2a)); s.position.set(x, .03, z); scene.add(s); } }
const talkO = (t, a = 1) => clamp(amp(t) * 1.4 * a);
const flashOut = (t, at) => t > at && t < at + .12 ? { exposure: 2.2 } : {};

// A: hook: a YELLOW stop sign at a modern corner (0 - 3.1)
function shotA({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-5, 7, 4] });
  road(scene, { cross: 3 }); houses(scene);
  const sign = makeSign('oct', { size: 1.9 }); sign.position.set(0, 0, -1.4); scene.add(sign);
  const ranks = ['rect', 'diamond', 'oct', 'circle'].map((s, i) => { const m = makeSign(s, { size: .95, pole: .1 }); m.position.set(-1.55 + i * 1.03, 0, .6); scene.add(m); return m; });
  const title = label('IT WAS YELLOW?!', '#ffe14d', .5); scene.add(title);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const hit = t < .25 ? 1 + (1 - t / .25) * .6 : 1 + Math.sin(t * 3) * .02;
    sign.draw(t, { col: YEL, text: 'STOP', ts: 118, ty: R0, sq: hit, faceO: { eyes: 'happy', mouth: 'grin', look: [-.4, 0] } }, c);
    ranks.forEach((m, i) => { const k = clamp((t - 1.7 - i * .2) / .3); m.visible = k > 0; m.position.y = .7 + i * .3 * backOut(k); m.draw(t, { col: i === 3 ? YEL : i === 2 ? YEL : i === 1 ? YEL : '#2fae5a', faceO: { eyes: 'normal', mouth: 'smile' }, seed: i }, c); });
    title.position.set(0, 4.75, -1.4); title.visible = t < 1.7; const k = backOut(clamp(t / .25)); title.scale.set(.42 * title.aspect * k, .42 * k, 1);
    const z = lerp(7.5, 9.5, easeOut(clamp(t / 3))); const s = shake(t, t < .4 ? 4 : 1); place(c, [s[0], 2.5 + s[1], z], [0, 2.5, -1.4]);
    return { bloom: .4 };
  } };
}
const R0 = 512 * .44 * .42;
// B: the 1920s office: more sides = more danger (3.1 - 9.75)
function shotB({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 6, 5] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0x8a5a34)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), std(0xd9c9a8)); back.position.set(0, 5, -2.6); scene.add(back);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.4), std(0x24402e, { roughness: .95 })); board.position.set(0, 3.45, -2.55); scene.add(board);
  const yr = label('1920s', '#ffe14d', .5); yr.position.set(0, 6.6, -2.4); scene.add(yr);
  const order = ['rect', 'diamond', 'oct', 'circle'], names = ['4', '4', '8', '\u221e'];
  const signs = order.map((s, i) => { const m = makeSign(s, { size: 1.1, pole: .05 }); m.position.set(-.8, 1.05 + i * 1.25 - .5, -2.45); scene.add(m); return m; });
  const nums = names.map((n, i) => { const l = label(n + ' SIDES', '#ffffff', .3); l.position.set(.75, 1.2 + i * 1.25, -2.3); scene.add(l); return l; });
  const meter = label('DANGER', '#ff6b6b', .26); meter.position.set(1.75, 6.0, -2.4); scene.add(meter);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(.25, 1, .05), std(0xe0392f, { emissive: 0x801010 })); scene.add(bar);
  const eng = makeChar('prof'); eng.position.set(-1.55, 0, .6); scene.add(eng);
  const r1 = label('MORE SIDES', '#ffffff', .42), r2 = label('= MORE DANGER', '#ff8a8a', .42); r1.position.set(0, 4.3, -2.4); r2.position.set(0, 3.6, -2.4); scene.add(r1, r2);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    signs.forEach((m, i) => { const k = clamp((t - 6.3 - i * .55) / .3); m.visible = k > 0; m.scale.setScalar(.2 + .8 * backOut(k)); m.draw(t, { col: i === 0 ? '#2fae5a' : YEL, faceO: { eyes: i === 3 ? 'smug' : i === 0 ? 'half' : 'normal', mouth: i >= 2 ? 'grin' : 'flat' }, seed: i }, null); m.rotation.y = 0; nums[i].visible = k > .5; });
    const dk = clamp((t - 6.3) / 2.2), hgt = .2 + dk * 4.6; bar.scale.y = hgt; bar.position.set(1.75, .9 + hgt / 2, -2.45);
    r1.visible = t > 6.3 && t < 7.0 || (t > 5.6 && t < 6.3); r2.visible = r1.visible && t > 5.9; r1.visible = r1.visible && t < 7.0 && t < 6.3 + .0; r2.visible = r2.visible && t < 6.3;
    const point = t > 4.6, wow = t > 8.6;
    eng.draw(t, { seed: 2, arms: point ? { L: wow ? [2.6, .3] : [.3, -.1], R: [2.3, .4] } : { L: [.3, -.1], R: [.9, -1.9] }, hand: { R: point ? 'point' : 'open' }, face: { eyes: wow ? 'wide' : 'normal', mouth: wow ? 'o' : 'smile', look: [1, -.5], browUp: wow ? 1 : 0 } }, c);
    const z = kf(t, [[3.1, 11.5], [9.7, 10.2]]); const s = shake(t, 1); place(c, [s[0], 3.4 + s[1], z], [0, 3.4, -2.5]); faceCam([eng], c);
    return { bloom: .3 };
  } };
}
// C: country road: the bored rectangle, the nervous diamond (9.75 - 13.15)
function shotC({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-6, 7, 4] });
  road(scene, { trees: true });
  const rect = makeSign('rect', { size: 1.7 }); rect.position.set(-1.05, 0, -1.8); scene.add(rect);
  const dia = makeSign('diamond', { size: 1.6 }); dia.position.set(1.15, 0, -.4); scene.add(dia);
  const oc = oldCar(); scene.add(oc);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    rect.draw(t, { col: '#2fae5a', text: 'TOWN 3 MI', ts: 66, ty: 75, tcol: '#fff', fy: -45, fk: .7, faceO: { eyes: 'half', mouth: 'flat' }, seed: 1 }, c);
    const yell = t > 12.2;
    dia.draw(t, { col: YEL, text: 'CURVE', ts: 70, ty: 110, fk: .85, fy: -60, rot: yell ? Math.sin(t * 40) * .05 : 0, faceO: { eyes: yell ? 'wide' : 'normal', mouth: yell ? 'o' : 'flat', browUp: yell ? 1 : 0, look: [-1, .3] }, seed: 2 }, c);
    oc.position.set(lerp(-14, 10, clamp((t - 10.2) / 3)), 0, 2.2);
    const s = shake(t, 1); place(c, [s[0], 2.7 + s[1], lerp(9.5, 8.5, lt / 3.4)], [0, 2.4, -1.3]);
    return { bloom: .3 };
  } };
}
// D: railroad crossing: the circle got the scariest job and brags (13.15 - 19.3)
function shotD({ makeStage }) {
  const scene = makeStage({ shadowSize: 12, sunDir: [-6, 7, 4] });
  road(scene, { grass: 0x9bb35a }); rails(scene, -4);
  const circ = makeSign('circle', { size: 1.7 }); circ.position.set(-1.4, 0, -1.0); scene.add(circ);
  const tr = train(); scene.add(tr);
  const crown = label('#1', '#ffe14d', .5); scene.add(crown);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const talking = t > 17.4 && t < 19.2;
    const bump = t > 18.7 && t < 19.0 ? 1.12 : 1;
    circ.draw(t, { col: YEL, rr: true, fy: -10, fk: .55, sq: bump, faceO: { eyes: t > 15 ? 'smug' : 'normal', mouth: talking ? 'talk' : 'smirk', open: talking ? talkO(t) : 0, browAng: talking ? -.3 : 0, look: [.5, 0] }, seed: 3 }, c);
    tr.position.set(lerp(-40, 50, clamp((t - 15.4) / 2.4)), 0, -4);
    crown.visible = t > 18.6; crown.position.set(-1.4, 4.6, -1.0); const k = backOut(clamp((t - 18.6) / .25)); crown.scale.set(.6 * crown.aspect * k, .6 * k, 1);
    const close = t > 17.3; const s = shake(t, t > 15.6 && t < 17.6 ? 3.5 : 1);
    place(c, close ? [-1.0 + s[0], 2.9 + s[1], 4.6] : [2 + s[0], 3.2 + s[1], 11], close ? [-1.4, 2.8, -1] : [-.8, 2.2, -2]);
    return { bloom: .35 };
  } };
}
// E: the octagon gets STOP (19.3 - 22.2)
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-5, 7, 4] });
  road(scene, { cross: 3 }); houses(scene);
  const sign = makeSign('oct', { size: 1.8 }); sign.position.set(.2, 0, -1.2); scene.add(sign);
  const n2 = label('8 SIDES = #2', '#ffffff', .38); scene.add(n2);
  const oc = oldCar(); scene.add(oc);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const got = t > 21.8; const k = got ? backOut(clamp((t - 21.8) / .2)) : 0;
    sign.draw(t, { col: YEL, text: got ? 'STOP' : '', ts: 118 * Math.max(.01, k), ty: R0, sq: got ? 1 + (1 - clamp((t - 21.8) / .3)) * .3 : 1, faceO: { eyes: got ? 'happy' : 'normal', mouth: got ? 'grin' : 'smile', look: [0, -.3] }, seed: 4 }, c);
    n2.position.set(.2, 4.9, -1.2); n2.visible = t > 19.6;
    oc.position.set(Math.min(-1.6, lerp(-14, -1.6, clamp((t - 20.2) / 1.6))), 0, 2.4);
    const s = shake(t, got ? 2.5 : 1); place(c, [.2 + s[0], 2.8 + s[1], lerp(10, 7.5, lt / 2.9)], [.2, 2.6, -1.2]);
    return { bloom: .35, ...flashOut(t, 21.8) };
  } };
}
// F: the sun test: red fades to pink, so stop stays yellow (22.2 - 25.25)
function shotF({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-4, 9, 3], sun: 3.2 });
  road(scene, { grass: 0xd9b57a }); setSky(scene, 0x4aa0f0, 0x9fd0f5, 0xfff0c0, 0xd9b57a);
  const sun = glowSprite(0xfff2a0, 3.2); sun.position.set(4.5, 7.6, -8); scene.add(sun);
  const redS = makeSign('oct', { size: 1.6 }); redS.position.set(-1.05, 0, -1.2); scene.add(redS);
  const yelS = makeSign('oct', { size: 1.6 }); yelS.position.set(1.1, 0, -1.2); scene.add(yelS);
  const lab = label('RED FADES', '#ff9a9a', .3); scene.add(lab);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const f = clamp((t - 23.6) / 1.3);
    const col = '#' + new THREE.Color(RED).lerp(new THREE.Color('#f4c9c4'), f).getHexString();
    redS.draw(t, { col, text: 'STOP', ts: 110, ty: R0, tcol: '#fff', sq: 1 - f * .06, faceO: { eyes: f > .5 ? 'half' : 'normal', mouth: f > .5 ? 'frown' : 'smile', look: [0, -1] }, seed: 5 }, c);
    yelS.draw(t, { col: YEL, text: 'STOP', ts: 110, ty: R0, faceO: { eyes: t > 22.9 ? 'half' : 'normal', mouth: 'flat', look: [-1, 0] }, seed: 6 }, c);
    lab.position.set(-.9, 4.4, -1.2); lab.visible = t > 23.5;
    const s = shake(t, 1); place(c, [s[0], 2.8 + s[1], lerp(9.5, 8.6, lt / 3)], [0, 2.6, -1.2]);
    return { bloom: .6 };
  } };
}
// G: 1954: fade-proof red arrives (25.25 - 28.85)
function shotG({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-5, 7, 4] });
  road(scene, { cross: 3 }); houses(scene);
  const sign = makeSign('oct', { size: 1.8 }); sign.position.set(.2, 0, -1.2); scene.add(sign);
  const yr = label('1954', '#ffffff', .6); scene.add(yr);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .6, 20), std(0xd8231f, { metalness: .3 })); scene.add(can);
  const cars = [car(0x2f63c9), car(0xffffff)]; cars.forEach(x => scene.add(x));
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    const red = t > 27.5; const k = clamp((t - 27.5) / .25);
    sign.draw(t, { col: red ? RED : YEL, text: 'STOP', ts: 118, ty: R0, tcol: red ? '#fff' : '#1b1b1f', glow: red ? 1 - k : 0, sq: red ? 1 + (1 - k) * .25 : 1, faceO: { eyes: red ? 'happy' : 'normal', mouth: red ? 'grin' : 'smile', look: [0, -1] }, seed: 4 }, c);
    yr.position.set(.2, 5.0, -1.2); const yk = backOut(clamp((t - 25.4) / .3)); yr.scale.set(.7 * yr.aspect * yk, .7 * yk, 1);
    const ca = clamp((t - 26.3) / 1.2); can.visible = t < 27.6; can.position.set(lerp(3.5, .5, ca), lerp(6, 4.2, ca) + Math.sin(ca * Math.PI) * .6, -1.0); can.rotation.z = -ca * 2.2;
    cars.forEach((x, i) => { x.position.set(Math.min(-2.3 - i * 3, lerp(-16 - i * 3, -2.3 - i * 3, clamp((t - 27.6) / 1.1))), 0, 2.4); });
    const s = shake(t, red && t < 28 ? 3 : 1); place(c, [.2 + s[0], 2.8 + s[1], lerp(8.5, 7.8, lt / 3.6)], [.2, 2.8, -1.2]);
    return { bloom: red ? .6 : .35, ...flashOut(t, 27.5) };
  } };
}
// H: the circle is still yellow; nobody remembers (28.85 - end, loops into "Stop signs used to be yellow")
function shotH({ makeStage }) {
  const scene = makeStage({ shadowSize: 12, sunDir: [-6, 7, 4] });
  road(scene, { grass: 0x9bb35a, cross: 6 }); rails(scene, -4);
  const circ = makeSign('circle', { size: 1.7 }); circ.position.set(-.9, 0, -.6); scene.add(circ);
  const stop = makeSign('oct', { size: 1.4 }); stop.position.set(1.6, 0, -2.6); scene.add(stop);
  const still = label('STILL YELLOW', '#ffe14d', .36); scene.add(still);
  const c = cam(40);
  return { scene, camera: c, update(lt, t) {
    circ.draw(t, { col: YEL, rr: true, fy: -10, fk: .55, faceO: { eyes: 'half', mouth: 'frown', look: [1, 0], browAng: .2 }, seed: 3 }, c);
    const back = t > 32.6; // last beat flips the stop sign back to yellow so the loop restarts
    stop.draw(t, { col: back ? YEL : RED, text: 'STOP', ts: 118, ty: R0, tcol: back ? '#1b1b1f' : '#fff', faceO: { eyes: back ? 'wide' : 'smug', mouth: back ? 'o' : 'smirk', look: [-1, 0] }, seed: 7 }, c);
    still.position.set(-.9, 4.5, -.6); still.visible = t > 29.9 && t < 31.3;
    const push = clamp((t - 31.2) / 1.8);
    const s = shake(t, back ? 3 : 1); place(c, [lerp(0, 1.8, push) + s[0], 2.8 + s[1], lerp(9, 3.6, easeInOut(push))], [lerp(.1, 1.6, push), lerp(2.6, 2.9, push), -2.6]);
    return { bloom: .35, ...flashOut(t, 32.6) };
  } };
}
export const SHOTS = [
  { start: 0, end: 3.1, build: shotA },
  { start: 3.1, end: 9.75, build: shotB },
  { start: 9.75, end: 13.15, build: shotC },
  { start: 13.15, end: 19.3, build: shotD },
  { start: 19.3, end: 22.2, build: shotE },
  { start: 22.2, end: 25.25, build: shotF },
  { start: 25.25, end: 28.85, build: shotG },
  { start: 28.85, end: 99, build: shotH },
];
