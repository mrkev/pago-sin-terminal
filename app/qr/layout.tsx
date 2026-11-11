import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalles de Pago",
};

export default function QRLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
