import crypto from "node:crypto";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function signState(state) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", secret).update(state).digest("base64url");
}

function verifyState(req, state) {
  const saved = parseCookies(req).xq_ga4_oauth_state;
  if (!state || !saved || state !== saved) return false;
  const [timestamp, random, signature] = state.split(".");
  if (!timestamp || !random || !signature) return false;
  if (Date.now() - Number(timestamp) > 10 * 60 * 1000) return false;
  return signature === signState(`${timestamp}.${random}`);
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function html(body) {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GA4 OAuth 授權結果</title>
    <style>
      body { margin: 0; background: #05070b; color: #e8eef4; font-family: Inter, -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
      main { max-width: 860px; margin: 0 auto; padding: 48px 20px; }
      section { border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); padding: 24px; border-radius: 8px; }
      h1 { font-size: 28px; margin: 0 0 16px; }
      p { color: #a9b8c7; line-height: 1.8; }
      pre { white-space: pre-wrap; word-break: break-all; background: #020409; border: 1px solid rgba(123,200,216,.22); padding: 16px; border-radius: 6px; color: #8fddeb; }
      a { color: #8fddeb; }
    </style>
  </head>
  <body>
    <main><section>${body}</section></main>
  </body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const url = new URL(req.url, getOrigin(req));
  const error = url.searchParams.get("error");
  if (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html(`<h1>GA4 OAuth 授權失敗</h1><p>${error}</p>`));
    return;
  }

  const state = url.searchParams.get("state");
  if (!verifyState(req, state)) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html("<h1>GA4 OAuth 授權失敗</h1><p>State 驗證失敗，請回後台重新產生授權連結</p>"));
    return;
  }

  const code = url.searchParams.get("code");
  const redirectUri = process.env.GA4_OAUTH_REDIRECT_URI || `${getOrigin(req)}/api/admin/ga4/oauth-callback`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GA4_OAUTH_CLIENT_ID,
      client_secret: process.env.GA4_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.refresh_token) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      html(`<h1>GA4 OAuth 授權沒有取得 refresh token</h1>
        <p>請確認 Google 授權畫面有使用具備 xqcamille GA4 權限的帳號，並重新產生授權連結。</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>`)
    );
    return;
  }

  res.setHeader("Set-Cookie", "xq_ga4_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(
    html(`<h1>GA4 OAuth 授權成功</h1>
      <p>請把下面這一行加入 Vercel Production Environment Variables，然後 Redeploy。</p>
      <pre>GA4_OAUTH_REFRESH_TOKEN=${data.refresh_token}</pre>
      <p>這是敏感憑證，不要貼到 GitHub，不要傳給其他人。</p>
      <p><a href="/admin/analytics">回到網站數據看板</a></p>`)
  );
}
