// 道具箱ゲート：LINE限定13本を合言葉で保護する
const BOX = "/apps/box-9f4a7c2e";
const PUBLIC = ["/apps", "/apps/index", "/apps/kanji-25min-checklist", "/apps/prompt-builder", "/apps/survey-builder"];
const LINE = "https://line.me/R/ti/p/@188jocyd";

async function token(key) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function gate(wrong) {
  return new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>AI社員がつくった道具箱｜LINE限定</title>
<style>
:root{--bg:#0d0d0d;--fg:#ede9e4;--sub:#9a948d;--accent:#D97757;--line:#06C755}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:var(--bg);color:var(--fg);font-family:"Noto Sans JP",-apple-system,sans-serif;line-height:1.8}
.card{width:100%;max-width:420px;text-align:center}
.tag{display:inline-block;padding:6px 16px;border:1px solid var(--accent);border-radius:99px;
color:var(--accent);font-size:12px;letter-spacing:.1em;margin-bottom:24px}
h1{font-size:22px;margin:0 0 12px}
p{color:var(--sub);font-size:14px;margin:0 0 28px}
.btn{display:block;padding:15px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px}
.line{background:var(--line);color:#fff;margin-bottom:24px}
form{display:flex;gap:8px}
input{flex:1;padding:13px;border:1px solid #3a3733;border-radius:10px;background:#161514;color:var(--fg);font-size:16px}
input::placeholder{color:#6b6560}
button{padding:13px 20px;border:0;border-radius:10px;background:var(--accent);color:#fff;font-weight:700;font-size:15px;cursor:pointer}
.err{color:#e5787a;font-size:13px;margin:14px 0 0}
.foot{margin-top:32px;font-size:12px;color:#6b6560}
.foot a{color:#6b6560}
</style></head><body><div class="card">
<span class="tag">LINE 限定</span>
<h1>AI社員がつくった道具箱</h1>
<p>13本のツールは、公式LINEにご登録いただいた方だけにお渡ししています。<br>合言葉をお持ちの方はご入力ください。</p>
<a class="btn line" href="${LINE}">公式LINEで合言葉を受け取る</a>
<form method="post"><input name="k" placeholder="合言葉" autocomplete="off" autofocus><button>入る</button></form>
${wrong ? '<p class="err">合言葉がちがうようです。公式LINEでご確認ください。</p>' : ""}
<p class="foot"><a href="/apps/">見本のツールを見る</a>　|　<a href="/">Hitotsu Company</a></p>
</div></body></html>`,
    { status: wrong ? 401 : 200, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" } }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = (url.pathname.replace(/\.html$/, "").replace(/\/+$/, "")) || "/";

    // 保護対象外はそのまま配信
    if (!path.startsWith("/apps") || PUBLIC.includes(path)) return env.ASSETS.fetch(request);

    const t = await token(env.BOX_KEY);

    // 入場済み
    if ((request.headers.get("Cookie") || "").includes(`box=${t}`)) {
      return path.startsWith(BOX) ? env.ASSETS.fetch(request) : Response.redirect(url.origin + BOX + "/", 302);
    }

    // 合言葉つきURL、または入力フォーム
    let given = url.searchParams.get("k");
    if (request.method === "POST") given = (await request.formData()).get("k");
    if (given != null && String(given).trim() === env.BOX_KEY) {
      url.searchParams.delete("k");
      return new Response(null, {
        status: 302,
        headers: {
          Location: path.startsWith(BOX) ? url.toString() : url.origin + BOX + "/",
          "Set-Cookie": `box=${t}; Path=/apps/; Max-Age=7776000; Secure; HttpOnly; SameSite=Lax`,
        },
      });
    }
    return gate(given != null && String(given).trim() !== "");
  },
};
