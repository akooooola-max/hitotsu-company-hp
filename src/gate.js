// 統制室ゲート：/control 配下は合言葉がないと開けない。
// 承認待ちの下書き（control/drafts/**）も同じゲートの内側に置くので、
// 公開前の原稿・レポートが外から読まれることはない。
//
// 合言葉の設定：  npx wrangler secret put CONTROL_KEY
// 設定していないあいだは、誰も入れない（閉じる側に倒す）。

const LINE = "https://line.me/R/ti/p/@188jocyd";

async function token(key) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function page({ wrong = false, locked = false } = {}) {
  return new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>法人統制室</title>
<style>
:root{--bg:#0e0e0e;--fg:#ededed;--sub:#9a9a9a;--line:#262626;--accent:#D97757}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:var(--bg);color:var(--fg);font-family:"Noto Sans JP",-apple-system,sans-serif;line-height:1.8}
.card{width:100%;max-width:400px;text-align:center}
.tag{display:inline-block;padding:6px 16px;border:1px solid var(--accent);border-radius:99px;
color:var(--accent);font-size:11px;letter-spacing:.2em;margin-bottom:22px;
font-family:ui-monospace,Menlo,monospace}
h1{font-size:21px;margin:0 0 10px;font-family:ui-monospace,Menlo,monospace}
p{color:var(--sub);font-size:13.5px;margin:0 0 26px}
form{display:flex;gap:8px}
input{flex:1;padding:13px;border:1px solid #3a3733;border-radius:10px;background:#161616;
color:var(--fg);font-size:16px}
input::placeholder{color:#6b6560}
button{padding:13px 22px;border:0;border-radius:10px;background:var(--accent);color:#1a0d08;
font-weight:700;font-size:15px;cursor:pointer}
.err{color:#e5787a;font-size:13px;margin:14px 0 0}
.foot{margin-top:30px;font-size:12px;color:#5a5a5a}
.foot a{color:#5a5a5a}
</style></head><body><div class="card">
<span class="tag">CONTROL ROOM</span>
<h1>法人統制室</h1>
${
  locked
    ? `<p>合言葉がまだ設定されていません。<br>ターミナルで <code>npx wrangler secret put CONTROL_KEY</code> を実行してください。</p>`
    : `<p>関係者以外は入れません。<br>合言葉をご入力ください。</p>
<form method="post"><input name="k" type="password" placeholder="合言葉" autocomplete="current-password" autofocus><button>入る</button></form>
${wrong ? '<p class="err">合言葉がちがいます。</p>' : ""}`
}
<p class="foot"><a href="${LINE}">担当に連絡する</a>　|　<a href="/">Hitotsu Company</a></p>
</div></body></html>`,
    {
      status: locked ? 503 : wrong ? 401 : 200,
      headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" },
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // 保護対象外はそのまま配信（念のための二重チェック）
    if (path !== "/control" && !path.startsWith("/control/")) {
      return env.ASSETS.fetch(request);
    }

    const key = env.CONTROL_KEY;
    if (!key) return page({ locked: true });

    const t = await token(key);
    if ((request.headers.get("Cookie") || "").includes(`control=${t}`)) {
      const res = await env.ASSETS.fetch(request);
      const headers = new Headers(res.headers);
      // 承認待ちの中身をキャッシュや検索に残さない
      headers.set("cache-control", "no-store");
      headers.set("x-robots-tag", "noindex, nofollow");
      // 統制室の中から外へは持ち出させない。
      // 承認待ちの中身（下書き・顧問先レポート）を読めるのはこのページだけなので、
      // 万一おかしなものが画面に混じっても、よそへ送る先を塞いでおく。
      headers.set(
        "content-security-policy",
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src https://fonts.gstatic.com; " +
          "img-src 'self' data:; " +
          "connect-src 'self'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none'; " +
          "base-uri 'none'"
      );
      headers.set("referrer-policy", "no-referrer");
      return new Response(res.body, { status: res.status, headers });
    }

    let given = url.searchParams.get("k");
    if (request.method === "POST") {
      const form = await request.formData();
      given = form.get("k");
    }

    if (given != null && String(given) === key) {
      url.searchParams.delete("k");
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.toString(),
          "Set-Cookie": `control=${t}; Path=/control/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`,
        },
      });
    }

    return page({ wrong: given != null && String(given) !== "" });
  },
};
