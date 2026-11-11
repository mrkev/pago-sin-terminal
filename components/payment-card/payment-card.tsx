import { cn } from "@/lib/utils";
import {
  TIPO_CUENTA_LABEL,
  cuentaBankName,
  formatCuenta,
  tipoCuenta,
} from "@/lib/cuenta";
import { DEFAULT_ESTILO, type Estilo } from "@/lib/estilos";

import { CopyButton } from "./copy-button";
import { cormorant } from "./fonts";
import "./estilos.css";

export type PaymentCardProps = {
  cuenta: string;
  titulo?: string;
  nombre?: string;
  /** Bank code; only used for cards (a CLABE encodes its bank). */
  banco?: string;
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
