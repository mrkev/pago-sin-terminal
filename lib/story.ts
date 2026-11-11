import { type PaymentLink, paymentPagePath } from "./payment-page";

/** Size of story images: Instagram/WhatsApp stories are 9:16. */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const STORY_FILENAME = "clabe-club-historia.png";

/** Story image for a saved page. */
export function savedStoryImagePath(slug: string): string {
  return `/api/historia?${new URLSearchParams({ slug })}`;
}

/** Story image for a free link: the same params as the link, plus `c`. */
export function linkStoryImagePath(link: PaymentLink): string {
  const query = paymentPagePath(link).split("?")[1];
  return `/api/historia?c=${link.cuenta}${query ? `&${query}` : ""}`;
}
