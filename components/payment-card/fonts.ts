import { Cormorant_Garamond } from "next/font/google";

/** Serif for the "elegante" style, exposed as --font-elegante. */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-elegante",
  display: "swap",
});
