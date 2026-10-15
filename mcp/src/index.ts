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

    if (url.pathname === "/" || url.pathname === "") {
      return json({
        name: "Bot Names MCP",
        version: VERSION,
        mcp: `https://${url.host}/mcp`,
        transport: "streamable-http",
        about: "Names for AI agents (<name>.ai-bot.eth): one name as the bot's wallet address on Bitcoin, Solana, Ethereum and every EVM chain, plus its own website on IPFS.",
        tools: ["check_name", "register_name", "set_records", "set_primary_name", "resolve", "list_names", "deploy_site"],
        site: env.PUBLIC_URL,
      });
    }
    return json({ error: "not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
