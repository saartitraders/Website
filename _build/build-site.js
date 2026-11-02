#!/usr/bin/env node
// Builds the SAARTI website (saarti.in) into this WEBSITE folder.
//
//   node _build/build-site.js --preview   draft build: warns about [TO BE FILLED] and shows a
//                                         yellow "Preview: not final" bar on every page
//   node _build/build-site.js             final build: stops if [TO BE FILLED] is still used
//
// Run it from the WEBSITE folder. Legal texts, FAQ, contact details and colours are read from
// the app folder named in _build/site.config.json, by transpiling the .ts files in memory with
// the app's own typescript package (same approach as the app's scripts/build-legal-pages.js).
// The app folder is only read, never written. All other text is in _build/site-content.js.

const fs = require('fs');
const path = require('path');

const SITE = path.resolve(__dirname, '..');
const BUILD = __dirname;
const PREVIEW = process.argv.includes('--preview');
const MARKER = '[TO BE FILLED]';
const ORIGIN = 'https://saarti.in';

const written = [];
const fail = (msg) => {
  console.error(`\nSTOPPED: ${msg}\n${written.length ? 'Some files were already written; fix this and build again.' : 'Nothing was written.'}\n`);
  process.exit(1);
};

// ── Config: where the app is ────────────────────────────────────────────────────

const configPath = path.join(BUILD, 'site.config.json');
if (!fs.existsSync(configPath)) {
  fail('_build/site.config.json is missing. Copy _build/site.config.example.json to _build/site.config.json and set "appDir" to the SAARTI app folder on this computer.');
}
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  fail(`_build/site.config.json is not valid JSON (${e.message}). Windows paths need double backslashes: "F:\\\\SAARTI\\\\Saarti-DebtFree".`);
}
const appDir = typeof config.appDir === 'string' ? path.resolve(config.appDir) : '';
if (!appDir) fail('"appDir" is not set in _build/site.config.json. Set it to the SAARTI app folder, e.g. "F:\\\\SAARTI\\\\Saarti-DebtFree".');
const APP_FILES = ['constants/theme.ts', 'constants/appInfo.ts', 'constants/legalText.ts', 'constants/faqContent.ts', 'node_modules/typescript'];
const notFound = APP_FILES.filter((p) => !fs.existsSync(path.join(appDir, p)));
if (notFound.length) {
  fail(`"appDir" in _build/site.config.json is "${appDir}", but this is not the SAARTI app folder (not found there: ${notFound.join(', ')}). Fix "appDir" and run again.`);
}
if (SITE === appDir || SITE.startsWith(appDir + path.sep)) fail('The WEBSITE folder must not be inside the app folder.');

// ── Load the app's TypeScript constants (read-only) ─────────────────────────────

const ts = require(path.join(appDir, 'node_modules', 'typescript'));

const loadTs = (relPath, modules = {}) => {
  const source = fs.readFileSync(path.join(appDir, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relPath,
  });
  const mod = { exports: {} };
  const localRequire = (name) => {
    if (name in modules) return modules[name];
    throw new Error(`${relPath} imports "${name}", which build-site.js does not provide`);
  };
  new Function('exports', 'require', 'module', outputText)(mod.exports, localRequire, mod);
  return mod.exports;
};

const content = require('./site-content.js');

let appInfo, legal, faqContent, theme;
try {
  // theme.ts only needs Platform.select from react-native, for the shadow style
  theme = loadTs('constants/theme.ts', { 'react-native': { Platform: { select: (o) => o.default } } });
  appInfo = { ...loadTs('constants/appInfo.ts') };
  // While the app's backup sentence is unfilled, the website uses its own (in memory only)
  if (String(appInfo.BACKUP_RETENTION_TEXT).includes(MARKER) && content.BACKUP_RETENTION_TEXT_OVERRIDE) {
    appInfo.BACKUP_RETENTION_TEXT = content.BACKUP_RETENTION_TEXT_OVERRIDE;
    console.log(`Backup text: website override from site-content.js ("${appInfo.BACKUP_RETENTION_TEXT}")`);
  } else {
    console.log(`Backup text: app value from constants/appInfo.ts ("${appInfo.BACKUP_RETENTION_TEXT}")`);
  }
  legal = loadTs('constants/legalText.ts', { '@/constants/appInfo': appInfo });
  faqContent = loadTs('constants/faqContent.ts', { '@/constants/appInfo': appInfo });
} catch (e) {
  fail(`Could not read the app's constants: ${e.message}`);
}

