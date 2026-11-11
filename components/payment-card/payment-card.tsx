import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TIPO_CUENTA_LABEL,
  cuentaBankName,
  formatCuenta,
  tipoCuenta,
} from "@/lib/cuenta";
import { DEFAULT_ESTILO, type Estilo } from "@/lib/estilos";
import { SOCIALS, SOCIAL_INFO, type Social } from "@/lib/socials";
import { comprobanteMessage, whatsappLink } from "@/lib/whatsapp";

import { CopyButton } from "./copy-button";
import { cormorant } from "./fonts";
import "./estilos.css";

export type PaymentCardProps = {
  cuenta: string;
  titulo?: string;
  nombre?: string;
  /** Bank code; only used for cards (a CLABE encodes its bank). */
  banco?: string;
  /** 10-digit number; adds a button to send the receipt over WhatsApp. */
  whatsapp?: string;
  /** Social handles (accounts only), shown as links under the details. */
  socials?: Partial<Record<Social, string>>;
  estilo?: Estilo;
  /** `page` fills the screen; `preview` is a framed box for the editor. */
  variant?: "page" | "preview";
};

/** The page a payer sees: what to transfer to, in the chosen style. */
export function PaymentCard({
  cuenta,
  titulo,
  nombre,
  banco,
  whatsapp,
  socials,
  estilo = DEFAULT_ESTILO,
  variant = "page",
}: PaymentCardProps) {
  const tipo = tipoCuenta(cuenta);
  const bank = cuentaBankName(cuenta, banco);

  return (
    <div
      data-estilo={estilo}
      className={cn("pc", `pc--${variant}`, cormorant.variable)}
    >
      <div className="pc-panel">
        <header className="pc-header">
          <h1 className="pc-title">{titulo || "Datos de pago"}</h1>
          <p className="pc-subtitle">Transferencia bancaria</p>
        </header>

        <section className="pc-fields">
          <h2 className="pc-section">Información bancaria</h2>
          {nombre && <Field label="Nombre" value={nombre} copyValue={nombre} />}
          {bank && <Field label="Banco" value={bank} />}
          <Field
            label={tipo ? TIPO_CUENTA_LABEL[tipo] : "CLABE o tarjeta"}
            value={formatCuenta(cuenta)}
            copyValue={cuenta}
            mono
          />
        </section>

        {whatsapp && (
          <a
            className="pc-action"
            href={whatsappLink(whatsapp, comprobanteMessage(titulo))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden />
            Enviar comprobante por WhatsApp
          </a>
        )}

        {socials && SOCIALS.some((s) => socials[s]) && (
          <nav className="pc-socials" aria-label="Redes sociales">
            {SOCIALS.filter((s) => socials[s]).map((s) => (
              <a
                key={s}
                className="pc-social"
                href={SOCIAL_INFO[s].url(socials[s]!)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="pc-social-network">
                  {SOCIAL_INFO[s].label}
                </span>
                <span>@{socials[s]}</span>
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  copyValue,
  mono = false,
}: {
  label: string;
  value: string;
  /** What the copy button copies; no button if omitted. */
  copyValue?: string;
  mono?: boolean;
}) {
  return (
    <div className="pc-field">
      <h3 className="pc-label">{label}</h3>
      <div className="pc-row">
        <div
          className={cn(
            "pc-value",
            mono && "pc-value--mono",
            !copyValue && "pc-value--solo",
          )}
        >
          {value}
        </div>
        {copyValue && <CopyButton value={copyValue} label={label} />}
      </div>
    </div>
  );
}
