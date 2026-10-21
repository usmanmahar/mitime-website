// MITIME website build: reads /content (JSON, edited via /admin), writes static HTML to /_site.
// Run: npm run build   (Netlify runs this automatically on every save in the CMS)
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const CONTENT = path.join(ROOT, 'content');
const SITE_URL = (process.env.URL || 'https://migrationtime.eu').replace(/\/$/, '');

// ---------- helpers ----------
const read = f => JSON.parse(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
const folder = d => fs.readdirSync(path.join(CONTENT, d)).filter(f => f.endsWith('.json'))
  .map(f => ({ slug: f.replace(/\.json$/, ''), ...read(path.join(d, f)) }));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = s => marked.parse(String(s || ''));
const mdInline = s => marked.parseInline(String(s || ''));
const initials = n => String(n || '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const pad = n => String(n).padStart(2, '0');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = n => WORDS[n] || String(n);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDate = d => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
const write = (p, html) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };
const byOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(String(b.name));
const ext = url => /^https?:/.test(url || '') ? ' target="_blank" rel="noopener"' : '';

// ---------- content ----------
const site = read('settings.json');
const home = read('pages/home.json');
const about = read('pages/about.json');
const contact = read('pages/contact.json');
const institutions = folder('institutions').sort(byOrder);
const partners = folder('partners').sort(byOrder);
const people = folder('people').sort(byOrder);
const dcs = folder('dcs').sort((a, b) => a.number - b.number);
const news = folder('news').sort((a, b) => new Date(b.date) - new Date(a.date));
const INST = Object.fromEntries(institutions.map(i => [i.slug, i]));
const PEOPLE = Object.fromEntries(people.map(p => [p.slug, p]));
const THEMES = Object.fromEntries((about.themes || []).map(t => [t.code, t]));
const personName = s => { const p = PEOPLE[s]; return p ? `${p.prefix ? p.prefix + ' ' : ''}${p.name}` : ''; };
const personLink = s => PEOPLE[s] ? `<a href="/people/#${esc(s)}">${esc(personName(s))}</a>` : '';
const dcName = d => d.name ? d.name : (d.status === 'Recruiting' ? 'Position open' : 'Doctoral candidate');

// The MITIME logomark, cropped as a background graphic (from the brand identity)
const MARK_PATH = 'M1941.73-153.64v1214.74l-185.24,41.18V77.16l-189.3,41.98v839.72c0,126.89-103.2,230.08-230.08,230.08s-230.08-103.2-230.08-230.08V221.46l-189.78,41.9v1025.44l-185.24,41.18V114.61L1292.26-9.18v968.04c0,24.72,20.11,44.84,44.84,44.84s44.84-20.11,44.84-44.84V-29.53l559.79-124.11Z';
const bgMark = (id, c1, c2) => `<svg class="bgmark" viewBox="840 -160 1110 1500" preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><path d="${MARK_PATH}" fill="url(#${id})"/></svg>`;

const avatar = (photo, name, cls = '', label = '') => photo
  ? `<img class="avatar ${cls}" src="${esc(photo)}" alt="${esc(name)}" loading="lazy">`
  : `<span class="avatar avatar--initials ${cls}" aria-hidden="true">${esc(label || initials(name))}</span>`;
const dcAvatar = (d, cls = '') => avatar(d.photo, d.name || `DC${d.number}`, d.name ? cls : `${cls} avatar--dc`, d.name ? '' : pad(d.number));

const NAV = [
  ['/', 'Home'], ['/about/', 'About'], ['/doctoral-candidates/', 'Doctoral candidates'], ['/people/', 'People'],
  ['/consortium/', 'Consortium'], ['/news/', 'News'], ['/contact/', 'Contact'],
];
const socials = () => {
  const s = site.social || {};
  const items = [['bluesky', 'Bluesky'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['tiktok', 'TikTok']].filter(([k]) => s[k]);
  return items.length ? `<ul class="social">${items.map(([k, l]) => `<li><a href="${esc(s[k])}" target="_blank" rel="noopener">${l}</a></li>`).join('')}</ul>` : '';
};

function layout({ title, description, current, body, pathName, identity = false }) {
  const pageTitle = title ? `${title} | ${site.site_title}` : `${site.site_title}: ${site.full_title}`;
  const desc = description || site.tagline;
  const ann = site.announcement && site.announcement.show && site.announcement.text
    ? `<div class="announce"><div class="wrap">${site.announcement.link ? `<a href="${esc(site.announcement.link)}">${esc(site.announcement.text)}</a>` : esc(site.announcement.text)}</div></div>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}${pathName}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}${pathName}">
<meta property="og:image" content="${SITE_URL}/assets/img/og-image.png">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/Overpass.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
${identity ? '<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${ann}
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="MITIME home"><img src="/assets/img/logo-black.svg" alt="MITIME" width="150" height="40"></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="sr">Menu</span><span class="bars" aria-hidden="true"></span></button>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul>${NAV.map(([href, label]) => `<li><a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="footer-top">
    <div class="wrap footer-grid">
      <div>
        <img class="footer-logo" src="/assets/img/logo-white-full.svg" alt="MITIME: Entanglements of Migration and Time in Post-industrial Urban Europe" width="300" height="48">
        <p class="footer-tag">${esc(site.tagline)}</p>
      </div>
      <nav aria-label="Footer"><ul class="footer-nav">${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}<li><a href="/privacy/">Privacy</a></li></ul></nav>
      <div>
        <p class="k k--light">Contact</p>
        <p><a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a></p>
        ${socials()}
      </div>
    </div>
    <div class="wrap funding">
      <img src="/assets/img/eu-emblem-white.png" alt="Funded by the European Union" width="230" height="52">
      <p>${esc(site.funding_statement)}</p>
    </div>
  </div>
  <div class="footer-partners"><div class="wrap"><img src="/assets/img/partners.png" width="1800" height="114" alt="Partner universities: University of Oulu, Ruhr University Bochum, University of Liège, University College Cork, Koç University, University of Deusto, Erasmus University Rotterdam"></div></div>
  <div class="wrap footer-base"><span>© ${new Date().getFullYear()} MITIME</span><span>Grant agreement No 101226734</span></div>
</footer>
<script src="/assets/js/site.js" defer></script>
${identity ? `<script>
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', function (user) {
    if (!user) window.netlifyIdentity.on('login', function () { document.location.href = '/admin/'; });
  });
}
</script>` : ''}
</body>
</html>`;
}

const pageHead = (kicker, title, lede = '', variant = '') => `
<section class="page-head ${variant}">
  ${bgMark('g' + Math.random().toString(36).slice(2, 7), '#dfeae8', '#bfd6d2')}
  <div class="wrap">
    <p class="k">${esc(kicker)}</p>
    <h1>${esc(title)}</h1>
    ${lede ? `<div class="lede">${typeof lede === 'string' && lede.startsWith('<') ? lede : `<p>${esc(lede)}</p>`}</div>` : ''}
  </div>
</section>`;

const dcCard = d => {
  const inst = INST[d.host] || {}; const th = THEMES[d.theme] || {};
  return `<li class="dc-card" data-theme="${esc(d.theme)}" data-host="${esc(d.host)}">
  <a href="/doctoral-candidates/${esc(d.slug)}/" class="dc-link">
    <div class="dc-top"><span class="dc-num">DC${pad(d.number)}</span>${d.photo ? avatar(d.photo, d.name, 'avatar--sm') : ''}</div>
    <p class="tag">${esc(d.theme)} · ${esc(th.name || '')}</p>
    <h3>${esc(d.title)}</h3>
    <p class="dc-meta"><strong>${esc(dcName(d))}</strong><br>${esc(inst.name || '')}${inst.city ? ', ' + esc(inst.city) : ''}</p>
    ${d.status === 'Recruiting' ? '<span class="pill pill--amber">Recruiting</span>' : ''}
  </a>
</li>`;
};

const newsCard = n => `<li class="news-card">
  <a href="/news/${esc(n.slug)}/">
    ${n.image ? `<img src="${esc(n.image)}" alt="" loading="lazy">` : `<div class="news-ph news-ph--${n.type === 'Event' ? 'amber' : 'teal'}" aria-hidden="true">${n.type === 'Event' ? bgMark('n' + n.slug.replace(/[^a-z0-9]/gi, ''), '#ffcd5c', '#e5a300') : bgMark('n' + n.slug.replace(/[^a-z0-9]/gi, ''), '#dfeae8', '#bfd6d2')}</div>`}
    <p class="tag">${esc(n.type || 'News')} · <time datetime="${esc(n.date)}">${fmtDate(n.date)}</time></p>
    <h3>${esc(n.title)}</h3>
    <p>${esc(n.summary || '')}</p>
  </a>
</li>`;

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'static'), OUT);
const urls = [];
const page = (p, opts) => { urls.push(p); write(p === '/' ? 'index.html' : p.replace(/^\//, '') + 'index.html', layout({ pathName: p, ...opts })); };

// HOME
page('/', { current: '/', identity: true, body: `
<section class="hero">
  ${bgMark('hero', '#dfeae8', '#bfd6d2')}
  <div class="wrap hero-inner">
    <p class="k">${esc(home.hero_kicker)}</p>
    <h1>${esc(home.hero_title)}</h1>
    <p class="hero-text">${esc(home.hero_text)}</p>
    <p class="actions"><a class="btn btn--ink" href="/doctoral-candidates/">Meet the doctoral candidates</a><a class="btn btn--line" href="/about/">About the network</a></p>
  </div>
</section>
<section class="stats" aria-label="MITIME in numbers">
  <div class="wrap"><ul class="stat-list">${(home.stats || []).map(s => `<li><span class="stat-v">${esc(s.value)}</span><span class="stat-l">${esc(s.label)}</span></li>`).join('')}</ul></div>
</section>
<section class="section">
  <div class="wrap split">
    <div><p class="k">The network [Why time]</p><h2>${esc(home.intro_title)}</h2></div>
    <div class="prose">${md(home.intro_body)}</div>
  </div>
</section>
<section class="section section--teal">
  <div class="wrap">
    <p class="k">Research [Five themes]</p>
    <h2>Five lenses on migration and time</h2>
    <ul class="theme-grid">${(about.themes || []).map(t => `<li><a href="/doctoral-candidates/?theme=${esc(t.code)}"><span class="tag">${esc(t.code)}</span><h3>${esc(t.name)}</h3><p>${esc(t.text)}</p><span class="more">${dcs.filter(d => d.theme === t.code).length} doctoral projects →</span></a></li>`).join('')}</ul>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="row-head"><div><p class="k">Doctoral candidates [Projects]</p><h2>Fifteen projects, seven cities</h2></div><a class="btn btn--line" href="/doctoral-candidates/">All projects</a></div>
    <ul class="dc-grid dc-grid--home">${dcs.slice(0, 3).map(dcCard).join('')}</ul>
  </div>
</section>
<section class="cities" aria-label="Partner cities">
  <div class="wrap"><p class="k k--light">Consortium [Cities]</p><ul>${(home.cities || []).map(c => `<li>${esc(c)}</li>`).join('')}</ul><a class="btn btn--amber" href="/consortium/">Universities and partners</a></div>
</section>
<section class="section">
  <div class="wrap">
    <div class="row-head"><div><p class="k">News [Latest]</p><h2>From the network</h2></div><a class="btn btn--line" href="/news/">All news</a></div>
    <ul class="news-grid">${news.slice(0, 3).map(newsCard).join('')}</ul>
  </div>
</section>` });

// ABOUT
page('/about/', { current: '/about/', title: about.title, body: `
${pageHead('About [The network]', about.title)}
<section class="section"><div class="wrap split"><div><p class="k">Overview</p><h2>A doctoral network on the times of migration</h2></div><div class="prose">${md(about.intro)}</div></div></section>
<section class="section section--teal"><div class="wrap">
  <p class="k">Research [Three agendas]</p><h2>Three cross-cutting agendas</h2>
  <ol class="agenda">${(about.agendas || []).map((a, i) => `<li><span class="agenda-n">0${i + 1}</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></li>`).join('')}</ol>
</div></section>
<section class="section"><div class="wrap">
  <p class="k">Research [Work packages]</p><h2>Five research themes</h2>
  <ul class="wp-list">${(about.themes || []).map(t => `<li><span class="wp-code">${esc(t.code)}</span><div><h3>${esc(t.name)}</h3><p>${esc(t.text)}</p></div><p class="wp-lead">Lead: ${esc((INST[t.lead] || {}).name || '')}<br><a href="/doctoral-candidates/?theme=${esc(t.code)}">See the projects →</a></p></li>`).join('')}</ul>
</div></section>
<section class="section section--paper2"><div class="wrap">
  <p class="k">Training [Programme]</p><h2>Training the next generation</h2>
  <p class="intro-p">Alongside their PhD programme at their host university, every doctoral candidate takes part in network-wide training, an academic secondment and a secondment with a non-academic partner.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Training</th><th scope="col">Format</th><th scope="col">When</th><th scope="col">Led by</th></tr></thead>
  <tbody>${(about.training || []).map(t => `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.format)}</td><td>${esc(t.when)}</td><td>${esc(t.host)}</td></tr>`).join('')}</tbody></table></div>
</div></section>
<section class="section"><div class="wrap">
  <p class="k">Approach [Principles]</p><h2>Six guiding principles</h2>
  <ul class="chips">${(about.principles || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
</div></section>` });

// DOCTORAL CANDIDATES
page('/doctoral-candidates/', { current: '/doctoral-candidates/', title: 'Doctoral candidates', description: 'The fifteen MITIME doctoral candidates and their projects.', body: `
${pageHead('Doctoral candidates [Projects]', 'Doctoral candidates and their projects', 'Fifteen doctoral researchers, each employed by one of our seven universities for three years, working on one of five research themes.')}
<section class="section"><div class="wrap">
  <div class="filters" role="group" aria-label="Filter projects">
    <div class="filter-row"><span class="filter-label">Theme</span>
      <button class="chip is-on" data-filter="theme" data-value="all" aria-pressed="true">All</button>
      ${(about.themes || []).map(t => `<button class="chip" data-filter="theme" data-value="${esc(t.code)}" aria-pressed="false">${esc(t.name)}</button>`).join('')}
    </div>
    <div class="filter-row"><span class="filter-label">University</span>
      <button class="chip is-on" data-filter="host" data-value="all" aria-pressed="true">All</button>
      ${institutions.map(i => `<button class="chip" data-filter="host" data-value="${esc(i.slug)}" aria-pressed="false">${esc(i.short_name || i.name)}</button>`).join('')}
    </div>
  </div>
  <p class="filter-count" aria-live="polite"></p>
  <ul class="dc-grid" id="dc-grid">${dcs.map(dcCard).join('')}</ul>
</div></section>` });

for (const d of dcs) {
  const inst = INST[d.host] || {}; const th = THEMES[d.theme] || {};
  const links = [d.email && `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`, d.orcid && `<a href="${esc(d.orcid)}"${ext(d.orcid)}>ORCID</a>`, d.website && `<a href="${esc(d.website)}"${ext(d.website)}>Website</a>`].filter(Boolean);
  const others = dcs.filter(x => x.theme === d.theme && x.slug !== d.slug);
  page(`/doctoral-candidates/${d.slug}/`, { current: '/doctoral-candidates/', title: `DC${pad(d.number)}: ${d.title}`, description: d.summary, body: `
<section class="page-head page-head--dc">
  ${bgMark('dc' + d.number, '#dfeae8', '#bfd6d2')}
  <div class="wrap">
    <p class="crumbs"><a href="/doctoral-candidates/">Doctoral candidates</a> / DC${pad(d.number)}</p>
    <p class="k">DC${pad(d.number)} [${esc(d.theme)} ${esc(th.name || '')}]</p>
    <h1>${esc(d.title)}</h1>
  </div>
</section>
<section class="section"><div class="wrap dc-detail">
  <article class="prose">
    <h2 class="h-sm">The project</h2>
    ${md(d.summary)}
    ${d.bio ? `<h2 class="h-sm">About ${esc(d.name || 'the researcher')}</h2>${md(d.bio)}` : ''}
  </article>
  <aside class="dc-aside">
    <div class="person-block">${dcAvatar(d)}<div><p class="person-name">${esc(d.name || (d.status === 'Recruiting' ? 'Position open' : 'Name to be announced'))}</p><p class="muted">${d.status === 'Recruiting' ? 'Recruitment in progress' : 'Doctoral candidate, MITIME'}</p></div></div>
    <dl class="facts">
      <dt>Host university</dt><dd>${inst.website ? `<a href="${esc(inst.website)}"${ext(inst.website)}>${esc(inst.name)}</a>` : esc(inst.name || '')}${inst.country ? `, ${esc(inst.country)}` : ''}</dd>
      <dt>Supervisor</dt><dd>${personLink(d.main_supervisor)}</dd>
      ${d.co_supervisor ? `<dt>Co-supervisor</dt><dd>${personLink(d.co_supervisor)}</dd>` : ''}
      ${(d.secondments || []).length ? `<dt>Secondments</dt><dd><ul>${d.secondments.map(s => `<li>${esc(s)}</li>`).join('')}</ul></dd>` : ''}
      <dt>Theme</dt><dd><a href="/doctoral-candidates/?theme=${esc(d.theme)}">${esc(d.theme)} ${esc(th.name || '')}</a></dd>
      ${links.length ? `<dt>Contact</dt><dd>${links.join('<br>')}</dd>` : ''}
    </dl>
  </aside>
</div></section>
${others.length ? `<section class="section section--teal"><div class="wrap"><p class="k">More in ${esc(th.name || d.theme)}</p><ul class="dc-grid">${others.map(dcCard).join('')}</ul></div></section>` : ''}` });
}

// PEOPLE
page('/people/', { current: '/people/', title: 'People', description: 'Supervisors, coordinators and doctoral candidates across the MITIME universities.', body: `
${pageHead('People [Across the network]', 'People', 'Supervisors, coordinators and doctoral candidates at the seven MITIME universities.')}
<nav class="jump" aria-label="Universities"><div class="wrap"><ul>${institutions.map(i => `<li><a href="#${esc(i.slug)}">${esc(i.short_name || i.name)}</a></li>`).join('')}</ul></div></nav>
${institutions.map((i, idx) => {
  const staff = people.filter(p => p.institution === i.slug).sort(byOrder);
  const its = dcs.filter(d => d.host === i.slug);
  return `<section class="section inst-section${idx % 2 ? ' section--paper2' : ''}" id="${esc(i.slug)}"><div class="wrap">
  <div class="inst-head"><div><p class="k">${esc(i.city)}, ${esc(i.country)}</p><h2>${esc(i.name)}</h2></div>${i.website ? `<a class="ext" href="${esc(i.website)}"${ext(i.website)}>Website ↗</a>` : ''}</div>
  ${staff.length ? `<ul class="people-grid">${staff.map(p => `<li class="person" id="${esc(p.slug)}">
    ${avatar(p.photo, p.name)}
    <div><h3>${p.profile_url ? `<a href="${esc(p.profile_url)}"${ext(p.profile_url)}>${esc(personName(p.slug))}</a>` : esc(personName(p.slug))}</h3>
    <p class="role">${esc(p.mitime_role)}</p>
    <p class="muted">${esc(p.position)}${p.field ? ` · ${esc(p.field)}` : ''}</p>
    ${p.email ? `<p class="muted"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>` : ''}</div>
  </li>`).join('')}</ul>` : ''}
  ${its.length ? `<h3 class="sub-h">Doctoral candidates</h3><ul class="mini-dcs">${its.map(d => `<li><a href="/doctoral-candidates/${esc(d.slug)}/">${dcAvatar(d, 'avatar--sm')}<span><strong>DC${pad(d.number)} · ${esc(dcName(d))}</strong><br>${esc(d.title)}</span></a></li>`).join('')}</ul>` : ''}
</div></section>`;
}).join('')}` });

// CONSORTIUM
page('/consortium/', { current: '/consortium/', title: 'Consortium', description: `The ${word(institutions.length)} universities and ${word(partners.length)} associated partners of MITIME.`, body: `
${pageHead('Consortium [Universities and partners]', 'Consortium', `${cap(word(institutions.length))} universities of the UNIC alliance of post-industrial cities, working with ${word(partners.length)} partners from city government, civil society, culture and policy.`)}
<section class="section"><div class="wrap">
  <p class="k">Beneficiaries [Universities]</p><h2>Seven universities</h2>
  <ul class="inst-grid">${institutions.map(i => `<li>
    ${i.logo ? `<img class="inst-logo" src="${esc(i.logo)}" alt="${esc(i.name)} logo" loading="lazy">` : ''}
    <p class="tag">${esc(i.city)}, ${esc(i.country)}</p><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p>
    <p class="inst-foot"><span>${dcs.filter(d => d.host === i.slug).length} doctoral candidate${dcs.filter(d => d.host === i.slug).length === 1 ? '' : 's'}</span>${i.website ? `<a href="${esc(i.website)}"${ext(i.website)}>Website ↗</a>` : ''}</p>
  </li>`).join('')}</ul>
</div></section>
<section class="section section--teal"><div class="wrap">
  <p class="k">Associated partners [Beyond academia]</p><h2>${cap(word(partners.length))} associated partners</h2>
  <p class="intro-p">Each associated partner mentors a doctoral candidate, hosts a secondment of one to four months, and contributes to our research forums and training schools.</p>
  <ul class="ap-grid">${partners.map(a => `<li>${a.logo ? `<img class="inst-logo" src="${esc(a.logo)}" alt="${esc(a.name)} logo" loading="lazy">` : ''}<p class="tag">${esc(a.country)}</p><h3>${a.website ? `<a href="${esc(a.website)}"${ext(a.website)}>${esc(a.name)}</a>` : esc(a.name)}</h3><p>${esc(a.description)}</p></li>`).join('')}</ul>
</div></section>` });

// NEWS
page('/news/', { current: '/news/', title: 'News', body: `
${pageHead('News [and events]', 'News and events')}
<section class="section"><div class="wrap"><ul class="news-grid">${news.map(newsCard).join('') || '<li>No news yet.</li>'}</ul></div></section>` });
for (const n of news) {
  page(`/news/${n.slug}/`, { current: '/news/', title: n.title, description: n.summary, body: `
<section class="page-head page-head--news">${bgMark('nh' + n.slug.replace(/[^a-z0-9]/gi, '').slice(-8), '#dfeae8', '#bfd6d2')}<div class="wrap narrow">
  <p class="crumbs"><a href="/news/">News</a></p>
  <p class="k">${esc(n.type || 'News')} [<time datetime="${esc(n.date)}">${fmtDate(n.date)}</time>]</p>
  <h1>${esc(n.title)}</h1>${n.summary ? `<div class="lede"><p>${esc(n.summary)}</p></div>` : ''}
</div></section>
<section class="section"><div class="wrap narrow">
  ${n.image ? `<img class="news-hero" src="${esc(n.image)}" alt="">` : ''}
  <div class="prose">${md(n.body)}</div>
  <p class="back"><a href="/news/">← All news</a></p>
</div></section>` });
}

// CONTACT
page('/contact/', { current: '/contact/', title: contact.title, body: `
${pageHead('Contact [Get in touch]', contact.title)}
<section class="section"><div class="wrap split">
  <div class="prose">${md(contact.body)}</div>
  <div class="contact-card">
    <p class="k">Email</p><p class="big-link"><a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a></p>
    <p class="k">Post</p><p>${esc(site.address)}</p>
    ${socials() ? `<p class="k">Follow</p>${socials()}` : ''}
  </div>
</div></section>` });

// PRIVACY
page('/privacy/', { title: 'Privacy', body: `
${pageHead('Privacy', 'Privacy notice')}
<section class="section"><div class="wrap narrow prose">
<p>This website does not use tracking cookies or analytics. Fonts and images are served from this site itself; no data is sent to third parties when you browse it.</p>
<p>If you email us, we use your message and address only to reply and delete them when they are no longer needed. The controller is the University of Oulu, coordinator of MITIME. To ask about your data, write to <a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>.</p>
<p>Photos of people on this site are published with their consent. Ask us at any time to remove a photo.</p>
</div></section>` });

// 404
write('404.html', layout({ pathName: '/404.html', title: 'Page not found', body: `${pageHead('Error [404]', 'Page not found', 'The page may have moved. Try the menu above or go back to the homepage.')}` }));

// SITEMAP + robots
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nDisallow: /admin/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${urls.length} pages into _site/`);
