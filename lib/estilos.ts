/** Visual presets for payment pages. The key is stored in links (`s=`). */
export const ESTILOS = ["neutral", "elegante", "garage"] as const;

export type Estilo = (typeof ESTILOS)[number];

export const DEFAULT_ESTILO: Estilo = "neutral";

export const ESTILO_INFO: Record<Estilo, { label: string; swatch: string }> = {
  neutral: {
    label: "Neutral",
    swatch: "linear-gradient(135deg, #fafafa 50%, #171717 50%)",
  },
  elegante: {
    label: "Elegante",
    swatch: "radial-gradient(circle at 50% 20%, #6b4a33, #1c1410 70%)",
  },
  garage: {
    label: "Garage",
    swatch: "linear-gradient(135deg, #000 55%, #f97316 55%)",
  },
};
