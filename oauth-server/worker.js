/**
 * Decap CMS OAuth Server for Cloudflare Workers
 *
 * Deploy this to Cloudflare Workers and set these secrets:
 *   - GITHUB_CLIENT_ID: Your GitHub OAuth App client ID
 *   - GITHUB_CLIENT_SECRET: Your GitHub OAuth App client secret
 *
 * Set this variable:
 *   - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "https://yourusername.github.io")
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': validateOrigin(origin, env.ALLOWED_ORIGINS) ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/auth') {
        return handleAuth(env);
      } else if (url.pathname === '/callback') {
        return handleCallback(url, env);
      } else {
        return new Response('Decap CMS OAuth Server', {
          status: 200,
          headers: corsHeaders
        });
      }
    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

function validateOrigin(origin, allowedOrigins) {
  if (!allowedOrigins) return false;
  const allowed = allowedOrigins.split(',').map(o => o.trim());
  return allowed.includes(origin) || allowed.includes('*');
}

function handleAuth(env) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: 'repo,user',
  });

  return Response.redirect(`${GITHUB_AUTHORIZE_URL}?${params}`, 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return new Response(renderError(data.error_description || data.error), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  // Return HTML that posts the token back to Decap CMS
  return new Response(renderSuccess(data.access_token, data.token_type || 'bearer'), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderSuccess(token, provider) {
  return `<!DOCTYPE html>
<html>
<head><title>OAuth Success</title></head>
<body>
<script>
(function() {
  const token = "${token}";
  const provider = "${provider}";

  // Try postMessage first (for popup flow)
  if (window.opener) {
    window.opener.postMessage(
      'authorization:github:success:{"token":"' + token + '","provider":"' + provider + '"}',
      '*'
    );
    window.close();
  } else {
    // Fallback: redirect with token in hash
    document.body.innerHTML = '<p>Authorization successful. You can close this window.</p>';
  }
})();
</script>
<p>Authorizing...</p>
</body>
</html>`;
}

function renderError(message) {
  return `<!DOCTYPE html>
<html>
<head><title>OAuth Error</title></head>
<body>
<script>
if (window.opener) {
  window.opener.postMessage(
    'authorization:github:error:${message}',
    '*'
  );
  window.close();
}
</script>
<p>Error: ${message}</p>
</body>
</html>`;
}
