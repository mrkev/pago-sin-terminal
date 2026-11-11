"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the value is still selectable.
    }
  }

  return (
    <button
      type="button"
      className="pc-copy"
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      onClick={copy}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </button>
  );
}
