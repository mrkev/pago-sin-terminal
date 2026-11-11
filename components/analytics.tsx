"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

import { redactUrl } from "@/lib/analytics";

/** Vercel Web Analytics, with personal data removed from page URLs. */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) => ({ ...event, url: redactUrl(event.url) })}
    />
  );
}
