/**
 * Base URL for API requests.
 *
 * When `NEXT_PUBLIC_API_URL` is set it may include a protocol. If the site is
 * served over HTTPS but the variable uses HTTP the browser will block the
 * requests as mixed content. To avoid that we replace an `http` protocol with
 * `https`. When the variable is not defined we fallback to an empty string so
 * that fetch calls use relative URLs and automatically match the current
 * protocol and host.
 */
const envUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const isProd = process.env.NODE_ENV === "production";

let url = envUrl;

// When building for production, assume the site will run over HTTPS and
// upgrade the API URL if it explicitly uses HTTP.
if (isProd && url.startsWith("http://")) {
  url = url.replace(/^http:/, "https:");
}

// When running in the browser over HTTPS and the API URL uses HTTP,
// upgrade it to HTTPS to avoid mixed content errors.
if (typeof window !== "undefined" && url.startsWith("http://") && window.location.protocol === "https:") {
  url = url.replace(/^http:/, "https:");
}

export const API_URL = url;
