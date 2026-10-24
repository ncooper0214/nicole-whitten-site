// Builds the site into _site/. No npm install needed: uses Node built-ins plus the two small libraries in lib/.
const fs = require('fs');
const path = require('path');
const { marked } = require('./lib/marked.umd.js');
const yaml = require('./lib/js-yaml.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const T = (n) => fs.readFileSync(path.join(ROOT, 'templates', n), 'utf8');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, vars) => tpl.replace(/%%(\w+)%%/g, (m, k) => (k in vars ? String(vars[k]) : m));
const plain = (s) => String(s || '').replace(/\*/g, '');
const accentHTML = (s) => esc(s).replace(/\*(.+?)\*/g, '<i style="color: #FFA987;">$1</i>');
const rel = (p) => String(p || '').replace(/^\/+/, '');

const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
function toDate(v) {
  if (v instanceof Date) return new Date(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate());
  const m = String(v || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
}
const apDate = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

// ---- site settings (email, LinkedIn, resume)
const site = readJSON('content/site.json');
const siteVars = {
  email: esc(site.email || ''),
  linkedin: esc(site.linkedin || ''),
  linkedin_display: esc(String(site.linkedin || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')),
  resume: esc(rel(site.resume || 'files/Nicole-Whitten-Resume.pdf')),
};

// ---- clean output, copy public files
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });

// ---- blog posts
const postsDir = path.join(ROOT, 'content/posts');
const posts = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const data = m ? (yaml.load(m[1]) || {}) : {};
  const body = m ? m[2] : raw;
  const slug = f.replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const words = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
  return { ...data, slug, body, date: toDate(data.date), mins: Math.max(1, Math.round(words / 220)) };
}).filter((p) => !p.draft && p.title).sort((a, b) => b.date - a.date);

const BANDS = [['#C3B5FF', '#2A1C6E'], ['#FFA987', '#3A1608'], ['#F3EEFF', '#4A3F5E']];
function renderBody(md) {
  let h = marked.parse(md, { mangle: false, headerIds: false });
  h = h.replace(/<p>\s*(<img [^>]*>)\s*<\/p>/g, (m, img) => {
    img = img.replace(/src="\/?/, 'src="').replace(/\s*\/?>$/, ' loading="lazy" style="display: block; width: 100%; height: auto; aspect-ratio: 15 / 8; border-radius: 20px;">');
    return `<figure class="nw-rv nw-fig" style="margin: 16px -40px; padding: 0;">${img}</figure>`;
  });
  h = h.replace(/<h2>/g, '<h2 class="nw-rv">');
  return h;
}
const postTpl = T('_post.html');
const altFor = (p) => (p.image_alt || `Illustration for "${plain(p.title)}"`);
posts.forEach((p, i) => {
  const next = posts[(i + 1) % posts.length];
  const band = BANDS[i % 3];
  const readNext = posts.length > 1 ? `<section aria-label="Read next" style="max-width: 880px; margin: 0 auto; padding: 0 24px 64px;">
<a class="nw-rv nw-card" href="blog-${next.slug}.html" style="display: flex; flex-direction: column; gap: 8px; border-radius: 24px; border: 1px solid #3A3354; padding: 32px 36px; color: #F3EEFF;">
<span style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #C3B5FF;">Read next</span>
<span style="font-family: 'Instrument Serif', serif; font-size: 34px; line-height: 1.1;">${accentHTML(next.title)}</span>
<span style="font-size: 15px; color: #C3B5FF;">${esc(next.category || '')} · ${next.mins} min read →</span>
</a>
</section>` : '';
  const html = fill(postTpl, {
    ...siteVars,
    title_plain: esc(plain(p.title)), title_plain_attr: esc(plain(p.title)), title_html: accentHTML(p.title),
    intro: esc(p.intro || ''), intro_attr: esc(p.intro || ''), category: esc(p.category || ''),
    date: apDate(p.date), mins: p.mins, band_bg: band[0], band_fg: band[1],
    body: renderBody(p.body), read_next: readNext,
  });
  fs.writeFileSync(path.join(OUT, `blog-${p.slug}.html`), html);
});

// ---- blog index
const cardTpl = T('_partial_card.html');
const featTpl = T('_partial_featured.html');
const cardVars = (p) => ({ url: `blog-${p.slug}.html`, image: esc(rel(p.image)), image_alt: esc(altFor(p)), category: esc(p.category || ''), title_plain: esc(plain(p.title)), intro: esc(p.intro || ''), date: apDate(p.date), mins: p.mins });
const [featured, ...rest] = posts;
fs.writeFileSync(path.join(OUT, 'blog.html'), fill(T('blog.html'), {
  ...siteVars,
  featured: featured ? fill(featTpl, cardVars(featured)) : '',
  cards: rest.map((p) => fill(cardTpl, cardVars(p))).join('\n'),
}));

// ---- writing samples
const TONES = [['#FFA987', '#3A1608'], ['#C3B5FF', '#2A1C6E'], ['#F3EEFF', '#4A3F5E']];
const sampleTpl = T('_partial_sample.html');
const samples = (readJSON('content/writing.json').samples || []).map((s, i) => {
  const t = TONES[(i + Math.floor(i / 3)) % 3];
  return fill(sampleTpl, { link: esc(s.link || '#'), bg: t[0], fg: t[1], type: esc(s.type || ''), org: esc(s.org || ''), title: esc(s.title || ''), description: esc(s.description || '') });
});
fs.writeFileSync(path.join(OUT, 'writing.html'), fill(T('writing.html'), { ...siteVars, samples: samples.join('\n') }));

// ---- every other page
for (const f of fs.readdirSync(path.join(ROOT, 'templates'))) {
  if (f.startsWith('_') || f === 'blog.html' || f === 'writing.html') continue;
  fs.writeFileSync(path.join(OUT, f), fill(T(f), siteVars));
}
console.log(`Built ${posts.length} posts, ${samples.length} writing samples.`);
