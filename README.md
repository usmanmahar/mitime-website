# MITIME website

The website of **MITIME – Entanglements of Migration and Time in Post-industrial Urban Europe** (MSCA Doctoral Network, GA 101226734).

- **Public site:** a fast static website (no database, nothing to patch or hack).
- **Editor:** a web editor at `/admin/`, where the team logs in to edit text, add news and upload photos. No coding needed.
- **Hosting:** Netlify (free plan). Every change saved in the editor rebuilds the site in about a minute.

```
content/        ← all text, as JSON files (this is what the editor changes)
  dcs/            15 doctoral candidates and their projects
  people/         supervisors and staff
  institutions/   the 7 universities
  partners/       the associated partners
  news/           news, events, blog posts
  pages/          home, about and contact page texts
  settings.json   contact email, social links, announcement bar, EU funding statement
static/         ← design files: CSS, logos, fonts, the editor (static/admin/), uploads
build.js        ← turns content/ into the website in _site/
```

---

## 1. Put it online (one-off, about 30 minutes)

You need a free **GitHub** account (to store the site) and a free **Netlify** account (to host it). Use a shared project email address if you can, e.g. the coordination mailbox, so access doesn't depend on one person.

1. **GitHub:** create a new **private** repository called `mitime-website`. Upload all the files from this folder (on github.com: *Add file → Upload files*, drag the folder contents in, *Commit*).
2. **Netlify:** *Add new site → Import an existing project → GitHub* → choose `mitime-website`. The build settings are read from `netlify.toml`, so just click **Deploy**. You get a temporary address such as `mitime.netlify.app`.
3. **Turn on editor logins** (in Netlify, for this site):
   - *Project configuration → Identity → Enable Identity*.
   - *Identity → Registration*: set to **Invite only**.
   - *Identity → Services → Git Gateway*: **Enable**.
   - *Identity → Invite users*: invite yourself and the other editors by email.
4. Each editor accepts the invitation email, sets a password, and from then on logs in at **`/admin/`**.
5. **Domain:** in Netlify, *Domain management → Add a domain* → `migrationtime.eu`. Netlify shows the DNS records to set. Change them wherever the domain is registered (currently pointing at Tilda). HTTPS is switched on automatically. Once the new site is live, cancel the Tilda plan. The old addresses (`/phd-positions`, `/recruiting`, …) already redirect to the new pages.

> **Check after the first deploy:** open `/admin/`, log in, change one word on the Contact page and publish. The change should appear on the site within a minute or two. The editor couldn't be clicked through before handover (it loads from the internet on first use), so do this test once.

## 2. Editing the site (for the whole team)

Go to **migrationtime.eu/admin/** and log in.

| To… | Go to |
|---|---|
| Add a DC's name, photo and bio | **Doctoral candidates** → pick the DC → fill in *Name*, *Photo*, *Short bio* |
| Change a supervisor's details or add a photo | **People** |
| Post news, an event or a blog post | **News and events → New News item** |
| Change homepage, About or Contact texts | **Pages** |
| Add social media links, show an announcement bar | **Site settings** |

**Publishing:** new changes start as **Drafts**. Move them to *In review*, then *Ready*, then **Publish**. This lets a DC draft a post and the project office approve it. If you'd rather publish straight away, delete the line `publish_mode: editorial_workflow` in `static/admin/config.yml`.

**Photos:** use square portraits (at least 600 × 600 px) and landscape news images (at least 1200 px wide), under 1 MB if possible. Only publish photos of people who have agreed, and never of research participants.

**Keep:** the EU emblem and funding statement in the footer are required by the grant agreement (Art. 17). Edit the wording in *Site settings* only if REA's wording changes.

## 3. For developers

```bash
npm install        # installs the one dependency (marked)
npm run dev        # builds and serves on http://localhost:8080
npm run cms        # in a second terminal: lets /admin/ edit your local files without logging in
```

- Pages and markup are generated in `build.js` (plain JavaScript template strings; no framework).
- Styles: `static/assets/css/site.css`. Brand: ink `#1E1E1E`, paper `#F7F9F8`, teal `#BFD6D2`, amber `#E5A300`, typeface Overpass (OFL, self-hosted; no Google Fonts calls).
- Editor fields: `static/admin/config.yml` ([Decap CMS docs](https://decapcms.org/docs/)). If you add a field there, also show it in `build.js`.
- No cookies, analytics or third-party requests on the public site. The editor and its login widget only load on `/admin/` and the homepage.
- **If Netlify Identity is ever unavailable:** switch `backend` in `config.yml` to `name: github` with `repo: <owner>/mitime-website`, and enable Netlify's GitHub OAuth provider (*Project configuration → Access & security → OAuth*). Editors then log in with GitHub accounts.
