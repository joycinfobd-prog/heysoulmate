const express = require('express'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.SECRET || crypto.createHash('sha256').update('s:' + PASS).digest('hex');
const FILE = path.join(__dirname, 'data', 'content.json'), UP = path.join(__dirname, 'data', 'uploads');
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// ---- storage: Upstash Redis (needed on Vercel) or local files (VPS / your PC) ----
const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const noStore = () => Object.assign(new Error('Storage not set up: add an Upstash Redis database to this Vercel project (see README), then redeploy.'), { status: 503 });
const redis = async cmd => {
  const r = await fetch(RURL, { method: 'POST', headers: { Authorization: 'Bearer ' + RTOK, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
};
const readSeed = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const DEF = require('./defaults');
const rid = () => crypto.randomBytes(4).toString('hex');
async function load() {
  let c; if (RURL) { const raw = await redis(['GET', 'content']); c = raw ? JSON.parse(raw) : readSeed(); } else c = readSeed();
  if (!c.photos) c.photos = [];
  if (!c.photoThemes) c.photoThemes = JSON.parse(fs.readFileSync(path.join(__dirname, 'photo-defaults.json'), 'utf8'));
  const fresh = c.boxes === undefined;
  for (const k in DEF) if (c[k] === undefined) c[k] = DEF[k];
  if (fresh && Array.isArray(c.letters)) {                       // old version: single letter list -> "Open When…" box
    const ow = c.boxes.find(b => b.id === 'openwhen');
    if (ow && c.letters.length) ow.letters = c.letters.map(l => ({ id: 'l' + rid(), emoji: '💌', title: l.title || '', photoId: '', body: l.body || '' }));
  }
  delete c.letters; delete c.letterTitle;
  c.photos = c.photos.map(p => ({ title: '', body: '', ...p }));
  return c;
}
async function save(c) {
  if (RURL) return redis(['SET', 'content', JSON.stringify(c)]);
  if (process.env.VERCEL) throw noStore();
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(c, null, 2)); fs.renameSync(FILE + '.tmp', FILE);
}
async function putImg(name, mime, buf) {
  if (RURL) return redis(['SET', 'img:' + name, mime + '|' + buf.toString('base64')]);
  if (process.env.VERCEL) throw noStore();
  fs.mkdirSync(UP, { recursive: true }); fs.writeFileSync(path.join(UP, name), buf);
}
async function getImg(name) {
  if (RURL) { const v = await redis(['GET', 'img:' + name]); if (!v) return null; const i = v.indexOf('|'); return { mime: v.slice(0, i), buf: Buffer.from(v.slice(i + 1), 'base64') }; }
  const f = path.join(UP, name); return fs.existsSync(f) ? { mime: MIME[path.extname(name)], buf: fs.readFileSync(f) } : null;
}
async function delImg(name) { if (RURL) return redis(['DEL', 'img:' + name]); fs.rm(path.join(UP, name), () => {}); }

const A = f => (q, s, n) => f(q, s, n).catch(e => { console.error(e); s.status(e.status || 500).json({ error: e.status ? e.message : 'Server error' }); });
const pick = a => a[Math.floor(Math.random() * a.length)];
const sign = t => crypto.createHmac('sha256', SECRET).update(t).digest('hex');
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

app.set('trust proxy', 1);
app.use((q, r, n) => (q.method === 'POST' && q.path === '/api/admin/photos') ? n() : express.json({ limit: '1mb' })(q, r, n));
app.use(express.static(path.join(__dirname, 'public')));

// ---- text generators: unlimited combos, emoji always matches the theme ----
const gen = themes => { const t = pick(themes); return { text: pick(t.starts) + ' ' + pick(t.ends), emoji: pick(t.emoji) }; };
async function ai(kind, n) {   // optional: set ANTHROPIC_API_KEY and tick "Use AI" in admin
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 400,
        messages: [{ role: 'user', content: `Write ${n} new, short, sweet ${kind} for a romantic birthday website (Bubu & Dudu bear/panda couple theme). One line each, max 12 words, no emoji inside the text. Reply ONLY with JSON: [{"text":"...","emoji":"ONE emoji that matches the text"}]` }] })
    });
    const j = await r.json();
    return JSON.parse(j.content[0].text.replace(/```json|```/g, '').trim()).slice(0, n).map(x => ({ text: String(x.text), emoji: String(x.emoji) }));
  } catch { return null; }
}
const make = (key, kind) => A(async (req, res) => {
  const c = await load(), n = Math.min(Math.max(+req.query.n || 1, 1), 6);
  let items = c.useAI ? await ai(kind, n) : null;
  if (!items) items = Array.from({ length: n }, () => gen(c[key]));
  res.json({ items });
});