const { APP_NAME, COMPANY_NAME, SUPPORT_EMAIL, CONTACT_EMAILS, JURISDICTION_CITY, COMPANY_ADDRESS } = appInfo;
const { colors } = theme;
const { FAQ_ITEMS } = faqContent;
const { HOME, ABOUT, PAGES, FAQ_CATEGORIES, FOOTER_DISCLAIMER } = content;
const PLAY_STORE_URL = (content.PLAY_STORE_URL || '').trim();
const YEAR = new Date().getFullYear();

const warnings = [];
const warn = (msg) => warnings.push(msg);

// ── [TO BE FILLED] check ────────────────────────────────────────────────────────

const strings = (v) => (typeof v === 'string' ? [v]
  : Array.isArray(v) ? v.flatMap(strings)
    : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);

const usedTexts = {
  'Privacy Policy (privacy-policy.html)': legal.PRIVACY_POLICY_TEXT,
  'Terms of Service (terms-and-conditions.html)': legal.TERMS_OF_SERVICE_TEXT,
  'Delete account (delete-account.html)': [legal.DELETE_ACCOUNT_TITLE, legal.DELETE_ACCOUNT_TEXT],
  'FAQ (faq.html, index.html)': FAQ_ITEMS,
  'Contact details (every page)': [CONTACT_EMAILS, JURISDICTION_CITY, COMPANY_ADDRESS, SUPPORT_EMAIL, COMPANY_NAME],
  '_build/site-content.js': content,
};
const markerIn = Object.keys(usedTexts).filter((k) => strings(usedTexts[k]).some((s) => s.includes(MARKER)));
const unfilledAppInfo = Object.keys(appInfo).filter((k) => typeof appInfo[k] === 'string' && appInfo[k].includes(MARKER));

if (markerIn.length) {
  const list = `"${MARKER}" is still in: ${markerIn.join('; ')}.`
    + (unfilledAppInfo.length ? `\nFill these values in the app's constants/appInfo.ts: ${unfilledAppInfo.join(', ')}.` : '');
  if (!PREVIEW) fail(`${list}\nFill them in, or run with --preview for a draft.`);
  warn(list);
}

// ── HTML helpers ────────────────────────────────────────────────────────────────

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const MARKER_HTML = esc(MARKER);

// Escapes the text, links email addresses and (in preview) highlights [TO BE FILLED]
const inline = (s) => esc(s)
  .replace(EMAIL_RE, (m) => `<a href="mailto:${m}">${m}</a>`)
  .split(MARKER_HTML).join(`<mark class="todo">${MARKER_HTML}</mark>`);

const slug = (s) => String(s).toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64).replace(/-+$/, '');

const mailto = (email, subject) => `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

const ICONS = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
  chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M8 14l2 2 4-4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  fileDone: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="m9 14 6 0"/>',
  swap: '<path d="M3 7h14l-3-3M21 17H7l3 3"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="3"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  bin: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
};
const icon = (name, width = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// ── Images ──────────────────────────────────────────────────────────────────────

const missingImages = new Set();
const hasFile = (rel) => fs.existsSync(path.join(SITE, rel));

// <img> when the file exists, else a light placeholder (and a warning)
const img = (src, alt, { lazy = false, cls = '' } = {}) => {
  if (!hasFile(src)) {
    missingImages.add(src);
    return `<div class="ph${cls ? ` ${cls}` : ''}" role="img" aria-label="${esc(alt || 'Image')}">Image coming soon</div>`;
  }
  return `<img src="${src}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
};
const phone = (src, alt, opts) => `<div class="phone"><div class="scr">${img(src, alt, opts)}</div></div>`;

const BRAND_IMAGES = [
  { file: 'saarti-mark.png', width: 256 },
  { file: 'saarti-logo-full.png', width: 600 },
];

// Copies the logos from the app, resized with the app's jimp-compact when it loads
const copyBrandImages = async () => {
  let Jimp = null;
  try {
    Jimp = require(path.join(appDir, 'node_modules', 'jimp-compact'));
  } catch {
    warn('jimp-compact could not be loaded from the app; logos were copied at full size.');
  }
  const outDir = path.join(SITE, 'assets', 'images', 'brand');
  fs.mkdirSync(outDir, { recursive: true });
  for (const { file, width } of BRAND_IMAGES) {
    const from = path.join(appDir, 'assets', 'images', 'brand', file);
    const to = path.join(outDir, file);
    if (!fs.existsSync(from)) {
      warn(`App logo not found: assets/images/brand/${file}`);
      continue;
    }
    if (Jimp) {
      try {
        const image = await Jimp.read(from);
        if (image.bitmap.width > width) image.resize(width, Jimp.AUTO);
        await image.writeAsync(to);
        written.push(`assets/images/brand/${file}`);
        continue;
      } catch (e) {
        warn(`Could not resize ${file} (${e.message}); copied at full size.`);
      }
    }
    fs.copyFileSync(from, to);
    written.push(`assets/images/brand/${file}`);
  }
};

