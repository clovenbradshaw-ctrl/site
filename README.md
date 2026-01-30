# Cards Site - Sveltia CMS + GitHub Pages

Minimal site with Sveltia CMS admin panel. No OAuth server needed - Sveltia handles GitHub authentication directly.

## Setup (3 steps)

### 1. Enable GitHub Pages

1. Go to repo **Settings → Pages**
2. Under "Build and deployment", set **Source** to **GitHub Actions**
3. Push to `main` to trigger the first deploy

### 2. Done!

That's it. No OAuth apps, no external services, no secrets to configure.

- **Site**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- **Admin**: `https://YOUR_USERNAME.github.io/YOUR_REPO/admin/`

## How It Works

1. Visit `/admin` and click "Sign in with GitHub"
2. Sveltia CMS authenticates directly with GitHub (no proxy needed)
3. Edit your content in the CMS
4. Changes are committed directly to your repo
5. GitHub Actions rebuilds and deploys automatically

## Why Sveltia CMS?

[Sveltia CMS](https://github.com/sveltia/sveltia-cms) is a drop-in replacement for Decap/Netlify CMS with:
- Built-in GitHub authentication (no OAuth server required)
- Faster performance
- Better UX
- Active development

## Local Development

```bash
# Install Jekyll
gem install bundler jekyll

# Run locally
bundle exec jekyll serve
```

For local CMS testing, add `local_backend: true` to `admin/config.yml` and run:
```bash
npx @sveltia/cms-proxy
```

## File Structure

```
├── .github/workflows/
│   └── deploy.yml       # GitHub Actions workflow
├── _config.yml          # Jekyll config
├── _data/
│   └── cards.yml        # Card data (edited by CMS)
├── admin/
│   ├── index.html       # CMS interface (loads Sveltia)
│   └── config.yml       # CMS configuration
├── index.html           # Main page template
└── README.md
```
