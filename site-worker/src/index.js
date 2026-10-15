// botnames.dev: serves the static site. Other hosts bound here (www.botnames.dev) 301 to the
// canonical host, path kept. The MCP server is a separate worker on mcp.botnames.dev.
const CANONICAL = "botnames.dev";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.hostname !== CANONICAL && !url.hostname.endsWith(".workers.dev")) {
      url.hostname = CANONICAL;
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(req);
  },
};
