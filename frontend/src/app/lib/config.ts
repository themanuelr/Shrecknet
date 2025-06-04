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
export const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/^http:/, "https:")
  : "";
