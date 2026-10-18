import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Env } from "./config.ts";
import { createServer, takedown, VERSION } from "./server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
};

function withCors(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}

function json(data: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json" } }));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === "/mcp") {
      // Stateless: a fresh server + transport per request, nothing kept between calls
      const server = createServer(env);
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await server.connect(transport);
      return withCors(await transport.handleRequest(req));
    }

    if (url.pathname === "/admin/takedown" && req.method === "POST") {
      if (!env.ADMIN_TOKEN || req.headers.get("Authorization") !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: "unauthorized" }, 401);
      const { cid, reason } = (await req.json().catch(() => ({}))) as { cid?: string; reason?: string };
      if (!cid || !/^[a-z0-9]{20,}$/i.test(cid)) return json({ error: "cid required" }, 400);
      return json(await takedown(env, cid, reason ?? "takedown"));
    }

    // The robot mark, so clients that show a connector icon from the server's domain find one.
    // /favicon.ico is a real multi-size ICO: some favicon fetchers ignore a PNG served under .ico.
    if (["/favicon.ico", "/favicon.png", "/icon.png", "/apple-touch-icon.png"].includes(url.pathname)) {
      const ico = url.pathname === "/favicon.ico";
      const icon = await fetch(ico ? "https://botnames.dev/favicon.ico" : "https://botnames.dev/app-icon.png", { cf: { cacheTtl: 86400, cacheEverything: true } });
      return new Response(icon.body, {
        status: icon.status,
        headers: { "Content-Type": ico ? "image/x-icon" : "image/png", "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*" },
      });
    }

    if ((url.pathname === "/" || url.pathname === "") && (req.headers.get("accept") ?? "").includes("text/html")) {
      return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Bot Names MCP</title>
<link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui;background:#0b0c0a;color:#f2f4ec;padding:40px;line-height:1.6">
<h1 style="color:#c8f53c">Bot Names MCP</h1><p>MCP endpoint: <code>https://${url.host}/mcp</code> (Streamable HTTP, no auth)</p>
<p><a style="color:#c8f53c" href="${env.PUBLIC_URL}">${env.PUBLIC_URL}</a></p></body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (url.pathname === "/" || url.pathname === "") {
      return json({
        name: "Bot Names MCP",
        version: VERSION,
        mcp: `https://${url.host}/mcp`,
        transport: "streamable-http",
        about: "Names for AI agents (<name>.ai-bot.eth): one name as the bot's wallet address on Bitcoin, Solana, Ethereum and every EVM chain, plus its own website on IPFS.",
        tools: ["check_name", "register_name", "set_records", "set_primary_name", "deploy_site", "send_transaction", "resolve", "list_names"],
        site: env.PUBLIC_URL,
      });
    }
    return json({ error: "not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