// ── Shared page parts ───────────────────────────────────────────────────────────

const write = (rel, text) => {
  const file = path.join(SITE, rel);
  if (!file.startsWith(SITE + path.sep)) throw new Error(`Refusing to write outside WEBSITE: ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  written.push(rel);
};

// 404.html can be served at any address, so it uses root links; other pages use relative links
const linker = (root) => (p) => (root ? `/${p === 'index.html' ? '' : p}` : p);

const playButton = (cls = '') => (PLAY_STORE_URL
  ? `<a class="btn btn-primary ${cls}" href="${esc(PLAY_STORE_URL)}" rel="noopener">${icon('phone')}Get it on Google Play</a>`
  : `<span class="btn btn-primary ${cls}" aria-disabled="true">${icon('phone')}Coming soon on Google Play</span>`);

const NAV = [
  { label: 'Home', href: 'index.html', key: 'index.html' },
  { label: 'Features', href: 'index.html#features' },
  { label: 'How it works', href: 'index.html#how' },
  { label: 'CIBIL', href: 'index.html#cibil' },
  { label: 'FAQ', href: 'faq.html', key: 'faq.html' },
  { label: 'About', href: 'about.html', key: 'about.html' },
  { label: 'Contact', href: 'contact.html', key: 'contact.html' },
];

const grievance = CONTACT_EMAILS.find((c) => c.key === 'grievance');

const header = (page, L) => `<div class="util"><div class="wrap">
  <a class="mail" href="${mailto(SUPPORT_EMAIL)}">${icon('mail')}${esc(SUPPORT_EMAIL)}</a>
  <div class="util-r"><a href="${L('faq.html')}">Help &amp; FAQ</a>${grievance ? `<a href="${L('contact.html')}#grievance">Grievance Officer</a>` : ''}<a href="${L('delete-account.html')}">Delete account</a></div>
</div></div>
<header class="nav"><div class="wrap">
  <a class="brand" href="${L('index.html')}" aria-label="${esc(APP_NAME)} home"><img src="${L('assets/images/brand/saarti-mark.png')}" alt="" width="44" height="44"><span><b>${esc(APP_NAME)}</b><small>${esc(appInfo.APP_CATEGORY_LINE)}</small></span></a>
  <nav class="links" id="menu" aria-label="Main">${NAV.map((n) => `<a href="${L(n.href)}"${n.key === page ? ' class="on" aria-current="page"' : ''}>${n.label}</a>`).join('')}<a class="m-only" href="${L('privacy-policy.html')}">Privacy Policy</a><a class="m-only" href="${L('delete-account.html')}">Delete account</a>${playButton('btn-sm m-only')}</nav>
  <span class="nav-cta">${PLAY_STORE_URL ? playButton('btn-sm') : `<span class="btn btn-primary btn-sm" aria-disabled="true">${icon('phone')}Coming soon</span>`}</span>
  <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><svg class="lines" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICONS.menu}</svg><svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICONS.close}</svg></button>
</div></header>`;

const footer = (L) => `<footer><div class="wrap">
  <div class="f-grid">
    <div class="f-brand">
      <a class="brand" href="${L('index.html')}" aria-label="${esc(APP_NAME)} home"><img src="${L('assets/images/brand/saarti-mark.png')}" alt="" width="44" height="44" loading="lazy"><span><b>${esc(APP_NAME)}</b><small>${esc(appInfo.PRODUCT_BY_PREFIX)}<strong>${esc(appInfo.PRODUCT_BY_COMPANY)}</strong></small></span></a>
      <p class="disc">${esc(FOOTER_DISCLAIMER)}</p>
    </div>
    <div><h2>Pages</h2><ul><li><a href="${L('index.html')}">Home</a></li><li><a href="${L('index.html#features')}">Features</a></li><li><a href="${L('faq.html')}">Help &amp; FAQ</a></li><li><a href="${L('about.html')}">About</a></li><li><a href="${L('contact.html')}">Contact</a></li></ul></div>
    <div><h2>Legal</h2><ul><li><a href="${L('privacy-policy.html')}">Privacy Policy</a></li><li><a href="${L('terms-and-conditions.html')}">Terms of Service</a></li><li><a href="${L('delete-account.html')}">Delete account</a></li></ul></div>
    <div><h2>Contact</h2><ul>${CONTACT_EMAILS.map((c) => `<li>${inline(c.title)}<br><a class="mail" href="${mailto(c.email, c.subject)}">${esc(c.email)}</a></li>`).join('')}${JURISDICTION_CITY ? `<li>${inline(JURISDICTION_CITY)}, India</li>` : ''}</ul></div>
  </div>
  <div class="f-bot"><span>© ${YEAR} ${esc(COMPANY_NAME)}</span><nav aria-label="Legal"><a href="${L('privacy-policy.html')}">Privacy Policy</a><a href="${L('terms-and-conditions.html')}">Terms</a><a href="${L('delete-account.html')}">Delete account</a></nav></div>
