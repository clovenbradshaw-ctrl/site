# Cards Site - Decap CMS + GitHub Pages (Secure Setup)

Minimal site with Decap CMS admin panel, configured for secure OAuth using GitHub secrets.

## Secure Setup Guide

This setup keeps your OAuth credentials secure by:
- Storing secrets in Cloudflare Workers (never in code)
- Using GitHub repository variables for non-sensitive config
- Injecting configuration at build time via GitHub Actions

### Step 1: Create a GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in:
   - **Application name**: `Decap CMS` (or anything)
   - **Homepage URL**: `https://YOUR_USERNAME.github.io/YOUR_REPO`
   - **Authorization callback URL**: `https://YOUR_WORKER_NAME.YOUR_SUBDOMAIN.workers.dev/callback`
     (You'll create this in Step 2)
3. Click "Register application"
4. Copy the **Client ID**
5. Generate and copy the **Client Secret** (save it securely - you can't see it again!)

### Step 2: Deploy the OAuth Server to Cloudflare Workers

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Navigate to the oauth-server directory and deploy:
   ```bash
   cd oauth-server

   # Edit wrangler.toml - set ALLOWED_ORIGINS to your GitHub Pages URL
   # Example: ALLOWED_ORIGINS = "https://myuser.github.io"

   # Deploy the worker
   wrangler deploy
   ```

3. Add your secrets to Cloudflare (never stored in code):
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   # Paste your Client ID when prompted

   wrangler secret put GITHUB_CLIENT_SECRET
   # Paste your Client Secret when prompted
   ```

4. Note your worker URL: `https://decap-cms-oauth.YOUR_SUBDOMAIN.workers.dev`

### Step 3: Configure GitHub Repository Variables

1. Go to your repo → Settings → Secrets and variables → Actions → Variables tab
2. Add a new repository variable:
   - **Name**: `DECAP_OAUTH_URL`
   - **Value**: Your Cloudflare Worker URL (e.g., `https://decap-cms-oauth.myaccount.workers.dev`)

### Step 4: Enable GitHub Pages

1. Go to repo Settings → Pages
2. Under "Build and deployment":
   - **Source**: GitHub Actions (the workflow is already configured)
3. The site will deploy automatically on push to `main`

### Step 5: Update GitHub OAuth App Callback URL

Go back to your GitHub OAuth App settings and update the callback URL to:
```
https://YOUR_WORKER_NAME.YOUR_SUBDOMAIN.workers.dev/callback
```

### Done!

- **Site**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- **Admin**: `https://YOUR_USERNAME.github.io/YOUR_REPO/admin/`

## How It Works

1. User visits `/admin` and clicks "Login with GitHub"
2. Browser redirects to your Cloudflare Worker `/auth` endpoint
3. Worker redirects to GitHub OAuth with your Client ID
4. User authorizes, GitHub redirects to Worker `/callback` with code
5. Worker exchanges code for token using Client Secret (secret stays on server)
6. Token is passed back to browser, Decap CMS can now access repo

**Security**: Your Client Secret never leaves Cloudflare Workers. It's not in your code, not in your repo, not visible in browser dev tools.

## Alternative: Quick Setup (Less Secure)

If you just want to test and don't need production security:

1. Edit `admin/config.yml` directly:
   ```yaml
   backend:
     name: github
     repo: YOUR_USERNAME/YOUR_REPO
     branch: main
     base_url: https://decap-oauth.netlify.app
   ```
2. Enable GitHub Pages (Settings → Pages → Deploy from branch → main)

This uses a public OAuth proxy. Fine for testing, but the proxy operator could theoretically see tokens.

## Local Development

```bash
# Install Jekyll
gem install bundler jekyll

# Run locally
bundle exec jekyll serve

# For CMS local testing, in another terminal:
npx decap-server
```

Add `local_backend: true` to `admin/config.yml` for local CMS testing.

## File Structure

```
├── .github/workflows/
│   └── deploy.yml       # GitHub Actions workflow (injects config)
├── _config.yml          # Jekyll config
├── _data/
│   └── cards.yml        # Card data (edited by CMS)
├── admin/
│   ├── index.html       # CMS interface
│   └── config.yml       # CMS configuration (placeholders)
├── oauth-server/        # Cloudflare Worker OAuth server
│   ├── worker.js        # OAuth proxy code
│   └── wrangler.toml    # Cloudflare config
├── index.html           # Main page template
└── README.md
```