// ---- public API ----
const isLocked = b => !!b.unlockAt && Date.now() < new Date(b.unlockAt + 'T00:00:00+06:00').getTime();   // Bangladesh time
const boxView = b => ({ id: b.id, title: b.title, subtitle: b.subtitle, icon: b.icon, kind: b.kind, target: b.target, theme: b.theme, hasPin: !!b.pin, locked: isLocked(b), unlockAt: b.unlockAt, lockMessage: b.lockMessage, count: (b.letters || []).length });
app.get('/api/content', A(async (req, res) => { const { momentThemes, reasonThemes, photoThemes, photos, useAI, boxes, ...pub } = await load(); pub.boxes = boxes.map(boxView); res.json(pub); }));
const tries = new Map();
const limited = (key, max, ms) => { const now = Date.now(), t = (tries.get(key) || []).filter(x => now - x < ms); if (t.length >= max) return true; t.push(now); tries.set(key, t); return false; };
app.post('/api/box/:id/open', A(async (req, res) => {
  const c = await load(), b = c.boxes.find(x => x.id === req.params.id && x.kind === 'letters'), pin = String((req.body || {}).pin || '');
  if (!b) return res.status(404).json({ error: 'Box not found' });
  if (isLocked(b)) return res.status(423).json({ error: b.lockMessage || 'This box is still locked 🔒', locked: true, unlockAt: b.unlockAt });
  if (b.pin) {
    if (!pin) return res.status(401).json({ error: 'PIN needed', needPin: true });
    if (limited('pin:' + req.ip, 8, 60000)) return res.status(429).json({ error: 'Too many tries. Please wait a minute.', needPin: true });
    if (!safeEq(pin, b.pin)) return res.status(401).json({ error: 'Wrong PIN 🥺 Try again', needPin: true });
  }
  const src = new Map(c.photos.map(p => [p.id, '/uploads/' + p.file]));
  res.json({ box: { ...boxView(b), letters: b.letters.map(l => ({ id: l.id, title: l.title, emoji: l.emoji, body: l.body, photo: src.get(l.photoId) || '' })) } });
}));
app.get('/api/moments', make('momentThemes', 'cute couple moment captions'));
app.get('/api/reasons', make('reasonThemes', '"reasons I love you" lines'));
app.get('/api/photolines', make('photoThemes', 'naughty-cute one-line photo captions (playful, teasing, affectionate)'));
const slim = p => ({ id: p.id, src: '/uploads/' + p.file, caption: p.caption || '', title: p.title || '', hasLetter: !!(p.body && p.body.trim()) });
app.get('/api/photos', A(async (req, res) => { const c = await load(); res.json({ photos: c.photos.map(p => req.query.full ? { ...slim(p), body: p.body || '' } : slim(p)) }); }));
app.get('/uploads/:file', A(async (q, s) => {
  if (!/^[a-f0-9]{12}\.(jpg|png|webp)$/.test(q.params.file)) return s.sendStatus(404);
  const im = await getImg(q.params.file); if (!im) return s.sendStatus(404);
  s.set('Content-Type', im.mime); s.set('Cache-Control', 'public, max-age=604800, immutable'); s.send(im.buf);
}));

