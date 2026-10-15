import { MAX_SITE_BYTES, MAX_SITE_FILES, type Env } from "./config.ts";

/** Static website files an agent sends to deploy_site. */
export interface SiteFile {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
}

const ALLOWED_EXT = new Set([
  "html", "htm", "css", "js", "mjs", "json", "txt", "md", "xml", "svg", "webmanifest", "map",
  "png", "jpg", "jpeg", "gif", "webp", "avif", "ico", "woff", "woff2", "ttf", "otf", "mp3", "mp4", "webm", "pdf",
]);

const TYPES: Record<string, string> = {
  html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript", mjs: "text/javascript",
  json: "application/json", txt: "text/plain", md: "text/markdown", xml: "application/xml", svg: "image/svg+xml",
  webmanifest: "application/manifest+json", map: "application/json", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", mp3: "audio/mpeg", mp4: "video/mp4",
  webm: "video/webm", pdf: "application/pdf",
};

export class SiteError extends Error {}

export interface PreparedSite {
  files: { path: string; bytes: Uint8Array; type: string }[];
  totalBytes: number;
}

function decodeBase64(s: string): Uint8Array {
  const bin = atob(s.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Pages that ask for wallet secrets are refused: a static IPFS page has no business collecting a
 * password, seed phrase or private key, and those are what a phishing kit is built around.
 */
function phishingReason(html: string): string | null {
  if (/<input[^>]+type\s*=\s*["']?password/i.test(html)) return "it contains a password field";
  const asksForInput = /<(input|textarea|form)\b/i.test(html);
  if (asksForInput && /(seed|recovery|secret|mnemonic)\s*(phrase|words)|private\s*key|mnemonic/i.test(html)) {
    return "it asks for a seed phrase or private key";
  }
  return null;
}

export function prepareSite(files: SiteFile[]): PreparedSite {
  if (files.length === 0) throw new SiteError("No files. Send at least index.html.");
  if (files.length > MAX_SITE_FILES) throw new SiteError(`${files.length} files; the limit is ${MAX_SITE_FILES}.`);

  const seen = new Set<string>();
  const out: PreparedSite["files"] = [];
  let total = 0;
  for (const f of files) {
    const path = f.path.trim().replace(/^\.?\/+/, "");
    if (!/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(path) || path.split("/").some((p) => p === ".." || p === ".")) {
      throw new SiteError(`Bad path "${f.path}". Use relative paths like "index.html" or "assets/logo.png".`);
    }
    if (path.length > 200) throw new SiteError(`Path too long: ${path.slice(0, 40)}…`);
    const ext = path.includes(".") ? path.split(".").pop()!.toLowerCase() : "";
    if (!ALLOWED_EXT.has(ext)) throw new SiteError(`"${path}": .${ext || "(none)"} files are not accepted. Static web files only.`);
    if (seen.has(path)) throw new SiteError(`"${path}" appears twice.`);
    seen.add(path);

    let bytes: Uint8Array;
    try {
      bytes = f.encoding === "base64" ? decodeBase64(f.content) : new TextEncoder().encode(f.content);
    } catch {
      throw new SiteError(`"${path}": content is not valid base64.`);
    }
    total += bytes.length;
    if (total > MAX_SITE_BYTES) throw new SiteError(`Site is larger than ${MAX_SITE_BYTES / 1024 / 1024} MB.`);

    if (ext === "html" || ext === "htm") {
      const reason = phishingReason(new TextDecoder().decode(bytes));
      if (reason) throw new SiteError(`"${path}" was refused because ${reason}. Bot Names does not host pages that collect wallet secrets.`);
    }
    out.push({ path, bytes, type: TYPES[ext] ?? "application/octet-stream" });
  }
  if (!seen.has("index.html")) throw new SiteError("The site needs an index.html at its root.");
  return { files: out, totalBytes: total };
}

/** Pin the site as one directory; returns its CIDv1. The folder name keeps index.html at the CID root. */
export async function pinSite(env: Env, name: string, site: PreparedSite): Promise<string> {
  if (!env.PINATA_JWT) throw new Error("Site hosting is not configured on this server.");
  const form = new FormData();
  for (const f of site.files) {
    form.append("file", new Blob([f.bytes as BlobPart], { type: f.type }), `${name}/${f.path}`);
  }
  // The name ends in ".eth", which Pinata accepts as an extension (it 400s an image named without one)
  form.append("pinataMetadata", JSON.stringify({ name, keyvalues: { project: "botnames", name } }));
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
    body: form,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`IPFS pinning failed (${res.status}): ${body.slice(0, 200)}`);
  const cid = (JSON.parse(body) as { IpfsHash?: string }).IpfsHash;
  if (!cid) throw new Error("IPFS pinning returned no CID");
  return cid;
}

export interface SiteVersion {
  cid: string;
  at: string;
  bytes: number;
  files: number;
  payment: string;
}

/**
 * Deploy history per name. Old pins are kept: unpinning is by CID across the whole Pinata
 * account, so it could remove an identical pin another project owns. Storage per site is tiny.
 */
export async function recordVersion(env: Env, name: string, v: SiteVersion): Promise<SiteVersion[]> {
  const key = `site:${name}`;
  const history = ((await env.SITES.get<SiteVersion[]>(key, "json")) ?? []).filter((h) => h.cid !== v.cid);
  const next = [v, ...history].slice(0, 20);
  await env.SITES.put(key, JSON.stringify(next));
  return next;
}

export async function takedown(env: Env, cid: string, reason: string): Promise<{ unpinned: boolean; detail: string }> {
  await env.SITES.put(`takedown:${cid}`, JSON.stringify({ reason, at: new Date().toISOString() }));
  if (!env.PINATA_JWT) return { unpinned: false, detail: "no Pinata key configured" };
  const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
  });
  return { unpinned: res.ok, detail: `${res.status} ${(await res.text()).slice(0, 120)}` };
}

export async function isTakenDown(env: Env, cid: string): Promise<boolean> {
  return (await env.SITES.get(`takedown:${cid}`)) !== null;
}
