/**
 * Strips personal data from URLs before they're sent to analytics.
 *
 * Free payment links carry everything in the URL: the CLABE or card number
 * in the path, and the name, title and WhatsApp number in the query. Sign-in
 * links carry a one-time code. So: drop every query string and fragment,
 * and replace the account number. Short links (/<slug>) are public business
 * names and stay as they are.
 */
export function redactUrl(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/^\/c\/[^/]+/, "/c/[cuenta]");
  return parsed.toString();
}
