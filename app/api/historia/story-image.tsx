import type { CSSProperties } from "react";

import type { Estilo } from "@/lib/estilos";

/** Everything a story image shows, already formatted. */
export type StoryData = {
  estilo: Estilo;
  titulo: string;
  nombre?: string;
  bank?: string;
  cuentaLabel: string;
  /** Formatted for reading, e.g. "0121 8000 …". */
  cuenta: string;
  /** Formatted, e.g. "55 1234 5678". */
  whatsapp?: string;
  socials: { network: string; handle: string }[];
  logoUrl?: string;
  fondoUrl?: string;
  qrDataUrl: string;
  /**
   * A short link people can type, without "https://". Only for saved pages;
   * free links are too long to show.
   */
  linkText?: string;
};

type Theme = {
  font: string;
  background: string;
  /** Header text when there's no photo behind it. */
  headerColor: string;
  title: CSSProperties;
  pill: CSSProperties;
  panel: CSSProperties;
  label: CSSProperties;
  value: CSSProperties;
  mono: CSSProperties;
  footerColor: string;
};

const THEMES: Record<Estilo, Theme> = {
  neutral: {
    font: "Inter",
    background: "#f5f5f5",
    headerColor: "#0a0a0a",
    title: { fontSize: 88, fontWeight: 700, lineHeight: 1.1 },
    pill: {
      fontSize: 34,
      color: "#525252",
      backgroundColor: "rgba(0,0,0,0.06)",
    },
    panel: {
      backgroundColor: "#ffffff",
      border: "2px solid #e5e5e5",
      borderRadius: 32,
      color: "#0a0a0a",
    },
    label: { fontSize: 32, color: "#737373" },
    value: { fontSize: 54, fontWeight: 700 },
    mono: { letterSpacing: 2 },
    footerColor: "#525252",
  },
  elegante: {
    font: "Cormorant Garamond",
    background: "radial-gradient(ellipse at 50% 0%, #5a4130 0%, #140f0c 65%)",
    headerColor: "#f5efe6",
    title: {
      fontSize: 120,
      fontWeight: 600,
      fontStyle: "italic",
      lineHeight: 1,
    },
    pill: {
      fontSize: 42,
      color: "#f5efe6",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    panel: {
      backgroundColor: "rgba(0,0,0,0.35)",
      borderRadius: 48,
      color: "#f5efe6",
    },
    label: { fontSize: 50, fontWeight: 700 },
    value: { fontSize: 58, fontWeight: 500 },
    mono: { letterSpacing: 2 },
    footerColor: "#f5efe6",
  },
  garage: {
    font: "Inter",
    background: "#000000",
    headerColor: "#f97316",
    title: {
      fontSize: 96,
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: 4,
      textTransform: "uppercase",
      color: "#f97316",
    },
    pill: { fontSize: 34, color: "#a1a1aa", backgroundColor: "transparent" },
    panel: {
      backgroundColor: "#18181b",
      border: "4px solid #f97316",
      borderRadius: 20,
      color: "#ffffff",
    },
    label: {
      fontSize: 28,
      fontWeight: 400,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: "#f97316",
    },
    value: { fontSize: 52, fontWeight: 800 },
    mono: { fontFamily: "JetBrains Mono", fontWeight: 700 },
    footerColor: "#f97316",
  },
};

/** A 1080×1920 story image of a payment page, for next/og. */
export function StoryImage({ data }: { data: StoryData }) {
  const theme = THEMES[data.estilo];
  const overPhoto = Boolean(data.fondoUrl);
  const headerColor = overPhoto ? "#ffffff" : theme.headerColor;

  const fields = [
    data.nombre && { label: "Nombre", value: data.nombre },
    data.bank && { label: "Banco", value: data.bank },
    { label: data.cuentaLabel, value: data.cuenta, mono: true },
  ].filter(Boolean) as { label: string; value: string; mono?: boolean }[];

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        fontFamily: theme.font,
        background: theme.background,
      }}
    >
      {data.fondoUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og */}
          <img
            src={data.fondoUrl}
            alt=""
            width={1080}
            height={1920}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1080,
              height: 1920,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: 1080,
              height: 1920,
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65))",
            }}
          />
        </>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          width: "100%",
          height: "100%",
          padding: "80px 90px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            flexShrink: 0,
          }}
        >
          {data.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- next/og
            <img
              src={data.logoUrl}
              alt=""
              height={130}
              style={{ maxWidth: 560, objectFit: "contain" }}
            />
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
              color: headerColor,
              ...theme.title,
              ...(overPhoto ? { color: "#ffffff" } : {}),
            }}
          >
            {data.titulo}
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 36px",
              borderRadius: 999,
              ...theme.pill,
              ...(overPhoto ? { color: "#ffffff" } : {}),
            }}
          >
            Transferencia bancaria
          </div>
        </div>

        {/* Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 40,
            width: "100%",
            flexShrink: 0,
            padding: "56px 72px",
            ...theme.panel,
          }}
        >
          {fields.map((field) => (
            <div
              key={field.label}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", ...theme.label }}>
                {field.label}
              </div>
              <div
                style={{
                  display: "flex",
                  ...theme.value,
                  ...(field.mono ? theme.mono : {}),
                }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {/* QR to the page, where the details can be copied */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
            color: overPhoto ? "#ffffff" : theme.footerColor,
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og */}
          <img
            src={data.qrDataUrl}
            alt=""
            width={340}
            height={340}
            style={{ borderRadius: 28 }}
          />
          <div style={{ display: "flex", fontSize: 36, marginTop: 8 }}>
            {data.linkText
              ? "Escanea o entra a"
              : "Escanea para copiar los datos"}
          </div>
          {data.linkText && (
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
              {data.linkText}
            </div>
          )}
          {data.whatsapp && (
            <div style={{ display: "flex", fontSize: 30 }}>
              Comprobante por WhatsApp: {data.whatsapp}
            </div>
          )}
          {data.socials.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 20,
                marginTop: 12,
                color: overPhoto ? "#ffffff" : theme.footerColor,
              }}
            >
              {data.socials.map((s) => (
                <div
                  key={s.network}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 28px",
                    borderRadius: 999,
                    border: "2px solid currentColor",
                    fontSize: 30,
                  }}
                >
                  <span style={{ opacity: 0.7 }}>{s.network}</span>
                  <span>@{s.handle}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
