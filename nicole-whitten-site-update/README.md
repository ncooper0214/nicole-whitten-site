# nicolewhitten portfolio

Built with a tiny, dependency-free Node script (`build.js`). Content lives in `content/`, page designs in `templates/`, images and files in `public/`.

- **Edit content:** use Pages CMS (app.pagescms.org). It reads `.pages.yml`.
- **Cloudflare Pages settings:** Build command `node build.js` · Build output directory `_site`.
- **Preview locally (optional):** `node build.js`, then open `_site/index.html`.

What's editable in the CMS: blog posts, writing samples, and contact details (email, LinkedIn, resume). Other page copy lives in `templates/*.html`.

## Editing page copy
Every page has its own "Page · …" entry in Pages CMS. Each section of the page is a box, and each box lists the words in the order they appear on the page.
- Wrap words in *single asterisks* for the accent style (peach or lilac italic, matching the design).
- Wrap words in **double asterisks** for bold.
- In longer boxes, press Enter for a line break.
The layout and design live in templates/ and stay locked.
