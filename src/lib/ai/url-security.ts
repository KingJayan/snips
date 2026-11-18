import { lookup as lookupCallback } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import { Agent } from "undici";

type ValidationResult = {
  ok: true;
  normalized: string;
} | {
  ok: false;
  error: string;
};

function isPrivateIpv4(address: string) {
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

export function isPrivateAddress(address: string) {
  const host = address.toLowerCase().replace(/^\[|\]$/g, "");
  const version = isIP(host);
  if (version === 4) return isPrivateIpv4(host);
  if (version !== 6) return true;
  const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return (
    host === "::" ||
    host === "::1" ||
    host.startsWith("::ffff:") ||
    /^f[cd]/.test(host) ||
    /^fe[89ab]/.test(host) ||
    host.startsWith("ff")
  );
}

export async function validateAiBaseUrl(rawBaseUrl: string): Promise<ValidationResult> {
  const trimmed = rawBaseUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "base url is required" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "invalid base url" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "base url must not include credentials" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "base url must use https" };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [host]
    : await lookup(host, { all: true }).then((entries) => entries.map((entry) => entry.address)).catch(() => []);

  if (!addresses.length || addresses.some(isPrivateAddress)) {
    return { ok: false, error: "base url must resolve to a public host" };
  }

  const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
  return { ok: true, normalized: `${parsed.protocol}//${parsed.host}${pathname}` };
}

export const publicLookup: LookupFunction = (hostname, options, callback) =>
  lookupCallback(hostname, options, (error, address, family) => {
    const addresses = Array.isArray(address) ? address.map((entry) => entry.address) : [address];
    if (!error && addresses.some(isPrivateAddress)) return callback(new Error("blocked private address"), "", 0);
    callback(error, address as string, family);
  });

export const publicAgent = new Agent({ connect: { lookup: publicLookup } });