// ---- admin auth (signed, HttpOnly cookie) ----
let fails = 0, lockUntil = 0;
const authed = req => {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)tok=([^;]+)/); if (!m) return false;
  const [ts, sig] = decodeURIComponent(m[1]).split('.');
  return !!sig && safeEq(sig, sign(ts)) && Date.now() - +ts < 7 * 864e5;
};
const guard = (req, res, next) => authed(req) ? next() : res.status(401).json({ error: 'login required' });
app.post('/api/login', (req, res) => {
  if (Date.now() < lockUntil) return res.status(429).json({ error: 'Too many attempts. Wait a minute.' });
  if (!safeEq(String((req.body || {}).password || ''), PASS)) {
    if (++fails >= 5) { lockUntil = Date.now() + 60000; fails = 0; }
    return setTimeout(() => res.status(401).json({ error: 'Wrong password' }), 700);
  }
  fails = 0; const ts = String(Date.now());
  res.cookie('tok', ts + '.' + sign(ts), { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: 7 * 864e5 });
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie('tok'); res.json({ ok: true }); });
app.get('/api/admin/me', (req, res) => res.json({ authed: authed(req) }));
app.get('/api/admin/content', guard, A(async (req, res) => res.json(await load())));
app.put('/api/admin/content', guard, A(async (req, res) => {
  const c = req.body, S = a => Array.isArray(a) && a.every(x => typeof x === 'string');
  const T = a => Array.isArray(a) && a.length && a.every(t => S(t.emoji) && t.emoji.length && S(t.starts) && t.starts.length && S(t.ends) && t.ends.length);
  if (!c || !S(c.letter) || !S(c.promises) || !S(c.hug) || !T(c.momentThemes) || !T(c.reasonThemes) || !Array.isArray(c.chips))
    return res.status(400).json({ error: 'Invalid data' });
  const cur = await load(), byId = new Map(cur.photos.map(p => [p.id, p]));
  if (!T(c.photoThemes)) c.photoThemes = cur.photoThemes;
  const str = (v, n, d) => (typeof v === 'string' ? v.slice(0, n) : d);
  c.photos = (Array.isArray(c.photos) ? c.photos : cur.photos).filter(p => p && byId.has(p.id))
    .map(p => ({ id: p.id, file: byId.get(p.id).file, caption: str(p.caption, 200, ''), title: str(p.title, 120, ''), body: str(p.body, 10000, '') }));
  c.galleryTitle = str(c.galleryTitle, 80, DEF.galleryTitle) || DEF.galleryTitle;
  c.whatsapp = String(c.whatsapp || '').replace(/[^\d+]/g, '').slice(0, 20) || DEF.whatsapp;
  c.togetherSince = /^\d{4}-\d{2}-\d{2}$/.test(c.togetherSince || '') ? c.togetherSince : '';
  c.togetherLabel = str(c.togetherLabel, 120, DEF.togetherLabel);
  c.quick = S(c.quick) ? c.quick.map(x => x.slice(0, 120)).slice(0, 12) : DEF.quick;
  c.hubTitle = str(c.hubTitle, 120, DEF.hubTitle) || DEF.hubTitle; c.hubSubtitle = str(c.hubSubtitle, 200, DEF.hubSubtitle);
  const okId = v => /^[a-z0-9_-]{1,40}$/i.test(v || '');
  c.boxes = (Array.isArray(c.boxes) ? c.boxes : cur.boxes).slice(0, 60).map(b => ({
    id: okId(b.id) ? b.id : 'b' + rid(), title: str(b.title, 80, ''), subtitle: str(b.subtitle, 160, ''), icon: str(b.icon, 8, '') || '💌',
    kind: ['birthday', 'photos', 'letters', 'link'].includes(b.kind) ? b.kind : 'letters',
    target: /^(https?:\/\/|\/)/.test(b.target || '') ? str(b.target, 300, '') : '',
    theme: ['rose', 'lavender', 'peach', 'midnight'].includes(b.theme) ? b.theme : 'rose',
    pin: str(b.pin, 12, '').trim(), unlockAt: /^\d{4}-\d{2}-\d{2}$/.test(b.unlockAt || '') ? b.unlockAt : '', lockMessage: str(b.lockMessage, 200, ''),
    letters: (Array.isArray(b.letters) ? b.letters : []).slice(0, 500).map(l => ({ id: okId(l && l.id) ? l.id : 'l' + rid(), title: str(l && l.title, 120, ''), emoji: str(l && l.emoji, 8, '') || '💌', photoId: str(l && l.photoId, 40, ''), body: str(l && l.body, 10000, '') })).filter(l => l.body.trim() || l.title.trim())
  }));
  const seen = new Set(); c.boxes.forEach(b => { if (seen.has(b.id)) b.id = 'b' + rid(); seen.add(b.id); });
  delete c.letters; delete c.letterTitle;
  await save(c); res.json({ ok: true });
}));
app.post('/api/admin/photos', guard, express.json({ limit: '4mb' }), A(async (req, res) => {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String((req.body || {}).data || ''));
  if (!m) return res.status(400).json({ error: 'Bad image' });
  const buf = Buffer.from(m[2], 'base64'), ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const id = crypto.randomBytes(6).toString('hex'), file = id + '.' + ext;
  await putImg(file, 'image/' + m[1], buf);
  const c = await load(), photo = { id, file, caption: '', title: '', body: '' }; c.photos.push(photo); await save(c); res.json({ photo });
}));
app.delete('/api/admin/photos/:id', guard, A(async (req, res) => {
  const c = await load(), p = c.photos.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await delImg(p.file); c.photos = c.photos.filter(x => x !== p); await save(c); res.json({ ok: true });
}));
app.get('/letter', (req, res) => res.sendFile(path.join(__dirname, 'public', 'letter.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

module.exports = app;   // Vercel uses this export; locally we start a server below
if (require.main === module) {
  app.listen(PORT, () => console.log(`Site: http://localhost:${PORT}   Admin: http://localhost:${PORT}/admin`));
  if (PASS === 'admin123') console.log('WARNING: default admin password in use. Set ADMIN_PASSWORD.');
}
