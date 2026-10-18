/*
 * The in-chat card: an MCP Apps view (ui:// resource) the host renders in an
 * iframe under a write tool's result.
 *
 * A preview, not a wallet. The sandboxed iframe can't reach PayBox (only the
 * model can call PayBox's tools), so "Complete with PayBox" posts `ui/message`
 * back into the chat and the model runs the steps, with PayBox asking the user
 * to approve each signature.
 *
 * Hand-rolled bridge (spec 2026-01-26): @modelcontextprotocol/ext-apps needs
 * the v2 SDK and zod 4, and this Worker pins the v1 SDK. Same card as the
 * yournames.io connector, in the Bot Names look.
 *
 * Every value is written with textContent. The card shows fields this server
 * computed, never a name's text records.
 */

export const CARD_URI = "ui://botnames/action-card.html";
export const CARD_MIME = "text/html;profile=mcp-app";
export const CARD_CSP = { resourceDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"] };

export type Card = {
  action: "register" | "records" | "primary" | "site_payment" | "site";
  name: string;
  wallet: string | null;
  /** [label, value] rows, the last one emphasised. */
  rows: [string, string][];
  steps: string[];
  warnings: string[];
  url: string;
};

export const CARD_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0b0c0a;--surface:#121410;--border:#23261f;--text:#eef0e8;--text2:#a7ab9f;--muted:#8b9083;--lime:#c8f53c;--warn:#ff8a78}
*{box-sizing:border-box}html,body{margin:0;background:transparent}
body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:var(--text);padding:4px}
.card{background:var(--bg);border:1px solid var(--lime);overflow:hidden}
.head{padding:16px 20px 20px;border-bottom:1px solid var(--border);background:var(--surface)}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;font:500 10.5px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.brand{display:flex;align-items:center;gap:8px;color:var(--text)}
.bot{width:18px;height:18px;display:inline-block}
.action{background:var(--lime);color:var(--bg);padding:5px 9px;font-weight:700}
.name{margin-top:18px;font:700 clamp(24px,7.5vw,38px)/1.08 "Chakra Petch",sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere}
.name .tld{color:var(--muted)}
.body{padding:18px 20px 20px}
dl{margin:0;border:1px solid var(--border);padding:12px 14px;font:500 12.5px/1.45 "JetBrains Mono",ui-monospace,monospace}
dl div{display:flex;justify-content:space-between;gap:14px;padding:3px 0}
dt{color:var(--muted);flex:none}dd{margin:0;text-align:right;overflow-wrap:anywhere}
dl div:last-child{border-top:1px solid var(--border);margin-top:6px;padding-top:9px;font-weight:700;color:var(--lime)}
dl div:only-child{border-top:0;margin-top:0;padding-top:3px}
h3{margin:18px 0 8px;font:500 10.5px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
ol{margin:0;padding:0;list-style:none;counter-reset:s}
ol li{counter-increment:s;display:flex;gap:10px;padding:6px 0;font-size:13.5px;line-height:1.45;color:var(--text2)}
ol li:before{content:counter(s,decimal-leading-zero);flex:none;font:700 11px/1.7 "JetBrains Mono",monospace;color:var(--lime)}
.warn{margin-top:14px;border:1px solid #5a2a22;background:#1d0f0c;color:var(--warn);padding:10px 13px;font-size:13px;line-height:1.5}
.warn p{margin:0}.warn p+p{margin-top:6px}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
button{cursor:pointer;border:0;height:44px;padding:0 18px;font:700 13px/1 "Chakra Petch",sans-serif;letter-spacing:.06em;text-transform:uppercase}
.go{flex:1 1 220px;background:var(--lime);color:var(--bg)}
.go:hover{background:#e3ff8a}.go:disabled{opacity:.5;cursor:default}
.view{flex:0 1 auto;background:transparent;color:var(--text);border:1px solid var(--border)}
.foot{margin:14px 0 0;font-size:11.5px;line-height:1.5;color:var(--muted)}
.wallet{font-family:"JetBrains Mono",monospace;color:var(--text2);overflow-wrap:anywhere}
.empty{padding:28px 20px;font-size:14px;color:var(--muted)}
</style></head>
<body><div class="card" id="card"><div class="empty">Preparing…</div></div>
<script>
(function(){
  var seq = 0, pending = {}, data = null, sent = false;
  var VERB = { register: "Register", records: "Set records", primary: "Primary name", site_payment: "Pay for site", site: "Publish site" };
  function post(m){ try { window.parent.postMessage(m, "*"); } catch (e) {} }
  function rpc(method, params){ var id = ++seq; post({ jsonrpc: "2.0", id: id, method: method, params: params });
    return new Promise(function(res){ pending[id] = res; setTimeout(function(){ if (pending[id]) { delete pending[id]; res(null); } }, 8000); }); }
  function notify(method, params){ post({ jsonrpc: "2.0", method: method, params: params }); }
  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; }

  function botIcon(){
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "bot");
    var p = document.createElementNS(ns, "path"); p.setAttribute("fill", "#c8f53c");
    p.setAttribute("d", "M11 2h2v4h-2zM6 7h13v9l-3 3H4V9zm3 4v3h3v-3zm5 0v3h3v-3z"); p.setAttribute("fill-rule", "evenodd");
    s.appendChild(p); return s;
  }

  function render(c){
    if (!c || !c.action || !c.name) return;
    data = c;
    var card = document.getElementById("card"); card.textContent = "";
    var head = el("div", "head"), top = el("div", "top"), brand = el("span", "brand");
    brand.appendChild(botIcon()); brand.appendChild(el("span", "", "Bot Names"));
    top.appendChild(brand); top.appendChild(el("span", "action", VERB[c.action] || c.action)); head.appendChild(top);
    var nm = el("div", "name"), dot = String(c.name).indexOf(".");
    nm.appendChild(document.createTextNode(dot > 0 ? c.name.slice(0, dot) : c.name));
    if (dot > 0) nm.appendChild(el("span", "tld", c.name.slice(dot)));
    head.appendChild(nm); card.appendChild(head);

    var body = el("div", "body");
    if (c.rows && c.rows.length) {
      var dl = el("dl");
      c.rows.forEach(function(r){ var d = el("div"); d.appendChild(el("dt", "", r[0])); d.appendChild(el("dd", "", r[1])); dl.appendChild(d); });
      body.appendChild(dl);
    }
    if (c.steps && c.steps.length) {
      body.appendChild(el("h3", "", "What PayBox will ask you to approve"));
      var ol = el("ol"); c.steps.forEach(function(s){ ol.appendChild(el("li", "", s)); }); body.appendChild(ol);
    }
    if (c.warnings && c.warnings.length) {
      var w = el("div", "warn"); c.warnings.forEach(function(t){ w.appendChild(el("p", "", t)); }); body.appendChild(w);
    }
    var btns = el("div", "btns"), go = el("button", "go", sent ? "Sent to chat. Approve in PayBox" : "Complete with PayBox");
    go.disabled = sent; go.onclick = complete;
    var view = el("button", "view", "View");
    view.onclick = function(){ open(c.url); };
    btns.appendChild(go); btns.appendChild(view); body.appendChild(btns);
    var foot = el("p", "foot", "Only your wallet signs, and you approve every step. Bot Names never holds keys or funds." + (c.wallet ? " Wallet " : ""));
    if (c.wallet) foot.appendChild(el("span", "wallet", c.wallet));
    body.appendChild(foot); card.appendChild(body);
    size();
  }

  function complete(){
    if (!data || sent) return;
    var text = "Complete this Bot Names step (" + (VERB[data.action] || data.action).toLowerCase() + " for " + data.name +
      ") with my PayBox wallet: sign each prepared transaction as given, broadcast it with send_transaction, and show me each one before it is signed.";
    sent = true; render(data);
    if (window.openai && window.openai.sendFollowUpMessage) { window.openai.sendFollowUpMessage({ prompt: text }); return; }
    rpc("ui/message", { role: "user", content: [{ type: "text", text: text }] }).then(function(r){ if (r && r.isError) { sent = false; render(data); } });
  }
  function open(url){
    if (!url) return;
    if (window.openai && window.openai.openExternal) { window.openai.openExternal({ href: url }); return; }
    rpc("ui/open-link", { url: url }).then(function(r){ if (!r || r.isError) { try { window.open(url, "_blank", "noopener"); } catch (e) {} } });
  }
  function size(){ notify("ui/notifications/size-changed", { height: Math.ceil(document.documentElement.getBoundingClientRect().height) }); }

  window.addEventListener("message", function(e){
    if (e.source !== window.parent) return;
    var m = e.data; if (!m || m.jsonrpc !== "2.0") return;
    if (m.id != null && !m.method && pending[m.id]) { var f = pending[m.id]; delete pending[m.id]; f(m.result || (m.error ? { isError: true } : null)); return; }
    if (m.method === "ui/notifications/tool-result" && m.params) render((m.params.structuredContent || {}).card);
    if (m.method === "ui/resource-teardown" && m.id != null) post({ jsonrpc: "2.0", id: m.id, result: {} });
  });
  function fromOpenAI(){ var o = window.openai && window.openai.toolOutput; if (o && o.card) render(o.card); }
  window.addEventListener("openai:set_globals", fromOpenAI); fromOpenAI();
  rpc("ui/initialize", { protocolVersion: "2026-01-26", appInfo: { name: "botnames", version: "0.2.0" }, appCapabilities: {} })
    .then(function(){ notify("ui/notifications/initialized", {}); });
  if (window.ResizeObserver) new ResizeObserver(size).observe(document.body);
})();
</script></body></html>`;
