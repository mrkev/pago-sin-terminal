import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datos de pago",
};

export default function QRLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
