import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { Readable } from "node:stream";
import zlib from "node:zlib";

/**
 * SSRF-safe HTTP GET for fetching URLs that USERS typed in.
 *
 * Without this, someone could point the server at its own internal network (localhost, a database,
 * the cloud metadata address) and read what comes back. Protections:
 *  - only http/https on the standard ports, no credentials in the URL
 *  - the IP address is checked AT CONNECT TIME (custom DNS lookup), so DNS tricks can't bypass it
 *  - every redirect is followed manually and checked again
 *  - hard limits on time and size (including after decompression)
 */

export class FetchBlocked extends Error {}

export const BOT_USER_AGENT = "ReplylyBot/1.0 (reads a website its owner asked us to import)";

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local incl. cloud metadata 169.254.169.254
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast and reserved
    );
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === "::" || x === "::1") return true;
    if (/^f[cd]/.test(x)) return true; // unique local
    if (/^fe[89ab]/.test(x)) return true; // link-local
    if (x.startsWith("ff")) return true; // multicast
    const dotted = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (dotted) return isPrivateAddress(dotted[1]);
    const hex = x.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const n = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
      return isPrivateAddress([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
    }
    return false;
  }
  return true; // not an IP at all: refuse
}

function assertAllowedUrl(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new FetchBlocked("Only http and https links are allowed.");
  if (u.username || u.password) throw new FetchBlocked("Links that contain a username or password aren't allowed.");
  const port = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) throw new FetchBlocked("Only standard web addresses (ports 80 and 443) are allowed.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isIp = net.isIP(host) !== 0;
  if (!isIp && (!host.includes(".") || host === "localhost" || /\.(localhost|local|internal|lan|home|corp)$/.test(host))) {
    throw new FetchBlocked("That looks like a private address. Please enter your public website address.");
  }
  // IP literals skip DNS, so they must be checked here
  if (isIp && isPrivateAddress(host)) throw new FetchBlocked("That is a private address and can't be read.");
}

// Runs for every connection (including after redirects): resolves the name and refuses private results.
const safeLookup = ((hostname: string, options: { all?: boolean; family?: number }, cb: unknown) => {
  const done = cb as (err: Error | null, address?: unknown, family?: number) => void;
  dns.lookup(hostname, { all: true, family: options.family ?? 0 }, (err, addrs) => {
    if (err) return done(err);
    const ok = addrs.filter((a) => !isPrivateAddress(a.address));
    if (!ok.length) return done(new FetchBlocked("That address is private and can't be read."));
    if (options.all) return done(null, ok);
    done(null, ok[0].address, ok[0].family);
  });
}) as unknown as net.LookupFunction;

export type SafeResponse = {
  status: number;
  contentType: string;
  body: string;
  finalUrl: string;
  truncated: boolean;
};

type Opts = { timeoutMs?: number; maxBytes?: number; accept?: string };

function decode(buf: Buffer, contentType: string) {
  const label = /charset=([\w-]+)/i.exec(contentType)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

function once(u: URL, o: Opts): Promise<{ status: number; location?: string; contentType: string; body: string; truncated: boolean }> {
  const timeoutMs = o.timeoutMs ?? 8000;
  const maxBytes = o.maxBytes ?? 1_500_000;
  return new Promise((resolve, reject) => {
    const lib = u.protocol === "https:" ? https : http;
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const req = lib.request(
      u,
      {
        method: "GET",
        lookup: safeLookup,
        headers: {
          "User-Agent": BOT_USER_AGENT,
          Accept: o.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = String(res.headers["content-type"] ?? "");
        const location = res.headers.location;
        if (status >= 300 && status < 400) {
          res.resume();
          return finish(() => resolve({ status, location, contentType, body: "", truncated: false }));
        }
        const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
        let stream: Readable = res;
        if (enc === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
        else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());

        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (c: Buffer) => {
          if (settled) return;
          size += c.length;
          if (size > maxBytes) {
            chunks.push(c.subarray(0, c.length - (size - maxBytes)));
            res.destroy();
            stream.destroy();
            return finish(() => resolve({ status, contentType, body: decode(Buffer.concat(chunks), contentType), truncated: true }));
          }
          chunks.push(c);
        });
        stream.on("end", () => finish(() => resolve({ status, contentType, body: decode(Buffer.concat(chunks), contentType), truncated: false })));
        stream.on("error", (e) => finish(() => reject(e)));
      },
    );
    const timer = setTimeout(() => req.destroy(new Error("The website took too long to answer.")), timeoutMs);
    req.on("error", (e) => finish(() => reject(e)));
    req.end();
  });
}

/** GET a URL safely, following up to 4 redirects (each one re-checked). Throws FetchBlocked for forbidden targets. */
export async function safeGet(url: string, opts: Opts = {}): Promise<SafeResponse> {
  let current = new URL(url);
  for (let hop = 0; hop <= 4; hop++) {
    assertAllowedUrl(current);
    const r = await once(current, opts);
    if (r.status >= 300 && r.status < 400 && r.location) {
      current = new URL(r.location, current);
      continue;
    }
    return { status: r.status, contentType: r.contentType, body: r.body, finalUrl: current.toString(), truncated: r.truncated };
  }
  throw new FetchBlocked("That website redirects too many times.");
}