</div></footer>`;

const layout = ({ file, body, root = false, noindex = false, active = file }) => {
  const L = linker(root);
  const meta = PAGES[file];
  const url = file === 'index.html' ? `${ORIGIN}/` : `${ORIGIN}/${file}`;
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="theme-color" content="${colors.primary}">
<meta name="robots" content="${noindex ? 'noindex' : 'index,follow'}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="${L('assets/images/favicon.png')}">
<link rel="apple-touch-icon" href="${L('assets/images/apple-touch-icon.png')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(APP_NAME)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/images/og-image.jpg">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/images/og-image.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap">
<link rel="stylesheet" href="${L('assets/css/style.css')}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${PREVIEW ? `<div class="preview-bar" role="note">Preview: not final. Some texts still say <mark>${MARKER_HTML}</mark>.</div>\n` : ''}${header(active, L)}
<main id="main">
${body}
</main>
${footer(L)}
<script src="${L('assets/js/main.js')}" defer></script>
</body>
</html>
`;
};

const scard = (c, extra = '') => `<div class="scard c-${c.colour}${extra}"><div class="top">${esc(APP_NAME)}<small>Credit card</small></div><div class="chip"></div><div class="num">•••• •••• •••• ${esc(c.last4)}</div><div class="bot"><span>${esc(c.left)}</span><span>${esc(c.right)}</span></div></div>`;
const fanCard = (c) => `<div class="scard c-${c.colour}"><div class="top">${esc(APP_NAME)}<small>Credit card</small></div><div class="chip"></div><div class="num">•••• ${esc(c.last4)}</div><div class="bot"><span>${esc(c.left)}</span><span>${esc(c.right)}</span></div></div>`;

// ── FAQ: categories and anchors ─────────────────────────────────────────────────

const faq = FAQ_ITEMS.map((item) => ({ ...item, id: slug(item.q), cat: null }));
for (const cat of FAQ_CATEGORIES) {
  for (const q of cat.questions) {
    const found = faq.find((f) => f.q === q);
    if (!found) warn(`site-content.js FAQ category "${cat.name}" lists a question that is not in the app: "${q}"`);
    else found.cat = cat.id;
  }
}
for (const f of faq) {
  if (!f.cat) {
    f.cat = FAQ_CATEGORIES[0].id;
    warn(`FAQ question not in any category, put in "${FAQ_CATEGORIES[0].name}": "${f.q}"`);
  }
}
const faqInCat = (cat) => cat.questions.map((q) => faq.find((f) => f.q === q && f.cat === cat.id)).filter(Boolean);
FAQ_CATEGORIES.forEach((cat) => {
  const n = faqInCat(cat).length;
  if (n < HOME.faq.perCategory) warn(`FAQ category "${cat.name}" has only ${n} question(s); the home page shows ${n} instead of ${HOME.faq.perCategory}.`);
});
const faqAnchor = (q) => {
  if (!q) return null;
  const f = faq.find((x) => x.q === q);
  if (!f) warn(`Feature "Learn more" link points to a question that is not in the app FAQ: "${q}" (link removed)`);
  return f ? `faq.html#${f.id}` : null;
};
const faqDetails = (f, { open = false, attrs = '' } = {}) => `<details id="${f.id}"${attrs}${open ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${inline(f.a)}</p></details>`;

// ── Pages ───────────────────────────────────────────────────────────────────────

const buildIndex = () => {
  const h = HOME.hero;
  const body = `<section class="hero"><div class="wrap">
  <div class="hero-copy">
    <span class="eyebrow">${esc(h.eyebrow)}</span>
    <h1>${esc(h.titleBefore)}<em>${esc(h.titleEm)}</em>${esc(h.titleAfter)}</h1>
    <p class="lead">${esc(h.lead)}</p>
    <div class="ctas">
      ${playButton()}
      <a class="btn btn-ghost" href="#how">${esc(h.secondaryCta)}</a>
    </div>
    <div class="trust-mini">${h.trust.map((t) => `<span>${icon('check', 2.4)}${esc(t)}</span>`).join('')}</div>
    <p class="byline">${esc(appInfo.PRODUCT_BY_PREFIX)}<b>${esc(appInfo.PRODUCT_BY_COMPANY)}</b></p>
  </div>
  <div class="stage">
    <div aria-hidden="true">${h.cards.map((c, i) => scard(c, i === 0 ? ' a' : ' b')).join('')}</div>
    ${phone(h.screen, 'SAARTI Home screen with card limit, loan balance and due this month')}
    <p class="stage-note">Example figures</p>
    ${h.chips.map((c, i) => `<div class="float f${i + 1}" aria-hidden="true"><span class="ic">${icon(c.icon)}</span><span><b>${esc(c.title)}</b>${esc(c.text)}</span></div>`).join('\n    ')}
  </div>
</div></section>

<div class="wrap steps" id="how"><ol class="steps-in">
${HOME.steps.map((s, i) => `  <li class="step"><span class="n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n')}
</ol></div>

<section class="block" id="features"><div class="wrap">
  <div class="head"><div><span class="eyebrow">${esc(HOME.features.eyebrow)}</span><h2>${esc(HOME.features.title)}</h2></div>
    <div class="arrows"><button class="arrow" type="button" data-dir="-1" aria-label="Previous features" aria-controls="rail">${icon('left')}</button><button class="arrow" type="button" data-dir="1" aria-label="Next features" aria-controls="rail">${icon('right')}</button></div></div>
  <ul class="rail" id="rail">
${HOME.features.items.map((f) => {
    const link = faqAnchor(f.faq);
    return `    <li class="svc"><span class="ic">${icon(f.icon, 1.8)}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p>${link ? `<a class="more" href="${link}">Learn more<span class="sr"> about ${esc(f.title)}</span> ${icon('arrow')}</a>` : ''}</li>`;
  }).join('\n')}
  </ul>
</div></section>

<section class="block showcase"><div class="wrap show-grid">
  <div class="fan" aria-hidden="true">${HOME.cards.fan.map(fanCard).join('')}</div>
  <div>
    <span class="eyebrow">${esc(HOME.cards.eyebrow)}</span>
    <h2 class="h2">${esc(HOME.cards.title)}</h2>
    <p class="sub-text">${esc(HOME.cards.text)}</p>
    <div class="util-card">
      <div class="util-row"><span>Limit</span><b>${esc(HOME.cards.meter.limit)}</b></div>
      <div class="util-row"><span>Outstanding</span><b>${esc(HOME.cards.meter.outstanding)}</b></div>
      <div class="meter" role="img" aria-label="${HOME.cards.meter.percent}% of the limit used"><i style="width:${HOME.cards.meter.percent}%"></i></div>
      <div class="util-row"><span>Utilisation</span><b class="good">${HOME.cards.meter.percent}% used</b></div>
    </div>
    <p class="example">${esc(HOME.cards.note)}</p>
  </div>
</div></section>

<section class="block"><div class="wrap split">
  <div class="split-visual">
    ${phone(HOME.due.screen, 'Monthly Due screen in SAARTI')}
    <div class="paid" aria-hidden="true">${HOME.due.paid.map((p) => `<div class="row"><b>${esc(p.label)}</b><span class="pill ${p.kind}">${esc(p.pill)}</span></div>`).join('')}</div>
    <div class="remind" aria-hidden="true"><b>${esc(HOME.due.remind.title)}</b><small>${esc(HOME.due.remind.text)}</small></div>
  </div>
  <div>
    <span class="eyebrow">${esc(HOME.due.eyebrow)}</span>
    <h2 class="h2">${esc(HOME.due.title)}</h2>
    <p class="sub-text">${esc(HOME.due.text)}</p>
    <ul class="checks">
${HOME.due.checks.map((c) => `      <li>${icon('check', 3)}${esc(c)}</li>`).join('\n')}
    </ul>
  </div>
</div></section>

<section class="block cibil" id="cibil"><div class="wrap">
  <div class="head center"><div class="head-in"><span class="eyebrow">${esc(HOME.cibil.eyebrow)}</span><h2>${esc(HOME.cibil.title)}</h2></div></div>
  <div class="tabbar-wrap"><div class="tabbar" role="tablist" aria-label="CIBIL report steps">
${HOME.cibil.tabs.map((t, i) => `    <button class="tab" type="button" role="tab" id="cibil-tab-${i + 1}" aria-selected="${i === 0}" aria-controls="cibil-${i + 1}"${i ? ' tabindex="-1"' : ''}>${esc(t.label)}</button>`).join('\n')}
  </div></div>
${HOME.cibil.tabs.map((t, i) => `  <div class="panel" id="cibil-${i + 1}" role="tabpanel" aria-labelledby="cibil-tab-${i + 1}"${i ? ' hidden' : ''}>${phone(t.screen, t.alt, { lazy: true })}
    <div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><div class="note">${esc(t.note)}</div></div></div>`).join('\n')}
</div></section>

<section class="block" id="screens"><div class="wrap">
  <div class="head center"><div class="head-in"><span class="eyebrow">${esc(HOME.gallery.eyebrow)}</span><h2>${esc(HOME.gallery.title)}</h2></div></div>
  <ul class="gallery">
${HOME.gallery.items.map((g) => `    <li><figure>${phone(g.screen, g.alt, { lazy: true })}<figcaption>${esc(g.caption)}</figcaption></figure></li>`).join('\n')}
  </ul>
</div></section>

<section aria-labelledby="privacy-title"><div class="wrap"><div class="trust">
  <div><span class="eyebrow">${esc(HOME.privacy.eyebrow)}</span><h2 id="privacy-title">${esc(HOME.privacy.title)}</h2><p class="sub">Read the full <a href="privacy-policy.html">Privacy Policy</a> or <a href="delete-account.html">delete your account</a>.</p></div>
  <div class="trust-grid">
${HOME.privacy.items.map((t) => `    <div class="t-item">${icon(t.icon)}<div><b>${esc(t.title)}</b><span>${esc(t.text)}</span></div></div>`).join('\n')}
  </div>
</div></div></section>

<section class="block" id="faq"><div class="wrap">
  <div class="head"><div><span class="eyebrow">${esc(HOME.faq.eyebrow)}</span><h2>${esc(HOME.faq.title)}</h2></div><a class="btn btn-ghost" href="faq.html">${esc(HOME.faq.allLabel)}</a></div>
  <div class="faq">
    <div class="cats" role="tablist" aria-label="FAQ categories">
${FAQ_CATEGORIES.map((c, i) => `      <button class="cat" type="button" role="tab" id="faq-tab-${c.id}" aria-selected="${i === 0}" aria-controls="faq-${c.id}"${i ? ' tabindex="-1"' : ''}>${esc(c.name)} ${icon('right')}</button>`).join('\n')}
    </div>
${FAQ_CATEGORIES.map((c, i) => `    <div class="qs" id="faq-${c.id}" role="tabpanel" aria-labelledby="faq-tab-${c.id}"${i ? ' hidden' : ''}>
${faqInCat(c).slice(0, HOME.faq.perCategory).map((f, j) => `      ${faqDetails({ ...f, id: `home-${f.id}` }, { open: j === 0 })}`).join('\n')}
    </div>`).join('\n')}
  </div>
</div></section>

<section aria-labelledby="cta-title"><div class="wrap"><div class="cta">
  <div class="cta-copy">
    <span class="eyebrow">${esc(HOME.cta.eyebrow)}</span>
    <h2 id="cta-title">${esc(PLAY_STORE_URL ? HOME.cta.titleLive : HOME.cta.titleSoon)}</h2>
    <p>${esc(PLAY_STORE_URL ? HOME.cta.textLive : HOME.cta.textSoon)}</p>
    <div>${playButton()}</div>
  </div>
  <div class="cta-photo">${img(HOME.cta.image, HOME.cta.alt, { lazy: true })}</div>
</div></div></section>`;
  write('index.html', layout({ file: 'index.html', body }));
};

// Legal text format (same as the app): blank line between paragraphs, "## " = heading,
// "• " = bullet, "1. " = numbered lead line
const renderLegal = (text) => {
  const html = [];
  const toc = [];
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (p === legal.LEGAL_VERSION_LINE) {
      html.push(`<p class="version">${icon('doc')}${inline(p)}</p>`);
      continue;
    }
    if (p.startsWith('## ')) {
      const title = p.slice(3).trim();
      let id = slug(title);
      while (toc.some((t) => t.id === id)) id += '-2';
      toc.push({ id, title });
      html.push(`<h2 id="${id}">${inline(title)}</h2>`);
      continue;
    }
    let bullets = [];
    const flush = () => {
      if (!bullets.length) return;
      html.push(`<ul>\n${bullets.map((b) => `  <li>${inline(b)}</li>`).join('\n')}\n</ul>`);
      bullets = [];
    };
    for (const raw of p.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('• ')) {
        bullets.push(line.slice(2).trim());
        continue;
      }
      flush();
      html.push(/^\d+\.\s/.test(line) ? `<p class="lead">${inline(line)}</p>` : `<p>${inline(line)}</p>`);
    }
    flush();
  }
  if (!text.includes(legal.LEGAL_VERSION_LINE)) warn('A legal text does not contain the version line.');
  return { html: html.join('\n'), toc };
};

const buildLegal = (file, eyebrow, title, text) => {
  if (typeof text !== 'string' || !text.trim()) fail(`No text found in the app for ${file}.`);
  const { html, toc } = renderLegal(text);
  const body = `<section class="page-hero"><div class="wrap">
  <span class="eyebrow">${esc(eyebrow)}</span>
  <h1>${esc(title)}</h1>
</div></section>
<div class="wrap inner-main"><div class="doc-layout">
  <nav class="toc" aria-label="On this page"><h2>On this page</h2><ol>
${toc.map((t) => `    <li><a href="#${t.id}">${inline(t.title)}</a></li>`).join('\n')}
  </ol></nav>
  <article class="doc">
${html}
  </article>
</div></div>`;
  write(file, layout({ file, body }));
};

const buildFaq = () => {
  const body = `<section class="page-hero"><div class="wrap">
  <span class="eyebrow">Help &amp; FAQ</span>
  <h1>Questions people ask</h1>
  <p>Answers from the ${esc(APP_NAME)} app's Help &amp; FAQ screen.</p>
</div></section>
<section class="block faq-page" style="padding-top:48px"><div class="wrap">
  <h2 class="sr">Contact us</h2>
  <div class="contact-row">
${CONTACT_EMAILS.map((c) => `    <div class="contact-card"><span class="ic">${icon(c.key === 'grievance' ? 'shield' : 'mail')}</span><h3>${inline(c.title)}</h3><p>${inline(c.description)}</p><a class="mail" href="${mailto(c.email, c.subject)}">${esc(c.email)}</a></div>`).join('\n')}
  </div>
  <div class="tabbar-wrap"><div class="tabbar" data-faq-filter aria-label="Show questions about">
    <button class="tab" type="button" data-cat="all" aria-pressed="true">All</button>
${FAQ_CATEGORIES.map((c) => `    <button class="tab" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('\n')}
  </div></div>
  <div class="faq-list">
${faq.map((f) => `    ${faqDetails(f, { attrs: ` data-cat="${f.cat}"` })}`).join('\n')}
  </div>
</div></section>`;
  write('faq.html', layout({ file: 'faq.html', body }));
};

const buildContact = () => {
  const body = `<section class="page-hero"><div class="wrap">
  <span class="eyebrow">Contact</span>
  <h1>Talk to us</h1>
  <p>Write to us by email. We read every message.</p>
</div></section>
<section class="block" style="padding-top:48px"><div class="wrap">
  <div class="contact-row">
${CONTACT_EMAILS.map((c) => `    <div class="contact-card" id="${esc(c.key)}"><span class="ic">${icon(c.key === 'grievance' ? 'shield' : 'mail')}</span><h2>${inline(c.title)}</h2><p>${inline(c.description)}</p><a class="mail" href="${mailto(c.email, c.subject)}">${esc(c.email)}</a></div>`).join('\n')}
  </div>
  <div class="info-card">
    <p><b>${esc(COMPANY_NAME)}</b>${COMPANY_ADDRESS ? `<br>${inline(COMPANY_ADDRESS)}` : ''}${JURISDICTION_CITY ? `<br>${inline(JURISDICTION_CITY)}, India` : ''}</p>
    <p>Looking for a quick answer? See <a href="faq.html">Help &amp; FAQ</a>. To delete your account and data, see <a href="delete-account.html">Delete account</a>.</p>
  </div>
</div></section>`;
  write('contact.html', layout({ file: 'contact.html', body }));
};

const buildAbout = () => {
  const body = `<section class="page-hero"><div class="wrap">
  <span class="eyebrow">${esc(ABOUT.eyebrow)}</span>
  <h1>${esc(ABOUT.title)}</h1>
  <p>${esc(ABOUT.intro)}</p>
</div></section>
<div class="wrap"><div class="about-grid">
  <div class="about-copy">
${ABOUT.sections.map((s) => `    <h2>${esc(s.title)}</h2>
    <ul>${s.bullets.map((b) => `<li>${icon('check', 3)}<span>${esc(b)}</span></li>`).join('')}</ul>`).join('\n')}
    <h2>Who makes ${esc(APP_NAME)}</h2>
    <p>${esc(APP_NAME)} is ${esc(appInfo.PRODUCT_BY_PREFIX.trim().toLowerCase())} ${esc(COMPANY_NAME)}. Questions? Write to <a class="mail" href="${mailto(SUPPORT_EMAIL)}" style="color:var(--blue);font-weight:700">${esc(SUPPORT_EMAIL)}</a> or see the <a href="contact.html" style="color:var(--blue);font-weight:700">Contact</a> page.</p>
    ${hasFile('assets/images/brand/saarti-logo-full.png') ? `<img class="about-logo" src="assets/images/brand/saarti-logo-full.png" alt="${esc(APP_NAME)} logo" loading="lazy">` : ''}
  </div>
  <div class="about-photo">${img(ABOUT.image, ABOUT.alt)}</div>
</div></div>`;
  write('about.html', layout({ file: 'about.html', body }));
};

const build404 = () => {
  const L = linker(true);
  const body = `<section class="notfound"><div class="wrap">
  <span class="eyebrow">404</span>
  <h1 class="h2">This page could not be found</h1>
  <p class="sub-text" style="margin-inline:auto">The page you are looking for does not exist or has moved.</p>
  <div class="ctas"><a class="btn btn-primary" href="${L('index.html')}">Back to home</a><a class="btn btn-ghost" href="${L('faq.html')}">Help &amp; FAQ</a></div>
</div></section>`;
  write('404.html', layout({ file: '404.html', body, root: true, noindex: true, active: null }));
};

const buildCss = () => {
  const tokens = {
    blue: colors.primary, 'blue-l': colors.primaryLight, 'blue-d': colors.primaryDeep,
    ink: colors.text, muted: colors.textSecondary, line: colors.border,
    wash: colors.background, tint: colors.tint, banner: colors.banner,
    ok: colors.success, 'ok-text': colors.successText, 'ok-tint': colors.successTint,
    warn: colors.warningText, 'warn-tint': colors.warningTint,
  };
  const missing = Object.keys(tokens).filter((k) => !tokens[k]);
  if (missing.length) fail(`Colours missing in the app's constants/theme.ts: ${missing.join(', ')}`);
  const vars = `  /* from the app's constants/theme.ts */\n${Object.entries(tokens).map(([k, v]) => `  --${k}:${v};`).join('\n')}`;
  const css = fs.readFileSync(path.join(BUILD, 'src', 'style.css'), 'utf8').replace('/*@THEME@*/', vars);
  write('assets/css/style.css', css);
  write('assets/js/main.js', fs.readFileSync(path.join(BUILD, 'src', 'main.js'), 'utf8'));
};

const buildSitemap = () => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const pages = ['', 'privacy-policy.html', 'terms-and-conditions.html', 'delete-account.html', 'faq.html', 'about.html', 'contact.html'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${ORIGIN}/${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
};

// ── Run ─────────────────────────────────────────────────────────────────────────

(async () => {
  await copyBrandImages();
  buildCss();
  buildIndex();
  // Website heading is "Privacy Policy" (the app calls it "Privacy Notice"); the text is unchanged
  buildLegal('privacy-policy.html', 'Legal', 'Privacy Policy', legal.PRIVACY_POLICY_TEXT);
  buildLegal('terms-and-conditions.html', 'Legal', legal.TERMS_OF_SERVICE_TITLE, legal.TERMS_OF_SERVICE_TEXT);
  buildLegal('delete-account.html', 'Your account', legal.DELETE_ACCOUNT_TITLE, legal.DELETE_ACCOUNT_TEXT);
  buildFaq();
  buildAbout();
  buildContact();
  build404();
  buildSitemap();

  for (const src of missingImages) warn(`Image missing, placeholder shown: ${src}`);

  console.log(`${PREVIEW ? 'PREVIEW' : 'FINAL'} build done. Files written in ${SITE}:`);
  written.forEach((f) => console.log(`  ${f}`));
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
})().catch((e) => {
  console.error(`\nBuild failed: ${e.stack || e.message}`);
  process.exit(1);
});
